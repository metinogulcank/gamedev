<?php
header('Content-Type: application/json');

// Veritabanı bağlantı bilgileri
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
    
    // Test kullanıcısı oluştur
    $testEmail = 'test@test.com';
    $testPassword = 'test123';
    $testFullname = 'Test User';
    
    // Kullanıcı var mı kontrol et
    $stmt = $pdo->prepare('SELECT id FROM user WHERE email = ?');
    $stmt->execute([$testEmail]);
    $existingUser = $stmt->fetch();
    
    if (!$existingUser) {
        // Test kullanıcısı oluştur
        $hashedPassword = password_hash($testPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO user (fullname, email, password) VALUES (?, ?, ?)');
        $stmt->execute([$testFullname, $testEmail, $hashedPassword]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Test kullanıcısı oluşturuldu',
            'email' => $testEmail,
            'password' => $testPassword
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Test kullanıcısı zaten mevcut',
            'email' => $testEmail,
            'password' => $testPassword
        ]);
    }
    
} catch (\PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı hatası: ' . $e->getMessage()
    ]);
}
?>
