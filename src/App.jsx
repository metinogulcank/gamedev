import './App.css'
import Home from './Pages/Home'
import Profile from './Pages/Profile'
import Cuzdan from './Pages/Cuzdan'
import Odeme from './Pages/Odeme'
import IlanEkle from './Pages/ilanekle'
import Ilanlarim from './Pages/Ilanlarim'
import CekimTalep from './Pages/CekimTalep'
import Market from './Pages/Market'
import IlanDetay from './Pages/ilanDetay'
import Favorilerim from './Pages/Favorilerim'
import TakasEkle from './Pages/TakasEkle'
import Takas from './Pages/Takas'
import TakasDetay from './Pages/TakasDetay'
import Bildirimlerim from './Pages/Bildirimlerim'
import MagazaAyarlari from './Pages/MagazaAyarlari'
import Satislarim from './Pages/Satislarim'
import Siparislerim from './Pages/Siparislerim'
import SiparisOlustur from './Pages/SiparisOlustur'
import YayinciBasvuru from './Pages/YayinciBasvuru'
import YayinciBasvuru2 from './Pages/YayinciBasvuru2'
import YayinciDestekle from './Pages/YayinciDestekle'
import Sepet from './Pages/Sepet'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'

function App() {
  const [user] = useState(null)

  return (
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cuzdan" element={<Cuzdan />} />
        <Route path="/odeme" element={<Odeme />} />
        <Route path="/cekim-yap" element={<CekimTalep />} />
        <Route path="/ilan-ekle" element={<IlanEkle />} />
        <Route path="/ilanlarim" element={<Ilanlarim />} />
        <Route path="/market" element={<Market />} />
        <Route path="/skindetay/:id" element={<IlanDetay />} />
        <Route path="/favorilerim" element={<Favorilerim />} />
        <Route path="/takas-ekle" element={<TakasEkle />} />
        <Route path="/takas" element={<Takas />} />
        <Route path="/takas-detay/:id" element={<TakasDetay />} />
        <Route path="/bildirimlerim" element={<Bildirimlerim />} />
        <Route path="/magaza-ayarlari" element={<MagazaAyarlari />} />
        <Route path="/satislarim" element={<Satislarim />} />
        <Route path="/siparislerim" element={<Siparislerim />} />
        <Route path="/siparis-olustur" element={<SiparisOlustur />} />
        <Route path="/yayinci-basvuru" element={<YayinciBasvuru />} />
        <Route path="/yayinci-basvuru-2" element={<YayinciBasvuru2 />} />
        <Route path="/destekle/:yayinci_id" element={<YayinciDestekle />} />
        <Route path="/sepet" element={<Sepet />} />
      </Routes>
  )
}

export default App
