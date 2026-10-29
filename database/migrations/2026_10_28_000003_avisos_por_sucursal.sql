-- =====================================================================
--  GeekPoint — "Notifícame" por sucursal
-- =====================================================================
--  stock_alerts.branch_id:
--    0  = cualquier sucursal (como funcionaba antes; los avisos existentes
--         quedan así)
--    >0 = solo avisar cuando llegue stock a ESA sucursal
--  Se usa 0 y no NULL porque el índice único (sku, email, branch_id) no
--  trata los NULL como iguales y permitiría avisos duplicados.
--
--  Solo agrega la columna y cambia el índice único. Se puede correr las
--  veces que sea. Correr ANTES de subir StockAlerts.php.
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `stock_alerts`
  ADD COLUMN IF NOT EXISTS `branch_id` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `sku`;

ALTER TABLE `stock_alerts` DROP INDEX IF EXISTS `uq_alert_sku_email`;
ALTER TABLE `stock_alerts` DROP INDEX IF EXISTS `uq_alert_sku_email_branch`;
ALTER TABLE `stock_alerts` ADD UNIQUE KEY `uq_alert_sku_email_branch` (`sku`, `email`, `branch_id`);

INSERT IGNORE INTO `schema_migrations` (`version`) VALUES ('2026_10_28_000003');
