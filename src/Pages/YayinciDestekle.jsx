import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Topbar from '../Components/Topbar';

const YayinciDestekle = () => {
  const { yayinci_id } = useParams(); // URL'den yayıncı ID'sini al
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [yayinci, setYayinci] = useState(null);
  const [bagislar, setBagislar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bagisci_adi: '',
    tutar: '',
    mesaj: '',
  });
  const [balance, setBalance] = useState('...');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      setBalance(userData.balance || '0,00 TL');
      setFormData(prev => ({
        ...prev,
        bagisci_adi: userData.fullname || ''
      }));
    }
    
    // Yayıncı bilgilerini getir
    if (yayinci_id) {
      fetchYayinciData(yayinci_id);
      fetchBagislar(yayinci_id);
    }
  }, [yayinci_id]);

  const fetchYayinciData = async (userId) => {
    try {
      const response = await fetch(`https://gamedev.mymedya.tr/api/yayinci_bilgi.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setYayinci(data.data);
      }
    } catch (error) {
      console.error('Yayıncı bilgileri yüklenirken hata:', error);
    }
  };

  const fetchBagislar = async (yayinciUserId) => {
    try {
      const response = await fetch(`https://gamedev.mymedya.tr/api/yayinci_bagis.php?yayinci_user_id=${yayinciUserId}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setBagislar(data.data || []);
      }
    } catch (error) {
      console.error('Bağışlar yüklenirken hata:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      alert('Bağış yapmak için lütfen giriş yapın.');
      return;
    }
    
    if (!yayinci || !yayinci.user_id) {
      alert('Yayıncı bilgisi bulunamadı.');
      return;
    }
    
    if (!formData.bagisci_adi.trim()) {
      alert('Lütfen adınızı giriniz.');
      return;
    }
    
    const tutar = parseFloat(formData.tutar.toString().replace(',', '.'));
    if (!tutar || tutar <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }
    
    // Bakiye kontrolü
    const currentBalance = parseFloat(balance.toString().replace(/[^\d,]/g, '').replace(',', '.'));
    if (tutar > currentBalance) {
      alert(`Yetersiz bakiye! Mevcut bakiye: ${balance}`);
      return;
    }
    
    if (formData.mesaj.length > 250) {
      alert('Mesaj en fazla 250 karakter olabilir.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/yayinci_bagis.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yayinci_user_id: yayinci.user_id,
          bagisci_user_id: user.id,
          bagisci_adi: formData.bagisci_adi,
          tutar: tutar,
          mesaj: formData.mesaj,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Bağış başarıyla gönderildi!');
        
        // Formu temizle
        setFormData({
          bagisci_adi: user.fullname || '',
          tutar: '',
          mesaj: '',
        });
        
        // Bakiyeyi güncelle
        if (data.new_balance !== undefined) {
          setBalance(data.new_balance);
          // localStorage'daki user'ı güncelle
          const updatedUser = { ...user, balance: data.new_balance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Bağış listesini yenile
        fetchBagislar(yayinci.user_id);
      } else {
        alert(data.message || 'Bağış gönderilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Bağış hatası:', error);
      alert('Bağış gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!yayinci) {
    return (
      <>
        <Topbar />
        <section className="FullPageArea">
          <div className="FullPageHeader">
            <div className="SetContent">
              <h1>Yayıncı Bulunamadı</h1>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <section className="FullPageArea">
        <div className="FullPageHeader">
          <div className="SetContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>{yayinci.sayfa_basligi || yayinci.fullname || 'YAYINCI DESTEKLE'}</h1>
              <Link to="/yayinci-basvuru" className="BtnStreamApp" style={{ textDecoration: 'none' }}>
                YAYINCI BAŞVURUSU YAP
              </Link>
            </div>
            <div className="PageNavigation">
              <ul>
                <li><Link to="/">Anasayfa</Link></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li>{yayinci.sayfa_basligi || 'Yayıncı Destekle'}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="Alt-Page-Area">
          <div className="StreamerBG" style={{ display: 'flex', gap: '20px' }}>
            {/* Sol Taraf - Form ve Video */}
            <div style={{ flex: '1', minWidth: '0' }}>
              <div className="StreamVideo">
                {yayinci.yayin_linki ? (
                  <iframe 
                    src={yayinci.yayin_linki.includes('twitch.tv') 
                      ? `https://player.twitch.tv/?channel=${yayinci.yayin_linki.split('/').pop()}&muted=false`
                      : yayinci.yayin_linki
                    } 
                    height="450" 
                    width="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowFullScreen={true}
                  ></iframe>
                ) : (
                  <div style={{ 
                    height: '450px', 
                    background: '#1a1a1a', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    Yayın linki bulunamadı
                  </div>
                )}
              </div>
              <div className="Streaminfo">
                <form onSubmit={handleSubmit}>
                  <p>
                    <label>Adınız <span className="text-jrv-red">*</span></label>
                    <input
                      type="text"
                      name="bagisci_adi"
                      className="streaminput"
                      placeholder="Yayıncının ekranında görünecek isim"
                      value={formData.bagisci_adi}
                      onChange={handleInputChange}
                      required
                    />
                  </p>
                  <p>
                    <label>Tutar <span className="text-jrv-red">*</span></label>
                    <input
                      type="text"
                      name="tutar"
                      className="streaminput"
                      placeholder="0.00"
                      value={formData.tutar}
                      onChange={handleInputChange}
                      required
                    />
                    <small style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Mevcut Bakiye: {balance}
                    </small>
                  </p>
                  <p>
                    <label>Mesajınız <span className="text-jrv-red">*</span></label>
                    <textarea
                      name="mesaj"
                      cols="100"
                      rows="5"
                      className="streaminput"
                      placeholder="Mesajınız (Maks. 250 karakter)"
                      maxLength="250"
                      value={formData.mesaj}
                      onChange={handleInputChange}
                      required
                    />
                    <small style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {formData.mesaj.length}/250 karakter
                    </small>
                  </p>
                  <p>
                    <button
                      type="submit"
                      className="BtnStreamApp"
                      disabled={loading}
                      style={{
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'GÖNDERİLİYOR...' : 'DESTEKLE'}
                    </button>
                  </p>
                </form>
              </div>
            </div>

            {/* Sağ Taraf - Bağış Listesi */}
            <div style={{ width: '350px', minWidth: '350px' }}>
              <div style={{ 
                background: '#181A20', 
                borderRadius: '8px', 
                padding: '20px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
                  Son Bağışlar
                </h3>
                {bagislar.length === 0 ? (
                  <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                    Henüz bağış yapılmamış
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {bagislar.map((bagis) => (
                      <div
                        key={bagis.id}
                        style={{
                          background: '#1a1a1a',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #2a2a2a'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#fff', fontWeight: '600' }}>
                            {bagis.bagisci_adi}
                          </span>
                          <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                            {parseFloat(bagis.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                        </div>
                        {bagis.mesaj && (
                          <p style={{ color: '#aaa', fontSize: '13px', margin: '4px 0 0 0' }}>
                            {bagis.mesaj}
                          </p>
                        )}
                        <div style={{ color: '#666', fontSize: '11px', marginTop: '8px' }}>
                          {new Date(bagis.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="clear"></div>
        </div>
      </section>
    </>
  );
};

export default YayinciDestekle;

