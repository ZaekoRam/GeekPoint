-- =====================================================================
--  Migración 2026-08-28 · Apartados / reservas (carrito de la tienda -> POS)
--  Folios GP-XXXX · estados: pendiente | cobrada | cancelada
--  Aplicar sobre una BD ya sembrada:
--    mysql -u root geekpoint_pos < database/migrations/2026_08_28_000002_reservations.sql
-- =====================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `reservation_items`;
DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folio`          VARCHAR(16)  NOT NULL,                 -- p. ej. GP-8492
  `branch_id`      INT UNSIGNED NULL,                     -- sucursal donde recogerá
  `customer_name`  VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(160) NOT NULL DEFAULT '',
  `customer_phone` VARCHAR(40)  NOT NULL DEFAULT '',
  `subtotal`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax`            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status`         ENUM('pendiente','cobrada','cancelada') NOT NULL DEFAULT 'pendiente',
  `note`           VARCHAR(255) NOT NULL DEFAULT '',
  `sale_id`        BIGINT UNSIGNED NULL,                  -- venta POS que la liquidó
  `resolved_by`    INT UNSIGNED NULL,                     -- usuario que cobró/canceló
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
  `product_ref`    VARCHAR(64)  NOT NULL DEFAULT '',      -- id del catálogo (snapshot)
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
