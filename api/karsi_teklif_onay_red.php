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
    $dbname = 'gamedev_db';
    $user = 'gamedev_User';
    $pass = 'gamedev_5815471';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        date_default_timezone_set('Europe/Istanbul');
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['teklif_id']) || !isset($input['action']) || !isset($input['user_id'])) {
            throw new Exception('Eksik parametreler: teklif_id, action, user_id gerekli');
        }
        
        $teklif_id = intval($input['teklif_id']);
        $action = trim($input['action']); // 'onayla' veya 'reddet'
        $user_id = intval($input['user_id']);
        
        if (!in_array($action, ['onayla', 'reddet'])) {
            throw new Exception('Geçersiz action. Sadece "onayla" veya "reddet" kullanılabilir.');
        }
        
        // Teklifi getir
        $stmt = $pdo->prepare("
            SELECT kt.*, i.user_id as ilan_sahibi_id, i.item_name, i.price as ilan_fiyati,
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
        
        // Sadece ilan sahibi onaylayabilir/reddedebilir
        if ($teklif['ilan_sahibi_id'] != $user_id) {
            throw new Exception('Bu teklifi sadece ilan sahibi onaylayabilir/reddedebilir');
        }
        
        // Teklif durumunu kontrol et
        $teklif_durumu = $teklif['teklif_durumu'] ?? 'beklemede';
        if ($teklif_durumu != 'beklemede' && $teklif_durumu != '') {
            throw new Exception('Bu teklif zaten işleme alınmış');
        }
        
        // Süre kontrolü
        $now = new DateTime();
        $expires_at_value = $teklif['expires_at'] ?? null;
        if ($expires_at_value) {
            try {
                $expires_at = new DateTime($expires_at_value);
                if ($now > $expires_at) {
                    $stmt = $pdo->prepare("UPDATE karsi_teklifler SET teklif_durumu = 'suresi_doldu' WHERE id = ?");
                    $stmt->execute([$teklif_id]);
                    throw new Exception('Teklif süresi dolmuş');
                }
            } catch (Exception $e) {
                error_log("karsi_teklif_onay_red expires_at parse hatası: " . $e->getMessage());
            }
        }
        
        // Durumu güncelle
        $yeni_durum = $action === 'onayla' ? 'onaylandi' : 'reddedildi';
        $stmt = $pdo->prepare("UPDATE karsi_teklifler SET teklif_durumu = ? WHERE id = ?");
        $stmt->execute([$yeni_durum, $teklif_id]);
        
        // Kullanıcı bilgilerini al
        $stmt = $pdo->prepare("SELECT fullname FROM users WHERE id = ?");
        $stmt->execute([$teklif['teklif_veren_user_id']]);
        $teklif_veren = $stmt->fetch();
        $teklif_veren_adi = $teklif_veren ? $teklif_veren['fullname'] : 'Kullanıcı';
        
        $stmt = $pdo->prepare("SELECT fullname FROM users WHERE id = ?");
        $stmt->execute([$teklif['ilan_sahibi_id']]);
        $ilan_sahibi = $stmt->fetch();
        $ilan_sahibi_adi = $ilan_sahibi ? $ilan_sahibi['fullname'] : 'Satıcı';
        
        // Bildirimler tablosuna karsi_teklif_id kolonunu ekle (eğer yoksa)
        try {
            $pdo->query("SELECT karsi_teklif_id FROM bildirimler LIMIT 1");
        } catch (\PDOException $e) {
            $pdo->exec("ALTER TABLE bildirimler ADD COLUMN karsi_teklif_id INT NULL");
        }
        
        // Bildirim gönder
        try {
            if ($action === 'onayla') {
                // Teklif verene bildirim
                $bildirim_text = $ilan_sahibi_adi . " kullanıcısı " . $teklif['item_name'] . " için verdiğiniz " . number_format($teklif['teklif_fiyati'], 2, ',', '.') . "₺ teklifinizi onayladı!";
                $stmt = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu, karsi_teklif_id) VALUES (?, ?, 0, ?)");
                $stmt->execute([$teklif['teklif_veren_user_id'], $bildirim_text, $teklif_id]);
            } else {
                // Teklif verene bildirim
                $bildirim_text = $ilan_sahibi_adi . " kullanıcısı " . $teklif['item_name'] . " için verdiğiniz " . number_format($teklif['teklif_fiyati'], 2, ',', '.') . "₺ teklifinizi reddetti.";
                $stmt = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu, karsi_teklif_id) VALUES (?, ?, 0, ?)");
                $stmt->execute([$teklif['teklif_veren_user_id'], $bildirim_text, $teklif_id]);
            }
        } catch (\PDOException $e) {
            // Bildirim eklenemese bile ana işlem başarılı sayılacak; logla ve devam et
            error_log("karsi_teklif_onay_red bildirim insert hatası: " . $e->getMessage());
        }
        
        echo json_encode([
            'success' => true,
            'message' => $action === 'onayla' ? 'Teklif onaylandı!' : 'Teklif reddedildi!',
            'durum' => $yeni_durum
        ]);
        
    } else {
        throw new Exception('Sadece POST metodu desteklenir');
    }
    
} catch (\PDOException $e) {
    http_response_code(500);
    error_log("karsi_teklif_onay_red PDO hatası: " . $e->getMessage());
    error_log("Dosya: " . $e->getFile() . " Satır: " . $e->getLine());
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("karsi_teklif_onay_red Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

