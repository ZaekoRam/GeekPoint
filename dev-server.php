<?php
/**
 * Servidor de desarrollo (solo para probar sin Apache).
 *
 *   C:\xampp\php\php.exe -S localhost:8765 dev-server.php
 *
 * Luego abre:  http://localhost:8765/frontend/
 * API en:      http://localhost:8765/api/...
 *
 * En producción NO se usa este archivo: Apache + los .htaccess hacen el ruteo.
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ---- API: todo /api/* pasa por api/index.php ----
if (preg_match('#^/api(?:/(.*))?$#', $uri, $m)) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/api/index.php';
    chdir(__DIR__ . '/api');
    require __DIR__ . '/api/index.php';
    return true;
}

// ---- Raíz → landing ----
if ($uri === '/' || $uri === '') {
    header('Location: /frontend/');
    return true;
}

// ---- Archivos estáticos reales ----
$path = realpath(__DIR__ . $uri);
if ($path && strpos($path, realpath(__DIR__)) === 0 && is_file($path)) {
    return false; // el servidor embebido lo sirve tal cual
}

// ---- SPA: cualquier otra ruta bajo /frontend sirve el index ----
if (strpos($uri, '/frontend') === 0) {
    $index = __DIR__ . '/frontend/index.html';
    if (is_file($index)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($index);
        return true;
    }
}

http_response_code(404);
echo 'Not found: ' . htmlspecialchars($uri);
return true;
