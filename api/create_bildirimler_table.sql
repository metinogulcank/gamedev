-- Bildirimler tablosunu oluştur
CREATE TABLE IF NOT EXISTS `bildirimler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bildirim_text` text NOT NULL,
  `is_okundu` tinyint(1) NOT NULL DEFAULT 0,
  `takas_ilan_id` int(11) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_okundu` (`is_okundu`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_takas_ilan_id` (`takas_ilan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
