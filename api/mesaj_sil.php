<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
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
    
    // Get data from request
    $input = json_decode(file_get_contents('php://input'), true);
    $mesaj_id = $input['mesaj_id'] ?? null;
    $user_id = $input['user_id'] ?? null;
    $takas_ilan_id = $input['takas_ilan_id'] ?? null;
    
    if (!$mesaj_id || !$user_id || !$takas_ilan_id) {
        throw new Exception('Mesaj ID, kullanıcı ID ve takas ilan ID gerekli');
    }
    
    // Önce mesajı ve takas ilanını kontrol et
    $stmt = $pdo->prepare("
        SELECT 
            tm.*,
            ti.user_id as ilan_sahibi_id
        FROM takas_mesajlari tm
        JOIN takas_ilanlari ti ON tm.takas_ilan_id = ti.id
        WHERE tm.id = ? AND tm.takas_ilan_id = ?
    ");
    $stmt->execute([$mesaj_id, $takas_ilan_id]);
    $mesaj = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$mesaj) {
        throw new Exception('Mesaj bulunamadı');
    }
    
    // Yetki kontrolü: İlan sahibi veya mesaj sahibi olmalı
    $is_ilan_sahibi = ($user_id == $mesaj['ilan_sahibi_id']);
    $is_mesaj_sahibi = ($user_id == $mesaj['gonderen_user_id']);
    
    if (!$is_ilan_sahibi && !$is_mesaj_sahibi) {
        throw new Exception('Bu mesajı silme yetkiniz yok');
    }
    
    // Mesajı sil
    $stmt = $pdo->prepare("DELETE FROM takas_mesajlari WHERE id = ?");
    $stmt->execute([$mesaj_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Mesaj başarıyla silindi'
        ]);
    } else {
        throw new Exception('Mesaj silinemedi');
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
