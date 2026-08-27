<?php
/**
 * Encapsula la petición HTTP entrante.
 */
class Request
{
    /** @var array */
    private $body;

    public function __construct()
    {
        $this->body = $this->parseBody();
    }

    public function method()
    {
        $m = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        // Permite override por header (algunos proxies bloquean PUT/PATCH/DELETE)
        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
        if ($override !== '' && in_array(strtoupper($override), ['PUT', 'PATCH', 'DELETE'], true)) {
            return strtoupper($override);
        }
        return $m;
    }

    /** Ruta relativa a /api, sin query string. Ej: "products/12" */
    public function path()
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $uri = rawurldecode($uri ?: '/');

        // Recorta el prefijo del script (…/api)
        $script = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'));
        if ($script !== '/' && strpos($uri, $script) === 0) {
            $uri = substr($uri, strlen($script));
        }
        // También soporta ?route=... como fallback si no hay mod_rewrite
        if (isset($_GET['route'])) {
            $uri = '/' . ltrim($_GET['route'], '/');
        }
        return trim($uri, '/');
    }

    private function parseBody()
    {
        $raw = file_get_contents('php://input');
        if ($raw === '' || $raw === false) {
            return $_POST ?: [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : ($_POST ?: []);
    }

    /** Valor del cuerpo JSON. */
    public function input($key, $default = null)
    {
        return array_key_exists($key, $this->body) ? $this->body[$key] : $default;
    }

    public function all()
    {
        return $this->body;
    }

    /** Valor de query string. */
    public function query($key, $default = null)
    {
        return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
    }

    /** Token Bearer del header Authorization. */
    public function bearerToken()
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if ($header === '' && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strtolower($k) === 'authorization') {
                    $header = $v;
                    break;
                }
            }
        }
        if (preg_match('/Bearer\s+(.+)$/i', $header, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    public function ip()
    {
        return $_SERVER['REMOTE_ADDR'] ?? '';
    }

    public function userAgent()
    {
        return substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
    }
}
