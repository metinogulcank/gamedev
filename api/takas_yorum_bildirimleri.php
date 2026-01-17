<?php
// CORS headers (robust)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Preflight response
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'elep_gamedev';
    $user = 'elep_metinogulcank';
    $pass = '06ogulcan06';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Read input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        // Fallback to query string
        $input = $_GET;
    }

    $seller_user_id = $input['user_id'] ?? null;
    $limit = isset($input['limit']) ? intval($input['limit']) : 50;

    if (!$seller_user_id) {
        throw new Exception('user_id gerekli');
    }

    // Fetch latest messages for all takas ads of this seller, excluding seller's own messages
    $sql = "
        SELECT 
            tm.id as mesaj_id,
            tm.takas_ilan_id,
            tm.gonderen_user_id,
            u.fullname as gonderen_username,
            tm.mesaj,
            tm.created_at,
            ti.item_name,
            ti.user_id as ilan_sahibi_id
        FROM takas_mesajlari tm
        INNER JOIN takas_ilanlari ti ON tm.takas_ilan_id = ti.id
        LEFT JOIN user u ON tm.gonderen_user_id = u.id
        WHERE ti.user_id = :seller_user_id
          AND tm.gonderen_user_id <> :seller_user_id
        ORDER BY tm.created_at DESC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':seller_user_id', (int)$seller_user_id, PDO::PARAM_INT);
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => array_map(function($r) {
            return [
                'type' => 'takas_comment',
                'takas_ilan_id' => (int)$r['takas_ilan_id'],
                'mesaj_id' => (int)$r['mesaj_id'],
                'from_user_id' => (int)$r['gonderen_user_id'],
                'from_username' => $r['gonderen_username'] ?? 'Bilinmeyen',
                'item_name' => $r['item_name'],
                'message' => $r['mesaj'],
                'created_at' => $r['created_at'],
            ];
        }, $rows),
        'count' => count($rows)
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


