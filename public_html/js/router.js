/* =============================================================
   Router SPA por hash.  window.Router
   ============================================================= */
(function () {
  "use strict";
  var $ = UI.$;

  var ROUTES = [
    { test: function (h) { return h === "" || h === "/"; }, view: "store", params: function () { return { cat: "all" }; } },
    { test: function (h) { return h.indexOf("/cat/") === 0; }, view: "store", params: function (h) { return { cat: h.split("/")[2] || "all" }; } },
    { test: function (h) { return h === "/acceso" || h === "/login"; }, view: "login", params: function () { return {}; } },
    { test: function (h) { return h === "/panel"; }, view: "_home", params: function () { return {}; } },
    { test: function (h) { return h === "/cuenta" || h.indexOf("/cuenta/") === 0; }, view: "account",
      params: function (h) { return { sub: h.replace(/^\/cuenta\/?/, "") }; } },
    { test: function (h) { return h === "/admin" || h.indexOf("/admin/") === 0; }, view: "admin",
      params: function (h) { return { sub: h.replace(/^\/admin\/?/, "") }; } },
    { test: function (h) { return h === "/manager" || h.indexOf("/manager/") === 0; }, view: "manager",
      params: function (h) { return { sub: h.replace(/^\/manager\/?/, "") }; } },
    { test: function (h) { return h.indexOf("/ticket/") === 0; }, view: "ticket",
      params: function (h) { return { id: h.split("/")[2] }; } },
    { test: function (h) { return h === "/pos"; }, view: "pos", params: function () { return {}; } }
  ];

  var appEl, currentRoot = null, currentView = null, rendering = false;

  function hashPath() { return (location.hash || "").replace(/^#/, ""); }

  function resolve(h) {
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].test(h)) return { view: ROUTES[i].view, params: ROUTES[i].params(h) };
    }
    return { view: "store", params: { cat: "all" } };
  }

  function navigate() {
    if (rendering) return;
    var h = hashPath();

    // Ancla interna de la tienda (#catalogo, #sucursales)
    if (h && h.charAt(0) !== "/") {
      if (!currentRoot || currentView !== "store") {
        render((window.Views || {}).store, { view: "store", params: { cat: "all" } });
      }
      var anchor = h;
      setTimeout(function () {
        var el = document.getElementById(anchor);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: UI.reduced ? "auto" : "smooth" });
      }, 60);
      return;
    }

    var match = resolve(h);

    if (match.view === "_home") { location.replace(STORE.homeRoute()); return; }

    var view = (window.Views || {})[match.view];
    if (!view) { location.replace("#/"); return; }

    var needsAuth = Array.isArray(view.roles) && view.roles.length > 0;
    if (needsAuth && !STORE.isLogged()) {
      UI.toast(I18N.t("guard.login"), "warn");
      location.replace("#/acceso");
      return;
    }
    if (needsAuth && view.roles.indexOf(STORE.role) === -1) {
      location.replace(STORE.homeRoute());
      return;
    }
    if (match.view === "login" && STORE.isLogged()) {
      location.replace(STORE.homeRoute());
      return;
    }

    // Misma vista con update() → no reconstruir (conserva el hero 3D, etc.)
    if (currentView === match.view && currentRoot && typeof view.update === "function") {
      UI.safe(function () { view.update(currentRoot, match.params); }, "view.update");
      window.dispatchEvent(new CustomEvent("route:change", { detail: match }));
      return;
    }

    render(view, match);
  }

  function render(view, match) {
    rendering = true;

    if (currentRoot && typeof currentRoot.__cleanup === "function") {
      UI.safe(currentRoot.__cleanup, "view.cleanup");
    }
    UI.closeModal();
    document.body.classList.toggle("in-app", match.view !== "store");

    var fresh = document.createElement("div");
    fresh.className = "view view--" + match.view;
    fresh.innerHTML = UI.safe(function () { return view.render(match.params); }, "view.render") || "";
    appEl.innerHTML = "";
    appEl.appendChild(fresh);
    currentRoot = fresh;
    currentView = match.view;

    UI.safe(function () { I18N.apply(fresh); }, "i18n.apply");
    UI.safe(function () { view.mount(fresh, match.params); }, "view.mount");

    if (match.view !== "store") window.scrollTo(0, 0);

    rendering = false;
    window.dispatchEvent(new CustomEvent("route:change", { detail: match }));
  }

  function go(hash) {
    if (location.hash === hash) navigate();
    else location.hash = hash;
  }

  function start() {
    appEl = $("[data-app]");
    if (!appEl) return;
    window.addEventListener("hashchange", navigate);
    if (!location.hash) location.replace("#/");
    else navigate();
  }

  window.Router = { start: start, go: go, resolve: resolve, current: function () { return resolve(hashPath()); } };
})();
