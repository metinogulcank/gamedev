<?php
// Basit ve Ücretsiz Float Proxy
// Sadece api.csgofloat.com (Public API) kullanır.
// CORS sorununu aşmak için sunucu taraflı istek yapar.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Inspect linkini al
$inspect_link = $_GET['url'] ?? $_GET['inspect_link'] ?? '';

if (!$inspect_link) {
    http_response_code(400);
    echo json_encode(['error' => 'Inspect link gerekli (url parametresi)']);
    exit;
}

// URL'i normalize et (bazı durumlarda encode edilmiş gelebilir)
$target_url = 'https://api.csgofloat.com/?url=' . urlencode($inspect_link);

// cURL ile isteği yap
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

// "Stealth" Modu: Gerçek bir tarayıcı gibi görünmek için başlıkları ekle
// Bu, CSFloat'un "Bot" korumasını (429/400 hatalarını) aşmaya yardımcı olabilir.
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control: max-age=0',
    'Connection: keep-alive',
    'Upgrade-Insecure-Requests: 1',
    'Sec-Fetch-Dest: document',
    'Sec-Fetch-Mode: navigate',
    'Sec-Fetch-Site: none',
    'Sec-Fetch-User: ?1',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]);

// SSL doğrulamasını devre dışı bırak (gerekirse)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($http_code === 200 && $response) {
    echo $response;
} else {
    http_response_code($http_code === 200 ? 500 : $http_code);
    echo json_encode([
        'error' => 'Float API hatası',
        'details' => $error,
        'upstream_code' => $http_code,
        'response' => $response
    ]);
}
