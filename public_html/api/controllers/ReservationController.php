<?php
/**
 * Apartados / reservas.
 * El cliente crea un apartado desde el carrito de la tienda pública (sin auth,
 * pero si hay sesión de cliente activa el apartado queda vinculado a su cuenta
 * para "Mis pedidos"); el personal lo consulta por folio y lo prepara/cobra/
 * cancela desde el POS.
 *
 *   POST   /reservations                 (público)  crea el apartado -> folio GP-XXXX
 *   GET    /reservations                 (staff)    lista (filtros ?status= &branch_id=)
 *   GET    /reservations/mine            (cliente)  los apartados del usuario autenticado
 *   GET    /reservations/{folio}          (staff)    detalle por folio (para el POS)
 *   PATCH  /reservations/{folio}/status   (staff)    { status: lista|cobrada|cancelada, sale_id? }
 */
class ReservationController extends Controller
{
    /** POST /reservations */
    public function store()
    {
        $d = $this->req->all();
        // No aborta si no hay sesión: el apartado sigue funcionando para
        // invitados. Si SÍ hay una sesión de cliente activa, se vincula.
        $authUser = Auth::attempt($this->req);

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
            $ref = mb_substr((string) ($it['ref'] ?? $it['id'] ?? ''), 0, 64);
            $productId = (int) ($it['product_id'] ?? 0);
            $local = $productId > 0
                ? $this->localProductById($productId, $branchId, $qty)
                : $this->localProductForRef($ref, $branchId, $qty);
            if ($productId > 0) $ref = 'product-' . $productId;
            if ($local) {
                $pricing = Pricing::calculate($local);
                $listPrice = $pricing['price'];
                $price = $pricing['effective_price'];
                $percent = $pricing['discount_status'] === 'active' ? $pricing['discount_percent'] : 0.0;
                $unitDiscount = $pricing['unit_savings'];
                $title = $local['name'];
                $binding = true;
                $isPreventa = $this->isPreventaProduct($local);
            } else {
                if ($productId > 0 || $this->isLocalRef($ref)) {
                    Response::error(409, 'product_unavailable', 'Un producto local ya no está disponible.', ['product_ref' => $ref]);
                }
                // Elementos sintéticos: cotización no vinculante, sin descuento administrable.
                $price = max(0, round((float) ($it['price'] ?? $it['unit_price'] ?? 0), 2));
                $listPrice = $price;
                $percent = 0.0;
                $unitDiscount = 0.0;
                $title = mb_substr((string) ($it['title'] ?? 'Producto'), 0, 200);
                $binding = false;
                $isPreventa = false;
            }
            $line = round($price * $qty, 2);
            $clean[] = [
                'ref'   => $ref,
                'title' => $title,
                'list_price' => $listPrice,
                'discount_percent' => $percent,
                'unit_discount' => $unitDiscount,
                'price' => $price,
                'qty'   => $qty,
                'line'  => $line,
                'binding' => $binding,
                'is_preventa' => $isPreventa,
            ];
            $total += $line;
        }
        $total = round($total, 2);
        $subtotal = round($total / (1 + $rate), 2);
        $tax = round($total - $subtotal, 2);

        if (array_key_exists('expected_total', $d)
            && (!is_numeric($d['expected_total']) || abs(round((float) $d['expected_total'], 2) - $total) >= 0.01)) {
            Response::error(409, 'price_changed',
                'Uno o más precios cambiaron. Revisa el total actualizado.',
                ['total' => $total, 'items' => $clean]
            );
        }

        // Folio único GP-XXXX.
        $folio = $this->uniqueFolio();

