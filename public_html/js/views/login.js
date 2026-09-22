/* =============================================================
   Vista: Login / Registro.  window.Views.login
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, esc = UI.escHTML;

  var DEMO = [
    { email: "admin@geekpoint.mx", label: "Administrador" },
    { email: "gerente.cdmx@geekpoint.mx", label: "Gerente CDMX" },
    { email: "caja.cdmx@geekpoint.mx", label: "Cajero CDMX" },
    { email: "cliente@geekpoint.mx", label: "Cliente" }
  ];

  function backLinkHTML() {
    return '<a href="#/" data-link class="mono" style="font-size:.72rem;letter-spacing:.1em;color:var(--muted)">← ' +
      esc(I18N.lang === "en" ? "Back to store" : "Volver a la tienda") + '</a>';
  }

  /* Contenido del formulario según el modo — se repinta ENTERO al cambiar
     de "login" a "register" y viceversa (ver switchTo() en mount()). */
  function cardInnerHTML(mode) {
    if (mode === "register") {
      return backLinkHTML() +
        '<h1 style="margin-top:.6rem" data-i18n="register.title">Registrarse</h1>' +
        '<p class="auth__sub" data-i18n="register.sub"></p>' +
        '<div class="field">' +
          '<label for="rg-name" data-i18n="register.name">Nombre completo</label>' +
          '<input class="input" id="rg-name" name="name" autocomplete="name" required maxlength="120" />' +
        '</div>' +
        '<div class="field">' +
          '<label for="rg-email" data-i18n="register.email">Correo</label>' +
          '<input class="input" type="email" id="rg-email" name="email" autocomplete="email" required maxlength="160" />' +
        '</div>' +
        '<div class="field">' +
          '<label for="rg-pass" data-i18n="register.password">Contraseña</label>' +
          '<input class="input" type="password" id="rg-pass" name="password" autocomplete="new-password" required minlength="6" />' +
        '</div>' +
        '<div class="field">' +
          '<label for="rg-pass2" data-i18n="register.confirm">Confirmar contraseña</label>' +
          '<input class="input" type="password" id="rg-pass2" name="password_confirmation" autocomplete="new-password" required minlength="6" />' +
        '</div>' +
        '<p class="field__error" data-auth-error hidden></p>' +
        '<button class="btn btn--neon btn--block btn--lg" type="submit" data-i18n="register.submit">Registrarse</button>' +
        '<p class="auth__switch"><span data-i18n="register.haveAccount"></span> ' +
          '<a href="#" data-auth-switch="login" data-i18n="register.toLogin"></a></p>';
    }
    return backLinkHTML() +
      '<h1 style="margin-top:.6rem" data-i18n="login.title">Bienvenido de vuelta</h1>' +
      '<p class="auth__sub"><span data-i18n="cta.staff">Acceso POS / Personal</span> — <span data-i18n="login.sub"></span></p>' +
      '<div class="field">' +
        '<label for="lg-email" data-i18n="login.email">Correo</label>' +
        '<input class="input" type="email" id="lg-email" name="email" autocomplete="username" required />' +
      '</div>' +
      '<div class="field">' +
        '<label for="lg-pass" data-i18n="login.password">Contraseña</label>' +
        '<input class="input" type="password" id="lg-pass" name="password" autocomplete="current-password" required />' +
      '</div>' +
      '<p class="field__error" data-auth-error hidden></p>' +
      '<button class="btn btn--neon btn--block btn--lg" type="submit" data-i18n="login.submit">Entrar</button>' +
      '<p class="auth__switch"><span data-i18n="login.noAccount"></span> ' +
        '<a href="#" data-auth-switch="register" data-i18n="login.toRegister"></a></p>' +
      '<div class="auth__demo">' +
        '<p data-i18n="login.demo"></p>' +
        '<div class="demo-row">' +
          DEMO.map(function (d) {
            return '<button type="button" class="demo-chip" data-demo="' + esc(d.email) + '">' + esc(d.label) + '</button>';
          }).join("") +
        '</div>' +
      '</div>';
  }

  function render() {
    return (
      '<section class="auth">' +
        /* .auth__stage envuelve la tarjeta y mide EXACTAMENTE su tamaño real
           (fijo en desktop, automático en móvil). Los 2 triángulos son
           hermanos de .auth__card dentro de este stage — no hijos de la
           tarjeta — así no heredan su transform: scale() durante el
           pellizco y nunca cambian de tamaño/forma, solo se trasladan (ver
           app.css ".auth__corner", reacciona solo con CSS a las clases que
           ya pone switchTo(), sin tocar esa lógica). */
        '<div class="auth__stage">' +
          '<span class="auth__corner auth__corner--tl" aria-hidden="true"></span>' +
          '<span class="auth__corner auth__corner--br" aria-hidden="true"></span>' +
          '<form class="auth__card" data-auth-card novalidate>' +
            /* Espacio reservado para el personaje animado que "acciona" la
               tarjeta (aún sin asset — ver comentario en mount() y en
               app.css ".auth__mascot"). Vacío a propósito: no es un
               placeholder visual, es el gancho donde se insertará después. */
            '<div class="auth__mascot" data-mascot aria-hidden="true"></div>' +
            cardInnerHTML("login") +
          '</form>' +
        '</div>' +
      '</section>'
    );
  }

  function fieldErrorMsg(err) {
    var fields = err && err.data && err.data.fields;
    if (!fields) return null;
    var k = Object.keys(fields)[0];
    return k && fields[k] && fields[k][0];
  }

  function afterLoginRedirect() {
    if (STORE.isStaff()) {
      var r = STORE.user.role;
      location.hash = r === "admin" ? "#/admin" : (r === "manager" ? "#/manager" : "#/pos");
    } else {
      location.hash = "#/";
    }
  }

  function mount(root) {
    var card = $("[data-auth-card]", root);
    var mode = "login";

    /* Transición "pellizco" diagonal: las esquinas se juntan hacia el
       centro (ver el scale() uniforme en app.css) → pausa breve ya
       pellizcado → repinta → se expande otra vez hacia las esquinas
       revelando el otro formulario. Se dispara sobre .auth__card. Hooks
       para el futuro personaje animado — se escuchan en `window`, sin
       acoplarlos a esta función: nada aquí necesita cambiar cuando se
       integre.
         auth:closing  { from, to }  — empieza a pellizcarse
         auth:squashed { mode: to }  — ya está pellizcado al centro; arranca
                                        la pausa breve (aquí "engancharía"
                                        el personaje su propio golpe/instante)
         auth:opening  { mode }      — ya repintada, empieza a expandirse
         auth:opened   { mode }      — terminó de abrirse (o no hubo
                                        animación, si prefers-reduced-motion) */
    var SQUASH_PAUSE_MS = 500;

    function paint(newMode) {
      mode = newMode;
      card.innerHTML = cardInnerHTML(mode);
      I18N.apply(card);
    }

    function switchTo(next) {
      if (next === mode || card.classList.contains("is-closing") || card.classList.contains("is-squashed")) return;
      window.dispatchEvent(new CustomEvent("auth:closing", { detail: { from: mode, to: next } }));

      function openNext() {
        card.classList.remove("is-squashed");
        paint(next);
        if (UI.reduced) {
          window.dispatchEvent(new CustomEvent("auth:opened", { detail: { mode: next } }));
          return;
        }
        card.classList.add("is-opening");
        window.dispatchEvent(new CustomEvent("auth:opening", { detail: { mode: next } }));
        card.addEventListener("animationend", function onOpen() {
          card.removeEventListener("animationend", onOpen);
          card.classList.remove("is-opening");
          window.dispatchEvent(new CustomEvent("auth:opened", { detail: { mode: next } }));
        }, { once: true });
      }

      if (UI.reduced) { openNext(); return; }
      card.classList.add("is-closing");
      card.addEventListener("animationend", function onClose() {
        card.removeEventListener("animationend", onClose);
        card.classList.remove("is-closing");
        card.classList.add("is-squashed");   // franja plana: mantiene el aplastamiento durante la pausa
        window.dispatchEvent(new CustomEvent("auth:squashed", { detail: { mode: next } }));
        setTimeout(openNext, SQUASH_PAUSE_MS);
      }, { once: true });
    }

    root.addEventListener("click", function (e) {
      var sw = e.target.closest("[data-auth-switch]");
      if (sw) { e.preventDefault(); switchTo(sw.getAttribute("data-auth-switch")); return; }

      var chip = e.target.closest("[data-demo]");
      if (chip) {
        var fill = function () {
          card.email.value = chip.getAttribute("data-demo");
          card.password.value = "password";
          card.password.focus();
        };
        if (mode === "login") fill();
        else { switchTo("login"); setTimeout(fill, UI.reduced ? 0 : 360); }
      }
    });

    card.addEventListener("submit", function (e) {
      e.preventDefault();
      var errBox = $("[data-auth-error]", card);
      errBox.hidden = true;
      if (!card.reportValidity()) return;
      var btn = card.querySelector('button[type="submit"]');
      btn.classList.add("is-loading");

      if (mode === "register") {
        if (card.password.value !== card.password_confirmation.value) {
          btn.classList.remove("is-loading");
          errBox.textContent = I18N.t("register.mismatch");
          errBox.hidden = false;
          return;
        }
        API.post("auth/register", {
          name: card.name.value.trim(),
          email: card.email.value.trim(),
          password: card.password.value,
          password_confirmation: card.password_confirmation.value
        }, { noAuthRedirect: true }).then(function (data) {
          STORE.setSession(data.token, data.user, null);
          UI.toast(I18N.t("register.success"), "ok");
          afterLoginRedirect();
        }).catch(function (err) {
          btn.classList.remove("is-loading");
          errBox.textContent = fieldErrorMsg(err) || err.message || I18N.t("toast.error");
          errBox.hidden = false;
        });
        return;
      }

      API.post("auth/login", {
        email: card.email.value.trim(),
        password: card.password.value
      }, { noAuthRedirect: true }).then(function (data) {
        // Guarda la sesión primero para que /auth/me viaje con el token.
        STORE.setSession(data.token, data.user, null);
        return API.get("auth/me", { noAuthRedirect: true })
          .then(function (me) { STORE.setSession(data.token, me.user || data.user, me.branch || null); })
          .catch(function () { /* sin enriquecer: el user del login ya trae branch_id */ })
          .then(afterLoginRedirect);
      }).catch(function (err) {
        btn.classList.remove("is-loading");
        var msg = err.status === 0 ? I18N.t("login.noapi")
          : (err.status === 401 ? I18N.t("login.badcreds") : (err.message || I18N.t("toast.error")));
        errBox.textContent = msg;
        errBox.hidden = false;
      });
    });
  }

  window.Views.login = { render: render, mount: mount, isPublic: true };
})();
