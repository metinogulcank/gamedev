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
$amount = floatval(str_replace(',', '.', $data['amount'] ?? '0'));
$withdraw_method = isset($data['withdraw_method']) ? trim($data['withdraw_method']) : 'unknown';
$account_info = isset($data['account_info']) ? trim($data['account_info']) : '';

if (!$email || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eksik veya hatalı veri.']);
    exit();
}

$pdo->beginTransaction();
try {
    // 1. Kullanıcı ID'sini ve mevcut bakiyeyi al
    $stmt = $pdo->prepare("SELECT id, balance FROM user WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user_result = $stmt->fetch();
    
    if (!$user_result) {
        throw new Exception('Kullanıcı bulunamadı');
    }
    
    $user_id = $user_result['id'];
    $current_balance = floatval($user_result['balance']);
    
    // 2. Yeterli bakiye kontrolü
    if ($current_balance < $amount) {
        throw new Exception('Yetersiz bakiye. Mevcut bakiye: ' . number_format($current_balance, 2, ',', '.') . '₺');
    }
    
    // 3. Bakiyeyi güncelle (çekim)
    $stmt = $pdo->prepare("UPDATE user SET balance = balance - :amount WHERE email = :email");
    $stmt->execute(['amount' => $amount, 'email' => $email]);

         // 4. Çekim işlem kaydını ekle (mevcut sütunlarla)
     $stmt2 = $pdo->prepare("INSERT INTO balance_transactions (user_email, amount, method) VALUES (:email, :amount, :method)");
     $stmt2->execute([
         'email' => $email, 
         'amount' => $amount, 
         'method' => $withdraw_method
     ]);

    // 5. Bildirim ekle
    $bildirim_text = "Hesabınızdan " . number_format($amount, 2, ',', '.') . "₺ çekim talebi alınmıştır. İşlem onaylandıktan sonra hesabınıza yatırılacaktır.";
    
    // Debug: Bildirim bilgilerini logla
    error_log("Bildirim ekleniyor - User ID: $user_id, Text: $bildirim_text");
    
    $stmt3 = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu) VALUES (:user_id, :bildirim_text, 0)");
    $result = $stmt3->execute(['user_id' => $user_id, 'bildirim_text' => $bildirim_text]);
    
    if (!$result) {
        error_log("Bildirim eklenirken hata: " . print_r($stmt3->errorInfo(), true));
        throw new Exception('Bildirim eklenemedi');
    }
    
    $bildirim_id = $pdo->lastInsertId();
    error_log("Bildirim başarıyla eklendi - ID: $bildirim_id");

    $pdo->commit();
    echo json_encode([
        'success' => true, 
        'message' => 'Çekim talebi alındı ve bildirim eklendi.',
        'new_balance' => $current_balance - $amount,
        'debug' => [
            'user_id' => $user_id,
            'bildirim_id' => $bildirim_id,
            'bildirim_text' => $bildirim_text
        ]
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'İşlem sırasında hata oluştu.']);
}
?>
