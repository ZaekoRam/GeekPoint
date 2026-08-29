/* =============================================================
   Modo Oscuro (solo tienda pública) + animación "Circular Reveal"
   ------------------------------------------------------------------
   - Preferencia en localStorage ('gp_theme'); por defecto: claro.
     Primera visita sin dato guardado → claro (no se consulta el SO).
   - Atributo data-theme="dark" en <html>. La paleta oscura vive en
     tokens.css bajo  :root[data-theme="dark"] body:not(.in-app),
     así el tema cyber de los módulos internos (.in-app) no se toca.
   - El anti-flash lo hace un <script> inline en el <head>; aquí solo
     se maneja el toggle, la animación y la persistencia.

   Detalles de implementación:
   - Disparador = evento 'change' del checkbox: se dispara una sola vez
     por activación (ratón, toque o teclado). Enganchar el 'click' del
     <label>, como en el snippet original, se dispara dos veces en un
     clic real y el tema volvía a su estado anterior.
   - El "circular reveal" es 100% CSS (components.css): aquí solo se
     añade la clase .theme-toggle-transition al <html> y se definen las
     variables --h-theme-toggle-x/y/r con el punto del clic antes de
     llamar a startViewTransition; la clase se quita al terminar.
   - `desired` guarda la última intención del usuario; la animación
     puede tardar 550 ms y el usuario podría volver a pulsar antes.
   - Si la pestaña no está visible, startViewTransition no ejecuta su
     callback → se aplica el cambio directo, sin wipe.
   ============================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "gp_theme";

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  var current = stored() === "dark" ? "dark" : "light";
  var desired = current;      // última intención del usuario
  var pointer = null;         // punto del último gesto, para centrar el círculo
  var animating = false;      // hay un "circular reveal" en curso

  function reflect() {
    document.documentElement.setAttribute("data-theme", current);

    var toggle = document.querySelector(".themeToggle");
    if (toggle) toggle.setAttribute("aria-label",
      current === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");

    var checkbox = document.querySelector(".themeToggleInput");
    if (checkbox && checkbox.checked !== (current === "dark"))
      checkbox.checked = current === "dark";
  }

  // Sincroniza DOM + almacenamiento con `desired`.
  function apply() {
    current = desired;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
    reflect();
  }

  function centerOfToggle() {
    var el = document.querySelector(".themeToggle");
    var r = el && el.getBoundingClientRect();
    return r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth, y: 0 };
  }

  var TRANSITION_CLASS = "theme-toggle-transition";

  function clearReveal() {
    var root = document.documentElement;
    root.classList.remove(TRANSITION_CLASS);
    root.style.removeProperty("--h-theme-toggle-x");
    root.style.removeProperty("--h-theme-toggle-y");
    root.style.removeProperty("--h-theme-toggle-r");
  }

  function requestTheme(next) {
    desired = next;
    if (next === current && !animating) return;

    // Cambio directo (sin wipe): sin API, "reduce motion", pestaña oculta
    // o ya animando. Si estaba animando, al terminar se re-sincroniza.
    if (reduced || !document.startViewTransition ||
        document.visibilityState !== "visible" || animating) {
      apply();
      return;
    }

    // Centro del círculo: el punto del clic o, si fue por teclado, el
    // centro del botón. El radio llega justo a la esquina más lejana.
    var origin = pointer || centerOfToggle();
    pointer = null;
    var x = origin.x, y = origin.y;
    var radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var root = document.documentElement;
    root.style.setProperty("--h-theme-toggle-x", x + "px");
    root.style.setProperty("--h-theme-toggle-y", y + "px");
    root.style.setProperty("--h-theme-toggle-r", radius + "px");
    root.classList.add(TRANSITION_CLASS);

    animating = true;
    var done = false;

    // Corre una sola vez, tanto si la transición termina como si se
    // aborta ("Transition was skipped"). Siempre limpia clase + variables.
    var settle = function () {
      if (done) return;
      done = true;
      animating = false;
      clearReveal();
      if (current !== desired) requestTheme(desired);   // el usuario pulsó a mitad
    };

    var transition = document.startViewTransition(apply);
    transition.finished.then(settle, settle);
    // Si la transición se salta (watchdog, o el navegador la aborta) la
    // promesa `ready` rechaza; sin este catch queda como error en consola.
    if (transition.ready) transition.ready.catch(function () {});

    // Perro guardián: si el compositor va saturado o la pestaña pasa a
    // segundo plano, el callback de startViewTransition puede no correr y
    // la pantalla quedaría "congelada". Pasado el tiempo de la animación
    // forzamos el cambio de tema y la limpieza.
    setTimeout(function () {
      if (done) return;
      try { transition.skipTransition(); } catch (e) {}
      if (current !== desired) apply();
      settle();
    }, 1000);   // animación = 550ms; margen para el caso normal
  }

  function init() {
    reflect();

    var toggle = document.querySelector(".themeToggle");
    var checkbox = document.querySelector(".themeToggleInput");
    if (!toggle || !checkbox) return;

    // Guarda el punto del gesto para centrar el "circular reveal".
    toggle.addEventListener("pointerdown", function (e) {
      pointer = { x: e.clientX, y: e.clientY };
    });

    // 'change' se dispara una sola vez por activación (ratón, toque, teclado).
    checkbox.addEventListener("change", function () {
      requestTheme(checkbox.checked ? "dark" : "light");
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
