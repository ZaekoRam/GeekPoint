-- =====================================================================
--  Migración 2026-08-28 · Galería multi-imagen de producto
--    mysql -u root geekpoint_pos < database/migrations/2026_08_28_000006_product_gallery.sql
--  `image_url` ahora admite VARIAS URLs separadas por coma
--  (la 1ª = portada del catálogo; el resto = ángulos para la galería del modal).
--  Se pueden sustituir por URLs de fotos reales en cualquier momento.
-- =====================================================================
SET NAMES utf8mb4;

ALTER TABLE `products` MODIFY `image_url` VARCHAR(1000) NOT NULL DEFAULT '';

-- 5 figuras semilla -> render multi-ángulo (frente / perfil / reverso), on-origin.
UPDATE `products` SET `image_url` = CONCAT(
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&t=Gojo%20Satoru%201%2F7&a=front,',
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&t=Gojo%20Satoru%201%2F7&a=side,',
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&t=Gojo%20Satoru%201%2F7&a=back')
  WHERE `sku` = 'FIG-GSC-GOJO17';

UPDATE `products` SET `image_url` = CONCAT(
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%2300e5ff&t=Luffy%20Gear%205&a=front,',
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%2300e5ff&t=Luffy%20Gear%205&a=side,',
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%2300e5ff&t=Luffy%20Gear%205&a=back')
  WHERE `sku` = 'FIG-GSC-LUFFYG5';

UPDATE `products` SET `image_url` = CONCAT(
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&t=Nezuko%20Nendoroid%20%231194&a=front,',
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&t=Nezuko%20Nendoroid%20%231194&a=side,',
  'catalog/cover?kind=figura&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&t=Nezuko%20Nendoroid%20%231194&a=back')
  WHERE `sku` = 'FIG-GSC-NEZUKO1194';

UPDATE `products` SET `image_url` = CONCAT(
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%237a5c3e&t=Eren%20Titan%20Form&a=front,',
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%237a5c3e&t=Eren%20Titan%20Form&a=side,',
  'catalog/cover?kind=figura&pub=POP%20UP%20PARADE&accent=%237a5c3e&t=Eren%20Titan%20Form&a=back')
  WHERE `sku` = 'FIG-GSC-ERENPUP';

UPDATE `products` SET `image_url` = CONCAT(
  'catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=front,',
  'catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=side,',
  'catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=back')
  WHERE `sku` = 'FIG-KOTO-ARTORIA17';
