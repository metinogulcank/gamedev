CREATE TABLE IF NOT EXISTS `yayinci_bagis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `yayinci_user_id` int(11) NOT NULL,
  `bagisci_user_id` int(11) NOT NULL,
  `bagisci_adi` varchar(255) NOT NULL,
  `tutar` decimal(10,2) NOT NULL,
  `mesaj` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_yayinci_user_id` (`yayinci_user_id`),
  KEY `idx_bagisci_user_id` (`bagisci_user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

