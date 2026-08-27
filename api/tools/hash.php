<?php
/**
 * Utilidad de desarrollo: genera un hash bcrypt para una contraseña.
 *
 *   Navegador:  http://localhost/api/tools/hash.php?p=miClave
 *   CLI:        php api/tools/hash.php miClave
 *
 * Copia el hash resultante a la columna users.password_hash.
 * Borra o protege este archivo en producción.
 */

$pass = $_GET['p'] ?? ($argv[1] ?? null);

header('Content-Type: text/plain; charset=utf-8');

if ($pass === null || $pass === '') {
    echo "Uso: ?p=TU_CONTRASENA  (o por CLI: php hash.php TU_CONTRASENA)\n";
    exit;
}

echo password_hash($pass, PASSWORD_DEFAULT), "\n";
