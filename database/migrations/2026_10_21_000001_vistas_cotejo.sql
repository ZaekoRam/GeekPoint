-- =====================================================================
--  GeekPoint — Vistas de inventario sin choque de cotejos (collations)
-- =====================================================================
--  Síntoma (Hostinger, MariaDB 11.8, 21/10/2026):
--    #1267 Illegal mix of collations (utf8mb4_uca1400_ai_ci,COERCIBLE)
--          and (utf8mb4_unicode_ci,COERCIBLE) for operation '<>' / '='
--  -> el POS y el inventario daban "Error interno del servidor" y la
--     tienda caía al catálogo de respaldo.
--
--  Causa: la vista se creó con la conexión en el cotejo por defecto de
--  MariaDB 11.8 (uca1400). Sus textos fijos ('active' / 'inactive') se
--  guardaron con ESE cotejo, y al compararlos con los textos del PHP
--  (unicode_ci) MariaDB no sabe cuál usar.
--
--  Arreglo:
--    * `status` sale de las columnas ENUM (cotejo de la tabla, que manda
--      sobre cualquier texto de la consulta) en vez de textos fijos.
--      Mismo resultado: 'active' solo si producto E inventario lo están.
--    * Se crean con la conexión en utf8mb4_unicode_ci (el de las tablas).
--    * SQL SECURITY INVOKER, como estaban en producción.
--
--  Solo reemplaza las 2 vistas: NO toca ninguna tabla ni dato. Se puede
--  correr las veces que sea.
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE OR REPLACE SQL SECURITY INVOKER VIEW `v_inventory` AS
SELECT
  i.`id`                  AS id,
  i.`branch_id`           AS branch_id,
  p.`id`                  AS product_id,
  p.`sku`                 AS sku,
  p.`name`                AS name,
  p.`category_id`         AS category_id,
  p.`description`         AS description,
  COALESCE((SELECT GROUP_CONCAT(t.`slug` ORDER BY t.`slug` SEPARATOR ',')
              FROM `product_tags` pt JOIN `tags` t ON t.`id` = pt.`tag_id`
             WHERE pt.`product_id` = p.`id`), '') AS tags,
  p.`price`               AS price,
  p.`discount_percent`    AS discount_percent,
  p.`discount_starts_at`  AS discount_starts_at,
  p.`discount_ends_at`    AS discount_ends_at,
  p.`tax_rate`            AS tax_rate,
  i.`stock`               AS stock,
  i.`min_stock`           AS min_stock,
  COALESCE((SELECT GROUP_CONCAT(im.`url` ORDER BY im.`sort_order` SEPARATOR ',')
              FROM `product_images` im
             WHERE im.`product_id` = p.`id`), '') AS image_url,
  p.`figure_png_url`      AS figure_png_url,
  -- producto inactivo -> 'inactive'; si no, manda el estado en la sucursal
  IF(p.`status` = 'active', i.`status`, p.`status`) AS status,
  i.`created_at`          AS created_at,
  GREATEST(i.`updated_at`, p.`updated_at`) AS updated_at
FROM `inventory` i
JOIN `products`  p ON p.`id` = i.`product_id`;

CREATE OR REPLACE SQL SECURITY INVOKER VIEW `v_consolidated_inventory` AS
SELECT
  p.`id`                               AS product_id,
  p.`sku`                              AS sku,
  p.`name`                             AS product_name,
  c.`slug`                             AS category_slug,
  COUNT(i.`id`)                        AS branches_count,
  COALESCE(SUM(i.`stock`), 0)          AS total_stock,
  SUM(CASE WHEN i.`stock` <= i.`min_stock` THEN 1 ELSE 0 END) AS branches_low_stock,
  p.`price`                            AS price
FROM `products` p
LEFT JOIN `categories` c ON c.`id` = p.`category_id`
LEFT JOIN `inventory`  i ON i.`product_id` = p.`id` AND i.`status` = 'active'
WHERE p.`status` = 'active'
GROUP BY p.`id`, p.`sku`, p.`name`, c.`slug`, p.`price`;

SELECT COUNT(*) AS filas_v_inventory,
       SUM(status = 'active') AS activas
  FROM `v_inventory`;
