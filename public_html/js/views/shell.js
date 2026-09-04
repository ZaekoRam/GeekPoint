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
      var inner =
        '<div class="kpi__label">' + esc(k.label) + '</div>' +
        '<div class="kpi__value ' + (k.mono ? "num" : "") + '">' + esc(k.value) + '</div>' +
        (k.foot ? '<div class="kpi__foot">' + esc(k.foot) + '</div>' : "");
      // KPI con `href` -> tarjeta navegable (lleva a su sección del panel).
      if (k.href) {
        return '<a class="kpi kpi--link ' + (k.mod || "") + '" href="' + esc(k.href) + '" data-link>' +
          inner + '<span class="kpi__go" aria-hidden="true">→</span></a>';
      }
      return '<div class="kpi ' + (k.mod || "") + '">' + inner + '</div>';
    }).join("") + '</div>';
  }

  /** series: [{day,n,total}] */
  function bars(series, opts) {
    opts = opts || {};
    if (!series || !series.length) return '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>';
    var max = Math.max.apply(null, series.map(function (s) { return Number(s.total) || 0; })) || 1;
    var ticketWord = I18N.t("col.tickets").toLowerCase();
    return '<div class="barchart">' + series.map(function (s) {
      var h = Math.max(4, Math.round((Number(s.total) || 0) / max * 100));
      var label = String(s.day || "").slice(5);
      var n = (s.n != null ? s.n : (s.count != null ? s.count : null));
      // Sin `title=` nativo (retardo de ~1 s): los datos van en data-* y un
      // tooltip propio los muestra al instante (ver bindBarTip()).
      return '<div class="bar" style="height:' + h + '%"' +
        ' data-day="' + esc(label) + '"' +
        ' data-amount="' + esc(UI.money(s.total)) + '"' +
        (n != null ? ' data-count="' + esc(n + " " + ticketWord) + '"' : '') +
        '>' + (opts.labels ? '<span>' + esc(label) + '</span>' : "") + '</div>';
    }).join("") + '</div>';
  }

  /* Tooltip propio para las barras de bars():
     · Aparece al INSTANTE al pasar el puntero (el title nativo tarda ~1 s).
     · UI personalizada (día · importe · nº de tickets), no la del navegador.
     · Un único nodo compartido, position:fixed -> nunca lo recorta la tarjeta.
     Se liga una sola vez a nivel documento; solo reacciona sobre `.barchart .bar`. */
  (function bindBarTip() {
    if (typeof document === "undefined") return;
    var tip = null;

    function ensure() {
      if (tip) return tip;
      tip = document.createElement("div");
      tip.className = "barchart-tip";
      tip.setAttribute("role", "tooltip");
      (document.body || document.documentElement).appendChild(tip);
      return tip;
    }
    /* Ancla el tooltip CENTRADO sobre el borde superior de la barra (no sobre
       el cursor): siempre queda limpio encima, sin tapar la barra. */
    function place(bar) {
      if (!tip || !bar) return;
      var r = bar.getBoundingClientRect();
      var pad = 10, w = tip.offsetWidth, h = tip.offsetHeight;
      var left = Math.min(Math.max(pad, r.left + r.width / 2 - w / 2), window.innerWidth - w - pad);
      var top = r.top - h - 10;
      if (top < pad) top = Math.min(r.top + 8, window.innerHeight - h - pad);  // sin sitio arriba -> dentro
      tip.style.left = Math.round(left) + "px";
      tip.style.top = Math.round(top) + "px";
    }
    function show(bar) {
      var t = ensure();
      t.innerHTML =
        '<b>' + esc(bar.getAttribute("data-day") || "") + '</b>' +
        '<span>' + esc(bar.getAttribute("data-amount") || "") + '</span>' +
        (bar.getAttribute("data-count")
          ? '<em>' + esc(bar.getAttribute("data-count")) + '</em>' : "");
      t.classList.add("is-visible");
      place(bar);                              // mide con el tip ya visible
    }
    function hide() { if (tip) tip.classList.remove("is-visible"); }

    function barAt(e) {
      var el = e.target;
      return (el && el.closest) ? el.closest(".barchart .bar") : null;
    }
    var current = null;
    document.addEventListener("pointerover", function (e) {
      var bar = barAt(e);
      if (bar && bar !== current) { current = bar; show(bar); }
    });
    document.addEventListener("pointermove", function (e) {
      if (!tip || !tip.classList.contains("is-visible")) return;
      var bar = barAt(e);
      if (!bar) { current = null; hide(); }
      else if (bar !== current) { current = bar; show(bar); }
    });
    document.addEventListener("pointerout", function (e) {
      if (barAt(e)) { current = null; hide(); }
    });
    document.addEventListener("pointerdown", function () { current = null; hide(); });
    window.addEventListener("scroll", function () { current = null; hide(); }, true);
    window.addEventListener("hashchange", function () { current = null; hide(); });
  })();

  /**
   * Tabla de datos.
   * @param cols [{key,label,render?,cls?}]
   * @param rows array
   */
  /* Glifos vectoriales para los estados (sin emojis / cuadros rotos). */
  var ICON = {
    empty: '<svg class="state__icon" viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="12" width="34" height="28" rx="3"/><path d="M7 20h34M17 12V8h14v4"/></svg>',
    loading: '<svg class="state__icon" viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="17" opacity=".2"/><path d="M24 7a17 17 0 0 1 17 17"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.9s" repeatCount="indefinite"/></path></svg>',
    error: '<svg class="state__icon" viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 6 44 40H4z"/><path d="M24 18v10"/><circle cx="24" cy="34" r="1.6" fill="currentColor" stroke="none"/></svg>'
  };
  Views._icon = ICON;

  function table(cols, rows, opts) {
    opts = opts || {};
    if (!rows || !rows.length) {
      return '<div class="state">' + ICON.empty + '<p>' + esc(opts.empty || I18N.t("empty.none")) + '</p></div>';
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
    return '<div class="state">' + ICON.loading + '<p>' + esc(I18N.t("misc.loading")) + '</p></div>';
  }

  function errorState(err) {
    var msg = (err && err.status === 0) ? I18N.t("login.noapi") : (err && err.message) || I18N.t("toast.error");
    return '<div class="state">' + ICON.error + '<p>' + esc(msg) + '</p>' +
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

  /* Botón de eliminar: círculo con bote de basura cuya TAPA se abre en :hover.
     Sin texto/píldora — solo el icono animado.  Usado en admin y manager. */
  var TRASH_TOP = "M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z";
  var TRASH_BOT = "M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z";
  /** delButton({ attr:"data-del"|"data-del-sku", value, name }) -> HTML */
  function delButton(o) {
    o = o || {};
    var lbl = esc(I18N.t("btn.delete"));
    return '<span class="del-slot"><button type="button" class="del-btn" ' +
      esc(o.attr || "data-del") + '="' + esc(o.value) + '"' +
      (o.name ? ' data-name="' + esc(o.name) + '"' : '') +
      ' title="' + lbl + '" aria-label="' + lbl + '">' +
        '<svg class="del-svg del-top" viewBox="0 0 69 14" fill="none" aria-hidden="true"><path d="' + TRASH_TOP + '"/></svg>' +
        '<svg class="del-svg del-bottom" viewBox="0 0 69 57" fill="none" aria-hidden="true"><path d="' + TRASH_BOT + '"/></svg>' +
      '</button></span>';
  }

  /* Portada de un producto para las tarjetas de inventario (admin / gerente).
     Orden de preferencia:
       1) su propia image_url (galería separada por comas; relativa -> se ancla
          a la base del API)
       2) portada REAL del catálogo de la tienda casando por serie / título
          (mangas y cómics que no traen imagen propia en `products`)
       3) portada de MARCA generada por el API  /catalog/cover  (igual que usa
          la tienda cuando AniList no responde) — banda de categoría + título
       4) placeholder vectorial en el cliente (sin API / offline)
     Fuente ÚNICA para no duplicar la lógica en cada vista. */
  var VOL_TAIL = /\s*(?:vol\.?|volumen|tomo|t\.|#|n[°º]\.?|no\.?)\s*(\d+(?:\.\d+)?)\s*$/i;
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

  /** Portada real desde el catálogo de la tienda (Catalog.all), o "" si no hay match. */
  function catalogCoverFor(p) {
    if (!window.Catalog || !Catalog.all) return "";
    var items = Catalog.all();
    if (!items || !items.length) return "";
    var full = String((p && p.name) || "");
    var m = full.match(VOL_TAIL);
    var vol = m ? m[1] : null;
    var series = norm(full.replace(VOL_TAIL, ""));
    var whole = norm(full);
    if (!series && !whole) return "";
    var hit = null;
    for (var i = 0; i < items.length; i++) {
      var t = norm(items[i].title), s = norm(items[i].series);
      if (t === whole || s === whole || t === series || s === series ||
          (series && (t === series || s === series))) { hit = items[i]; break; }
    }
    if (!hit) return "";
    // Solo portadas REALES (http). Un data:/blob: del catálogo (p. ej. la caja
    // vectorial de una figura) no aporta nada frente a /catalog/cover.
    var isReal = function (u) { return u && /^https?:/i.test(u); };
    if (vol && hit.volume_covers && hit.volume_covers.length) {
      for (var v = 0; v < hit.volume_covers.length; v++) {
        if (String(hit.volume_covers[v].v) === String(vol) && isReal(hit.volume_covers[v].url)) {
          return hit.volume_covers[v].url;
        }
      }
    }
    return isReal(hit.cover) ? hit.cover : "";
  }

  function productCover(p) {
    var base = ((window.__CONFIG__ || {}).apiBase || "").replace(/\/+$/, "");
    var raw = String((p && p.image_url) || "").split(",")[0].trim();
    if (raw) {
      if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
      return base ? base + "/" + raw.replace(/^\/+/, "") : raw;
    }
    var real = catalogCoverFor(p);
    if (real) return real;
    if (base) {
      return base + "/catalog/cover?kind=" + encodeURIComponent((p && p.category_slug) || "item") +
        "&t=" + encodeURIComponent((p && p.name) || "GeekPoint");
    }
    return (window.Catalog && Catalog.placeholderCover)
      ? Catalog.placeholderCover({ category: (p && p.category_slug) || "item", title: (p && p.name) || "" })
      : "";
  }

  /* Tras crear/editar/borrar un producto: invalida el catálogo de la tienda
     para que el alta se refleje AL INSTANTE (sin importar el filtro activo). */
  function catalogChanged() {
    if (window.Catalog && Catalog.load) {
      Catalog.load(true).then(function () {
        window.dispatchEvent(new CustomEvent("catalog:changed"));
      }).catch(function () {});
    }
  }

  Views._shell = shell;
  Views._delButton = delButton;
  Views._productCover = productCover;
  Views._catalogChanged = catalogChanged;
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
