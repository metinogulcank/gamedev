<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database bağlantısı
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

    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Geçersiz veri formatı');
    }

         // Gerekli alanları kontrol et
     $required_fields = ['user_id', 'item_name', 'item_type', 'item_rarity', 'image', 'wanted_item', 'description', 'overpay', 'wear'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Eksik alan: $field");
        }
    }

         $user_id = intval($input['user_id']);
     $item_name = trim($input['item_name']);
     $item_type = trim($input['item_type']);
     $item_rarity = trim($input['item_rarity']);
     $item_price = 0; // Takas ilanlarında fiyat her zaman 0
     $image = trim($input['image']);
     $wanted_item = trim($input['wanted_item']);
     $description = trim($input['description']);
     $overpay = $input['overpay'] === 'yes' ? 1 : 0;
     $wear = trim($input['wear']);

    // Takas tablosunu oluştur (eğer yoksa)
    $create_table_sql = "
    CREATE TABLE IF NOT EXISTS takas_ilanlari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        item_type VARCHAR(100) NOT NULL,
        item_rarity VARCHAR(100) NOT NULL,
        item_price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        wanted_item VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        overpay TINYINT(1) DEFAULT 0,
        wear VARCHAR(50) DEFAULT 'any',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($create_table_sql);

    // Takas ilanını ekle
    $insert_sql = "
    INSERT INTO takas_ilanlari 
    (user_id, item_name, item_type, item_rarity, item_price, image, wanted_item, description, overpay, wear) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($insert_sql);
    $stmt->execute([
        $user_id,
        $item_name,
        $item_type,
        $item_rarity,
        $item_price,
        $image,
        $wanted_item,
        $description,
        $overpay,
        $wear
    ]);

    $takas_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Takas ilanı başarıyla eklendi!',
        'takas_id' => $takas_id
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
