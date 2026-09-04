-- =====================================================================
--  Migración: horario de atención por sucursal + caja inicial
-- =====================================================================
--  · Añade la columna `branches.hours` (antes se "inventaba" en el
--    front, en js/catalog.js).  Ahora el Administrador la edita desde
--    el panel y la tienda pública la muestra tal cual.
--  · Garantiza que TODA sucursal tenga al menos una "Caja 1".
--  Idempotente: se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- --- 1) Columna `hours` -----------------------------------------------
SET @has_hours := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'branches'
     AND COLUMN_NAME  = 'hours'
);
SET @sql := IF(@has_hours = 0,
  'ALTER TABLE `branches` ADD COLUMN `hours` VARCHAR(120) NOT NULL DEFAULT '''' AFTER `phone`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Horario por defecto para las sedes que aún no lo tengan.
UPDATE `branches`
   SET `hours` = 'Lun–Dom 11:00–21:00'
 WHERE `hours` IS NULL OR `hours` = '';

-- --- 2) Caja inicial "Caja 1" para sucursales sin cajas --------------
INSERT INTO `registers` (`branch_id`, `name`, `status`)
SELECT b.`id`, 'Caja 1', 'active'
  FROM `branches` b
 WHERE NOT EXISTS (
   SELECT 1 FROM `registers` r WHERE r.`branch_id` = b.`id`
 );
