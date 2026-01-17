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
    
    // Get takas_ilan_id from request
    $takas_ilan_id = $_GET['takas_ilan_id'] ?? $_POST['takas_ilan_id'] ?? null;
    
    if (!$takas_ilan_id) {
        throw new Exception('Takas ilan ID gerekli');
    }
    
    // Önce parent_id alanının var olup olmadığını kontrol et
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM takas_mesajlari LIKE 'parent_id'");
        $hasParentId = $checkColumn->rowCount() > 0;
    } catch (Exception $e) {
        $hasParentId = false;
    }
    
    if ($hasParentId) {
        // parent_id alanı varsa hiyerarşik sorgu kullan
        $stmt = $pdo->prepare("
            SELECT 
                tm.*,
                u.fullname as gonderen_username,
                parent.gonderen_user_id as parent_gonderen_user_id,
                parent.mesaj as parent_mesaj,
                parent_u.fullname as parent_username
            FROM takas_mesajlari tm
            LEFT JOIN user u ON tm.gonderen_user_id = u.id
            LEFT JOIN takas_mesajlari parent ON tm.parent_id = parent.id
            LEFT JOIN user parent_u ON parent.gonderen_user_id = parent_u.id
            WHERE tm.takas_ilan_id = ?
            ORDER BY 
                COALESCE(tm.parent_id, tm.id) ASC,
                tm.parent_id ASC,
                tm.created_at ASC
        ");
    } else {
        // parent_id alanı yoksa basit sorgu kullan
        $stmt = $pdo->prepare("
            SELECT 
                tm.*,
                u.fullname as gonderen_username
            FROM takas_mesajlari tm
            LEFT JOIN user u ON tm.gonderen_user_id = u.id
            WHERE tm.takas_ilan_id = ?
            ORDER BY tm.created_at ASC
        ");
    }
    
    $stmt->execute([$takas_ilan_id]);
    $mesajlar = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($hasParentId) {
        // Mesajları hiyerarşik yapıya dönüştür
        $hierarchical_mesajlar = [];
        $mesaj_map = [];
        
        // Önce tüm mesajları map'e ekle
        foreach ($mesajlar as $mesaj) {
            $mesaj['replies'] = [];
            $mesaj_map[$mesaj['id']] = $mesaj;
        }
        
        // Sonra parent-child ilişkilerini kur
        foreach ($mesajlar as $mesaj) {
            if ($mesaj['parent_id'] && isset($mesaj_map[$mesaj['parent_id']])) {
                // Bu bir cevap mesajı
                $mesaj_map[$mesaj['parent_id']]['replies'][] = $mesaj;
            }
        }
        
        // Ana mesajları ekle
        foreach ($mesajlar as $mesaj) {
            if (!$mesaj['parent_id']) {
                // Bu ana mesaj
                $hierarchical_mesajlar[] = $mesaj_map[$mesaj['id']];
            }
        }
        
        // Ana mesajları oluşturulma tarihine göre sırala
        usort($hierarchical_mesajlar, function($a, $b) {
            return strtotime($a['created_at']) - strtotime($b['created_at']);
        });
        
        $result_mesajlar = $hierarchical_mesajlar;
    } else {
        // Basit yapı kullan
        $result_mesajlar = $mesajlar;
    }
    
    // Debug bilgileri
    $debug_info = [];
    if ($hasParentId) {
        $debug_info['raw_messages'] = $mesajlar;
        $debug_info['parent_messages'] = [];
        $debug_info['reply_messages'] = [];
        
        foreach ($mesajlar as $mesaj) {
            if ($mesaj['parent_id']) {
                $debug_info['reply_messages'][] = $mesaj;
            } else {
                $debug_info['parent_messages'][] = $mesaj;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'mesajlar' => $result_mesajlar,
        'has_parent_id' => $hasParentId,
        'total_messages' => count($mesajlar),
        'hierarchical_messages' => count($result_mesajlar),
        'debug' => $debug_info
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
