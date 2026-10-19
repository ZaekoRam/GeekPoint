<?php
/**
 * Avisos de "Notifícame" (producto sin stock → correo cuando vuelve).
 *
 * Tabla stock_alerts (migración 2026_10_08_000001). Una suscripción por
 * (SKU, correo):
 *   - cliente con sesión y correo verificado → 'active' al instante
 *   - cliente con sesión sin verificar       → 'active', pero el correo solo
 *                                              se manda si ya verificó
 *   - invitado                               → 'pending' hasta que confirme
 *                                              con el enlace (doble opt-in),
 *                                              así nadie suscribe correos ajenos
 * Cuando el stock total del SKU vuelve a ser > 0, se avisa a los activos y
 * pasan a 'notified'.
 */
class StockAlerts
{
    const CATEGORY_PREFIX = '/^local-(?:tcg|comics|manga|figuras|coleccionables|preventa)-/i';
    const GUEST_DAILY_LIMIT = 5;   // confirmaciones por correo en 24 h
    const IP_HOURLY_LIMIT   = 15;  // suscripciones de invitado por IP en 1 h

    /**
     * SKU a partir de la referencia del catálogo:
     *   local-manga-mng-aot-02          -> MNG-AOT-02
     *   local-manga-mng-s-aot + vol 3   -> MNG-AOT-03   (tomo sin ficha propia)
     */
    public static function skuFromRef($ref, $vol = null)
    {
        $ref = (string) $ref;
        if (!preg_match(self::CATEGORY_PREFIX, $ref)) return null;
        $sku = strtoupper((string) preg_replace(self::CATEGORY_PREFIX, '', $ref));
        if ($vol !== null && $vol !== '' && preg_match('/^MNG-S-/', $sku) && ctype_digit((string) $vol)) {
            $n = (int) $vol;
            $sku = preg_replace('/^MNG-S-/', 'MNG-', $sku) . '-' . ($n < 10 ? '0' . $n : (string) $n);
        }
        return preg_match('/^[A-Z0-9-]{2,60}$/', $sku) ? $sku : null;
    }

