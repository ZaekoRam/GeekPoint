<?php
/**
 * Catálogo público de la tienda e-commerce.
 * Consume la API pública y gratuita de Jikan (MyAnimeList) para portadas reales.
 * Cachea el resultado 24 h en api/cache/catalog.json para respetar el rate-limit.
 * Si Jikan no responde, devuelve source="unavailable" y el front usa su respaldo local.
 */
class CatalogController extends Controller
{
    const CACHE_TTL = 86400;   // 24 h  (catálogo)
    const VOL_TTL   = 604800;  // 7 días (portadas por tomo)
    const JIKAN    = 'https://api.jikan.moe/v4';
    const ANILIST  = 'https://graphql.anilist.co';
    const MANGADEX = 'https://api.mangadex.org';
    const MD_UPLOADS = 'https://uploads.mangadex.org';

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

    private function volCacheFile($name)
    {
        return dirname(__DIR__) . '/cache/vol_' . md5(mb_strtolower(trim($name))) . '.json';
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

    /** GET /catalog  — lista de productos para la tienda */
    public function index()
    {
        $file = $this->cacheFile();
        $force = $this->query('refresh') === '1';

        $warm = $this->query('warm') === '1';

        if (!$force && !$warm && is_file($file) && (time() - filemtime($file) < self::CACHE_TTL)) {
            $cached = json_decode(file_get_contents($file), true);
            if (is_array($cached) && !empty($cached['products'])) {
                $this->attachVolumeCovers($cached['products'], false);
                $this->mergeLocalProducts($cached['products']);
                Response::ok($cached + ['cached' => true]);
            }
        }

        // 1º AniList (rápido, estable, una sola petición).  2º Jikan/MyAnimeList.
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
            @mkdir(dirname($file), 0775, true);
            @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            // Portadas por tomo (MangaDex): con warm=1 se descargan; si no, sólo las ya cacheadas.
            $this->attachVolumeCovers($payload['products'], $warm);
            $this->mergeLocalProducts($payload['products']);
            Response::ok($payload + ['cached' => false]);
        }

        // Ambas fuentes caídas: si hay un caché viejo, úsalo; si no, avisa al front.
        if (is_file($file)) {
            $old = json_decode(file_get_contents($file), true);
            if (is_array($old) && !empty($old['products'])) {
                $this->mergeLocalProducts($old['products']);
                Response::ok($old + ['cached' => true, 'stale' => true]);
            }
        }

        // Sin catálogo externo: al menos devuelve los productos locales importados.
        $local = $this->localProducts();
        Response::ok(['products' => $local, 'source' => $local ? 'local' : 'unavailable']);
    }

