-- =====================================================================
-- GeekPoint — Independizar tomos de manga (producción)
-- Generado el 2026-10-01 a partir del inventario de geekpoint.com.mx.
--
-- Crea la ficha propia de cada tomo (Vol. 1..N) de las 21 series de manga
-- (fichas MNG-S-*), con stock 0 en TODAS las sucursales activas.
--   * NO toca cómics (Batman #142, Gwenpool #25…: son números sueltos).
--   * INSERT IGNORE + clave única (branch_id, sku): nunca pisa un tomo que
--     ya exista ni su stock; solo rellena las sucursales que le falten.
--     Se puede ejecutar más de una vez sin duplicar nada.
--   * Precio, descuento, IVA, imagen y descripción se copian de la ficha
--     de la serie.
--   * Excluye tomos que ya existen con otro SKU: One Piece 105 (MNG-OPC-105),
--     Spy x Family 11 (MNG-SPY-11) y Demon Slayer 23 (MNG-KNY-23).
--
-- Ejecútalo en phpMyAdmin sobre la base u944194875_geekpoint (pestaña SQL
-- o Importar). Recomendado: Exportar un respaldo antes.
-- =====================================================================

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_nums;
CREATE TEMPORARY TABLE tmp_nums (n INT NOT NULL PRIMARY KEY);
INSERT INTO tmp_nums (n) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31),(32),(33),(34),(35),(36),(37),(38),(39),(40),(41),(42),(43),(44),(45),(46),(47),(48),(49),(50),(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),(61),(62),(63),(64),(65),(66),(67),(68),(69),(70),(71),(72),(73),(74),(75),(76),(77),(78),(79),(80),(81),(82),(83),(84),(85),(86),(87),(88),(89),(90),(91),(92),(93),(94),(95),(96),(97),(98),(99),(100),(101),(102),(103),(104),(105),(106),(107),(108);

-- MNG-S-AOT -> MNG-AOT-NN  (Vol. 1-34)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-AOT-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-AOT' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 34;

-- MNG-S-BSK -> MNG-BSK-NN  (Vol. 1-42)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-BSK-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-BSK' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 42;

-- MNG-S-BLE -> MNG-BLE-NN  (Vol. 1-74)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-BLE-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-BLE' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 74;

-- MNG-S-DND -> MNG-DND-NN  (Vol. 1-15)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-DND-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-DND' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 15;

-- MNG-S-DS -> MNG-DS-NN  (Vol. 1-23, sin 23)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-DS-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-DS' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 23 AND v.n NOT IN (23);

-- MNG-S-KGY -> MNG-KGY-NN  (Vol. 1-28)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-KGY-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-KGY' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 28;

-- MNG-S-SXF -> MNG-SXF-NN  (Vol. 1-13, sin 11)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-SXF-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-SXF' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 13 AND v.n NOT IN (11);

-- MNG-S-TG -> MNG-TG-NN  (Vol. 1-14)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-TG-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-TG' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 14;

-- MNG-S-VS -> MNG-VS-NN  (Vol. 1-28)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-VS-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-VS' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 28;

-- MNG-S-BLK -> MNG-BLK-NN  (Vol. 1-27)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-BLK-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-BLK' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 27;

-- MNG-S-CSM -> MNG-CSM-NN  (Vol. 1-17)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-CSM-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-CSM' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 17;

-- MNG-S-DN -> MNG-DN-NN  (Vol. 1-12)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-DN-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-DN' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 12;

-- MNG-S-FRN -> MNG-FRN-NN  (Vol. 1-13)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-FRN-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-FRN' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 13;

-- MNG-S-FMA -> MNG-FMA-NN  (Vol. 1-27)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-FMA-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-FMA' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 27;

-- MNG-S-HQ -> MNG-HQ-NN  (Vol. 1-45)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-HQ-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-HQ' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 45;

-- MNG-S-HXH -> MNG-HXH-NN  (Vol. 1-37)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-HXH-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-HXH' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 37;

-- MNG-S-JJK -> MNG-JJK-NN  (Vol. 1-27)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-JJK-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-JJK' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 27;

-- MNG-S-MHA -> MNG-MHA-NN  (Vol. 1-40)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-MHA-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-MHA' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 40;

-- MNG-S-NRT -> MNG-NRT-NN  (Vol. 1-72)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-NRT-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-NRT' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 72;

-- MNG-S-OP -> MNG-OP-NN  (Vol. 1-108, sin 105)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-OP-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-OP' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 108 AND v.n NOT IN (105);

-- MNG-S-ONK -> MNG-ONK-NN  (Vol. 1-14)
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-ONK-', IF(v.n < 10, CONCAT('0', v.n), v.n)),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       0, s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-ONK' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN tmp_nums v ON v.n BETWEEN 1 AND 14;

DROP TEMPORARY TABLE IF EXISTS tmp_nums;

COMMIT;

-- Comprobación (opcional): tomos por serie y sucursal
-- SELECT LEFT(sku, CHAR_LENGTH(sku) - LOCATE('-', REVERSE(sku))) AS serie, branch_id, COUNT(*) AS tomos
--   FROM products WHERE sku REGEXP '^MNG-[A-Z]+-[0-9]+$' GROUP BY serie, branch_id ORDER BY serie, branch_id;
