<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için erken dönüş
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Hata raporlamayı kapat, logla
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
// PHP hatalarını JSON olarak döndür
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

$lib = __DIR__ . '/steam/www/lib/steam.php';
if (!file_exists($lib)) {
    $alt = dirname(__DIR__) . '/src/steam/www/lib/steam.php';
    if (file_exists($alt)) {
        $lib = $alt;
    } else {
        echo json_encode(['error' => 'steam library not found']);
        exit;
    }
}
require_once $lib;

$steamid = $_GET['steamid'] ?? '';
if (!$steamid) {
    echo json_encode(['error' => 'steamid parametresi gerekli']);
    exit;
}

// Steam ID formatını kontrol et
if (!preg_match('/^\d{17}$/', $steamid)) {
    echo json_encode(['error' => 'Geçersiz Steam ID formatı']);
    exit;
}

// Parametreleri al
$lang = $_GET['lang'] ?? 'english';
$count = $_GET['count'] ?? '5000';

// 1. steam/www/lib/steam.php içindeki open_inventory fonksiyonu ile dene
$inventory = open_inventory($steamid, 730, 2);
if (!empty($inventory['success']) && !empty($inventory['items'])) {
    if (isset($_GET['upsert']) && $_GET['upsert'] === '1') {
        // DB'ye upsert
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
        $upserted = 0;
        try {
            $pdo = new PDO($dsn, $user, $pass, $options);
            foreach ($inventory['items'] as $it) {
                $name = $it['name'] ?? '';
                $img = $it['image'] ?? '';
                if (!$name) continue;
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO skin_catalog (item_name, image, total_sales_count, first_seen_at, last_seen_at)
                        VALUES (?, ?, 0, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE
                            image = IF(VALUES(image) IS NOT NULL AND VALUES(image)!='', VALUES(image), image),
                            last_seen_at = NOW(),
                            first_seen_at = COALESCE(first_seen_at, VALUES(first_seen_at))
                    ");
                    $stmt->execute([$name, $img]);
                    $upserted++;
                } catch (\PDOException $e) {}
            }
        } catch (\PDOException $e) {
            echo json_encode(['error' => 'catalog upsert db error', 'message' => $e->getMessage()]);
            exit;
        }
        echo json_encode(['success' => true, 'upserted' => $upserted, 'items' => $inventory['items']]);
        exit;
    } else {
        echo json_encode($inventory);
        exit;
    }
}

// 2. Eski yöntem: Herkese açık envanter endpoint'i
$url = "https://steamcommunity.com/inventory/$steamid/730/2?l=$lang&count=$count";

function curl_get_contents($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    curl_setopt($ch, CURLOPT_ENCODING, ""); // Sıkıştırmayı otomatik aç
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HEADER, 1); // Header'ları da al
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    
    // Header ve body'yi ayır
    $headerSize = strpos($response, "\r\n\r\n");
    if ($headerSize !== false) {
        $header = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize + 4);
    } else {
        $header = '';
        $body = $response;
    }
    
    return [$body, $err, $httpCode, $header];
}

list($response, $curlError, $httpCode, $header) = curl_get_contents($url);

// HTTP durum kodunu kontrol et
if ($httpCode !== 200) {
    echo json_encode([
        'error' => 'Steam sunucusu hata döndürdü', 
        'http_code' => $httpCode,
        'details' => $curlError,
        'header' => $header
    ]);
    exit;
}

if ($response === false || !$response) {
    echo json_encode([
        'error' => 'Steam envanteri alınamadı (cURL)', 
        'details' => $curlError,
        'http_code' => $httpCode
    ]);
    exit;
}

// Boş yanıt kontrolü
if (trim($response) === '' || $response === 'null') {
    echo json_encode([
        'error' => 'Envanter boş veya erişilemiyor',
        'message' => 'Bu Steam hesabının CS2 envanteri boş olabilir veya envanter gizli olabilir',
        'steamid' => $steamid,
        'url' => $url
    ]);
    exit;
}

// JSON mu kontrol et
$json = json_decode($response, true);
if ($json === null) {
    echo json_encode([
        'error' => 'Steam yanıtı JSON değil', 
        'raw_length' => strlen($response),
        'raw_preview' => substr($response, 0, 200),
        'json_error' => json_last_error_msg(),
        'steamid' => $steamid
    ]);
    exit;
}

// Envanter boş mu kontrol et
if (empty($json) || !isset($json['descriptions']) || empty($json['descriptions'])) {
    echo json_encode([
        'error' => 'Envanter boş',
        'message' => 'Bu Steam hesabının CS2 envanteri boş olabilir veya envanter gizli olabilir',
        'steamid' => $steamid,
        'inventory_keys' => array_keys($json)
    ]);
    exit;
}

// Başarılı yanıt
if (isset($_GET['upsert']) && $_GET['upsert'] === '1') {
    // descriptions üzerinden upsert
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
    $upserted = 0;
    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        foreach ($json['descriptions'] as $d) {
            $name = $d['name'] ?? '';
            $icon = $d['icon_url'] ?? '';
            if (!$name) continue;
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO skin_catalog (item_name, image, total_sales_count, first_seen_at, last_seen_at)
                    VALUES (?, ?, 0, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        image = IF(VALUES(image) IS NOT NULL AND VALUES(image)!='', VALUES(image), image),
                        last_seen_at = NOW(),
                        first_seen_at = COALESCE(first_seen_at, VALUES(first_seen_at))
                ");
                $stmt->execute([$name, $icon]);
                $upserted++;
            } catch (\PDOException $e) {}
        }
    } catch (\PDOException $e) {
        echo json_encode(['error' => 'catalog upsert db error', 'message' => $e->getMessage()]);
        exit;
    }
    echo json_encode(['success' => true, 'upserted' => $upserted]);
    exit;
}
echo $response; 

// Yeni dosya: api/float_proxy.php
// Amaç: Frontend'den inspect_link al, csgofloat.com'a sunucu tarafında istek at, sonucu JSON olarak döndür

if (basename(__FILE__) === 'float_proxy.php') {
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
    $inspect_link = $_GET['inspect_link'] ?? '';
    if (!$inspect_link) {
        echo json_encode(['error' => 'inspect_link parametresi gerekli']);
        exit;
    }
    $url = 'https://api.csgofloat.com/?url=' . urlencode($inspect_link);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($httpCode !== 200) {
        echo json_encode(['error' => 'csgofloat.com hata', 'http_code' => $httpCode, 'details' => $err]);
        exit;
    }
    if ($response === false || !$response) {
        echo json_encode(['error' => 'csgofloat.com yanıtı alınamadı', 'details' => $err]);
        exit;
    }
    echo $response;
    exit;
} 
