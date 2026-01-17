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
    
    // Karşı teklifler tablosunu oluştur
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `karsi_teklifler` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `ilan_id` int(11) NOT NULL,
          `teklif_veren_user_id` int(11) NOT NULL,
          `teklif_fiyati` decimal(10,2) NOT NULL,
          `teklif_durumu` enum('beklemede','kabul_edildi','reddedildi') NOT NULL DEFAULT 'beklemede',
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_ilan_id` (`ilan_id`),
          KEY `idx_teklif_veren_user_id` (`teklif_veren_user_id`),
          KEY `idx_teklif_durumu` (`teklif_durumu`),
          KEY `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo json_encode([
        'success' => true,
        'message' => 'Karşı teklifler tablosu oluşturuldu!',
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
