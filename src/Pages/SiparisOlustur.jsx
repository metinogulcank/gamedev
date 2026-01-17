import React from 'react';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

function SiparisOlustur() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { email } = JSON.parse(stored);
    fetch('https://elephunt.com/api/get_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      });
  }, []);
  return (
    <div>
      <div className="NavBarOverlay"></div>
      <Topbar />
      <section className="ProfilPageArea">
        <div className="ProfilPageContent">
          <div className="SetContent">
            <div className="ProfilArea">
              <Sidebar />
              <div className="ProfilDetail">
                <h5>SİPARİŞ OLUŞTUR</h5>
                <div className="CardContent">
                  <OrderCreate user={user} />
                </div>
              </div>
              <div className="clear"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SiparisOlustur;

function OrderCreate({ user }) {
  const [search, setSearch] = React.useState('');
  const [catalog, setCatalog] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [price, setPrice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    fetch('https://elephunt.com/api/get_market_catalog.php')
      .then(res => res.json())
      .then(d => { if (d.success) setCatalog(d.items || []); });
  }, []);
  const filtered = catalog.filter(it => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return it.name.toLowerCase().includes(q);
  });
  return (
    <div>
      <style>{`
        .order-flex { display:flex; gap:24px; align-items:flex-start; width:100%; }
        .order-left { flex:1; background:#181c24; border-radius:12px; padding:12px; max-height:70vh; overflow-y:auto; }
        .order-search { display:flex; gap:8; margin-bottom:10px; }
        .order-item { display:flex; gap:8; align-items:center; padding:8px; border-radius:8px; border:1px solid #333; background:#181c24; cursor:pointer; }
        .order-item.selected { border:2px solid #66c0f4; }
        .order-right { width:40%; min-width:260px; max-width:360px; background:#202a36; border-radius:12px; padding:18px; color:#fff; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .order-right img { width:96px; height:96px; object-fit:contain; background:#111; border-radius:6px; border:1px solid #222; }
        .order-input { width:100%; padding:8px; border-radius:6px; border:1px solid #444; background:#23272e; color:#fff; font-size:15px; }
      `}</style>
      <div className="order-flex">
        <div className="order-left">
          <div className="order-search">
            <input
              type="text"
              placeholder="Skin ara: Örn. G3SG1 | VariCamo"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#23272e', color: '#fff' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {filtered.map((it, idx) => (
              <div
                key={idx}
                className={"order-item" + (selected===it ? " selected" : "")}
                onClick={() => setSelected(it)}
                title={it.name}
              >
                {it.image && <img src={`https://steamcommunity-a.akamaihd.net/economy/image/${it.image}`} alt={it.name} width={40} height={40} />}
                <div style={{ color:'#fff', fontSize:13, lineHeight:1.2 }}>
                  <div style={{ fontWeight:600 }}>{it.name}</div>
                  <div style={{ color:'#aaa' }}>İlan: {it.count} • Fiyat: {Number(it.minPrice||0).toFixed(2)} ₺</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="order-right">
          {selected ? (
            <>
              {selected.image && (
                <img src={`https://steamcommunity-a.akamaihd.net/economy/image/${selected.image}`} alt={selected.name} />
              )}
              <div style={{ fontSize:15, fontWeight:600, textAlign:'center' }}>{selected.name}</div>
              <input
                type="number"
                className="order-input"
                placeholder="Teklif fiyatı (₺)"
                value={price}
                onChange={e => setPrice(e.target.value.replace(',', '.'))}
              />
              <button
                className="BtnCekimYap"
                disabled={!price || loading}
                onClick={async () => {
                  if (!user?.id) { alert('Giriş yapmalısınız'); return; }
                  const p = parseFloat(price);
                  if (isNaN(p) || p <= 0) { alert('Geçerli bir fiyat girin'); return; }
                  setLoading(true);
                  try {
                    const res = await fetch('https://elephunt.com/api/create_buy_order.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ buyer_id: user.id, item_name: selected.name, price: p })
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert('Sipariş oluşturuldu');
                      setSelected(null); setPrice(''); setSearch('');
                    } else {
                      alert(data.message || 'Sipariş oluşturulamadı');
                    }
                  } catch (e) {
                    alert('Sunucu hatası');
                  }
                  setLoading(false);
                }}
                style={{ width:'100%' }}
              >
                Sipariş Oluştur
              </button>
            </>
          ) : (
            <div style={{ color:'#ccc', textAlign:'center' }}>Soldan bir skin seçin</div>
          )}
        </div>
      </div>
    </div>
  );
}
