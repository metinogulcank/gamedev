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

// Get request data
$ilan_id = 0;
$user_id = 1; // Default user ID for now

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $ilan_id = isset($_GET['ilan_id']) ? intval($_GET['ilan_id']) : 0;
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1;
} else {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $data = [];
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
    } else {
        $data = $_POST;
    }
    $ilan_id = intval($data['ilan_id'] ?? 0);
    $user_id = intval($data['user_id'] ?? 1);
}

if (!$ilan_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'İlan ID gerekli!']);
    exit;
}

try {
    // Check if item is in favorites
    $stmt = $pdo->prepare('SELECT id FROM favoriler WHERE user_id = ? AND ilan_id = ?');
    $stmt->execute([$user_id, $ilan_id]);
    $favorite = $stmt->fetch();
    
    echo json_encode([
        'success' => true, 
        'isFavorite' => $favorite ? true : false
    ]);
    
} catch(\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası!']);
}
?>
