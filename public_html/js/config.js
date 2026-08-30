/* =============================================================
   Configuración de runtime.  window.__CONFIG__
   ============================================================= */
(function () {
  "use strict";

  /**
   * Detección DINÁMICA de la base de la API — sin rutas fijas persistidas.
   *
   *   file://                     -> null (no hay backend)
   *   localhost / 127.0.0.1       -> http://localhost:8766/api   (dev-server.php)
   *                                  (o origin+/api si la página YA está en :8766)
   *   cualquier otro host (prod)  -> window.location.origin + "/api"
   *
   * Nunca se lee `localStorage.gp_api_base` (una ruta de localhost guardada en
   * un navegador de desarrollo reventaba el sitio en Hostinger → banner amarillo
   * de "servidor caído"). El valor viejo se borra de forma proactiva.
   */
  function deriveApiBase() {
    if (location.protocol === "file:") return null;

    // Limpia cualquier base fija heredada (dev) para que no contamine prod.
    try { localStorage.removeItem("gp_api_base"); } catch (e) {}

    var host = (location.hostname || "").toLowerCase();
    var isLocal = host === "localhost" || host === "127.0.0.1" ||
                  host === "::1" || host === "[::1]";

    if (isLocal) {
      // Override efímero para depurar (?api=...), NO se guarda.
      try {
        var q = new URLSearchParams(location.search).get("api");
        if (q) return q.replace(/\/+$/, "");
      } catch (e) {}
      // El PHP embebido sirve front + API en el mismo puerto; si la página se
      // abre en :8766 (o :80) origin+/api ya es correcto, si no, apunta al :8766.
      if (!location.port || location.port === "8766") return location.origin + "/api";
      return "http://localhost:8766/api";
    }

    // Producción (Hostinger, dominio raíz): ruta relativa al mismo origen.
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
