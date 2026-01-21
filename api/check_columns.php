<?php
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
    $stmt = $pdo->query("SHOW COLUMNS FROM ilanlar");
    $columns = $stmt->fetchAll();
    echo "Columns in ilanlar table:\n";
    foreach ($columns as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
