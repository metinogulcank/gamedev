<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json');

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

// JSON veya POST veya GET ile veri al
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $_POST;
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = $_GET;
}

$email = trim($data['email'] ?? '');
$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;

if (!$email && !$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email veya user_id gerekli.']);
    exit;
}

// Seçilecek kolonlar (Profile.jsx alanları + trade_url + store alanları)
$columns = 'id, fullname, email, balance, provision_balance, phone, tc_no, birthdate, gender, sms_notifications, email_notifications, trade_url, store_name, store_description, store_url, store_logo, created_at';

if ($email) {
    $stmt = $pdo->prepare("SELECT $columns FROM user WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
} else {
    $stmt = $pdo->prepare("SELECT $columns FROM user WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
}

$user = $stmt->fetch();

if ($user) {
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Kullanıcı bulunamadı.']);
}
