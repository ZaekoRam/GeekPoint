<?php

class SaleController extends Controller
{
    /**
     * POST /sales
     * Body: {
     *   register_id?: int,
     *   customer_name?: string,
     *   payment_method: 'cash'|'card'|'transfer',
     *   amount_paid?: number,
     *   items: [ { product_id: int, quantity: int } , ... ]
     * }
     * Transacción: valida stock, crea venta, descuenta inventario, registra movimientos.
     */
    public function store()
    {
        $user = $this->authRole(['cashier', 'manager', 'admin']);

        $branchId = Auth::scopedBranchId($user, $this->body('branch_id'));
        if ($branchId === null) {
            Response::validation(['branch_id' => ['Indica la sucursal de la venta.']]);
        }
        Auth::assertBranchAccess($user, $branchId);

        $method = $this->body('payment_method', 'cash');
        if (!in_array($method, ['cash', 'card', 'transfer'], true)) {
            Response::validation(['payment_method' => ['Método de pago no válido.']]);
        }

        $items = $this->body('items', []);
        if (!is_array($items) || count($items) === 0) {
            Response::validation(['items' => ['Agrega al menos un producto a la venta.']]);
        }

        // Consolida cantidades por producto
        $wanted = [];
        foreach ($items as $it) {
            $pid = (int) ($it['product_id'] ?? 0);
            $qty = (int) ($it['quantity'] ?? 0);
            if ($pid <= 0 || $qty <= 0) {
                Response::validation(['items' => ['Cada renglón necesita product_id y quantity válidos.']]);
            }
            $wanted[$pid] = ($wanted[$pid] ?? 0) + $qty;
        }

        $registerId = $this->intOrNull($this->body('register_id'));

        Database::begin();
        try {
            if ($registerId) {
                $reg = Database::one(
                    'SELECT id FROM registers WHERE id = ? AND branch_id = ? AND status = "active"',
                    [$registerId, $branchId]
                );
                if (!$reg) {
                    Database::rollback();
                    Response::validation(['register_id' => ['La caja no existe o no pertenece a la sucursal.']]);
                }
            }

            $ids = implode(',', array_map('intval', array_keys($wanted)));
            $rows = Database::all(
                "SELECT id, name, sku, price, tax_rate, stock, status
                 FROM products
                 WHERE branch_id = " . (int) $branchId . " AND id IN ($ids)
                 FOR UPDATE"
            );
            $byId = [];
            foreach ($rows as $r) $byId[(int) $r['id']] = $r;

            $lines = [];
            $subtotal = 0.0;
            $tax = 0.0;

            foreach ($wanted as $pid => $qty) {
                if (!isset($byId[$pid])) {
                    Database::rollback();
                    Response::error(422, 'product_not_found', "El producto #$pid no existe en esta sucursal.");
                }
                $p = $byId[$pid];
                if ($p['status'] !== 'active') {
                    Database::rollback();
                    Response::error(409, 'product_inactive', "El producto \"{$p['name']}\" está inactivo.");
                }
                if ((int) $p['stock'] < $qty) {
                    Database::rollback();
                    Response::error(409, 'insufficient_stock',
                        "Stock insuficiente de \"{$p['name']}\". Disponible: {$p['stock']}, solicitado: $qty.",
                        ['product_id' => $pid, 'available' => (int) $p['stock']]
                    );
                }

                $unit  = round((float) $p['price'], 2);
                $rate  = (float) $p['tax_rate'];
                // Precio con IVA incluido: se desglosa hacia atrás.
                $lineTotal    = round($unit * $qty, 2);
                $lineSubtotal = round($lineTotal / (1 + $rate), 2);
                $lineTax      = round($lineTotal - $lineSubtotal, 2);

                $subtotal += $lineSubtotal;
                $tax      += $lineTax;

                $lines[] = [
                    'product_id'    => $pid,
                    'product_name'  => $p['name'],
                    'sku'           => $p['sku'],
                    'unit_price'    => $unit,
                    'tax_rate'      => $rate,
                    'quantity'      => $qty,
                    'line_subtotal' => $lineSubtotal,
                    'line_tax'      => $lineTax,
                    'line_total'    => $lineTotal,
                    'resulting_stock' => (int) $p['stock'] - $qty,
                ];
            }

            $subtotal = round($subtotal, 2);
            $tax      = round($tax, 2);
            $total    = round($subtotal + $tax, 2);

            $amountPaid = $this->body('amount_paid');
            $amountPaid = is_numeric($amountPaid) ? round((float) $amountPaid, 2) : $total;
            if ($method === 'cash' && $amountPaid < $total) {
                Database::rollback();
                Response::error(409, 'insufficient_payment',
                    'El efectivo recibido es menor que el total.', ['total' => $total]);
            }
            $change = $method === 'cash' ? round($amountPaid - $total, 2) : 0.0;

            // Folio consecutivo por sucursal
            $branch = Database::one('SELECT code FROM branches WHERE id = ?', [$branchId]);
            $prefix = $this->folioPrefix($branch['code'] ?? ('S' . $branchId));
            $seq = (int) Database::scalar(
                'SELECT COUNT(*) + 1 FROM sales WHERE branch_id = ?', [$branchId]
            );
            $folio = $prefix . '-' . str_pad((string) $seq, 6, '0', STR_PAD_LEFT);

            Database::run(
                'INSERT INTO sales
                   (folio, branch_id, register_id, user_id, customer_name,
                    subtotal, tax, total, payment_method, amount_paid, change_due)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $folio, $branchId, $registerId, $user['id'],
                    mb_substr((string) $this->body('customer_name', ''), 0, 120),
                    $subtotal, $tax, $total, $method, $amountPaid, $change,
                ]
            );
            $saleId = Database::lastId();

            foreach ($lines as $ln) {
                Database::run(
                    'INSERT INTO sale_items
                       (sale_id, product_id, product_name, sku, unit_price, tax_rate, quantity,
                        line_subtotal, line_tax, line_total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $saleId, $ln['product_id'], $ln['product_name'], $ln['sku'],
                        $ln['unit_price'], $ln['tax_rate'], $ln['quantity'],
                        $ln['line_subtotal'], $ln['line_tax'], $ln['line_total'],
                    ]
                );
                // Descuento de inventario
                Database::run(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [$ln['quantity'], $ln['product_id']]
                );
                Database::run(
                    'INSERT INTO stock_movements
                       (branch_id, product_id, user_id, type, quantity_delta, resulting_stock, reference, note)
                     VALUES (?, ?, ?, "sale", ?, ?, ?, ?)',
                    [
                        $branchId, $ln['product_id'], $user['id'],
                        -$ln['quantity'], $ln['resulting_stock'], $folio, 'Venta POS',
                    ]
                );
            }

            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }

