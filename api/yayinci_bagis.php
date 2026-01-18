<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json');

// Veritabanı bağlantı bilgileri
$host = 'localhost';
$db   = 'gamedev_db';
$user = 'gamedev_User';
$pass = 'gamedev_5815471';
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

// GET isteği: Bağış listesini getir
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $yayinci_user_id = isset($_GET['yayinci_user_id']) ? (int)$_GET['yayinci_user_id'] : 0;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    
    if (!$yayinci_user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'yayinci_user_id parametresi gerekli.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare('
            SELECT 
                yb.*,
                u.fullname as bagisci_fullname
            FROM yayinci_bagis yb
            LEFT JOIN user u ON yb.bagisci_user_id = u.id
            WHERE yb.yayinci_user_id = ?
            ORDER BY yb.created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$yayinci_user_id, $limit]);
        $bagislar = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => $bagislar
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
    exit;
}

// POST isteği: Bağış gönder
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // JSON veya POST ile veri al
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $data = [];
    
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
    } else {
        $data = $_POST;
    }
    
    $yayinci_user_id = isset($data['yayinci_user_id']) ? (int)$data['yayinci_user_id'] : 0;
    $bagisci_user_id = isset($data['bagisci_user_id']) ? (int)$data['bagisci_user_id'] : 0;
    $bagisci_adi = trim($data['bagisci_adi'] ?? '');
    $tutar = isset($data['tutar']) ? floatval(str_replace(',', '.', $data['tutar'])) : 0;
    $mesaj = trim($data['mesaj'] ?? '');
    
    // Validasyon
    if (!$yayinci_user_id || !$bagisci_user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'yayinci_user_id ve bagisci_user_id gerekli.']);
        exit;
    }
    
    if (!$bagisci_adi) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Adınız gerekli.']);
        exit;
    }
    
    if ($tutar <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Geçerli bir tutar giriniz.']);
        exit;
    }
    
    // Mesaj uzunluk kontrolü (max 250 karakter)
    if (strlen($mesaj) > 250) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mesaj en fazla 250 karakter olabilir.']);
        exit;
    }
    
    // Aynı kişiye bağış yapılamaz kontrolü
    if ($yayinci_user_id === $bagisci_user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kendinize bağış yapamazsınız.']);
        exit;
    }
    
    $pdo->beginTransaction();
    try {
        // 1. Bağışçının bakiyesini kontrol et
        $stmt = $pdo->prepare('SELECT id, email, balance FROM user WHERE id = ?');
        $stmt->execute([$bagisci_user_id]);
        $bagisci = $stmt->fetch();
        
        if (!$bagisci) {
            throw new Exception('Bağışçı bulunamadı.');
        }
        
        $current_balance = floatval($bagisci['balance']);
        
        // 2. Yeterli bakiye kontrolü
        if ($current_balance < $tutar) {
            throw new Exception('Yetersiz bakiye. Mevcut bakiye: ' . number_format($current_balance, 2, ',', '.') . ' TL');
        }
        
        // 3. Yayıncının var olup olmadığını kontrol et
        $stmt = $pdo->prepare('SELECT id FROM user WHERE id = ?');
        $stmt->execute([$yayinci_user_id]);
        $yayinci = $stmt->fetch();
        
        if (!$yayinci) {
            throw new Exception('Yayıncı bulunamadı.');
        }
        
        // 4. Bağışçının bakiyesini düş
        $stmt = $pdo->prepare('UPDATE user SET balance = balance - ? WHERE id = ?');
        $stmt->execute([$tutar, $bagisci_user_id]);
        
        // 5. Yayıncının bakiyesine ekle (veya başka bir tabloda tutulabilir)
        // Şimdilik sadece bağışçıdan düşüyoruz, yayıncıya ekleme yapmıyoruz
        // İsterseniz yayıncının bakiyesine de ekleyebiliriz:
        // $stmt = $pdo->prepare('UPDATE user SET balance = balance + ? WHERE id = ?');
        // $stmt->execute([$tutar, $yayinci_user_id]);
        
        // 6. Bağış kaydını ekle
        $stmt = $pdo->prepare('
            INSERT INTO yayinci_bagis (
                yayinci_user_id, 
                bagisci_user_id, 
                bagisci_adi, 
                tutar, 
                mesaj
            ) VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $yayinci_user_id,
            $bagisci_user_id,
            $bagisci_adi,
            $tutar,
            $mesaj
        ]);
        
        $bagis_id = $pdo->lastInsertId();
        
        // 7. Bağışçıya bildirim ekle
        $bildirim_text = $bagisci_adi . " adıyla " . number_format($tutar, 2, ',', '.') . " TL bağış yaptınız.";
        $stmt = $pdo->prepare('INSERT INTO bildirimler (user_id, bildirim_text, is_okundu) VALUES (?, ?, 0)');
        $stmt->execute([$bagisci_user_id, $bildirim_text]);
        
        // 8. Yayıncıya bildirim ekle
        $yayinci_bildirim_text = $bagisci_adi . " size " . number_format($tutar, 2, ',', '.') . " TL bağış yaptı.";
        $stmt = $pdo->prepare('INSERT INTO bildirimler (user_id, bildirim_text, is_okundu) VALUES (?, ?, 0)');
        $stmt->execute([$yayinci_user_id, $yayinci_bildirim_text]);
        
        // 9. İşlem kaydını ekle
        $stmt = $pdo->prepare('INSERT INTO balance_transactions (user_email, amount, method) VALUES (?, ?, ?)');
        $stmt->execute([$bagisci['email'], -$tutar, 'yayinci_bagis']);
        
        $pdo->commit();
        
        // Güncellenmiş bakiyeyi getir
        $stmt = $pdo->prepare('SELECT balance FROM user WHERE id = ?');
        $stmt->execute([$bagisci_user_id]);
        $new_balance = $stmt->fetch()['balance'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Bağış başarıyla gönderildi!',
            'new_balance' => $new_balance,
            'bagis_id' => $bagis_id
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (\PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
}
?>

