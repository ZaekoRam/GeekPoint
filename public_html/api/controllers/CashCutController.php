<?php

/**
 * Corte de caja.
 *
 * Un "turno" va desde el último corte de ESA caja (o de la sucursal, si la
 * venta no trae caja) hasta ahora. Si nunca se ha hecho corte, desde las
 * 00:00 de hoy. Solo cuentan ventas completadas; las canceladas se reportan
 * aparte (void_count) y no suman.
 *
 * Efectivo esperado = fondo de caja + efectivo cobrado − cambio entregado.
 */
class CashCutController extends Controller
{
    /** GET /cash-cuts/preview?register_id= — resumen del turno abierto (no guarda nada) */
    public function preview()
    {
        $user = $this->authRole(['cashier', 'manager', 'admin']);
        list($branchId, $registerId) = $this->scope($user);
        Response::ok(['cut' => $this->summarize($branchId, $registerId, date('Y-m-d H:i:s'))]);
    }

    /**
     * POST /cash-cuts — cierra el turno.
     * Body: { branch_id?, register_id?, opening_cash?: number, cash_counted: number, notes?: string }
     */
    public function store()
    {
        $user = $this->authRole(['cashier', 'manager', 'admin']);
        list($branchId, $registerId) = $this->scope($user);

        $counted = $this->body('cash_counted');
        if (!is_numeric($counted) || (float) $counted < 0) {
            Response::validation(['cash_counted' => ['Captura el efectivo que contaste en la caja.']]);
        }
        $opening = $this->body('opening_cash', 0);
        $opening = is_numeric($opening) && (float) $opening > 0 ? round((float) $opening, 2) : 0.0;

        Database::begin();
        try {
            // Serializa cortes de la misma sucursal (dos cajeros a la vez).
            Database::one('SELECT id FROM branches WHERE id = ? FOR UPDATE', [$branchId]);
            $s = $this->summarize($branchId, $registerId, date('Y-m-d H:i:s'));
            $expected = round($opening + $s['cash_total'], 2);
            $diff = round((float) $counted - $expected, 2);

            Database::run(
                'INSERT INTO cash_cuts
                   (branch_id, register_id, user_id, from_at, to_at, sales_count, void_count, total_sales,
                    cash_total, card_total, transfer_total, opening_cash, cash_counted, difference, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $branchId, $registerId, $user['id'], $s['from_at'], $s['to_at'],
                    $s['sales_count'], $s['void_count'], $s['total_sales'],
                    $s['cash_total'], $s['card_total'], $s['transfer_total'],
                    $opening, round((float) $counted, 2), $diff,
                    mb_substr(trim((string) $this->body('notes', '')), 0, 300),
                ]
            );
            $id = Database::lastId();
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }
        Response::ok(['cut' => $this->find($id)], 201);
    }

