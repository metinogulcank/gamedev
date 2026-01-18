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
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Yayıncı başvuru tablosunu oluştur
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `yayinci_basvuru` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `user_id` int(11) NOT NULL,
          `yayin_linki` varchar(500) DEFAULT NULL,
          `sayfa_basligi` varchar(255) DEFAULT NULL,
          `destek_adresi` varchar(255) DEFAULT NULL,
          `min_bagis_tutari` decimal(10,2) DEFAULT NULL,
          `twitch_adresi` varchar(500) DEFAULT NULL,
          `youtube_adresi` varchar(500) DEFAULT NULL,
          `instagram_adresi` varchar(500) DEFAULT NULL,
          `twitter_adresi` varchar(500) DEFAULT NULL,
          `discord_adresi` varchar(500) DEFAULT NULL,
          `tiktok_adresi` varchar(500) DEFAULT NULL,
          `nimo_tv_adresi` varchar(500) DEFAULT NULL,
          `dlive_adresi` varchar(500) DEFAULT NULL,
          `durum` enum('beklemede','onaylandi','reddedildi') DEFAULT 'beklemede',
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_user_id` (`user_id`),
          KEY `idx_user_id` (`user_id`),
          KEY `idx_durum` (`durum`),
          KEY `idx_destek_adresi` (`destek_adresi`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo json_encode([
        'success' => true,
        'message' => 'Yayıncı başvuru tablosu başarıyla oluşturuldu!',
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

