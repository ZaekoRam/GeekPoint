-- =====================================================================
-- GeekPoint — Blue Lock: tomos 28 a 38
-- Generado el 2026-10-02.
--
-- La tienda conoce Blue Lock Vol. 28-38 (portadas de MangaDex) pero en el
-- inventario solo existían los tomos 1-27, así que esos salían "Agotado".
-- Este script los da de alta de verdad:
--   1. La serie y sus tomos pasan de "· 27 tomos" a "· 38 tomos".
--   2. Crea MNG-BLK-28 … MNG-BLK-38 en TODAS las sucursales activas,
--      copiando precio, IVA, descuento, imagen y descripción de la serie
--      (MNG-S-BLK), con stock aleatorio de 2 a 10 (igual que el resto de
--      Blue Lock). Para crearlos en 0, cambia  FLOOR(2 + RAND() * 9)  por  0.
--   3. Registra ese stock inicial como movimiento "restock" (se ve en
--      Inventario → Movimientos).
-- Seguro de re-ejecutar: INSERT IGNORE + clave única (branch_id, sku) no
-- duplica ni pisa el stock, y el movimiento solo se registra para tomos
-- que todavía no tienen ninguno.
--
-- Ejecútalo en phpMyAdmin (pestaña SQL). Recomendado: Exportar un respaldo antes.
-- =====================================================================

START TRANSACTION;

-- 1) "· 27 tomos" -> "· 38 tomos" (la tienda y el POS leen de aquí cuántos tomos hay)
UPDATE products
   SET description = REPLACE(description, '· 27 tomos', '· 38 tomos')
 WHERE sku = 'MNG-S-BLK' OR sku REGEXP '^MNG-BLK-[0-9]+$';

-- 2) Tomos 28-38 en cada sucursal activa
INSERT IGNORE INTO products (branch_id, sku, name, category_id, description, tags, price, discount_percent, discount_starts_at, discount_ends_at, tax_rate, stock, min_stock, image_url, figure_png_url, status)
SELECT b.id,
       CONCAT('MNG-BLK-', v.n),
       CONCAT(s.name, ' Vol. ', v.n),
       s.category_id, s.description, s.tags, s.price,
       s.discount_percent, s.discount_starts_at, s.discount_ends_at, s.tax_rate,
       FLOOR(2 + RAND() * 9), s.min_stock, s.image_url, NULL, 'active'
  FROM (SELECT * FROM products WHERE sku = 'MNG-S-BLK' ORDER BY branch_id LIMIT 1) s
  JOIN branches b ON b.status = 'active'
  JOIN (SELECT 28 AS n UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31
        UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
        UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38) v;

-- 3) Stock inicial como movimiento de reabastecimiento
INSERT INTO stock_movements (branch_id, product_id, user_id, type, quantity_delta, resulting_stock, reference, note)
SELECT p.branch_id, p.id, NULL, 'restock', p.stock, p.stock, '', 'Alta Blue Lock Vol. 28-38'
  FROM products p
 WHERE p.sku REGEXP '^MNG-BLK-(2[89]|3[0-8])$'
   AND p.stock > 0
   AND NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);

COMMIT;

-- Comprobación (opcional): tomos y stock de Blue Lock por sucursal
-- SELECT b.name, COUNT(*) AS tomos, SUM(p.stock) AS stock, MAX(CAST(SUBSTRING_INDEX(p.sku, '-', -1) AS UNSIGNED)) AS ultimo
--   FROM products p JOIN branches b ON b.id = p.branch_id
--  WHERE p.sku REGEXP '^MNG-BLK-[0-9]+$'
--  GROUP BY b.name;
