<?php
/**
 * Conexión PDO única (singleton) a MySQL/MariaDB.
 */
class Database
{
    /** @var PDO|null */
    private static $pdo = null;

    /** Mensaje del último intento de conexión fallido en ESTA petición. */
    private static $connectError = null;

    /** @return PDO */
    public static function pdo()
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        if (!self::connect()) {
            Response::error(
                500,
                'db_connection_failed',
                App::isDev() ? self::$connectError : 'No se pudo conectar con la base de datos.'
            );
        }
        return self::$pdo;
    }

    /**
     * Abre la conexión UNA sola vez por petición: si ya falló (ping() o pdo()
     * anteriores) no se reintenta, porque cada intento contra un MySQL apagado
     * cuesta segundos y el panel/la tienda hacen varias consultas por request.
     */
    private static function connect()
    {
        if (self::$pdo instanceof PDO) {
            return true;
        }
        if (self::$connectError !== null) {
            return false;
        }

        $cfg = App::config('db');
        if (!self::reachable($cfg)) {
            self::$connectError = sprintf('MySQL no responde en %s:%d.', $cfg['host'], (int) $cfg['port']);
            return false;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['host'],
            (int) $cfg['port'],
            $cfg['name'],
            $cfg['charset']
        );
        try {
            self::$pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 3,
            ]);
        } catch (\Throwable $e) {
            self::$pdo = null;
            self::$connectError = $e->getMessage();
            return false;
        }

        self::initSession(self::$pdo);
        return true;
    }

    /**
     * Sondeo TCP rápido (0.5 s) antes de PDO, SOLO en Windows (XAMPP local):
     * ahí una conexión rechazada tarda ~2 s en fallar y el servidor embebido de
     * PHP atiende una petición a la vez, así que con MySQL apagado la página
     * entera se quedaba "cargando la base de datos". En Linux (Hostinger) el
     * rechazo es instantáneo y no se sondea nada.
     */
    private static function reachable(array $cfg)
    {
        if (PHP_OS_FAMILY !== 'Windows') {
            return true;
        }
        $host = (string) $cfg['host'];
        if ($host === '' || $host === 'localhost') {
            $host = '127.0.0.1';
        }
        $fp = @fsockopen($host, (int) $cfg['port'], $errno, $errstr, 0.5);
        if (!$fp) {
            return false;
        }
        fclose($fp);
        return true;
    }

    /**
     * La sesión de MySQL usa la MISMA zona que PHP (App::timezone): NOW(),
     * CURDATE() y los DEFAULT CURRENT_TIMESTAMP quedan en hora de México
     * aunque el servidor (Hostinger) esté en UTC. Se usa el desfase
     * ("-06:00") porque el hosting puede no tener cargadas las zonas por nombre.
     */
    private static function initSession(PDO $pdo)
    {
        // Mismo cotejo que las tablas. MariaDB 11.8 (Hostinger) usa por
        // defecto utf8mb4_uca1400_ai_ci y comparar esos textos contra los de
        // las vistas daba "#1267 Illegal mix of collations".
        try {
            $pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        } catch (\Throwable $e) {
            // Cotejo no disponible: se sigue con el de la conexión.
        }
        try {
            $pdo->exec("SET time_zone = '" . (new DateTime('now'))->format('P') . "'");
        } catch (\Throwable $e) {
            // Sin permiso para cambiarla: se sigue con la del servidor.
        }
    }

    /**
     * ¿La base de datos acepta conexión?  Devuelve bool y NO aborta la
     * petición (pdo() llama a Response::error()+exit al fallar; esto no).
     * Úsalo en endpoints que deben responder aunque MySQL esté caído
     * (p. ej. /health o el catálogo público, que tiene APIs externas).
     */
    public static function ping()
    {
        return self::connect();
    }

    /** Ejecuta una consulta preparada y devuelve el statement. */
    public static function run($sql, array $params = [])
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /** Primera fila o null. */
    public static function one($sql, array $params = [])
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /** Todas las filas. */
    public static function all($sql, array $params = [])
    {
        return self::run($sql, $params)->fetchAll();
    }

    /** Valor escalar de la primera columna. */
    public static function scalar($sql, array $params = [])
    {
        return self::run($sql, $params)->fetchColumn();
    }

    public static function lastId()
    {
        return (int) self::pdo()->lastInsertId();
    }

    public static function begin()   { self::pdo()->beginTransaction(); }
    public static function commit()  { self::pdo()->commit(); }
    public static function rollback()
    {
        if (self::pdo()->inTransaction()) {
            self::pdo()->rollBack();
        }
    }
}