    public static function totalStock($sku)
    {
        return (int) Database::scalar(
            'SELECT COALESCE(SUM(p.stock), 0) FROM products p
               JOIN branches b ON b.id = p.branch_id AND b.status = "active"
              WHERE p.sku = ? AND p.status = "active"', [$sku]);
    }

    private static function hash($token) { return hash('sha256', $token); }

    /**
     * Crea o reactiva la suscripción. Devuelve ['status' => 'active'|'pending'|'in_stock'].
     * $user = usuario con sesión (o null); $email solo se usa para invitados.
     */
    public static function subscribe($sku, $title, $email, $user, $ip)
    {
        if (self::totalStock($sku) > 0) return ['status' => 'in_stock'];

        $email = strtolower(trim($user ? $user['email'] : (string) $email));
        $title = mb_substr(trim((string) $title), 0, 200);
        $existing = Database::one('SELECT * FROM stock_alerts WHERE sku = ? AND email = ?', [$sku, $email]);

        if ($user) {
            $token = bin2hex(random_bytes(24));
            if ($existing) {
                Database::run('UPDATE stock_alerts SET status = "active", user_id = ?, title = ?, token_hash = ?,
                                      confirmed_at = NOW(), notified_at = NULL WHERE id = ?',
                    [(int) $user['id'], $title, self::hash($token), (int) $existing['id']]);
            } else {
                Database::run('INSERT INTO stock_alerts (sku, title, email, user_id, status, token_hash, ip, confirmed_at)
                               VALUES (?, ?, ?, ?, "active", ?, ?, NOW())',
                    [$sku, $title, $email, (int) $user['id'], self::hash($token), mb_substr($ip, 0, 45)]);
            }
            return ['status' => 'active', 'email' => $email,
                    'verified' => !empty($user['email_verified_at'])];
        }

        // ---- Invitado: doble opt-in ----
        if ($existing && $existing['status'] === 'active') return ['status' => 'active', 'email' => $email];
        if ($existing && $existing['status'] === 'pending'
            && strtotime($existing['created_at']) > time() - 600) {
            return ['status' => 'pending', 'email' => $email];   // ya se mandó hace < 10 min
        }
        $sentToday = (int) Database::scalar(
            'SELECT COUNT(*) FROM stock_alerts WHERE email = ? AND status = "pending" AND created_at > NOW() - INTERVAL 1 DAY', [$email]);
        $fromIp = (int) Database::scalar(
            'SELECT COUNT(*) FROM stock_alerts WHERE ip = ? AND user_id IS NULL AND created_at > NOW() - INTERVAL 1 HOUR', [$ip]);
        if ($sentToday >= self::GUEST_DAILY_LIMIT || $fromIp >= self::IP_HOURLY_LIMIT) {
            Response::error(429, 'too_many', 'Demasiadas solicitudes. Inténtalo más tarde.');
        }

        $token = bin2hex(random_bytes(24));
        if ($existing) {
            Database::run('UPDATE stock_alerts SET status = "pending", user_id = NULL, title = ?, token_hash = ?, ip = ?,
                                  created_at = NOW(), confirmed_at = NULL, notified_at = NULL WHERE id = ?',
                [$title, self::hash($token), mb_substr($ip, 0, 45), (int) $existing['id']]);
        } else {
            Database::run('INSERT INTO stock_alerts (sku, title, email, status, token_hash, ip) VALUES (?, ?, ?, "pending", ?, ?)',
                [$sku, $title, $email, self::hash($token), mb_substr($ip, 0, 45)]);
        }
        Mailer::stockAlertConfirm($email, $title, Mailer::siteUrl() . '/api/stock-alerts/confirm?token=' . $token);
        return ['status' => 'pending', 'email' => $email];
    }

    /** Enlace del correo de confirmación. Devuelve true si quedó activa. */
    public static function confirm($token)
    {
        $row = Database::one('SELECT * FROM stock_alerts WHERE token_hash = ? AND status = "pending"', [self::hash((string) $token)]);
        if (!$row) return false;
        Database::run('UPDATE stock_alerts SET status = "active", confirmed_at = NOW() WHERE id = ?', [(int) $row['id']]);
        // Si mientras tanto llegó stock, avisar ya.
        self::notifyIfRestocked($row['sku']);
        return true;
    }

    public static function unsubscribe($token)
    {
        $row = Database::one('SELECT id FROM stock_alerts WHERE token_hash = ?', [self::hash((string) $token)]);
        if (!$row) return false;
        Database::run('UPDATE stock_alerts SET status = "cancelled" WHERE id = ?', [(int) $row['id']]);
        return true;
    }

    /**
     * Llamar después de cualquier cambio que SUBA stock. Si el SKU ya tiene
     * stock, avisa a los suscriptores activos. Nunca lanza: un fallo aquí no
     * debe deshacer el ajuste de inventario.
     */
    public static function notifyIfRestocked($sku)
    {
        try {
            if (!$sku || self::totalStock($sku) <= 0) return 0;
            $alerts = Database::all(
                'SELECT a.*, u.email_verified_at FROM stock_alerts a
                   LEFT JOIN users u ON u.id = a.user_id
                  WHERE a.sku = ? AND a.status = "active"', [$sku]);
            if (!$alerts) return 0;

            $branches = Database::all(
                'SELECT b.name, p.stock FROM products p JOIN branches b ON b.id = p.branch_id AND b.status = "active"
                  WHERE p.sku = ? AND p.status = "active" AND p.stock > 0 ORDER BY p.stock DESC', [$sku]);
            $sent = 0;
            foreach ($alerts as $a) {
                // Cuentas: solo a correos verificados (evita usar cuentas con correos ajenos).
                if ($a['user_id'] !== null && empty($a['email_verified_at'])) continue;
                $token = bin2hex(random_bytes(24));
                Database::run('UPDATE stock_alerts SET status = "notified", notified_at = NOW(), token_hash = ? WHERE id = ?',
                    [self::hash($token), (int) $a['id']]);
                Mailer::stockAvailable($a['email'], $a['title'] ?: $sku, $branches,
                    Mailer::siteUrl() . '/#/', Mailer::siteUrl() . '/api/stock-alerts/unsubscribe?token=' . $token);
                $sent++;
            }
            return $sent;
        } catch (\Throwable $e) {
            error_log('[StockAlerts] ' . $e->getMessage());
            return 0;
        }
    }

    /** Variante por id de producto (fila de una sucursal). */
    public static function notifyIfRestockedById($productId)
    {
        try {
            $sku = Database::scalar('SELECT sku FROM products WHERE id = ?', [(int) $productId]);
            return $sku ? self::notifyIfRestocked($sku) : 0;
        } catch (\Throwable $e) {
            error_log('[StockAlerts] ' . $e->getMessage());
            return 0;
        }
    }
}
