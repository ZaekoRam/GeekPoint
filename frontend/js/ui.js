/* =============================================================
   Utilidades de UI compartidas.  window.UI
   ============================================================= */
(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safe(fn, name) {
    try { return fn(); } catch (e) { console.warn("[" + (name || fn.name || "fn") + "]", e); }
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms || 200);
    };
  }

  function money(n) {
    var cfg = window.__CONFIG__ || {};
    var loc = (cfg.locale && cfg.locale[(window.I18N && I18N.lang) || "es"]) || "es-MX";
    try {
      return new Intl.NumberFormat(loc, {
        style: "currency", currency: cfg.currency || "MXN", minimumFractionDigits: 2
      }).format(Number(n) || 0);
    } catch (e) {
      return "$" + (Number(n) || 0).toFixed(2);
    }
  }

  function num(n, digits) {
    try {
      return new Intl.NumberFormat("es-MX", { maximumFractionDigits: digits == null ? 0 : digits }).format(Number(n) || 0);
    } catch (e) { return String(n); }
  }

  function fmtDate(s, withTime) {
    if (!s) return "—";
    var d = new Date(String(s).replace(" ", "T"));
    if (isNaN(d)) return s;
    var loc = ((window.I18N && I18N.lang) === "en") ? "en-US" : "es-MX";
    var opts = withTime
      ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" };
    return d.toLocaleString(loc, opts);
  }

  /* ---------- Toasts ---------- */
  function toastLayer() {
    var l = $(".toasts");
    if (!l) { l = document.createElement("div"); l.className = "toasts"; document.body.appendChild(l); }
    return l;
  }
  function toast(msg, kind, ms) {
    var el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.setAttribute("role", "status");
    el.innerHTML = '<span>' + escHTML(msg) + '</span>';
    toastLayer().appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0"; el.style.transform = "translateX(20px)";
      setTimeout(function () { el.remove(); }, 320);
    }, ms || 3200);
  }

  /* ---------- Modal ---------- */
  var openModalEl = null;
  function modal(opts) {
    closeModal();
    opts = opts || {};
    var wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.innerHTML =
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__card' + (opts.wide ? " modal__card--wide" : "") + '" role="dialog" aria-modal="true">' +
        '<button class="modal__close" data-close aria-label="Cerrar">✕</button>' +
        (opts.title ? '<h2 class="modal__title">' + escHTML(opts.title) + '</h2>' : "") +
        '<div class="modal__body"></div>' +
      '</div>';
    var body = wrap.querySelector(".modal__body");
    if (typeof opts.content === "string") body.innerHTML = opts.content;
    else if (opts.content instanceof Node) body.appendChild(opts.content);

    wrap.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", escClose);
    document.body.appendChild(wrap);
    openModalEl = wrap;
    if (window.I18N) I18N.apply(wrap);
    var first = wrap.querySelector("input, select, textarea, button:not([data-close])");
    if (first) safe(function () { first.focus(); });
    if (typeof opts.onMount === "function") safe(function () { opts.onMount(wrap); });
    return wrap;
  }
  function closeModal() {
    if (openModalEl) { openModalEl.remove(); openModalEl = null; document.removeEventListener("keydown", escClose); }
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }

  /* ---------- confirm ---------- */
  function confirmDialog(message, onYes, opts) {
    opts = opts || {};
    var c = document.createElement("div");
    c.innerHTML =
      '<p style="color:var(--muted);margin-bottom:1.3rem">' + escHTML(message) + '</p>' +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end">' +
        '<button class="btn btn--ghost" data-no>' + escHTML(opts.no || (I18N ? I18N.t("btn.cancel") : "Cancelar")) + '</button>' +
        '<button class="btn ' + (opts.danger ? "btn--danger" : "btn--neon") + '" data-yes>' + escHTML(opts.yes || (I18N ? I18N.t("btn.delete") : "Eliminar")) + '</button>' +
      '</div>';
    var m = modal({ title: opts.title || "", content: c });
    c.querySelector("[data-no]").addEventListener("click", closeModal);
    c.querySelector("[data-yes]").addEventListener("click", function () {
      closeModal();
      safe(function () { onYes(); });
    });
  }

  /* ---------- tilt + glow (funcional; solo con hover fino) ---------- */
  function bindTilt(el, max) {
    if (!fineHover) return;
    max = max || 8;
    el.classList.add("tilt");
    function move(e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      el.style.transform = "perspective(700px) rotateX(" + ((0.5 - py) * max).toFixed(2) + "deg) rotateY(" + ((px - 0.5) * max).toFixed(2) + "deg) translateY(-2px)";
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    }
    function leave() { el.style.transform = ""; }
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseout", function (e) { if (!el.contains(e.relatedTarget)) leave(); });
  }

  window.UI = {
    $: $, $$: $$, escHTML: escHTML, safe: safe, debounce: debounce,
    money: money, num: num, fmtDate: fmtDate,
    toast: toast, modal: modal, closeModal: closeModal, confirm: confirmDialog,
    bindTilt: bindTilt,
    reduced: reduced, fineHover: fineHover
  };
})();
