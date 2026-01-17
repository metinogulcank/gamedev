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

  // Group listings by full item_name (skin bazında)
  const getWeaponsList = () => {
    const skinsMap = new Map();
    tumIlanlar.forEach(ilan => {
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
    return tumIlanlar.filter(ilan => ilan.item_name === itemName);
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
  const weaponsList = (catalogItems.length > 0 ? catalogItems.map(c => {
    const firstId = getFirstListingIdByName(c.name);
    return {...c, firstListingId: firstId};
  }) : getWeaponsList());
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
              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_knife"></i>
                  <h2>Knives</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="/skinlist">Bowie Knife </a></li>
                  <li><a href="/skinlist">Butterfly Knife </a></li>
                  <li><a href="/skinlist">Falchion Knife </a></li>
                  <li><a href="/skinlist">Flip Knife </a></li>
                  <li><a href="/skinlist">Gut Knife </a></li>
                  <li><a href="/skinlist">Huntsman Knife </a></li>
                  <li><a href="/skinlist">M9 Bayonet </a></li>
                  <li><a href="/skinlist">Bayonet </a></li>
                  <li><a href="/skinlist">Karambit </a></li>
                  <li><a href="/skinlist">Shadow Daggers </a></li>
                  <li><a href="/skinlist">Stiletto Knife </a></li>
                  <li><a href="/skinlist">Ursus Knife </a></li>
                  <li><a href="/skinlist">Navaja Knife </a></li>
                  <li><a href="/skinlist">Talon Knife </a></li>
                  <li><a href="/skinlist">Classic Knife </a></li>
                  <li><a href="/skinlist">Paracord Knife </a></li>
                  <li><a href="/skinlist">Survival Knife </a></li>
                  <li><a href="/skinlist">Nomad Knife </a></li>
                  <li><a href="/skinlist">Skeleton Knife </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_pistol"></i>
                  <h2>Pistols</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">P2000 </a></li>
                  <li><a href="#">USP-S </a></li>
                  <li><a href="#">Glock-18 </a></li>
                  <li><a href="#">P250 </a></li>
                  <li><a href="#">FN57 </a></li>
                  <li><a href="#">CZ75-Auto </a></li>
                  <li><a href="#">Tec-9 </a></li>
                  <li><a href="#">R8 Revolver </a></li>
                  <li><a href="#">Desert Eagle </a></li>
                  <li><a href="#">Dual Berettas </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_rifle"></i>
                  <h2>Rifles</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">Galil AR </a></li>
                  <li><a href="#">SCAR-20 </a></li>
                  <li><a href="#">AWP </a></li>
                  <li><a href="#">AK-47 </a></li>
                  <li><a href="#">FAMAS </a></li>
                  <li><a href="#">M4A4 </a></li>
                  <li><a href="#">M4A1-S </a></li>
                  <li><a href="#">SG 553 </a></li>
                  <li><a href="#">SSG 08 </a></li>
                  <li><a href="#">AUG </a></li>
                  <li><a href="#">G3SG1 </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_smg"></i>
                  <h2>SMGs</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">P90 </a></li>
                  <li><a href="#">MAC-10 </a></li>
                  <li><a href="#">UMP-45 </a></li>
                  <li><a href="#">MP7 </a></li>
                  <li><a href="#">PP-Bizon </a></li>
                  <li><a href="#">MP9 </a></li>
                  <li><a href="#">MP5-SD </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_shotgun"></i>
                  <h2>Shotguns</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">Sawed off </a></li>
                  <li><a href="#">XM1014 </a></li>
                  <li><a href="#">Nova </a></li>
                  <li><a href="#">MAG-7 </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_machinegun"></i>
                  <h2>Machineguns</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">M249 </a></li>
                  <li><a href="#">Negev </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_hands"></i>
                  <h2>Gloves</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">Bloodhound Gloves </a></li>
                  <li><a href="#">Driver Gloves </a></li>
                  <li><a href="#">Hand Wraps </a></li>
                  <li><a href="#">Moto Gloves </a></li>
                  <li><a href="#">Specialist Gloves </a></li>
                  <li><a href="#">Sport Gloves </a></li>
                  <li><a href="#">Hydra Gloves </a></li>
                  <li><a href="#">Broken Fang Glove </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_sticker"></i>
                  <h2>Stickers</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">Antwerp 2022 </a></li>
                  <li><a href="#">Boardroom </a></li>
                  <li><a href="#">Battlefield 2042 </a></li>
                  <li><a href="#">Stockholm 2021 </a></li>
                  <li><a href="#">Riptide Surf Shop </a></li>
                  <li><a href="#">Operation Riptide </a></li>
                  <li><a href="#">2021 Community </a></li>
                  <li><a href="#">Poorly Drawn </a></li>
                  <li><a href="#">2020RMR </a></li>
                  <li><a href="#">Broken Fang </a></li>
                  <li><a href="#">Recoil </a></li>
                  <li><a href="#">Warhammer 40K </a></li>
                  <li><a href="#">HL:Alyx </a></li>
                  <li><a href="#">Halo </a></li>
                  <li><a href="#">Shattered Web </a></li>
                  <li><a href="#">CS20 </a></li>
                  <li><a href="#">Berlin 2019 </a></li>
                  <li><a href="#">Chicken </a></li>
                  <li><a href="#">Feral Predators </a></li>
                  <li><a href="#">Katowice 2019 </a></li>
                  <li><a href="#">Skill Group </a></li>
                  <li><a href="#">London 2018 </a></li>
                  <li><a href="#">Boston 2018 </a></li>
                  <li><a href="#">Krakow 2017 </a></li>
                  <li><a href="#">Atlanta 2017 </a></li>
                  <li><a href="#">Cologne 2016 </a></li>
                  <li><a href="#">Columbus 2016 </a></li>
                  <li><a href="#">DreamHack 2015 </a></li>
                  <li><a href="#">Cologne 2015 </a></li>
                  <li><a href="#">Katowice 2015 </a></li>
                  <li><a href="#">DreamHack 2014 </a></li>
                  <li><a href="#">Cologne 2014 </a></li>
                  <li><a href="#">Katowice 2014 </a></li>
                  <li><a href="#">Community 2018 </a></li>
                  <li><a href="#">Sticker 1 </a></li>
                  <li><a href="#">Sticker 2 </a></li>
                  <li><a href="#">Enfu Sticker </a></li>
                  <li><a href="#">Perfect World 1 </a></li>
                  <li><a href="#">Perfect World 2 </a></li>
                  <li><a href="#">Community 1 </a></li>
                  <li><a href="#">Bestiary </a></li>
                  <li><a href="#">Slid3 </a></li>
                  <li><a href="#">Sugarface </a></li>
                  <li><a href="#">Pinups </a></li>
                  <li><a href="#">Team Roles </a></li>
                  <li><a href="#">Other Stickers </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_customplayer"></i>
                  <h2>Agent</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">CT </a></li>
                  <li><a href="#">T </a></li>
                </ul>
              </li>

              <li>
                <a href="#">
                  <i className="iconCsgo iconCsgo_other"></i>
                  <h2>Others</h2>
                </a>
                <ul className="ProductsWeapons">
                  <li><a href="#">Tools </a></li>
                  <li><a href="#">Spray </a></li>
                  <li><a href="#">Collectibles </a></li>
                  <li><a href="#">Passes </a></li>
                  <li><a href="#">Gifts </a></li>
                  <li><a href="#">Music Kits </a></li>
                  <li><a href="#">Weapon Cases </a></li>
                  <li><a href="#">Keys </a></li>
                  <li><a href="#">Patch </a></li>
                </ul>
              </li>
            </ul>

            <ul className="FilterCombos">
              <li>
                <select className="Select">
                  <optgroup label="Quality">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Contraband</option>
                    <option className="exterior_wearcategory2">Covert</option>
                    <option className="exterior_wearcategory3">Classified</option>
                    <option className="exterior_wearcategory4">Restricted</option>
                    <option className="quality_normal">Mil-Spec Grade</option>
                    <option className="quality_tournament">Industrial Grade</option>
                    <option className="quality_strange">Consumer Grade</option>
                    <option className="quality_unusual">Extraordinary</option>
                    <option className="quality_unusual_strange">Remarkable</option>
                    <option className="rarity_ancient_weapon">Exotic</option>
                    <option className="rarity_rare_weapon">High Grade</option>
                    <option className="rarity_mythical_weapon">Base Grade</option>
                    <option className="rarity_legendary_weapon">Agent Quality</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Category">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Normal</option>
                    <option className="exterior_wearcategory2">Souvenir</option>
                    <option className="exterior_wearcategory3">StatTrak™</option>
                    <option className="exterior_wearcategory4">★</option>
                    <option className="quality_normal">★ StatTrak™</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Exterior">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Factory New</option>
                    <option className="exterior_wearcategory2">Minimal Wear</option>
                    <option className="exterior_wearcategory3">Field-Tested</option>
                    <option className="exterior_wearcategory4">Well-Worn</option>
                    <option className="quality_normal">Battle-Scarred</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Popular">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Knives</option>
                    <option className="exterior_wearcategory2">Weapons</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Color">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Red</option>
                    <option className="exterior_wearcategory2">Blue</option>
                    <option className="exterior_wearcategory3">Green</option>
                    <option className="exterior_wearcategory4">Yellow</option>
                    <option className="quality_normal">Black</option>
                    <option className="quality_tournament">White</option>
                    <option className="quality_strange">Purple</option>
                    <option className="quality_unusual">Camouflage</option>
                    <option className="quality_unusual_strange">Beast</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Collections">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Weapon Cases</option>
                    <option className="exterior_wearcategory2">Map Collections</option>
                  </optgroup>
                </select>
              </li>

              <li>
                <select className="Select">
                  <optgroup label="Stickers">
                    <option className="exterior_wearcategory0">All</option>
                    <option className="exterior_wearcategory1">Customize</option>
                  </optgroup>
                </select>
              </li>
            </ul>
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
                  {currentItems.map((weapon, index) => (
                    <li 
                      key={index} 
                      title={weapon.name}
                      style={{cursor: 'pointer'}}
                      onClick={() => {
                        const targetId = weapon.firstListingId || getFirstListingIdByName(weapon.name);
                        if (targetId) {
                          navigate(`/skindetay/${targetId}`);
                        } else {
                          navigate(`/skindetay/0?name=${encodeURIComponent(weapon.name)}`);
                        }
                      }}
                    >
                      <div className="ProductItem">
                        <div className="ProductPic">
                          <img 
                            src={`https://steamcommunity-a.akamaihd.net/economy/image/${weapon.image}`}
                            alt={weapon.name}
                          />
                          <a 
                            className="ProductButton" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Silaha tıklandığında ilk ilanın detay sayfasına git
                              const targetId = weapon.firstListingId || getFirstListingIdByName(weapon.name);
                              if (targetId) {
                                navigate(`/skindetay/${targetId}`);
                              } else {
                                navigate(`/skindetay/0?name=${encodeURIComponent(weapon.name)}`);
                              }
                            }}
                            title={weapon.name}
                            style={{cursor: 'pointer'}}
                          >
                            İncele <i className="fas fa-arrow-right"></i>
                          </a>
                        </div>
                        <div className="ProductDesc">
                          <h2>{weapon.name}</h2>
                          <p>
                            <span className="left">
                              {(() => {
                                // Öncelik: aktif ilanlardan bu isim için min fiyat
                                let minActive = Number.POSITIVE_INFINITY;
                                tumIlanlar.forEach(ilan => {
                                  if (ilan.item_name === weapon.name || extractWeaponName(ilan.item_name) === extractWeaponName(weapon.name)) {
                                    const p = parseFloat(ilan.price);
                                    if (!isNaN(p) && p < minActive) minActive = p;
                                  }
                                });
                                if (isFinite(minActive)) return `${minActive.toFixed(2)} ₺`;
                              // Eğer aktif ilan yoksa fiyat gösterme
                              return null;
                            })()}
                          </span>
                            <span className="right">
                              {weapon.count} İlan
                            </span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
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
