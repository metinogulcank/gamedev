<?php
// Hata ayıklama için tüm PHP hatalarını JSON olarak döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
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
    http_response_code(500);
    echo json_encode([
        'error' => 'Exception',
        'message' => $e->getMessage()
    ]);
    exit;
});
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json');

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
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası!']);
    exit;
}

// JSON veya POST ile veri al
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
} else {
    $data = $_POST;
}

// Gerekli alanlar
$user_id   = intval($data['user_id'] ?? 0);
$item_name = trim($data['item_name'] ?? '');
$price     = floatval($data['price'] ?? 0);
$image     = trim($data['image'] ?? '');
$item_type = trim($data['item_type'] ?? '');
// Opsiyonel: inspect ve asset bilgileri
$inspect_link = trim($data['inspect_link'] ?? '');
$assetid = trim($data['assetid'] ?? '');
$owner_steamid = trim($data['owner_steamid'] ?? '');

// Eğer item_type verilmemişse, item_name'den çıkar
if (empty($item_type) && !empty($item_name)) {
    // CS2 item formatı: "AK-47 | Redline" -> "AK-47"
    $parts = explode('|', $item_name);
    $item_type = trim($parts[0]);
    
    // Eğer hala boşsa, varsayılan değer
    if (empty($item_type)) {
        $item_type = 'Weapon';
    }
}

if (!$user_id || !$item_name || !$price) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lütfen tüm alanları doldurun.']);
    exit;
}

$cols = [];
$vals = [];
$existingCols = [];
try {
    $columnStmt = $pdo->query('SHOW COLUMNS FROM ilanlar');
    foreach ($columnStmt->fetchAll() as $c) {
        $existingCols[] = $c['Field'];
    }
} catch (\PDOException $e) {}
if (in_array('user_id', $existingCols)) { $cols[] = 'user_id'; $vals[] = $user_id; }
if (in_array('item_name', $existingCols)) { $cols[] = 'item_name'; $vals[] = $item_name; }
if (in_array('price', $existingCols)) { $cols[] = 'price'; $vals[] = $price; }
if (in_array('image', $existingCols)) { $cols[] = 'image'; $vals[] = $image; }
if (in_array('item_type', $existingCols)) { $cols[] = 'item_type'; $vals[] = $item_type; }
if ($inspect_link !== '' && in_array('inspect_link', $existingCols)) { $cols[] = 'inspect_link'; $vals[] = $inspect_link; }
if ($assetid !== '' && in_array('assetid', $existingCols)) { $cols[] = 'assetid'; $vals[] = $assetid; }
if ($owner_steamid !== '' && in_array('owner_steamid', $existingCols)) { $cols[] = 'owner_steamid'; $vals[] = $owner_steamid; }
$success = false;
if (!empty($cols)) {
    $placeholders = implode(',', array_fill(0, count($cols), '?'));
    $sql = 'INSERT INTO ilanlar (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')';
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute($vals);
}

if ($success) {
    // Katalog upsert: ilan eklenirken kataloğa ekle/güncelle
    try {
        $upsert = $pdo->prepare("
            INSERT INTO skin_catalog (item_name, image, total_sales_count, last_sale_price, average_sale_price, first_seen_at, last_seen_at)
            VALUES (?, ?, 0, NULL, NULL, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                image = IF(VALUES(image) IS NOT NULL AND VALUES(image)!='', VALUES(image), image),
                last_seen_at = NOW(),
                first_seen_at = COALESCE(first_seen_at, VALUES(first_seen_at))
        ");
        $upsert->execute([$item_name, $image]);
    } catch (\PDOException $e) {
        // skin_catalog yoksa sessiz geç
    }
    echo json_encode(['success' => true, 'message' => 'İlan başarıyla eklendi!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'İlan eklenirken hata oluştu.']);
}
