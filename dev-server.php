<?php
/**
 * Servidor de desarrollo (solo para probar sin Apache).
 *
 *   C:\xampp\php\php.exe -S localhost:8766 -t public_html dev-server.php
 *
 * Abre:  http://localhost:8766/
 * API en: http://localhost:8766/api/...
 *
 * `-t public_html` fija esa carpeta como raíz web (igual que Hostinger).
 * Este router solo enruta /api/* y hace de fallback para el SPA.
 * En producción NO se usa este archivo: Apache + los .htaccess hacen el ruteo.
 */

$root = __DIR__ . '/public_html';
$uri  = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ---- API: todo /api/* pasa por public_html/api/index.php ----
if (preg_match('#^/api(?:/(.*))?$#', $uri, $m)) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $root . '/api/index.php';
    chdir($root . '/api');
    require $root . '/api/index.php';
    return true;
}

// ---- Archivos estáticos reales dentro de public_html/ ----
$path = realpath($root . $uri);
if ($path && strpos($path, realpath($root)) === 0 && is_file($path)) {
    return false; // el servidor embebido lo sirve tal cual
}

// ---- SPA: cualquier otra ruta sirve el index ----
$index = $root . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

http_response_code(404);
echo 'Not found: ' . htmlspecialchars($uri);
return true;
