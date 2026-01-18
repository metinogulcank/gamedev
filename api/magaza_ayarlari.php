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

// GET isteği: Mağaza bilgilerini getir
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id parametresi gerekli.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare('SELECT * FROM magaza WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $magaza = $stmt->fetch();
        
        if ($magaza) {
            echo json_encode([
                'success' => true,
                'data' => $magaza
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'data' => null,
                'message' => 'Mağaza bilgisi bulunamadı.'
            ]);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
    exit;
}

// POST isteği: Mağaza bilgilerini kaydet/güncelle
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // FormData veya JSON ile veri al
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $data = [];
    
    // FormData gönderildiğinde (multipart/form-data)
    if (stripos($contentType, 'multipart/form-data') !== false || !empty($_POST) || !empty($_FILES)) {
        $data = $_POST;
    } elseif (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
    } else {
        $data = $_POST;
    }
    
    $user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
    $magaza_adi = trim($data['magaza_adi'] ?? '');
    $magaza_aciklama = trim($data['magaza_aciklama'] ?? '');
    $magaza_url = trim($data['magaza_url'] ?? '');
    
    // Logo dosyası kontrolü
    $magaza_logo = null;
    $logoUploaded = false;
    
    if (isset($_FILES['magaza_logo']) && $_FILES['magaza_logo']['error'] === UPLOAD_ERR_OK) {
        // Farklı olası yolları dene
        // 1. API klasöründen public klasörüne (varsayılan)
        $uploadDir1 = __DIR__ . '/../public/images/magaza_logo/';
        // 2. API klasöründen direkt images klasörüne (eğer public web root ise)
        $uploadDir2 = __DIR__ . '/../images/magaza_logo/';
        // 3. Document root'tan images klasörüne
        $uploadDir3 = $_SERVER['DOCUMENT_ROOT'] . '/images/magaza_logo/';
        
        // Hangi yolun var olduğunu veya oluşturulabilir olduğunu kontrol et
        $uploadDir = null;
        $basePath = '';
        
        // Önce document root'u kontrol et
        if (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT']) {
            $testPath = $_SERVER['DOCUMENT_ROOT'] . '/images/';
            if (file_exists($testPath) || is_writable(dirname($testPath))) {
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/images/magaza_logo/';
                $basePath = 'images/magaza_logo/';
            }
        }
        
        // Eğer document root çalışmadıysa, diğer yolları dene
        if (!$uploadDir) {
            if (file_exists(dirname($uploadDir1)) || is_writable(dirname($uploadDir1))) {
                $uploadDir = $uploadDir1;
                $basePath = 'images/magaza_logo/';
            } elseif (file_exists(dirname($uploadDir2)) || is_writable(dirname($uploadDir2))) {
                $uploadDir = $uploadDir2;
                $basePath = 'images/magaza_logo/';
            } else {
                // Son çare olarak ilk yolu kullan
                $uploadDir = $uploadDir1;
                $basePath = 'images/magaza_logo/';
            }
        }
        
        // Klasör yoksa oluştur
        if (!file_exists($uploadDir)) {
            $created = @mkdir($uploadDir, 0755, true);
            if (!$created) {
                http_response_code(500);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Klasör oluşturulamadı.',
                    'debug' => [
                        'upload_dir' => $uploadDir,
                        'dir_exists' => file_exists($uploadDir),
                        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
                        'api_dir' => __DIR__,
                        'tried_paths' => [$uploadDir1, $uploadDir2, $uploadDir3]
                    ]
                ]);
                exit;
            }
        }
        
        // Klasör yazılabilir mi kontrol et
        if (!is_writable($uploadDir)) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Klasör yazılabilir değil.',
                'debug' => ['upload_dir' => $uploadDir, 'is_writable' => is_writable($uploadDir)]
            ]);
            exit;
        }
        
        $file = $_FILES['magaza_logo'];
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        
        // Dosya tipi kontrolü
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Sadece JPG, PNG ve GIF formatları desteklenir.',
                'debug' => ['file_type' => $file['type']]
            ]);
            exit;
        }
        
        // Dosya boyutu kontrolü
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dosya boyutu 5MB\'dan küçük olmalıdır.']);
            exit;
        }
        
        // Dosya adını oluştur
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $fileName = 'magaza_' . $user_id . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . $fileName;
        
        // Geçici dosya var mı kontrol et
        if (!file_exists($file['tmp_name'])) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Geçici dosya bulunamadı.',
                'debug' => ['tmp_name' => $file['tmp_name'], 'file_exists' => file_exists($file['tmp_name'])]
            ]);
            exit;
        }
        
        // Dosyayı yükle
        $uploadResult = @move_uploaded_file($file['tmp_name'], $filePath);
        
        // Dosya yükleme sonrası kontrol
        $fileExists = file_exists($filePath);
        $fileSize = $fileExists ? filesize($filePath) : 0;
        
        if ($uploadResult && $fileExists && $fileSize > 0) {
            // Dosya başarıyla yüklendi ve var, şimdi veritabanına kaydet
            $magaza_logo = $basePath . $fileName;
            $logoUploaded = true;
            
            // Eğer eski logo varsa sil
            $stmt = $pdo->prepare('SELECT magaza_logo FROM magaza WHERE user_id = ?');
            $stmt->execute([$user_id]);
            $oldMagaza = $stmt->fetch();
            if ($oldMagaza && $oldMagaza['magaza_logo']) {
                // Eski logo için farklı yolları dene
                $oldLogoPaths = [
                    $_SERVER['DOCUMENT_ROOT'] . '/' . $oldMagaza['magaza_logo'],
                    __DIR__ . '/../public/' . $oldMagaza['magaza_logo'],
                    __DIR__ . '/../' . $oldMagaza['magaza_logo']
                ];
                
                foreach ($oldLogoPaths as $oldLogoPath) {
                    if (file_exists($oldLogoPath)) {
                        @unlink($oldLogoPath);
                        break;
                    }
                }
            }
        } else {
            // Dosya yükleme başarısız
            $errorMsg = 'Logo yüklenirken hata oluştu.';
            $lastError = error_get_last();
            if ($lastError) {
                $errorMsg .= ' Hata: ' . $lastError['message'];
            }
            
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => $errorMsg,
                'debug' => [
                    'upload_dir' => $uploadDir,
                    'file_path' => $filePath,
                    'file_exists' => $fileExists,
                    'file_size_after_upload' => $fileSize,
                    'original_file_size' => $file['size'],
                    'tmp_name' => $file['tmp_name'],
                    'tmp_exists' => file_exists($file['tmp_name']),
                    'is_writable' => is_writable($uploadDir),
                    'upload_result' => $uploadResult,
                    'file_type' => $file['type'],
                    'base_path' => $basePath,
                    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
                    'api_dir' => __DIR__
                ]
            ]);
            exit;
        }
    } else {
        // Logo yüklenmediyse, mevcut logoyu koru
        $stmt = $pdo->prepare('SELECT magaza_logo FROM magaza WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $existingMagaza = $stmt->fetch();
        if ($existingMagaza && $existingMagaza['magaza_logo']) {
            $magaza_logo = $existingMagaza['magaza_logo'];
        }
    }
    
    // Validasyon
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id gerekli.']);
        exit;
    }
    
    if (!$magaza_adi) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mağaza adı gerekli.']);
        exit;
    }
    
    // Açıklama uzunluk kontrolü (max 250 karakter)
    if (strlen($magaza_aciklama) > 250) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mağaza açıklaması en fazla 250 karakter olabilir.']);
        exit;
    }
    
    try {
        // Kullanıcının mağazası var mı kontrol et
        $stmt = $pdo->prepare('SELECT id FROM magaza WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $existingMagaza = $stmt->fetch();
        
        if ($existingMagaza) {
            // Güncelle
            if ($logoUploaded || $magaza_logo !== null) {
                // Logo yüklendiyse veya mevcut logo varsa güncelle
                $stmt = $pdo->prepare('UPDATE magaza SET magaza_adi = ?, magaza_aciklama = ?, magaza_url = ?, magaza_logo = ? WHERE user_id = ?');
                $success = $stmt->execute([$magaza_adi, $magaza_aciklama, $magaza_url, $magaza_logo ?: '', $user_id]);
            } else {
                // Logo değişmediyse sadece diğer alanları güncelle
                $stmt = $pdo->prepare('UPDATE magaza SET magaza_adi = ?, magaza_aciklama = ?, magaza_url = ? WHERE user_id = ?');
                $success = $stmt->execute([$magaza_adi, $magaza_aciklama, $magaza_url, $user_id]);
            }
        } else {
            // Yeni kayıt
            $stmt = $pdo->prepare('INSERT INTO magaza (user_id, magaza_adi, magaza_aciklama, magaza_url, magaza_logo) VALUES (?, ?, ?, ?, ?)');
            $success = $stmt->execute([$user_id, $magaza_adi, $magaza_aciklama, $magaza_url, $magaza_logo ?: '']);
        }
        
        if ($success) {
            // Güncellenmiş kaydı getir
            $stmt = $pdo->prepare('SELECT * FROM magaza WHERE user_id = ?');
            $stmt->execute([$user_id]);
            $magaza = $stmt->fetch();
            
            // Logo dosyasının gerçekten var olup olmadığını kontrol et
            $logoExists = false;
            $logoFullPath = '';
            $logoCheckedPaths = [];
            if ($magaza && $magaza['magaza_logo']) {
                // Farklı yolları kontrol et
                $checkPaths = [
                    $_SERVER['DOCUMENT_ROOT'] . '/' . $magaza['magaza_logo'],
                    __DIR__ . '/../public/' . $magaza['magaza_logo'],
                    __DIR__ . '/../' . $magaza['magaza_logo']
                ];
                
                foreach ($checkPaths as $checkPath) {
                    $logoCheckedPaths[] = $checkPath;
                    if (file_exists($checkPath)) {
                        $logoFullPath = $checkPath;
                        $logoExists = true;
                        break;
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Mağaza bilgileri başarıyla kaydedildi!',
                'data' => $magaza,
                'debug' => [
                    'logo_path' => $magaza['magaza_logo'] ?? null,
                    'logo_exists' => $logoExists,
                    'logo_full_path' => $logoFullPath,
                    'checked_paths' => $logoCheckedPaths,
                    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
                    'api_dir' => __DIR__
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Kayıt sırasında hata oluştu.']);
        }
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $e->getMessage()]);
    }
}
?>

