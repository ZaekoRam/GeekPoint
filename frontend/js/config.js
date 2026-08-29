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

    // 3) servido por HTTP: la API vive junto a /frontend/  →  ../api
    var path = location.pathname;
    var marker = "/frontend/";
    var idx = path.indexOf(marker);
    if (idx !== -1) {
      return location.origin + path.slice(0, idx) + "/api";
    }
    // 4) frontend en la raíz del dominio → /api
    return location.origin + "/api";
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
