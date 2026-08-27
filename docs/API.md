# API GeekPoint POS — referencia

Base: `/api`  ·  Respuestas JSON: `{ "ok": true, "data": {...} }` o
`{ "ok": false, "error": "codigo", "message": "..." }`.

Autenticación: cabecera `Authorization: Bearer <token>` (se obtiene en `/auth/login`).

| Código HTTP | Significado |
|---|---|
| 401 | Sin token o token caducado |
| 403 | Rol sin permiso / recurso de otra sucursal |
| 409 | Conflicto (duplicado, stock insuficiente, pago incompleto) |
| 422 | Validación fallida (`data.fields`) |

---

## Auth

| Método | Ruta | Rol | Cuerpo |
|---|---|---|---|
| POST | `/auth/login` | — | `{email, password}` → `{token, user}` |
| POST | `/auth/logout` | auth | — |
| GET  | `/auth/me` | auth | → `{user, branch}` |

## Sucursales

| Método | Ruta | Rol |
|---|---|---|
| GET | `/branches` | admin (todas) · otros (la suya) |
| POST | `/branches` | admin |
| GET | `/branches/{id}` | admin / propia |
| PUT | `/branches/{id}` | admin |
| PATCH | `/branches/{id}/status` | admin · `{status: active\|inactive}` |
| DELETE | `/branches/{id}` | admin (falla 409 si tiene ventas) |

## Usuarios

| Método | Ruta | Rol |
|---|---|---|
| GET | `/users?role=&branch_id=` | admin |
| POST | `/users` | admin · `{name,email,password,role,branch_id}` |
| PUT | `/users/{id}` | admin (`password` opcional) |
| PATCH | `/users/{id}/status` | admin |
| DELETE | `/users/{id}` | admin |

## Categorías

| GET | `/categories` | auth | catálogo global (manga, figuras, tcg, cómics, coleccionables) |

## Catálogo de la tienda (público, sin auth)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/catalog` | Lista de productos para el e-commerce. Consume **Jikan (MyAnimeList)** para portadas reales y cachea 24 h en `api/cache/catalog.json`. Respuesta: `{ products:[...], source: "jikan"\|"fallback"\|"unavailable", cached:bool }`. Con `?refresh=1` fuerza la regeneración. Si MAL está caído tras 3 intentos, responde `unavailable` en < 2 s y el front usa su catálogo local. |
| GET | `/catalog/image?src=<url>` | Proxy de imágenes (sólo `cdn.myanimelist.net`) para que las portadas sean del mismo origen → texturas WebGL sin problemas de CORS. Cachea 30 días en `api/cache/`. |

## Productos / inventario

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/products?q=&category_id=&low_stock=1&status=active\|all&branch_id=` | auth | El cajero/gerente sólo ve su sucursal; el admin filtra con `branch_id` |
| POST | `/products` | admin / gerente | `{sku,name,price,category_id,stock,min_stock,tax_rate}` |
| GET | `/products/{id}` | auth |
| PUT | `/products/{id}` | admin / gerente | no cambia el stock |
| PATCH | `/products/{id}/stock` | admin / gerente | `{mode: set\|delta, value, note}` → registra movimiento |
| DELETE | `/products/{id}` | admin / gerente | baja lógica si tiene ventas |

## Cajas

| GET | `/registers?branch_id=` | auth |
| POST | `/registers` | admin / gerente · `{name}` |
| DELETE | `/registers/{id}` | admin / gerente |

## Inventario

| GET | `/inventory/alerts?branch_id=` | auth | productos con `stock <= min_stock` |
| GET | `/inventory/movements?branch_id=&product_id=&type=&limit=` | auth | historial |

## Ventas (POS)

| Método | Ruta | Rol | Cuerpo |
|---|---|---|---|
| POST | `/sales` | cajero / gerente / admin | ver abajo |
| GET | `/sales?from=&to=&payment_method=&limit=&branch_id=` | auth | cajero → sus ventas; gerente → su sucursal; admin → todas |
| GET | `/sales/{id}` | auth | venta + renglones (ticket) |

**Cuerpo de `POST /sales`:**

```json
{
  "branch_id": 1,
  "register_id": 1,
  "customer_name": "Mostrador",
  "payment_method": "cash",
  "amount_paid": 500,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

El servidor: bloquea las filas de producto, valida stock, calcula subtotal/IVA/total
(precio con IVA incluido, se desglosa hacia atrás), genera folio consecutivo por
sucursal, inserta la venta y sus renglones, **descuenta el inventario** y registra un
movimiento por cada producto. Todo en una transacción.

## Reportes

| GET | `/reports/overview` | admin | KPIs globales, ventas por sucursal, serie 14 días, top productos |
| GET | `/reports/branch/{id}` | admin / gerente (propia) | KPIs de la sucursal, ranking de cajeros, ventas recientes |
