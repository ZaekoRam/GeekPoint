/* =============================================================
   Vista: Tienda e-commerce.  window.Views.store
   Rutas:  #/   ·   #/cat/:slug
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, $$ = UI.$$, esc = UI.escHTML;

  // Plantilla estática de la tienda ([data-static-store] dentro de [data-app]).
  // Se captura AHORA, al cargar el script (defer, DOM ya parseado): si la
  // primera ruta es interna (#/pos, #/acceso…) el router hace
  // appEl.innerHTML="" y BORRA la plantilla antes del DOMContentLoaded — por
  // eso al volver a la tienda desde el POS salía en blanco.
  var cachedHTML = null;
  function grabTemplate() {
    if (cachedHTML) return;
    var b = $("[data-static-store]");
    if (b) cachedHTML = b.outerHTML;
  }
  grabTemplate();
  document.addEventListener("DOMContentLoaded", grabTemplate);

  function render() {
    grabTemplate();
    return cachedHTML || '<section class="section"><h1>GeekPoint</h1></section>';
  }

  var CATS = [
    { slug: "all", i18n: "cat.all" },
    { slug: "manga", i18n: "cat.manga" },
    { slug: "figuras", i18n: "cat.figuras" },
    { slug: "tcg", i18n: "cat.tcg" },
    { slug: "comics", i18n: "cat.comics" },
    { slug: "preventa", i18n: "cat.preventa" }
  ];

  /* --- ESTADO GLOBAL de la tienda: categoría activa. Sobrevive a los
     re-render por cambio de idioma (langHandler la lee, NO los `params`
     capturados en mount, que quedan obsoletos al navegar). --- */
  var activeSlug = "all";
  var gridRAF = 0;

  function currentCat(params) {
    var c = params && params.cat ? params.cat : "all";
    return CATS.some(function (x) { return x.slug === c; }) ? c : "all";
  }

  function drawCatbar(root, active) {
    var host = $("[data-catbar]", root);
    if (!host) return;
    host.innerHTML = CATS.map(function (c) {
      return '<a class="catbar__btn' + (c.slug === active ? " is-active" : "") + '" href="' +
        (c.slug === "all" ? "#/" : "#/cat/" + c.slug) + '" data-link data-cat="' + c.slug + '">' + esc(I18N.t(c.i18n)) + '</a>';
    }).join("") +
      '<span class="mono" data-catalog-source style="flex-basis:100%;font-size:.68rem;color:var(--muted);letter-spacing:.08em;margin-top:.4rem"></span>';
  }

  /* Actualización OPTIMISTA e instantánea del botón activo (solo alterna la
     clase, sin reconstruir la barra ni tocar el DOM del grid). */
  function setCatbarActive(root, slug) {
    var host = $("[data-catbar]", root);
    if (!host) return;
    $$(".catbar__btn", host).forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-cat") === slug);
    });
  }

  /* Pinta la grilla en el SIGUIENTE frame: el clic de categoría vuelve al
     instante (botón ya resaltado), el render no bloquea la interacción y
     los clics rápidos entre categorías solo pintan el último. */
  function scheduleGrid(root, slug) {
    if (gridRAF) cancelAnimationFrame(gridRAF);
    gridRAF = requestAnimationFrame(function () {
      gridRAF = 0;
      drawGrid(root, slug);
    });
  }

  var searchQ = "";

  function applySearch(list) {
    var q = searchQ.trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (p) {
      return (p.title || "").toLowerCase().indexOf(q) !== -1 ||
             (p.author || "").toLowerCase().indexOf(q) !== -1;
    });
  }

  function drawGrid(root, active) {
    var host = $("[data-pgrid]", root);
    if (!host) return;
    // Aún cargando el catálogo: deja el "cargando", nunca el "categoría vacía".
    if (!Catalog.ready) {
      host.innerHTML = Views._loading ? Views._loading() : "…";
      return;
    }
    var base = Catalog.byCategory(active);
    var list = applySearch(base);
    if (!list.length) {
      var msg = (searchQ.trim() && base.length)
        ? esc(I18N.t("shop.noresults", { q: searchQ.trim() }))
        : esc(I18N.t("shop.empty"));
      // Estado vacío elegante — sin emojis (glifo vectorial de la marca).
      host.innerHTML = '<div class="state">' +
        '<svg class="state__icon" viewBox="0 0 48 48" width="46" height="46" fill="none" ' +
          'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M6 16 24 6l18 10-18 10z"/><path d="M6 16v16l18 10 18-10V16"/><path d="M24 26v16"/>' +
        '</svg>' +
        '<p>' + msg + '</p></div>';
      return;
    }
    host.innerHTML = list.map(cardHTML).join("");
    $$(".pcard", host).forEach(bindCard);
  }

  /* Categoría activa = el estado global de la tienda (sincronizado en
     mount/update). Se prefiere sobre Router.current() para que un re-render
     por idioma o por "catalog:changed" NUNCA reinicie el filtro. */
  function activeCat() {
    return activeSlug;
  }

  /* ---------- Búsqueda animada (lupita expand-width) ---------- */
  function bindSearch(root) {
    var box = $("[data-catsearch]", root);
    if (!box) return;
    var input = $("[data-search-input]", box);
    var toggle = $("[data-search-toggle]", box);
    if (!input || !toggle) return;

    function setOpen(open) {
      box.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function collapseIfEmpty() {
      if (!input.value) setOpen(false);
    }
    function runFilter() {
      searchQ = input.value || "";
      scheduleGrid(root, activeCat());   // rAF-coalesced: no bloquea al teclear
    }

    // Compacto (ventana ≤768px): el CSS deja la barra SIEMPRE abierta y a lo
    // ancho, así que aquí la lupa solo "limpia" y no hay estado que se atore.
    var compactMq = window.matchMedia ? window.matchMedia("(max-width: 768px)") : { matches: false };
    function compact() { return compactMq.matches; }

    // Ancho al ABRIR = justo lo que ocupa la lupa + el texto del placeholder.
    // Se mide el placeholder real (cambia con el idioma) y se guarda en
    // --catsearch-open-w EN .catalog-controls: así el CSS puede a la vez
    // fijar el ancho de la barra abierta y RESERVAR ese hueco a la derecha
    // (padding-right) para que la búsqueda desplegada no tape ninguna
    // categoría (p. ej. "Preventas") en pantallas medianas.
    var controls = box.closest(".catalog-controls") || box.parentNode;
    function fitOpenWidth() {
      if (!box.isConnected) { window.removeEventListener("i18n:change", fitOpenWidth); return; }
      var cs = window.getComputedStyle(input);
      var probe = document.createElement("span");
      probe.style.cssText = "position:absolute;left:-9999px;top:-9999px;white-space:pre;visibility:hidden";
      probe.style.font = cs.font || (cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily);
      probe.style.letterSpacing = cs.letterSpacing;
      probe.textContent = input.getAttribute("placeholder") || "";
      document.body.appendChild(probe);
      var textW = probe.getBoundingClientRect().width;
      probe.remove();
      // lupa 40 + padding izq/der + margen 6 + borde 4
      var pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      if (controls) controls.style.setProperty("--catsearch-open-w", Math.ceil(40 + pad + textW + 6 + 4) + "px");
    }
    fitOpenWidth();
    window.addEventListener("i18n:change", fitOpenWidth);

    toggle.addEventListener("click", function () {
      if (compact()) {                       // barra fija: la lupa solo limpia
        if (input.value) { input.value = ""; searchQ = ""; scheduleGrid(root, activeCat()); }
        input.focus();
        return;
      }
      if (box.classList.contains("is-open")) {
        input.value = "";
        if (searchQ) { searchQ = ""; scheduleGrid(root, activeCat()); }
        setOpen(false);
      } else {
        setOpen(true);
        input.focus();
      }
    });

    // Abrir en :hover (puntero fino, ventana no compacta). No parpadea: la barra
    // flota (position:absolute), al desplegarse no refluye la fila ni cambia de
    // sitio, así que el cursor sigue dentro y no se dispara mouseleave.
    if (UI.fineHover) {
      box.addEventListener("mouseenter", function () { if (!compact()) setOpen(true); });
      box.addEventListener("mouseleave", function () { if (!compact()) collapseIfEmpty(); });
    }
    input.addEventListener("blur", function () { if (!compact()) collapseIfEmpty(); });
    input.addEventListener("input", runFilter);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; searchQ = ""; scheduleGrid(root, activeCat()); setOpen(false); toggle.focus(); }
    });

    if (searchQ) { input.value = searchQ; setOpen(true); }
  }

  /* Rareza TCG -> clase de color distintiva (reusa el sistema .ptag de mangas). */
  function rarityKind(r) {
    r = String(r || "").toLowerCase();
    if (!r) return "";
    if (r.indexOf("secret") !== -1) return "secret";
    if (r.indexOf("special illustration") !== -1) return "special";
    if (r.indexOf("illustration") !== -1) return "illustration";
    if (r.indexOf("rainbow") !== -1 || r.indexOf("hyper") !== -1) return "rainbow";
    if (r.indexOf("gold") !== -1) return "gold";
    if (r.indexOf("amazing") !== -1) return "amazing";
    if (r.indexOf("radiant") !== -1) return "radiant";
    if (r.indexOf("ultra") !== -1 || r.indexOf("vmax") !== -1 || r.indexOf("vstar") !== -1 || /\bv\b/.test(r)) return "ultra";
    if (r.indexOf("double") !== -1) return "double";
    if (r.indexOf("holo") !== -1 || r.indexOf("shiny") !== -1) return "holo";
    if (r.indexOf("promo") !== -1) return "promo";
    if (r.indexOf("uncommon") !== -1) return "uncommon";
    if (r.indexOf("common") !== -1) return "common";
    return "rare";
  }
  function rarityTag(r) {
    if (!r) return "";
    return '<span class="ptag ptag--rare ptag--rare-' + rarityKind(r) + '">' + esc(r) + '</span>';
  }

  /* Etiqueta legible: usa el diccionario ("ptag.novedad" -> "Novedad") y, si no
     hay traducción, capitaliza la etiqueta cruda ("oferta" -> "Oferta"). */
  function tagLabel(t) {
    var s = I18N.t("ptag." + t);
    if (s === "ptag." + t) s = String(t).charAt(0).toUpperCase() + String(t).slice(1);
    return s;
  }

  function discountLabel(p) {
    var pct = Number(p && p.discount_percent) || 0;
    return pct.toFixed(pct % 1 ? 2 : 0);
  }

  function priceHTML(p, from) {
    var list = Number(p && p.price) || 0;
    var effective = Number(p && p.effective_price != null ? p.effective_price : list) || 0;
    var prefix = from ? '<small>' + esc(I18N.t("discount.from")) + '</small> ' : '';
    if (p && p.discount_status === "active" && effective < list) {
      return '<span class="price-stack" aria-label="' + esc(I18N.t("discount.a11y", {
        percent: discountLabel(p), before: UI.money(list), now: UI.money(effective)
      })) + '"><del>' + UI.money(list) + '</del><strong>' + prefix + UI.money(effective) + '</strong></span>';
    }
    return '<span class="price-stack"><strong>' + prefix + UI.money(effective) + '</strong></span>';
  }

  function cardHTML(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<span class="ptag ptag--' + esc(t) + '">' + esc(tagLabel(t)) + '</span>';
    }).join("");
    if (p.rarity) {
      tags = rarityTag(p.rarity) + tags;
    }
    if (p.discount_status === "active") {
      tags += '<span class="ptag promo-badge">−' + discountLabel(p) + '%</span>';
    }
    var totalStock = (p.branches || []).reduce(function (n, b) { return n + (b.stock || 0); }, 0);
    var isFigure = p.category === "figuras";

    // FIGURAS: la portada de la grilla es SIEMPRE el "expositor" — una CAJA 3D
    // de exhibición VACÍA (marco exterior, fondo neutro-oscuro, piso en
    // perspectiva y frente transparente) dibujada por CSS, que ALOJA el PNG
    // recortado del personaje (figure_png_url); éste "despega" hacia arriba al
    // hover, sin recortarse. Las fotos de galería (image_url) NO se usan aquí.
    // Sin PNG => la caja se muestra vacía (nunca una silueta vectorial).
    var media;
    if (isFigure) {
      var figPng = esc(Catalog.figurePngURL(p));
      media =
        '<div class="pcard__media box-card-container" style="--fig-accent:' + esc(p.accent || "#8b5bff") + '">' +
          '<div class="box-3d-display" aria-hidden="true"></div>' +
          (figPng
            ? '<img class="figure-png" src="' + figPng + '" alt="' + esc(p.title) + '" ' +
              'loading="lazy" decoding="async" onerror="this.remove()" />'
            : "") +
          '<div class="pcard__glow"></div>' +
          (tags ? '<div class="pcard__tags">' + tags + '</div>' : "") +
          '<span class="pcard__view">' + esc(I18N.t("prod.view3d")) + ' ↗</span>' +
        '</div>';
    } else {
      media =
        '<div class="pcard__media">' +
          '<img src="' + esc(Catalog.coverURL(p)) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async" />' +
          '<div class="pcard__glow"></div>' +
          (tags ? '<div class="pcard__tags">' + tags + '</div>' : "") +
          '<span class="pcard__view">' + esc(I18N.t("prod.view3d")) + ' ↗</span>' +
        '</div>';
    }
    return (
      '<article class="pcard tilt' + (isFigure ? ' pcard--figure' : '') + '" data-id="' + esc(p.id) + '">' +
        media +
        '<div class="pcard__body">' +
          '<span class="pcard__cat">' + esc(I18N.t("cat." + p.category) || p.category) + '</span>' +
          '<h3 class="pcard__name">' + esc(p.title) + '</h3>' +
          (p.author ? '<span class="pcard__author">' + esc(p.author) + '</span>' : "") +
          '<div class="pcard__foot">' +
            '<span class="pcard__price">' + priceHTML(p, p.price_varies) + '</span>' +
            '<button class="pcard__add" data-add>' + esc(I18N.t("prod.add")) + '</button>' +
          '</div>' +
          '<span class="pcard__stock">' + (totalStock > 0
            ? '<b>' + totalStock + '</b> ' + esc(I18N.t("prod.available")).toLowerCase() + ' ' + (p.branches || []).filter(function(b){return b.stock>0;}).map(function(b){return esc(b.name);}).join(", ")
            : esc(I18N.t("prod.soldout"))) + '</span>' +
        '</div>' +
      '</article>'
    );
  }

  function bindCard(card) {
    var id = card.getAttribute("data-id");
    var isFigure = card.classList.contains("pcard--figure");
    if (UI.fineHover) {
      var glow = $(".pcard__glow", card);
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        // Las figuras NO se inclinan ni escalan (hacían un "pop-out" raro,
        // salían disparadas de la celda); el resto conserva el tilt 3D.
        if (!isFigure) {
          card.style.transform = "perspective(800px) rotateX(" + ((0.5 - py) * 9).toFixed(2) +
            "deg) rotateY(" + ((px - 0.5) * 9).toFixed(2) + "deg) translateY(-4px)";
        }
        if (glow) { glow.style.setProperty("--mx", (px * 100) + "%"); glow.style.setProperty("--my", (py * 100) + "%"); }
      });
      card.addEventListener("mouseout", function (e) {
        if (!isFigure && !card.contains(e.relatedTarget)) card.style.transform = "";
      });
    }
    card.addEventListener("click", function (e) {
      if (e.target.closest("[data-add]")) {
        e.stopPropagation();
        var p = Catalog.get(id);
        if (p) { STORE.shopAdd(p); UI.toast(I18N.t("prod.added") + " · " + p.title, "ok"); }
        return;
      }
      openPreview(id);
    });
  }

  /* ---------------- Modal Vista Previa 3D ---------------- */
  // Respaldo si el listado de sucursales aún no llegó de la BD.
  var STAGE_BRANCHES = [
    { code: "GKP-CDMX", name: "Reforma" },
    { code: "GKP-GDL", name: "Chapultepec" },
    { code: "GKP-MTY", name: "Valle" }
  ];

  /** Sucursales ACTIVAS de la base de datos (tabla `branches`).  Sirven tanto
     para las filas del modal como para las tarjetas de la sección. */
  function activeBranches() {
    var list = (window.Catalog && Catalog.branches) ? Catalog.branches() : [];
    list = list.filter(function (b) { return String(b.status || "active") !== "inactive"; });
    return list.length ? list : STAGE_BRANCHES;
  }

  function hashInt(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }
  /** Stock determinista por tomo y sucursal. */
  function volStock(productId, vol, branchCode) {
    return hashInt(productId + "|v" + vol + "|" + branchCode) % 15;
  }

  function stockRowsHTML(p, vol, volObj) {
    // Stock REAL por sucursal si es un tomo/producto del inventario POS;
    // si no, disponibilidad sintética determinista por tomo.
    var realBranches =
      (volObj && volObj.branches && volObj.branches.length) ? volObj.branches :
      ((p.source === "local" && p.branches && p.branches.length) ? p.branches : null);
    return activeBranches().map(function (b) {
      var n;
      if (realBranches) {
        // Cruce por branch_id (el que trae el producto) y, como respaldo, por code.
        var m = realBranches.filter(function (x) {
          return (b.id != null && String(x.id) === String(b.id)) || (!!x.code && x.code === b.code);
        })[0];
        n = m ? (m.stock || 0) : 0;
      } else {
        n = volStock(p.id, vol, b.code);
      }
      var cls = n === 0 ? "vs-out" : (n <= 3 ? "vs-low" : "vs-ok");
      var label = n === 0 ? esc(I18N.t("prod.soldout")) : (n + " u");
      // En el modal se muestra el nombre corto (sin el prefijo de marca), como
      // en la referencia: "GeekPoint Reforma" -> "Reforma".
      var shortName = String(b.name || "").replace(/^\s*GeekPoint\s+/i, "");
      return '<div class="vs-row" data-name="' + esc(shortName) + '">' +
        '<span>' + esc(shortName) + '</span>' +
        '<span class="vs-n ' + cls + '">' + label + '</span></div>';
    }).join("");
  }

  /* Panel completo de "Stock por sucursal": barra (título + buscador) +
     contenedor con scroll de 3 filas + fila "Continuar". El listado de filas
     lo sigue generando stockRowsHTML() a partir de la BD (sin cambios de
     lógica de datos). */
  function stockPanelHTML(p, vol, volObj) {
    return '' +
      '<div class="vol-stock__bar">' +
        '<p class="vol-stock__h">' + esc(I18N.t("prod.stockByBranch")) + '</p>' +
        '<span class="vs-search">' +
          '<svg class="vs-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>' +
          '<input type="search" class="vs-search__input" data-vs-search autocomplete="off" ' +
            'placeholder="' + esc(I18N.t("branches.search")) + '" ' +
            'aria-label="' + esc(I18N.t("branches.search")) + '">' +
        '</span>' +
      '</div>' +
      '<div class="vs-scroll" data-vs-scroll>' +
        stockRowsHTML(p, vol, volObj) +
        '<button type="button" class="vs-more" data-vs-more hidden>' +
          '<span>' + esc(I18N.t("branches.more")) + '</span>' +
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
            'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M6 9l6 6 6-6"/></svg>' +
        '</button>' +
      '</div>';
  }

  function volOptionsHTML(covers) {
    // Etiqueta LIMPIA "Vol. X" — sin precio por tomo. El precio (el del tomo
    // elegido, o el de la serie) lo muestra y actualiza el <span
    // .preview3d__price[data-price]> vía refresh(); repetirlo en cada <option>
    // sobra y quedaba inconsistente cuando un tomo suelto traía otro precio.
    // Sin data-id/data-price aquí: colisionaban con ese mismo selector.
    return covers.map(function (c, i) {
      return '<option value="' + i + '" data-v="' + esc(c.v) + '">' +
        esc(I18N.t("prod.volume")) + ' ' + esc(c.v) + '</option>';
    }).join("");
  }

  function openPreview(id) {
    var p = Catalog.get(id);
    if (!p) return;

    var isTome = p.category !== "tcg" && p.category !== "figuras";
    var isManga = p.category === "manga";
    var isFigure = p.category === "figuras";
    var meta = [];
    if (isFigure) {
      // Figura: en vez de "Elige tomo" se muestran ficha técnica (marca / escala).
      if (p.manufacturer) meta.push('<span><b>' + esc(I18N.t("prod.manufacturer")) + ':</b> ' + esc(p.manufacturer) + '</span>');
      if (p.scale) meta.push('<span><b>' + esc(I18N.t("prod.scale")) + ':</b> ' + esc(p.scale) + '</span>');
    }
    if (p.author) meta.push('<span><b>' + esc(I18N.t("prod.author")) + ':</b> ' + esc(p.author) + '</span>');
    if (!isFigure && p.volumes) meta.push('<span><b>' + esc(I18N.t("prod.volumes")) + ':</b> ' + p.volumes + '</span>');
    if (p.score) meta.push('<span><b>' + esc(I18N.t("prod.score")) + ':</b> ' + p.score + ' / 10</span>');

    // ---- Selector dinámico de tomos (solo manga) ---------------------------
    // Se genera Vol. 1 … Vol. N leyendo product.tomos (alias de volumes).
    // Los tomos que YA conocemos (locales del POS o portadas de MangaDex)
    // conservan su portada / precio / stock reales.
    var known = {};
    (p.volume_covers || []).forEach(function (c) { known[String(c.v)] = c; });

    var tomos = parseInt(p.tomos || p.volumes, 10);
    if (!(tomos > 0)) {
      tomos = Object.keys(known).reduce(function (m, k) {
        var n = parseInt(k, 10); return n > m ? n : m;
      }, 0) || 3;
    }
    tomos = Math.min(tomos, 300);   // tope defensivo (One Piece ~108, etc.)

    var covers = [];
    for (var v = 1; v <= tomos; v++) {
      covers.push(known[String(v)] || { v: String(v), url: "" });
    }
    // Tomos ENTEROS conocidos fuera del rango 1..N (ej. un Vol. 41 con tomos=40).
    // Se ignoran volúmenes decimales/especiales ("28.5") para un selector limpio.
    Object.keys(known).forEach(function (k) {
      if (/^\d+$/.test(k) && parseInt(k, 10) > tomos) covers.push(known[k]);
    });
    covers.sort(function (a, b) { return parseFloat(a.v) - parseFloat(b.v); });

    var showVolumePicker = isManga && covers.length > 0;
    var startProduct = (covers[0] && covers[0].id) ? covers[0] : p;

    // Galería de fotos reales del producto.
    // Figuras: cualquier nº de fotos + miniatura "Vista 3D" al frente.
    // Resto (manga/cómic): solo si hay >1 imagen (comportamiento previo).
    var gal = isFigure
      ? ((p.images && p.images.length) ? p.images.slice() : [])
      : ((p.images && p.images.length > 1) ? p.images.slice() : []);
    var thumb3dHTML = isFigure
      ? '<button type="button" class="preview3d__thumb preview3d__thumb--3d is-active" data-thumb-3d ' +
        'title="' + esc(I18N.t("prod.view3d")) + '" aria-label="' + esc(I18N.t("prod.view3dTab")) + '">' +
        '<span>3D</span></button>'
      : "";
    var galHTML = (thumb3dHTML || gal.length)
      ? '<div class="preview3d__thumbs" data-thumbs>' + thumb3dHTML + gal.map(function (u, i) {
          return '<button type="button" class="preview3d__thumb' + (!isFigure && i === 0 ? " is-active" : "") +
            '" data-thumb="' + esc(u) + '" aria-label="' + esc(I18N.t("prod.photo")) + ' ' + (i + 1) + '">' +
            '<img src="' + esc(u) + '" alt="" loading="lazy" ' +
            'onerror="this.closest(\'.preview3d__thumb\').style.display=\'none\'"></button>';
        }).join("") + '</div>'
      : "";

    var wrap = document.createElement("div");
    wrap.className = "preview3d";
    wrap.innerHTML =
      '<div class="preview3d__col">' +
        '<div class="preview3d__stage"><canvas data-pv3d></canvas>' +
          '<img class="preview3d__photo" data-pv-photo alt="" hidden>' +
          '<span class="preview3d__hint">' + esc(I18N.t("prod.rotate")) + '</span></div>' +
        galHTML +
      '</div>' +
      '<div>' +
        '<span class="pcard__cat">' + esc(I18N.t("cat." + p.category) || p.category) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<div class="preview3d__meta">' + meta.join("") + '</div>' +
        (showVolumePicker
          ? '<label class="vol-select"><span>' + esc(I18N.t("prod.pickVolume")) + '</span>' +
            '<select class="select" data-vol>' + volOptionsHTML(covers) + '</select></label>'
          : "") +
        '<div class="vol-stock" data-vol-stock>' +
          stockPanelHTML(p, covers[0].v, covers[0]) +
        '</div>' +
        (p.synopsis ? '<p class="preview3d__syn">' + esc(Catalog.synopsis(p, I18N.lang)) + '</p>' : "") +
        '<div class="preview3d__buy">' +
          '<span class="preview3d__price" data-price>' + priceHTML(startProduct, false) + '</span>' +
          '<button class="btn btn--panini" data-buy>' + esc(I18N.t("prod.buy")) + '</button>' +
        '</div>' +
      '</div>';

    UI.modal({ title: I18N.t("prod.view3d"), content: wrap, wide: true, onMount: function () {
      var volSel = wrap.querySelector("[data-vol]");
      var stockBox = wrap.querySelector("[data-vol-stock]");
      var priceEl = wrap.querySelector(".preview3d__price[data-price]");
      var stockQuery = "";   // texto del buscador de sucursales (se conserva entre refresh)

      // Sinopsis: cambia con el idioma aunque el modal siga abierto.
      var synEl = wrap.querySelector(".preview3d__syn");
      var synHandler = function () {
        if (!wrap.isConnected) { window.removeEventListener("i18n:change", synHandler); return; }
        if (synEl) synEl.textContent = Catalog.synopsis(p, I18N.lang);
      };
      window.addEventListener("i18n:change", synHandler);
      // Figuras: spinStage construye una CAJA 3D de exhibición VACÍA y aloja el
      // PNG del personaje dentro (figurePngUrl). initialUrl solo es el respaldo
      // SVG de "caja vacía" para el caso sin WebGL. El resto: portada real.
      var stage = spinStage(wrap.querySelector("[data-pv3d]"), p, {
        initialUrl: isFigure
          ? Catalog.figureBoxURL(p)                      // respaldo sin WebGL (caja vacía)
          : ((gal[0]) || (covers[0] && covers[0].url) || Catalog.coverURL(p)),
        figurePngUrl: isFigure ? Catalog.figurePngURL(p) : ""   // personaje dentro de la caja
      });
      // (coverFor se define abajo; el arranque usa la portada real o la de serie)

      var thumbsEl = wrap.querySelector("[data-thumbs]");
      var photoEl = wrap.querySelector("[data-pv-photo]");
      var canvasEl = wrap.querySelector("[data-pv3d]");
      var hintEl = wrap.querySelector(".preview3d__hint");
      if (thumbsEl) {
        thumbsEl.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-thumb-3d], [data-thumb]");
          if (!btn) return;
          thumbsEl.querySelectorAll(".preview3d__thumb").forEach(function (x) { x.classList.remove("is-active"); });
          btn.classList.add("is-active");

          if (btn.hasAttribute("data-thumb-3d")) {
            // "Vista 3D": vuelve a la Caja 3D interactiva.
            if (photoEl) { photoEl.hidden = true; photoEl.removeAttribute("src"); }
            if (canvasEl) canvasEl.style.visibility = "";
            if (hintEl) hintEl.style.display = "";
            return;
          }

          var url = btn.getAttribute("data-thumb");
          if (isFigure) {
            // Oculta el Canvas 3D y muestra la foto 2D en alta resolución.
            if (photoEl) { photoEl.src = url; photoEl.hidden = false; }
            if (canvasEl) canvasEl.style.visibility = "hidden";
            if (hintEl) hintEl.style.display = "none";
          } else if (stage && stage.setCover) {
            // Manga/cómic: la miniatura cambia la textura de la caja (multi-ángulo).
            stage.setCover(url);
          }
        });
      }

      function selIdx() { return volSel ? (volSel.value | 0) : 0; }
      function currentVol() { return covers[selIdx()] || covers[0] || { v: "1" }; }
      function currentV() { return currentVol().v || "1"; }

      // Imagen para un tomo: (1) su portada real de la API, (2) el mapa de
      // respaldo `cover_fallbacks`, (3) la de la serie para el Vol. 1, o
      // (4) una carátula "VOL. N" distinta para los demás (nunca duplica el Vol. 1).
      function coverFor(c) {
        if (c && c.url) return c.url;
        var fb = Catalog.coverFallback && Catalog.coverFallback(p.search_title || p.series || p.title, c && c.v);
        if (fb) return fb;
        var n = c && parseInt(c.v, 10);
        if (isManga && showVolumePicker && n >= 2 && Catalog.volumePlaceholder) {
          return Catalog.volumePlaceholder(p, c.v);
        }
        return Catalog.coverURL(p);
      }

      /* Buscador + scroll (3 filas) + "Continuar" del panel de sucursales.
         Se re-liga cada vez que refresh() reconstruye el panel. */
      function bindStockPanel() {
        var scrollEl = stockBox.querySelector("[data-vs-scroll]");
        var input = stockBox.querySelector("[data-vs-search]");
        var moreBtn = stockBox.querySelector("[data-vs-more]");
        if (!scrollEl) return;
        var rows = [].slice.call(scrollEl.querySelectorAll(".vs-row"));

        function fold(s) {
          s = String(s || "").toLowerCase();
          return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s;
        }
        function visible() { return rows.filter(function (r) { return !r.hidden; }); }

        function fit() {
          var vis = visible();
          if (vis.length <= 3) { scrollEl.style.maxHeight = ""; return; }
          // Altura = 3 filas completas + la barra "Continuar" fija al pie
          // (se mide destapándola un instante; syncMore() la re-evalúa después).
          var wasHidden = moreBtn && moreBtn.hidden;
          if (moreBtn) moreBtn.hidden = false;
          var top = vis[0].offsetTop, third = vis[2];
          var moreH = moreBtn ? moreBtn.offsetHeight : 0;
          scrollEl.style.maxHeight = Math.ceil(third.offsetTop + third.offsetHeight - top + moreH) + "px";
          if (moreBtn && wasHidden) moreBtn.hidden = true;
        }
        function syncMore() {
          // "Continuar" visible siempre que la lista desborde (más de 3 filas).
          if (moreBtn) moreBtn.hidden = !(scrollEl.scrollHeight - scrollEl.clientHeight > 2);
        }
        function applyFilter() {
          var q = fold(input ? input.value.trim() : "");
          rows.forEach(function (r) {
            r.hidden = !!q && fold(r.getAttribute("data-name")).indexOf(q) === -1;
          });
          scrollEl.scrollTop = 0;
          fit(); syncMore();
        }

        if (input) {
          input.value = stockQuery;
          input.addEventListener("input", function () { stockQuery = input.value; applyFilter(); });
        }
        if (moreBtn) {
          moreBtn.addEventListener("click", function () {
            var atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;
            scrollEl.scrollTo({
              top: atBottom ? 0 : scrollEl.scrollTop + scrollEl.clientHeight,
              behavior: UI.reduced ? "auto" : "smooth"
            });
          });
        }
        applyFilter();   // ajusta altura + "Continuar" (y reaplica la búsqueda previa)
      }

      function refresh() {
        var c = currentVol();
        if (stage && stage.setCover) stage.setCover(coverFor(c));
        if (priceEl) priceEl.innerHTML = priceHTML((c.id ? c : p), false);
        stockBox.innerHTML = stockPanelHTML(p, c.v, c);
        bindStockPanel();
      }
      if (volSel) volSel.addEventListener("change", refresh);
      bindStockPanel();   // liga el panel inicial (refresh() lo re-liga tras cada cambio)

      // Si el listado de sucursales llega de la BD con el modal ya abierto,
      // repinta las filas de "Stock por sucursal".
      var brHandler = function () {
        if (!wrap.isConnected) { window.removeEventListener("branches:changed", brHandler); return; }
        refresh();
      };
      window.addEventListener("branches:changed", brHandler);

      // Portadas oficiales por tomo desde MangaDex: SOLO manga y sólo si hay
      // pocas portadas reales de catálogo (los tomos locales ya traen la suya).
      var artCovers = covers.filter(function (c) { return c.url && !c.id; }).length;
      if (showVolumePicker && volSel && artCovers < 3 && window.Catalog && Catalog.volumeCovers) {
        Catalog.volumeCovers(p.search_title || p.series || p.title).then(function (list) {
          if (!list.length || !volSel.isConnected) return;
          var byV = {};
          covers.forEach(function (c) { byV[c.v] = c; });
          list.forEach(function (vc) {
            var cur = byV[vc.v];
            if (!cur) { byV[vc.v] = { v: String(vc.v), url: vc.url, source: "" }; return; }
            // Rellena si está vacía, o si sólo hereda la portada de SERIE
            // (los tomos sueltos del POS copian p.cover) — la de MangaDex es
            // la portada REAL de ese tomo. No pisa una foto local subida.
            if (!cur.url || cur.url === p.cover || cur.url === Catalog.coverURL(p)) cur.url = vc.url;
          });
          covers = Object.keys(byV).map(function (k) { return byV[k]; })
            .sort(function (a, b) { return parseFloat(a.v) - parseFloat(b.v); });
          p.volume_covers = covers;
          var keepV = currentV();
          volSel.innerHTML = volOptionsHTML(covers);
          for (var i = 0; i < covers.length; i++) {
            if (covers[i].v === keepV) { volSel.value = String(i); break; }
          }
          refresh();
        });
      }

      wrap.querySelector("[data-buy]").addEventListener("click", function () {
        var c = currentVol();
        var item;
        if (c.id) {
          // Tomo REAL del inventario POS (id, precio y stock propios).
          item = { id: c.id, title: p.title + " " + I18N.t("prod.volume") + " " + c.v,
                   price: c.price || p.price, effective_price: c.effective_price != null ? c.effective_price : (c.price || p.effective_price),
                   discount_percent: c.discount_percent || 0, discount_status: c.discount_status || "none",
                   unit_savings: c.unit_savings || 0, cover: c.url || Catalog.coverURL(p) };
        } else if (showVolumePicker) {
          item = { id: p.id + "-v" + c.v, title: p.title + " " + I18N.t("prod.volume") + " " + c.v,
                   price: p.price, effective_price: p.effective_price, discount_percent: p.discount_percent,
                   discount_status: p.discount_status, unit_savings: p.unit_savings, cover: c.url || p.cover };
        } else {
          item = p;
        }
        STORE.shopAdd(item);
        UI.toast(I18N.t("prod.added") + " · " + item.title, "ok");
        UI.closeModal();
        openCartDrawer();
      });

      if (volSel) refresh();
    }});
  }

  /* Contraportada de marca GeekPoint (reverso del tomo/cómic). Cacheada por etiqueta. */
  var _backTex = {};
  function backCoverTexture(label) {
    label = label || "COLLECTOR EDITION";
    if (_backTex[label]) return _backTex[label];
    var c = document.createElement("canvas");
    c.width = 512; c.height = 768;
    var g = c.getContext("2d");
    g.fillStyle = "#0c0c0e"; g.fillRect(0, 0, 512, 768);
    g.fillStyle = "#ffd400"; g.fillRect(40, 300, 432, 150);
    g.fillStyle = "#0c0c0e";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "900 96px Bangers, 'Arial Black', sans-serif";
    g.fillText("GEEKPOINT", 256, 372);
    g.fillStyle = "#efe9d8";
    g.font = "700 22px 'JetBrains Mono', monospace";
    g.fillText(label, 256, 486);
    // código de barras decorativo
    var x = 96;
    g.fillStyle = "#efe9d8";
    while (x < 416) { var bw = 2 + ((x * 7) % 6); g.fillRect(x, 620, bw, 84); x += bw + 3 + ((x * 3) % 4); }
    g.font = "600 18px 'JetBrains Mono', monospace";
    g.fillStyle = "#9a9a9a";
    g.fillText("GKP  9 786074  000000", 256, 726);
    g.strokeStyle = "#ffd400"; g.lineWidth = 8;
    g.strokeRect(16, 16, 480, 736);
    var tex = new THREE.CanvasTexture(c);
    if ("colorSpace" in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    _backTex[label] = tex;
    return tex;
  }

  function spinStage(canvas, p, opts) {
    opts = opts || {};
    if (typeof THREE === "undefined" || !canvas) return null;
    var w = canvas.clientWidth || 260, h = canvas.clientHeight || 340;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      var st = canvas.parentElement;
      if (st) {
        st.style.backgroundImage = "url('" + (opts.initialUrl || Catalog.coverURL(p)) + "')";
        st.style.backgroundSize = "cover";
        st.style.backgroundPosition = "center";
      }
      return null;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    cam.position.set(0, 0, 6);
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    var d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 4, 6); scene.add(d);

    // ---------------------------------------------------------------
    // FIGURAS — misma CAJA DE EXHIBICIÓN 3D interactiva que el Hero y las
    // tarjetas del catálogo (HERO3D.buildDisplayCase): vitrina con panel
    // trasero SÓLIDO de marca GeekPoint, marco exterior, filo de acento y
    // el PNG del personaje DENTRO. Vista por defecto del modal; abajo los
    // thumbnails cambian a las fotos 2D y "3D" vuelve a esta caja.
    // ---------------------------------------------------------------
    if (p.category === "figuras" && window.HERO3D && HERO3D.buildDisplayCase) {
      var built = HERO3D.buildDisplayCase({ W: 2.7, H: 3.3, D: 1.8, accent: p.accent || "#8b5bff" });
      var kase = built.root;
      scene.add(kase);

      var figUrl = opts.figurePngUrl ||
        ((window.Catalog && Catalog.figurePngURL) ? Catalog.figurePngURL(p) : "");
      if (figUrl) built.loadPng(figUrl);

      // Menos luz de relleno (la vitrina lleva su propia luz) + key blanca.
      scene.children.forEach(function (o) {
        if (o.isAmbientLight) o.intensity = 1.0;
        else if (o.isDirectionalLight) o.intensity = 1.1;
      });
      var keyF = new THREE.PointLight(0xffffff, 16, 22);
      keyF.position.set(0, 2.2, 6); scene.add(keyF);

      // Encuadre + leve giro inicial (da volumen a la caja).
      cam.position.set(0, 0.2, 6.2);
      cam.lookAt(0, 0, 0);
      kase.rotation.y = -0.42;

      // Interacción: arrastrar para girar; deriva lenta a MITAD de velocidad.
      var IDLEF = UI.reduced ? 0.0006 : 0.0013;
      var dragF = false, lxF = 0, lyF = 0, vyF = IDLEF, vxF = 0;
      canvas.addEventListener("pointerdown", function (e) { dragF = true; lxF = e.clientX; lyF = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} });
      canvas.addEventListener("pointerup", function () { dragF = false; });
      canvas.addEventListener("pointercancel", function () { dragF = false; });
      canvas.addEventListener("pointermove", function (e) {
        if (!dragF) return;
        vyF = (e.clientX - lxF) * 0.006;
        vxF = (e.clientY - lyF) * 0.006;
        kase.rotation.y += vyF;
        kase.rotation.x = Math.max(-0.5, Math.min(0.5, kase.rotation.x + vxF));
        lxF = e.clientX; lyF = e.clientY;
      });

      (function loopF() {
        if (!canvas.isConnected) { renderer.dispose(); return; }
        requestAnimationFrame(loopF);
        if (!dragF) {
          vyF += (IDLEF - vyF) * 0.04;
          vxF += (0 - vxF) * 0.05;
          kase.rotation.y += vyF;
          kase.rotation.x += vxF + (0 - kase.rotation.x) * 0.03;
        }
        renderer.render(scene, cam);
      })();

      return { setCover: function () {} };
    }

    // (Figuras normalmente ya retornó arriba con su CAJA 3D; solo caen aquí si
    // HERO3D no está disponible — degradan a caja lisa, sin cantos de página.)
    var isTome = p.category !== "tcg" && p.category !== "figuras";
    var isManga = p.category === "manga";
    var kind = p.category === "tcg" ? [1.6, 2.24, 0.05] : [1.55, 2.2, 0.34];
    var geo = new THREE.BoxGeometry(kind[0], kind[1], kind[2]);
    var accent = new THREE.Color(p.accent || "#ffd400");
    // Base OSCURA hasta que carga la textura (evita el "bloque blanco" si la
    // portada tarda/falla); al aplicar la textura se pone a #fff en applyCover.
    var front = new THREE.MeshStandardMaterial({ color: "#20202a", roughness: .5 });

    function edgeMat(repV) {
      if (!isTome || !window.HERO3D || !HERO3D.pageTexture) {
        return new THREE.MeshStandardMaterial({ color: "#e9e4d5", roughness: .9 });
      }
      var t = HERO3D.pageTexture().clone();
      t.needsUpdate = true; t.repeat.set(1, repV || 1);
      return new THREE.MeshStandardMaterial({ map: t, color: "#fff", roughness: .95 });
    }
    // Contraportada con marca GEEKPOINT para todo tomo/cómic (nunca negra vacía).
    // TCG/figuras: cara trasera lisa.
    var backMat = isTome
      ? new THREE.MeshStandardMaterial({
          map: backCoverTexture(isManga ? "MANGA INK EDITION" : "COMIC COLOR EDITION"),
          color: "#ffffff", roughness: .85
        })
      : new THREE.MeshStandardMaterial({ color: "#15151a", roughness: .8 });

    // [+X foreEdge, -X spine, +Y head, -Y tail, +Z front, -Z back]
    var mats = [
      edgeMat(1),
      new THREE.MeshStandardMaterial({ color: accent, roughness: .5 }),
      edgeMat(3),
      edgeMat(3),
      front,
      backMat
    ];
    var mesh = new THREE.Mesh(geo, mats);
    scene.add(mesh);

    // Portada frontal = imagen REAL del tomo seleccionado (sin sellos superpuestos).
    var loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    var reqId = 0;
    function applyCover(url, isRetry) {
      if (!url) return;
      // texURL(): data:/mismo origen o CDN con CORS -> tal cual; AniList u otro
      // CDN sin CORS -> "" (no sirve de textura) -> portada de marca del catálogo.
      var loadUrl = (Catalog.texURL ? Catalog.texURL(url) : url);
      if (!loadUrl) loadUrl = (Catalog.placeholderCover ? Catalog.placeholderCover(p) : url);
      var mine = ++reqId;
      loader.load(loadUrl, function (t) {
        if (mine !== reqId) { t.dispose(); return; }   // llegó una selección más nueva
        if ("colorSpace" in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        if (front.map) front.map.dispose();
        front.map = t; front.color.set("#fff"); front.needsUpdate = true;
      }, undefined, function () {
        // 404 / imagen inválida -> portada estándar del catálogo (data-URI).
        if (isRetry || mine !== reqId) return;
        var fb = Catalog.placeholderCover && Catalog.placeholderCover(p);
        if (fb && fb !== loadUrl) applyCover(fb, true);
      });
    }
    applyCover(opts.initialUrl || Catalog.coverURL(p));

    // Rotación muy lenta y fluida (con easing tras arrastrar) — a MITAD de
    // velocidad para un giro más suave y elegante.
    var IDLE = UI.reduced ? 0.00075 : 0.00175;
    var drag = false, lastX = 0, lastY = 0, velY = IDLE, velX = 0;
    canvas.addEventListener("pointerdown", function (e) { drag = true; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} });
    canvas.addEventListener("pointerup", function () { drag = false; });
    canvas.addEventListener("pointercancel", function () { drag = false; });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      velY = (e.clientX - lastX) * 0.006;
      velX = (e.clientY - lastY) * 0.006;
      mesh.rotation.y += velY; mesh.rotation.x += velX;
      lastX = e.clientX; lastY = e.clientY;
    });

    (function loop() {
      if (!canvas.isConnected) { renderer.dispose(); return; }
      requestAnimationFrame(loop);
      if (!drag) {
        velY += (IDLE - velY) * 0.05;          // vuelve suave a la deriva lenta
        velX += (0 - velX) * 0.05;
        mesh.rotation.y += velY;
        mesh.rotation.x += velX + (0 - mesh.rotation.x) * 0.02;  // se asienta de frente
      }
      renderer.render(scene, cam);
    })();

    return { setCover: applyCover };
  }

  /* ---------------- Sucursales ---------------- */
  /* Carrusel de DESLIZAMIENTO HORIZONTAL (mismo mecanismo en PC y móvil):
     un visor con overflow:hidden y un riel (.branches--track) flex con TODAS
     las tarjetas que se mueve con translateX (sin opacidad, sin apilado
     vertical). Tarjetas por vista: 3 en ≥769px, 1 en ≤768px — el ancho de
     tarjeta lo fija el CSS y el translateX lo calcula el JS midiéndolo.
     Datos: Catalog.branches(). */
  var branchPage = 0;
  var branchSig = null;     // firma del último render del riel (evita repintar de más)
  var branchResizeRAF = 0;  // rAF pendiente del recálculo de translateX al redimensionar

  /* Tarjetas visibles a la vez: 3 en escritorio, 1 en móvil (≤768px). */
  function branchesPerView() {
    return (!window.matchMedia || window.matchMedia("(min-width: 769px)").matches) ? 3 : 1;
  }

  /* Mueve el riel a la página actual. instant=true fija la posición sin
     transición (tras un repintado o un resize); si no, la anima la regla CSS
     `.branches--track { transition: transform .35s ease-in-out }`. */
  function applyBranchTransform(host, instant) {
    var first = host.firstElementChild;
    if (!first) return;
    var cs = getComputedStyle(host);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var step = first.getBoundingClientRect().width + gap;
    var x = "translateX(" + (-branchPage * step) + "px)";
    if (instant) {
      var prev = host.style.transition;
      host.style.transition = "none";
      host.style.transform = x;
      void host.offsetWidth;             // fija la posición sin animar
      host.style.transition = prev;      // "" -> vuelve a la transición de la hoja
    } else {
      host.style.transform = x;
    }
  }

  /* animate=true → aparecen con la animación reveal (primer montaje).
     animate=false → se pintan ya visibles (re-render por idioma / carga BD). */
  function drawBranches(root, animate) {
    var host = $("[data-branches]", root);
    if (!host) return;
    var list = activeBranches().filter(function (b) { return b && (b.code || b.name); });
    if (!list.length) return;                       // nunca dejes la sección vacía

    // Carrusel cuando hay más sedes que tarjetas por vista (3 en PC, 1 en móvil).
    var perView = branchesPerView();
    var many = list.length > perView;
    var maxPage = Math.max(0, list.length - perView);
    if (branchPage > maxPage) branchPage = maxPage;
    if (branchPage < 0) branchPage = 0;

    ensureBranchNav(host, root);
    bindBranchSwipe(host, root);   // gestos táctiles (móvil); se liga una sola vez

    // Modo riel (carrusel) vs. grid normal.
    var wrap = host.closest("[data-branches-carousel]");
    if (wrap) wrap.classList.toggle("is-carousel", many);
    host.classList.toggle("branches--track", many);

    // Se pintan SIEMPRE todas las tarjetas: en modo riel el translateX decide
    // cuáles se ven; en grid (≤3 sedes, o móvil) se apilan/reparten todas.
    var cards = list;
    // La firma incluye TODOS los campos visibles de la tarjeta (no solo code):
    // así, cuando el listado real de la BD llega con dirección/horario/teléfono
    // distintos al respaldo estático, el riel se repinta en lugar de quedarse
    // con los datos de lib/manifest.js.
    var sig = (many ? "track" : "grid") + "@" + cards.map(function (b) {
      return [b.code, b.name, b.city, b.state, b.address, b.phone, b.hours].join("|");
    }).join(",");
    if (sig !== branchSig || !host.children.length) {
      branchSig = sig;
      // En el riel las tarjetas van SIEMPRE visibles (nada de fade); en grid se
      // conserva la animación reveal del primer montaje.
      var cls = "branch reveal" + (many || !animate ? " is-visible" : "");
      host.innerHTML = cards.map(function (b) {
        var place = esc(b.city) + (b.state ? ", " + esc(b.state) : "");
        return (
          '<article class="' + cls + '">' +
            '<span class="branch__code">' + esc(b.code) + '</span>' +
            '<h3>' + esc(b.name) + '</h3>' +
            '<div class="branch__row"><b>' + esc(I18N.t("branches.addr")) + '</b><span>' + esc(b.address) + ', ' + place + '</span></div>' +
            '<div class="branch__row"><b>' + esc(I18N.t("branches.hours")) + '</b><span>' + esc(b.hours) + '</span></div>' +
            '<div class="branch__row"><b>' + esc(I18N.t("branches.phone")) + '</b><span>' + esc(b.phone) + '</span></div>' +
            '<div class="branch__status"><span class="badge badge--ok">' + esc(I18N.t("status.active")) + '</span></div>' +
          '</article>'
        );
      }).join("");
    }

    if (many) applyBranchTransform(host, true);   // fija la página sin animar
    else host.style.transform = "";               // grid normal: sin desplazamiento

    updateBranchNav(host, list.length, maxPage, many);
  }

  /* Estructura del carrusel (una sola vez):
       [data-branches-carousel]        position:relative, NO recorta -> flechas visibles
         └ [data-branches-viewport]    overflow:hidden cuando .is-carousel (el visor)
             └ .branches               el riel flex (.branches--track)
       + 2 botones ‹ › como hijos directos del wrapper.
     NO se tocan las clases ni el CSS de .branch. */
  function ensureBranchNav(host, root) {
    var wrap = host.closest("[data-branches-carousel]");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.setAttribute("data-branches-carousel", "");
      wrap.style.position = "relative";
      host.parentNode.insertBefore(wrap, host);
      var vp = document.createElement("div");
      vp.setAttribute("data-branches-viewport", "");
      wrap.appendChild(vp);
      vp.appendChild(host);
    }
    if (wrap.querySelector("[data-branch-nav]")) return;

    ["prev", "next"].forEach(function (dir) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-branch-nav", dir);
      var en = String(I18N.lang || "es").slice(0, 2).toLowerCase() === "en";
      btn.setAttribute("aria-label", dir === "prev"
        ? (en ? "Previous branches" : "Sucursales anteriores")
        : (en ? "Next branches" : "Sucursales siguientes"));
      btn.innerHTML = dir === "prev"
        ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>'
        : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
      // Sin left/right aquí: los pone el CSS (responsive: -18px en PC, -4px en móvil).
      btn.style.cssText = "position:absolute;top:50%;" +
        "transform:translateY(-50%);width:44px;height:44px;padding:0;border-radius:50%;" +
        "display:none;place-items:center;cursor:pointer;z-index:3;" +
        "background:var(--paper-2);color:var(--ink);border:3px solid var(--ink);" +
        "box-shadow:4px 4px 0 var(--ink);";
      btn.addEventListener("click", function () {
        slideBranches(root, dir);
      });
      wrap.appendChild(btn);
    });
  }

  /* Slide horizontal PURO: sólo cambia la página y anima el translateX del riel
     (la curva la da el CSS). Sin opacidad y sin repintar el DOM -> el
     movimiento es continuo; la tarjeta que sale empuja a la que entra. */
  function slideBranches(root, dir) {
    var host = $("[data-branches]", root);
    if (!host) return;
    var perView = branchesPerView();
    var total = activeBranches().filter(function (b) { return b && (b.code || b.name); }).length;
    var maxPage = Math.max(0, total - perView);
    var next = branchPage + (dir === "prev" ? -1 : 1);
    if (next < 0 || next > maxPage) return;          // ya está en el extremo
    branchPage = next;
    applyBranchTransform(host, false);               // translateX animado (.35s ease-in-out)
    updateBranchNav(host, total, maxPage, total > perView);
  }

  /* Gestos táctiles del carrusel — SÓLO móvil (1 tarjeta por vista).
     · Pointer Events (unifican touch/mouse/pen) sobre el visor.
     · Se distingue swipe horizontal de scroll vertical comparando |dx| vs |dy|:
       si el gesto es más vertical, se suelta y la página hace scroll normal.
     · Arrastre en vivo (translateX sigue al dedo, con "goma" en los extremos);
       al soltar, si |dx| ≥ 50px cambia de sucursal (izq = siguiente, der =
       anterior) reutilizando slideBranches() -> el índice queda sincronizado
       con el de las flechas. Por debajo del umbral, vuelve a su sitio animado.
     · En escritorio (≥769px) el handler sale de inmediato: cero cambios. */
  function bindBranchSwipe(host, root) {
    var vp = host.closest("[data-branches-viewport]");
    if (!vp || vp.__swipeBound) return;
    vp.__swipeBound = true;

    var THRESHOLD = 50;   // px de arrastre para confirmar cambio de tarjeta
    var LOCK = 8;         // px para decidir si el gesto es horizontal o vertical
    var startX = 0, startY = 0, dx = 0, dy = 0;
    var active = false, dragging = false, baseX = 0, pid = null;

    function stepPx() {
      var first = host.firstElementChild;
      if (!first) return 0;
      var cs = getComputedStyle(host);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function total() {
      return activeBranches().filter(function (b) { return b && (b.code || b.name); }).length;
    }
    function swipeable() {
      return branchesPerView() === 1 && host.classList.contains("branches--track");
    }

    vp.addEventListener("pointerdown", function (e) {
      if (!swipeable()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      active = true; dragging = false;
      startX = e.clientX; startY = e.clientY; dx = 0; dy = 0;
      pid = e.pointerId;
      var m = /translateX\(\s*(-?[0-9.]+)px/.exec(host.style.transform || "");
      baseX = m ? parseFloat(m[1]) : 0;
    });

    vp.addEventListener("pointermove", function (e) {
      if (!active || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;

      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > LOCK) { active = false; return; }  // es scroll vertical
        if (Math.abs(dx) <= LOCK) return;
        dragging = true;
        host.classList.add("is-dragging");                 // quita la transición: sigue al dedo
        try { vp.setPointerCapture(pid); } catch (err) {}
      }

      var max = 0, min = -Math.max(0, total() - 1) * stepPx();
      var x = baseX + dx;
      if (x > max) x = max + (x - max) * 0.35;             // goma en los extremos
      else if (x < min) x = min + (x - min) * 0.35;
      host.style.transform = "translateX(" + x + "px)";
      if (e.cancelable) e.preventDefault();
    });

    function endGesture(e) {
      if (!active || (e && e.pointerId !== pid)) return;
      active = false;
      try { vp.releasePointerCapture(pid); } catch (err) {}
      if (!dragging) return;
      dragging = false;
      host.classList.remove("is-dragging");               // vuelve la transición .35s

      var before = branchPage;
      if (dx <= -THRESHOLD) slideBranches(root, "next");
      else if (dx >= THRESHOLD) slideBranches(root, "prev");
      if (branchPage === before) applyBranchTransform(host, false);   // subumbral o extremo -> regresa animado
    }
    vp.addEventListener("pointerup", endGesture);
    vp.addEventListener("pointercancel", endGesture);
  }

  function updateBranchNav(host, total, maxPage, many) {
    var wrap = host.closest("[data-branches-carousel]");
    if (!wrap) return;
    $$("[data-branch-nav]", wrap).forEach(function (btn) {
      var dir = btn.getAttribute("data-branch-nav");
      btn.style.display = many ? "grid" : "none";           // ≤3 sucursales → sin botones
      var atEnd = dir === "prev" ? branchPage <= 0 : branchPage >= maxPage;
      btn.disabled = atEnd;
      btn.style.opacity = atEnd ? "0.35" : "1";
      btn.style.pointerEvents = atEnd ? "none" : "auto";
    });
  }

  function reveals(root) {
    var els = $$(".reveal", root);
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.04 });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)", root).forEach(function (e) {
        if (e.getBoundingClientRect().top < innerHeight + 200) e.classList.add("is-visible");
      });
    }, 6000);
  }

  function setSourceNote(root) {
    var el = $("[data-catalog-source]", root);
    if (!el) return;
    var map = { fallback: "shop.source.fallback", jikan: "shop.source.jikan", anilist: "shop.source.anilist" };
    var key = map[Catalog.source] || "";
    el.textContent = key ? ("· " + I18N.t(key)) : "";
  }

  /* ---------------- montaje ---------------- */
  var heroPickHandler = null;

  function mount(root, params) {
    activeSlug = currentCat(params);          // sincroniza el estado global
    branchPage = 0;                           // el carrusel arranca en la 1ª sucursal
    branchSig = null;                         // fuerza el primer render de sucursales
    I18N.apply(root);
    drawCatbar(root, activeSlug);
    bindSearch(root);
    drawBranches(root, true);
    // El listado real de sucursales llega de la BD; al resolver, se repinta
    // (ya visible, sin animación) para activar el carrusel si hay más de 3.
    if (window.Catalog && Catalog.loadBranches) {
      Catalog.loadBranches().then(function () { drawBranches(root, false); });
    }

    var grid = $("[data-pgrid]", root);
    if (grid) {
      grid.innerHTML = Views._loading ? Views._loading() : "…";
      // Fallback de imagen: si una portada falla (404 / URL rota) se pinta un
      // placeholder limpio con ícono, sin romper el contenedor.
      if (!grid.__phBound) {
        grid.__phBound = true;
        grid.addEventListener("error", function (e) {
          var img = e.target;
          if (!img || img.tagName !== "IMG" || img.__ph) return;
          // Figuras: si el PNG del personaje falla, se retira y queda la CAJA 3D
          // vacía como portada (nunca una silueta/placeholder de reemplazo).
          if (img.classList && img.classList.contains("figure-png")) { img.remove(); return; }
          img.__ph = true;
          var card = img.closest(".pcard");
          var p = card && Catalog.get(card.getAttribute("data-id"));
          img.src = Catalog.placeholderCover(p || "item");
        }, true);
      }
    }

    Catalog.load().then(function () {
      var repriced = STORE.shopReconcile(Catalog.all());
      if (repriced) UI.toast(I18N.t("discount.cartUpdated", { n: repriced }), "warn");
      // Al resolver, pinta la categoría ACTUAL (el usuario pudo navegar durante
      // la carga) — no la capturada al montar.
      drawGrid(root, activeSlug);
      setSourceNote(root);
      var canvas = $("[data-hero3d]", root);
      if (canvas && window.HERO3D) UI.safe(function () { HERO3D.start(canvas); });
    });

    reveals(root);

    heroPickHandler = function (e) { openPreview(e.detail.id); };
    window.addEventListener("hero:pick", heroPickHandler);

    var langHandler = function () {
      // Conserva la categoría activa a través del re-render por idioma:
      // se lee el ESTADO GLOBAL, no los `params` capturados al montar.
      var keep = activeSlug;
      if (gridRAF) { cancelAnimationFrame(gridRAF); gridRAF = 0; }   // evita doble render
      UI.safe(function () { I18N.apply(root); }, "i18n.apply");
      UI.safe(function () { drawCatbar(root, keep); }, "drawCatbar");
      UI.safe(function () { drawGrid(root, keep); }, "drawGrid");
      branchSig = null;   // las etiquetas cambian de idioma -> re-render forzado
      UI.safe(function () { drawBranches(root, false); }, "drawBranches");
      UI.safe(function () { setSourceNote(root); }, "setSourceNote");
      activeSlug = keep;   // restablece por si algún paso lo tocara
    };
    window.addEventListener("i18n:change", langHandler);

    // El catálogo cambió (alta/edición/baja desde el panel) -> redibuja YA.
    var catalogHandler = function () { UI.safe(function () { drawGrid(root, activeCat()); }, "drawGrid.catChange"); };
    window.addEventListener("catalog:changed", catalogHandler);

    // Las sucursales cambiaron (llegó la respuesta de la BD) -> repinta tarjetas.
    var branchesHandler = function () { UI.safe(function () { drawBranches(root, false); }, "drawBranches.change"); };
    window.addEventListener("branches:changed", branchesHandler);

    // Al redimensionar cambia el ancho de tarjeta y puede cruzarse el corte de
    // 768/769px (1 <-> 3 por vista): se recalcula todo (drawBranches está
    // protegido por firma, así que sólo repinta si de verdad cambió).
    var resizeHandler = function () {
      if (branchResizeRAF) return;
      branchResizeRAF = requestAnimationFrame(function () {
        branchResizeRAF = 0;
        UI.safe(function () { drawBranches(root, false); }, "drawBranches.resize");
      });
    };
    window.addEventListener("resize", resizeHandler);

    root.__cleanup = function () {
      if (gridRAF) { cancelAnimationFrame(gridRAF); gridRAF = 0; }
      if (branchResizeRAF) { cancelAnimationFrame(branchResizeRAF); branchResizeRAF = 0; }
      window.removeEventListener("hero:pick", heroPickHandler);
      window.removeEventListener("i18n:change", langHandler);
      window.removeEventListener("catalog:changed", catalogHandler);
      window.removeEventListener("branches:changed", branchesHandler);
      window.removeEventListener("resize", resizeHandler);
      if (window.HERO3D) HERO3D.destroy();
    };
  }

  /**
   * Cambio de categoría SIN reconstruir el hero 3D.
   * Navegación fluida: el botón activo se marca AL INSTANTE (optimista) y la
   * grilla se re-pinta en el siguiente frame, sin congelar el clic.
   */
  function update(root, params) {
    var active = currentCat(params);
    var changed = active !== activeSlug;
    activeSlug = active;

    setCatbarActive(root, active);        // 1) UI instantánea
    scheduleGrid(root, active);           // 2) datos/render en segundo plano

    // 3) scroll al catálogo solo si de verdad hace falta (no re-dispara el
    //    smooth-scroll cuando ya estás en la sección).
    var target = document.getElementById("catalogo");
    if (target && changed) {
      var y = target.getBoundingClientRect().top + scrollY - 80;
      if (Math.abs(scrollY - y) > 8) {
        window.scrollTo({ top: y, behavior: UI.reduced ? "auto" : "smooth" });
      }
    }
  }

  function openCartDrawer() {
    var d = $("[data-cart-drawer]"), b = $("[data-cart-backdrop]");
    if (d) d.classList.add("is-open");
    if (b) b.classList.add("is-open");
  }

  /* ---------------------------------------------------------------
     Feedback premium en los CTA de compra: onda (ripple) al pulsar
     y "pop" elástico al soltar.  Un único listener delegado para
     "Agregar", "Generar cotización" y el botón de compra del modal.
     --------------------------------------------------------------- */
  (function bindCtaFeedback() {
    var SEL = ".pcard__add, [data-cart-quote], .preview3d [data-buy], .resv-form button[type=\"submit\"]";
    function cta(target) {
      return target && target.closest ? target.closest(SEL) : null;
    }
    document.addEventListener("pointerdown", function (e) {
      if (UI.reduced) return;
      var btn = cta(e.target);
      if (!btn || btn.disabled) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2.4;
      var ink = document.createElement("span");
      ink.className = "cta-ripple";
      ink.style.width = ink.style.height = size + "px";
      ink.style.left = (e.clientX - r.left) + "px";
      ink.style.top = (e.clientY - r.top) + "px";
      btn.appendChild(ink);
      setTimeout(function () { ink.parentNode && ink.parentNode.removeChild(ink); }, 560);
    }, true);
    document.addEventListener("click", function (e) {
      if (UI.reduced) return;
      var btn = cta(e.target);
      if (!btn || btn.disabled) return;
      btn.classList.remove("is-pop");
      void btn.offsetWidth;                 // reinicia la animación
      btn.classList.add("is-pop");
      setTimeout(function () { btn.classList.remove("is-pop"); }, 420);
    }, true);
  })();

  window.Views.store = { render: render, mount: mount, update: update, isPublic: true };
})();
