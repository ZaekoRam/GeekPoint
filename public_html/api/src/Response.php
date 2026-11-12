<?php
/**
 * Helpers para responder JSON de forma consistente.
 * Todos terminan la ejecución con exit.
 */
class Response
{
    public static function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    public static function ok($data = [], $status = 200)
    {
        if (is_array($data) && isset($data['message']) && is_string($data['message'])) {
            $data['message'] = self::tr($data['message']);
        }
        self::json(['ok' => true, 'data' => $data], $status);
    }

    public static function error($status, $code, $message, $extra = [])
    {
        if (isset($extra['fields']) && is_array($extra['fields']) && self::canTranslate()) {
            $extra['fields'] = Lang::trFields($extra['fields']);
        }
        self::json(array_merge([
            'ok'      => false,
            'error'   => $code,
            'message' => self::tr($message),
        ], $extra), $status);
    }

    /**
     * Mensaje en el idioma que pidió el cliente (ver Lang). `class_exists`
     * intenta cargar Lang.php: si faltara en el servidor, los mensajes salen
     * en español en vez de tronar justo al reportar un error.
     */
    private static function tr($message)
    {
        return self::canTranslate() ? Lang::tr($message) : $message;
    }

    private static function canTranslate()
    {
        return class_exists('Lang');
    }

    public static function notFound($message = 'Recurso no encontrado.')
    {
        self::error(404, 'not_found', $message);
    }

    public static function unauthorized($message = 'No autenticado.')
    {
        self::error(401, 'unauthorized', $message);
    }

    public static function forbidden($message = 'No tienes permiso para esta acción.')
    {
        self::error(403, 'forbidden', $message);
    }

    public static function validation(array $errors)
    {
        self::error(422, 'validation_failed', 'Revisa los datos enviados.', ['fields' => $errors]);
    }
}
