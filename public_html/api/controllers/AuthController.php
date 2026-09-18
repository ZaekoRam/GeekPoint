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

        Response::ok(['user' => Auth::publicUser(Database::one('SELECT * FROM users WHERE id = ?', [$user['id']]))]);
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

        Response::ok(['message' => 'Contraseña actualizada.']);
    }
}
