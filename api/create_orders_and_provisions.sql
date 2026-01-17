-- Siparişler tablosu
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `buyer_id` INT NOT NULL,
  `seller_id` INT NOT NULL,
  `ilan_id` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `commission` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'paid',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`buyer_id`),
  INDEX (`seller_id`),
  INDEX (`ilan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Provizyon hareketleri
CREATE TABLE IF NOT EXISTS `provisions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `seller_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `release_at` DATETIME NOT NULL,
  `released` TINYINT(1) NOT NULL DEFAULT 0,
  `released_at` DATETIME NULL,
  INDEX (`order_id`),
  INDEX (`seller_id`),
  INDEX (`release_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Kullanıcı tablosuna provizyon bakiyesi
ALTER TABLE `user`
  ADD COLUMN `provision_balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- İlanlar tablosuna durum sütunu
ALTER TABLE `ilanlar`
  ADD COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'active';

