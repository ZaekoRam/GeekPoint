# API GeekPoint POS — referencia

Base: `/api`  ·  Respuestas JSON: `{ "ok": true, "data": {...} }` o
`{ "ok": false, "error": "codigo", "message": "..." }`.

Autenticación: cabecera `Authorization: Bearer <token>` (se obtiene en `/auth/login`).

Idioma de los mensajes: cabecera `X-Lang: es|en` (la manda `js/api.js` según el selector
de idioma). Sin ella los mensajes salen en español. Las traducciones viven en `api/src/Lang.php`.

| Código HTTP | Significado |
|---|---|
| 401 | Sin token o token caducado |
| 403 | Rol sin permiso / recurso de otra sucursal |
| 409 | Conflicto (duplicado, stock insuficiente, pago incompleto) |
| 422 | Validación fallida (`fields`) |

**Roles** (catálogo `roles`): `admin` ve toda la red; `manager` y `cashier` quedan limitados a
su sucursal en el servidor (aunque manden otro `branch_id` o el `id` de un recurso ajeno);
`customer` es la cuenta de la tienda y no entra a ningún endpoint de operación. En las tablas
de abajo, **personal** = `admin`, `manager` o `cashier`.

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
| POST | `/users` | admin · `{name,email,password,role,branch_id}` · `role`: `manager` o `cashier` |
| PUT | `/users/{id}` | admin (`password` opcional) · el rol solo cambia entre `manager` y `cashier`; un `admin` sigue siéndolo |
| PATCH | `/users/{id}/status` | admin |
| DELETE | `/users/{id}` | admin |

## Categorías

| GET | `/categories` | personal | catálogo global (manga, figuras, tcg, cómics, coleccionables) |

## Catálogo de la tienda (público, sin auth)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/catalog` | Lista de productos para el e-commerce. Consume **Jikan (MyAnimeList)** para portadas reales y cachea 24 h en `api/cache/catalog.json`. Respuesta: `{ products:[...], source: "jikan"\|"fallback"\|"unavailable", cached:bool }`. Con `?refresh=1` fuerza la regeneración. Si MAL está caído tras 3 intentos, responde `unavailable` en < 2 s y el front usa su catálogo local. |
| GET | `/catalog/image?src=<url>` | Proxy de imágenes (sólo `cdn.myanimelist.net`) para que las portadas sean del mismo origen → texturas WebGL sin problemas de CORS. Cachea 30 días en `api/cache/`. |

