<?php

class RegisterController extends Controller
{
    public function index()
    {
        $user = $this->auth();
        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));

        if ($branchId !== null) {
            $rows = Database::all(
                'SELECT r.*, b.name AS branch_name
                 FROM registers r JOIN branches b ON b.id = r.branch_id
                 WHERE r.branch_id = ? ORDER BY r.name',
                [$branchId]
            );
        } else {
            $rows = Database::all(
                'SELECT r.*, b.name AS branch_name
                 FROM registers r JOIN branches b ON b.id = r.branch_id
                 ORDER BY b.name, r.name'
            );
        }
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['branch_id'] = (int) $r['branch_id'];
        }
        Response::ok(['registers' => $rows]);
    }

    public function store()
    {
        $user = $this->authRole(['admin', 'manager']);
        $d = $this->req->all();

        $branchId = $user['role'] === 'admin'
            ? $this->intOrNull($d['branch_id'] ?? null)
            : (int) $user['branch_id'];

        Validator::make($d)->required('name', 'El nombre de la caja')->validateOrFail();
        if (!$branchId || !Database::scalar('SELECT id FROM branches WHERE id = ?', [$branchId])) {
            Response::validation(['branch_id' => ['Sucursal no válida.']]);
        }
        Auth::assertBranchAccess($user, $branchId);

        Database::run(
            'INSERT INTO registers (branch_id, name, status) VALUES (?, ?, ?)',
            [$branchId, trim($d['name']), $this->pickEnum($d['status'] ?? 'active', ['active', 'inactive'], 'active')]
        );
        $id = Database::lastId();
        Response::ok(['register' => Database::one('SELECT * FROM registers WHERE id = ?', [$id])], 201);
    }

    public function destroy($id)
    {
        $user = $this->authRole(['admin', 'manager']);
        $id = (int) $id;
        $reg = Database::one('SELECT * FROM registers WHERE id = ?', [$id]);
        if (!$reg) Response::notFound('Caja no encontrada.');
        Auth::assertBranchAccess($user, $reg['branch_id']);

        $sales = (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE register_id = ?', [$id]);
        if ($sales > 0) {
            Database::run('UPDATE registers SET status = "inactive" WHERE id = ?', [$id]);
            Response::ok(['soft_deleted' => $id, 'message' => 'La caja tiene ventas; se desactivó para conservar el historial.']);
        }
        Database::run('DELETE FROM registers WHERE id = ?', [$id]);
        Response::ok(['deleted' => $id]);
    }
}
