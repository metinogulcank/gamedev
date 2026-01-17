import React, { useState } from 'react';
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
  const url = `https://elephunt.com/api/steam_inventory_proxy.php?steamid=${steamid64}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Envanter alınamadı');
  return res.json();
}

const TakasEkle = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [wantedItem, setWantedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wantedSearchTerm, setWantedSearchTerm] = useState('');
  const [description, setDescription] = useState('');
  const [overpay, setOverpay] = useState('no');
  const [wear, setWear] = useState('any'); // Aşınma seçimi için
  const [submitLoading, setSubmitLoading] = useState(false);

  // CS2'deki tüm silahlar (sabit liste)
  const CS2_WEAPONS = [
    {
      id: 1,
      name: "AK-47 | Redline",
      type: "Rifle",
      image: "1.png",
      rarity: "Classified",
      price: 150.00
    },
    {
      id: 2,
      name: "M4A4 | Desolate Space",
      type: "Rifle", 
      image: "2.png",
      rarity: "Covert",
      price: 450.00
    },
    {
      id: 3,
      name: "AWP | Dragon Lore",
      type: "Sniper Rifle",
      image: "3.png", 
      rarity: "Contraband",
      price: 25000.00
    },
    {
      id: 4,
      name: "Desert Eagle | Golden Koi",
      type: "Pistol",
      image: "4.png",
      rarity: "Classified", 
      price: 180.00
    },
    {
      id: 5,
      name: "Glock-18 | Fade",
      type: "Pistol",
      image: "5.png",
      rarity: "Covert",
      price: 1200.00
    },
    {
      id: 6,
      name: "USP-S | Kill Confirmed",
      type: "Pistol", 
      image: "6.png",
      rarity: "Classified",
      price: 85.00
    },
    {
      id: 7,
      name: "M4A1-S | Hyper Beast",
      type: "Rifle",
      image: "7.png", 
      rarity: "Classified",
      price: 95.00
    },
    {
      id: 8,
      name: "Karambit | Fade",
      type: "Knife",
      image: "8.png",
      rarity: "Covert", 
      price: 3500.00
    },
    {
      id: 9,
      name: "Butterfly Knife | Crimson Web",
      type: "Knife",
      image: "bfk1.png",
      rarity: "Covert",
      price: 2800.00
    },
    {
      id: 10,
      name: "M9 Bayonet | Doppler",
      type: "Knife",
      image: "bfk2.png",
      rarity: "Covert",
      price: 2200.00
    },
    {
      id: 11,
      name: "AK-47 | Fire Serpent",
      type: "Rifle",
      image: "bfk3.png",
      rarity: "Covert",
      price: 1800.00
    },
    {
      id: 12,
      name: "M4A4 | Howl",
      type: "Rifle",
      image: "bfk4.png",
      rarity: "Contraband",
      price: 12000.00
    },
    {
      id: 13,
      name: "AWP | Medusa",
      type: "Sniper Rifle",
      image: "bfk5.png",
      rarity: "Covert",
      price: 8000.00
    },
    {
      id: 14,
      name: "Desert Eagle | Blaze",
      type: "Pistol",
      image: "bfk6.png",
      rarity: "Covert",
      price: 2500.00
    },
    {
      id: 15,
      name: "Glock-18 | Fade",
      type: "Pistol",
      image: "1.png",
      rarity: "Covert",
      price: 1200.00
    }
  ];

  // Kullanıcı bilgisini server'dan çek (trade_url'i güncel almak için)
  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch('https://elephunt.com/api/get_user.php', {
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

  // Search filtresi
  const filteredItems = inventory && inventory.items ? 
    Object.values(inventory.items).filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

  // Wanted items filtresi (CS2 silahları listesinden)
  const filteredWantedItems = CS2_WEAPONS.filter(weapon =>
    weapon.name.toLowerCase().includes(wantedSearchTerm.toLowerCase()) ||
    weapon.type.toLowerCase().includes(wantedSearchTerm.toLowerCase()) ||
    weapon.rarity.toLowerCase().includes(wantedSearchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedItem) {
      alert('Lütfen envanterinizden takas edeceğiniz itemı seçin!');
      return;
    }

    if (!wantedItem) {
      alert('Lütfen takas etmek istediğiniz itemı seçin!');
      return;
    }

    if (!description.trim()) {
      alert('Lütfen açıklama girin!');
      return;
    }

    // Kullanıcı bilgisini localStorage'dan al
    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('Takas ilanı eklemek için giriş yapmalısınız!');
      return;
    }

    const user = JSON.parse(stored);
    if (!user.id) {
      alert('Kullanıcı ID bulunamadı!');
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await fetch('https://elephunt.com/api/takas_ekle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          item_name: selectedItem.name,
          item_type: selectedItem.type || 'Unknown',
          item_rarity: selectedItem.rarity || 'Unknown',
          item_price: 0, // Takas ilanlarında fiyat 0 olarak kaydedilir
          image: selectedItem.image,
          wanted_item: wantedItem.name,
          description: description,
          overpay: overpay,
          wear: wear // Aşınma durumu eklendi
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Takas ilanı başarıyla eklendi!');
        setSelectedItem(null);
        setWantedItem(null);
        setDescription('');
        setOverpay('no');
        setWear('any');
      } else {
        alert(data.message || 'Takas ilanı eklenemedi!');
      }
    } catch (err) {
      alert('Sunucuya ulaşılamadı!');
    } finally {
      setSubmitLoading(false);
    }
  };

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
                <h5>TAKAS İLANI EKLE</h5>
                <section className="tabs-content1">
                  <div id="Csgo">
                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardContent">
                          <style>{`
                                                         .takas-container {
                               display: flex;
                               gap: 24px;
                               align-items: flex-start;
                               width: 100%;
                               max-width: 1200px;
                               margin: 0 auto;
                             }
                             .inventories-container {
                               display: flex;
                               flex-direction: column;
                               gap: 24px;
                               width: 70%;
                             }
                                                         .weapons-panel {
                               width: 100%;
                               background: #181c24;
                               border-radius: 12px;
                               box-shadow: 0 4px 24px #0002;
                               padding: 20px;
                               max-height: 50vh;
                               overflow-y: auto;
                             }
                            .search-container {
                              margin-bottom: 20px;
                            }
                            .search-input {
                              width: 100%;
                              padding: 12px;
                              border-radius: 8px;
                              border: 1px solid #444;
                              background: #23272e;
                              color: #fff;
                              font-size: 14px;
                              outline: none;
                            }
                            .search-input:focus {
                              border-color: #66c0f4;
                            }
                            .weapons-grid {
                              display: grid;
                              grid-template-columns: repeat(3, 1fr);
                              gap: 15px;
                            }
                            .weapon-item {
                              background: #23272e;
                              border-radius: 8px;
                              border: 2px solid #23272e;
                              padding: 12px;
                              cursor: pointer;
                              transition: all 0.2s;
                              text-align: center;
                            }
                            .weapon-item:hover {
                              border-color: #66c0f4;
                              background: #202a36;
                            }
                            .weapon-item.selected {
                              border-color: #66c0f4;
                              background: #202a36;
                              box-shadow: 0 4px 16px #66c0f455;
                            }
                            .weapon-item img {
                              width: 80px;
                              height: 80px;
                              object-fit: contain;
                              margin-bottom: 8px;
                              background: #111;
                              border-radius: 4px;
                              border: 1px solid #222;
                            }
                            .weapon-name {
                              font-size: 12px;
                              font-weight: bold;
                              color: #fff;
                              margin-bottom: 4px;
                              word-break: break-word;
                            }
                            .weapon-type {
                              font-size: 10px;
                              color: #aaa;
                              margin-bottom: 4px;
                            }
                            .weapon-rarity {
                              font-size: 10px;
                              color: #66c0f4;
                              font-weight: bold;
                            }
                            .weapon-price {
                              font-size: 11px;
                              color: #baffb6;
                              font-weight: bold;
                              margin-top: 4px;
                            }
                                                         .form-panel {
                               width: 30%;
                               background: #202a36;
                               border-radius: 12px;
                               box-shadow: 0 4px 24px #0002;
                               padding: 24px;
                               color: #fff;
                               position: sticky;
                               top: 20px;
                               height: fit-content;
                             }
                            .form-group {
                              margin-bottom: 20px;
                            }
                            .form-label {
                              display: block;
                              margin-bottom: 8px;
                              font-weight: bold;
                              color: #fff;
                            }
                            .form-input, .form-textarea, .form-select {
                              width: 100%;
                              padding: 12px;
                              border-radius: 8px;
                              border: 1px solid #444;
                              background: #23272e;
                              color: #fff;
                              font-size: 14px;
                              outline: none;
                            }
                            .form-input:focus, .form-textarea:focus, .form-select:focus {
                              border-color: #66c0f4;
                            }
                            .form-textarea {
                              resize: vertical;
                              min-height: 100px;
                            }
                            .radio-group {
                              display: flex;
                              gap: 20px;
                            }
                            .radio-item {
                              display: flex;
                              align-items: center;
                              gap: 8px;
                            }
                            .radio-item input[type="radio"] {
                              margin: 0;
                            }
                            .submit-btn {
                              width: 100%;
                              padding: 14px;
                              background: #66c0f4;
                              color: #fff;
                              border: none;
                              border-radius: 8px;
                              font-size: 16px;
                              font-weight: bold;
                              cursor: pointer;
                              transition: background 0.2s;
                            }
                            .submit-btn:hover {
                              background: #5aafd8;
                            }
                            .submit-btn:disabled {
                              background: #666;
                              cursor: not-allowed;
                            }
                            .no-weapons {
                              text-align: center;
                              color: #aaa;
                              padding: 40px;
                            }
                          `}</style>
                          
                                                     {loading && <div>Yükleniyor...</div>}
                           {error && <div style={{color:'red'}}>{error}</div>}
                           {showInventory && inventory && (
                             <div className="takas-container">
                               <div className="inventories-container">
                                 <div className="weapons-panel">
                                   <h4 style={{marginTop: 0, marginBottom: 20}}>Envanterinizden Takas Edeceğiniz Item</h4>
                                   
                                   <div className="search-container">
                                     <input
                                       type="text"
                                       className="search-input"
                                       placeholder="Item ara... (isim, tip)"
                                       value={searchTerm}
                                       onChange={(e) => setSearchTerm(e.target.value)}
                                     />
                                   </div>

                                   {inventory.error ? (
                                     <div style={{color:'red',background:'#f8d7da',padding:10,borderRadius:5}}>
                                       <strong>Hata:</strong> {inventory.error}
                                       {inventory.details && <div><strong>Detaylar:</strong> {inventory.details}</div>}
                                       {inventory.http_code && <div><strong>HTTP Kodu:</strong> {inventory.http_code}</div>}
                                     </div>
                                   ) : inventory.items ? (
                                     <>
                                       {filteredItems.length === 0 ? (
                                         <div className="no-weapons">
                                           Arama kriterlerinize uygun item bulunamadı.
                                         </div>
                                       ) : (
                                         <div className="weapons-grid">
                                           {filteredItems.map((item, idx) => (
                                             <div
                                               key={idx}
                                               className={`weapon-item ${selectedItem === item ? 'selected' : ''}`}
                                               onClick={() => { 
                                                 setSelectedItem(item); 
                                                 setDescription(''); 
                                               }}
                                             >
                                               {item.image && (
                                                 <img
                                                   src={`https://steamcommunity-a.akamaihd.net/economy/image/${item.image}`}
                                                   alt={item.name}
                                                 />
                                               )}
                                               <div className="weapon-name">{item.name}</div>
                                               <div className="weapon-type">{item.type || 'Unknown'}</div>
                                             </div>
                                           ))}
                                         </div>
                                       )}
                                     </>
                                   ) : (
                                     <div style={{color:'orange',background:'#fff3cd',padding:10,borderRadius:5}}>
                                       <strong>Uyarı:</strong> Envanter boş veya erişilemiyor
                                     </div>
                                   )}
                                 </div>

                                 <div className="weapons-panel">
                                   <h4 style={{marginTop: 0, marginBottom: 20}}>Takas Etmek İstediğiniz Item (CS2 Silahları)</h4>
                                   
                                   <div className="search-container">
                                     <input
                                       type="text"
                                       className="search-input"
                                       placeholder="Silah ara... (isim, tip, nadirlik)"
                                       value={wantedSearchTerm}
                                       onChange={(e) => setWantedSearchTerm(e.target.value)}
                                     />
                                   </div>

                                   {filteredWantedItems.length === 0 ? (
                                     <div className="no-weapons">
                                       Arama kriterlerinize uygun silah bulunamadı.
                                     </div>
                                   ) : (
                                                                              <div className="weapons-grid">
                                           {filteredWantedItems.map((weapon) => (
                                             <div
                                               key={weapon.id}
                                               className={`weapon-item ${wantedItem?.id === weapon.id ? 'selected' : ''}`}
                                               onClick={() => {
                                                 setWantedItem(weapon);
                                                 setDescription('');
                                               }}
                                             >
                                               <img
                                                 src={`/images/Test/${weapon.image}`}
                                                 alt={weapon.name}
                                               />
                                               <div className="weapon-name">{weapon.name}</div>
                                               <div className="weapon-type">{weapon.type}</div>
                                             </div>
                                           ))}
                                         </div>
                                   )}
                                 </div>
                               </div>

                            <div className="form-panel">
                              <h4 style={{marginTop: 0, marginBottom: 20}}>Takas Detayları</h4>
                              
                              {selectedItem ? (
                                <>
                                                                     <div className="form-group">
                                     <label className="form-label">Envanterinizden Takas Edeceğiniz Item:</label>
                                     {selectedItem ? (
                                       <div style={{padding: '12px', background: '#23272e', borderRadius: '8px', border: '1px solid #444'}}>
                                         <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                           {selectedItem.image && (
                                             <img
                                               src={`https://steamcommunity-a.akamaihd.net/economy/image/${selectedItem.image}`}
                                               alt={selectedItem.name}
                                               style={{width: '50px', height: '50px', objectFit: 'contain'}}
                                             />
                                           )}
                                           <div>
                                             <div style={{fontWeight: 'bold', color: '#fff'}}>{selectedItem.name}</div>
                                             <div style={{fontSize: '12px', color: '#aaa'}}>{selectedItem.type || 'Unknown'}</div>
                                           </div>
                                         </div>
                                       </div>
                                     ) : (
                                       <div style={{padding: '12px', background: '#23272e', borderRadius: '8px', border: '1px solid #444', color: '#aaa', textAlign: 'center'}}>
                                         Envanterinizden takas edeceğiniz itemı seçin
                                       </div>
                                     )}
                                   </div>

                                   <div className="form-group">
                                     <label className="form-label">Takas Etmek İstediğiniz Item:</label>
                                     {wantedItem ? (
                                       <div style={{padding: '12px', background: '#23272e', borderRadius: '8px', border: '1px solid #444'}}>
                                         <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                           <img
                                             src={`/images/Test/${wantedItem.image}`}
                                             alt={wantedItem.name}
                                             style={{width: '50px', height: '50px', objectFit: 'contain'}}
                                           />
                                                                                        <div>
                                               <div style={{fontWeight: 'bold', color: '#fff'}}>{wantedItem.name}</div>
                                               <div style={{fontSize: '12px', color: '#aaa'}}>{wantedItem.type || 'Unknown'}</div>
                                             </div>
                                         </div>
                                       </div>
                                     ) : (
                                       <div style={{padding: '12px', background: '#23272e', borderRadius: '8px', border: '1px solid #444', color: '#aaa', textAlign: 'center'}}>
                                         Takas etmek istediğiniz itemı seçin
                                       </div>
                                     )}
                                   </div>

                                   <div className="form-group">
                                     <label className="form-label">Aşınma Durumu:</label>
                                     <select
                                       value={wear}
                                       onChange={(e) => setWear(e.target.value)}
                                       style={{
                                         width: '100%',
                                         padding: '10px',
                                         background: '#2a2f3a',
                                         border: '1px solid #444',
                                         borderRadius: '6px',
                                         color: '#fff',
                                         fontSize: '14px',
                                         marginBottom: '15px'
                                       }}
                                     >
                                       <option value="any">Herhangi bir aşınma</option>
                                       <option value="factory_new">Factory New (0.00 - 0.07)</option>
                                       <option value="minimal_wear">Minimal Wear (0.07 - 0.15)</option>
                                       <option value="field_tested">Field-Tested (0.15 - 0.38)</option>
                                       <option value="well_worn">Well-Worn (0.38 - 0.45)</option>
                                       <option value="battle_scarred">Battle-Scarred (0.45 - 1.00)</option>
                                     </select>
                                   </div>

                                  <div className="form-group">
                                    <label className="form-label">Açıklama:</label>
                                    <textarea
                                      className="form-textarea"
                                      placeholder="Takas ilanınızın açıklamasını yazın..."
                                      value={description}
                                      onChange={(e) => setDescription(e.target.value)}
                                      maxLength={500}
                                    />
                                    <div style={{fontSize: '12px', color: '#aaa', marginTop: '4px'}}>
                                      {description.length}/500 karakter
                                    </div>
                                  </div>

                                  <div className="form-group">
                                    <label className="form-label">Overpay Kabul Ediyor musunuz?</label>
                                    <div className="radio-group">
                                      <label className="radio-item">
                                        <input
                                          type="radio"
                                          name="overpay"
                                          value="yes"
                                          checked={overpay === 'yes'}
                                          onChange={(e) => setOverpay(e.target.value)}
                                        />
                                        <span>Evet</span>
                                      </label>
                                      <label className="radio-item">
                                        <input
                                          type="radio"
                                          name="overpay"
                                          value="no"
                                          checked={overpay === 'no'}
                                          onChange={(e) => setOverpay(e.target.value)}
                                        />
                                        <span>Hayır</span>
                                      </label>
                                    </div>
                                  </div>

                                                                     <button
                                     className="submit-btn"
                                     onClick={handleSubmit}
                                     disabled={submitLoading}
                                   >
                                     {submitLoading ? 'Ekleniyor...' : 'TAKAS İLANI EKLE'}
                                   </button>
                                </>
                              ) : (
                                                                 <div style={{textAlign: 'center', color: '#aaa', marginTop: 40}}>
                                   Envanterinizden takas edeceğiniz itemı ve takas etmek istediğiniz itemı seçin
                                 </div>
                               )}
                             </div>
                           </div>
                         )}
                       </div>
                     </li>
                   </ul>
                 </div>
                  <div id="KO">
                    <ul className="CardBlokFull" style={{display:'none'}}>
                      <li>
                        <div className="CardContent">
                          <div style={{textAlign: 'center', padding: '40px', color: '#aaa'}}>
                            Knight Online takas ilanı özelliği yakında eklenecek...
                          </div>
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
    </div>
  );
};

export default TakasEkle;
