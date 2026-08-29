/* =============================================================
   Configuración de runtime.  window.__CONFIG__
   ============================================================= */
(function () {
  "use strict";

  function isDevHost() {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.+\.local)$/i.test(location.hostname || "");
  }
  function isSameOrigin(url) {
    try { return new URL(url, location.href).origin === location.origin; }
    catch (e) { return false; }
  }

  function deriveApiBase() {
    // file:// → no hay backend posible
    if (location.protocol === "file:") return null;

    // Base RELATIVA a la carpeta del index.html. fetch() la resuelve contra el
    // documento, así que funciona igual en local y en Hostinger, en la raíz del
    // dominio o en una subcarpeta, y sin riesgo de contenido mixto (http/https):
    //   "/"                     -> "/api"
    //   "/index.html"           -> "/api"
    //   "/geekpoint/"           -> "/geekpoint/api"
    //   "/geekpoint/index.html" -> "/geekpoint/api"
    var dir = location.pathname.replace(/[^/]*$/, "");   // quita el nombre del archivo
    var relative = (dir + "api").replace(/\/{2,}/g, "/");

    // Override manual (?api=... o localStorage) SOLO en desarrollo o si apunta al
    // mismo origen. Evita que un "gp_api_base = http://localhost:8766/api"
    // guardado en un navegador de desarrollo rompa el sitio en producción.
    try {
      var dev = isDevHost();
      var q = new URLSearchParams(location.search).get("api");
      if (q && (dev || isSameOrigin(q))) {
        localStorage.setItem("gp_api_base", q);
      }
      var saved = localStorage.getItem("gp_api_base");
      if (saved) {
        if (dev || isSameOrigin(saved)) return saved.replace(/\/+$/, "");
        localStorage.removeItem("gp_api_base");   // valor de otro origen en prod → se descarta
      }
    } catch (e) {}

    return relative;
  }

  window.__CONFIG__ = {
    apiBase: deriveApiBase(),
    version: "1.0.0",
    buildDate: "2026-08-26",
    currency: "MXN",
    locale: { es: "es-MX", en: "en-US" }
    // Pokémon TCG se consume vía el proxy PHP /api/pokemon/* ; la API key
    // (opcional) se configura en api/config.php -> integrations.pokemontcg_key
  };
})();
