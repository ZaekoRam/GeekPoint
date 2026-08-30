/* =============================================================
   Cliente HTTP de la API REST.  window.API
   ============================================================= */
(function () {
  "use strict";

  var base = (window.__CONFIG__ || {}).apiBase;
  var online = null; // null = desconocido, true/false conocido

  function setOnline(v) {
    if (online === v) return;
    online = v;
    window.dispatchEvent(new CustomEvent("api:status", { detail: { online: v } }));
  }

  function token() {
    return (window.STORE && STORE.session && STORE.session.token) || null;
  }

  function ApiError(message, status, data) {
    this.name = "ApiError";
    this.message = message || "Error de red";
    this.status = status || 0;
    this.data = data || null;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function request(method, path, body, opts) {
    opts = opts || {};
    if (!base) {
      return Promise.reject(new ApiError("no_api_base", 0, null));
    }
    var url = base + "/" + String(path).replace(/^\/+/, "");
    var isForm = (typeof FormData !== "undefined") && (body instanceof FormData);
    var headers = { "Accept": "application/json" };
    // multipart: NO fijar Content-Type (el navegador pone el boundary).
    if (body !== undefined && body !== null && !isForm) headers["Content-Type"] = "application/json";
    var tk = token();
    if (tk) headers["Authorization"] = "Bearer " + tk;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || 12000);

    return fetch(url, {
      method: method,
      headers: headers,
      body: isForm ? body : (body != null ? JSON.stringify(body) : undefined),
      signal: ctrl.signal,
      cache: "no-store"
    }).then(function (res) {
      clearTimeout(timer);
      setOnline(true);
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) {}
        if (!res.ok || (json && json.ok === false)) {
          var msg = (json && (json.message || json.error)) || ("HTTP " + res.status);
          throw new ApiError(msg, res.status, json);
        }
        return json ? (json.data != null ? json.data : json) : null;
      });
    }).catch(function (err) {
      clearTimeout(timer);
      if (err instanceof ApiError) {
        if (err.status === 401 && !opts.noAuthRedirect) {
          window.dispatchEvent(new CustomEvent("api:unauthorized"));
        }
        throw err;
      }
      // Error de red / abort / DNS
      setOnline(false);
      throw new ApiError("network_error", 0, null);
    });
  }

  var API = {
    get base() { return base; },
    // Se ajusta en memoria; NO se persiste (evita arrastrar una ruta fija de
    // localhost a producción). La base la deriva config.js en cada carga.
    setBase: function (b) { base = b ? b.replace(/\/+$/, "") : null; },
    get isOnline() { return online; },
    request: request,
    get: function (p, opts) { return request("GET", p, null, opts); },
    post: function (p, body, opts) { return request("POST", p, body, opts); },
    /** Subida de archivo (multipart). `formData` debe ser un FormData. */
    upload: function (p, formData, opts) {
      return request("POST", p, formData, opts || { timeout: 30000 });
    },
    put: function (p, body, opts) { return request("PUT", p, body, opts); },
    patch: function (p, body, opts) { return request("PATCH", p, body, opts); },
    del: function (p, opts) { return request("DELETE", p, null, opts); },
    health: function () {
      // "up" = el backend respondió ALGO (incluso 4xx/5xx por MySQL). Solo
      // status 0 (red/DNS/CORS/timeout) cuenta como caído → banner amarillo.
      // En producción la base es SIEMPRE el mismo origen (/api), así que un
      // /api/health que responde no debe disparar el banner.
      function ping(timeout) {
        return request("GET", "health", null, { timeout: timeout, noAuthRedirect: true })
          .then(function () { return true; })
          .catch(function (err) { return !!(err && err.status && err.status > 0); });
      }
      // Un reintento antes de dar por caído (hosting compartido puede tardar en
      // "despertar" en la primera petición).
      return ping(8000).then(function (up) { return up ? true : ping(6000); });
    },
    ApiError: ApiError
  };

  window.API = API;
})();
