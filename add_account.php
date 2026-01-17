<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Veritabanı bağlantısı
$host = 'localhost';
$db   = 'elep_gamedev';
$user = 'root'; // Kendi kullanıcı adınızı yazın
$pass = '';     // Kendi şifrenizi yazın
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit();
}

// JSON veya form verisi al
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$ad_soyad = isset($input['ad_soyad']) ? trim($input['ad_soyad']) : '';
$iban = isset($input['iban']) ? trim($input['iban']) : '';

if (!$user_id || !$ad_soyad || !$iban) {
    echo json_encode(['success' => false, 'message' => 'Eksik bilgi']);
    exit();
}

// IBAN format kontrolü (basit)
if (strlen($iban) < 10 || strlen($iban) > 34) {
    echo json_encode(['success' => false, 'message' => 'Geçersiz IBAN']);
    exit();
}

try {
    $stmt = $pdo->prepare('INSERT INTO user_accounts (user_id, ad_soyad, iban) VALUES (?, ?, ?)');
    $stmt->execute([$user_id, $ad_soyad, $iban]);
    echo json_encode(['success' => true, 'message' => 'Hesap başarıyla eklendi']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası']);
} 