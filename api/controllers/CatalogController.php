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
            ['q' => 'Berserk',               'cat' => 'manga',   'price' => 349, 'tag' => ''],
            ['q' => 'Vinland Saga',          'cat' => 'manga',   'price' => 229, 'tag' => ''],
            ['q' => 'Hunter x Hunter',       'cat' => 'manga',   'price' => 159, 'tag' => ''],
            ['q' => 'Boku no Hero Academia', 'cat' => 'manga',   'price' => 165, 'tag' => '', 'name' => 'My Hero Academia'],
            ['q' => 'Shingeki no Kyojin',    'cat' => 'manga',   'price' => 169, 'tag' => '', 'name' => 'Attack on Titan'],
            ['q' => 'Solo Leveling',         'cat' => 'manga',   'price' => 219, 'tag' => 'novedad'],
            ['q' => 'Sousou no Frieren',     'cat' => 'manga',   'price' => 175, 'tag' => 'preventa', 'name' => 'Frieren: Beyond Journey\'s End'],
            ['q' => 'JoJo no Kimyou na Bouken', 'cat' => 'comics', 'price' => 299, 'tag' => '', 'name' => "JoJo's Bizarre Adventure"],
            ['q' => 'Jujutsu Kaisen 0',      'cat' => 'figuras', 'price' => 2490, 'tag' => 'preventa', 'name' => 'Gojo Satoru - Figura 1/7'],
            ['q' => 'Chainsaw Man',          'cat' => 'figuras', 'price' => 1890, 'tag' => '', 'name' => 'Power - Figura S.H.F.'],
            ['q' => 'Kimetsu no Yaiba',      'cat' => 'figuras', 'price' => 1690, 'tag' => '', 'name' => 'Nezuko - Figura 1/8'],
            ['q' => 'Pokemon Adventures',    'cat' => 'tcg',     'price' => 1290, 'tag' => 'novedad', 'name' => 'Pokemon TCG - Elite Trainer Box'],
            ['q' => 'One Piece',             'cat' => 'tcg',     'price' => 1490, 'tag' => '', 'name' => 'One Piece TCG - Booster Box'],
            ['q' => 'Yu-Gi-Oh!',             'cat' => 'tcg',     'price' => 1190, 'tag' => '', 'name' => 'Yu-Gi-Oh! TCG - Structure Deck'],
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
            $covers = $this->volumeCovers($prod['series'] ?? $prod['title'], $warm);
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
            Response::ok($payload + ['cached' => false]);
        }

        // Ambas fuentes caídas: si hay un caché viejo, úsalo; si no, avisa al front.
        if (is_file($file)) {
            $old = json_decode(file_get_contents($file), true);
            if (is_array($old) && !empty($old['products'])) {
                Response::ok($old + ['cached' => true, 'stale' => true]);
            }
        }
        Response::ok(['products' => [], 'source' => 'unavailable']);
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
            $want = mb_strtolower(trim($name));
            $fallback = null;
            foreach ($rows as $row) {
                $id = $row['id'] ?? null;
                if (!$id) continue;
                if ($fallback === null) $fallback = $id;

                $titles = [];
                foreach (($row['attributes']['title'] ?? []) as $tv) $titles[] = $tv;
                foreach (($row['attributes']['altTitles'] ?? []) as $alt) {
                    foreach ($alt as $tv) $titles[] = $tv;
                }
                foreach ($titles as $tv) {
                    if (mb_strtolower(trim((string) $tv)) === $want) { $mid = $id; break 2; }
                }
            }
            if (!$mid) $mid = $fallback;
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
                'id'        => $s['cat'] . '-' . ($aid ?: ($i + 1)),
                'title'     => isset($s['name']) ? $s['name'] : $title,
                'series'    => $seriesName,
                'author'    => $author,
                'category'  => $s['cat'],
                'price'     => (float) $s['price'],
                'currency'  => 'MXN',
                'cover'     => $cover ? ('catalog/image?src=' . rawurlencode($cover)) : '',
                'cover_raw' => $cover,
                'tags'      => $s['tag'] ? [$s['tag']] : [],
                'synopsis'  => $syn,
                'volumes'   => $m['volumes'] ?? null,
                'score'     => $score,
                'branches'  => $branches,
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
                'id'        => $s['cat'] . '-' . ($malId ?: ($i + 1)),
                'mal_id'    => $malId,
                'title'     => isset($s['name']) ? $s['name'] : $title,
                'author'    => $author,
                'category'  => $s['cat'],
                'price'     => (float) $s['price'],
                'currency'  => 'MXN',
                'cover'     => $rawImg ? ('catalog/image?src=' . rawurlencode($rawImg)) : '',
                'cover_raw' => $rawImg,
                'tags'      => $s['tag'] ? [$s['tag']] : [],
                'synopsis'  => $synopsis,
                'volumes'   => $manga['volumes'] ?? null,
                'score'     => $manga['score'] ?? null,
                'branches'  => $branches,
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
