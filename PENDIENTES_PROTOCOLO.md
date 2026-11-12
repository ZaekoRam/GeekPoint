# GeekPoint: pendientes contra el protocolo del Proyecto Integrador

Contexto para otra sesión de Claude: proyecto en `C:\Users\deads\OneDrive\Documentos\GeekPoint\GeekPoint` (la carpeta externa `GeekPoint/` es una copia vieja, no tocarla).
Stack: PHP API (`public_html/api/index.php` + `controllers/`) + SPA en JS vanilla (`public_html/js/views/*.js`), MariaDB (`database/schema.sql` + `database/migrations/`). i18n en `public_html/js/i18n.js`.
Producción ya tiene todo lo subido hasta 2026-10-28. **Entrega final: 13–19 de noviembre 2026.**

> **Estado al 12-nov-2026:** los cinco puntos de código están hechos y probados en local.
> **Falta subirlos a producción** (sección «Para subir a producción») y los entregables no-código.

## Lo que YA cumple (no rehacer)
- Admin: login, CRUD de sucursales, registrar/asignar gerentes (`users`), ver inventarios de todas las sucursales, overview con KPIs (`reports/overview`), **consulta de ventas de todas las sucursales** (`#/admin/sales`).
- Sucursal: nombre, dirección, teléfono, estado, gerente, horario, inventario propio, cajas (`registers`).
- Gerente: productos CRUD, alta/baja de cajas, ajuste de existencias, alertas de bajo inventario, historial de ventas, cortes de caja.
- POS: búsqueda, carrito, subtotal/total, método de pago (incl. pagos mixtos en `sale_payments`), confirmar venta, ticket imprimible, descuento automático de inventario (`stock_movements`), cancelación con reposición.
- Tablas: users, **roles**, branches, categories, products, inventory, sales, sale_items, sale_payments, **payment_methods**, etc.
- Selector de idioma ES/EN (interfaz y mensajes del servidor) y publicación en servidor web.

## Hecho el 11–12 de noviembre (probado en local, sin subir)

### 1. Base de datos: tablas `roles` y `payment_methods`
- Migración `database/migrations/2026_11_11_000001_roles_metodos_pago.sql`: crea los dos catálogos (nombre es/en), `users.role` y `sale_payments.method` pasan de ENUM a `VARCHAR(20)` con llave foránea al `code` del catálogo, y crea el renglón de `sale_payments` de las ventas viejas que no lo tenían. `sales.payment_method` queda igual (resumen; `mixed` = varios métodos).
- Guarda el mismo texto de antes (`admin`, `cash`…): el PHP funciona con o sin la migración.
- `database/diagnostico_migracion_2026_11_11.sql` (solo lectura, antes y después) y `database/revertir_migracion_2026_11_11.sql` (deshacer).
- Actualizados `database/schema.sql`, `database/seed.sql`, `docs/diagrama-er.md` y `database/acomodar_disenador.js` (acomoda las tablas nuevas en el Diseñador de phpMyAdmin para el diagrama del reporte).
- Probado en MariaDB 10.4 (local) y 11.8 (Docker, la versión de Hostinger) sobre la copia de producción del 26-oct: migrar, repetir, revertir y volver a migrar; instalación desde cero con `schema.sql` + `seed.sql`.

### 2. Admin: «Consultar ventas de las sucursales»
- `#/admin/sales` en `js/views/admin.js`: filtros por sucursal, cajero, forma de pago, estado, fechas (con atajos Hoy / 7 días / Este mes) y folio o cliente; resumen (ventas, total, ticket promedio, canceladas); paginación; detalle = ticket de la venta, desde donde se puede cancelar.
- Enlaces desde el Resumen: KPIs de ventas y botón «Ver ventas» por sucursal.
- `GET /sales` acepta `user_id`, `status`, `q`, `offset` y devuelve `summary`; nuevo `GET /payment-methods`.

