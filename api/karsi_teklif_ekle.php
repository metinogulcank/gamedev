<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'elep_gamedev';
    $user = 'elep_metinogulcank';
    $pass = '06ogulcan06';
    
    error_log("Karsi teklif ekle - Database bağlantısı kuruluyor...");
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    error_log("Karsi teklif ekle - Database bağlantısı başarılı");
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Tüm tarih hesaplamalarında aynı zamanı kullanabilmek için timezone ayarla
        date_default_timezone_set('Europe/Istanbul');
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("Karsi teklif ekle - Gelen input: " . print_r($input, true));
        
        // Gerekli alanları kontrol et
        if (!isset($input['ilan_id']) || !isset($input['teklif_veren_user_id']) || !isset($input['teklif_fiyati'])) {
            error_log("Karsi teklif ekle - Eksik parametreler: " . print_r($input, true));
            throw new Exception('Eksik parametreler: ilan_id, teklif_veren_user_id, teklif_fiyati gerekli');
        }
        
        $ilan_id = intval($input['ilan_id']);
        $teklif_veren_user_id = intval($input['teklif_veren_user_id']);
        $teklif_fiyati = floatval($input['teklif_fiyati']);
        
        if ($teklif_fiyati <= 0) {
            throw new Exception('Geçersiz teklif fiyatı');
        }
        
        // İlanın var olup olmadığını kontrol et
        error_log("Karsi teklif ekle - İlan kontrol ediliyor, ID: $ilan_id");
        $stmt = $pdo->prepare("SELECT id, user_id, price, item_name FROM ilanlar WHERE id = ?");
        $stmt->execute([$ilan_id]);
        $ilan = $stmt->fetch();
        error_log("Karsi teklif ekle - İlan bulundu: " . print_r($ilan, true));
        
        if (!$ilan) {
            error_log("Karsi teklif ekle - İlan bulunamadı, ID: $ilan_id");
            throw new Exception('İlan bulunamadı');
        }
        
        // Kullanıcının kendi ilanına teklif vermesini engelle
        if ($ilan['user_id'] == $teklif_veren_user_id) {
            throw new Exception('Kendi ilanınıza teklif veremezsiniz');
        }
        
        $ilan_fiyati = floatval($ilan['price']);
        $min_fiyat = $ilan_fiyati * 0.90;
        
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS buy_orders (
              id INT AUTO_INCREMENT PRIMARY KEY,
              buyer_id INT NOT NULL,
              item_name VARCHAR(255) NOT NULL,
              price DECIMAL(10,2) NOT NULL,
              status VARCHAR(16) NOT NULL DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX(buyer_id), INDEX(item_name), INDEX(status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            $minStmt = $pdo->prepare("SELECT MIN(price) AS min_price FROM buy_orders WHERE item_name = ? AND status = ?");
            $minStmt->execute([$ilan['item_name'], 'active']);
            $minRow = $minStmt->fetch();
            if ($minRow && isset($minRow['min_price']) && $minRow['min_price'] !== null && $minRow['min_price'] !== '') {
                $min_fiyat = floatval($minRow['min_price']);
            }
        } catch (\PDOException $e) {
            error_log("Karsi teklif ekle - Minimum sipariş fiyatı kontrol hatası: " . $e->getMessage());
        }
        
        if ($teklif_fiyati < $min_fiyat) {
            throw new Exception('Teklif fiyatı minimum tutarın altında olamaz. Minimum: ' . number_format($min_fiyat, 2, ',', '.') . ' ₺');
        }
        
        // Mevcut tablo yapısını kontrol et ve eksik kolonları ekle
        try {
            // expires_at kolonunu kontrol et
            $pdo->query("SELECT expires_at FROM karsi_teklifler LIMIT 1");
        } catch (\PDOException $e) {
            // expires_at kolonu yoksa ekle
            $pdo->exec("ALTER TABLE karsi_teklifler ADD COLUMN expires_at TIMESTAMP NULL");
        }
        
        // teklif_durumu kolonunu kontrol et (durum yerine)
        try {
            $pdo->query("SELECT teklif_durumu FROM karsi_teklifler LIMIT 1");
        } catch (\PDOException $e) {
            // teklif_durumu kolonu yoksa ekle
            $pdo->exec("ALTER TABLE karsi_teklifler ADD COLUMN teklif_durumu ENUM('beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi', 'suresi_doldu') DEFAULT 'beklemede'");
        }
        
        // Daha önce aktif teklif verip vermediğini kontrol et
        $stmt = $pdo->prepare("SELECT id FROM karsi_teklifler WHERE ilan_id = ? AND teklif_veren_user_id = ? AND (teklif_durumu = 'beklemede' OR teklif_durumu IS NULL)");
        $stmt->execute([$ilan_id, $teklif_veren_user_id]);
        if ($stmt->fetch()) {
            throw new Exception('Bu ilana zaten aktif bir teklifiniz var');
        }
        
        // Geçerlilik süresi: 1 dakika
        $expires_at_dt = new DateTime('+1 minute');
        $expires_at = $expires_at_dt->format('Y-m-d H:i:s');
        
        // Karşı teklifi ekle
        $stmt = $pdo->prepare("INSERT INTO karsi_teklifler (ilan_id, teklif_veren_user_id, teklif_fiyati, teklif_durumu, expires_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$ilan_id, $teklif_veren_user_id, $teklif_fiyati, 'beklemede', $expires_at]);
        
        $teklif_id = $pdo->lastInsertId();
        
        // Teklif veren kullanıcı bilgisini al (users veya user tablosunu dene)
        $teklif_veren_adi = 'Kullanıcı';
        try {
            $stmt = $pdo->prepare("SELECT fullname, email FROM users WHERE id = ?");
            $stmt->execute([$teklif_veren_user_id]);
            $teklif_veren = $stmt->fetch();
            if ($teklif_veren) {
                $teklif_veren_adi = $teklif_veren['fullname'];
            }
        } catch (\PDOException $e) {
            // users tablosu yoksa user tablosunu dene
            try {
                $stmt = $pdo->prepare("SELECT fullname, email FROM user WHERE id = ?");
                $stmt->execute([$teklif_veren_user_id]);
                $teklif_veren = $stmt->fetch();
                if ($teklif_veren) {
                    $teklif_veren_adi = $teklif_veren['fullname'];
                }
            } catch (\PDOException $e2) {
                error_log("Kullanıcı bilgisi alınamadı: " . $e2->getMessage());
            }
        }
        
        // Bildirimler tablosunun var olup olmadığını kontrol et
        try {
            $pdo->query("SELECT 1 FROM bildirimler LIMIT 1");
        } catch (\PDOException $e) {
            // Tablo yoksa oluştur
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS bildirimler (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    bildirim_text TEXT NOT NULL,
                    is_okundu TINYINT(1) DEFAULT 0,
                    takas_ilan_id INT NULL,
                    karsi_teklif_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_karsi_teklif_id (karsi_teklif_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        }
        
        // Bildirimler tablosuna karsi_teklif_id kolonunu ekle (eğer yoksa)
        try {
            $pdo->query("SELECT karsi_teklif_id FROM bildirimler LIMIT 1");
        } catch (\PDOException $e) {
            try {
                $pdo->exec("ALTER TABLE bildirimler ADD COLUMN karsi_teklif_id INT NULL");
            } catch (\PDOException $e2) {
                error_log("karsi_teklif_id kolonu eklenirken hata: " . $e2->getMessage());
            }
        }
        
        // İlan sahibine bildirim gönder (satıcıya)
        try {
            $bildirim_text = $teklif_veren_adi . " size " . $ilan['item_name'] . " için " . number_format($teklif_fiyati, 2, ',', '.') . "₺ karşı teklif verdi!";
            $stmt2 = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu, karsi_teklif_id) VALUES (?, ?, 0, ?)");
            $stmt2->execute([$ilan['user_id'], $bildirim_text, $teklif_id]);
            error_log("İlan sahibine bildirim eklendi - user_id: " . $ilan['user_id'] . ", teklif_id: " . $teklif_id);
        } catch (\PDOException $e) {
            error_log("İlan sahibine bildirim eklenirken hata: " . $e->getMessage());
            // Bildirim eklenemese bile devam et
        }
        
        // Teklif verene de bildirim gönder (ilan veren)
        try {
            $ilan_sahibi_adi = 'Satıcı';
            try {
                $ilan_sahibi_stmt = $pdo->prepare("SELECT fullname FROM users WHERE id = ?");
                $ilan_sahibi_stmt->execute([$ilan['user_id']]);
                $ilan_sahibi = $ilan_sahibi_stmt->fetch();
                if ($ilan_sahibi) {
                    $ilan_sahibi_adi = $ilan_sahibi['fullname'];
                }
            } catch (\PDOException $e) {
                // users tablosu yoksa user tablosunu dene
                $ilan_sahibi_stmt = $pdo->prepare("SELECT fullname FROM user WHERE id = ?");
                $ilan_sahibi_stmt->execute([$ilan['user_id']]);
                $ilan_sahibi = $ilan_sahibi_stmt->fetch();
                if ($ilan_sahibi) {
                    $ilan_sahibi_adi = $ilan_sahibi['fullname'];
                }
            }
            
            $bildirim_text_teklif_veren = "Siz " . $ilan_sahibi_adi . " kullanıcısının " . $ilan['item_name'] . " ilanına " . number_format($teklif_fiyati, 2, ',', '.') . "₺ karşı teklif verdiniz.";
            $stmt3 = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu, karsi_teklif_id) VALUES (?, ?, 0, ?)");
            $stmt3->execute([$teklif_veren_user_id, $bildirim_text_teklif_veren, $teklif_id]);
            error_log("Teklif verene bildirim eklendi - user_id: " . $teklif_veren_user_id . ", teklif_id: " . $teklif_id);
        } catch (\PDOException $e) {
            error_log("Teklif verene bildirim eklenirken hata: " . $e->getMessage());
            // Bildirim eklenemese bile devam et
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Karşı teklif başarıyla eklendi!',
            'teklif_id' => $teklif_id
        ]);
        
    } else {
        throw new Exception('Sadece POST metodu desteklenir');
    }
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
