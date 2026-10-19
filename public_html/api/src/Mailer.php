<?php
/**
 * Envío de correos transaccionales con Resend (https://resend.com).
 *
 * Configuración en config.php (la API key NUNCA va en el código ni en Git):
 *
 *   'mail' => [
 *       'resend_key' => 're_…',
 *       'from'       => 'GeekPoint <noreply@geekpoint.com.mx>',
 *       'reply_to'   => '',            // opcional: a dónde llegan las respuestas
 *       'site_url'   => '',            // opcional: por defecto https://geekpoint.com.mx
 *   ],
 *
 * Un correo es un extra: si falta la key, Resend no responde o rechaza el
 * envío, se registra en el log de PHP y se devuelve false. Nunca lanza
 * excepciones, para que un fallo de correo no deshaga un apartado o venta.
 */
class Mailer
{
    const ENDPOINT = 'https://api.resend.com/emails';
    const TIMEOUT  = 8;   // segundos: no dejar colgada la respuesta al cliente

    /** ¿Hay configuración suficiente para enviar? */
    public static function enabled()
    {
        $cfg = App::config('mail') ?: [];
        return !empty($cfg['resend_key']) && !empty($cfg['from']) && function_exists('curl_init');
    }

    /**
     * Envía un correo. $text es la versión en texto plano (recomendada para
     * que no caiga en spam); si no se da, Resend la deriva del HTML.
     */
    public static function send($to, $subject, $html, $text = null)
    {
        $to = trim((string) $to);
        if (!self::enabled() || !filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
        $cfg = App::config('mail');

        $payload = [
            'from'    => $cfg['from'],
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
        ];
        if ($text !== null) $payload['text'] = $text;
        if (!empty($cfg['reply_to'])) $payload['reply_to'] = $cfg['reply_to'];

        try {
            $ch = curl_init(self::ENDPOINT);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 4,
                CURLOPT_TIMEOUT        => self::TIMEOUT,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: Bearer ' . $cfg['resend_key'],
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_error($ch);
            curl_close($ch);

            if ($code >= 200 && $code < 300) return true;
            error_log('[Mailer] Resend HTTP ' . $code . ' ' . ($err ?: substr((string) $body, 0, 300)));
        } catch (\Throwable $e) {
            error_log('[Mailer] ' . $e->getMessage());
        }
        return false;
    }

    /* ------------------------------------------------------------------
       Utilidades
       ------------------------------------------------------------------ */

    /** URL pública del sitio (enlaces e imágenes de un correo deben ser absolutos). */
    public static function siteUrl()
    {
        $cfg = App::config('mail') ?: [];
        return rtrim(!empty($cfg['site_url']) ? $cfg['site_url'] : 'https://geekpoint.com.mx', '/');
    }

    private static function money($n)
    {
        return '$' . number_format((float) $n, 2, '.', ',') . ' MXN';
    }

    private static function e($s)
    {
        return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
    }

    private static function firstName($name)
    {
        $name = trim((string) $name);
        return $name !== '' ? explode(' ', $name)[0] : '';
    }

    /* ------------------------------------------------------------------
       Piezas de la plantilla (estilos en línea: los clientes de correo
       ignoran <style> en muchos casos)
       ------------------------------------------------------------------ */

    private static function p($html)
    {
        return '<p style="margin:0 0 18px;font:15px/1.6 Arial,sans-serif;color:#111014">' . $html . '</p>';
    }

    private static function small($html)
    {
        return '<p style="margin:0 0 18px;font:12px/1.5 Arial,sans-serif;color:#5d5a63">' . $html . '</p>';
    }

    private static function label($text)
    {
        return '<p style="margin:0 0 6px;font:bold 11px Arial,sans-serif;letter-spacing:2px;color:#5d5a63">' . self::e($text) . '</p>';
    }

    /** Botón amarillo (enlace). */
    private static function button($url, $text)
    {
        return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr>'
            . '<td style="border:2px solid #111014;background:#ffd400">'
            . '<a href="' . self::e($url) . '" style="display:inline-block;padding:12px 22px;font:bold 16px Arial,sans-serif;'
            . 'color:#111014;text-decoration:none">' . self::e($text) . '</a></td></tr></table>';
    }

    /** Folio grande en caja amarilla. */
    private static function folioBox($folio)
    {
        return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr>'
            . '<td style="border:2px solid #111014;background:#ffd400;padding:12px 18px;font:bold 26px Consolas,Courier New,monospace;'
            . 'letter-spacing:3px;color:#111014">' . self::e($folio) . '</td></tr></table>';
    }

    private static function itemsTable(array $r)
    {
        $rows = '';
        foreach ($r['items'] ?? [] as $it) {
            $rows .= '<tr>'
                . '<td style="padding:10px 0;border-bottom:1px solid #e6e0cf;font:15px/1.4 Arial,sans-serif;color:#111014">'
                .   self::e($it['quantity']) . ' × ' . self::e($it['title'])
                .   (!empty($it['is_preventa']) ? ' <span style="font:bold 11px Arial,sans-serif;color:#a35b00">PREVENTA</span>' : '')
                . '</td>'
                . '<td style="padding:10px 0;border-bottom:1px solid #e6e0cf;font:15px/1.4 Arial,sans-serif;color:#111014;text-align:right;white-space:nowrap">'
                .   self::money($it['line_total'])
                . '</td></tr>';
        }
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">' . $rows
            . '<tr><td style="padding:14px 0 0;font:bold 16px Arial,sans-serif;color:#111014">Total</td>'
            . '<td style="padding:14px 0 0;font:bold 16px Arial,sans-serif;color:#111014;text-align:right;white-space:nowrap">'
            . self::money($r['total'] ?? 0) . '</td></tr></table>';
    }

    private static function itemsText(array $r)
    {
        $t = '';
        foreach ($r['items'] ?? [] as $it) {
            $t .= '- ' . $it['quantity'] . ' x ' . $it['title'] . '  ' . self::money($it['line_total']) . "\n";
        }
        return $t . 'Total: ' . self::money($r['total'] ?? 0) . "\n";
    }

    private static function branchBlock($branch, $label = 'RECÓGELO EN')
    {
        if (!$branch) return '';
        $lines = array_filter([
            self::e($branch['name'] ?? ''),
            self::e($branch['address'] ?? ''),
            !empty($branch['hours']) ? 'Horario: ' . self::e($branch['hours']) : '',
            !empty($branch['phone']) ? 'Tel. ' . self::e($branch['phone']) : '',
        ]);
        return self::label($label) . '<p style="margin:0 0 22px;font:15px/1.5 Arial,sans-serif;color:#111014">' . implode('<br>', $lines) . '</p>';
    }

    private static function branchText($branch)
    {
        if (!$branch) return '';
        return ($branch['name'] ?? '') . "\n" . ($branch['address'] ?? '') . "\n"
            . (!empty($branch['hours']) ? 'Horario: ' . $branch['hours'] . "\n" : '');
    }

    /**
     * Marco común de todos los correos: encabezado amarillo con la marca,
     * cuerpo con la mascota difuminada de fondo (imagen ya difuminada: los
     * clientes de correo no soportan filter: blur; Outlook de escritorio no
     * muestra fondos y queda en blanco) y pie negro.
     */
    private static function layout($subject, $eyebrow, $heading, $bodyHtml, $footNote = '')
    {
        $bg = self::e(self::siteUrl() . '/assets/images/mail/fondo-correo.jpg');
        $site = self::e(self::siteUrl());
        $foot = ($footNote !== '' ? $footNote . '<br>' : '')
            . 'Este correo se envió desde una dirección que no recibe respuestas.<br>'
            . '<a href="' . $site . '" style="color:#ffd400">geekpoint.com.mx</a>';

        return '<!doctype html><html lang="es"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' . self::e($subject) . '</title></head>'
            . '<body style="margin:0;padding:0;background:#f3efe4">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe4"><tr><td align="center" style="padding:24px 12px">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:3px solid #111014">'
            . '<tr><td style="background:#ffd400;padding:20px 24px;border-bottom:3px solid #111014">'
            .   '<span style="display:inline-block;background:#111014;color:#ffd400;font:bold 18px Impact,Arial Black,sans-serif;padding:4px 9px">G</span>'
            .   '<span style="font:bold 22px Impact,Arial Black,sans-serif;color:#111014;letter-spacing:1px;vertical-align:middle;padding-left:8px">GEEKPOINT</span>'
            . '</td></tr>'
            . '<tr><td background="' . $bg . '" bgcolor="#ffffff" style="padding:28px 24px;background-color:#ffffff;'
            .   'background-image:url(' . $bg . ');background-repeat:no-repeat;background-position:right top">'
            .   self::label($eyebrow)
            .   '<h1 style="margin:0 0 16px;font:28px/1.1 Impact,Arial Black,sans-serif;color:#111014;text-transform:uppercase">' . self::e($heading) . '</h1>'
            .   $bodyHtml
            . '</td></tr>'
            . '<tr><td style="background:#111014;padding:16px 24px;font:12px/1.6 Arial,sans-serif;color:#c9c5bb">' . $foot . '</td></tr>'
            . '</table></td></tr></table></body></html>';
    }

    /* ------------------------------------------------------------------
       Apartados
       ------------------------------------------------------------------ */

    /**
     * Confirmación de apartado. $r es el apartado tal como lo devuelve la API
     * (folio, items, total…); $branch la sucursal elegida (o null).
     */
    public static function reservationConfirmation(array $r, $branch = null)
    {
        $first = self::firstName($r['customer_name'] ?? '');
        $folio = (string) $r['folio'];
        $subject = 'Tu apartado ' . $folio . ' en GeekPoint';

        $preventa = !empty($r['is_preventa'])
            ? '<p style="margin:0 0 20px;padding:12px 14px;background:#fff3b0;font:14px/1.5 Arial,sans-serif;color:#111014">'
              . 'Tu pedido incluye artículos en <b>preventa</b>: te avisaremos cuando estén listos para recoger.</p>'
            : '';

        $body = self::p('Guardamos tus productos. Presenta este folio en la sucursal para recogerlos y pagar.')
            . self::folioBox($folio) . $preventa . self::itemsTable($r)
            . self::small('Precios con IVA incluido. El pago se realiza al recoger en tienda. Te escribiremos cuando tu pedido esté listo.')
            . self::branchBlock($branch);

        $html = self::layout($subject, 'APARTADO CONFIRMADO',
            $first !== '' ? '¡Listo, ' . $first . '!' : '¡Tu apartado está listo!', $body,
            'Si no hiciste este apartado, ignora este correo.');
        $text = "Folio: $folio\nPresenta este folio en la sucursal para recoger y pagar.\n\n"
            . self::itemsText($r) . "\n" . self::branchText($branch) . "\n" . self::siteUrl();

        return self::send($r['customer_email'] ?? '', $subject, $html, $text);
    }

    /** Cambio de estado del apartado: lista | cobrada | cancelada. */
    public static function reservationStatus(array $r, $branch = null)
    {
        $folio = (string) $r['folio'];
        $first = self::firstName($r['customer_name'] ?? '');
        $hi = $first !== '' ? self::e($first) . ', ' : '';

        switch ($r['status'] ?? '') {
            case 'lista':
                $subject = 'Tu pedido ' . $folio . ' está listo para recoger';
                $eyebrow = 'PEDIDO LISTO';
                $heading = '¡Ya puedes pasar por él!';
                $body = self::p($hi . 'tu pedido ya está apartado en la sucursal. Presenta este folio para recogerlo y pagar.')
                    . self::folioBox($folio) . self::itemsTable($r) . self::small('Precios con IVA incluido.')
                    . self::branchBlock($branch);
                $text = "Tu pedido $folio está listo para recoger.\n\n" . self::itemsText($r) . "\n" . self::branchText($branch);
                break;
            case 'cobrada':
                $subject = 'Gracias por tu compra · ' . $folio;
                $eyebrow = 'PEDIDO ENTREGADO';
                $heading = '¡Gracias por tu compra!';
                $body = self::p($hi . 'recogiste tu pedido <b>' . self::e($folio) . '</b>. Esperamos que lo disfrutes.')
                    . self::itemsTable($r) . self::small('Si necesitas factura, solicítala en la sucursal con tu folio.')
                    . self::button(self::siteUrl() . '/#/', 'Ver novedades');
                $text = "Gracias por tu compra. Folio $folio.\n\n" . self::itemsText($r);
                break;
            case 'cancelada':
                $subject = 'Tu apartado ' . $folio . ' fue cancelado';
                $eyebrow = 'APARTADO CANCELADO';
                $heading = 'Cancelamos tu apartado';
                $body = self::p($hi . 'el apartado <b>' . self::e($folio) . '</b> se canceló y los productos volvieron a estar disponibles en tienda.')
                    . self::itemsTable($r)
                    . self::small('Si crees que es un error, acude a la sucursal con tu folio.')
                    . self::button(self::siteUrl() . '/#/', 'Volver a la tienda');
                $text = "Tu apartado $folio fue cancelado.\n\n" . self::itemsText($r);
                break;
            default:
                return false;
        }
        return self::send($r['customer_email'] ?? '', $subject, self::layout($subject, $eyebrow, $heading, $body), $text);
    }

    /* ------------------------------------------------------------------
       Cuenta
       ------------------------------------------------------------------ */

    /** Enlace para verificar el correo de una cuenta. */
    public static function verifyEmail(array $user, $link)
    {
        $first = self::firstName($user['name'] ?? '');
        $subject = 'Verifica tu correo en GeekPoint';
        $body = self::p(($first !== '' ? self::e($first) . ', c' : 'C') . 'onfirma que este correo es tuyo para recibir tus pedidos y avisos de stock.')
            . self::button($link, 'Verificar mi correo')
            . self::small('El enlace vence en 48 horas. Si el botón no funciona, copia esta dirección en tu navegador:<br>'
                . '<span style="word-break:break-all">' . self::e($link) . '</span>');
        $html = self::layout($subject, 'VERIFICA TU CORREO', 'Un paso más', $body,
            'Si no creaste una cuenta en GeekPoint, ignora este correo.');
        return self::send($user['email'], $subject, $html, "Verifica tu correo en GeekPoint:\n$link\n\nEl enlace vence en 48 horas.");
    }

    /** Aviso de seguridad: se cambió la contraseña. */
    public static function passwordChanged(array $user)
    {
        $subject = 'Tu contraseña de GeekPoint cambió';
        $body = self::p('La contraseña de tu cuenta <b>' . self::e($user['email']) . '</b> se cambió el '
            . self::e(date('d/m/Y \a \l\a\s H:i')) . '.')
            . self::small('Si fuiste tú, no tienes que hacer nada. Si no, contacta a la tienda de inmediato para proteger tu cuenta.');
        return self::send($user['email'], $subject, self::layout($subject, 'SEGURIDAD', 'Contraseña actualizada', $body),
            "La contraseña de tu cuenta se cambió. Si no fuiste tú, contacta a la tienda.");
    }

    /** Aviso al correo ANTERIOR cuando se cambia el correo de la cuenta. */
    public static function emailChanged($oldEmail, $newEmail)
    {
        $subject = 'El correo de tu cuenta GeekPoint cambió';
        $body = self::p('El correo de tu cuenta se cambió de <b>' . self::e($oldEmail) . '</b> a <b>' . self::e($newEmail) . '</b>.')
            . self::small('Si no fuiste tú, contacta a la tienda de inmediato.');
        return self::send($oldEmail, $subject, self::layout($subject, 'SEGURIDAD', 'Cambio de correo', $body),
            "El correo de tu cuenta cambió a $newEmail. Si no fuiste tú, contacta a la tienda.");
    }

    /* ------------------------------------------------------------------
       Avisos de stock ("Notifícame")
       ------------------------------------------------------------------ */

    /** Invitado: confirma que quiere recibir el aviso (doble opt-in). */
    public static function stockAlertConfirm($email, $title, $link)
    {
        $subject = 'Confirma tu aviso de ' . $title;
        $body = self::p('Pediste que te avisemos cuando <b>' . self::e($title) . '</b> vuelva a tener stock. Confirma con el botón para activar el aviso:')
            . self::button($link, 'Sí, avísenme')
            . self::small('Si no fuiste tú, ignora este correo: no te escribiremos.');
        return self::send($email, $subject, self::layout($subject, 'AVISO DE STOCK', 'Confirma tu aviso', $body),
            "Confirma tu aviso de stock para $title:\n$link");
    }

    /** El producto volvió a tener stock. */
    public static function stockAvailable($email, $title, array $branches, $shopLink, $unsubscribeLink)
    {
        $subject = '¡' . $title . ' ya tiene stock!';
        $list = '';
        $text = '';
        foreach ($branches as $b) {
            $list .= self::e($b['name']) . ' · ' . (int) $b['stock'] . ' disponibles<br>';
            $text .= '- ' . $b['name'] . ': ' . (int) $b['stock'] . "\n";
        }
        $body = self::p('<b>' . self::e($title) . '</b> volvió a estar disponible. Apártalo antes de que se agote otra vez.')
            . ($list !== '' ? self::label('DISPONIBLE EN') . '<p style="margin:0 0 22px;font:15px/1.6 Arial,sans-serif;color:#111014">' . $list . '</p>' : '')
            . self::button($shopLink, 'Ver en la tienda');
        $html = self::layout($subject, 'AVISO DE STOCK', '¡Ya llegó!', $body,
            'Recibes esto porque pediste un aviso de stock. <a href="' . self::e($unsubscribeLink) . '" style="color:#c9c5bb">Cancelar aviso</a>');
        return self::send($email, $subject, $html, "$title ya tiene stock.\n$text\n$shopLink");
    }
}
