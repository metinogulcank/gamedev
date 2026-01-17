

function Reg() {
    console.log('Reg fonksiyonu çağrıldı');
   
    Swal.fire({
        allowEscapeKey: true,
        allowOutsideClick: false,
        showCloseButton: true,
        position: 'top',
        showConfirmButton: false,
        focusConfirm: false,
        showClass: {
            popup: 'animated slideInDown'
        },
        hideClass: {
            popup: 'animated slideOutUp'
        },
        html: `<ul class="LoginForm">
             <li>
            <h5>E-Posta Adresi</h5>
             <input type="text" class="swal2-input" id="loginEmail" placeholder="E-Posta Adresiniz"> 
             </li>
              <li>
            <h5>Şifre</h5>
            <input type="password" class="swal2-input" id="loginPassword" placeholder="Şifreniz">
                <span class="ForgetPassword btn" onclick="onBtnClicked('ForgetPassword')">Şifrenizi mi Unuttunuz?</span>
             </li>
              </ul >
             <a class="LoginButton btn" onclick="loginUser()">Giriş Yap</a>
                <div class="Or"><span>VEYA</span></div>
             <a class="SteamLoginButton"><i class="fab fa-steam"></i> Steam İle Giriş Yap</a> 
                `,
        title: 'Giriş Yap',
        footer: `<span>Üye Değil misiniz?</span> <a class="Cp KayitOl btn" onclick="onBtnClicked('KayitOl')">Şimdi Kayıt Ol</a>`,

    });
}

var onBtnClicked = (btnId) => {
    console.log('onBtnClicked çağrıldı:', btnId);

    if (btnId == "ForgetPassword") {
        Swal.fire({
            title: 'Şifre Sıfırla',
            allowEscapeKey: true,
            allowOutsideClick: false,
            showCloseButton: true,
            position: 'top',
            showConfirmButton: false,
            focusConfirm: false,
            showClass: {
               popup: 'DontAnimated '
            },
            hideClass: {
                popup: 'DontAnimated '
            },
            html : `<ul class="LoginForm">
            <li>
                <h5>E-Posta Adresi</h5>
                 <input type="text" class="swal2-input" id="resetEmail" placeholder="E-Posta Adresi"> 
               </li>
            </ul>
            <a class="ResetPassword" onclick="resetPassword()">SIFIRLAMA BAĞLANTISI GÖNDER</a>
                    `,
            footer: `<span>Üye Değil misiniz?</span> <a class="Cp KayitOl btn" onclick="onBtnClicked('KayitOl')">Şimdi Kayıt Ol</a>`,
        });
    }
    else if (btnId == "KayitOl") {
        Swal.fire({
            title: 'Kayıt Ol',
            allowEscapeKey: true,
            allowOutsideClick: false,
            showCloseButton: true,
            position: 'top',
            showConfirmButton: false,
            focusConfirm: false,
            showClass: {
                popup: 'DontAnimated '
            },
            hideClass: {
                popup: 'DontAnimated '
            },
            html: `<ul class="LoginForm">
            <li>
                <h5>Ad Soyad</h5>
                 <input type="text" class="swal2-input" id="regFullname" placeholder="Ad Soyad"> 
               </li>
            <li>
                <h5>E-Posta Adresi</h5>
                 <input type="email" class="swal2-input" id="regEmail" placeholder="E-Posta Adresi"> 
               </li>
            <li>
                <h5>Şifre</h5>
                 <input type="password" class="swal2-input" id="regPassword" placeholder="Şifre"> 
               </li>
            <li>
                <h5>Şifre Tekrar</h5>
                 <input type="password" class="swal2-input" id="regPassword2" placeholder="Şifre Tekrar"> 
               </li>
            </ul>
            <a class="LoginButton" onclick="registerUser()">Kayıt Ol</a>
                <div class="Or"><span>VEYA</span></div>
                 <a class="SteamLoginButton"><i class="fab fa-steam"></i> Steam İle Giriş Yap</a> 
                <p class="LoginText">
                    Sitemize kaydolarak <a href="#">Şartlar ve Koşullarımızı</a> ve <br /> <a href="#">Gizlilik Politikamızı</a> kabul etmiş sayılırsınız.
                <p/>
                    `,

                footer: `<span>Zaten Kayıtlı mısınız?</span> <a class="Cp KayitOl btn" onclick="onBtnClicked('Login')">Şimdi Giriş Yap</a>`,
        });
    } else if (btnId == "Login") {
        Reg();
    } else if (btnId == "LoginButton") {
        loginUser();
    }
};

