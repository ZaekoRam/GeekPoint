/* =============================================================
   Vista: Panel de Gerencia.  window.Views.manager
   Subrutas: #/manager  /products  /registers  /inventory  /sales
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, esc = UI.escHTML, V = window.Views;

  var NAV = [
    { href: "#/manager", i18n: "nav.overview", ico: "▦" },
    { href: "#/manager/products", i18n: "nav.products", ico: "📚" },
    { href: "#/manager/registers", i18n: "nav.registers", ico: "🖥️" },
    { href: "#/manager/inventory", i18n: "nav.inventory", ico: "📦" },
    { href: "#/manager/sales", i18n: "nav.sales", ico: "🧾" }
  ];

  var _categories = null;
  function categories() {
    if (_categories) return Promise.resolve(_categories);
    return API.get("categories").then(function (d) { _categories = d.categories; return _categories; });
  }

  function activeHref(sub) {
    return sub ? "#/manager/" + sub : "#/manager";
  }

  function render(params) {
    var sub = (params && params.sub) || "";
    var head = "";
    if (sub === "products") head = '<button class="btn btn--neon btn--sm" data-new-product>+ ' + esc(I18N.t("btn.newProduct")) + '</button>';
    if (sub === "registers") head = '<button class="btn btn--neon btn--sm" data-new-register>+ ' + esc(I18N.t("btn.newRegister")) + '</button>';
    return V._shell({
      title: I18N.t("manager.title"),
      active: activeHref(sub),
      nav: NAV,
      headExtra: head + ' <a class="btn btn--violet btn--sm" href="#/pos" data-link>' + esc(I18N.t("nav.pos")) + '</a>',
      body: V._loading()
    });
  }

  function mount(root, params) {
    var sub = (params && params.sub) || "";
    var panel = $("[data-panel]", root);
    var loaders = { "": overview, "products": products, "registers": registers, "inventory": inventory, "sales": sales };
    (loaders[sub] || overview)(panel, root);
  }

  var branchId = function () {
    var u = STORE.user;
    return u && u.branch_id;
  };

  /* ---------------- Overview ---------------- */
  function overview(panel) {
    panel.innerHTML = V._loading();
    var bid = branchId();
    if (!bid) { panel.innerHTML = V._error({ message: I18N.t("toast.error") }); return; }
    API.get("reports/branch/" + bid).then(function (d) {
      var k = d.kpis;
      panel.innerHTML =
        V._kpi([
          { label: I18N.t("kpi.salesToday"), value: UI.money(k.sales_today_total), foot: k.sales_today_count + " " + I18N.t("col.tickets").toLowerCase(), mod: "kpi--accent" },
          { label: I18N.t("kpi.salesMonth"), value: UI.money(k.sales_month_total), foot: k.sales_month_count + " " + I18N.t("col.tickets").toLowerCase() },
          { label: I18N.t("kpi.products"), value: k.products_active, mono: true },
          { label: I18N.t("kpi.lowStock"), value: k.low_stock, mono: true, mod: k.low_stock ? "kpi--warn" : "" },
          { label: I18N.t("kpi.registers"), value: k.registers_active, mono: true },
          { label: I18N.t("kpi.invValue"), value: UI.money(k.inventory_value) }
        ]) +
        '<div class="grid-2 mt">' +
          '<div class="card"><h2 class="mono" style="font-size:.9rem;color:var(--faint)">' + esc(I18N.t("misc.last14")) + '</h2>' + V._bars(d.sales_series, { labels: true }) + '</div>' +
          '<div class="card"><h2 class="mono" style="font-size:.9rem;color:var(--faint)">' + esc(I18N.t("misc.cashierRank")) + '</h2>' +
            '<div class="stack-list mt">' + (d.by_cashier.length ? d.by_cashier.map(function (c) {
              return '<div class="linerow"><span>' + esc(c.name) + '</span><span class="mono">' + c.month_count + ' · ' + UI.money(c.month_total) + '</span></div>';
            }).join("") : '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>') + '</div></div>' +
        '</div>' +
        '<h2 class="mt mono" style="font-size:.9rem;color:var(--faint);margin-bottom:.6rem">' + esc(I18N.t("misc.recentSales")) + '</h2>' +
        V._table([
          { key: "folio", label: I18N.t("col.folio"), render: function (r) { return '<a class="mono" href="#/ticket/' + r.id + '" data-link>' + esc(r.folio) + '</a>'; } },
          { key: "cashier_name", label: I18N.t("col.cashier"), render: function (r) { return esc(r.cashier_name); } },
          { key: "payment_method", label: I18N.t("col.method"), render: function (r) { return '<span class="badge">' + esc(I18N.t("method." + r.payment_method)) + '</span>'; } },
          { key: "total", label: I18N.t("col.total"), cls: "num right", render: function (r) { return UI.money(r.total); } },
          { key: "created_at", label: I18N.t("col.date"), render: function (r) { return '<span class="muted" style="font-size:.78rem">' + UI.fmtDate(r.created_at, true) + '</span>'; } }
        ], d.recent_sales);
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  /* ---------------- Products CRUD + stock ---------------- */
  function products(panel, root) {
    panel.innerHTML = V._loading();
    Promise.all([API.get("products?status=all&limit=200"), categories()]).then(function (res) {
      var list = res[0].products, cats = res[1];
      var toolbar = '<div class="toolbar">' +
        '<input class="input" data-q placeholder="' + esc(I18N.t("pos.search")) + '">' +
        '<select class="select" data-cat><option value="">' + esc(I18N.t("pos.all")) + '</option>' +
        cats.map(function (c) { return '<option value="' + c.id + '">' + esc(I18N.pick({ es: c.name_es, en: c.name_en })) + '</option>'; }).join("") + '</select>' +
        '<label class="chip"><input type="checkbox" data-low style="margin-right:.3rem">' + esc(I18N.t("col.lowstock")) + '</label>' +
        '</div><div data-tbl></div>';
      panel.innerHTML = toolbar;

      function draw() {
        var q = ($("[data-q]", panel).value || "").toLowerCase();
        var cat = $("[data-cat]", panel).value;
        var low = $("[data-low]", panel).checked;
        var rows = list.filter(function (p) {
          if (cat && p.category_id != cat) return false;
          if (low && !p.low_stock) return false;
          if (q && (p.name + " " + p.sku).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        $("[data-tbl]", panel).innerHTML = V._table([
          { key: "name", label: I18N.t("col.product"), render: function (r) { return '<b>' + esc(r.name) + '</b><br><span class="mono muted" style="font-size:.7rem">' + esc(r.sku) + '</span>'; } },
          { key: "category_es", label: I18N.t("col.category"), render: function (r) { return esc(I18N.pick({ es: r.category_es, en: r.category_en }) || "—"); } },
          { key: "price", label: I18N.t("col.price"), cls: "num right", render: function (r) { return UI.money(r.price); } },
          { key: "stock", label: I18N.t("col.stock"), cls: "num", render: function (r) { return '<span class="badge ' + (r.stock === 0 ? "badge--danger" : (r.low_stock ? "badge--warn" : "badge--ok")) + '">' + r.stock + '</span>'; } },
          { key: "min_stock", label: I18N.t("col.min"), cls: "num" },
          { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
          { key: "id", label: I18N.t("col.actions"), render: function (r) {
            return '<div class="rowacts">' +
              '<button class="iconbtn" data-adjust="' + r.id + '" title="' + esc(I18N.t("btn.adjust")) + '">±</button>' +
              '<button class="iconbtn" data-edit="' + r.id + '" title="' + esc(I18N.t("btn.edit")) + '">✎</button>' +
              '<button class="iconbtn iconbtn--danger" data-del="' + r.id + '" title="' + esc(I18N.t("btn.delete")) + '">🗑</button>' +
            '</div>';
          } }
        ], rows);
      }
      draw();

      ["[data-q]", "[data-cat]", "[data-low]"].forEach(function (sel) {
        $(sel, panel).addEventListener("input", draw);
        $(sel, panel).addEventListener("change", draw);
      });

      panel.addEventListener("click", function (e) {
        var ed = e.target.closest("[data-edit]"), aj = e.target.closest("[data-adjust]"), dl = e.target.closest("[data-del]");
        var find = function (btn, a) { return list.find(function (p) { return p.id == btn.getAttribute(a); }); };
        if (ed) productForm(find(ed, "data-edit"), cats, function () { products(panel, root); });
        if (aj) adjustForm(find(aj, "data-adjust"), function () { products(panel, root); });
        if (dl) {
          var p = find(dl, "data-del");
          UI.confirm(I18N.t("confirm.delete", { name: p.name }), function () {
            API.del("products/" + p.id).then(function (r) {
              UI.toast(r && r.message ? r.message : I18N.t("toast.deleted"), "ok"); products(panel, root);
            }).catch(V._apiToast);
          }, { danger: true });
        }
      });
      var nb = root.querySelector("[data-new-product]");
      if (nb) nb.onclick = function () { productForm(null, cats, function () { products(panel, root); }); };
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  function productForm(p, cats, done) {
    p = p || {};
    var catOpts = '<option value="">—</option>' + cats.map(function (c) {
      return '<option value="' + c.id + '"' + (p.category_id == c.id ? " selected" : "") + '>' + esc(I18N.pick({ es: c.name_es, en: c.name_en })) + '</option>';
    }).join("");
    var f = document.createElement("form");
    f.innerHTML =
      V._formRow(I18N.t("col.sku"), '<input class="input" name="sku" required value="' + esc(p.sku || "") + '">') +
      V._formRow(I18N.t("col.name"), '<input class="input" name="name" required value="' + esc(p.name || "") + '">') +
      V._formRow(I18N.t("col.category"), '<select class="select" name="category_id">' + catOpts + '</select>') +
      V._formRow(I18N.t("form.description"), '<textarea class="textarea" name="description">' + esc(p.description || "") + '</textarea>') +
      '<div class="grid-2">' +
        V._formRow(I18N.t("col.price"), '<input class="input" type="number" min="0" step="0.01" name="price" required value="' + (p.price != null ? p.price : "") + '">') +
        V._formRow(I18N.t("form.taxRate"), '<input class="input" type="number" min="0" max="1" step="0.001" name="tax_rate" value="' + (p.tax_rate != null ? p.tax_rate : "0.16") + '">') +
      '</div>' +
      '<div class="grid-2">' +
        V._formRow(I18N.t("form.minStock"), '<input class="input" type="number" min="0" name="min_stock" value="' + (p.min_stock != null ? p.min_stock : 3) + '">') +
        (p.id ? "" : V._formRow(I18N.t("form.initialStock"), '<input class="input" type="number" min="0" name="stock" value="0">')) +
      '</div>' +
      (p.id ? V._formRow(I18N.t("col.status"),
        '<select class="select" name="status"><option value="active"' + (p.status === "active" ? " selected" : "") + '>' + esc(I18N.t("status.active")) + '</option>' +
        '<option value="inactive"' + (p.status === "inactive" ? " selected" : "") + '>' + esc(I18N.t("status.inactive")) + '</option></select>') : "") +
      V._formButtons();
    UI.modal({ title: I18N.t(p.id ? "btn.edit" : "btn.newProduct"), content: f });
    V._bindForm(f, function (payload) {
      if (!payload.category_id) delete payload.category_id;
      var req = p.id ? API.put("products/" + p.id, payload) : API.post("products", payload);
      return req.then(function () { UI.toast(I18N.t(p.id ? "toast.saved" : "toast.created"), "ok"); UI.closeModal(); done(); });
    });
  }

  function adjustForm(p, done) {
    var f = document.createElement("form");
    f.innerHTML =
      '<p class="muted" style="margin-bottom:1rem">' + esc(p.name) + ' — ' + esc(I18N.t("col.stock")) + ': <b class="mono">' + p.stock + '</b></p>' +
      V._formRow(I18N.t("form.adjustMode"),
        '<select class="select" name="mode"><option value="set">' + esc(I18N.t("form.setTo")) + '</option><option value="delta">' + esc(I18N.t("form.addRemove")) + '</option></select>') +
      V._formRow(I18N.t("form.quantity"), '<input class="input" type="number" step="1" name="value" required value="' + p.stock + '">') +
      V._formRow(I18N.t("form.note"), '<input class="input" name="note">') +
      V._formButtons();
    UI.modal({ title: I18N.t("btn.adjust"), content: f });
    V._bindForm(f, function (payload) {
      return API.patch("products/" + p.id + "/stock", payload).then(function () {
        UI.toast(I18N.t("toast.stockAdjusted"), "ok"); UI.closeModal(); done();
      });
    });
  }

  /* ---------------- Registers ---------------- */
  function registers(panel, root) {
    panel.innerHTML = V._loading();
    API.get("registers").then(function (d) {
      panel.innerHTML = V._table([
        { key: "name", label: I18N.t("col.register"), render: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
        { key: "id", label: I18N.t("col.actions"), render: function (r) {
          return '<button class="iconbtn iconbtn--danger" data-del="' + r.id + '" title="' + esc(I18N.t("btn.delete")) + '">🗑</button>';
        } }
      ], d.registers);
      panel.onclick = function (e) {
        var dl = e.target.closest("[data-del]");
        if (!dl) return;
        var reg = d.registers.find(function (x) { return x.id == dl.getAttribute("data-del"); });
        UI.confirm(I18N.t("confirm.delete", { name: reg.name }), function () {
          API.del("registers/" + reg.id).then(function (r) {
            UI.toast(r && r.message ? r.message : I18N.t("toast.deleted"), "ok"); registers(panel, root);
          }).catch(V._apiToast);
        }, { danger: true });
      };
      var nb = root.querySelector("[data-new-register]");
      if (nb) nb.onclick = function () {
        var f = document.createElement("form");
        f.innerHTML = V._formRow(I18N.t("col.name"), '<input class="input" name="name" required>') + V._formButtons();
        UI.modal({ title: I18N.t("btn.newRegister"), content: f });
        V._bindForm(f, function (payload) {
          return API.post("registers", payload).then(function () { UI.toast(I18N.t("toast.created"), "ok"); UI.closeModal(); registers(panel, root); });
        });
      };
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  /* ---------------- Inventory (alertas + movimientos) ---------------- */
  function inventory(panel) {
    panel.innerHTML = V._loading();
    Promise.all([API.get("inventory/alerts"), API.get("inventory/movements?limit=80")]).then(function (res) {
      panel.innerHTML =
        '<h2 class="mono" style="font-size:.9rem;color:var(--faint);margin-bottom:.6rem">' + esc(I18N.t("misc.alerts")) + '</h2>' +
        V._table([
          { key: "name", label: I18N.t("col.product"), render: function (r) { return '<b>' + esc(r.name) + '</b><br><span class="mono muted" style="font-size:.7rem">' + esc(r.sku) + '</span>'; } },
          { key: "stock", label: I18N.t("col.stock"), cls: "num", render: function (r) { return '<span class="badge ' + (r.out_of_stock ? "badge--danger" : "badge--warn") + '">' + r.stock + '</span>'; } },
          { key: "min_stock", label: I18N.t("col.min"), cls: "num" },
          { key: "price", label: I18N.t("col.price"), cls: "num right", render: function (r) { return UI.money(r.price); } }
        ], res[0].alerts, { empty: I18N.t("empty.none") }) +
        '<h2 class="mono" style="font-size:.9rem;color:var(--faint);margin:1.4rem 0 .6rem">' + esc(I18N.t("misc.movements")) + '</h2>' +
        V._table([
          { key: "created_at", label: I18N.t("col.date"), render: function (r) { return '<span class="muted" style="font-size:.78rem">' + UI.fmtDate(r.created_at, true) + '</span>'; } },
          { key: "product_name", label: I18N.t("col.product"), render: function (r) { return esc(r.product_name || "—"); } },
          { key: "type", label: I18N.t("col.movement"), render: function (r) { return '<span class="badge">' + esc(r.type) + '</span>'; } },
          { key: "quantity_delta", label: I18N.t("col.delta"), cls: "num", render: function (r) { return (r.quantity_delta > 0 ? "+" : "") + r.quantity_delta; } },
          { key: "resulting_stock", label: I18N.t("col.result"), cls: "num" },
          { key: "reference", label: I18N.t("col.folio"), render: function (r) { return '<span class="mono" style="font-size:.75rem">' + esc(r.reference || "") + '</span>'; } }
        ], res[1].movements, { empty: I18N.t("empty.none") });
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  /* ---------------- Sales history ---------------- */
  function sales(panel) {
    panel.innerHTML = V._loading();
    API.get("sales?limit=100").then(function (d) {
      panel.innerHTML = V._table([
        { key: "folio", label: I18N.t("col.folio"), render: function (r) { return '<a class="mono" href="#/ticket/' + r.id + '" data-link>' + esc(r.folio) + '</a>'; } },
        { key: "cashier_name", label: I18N.t("col.cashier"), render: function (r) { return esc(r.cashier_name); } },
        { key: "items_count", label: I18N.t("col.qty"), cls: "num" },
        { key: "payment_method", label: I18N.t("col.method"), render: function (r) { return '<span class="badge">' + esc(I18N.t("method." + r.payment_method)) + '</span>'; } },
        { key: "total", label: I18N.t("col.total"), cls: "num right", render: function (r) { return UI.money(r.total); } },
        { key: "created_at", label: I18N.t("col.date"), render: function (r) { return '<span class="muted" style="font-size:.78rem">' + UI.fmtDate(r.created_at, true) + '</span>'; } }
      ], d.sales);
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  V.manager = { render: render, mount: mount, roles: ["manager"] };
})();
