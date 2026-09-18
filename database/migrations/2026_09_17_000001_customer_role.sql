-- =====================================================================
-- Rol "Cliente": lo asigna automáticamente el registro público (ver
-- AuthController::register). Ejecutar una vez sobre una instalación
-- existente.
-- =====================================================================
SET NAMES utf8mb4;

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('admin','manager','cashier','customer') NOT NULL;

-- ROLLBACK MANUAL (solo si no hay usuarios con role='customer'):
-- ALTER TABLE users MODIFY COLUMN role ENUM('admin','manager','cashier') NOT NULL;