// Login fonksiyonu
function loginUser() {
    console.log('=== LOGIN USER FONKSİYONU BAŞLADI ===');
    console.log('loginUser fonksiyonu çağrıldı');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    console.log('Email input bulundu:', emailInput);
    console.log('Password input bulundu:', passwordInput);
    
    if (!emailInput || !passwordInput) {
        console.error('Input alanları bulunamadı');
        Swal.fire('Hata', 'Form alanları bulunamadı.', 'error');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;

    console.log('Email değeri:', email);
    console.log('Password değeri:', password);

    if (!email || !password) {
        console.log('Email veya password boş!');
        Swal.fire('Hata', 'Lütfen tüm alanları doldurun.', 'error');
        return;
    }

    console.log('=== API İSTEĞİ GÖNDERİLİYOR ===');
    console.log('URL:', 'http://elephunt.com/api/login.php');
    console.log('Gönderilecek data:', { email, password });

    fetch('http://elephunt.com/api/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API response:', data);
        if (data.success) {
            Swal.fire('Başarılı', data.message, 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            Swal.fire('Hata', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Hata', 'Sunucuya ulaşılamadı.', 'error');
    });
}

// Register fonksiyonu
function registerUser() {
    console.log('registerUser fonksiyonu çağrıldı');
    
    const fullname = document.getElementById('regFullname').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    console.log('Form data:', { fullname, email, password, password2 });

    if (!fullname || !email || !password || !password2) {
        Swal.fire('Hata', 'Lütfen tüm alanları doldurun.', 'error');
        return;
    }

    if (password !== password2) {
        Swal.fire('Hata', 'Şifreler eşleşmiyor.', 'error');
        return;
    }

    console.log('API isteği gönderiliyor...');

    fetch('http://elephunt.com/api/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fullname: fullname,
            email: email,
            password: password
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API response:', data);
        if (data.success) {
            Swal.fire('Başarılı', data.message, 'success');
            setTimeout(() => {
                onBtnClicked('Login');
            }, 1500);
        } else {
            Swal.fire('Hata', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Hata', 'Sunucuya ulaşılamadı.', 'error');
    });
}

// Şifre sıfırlama fonksiyonu
function resetPassword() {
    const email = document.getElementById('resetEmail').value;

    if (!email) {
        Swal.fire('Hata', 'Lütfen e-posta adresinizi girin.', 'error');
        return;
    }

    Swal.fire('Bilgi', 'Şifre sıfırlama özelliği yakında eklenecek.', 'info');
}






$(document).ready(function () {

    $(".cards .card").click(function () { // Add active class to active link
        $(this).addClass("active").siblings().removeClass("active");  // Hide all divs on click
        $(".action > div").hide();  //show div
        $('.' + $(this).data("class")).show();
        //$('.action').slideUp();
        //$('.action').delay(0).slideDown();
        //$('.action').stop();
    });

  

    $('#btn').on('click', function () {
        Reg();

    });
   
    $('.ProfilName').on('click', function () {
        $(".NavbarAccount").stop().toggle();
        $(".NavBarOverlay").stop().fadeToggle();
    });

  
    $(document).click((event) => {
        if (!$(event.target).closest('.ProfilName').length) {
            $(".NavbarAccount").stop().hide();
            $(".NavBarOverlay").stop().fadeOut();
        }
    });



    $('.BildirimName').on('click', function () {
        $(".NavbarNotifications").stop().toggle();
        $(".NavBarOverlay1").stop().fadeToggle();
    });

    $('.BildirimNameMain').on('click', function () {
        $(".NavbarNotificationsMain").stop().toggle();
        $(".NavBarOverlay1").stop().fadeToggle();
    });


    $(document).click((event) => {
        if (!$(event.target).closest('.BildirimName').length) {
            $(".NavbarNotifications").stop().hide();
            $(".NavBarOverlay1").stop().fadeOut();
        }
    });



    function formatState(item) {
        opt = $(item.element);
        og = opt.closest('optgroup').attr('label');
        return og + ' | ' + item.text;
    };

    $(".Select").select2({
        language: "tr",
        width: "100%",
        templateSelection: formatState,
        templateResult: function (data, container) {
            if (data.element) {
                $(container).addClass($(data.element).attr("class"));
            }

            return data.text;
        },

    });

    $(function () {
        $('.tabs-nav a').click(function () {

            // Check for active
            $('.tabs-nav li').removeClass('activex');
            $(this).parent().addClass('activex');

            // Display active tab
            let currentTab = $(this).attr('href');
            $('.tabs-content > div').hide();
            $(currentTab).show();

            return false;
        });
    });

    $(function () {
        $('.tabs-nav1 a').click(function () {

            // Check for active
            $('.tabs-nav1 li').removeClass('activex');
            $(this).parent().addClass('activex');

            // Display active tab
            let currentTab = $(this).attr('href');
            $('.tabs-content1 > div').hide();
            $(currentTab).show();

            return false;
        });
    });

    $(function () {
        $('.tabs-nav2 a').click(function () {

            // Check for active
            $('.tabs-nav2 li').removeClass('activex');
            $(this).parent().addClass('activex');

            // Display active tab
            let currentTab = $(this).attr('href');
            $('.tabs-content2 > div').hide();
            $(currentTab).show();

            return false;
        });
    });

    //Menü
    "use strict";

    $('.TopMenu > ul > li > ul:not(:has(ul))').addClass('normal-sub');
    
    $(".TopMenu > ul > li").hover(function (e) {
        if ($(window).width() > 979) {
            $(this).children("ul").stop(true, false).fadeToggle(150);
            e.preventDefault();
        }
    });

    $(".TopMenu > ul > li").click(function () {
        if ($(window).width() <= 979) {
            $(this).children("ul").fadeToggle(150);
        }
    });

    $(".HeaderTop i").click(function () {
        $(".MainMenu").stop().animate({
            "left": "0",
        }, 200);
        $("body").addClass("SetFixed");

    });

    $(".MenuClose").click(function () {
        $(".MainMenu").animate({
            "left": "-100%",
        }, 200);
        $("body").removeClass("SetFixed");

    });

    $(".ProfileMenu i").click(function () {
        $(".ProfilMenu").stop().animate({
            'left': '0',
        }, 200);
        $("body").addClass("SetFixed");

    });

    $(".ProfileClose").click(function () {
        $(".ProfilMenu").animate({
            "left": "-100%",
        }, 200);
        $("body").removeClass("SetFixed");
    });


    $(".MobileFilter").click(function () {
        $("#FilterMarket").stop().animate({
            'left': '0',
        }, 200);
        $("body").addClass("SetFixed");

    });

    $(".FilterClose").click(function () {
        $("#FilterMarket").animate({
            "left": "-100%",
        }, 200);
        $("body").removeClass("SetFixed");
    });

    //Menü

    new WOW().init();

    $('.ProductsWeapons').mouseenter(function (e) {
       
        $(this).parent().attr("class", "Active");
        e.preventDefault();
    });

    $('.ProductsWeapons').mouseleave(function (e) {
        $(this).parent().attr("class", "");
        e.preventDefault();
    });


    $('.DownArrow a[href*=#]').on('click', function (event) {
        event.preventDefault();
        $('html,body').animate({ scrollTop: $(this.hash).offset().top }, 500);
    });

    $('#News').utilCarousel({
        showItems: 5,
        responsiveMode: 'itemWidthRange',
        itemWidthRange: [770, 500],
        interval: 4000,
        navigationText: ['<i class="icon-left-open-big"></i>', '<i class=" icon-right-open-big"></i>'],
        autoPlay: true,
        pagination: false,
        navigation: true
    });

    //Ürünler Carousel

    //Slider
    var Slides = $("#Slides").slippry({
        transition: 'fade',
        useCSS: true,
        speed: 1500,
        pause: 5000,
        auto: true,
        controls: false,
        preload: 'visible',
        autoHover: false
    });

    $('.ScrollTop').hide();
    $(window).scroll(function () {

        if ($(this).scrollTop() > 0)
        { $('.ScrollTop').fadeIn(); }
        else
        { $('.ScrollTop').fadeOut(); }
    }); $('.ScrollTop').click(function ()
    { $("html, body").animate({ scrollTop: 0 }, 600); return false; });

});

$(window).load(function () {

    $('.ScrollUp').hide();
    $(window).scroll(function () {

        if ($(this).scrollTop() > 500) { $('.ScrollUp').fadeIn(); }
        else { $('.ScrollUp').fadeOut(); }
    }); $('.ScrollUp').click(function () { $("html, body").animate({ scrollTop: 0 }, 600); return false; });
});
