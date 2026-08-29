# Publicar GeekPoint POS en Hostinger

Tiempo aproximado: 15–20 minutos. No hace falta compilar nada.

---

## 1. Crear la base de datos

1. Entra a **hPanel → Bases de datos → Bases de datos MySQL**.
2. Crea una base nueva, por ejemplo `uXXXXXX_geekpoint`.
3. Crea un usuario y **asígnalo** a esa base con *todos los privilegios*.
4. Apunta estos 4 datos: **host** (normalmente `localhost`), **nombre de la BD**,
   **usuario** y **contraseña**.

---

## 2. Importar el esquema y los datos

1. En **hPanel → Bases de datos → phpMyAdmin**, abre tu base.
2. Pestaña **Importar** → selecciona `database/schema.sql` → *Continuar*.
3. Pestaña **Importar** otra vez → `database/seed.sql` → *Continuar*.
   *(Omite este paso si no quieres los datos de demostración.)*

---

## 3. Subir los archivos

El proyecto ya trae la carpeta **`public_html/`** lista. Sube **todo su contenido**
al `public_html/` de Hostinger con el **Administrador de archivos** de hPanel
(o FTP / FileZilla). Debe quedar así:

```
public_html/                (raíz web de Hostinger)
├── index.html
├── .htaccess
├── assets/
├── lib/
├── js/
└── api/                    ← la carpeta api/ va DENTRO de public_html/
    ├── index.php
    ├── config.php
    ├── .htaccess
    ├── src/
    └── controllers/
```

> Resultado: la web queda en `https://tudominio.com/` y la API en
> `https://tudominio.com/api/`.  `config.js` deriva la ruta de la API sola
> (raíz del dominio o subcarpeta).

**No subas** (están fuera de `public_html/` a propósito): `database/`, `docs/`,
`dev-server.php`, `README.md` (no estorban, pero no sirven en el hosting).

**Carpeta `api/cache/`:** súbela (aunque esté vacía) y asegúrate de que tenga
permisos de escritura (755 o 775). Ahí se guarda el catálogo de MyAnimeList y las
portadas cacheadas. Hostinger permite salida HTTP con cURL, así que el catálogo real
se genera solo en la primera visita a la tienda.

---

## 4. Configurar la conexión

Edita `public_html/api/config.php` (Administrador de archivos → *Editar*) con los
datos del paso 1:

```php
'db' => [
    'host'    => 'localhost',
    'port'    => 3306,
    'name'    => 'uXXXXXX_geekpoint',
    'user'    => 'uXXXXXX_geekpoint',
    'pass'    => 'TU_CONTRASEÑA',
    'charset' => 'utf8mb4',
],
```

Y cambia el entorno a producción y el origen permitido de CORS:

```php
'cors' => [ 'allowed_origins' => ['https://tudominio.com'] ],
'env'  => 'prod',
```

*(Si la web y la API están en el mismo dominio, CORS ni siquiera se usa, pero es
buena práctica dejarlo puesto.)*

---

## 5. Probar

1. Abre `https://tudominio.com/api/health` → debe responder
   `{"ok":true,"data":{"status":"up","time":"…","db":true}}`.
2. Abre `https://tudominio.com/` → carga la landing.
3. **Acceder al panel** → entra con `admin@geekpoint.mx` / `password`.

Si `health` responde con `"db": false` (o sigue dando 500): la API está bien
desplegada pero **no conecta con MySQL** — revisa las credenciales de
`api/config.php` (en Hostinger el `host` suele ser `localhost`) y que la base
tenga las tablas importadas. La **tienda** funciona igual en ese estado (catálogo
por AniList, sin banner amarillo); solo el **panel** necesita la BD.
Si la web carga pero el login dice *"No hay conexión con la API"*: comprueba que la
carpeta `api/` esté dentro de `public_html/` y que exista `public_html/api/.htaccess`.

---

## 6. Seguridad mínima antes de usarlo de verdad

- [ ] Cambia las contraseñas de todos los usuarios (genera hashes con
      `https://tudominio.com/api/tools/hash.php?p=NuevaClave`, pégalos en
      `users.password_hash` desde phpMyAdmin).
- [ ] **Borra** la carpeta `api/tools/` (o protégela con contraseña en hPanel).
- [ ] Deja `'env' => 'prod'` en `config.php` (oculta los mensajes de error internos).
- [ ] Activa **SSL** (hPanel → SSL) y descomenta el bloque *HTTPS redirect* en
      `public_html/.htaccess`.

---

## 7. Actualizar el sitio más adelante

1. Sube los archivos cambiados.
2. Si tocaste algún `.js` o `.css`, cambia `?v=20260826` por la fecha nueva en
   **`index.html`** (todos los `<link>` y `<script>`). Así el navegador descarga la
   versión nueva y no una cacheada.

---

## Planes sin `.htaccess` (VPS con Nginx)

Los `.htaccess` funcionan en los planes **Single / Premium / Business / Cloud**
(Apache o LiteSpeed). Si usas un **VPS con Nginx**, el `.htaccess` se ignora y hay
que añadir al `server {}` de Nginx:

```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}
location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```
