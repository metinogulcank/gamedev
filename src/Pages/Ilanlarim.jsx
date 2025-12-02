import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const Ilanlarim = () => {
  const [ilanlar, setIlanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      setError('Giriş yapmalısınız!');
      setLoading(false);
      return;
    }
    const user = JSON.parse(stored);
    if (!user.id) {
      setError('Kullanıcı ID bulunamadı!');
      setLoading(false);
      return;
    }
    fetch('https://gamedev.mymedya.tr/api/ilanlarim.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIlanlar(data.ilanlar);
        } else {
          setError(data.message || 'İlanlar alınamadı!');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Sunucuya ulaşılamadı!');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Topbar />
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5>İLANLARIM</h5>
                {loading && <div>Yükleniyor...</div>}
                {error && <div style={{color:'red'}}>{error}</div>}
                {!loading && !error && (
                  <div className="ProductsArea">
                    <ul>
                      {ilanlar.length === 0 && <li>Hiç ilanınız yok.</li>}
                      {ilanlar.map(ilan => (
                        <li key={ilan.id} style={{position:'relative'}}>
                          <div className="ProductItem">
                            {/* Sağ üstte çarpı butonu */}
                            <button
                              style={{
                                position: 'absolute',
                                top: -15,
                                right: 20,
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                border: 'none',
                                padding: '5px 14px',
                                borderRadius: '50%',
                                fontSize: 24,
                                cursor: 'pointer',
                                zIndex: 2
                              }}
                              title="İlanı Kaldır"
                              onClick={async () => {
                                if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
                                try {
                                  const res = await fetch('https://gamedev.mymedya.tr/api/ilan_sil.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: ilan.id })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setIlanlar(prev => prev.filter(i => i.id !== ilan.id));
                                  } else {
                                    alert(data.message || 'İlan silinemedi!');
                                  }
                                } catch (err) {
                                  alert('Sunucuya ulaşılamadı!');
                                }
                              }}
                            >
                              ×
                            </button>
                            <div className="ProductPic">
                              {/* Eğer image alanı varsa göster */}
                              {ilan.image && (
                                <img
                                  src={`https://steamcommunity-a.akamaihd.net/economy/image/${ilan.image}`}
                                  alt={ilan.item_name}
                                />
                              )}
                            </div>
                            <div className="ProductDesc">
                              <h2>{ilan.item_name}</h2>
                              <p>
                                <span className="left">{parseFloat(ilan.price).toFixed(2)} ₺</span>
                                {ilan.created_at && <span className="right">{new Date(ilan.created_at).toLocaleString()}</span>}
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

export default Ilanlarim;
