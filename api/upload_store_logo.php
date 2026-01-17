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

$email = $_POST['email'] ?? '';
if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email gerekli.']);
    exit();
}

// Kullanıcı ID'yi al (dosya adı için)
$stmt = $pdo->prepare('SELECT id FROM user WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$row = $stmt->fetch();
$userId = $row ? (int)$row['id'] : 0;

if (!isset($_FILES['logo'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Logo dosyası gerekli.']);
    exit();
}

$file = $_FILES['logo'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dosya yükleme hatası.']);
    exit();
}

$allowedTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
if (!isset($allowedTypes[$mime])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geçersiz dosya türü.']);
    exit();
}
$ext = $allowedTypes[$mime];

$baseDir = __DIR__ . '/uploads/store_logos';
if (!is_dir($baseDir)) {
    @mkdir($baseDir, 0775, true);
}
$safeId = $userId ?: preg_replace('/[^a-zA-Z0-9_-]/', '_', $email);
$filename = $safeId . '_' . time() . '.' . $ext;
$target = $baseDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Dosya kaydedilemedi.']);
    exit();
}

$publicUrl = 'https://elephunt.com/api/uploads/store_logos/' . $filename;
echo json_encode(['success' => true, 'url' => $publicUrl, 'path' => $publicUrl]);
