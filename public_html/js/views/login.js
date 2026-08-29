/* =============================================================
   Vista: Login.  window.Views.login
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, esc = UI.escHTML;

  var DEMO = [
    { email: "admin@geekpoint.mx", label: "Administrador" },
    { email: "gerente.cdmx@geekpoint.mx", label: "Gerente CDMX" },
    { email: "caja.cdmx@geekpoint.mx", label: "Cajero CDMX" }
  ];

  function render() {
    return (
      '<section class="auth">' +
        '<form class="auth__card" data-login novalidate>' +
          '<a href="#/" data-link class="mono" style="font-size:.72rem;letter-spacing:.1em;color:var(--muted)">← ' + esc(I18N.lang === "en" ? "Back to store" : "Volver a la tienda") + '</a>' +
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
          '<p class="field__error" data-login-error hidden></p>' +
          '<button class="btn btn--neon btn--block btn--lg" type="submit" data-i18n="login.submit">Entrar</button>' +
          '<div class="auth__demo">' +
            '<p data-i18n="login.demo"></p>' +
            '<div class="demo-row">' +
              DEMO.map(function (d) {
                return '<button type="button" class="demo-chip" data-demo="' + esc(d.email) + '">' + esc(d.label) + '</button>';
              }).join("") +
            '</div>' +
          '</div>' +
        '</form>' +
      '</section>'
    );
  }

  function mount(root) {
    I18N.apply(root);
    var form = $("[data-login]", root);
    var errBox = $("[data-login-error]", root);
    var btn = form.querySelector('button[type="submit"]');

    form.querySelectorAll("[data-demo]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        form.email.value = chip.getAttribute("data-demo");
        form.password.value = "password";
        form.password.focus();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.hidden = true;
      if (!form.reportValidity()) return;

      btn.classList.add("is-loading");
      API.post("auth/login", {
        email: form.email.value.trim(),
        password: form.password.value
      }, { noAuthRedirect: true }).then(function (data) {
        // Guarda la sesión primero para que /auth/me viaje con el token.
        STORE.setSession(data.token, data.user, null);
        return API.get("auth/me", { noAuthRedirect: true })
          .then(function (me) { STORE.setSession(data.token, me.user || data.user, me.branch || null); })
          .catch(function () { /* sin enriquecer: el user del login ya trae branch_id */ })
          .then(function () {
            // Redirección por rol:
            //  · Admin / Personal (admin, manager, cashier) → panel POS / administración.
            //  · Cliente (cualquier otro rol) → permanece en la tienda / catálogo.
            if (STORE.isStaff()) {
              var r = STORE.user.role;
              location.hash = r === "admin" ? "#/admin" : (r === "manager" ? "#/manager" : "#/pos");
            } else {
              location.hash = "#/";
            }
          });
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
