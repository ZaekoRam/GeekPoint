-- =====================================================================
--  Migración 2026_10_19_000001 — Normalización del catálogo e inventario
--  Requiere: MariaDB 10.2+ (Hostinger) y la migración 2026_10_08_000001.
-- =====================================================================
--  ANTES: `products` guardaba una fila POR SUCURSAL con TODOS los datos
--  del producto repetidos (nombre, precio, imágenes...). 85 productos
--  ocupaban 224 filas y cambiar un precio exigía tocar cada copia.
--
--  DESPUÉS (3FN):
--    products        catálogo maestro, 1 fila por SKU
--    inventory       stock por sucursal (branch × product)
--    product_images  galería ordenada (antes: CSV en image_url)
--    tags / product_tags   etiquetas (antes: CSV en tags)
--    v_inventory     vista con la forma de la tabla vieja (lectura)
--
--  Los ids de `inventory` son los MISMOS ids de las filas viejas de
--  `products`, así que el frontend, los carritos y los tickets siguen
--  funcionando sin cambios.
--
--  Además: sale_items / stock_movements / reservation_items / stock_alerts
--  apuntan al producto maestro con llave foránea, CHECKs de integridad,
--  índices nuevos y nombres de FK corregidos.
--
--  La tabla vieja queda como `products_legacy` por seguridad; bórrala
--  cuando verifiques que todo está bien (ver final del archivo).
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
--  0) Respaldo de la tabla vieja (las FK existentes la siguen por nombre)
-- ---------------------------------------------------------------------
RENAME TABLE `products` TO `products_legacy`;
-- Los nombres de FK son únicos por base: se liberan para la tabla nueva.
ALTER TABLE `products_legacy`
  DROP FOREIGN KEY `fk_products_branch`,
  DROP FOREIGN KEY `fk_products_category`;

