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
}