### 3. i18n
- Mensajes del servidor en inglés: `api/src/Lang.php` + cabecera `X-Lang` que manda `js/api.js`.
- Textos fijos corregidos: opciones de papel del ticket, tipos de movimiento de inventario, etiquetas de categoría del inventario, nombre sugerido de caja, etiqueta «Estado» del formulario de usuario, enlace «Saltar al contenido», interruptor de tema.
- No se traducen (son datos): nombres y descripciones de productos, nombres y horarios de sucursales, nombres de cajas. Los correos (`Mailer.php`) siguen solo en español.

### 4. Gerente limitado a su sucursal
- El servidor ya acotaba por sucursal; se confirmó con 147 pruebas contra el API local (gerente y cajero de la sucursal 1 contra recursos de la 2).
- Huecos cerrados: una cuenta de **cliente** ya no entra a endpoints de operación (antes recibía listas vacías, ahora 403); solo el admin cambia precio e IVA (el formulario lo decía, el servidor no lo exigía); el reporte por cajero ya no suma ventas hechas en otra sucursal; `sale_id` de un apartado se valida.
- Arreglo aparte: editar al usuario administrador lo degradaba a gerente (el formulario mandaba rol y sucursal). Corregido en formulario y servidor.
- Por diseño: nombre, descripción e imágenes de un producto son del catálogo compartido; si un gerente los edita cambian en todas las sucursales.

### 5. Detalles menores
- Ticket: sucursal, folio, fecha y hora con año, quién atendió, caja, cliente, cada producto con cantidad × precio unitario, subtotal, IVA, total, forma de pago, recibido y cambio.
- Cajero: el POS muestra precio y existencias de su sucursal (confirmado).
- Cuentas demo para docentes: `database/cuentas_demo_docentes.sql` crea `docente.admin@`, `docente.gerente@` y `docente.caja@geekpoint.mx`. La contraseña está en `docs/Cuentas-demo-docentes.md`. Ambos archivos están en `.gitignore`.

## Para subir a producción
1. **Respaldo**: exportar la base desde phpMyAdmin.
2. **SQL** (phpMyAdmin → SQL), en este orden:
   1. `database/diagnostico_migracion_2026_11_11.sql` — las filas «debe ser 0» deben dar 0.
   2. `database/migrations/2026_11_11_000001_roles_metodos_pago.sql` — al final debe mostrar 4 roles, 3 métodos, 2 llaves foráneas y 0 ventas sin pago.
   3. `database/cuentas_demo_docentes.sql` — debe listar las tres cuentas.
3. **Archivos** (rutas dentro de `public_html/`; no subir `api/config.php`):
   - `index.html`
   - `assets/css/app.css`
   - `js/api.js`, `js/i18n.js`, `js/main.js`, `js/theme.js`, `js/ui.js`
   - `js/views/admin.js`, `js/views/manager.js`, `js/views/pos.js`, `js/views/shell.js`
   - `api/index.php`
   - `api/src/Controller.php`, `api/src/Response.php`, `api/src/Lang.php` (nuevo), `api/src/PaymentMethods.php` (nuevo)
   - `api/controllers/`: `BranchController`, `CategoryController`, `FigureController`, `InventoryController`, `PokemonController`, `ProductController`, `RegisterController`, `ReportController`, `ReservationController`, `SaleController`, `UserController` (`.php`)
4. **Revisar en el sitio**: entrar con las tres cuentas demo; Admin → Ventas; cambiar a inglés y provocar un error (por ejemplo, contraseña equivocada) para ver el mensaje traducido.
5. Sugerencia: antes de la presentación, renovar las contraseñas de las cuentas de personal de producción.

## Entregables no-código de la fase final (13–19 nov)
- Reporte final (Word + PDF): actualizar el diagrama E-R (ahora con `roles` y `payment_methods`) y agregar las cuentas demo.
- Artículo formato IEEE (PDF).
- Video comercial ≤ 4 min.
- Código en GitHub actualizado (los cambios de arriba están sin commit).
- Bitácora semanal en Google Docs al día.
- Entregar en Classroom **2 días hábiles antes** de la presentación (si no, −5%).
