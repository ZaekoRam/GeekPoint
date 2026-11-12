<?php
/**
 * Idioma de los mensajes del API (español / inglés).
 *
 * Los controladores escriben sus mensajes en español. Cuando la petición
 * pide inglés (cabecera `X-Lang: en`, que manda js/api.js según el selector
 * de idioma de la página), Response pasa cada mensaje por Lang::tr() antes
 * de responder. Sin cabecera, o si un texto no tiene traducción, sale en
 * español: nada se rompe por un mensaje nuevo sin traducir.
 *
 * Al agregar un mensaje a un controlador, agrega aquí su traducción:
 *   - texto fijo        -> self::$exact
 *   - texto con datos   -> self::patterns()   (nombre de producto, cantidades…)
 */
class Lang
{
    /** @var string|null idioma de la petición, ya resuelto */
    private static $lang = null;

    /** 'en' si la petición lo pide; si no, 'es'. */
    public static function current()
    {
        if (self::$lang === null) {
            $h = strtolower(trim((string) ($_SERVER['HTTP_X_LANG'] ?? '')));
            self::$lang = strpos($h, 'en') === 0 ? 'en' : 'es';
        }
        return self::$lang;
    }

    /** Traduce un mensaje escrito en español al idioma de la petición. */
    public static function tr($text, $lang = null)
    {
        $lang = $lang ?: self::current();
        if ($lang !== 'en' || !is_string($text) || $text === '') {
            return $text;
        }
        if (isset(self::$exact[$text])) {
            return self::$exact[$text];
        }
        foreach (self::patterns() as $regex => $fn) {
            if (preg_match($regex, $text, $m)) {
                return $fn($m);
            }
        }
        return $text;
    }

    /** Errores de validación: { campo: [mensaje, ...] }. */
    public static function trFields(array $fields, $lang = null)
    {
        foreach ($fields as $field => $messages) {
            if (is_array($messages)) {
                foreach ($messages as $i => $msg) {
                    $fields[$field][$i] = self::tr($msg, $lang);
                }
            } else {
                $fields[$field] = self::tr($messages, $lang);
            }
        }
        return $fields;
    }

    // -----------------------------------------------------------------
    //  Mensajes con datos dentro
    // -----------------------------------------------------------------
    private static function patterns()
    {
        return [
            // Validator::required — "<etiqueta> es obligatorio."
            '/^(.+) es obligatorio\.$/u' => function ($m) {
                return (self::$labels[$m[1]] ?? $m[1]) . ' is required.';
            },
            '/^Debe ser un número mayor o igual a (.+)\.$/u' => function ($m) {
                return 'Must be a number greater than or equal to ' . $m[1] . '.';
            },
            '/^Ruta no encontrada: (.*)$/u' => function ($m) {
                return 'Route not found: ' . $m[1];
            },
            '/^MySQL no responde en (.+):(\d+)\.$/u' => function ($m) {
                return 'MySQL is not responding at ' . $m[1] . ':' . $m[2] . '.';
            },
            '/^No se pudo consultar pokemontcg\.io \(HTTP (\d+)\)\.$/u' => function ($m) {
                return 'Could not reach pokemontcg.io (HTTP ' . $m[1] . ').';
            },
            '/^Sucursal (\d+) no existe\.$/u' => function ($m) {
                return 'Branch ' . $m[1] . ' does not exist.';
            },
            '/^El producto #(\d+) no existe en esta sucursal\.$/u' => function ($m) {
                return 'Product #' . $m[1] . ' does not exist at this branch.';
            },
            '/^El producto "(.+)" está inactivo\.$/u' => function ($m) {
                return 'Product "' . $m[1] . '" is inactive.';
            },
            '/^Stock insuficiente de "(.+)"\. Disponible: (-?\d+), solicitado: (\d+)\.$/u' => function ($m) {
                return 'Not enough stock of "' . $m[1] . '". Available: ' . $m[2] . ', requested: ' . $m[3] . '.';
            },
            '/^Elige qué tomo de «(.+)» quieres apartar\.$/u' => function ($m) {
                return 'Choose which volume of “' . $m[1] . '” you want to reserve.';
            },
            '/^El apartado está "(.+)" y no puede pasar a "(.+)"\.$/u' => function ($m) {
                $st = ['pendiente' => 'pending', 'lista' => 'ready', 'cobrada' => 'charged', 'cancelada' => 'cancelled'];
                return 'The reservation is "' . ($st[$m[1]] ?? $m[1]) . '" and can\'t change to "' . ($st[$m[2]] ?? $m[2]) . '".';
            },
        ];
    }