        Response::ok(['sale' => $this->fullSale($saleId)], 201);
    }

    /** GET /sales — historial filtrable */
    public function index()
    {
        $user = $this->auth();

        $where  = ['1=1'];
        $params = [];

        if ($user['role'] === 'admin') {
            if (($bid = $this->query('branch_id')) !== null && $bid !== '') {
                $where[] = 's.branch_id = ?';
                $params[] = (int) $bid;
            }
        } elseif ($user['role'] === 'manager') {
            $where[] = 's.branch_id = ?';
            $params[] = (int) $user['branch_id'];
        } else { // cashier: sus propias ventas
            $where[] = 's.user_id = ?';
            $params[] = (int) $user['id'];
        }

        if (($from = $this->query('from'))) { $where[] = 's.created_at >= ?'; $params[] = $from . ' 00:00:00'; }
        if (($to = $this->query('to')))     { $where[] = 's.created_at <= ?'; $params[] = $to . ' 23:59:59'; }
        if (($m = $this->query('payment_method')) && in_array($m, ['cash', 'card', 'transfer'], true)) {
            $where[] = 's.payment_method = ?';
            $params[] = $m;
        }

        $limit = min(200, max(1, (int) $this->query('limit', 50)));

        $rows = Database::all(
            'SELECT s.*, b.name AS branch_name, b.code AS branch_code,
                    u.name AS cashier_name, r.name AS register_name,
                    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
             FROM sales s
             JOIN branches b ON b.id = s.branch_id
             JOIN users u    ON u.id = s.user_id
             LEFT JOIN registers r ON r.id = s.register_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY s.created_at DESC, s.id DESC
             LIMIT ' . $limit,
            $params
        );
        Response::ok(['sales' => array_map([$this, 'castSale'], $rows)]);
    }

    /** GET /sales/{id} — venta completa con renglones (ticket) */
    public function show($id)
    {
        $user = $this->auth();
        $sale = $this->fullSale((int) $id);
        if (!$sale) Response::notFound('Venta no encontrada.');

        if ($user['role'] === 'manager' && (int) $sale['branch_id'] !== (int) $user['branch_id']) {
            Response::forbidden();
        }
        if ($user['role'] === 'cashier' && (int) $sale['user_id'] !== (int) $user['id']) {
            Response::forbidden();
        }
        Response::ok(['sale' => $sale]);
    }

    // ---------------------------------------------------------------

    private function folioPrefix($code)
    {
        $parts = explode('-', $code);
        return strtoupper(end($parts) ?: $code);
    }

    private function fullSale($id)
    {
        $sale = Database::one(
            'SELECT s.*, b.name AS branch_name, b.code AS branch_code, b.address AS branch_address,
                    b.phone AS branch_phone, u.name AS cashier_name, r.name AS register_name
             FROM sales s
             JOIN branches b ON b.id = s.branch_id
             JOIN users u    ON u.id = s.user_id
             LEFT JOIN registers r ON r.id = s.register_id
             WHERE s.id = ?',
            [(int) $id]
        );
        if (!$sale) return null;

        $sale = $this->castSale($sale);
        $sale['items'] = array_map(function ($r) {
            $r['id'] = (int) $r['id'];
            $r['product_id'] = $r['product_id'] !== null ? (int) $r['product_id'] : null;
            $r['quantity'] = (int) $r['quantity'];
            foreach (['unit_price', 'tax_rate', 'line_subtotal', 'line_tax', 'line_total'] as $k) {
                $r[$k] = (float) $r[$k];
            }
            return $r;
        }, Database::all('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id', [(int) $id]));

        return $sale;
    }

    private function castSale($r)
    {
        $r['id'] = (int) $r['id'];
        $r['branch_id'] = (int) $r['branch_id'];
        $r['user_id'] = (int) $r['user_id'];
        $r['register_id'] = $r['register_id'] !== null ? (int) $r['register_id'] : null;
        foreach (['subtotal', 'tax', 'total', 'amount_paid', 'change_due'] as $k) {
            $r[$k] = (float) $r[$k];
        }
        if (isset($r['items_count'])) $r['items_count'] = (int) $r['items_count'];
        return $r;
    }
}
