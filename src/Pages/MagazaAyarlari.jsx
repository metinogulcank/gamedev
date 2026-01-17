import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const MagazaAyarlari = () => {
  const [user, setUser] = useState(null);
  const [fields, setFields] = useState({
    store_name: '',
    store_description: '',
    store_url: '',
    store_logo: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
          setFields({
            store_name: data.user.store_name || '',
            store_description: data.user.store_description || '',
            store_url: data.user.store_url || '',
            store_logo: data.user.store_logo || '',
          });
        }
      });
  }, []);

  const handleChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFields(prev => ({ ...prev, store_logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogoIfNeeded = async (email) => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('email', email);
    formData.append('logo', logoFile);
    const res = await fetch('https://elephunt.com/api/upload_store_logo.php', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      return data.path || data.url || '';
    } else {
      throw new Error(data.message || 'Logo yüklenemedi');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const email = user.email;
      const uploadedLogoPath = await uploadLogoIfNeeded(email);
      const payload = {
        email,
        store_name: fields.store_name,
        store_description: fields.store_description,
        store_url: fields.store_url,
        store_logo: uploadedLogoPath ? uploadedLogoPath : (fields.store_logo || ''),
      };
      const res = await fetch('https://elephunt.com/api/update_store.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Mağaza ayarları kaydedildi.');
        const stored = localStorage.getItem('user');
        if (stored) {
          const updated = { ...(JSON.parse(stored) || {}), ...payload };
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } else {
        alert(data.message || 'Kaydetme başarısız.');
      }
    } catch (err) {
      alert(err.message || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

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
                <h5>MAĞAZA YÖNETİMİ</h5>
                <ul className="CardBlokFull">
                  <li>
                    <div className="CardTitle">MAĞAZA BİLGİLERİM</div>
                    <div className="CardContent">
                      <table className="accountinfotable">
                        <tbody>
                          <tr>
                            <td>Mağaza Adı</td>
                            <td>
                              <input
                                type="text"
                                className="magazainput"
                                value={fields.store_name}
                                onChange={e => handleChange('store_name', e.target.value)}
                              />
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td>Mağaza Açıklaması</td>
                            <td>
                              <textarea
                                cols="40"
                                rows="5"
                                className="magazainputArea"
                                maxLength={250}
                                placeholder="Maks. 250 karakter"
                                value={fields.store_description}
                                onChange={e => handleChange('store_description', e.target.value)}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td>Mağaza URL</td>
                            <td>
                              <input
                                type="text"
                                className="magazainput"
                                placeholder="Örn: jervisgame.com/magaza/nickname"
                                value={fields.store_url}
                                onChange={e => handleChange('store_url', e.target.value)}
                              />
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td>Mağaza Logo</td>
                            <td>
                              {fields.store_logo ? (
                                <img src={fields.store_logo} alt="Mağaza Logo" style={{ maxHeight: 100, borderRadius: 8 }} />
                              ) : (
                                <img src="/images/unknownuser.jpg" alt="Mağaza Logo" style={{ maxHeight: 100, borderRadius: 8 }} />
                              )}
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td>Logoyu Değiştir</td>
                            <td>
                              <input type="file" className="magazainput" accept="image/*" onChange={handleLogoChange} />
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td></td>
                            <td>
                              <a
                                href="#"
                                className="BtnCekimYap"
                                onClick={(e) => { e.preventDefault(); handleSave(); }}
                                style={{ opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto' }}
                              >
                                KAYDET
                              </a>
                            </td>
                            <td></td>
                          </tr>
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

export default MagazaAyarlari;

