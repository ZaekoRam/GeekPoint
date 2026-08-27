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

  function currentCat(params) {
    var c = params && params.cat ? params.cat : "all";
    return CATS.some(function (x) { return x.slug === c; }) ? c : "all";
  }

  function drawCatbar(root, active) {
    var host = $("[data-catbar]", root);
    if (!host) return;
    host.innerHTML = CATS.map(function (c) {
      return '<a class="catbar__btn' + (c.slug === active ? " is-active" : "") + '" href="' +
        (c.slug === "all" ? "#/" : "#/cat/" + c.slug) + '" data-link>' + esc(I18N.t(c.i18n)) + '</a>';
    }).join("") +
      '<span class="mono" data-catalog-source style="flex-basis:100%;font-size:.68rem;color:var(--muted);letter-spacing:.08em;margin-top:.4rem"></span>';
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
    var base = Catalog.byCategory(active);
    var list = applySearch(base);
    if (!list.length) {
      var msg = (searchQ.trim() && base.length)
        ? esc(I18N.t("shop.noresults", { q: searchQ.trim() }))
        : esc(I18N.t("shop.empty"));
      host.innerHTML = '<div class="state"><div class="state__icon">📭</div><p>' + msg + '</p></div>';
      return;
    }
    host.innerHTML = list.map(cardHTML).join("");
    $$(".pcard", host).forEach(bindCard);
  }

  /* Categoría activa (robusta ante cambios de ruta sin re-montar). */
  function activeCat() {
    try { return currentCat((window.Router && Router.current().params) || null); }
    catch (e) { return "all"; }
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
      drawGrid(root, activeCat());
    }

    toggle.addEventListener("click", function () {
      if (box.classList.contains("is-open")) {
        input.value = "";
        if (searchQ) { searchQ = ""; drawGrid(root, activeCat()); }
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
      if (e.key === "Escape") { input.value = ""; searchQ = ""; drawGrid(root, activeCat()); setOpen(false); toggle.focus(); }
    });

    if (searchQ) { input.value = searchQ; setOpen(true); }
  }

  function cardHTML(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<span class="ptag ptag--' + esc(t) + '">' + esc(I18N.t("ptag." + t)) + '</span>';
    }).join("");
    var totalStock = (p.branches || []).reduce(function (n, b) { return n + (b.stock || 0); }, 0);
    return (
      '<article class="pcard tilt" data-id="' + esc(p.id) + '">' +
        '<div class="pcard__media">' +
          '<img src="' + esc(Catalog.coverURL(p)) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async" />' +
          '<div class="pcard__glow"></div>' +
          (tags ? '<div class="pcard__tags">' + tags + '</div>' : "") +
          '<span class="pcard__view">' + esc(I18N.t("prod.view3d")) + ' ↗</span>' +
        '</div>' +
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
    if (UI.fineHover) {
      var glow = $(".pcard__glow", card);
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(800px) rotateX(" + ((0.5 - py) * 9).toFixed(2) +
          "deg) rotateY(" + ((px - 0.5) * 9).toFixed(2) + "deg) translateY(-4px)";
        if (glow) { glow.style.setProperty("--mx", (px * 100) + "%"); glow.style.setProperty("--my", (py * 100) + "%"); }
      });
      card.addEventListener("mouseout", function (e) {
        if (!card.contains(e.relatedTarget)) card.style.transform = "";
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

  function stockRowsHTML(p, vol) {
    return STAGE_BRANCHES.map(function (b) {
      var n = volStock(p.id, vol, b.code);
      var cls = n === 0 ? "vs-out" : (n <= 3 ? "vs-low" : "vs-ok");
      var label = n === 0 ? esc(I18N.t("prod.soldout")) : (n + " u");
      return '<div class="vs-row"><span>' + esc(b.name) + '</span><span class="vs-n ' + cls + '">' + label + '</span></div>';
    }).join("");
  }

  function volOptionsHTML(covers) {
    return covers.map(function (c, i) {
      return '<option value="' + i + '" data-v="' + esc(c.v) + '" data-url="' + esc(c.url || "") + '">' +
        esc(I18N.t("prod.volume")) + ' ' + esc(c.v) + '</option>';
    }).join("");
  }

  function openPreview(id) {
    var p = Catalog.get(id);
    if (!p) return;

    var isTome = p.category !== "tcg" && p.category !== "figuras";
    var meta = [];
    if (p.author) meta.push('<span><b>' + esc(I18N.t("prod.author")) + ':</b> ' + esc(p.author) + '</span>');
    if (p.volumes) meta.push('<span><b>' + esc(I18N.t("prod.volumes")) + ':</b> ' + p.volumes + '</span>');
    if (p.score) meta.push('<span><b>' + esc(I18N.t("prod.score")) + ':</b> ' + p.score + ' / 10</span>');

    // Portadas oficiales por tomo (ya vienen en el catálogo; si no, se piden).
    var covers = (p.volume_covers || []).slice();
    if (!covers.length) {
      var maxVol = Math.max(1, Math.min(p.volumes ? (p.volumes | 0) : 3, 12));
      for (var v = 1; v <= maxVol; v++) covers.push({ v: String(v), url: "" });
    }

    var wrap = document.createElement("div");
    wrap.className = "preview3d";
    wrap.innerHTML =
      '<div class="preview3d__stage"><canvas data-pv3d></canvas>' +
        '<span class="preview3d__hint">' + esc(I18N.t("prod.rotate")) + '</span></div>' +
      '<div>' +
        '<span class="pcard__cat">' + esc(I18N.t("cat." + p.category) || p.category) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<div class="preview3d__meta">' + meta.join("") + '</div>' +
        (isTome
          ? '<label class="vol-select"><span>' + esc(I18N.t("prod.pickVolume")) + '</span>' +
            '<select class="select" data-vol>' + volOptionsHTML(covers) + '</select></label>'
          : "") +
        '<div class="vol-stock" data-vol-stock>' +
          '<p class="vol-stock__h">' + esc(I18N.t("prod.stockByBranch")) + '</p>' +
          stockRowsHTML(p, covers[0].v) +
        '</div>' +
        (p.synopsis ? '<p class="preview3d__syn">' + esc(p.synopsis) + '</p>' : "") +
        '<div class="preview3d__buy">' +
          '<span class="preview3d__price">' + UI.money(p.price) + '</span>' +
          '<button class="btn btn--panini" data-buy>' + esc(I18N.t("prod.buy")) + '</button>' +
        '</div>' +
      '</div>';

    UI.modal({ title: I18N.t("prod.view3d"), content: wrap, wide: true, onMount: function () {
      var volSel = wrap.querySelector("[data-vol]");
      var stockBox = wrap.querySelector("[data-vol-stock]");
      var stage = spinStage(wrap.querySelector("[data-pv3d]"), p, { initialUrl: covers[0].url });

      function selOpt() { return volSel ? volSel.options[volSel.selectedIndex] : null; }
      function currentV() { var o = selOpt(); return o ? (o.getAttribute("data-v") || "1") : "1"; }

      function refresh() {
        var o = selOpt();
        var url = o && o.getAttribute("data-url");
        if (stage && stage.setCover) stage.setCover(url || Catalog.coverURL(p));
        stockBox.innerHTML = '<p class="vol-stock__h">' + esc(I18N.t("prod.stockByBranch")) + '</p>' + stockRowsHTML(p, currentV());
      }
      if (volSel) volSel.addEventListener("change", refresh);

      // Si el catálogo no traía portadas por tomo, se piden a MangaDex.
      if (isTome && volSel && (!p.volume_covers || !p.volume_covers.length) && window.Catalog && Catalog.volumeCovers) {
        Catalog.volumeCovers(p.series || p.title).then(function (list) {
          if (!list.length || !volSel.isConnected) return;
          p.volume_covers = list;
          volSel.innerHTML = volOptionsHTML(list);
          refresh();
        });
      }

      wrap.querySelector("[data-buy]").addEventListener("click", function () {
        var v = currentV();
        var o = selOpt();
        var item = isTome
          ? { id: p.id + "-v" + v, title: p.title + " " + I18N.t("prod.volume") + " " + v, price: p.price,
              cover: (o && o.getAttribute("data-url")) || p.cover }
          : p;
        STORE.shopAdd(item);
        UI.toast(I18N.t("prod.added") + " · " + item.title, "ok");
        UI.closeModal();
        openCartDrawer();
      });
    }});
  }

  /* Portada trasera de la marca (contraportada del tomo). */
  var _backTex = null;
  function backCoverTexture() {
    if (_backTex) return _backTex;
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
    g.fillText("MANGA INK EDITION", 256, 486);
    // código de barras decorativo
    var x = 96;
    g.fillStyle = "#efe9d8";
    while (x < 416) { var bw = 2 + ((x * 7) % 6); g.fillRect(x, 620, bw, 84); x += bw + 3 + ((x * 3) % 4); }
    g.font = "600 18px 'JetBrains Mono', monospace";
    g.fillStyle = "#9a9a9a";
    g.fillText("GKP  9 786074  000000", 256, 726);
    g.strokeStyle = "#ffd400"; g.lineWidth = 8;
    g.strokeRect(16, 16, 480, 736);
    _backTex = new THREE.CanvasTexture(c);
    if ("colorSpace" in _backTex && THREE.SRGBColorSpace) _backTex.colorSpace = THREE.SRGBColorSpace;
    return _backTex;
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

    var isTome = p.category !== "tcg" && p.category !== "figuras";
    var kind = p.category === "tcg" ? [1.6, 2.24, 0.05] : (p.category === "figuras" ? [1.8, 1.9, 1.0] : [1.55, 2.2, 0.34]);
    var geo = new THREE.BoxGeometry(kind[0], kind[1], kind[2]);
    var accent = new THREE.Color(p.accent || "#ffd400");
    var front = new THREE.MeshStandardMaterial({ color: "#cfc8b6", roughness: .5 });

    function edgeMat(repV) {
      if (!isTome || !window.HERO3D || !HERO3D.pageTexture) {
        return new THREE.MeshStandardMaterial({ color: "#e9e4d5", roughness: .9 });
      }
      var t = HERO3D.pageTexture().clone();
      t.needsUpdate = true; t.repeat.set(1, repV || 1);
      return new THREE.MeshStandardMaterial({ map: t, color: "#fff", roughness: .95 });
    }
    var backMat = isTome
      ? new THREE.MeshStandardMaterial({ map: backCoverTexture(), color: "#fff", roughness: .85 })
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
    function applyCover(url) {
      if (!url) return;
      var mine = ++reqId;
      loader.load(url, function (t) {
        if (mine !== reqId) { t.dispose(); return; }   // llegó una selección más nueva
        if ("colorSpace" in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        if (front.map) front.map.dispose();
        front.map = t; front.color.set("#fff"); front.needsUpdate = true;
      });
    }
    applyCover(opts.initialUrl || Catalog.coverURL(p));

    // Rotación muy lenta y fluida (con easing tras arrastrar).
    var IDLE = UI.reduced ? 0.0015 : 0.0035;
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
  function drawBranches(root) {
    var host = $("[data-branches]", root);
    if (!host) return;
    var list = ((window.__BRAND__ || {}).branches) || [];
    host.innerHTML = list.map(function (b) {
      return (
        '<article class="branch reveal">' +
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
    var active = currentCat(params);
    I18N.apply(root);
    drawCatbar(root, active);
    bindSearch(root);
    drawBranches(root);

    var grid = $("[data-pgrid]", root);
    if (grid) grid.innerHTML = Views._loading ? Views._loading() : "…";

    Catalog.load().then(function () {
      drawGrid(root, active);
      setSourceNote(root);
      var canvas = $("[data-hero3d]", root);
      if (canvas && window.HERO3D) UI.safe(function () { HERO3D.start(canvas); });
    });

    reveals(root);

    heroPickHandler = function (e) { openPreview(e.detail.id); };
    window.addEventListener("hero:pick", heroPickHandler);

    var langHandler = function () {
      I18N.apply(root);
      drawCatbar(root, currentCat(params));
      drawGrid(root, currentCat(params));
      drawBranches(root);
      setSourceNote(root);
    };
    window.addEventListener("i18n:change", langHandler);

    root.__cleanup = function () {
      window.removeEventListener("hero:pick", heroPickHandler);
      window.removeEventListener("i18n:change", langHandler);
      if (window.HERO3D) HERO3D.destroy();
    };
  }

  /** Cambio de categoría SIN reconstruir el hero 3D. */
  function update(root, params) {
    var active = currentCat(params);
    drawCatbar(root, active);
    drawGrid(root, active);
    var target = document.getElementById("catalogo");
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 80, behavior: UI.reduced ? "auto" : "smooth" });
  }

  function openCartDrawer() {
    var d = $("[data-cart-drawer]"), b = $("[data-cart-backdrop]");
    if (d) d.classList.add("is-open");
    if (b) b.classList.add("is-open");
  }

  window.Views.store = { render: render, mount: mount, update: update, isPublic: true };
})();
