import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const YayinciBasvuru = ({ onNext, isModal = false }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    yayin_linki: '',
    sayfa_basligi: '',
    destek_adresi: '',
    min_bagis_tutari: 'Lütfen Seçim Yapınız',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      
      // Mevcut başvuru varsa getir
      if (userData.id) {
        fetchBasvuruData(userData.id);
      }
    }
  }, []);

  const fetchBasvuruData = async (userId) => {
    try {
      const response = await fetch(`https://gamedev.mymedya.tr/api/yayinci_basvuru.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setFormData({
          yayin_linki: data.data.yayin_linki || '',
          sayfa_basligi: data.data.sayfa_basligi || '',
          destek_adresi: data.data.destek_adresi || '',
          min_bagis_tutari: data.data.min_bagis_tutari || 'Lütfen Seçim Yapınız',
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

  const handleNext = (e) => {
    e.preventDefault();
    
    // Form verilerini localStorage'a kaydet
    localStorage.setItem('yayinci_basvuru_step1', JSON.stringify(formData));
    
    // Modal içindeyse prop ile, değilse navigate ile
    if (isModal && onNext) {
      onNext();
    } else {
      navigate('/yayinci-basvuru-2');
    }
  };

  if (!user && !isModal) {
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

  const formContent = (
    <form onSubmit={handleNext}>
                        <table className="streamapptable">
                          <tbody>
                            <tr>
                              <td>Yayın Linki</td>
                              <td>
                                <input
                                  type="text"
                                  name="yayin_linki"
                                  className="streamappinput"
                                  placeholder="Örn: https://twitch.tv/birbilenadam"
                                  value={formData.yayin_linki}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Sayfa Başlığı</td>
                              <td>
                                <input
                                  type="text"
                                  name="sayfa_basligi"
                                  className="streamappinput"
                                  placeholder="Örn: Bir Bilen Adam"
                                  value={formData.sayfa_basligi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Destek Adresi Oluştur</td>
                              <td>
                                <label>jervisgame.com/destekle/</label>
                                <input
                                  type="text"
                                  name="destek_adresi"
                                  className="streamappinput"
                                  value={formData.destek_adresi}
                                  onChange={handleInputChange}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Minimum Bağış Tutarı</td>
                              <td>
                                <select
                                  name="min_bagis_tutari"
                                  className="streamappinput"
                                  value={formData.min_bagis_tutari}
                                  onChange={handleInputChange}
                                >
                                  <option value="Lütfen Seçim Yapınız">Lütfen Seçim Yapınız</option>
                                  <option value="1">1 TL</option>
                                  <option value="2">2 TL</option>
                                  <option value="3">3 TL</option>
                                  <option value="4">4 TL</option>
                                  <option value="5">5 TL</option>
                                  <option value="6">6 TL</option>
                                  <option value="7">7 TL</option>
                                  <option value="8">8 TL</option>
                                  <option value="9">9 TL</option>
                                  <option value="10">10 TL</option>
                                  <option value="15">15 TL</option>
                                  <option value="20">20 TL</option>
                                  <option value="25">25 TL</option>
                                  <option value="30">30 TL</option>
                                  <option value="35">35 TL</option>
                                  <option value="40">40 TL</option>
                                  <option value="45">45 TL</option>
                                  <option value="50">50 TL</option>
                                  <option value="55">55 TL</option>
                                  <option value="60">60 TL</option>
                                  <option value="65">65 TL</option>
                                  <option value="70">70 TL</option>
                                  <option value="75">75 TL</option>
                                  <option value="80">80 TL</option>
                                  <option value="85">85 TL</option>
                                  <option value="90">90 TL</option>
                                  <option value="95">95 TL</option>
                                  <option value="100">100 TL</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>
                                <button type="submit" className="BtnCekimYap">
                                  Sonraki Adım
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
        <div className="CardTitle" style={{ marginBottom: '20px' }}>YAYINCI BİLGİLERİM</div>
        <div className="CardContent">
          {formContent}
        </div>
      </div>
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
                    <div className="CardTitle">YAYINCI BİLGİLERİM</div>
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
    </>
  );
};

export default YayinciBasvuru;

