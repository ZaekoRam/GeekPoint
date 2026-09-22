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

  /**
   * Formato de moneda ÚNICO para toda la tienda, idéntico en ES y EN:
   *   money(3800)        -> "$3,800.00 MXN"
   *   money(3800, true)  -> "$3,800.00"   (sin sufijo — para celdas angostas)
   * No depende de I18N.lang (evita que "en" pinte "MX$3,800.00").
   * Agrupación es-MX (coma millares, punto decimales) + símbolo "$".
   */
  function money(n, bare) {
    var amount = Number(n);
    if (!isFinite(amount)) amount = 0;
    var neg = amount < 0;
    var digits;
    try {
      digits = new Intl.NumberFormat("es-MX", {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(Math.abs(amount));
    } catch (e) {
      digits = Math.abs(amount).toFixed(2);
    }
    return (neg ? "-$" : "$") + digits + (bare ? "" : " MXN");
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
    closeModal(true);                 // reemplazo inmediato: sin animación de salida
    // Barrido de seguridad: nunca deben quedar 2 .modal apilados (p. ej. si uno
    // seguía en su animación de salida cuando se abre el siguiente).
    $$(".modal").forEach(function (m) { m.remove(); });
    opts = opts || {};
    var wrap = document.createElement("div");
    wrap.className = "modal" + (opts.className ? " " + opts.className : "");
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
    document.documentElement.classList.add("modal-open");   // bloquea el scroll de fondo

    // Animación de ENTRADA por clase (keyframes en components.css), no siempre-activa.
    if (!reduced) {
      wrap.classList.add("is-entering");
      var card = wrap.querySelector(".modal__card");
      var done = function () {
        wrap.classList.remove("is-entering");
        card && card.removeEventListener("animationend", done);
      };
      if (card) card.addEventListener("animationend", done);
      setTimeout(done, 450);           // red de seguridad
    }

    if (window.I18N) I18N.apply(wrap);
    var first = wrap.querySelector("input, select, textarea, button:not([data-close])");
    if (first) safe(function () { first.focus(); });
    if (typeof opts.onMount === "function") safe(function () { opts.onMount(wrap); });
    return wrap;
  }
  function closeModal(instant) {
    var el = openModalEl;
    if (!el) return;
    openModalEl = null;
    document.removeEventListener("keydown", escClose);
    document.documentElement.classList.remove("modal-open");
    if (instant === true || reduced) { el.remove(); return; }
    el.classList.remove("is-entering");
    el.classList.add("is-leaving");
    var gone = false;
    var kill = function () { if (gone) return; gone = true; el.remove(); };
    el.addEventListener("animationend", kill);
    setTimeout(kill, 220);             // fallback si no dispara animationend
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }

  /* ---------- Modo de impresión de tickets (térmica 80/58 mm o A4) ---------- */
  var PRINT_KEY = "gp_printmode";
  function printPageCSS(mode) {
    if (mode === "58") return "@page{size:58mm auto;margin:0}";
    if (mode === "a4") return "@page{size:A4;margin:12mm}";
    return "@page{size:80mm auto;margin:0}";                 // 80 = por defecto (térmica)
  }
  function applyPrintMode(mode) {
    mode = (mode === "58" || mode === "a4") ? mode : "80";
    document.documentElement.setAttribute("data-printmode", mode);
    var st = document.getElementById("gp-print-page");
    if (!st) { st = document.createElement("style"); st.id = "gp-print-page"; document.head.appendChild(st); }
    st.textContent = printPageCSS(mode);
    try { localStorage.setItem(PRINT_KEY, mode); } catch (e) {}
    return mode;
  }
  function getPrintMode() {
    try { return localStorage.getItem(PRINT_KEY) || "80"; } catch (e) { return "80"; }
  }
  // aplica el modo guardado en cuanto carga la UI
  applyPrintMode(getPrintMode());

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
    var m = modal({ title: opts.title || "", content: c, className: opts.className });
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

  /* ---------- tooltips (.tip[data-tip]) ---------- */
  // Hover/foco ya los muestra por CSS (components.css); esto SOLO cubre el
  // caso táctil: tocar el icono lo abre/cierra, tocar fuera lo cierra.
  var tipsBound = false;
  function bindTips() {
    if (tipsBound) return;
    tipsBound = true;
    document.addEventListener("click", function (e) {
      var tip = e.target.closest && e.target.closest(".tip");
      $$(".tip.is-open").forEach(function (t) { if (t !== tip) t.classList.remove("is-open"); });
      if (tip) { e.preventDefault(); tip.classList.toggle("is-open"); }
    });
  }
  bindTips();

  window.UI = {
    $: $, $$: $$, escHTML: escHTML, safe: safe, debounce: debounce,
    money: money, num: num, fmtDate: fmtDate,
    toast: toast, modal: modal, openModal: modal, closeModal: closeModal, confirm: confirmDialog,
    bindTilt: bindTilt,
    printMode: getPrintMode, setPrintMode: applyPrintMode,
    reduced: reduced, fineHover: fineHover
  };
})();
