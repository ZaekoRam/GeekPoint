/* =============================================================
   Vista: Mi cuenta (cliente).  window.Views.account
   Información personal + Mis pedidos (apartados reales, propios) +
   Seguridad. Reutiliza API/STORE/UI/I18N existentes — nada paralelo.
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var V = window.Views;
  var $ = UI.$, esc = UI.escHTML;

  var TABS = ["info", "orders", "security"];

  function fmtDate(v) {
    if (!v) return "";
    var loc = I18N.lang === "en" ? "en-US" : "es-MX";
    var d = new Date(String(v).replace(" ", "T"));
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" });
  }

  /* Mapea el estado real de la BD (pendiente|lista|cobrada|cancelada) +
     is_preventa a las 5 etiquetas que el cliente debe ver — "Preventa" es
     una condición del pedido, no un sinónimo de "pendiente" (nunca se le
     muestra "Pendiente" al cliente). */
  function statusKey(r) {
    if (r.status === "pendiente") return r.is_preventa ? "preventa" : "confirmed";
    if (r.status === "lista") return "ready";
    if (r.status === "cobrada") return "pickedUp";
    if (r.status === "cancelada") return "cancelled";
    return "confirmed";
  }
  function statusBadgeHTML(r) {
    var k = statusKey(r);
    return '<span class="ordbadge ordbadge--' + k + '">' + esc(I18N.t("myorders.status." + k)) + '</span>';
  }

  function productImage(it) {
    var p = (window.Catalog && Catalog.get) ? Catalog.get(it.product_ref) : null;
    return (p && p.cover) ? p.cover : "";
  }

  function itemRowHTML(it) {
    var img = productImage(it);
    return '<div class="ordercard__item">' +
      (img ? '<img class="ordercard__img" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="ordercard__img ordercard__img--ph" aria-hidden="true">🛍</div>') +
      '<div class="ordercard__item-info">' +
        '<span class="ordercard__item-title">' + esc(it.title) + '</span>' +
        '<span class="ordercard__item-qty mono">×' + it.quantity + '</span>' +
      '</div>' +
    '</div>';
  }

  function orderCardHTML(r) {
    return '<div class="ordercard" data-order-folio="' + esc(r.folio) + '">' +
      '<div class="ordercard__top">' +
        '<span class="ordercard__folio mono">' + esc(r.folio) + '</span>' +
        statusBadgeHTML(r) +
      '</div>' +
      '<div class="ordercard__date muted">' + esc(fmtDate(r.created_at)) + '</div>' +
      '<div class="ordercard__items">' + (r.items || []).map(itemRowHTML).join("") + '</div>' +
      '<div class="ordercard__foot">' +
        '<span class="ordercard__total mono">' + esc(I18N.t("myorders.total")) + ': ' + UI.money(r.total) + '</span>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-order-details="' + esc(r.folio) + '">' + esc(I18N.t("myorders.viewDetails")) + '</button>' +
      '</div>' +
    '</div>';
  }

  function historyHTML(r) {
    var steps = [];
    steps.push({ label: r.is_preventa ? I18N.t("myorders.history.createdPreventa") : I18N.t("myorders.history.created"), at: r.created_at });
    if (r.ready_at) steps.push({ label: I18N.t("myorders.history.ready"), at: r.ready_at });
    if (r.resolved_at) {
      steps.push({ label: r.status === "cancelada" ? I18N.t("myorders.history.cancelled") : I18N.t("myorders.history.pickedUp"), at: r.resolved_at });
    }
    return '<div class="orderdetail__history">' + steps.map(function (s) {
      return '<div class="orderdetail__step">' +
        '<span class="orderdetail__step-dot" aria-hidden="true"></span>' +
        '<span class="orderdetail__step-label">' + esc(s.label) + '</span>' +
        '<span class="orderdetail__step-date muted mono">' + esc(fmtDate(s.at)) + '</span>' +
      '</div>';
    }).join("") + '</div>';
  }

  function showOrderDetail(r) {
    var barcode = window.Barcode ? Barcode.code128svg(r.folio, { height: 64, moduleWidth: 2 }) : "";
    var itemsHTML = (r.items || []).map(function (it) {
      var img = productImage(it);
      return '<div class="orderdetail__item">' +
        (img ? '<img class="ordercard__img" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="ordercard__img ordercard__img--ph" aria-hidden="true">🛍</div>') +
        '<div class="orderdetail__item-info">' +
          '<div class="orderdetail__item-title">' + esc(it.title) + (it.is_preventa ? ' <span class="ordbadge ordbadge--preventa">' + esc(I18N.t("myorders.status.preventa")) + '</span>' : '') + '</div>' +
          '<div class="muted" style="font-size:.8rem">' + it.quantity + ' × ' + UI.money(it.unit_price) + '</div>' +
        '</div>' +
        '<div class="mono">' + UI.money(it.line_total) + '</div>' +
      '</div>';
    }).join("");

    var content = document.createElement("div");
    content.className = "orderdetail";
    content.innerHTML =
      '<div class="orderdetail__head">' +
        '<span class="orderdetail__folio mono">' + esc(r.folio) + '</span>' +
        statusBadgeHTML(r) +
      '</div>' +
      '<p class="muted" style="font-size:.82rem;margin:.2rem 0 1rem">' + esc(fmtDate(r.created_at)) + '</p>' +
      '<div class="orderdetail__items">' + itemsHTML + '</div>' +
      '<div class="rk-row" style="margin-top:.6rem"><span>' + esc(I18N.t("myorders.detail.subtotal")) + '</span><span class="mono">' + UI.money(r.subtotal) + '</span></div>' +
      '<div class="rk-row rk-row--total"><span>' + esc(I18N.t("cart.total")) + '</span><span class="mono">' + UI.money(r.total) + '</span></div>' +
      '<div class="orderdetail__code">' +
        '<p class="muted mono" style="font-size:.78rem;margin-bottom:.3rem">' + esc(I18N.t("myorders.detail.code")) + ': ' + esc(r.folio) + '</p>' +
        '<p class="muted" style="font-size:.7rem;margin-bottom:.3rem">' + esc(I18N.t("myorders.detail.barcode")) + '</p>' +
        '<div class="rk__barcode">' + barcode + '</div>' +
      '</div>' +
      '<h3 style="font-size:.85rem;margin-top:1.2rem">' + esc(I18N.t("myorders.detail.history")) + '</h3>' +
      historyHTML(r);

    UI.modal({ title: I18N.t("myorders.detail.title"), content: content, wide: true });
  }

  /* ---------------- Información personal ---------------- */
  function infoPanelHTML() {
    var u = STORE.user || {};
    return (
      '<div class="account__view" data-info-view>' +
        '<div class="account__row"><span class="account__row-label" data-i18n="account.name">Nombre</span><span class="account__row-value" data-info-name>' + esc(u.name || "") + '</span></div>' +
        '<div class="account__row"><span class="account__row-label" data-i18n="account.email">Correo electrónico</span><span class="account__row-value" data-info-email>' + esc(u.email || "") + '</span></div>' +
        '<div class="account__row"><span class="account__row-label" data-i18n="account.memberSince">Fecha de registro</span><span class="account__row-value" data-info-created>' + esc(fmtDate(u.created_at)) + '</span></div>' +
        '<button type="button" class="btn btn--panini btn--sm" data-info-edit style="margin-top:1rem" data-i18n="account.editBtn">Editar datos</button>' +
      '</div>' +
      '<form class="account__edit" data-info-form hidden novalidate>' +
        '<div class="field"><label data-i18n="account.name">Nombre</label>' +
          '<input class="input" name="name" required maxlength="120" value="' + esc(u.name || "") + '"></div>' +
        '<div class="field"><label data-i18n="account.email">Correo electrónico</label>' +
          '<input class="input" type="email" name="email" required maxlength="160" value="' + esc(u.email || "") + '"></div>' +
        '<p class="field__error" data-info-error hidden></p>' +
        '<div style="display:flex;gap:.6rem;margin-top:.4rem">' +
          '<button type="submit" class="btn btn--neon btn--sm" data-i18n="account.saveBtn">Guardar cambios</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-info-cancel data-i18n="account.cancelEdit">Cancelar</button>' +
        '</div>' +
      '</form>'
    );
  }

  function bindInfoPanel(panel) {
    var view = $("[data-info-view]", panel);
    var form = $("[data-info-form]", panel);
    var errBox = $("[data-info-error]", panel);

    $("[data-info-edit]", panel).addEventListener("click", function () {
      view.hidden = true; form.hidden = false; errBox.hidden = true;
    });
    $("[data-info-cancel]", panel).addEventListener("click", function () {
      form.name.value = STORE.user.name; form.email.value = STORE.user.email;
      form.hidden = true; view.hidden = false; errBox.hidden = true;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      errBox.hidden = true;
      var btn = form.querySelector('button[type="submit"]');
      btn.classList.add("is-loading");
      API.put("auth/me", { name: form.name.value.trim(), email: form.email.value.trim() }).then(function (d) {
        btn.classList.remove("is-loading");
        STORE.setSession(STORE.session.token, d.user, STORE.session.branch);
        $("[data-info-name]", panel).textContent = d.user.name;
        $("[data-info-email]", panel).textContent = d.user.email;
        form.hidden = true; view.hidden = false;
        UI.toast(I18N.t("account.updateOk"), "ok");
      }).catch(function (err) {
        btn.classList.remove("is-loading");
        errBox.textContent = (err && err.message) || I18N.t("toast.error");
        errBox.hidden = false;
      });
    });
  }

  /* ---------------- Seguridad ---------------- */
  function securityPanelHTML() {
    return (
      '<form class="account__edit" data-security-form novalidate>' +
        '<h3 style="font-size:.9rem;margin-bottom:.6rem" data-i18n="account.security.title">Cambiar contraseña</h3>' +
        '<div class="field"><label data-i18n="account.security.current">Contraseña actual</label>' +
          '<input class="input" type="password" name="current_password" autocomplete="current-password" required></div>' +
        '<div class="field"><label data-i18n="account.security.new">Nueva contraseña</label>' +
          '<input class="input" type="password" name="password" autocomplete="new-password" required minlength="6"></div>' +
        '<div class="field"><label data-i18n="account.security.confirm">Confirmar nueva contraseña</label>' +
          '<input class="input" type="password" name="password_confirmation" autocomplete="new-password" required minlength="6"></div>' +
        '<p class="field__error" data-security-error hidden></p>' +
        '<button type="submit" class="btn btn--neon btn--sm" data-i18n="account.security.submit">Actualizar contraseña</button>' +
      '</form>'
    );
  }

  function bindSecurityPanel(panel) {
    var form = $("[data-security-form]", panel);
    var errBox = $("[data-security-error]", panel);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      errBox.hidden = true;
      if (form.password.value !== form.password_confirmation.value) {
        errBox.textContent = I18N.t("register.mismatch");
        errBox.hidden = false;
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.classList.add("is-loading");
      API.patch("auth/password", {
        current_password: form.current_password.value,
        password: form.password.value,
        password_confirmation: form.password_confirmation.value
      }).then(function () {
        btn.classList.remove("is-loading");
        form.reset();
        UI.toast(I18N.t("account.security.ok"), "ok");
      }).catch(function (err) {
        btn.classList.remove("is-loading");
        var fields = err && err.data && err.data.fields;
        var msg = fields && (fields.current_password || fields.password || fields.password_confirmation);
        errBox.textContent = (msg && msg[0]) || (err && err.message) || I18N.t("toast.error");
        errBox.hidden = false;
      });
    });
  }

  /* ---------------- Mis pedidos ---------------- */
  var FILTERS = ["all", "active", "preventa", "ready", "pickedUp", "cancelled"];

  function ordersPanelHTML() {
    return (
      '<div class="myorders__filters" data-orders-filters>' +
        FILTERS.map(function (f) {
          return '<button type="button" class="myorders__filter' + (f === "all" ? " is-active" : "") + '" data-filter="' + f + '" data-i18n="myorders.filter.' + f + '"></button>';
        }).join("") +
      '</div>' +
      '<div class="myorders__list" data-orders-list></div>'
    );
  }

  function bindOrdersPanel(panel) {
    var listEl = $("[data-orders-list]", panel);
    var filtersEl = $("[data-orders-filters]", panel);
    var all = [];
    var current = "all";

    function matches(r, f) {
      if (f === "all") return true;
      if (f === "active") return statusKey(r) === "preventa" || statusKey(r) === "confirmed" || statusKey(r) === "ready";
      return statusKey(r) === f;
    }

    function paint() {
      var rs = all.filter(function (r) { return matches(r, current); });
      listEl.innerHTML = rs.length ? rs.map(orderCardHTML).join("")
        : '<p class="muted" style="padding:1rem 0">' + esc(I18N.t("myorders.empty")) + '</p>';
    }

    function load() {
      listEl.innerHTML = V._loading();
      // Espera también el catálogo (memoizado, no re-descarga si ya cargó) para
      // que las imágenes de producto ya estén disponibles en el primer pintado.
      var catalogReady = (window.Catalog && Catalog.load) ? Catalog.load().catch(function () {}) : Promise.resolve();
      Promise.all([API.get("reservations/mine"), catalogReady]).then(function (res) {
        all = res[0].reservations || [];
        paint();
      }).catch(function (e) { listEl.innerHTML = V._error(e); });
    }
    load();

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      $$(".myorders__filter", filtersEl).forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      current = btn.getAttribute("data-filter");
      paint();
    });

    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-order-details]");
      if (!btn) return;
      var folio = btn.getAttribute("data-order-details");
      var r = all.filter(function (x) { return x.folio === folio; })[0];
      if (r) showOrderDetail(r);
    });
  }

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------------- Shell ---------------- */
  function render() {
    return (
      '<section class="account">' +
        '<div class="account__head">' +
          '<h1 data-i18n="account.title">Mi cuenta</h1>' +
          '<a href="#/" data-link class="mono account__back">← ' + esc(I18N.lang === "en" ? "Back to store" : "Volver a la tienda") + '</a>' +
        '</div>' +
        '<nav class="account__tabs" data-account-tabs>' +
          '<button type="button" class="account__tab is-active" data-tab="info" data-i18n="account.tab.info">Información personal</button>' +
          '<button type="button" class="account__tab" data-tab="orders" data-i18n="account.tab.orders">Mis pedidos</button>' +
          '<button type="button" class="account__tab" data-tab="security" data-i18n="account.tab.security">Seguridad</button>' +
          '<button type="button" class="account__tab account__tab--logout" data-logout data-i18n="cta.logout">Cerrar sesión</button>' +
        '</nav>' +
        '<div class="account__panel card" data-tab-panel="info">' + infoPanelHTML() + '</div>' +
        '<div class="account__panel card" data-tab-panel="orders" hidden>' + ordersPanelHTML() + '</div>' +
        '<div class="account__panel card" data-tab-panel="security" hidden>' + securityPanelHTML() + '</div>' +
      '</section>'
    );
  }

  function mount(root) {
    bindInfoPanel($('[data-tab-panel="info"]', root));
    bindSecurityPanel($('[data-tab-panel="security"]', root));
    bindOrdersPanel($('[data-tab-panel="orders"]', root));

    $("[data-account-tabs]", root).addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      TABS.forEach(function (t) {
        $('[data-tab-panel="' + t + '"]', root).hidden = t !== btn.getAttribute("data-tab");
      });
      $$(".account__tab[data-tab]", root).forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
    });

    // Refresca desde el servidor (created_at real, nombre/correo al día).
    API.get("auth/me").then(function (d) {
      STORE.setSession(STORE.session.token, d.user, d.branch || STORE.session.branch);
      var panel = $('[data-tab-panel="info"]', root);
      $("[data-info-name]", panel).textContent = d.user.name;
      $("[data-info-email]", panel).textContent = d.user.email;
      $("[data-info-created]", panel).textContent = fmtDate(d.user.created_at);
      var form = $("[data-info-form]", panel);
      form.name.value = d.user.name; form.email.value = d.user.email;
    }).catch(function () { /* si falla, se queda con lo que ya había en sesión */ });
  }

  window.Views.account = { render: render, mount: mount, roles: ["customer"] };
})();
