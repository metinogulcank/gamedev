<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *'); // Geliştirme için * (herkese açık), canlıda domain ile sınırla!
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// DEBUG: Gelen veriyi ve Content-Type'ı kaydet
file_put_contents('debug.txt', print_r([
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'raw' => file_get_contents('php://input'),
    'post' => $_POST
], true));

// Veritabanı bağlantı bilgileri
$host = 'localhost';
$db   = 'gamedev_db';
$user = 'gamedev_User';
$pass = 'gamedev_5815471';
$charset = 'utf8mb4';

// PDO ile bağlantı
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

// JSON, POST veya GET ile veri al
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

// Gerekli alanlar
$fullname = trim($data['fullname'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$fullname || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lütfen tüm alanları doldurun.']);
    exit;
}

// E-posta kontrolü
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geçersiz e-posta adresi.']);
    exit;
}

// E-posta benzersiz mi?
$stmt = $pdo->prepare('SELECT id FROM user WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Bu e-posta ile zaten kayıt olunmuş.']);
    exit;
}

// Şifreyi hashle
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Kayıt ekle
$stmt = $pdo->prepare('INSERT INTO user (fullname, email, password) VALUES (?, ?, ?)');
$success = $stmt->execute([$fullname, $email, $hashedPassword]);

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Kayıt başarılı!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Kayıt sırasında hata oluştu.']);
}
?>
