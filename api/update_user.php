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
$field = trim($data['field'] ?? '');
$value = isset($data['value']) ? trim($data['value']) : '';

// GÜNCELLENEBİLİR ALANLAR
$allowedFields = ['fullname', 'email', 'phone', 'tc_no', 'birthdate', 'gender', 'sms_notifications', 'email_notifications', 'trade_url'];

if (!$email || !$field || !in_array($field, $allowedFields, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eksik veya hatalı veri.']);
    exit();
}

// trade_url için benzersizlik ve (opsiyonel) format kontrolü
if ($field === 'trade_url') {
    // Basit format kontrolü (isteğe bağlı)
    $pattern = '#^https?://steamcommunity\\.com/tradeoffer/new/\\?partner=\\d+&token=[A-Za-z0-9_-]+#i';
    if ($value !== '' && !preg_match($pattern, $value)) {
        // İsterseniz formatı zorunlu kılabilirsiniz: aşağıdaki 3 satırın yorumunu kaldırın
        // http_response_code(400);
        // echo json_encode(['success' => false, 'message' => 'Geçersiz Steam Trade URL formatı.']);
        // exit();
    }
    // Aynı trade_url başka bir kullanıcıda var mı? (email'i farklı olan)
    $check = $pdo->prepare('SELECT id FROM user WHERE trade_url = ? AND email <> ? LIMIT 1');
    $check->execute([$value, $email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Bu trade URL başka bir kullanıcı tarafından kullanılıyor.']);
        exit();
    }
}

try {
    $stmt = $pdo->prepare("UPDATE user SET `$field` = ? WHERE email = ?");
    $success = $stmt->execute([$value, $email]);

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Güncelleme başarılı!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Güncelleme sırasında hata oluştu.']);
    }
} catch (\PDOException $e) {
    // trade_url kolonu eksikse bilgilendir
    if ($e->getCode() === '42S22') {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Veritabanında 'trade_url' sütunu yok. Lütfen ekleyin: ALTER TABLE `user` ADD COLUMN `trade_url` VARCHAR(255) UNIQUE NULL DEFAULT NULL;"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