        Database::begin();
        try {
            Database::run(
                'INSERT INTO reservations
                   (folio, branch_id, user_id, customer_name, customer_email, customer_phone, subtotal, tax, total, status, note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pendiente", ?)',
                [
                    $folio, $branchId, $authUser ? (int) $authUser['id'] : null,
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
                    'INSERT INTO reservation_items
                       (reservation_id, product_ref, is_preventa, title, list_unit_price, discount_percent,
                        unit_discount, unit_price, quantity, line_total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [$rid, $c['ref'], $c['is_preventa'] ? 1 : 0, $c['title'], $c['list_price'], $c['discount_percent'],
                     $c['unit_discount'], $c['price'], $c['qty'], $c['line']]
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
        if ($status === 'activos') {
            // Pseudo-filtro para el POS: lo que todavía requiere acción en tienda.
            $where[] = "r.status IN ('pendiente', 'lista')";
        } elseif (in_array($status, ['pendiente', 'lista', 'cobrada', 'cancelada'], true)) {
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

    /** GET /reservations/mine — apartados del cliente autenticado (cualquier rol con cuenta) */
    public function mine()
    {
        $user = $this->auth();
        $rows = Database::all(
            'SELECT r.*, b.name AS branch_name, b.code AS branch_code
             FROM reservations r
             LEFT JOIN branches b ON b.id = r.branch_id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC
             LIMIT 200',
            [(int) $user['id']]
        );
        $out = [];
        foreach (($rows ?: []) as $r) {
            $out[] = $this->hydrate($r);
        }
        Response::ok(['reservations' => $out]);
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

        $status = $this->pickEnum($this->body('status', ''), ['lista', 'cobrada', 'cancelada'], '');
        if ($status === '') {
            Response::validation(['status' => ['Estado no válido (lista | cobrada | cancelada).']]);
        }
        // "lista" solo desde pendiente; cobrada/cancelada desde pendiente o lista.
        $allowedFrom = ['lista' => ['pendiente'], 'cobrada' => ['pendiente', 'lista'], 'cancelada' => ['pendiente', 'lista']];
        if (!in_array($row['status'], $allowedFrom[$status], true)) {
            Response::error(409, 'invalid_transition', 'El apartado está "' . $row['status'] . '" y no puede pasar a "' . $status . '".');
        }

        if ($status === 'lista') {
            Database::run('UPDATE reservations SET status = ?, ready_at = NOW() WHERE id = ?', [$status, (int) $row['id']]);
        } else {
            $saleId = $this->intOrNull($this->body('sale_id'));
            Database::run(
                'UPDATE reservations SET status = ?, sale_id = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?',
                [$status, $saleId, $user['id'], (int) $row['id']]
            );
        }

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
            'SELECT id, product_ref, is_preventa, title, list_unit_price, discount_percent, unit_discount,
                    unit_price, quantity, line_total
             FROM reservation_items WHERE reservation_id = ? ORDER BY id',
            [(int) $row['id']]
        );
        $data = $this->castRow($row);
        $data['items'] = array_map(function ($it) {
            return [
                'id'         => (int) $it['id'],
                'product_ref' => $it['product_ref'],
                'is_preventa' => (bool) $it['is_preventa'],
                'title'      => $it['title'],
                'list_unit_price' => (float) $it['list_unit_price'],
                'discount_percent' => (float) $it['discount_percent'],
                'unit_discount' => (float) $it['unit_discount'],
                'unit_price' => (float) $it['unit_price'],
                'quantity'   => (int) $it['quantity'],
                'line_total' => (float) $it['line_total'],
                'binding'    => $this->isBindingRef($it['product_ref']),
            ];
        }, $items ?: []);
        $data['is_preventa'] = false;
        foreach ($data['items'] as $it) {
            if ($it['is_preventa']) { $data['is_preventa'] = true; break; }
        }
        return $data;
    }

    private function isLocalRef($ref)
    {
        return (bool) preg_match('/^local-(?:tcg|comics|manga|figuras|coleccionables|preventa)-/i', (string) $ref);
    }

    private function isBindingRef($ref)
    {
        return $this->isLocalRef($ref) || preg_match('/^product-\d+$/', (string) $ref);
    }

    /** Mismo criterio que el catálogo público (catalog.js): categoría "preventa" o tag "preventa". */
    private function isPreventaProduct($product)
    {
        if (($product['category_slug'] ?? null) === 'preventa') return true;
        $tags = array_map('trim', explode(',', strtolower((string) ($product['tags'] ?? ''))));
        return in_array('preventa', $tags, true);
    }

    private function localProductById($productId, $branchId, $qty)
    {
        $params = [(int) $productId, (int) $qty];
        $where = 'p.id = ? AND p.status = "active" AND p.stock >= ?';
        if ($branchId !== null) {
            $where .= ' AND p.branch_id = ?';
            $params[] = (int) $branchId;
        }
        return Database::one(
            'SELECT p.*, c.slug AS category_slug FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE ' . $where . ' LIMIT 1',
            $params
        );
    }

    private function localProductForRef($ref, $branchId, $qty)
    {
        if (!$this->isLocalRef($ref)) return null;
        $sku = strtoupper((string) preg_replace(
            '/^local-(?:tcg|comics|manga|figuras|coleccionables|preventa)-/i', '', (string) $ref
        ));
        $params = [$sku, (int) $qty];
        $where = 'p.sku = ? AND p.status = "active" AND p.stock >= ?';
        if ($branchId !== null) {
            $where .= ' AND p.branch_id = ?';
            $params[] = (int) $branchId;
        }
        $rows = Database::all(
            'SELECT p.*, c.slug AS category_slug FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE ' . $where . ' ORDER BY p.id',
            $params
        );
        $best = null;
        $bestPrice = null;
        foreach ($rows as $row) {
            $effective = Pricing::calculate($row)['effective_price'];
            if ($best === null || $effective < $bestPrice) {
                $best = $row;
                $bestPrice = $effective;
            }
        }
        return $best;
    }

    private function castRow($r)
    {
        return [
            'id'             => (int) $r['id'],
            'folio'          => $r['folio'],
            'branch_id'      => $r['branch_id'] !== null ? (int) $r['branch_id'] : null,
            'branch_name'    => $r['branch_name'] ?? null,
            'branch_code'    => $r['branch_code'] ?? null,
            'user_id'        => isset($r['user_id']) && $r['user_id'] !== null ? (int) $r['user_id'] : null,
            'customer_name'  => $r['customer_name'],
            'customer_email' => $r['customer_email'],
            'customer_phone' => $r['customer_phone'],
            'subtotal'       => (float) $r['subtotal'],
            'tax'            => (float) $r['tax'],
            'total'          => (float) $r['total'],
            'status'         => $r['status'],
            'note'           => $r['note'],
            'sale_id'        => $r['sale_id'] !== null ? (int) $r['sale_id'] : null,
            'ready_at'       => $r['ready_at'] ?? null,
            'resolved_at'    => $r['resolved_at'] ?? null,
            'created_at'     => $r['created_at'],
        ];
    }
}
