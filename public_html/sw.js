/* =============================================================
   GeekPoint — Service Worker (PWA)

   Objetivo: que la app sea instalable y cargue rápido, SIN servir nunca
   datos viejos de inventario, pedidos, usuarios ni sesiones.

   Qué intercepta y cómo:
     · /api/*, /uploads/*, peticiones no-GET, cross-origin (Google Fonts,
       portadas externas, CDNs) y cualquier petición con Authorization o
       Range  ->  NO se tocan: van a la red tal cual, como sin SW.
     · Navegaciones (HTML)  ->  siempre red. Solo si NO hay conexión se
       responde con offline.html (precacheada). Nunca un index.html viejo:
       la app no arranca offline con datos desactualizados ni permite
       operaciones (ventas, apartados, login) que el backend no podría
       sincronizar.
     · Estáticos de la app (js/, lib/, assets/css/, assets/images/):
         - URL versionada (?v=…)  -> stale-while-revalidate: la URL ya
           identifica la versión; al publicar cambios se sube ?v= en
           index.html (convención actual del proyecto).
         - sin versión            -> red primero; la caché solo es respaldo
           si la red falla (misma semántica que el "no-cache" del .htaccess).

   Nunca se guarda una respuesta con Cache-Control no-store/private, ni
   redirecciones, ni algo que no sea un 200 del mismo origen. En desarrollo
   dev-server.php manda no-store en todo, así que el SW no cachea nada y la
   edición en vivo funciona igual que antes.

   Si cambias este archivo, offline.html o los iconos, incrementa SW_VERSION:
   el navegador instala el SW nuevo y se borran las cachés anteriores.
   ============================================================= */
"use strict";

var SW_VERSION = "2026-10-01.1";
var PRECACHE = "gp-precache-" + SW_VERSION;
var RUNTIME = "gp-static-" + SW_VERSION;
var RUNTIME_MAX_ENTRIES = 120;

// Rutas relativas al scope (raíz del dominio o subcarpeta, igual que config.js).
var SCOPE_URL = new URL(self.registration.scope);
var BASE_PATH = SCOPE_URL.pathname;                      // p. ej. "/" o "/tienda/"
var OFFLINE_URL = new URL("offline.html", SCOPE_URL).href;

var PRECACHE_URLS = [OFFLINE_URL];
var STATIC_PREFIXES = ["js/", "lib/", "assets/css/", "assets/images/"];
var BYPASS_PREFIXES = ["api/", "uploads/"];

function noop() {}

function startsWithAny(path, prefixes) {
  for (var i = 0; i < prefixes.length; i++) {
    if (path.indexOf(prefixes[i]) === 0) return true;
  }
  return false;
}

/** Solo respuestas públicas, completas y del mismo origen. */
function isCacheable(res) {
  if (!res || res.status !== 200 || res.type !== "basic" || res.redirected) return false;
  var cc = (res.headers.get("Cache-Control") || "").toLowerCase();
  return cc.indexOf("no-store") === -1 && cc.indexOf("private") === -1;
}

/** Guarda en la caché runtime y poda: 1 entrada por archivo + tope global. */
function putRuntime(request, response) {
  return caches.open(RUNTIME).then(function (cache) {
    return cache.put(request, response).then(function () {
      return cache.keys();
    }).then(function (keys) {
      var path = new URL(request.url).pathname;
      var stale = keys.filter(function (k) {
        return k.url !== request.url && new URL(k.url).pathname === path;   // ?v= anterior
      });
      var rest = keys.filter(function (k) { return stale.indexOf(k) === -1; });
      var overflow = rest.length > RUNTIME_MAX_ENTRIES ? rest.slice(0, rest.length - RUNTIME_MAX_ENTRIES) : [];
      return Promise.all(stale.concat(overflow).map(function (k) { return cache.delete(k); }));
    });
  });
}

/* ---------- ciclo de vida ---------- */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(PRECACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS.map(function (u) { return new Request(u, { cache: "reload" }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) {
        return n.indexOf("gp-") === 0 && n !== PRECACHE && n !== RUNTIME;
      }).map(function (n) { return caches.delete(n); }));
    }).then(function () {
      // Navigation preload: la petición del HTML sale en paralelo al arranque del SW.
      if (self.registration.navigationPreload) return self.registration.navigationPreload.enable();
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---------- estrategias ---------- */
function offlineFallback() {
  return caches.open(PRECACHE).then(function (cache) {
    return cache.match(OFFLINE_URL);
  }).then(function (res) {
    return res || Response.error();
  });
}

function networkOnly(event) {
  return Promise.resolve(event.preloadResponse).then(function (preloaded) {
    return preloaded || fetch(event.request);
  });
}

function handleNavigation(event) {
  return networkOnly(event).catch(offlineFallback);
}

function staleWhileRevalidate(event) {
  var request = event.request;
  var network = fetch(request);
  // El clon se toma ANTES de entregar la respuesta a la página.
  event.waitUntil(network.then(function (res) {
    if (isCacheable(res)) return putRuntime(request, res.clone());
  }).catch(noop));
  return caches.open(RUNTIME).then(function (cache) {
    return cache.match(request);
  }).then(function (cached) {
    return cached || network;
  });
}

function networkFirst(event) {
  var request = event.request;
  var network = fetch(request);
  event.waitUntil(network.then(function (res) {
    if (isCacheable(res)) return putRuntime(request, res.clone());
  }).catch(noop));
  return network.catch(function (err) {
    return caches.open(RUNTIME).then(function (cache) {
      return cache.match(request);
    }).then(function (cached) {
      if (cached) return cached;
      throw err;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("Authorization") || request.headers.has("Range")) return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf(BASE_PATH) !== 0) return;

  var path = url.pathname.slice(BASE_PATH.length);
  var bypass = startsWithAny(path, BYPASS_PREFIXES);

  if (request.mode === "navigate") {
    // API/uploads abiertos en una pestaña: red pura (se usa la respuesta de
    // navigation preload para no pedirlos dos veces), sin caché ni fallback.
    event.respondWith(bypass ? networkOnly(event) : handleNavigation(event));
    return;
  }
  if (bypass) return;

  if (startsWithAny(path, STATIC_PREFIXES)) {
    event.respondWith(url.searchParams.has("v") ? staleWhileRevalidate(event) : networkFirst(event));
  }
});
