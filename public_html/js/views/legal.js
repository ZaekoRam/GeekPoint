/* =============================================================
   Vista: Aviso de privacidad y Términos y condiciones.  window.Views.legal
   Rutas #/privacidad y #/terminos. Usa el aspecto de la tienda (no el
   del panel). El texto vive aquí y no en i18n.js por su tamaño; el HTML
   de los párrafos es nuestro (nada viene del usuario).
   También expone Legal.consentHTML() (nota para formularios que piden datos)
   y Legal.acceptHTML() (casilla obligatoria del registro).
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};

  var UPDATED = { es: "20 de octubre de 2026", en: "October 20, 2026" };

  /* Correo para derechos ARCO. Mientras esté vacío, el aviso indica cómo
     corregir datos y cancelar avisos desde el propio sitio. */
  var CONTACT_EMAIL = "";

  var A_PRIV = '<a href="#/privacidad">', A_TERMS = '<a href="#/terminos">', A_ACCT = '<a href="#/cuenta">';

  function contactLine(lang) {
    if (CONTACT_EMAIL) {
      var mail = '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>';
      return lang === "en"
        ? "To exercise any of these rights, send a request to " + mail + " from the email address associated with your data, clearly stating what you require. We will respond within a maximum of 20 business days."
        : "Para ejercer cualquiera de estos derechos, envíe una solicitud a " + mail + " desde el correo electrónico asociado a sus datos, indicando con claridad lo que requiere. Daremos respuesta en un plazo máximo de 20 días hábiles.";
    }
    return lang === "en"
      ? "Until a contact email address is made available, you may update your data in " + A_ACCT + "My account</a> and cancel availability alerts through the link included in each email."
      : "En tanto se habilita un correo electrónico de contacto, usted puede actualizar sus datos desde " + A_ACCT + "«Mi cuenta»</a> y cancelar los avisos de disponibilidad mediante el enlace incluido en cada correo.";
  }

  /* Cada documento: intro + "Resumen" (summary) + secciones.
     Registro formal (de "usted"), con oraciones claras y sin ambigüedades. */
  var DOCS = {
    privacy: {
      es: {
        kicker: "Legal", title: "Aviso de privacidad",
        intro: "El presente Aviso de privacidad describe qué datos personales recaba GeekPoint, con qué finalidad los utiliza y de qué manera usted puede ejercer sus derechos sobre ellos, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
        summary: [
          "Únicamente solicitamos los datos necesarios: nombre, correo electrónico y, de manera opcional, número telefónico.",
          "Sus datos se utilizan exclusivamente para administrar su cuenta, sus apartados y los avisos que usted solicite.",
          "GeekPoint no vende sus datos ni los utiliza con fines publicitarios.",
          "El sitio no procesa pagos en línea; por ello, nunca le solicitaremos datos bancarios o de tarjetas.",
          "Usted puede actualizar sus datos en cualquier momento desde " + A_ACCT + "«Mi cuenta»</a>."
        ],
        sections: [
          { h: "Responsable de sus datos personales", p: [
            "GeekPoint es un proyecto académico (Proyecto Integrador) desarrollado por estudiantes de la carrera de Ingeniería de Software de la Facultad de Ingeniería Electromecánica de la Universidad de Colima, con sede en Manzanillo, Colima, México. El equipo de desarrollo es el responsable del tratamiento (es decir, del uso, almacenamiento y protección) de los datos personales que usted proporciona en geekpoint.com.mx."
          ] },
          { h: "Datos personales que recabamos", p: [
            { ul: [
              "<b>Cuenta de cliente:</b> nombre, correo electrónico y contraseña. La contraseña se almacena cifrada de forma irreversible, por lo que ninguna persona, incluido el equipo de GeekPoint, puede consultarla.",
              "<b>Apartados:</b> nombre, productos, cantidades y sucursal de recolección. El correo electrónico y el número telefónico son opcionales.",
              "<b>Avisos de disponibilidad («Notifícame»):</b> correo electrónico y producto de su interés.",
              "<b>Datos técnicos de seguridad:</b> dirección IP, tipo de navegador y fecha y hora de inicio de sesión, con el fin de detectar accesos no autorizados.",
              "<b>Ventas en sucursal:</b> el ticket de compra puede incluir su nombre únicamente si usted lo proporciona en caja."
            ] },
            "GeekPoint no solicita datos personales sensibles (como información de salud, creencias religiosas u origen étnico) ni datos bancarios o de tarjetas, ya que el sitio no procesa pagos en línea."
          ] },
          { h: "Finalidades del tratamiento", p: [
            "Sus datos personales se utilizan exclusivamente para las siguientes finalidades:",
            { ul: [
              "Crear y administrar su cuenta, así como verificar la titularidad de su correo electrónico.",
              "Registrar sus apartados y notificarle por correo electrónico cualquier cambio en su estado (listo para recoger, cobrado o cancelado).",
              "Informarle cuando un producto que solicitó vuelva a estar disponible.",
              "Enviarle avisos de seguridad, como el cambio de su contraseña o de su correo electrónico.",
              "Proteger el sitio contra usos indebidos, por ejemplo, limitando solicitudes repetidas."
            ] },
            "Sus datos no se utilizan con fines publicitarios ni de mercadotecnia, y no se elaboran perfiles comerciales."
          ] },
          { h: "Transferencia de datos", p: [
            "GeekPoint no vende, renta ni cede sus datos personales. Únicamente intervienen los siguientes proveedores, indispensables para el funcionamiento del sitio y exclusivamente para prestar dicho servicio:",
            { ul: [
              "<b>Hostinger:</b> alojamiento del sitio web y de la base de datos.",
              "<b>Resend:</b> envío de los correos electrónicos del sitio (verificación de cuenta, apartados y avisos de disponibilidad)."
            ] },
            "Asimismo, al cargar el sitio, su navegador se conecta a Google Fonts (tipografías) y a servidores de imágenes de terceros, como MangaDex y Pokémon TCG, los cuales pueden registrar su dirección IP conforme a sus propias políticas de privacidad.",
            "Sus datos solo se entregarán a una autoridad cuando así lo exija una ley o una orden judicial."
          ] },
          { h: "Información almacenada en su navegador", p: [
            "GeekPoint no utiliza cookies de rastreo ni herramientas de analítica. El sitio guarda en el almacenamiento local de su navegador la sesión, el carrito, el idioma y el tema visual (claro u oscuro). Si instala la aplicación, también se guardan los archivos del sitio para agilizar su carga; en ningún caso se almacenan sus pedidos ni sus datos personales. Usted puede eliminar esta información desde la configuración de su navegador."
          ] },
          { h: "Plazo de conservación", p: [
            { ul: [
              "<b>Datos de la cuenta:</b> mientras la cuenta permanezca activa.",
              "<b>Apartados y ventas:</b> se conservan como parte del historial de la tienda.",
              "<b>Avisos de disponibilidad:</b> hasta que se envía el aviso o usted lo cancela.",
              "<b>Enlaces de verificación:</b> vencen a las 48 horas; las sesiones caducan automáticamente."
            ] }
          ] },
          { h: "Derechos ARCO y revocación del consentimiento", p: [
            "Conforme a la ley, usted tiene derecho a:",
            { ul: [
              "<b>Acceso:</b> conocer qué datos personales suyos conservamos.",
              "<b>Rectificación:</b> solicitar la corrección de sus datos cuando sean inexactos o estén incompletos.",
              "<b>Cancelación:</b> solicitar la eliminación de sus datos cuando ya no sean necesarios.",
              "<b>Oposición:</b> oponerse al uso de sus datos para fines específicos."
            ] },
            "Asimismo, puede revocar en cualquier momento el consentimiento otorgado para el tratamiento de sus datos.",
            "Puede modificar su nombre, correo electrónico y contraseña directamente en " + A_ACCT + "«Mi cuenta»</a>. Cada correo de aviso de disponibilidad incluye un enlace para cancelarlo.",
            { contact: true }
          ] },
          { h: "Modificaciones al aviso de privacidad", p: [
            "Cualquier modificación a este aviso se publicará en esta misma página, indicando la fecha de su última actualización. Le recomendamos consultar también los " + A_TERMS + "Términos y condiciones</a>."
          ] }
        ]
      },
      en: {
        kicker: "Legal", title: "Privacy notice",
        intro: "This Privacy notice describes the personal data GeekPoint collects, the purposes for which it is used and how you may exercise your rights over it, in accordance with Mexico's Federal Law on the Protection of Personal Data Held by Private Parties.",
        summary: [
          "We only request the necessary data: name, email address and, optionally, a phone number.",
          "Your data is used exclusively to manage your account, your reservations and the alerts you request.",
          "GeekPoint does not sell your data or use it for advertising purposes.",
          "The site does not process online payments; therefore, we will never request bank or card details.",
          "You may update your data at any time in " + A_ACCT + "My account</a>."
        ],
        sections: [
          { h: "Data controller", p: [
            "GeekPoint is an academic project (Proyecto Integrador) developed by Software Engineering students at the Facultad de Ingeniería Electromecánica, Universidad de Colima, based in Manzanillo, Colima, Mexico. The development team is responsible for the processing (that is, the use, storage and protection) of the personal data you provide on geekpoint.com.mx."
          ] },
          { h: "Personal data we collect", p: [
            { ul: [
              "<b>Customer account:</b> name, email address and password. The password is stored with irreversible encryption, so no one, including the GeekPoint team, can view it.",
              "<b>Reservations:</b> name, products, quantities and pickup branch. Email address and phone number are optional.",
              "<b>Availability alerts (“Notify me”):</b> email address and the product of interest.",
              "<b>Technical security data:</b> IP address, browser type and sign-in date and time, in order to detect unauthorized access.",
              "<b>In-store sales:</b> the receipt may include your name only if you provide it at the register."
            ] },
            "GeekPoint does not request sensitive personal data (such as health information, religious beliefs or ethnic origin) or bank or card details, as the site does not process online payments."
          ] },
          { h: "Purposes of processing", p: [
            "Your personal data is used exclusively for the following purposes:",
            { ul: [
              "Creating and managing your account, and verifying ownership of your email address.",
              "Recording your reservations and notifying you by email of any change in their status (ready for pickup, paid or cancelled).",
              "Informing you when a product you requested is available again.",
              "Sending you security notices, such as a change to your password or email address.",
              "Protecting the site against misuse, for example by limiting repeated requests."
            ] },
            "Your data is not used for advertising or marketing purposes, and no commercial profiles are created."
          ] },
          { h: "Data transfers", p: [
            "GeekPoint does not sell, rent or transfer your personal data. Only the following providers, which are essential for the site to operate, are involved, and solely to provide that service:",
            { ul: [
              "<b>Hostinger:</b> hosting of the website and its database.",
              "<b>Resend:</b> delivery of the site's emails (account verification, reservations and availability alerts)."
            ] },
            "In addition, when the site loads, your browser connects to Google Fonts (typefaces) and to third-party image servers such as MangaDex and Pokémon TCG, which may log your IP address under their own privacy policies.",
            "Your data will only be disclosed to an authority when required by law or court order."
          ] },
          { h: "Information stored in your browser", p: [
            "GeekPoint does not use tracking cookies or analytics tools. The site stores your session, cart, language and visual theme (light or dark) in your browser's local storage. If you install the app, the site's files are also stored to speed up loading; your orders and personal data are never stored there. You may delete this information from your browser settings."
          ] },
          { h: "Retention period", p: [
            { ul: [
              "<b>Account data:</b> for as long as the account remains active.",
              "<b>Reservations and sales:</b> kept as part of the store's history.",
              "<b>Availability alerts:</b> until the alert is sent or you cancel it.",
              "<b>Verification links:</b> expire after 48 hours; sessions expire automatically."
            ] }
          ] },
          { h: "ARCO rights and withdrawal of consent", p: [
            "Under the law, you have the right to:",
            { ul: [
              "<b>Access:</b> know what personal data of yours we hold.",
              "<b>Rectification:</b> request the correction of your data when it is inaccurate or incomplete.",
              "<b>Cancellation:</b> request the deletion of your data when it is no longer necessary.",
              "<b>Objection:</b> object to the use of your data for specific purposes."
            ] },
            "You may also withdraw, at any time, the consent you granted for the processing of your data.",
            "You may change your name, email address and password directly in " + A_ACCT + "My account</a>. Every availability alert email includes a link to cancel it.",
            { contact: true }
          ] },
          { h: "Changes to this privacy notice", p: [
            "Any changes to this notice will be published on this page, stating the date of its last update. We also recommend reviewing the " + A_TERMS + "Terms and conditions</a>."
          ] }
        ]
      }
    },

    terms: {
      es: {
        kicker: "Legal", title: "Términos y condiciones",
        intro: "Los presentes Términos y condiciones regulan el uso del sitio geekpoint.com.mx. Al navegar en el sitio, crear una cuenta, apartar productos o solicitar avisos de disponibilidad, usted manifiesta su conformidad con ellos.",
        summary: [
          "El sitio permite consultar y apartar productos; todos los pagos se realizan en sucursal.",
          "Un apartado no constituye una compra: el precio final se confirma al momento del pago.",
          "El usuario debe proporcionar información verídica y resguardar su contraseña.",
          "Queda prohibido cualquier uso que dañe el sitio o afecte a otros usuarios."
        ],
        sections: [
          { h: "Descripción del servicio", p: [
            "GeekPoint es un proyecto académico desarrollado por estudiantes de la carrera de Ingeniería de Software de la Facultad de Ingeniería Electromecánica de la Universidad de Colima. Representa una cadena de tiendas de manga, figuras coleccionables, cartas TCG y cómics, que cuenta con tienda en línea y punto de venta para sus sucursales."
          ] },
          { h: "Catálogo, precios y disponibilidad", p: [
            { ul: [
              "Los precios se expresan en pesos mexicanos (MXN) y se confirman al momento de pagar en sucursal.",
              "La disponibilidad se muestra por sucursal y puede cambiar sin previo aviso.",
              "Las imágenes son ilustrativas. Las preventas están sujetas a la fecha de lanzamiento de cada producto."
            ] }
          ] },
          { h: "Pagos", p: [
            "El sitio no realiza cobros ni solicita datos bancarios o de tarjetas. Todos los pagos se efectúan en sucursal. Si alguna persona le solicita un pago en línea a nombre de GeekPoint, le recomendamos no proporcionar sus datos, ya que dicha solicitud no proviene de nosotros."
          ] },
          { h: "Cuenta de usuario", p: [
            { ul: [
              "El usuario debe proporcionar información verídica y un correo electrónico propio, el cual deberá verificar para recibir confirmaciones y avisos.",
              "El usuario es responsable de resguardar su contraseña. Toda actividad realizada con su sesión se considerará efectuada por el titular de la cuenta.",
              "Las personas menores de edad deberán utilizar el sitio con autorización de su madre, padre o tutor.",
              "GeekPoint podrá suspender cualquier cuenta que se utilice para hacer un uso indebido del sitio o para perjudicar a terceros."
            ] }
          ] },
          { h: "Apartados", p: [
            { ul: [
              "Cada apartado genera un folio con el que el usuario podrá pagar y recoger sus productos en la sucursal seleccionada, siempre que exista inventario suficiente.",
              "La sucursal podrá marcar el apartado como listo, cobrado o cancelado. Si el usuario proporcionó un correo electrónico verificado, se le notificará cada cambio.",
              "Un apartado no constituye una compra; el precio y la entrega se confirman en caja."
            ] }
          ] },
          { h: "Avisos de disponibilidad («Notifícame»)", p: [
            "Al solicitar un aviso, GeekPoint enviará un correo electrónico cuando el producto vuelva a estar disponible. El aviso no implica el apartado del producto y puede cancelarse mediante el enlace incluido en el correo."
          ] },
          { h: "Usos no permitidos", p: [
            "Queda prohibido:",
            { ul: [
              "Intentar acceder sin autorización a cuentas de otros usuarios o a los paneles del personal.",
              "Automatizar solicitudes con el fin de saturar el sitio o de extraer el catálogo de forma masiva.",
              "Registrar correos electrónicos de terceros."
            ] }
          ] },
          { h: "Propiedad intelectual", p: [
            "Los nombres, personajes, portadas y marcas de los productos pertenecen a sus respectivos titulares y se muestran únicamente para identificar los artículos, con fines académicos. GeekPoint no está afiliado a dichas marcas. Algunas imágenes provienen de servicios de terceros, como MangaDex y Pokémon TCG."
          ] },
          { h: "Limitación de responsabilidad", p: [
            "El sitio se ofrece en el estado en que se encuentra. Puede presentar interrupciones, errores o información desactualizada, y GeekPoint no garantiza que un producto continúe disponible al momento de acudir a la sucursal."
          ] },
          { h: "Modificaciones y legislación aplicable", p: [
            "GeekPoint podrá actualizar estos términos en cualquier momento; la versión vigente será la publicada en esta página. Los presentes términos se rigen por las leyes de los Estados Unidos Mexicanos. El tratamiento de sus datos personales se describe en el " + A_PRIV + "Aviso de privacidad</a>."
          ] }
        ]
      },
      en: {
        kicker: "Legal", title: "Terms and conditions",
        intro: "These Terms and conditions govern the use of geekpoint.com.mx. By browsing the site, creating an account, reserving products or requesting availability alerts, you agree to them.",
        summary: [
          "The site allows you to browse and reserve products; all payments are made at the branch.",
          "A reservation does not constitute a purchase: the final price is confirmed at the time of payment.",
          "Users must provide truthful information and keep their password secure.",
          "Any use that harms the site or affects other users is prohibited."
        ],
        sections: [
          { h: "Description of the service", p: [
            "GeekPoint is an academic project developed by Software Engineering students at the Facultad de Ingeniería Electromecánica, Universidad de Colima. It represents a chain of manga, collectible figure, TCG card and comic stores, with an online store and a point of sale for its branches."
          ] },
          { h: "Catalog, prices and availability", p: [
            { ul: [
              "Prices are expressed in Mexican pesos (MXN) and are confirmed at the time of payment at the branch.",
              "Availability is shown per branch and may change without prior notice.",
              "Images are for illustration purposes only. Pre-orders are subject to each product's release date."
            ] }
          ] },
          { h: "Payments", p: [
            "The site does not charge payments or request bank or card details. All payments are made at the branch. If anyone asks you to make an online payment on behalf of GeekPoint, we recommend that you do not provide your details, as such a request does not come from us."
          ] },
          { h: "User account", p: [
            { ul: [
              "Users must provide truthful information and their own email address, which must be verified in order to receive confirmations and alerts.",
              "Users are responsible for keeping their password secure. Any activity carried out with their session will be deemed to have been performed by the account holder.",
              "Minors must use the site with the authorization of a parent or guardian.",
              "GeekPoint may suspend any account used to misuse the site or to harm third parties."
            ] }
          ] },
          { h: "Reservations", p: [
            { ul: [
              "Each reservation generates a folio number with which the user may pay for and pick up their products at the selected branch, provided there is sufficient stock.",
              "The branch may mark the reservation as ready, paid or cancelled. If the user provided a verified email address, they will be notified of each change.",
              "A reservation does not constitute a purchase; price and delivery are confirmed at the register."
            ] }
          ] },
          { h: "Availability alerts (“Notify me”)", p: [
            "When an alert is requested, GeekPoint will send an email once the product is available again. The alert does not reserve the product and may be cancelled through the link included in the email."
          ] },
          { h: "Prohibited uses", p: [
            "The following is prohibited:",
            { ul: [
              "Attempting to access other users' accounts or staff panels without authorization.",
              "Automating requests in order to overload the site or to extract the catalog in bulk.",
              "Registering third parties' email addresses."
            ] }
          ] },
          { h: "Intellectual property", p: [
            "Product names, characters, covers and brands belong to their respective owners and are displayed solely to identify the items, for academic purposes. GeekPoint is not affiliated with those brands. Some images come from third-party services such as MangaDex and Pokémon TCG."
          ] },
          { h: "Limitation of liability", p: [
            "The site is provided as is. It may experience interruptions, errors or outdated information, and GeekPoint does not guarantee that a product will remain available when you visit the branch."
          ] },
          { h: "Amendments and governing law", p: [
            "GeekPoint may update these terms at any time; the current version will be the one published on this page. These terms are governed by the laws of the United Mexican States. The processing of your personal data is described in the " + A_PRIV + "Privacy notice</a>."
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
    if (tabs[1][0] === key) tabs.reverse();   // la pestaña activa siempre va a la izquierda
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
      '<aside class="legal__summary">' +
        '<h2>' + UI.escHTML(I18N.t("legal.summary")) + '</h2>' +
        '<ul>' + d.summary.map(function (li) { return "<li>" + li + "</li>"; }).join("") + '</ul>' +
      '</aside>' +
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

  window.Legal = {
    /* Nota de consentimiento para formularios que piden datos personales.
       Lleva data-i18n para que se traduzca sola si cambia el idioma. */
    consentHTML: function () {
      var t = I18N.t, e = UI.escHTML;
      return '<p class="legal-consent">' +
        '<span data-i18n="legal.consent">' + e(t("legal.consent")) + '</span> ' +
        '<a href="#/terminos" data-i18n="foot.terms">' + e(t("foot.terms")) + '</a> ' +
        '<span data-i18n="legal.and">' + e(t("legal.and")) + '</span> ' +
        '<a href="#/privacidad" data-i18n="foot.privacy">' + e(t("foot.privacy")) + '</a>.' +
      '</p>';
    },
    /* Casilla obligatoria del registro. Los enlaces abren en otra pestaña
       para no perder lo que ya se escribió en el formulario. */
    acceptHTML: function (checked) {
      var t = I18N.t, e = UI.escHTML;
      return '<label class="legal-accept">' +
        '<input type="checkbox" name="accept_legal"' + (checked ? ' checked' : '') + '>' +
        '<span>' +
          '<span data-i18n="legal.accept">' + e(t("legal.accept")) + '</span> ' +
          '<a href="#/terminos" target="_blank" rel="noopener" data-i18n="foot.terms">' + e(t("foot.terms")) + '</a> ' +
          '<span data-i18n="legal.and">' + e(t("legal.and")) + '</span> ' +
          '<a href="#/privacidad" target="_blank" rel="noopener" data-i18n="foot.privacy">' + e(t("foot.privacy")) + '</a>.' +
        '</span>' +
      '</label>';
    }
  };
})();
