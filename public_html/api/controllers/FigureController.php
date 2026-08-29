<?php
/**
 * Búsqueda de figuras para el importador del panel.
 *
 *   GET /figures/search?q=Gojo Satoru
 *
 * Fuente 1: API (no oficial) de AmiAmi  https://api.amiami.com/api/v1/items
 *           (header X-User-Key: amiami_dev).  Cache 1 h en api/cache/.
 * Fuente 2 (respaldo): catálogo local curado, para que el auto-completado
 *           SIEMPRE funcione aunque AmiAmi esté caído o bloqueado.
 *
 * Mapea:  name · manufacturer · scale · image_url  (+ price_jpy si viene de AmiAmi)
 */
class FigureController extends Controller
{
    const AMIAMI  = 'https://api.amiami.com/api/v1/items';
    const IMG_HOST = 'https://img.amiami.com';
    const TTL     = 3600;   // 1 h

    private function cacheDir()
    {
        return dirname(__DIR__) . '/cache';
    }

    /** GET /figures/search */
    public function search()
    {
        $this->auth();

        $q = trim((string) $this->query('q', ''));
        if (mb_strlen($q) < 2) {
            Response::ok(['items' => [], 'source' => 'none']);
        }

        // 1) AmiAmi (con cache)
        $items = $this->fromAmiAmi($q);
        if ($items) {
            Response::ok(['items' => $items, 'source' => 'amiami']);
        }

        // 2) Respaldo local curado
        Response::ok(['items' => $this->fromLocal($q), 'source' => 'local']);
    }

    // ---------------------------------------------------------------

