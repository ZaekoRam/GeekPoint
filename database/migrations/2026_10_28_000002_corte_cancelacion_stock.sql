-- =====================================================================
--  GeekPoint — Corte de caja, cancelación de ventas y stock bajo en 5
-- =====================================================================
--  * sales: quién canceló, cuándo y por qué (status 'void' ya existía).
--  * cash_cuts: un renglón por corte de caja (por caja o por sucursal).
--  * Stock bajo: el aviso sale cuando en UNA sucursal quedan 5 o menos
--    (inventory.min_stock es por sucursal). Sube a 5 los mínimos menores;
--    los que alguien puso más altos se respetan.
--
--  Solo AGREGA columnas/tabla y sube mínimos. Se puede correr las veces que
--  sea. Correr ANTES de subir los PHP nuevos (SaleController, CashCutController).
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sales`
  ADD COLUMN IF NOT EXISTS `void_reason` VARCHAR(200) NOT NULL DEFAULT '' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `voided_by`   INT UNSIGNED NULL AFTER `void_reason`,
  ADD COLUMN IF NOT EXISTS `voided_at`   DATETIME NULL AFTER `voided_by`;

CREATE TABLE IF NOT EXISTS `cash_cuts` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`      INT UNSIGNED NOT NULL,
  `register_id`    INT UNSIGNED NULL,
  `user_id`        INT UNSIGNED NOT NULL,               -- quién hizo el corte
  `from_at`        DATETIME NOT NULL,                   -- inicio del turno
  `to_at`          DATETIME NOT NULL,                   -- momento del corte
  `sales_count`    INT UNSIGNED NOT NULL DEFAULT 0,
  `void_count`     INT UNSIGNED NOT NULL DEFAULT 0,
  `total_sales`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cash_total`     DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- efectivo cobrado (ya sin cambio)
  `card_total`     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `transfer_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `opening_cash`   DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- fondo de caja
  `cash_counted`   DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- lo que se contó
  `difference`     DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- contado - (fondo + efectivo)
  `notes`          VARCHAR(300) NOT NULL DEFAULT '',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_cash_cuts_branch` (`branch_id`, `to_at`),
  KEY `ix_cash_cuts_register` (`register_id`, `to_at`),
  CONSTRAINT `fk_cash_cuts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cash_cuts_register` FOREIGN KEY (`register_id`) REFERENCES `registers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cash_cuts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE `inventory` SET `min_stock` = 5 WHERE `min_stock` < 5;
ALTER TABLE `inventory` ALTER COLUMN `min_stock` SET DEFAULT 5;

INSERT IGNORE INTO `schema_migrations` (`version`) VALUES ('2026_10_28_000002');
