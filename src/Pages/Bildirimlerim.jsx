import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const Bildirimlerim = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({});

  const loadNotifications = useCallback(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      setError('Giriş yapmalısınız!');
      setLoading(false);
      return;
    }

    const user = JSON.parse(stored);
    if (!user.id) {
      setError('Kullanıcı ID bulunamadı!');
      setLoading(false);
      return;
    }

    // Yeni bildirimler API'sini kullan
    fetch(`https://elephunt.com/api/bildirimlerim.php?user_id=${user.id}`, {
      method: 'GET'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.bildirimler);
        } else {
          setError(data.message || 'Bildirimler alınamadı!');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Sunucuya ulaşılamadı!');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const parseDateToMs = (value) => {
    if (!value) return null;
    // Safari uyumluluğu için boşlukları 'T' ile değiştir
    const normalized = value.replace(' ', 'T');
    const date = new Date(normalized);
    const ms = date.getTime();
    return Number.isNaN(ms) ? null : ms;
  };

  // Geri sayım hesaplama fonksiyonu
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date().getTime();
    const newTimeRemaining = {};
    
    notifications.forEach(notif => {
      if (notif.karsi_teklif_id && 
          (notif.teklif_durumu === 'beklemede' || !notif.teklif_durumu)) {
        const createdTime = parseDateToMs(notif.teklif_created_at || notif.created_at);
        let expiresAt = parseDateToMs(notif.teklif_expires_at);
        
        // Eğer expires_at yoksa veya created'dan önceyse, created + 60 sn kabul et
        if ((!expiresAt || (createdTime && expiresAt < createdTime)) && createdTime) {
          expiresAt = createdTime + (60 * 1000);
        }
        
        if (expiresAt && !isNaN(expiresAt)) {
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          newTimeRemaining[notif.karsi_teklif_id] = remaining;
        }
      }
    });
    
    return newTimeRemaining;
  }, [notifications]);

  // Geri sayım timer'ı - bildirimler yüklendiğinde hemen başlat
  useEffect(() => {
    if (notifications.length === 0) return;
    
    // İlk hesaplamayı hemen yap
    const initialTimeRemaining = calculateTimeRemaining();
    setTimeRemaining(initialTimeRemaining);
    
    let shouldReload = false;
    
    // Sonra her saniye güncelle
    const interval = setInterval(() => {
      const newTimeRemaining = calculateTimeRemaining();
      setTimeRemaining(newTimeRemaining);
      
      // Süre bitti mi kontrol et
      const now = new Date().getTime();
      notifications.forEach(notif => {
        if (notif.karsi_teklif_id && 
            (notif.teklif_durumu === 'beklemede' || !notif.teklif_durumu)) {
          let expiresAt = null;
          
          if (notif.teklif_expires_at) {
            try {
              expiresAt = new Date(notif.teklif_expires_at).getTime();
              if (isNaN(expiresAt)) expiresAt = null;
            } catch (e) {
              expiresAt = null;
            }
          }
          
          if (!expiresAt) {
            const createdTime = notif.teklif_created_at || notif.created_at;
            if (createdTime) {
              try {
                const created = new Date(createdTime).getTime();
                if (!isNaN(created)) {
                  expiresAt = created + (60 * 1000);
                }
              } catch (e) {
                expiresAt = null;
              }
            }
          }
          
          if (expiresAt && now > expiresAt) {
            shouldReload = true;
          }
        }
      });
      
      // Süre bittiğinde bildirimleri yenile
      if (shouldReload) {
        loadNotifications();
        shouldReload = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [notifications, calculateTimeRemaining, loadNotifications]);

  const markAsRead = async (bildirimId) => {
    try {
      console.log('Bildirim okundu işaretleniyor:', bildirimId);
      
      const response = await fetch('https://elephunt.com/api/bildirim_okundu.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bildirim_id: bildirimId })
      });

      console.log('API yanıtı:', response.status);
      
      const data = await response.json();
      console.log('API data:', data);
      
      if (data.success) {
        console.log('Bildirim başarıyla okundu olarak işaretlendi');
        // Bildirimi okundu olarak işaretle
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === bildirimId 
              ? { ...notif, is_okundu: 1 }
              : notif
          )
        );
      } else {
        console.error('API hatası:', data.message);
      }
    } catch (error) {
      console.error('Bildirim işaretlenirken hata:', error);
    }
  };

  const deleteNotification = async (bildirimId) => {
    if (!window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch('https://elephunt.com/api/bildirim_sil.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bildirim_id: bildirimId })
      });

      const data = await response.json();
      if (data.success) {
        // Bildirimi listeden kaldır
        setNotifications(prev => prev.filter(notif => notif.id !== bildirimId));
      }
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  const goToTradeDetail = (takasId) => {
    if (!takasId) return;
    navigate(`/takas-detay/${takasId}`);
  };

  const handleTeklifAction = async (teklifId, action, bildirimId) => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('Giriş yapmalısınız!');
      return;
    }

    const user = JSON.parse(stored);
    
    try {
      let url = '';
      let body = {};

      if (action === 'iptal') {
        url = 'https://elephunt.com/api/karsi_teklif_iptal.php';
        body = { teklif_id: teklifId, user_id: user.id };
      } else {
        url = 'https://elephunt.com/api/karsi_teklif_onay_red.php';
        body = { teklif_id: teklifId, action: action, user_id: user.id };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message || 'İşlem başarılı!');
        loadNotifications(); // Bildirimleri yenile
      } else {
        console.error('API hatası:', data);
        alert(data.message || 'İşlem başarısız!');
        if (data.error) {
          console.error('Detaylı hata:', data.error);
        }
      }
    } catch (error) {
      console.error('Teklif işlemi hatası:', error);
      alert('Bir hata oluştu! Konsolu kontrol edin.');
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Süresi Doldu';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Geri sayım süresini hesapla (timeRemaining state'inden veya direkt expires_at'ten)
  const getRemainingSeconds = (notif) => {
    if (notif.karsi_teklif_id && timeRemaining[notif.karsi_teklif_id] !== undefined) {
      return timeRemaining[notif.karsi_teklif_id];
    }
    
    // Eğer timeRemaining'de yoksa, direkt hesapla
    const createdTime = parseDateToMs(notif.teklif_created_at || notif.created_at);
    let expiresAt = parseDateToMs(notif.teklif_expires_at);
    
    if ((!expiresAt || (createdTime && expiresAt < createdTime)) && createdTime) {
      expiresAt = createdTime + (60 * 1000);
    }
    
    if (expiresAt && !isNaN(expiresAt)) {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      return remaining;
    }
    
    return null;
  };

  const canCancel = (notif) => {
    if (!notif.karsi_teklif_id) return false;
    if (notif.teklif_durumu !== 'beklemede' && notif.teklif_durumu) return false;
    
    // Geri sayım süresini al
    const remaining = getRemainingSeconds(notif);
    if (remaining === null || remaining === undefined || remaining <= 0) return false;
    
    // Toplam süreyi hesapla
    let totalDuration = 60; // Varsayılan 1 dakika
    
    // expires_at varsa onu kullan
    if (notif.teklif_expires_at) {
      // Önce teklif_created_at'i dene, yoksa created_at'i kullan
      const createdTime = notif.teklif_created_at || notif.created_at;
      if (createdTime) {
        try {
          const created = new Date(createdTime).getTime();
          const expires = new Date(notif.teklif_expires_at).getTime();
          if (!isNaN(created) && !isNaN(expires)) {
            totalDuration = Math.floor((expires - created) / 1000);
          }
        } catch (e) {
          // Hata durumunda varsayılan değeri kullan
        }
      }
    } else {
      // expires_at yoksa, varsayılan olarak 60 saniye kabul et
      totalDuration = 60;
    }
    
    // İlk 5 saniye ve son 5 saniye iptal edilemez
    // remaining > 5: İlk 5 saniye geçmiş olmalı
    // remaining < (totalDuration - 5): Son 5 saniyeden önce olmalı
    const canCancelResult = remaining > 5 && remaining < (totalDuration - 5);
    
    return canCancelResult;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Topbar />
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5 style={{
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  textTransform: 'uppercase'
                }}>BİLDİRİMLERİM</h5>

                <div style={{
                  backgroundColor: '#2c2c2c',
                  padding: '20px',
                  borderRadius: '0'
                }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #444',
                    textTransform: 'uppercase'
                  }}>BİLDİRİM GEÇMİŞİM</div>
                  
                  <div style={{minHeight: '200px'}}>
                          {loading && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#fff',
                        fontSize: '16px'
                      }}>
                        <i className="fas fa-spinner fa-spin" style={{fontSize: '24px', marginRight: '10px'}}></i>
                        Yükleniyor...
                      </div>
                    )}
                    
                          {error && !loading && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#ff6b6b',
                        fontSize: '16px'
                      }}>
                        <i className="fas fa-exclamation-triangle" style={{fontSize: '24px', marginRight: '10px'}}></i>
                        {error}
                      </div>
                    )}
                    
                          {!loading && !error && notifications.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#fff',
                        fontSize: '16px'
                      }}>
                        <i className="fas fa-bell-slash" style={{fontSize: '24px', marginRight: '10px'}}></i>
                        Henüz bildiriminiz yok.
                      </div>
                    )}
                    
                          {!loading && !error && notifications.map((item, index) => (
                      <div key={index} style={{
                        borderBottom: '1px solid #444',
                        padding: '15px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        backgroundColor: '#2c2c2c',
                        cursor: item.takas_ilan_id ? 'pointer' : 'default'
                      }}>
                        <div style={{
                          color: '#fff',
                          fontSize: '16px',
                          minWidth: '20px'
                        }}>
                          <i className="fas fa-bell"></i>
                        </div>
                        
                        <div style={{
                          color: item.is_okundu ? '#999' : '#fff',
                          fontSize: '14px',
                          flex: 1,
                          cursor: item.takas_ilan_id ? 'pointer' : 'default'
                        }} onClick={() => {
                          if (item.takas_ilan_id) {
                            goToTradeDetail(item.takas_ilan_id);
                          }
                        }}>
                          {item.bildirim_text}
                          {item.karsi_teklif_id && (
                            <>
                              {(() => {
                                // Süre kontrolü yap
                                const remaining = getRemainingSeconds(item);
                                let displayDurum = item.teklif_durumu;
                                
                                // Eğer durum beklemede veya null ise ve süre bittiyse, suresi_doldu olarak göster
                                if ((displayDurum === 'beklemede' || !displayDurum) && 
                                    remaining !== null && remaining !== undefined && remaining <= 0) {
                                  displayDurum = 'suresi_doldu';
                                }
                                
                                return (
                                  <span style={{
                                    marginLeft: '10px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: 
                                      (displayDurum === 'onaylandi') ? '#27ae60' :
                                      (displayDurum === 'reddedildi') ? '#e74c3c' :
                                      (displayDurum === 'iptal_edildi') ? '#95a5a6' :
                                      (displayDurum === 'suresi_doldu') ? '#f39c12' :
                                      '#3498db',
                                    color: '#fff'
                                  }}>
                                    {(displayDurum === 'onaylandi') ? '✓ Onaylandı' :
                                     (displayDurum === 'reddedildi') ? '✗ Reddedildi' :
                                     (displayDurum === 'iptal_edildi') ? 'İptal Edildi' :
                                     (displayDurum === 'suresi_doldu') ? 'Süresi Doldu' :
                                     '⏳ Beklemede'}
                                  </span>
                                );
                              })()}
                              {(() => {
                                // Sadece karşı teklif varsa geri sayım göster
                                if (!item.karsi_teklif_id) return null;
                                
                                const remaining = getRemainingSeconds(item);
                                
                                if ((item.teklif_durumu === 'beklemede' || !item.teklif_durumu) && 
                                    remaining !== null && remaining !== undefined && remaining > 0) {
                                  return (
                                    <span style={{
                                      marginLeft: '10px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      backgroundColor: remaining <= 10 ? '#e74c3c' : '#f39c12',
                                      color: '#fff'
                                    }}>
                                      ⏱ {formatTimeRemaining(remaining)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {/* Karşı teklif işlem butonları */}
                          {item.karsi_teklif_id && (item.teklif_durumu === 'beklemede' || !item.teklif_durumu) && (
                            <>
                              {/* İlan sahibi ise Onayla/Reddet butonları */}
                              {(() => {
                                const stored = localStorage.getItem('user');
                                if (!stored) return null;
                                const user = JSON.parse(stored);
                                
                                // Sadece ilan sahibi Onayla/Reddet butonlarını görebilir
                                if (item.ilan_sahibi_id && item.ilan_sahibi_id === user.id) {
                                  return (
                                    <>
                                      <button 
                                        style={{
                                          backgroundColor: '#27ae60',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Bu teklifi onaylamak istediğinizden emin misiniz?')) {
                                            handleTeklifAction(item.karsi_teklif_id, 'onayla', item.id);
                                          }
                                        }}
                                      >
                                        ✓ Onayla
                                      </button>
                                      <button 
                                        style={{
                                          backgroundColor: '#e74c3c',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Bu teklifi reddetmek istediğinizden emin misiniz?')) {
                                            handleTeklifAction(item.karsi_teklif_id, 'reddet', item.id);
                                          }
                                        }}
                                      >
                                        ✗ Reddet
                                      </button>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                              
                              {/* Teklif veren ise İptal Et butonu */}
                              {(() => {
                                const stored = localStorage.getItem('user');
                                if (!stored) return null;
                                const user = JSON.parse(stored);
                                
                                // teklif_veren_user_id kontrolü
                                // Eğer teklif_veren_user_id NULL ise, bildirim metninden kontrol et
                                let isTeklifVeren = false;
                                
                                // Önce teklif_veren_user_id'yi kontrol et
                                if (item.teklif_veren_user_id) {
                                  isTeklifVeren = item.teklif_veren_user_id === user.id;
                                } else {
                                  // teklif_veren_user_id NULL ise, bildirim metninden kontrol et
                                  // Bildirim metni "Siz ... karşı teklif verdiniz" içeriyorsa, bu bildirim teklif verene gönderilmiştir
                                  const bildirimText = item.bildirim_text || '';
                                  // Farklı formatları kontrol et (case-insensitive)
                                  if (bildirimText.toLowerCase().includes('karşı teklif verdiniz') || 
                                      bildirimText.toLowerCase().includes('siz ') && bildirimText.toLowerCase().includes('karşı teklif')) {
                                    // Bu bildirim teklif verene gönderilmiş
                                    // Bildirim zaten WHERE b.user_id = ? ile filtrelenmiş, yani kullanıcıya gönderilmiş
                                    isTeklifVeren = true;
                                  } else if (item.user_id) {
                                    // Eğer user_id varsa, onu da kontrol et
                                    isTeklifVeren = item.user_id === user.id;
                                  }
                                }
                                
                                // Sadece teklif veren İptal Et butonunu görebilir
                                const canCancelResult = canCancel(item);
                                
                                if (isTeklifVeren && canCancelResult) {
                                  return (
                                    <button 
                                      style={{
                                        backgroundColor: '#95a5a6',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Bu teklifi iptal etmek istediğinizden emin misiniz?')) {
                                          handleTeklifAction(item.karsi_teklif_id, 'iptal', item.id);
                                        }
                                      }}
                                    >
                                      İptal Et
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                              {(() => {
                                const remaining = getRemainingSeconds(item);
                                if (!canCancel(item) && (item.teklif_durumu === 'beklemede' || !item.teklif_durumu) && 
                                    remaining !== null && remaining !== undefined && remaining > 0) {
                                  // Toplam süreyi hesapla
                                  let totalDuration = 60;
                                  if (item.created_at && item.teklif_expires_at) {
                                    try {
                                      const created = new Date(item.created_at).getTime();
                                      const expires = new Date(item.teklif_expires_at).getTime();
                                      if (!isNaN(created) && !isNaN(expires)) {
                                        totalDuration = Math.floor((expires - created) / 1000);
                                      }
                                    } catch (e) {
                                      // Hata durumunda varsayılan değeri kullan
                                    }
                                  }
                                  return (
                                    <span style={{
                                      color: '#999',
                                      fontSize: '11px',
                                      fontStyle: 'italic'
                                    }}>
                                      {remaining <= 5 ? 'Son 5 saniye iptal edilemez' :
                                       remaining >= (totalDuration - 5) ? 'İlk 5 saniye iptal edilemez' : ''}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                          
                          {item.is_okundu === 0 && (
                            <button 
                              style={{
                                backgroundColor: '#27ae60',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                              }}
                            >
                              Okundu
                            </button>
                          )}
                          
                          <button 
                            style={{
                              backgroundColor: '#e74c3c',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                    </div>
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Bildirimlerim;


