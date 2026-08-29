<?php

class InventoryController extends Controller
{
    /** GET /inventory/alerts — productos en o bajo el mínimo */
    public function alerts()
    {
        $user = $this->auth();
        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));

        $where  = ['p.status = "active"', 'p.stock <= p.min_stock'];
        $params = [];
        if ($branchId !== null) {
            $where[] = 'p.branch_id = ?';
            $params[] = $branchId;
        }

        $rows = Database::all(
            'SELECT p.id, p.sku, p.name, p.stock, p.min_stock, p.price,
                    p.branch_id, b.name AS branch_name, b.code AS branch_code,
                    c.slug AS category_slug
             FROM products p
             JOIN branches b ON b.id = p.branch_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY (p.stock = 0) DESC, (p.min_stock - p.stock) DESC, p.name',
            $params
        );
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['branch_id'] = (int) $r['branch_id'];
            $r['stock'] = (int) $r['stock'];
            $r['min_stock'] = (int) $r['min_stock'];
            $r['price'] = (float) $r['price'];
            $r['out_of_stock'] = $r['stock'] === 0;
        }
        Response::ok(['alerts' => $rows, 'count' => count($rows)]);
    }

    /** GET /inventory/movements — historial de movimientos de stock */
    public function movements()
    {
        $user = $this->auth();
        $branchId = Auth::scopedBranchId($user, $this->query('branch_id'));

        $where  = ['1=1'];
        $params = [];
        if ($branchId !== null) {
            $where[] = 'm.branch_id = ?';
            $params[] = $branchId;
        }
        if (($pid = $this->query('product_id')) !== null && $pid !== '') {
            $where[] = 'm.product_id = ?';
            $params[] = (int) $pid;
        }
        if (($type = $this->query('type')) && in_array($type, ['sale', 'restock', 'adjustment', 'void'], true)) {
            $where[] = 'm.type = ?';
            $params[] = $type;
        }
        $limit = min(300, max(1, (int) $this->query('limit', 80)));

        $rows = Database::all(
            'SELECT m.*, p.name AS product_name, p.sku, u.name AS user_name, b.name AS branch_name
             FROM stock_movements m
             LEFT JOIN products p ON p.id = m.product_id
             LEFT JOIN users u    ON u.id = m.user_id
             LEFT JOIN branches b ON b.id = m.branch_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY m.created_at DESC, m.id DESC
             LIMIT ' . $limit,
            $params
        );
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['quantity_delta'] = (int) $r['quantity_delta'];
            $r['resulting_stock'] = (int) $r['resulting_stock'];
        }
        Response::ok(['movements' => $rows]);
    }
}
