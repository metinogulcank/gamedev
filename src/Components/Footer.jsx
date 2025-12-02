import React from 'react'
import '../../public/css/site.css'

function Footer() {
  return (
    <>
    <section className="FooterArea">
        <div className="SetContent">
          <ul>
            <li>
              <a href="index.html">
                <img src="/images/Logo.png" alt="Logo" />
              </a>
            </li>
            <li>
              <div className="FooterMenu">
                <h2>JERVIS GAME</h2>
                <ul>
                  <li><a href="Kurumsal.html">Kurumsal</a></li>
                  <li><a href="Haberler.html">Haberler</a></li>
                  <li><a href="Sponsorluklar.html">Sponsorluklar</a></li>
                  <li><a href="Blog.html">Blog</a></li>
                  <li><a href="Logolar.html">Logolar</a></li>
                  <li><a href="iletisim.html">İletişim</a></li>
                </ul>
              </div>
              <div className="FooterMenu">
                <h2>KULLANICI</h2>
                <ul>
                  <li><a href="KullaniciBilgileri.html">Bilgilerim</a></li>
                  <li><a href="MagazaAyarlari.html">Mağazam</a></li>
                  <li><a href="Donate.html">Yayıncı Destekle</a></li>
                  <li><a href="YayinciBasvuru.html">Yayıncı Başvurusu</a></li>
                  <li><a href="KullaniciSozlesmesi.html">Kullanıcı Sözleşmesi</a></li>
                  <li><a href="MagazaKurallari.html">Mağaza Kuralları</a></li>
                </ul>
              </div>
              <div className="FooterMenu">
                <h2>ÖDEME</h2>
                <ul>
                  <li><a href="Odeme.html">Ödeme Seçenekleri</a></li>
                  <li><a href="Odeme.html">Kredi Kartı</a></li>
                  <li><a href="Odeme.html">Havale/EFT</a></li>
                  <li><a href="Odeme.html">Ödeme Yap(tım)</a></li>
                  <li><a href="Odeme.html">Mobil Ödeme</a></li>
                  <li><a href="iptaliadekosullari.html">İade-İptal Koşulları</a></li>
                </ul>
              </div>
              <div className="FooterMenu">
                <h2>DESTEK</h2>
                <ul>
                  <li><a href="Destek.html">Yardım & Destek</a></li>
                  <li><a href="#">Canlı Destek</a></li>
                  <li><a href="Destek.html">Destek Talepleri</a></li>
                  <li><a href="DestekTalepOlustur.html">Öneri ve Şikayet</a></li>
                </ul>
              </div>
            </li>
          </ul>
          <div className="clear"></div>
        </div>
      </section>

      <section className="Carts">
        <div className="SetContent">
          <ul>
            <li>Jervis Game&reg; | Copyrights 2022. Tüm Hakları Saklıdır. Bir <a rel="nofollow" href="http://www.mymedya.com.tr" target="_blank">My Medya</a> markasıdır.</li>
            <li>
              <img src="/images/Carts.png" alt="Payment Methods" />
            </li>
          </ul>
        </div>
      </section>

      <section className="FooterSocial">
        <div className="SetContent">
          <ul>
            <li>
              <ul>
                <li><a href="#">Gizlilik Politikası</a></li>
                <li><a href="#">Üyelik ve Hizmet Alım Sözleşmesi</a></li>
                <li><a href="#">Aydınlatma Metni (Kişisel Verilerin Korunması)</a></li>
              </ul>
            </li>
            <li>
              <div className="Social">
                <ul>
                  <li><a href="#"><i className="fab fa-facebook"></i></a></li>
                  <li><a href="#"><i className="fab fa-instagram"></i></a></li>
                  <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                  <li><a href="#"><i className="fab fa-twitch"></i></a></li>
                  <li><a href="#"><i className="fab fa-youtube"></i></a></li>
                  <li><a href="#"><i className="fab fa-whatsapp"></i></a></li>
                  <li><a href="#"><i className="fab fa-tiktok"></i></a></li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}

export default Footer