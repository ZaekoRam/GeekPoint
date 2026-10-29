-- =====================================================================
--  GeekPoint POS — Esquema de base de datos
--  Motor: MariaDB 10.4+ (Hostinger) · MySQL 8.0.16+ también aplica los CHECK
--  Codificación: utf8mb4
-- =====================================================================
--  Ejecuta este archivo UNA vez para crear todas las tablas (instalación
--  nueva). Luego ejecuta database/seed.sql para cargar datos de demostración.
--  Ya incluye las migraciones hasta 2026_10_19_000001 (modelo normalizado:
--  catálogo maestro + inventario por sucursal). Una base existente se
--  actualiza con los archivos de database/migrations/, no con este.
--  Diagrama entidad-relación: docs/diagrama-er.md
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
--  Sucursales (branches)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(20)  NOT NULL,
  `name`        VARCHAR(120) NOT NULL,
  `city`        VARCHAR(90)  NOT NULL DEFAULT '',
  `state`       VARCHAR(90)  NOT NULL DEFAULT '',
  `address`     VARCHAR(255) NOT NULL DEFAULT '',
  `phone`       VARCHAR(40)  NOT NULL DEFAULT '',
  `hours`       VARCHAR(120) NOT NULL DEFAULT '',
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branches_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Usuarios (admin general, gerentes, cajeros, clientes)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120) NOT NULL,
  `email`         VARCHAR(160) NOT NULL,
  `email_verified_at`   DATETIME NULL,
  `email_token_hash`    CHAR(64) NULL,
  `email_token_sent_at` DATETIME NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('admin','manager','cashier','customer') NOT NULL,
  `branch_id`     INT UNSIGNED NULL,
  `status`        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_branch` (`branch_id`),
  KEY `ix_users_role` (`role`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Sesiones (tokens de acceso tipo Bearer)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `token_hash`  CHAR(64) NOT NULL,           -- sha256 del token en claro
  `user_agent`  VARCHAR(255) NOT NULL DEFAULT '',
  `ip`          VARCHAR(45) NOT NULL DEFAULT '',
  `expires_at`  DATETIME NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_token` (`token_hash`),
  KEY `ix_sessions_user` (`user_id`),
  KEY `ix_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Categorías de producto (catálogo global: Manga, Figuras, TCG, ...)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`       VARCHAR(60)  NOT NULL,
  `name_es`    VARCHAR(90)  NOT NULL,
  `name_en`    VARCHAR(90)  NOT NULL,
  `icon`       VARCHAR(16)  NOT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Productos — catálogo maestro (1 fila por SKU, compartida por sucursales)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
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
  `tax_rate`           DECIMAL(4,3)  NOT NULL DEFAULT 0.160,   -- IVA México 16%
  `figure_png_url`     TEXT NULL,   -- figura recortada (PNG transparente) para la vista 3D pop-out
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

-- ---------------------------------------------------------------------
--  Inventario por sucursal (stock independiente de cada sede)
--  Su id es el "id de producto" que usa el POS y la tienda.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   INT UNSIGNED NOT NULL,
  `product_id`  INT UNSIGNED NOT NULL,
  `stock`       INT NOT NULL DEFAULT 0,
  `min_stock`   INT NOT NULL DEFAULT 5,
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

-- ---------------------------------------------------------------------
--  Galería de imágenes del producto (ordenada)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `product_images`;
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

-- ---------------------------------------------------------------------
--  Etiquetas de tienda (novedad, preventa, ...) — relación N:M
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`  VARCHAR(24) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_tags`;
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

