<?php

class BranchController extends Controller
{
    public function index()
    {
        $user = $this->auth();

        if ($user['role'] === 'admin') {
            $rows = Database::all(
                'SELECT b.*,
                        (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.role = "manager") AS managers,
                        (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.role = "cashier") AS cashiers,
                        (SELECT COUNT(*) FROM products p WHERE p.branch_id = b.id AND p.status = "active") AS products,
                        (SELECT COUNT(*) FROM products p WHERE p.branch_id = b.id AND p.status = "active" AND p.stock <= p.min_stock) AS low_stock
                 FROM branches b
                 ORDER BY b.name'
            );
        } else {
            $rows = Database::all('SELECT * FROM branches WHERE id = ?', [$user['branch_id']]);
        }
        Response::ok(['branches' => $this->cast($rows)]);
    }

    public function show($id)
    {
        $user = $this->auth();
        Auth::assertBranchAccess($user, $id);
        $row = Database::one('SELECT * FROM branches WHERE id = ?', [(int) $id]);
        if (!$row) Response::notFound('Sucursal no encontrada.');
        Response::ok(['branch' => $this->cast([$row])[0]]);
    }

    public function store()
    {
        $this->authRole(['admin']);
        $d = $this->req->all();

        Validator::make($d)
            ->required('code', 'La clave')
            ->required('name', 'El nombre')
            ->in('status', ['active', 'inactive'])
            ->validateOrFail();

        $exists = Database::scalar('SELECT id FROM branches WHERE code = ?', [trim($d['code'])]);
        if ($exists) Response::error(409, 'duplicate', 'Ya existe una sucursal con esa clave.');

        Database::run(
            'INSERT INTO branches (code, name, city, state, address, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                trim($d['code']), trim($d['name']),
                $d['city'] ?? '', $d['state'] ?? '',
                $d['address'] ?? '', $d['phone'] ?? '',
                $d['status'] ?? 'active',
            ]
        );
        $id = Database::lastId();
        Response::ok(['branch' => Database::one('SELECT * FROM branches WHERE id = ?', [$id])], 201);
    }

    public function update($id)
    {
        $this->authRole(['admin']);
        $id = (int) $id;
        $current = Database::one('SELECT * FROM branches WHERE id = ?', [$id]);
        if (!$current) Response::notFound('Sucursal no encontrada.');

        $d = $this->req->all();
        Validator::make($d)
            ->required('code', 'La clave')
            ->required('name', 'El nombre')
            ->validateOrFail();

        $dupe = Database::scalar('SELECT id FROM branches WHERE code = ? AND id <> ?', [trim($d['code']), $id]);
        if ($dupe) Response::error(409, 'duplicate', 'Ya existe otra sucursal con esa clave.');

        Database::run(
            'UPDATE branches SET code = ?, name = ?, city = ?, state = ?, address = ?, phone = ?, status = ?
             WHERE id = ?',
            [
                trim($d['code']), trim($d['name']),
                $d['city'] ?? $current['city'], $d['state'] ?? $current['state'],
                $d['address'] ?? $current['address'], $d['phone'] ?? $current['phone'],
                $d['status'] ?? $current['status'],
                $id,
            ]
        );
        Response::ok(['branch' => Database::one('SELECT * FROM branches WHERE id = ?', [$id])]);
    }

    public function setStatus($id)
    {
        $this->authRole(['admin']);
        $id = (int) $id;
        $status = $this->body('status');
        if (!in_array($status, ['active', 'inactive'], true)) {
            Response::validation(['status' => ['Estado no válido.']]);
        }
        $ok = Database::run('UPDATE branches SET status = ? WHERE id = ?', [$status, $id])->rowCount();
        if (!$ok && !Database::scalar('SELECT id FROM branches WHERE id = ?', [$id])) {
            Response::notFound('Sucursal no encontrada.');
        }
        Response::ok(['id' => $id, 'status' => $status]);
    }

    public function destroy($id)
    {
        $this->authRole(['admin']);
        $id = (int) $id;

        $sales = (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE branch_id = ?', [$id]);
        if ($sales > 0) {
            Response::error(
                409,
                'has_sales',
                'La sucursal tiene ventas registradas. Desactívala en lugar de eliminarla.'
            );
        }
        $deleted = Database::run('DELETE FROM branches WHERE id = ?', [$id])->rowCount();
        if (!$deleted) Response::notFound('Sucursal no encontrada.');
        Response::ok(['deleted' => $id]);
    }

    private function cast($rows)
    {
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            foreach (['managers', 'cashiers', 'products', 'low_stock'] as $k) {
                if (isset($r[$k])) $r[$k] = (int) $r[$k];
            }
        }
        return $rows;
    }
}