-- ---------------------------------------------------------------------
--  1) Catálogo maestro
-- ---------------------------------------------------------------------
CREATE TABLE `products` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku`                VARCHAR(40)  NOT NULL,
  `name`               VARCHAR(180) NOT NULL,
  `category_id`        INT UNSIGNED NULL,
  `description`        VARCHAR(500) NOT NULL DEFAULT '',
  `price`              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent`   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  `discount_starts_at` DATETIME NULL,
  `discount_ends_at`   DATETIME NULL,
  `tax_rate`           DECIMAL(4,3)  NOT NULL DEFAULT 0.160,
  `figure_png_url`     TEXT NULL,
  `status`             ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_sku` (`sku`),
  KEY `ix_products_category` (`category_id`),
  KEY `ix_products_name` (`name`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_products_price`    CHECK (`price` >= 0),
  CONSTRAINT `ck_products_discount` CHECK (`discount_percent` BETWEEN 0 AND 100),
  CONSTRAINT `ck_products_tax`      CHECK (`tax_rate` BETWEEN 0 AND 1),
  CONSTRAINT `ck_products_disc_window` CHECK (
    `discount_starts_at` IS NULL OR `discount_ends_at` IS NULL OR `discount_ends_at` >= `discount_starts_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Las copias por sucursal son idénticas en los datos compartidos; si
-- alguna difiere se conserva la de la fila más reciente.
INSERT INTO `products`
  (`sku`, `name`, `category_id`, `description`, `price`, `discount_percent`,
   `discount_starts_at`, `discount_ends_at`, `tax_rate`, `figure_png_url`,
   `status`, `created_at`, `updated_at`)
SELECT l.`sku`, l.`name`, l.`category_id`, l.`description`, GREATEST(l.`price`, 0),
       LEAST(GREATEST(l.`discount_percent`, 0), 100),
       l.`discount_starts_at`,
       IF(l.`discount_ends_at` < l.`discount_starts_at`, NULL, l.`discount_ends_at`),
       l.`tax_rate`, l.`figure_png_url`,
       IF(EXISTS (SELECT 1 FROM `products_legacy` a WHERE a.`sku` = l.`sku` AND a.`status` = 'active'),
          'active', 'inactive'),
       (SELECT MIN(a.`created_at`) FROM `products_legacy` a WHERE a.`sku` = l.`sku`),
       l.`updated_at`
  FROM `products_legacy` l
 WHERE l.`id` = (SELECT a.`id` FROM `products_legacy` a WHERE a.`sku` = l.`sku`
                  ORDER BY a.`updated_at` DESC, a.`id` DESC LIMIT 1);

-- ---------------------------------------------------------------------
--  2) Inventario por sucursal (conserva los ids viejos)
-- ---------------------------------------------------------------------
CREATE TABLE `inventory` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   INT UNSIGNED NOT NULL,
  `product_id`  INT UNSIGNED NOT NULL,
  `stock`       INT NOT NULL DEFAULT 0,
  `min_stock`   INT NOT NULL DEFAULT 3,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_branch_product` (`branch_id`, `product_id`),
  KEY `ix_inventory_product` (`product_id`),
  KEY `ix_inventory_lowstock` (`branch_id`, `stock`),
  KEY `ix_inventory_updated` (`updated_at`),
  CONSTRAINT `fk_inventory_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_inventory_stock`     CHECK (`stock` >= 0),
  CONSTRAINT `ck_inventory_min_stock` CHECK (`min_stock` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `inventory` (`id`, `branch_id`, `product_id`, `stock`, `min_stock`, `status`, `created_at`, `updated_at`)
SELECT l.`id`, l.`branch_id`, p.`id`, GREATEST(l.`stock`, 0), GREATEST(l.`min_stock`, 0),
       l.`status`, l.`created_at`, l.`updated_at`
  FROM `products_legacy` l
  JOIN `products` p ON p.`sku` = l.`sku`;

-- ---------------------------------------------------------------------
--  3) Galería de imágenes (antes: URLs separadas por coma)
-- ---------------------------------------------------------------------
CREATE TABLE `product_images` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  INT UNSIGNED NOT NULL,
  `url`         VARCHAR(1000) NOT NULL,
  `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_images_order` (`product_id`, `sort_order`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_images` (`product_id`, `url`, `sort_order`)
SELECT p.`id`,
       TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(l.`image_url`, ',', n.n), ',', -1)),
       n.n - 1
  FROM `products` p
  JOIN `products_legacy` l ON l.`id` = (SELECT a.`id` FROM `products_legacy` a WHERE a.`sku` = p.`sku`
                                         ORDER BY a.`updated_at` DESC, a.`id` DESC LIMIT 1)
  JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
        SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL
        SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) n
    ON n.n <= 1 + LENGTH(l.`image_url`) - LENGTH(REPLACE(l.`image_url`, ',', ''))
 WHERE l.`image_url` <> ''
   AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(l.`image_url`, ',', n.n), ',', -1)) <> '';

-- ---------------------------------------------------------------------
--  4) Etiquetas (antes: CSV en products.tags)
-- ---------------------------------------------------------------------
CREATE TABLE `tags` (
  `id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`  VARCHAR(24) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_tags` (
  `product_id`  INT UNSIGNED NOT NULL,
  `tag_id`      INT UNSIGNED NOT NULL,
  PRIMARY KEY (`product_id`, `tag_id`),
  KEY `ix_product_tags_tag` (`tag_id`),
  CONSTRAINT `fk_product_tags_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_tags_tag` FOREIGN KEY (`tag_id`)
    REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `tags` (`slug`)
SELECT DISTINCT LOWER(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(l.`tags`, ',', n.n), ',', -1)))
  FROM `products_legacy` l
  JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
    ON n.n <= 1 + LENGTH(l.`tags`) - LENGTH(REPLACE(l.`tags`, ',', ''))
 WHERE l.`tags` <> ''
   AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(l.`tags`, ',', n.n), ',', -1)) <> '';

INSERT IGNORE INTO `product_tags` (`product_id`, `tag_id`)
SELECT p.`id`, t.`id`
  FROM `products_legacy` l
  JOIN `products` p ON p.`sku` = l.`sku`
  JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
    ON n.n <= 1 + LENGTH(l.`tags`) - LENGTH(REPLACE(l.`tags`, ',', ''))
  JOIN `tags` t ON t.`slug` = LOWER(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(l.`tags`, ',', n.n), ',', -1)))
 WHERE l.`tags` <> '';

-- ---------------------------------------------------------------------
--  5) Ventas y movimientos -> producto maestro
--     (antes apuntaban a la fila por sucursal; la sucursal ya está en
--      sales.branch_id y stock_movements.branch_id)
-- ---------------------------------------------------------------------
ALTER TABLE `sale_items`      DROP FOREIGN KEY `fk_sale_items_product`;
ALTER TABLE `stock_movements` DROP FOREIGN KEY `fk_mov_product`;

UPDATE `sale_items` si
  LEFT JOIN `inventory` i ON i.`id` = si.`product_id`
   SET si.`product_id` = i.`product_id`
 WHERE si.`product_id` IS NOT NULL;

