<?php
/**
 * Validación mínima de entrada. Acumula errores por campo.
 */
class Validator
{
    private $data;
    private $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function make(array $data)
    {
        return new self($data);
    }

    public function required($field, $label = null)
    {
        $v = $this->data[$field] ?? null;
        if ($v === null || $v === '' || (is_array($v) && count($v) === 0)) {
            $this->errors[$field][] = ($label ?: $field) . ' es obligatorio.';
        }
        return $this;
    }

    public function email($field)
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && $v !== '' && !filter_var($v, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = 'Correo no válido.';
        }
        return $this;
    }

    public function in($field, array $allowed)
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && $v !== '' && !in_array($v, $allowed, true)) {
            $this->errors[$field][] = 'Valor no permitido.';
        }
        return $this;
    }

    public function numericMin($field, $min)
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && $v !== '' && (!is_numeric($v) || $v + 0 < $min)) {
            $this->errors[$field][] = 'Debe ser un número mayor o igual a ' . $min . '.';
        }
        return $this;
    }

    public function fails()
    {
        return count($this->errors) > 0;
    }

    public function errors()
    {
        return $this->errors;
    }

    /** Aborta con 422 si hay errores. */
    public function validateOrFail()
    {
        if ($this->fails()) {
            Response::validation($this->errors);
        }
        return $this;
    }
}
