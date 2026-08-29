<?php
/**
 * Router mínimo con patrones tipo  products/{id}
 */
class Router
{
    private $routes = [];

    public function add($method, $pattern, callable $handler)
    {
        $this->routes[] = [strtoupper($method), trim($pattern, '/'), $handler];
        return $this;
    }

    public function get($p, $h)    { return $this->add('GET', $p, $h); }
    public function post($p, $h)   { return $this->add('POST', $p, $h); }
    public function put($p, $h)    { return $this->add('PUT', $p, $h); }
    public function patch($p, $h)  { return $this->add('PATCH', $p, $h); }
    public function delete($p, $h) { return $this->add('DELETE', $p, $h); }

    public function dispatch($method, $path)
    {
        $path = trim($path, '/');
        $allowedForPath = [];

        foreach ($this->routes as $route) {
            list($rMethod, $rPattern, $handler) = $route;

            $params = $this->match($rPattern, $path);
            if ($params === false) {
                continue;
            }
            $allowedForPath[] = $rMethod;

            if ($rMethod === $method) {
                return call_user_func($handler, $params);
            }
        }

        if (!empty($allowedForPath)) {
            header('Allow: ' . implode(', ', array_unique($allowedForPath)));
            Response::error(405, 'method_not_allowed', 'Método no permitido para esta ruta.');
        }

        Response::notFound('Ruta no encontrada: ' . $path);
    }

    /** @return array|false  parámetros nombrados o false si no coincide */
    private function match($pattern, $path)
    {
        $pSeg = $pattern === '' ? [] : explode('/', $pattern);
        $tSeg = $path === '' ? [] : explode('/', $path);

        if (count($pSeg) !== count($tSeg)) {
            return false;
        }

        $params = [];
        foreach ($pSeg as $i => $seg) {
            if (strlen($seg) > 2 && $seg[0] === '{' && substr($seg, -1) === '}') {
                $params[substr($seg, 1, -1)] = $tSeg[$i];
            } elseif ($seg !== $tSeg[$i]) {
                return false;
            }
        }
        return $params;
    }
}
