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
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    $takas_ilan_id = $data['takas_ilan_id'] ?? null;
    $gonderen_user_id = $data['gonderen_user_id'] ?? null;
    $mesaj = $data['mesaj'] ?? null;
    $parent_id = $data['parent_id'] ?? null; // Cevap verilen mesajın ID'si
    
    if (!$takas_ilan_id || !$gonderen_user_id || !$mesaj) {
        throw new Exception('Eksik parametreler');
    }
    
    // Mesaj uzunluğunu kontrol et
    if (strlen($mesaj) > 100) {
        throw new Exception('Mesaj 100 karakterden uzun olamaz');
    }
    
    // Mesajlar tablosunu oluştur (eğer yoksa)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS takas_mesajlari (
            id INT AUTO_INCREMENT PRIMARY KEY,
            takas_ilan_id INT NOT NULL,
            gonderen_user_id INT NOT NULL,
            mesaj TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (takas_ilan_id),
            INDEX (gonderen_user_id)
        )
    ");
    
    // parent_id alanının var olup olmadığını kontrol et
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM takas_mesajlari LIKE 'parent_id'");
        $hasParentId = $checkColumn->rowCount() > 0;
    } catch (Exception $e) {
        $hasParentId = false;
    }
    
    // parent_id alanı yoksa ekle
    if (!$hasParentId) {
        try {
            $pdo->exec("ALTER TABLE takas_mesajlari ADD COLUMN parent_id INT NULL");
            $pdo->exec("ALTER TABLE takas_mesajlari ADD INDEX (parent_id)");
            // Foreign key eklemeyi dene, hata olursa devam et
            try {
                $pdo->exec("ALTER TABLE takas_mesajlari ADD FOREIGN KEY (parent_id) REFERENCES takas_mesajlari(id) ON DELETE SET NULL");
            } catch (Exception $e) {
                // Foreign key eklenemezse devam et
            }
        } catch (Exception $e) {
            // Alan zaten varsa hata verme
        }
    }
    
    // Mesajı kaydet
    if ($hasParentId || $parent_id === null) {
        // parent_id alanı varsa veya parent_id null ise normal kaydet
        $stmt = $pdo->prepare("
            INSERT INTO takas_mesajlari (takas_ilan_id, gonderen_user_id, mesaj, parent_id)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$takas_ilan_id, $gonderen_user_id, $mesaj, $parent_id]);
    } else {
        // parent_id alanı yoksa parent_id olmadan kaydet
        $stmt = $pdo->prepare("
            INSERT INTO takas_mesajlari (takas_ilan_id, gonderen_user_id, mesaj)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$takas_ilan_id, $gonderen_user_id, $mesaj]);
    }
    
    $mesaj_id = $pdo->lastInsertId();
    
    // Takas ilanının sahibini bul
    $stmt = $pdo->prepare("SELECT user_id FROM takas_ilanlari WHERE id = ?");
    $stmt->execute([$takas_ilan_id]);
    $ilan_sahibi = $stmt->fetch();
    
    // Eğer mesaj gönderen kişi ilan sahibi değilse, ilan sahibine bildirim gönder
    if ($ilan_sahibi && $ilan_sahibi['user_id'] != $gonderen_user_id) {
        // Mesaj gönderen kişinin adını al
        $stmt = $pdo->prepare("SELECT fullname FROM user WHERE id = ?");
        $stmt->execute([$gonderen_user_id]);
        $gonderen_kisi = $stmt->fetch();
        
        $gonderen_adi = $gonderen_kisi ? $gonderen_kisi['fullname'] : 'Bir kullanıcı';
        
        // Bildirim metnini oluştur
        $bildirim_text = $gonderen_adi . ' takas ilanınıza yorum yaptı: "' . substr($mesaj, 0, 50) . '"';
        
        // Bildirim ekle (takas_ilan_id'yi de sakla)
        $stmt = $pdo->prepare("INSERT INTO bildirimler (user_id, bildirim_text, takas_ilan_id) VALUES (?, ?, ?)");
        $stmt->execute([$ilan_sahibi['user_id'], $bildirim_text, $takas_ilan_id]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Mesaj başarıyla gönderildi',
        'mesaj_id' => $mesaj_id,
        'has_parent_id' => $hasParentId,
        'bildirim_gonderildi' => $ilan_sahibi && $ilan_sahibi['user_id'] != $gonderen_user_id
    ]);
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası!',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
