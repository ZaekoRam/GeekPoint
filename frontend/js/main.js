/* =============================================================
   Bootstrap GeekPoint — splash, idioma, sesión, API, carrito, router.
   ============================================================= */
(function () {
  "use strict";
  var $ = UI.$, $$ = UI.$$;

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 450);
    else window.addEventListener("load", function () { setTimeout(hide, 300); });
    setTimeout(hide, 3500);
  }

  /* ---------- Idioma ---------- */
  function initLang() {
    var wrap = $("[data-lang-toggle]");
    if (!wrap) return;
    function paint() {
      $$("button", wrap).forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-lang") === I18N.lang);
      });
    }
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lang]");
      if (b) I18N.set(b.getAttribute("data-lang"));
    });
    window.addEventListener("i18n:change", paint);
    paint();
  }

  /* ---------- Nav de categorías: estado activo ---------- */
  function paintNav() {
    var h = location.hash || "#/";
    $$("[data-nav-store] a[data-link]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === h);
    });
  }

  /* ---------- Sesión en el header ---------- */
  function paintSession() {
    var logged = STORE.isLogged();
    $$("[data-session-show]").forEach(function (el) { el.hidden = !logged; });
    $$("[data-session-hide]").forEach(function (el) { el.hidden = logged; });
    var panelLink = $('[data-session-show]');
    if (panelLink && logged) panelLink.setAttribute("href", STORE.homeRoute());
  }

  /* ---------- Carrito de la tienda (drawer) ---------- */
  function initCart() {
    var drawer = $("[data-cart-drawer]");
    var backdrop = $("[data-cart-backdrop]");
    var itemsEl = $("[data-cart-items]");
    var totalEl = $("[data-cart-total]");
    var countEl = $("[data-cart-count]");
    if (!drawer) return;

    function open() { drawer.classList.add("is-open"); backdrop.classList.add("is-open"); renderItems(); }
    function close() { drawer.classList.remove("is-open"); backdrop.classList.remove("is-open"); }

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-cart-open]")) { e.preventDefault(); open(); }
      else if (e.target.closest("[data-cart-close]") || e.target === backdrop) close();
      else if (e.target.closest("[data-cart-quote]")) quote();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    function renderItems() {
      var c = STORE.shopCart;
      if (!c.length) {
        itemsEl.innerHTML = '<div class="cart-drawer__empty">' + UI.escHTML(I18N.t("cart.empty")) + '</div>';
      } else {
        itemsEl.innerHTML = c.map(function (l) {
          return '<div class="dr-item" data-line="' + UI.escHTML(l.id) + '">' +
            '<img class="dr-item__media" src="' + UI.escHTML(l.cover || "") + '" alt="" />' +
            '<div><div class="dr-item__name">' + UI.escHTML(l.title) + '</div>' +
              '<div class="dr-item__price">' + UI.money(l.price) + '</div>' +
              '<div class="dr-item__qty">' +
                '<button data-dec>−</button><span class="mono">' + l.qty + '</span><button data-inc>+</button>' +
              '</div></div>' +
            '<div style="text-align:right"><div class="mono">' + UI.money(l.price * l.qty) + '</div>' +
              '<button class="dr-item__rm" data-rm>✕</button></div>' +
          '</div>';
        }).join("");
      }
      totalEl.textContent = UI.money(STORE.shopTotal());
      paintCount();
    }
    function paintCount() {
      var n = STORE.shopCount();
      countEl.textContent = n ? String(n) : "";
      countEl.setAttribute("data-count", String(n));
    }

    itemsEl.addEventListener("click", function (e) {
      var row = e.target.closest("[data-line]");
      if (!row) return;
      var id = row.getAttribute("data-line");
      var line = STORE.shopCart.find(function (l) { return l.id === id; });
      if (!line) return;
      if (e.target.closest("[data-inc]")) STORE.shopSetQty(id, line.qty + 1);
      else if (e.target.closest("[data-dec]")) STORE.shopSetQty(id, line.qty - 1);
      else if (e.target.closest("[data-rm]")) STORE.shopRemove(id);
    });

    function quote() {
      var c = STORE.shopCart;
      if (!c.length) { UI.toast(I18N.t("cart.empty"), "warn"); return; }
      var rows = c.map(function (l) {
        return '<tr><td>' + UI.escHTML(l.title) + '</td><td class="num right">' + l.qty +
          '</td><td class="num right">' + UI.money(l.price * l.qty) + '</td></tr>';
      }).join("");
      var html =
        '<p class="muted" style="margin-bottom:1rem">' + UI.escHTML(I18N.t("cart.quoteIntro")) + '</p>' +
        '<div class="table-wrap"><table class="data"><tbody>' + rows +
        '<tr><td><b>' + UI.escHTML(I18N.t("cart.total")) + '</b></td><td></td><td class="num right"><b>' +
        UI.money(STORE.shopTotal()) + '</b></td></tr></tbody></table></div>' +
        '<p class="mono" style="font-size:.7rem;color:var(--muted);margin-top:1rem">GeekPoint · ' + new Date().toLocaleString() + '</p>';
      UI.modal({ title: I18N.t("cart.quoteTitle"), content: html });
    }

    STORE.on("shop", renderItems);
    window.addEventListener("i18n:change", renderItems);
    renderItems();
  }

  /* ---------- API: banner + health ---------- */
  function initApi() {
    var banner = $("[data-api-banner]");
    function setBanner(show) { if (banner) banner.hidden = !show; }

    if (!window.__CONFIG__ || !__CONFIG__.apiBase) setBanner(true);
    else API.health().then(function (up) { setBanner(!up); });

    window.addEventListener("api:status", function (e) { setBanner(!e.detail.online); });

    var retry = $("[data-api-retry]");
    if (retry) retry.addEventListener("click", function () {
      retry.disabled = true;
      API.health().then(function (up) {
        setBanner(!up); retry.disabled = false;
        if (up && window.Catalog) Catalog.load(true).then(function () {
          if (window.Router) Router.go(location.hash || "#/");
        });
      });
    });

    window.addEventListener("api:unauthorized", function () {
      if (!STORE.isLogged()) return;
      STORE.clearSession(); paintSession();
      UI.toast(I18N.t("guard.login"), "warn");
      location.hash = "#/acceso";
    });
  }

  /* ---------- Logout global ---------- */
  function initLogout() {
    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-logout]")) return;
      e.preventDefault();
      var done = function () {
        STORE.clearSession(); paintSession();
        UI.toast(I18N.t("toast.sessionEnd"), "ok");
        location.hash = "#/";
      };
      if (window.API && API.base) API.post("auth/logout").then(done).catch(done);
      else done();
    });
  }

  function boot() {
    UI.safe(initSplash, "initSplash");
    UI.safe(initLang, "initLang");
    UI.safe(initCart, "initCart");
    UI.safe(initApi, "initApi");
    UI.safe(initLogout, "initLogout");

    UI.safe(function () { I18N.apply(document); }, "i18n.apply");
    paintSession();
    paintNav();
    STORE.on("session", paintSession);

    window.addEventListener("route:change", paintNav);
    window.addEventListener("hashchange", paintNav);

    window.addEventListener("i18n:change", function () {
      paintSession(); paintNav();
      var v = window.Router ? Router.current().view : "store";
      if (v === "admin" || v === "manager" || v === "ticket") Router.go(location.hash || "#/");
      else UI.safe(function () { I18N.apply(document); }, "i18n.apply");
    });

    if (window.gsap && window.ScrollTrigger) {
      UI.safe(function () { gsap.registerPlugin(ScrollTrigger); }, "gsap.register");
    }

    if (window.Catalog) UI.safe(function () { Catalog.load(); }, "Catalog.load");
    UI.safe(function () { Router.start(); }, "Router.start");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
