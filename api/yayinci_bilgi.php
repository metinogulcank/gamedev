<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// GET isteği: Yayıncı bilgilerini getir
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $yayinci_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    $destek_adresi = isset($_GET['destek_adresi']) ? trim($_GET['destek_adresi']) : '';
    
    if (!$yayinci_user_id && !$destek_adresi) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id veya destek_adresi parametresi gerekli.']);
        exit;
    }
    
    try {
        // Destek adresine göre veya user_id'ye göre yayıncıyı bul
        if ($destek_adresi) {
            $stmt = $pdo->prepare('
                SELECT 
                    yb.*,
                    u.id as user_id,
                    u.fullname,
                    u.email
                FROM yayinci_basvuru yb
                INNER JOIN user u ON yb.user_id = u.id
                WHERE yb.destek_adresi = ? AND yb.durum = "onaylandi"
            ');
            $stmt->execute([$destek_adresi]);
        } else {
            $stmt = $pdo->prepare('
                SELECT 
                    yb.*,
                    u.id as user_id,
                    u.fullname,
                    u.email
                FROM yayinci_basvuru yb
                INNER JOIN user u ON yb.user_id = u.id
                WHERE yb.user_id = ? AND yb.durum = "onaylandi"
            ');
            $stmt->execute([$yayinci_user_id]);
        }
        
        $yayinci = $stmt->fetch();
        
        if ($yayinci) {
            echo json_encode([
                'success' => true,
                'data' => $yayinci
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Yayıncı bulunamadı veya başvurusu onaylanmamış.'
            ]);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
}
?>

