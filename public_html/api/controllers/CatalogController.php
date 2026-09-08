<?php
/**
 * Catálogo público de la tienda e-commerce.
 * Consume la API pública y gratuita de Jikan (MyAnimeList) para portadas reales.
 * Cachea el resultado 24 h en api/cache/catalog.json para respetar el rate-limit.
 * Si Jikan no responde, devuelve source="unavailable" y el front usa su respaldo local.
 */
class CatalogController extends Controller
{
    const CACHE_TTL = 604800;  // 7 días — "frescura" del catálogo cacheado.
                               // Al expirar NO se reconstruye en la petición de
                               // un visitante: se sirve viejo (stale) y solo un
                               // ?refresh=1 / ?warm=1 (botón admin o cron) llama
                               // a las APIs externas. La tienda lee 100% caché.
    const VOL_TTL   = 604800;  // 7 días (portadas por tomo)
    const TR_TTL    = 2592000; // 30 días (sinopsis traducidas)
    const TR_BUDGET = 12;      // s máx. de traducción por reconstrucción
    const JIKAN    = 'https://api.jikan.moe/v4';
    const ANILIST  = 'https://graphql.anilist.co';
    const MANGADEX = 'https://api.mangadex.org';
    const MD_UPLOADS = 'https://uploads.mangadex.org';
    const GTRANSLATE = 'https://translate.googleapis.com/translate_a/single';

    /** Segundos gastados traduciendo en esta petición (presupuesto TR_BUDGET). */
    private $trSpent = 0.0;

    /** Series curadas: query Jikan => metadatos de tienda */
    private static function seed()
    {
        return [
            ['q' => 'Jujutsu Kaisen',        'cat' => 'manga',   'price' => 189, 'tag' => 'novedad', 'mal' => 113138],
            ['q' => 'Chainsaw Man',          'cat' => 'manga',   'price' => 179, 'tag' => 'novedad'],
            ['q' => 'One Piece',             'cat' => 'manga',   'price' => 165, 'tag' => ''],
            ['q' => 'Kimetsu no Yaiba',      'cat' => 'manga',   'price' => 159, 'tag' => ''],
            ['q' => 'Spy x Family',          'cat' => 'manga',   'price' => 179, 'tag' => ''],
            ['q' => 'Dandadan',              'cat' => 'manga',   'price' => 175, 'tag' => 'preventa'],
            ['q' => 'Oshi no Ko',            'cat' => 'manga',   'price' => 179, 'tag' => 'preventa'],
            ['q' => 'Blue Lock',             'cat' => 'manga',   'price' => 169, 'tag' => ''],
            ['q' => 'Berserk',               'cat' => 'manga',   'price' => 349, 'tag' => '', 'mal' => 2,     'tomos' => 41],
            ['q' => 'Vinland Saga',          'cat' => 'manga',   'price' => 229, 'tag' => ''],
            ['q' => 'Hunter x Hunter',       'cat' => 'manga',   'price' => 159, 'tag' => ''],
            ['q' => 'Boku no Hero Academia', 'cat' => 'manga',   'price' => 165, 'tag' => '', 'name' => 'My Hero Academia'],
            ['q' => 'Shingeki no Kyojin',    'cat' => 'manga',   'price' => 169, 'tag' => '', 'name' => 'Attack on Titan', 'mal' => 23390, 'tomos' => 34],
            ['q' => 'Solo Leveling',         'cat' => 'manga',   'price' => 219, 'tag' => 'novedad'],
            ['q' => 'Sousou no Frieren',     'cat' => 'manga',   'price' => 175, 'tag' => 'preventa', 'name' => 'Frieren: Beyond Journey\'s End'],
            ['q' => 'Naruto',                'cat' => 'manga',   'price' => 155, 'tag' => '', 'mal' => 11],
            ['q' => 'Bleach',                'cat' => 'manga',   'price' => 159, 'tag' => '', 'mal' => 12],
            ['q' => 'Death Note',            'cat' => 'manga',   'price' => 149, 'tag' => '', 'mal' => 21],
            ['q' => 'Fullmetal Alchemist',   'cat' => 'manga',   'price' => 189, 'tag' => '', 'mal' => 25],
            ['q' => 'Tokyo Ghoul',           'cat' => 'manga',   'price' => 165, 'tag' => ''],
            ['q' => 'Haikyuu!!',             'cat' => 'manga',   'price' => 155, 'tag' => '', 'name' => 'Haikyu!!'],
            ['q' => 'Kaguya-sama wa Kokurasetai', 'cat' => 'manga', 'price' => 169, 'tag' => '', 'name' => 'Kaguya-sama: Love is War'],
            ['q' => 'JoJo no Kimyou na Bouken', 'cat' => 'comics', 'price' => 299, 'tag' => '', 'name' => "JoJo's Bizarre Adventure"],
            ['q' => 'Tower of God',          'cat' => 'comics',  'price' => 269, 'tag' => 'novedad'],
            ['q' => 'The God of High School', 'cat' => 'comics', 'price' => 249, 'tag' => ''],
            ['q' => 'Omniscient Reader',     'cat' => 'comics',  'price' => 279, 'tag' => '', 'name' => "Omniscient Reader's Viewpoint"],
            ['q' => 'Noblesse',              'cat' => 'comics',  'price' => 239, 'tag' => ''],
            ['q' => 'Lookism',               'cat' => 'comics',  'price' => 229, 'tag' => ''],
            ['q' => 'Jujutsu Kaisen 0',      'cat' => 'figuras', 'price' => 2490, 'tag' => 'preventa', 'name' => 'Gojo Satoru - Figura 1/7'],
            ['q' => 'Chainsaw Man',          'cat' => 'figuras', 'price' => 1890, 'tag' => '', 'name' => 'Power - Figura S.H.F.'],
            ['q' => 'Kimetsu no Yaiba',      'cat' => 'figuras', 'price' => 1690, 'tag' => '', 'name' => 'Nezuko - Figura 1/8'],
            ['q' => 'Re:Zero kara Hajimeru Isekai Seikatsu', 'cat' => 'figuras', 'price' => 2190, 'tag' => '', 'name' => 'Rem - Figura 1/7'],
            ['q' => 'Spy x Family',          'cat' => 'figuras', 'price' => 1290, 'tag' => 'novedad', 'name' => 'Anya Forger - Nendoroid'],
            ['q' => 'Darling in the FranXX', 'cat' => 'figuras', 'price' => 2290, 'tag' => '', 'name' => 'Zero Two - Figura 1/7'],
            ['q' => 'Sousou no Frieren',     'cat' => 'figuras', 'price' => 1990, 'tag' => 'preventa', 'name' => 'Frieren - Figura 1/7'],
            ['q' => 'Pokemon Adventures',    'cat' => 'tcg',     'price' => 1290, 'tag' => 'novedad', 'name' => 'Pokemon TCG - Elite Trainer Box'],
            ['q' => 'One Piece',             'cat' => 'tcg',     'price' => 1490, 'tag' => '', 'name' => 'One Piece TCG - Booster Box'],
            ['q' => 'Yu-Gi-Oh!',             'cat' => 'tcg',     'price' => 1190, 'tag' => '', 'name' => 'Yu-Gi-Oh! TCG - Structure Deck'],
            ['q' => 'Magic The Gathering',   'cat' => 'tcg',     'price' => 1390, 'tag' => '', 'name' => 'Magic - Play Booster Box'],
        ];
    }

    private static function branchesPool()
    {
        return [
            ['code' => 'GKP-CDMX', 'name' => 'Reforma'],
            ['code' => 'GKP-GDL',  'name' => 'Chapultepec'],
            ['code' => 'GKP-MTY',  'name' => 'Valle'],
        ];
    }

    private function cacheFile()
    {
        return dirname(__DIR__) . '/cache/catalog.json';
    }