    /** @return array lista normalizada (vacía si AmiAmi no responde). */
    private function fromAmiAmi($q)
    {
        $url = self::AMIAMI . '?pagecnt=1&pagemax=24&lang=eng&s_keywords=' . rawurlencode($q);
        $file = $this->cacheDir() . '/fig_' . md5($url) . '.json';

        $json = null;
        if (is_file($file) && (time() - filemtime($file) < self::TTL)) {
            $json = json_decode((string) file_get_contents($file), true);
        }
        if (!is_array($json)) {
            list($body, $code) = $this->httpGet($url, ['X-User-Key: amiami_dev', 'Accept: application/json']);
            if ($body === null || $code >= 400) return [];
            $json = json_decode($body, true);
            if (!is_array($json) || empty($json['RSuccess'])) return [];
            @mkdir(dirname($file), 0775, true);
            @file_put_contents($file, json_encode($json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $out = [];
        foreach (($json['items'] ?? []) as $it) {
            $gname = trim((string) ($it['gname'] ?? ''));
            if ($gname === '') continue;
            $img = (string) ($it['image_url'] ?? ($it['thumb_url'] ?? ''));
            if ($img !== '' && strpos($img, 'http') !== 0) $img = self::IMG_HOST . $img;
            $jpy = (int) ($it['c_price_taxed'] ?? ($it['min_price'] ?? ($it['list_price'] ?? 0)));
            $out[] = [
                'external_id'  => (string) ($it['gcode'] ?? ''),
                'name'         => $gname,
                'manufacturer' => trim((string) ($it['maker_name'] ?? '')),
                'scale'        => self::parseScale($gname),
                'image_url'    => $img,
                'price_jpy'    => $jpy ?: null,
                'source'       => 'amiami',
            ];
        }
        return $out;
    }

    /** Deriva escala / línea desde el nombre ("... 1/7 Scale Figure", "Nendoroid No. 1194"…). */
    private static function parseScale($name)
    {
        $pats = [
            '/\b1\s*\/\s*\d{1,2}\b/i',
            '/Nendoroid(?:\s*(?:No\.?|#)?\s*\d+)?/i',
            '/POP\s*UP\s*PARADE/i',
            '/\bfigma\b/i',
            '/S\.?H\.?\s*Figuarts/i',
            '/\bPop!\b/i',
        ];
        foreach ($pats as $p) {
            if (preg_match($p, $name, $m)) return trim($m[0]);
        }
        return '';
    }

    /** Catálogo local curado de figuras conocidas (respaldo). */
    private function fromLocal($q)
    {
        $needle = mb_strtolower($q);
        $rows = self::LOCAL_FIGURES;
        $hits = array_values(array_filter($rows, function ($r) use ($needle) {
            return mb_strpos(mb_strtolower($r['name'] . ' ' . $r['manufacturer'] . ' ' . ($r['character'] ?? '')), $needle) !== false;
        }));
        if (!$hits) $hits = $rows;   // sin coincidencia: muestra todo el set curado
        return array_map(function ($r) {
            return [
                'external_id'  => $r['id'],
                'name'         => $r['name'],
                'manufacturer' => $r['manufacturer'],
                'scale'        => $r['scale'],
                'image_url'    => $this->genCover($r),
                'price_mxn'    => $r['price_mxn'] ?? null,
                'source'       => 'local',
            ];
        }, array_slice($hits, 0, 24));
    }

    private function genCover($r)
    {
        return 'catalog/cover?kind=figura'
            . '&t=' . rawurlencode($r['name'])
            . '&pub=' . rawurlencode($r['manufacturer'])
            . '&accent=' . rawurlencode($r['accent'] ?? '#8b5bff');
    }

    const LOCAL_FIGURES = [
        ['id' => 'loc-gojo-17',    'character' => 'Gojo Satoru',   'name' => 'Gojo Satoru 1/7',                         'manufacturer' => 'Good Smile Company', 'scale' => '1/7',            'price_mxn' => 2490, 'accent' => '#8b5bff'],
        ['id' => 'loc-luffy-g5',   'character' => 'Monkey D. Luffy','name' => 'Monkey D. Luffy Gear 5 - POP UP PARADE',  'manufacturer' => 'Good Smile Company', 'scale' => 'POP UP PARADE', 'price_mxn' => 1150, 'accent' => '#00e5ff'],
        ['id' => 'loc-nezuko-nen', 'character' => 'Nezuko Kamado', 'name' => 'Nezuko Kamado Nendoroid #1194',           'manufacturer' => 'Good Smile Company', 'scale' => 'Nendoroid #1194','price_mxn' => 1390, 'accent' => '#ff2d95'],
        ['id' => 'loc-eren-pup',   'character' => 'Eren Yeager',   'name' => 'Eren Yeager Titan Form - POP UP PARADE',  'manufacturer' => 'Good Smile Company', 'scale' => 'POP UP PARADE', 'price_mxn' => 1200, 'accent' => '#7a5c3e'],
        ['id' => 'loc-artoria-17', 'character' => 'Artoria Pendragon', 'name' => 'Artoria Pendragon 1/7',               'manufacturer' => 'Kotobukiya',         'scale' => '1/7',            'price_mxn' => 3800, 'accent' => '#ffd400'],
        ['id' => 'loc-mikasa-17',  'character' => 'Mikasa Ackerman','name' => 'Mikasa Ackerman 1/7',                     'manufacturer' => 'Kotobukiya',         'scale' => '1/7',            'price_mxn' => 2290, 'accent' => '#0b8a3d'],
        ['id' => 'loc-power-shf',  'character' => 'Power',         'name' => 'Power - S.H.Figuarts',                    'manufacturer' => 'Bandai',             'scale' => 'S.H.Figuarts',  'price_mxn' => 1890, 'accent' => '#ff2d95'],
        ['id' => 'loc-tanjiro-fig','character' => 'Tanjiro Kamado','name' => 'Tanjiro Kamado - figma',                  'manufacturer' => 'Max Factory',        'scale' => 'figma',         'price_mxn' => 1690, 'accent' => '#0b8a3d'],
        ['id' => 'loc-denji-17',   'character' => 'Denji',         'name' => 'Denji 1/7',                               'manufacturer' => 'Max Factory',        'scale' => '1/7',            'price_mxn' => 2590, 'accent' => '#ff2d95'],
        ['id' => 'loc-frieren-pup','character' => 'Frieren',       'name' => 'Frieren - POP UP PARADE',                 'manufacturer' => 'Good Smile Company', 'scale' => 'POP UP PARADE', 'price_mxn' => 1200, 'accent' => '#00e5ff'],
        ['id' => 'loc-gojo-nen',   'character' => 'Gojo Satoru',   'name' => 'Gojo Satoru Nendoroid #1287',             'manufacturer' => 'Good Smile Company', 'scale' => 'Nendoroid #1287','price_mxn' => 1390, 'accent' => '#8b5bff'],
        ['id' => 'loc-zerotwo-17', 'character' => 'Zero Two',      'name' => 'Zero Two 1/7',                            'manufacturer' => 'Kotobukiya',         'scale' => '1/7',            'price_mxn' => 3200, 'accent' => '#e4002b'],
        ['id' => 'loc-rem-17',     'character' => 'Rem',           'name' => 'Rem 1/7',                                 'manufacturer' => 'Kadokawa',           'scale' => '1/7',            'price_mxn' => 2790, 'accent' => '#00e5ff'],
        ['id' => 'loc-goku-shf',   'character' => 'Son Goku',      'name' => 'Son Goku - S.H.Figuarts',                 'manufacturer' => 'Bandai',             'scale' => 'S.H.Figuarts',  'price_mxn' => 1750, 'accent' => '#ffd400'],
        ['id' => 'loc-guts-17',    'character' => 'Guts',          'name' => 'Guts Berserker Armor 1/7',                'manufacturer' => 'Prime 1 Studio',     'scale' => '1/7',            'price_mxn' => 8900, 'accent' => '#e4002b'],
    ];

    // ---------------------------------------------------------------

    /** @return array [body|null, httpCode] */
    private function httpGet($url, array $headers = [], $timeout = 12)
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => 6,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT      => 'Mozilla/5.0 (GeekPoint/1.0; +figures)',
                CURLOPT_HTTPHEADER     => $headers ?: ['Accept: application/json'],
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($body === false) return [null, $code ?: 0];
            return [$body, $code];
        }

        $ctx = stream_context_create(['http' => [
            'timeout' => $timeout,
            'header'  => implode("\r\n", array_merge($headers, ['User-Agent: GeekPoint/1.0'])),
        ]]);
        $body = @file_get_contents($url, false, $ctx);
        return [$body === false ? null : $body, $body === false ? 0 : 200];
    }
}
