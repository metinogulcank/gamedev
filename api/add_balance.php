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
$amount = floatval(str_replace(',', '.', $data['amount'] ?? '0'));
$method = isset($data['method']) ? trim($data['method']) : 'unknown';

if (!$email || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eksik veya hatalı veri.']);
    exit();
}

$pdo->beginTransaction();
try {
    // 1. Kullanıcı ID'sini al
    $stmt = $pdo->prepare("SELECT id FROM user WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user_result = $stmt->fetch();
    
    if (!$user_result) {
        throw new Exception('Kullanıcı bulunamadı');
    }
    
    $user_id = $user_result['id'];
    
    // 2. Bakiyeyi güncelle
    $stmt = $pdo->prepare("UPDATE user SET balance = balance + :amount WHERE email = :email");
    $stmt->execute(['amount' => $amount, 'email' => $email]);

         // 3. İşlem kaydını ekle (mevcut sütunlarla)
     $stmt2 = $pdo->prepare("INSERT INTO balance_transactions (user_email, amount, method) VALUES (:email, :amount, :method)");
     $stmt2->execute(['email' => $email, 'amount' => $amount, 'method' => $method]);

    // 4. Bildirim ekle
    $bildirim_text = "Hesabınıza " . number_format($amount, 2, ',', '.') . "₺ bakiye yüklenmiştir. İyi oyunlar dileriz!";
    $stmt3 = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu) VALUES (:user_id, :bildirim_text, 0)");
    $stmt3->execute(['user_id' => $user_id, 'bildirim_text' => $bildirim_text]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Bakiye yüklendi ve bildirim eklendi.']);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'İşlem sırasında hata oluştu: ' . $e->getMessage()]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'İşlem sırasında hata oluştu.']);
}
?>
