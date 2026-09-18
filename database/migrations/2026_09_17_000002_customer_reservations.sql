-- =====================================================================
-- Vincula los apartados al cliente autenticado que los creó y agrega el
-- estado intermedio "lista" (preparada en tienda, lista para recoger).
-- Necesario para que "Mis pedidos" (cuenta de cliente) pueda listar solo
-- los apartados propios y mostrar el flujo completo:
--   pendiente -> lista -> cobrada        (o -> cancelada en cualquier punto)
-- "pendiente" se sigue usando tal cual para invitados sin cuenta.
-- Ejecutar una vez sobre una instalación existente:
--   mysql -u root -P 3307 geekpoint_pos < database/migrations/2026_09_17_000002_customer_reservations.sql
-- =====================================================================
SET NAMES utf8mb4;

ALTER TABLE `reservations`
  ADD COLUMN `user_id`  INT UNSIGNED NULL AFTER `branch_id`,
  ADD COLUMN `ready_at` DATETIME NULL AFTER `resolved_by`,
  MODIFY COLUMN `status` ENUM('pendiente','lista','cobrada','cancelada') NOT NULL DEFAULT 'pendiente';

ALTER TABLE `reservations`
  ADD KEY `ix_reservations_user` (`user_id`),
  ADD CONSTRAINT `fk_reservations_customer` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `reservation_items`
  ADD COLUMN `is_preventa` TINYINT(1) NOT NULL DEFAULT 0 AFTER `product_ref`;

-- ROLLBACK MANUAL (en orden inverso; solo si nada usa 'lista' todavía):
-- ALTER TABLE reservation_items DROP COLUMN is_preventa;
-- ALTER TABLE reservations DROP FOREIGN KEY fk_reservations_customer, DROP KEY ix_reservations_user;
-- ALTER TABLE reservations MODIFY COLUMN status ENUM('pendiente','cobrada','cancelada') NOT NULL DEFAULT 'pendiente',
--   DROP COLUMN ready_at, DROP COLUMN user_id;
