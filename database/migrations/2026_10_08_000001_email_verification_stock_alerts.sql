-- =====================================================================
-- GeekPoint — Verificación de correo + avisos de "Notifícame"
-- 2026-10-08
--
-- 1) users: verificación de correo con enlace (token guardado como hash).
--    El personal existente (admin/gerente/cajero) queda verificado; los
--    clientes existentes deberán verificar su correo desde "Mi cuenta".
-- 2) stock_alerts: suscripciones "avísame cuando haya stock" por SKU.
--    Invitados confirman con un enlace (doble opt-in) antes de activarse;
--    clientes con sesión quedan activos de inmediato.
--
-- Se puede ejecutar más de una vez (IF NOT EXISTS).
-- =====================================================================

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `email_verified_at`   DATETIME NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `email_token_hash`    CHAR(64) NULL AFTER `email_verified_at`,
  ADD COLUMN IF NOT EXISTS `email_token_sent_at` DATETIME NULL AFTER `email_token_hash`;

UPDATE `users`
   SET `email_verified_at` = COALESCE(`email_verified_at`, NOW())
 WHERE `role` IN ('admin', 'manager', 'cashier');

CREATE TABLE IF NOT EXISTS `stock_alerts` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku`          VARCHAR(60)  NOT NULL,
  `title`        VARCHAR(200) NOT NULL DEFAULT '',
  `email`        VARCHAR(160) NOT NULL,
  `user_id`      INT UNSIGNED NULL,
  `status`       ENUM('pending','active','notified','cancelled') NOT NULL DEFAULT 'pending',
  `token_hash`   CHAR(64)     NOT NULL,
  `ip`           VARCHAR(45)  NOT NULL DEFAULT '',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME     NULL,
  `notified_at`  DATETIME     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_alert_sku_email` (`sku`, `email`),
  KEY `ix_alert_sku_status` (`sku`, `status`),
  KEY `ix_alert_token` (`token_hash`),
  CONSTRAINT `fk_alert_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
