<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    $data = $_POST;
}

$buyer_id = intval($data['buyer_id'] ?? 0);
$ilan_id  = intval($data['ilan_id'] ?? 0);

if (!$buyer_id || !$ilan_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'buyer_id ve ilan_id gerekli.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // İlan bilgisi
    $stmt = $pdo->prepare('SELECT id, user_id AS seller_id, price, item_name, image, status FROM ilanlar WHERE id = ? FOR UPDATE');
    $stmt->execute([$ilan_id]);
    $ilan = $stmt->fetch();
    if (!$ilan) {
        throw new Exception('İlan bulunamadı.');
    }
    if (isset($ilan['status']) && $ilan['status'] !== 'active') {
        throw new Exception('İlan aktif değil.');
    }

    $price = floatval($ilan['price']);
    $seller_id = intval($ilan['seller_id']);
    if ($seller_id === $buyer_id) {
        throw new Exception('Kendi ilanınızı satın alamazsınız.');
    }

    // Alıcı bakiyesi kontrol
    $stmt = $pdo->prepare('SELECT id, balance FROM user WHERE id = ? FOR UPDATE');
    $stmt->execute([$buyer_id]);
    $buyer = $stmt->fetch();
    if (!$buyer) throw new Exception('Alıcı bulunamadı.');
    $buyer_balance = floatval($buyer['balance']);
    if ($buyer_balance < $price) {
        throw new Exception('Yetersiz bakiye.');
    }

    // Satıcıyı kilitle
    $stmt = $pdo->prepare('SELECT id, balance, provision_balance FROM user WHERE id = ? FOR UPDATE');
    $stmt->execute([$seller_id]);
    $seller = $stmt->fetch();
    if (!$seller) throw new Exception('Satıcı bulunamadı.');
    $seller_provision = floatval($seller['provision_balance'] ?? 0);

    // Komisyon ve provizyon hesapla
    $commission_rate = 0.075; // %7.5
    $commission = round($price * $commission_rate, 2);
    $provision_amount = round($price - $commission, 2);

    // Alıcı bakiyesini düş
    $stmt = $pdo->prepare('UPDATE user SET balance = balance - ? WHERE id = ?');
    $stmt->execute([$price, $buyer_id]);

    // Satıcı provizyon bakiyesine ekle
    $stmt = $pdo->prepare('UPDATE user SET provision_balance = COALESCE(provision_balance,0) + ? WHERE id = ?');
    $stmt->execute([$provision_amount, $seller_id]);

    // İlanı pasif yap
    try {
        $stmt = $pdo->prepare('UPDATE ilanlar SET status = ? WHERE id = ?');
        $stmt->execute(['inactive', $ilan_id]);
    } catch (\PDOException $e) {
        // status kolonu yoksa sorun etme
    }

    // Sipariş oluştur
    $stmt = $pdo->prepare('INSERT INTO orders (buyer_id, seller_id, ilan_id, price, commission, status) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$buyer_id, $seller_id, $ilan_id, $price, $commission, 'paid']);
    $order_id = $pdo->lastInsertId();

    // Provizyon serbest bırakma kaydı (15 saniye sonra)
    $release_at = date('Y-m-d H:i:s', time() + 15);
    $stmt = $pdo->prepare('INSERT INTO provisions (order_id, seller_id, amount, release_at, released) VALUES (?, ?, ?, ?, 0)');
    $stmt->execute([$order_id, $seller_id, $provision_amount, $release_at]);

    // Skin katalog güncelle
    try {
        $upsert = $pdo->prepare("
            INSERT INTO skin_catalog (item_name, image, total_sales_count, last_sale_price, average_sale_price, first_seen_at, last_seen_at)
            VALUES (?, ?, 1, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                image = VALUES(image),
                average_sale_price = ROUND(((average_sale_price * total_sales_count) + VALUES(last_sale_price)) / (total_sales_count + 1), 2),
                total_sales_count = total_sales_count + 1,
                last_sale_price = VALUES(last_sale_price),
                last_seen_at = NOW()
        ");
        $upsert->execute([$ilan['item_name'], $ilan['image'], $price, $price]);
    } catch (\PDOException $e) {
        // skin_catalog yoksa veya hata varsa satın almayı engelleme
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Satın alma başarılı.',
        'order_id' => $order_id,
        'commission' => $commission,
        'provision_amount' => $provision_amount
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
