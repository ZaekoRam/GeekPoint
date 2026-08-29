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
        self::json(['ok' => true, 'data' => $data], $status);
    }

    public static function error($status, $code, $message, $extra = [])
    {
        self::json(array_merge([
            'ok'      => false,
            'error'   => $code,
            'message' => $message,
        ], $extra), $status);
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
