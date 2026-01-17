<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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
    exit;
}

$data = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
$user_id = intval($data['user_id'] ?? 0);
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id gerekli.']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT o.*, i.item_name, i.image 
    FROM orders o 
    LEFT JOIN ilanlar i ON i.id = o.ilan_id 
    WHERE o.buyer_id = ? 
    ORDER BY o.created_at DESC
');
$stmt->execute([$user_id]);
$orders = $stmt->fetchAll();

echo json_encode(['success' => true, 'orders' => $orders]);
