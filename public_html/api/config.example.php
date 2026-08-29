<?php
/**
 * GeekPoint POS — Configuración de la API.
 *
 * 1. Copia este archivo como  config.php
 * 2. Ajusta los datos de tu base de datos (Hostinger → hPanel → Bases de datos MySQL)
 * 3. NUNCA subas config.php a un repositorio público.
 */

return [
    // ---- Base de datos ----
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'geekpoint_pos',
        'user'    => 'root',
        'pass'    => '',
        'charset' => 'utf8mb4',
    ],

    // ---- Seguridad / sesiones ----
    'auth' => [
        // Horas de validez de un token de acceso.
        'token_ttl_hours' => 12,
        // Segundos de vida de la cookie/'"remember"' (no usado por defecto).
    ],

    // ---- CORS ----
    // Orígenes permitidos para el front-end. Usa '*' solo en desarrollo.
    // En producción pon la URL exacta, p. ej. 'https://tudominio.com'.
    'cors' => [
        'allowed_origins' => ['*'],
    ],

    // ---- Impuestos ----
    'tax' => [
        'default_rate' => 0.16, // IVA México
    ],

    // ---- Integraciones externas (opcionales) ----
    'integrations' => [
        // https://dev.pokemontcg.io/  — deja vacío para usar el límite público.
        'pokemontcg_key' => '',
    ],

    // ---- Entorno ----
    // 'dev' muestra errores detallados; 'prod' los oculta.
    'env' => 'dev',
];
