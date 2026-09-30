/* =============================================================
   Vista: Login / Registro.  window.Views.login
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, esc = UI.escHTML;

  /* Personaje animado, armado por partes (cadera -> torso -> cabeza/brazos).
     Los DOS brazos tienen la misma excepción de capas, por la misma razón:
     necesitan una parte VISIBLE por encima de la tarjeta (agarrando la
     esquina) mientras el resto del cuerpo queda detrás.
       - Brazo derecho: brazo+mano en una sola imagen (brazo_derecho.png),
         sacado entero a hermano directo de la cadera (ver notas previas).
       - Brazo izquierdo: ".auth__mascot-arm-l" es un marco animado
         (anidado en el torso, DETRÁS de la tarjeta) con dos piezas
         independientes adentro — brazo2.png (hombro/manga) y manos2.png
         (antebrazo y mano) — acomodadas en mascot-debug.html. Los DEDOS
         (brazo_izquierdo_dedos.png) van aparte, hermanos de la cadera,
         para pintarse por ENCIMA de la tarjeta (agarrando la esquina
         superior-izquierda desde el FRENTE); syncHandRotation() los mueve
         en sincronía con ese marco para que no se separen. */
  var MASCOT_HTML =
    '<div class="auth__mascot" data-mascot aria-hidden="true">' +
      '<div class="auth__mascot-hip">' +
        '<img src="assets/images/mascot/cadera.png" alt="">' +
        '<div class="auth__mascot-torso">' +
          '<img src="assets/images/mascot/torso.png" alt="">' +
          '<div class="auth__mascot-arm-l">' +
            '<div class="auth__mascot-upper-l"><img src="assets/images/mascot/brazo2.png" alt=""></div>' +
            '<div class="auth__mascot-forearm-l"><img src="assets/images/mascot/manos2.png" alt=""></div>' +
          '</div>' +
          '<div class="auth__mascot-head"><img src="assets/images/mascot/cabeza.png" alt=""></div>' +
        '</div>' +
      '</div>' +
      '<div class="auth__mascot-arm-r"><img src="assets/images/mascot/brazo_derecho.png" alt=""></div>' +
      '<div class="auth__mascot-hand-l"><img src="assets/images/mascot/brazo_izquierdo_dedos.png" alt=""></div>' +
    '</div>';

  function backLinkHTML() {
    return '<a href="#/" data-link class="mono" style="font-size:.72rem;letter-spacing:.1em;color:var(--muted)">← ' +
      esc(I18N.lang === "en" ? "Back to store" : "Volver a la tienda") + '</a>';
  }

  /* Botón "paso anterior" del paso 2 de Registro: mismo lenguaje visual
     que "Registrarse" (clases .btn/.btn--ghost — variante YA existente en
     components.css, fondo transparente y borde sutil solo al hover, en
     vez del amarillo), pero chico (.btn--sm) y anclado ARRIBA A LA
     DERECHA junto a "← Volver a la tienda" (ver ".auth__stepback" en
     app.css) — no debajo de "Registrarse", así no agranda la tarjeta.
     Reutiliza switchTo() (mismo pellizco existente) para regresar al
     paso 1, con nombre/correo ya pre-llenados. */
  function stepBackButtonHTML() {
    return '<button type="button" class="btn btn--ghost btn--sm auth__stepback" data-auth-switch="register" data-i18n="register.prevStep">Paso anterior</button>';
  }

  /* Contenido del formulario según el modo — se repinta ENTERO al cambiar
     de modo (ver switchTo() en mount()). El registro va en DOS PASOS
     ("register" = nombre+correo, "register2" = contraseñas) para que el
     modal sea corto en cada uno — cada paso pinta SOLO sus propios campos,
     nunca los cuatro juntos, así el alto automático de .auth__card (ver
     app.css) se ajusta de verdad al contenido de ese paso, no deja huecos.
     `prefill` (opcional) trae { name, email } del paso 1 para repintar sus
     campos con lo ya escrito si el usuario regresa desde el paso 2. */
  function cardInnerHTML(mode, prefill) {
    if (mode === "register") {
      var pName = (prefill && prefill.name) || "";
      var pEmail = (prefill && prefill.email) || "";
      return backLinkHTML() +
        '<h1 style="margin-top:.6rem" data-i18n="register.title">Registrarse</h1>' +
        '<p class="auth__sub" data-i18n="register.sub"></p>' +
        '<div class="field">' +
          '<label for="rg-name" data-i18n="register.name">Nombre completo</label>' +
          '<input class="input" id="rg-name" name="name" autocomplete="name" required maxlength="120" value="' + esc(pName) + '" />' +
        '</div>' +
        '<div class="field">' +
          '<label for="rg-email" data-i18n="register.email">Correo</label>' +
          '<input class="input" type="email" id="rg-email" name="email" autocomplete="email" required maxlength="160" value="' + esc(pEmail) + '" />' +
        '</div>' +
        '<p class="field__error" data-auth-error hidden></p>' +
        '<button class="btn btn--neon btn--block btn--lg" type="submit" data-i18n="register.continue">Continuar</button>' +
        '<p class="auth__switch"><span data-i18n="register.haveAccount"></span> ' +
          '<a href="#" data-auth-switch="login" data-i18n="register.toLogin"></a></p>';
    }
    if (mode === "register2") {
      return backLinkHTML() + stepBackButtonHTML() +
        '<h1 style="margin-top:.6rem" data-i18n="register.title">Registrarse</h1>' +
        '<p class="auth__sub" data-i18n="register.sub"></p>' +
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
        '<a href="#" data-auth-switch="register" data-i18n="login.toRegister"></a></p>';
    /* Las cuentas de demostración ya no van en el modal: quedaron en
       docs/Cuentas-demo-GeekPoint.docx (y en README.md, sección 3). */
  }

  function render() {
    return (
      '<section class="auth">' +
        /* .auth__composition pone la tarjeta y el personaje EN FILA: tarjeta
           a la izquierda, personaje a su derecha, fuera del modal (no forma
           parte de .auth__card/.auth__fields) — así el personaje no se
           repinta ni se mueve con el contenido del formulario, solo con sus
           propias clases de estado (ver mount()). */
        '<div class="auth__composition">' +
          /* .auth__stage envuelve la tarjeta y mide EXACTAMENTE su tamaño
             real (fijo en desktop, automático en móvil). Los 2 triángulos
             son hermanos de .auth__card dentro de este stage — no hijos de
             la tarjeta — así no heredan su transform: scale() durante el
             pellizco y nunca cambian de tamaño/forma, solo se trasladan
             (ver app.css ".auth__corner", reacciona solo con CSS a las
             clases que ya pone switchTo(), sin tocar esa lógica). */
          '<div class="auth__stage">' +
            '<span class="auth__corner auth__corner--tl" aria-hidden="true"></span>' +
            '<span class="auth__corner auth__corner--br" aria-hidden="true"></span>' +
            '<form class="auth__card" data-auth-card novalidate>' +
              '<div class="auth__fields" data-auth-fields>' + cardInnerHTML("login") + '</div>' +
            '</form>' +
          '</div>' +
          /* El personaje es HERMANO de .auth__stage, no hijo de la tarjeta:
             mount() le refleja is-closing/is-squashed/is-opening (las
             mismas clases y tiempos que switchTo() ya le pone a .auth__card)
             vía los eventos auth:* que la tarjeta dispara en `window` — así
             "agarra" las esquinas superior-izq. e inferior-der. con sus
             brazos EN SINCRONÍA con el pellizco, sin tocar la animación de
             la tarjeta ni tener que medir posiciones en JS. */
          MASCOT_HTML +
        '</div>' +
      '</section>'
    );
  }

  /* Sincroniza los dedos (.auth__mascot-hand-l) con el brazo
     (.auth__mascot-arm-l) fotograma a fotograma, en vez de darles
     animaciones CSS independientes.
     Por qué: el brazo está anidado cadera->torso->brazo, y CADERA y
     TORSO tienen SU PROPIO balanceo (mascotHipSway, mascotBreathe) que
     se SUMA visualmente a la rotación propia del brazo (mascotArmL) — el
     brazo hereda eso automático por estar anidado. Los dedos, al ser
     hermanos de la cadera (no anidados, por el z-index — ver capas en
     app.css), nunca lo heredan.
     Un primer intento sumaba solo los ÁNGULOS de rotación de cadera +
     torso + brazo (leídos con getComputedStyle) — mejoró mucho, pero el
     "respirar" del torso (mascotBreathe) NO es solo rotate(): también
     tiene translateY() y scaleY(), y esa parte del movimiento se perdía,
     dejando un despegue chiquito pero visible en ciertos momentos.
     Solución robusta: en vez de tratar de recalcular a mano cada
     componente (rotación + traslación + escala) de cada animación, se
     ponen DOS marcadores invisibles DENTRO del brazo (heredan gratis su
     transform final real, sea lo que sea — cadera+torso+brazo juntos, no
     hay que saber qué animación aporta qué). En cada frame se mide dónde
     cayeron esos dos puntos en pantalla, se compara contra dónde caían
     en reposo (sin animación, medido una sola vez al montar), y esa
     comparación da exactamente cuánto se movió, giró y estiró el brazo
     (tres marcadores, ver abajo) — eso mismo se le aplica a los dedos. */
  function syncHandRotation(root) {
    if (UI.reduced) return;
    var mascot = $(".auth__mascot", root);
    var hip = $(".auth__mascot-hip", root);
    var torso = $(".auth__mascot-torso", root);
    var armL = $(".auth__mascot-arm-l", root);
    var handL = $(".auth__mascot-hand-l", root);
    var upperL = $(".auth__mascot-upper-l", root);
    var forearmL = $(".auth__mascot-forearm-l", root);
    var stage = $(".auth__stage", root);
    var cornerTL = $(".auth__corner--tl", root);
    if (!mascot || !hip || !torso || !armL || !handL || !upperL || !forearmL || !stage || !cornerTL) return;

    /* ---------- La mano izquierda lleva su esquina del modal ----------
       El cierre/apertura lo hace CSS (ver pellizco en app.css); aquí, en
       cada frame, se mide cuánto se movió la esquina sup-izq y la mano
       izquierda (dedos + mano2) se lleva exactamente eso, mientras brazo2
       se desvanece (para no dejar un brazo estirado de más) y reaparece al
       volver. La esquina inf-der no se mueve: la mano derecha la sostiene
       quieta. Acomodado en mascot-debug.html. */
    var ARM_FADE = 0.15;   // brazo2 termina de desvanecerse en el primer 15% del recorrido
    /* Dónde quedan los dedos respecto a la esquina sup-izq en reposo, en
       el modo actual (layout, sin transforms). Login y Registro miden
       distinto de alto, así que al cambiar de modo a media pausa este
       valor cambia; se guarda el del arranque (gStart) para que la mano
       siga agarrando el cuadro cerrado aunque la tarjeta se repinte, y se
       pasa suave al del modo nuevo mientras se abre. */
    function gripNow() {
      var m = mascot.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { x: m.left + handL.offsetLeft - s.left, y: m.top + handL.offsetTop - s.top };
    }
    var gStart = null;
    function onClosing() { gStart = gripNow(); }
    window.addEventListener("auth:closing", onClosing);
    /* Desplazamiento de la esquina sup-izq (px) y fracción recorrida
       (p: 0 abierto → 1 cerrado); null si el modal está abierto. */
    function cornerDrag() {
      var s = stage.getBoundingClientRect(), c = cornerTL.getBoundingClientRect();
      var x = c.left - s.left, y = c.top - s.top;
      var triEnd = parseFloat(getComputedStyle(cornerTL).getPropertyValue("--tri-end")) || 110;
      var span = s.width - triEnd;
      var p = span > 0 ? Math.max(0, Math.min(1, x / span)) : 0;
      if (p < 0.0005) return null;
      var g = gripNow(), gs = gStart || g;
      return { x: x + p * (gs.x - g.x), y: y + p * (gs.y - g.y), p: p };
    }

    /* TRES marcadores de tamaño 0 (un punto exacto, sin caja que rote):
       con tres puntos no alineados se obtiene la transformación COMPLETA
       del brazo (rotación + traslación + la escala del "respirar" del
       torso), no solo giro+traslación. Con dos puntos, el scaleY(1.012)
       de mascotBreathe dejaba ~3px de despegue, porque el pivote de los
       dedos está a ~280px de ellos y ese 1.2% se nota a esa distancia. */
    var markerA = document.createElement("i");   // el mismo punto que usa transform-origin de los dedos (se coloca en start())
    var markerB = document.createElement("i");
    var markerC = document.createElement("i");
    markerA.style.cssText = "position:absolute;width:0;height:0;";
    markerB.style.cssText = "position:absolute;left:20%;top:20%;width:0;height:0;";
    markerC.style.cssText = "position:absolute;left:30%;top:90%;width:0;height:0;";
    armL.appendChild(markerA);
    armL.appendChild(markerB);
    armL.appendChild(markerC);

    /* Medido RELATIVO a .auth__mascot (no a la ventana): así, cuando
       Login/Registro cambian de alto y ".auth__mascot" entero se corre
       (ver [data-auth-mode] en app.css, para que la mano derecha siga
       cayendo justo en la esquina de CADA tarjeta), ese corrido se
       cancela solo — el marcador y el origen de referencia se mueven
       igual, así que la resta da 0 — y lo único que queda en dx/dy es el
       movimiento REAL del balanceo. Medir en coordenadas de ventana
       (como antes) sumaba ese corrido de "cambio de tarjeta" encima del
       que ya aplican las propias % de .auth__mascot-hand-l (mismo
       padre), duplicándolo — por eso se desarmaba al pasar a Registro. */
    function point(el) {
      var r = el.getBoundingClientRect();
      var m = mascot.getBoundingClientRect();
      return { x: r.left - m.left, y: r.top - m.top };
    }

    /* Las % de arriba dependen del ALTO real de .auth__mascot-arm-l, que
       a su vez sale del ancho/alto NATURAL de su <img> (no hay
       aspect-ratio fijo por pieza) — si se mide el "reposo" antes de que
       esa imagen (u otras del personaje, cadera/torso arriba en la
       cadena) terminen de cargar, el brazo todavía puede medir 0 de alto
       en ese instante y la muñeca de "reposo" queda mal calculada para
       siempre (esto fue justo lo que pasó: los dedos salían disparados
       lejísimos). Por eso se espera a que TODAS las imágenes del
       personaje ya hayan cargado (+1 frame extra para que el layout ya
       esté asentado) antes de medir nada. */
    var imgs = root.querySelectorAll(".auth__mascot img");
    Promise.all(Array.prototype.map.call(imgs, function (img) {
      if (img.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })).then(function () {
      requestAnimationFrame(function () { requestAnimationFrame(start); });
    });

    function start() {
      // Mide la posición de "reposo" (sin animación) UNA sola vez, sin
      // que se llegue a pintar ese cuadro intermedio (se restaura antes
      // de ceder el hilo al navegador).
      var prevAnim = { hip: hip.style.animation, torso: torso.style.animation, arm: armL.style.animation };
      hip.style.animation = "none"; torso.style.animation = "none"; armL.style.animation = "none";
      void armL.offsetWidth; // fuerza a aplicar el "none" antes de medir
      /* Marcador A = el transform-origin de los dedos, llevado a % del
         brazo (en reposo). Con eso "translate(dx,dy) rotate(ángulo)" sobre
         los dedos reproduce EXACTO el movimiento rígido del brazo, sin
         tener que calcular a mano un pivote compartido. */
      var ar = armL.getBoundingClientRect(), hr = handL.getBoundingClientRect();
      var ho = getComputedStyle(handL).transformOrigin.split(" ");
      if (ar.width && ar.height) {
        markerA.style.left = ((hr.left + parseFloat(ho[0]) - ar.left) / ar.width * 100) + "%";
        markerA.style.top = ((hr.top + parseFloat(ho[1]) - ar.top) / ar.height * 100) + "%";
      }
      var restA = point(markerA), restB = point(markerB), restC = point(markerC);
      hip.style.animation = prevAnim.hip; torso.style.animation = prevAnim.torso; armL.style.animation = prevAnim.arm;
      /* Vectores de reposo A→B y A→C, y el determinante para invertir
         esa base 2x2 en cada frame. */
      var u0x = restB.x - restA.x, u0y = restB.y - restA.y;
      var v0x = restC.x - restA.x, v0y = restC.y - restA.y;
      var det = u0x * v0y - v0x * u0y;
      if (!det) return;
      /* Red de seguridad: el balanceo real nunca mueve la muñeca más de
         unos pocos px. Si algún frame mide un salto absurdo (p.ej. un
         reflow raro a mitad de una transición de layout), se ignora ESE
         frame en vez de mandar a los dedos a volar — el siguiente frame
         ya vuelve a medir bien. */
      var MAX_JUMP_PX = 150;

      /* Parte lineal L = [u1 v1]·[u0 v0]⁻¹ (lo que A→B y A→C se giraron/
         estiraron desde el reposo) + traslación de A. Como A está en el
         transform-origin de los dedos, matrix(L, dx, dy) sobre ellos es
         EXACTAMENTE el mismo movimiento que hizo el brazo. */
      var L = [1, 0, 0, 1, 0, 0];   // último balanceo bueno (a, b, c, d, e, f de matrix())
      function tick() {
        /* Se salió de la vista de login: se deja de medir (antes este
           bucle seguía corriendo para siempre en segundo plano). */
        if (!mascot.isConnected) { window.removeEventListener("auth:closing", onClosing); return; }
        var a = point(markerA), b = point(markerB), c = point(markerC);
        var dx = a.x - restA.x, dy = a.y - restA.y;
        if (Math.abs(dx) <= MAX_JUMP_PX && Math.abs(dy) <= MAX_JUMP_PX) {
          var u1x = b.x - a.x, u1y = b.y - a.y, v1x = c.x - a.x, v1y = c.y - a.y;
          var m11 = (u1x * v0y - v1x * u0y) / det, m12 = (v1x * u0x - u1x * v0x) / det;
          var m21 = (u1y * v0y - v1y * u0y) / det, m22 = (v1y * u0x - u1y * v0x) / det;
          L = [m11, m21, m12, m22, dx, dy];
        }
        var matrix = "matrix(" + L.map(function (n) { return n.toFixed(5); }).join(",") + ")";
        var d = cornerDrag();
        if (d) {
          /* Dedos: el arrastre de la esquina (en pantalla) + el balanceo. */
          handL.style.transform = "translate(" + d.x.toFixed(2) + "px," + d.y.toFixed(2) + "px) " + matrix;
          /* Mano2 vive DENTRO del marco del brazo (que se mece): para que en
             pantalla se mueva exactamente lo mismo, el vector se pasa a los
             ejes del marco (inversa de la parte lineal del balanceo). */
          var k = L[0] * L[3] - L[1] * L[2] || 1;
          forearmL.style.translate = ((L[3] * d.x - L[2] * d.y) / k).toFixed(2) + "px " +
            ((L[0] * d.y - L[1] * d.x) / k).toFixed(2) + "px";
          upperL.style.opacity = (1 - Math.min(1, d.p / ARM_FADE)).toFixed(3);
        } else {
          handL.style.transform = matrix;
          forearmL.style.translate = "";
          upperL.style.opacity = "";
        }
        requestAnimationFrame(tick);
      }
      tick();
    }
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
    var composition = $(".auth__composition", root);
    var mode = "login";
    /* Nombre/correo capturados en el paso 1 del registro — se conservan
       aquí para no pedírselos de nuevo en el paso 2 (esos campos ya no
       existen en el DOM del paso 2, ver cardInnerHTML). */
    var regData = { name: "", email: "" };
    /* data-auth-mode en .auth__composition: SOLO lo usa CSS para el
       desplazamiento vertical del personaje (la tarjeta de Registro es
       más alta que la de Login, ver ".auth__mascot" en app.css) — no
       toca el pellizco ni su timing. */
    composition.setAttribute("data-auth-mode", mode);

    /* Transición "pellizco" diagonal: las esquinas se juntan hacia el
       centro (ver el scale() uniforme en app.css) → pausa breve ya
       pellizcado → repinta → se expande otra vez hacia las esquinas
       revelando el otro formulario. Se dispara sobre .auth__card. Estos
       eventos en `window` son también lo que sincroniza al personaje (ver
       más abajo): nada aquí necesita saber que existe.
         auth:closing  { from, to }  — empieza a pellizcarse
         auth:squashed { mode: to }  — ya está pellizcado al centro; arranca
                                        la pausa breve
         auth:opening  { mode }      — ya repintada, empieza a expandirse
         auth:opened   { mode }      — terminó de abrirse (o no hubo
                                        animación, si prefers-reduced-motion) */
    var SQUASH_PAUSE_MS = 500;

    function paint(newMode) {
      mode = newMode;
      composition.setAttribute("data-auth-mode", mode);
      var fields = $("[data-auth-fields]", card);
      fields.innerHTML = cardInnerHTML(mode, regData);
      I18N.apply(fields);
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
      /* Hasta dónde se encoge la tarjeta: del ancho del cuadro final de
         los triángulos (--tri-end en app.css), para quedar escondida
         debajo de él. CSS no puede dividir longitudes, por eso va aquí. */
      var triEnd = parseFloat(getComputedStyle(card).getPropertyValue("--tri-end")) || 110;
      card.style.setProperty("--pinch-end", Math.min(1, triEnd / card.offsetWidth).toFixed(4));
      card.classList.add("is-closing");
      card.addEventListener("animationend", function onClose() {
        card.removeEventListener("animationend", onClose);
        card.classList.remove("is-closing");
        card.classList.add("is-squashed");   // franja plana: mantiene el aplastamiento durante la pausa
        window.dispatchEvent(new CustomEvent("auth:squashed", { detail: { mode: next } }));
        setTimeout(openNext, SQUASH_PAUSE_MS);
      }, { once: true });
    }

    /* Personaje: balanceo idle + la mano izquierda lleva su esquina del
       modal durante el pellizco, mientras la derecha sostiene la otra sin
       moverse (todo en syncHandRotation(); usa auth:closing, arriba). */
    syncHandRotation(root);

    root.addEventListener("click", function (e) {
      var sw = e.target.closest("[data-auth-switch]");
      if (sw) { e.preventDefault(); switchTo(sw.getAttribute("data-auth-switch")); }
    });

    card.addEventListener("submit", function (e) {
      e.preventDefault();
      var errBox = $("[data-auth-error]", card);
      errBox.hidden = true;
      if (!card.reportValidity()) return;

      /* Paso 1 del registro: solo valida nombre/correo (arriba, con la
         validación nativa del form) y avanza al paso 2 con la MISMA
         animación de pellizco que ya usa switchTo() para Login⇄Registro —
         no se llama a la API todavía, no hay botón "is-loading" que
         mostrar aquí. */
      if (mode === "register") {
        regData.name = card.name.value.trim();
        regData.email = card.email.value.trim();
        switchTo("register2");
        return;
      }

      var btn = card.querySelector('button[type="submit"]');
      btn.classList.add("is-loading");

      if (mode === "register2") {
        if (card.password.value !== card.password_confirmation.value) {
          btn.classList.remove("is-loading");
          errBox.textContent = I18N.t("register.mismatch");
          errBox.hidden = false;
          return;
        }
        API.post("auth/register", {
          name: regData.name,
          email: regData.email,
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
