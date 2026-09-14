/* =============================================================
   Catálogo de la tienda.  window.Catalog
   Fuente ÚNICA: nuestro API PHP local  GET /api/catalog  (que lee de
   MySQL `products` + caché local + fallback PHP).  El navegador NUNCA
   consulta AniList / Jikan / MangaDex directamente — no hay CORS ni
   dependencia de APIs externas al navegar. Si el API no responde, se
   usa el respaldo estático de lib/manifest.js (window.__BRAND__).
   ============================================================= */
(function () {
  "use strict";

  var items = [];
  var source = "pending";
  var loaded = null;
  var ready = false;   // true en cuanto load() resuelve (aunque sea al fallback)

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

  /* =============================================================
     Sucursales dinámicas — leídas de la tabla `branches` vía
     GET /api/catalog/branches. Fuente ÚNICA para las 3 zonas de la
     tienda que antes usaban un arreglo fijo de 3 sedes:
       · tarjetas "Nuestras sucursales en México"
       · filas "Stock por sucursal" del modal de producto
       · <select> "Sucursal para recoger" del apartado
     Si el API no responde se usa el respaldo estático de
     lib/manifest.js (window.__BRAND__.branches).
     ============================================================= */
  var DEFAULT_HOURS = "Lun–Dom 11:00–21:00";
  var branchItems = null;      // último listado resuelto (array) o null
  var branchesPromise = null;  // promesa en curso / resuelta

  /** Respaldo estático normalizado al mismo shape que la BD. */
  function brandBranches() {
    return (((window.__BRAND__ || {}).branches) || []).map(function (b) {
      return {
        id: b.id != null ? b.id : null,
        code: b.code || "",
        name: b.name || "",
        city: b.city || "",
        state: b.state || "",
        address: b.address || "",
        phone: b.phone || "",
        hours: b.hours || "",
        status: b.status || "active"
      };
    });
  }

  /** `hours` no existe como columna en `branches`: se completa desde el
      respaldo estático (por `code`) o con un horario por defecto. */
  function withHours(list) {
    var brand = brandBranches();
    return list.map(function (b) {
      if (b.hours) return b;
      var m = brand.filter(function (x) { return x.code === b.code; })[0];
      var copy = {};
      for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) copy[k] = b[k];
      copy.hours = (m && m.hours) || DEFAULT_HOURS;
      return copy;
    });
  }

  function normalizeBranchRow(r) {
    return {
      id: r.id != null ? Number(r.id) : null,
      code: r.code || "",
      name: r.name || "",
      city: r.city || "",
      state: r.state || "",
      address: r.address || "",
      phone: r.phone || "",
      hours: r.hours || "",
      status: r.status || "active"
    };
  }

  /**
   * Carga (una sola vez) el listado de sucursales activas desde la BD.
   * @param force  vuelve a pedirlo aunque ya haya una respuesta en memoria.
   * @return Promise<Array>
   */
  function loadBranches(force) {
    if (branchesPromise && !force) return branchesPromise;

    if (!window.API || !API.base) {
      branchItems = withHours(brandBranches());
      branchesPromise = Promise.resolve(branchItems);
      return branchesPromise;
    }

    branchesPromise = API.get("catalog/branches", { noAuthRedirect: true })
      .then(function (d) {
        var rows = (d && d.branches && d.branches.length) ? d.branches : null;
        branchItems = withHours(rows ? rows.map(normalizeBranchRow) : brandBranches());
        window.dispatchEvent(new CustomEvent("branches:changed"));
        return branchItems;
      })
      .catch(function () {
        branchItems = withHours(brandBranches());
        return branchItems;
      });
    return branchesPromise;
  }

  /** Listado SÍNCRONO: el ya resuelto de la BD o, si aún no llega, el respaldo. */
  function branchList() {
    return (branchItems && branchItems.length) ? branchItems.slice() : withHours(brandBranches());
  }

  function xml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function absUrl(u, apiBase) {
    if (!u) return "";
    // URLs absolutas y data:/blob: se devuelven TAL CUAL (no se les antepone
    // la base del API — antes un data-URI quedaba como ".../api/data:image/…").
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
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
        ? p.volume_covers.map(function (vc) {
            var copy = {};
            for (var key in vc) if (Object.prototype.hasOwnProperty.call(vc, key)) copy[key] = vc[key];
            copy.v = String(vc.v);
            copy.url = absUrl(vc.url, apiBase);
            return copy;
          })
        : [];
      var figurePngRaw = p.figure_png_url || "";
      var figurePng = (fromApi && apiBase && figurePngRaw) ? absUrl(figurePngRaw, apiBase) : figurePngRaw;
      return {
        id: String(p.id),
        title: p.title || "Sin título",
        author: p.author || "",
        category: p.category || "manga",
        price: Number(p.price) || 0,
        effective_price: p.effective_price != null ? Number(p.effective_price) : (Number(p.price) || 0),
        unit_savings: Number(p.unit_savings) || 0,
        discount_percent: Number(p.discount_percent) || 0,
        discount_starts_at: p.discount_starts_at || null,
        discount_ends_at: p.discount_ends_at || null,
        discount_status: p.discount_status || "none",
        price_varies: !!p.price_varies,
        tags: p.tags || [],
        // Rareza SOLO para cartas TCG y solo si es una etiqueta corta ("Rare",
        // "Ultra Rare"…). Evita que una sinopsis mal parseada en el backend
        // (p. ej. One Piece: "…tesoro legendario…") salga como cartel en la card.
        rarity: (p.category === "tcg" && p.rarity && String(p.rarity).length <= 30) ? String(p.rarity) : "",
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
        _ph: null
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

  /* Una misma serie llega con varios nombres (romaji / inglés / con subtítulo).
     Se colapsan a UNA sola clave -> UNA sola tarjeta (evita "Demon Slayer" +
     "Kimetsu no Yaiba" + "Demon Slayer: Kimetsu no Yaiba" por separado). */
  var SERIES_ALIAS = {
    "kimetsu no yaiba": "demon slayer",
    "demon slayer kimetsu no yaiba": "demon slayer",
    "shingeki no kyojin": "attack on titan",
    "boku no hero academia": "my hero academia",
    "hagane no renkinjutsushi": "fullmetal alchemist",
    "sousou no frieren": "frieren beyond journey s end",
    "jojo no kimyou na bouken": "jojo s bizarre adventure"
  };

  /* Nombre con el que MangaDex encuentra TODOS los tomos (su título inglés a
     veces sólo trae 1 portada). key = título de la tarjeta en minúsculas. */
  var MANGADEX_Q = {
    "attack on titan": "Shingeki no Kyojin",
    "my hero academia": "Boku no Hero Academia",
    "demon slayer": "Kimetsu no Yaiba"
  };
  function mangadexQuery(title) {
    return MANGADEX_Q[String(title || "").toLowerCase().trim()] || String(title || "");
  }

  /* Sinopsis en INGLÉS por serie. La ES ya viene del API (`p.synopsis`) y le
     gusta al usuario; esto es solo el texto que se muestra con el idioma EN.
     key = clave canónica de serie (seriesKey). */
  var SYN_EN = {
    "attack on titan": "Humanity lives behind enormous walls to hide from man-eating Titans. When a Colossal Titan smashes the outer wall, Eren Yeager swears to wipe every Titan from the earth.",
    "berserk": "Guts, the Black Swordsman, roams a brutal dark-fantasy world with a sword bigger than himself, hunting the demonic God Hand and the friend who betrayed him.",
    "bleach": "Ichigo Kurosaki gains the powers of a Soul Reaper and must defend the living from corrupt spirits while guiding the dead to the afterlife.",
    "blue lock": "Three hundred strikers are locked in a facility for a ruthless program built to forge Japan's most lethal egoist and its next World Cup star.",
    "chainsaw man": "Broke devil hunter Denji fuses with his pet devil Pochita to become Chainsaw Man, and is caught between factions who all want to use his power.",
    "dandadan": "Momo believes in ghosts, Okarun in aliens. Both turn out to be right, so the two team up against the paranormal while slowly falling for each other.",
    "death note": "Genius student Light Yagami finds a notebook that kills anyone whose name is written in it, and sets out to become the god of a new world.",
    "demon slayer": "After a demon slaughters his family and turns his sister into one, Tanjiro Kamado joins the Demon Slayer Corps to change her back and take revenge.",
    "frieren beyond journey s end": "Elf mage Frieren outlives her hero party by decades and sets out on a new journey to finally understand the people she never made time to know.",
    "fullmetal alchemist": "Brothers Edward and Alphonse Elric break alchemy's laws trying to revive their mother, and now chase the Philosopher's Stone to restore their bodies.",
    "haikyu": "Short but explosive, Shoyo Hinata joins Karasuno High's volleyball club and, with prodigy setter Kageyama, fights to reach the national stage.",
    "hunter x hunter": "Gon Freecss sets out to become a Hunter and find the father who left him, meeting fierce friends and deadly dangers across a vast world.",
    "jujutsu kaisen": "Yuji Itadori swallows a cursed finger and shares his body with the fearsome curse Ryomen Sukuna, joining sorcerers who fight to protect humanity.",
    "kaguya sama love is war": "Two student-council prodigies are in love but too proud to admit it, so each schemes to make the other confess first — courtship as all-out war.",
    "my hero academia": "In a world where almost everyone has a superpower, Quirkless Izuku Midoriya inherits the strength of the greatest hero and enrolls at U.A. High.",
    "naruto": "Naruto Uzumaki, a young ninja with a nine-tailed fox sealed inside him, chases recognition and his dream of leading his village as Hokage.",
    "one piece": "Monkey D. Luffy sets sail with his crew to find the legendary treasure One Piece and become the King of the Pirates.",
    "oshi no ko": "A doctor is reborn as the child of his favorite idol and grows up navigating the dark side of show business, fame and revenge.",
    "spy x family": "A master spy, a skilled assassin and a telepathic girl pose as a family, each hiding the truth from the others to keep a fragile peace.",
    "tokyo ghoul": "College student Ken Kaneki survives a ghoul attack and wakes up a half-ghoul, forced to live between two worlds that both want him dead.",
    "vinland saga": "Raised among Viking raiders, Thorfinn lives only to avenge his father — until slavery and loss set him searching for a life beyond violence."
  };

  function seriesTitle(name) {
    return String(name || "").replace(VOL_RE, "").replace(/[\s:–—·-]+$/, "").trim();
  }
  function seriesKey(name) {
    var k = seriesTitle(name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return SERIES_ALIAS[k] || k;
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

      // Es un TOMO si el título lleva marcador de volumen ("Vol. 41", "#12",
      // "Tomo 3"). Un producto local SIN ese marcador (fila de serie MNG-S-*)
      // es la FICHA de serie, igual que una ficha externa — así conserva su
      // sinopsis, autor y nº de tomos.
      var isVol = VOL_RE.test(p.title || "");
      if (isVol) {
        var v = volNumber(p.title) || "1";
        var prev = g.vols[v];
        // El tomo LOCAL (stock y precio reales del POS) gana sobre cualquier otro.
        if (!prev || (p.source === "local" && prev.source !== "local")) {
          g.vols[v] = {
            v: String(v),
            url: p.cover || (prev && prev.url) || "",
            price: p.price || (prev && prev.price) || 0,
            effective_price: p.effective_price != null ? p.effective_price : (p.price || (prev && prev.effective_price) || 0),
            unit_savings: p.unit_savings || 0,
            discount_percent: p.discount_percent || 0,
            discount_status: p.discount_status || "none",
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
        var pricedVolumes = vols.filter(function (v) {
          return v.id && Number(v.effective_price != null ? v.effective_price : v.price) > 0;
        });
        if (pricedVolumes.length) {
          var cheapestVolume = pricedVolumes.reduce(function (best, v) {
            var value = Number(v.effective_price != null ? v.effective_price : v.price);
            var bestValue = Number(best.effective_price != null ? best.effective_price : best.price);
            return value < bestValue ? v : best;
          });
          g.base.price = Number(cheapestVolume.price) || 0;
          g.base.effective_price = Number(cheapestVolume.effective_price != null
            ? cheapestVolume.effective_price : cheapestVolume.price) || 0;
          g.base.unit_savings = Number(cheapestVolume.unit_savings) || 0;
          g.base.discount_percent = Number(cheapestVolume.discount_percent) || 0;
          g.base.discount_status = cheapestVolume.discount_status || "none";
          g.base.price_varies = pricedVolumes.some(function (v) {
            return Math.abs(Number(v.effective_price != null ? v.effective_price : v.price) - g.base.effective_price) >= 0.01;
          });
        }
        // Consulta MangaDex con el nombre que trae TODOS los tomos.
        g.base.search_title = mangadexQuery(g.base.series || g.base.title);
        out.push(g.base);
        return;
      }

      // Serie sin ficha externa: se sintetiza a partir de sus tomos locales.
      var lead = vols[0] || {};
      var cheapest = vols.reduce(function (m, x) {
        var ep = x.effective_price != null ? x.effective_price : x.price;
        return (ep && (m === 0 || ep < m)) ? ep : m;
      }, 0) || lead.price || 0;
      var topVol = vols.length ? parseInt(vols[vols.length - 1].v, 10) : null;
      out.push({
        id: "series-" + key.replace(/\s+/g, "-"),
        title: g.series || "Manga",
        author: "",
        category: "manga",
        price: lead.price || cheapest,
        effective_price: cheapest,
        unit_savings: lead.unit_savings || 0,
        discount_percent: lead.discount_percent || 0,
        discount_status: lead.discount_status || "none",
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
        search_title: mangadexQuery(g.series || "Manga"),
        volume_covers: vols,
        branches: lead.branches || [],
        _ph: null
      });
    });

    return out;
  }

  function buildItems(raw, fromApi) { return shuffle(groupManga(normalize(raw, fromApi))); }

  function coverURL(p) {
    // La API SIEMPRE manda `cover`/`image_url` (real, /uploads o generado en
    // PHP). El placeholder solo es una red de seguridad si algo llegara vacío
    // — SIN la caja de acento con texto ("manga ink") que se eliminó.
    if (p.cover) return p.cover;
    if (!p._ph) p._ph = placeholderCover(p);
    return p._ph;
  }

  /** Portada de reemplazo (data-URI SVG) para cuando la imagen falla o no existe.
      Glifo vectorial de "imagen" (NUNCA un emoji ni un cuadro roto). */
  function placeholderCover(x) {
    var kind = typeof x === "string" ? x : ((x && x.category) || "item");
    var title = (x && typeof x === "object" && x.title) ? String(x.title).toUpperCase() : "";
    var accent = (x && typeof x === "object" && x.accent) || (kind === "tcg" ? "#00e5ff" : (kind === "comics" ? "#e4002b" : "#8b5bff"));
    var icon =
      '<g transform="translate(300,300)" fill="none" stroke="' + accent + '" stroke-width="9" stroke-linejoin="round">' +
        '<rect x="-120" y="-96" width="240" height="192" rx="12"/>' +
        '<circle cx="-58" cy="-34" r="24"/>' +
        '<path d="M-120 64 L-34 -18 L26 42 L64 12 L120 72 L120 96 L-120 96 Z" fill="' + accent + '" fill-opacity=".18"/>' +
      '</g>';
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
        icon +
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

  /**
   * @param force  ignora la promesa en memoria y vuelve a pedir /catalog
   *               (el server ya mezcla los productos locales al instante).
   * @param hard   además pide ?refresh=1 → el server reconstruye desde las
   *               APIs externas. Solo para el botón "Reintentar" / un refresco
   *               manual; NO se usa tras un alta/edición de producto.
   */
  function load(force, hard) {
    if (loaded && !force) return loaded;
    loadBranches(force);   // calienta el listado de sucursales en paralelo
    var fallback = ((window.__BRAND__ || {}).fallbackCatalog) || [];

    if (!window.API || !API.base) {
      items = buildItems(fallback, false);
      source = "fallback";
      ready = true;
      loaded = Promise.resolve(items);
      return loaded;
    }

    loaded = API.get(hard ? "catalog?refresh=1" : "catalog", { noAuthRedirect: true, timeout: hard ? 25000 : 12000 }).then(function (d) {
      var raw = (d && d.products && d.products.length) ? d.products.slice() : null;
      if (raw) {
        // Defensa: si el API respondió pero SIN mangas, completa con el
        // respaldo estático (títulos no repetidos). Así la tienda nunca se
        // queda sin catálogo de mangas.
        if (!raw.some(function (p) { return p && p.category === "manga"; })) {
          var have = {};
          raw.forEach(function (p) { have[String(p.title || "").toLowerCase()] = 1; });
          fallback.forEach(function (p) {
            if (!have[String(p.title || "").toLowerCase()]) raw.push(p);
          });
        }
        items = buildItems(raw, true);
        source = d.source || "local";
      } else {
        items = buildItems(fallback, false);
        source = "fallback";
      }
      ready = true;
      return items;
    }).catch(function () {
      items = buildItems(fallback, false);
      source = "fallback";
      ready = true;
      return items;
    });
    return loaded;
  }

  window.Catalog = {
    load: load,
    /** Refresco DURO: fuerza al server a reconstruir desde las APIs externas. */
    refresh: function () { loaded = null; return load(true, true); },
    /** Carga (memoizada) del listado de sucursales activas desde la BD. */
    loadBranches: loadBranches,
    /** Listado SÍNCRONO de sucursales activas (BD o respaldo estático). */
    branches: branchList,
    all: function () { return items.slice(); },
    /** true en cuanto hay datos (reales o de respaldo) para pintar la grilla. */
    get ready() { return ready; },
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
    /** Sinopsis según idioma: EN usa el mapa SYN_EN (si existe la serie),
        el resto (ES incl.) usa la del API. Cae a la del API si no hay match. */
    synopsis: function (p, lang) {
      if (!p) return "";
      if (String(lang || "").slice(0, 2).toLowerCase() === "en") {
        var k = seriesKey(p.series || p.title || "");
        if (SYN_EN[k]) return SYN_EN[k];
      }
      return p.synopsis || "";
    },
    placeholderCover: placeholderCover,
    /**
     * URL utilizable como TEXTURA WebGL (hero 3D / visor del modal).
     *
     * Una textura con crossOrigin="anonymous" necesita que el servidor de la
     * imagen mande `Access-Control-Allow-Origin`. Reglas (verificado 2026-08-30):
     *   · data: / blob: / mismo origen (/uploads, /api, /assets)  -> tal cual
     *   · Wikimedia / Wikipedia / Scryfall / pokemontcg.io        -> tal cual
     *     (mandan `Access-Control-Allow-Origin: *`, una petición menos)
     *   · s4.anilist.co, MangaDex, MAL (SIN CORS)                 -> vía proxy
     *     propio `/api/catalog/image?src=` (mismo origen + CORS *).  El proxy
     *     purga cualquier basura de buffer y NO reutiliza la caché vieja
     *     corrupta de Hostinger (prefijo `imgc_`).
     *   · sin apiBase (file://)                                   -> "" (no hay
     *     forma de servirla; quien llama usa `placeholderCover`).
     *
     * El <img> de la GRILLA nunca pasa por aquí: carga el CDN directo (no
     * necesita CORS).
     */
    texURL: function (url) {
      url = String(url || "");
      if (!url) return "";
      if (/^(data:|blob:)/i.test(url)) return url;
      try { if (new URL(url, location.href).origin === location.origin) return url; } catch (e) {}
      if (/^https?:\/\/([a-z0-9-]+\.)*(wikimedia\.org|wikipedia\.org|scryfall\.com|scryfall\.io|pokemontcg\.io)\//i.test(url)) {
        return url;                                   // CDN con CORS -> directo
      }
      if (url.indexOf("catalog/image?src=") !== -1) return url;   // ya proxied
      var apiBase = (window.__CONFIG__ || {}).apiBase;
      if (!apiBase) return "";
      return apiBase.replace(/\/+$/, "") + "/catalog/image?src=" + encodeURIComponent(url);
    },
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
