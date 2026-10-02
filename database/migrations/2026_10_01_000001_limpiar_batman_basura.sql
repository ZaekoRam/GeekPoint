-- =====================================================================
-- GeekPoint — Limpieza: fichas basura de "Batman #142 (variante)"
-- Generado el 2026-10-01.
--
-- El botón "Independizar" (ya eliminado del panel) tomó el número del cómic
-- (#142) como cantidad de tomos y creó CMC-BAT-04 … CMC-BAT-99 en las 4
-- sucursales (384 registros, stock 0, sin ventas).
--
-- Borra SOLO esas fichas. Protecciones:
--   * nunca toca CMC-BAT-142 (el cómic real, con su stock)
--   * solo stock = 0
--   * solo las que no tengan ventas (sale_items)
--   * solo las creadas el 2026-10-01 o después (las del botón)
-- =====================================================================

-- Vista previa (ejecútala primero si quieres ver cuántas se borrarán):
-- SELECT COUNT(*) FROM products
--  WHERE sku REGEXP '^CMC-BAT-[0-9]+$' AND sku <> 'CMC-BAT-142'
--    AND stock = 0 AND created_at >= '2026-10-01';

START TRANSACTION;

DELETE FROM products
 WHERE sku REGEXP '^CMC-BAT-[0-9]+$'
   AND sku <> 'CMC-BAT-142'
   AND stock = 0
   AND created_at >= '2026-10-01'
   AND id NOT IN (SELECT product_id FROM (SELECT DISTINCT product_id FROM sale_items
                                          WHERE product_id IS NOT NULL) AS vendidos);

COMMIT;
