import React from 'react'
import '../../public/css/site.css'

function HeaderTop() {
  return (
    <div className="HeaderTop">
          <div className="SetContent">
            <div className="GamesTop">
              <ul>
                <li>Oyun Seçiniz :</li>
              </ul>
              <select id="konu" name="Oyunsec" className="GameSelected">
                <option value="CS2">CS2</option>
                <option value="Knight Online">Knight Online</option>
                <option value="Valorant VP">Valorant VP</option>
                <option value="PUBG UC">PUBG UC</option>
              </select>
            </div>

            <i className="fas fa-bars bars"></i>
            <div className="MainMenu">
              <i className="fas fa-times MenuClose"></i>
              <div className="TopMenu">
                <ul>
                  <li><a href="Kurumsal.html">KURUMSAL</a></li>
                  <li><a href="Haberler.html">HABERLER</a></li>
                  <li><a href="Kampanyalar.html">KAMPANYALAR</a></li>
                  <li><a href="Donate.html">DESTEKLE</a></li>
                  <li><a href="ilanEkle.html">SATIŞ YAP</a></li>
                </ul>
              </div>
            </div>

            <div className="clear"></div>
          </div>
        </div>
  )
}

export default HeaderTop