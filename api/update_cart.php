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
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// POST verisini al
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['cart_items']) || !is_array($input['cart_items'])) {
    echo json_encode(['success' => false, 'message' => 'Eksik veya hatalı parametreler (user_id, cart_items array)']);
    exit;
}

$user_id = $input['user_id'];
$cart_items = $input['cart_items']; // Array of ilan_id's

try {
    $pdo->beginTransaction();

    // 1. Kullanıcının mevcut sepetini temizle
    $stmtDelete = $pdo->prepare("DELETE FROM sepet WHERE user_id = ?");
    $stmtDelete->execute([$user_id]);

    // 2. Yeni ürünleri ekle
    if (!empty($cart_items)) {
        $sql = "INSERT IGNORE INTO sepet (user_id, ilan_id) VALUES (?, ?)";
        $stmtInsert = $pdo->prepare($sql);

        foreach ($cart_items as $ilan_id) {
            $stmtInsert->execute([$user_id, $ilan_id]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Sepet güncellendi']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
