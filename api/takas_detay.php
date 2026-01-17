<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// OPTIONS request handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'elep_gamedev';
    $user = 'elep_metinogulcank';
    $pass = '06ogulcan06';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get ID from request
    $id = $_GET['id'] ?? $_POST['id'] ?? null;
    
    if (!$id) {
        throw new Exception('ID parametresi gerekli');
    }
    
    // Fetch takas ilan with user information
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            u.fullname as username
        FROM takas_ilanlari t
        LEFT JOIN user u ON t.user_id = u.id
        WHERE t.id = ?
    ");
    
    $stmt->execute([$id]);
    $takas_ilan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$takas_ilan) {
        echo json_encode([
            'success' => false,
            'message' => 'Takas ilanı bulunamadı'
        ]);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'takas_ilan' => $takas_ilan
    ]);
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı bağlantı hatası!',
        'error' => $e->getMessage(),
        'sql_state' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
