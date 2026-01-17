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

// Aktif ilanları silah adına göre grupla: count, min price, sample image
try {
    $stmt = $pdo->query("SELECT item_name, MIN(price) AS min_price, COUNT(*) AS cnt, MAX(image) AS image FROM ilanlar WHERE status = 'active' GROUP BY item_name");
} catch (\PDOException $e) {
    $stmt = $pdo->query("SELECT item_name, MIN(price) AS min_price, COUNT(*) AS cnt, MAX(image) AS image FROM ilanlar GROUP BY item_name");
}
$active = [];
foreach ($stmt->fetchAll() as $row) {
    $active[$row['item_name']] = [
        'min_price' => isset($row['min_price']) ? (float)$row['min_price'] : null,
        'count' => (int)$row['cnt'],
        'image' => $row['image'] ?? null,
    ];
}

// Backfill: ilanlardan skin_catalog’a upsert
try {
    $pdo->exec("
        INSERT INTO skin_catalog (item_name, image, total_sales_count, first_seen_at, last_seen_at)
        SELECT item_name, MAX(image) AS image, 0, NOW(), NOW()
        FROM ilanlar
        GROUP BY item_name
        ON DUPLICATE KEY UPDATE
            image = IF(VALUES(image) IS NOT NULL AND VALUES(image)!='', VALUES(image), image),
            last_seen_at = NOW(),
            first_seen_at = COALESCE(first_seen_at, VALUES(first_seen_at))
    ");
} catch (\PDOException $e) {
    // skin_catalog yoksa veya yetki yoksa sessiz geç
}

// Katalogdaki tüm skins
$stmt2 = $pdo->query("SELECT item_name, image, total_sales_count, last_sale_price, average_sale_price FROM skin_catalog ORDER BY item_name ASC");
$catalogRows = $stmt2->fetchAll();

$items = [];
foreach ($catalogRows as $c) {
    $name = $c['item_name'];
    $a = $active[$name] ?? ['min_price' => null, 'count' => 0, 'image' => null];
    $image = $a['image'] ?: $c['image'];
    $minPrice = $a['min_price'] !== null ? (float)$a['min_price'] : ($c['last_sale_price'] !== null ? (float)$c['last_sale_price'] : 0.0);
    $avgPrice = $c['average_sale_price'] !== null ? (float)$c['average_sale_price'] : ($c['last_sale_price'] !== null ? (float)$c['last_sale_price'] : 0.0);
    $items[] = [
        'name' => $name,
        'image' => $image,
        'count' => (int)$a['count'],
        'minPrice' => $minPrice,
        'averagePrice' => $avgPrice,
    ];
}

echo json_encode(['success' => true, 'items' => $items]);
