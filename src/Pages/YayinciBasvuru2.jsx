import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const YayinciBasvuru2 = ({ onComplete, isModal = false }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    twitch_adresi: '',
    youtube_adresi: '',
    instagram_adresi: '',
    twitter_adresi: '',
    discord_adresi: '',
    tiktok_adresi: '',
    nimo_tv_adresi: '',
    dlive_adresi: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      
      // İlk adımdan gelen verileri al
      const step1Data = localStorage.getItem('yayinci_basvuru_step1');
      if (step1Data) {
        // Mevcut başvuru varsa sosyal medya bilgilerini getir
        if (userData.id) {
          fetchBasvuruData(userData.id);
        }
      } else if (!isModal) {
        // İlk adımdan gelmediyse geri yönlendir (sadece sayfa modunda)
        navigate('/yayinci-basvuru');
      }
    }
  }, [navigate, isModal]);

  const fetchBasvuruData = async (userId) => {
    try {
      const response = await fetch(`https://gamedev.mymedya.tr/api/yayinci_basvuru.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setFormData({
          twitch_adresi: data.data.twitch_adresi || '',
          youtube_adresi: data.data.youtube_adresi || '',
          instagram_adresi: data.data.instagram_adresi || '',
          twitter_adresi: data.data.twitter_adresi || '',
          discord_adresi: data.data.discord_adresi || '',
          tiktok_adresi: data.data.tiktok_adresi || '',
          nimo_tv_adresi: data.data.nimo_tv_adresi || '',
          dlive_adresi: data.data.dlive_adresi || '',
        });
      }
    } catch (error) {
      console.error('Başvuru bilgileri yüklenirken hata:', error);
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
      alert('Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.');
      return;
    }
    
    setLoading(true);
    
    try {
      // İlk adımdan gelen verileri al
      const step1Data = JSON.parse(localStorage.getItem('yayinci_basvuru_step1') || '{}');
      
      // Tüm verileri birleştir
      const allData = {
        user_id: user.id,
        ...step1Data,
        ...formData,
      };
      
      const response = await fetch('https://gamedev.mymedya.tr/api/yayinci_basvuru.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Başarılı - modal göster
        setShowModal(true);
        // localStorage'dan step1 verisini temizle
        localStorage.removeItem('yayinci_basvuru_step1');
      } else {
        alert(data.message || 'Başvuru kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Başvuru hatası:', error);
      alert('Başvuru kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    // Modal içindeyse onComplete çağır
    if (isModal && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 500);
    } else if (!isModal) {
      // İsteğe bağlı: Başvurularım sayfasına yönlendir
      // navigate('/yayinci-basvurularim');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit}>
                        <table className="streamapptable">
                          <tbody>
                            <tr>
                              <td>Twitch Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="twitch_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.twitch.tv/nickname"
                                  value={formData.twitch_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Youtube Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="youtube_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.youtube.com/user/nickname"
                                  value={formData.youtube_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Instagram Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="instagram_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.instagram.com/nickname"
                                  value={formData.instagram_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Twitter Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="twitter_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.twitter.com/nickname"
                                  value={formData.twitter_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Discord Sunucu Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="discord_adresi"
                                  className="streamappinput"
                                  placeholder="https://discord.gg/abcdefg"
                                  value={formData.discord_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Tiktok Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="tiktok_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.tiktok.com/nickname"
                                  value={formData.tiktok_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>NimoTV Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="nimo_tv_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.nimo.tv/nickname"
                                  value={formData.nimo_tv_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>DLive Adresiniz</td>
                              <td>
                                <input
                                  type="text"
                                  name="dlive_adresi"
                                  className="streamappinput"
                                  placeholder="https://www.dlive.tv/nickname"
                                  value={formData.dlive_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>
                                <button
                                  type="submit"
                                  className="BtnCekimYap"
                                  disabled={loading}
                                  style={{
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                  }}
                                >
                                  {loading ? 'KAYDEDİLİYOR...' : 'BAŞVURU YAP'}
                                </button>
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </form>
  );

  if (isModal) {
    return (
      <div>
        <div className="CardTitle" style={{ marginBottom: '20px' }}>SOSYAL MEDYA BİLGİLERİM</div>
        <div className="CardContent">
          {formContent}
        </div>
        {/* Başarı Modal */}
        {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={handleModalClose}
        >
          <div
            style={{
              background: '#181A20',
              borderRadius: '18px',
              padding: '48px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleModalClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>✓</div>
              <h2 style={{ color: '#fff', marginBottom: '16px', fontSize: '24px' }}>
                Başvurunuz Alındı
              </h2>
              <p style={{ color: '#aaa', marginBottom: '32px', lineHeight: '1.6' }}>
                Başvurunuz başarıyla kaydedildi. En kısa zamanda ekibimiz size geri dönüş sağlayacaktır.
              </p>
              <button
                onClick={handleModalClose}
                className="BtnCekimYap"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                TAMAM
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="NavBarOverlay"></div>
        <Topbar />
        <section className="ProfilPageArea">
          <div className="ProfilPageContent">
            <div className="SetContent">
              <div className="ProfilArea">
                <Sidebar />
                <div className="ProfilDetail">
                  <div>Yükleniyor...</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="NavBarOverlay"></div>
      <Topbar />
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5>YAYINCI BAŞVURUSU</h5>
                <ul className="CardBlokFull">
                  <li>
                    <div className="CardTitle">SOSYAL MEDYA BİLGİLERİM</div>
                    <div className="CardContent">
                      {formContent}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Başarı Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={handleModalClose}
        >
          <div
            style={{
              background: '#181A20',
              borderRadius: '18px',
              padding: '48px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleModalClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>✓</div>
              <h2 style={{ color: '#fff', marginBottom: '16px', fontSize: '24px' }}>
                Başvurunuz Alındı
              </h2>
              <p style={{ color: '#aaa', marginBottom: '32px', lineHeight: '1.6' }}>
                Başvurunuz başarıyla kaydedildi. En kısa zamanda ekibimiz size geri dönüş sağlayacaktır.
              </p>
              <button
                onClick={handleModalClose}
                className="BtnCekimYap"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                TAMAM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YayinciBasvuru2;

