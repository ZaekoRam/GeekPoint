<?php
/**
 * "Notifícame" — avisos de stock.
 *   POST /stock-alerts                 { ref, vol?, title, email? }  (sesión opcional)
 *   GET  /stock-alerts/confirm?token=   enlace del correo de confirmación (invitados)
 *   GET  /stock-alerts/unsubscribe?token=
 * Lógica en src/StockAlerts.php.
 */
class StockAlertController extends Controller
{
    public function store()
    {
        $d = $this->req->all();
        $user = Auth::attempt($this->req);   // sesión opcional

        $sku = StockAlerts::skuFromRef($d['ref'] ?? '', $d['vol'] ?? null);
        if (!$sku || !Database::scalar('SELECT id FROM products WHERE sku = ? AND status = "active" LIMIT 1', [$sku])) {
            Response::validation(['ref' => ['Este producto no admite avisos de stock.']]);
        }

        if (!$user) {
            Validator::make($d)->required('email', 'El correo')->email('email')->validateOrFail();
        } else {
            // El usuario de la sesión trae el estado de verificación al día.
            $user = Database::one('SELECT * FROM users WHERE id = ?', [(int) $user['id']]);
        }

        $title = trim((string) ($d['title'] ?? '')) ?: $sku;
        Response::ok(StockAlerts::subscribe($sku, $title, $d['email'] ?? '', $user, $this->req->ip()), 201);
    }

    public function confirm()
    {
        $ok = StockAlerts::confirm((string) $this->query('token', ''));
        $this->redirect('aviso=' . ($ok ? 'confirmado' : 'invalido'));
    }

    public function unsubscribe()
    {
        $ok = StockAlerts::unsubscribe((string) $this->query('token', ''));
        $this->redirect('aviso=' . ($ok ? 'cancelado' : 'invalido'));
    }

    /** Vuelve a la tienda con un parámetro que el front convierte en aviso. */
    private function redirect($query)
    {
        header('Location: ' . Mailer::siteUrl() . '/?' . $query . '#/', true, 302);
        exit;
    }
}
