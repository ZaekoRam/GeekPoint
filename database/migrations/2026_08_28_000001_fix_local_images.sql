-- =====================================================================
--  Migración 2026-08-28 · Portadas reales para productos locales
--  TARJETAS TCG y CÓMICS: asigna image_url para que ninguna tarjeta/cómic
--  muestre el bloque genérico sin imagen.
--  Aplicar sobre una BD ya sembrada:
--    mysql -u root geekpoint_pos < database/migrations/2026_08_28_000001_fix_local_images.sql
-- =====================================================================
SET NAMES utf8mb4;

-- ---- TARJETAS TCG ----------------------------------------------------
UPDATE `products` SET `image_url` =
  'https://images.pokemontcg.io/sv3pt5/199_hires.png'
  WHERE `sku` = 'TCG-PKM-151';

UPDATE `products` SET `image_url` =
  'catalog/cover?kind=tcg&pub=ONE%20PIECE&t=One%20Piece%20TCG'
  WHERE `sku` = 'TCG-OP-ETB';

UPDATE `products` SET `image_url` =
  'https://api.scryfall.com/cards/named?exact=Cavern%20of%20Souls&format=image&version=large'
  WHERE `sku` = 'TCG-MTG-LCI';

-- ---- CÓMICS (portadas reales HD de Wikimedia; fallback SVG en el front) ----
UPDATE `products` SET `image_url` =
  'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png'
  WHERE `sku` = 'CMC-BAT-2024';

UPDATE `products` SET `image_url` =
  'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg'
  WHERE `sku` = 'CMC-SPD-300';

UPDATE `products` SET `image_url` =
  'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg'
  WHERE `sku` = 'CMC-XMEN-35';

UPDATE `products` SET `image_url` =
  'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg'
  WHERE `sku` = 'CMC-INV-01';
