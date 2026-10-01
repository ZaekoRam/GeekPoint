/* =============================================================
   PWA: registro del Service Worker + instalación.  window.PWA

   · Registra sw.js (solo en contexto seguro: HTTPS o localhost).
   · Distingue navegador vs. app instalada (display-mode / iOS standalone)
     y lo expone en <html data-display-mode> + .is-standalone.
   · Instalación REAL según la plataforma — nunca un botón que no hace nada:
       - Chromium (Chrome/Edge/Samsung, Android y escritorio): se guarda el
         evento `beforeinstallprompt` y el botón llama a su prompt().
       - iOS/iPadOS (no hay prompt): instrucciones Compartir → Añadir a
         pantalla de inicio.
       - Safari macOS 17+: instrucciones Archivo → Añadir al Dock.
       - Resto (Firefox escritorio, etc.) o ya instalada: no se muestra nada.
   · Puntos de entrada: botón compacto del topbar [data-pwa-install] y un
     aviso discreto (.pwa-hint) que aparece como mucho una vez por semana,
     nunca en login/POS/ticket, y que se descarta 30 días con "Ahora no".
   ============================================================= */
(function () {
  "use strict";
  var $ = UI.$, $$ = UI.$$;

  var HINT_KEY = "gp_pwa_hint_until";
  var HINT_DELAY = 15000;           // ms de uso antes de sugerir la instalación
  var HINT_AUTOHIDE = 30000;
  var HINT_VIEWS = ["store", "account", "admin", "manager"];
  var DAY = 864e5;

  var deferredPrompt = null;
  var hintEl = null, hintTimer = null, hintTries = 0, hideTimer = null;

  /* ---------- plataforma ---------- */
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);   // iPadOS con UA de escritorio
  var isIOSSafari = isIOS && /Safari\//.test(ua) &&
                    !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|FBAN|FBAV|Instagram|Line\//.test(ua);
  var macSafariVer = !isIOS && /Macintosh/.test(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\/|Firefox\//.test(ua)
                     ? Number((ua.match(/Version\/(\d+)[\d.]* Safari\//) || [])[1]) : 0;
  var isMacSafari = macSafariVer >= 17;

  function isStandalone() {
    var modes = ["standalone", "minimal-ui", "window-controls-overlay"];
    for (var i = 0; i < modes.length; i++) {
      if (window.matchMedia && matchMedia("(display-mode: " + modes[i] + ")").matches) return true;
    }
    return navigator.standalone === true;   // iOS: pantalla de inicio
  }

  /** "prompt" | "ios" | "mac-safari" | null (no hay instalación posible ahora). */
  function installMode() {
    if (isStandalone()) return null;
    if (deferredPrompt) return "prompt";
    if (isIOS) return "ios";
    if (isMacSafari) return "mac-safari";
    return null;
  }

  /* ---------- Service Worker ---------- */
  function registerSW() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    var go = function () {
      navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" })
        .catch(function (err) { console.warn("[pwa] service worker", err); });
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go);
  }

  /* ---------- aviso discreto ---------- */
  function hintSnoozed() {
    try { return Date.now() < Number(localStorage.getItem(HINT_KEY) || 0); } catch (e) { return false; }
  }
  function snoozeHint(days) {
    try {
      var until = Math.max(Number(localStorage.getItem(HINT_KEY) || 0), Date.now() + days * DAY);
      localStorage.setItem(HINT_KEY, String(until));
    } catch (e) {}
  }

  function hideHint() {
    clearTimeout(hideTimer);
    if (!hintEl) return;
    var el = hintEl;
    hintEl = null;
    if (UI.reduced) { el.remove(); return; }
    el.classList.remove("is-in");
    setTimeout(function () { el.remove(); }, 260);
  }

  function hintBlocked() {
    var view = window.Router ? Router.current().view : "store";
    return document.hidden ||
      HINT_VIEWS.indexOf(view) === -1 ||
      document.documentElement.classList.contains("modal-open") ||
      !!$("[data-cart-drawer].is-open");
  }

  function scheduleHint() {
    clearTimeout(hintTimer);
    if (hintEl || hintSnoozed() || !installMode()) return;
    hintTimer = setTimeout(maybeShowHint, HINT_DELAY);
  }

  function maybeShowHint() {
    if (hintEl || hintSnoozed()) return;
    var mode = installMode();
    if (!mode) return;
    if (hintBlocked()) {
      // Momento inoportuno (login, POS, modal abierto…): reintenta luego, sin insistir.
      if (++hintTries < 8) hintTimer = setTimeout(maybeShowHint, HINT_DELAY);
      return;
    }
    snoozeHint(7);   // mostrado = no se repite en una semana aunque se ignore

    var el = document.createElement("aside");
    el.className = "pwa-hint";
    el.setAttribute("aria-labelledby", "pwaHintTitle");
    el.innerHTML =
      '<span class="brand__glyph pwa-hint__glyph" aria-hidden="true">G</span>' +
      '<div class="pwa-hint__text" aria-live="polite">' +
        '<b id="pwaHintTitle" data-i18n="pwa.hint.title"></b>' +
        '<span data-i18n="pwa.hint.body"></span>' +
      '</div>' +
      '<div class="pwa-hint__actions">' +
        '<button type="button" class="btn btn--panini btn--sm" data-pwa-hint-install data-i18n="' +
          (mode === "prompt" ? "pwa.hint.cta" : "pwa.hint.ctaHow") + '"></button>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-pwa-hint-dismiss data-i18n="pwa.hint.dismiss"></button>' +
      '</div>';
    I18N.apply(el);
    document.body.appendChild(el);
    hintEl = el;
    void el.offsetWidth;
    el.classList.add("is-in");

    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-pwa-hint-install]")) { hideHint(); install(); }
      else if (e.target.closest("[data-pwa-hint-dismiss]")) { snoozeHint(30); hideHint(); }
    });
    // Se retira solo si el usuario no interactúa con él.
    var keep = function () { clearTimeout(hideTimer); };
    el.addEventListener("pointerenter", keep);
    el.addEventListener("focusin", keep);
    hideTimer = setTimeout(hideHint, HINT_AUTOHIDE);
  }

  /* ---------- instrucciones (iOS / Safari macOS) ---------- */
  var ICO = {
    share: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    add: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    done: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  function showInstructions(mode) {
    var steps, notes = [], title;
    if (mode === "mac-safari") {
      title = "pwa.mac.title";
      steps = [[ICO.menu, "pwa.mac.step1"], [ICO.done, "pwa.mac.step2"]];
    } else {
      title = "pwa.ios.title";
      steps = [
        [ICO.share, isIOSSafari ? "pwa.ios.step1" : "pwa.ios.step1Other"],
        [ICO.add, "pwa.ios.step2"],
        [ICO.done, "pwa.ios.step3"]
      ];
      if (!isIOSSafari) notes.push("pwa.ios.otherNote");
      notes.push("pwa.ios.already");
    }
    var box = document.createElement("div");
    box.className = "pwa-steps";
    box.innerHTML =
      '<ol class="pwa-steps__list">' + steps.map(function (s) {
        return '<li><span class="pwa-steps__ico">' + s[0] + '</span><span data-i18n="' + s[1] + '"></span></li>';
      }).join("") + '</ol>' +
      notes.map(function (k) { return '<p class="pwa-steps__note" data-i18n="' + k + '"></p>'; }).join("") +
      '<button type="button" class="btn btn--panini btn--block" data-pwa-steps-ok data-i18n="pwa.gotIt"></button>';
    UI.modal({ title: I18N.t(title), content: box, className: "modal--pwa" });
    box.querySelector("[data-pwa-steps-ok]").addEventListener("click", UI.closeModal);
  }

  /* ---------- instalar ---------- */
  function install() {
    var mode = installMode();
    if (mode === "prompt") {
      var evt = deferredPrompt;
      deferredPrompt = null;          // el evento solo admite un prompt()
      paint();
      evt.prompt();
      return evt.userChoice.then(function (choice) {
        if (!choice || choice.outcome !== "accepted") snoozeHint(30);
        return choice;
      }).catch(function () {});
    }
    if (mode === "ios" || mode === "mac-safari") showInstructions(mode);
    return Promise.resolve(null);
  }

  /* ---------- estado en la UI ---------- */
  function paint() {
    var standalone = isStandalone();
    var root = document.documentElement;
    root.classList.toggle("is-standalone", standalone);
    root.setAttribute("data-display-mode", standalone ? "standalone" : "browser");

    var available = !!installMode();
    $$("[data-pwa-install]").forEach(function (el) { el.hidden = !available; });
    if (!available) hideHint();
  }

  function bind() {
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-pwa-install]")) { e.preventDefault(); hideHint(); install(); }
    });

    window.addEventListener("beforeinstallprompt", function (e) {
      // Sin la mini-infobar automática de Chrome: la instalación se ofrece
      // desde el botón del topbar / el aviso, cuando el usuario quiera.
      e.preventDefault();
      deferredPrompt = e;
      paint();
      scheduleHint();
    });

    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      hideHint();
      paint();
      UI.toast(I18N.t("pwa.installed"), "ok", 5000);
    });

    if (window.matchMedia) {
      var mq = matchMedia("(display-mode: standalone)");
      var onChange = function () { paint(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    window.addEventListener("route:change", function () {
      if (hintEl && hintBlocked()) hideHint();
    });
  }

  function boot() {
    bind();
    paint();
    registerSW();
    scheduleHint();   // iOS / Safari macOS: no hay evento, la disponibilidad se conoce ya
  }

  window.PWA = {
    install: install,
    isStandalone: isStandalone,
    get mode() { return installMode(); }
  };

  boot();
})();
