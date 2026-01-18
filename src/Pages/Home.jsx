import React, { useEffect, useState } from 'react'
import '../../public/css/site.css'
import '../../public/css/fontawesome.css'
// import '../../public/css/fontawsome.css'
import '../../public/css/reset.css'
// import '../../public/css/slippry.css'

// Import JavaScript libraries
import $ from 'jquery'
import 'jquery-migrate'
import 'jquery-easing'
import 'select2'
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import Topbar from '../Components/Topbar'
import HeaderTop from '../Components/HeaderTop'
import Footer from '../Components/Footer'

// Custom Arrow Components
const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block', right: 10, zIndex: 2 }}
      onClick={onClick}
    >
      <i className="fas fa-chevron-right" style={{ fontSize: 32, color: '#fff', textShadow: '0 0 5px #000' }}></i>
    </div>
  );
};
const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block', left: 10, zIndex: 2 }}
      onClick={onClick}
    >
      <i className="fas fa-chevron-left" style={{ fontSize: 32, color: '#fff', textShadow: '0 0 5px #000' }}></i>
    </div>
  );
};

// Modal Bileşeni
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
      const res = await fetch('http://elephunt.com/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Kayıt başarılı!');
        setMode('login');
      } else {
        alert(data.message || 'Kayıt başarısız.');
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
      } else {
        alert(data.message || 'Giriş başarısız.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucuya ulaşılamıyor.');
    }
  };

  // Çıkış fonksiyonu
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
          top: open ? 0 : '-600px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          maxWidth: '95vw',
          background: '#181A20',
          borderRadius: 18,
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
          padding: 48,
          transition: 'top 0.4s cubic-bezier(.77,0,.18,1)',
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

