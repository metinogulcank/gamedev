<?php
// Hata ayıklama için tüm PHP hatalarını JSON olarak döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
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
    http_response_code(500);
    echo json_encode([
        'error' => 'Exception',
        'message' => $e->getMessage()
    ]);
    exit;
});
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// JSON veya POST ile veri al
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
} else {
    $data = $_POST;
}

// Gerekli alanlar
$user_id   = intval($data['user_id'] ?? 0);
$item_name = trim($data['item_name'] ?? '');
$price     = floatval($data['price'] ?? 0);
$image     = trim($data['image'] ?? '');
$item_type = trim($data['item_type'] ?? '');

// Eğer item_type verilmemişse, item_name'den çıkar
if (empty($item_type) && !empty($item_name)) {
    // CS2 item formatı: "AK-47 | Redline" -> "AK-47"
    $parts = explode('|', $item_name);
    $item_type = trim($parts[0]);
    
    // Eğer hala boşsa, varsayılan değer
    if (empty($item_type)) {
        $item_type = 'Weapon';
    }
}

if (!$user_id || !$item_name || !$price) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lütfen tüm alanları doldurun.']);
    exit;
}

// İlanı ekle - item_type alanını da ekle
try {
    $stmt = $pdo->prepare('INSERT INTO ilanlar (user_id, item_name, price, image, item_type) VALUES (?, ?, ?, ?, ?)');
    $success = $stmt->execute([$user_id, $item_name, $price, $image, $item_type]);
} catch (\PDOException $e) {
    // Eğer item_type kolonu yoksa, onu olmadan ekle
    if (strpos($e->getMessage(), 'item_type') !== false) {
        $stmt = $pdo->prepare('INSERT INTO ilanlar (user_id, item_name, price, image) VALUES (?, ?, ?, ?)');
        $success = $stmt->execute([$user_id, $item_name, $price, $image]);
    } else {
        throw $e;
    }
}

if ($success) {
    echo json_encode(['success' => true, 'message' => 'İlan başarıyla eklendi!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'İlan eklenirken hata oluştu.']);
} 