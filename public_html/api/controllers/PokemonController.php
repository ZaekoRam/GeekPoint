<?php
/**
 * Proxy a la API pública de Pokémon TCG (https://pokemontcg.io, v2).
 * El navegador no siempre puede llamarla directo (red/CORS); este proxy
 * la consume desde el servidor y cachea 10 min para respetar el rate-limit.
 *
 *   GET /pokemon/cards?name=Charizard&set=base1&page=1&pageSize=24
 *   GET /pokemon/sets
 */
class PokemonController extends Controller
{
    const API  = 'https://api.pokemontcg.io/v2';
    const TTL  = 600;   // 10 min

    private function cacheDir()
    {
        return dirname(__DIR__) . '/cache';
    }

    private function key()
    {
        $i = App::config('integrations');
        return is_array($i) ? (string) ($i['pokemontcg_key'] ?? '') : '';
    }

    /** GET /pokemon/cards */
    public function cards()
    {
        $this->auth();

        $name = trim((string) $this->query('name', ''));
        $set  = trim((string) $this->query('set', ''));
        if ($name === '' && $set === '') {
            Response::ok(['data' => [], 'page' => 1, 'pageSize' => 0, 'totalCount' => 0]);
        }

        $q = [];
        if ($name !== '') $q[] = 'name:"' . str_replace('"', '', $name) . '*"';
        if ($set !== '')  $q[] = 'set.id:"' . preg_replace('/[^A-Za-z0-9\-]/', '', $set) . '"';

        $page = max(1, (int) $this->query('page', 1));
        $pageSize = min(60, max(1, (int) $this->query('pageSize', 24)));

        $url = self::API . '/cards?q=' . rawurlencode(implode(' ', $q)) .
            '&page=' . $page . '&pageSize=' . $pageSize .
            '&orderBy=' . rawurlencode('-set.releaseDate,number') .
            '&select=' . rawurlencode('id,name,supertype,subtypes,hp,types,rarity,number,artist,flavorText,set,images,tcgplayer,cardmarket');

        $this->relay($url, 'pkmcards_' . md5($url));
    }

    /** GET /pokemon/sets */
    public function sets()
    {
        $this->auth();
        $url = self::API . '/sets?orderBy=-releaseDate&select=' . rawurlencode('id,name,series,releaseDate,total');
        $this->relay($url, 'pkmsets', 86400);
    }

    // ---------------------------------------------------------------

    private function relay($url, $cacheName, $ttl = self::TTL)
    {
        $file = $this->cacheDir() . '/' . $cacheName . '.json';
        if (is_file($file) && (time() - filemtime($file) < $ttl)) {
            $cached = file_get_contents($file);
            if ($cached !== false && $cached !== '') {
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['ok' => true, 'data' => json_decode($cached, true), 'cached' => true],
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }
        }

        list($body, $code) = $this->httpGet($url);
        if ($body === null || $code >= 400) {
            Response::error(502, 'pokemontcg_unavailable', 'No se pudo consultar pokemontcg.io (HTTP ' . $code . ').');
        }

        $json = json_decode($body, true);
        if (!is_array($json)) {
            Response::error(502, 'pokemontcg_bad_response', 'Respuesta inválida de pokemontcg.io.');
        }

        @mkdir(dirname($file), 0775, true);
        @file_put_contents($file, json_encode($json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        Response::ok($json);
    }

    /** @return array [body|null, httpCode] */
    private function httpGet($url, $timeout = 12)
    {
        $headers = ['Accept: application/json'];
        $k = $this->key();
        if ($k !== '') $headers[] = 'X-Api-Key: ' . $k;

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => 6,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_USERAGENT      => 'GeekPoint/1.0 (+pokemon)',
                CURLOPT_HTTPHEADER     => $headers,
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
