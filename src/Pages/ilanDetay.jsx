import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../../public/css/site.css'
import '../../public/css/fontawesome.css'
import '../../public/css/reset.css'
import Topbar from '../Components/Topbar';
import HeaderTop from '../Components/HeaderTop';
import Footer from '../Components/Footer';

function StickerRow({ inspectLink, ownerSteamId, assetId }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!inspectLink) return;
      setLoading(true);
      setError('');
      try {
        const url = `https://elephunt.com/api/float_proxy.php?inspect_link=${encodeURIComponent(inspectLink)}${ownerSteamId ? `&owner_steamid=${ownerSteamId}` : ''}${assetId ? `&assetid=${assetId}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        let arr = [];
        if (data && data.item && Array.isArray(data.item.stickers)) arr = data.item.stickers;
        else if (data && data.iteminfo && Array.isArray(data.iteminfo.stickers)) arr = data.iteminfo.stickers;
        if (!cancelled) setStickers(arr || []);
      } catch (e) {
        if (!cancelled) setError('Stickerlar alınamadı');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [inspectLink, ownerSteamId, assetId]);
  if (loading) return <span style={{color:'#66c0f4'}}>Stickerlar yükleniyor...</span>;
  if (error) return null;
  if (!stickers || stickers.length === 0) return null;
  return (
    <div style={{display:'flex', gap: 6, flexWrap: 'wrap', marginTop: 4}}>
      {stickers.map((s, i) => (
        <img key={i} src={s.url || s.image_url || s.icon_url} alt={s.name || 'sticker'} style={{width: 24, height: 24, objectFit: 'contain', borderRadius: 4, border: '1px solid #222'}} />
      ))}
    </div>
  );
}

