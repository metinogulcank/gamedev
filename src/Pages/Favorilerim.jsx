import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const Favorilerim = () => {
  const navigate = useNavigate();
  const [favoriler, setFavoriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    console.log('localStorage user:', stored);
    
    if (!stored) {
      setError('Giriş yapmalısınız!');
      setLoading(false);
      return;
    }
    
    const user = JSON.parse(stored);
    console.log('Parsed user:', user);
    
    if (!user.id) {
      setError('Kullanıcı ID bulunamadı!');
      setLoading(false);
      return;
    }
    
    console.log('Fetching favorites for user_id:', user.id);
    
    fetch('https://elephunt.com/api/favorilerim.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    })
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('API response:', data);
        if (data.success) {
          setFavoriler(data.favoriler);
          console.log('Favoriler set:', data.favoriler);
        } else {
          setError(data.message || 'Favoriler alınamadı!');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError('Sunucuya ulaşılamadı!');
        setLoading(false);
      });
  }, []);

  const removeFromFavorites = async (ilanId, itemName, event) => {
    // Prevent event bubbling to parent click handler
    event.stopPropagation();
    
    if (!window.confirm('Bu itemı favorilerden çıkarmak istediğinize emin misiniz?')) return;
    
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
    
    try {
      const response = await fetch('https://elephunt.com/api/favori_ekle.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ilan_id: ilanId,
          item_name: itemName,
          user_id: user.id,
          action: 'remove'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (ilanId) {
             setFavoriler(prev => prev.filter(fav => fav.id !== ilanId));
        } else {
             setFavoriler(prev => prev.filter(fav => fav.item_name !== itemName));
        }
      } else {
        alert(data.message || 'Favorilerden çıkarılamadı!');
      }
    } catch (error) {
      alert('Sunucuya ulaşılamadı!');
    }
  };

  const goToItemDetail = (favori) => {
    if (favori.is_skin_favorite || !favori.id) {
        // Skin favorisi, generic sayfaya git
        navigate(`/skindetay/0?name=${encodeURIComponent(favori.item_name)}`);
    } else {
        // İlan favorisi, ilan sayfasına git
        navigate(`/skindetay/${favori.id}`);
    }
  };

  return (
    <div>
      <Topbar />
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5>FAVORİLERİM</h5>
                {loading && <div>Yükleniyor...</div>}
                {error && <div style={{color:'red'}}>{error}</div>}
                {!loading && !error && (
                  <div className="ProductsArea">
                                         <ul>
                       {favoriler.length === 0 && <li>Henüz favori itemınız yok.</li>}
                       {favoriler.map(favori => (
                         <li key={favori.fav_id || favori.id} style={{position:'relative'}}>
                           <div 
                             className="ProductItem" 
                             style={{cursor: 'pointer'}}
                             onClick={() => goToItemDetail(favori)}
                           >
                             {/* Sağ üstte çarpı butonu */}
                             <button
                               style={{
                                 position: 'absolute',
                                 top: -15,
                                 right: 20,
                                 background: 'rgba(255,0,0,0.8)',
                                 color: '#fff',
                                 border: 'none',
                                 padding: '5px 10px',
                                 borderRadius: '50%',
                                 fontSize: 18,
                                 cursor: 'pointer',
                                 zIndex: 2,
                                 width: '30px',
                                 height: '30px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 fontWeight: 'bold'
                               }}
                               title="Favorilerden Çıkar"
                                onClick={(e) => removeFromFavorites(favori.id, favori.id ? null : favori.item_name, e)}
                              >
                                ×
                             </button>
                             <div className="ProductPic">
                               {/* Eğer image alanı varsa göster */}
                               {favori.image && (
                                 <img
                                   src={`https://steamcommunity-a.akamaihd.net/economy/image/${favori.image}`}
                                   alt={favori.item_name}
                                 />
                               )}
                             </div>
                             <div className="ProductDesc">
                               <h2>{favori.item_name} {favori.is_skin_favorite && <span style={{fontSize:'12px', color:'#aaa'}}>(Skin)</span>}</h2>
                               <p>
                                 {favori.price && <span className="left">{parseFloat(favori.price).toFixed(2)} ₺</span>}
                                 {!favori.price && <span className="left" style={{color:'#999'}}>Market Fiyatı</span>}
                                 {favori.favori_eklenme_tarihi && (
                                   <span className="right">
                                     Favori: {new Date(favori.favori_eklenme_tarihi).toLocaleString()}
                                   </span>
                                 )}
                               </p>
                             </div>
                           </div>
                         </li>
                       ))}
                     </ul>
                  </div>
                )}
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Favorilerim;