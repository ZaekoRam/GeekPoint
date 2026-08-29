/* =============================================================
   Configuración de runtime.  window.__CONFIG__
   ============================================================= */
(function () {
  "use strict";

  function deriveApiBase() {
    // 1) override manual (?api=... o localStorage)
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q) { localStorage.setItem("gp_api_base", q); }
      var saved = localStorage.getItem("gp_api_base");
      if (saved) return saved.replace(/\/+$/, "");
    } catch (e) {}

    // 2) file:// → no hay backend posible
    if (location.protocol === "file:") return null;

    // 3) La API vive en  <carpeta del index.html>/api  — funciona tanto si el
    //    sitio está en la raíz del dominio (public_html/) como en una subcarpeta:
    //      "/"                    -> "/api"
    //      "/index.html"          -> "/api"
    //      "/geekpoint/"          -> "/geekpoint/api"
    //      "/geekpoint/index.html"-> "/geekpoint/api"
    var dir = location.pathname.replace(/[^/]*$/, "");   // quita el nombre del archivo
    return location.origin + dir + "api";
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
