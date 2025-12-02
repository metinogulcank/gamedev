import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import '../../public/css/site.css'
import '../../public/css/fontawesome.css'
import '../../public/css/reset.css'
import Topbar from '../Components/Topbar';
import HeaderTop from '../Components/HeaderTop';
import Footer from '../Components/Footer';

function IlanDetay() {
  const { id } = useParams();
  const [ilan, setIlan] = useState(null);
  const [ilanLoading, setIlanLoading] = useState(true);
  const [ilanError, setIlanError] = useState('');
  const [activeTab, setActiveTab] = useState('Sell');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [teklifModalOpen, setTeklifModalOpen] = useState(false);
  const [teklifFiyati, setTeklifFiyati] = useState('');
  const [teklifLoading, setTeklifLoading] = useState(false);
  const [selectedListingForTeklif, setSelectedListingForTeklif] = useState(null);
  const [user, setUser] = useState(null);
  const [weaponListings, setWeaponListings] = useState([]);
  const [weaponListingsLoading, setWeaponListingsLoading] = useState(false);
  const [weaponListingsError, setWeaponListingsError] = useState('');

  useEffect(() => {
    if (!id) {
      setIlanError('İlan ID bulunamadı!');
      setIlanLoading(false);
      return;
    }

    // Fetch specific item from database
    fetch(`https://gamedev.mymedya.tr/api/ilan_detay.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIlan(data.ilan);
        } else {
          setIlanError(data.message || 'İlan alınamadı!');
        }
        setIlanLoading(false);
      })
      .catch(() => {
        setIlanError('Sunucuya ulaşılamadı!');
        setIlanLoading(false);
      });
  }, [id]);

  // Check favorite status when ilan changes
  useEffect(() => {
    if (ilan && ilan.id) {
      // Get current user from localStorage
      const stored = localStorage.getItem('user');
      if (!stored) return;
      
      const user = JSON.parse(stored);
      if (!user.id) return;
      
      // Set user state
      setUser(user);
      
      fetch(`https://gamedev.mymedya.tr/api/favori_kontrol.php?ilan_id=${ilan.id}&user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsFavorite(data.isFavorite);
          }
        })
        .catch(() => {
          // Silently fail, don't show error for favorite check
        });
    }
  }, [ilan]);

  useEffect(() => {
    if (!ilan) return;
    const weaponName = extractWeaponName(ilan.item_name);
    if (!weaponName) return;

    setWeaponListingsLoading(true);
    setWeaponListingsError('');

    fetch('https://gamedev.mymedya.tr/api/tum_ilanlar.php')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.ilanlar)) {
          const filteredListings = data.ilanlar
            .filter(item => extractWeaponName(item.item_name) === weaponName)
            .map(item => ({
              ...item,
              price: parseFloat(item.price)
            }))
            .sort((a, b) => {
              const priceA = isNaN(a.price) ? Number.MAX_VALUE : a.price;
              const priceB = isNaN(b.price) ? Number.MAX_VALUE : b.price;
              return priceA - priceB;
            });

          setWeaponListings(filteredListings);
        } else {
          setWeaponListings([]);
          setWeaponListingsError(data.message || 'İlanlar alınamadı!');
        }
      })
      .catch(() => {
        setWeaponListings([]);
        setWeaponListingsError('Sunucuya ulaşılamadı!');
      })
      .finally(() => {
        setWeaponListingsLoading(false);
      });
  }, [ilan]);

  // Helper function to get wear condition class
  const getWearClass = (wear) => {
    if (!wear) return 'factorynew';
    const wearValue = parseFloat(wear);
    if (wearValue <= 0.07) return 'factorynew';
    if (wearValue <= 0.15) return 'minimalwear';
    if (wearValue <= 0.38) return 'fieldtested';
    if (wearValue <= 0.45) return 'wellworn';
    return 'battlescarred';
  };

  // Helper function to get wear condition text
  const getWearText = (wear) => {
    if (!wear) return 'Factory New';
    const wearValue = parseFloat(wear);
    if (wearValue <= 0.07) return 'Factory New';
    if (wearValue <= 0.15) return 'Minimal Wear';
    if (wearValue <= 0.38) return 'Field-Tested';
    if (wearValue <= 0.45) return 'Well-Worn';
    return 'Battle-Scarred';
  };

  const extractWeaponName = (itemName) => {
    if (!itemName) return '';
    const parts = itemName.split('|');
    return parts[0].trim();
  };

  const weaponName = extractWeaponName(ilan?.item_name);
  const weaponPrices = weaponListings
    .map(item => parseFloat(item.price))
    .filter(price => !isNaN(price));
  const weaponAveragePrice = weaponPrices.length > 0
    ? weaponPrices.reduce((sum, price) => sum + price, 0) / weaponPrices.length
    : 0;
  const weaponMinPrice = weaponPrices.length > 0
    ? Math.min(...weaponPrices)
    : 0;
  const hasWeaponPriceData = weaponPrices.length > 0;

  // Helper function to generate reference price (random algorithm)
  const generateReferencePrice = (basePrice) => {
    const price = parseFloat(basePrice);
    // Rastgele %10-30 arası indirim uygula
    const discount = Math.random() * 0.2 + 0.1; // 0.1 to 0.3
    const referencePrice = price * (1 - discount);
    return referencePrice.toFixed(2);
  };

  // Helper function to generate wear condition prices
  const generateWearPrices = (basePrice) => {
    const price = parseFloat(basePrice);
    return {
      factoryNew: (price * 1.0).toFixed(2),
      minimalWear: (price * 0.9).toFixed(2),
      fieldTested: (price * 0.7).toFixed(2),
      statTrak: (price * 1.3).toFixed(2)
    };
  };

  // Helper function to generate Steam market URL
  const generateSteamMarketUrl = (itemName) => {
    if (!itemName) return '#';
    
    // Item name'i Steam market URL formatına çevir
    const encodedName = encodeURIComponent(itemName);
    return `https://steamcommunity.com/market/search?appid=730&q=${encodedName}`;
  };

  // Karşı teklif modal'ını aç
  const openTeklifModal = (listing) => {
    const targetIlan = listing || ilan;
    
    if (!user) {
      alert('Karşı teklif vermek için giriş yapmalısınız!');
      return;
    }
    if (user.id === targetIlan?.user_id) {
      alert('Kendi ilanınıza teklif veremezsiniz!');
      return;
    }
    setSelectedListingForTeklif(targetIlan);
    setTeklifFiyati('');
    setTeklifModalOpen(true);
  };

  // Karşı teklif gönder
  const submitTeklif = async () => {
    if (!teklifFiyati.trim()) {
      alert('Lütfen teklif fiyatı giriniz!');
      return;
    }

    const fiyat = parseFloat(teklifFiyati.replace(',', '.'));
    if (isNaN(fiyat) || fiyat <= 0) {
      alert('Geçerli bir fiyat giriniz!');
      return;
    }

    const targetIlan = selectedListingForTeklif || ilan;
    const ilanFiyati = parseFloat(targetIlan.price);
    
    // Fiyat kontrolü: ±%5
    const minFiyat = ilanFiyati * 0.95; // %5 azalt
    const maxFiyat = ilanFiyati * 1.05; // %5 artır
    
    if (fiyat < minFiyat || fiyat > maxFiyat) {
      alert(`Teklif fiyatı ilan fiyatının %5'i kadar farklı olabilir.\nİlan fiyatı: ${ilanFiyati.toFixed(2)} ₺\nMinimum: ${minFiyat.toFixed(2)} ₺\nMaximum: ${maxFiyat.toFixed(2)} ₺`);
      return;
    }

    setTeklifLoading(true);
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/karsi_teklif_ekle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ilan_id: targetIlan.id,
          teklif_veren_user_id: user.id,
          teklif_fiyati: fiyat
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Karşı teklifiniz başarıyla gönderildi!');
        setTeklifModalOpen(false);
        setTeklifFiyati('');
        setSelectedListingForTeklif(null);
      } else {
        alert('Hata: ' + (data.message || 'Teklif gönderilemedi!'));
      }
    } catch (err) {
      console.error('Teklif hatası:', err);
      alert('Sunucu hatası veya bağlantı sorunu!');
    } finally {
      setTeklifLoading(false);
    }
  };

  // Helper function to toggle favorite
  const toggleFavorite = async () => {
    if (!ilan || favoriteLoading) return;
    
    // Get current user from localStorage
    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('Giriş yapmalısınız!');
      return;
    }
    
    const user = JSON.parse(stored);
    if (!user.id) {
      alert('Kullanıcı ID bulunamadı!');
      return;
    }
    
    setFavoriteLoading(true);
    const action = isFavorite ? 'remove' : 'add';
    
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/favori_ekle.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ilan_id: ilan.id,
          user_id: user.id,
          action: action
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsFavorite(!isFavorite);
        // Show success message (you can add a toast notification here)
        console.log(data.message);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (ilanLoading) {
    return (
      <div className='MarketPage'>
        <HeaderTop />
        <Topbar />
        <div style={{ textAlign: 'center', padding: '50px' }}>Yükleniyor...</div>
      </div>
    );
  }

  if (ilanError || !ilan) {
    return (
      <div className='MarketPage'>
        <HeaderTop />
        <Topbar />
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          {ilanError || 'İlan bulunamadı!'}
        </div>
      </div>
    );
  }

  return (
    <div className='MarketPage'>
      <div className='marketbg'>
        <img src="/images/Slider/Slide1.jpg" alt="Market Background" style={{position:'absolute'}}/>
    </div>
      <HeaderTop />
      <Topbar />
      <section className="MarketArea Ko">
        <div className="MarketHeader">
          <div className="SetContent">
            <div className="PageNavigation">
              <ul>
                <li><a href="/">Anasayfa</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li><a href="/market">Market</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li>{ilan.item_name}</li>
              </ul>
            </div>
          </div>
          <div className="SkinDetailFilterArea">
            <div className="SetContent">
              <div className="SkinsInfoLeft">
                <div className="SkinsInfoimage">
                  <img 
                    src={`https://steamcommunity-a.akamaihd.net/economy/image/${ilan.image}`}
                    alt={ilan.item_name}
                  />
                </div>
              </div>
              <div className="SkinsInfoRight">
                <div className="SkinTitle">
                  <h1>{ilan.item_name}</h1>
                  <div className="favorite">
                    <button 
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isFavorite ? '#ffd700' : '#fff',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {favoriteLoading ? 'İşleniyor...' : (isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle')}
                      <i className={`fa fa-star ${isFavorite ? 'active' : ''}`}></i>
                    </button>
                  </div>
                  <div className="clear"></div>
                </div>
                <div className="explanation">
                  <span>Quality | <b>Covert</b></span>
                  <span>Category | <b>Normal</b></span>
                  <span>Type | <b>Rifles</b></span>
                </div>
                <div className="line"></div>
                <div className="referenceprice" style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  <span>Silah | <b>{weaponName || ilan.item_name}</b></span>
                  {weaponListingsLoading ? (
                    <span>Silah ilanları yükleniyor...</span>
                  ) : hasWeaponPriceData ? (
                    <>
                      <span>Ortalama Fiyat | <b>{weaponAveragePrice.toFixed(2)} TL</b></span>
                      <span>En Düşük Fiyat | <b>{weaponMinPrice.toFixed(2)} TL</b></span>
                      <span>İlan Sayısı | <b>{weaponListings.length}</b></span>
                    </>
                  ) : (
                    <span>Bu silah için başka ilan bulunamadı.</span>
                  )}
                  <a 
                    href={generateSteamMarketUrl(ilan.item_name)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="steam-market-link"
                  >
                    Steam Pazar'da Görüntüle ▸
                  </a>
                </div>
                                 <div className="SatislarEnRight">
                   <div className="SatisYapBtn">
                     <a href="javascript:;">Satış Yap</a>
                   </div>
                   <div className="SiparisOlustur">
                     <a href="javascript:;">Sipariş Oluştur</a>
                   </div>
                 </div>
               </div>
               <div className="clear"></div>
             </div>
             
             {/* Wear Condition Tabs inside SkinDetailFilterArea */}
             <div className="WearConditionTabs">
               <div className="SetContent">
                 <div className="WearTabs">
                   <button className={`wear-tab ${getWearText(ilan?.wear) === 'Factory New' ? 'active' : ''}`}>
                     Factory New {ilan && generateWearPrices(ilan.price).factoryNew} TL
                   </button>
                   <button className={`wear-tab ${getWearText(ilan?.wear) === 'Minimal Wear' ? 'active' : ''}`}>
                     Minimal Wear {ilan && generateWearPrices(ilan.price).minimalWear} TL
                   </button>
                   <button className={`wear-tab ${getWearText(ilan?.wear) === 'Field-Tested' ? 'active' : ''}`}>
                     Field-Tested {ilan && generateWearPrices(ilan.price).fieldTested} TL
                   </button>
                   <button className="wear-tab statTrak">
                     ★ StatTrak™ {ilan && generateWearPrices(ilan.price).statTrak} TL
                   </button>
                 </div>
               </div>
             </div>
           </div>

          <div className="ProductFilterArea">
            <header className="tabs-nav">
              <ul>
                <li className={activeTab === 'Sell' ? 'activex' : ''}>
                  <a href="#Sell" onClick={() => setActiveTab('Sell')}>
                    Aktif İlanlar ({weaponListings.length})
                  </a>
                </li>
                <li className={activeTab === 'Buyy' ? 'activex' : ''}>
                  <a href="#Buyy" onClick={() => setActiveTab('Buyy')}>Siparişler (0)</a>
                </li>
                <li className={activeTab === 'Gecmis' ? 'activex' : ''}>
                  <a href="#Gecmis" onClick={() => setActiveTab('Gecmis')}>Son 10 Satış</a>
                </li>
              </ul>
            </header>
            <div className="SkinsFeatures">
              <div className="itemsFeaturesRight">
                <input name="ctl00$ContentPlaceHolder1$minPrice" type="text" id="ContentPlaceHolder1_minPrice" className="minmaxPrice" placeholder="Min Fiyat" />
                <input name="ctl00$ContentPlaceHolder1$maxPrice" type="text" id="ContentPlaceHolder1_maxPrice" className="minmaxPrice" placeholder="Max Fiyat" />
                <button id="buttons" className="BtnMinMaxPrice">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
                     </div>
           
           <div className="SkinDetailProducts">
            <div className="Products">
              <div id="container">
                <section className="tabs-content">
                  <div id="Sell" style={{ display: activeTab === 'Sell' ? 'block' : 'none' }}>
                    <div className="SkinDetailProductsTitle">
                      <div className="item">Items</div>
                      <div className="item">Açıklama</div>
                      <div className="item">&nbsp;</div>
                      <div className="item">Satıcı</div>
                      <div className="item">Fiyat</div>
                      <div className="item">&nbsp;</div>
                    </div>

                    {weaponListingsLoading && (
                      <div className="Product-item" style={{ textAlign: 'center' }}>
                        Bu silah için ilanlar yükleniyor...
                      </div>
                    )}
                    {weaponListingsError && !weaponListingsLoading && (
                      <div className="Product-item" style={{ textAlign: 'center', color: 'red' }}>
                        {weaponListingsError}
                      </div>
                    )}
                    {!weaponListingsLoading && !weaponListingsError && weaponListings.length === 0 && (
                      <div className="Product-item" style={{ textAlign: 'center' }}>
                        Bu silah için ilan bulunamadı.
                      </div>
                    )}
                    {!weaponListingsLoading && weaponListings.map(listing => {
                      const sellerName = listing.seller_name || listing.user_name || listing.username || 'Satıcı';
                      const sellerAvatar = listing.seller_avatar || '/images/unknownuser.jpg';
                      const priceValue = Number.isFinite(listing.price) ? listing.price : parseFloat(listing.price);
                      const displayPrice = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '-';
                      const wearText = getWearText(listing.wear);
                      const createdAtText = listing.created_at ? new Date(listing.created_at).toLocaleString() : '';

                      return (
                        <div className="Product-item" key={listing.id}>
                          <div className="itemImg">
                            <img 
                              src={`https://steamcommunity-a.akamaihd.net/economy/image/${listing.image}`} 
                              alt={listing.item_name}
                            />
                          </div>
                          <div className="ProductFloat">
                            <p>{listing.description || 'Silah ilanı'}</p>
                            <span>Durum: {wearText}</span>
                            {createdAtText && <span>İlan Tarihi: {createdAtText}</span>}
                          </div>
                          <div className="ProductSeller">
                            <div className="profilephoto">
                              <img src={sellerAvatar} alt={sellerName} />
                            </div>
                            <div className="sellername">
                              {sellerName}
                            </div>
                          </div>
                          <div className="ProductPrice">
                            <p>
                              {displayPrice} <span>TL</span>
                            </p>
                          </div>
                          <div className="ProductBuy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <a href={`/skindetay/${listing.id}`} className="BtnSepeteEkle" style={{ width: '100%', textAlign: 'center' }}>SATIN AL</a>
                          </div>
                          <div className="ProductFavorite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <button 
                              onClick={async () => {
                                // Her ilan için favori kontrolü yap
                                const stored = localStorage.getItem('user');
                                if (!stored) {
                                  alert('Giriş yapmalısınız!');
                                  return;
                                }
                                const user = JSON.parse(stored);
                                if (!user.id) return;
                                
                                // Favori durumunu kontrol et
                                try {
                                  const checkRes = await fetch(`https://gamedev.mymedya.tr/api/favori_kontrol.php?ilan_id=${listing.id}&user_id=${user.id}`);
                                  const checkData = await checkRes.json();
                                  const isFav = checkData.success && checkData.isFavorite;
                                  
                                  // Favori ekle/çıkar
                                  const response = await fetch('https://gamedev.mymedya.tr/api/favori_ekle.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      ilan_id: listing.id,
                                      user_id: user.id,
                                      action: isFav ? 'remove' : 'add'
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    // Başarılı, sayfayı yenile veya state güncelle
                                    window.location.reload();
                                  }
                                } catch (error) {
                                  console.error('Favori işlemi başarısız:', error);
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '16px',
                                padding: '8px'
                              }}
                              title="Favorilere Ekle"
                            >
                              <i className="fa fa-star"></i>
                            </button>
                          </div>
                          <div className="ProductComment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <button 
                              onClick={() => openTeklifModal(listing)}
                              style={{
                                background: '#28a745',
                                border: '2px solid #28a745',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '14px',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '120px',
                                minHeight: '35px',
                                fontWeight: 'bold',
                                width: '100%'
                              }}
                              title="Karşı Teklif Ver"
                            >
                              Karşı Teklif Ver
                            </button>
                          </div>
                          <div className="clear"></div>
                        </div>
                      );
                    })}
                  </div>
                  <div id="Buyy" style={{ display: activeTab === 'Buyy' ? 'block' : 'none' }}>
                    <p>Siparişler ile Aynı listeleme</p>
                  </div>

                  <div id="Gecmis" style={{ display: activeTab === 'Gecmis' ? 'block' : 'none' }}>
                    <p>Son 10 Satış ile Aynı listeleme</p>
                  </div>
                </section>
              </div>
            </div>
            <div className="paginationDetail">
              <a href="#">&laquo;</a>
              <a className="active" href="#">1</a>
              <a href="#">2</a>
              <a href="#">3</a>
              <a href="#">4</a>
              <a href="#">...</a>
              <a href="#">&raquo;</a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      
      {/* Karşı Teklif Modal */}
      {teklifModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#2c2c2c',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '400px',
            border: '1px solid #444'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
              Karşı Teklif Ver
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#ccc', marginBottom: '10px' }}>
                <strong>İlan:</strong> {(selectedListingForTeklif || ilan)?.item_name}
              </p>
              <p style={{ color: '#ccc', marginBottom: '10px' }}>
                <strong>Mevcut Fiyat:</strong> {parseFloat((selectedListingForTeklif || ilan)?.price || 0).toFixed(2)} ₺
              </p>
              {(() => {
                const targetIlan = selectedListingForTeklif || ilan;
                const ilanFiyati = parseFloat(targetIlan?.price || 0);
                const minFiyat = ilanFiyati * 0.95;
                const maxFiyat = ilanFiyati * 1.05;
                return (
                  <p style={{ color: '#ffa500', marginBottom: '10px', fontSize: '13px' }}>
                    <strong>Teklif Aralığı:</strong> {minFiyat.toFixed(2)} ₺ - {maxFiyat.toFixed(2)} ₺ (İlan fiyatının ±%5'i)
                  </p>
                );
              })()}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                Teklif Fiyatınız (₺):
              </label>
              <input
                type="text"
                value={teklifFiyati}
                onChange={(e) => setTeklifFiyati(e.target.value)}
                placeholder="Örn: 100 veya 100,50"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #555',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={submitTeklif}
                disabled={teklifLoading}
                style={{
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: teklifLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  opacity: teklifLoading ? 0.7 : 1
                }}
              >
                {teklifLoading ? 'Gönderiliyor...' : 'Teklif Gönder'}
              </button>
              
              <button
                onClick={() => {
                  setTeklifModalOpen(false);
                  setTeklifFiyati('');
                  setSelectedListingForTeklif(null);
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IlanDetay