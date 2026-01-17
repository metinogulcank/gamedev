<?php
// CORS ve Content-Type header'larını en başa koy
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hata ayıklama için tüm PHP hatalarını JSON olarak döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Error',
        'message' => $errstr,
        'file' => $errfile,
        'line' => $errline
    ]);
    exit;
});
set_exception_handler(function($e) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Exception',
        'message' => $e->getMessage()
    ]);
    exit;
});

// Veritabanı bağlantı bilgileri
$host = 'localhost';
$db   = 'elep_gamedev';
$user = 'elep_metinogulcank';
$pass = '06ogulcan06';
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

// ID parametresini al (GET veya POST'tan)
$id = 0;
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
} else {
    // JSON veya POST ile veri al
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $data = [];
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
    } else {
        $data = $_POST;
    }
    $id = intval($data['id'] ?? 0);
}

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID parametresi gerekli!']);
    exit;
}

// Belirli bir ilanı çek (aktif olmayanlar da görülebilir)
$stmt = $pdo->prepare('SELECT i.*, 
        u.store_name, 
        u.store_logo, 
        u.store_description,
        u.store_url,
        u.fullname as seller_username, 
        u.fullname as username,
        u.store_logo as seller_avatar,
        u.trade_url as seller_trade_url
        FROM ilanlar i 
        LEFT JOIN `user` u ON i.user_id = u.id 
        WHERE i.id = ? LIMIT 1');
$stmt->execute([$id]);
$ilan = $stmt->fetch();

if (!$ilan) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'İlan bulunamadı!']);
    exit;
}

echo json_encode(['success' => true, 'ilan' => $ilan]);
