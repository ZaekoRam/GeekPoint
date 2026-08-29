-- =====================================================================
--  Migración 2026-08-28 · Cómics extra + mangas de volumen alto
--    mysql -u root geekpoint_pos < database/migrations/2026_08_28_000004_extra_titles.sql
-- =====================================================================
SET NAMES utf8mb4;

DELETE FROM `products` WHERE `sku` IN ('CMC-GWEN-1','CMC-GWEN-25','CMC-DP-45','CMC-UXM-266','MNG-OP-102','MNG-JJK-24','MNG-DS-23','MNG-DBS-18','MNG-BSK-41');

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

-- Categoría "Preventas" (para el alta manual desde el panel de admin).
INSERT INTO `categories` (`id`,`slug`,`name_es`,`name_en`,`icon`,`sort_order`)
  VALUES (6,'preventa','Preventas','Pre-orders','🎫',6)
  ON DUPLICATE KEY UPDATE `name_es` = VALUES(`name_es`), `name_en` = VALUES(`name_en`);
