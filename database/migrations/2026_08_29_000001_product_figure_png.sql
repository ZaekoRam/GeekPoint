-- =============================================================
--  products.figure_png_url
--  Figura / personaje RECORTADO (PNG transparente) para la vista 3D
--  "pop-out" del Hero y del modal de detalle.
--  Queda SEPARADO de image_url, que son SOLO las fotos reales de
--  galería del producto (1+ URLs separadas por coma).
--  Nullable: si el admin no ingresa URL, se guarda NULL.
-- =============================================================
ALTER TABLE `products`
  ADD COLUMN `figure_png_url` TEXT NULL
  AFTER `image_url`;
