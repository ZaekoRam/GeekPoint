/* =============================================================
   Catálogo de la tienda.  window.Catalog
   Fuente: /api/catalog (Jikan / MyAnimeList) con respaldo local.
   ============================================================= */
(function () {
  "use strict";

  var items = [];
  var source = "pending";
  var loaded = null;

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  var BRANCHES = [
    { code: "GKP-CDMX", name: "Reforma" },
    { code: "GKP-GDL",  name: "Chapultepec" },
    { code: "GKP-MTY",  name: "Valle" }
  ];

  function synthBranches(id) {
    var seed = hash(String(id));
    var out = [];
    BRANCHES.forEach(function (b, i) {
      var stock = (seed >> (i * 3)) % 16;
      if (stock > 0 || i === 0) out.push({ code: b.code, name: b.name, stock: stock });
    });
    return out;
  }

  var CAT_LABEL = { manga: "MANGA", figuras: "FIGURA", tcg: "TCG", comics: "CÓMIC", preventa: "PREVENTA" };

  function xml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Portada "manga ink" generada como data-URI SVG. */
  function inkCover(p) {
    var accent = p.accent || "#ffd400";
    var title = (p.title || "GeekPoint").toUpperCase();
    var words = title.split(/\s+/);
    var lines = [], cur = "";
    words.forEach(function (w) {
      if ((cur + " " + w).trim().length > 12 && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    lines = lines.slice(0, 4);
    var startY = 300 - (lines.length - 1) * 34;
    var tspans = lines.map(function (l, i) {
      return '<text x="40" y="' + (startY + i * 62) + '" font-family="Anton, Arial Black, sans-serif" ' +
        'font-size="' + (l.length > 9 ? 40 : 52) + '" fill="#0c0c0e">' + xml(l) + '</text>';
    }).join("");

    var cat = CAT_LABEL[p.category] || "GEEK";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
        '<defs>' +
          '<pattern id="ht" width="12" height="12" patternUnits="userSpaceOnUse">' +
            '<circle cx="3" cy="3" r="2" fill="rgba(12,12,14,.18)"/></pattern>' +
        '</defs>' +
        '<rect width="600" height="800" fill="#f3efe4"/>' +
        '<rect width="600" height="800" fill="url(#ht)"/>' +
        '<polygon points="0,0 600,0 600,150 0,320" fill="' + accent + '"/>' +
        '<polygon points="0,0 600,0 600,150 0,320" fill="none" stroke="#0c0c0e" stroke-width="6"/>' +
        // speed lines
        '<g stroke="#0c0c0e" stroke-width="3" opacity=".55">' +
          '<line x1="600" y1="800" x2="380" y2="470"/><line x1="600" y1="720" x2="330" y2="470"/>' +
          '<line x1="540" y1="800" x2="300" y2="500"/><line x1="600" y1="620" x2="360" y2="450"/>' +
        '</g>' +
        '<rect x="16" y="16" width="568" height="768" fill="none" stroke="#0c0c0e" stroke-width="10"/>' +
        '<text x="40" y="90" font-family="JetBrains Mono, monospace" font-size="22" font-weight="700" ' +
          'letter-spacing="6" fill="#0c0c0e">' + xml(cat) + '</text>' +
        tspans +
        '<text x="40" y="' + (startY + lines.length * 62 + 6) + '" font-family="Inter, sans-serif" ' +
          'font-size="20" fill="#45454d">' + xml(p.author || "GeekPoint") + '</text>' +
        '<rect x="40" y="700" width="180" height="44" fill="#0c0c0e"/>' +
        '<text x="130" y="729" text-anchor="middle" font-family="Bangers, Anton, sans-serif" ' +
          'font-size="26" fill="#ffd400" letter-spacing="2">GEEKPOINT</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function absUrl(u, apiBase) {
    if (!u) return "";
    if (/^https?:/i.test(u)) return u;
    return apiBase ? (apiBase.replace(/\/+$/, "") + "/" + u.replace(/^\/+/, "")) : u;
  }

  function normalize(raw, fromApi) {
    var apiBase = (window.__CONFIG__ || {}).apiBase;
    return raw.map(function (p) {
      var cover = "";
      if (fromApi && p.cover && apiBase) cover = absUrl(p.cover, apiBase);
      var branches = (p.branches && p.branches.length) ? p.branches : synthBranches(p.id);
      var volCovers = (fromApi && p.volume_covers && p.volume_covers.length)
        ? p.volume_covers.map(function (vc) { return { v: String(vc.v), url: absUrl(vc.url, apiBase) }; })
        : [];
      return {
        id: String(p.id),
        title: p.title || "Sin título",
        author: p.author || "",
        category: p.category || "manga",
        price: Number(p.price) || 0,
        tags: p.tags || [],
        synopsis: p.synopsis || "",
        volumes: p.volumes || null,
        score: p.score || null,
        accent: p.accent || accentFor(p),
        cover: cover,                       // portada real (proxy) o ""
        series: p.series || p.title || "",
        volume_covers: volCovers,          // [{v, url}] portadas oficiales por tomo
        branches: branches,
        _ink: null
      };
    });
  }

  function accentFor(p) {
    var pal = ["#8b5bff", "#ff2d95", "#00e5ff", "#0b8a3d", "#ffd400", "#e4002b"];
    return pal[hash(String(p.id || p.title || "x")) % pal.length];
  }

  function coverURL(p) {
    if (p.cover) return p.cover;
    if (!p._ink) p._ink = inkCover(p);
    return p._ink;
  }

  function load(force) {
    if (loaded && !force) return loaded;
    var fallback = ((window.__BRAND__ || {}).fallbackCatalog) || [];

    if (!window.API || !API.base) {
      items = normalize(fallback, false);
      source = "fallback";
      loaded = Promise.resolve(items);
      return loaded;
    }

    loaded = API.get("catalog", { noAuthRedirect: true }).then(function (d) {
      if (d && d.products && d.products.length) {
        items = normalize(d.products, true);
        source = d.source || "jikan";
      } else {
        items = normalize(fallback, false);
        source = "fallback";
      }
      return items;
    }).catch(function () {
      items = normalize(fallback, false);
      source = "fallback";
      return items;
    });
    return loaded;
  }

  window.Catalog = {
    load: load,
    all: function () { return items.slice(); },
    get source() { return source; },
    get: function (id) { return items.filter(function (p) { return p.id === String(id); })[0] || null; },
    byCategory: function (slug) {
      if (!slug || slug === "all") return items.slice();
      if (slug === "preventa") return items.filter(function (p) { return (p.tags || []).indexOf("preventa") !== -1; });
      return items.filter(function (p) { return p.category === slug; });
    },
    coverURL: coverURL,
    inkCover: inkCover,
    /** Portadas oficiales por tomo (MangaDex) para una serie. -> Promise<[{v,url}]> */
    volumeCovers: function (name) {
      if (!window.API || !API.base || !name) return Promise.resolve([]);
      var apiBase = (window.__CONFIG__ || {}).apiBase;
      return API.get("catalog/covers?q=" + encodeURIComponent(name), { noAuthRedirect: true })
        .then(function (d) {
          return (d && d.covers || []).map(function (vc) { return { v: String(vc.v), url: absUrl(vc.url, apiBase) }; });
        })
        .catch(function () { return []; });
    }
  };
})();
