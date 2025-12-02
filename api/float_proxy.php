<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// CSFloat API anahtarı (güncellendi)
$CSFLOAT_API_KEY = 'XJ0M6UfDP6S0_ig49xDT782e4Kl4jEFg'; // Güvenlik için .env veya config dosyasına taşıyabilirsin

// CSInventoryAPI anahtarı (buraya kendi anahtarınızı girin)
$CSINV_API_KEY = '';

// Yardımcılar
function getSteamId64FromTradeUrl($url) {
    if (!$url) return '';
    $parts = parse_url($url);
    if (!isset($parts['query'])) return '';
    parse_str($parts['query'], $q);
    if (empty($q['partner'])) return '';
    $partner = (int)$q['partner'];
    // 76561197960265728 + partner
    $base = 76561197960265728;
    $sid64 = (string)($base + $partner);
    return $sid64;
}

// Kendin barındırdığın CSFloat Inspect backend (csfloat/inspect) için base URL
// Varsayılan: lokal geliştirme
$INSPECT_BACKEND_BASE = getenv('INSPECT_BACKEND_BASE') ?: 'http://localhost:42069';

function normalizeInspectLinkPhp($link, $ownerSteamId, $assetId = null) {
    if (!$link) return $link;
    $out = $link;
    if (!empty($ownerSteamId)) {
        $out = str_replace('%owner_steamid%', $ownerSteamId, $out);
        // "%20SA" → " S{owner}A"
        if (strpos($out, '%20SA') !== false) {
            $out = str_replace('%20SA', '%20S' . $ownerSteamId . 'A', $out);
        }
        if (strpos($out, ' SA') !== false) {
            $out = str_replace(' SA', ' S' . $ownerSteamId . 'A', $out);
        }
    }
    if (!empty($assetId)) {
        $out = str_replace('%assetid%', $assetId, $out);
    }
    return $out;
}

// 0. CSInventoryAPI inspect endpoint (API ile doğrudan)
if (isset($_GET['csinv_inspect']) && !empty($_GET['url'])) {
    if (empty($CSINV_API_KEY)) {
        http_response_code(500);
        echo json_encode(['error' => 'CSInventoryAPI key yok', 'message' => 'Lütfen float_proxy.php içinde $CSINV_API_KEY değerini girin.']);
        exit;
    }
    $owner = $_GET['owner_steamid'] ?? '';
    if (!$owner && !empty($_GET['trade_url'])) {
        $owner = getSteamId64FromTradeUrl($_GET['trade_url']);
    }
    $inspectUrl = normalizeInspectLinkPhp($_GET['url'], $owner, $_GET['assetid'] ?? null);
    $url = 'https://csinventoryapi.com/api/v1/inspect?api_key=' . urlencode($CSINV_API_KEY) . '&url=' . urlencode($inspectUrl);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($httpCode !== 200 || !$response) {
        http_response_code(502);
        echo json_encode(['error' => 'csinventoryapi inspect başarısız', 'http_code' => $httpCode, 'details' => $err]);
        exit;
    }
    echo $response;
    exit;
}

// 1. CSFloat inspect endpoint (API ile doğrudan)
if (isset($_GET['csfloat_inspect']) && !empty($_GET['url'])) {
    $owner = $_GET['owner_steamid'] ?? '';
    if (!$owner && !empty($_GET['trade_url'])) {
        $owner = getSteamId64FromTradeUrl($_GET['trade_url']);
    }
    $inspectUrl = normalizeInspectLinkPhp($_GET['url'], $owner, $_GET['assetid'] ?? null);
    $endpointCandidates = [
        'https://api.csfloat.com/inspect',
        'https://csfloat.com/api/v1/inspect',
    ];
    $lastError = null;
    foreach ($endpointCandidates as $endpoint) {
        $url = $endpoint . '?url=' . urlencode($inspectUrl);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
        curl_setopt($ch, CURLOPT_TIMEOUT, 25);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        // Denenecek header varyasyonları
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $CSFLOAT_API_KEY,
            'X-API-Key: ' . $CSFLOAT_API_KEY,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($httpCode === 200 && $response) {
            echo $response;
            exit;
        }
        $lastError = ['http_code' => $httpCode, 'err' => $err, 'endpoint' => $endpoint, 'normalized_url' => $inspectUrl];
    }
    http_response_code(502);
    echo json_encode(['error' => 'csfloat inspect başarısız', 'details' => $lastError]);
    exit;
}

// 1.b - Self-host inspect backend (csfloat/inspect) proxy
// Kullanim:
//  - ?self_inspect=1&url=<INSPECT_URL>
//  - veya ayrı ayrı: ?self_inspect=1&s=<S>&a=<A>&d=<D>&m=<M>
if (isset($_GET['self_inspect'])) {
    $target = $INSPECT_BACKEND_BASE . '/';
    $query = [];
    if (!empty($_GET['url'])) {
        // URL varsa normalize et ve doğrudan gönder
        $owner = $_GET['owner_steamid'] ?? '';
        if (!$owner && !empty($_GET['trade_url'])) {
            $owner = getSteamId64FromTradeUrl($_GET['trade_url']);
        }
        $normalized = normalizeInspectLinkPhp($_GET['url'], $owner, $_GET['assetid'] ?? null);
        $query['url'] = $normalized;
    } else {
        // Parçalı parametreler
        foreach (['s','a','d','m'] as $k) {
            if (isset($_GET[$k]) && $_GET[$k] !== '') $query[$k] = $_GET[$k];
        }
    }
    if (empty($query)) {
        http_response_code(400);
        echo json_encode(['error' => 'self_inspect için url ya da (s,a,d[,m]) parametreleri gerekir']);
        exit;
    }
    $url = $target . '?' . http_build_query($query);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($httpCode !== 200 || !$response) {
        http_response_code(502);
        echo json_encode(['error' => 'self_inspect backend başarısız', 'http_code' => $httpCode, 'details' => $err, 'forward_url' => $url]);
        exit;
    }
    echo $response;
    exit;
}

// 2. CSFloat listings endpoint
if (isset($_GET['csfloat_listings'])) {
    $params = [];
    if (!empty($_GET['user_id'])) {
        $params['user_id'] = $_GET['user_id'];
    }
    if (!empty($_GET['market_hash_name'])) {
        $params['market_hash_name'] = $_GET['market_hash_name'];
    }
    if (!empty($_GET['limit'])) {
        $params['limit'] = $_GET['limit'];
    }
    $query = http_build_query($params);
    $url = 'https://csfloat.com/api/v1/listings';
    if ($query) $url .= '?' . $query;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: ' . $CSFLOAT_API_KEY
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($httpCode !== 200) {
        echo json_encode(['error' => 'csfloat.com hata', 'http_code' => $httpCode, 'details' => $err, 'url' => $url]);
        exit;
    }
    if ($response === false || !$response) {
        echo json_encode(['error' => 'csfloat.com yanıtı alınamadı', 'details' => $err]);
        exit;
    }
    echo $response;
    exit;
}

// 3. Eski inspect_link endpoint (csgofloat.com)
$inspect_link = $_GET['inspect_link'] ?? '';
if ($inspect_link) {
    $owner = $_GET['owner_steamid'] ?? '';
    if (!$owner && !empty($_GET['trade_url'])) {
        $owner = getSteamId64FromTradeUrl($_GET['trade_url']);
    }
    $normalized = normalizeInspectLinkPhp($inspect_link, $owner, $_GET['assetid'] ?? null);
    $url = 'https://api.csgofloat.com/?url=' . urlencode($normalized);
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

echo json_encode(['error' => 'inspect_link veya csfloat_listings parametresi gerekli']); 