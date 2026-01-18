<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json');

// Veritabanı bağlantı bilgileri
$host = 'localhost';
$db   = 'gamedev_db';
$user = 'gamedev_User';
$pass = 'gamedev_5815471';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası!']);
    exit;
}

// GET isteği: Başvuru bilgilerini getir
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id parametresi gerekli.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare('SELECT * FROM yayinci_basvuru WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $basvuru = $stmt->fetch();
        
        if ($basvuru) {
            echo json_encode([
                'success' => true,
                'data' => $basvuru
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'data' => null,
                'message' => 'Başvuru bulunamadı.'
            ]);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
    exit;
}

// POST isteği: Başvuru kaydet/güncelle
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // JSON veya POST ile veri al
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $data = [];
    
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
    } else {
        $data = $_POST;
    }
    
    $user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
    
    // Validasyon
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id gerekli.']);
        exit;
    }
    
    // Form verilerini al
    $yayin_linki = trim($data['yayin_linki'] ?? '');
    $sayfa_basligi = trim($data['sayfa_basligi'] ?? '');
    $destek_adresi = trim($data['destek_adresi'] ?? '');
    $min_bagis_tutari = isset($data['min_bagis_tutari']) && $data['min_bagis_tutari'] !== '' && $data['min_bagis_tutari'] !== 'Lütfen Seçim Yapınız' 
        ? floatval($data['min_bagis_tutari']) 
        : null;
    
    // Sosyal medya bilgileri
    $twitch_adresi = trim($data['twitch_adresi'] ?? '');
    $youtube_adresi = trim($data['youtube_adresi'] ?? '');
    $instagram_adresi = trim($data['instagram_adresi'] ?? '');
    $twitter_adresi = trim($data['twitter_adresi'] ?? '');
    $discord_adresi = trim($data['discord_adresi'] ?? '');
    $tiktok_adresi = trim($data['tiktok_adresi'] ?? '');
    $nimo_tv_adresi = trim($data['nimo_tv_adresi'] ?? '');
    $dlive_adresi = trim($data['dlive_adresi'] ?? '');
    
    try {
        // Kullanıcının başvurusu var mı kontrol et
        $stmt = $pdo->prepare('SELECT id FROM yayinci_basvuru WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $existingBasvuru = $stmt->fetch();
        
        if ($existingBasvuru) {
            // Güncelle
            $stmt = $pdo->prepare('
                UPDATE yayinci_basvuru SET 
                    yayin_linki = ?, 
                    sayfa_basligi = ?, 
                    destek_adresi = ?, 
                    min_bagis_tutari = ?,
                    twitch_adresi = ?,
                    youtube_adresi = ?,
                    instagram_adresi = ?,
                    twitter_adresi = ?,
                    discord_adresi = ?,
                    tiktok_adresi = ?,
                    nimo_tv_adresi = ?,
                    dlive_adresi = ?,
                    durum = "beklemede"
                WHERE user_id = ?
            ');
            $success = $stmt->execute([
                $yayin_linki, 
                $sayfa_basligi, 
                $destek_adresi, 
                $min_bagis_tutari,
                $twitch_adresi,
                $youtube_adresi,
                $instagram_adresi,
                $twitter_adresi,
                $discord_adresi,
                $tiktok_adresi,
                $nimo_tv_adresi,
                $dlive_adresi,
                $user_id
            ]);
        } else {
            // Yeni kayıt
            $stmt = $pdo->prepare('
                INSERT INTO yayinci_basvuru (
                    user_id, 
                    yayin_linki, 
                    sayfa_basligi, 
                    destek_adresi, 
                    min_bagis_tutari,
                    twitch_adresi,
                    youtube_adresi,
                    instagram_adresi,
                    twitter_adresi,
                    discord_adresi,
                    tiktok_adresi,
                    nimo_tv_adresi,
                    dlive_adresi,
                    durum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "beklemede")
            ');
            $success = $stmt->execute([
                $user_id, 
                $yayin_linki, 
                $sayfa_basligi, 
                $destek_adresi, 
                $min_bagis_tutari,
                $twitch_adresi,
                $youtube_adresi,
                $instagram_adresi,
                $twitter_adresi,
                $discord_adresi,
                $tiktok_adresi,
                $nimo_tv_adresi,
                $dlive_adresi
            ]);
        }
        
        if ($success) {
            // Güncellenmiş kaydı getir
            $stmt = $pdo->prepare('SELECT * FROM yayinci_basvuru WHERE user_id = ?');
            $stmt->execute([$user_id]);
            $basvuru = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Başvurunuz başarıyla kaydedildi!',
                'data' => $basvuru
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Kayıt sırasında hata oluştu.']);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
}
?>

