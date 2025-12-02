import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '../../public/css/site.css';
import '../../public/css/fontawesome.css';
import '../../public/css/reset.css';
import Topbar from '../Components/Topbar';
import HeaderTop from '../Components/HeaderTop';
import Footer from '../Components/Footer';

const TakasDetay = () => {
  const { id } = useParams();
  const [takasIlan, setTakasIlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessages, setShowMessages] = useState(true);
  const [mesajlar, setMesajlar] = useState([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [mesajGonderiliyor, setMesajGonderiliyor] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // Cevap verilen mesaj
  const replyTextareaRef = useRef(null);

  // Takas ilan detayını getir
  useEffect(() => {
    const fetchTakasDetay = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://gamedev.mymedya.tr/api/takas_detay.php?id=${id}`);
        const data = await response.json();
        
        if (data.success) {
          setTakasIlan(data.takas_ilan);
        } else {
          setError(data.message || 'Takas ilanı yüklenemedi');
        }
      } catch (error) {
        console.error('Takas detay yükleme hatası:', error);
        setError('Sunucuya ulaşılamadı');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTakasDetay();
    }
  }, [id]);

  // Aşınma durumu için renk sınıfları
  const getWearClass = (wear) => {
    switch (wear) {
      case 'factory_new': return 'factorynew';
      case 'minimal_wear': return 'minimalwear';
      case 'field_tested': return 'fieldtested';
      case 'well_worn': return 'wellworn';
      case 'battle_scarred': return 'battlescarred';
      default: return 'factorynew';
    }
  };

  // Aşınma durumu için Türkçe metin
  const getWearText = (wear) => {
    switch (wear) {
      case 'factory_new': return 'Factory New';
      case 'minimal_wear': return 'Minimal Wear';
      case 'field_tested': return 'Field-Tested';
      case 'well_worn': return 'Well-Worn';
      case 'battle_scarred': return 'Battle-Scarred';
      case 'any': return 'Herhangi';
      default: return 'Factory New';
    }
  };

  // Float değeri için rastgele değer üret (gerçek uygulamada API'den gelecek)
  const generateFloat = () => {
    return (Math.random() * 0.8 + 0.01).toFixed(15);
  };

  // Float bar için pozisyon hesapla
  const getFloatPosition = (float) => {
    const floatValue = parseFloat(float);
    return (floatValue / 1.0) * 100; // 0-1 arası değeri yüzdeye çevir
  };

  // Mesajları getir
  const fetchMesajlar = async () => {
    if (!takasIlan) return;
    
    try {
      const response = await fetch(`https://gamedev.mymedya.tr/api/takas_mesajlari.php?takas_ilan_id=${takasIlan.id}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Mesajlar yüklendi:', data);
        console.log('Ana mesajlar:', data.mesajlar);
        console.log('Debug bilgileri:', data.debug);
        data.mesajlar.forEach((mesaj, index) => {
          console.log(`Mesaj ${index + 1}:`, mesaj);
          if (mesaj.replies && mesaj.replies.length > 0) {
            console.log(`  - ${mesaj.replies.length} cevap var:`, mesaj.replies);
          }
        });
        setMesajlar(data.mesajlar || []);
      } else {
        console.error('Mesajlar yüklenemedi:', data.message);
      }
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
    }
  };

  // Mesaj gönder
  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim() || !currentUser || !takasIlan) return;
    
    try {
      setMesajGonderiliyor(true);
      
      const response = await fetch('https://gamedev.mymedya.tr/api/mesaj_gonder.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          takas_ilan_id: takasIlan.id,
          gonderen_user_id: currentUser.id,
          mesaj: yeniMesaj.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setYeniMesaj('');
        // Mesajları yeniden yükle
        setTimeout(() => {
          fetchMesajlar();
        }, 500); // 500ms bekle
      } else {
        alert('Mesaj gönderilemedi: ' + data.message);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      alert('Mesaj gönderilirken hata oluştu');
    } finally {
      setMesajGonderiliyor(false);
    }
  };

  // Cevap gönder
  const handleReplyGonder = async () => {
    const currentReplyText = replyTextareaRef.current ? replyTextareaRef.current.value : '';
    if (!currentReplyText.trim() || !currentUser || !takasIlan || !replyingTo) return;
    
    try {
      setMesajGonderiliyor(true);
      
      const response = await fetch('https://gamedev.mymedya.tr/api/mesaj_gonder.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          takas_ilan_id: takasIlan.id,
          gonderen_user_id: currentUser.id,
          mesaj: currentReplyText.trim(),
          parent_id: replyingTo.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (replyTextareaRef.current) {
          replyTextareaRef.current.value = '';
        }
        setReplyingTo(null);
        // Mesajları yeniden yükle
        setTimeout(() => {
          fetchMesajlar();
        }, 500); // 500ms bekle
      } else {
        alert('Cevap gönderilemedi: ' + data.message);
      }
    } catch (error) {
      console.error('Cevap gönderme hatası:', error);
      alert('Cevap gönderilirken hata oluştu');
    } finally {
      setMesajGonderiliyor(false);
    }
  };

  // Cevap verme işlemini iptal et
  const cancelReply = () => {
    if (replyTextareaRef.current) {
      replyTextareaRef.current.value = '';
    }
    setReplyingTo(null);
  };

  // Mesaj sil
  const handleMesajSil = async (mesajId) => {
    if (!currentUser || !takasIlan) return;
    
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch('https://gamedev.mymedya.tr/api/mesaj_sil.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mesaj_id: mesajId,
          user_id: currentUser.id,
          takas_ilan_id: takasIlan.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mesajları yeniden yükle
        setTimeout(() => {
          fetchMesajlar();
        }, 500);
      } else {
        alert('Mesaj silinemedi: ' + data.message);
      }
    } catch (error) {
      console.error('Mesaj silme hatası:', error);
      alert('Mesaj silinirken hata oluştu');
    }
  };



  // Kullanıcı bilgilerini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Kullanıcı bilgileri parse edilemedi:', error);
      }
    }
  }, []);

  // Mesajları yükle
  useEffect(() => {
    if (takasIlan) {
      fetchMesajlar();
    }
  }, [takasIlan]);

  // Cevap verme alanı açıldığında textarea'ya focus ol
  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      setTimeout(() => {
        replyTextareaRef.current.focus();
      }, 100);
    }
  }, [replyingTo]);

  // Mesaj bileşeni
  const MessageComponent = ({ mesaj, isReply = false }) => {
    const isSeller = mesaj.gonderen_user_id === takasIlan?.user_id;
    const canReply = currentUser && currentUser.id !== mesaj.gonderen_user_id;
    const hasParentId = mesaj.hasOwnProperty('parent_id'); // parent_id alanının varlığını kontrol et
    
    // Silme yetkisi: İlan sahibi veya mesaj sahibi
    const canDelete = currentUser && (
      currentUser.id === takasIlan?.user_id || // İlan sahibi
      currentUser.id === mesaj.gonderen_user_id // Mesaj sahibi
    );
    
    return (
      <div style={{
        marginBottom: isReply ? '8px' : '12px',
        marginLeft: isReply ? '20px' : '0',
        padding: '8px',
        background: isReply ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
        borderRadius: '6px',
        borderLeft: isReply ? '3px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <i 
            className="fas fa-user" 
            style={{
              color: isSeller ? '#4CAF50' : '#03b0fa', 
              marginRight: '8px',
              fontSize: isReply ? '10px' : '12px'
            }}
          ></i>
          <span style={{
            color: isSeller ? '#4CAF50' : '#03b0fa', 
            fontWeight: 'bold',
            fontSize: isReply ? '10px' : '12px'
          }}>
            {isSeller ? 'Satıcı' : mesaj.gonderen_username || 'Kullanıcı'}:
          </span>
          {canReply && !isReply && (
            <button
              onClick={() => {
                setReplyingTo(mesaj);
                // Focus'u bir sonraki render'da ayarla
                setTimeout(() => {
                  if (replyTextareaRef.current) {
                    replyTextareaRef.current.focus();
                  }
                }, 100);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '10px',
                marginLeft: '8px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Cevap Ver
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleMesajSil(mesaj.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                fontSize: '10px',
                marginLeft: '8px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sil
            </button>
          )}
          <span style={{
            color: '#666',
            marginLeft: 'auto',
            fontSize: isReply ? '9px' : '11px'
          }}>
            {new Date(mesaj.created_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div style={{
          color: '#fff', 
          fontSize: isReply ? '12px' : '13px',
          marginLeft: '20px'
        }}>
          {mesaj.mesaj}
        </div>
        
        {/* Cevap verme alanı */}
        {replyingTo && replyingTo.id === mesaj.id && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(3, 176, 250, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(3, 176, 250, 0.3)'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#03b0fa',
              marginBottom: '4px'
            }}>
              {mesaj.gonderen_username || (isSeller ? 'Satıcı' : 'Kullanıcı')} kullanıcısına cevap veriyorsunuz:
            </div>
            <textarea
              ref={replyTextareaRef}
              onKeyDown={(e) => {
                // Enter tuşu ile gönder
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReplyGonder();
                }
              }}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '12px',
                resize: 'vertical'
              }}
              placeholder="Cevabınızı yazın... (Enter ile gönder)"
              maxLength={100}
              autoFocus
            />
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '6px'
            }}>
              <button
                onClick={handleReplyGonder}
                disabled={mesajGonderiliyor}
                style={{
                  background: mesajGonderiliyor 
                    ? 'rgba(255,255,255,0.1)' 
                    : '#03b0fa',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: mesajGonderiliyor ? 'not-allowed' : 'pointer'
                }}
              >
                {mesajGonderiliyor ? 'Gönderiliyor...' : 'Gönder'}
              </button>
              <button
                onClick={cancelReply}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
            </div>
          </div>
        )}
        
        {/* Cevaplar */}
        {mesaj.replies && mesaj.replies.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {mesaj.replies.map((reply) => (
              <MessageComponent key={reply.id} mesaj={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='MarketPage'>
        <div className='marketbg'>
          <img src="/images/Slider/Slide1.jpg" alt="Market Background" style={{position:'absolute'}}/>
        </div>
        <HeaderTop />
        <Topbar />
        <div style={{textAlign: 'center', padding: '100px', color: '#fff'}}>
          Takas detayı yükleniyor...
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !takasIlan) {
    return (
      <div className='MarketPage'>
        <div className='marketbg'>
          <img src="/images/Slider/Slide1.jpg" alt="Market Background" style={{position:'absolute'}}/>
        </div>
        <HeaderTop />
        <Topbar />
        <div style={{textAlign: 'center', padding: '100px', color: '#ff6b6b'}}>
          Hata: {error || 'Takas ilanı bulunamadı'}
        </div>
        <Footer />
      </div>
    );
  }

  const floatValue = generateFloat();
  const floatPosition = getFloatPosition(floatValue);

  return (
    <div className='MarketPage'>
      <div className='marketbg'>
        <img src="/images/Slider/Slide1.jpg" alt="Market Background" style={{position:'absolute'}}/>
      </div>
      <HeaderTop />
      <Topbar />
      
      <section className="MarketArea">
        <div className="MarketHeader">
          <div className="SetContent">
            <h1>
              <img src="/images/cs_logo.svg" className="marketCsgoicon" alt="CS2 Logo" />
              {takasIlan.item_name} ({getWearText(takasIlan.wear)})
            </h1>
            <div className="PageNavigation">
              <ul>
                <li><a href="/">Anasayfa</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li><a href="/takas">Takas İlanları</a></li>
                <li><i className="fas fa-angle-right"></i></li>
                <li>{takasIlan.item_name}</li>
              </ul>
            </div>
          </div>
        </div>

        <section className="Products MarketProducts">
          <div className="SetContent">
            <div style={{
              display: 'flex',
              gap: '30px',
              marginTop: '30px',
              flexWrap: 'wrap'
            }}>
              {/* Sol Bölüm - Item Resmi */}
              <div style={{
                flex: '1',
                minWidth: '300px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
               <div style={{
                 background: 'rgba(255,255,255,0.05)',
                 borderRadius: '8px',
                 padding: '20px',
                 textAlign: 'center'
               }}>
                 <img 
                   src={`https://steamcommunity-a.akamaihd.net/economy/image/${takasIlan.image}`}
                   alt={takasIlan.item_name}
                   style={{
                     maxWidth: '100%',
                     height: 'auto',
                     borderRadius: '8px'
                   }}
                 />
               </div>
              </div>

              {/* Orta Bölüm - Satıcının Item Detayları */}
              <div style={{
                flex: '1',
                minWidth: '300px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
               <h3 style={{color: '#fff', marginBottom: '20px', fontSize: '18px'}}>
                 Satıcının Item Detayları
               </h3>
               
               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#03b0fa'}}>Satıcı:</strong>
                 <span style={{color: '#fff', marginLeft: '10px'}}>
                   {takasIlan.username || 'Bilinmeyen Kullanıcı'}
                 </span>
               </div>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#03b0fa'}}>Float:</strong>
                 <span style={{color: '#fff', marginLeft: '10px', fontFamily: 'monospace'}}>
                   {floatValue}
                 </span>
               </div>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#03b0fa'}}>Float Bar:</strong>
                 <div style={{
                   width: '100%',
                   height: '20px',
                   background: 'linear-gradient(to right, #4CAF50, #FFC107, #F44336)',
                   borderRadius: '10px',
                   marginTop: '8px',
                   position: 'relative'
                 }}>
                   <div style={{
                     position: 'absolute',
                     left: `${floatPosition}%`,
                     top: '0',
                     width: '2px',
                     height: '100%',
                     background: '#fff',
                     borderRadius: '1px'
                   }}></div>
                 </div>
               </div>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#03b0fa'}}>Açıklama:</strong>
                 <div style={{
                   color: '#ccc',
                   marginTop: '8px',
                   lineHeight: '1.5',
                   fontSize: '14px'
                 }}>
                   {takasIlan.description || 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.'}
                 </div>
               </div>
              </div>

              {/* Sağ Bölüm - Talep Edilen Item Detayları */}
              <div style={{
                flex: '1',
                minWidth: '300px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
               <h3 style={{color: '#fff', marginBottom: '20px', fontSize: '18px'}}>
                 Talep Edilen Item Detayları
               </h3>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#ffc107'}}>Tercih Edilen Item:</strong>
                 <div style={{
                   color: '#fff',
                   marginTop: '8px',
                   fontSize: '16px',
                   fontWeight: 'bold'
                 }}>
                   {takasIlan.wanted_item}
                 </div>
               </div>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#ffc107'}}>Tercih Edilen Aşınma:</strong>
                 <div style={{
                   color: '#fff',
                   marginTop: '8px',
                   fontSize: '14px'
                 }}>
                   {getWearText(takasIlan.wear)}
                 </div>
               </div>

               <div style={{marginBottom: '15px'}}>
                 <strong style={{color: '#ffc107'}}>Overpay:</strong>
                 <div style={{
                   color: '#fff',
                   marginTop: '8px',
                   fontSize: '14px'
                 }}>
                   {takasIlan.overpay ? 'Evet' : 'Hayır'}
                 </div>
               </div>
              </div>
            </div>

            {/* Mesajlaşma Alanı */}
            <div style={{
              marginTop: '40px',
              display: 'flex',
              gap: '30px',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <div style={{
                marginTop: '30px',
                display: 'flex',
                gap: '30px',
                flexWrap: 'wrap',
                width: '100%'
              }}>
                {/* Sol Bölüm - Mesajlaşmalar */}
                <div style={{
                  flex: '1',
                  minWidth: '400px',
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  <h3 style={{color: '#fff', marginBottom: '20px', fontSize: '18px'}}>
                    Mesajlaşmalar
                  </h3>
                  
                  <div style={{marginBottom: '15px'}}>
                    {mesajlar.length === 0 ? (
                      <div style={{color: '#ccc', textAlign: 'center', padding: '20px'}}>
                        Henüz mesaj yok. İlk mesajı siz gönderin!
                      </div>
                    ) : (
                      mesajlar.map((mesaj) => (
                        <MessageComponent key={mesaj.id} mesaj={mesaj} />
                      ))
                    )}
                  </div>
                </div>

                {/* Sağ Bölüm - Mesaj Gönderme */}
                <div style={{
                  flex: '1',
                  minWidth: '400px',
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{color: '#fff', marginBottom: '20px', fontSize: '18px'}}>
                    Satıcıya Mesaj Yollayın
                  </h3>
                  
                  <div style={{
                    background: 'rgba(3, 176, 250, 0.1)',
                    border: '1px solid rgba(3, 176, 250, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#03b0fa'
                  }}>
                    * Kurallara uymayan mesajınız onaylanmaz ve silinir. Teşekkür ederiz.
                  </div>
                  
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#fff',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      {currentUser && currentUser.id === takasIlan.user_id ? 'İlana Cevap Verin' : 'Mesajınız'} (Maks. 100 karakter)
                    </label>
                    <textarea
                      value={yeniMesaj}
                      onChange={(e) => setYeniMesaj(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder={currentUser && currentUser.id === takasIlan.user_id ? "İlana cevabınızı yazın..." : "Mesajınızı buraya yazın..."}
                      maxLength={100}
                      disabled={!currentUser}
                    />
                    {!currentUser && (
                      <div style={{
                        color: '#ff6b6b',
                        fontSize: '12px',
                        marginTop: '5px'
                      }}>
                        Mesaj göndermek için giriş yapmalısınız
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleMesajGonder}
                    disabled={!currentUser || !yeniMesaj.trim() || mesajGonderiliyor}
                    style={{
                      background: !currentUser || !yeniMesaj.trim() || mesajGonderiliyor 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'linear-gradient(45deg, #03b0fa, #00d4ff)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: !currentUser || !yeniMesaj.trim() || mesajGonderiliyor ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(3, 176, 250, 0.3)',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      opacity: !currentUser || !yeniMesaj.trim() || mesajGonderiliyor ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if (currentUser && yeniMesaj.trim() && !mesajGonderiliyor) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(3, 176, 250, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(3, 176, 250, 0.3)';
                    }}>
                    {mesajGonderiliyor ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
      <Footer />
    </div>
  );
};

export default TakasDetay;
