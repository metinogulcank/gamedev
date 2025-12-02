import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../Components/Topbar';
import Sidebar from '../Components/Sidebar';

const paymentTabs = [
  { key: 'mycard', label: 'Kredi/Banka Kartı', img: '/images/cart1.png', desc: 'En Avantajlı Seçenek' },
  { key: 'authorize', label: 'Havale/EFT', img: '/images/cart2.png' },
  { key: 'payoneer', label: 'Papara', img: '/images/cart4.png' },
  { key: 'skrill', label: 'Jervis Pin', img: '/images/cart5.png' },
  { key: 'ininial', label: 'Ininial', img: '/images/cart6.png' },
  { key: 'paypall', label: 'Paypal', img: '/images/cart3.png' },
];

const Odeme = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('mycard');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState('8.750,05 TL');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            setBalance(u.balance || '8.750,05 TL');
        }
    }, []);

    const userName = user?.fullname || "Ahmet Kaplan";
    const userEmail = user?.email || "ahmetkaplan@gmail.com";

    const handleAddBalance = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Lütfen geçerli bir tutar girin.');
            return;
        }
        if (!userEmail) {
            alert('Kullanıcı bulunamadı.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('https://gamedev.mymedya.tr/api/add_balance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, amount, method: activeTab }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Bakiye başarıyla eklendi!');
                // Yeni bakiyeyi çek
                const res2 = await fetch('https://gamedev.mymedya.tr/api/get_user.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail }),
                });
                const data2 = await res2.json();
                if (data2.success) {
                    setBalance(data2.user.balance);
                    setUser(data2.user);
                    localStorage.setItem('user', JSON.stringify(data2.user));
                }
                setAmount('');
            } else {
                alert(data.message || 'Bakiye eklenemedi.');
            }
        } catch (err) {
            alert('Sunucuya ulaşılamadı.');
        }
        setLoading(false);
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
                                <h5>ÖDEME YAP</h5>
                                <div className="PeymentLeft">
                                    <div className="stepDetails">
                                        <div className="cards">
                                            {paymentTabs.map(tab => (
                                                <div
                                                    key={tab.key}
                                                    className={`card${activeTab === tab.key ? ' active' : ''}`}
                                                    data-class={tab.key}
                                                    onClick={() => setActiveTab(tab.key)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="radio">
                                                        <input
                                                            id={`radio-${tab.key}`}
                                                            name="radio"
                                                            type="radio"
                                                            checked={activeTab === tab.key}
                                                            readOnly
                                                        />
                                                        <label htmlFor={`radio-${tab.key}`} className="radio-label">
                                                            <h2>{tab.label}</h2>
                                                            {tab.desc && <p>{tab.desc}</p>}
                                                        </label>
                                                    </div>
                                                    <span>
                                                        <img src={tab.img} alt={tab.label} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="PeymentRight">
                                    <div className="action">
                                        <div className="mycard" style={{ display: activeTab === 'mycard' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Kredi/Banka Kartı</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <label>Ödenecek Tutar</label>
                                                            <input type="text" className="Globalinput" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="name">
                                                            <label>Kart Üzerindeki Ad Soyad</label>
                                                            <input type="text" id="kartadsoyad" name="fname" className="Globalinput" />
                                                        </div>
                                                        <div className="number">
                                                            <label>Kart Numarası</label>
                                                            <input type="text" id="kartno" name="fname" className="Globalinput" />
                                                        </div>
                                                        <div>
                                                            <div className="expiry">
                                                                <label>AY</label>
                                                                <select className="GlobalSelect">
                                                                    <option>Ocak</option>
                                                                    <option>Şubat</option>
                                                                    <option>Mart</option>
                                                                </select>
                                                            </div>
                                                            <div className="expiry">
                                                                <label>YIL</label>
                                                                <select className="GlobalSelect">
                                                                    <option>2024</option>
                                                                    <option>2025</option>
                                                                    <option>2026</option>
                                                                </select>
                                                            </div>
                                                            <div className="cvv">
                                                                <label>CVV</label>
                                                                <input type="text" id="cvv" name="fname" className="Globalinput" />
                                                            </div>
                                                            <div className="clear"></div>
                                                        </div>
                                                        <div className="number">
                                                            <select className="GlobalSelect">
                                                                <option>Tek Çekim %1.30 Komisyon</option>
                                                                <option>2 Taksit (%3) Komisyon</option>
                                                                <option>3 Taksit (%4) Komisyon</option>
                                                                <option>4 Taksit (%5) Komisyon</option>
                                                                <option>5 Taksit (%6) Komisyon</option>
                                                            </select>
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'ÖDEME YAP'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="authorize" style={{ display: activeTab === 'authorize' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Havale/EFT</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <label>Ödeme Yaptığınız Tutar</label>
                                                            <input type="text" className="Globalinput" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'BİLDİRİM GÖNDER'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="payoneer" style={{ display: activeTab === 'payoneer' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Papara</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <label>Miktar</label>
                                                            <input type="text" className="Globalinput" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'DEVAM ET'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="skrill" style={{ display: activeTab === 'skrill' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Jervis Pin</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <input type="text" className="Globalinput" placeholder="JRVS-XXXX-XXXX-XXXX veya Miktar" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'KULLAN'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ininial" style={{ display: activeTab === 'ininial' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Ininial</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <label>Miktar</label>
                                                            <input type="text" className="Globalinput" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'ÖDEME YAP'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="paypall" style={{ display: activeTab === 'paypall' ? 'block' : 'none' }}>
                                            <div className="form signin-up">
                                                <div className="form-header">
                                                    <h1>Paypal</h1>
                                                </div>
                                                <div className="saved-card">
                                                    <form onSubmit={handleAddBalance}>
                                                        <div className="name">
                                                            <label>Miktar</label>
                                                            <input type="text" className="Globalinput" value={amount} onChange={e => setAmount(e.target.value)} />
                                                        </div>
                                                        <div className="number">
                                                            <button className="GlobalButton w-100" type="submit" disabled={loading}>{loading ? 'Yükleniyor...' : 'ÖDEME YAP'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="clear"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Odeme;