    /**
     * Caché del catálogo externo con MySQL como almacén PRIMARIO
     * (tabla `catalog_cache`) y el archivo JSON como respaldo — así funciona
     * aunque `api/cache/` no sea escribible en el hosting, y los datos de las
     * APIs externas quedan "guardados en la base de datos" como pide el flujo.
     *
     * @return array|null  ['payload' => array, 'age' => int segundos] o null
     */
    private function cacheGet()
    {
        // 1) MySQL
        if (Database::ping()) {
            try {
                $row = Database::one(
                    "SELECT payload, UNIX_TIMESTAMP(updated_at) AS ts
                       FROM catalog_cache WHERE cache_key = 'catalog' LIMIT 1",
                    []
                );
                if ($row && !empty($row['payload'])) {
                    $data = json_decode($row['payload'], true);
                    if (is_array($data) && !empty($data['products'])) {
                        return ['payload' => $data, 'age' => max(0, time() - (int) $row['ts'])];
                    }
                }
            } catch (\Throwable $e) {
                // tabla ausente (migración sin correr) -> se intenta el archivo
            }
        }
        // 2) Archivo JSON
        $file = $this->cacheFile();
        if (is_file($file)) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data) && !empty($data['products'])) {
                return ['payload' => $data, 'age' => max(0, time() - (int) filemtime($file))];
            }
        }
        return null;
    }

    /** Guarda el catálogo en MySQL (primario) y en el archivo JSON (respaldo). */
    private function cachePut(array $payload)
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if (Database::ping()) {
            try {
                Database::run(
                    "INSERT INTO catalog_cache (cache_key, payload, updated_at)
                     VALUES ('catalog', ?, NOW())
                     ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = NOW()",
                    [$json]
                );
            } catch (\Throwable $e) {
                // sin tabla: el archivo abajo cubre
            }
        }
        $file = $this->cacheFile();
        @mkdir(dirname($file), 0775, true);
        @file_put_contents($file, $json);
    }

    private function volCacheFile($name)
    {
        // Prefijo `volb_`: invalida la caché `vol_` vieja (traía cruces como
        // "Berserk" -> "Berserk of Gluttony").
        return dirname(__DIR__) . '/cache/volb_' . md5(mb_strtolower(trim($name))) . '.json';
    }

    /**
     * ID de MangaDex FIJO para series que la búsqueda por título confunde con
     * spin-offs (Berserk vs "Berserk of Gluttony") o que quedan fuera por el
     * filtro de contentRating.  key = nombre normalizado (sólo alfanumérico).
     */
    private function mangadexIdMap()
    {
        return [
            'berserk' => '801513ba-a712-498c-8f57-cae55b38cc92',
        ];
    }

    /** Añade `volume_covers` a los productos de manga/cómic. */
    private function attachVolumeCovers(array &$products, $warm)
    {
        foreach ($products as &$prod) {
            $cat = $prod['category'] ?? '';
            if ($cat !== 'manga' && $cat !== 'comics') continue;
            // MangaDex indexa por el título original (romaji/japonés). Usar el
            // título localizado ("Attack on Titan", "My Hero Academia") trae la
            // serie equivocada -> se prioriza `search_title` (= la query semilla).
            $q = $prod['search_title'] ?? $prod['series'] ?? $prod['title'];
            $covers = $this->volumeCovers($q, $warm);
            if ($covers) $prod['volume_covers'] = $covers;
        }
        unset($prod);
    }

    /**
     * GET /catalog  — lista de productos para la tienda.
     * GET /catalog?cat=manga  — filtrado por categoría.
     *
     * RUTA DEL VISITANTE (sin ?refresh / ?warm): 100% LOCAL, CERO llamadas a
     * APIs externas. Orden de fuentes:
     *   1) tabla MySQL `products`  (localProducts)
     *   2) MySQL `catalog_cache` / archivo catalog.json  (datos externos ya guardados)
     *   3) fallback PHP estático  (fallbackCatalog — sin red)
     * Además `ensureCategories()` rellena cualquier categoría clave que falte
     * (p.ej. manga) desde el fallback PHP, así la tienda SIEMPRE tiene catálogo
     * aunque la BD esté vacía y sin que el navegador consulte nada externo.
     *
     * Solo `?refresh=1` (botón del panel) o `?warm=1` (cron) reconstruyen desde
     * AniList/Jikan — jamás en una navegación normal.
     */
    public function index()
    {
        $force = $this->query('refresh') === '1';
        $warm  = $this->query('warm') === '1';
        $rebuild = $force || $warm;
        $cat = $this->catParam();

        if (!$rebuild) {
            // ===== CATÁLOGO DETERMINISTA =====
            // Solo la tabla MySQL `products` + el respaldo estático PHP.
            // NO se mezcla el catálogo cacheado de AniList/Jikan: esa mezcla
            // hacía que entre refrescos aparecieran/desaparecieran mangas y
            // que algún cómic cayera en 'manga' (y al revés). Un visitante
            // NUNCA dispara peticiones externas y ve SIEMPRE lo mismo.
            $local = $this->localProducts();
            $src = $local ? 'local' : 'php-fallback';

            $products = $this->canonicalize($local);            // categoría canónica + portadas garantizadas
            $products = $this->ensureCategories($products);     // rellena categorías vacías desde el fallback
            if (!$products) $products = $this->fallbackCatalog();
            $products = $this->canonicalize($products);         // cubre lo añadido por el fallback

            Response::ok([
                'products' => $this->filterCat($products, $cat),
                'source'   => $src,
                'cached'   => true,
                'ts'       => time(),
            ]);
        }

        // --- Reconstrucción explícita (panel / cron): AniList -> Jikan ---
        $built = $this->buildFromAniList();
        $source = 'anilist';
        if (!$built || count($built) === 0) {
            $built = $this->buildFromJikan();
            $source = 'jikan';
        }

        if ($built && count($built) > 0) {
            $payload = [
                'products'     => $built,
                'source'       => $source,
                'generated_at' => date('c'),
            ];
            $this->cachePut($payload);
            $this->attachVolumeCovers($payload['products'], $warm);
            $this->mergeLocalProducts($payload['products']);
            $payload['products'] = $this->canonicalize($payload['products']);
            Response::ok($payload + ['cached' => false, 'ts' => time()]);
        }

        // Reconstrucción fallida -> caché vieja -> local -> fallback PHP.
        $cache = $this->cacheGet();
        if ($cache) {
            $payload = $cache['payload'];
            $this->attachVolumeCovers($payload['products'], false);
            $this->mergeLocalProducts($payload['products']);
            $payload['products'] = $this->canonicalize($payload['products']);
            Response::ok($payload + ['cached' => true, 'stale' => true, 'ts' => time()]);
        }
        $local = $this->ensureCategories($this->localProducts());
        if (!$local) $local = $this->fallbackCatalog();
        $local = $this->canonicalize($local);
        Response::ok([
            'products' => $this->filterCat($local, $cat),
            'source'   => 'local',
            'ts'       => time(),
        ]);
    }

    /**
     * GET /catalog/branches — sucursales ACTIVAS para la tienda pública (sin auth).
     *
     * Lee directamente la tabla `branches`. Es la fuente que consumen las 3
     * zonas dinámicas del front (tarjetas "Nuestras sucursales", filas de
     * "Stock por sucursal" del modal y el <select> "Sucursal para recoger").
     * Si MySQL no responde devuelve una lista vacía y el navegador usa su
     * respaldo estático (lib/manifest.js -> window.__BRAND__.branches).
     */
    public function branches()
    {
        $out = [];
        if (Database::ping()) {
            try {
                // `b.*` para no romper si la columna `hours` aún no existe
                // (migración 2026_09_03_000001 sin ejecutar) — el front la
                // completa con un horario por defecto en ese caso.
                $rows = Database::all(
                    "SELECT b.*
                       FROM branches b
                      WHERE b.status = 'active'
                      ORDER BY b.id"
                );
                foreach (($rows ?: []) as $r) {
                    $out[] = [
                        'id'      => (int) $r['id'],
                        'code'    => (string) $r['code'],
                        'name'    => (string) $r['name'],
                        'city'    => (string) $r['city'],
                        'state'   => (string) $r['state'],
                        'address' => (string) $r['address'],
                        'phone'   => (string) $r['phone'],
                        'hours'   => (string) ($r['hours'] ?? ''),
                        'status'  => (string) $r['status'],
                    ];
                }
            } catch (\Throwable $e) {
                $out = [];
            }
        }
        Response::ok(['branches' => $out, 'ts' => time()]);
    }

    /** ?cat=<slug> saneado ('' si no se pidió o no es válido). */
    private function catParam()
    {
        $c = strtolower(trim((string) $this->query('cat', '')));
        $ok = ['manga', 'figuras', 'tcg', 'comics', 'preventa'];
        return in_array($c, $ok, true) ? $c : '';
    }

    /** Filtra la lista por categoría (preventa = categoría o tag). */
    private function filterCat(array $list, $cat)
    {
        if ($cat === '') return array_values($list);
        return array_values(array_filter($list, function ($p) use ($cat) {
            if ($cat === 'preventa') {
                return ($p['category'] ?? '') === 'preventa'
                    || in_array('preventa', (array) ($p['tags'] ?? []), true);
            }
            return ($p['category'] ?? '') === $cat;
        }));
    }

    /** Une productos locales (mandan) + externos, sin duplicar por título/serie. */
    private function mergeCatalogs(array $local, array $ext)
    {
        if (!$ext) return $local;
        $norm = function ($s) {
            return preg_replace('/[^a-z0-9]+/', '', mb_strtolower(preg_replace('/\s+(vol\.?|tomo|#)\s*\d+.*$/i', '', (string) $s)));
        };
        $seen = [];
        foreach ($local as $p) { $seen[$norm($p['title'] ?? '')] = true; }
        $out = $local;
        foreach ($ext as $p) {
            $k = $norm($p['title'] ?? '');
            if ($k === '' || isset($seen[$k])) continue;
            $seen[$k] = true;
            $out[] = $p;
        }
        return $out;
    }

    /**
     * Si falta alguna categoría clave (manga, figuras, tcg, comics) rellena
     * con el fallback PHP — sin pedir NADA a la red.
     */
    private function ensureCategories(array $products)
    {
        $have = [];
        foreach ($products as $p) { $have[$p['category'] ?? ''] = true; }
        $need = array_filter(['manga', 'figuras', 'tcg', 'comics'], function ($c) use ($have) {
            return empty($have[$c]);
        });
        if (!$need) return $products;

        foreach ($this->fallbackCatalog() as $p) {
            if (in_array($p['category'], $need, true)) $products[] = $p;
        }
        return $products;
    }

    /** Añade al catálogo los productos reales del POS (categorías tcg/comics). */
    private function mergeLocalProducts(array &$products)
    {
        $local = $this->localProducts();
        if ($local) {
            array_splice($products, 0, 0, $local);   // primero, para que se vean arriba
        }
    }

    /** Stock sintético determinista por sucursal (mismo criterio que el front). */
    private function synthBranches($id)
    {
        $seed = abs(crc32((string) $id));
        $out = [];
        foreach (self::branchesPool() as $i => $b) {
            $stock = ($seed >> ($i * 3)) % 16;
            if ($stock > 0 || $i === 0) {
                $out[] = ['code' => $b['code'], 'name' => $b['name'], 'stock' => $stock];
            }
        }
        return $out;
    }

    /**
     * FALLBACK 100% PHP — catálogo de respaldo SIN red ni APIs externas.
     * Se usa cuando la BD no tiene productos (o le falta una categoría).
     * Las portadas NO se fijan: el front genera su arte "manga ink" en el
     * navegador (data-URI SVG), así que no hay ninguna petición de imagen.
     */
    private function fallbackCatalog()
    {
        // [title, author, category, price, tags, volumes, accent, synopsis]
        $rows = [
            ['Jujutsu Kaisen', 'Gege Akutami', 'manga', 189, ['novedad'], 27, '#8b5bff', 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones.'],
            ['Chainsaw Man', 'Tatsuki Fujimoto', 'manga', 179, ['novedad'], 17, '#ff2d95', 'Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública.'],
            ['One Piece', 'Eiichiro Oda', 'manga', 165, [], 108, '#00e5ff', 'Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas.'],
            ['Demon Slayer', 'Koyoharu Gotouge', 'manga', 159, [], 23, '#0b8a3d', 'Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko.'],
            ['Spy x Family', 'Tatsuya Endo', 'manga', 179, [], 13, '#ffd400', 'Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra.'],
            ['Dandadan', 'Yukinobu Tatsu', 'manga', 175, ['preventa'], 15, '#00e5ff', 'Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales.'],
            ['Oshi no Ko', 'Aka Akasaka', 'manga', 179, ['preventa'], 14, '#ff2d95', 'Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento.'],
            ['Blue Lock', 'Muneyuki Kaneshiro', 'manga', 169, [], 27, '#8b5bff', '300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés.'],
            ['Berserk', 'Kentaro Miura', 'manga', 349, [], 42, '#e4002b', 'Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios.'],
            ['Vinland Saga', 'Makoto Yukimura', 'manga', 229, [], 28, '#0b8a3d', 'Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos.'],
            ['Attack on Titan', 'Hajime Isayama', 'manga', 169, [], 34, '#7a5c3e', 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos.'],
            ['Naruto', 'Masashi Kishimoto', 'manga', 155, [], 72, '#ffd400', 'Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea.'],
            ['Bleach', 'Tite Kubo', 'manga', 159, [], 74, '#00e5ff', 'Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos.'],
            ['Fullmetal Alchemist', 'Hiromu Arakawa', 'manga', 189, [], 27, '#e4002b', 'Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida.'],
            ['Death Note', 'Tsugumi Ohba', 'manga', 149, [], 12, '#8b5bff', 'Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios.'],
            ['Tokyo Ghoul', 'Sui Ishida', 'manga', 165, [], 14, '#ff2d95', 'Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos.'],
            ['My Hero Academia', 'Kohei Horikoshi', 'manga', 165, [], 40, '#0b8a3d', 'En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno.'],
            ['Hunter x Hunter', 'Yoshihiro Togashi', 'manga', 159, [], 37, '#0b8a3d', 'Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen.'],
            ['Haikyu!!', 'Haruichi Furudate', 'manga', 155, [], 45, '#ffd400', 'Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto.'],
            ['Kaguya-sama: Love is War', 'Aka Akasaka', 'manga', 169, [], 28, '#ff2d95', 'Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota.'],
            ['Frieren: Beyond Journey\'s End', 'Kanehito Yamada', 'manga', 175, ['preventa'], 13, '#00e5ff', 'La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían.'],
            ['JoJo\'s Bizarre Adventure', 'Hirohiko Araki', 'comics', 299, [], 8, '#ffd400', 'La saga de la familia Joestar contra fuerzas sobrenaturales a lo largo de generaciones y continentes.'],
            ['Invincible', 'Robert Kirkman', 'comics', 329, [], 25, '#00e5ff', 'Mark Grayson hereda los poderes de su padre, el superhéroe más poderoso del planeta… y su terrible secreto.'],
            ['Solo Leveling', 'Chugong', 'comics', 259, ['novedad'], 12, '#8b5bff', 'El cazador más débil de la humanidad, Sung Jin-Woo, obtiene un sistema que le permite subir de nivel sin límite.'],
            ['Tower of God', 'SIU', 'comics', 269, [], 10, '#00e5ff', 'Bam entra a una torre infinita para alcanzar a Rachel, la única persona que conoció, y enfrenta una prueba en cada piso.'],
            ['Batman: Year One', 'Frank Miller', 'comics', 349, [], 1, '#ffd400', 'El primer año de Bruce Wayne como Batman y el de Jim Gordon en una Gotham podrida hasta los cimientos.'],
            ['The Sandman', 'Neil Gaiman', 'comics', 389, [], 10, '#8b5bff', 'Sueño, uno de los Eternos, escapa tras 70 años de cautiverio y debe reconstruir su reino y enmendar sus errores.'],
            ['Watchmen', 'Alan Moore', 'comics', 359, [], 1, '#ff2d95', 'En una América alterna, el asesinato de un vigilante retirado destapa una conspiración que redefine el heroísmo.'],
            ['Gojo Satoru - Figura 1/7', 'GeekPoint Collection', 'figuras', 2490, ['preventa'], 0, '#8b5bff', 'Escala 1/7, PVC pintado a mano, 27 cm. Incluye efecto de Infinito y base temática.'],
            ['Power - Figura S.H.F.', 'GeekPoint Collection', 'figuras', 1890, [], 0, '#ff2d95', 'Figura articulada de 16 cm con accesorios intercambiables y hacha de sangre.'],
            ['Nezuko - Figura 1/8', 'GeekPoint Collection', 'figuras', 1690, [], 0, '#ff2d95', 'Escala 1/8, 21 cm, con caja de bambú y pose de combate en modo demonio.'],
            ['Rem - Figura 1/7', 'GeekPoint Collection', 'figuras', 2190, [], 0, '#00e5ff', 'Re:Zero. Escala 1/7, 24 cm, con maza y efecto de agua translúcido.'],
            ['Anya Forger - Nendoroid', 'GeekPoint Collection', 'figuras', 1290, ['novedad'], 0, '#ffd400', 'Spy x Family. Nendoroid de 10 cm con tres caras intercambiables, incluida la sonrisa "heh".'],
            ['Makima - Figura 1/7', 'GeekPoint Collection', 'figuras', 2390, ['preventa'], 0, '#e4002b', 'Chainsaw Man. Escala 1/7, 25 cm, con base de cadenas y mirada de Control.'],
            ['Levi Ackerman - Figura 1/7', 'GeekPoint Collection', 'figuras', 2290, [], 0, '#7a5c3e', 'Attack on Titan. Escala 1/7, 26 cm, en pose de maniobra con equipo tridimensional.'],
            ['Megumin - Nendoroid', 'GeekPoint Collection', 'figuras', 1190, [], 0, '#ff2d95', 'KonoSuba. Nendoroid de 10 cm con báculo, efecto de explosión y cara de conjuro.'],
            ['Pokémon TCG - Elite Trainer Box', 'The Pokémon Company', 'tcg', 1290, ['novedad'], 0, '#ffd400', 'Caja con 9 sobres, 65 fundas, 45 cartas de Energía, dados y contadores de daño.'],
            ['One Piece TCG - Booster Box', 'Bandai', 'tcg', 1490, [], 0, '#e4002b', 'Caja sellada con 24 sobres del set más reciente. Ideal para draft y coleccionismo.'],
            ['Magic - Bundle', 'Wizards of the Coast', 'tcg', 1190, [], 0, '#8b5bff', '9 sobres de Colección, 20 tierras foil, caja de almacenamiento y contador giratorio.'],
            ['Yu-Gi-Oh! - Structure Deck', 'Konami', 'tcg', 349, [], 0, '#8b5bff', 'Baraja de 40 cartas lista para jugar, con estrategia enfocada y cartas exclusivas.'],
            ['Disney Lorcana - Illumineer\'s Trove', 'Ravensburger', 'tcg', 1390, ['novedad'], 0, '#00e5ff', '8 sobres, dos mazos de inicio, cartas de tinta y organizador para empezar a jugar.'],
        ];

        $out = [];
        foreach ($rows as $r) {
            list($title, $author, $cat, $price, $tags, $vols, $accent, $syn) = $r;
            $id = 'fb-' . $cat . '-' . trim(preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($title)), '-');
            $cover = $this->coverFor($title, $cat, $author, $accent);   // portada garantizada
            $out[] = [
                'id'           => $id,
                'title'        => $title,
                'series'       => $title,
                'search_title' => $title,
                'author'       => $author,
                'category'     => $cat,
                'price'        => (float) $price,
                'currency'     => 'MXN',
                'cover'        => $cover,
                'cover_raw'    => $cover,
                'image_url'    => $cover,
                'images'       => [$cover],
                'tags'         => $tags,
                'synopsis'     => $syn,
                'volumes'      => $vols ?: null,
                'tomos'        => $vols ?: null,
                'score'        => null,
                'accent'       => $accent,
                'source'       => 'fallback',
                'branches'     => $this->synthBranches($id),
            ];
        }
        return $out;
    }

    /**
     * Productos del inventario POS agrupados por SKU (suma stock de sucursales).
     * Solo categorías que se muestran en la tienda pública.
     * @return array
     */
    private function localProducts()
    {
        // Sin BD (p. ej. MySQL mal configurado en el hosting) el catálogo público
        // sigue funcionando solo con las APIs externas: no reventamos la respuesta.
        if (!Database::ping()) {
            return [];
        }
        // La columna `products.tags` puede no existir aún (migración
        // 2026_09_08_000001 sin ejecutar): se detecta para no romper el catálogo.
        $hasTags = false;
        try {
            $hasTags = (bool) Database::scalar(
                "SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tags' LIMIT 1"
            );
        } catch (\Throwable $e) {}

        try {
            // El filtro de categoría es por TEXTO (slug o nombre ES/EN en
            // minúsculas), NUNCA por id numérico — los ids no coinciden entre
            // el entorno local y Hostinger.
            $rows = Database::all(
                "SELECT p.sku,
                        MAX(p.name)          AS name,
                        c.slug               AS cat_slug,
                        MAX(c.name_es)       AS cat_es,
                        MAX(c.name_en)       AS cat_en,
                        MAX(p.description)   AS description,
                        " . ($hasTags ? "MAX(p.tags)" : "''") . " AS tags,
                        MAX(p.image_url)     AS image_url,
                        MAX(p.figure_png_url) AS figure_png_url,
                        MAX(UNIX_TIMESTAMP(p.updated_at)) AS updated_ts,
                        ROUND(AVG(p.price), 2) AS price,
                        SUM(p.stock)         AS stock,
                        GROUP_CONCAT(CONCAT(b.id, '|', b.code, '|', b.name, '|', p.stock) SEPARATOR ';;') AS branchmap
                 FROM products p
                 JOIN categories c ON c.id = p.category_id
                 LEFT JOIN branches b ON b.id = p.branch_id
                 WHERE p.status = 'active'
                   AND ( LOWER(c.slug)    IN ('manga','mangas','figura','figuras','tcg','comic','comics','cómic','cómics','preventa','preventas')
                      OR LOWER(c.name_es) IN ('manga','mangas','figura','figuras','tcg','tarjetas tcg','cartas tcg','comic','comics','cómic','cómics','preventa','preventas')
                      OR LOWER(c.name_en) IN ('manga','figures','figure','tcg','trading cards','comic','comics','pre-order','preorder')
                      OR p.image_url <> '' )
                 GROUP BY p.sku, c.slug
                 ORDER BY name",
                []
            );
        } catch (\Throwable $e) {
            return [];
        }

        $out = [];
        foreach (($rows ?: []) as $r) {
            // Categoría por TEXTO (slug/nombre), nunca por id.
            $category = $this->catSlug($r['cat_slug'] ?? '', $r['cat_es'] ?? '', $r['cat_en'] ?? '');

            $branches = [];
            foreach (explode(';;', (string) $r['branchmap']) as $chunk) {
                $parts = explode('|', $chunk);
                if (count($parts) === 4) {
                    $branches[] = [
                        'id'    => (int) $parts[0],
                        'code'  => $parts[1],
                        'name'  => $parts[2],
                        'stock' => (int) $parts[3],
                    ];
                }
            }

            $segs = array_map('trim', explode('·', (string) $r['description']));

            // Rareza SOLO para cartas TCG y SOLO de un segmento CORTO. Una rareza
            // real es "Rare" / "Ultra Rare" / "Special Illustration Rare"… nunca
            // una sinopsis: el patrón `\blegend\w*` cazaba "legendario" en la
            // descripción de One Piece y la volcaba entera como rareza.
            $rarity = '';
            if ($category === 'tcg') {
                foreach ($segs as $dp) {
                    if ($dp !== '' && mb_strlen($dp) <= 28
                        && preg_match('/\b(rare|common|uncommon|promo|holo|illustration|ultra|secret|amazing|radiant|legend)\w*/i', $dp)) {
                        $rarity = $dp;
                        break;
                    }
                }
            }

            // Figuras: "<Fabricante> · <Escala/Línea> · <detalle>"
            $manufacturer = '';
            $scale = '';
            if ($category === 'figuras') {
                $makers = ['Good Smile Company', 'Kotobukiya', 'Max Factory', 'Bandai', 'Banpresto',
                           'Aniplex', 'Alter', 'Kadokawa', 'FuRyu', 'Furyu', 'SEGA', 'Taito',
                           'MegaHouse', 'Megahouse', 'Prime 1 Studio', 'Union Creative', 'GSC'];
                $scaleRe = '/(1\s*\/\s*\d{1,2}|Nendoroid[^·]*|POP\s*UP\s*PARADE|figma|S\.?H\.?\s*Figuarts|Pop Up Parade|Escala\s*\d)/i';
                foreach ($segs as $s) {
                    if ($manufacturer === '') {
                        foreach ($makers as $m) {
                            if (stripos($s, $m) !== false) { $manufacturer = $s; break; }
                        }
                    }
                    if ($scale === '' && preg_match($scaleRe, $s)) $scale = preg_replace('/^escala\s*/i', '', $s);
                }
                if ($manufacturer === '' && isset($segs[0])) $manufacturer = $segs[0];
                if ($scale === '' && isset($segs[1])) $scale = $segs[1];
            }

            // image_url puede traer VARIAS URLs separadas por coma (galería multi-ángulo).
            // Cache-busting: a las imágenes SUBIDAS a este servidor se les añade
            // ?v=<updated_at>.  Las URLs vacías se resuelven luego en
            // canonicalize() con el mapa de portadas estáticas por título.
            $ts   = (int) ($r['updated_ts'] ?? 0);
            $imgs = array_values(array_filter(array_map('trim', explode(',', (string) $r['image_url'])), 'strlen'));
            $imgs = array_map(function ($u) use ($ts) { return $this->bustLocal($u, $ts); }, $imgs);

            // Nº de tomos: segmento "... · 27 tomos" en la descripción (opcional).
            $volumes = null;
            foreach ($segs as $sg) {
                if (preg_match('/^\s*(\d{1,3})\s*tomos?\s*$/iu', trim($sg), $mm)) {
                    $volumes = (int) $mm[1];
                    break;
                }
            }

            $figurePng = (isset($r['figure_png_url']) && $r['figure_png_url'] !== '')
                ? $this->bustLocal((string) $r['figure_png_url'], $ts)
                : null;

            // Sinopsis limpia: quita los segmentos "Fabricante · Escala · Alta manual"
            // para que la ficha de la tienda muestre solo el texto descriptivo.
            $synParts = [];
            foreach ($segs as $sg) {
                $sg = trim($sg);
                if ($sg === '' || strcasecmp($sg, 'Alta manual') === 0) continue;
                if ($manufacturer !== '' && strcasecmp($sg, trim($manufacturer)) === 0) continue;
                if ($scale !== '' && strcasecmp($sg, trim($scale)) === 0) continue;
                if (preg_match('/^\s*\d{1,3}\s*tomos?\s*$/iu', $sg)) continue;   // "27 tomos"
                $synParts[] = $sg;
            }
            $synopsisText = $synParts ? implode(' · ', $synParts) : (string) $r['description'];

            // Portada GARANTIZADA no vacía: image_url real -> mapa estático ->
            // /uploads/<slug> -> generador SVG on-origin.
            $cover = $this->coverFor($r['name'], $category, '', '', $imgs[0] ?? '', $ts);

            $out[] = [
                'id'           => 'local-' . $category . '-' . trim(preg_replace('/[^a-z0-9]+/i', '-', strtolower((string) $r['sku'])), '-'),
                'title'        => $r['name'],
                'author'       => '',
                'category'     => $category,
                'price'        => (float) $r['price'],
                'currency'     => 'MXN',
                'cover'        => $cover,
                'cover_raw'    => $imgs[0] ?? $cover,
                'image_url'    => $cover,               // alias explícito para el JSON / debug
                'images'       => $imgs ?: [$cover],
                'figure_png_url' => $figurePng,   // PNG recortado (transparente) para la vista 3D pop-out
                'tags'         => array_values(array_filter(array_map('trim', explode(',', (string) ($r['tags'] ?? ''))), 'strlen')),
                'rarity'       => $rarity,
                'manufacturer' => $manufacturer,
                'scale'        => $scale,
                'synopsis'     => $synopsisText,
                'volumes'      => $volumes,
                'tomos'        => $volumes,
                'score'        => null,
                'source'       => 'local',
                'branches'     => $branches,
            ];
        }
        return $out;
    }

    /**
     * Añade ?v=<ts> SOLO a imágenes subidas a este servidor (/uploads/products/).
     * No toca data: URIs, el proxy catalog/image ni CDNs externos.
     */
    private function bustLocal($url, $ts)
    {
        $url = trim((string) $url);
        if ($url === '' || $ts <= 0) return $url;
        if (strncmp($url, 'data:', 5) === 0) return $url;
        if (strpos($url, '/uploads/products/') === false) return $url;
        if (preg_match('/[?&]v=\d+/', $url)) return $url;   // ya lleva bust
        return $url . (strpos($url, '?') === false ? '?' : '&') . 'v=' . $ts;
    }

    /**
     * Título normalizado para usar como clave (minúsculas, sin marcador de
     * volumen, solo alfanumérico).  "Berserk Vol. 41" -> "berserk".
     */
    private function normTitle($s)
    {
        $s = mb_strtolower(trim((string) $s));
        $s = preg_replace('/\s+(vol\.?|volumen|tomo|t\.?|#|n[°º]\.?)\s*\d+.*$/u', '', $s);
        return preg_replace('/[^a-z0-9]+/', '', (string) $s);
    }

    /**
     * Slug CANÓNICO de categoría a partir del texto (slug / nombre ES / nombre
     * EN) — nunca de IDs numéricos, que difieren entre local y Hostinger.
     * Devuelve uno de: manga | figuras | tcg | comics | preventa (o el
     * original en minúsculas si no reconoce nada).
     */
    private function catSlug($slug, $nameEs = '', $nameEn = '')
    {
        $canon = ['manga', 'figuras', 'tcg', 'comics', 'preventa'];
        $s = strtolower(trim((string) $slug));
        if (in_array($s, $canon, true)) return $s;

        $alias = [
            'manga' => 'manga', 'mangas' => 'manga',
            'figura' => 'figuras', 'figuras' => 'figuras', 'figures' => 'figuras', 'figure' => 'figuras',
            'tcg' => 'tcg', 'tarjetas tcg' => 'tcg', 'cartas tcg' => 'tcg', 'trading cards' => 'tcg', 'tarjetas' => 'tcg',
            'comic' => 'comics', 'comics' => 'comics', 'cómic' => 'comics', 'cómics' => 'comics', 'comic-book' => 'comics',
            'preventa' => 'preventa', 'preventas' => 'preventa', 'pre-order' => 'preventa', 'preorder' => 'preventa', 'pre-venta' => 'preventa',
        ];
        foreach ([$s, strtolower(trim((string) $nameEs)), strtolower(trim((string) $nameEn))] as $cand) {
            if ($cand !== '' && isset($alias[$cand])) return $alias[$cand];
        }
        return $s !== '' ? $s : 'manga';
    }

    /**
     * URL de portada GARANTIZADA (nunca vacía/nula).  SIN dependencias de
     * runtime: solo URLs que el <img> del navegador carga directo o un
     * data-URI embebido. Cascada:
     *   1) `image_url` real de la BD  (con cache-busting si es /uploads/)
     *   2) mapa de portadas estáticas por título  (manga -> URL CDN DIRECTA)
     *   3) archivo local  /uploads/covers/<slug>.jpg|png|webp  ó  /uploads/<cat>/<slug>.jpg
     *   4) data-URI SVG generado aquí en PHP  (embebido, siempre pinta, cero red)
     */
    private function coverFor($title, $category, $author = '', $accent = '', $rawUrl = '', $ts = 0)
    {
        $rawUrl = trim((string) $rawUrl);
        if ($rawUrl !== '') return $this->bustLocal($rawUrl, $ts);

        $cat = $this->catSlug($category);
        $key = $this->normTitle($title);

        // Portada estática de CDN — URL DIRECTA (el <img> la carga sin CORS ni
        // proxy; solo el visor 3D necesitaría proxy y ya degrada solo).
        if ($cat === 'manga') {
            $m = $this->mangaCoverMap();
            if ($key !== '' && isset($m[$key])) return $m[$key];
        }

        // Archivo local que el admin haya subido a /uploads/… (URL absoluta al
        // dominio, NO relativa al /api).
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', mb_strtolower((string) $title)), '-');
        if ($slug !== '') {
            $root = dirname(dirname(__DIR__));   // .../public_html
            foreach (["uploads/covers/$slug.jpg", "uploads/covers/$slug.png", "uploads/covers/$slug.webp",
                      "uploads/$cat/$slug.jpg", "uploads/$cat/$slug.png", "uploads/$slug.jpg"] as $rel) {
                if (is_file($root . '/' . $rel)) return $this->publicUrl($rel);
            }
        }

        // Último recurso: data-URI embebido (no pega a ningún endpoint).
        return $this->dataCover($title, $cat, $accent);
    }

    /** URL pública ABSOLUTA (dominio + subcarpeta) para un archivo de public_html/. */
    private function publicUrl($rel)
    {
        $https = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
            || (($_SERVER['SERVER_PORT'] ?? '') == 443);
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $base = str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php')));
        $base = ($base === '/' || $base === '.') ? '' : rtrim($base, '/');
        return ($https ? 'https' : 'http') . '://' . $host . $base . '/' . ltrim((string) $rel, '/');
    }

    /**
     * Portada de respaldo como data-URI SVG (se pinta SIEMPRE, sin ninguna
     * petición). Sobria: fondo oscuro, título, regla de acento y GEEKPOINT —
     * SIN la banda de color a todo lo ancho ("caja flotante azul") que se quitó.
     */
    private function dataCover($title, $category, $accent = '')
    {
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', (string) $accent)) {
            $pal = ['manga' => '#8b5bff', 'comics' => '#e4002b', 'tcg' => '#00e5ff', 'figuras' => '#ff2d95', 'preventa' => '#ffd400'];
            $accent = $pal[$category] ?? '#8b5bff';
        }
        $label = strtoupper((string) ($category ?: 'GEEKPOINT'));
        $enc = function ($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };

        // Título en 1-3 líneas.
        $words = preg_split('/\s+/', trim(mb_substr((string) $title, 0, 70)));
        $lines = []; $cur = '';
        foreach ($words as $w) {
            if (mb_strlen(trim($cur . ' ' . $w)) > 14 && $cur !== '') { $lines[] = $cur; $cur = $w; }
            else { $cur = trim($cur . ' ' . $w); }
        }
        if ($cur !== '') $lines[] = $cur;
        $lines = array_slice($lines, 0, 3);
        $y0 = 400 - (count($lines) - 1) * 40;
        $tsp = '';
        foreach ($lines as $i => $l) {
            $tsp .= '<text x="46" y="' . ($y0 + $i * 66) . '" font-family="Anton,Arial Black,sans-serif" '
                . 'font-size="' . (mb_strlen($l) > 11 ? 40 : 50) . '" fill="#e8e8ee">' . $enc($l) . '</text>';
        }

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">'
            . '<rect width="600" height="800" fill="#141419"/>'
            . '<rect x="16" y="16" width="568" height="768" fill="none" stroke="' . $accent . '" stroke-width="6" opacity="0.55"/>'
            . '<rect x="46" y="150" width="120" height="8" fill="' . $accent . '"/>'
            . '<text x="46" y="130" font-family="JetBrains Mono,monospace" font-size="22" letter-spacing="6" fill="#8b8b96">' . $enc($label) . '</text>'
            . $tsp
            . '<text x="46" y="746" font-family="Bangers,Anton,sans-serif" font-size="26" letter-spacing="2" fill="' . $accent . '">GEEKPOINT</text>'
            . '</svg>';

        return 'data:image/svg+xml;charset=utf-8,' . rawurlencode($svg);
    }

    /**
     * Mapa de PORTADAS ESTÁTICAS por título (CDN AniList, alta calidad) para los
     * mangas cuyo `image_url` está vacío/nulo (antes se traían en vivo).  URLs
     * fijas y verificadas (HTTP 200).  Se devuelven DIRECTAS: el `<img>` del
     * navegador las carga sin CORS ni proxy y sin que este servidor tenga que
     * hacer ninguna petición saliente.  Lo que no esté en el mapa cae a
     * `dataCover()` (data-URI embebido).
     */
    private function mangaCoverMap()
    {
        $A = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/';
        return [
            'jujutsukaisen'             => $A . 'bx101517-H3TdM3g5ZUe9.jpg',
            'chainsawman'               => $A . 'bx105778-euxXZEIfDY2u.png',
            'onepiece'                  => $A . 'bx30013-BeslEMqiPhlk.jpg',
            'demonslayer'               => $A . 'bx87216-c9bSNVD10UuD.png',
            'demonslayerkimetsunoyaiba' => $A . 'bx87216-c9bSNVD10UuD.png',
            'kimetsunoyaiba'            => $A . 'bx87216-c9bSNVD10UuD.png',
            'spyxfamily'                => $A . 'bx108556-NHjkz0BNJhLx.jpg',
            'dandadan'                  => $A . 'bx132029-prGF4gePdSKv.jpg',
            'oshinoko'                  => $A . 'bx117195-r3kf8eF0xkDJ.png',
            'bluelock'                  => $A . 'bx106130-yPNeuSu75ey1.jpg',
            'berserk'                   => $A . 'bx30002-Cul4OeN7bYtn.jpg',
            'vinlandsaga'               => $A . 'bx30642-0mjRDkf4THpo.jpg',
            'hunterxhunter'             => $A . 'bx30026-uCvXMudMzmwI.jpg',
            'myheroacademia'            => $A . 'bx85486-INqnYx8gL3eX.jpg',
            'bokunoheroacademia'        => $A . 'bx85486-INqnYx8gL3eX.jpg',
            'attackontitan'            => $A . 'bx53390-1RsuABC34P9D.jpg',
            'shingekinokyojin'         => $A . 'bx53390-1RsuABC34P9D.jpg',
            'sololeveling'              => $A . 'bx105398-b673Vt5ZSuz3.jpg',
            'frieren'                   => $A . 'bx118586-CXKgWikBFQgS.jpg',
            'frierenbeyondjourneysend'  => $A . 'bx118586-CXKgWikBFQgS.jpg',
            'sousounofrieren'           => $A . 'bx118586-CXKgWikBFQgS.jpg',
            'jojosbizarreadventure'     => $A . 'bx88339-aGpw5a4g81Au.jpg',
            'jojonokimyounabouken'      => $A . 'bx88339-aGpw5a4g81Au.jpg',
            'dragonballsuper'           => $A . 'bx86508-QSahE7mTFEXl.png',
            'naruto'                    => $A . 'nx30011-9yUF1dXWgDOx.jpg',
            'bleach'                    => $A . 'bx30012-1epmVfTSv2rr.png',
            'deathnote'                 => $A . 'bx30021-FE6kmrfpuKyb.jpg',
            'fullmetalalchemist'        => $A . 'bx30025-mpPVpCKFTowt.png',
            'haganenorenkinjutsushi'    => $A . 'bx30025-mpPVpCKFTowt.png',
            'tokyoghoul'                => $A . 'bx63327-glC9cDxYBja9.png',
            'haikyu'                    => $A . 'bx65243-mR4MnJFmfaOF.png',
            'haikyuu'                   => $A . 'bx65243-mR4MnJFmfaOF.png',
            'kaguyasamaloveiswar'       => $A . 'bx86635-EdaLQmsn86Fy.png',
            'kaguyasamawakokurasetai'   => $A . 'bx86635-EdaLQmsn86Fy.png',
        ];
    }

    /**
     * Categoría CANÓNICA por título — arregla productos mal clasificados para
     * que cada uno aparezca estrictamente en su sección (manga japonés ->
     * `manga`; manhwa/webtoon coreano y cómic occidental -> `comics`).
     */
    private function titleCategoryMap()
    {
        static $map = null;
        if ($map !== null) return $map;
        $manga = [
            'Jujutsu Kaisen', 'Chainsaw Man', 'One Piece', 'Demon Slayer',
            'Demon Slayer: Kimetsu no Yaiba', 'Kimetsu no Yaiba', 'Spy x Family',
            'Dandadan', 'Oshi no Ko', 'Blue Lock', 'Berserk', 'Vinland Saga',
            'Attack on Titan', 'Shingeki no Kyojin', 'Naruto', 'Bleach',
            'Fullmetal Alchemist', 'Death Note', 'Tokyo Ghoul', 'My Hero Academia',
            'Boku no Hero Academia', 'Hunter x Hunter', 'Haikyu!!', 'Haikyuu!!',
            'Kaguya-sama: Love is War', "Frieren: Beyond Journey's End",
            'Sousou no Frieren', 'Frieren', 'Dragon Ball Super',
        ];
        $comics = [
            'Solo Leveling', 'Tower of God', 'The God of High School',
            'Omniscient Reader', "Omniscient Reader's Viewpoint", 'Noblesse',
            'Lookism', "JoJo's Bizarre Adventure", 'JoJo no Kimyou na Bouken',
            'Invincible', 'Batman: Year One', 'The Sandman', 'Watchmen',
        ];
        $map = [];
        foreach ($manga as $t)  $map[$this->normTitle($t)] = 'manga';
        foreach ($comics as $t) $map[$this->normTitle($t)] = 'comics';
        return $map;
    }

    /**
     * Enriquece TODA la lista final ANTES de filtrar por categoría:
     *   1) fija la categoría canónica por título (manga -> manga, manhwa -> comics)
     *   2) garantiza que `cover` / `image_url` / `cover_raw` / `images` NUNCA
     *      lleguen vacíos ni null (mapa estático -> /uploads -> generador SVG).
     */
    private function canonicalize(array $products)
    {
        $catMap = $this->titleCategoryMap();
        foreach ($products as &$p) {
            $title = (string) ($p['title'] ?? '');
            $key   = $this->normTitle($title);

            // 1) categoría canónica
            if ($key !== '' && isset($catMap[$key])) {
                $p['category'] = $catMap[$key];
            }
            $cat = $this->catSlug($p['category'] ?? 'manga');
            $p['category'] = $cat;

            // 2) portada garantizada — SIN depender del proxy ni de outbound.
            //    Una URL absoluta (CDN) o un data-URI se aceptan; un ref a un
            //    endpoint propio (catalog/cover, catalog/image) NO — se resuelve.
            $cur = $this->unproxy(trim((string) ($p['cover'] ?? '')));
            if ($cur === '') $cur = $this->unproxy(trim((string) ($p['cover_raw'] ?? '')));
            if ($cur !== '' && strncmp($cur, 'catalog/', 8) === 0) $cur = '';
            if ($cur === '') {
                $cur = $this->coverFor($title, $cat, (string) ($p['author'] ?? ''), (string) ($p['accent'] ?? ''));
            }
            $p['cover']     = $cur;
            $p['image_url'] = $cur;                       // string válido siempre
            $p['cover_raw'] = $cur;
            $imgs = array_values(array_filter(array_map(function ($u) {
                return $this->unproxy(trim((string) $u));
            }, (array) ($p['images'] ?? [])), 'strlen'));
            $p['images'] = $imgs ?: [$cur];
        }
        unset($p);
        return $products;
    }

    /**
     * `catalog/image?src=<url>`  ->  `<url>`  (URL directa del CDN).
     * Así el <img> del catálogo NO depende de que este servidor pueda hacer
     * peticiones salientes (en Hostinger a veces falla y la portada queda rota).
     * data: URIs y URLs normales se devuelven tal cual.
     */
    private function unproxy($url)
    {
        $url = trim((string) $url);
        if ($url === '' || strncmp($url, 'data:', 5) === 0) return $url;
        $pos = stripos($url, 'catalog/image?src=');
        if ($pos === false) return $url;
        $dec = urldecode(substr($url, $pos + strlen('catalog/image?src=')));
        return preg_match('#^https?://#i', $dec) ? $dec : $url;
    }

    /**
     * GET /catalog/cover?kind=comic|tcg&t=Título&pub=DC&n=142&accent=%23e4002b
     * Portada SVG generada (sin dependencias externas) para productos locales
     * sin imagen real. Siempre responde 200 con una portada representativa.
     */
    public function cover()
    {
        $kind  = preg_replace('/[^a-z]/', '', strtolower((string) $this->query('kind', 'item')));
        $title = mb_substr(trim((string) $this->query('t', 'GeekPoint')), 0, 60);
        $pub   = mb_strtoupper(mb_substr(trim((string) $this->query('pub', '')), 0, 22));
        $num   = preg_replace('/[^0-9A-Za-z#\.\-]/', '', (string) $this->query('n', ''));

        $palette = [
            'DC' => '#0476f2', 'MARVEL' => '#e4002b', 'IMAGE' => '#3a3a3a',
            'POKEMON' => '#ffcb05', 'MAGIC' => '#c9a227', 'ONE PIECE' => '#d1272e',
        ];
        $accent = (string) $this->query('accent', '');
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $accent)) {
            $accent = $palette[$pub] ?? ($kind === 'tcg' ? '#00e5ff' : '#8b5bff');
        }

        $isComic = ($kind === 'comic' || $kind === 'comics');
        $isFigure = ($kind === 'figura' || $kind === 'figuras' || $kind === 'figure');
        $isManga = ($kind === 'manga' || $kind === 'mangas');
        $catLabel = $isComic ? 'COMIC' : ($kind === 'tcg' ? 'TCG'
                  : ($isFigure ? 'FIGURA' : ($isManga ? 'MANGA' : 'GEEKPOINT')));
        // style=plain  -> portada sobria SIN la banda de acento con texto
        // (la "caja flotante azul" que se quitó del front).
        $plain = strtolower((string) $this->query('style', '')) === 'plain';
        $enc = function ($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };

        // ---- Render multi-ángulo para FIGURAS (caja de coleccionista + maniquí) ----
        if ($isFigure) {
            $badge = $pub !== '' ? $pub : $catLabel;
            $angle = strtolower(preg_replace('/[^a-z]/', '', (string) $this->query('a', 'front')));
            $angMap = ['front' => 'FRENTE', 'side' => 'PERFIL', 'back' => 'REVERSO'];
            $angLbl = $angMap[$angle] ?? 'FRENTE';

            // Maniquí sencillo; cambia según el ángulo.
            if ($angle === 'side') {
                $body = '<g transform="translate(300,300)">'
                    . '<circle cx="18" cy="-150" r="52" fill="#f3efe4"/>'
                    . '<path d="M6 -100 q60 30 40 150 q-6 120 -50 190 l-40 0 q-30 -150 -10 -230 q6 -80 60 -110Z" fill="#f3efe4"/>'
                    . '<path d="M20 -70 q70 40 40 130" fill="none" stroke="' . $accent . '" stroke-width="16" stroke-linecap="round"/>'
                    . '</g>';
            } elseif ($angle === 'back') {
                $body = '<g transform="translate(300,300)">'
                    . '<circle cx="0" cy="-150" r="54" fill="#e7e2d2"/>'
                    . '<path d="M-70 -95 q70 -30 140 0 q30 120 6 210 q-16 120 -76 190 q-60 -70 -76 -190 q-24 -90 6 -210Z" fill="#e7e2d2"/>'
                    . '<path d="M-30 -150 q30 -18 60 0" fill="none" stroke="#0c0c0e" stroke-width="8"/>'
                    . '<rect x="-40" y="-70" width="80" height="150" rx="14" fill="' . $accent . '" opacity=".85"/>'
                    . '</g>';
            } else {
                $body = '<g transform="translate(300,300)">'
                    . '<circle cx="0" cy="-150" r="54" fill="#f7f2e2"/>'
                    . '<circle cx="-18" cy="-155" r="6" fill="#0c0c0e"/><circle cx="18" cy="-155" r="6" fill="#0c0c0e"/>'
                    . '<path d="M-72 -95 q72 -34 144 0 q28 120 4 210 q-16 122 -76 194 q-60 -72 -76 -194 q-24 -90 4 -210Z" fill="#f7f2e2"/>'
                    . '<path d="M-64 -70 q-40 60 -30 150" fill="none" stroke="' . $accent . '" stroke-width="18" stroke-linecap="round"/>'
                    . '<path d="M64 -70 q40 60 30 150" fill="none" stroke="' . $accent . '" stroke-width="18" stroke-linecap="round"/>'
                    . '</g>';
            }

            $t2 = mb_strlen($title) > 24 ? mb_substr($title, 0, 23) . '…' : $title;
            $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">'
                . '<defs>'
                . '<linearGradient id="bx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#191922"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>'
                . '<radialGradient id="sp" cx="50%" cy="34%" r="52%"><stop offset="0" stop-color="' . $accent . '" stop-opacity=".5"/><stop offset="1" stop-color="' . $accent . '" stop-opacity="0"/></radialGradient>'
                . '</defs>'
                . '<rect width="600" height="800" fill="url(#bx)"/>'
                . '<rect width="600" height="800" fill="url(#sp)"/>'
                // marco acrílico
                . '<rect x="26" y="26" width="548" height="748" fill="none" stroke="' . $accent . '" stroke-width="4" opacity=".85"/>'
                . '<rect x="40" y="40" width="520" height="720" fill="none" stroke="#0c0c0e" stroke-width="10"/>'
                // plataforma giratoria
                . '<ellipse cx="300" cy="640" rx="150" ry="34" fill="#0c0c0e"/>'
                . '<ellipse cx="300" cy="632" rx="150" ry="34" fill="none" stroke="' . $accent . '" stroke-width="4"/>'
                . $body
                // encabezado
                . '<rect x="40" y="40" width="520" height="70" fill="' . $accent . '"/>'
                . '<text x="60" y="86" font-family="Anton, Arial Black, sans-serif" font-size="34" fill="#0c0c0e">' . $enc($t2) . '</text>'
                . '<text x="60" y="150" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="5" fill="#9a9aa8">' . $enc($badge) . '</text>'
                // etiqueta de ángulo
                . '<rect x="360" y="128" width="180" height="40" fill="#0c0c0e" stroke="' . $accent . '" stroke-width="2"/>'
                . '<text x="450" y="155" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="18" letter-spacing="3" fill="' . $accent . '">' . $enc($angLbl) . '</text>'
                . '<rect x="200" y="712" width="200" height="44" fill="' . $accent . '"/>'
                . '<text x="300" y="742" text-anchor="middle" font-family="Bangers, Anton, sans-serif" font-size="24" fill="#0c0c0e" letter-spacing="2">GEEKPOINT</text>'
                . '</svg>';

            header('Content-Type: image/svg+xml; charset=utf-8');
            header('Cache-Control: public, max-age=604800, immutable');
            header('Access-Control-Allow-Origin: *');
            echo $svg;
            exit;
        }

        // Título en 1-3 líneas.
        $words = preg_split('/\s+/', $title);
        $lines = []; $cur = '';
        foreach ($words as $w) {
            if (mb_strlen(trim($cur . ' ' . $w)) > 13 && $cur !== '') { $lines[] = $cur; $cur = $w; }
            else { $cur = trim($cur . ' ' . $w); }
        }
        if ($cur !== '') $lines[] = $cur;
        $lines = array_slice($lines, 0, 3);
        $startY = 430 - (count($lines) - 1) * 46;
        $tspans = '';
        foreach ($lines as $i => $l) {
            $tspans .= '<text x="46" y="' . ($startY + $i * 62) . '" font-family="Anton, Arial Black, sans-serif" '
                . 'font-size="' . (mb_strlen($l) > 10 ? 44 : 54) . '" fill="#f3efe4">' . $enc($l) . '</text>';
        }

        $badge = $pub !== '' ? $pub : $catLabel;
        $numBadge = $num !== '' ? (
            '<g transform="translate(486,120)">'
            . '<circle r="52" fill="#0c0c0e" stroke="' . $accent . '" stroke-width="6"/>'
            . '<text x="0" y="14" text-anchor="middle" font-family="Anton, sans-serif" font-size="' . ($num && mb_strlen($num) > 3 ? 26 : 40) . '" fill="' . $accent . '">' . $enc(ltrim($num, '#')) . '</text>'
            . '</g>'
        ) : '';

        // Cabecera: banda de acento (normal) o solo una regla fina (plain).
        if ($plain) {
            $header = '<rect x="46" y="86" width="120" height="8" fill="' . $accent . '"/>'
                . '<text x="46" y="72" font-family="JetBrains Mono, monospace" font-size="22" font-weight="700" '
                . 'letter-spacing="7" fill="#8b8b96">' . $enc($badge) . '</text>';
        } else {
            $header = '<polygon points="0,0 600,0 600,120 0,300" fill="' . $accent . '" opacity="0.92"/>'
                . '<polygon points="0,0 600,0 600,120 0,300" fill="none" stroke="#0c0c0e" stroke-width="6"/>'
                . '<text x="46" y="96" font-family="JetBrains Mono, monospace" font-size="24" font-weight="700" '
                . 'letter-spacing="7" fill="#0c0c0e">' . $enc($badge) . '</text>';
        }
        // En plain el título va en tono claro (ya no sobre la banda de color).
        $tsp = $plain ? str_replace('fill="#f3efe4"', 'fill="#e8e8ee"', $tspans) : $tspans;

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">'
            . '<defs><pattern id="ht" width="14" height="14" patternUnits="userSpaceOnUse">'
            . '<circle cx="3" cy="3" r="2.1" fill="rgba(255,255,255,.06)"/></pattern></defs>'
            . '<rect width="600" height="800" fill="#111014"/>'
            . '<rect width="600" height="800" fill="url(#ht)"/>'
            . ($plain ? '' : '<g stroke="#0c0c0e" stroke-width="3" opacity=".4">'
                . '<line x1="600" y1="800" x2="360" y2="470"/><line x1="600" y1="700" x2="320" y2="470"/>'
                . '<line x1="520" y1="800" x2="300" y2="500"/></g>')
            . '<rect x="18" y="18" width="564" height="764" fill="none" stroke="' . ($plain ? $accent : '#0c0c0e') . '" stroke-width="' . ($plain ? 6 : 12) . '"' . ($plain ? ' opacity="0.7"' : '') . '/>'
            . $header
            . $tsp
            . $numBadge
            . '<rect x="46" y="712" width="210" height="46" fill="#0c0c0e"/>'
            . '<text x="151" y="743" text-anchor="middle" font-family="Bangers, Anton, sans-serif" '
            . 'font-size="26" fill="' . $accent . '" letter-spacing="2">GEEKPOINT</text>'
            . '</svg>';

        header('Content-Type: image/svg+xml; charset=utf-8');
        header('Cache-Control: public, max-age=604800, immutable');
        header('Access-Control-Allow-Origin: *');
        echo $svg;
        exit;
    }

    /**
     * GET /catalog/image?src=<url CDN>
     * Proxy de imágenes: la portada se sirve DESDE NUESTRO ORIGEN, así vale
     * como textura WebGL (hero 3D / visor) aunque el CDN de origen no mande
     * cabecera CORS (p. ej. AniList). El <img> normal de la grilla NO lo
     * necesita — solo las texturas.
     */
    public function image()
    {
        $src  = (string) $this->query('src', '');
        $host = rtrim(strtolower((string) parse_url($src, PHP_URL_HOST)), '.');
        $allowed = [
            'cdn.myanimelist.net', 'api-cdn.myanimelist.net',
            's4.anilist.co', 's3.anilist.co', 's2.anilist.co', 's1.anilist.co',
            'uploads.mangadex.org', 'mangadex.org',
            'upload.wikimedia.org', 'commons.wikimedia.org', 'en.wikipedia.org',
            'api.scryfall.com', 'cards.scryfall.io', 'c1.scryfall.com',
            'images.pokemontcg.io', 'img.pokemontcg.io',
        ];
        $ok = $src && (in_array($host, $allowed, true)
            || preg_match('/\.(wikimedia|wikipedia)\.org$/', $host));
        if (!$ok) { http_response_code(400); exit; }

        // Prefijo de caché nuevo: ignora ficheros img_* viejos que en Hostinger
        // quedaron con basura (\r\n de un include) al principio.
        $key = dirname(__DIR__) . '/cache/imgc_' . md5($src);
        $bin = null; $type = 'image/jpeg';

        if (is_file($key) && (time() - filemtime($key) < 2592000)) {
            $bin  = file_get_contents($key);
            $meta = @file_get_contents($key . '.type');
            if ($meta) $type = $meta;
        }
        if ($bin === null || $bin === false || strlen($bin) < 100) {
            list($bin, $type) = $this->httpGet($src, 12, true);
            // Solo cachear si de verdad parece imagen (no una página de error).
            $looksImg = is_string($bin) && strlen($bin) > 200 && (
                strncmp($bin, "\xFF\xD8\xFF", 3) === 0 ||      // JPEG
                strncmp($bin, "\x89PNG", 4) === 0 ||           // PNG
                strncmp($bin, "GIF8", 4) === 0 ||              // GIF
                strncmp($bin, "RIFF", 4) === 0 ||              // WEBP
                stripos((string) $type, 'image/') === 0
            );
            if ($looksImg) {
                @mkdir(dirname($key), 0775, true);
                @file_put_contents($key, $bin);
                @file_put_contents($key . '.type', $type);
            }
        }

        if ($bin === null || $bin === false || $bin === '') { http_response_code(502); exit; }

        // CLAVE: descartar cualquier salida ya bufferada (BOM / whitespace / \r\n
        // de un include como config.php) que corrompería los bytes binarios.
        while (ob_get_level() > 0) { ob_end_clean(); }
        if (!headers_sent()) {
            header_remove();
            header('Content-Type: ' . ($type ?: 'image/jpeg'));
            header('Access-Control-Allow-Origin: *');
            header('Cache-Control: public, max-age=2592000, immutable');
            header('X-Content-Type-Options: nosniff');
            header('Content-Length: ' . strlen($bin));
        }
        echo $bin;
        exit;
    }

    /**
     * GET /catalog/covers?q={nombre de la serie}
     * Portadas oficiales por tomo (MangaDex).  -> { covers:[{v,url}], source }
     */
    public function covers()
    {
        $name = trim((string) $this->query('q', ''));
        if ($name === '') Response::ok(['covers' => [], 'source' => 'none']);
        $covers = $this->volumeCovers($name, true);
        Response::ok([
            'covers' => $covers ?: [],
            'source' => $covers ? 'mangadex' : 'none',
        ]);
    }

    /**
     * Portadas por tomo desde MangaDex (con caché de 7 días).
     * @return array [{v:string, url:string}]  ordenadas por volumen
     */
    private function volumeCovers($name, $fetchIfMissing = false)
    {
        $file = $this->volCacheFile($name);
        if (is_file($file) && (time() - filemtime($file) < self::VOL_TTL)) {
            $c = json_decode(file_get_contents($file), true);
            return is_array($c) ? $c : [];
        }
        if (!$fetchIfMissing) return [];

        $norm = function ($s) { return preg_replace('/[^a-z0-9]+/', '', mb_strtolower(trim((string) $s))); };
        $want = $norm($name);

        // 0) Override fijo para series problemáticas.
        $mid = $this->mangadexIdMap()[$want] ?? null;

        // 1) id de la serie — se piden varios resultados y se prefiere la
        //    coincidencia EXACTA de título, descartando spinoffs / precuelas
        //    (p. ej. "Jujutsu Kaisen 0", colorings, fanbooks…). Se incluye
        //    `erotica` para no dejar fuera títulos maduros (Berserk, etc.).
        if (!$mid) {
            list($body, ) = $this->httpGet(
                self::MANGADEX . '/manga?limit=10'
                . '&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica'
                . '&title=' . rawurlencode($name),
                8
            );
            if ($body) {
                $j = json_decode($body, true);
                $rows = $j['data'] ?? [];
                $near = null;   // coincidencia "contiene" (mismo universo, no un spin-off)
                foreach ($rows as $row) {
                    $id = $row['id'] ?? null;
                    if (!$id) continue;

                    $titles = [];
                    foreach (($row['attributes']['title'] ?? []) as $tv) $titles[] = $tv;
                    foreach (($row['attributes']['altTitles'] ?? []) as $alt) {
                        foreach ($alt as $tv) $titles[] = $tv;
                    }
                    foreach ($titles as $tv) {
                        $nt = $norm($tv);
                        if ($nt === '') continue;
                        if ($nt === $want) { $mid = $id; break 2; }
                        // Prefijo SOLO si las longitudes son cercanas: "berserk" NO
                        // debe casar con "berserkofgluttony" (dif. 10).
                        if ($near === null && abs(strlen($nt) - strlen($want)) <= 4
                            && (strpos($nt, $want) === 0 || strpos($want, $nt) === 0)) {
                            $near = $id;
                        }
                    }
                }
                // Sin match exacto ni de prefijo cercano: NO se usa el primer
                // resultado a ciegas (evita "Berserk" -> "Berserk of Gluttony").
                if (!$mid) $mid = $near;
            }
        }
        if (!$mid) { @file_put_contents($file, '[]'); return []; }

        usleep(300000);

        // 2) portadas (una por volumen, se prefiere locale en/ja)
        list($cb, ) = $this->httpGet(
            self::MANGADEX . '/cover?limit=100&order%5Bvolume%5D=asc&manga%5B%5D=' . rawurlencode($mid),
            10
        );
        $rank = ['en' => 3, 'ja' => 2];
        $best = [];
        if ($cb) {
            $cj = json_decode($cb, true);
            foreach (($cj['data'] ?? []) as $c) {
                $v  = $c['attributes']['volume'] ?? null;
                $fn = $c['attributes']['fileName'] ?? null;
                $lc = $c['attributes']['locale'] ?? '';
                if ($v === null || $v === '' || !$fn) continue;
                $score = $rank[$lc] ?? 1;
                if (!isset($best[$v]) || $score > $best[$v]['score']) {
                    $best[$v] = ['score' => $score, 'fn' => $fn];
                }
            }
        }

        $out = [];
        foreach ($best as $v => $meta) {
            $raw = self::MD_UPLOADS . '/covers/' . $mid . '/' . $meta['fn'] . '.512.jpg';
            $out[] = ['v' => (string) $v, 'url' => 'catalog/image?src=' . rawurlencode($raw)];
        }
        // orden natural por número de volumen
        usort($out, function ($a, $b) { return (float) $a['v'] <=> (float) $b['v']; });

        @mkdir(dirname($file), 0775, true);
        @file_put_contents($file, json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        return $out;
    }

    // ---------------------------------------------------------------

    /**
     * Sinopsis en ESPAÑOL.  AniList/Jikan solo traen inglés: si el texto está
     * en inglés se traduce (MyMemory como fuente principal — JSON estable y
     * gratis; Google gtx como respaldo) y se cachea 30 días en
     * `cache/tr_<md5>.txt`.  CUALQUIER fallo -> devuelve el texto original
     * (nunca rompe el catálogo ni muestra un error).  Presupuesto de tiempo
     * TR_BUDGET s por reconstrucción: agotado, el resto queda en inglés y se
     * traduce en la siguiente pasada (la caché se va llenando sola).
     */
    private function translateEs($text)
    {
        $text = trim((string) $text);
        if ($text === '' || mb_strlen($text) < 12) return $text;

        // ¿ya está en español?  (acentos/ñ/¿¡, o stopwords ES sin stopwords EN)
        if (preg_match('/[áéíóúñ¿¡]/u', $text)
            || (preg_match('/\b(el|la|los|las|un|una|que|con|para|del|por|su)\b/iu', $text)
                && !preg_match('/\b(the|and|of|his|her|with|from|when|which)\b/i', $text))) {
            return $text;
        }
        // ¿parece inglés?  Si no hay señales claras, no lo toques.
        if (!preg_match('/\b(the|and|of|to|is|his|her|with|for|from|that|he|she|they|who|when|as|by|but|his)\b/i', $text)) {
            return $text;
        }

        $key = dirname(__DIR__) . '/cache/tr_' . md5($text) . '.txt';
        if (is_file($key) && (time() - filemtime($key) < self::TR_TTL)) {
            $hit = file_get_contents($key);
            return ($hit !== false && trim($hit) !== '') ? $hit : $text;
        }
        if ($this->trSpent >= self::TR_BUDGET) return $text;   // presupuesto agotado

        $src = mb_substr($text, 0, 480);   // MyMemory: 500 chars/consulta
        $t0 = microtime(true);
        $es = $this->trMyMemory($src);
        if ($es === '') $es = $this->trGoogle($src);
        $this->trSpent += microtime(true) - $t0;

        if ($es !== '' && mb_strlen($es) > 4 && strcasecmp($es, $src) !== 0) {
            // Conserva la "cola" que no cupo en 480 chars sin traducir (rara vez pasa).
            if (mb_strlen($text) > 480) $es .= ' ' . mb_substr($text, 480);
            @mkdir(dirname($key), 0775, true);
            @file_put_contents($key, $es);
            return $es;
        }
        return $text;
    }

    /** MyMemory (JSON estable, gratis, ~5k chars/día por IP). '' si falla. */
    private function trMyMemory($text)
    {
        list($body, ) = $this->httpGet(
            'https://api.mymemory.translated.net/get?langpair=en%7Ces&q=' . rawurlencode($text),
            6
        );
        if (!$body) return '';
        $j = json_decode($body, true);
        if (!is_array($j)) return '';
        if (($j['responseStatus'] ?? 0) != 200) return '';
        if (!empty($j['quotaFinished'])) return '';
        $es = trim((string) ($j['responseData']['translatedText'] ?? ''));
        // MyMemory a veces devuelve avisos en MAYÚSCULAS cuando algo va mal.
        if ($es === '' || stripos($es, 'MYMEMORY WARNING') !== false
            || stripos($es, 'QUOTA EXCEEDED') !== false) return '';
        return $es;
    }

    /** Respaldo: endpoint gratuito de Google Translate (puede dar CAPTCHA). '' si falla. */
    private function trGoogle($text)
    {
        list($body, ) = $this->httpGet(
            self::GTRANSLATE . '?client=gtx&sl=en&tl=es&dt=t&q=' . rawurlencode($text),
            5
        );
        if (!$body || $body[0] !== '[') return '';
        $j = json_decode($body, true);
        if (!is_array($j) || !isset($j[0]) || !is_array($j[0])) return '';
        $es = '';
        foreach ($j[0] as $seg) {
            if (isset($seg[0])) $es .= $seg[0];
        }
        return trim($es);
    }

    /** Catálogo desde AniList (GraphQL) — una sola petición con alias. */
    private function buildFromAniList()
    {
        $seed = self::seed();
        $parts = [];
        foreach ($seed as $i => $s) {
            // Si la semilla fija un MAL id, se busca la serie exacta (evita spinoffs/precuelas).
            if (!empty($s['mal'])) {
                $selector = 'idMal: ' . (int) $s['mal'] . ', type: MANGA';
            } else {
                $q = str_replace('"', '\"', $s['q']);
                $selector = 'search: "' . $q . '", type: MANGA';
            }
            $parts[] = 'm' . $i . ': Media(' . $selector . ') { ' .
                'id title { english romaji } coverImage { extraLarge large } ' .
                'description(asHtml: false) volumes averageScore ' .
                'staff(perPage: 1, sort: RELEVANCE) { edges { node { name { full } } } } }';
        }
        $query = "query {\n" . implode("\n", $parts) . "\n}";

        list($body, $code) = $this->httpPost(self::ANILIST, ['query' => $query], 12);
        if (!$body) return [];
        $j = json_decode($body, true);
        $data = $j['data'] ?? null;
        if (!is_array($data)) return [];

        $pool = self::branchesPool();
        $out = [];

        foreach ($seed as $i => $s) {
            $m = $data['m' . $i] ?? null;
            if (!$m) continue;

            $aid = (int) ($m['id'] ?? 0);
            $title = $m['title']['english'] ?: ($m['title']['romaji'] ?? $s['q']);
            $cover = $m['coverImage']['extraLarge'] ?: ($m['coverImage']['large'] ?? '');
            $author = $m['staff']['edges'][0]['node']['name']['full'] ?? '';

            $syn = trim(html_entity_decode(strip_tags((string) ($m['description'] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $syn = preg_replace('/\s+/', ' ', $syn);
            $syn = $this->translateEs($syn);                               // sinopsis al español
            if (mb_strlen($syn) > 320) $syn = mb_substr($syn, 0, 317) . '…';

            $score = isset($m['averageScore']) && $m['averageScore'] ? round($m['averageScore'] / 10, 1) : null;

            $branches = [];
            foreach ($pool as $k => $b) {
                $stock = (($aid + $k * 7) % 14);
                if ($stock > 0 || $k === 0) {
                    $branches[] = ['code' => $b['code'], 'name' => $b['name'], 'stock' => $stock];
                }
            }

            $seriesName = $m['title']['english'] ?: ($m['title']['romaji'] ?? $s['q']);

            $out[] = [
                'id'           => $s['cat'] . '-' . ($aid ?: ($i + 1)),
                'title'        => isset($s['name']) ? $s['name'] : $title,
                'series'       => $seriesName,
                'search_title' => $s['q'],
                'author'       => $author,
                'category'     => $s['cat'],
                'price'        => (float) $s['price'],
                'currency'     => 'MXN',
                'cover'        => $cover ? ('catalog/image?src=' . rawurlencode($cover)) : '',
                'cover_raw'    => $cover,
                'tags'         => $s['tag'] ? [$s['tag']] : [],
                'synopsis'     => $syn,
                'volumes'      => $m['volumes'] ?? null,
                'tomos'        => $s['tomos'] ?? ($m['volumes'] ?? null),
                'score'        => $score,
                'branches'     => $branches,
            ];
        }
        return $out;
    }

    private function buildFromJikan()
    {
        $out = [];
        $pool = self::branchesPool();
        $consecFail = 0;

        foreach (self::seed() as $i => $s) {
            // Si Jikan/MAL está caído, no castigues al usuario con 18 timeouts.
            if ($consecFail >= 3 && count($out) === 0) {
                return [];
            }
            // Si la semilla fija un MAL id, se pide la ficha exacta (evita spinoffs/precuelas).
            if (!empty($s['mal'])) {
                list($body, ) = $this->httpGet(self::JIKAN . '/manga/' . (int) $s['mal'], 8);
            } else {
                list($body, ) = $this->httpGet(self::JIKAN . '/manga?limit=1&sfw=true&q=' . rawurlencode($s['q']), 8);
            }
            if (!$body) { $consecFail++; } else { $consecFail = 0; }
            $manga = null;
            if ($body) {
                $j = json_decode($body, true);
                // /manga/{id} devuelve data como objeto; /manga?q= como lista.
                $manga = !empty($s['mal'])
                    ? ($j['data'] ?? null)
                    : ($j['data'][0] ?? null);
            }
            if (!$manga && $body && empty($s['mal'])) {
                // reintento en /anime para figuras/tcg cuando no hay manga con ese nombre
                list($body2, ) = $this->httpGet(self::JIKAN . '/anime?limit=1&sfw=true&q=' . rawurlencode($s['q']), 8);
                if ($body2) {
                    $j2 = json_decode($body2, true);
                    $manga = $j2['data'][0] ?? null;
                }
            }

            if (!$manga) continue;
            usleep(400000); // ~2.5 req/s tras un hit real, dentro del límite de Jikan

            $malId = (int) ($manga['mal_id'] ?? 0);
            $rawImg = $manga['images']['jpg']['large_image_url']
                ?? $manga['images']['jpg']['image_url'] ?? '';
            $title = $manga['title_english'] ?: ($manga['title'] ?? $s['q']);
            $author = '';
            if (!empty($manga['authors'][0]['name'])) {
                $author = $manga['authors'][0]['name'];
            } elseif (!empty($manga['studios'][0]['name'])) {
                $author = $manga['studios'][0]['name'];
            }
            $synopsis = trim((string) ($manga['synopsis'] ?? ''));
            $synopsis = $this->translateEs($synopsis);                    // sinopsis al español
            if (mb_strlen($synopsis) > 320) $synopsis = mb_substr($synopsis, 0, 317) . '…';

            // disponibilidad sintética por sucursal (determinista por id)
            $branches = [];
            foreach ($pool as $k => $b) {
                $stock = (($malId + $k * 7) % 14);
                if ($stock > 0 || $k === 0) {
                    $branches[] = ['code' => $b['code'], 'name' => $b['name'], 'stock' => $stock];
                }
            }

            $out[] = [
                'id'           => $s['cat'] . '-' . ($malId ?: ($i + 1)),
                'mal_id'       => $malId,
                'title'        => isset($s['name']) ? $s['name'] : $title,
                'search_title' => $s['q'],
                'author'       => $author,
                'category'     => $s['cat'],
                'price'        => (float) $s['price'],
                'currency'     => 'MXN',
                'cover'        => $rawImg ? ('catalog/image?src=' . rawurlencode($rawImg)) : '',
                'cover_raw'    => $rawImg,
                'tags'         => $s['tag'] ? [$s['tag']] : [],
                'synopsis'     => $synopsis,
                'volumes'      => $manga['volumes'] ?? null,
                'tomos'        => $s['tomos'] ?? ($manga['volumes'] ?? null),
                'score'        => $manga['score'] ?? null,
                'branches'     => $branches,
            ];
        }
        return $out;
    }

    /**
     * GET simple con cURL (o file_get_contents de respaldo).
     * @return array [body|null, contentType]
     */
    private function httpGet($url, $timeout = 10, $binary = false)
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => 6,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT      => 'GeekPoint/1.0 (+catalog)',
                CURLOPT_HTTPHEADER     => ['Accept: ' . ($binary ? 'image/*' : 'application/json')],
            ]);
            $body = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: ($binary ? 'image/jpeg' : 'application/json');
            curl_close($ch);
            if ($body === false || $code >= 400) return [null, $type];
            return [$body, $type];
        }

        $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'header' => 'User-Agent: GeekPoint/1.0']]);
        $body = @file_get_contents($url, false, $ctx);
        return [$body === false ? null : $body, $binary ? 'image/jpeg' : 'application/json'];
    }

    /**
     * POST JSON.  @return array [body|null, httpCode]
     */
    private function httpPost($url, array $payload, $timeout = 12)
    {
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $json,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => 6,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT      => 'GeekPoint/1.0 (+catalog)',
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            // GraphQL puede responder 400/404 con cuerpo válido (errores + data parcial).
            if ($body === false || $body === '') return [null, $code];
            return [$body, $code];
        }

        $ctx = stream_context_create(['http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\nAccept: application/json\r\nUser-Agent: GeekPoint/1.0\r\n",
            'content' => $json,
            'timeout' => $timeout,
        ]]);
        $body = @file_get_contents($url, false, $ctx);
        return [$body === false ? null : $body, $body === false ? 0 : 200];
    }
}
