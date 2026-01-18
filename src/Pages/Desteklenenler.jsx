import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Topbar from '../Components/Topbar';
import YayinciBasvuru from './YayinciBasvuru';
import YayinciBasvuru2 from './YayinciBasvuru2';

const Desteklenenler = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [yayincilar, setYayincilar] = useState([]);
  const [selectedYayinci, setSelectedYayinci] = useState(null);
  const [bagislar, setBagislar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBasvuruModal, setShowBasvuruModal] = useState(false);
  const [basvuruStep, setBasvuruStep] = useState(1); // 1 veya 2
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
    
    // Onaylanmış yayıncıları getir
    fetchYayincilar();
  }, []);

  useEffect(() => {
    // Seçili yayıncı değiştiğinde bağışları getir
    if (selectedYayinci) {
      fetchBagislar(selectedYayinci.user_id);
    }
  }, [selectedYayinci]);

  const fetchYayincilar = async () => {
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/yayincilar_listesi.php');
      const data = await response.json();
      
      if (data.success) {
        setYayincilar(data.data || []);
        // İlk yayıncıyı varsayılan olarak seç
        if (data.data && data.data.length > 0) {
          setSelectedYayinci(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Yayıncılar yüklenirken hata:', error);
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
    
    if (!selectedYayinci || !selectedYayinci.user_id) {
      alert('Lütfen bir yayıncı seçiniz.');
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
          yayinci_user_id: selectedYayinci.user_id,
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
          const updatedUser = { ...user, balance: data.new_balance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Bağış listesini yenile
        fetchBagislar(selectedYayinci.user_id);
        // Yayıncı listesini yenile (toplam bağış güncellenir)
        fetchYayincilar();
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

  const handleBasvuruModalClose = () => {
    setShowBasvuruModal(false);
    setBasvuruStep(1);
  };

  return (
    <>
      <Topbar />
      <section className="FullPageArea">
        <div className="FullPageHeader">
          <div className="SetContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>DESTEKLE</h1>
              <button 
                onClick={() => setShowBasvuruModal(true)}
                className="BtnStreamApp"
                style={{ 
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                YAYINCI BAŞVURUSU YAP
              </button>
            </div>
            <div className="PageNavigation">
              <ul>
                <li><Link to="/">Anasayfa</Link></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li>Destekle</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="Alt-Page-Area">
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Sol Taraf - %30 */}
            <div style={{ width: '30%', minWidth: '300px' }}>
              <div style={{ 
                background: '#181A20', 
                borderRadius: '8px', 
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
                  Yayıncı Seç
                </h3>
                {yayincilar.length === 0 ? (
                  <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                    Henüz yayıncı bulunmamaktadır
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {yayincilar.map((yayinci) => (
                      <div
                        key={yayinci.id}
                        onClick={() => setSelectedYayinci(yayinci)}
                        style={{
                          background: selectedYayinci?.id === yayinci.id ? '#2a2a2a' : '#1a1a1a',
                          padding: '12px',
                          borderRadius: '6px',
                          border: selectedYayinci?.id === yayinci.id ? '2px solid #7e00d4' : '1px solid #2a2a2a',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                          {yayinci.sayfa_basligi || yayinci.fullname}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>
                          Toplam: {parseFloat(yayinci.toplam_bagis || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedYayinci && (
                <div style={{ 
                  background: '#181A20', 
                  borderRadius: '8px', 
                  padding: '20px'
                }}>
                  <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
                    Bağış Yap
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                        Yayın Linki
                      </label>
                      <input
                        type="text"
                        className="streaminput"
                        value={selectedYayinci.yayin_linki || ''}
                        readOnly
                        style={{ background: '#0a0a0a', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                        Kullanıcı Adı
                      </label>
                      <input
                        type="text"
                        name="bagisci_adi"
                        className="streaminput"
                        placeholder="Adınız"
                        value={formData.bagisci_adi}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                        Açıklama
                      </label>
                      <textarea
                        name="mesaj"
                        className="streaminput"
                        rows="3"
                        placeholder="Mesajınız (Maks. 250 karakter)"
                        maxLength="250"
                        value={formData.mesaj}
                        onChange={handleInputChange}
                        required
                      />
                      <small style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {formData.mesaj.length}/250 karakter
                      </small>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
                        Bağış Miktarı
                      </label>
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
                    </div>
                    <button
                      type="submit"
                      className="BtnStreamApp"
                      disabled={loading}
                      style={{
                        width: '100%',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'GÖNDERİLİYOR...' : 'DESTEKLE'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sağ Taraf - %70 */}
            <div style={{ flex: '1', minWidth: '0' }}>
              {selectedYayinci ? (
                <div style={{ 
                  background: '#181A20', 
                  borderRadius: '8px', 
                  padding: '20px'
                }}>
                  <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
                    {selectedYayinci.sayfa_basligi || selectedYayinci.fullname} - Bağış Geçmişi
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
                            padding: '15px',
                            borderRadius: '6px',
                            border: '1px solid #2a2a2a'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>
                              {bagis.bagisci_adi}
                            </span>
                            <span style={{ color: '#4CAF50', fontWeight: '600', fontSize: '16px' }}>
                              {parseFloat(bagis.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </span>
                          </div>
                          {bagis.mesaj && (
                            <p style={{ color: '#aaa', fontSize: '14px', margin: '8px 0' }}>
                              {bagis.mesaj}
                            </p>
                          )}
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                            {new Date(bagis.created_at).toLocaleString('tr-TR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  background: '#181A20', 
                  borderRadius: '8px', 
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#aaa' }}>Lütfen bir yayıncı seçiniz</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Yayıncı Başvuru Modal */}
      {showBasvuruModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            overflowY: 'auto',
            padding: '20px'
          }}
          onClick={handleBasvuruModalClose}
        >
          <div
            style={{
              background: '#181A20',
              borderRadius: '18px',
              padding: '0',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBasvuruModalClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '32px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001
              }}
            >
              ×
            </button>
            {basvuruStep === 1 ? (
              <div style={{ padding: '40px' }}>
                <h2 style={{ color: '#fff', marginBottom: '30px', fontSize: '24px' }}>
                  YAYINCI BAŞVURUSU
                </h2>
                <YayinciBasvuru onNext={() => setBasvuruStep(2)} isModal={true} />
              </div>
            ) : (
              <div style={{ padding: '40px' }}>
                <h2 style={{ color: '#fff', marginBottom: '30px', fontSize: '24px' }}>
                  YAYINCI BAŞVURUSU
                </h2>
                <YayinciBasvuru2 
                  onComplete={() => {
                    handleBasvuruModalClose();
                    // Yayıncı listesini yenile
                    fetchYayincilar();
                  }} 
                  isModal={true} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Desteklenenler;


