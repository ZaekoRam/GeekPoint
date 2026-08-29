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
  (5,'coleccionables','Coleccionables','Collectibles','🎁',5),
  (6,'preventa','Preventas','Pre-orders','🎫',6);

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
  (1,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,60,15,'https://images.pokemontcg.io/sv3pt5/199_hires.png','active'),
  (1,'TCG-OP-ETB','One Piece TCG — Elite Trainer Box',3,'Caja con 8 sobres + accesorios.',1290.00,0.160,5,4,'catalog/cover?kind=tcg&pub=ONE%20PIECE&t=One%20Piece%20TCG','active'),
  (1,'COL-KEY-JJK','Llavero acrílico Jujutsu (surtido)',5,'Acrílico doble cara, 6 cm.',59.00,0.160,80,20,'','active'),
  (1,'COL-POST-OP','Póster One Piece Wano 60x90',5,'Papel couché 250g.',149.00,0.160,7,6,'','active'),
  -- Sucursal 2 — GDL Chapultepec
  (2,'MNG-JJK-01','Jujutsu Kaisen Vol. 1',1,'Edición español, Panini Manga.',149.00,0.160,11,6,'','active'),
  (2,'MNG-BLK-21','Blue Lock Vol. 21',1,'Edición español.',159.00,0.160,3,5,'','active'),
  (2,'MNG-KNY-23','Kimetsu no Yaiba Vol. 23',1,'Edición español, tomo final.',149.00,0.160,20,6,'','active'),
  (2,'FIG-LUFFY-G5','Figura Luffy Gear 5 S.H.F.',2,'Articulada, 16 cm.',1890.00,0.160,4,3,'','active'),
  (2,'FIG-EREN-POP','Funko Pop! Eren Titán',2,'Vinyl super sized 15 cm.',749.00,0.160,6,4,'','active'),
  (2,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,45,15,'https://images.pokemontcg.io/sv3pt5/199_hires.png','active'),
  (2,'TCG-MTG-LCI','Magic — Bundle Lost Caverns',3,'Bundle con 9 sobres Set.',1490.00,0.160,2,3,'https://api.scryfall.com/cards/named?exact=Cavern%20of%20Souls&format=image&version=large','active'),
  (2,'COL-MOU-ANM','Mousepad XL anime (surtido)',5,'90x40 cm, base antiderrapante.',249.00,0.160,14,6,'','active'),
  (2,'COL-PIN-KNY','Pin metálico Kimetsu (surtido)',5,'Esmaltado, broche mariposa.',49.00,0.160,5,12,'','active'),
  -- Sucursal 3 — MTY Valle
  (3,'MNG-JJK-01','Jujutsu Kaisen Vol. 1',1,'Edición español, Panini Manga.',149.00,0.160,8,6,'','active'),
  (3,'MNG-DND-12','Dandadan Vol. 12',1,'Edición español.',159.00,0.160,6,5,'','active'),
  (3,'FIG-MIKASA-17','Figura Mikasa 1/7',2,'Escala 1/7, PVC, 23 cm.',2290.00,0.160,2,2,'','active'),
  (3,'TCG-PKM-151','Pokémon TCG — Booster 151',3,'Sobre sellado, 10 cartas.',119.00,0.160,30,15,'https://images.pokemontcg.io/sv3pt5/199_hires.png','active'),
  (3,'COL-STK-MIX','Stickers holográficos (paquete)',5,'Paquete de 12 piezas.',39.00,0.160,50,15,'','active');

