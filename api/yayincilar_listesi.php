<?php
// CORS izinleri
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// GET isteği: Onaylanmış yayıncıları listele
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare('
            SELECT 
                yb.*,
                u.id as user_id,
                u.fullname,
                u.email,
                COALESCE(SUM(ybagis.tutar), 0) as toplam_bagis
            FROM yayinci_basvuru yb
            INNER JOIN user u ON yb.user_id = u.id
            LEFT JOIN yayinci_bagis ybagis ON yb.user_id = ybagis.yayinci_user_id
            WHERE yb.durum = "onaylandi"
            GROUP BY yb.id
            ORDER BY toplam_bagis DESC, yb.created_at DESC
            LIMIT 10
        ');
        $stmt->execute();
        $yayincilar = $stmt->fetchAll();
        
        // Eğer yayıncı yoksa test verileri ekle
        if (empty($yayincilar)) {
            // Test kullanıcıları oluştur (eğer yoksa)
            $testUsers = [
                ['fullname' => 'Twitch Yayıncı 1', 'email' => 'yayinci1@test.com'],
                ['fullname' => 'Twitch Yayıncı 2', 'email' => 'yayinci2@test.com'],
                ['fullname' => 'Twitch Yayıncı 3', 'email' => 'yayinci3@test.com'],
                ['fullname' => 'Twitch Yayıncı 4', 'email' => 'yayinci4@test.com'],
                ['fullname' => 'Twitch Yayıncı 5', 'email' => 'yayinci5@test.com'],
                ['fullname' => 'Twitch Yayıncı 6', 'email' => 'yayinci6@test.com'],
                ['fullname' => 'Twitch Yayıncı 7', 'email' => 'yayinci7@test.com'],
                ['fullname' => 'Twitch Yayıncı 8', 'email' => 'yayinci8@test.com'],
                ['fullname' => 'Twitch Yayıncı 9', 'email' => 'yayinci9@test.com'],
                ['fullname' => 'Twitch Yayıncı 10', 'email' => 'yayinci10@test.com'],
            ];
            
            foreach ($testUsers as $index => $testUser) {
                // Kullanıcı var mı kontrol et
                $checkUser = $pdo->prepare('SELECT id FROM user WHERE email = ?');
                $checkUser->execute([$testUser['email']]);
                $existingUser = $checkUser->fetch();
                
                if (!$existingUser) {
                    // Kullanıcı oluştur
                    $insertUser = $pdo->prepare('INSERT INTO user (fullname, email, password) VALUES (?, ?, ?)');
                    $insertUser->execute([$testUser['fullname'], $testUser['email'], password_hash('test123', PASSWORD_DEFAULT)]);
                    $userId = $pdo->lastInsertId();
                } else {
                    $userId = $existingUser['id'];
                }
                
                // Başvuru var mı kontrol et
                $checkBasvuru = $pdo->prepare('SELECT id FROM yayinci_basvuru WHERE user_id = ?');
                $checkBasvuru->execute([$userId]);
                $existingBasvuru = $checkBasvuru->fetch();
                
                if (!$existingBasvuru) {
                    // Başvuru oluştur
                    $insertBasvuru = $pdo->prepare('
                        INSERT INTO yayinci_basvuru 
                        (user_id, yayin_linki, sayfa_basligi, destek_adresi, min_bagis_tutari, durum) 
                        VALUES (?, ?, ?, ?, ?, "onaylandi")
                    ');
                    $insertBasvuru->execute([
                        $userId,
                        'https://twitch.tv/yayinci' . ($index + 1),
                        $testUser['fullname'],
                        'yayinci' . ($index + 1),
                        10
                    ]);
                }
            }
            
            // Tekrar yayıncıları getir
            $stmt->execute();
            $yayincilar = $stmt->fetchAll();
        }
        
        echo json_encode([
            'success' => true,
            'data' => $yayincilar
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
}
?>

