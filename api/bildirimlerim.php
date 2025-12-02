<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// OPTIONS request handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hata ayıklama için tüm PHP hatalarını JSON olarak döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'gamedev_db';
    $user = 'gamedev_User';
    $pass = 'gamedev_5815471';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_GET['user_id'])) {
            throw new Exception('user_id parametresi gerekli');
        }
        
        $user_id = intval($_GET['user_id']);
        
        // Kullanıcının var olup olmadığını kontrol et (users veya user tablosunu dene)
        $user_exists = false;
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            if ($stmt->fetch()) {
                $user_exists = true;
            }
        } catch (Exception $e) {
            // users tablosu yoksa user tablosunu dene
            try {
                $stmt = $pdo->prepare("SELECT id FROM user WHERE id = ?");
                $stmt->execute([$user_id]);
                if ($stmt->fetch()) {
                    $user_exists = true;
                }
            } catch (Exception $e2) {
                // Her iki tablo da yoksa hata ver
            }
        }
        
        if (!$user_exists) {
            throw new Exception('Kullanıcı bulunamadı');
        }
        
        // Bildirimler tablosunun var olup olmadığını kontrol et
        try {
            $pdo->query("SELECT 1 FROM bildirimler LIMIT 1");
        } catch (Exception $e) {
            // Tablo yoksa oluştur
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `bildirimler` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `user_id` int(11) NOT NULL,
                  `bildirim_text` text NOT NULL,
                  `is_okundu` tinyint(1) NOT NULL DEFAULT 0,
                  `takas_ilan_id` int(11) NULL,
                  `karsi_teklif_id` int(11) NULL,
                  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_user_id` (`user_id`),
                  KEY `idx_is_okundu` (`is_okundu`),
                  KEY `idx_created_at` (`created_at`),
                  KEY `idx_takas_ilan_id` (`takas_ilan_id`),
                  KEY `idx_karsi_teklif_id` (`karsi_teklif_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        }
        
        // karsi_teklif_id kolonunu kontrol et ve ekle (eğer yoksa)
        try {
            $pdo->query("SELECT karsi_teklif_id FROM bildirimler LIMIT 1");
        } catch (Exception $e) {
            $pdo->exec("ALTER TABLE bildirimler ADD COLUMN karsi_teklif_id INT NULL");
        }
        
        // karsi_teklifler tablosunun var olup olmadığını kontrol et
        $karsi_teklifler_exists = false;
        try {
            $pdo->query("SELECT 1 FROM karsi_teklifler LIMIT 1");
            $karsi_teklifler_exists = true;
        } catch (Exception $e) {
            // Tablo yoksa oluşturmayı dene
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS karsi_teklifler (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        ilan_id INT NOT NULL,
                        teklif_veren_user_id INT NOT NULL,
                        teklif_fiyati DECIMAL(10,2) NOT NULL,
                        teklif_durumu ENUM('beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi', 'suresi_doldu') DEFAULT 'beklemede',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP NULL,
                        INDEX idx_ilan_id (ilan_id),
                        INDEX idx_teklif_veren_user_id (teklif_veren_user_id),
                        INDEX idx_teklif_durumu (teklif_durumu),
                        INDEX idx_expires_at (expires_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                $karsi_teklifler_exists = true;
            } catch (Exception $e2) {
                $karsi_teklifler_exists = false;
            }
        }
        
        // Toplam bildirim sayısını al
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as toplam 
            FROM bildirimler 
            WHERE user_id = ?
        ");
        $stmt->execute([$user_id]);
        $toplam_result = $stmt->fetch();
        $toplam_bildirim = intval($toplam_result['toplam']);
        
        // Okunmamış bildirim sayısını al
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as okunmamis 
            FROM bildirimler 
            WHERE user_id = ? AND is_okundu = 0
        ");
        $stmt->execute([$user_id]);
        $okunmamis_result = $stmt->fetch();
        $okunmamis_sayisi = intval($okunmamis_result['okunmamis']);
        
        // Bildirimleri getir (hepsini çek) - karşı teklif durumunu da dahil et
        // Önce karsi_teklif_id kolonunun varlığını kontrol et
        $karsi_teklif_id_exists = false;
        try {
            $pdo->query("SELECT karsi_teklif_id FROM bildirimler LIMIT 1");
            $karsi_teklif_id_exists = true;
        } catch (Exception $e) {
            $karsi_teklif_id_exists = false;
        }
        
        // Bildirimleri getir - karsi_teklifler tablosu varsa JOIN yap, yoksa sadece bildirimleri getir
        try {
            if ($karsi_teklifler_exists && $karsi_teklif_id_exists) {
                // Önce karsi_teklif_id kolonunun varlığını tekrar kontrol et
                $stmt = $pdo->prepare("
                    SELECT b.id, b.user_id, b.bildirim_text, b.is_okundu, b.takas_ilan_id, 
                           COALESCE(b.karsi_teklif_id, NULL) as karsi_teklif_id, 
                           b.created_at,
                           COALESCE(kt.teklif_durumu, '') as teklif_durumu,
                           kt.expires_at as teklif_expires_at,
                           kt.created_at as teklif_created_at,
                           kt.ilan_id as teklif_ilan_id,
                           COALESCE(kt.teklif_veren_user_id, NULL) as teklif_veren_user_id,
                           i.user_id as ilan_sahibi_id
                    FROM bildirimler b
                    LEFT JOIN karsi_teklifler kt ON b.karsi_teklif_id = kt.id
                    LEFT JOIN ilanlar i ON kt.ilan_id = i.id
                    WHERE b.user_id = ? 
                    ORDER BY b.created_at DESC
                ");
            } else {
                // karsi_teklifler tablosu veya karsi_teklif_id kolonu yoksa sadece bildirimleri getir
                if ($karsi_teklif_id_exists) {
                    $stmt = $pdo->prepare("
                        SELECT b.id, b.bildirim_text, b.is_okundu, b.takas_ilan_id, 
                               COALESCE(b.karsi_teklif_id, NULL) as karsi_teklif_id, 
                               b.created_at,
                               '' as teklif_durumu,
                               NULL as teklif_expires_at,
                               NULL as ilan_sahibi_id,
                               NULL as teklif_veren_user_id
                        FROM bildirimler b
                        WHERE b.user_id = ? 
                        ORDER BY b.created_at DESC
                    ");
                } else {
                    $stmt = $pdo->prepare("
                        SELECT b.id, b.bildirim_text, b.is_okundu, b.takas_ilan_id, NULL as karsi_teklif_id, b.created_at,
                               '' as teklif_durumu,
                               NULL as teklif_expires_at,
                               NULL as ilan_sahibi_id,
                               NULL as teklif_veren_user_id
                        FROM bildirimler b
                        WHERE b.user_id = ? 
                        ORDER BY b.created_at DESC
                    ");
                }
            }
            $stmt->execute([$user_id]);
            $bildirimler = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Bildirimler sorgusu başarılı - " . count($bildirimler) . " bildirim bulundu");
            
            // Debug: Karşı teklif içeren bildirimleri logla
            foreach ($bildirimler as $idx => $b) {
                if ($b['karsi_teklif_id']) {
                    error_log("Bildirim $idx - karsi_teklif_id: " . $b['karsi_teklif_id'] . ", teklif_veren_user_id: " . ($b['teklif_veren_user_id'] ?? 'NULL') . ", teklif_expires_at: " . ($b['teklif_expires_at'] ?? 'NULL'));
                }
            }
        } catch (\PDOException $e) {
            // JOIN hatası olursa, sadece bildirimleri getir
            error_log("Bildirimler JOIN hatası: " . $e->getMessage());
            error_log("Bildirimler JOIN hatası - Stack trace: " . $e->getTraceAsString());
            $stmt = $pdo->prepare("
                SELECT b.id, b.bildirim_text, b.is_okundu, b.takas_ilan_id, 
                       COALESCE(b.karsi_teklif_id, NULL) as karsi_teklif_id, 
                       b.created_at,
                       '' as teklif_durumu,
                       NULL as teklif_expires_at,
                       NULL as ilan_sahibi_id,
                       NULL as teklif_veren_user_id
                FROM bildirimler b
                WHERE b.user_id = ? 
                ORDER BY b.created_at DESC
            ");
            $stmt->execute([$user_id]);
            $bildirimler = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Bildirimler fallback sorgusu başarılı - " . count($bildirimler) . " bildirim bulundu");
        }
        
        // Debug: Bildirimleri logla
        error_log("Bildirimler - Toplam: " . count($bildirimler));
        foreach ($bildirimler as $idx => $b) {
            error_log("Bildirim $idx - karsi_teklif_id: " . ($b['karsi_teklif_id'] ?? 'NULL') . ", teklif_durumu: " . ($b['teklif_durumu'] ?? 'NULL'));
        }
        
        // Bildirimleri formatla
        $formatted_bildirimler = array_map(function($bildirim) {
            // Durum metnini artık bildirim metnine eklemeyeceğiz,
            // sadece rozetler ve ayrı alanlar için hesaplayacağız.
            $durum_text = '';
            // karsi_teklif_id kontrolü - NULL, 0, veya boş değilse
            $karsi_teklif_id_value = $bildirim['karsi_teklif_id'] ?? null;
            if ($karsi_teklif_id_value !== null && $karsi_teklif_id_value !== '' && $karsi_teklif_id_value !== 0) {
                $durum = $bildirim['teklif_durumu'] ?? '';
                if ($durum === 'beklemede' || $durum === '') {
                    // Süre kontrolü
                    if ($bildirim['teklif_expires_at']) {
                        $now = new DateTime();
                        $expires = new DateTime($bildirim['teklif_expires_at']);
                        if ($now > $expires) {
                            $durum_text = ' (Süresi Doldu)';
                        } else {
                            $durum_text = ' (Beklemede)';
                        }
                    } else {
                        $durum_text = ' (Beklemede)';
                    }
                } elseif ($durum === 'onaylandi') {
                    $durum_text = ' (Onaylandı ✓)';
                } elseif ($durum === 'reddedildi') {
                    $durum_text = ' (Reddedildi ✗)';
                } elseif ($durum === 'iptal_edildi') {
                    $durum_text = ' (İptal Edildi)';
                } elseif ($durum === 'suresi_doldu') {
                    $durum_text = ' (Süresi Doldu)';
                }
            }
            
            // teklif_durumu'nu temizle - boş string veya null ise 'beklemede' yap
            $teklif_durumu = trim($bildirim['teklif_durumu'] ?? '');
            $karsi_teklif_id_check = $bildirim['karsi_teklif_id'] ?? null;
            $has_karsi_teklif = ($karsi_teklif_id_check !== null && $karsi_teklif_id_check !== '' && $karsi_teklif_id_check !== 0);
            
            if (($teklif_durumu === '' || $teklif_durumu === null) && $has_karsi_teklif) {
                // Süre kontrolü yap
                if ($bildirim['teklif_expires_at']) {
                    try {
                        $now = new DateTime();
                        $expires = new DateTime($bildirim['teklif_expires_at']);
                        if ($now > $expires) {
                            $teklif_durumu = 'suresi_doldu';
                        } else {
                            $teklif_durumu = 'beklemede';
                        }
                    } catch (Exception $e) {
                        $teklif_durumu = 'beklemede';
                    }
                } else {
                    $teklif_durumu = 'beklemede';
                }
            }
            
            // karsi_teklif_id değerini kontrol et
            $karsi_teklif_id_final = null;
            $karsi_teklif_id_raw = $bildirim['karsi_teklif_id'] ?? null;
            if ($karsi_teklif_id_raw !== null && $karsi_teklif_id_raw !== '' && $karsi_teklif_id_raw !== 0) {
                $karsi_teklif_id_final = intval($karsi_teklif_id_raw);
            }
            
            // Bildirim sahibi user_id'yi al (bildirim kime gönderildi)
            $bildirim_user_id = isset($bildirim['user_id']) ? intval($bildirim['user_id']) : null;
            
            // Eğer teklif_veren_user_id NULL ise ve bildirim metni "karşı teklif verdiniz" içeriyorsa
            // bildirim teklif verene gönderilmiştir, yani bildirim_user_id = teklif_veren_user_id
            $teklif_veren_user_id_final = isset($bildirim['teklif_veren_user_id']) ? intval($bildirim['teklif_veren_user_id']) : null;
            if (!$teklif_veren_user_id_final && $bildirim_user_id && 
                isset($bildirim['bildirim_text']) && 
                strpos($bildirim['bildirim_text'], 'karşı teklif verdiniz') !== false) {
                // Bildirim metni "karşı teklif verdiniz" içeriyorsa, bu bildirim teklif verene gönderilmiştir
                $teklif_veren_user_id_final = $bildirim_user_id;
            }
            
            return [
                'id' => intval($bildirim['id']),
                // Bildirim metnini olduğu gibi gönder (sonuna "(İptal Edildi)" vb. EKLEME)
                'bildirim_text' => $bildirim['bildirim_text'],
                'is_okundu' => intval($bildirim['is_okundu']),
                'takas_ilan_id' => $bildirim['takas_ilan_id'] ? intval($bildirim['takas_ilan_id']) : null,
                'karsi_teklif_id' => $karsi_teklif_id_final,
                'teklif_durumu' => $teklif_durumu ? $teklif_durumu : null,
                'teklif_expires_at' => $bildirim['teklif_expires_at'] ?? null,
                'teklif_created_at' => isset($bildirim['teklif_created_at']) ? $bildirim['teklif_created_at'] : null,
                'ilan_sahibi_id' => isset($bildirim['ilan_sahibi_id']) ? intval($bildirim['ilan_sahibi_id']) : null,
                'teklif_veren_user_id' => $teklif_veren_user_id_final,
                'user_id' => $bildirim_user_id,
                'created_at' => $bildirim['created_at'],
                'created_at_formatted' => date('d.m.Y H:i', strtotime($bildirim['created_at']))
            ];
        }, $bildirimler);
        
        echo json_encode([
            'success' => true,
            'bildirimler' => $formatted_bildirimler,
            'toplam' => $toplam_bildirim,
            'okunmamis' => $okunmamis_sayisi
        ]);
        
    } else {
        throw new Exception('Sadece GET metodu desteklenir');
    }
    
} catch (\PDOException $e) {
    http_response_code(500);
    error_log("Bildirimlerim API PDO Hatası: " . $e->getMessage());
    error_log("Bildirimlerim API PDO Hatası - Dosya: " . $e->getFile() . " Satır: " . $e->getLine());
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("Bildirimlerim API Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
?>
