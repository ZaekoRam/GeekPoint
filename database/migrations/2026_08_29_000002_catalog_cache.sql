-- =============================================================
--  catalog_cache — caché del catálogo externo (AniList / Jikan)
--  con MySQL como almacén PRIMARIO (antes solo api/cache/catalog.json).
--
--  La tienda pública consume SIEMPRE esta caché; las APIs externas
--  únicamente se consultan cuando llega ?refresh=1 (botón "Reintentar"
--  del panel) o ?warm=1 (cron recomendado, p.ej. cada 6 h):
--
--      curl -s "https://TU-DOMINIO/api/catalog?warm=1" > /dev/null
--
--  Si esta tabla no existe, CatalogController cae al archivo JSON.
-- =============================================================
CREATE TABLE IF NOT EXISTS `catalog_cache` (
  `cache_key`  VARCHAR(64) NOT NULL,
  `payload`    LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cache_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
