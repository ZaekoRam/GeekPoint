-- =====================================================================
--  Migración: etiquetas por producto (`products.tags`)
-- =====================================================================
--  Lista de etiquetas separadas por coma que se muestran en la tarjeta
--  de la tienda:  novedad, preventa  (o las que se agreguen).
--  Idempotente.
-- =====================================================================

SET @has_tags := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'products'
     AND COLUMN_NAME  = 'tags'
);
SET @sql := IF(@has_tags = 0,
  'ALTER TABLE `products` ADD COLUMN `tags` VARCHAR(120) NOT NULL DEFAULT '''' AFTER `description`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
