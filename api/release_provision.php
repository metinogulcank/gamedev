<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
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

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
} else {
    $data = $_POST ?: $_GET;
}

$order_id = intval($data['order_id'] ?? 0);

try {
    $pdo->beginTransaction();

    if ($order_id) {
        $stmt = $pdo->prepare('SELECT * FROM provisions WHERE order_id = ? AND released = 0 FOR UPDATE');
        $stmt->execute([$order_id]);
        $prov = $stmt->fetch();
        if (!$prov) {
            throw new Exception('Serbest bırakılacak provizyon bulunamadı.');
        }
        if (strtotime($prov['release_at']) > time()) {
            throw new Exception('Serbest bırakma zamanı henüz gelmedi.');
        }
        // Satıcı bakiyesine ekle ve provizyondan düş
        $stmt = $pdo->prepare('UPDATE user SET balance = balance + ?, provision_balance = provision_balance - ? WHERE id = ?');
        $stmt->execute([$prov['amount'], $prov['amount'], $prov['seller_id']]);
        $stmt = $pdo->prepare('UPDATE provisions SET released = 1, released_at = NOW() WHERE id = ?');
        $stmt->execute([$prov['id']]);
    } else {
        // Toplu serbest bırakma (cron)
        $stmt = $pdo->query('SELECT * FROM provisions WHERE released = 0 AND release_at <= NOW() FOR UPDATE');
        $rows = $stmt->fetchAll();
        foreach ($rows as $prov) {
            $stmt2 = $pdo->prepare('UPDATE user SET balance = balance + ?, provision_balance = provision_balance - ? WHERE id = ?');
            $stmt2->execute([$prov['amount'], $prov['amount'], $prov['seller_id']]);
            $stmt3 = $pdo->prepare('UPDATE provisions SET released = 1, released_at = NOW() WHERE id = ?');
            $stmt3->execute([$prov['id']]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Provizyon serbest bırakıldı.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
