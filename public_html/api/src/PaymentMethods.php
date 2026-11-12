<?php
/**
 * Catálogo de métodos de pago (tabla `payment_methods`).
 *
 * El POS cobra con tres métodos —efectivo, tarjeta y transferencia— y el
 * corte de caja lleva un total por cada uno, así que el catálogo es cerrado:
 * la tabla les da nombre (es/en) y permite desactivarlos, no agregar otros.
 *
 * Si la tabla todavía no existe (base sin la migración 2026_11_11_000001) se
 * usan los tres de siempre: cobrar no depende de si primero se subieron los
 * archivos o se corrió el SQL.
 */
class PaymentMethods
{
    const BUILT_IN = [
        ['code' => 'cash',     'name_es' => 'Efectivo',      'name_en' => 'Cash',     'status' => 'active'],
        ['code' => 'card',     'name_es' => 'Tarjeta',       'name_en' => 'Card',     'status' => 'active'],
        ['code' => 'transfer', 'name_es' => 'Transferencia', 'name_en' => 'Transfer', 'status' => 'active'],
    ];

    /** @var array|null filas del catálogo; se consulta una vez por petición */
    private static $rows = null;

    /** @return array[] [{code, name_es, name_en, status}], en el orden del catálogo */
    public static function all()
    {
        if (self::$rows !== null) {
            return self::$rows;
        }
        try {
            $rows = Database::all(
                'SELECT code, name_es, name_en, status FROM payment_methods ORDER BY sort_order, id'
            );
        } catch (PDOException $e) {
            if ($e->getCode() !== '42S02') {   // 42S02 = la tabla no existe
                throw $e;
            }
            return self::$rows = self::BUILT_IN;
        }

        $known = array_column(self::BUILT_IN, 'code');
        self::$rows = array_values(array_filter($rows, function ($r) use ($known) {
            return in_array($r['code'], $known, true);
        }));
        return self::$rows;
    }

    /** Códigos con los que se puede cobrar hoy. */
    public static function activeCodes()
    {
        $codes = [];
        foreach (self::all() as $r) {
            if ($r['status'] === 'active') {
                $codes[] = $r['code'];
            }
        }
        return $codes;
    }

    /** Todos los códigos del catálogo, activos o no (para leer ventas pasadas). */
    public static function codes()
    {
        return array_column(self::all(), 'code');
    }
}