## Productos / inventario

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/products?q=&category_id=&low_stock=1&status=active\|all&branch_id=` | personal | El cajero/gerente sólo ve su sucursal; el admin filtra con `branch_id` |
| POST | `/products` | admin / gerente | `{sku,name,price,category_id,stock,min_stock,tax_rate}`; sólo admin puede incluir descuento |
| GET | `/products/{id}` | personal |
| PUT | `/products/{id}` | admin / gerente | no cambia el stock; sólo admin cambia `price` y `tax_rate` (son del catálogo, compartido por todas las sucursales) |
| PATCH | `/products/{id}/stock` | admin / gerente | `{mode: set\|delta, value, note}` → registra movimiento |
| DELETE | `/products/{id}` | admin / gerente | baja lógica si tiene ventas |

`price` siempre es el precio de lista con IVA. Las lecturas agregan
`discount_percent`, `discount_starts_at`, `discount_ends_at`, `discount_status`
(`none`, `scheduled`, `active`, `expired`), `effective_price` y `unit_savings`.
Sólo `admin` puede escribir los tres campos de descuento; el porcentaje permitido
es `0..90` y las fechas deben ser ISO 8601 con zona. En `PUT`, cualquier cambio de
promoción se replica automáticamente a todas las filas del mismo SKU. En manga,
la promoción también se aplica a la ficha de la serie y a todos sus tomos; cada
tomo calcula el porcentaje sobre su propio precio. Los tomos creados posteriormente
heredan la promoción vigente de su serie.

## Cajas

| GET | `/registers?branch_id=` | personal |
| POST | `/registers` | admin / gerente · `{name}` |
| DELETE | `/registers/{id}` | admin / gerente |

## Inventario

| GET | `/inventory/alerts?branch_id=` | personal | productos con `stock <= min_stock` |
| GET | `/inventory/movements?branch_id=&product_id=&type=&limit=` | personal | historial |

## Ventas (POS)

| Método | Ruta | Rol | Cuerpo |
|---|---|---|---|
| POST | `/sales` | personal | ver abajo |
| GET | `/sales` | personal | cajero → sus ventas; gerente → su sucursal; admin → todas. Filtros abajo |
| GET | `/sales/{id}` | personal | venta + renglones + pagos (ticket) |
| POST | `/sales/{id}/void` | admin / gerente | `{reason}` · cancela, regresa el stock; no aplica si ya entró en un corte |
| GET | `/payment-methods` | personal | catálogo `payment_methods`: `[{code,name_es,name_en,status}]` |

**Filtros de `GET /sales`** (todos opcionales): `branch_id` (sólo admin), `user_id` (quién
cobró; admin y gerente), `from` y `to` (`AAAA-MM-DD`, ambas incluidas), `payment_method`
(`cash|card|transfer|mixed`), `status` (`completed|void`), `q` (folio o cliente), `limit`
(máx. 200) y `offset`. Además de `sales` responde `summary: {count, completed, void, total}`,
calculado sobre todo lo que cumple el filtro (no sólo la página); las canceladas no suman a `total`.

**Cuerpo de `POST /sales`:**

```json
{
  "branch_id": 1,
  "register_id": 1,
  "customer_name": "Mostrador",
  "payments": [
    { "method": "card", "amount": 300, "reference": "4242" },
    { "method": "cash", "amount": 200 }
  ],
  "expected_total": 447,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

`payments` lleva de uno a tres renglones, uno por método activo del catálogo
(`cash`, `card`, `transfer`); con más de uno la venta queda como `mixed`. Tarjeta y
transferencia no pueden pasar del total: el cambio sale sólo del efectivo. Sigue
aceptándose el formato anterior de un solo pago (`payment_method` + `amount_paid`).

El servidor: bloquea las filas de producto, valida stock, calcula subtotal/IVA/total
(precio con IVA incluido, se desglosa hacia atrás), genera folio consecutivo por
sucursal, inserta la venta y sus renglones, **descuenta el inventario** y registra un
movimiento por cada producto, y guarda un renglón en `sale_payments` por cada forma de
pago. Todo en una transacción.

El servidor vuelve a calcular el descuento vigente y nunca acepta precios enviados
por el cliente. Si `expected_total` cambió responde `409 price_changed`. Cada renglón
conserva `list_unit_price`, `discount_percent`, `unit_discount` y `unit_price` cobrado.

## Apartados

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| POST | `/reservations` | público | Crea un apartado; acepta `expected_total`; los productos locales se recalculan por `product_id` o SKU/sucursal |
| GET | `/reservations?status=&branch_id=` | personal | Lista de apartados |
| GET | `/reservations/{folio}` | personal | Detalle y fotografía de precios |
| PATCH | `/reservations/{folio}/status` | personal | `{status: cobrada\|cancelada, sale_id?}` |

Las referencias `local-*` se resuelven contra `products` y se cotizan nuevamente
en el servidor. Los elementos sintéticos de respaldo conservan el comportamiento
de cotización no vinculante y no admiten descuentos administrables.

## Reportes

| GET | `/reports/overview` | admin | KPIs globales, ventas por sucursal, serie 14 días, top productos |
| GET | `/reports/branch/{id}` | admin / gerente (propia) | KPIs de la sucursal, ranking de cajeros, ventas recientes |