-- ---------------------------------------------------------------------
--  Cajas de venta (registers) por sucursal
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `registers`;
CREATE TABLE `registers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`  INT UNSIGNED NOT NULL,
  `name`       VARCHAR(80) NOT NULL,
  `status`     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registers_branch_name` (`branch_id`, `name`),
  KEY `ix_registers_branch` (`branch_id`),
  CONSTRAINT `fk_registers_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Ventas (sales)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folio`          VARCHAR(24) NOT NULL,
  `branch_id`      INT UNSIGNED NOT NULL,
  `register_id`    INT UNSIGNED NULL,
  `user_id`        INT UNSIGNED NOT NULL,       -- cajero
  `customer_name`  VARCHAR(120) NOT NULL DEFAULT '',
  `subtotal`       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax`            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total`          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('cash','card','transfer','mixed') NOT NULL DEFAULT 'cash',
  `amount_paid`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `change_due`     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`         ENUM('completed','void') NOT NULL DEFAULT 'completed',
  `void_reason`    VARCHAR(200) NOT NULL DEFAULT '',
  `voided_by`      INT UNSIGNED NULL,
  `voided_at`      DATETIME NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_folio` (`folio`),
  KEY `ix_sales_branch_date` (`branch_id`, `created_at`),
  KEY `ix_sales_user` (`user_id`),
  KEY `ix_sales_date` (`created_at`),
  KEY `ix_sales_register` (`register_id`),
  CONSTRAINT `fk_sales_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_register` FOREIGN KEY (`register_id`)
    REFERENCES `registers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_sales_amounts` CHECK (
    `subtotal` >= 0 AND `tax` >= 0 AND `total` >= 0 AND `amount_paid` >= 0 AND `change_due` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Cortes de caja
-- ---------------------------------------------------------------------
CREATE TABLE `cash_cuts` (
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

-- ---------------------------------------------------------------------
--  Formas de pago de una venta (una o varias: pago mixto)
-- ---------------------------------------------------------------------
CREATE TABLE `sale_payments` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_id`    BIGINT UNSIGNED NOT NULL,
  `method`     ENUM('cash','card','transfer') NOT NULL,
  `amount`     DECIMAL(12,2) NOT NULL,
  `reference`  VARCHAR(80) NOT NULL DEFAULT '',      -- últimos 4 / autorización / ref. de transferencia
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_sale_payments_sale` (`sale_id`),
  CONSTRAINT `fk_sale_payments_sale` FOREIGN KEY (`sale_id`)
    REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Renglones de venta (sale_items) — con snapshot de precio/nombre
--  product_id -> producto maestro (la sucursal está en sales.branch_id)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_id`      BIGINT UNSIGNED NOT NULL,
  `product_id`   INT UNSIGNED NULL,
  `product_name` VARCHAR(180) NOT NULL,
  `sku`          VARCHAR(40) NOT NULL DEFAULT '',
  `list_unit_price` DECIMAL(10,2) NOT NULL,
  `discount_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `unit_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit_price`   DECIMAL(10,2) NOT NULL,
  `tax_rate`     DECIMAL(4,3) NOT NULL DEFAULT 0.160,
  `quantity`     INT NOT NULL,
  `line_subtotal` DECIMAL(12,2) NOT NULL,
  `line_tax`      DECIMAL(12,2) NOT NULL,
  `line_total`    DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_sale_items_sale` (`sale_id`),
  KEY `ix_sale_items_product` (`product_id`),
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`)
    REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_sale_items_qty`    CHECK (`quantity` > 0),
  CONSTRAINT `ck_sale_items_prices` CHECK (`unit_price` >= 0 AND `list_unit_price` >= 0 AND `line_total` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Movimientos de inventario (auditoría de stock)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`      INT UNSIGNED NOT NULL,
  `product_id`     INT UNSIGNED NULL,
  `user_id`        INT UNSIGNED NULL,
  `type`           ENUM('sale','restock','adjustment','void') NOT NULL,
  `quantity_delta` INT NOT NULL,               -- negativo = salida
  `resulting_stock` INT NOT NULL,
  `reference`      VARCHAR(60) NOT NULL DEFAULT '',
  `note`           VARCHAR(255) NOT NULL DEFAULT '',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_mov_branch_date` (`branch_id`, `created_at`),
  KEY `ix_mov_product` (`product_id`),
  KEY `ix_mov_type` (`type`),
  CONSTRAINT `fk_mov_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Apartados / reservas  (carrito de la tienda pública -> cobro en POS)
--  Folios GP-XXXX · estados: pendiente | lista | cobrada | cancelada
--  user_id: cliente autenticado dueño del apartado (NULL = invitado, se
--  siguió pudiendo apartar sin cuenta). "lista" = ya se preparó en tienda
--  y espera que el cliente pase a recogerla/pagarla (ver ready_at).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `reservation_items`;
DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folio`          VARCHAR(16)  NOT NULL,
  `branch_id`      INT UNSIGNED NULL,
  `user_id`        INT UNSIGNED NULL,
  `customer_name`  VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(160) NOT NULL DEFAULT '',
  `customer_phone` VARCHAR(40)  NOT NULL DEFAULT '',
  `subtotal`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax`            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status`         ENUM('pendiente','lista','cobrada','cancelada') NOT NULL DEFAULT 'pendiente',
  `note`           VARCHAR(255) NOT NULL DEFAULT '',
  `sale_id`        BIGINT UNSIGNED NULL,
  `resolved_by`    INT UNSIGNED NULL,
  `ready_at`       DATETIME NULL,
  `resolved_at`    DATETIME NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reservations_folio` (`folio`),
  KEY `ix_reservations_status` (`status`),
  KEY `ix_reservations_branch` (`branch_id`),
  KEY `ix_reservations_user` (`user_id`),
  KEY `ix_reservations_created` (`created_at`),
  UNIQUE KEY `uq_reservations_sale` (`sale_id`),
  CONSTRAINT `fk_reservations_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_sale` FOREIGN KEY (`sale_id`)
    REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_resolved_by` FOREIGN KEY (`resolved_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_customer` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_reservations_amounts` CHECK (`subtotal` >= 0 AND `tax` >= 0 AND `total` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- product_id: producto del catálogo (NULL = artículo externo/cotización);
-- title y precios son snapshot del momento del apartado.
CREATE TABLE `reservation_items` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reservation_id` INT UNSIGNED NOT NULL,
  `product_id`     INT UNSIGNED NULL,
  `product_ref`    VARCHAR(64)  NOT NULL DEFAULT '',
  `is_preventa`    TINYINT(1)   NOT NULL DEFAULT 0,
  `title`          VARCHAR(200) NOT NULL,
  `list_unit_price` DECIMAL(10,2) NOT NULL,
  `discount_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `unit_discount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit_price`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity`       INT NOT NULL DEFAULT 1,
  `line_total`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `ix_resitems_res` (`reservation_id`),
  KEY `ix_resitems_product` (`product_id`),
  CONSTRAINT `fk_resitems_res` FOREIGN KEY (`reservation_id`)
    REFERENCES `reservations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resitems_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ck_resitems_qty` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Avisos "Notifícame cuando haya stock" (doble opt-in por correo)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_alerts`;
CREATE TABLE `stock_alerts` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku`          VARCHAR(40)  NOT NULL,
  `branch_id`    INT UNSIGNED NOT NULL DEFAULT 0,   -- 0 = cualquier sucursal
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
  UNIQUE KEY `uq_alert_sku_email_branch` (`sku`, `email`, `branch_id`),
  KEY `ix_alert_sku_status` (`sku`, `status`),
  KEY `ix_alert_token` (`token_hash`),
  CONSTRAINT `fk_alert_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alert_product_sku` FOREIGN KEY (`sku`)
    REFERENCES `products` (`sku`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Caché del catálogo externo (AniList / Jikan) — almacén PRIMARIO.
--  La tienda lee de aquí; las APIs externas solo se consultan con un
--  ?refresh=1 (botón del panel) o ?warm=1 (cron). Sin esta tabla el
--  sistema usa api/cache/catalog.json como respaldo.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `catalog_cache`;
CREATE TABLE `catalog_cache` (
  `cache_key`  VARCHAR(64) NOT NULL,
  `payload`    LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cache_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  Vistas
-- =====================================================================
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
  -- De las columnas, no de textos fijos: así lleva el cotejo de la tabla y
  -- no choca con el de la conexión (#1267 en MariaDB 11.8). Ver migración
  -- 2026_10_21_000001_vistas_cotejo.sql.
  IF(p.`status` = 'active', i.`status`, p.`status`) AS status,
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
