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

// steam/www/lib/steam.php dosyasını dahil et
require_once __DIR__ . '/steam/www/lib/steam.php';

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
    echo json_encode($inventory);
    exit;
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
        'message' => 'Bu Steam hesabının CS2 envanterinde item bulunamadı',
        'steamid' => $steamid,
        'inventory_keys' => array_keys($json)
    ]);
    exit;
}

// Başarılı yanıt
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