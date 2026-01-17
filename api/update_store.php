<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
} else {
    $data = $_POST;
}

$email = trim($data['email'] ?? '');
$store_name = trim($data['store_name'] ?? '');
$store_description = trim($data['store_description'] ?? '');
$store_url = trim($data['store_url'] ?? '');
$store_logo = trim($data['store_logo'] ?? '');

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email gerekli.']);
    exit();
}

if (mb_strlen($store_description) > 250) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Mağaza açıklaması 250 karakteri geçemez.']);
    exit();
}

// URL benzersizliği (email'i farklı olan kullanıcılar)
if ($store_url !== '') {
    $check = $pdo->prepare('SELECT id FROM user WHERE store_url = ? AND email <> ? LIMIT 1');
    $check->execute([$store_url, $email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Bu mağaza URL başka bir kullanıcı tarafından kullanılıyor.']);
        exit();
    }
}

try {
    $stmt = $pdo->prepare('UPDATE user SET store_name = ?, store_description = ?, store_url = ?, store_logo = ? WHERE email = ?');
    $ok = $stmt->execute([$store_name, $store_description, $store_url, $store_logo, $email]);
    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Mağaza ayarları güncellendi.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Güncelleme sırasında hata oluştu.']);
    }
} catch (\PDOException $e) {
    if ($e->getCode() === '42S22') {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Veritabanında gerekli sütunlar yok. Lütfen ekleyin: 
ALTER TABLE `user` 
  ADD COLUMN `store_name` VARCHAR(100) NULL DEFAULT NULL,
  ADD COLUMN `store_description` VARCHAR(250) NULL DEFAULT NULL,
  ADD COLUMN `store_url` VARCHAR(255) UNIQUE NULL DEFAULT NULL,
  ADD COLUMN `store_logo` VARCHAR(255) NULL DEFAULT NULL;"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