UPDATE `stock_movements` m
  LEFT JOIN `inventory` i ON i.`id` = m.`product_id`
   SET m.`product_id` = i.`product_id`
 WHERE m.`product_id` IS NOT NULL;

ALTER TABLE `sale_items`
  ADD CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ck_sale_items_qty`    CHECK (`quantity` > 0),
  ADD CONSTRAINT `ck_sale_items_prices` CHECK (`unit_price` >= 0 AND `list_unit_price` >= 0 AND `line_total` >= 0);

ALTER TABLE `stock_movements`
  ADD CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD KEY `ix_mov_type` (`type`);

-- ---------------------------------------------------------------------
--  6) Renglones de apartado -> producto maestro (antes solo texto)
-- ---------------------------------------------------------------------
ALTER TABLE `reservation_items`
  ADD COLUMN `product_id` INT UNSIGNED NULL AFTER `reservation_id`,
  ADD KEY `ix_resitems_product` (`product_id`),
  ADD CONSTRAINT `fk_resitems_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ck_resitems_qty` CHECK (`quantity` > 0);

UPDATE `reservation_items` ri
  JOIN `products` p ON p.`sku` = UPPER(REGEXP_REPLACE(ri.`product_ref`,
         '^local-(tcg|comics|manga|figuras|coleccionables|preventa)-', ''))
   SET ri.`product_id` = p.`id`
 WHERE ri.`product_ref` LIKE 'local-%';

-- Formato "product-<id de la fila por sucursal>"
UPDATE `reservation_items` ri
  JOIN `inventory` i ON i.`id` = CAST(SUBSTRING(ri.`product_ref`, 9) AS UNSIGNED)
   SET ri.`product_id` = i.`product_id`
 WHERE ri.`product_ref` REGEXP '^product-[0-9]+$';

-- ---------------------------------------------------------------------
--  7) Avisos "Notifícame" ligados al SKU real del catálogo
-- ---------------------------------------------------------------------
DELETE a FROM `stock_alerts` a
  LEFT JOIN `products` p ON p.`sku` = a.`sku`
 WHERE p.`id` IS NULL;

ALTER TABLE `stock_alerts`
  MODIFY `sku` VARCHAR(40) NOT NULL,
  ADD CONSTRAINT `fk_alert_product_sku` FOREIGN KEY (`sku`)
    REFERENCES `products` (`sku`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
--  8) Integridad e índices del resto del modelo
-- ---------------------------------------------------------------------
ALTER TABLE `sales`
  ADD KEY `ix_sales_date` (`created_at`),
  ADD KEY `ix_sales_register` (`register_id`),
  ADD CONSTRAINT `ck_sales_amounts` CHECK (
    `subtotal` >= 0 AND `tax` >= 0 AND `total` >= 0 AND `amount_paid` >= 0 AND `change_due` >= 0);

-- El nombre viejo fk_reservations_user apuntaba en realidad a resolved_by.
ALTER TABLE `reservations` DROP FOREIGN KEY `fk_reservations_user`;
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_resolved_by` FOREIGN KEY (`resolved_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD UNIQUE KEY `uq_reservations_sale` (`sale_id`),
  ADD KEY `ix_reservations_created` (`created_at`),
  ADD CONSTRAINT `ck_reservations_amounts` CHECK (`subtotal` >= 0 AND `tax` >= 0 AND `total` >= 0);

ALTER TABLE `registers`
  ADD UNIQUE KEY `uq_registers_branch_name` (`branch_id`, `name`);

ALTER TABLE `sessions`
  ADD KEY `ix_sessions_expires` (`expires_at`);

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
--  9) Vistas
-- ---------------------------------------------------------------------
-- Forma idéntica a la tabla `products` vieja (una fila por sucursal).
-- El PHP lee de aquí; las escrituras van a products / inventory.
CREATE OR REPLACE VIEW `v_inventory` AS
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
  IF(p.`status` = 'active' AND i.`status` = 'active', 'active', 'inactive') AS status,
  i.`created_at`          AS created_at,
  GREATEST(i.`updated_at`, p.`updated_at`) AS updated_at
FROM `inventory` i
JOIN `products`  p ON p.`id` = i.`product_id`;

CREATE OR REPLACE VIEW `v_consolidated_inventory` AS
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

-- ---------------------------------------------------------------------
--  10) Cuando verifiques el sistema, borra el respaldo:
--      DROP TABLE `products_legacy`;
-- ---------------------------------------------------------------------
