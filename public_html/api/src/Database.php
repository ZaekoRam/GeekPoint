<?php
/**
 * Conexión PDO única (singleton) a MySQL/MariaDB.
 */
class Database
{
    /** @var PDO|null */
    private static $pdo = null;

    /** @return PDO */
    public static function pdo()
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = App::config('db');
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
            ]);
        } catch (PDOException $e) {
            Response::error(
                500,
                'db_connection_failed',
                App::isDev() ? $e->getMessage() : 'No se pudo conectar con la base de datos.'
            );
        }

        return self::$pdo;
    }

    /**
     * ¿La base de datos acepta conexión?  Devuelve bool y NO aborta la
     * petición (pdo() llama a Response::error()+exit al fallar; esto no).
     * Úsalo en endpoints que deben responder aunque MySQL esté caído
     * (p. ej. /health o el catálogo público, que tiene APIs externas).
     */
    public static function ping()
    {
        if (self::$pdo instanceof PDO) {
            return true;
        }
        try {
            $cfg = App::config('db');
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $cfg['host'],
                (int) $cfg['port'],
                $cfg['name'],
                $cfg['charset']
            );
            self::$pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 3,
            ]);
            return true;
        } catch (\Throwable $e) {
            return false;
        }
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
