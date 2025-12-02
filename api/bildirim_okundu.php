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
    $dbname = 'gamedev_db';
    $user = 'gamedev_User';
    $pass = 'gamedev_5815471';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['bildirim_id'])) {
            throw new Exception('bildirim_id gerekli');
        }
        
        $bildirim_id = intval($input['bildirim_id']);
        
        $stmt = $pdo->prepare("UPDATE bildirimler SET is_okundu = 1 WHERE id = ?");
        $result = $stmt->execute([$bildirim_id]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Bildirim okundu olarak işaretlendi'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Bildirim bulunamadı veya zaten okunmuş']);
        }
    } else {
        throw new Exception('Sadece POST metodu desteklenir');
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
