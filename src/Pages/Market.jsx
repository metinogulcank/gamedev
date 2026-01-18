import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../public/css/site.css'
import '../../public/css/fontawesome.css'
import '../../public/css/reset.css'
import Topbar from '../Components/Topbar';
import HeaderTop from '../Components/HeaderTop';
import Footer from '../Components/Footer';

function Market() {
  const navigate = useNavigate();
  const [tumIlanlar, setTumIlanlar] = useState([]);
  const [ilanlarLoading, setIlanlarLoading] = useState(true);
  const [ilanlarError, setIlanlarError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterRarity, setFilterRarity] = useState('All');
  const [filterExterior, setFilterExterior] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWeapon]);

  useEffect(() => {
    // Fetch market items from database
    fetch('https://elephunt.com/api/tum_ilanlar.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTumIlanlar(data.ilanlar);
        } else {
          setIlanlarError(data.message || 'İlanlar alınamadı!');
        }
        setIlanlarLoading(false);
      })
      .catch(() => {
        setIlanlarError('Sunucuya ulaşılamadı!');
        setIlanlarLoading(false);
      });

    fetch('https://elephunt.com/api/get_market_catalog.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCatalogItems(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {});
  }, []);

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

  // Helper function to extract weapon name from item_name
  // Example: "AK-47 | Redline" -> "AK-47"
  const extractWeaponName = (itemName) => {
    if (!itemName) return '';
    const parts = itemName.split('|');
    return parts[0].trim();
  };

  // Helper to categorize weapons
  const getWeaponCategory = (weaponName) => {
    if (!weaponName) return 'Others';
    const name = weaponName.toLowerCase();
    if (name.includes('knife') || name.includes('bayonet') || name.includes('karambit') || name.includes('daggers')) return 'Knives';
    if (name.includes('glove') || name.includes('wraps')) return 'Gloves';
    if (name.includes('usp') || name.includes('glock') || name.includes('p250') || name.includes('five-seven') || name.includes('desert eagle') || name.includes('deagle') || name.includes('revolver') || name.includes('cz75') || name.includes('dual berettas') || name.includes('p2000') || name.includes('tec-9')) return 'Pistols';
    if (name.includes('ak-47') || name.includes('m4a') || name.includes('awp') || name.includes('famas') || name.includes('galil') || name.includes('sg 553') || name.includes('aug') || name.includes('g3sg1') || name.includes('scar-20') || name.includes('ssg 08')) return 'Rifles';
    if (name.includes('mp9') || name.includes('mac-10') || name.includes('mp7') || name.includes('mp5') || name.includes('ump-45') || name.includes('p90') || name.includes('bizon')) return 'SMGs';
    if (name.includes('nova') || name.includes('xm1014') || name.includes('mag-7') || name.includes('sawed-off')) return 'Shotguns';
    if (name.includes('negev') || name.includes('m249')) return 'Machineguns';
    if (name.includes('sticker')) return 'Stickers';
    if (name.includes('agent')) return 'Agent';
    return 'Others';
  };

  // Group listings by full item_name (skin bazında)
  const getWeaponsList = () => {
    const skinsMap = new Map();
    tumIlanlar.forEach(ilan => {
      // Apply Filters
      if (searchQuery && !ilan.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (selectedCategory !== 'All' && getWeaponCategory(ilan.item_name) !== selectedCategory) return;
      // Note: Rarity and Exterior are usually item specific properties. 
      // For grouped view, we might filter if *any* listing matches, or just filter the listings inside the group.
      // Here we will filter the listings that contribute to the group.
      
      const wearText = getWearText(ilan.wear);
      if (filterExterior !== 'All' && wearText !== filterExterior) return;
      
      // Rarity check (requires rarity data which might be missing in simple ilan object, skipping for now or assuming it matches)
      // If we had rarity in ilan object: if (filterRarity !== 'All' && ilan.rarity !== filterRarity) return;

      const key = ilan.item_name;
      if (key) {
        if (!skinsMap.has(key)) {
          skinsMap.set(key, {
            name: key,
            count: 0,
            image: ilan.image,
            totalPrice: 0,
            minPrice: parseFloat(ilan.price),
            firstListingId: ilan.id
          });
        }
        const skin = skinsMap.get(key);
        skin.count++;
        const price = parseFloat(ilan.price);
        skin.totalPrice += price;
        if (!isNaN(price) && price < skin.minPrice) {
          skin.minPrice = price;
          skin.image = ilan.image;
        }
      }
    });
    const skinsArray = Array.from(skinsMap.values());
    skinsArray.forEach(skin => {
      skin.averagePrice = skin.count > 0 ? skin.totalPrice / skin.count : 0;
    });
    return skinsArray.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get listings for selected skin (exact item_name)
  const getListingsForWeapon = (itemName) => {
    return tumIlanlar.filter(ilan => {
      if (ilan.item_name !== itemName) return false;
      
      const wearText = getWearText(ilan.wear);
      if (filterExterior !== 'All' && wearText !== filterExterior) return false;
      
      return true;
    });
  };

  const getFirstListingIdByName = (name) => {
    let bestId = null;
    let bestPrice = Number.POSITIVE_INFINITY;
    tumIlanlar.forEach(ilan => {
      if (ilan.item_name === name) {
        const p = parseFloat(ilan.price);
        if (!isNaN(p) && p < bestPrice) {
          bestPrice = p;
          bestId = ilan.id;
        }
      }
    });
    if (bestId) return bestId;
    // Fallback: isim bazında ilan yoksa silah adına göre eşleştir
    const weaponKey = extractWeaponName(name);
    tumIlanlar.forEach(ilan => {
      const wn = extractWeaponName(ilan.item_name);
      if (wn === weaponKey) {
        const p = parseFloat(ilan.price);
        if (!isNaN(p) && p < bestPrice) {
          bestPrice = p;
          bestId = ilan.id;
        }
      }
    });
    return bestId;
  };
  const weaponsList = (() => {
    if (catalogItems.length > 0) {
      // Pre-calculate counts and availability
      const counts = {};
      const availableWithExterior = new Set();
      
      tumIlanlar.forEach(ilan => {
        const name = ilan.item_name;
        counts[name] = (counts[name] || 0) + 1;
        
        if (filterExterior !== 'All') {
            if (getWearText(ilan.wear) === filterExterior) {
                availableWithExterior.add(name);
            }
        }
      });

      return catalogItems.filter(item => {
        // Search
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        // Category
        if (selectedCategory !== 'All' && getWeaponCategory(item.name) !== selectedCategory) return false;
        
        // Exterior
        if (filterExterior !== 'All') {
           if (!availableWithExterior.has(item.name)) return false;
        }
        
        return true;
      }).map(c => {
        const count = counts[c.name] || 0;
        const firstId = getFirstListingIdByName(c.name);
        return {...c, firstListingId: firstId, count: count};
      });
    } else {
      return getWeaponsList();
    }
  })();
  const selectedWeaponListings = selectedWeapon ? getListingsForWeapon(selectedWeapon) : [];

  const currentList = selectedWeapon ? selectedWeaponListings : weaponsList;
  const totalItems = currentList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const currentItems = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  return (
    <div className='MarketPage'>
    <div className='marketbg'>
        <img src="/images/Slider/Slide1.jpg" alt="Market Background" style={{position:'absolute'}}/>
    </div>
    <HeaderTop />
    <Topbar />
    <section className="MarketArea">
      <div className="MarketHeader" id="FilterMarket">
        <div className="SetContent">
          <h1>
            <img src="/images/cs_logo.svg" className="marketCsgoicon" alt="CS2 Logo" />
            CS2 Market
          </h1>
          <div className="PageNavigation">
            <ul>
              <li><a href="/">Anasayfa</a></li>
              <li><i className="fas fa-angle-right"></i></li>
              <li><a href="/market">Market</a></li>
              <li><i className="fas fa-angle-right"></i></li>
              <li>CS2</li>
            </ul>
          </div>
        </div>
        <div className={`MarketFilterArea ${filterOpen ? 'open' : ''}`}>
          <div className="SetContent">
            <div className="FilterTitle">
              <i className="fas fa-filter"></i>Filtreleme Yapın
              <i 
                className="fas fa-times FilterClose" 
                onClick={() => setFilterOpen(false)}
              ></i>
            </div>
            <ul className="ProductCategories">
              <li onClick={() => setSelectedCategory('Knives')} className={selectedCategory === 'Knives' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_knife"></i>
                  <h2>Knives</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Pistols')} className={selectedCategory === 'Pistols' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_pistol"></i>
                  <h2>Pistols</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Rifles')} className={selectedCategory === 'Rifles' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_rifle"></i>
                  <h2>Rifles</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('SMGs')} className={selectedCategory === 'SMGs' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_smg"></i>
                  <h2>SMGs</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Shotguns')} className={selectedCategory === 'Shotguns' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_shotgun"></i>
                  <h2>Shotguns</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Machineguns')} className={selectedCategory === 'Machineguns' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_machinegun"></i>
                  <h2>Machineguns</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Gloves')} className={selectedCategory === 'Gloves' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_hands"></i>
                  <h2>Gloves</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Stickers')} className={selectedCategory === 'Stickers' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_sticker"></i>
                  <h2>Stickers</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Agent')} className={selectedCategory === 'Agent' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_customplayer"></i>
                  <h2>Agent</h2>
                </a>
              </li>

              <li onClick={() => setSelectedCategory('Others')} className={selectedCategory === 'Others' ? 'active' : ''}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <i className="iconCsgo iconCsgo_other"></i>
                  <h2>Others</h2>
                </a>
              </li>
            </ul>

            <div className="FilterCombos" style={{
              display: 'flex', 
              gap: '15px', 
              padding: '20px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {/* Search */}
              <div style={{flex: '1 1 200px'}}>
                <div className="Search" style={{margin: 0, width: '100%', maxWidth: '100%', boxShadow: 'none', background: '#23252b'}}>
                  <input 
                    type="text" 
                    placeholder="Silah Ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{border: '1px solid #333'}}
                  />
                  <i className="fas fa-search" style={{right: '15px'}}></i>
                </div>
              </div>

              {/* Exterior Filter */}
              <div style={{flex: '0 0 auto'}}>
                <select 
                  className="Select" 
                  value={filterExterior}
                  onChange={(e) => setFilterExterior(e.target.value)}
                  style={{
                    background: '#23252b',
                    color: '#fff',
                    border: '1px solid #333',
                    padding: '0 15px',
                    height: '40px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option value="All">Dış Görünüş (Tümü)</option>
                  <option value="Factory New">Factory New</option>
                  <option value="Minimal Wear">Minimal Wear</option>
                  <option value="Field-Tested">Field-Tested</option>
                  <option value="Well-Worn">Well-Worn</option>
                  <option value="Battle-Scarred">Battle-Scarred</option>
                </select>
              </div>

              {/* Rarity Filter - Placeholder for now since we don't have rarity data yet */}
              {/* 
              <div style={{flex: '0 0 auto'}}>
                <select 
                  className="Select"
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  style={{...}}
                >
                  <option value="All">Kalite (Tümü)</option>
                  <option value="Covert">Covert (Red)</option>
                  <option value="Classified">Classified (Pink)</option>
                  <option value="Restricted">Restricted (Purple)</option>
                  <option value="Mil-Spec">Mil-Spec (Blue)</option>
                  <option value="Industrial">Industrial (Light Blue)</option>
                  <option value="Consumer">Consumer (White)</option>
                </select>
              </div> 
              */}
              
              <div style={{flex: '0 0 auto'}}>
                 <button 
                   onClick={() => {
                     setSelectedCategory('All');
                     setFilterExterior('All');
                     setSearchQuery('');
                   }}
                   style={{
                     background: '#e74c3c',
                     color: '#fff',
                     border: 'none',
                     padding: '0 20px',
                     height: '40px',
                     borderRadius: '5px',
                     cursor: 'pointer',
                     fontWeight: '600'
                   }}
                 >
                   Filtreleri Temizle
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="Products MarketProducts">
        <div className="SetContent">
          {selectedWeapon && (
            <div style={{marginBottom: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '5px'}}>
              <button 
                onClick={() => setSelectedWeapon(null)}
                style={{
                  background: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
                Geri Dön
              </button>
              <h2 style={{marginTop: '15px', color: '#fff'}}>
                {selectedWeapon} - {selectedWeaponListings.length} İlan
              </h2>
            </div>
          )}
          <div className="ProductsArea">
            {ilanlarLoading && <div>Yükleniyor...</div>}
            {ilanlarError && <div style={{color:'red'}}>{ilanlarError}</div>}
            <ul>
              {!selectedWeapon ? (
                // Show weapons list
                <>
                  {weaponsList.length === 0 && !ilanlarLoading && <li>Hiç silah bulunamadı.</li>}
                  {currentItems.map((weapon, index) => {
                    // Fiyat hesaplama mantığı
                    let priceDisplay = null;
                    let minActive = Number.POSITIVE_INFINITY;
                    tumIlanlar.forEach(ilan => {
                      if (ilan.item_name === weapon.name || extractWeaponName(ilan.item_name) === extractWeaponName(weapon.name)) {
                        const p = parseFloat(ilan.price);
                        if (!isNaN(p) && p < minActive) minActive = p;
                      }
                    });
                    if (isFinite(minActive)) priceDisplay = `${minActive.toFixed(2)} ₺`;

                    return (
                    <li 
                      key={index} 
                      title={weapon.name}
                      style={{cursor: 'pointer', margin: '5px'}}
                      onClick={() => {
                        const targetId = weapon.firstListingId || getFirstListingIdByName(weapon.name);
                        if (targetId) {
                          navigate(`/skindetay/${targetId}`);
                        } else {
                          navigate(`/skindetay/0?name=${encodeURIComponent(weapon.name)}`);
                        }
                      }}
                    >
                      <div className="ProductItem" style={{
                          width: '280px',
                          height: '90px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '10px',
                          background: '#23252b',
                          borderRadius: '5px',
                          margin: '0',
                          position: 'relative'
                      }}>
                        <div className="ProductPic" style={{
                            width: '80px',
                            height: '70px',
                            position: 'static',
                            background: 'transparent',
                            boxShadow: 'none',
                            padding: '0',
                            marginRight: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                          <img 
                            src={`https://steamcommunity-a.akamaihd.net/economy/image/${weapon.image}`}
                            alt={weapon.name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                margin: '0',
                                display: 'block'
                            }}
                          />
                        </div>
                        <div className="ProductDesc" style={{
                            position: 'static',
                            width: 'calc(100% - 95px)',
                            height: 'auto',
                            padding: 0
                        }}>
                          <h2 style={{
                              fontSize: '15px',
                              marginBottom: '5px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left',
                              width: '100%'
                          }}>{weapon.name}</h2>
                          <p style={{
                              textAlign: 'left',
                              fontSize: '13px',
                              color: '#aaa',
                              display: 'flex',
                              alignItems: 'center',
                              margin: 0
                          }}>
                             {priceDisplay && (
                               <>
                                 <span style={{color: '#e4ae39', fontWeight: '600', marginRight: '5px'}}>
                                   {priceDisplay}
                                 </span>
                                 <span style={{marginRight: '5px'}}> - </span>
                               </>
                             )}
                             <span>
                               {weapon.count} İlan
                             </span>
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                  })}
                </>
              ) : (
                // Show listings for selected weapon
                <>
                  {selectedWeaponListings.length === 0 && !ilanlarLoading && <li>Bu silah için ilan bulunamadı.</li>}
                  {currentItems.map(ilan => (
                    <li key={ilan.id} title={ilan.item_name}>
                      <div className="ProductItem">
                        <div className="ProductPic">
                          <h1 className={getWearClass(ilan.wear)}>{getWearText(ilan.wear)}</h1>
                          <img 
                            src={`https://steamcommunity-a.akamaihd.net/economy/image/${ilan.image}`}
                            alt={ilan.item_name}
                          />
                          <a className="ProductButton" href={`/skindetay/${ilan.id}`} title={ilan.item_name}>
                            İncele <i className="fas fa-arrow-right"></i>
                          </a>
                        </div>
                        <div className="ProductDesc">
                          <h2>{ilan.item_name}</h2>
                          <p>
                            <span className="left">
                              {parseFloat(ilan.price).toFixed(2)} ₺
                            </span>
                            <span className="right">
                              {ilan.created_at && new Date(ilan.created_at).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
          {totalItems >= 20 && (
            <div className="pagination">
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
      </section>
    </section>
    <Footer />
    

    </div>
  )
}

export default Market
