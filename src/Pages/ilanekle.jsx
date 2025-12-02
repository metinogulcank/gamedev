import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

function getSteamId64FromTradeUrl(url) {
  try {
    const urlObj = new URL(url);
    const partner = urlObj.searchParams.get('partner');
    if (!partner) return null;
    // SteamID64 = partner + 76561197960265728
    return (BigInt(partner) + BigInt('76561197960265728')).toString();
  } catch {
    return null;
  }
}

// Inspect link içindeki eksik owner/asset placeholderlarını tamamlar
function normalizeInspectLink(link, ownerSteamId, assetId) {
  if (!link) return link;
  let out = link;
  if (ownerSteamId) {
    out = out.replace('%owner_steamid%', ownerSteamId);
    // Bazı durumlarda S ile A arası boş: "%20SA<assetid>" → owner enjekte et
    if (out.includes('%20SA')) out = out.replace('%20SA', `%20S${ownerSteamId}A`);
    if (out.includes(' SA')) out = out.replace(' SA', ` S${ownerSteamId}A`);
  }
  if (assetId) {
    out = out.replace('%assetid%', assetId);
  }
  return out;
}

// GÜNCELLENDİ: Proxy üzerinden fetch
async function fetchSteamInventory(steamid64) {
  const url = `https://gamedev.mymedya.tr/api/steam_inventory_proxy.php?steamid=${steamid64}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Envanter alınamadı');
  return res.json();
}

const IlanEkle = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemPrice, setItemPrice] = useState('');
  const [floatValue, setFloatValue] = useState(null);
  const [floatLoading, setFloatLoading] = useState(false);
  const [floatError, setFloatError] = useState('');

  // Kullanıcı bilgisini server'dan çek (trade_url'i güncel almak için)
  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch('https://gamedev.mymedya.tr/api/get_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Kayıtlı trade_url ile envanteri otomatik getir
  React.useEffect(() => {
    const run = async () => {
    setError('');
    setInventory(null);
      setShowInventory(false);
      if (!currentUser || !currentUser.trade_url) {
        setError('Profilinizde kayıtlı trade URL bulunamadı. Lütfen Profil sayfasından ekleyin.');
        return;
      }
      const steamid64 = getSteamId64FromTradeUrl(currentUser.trade_url);
    if (!steamid64) {
        setError('Geçersiz trade URL formatı');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSteamInventory(steamid64);
        if (data.error) {
          setError(`Steam hatası: ${data.error}`);
          setShowInventory(false);
          return;
        }
      setInventory(data);
        setShowInventory(true);
    } catch (e) {
        setError(`Envanter alınamadı: ${e.message}`);
        setShowInventory(false);
    }
    setLoading(false);
  };
    if (currentUser && currentUser.trade_url) {
      run();
    }
  }, [currentUser?.trade_url]);

  // Seçili item değişince float çek
  React.useEffect(() => {
    setFloatValue(null);
    setFloatError('');
    if (selectedItem && selectedItem.inspect_link) {
      const ownerFromItem = selectedItem.owner_steamid || '';
      const ownerFromTrade = currentUser?.trade_url ? getSteamId64FromTradeUrl(currentUser.trade_url) : '';
      const owner = ownerFromItem || ownerFromTrade || '';
      const normalizedInspect = normalizeInspectLink(selectedItem.inspect_link, owner, selectedItem.assetid);
      try {
        console.groupCollapsed('Seçilen item');
        console.log({
          name: selectedItem.name,
          type: selectedItem.type,
          assetid: selectedItem.assetid,
          owner_steamid: selectedItem.owner_steamid,
          inspect_link: selectedItem.inspect_link,
          normalized_inspect_link: normalizedInspect,
        });
        console.groupEnd();
      } catch (_) {}
      setFloatLoading(true);
      // 1) CSInventoryAPI (server proxy) → 2) CSFloat → 3) csgofloat
      fetch(`https://gamedev.mymedya.tr/api/float_proxy.php?csinv_inspect=1&url=${encodeURIComponent(normalizedInspect)}`)
        .then(res => res.json())
        .then(data => {
          // csinventory/inspect muhtemel yanıtları (csgofloat ile benzer)
          if (data && data.iteminfo && typeof data.iteminfo.floatvalue === 'number') {
            setFloatValue(data.iteminfo.floatvalue);
            return;
          }
          // csfloat inspect muhtemel yanıtları
          return fetch(`https://gamedev.mymedya.tr/api/float_proxy.php?csfloat_inspect=1&url=${encodeURIComponent(normalizedInspect)}`)
            .then(r => r.json())
            .then(d2 => {
              if (d2 && typeof d2.floatvalue === 'number') {
                setFloatValue(d2.floatvalue);
                return;
              }
              if (d2 && d2.item && typeof d2.item.wear === 'number') {
                setFloatValue(d2.item.wear);
                return;
              }
              if (d2 && d2.iteminfo && typeof d2.iteminfo.floatvalue === 'number') {
                setFloatValue(d2.iteminfo.floatvalue);
                return;
              }
              // 3) csgofloat
              return fetch(`https://gamedev.mymedya.tr/api/float_proxy.php?inspect_link=${encodeURIComponent(normalizedInspect)}`)
                .then(r2 => r2.json())
                .then(d3 => {
                  if (d3 && d3.iteminfo && typeof d3.iteminfo.floatvalue === 'number') {
                    setFloatValue(d3.iteminfo.floatvalue);
                  } else {
                    setFloatError('Float değeri alınamadı');
                  }
                });
            });
        })
        .catch(() => setFloatError('Float değeri alınamadı'))
        .finally(() => setFloatLoading(false));
    } else {
      setFloatLoading(false);
    }
  }, [selectedItem]);

  // Envanter geldiğinde inspect linkleri konsola yaz
  React.useEffect(() => {
    if (!inventory || !inventory.items) return;
    try {
      const items = Object.values(inventory.items);
      console.groupCollapsed(`Envanter (${items.length} item)`);
      items.forEach((item, idx) => {
        console.log(`#${idx + 1}`, {
          name: item.name,
          type: item.type,
          assetid: item.assetid,
          owner_steamid: item.owner_steamid,
          inspect_link: item.inspect_link,
        });
      });
      console.groupEnd();
    } catch (e) {
      console.warn('Envanter loglama hatası', e);
    }
  }, [inventory]);

  // Butonsuz akışta handleGetInventory gerekmediği için kaldırıldı

  return (
    <div>
      {/* NavBarOverlay */}
      <div className="NavBarOverlay"></div>

      {/* HeaderProfil */}
      <Topbar />

      {/* ProfilPageArea */}
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5>İLAN EKLE</h5>
                <header className="tabs-nav1">
                  <ul>
                    <li className="activex">
                      <a href="#Csgo">
                        <h4>CS2 İLAN EKLE</h4>
                      </a>
                    </li>
                    <li>
                      <a href="#KO">
                        <h4>KNIGHT ONLINE İLAN EKLE</h4>
                      </a>
                    </li>
                  </ul>
                </header>
                <section className="tabs-content1">
                  <div id="Csgo">
                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardContent">
                          {/* Form kaldırıldı; envanter kayıtlı trade_url ile otomatik yüklenir */}
                          {loading && <div>Yükleniyor...</div>}
                          {error && <div style={{color:'red'}}>{error}</div>}
                          {showInventory && inventory && (
                            <>
                              <style>{`
                                .inventory-flex {
                                  display: flex;
                                  gap: 24px;
                                  align-items: flex-start;
                                  width: 100%;
                                  max-width: 1000px;
                                  margin: 0 auto;
                                }
                                .inventory-panel {
                                  width: 100%;
                                  background: #181c24;
                                  border-radius: 12px;
                                  box-shadow: 0 4px 24px #0002;
                                  padding: 12px;
                                  max-height: 70vh;
                                  overflow-y: auto;
                                  animation: fadeIn 0.5s;
                                  position: relative;
                                  z-index: 100;
                                }
                                .inventory-grid {
                                  display: grid !important;
                                  grid-template-columns: repeat(4, 1fr) !important;
                                  gap: 10px !important;
                                  background: #181c24;
                                  padding: 0;
                                  margin: 0;
                                }
                                .inventory-item {
                                  background: #23272e;
                                  border-radius: 8px;
                                  border: 2px solid #23272e;
                                  box-shadow: 0 2px 8px #0002;
                                  padding: 4px 2px 2px 2px;
                                  display: flex;
                                  flex-direction: column;
                                  align-items: center;
                                  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                                  cursor: pointer;
                                  min-height: 70px;
                                  min-width: 0;
                                  position: relative;
                                  aspect-ratio: 1 / 1;
                                  justify-content: center;
                                  font-size: 11px;
                                  border: 2px solid #23272e;
                                }
                                .inventory-item.selected {
                                  border-color: #66c0f4;
                                  background: #202a36;
                                  box-shadow: 0 4px 16px #66c0f455;
                                }
                                .inventory-item:hover {
                                  border-color: #66c0f4;
                                  background: #202a36;
                                  box-shadow: 0 4px 16px #66c0f455;
                                }
                                .inventory-item img {
                                  width: 100px;
                                  height: 100px;
                                  margin-right: 0;
                                  object-fit: contain;
                                  margin-bottom: 2px;
                                  background: #111;
                                  border-radius: 4px;
                                  border: 1px solid #222;
                                }
                                .inventory-item .item-name {
                                  font-size: 12px;
                                  font-weight: bold;
                                  color: #fff;
                                  text-align: center;
                                  margin-bottom: 1px;
                                  word-break: break-word;
                                  line-height: 1.1;
                                }
                                .inventory-item .item-type {
                                  font-size: 10px;
                                  color: #aaa;
                                  text-align: center;
                                  word-break: break-word;
                                  line-height: 1.1;
                                }
                                .item-detail-panel {
                                  width: 48%;
                                  min-width: 220px;
                                  max-width: 350px;
                                  background: #202a36;
                                  border-radius: 12px;
                                  box-shadow: 0 4px 24px #0002;
                                  padding: 24px 18px 18px 18px;
                                  color: #fff;
                                  display: flex;
                                  flex-direction: column;
                                  align-items: center;
                                  gap: 10px;
                                  position: relative;
                                }
                                .item-detail-panel img {
                                  width: 80px;
                                  height: 80px;
                                  object-fit: contain;
                                  background: #111;
                                  border-radius: 6px;
                                  border: 1px solid #222;
                                  margin-bottom: 8px;
                                }
                                .item-detail-panel .item-name {
                                  font-size: 15px;
                                  font-weight: bold;
                                  color: #fff;
                                  text-align: center;
                                  margin-bottom: 2px;
                                  word-break: break-word;
                                }
                                .item-detail-panel .item-type {
                                  font-size: 12px;
                                  color: #aaa;
                                  text-align: center;
                                  margin-bottom: 8px;
                                  word-break: break-word;
                                }
                                .item-detail-panel input[type='number'] {
                                  width: 100%;
                                  padding: 8px;
                                  border-radius: 6px;
                                  border: 1px solid #444;
                                  background: #23272e;
                                  color: #fff;
                                  font-size: 15px;
                                  margin-bottom: 8px;
                                  outline: none;
                                }
                                .item-detail-panel .komisyon {
                                  font-size: 13px;
                                  color: #66c0f4;
                                  margin-bottom: 2px;
                                }
                                .item-detail-panel .net-tutar {
                                  font-size: 15px;
                                  color: #baffb6;
                                  font-weight: bold;
                                }
                              `}</style>
                              <div className="inventory-flex">
                                <div className="inventory-panel">
                                  <h4 style={{marginTop:0}}>Envanter</h4>
                                  {inventory.error ? (
                                    <div style={{color:'red',background:'#f8d7da',padding:10,borderRadius:5}}>
                                      <strong>Hata:</strong> {inventory.error}
                                      {inventory.details && <div><strong>Detaylar:</strong> {inventory.details}</div>}
                                      {inventory.http_code && <div><strong>HTTP Kodu:</strong> {inventory.http_code}</div>}
                                    </div>
                                  ) : inventory.items ? (
                                    <ul className="inventory-grid">
                                      {Object.values(inventory.items).map((item, idx) => (
                                        <li key={idx} className={"inventory-item" + (selectedItem === item ? " selected" : "")}
                                            onClick={() => { 
                                              try { console.log('Item seçildi', { name: item.name, assetid: item.assetid, inspect_link: item.inspect_link }); } catch(_) {}
                                              setSelectedItem(item); 
                                              setItemPrice(''); 
                                            }}>
                                          {item.image && (
                                            <img src={`https://steamcommunity-a.akamaihd.net/economy/image/${item.image}`} alt={item.name} />
                                          )}
                                          <div className="item-name">{item.name}</div>
                                          <div className="item-type">{item.type}</div>
                                  </li>
                                ))}
                              </ul>
                                  ) : (
                                    <div style={{color:'orange',background:'#fff3cd',padding:10,borderRadius:5}}>
                                      <strong>Uyarı:</strong> Envanter boş veya erişilemiyor
                                      <pre style={{marginTop:10,fontSize:'12px'}}>{JSON.stringify(inventory, null, 2)}</pre>
                                    </div>
                                  )}
                                </div>
                                <div className="item-detail-panel">
                                  {selectedItem ? (
                                    <>
                                      {selectedItem.image && (
                                        <img src={`https://steamcommunity-a.akamaihd.net/economy/image/${selectedItem.image}`} alt={selectedItem.name} />
                                      )}
                                      <div className="item-name">{selectedItem.name}</div>
                                      <div className="item-type">{selectedItem.type}</div>
                                      {/* Float değeri */}
                                      {selectedItem.inspect_link && (
                                        <div style={{marginBottom: 6, width: '100%'}}>
                                          {floatLoading ? (
                                            <span style={{color:'#66c0f4'}}>Float: Yükleniyor...</span>
                                          ) : floatError ? (
                                            <span style={{color:'orange', fontSize:'13px'}}>Float değeri otomatik olarak alınamıyor. Lütfen itemi Steam'de inceleyerek float değerini kontrol edin.</span>
                                          ) : floatValue !== null ? (
                                            <span style={{color:'#baffb6', fontWeight:'bold'}}>Float: {floatValue.toFixed(5)}</span>
                                          ) : null}
                                        </div>
                                      )}
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Fiyat (₺)"
                                        value={itemPrice}
                                        onChange={e => setItemPrice(e.target.value.replace(',', '.'))}
                                      />
                                      <div className="komisyon">Komisyon (%7.5): {(itemPrice && !isNaN(itemPrice)) ? (parseFloat(itemPrice) * 0.075).toFixed(2) + ' ₺' : '0 ₺'}</div>
                                      <div className="net-tutar">Hesabınıza Geçecek Tutar: {(itemPrice && !isNaN(itemPrice)) ? (parseFloat(itemPrice) * 0.925).toFixed(2) + ' ₺' : '0 ₺'}</div>
                                      <button
                                        className="BtnCekimYap"
                                        style={{marginTop: '16px', width: '100%', fontSize: '16px'}}
                                        onClick={async () => {
                                          // Kullanıcı bilgisini localStorage'dan al
                                          const stored = localStorage.getItem('user');
                                          if (!stored) {
                                            alert('İlan eklemek için giriş yapmalısınız!');
                                            return;
                                          }
                                          const user = JSON.parse(stored);
                                          if (!user.id) {
                                            alert('Kullanıcı ID bulunamadı!');
                                            return;
                                          }
                                          if (!selectedItem || !itemPrice) {
                                            alert('Lütfen bir item seçin ve fiyat girin!');
                                            return;
                                          }
                                          try {
                                            const res = await fetch('https://gamedev.mymedya.tr/api/ilan_ekle.php', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                user_id: user.id,
                                                item_name: selectedItem.name,
                                                price: itemPrice,
                                                image: selectedItem.image // yeni eklendi
                                              })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              alert('İlan başarıyla eklendi!');
                                              setSelectedItem(null);
                                              setItemPrice('');
                                            } else {
                                              alert(data.message || 'İlan eklenemedi!');
                                            }
                                          } catch (err) {
                                            alert('Sunucuya ulaşılamadı!');
                                          }
                                        }}
                                      >
                                        EKLE
                                      </button>
                                    </>
                                  ) : (
                                    <div style={{color:'#aaa',textAlign:'center',marginTop:40}}>Bir item seçin</div>
                                  )}
                                </div>
                            </div>
                            </>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div id="KO">
                    <ul className="CardBlokFull" style={{display:'none'}}>
                      <li>
                        <div className="CardContent">
                          <table className="streamapptable">
                            <tbody>
                              <tr>
                                <td>İlan Tipi</td>
                                <td>
                                  <select id="ilantipi" name="ilantipi" className="streamappinput">
                                    <option value="Knight Online Item">Knight Online Item</option>
                                    <option value="Knight Online Cypher Ring">Knight Online Cypher Ring</option>
                                  </select>
                                </td>
                              </tr>
                              <tr>
                                <td>Server</td>
                                <td>
                                  <select id="KOserver" name="ilantipi" className="streamappinput">
                                    <option value="Altar">Altar</option>
                                    <option value="Ares">Ares</option>
                                    <option value="Cypher (Steam)">Cypher (Steam)</option>
                                    <option value="Destan">Destan</option>
                                    <option value="Diez">Diez</option>
                                    <option value="Gordion">Gordion</option>
                                    <option value="Olympia">Olympia</option>
                                    <option value="Pathos (Steam)">Pathos (Steam)</option>
                                    <option value="Rosetta">Rosetta</option>
                                    <option value="Sirius">Sirius</option>
                                    <option value="Vega">Vega</option>
                                  </select>
                                </td>
                              </tr>
                              <tr>
                                <td>Item</td>
                                <td>
                                  <select id="item" name="ilantipi" className="streamappinput">
                                    <option value="Item Seçiniz">Item Seçiniz</option>
                                    <option value="672">Adaga</option>
                                    <option value="6">Agate Earring</option>
                                    <option value="228">Agate Ring</option>
                                    <option value="7">Amulet of Curse</option>
                                    <option value="8">Amulet of Dexterity</option>
                                    <option value="9">Amulet of Goddess</option>
                                    <option value="247">Amulet of Health</option>
                                    <option value="248">Amulet of Intelligence</option>
                                    <option value="10">Amulet of Strength</option>
                                    <option value="354">Ararat's belt</option>
                                    <option value="353">Ararat's pendant</option>
                                    <option value="355">Ararat's ring</option>
                                    <option value="295">Avedon</option>
                                    <option value="437">Azagai</option>
                                    <option value="202">Aztec Gold Faun</option>
                                    <option value="196">Aztec Gold Fulitol</option>
                                    <option value="199">Aztec Gold Molok</option>
                                    <option value="238">Belt of Curse</option>
                                    <option value="11">Belt of Dexterity</option>
                                    <option value="12">Belt of Intelligence</option>
                                    <option value="239">Belt of Life</option>
                                    <option value="13">Belt of Strength</option>
                                    <option value="14">Black Dragon Necklace</option>
                                    <option value="15">Blade Axe</option>
                                    <option value="448">Blood finger</option>
                                    <option value="16">Blue Dragon Necklace</option>
                                    <option value="558">Bone Cleaver</option>
                                    <option value="563">Bone Crasher</option>
                                    <option value="250">Book of wisdom (Air)</option>
                                    <option value="251">Book of wisdom (Appeal)</option>
                                    <option value="221">Book of wisdom (Fire)</option>
                                    <option value="326">Boots of Trial</option>
                                    <option value="336">Bow of Noah GameSatış</option>
                                    <option value="241">Bronze Belt</option>
                                    <option value="17">Bronze Earring</option>
                                    <option value="438">Buju</option>
                                    {/* ... (diğer itemler için aynı şekilde devam edebilir) ... */}
                                  </select>
                                </td>
                              </tr>
                              <tr>
                                <td>Artı Kaç?</td>
                                <td>
                                  <select id="ArtiKac" name="ilantipi" className="streamappinput">
                                    <option value="">+0</option>
                                    <option value="">+1</option>
                                    <option value="">+2</option>
                                    <option value="">+3</option>
                                    <option value="">+4</option>
                                    <option value="">+5</option>
                                    <option value="">+6</option>
                                    <option value="">+7</option>
                                    <option value="">+8</option>
                                    <option value="">+9</option>
                                    <option value="">+10</option>
                                    <option value="">+11</option>
                                    <option value="">+12</option>
                                    <option value="">+13</option>
                                    <option value="">+14</option>
                                    <option value="">+15</option>
                                    <option value="">+16</option>
                                    <option value="">+17</option>
                                    <option value="">+18</option>
                                    <option value="">+19</option>
                                    <option value="">+20</option>
                                    <option value="">+21</option>
                                  </select>
                                </td>
                              </tr>
                              <tr>
                                <td>Fiyat</td>
                                <td>
                                  <input type="text" className="ilanekleinput" />
                                </td>
                              </tr>
                              <tr>
                                <td>Hesabınıza Geçecek Tutar</td>
                                <td>
                                  <input type="text" className="ilanekleinput" />
                                </td>
                              </tr>
                              <tr>
                                <td>Açıklama</td>
                                <td>
                                  <textarea name="text" cols="40" rows="5" className="ilanekleinputArea" maxLength={250} placeholder="Maks. 250 karakter"></textarea>
                                </td>
                              </tr>
                              <tr>
                                <td></td>
                                <td><a href="/ilanlar.html" className="BtnCekimYap">SATIŞA ÇIKART</a></td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
      <style>{`
.inventory-panel { display: block !important; }
`}</style>
    </div>
  );
};

export default IlanEkle; 