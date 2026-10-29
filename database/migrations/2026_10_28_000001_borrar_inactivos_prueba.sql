-- =====================================================================
--  GeekPoint — Borrar los 4 productos INACTIVOS de prueba
-- =====================================================================
--  FIG-GOJO-16         Figura Gojo Satoru 1/7     (duplicado de GOJO 1/7)
--  FIG-EREN-POP        Funko Pop! Eren Titán
--  CMC-BAT-142         Batman #142 (variante)
--  FIG-KOTO-ARTORIA17  Artoria Pendragon 1/7      (solo portadas generadas)
--
--  Qué pasa con lo relacionado (llaves foráneas del esquema):
--    * inventory, product_images, product_tags, stock_alerts -> se borran.
--    * sale_items, reservation_items, stock_movements -> se CONSERVAN;
--      solo quedan con product_id = NULL. Tickets e historial siguen
--      mostrando nombre, SKU y precio (se guardaron al vender).
--
--  Solo borra si el producto SIGUE inactivo: si alguien lo reactivó,
--  no se toca. Se puede correr las veces que sea.
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELETE FROM `products`
 WHERE `status` = 'inactive'
   AND `sku` IN ('FIG-GOJO-16', 'FIG-EREN-POP', 'CMC-BAT-142', 'FIG-KOTO-ARTORIA17');

-- Fuerza que la tienda vuelva a leer el catálogo.
DELETE FROM `catalog_cache`;

INSERT IGNORE INTO `schema_migrations` (`version`) VALUES ('2026_10_28_000001');
