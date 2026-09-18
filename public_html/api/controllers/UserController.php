<?php

class UserController extends Controller
{
    public function index()
    {
        $this->authRole(['admin']);

        // Este listado es de PERSONAL (admin/gerente/cajero) — los clientes que
        // se registran solos desde la tienda no son "usuarios" a administrar
        // aquí (no tienen sucursal ni el resto de la ficha de personal).
        $where  = ["u.role IN ('admin','manager','cashier')"];
        $params = [];

        if (($role = $this->query('role')) && in_array($role, ['admin', 'manager', 'cashier'], true)) {
            $where[] = 'u.role = ?';
            $params[] = $role;
        }
        if (($bid = $this->query('branch_id')) !== null && $bid !== '') {
            $where[] = 'u.branch_id = ?';
            $params[] = (int) $bid;
        }

        $rows = Database::all(
            'SELECT u.id, u.name, u.email, u.role, u.branch_id, u.status, u.last_login_at, u.created_at,
                    b.name AS branch_name
             FROM users u
             LEFT JOIN branches b ON b.id = u.branch_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY u.role, u.name',
            $params
        );
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['branch_id'] = $r['branch_id'] !== null ? (int) $r['branch_id'] : null;
        }
        Response::ok(['users' => $rows]);
    }

    public function store()
    {
        $this->authRole(['admin']);
        $d = $this->req->all();

        Validator::make($d)
            ->required('name', 'El nombre')
            ->required('email', 'El correo')->email('email')
            ->required('password', 'La contraseña')
            ->required('role', 'El rol')->in('role', ['manager', 'cashier'])
            ->validateOrFail();

        if (strlen((string) $d['password']) < 6) {
            Response::validation(['password' => ['Mínimo 6 caracteres.']]);
        }

        // manager y cashier requieren sucursal
        $branchId = $this->intOrNull($d['branch_id'] ?? null);
        if (!$branchId) {
            Response::validation(['branch_id' => ['Selecciona una sucursal.']]);
        }
        if (!Database::scalar('SELECT id FROM branches WHERE id = ?', [$branchId])) {
            Response::validation(['branch_id' => ['La sucursal no existe.']]);
        }

        $email = strtolower(trim($d['email']));
        if (Database::scalar('SELECT id FROM users WHERE email = ?', [$email])) {
            Response::error(409, 'duplicate', 'Ya existe un usuario con ese correo.');
        }

        Database::run(
            'INSERT INTO users (name, email, password_hash, role, branch_id, status)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                trim($d['name']), $email,
                password_hash($d['password'], PASSWORD_DEFAULT),
                $d['role'], $branchId,
                $this->pickEnum($d['status'] ?? 'active', ['active', 'inactive'], 'active'),
            ]
        );
        $id = Database::lastId();
        Response::ok(['user' => $this->find($id)], 201);
    }

    public function update($id)
    {
        $this->authRole(['admin']);
        $id = (int) $id;
        $current = Database::one('SELECT * FROM users WHERE id = ?', [$id]);
        if (!$current) Response::notFound('Usuario no encontrado.');

        $d = $this->req->all();
        Validator::make($d)
            ->required('name', 'El nombre')
            ->required('email', 'El correo')->email('email')
            ->validateOrFail();

        $email = strtolower(trim($d['email']));
        if (Database::scalar('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $id])) {
            Response::error(409, 'duplicate', 'Ese correo ya está en uso.');
        }

        $role = in_array($d['role'] ?? $current['role'], ['admin', 'manager', 'cashier'], true)
            ? $d['role'] : $current['role'];
        $branchId = array_key_exists('branch_id', $d)
            ? $this->intOrNull($d['branch_id'])
            : ($current['branch_id'] !== null ? (int) $current['branch_id'] : null);

        if ($role !== 'admin' && !$branchId) {
            Response::validation(['branch_id' => ['Los gerentes y cajeros necesitan sucursal.']]);
        }

        $fields = 'name = ?, email = ?, role = ?, branch_id = ?, status = ?';
        $params = [
            trim($d['name']), $email, $role,
            $role === 'admin' ? null : $branchId,
            $this->pickEnum($d['status'] ?? $current['status'], ['active', 'inactive'], $current['status']),
        ];

        if (!empty($d['password'])) {
            if (strlen((string) $d['password']) < 6) {
                Response::validation(['password' => ['Mínimo 6 caracteres.']]);
            }
            $fields .= ', password_hash = ?';
            $params[] = password_hash($d['password'], PASSWORD_DEFAULT);
        }

        $params[] = $id;
        Database::run("UPDATE users SET $fields WHERE id = ?", $params);
        Response::ok(['user' => $this->find($id)]);
    }

    public function setStatus($id)
    {
        $admin = $this->authRole(['admin']);
        $id = (int) $id;
        if ($id === (int) $admin['id']) {
            Response::error(409, 'self_change', 'No puedes cambiar el estado de tu propia cuenta.');
        }
        $status = $this->body('status');
        if (!in_array($status, ['active', 'inactive'], true)) {
            Response::validation(['status' => ['Estado no válido.']]);
        }
        $affected = Database::run('UPDATE users SET status = ? WHERE id = ?', [$status, $id])->rowCount();
        if (!$affected && !Database::scalar('SELECT id FROM users WHERE id = ?', [$id])) {
            Response::notFound('Usuario no encontrado.');
        }
        Response::ok(['id' => $id, 'status' => $status]);
    }

    public function destroy($id)
    {
        $admin = $this->authRole(['admin']);
        $id = (int) $id;
        if ($id === (int) $admin['id']) {
            Response::error(409, 'self_delete', 'No puedes eliminar tu propia cuenta.');
        }
        $sales = (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE user_id = ?', [$id]);
        if ($sales > 0) {
            Response::error(409, 'has_sales', 'El usuario tiene ventas registradas. Desactívalo en lugar de eliminarlo.');
        }
        $deleted = Database::run('DELETE FROM users WHERE id = ?', [$id])->rowCount();
        if (!$deleted) Response::notFound('Usuario no encontrado.');
        Response::ok(['deleted' => $id]);
    }

    private function find($id)
    {
        $r = Database::one(
            'SELECT u.id, u.name, u.email, u.role, u.branch_id, u.status, u.last_login_at, u.created_at,
                    b.name AS branch_name
             FROM users u LEFT JOIN branches b ON b.id = u.branch_id
             WHERE u.id = ?',
            [(int) $id]
        );
        if ($r) {
            $r['id'] = (int) $r['id'];
            $r['branch_id'] = $r['branch_id'] !== null ? (int) $r['branch_id'] : null;
        }
        return $r;
    }
}
