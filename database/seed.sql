-- =====================================================================
--  GeekPoint POS — Datos de demostración
--  Ejecuta DESPUÉS de schema.sql
-- =====================================================================
--  Contraseña de TODOS los usuarios demo:  password
--  (hash bcrypt precalculado; cámbialo en producción con api/tools/hash.php)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `stock_movements`;
TRUNCATE TABLE `sale_items`;
TRUNCATE TABLE `sales`;
TRUNCATE TABLE `registers`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `sessions`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `branches`;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
--  Sucursales
-- ---------------------------------------------------------------------
INSERT INTO `branches` (`id`,`code`,`name`,`city`,`state`,`address`,`phone`,`status`) VALUES
  (1,'GKP-CDMX','GeekPoint Reforma','Ciudad de México','CDMX','Av. Paseo de la Reforma 222, Local 14','55 5512 8890','active'),
  (2,'GKP-GDL','GeekPoint Chapultepec','Guadalajara','Jalisco','Av. Chapultepec Sur 480','33 3615 4021','active'),
  (3,'GKP-MTY','GeekPoint Valle','Monterrey','Nuevo León','Av. San Pedro 1000, Plaza Fiesta','81 8342 7715','active');

-- ---------------------------------------------------------------------
--  Usuarios   (password = "password")
-- ---------------------------------------------------------------------
INSERT INTO `users` (`id`,`name`,`email`,`password_hash`,`role`,`branch_id`,`status`) VALUES
  (1,'Adriana Sáenz','admin@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',NULL,'active'),
  (2,'Marco Beltrán','gerente.cdmx@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager',1,'active'),
  (3,'Lucía Franco','gerente.gdl@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager',2,'active'),
  (4,'Diego Molina','gerente.mty@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager',3,'active'),
  (5,'Paola Ríos','caja.cdmx@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cashier',1,'active'),
  (6,'Kevin Ortega','caja.gdl@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cashier',2,'active'),
  (7,'Sofía Nava','caja.mty@geekpoint.mx','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cashier',3,'active');

-- ---------------------------------------------------------------------
--  Categorías
-- ---------------------------------------------------------------------
INSERT INTO `categories` (`id`,`slug`,`name_es`,`name_en`,`icon`,`sort_order`) VALUES
  (1,'manga','Manga','Manga','📚',1),
  (2,'figuras','Figuras','Figures','🗿',2),
  (3,'tcg','Cartas TCG','TCG Cards','🃏',3),
  (4,'comics','Cómics','Comics','💥',4),
  (5,'coleccionables','Coleccionables','Collectibles','🎁',5);

-- ---------------------------------------------------------------------
--  Cajas de venta
-- ---------------------------------------------------------------------
INSERT INTO `registers` (`id`,`branch_id`,`name`,`status`) VALUES
  (1,1,'Caja 1 — Entrada','active'),
  (2,1,'Caja 2 — Planta alta','active'),
  (3,2,'Caja 1 — Principal','active'),
  (4,2,'Caja 2 — TCG','active'),
  (5,3,'Caja 1 — Principal','active');

-- ---------------------------------------------------------------------
--  Productos  (inventario independiente por sucursal)
--  Algunos con stock <= min_stock para disparar alertas.
-- ---------------------------------------------------------------------
INSERT INTO `products`
  (`branch_id`,`sku`,`name`,`category_id`,`description`,`price`,`tax_rate`,`stock`,`min_stock`,`image_url`,`status`) VALUES
  -- Sucursal 1 — CDMX Reforma
  (1,'MNG-JJK-01','Jujutsu Kaisen Vol. 1',1,'Edición español, Panini Manga.',149.00,0.160,24,6,'','active'),
  (1,'MNG-CSM-05','Chainsaw Man Vol. 5',1,'Edición español, Panini Manga.',149.00,0.160,4,5,'','active'),
  (1,'MNG-OPC-105','One Piece Vol. 105',1,'Edición español, Panini Manga.',159.00,0.160,18,6,'','active'),
  (1,'MNG-SPY-11','Spy x Family Vol. 11',1,'Edición español.',159.00,0.160,9,5,'','active'),
  (1,'FIG-GOJO-16','Figura Gojo Satoru 1/7',2,'Escala 1/7, PVC, 26 cm.',2490.00,0.160,3,2,'','active'),
  (1,'FIG-NZK-POP','Funko Pop! Nezuko',2,'Vinyl 10 cm, caja con ventana.',329.00,0.160,15,6,'','active'),
  (1,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,60,15,'','active'),
  (1,'TCG-OP-ETB','One Piece TCG — Elite Trainer Box',3,'Caja con 8 sobres + accesorios.',1290.00,0.160,5,4,'','active'),
  (1,'CMC-BAT-2024','Batman #142 (variante)',4,'DC Comics, portada variante.',89.00,0.160,12,5,'','active'),
  (1,'CMC-SPD-300','Spider-Man #300 (reimpresión)',4,'Marvel, edición conmemorativa.',129.00,0.160,2,4,'','active'),
  (1,'COL-KEY-JJK','Llavero acrílico Jujutsu (surtido)',5,'Acrílico doble cara, 6 cm.',59.00,0.160,80,20,'','active'),
  (1,'COL-POST-OP','Póster One Piece Wano 60x90',5,'Papel couché 250g.',149.00,0.160,7,6,'','active'),
  -- Sucursal 2 — GDL Chapultepec
  (2,'MNG-JJK-01','Jujutsu Kaisen Vol. 1',1,'Edición español, Panini Manga.',149.00,0.160,11,6,'','active'),
  (2,'MNG-BLK-21','Blue Lock Vol. 21',1,'Edición español.',159.00,0.160,3,5,'','active'),
  (2,'MNG-KNY-23','Kimetsu no Yaiba Vol. 23',1,'Edición español, tomo final.',149.00,0.160,20,6,'','active'),
  (2,'FIG-LUFFY-G5','Figura Luffy Gear 5 S.H.F.',2,'Articulada, 16 cm.',1890.00,0.160,4,3,'','active'),
  (2,'FIG-EREN-POP','Funko Pop! Eren Titán',2,'Vinyl super sized 15 cm.',749.00,0.160,6,4,'','active'),
  (2,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,45,15,'','active'),
  (2,'TCG-MTG-LCI','Magic — Bundle Lost Caverns',3,'Bundle con 9 sobres Set.',1490.00,0.160,2,3,'','active'),
  (2,'CMC-XMEN-35','X-Men #35',4,'Marvel.',95.00,0.160,10,5,'','active'),
  (2,'COL-MOU-ANM','Mousepad XL anime (surtido)',5,'90x40 cm, base antiderrapante.',249.00,0.160,14,6,'','active'),
  (2,'COL-PIN-KNY','Pin metálico Kimetsu (surtido)',5,'Esmaltado, broche mariposa.',49.00,0.160,5,12,'','active'),
  -- Sucursal 3 — MTY Valle
  (3,'MNG-JJK-01','Jujutsu Kaisen Vol. 1',1,'Edición español, Panini Manga.',149.00,0.160,8,6,'','active'),
  (3,'MNG-DND-12','Dandadan Vol. 12',1,'Edición español.',159.00,0.160,6,5,'','active'),
  (3,'FIG-MIKASA-17','Figura Mikasa 1/7',2,'Escala 1/7, PVC, 23 cm.',2290.00,0.160,2,2,'','active'),
  (3,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,30,15,'','active'),
  (3,'CMC-INV-01','Invincible Vol. 1 (TPB)',4,'Image Comics, español.',329.00,0.160,4,4,'','active'),
  (3,'COL-STK-MIX','Stickers holográficos (paquete)',5,'Paquete de 12 piezas.',39.00,0.160,50,15,'','active');

