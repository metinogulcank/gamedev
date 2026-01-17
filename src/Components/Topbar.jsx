import React, { useState, useEffect } from "react";

// AuthModal bileşenini import et
const AuthModal = ({ open, onClose, setUser }) => {
  const [mode, setMode] = useState('login'); // 'login' veya 'register'

  // Kayıt işlemi
  const handleRegister = async (e) => {
    e.preventDefault();
    const fullname = e.target.fullname?.value || '';
    const email = e.target.email.value;
    const password = e.target.password.value;
    const password2 = e.target.password2?.value || '';
    if (!fullname || !email || !password || !password2) {
      alert('Tüm alanları doldurun.');
      return;
    }
    if (password !== password2) {
      alert('Şifreler eşleşmiyor.');
      return;
    }
    try {
      const res = await fetch('https://elephunt.com/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        setMode('login');
      } else {
        alert(data.message || 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucuya ulaşılamıyor.');
    }
  };

  // Login işlemi
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    if (!email || !password) {
      alert('Tüm alanları doldurun.');
      return;
    }
    try {
      const res = await fetch('https://elephunt.com/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Giriş başarılı! Hoşgeldin, ' + data.user.fullname);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        onClose();
        window.location.reload(); // Sayfayı yenile
      } else {
        alert(data.message || 'E-posta veya şifre hatalı.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucuya ulaşılamıyor.');
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      style={{
        display: open ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="auth-modal-content"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: open ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(0.8)',
          width: '500px',
          maxWidth: '95vw',
          background: '#181A20',
          borderRadius: 18,
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
          padding: 48,
          transition: 'all 0.4s cubic-bezier(.77,0,.18,1)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          style={{
            position: 'absolute',
            top: 18,
            right: 24,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 32,
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          ×
        </button>
        <h2 style={{ color: '#fff', marginBottom: 32, fontSize: 28 }}>
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>
        <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
          {mode === 'register' && (
            <input
              name="fullname"
              type="text"
              placeholder="Ad Soyad"
              style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', fontSize: 18 }}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="E-posta"
            style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', fontSize: 18 }}
          />
          <input
            name="password"
            type="password"
            placeholder="Şifre"
            style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', fontSize: 18 }}
          />
          {mode === 'register' && (
            <input
              name="password2"
              type="password"
              placeholder="Şifre Tekrar"
              style={{ width: '100%', marginBottom: 18, padding: 16, borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', fontSize: 18 }}
            />
          )}
          <button
            type="submit"
            style={{ width: '100%', padding: 16, borderRadius: 8, background: mode === 'login' ? '#00b894' : '#0984e3', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 18 }}
          >
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
          <div style={{ color: '#aaa', margin: '20px 0', textAlign: 'center', fontSize: 16 }}>
            {mode === 'login' ? 'veya' : 'Zaten hesabın var mı?'}
          </div>
          <button
            type="button"
            style={{ width: '100%', padding: 16, borderRadius: 8, background: mode === 'login' ? '#0984e3' : '#00b894', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 18 }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Topbar = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const releaseMatureProvisions = async () => {
    try {
      await fetch('https://elephunt.com/api/release_provision.php');
    } catch (e) {}
  };

  // Çıkış yap fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setProfileDropdownOpen(false);
    window.location.href = "/";
  };

  // Kullanıcı bilgilerini güncelle
  const updateUserInfo = () => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch("https://elephunt.com/api/get_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setFieldValues(data.user);
          // LocalStorage'ı da güncelle
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Bildirim sayısını getir
          if (data.user.id) {
            fetchUnreadNotifications(data.user.id);
            fetchRecentNotifications(data.user.id);
          }
        }
      })
      .catch((error) => {
        console.error('Kullanıcı bilgileri güncellenirken hata:', error);
      });
  };

  // Okunmamış bildirim sayısını getir
  const fetchUnreadNotifications = async (userId) => {
    try {
      const response = await fetch(`https://elephunt.com/api/bildirimlerim.php?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setUnreadNotifications(data.okunmamis);
      }
    } catch (error) {
      console.error('Bildirim sayısı alınırken hata:', error);
    }
  };

  // Son bildirimleri getir
  const fetchRecentNotifications = async (userId) => {
    try {
      const response = await fetch(`https://elephunt.com/api/bildirimlerim.php?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        // Sadece ilk 5 bildirimi göster
        setRecentNotifications(data.bildirimler.slice(0, 5));
      }
    } catch (error) {
      console.error('Son bildirimler alınırken hata:', error);
    }
  };

  useEffect(() => {
    updateUserInfo();
    
    // Bakiye bilgisini her 30 saniyede bir güncelle
    const interval = setInterval(updateUserInfo, 30000);
    const provisionInterval = setInterval(releaseMatureProvisions, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(provisionInterval);
    };
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsDropdownOpen && !event.target.closest('.NotificationsMain')) {
        setNotificationsDropdownOpen(false);
      }
      if (profileDropdownOpen && !event.target.closest('.NavbarAccount')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsDropdownOpen, profileDropdownOpen]);


  return (
    <div className="HeaderProfil">
      <div className="SetContent">
        <div className="Logo">
          <a href="/">
            <img src="/images/Logo.png" alt="Logo" />
          </a>
        </div>
        <div className="ProfileMenu">
          <i className="fas fa-bars bars"></i>
        </div>
        <div className="Menu">
          <ul>
            <li>
              <a href="/">ANASAYFA</a>
            </li>
            <li>
              <a href="/market">MARKET</a>
            </li>
            <li>
              <a href="/takas">TAKAS YAP</a>
              <span className="Drky">Yeni</span>
            </li>
          </ul>
        </div>
        <div className="Search">
          <input type="search" placeholder="Skin & Item Ara..." />
          <i className="fas fa-search"></i>
          <div className="clear"></div>
        </div>
        
        
        <div className="Login">
          <ul>
            <li>
            <div className="Basket">
          <a href="/Sepet.html" title="Sepetim">
            <i className="fas fa-shopping-cart"></i>
          </a>
        </div>
            </li>
            <li>
            <div className="NotificationsMain">
          <div 
            className="BildirimNameMain" 
            title="Bildirimler"
            onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            <i className="fas fa-bell notificationsMain">
              {unreadNotifications > 0 && (
                <span className="figure" style={{
                  position: 'absolute',
                  right: '-8px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </i>
          </div>
          <div className={`NavbarNotificationsMain ${notificationsDropdownOpen ? 'open' : ''}`} style={{
            display: notificationsDropdownOpen ? 'block' : 'none',
            position: 'absolute',
            top: '100%',
            right: '0',
            backgroundColor: '#2c2c2c',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '300px',
            zIndex: 1000,
            border: '1px solid #444'
          }}>
            {recentNotifications.length > 0 ? (
              <>
                {recentNotifications.map((notification, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      color: '#4fc3f7',
                      fontSize: '16px',
                      minWidth: '20px'
                    }}>
                      <i className="fas fa-bell"></i>
                    </div>
                    <div style={{
                      color: '#ccc',
                      fontSize: '14px',
                      flex: 1,
                      lineHeight: '1.4'
                    }}>
                      {notification.bildirim_text}
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <a 
                    href="/bildirimlerim" 
                    style={{
                      backgroundColor: '#444',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Tüm Bildirimleri Gör
                  </a>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#ccc'
                }}>
                  <i className="fa fa-bell" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                  Bildiriminiz bulunmamaktadır.
                </div>
                <div style={{
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <a 
                    href="/bildirimlerim" 
                    style={{
                      backgroundColor: '#444',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Tüm Bildirimleri Gör
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
            </li>
            {user ? (
              <>
                <li>
                  <a href="/Destek.html">Destek</a>
                </li>
                <li>
                  <div className="ProfilName" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                    {user.fullname} <i className="fas fa-angle-down"></i>
                  </div>
                  <div className={`NavbarAccount ${profileDropdownOpen ? 'open' : ''}`}>
                    <h3>
                      <span className="NavAccName">
                        <b>{user.fullname}</b>
                      </span>
                      <span className="NavAccMail">{user.email}</span>
                      <span className="NavAccBalance">Bakiye : {user.balance ? parseFloat(user.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} TL</span>
                      <span className="NavAccBalance">Provizyon : {user.provision_balance ? parseFloat(user.provision_balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} TL</span>
                    </h3>
                    <ul>
                      <li>
                        <a href="/profile">
                          <i className="fa fa-user"></i>Hesabım
                        </a>
                      </li>
                      <li>
                        <a href="/odeme">
                          <i className="fas fa-money-bill-wave"></i>Bakiye Yükle
                        </a>
                      </li>
                      <li>
                        <a href="#" onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt"></i>Çıkış Yap
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a 
                    href="#" 
                    className="GlobalButton"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthModalOpen(true);
                    }}
                  >
                    GİRİŞ YAP / KAYIT OL
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="clear"></div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        setUser={setUser}
      />
    </div>
  );
};

export default Topbar;
