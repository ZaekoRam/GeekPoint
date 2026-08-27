/* =============================================================
   Vista: Módulo POS (cajero) + Ticket.  window.Views.pos / Views.ticket
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, $$ = UI.$$, esc = UI.escHTML, V = window.Views;

  var ctx = {
    branchId: null, branches: [], registers: [], categories: [],
    products: [], filter: { q: "", cat: "" }, method: "cash", loaded: false
  };

  var EMOJI = { manga: "📗", figuras: "🗿", tcg: "🃏", comics: "💥", coleccionables: "🎁" };

  function render() {
    return (
      '<div class="pos-view">' +
        '<div class="content__head" style="padding:1rem clamp(1rem,3vw,2rem) 0">' +
          '<h1>' + esc(I18N.t("pos.title")) + '</h1>' +
          '<span class="spacer"></span>' +
          '<span data-branch-slot></span>' +
          '<a class="btn btn--ghost btn--sm" href="' + esc(STORE.homeRoute()) + '" data-link>← ' + esc(I18N.t("nav.home")) + '</a>' +
          '<button class="btn btn--ghost btn--sm" data-logout>' + esc(I18N.t("cta.logout")) + '</button>' +
        '</div>' +
        '<div class="content"><div class="pos">' +
          '<div>' +
            '<div class="pos__search"><input class="input" data-q placeholder="' + esc(I18N.t("pos.search")) + '" autocomplete="off"></div>' +
            '<div class="pos__cats" data-cats></div>' +
            '<div class="pos__grid" data-grid>' + V._loading() + '</div>' +
          '</div>' +
          '<aside class="cart" data-cart></aside>' +
        '</div></div>' +
      '</div>'
    );
  }

  function mount(root) {
    var grid = $("[data-grid]", root);
    ctx.method = "cash";
    STORE.cart = STORE.cart || [];

    resolveBranch(root).then(function () {
      return Promise.all([
        API.get("categories").then(function (d) { ctx.categories = d.categories; }),
        API.get("registers" + (isAdmin() ? "?branch_id=" + ctx.branchId : "")).then(function (d) { ctx.registers = d.registers; }).catch(function () { ctx.registers = []; })
      ]);
    }).then(function () {
      renderCats(root);
      renderCart(root);
      loadProducts(root);
    }).catch(function (err) {
      grid.innerHTML = V._error(err);
    });

    // eventos
    var onQ = UI.debounce(function () {
      ctx.filter.q = $("[data-q]", root).value.trim();
      loadProducts(root);
    }, 260);
    $("[data-q]", root).addEventListener("input", onQ);

    root.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        var p = ctx.products.find(function (x) { return x.id == addBtn.getAttribute("data-add"); });
        if (p) { STORE.cartAdd(mapProduct(p)); }
        return;
      }
      var inc = e.target.closest("[data-inc]"); if (inc) return STORE.cartInc(+inc.getAttribute("data-inc"));
      var dec = e.target.closest("[data-dec]"); if (dec) return STORE.cartDec(+dec.getAttribute("data-dec"));
      var rm = e.target.closest("[data-rm]"); if (rm) return STORE.cartRemove(+rm.getAttribute("data-rm"));
      var clr = e.target.closest("[data-clear]"); if (clr) return STORE.cartClear();
      var pm = e.target.closest("[data-method]"); if (pm) { ctx.method = pm.getAttribute("data-method"); renderCart(root); return; }
      var charge = e.target.closest("[data-charge]"); if (charge) return checkout(root);
    });

    var offCart = STORE.on("cart", function () { renderCart(root); });
    var onLang = function () {
      $("[data-q]", root).setAttribute("placeholder", I18N.t("pos.search"));
      renderCats(root); renderCart(root);
      var grid = $("[data-grid]", root);
      if (ctx.products.length) grid.innerHTML = ctx.products.map(cardHTML).join("");
    };
    window.addEventListener("i18n:change", onLang);
    root.__cleanup = function () { offCart(); window.removeEventListener("i18n:change", onLang); };
  }

  function isAdmin() { return STORE.role === "admin"; }

  function resolveBranch(root) {
    var slot = $("[data-branch-slot]", root);
    if (STORE.user && STORE.user.branch_id) {
      ctx.branchId = STORE.user.branch_id;
      var bn = (STORE.session.branch && STORE.session.branch.name) || I18N.t("misc.branch");
      slot.innerHTML = '<span class="chip">' + esc(bn) + '</span>';
      return Promise.resolve();
    }
    // admin: elegir sucursal
    return API.get("branches").then(function (d) {
      ctx.branches = d.branches.filter(function (b) { return b.status === "active"; });
      ctx.branchId = ctx.branches.length ? ctx.branches[0].id : null;
      slot.innerHTML = '<select class="select" data-branch style="width:auto;min-width:160px">' +
        ctx.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("") + '</select>';
      $("[data-branch]", root).addEventListener("change", function () {
        ctx.branchId = +this.value;
        STORE.cartClear();
        API.get("registers?branch_id=" + ctx.branchId).then(function (r) { ctx.registers = r.registers; renderCart(root); });
        loadProducts(root);
      });
    });
  }

  function renderCats(root) {
    var host = $("[data-cats]", root);
    var all = '<button class="chip' + (ctx.filter.cat === "" ? " is-active" : "") + '" data-cat="">' + esc(I18N.t("pos.all")) + '</button>';
    host.innerHTML = all + ctx.categories.map(function (c) {
      return '<button class="chip' + (ctx.filter.cat == c.id ? " is-active" : "") + '" data-cat="' + c.id + '">' +
        (c.icon || "") + ' ' + esc(I18N.pick({ es: c.name_es, en: c.name_en })) + '</button>';
    }).join("");
    host.onclick = function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      ctx.filter.cat = b.getAttribute("data-cat");
      renderCats(root);
      loadProducts(root);
    };
  }

  function loadProducts(root) {
    var grid = $("[data-grid]", root);
    if (!ctx.branchId) { grid.innerHTML = '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>'; return; }
    var qs = "?status=active&limit=120&branch_id=" + ctx.branchId;
    if (ctx.filter.q) qs += "&q=" + encodeURIComponent(ctx.filter.q);
    if (ctx.filter.cat) qs += "&category_id=" + ctx.filter.cat;
    API.get("products" + qs).then(function (d) {
      ctx.products = d.products;
      grid.innerHTML = d.products.length ? d.products.map(cardHTML).join("")
        : '<div class="state"><div class="state__icon">🔍</div><p>' + esc(I18N.t("empty.none")) + '</p></div>';
    }).catch(function (err) { grid.innerHTML = V._error(err); });
  }

  function cardHTML(p) {
    var art = EMOJI[p.category_slug] || "📦";
    var cls = "prod" + (p.stock === 0 ? " is-out" : (p.low_stock ? " is-low" : ""));
    return (
      '<button class="' + cls + '" data-add="' + p.id + '">' +
        '<span class="prod__art">' + art + '</span>' +
        '<span class="prod__name">' + esc(p.name) + '</span>' +
        '<span class="prod__meta">' +
          '<span class="prod__price">' + UI.money(p.price) + '</span>' +
          '<span class="prod__stock">' + (p.stock === 0 ? esc(I18N.t("pos.outOfStock")) : (p.stock + " u")) + '</span>' +
        '</span>' +
      '</button>'
    );
  }

  function mapProduct(p) {
    return {
      id: p.id, name: p.name, sku: p.sku, price: p.price, tax_rate: p.tax_rate,
      stock: p.stock, art: EMOJI[p.category_slug] || "📦"
    };
  }

  function renderCart(root) {
    var host = $("[data-cart]", root);
    var t = STORE.cartTotals();
    var items = STORE.cart;

    var itemsHTML = items.length ? items.map(function (l) {
      return (
        '<div class="citem">' +
          '<div><div class="citem__name">' + esc(l.name) + '</div>' +
            '<div class="citem__sub">' + UI.money(l.price) + ' · ' + esc(l.sku) + '</div></div>' +
          '<div class="citem__qty">' +
            '<button class="qbtn" data-dec="' + l.id + '">−</button>' +
            '<span class="mono">' + l.qty + '</span>' +
            '<button class="qbtn" data-inc="' + l.id + '">+</button>' +
          '</div>' +
          '<div class="citem__line num">' + UI.money(l.price * l.qty) + '</div>' +
          '<button class="citem__rm" data-rm="' + l.id + '" title="✕">✕</button>' +
        '</div>'
      );
    }).join("") : '<p class="muted" style="padding:1rem 0">' + esc(I18N.t("pos.empty")) + '</p>';

    var regSel = ctx.registers.length
      ? '<div class="field"><label>' + esc(I18N.t("pos.register")) + '</label><select class="select" data-register>' +
        '<option value="">—</option>' + ctx.registers.filter(function (r) { return r.status === "active"; })
          .map(function (r) { return '<option value="' + r.id + '">' + esc(r.name) + '</option>'; }).join("") + '</select></div>'
      : "";

    var methods = ["cash", "card", "transfer"].map(function (m) {
      return '<button class="chip' + (ctx.method === m ? " is-active" : "") + '" data-method="' + m + '">' + esc(I18N.t("method." + m)) + '</button>';
    }).join("");

    var cashRow = ctx.method === "cash"
      ? '<div class="field"><label>' + esc(I18N.t("pos.received")) + '</label>' +
        '<input class="input" type="number" min="0" step="0.01" data-paid placeholder="' + t.total.toFixed(2) + '"></div>' +
        '<div class="cart__totals"><div class="row"><span>' + esc(I18N.t("pos.change")) + '</span><span data-change>' + UI.money(0) + '</span></div></div>'
      : "";

    host.innerHTML =
      '<h2>' + esc(I18N.t("pos.cart")) + (t.count ? ' · <span class="mono">' + t.count + '</span>' : "") + '</h2>' +
      '<div class="cart__items">' + itemsHTML + '</div>' +
      '<div class="cart__totals">' +
        '<div class="row"><span>' + esc(I18N.t("pos.subtotal")) + '</span><span class="num">' + UI.money(t.subtotal) + '</span></div>' +
        '<div class="row"><span>' + esc(I18N.t("pos.tax")) + ' (16%)</span><span class="num">' + UI.money(t.tax) + '</span></div>' +
        '<div class="row row--total"><span>' + esc(I18N.t("pos.total")) + '</span><span class="num" data-total>' + UI.money(t.total) + '</span></div>' +
      '</div>' +
      '<div class="field" style="margin-top:.6rem"><label>' + esc(I18N.t("pos.customer")) + '</label><input class="input" data-customer></div>' +
      regSel +
      '<label class="muted mono" style="font-size:.7rem">' + esc(I18N.t("pos.paidWith")) + '</label>' +
      '<div class="pay-methods">' + methods + '</div>' +
      cashRow +
      '<div style="display:flex;gap:.5rem;margin-top:.4rem">' +
        '<button class="btn btn--ghost btn--sm" data-clear ' + (items.length ? "" : "disabled") + '>' + esc(I18N.t("btn.clear")) + '</button>' +
        '<button class="btn btn--neon btn--block" data-charge ' + (items.length ? "" : "disabled") + '>' + esc(I18N.t("btn.charge")) + ' · ' + UI.money(t.total) + '</button>' +
      '</div>';

    var paid = $("[data-paid]", host);
    if (paid) {
      paid.addEventListener("input", function () {
        var change = (parseFloat(paid.value) || 0) - t.total;
        $("[data-change]", host).textContent = UI.money(change > 0 ? change : 0);
      });
    }
  }

  function checkout(root) {
    var host = $("[data-cart]", root);
    var t = STORE.cartTotals();
    if (!STORE.cart.length) return;

    var method = ctx.method;
    var paidInput = $("[data-paid]", host);
    var amountPaid = paidInput && paidInput.value ? parseFloat(paidInput.value) : t.total;
    if (method === "cash" && amountPaid < t.total) {
      UI.toast(I18N.t("pos.needPayment"), "warn");
      return;
    }
    var regEl = $("[data-register]", host);
    var payload = {
      branch_id: ctx.branchId,
      register_id: regEl && regEl.value ? +regEl.value : null,
      customer_name: ($("[data-customer]", host) || {}).value || "",
      payment_method: method,
      amount_paid: amountPaid,
      items: STORE.cart.map(function (l) { return { product_id: l.id, quantity: l.qty }; })
    };

    var btn = $("[data-charge]", host);
    btn.classList.add("is-loading");
    API.post("sales", payload).then(function (d) {
      btn.classList.remove("is-loading");
      STORE.cartClear();
      UI.toast(I18N.t("pos.done") + " · " + d.sale.folio, "ok");
      showTicketModal(d.sale);
      loadProducts(root);
    }).catch(function (err) {
      btn.classList.remove("is-loading");
      UI.toast(err.message || I18N.t("toast.error"), "error");
      loadProducts(root);
    });
  }

  /* ---------------- Ticket ---------------- */
  function ticketHTML(s) {
    var loc = I18N.lang === "en" ? "en-US" : "es-MX";
    var rows = (s.items || []).map(function (it) {
      return '<div class="t-row"><span>' + it.quantity + '× ' + esc(it.product_name) + '</span><span>' + UI.money(it.line_total) + '</span></div>';
    }).join("");
    return (
      '<div class="ticket">' +
        '<h2>◈ GEEKPOINT POS</h2>' +
        '<p style="text-align:center" class="muted">' + esc(s.branch_name || "") + '<br>' + esc(s.branch_address || "") + '</p>' +
        '<hr>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.folio")) + '</span><span>' + esc(s.folio) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.date")) + '</span><span>' + UI.fmtDate(s.created_at, true) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.cashier")) + '</span><span>' + esc(s.cashier_name || "") + '</span></div>' +
        (s.register_name ? '<div class="t-row"><span>' + esc(I18N.t("pos.register")) + '</span><span>' + esc(s.register_name) + '</span></div>' : "") +
        '<hr>' + rows + '<hr>' +
        '<div class="t-row"><span>' + esc(I18N.t("pos.subtotal")) + '</span><span>' + UI.money(s.subtotal) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("pos.tax")) + '</span><span>' + UI.money(s.tax) + '</span></div>' +
        '<div class="t-row t-row--total"><span>' + esc(I18N.t("pos.total")) + '</span><span>' + UI.money(s.total) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("method." + s.payment_method)) + '</span><span>' + UI.money(s.amount_paid) + '</span></div>' +
        (s.payment_method === "cash" ? '<div class="t-row"><span>' + esc(I18N.t("pos.change")) + '</span><span>' + UI.money(s.change_due) + '</span></div>' : "") +
        '<hr><p style="text-align:center">' + esc(I18N.t("ticket.thanks")) + '</p>' +
      '</div>'
    );
  }

  function showTicketModal(s) {
    var wrap = document.createElement("div");
    wrap.innerHTML = ticketHTML(s) +
      '<div class="ticket__actions">' +
        '<button class="btn btn--ghost btn--sm" onclick="window.print()">' + esc(I18N.t("btn.print")) + '</button>' +
        '<a class="btn btn--neon btn--sm" href="#/ticket/' + s.id + '" data-link>' + esc(I18N.t("btn.viewTicket")) + '</a>' +
      '</div>';
    UI.modal({ content: wrap });
    wrap.querySelector("[data-link]").addEventListener("click", UI.closeModal);
  }

  // Vista ruta #/ticket/:id
  var ticketView = {
    roles: ["cashier", "manager", "admin"],
    render: function () { return '<div class="ticket-wrap">' + V._loading() + '</div>'; },
    mount: function (root, params) {
      var host = $(".ticket-wrap", root);
      API.get("sales/" + params.id).then(function (d) {
        host.innerHTML = ticketHTML(d.sale) +
          '<div class="ticket__actions">' +
            '<button class="btn btn--ghost btn--sm" onclick="window.print()">' + esc(I18N.t("btn.print")) + '</button>' +
            '<a class="btn btn--neon btn--sm" href="#/pos" data-link>' + esc(I18N.t("ticket.back")) + '</a>' +
          '</div>';
      }).catch(function (err) { host.innerHTML = V._error(err); });
    }
  };

  V.pos = { render: render, mount: mount, roles: ["cashier", "manager", "admin"] };
  V.ticket = ticketView;
})();
