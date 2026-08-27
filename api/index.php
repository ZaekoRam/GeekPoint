<?php
/**
 * =====================================================================
 *  GeekPoint POS — Front controller de la API REST
 * =====================================================================
 *  Todas las peticiones a /api/* entran aquí (ver .htaccess).
 *  Respuestas siempre en JSON:  { ok: bool, data|error|message }
 * =====================================================================
 */

// ---------------------------------------------------------------------
//  Bootstrap
// ---------------------------------------------------------------------
class App
{
    private static $config;

    public static function boot()
    {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => 'no_config',
                'message' => 'Falta api/config.php. Copia api/config.example.php y ajusta la base de datos.',
            ]);
            exit;
        }
        self::$config = require $path;

        if (self::isDev()) {
            error_reporting(E_ALL);
            ini_set('display_errors', '0'); // nunca romper el JSON; se captura abajo
        }

        spl_autoload_register(function ($class) {
            foreach (['/src/', '/controllers/'] as $dir) {
                $file = __DIR__ . $dir . $class . '.php';
                if (is_file($file)) {
                    require $file;
                    return;
                }
            }
        });

        set_exception_handler(function ($e) {
            Database::rollback();
            Response::error(
                500,
                'server_error',
                App::isDev() ? $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine() : 'Error interno del servidor.'
            );
        });
        set_error_handler(function ($no, $str, $file, $line) {
            if (!(error_reporting() & $no)) return false;
            throw new ErrorException($str, 0, $no, $file, $line);
        });
    }

    public static function config($key = null)
    {
        if ($key === null) return self::$config;
        return self::$config[$key] ?? null;
    }

    public static function isDev()
    {
        return (self::$config['env'] ?? 'prod') === 'dev';
    }
}

App::boot();

// ---------------------------------------------------------------------
//  CORS
// ---------------------------------------------------------------------
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = App::config('cors')['allowed_origins'] ?? ['*'];
if (in_array('*', $allowed, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif ($origin && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-HTTP-Method-Override');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------
//  Rutas
// ---------------------------------------------------------------------
$request = new Request();
$router  = new Router();

// Salud / raíz
$router->get('', function () {
    Response::ok(['service' => 'GeekPoint POS API', 'version' => '1.0.0', 'time' => date('c')]);
});
$router->get('health', function () {
    Database::scalar('SELECT 1');
    Response::ok(['status' => 'up']);
});

// --- Auth ---
$router->post('auth/login',  function () use ($request) { (new AuthController($request))->login(); });
$router->post('auth/logout', function () use ($request) { (new AuthController($request))->logout(); });
$router->get('auth/me',      function () use ($request) { (new AuthController($request))->me(); });

// --- Sucursales ---
$router->get('branches',            function () use ($request) { (new BranchController($request))->index(); });
$router->post('branches',           function () use ($request) { (new BranchController($request))->store(); });
$router->get('branches/{id}',       function ($p) use ($request) { (new BranchController($request))->show($p['id']); });
$router->put('branches/{id}',       function ($p) use ($request) { (new BranchController($request))->update($p['id']); });
$router->patch('branches/{id}/status', function ($p) use ($request) { (new BranchController($request))->setStatus($p['id']); });
$router->delete('branches/{id}',    function ($p) use ($request) { (new BranchController($request))->destroy($p['id']); });

// --- Usuarios (gerentes / cajeros) ---
$router->get('users',              function () use ($request) { (new UserController($request))->index(); });
$router->post('users',             function () use ($request) { (new UserController($request))->store(); });
$router->put('users/{id}',         function ($p) use ($request) { (new UserController($request))->update($p['id']); });
$router->patch('users/{id}/status', function ($p) use ($request) { (new UserController($request))->setStatus($p['id']); });
$router->delete('users/{id}',      function ($p) use ($request) { (new UserController($request))->destroy($p['id']); });

// --- Categorías ---
$router->get('categories', function () use ($request) { (new CategoryController($request))->index(); });

// --- Catálogo público de la tienda (e-commerce, sin auth) ---
$router->get('catalog', function () use ($request) { (new CatalogController($request))->index(); });
$router->get('catalog/image', function () use ($request) { (new CatalogController($request))->image(); });

// --- Productos / inventario ---
$router->get('products',            function () use ($request) { (new ProductController($request))->index(); });
$router->post('products',           function () use ($request) { (new ProductController($request))->store(); });
$router->get('products/{id}',       function ($p) use ($request) { (new ProductController($request))->show($p['id']); });
$router->put('products/{id}',       function ($p) use ($request) { (new ProductController($request))->update($p['id']); });
$router->patch('products/{id}/stock', function ($p) use ($request) { (new ProductController($request))->adjustStock($p['id']); });
$router->delete('products/{id}',    function ($p) use ($request) { (new ProductController($request))->destroy($p['id']); });

// --- Cajas ---
$router->get('registers',        function () use ($request) { (new RegisterController($request))->index(); });
$router->post('registers',       function () use ($request) { (new RegisterController($request))->store(); });
$router->delete('registers/{id}', function ($p) use ($request) { (new RegisterController($request))->destroy($p['id']); });

// --- Inventario: alertas y movimientos ---
$router->get('inventory/alerts',    function () use ($request) { (new InventoryController($request))->alerts(); });
$router->get('inventory/movements', function () use ($request) { (new InventoryController($request))->movements(); });

// --- Ventas / POS ---
$router->post('sales',      function () use ($request) { (new SaleController($request))->store(); });
$router->get('sales',       function () use ($request) { (new SaleController($request))->index(); });
$router->get('sales/{id}',  function ($p) use ($request) { (new SaleController($request))->show($p['id']); });

// --- Reportes ---
$router->get('reports/overview',     function () use ($request) { (new ReportController($request))->overview(); });
$router->get('reports/branch/{id}',  function ($p) use ($request) { (new ReportController($request))->branch($p['id']); });

$router->dispatch($request->method(), $request->path());
