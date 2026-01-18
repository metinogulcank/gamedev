import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';
import YayinciBasvuru from './YayinciBasvuru';
import YayinciBasvuru2 from './YayinciBasvuru2';

const editableFields = [
  { key: 'fullname', label: 'Adınız Soyadınız', type: 'text' },
  { key: 'email', label: 'E-posta Adresi', type: 'email' },
  { key: 'trade_url', label: 'Steam Trade URL', type: 'url' },
  { key: 'phone', label: 'Telefon Numaranız', type: 'text' },
  { key: 'tc_no', label: 'TC Kimlik Numaranız', type: 'text' },
  { key: 'birthdate', label: 'Doğum Tarihiniz', type: 'date' },
  { key: 'gender', label: 'Cinsiyet', type: 'select', options: ['', 'Erkek', 'Kadın', 'Diğer'] },
  { key: 'sms_notifications', label: 'SMS Bildirimleri', type: 'checkbox' },
  { key: 'email_notifications', label: 'E-Mail Bildirimleri', type: 'checkbox' },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bilgilerim'); // 'bilgilerim' veya 'destekle'
  
  // Destekle tab için state'ler
  const [yayincilar, setYayincilar] = useState([]);
  const [selectedYayinci, setSelectedYayinci] = useState(null);
  const [bagislar, setBagislar] = useState([]);
  const [bagisLoading, setBagisLoading] = useState(false);
  const [showBasvuruModal, setShowBasvuruModal] = useState(false);
  const [basvuruStep, setBasvuruStep] = useState(1);
  const [formData, setFormData] = useState({
    bagisci_adi: '',
    tutar: '',
    mesaj: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch('https://elephunt.com/api/get_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setFieldValues(data.user);
          setFormData(prev => ({
            ...prev,
            bagisci_adi: data.user.fullname || ''
          }));
        }
      });
    
    // Yayıncıları getir
    fetchYayincilar();
  }, []);

  useEffect(() => {
    if (selectedYayinci && activeTab === 'destekle') {
      fetchBagislar(selectedYayinci.user_id);
    }
  }, [selectedYayinci, activeTab]);

  const fetchYayincilar = async () => {
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/yayincilar_listesi.php');
      const data = await response.json();
      
      if (data.success) {
        setYayincilar(data.data || []);
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

  const handleBagisInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBagisSubmit = async (e) => {
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
    
    const currentBalance = parseFloat((user.balance || '0').toString().replace(/[^\d,]/g, '').replace(',', '.'));
    if (tutar > currentBalance) {
      alert(`Yetersiz bakiye! Mevcut bakiye: ${user.balance || '0,00 TL'}`);
      return;
    }
    
    if (formData.mesaj.length > 250) {
      alert('Mesaj en fazla 250 karakter olabilir.');
      return;
    }
    
    setBagisLoading(true);
    
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
        
        setFormData({
          bagisci_adi: user.fullname || '',
          tutar: '',
          mesaj: '',
        });
        
        if (data.new_balance !== undefined) {
          const updatedUser = { ...user, balance: data.new_balance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        fetchBagislar(selectedYayinci.user_id);
        fetchYayincilar();
      } else {
        alert(data.message || 'Bağış gönderilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Bağış hatası:', error);
      alert('Bağış gönderilirken bir hata oluştu.');
    } finally {
      setBagisLoading(false);
    }
  };

  const handleBasvuruModalClose = () => {
    setShowBasvuruModal(false);
    setBasvuruStep(1);
  };

  const handleChange = (key, value) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setFieldValues(user);
    setEditMode(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    // Tüm alanları tek tek güncelle (toplu API yoksa)
    let success = true;
    let lastError = '';
    for (const field of editableFields) {
      if (user[field.key] !== fieldValues[field.key]) {
        const res = await fetch('https://elephunt.com/api/update_user.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, field: field.key, value: fieldValues[field.key] }),
        });
        const data = await res.json();
        if (!data.success) {
          success = false;
          lastError = data.message || lastError;
        }
      }
    }
    if (success) {
      setUser(fieldValues);
      setEditMode(false);
      // localStorage'daki user'ı güncelle ki uygulamanın diğer yerleri de yeni değeri görsün
      const updated = { ...(user || {}), ...fieldValues };
      localStorage.setItem('user', JSON.stringify(updated));
    } else {
      alert(lastError || 'Bazı alanlar kaydedilemedi.');
    }
    setLoading(false);
  };

  if (!user) return <div>Yükleniyor...</div>;

  // Yardımcı fonksiyonlar
  const maskTC = tc => tc ? tc.replace(/(\d{3})\d{5}(\d{2})/, '$1******$2') : '-';
  const formatDate = date => date && date !== '0000-00-00' ? new Date(date).toLocaleDateString('tr-TR') : '-';
  const genderText = g => g || '-';

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
                {/* Tab Menüsü */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '20px',
                  borderBottom: '2px solid #2a2a2a'
                }}>
                  <button
                    onClick={() => setActiveTab('bilgilerim')}
                    style={{
                      padding: '12px 24px',
                      background: activeTab === 'bilgilerim' ? '#7e00d4' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      borderBottom: activeTab === 'bilgilerim' ? '2px solid #7e00d4' : '2px solid transparent',
                      marginBottom: '-2px',
                      transition: 'all 0.3s'
                    }}
                  >
                    KULLANICI BİLGİLERİM
                  </button>
                  <button
                    onClick={() => setActiveTab('destekle')}
                    style={{
                      padding: '12px 24px',
                      background: activeTab === 'destekle' ? '#7e00d4' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      borderBottom: activeTab === 'destekle' ? '2px solid #7e00d4' : '2px solid transparent',
                      marginBottom: '-2px',
                      transition: 'all 0.3s'
                    }}
                  >
                    DESTEKLE
                  </button>
                </div>

                {/* Tab İçerikleri */}
                {activeTab === 'bilgilerim' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5>KULLANICI BİLGİLERİM</h5>
                    </div>
                <ul className="CardBlokFull">
                  <li>
                    <div className="CardTitle" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>HESAP BİLGİLERİM {!editMode && (
                    <button onClick={handleEdit} style={{ padding: '6px 18px', fontWeight: 600, fontSize: 15, borderRadius: 6, background: '#191b1f', cursor: 'pointer' }}>Düzenle</button>
                  )}{editMode && (
                    <div style={{display: 'flex', gap: 12 }}>
                      <button onClick={handleSave} disabled={loading} className="profile-edit-btn" style={{ padding: '6px 18px', fontWeight: 600, fontSize: 15, borderRadius: 6, background: '#191b1f', cursor: 'pointer' }}>Kaydet</button>
                      <button onClick={handleCancel} disabled={loading} className="profile-edit-btn" style={{ padding: '6px 18px', fontWeight: 600, fontSize: 15, borderRadius: 6, background: '#191b1f', cursor: 'pointer' }}>İptal</button>
                    </div>
                  )}</div>

                    <div className="CardContent">
                      <table className="accountinfotable SetOddEven">
                        <tbody>
                          {editableFields.map(field => (
                            <tr key={field.key}>
                              <td className="profile-edit-label">{field.label}</td>
                              <td>
                                {editMode ? (
                                  field.type === 'select' ? (
                                    <select
                                      className="profile-edit-select"
                                      value={fieldValues[field.key] || ''}
                                      onChange={e => handleChange(field.key, e.target.value)}
                                    >
                                      {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt || 'Belirtilmedi'}</option>
                                      ))}
                                    </select>
                                  ) : field.type === 'checkbox' ? (
                                    <input
                                      className="profile-edit-input"
                                      type="checkbox"
                                      checked={!!fieldValues[field.key]}
                                      onChange={e => handleChange(field.key, e.target.checked ? 1 : 0)}
                                    />
                                  ) : field.type === 'date' ? (
                                    <input
                                      className="profile-edit-input"
                                      type="date"
                                      value={fieldValues[field.key] || ''}
                                      onChange={e => handleChange(field.key, e.target.value)}
                                    />
                                  ) : (
                                    <input
                                      className="profile-edit-input"
                                      type={field.type}
                                      value={fieldValues[field.key] || ''}
                                      onChange={e => handleChange(field.key, e.target.value)}
                                    />
                                  )
                                ) : field.key === 'tc_no' ? (
                                  maskTC(user.tc_no)
                                ) : field.key === 'birthdate' ? (
                                  formatDate(user.birthdate)
                                ) : field.key === 'gender' ? (
                                  genderText(user.gender)
                                ) : field.type === 'checkbox' ? (
                                  <label className="switch">
                                    <input type="checkbox" checked={!!user[field.key]} readOnly />
                                    <span className="slider round"></span>
                                  </label>
                                ) : (
                                  user[field.key] || '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </li>
                </ul>
                  </>
                )}

                {activeTab === 'destekle' && (
                  <div>
                    <h5 style={{ marginBottom: '20px' }}>DESTEKLE</h5>

                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardTitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>YAYINCI BAŞVURUSU YAP</span>
                          <button 
                            onClick={() => setShowBasvuruModal(true)}
                            className="BtnStreamApp"
                            style={{ 
                              textDecoration: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '8px 20px',
                              float: 'none'
                            }}
                          >
                            YAYINCI BAŞVURUSU YAP
                          </button>
                        </div>
                      </li>
                    </ul>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                      {/* Sol Taraf - %30 */}
                      <div style={{ width: '30%', minWidth: '300px' }}>
                        <ul className="CardBlokFull">
                          <li>
                            <div className="CardTitle">Yayıncı Seç</div>
                            <div className="CardContent">
                              {yayincilar.length === 0 ? (
                                <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                                  Henüz yayıncı bulunmamaktadır
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                  {yayincilar.map((yayinci) => (
                                    <div
                                      key={yayinci.id}
                                      onClick={() => setSelectedYayinci(yayinci)}
                                      style={{
                                        background: selectedYayinci?.id === yayinci.id ? 'rgba(126, 0, 212, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: selectedYayinci?.id === yayinci.id ? '2px solid #7e00d4' : '1px solid rgba(43, 49, 58, 1)',
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
                          </li>
                        </ul>

                        {selectedYayinci && (
                          <ul className="CardBlokFull" style={{ marginTop: '20px' }}>
                            <li>
                              <div className="CardTitle">Bağış Yap</div>
                              <div className="CardContent">
                                <form onSubmit={handleBagisSubmit}>
                                  <table className="streamapptable">
                                    <tbody>
                                      <tr>
                                        <td>Yayın Linki</td>
                                        <td>
                                          <input
                                            type="text"
                                            className="streamappinput"
                                            value={selectedYayinci.yayin_linki || ''}
                                            readOnly
                                            style={{ background: 'rgba(0, 0, 0, 0.6)', cursor: 'not-allowed', color: '#888' }}
                                          />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>Kullanıcı Adı</td>
                                        <td>
                                          <input
                                            type="text"
                                            name="bagisci_adi"
                                            className="streamappinput"
                                            placeholder="Adınız"
                                            value={formData.bagisci_adi}
                                            onChange={handleBagisInputChange}
                                            required
                                          />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>Açıklama</td>
                                        <td>
                                          <textarea
                                            name="mesaj"
                                            className="streamappinput"
                                            rows="3"
                                            placeholder="Mesajınız (Maks. 250 karakter)"
                                            maxLength="250"
                                            value={formData.mesaj}
                                            onChange={handleBagisInputChange}
                                            required
                                            style={{ resize: 'vertical', minHeight: '60px' }}
                                          />
                                          <small style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            {formData.mesaj.length}/250 karakter
                                          </small>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>Bağış Miktarı</td>
                                        <td>
                                          <input
                                            type="text"
                                            name="tutar"
                                            className="streamappinput"
                                            placeholder="0.00"
                                            value={formData.tutar}
                                            onChange={handleBagisInputChange}
                                            required
                                          />
                                          <small style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                            Mevcut Bakiye: {user?.balance || '0,00 TL'}
                                          </small>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td></td>
                                        <td>
                                          <button
                                            type="submit"
                                            className="BtnStreamApp"
                                            disabled={bagisLoading}
                                            style={{
                                              width: '100%',
                                              cursor: bagisLoading ? 'not-allowed' : 'pointer',
                                              opacity: bagisLoading ? 0.6 : 1,
                                              float: 'none'
                                            }}
                                          >
                                            {bagisLoading ? 'GÖNDERİLİYOR...' : 'DESTEKLE'}
                                          </button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </form>
                              </div>
                            </li>
                          </ul>
                        )}
                      </div>

                      {/* Sağ Taraf - %70 */}
                      <div style={{ flex: '1', minWidth: '0' }}>
                        {selectedYayinci ? (
                          <ul className="CardBlokFull">
                            <li>
                              <div className="CardTitle">
                                {selectedYayinci.sayfa_basligi || selectedYayinci.fullname} - Bağış Geçmişi
                              </div>
                              <div className="CardContent">
                                {bagislar.length === 0 ? (
                                  <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                                    Henüz bağış yapılmamış
                                  </p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    {bagislar.map((bagis) => (
                                      <div
                                        key={bagis.id}
                                        style={{
                                          background: 'rgba(0, 0, 0, 0.4)',
                                          padding: '15px',
                                          borderRadius: '6px',
                                          border: '1px solid rgba(43, 49, 58, 1)'
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>
                                            {bagis.bagisci_adi}
                                          </span>
                                          <span style={{ color: '#70d929', fontWeight: '600', fontSize: '16px' }}>
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
                            </li>
                          </ul>
                        ) : (
                          <ul className="CardBlokFull">
                            <li>
                              <div className="CardTitle">Bağış Geçmişi</div>
                              <div className="CardContent">
                                <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>
                                  Lütfen bir yayıncı seçiniz
                                </p>
                              </div>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="clear"></div>
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

export default Profile;
