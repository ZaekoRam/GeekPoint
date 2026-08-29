<?php

class ProductController extends Controller
{
    /** GET /products  — búsqueda para POS y listado para gerente/admin */
    public function index()
    {
        $user = $this->auth();
        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));

        $where  = ['p.status <> "deleted"'];
        $params = [];

        // status filtro (por defecto solo activos salvo que pidan todos)
        $status = $this->query('status', 'active');
        if ($status !== 'all') {
            $where[] = 'p.status = ?';
            $params[] = $status === 'inactive' ? 'inactive' : 'active';
        }

        if ($branchId !== null) {
            $where[] = 'p.branch_id = ?';
            $params[] = $branchId;
        }

        if (($q = trim((string) $this->query('q', ''))) !== '') {
            $where[] = '(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
            $like = '%' . $q . '%';
            array_push($params, $like, $like, $like);
        }

        if (($cat = $this->query('category_id')) !== null && $cat !== '') {
            $where[] = 'p.category_id = ?';
            $params[] = (int) $cat;
        }

        if ($this->query('low_stock') === '1') {
            $where[] = 'p.stock <= p.min_stock';
        }

        $limit = min(200, max(1, (int) $this->query('limit', 100)));

        $rows = Database::all(
            'SELECT p.*, c.slug AS category_slug, c.name_es AS category_es, c.name_en AS category_en,
                    b.name AS branch_name, b.code AS branch_code
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN branches b   ON b.id = p.branch_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY (p.stock <= p.min_stock) DESC, p.name
             LIMIT ' . $limit,
            $params
        );

        Response::ok(['products' => array_map([$this, 'cast'], $rows)]);
    }

    public function show($id)
    {
        $user = $this->auth();
        $row = $this->findFull($id);
        if (!$row) Response::notFound('Producto no encontrado.');
        Auth::assertBranchAccess($user, $row['branch_id']);
        Response::ok(['product' => $this->cast($row)]);
    }

    public function store()
    {
        $user = $this->authRole(['admin', 'manager']);
        $d = $this->req->all();

        $branchId = $user['role'] === 'admin'
            ? $this->intOrNull($d['branch_id'] ?? null)
            : (int) $user['branch_id'];

        Validator::make($d)
            ->required('sku', 'El código (SKU)')
            ->required('name', 'El nombre')
            ->required('price', 'El precio')->numericMin('price', 0)
            ->validateOrFail();

        if (!$branchId || !Database::scalar('SELECT id FROM branches WHERE id = ?', [$branchId])) {
            Response::validation(['branch_id' => ['Sucursal no válida.']]);
        }
        Auth::assertBranchAccess($user, $branchId);

        $sku = strtoupper(trim((string) $d['sku']));
        if (Database::scalar('SELECT id FROM products WHERE branch_id = ? AND sku = ?', [$branchId, $sku])) {
            Response::error(409, 'duplicate', 'Ya existe un producto con ese SKU en la sucursal.');
        }

        $catId = $this->intOrNull($d['category_id'] ?? null);
        $stock = max(0, (int) ($d['stock'] ?? 0));
        $img       = $this->sanitizeImageList($d['image_url'] ?? '');
        $figurePng = $this->sanitizeImageUrl($d['figure_png_url'] ?? null);

        Database::begin();
        try {
            Database::run(
                'INSERT INTO products
                  (branch_id, sku, name, category_id, description, price, tax_rate, stock, min_stock, image_url, figure_png_url, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $branchId, $sku, mb_substr(trim((string) $d['name']), 0, 180), $catId,
                    mb_substr((string) ($d['description'] ?? ''), 0, 500),
                    round((float) $d['price'], 2),
                    isset($d['tax_rate']) && is_numeric($d['tax_rate']) ? (float) $d['tax_rate'] : App::config('tax')['default_rate'],
                    $stock,
                    max(0, (int) ($d['min_stock'] ?? 3)),
                    $img,
                    $figurePng,
                    $this->pickEnum($d['status'] ?? 'active', ['active', 'inactive'], 'active'),
                ]
            );
            $id = Database::lastId();
            if ($stock > 0) {
                $this->logMovement($branchId, $id, $user['id'], 'restock', $stock, $stock, 'ALTA', 'Stock inicial');
            }
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }

        Response::ok(['product' => $this->cast($this->findFull($id))], 201);
    }

    /**
     * POST /products/import
     * Alta/reposición masiva desde una fuente externa (Pokémon TCG, etc.).
     * Crea un producto POR sucursal indicada; si el SKU ya existe en esa
     * sucursal, suma el stock y refresca nombre/precio/imagen.
     *
     * Body: {
     *   source, external_id, sku, name, category_slug (def "tcg"),
     *   price, image_url, description, tax_rate?, min_stock?,
     *   stock_by_branch: { "1": 10, "2": 4 }
     * }
     */
    public function import()
    {
        $user = $this->authRole(['admin', 'manager']);
        $d = $this->req->all();

        Validator::make($d)
            ->required('sku', 'El SKU')
            ->required('name', 'El nombre')
            ->required('price', 'El precio')->numericMin('price', 0)
            ->validateOrFail();

        $stockByBranch = $d['stock_by_branch'] ?? [];
        if (!is_array($stockByBranch) || count($stockByBranch) === 0) {
            Response::validation(['stock_by_branch' => ['Indica el stock para al menos una sucursal.']]);
        }

        // Normaliza y valida sucursales ANTES de abrir la transacción.
        // Sanea claves/valores para evitar FK inválidas o "Array to int".
        $entries = [];
        foreach ($stockByBranch as $bid => $qty) {
            $bid = (int) $bid;
            $qty = is_array($qty) ? 0 : max(0, (int) $qty);
            if ($bid <= 0) continue;
            Auth::assertBranchAccess($user, $bid);
            if (!Database::scalar('SELECT id FROM branches WHERE id = ?', [$bid])) {
                Response::validation(['stock_by_branch' => ['Sucursal ' . $bid . ' no existe.']]);
            }
            $entries[$bid] = $qty;
        }
        if (!count($entries)) {
            Response::validation(['stock_by_branch' => ['Indica el stock para al menos una sucursal.']]);
        }

        $str = function ($v) { return is_scalar($v) ? (string) $v : ''; };

        $sku      = strtoupper(trim($str($d['sku'] ?? '')));
        $catId    = $this->categoryIdBySlug($str($d['category_slug'] ?? 'tcg') ?: 'tcg');
        $taxRate  = isset($d['tax_rate']) && is_numeric($d['tax_rate']) ? (float) $d['tax_rate'] : App::config('tax')['default_rate'];
        $minStock = max(0, (int) ($d['min_stock'] ?? 3));
        $price    = round((float) ($d['price'] ?? 0), 2);
        $name     = mb_substr(trim($str($d['name'] ?? '')), 0, 180);
        $desc     = mb_substr($str($d['description'] ?? ''), 0, 500);
        $img      = $this->sanitizeImageList($d['image_url'] ?? '');            // fotos de galería (varias URLs)
        $figurePng = $this->sanitizeImageUrl($d['figure_png_url'] ?? null);     // figura recortada; '' -> NULL
        $ref      = mb_substr(trim($str($d['source'] ?? 'import') . ' ' . $str($d['external_id'] ?? '')), 0, 60);

        $out = ['sku' => $sku, 'created' => [], 'updated' => []];

        Database::begin();
        try {
            foreach ($entries as $bid => $qty) {
                $existing = Database::one(
                    'SELECT id, stock FROM products WHERE branch_id = ? AND sku = ?',
                    [$bid, $sku]
                );
                if ($existing) {
                    $pid = (int) $existing['id'];
                    $newStock = (int) $existing['stock'] + $qty;
                    Database::run(
                        'UPDATE products SET name = ?, category_id = ?, description = ?, price = ?,
                                image_url = ?, figure_png_url = ?, stock = ?, status = "active" WHERE id = ?',
                        [$name, $catId, $desc, $price, $img, $figurePng, $newStock, $pid]
                    );
                    if ($qty > 0) {
                        $this->logMovement($bid, $pid, $user['id'], 'restock', $qty, $newStock, 'IMPORT', $ref);
                    }
                    $out['updated'][] = ['branch_id' => $bid, 'product_id' => $pid, 'stock' => $newStock];
                } else {
                    Database::run(
                        'INSERT INTO products
                           (branch_id, sku, name, category_id, description, price, tax_rate, stock, min_stock, image_url, figure_png_url, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
                        [$bid, $sku, $name, $catId, $desc, $price, $taxRate, $qty, $minStock, $img, $figurePng]
                    );
                    $pid = Database::lastId();
                    if ($qty > 0) {
                        $this->logMovement($bid, $pid, $user['id'], 'restock', $qty, $qty, 'IMPORT', $ref);
                    }
                    $out['created'][] = ['branch_id' => $bid, 'product_id' => $pid, 'stock' => $qty];
                }
            }
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }

        Response::ok($out, 201);
    }

    public function update($id)
    {
        $user = $this->authRole(['admin', 'manager']);
        $id = (int) $id;
        $current = $this->findFull($id);
        if (!$current) Response::notFound('Producto no encontrado.');
        Auth::assertBranchAccess($user, $current['branch_id']);

        $d = $this->req->all();
        Validator::make($d)
            ->required('sku', 'El código (SKU)')
            ->required('name', 'El nombre')
            ->required('price', 'El precio')->numericMin('price', 0)
            ->validateOrFail();

        $sku = strtoupper(trim($d['sku']));
        $dupe = Database::scalar(
            'SELECT id FROM products WHERE branch_id = ? AND sku = ? AND id <> ?',
            [$current['branch_id'], $sku, $id]
        );
        if ($dupe) Response::error(409, 'duplicate', 'Ese SKU ya existe en la sucursal.');

        // Imágenes: si el form manda el campo se sanea (galería -> lista; figura
        // sin fondo -> string|NULL); si NO lo manda, se conserva lo que había.
        $img = array_key_exists('image_url', $d)
            ? $this->sanitizeImageList($d['image_url'])
            : (string) ($current['image_url'] ?? '');
        $figurePng = array_key_exists('figure_png_url', $d)
            ? $this->sanitizeImageUrl($d['figure_png_url'])
            : ($current['figure_png_url'] ?? null);

        // El stock NO se cambia aquí: usa PATCH /products/{id}/stock
        Database::run(
            'UPDATE products SET sku = ?, name = ?, category_id = ?, description = ?,
                    price = ?, tax_rate = ?, min_stock = ?, image_url = ?, figure_png_url = ?, status = ?
             WHERE id = ?',
            [
                $sku, mb_substr(trim((string) $d['name']), 0, 180),
                $this->intOrNull($d['category_id'] ?? $current['category_id']),
                mb_substr((string) ($d['description'] ?? $current['description']), 0, 500),
                round((float) $d['price'], 2),
                isset($d['tax_rate']) && is_numeric($d['tax_rate']) ? (float) $d['tax_rate'] : $current['tax_rate'],
                max(0, (int) ($d['min_stock'] ?? $current['min_stock'])),
                $img,
                $figurePng,
                $this->pickEnum($d['status'] ?? $current['status'], ['active', 'inactive'], $current['status']),
                $id,
            ]
        );
        Response::ok(['product' => $this->cast($this->findFull($id))]);
    }

    /** PATCH /products/{id}/stock  — ajuste manual con registro de movimiento */
    public function adjustStock($id)
    {
        $user = $this->authRole(['admin', 'manager']);
        $id = (int) $id;
        $current = $this->findFull($id);
        if (!$current) Response::notFound('Producto no encontrado.');
        Auth::assertBranchAccess($user, $current['branch_id']);

        $mode = $this->body('mode', 'set'); // 'set' | 'delta'
        $value = $this->body('value');
        if (!is_numeric($value)) {
            Response::validation(['value' => ['Indica una cantidad numérica.']]);
        }
        $value = (int) $value;

        $newStock = $mode === 'delta' ? ((int) $current['stock'] + $value) : $value;
        if ($newStock < 0) {
            Response::error(409, 'negative_stock', 'El ajuste dejaría el stock en negativo.');
        }
        $delta = $newStock - (int) $current['stock'];

        Database::begin();
        try {
            Database::run('UPDATE products SET stock = ? WHERE id = ?', [$newStock, $id]);
            $this->logMovement(
                (int) $current['branch_id'], $id, $user['id'],
                $delta >= 0 ? 'restock' : 'adjustment',
                $delta, $newStock, 'AJUSTE',
                (string) $this->body('note', '')
            );
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }
        Response::ok(['product' => $this->cast($this->findFull($id)), 'delta' => $delta]);
    }

    public function destroy($id)
    {
        $user = $this->authRole(['admin', 'manager']);
        $id = (int) $id;
        $current = $this->findFull($id);
        if (!$current) Response::notFound('Producto no encontrado.');
        Auth::assertBranchAccess($user, $current['branch_id']);

        $sold = (int) Database::scalar('SELECT COUNT(*) FROM sale_items WHERE product_id = ?', [$id]);
        if ($sold > 0) {
            // Conserva historial: baja lógica
            Database::run('UPDATE products SET status = "inactive" WHERE id = ?', [$id]);
            Response::ok(['soft_deleted' => $id, 'message' => 'El producto tiene ventas; se desactivó para conservar el historial.']);
        }
        Database::run('DELETE FROM products WHERE id = ?', [$id]);
        Response::ok(['deleted' => $id]);
    }

    /**
     * DELETE /products/sku/{sku}
     * Borra (o desactiva si tiene ventas) TODAS las filas de un producto
     * en todas las sucursales de un solo golpe. Para el panel de admin.
     */
    public function destroyBySku($sku)
    {
        $user = $this->authRole(['admin', 'manager']);
        $sku = strtoupper(trim((string) $sku));

        $rows = Database::all('SELECT id, branch_id FROM products WHERE sku = ?', [$sku]);
        if (!$rows) Response::notFound('No hay productos con ese SKU.');

        $deleted = [];
        $deactivated = [];
        Database::begin();
        try {
            foreach ($rows as $r) {
                $pid = (int) $r['id'];
                Auth::assertBranchAccess($user, (int) $r['branch_id']);
                $sold = (int) Database::scalar('SELECT COUNT(*) FROM sale_items WHERE product_id = ?', [$pid]);
                if ($sold > 0) {
                    Database::run('UPDATE products SET status = "inactive" WHERE id = ?', [$pid]);
                    $deactivated[] = $pid;
                } else {
                    Database::run('DELETE FROM products WHERE id = ?', [$pid]);
                    $deleted[] = $pid;
                }
            }
            Database::commit();
        } catch (Exception $e) {
            Database::rollback();
            throw $e;
        }

        Response::ok(['sku' => $sku, 'deleted' => $deleted, 'deactivated' => $deactivated]);
    }

    // ---------------------------------------------------------------

    /**
     * POST /products/upload  (multipart/form-data, campo "file")
     * Sube UNA imagen local a /uploads/products/ y devuelve su URL pública
     * absoluta para guardarla luego en image_url / figure_png_url.
     * Si el usuario pega una URL externa, NO usa este endpoint.
     */
    public function upload()
    {
        $this->authRole(['admin', 'manager']);

        $f = $_FILES['file'] ?? ($_FILES['image'] ?? null);
        if (!$f || !isset($f['tmp_name'])) {
            Response::error(400, 'no_file', 'No se recibió ningún archivo.');
        }
        if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $map = [
                UPLOAD_ERR_INI_SIZE => 'El archivo excede el límite del servidor.',
                UPLOAD_ERR_FORM_SIZE => 'El archivo es demasiado grande.',
                UPLOAD_ERR_PARTIAL => 'La subida se interrumpió.',
                UPLOAD_ERR_NO_FILE => 'No se recibió ningún archivo.',
                UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal en el servidor.',
                UPLOAD_ERR_CANT_WRITE => 'El servidor no pudo escribir el archivo.',
            ];
            Response::error(400, 'upload_error', $map[$f['error']] ?? 'Error al subir el archivo.');
        }

        $maxBytes = 6 * 1024 * 1024;   // 6 MB
        if (($f['size'] ?? 0) <= 0 || $f['size'] > $maxBytes) {
            Response::error(400, 'bad_size', 'La imagen debe pesar entre 1 byte y 6 MB.');
        }
        if (!is_uploaded_file($f['tmp_name'])) {
            Response::error(400, 'bad_upload', 'Subida no válida.');
        }

        // Tipo real (rechaza archivos disfrazados). SVG NO se acepta por subida
        // (riesgo XSS): para SVG, pega la URL en el campo de texto.
        $allowed = [
            IMAGETYPE_JPEG => 'jpg',
            IMAGETYPE_PNG  => 'png',
            IMAGETYPE_GIF  => 'gif',
            IMAGETYPE_WEBP => 'webp',
        ];
        $info = @getimagesize($f['tmp_name']);
        $type = $info[2] ?? null;
        if (!$type || !isset($allowed[$type])) {
            Response::error(400, 'bad_type', 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.');
        }
        $ext = $allowed[$type];

        $dir = dirname(__DIR__, 2) . '/uploads/products';
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            Response::error(500, 'mkdir_failed', 'No se pudo crear /uploads/products en el servidor.');
        }

        try {
            $rand = bin2hex(random_bytes(6));
        } catch (Exception $e) {
            $rand = substr(md5(uniqid('', true)), 0, 12);
        }
        $name = date('Ymd_His') . '_' . $rand . '.' . $ext;
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($f['tmp_name'], $dest)) {
            Response::error(500, 'move_failed', 'No se pudo guardar el archivo en el servidor.');
        }
        @chmod($dest, 0644);

        // URL pública ABSOLUTA (funciona en dominio raíz o en subcarpeta).
        $https  = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
            || (($_SERVER['SERVER_PORT'] ?? '') == 443);
        $scheme = $https ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
        // SCRIPT_NAME = /api/index.php  ->  base ""   |   /sub/api/index.php -> "/sub"
        $base = str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php')));
        $base = ($base === '/' || $base === '.') ? '' : rtrim($base, '/');
        $relative = $base . '/uploads/products/' . $name;
        $url = $scheme . '://' . $host . $relative;

        Response::ok(['url' => $url, 'path' => $relative, 'name' => $name], 201);
    }

    /**
     * Lista de URLs de imagen (galería). Acepta string "a,b,c" o array.
     * Devuelve "a,b,c" saneada (trim, sin vacíos, deduplicada, con topes).
     */
    private function sanitizeImageList($v, $maxEach = 1000, $maxTotal = 4000, $maxItems = 12)
    {
        $parts = is_array($v) ? $v : explode(',', (string) $v);
        $clean = [];
        foreach ($parts as $u) {
            $u = trim(is_scalar($u) ? (string) $u : '');
            if ($u === '') continue;
            $u = mb_substr($u, 0, $maxEach);
            $clean[$u] = true;                       // dedupe por clave
            if (count($clean) >= $maxItems) break;
        }
        return mb_substr(implode(',', array_keys($clean)), 0, $maxTotal);
    }

    /**
     * URL única (figura sin fondo). Acepta string o array (toma el 1º).
     * Devuelve string saneada, o NULL si va vacía (columna figure_png_url es NULL).
     */
    private function sanitizeImageUrl($v, $max = 2000)
    {
        if (is_array($v)) { $v = reset($v); }
        $v = trim(is_scalar($v) ? (string) $v : '');
        return $v !== '' ? mb_substr($v, 0, $max) : null;
    }

    private function logMovement($branchId, $productId, $userId, $type, $delta, $resulting, $ref, $note)
    {
        Database::run(
            'INSERT INTO stock_movements
               (branch_id, product_id, user_id, type, quantity_delta, resulting_stock, reference, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$branchId, $productId, $userId, $type, $delta, $resulting, $ref, mb_substr($note, 0, 255)]
        );
    }

    private function categoryIdBySlug($slug)
    {
        $id = Database::scalar('SELECT id FROM categories WHERE slug = ? LIMIT 1', [(string) $slug]);
        return $id ? (int) $id : null;
    }

    private function findFull($id)
    {
        return Database::one(
            'SELECT p.*, c.slug AS category_slug, c.name_es AS category_es, c.name_en AS category_en,
                    b.name AS branch_name, b.code AS branch_code
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN branches b   ON b.id = p.branch_id
             WHERE p.id = ?',
            [(int) $id]
        );
    }

    private function cast($r)
    {
        if (!$r) return $r;
        $r['id']         = (int) $r['id'];
        $r['branch_id']  = (int) $r['branch_id'];
        $r['category_id'] = $r['category_id'] !== null ? (int) $r['category_id'] : null;
        $r['price']      = (float) $r['price'];
        $r['tax_rate']   = (float) $r['tax_rate'];
        $r['stock']      = (int) $r['stock'];
        $r['min_stock']  = (int) $r['min_stock'];
        $r['low_stock']  = $r['stock'] <= $r['min_stock'];
        return $r;
    }
}
