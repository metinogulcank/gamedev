<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

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
    echo "Connected to DB\n";

    // 1. Modify ilan_id to be NULLable
    try {
        $pdo->exec("ALTER TABLE favoriler MODIFY ilan_id int(11) NULL");
        echo "ilan_id modified to NULLable\n";
    } catch (Exception $e) {
        echo "ilan_id modify error (might already be nullable): " . $e->getMessage() . "\n";
    }

    // 2. Add item_name column
    try {
        $pdo->exec("ALTER TABLE favoriler ADD COLUMN item_name VARCHAR(255) NULL AFTER ilan_id");
        echo "item_name column added\n";
    } catch (Exception $e) {
        echo "item_name add error (might exist): " . $e->getMessage() . "\n";
    }

    // 3. Add image column
    try {
        $pdo->exec("ALTER TABLE favoriler ADD COLUMN image VARCHAR(255) NULL AFTER item_name");
        echo "image column added\n";
    } catch (Exception $e) {
        echo "image add error (might exist): " . $e->getMessage() . "\n";
    }

    // 4. Drop old unique index
    try {
        $pdo->exec("ALTER TABLE favoriler DROP INDEX unique_favorite");
        echo "Old unique index dropped\n";
    } catch (Exception $e) {
        echo "Drop index error (might not exist): " . $e->getMessage() . "\n";
    }

    // 5. Add new unique index for ilan_id (ignoring NULLs automatically in MySQL for unique constraints)
    // Actually, MySQL allows multiple NULLs in UNIQUE index. So (user_id, ilan_id) unique is fine.
    try {
        $pdo->exec("ALTER TABLE favoriler ADD UNIQUE KEY unique_fav_ilan (user_id, ilan_id)");
        echo "Unique key for ilan added\n";
    } catch (Exception $e) {
        echo "Unique key for ilan add error: " . $e->getMessage() . "\n";
    }

    // 6. Add unique index for item_name
    try {
        $pdo->exec("ALTER TABLE favoriler ADD UNIQUE KEY unique_fav_skin (user_id, item_name)");
        echo "Unique key for skin added\n";
    } catch (Exception $e) {
        echo "Unique key for skin add error: " . $e->getMessage() . "\n";
    }

} catch (\PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
