<?php

class ReportController extends Controller
{
    /** GET /reports/overview — panel del Administrador General (consolidado) */
    public function overview()
    {
        $this->authRole(['admin']);

        $today = date('Y-m-d');
        $monthStart = date('Y-m-01');

        $kpis = [
            'branches_active'   => (int) Database::scalar('SELECT COUNT(*) FROM branches WHERE status = "active"'),
            'branches_total'    => (int) Database::scalar('SELECT COUNT(*) FROM branches'),
            'users_total'       => (int) Database::scalar('SELECT COUNT(*) FROM users WHERE status = "active"'),
            'products_total'    => (int) Database::scalar('SELECT COUNT(*) FROM products WHERE status = "active"'),
            'low_stock_total'   => (int) Database::scalar('SELECT COUNT(*) FROM products WHERE status = "active" AND stock <= min_stock'),
            'sales_today_count'  => (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE DATE(created_at) = ?', [$today]),
            'sales_today_total'  => (float) Database::scalar('SELECT COALESCE(SUM(total),0) FROM sales WHERE DATE(created_at) = ?', [$today]),
            'sales_month_count'  => (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE created_at >= ?', [$monthStart . ' 00:00:00']),
            'sales_month_total'  => (float) Database::scalar('SELECT COALESCE(SUM(total),0) FROM sales WHERE created_at >= ?', [$monthStart . ' 00:00:00']),
        ];

        $byBranch = Database::all(
            'SELECT b.id, b.code, b.name, b.city, b.status,
                    COALESCE(SUM(CASE WHEN DATE(s.created_at) = ? THEN s.total END), 0) AS today_total,
                    COALESCE(SUM(CASE WHEN s.created_at >= ? THEN s.total END), 0) AS month_total,
                    COUNT(CASE WHEN s.created_at >= ? THEN s.id END) AS month_count,
                    (SELECT COUNT(*) FROM products p WHERE p.branch_id = b.id AND p.status = "active" AND p.stock <= p.min_stock) AS low_stock
             FROM branches b
             LEFT JOIN sales s ON s.branch_id = b.id
             GROUP BY b.id, b.code, b.name, b.city, b.status
             ORDER BY month_total DESC, b.name',
            [$today, $monthStart . ' 00:00:00', $monthStart . ' 00:00:00']
        );
        foreach ($byBranch as &$r) {
            $r['id'] = (int) $r['id'];
            $r['today_total'] = (float) $r['today_total'];
            $r['month_total'] = (float) $r['month_total'];
            $r['month_count'] = (int) $r['month_count'];
            $r['low_stock']   = (int) $r['low_stock'];
        }

        $sales14 = Database::all(
            'SELECT DATE(created_at) AS day, COUNT(*) AS n, COALESCE(SUM(total),0) AS total
             FROM sales
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
             GROUP BY DATE(created_at) ORDER BY day'
        );
        foreach ($sales14 as &$r) { $r['n'] = (int) $r['n']; $r['total'] = (float) $r['total']; }

        $topProducts = Database::all(
            'SELECT si.product_name, SUM(si.quantity) AS qty, SUM(si.line_total) AS revenue
             FROM sale_items si JOIN sales s ON s.id = si.sale_id
             WHERE s.created_at >= ?
             GROUP BY si.product_name ORDER BY qty DESC LIMIT 8',
            [$monthStart . ' 00:00:00']
        );
        foreach ($topProducts as &$r) { $r['qty'] = (int) $r['qty']; $r['revenue'] = (float) $r['revenue']; }

        Response::ok([
            'kpis'         => $kpis,
            'by_branch'    => $byBranch,
            'sales_series' => $sales14,
            'top_products' => $topProducts,
        ]);
    }

    /** GET /reports/branch/{id} — panel del Gerente de Sede */
    public function branch($id)
    {
        $user = $this->authRole(['admin', 'manager']);
        $id = (int) $id;
        Auth::assertBranchAccess($user, $id);

        $branch = Database::one('SELECT * FROM branches WHERE id = ?', [$id]);
        if (!$branch) Response::notFound('Sucursal no encontrada.');
        $branch['id'] = (int) $branch['id'];

        $today = date('Y-m-d');
        $monthStart = date('Y-m-01');

        $kpis = [
            'sales_today_count' => (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE branch_id = ? AND DATE(created_at) = ?', [$id, $today]),
            'sales_today_total' => (float) Database::scalar('SELECT COALESCE(SUM(total),0) FROM sales WHERE branch_id = ? AND DATE(created_at) = ?', [$id, $today]),
            'sales_month_count' => (int) Database::scalar('SELECT COUNT(*) FROM sales WHERE branch_id = ? AND created_at >= ?', [$id, $monthStart . ' 00:00:00']),
            'sales_month_total' => (float) Database::scalar('SELECT COALESCE(SUM(total),0) FROM sales WHERE branch_id = ? AND created_at >= ?', [$id, $monthStart . ' 00:00:00']),
            'products_active'   => (int) Database::scalar('SELECT COUNT(*) FROM products WHERE branch_id = ? AND status = "active"', [$id]),
            'low_stock'         => (int) Database::scalar('SELECT COUNT(*) FROM products WHERE branch_id = ? AND status = "active" AND stock <= min_stock', [$id]),
            'registers_active'  => (int) Database::scalar('SELECT COUNT(*) FROM registers WHERE branch_id = ? AND status = "active"', [$id]),
            'inventory_value'   => (float) Database::scalar('SELECT COALESCE(SUM(price * stock),0) FROM products WHERE branch_id = ? AND status = "active"', [$id]),
        ];

        $byCashier = Database::all(
            'SELECT u.id, u.name,
                    COUNT(s.id) AS month_count,
                    COALESCE(SUM(s.total),0) AS month_total
             FROM users u
             LEFT JOIN sales s ON s.user_id = u.id AND s.created_at >= ?
             WHERE u.branch_id = ? AND u.role = "cashier"
             GROUP BY u.id, u.name ORDER BY month_total DESC',
            [$monthStart . ' 00:00:00', $id]
        );
        foreach ($byCashier as &$r) {
            $r['id'] = (int) $r['id'];
            $r['month_count'] = (int) $r['month_count'];
            $r['month_total'] = (float) $r['month_total'];
        }

        $recentSales = Database::all(
            'SELECT s.id, s.folio, s.total, s.payment_method, s.created_at, u.name AS cashier_name
             FROM sales s JOIN users u ON u.id = s.user_id
             WHERE s.branch_id = ?
             ORDER BY s.created_at DESC LIMIT 10',
            [$id]
        );
        foreach ($recentSales as &$r) { $r['id'] = (int) $r['id']; $r['total'] = (float) $r['total']; }

        $sales14 = Database::all(
            'SELECT DATE(created_at) AS day, COUNT(*) AS n, COALESCE(SUM(total),0) AS total
             FROM sales WHERE branch_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
             GROUP BY DATE(created_at) ORDER BY day',
            [$id]
        );
        foreach ($sales14 as &$r) { $r['n'] = (int) $r['n']; $r['total'] = (float) $r['total']; }

        Response::ok([
            'branch'       => $branch,
            'kpis'         => $kpis,
            'by_cashier'   => $byCashier,
            'recent_sales' => $recentSales,
            'sales_series' => $sales14,
        ]);
    }
}
