<?php
/**
 * Autenticación por token Bearer respaldado en la tabla `sessions`.
 */
class Auth
{
    /** @var array|null Usuario autenticado en la petición actual. */
    private static $user = null;

    /**
     * Verifica credenciales y crea una sesión.
     * @return array{token:string, user:array}
     */
    public static function login($email, $password, Request $req)
    {
        $user = Database::one(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [strtolower(trim($email))]
        );

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error(401, 'invalid_credentials', 'Correo o contraseña incorrectos.');
        }
        if ($user['status'] !== 'active') {
            Response::error(403, 'user_inactive', 'Tu cuenta está desactivada. Contacta al administrador.');
        }

        return self::createSession($user, $req);
    }

    /**
     * Registro público. SIEMPRE crea la cuenta con role='customer' — el
     * cliente que envíe la petición no puede elegir ni sobreescribir el rol
     * (ese campo del body, si viene, se ignora por completo). Deja sesión
     * iniciada de una vez, igual que login().
     * @return array{token:string, user:array}
     */
    public static function register(array $data, Request $req)
    {
        $email = strtolower(trim($data['email']));
        if (Database::scalar('SELECT id FROM users WHERE email = ?', [$email])) {
            Response::error(409, 'duplicate', 'Ya existe una cuenta con ese correo.');
        }

        Database::run(
            'INSERT INTO users (name, email, password_hash, role, branch_id, status)
             VALUES (?, ?, ?, ?, NULL, ?)',
            [trim($data['name']), $email, password_hash($data['password'], PASSWORD_DEFAULT), 'customer', 'active']
        );
        $user = Database::one('SELECT * FROM users WHERE id = ?', [Database::lastId()]);

        return self::createSession($user, $req);
    }

    /** Crea la sesión (token Bearer) para un usuario ya validado/creado. */
    private static function createSession(array $user, Request $req)
    {
        $token = bin2hex(random_bytes(32));
        $hash  = hash('sha256', $token);
        $ttl   = (int) App::config('auth')['token_ttl_hours'];
        $expires = (new DateTime('+' . $ttl . ' hours'))->format('Y-m-d H:i:s');

        Database::run(
            'INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at)
             VALUES (?, ?, ?, ?, ?)',
            [$user['id'], $hash, $req->userAgent(), $req->ip(), $expires]
        );

        Database::run('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$user['id']]);

        return ['token' => $token, 'user' => self::publicUser($user)];
    }

    public static function logout(Request $req)
    {
        $token = $req->bearerToken();
        if ($token) {
            Database::run('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
        }
    }

    /** Devuelve el usuario autenticado o null (sin abortar). */
    public static function attempt(Request $req)
    {
        if (self::$user !== null) {
            return self::$user;
        }
        $token = $req->bearerToken();
        if (!$token) {
            return null;
        }
        $row = Database::one(
            'SELECT u.*, s.expires_at, s.id AS session_id
             FROM sessions s
             JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = ? LIMIT 1',
            [hash('sha256', $token)]
        );
        if (!$row) {
            return null;
        }
        if (strtotime($row['expires_at']) < time()) {
            Database::run('DELETE FROM sessions WHERE id = ?', [$row['session_id']]);
            return null;
        }
        if ($row['status'] !== 'active') {
            return null;
        }
        self::$user = $row;
        return $row;
    }

    /** Exige autenticación; aborta 401 si falla. */
    public static function requireAuth(Request $req)
    {
        $user = self::attempt($req);
        if (!$user) {
            Response::unauthorized();
        }
        return $user;
    }

    /** Exige uno de los roles dados. */
    public static function requireRole(Request $req, array $roles)
    {
        $user = self::requireAuth($req);
        if (!in_array($user['role'], $roles, true)) {
            Response::forbidden();
        }
        return $user;
    }

    /**
     * Sucursal a la que el usuario tiene acceso para operar.
     * admin  -> puede indicar branch_id por query/body (o null = todas)
     * otros  -> forzado a su branch_id
     */
    public static function scopedBranchId($user, $requested = null)
    {
        if ($user['role'] === 'admin') {
            return $requested !== null && $requested !== '' ? (int) $requested : null;
        }
        return (int) $user['branch_id'];
    }

    /** Verifica que el usuario pueda tocar recursos de $branchId. */
    public static function assertBranchAccess($user, $branchId)
    {
        if ($user['role'] === 'admin') {
            return;
        }
        if ((int) $user['branch_id'] !== (int) $branchId) {
            Response::forbidden('Ese recurso pertenece a otra sucursal.');
        }
    }

    public static function publicUser(array $u)
    {
        return [
            'id'         => (int) $u['id'],
            'name'       => $u['name'],
            'email'      => $u['email'],
            'role'       => $u['role'],
            'branch_id'  => $u['branch_id'] !== null ? (int) $u['branch_id'] : null,
            'created_at' => $u['created_at'] ?? null,
        ];
    }
}
