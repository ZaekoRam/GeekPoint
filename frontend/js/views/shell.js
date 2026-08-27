/* =============================================================
   Chrome compartido de los paneles + helpers de render.
   window.Views._shell / _kpi / _bars / _table
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var esc = UI.escHTML;

  /**
   * Construye el layout con barra lateral.
   * @param opts { title, active, nav:[{href,i18n,ico}], body:HTMLstring }
   */
  function shell(opts) {
    var u = STORE.user || { name: "", role: "" };
    var branchName = (STORE.session && STORE.session.branch && STORE.session.branch.name) || "";
    var roleLabel = I18N.t("role." + u.role);

    var nav = (opts.nav || []).map(function (n) {
      var active = n.href === opts.active ? " is-active" : "";
      return '<a class="side__link' + active + '" href="' + n.href + '" data-link>' +
        '<span class="ico">' + (n.ico || "•") + '</span><span>' + esc(I18N.t(n.i18n)) + '</span></a>';
    }).join("");

    return (
      '<div class="shell">' +
        '<aside class="side">' +
          '<div class="side__user">' +
            '<b>' + esc(u.name) + '</b>' +
            '<span>' + esc(roleLabel) + (branchName ? ' · ' + esc(branchName) : "") + '</span>' +
          '</div>' +
          nav +
          '<div class="side__spacer"></div>' +
          '<a class="side__link" href="#/" data-link><span class="ico">↗</span><span>' + esc(I18N.t("nav.home")) + '</span></a>' +
          '<button class="side__link" type="button" data-logout><span class="ico">⏻</span><span>' + esc(I18N.t("cta.logout")) + '</span></button>' +
        '</aside>' +
        '<section class="content" data-content>' +
          '<div class="content__head">' +
            '<h1>' + esc(opts.title) + '</h1>' +
            '<span class="spacer"></span>' +
            (opts.headExtra || "") +
          '</div>' +
          '<div data-panel>' + (opts.body || "") + '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function kpi(list) {
    return '<div class="kpis">' + list.map(function (k) {
      return '<div class="kpi ' + (k.mod || "") + '">' +
        '<div class="kpi__label">' + esc(k.label) + '</div>' +
        '<div class="kpi__value ' + (k.mono ? "num" : "") + '">' + esc(k.value) + '</div>' +
        (k.foot ? '<div class="kpi__foot">' + esc(k.foot) + '</div>' : "") +
      '</div>';
    }).join("") + '</div>';
  }

  /** series: [{day,total}] */
  function bars(series, opts) {
    opts = opts || {};
    if (!series || !series.length) return '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>';
    var max = Math.max.apply(null, series.map(function (s) { return Number(s.total) || 0; })) || 1;
    return '<div class="barchart">' + series.map(function (s) {
      var h = Math.max(4, Math.round((Number(s.total) || 0) / max * 100));
      var label = String(s.day || "").slice(5);
      return '<div class="bar" style="height:' + h + '%" title="' + esc(label + ' · ' + UI.money(s.total)) + '">' +
        (opts.labels ? '<span>' + esc(label) + '</span>' : "") + '</div>';
    }).join("") + '</div>';
  }

  /**
   * Tabla de datos.
   * @param cols [{key,label,render?,cls?}]
   * @param rows array
   */
  function table(cols, rows, opts) {
    opts = opts || {};
    if (!rows || !rows.length) {
      return '<div class="state"><div class="state__icon">🗂️</div><p>' + esc(opts.empty || I18N.t("empty.none")) + '</p></div>';
    }
    var head = cols.map(function (c) { return '<th class="' + (c.cls || "") + '">' + esc(c.label) + '</th>'; }).join("");
    var body = rows.map(function (row) {
      var tds = cols.map(function (c) {
        var val = c.render ? c.render(row) : esc(row[c.key] == null ? "" : row[c.key]);
        return '<td class="' + (c.cls || "") + '">' + val + '</td>';
      }).join("");
      return '<tr data-row-id="' + esc(row.id != null ? row.id : "") + '">' + tds + '</tr>';
    }).join("");
    return '<div class="table-wrap"><table class="data"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function statusBadge(status) {
    var ok = status === "active";
    return '<span class="badge ' + (ok ? "badge--ok" : "badge--danger") + '">' +
      esc(I18N.t(ok ? "status.active" : "status.inactive")) + '</span>';
  }

  function loading() {
    return '<div class="state"><div class="state__icon">⏳</div><p>' + esc(I18N.t("misc.loading")) + '</p></div>';
  }

  function errorState(err) {
    var msg = (err && err.status === 0) ? I18N.t("login.noapi") : (err && err.message) || I18N.t("toast.error");
    return '<div class="state"><div class="state__icon">⚠️</div><p>' + esc(msg) + '</p>' +
      '<p class="mt"><button class="btn btn--ghost" data-reload>' + esc(I18N.t("btn.retry")) + '</button></p></div>';
  }

  /* ---------- helpers de formulario en modal ---------- */
  function formRow(labelText, controlHTML) {
    return '<div class="field"><label>' + esc(labelText) + '</label>' + controlHTML + '</div>';
  }
  function formButtons() {
    return '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:.4rem">' +
      '<button type="button" class="btn btn--ghost" data-cancel>' + esc(I18N.t("btn.cancel")) + '</button>' +
      '<button type="submit" class="btn btn--neon">' + esc(I18N.t("btn.save")) + '</button></div>';
  }
  function bindForm(form, submitFn) {
    var cancel = form.querySelector("[data-cancel]");
    if (cancel) cancel.addEventListener("click", UI.closeModal);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) payload[el.name] = el.value; });
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.classList.add("is-loading");
      Promise.resolve(submitFn(payload)).catch(function (err) {
        if (btn) btn.classList.remove("is-loading");
        apiToast(err);
        if (err && err.data && err.data.fields) {
          Object.keys(err.data.fields).forEach(function (f) {
            var input = form.elements[f];
            if (input && input.closest(".field")) input.closest(".field").classList.add("has-error");
          });
        }
      });
    });
  }
  function apiToast(err) { UI.toast((err && err.message) || I18N.t("toast.error"), "error"); }

  Views._shell = shell;
  Views._kpi = kpi;
  Views._bars = bars;
  Views._table = table;
  Views._statusBadge = statusBadge;
  Views._loading = loading;
  Views._error = errorState;
  Views._formRow = formRow;
  Views._formButtons = formButtons;
  Views._bindForm = bindForm;
  Views._apiToast = apiToast;
})();
