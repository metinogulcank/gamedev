import React, { useEffect, useState } from 'react';
import Topbar from '../Components/Topbar';
import Sidebar from '../Components/Sidebar';

const Satislarim = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { setError('Giriş yapmalısınız.'); setLoading(false); return; }
    const u = JSON.parse(stored);
    fetch(`https://elephunt.com/api/satislarim.php?user_id=${u.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(data.orders || []);
        } else {
          setError(data.message || 'Satışlar alınamadı.');
        }
      })
      .catch(() => setError('Sunucuya ulaşılamadı.'))
      .finally(() => setLoading(false));
  }, []);

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
                <h5>Satışlarım</h5>
                <ul className="CardBlokFull">
                  <li>
                    <div className="CardTitle">Son Satışlar</div>
                    <div className="CardContent">
                      <table className="accountinfotable SetOddEven">
                        <tbody>
                          <tr>
                            <td>Ürün</td>
                            <td>Fiyat</td>
                            <td>Komisyon</td>
                            <td>Tarih</td>
                          </tr>
                          {loading && (
                            <tr><td colSpan="4">Yükleniyor...</td></tr>
                          )}
                          {error && !loading && (
                            <tr><td colSpan="4" style={{ color: 'red' }}>{error}</td></tr>
                          )}
                          {!loading && !error && orders.length === 0 && (
                            <tr><td colSpan="4">Hiç satış bulunmuyor.</td></tr>
                          )}
                          {!loading && !error && orders.map(o => (
                            <tr key={o.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <img src={`https://steamcommunity-a.akamaihd.net/economy/image/${o.image}`} alt={o.item_name} style={{ height: 40 }} />
                                  <span>{o.item_name}</span>
                                </div>
                              </td>
                              <td>{parseFloat(o.price).toFixed(2)} TL</td>
                              <td>{parseFloat(o.commission).toFixed(2)} TL</td>
                              <td>{new Date(o.created_at).toLocaleString('tr-TR')}</td>
                            </tr>
                          ))}
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

export default Satislarim;

