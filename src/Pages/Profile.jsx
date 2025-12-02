import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

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

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch('https://gamedev.mymedya.tr/api/get_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setFieldValues(data.user);
        }
      });
  }, []);

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
        const res = await fetch('https://gamedev.mymedya.tr/api/update_user.php', {
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
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
