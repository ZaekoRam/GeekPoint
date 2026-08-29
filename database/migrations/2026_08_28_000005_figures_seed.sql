-- =====================================================================
--  Migración 2026-08-28 · Semilla de FIGURAS de colección
--    mysql -u root geekpoint_pos < database/migrations/2026_08_28_000005_figures_seed.sql
--  Convención de `description`:  "<Fabricante> · <Escala/Línea> · <detalle>"
--  image_url = portada generada on-origin (catalog/cover?kind=figura&...),
--  siempre renderiza; se puede sustituir por foto real desde el importador.
-- =====================================================================
SET NAMES utf8mb4;

DELETE FROM `products` WHERE `sku` IN
  ('FIG-GSC-GOJO17','FIG-GSC-LUFFYG5','FIG-GSC-NEZUKO1194','FIG-GSC-ERENPUP','FIG-KOTO-ARTORIA17');

INSERT INTO `products`
  (`branch_id`,`sku`,`name`,`category_id`,`description`,`price`,`tax_rate`,`stock`,`min_stock`,`image_url`,`status`) VALUES
  -- 1) Gojo Satoru 1/7 — Good Smile Company
  (1,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,5,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff','active'),
  (2,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,3,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff','active'),
  (3,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,2,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff','active'),
  -- 2) Monkey D. Luffy Gear 5 — POP UP PARADE (Good Smile Company)
  (1,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,8,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff','active'),
  (2,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,6,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff','active'),
  (3,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,4,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff','active'),
  -- 3) Nezuko Kamado Nendoroid #1194 — Good Smile Company
  (1,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,7,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95','active'),
  (2,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,5,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95','active'),
  (3,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,3,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95','active'),
  -- 4) Eren Yeager Titan Form — POP UP PARADE (Good Smile Company)
  (1,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,6,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e','active'),
  (2,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,4,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e','active'),
  (3,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,3,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e','active'),
  -- 5) Artoria Pendragon 1/7 — Kotobukiya (ArtFX J)
  (1,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,3,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400','active'),
  (2,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,2,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400','active'),
  (3,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,2,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400','active');
