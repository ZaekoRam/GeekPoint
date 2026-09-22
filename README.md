# GeekPoint — Portal Coleccionable & Sistema POS Multi-Sede

Plataforma **dual** para tiendas de cultura geek (manga, figuras, cartas TCG,
cómics, coleccionables):

1. **Tienda e-commerce** de cara al cliente — catálogo interactivo con portadas
   reales, hero 3D estilo "Wii menu", vista previa 3D de cada producto, carrito
   flotante y consulta de disponibilidad por sucursal.
2. **Sistema POS / Gestión** para el personal — se entra por el botón
   *"Acceso POS / Personal"*: administrador general, gerente de sede y módulo de
   caja (POS) con descuento automático de inventario.

Detalles técnicos:

- **Front-end:** HTML + CSS + JavaScript *vanilla*. Router propio por hash, Three.js
  para el 3D, interfaz bilingüe (ES/EN). Sin framework, sin `npm`, sin build.
- **Portadas reales:** la API consume **Jikan (MyAnimeList)** —pública y gratuita—
  y cachea el resultado 24 h. Si MAL/Jikan no responde, la tienda usa un catálogo
  local con portadas "manga ink" generadas.
- **Back-end:** PHP puro (PDO) con API REST y autenticación por token Bearer.
- **Base de datos:** MySQL / MariaDB con transacciones (el stock nunca queda inconsistente).

---

## 1. Estructura del proyecto

```
punto de venta/
├── public_html/              ← RAÍZ WEB — sube TODO su contenido a Hostinger tal cual
│   ├── index.html
│   ├── .htaccess             ← cabeceras de caché (Apache/LiteSpeed)
│   ├── assets/css/           ← tokens (Manga Ink + tema oscuro), base, components, store, app
│   ├── assets/images/        ← placeholders locales (figuras, etc.)
│   ├── lib/                  ← gsap, ScrollTrigger, three, manifest (locales, sin CDN)
│   ├── js/
│   │   ├── config.js         ← detecta la URL de la API (raíz o subcarpeta)
│   │   ├── i18n.js           ← diccionarios ES / EN
│   │   ├── catalog.js        ← catálogo de tienda (AniList/Jikan) + portadas "ink" de respaldo
│   │   ├── three-hero.js     ← hero 3D con interacción estilo "Wii menu"
│   │   ├── api.js  store.js  ui.js  router.js  main.js
│   │   ├── services/         ← pokemonApi, figureApi
│   │   └── views/            ← store, login, admin, manager, pos, shell
│   └── api/                  ← API REST en PHP (dentro de public_html/)
│       ├── index.php         ← front controller (todas las rutas entran aquí)
│       ├── config.php        ← credenciales de la BD  (EDITAR en producción)
│       ├── config.example.php
│       ├── .htaccess         ← enruta /api/* a index.php
│       ├── src/              ← Database, Router, Request, Response, Auth, Validator, Controller
│       ├── controllers/      ← Auth, Branch, User, Category, Product, Register, Inventory, Sale, Report, Catalog, Pokemon, Figure, Reservation
│       ├── cache/            ← catálogo + imágenes cacheadas (se regenera solo)
│       └── tools/hash.php    ← genera hashes bcrypt (dev)
│
├── database/                 ← NO subir a public_html (solo para importar en phpMyAdmin)
│   ├── schema.sql            ← crea todas las tablas
│   ├── seed.sql              ← datos de demostración
│   └── migrations/           ← cambios incrementales de esquema/datos
│
├── dev-server.php            ← servidor de pruebas local (sirve public_html/; no se usa en producción)
└── docs/
    ├── DEPLOY-HOSTINGER.md   ← guía de publicación paso a paso
    └── API.md                ← referencia de endpoints
```

---

## 2. Probar en tu PC (XAMPP)

Ya tienes **XAMPP** instalado en `C:\xampp`. Pasos:

### a) Arranca MySQL
Abre **XAMPP Control Panel** y pulsa **Start** en *MySQL*
(o ejecuta `C:\xampp\mysql_start.bat`).

### b) Crea la base de datos e importa los datos

Opción rápida por consola (Git Bash o CMD):

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE geekpoint_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root geekpoint_pos < database/schema.sql
C:\xampp\mysql\bin\mysql.exe -u root geekpoint_pos < database/seed.sql
```

O con **phpMyAdmin** (`http://localhost/phpmyadmin`): crea la BD `geekpoint_pos`,
pestaña *Importar* → `database/schema.sql`, luego otra vez → `database/seed.sql`.

### c) Levanta el servidor de pruebas

```bash
cd "C:\Users\ramir\OneDrive\Desktop\punto de venta"
C:\xampp\php\php.exe -S localhost:8766 dev-server.php
```

### d) Abre la app

<http://localhost:8766/>

> El `dev-server.php` sólo se usa para probar sin Apache: sirve `public_html/`
> como raíz web, igual que Hostinger. En producción no hace falta —
> Apache + los `.htaccess` hacen el ruteo.

