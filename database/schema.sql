-- =====================================================================
--  GeekPoint POS — Esquema de base de datos
--  Motor: MySQL 5.7+ / MariaDB 10.3+  (Hostinger compatible)
--  Codificación: utf8mb4
-- =====================================================================
--  Ejecuta este archivo UNA vez para crear todas las tablas.
--  Luego ejecuta database/seed.sql para cargar datos de demostración.
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
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branches_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Usuarios (admin general, gerentes, cajeros)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120) NOT NULL,
  `email`         VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('admin','manager','cashier') NOT NULL,
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
--  Productos (inventario independiente POR sucursal)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   INT UNSIGNED NOT NULL,
  `sku`         VARCHAR(40)  NOT NULL,
  `name`        VARCHAR(180) NOT NULL,
  `category_id` INT UNSIGNED NULL,
  `description` VARCHAR(500) NOT NULL DEFAULT '',
  `price`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate`    DECIMAL(4,3)  NOT NULL DEFAULT 0.160,   -- IVA México 16%
  `stock`       INT NOT NULL DEFAULT 0,
  `min_stock`   INT NOT NULL DEFAULT 3,
  `image_url`   VARCHAR(1000) NOT NULL DEFAULT '',   -- 1+ URLs separadas por coma (1ª = portada)
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_branch_sku` (`branch_id`, `sku`),
  KEY `ix_products_branch` (`branch_id`),
  KEY `ix_products_category` (`category_id`),
  KEY `ix_products_name` (`name`),
  KEY `ix_products_lowstock` (`branch_id`, `stock`),
  CONSTRAINT `fk_products_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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
  `payment_method` ENUM('cash','card','transfer') NOT NULL DEFAULT 'cash',
  `amount_paid`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `change_due`     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`         ENUM('completed','void') NOT NULL DEFAULT 'completed',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_folio` (`folio`),
  KEY `ix_sales_branch_date` (`branch_id`, `created_at`),
  KEY `ix_sales_user` (`user_id`),
  CONSTRAINT `fk_sales_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_register` FOREIGN KEY (`register_id`)
    REFERENCES `registers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Renglones de venta (sale_items) — con snapshot de precio/nombre
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sale_id`      BIGINT UNSIGNED NOT NULL,
  `product_id`   INT UNSIGNED NULL,
  `product_name` VARCHAR(180) NOT NULL,
  `sku`          VARCHAR(40) NOT NULL DEFAULT '',
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
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT `fk_mov_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Apartados / reservas  (carrito de la tienda pública -> cobro en POS)
--  Folios GP-XXXX · estados: pendiente | cobrada | cancelada
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `reservation_items`;
DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folio`          VARCHAR(16)  NOT NULL,
  `branch_id`      INT UNSIGNED NULL,
  `customer_name`  VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(160) NOT NULL DEFAULT '',
  `customer_phone` VARCHAR(40)  NOT NULL DEFAULT '',
  `subtotal`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax`            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status`         ENUM('pendiente','cobrada','cancelada') NOT NULL DEFAULT 'pendiente',
  `note`           VARCHAR(255) NOT NULL DEFAULT '',
  `sale_id`        BIGINT UNSIGNED NULL,
  `resolved_by`    INT UNSIGNED NULL,
  `resolved_at`    DATETIME NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reservations_folio` (`folio`),
  KEY `ix_reservations_status` (`status`),
  KEY `ix_reservations_branch` (`branch_id`),
  CONSTRAINT `fk_reservations_branch` FOREIGN KEY (`branch_id`)
    REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_sale` FOREIGN KEY (`sale_id`)
    REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`resolved_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservation_items` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reservation_id` INT UNSIGNED NOT NULL,
  `product_ref`    VARCHAR(64)  NOT NULL DEFAULT '',
  `title`          VARCHAR(200) NOT NULL,
  `unit_price`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity`       INT NOT NULL DEFAULT 1,
  `line_total`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `ix_resitems_res` (`reservation_id`),
  CONSTRAINT `fk_resitems_res` FOREIGN KEY (`reservation_id`)
    REFERENCES `reservations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  Vista de apoyo: inventario consolidado por producto (admin general)
-- =====================================================================
DROP VIEW IF EXISTS `v_consolidated_inventory`;
CREATE VIEW `v_consolidated_inventory` AS
SELECT
  p.name                              AS product_name,
  c.slug                              AS category_slug,
  COUNT(DISTINCT p.branch_id)         AS branches_count,
  SUM(p.stock)                        AS total_stock,
  SUM(CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END) AS branches_low_stock,
  ROUND(AVG(p.price), 2)              AS avg_price
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.status = 'active'
GROUP BY p.name, c.slug;