    /** Etiquetas que los controladores pasan a Validator::required(). */
    private static $labels = [
        'El nombre'                   => 'Name',
        'El correo'                   => 'Email',
        'La contraseña'               => 'Password',
        'Confirma tu contraseña'      => 'Password confirmation',
        'Tu contraseña actual'        => 'Your current password',
        'La nueva contraseña'         => 'New password',
        'Confirma la nueva contraseña' => 'New password confirmation',
        'El rol'                      => 'Role',
        'La clave'                    => 'Code',
        'El código (SKU)'             => 'SKU',
        'El SKU'                      => 'SKU',
        'El precio'                   => 'Price',
        'El nombre de la caja'        => 'Register name',
        'El nombre del cliente'       => 'Customer name',
    ];

    // -----------------------------------------------------------------
    //  Mensajes fijos
    // -----------------------------------------------------------------
    private static $exact = [
        // Generales
        'Error interno del servidor.'               => 'Internal server error.',
        'No se pudo conectar con la base de datos.' => 'Could not connect to the database.',
        'Recurso no encontrado.'                    => 'Resource not found.',
        'No autenticado.'                           => 'Not signed in.',
        'No tienes permiso para esta acción.'       => 'You don\'t have permission for this action.',
        'Ese recurso pertenece a otra sucursal.'    => 'That resource belongs to another branch.',
        'Revisa los datos enviados.'                => 'Please check the submitted data.',
        'Método no permitido para esta ruta.'       => 'Method not allowed for this route.',
        'Demasiadas solicitudes. Inténtalo más tarde.' => 'Too many requests. Try again later.',
        'Correo no válido.'                         => 'Invalid email.',
        'Valor no permitido.'                       => 'Value not allowed.',
        'Estado no válido.'                         => 'Invalid status.',

        // Sesión y cuenta
        'Correo o contraseña incorrectos.'          => 'Wrong email or password.',
        'Tu cuenta está desactivada. Contacta al administrador.' => 'Your account is deactivated. Contact the administrator.',
        'Ya existe una cuenta con ese correo.'      => 'An account with that email already exists.',
        'Mínimo 6 caracteres.'                      => 'At least 6 characters.',
        'Las contraseñas no coinciden.'             => 'Passwords don\'t match.',
        'Sesión cerrada.'                           => 'Signed out.',
        'Ese correo ya está en uso.'                => 'That email is already in use.',
        'La contraseña actual no es correcta.'      => 'The current password is not correct.',
        'Contraseña actualizada.'                   => 'Password updated.',
        'Tu correo ya está verificado.'             => 'Your email is already verified.',
        'Ya te enviamos un correo hace un momento. Espera un minuto para pedir otro.' => 'We just sent you an email. Wait a minute before requesting another.',
        'No pudimos enviar el correo. Inténtalo más tarde.' => 'We couldn\'t send the email. Try again later.',
        'Te enviamos un nuevo enlace de verificación.' => 'We sent you a new verification link.',

        // Sucursales
        'Sucursal no encontrada.'                   => 'Branch not found.',
        'Ya existe una sucursal con esa clave.'     => 'A branch with that code already exists.',
        'Ya existe otra sucursal con esa clave.'    => 'Another branch already uses that code.',
        'La sucursal tiene ventas registradas. Desactívala en lugar de eliminarla.' => 'The branch has recorded sales. Deactivate it instead of deleting it.',
        'Sucursal no válida.'                       => 'Invalid branch.',
        'Selecciona una sucursal.'                  => 'Select a branch.',
        'La sucursal no existe.'                    => 'The branch does not exist.',
        'Esa sucursal no existe.'                   => 'That branch does not exist.',

        // Usuarios
        'Ya existe un usuario con ese correo.'      => 'A user with that email already exists.',
        'Usuario no encontrado.'                    => 'User not found.',
        'Los gerentes y cajeros necesitan sucursal.' => 'Managers and cashiers need a branch.',
        'No puedes cambiar el estado de tu propia cuenta.' => 'You can\'t change the status of your own account.',
        'No puedes eliminar tu propia cuenta.'      => 'You can\'t delete your own account.',
        'El usuario tiene ventas registradas. Desactívalo en lugar de eliminarlo.' => 'The user has recorded sales. Deactivate the account instead of deleting it.',

        // Productos e inventario
        'Producto no encontrado.'                   => 'Product not found.',
        'Ya existe un producto con ese SKU en la sucursal.' => 'A product with that SKU already exists at the branch.',
        'Indica el stock para al menos una sucursal.' => 'Set the stock for at least one branch.',
        'Ese SKU ya existe en el catálogo.'         => 'That SKU already exists in the catalog.',
        'Indica una cantidad numérica.'             => 'Enter a numeric quantity.',
        'El ajuste dejaría el stock en negativo.'   => 'The adjustment would leave the stock negative.',
        'El producto tiene ventas; se desactivó para conservar el historial.' => 'The product has sales; it was deactivated to keep the history.',
        'No hay productos con ese SKU.'             => 'There are no products with that SKU.',
        'Solo el administrador general puede cambiar el precio.' => 'Only the general administrator can change the price.',
        'Solo el administrador general puede modificar descuentos.' => 'Only the general administrator can change discounts.',
        'El porcentaje debe ser numérico entre 0 y 90.' => 'The percentage must be a number between 0 and 90.',
        'El porcentaje debe estar entre 0 y 90.'    => 'The percentage must be between 0 and 90.',
        'La fecha final debe ser posterior a la inicial.' => 'The end date must be after the start date.',
        'Usa una fecha ISO 8601 con zona horaria.'  => 'Use an ISO 8601 date with a time zone.',
        'La fecha no es válida.'                    => 'The date is not valid.',
        'Este producto no admite avisos de stock.'  => 'This product doesn\'t support stock alerts.',
        'Respuesta inválida de pokemontcg.io.'      => 'Invalid response from pokemontcg.io.',

        // Subida de imágenes
        'No se recibió ningún archivo.'             => 'No file was received.',
        'El archivo excede el límite del servidor.' => 'The file exceeds the server limit.',
        'El archivo es demasiado grande.'           => 'The file is too large.',
        'La subida se interrumpió.'                 => 'The upload was interrupted.',
        'Falta la carpeta temporal en el servidor.' => 'The server is missing its temporary folder.',
        'El servidor no pudo escribir el archivo.'  => 'The server could not write the file.',
        'Error al subir el archivo.'                => 'Error uploading the file.',
        'La imagen debe pesar entre 1 byte y 6 MB.' => 'The image must be between 1 byte and 6 MB.',
        'Subida no válida.'                         => 'Invalid upload.',
        'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' => 'Format not allowed. Use JPG, PNG, WEBP or GIF.',
        'No se pudo crear /uploads/products en el servidor.' => 'Could not create /uploads/products on the server.',
        'No se pudo guardar el archivo en el servidor.' => 'Could not save the file on the server.',

        // Cajas y cortes
        'Caja no encontrada.'                       => 'Register not found.',
        'La caja tiene ventas; se desactivó para conservar el historial.' => 'The register has sales; it was deactivated to keep the history.',
        'Captura el efectivo que contaste en la caja.' => 'Enter the cash you counted in the register.',
        'Indica la sucursal del corte.'             => 'Specify the branch for the cash count.',
        'La caja no pertenece a la sucursal.'       => 'The register does not belong to the branch.',

        // Ventas
        'Indica la sucursal de la venta.'           => 'Specify the branch for the sale.',
        'Indica de una a tres formas de pago.'      => 'Provide one to three payment methods.',
        'Método de pago no válido o repetido.'      => 'Invalid or repeated payment method.',
        'Método de pago no válido.'                 => 'Invalid payment method.',
        'Ese método de pago está desactivado.'      => 'That payment method is disabled.',
        'Cada pago necesita un monto mayor a cero.' => 'Each payment needs an amount greater than zero.',
        'Agrega al menos un producto a la venta.'   => 'Add at least one product to the sale.',
        'Cada renglón necesita product_id y quantity válidos.' => 'Each line needs a valid product_id and quantity.',
        'La caja no existe o no pertenece a la sucursal.' => 'The register does not exist or does not belong to the branch.',
        'El precio cambió. Revisa el total actualizado antes de cobrar.' => 'The price changed. Review the updated total before charging.',
        'Tarjeta y transferencia no pueden pasar del total: el cambio solo se da en efectivo.' => 'Card and transfer can\'t exceed the total: change is only given in cash.',
        'El pago recibido es menor que el total.'   => 'The payment received is less than the total.',
        'Venta no encontrada.'                      => 'Sale not found.',
        'Esa venta no existe.'                      => 'That sale does not exist.',
        'Escribe el motivo de la cancelación.'      => 'Enter the reason for voiding the sale.',
        'Esa venta ya estaba cancelada.'            => 'That sale was already voided.',
        'Esa venta ya entró en un corte de caja cerrado; no se puede cancelar.' => 'That sale is already part of a closed cash count; it can\'t be voided.',

        // Apartados
        'El apartado no tiene productos.'           => 'The reservation has no products.',
        'Un producto local ya no está disponible.'  => 'A store product is no longer available.',
        'Uno o más precios cambiaron. Revisa el total actualizado.' => 'One or more prices changed. Review the updated total.',
        'Apartado no encontrado.'                   => 'Reservation not found.',
        'Estado no válido (lista | cobrada | cancelada).' => 'Invalid status (lista | cobrada | cancelada).',
    ];
}
