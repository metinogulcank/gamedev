<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

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
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_GET['user_id'])) {
            throw new Exception('user_id parametresi gerekli');
        }
        
        $user_id = intval($_GET['user_id']);
        
        // Okunmamış bildirim sayısını al
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as okunmamis 
            FROM bildirimler 
            WHERE user_id = ? AND is_okundu = 0
        ");
        $stmt->execute([$user_id]);
        $result = $stmt->fetch();
        $okunmamis_sayisi = intval($result['okunmamis']);
        
        echo json_encode([
            'success' => true,
            'okunmamis_sayisi' => $okunmamis_sayisi
        ]);
        
    } else {
        throw new Exception('Sadece GET metodu desteklenir');
    }
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
