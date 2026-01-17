<?php
// CORS ve Content-Type
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Hata yönetimi - JSON döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'PHP Error',
        'message' => $errstr,
        'file' => $errfile,
        'line' => $errline,
    ]);
    exit;
});
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Exception',
        'message' => $e->getMessage(),
    ]);
    exit;
});
// Girdi al
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$trade_url = trim($data['trade_url'] ?? '');
if (!$user_id || !$trade_url) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id ve trade_url zorunludur']);
    exit;
}
// Basit format doğrulaması (esnek bırakıldı)
$normalized_trade_url = $trade_url;
// İsteğe bağlı: Trade URL Steam formatı kontrolü
$pattern = '#^https?://steamcommunity\.com/tradeoffer/new/\?partner=\d+&token=[A-Za-z0-9_-]+#i';
if (!preg_match($pattern, $normalized_trade_url)) {
    // Yumuşak uyarı: format hatalı olabilir; yine de kaydetmek istiyorsanız bu satırı yorum satırı yapabilirsiniz
    // http_response_code(400);
    // echo json_encode(['success' => false, 'message' => 'Geçersiz Steam Trade URL formatı']);
    // exit;
}
// DB bağlan
$host = 'localhost';
$db   = 'elep_gamedev';
$user = 'elep_metinogulcank';
$pass = '06ogulcan06';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']);
    exit;
}
// trade_url başka bir kullanıcıda var mı?
$check = $pdo->prepare('SELECT id FROM user WHERE trade_url = ? AND id <> ? LIMIT 1');
$check->execute([$normalized_trade_url, $user_id]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Bu trade URL başka bir kullanıcı tarafından kullanılıyor']);
    exit;
}
// Güncelle
try {
    $stmt = $pdo->prepare('UPDATE user SET trade_url = ? WHERE id = ?');
    $ok = $stmt->execute([$normalized_trade_url, $user_id]);
    if ($ok) {
        // Trade URL başarıyla güncellendi: kullanıcının envanterini katalogla
        $partnerId = null;
        $parts = parse_url($normalized_trade_url);
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $q);
            if (!empty($q['partner'])) {
                $partnerId = $q['partner'];
            }
        }
        $steamid64 = null;
        if ($partnerId) {
            $steamid64 = (string)(76561197960265728 + (int)$partnerId);
        }
        $catalog_added = 0;
        if ($steamid64) {
            // steam library'yi yükle
            $lib1 = __DIR__ . '/steam/www/lib/steam.php';
            $lib2 = dirname(__DIR__) . '/src/steam/www/lib/steam.php';
            if (file_exists($lib1) || file_exists($lib2)) {
                require_once(file_exists($lib1) ? $lib1 : $lib2);
                $inv = open_inventory($steamid64, 730, 2);
                if (!empty($inv['success']) && !empty($inv['items'])) {
                    foreach ($inv['items'] as $it) {
                        $name = $it['name'] ?? '';
                        $img = $it['image'] ?? '';
                        if ($name) {
                            try {
                                $up = $pdo->prepare("
                                    INSERT INTO skin_catalog (item_name, image, total_sales_count, first_seen_at, last_seen_at)
                                    VALUES (?, ?, 0, NOW(), NOW())
                                    ON DUPLICATE KEY UPDATE
                                        image = IF(VALUES(image) IS NOT NULL AND VALUES(image)!='', VALUES(image), image),
                                        last_seen_at = NOW(),
                                        first_seen_at = COALESCE(first_seen_at, VALUES(first_seen_at))
                                ");
                                $up->execute([$name, $img]);
                                $catalog_added++;
                            } catch (\PDOException $e) {
                                // sessiz geç
                            }
                        }
                    }
                }
            }
        }
        echo json_encode(['success' => true, 'trade_url' => $normalized_trade_url, 'catalog_upserted' => $catalog_added]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Güncelleme başarısız']);
    }
} catch (\PDOException $e) {
    // Muhtemel: Unknown column 'trade_url'
    if ($e->getCode() === '42S22') {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "Veritabanında 'trade_url' sütunu bulunamadı. Lütfen önce ekleyin: ALTER TABLE `user` ADD COLUMN `trade_url` VARCHAR(255) UNIQUE NULL DEFAULT NULL;",
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
