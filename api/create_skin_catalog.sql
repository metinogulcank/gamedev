CREATE TABLE IF NOT EXISTS `skin_catalog` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(255) NOT NULL UNIQUE,
  `image` VARCHAR(255) NULL,
  `total_sales_count` INT NOT NULL DEFAULT 0,
  `last_sale_price` DECIMAL(10,2) NULL,
  `average_sale_price` DECIMAL(10,2) NULL,
  `first_seen_at` DATETIME NULL,
  `last_seen_at` DATETIME NULL,
  INDEX (`item_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

