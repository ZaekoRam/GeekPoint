<?php
/**
 * Clase base para los controladores.
 */
abstract class Controller
{
    /** @var Request */
    protected $req;

    /** @var array|null usuario autenticado (se llena con auth()) */
    protected $user = null;

    public function __construct(Request $request)
    {
        $this->req = $request;
    }

    /** Exige sesión válida. */
    protected function auth()
    {
        $this->user = Auth::requireAuth($this->req);
        return $this->user;
    }

    /** Exige uno de los roles. */
    protected function authRole(array $roles)
    {
        $this->user = Auth::requireRole($this->req, $roles);
        return $this->user;
    }

    protected function body($key, $default = null)
    {
        return $this->req->input($key, $default);
    }

    protected function query($key, $default = null)
    {
        return $this->req->query($key, $default);
    }

    protected function intOrNull($v)
    {
        return ($v === null || $v === '') ? null : (int) $v;
    }

    /** Devuelve $v si está en $allowed; si no, $default. Evita accesos a claves indefinidas. */
    protected function pickEnum($v, array $allowed, $default)
    {
        return in_array($v, $allowed, true) ? $v : $default;
    }
}
