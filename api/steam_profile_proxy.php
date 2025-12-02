<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için erken dönüş
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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

$url = "https://steamcommunity.com/profiles/$steamid/?xml=1";

function curl_get_contents($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    
    return [$response, $err, $httpCode];
}

list($response, $curlError, $httpCode) = curl_get_contents($url);

if ($httpCode !== 200) {
    echo json_encode([
        'error' => 'Steam profil bilgisi alınamadı', 
        'http_code' => $httpCode,
        'details' => $curlError
    ]);
    exit;
}

if ($response === false || !$response) {
    echo json_encode([
        'error' => 'Steam profil bilgisi alınamadı (cURL)', 
        'details' => $curlError
    ]);
    exit;
}

// XML'i JSON'a çevir
$xml = simplexml_load_string($response);
if ($xml === false) {
    echo json_encode([
        'error' => 'Steam profil XML yanıtı parse edilemedi',
        'raw_preview' => substr($response, 0, 200)
    ]);
    exit;
}

$profile = [
    'steamid' => (string)$xml->steamID,
    'steamid64' => (string)$xml->steamID64,
    'onlineState' => (string)$xml->onlineState,
    'stateMessage' => (string)$xml->stateMessage,
    'privacyState' => (string)$xml->privacyState,
    'visibilityState' => (string)$xml->visibilityState,
    'avatarIcon' => (string)$xml->avatarIcon,
    'avatarMedium' => (string)$xml->avatarMedium,
    'avatarFull' => (string)$xml->avatarFull,
    'vacBanned' => (string)$xml->vacBanned,
    'tradeBanState' => (string)$xml->tradeBanState,
    'isLimitedAccount' => (string)$xml->isLimitedAccount,
    'customURL' => (string)$xml->customURL,
    'memberSince' => (string)$xml->memberSince,
    'steamRating' => (string)$xml->steamRating,
    'hoursPlayed2Wk' => (string)$xml->hoursPlayed2Wk,
    'headline' => (string)$xml->headline,
    'location' => (string)$xml->location,
    'realname' => (string)$xml->realname,
    'summary' => (string)$xml->summary
];

echo json_encode($profile); 