    /** GET /cash-cuts — historial (gerente: su sucursal; admin: todas o ?branch_id) */
    public function index()
    {
        $user = $this->authRole(['cashier', 'manager', 'admin']);
        $where = ['1=1'];
        $params = [];
        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));
        if ($branchId !== null) { $where[] = 'c.branch_id = ?'; $params[] = $branchId; }
        if ($user['role'] === 'cashier') { $where[] = 'c.user_id = ?'; $params[] = (int) $user['id']; }

        $rows = Database::all(
            'SELECT c.*, b.name AS branch_name, r.name AS register_name, u.name AS user_name
             FROM cash_cuts c
             JOIN branches b ON b.id = c.branch_id
             JOIN users u ON u.id = c.user_id
             LEFT JOIN registers r ON r.id = c.register_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY c.to_at DESC LIMIT 100',
            $params
        );
        Response::ok(['cuts' => array_map([$this, 'cast'], $rows)]);
    }

    // ---------------------------------------------------------------

    private function scope($user)
    {
        $branchId = Auth::scopedBranchId($user, $this->body('branch_id', $this->query('branch_id')));
        if ($branchId === null) {
            Response::validation(['branch_id' => ['Indica la sucursal del corte.']]);
        }
        Auth::assertBranchAccess($user, $branchId);
        $registerId = $this->intOrNull($this->body('register_id', $this->query('register_id')));
        if ($registerId) {
            $ok = Database::one('SELECT id FROM registers WHERE id = ? AND branch_id = ?', [$registerId, $branchId]);
            if (!$ok) Response::validation(['register_id' => ['La caja no pertenece a la sucursal.']]);
        }
        return [$branchId, $registerId ?: null];
    }

    private function summarize($branchId, $registerId, $now)
    {
        $regSql = $registerId ? 's.register_id = ?' : 's.register_id IS NULL';
        $base = [$branchId];
        if ($registerId) $base[] = $registerId;

        $from = Database::scalar(
            'SELECT MAX(to_at) FROM cash_cuts WHERE branch_id = ? AND ' . ($registerId ? 'register_id = ?' : 'register_id IS NULL'),
            $base
        );
        if (!$from) $from = date('Y-m-d 00:00:00');

        $win = 's.branch_id = ? AND ' . $regSql . ' AND s.created_at > ? AND s.created_at <= ?';
        $p = array_merge($base, [$from, $now]);

        $agg = Database::one(
            'SELECT COUNT(*) AS n, COALESCE(SUM(s.total),0) AS total, COALESCE(SUM(s.change_due),0) AS change_due
             FROM sales s WHERE ' . $win . ' AND s.status = "completed"', $p
        );
        $voids = (int) Database::scalar('SELECT COUNT(*) FROM sales s WHERE ' . $win . ' AND s.status = "void"', $p);

        $by = ['cash' => 0.0, 'card' => 0.0, 'transfer' => 0.0];
        // Ventas con renglones de pago (pago mixto y posteriores)...
        foreach (Database::all(
            'SELECT sp.method, SUM(sp.amount) AS amt FROM sale_payments sp JOIN sales s ON s.id = sp.sale_id
             WHERE ' . $win . ' AND s.status = "completed" GROUP BY sp.method', $p) as $r) {
            $by[$r['method']] += (float) $r['amt'];
        }
        // ...y ventas anteriores a sale_payments (un solo método).
        foreach (Database::all(
            'SELECT s.payment_method AS method, SUM(s.amount_paid) AS amt FROM sales s
             WHERE ' . $win . ' AND s.status = "completed"
               AND NOT EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.sale_id = s.id)
             GROUP BY s.payment_method', $p) as $r) {
            if (isset($by[$r['method']])) $by[$r['method']] += (float) $r['amt'];
        }

        return [
            'branch_id'      => (int) $branchId,
            'register_id'    => $registerId ? (int) $registerId : null,
            'from_at'        => $from,
            'to_at'          => $now,
            'sales_count'    => (int) $agg['n'],
            'void_count'     => $voids,
            'total_sales'    => round((float) $agg['total'], 2),
            'cash_total'     => round($by['cash'] - (float) $agg['change_due'], 2),
            'card_total'     => round($by['card'], 2),
            'transfer_total' => round($by['transfer'], 2),
        ];
    }

    private function find($id)
    {
        $r = Database::one(
            'SELECT c.*, b.name AS branch_name, r.name AS register_name, u.name AS user_name
             FROM cash_cuts c JOIN branches b ON b.id = c.branch_id JOIN users u ON u.id = c.user_id
             LEFT JOIN registers r ON r.id = c.register_id WHERE c.id = ?', [(int) $id]
        );
        return $r ? $this->cast($r) : null;
    }

    private function cast($r)
    {
        foreach (['id', 'branch_id', 'user_id', 'sales_count', 'void_count'] as $k) $r[$k] = (int) $r[$k];
        $r['register_id'] = $r['register_id'] !== null ? (int) $r['register_id'] : null;
        foreach (['total_sales', 'cash_total', 'card_total', 'transfer_total', 'opening_cash', 'cash_counted', 'difference'] as $k) {
            $r[$k] = (float) $r[$k];
        }
        return $r;
    }
}
