/* =============================================================
   Vista: Aviso de privacidad y Términos y condiciones.  window.Views.legal
   Rutas #/privacidad y #/terminos. Usa el aspecto de la tienda (no el
   del panel). El texto vive aquí y no en i18n.js por su tamaño; el HTML
   de los párrafos es nuestro (nada viene del usuario).
   También expone Legal.consentHTML() para los formularios que piden datos.
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};

  var UPDATED = { es: "19 de octubre de 2026", en: "October 19, 2026" };

  /* Correo para derechos ARCO. Mientras esté vacío, el aviso indica cómo
     corregir datos y cancelar avisos desde el propio sitio. */
  var CONTACT_EMAIL = "";

  var A_PRIV = '<a href="#/privacidad">', A_TERMS = '<a href="#/terminos">', A_ACCT = '<a href="#/cuenta">';

  function contactLine(lang) {
    if (CONTACT_EMAIL) {
      var mail = '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>';
      return lang === "en"
        ? "To exercise any of these rights, write to " + mail + " from the email linked to your data, saying what you need. We will reply within 20 business days."
        : "Para ejercer cualquiera de estos derechos escribe a " + mail + " desde el correo asociado a tus datos e indica qué necesitas. Te responderemos en un plazo máximo de 20 días hábiles.";
    }
    return lang === "en"
      ? "While we publish a contact address, you can correct your data from " + A_ACCT + "My account</a> and cancel stock alerts with the link included in each email."
      : "Mientras publicamos un correo de contacto, puedes corregir tus datos desde " + A_ACCT + "«Mi cuenta»</a> y cancelar los avisos de stock con el enlace que viene en cada correo.";
  }

  var DOCS = {
    privacy: {
      es: {
        kicker: "Legal", title: "Aviso de privacidad",
        intro: "Este aviso explica qué datos personales recaba GeekPoint, para qué los usa y cómo puedes controlarlos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
        sections: [
          { h: "Quién es responsable de tus datos", p: [
            "GeekPoint es un proyecto académico (Proyecto Integrador) desarrollado por estudiantes de Ingeniería de Software de la Facultad de Ingeniería Electromecánica de la Universidad de Colima, en Manzanillo, Colima, México. El equipo de desarrollo es responsable del tratamiento de los datos que se capturan en geekpoint.com.mx."
          ] },
          { h: "Qué datos recabamos", p: [
            { ul: [
              "<b>Cuenta de cliente:</b> nombre, correo electrónico y contraseña. La contraseña se guarda cifrada con un algoritmo de un solo sentido; nadie del equipo puede verla.",
              "<b>Apartados:</b> nombre, correo y teléfono (estos dos últimos son opcionales), productos, cantidades y sucursal de recogida.",
              "<b>Avisos de stock («Notifícame»):</b> correo electrónico y producto que te interesa.",
              "<b>Datos técnicos de seguridad:</b> dirección IP, navegador y fecha de inicio de sesión, y la IP desde la que se pide un aviso de stock sin cuenta.",
              "<b>Ventas en sucursal:</b> el ticket puede incluir el nombre del cliente si lo das en caja."
            ] },
            "No pedimos datos sensibles (salud, religión, origen étnico, etc.) ni datos bancarios o de tarjetas: el sitio no procesa pagos en línea."
          ] },
          { h: "Para qué los usamos", p: [
            "Usamos tus datos solo para:",
            { ul: [
              "Crear y administrar tu cuenta, y verificar que el correo es tuyo.",
              "Registrar tus apartados y avisarte por correo cuando cambian de estado (listo para recoger, cobrado o cancelado).",
              "Avisarte cuando vuelva a haber stock de un producto que pediste.",
              "Mandarte avisos de seguridad, como un cambio de contraseña o de correo.",
              "Proteger el sitio contra abusos (por ejemplo, limitar solicitudes repetidas)."
            ] },
            "No usamos tus datos para publicidad, no hacemos perfiles comerciales y no te mandaremos boletines."
          ] },
          { h: "Con quién se comparten", p: [
            "No vendemos ni rentamos tus datos. Solo intervienen los proveedores que el sitio necesita para funcionar, y únicamente para prestar ese servicio:",
            { ul: [
              "<b>Hostinger:</b> alojamiento del sitio y de la base de datos.",
              "<b>Resend:</b> envío de los correos del sitio (verificación, apartados y avisos de stock)."
            ] },
            "Además, al cargar la página tu navegador se conecta a Google Fonts (tipografías) y a servidores de imágenes de terceros, como MangaDex y Pokémon TCG, que pueden registrar tu dirección IP según sus propias políticas.",
            "Solo entregaríamos datos a una autoridad si una ley o una orden judicial lo exige."
          ] },
          { h: "Lo que se guarda en tu navegador", p: [
            "No usamos cookies de rastreo ni herramientas de analítica. El sitio guarda en el almacenamiento local de tu navegador tu sesión, tu carrito, el idioma y el tema (claro u oscuro). Si instalas la aplicación, también se guardan los archivos de la página para que cargue más rápido; nunca se guardan tus pedidos ni tus datos personales. Puedes borrar todo esto desde la configuración de tu navegador."
          ] },
          { h: "Cuánto tiempo los conservamos", p: [
            { ul: [
              "Los datos de tu cuenta, mientras la cuenta exista.",
              "Los apartados y ventas, como parte del historial de la tienda.",
              "Los avisos de stock, hasta que se envían o los cancelas.",
              "Los enlaces de verificación vencen a las 48 horas y las sesiones caducan solas."
            ] }
          ] },
          { h: "Tus derechos (ARCO)", p: [
            "Tienes derecho a <b>A</b>cceder a tus datos, <b>R</b>ectificarlos si son incorrectos, <b>C</b>ancelarlos cuando ya no sean necesarios y <b>O</b>ponerte a su uso para fines específicos. También puedes revocar tu consentimiento en cualquier momento.",
            "Puedes cambiar tu nombre, correo y contraseña en " + A_ACCT + "«Mi cuenta»</a>, y cada correo de aviso de stock trae un enlace para cancelarlo.",
            { contact: true }
          ] },
          { h: "Cambios a este aviso", p: [
            "Si cambiamos este aviso publicaremos la nueva versión en esta misma página con su fecha de actualización. Consulta también los " + A_TERMS + "Términos y condiciones</a>."
          ] }
        ]
      },
      en: {
        kicker: "Legal", title: "Privacy notice",
        intro: "This notice explains what personal data GeekPoint collects, why it uses it and how you can control it, under Mexico's Federal Law on the Protection of Personal Data Held by Private Parties.",
        sections: [
          { h: "Who is responsible for your data", p: [
            "GeekPoint is an academic project (Proyecto Integrador) built by Software Engineering students at the Facultad de Ingeniería Electromecánica, Universidad de Colima, in Manzanillo, Colima, Mexico. The development team is responsible for the data captured on geekpoint.com.mx."
          ] },
          { h: "What data we collect", p: [
            { ul: [
              "<b>Customer account:</b> name, email and password. The password is stored with one-way encryption; nobody on the team can see it.",
              "<b>Reservations:</b> name, email and phone (the last two are optional), products, quantities and pickup branch.",
              "<b>Stock alerts (“Notify me”):</b> email and the product you want.",
              "<b>Technical security data:</b> IP address, browser and sign-in date, and the IP that requests a stock alert without an account.",
              "<b>In-store sales:</b> the receipt may include the customer's name if you give it at the register."
            ] },
            "We don't ask for sensitive data (health, religion, ethnic origin, etc.) or bank or card details: the site does not process online payments."
          ] },
          { h: "What we use it for", p: [
            "We use your data only to:",
            { ul: [
              "Create and manage your account, and confirm the email is yours.",
              "Record your reservations and email you when their status changes (ready for pickup, paid or cancelled).",
              "Let you know when a product you asked about is back in stock.",
              "Send security notices, such as a password or email change.",
              "Protect the site from abuse (for example, limiting repeated requests)."
            ] },
            "We don't use your data for advertising, we don't build marketing profiles and we won't send you newsletters."
          ] },
          { h: "Who we share it with", p: [
            "We don't sell or rent your data. Only the providers the site needs to work are involved, and only to provide that service:",
            { ul: [
              "<b>Hostinger:</b> hosting for the site and its database.",
              "<b>Resend:</b> delivery of the site's emails (verification, reservations and stock alerts)."
            ] },
            "When the page loads, your browser also connects to Google Fonts (typefaces) and third-party image servers such as MangaDex and Pokémon TCG, which may log your IP address under their own policies.",
            "We would only hand data to an authority if a law or court order requires it."
          ] },
          { h: "What is stored in your browser", p: [
            "We don't use tracking cookies or analytics. The site keeps your session, cart, language and theme (light or dark) in your browser's local storage. If you install the app, the page files are also stored so it loads faster; your orders and personal data are never stored there. You can clear all of this from your browser settings."
          ] },
          { h: "How long we keep it", p: [
            { ul: [
              "Account data, for as long as the account exists.",
              "Reservations and sales, as part of the store's history.",
              "Stock alerts, until they are sent or you cancel them.",
              "Verification links expire after 48 hours and sessions expire on their own."
            ] }
          ] },
          { h: "Your rights (ARCO)", p: [
            "You have the right to <b>A</b>ccess your data, <b>R</b>ectify it if it's wrong, <b>C</b>ancel it when it's no longer needed and <b>O</b>bject to its use for specific purposes. You can also withdraw your consent at any time.",
            "You can change your name, email and password in " + A_ACCT + "My account</a>, and every stock alert email includes a link to cancel it.",
            { contact: true }
          ] },
          { h: "Changes to this notice", p: [
            "If we change this notice we will publish the new version on this page with its update date. See also the " + A_TERMS + "Terms and conditions</a>."
          ] }
        ]
      }
    },

    terms: {
      es: {
        kicker: "Legal", title: "Términos y condiciones",
        intro: "Estos términos regulan el uso de geekpoint.com.mx. Al navegar, crear una cuenta, apartar productos o pedir avisos de stock aceptas lo que dice aquí.",
        sections: [
          { h: "Qué es GeekPoint", p: [
            "GeekPoint es un proyecto académico desarrollado por estudiantes de Ingeniería de Software de la Facultad de Ingeniería Electromecánica de la Universidad de Colima. Representa una cadena de tiendas de manga, figuras, cartas TCG y cómics con tienda en línea y punto de venta para sus sucursales."
          ] },
          { h: "Catálogo, precios y disponibilidad", p: [
            { ul: [
              "Los precios están en pesos mexicanos (MXN) y se confirman al pagar en la sucursal.",
              "La disponibilidad se muestra por sucursal y puede cambiar en cualquier momento.",
              "Las imágenes son ilustrativas. Las preventas dependen de la fecha de lanzamiento de cada producto."
            ] }
          ] },
          { h: "Sin pagos en línea", p: [
            "El sitio no cobra ni pide datos bancarios o de tarjetas. Todo pago se hace en la sucursal. Si alguien te pide pagar en línea a nombre de GeekPoint, no somos nosotros."
          ] },
          { h: "Tu cuenta", p: [
            { ul: [
              "Da datos verdaderos y usa un correo que sea tuyo; debes verificarlo para recibir confirmaciones y avisos.",
              "Cuida tu contraseña: lo que se haga con tu sesión se considera hecho por ti.",
              "Si eres menor de edad, usa el sitio con permiso de tu madre, padre o tutor.",
              "Podemos suspender una cuenta que se use para abusar del sitio o de otras personas."
            ] }
          ] },
          { h: "Apartados", p: [
            { ul: [
              "Un apartado genera un folio para pagar y recoger en la sucursal que elegiste, siempre que haya stock suficiente.",
              "La sucursal puede marcarlo como listo, cobrarlo o cancelarlo; si diste un correo verificado te avisaremos de cada cambio.",
              "Apartar no es una compra: el precio y la entrega se confirman en caja."
            ] }
          ] },
          { h: "Avisos de stock", p: [
            "Al pedir «Notifícame» te escribiremos cuando el producto vuelva a estar disponible. El aviso no aparta el producto. Puedes cancelarlo con el enlace que viene en el correo."
          ] },
          { h: "Uso aceptable", p: [
            "No está permitido intentar entrar a paneles o cuentas sin autorización, automatizar solicitudes para saturar el sitio, extraer el catálogo de forma masiva, ni registrar correos de otras personas."
          ] },
          { h: "Propiedad intelectual", p: [
            "Los nombres, personajes, portadas y marcas de los productos pertenecen a sus respectivos titulares y se muestran solo para identificar los artículos, con fines académicos. GeekPoint no está afiliado a esas marcas. Algunas imágenes provienen de servicios de terceros como MangaDex y Pokémon TCG."
          ] },
          { h: "Responsabilidad", p: [
            "El sitio se ofrece tal como está. Puede tener interrupciones, errores o información desactualizada, y no garantizamos que un producto siga disponible al llegar a la sucursal."
          ] },
          { h: "Cambios y ley aplicable", p: [
            "Podemos actualizar estos términos; la versión vigente es la publicada en esta página. Se rigen por las leyes de los Estados Unidos Mexicanos. El tratamiento de tus datos se explica en el " + A_PRIV + "Aviso de privacidad</a>."
          ] }
        ]
      },
      en: {
        kicker: "Legal", title: "Terms and conditions",
        intro: "These terms govern the use of geekpoint.com.mx. By browsing, creating an account, reserving products or requesting stock alerts you accept what they say.",
        sections: [
          { h: "What GeekPoint is", p: [
            "GeekPoint is an academic project built by Software Engineering students at the Facultad de Ingeniería Electromecánica, Universidad de Colima. It represents a chain of manga, figure, TCG card and comic stores with an online store and a point of sale for its branches."
          ] },
          { h: "Catalog, prices and availability", p: [
            { ul: [
              "Prices are in Mexican pesos (MXN) and are confirmed when you pay at the branch.",
              "Availability is shown per branch and may change at any time.",
              "Images are illustrative. Pre-orders depend on each product's release date."
            ] }
          ] },
          { h: "No online payments", p: [
            "The site doesn't charge you or ask for bank or card details. All payments are made at the branch. If someone asks you to pay online on GeekPoint's behalf, it isn't us."
          ] },
          { h: "Your account", p: [
            { ul: [
              "Give true details and use an email that is yours; you must verify it to receive confirmations and alerts.",
              "Keep your password safe: anything done with your session is considered done by you.",
              "If you are a minor, use the site with permission from a parent or guardian.",
              "We may suspend an account used to abuse the site or other people."
            ] }
          ] },
          { h: "Reservations", p: [
            { ul: [
              "A reservation creates a folio to pay and pick up at the branch you chose, as long as there is enough stock.",
              "The branch may mark it ready, charge it or cancel it; if you gave a verified email we will tell you about each change.",
              "Reserving is not a purchase: price and delivery are confirmed at the register."
            ] }
          ] },
          { h: "Stock alerts", p: [
            "When you ask to be notified we will email you once the product is back in stock. The alert does not reserve the product. You can cancel it with the link in the email."
          ] },
          { h: "Acceptable use", p: [
            "You may not try to access panels or accounts without authorization, automate requests to overload the site, scrape the catalog in bulk, or register other people's emails."
          ] },
          { h: "Intellectual property", p: [
            "Product names, characters, covers and brands belong to their respective owners and are shown only to identify the items, for academic purposes. GeekPoint is not affiliated with those brands. Some images come from third-party services such as MangaDex and Pokémon TCG."
          ] },
          { h: "Liability", p: [
            "The site is provided as is. It may have outages, errors or outdated information, and we don't guarantee that a product will still be available when you reach the branch."
          ] },
          { h: "Changes and governing law", p: [
            "We may update these terms; the current version is the one published on this page. They are governed by the laws of Mexico. How we handle your data is explained in the " + A_PRIV + "Privacy notice</a>."
          ] }
        ]
      }
    }
  };

  function lang() { return I18N.lang === "en" ? "en" : "es"; }

  function blockHTML(b, l) {
    if (typeof b === "string") return "<p>" + b + "</p>";
    if (b.ul) return "<ul>" + b.ul.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ul>";
    if (b.contact) return "<p>" + contactLine(l) + "</p>";
    return "";
  }

  function docHTML(key) {
    var l = lang(), d = DOCS[key][l];
    var tabs = [["privacy", "#/privacidad", DOCS.privacy[l].title], ["terms", "#/terminos", DOCS.terms[l].title]];
    return '<article class="legal container">' +
      '<nav class="legal__tabs" aria-label="Legal">' +
        tabs.map(function (t) {
          return '<a class="catbar__btn' + (t[0] === key ? ' is-active" aria-current="page' : '') + '" href="' + t[1] + '">' + UI.escHTML(t[2]) + '</a>';
        }).join("") +
      '</nav>' +
      '<header class="legal__head">' +
        '<span class="kicker">' + d.kicker + '</span>' +
        '<h1>' + d.title + '</h1>' +
        '<p class="legal__updated mono">' + (l === "en" ? "Last updated: " : "Última actualización: ") + UPDATED[l] + '</p>' +
        '<p class="legal__intro">' + d.intro + '</p>' +
      '</header>' +
      '<div class="legal__body">' +
        d.sections.map(function (s, i) {
          return '<section><h2><span class="legal__num">' + (i + 1) + '</span>' + s.h + '</h2>' +
            s.p.map(function (b) { return blockHTML(b, l); }).join("") + '</section>';
        }).join("") +
      '</div>' +
    '</article>';
  }

  window.Views.legal = {
    storeLook: true,
    render: function (params) { return docHTML(params.doc); },
    mount: function (root, params) {
      var prev = document.title;
      document.title = DOCS[params.doc][lang()].title + " — GeekPoint";
      root.__cleanup = function () { document.title = prev; };
    }
  };

  /* Nota de consentimiento para formularios que piden datos personales.
     Lleva data-i18n para que se traduzca sola si cambia el idioma. */
  window.Legal = {
    consentHTML: function () {
      var t = I18N.t, e = UI.escHTML;
      return '<p class="legal-consent">' +
        '<span data-i18n="legal.consent">' + e(t("legal.consent")) + '</span> ' +
        '<a href="#/terminos" data-i18n="foot.terms">' + e(t("foot.terms")) + '</a> ' +
        '<span data-i18n="legal.and">' + e(t("legal.and")) + '</span> ' +
        '<a href="#/privacidad" data-i18n="foot.privacy">' + e(t("foot.privacy")) + '</a>.' +
      '</p>';
    }
  };
})();
