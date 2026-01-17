<?php
// CORS ve Content-Type header'larını en başa koy
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hata ayıklama için tüm PHP hatalarını JSON olarak döndür
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json');
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
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Exception',
        'message' => $e->getMessage()
    ]);
    exit;
});

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

$user_id = intval($data['user_id'] ?? 0);
error_log("Favorilerim API - Received user_id: " . $user_id);
error_log("Favorilerim API - Raw data: " . json_encode($data));

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Kullanıcı ID gerekli!']);
    exit;
}

try {
    // Kullanıcının favorilerini ilanlar tablosuyla birleştirerek al
    $query = '
        SELECT i.*, f.created_at as favori_eklenme_tarihi 
        FROM favoriler f 
        INNER JOIN ilanlar i ON f.ilan_id = i.id 
        WHERE f.user_id = ? 
        ORDER BY f.created_at DESC
    ';
    
    error_log("Favorilerim API - Executing query: " . $query);
    error_log("Favorilerim API - With user_id: " . $user_id);
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $favoriler = $stmt->fetchAll();
    
    error_log("Favorilerim API - Found " . count($favoriler) . " favorites");
    error_log("Favorilerim API - Favorites data: " . json_encode($favoriler));

    echo json_encode(['success' => true, 'favoriler' => $favoriler]);
    
} catch(\PDOException $e) {
    error_log("Favorilerim API - Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>
