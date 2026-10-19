<?php

class AuthController extends Controller
{
    public function login()
    {
        $data = $this->req->all();
        Validator::make($data)
            ->required('email', 'El correo')
            ->email('email')
            ->required('password', 'La contraseña')
            ->validateOrFail();

        $result = Auth::login($data['email'], $data['password'], $this->req);
        Response::ok($result);
    }

    /**
     * Registro público de clientes. El rol NUNCA se lee del body: Auth::register
     * siempre da de alta con role='customer', así que no hay forma de que
     * alguien se autoasigne admin/manager/cashier desde este endpoint.
     */
    public function register()
    {
        $data = $this->req->all();
        Validator::make($data)
            ->required('name', 'El nombre')
            ->required('email', 'El correo')->email('email')
            ->required('password', 'La contraseña')
            ->required('password_confirmation', 'Confirma tu contraseña')
            ->validateOrFail();

        if (strlen((string) $data['password']) < 6) {
            Response::validation(['password' => ['Mínimo 6 caracteres.']]);
        }
        if ($data['password'] !== $data['password_confirmation']) {
            Response::validation(['password_confirmation' => ['Las contraseñas no coinciden.']]);
        }

        $result = Auth::register($data, $this->req);
        $row = Database::one('SELECT * FROM users WHERE id = ?', [(int) $result['user']['id']]);
        $result['verification_sent'] = $row ? $this->sendVerification($row) : false;
        Response::ok($result, 201);
    }

    public function logout()
    {
        Auth::logout($this->req);
        Response::ok(['message' => 'Sesión cerrada.']);
    }

    public function me()
    {
        $user = $this->auth();

        $branch = null;
        if ($user['branch_id']) {
            $branch = Database::one(
                'SELECT id, code, name, city, state, status FROM branches WHERE id = ?',
                [$user['branch_id']]
            );
        }

        Response::ok([
            'user'   => Auth::publicUser($user),
            'branch' => $branch,
        ]);
    }

    /**
     * PUT /auth/me — el propio usuario autenticado edita su nombre/correo.
     * No toca role/branch_id/status: eso sigue siendo exclusivo del admin
     * (UserController), esto es solo autoservicio de "Información personal".
     */
    public function updateMe()
    {
        $user = $this->auth();
        $d = $this->req->all();

        Validator::make($d)
            ->required('name', 'El nombre')
            ->required('email', 'El correo')->email('email')
            ->validateOrFail();

        $email = strtolower(trim($d['email']));
        if (Database::scalar('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $user['id']])) {
            Response::error(409, 'duplicate', 'Ese correo ya está en uso.');
        }

        Database::run(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [mb_substr(trim($d['name']), 0, 120), $email, (int) $user['id']]
        );

        $emailChanged = $email !== strtolower((string) $user['email']);
        if ($emailChanged) {
            // El correo nuevo no está verificado: se pide verificarlo y se
            // avisa al anterior (por si alguien más cambió el correo).
            try { Database::run('UPDATE users SET email_verified_at = NULL WHERE id = ?', [(int) $user['id']]); }
            catch (\Throwable $e) { error_log('[verify] ' . $e->getMessage()); }
            Mailer::emailChanged($user['email'], $email);
        }
        $fresh = Database::one('SELECT * FROM users WHERE id = ?', [$user['id']]);
        $out = ['user' => Auth::publicUser($fresh)];
        if ($emailChanged) $out['verification_sent'] = $this->sendVerification($fresh);
        Response::ok($out);
    }

    /**
     * PATCH /auth/password — cambio de contraseña autoservicio: exige la
     * contraseña actual (a diferencia de UserController::update, que es el
     * admin reseteando la de otro usuario sin conocerla).
     */
    public function changePassword()
    {
        $user = $this->auth();
        $d = $this->req->all();

        Validator::make($d)
            ->required('current_password', 'Tu contraseña actual')
            ->required('password', 'La nueva contraseña')
            ->required('password_confirmation', 'Confirma la nueva contraseña')
            ->validateOrFail();

        $row = Database::one('SELECT password_hash FROM users WHERE id = ?', [$user['id']]);
        if (!$row || !password_verify($d['current_password'], $row['password_hash'])) {
            Response::validation(['current_password' => ['La contraseña actual no es correcta.']]);
        }
        if (strlen((string) $d['password']) < 6) {
            Response::validation(['password' => ['Mínimo 6 caracteres.']]);
        }
        if ($d['password'] !== $d['password_confirmation']) {
            Response::validation(['password_confirmation' => ['Las contraseñas no coinciden.']]);
        }

        Database::run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash($d['password'], PASSWORD_DEFAULT), (int) $user['id']]
        );
        if (!empty($user['email_verified_at'])) Mailer::passwordChanged($user);

        Response::ok(['message' => 'Contraseña actualizada.']);
    }

    /* ---------------- Verificación de correo ---------------- */

    /** GET /auth/verify?token=… — enlace del correo. Redirige a la tienda. */
    public function verifyEmail()
    {
        $token = (string) $this->query('token', '');
        $ok = false;
        if (preg_match('/^[a-f0-9]{64}$/', $token)) {
            $row = Database::one(
                'SELECT id FROM users WHERE email_token_hash = ? AND email_token_sent_at > NOW() - INTERVAL 48 HOUR LIMIT 1',
                [hash('sha256', $token)]
            );
            if ($row) {
                Database::run('UPDATE users SET email_verified_at = NOW(), email_token_hash = NULL WHERE id = ?', [(int) $row['id']]);
                $ok = true;
            }
        }
        header('Location: ' . Mailer::siteUrl() . '/?verificado=' . ($ok ? '1' : '0') . '#/' . ($ok ? 'cuenta' : ''), true, 302);
        exit;
    }

    /** POST /auth/verify/resend — reenvía el enlace (máx. 1 por minuto). */
    public function resendVerification()
    {
        $user = Database::one('SELECT * FROM users WHERE id = ?', [(int) $this->auth()['id']]);
        if (!empty($user['email_verified_at'])) {
            Response::ok(['verified' => true, 'message' => 'Tu correo ya está verificado.']);
        }
        if (!empty($user['email_token_sent_at']) && strtotime($user['email_token_sent_at']) > time() - 60) {
            Response::error(429, 'too_soon', 'Ya te enviamos un correo hace un momento. Espera un minuto para pedir otro.');
        }
        if (!$this->sendVerification($user)) {
            Response::error(503, 'mail_failed', 'No pudimos enviar el correo. Inténtalo más tarde.');
        }
        Response::ok(['sent' => true, 'message' => 'Te enviamos un nuevo enlace de verificación.']);
    }

    /**
     * Genera un token nuevo (se guarda solo su hash) y manda el enlace.
     * Nunca lanza: si falla, el registro/cambio de correo sigue adelante.
     */
    private function sendVerification(array $user)
    {
        try {
            $token = bin2hex(random_bytes(32));
            Database::run('UPDATE users SET email_token_hash = ?, email_token_sent_at = NOW() WHERE id = ?',
                [hash('sha256', $token), (int) $user['id']]);
            return Mailer::verifyEmail($user, Mailer::siteUrl() . '/api/auth/verify?token=' . $token);
        } catch (\Throwable $e) {
            error_log('[verify] ' . $e->getMessage());
            return false;
        }
    }
}
