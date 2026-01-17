import React, { useState, useEffect } from 'react';
import '../../public/css/site.css';
import '../../public/css/fontawesome.css';
import '../../public/css/reset.css';
import Topbar from '../Components/Topbar';
import HeaderTop from '../Components/HeaderTop';
import Footer from '../Components/Footer';

const Takas = () => {
  const [takasIlanlari, setTakasIlanlari] = useState([]);
  const [ilanlarLoading, setIlanlarLoading] = useState(true);
  const [ilanlarError, setIlanlarError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Takas ilanlarını getir
  useEffect(() => {
    const fetchTakasIlanlari = async () => {
      try {
        setIlanlarLoading(true);
        const response = await fetch('https://elephunt.com/api/tum_takas_ilanlari.php');
        const data = await response.json();
        
        if (data.success) {
          setTakasIlanlari(data.takas_ilanlari || []);
        } else {
          setIlanlarError(data.message || 'Takas ilanları yüklenemedi');
        }
      } catch (error) {
        console.error('Takas ilanları yükleme hatası:', error);
        setIlanlarError('Sunucuya ulaşılamadı');
      } finally {
        setIlanlarLoading(false);
      }
    };

    fetchTakasIlanlari();
  }, []);

  // Aşınma durumu için renk sınıfları
  const getWearClass = (wear) => {
    switch (wear) {
      case 'factory_new': return 'factorynew';
      case 'minimal_wear': return 'minimalwear';
      case 'field_tested': return 'fieldtested';
      case 'well_worn': return 'wellworn';
      case 'battle_scarred': return 'battlescarred';
      default: return 'factorynew';
    }
  };

  // Aşınma durumu için Türkçe metin
  const getWearText = (wear) => {
    switch (wear) {
      case 'factory_new': return 'Factory New';
      case 'minimal_wear': return 'Minimal Wear';
      case 'field_tested': return 'Field-Tested';
      case 'well_worn': return 'Well-Worn';
      case 'battle_scarred': return 'Battle-Scarred';
      case 'any': return 'Herhangi';
      default: return 'Factory New';
    }
  };

  // Filtrelenmiş takas ilanları
  const filteredTakasIlanlari = takasIlanlari.filter(ilan =>
    ilan.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ilan.wanted_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ilan.item_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              CS2 Takas İlanları
            </h1>
            <div className="PageNavigation">
              <ul>
                <li><a href="/">Anasayfa</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li><a href="/takas">Takas İlanları</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li>CS2</li>
              </ul>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="MarketFilterArea">
            <div className="SetContent">
              <div className="FilterTitle">
                <i className="fas fa-search"></i>Takas İlanlarında Ara
              </div>
              <div className="SearchBar" style={{margin: '20px 0'}}>
                <input
                  type="text"
                  placeholder="Takas ilanlarında ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <section className="Products MarketProducts">
          <div className="SetContent">
            <div className="ProductsArea">
              {ilanlarLoading && <div style={{textAlign: 'center', padding: '50px', color: '#fff'}}>Takas ilanları yükleniyor...</div>}
              {ilanlarError && <div style={{textAlign: 'center', padding: '50px', color: '#ff6b6b'}}>Hata: {ilanlarError}</div>}
              {!ilanlarLoading && !ilanlarError && filteredTakasIlanlari.length === 0 && (
                <div style={{textAlign: 'center', padding: '50px', color: '#fff'}}>
                  {searchTerm ? 'Arama kriterlerinize uygun takas ilanı bulunamadı.' : 'Henüz takas ilanı bulunmuyor.'}
                </div>
              )}
              <ul>
                {filteredTakasIlanlari.map((ilan) => (
                  <li key={ilan.id} title={ilan.item_name}>
                    <div className="ProductItem">
                      <div className="ProductPic">
                        <h1 className={getWearClass(ilan.wear)}>{getWearText(ilan.wear)}</h1>
                        <img 
                          src={`https://steamcommunity-a.akamaihd.net/economy/image/${ilan.image}`}
                          alt={ilan.item_name}
                        />
                        <a className="ProductButton" href={`/takas-detay/${ilan.id}`} title={ilan.item_name}>
                          İncele <i className="fas fa-arrow-right"></i>
                        </a>
                      </div>
                                             <div className="ProductDesc" style={{textAlign: 'center'}}>
                         <h2 style={{textAlign: 'center', margin: '0 0 10px 0'}}>{ilan.item_name}</h2>
                         <p style={{textAlign: 'center', margin: '0'}}>
                           <span>
                             {ilan.created_at && new Date(ilan.created_at).toLocaleDateString()}
                           </span>
                         </p>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pagination">
              <a href="#">&laquo;</a>
              <a className="active" href="#">1</a>
              <a href="#">2</a>
              <a href="#">3</a>
              <a href="#">4</a>
              <a href="#">5</a>
              <a href="#">6</a>
              <a href="#">&raquo;</a>
            </div>
          </div>
        </section>
      </section>
      <Footer />
    </div>
  );
};

export default Takas;