const Home = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();
  const [tumIlanlar, setTumIlanlar] = useState([]);
  const [ilanlarLoading, setIlanlarLoading] = useState(true);
  const [ilanlarError, setIlanlarError] = useState('');

  useEffect(() => {
    window.$ = window.jQuery = $
    
    const loadStyle = (href) => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    };

    // Load external scripts
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    // Load all required scripts
    Promise.all([
      loadStyle('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css'),
      loadStyle('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css'),
      loadScript('/js/animate/animate.js'),
      loadScript('/js/modal/promise.js'),
      loadScript('/js/modal/modal.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.js'),
      loadScript('/js/carousel/utilcarousel.min.js'),
      loadScript('/js/select/i18n/tr.js')
    ]).then(() => {
      // Initialize slider with updated options
      $('#Slides').slick({
        dots: false,
        arrows: false,
        infinite: true,
        speed: 500,
        fade: true,
        cssEase: 'linear',
        autoplay: true,
        autoplaySpeed: 2000,
      });

      // Initialize carousel
      $('#News').utilCarousel({
        responsive: true,
        circular: true,
        infinite: true,
        auto: {
          enabled: true,
          interval: 5000
        }
      });
      $('.GameSelected').select2({
        language: 'tr'
      });
    }).catch(error => {
      console.error('Error loading scripts:', error);
    });

    fetch('https://elephunt.com/api/tum_ilanlar.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTumIlanlar(data.ilanlar);
        } else {
          setIlanlarError(data.message || 'İlanlar alınamadı!');
        }
        setIlanlarLoading(false);
      })
      .catch(() => {
        setIlanlarError('Sunucuya ulaşılamadı!');
        setIlanlarLoading(false);
    });

    return () => {
      if ($('#News').data('utilCarousel')) {
        $('#News').utilCarousel('destroy');
      }
      if ($('#Slides').data('slick')) {
        $('#Slides').slick('unslick');
      }
      if ($('.GameSelected').data('select2')) {
        $('.GameSelected').select2('destroy');
      }

      // Remove dynamically added stylesheets
      const slickStyles = document.querySelectorAll('link[href*="slick-carousel"]');
      slickStyles.forEach(style => style.remove());
    }
  }, []);

  const sliderImages = [
    {
      src: '/images/Slider/Slide1.jpg',
      alt: 'CS2 Slider',
      title: 'En Popüler Skinler',
      header: 'Counter-Strike 2',
      desc: 'CS2 Skin Satışlarında En Uygun Komisyonlar, Hemen Kayıt Ol Satışa Başla !',
      link: 'Market.html',
      linkText: 'İncele'
    },
    {
      src: '/images/Slider/Slide2.jpg',
      alt: 'Knight Online Slider',
      title: 'Şampiyonların Oyunu',
      header: 'Knight Online World',
      desc: "Knight Online İtem Satışlarında Çok Uygun Komisyon Fırsatları JervisGame'de Sizleri Bekliyor.",
      link: 'KoMarket.html',
      linkText: 'İncele'
    }
  ];

  const newsItems = [
    {
      img: '/images/Test/News1.jpg',
      title: 'E-Sporcu Olmak İçin Gereken Özellikler',
      link: 'HaberDetay.html'
    },
    {
      img: '/images/Test/News4.jpg',
      title: 'Valorant Yeni Skin Seti: Neptune',
      link: 'HaberDetay.html'
    }
  ];

  // Çıkış fonksiyonu (Home bileşeninin içinde)
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} setUser={setUser} />
      <section className="HeaderArea">
        <HeaderTop />
        <Topbar />
      </section>

      <section className="SliderArea">
        <div className="sy-box">
          <Slider
            dots={false}
            arrows={false}
            infinite={true}
            speed={500}
            fade={true}
            autoplay={true}
            autoplaySpeed={2000}
            cssEase="linear"
          >
            {sliderImages.map((img, idx) => (
              <div key={idx}>
                <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="SliderDescArea">
                  <div className="SliderDesc">
                    <div className="Desc">
                      <span>{img.title}</span>
                      <h2>{img.header}</h2>
                      <p>{img.desc}</p>
                      <a className="GlobalButton" href={img.link}>{img.linkText} <i className="fas fa-arrow-right"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
        <div className="DownArrow">
          <a href="#FirstProducts">
            <div className="Down"></div>
          </a>
        </div>
      </section>

      <section className="Games">
        <ul>
          <li>Oyunlar</li>
          <li>
            <a href="Market.html">
              <img src="/images/Game_icon/csgo.png" alt="CS2" title="CS2" />
            </a>
          </li>
          <li>
            <a href="KoMarket.html">
              <img src="/images/Game_icon/knight.png" alt="Knight Online" title="Knight Online" />
            </a>
          </li>
          <li>
            <a href="ValorantMarket.html">
              <img src="/images/Game_icon/valorant.png" alt="Valorant" title="Valorant" />
            </a>
          </li>
          <li>
            <a href="PubgMarket.html">
              <img src="/images/Game_icon/pubg.png" alt="PubG" title="PubG" />
            </a>
          </li>
        </ul>
      </section>

      <section className="Products" id="FirstProducts">
        <div className="Products1">
          <div className="SetContent">
            <h1>
              <span>
                <img src="/images/cs_logo.svg" alt="CS2 Logo" />Popüler <b>CS2 </b>Eşyaları
              </span>
              <a className="GlobalButton AllProduct" href="Market.html">Tümünü Göster <i className="fas fa-arrow-right"></i></a>
            </h1>
            <div className="ProductsArea">
              {ilanlarLoading && <div>Yükleniyor...</div>}
              {ilanlarError && <div style={{color:'red'}}>{ilanlarError}</div>}
              <ul>
                {(() => {
                  const skinsMap = new Map();
                  tumIlanlar.forEach(ilan => {
                    const key = ilan.item_name;
                    if (!key) return;
                    
                    if (!skinsMap.has(key)) {
                      skinsMap.set(key, {
                        name: key,
                        image: ilan.image,
                        minPrice: parseFloat(ilan.price),
                        firstListingId: ilan.id,
                        created_at: ilan.created_at
                      });
                    }
                    
                    const skin = skinsMap.get(key);
                    const price = parseFloat(ilan.price);
                    
                    if (!isNaN(price) && price < skin.minPrice) {
                      skin.minPrice = price;
                      skin.image = ilan.image;
                      // Keep the ID of the cheapest item if you want, or just the first one. 
                      // Market usually shows "Starts from X price".
                      // If we want to navigate to a specific item, usually the cheapest is best for "Buy".
                      skin.firstListingId = ilan.id;
                      skin.created_at = ilan.created_at;
                    }
                  });

                  const uniqueSkins = Array.from(skinsMap.values());
                  // Sort by name or date? Market sorts by name.
                  uniqueSkins.sort((a, b) => a.name.localeCompare(b.name));
                  
                  // Limit to 24 items max, but do NOT duplicate
                  const displayItems = uniqueSkins.slice(0, 24);

                  if (displayItems.length === 0 && !ilanlarLoading) {
                    return <li>Hiç ilan yok.</li>;
                  }

                  return displayItems.map((skin, index) => (
                    <li 
                      key={`${skin.firstListingId}-${index}`} 
                      title={skin.name}
                      onClick={() => navigate(`/skindetay/${skin.firstListingId}`)}
                      style={{cursor: 'pointer'}}
                    >
                  <div className="ProductItem" style={{
                      width: '100%',
                      height: '90px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: '10px',
                      background: '#23252b',
                      borderRadius: '5px',
                      margin: '0',
                      position: 'relative'
                  }}>
                    <div className="ProductPic" style={{
                        width: '80px',
                        height: '70px',
                        position: 'static',
                        background: 'transparent',
                        boxShadow: 'none',
                        padding: '0',
                        marginRight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <img
                          src={`https://steamcommunity-a.akamaihd.net/economy/image/${skin.image}`}
                          alt={skin.name}
                          style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              width: 'auto',
                              height: 'auto',
                              margin: '0',
                              display: 'block'
                          }}
                        />
                    </div>
                    <div className="ProductDesc" style={{
                        position: 'static',
                        width: 'calc(100% - 95px)',
                        height: 'auto',
                        padding: 0
                    }}>
                        <h2 style={{
                            fontSize: '15px',
                            marginBottom: '5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'left',
                            width: '100%'
                        }}>{skin.name}</h2>
                      <p style={{
                          textAlign: 'left',
                          fontSize: '13px',
                          color: '#aaa',
                          display: 'flex',
                          alignItems: 'center',
                          margin: 0
                      }}>
                          <span style={{color: '#e4ae39', fontWeight: '600', marginRight: '5px'}}>{skin.minPrice.toFixed(2)} ₺</span>
                          {skin.created_at && <span className="right" style={{marginLeft: 'auto', fontSize: '10px'}}>{new Date(skin.created_at).toLocaleDateString()}</span>}
                      </p>
                    </div>
                  </div>
                </li>
                  ));
                })()}
              </ul>
            </div>
          </div>
        </div>

        <div className="Products2">
          <div className="SetContent SetMarginTop">
            <h1>
              <span>
                <img src="/images/sword.svg" alt="Knight Online Logo" />
                Popüler <b>Knight Online </b>Eşyaları
              </span>
              <a className="GlobalButton AllProduct" href="KoMarket.html">Tümünü Göster <i className="fas fa-arrow-right"></i></a>
            </h1>
            <div className="ProductsArea">
              <ul>
                <li title="+7 Raptor">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Sirius</h1>
                      <img src="/images/Test/5.png" alt="+7 Raptor" />
                      <a className="ProductButton" href="itemDetay.html" title="+7 Raptor">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+7 Raptor</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+9 Rogue Shell Set">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Altar</h1>
                      <img src="/images/Test/6.png" alt="+9 Rogue Shell Set" />
                      <a className="ProductButton" href="itemDetay.html" title="+9 Rogue Shell Set">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+9 Rogue Shell Set</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+8 Buju Polearm">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Vega</h1>
                      <img src="/images/Test/7.png" alt="+8 Buju Polearm" />
                      <a className="ProductButton" href="itemDetay.html" title="+8 Buju Polearm">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+8 Buju Polearm</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+9 Dual Shard">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Olympia</h1>
                      <img src="/images/Test/8.png" alt="+9 Dual Shard" />
                      <a className="ProductButton" href="itemDetay.html" title="+9 Dual Shard">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+9 Dual Shard</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+9 Warrior Krowaz Set">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Ares</h1>
                      <img src="/images/Test/6.png" alt="+9 Warrior Krowaz Set" />
                      <a className="ProductButton" href="itemDetay.html" title="+9 Warrior Krowaz Set">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+9 Warrior Krowaz Set</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+8 Double Dragon Claw Jamadar">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Diez</h1>
                      <img src="/images/Test/8.png" alt="+8 Double Dragon Claw Jamadar" />
                      <a className="ProductButton" href="itemDetay.html" title="+8 Double Dragon Claw Jamadar">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+8 Double Dragon Claw Jamadar</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="Draki's Pendant of Strength A.A.A">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Gordion</h1>
                      <img src="/images/Test/7.png" alt="Draki's Pendant of Strength A.A.A" />
                      <a className="ProductButton" href="itemDetay.html" title="Draki's Pendant of Strength A.A.A">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>Draki's Pendant of Strength A.A.A</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li title="+3 Black Dragon Necklace">
                  <div className="ProductItem">
                    <div className="ProductPic">
                      <h1 className="koserver">Destan</h1>
                      <img src="/images/Test/5.png" alt="+3 Black Dragon Necklace" />
                      <a className="ProductButton" href="itemDetay.html" title="+3 Black Dragon Necklace">İncele <i className="fas fa-arrow-right"></i></a>
                    </div>
                    <div className="ProductDesc">
                      <h2>+3 Black Dragon Necklace</h2>
                      <p>
                        <span className="left">1500 ₺</span>
                        <span className="right">999 ilan</span>
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="News">
        <div className="SetContent">
          <h1>
            <span>
              En <b>Son</b> Haberler
            </span>
            <a className="GlobalButton AllProduct" href="Haberler.html">Tümünü Göster <i className="fas fa-arrow-right"></i></a>
          </h1>
          <ul>
            <li>
              <Slider
                dots={false}
                arrows={true}
                infinite={true}
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={4000}
                cssEase="linear"
                nextArrow={<NextArrow />}
                prevArrow={<PrevArrow />}
              >
                {newsItems.map((item, idx) => (
                  <div className="item" key={idx}>
                    <img src={item.img} alt={item.title} />
                    <a href={item.link}>
                      <div className="NewsDesc">
                        <h2>{item.title}</h2>
                      </div>
                    </a>
                  </div>
                ))}
              </Slider>
            </li>
            <li style={{ background: "url(/images/Test/News2.jpg)", backgroundSize: "cover" }}>
              <a href="HaberDetay.html">
                <div className="NewsDesc">
                  <h2>Haftanın Oyun Haberleri</h2>
                </div>
              </a>
            </li>
            <li style={{ background: "url(/images/Test/News3.jpg)", backgroundSize: "cover" }}>
              <a href="HaberDetay.html">
                <div className="NewsDesc">
                  <h2>Knight Royale!</h2>
                </div>
              </a>
            </li>
          </ul>
          <div className="clear"></div>
        </div>
      </section>

      <Footer />

      <div className="ScrollTop"></div>
      <div className="clear"></div>
    </>
  )
}

export default Home