-- ---------------------------------------------------------------------
--  Ventas de ejemplo (para historial y reportes)
-- ---------------------------------------------------------------------
INSERT INTO `sales`
  (`id`,`folio`,`branch_id`,`register_id`,`user_id`,`customer_name`,`subtotal`,`tax`,`total`,`payment_method`,`amount_paid`,`change_due`,`created_at`) VALUES
  (1,'CDMX-000001',1,1,5,'Mostrador',298.00,47.68,345.68,'cash',400.00,54.32, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (2,'CDMX-000002',1,1,5,'Mostrador',119.00,19.04,138.04,'card',138.04,0.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (3,'CDMX-000003',1,2,5,'Ana L.',2490.00,398.40,2888.40,'transfer',2888.40,0.00, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  (4,'GDL-000001',2,3,6,'Mostrador',308.00,49.28,357.28,'cash',360.00,2.72, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (5,'GDL-000002',2,4,6,'Mostrador',1490.00,238.40,1728.40,'card',1728.40,0.00, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (6,'MTY-000001',3,5,7,'Mostrador',158.00,25.28,183.28,'cash',200.00,16.72, DATE_SUB(NOW(), INTERVAL 5 HOUR));

INSERT INTO `sale_items`
  (`sale_id`,`product_id`,`product_name`,`sku`,`unit_price`,`tax_rate`,`quantity`,`line_subtotal`,`line_tax`,`line_total`) VALUES
  (1, 1,'Jujutsu Kaisen Vol. 1','MNG-JJK-01',149.00,0.160,2,298.00,47.68,345.68),
  (2, 7,'Pokémon TCG — Booster 151','TCG-PKM-151',119.00,0.160,1,119.00,19.04,138.04),
  (3, 5,'Figura Gojo Satoru 1/7','FIG-GOJO-16',2490.00,0.160,1,2490.00,398.40,2888.40),
  (4,15,'Kimetsu no Yaiba Vol. 23','MNG-KNY-23',149.00,0.160,1,149.00,23.84,172.84),
  (4,13,'Jujutsu Kaisen Vol. 1','MNG-JJK-01',149.00,0.160,1,159.00,25.44,184.44),
  (5,19,'Magic — Bundle Lost Caverns','TCG-MTG-LCI',1490.00,0.160,1,1490.00,238.40,1728.40),
  (6,25,'Dandadan Vol. 12','MNG-DND-12',159.00,0.160,1,158.00,25.28,183.28);

INSERT INTO `stock_movements`
  (`branch_id`,`product_id`,`user_id`,`type`,`quantity_delta`,`resulting_stock`,`reference`,`note`,`created_at`) VALUES
  (1, 1,5,'sale',-2,24,'CDMX-000001','Venta mostrador', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (1, 7,5,'sale',-1,60,'CDMX-000002','Venta mostrador', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (1, 5,5,'sale',-1, 3,'CDMX-000003','Venta Ana L.', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  (2,15,6,'sale',-1,20,'GDL-000001','Venta mostrador', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (2,13,6,'sale',-1,11,'GDL-000001','Venta mostrador', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (2,19,6,'sale',-1, 2,'GDL-000002','Venta mostrador', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (3,25,7,'sale',-1, 6,'MTY-000001','Venta mostrador', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (1, 2,2,'restock',12, 4,'OC-2291','Recepción parcial proveedor', DATE_SUB(NOW(), INTERVAL 4 DAY));
