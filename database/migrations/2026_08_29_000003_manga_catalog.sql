-- =============================================================
--  Catálogo de MANGA en MySQL (tabla `products`)
--  -----------------------------------------------------------
--  La tienda pública lee el catálogo de mangas 100% desde aquí
--  (vía /api/catalog, que consulta `products`). El navegador ya NO
--  consulta AniList/Jikan directamente.
--
--  · Una fila de SERIE por manga y por sucursal (SKU `MNG-S-<código>`).
--  · `image_url` vacío  → el front genera el arte "manga ink" en el
--    navegador (data-URI SVG), sin ninguna petición de imagen.
--  · La descripción lleva "<sinopsis> · <N> tomos"; el API extrae el
--    número de tomos y limpia ese sufijo de la sinopsis.
--  · Idempotente: `WHERE NOT EXISTS` — se puede re-ejecutar sin duplicar.
--
--  Los tomos sueltos que ya existan (`MNG-JJK-24`, etc.) se pliegan
--  dentro de su serie como opciones de tomo en el modal.
-- =============================================================

INSERT INTO `products`
  (`branch_id`, `sku`, `name`, `category_id`, `description`,
   `price`, `tax_rate`, `stock`, `min_stock`, `image_url`, `status`)
SELECT
  b.id,
  s.sku,
  s.name,
  (SELECT id FROM `categories` WHERE `slug` = 'manga' LIMIT 1),
  CONCAT(s.syn, ' · ', s.vols, ' tomos'),
  s.price,
  0.160,
  FLOOR(3 + RAND() * 15),
  4,
  '',
  'active'
FROM `branches` b
CROSS JOIN (
            SELECT 'MNG-S-JJK' AS sku, 'Jujutsu Kaisen' AS name, 189.00 AS price, 27 AS vols,
                   'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones.' AS syn
  UNION ALL SELECT 'MNG-S-CSM', 'Chainsaw Man', 179.00, 17,
                   'Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública.'
  UNION ALL SELECT 'MNG-S-OP', 'One Piece', 165.00, 108,
                   'Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas.'
  UNION ALL SELECT 'MNG-S-DS', 'Demon Slayer', 159.00, 23,
                   'Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko.'
  UNION ALL SELECT 'MNG-S-SXF', 'Spy x Family', 179.00, 13,
                   'Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra.'
  UNION ALL SELECT 'MNG-S-DND', 'Dandadan', 175.00, 15,
                   'Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales.'
  UNION ALL SELECT 'MNG-S-ONK', 'Oshi no Ko', 179.00, 14,
                   'Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento.'
  UNION ALL SELECT 'MNG-S-BLK', 'Blue Lock', 169.00, 27,
                   '300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés.'
  UNION ALL SELECT 'MNG-S-BSK', 'Berserk', 349.00, 42,
                   'Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios.'
  UNION ALL SELECT 'MNG-S-VS', 'Vinland Saga', 229.00, 28,
                   'Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos.'
  UNION ALL SELECT 'MNG-S-AOT', 'Attack on Titan', 169.00, 34,
                   'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos.'
  UNION ALL SELECT 'MNG-S-NRT', 'Naruto', 155.00, 72,
                   'Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea.'
  UNION ALL SELECT 'MNG-S-BLE', 'Bleach', 159.00, 74,
                   'Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos.'
  UNION ALL SELECT 'MNG-S-FMA', 'Fullmetal Alchemist', 189.00, 27,
                   'Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida.'
  UNION ALL SELECT 'MNG-S-DN', 'Death Note', 149.00, 12,
                   'Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios.'
  UNION ALL SELECT 'MNG-S-TG', 'Tokyo Ghoul', 165.00, 14,
                   'Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos.'
  UNION ALL SELECT 'MNG-S-MHA', 'My Hero Academia', 165.00, 40,
                   'En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno.'
  UNION ALL SELECT 'MNG-S-HXH', 'Hunter x Hunter', 159.00, 37,
                   'Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen.'
  UNION ALL SELECT 'MNG-S-HQ', 'Haikyu!!', 155.00, 45,
                   'Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto.'
  UNION ALL SELECT 'MNG-S-KGY', 'Kaguya-sama: Love is War', 169.00, 28,
                   'Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota.'
  UNION ALL SELECT 'MNG-S-FRN', 'Frieren: Beyond Journey''s End', 175.00, 13,
                   'La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían.'
) s
WHERE NOT EXISTS (
  SELECT 1 FROM `products` p WHERE p.branch_id = b.id AND p.sku = s.sku
);
