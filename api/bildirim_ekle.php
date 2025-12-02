<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['user_id']) || !isset($input['bildirim_text'])) {
        echo json_encode(['success' => false, 'message' => 'user_id ve bildirim_text gerekli']);
        exit;
    }
    
    $user_id = intval($input['user_id']);
    $bildirim_text = trim($input['bildirim_text']);
    
    if (empty($bildirim_text)) {
        echo json_encode(['success' => false, 'message' => 'Bildirim metni boş olamaz']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text) VALUES (?, ?)");
        $result = $stmt->execute([$user_id, $bildirim_text]);
        
        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Bildirim başarıyla eklendi',
                'bildirim_id' => $pdo->lastInsertId()
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Bildirim eklenirken hata oluştu']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Sadece POST metodu desteklenir']);
}
?>
