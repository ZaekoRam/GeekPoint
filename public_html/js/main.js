/* =============================================================
   Bootstrap GeekPoint — splash, idioma, sesión, API, carrito, router. 11
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
    if (panelLink && logged) {
      panelLink.setAttribute("href", STORE.homeRoute());
      // Personal → "Mi panel" (POS/administración). Cliente → "Mi cuenta" (tienda).
      var key = STORE.isStaff() ? "cta.mypanel" : "cta.myaccount";
      panelLink.setAttribute("data-i18n", key);
      panelLink.textContent = I18N.t(key);
    }
  }

  /* ---------- Carrito de la tienda (drawer) ---------- */
  function initCart() {
    var drawer = $("[data-cart-drawer]");
    var backdrop = $("[data-cart-backdrop]");
    var itemsEl = $("[data-cart-items]");
    var totalEl = $("[data-cart-total]");
    var countEl = $("[data-cart-count]");
    if (!drawer) return;

    function open() {
      drawer.classList.add("is-open"); backdrop.classList.add("is-open");
      renderItems();
      // entrada escalonada de las líneas solo al abrir
      if (itemsEl && !UI.reduced) {
        itemsEl.classList.remove("is-fresh");
        void itemsEl.offsetWidth;
        itemsEl.classList.add("is-fresh");
        setTimeout(function () { itemsEl.classList.remove("is-fresh"); }, 700);
      }
    }
    function close() { drawer.classList.remove("is-open"); backdrop.classList.remove("is-open"); }

    // Fallback de imagen en el drawer del carrito.
    if (itemsEl) itemsEl.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || img.tagName !== "IMG" || img.__ph) return;
      img.__ph = true;
      var row = img.closest("[data-line]");
      var id = row ? row.getAttribute("data-line") : "";
      var kind = /(^|-)tcg-/.test(id) ? "tcg" : (/(^|-)comics-/.test(id) ? "comics" : "item");
      img.src = (window.Catalog && Catalog.placeholderCover) ? Catalog.placeholderCover(kind) : "";
    }, true);

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
          var discounted = Number(l.discount_percent) > 0 && Number(l.list_price) > Number(l.price);
          return '<div class="dr-item" data-line="' + UI.escHTML(l.id) + '">' +
            '<img class="dr-item__media" src="' + UI.escHTML(l.cover || "") + '" alt="" />' +
            '<div><div class="dr-item__name">' + UI.escHTML(l.title) + '</div>' +
              '<div class="dr-item__price">' + (discounted
                ? '<del>' + UI.money(l.list_price) + '</del> <strong>' + UI.money(l.price) + '</strong> <span class="promo-badge">−' + l.discount_percent + '%</span>'
                : UI.money(l.price)) + '</div>' +
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
    var _lastCount = STORE.shopCount();
    function paintCount() {
      var n = STORE.shopCount();
      countEl.textContent = n ? String(n) : "";
      countEl.setAttribute("data-count", String(n));
      if (n !== _lastCount && n > 0 && !UI.reduced) {
        countEl.classList.remove("is-bump");
        void countEl.offsetWidth;
        countEl.classList.add("is-bump");
        setTimeout(function () { countEl.classList.remove("is-bump"); }, 420);
      }
      _lastCount = n;
    }

    itemsEl.addEventListener("click", function (e) {
      var row = e.target.closest("[data-line]");
      if (!row) return;
      var id = row.getAttribute("data-line");
      var line = STORE.shopCart.find(function (l) { return l.id === id; });
      if (!line) return;
      if (e.target.closest("[data-inc]")) STORE.shopSetQty(id, line.qty + 1);
      else if (e.target.closest("[data-dec]")) STORE.shopSetQty(id, line.qty - 1);
      else if (e.target.closest("[data-rm]")) {
        if (UI.reduced) { STORE.shopRemove(id); return; }
        row.classList.add("cart-item-leaving");
        setTimeout(function () { STORE.shopRemove(id); }, 200);
      }
    });

    /* Stock disponible de una línea del carrito según el catálogo cargado.
       Devuelve un número, o null si no se puede determinar (no se bloquea). */
    function lineAvailable(l, branchCode) {
      if (!window.Catalog || !Catalog.get) return null;
      var idStr = String(l.id);
      var branches = null;
      var p = Catalog.get(idStr);
      if (p && p.branches && p.branches.length) branches = p.branches;
      if (!branches && Catalog.all) {
        var m = idStr.match(/^(.*)-v(\d+(?:\.\d+)?)$/);   // id sintético "<serie>-vN"
        var all = Catalog.all();
        for (var i = 0; i < all.length && !branches; i++) {
          var vcs = all[i].volume_covers || [];
          for (var j = 0; j < vcs.length; j++) {
            if (String(vcs[j].id) === idStr && vcs[j].branches && vcs[j].branches.length) { branches = vcs[j].branches; break; }
          }
          if (!branches && m && all[i].id === m[1] && all[i].branches && all[i].branches.length) branches = all[i].branches;
        }
      }
      if (!branches) return null;
      if (branchCode) {
        var b = branches.filter(function (x) { return x.code === branchCode; })[0];
        return b ? (b.stock || 0) : 0;
      }
      return branches.reduce(function (mx, x) { return Math.max(mx, x.stock || 0); }, 0);
    }
    function stockShortages(branchCode) {
      var out = [];
      STORE.shopCart.forEach(function (l) {
        var avail = lineAvailable(l, branchCode);
        if (avail != null && avail < l.qty) out.push({ title: l.title, need: l.qty, have: avail });
      });
      return out;
    }

    /* ---- Apartar: crea una reserva real (POST) y muestra el ticket con folio + código de barras ---- */
    function quote() {
      var c = STORE.shopCart;
      if (!c.length) { UI.toast(I18N.t("cart.empty"), "warn"); return; }
      var repriced = STORE.shopReconcile(window.Catalog ? Catalog.all() : []);
      if (repriced) UI.toast(I18N.t("discount.cartUpdated", { n: repriced }), "warn");
      c = STORE.shopCart;

      // Sucursales ACTIVAS de la BD (tabla `branches`); respaldo estático si el
      // API aún no respondió.  La opción "Cualquier sucursal" se conserva fija.
      var branches = (window.Catalog && Catalog.branches)
        ? Catalog.branches().filter(function (b) { return String(b.status || "active") !== "inactive"; })
        : (((window.__BRAND__ || {}).branches) || []);
      var rows = c.map(function (l) {
        return '<tr><td>' + UI.escHTML(l.title) +
          (!/^local-/i.test(String(l.id)) ? '<small class="muted">' + UI.escHTML(I18N.t("resv.nonbinding")) + '</small>' : '') +
          '</td><td class="num qcol-qty">' + l.qty + '</td><td class="num qcol-total">' +
          UI.money(l.price * l.qty, true) + '</td></tr>';
      }).join("");

      var form = document.createElement("form");
      form.className = "resv-form";
      form.setAttribute("novalidate", "");
      form.innerHTML =
        '<p class="muted" style="margin-bottom:1rem">' + UI.escHTML(I18N.t("resv.intro")) + '</p>' +
        '<div class="table-wrap"><table class="data quote-table"><tbody data-quote-body>' + rows +
          '<tr class="quote-total"><td><b>' + UI.escHTML(I18N.t("cart.total")) + '</b></td><td></td><td class="num qcol-total"><b>' +
          UI.money(STORE.shopTotal(), true) + '</b></td></tr></tbody></table></div>' +
        '<div class="field"><label>' + UI.escHTML(I18N.t("resv.name")) + '</label>' +
          '<input class="input" name="customer_name" required maxlength="120" autocomplete="name"></div>' +
        '<div class="resv-grid">' +
          '<div class="field"><label>' + UI.escHTML(I18N.t("resv.email")) +
              ' <button type="button" class="tip" data-tip="' + UI.escHTML(I18N.t("resv.emailTip")) + '" ' +
                'aria-label="' + UI.escHTML(I18N.t("resv.emailTip")) + '">i</button>' +
            '</label>' +
            '<input class="input" type="email" name="customer_email" maxlength="160" autocomplete="email"></div>' +
          '<div class="field"><label>' + UI.escHTML(I18N.t("resv.phone")) + '</label>' +
            '<input class="input" name="customer_phone" maxlength="40" autocomplete="tel"></div>' +
        '</div>' +
        '<div class="field"><label>' + UI.escHTML(I18N.t("resv.branch")) + '</label>' +
          '<select class="select" name="branch_code"><option value="">' + UI.escHTML(I18N.t("resv.pickAny")) + '</option>' +
          branches.map(function (b) { return '<option value="' + UI.escHTML(b.code) + '">' + UI.escHTML(b.name) + '</option>'; }).join("") +
          '</select></div>' +
        '<p class="field__error" data-resv-error hidden></p>' +
        '<button class="btn btn--panini btn--block btn--lg" type="submit">' + UI.escHTML(I18N.t("resv.submit")) + '</button>';

      UI.modal({ title: I18N.t("resv.title"), content: form });
      var errBox = form.querySelector("[data-resv-error]");
      var btn = form.querySelector('button[type="submit"]');
      var branchSelect = form.querySelector('[name="branch_code"]');

      function refreshQuotePrices() {
        var changed = STORE.shopReconcile(window.Catalog ? Catalog.all() : [], branchSelect.value);
        var quoteBody = form.querySelector("[data-quote-body]");
        quoteBody.innerHTML = STORE.shopCart.map(function (l) {
          return '<tr><td>' + UI.escHTML(l.title) +
            (!/^local-/i.test(String(l.id)) ? '<small class="muted">' + UI.escHTML(I18N.t("resv.nonbinding")) + '</small>' : '') +
            '</td><td class="num qcol-qty">' + l.qty + '</td><td class="num qcol-total">' +
            UI.money(l.price * l.qty, true) + '</td></tr>';
        }).join("") + '<tr class="quote-total"><td><b>' + UI.escHTML(I18N.t("cart.total")) +
          '</b></td><td></td><td class="num qcol-total"><b>' + UI.money(STORE.shopTotal(), true) + '</b></td></tr>';
        return changed;
      }
      branchSelect.addEventListener("change", function () {
        if (refreshQuotePrices()) UI.toast(I18N.t("discount.cartUpdated", { n: 1 }), "warn");
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        errBox.hidden = true;
        refreshQuotePrices();

        // No permitir apartar si algún artículo no tiene stock suficiente
        // (en la sucursal elegida, o en la mejor sucursal si es "cualquiera").
        var shortages = stockShortages(form.branch_code.value);
        if (shortages.length) {
          errBox.textContent = I18N.t("resv.shortStock") + " " +
            shortages.map(function (s) { return s.title + " (" + s.have + "/" + s.need + ")"; }).join(", ");
          errBox.hidden = false;
          return;
        }

        btn.classList.add("is-loading");
        API.post("reservations", {
          customer_name: form.customer_name.value.trim(),
          customer_email: form.customer_email.value.trim(),
          customer_phone: form.customer_phone.value.trim(),
          branch_code: form.branch_code.value,
          expected_total: STORE.shopTotal(),
          items: STORE.shopCart.map(function (l) {
            return { ref: l.id, title: l.title, price: l.price, qty: l.qty };
          })
        }, { noAuthRedirect: true }).then(function (r) {
          STORE.shopClear();
          showReservationTicket(r);
        }).catch(function (err) {
          btn.classList.remove("is-loading");
          if (err && err.data && err.data.error === "price_changed" && window.Catalog) {
            Catalog.load(true).then(function () {
              refreshQuotePrices();
            });
          }
          errBox.textContent = (err && err.message) || I18N.t("resv.error");
          errBox.hidden = false;
        });
      });
    }

    function showReservationTicket(r) {
      var loc = I18N.lang === "en" ? "en-US" : "es-MX";
      var barcode = window.Barcode ? Barcode.code128svg(r.folio, { height: 64, moduleWidth: 2 }) : "";
      var itemsHTML = (r.items || []).map(function (it) {
        return '<div class="rk-row"><span>' + it.quantity + '× ' + UI.escHTML(it.title) + '</span>' +
          '<span class="mono">' + UI.money(it.line_total) + '</span></div>' +
          (it.binding === false ? '<small class="muted">' + UI.escHTML(I18N.t("resv.nonbinding")) + '</small>' : '');
      }).join("");

      var wrap = document.createElement("div");
      wrap.className = "resv-ticket";
      wrap.innerHTML =
        '<div class="rk">' +
          '<div class="rk__brand">GEEK<b>POINT</b> · ' + UI.escHTML(I18N.t("resv.ticketKicker")) + '</div>' +
          '<div class="rk__folio">' + UI.escHTML(r.folio) + '</div>' +
          '<div class="rk__barcode">' + barcode + '</div>' +
          '<div class="rk__meta">' +
            '<div><b>' + UI.escHTML(I18N.t("resv.name")) + ':</b> ' + UI.escHTML(r.customer_name) + '</div>' +
            (r.branch_name ? '<div><b>' + UI.escHTML(I18N.t("resv.branch")) + ':</b> ' + UI.escHTML(r.branch_name) + '</div>' : '') +
            '<div><b>' + UI.escHTML(I18N.t("col.date")) + ':</b> ' + new Date(String(r.created_at).replace(" ", "T")).toLocaleString(loc) + '</div>' +
          '</div>' +
          '<div class="rk__items">' + itemsHTML + '</div>' +
          '<div class="rk-row rk-row--total"><span>' + UI.escHTML(I18N.t("cart.total")) + '</span>' +
            '<span class="mono">' + UI.money(r.total) + '</span></div>' +
          '<p class="rk__hint">' + UI.escHTML(I18N.t("resv.present")) + '</p>' +
        '</div>' +
        '<div class="ticket__actions">' +
          '<label class="ticket-print-opts"><span>Papel</span>' +
            '<select class="select select--sm" data-printmode>' +
              '<option value="80">Térmica 80 mm</option>' +
              '<option value="58">Térmica 58 mm</option>' +
              '<option value="a4">Hoja A4</option>' +
            '</select></label>' +
          '<button class="btn btn--ghost btn--sm printbtn" data-print>' +
            '<span class="printer" aria-hidden="true">' +
              '<span class="printer__paper"><svg viewBox="0 0 8 8" class="printer__svg" fill="none">' +
                '<path d="M6.28951 1.3867C6.91292 0.809799 7.00842 0 7.00842 0C7.00842 0 6.45246 0.602112 5.54326 0.602112C4.82505 0.602112 4.27655 0.596787 4.07703 0.595012L3.99644 0.594302C1.94904 0.594302 0.290039 2.25224 0.290039 4.29715C0.290039 6.34206 1.94975 8 3.99644 8C6.04312 8 7.70284 6.34206 7.70284 4.29715C7.70347 3.73662 7.57647 3.18331 7.33147 2.67916C7.08647 2.17502 6.7299 1.73327 6.2888 1.38741L6.28951 1.3867ZM3.99679 6.532C2.76133 6.532 1.75875 5.53084 1.75875 4.29609C1.75875 3.06133 2.76097 2.06018 3.99679 2.06018C4.06423 2.06014 4.13163 2.06311 4.1988 2.06905L4.2414 2.07367C4.25028 2.07438 4.26057 2.0758 4.27406 2.07651C4.81533 2.1436 5.31342 2.40616 5.67465 2.81479C6.03589 3.22342 6.23536 3.74997 6.23554 4.29538C6.23554 5.53084 5.23439 6.532 3.9975 6.532H3.99679Z"/>' +
                '<path d="M6.756 1.82386C6.19293 2.09 5.58359 2.24445 4.96173 2.27864C4.74513 2.17453 4.51296 2.10653 4.27441 2.07734C4.4718 2.09225 5.16906 2.07947 5.90892 1.66374C6.04642 1.58672 6.1743 1.49364 6.28986 1.38647C6.45751 1.51849 6.61346 1.6647 6.756 1.8235V1.82386Z"/>' +
              '</svg></span>' +
              '<span class="printer__dot"></span>' +
              '<span class="printer__out"><span class="printer__paper-out"></span></span>' +
            '</span>' +
            '<span>' + UI.escHTML(I18N.t("btn.print")) + '</span>' +
          '</button>' +
          '<button class="btn btn--panini btn--sm" data-close>' + UI.escHTML(I18N.t("btn.close")) + '</button>' +
        '</div>';

      UI.modal({ title: I18N.t("resv.created"), content: wrap });
      var pm = wrap.querySelector("[data-printmode]");
      if (pm) {
        pm.value = (UI.printMode && UI.printMode()) || "80";
        pm.addEventListener("change", function () { UI.setPrintMode && UI.setPrintMode(pm.value); });
      }
      wrap.querySelector("[data-print]").addEventListener("click", function () { window.print(); });
      wrap.querySelector("[data-close]").addEventListener("click", UI.closeModal);
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
        // Refresco DURO: el server reconstruye el catálogo desde las APIs externas.
        if (up && window.Catalog) (Catalog.refresh ? Catalog.refresh() : Catalog.load(true)).then(function () {
          if (window.Router) Router.go(location.hash || "#/");
        }).catch(function () {});
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
