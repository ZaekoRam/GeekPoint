<?php
/**
 * Apartados / reservas.
 * El cliente crea un apartado desde el carrito de la tienda pública (sin auth);
 * el personal lo consulta por folio y lo cobra/cancela desde el POS.
 *
 *   POST   /reservations                 (público)  crea el apartado -> folio GP-XXXX
 *   GET    /reservations                 (staff)    lista (filtros ?status= &branch_id=)
 *   GET    /reservations/{folio}          (staff)    detalle por folio (para el POS)
 *   PATCH  /reservations/{folio}/status   (staff)    { status: cobrada|cancelada, sale_id? }
 */
class ReservationController extends Controller
{
    /** POST /reservations */
    public function store()
    {
        $d = $this->req->all();

        Validator::make($d)
            ->required('customer_name', 'El nombre del cliente')
            ->validateOrFail();

        $items = $d['items'] ?? [];
        if (!is_array($items) || count($items) === 0) {
            Response::validation(['items' => ['El apartado no tiene productos.']]);
        }

        // Sucursal opcional por código.
        $branchId = null;
        $branchCode = trim((string) ($d['branch_code'] ?? ''));
        if ($branchCode !== '') {
            $branchId = Database::scalar('SELECT id FROM branches WHERE code = ? AND status = "active"', [$branchCode]);
            $branchId = $branchId ? (int) $branchId : null;
        }

        // Normaliza líneas y calcula totales EN EL SERVIDOR (precios con IVA incluido).
        $rate = (float) App::config('tax')['default_rate'];
        $clean = [];
        $total = 0.0;
        foreach ($items as $it) {
            $qty = max(1, (int) ($it['qty'] ?? $it['quantity'] ?? 1));
            $price = round((float) ($it['price'] ?? $it['unit_price'] ?? 0), 2);
            if ($price < 0) $price = 0;
            $line = round($price * $qty, 2);
            $clean[] = [
                'ref'   => mb_substr((string) ($it['ref'] ?? $it['id'] ?? ''), 0, 64),
                'title' => mb_substr((string) ($it['title'] ?? 'Producto'), 0, 200),
                'price' => $price,
                'qty'   => $qty,
                'line'  => $line,
            ];
            $total += $line;
        }
        $total = round($total, 2);
        $subtotal = round($total / (1 + $rate), 2);
        $tax = round($total - $subtotal, 2);

        // Folio único GP-XXXX.
        $folio = $this->uniqueFolio();

        Database::begin();
        try {
            Database::run(
                'INSERT INTO reservations
                   (folio, branch_id, customer_name, customer_email, customer_phone, subtotal, tax, total, status, note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pendiente", ?)',
                [
                    $folio, $branchId,
                    mb_substr(trim($d['customer_name']), 0, 120),
                    mb_substr(trim((string) ($d['customer_email'] ?? '')), 0, 160),
                    mb_substr(trim((string) ($d['customer_phone'] ?? '')), 0, 40),
                    $subtotal, $tax, $total,
                    mb_substr(trim((string) ($d['note'] ?? '')), 0, 255),
                ]
            );
            $rid = Database::lastId();
            foreach ($clean as $c) {
                Database::run(
                    'INSERT INTO reservation_items (reservation_id, product_ref, title, unit_price, quantity, line_total)
                     VALUES (?, ?, ?, ?, ?, ?)',
                    [$rid, $c['ref'], $c['title'], $c['price'], $c['qty'], $c['line']]
                );
            }
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }

        Response::ok($this->hydrate($this->findByFolio($folio)), 201);
    }

    /** GET /reservations */
    public function index()
    {
        $user = $this->authRole(['admin', 'manager', 'cashier']);
        $where = ['1=1'];
        $params = [];

        $status = $this->query('status', '');
        if (in_array($status, ['pendiente', 'cobrada', 'cancelada'], true)) {
            $where[] = 'r.status = ?';
            $params[] = $status;
        }

        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));
        if ($branchId !== null) {
            $where[] = '(r.branch_id = ? OR r.branch_id IS NULL)';
            $params[] = $branchId;
        }

