-- =====================================================================
-- Descuentos estructurados por producto y fotografía histórica.
-- Ejecutar una vez sobre una instalación existente.
-- =====================================================================
SET NAMES utf8mb4;

ALTER TABLE `products`
  ADD COLUMN `discount_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `price`,
  ADD COLUMN `discount_starts_at` DATETIME NULL AFTER `discount_percent`,
  ADD COLUMN `discount_ends_at` DATETIME NULL AFTER `discount_starts_at`;

ALTER TABLE `sale_items`
  ADD COLUMN `list_unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `sku`,
  ADD COLUMN `discount_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `list_unit_price`,
  ADD COLUMN `unit_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `discount_percent`;

UPDATE `sale_items`
   SET `list_unit_price` = `unit_price`
 WHERE `list_unit_price` = 0.00;

ALTER TABLE `reservation_items`
  ADD COLUMN `list_unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `title`,
  ADD COLUMN `discount_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `list_unit_price`,
  ADD COLUMN `unit_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `discount_percent`;

UPDATE `reservation_items`
   SET `list_unit_price` = `unit_price`
 WHERE `list_unit_price` = 0.00;

-- ROLLBACK MANUAL (en orden inverso):
-- ALTER TABLE reservation_items DROP COLUMN unit_discount, DROP COLUMN discount_percent, DROP COLUMN list_unit_price;
-- ALTER TABLE sale_items DROP COLUMN unit_discount, DROP COLUMN discount_percent, DROP COLUMN list_unit_price;
-- ALTER TABLE products DROP COLUMN discount_ends_at, DROP COLUMN discount_starts_at, DROP COLUMN discount_percent;
