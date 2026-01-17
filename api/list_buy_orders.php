<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
ini_set('display_errors', 0); ini_set('log_errors', 1); error_reporting(E_ALL);
set_error_handler(function($errno,$errstr,$errfile,$errline){http_response_code(500);echo json_encode(['success'=>false,'error'=>'PHP Error','message'=>$errstr]);exit;});
set_exception_handler(function($e){http_response_code(500);echo json_encode(['success'=>false,'error'=>'Exception','message'=>$e->getMessage()]);exit;});
$item_name = isset($_GET['item_name']) ? trim($_GET['item_name']) : '';
if(!$item_name){http_response_code(400);echo json_encode(['success'=>false,'message'=>'item_name gerekli']);exit;}
$host='localhost';$db='elep_gamedev';$user='elep_metinogulcank';$pass='06ogulcan06';$charset='utf8mb4';
$dsn="mysql:host=$host;dbname=$db;charset=$charset";$opt=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false];
try{$pdo=new PDO($dsn,$user,$pass,$opt);}catch(\PDOException $e){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Veritabanı bağlantı hatası']);exit;}
// Tablo yoksa oluştur
$pdo->exec("CREATE TABLE IF NOT EXISTS buy_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(buyer_id), INDEX(item_name), INDEX(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$stmt=$pdo->prepare('SELECT id,buyer_id,item_name,price,status,created_at FROM buy_orders WHERE item_name=? AND status=? ORDER BY price DESC, created_at DESC');
$stmt->execute([$item_name,'active']);
$rows=$stmt->fetchAll();
echo json_encode(['success'=>true,'orders'=>$rows]);
