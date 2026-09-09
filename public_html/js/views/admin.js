/* =============================================================
   Vista: Panel del Administrador General.  window.Views.admin
   Subrutas:  #/admin  #/admin/branches  #/admin/users  #/admin/inventory
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, $$ = UI.$$, esc = UI.escHTML, V = window.Views;

  var NAV = [
    { href: "#/admin", i18n: "nav.overview", ico: "▦" },
    { href: "#/admin/branches", i18n: "nav.branches", ico: "🏬" },
    { href: "#/admin/users", i18n: "nav.users", ico: "👥" },
    { href: "#/admin/registers", i18n: "nav.registers", ico: "🖥️" },
    { href: "#/admin/inventory", i18n: "nav.inventory", ico: "📦" }
  ];

  function activeHref(sub) {
    if (sub === "branches") return "#/admin/branches";
    if (sub === "users") return "#/admin/users";
    if (sub === "registers") return "#/admin/registers";
    if (sub === "inventory") return "#/admin/inventory";
    return "#/admin";
  }

  function render(params) {
    var sub = (params && params.sub) || "";
    var head = "";
    if (sub === "branches") head = '<button class="btn btn--neon btn--sm" data-new-branch>+ ' + esc(I18N.t("btn.newBranch")) + '</button>';
    if (sub === "users") head = '<button class="btn btn--neon btn--sm" data-new-user>+ ' + esc(I18N.t("btn.newUser")) + '</button>';
    if (sub === "registers") head = '<button class="btn btn--neon btn--sm" data-new-register>+ ' + esc(I18N.t("btn.newRegister")) + '</button>';
    if (sub === "inventory") head =
      '<button class="btn btn--neon btn--sm" data-new-product>+ ' + esc(I18N.t("prodadm.new")) + '</button>' +
      '<button class="btn btn--ghost btn--sm" data-import-pkm>+ ' + esc(I18N.t("pkm.add")) + '</button>' +
      '<button class="btn btn--ghost btn--sm" data-import-figure>+ ' + esc(I18N.t("fig.add")) + '</button>';
    return V._shell({
      title: I18N.t("admin.title"),
      active: activeHref(sub),
      nav: NAV,
      headExtra: head,
      body: V._loading()
    });
  }

  function mount(root, params) {
    var sub = (params && params.sub) || "";
    var panel = $("[data-panel]", root);

    var loaders = { "": overview, "branches": branches, "users": users, "registers": registers, "inventory": inventory };
    var fn = loaders[sub] || overview;
    fn(panel, root);

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-reload]")) fn(panel, root);
    });
  }

  /* ---------------- Overview ---------------- */
  function overview(panel) {
    panel.innerHTML = V._loading();
    API.get("reports/overview").then(function (d) {
      var k = d.kpis;
      panel.innerHTML =
        V._kpi([
          { label: I18N.t("kpi.salesToday"), value: UI.money(k.sales_today_total), foot: k.sales_today_count + " " + I18N.t("col.tickets").toLowerCase(), mod: "kpi--accent" },
          { label: I18N.t("kpi.salesMonth"), value: UI.money(k.sales_month_total), foot: k.sales_month_count + " " + I18N.t("col.tickets").toLowerCase() },
          { label: I18N.t("kpi.branchesActive"), value: k.branches_active + " / " + k.branches_total, mono: true, href: "#/admin/branches" },
          { label: I18N.t("kpi.users"), value: k.users_total, mono: true, href: "#/admin/users" },
          { label: I18N.t("kpi.products"), value: k.products_total, mono: true, href: "#/admin/inventory" },
          { label: I18N.t("kpi.lowStock"), value: k.low_stock_total, mono: true, mod: k.low_stock_total ? "kpi--warn" : "", href: "#/admin/inventory" }
        ]) +
        '<div class="grid-2 mt">' +
          '<div class="card"><h2 class="mono" style="font-size:.9rem;color:var(--faint)">' + esc(I18N.t("misc.last14")) + '</h2>' +
            V._bars(d.sales_series, { labels: true }) + '</div>' +
          '<div class="card"><h2 class="mono" style="font-size:.9rem;color:var(--faint)">' + esc(I18N.t("col.top")) + '</h2>' +
            '<div class="stack-list mt">' + (d.top_products.length ? d.top_products.map(function (p) {
              return '<div class="linerow"><span>' + esc(p.product_name) + '</span><span class="mono">' + p.qty + ' · ' + UI.money(p.revenue) + '</span></div>';
            }).join("") : '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>') + '</div>' +
          '</div>' +
        '</div>' +
        '<h2 class="mt mono" style="font-size:.9rem;color:var(--faint);margin-bottom:.6rem">' + esc(I18N.t("col.branch")) + '</h2>' +
        V._table([
          { key: "name", label: I18N.t("col.branch"), render: function (r) { return '<b>' + esc(r.name) + '</b><br><span class="muted mono" style="font-size:.7rem">' + esc(r.code) + '</span>'; } },
          { key: "city", label: I18N.t("col.city"), render: function (r) { return esc(r.city); } },
          { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
          { key: "today_total", label: I18N.t("col.today"), cls: "num center", render: function (r) { return UI.money(r.today_total, true); } },
          { key: "month_total", label: I18N.t("col.month"), cls: "num center", render: function (r) { return UI.money(r.month_total, true); } },
          { key: "month_count", label: I18N.t("col.tickets"), cls: "num center", render: function (r) { return r.month_count; } },
          { key: "low_stock", label: I18N.t("col.lowstock"), cls: "num center", render: function (r) { return r.low_stock ? '<span class="badge badge--warn">' + r.low_stock + '</span>' : '0'; } }
        ], d.by_branch);
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  /* ---------------- Branches CRUD ---------------- */
  function branches(panel, root) {
    panel.innerHTML = V._loading();
    API.get("branches").then(function (d) {
      panel.innerHTML = V._table([
        { key: "code", label: I18N.t("form.branchCode"), render: function (r) { return '<span class="mono">' + esc(r.code) + '</span>'; } },
        { key: "name", label: I18N.t("col.branch"), render: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { key: "city", label: I18N.t("col.city"), render: function (r) { return esc([r.city, r.state].filter(Boolean).join(", ")); } },
        { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
        { key: "products", label: I18N.t("nav.products"), cls: "num", render: function (r) { return r.products || 0; } },
        { key: "id", label: I18N.t("col.actions"), render: function (r) {
          return '<div class="rowacts">' +
            '<button class="iconbtn" data-edit="' + r.id + '" title="' + esc(I18N.t("btn.edit")) + '">✎</button>' +
            '<button class="iconbtn" data-toggle="' + r.id + '" data-status="' + r.status + '" title="' + esc(I18N.t(r.status === "active" ? "btn.deactivate" : "btn.activate")) + '">' + (r.status === "active" ? "⏸" : "▶") + '</button>' +
            V._delButton({ attr: "data-del", value: r.id, name: r.name }) +
          '</div>';
        } }
      ], d.branches);

      var list = d.branches;
      panel.onclick = function (e) {
        var ed = e.target.closest("[data-edit]");
        var tg = e.target.closest("[data-toggle]");
        var dl = e.target.closest("[data-del]");
        if (ed) branchForm(list.find(function (b) { return b.id == ed.getAttribute("data-edit"); }), function () { branches(panel, root); });
        if (tg) {
          var ns = tg.getAttribute("data-status") === "active" ? "inactive" : "active";
          API.patch("branches/" + tg.getAttribute("data-toggle") + "/status", { status: ns })
            .then(function () { UI.toast(I18N.t("toast.saved"), "ok"); branches(panel, root); })
            .catch(apiToast);
        }
        if (dl) {
          var b = list.find(function (x) { return x.id == dl.getAttribute("data-del"); });
          UI.confirm(I18N.t("confirm.delete", { name: b.name }), function () {
            API.del("branches/" + b.id).then(function () { UI.toast(I18N.t("toast.deleted"), "ok"); branches(panel, root); }).catch(apiToast);
          }, { danger: true });
        }
      };
      root.querySelector("[data-new-branch]") && (root.querySelector("[data-new-branch]").onclick = function () {
        branchForm(null, function () { branches(panel, root); });
      });
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  function branchForm(b, done) {
    b = b || {};
    var c = document.createElement("form");
    c.innerHTML =
      row("branchCode", '<input class="input" name="code" required value="' + esc(b.code || "") + '">') +
      row("branchName", '<input class="input" name="name" required value="' + esc(b.name || "") + '">') +
      '<div class="grid-2">' +
        row("city", '<input class="input" name="city" value="' + esc(b.city || "") + '">') +
        row("state", '<input class="input" name="state" value="' + esc(b.state || "") + '">') +
      '</div>' +
      row("address", '<input class="input" name="address" value="' + esc(b.address || "") + '">') +
      row("phone", '<input class="input" name="phone" value="' + esc(b.phone || "") + '">') +
      row("hours", '<input class="input" name="hours" placeholder="Lun–Dom 11:00–21:00" value="' + esc(b.hours || "") + '">') +
      formButtons();
    var m = UI.modal({ title: I18N.t(b.id ? "btn.edit" : "btn.newBranch"), content: c });
    bindForm(c, m, function (payload) {
      var p = b.id ? API.put("branches/" + b.id, payload) : API.post("branches", payload);
      return p.then(function () { UI.toast(I18N.t(b.id ? "toast.saved" : "toast.created"), "ok"); UI.closeModal(); done(); });
    });
  }

  /* ---------------- Users CRUD ---------------- */
  function users(panel, root) {
    panel.innerHTML = V._loading();
    Promise.all([API.get("users"), API.get("branches")]).then(function (res) {
      var list = res[0].users, brs = res[1].branches;
      panel.innerHTML = V._table([
        { key: "name", label: I18N.t("col.name"), render: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { key: "email", label: I18N.t("col.email"), render: function (r) { return '<span class="mono" style="font-size:.78rem">' + esc(r.email) + '</span>'; } },
        { key: "role", label: I18N.t("col.role"), render: function (r) { return '<span class="badge badge--violet">' + esc(I18N.t("role." + r.role)) + '</span>'; } },
        { key: "branch_name", label: I18N.t("misc.branch"), render: function (r) { return esc(r.branch_name || "—"); } },
        { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
        { key: "last_login_at", label: I18N.t("col.lastlogin"), render: function (r) { return '<span class="muted" style="font-size:.78rem">' + UI.fmtDate(r.last_login_at, true) + '</span>'; } },
        { key: "id", label: I18N.t("col.actions"), render: function (r) {
          return '<div class="rowacts">' +
            '<button class="iconbtn" data-edit="' + r.id + '">✎</button>' +
            (r.role !== "admin" ? '<button class="iconbtn" data-toggle="' + r.id + '" data-status="' + r.status + '">' + (r.status === "active" ? "⏸" : "▶") + '</button>' +
            V._delButton({ attr: "data-del", value: r.id, name: r.name }) : "") +
          '</div>';
        } }
      ], list);

      panel.onclick = function (e) {
        var ed = e.target.closest("[data-edit]"), tg = e.target.closest("[data-toggle]"), dl = e.target.closest("[data-del]");
        if (ed) userForm(list.find(function (u) { return u.id == ed.getAttribute("data-edit"); }), brs, function () { users(panel, root); });
        if (tg) {
          var ns = tg.getAttribute("data-status") === "active" ? "inactive" : "active";
          API.patch("users/" + tg.getAttribute("data-toggle") + "/status", { status: ns })
            .then(function () { UI.toast(I18N.t("toast.saved"), "ok"); users(panel, root); }).catch(apiToast);
        }
        if (dl) {
          var u = list.find(function (x) { return x.id == dl.getAttribute("data-del"); });
          UI.confirm(I18N.t("confirm.delete", { name: u.name }), function () {
            API.del("users/" + u.id).then(function () { UI.toast(I18N.t("toast.deleted"), "ok"); users(panel, root); }).catch(apiToast);
          }, { danger: true });
        }
      };
      root.querySelector("[data-new-user]") && (root.querySelector("[data-new-user]").onclick = function () {
        userForm(null, brs, function () { users(panel, root); });
      });
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  function userForm(u, branchesList, done) {
    u = u || {};
    var opts = branchesList.map(function (b) {
      return '<option value="' + b.id + '"' + (u.branch_id == b.id ? " selected" : "") + '>' + esc(b.name) + '</option>';
    }).join("");
    var c = document.createElement("form");
    c.innerHTML =
      row("branchName", '<input class="input" name="name" required value="' + esc(u.name || "") + '">', "col.name") +
      row("email", '<input class="input" type="email" name="email" required value="' + esc(u.email || "") + '">', "col.email") +
      row("password", '<input class="input" type="text" name="password" ' + (u.id ? "" : "required") + ' placeholder="' + (u.id ? esc(I18N.t("form.passwordHint")) : "") + '">') +
      row("role",
        '<select class="select" name="role">' +
          '<option value="manager"' + (u.role === "manager" ? " selected" : "") + '>' + esc(I18N.t("role.manager")) + '</option>' +
          '<option value="cashier"' + (u.role === "cashier" ? " selected" : "") + '>' + esc(I18N.t("role.cashier")) + '</option>' +
        '</select>', "col.role") +
      row("assignBranch", '<select class="select" name="branch_id" required>' + opts + '</select>') +
      (u.id ? row("status",
        '<select class="select" name="status">' +
          '<option value="active"' + (u.status === "active" ? " selected" : "") + '>' + esc(I18N.t("status.active")) + '</option>' +
          '<option value="inactive"' + (u.status === "inactive" ? " selected" : "") + '>' + esc(I18N.t("status.inactive")) + '</option>' +
        '</select>') : "") +
      formButtons();
    var m = UI.modal({ title: I18N.t(u.id ? "btn.edit" : "btn.newUser"), content: c });
    bindForm(c, m, function (payload) {
      if (u.id && !payload.password) delete payload.password;
      var p = u.id ? API.put("users/" + u.id, payload) : API.post("users", payload);
      return p.then(function () { UI.toast(I18N.t(u.id ? "toast.saved" : "toast.created"), "ok"); UI.closeModal(); done(); });
    });
  }

  /* ---------------- Cajas (registers) de TODAS las sucursales ---------------- */
  function registers(panel, root) {
    panel.innerHTML = V._loading();
    Promise.all([API.get("registers"), API.get("branches")]).then(function (res) {
      var regs = res[0].registers || [];
      var brs = res[1].branches || [];

      panel.innerHTML = V._table([
        { key: "name", label: I18N.t("col.register"), render: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { key: "branch_name", label: I18N.t("misc.branch"), render: function (r) { return esc(r.branch_name || "—"); } },
        { key: "status", label: I18N.t("col.status"), render: function (r) { return V._statusBadge(r.status); } },
        { key: "id", label: I18N.t("col.actions"), render: function (r) {
          return V._delButton({ attr: "data-del", value: r.id, name: r.name });
        } }
      ], regs, { empty: I18N.t("empty.none") });

      panel.onclick = function (e) {
        var dl = e.target.closest("[data-del]");
        if (!dl) return;
        var reg = regs.find(function (x) { return x.id == dl.getAttribute("data-del"); });
        UI.confirm(I18N.t("confirm.delete", { name: reg.name }), function () {
          API.del("registers/" + reg.id).then(function (r) {
            UI.toast(r && r.message ? r.message : I18N.t("toast.deleted"), "ok");
            registers(panel, root);
          }).catch(apiToast);
        }, { danger: true });
      };

      var nb = root.querySelector("[data-new-register]");
      if (nb) nb.onclick = function () { registerForm(brs, regs, function () { registers(panel, root); }); };
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  function registerForm(branches, existing, done) {
    if (!branches.length) { UI.toast(I18N.t("toast.error"), "error"); return; }
    function nextName(bid) {
      var n = (existing || []).filter(function (r) { return String(r.branch_id) === String(bid); }).length + 1;
      return "Caja " + n;
    }
    var f = document.createElement("form");
    f.innerHTML =
      row("branch", '<select class="select" name="branch_id" required>' +
        branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("") +
        '</select>', "misc.branch") +
      row("name", '<input class="input" name="name" required value="' + esc(nextName(branches[0].id)) + '">', "col.name") +
      formButtons();
    var m = UI.modal({ title: I18N.t("btn.newRegister"), content: f });

    // La sucursal re-sugiere "Caja N" mientras el nombre no se haya tocado a mano.
    var sel = f.querySelector('[name="branch_id"]');
    var nameInp = f.querySelector('[name="name"]');
    var touched = false;
    nameInp.addEventListener("input", function () { touched = true; });
    sel.addEventListener("change", function () { if (!touched) nameInp.value = nextName(sel.value); });

    bindForm(f, m, function (payload) {
      return API.post("registers", { branch_id: payload.branch_id, name: (payload.name || "").trim() })
        .then(function () { UI.toast(I18N.t("toast.created"), "ok"); UI.closeModal(); done(); });
    });
  }

  /* ---------------- Inventario + gestión manual de productos ---------------- */
  var PRV_LABEL = {
    manga: "MANGA", figuras: "FIGURA", comics: "CÓMIC", tcg: "TCG",
    coleccionables: "COLECCIONABLE", preventa: "PREVENTA"
  };
  var PRV_PREFIX = { manga: "MNG", figuras: "FIG", comics: "CMC", tcg: "TCG", coleccionables: "COL", preventa: "PRV" };
  var EDITORIALS = ["Panini", "Marvel Comics", "DC Comics", "Image Comics", "Dark Horse Comics",
    "IDW Publishing", "Vertigo", "Bandai", "Good Smile Company", "Kotobukiya", "Funko",
    "Pokémon", "Konami", "Wizards of the Coast", "Otro"];

  function inventory(panel, root) {
    panel.innerHTML = V._loading();
    Promise.all([
      API.get("branches"),
      API.get("categories"),
      API.get("products?status=all&limit=300"),
      API.get("inventory/alerts")
    ]).then(function (res) {
      var brs = res[0].branches;
      var cats = res[1].categories;
      var folded = foldSeries(groupBySku(res[2].products, brs));
      var prods = folded.list;      // tarjetas visibles: 1 por serie / cómic / producto suelto
      var bySku = folded.bySku;     // TODOS los SKU (series + tomos ocultos) para las acciones

      panel.innerHTML =
        '<div class="toolbar">' +
          '<label class="muted mono" style="font-size:.75rem">' + esc(I18N.t("col.category")) + '</label>' +
          '<select class="select" data-cat-filter><option value="">' + esc(I18N.t("pos.all")) + '</option>' +
            cats.map(function (c) { return '<option value="' + esc(c.slug) + '">' + esc(I18N.pick({ es: c.name_es, en: c.name_en })) + '</option>'; }).join("") +
          '</select>' +
          '<span class="spacer"></span>' +
          '<span class="mono muted" style="font-size:.72rem" data-prod-count>' + prods.length + ' ' + esc(I18N.t("nav.products").toLowerCase()) + '</span>' +
        '</div>' +
        '<div data-prod-table>' + productsTable(prods, brs) + '</div>' +
        '<h2 class="mono" style="font-size:.9rem;color:var(--faint);margin:1.6rem 0 .6rem">' + esc(I18N.t("misc.alerts")) + '</h2>' +
        '<div data-alerts>' + alertsTable(res[3].alerts) + '</div>';

      var tableBox = $("[data-prod-table]", panel);

      function redrawTable() {
        var slug = ($("[data-cat-filter]", panel) || {}).value || "";
        var list = slug ? prods.filter(function (p) { return p.category_slug === slug; }) : prods;
        tableBox.innerHTML = productsTable(list, brs);
        var cnt = $("[data-prod-count]", panel);
        if (cnt) cnt.textContent = list.length + " " + I18N.t("nav.products").toLowerCase();
      }
      $("[data-cat-filter]", panel).addEventListener("change", redrawTable);

      // El catálogo de la tienda trae las portadas reales; si aún no cargó al
      // pintar, se repinta cuando resuelve para que aparezcan las carátulas.
      if (window.Catalog && Catalog.load && !Catalog.ready) {
        Catalog.load().then(function () { if ($("[data-prod-table]", panel)) redrawTable(); }).catch(function () {});
      }

      tableBox.addEventListener("click", function (e) {
        var ed = e.target.closest("[data-edit-sku]");
        if (ed) {
          var ge = bySku[ed.getAttribute("data-edit-sku")];
          if (ge) editProductModal(ge, cats, function () { inventory(panel, root); });
          return;
        }
        var rst = e.target.closest("[data-restock]");
        if (rst) {
          var g = bySku[rst.getAttribute("data-restock")];
          if (g) {
            // Manga y cómics -> modal de tomos (stock + precio por volumen).
            // El resto -> ajuste de stock por sucursal de siempre.
            if (g.category_slug === "manga" || g.category_slug === "comics")
              volumesModal(g, brs, function () { inventory(panel, root); });
            else
              restockModal(g, brs, function () { inventory(panel, root); });
          }
          return;
        }
        var del = e.target.closest("[data-del-sku]");
        if (!del) return;
        var sku = del.getAttribute("data-del-sku");
        var name = del.getAttribute("data-name") || sku;
        UI.confirm(I18N.t("confirm.delete", { name: name }), function () {
          API.del("products/sku/" + encodeURIComponent(sku)).then(function (r) {
            var n = (r.deleted || []).length + (r.deactivated || []).length;
            UI.toast(I18N.t("prodadm.deleted", { n: n }), "ok");
            V._catalogChanged();
            inventory(panel, root);
          }).catch(apiToast);
        }, { danger: true });
      });

      var impBtn = root.querySelector("[data-import-pkm]");
      if (impBtn) impBtn.onclick = function () { pkmImportModal(brs, function () { inventory(panel, root); }); };
      var figBtn = root.querySelector("[data-import-figure]");
      if (figBtn) figBtn.onclick = function () { figureImportModal(brs, function () { inventory(panel, root); }); };
      var newBtn = root.querySelector("[data-new-product]");
      if (newBtn) newBtn.onclick = function () { newProductModal(brs, cats, function () { inventory(panel, root); }); };
    }).catch(function (err) { panel.innerHTML = V._error(err); });
  }

  /** Agrupa filas de producto (una por sucursal) por SKU. */
  function groupBySku(rows, branches) {
    var map = {};
    (rows || []).forEach(function (r) {
      var g = map[r.sku] || (map[r.sku] = {
        sku: r.sku, name: r.name, price: r.price, image_url: r.image_url,
        category_slug: r.category_slug || "", status: r.status,
        total: 0, byBranch: {}, idByBranch: {}, sample: r
      });
      g.total += r.stock || 0;
      g.byBranch[r.branch_id] = (g.byBranch[r.branch_id] || 0) + (r.stock || 0);
      g.idByBranch[r.branch_id] = r.id;          // id del producto en esa sucursal
      if (r.category_slug && !g.category_slug) g.category_slug = r.category_slug;
      if (r.status === "active") g.status = "active";
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function delButton(sku, name) {
    return V._delButton({ attr: "data-del-sku", value: sku, name: name });
  }

  /* =============================================================
     Plegado de series — los tomos de manga y los números de cómic NO se
     muestran como tarjetas sueltas: se esconden bajo la tarjeta de su
     serie (que se puede desplegar). Reglas:
       · manga  -> se agrupa por título de serie normalizado (misma lógica
                   que la tienda: quita "Vol. N", alias Kimetsu↔Demon Slayer…).
                   La fila SIN marcador de tomo (o SKU `MNG-S-*`) es la serie
                   padre; el resto son tomos hijos. Si NO hay fila de serie
                   (solo tomos sueltos) NO se pliega — nada desaparece.
       · cómics -> best-effort por prefijo de SKU `CMC-XXX-<n>` (o título si
                   no encaja). El número más bajo es el padre.
       · lo demás (tcg, coleccionables, preventa) nunca se pliega.
     Devuelve { list, bySku }.  `list` = tarjetas visibles (padres + sueltos);
     `bySku` = TODOS los SKU para que editar/ajustar/eliminar sigan funcionando.
     ============================================================= */
  var _VOLRE = /\s*[-–—:·]?\s*(?:vol\.?|volumen|tomo|t\.|#|n[°º]\.?|no\.?)\s*\d+(?:\.\d+)?\s*$/i;
  var _SERIES_ALIAS = {
    "kimetsu no yaiba": "demon slayer",
    "demon slayer kimetsu no yaiba": "demon slayer",
    "shingeki no kyojin": "attack on titan",
    "boku no hero academia": "my hero academia",
    "hagane no renkinjutsushi": "fullmetal alchemist",
    "sousou no frieren": "frieren beyond journey s end",
    "jojo no kimyou na bouken": "jojo s bizarre adventure"
  };
  function _seriesTitle(name) {
    return String(name || "").replace(_VOLRE, "").replace(/[\s:–—·-]+$/, "").trim();
  }
  function _seriesKey(name) {
    var k = _seriesTitle(name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return _SERIES_ALIAS[k] || k;
  }
  function _isVolumeName(name) { return _VOLRE.test(String(name || "")); }
  function _comicPrefix(sku) {
    var m = String(sku || "").match(/^(CMC-[A-Za-z0-9]+)-\d+$/);
    return m ? m[1].toUpperCase() : "";
  }
  function _issueNum(sku, name) {
    var m = String(sku || "").match(/-(\d+)$/) || String(name || "").match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function foldSeries(skuGroups) {
    skuGroups = skuGroups || [];
    var bySku = {};
    skuGroups.forEach(function (g) { bySku[g.sku] = g; });

    var buckets = {}, order = [], passthrough = [];

    skuGroups.forEach(function (g) {
      var cat = g.category_slug || "";
      var key = null;
      if (cat === "manga") {
        key = "M:" + _seriesKey(g.name);
        g._series = /^MNG-S-/i.test(g.sku) || !_isVolumeName(g.name);
      } else if (cat === "comics") {
        key = "C:" + (_comicPrefix(g.sku) || _seriesKey(g.name));
        g._series = false;
      }
      if (key === null || _seriesKey(g.name) === "") { passthrough.push(g); return; }
      if (!buckets[key]) { buckets[key] = []; order.push(key); }
      buckets[key].push(g);
    });

    var list = [];
    order.forEach(function (key) {
      var members = buckets[key];
      if (members.length === 1) { list.push(members[0]); return; }

      var parent, children;
      if (key.charAt(0) === "C") {
        members.sort(function (a, b) { return _issueNum(a.sku, a.name) - _issueNum(b.sku, b.name); });
        parent = members[0];
        children = members.slice(1);
      } else {
        var series = members.filter(function (m) { return m._series; });
        if (!series.length) { members.forEach(function (m) { list.push(m); }); return; }  // solo tomos sueltos
        parent = series.filter(function (m) { return /^MNG-S-/i.test(m.sku); })[0] || series[0];
        children = members.filter(function (m) { return m !== parent; });
        children.sort(function (a, b) { return _issueNum(a.sku, a.name) - _issueNum(b.sku, b.name); });
      }

      parent.displayName = _seriesTitle(parent.name) || parent.name;
      parent.children = children;
      parent.groupTotal = parent.total;
      parent.groupByBranch = {};
      Object.keys(parent.byBranch).forEach(function (b) { parent.groupByBranch[b] = parent.byBranch[b]; });
      children.forEach(function (c) {
        parent.groupTotal += c.total;
        Object.keys(c.byBranch).forEach(function (b) {
          parent.groupByBranch[b] = (parent.groupByBranch[b] || 0) + c.byBranch[b];
        });
      });
      list.push(parent);
    });

    list = list.concat(passthrough);
    list.sort(function (a, b) {
      return String(a.displayName || a.name).localeCompare(String(b.displayName || b.name));
    });
    return { list: list, bySku: bySku };
  }

  function _foldLabel(g) {
    var n = (g.children || []).length;
    var en = I18N.lang === "en";
    if (g.category_slug === "comics") return n + " " + (en ? (n === 1 ? "issue" : "issues") : (n === 1 ? "número" : "números"));
    return n + " " + (en ? (n === 1 ? "volume" : "volumes") : (n === 1 ? "tomo" : "tomos"));
  }

  function branchDigest(map, branches) {
    return (branches || []).map(function (b) {
      return esc(String(b.code || "").replace(/^GKP-/, "")) + " " + ((map || {})[b.id] || 0);
    }).join(" · ");
  }

  /* Inventario consolidado como GRILLA DE TARJETAS (mismo estilo que la tienda).
     Cada tarjeta agrupa un SKU: portada, categoría, precio, stock TOTAL y el
     desglose por sucursal. Al pulsarla (o "± Ajustar stock") abre el modal de
     reabastecer por sucursal — nunca "comprar". */
  function productsTable(list, branches) {
    if (!list.length) {
      return '<div class="state">' + (V._icon ? V._icon.empty : "") + '<p>' + esc(I18N.t("empty.none")) + '</p></div>';
    }
    branches = branches || [];
    return '<div class="invgrid">' + list.map(function (g) {
      var kids = g.children || [];
      var total = kids.length ? g.groupTotal : g.total;
      var brMap = kids.length ? g.groupByBranch : g.byBranch;
      var totalCls = total === 0 ? "badge--danger" : (total <= 6 ? "badge--warn" : "badge--ok");
      var cat = esc(PRV_LABEL[g.category_slug] || g.category_slug || "—");
      var perBranch = branchDigest(brMap, branches);
      var name = g.displayName || g.name;
      return '' +
        '<article class="invcard' + (g.status !== "active" ? " is-inactive" : "") + '">' +
          '<div class="invcard__main" data-edit-sku="' + esc(g.sku) + '" title="' + esc(I18N.t("btn.edit")) + '">' +
            '<div class="invcard__media">' +
              '<img src="' + esc(V._productCover(g)) + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">' +
              '<span class="invcard__stock badge ' + totalCls + '">' + total + '</span>' +
              (g.status !== "active" ? '<span class="invcard__off">' + esc(I18N.t("status.inactive")) + '</span>' : "") +
            '</div>' +
            '<div class="invcard__body">' +
              '<span class="invcard__cat">' + cat + (kids.length ? ' · ' + esc(_foldLabel(g)) : '') + '</span>' +
              '<h3 class="invcard__name">' + esc(name) + '</h3>' +
              '<span class="invcard__sku mono">' + esc(g.sku) + '</span>' +
              '<div class="invcard__foot">' +
                '<span class="invcard__price mono">' + UI.money(g.price, true) + '</span>' +
                (perBranch ? '<span class="mono" style="font-size:.58rem;color:var(--muted)">' + perBranch + '</span>' : "") +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="invcard__acts">' +
            '<button class="btn btn--neon btn--sm invcard__adjust" data-restock="' + esc(g.sku) + '">± ' + esc(I18N.t("btn.adjust")) + '</button>' +
            delButton(g.sku, name) +
          '</div>' +
        '</article>';
    }).join("") + '</div>';
  }

  /* Modal: añadir stock del MISMO SKU en varias sucursales de una vez.
     · Sucursal donde el producto ya existe -> PATCH /stock (delta, +N, con
       movimiento de reabastecimiento).
     · Sucursal donde aún no existe          -> se crea vía /products/import
       usando la ficha real de otra sucursal (no pisa nombre/precio/imágenes). */
  function restockModal(group, branches, done) {
    var c = document.createElement("form");
    c.innerHTML =
      '<p class="muted" style="margin-bottom:.6rem">' + esc(group.name) +
        ' · <span class="mono">' + esc(group.sku) + '</span></p>' +
      '<p class="field__label mono" style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em;margin:.2rem 0 .6rem">' +
        esc(I18N.t("prodadm.restockHint")) + '</p>' +
      '<div class="pkm-branches">' + branches.map(function (b) {
        var has = group.idByBranch[b.id] != null;
        var cur = group.byBranch[b.id] || 0;
        var note = has ? (esc(I18N.t("col.stock")) + ': ' + cur) : esc(I18N.t("prodadm.notInBranch"));
        return '<label class="pkm-branch"><span>' + esc(b.name) +
          '<br><small class="muted mono" style="font-size:.62rem">' + note + '</small></span>' +
          '<input class="input" type="number" min="0" step="1" value="0" data-branch="' + b.id + '"></label>';
      }).join("") + '</div>' +
      formButtons();

    var m = UI.modal({ title: I18N.t("prodadm.restockTitle", { name: group.name }), content: c, wide: true });

    bindForm(c, m, function () {
      var deltas = [], creates = {};
      c.querySelectorAll("[data-branch]").forEach(function (inp) {
        var qty = Math.max(0, parseInt(inp.value, 10) || 0);
        if (qty <= 0) return;
        var bid = inp.getAttribute("data-branch");
        if (group.idByBranch[bid] != null) deltas.push({ id: group.idByBranch[bid], qty: qty });
        else creates[bid] = qty;
      });
      if (!deltas.length && !Object.keys(creates).length) {
        return Promise.reject(new Error(I18N.t("prodadm.needStock")));
      }

      var jobs = deltas.map(function (d) {
        return API.patch("products/" + d.id + "/stock", { mode: "delta", value: d.qty, note: "Reabastecimiento" });
      });
      if (Object.keys(creates).length) {
        var s = group.sample || {};
        jobs.push(API.post("products/import", {
          source: "restock",
          sku: group.sku,
          name: s.name || group.name,
          category_slug: group.category_slug || s.category_slug || "",
          price: s.price != null ? s.price : group.price,
          image_url: s.image_url != null ? s.image_url : (group.image_url || ""),
          figure_png_url: s.figure_png_url || "",
          description: s.description || "",
          tax_rate: s.tax_rate,
          min_stock: s.min_stock,
          stock_by_branch: creates
        }));
      }

      return Promise.all(jobs).then(function () {
        UI.toast(I18N.t("prodadm.restockDone"), "ok");
        UI.closeModal();
        V._catalogChanged();
        done();
      });
    });
  }

  function _pad2(v) { return v < 10 ? "0" + v : "" + v; }

  /* SKU base para tomos/números sueltos de una serie:
     MNG-S-JJK -> MNG-JJK ;  MNG-JJK-03 -> MNG-JJK ;  CMC-AVG-1 -> CMC-AVG */
  function _volBase(sku) {
    return String(sku || "").replace(/-S-/i, "-").replace(/-\d{1,3}$/, "").replace(/[^A-Za-z0-9]+$/, "");
  }

  /* Modal "Tomos y precios" — se abre desde "± Ajustar stock" en las tarjetas de
     manga y cómics (sustituye al modal de reabastecer normal para esas series).
     · Campo "Número de tomos": genera la cuadrícula Vol. 1 … Vol. N.
     · Cada fila: SKU + "stock: N" de la sucursal elegida, y dos campos:
        - Precio: si el tomo YA existe se precarga (editable, afecta a todas las
          sucursales); si no existe, vacío (placeholder = precio de la serie) y
          el tomo solo se crea al escribir un precio.
        - Stock: cantidad a SUMAR al stock actual en la sucursal elegida (igual
          que "± Ajustar stock" normal). Deja en blanco / 0 para no tocarlo.
          Cambiar de sucursal recarga el "stock: N" de cada fila.
     · "Guardar" aplica todo de una: precios + sumas de stock + altas de tomos.
     · "+ Añadir nuevo tomo": formulario detallado tipo "Nuevo producto" (SIN
       categoría, marca ni línea) para UN tomo con portada / stock propios. */
  function volumesModal(group, branches, done) {
    var kids = [group].concat(group.children || []);
    // Mapa  nº de tomo -> grupo existente  (para precargar precio/stock y sus ids).
    var byNum = {};
    kids.forEach(function (mm) {
      var n = _issueNum(mm.sku, mm.name);
      if (n > 0) byNum[n] = mm;
    });
    var base = _volBase(group.sku);
    var seriesName = _seriesTitle(group.displayName || group.name) || group.name;
    var maxExisting = Object.keys(byNum).reduce(function (mx, k) { return Math.max(mx, +k); }, 0);
    var descMatch = String((group.sample && group.sample.description) || "").match(/(\d{1,3})\s*tomos?/i);
    var guess = descMatch ? Math.min(parseInt(descMatch[1], 10), 80) : (maxExisting || 12);

    var brs = branches || [];
    var defBranch = (window.STORE && STORE.user && STORE.user.branch_id) || (brs[0] && brs[0].id) || null;

    var c = document.createElement("form");
    c.innerHTML =
      '<p class="muted" style="margin-bottom:.6rem">' + esc(group.displayName || group.name) +
        ' · <span class="mono">' + esc(group.sku) + '</span></p>' +
      '<button type="button" class="btn btn--neon btn--sm" data-add-vol style="margin-bottom:.9rem">' +
        esc(I18N.t("volumes.addNew")) + '</button>' +
      row("volumes.count", '<input class="input" type="number" min="1" max="99" name="count" value="' + guess + '" data-vol-count>', "volumes.count") +
      (brs.length > 1
        ? row("volumes.stockBranch", '<select class="input" data-vol-branch>' + brs.map(function (b) {
            return '<option value="' + b.id + '"' + (b.id === defBranch ? " selected" : "") + '>' + esc(b.name) + '</option>';
          }).join("") + '</select>', "volumes.stockBranch")
        : "") +
      '<div data-vol-rows></div>' +
      formButtons();
    var mod = UI.modal({ title: I18N.t("volumes.title"), content: c, wide: true });

    function selBranch() {
      var sel = c.querySelector("[data-vol-branch]");
      return sel ? parseInt(sel.value, 10) : defBranch;
    }

    function drawRows() {
      // Conserva lo ya tecleado al recalcular filas (cambio de sucursal / conteo).
      var typed = {};
      c.querySelectorAll("[data-vol]").forEach(function (i) {
        (typed[i.getAttribute("data-vol")] = typed[i.getAttribute("data-vol")] || {}).price = i.value;
      });
      c.querySelectorAll("[data-stock]").forEach(function (i) {
        (typed[i.getAttribute("data-stock")] = typed[i.getAttribute("data-stock")] || {}).stock = i.value;
      });

      var n = Math.max(1, Math.min(99, parseInt(c.querySelector("[data-vol-count]").value, 10) || 1));
      var bid = selBranch();
      var bName = (brs.filter(function (b) { return b.id === bid; })[0] || {}).name || "";
      var rows = "";
      for (var v = 1; v <= n; v++) {
        var ex = byNum[v];
        var stk = ex && ex.byBranch ? (ex.byBranch[bid] || 0) : 0;
        var t = typed[v] || {};
        var priceAttr = (t.price != null && t.price !== "")
          ? ' value="' + esc(t.price) + '"'
          : (ex && ex.price != null ? ' value="' + ex.price + '"' : ' placeholder="' + (group.price || 0) + '"');
        var stockAttr = (t.stock != null && t.stock !== "") ? ' value="' + esc(t.stock) + '"' : ' placeholder="0"';
        rows += '<label class="pkm-branch"><span>' + esc(I18N.t("prod.volume")) + ' ' + v +
          '<br><small class="muted mono" style="font-size:.62rem">' + esc((ex && ex.sku) || (base + "-" + _pad2(v))) +
            ' · ' + esc(I18N.t("col.stock").toLowerCase()) + ': ' + stk + '</small></span>' +
          '<span style="display:flex;gap:.35rem;align-items:center">' +
            '<input class="input" type="number" min="0" step="0.01" data-vol="' + v + '" title="' + esc(I18N.t("prodadm.price")) + '"' +
              priceAttr + ' style="width:5.2rem;text-align:right">' +
            '<input class="input" type="number" min="0" step="1" data-stock="' + v + '" title="+ ' + esc(I18N.t("btn.adjust")) + '"' +
              stockAttr + ' style="width:3.8rem;text-align:right">' +
          '</span></label>';
      }
      c.querySelector("[data-vol-rows]").innerHTML =
        '<p class="field__label mono" style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em;margin:.6rem 0 .5rem">' +
          esc(I18N.t("volumes.priceStockHint")) + (bName ? ' · ' + esc(bName) : '') + '</p>' +
        '<div class="pkm-branches" style="grid-template-columns:repeat(auto-fit,minmax(232px,1fr))">' + rows + '</div>';
    }
    drawRows();
    c.querySelector("[data-vol-count]").addEventListener("input", drawRows);
    var brSel = c.querySelector("[data-vol-branch]");
    if (brSel) brSel.addEventListener("change", drawRows);

    c.querySelector("[data-add-vol]").addEventListener("click", function () {
      newVolumeModal({
        base: base, seriesName: seriesName, nextNum: maxExisting + 1,
        categorySlug: group.category_slug || "manga",
        sample: group.sample || {},
        imageUrl: group.image_url || ""
      }, branches, function () {
        UI.closeModal();
        V._catalogChanged();
        done();
      });
    });

    bindForm(c, mod, function () {
      var bid = selBranch();
      var stockInp = {};
      c.querySelectorAll("[data-stock]").forEach(function (i) { stockInp[i.getAttribute("data-stock")] = i; });
      var jobs = [];

      c.querySelectorAll("[data-vol]").forEach(function (pInp) {
        var v = parseInt(pInp.getAttribute("data-vol"), 10);
        var sInp = stockInp[v];
        var ex = byNum[v];

        var priceStr = String(pInp.value).trim();
        var price = priceStr === "" ? null : Math.round(parseFloat(priceStr) * 100) / 100;
        if (price != null && !(price >= 0)) price = null;

        var stockStr = sInp ? String(sInp.value).trim() : "";
        var add = stockStr === "" ? 0 : Math.max(0, parseInt(stockStr, 10) || 0);

        if (ex) {
          // 1) Precio: si cambió, se aplica a la ficha en TODAS las sucursales.
          if (price != null && price !== Number(ex.price)) {
            Object.keys(ex.idByBranch || {}).forEach(function (k) {
              var id = ex.idByBranch[k];
              if (id) jobs.push(API.put("products/" + id, { sku: ex.sku, name: ex.name, price: price }));
            });
          }
          // 2) Stock: SUMA a lo que ya hay en la sucursal elegida.
          if (add > 0) {
            var idHere = ex.idByBranch && ex.idByBranch[bid];
            if (idHere) {
              jobs.push(API.patch("products/" + idHere + "/stock",
                { mode: "delta", value: add, note: I18N.t("volumes.stockNote") }));
            } else {
              // El tomo aún no está en esa sucursal -> se crea ahí con ese stock.
              var sbOne = {}; sbOne[bid] = add;
              jobs.push(API.post("products/import", {
                source: "restock", sku: ex.sku, name: ex.name,
                category_slug: ex.category_slug || group.category_slug || "manga",
                price: ex.price != null ? ex.price : group.price,
                image_url: ex.image_url || group.image_url || "",
                description: (ex.sample && ex.sample.description) || (group.sample && group.sample.description) || "",
                stock_by_branch: sbOne
              }));
            }
          }
        } else if (price != null) {
          // Tomo nuevo: se crea con su precio y, si se indicó, el stock de la sede.
          var sbNew = {};
          brs.forEach(function (b) { sbNew[b.id] = 0; });
          if (add > 0) sbNew[bid] = add;
          jobs.push(API.post("products/import", {
            source: "volume",
            sku: base + "-" + _pad2(v),
            name: seriesName + " " + I18N.t("prod.volume") + " " + v,
            category_slug: group.category_slug || "manga",
            price: price,
            image_url: group.image_url || "",
            description: (group.sample && group.sample.description) || "",
            stock_by_branch: sbNew
          }));
        }
        // Tomo nuevo con solo stock y sin precio -> se ignora (no se puede crear sin precio).
      });

      if (!jobs.length) { UI.closeModal(); return Promise.resolve(); }
      return Promise.all(jobs).then(function () {
        UI.toast(I18N.t("volumes.done", { n: jobs.length }), "ok");
        UI.closeModal();
        V._catalogChanged();
        done();
      });
    });
  }

  /* Formulario "Nuevo volumen" — clon de "Nuevo producto" SIN categoría, marca
     ni línea (se heredan de la serie).  Crea un SKU <base>-NN vía products/import. */
  function newVolumeModal(ctx, branches, done) {
    var c = document.createElement("form");
    c.innerHTML =
      row("prod.volume", '<input class="input" type="number" name="volnum" min="1" max="999" value="' + ctx.nextNum + '" data-volnum>' +
        '<small class="muted mono" style="font-size:.66rem" data-sku-preview>' + esc(ctx.base + "-" + _pad2(ctx.nextNum)) + '</small>', "prod.volume") +
      row("prodadm.name", '<input class="input" name="name" required maxlength="180" value="' +
        esc(ctx.seriesName + " " + I18N.t("prod.volume") + " " + ctx.nextNum) + '">') +
      row("prodadm.price", '<input class="input" type="number" name="price" min="0" step="0.01" required value="' +
        (ctx.sample.price != null ? ctx.sample.price : "") + '">') +
      row("prodadm.synopsis", '<textarea class="input" name="description" rows="3" maxlength="500">' +
        esc(ctx.sample.description || "") + '</textarea>') +
      imageField("figure_png_url", "prodadm.figurePng",
        "https://….png  —  o sube un PNG recortado del equipo", false, ctx.sample.figure_png_url || "") +
      imageField("image_url", "prodadm.image",
        "https://…, https://…  —  o sube fotos del equipo", true, ctx.imageUrl || "") +
      tagField(ctx.sample.tags || "") +
      '<p class="field__label mono" style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em;margin:.4rem 0 .5rem">' +
        esc(I18N.t("prodadm.stockByBranch")) + '</p>' +
      '<div class="pkm-branches">' + branches.map(function (b) {
        return '<label class="pkm-branch"><span>' + esc(b.name) + '</span>' +
          '<input class="input" type="number" min="0" step="1" value="0" data-branch="' + b.id + '"></label>';
      }).join("") + '</div>' +
      formButtons();

    var m = UI.modal({ title: I18N.t("volumes.newTitle"), content: c, wide: true });
    bindTagPick(c);

    var numEl = c.querySelector("[data-volnum]");
    var skuPrev = c.querySelector("[data-sku-preview]");
    numEl.addEventListener("input", function () {
      var n = Math.max(1, parseInt(numEl.value, 10) || 1);
      skuPrev.textContent = ctx.base + "-" + _pad2(n);
    });

    c.querySelectorAll("[data-file]").forEach(function (fi) {
      fi.addEventListener("change", function () {
        renderPreviews(fi, c.querySelector('[data-prev="' + fi.getAttribute("data-file") + '"]'));
      });
    });

    bindForm(c, m, function (payload) {
      var stock = {}, any = false;
      c.querySelectorAll("[data-branch]").forEach(function (inp) {
        var n = Math.max(0, parseInt(inp.value, 10) || 0);
        if (n > 0) { stock[inp.getAttribute("data-branch")] = n; any = true; }
      });
      // El stock puede quedar en 0 y ajustarse luego; import exige al menos una
      // sucursal en stock_by_branch, así que mandamos todas (a 0 si no se indicó).
      if (!any) branches.forEach(function (b) { stock[b.id] = 0; });

      var num = Math.max(1, parseInt(payload.volnum, 10) || ctx.nextNum);
      var sku = ctx.base + "-" + _pad2(num);
      var typedGallery = (payload.image_url || "").split(",").map(function (u) { return u.trim(); }).filter(Boolean);
      var typedFigure = (payload.figure_png_url || "").trim();
      var figFiles = Array.prototype.slice.call((c.querySelector('[data-file="figure_png_url"]') || {}).files || []).slice(0, 1);
      var galFiles = Array.prototype.slice.call((c.querySelector('[data-file="image_url"]') || {}).files || []);
      if (figFiles.length || galFiles.length) UI.toast(I18N.t("prodadm.uploading"), "ok");

      return Promise.all([
        figFiles.length ? uploadFiles(figFiles) : Promise.resolve([]),
        galFiles.length ? uploadFiles(galFiles) : Promise.resolve([])
      ]).catch(function (err) {
        throw new Error((err && err.message) || I18N.t("prodadm.uploadFail"));
      }).then(function (up) {
        return API.post("products/import", {
          source: "volume",
          sku: sku,
          name: (payload.name || "").trim() || (ctx.seriesName + " " + I18N.t("prod.volume") + " " + num),
          category_slug: ctx.categorySlug,
          price: Math.round((parseFloat(payload.price) || 0) * 100) / 100,
          description: (payload.description || "").trim(),
          image_url: typedGallery.concat(up[1]).join(","),
          figure_png_url: up[0][0] || typedFigure,
          tags: (payload.tags || "").trim(),
          stock_by_branch: stock
        });
      }).then(function () {
        UI.toast(I18N.t("volumes.created"), "ok");
        UI.closeModal();
        done();
      });
    });
  }

  /* Editar un SKU del inventario (nombre, categoría, precio, portada, etiquetas…).
     Misma pinta que "Nuevo producto"; el cambio se aplica a la ficha del SKU
     en TODAS sus sucursales (no toca el stock: eso es "± Ajustar stock"). */
  function editProductModal(group, cats, done) {
    var s = group.sample || {};
    var ids = Object.keys(group.idByBranch).map(function (k) { return group.idByBranch[k]; }).filter(Boolean);
    var catOpts = cats.map(function (x) {
      return '<option value="' + esc(x.slug) + '"' + (x.slug === group.category_slug ? " selected" : "") + '>' +
        esc(I18N.pick({ es: x.name_es, en: x.name_en })) + '</option>';
    }).join("");

    var c = document.createElement("form");
    c.innerHTML =
      row("col.sku", '<input class="input" value="' + esc(group.sku) + '" disabled>', "col.sku") +
      row("prodadm.name", '<input class="input" name="name" required maxlength="180" value="' + esc(group.name) + '">') +
      '<div class="grid-2">' +
        row("prodadm.category", '<select class="select" name="category_slug" required>' + catOpts + '</select>') +
        row("prodadm.price", '<input class="input" type="number" name="price" min="0" step="0.01" required value="' + (group.price != null ? group.price : "") + '">') +
      '</div>' +
      row("prodadm.synopsis", '<textarea class="input" name="description" rows="3" maxlength="500">' + esc(s.description || "") + '</textarea>') +
      imageField("figure_png_url", "prodadm.figurePng",
        "https://….png  —  o sube un PNG recortado del equipo", false,
        s.figure_png_url || "") +
      imageField("image_url", "prodadm.image",
        "https://…, https://…  —  o sube fotos del equipo", true,
        s.image_url || group.image_url || "") +
      tagField(s.tags || "") +
      '<div class="grid-2">' +
        row("form.minStock", '<input class="input" type="number" name="min_stock" min="0" value="' + (s.min_stock != null ? s.min_stock : 3) + '">', "form.minStock") +
        row("col.status",
          '<select class="select" name="status">' +
            '<option value="active"' + (group.status === "active" ? " selected" : "") + '>' + esc(I18N.t("status.active")) + '</option>' +
            '<option value="inactive"' + (group.status !== "active" ? " selected" : "") + '>' + esc(I18N.t("status.inactive")) + '</option>' +
          '</select>', "col.status") +
      '</div>' +
      formButtons();

    var m = UI.modal({ title: I18N.t("btn.edit"), content: c, wide: true });
    bindTagPick(c);

    // Vista previa de los archivos elegidos (igual que en "Nuevo producto").
    c.querySelectorAll("[data-file]").forEach(function (fi) {
      fi.addEventListener("change", function () {
        renderPreviews(fi, c.querySelector('[data-prev="' + fi.getAttribute("data-file") + '"]'));
      });
    });

    bindForm(c, m, function (payload) {
      if (!ids.length) return Promise.reject(new Error(I18N.t("toast.error")));
      var cat = cats.filter(function (x) { return x.slug === payload.category_slug; })[0];

      var typedGallery = (payload.image_url || "").split(",").map(function (u) { return u.trim(); }).filter(Boolean);
      var typedFigure = (payload.figure_png_url || "").trim();
      var figFiles = Array.prototype.slice.call((c.querySelector('[data-file="figure_png_url"]') || {}).files || []).slice(0, 1);
      var galFiles = Array.prototype.slice.call((c.querySelector('[data-file="image_url"]') || {}).files || []);
      if (figFiles.length || galFiles.length) UI.toast(I18N.t("prodadm.uploading"), "ok");

      return Promise.all([
        figFiles.length ? uploadFiles(figFiles) : Promise.resolve([]),
        galFiles.length ? uploadFiles(galFiles) : Promise.resolve([])
      ]).catch(function (err) {
        throw new Error((err && err.message) || I18N.t("prodadm.uploadFail"));
      }).then(function (up) {
        var body = {
          sku: group.sku,
          name: (payload.name || "").trim(),
          category_id: cat ? cat.id : (s.category_id || null),
          price: parseFloat(payload.price) || 0,
          description: (payload.description || "").trim(),
          tags: (payload.tags || "").trim(),
          image_url: typedGallery.concat(up[1]).join(","),
          figure_png_url: up[0][0] || typedFigure,
          min_stock: Math.max(0, parseInt(payload.min_stock, 10) || 0),
          status: payload.status === "inactive" ? "inactive" : "active"
        };
        return Promise.all(ids.map(function (id) { return API.put("products/" + id, body); }));
      }).then(function () {
        UI.toast(I18N.t("toast.saved"), "ok");
        UI.closeModal();
        V._catalogChanged();
        done();
      });
    });
  }

  /* Selector de etiquetas de tienda — SOLO 3 opciones fijas, no texto libre.
     Renderiza 3 chips + un <input type=hidden name=tags> que bindForm lee. */
  var TAG_OPTIONS = ["novedad", "oferta", "preventa"];
  function tagField(value) {
    var sel = String(value || "").toLowerCase().split(",").map(function (s) { return s.trim(); });
    return row("tags.pick",
      '<div class="tagpick" data-tagpick>' +
        TAG_OPTIONS.map(function (t) {
          return '<button type="button" class="tagpick__opt' + (sel.indexOf(t) !== -1 ? " is-on" : "") +
            '" data-tag="' + t + '">' + esc(I18N.t("ptag." + t)) + '</button>';
        }).join("") +
      '</div>' +
      '<input type="hidden" name="tags" value="' + esc(TAG_OPTIONS.filter(function (t) { return sel.indexOf(t) !== -1; }).join(",")) + '">' +
      '<small class="muted" style="font-size:.68rem">' + esc(I18N.t("tags.pickHint")) + '</small>',
      "tags.pick");
  }
  /* Enlaza los chips con el input hidden dentro de `scope` (el <form>). */
  function bindTagPick(scope) {
    var box = scope.querySelector("[data-tagpick]");
    if (!box) return;
    var hidden = scope.querySelector('input[type="hidden"][name="tags"]');
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".tagpick__opt");
      if (!b) return;
      b.classList.toggle("is-on");
      var on = Array.prototype.filter.call(box.querySelectorAll(".tagpick__opt"), function (x) {
        return x.classList.contains("is-on");
      }).map(function (x) { return x.getAttribute("data-tag"); });
      if (hidden) hidden.value = on.join(",");
    });
  }

  /* Campo de imagen: acepta URL externa O archivo local (con vista previa).
     `value` (opcional) precarga el campo de texto — para el modal de EDICIÓN. */
  function imageField(name, i18nKey, ph, multiple, value) {
    return row(i18nKey,
      '<input class="input" name="' + name + '" type="text" placeholder="' + esc(ph) + '" value="' + esc(value || "") + '">' +
      '<div class="uplfield">' +
        '<label class="uplfield__btn">' +
          '<input type="file" data-file="' + name + '" accept="image/png,image/jpeg,image/webp,image/gif"' +
            (multiple ? ' multiple' : '') + '>' +
          '<span>📁 ' + esc(I18N.t("prodadm.orUpload")) + '</span>' +
        '</label>' +
        '<div class="uplfield__prev" data-prev="' + name + '"></div>' +
      '</div>');
  }

  function renderPreviews(fileInput, box) {
    box.innerHTML = "";
    Array.prototype.slice.call(fileInput.files || []).forEach(function (f) {
      if (!/^image\//.test(f.type)) return;
      var img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      img.onload = function () { URL.revokeObjectURL(img.src); };
      box.appendChild(img);
    });
  }

  /** Sube cada File a /products/upload y resuelve con la lista de URLs públicas. */
  function uploadFiles(files) {
    return Promise.all(files.map(function (f) {
      var fd = new FormData();
      fd.append("file", f);
      return API.upload("products/upload", fd).then(function (r) { return r.url; });
    }));
  }

  /* ---- Alta de producto — modal ÚNICO compartido por Admin y Gerente ---- */
  function newProductModal(branches, cats, done) {
    var c = document.createElement("form");
    var catOpts = cats.map(function (x) {
      return '<option value="' + esc(x.slug) + '">' + esc(I18N.pick({ es: x.name_es, en: x.name_en })) + '</option>';
    }).join("");
    c.innerHTML =
      row("prodadm.name", '<input class="input" name="name" required maxlength="180">') +
      '<div class="grid-2">' +
        row("prodadm.category", '<select class="select" name="category_slug" required>' + catOpts + '</select>') +
        row("prodadm.price", '<input class="input" type="number" name="price" min="0" step="0.01" required>') +
      '</div>' +
      '<div class="grid-2">' +
        row("prodadm.maker", '<input class="input" name="manufacturer" maxlength="120" placeholder="Good Smile Company, Panini, DC…" list="prodadm-makers">' +
          '<datalist id="prodadm-makers">' + EDITORIALS.map(function (e) { return '<option value="' + esc(e) + '">'; }).join("") + '</datalist>') +
        row("prodadm.scale", '<input class="input" name="scale" maxlength="60" placeholder="1/7, Nendoroid, POP UP PARADE…">') +
      '</div>' +
      row("prodadm.synopsis", '<textarea class="input" name="description" rows="3" maxlength="500" ' +
        'placeholder="' + esc(I18N.t("prodadm.synopsisPh")) + '"></textarea>') +
      imageField("figure_png_url", "prodadm.figurePng",
        "https://….png  —  o sube un PNG recortado del equipo", false) +
      imageField("image_url", "prodadm.image",
        "https://…, https://…  —  o sube fotos del equipo", true) +
      tagField("") +
      '<p class="field__label mono" style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em;margin:.4rem 0 .5rem">' +
        esc(I18N.t("prodadm.stockByBranch")) + '</p>' +
      '<div class="pkm-branches">' + branches.map(function (b) {
        return '<label class="pkm-branch"><span>' + esc(b.name) + '</span>' +
          '<input class="input" type="number" min="0" step="1" value="0" data-branch="' + b.id + '"></label>';
      }).join("") + '</div>' +
      formButtons();

    var m = UI.modal({ title: I18N.t("prodadm.new"), content: c, wide: true });
    bindTagPick(c);

    // Vista previa de los archivos locales elegidos.
    c.querySelectorAll("[data-file]").forEach(function (fi) {
      fi.addEventListener("change", function () {
        renderPreviews(fi, c.querySelector('[data-prev="' + fi.getAttribute("data-file") + '"]'));
      });
    });

    bindForm(c, m, function (payload) {
      var stock = {}, any = false;
      c.querySelectorAll("[data-branch]").forEach(function (inp) {
        var n = Math.max(0, parseInt(inp.value, 10) || 0);
        if (n > 0) { stock[inp.getAttribute("data-branch")] = n; any = true; }
      });
      if (!any) { return Promise.reject(new Error(I18N.t("prodadm.needStock"))); }

      var slug = payload.category_slug;
      var skuSlug = payload.name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 22);
      var maker = (payload.manufacturer || "").trim();
      var scale = (payload.scale || "").trim();
      var synopsis = (payload.description || "").trim();   // sinopsis en español, editable
      var typedGallery = (payload.image_url || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var typedFigure  = (payload.figure_png_url || "").trim();

      var figFiles = Array.prototype.slice.call(
        (c.querySelector('[data-file="figure_png_url"]') || {}).files || []).slice(0, 1);
      var galFiles = Array.prototype.slice.call(
        (c.querySelector('[data-file="image_url"]') || {}).files || []);

      if (figFiles.length || galFiles.length) UI.toast(I18N.t("prodadm.uploading"), "ok");

      // 1) sube los archivos locales (si hay); 2) arma el draft con URLs + subidas.
      return Promise.all([
        figFiles.length ? uploadFiles(figFiles) : Promise.resolve([]),
        galFiles.length ? uploadFiles(galFiles) : Promise.resolve([])
      ]).catch(function (err) {
        throw new Error((err && err.message) || I18N.t("prodadm.uploadFail"));
      }).then(function (res) {
        var figurePng = res[0][0] || typedFigure;
        var images = typedGallery.concat(res[1]);
        var draft = {
          source: "manual",
          sku: (PRV_PREFIX[slug] || "GEN") + "-" + skuSlug,
          name: payload.name.trim(),
          category_slug: slug,
          price: parseFloat(payload.price) || 0,
          image_url: images.join(","),          // fotos de galería (URLs + subidas)
          figure_png_url: figurePng,            // figura recortada (PNG transparente) para la vista 3D
          manufacturer: maker,
          scale: scale,
          // Sinopsis en español (si se escribió) + ficha técnica; el back guarda
          // esto en products.description y la tienda lo muestra como sinopsis.
          description: [maker, scale].filter(Boolean).concat(synopsis ? [synopsis] : []).join(" · ")
                       || synopsis || "Alta manual",
          tags: (payload.tags || "").trim(),
          stock_by_branch: stock
        };
        return API.post("products/import", draft);
      }).then(function () {
        UI.toast(I18N.t("toast.created"), "ok");
        UI.closeModal();
        V._catalogChanged();
        done();
      });
    });
  }

  /* ---------------- Importar carta Pokémon TCG ---------------- */
  function pkmImportModal(branchesList, done) {
    if (!window.PokemonAPI) { UI.toast("Servicio Pokémon TCG no disponible.", "error"); return; }

    var wrap = document.createElement("div");
    wrap.className = "pkm-import";
    wrap.innerHTML =
      '<div class="pkm-search" data-pkm-search>' +
        '<input class="input" data-pkm-q placeholder="' + esc(I18N.t("pkm.searchPh")) + '" autocomplete="off">' +
        '<select class="select" data-pkm-set><option value="">' + esc(I18N.t("pkm.allSets")) + '</option></select>' +
      '</div>' +
      '<div class="pkm-results" data-pkm-results><p class="muted">' + esc(I18N.t("pkm.hint")) + '</p></div>' +
      '<div data-pkm-form hidden></div>';
    UI.modal({ title: I18N.t("pkm.title"), content: wrap, wide: true });

    var qEl = wrap.querySelector("[data-pkm-q]");
    var setEl = wrap.querySelector("[data-pkm-set]");
    var searchEl = wrap.querySelector("[data-pkm-search]");
    var resultsEl = wrap.querySelector("[data-pkm-results]");
    var formEl = wrap.querySelector("[data-pkm-form]");
    var lastCards = [];

    PokemonAPI.listSets().then(function (sets) {
      setEl.insertAdjacentHTML("beforeend", sets.slice(0, 300).map(function (s) {
        return '<option value="' + esc(s.id) + '">' + esc(s.name + (s.series ? " — " + s.series : "")) + '</option>';
      }).join(""));
    });

    var run = UI.debounce(function () {
      var name = qEl.value.trim();
      if (name.length < 2 && !setEl.value) {
        resultsEl.innerHTML = '<p class="muted">' + esc(I18N.t("pkm.hint")) + '</p>';
        return;
      }
      resultsEl.innerHTML = V._loading();
      PokemonAPI.searchCards({ name: name, setId: setEl.value, pageSize: 24 }).then(function (res) {
        lastCards = res.cards;
        if (!res.cards.length) {
          resultsEl.innerHTML = '<div class="state"><div class="state__icon">🔍</div><p>' + esc(I18N.t("empty.none")) + '</p></div>';
          return;
        }
        resultsEl.innerHTML = '<div class="pkm-grid">' + res.cards.map(cardCell).join("") + '</div>' +
          '<p class="muted mono" style="font-size:.72rem;margin-top:.6rem">' + res.total + ' ' + esc(I18N.t("pkm.results")) + '</p>';
      }).catch(function (e) {
        resultsEl.innerHTML = '<p class="muted">' + esc((e && e.message) || "Error") + '</p>';
      });
    }, 320);
    qEl.addEventListener("input", run);
    setEl.addEventListener("change", run);

    resultsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (!b) return;
      var card = lastCards.find(function (c) { return c.id === b.getAttribute("data-pick"); });
      if (card) showForm(card);
    });

    function cardCell(c) {
      var price = PokemonAPI.marketPrice(c);
      return '<article class="pkm-card">' +
        '<img class="pkm-card__img" src="' + esc(c.imageSmall) + '" alt="' + esc(c.name) + '" loading="lazy">' +
        '<div class="pkm-card__body">' +
          '<h4 class="pkm-card__name">' + esc(c.name) + '</h4>' +
          '<p class="pkm-card__meta">' + esc([c.supertype].concat(c.types || []).filter(Boolean).join(" · ") || "—") + '</p>' +
          (c.rarity ? '<span class="pkm-rarity">' + esc(c.rarity) + '</span>' : '<span></span>') +
          '<p class="pkm-card__price">' + (price != null ? UI.money(price) : "—") + '</p>' +
          '<button class="btn btn--neon btn--sm" data-pick="' + esc(c.id) + '">' + esc(I18N.t("pkm.select")) + '</button>' +
        '</div>' +
      '</article>';
    }

    function showForm(card) {
      var price = PokemonAPI.marketPrice(card) || 0;
      searchEl.hidden = true;
      resultsEl.hidden = true;
      formEl.hidden = false;
      formEl.innerHTML =
        '<button class="btn btn--ghost btn--sm" data-pkm-back>← ' + esc(I18N.t("pkm.back")) + '</button>' +
        '<div class="pkm-selected">' +
          '<img src="' + esc(card.image || card.imageSmall) + '" alt="' + esc(card.name) + '">' +
          '<div class="pkm-selected__info">' +
            '<h3>' + esc(card.name) + '</h3>' +
            '<p class="muted">' + esc([card.set && card.set.name, card.number && ("#" + card.number), card.rarity].filter(Boolean).join(" · ")) + '</p>' +
            '<div class="field"><label>' + esc(I18N.t("pkm.price")) + ' (MXN)</label>' +
              '<input class="input" type="number" min="0" step="0.01" data-pkm-price value="' + price.toFixed(2) + '"></div>' +
            '<div class="field"><label>SKU</label><input class="input" data-pkm-sku value="' + esc(PokemonAPI.skuFor(card)) + '"></div>' +
          '</div>' +
        '</div>' +
        '<p class="pkm-form__h">' + esc(I18N.t("pkm.stockByBranch")) + '</p>' +
        '<div class="pkm-branches">' + branchesList.map(function (b) {
          return '<label class="pkm-branch"><span>' + esc(b.name) + '</span>' +
            '<input class="input" type="number" min="0" step="1" value="0" data-branch="' + b.id + '"></label>';
        }).join("") + '</div>' +
        '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
          '<button class="btn btn--ghost" data-pkm-cancel>' + esc(I18N.t("btn.cancel")) + '</button>' +
          '<button class="btn btn--neon" data-pkm-save>' + esc(I18N.t("pkm.save")) + '</button>' +
        '</div>';

      function backToList() {
        formEl.hidden = true; formEl.innerHTML = "";
        resultsEl.hidden = false; searchEl.hidden = false;
      }
      formEl.querySelector("[data-pkm-back]").onclick = backToList;
      formEl.querySelector("[data-pkm-cancel]").onclick = backToList;

      formEl.querySelector("[data-pkm-save]").onclick = function () {
        var stock = {}, any = false;
        formEl.querySelectorAll("[data-branch]").forEach(function (inp) {
          var n = Math.max(0, parseInt(inp.value, 10) || 0);
          if (n > 0) { stock[inp.getAttribute("data-branch")] = n; any = true; }
        });
        if (!any) { UI.toast(I18N.t("pkm.needStock"), "warn"); return; }

        var draft = PokemonAPI.toProductDraft(card, stock);
        draft.price = parseFloat(formEl.querySelector("[data-pkm-price]").value) || draft.price;
        draft.sku = (formEl.querySelector("[data-pkm-sku]").value || "").trim().toUpperCase() || draft.sku;

        var btn = formEl.querySelector("[data-pkm-save]");
        btn.classList.add("is-loading");
        API.post("products/import", draft).then(function (r) {
          var n = (r.created ? r.created.length : 0) + (r.updated ? r.updated.length : 0);
          UI.toast(I18N.t("pkm.saved", { n: n }), "ok");
          UI.closeModal();
          V._catalogChanged();
          done();
        }).catch(function (err) {
          btn.classList.remove("is-loading");
          apiToast(err);
        });
      };
    }
  }

  /* ---------------- Importar / alta rápida de FIGURA ---------------- */
  function figureImportModal(branchesList, done) {
    if (!window.FigureAPI) { UI.toast(I18N.t("fig.unavailable"), "error"); return; }

    var wrap = document.createElement("div");
    wrap.className = "pkm-import";
    wrap.innerHTML =
      '<div class="pkm-search" data-fig-search>' +
        '<input class="input" data-fig-q placeholder="' + esc(I18N.t("fig.searchPh")) + '" autocomplete="off">' +
      '</div>' +
      '<div class="pkm-results" data-fig-results><p class="muted">' + esc(I18N.t("fig.hint")) + '</p></div>' +
      '<div data-fig-form hidden></div>';
    UI.modal({ title: I18N.t("fig.title"), content: wrap, wide: true });

    var qEl = wrap.querySelector("[data-fig-q]");
    var searchEl = wrap.querySelector("[data-fig-search]");
    var resultsEl = wrap.querySelector("[data-fig-results]");
    var formEl = wrap.querySelector("[data-fig-form]");
    var lastItems = [];

    var run = UI.debounce(function () {
      var name = qEl.value.trim();
      if (name.length < 2) { resultsEl.innerHTML = '<p class="muted">' + esc(I18N.t("fig.hint")) + '</p>'; return; }
      resultsEl.innerHTML = V._loading();
      FigureAPI.search({ name: name }).then(function (res) {
        lastItems = res.items;
        if (!res.items.length) {
          resultsEl.innerHTML = '<div class="state"><div class="state__icon">🔍</div><p>' + esc(I18N.t("empty.none")) + '</p></div>';
          return;
        }
        var srcNote = res.source === "amiami" ? "AmiAmi" : I18N.t("fig.localSource");
        resultsEl.innerHTML = '<div class="pkm-grid">' + res.items.map(cell).join("") + '</div>' +
          '<p class="muted mono" style="font-size:.72rem;margin-top:.6rem">' + res.items.length + ' ' + esc(I18N.t("fig.results")) + ' · ' + esc(srcNote) + '</p>';
      }).catch(function (e) {
        resultsEl.innerHTML = '<p class="muted">' + esc((e && e.message) || "Error") + '</p>';
      });
    }, 340);
    qEl.addEventListener("input", run);

    resultsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (!b) return;
      var f = lastItems[+b.getAttribute("data-pick")];
      if (f) showForm(f);
    });

    function cell(f, i) {
      var price = FigureAPI.suggestedPriceMXN(f);
      return '<article class="pkm-card">' +
        '<img class="pkm-card__img" src="' + esc(f.image_url) + '" alt="' + esc(f.name) + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'assets/images/figures/placeholder.svg\'">' +
        '<div class="pkm-card__body">' +
          '<h4 class="pkm-card__name">' + esc(f.name) + '</h4>' +
          '<p class="pkm-card__meta">' + esc([f.manufacturer, f.scale].filter(Boolean).join(" · ") || "—") + '</p>' +
          '<p class="pkm-card__price">' + (price != null ? UI.money(price) : "—") + '</p>' +
          '<button class="btn btn--neon btn--sm" data-pick="' + i + '">' + esc(I18N.t("fig.select")) + '</button>' +
        '</div>' +
      '</article>';
    }

    function showForm(fig) {
      var price = FigureAPI.suggestedPriceMXN(fig) || 0;
      searchEl.hidden = true; resultsEl.hidden = true; formEl.hidden = false;
      formEl.innerHTML =
        '<button class="btn btn--ghost btn--sm" data-fig-back>← ' + esc(I18N.t("fig.back")) + '</button>' +
        '<div class="pkm-selected">' +
          '<img src="' + esc(fig.image_url) + '" alt="' + esc(fig.name) + '" ' +
            'onerror="this.onerror=null;this.src=\'assets/images/figures/placeholder.svg\'">' +
          '<div class="pkm-selected__info">' +
            '<h3>' + esc(fig.name) + '</h3>' +
            '<div class="field"><label>' + esc(I18N.t("prod.manufacturer")) + '</label>' +
              '<input class="input" data-fig-maker value="' + esc(fig.manufacturer) + '"></div>' +
            '<div class="field"><label>' + esc(I18N.t("prod.scale")) + '</label>' +
              '<input class="input" data-fig-scale value="' + esc(fig.scale) + '"></div>' +
            '<div class="field"><label>' + esc(I18N.t("fig.price")) + ' (MXN)</label>' +
              '<input class="input" type="number" min="0" step="0.01" data-fig-price value="' + price.toFixed(2) + '"></div>' +
            '<div class="field"><label>SKU</label><input class="input" data-fig-sku value="' + esc(FigureAPI.skuFor(fig)) + '"></div>' +
          '</div>' +
        '</div>' +
        '<p class="pkm-form__h">' + esc(I18N.t("fig.stockByBranch")) + '</p>' +
        '<div class="pkm-branches">' + branchesList.map(function (b) {
          return '<label class="pkm-branch"><span>' + esc(b.name) + '</span>' +
            '<input class="input" type="number" min="0" step="1" value="0" data-branch="' + b.id + '"></label>';
        }).join("") + '</div>' +
        '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
          '<button class="btn btn--ghost" data-fig-cancel>' + esc(I18N.t("btn.cancel")) + '</button>' +
          '<button class="btn btn--neon" data-fig-save>' + esc(I18N.t("fig.save")) + '</button>' +
        '</div>';

      function back() { formEl.hidden = true; formEl.innerHTML = ""; resultsEl.hidden = false; searchEl.hidden = false; }
      formEl.querySelector("[data-fig-back]").onclick = back;
      formEl.querySelector("[data-fig-cancel]").onclick = back;

      formEl.querySelector("[data-fig-save]").onclick = function () {
        var stock = {}, any = false;
        formEl.querySelectorAll("[data-branch]").forEach(function (inp) {
          var n = Math.max(0, parseInt(inp.value, 10) || 0);
          if (n > 0) { stock[inp.getAttribute("data-branch")] = n; any = true; }
        });
        if (!any) { UI.toast(I18N.t("fig.needStock"), "warn"); return; }

        fig.manufacturer = (formEl.querySelector("[data-fig-maker]").value || "").trim() || fig.manufacturer;
        fig.scale = (formEl.querySelector("[data-fig-scale]").value || "").trim() || fig.scale;
        var draft = FigureAPI.toProductDraft(fig, stock);
        draft.price = parseFloat(formEl.querySelector("[data-fig-price]").value) || draft.price;
        draft.sku = (formEl.querySelector("[data-fig-sku]").value || "").trim().toUpperCase() || draft.sku;

        var btn = formEl.querySelector("[data-fig-save]");
        btn.classList.add("is-loading");
        API.post("products/import", draft).then(function (r) {
          var n = (r.created ? r.created.length : 0) + (r.updated ? r.updated.length : 0);
          UI.toast(I18N.t("fig.saved", { n: n }), "ok");
          UI.closeModal();
          V._catalogChanged();
          done();
        }).catch(function (err) {
          btn.classList.remove("is-loading");
          apiToast(err);
        });
      };
    }
  }

  function alertsTable(rows) {
    return V._table([
      { key: "name", label: I18N.t("col.product"), render: function (r) { return '<b>' + esc(r.name) + '</b><br><span class="mono muted" style="font-size:.7rem">' + esc(r.sku) + '</span>'; } },
      { key: "branch_name", label: I18N.t("col.branch"), render: function (r) { return esc(r.branch_name); } },
      { key: "stock", label: I18N.t("col.stock"), cls: "num", render: function (r) { return '<span class="badge ' + (r.out_of_stock ? "badge--danger" : "badge--warn") + '">' + r.stock + '</span>'; } },
      { key: "min_stock", label: I18N.t("col.min"), cls: "num" }
    ], rows, { empty: I18N.t("empty.none") });
  }

  function movesTable(rows) {
    return V._table([
      { key: "created_at", label: I18N.t("col.date"), render: function (r) { return '<span class="muted" style="font-size:.78rem">' + UI.fmtDate(r.created_at, true) + '</span>'; } },
      { key: "product_name", label: I18N.t("col.product"), render: function (r) { return esc(r.product_name || "—"); } },
      { key: "branch_name", label: I18N.t("col.branch"), render: function (r) { return esc(r.branch_name || "—"); } },
      { key: "type", label: I18N.t("col.movement"), render: function (r) { return '<span class="badge">' + esc(r.type) + '</span>'; } },
      { key: "quantity_delta", label: I18N.t("col.delta"), cls: "num", render: function (r) { return (r.quantity_delta > 0 ? "+" : "") + r.quantity_delta; } },
      { key: "resulting_stock", label: I18N.t("col.result"), cls: "num" },
      { key: "user_name", label: I18N.t("col.cashier"), render: function (r) { return esc(r.user_name || "—"); } }
    ], rows, { empty: I18N.t("empty.none") });
  }

  /* ---------------- helpers de formulario ---------------- */
  function row(i18nKey, controlHTML, labelKey) {
    return '<div class="field"><label>' + esc(I18N.t(labelKey || ("form." + i18nKey))) + '</label>' + controlHTML + '</div>';
  }
  function formButtons() {
    return '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:.4rem">' +
      '<button type="button" class="btn btn--ghost" data-cancel>' + esc(I18N.t("btn.cancel")) + '</button>' +
      '<button type="submit" class="btn btn--neon">' + esc(I18N.t("btn.save")) + '</button></div>';
  }
  function bindForm(form, modalEl, submitFn) {
    form.querySelector("[data-cancel]").addEventListener("click", UI.closeModal);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name) payload[el.name] = el.value;
      });
      var btn = form.querySelector('button[type="submit"]');
      btn.classList.add("is-loading");
      submitFn(payload).catch(function (err) {
        btn.classList.remove("is-loading");
        apiToast(err);
        if (err.data && err.data.fields) {
          Object.keys(err.data.fields).forEach(function (f) {
            var input = form.elements[f];
            if (input) { input.closest(".field").classList.add("has-error"); }
          });
        }
      });
    });
  }
  function apiToast(err) {
    UI.toast((err && err.message) || I18N.t("toast.error"), "error");
  }

  V.admin = { render: render, mount: mount, roles: ["admin"] };
  V.productModal = newProductModal;   // modal de alta compartido (usado también por Gerente)
  V._inventoryView = inventory;       // vista de inventario completa (plegado de series,
                                      // tarjetas, editar / ± ajustar stock — en manga y
                                      // cómics el ajuste abre el modal de tomos) — la reusa
                                      // el panel de Gerente acotada a su sucursal.
})();