### Alternativa: carpeta en `htdocs`
Copia el **contenido** de `public_html/` dentro de `C:\xampp\htdocs\geekpoint\` y abre
`http://localhost/geekpoint/`. `config.js` detecta la ruta automáticamente
(funciona en la raíz del dominio y en subcarpetas).

---

## 3. Cuentas de demostración

Contraseña de todas: **`password`**

| Rol | Correo | Ve / hace |
|---|---|---|
| Administrador General | `admin@geekpoint.mx` | Sucursales, usuarios, inventario y ventas de toda la red |
| Gerente CDMX | `gerente.cdmx@geekpoint.mx` | Productos, cajas, inventario e historial de *su* sucursal |
| Gerente GDL | `gerente.gdl@geekpoint.mx` | Ídem, sucursal Guadalajara |
| Gerente MTY | `gerente.mty@geekpoint.mx` | Ídem, sucursal Monterrey |
| Cajero CDMX | `caja.cdmx@geekpoint.mx` | Módulo POS de la sucursal Reforma |
| Cajero GDL | `caja.gdl@geekpoint.mx` | Módulo POS de la sucursal Chapultepec |
| Cajero MTY | `caja.mty@geekpoint.mx` | Módulo POS de la sucursal Valle |
| Cliente | `cliente@geekpoint.mx` | Cuenta de cliente: perfil, pedidos y reservas |

> **Producción:** cambia estas contraseñas. Genera un hash nuevo con
> `http://localhost/api/tools/hash.php?p=TuNuevaClave` y pégalo en
> `users.password_hash` (phpMyAdmin). Borra o protege `api/tools/` al terminar.

---

## 4. Qué hace cada rol (según el protocolo)

### Administrador General
- Inicio de sesión.
- **CRUD de sucursales** (crear, consultar, editar, activar/desactivar, eliminar).
- **Gestión de usuarios:** registrar gerentes/cajeros y asignarlos a una sucursal.
- **Monitoreo global:** inventarios consolidados y ventas de todas las sedes,
  ranking por sucursal, productos más vendidos, serie de 14 días.

### Gerente de Sede
- Administra **sólo su sucursal**.
- **CRUD de productos** (manga, figuras, TCG, cómics, coleccionables) con categoría,
  precio, IVA y stock mínimo.
- **Control de cajas** (alta y baja).
- **Inventario:** ajuste de existencias (fijar o sumar/restar), alertas de bajo
  stock, historial de movimientos y de ventas, desempeño por cajero.

### Cajero — Módulo POS
- **Búsqueda rápida** por nombre, SKU o categoría (sólo su sucursal).
- **Carrito en tiempo real:** subtotal, IVA (16 % desglosado) y total automáticos.
- **Método de pago:** efectivo (calcula cambio), tarjeta o transferencia.
- **Confirmación** con folio consecutivo por sucursal y **ticket digital** imprimible.
- **Descuento automático de inventario** de la sucursal al cerrar la venta
  (p. ej. de 20 a 17) y registro del movimiento.

### Bilingüe
Toggle **ES / EN** en la barra superior; traduce toda la interfaz al instante y
recuerda la preferencia.

### Tienda (cliente, sin login)
- Hero 3D: tomos, cartas y cajas flotando. Hover = brinco + giro 360° + neón (Wii).
- Grid de catálogo con efecto Tilt 3D y luz dinámica; etiquetas *Novedad* / *Preventa*;
  disponibilidad por sucursal.
- **Vista Previa 3D**: clic en un producto → modal con la pieza que se gira 360°
  (arrastra con el cursor).
- Carrito flotante (drawer) con cantidades y *"Generar cotización"*. Es una compra
  demo: no procesa pagos reales (el protocolo sólo exige el flujo de venta del POS).
- Las portadas vienen de **Jikan / MyAnimeList**. Si el servicio está caído, se usan
  portadas "manga ink" generadas y un aviso lo indica.

---

## 5. Publicar en Hostinger

Ver **[docs/DEPLOY-HOSTINGER.md](docs/DEPLOY-HOSTINGER.md)**.
Resumen: subir **el contenido de `public_html/`** (incluida su carpeta `api/`) a
`public_html/` de Hostinger, crear la BD MySQL en el panel, importar
`schema.sql` + `seed.sql`, y editar `public_html/api/config.php` con los datos de la BD.

---

## 6. Notas técnicas

- **Sin build:** se sube la carpeta tal cual (FTP o Administrador de archivos).
- **Caché:** los `.htaccess` marcan HTML/CSS/JS como *no-cache* y las imágenes a
  1 mes. Los `<script>`/`<link>` llevan `?v=YYYYMMDD`; súbelo cada vez que cambies
  JS/CSS.
- **Seguridad del token:** al iniciar sesión se crea un registro en `sessions` con
  el SHA-256 del token; caduca según `config.php` (`token_ttl_hours`, 12 h por
  defecto).
- **Transacciones:** cada venta bloquea las filas de producto (`SELECT ... FOR
  UPDATE`), valida stock, inserta venta + renglones, descuenta inventario y registra
  el movimiento, todo dentro de una transacción. Si algo falla, `ROLLBACK`.