    /** Añade al catálogo los productos reales del POS (categorías tcg/comics). */
    private function mergeLocalProducts(array &$products)
    {
        $local = $this->localProducts();
        if ($local) {
            array_splice($products, 0, 0, $local);   // primero, para que se vean arriba
        }
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
        try {
            $rows = Database::all(
                "SELECT p.sku,
                        MAX(p.name)        AS name,
                        c.slug             AS category,
                        MAX(p.description) AS description,
                        MAX(p.image_url)   AS image_url,
                        MAX(p.figure_png_url) AS figure_png_url,
                        ROUND(AVG(p.price), 2) AS price,
                        SUM(p.stock)       AS stock,
                        GROUP_CONCAT(CONCAT(b.code, '|', b.name, '|', p.stock) SEPARATOR ';;') AS branchmap
                 FROM products p
                 JOIN categories c ON c.id = p.category_id
                 LEFT JOIN branches b ON b.id = p.branch_id
                 WHERE p.status = 'active'
                   AND (c.slug IN ('tcg', 'comics', 'preventa')
                        OR p.image_url <> '')
                 GROUP BY p.sku, c.slug
                 ORDER BY name",
                []
            );
        } catch (\Throwable $e) {
            return [];
        }

        $out = [];
        foreach (($rows ?: []) as $r) {
            $branches = [];
            foreach (explode(';;', (string) $r['branchmap']) as $chunk) {
                $parts = explode('|', $chunk);
                if (count($parts) === 3) {
                    $branches[] = ['code' => $parts[0], 'name' => $parts[1], 'stock' => (int) $parts[2]];
                }
            }

            $segs = array_map('trim', explode('·', (string) $r['description']));

            $rarity = '';
            foreach ($segs as $dp) {
                if ($dp !== '' && preg_match('/\b(rare|common|uncommon|promo|holo|illustration|ultra|secret|amazing|radiant|legend)\w*/i', $dp)) {
                    $rarity = $dp;
                    break;
                }
            }

            // Figuras: "<Fabricante> · <Escala/Línea> · <detalle>"
            $manufacturer = '';
            $scale = '';
            if ($r['category'] === 'figuras') {
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
            $imgs = array_values(array_filter(array_map('trim', explode(',', (string) $r['image_url'])), 'strlen'));

            $out[] = [
                'id'           => 'local-' . strtolower($r['category']) . '-' . trim(preg_replace('/[^a-z0-9]+/i', '-', strtolower((string) $r['sku'])), '-'),
                'title'        => $r['name'],
                'author'       => '',
                'category'     => $r['category'],
                'price'        => (float) $r['price'],
                'currency'     => 'MXN',
                'cover'        => $imgs[0] ?? '',
                'cover_raw'    => $imgs[0] ?? '',
                'images'       => $imgs,
                'figure_png_url' => (isset($r['figure_png_url']) && $r['figure_png_url'] !== '')
                                      ? (string) $r['figure_png_url']
                                      : null,   // PNG recortado (transparente) para la vista 3D pop-out
                'tags'         => [],
                'rarity'       => $rarity,
                'manufacturer' => $manufacturer,
                'scale'        => $scale,
                'synopsis'     => (string) $r['description'],
                'volumes'      => null,
                'score'        => null,
                'source'       => 'local',
                'branches'     => $branches,
            ];
        }
        return $out;
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
        $catLabel = $isComic ? 'COMIC' : ($kind === 'tcg' ? 'TCG' : ($isFigure ? 'FIGURA' : 'GEEKPOINT'));
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

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">'
            . '<defs><pattern id="ht" width="14" height="14" patternUnits="userSpaceOnUse">'
            . '<circle cx="3" cy="3" r="2.1" fill="rgba(255,255,255,.06)"/></pattern></defs>'
            . '<rect width="600" height="800" fill="#111014"/>'
            . '<rect width="600" height="800" fill="url(#ht)"/>'
            . '<polygon points="0,0 600,0 600,120 0,300" fill="' . $accent . '" opacity="0.92"/>'
            . '<polygon points="0,0 600,0 600,120 0,300" fill="none" stroke="#0c0c0e" stroke-width="6"/>'
            . '<g stroke="#0c0c0e" stroke-width="3" opacity=".4">'
            . '<line x1="600" y1="800" x2="360" y2="470"/><line x1="600" y1="700" x2="320" y2="470"/>'
            . '<line x1="520" y1="800" x2="300" y2="500"/></g>'
            . '<rect x="18" y="18" width="564" height="764" fill="none" stroke="#0c0c0e" stroke-width="12"/>'
            . '<text x="46" y="96" font-family="JetBrains Mono, monospace" font-size="24" font-weight="700" '
            . 'letter-spacing="7" fill="#0c0c0e">' . $enc($badge) . '</text>'
            . $tspans
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
     * GET /catalog/image?src=<url cdn.myanimelist.net>
     * Proxy de imágenes para que las portadas sean del mismo origen (texturas WebGL sin CORS).
     */
    public function image()
    {
        $src = (string) $this->query('src', '');
        $host = strtolower((string) parse_url($src, PHP_URL_HOST));
        $allowed = [
            'cdn.myanimelist.net', 'api-cdn.myanimelist.net',
            's4.anilist.co', 's3.anilist.co', 's2.anilist.co', 's1.anilist.co',
            'uploads.mangadex.org', 'mangadex.org',
        ];
        if (!$src || !in_array(rtrim($host, '.'), $allowed, true)) {
            http_response_code(400);
            exit;
        }

        $key = dirname(__DIR__) . '/cache/img_' . md5($src);
        $bin = null; $type = 'image/jpeg';

        if (is_file($key) && (time() - filemtime($key) < 2592000)) {
            $bin = file_get_contents($key);
            $meta = @file_get_contents($key . '.type');
            if ($meta) $type = $meta;
        } else {
            list($bin, $type) = $this->httpGet($src, 12, true);
            if ($bin !== null && strlen($bin) > 200) {
                @mkdir(dirname($key), 0775, true);
                @file_put_contents($key, $bin);
                @file_put_contents($key . '.type', $type);
            }
        }

        if ($bin === null) { http_response_code(502); exit; }

        header('Content-Type: ' . $type);
        header('Cache-Control: public, max-age=2592000, immutable');
        header('Access-Control-Allow-Origin: *');
        header('Content-Length: ' . strlen($bin));
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

        // 1) id de la serie — se piden varios resultados y se prefiere la
        //    coincidencia EXACTA de título, descartando spinoffs / precuelas
        //    (p. ej. "Jujutsu Kaisen 0", colorings, fanbooks…).
        list($body, ) = $this->httpGet(
            self::MANGADEX . '/manga?limit=10&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&title=' . rawurlencode($name),
            8
        );
        $mid = null;
        if ($body) {
            $j = json_decode($body, true);
            $rows = $j['data'] ?? [];
            $norm = function ($s) { return preg_replace('/[^a-z0-9]+/', '', mb_strtolower(trim((string) $s))); };
            $want = $norm($name);
            $near = null;   // coincidencia "contiene" (mismo universo, no un spin-off ajeno)
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
                    if ($nt === $want) { $mid = $id; break 2; }
                    if ($near === null && $nt !== '' && ($nt === $want || strpos($nt, $want) === 0 || strpos($want, $nt) === 0)) {
                        $near = $id;
                    }
                }
            }
            // Sin match exacto ni de prefijo: NO se usa el primer resultado a ciegas
            // (evita portadas cruzadas p. ej. "Berserk" -> "Berserk of Gluttony").
            if (!$mid) $mid = $near;
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
