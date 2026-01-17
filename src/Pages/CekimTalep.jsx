import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const cekimMethods = [
  { key: 'banka', label: 'Banka Hesabına Çekim Yap', img: '/images/cart2.png' },
  { key: 'kart', label: 'Kredi Kartına Çekim Yap', img: '/images/cart1.png' },
  { key: 'papara', label: 'Papara Hesabına Çekim Yap', img: '/images/cart4.png' },
  { key: 'jervis', label: 'Jervis Pin Hesabına Çekim Yap', img: '/images/cart5.png' },
  { key: 'ininial', label: 'Ininial Hesabına Çekim Yap', img: '/images/cart6.png' },
];

const hesaplar = [
  'Garanti Bankası - TR 2222 3333 4444 5555 6666',
  'Akbank - TR 2222 3333 4444 5555 6666',
  'Türkiye İş Bankası - TR 2222 3333 4444 5555 6666',
];

const CekimTalep = () => {
  const [step, setStep] = useState(0); // 0: seçim, 1: çekim formu, 2: hesap ekle
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedHesap, setSelectedHesap] = useState('');
  const [tutar, setTutar] = useState('');
  const [iban, setIban] = useState('TR ');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState('...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
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
            setBalance(data.user.balance || '0,00 TL');
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (!user) return <div>Giriş yapmalısınız.</div>;

  console.log('user:', user);
  const userName = user.fullname;
  const userEmail = user.email;
  const userId = user.id || user.user_id;

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
                {step === 0 ? (
                  <>
                    <h5>ÇEKİM TALEP ET</h5>
                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardTitle">TALEP BİLGİLERİM</div>
                        <div className="CardContent">
                          <table className="accountinfotable SetOddEven">
                            <tbody>
                              {cekimMethods.map(method => (
                                <tr key={method.key}>
                                  <td><img src={method.img} alt={method.label} /></td>
                                  <td>
                                    <button className="BtnCekimTalep" onClick={() => { setSelectedMethod(method.key); setStep(1); }}>{method.label}</button>
                                  </td>
                                  <td></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </li>
                    </ul>
                  </>
                ) : step === 1 ? (
                  <>
                    <h5>ÇEKİM TALEP ET</h5>
                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardTitle">BAKİYE BİLGİLERİM <span><button type="button" className="BtnTalep" style={{background:'none',color:'#007bff',border:'none',padding:0,cursor:'pointer'}} onClick={() => setStep(2)}>Yeni Hesap Ekle <i className="fas fa-arrow-right"></i></button></span></div>
                        <div className="CardContent">
                          <table className="accountinfotable SetOddEven">
                            <tbody>
                              <tr>
                                <td>Çekilebilir Tutar</td>
                                <td>
                                  <label className="balance">{balance}</label>
                                </td>
                                <td></td>
                              </tr>
                              <tr>
                                <td>Hesap Bilgileri</td>
                                <td>
                                  <select className="magazainput" value={selectedHesap} onChange={e => setSelectedHesap(e.target.value)}>
                                    <option value="">Lütfen Hesap Seçiniz</option>
                                    {hesaplar.map(h => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </td>
                                <td></td>
                              </tr>
                                                             <tr>
                                 <td>Çekmek İstenilen Tutar</td>
                                 <td>
                                   <textarea 
                                     className="magazainput" 
                                     value={tutar} 
                                     onChange={e => setTutar(e.target.value)} 
                                     placeholder="Örn: 100 veya 100,50"
                                     cols={40} 
                                     rows={2} 
                                   />
                                   <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                     Mevcut bakiye: {balance}
                                   </div>
                                 </td>
                                 <td></td>
                               </tr>
                              <tr>
                                <td></td>
                                <td>
                                                                     <button 
                                     className="BtnTalep" 
                                     onClick={async () => {
                                       // Detaylı validasyon
                                       let errorMessage = '';
                                       
                                       if (!tutar.trim()) {
                                         errorMessage += '• Tutar alanı boş bırakılamaz\n';
                                       }
                                       
                                       if (!selectedHesap) {
                                         errorMessage += '• Lütfen hesap seçiniz\n';
                                       }
                                       
                                       if (errorMessage) {
                                         alert('Lütfen aşağıdaki alanları doldurun:\n\n' + errorMessage);
                                         return;
                                       }
                                       
                                       const amount = parseFloat(tutar.replace(',', '.'));
                                       if (isNaN(amount) || amount <= 0) {
                                         alert('Geçerli bir tutar giriniz! (Örn: 100 veya 100,50)');
                                         return;
                                       }
                                       
                                       // Bakiye kontrolü
                                       const currentBalance = parseFloat(balance.toString().replace(/[^\d,]/g, '').replace(',', '.'));
                                       if (amount > currentBalance) {
                                         alert(`Yetersiz bakiye! Mevcut bakiye: ${balance}\nÇekmek istediğiniz tutar: ${amount.toFixed(2)}₺`);
                                         return;
                                       }
                                      
                                      try {
                                        const response = await fetch('https://elephunt.com/api/withdraw_balance.php', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            email: userEmail,
                                            amount: amount,
                                            withdraw_method: selectedMethod,
                                            account_info: selectedHesap
                                          })
                                        });
                                        
                                        const data = await response.json();
                                                                                 if (data.success) {
                                           alert('Çekim talebiniz alındı!');
                                           setTutar('');
                                           setSelectedHesap('');
                                           setStep(0);
                                          
                                          // Kullanıcı bilgilerini güncelle (bakiye)
                                          const stored = localStorage.getItem('user');
                                          if (stored) {
                                            const userData = JSON.parse(stored);
                                            userData.balance = data.new_balance;
                                            localStorage.setItem('user', JSON.stringify(userData));
                                            setBalance(data.new_balance + ' TL');
                                          }
                                        } else {
                                          alert('Hata: ' + (data.message || 'Çekim talebi alınamadı!'));
                                        }
                                      } catch (err) {
                                        console.error('Çekim hatası:', err);
                                        alert('Sunucu hatası veya bağlantı sorunu!');
                                      }
                                    }}
                                  >
                                    ÖDEME TALEP ET
                                  </button>
                                  <button style={{ marginLeft: 16 }} className="BtnTalep" onClick={() => setStep(0)}>Geri</button>
                                </td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <h5>HESAP EKLE</h5>
                    <ul className="CardBlokFull">
                      <li>
                        <div className="CardTitle">HESAP BİLGİLERİM</div>
                        <div className="CardContent">
                          <table className="accountinfotable SetOddEven">
                            <tbody>
                              <tr>
                                <td>Ad Soyad</td>
                                <td><textarea cols={40} rows={2} className="magazainput" disabled value={userName}></textarea></td>
                                <td></td>
                              </tr>
                              <tr>
                                <td>IBAN*</td>
                                <td>
                                  <textarea cols={40} rows={2} className="magazainput" value={iban} onChange={e => setIban(e.target.value)}></textarea>
                                </td>
                                <td></td>
                              </tr>
                              <tr>
                                <td>Önemli NOT</td>
                                <td>Para çekeceğiniz IBAN'a ait hesap, adınıza ait olmalıdır. Aksi takdirde paranız aktarılmaz!</td>
                                <td></td>
                              </tr>
                              <tr>
                                <td></td>
                                <td>
                                  <button
                                    className="BtnTalep"
                                    onClick={async () => {
                                      console.log('userId:', userId, 'userName:', userName, 'iban:', iban);
                                      if (!userId || !userName || !iban) {
                                        alert('Lütfen tüm alanları doldurun!');
                                        return;
                                      }
                                      try {
                                        const response = await fetch('https://elephunt.com/api/add_account.php', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            user_id: userId,
                                            ad_soyad: userName,
                                            iban: iban
                                          })
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                          alert('Hesap başarıyla eklendi!');
                                          setStep(1);
                                          setIban('TR ');
                                        } else {
                                          alert('Hata: ' + (data.message || 'Hesap eklenemedi!'));
                                        }
                                      } catch (err) {
                                        alert('Sunucu hatası veya bağlantı sorunu!');
                                      }
                                    }}
                                  >
                                    HESAP EKLE
                                  </button>
                                  <button style={{ marginLeft: 16 }} className="BtnTalep" onClick={() => setStep(1)}>İptal</button>
                                </td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </li>
                    </ul>
                  </>
                )}
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CekimTalep;
