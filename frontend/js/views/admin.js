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
    { href: "#/admin/inventory", i18n: "nav.inventory", ico: "📦" }
  ];

  function activeHref(sub) {
    if (sub === "branches") return "#/admin/branches";
    if (sub === "users") return "#/admin/users";
    if (sub === "inventory") return "#/admin/inventory";
    return "#/admin";
  }

  function render(params) {
    var sub = (params && params.sub) || "";
    var head = "";
    if (sub === "branches") head = '<button class="btn btn--neon btn--sm" data-new-branch>+ ' + esc(I18N.t("btn.newBranch")) + '</button>';
    if (sub === "users") head = '<button class="btn btn--neon btn--sm" data-new-user>+ ' + esc(I18N.t("btn.newUser")) + '</button>';
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

    var loaders = { "": overview, "branches": branches, "users": users, "inventory": inventory };
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
          { label: I18N.t("kpi.branchesActive"), value: k.branches_active + " / " + k.branches_total, mono: true },
          { label: I18N.t("kpi.users"), value: k.users_total, mono: true },
          { label: I18N.t("kpi.products"), value: k.products_total, mono: true },
          { label: I18N.t("kpi.lowStock"), value: k.low_stock_total, mono: true, mod: k.low_stock_total ? "kpi--warn" : "" }
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
          { key: "today_total", label: I18N.t("col.today"), cls: "num right", render: function (r) { return UI.money(r.today_total); } },
          { key: "month_total", label: I18N.t("col.month"), cls: "num right", render: function (r) { return UI.money(r.month_total); } },
          { key: "month_count", label: I18N.t("col.tickets"), cls: "num right", render: function (r) { return r.month_count; } },
          { key: "low_stock", label: I18N.t("col.lowstock"), cls: "num right", render: function (r) { return r.low_stock ? '<span class="badge badge--warn">' + r.low_stock + '</span>' : '0'; } }
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
            '<button class="iconbtn iconbtn--danger" data-del="' + r.id + '" title="' + esc(I18N.t("btn.delete")) + '">🗑</button>' +
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
      (b.id ? row("status",
        '<select class="select" name="status">' +
          '<option value="active"' + (b.status === "active" ? " selected" : "") + '>' + esc(I18N.t("status.active")) + '</option>' +
          '<option value="inactive"' + (b.status === "inactive" ? " selected" : "") + '>' + esc(I18N.t("status.inactive")) + '</option>' +
        '</select>') : "") +
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
            '<button class="iconbtn iconbtn--danger" data-del="' + r.id + '">🗑</button>' : "") +
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

  /* ---------------- Inventario consolidado ---------------- */
  function inventory(panel, root) {
    panel.innerHTML = V._loading();
    Promise.all([API.get("branches"), API.get("inventory/alerts"), API.get("inventory/movements?limit=60")]).then(function (res) {
      var brs = res[0].branches;
      var toolbar = '<div class="toolbar"><label class="muted mono" style="font-size:.75rem">' + esc(I18N.t("col.branch")) + '</label>' +
        '<select class="select" data-branch-filter><option value="">' + esc(I18N.t("pos.all")) + '</option>' +
        brs.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("") + '</select></div>';

      panel.innerHTML = toolbar +
        '<h2 class="mono" style="font-size:.9rem;color:var(--faint);margin:.4rem 0 .6rem">' + esc(I18N.t("misc.alerts")) + '</h2>' +
        '<div data-alerts>' + alertsTable(res[1].alerts) + '</div>' +
        '<h2 class="mono" style="font-size:.9rem;color:var(--faint);margin:1.4rem 0 .6rem">' + esc(I18N.t("misc.movements")) + '</h2>' +
        '<div data-moves>' + movesTable(res[2].movements) + '</div>';

      $("[data-branch-filter]", panel).addEventListener("change", function () {
        var q = this.value ? "?branch_id=" + this.value : "";
        var q2 = this.value ? "&branch_id=" + this.value : "";
        API.get("inventory/alerts" + q).then(function (a) { $("[data-alerts]", panel).innerHTML = alertsTable(a.alerts); });
        API.get("inventory/movements?limit=60" + q2).then(function (m) { $("[data-moves]", panel).innerHTML = movesTable(m.movements); });
      });
    }).catch(function (err) { panel.innerHTML = V._error(err); });
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
})();
