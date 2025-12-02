import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Topbar from '../Components/Topbar';

const Cuzdan = () => {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState('...');
    const [transactions, setTransactions] = useState([]);

    const methodLabels = {
        mycard: 'Kredi/Banka Kartı',
        authorize: 'Havale/EFT',
        payoneer: 'Papara',
        skrill: 'Jervis PIN',
        ininial: 'Ininial',
        paypall: 'PayPal'
    };

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const { email } = JSON.parse(stored);
            fetch('https://gamedev.mymedya.tr/api/get_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setUser(data.user);
                        setBalance(data.user.balance || '0,00 TL');
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                });
        }
    }, []);

    useEffect(() => {
        if (user?.email) {
            fetch('https://gamedev.mymedya.tr/api/get_balance_transactions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) setTransactions(data.transactions);
                });
        }
    }, [user]);

    const userName = user?.fullname || "Ahmet KAPLAN";
    const userEmail = user?.email || "ahmetkaplan@gmail.com";
    const withdrawableAmount = "5.000,00 TL";

    const transactionHistory = [
        { id: 1, date: '26.11.2021', item: 'StatTrak™ Butterfly Knife | Tiger Tooth', price: '15.750,00 TL', status: 'İşlem Tamamlandı' },
        { id: 2, date: '26.11.2021', item: 'StatTrak™ Butterfly Knife | Tiger Tooth', price: '15.750,00 TL', status: 'İşlem Tamamlandı' },
        { id: 3, date: '26.11.2021', item: 'StatTrak™ Butterfly Knife | Tiger Tooth', price: '15.750,00 TL', status: 'İşlem Tamamlandı' },
    ];

    const withdrawalRequests = [
        { id: 1, date: '26.11.2021', bank: 'Finansbank', method: 'EFT', amount: '2500,00 TL', notificationDate: '26.11.2021 15:41:59', status: 'Onaylandı' },
        { id: 2, date: '26.11.2021', bank: 'Finansbank', method: 'EFT', amount: '2500,00 TL', notificationDate: '26.11.2021 15:41:59', status: 'Onaylandı' },
    ];

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
                                <h5>CÜZDANIM</h5>

                                <ul className="CardBlok">
                                    <li>
                                        <div className="CardTitle">JERVİS GAME BAKİYE</div>
                                        <div className="CardContent">
                                            <img src="/images/jervismoney.png" width="80" alt="Balance" />
                                            <span className="balance">MEVCUT BAKİYE : <b>{balance}</b></span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="CardTitle">BAKİYE İŞLEMLERİ</div>
                                        <div className="CardContent">
                                            <table className="accountinfotable accountinfo">
                                                <tbody>
                                                    <tr>
                                                        <td>Çekilebilir Tutar</td>
                                                        <td>{withdrawableAmount}</td>
                                                    </tr>
                                                    <tr>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                    <tr>
                                                        <td></td>
                                                        <td><Link to="/cekim-yap" className="BtnCekimYap">ÇEKİM YAP</Link></td>
                                                        <td><Link to="/odeme" className="BtnCekimYap">BAKİYE YÜKLE</Link></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </li>
                                </ul>

                                <ul className="CardBlokFull">
                                    <li>
                                        <div className="CardTitle">İŞLEM GEÇMİŞİM <span><Link to="/islem-gecmisim">Tümünü Gör <i className="fas fa-arrow-right"></i></Link></span></div>
                                        <div className="CardContent">
                                            <table className="AccountTable islembasliklar">
                                                <thead>
                                                    <tr>
                                                        <th></th>
                                                        <th>Tarih</th>
                                                        <th>Item Adı</th>
                                                        <th>Fiyatı</th>
                                                        <th>Durumu</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactionHistory.map(tx => (
                                                        <tr key={tx.id}>
                                                            <td><i className="fa fa-credit-card"></i></td>
                                                            <td>{tx.date}</td>
                                                            <td>{tx.item}</td>
                                                            <td>{tx.price}</td>
                                                            <td><i className="fas fa-check"></i>{tx.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </li>
                                </ul>

                                <ul className="CardBlokFull">
                                    <li>
                                        <div className="CardTitle">ÇEKİM TALEPLERİM <span><Link to="/cekim-taleplerim">Tümünü Gör <i className="fas fa-arrow-right"></i></Link></span></div>
                                        <div className="CardContent">
                                            <table className="AccountTable islembasliklar">
                                                <thead>
                                                    <tr>
                                                        <th></th>
                                                        <th>Tarih</th>
                                                        <th>Banka Adı</th>
                                                        <th>Ödeme Şekli</th>
                                                        <th>Çekilen Tutar</th>
                                                        <th>Bildirim Tarihi</th>
                                                        <th>Durumu</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {withdrawalRequests.map(req => (
                                                        <tr key={req.id}>
                                                            <td><i className="fa fa-credit-card"></i></td>
                                                            <td>{req.date}</td>
                                                            <td>{req.bank}</td>
                                                            <td>{req.method}</td>
                                                            <td>{req.amount}</td>
                                                            <td>{req.notificationDate}</td>
                                                            <td><i className="fas fa-check"></i>{req.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </li>
                                </ul>

                                <ul className="CardBlokFull">
                                    <li>
                                        <div className="CardTitle">ÖDEME BİLDİRİMLERİM</div>
                                        <div className="CardContent">
                                            <table className="AccountTable islembasliklar">
                                                <thead>
                                                    <tr>
                                                        <th className='date'>Tarih</th>
                                                        <th className="amount">Tutar</th>
                                                        <th>Yöntem</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.length === 0 ? (
                                                        <tr><td colSpan={3}>Kayıt yok</td></tr>
                                                    ) : (
                                                        transactions.map(tx => (
                                                            <tr key={tx.id}>
                                                                <td className='date'>{new Date(tx.created_at).toLocaleString('tr-TR')}</td>
                                                                <td className="amount">{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                                                                <td>{methodLabels[tx.method] || tx.method}</td>
                                                            </tr>
                                                        ))
                                                    )}
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

export default Cuzdan;
