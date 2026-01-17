<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
ini_set('display_errors', 0); ini_set('log_errors', 1); error_reporting(E_ALL);
set_error_handler(function($errno,$errstr,$errfile,$errline){http_response_code(500);echo json_encode(['success'=>false,'error'=>'PHP Error','message'=>$errstr]);exit;});
set_exception_handler(function($e){http_response_code(500);echo json_encode(['success'=>false,'error'=>'Exception','message'=>$e->getMessage()]);exit;});
$raw=file_get_contents('php://input'); $data=json_decode($raw,true);
$order_id = intval($data['order_id'] ?? 0);
$seller_id = intval($data['seller_id'] ?? 0);
if(!$order_id || !$seller_id){http_response_code(400);echo json_encode(['success'=>false,'message'=>'order_id ve seller_id gerekli']);exit;}
$host='localhost';$db='elep_gamedev';$user='elep_metinogulcank';$pass='06ogulcan06';$charset='utf8mb4';
$dsn="mysql:host=$host;dbname=$db;charset=$charset";$opt=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false];
try{$pdo=new PDO($dsn,$user,$pass,$opt);}catch(\PDOException $e){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Veritabanı bağlantı hatası']);exit;}
// Tablo yoksa
$pdo->exec("CREATE TABLE IF NOT EXISTS buy_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(buyer_id), INDEX(item_name), INDEX(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
// Sipariş detay
$stmt=$pdo->prepare('SELECT * FROM buy_orders WHERE id=? FOR UPDATE'); $stmt->execute([$order_id]); $bo=$stmt->fetch();
if(!$bo){http_response_code(404);echo json_encode(['success'=>false,'message'=>'Sipariş bulunamadı']);exit;}
if($bo['status']!=='active'){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Sipariş aktif değil']);exit;}
$buyer_id=intval($bo['buyer_id']); $item_name=$bo['item_name']; $price=floatval($bo['price']);
if($buyer_id===$seller_id){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Kendi siparişinizi tamamlayamazsınız']);exit;}
// Satıcının trade_url ve envanter kontrolü
$stmt=$pdo->prepare('SELECT id,balance,provision_balance,trade_url FROM user WHERE id=? FOR UPDATE'); $stmt->execute([$seller_id]); $seller=$stmt->fetch();
if(!$seller){http_response_code(404);echo json_encode(['success'=>false,'message'=>'Satıcı bulunamadı']);exit;}
$trade_url=$seller['trade_url']??''; if(!$trade_url){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Satıcı trade URL eklememiş']);exit;}
// steamid64
function steamid64_from_trade($url){$parts=parse_url($url);if(empty($parts['query']))return '';parse_str($parts['query'],$q);if(empty($q['partner']))return '';return (string)(76561197960265728 + (int)$q['partner']);}
$sid64=steamid64_from_trade($trade_url); if(!$sid64){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Geçersiz trade URL']);exit;}
// Envanter kontrol
$invUrl = 'https://elephunt.com/api/steam_inventory_proxy.php?steamid='.$sid64;
$invRaw = @file_get_contents($invUrl);
$inv = $invRaw ? json_decode($invRaw,true) : null;
$hasItem=false;
if($inv && !empty($inv['items'])){foreach($inv['items'] as $it){if(isset($it['name']) && $it['name']===$item_name){$hasItem=true;break;}}}
if(!$hasItem){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Satıcının envanterinde bu skin yok']);exit;}
// Alıcı bakiyesi
$stmt=$pdo->prepare('SELECT id,balance FROM user WHERE id=? FOR UPDATE'); $stmt->execute([$buyer_id]); $buyer=$stmt->fetch(); if(!$buyer){http_response_code(404);echo json_encode(['success'=>false,'message'=>'Alıcı bulunamadı']);exit;}
if(floatval($buyer['balance']) < $price){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Alıcının bakiyesi yetersiz']);exit;}
// İşlem
try{
  $pdo->beginTransaction();
  // Alıcıdan düş
  $stmt=$pdo->prepare('UPDATE user SET balance = balance - ? WHERE id=?'); $stmt->execute([$price,$buyer_id]);
  // Komisyon ve provizyon
  $commission_rate=0.075; $commission=round($price*$commission_rate,2); $provision_amount=round($price-$commission,2);
  // Satıcıya provizyon
  $stmt=$pdo->prepare('UPDATE user SET provision_balance = COALESCE(provision_balance,0) + ? WHERE id=?'); $stmt->execute([$provision_amount,$seller_id]);
  // orders’a kayıt (ilan_id=0)
  $stmt=$pdo->prepare('INSERT INTO orders (buyer_id,seller_id,ilan_id,price,commission,status) VALUES (?,?,?,?,?,?)');
  $stmt->execute([$buyer_id,$seller_id,0,$price,$commission,'paid']); $orderRowId=$pdo->lastInsertId();
  // provisions
  $release_at = date('Y-m-d H:i:s', time()+15);
  $stmt=$pdo->prepare('INSERT INTO provisions (order_id,seller_id,amount,release_at,released) VALUES (?,?,?,?,0)');
  $stmt->execute([$orderRowId,$seller_id,$provision_amount,$release_at]);
  // buy order kapat
  $stmt=$pdo->prepare('UPDATE buy_orders SET status=? WHERE id=?'); $stmt->execute(['fulfilled',$order_id]);
  $pdo->commit();
  echo json_encode(['success'=>true,'message'=>'Sipariş tamamlandı','order_id'=>$orderRowId,'commission'=>$commission,'provision_amount'=>$provision_amount]);
}catch(Exception $e){
  if($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}