        $rows = Database::all(
            'SELECT r.*, b.name AS branch_name, b.code AS branch_code,
                    (SELECT GROUP_CONCAT(CONCAT(ri.quantity, "× ", ri.title) ORDER BY ri.id SEPARATOR " · ")
                       FROM reservation_items ri WHERE ri.reservation_id = r.id) AS items_summary
             FROM reservations r
             LEFT JOIN branches b ON b.id = r.branch_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY (r.status = "pendiente") DESC, r.created_at DESC
             LIMIT 100',
            $params
        );

        Response::ok(['reservations' => array_map(function ($r) {
            $row = $this->castRow($r);
            $row['items_summary'] = $r['items_summary'] ?? '';
            return $row;
        }, $rows ?: [])]);
    }

    /** GET /reservations/{folio} */
    public function show($folio)
    {
        $user = $this->authRole(['admin', 'manager', 'cashier']);
        $row = $this->findByFolio($folio);
        if (!$row) Response::notFound('Apartado no encontrado.');
        if ($row['branch_id'] !== null) Auth::assertBranchAccess($user, (int) $row['branch_id']);
        Response::ok($this->hydrate($row));
    }

    /** PATCH /reservations/{folio}/status */
    public function resolve($folio)
    {
        $user = $this->authRole(['admin', 'manager', 'cashier']);
        $row = $this->findByFolio($folio);
        if (!$row) Response::notFound('Apartado no encontrado.');
        if ($row['branch_id'] !== null) Auth::assertBranchAccess($user, (int) $row['branch_id']);

        $status = $this->pickEnum($this->body('status', ''), ['cobrada', 'cancelada'], '');
        if ($status === '') {
            Response::validation(['status' => ['Estado no válido (cobrada | cancelada).']]);
        }
        if ($row['status'] !== 'pendiente') {
            Response::error(409, 'not_pending', 'El apartado ya está ' . $row['status'] . '.');
        }

        $saleId = $this->intOrNull($this->body('sale_id'));

        Database::run(
            'UPDATE reservations SET status = ?, sale_id = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?',
            [$status, $saleId, $user['id'], (int) $row['id']]
        );

        Response::ok($this->hydrate($this->findByFolio($folio)));
    }

    // ---------------------------------------------------------------

    private function uniqueFolio()
    {
        for ($i = 0; $i < 40; $i++) {
            $folio = 'GP-' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            if (!Database::scalar('SELECT id FROM reservations WHERE folio = ?', [$folio])) {
                return $folio;
            }
        }
        // Fallback improbable: sufijo alfanumérico.
        return 'GP-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    }

    private function findByFolio($folio)
    {
        return Database::one(
            'SELECT r.*, b.name AS branch_name, b.code AS branch_code
             FROM reservations r
             LEFT JOIN branches b ON b.id = r.branch_id
             WHERE r.folio = ? LIMIT 1',
            [strtoupper(trim((string) $folio))]
        );
    }

    private function hydrate($row)
    {
        if (!$row) return null;
        $items = Database::all(
            'SELECT id, product_ref, title, unit_price, quantity, line_total
             FROM reservation_items WHERE reservation_id = ? ORDER BY id',
            [(int) $row['id']]
        );
        $data = $this->castRow($row);
        $data['items'] = array_map(function ($it) {
            return [
                'id'         => (int) $it['id'],
                'product_ref' => $it['product_ref'],
                'title'      => $it['title'],
                'unit_price' => (float) $it['unit_price'],
                'quantity'   => (int) $it['quantity'],
                'line_total' => (float) $it['line_total'],
            ];
        }, $items ?: []);
        return $data;
    }

    private function castRow($r)
    {
        return [
            'id'             => (int) $r['id'],
            'folio'          => $r['folio'],
            'branch_id'      => $r['branch_id'] !== null ? (int) $r['branch_id'] : null,
            'branch_name'    => $r['branch_name'] ?? null,
            'branch_code'    => $r['branch_code'] ?? null,
            'customer_name'  => $r['customer_name'],
            'customer_email' => $r['customer_email'],
            'customer_phone' => $r['customer_phone'],
            'subtotal'       => (float) $r['subtotal'],
            'tax'            => (float) $r['tax'],
            'total'          => (float) $r['total'],
            'status'         => $r['status'],
            'note'           => $r['note'],
            'sale_id'        => $r['sale_id'] !== null ? (int) $r['sale_id'] : null,
            'resolved_at'    => $r['resolved_at'] ?? null,
            'created_at'     => $r['created_at'],
        ];
    }
}