function IlanDetay() {
  const navigate = useNavigate();
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
  const [teklifMinFiyati, setTeklifMinFiyati] = useState(null);
  const [teklifMinBilgi, setTeklifMinBilgi] = useState('');
  const [teklifMinLoading, setTeklifMinLoading] = useState(false);
  const [teklifMinItemName, setTeklifMinItemName] = useState('');
  const [user, setUser] = useState(null);
  const [weaponListings, setWeaponListings] = useState([]);
  const [allActiveListings, setAllActiveListings] = useState([]);
  const [weaponListingsLoading, setWeaponListingsLoading] = useState(false);
  const [weaponListingsError, setWeaponListingsError] = useState('');
  const [lastSales, setLastSales] = useState([]);
  const [lastSalesLoading, setLastSalesLoading] = useState(false);
  const [lastSalesError, setLastSalesError] = useState('');

  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const openSellerModal = (listing) => {
    setSelectedSeller(listing);
    setSellerModalOpen(true);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getCurrentListLength = () => {
    if (activeTab === 'Sell') return weaponListings.length;
    if (activeTab === 'Buyy') return buyOrders.length;
    if (activeTab === 'Gecmis') return lastSales.length;
    return 0;
  };

  const totalItems = getCurrentListLength();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const getPaginatedData = (data) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  useEffect(() => {
    if (!id) {
      setIlanError('İlan ID bulunamadı!');
      setIlanLoading(false);
      return;
    }
    const queryName = new URLSearchParams(window.location.search).get('name');
    if (id === '0' && queryName) {
      fetch('https://elephunt.com/api/get_market_catalog.php')
        .then(res => res.json())
        .then(catalog => {
          if (catalog.success && Array.isArray(catalog.items)) {
            const found = catalog.items.find(i => i.name === queryName);
            const pseudoIlan = found ? {
              id: 0,
              item_name: found.name,
              image: found.image,
              price: found.minPrice || found.averagePrice || 0
            } : { id: 0, item_name: queryName, image: '', price: 0 };
            setIlan(pseudoIlan);
            setIlanLoading(false);
          } else {
            setIlan({ id:0, item_name: queryName, image:'', price:0 });
            setIlanLoading(false);
          }
        })
        .catch(() => {
          setIlan({ id:0, item_name: queryName, image:'', price:0 });
          setIlanLoading(false);
        });
      return;
    }
    fetch(`https://elephunt.com/api/ilan_detay.php?id=${id}`)
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
      
      fetch(`https://elephunt.com/api/favori_kontrol.php?ilan_id=${ilan.id}&user_id=${user.id}`)
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
    if (!ilan || !ilan.item_name) return;
    setWeaponListingsLoading(true);
    setWeaponListingsError('');
    fetch(`https://elephunt.com/api/tum_ilanlar.php?_=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.ilanlar)) {
          setAllActiveListings(data.ilanlar);
          const filteredListings = data.ilanlar
            .filter(item => item.item_name === ilan.item_name)
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

  useEffect(() => {
    if (!ilan || !ilan.item_name) return;
    setLastSalesLoading(true);
    setLastSalesError('');
    fetch(`https://elephunt.com/api/son_satislar.php?item_name=${encodeURIComponent(ilan.item_name)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLastSales(Array.isArray(data.sales) ? data.sales : []);
        } else {
          setLastSalesError(data.message || 'Satış geçmişi alınamadı!');
        }
      })
      .catch(() => {
        setLastSalesError('Sunucuya ulaşılamadı!');
      })
      .finally(() => {
        setLastSalesLoading(false);
      });
  }, [ilan]);

  const [buyOrders, setBuyOrders] = useState([]);
  const [buyOrdersLoading, setBuyOrdersLoading] = useState(false);
  const [buyOrdersError, setBuyOrdersError] = useState('');
  const [hasItemInInventory, setHasItemInInventory] = useState(false);
  useEffect(() => {
    if (!ilan || !ilan.item_name || activeTab !== 'Buyy') return;
    let retries = 1;
    const load = () => {
      setBuyOrdersLoading(true);
      setBuyOrdersError('');
      fetch(`https://elephunt.com/api/list_buy_orders.php?item_name=${encodeURIComponent(ilan.item_name)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setBuyOrders(Array.isArray(data.orders) ? data.orders : []);
          else setBuyOrdersError(data.message || 'Siparişler alınamadı');
        })
        .catch(() => {
          if (retries > 0) { retries -= 1; setTimeout(load, 1000); }
          else setBuyOrdersError('Sunucuya ulaşılamadı');
        })
        .finally(() => setBuyOrdersLoading(false));
    };
    load();
  }, [ilan, activeTab]);
  useEffect(() => {
    // Mevcut kullanıcı envanterinde bu item var mı?
    const stored = localStorage.getItem('user');
    if (!stored || !ilan?.item_name) { setHasItemInInventory(false); return; }
    const u = JSON.parse(stored);
    if (!u.trade_url) { setHasItemInInventory(false); return; }
    const sid64 = (() => {
      try {
        const urlObj = new URL(u.trade_url);
        const partner = urlObj.searchParams.get('partner');
        if (!partner) return null;
        return (BigInt(partner) + BigInt('76561197960265728')).toString();
      } catch { return null; }
    })();
    if (!sid64) { setHasItemInInventory(false); return; }
    fetch(`https://elephunt.com/api/steam_inventory_proxy.php?steamid=${sid64}&appid=730&contextid=2`)
      .then(res => res.json())
      .then(inv => {
        let has = false;
        if (inv && inv.items) {
          for (const k in inv.items) {
            const it = inv.items[k];
            if (it.name === ilan.item_name) { has = true; break; }
          }
        }
        setHasItemInInventory(has);
      })
      .catch(() => setHasItemInInventory(false));
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

  const computeTeklifMinimum = async (targetIlan) => {
    const itemName = targetIlan?.item_name || '';
    const ilanFiyatiRaw = parseFloat(targetIlan?.price || 0);
    const ilanFiyati = Number.isFinite(ilanFiyatiRaw) ? ilanFiyatiRaw : 0;

    let minFiyat = ilanFiyati * 0.9;
    let bilgi = 'Sipariş yoksa ilan fiyatının %10 altı';

    if (itemName) {
      try {
        const res = await fetch(`https://elephunt.com/api/list_buy_orders.php?item_name=${encodeURIComponent(itemName)}`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.orders) && data.orders.length > 0) {
          let minOrderPrice = null;
          data.orders.forEach((o) => {
            const p = parseFloat(o?.price);
            if (Number.isFinite(p) && (minOrderPrice === null || p < minOrderPrice)) {
              minOrderPrice = p;
            }
          });
          if (minOrderPrice !== null) {
            minFiyat = minOrderPrice;
            bilgi = 'Bu skin için en düşük sipariş';
          }
        }
      } catch (e) {
        void e;
      }
    }

    return { itemName, minFiyat, bilgi };
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

    setTeklifMinLoading(true);
    setTeklifMinFiyati(null);
    setTeklifMinBilgi('');
    setTeklifMinItemName(targetIlan?.item_name || '');
    computeTeklifMinimum(targetIlan)
      .then(({ itemName, minFiyat, bilgi }) => {
        setTeklifMinItemName(itemName || '');
        setTeklifMinFiyati(minFiyat);
        setTeklifMinBilgi(bilgi);
      })
      .finally(() => setTeklifMinLoading(false));
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
    const ilanFiyatiRaw = parseFloat(targetIlan?.price || 0);
    const ilanFiyati = Number.isFinite(ilanFiyatiRaw) ? ilanFiyatiRaw : 0;

    let minAllowed = null;
    if (teklifMinFiyati !== null && teklifMinItemName && teklifMinItemName === (targetIlan?.item_name || '')) {
      minAllowed = teklifMinFiyati;
    } else {
      setTeklifMinLoading(true);
      const computed = await computeTeklifMinimum(targetIlan);
      setTeklifMinItemName(computed.itemName || '');
      setTeklifMinFiyati(computed.minFiyat);
      setTeklifMinBilgi(computed.bilgi);
      setTeklifMinLoading(false);
      minAllowed = computed.minFiyat;
    }

    if (minAllowed !== null && Number.isFinite(minAllowed) && fiyat < minAllowed) {
      alert(`Teklif fiyatı minimum tutarın altında olamaz.\nİlan fiyatı: ${ilanFiyati.toFixed(2)} ₺\nMinimum: ${Number(minAllowed).toFixed(2)} ₺`);
      return;
    }

    setTeklifLoading(true);
    try {
      const response = await fetch('https://elephunt.com/api/karsi_teklif_ekle.php', {
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
        setTeklifMinFiyati(null);
        setTeklifMinBilgi('');
        setTeklifMinItemName('');
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
      const response = await fetch('https://elephunt.com/api/favori_ekle.php', {
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
                  <a href="#Buyy" onClick={() => setActiveTab('Buyy')}>Siparişler ({buyOrders.length})</a>
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
                        Aktif ilan bulunamadı.
                      </div>
                    )}
                    {!weaponListingsLoading && getPaginatedData(weaponListings).map(listing => {
                      const storeName = listing.store_name || listing.seller_username || listing.user_name || listing.username || 'Satıcı';
                      const sellerAvatar = listing.store_logo || listing.seller_avatar || '/images/unknownuser.jpg';
                      const priceValue = Number.isFinite(listing.price) ? listing.price : parseFloat(listing.price);
                      const displayPrice = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '-';
                      const wearText = getWearText(listing.wear);
                      const createdAtText = listing.created_at ? new Date(listing.created_at).toLocaleString() : '';

                      return (
                        <div className="Product-item" key={listing.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="itemImg" style={{ width: '10%', marginRight: 0 }}>
                            <img 
                              src={`https://steamcommunity-a.akamaihd.net/economy/image/${listing.image}`} 
                              alt={listing.item_name}
                              style={{ maxWidth: '80%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div className="ProductFloat" style={{ width: '18%', marginRight: 0 }}>
                            <p>{listing.description || 'Silah ilanı'}</p>
                            <span>Durum: {wearText}</span>
                            {listing.wear && !isNaN(parseFloat(listing.wear)) && (
                              <div style={{fontSize:'12px', color:'#ccc', marginTop:'2px'}}>
                                Float: {parseFloat(listing.wear).toFixed(9)}
                              </div>
                            )}
                            {createdAtText && <span>İlan Tarihi: {createdAtText}</span>}
                          </div>
                          <div className="ProductSticker" style={{ width: '15%', marginRight: 0, padding: '10px 0' }}>
                            {listing.inspect_link && (
                              <StickerRow inspectLink={listing.inspect_link} ownerSteamId={listing.owner_steamid} assetId={listing.assetid} />
                            )}
                          </div>
                          <div className="ProductSeller" style={{ width: '16%', marginRight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div className="profilephoto" onClick={() => openSellerModal(listing)} style={{ cursor: 'pointer' }}>
                              <img src={sellerAvatar} alt={storeName} />
                            </div>
                            <div className="sellername" onClick={() => openSellerModal(listing)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', lineHeight: '1.2' }}>
                              <span style={{ fontWeight: 'bold' }}>{storeName}</span>
                            </div>
                          </div>
                          <div className="ProductPrice" style={{ width: '14%', marginRight: 0 }}>
                            <p>
                              {displayPrice} <span>TL</span>
                            </p>
                          </div>
                          <div style={{ width: '22%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <div className="ProductBuy" style={{ width: 'auto', float: 'none', padding: 0, height: 'auto' }}>
                              <button
                                onClick={async () => {
                                  const stored = localStorage.getItem('user');
                                  if (!stored) { alert('Satın almak için giriş yapın.'); return; }
                                  const u = JSON.parse(stored);
                                  if (u.id === listing.user_id) { alert('Kendi ilanınızı satın alamazsınız.'); return; }
                                  try {
                                    const res = await fetch('https://elephunt.com/api/purchase.php', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ buyer_id: u.id, ilan_id: listing.id })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert('Satın alma başarılı. Satıcıya provizyon olarak eklendi.');
                                      setTimeout(async () => {
                                        try {
                                          await fetch('https://elephunt.com/api/release_provision.php', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ order_id: data.order_id })
                                          });
                                        } catch (e) {}
                                      }, 15000);
                                      setWeaponListings(prev => prev.filter(i => i.id !== listing.id));
                                    } else {
                                      alert(data.message || 'Satın alma başarısız.');
                                    }
                                  } catch (err) {
                                    alert('Sunucu hatası.');
                                  }
                                }}
                                className="BtnSepeteEkle"
                                style={{ width: '100px', textAlign: 'center', fontSize: '12px' }}
                              >
                                SATIN AL
                              </button>
                            </div>
                            <div className="ProductFavorite" style={{ width: 'auto' }}>
                              <button 
                                onClick={async () => {
                                  const stored = localStorage.getItem('user');
                                  if (!stored) { alert('Giriş yapmalısınız!'); return; }
                                  const user = JSON.parse(stored);
                                  if (!user.id) return;
                                  try {
                                    const checkRes = await fetch(`https://elephunt.com/api/favori_kontrol.php?ilan_id=${listing.id}&user_id=${user.id}`);
                                    const checkData = await checkRes.json();
                                    const isFav = checkData.success && checkData.isFavorite;
                                    const response = await fetch('https://elephunt.com/api/favori_ekle.php', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ilan_id: listing.id, user_id: user.id, action: isFav ? 'remove' : 'add' })
                                    });
                                    const data = await response.json();
                                    if (data.success) window.location.reload();
                                  } catch (error) { console.error('Favori işlemi başarısız:', error); }
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '16px', padding: '5px' }}
                                title="Favorilere Ekle"
                              >
                                <i className="fa fa-star"></i>
                              </button>
                            </div>
                            <div className="ProductComment" style={{ width: 'auto' }}>
                              <button 
                                onClick={() => openTeklifModal(listing)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#28a745', fontSize: '16px', padding: '5px' }}
                                title="Karşı Teklif Ver"
                              >
                                <i className="fas fa-comments"></i>
                              </button>
                            </div>
                          </div>
                          <div className="clear"></div>
                        </div>
                      );
                    })}
                  </div>
                  <div id="Buyy" style={{ display: activeTab === 'Buyy' ? 'block' : 'none' }}>
                    {buyOrdersLoading && <div className="Product-item" style={{ textAlign:'center' }}>Siparişler yükleniyor...</div>}
                    {buyOrdersError && !buyOrdersLoading && <div className="Product-item" style={{ textAlign:'center', color:'red' }}>{buyOrdersError}</div>}
                    {!buyOrdersLoading && !buyOrdersError && buyOrders.length === 0 && (
                      <div className="Product-item" style={{ textAlign:'center' }}>Bu skin için aktif sipariş yok.</div>
                    )}
                    {!buyOrdersLoading && buyOrders.map(order => (
                      <div className="Product-item" key={order.id}>
                        <div className="itemImg">
                          <img 
                            src={`https://steamcommunity-a.akamaihd.net/economy/image/${ilan.image}`} 
                            alt={ilan.item_name}
                          />
                        </div>
                        <div className="ProductSeller">
                          <div className="sellername">
                            {ilan.item_name}
                          </div>
                        </div>
                        <div className="ProductPrice">
                          <p>{parseFloat(order.price).toFixed(2)} <span>TL</span></p>
                        </div>
                        <div className="ProductBuy" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                          <button
                            disabled={!hasItemInInventory}
                            className="BtnSepeteEkle"
                            style={{ width:'100%', textAlign:'center', opacity: hasItemInInventory ? 1 : 0.6 }}
                            onClick={async () => {
                              const stored = localStorage.getItem('user');
                              if (!stored) { alert('Giriş yapınız'); return; }
                              const u = JSON.parse(stored);
                              try {
                                const res = await fetch('https://elephunt.com/api/fulfill_buy_order.php', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ order_id: order.id, seller_id: u.id })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert('Sipariş tamamlandı. Provizyona eklendi.');
                                  setBuyOrders(prev => prev.filter(o => o.id !== order.id));
                                  setTimeout(async () => {
                                    try {
                                      await fetch('https://elephunt.com/api/release_provision.php', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ order_id: data.order_id })
                                      });
                                    } catch (e) {}
                                  }, 15000);
                                } else {
                                  alert(data.message || 'Sipariş tamamlanamadı');
                                }
                              } catch (e) {
                                alert('Sunucu hatası');
                              }
                            }}
                          >
                            Siparişi Tamamla
                          </button>
                        </div>
                        <div className="clear"></div>
                      </div>
                    ))}
                  </div>

                  <div id="Gecmis" style={{ display: activeTab === 'Gecmis' ? 'block' : 'none' }}>
                    <div className="SkinDetailProductsTitle">
                      <div className="item">Items</div>
                      <div className="item">Fiyat</div>
                      <div className="item">Komisyon</div>
                      <div className="item">Tarih</div>
                    </div>
                    {lastSalesLoading && (
                      <div className="Product-item" style={{ textAlign: 'center' }}>
                        Satış geçmişi yükleniyor...
                      </div>
                    )}
                    {lastSalesError && !lastSalesLoading && (
                      <div className="Product-item" style={{ textAlign: 'center', color: 'red' }}>
                        {lastSalesError}
                      </div>
                    )}
                    {!lastSalesLoading && !lastSalesError && lastSales.length === 0 && (
                      <div className="Product-item" style={{ textAlign: 'center' }}>
                        Geçmiş satış bulunamadı.
                      </div>
                    )}
                    {!lastSalesLoading && !lastSalesError && getPaginatedData(lastSales).map(sale => (
                      <div className="Product-item" key={sale.id}>
                        <div className="itemImg">
                          <img 
                            src={`https://steamcommunity-a.akamaihd.net/economy/image/${sale.image}`} 
                            alt={sale.item_name}
                          />
                        </div>
                        <div className="ProductSeller">
                          <div className="sellername">
                            {sale.item_name}
                          </div>
                        </div>
                        <div className="ProductPrice">
                          <p>
                            {parseFloat(sale.price).toFixed(2)} <span>TL</span>
                          </p>
                        </div>
                        <div className="ProductFloat">
                          <p>Komisyon: {parseFloat(sale.commission).toFixed(2)} TL</p>
                          <span>{new Date(sale.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="clear"></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            {totalItems >= 20 && (
              <div className="paginationDetail">
                <a href="#" onClick={(e) => { e.preventDefault(); paginate(currentPage - 1); }}>&laquo;</a>
                {Array.from({ length: totalPages }, (_, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    className={currentPage === i + 1 ? 'active' : ''}
                    onClick={(e) => { e.preventDefault(); paginate(i + 1); }}
                  >
                    {i + 1}
                  </a>
                ))}
                <a href="#" onClick={(e) => { e.preventDefault(); paginate(currentPage + 1); }}>&raquo;</a>
              </div>
            )}
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
              <p style={{ color: '#ffa500', marginBottom: '10px', fontSize: '13px' }}>
                <strong>Minimum Teklif:</strong>{' '}
                {teklifMinLoading || teklifMinFiyati === null ? (
                  'Hesaplanıyor...'
                ) : (
                  `${Number(teklifMinFiyati).toFixed(2)} ₺${teklifMinBilgi ? ` (${teklifMinBilgi})` : ''}`
                )}
              </p>
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
      {/* Seller Modal */}
      {sellerModalOpen && selectedSeller && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={(e) => {
          if(e.target === e.currentTarget) setSellerModalOpen(false);
        }}>
          <div style={{
            backgroundColor: '#1b2034',
            padding: '30px',
            borderRadius: '10px',
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #444',
            color: '#fff',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSellerModalOpen(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
               <img 
                 src={selectedSeller.store_logo || selectedSeller.seller_avatar || '/images/unknownuser.jpg'} 
                 alt="Seller" 
                 style={{ width: '80px', height: '80px', borderRadius: '50%', marginRight: '20px', objectFit: 'cover' }}
               />
               <div>
                 <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                   {selectedSeller.store_name || selectedSeller.seller_username || selectedSeller.username || 'Satıcı'}
                 </h2>
                 <p style={{ marginTop: '5px', color: '#aaa' }}>
                   {selectedSeller.store_description || ''}
                 </p>
                 {selectedSeller.seller_steam_id && (
                   <a 
                     href={`https://steamcommunity.com/profiles/${selectedSeller.seller_steam_id}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ display: 'inline-block', marginTop: '10px', color: '#66c0f4', textDecoration: 'underline' }}
                   >
                     <i className="fab fa-steam" style={{ marginRight: '5px' }}></i> Steam Profili
                   </a>
                 )}
               </div>
            </div>

            <h3 style={{ fontSize: '20px', marginBottom: '15px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
              Satıcının Diğer İlanları
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
               {allActiveListings.filter(l => l.user_id === selectedSeller.user_id && l.id !== selectedSeller.id).length > 0 ? (
                 allActiveListings.filter(l => l.user_id === selectedSeller.user_id && l.id !== selectedSeller.id).map(l => (
                   <div key={l.id} 
                   onClick={() => {
                     setSellerModalOpen(false);
                     navigate(`/skindetay/${l.id}`);
                     window.scrollTo(0, 0);
                   }}
                   style={{ 
                     width: 'calc(33.33% - 10px)', 
                     cursor: 'pointer',
                     background: '#23283b', 
                     border: '1px solid #333', 
                     borderRadius: '5px', 
                     padding: '10px',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center'
                   }}>
                      <img 
                        src={`https://steamcommunity-a.akamaihd.net/economy/image/${l.image}`} 
                        alt={l.item_name}
                        style={{ width: '100%', height: '80px', objectFit: 'contain', marginBottom: '10px' }} 
                      />
                      <div style={{ fontSize: '14px', textAlign: 'center', marginBottom: '5px', height: '40px', overflow: 'hidden' }}>{l.item_name}</div>
                      <div style={{ fontWeight: 'bold', color: '#70d929' }}>{parseFloat(l.price).toFixed(2)} TL</div>
                   </div>
                 ))
               ) : (
                 <div style={{ padding: '20px', textAlign: 'center', width: '100%', color: '#aaa' }}>Başka ilan bulunamadı.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IlanDetay
