-- =====================================================================
--  GeekPoint — Pagos por venta (pago mixto + referencias)
-- =====================================================================
--  * `sales.payment_method` acepta 'mixed' (efectivo + tarjeta, etc.).
--    Las ventas viejas no cambian.
--  * Nueva tabla `sale_payments`: un renglón por cada forma de pago de la
--    venta, con su monto y una referencia opcional (últimos 4 dígitos /
--    autorización de tarjeta, referencia de transferencia).
--
--  Solo AGREGA: no borra ni modifica datos. Se puede correr las veces que
--  sea. Correr ANTES de subir el SaleController.php nuevo.
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sales`
  MODIFY `payment_method` ENUM('cash','card','transfer','mixed') NOT NULL DEFAULT 'cash';

CREATE TABLE IF NOT EXISTS `sale_payments` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_id`    BIGINT UNSIGNED NOT NULL,
  `method`     ENUM('cash','card','transfer') NOT NULL,
  `amount`     DECIMAL(12,2) NOT NULL,
  `reference`  VARCHAR(80) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_sale_payments_sale` (`sale_id`),
  CONSTRAINT `fk_sale_payments_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `schema_migrations` (`version`) VALUES ('2026_10_26_000001');
