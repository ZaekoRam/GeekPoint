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

  /* Fisher-Yates: baraja la lista COMPLETA en el sitio. Se aplica una vez por
     carga de página (en load()), así el Hero 3D y el grid muestran portadas
     distintas en cada refresh, pero el orden se mantiene estable mientras
     navegas entre categorías / buscas. */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
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
      // Galería multi-ángulo: p.images (productos locales) o [p.cover].
      var imgSrc = (p.images && p.images.length) ? p.images : (p.cover ? [p.cover] : []);
      var images = imgSrc.map(function (u) { return fromApi && apiBase ? absUrl(u, apiBase) : u; });
      if (!cover && images.length) cover = images[0];
      var branches = (p.branches && p.branches.length) ? p.branches : synthBranches(p.id);
      var volCovers = (fromApi && p.volume_covers && p.volume_covers.length)
        ? p.volume_covers.map(function (vc) { return { v: String(vc.v), url: absUrl(vc.url, apiBase) }; })
        : [];
      var figurePngRaw = p.figure_png_url || "";
      var figurePng = (fromApi && apiBase && figurePngRaw) ? absUrl(figurePngRaw, apiBase) : figurePngRaw;
      return {
        id: String(p.id),
        title: p.title || "Sin título",
        author: p.author || "",
        category: p.category || "manga",
        price: Number(p.price) || 0,
        tags: p.tags || [],
        rarity: p.rarity || "",            // cartas TCG importadas
        manufacturer: p.manufacturer || "", // figuras: marca / fabricante
        scale: p.scale || "",               // figuras: escala o línea (1/7, Nendoroid…)
        source: p.source || "",            // "local" = producto real del POS
        synopsis: p.synopsis || "",
        volumes: p.volumes || null,
        tomos: p.tomos || p.volumes || null,   // alias: nº de tomos de la serie
        score: p.score || null,
        accent: p.accent || accentFor(p),
        cover: cover,                       // portada real (proxy) o ""
        images: images,                     // galería: fotos reales del producto [url1, url2, …]
        figurePng: figurePng,               // figura/personaje recortado (PNG transparente) para la vista 3D pop-out
        series: p.series || p.title || "",
        search_title: p.search_title || p.series || p.title || "",  // título para MangaDex (romaji)
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

  /* =============================================================
     Agrupado de MANGA por serie.
     Un tomo suelto ("Jujutsu Kaisen Vol. 24", "One Piece Vol. 102"…)
     NUNCA es una tarjeta propia: se pliega dentro de su serie como una
     opción de tomo seleccionable en el modal.  Los CÓMICS quedan intactos
     (siempre productos individuales, sin selector de tomos).
     ============================================================= */
  var VOL_RE = /\s*[-–—:·]?\s*(?:vol\.?|volumen|tomo|t\.|#|n[°º]\.?|no\.?)\s*(\d+(?:\.\d+)?)\s*$/i;

  function seriesTitle(name) {
    return String(name || "").replace(VOL_RE, "").replace(/[\s:–—·-]+$/, "").trim();
  }
  function seriesKey(name) {
    return seriesTitle(name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function volNumber(name) {
    var m = String(name || "").match(VOL_RE);
    return m ? m[1] : null;
  }

  function groupManga(list) {
    var out = [], groups = {}, order = [];

    list.forEach(function (p) {
      if (p.category !== "manga") { out.push(p); return; }
      var key = seriesKey(p.series || p.title);
      if (!key) { out.push(p); return; }

      var g = groups[key];
      if (!g) { g = groups[key] = { base: null, series: "", vols: {} }; order.push(key); }

      var isVol = p.source === "local" || VOL_RE.test(p.title || "");
      if (isVol) {
        var v = volNumber(p.title) || "1";
        var prev = g.vols[v];
        // El tomo LOCAL (stock y precio reales del POS) gana sobre cualquier otro.
        if (!prev || (p.source === "local" && prev.source !== "local")) {
          g.vols[v] = {
            v: String(v),
            url: p.cover || (prev && prev.url) || "",
            price: p.price || (prev && prev.price) || 0,
            id: p.source === "local" ? p.id : ((prev && prev.id) || null),
            branches: (p.branches && p.branches.length) ? p.branches : ((prev && prev.branches) || null),
            source: p.source || (prev && prev.source) || ""
          };
        }
        if (!g.series) g.series = seriesTitle(p.series || p.title);
      } else {
        // Ficha de SERIE (AniList / Jikan): metadatos ricos, es la tarjeta.
        if (!g.base) g.base = p;
        g.series = p.series || p.title;
        (p.volume_covers || []).forEach(function (vc) {
          if (!g.vols[vc.v]) g.vols[vc.v] = { v: String(vc.v), url: vc.url, source: "" };
          else if (!g.vols[vc.v].url) g.vols[vc.v].url = vc.url;
        });
      }
    });

    order.forEach(function (key) {
      var g = groups[key];
      var vols = Object.keys(g.vols).map(function (k) { return g.vols[k]; })
        .sort(function (a, b) { return parseFloat(a.v) - parseFloat(b.v); });

      if (g.base) {
        if (vols.length) g.base.volume_covers = vols;
        g.base.series = g.base.series || g.series || g.base.title;
        out.push(g.base);
        return;
      }

      // Serie sin ficha externa: se sintetiza a partir de sus tomos locales.
      var lead = vols[0] || {};
      var cheapest = vols.reduce(function (m, x) {
        return (x.price && (m === 0 || x.price < m)) ? x.price : m;
      }, 0) || lead.price || 0;
      var topVol = vols.length ? parseInt(vols[vols.length - 1].v, 10) : null;
      out.push({
        id: "series-" + key.replace(/\s+/g, "-"),
        title: g.series || "Manga",
        author: "",
        category: "manga",
        price: cheapest,
        tags: [],
        rarity: "",
        source: "series",
        synopsis: "",
        volumes: topVol || (vols.length || null),
        tomos: topVol || (vols.length || null),
        score: null,
        accent: accentFor({ id: key }),
        cover: lead.url || "",
        series: g.series || "Manga",
        search_title: g.series || "Manga",
        volume_covers: vols,
        branches: lead.branches || [],
        _ink: null
      });
    });

    return out;
  }

  function buildItems(raw, fromApi) { return shuffle(groupManga(normalize(raw, fromApi))); }

  function coverURL(p) {
    if (p.cover) return p.cover;
    if ((p.category === "tcg" || p.category === "comics") && !p._ph) { p._ph = placeholderCover(p); return p._ph; }
    if (!p._ink) p._ink = inkCover(p);
    return p._ink;
  }

  /** Portada de reemplazo (data-URI SVG) para cuando la imagen falla o no existe. */
  var PH_ICON = { tcg: "🃏", comics: "💥", figuras: "🗿", manga: "📚", preventa: "🎫", coleccionables: "🎁" };
  function placeholderCover(x) {
    var kind = typeof x === "string" ? x : ((x && x.category) || "item");
    var title = (x && typeof x === "object" && x.title) ? String(x.title).toUpperCase() : "";
    var accent = (x && typeof x === "object" && x.accent) || (kind === "tcg" ? "#00e5ff" : (kind === "comics" ? "#e4002b" : "#8b5bff"));
    var icon = PH_ICON[kind] || "📦";
    var lines = [], cur = "";
    title.split(/\s+/).forEach(function (w) {
      if ((cur + " " + w).trim().length > 13 && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    lines = lines.slice(0, 3);
    var ty = 590 - (lines.length - 1) * 40;
    var tspans = lines.map(function (l, i) {
      return '<text x="40" y="' + (ty + i * 52) + '" font-family="Anton, Arial Black, sans-serif" font-size="38" fill="#f3efe4">' + xml(l) + '</text>';
    }).join("");
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
        '<defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse">' +
          '<circle cx="3" cy="3" r="2" fill="rgba(255,255,255,.05)"/></pattern></defs>' +
        '<rect width="600" height="800" fill="#111014"/><rect width="600" height="800" fill="url(#p)"/>' +
        '<rect x="18" y="18" width="564" height="764" fill="none" stroke="' + accent + '" stroke-width="10"/>' +
        '<text x="300" y="360" text-anchor="middle" font-size="200">' + icon + '</text>' +
        tspans +
        '<rect x="40" y="712" width="200" height="44" fill="' + accent + '"/>' +
        '<text x="140" y="742" text-anchor="middle" font-family="Bangers, Anton, sans-serif" font-size="24" fill="#0c0c0e" letter-spacing="2">GEEKPOINT</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /** Caja de EXPOSICIÓN VACÍA (SVG data-URI) — fondo de la tarjeta/visor de
      figura. El personaje (figure_png_url) se dibuja ENCIMA, no aquí. */
  function figureBoxURL(p) {
    var accent = (p && p.accent) || "#8b5bff";
    var maker = String((p && (p.manufacturer || p.author)) || "GEEKPOINT COLLECTION")
      .toUpperCase().slice(0, 22);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
        '<defs>' +
          '<linearGradient id="bx" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#191922"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>' +
          '<radialGradient id="sp" cx="50%" cy="30%" r="58%">' +
            '<stop offset="0" stop-color="' + accent + '" stop-opacity=".38"/>' +
            '<stop offset="1" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<rect width="600" height="800" fill="url(#bx)"/>' +
        '<rect width="600" height="800" fill="url(#sp)"/>' +
        '<rect x="26" y="26" width="548" height="748" rx="4" fill="none" stroke="' + accent + '" stroke-width="4" opacity=".85"/>' +
        '<rect x="40" y="40" width="520" height="720" fill="none" stroke="#0c0c0e" stroke-width="10"/>' +
        '<rect x="52" y="112" width="496" height="588" fill="#f4efe6"/>' +
        '<ellipse cx="300" cy="660" rx="150" ry="34" fill="#0c0c0e" opacity=".16"/>' +
        '<ellipse cx="300" cy="652" rx="150" ry="34" fill="none" stroke="' + accent + '" stroke-width="3" opacity=".7"/>' +
        '<rect x="40" y="40" width="520" height="64" fill="' + accent + '"/>' +
        '<text x="60" y="82" font-family="Anton, Arial Black, sans-serif" font-size="28" fill="#0c0c0e" letter-spacing="1">' + xml(maker) + '</text>' +
        '<rect x="40" y="696" width="520" height="64" fill="#0c0c0e" opacity=".82"/>' +
        '<text x="300" y="722" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="16" letter-spacing="2" fill="#efe9d8">SOPORTE 3D &#183; FIGURA NO INCLUIDA</text>' +
        '<text x="300" y="746" text-anchor="middle" font-family="Bangers, Anton, sans-serif" font-size="18" letter-spacing="2" fill="' + accent + '">GEEKPOINT</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function load(force) {
    if (loaded && !force) return loaded;
    var fallback = ((window.__BRAND__ || {}).fallbackCatalog) || [];

    if (!window.API || !API.base) {
      items = buildItems(fallback, false);
      source = "fallback";
      loaded = Promise.resolve(items);
      return loaded;
    }

    loaded = API.get("catalog", { noAuthRedirect: true }).then(function (d) {
      if (d && d.products && d.products.length) {
        items = buildItems(d.products, true);
        source = d.source || "jikan";
      } else {
        items = buildItems(fallback, false);
        source = "fallback";
      }
      return items;
    }).catch(function () {
      items = buildItems(fallback, false);
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
      if (slug === "preventa") {
        return items.filter(function (p) {
          return p.category === "preventa" || (p.tags || []).indexOf("preventa") !== -1;
        });
      }
      return items.filter(function (p) { return p.category === slug; });
    },
    coverURL: coverURL,
    inkCover: inkCover,
    placeholderCover: placeholderCover,
    /** URL del PNG RECORTADO del personaje (fondo transparente) que se aloja
        DENTRO de la caja 3D de exhibición. Es la columna products.figure_png_url;
        si el producto no la trae devuelve "" y la caja se muestra VACÍA
        (nunca una silueta vectorial de reemplazo). */
    figurePngURL: function (p) {
      return (p && p.figurePng) ? p.figurePng : "";
    },
    /** Caja de exposición VACÍA (SVG data-URI) — solo respaldo sin WebGL para el
        visor del modal. El personaje va ENCIMA vía figurePngURL(). */
    figureBoxURL: figureBoxURL,
    /**
     * Carátula estilizada para un TOMO sin arte remoto real (Manhwa/Webtoon
     * cuyas APIs no traen portada por volumen físico).  Muestra la serie y el
     * número de tomo bien grandes; NUNCA duplica el Tomo 1.
     */
    volumePlaceholder: function (p, v) {
      p = p || {};
      var accent = p.accent || accentFor(p);
      var name = String(p.title || p.series || "MANGA").toUpperCase();
      var lines = [], cur = "";
      name.split(/\s+/).forEach(function (w) {
        if ((cur + " " + w).trim().length > 14 && cur) { lines.push(cur); cur = w; }
        else cur = (cur + " " + w).trim();
      });
      if (cur) lines.push(cur);
      lines = lines.slice(0, 2);
      var titleSpans = lines.map(function (l, i) {
        return '<text x="300" y="' + (150 + i * 62) + '" text-anchor="middle" font-family="Anton, Arial Black, sans-serif" ' +
          'font-size="' + (l.length > 11 ? 44 : 56) + '" fill="#f3efe4">' + xml(l) + '</text>';
      }).join("");
      var n = (v == null ? "?" : String(v));
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
          '<defs>' +
            '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0" stop-color="#141420"/><stop offset="1" stop-color="#0b0b12"/></linearGradient>' +
            '<radialGradient id="glow" cx="50%" cy="42%" r="55%">' +
              '<stop offset="0" stop-color="' + accent + '" stop-opacity=".55"/>' +
              '<stop offset="1" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>' +
            '<pattern id="ht" width="18" height="18" patternUnits="userSpaceOnUse">' +
              '<circle cx="3" cy="3" r="1.6" fill="rgba(255,255,255,.05)"/></pattern>' +
          '</defs>' +
          '<rect width="600" height="800" fill="url(#g)"/>' +
          '<rect width="600" height="800" fill="url(#ht)"/>' +
          '<rect width="600" height="800" fill="url(#glow)"/>' +
          '<rect x="18" y="18" width="564" height="764" fill="none" stroke="' + accent + '" stroke-width="9"/>' +
          '<text x="300" y="86" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700" letter-spacing="7" fill="' + accent + '">GEEKPOINT</text>' +
          titleSpans +
          '<text x="300" y="430" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="30" letter-spacing="12" fill="#9a9aa8">VOL.</text>' +
          '<text x="300" y="600" text-anchor="middle" font-family="Anton, Arial Black, sans-serif" font-size="' + (n.length > 2 ? 200 : 240) + '" fill="#f3efe4">' + xml(n) + '</text>' +
          '<rect x="200" y="712" width="200" height="46" fill="' + accent + '"/>' +
          '<text x="300" y="744" text-anchor="middle" font-family="Bangers, Anton, sans-serif" font-size="26" fill="#0c0c0e" letter-spacing="2">TOMO ' + xml(n) + '</text>' +
        '</svg>';
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    },
    /**
     * Mapa de portadas de RESPALDO reales por serie/volumen (para manhwa/webtoon
     * cuyas APIs no cubren todos los tomos).  key = título en minúsculas.
     * Añade más URLs conocidas aquí; se sirven vía proxy /catalog/image.
     */
    coverFallbacks: {
      "solo leveling": {
        // Vol. 1-2 sí están en MangaDex (llegan por volume_covers); se dejan
        // también aquí como respaldo garantizado si el merge de la API falla.
        "1": "catalog/image?src=" + encodeURIComponent("https://uploads.mangadex.org/covers/ade0306c-f4b6-4890-9edb-1ddf04df2039/15af2ca8-7dbc-4305-8142-1b29a5c1cd28.jpg.512.jpg"),
        "2": "catalog/image?src=" + encodeURIComponent("https://uploads.mangadex.org/covers/ade0306c-f4b6-4890-9edb-1ddf04df2039/fe76445d-387f-4ff6-8340-f06403c20dbe.jpg.512.jpg")
      }
    },
    /** URL de respaldo real para (serie, volumen) o "" si no hay. */
    coverFallback: function (seriesName, v) {
      var apiBase = (window.__CONFIG__ || {}).apiBase;
      var map = this.coverFallbacks[String(seriesName || "").toLowerCase().trim()];
      var u = map && map[String(v)];
      return u ? absUrl(u, apiBase) : "";
    },
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
