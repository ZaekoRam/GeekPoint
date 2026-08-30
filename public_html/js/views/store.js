/* =============================================================
   Vista: Tienda e-commerce.  window.Views.store
   Rutas:  #/   ·   #/cat/:slug
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, $$ = UI.$$, esc = UI.escHTML;

  var cachedHTML = null;
  document.addEventListener("DOMContentLoaded", function () {
    var b = $("[data-static-store]");
    if (b && !cachedHTML) cachedHTML = b.outerHTML;
  });

  function render() {
    if (!cachedHTML) {
      var b = $("[data-static-store]");
      if (b) cachedHTML = b.outerHTML;
    }
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

    toggle.addEventListener("click", function () {
      if (box.classList.contains("is-open")) {
        input.value = "";
        if (searchQ) { searchQ = ""; scheduleGrid(root, activeCat()); }
        setOpen(false);
      } else {
        setOpen(true);
        input.focus();
      }
    });

    // Hover abre en dispositivos con puntero fino; en móvil manda el clic.
    if (UI.fineHover) {
      box.addEventListener("mouseenter", function () { setOpen(true); });
      box.addEventListener("mouseleave", collapseIfEmpty);
    }
    input.addEventListener("blur", collapseIfEmpty);
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

  function cardHTML(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<span class="ptag ptag--' + esc(t) + '">' + esc(I18N.t("ptag." + t)) + '</span>';
    }).join("");
    if (p.rarity) {
      tags = rarityTag(p.rarity) + tags;
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
            '<span class="pcard__price">' + UI.money(p.price) + '</span>' +
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
  var STAGE_BRANCHES = [
    { code: "GKP-CDMX", name: "Reforma" },
    { code: "GKP-GDL", name: "Chapultepec" },
    { code: "GKP-MTY", name: "Valle" }
  ];

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
    return STAGE_BRANCHES.map(function (b) {
      var n;
      if (realBranches) {
        var m = realBranches.filter(function (x) { return x.code === b.code; })[0];
        n = m ? (m.stock || 0) : 0;
      } else {
        n = volStock(p.id, vol, b.code);
      }
      var cls = n === 0 ? "vs-out" : (n <= 3 ? "vs-low" : "vs-ok");
      var label = n === 0 ? esc(I18N.t("prod.soldout")) : (n + " u");
      return '<div class="vs-row"><span>' + esc(b.name) + '</span><span class="vs-n ' + cls + '">' + label + '</span></div>';
    }).join("");
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
    var startPrice = (covers[0] && covers[0].id && covers[0].price) || p.price;

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
          '<p class="vol-stock__h">' + esc(I18N.t("prod.stockByBranch")) + '</p>' +
          stockRowsHTML(p, covers[0].v, covers[0]) +
        '</div>' +
        (p.synopsis ? '<p class="preview3d__syn">' + esc(p.synopsis) + '</p>' : "") +
        '<div class="preview3d__buy">' +
          '<span class="preview3d__price" data-price>' + UI.money(startPrice) + '</span>' +
          '<button class="btn btn--panini" data-buy>' + esc(I18N.t("prod.buy")) + '</button>' +
        '</div>' +
      '</div>';

    UI.modal({ title: I18N.t("prod.view3d"), content: wrap, wide: true, onMount: function () {
      var volSel = wrap.querySelector("[data-vol]");
      var stockBox = wrap.querySelector("[data-vol-stock]");
      var priceEl = wrap.querySelector(".preview3d__price[data-price]");
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

      function refresh() {
        var c = currentVol();
        if (stage && stage.setCover) stage.setCover(coverFor(c));
        if (priceEl) priceEl.textContent = UI.money((c.id && c.price) || p.price);
        stockBox.innerHTML = '<p class="vol-stock__h">' + esc(I18N.t("prod.stockByBranch")) + '</p>' +
          stockRowsHTML(p, c.v, c);
      }
      if (volSel) volSel.addEventListener("change", refresh);

      // Portadas oficiales por tomo desde MangaDex: SOLO manga y sólo si hay
      // pocas portadas reales de catálogo (los tomos locales ya traen la suya).
      var artCovers = covers.filter(function (c) { return c.url && !c.id; }).length;
      if (showVolumePicker && volSel && artCovers < 3 && window.Catalog && Catalog.volumeCovers) {
        Catalog.volumeCovers(p.search_title || p.series || p.title).then(function (list) {
          if (!list.length || !volSel.isConnected) return;
          var byV = {};
          covers.forEach(function (c) { byV[c.v] = c; });
          list.forEach(function (vc) {
            if (byV[vc.v]) { if (!byV[vc.v].url) byV[vc.v].url = vc.url; }
            else byV[vc.v] = { v: String(vc.v), url: vc.url, source: "" };
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
                   price: c.price || p.price, cover: c.url || Catalog.coverURL(p) };
        } else if (showVolumePicker) {
          item = { id: p.id + "-v" + c.v, title: p.title + " " + I18N.t("prod.volume") + " " + c.v,
                   price: p.price, cover: c.url || p.cover };
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
  /* animate=true → aparecen con la animación reveal (primer montaje).
     animate=false → se pintan ya visibles (re-render por cambio de idioma). */
  function drawBranches(root, animate) {
    var host = $("[data-branches]", root);
    if (!host) return;
    var list = ((window.__BRAND__ || {}).branches) || [];
    if (!list.length) return;                       // nunca dejes la sección vacía
    var cls = "branch reveal" + (animate ? "" : " is-visible");
    host.innerHTML = list.map(function (b) {
      return (
        '<article class="' + cls + '">' +
          '<span class="branch__code">' + esc(b.code) + '</span>' +
          '<h3>' + esc(b.name) + '</h3>' +
          '<div class="branch__row"><b>' + esc(I18N.t("branches.addr")) + '</b><span>' + esc(b.address) + ', ' + esc(b.city) + '</span></div>' +
          '<div class="branch__row"><b>' + esc(I18N.t("branches.hours")) + '</b><span>' + esc(b.hours) + '</span></div>' +
          '<div class="branch__row"><b>' + esc(I18N.t("branches.phone")) + '</b><span>' + esc(b.phone) + '</span></div>' +
          '<div class="branch__status"><span class="badge badge--ok">' + esc(I18N.t("status.active")) + '</span></div>' +
        '</article>'
      );
    }).join("");
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
    I18N.apply(root);
    drawCatbar(root, activeSlug);
    bindSearch(root);
    drawBranches(root, true);

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
      UI.safe(function () { drawBranches(root, false); }, "drawBranches");
      UI.safe(function () { setSourceNote(root); }, "setSourceNote");
      activeSlug = keep;   // restablece por si algún paso lo tocara
    };
    window.addEventListener("i18n:change", langHandler);

    // El catálogo cambió (alta/edición/baja desde el panel) -> redibuja YA.
    var catalogHandler = function () { UI.safe(function () { drawGrid(root, activeCat()); }, "drawGrid.catChange"); };
    window.addEventListener("catalog:changed", catalogHandler);

    root.__cleanup = function () {
      if (gridRAF) { cancelAnimationFrame(gridRAF); gridRAF = 0; }
      window.removeEventListener("hero:pick", heroPickHandler);
      window.removeEventListener("i18n:change", langHandler);
      window.removeEventListener("catalog:changed", catalogHandler);
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
