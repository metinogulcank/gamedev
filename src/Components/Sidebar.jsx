import React, { useState, useEffect } from "react";

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch("https://gamedev.mymedya.tr/api/get_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setFieldValues(data.user);
        }
      });
  }, []);
  return (
    <div className="ProfilMenu">
      <div className="ProfilMenuFoto">
        <a href="/profile">
          <img src="/images/unknownuser.jpg" alt="Profil" />
        </a>
      </div>
      <div className="ProfilMenuAd">
        <h1>{user ? user.fullname : "Yükleniyor..."}</h1>
      </div>
      <div className="ProfilMenuler">
        <ul>
          <li>
            <a href="/cuzdan">
              <i className="fa fa-credit-card"></i>Cüzdanım
            </a>
          </li>
          <li>
            <a href="/odeme">
              <i className="fas fa-money-bill-wave"></i>Bakiye Yükle
            </a>
          </li>
          <li>
            <a href="/profile">
              <i className="fa fa-user"></i>Kullanıcı Bilgilerim
            </a>
          </li>
          <li>
            <a href="/siparislerim">
              <i className="fas fa-shopping-bag"></i>Siparişlerim
            </a>
          </li>
          <li>
            <a href="/satislarim">
              <i className="fas fa-coins"></i>Satışlarım
            </a>
          </li>
          <li>
            <a href="/favorilerim">
              <i className="fa fa-star"></i>Favorilerim
            </a>
          </li>
          <li>
            <a href="/bildirimlerim">
              <i className="fa fa-bell"></i>Bildirimlerim
            </a>
          </li>
          <li>
            <a href="/yorumlarim">
              <i className="fa fa-comments"></i>Yorumlarım
            </a>
          </li>
          <li>
            <a href="/magaza-ayarlari">
              <i className="fas fa-store"></i>Mağaza Yönetimi
            </a>
          </li>
          <li>
            <a href="/desteklenenler">
              <i className="fas fa-handshake"></i>Destekle
            </a>
          </li>
          <li>
                    <a href="/ilanlarim">
              <i className="fas fa-clipboard-list"></i>İlanlarım
            </a>
          </li>
          <li>
            <a href="/ilan-ekle">
              <i className="fas fa-cart-plus"></i>İlan Ekle
            </a>
          </li>
          <li>
            <a href="/market">
              <i className="fas fa-store"></i>Market
            </a>
          </li>
          <li>
            <a href="/takas">
              <i className="fas fa-exchange-alt"></i>Takas İlanları
            </a>
          </li>
          <li>
            <a href="/takas-ekle">
              <i className="fas fa-people-arrows"></i>Takas (CS2)
              <span className="Profilenew">Yeni</span>
            </a>
          </li>
          <li>
            <a href="/knight-trade">
              <i className="fas fa-people-arrows"></i>Takas (Knight Online)
              <span className="Profilenew">Yeni</span>
            </a>
          </li>
          <li>
            <a href="/destek">
              <i className="fas fa-headset"></i>Yardım / Destek
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
