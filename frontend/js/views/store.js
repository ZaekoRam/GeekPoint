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

  function drawGrid(root, active) {
    var host = $("[data-pgrid]", root);
    if (!host) return;
    var list = Catalog.byCategory(active);
    if (!list.length) {
      host.innerHTML = '<div class="state"><div class="state__icon">📭</div><p>' + esc(I18N.t("shop.empty")) + '</p></div>';
      return;
    }
    host.innerHTML = list.map(cardHTML).join("");
    $$(".pcard", host).forEach(bindCard);
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
  function openPreview(id) {
    var p = Catalog.get(id);
    if (!p) return;
    var meta = [];
    if (p.author) meta.push('<span><b>' + esc(I18N.t("prod.author")) + ':</b> ' + esc(p.author) + '</span>');
    if (p.volumes) meta.push('<span><b>' + esc(I18N.t("prod.volumes")) + ':</b> ' + p.volumes + '</span>');
    if (p.score) meta.push('<span><b>' + esc(I18N.t("prod.score")) + ':</b> ' + p.score + ' / 10</span>');
    var avail = (p.branches || []).filter(function (b) { return b.stock > 0; })
      .map(function (b) { return esc(b.name) + ' (' + b.stock + ')'; }).join(" · ") || esc(I18N.t("prod.soldout"));

    var wrap = document.createElement("div");
    wrap.className = "preview3d";
    wrap.innerHTML =
      '<div class="preview3d__stage"><canvas data-pv3d></canvas>' +
        '<span class="preview3d__hint">' + esc(I18N.t("prod.rotate")) + '</span></div>' +
      '<div>' +
        '<span class="pcard__cat">' + esc(I18N.t("cat." + p.category) || p.category) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<div class="preview3d__meta">' + meta.join("") + '<span><b>' + esc(I18N.t("prod.available")) + ':</b> ' + avail + '</span></div>' +
        (p.synopsis ? '<p class="preview3d__syn">' + esc(p.synopsis) + '</p>' : "") +
        '<div class="preview3d__buy">' +
          '<span class="preview3d__price">' + UI.money(p.price) + '</span>' +
          '<button class="btn btn--panini" data-buy>' + esc(I18N.t("prod.buy")) + '</button>' +
        '</div>' +
      '</div>';

    UI.modal({ title: I18N.t("prod.view3d"), content: wrap, wide: true, onMount: function () {
      wrap.querySelector("[data-buy]").addEventListener("click", function () {
        STORE.shopAdd(p); UI.toast(I18N.t("prod.added") + " · " + p.title, "ok"); UI.closeModal();
        openCartDrawer();
      });
      spinStage(wrap.querySelector("[data-pv3d]"), p);
    }});
  }

  function spinStage(canvas, p) {
    if (typeof THREE === "undefined" || !canvas) return;
    var w = canvas.clientWidth || 260, h = canvas.clientHeight || 340;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      var st = canvas.parentElement;
      if (st) {
        st.style.backgroundImage = "url('" + Catalog.coverURL(p) + "')";
        st.style.backgroundSize = "cover";
        st.style.backgroundPosition = "center";
      }
      return;
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
    // [+X foreEdge, -X spine, +Y head, -Y tail, +Z front, -Z back]
    var mats = [
      edgeMat(1),
      new THREE.MeshStandardMaterial({ color: accent, roughness: .5 }),
      edgeMat(3),
      edgeMat(3),
      front,
      new THREE.MeshStandardMaterial({ color: "#15151a", roughness: .8 })
    ];
    var mesh = new THREE.Mesh(geo, mats);
    scene.add(mesh);
    new THREE.TextureLoader().load(Catalog.coverURL(p), function (t) {
      if ("colorSpace" in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      front.map = t; front.color.set("#fff"); front.needsUpdate = true;
    });

    var drag = false, lastX = 0, lastY = 0, velY = 0.01, velX = 0;
    canvas.addEventListener("pointerdown", function (e) { drag = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup", function () { drag = false; });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      velY = (e.clientX - lastX) * 0.01;
      velX = (e.clientY - lastY) * 0.01;
      mesh.rotation.y += velY; mesh.rotation.x += velX;
      lastX = e.clientX; lastY = e.clientY;
    });

    (function loop() {
      if (!canvas.isConnected) { renderer.dispose(); return; }
      requestAnimationFrame(loop);
      if (!drag) { mesh.rotation.y += (UI.reduced ? 0.004 : 0.012); mesh.rotation.x += (mesh.rotation.x > 0 ? -0.002 : 0.002) * 0.2; }
      renderer.render(scene, cam);
    })();
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
