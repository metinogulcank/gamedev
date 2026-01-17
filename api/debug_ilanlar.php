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
    
    // Tüm ilanları listele
    $stmt = $pdo->query('SELECT id, item_name, user_id FROM ilanlar ORDER BY id');
    $ilanlar = $stmt->fetchAll();
    
    // Favoriler tablosunu kontrol et
    $stmt = $pdo->query('SELECT * FROM favoriler ORDER BY id');
    $favoriler = $stmt->fetchAll();
    
    // Test: user_id=2 için favori var mı?
    $stmt = $pdo->prepare('SELECT * FROM favoriler WHERE user_id = ?');
    $stmt->execute([2]);
    $user2_favoriler = $stmt->fetchAll();
    
    // Test: user_id=1 için favori var mı?
    $stmt = $pdo->prepare('SELECT * FROM favoriler WHERE user_id = ?');
    $stmt->execute([1]);
    $user1_favoriler = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'ilanlar' => $ilanlar,
        'favoriler' => $favoriler,
        'user2_favoriler' => $user2_favoriler,
        'user1_favoriler' => $user1_favoriler
    ]);
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
