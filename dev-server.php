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

// Sin caché en desarrollo: el servidor embebido de PHP no manda cabeceras y el
// navegador se queda con JS/CSS/HTML viejos entre ediciones. (En producción los
// .htaccess de Apache/LiteSpeed hacen esto.)
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

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
    // Se sirven a mano (no `return false`) para poder añadir el no-cache:
    // con `return false` el servidor embebido ignora las cabeceras de arriba
    // y el navegador se queda con el JS/CSS anterior tras cada edición.
    static $MIME = [
        'html' => 'text/html; charset=utf-8', 'js' => 'application/javascript; charset=utf-8',
        'mjs' => 'application/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8',
        'json' => 'application/json; charset=utf-8', 'map' => 'application/json; charset=utf-8',
        'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif', 'webp' => 'image/webp', 'avif' => 'image/avif', 'ico' => 'image/x-icon',
        'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'eot' => 'application/vnd.ms-fontobject',
        'mp4' => 'video/mp4', 'webm' => 'video/webm', 'txt' => 'text/plain; charset=utf-8',
        'webmanifest' => 'application/manifest+json',
    ];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($MIME[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($path));
    readfile($path);
    return true;
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
