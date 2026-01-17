<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'elep_gamedev';
    $user = 'elep_metinogulcank';
    $pass = '06ogulcan06';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['teklif_id']) || !isset($input['user_id'])) {
            throw new Exception('Eksik parametreler: teklif_id, user_id gerekli');
        }
        
        $teklif_id = intval($input['teklif_id']);
        $user_id = intval($input['user_id']);
        
        // Tablo yapısını kontrol et ve eksik / eski kolonları düzenle
        try {
            // teklif_durumu kolonu var mı kontrol et
            $pdo->query("SELECT teklif_durumu FROM karsi_teklifler LIMIT 1");
            // Kolon varsa, enum değerlerini güncelle (iptal_edildi, suresi_doldu ekle)
            try {
                $pdo->exec("
                    ALTER TABLE karsi_teklifler 
                    MODIFY COLUMN teklif_durumu 
                    ENUM('beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi', 'suresi_doldu') 
                    NOT NULL DEFAULT 'beklemede'
                ");
                error_log("teklif_durumu kolonu enum değerleri güncellendi");
            } catch (\PDOException $e2) {
                // Enum zaten güncelse hata gelebilir, logla ve devam et
                error_log("teklif_durumu kolonu enum güncelleme bilgisi: " . $e2->getMessage());
            }
        } catch (\PDOException $e) {
            // Kolon yoksa oluştur
            try {
                $pdo->exec("
                    ALTER TABLE karsi_teklifler 
                    ADD COLUMN teklif_durumu 
                    ENUM('beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi', 'suresi_doldu') 
                    NOT NULL DEFAULT 'beklemede'
                ");
                error_log("teklif_durumu kolonu eklendi");
            } catch (\PDOException $e2) {
                error_log("teklif_durumu kolonu eklenirken hata: " . $e2->getMessage());
            }
        }
        
        try {
            $pdo->query("SELECT expires_at FROM karsi_teklifler LIMIT 1");
        } catch (\PDOException $e) {
            try {
                $pdo->exec("ALTER TABLE karsi_teklifler ADD COLUMN expires_at TIMESTAMP NULL");
                error_log("expires_at kolonu eklendi");
            } catch (\PDOException $e2) {
                error_log("expires_at kolonu eklenirken hata: " . $e2->getMessage());
            }
        }
        
        try {
            $pdo->query("SELECT created_at FROM karsi_teklifler LIMIT 1");
        } catch (\PDOException $e) {
            try {
                $pdo->exec("ALTER TABLE karsi_teklifler ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
                error_log("created_at kolonu eklendi");
            } catch (\PDOException $e2) {
                error_log("created_at kolonu eklenirken hata: " . $e2->getMessage());
            }
        }
        
        // Teklifi getir
        $stmt = $pdo->prepare("
            SELECT kt.*, i.user_id as ilan_sahibi_id,
                   COALESCE(kt.teklif_durumu, 'beklemede') as teklif_durumu
            FROM karsi_teklifler kt
            INNER JOIN ilanlar i ON kt.ilan_id = i.id
            WHERE kt.id = ?
        ");
        $stmt->execute([$teklif_id]);
        $teklif = $stmt->fetch();
        
        if (!$teklif) {
            throw new Exception('Teklif bulunamadı');
        }
        
        // Sadece teklif veren iptal edebilir
        if ($teklif['teklif_veren_user_id'] != $user_id) {
            throw new Exception('Bu teklifi sadece teklif veren iptal edebilir');
        }
        
        // Teklif durumunu kontrol et
        $teklif_durumu = $teklif['teklif_durumu'] ?? 'beklemede';
        if ($teklif_durumu != 'beklemede' && $teklif_durumu != '') {
            throw new Exception('Bu teklif zaten işleme alınmış');
        }
        
        // Süre kontrolü - zaman dilimini ayarla
        date_default_timezone_set('Europe/Istanbul');
        $now = new DateTime();
        
        // created_at kontrolü
        $created_at_value = $teklif['created_at'] ?? null;
        if (!$created_at_value) {
            throw new Exception('Teklif oluşturulma tarihi bulunamadı');
        }
        
        try {
            // Veritabanından gelen tarihi direkt parse et (zaman dilimi dönüşümü yapmadan)
            $created_at = new DateTime($created_at_value);
        } catch (Exception $e) {
            error_log("created_at parse hatası: " . $e->getMessage() . " - Değer: " . $created_at_value);
            throw new Exception('Teklif oluşturulma tarihi geçersiz');
        }
        
        $expires_at_value = $teklif['expires_at'] ?? null;
        
        // Eğer expires_at yoksa, created_at'ten 1 dakika ekle
        if (!$expires_at_value) {
            $expires_at = clone $created_at;
            $expires_at->modify('+1 minute');
        } else {
            try {
                // Veritabanından gelen tarihi direkt parse et
                $expires_at = new DateTime($expires_at_value);
                
                // expires_at created_at'ten önceyse, created_at'ten 1 dakika ekle (zaman dilimi hatası olabilir)
                if ($expires_at < $created_at) {
                    error_log("expires_at created_at'ten önce! expires_at: " . $expires_at_value . ", created_at: " . $created_at_value);
                    $expires_at = clone $created_at;
                    $expires_at->modify('+1 minute');
                }
            } catch (Exception $e) {
                error_log("expires_at parse hatası: " . $e->getMessage() . " - Değer: " . $expires_at_value);
                // Fallback: created_at'ten 1 dakika ekle
                $expires_at = clone $created_at;
                $expires_at->modify('+1 minute');
            }
        }
        
        // İlk 5 saniye ve son 5 saniye iptal edilemez
        $elapsed_seconds = $now->getTimestamp() - $created_at->getTimestamp();
        $remaining_seconds = $expires_at->getTimestamp() - $now->getTimestamp();
        
        // Debug log
        error_log("İptal kontrolü - teklif_id: $teklif_id, created_at: " . $created_at->format('Y-m-d H:i:s') . 
                  ", expires_at: " . $expires_at->format('Y-m-d H:i:s') . 
                  ", now: " . $now->format('Y-m-d H:i:s') . 
                  ", elapsed_seconds: $elapsed_seconds, remaining_seconds: $remaining_seconds");
        
        if ($elapsed_seconds < 5) {
            throw new Exception('Teklif verildikten sonra ilk 5 saniye içinde iptal edilemez (Geçen süre: ' . $elapsed_seconds . ' saniye)');
        }
        
        if ($remaining_seconds < 5) {
            throw new Exception('Teklif süresinin son 5 saniyesinde iptal edilemez (Kalan süre: ' . $remaining_seconds . ' saniye)');
        }
        
        // Süre dolmuş mu kontrol et
        if ($now > $expires_at) {
            // Süre dolmuş, durumu güncelle
            try {
                $stmt = $pdo->prepare("UPDATE karsi_teklifler SET teklif_durumu = 'suresi_doldu' WHERE id = ?");
                $stmt->execute([$teklif_id]);
            } catch (\PDOException $e) {
                error_log("Süre dolmuş durumu güncellenirken hata: " . $e->getMessage());
            }
            throw new Exception('Teklif süresi dolmuş');
        }
        
        // Durumu güncelle - sadece teklif_durumu kolonunu kullan
        try {
            $stmt = $pdo->prepare("UPDATE karsi_teklifler SET teklif_durumu = 'iptal_edildi' WHERE id = ?");
            $stmt->execute([$teklif_id]);
            if ($stmt->rowCount() > 0) {
                error_log("Teklif durumu başarıyla güncellendi: " . $teklif_id);
            } else {
                error_log("UPDATE sorgusu çalıştı ama hiçbir satır etkilenmedi: " . $teklif_id);
                throw new Exception('Teklif bulunamadı veya güncellenemedi');
            }
        } catch (\PDOException $e) {
            error_log("teklif_durumu kolonu ile güncelleme hatası: " . $e->getMessage());
            throw new Exception('Teklif durumu güncellenemedi: ' . $e->getMessage());
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Teklif başarıyla iptal edildi!'
        ]);
        
    } else {
        throw new Exception('Sadece POST metodu desteklenir');
    }
    
} catch (\PDOException $e) {
    http_response_code(500);
    error_log("karsi_teklif_iptal.php PDO Hatası: " . $e->getMessage());
    error_log("karsi_teklif_iptal.php PDO Hatası - Dosya: " . $e->getFile() . " Satır: " . $e->getLine());
    error_log("karsi_teklif_iptal.php PDO Hatası - Stack trace: " . $e->getTraceAsString());
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("karsi_teklif_iptal.php Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