-- ---------------------------------------------------------------------
--  Cómics (25 títulos emblemáticos · portadas reales a color)
-- ---------------------------------------------------------------------
INSERT INTO `products`
  (`branch_id`,`sku`,`name`,`category_id`,`description`,`price`,`tax_rate`,`stock`,`min_stock`,`image_url`,`status`) VALUES
  (1,'CMC-BAT-142','Batman #142 (variante)',4,'DC Comics · edición individual a color.',89.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png','active'),
  (2,'CMC-BAT-142','Batman #142 (variante)',4,'DC Comics · edición individual a color.',89.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png','active'),
  (3,'CMC-BAT-142','Batman #142 (variante)',4,'DC Comics · edición individual a color.',89.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png','active'),
  (1,'CMC-ASM-300','The Amazing Spider-Man #300',4,'Marvel Comics · edición individual a color.',349.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg','active'),
  (2,'CMC-ASM-300','The Amazing Spider-Man #300',4,'Marvel Comics · edición individual a color.',349.00,0.160,2,4,'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg','active'),
  (3,'CMC-ASM-300','The Amazing Spider-Man #300',4,'Marvel Comics · edición individual a color.',349.00,0.160,2,4,'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg','active'),
  (1,'CMC-INV-1','Invincible #1',4,'Image Comics · edición individual a color.',129.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg','active'),
  (2,'CMC-INV-1','Invincible #1',4,'Image Comics · edición individual a color.',129.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg','active'),
  (3,'CMC-INV-1','Invincible #1',4,'Image Comics · edición individual a color.',129.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg','active'),
  (1,'CMC-XMEN-35','X-Men #35',4,'Marvel Comics · edición individual a color.',95.00,0.160,12,4,'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg','active'),
  (2,'CMC-XMEN-35','X-Men #35',4,'Marvel Comics · edición individual a color.',95.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg','active'),
  (3,'CMC-XMEN-35','X-Men #35',4,'Marvel Comics · edición individual a color.',95.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg','active'),
  (1,'CMC-WATCH-1','Watchmen #1',4,'DC Comics · edición individual a color.',119.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg','active'),
  (2,'CMC-WATCH-1','Watchmen #1',4,'DC Comics · edición individual a color.',119.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg','active'),
  (3,'CMC-WATCH-1','Watchmen #1',4,'DC Comics · edición individual a color.',119.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg','active'),
  (1,'CMC-DKR-1','The Dark Knight Returns #1',4,'DC Comics · edición individual a color.',159.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg','active'),
  (2,'CMC-DKR-1','The Dark Knight Returns #1',4,'DC Comics · edición individual a color.',159.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg','active'),
  (3,'CMC-DKR-1','The Dark Knight Returns #1',4,'DC Comics · edición individual a color.',159.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg','active'),
  (1,'CMC-SAGA-1','Saga #1',4,'Image Comics · edición individual a color.',75.00,0.160,15,4,'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg','active'),
  (2,'CMC-SAGA-1','Saga #1',4,'Image Comics · edición individual a color.',75.00,0.160,11,4,'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg','active'),
  (3,'CMC-SAGA-1','Saga #1',4,'Image Comics · edición individual a color.',75.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg','active'),
  (1,'CMC-VENOM-1','Venom #1',4,'Marvel Comics · edición individual a color.',110.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg','active'),
  (2,'CMC-VENOM-1','Venom #1',4,'Marvel Comics · edición individual a color.',110.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg','active'),
  (3,'CMC-VENOM-1','Venom #1',4,'Marvel Comics · edición individual a color.',110.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg','active'),
  (1,'CMC-FLPT-1','Flashpoint #1',4,'DC Comics · edición individual a color.',129.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png','active'),
  (2,'CMC-FLPT-1','Flashpoint #1',4,'DC Comics · edición individual a color.',129.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png','active'),
  (3,'CMC-FLPT-1','Flashpoint #1',4,'DC Comics · edición individual a color.',129.00,0.160,2,4,'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png','active'),
  (1,'CMC-SPAWN-1','Spawn #1',4,'Image Comics · edición individual a color.',139.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/d/d9/Spawn_Classic.jpg','active'),
  (3,'CMC-SPAWN-1','Spawn #1',4,'Image Comics · edición individual a color.',139.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/d/d9/Spawn_Classic.jpg','active'),
  (1,'CMC-DP-1','Deadpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,14,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (2,'CMC-DP-1','Deadpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (3,'CMC-DP-1','Deadpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (1,'CMC-WOLV-1','Wolverine #1',4,'Marvel Comics · edición individual a color.',115.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg','active'),
  (2,'CMC-WOLV-1','Wolverine #1',4,'Marvel Comics · edición individual a color.',115.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg','active'),
  (3,'CMC-WOLV-1','Wolverine #1',4,'Marvel Comics · edición individual a color.',115.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg','active'),
  (1,'CMC-CW-1','Civil War #1',4,'Marvel Comics · edición individual a color.',125.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg','active'),
  (2,'CMC-CW-1','Civil War #1',4,'Marvel Comics · edición individual a color.',125.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg','active'),
  (3,'CMC-CW-1','Civil War #1',4,'Marvel Comics · edición individual a color.',125.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg','active'),
  (1,'CMC-SECW-1','Secret Wars #1',4,'Marvel Comics · edición individual a color.',135.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png','active'),
  (2,'CMC-SECW-1','Secret Wars #1',4,'Marvel Comics · edición individual a color.',135.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png','active'),
  (3,'CMC-SECW-1','Secret Wars #1',4,'Marvel Comics · edición individual a color.',135.00,0.160,2,4,'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png','active'),
  (1,'CMC-AC-1000','Superman: Action Comics #1000',4,'DC Comics · edición individual a color.',199.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg','active'),
  (2,'CMC-AC-1000','Superman: Action Comics #1000',4,'DC Comics · edición individual a color.',199.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg','active'),
  (3,'CMC-AC-1000','Superman: Action Comics #1000',4,'DC Comics · edición individual a color.',199.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg','active'),
  (1,'CMC-FLASH-1','The Flash #1',4,'DC Comics · edición individual a color.',99.00,0.160,11,4,'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg','active'),
  (2,'CMC-FLASH-1','The Flash #1',4,'DC Comics · edición individual a color.',99.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg','active'),
  (3,'CMC-FLASH-1','The Flash #1',4,'DC Comics · edición individual a color.',99.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg','active'),
  (1,'CMC-STW-1','Star Wars #1',4,'Marvel Comics · edición individual a color.',129.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg','active'),
  (2,'CMC-STW-1','Star Wars #1',4,'Marvel Comics · edición individual a color.',129.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg','active'),
  (3,'CMC-STW-1','Star Wars #1',4,'Marvel Comics · edición individual a color.',129.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg','active'),
  (1,'CMC-THOR-1','Thor #1',4,'Marvel Comics · edición individual a color.',105.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg','active'),
  (2,'CMC-THOR-1','Thor #1',4,'Marvel Comics · edición individual a color.',105.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg','active'),
  (3,'CMC-THOR-1','Thor #1',4,'Marvel Comics · edición individual a color.',105.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg','active'),
  (1,'CMC-AVEN-1','Avengers #1',4,'Marvel Comics · edición individual a color.',145.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg','active'),
  (2,'CMC-AVEN-1','Avengers #1',4,'Marvel Comics · edición individual a color.',145.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg','active'),
  (3,'CMC-AVEN-1','Avengers #1',4,'Marvel Comics · edición individual a color.',145.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg','active'),
  (1,'CMC-DD-1','Daredevil #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg','active'),
  (3,'CMC-DD-1','Daredevil #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg','active'),
  (1,'CMC-HQ-1','Harley Quinn #1',4,'DC Comics · edición individual a color.',95.00,0.160,13,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg','active'),
  (2,'CMC-HQ-1','Harley Quinn #1',4,'DC Comics · edición individual a color.',95.00,0.160,10,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg','active'),
  (3,'CMC-HQ-1','Harley Quinn #1',4,'DC Comics · edición individual a color.',95.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg','active'),
  (1,'CMC-SAND-1','The Sandman #1',4,'DC Vertigo · edición individual a color.',129.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg','active'),
  (2,'CMC-SAND-1','The Sandman #1',4,'DC Vertigo · edición individual a color.',129.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg','active'),
  (3,'CMC-SAND-1','The Sandman #1',4,'DC Vertigo · edición individual a color.',129.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg','active'),
  (1,'CMC-HB-1','Hellboy #1',4,'Dark Horse Comics · edición individual a color.',139.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg','active'),
  (2,'CMC-HB-1','Hellboy #1',4,'Dark Horse Comics · edición individual a color.',139.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg','active'),
  (3,'CMC-HB-1','Hellboy #1',4,'Dark Horse Comics · edición individual a color.',139.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg','active'),
  (1,'CMC-TMNT-1','Teenage Mutant Ninja Turtles #1',4,'IDW Publishing · edición individual a color.',119.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg','active'),
  (2,'CMC-TMNT-1','Teenage Mutant Ninja Turtles #1',4,'IDW Publishing · edición individual a color.',119.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg','active'),
  (3,'CMC-TMNT-1','Teenage Mutant Ninja Turtles #1',4,'IDW Publishing · edición individual a color.',119.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg','active'),
  (1,'CMC-MK-1','Moon Knight #1',4,'Marvel Comics · edición individual a color.',105.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/4/4a/Moon_Knight_%28Marc_Spector%29.png','active'),
  (2,'CMC-MK-1','Moon Knight #1',4,'Marvel Comics · edición individual a color.',105.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/4/4a/Moon_Knight_%28Marc_Spector%29.png','active');



-- ---------------------------------------------------------------------
--  Cómics extra (Gwenpool, Deadpool #45, UXM #266) + mangas de volumen alto
-- ---------------------------------------------------------------------
INSERT INTO `products`
  (`branch_id`,`sku`,`name`,`category_id`,`description`,`price`,`tax_rate`,`stock`,`min_stock`,`image_url`,`status`) VALUES
  (1,'CMC-GWEN-1','Gwenpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,9,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (2,'CMC-GWEN-1','Gwenpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (3,'CMC-GWEN-1','Gwenpool #1',4,'Marvel Comics · edición individual a color.',99.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (1,'CMC-GWEN-25','The Unbelievable Gwenpool #25',4,'Marvel Comics · edición individual a color.',119.00,0.160,6,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (2,'CMC-GWEN-25','The Unbelievable Gwenpool #25',4,'Marvel Comics · edición individual a color.',119.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (3,'CMC-GWEN-25','The Unbelievable Gwenpool #25',4,'Marvel Comics · edición individual a color.',119.00,0.160,3,4,'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg','active'),
  (1,'CMC-DP-45','Deadpool #45',4,'Marvel Comics · edición individual a color.',89.00,0.160,8,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (2,'CMC-DP-45','Deadpool #45',4,'Marvel Comics · edición individual a color.',89.00,0.160,5,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (3,'CMC-DP-45','Deadpool #45',4,'Marvel Comics · edición individual a color.',89.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png','active'),
  (1,'CMC-UXM-266','Uncanny X-Men #266',4,'Marvel Comics · edición individual a color.',145.00,0.160,7,4,'https://upload.wikimedia.org/wikipedia/en/9/94/Gambit_%28Marvel_Comics%29.png','active'),
  (3,'CMC-UXM-266','Uncanny X-Men #266',4,'Marvel Comics · edición individual a color.',145.00,0.160,4,4,'https://upload.wikimedia.org/wikipedia/en/9/94/Gambit_%28Marvel_Comics%29.png','active'),
  (1,'MNG-OP-102','One Piece Vol. 102',1,'Panini Manga · edición individual a color.',159.00,0.160,18,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg','active'),
  (2,'MNG-OP-102','One Piece Vol. 102',1,'Panini Manga · edición individual a color.',159.00,0.160,12,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg','active'),
  (3,'MNG-OP-102','One Piece Vol. 102',1,'Panini Manga · edición individual a color.',159.00,0.160,9,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg','active'),
  (1,'MNG-JJK-24','Jujutsu Kaisen Vol. 24',1,'Panini Manga · edición individual a color.',165.00,0.160,14,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg','active'),
  (2,'MNG-JJK-24','Jujutsu Kaisen Vol. 24',1,'Panini Manga · edición individual a color.',165.00,0.160,10,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg','active'),
  (3,'MNG-JJK-24','Jujutsu Kaisen Vol. 24',1,'Panini Manga · edición individual a color.',165.00,0.160,7,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg','active'),
  (1,'MNG-DS-23','Demon Slayer: Kimetsu no Yaiba Vol. 23',1,'Panini Manga · edición individual a color.',149.00,0.160,11,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png','active'),
  (2,'MNG-DS-23','Demon Slayer: Kimetsu no Yaiba Vol. 23',1,'Panini Manga · edición individual a color.',149.00,0.160,8,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png','active'),
  (3,'MNG-DS-23','Demon Slayer: Kimetsu no Yaiba Vol. 23',1,'Panini Manga · edición individual a color.',149.00,0.160,6,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png','active'),
  (1,'MNG-DBS-18','Dragon Ball Super Vol. 18',1,'Panini Manga · edición individual a color.',155.00,0.160,9,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx86508-QSahE7mTFEXl.png','active'),
  (3,'MNG-DBS-18','Dragon Ball Super Vol. 18',1,'Panini Manga · edición individual a color.',155.00,0.160,5,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx86508-QSahE7mTFEXl.png','active'),
  (1,'MNG-BSK-41','Berserk Vol. 41',1,'Panini Manga · edición individual a color.',349.00,0.160,5,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg','active'),
  (2,'MNG-BSK-41','Berserk Vol. 41',1,'Panini Manga · edición individual a color.',349.00,0.160,3,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg','active'),
  (3,'MNG-BSK-41','Berserk Vol. 41',1,'Panini Manga · edición individual a color.',349.00,0.160,2,4,'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg','active');

-- ---------------------------------------------------------------------
--  Figuras de colección (also en migración 2026_08_28_000005_figures_seed.sql)
--  description = "<Fabricante> · <Escala/Línea> · <detalle>"
-- ---------------------------------------------------------------------
INSERT INTO `products`
  (`branch_id`,`sku`,`name`,`category_id`,`description`,`price`,`tax_rate`,`stock`,`min_stock`,`image_url`,`status`) VALUES
  (1,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,5,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=front,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=side,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=back','active'),
  (2,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,3,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=front,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=side,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=back','active'),
  (3,'FIG-GSC-GOJO17','Gojo Satoru 1/7',2,'Good Smile Company · Escala 1/7 · Jujutsu Kaisen, con efecto de Infinito y base temática. PVC pintado a mano, ~26 cm.',2490.00,0.160,2,2,'catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=front,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=side,catalog/cover?kind=figura&t=Gojo%20Satoru%201%2F7&pub=GOOD%20SMILE%20COMPANY&accent=%238b5bff&a=back','active'),
  (1,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,8,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=front,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=side,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=back','active'),
  (2,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,6,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=front,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=side,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=back','active'),
  (3,'FIG-GSC-LUFFYG5','Monkey D. Luffy Gear 5 - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · One Piece, Luffy en Gear 5. PVC, ~17 cm.',1150.00,0.160,4,3,'catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=front,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=side,catalog/cover?kind=figura&t=Luffy%20Gear%205&pub=POP%20UP%20PARADE&accent=%2300e5ff&a=back','active'),
  (1,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,7,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=front,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=side,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=back','active'),
  (2,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,5,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=front,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=side,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=back','active'),
  (3,'FIG-GSC-NEZUKO1194','Nezuko Kamado Nendoroid #1194',2,'Good Smile Company · Nendoroid #1194 · Demon Slayer, partes intercambiables y caja de bambú. ~10 cm.',1390.00,0.160,3,3,'catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=front,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=side,catalog/cover?kind=figura&t=Nezuko%20Nendoroid%20%231194&pub=GOOD%20SMILE%20COMPANY&accent=%23ff2d95&a=back','active'),
  (1,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,6,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=front,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=side,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=back','active'),
  (2,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,4,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=front,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=side,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=back','active'),
  (3,'FIG-GSC-ERENPUP','Eren Yeager Titan Form - POP UP PARADE',2,'Good Smile Company · POP UP PARADE · Attack on Titan, Eren en Forma de Titán. PVC, ~19 cm.',1200.00,0.160,3,3,'catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=front,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=side,catalog/cover?kind=figura&t=Eren%20Titan%20Form&pub=POP%20UP%20PARADE&accent=%237a5c3e&a=back','active'),
  (1,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,3,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=front,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=side,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=back','active'),
  (2,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,2,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=front,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=side,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=back','active'),
  (3,'FIG-KOTO-ARTORIA17','Artoria Pendragon 1/7',2,'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.',3800.00,0.160,2,2,'catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=front,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=side,catalog/cover?kind=figura&t=Artoria%20Pendragon%201%2F7&pub=KOTOBUKIYA&accent=%23ffd400&a=back','active');

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
