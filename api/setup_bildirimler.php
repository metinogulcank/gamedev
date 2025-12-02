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
    
    // Bildirimler tablosunu oluştur
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `bildirimler` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `user_id` int(11) NOT NULL,
          `bildirim_text` text NOT NULL,
          `is_okundu` tinyint(1) NOT NULL DEFAULT 0,
          `takas_ilan_id` int(11) NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_user_id` (`user_id`),
          KEY `idx_is_okundu` (`is_okundu`),
          KEY `idx_created_at` (`created_at`),
          KEY `idx_takas_ilan_id` (`takas_ilan_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Test bildirimi ekle
    $stmt = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, is_okundu) VALUES (?, ?, ?)");
    $stmt->execute([1, 'Test bildirimi - Sistem hazır!', 0]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Bildirimler tablosu oluşturuldu ve test bildirimi eklendi!',
        'table_created' => true
    ]);
    
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
