/* =============================================================
   Internacionalización (ES / EN).  window.__I18N__ + window.I18N
   ============================================================= */
(function () {
  "use strict";

  var DICT = {
    es: {
      "nav.showroom": "Showroom", "nav.roles": "Roles", "nav.flow": "Flujo POS", "nav.stack": "Arquitectura",
      "cta.login": "Iniciar sesión", "cta.access": "Acceder al panel", "cta.openpos": "Abrir POS",
      "cta.explore": "Explorar catálogo 3D", "cta.logout": "Cerrar sesión",

      "hero.kicker": "Punto de venta · Inventario · Multi-sede",
      "hero.title1": "El mostrador de tu tienda geek,",
      "hero.title2": "conectado en todas tus sucursales",
      "hero.lead": "Vende mangas, figuras, cartas TCG y coleccionables desde una interfaz rápida. El inventario de cada sede se descuenta solo con cada venta.",
      "stats.branches": "sucursales demo", "stats.tax": "IVA desglosado", "stats.roles": "roles de acceso", "stats.lang": "interfaz bilingüe",

      "showroom.kicker": "Catálogo interactivo",
      "showroom.title": "Coleccionables que giran contigo",
      "showroom.sub": "Mueve el cursor sobre las piezas. Cada tarjeta responde con inclinación y luz de neón.",
      "roles.kicker": "Arquitectura de permisos", "roles.title": "Tres niveles, un solo sistema",
      "flow.kicker": "Módulo de ventas", "flow.title": "De la búsqueda al ticket en segundos",
      "stack.kicker": "Cómo está construido", "stack.title": "Vanilla al frente, PHP y MySQL atrás",
      "foot.note": "Proyecto académico — Punto de venta e inventario multi-sede.",

      "banner.offline": "Catálogo en modo local: el servidor no responde. La tienda funciona; para el panel inicia PHP + MySQL.",
      "banner.retry": "Reintentar",

      "cat.manga": "Mangas", "cat.figuras": "Figuras", "cat.tcg": "Tarjetas TCG",
      "cat.comics": "Cómics", "cat.preventa": "Preventas", "cat.all": "Todo",
      "nav.cart": "Carrito",
      "cta.staff": "Acceso POS / Personal", "cta.mypanel": "Mi panel", "cta.myaccount": "Mi cuenta",

      "hero.kicker": "Portal Coleccionable & Sistema POS",
      "hero.t1": "Cultura geek", "hero.t2": "en cada sucursal",
      "hero.lead": "Manga, figuras, cartas TCG y coleccionables con portadas reales. Compra en línea y consulta disponibilidad por tienda física en México.",
      "hero.shop": "Ver catálogo", "hero.scroll": "Desliza",

      "shop.kicker": "Catálogo e-commerce", "shop.title": "Novedades y preventas",
      "shop.sub": "Pasa el cursor para el efecto 3D. Haz clic en un tomo para girarlo 360°.",
      "shop.search": "Buscar por título o autor…",
      "shop.empty": "No hay productos en esta categoría.",
      "shop.noresults": "Sin resultados para «{q}».",

      "pkm.add": "Pokémon TCG",
      "pkm.title": "Importar carta Pokémon TCG",
      "pkm.searchPh": "Busca por nombre (Charizard, Pikachu…)",
      "pkm.allSets": "Todas las expansiones",
      "pkm.hint": "Escribe al menos 2 letras o elige una expansión.",
      "pkm.results": "resultados",
      "pkm.select": "Seleccionar",
      "pkm.back": "Volver a la búsqueda",
      "pkm.price": "Precio de mercado sugerido",
      "pkm.stockByBranch": "Stock inicial por sucursal",
      "pkm.save": "Guardar en inventario",
      "pkm.needStock": "Indica el stock para al menos una sucursal.",
      "pkm.saved": "Carta importada en {n} sucursal(es).",

      "fig.add": "Figura",
      "fig.title": "Buscar / dar de alta figura",
      "fig.searchPh": "Busca por personaje (Gojo Satoru, Luffy Gear 5…)",
      "fig.hint": "Escribe al menos 2 letras del personaje o la figura.",
      "fig.results": "resultados",
      "fig.localSource": "catálogo local",
      "fig.select": "Seleccionar",
      "fig.back": "Volver a la búsqueda",
      "fig.price": "Precio",
      "fig.stockByBranch": "Stock inicial por sucursal",
      "fig.save": "Guardar en inventario",
      "fig.needStock": "Indica el stock para al menos una sucursal.",
      "fig.saved": "Figura importada en {n} sucursal(es).",
      "fig.unavailable": "Servicio de figuras no disponible.",

      "shop.source.jikan": "Portadas reales vía MyAnimeList",
      "shop.source.anilist": "Portadas reales vía AniList",
      "shop.source.fallback": "Catálogo local (sin conexión al servidor)",

      "ptag.novedad": "Novedad", "ptag.preventa": "Preventa", "ptag.oferta": "Oferta",
      "prod.add": "Agregar", "prod.added": "Agregado al carrito",
      "prod.view3d": "Vista previa 3D", "prod.rotate": "Arrastra para girar 360°", "prod.angle": "Ángulo",
      "prod.view3dTab": "Vista 3D", "prod.photo": "Foto",
      "prod.available": "Disponible en", "prod.author": "Autor / Marca",
      "prod.manufacturer": "Fabricante", "prod.scale": "Escala / Línea",
      "prod.volumes": "Tomos", "prod.score": "Puntuación", "prod.buy": "Agregar al carrito",
      "prod.soldout": "Agotado",
      "prod.volume": "Vol.", "prod.pickVolume": "Elige tomo",
      "prod.stockByBranch": "Stock por sucursal",
      "volumes.title": "Tomos y precios",
      "volumes.count": "Número de tomos",
      "volumes.priceEach": "Precio por tomo (deja vacío para no crearlo)",
      "volumes.needPrice": "Escribe el precio de al menos un tomo.",
      "volumes.done": "{n} tomo(s) guardado(s). Ajusta su stock con el botón +.",
      "volumes.current": "Tomos actuales",
      "volumes.none": "Todavía no hay tomos sueltos para esta serie.",
      "volumes.addNew": "+ Añadir nuevo tomo",
      "volumes.newTitle": "Nuevo volumen",
      "volumes.savePrice": "Guardar precio",
      "volumes.priceSaved": "Precio actualizado.",
      "volumes.created": "Volumen creado.",
      "tags.pick": "Etiquetas de tienda",
      "tags.pickHint": "Elige las que apliquen; se muestran en la tarjeta de la tienda.",

      "branches.kicker": "Tiendas físicas",
      "branches.title": "Nuestras sucursales en México",
      "branches.sub": "Recoge tu pedido o visítanos. Cada sede tiene su propio inventario.",
      "branches.hours": "Horario", "branches.phone": "Tel", "branches.addr": "Dirección",
      "branches.search": "Buscar sucursal...", "branches.more": "Continuar",

      "cart.title": "Tu carrito", "cart.total": "Total",
      "cart.quote": "Apartar productos", "cart.empty": "Tu carrito está vacío.",
      "cart.note": "Compra demo — no procesa pagos reales. Todos los cobros son en pesos mexicanos (MXN).",
      "cart.quoteTitle": "Cotización GeekPoint",
      "cart.quoteIntro": "Presenta este resumen en cualquier sucursal para apartar tus productos.",

      "btn.close": "Cerrar",
      "resv.title": "Apartar productos",
      "resv.intro": "Genera un folio para recoger y pagar en la sucursal.",
      "resv.name": "Nombre", "resv.email": "Correo (opcional)", "resv.phone": "Teléfono (opcional)",
      "resv.branch": "Sucursal para recoger", "resv.pickAny": "Cualquier sucursal",
      "resv.submit": "Generar apartado", "resv.created": "Apartado creado",
      "resv.ticketKicker": "APARTADO",
      "resv.present": "Presenta este folio (o el código de barras) en caja para pagar y recoger.",
      "resv.error": "No se pudo crear el apartado.",
      "resv.shortStock": "No hay stock suficiente para:",
      "resv.customer": "Cliente",
      "resv.pos": "Apartados", "resv.lookup": "Folio (GP-XXXX)", "resv.searchBtn": "Buscar",
      "resv.pending": "Pendientes", "resv.none": "Sin apartados pendientes.",
      "resv.charge": "Cobrar apartado", "resv.cancelBtn": "Cancelar apartado",
      "resv.chargeAtRegister": "Cobrar en Caja",
      "resv.loaded": "{n} artículo(s) agregados al ticket.",
      "resv.notfound": "Folio no encontrado.",
      "resv.cobradaMsg": "Apartado marcado como cobrado.",
      "resv.canceladaMsg": "Apartado cancelado.",
      "resv.confirmCancel": "¿Cancelar el apartado {folio}? No se puede deshacer.",
      "resv.status.pendiente": "Pendiente", "resv.status.cobrada": "Cobrada", "resv.status.cancelada": "Cancelada",

      "login.title": "Bienvenido de vuelta",
      "login.sub": "Ingresa con tu cuenta de GeekPoint POS.",
      "login.email": "Correo", "login.password": "Contraseña", "login.submit": "Entrar",
      "login.demo": "Cuentas de demostración (contraseña: password)",
      "login.badcreds": "Correo o contraseña incorrectos.",
      "login.noapi": "No hay conexión con la API. Revisa que el servidor PHP y MySQL estén activos.",

      "nav.overview": "Resumen", "nav.branches": "Sucursales", "nav.users": "Usuarios",
      "nav.inventory": "Inventario", "nav.products": "Productos", "nav.registers": "Cajas",
      "nav.sales": "Ventas", "nav.pos": "Punto de venta", "nav.home": "Inicio",

      "admin.title": "Panel del Administrador General",
      "manager.title": "Panel de Gerencia",
      "pos.title": "Punto de venta",

      "kpi.salesToday": "Ventas de hoy", "kpi.salesMonth": "Ventas del mes",
      "kpi.branchesActive": "Sucursales activas", "kpi.lowStock": "Alertas de stock",
      "kpi.users": "Usuarios activos", "kpi.products": "Productos activos",
      "kpi.registers": "Cajas activas", "kpi.invValue": "Valor de inventario",
      "kpi.ticketAvg": "Ticket promedio",

      "col.branch": "Sucursal", "col.city": "Ciudad", "col.status": "Estado",
      "col.today": "Hoy", "col.month": "Mes", "col.tickets": "Tickets", "col.lowstock": "Bajo stock",
      "col.name": "Nombre", "col.email": "Correo", "col.role": "Rol", "col.lastlogin": "Último acceso",
      "col.sku": "SKU", "col.category": "Categoría", "col.price": "Precio", "col.stock": "Stock",
      "col.min": "Mínimo", "col.actions": "Acciones", "col.folio": "Folio", "col.cashier": "Cajero",
      "col.total": "Total", "col.method": "Pago", "col.date": "Fecha", "col.qty": "Cant.",
      "col.movement": "Movimiento", "col.product": "Producto", "col.delta": "Δ", "col.result": "Resultante",
      "col.register": "Caja", "col.top": "Más vendidos",

      "status.active": "Activa", "status.inactive": "Inactiva",
      "role.admin": "Administrador", "role.manager": "Gerente", "role.cashier": "Cajero",
      "method.cash": "Efectivo", "method.card": "Tarjeta", "method.transfer": "Transferencia",

      "btn.new": "Nuevo", "btn.newBranch": "Nueva sucursal", "btn.newUser": "Nuevo usuario",
      "btn.newProduct": "Nuevo producto", "btn.newRegister": "Nueva caja",
      "btn.save": "Guardar", "btn.cancel": "Cancelar", "btn.edit": "Editar", "btn.delete": "Eliminar",
      "btn.adjust": "Ajustar stock", "btn.activate": "Activar", "btn.deactivate": "Desactivar",
      "btn.viewTicket": "Ver ticket", "btn.print": "Imprimir", "btn.charge": "Cobrar",
      "btn.clear": "Vaciar", "btn.retry": "Reintentar",

      "pos.search": "Busca por nombre, SKU o categoría…",
      "pos.all": "Todas", "pos.cart": "Venta actual", "pos.empty": "Aún no agregas productos.",
      "pos.subtotal": "Subtotal", "pos.tax": "IVA", "pos.total": "Total",
      "pos.paidWith": "Paga con", "pos.received": "Recibido", "pos.change": "Cambio",
      "pos.customer": "Cliente (opcional)", "pos.register": "Caja",
      "pos.done": "Venta registrada", "pos.lowWarn": "Stock bajo",
      "pos.outOfStock": "Sin stock", "pos.needPayment": "El efectivo recibido es menor que el total.",

      "ticket.title": "COMPROBANTE DE VENTA", "ticket.thanks": "¡Gracias por tu compra!",
      "ticket.folio": "Folio", "ticket.branch": "Sucursal", "ticket.cashier": "Atendió",
      "ticket.date": "Fecha", "ticket.items": "Artículos", "ticket.back": "Volver al POS",
      "ticket.paper": "Papel",

      "form.branchCode": "Clave", "form.branchName": "Nombre", "form.city": "Ciudad",
      "form.state": "Estado", "form.address": "Dirección", "form.phone": "Teléfono",
      "form.hours": "Horario de atención",
      "form.password": "Contraseña", "form.passwordHint": "Déjala vacía para no cambiarla",
      "form.assignBranch": "Sucursal asignada", "form.description": "Descripción",
      "form.taxRate": "Tasa de IVA", "form.minStock": "Stock mínimo", "form.initialStock": "Stock inicial",
      "form.adjustMode": "Modo", "form.setTo": "Fijar en", "form.addRemove": "Sumar / restar",
      "form.quantity": "Cantidad", "form.note": "Nota",

      "prodadm.new": "Nuevo producto",
      "form.prodadm.name": "Nombre del producto",
      "form.prodadm.category": "Categoría",
      "form.prodadm.price": "Precio (MXN)",
      "form.prodadm.editorial": "Editorial / Marca",
      "form.prodadm.maker": "Marca / Fabricante",
      "form.prodadm.scale": "Escala / Línea (opcional)",
      "form.prodadm.synopsis": "Sinopsis / descripción (español)",
      "prodadm.synopsisPh": "Sinopsis en español para la ficha de la tienda…",
      "form.prodadm.figurePng": "Figura / personaje sin fondo (PNG transparente)",
      "form.prodadm.image": "Portada / imágenes (URLs separadas por coma)",
      "form.prodadm.imageHint": "La primera URL es la portada que se ve en la tienda.",
      "form.tags": "Etiquetas de tienda",
      "form.tagsHint": "Separadas por coma; se muestran en la tarjeta de la tienda. Ej: novedad, preventa",
      "prodadm.orUpload": "o subir un archivo del equipo",
      "prodadm.uploading": "Subiendo imágenes…",
      "prodadm.uploadFail": "No se pudo subir la imagen.",
      "prodadm.stockByBranch": "Stock inicial por sucursal",
      "prodadm.needStock": "Asigna stock para al menos una sucursal.",
      "prodadm.deleted": "Producto eliminado ({n} registro(s)).",
      "prodadm.restock": "Añadir stock por sucursal",
      "prodadm.restockTitle": "Añadir stock — {name}",
      "prodadm.restockHint": "Cantidad a SUMAR al stock actual de cada sucursal (0 = sin cambios).",
      "prodadm.restockDone": "Stock añadido.",
      "prodadm.notInBranch": "sin existencias — se dará de alta",

      "empty.none": "Sin registros todavía.",
      "confirm.delete": "¿Eliminar «{name}»? Esta acción no se puede deshacer.",
      "toast.saved": "Cambios guardados.", "toast.deleted": "Registro eliminado.",
      "toast.created": "Registro creado.", "toast.error": "Ocurrió un error.",
      "toast.stockAdjusted": "Stock actualizado.", "toast.sessionEnd": "Sesión cerrada.",

      "guard.login": "Inicia sesión para continuar.",
      "misc.loading": "Cargando…", "misc.of": "de", "misc.branch": "Sucursal",
      "misc.welcome": "Hola, {name}", "misc.last14": "Últimos 14 días",
      "misc.cashierRank": "Desempeño por cajero", "misc.recentSales": "Ventas recientes",
      "misc.movements": "Movimientos de inventario", "misc.alerts": "Productos en alerta"
    },

    en: {
      "nav.showroom": "Showroom", "nav.roles": "Roles", "nav.flow": "POS Flow", "nav.stack": "Architecture",
      "cta.login": "Sign in", "cta.access": "Open the panel", "cta.openpos": "Open POS",
      "cta.explore": "Explore 3D catalog", "cta.logout": "Sign out",

      "hero.kicker": "Point of sale · Inventory · Multi-branch",
      "hero.title1": "Your geek store's counter,",
      "hero.title2": "connected across every branch",
      "hero.lead": "Sell manga, figures, TCG cards and collectibles from a fast interface. Each branch's inventory is deducted automatically with every sale.",
      "stats.branches": "demo branches", "stats.tax": "tax broken out", "stats.roles": "access roles", "stats.lang": "bilingual UI",

      "showroom.kicker": "Interactive catalog",
      "showroom.title": "Collectibles that spin with you",
      "showroom.sub": "Move the cursor over the pieces. Each card responds with tilt and neon light.",
      "roles.kicker": "Permission architecture", "roles.title": "Three levels, one system",
      "flow.kicker": "Sales module", "flow.title": "From search to receipt in seconds",
      "stack.kicker": "How it's built", "stack.title": "Vanilla up front, PHP and MySQL behind",
      "foot.note": "Academic project — Multi-branch point of sale and inventory.",

      "banner.offline": "Catalog in local mode: the server isn't responding. The store works; start PHP + MySQL for the panel.",
      "banner.retry": "Retry",

      "cat.manga": "Manga", "cat.figuras": "Figures", "cat.tcg": "TCG Cards",
      "cat.comics": "Comics", "cat.preventa": "Pre-orders", "cat.all": "All",
      "nav.cart": "Cart",
      "cta.staff": "Staff / POS access", "cta.mypanel": "My panel", "cta.myaccount": "My account",

      "hero.kicker": "Collectibles Portal & POS System",
      "hero.t1": "Geek culture", "hero.t2": "in every branch",
      "hero.lead": "Manga, figures, TCG cards and collectibles with real covers. Buy online and check availability at each physical store in Mexico.",
      "hero.shop": "Browse catalog", "hero.scroll": "Scroll",

      "shop.kicker": "E-commerce catalog", "shop.title": "New releases & pre-orders",
      "shop.sub": "Hover for the 3D effect. Click a volume to spin it 360°.",
      "shop.search": "Search by title or author…",
      "shop.empty": "No products in this category.",
      "shop.noresults": "No results for “{q}”.",

      "pkm.add": "Pokémon TCG",
      "pkm.title": "Import Pokémon TCG card",
      "pkm.searchPh": "Search by name (Charizard, Pikachu…)",
      "pkm.allSets": "All sets",
      "pkm.hint": "Type at least 2 letters or pick a set.",
      "pkm.results": "results",
      "pkm.select": "Select",
      "pkm.back": "Back to search",
      "pkm.price": "Suggested market price",
      "pkm.stockByBranch": "Initial stock per branch",
      "pkm.save": "Save to inventory",
      "pkm.needStock": "Set stock for at least one branch.",
      "pkm.saved": "Card imported into {n} branch(es).",

      "fig.add": "Figure",
      "fig.title": "Search / add figure",
      "fig.searchPh": "Search by character (Gojo Satoru, Luffy Gear 5…)",
      "fig.hint": "Type at least 2 letters of the character or figure.",
      "fig.results": "results",
      "fig.localSource": "local catalog",
      "fig.select": "Select",
      "fig.back": "Back to search",
      "fig.price": "Price",
      "fig.stockByBranch": "Initial stock per branch",
      "fig.save": "Save to inventory",
      "fig.needStock": "Set stock for at least one branch.",
      "fig.saved": "Figure imported into {n} branch(es).",
      "fig.unavailable": "Figure service unavailable.",

      "shop.source.jikan": "Real covers via MyAnimeList",
      "shop.source.anilist": "Real covers via AniList",
      "shop.source.fallback": "Local catalog (no server connection)",

      "ptag.novedad": "New", "ptag.preventa": "Pre-order", "ptag.oferta": "Sale",
      "prod.add": "Add", "prod.added": "Added to cart",
      "prod.view3d": "3D preview", "prod.rotate": "Drag to spin 360°", "prod.angle": "Angle",
      "prod.view3dTab": "3D view", "prod.photo": "Photo",
      "prod.available": "Available at", "prod.author": "Author / Brand",
      "prod.manufacturer": "Manufacturer", "prod.scale": "Scale / Line",
      "prod.volumes": "Volumes", "prod.score": "Score", "prod.buy": "Add to cart",
      "prod.soldout": "Sold out",
      "prod.volume": "Vol.", "prod.pickVolume": "Pick volume",
      "prod.stockByBranch": "Stock by branch",
      "volumes.title": "Volumes & prices",
      "volumes.count": "Number of volumes",
      "volumes.priceEach": "Price per volume (leave blank to skip)",
      "volumes.needPrice": "Enter a price for at least one volume.",
      "volumes.done": "{n} volume(s) saved. Set their stock with the + button.",
      "volumes.current": "Current volumes",
      "volumes.none": "No individual volumes yet for this series.",
      "volumes.addNew": "+ Add new volume",
      "volumes.newTitle": "New volume",
      "volumes.savePrice": "Save price",
      "volumes.priceSaved": "Price updated.",
      "volumes.created": "Volume created.",
      "tags.pick": "Store tags",
      "tags.pickHint": "Pick the ones that apply; shown on the store card.",

      "branches.kicker": "Physical stores",
      "branches.title": "Our branches in Mexico",
      "branches.sub": "Pick up your order or visit us. Each branch has its own inventory.",
      "branches.hours": "Hours", "branches.phone": "Phone", "branches.addr": "Address",
      "branches.search": "Search branch...", "branches.more": "Continue",

      "cart.title": "Your cart", "cart.total": "Total",
      "cart.quote": "Reserve items", "cart.empty": "Your cart is empty.",
      "cart.note": "Demo shopping — no real payments processed. All charges are in Mexican pesos (MXN).",
      "cart.quoteTitle": "GeekPoint quote",
      "cart.quoteIntro": "Show this summary at any branch to reserve your products.",

      "btn.close": "Close",
      "resv.title": "Reserve items",
      "resv.intro": "Generate a folio to pick up and pay at the store.",
      "resv.name": "Name", "resv.email": "Email (optional)", "resv.phone": "Phone (optional)",
      "resv.branch": "Pickup branch", "resv.pickAny": "Any branch",
      "resv.submit": "Create reservation", "resv.created": "Reservation created",
      "resv.ticketKicker": "RESERVATION",
      "resv.present": "Show this folio (or the barcode) at checkout to pay and collect.",
      "resv.error": "Couldn't create the reservation.",
      "resv.shortStock": "Not enough stock for:",
      "resv.customer": "Customer",
      "resv.pos": "Reservations", "resv.lookup": "Folio (GP-XXXX)", "resv.searchBtn": "Search",
      "resv.pending": "Pending", "resv.none": "No pending reservations.",
      "resv.charge": "Charge reservation", "resv.cancelBtn": "Cancel reservation",
      "resv.chargeAtRegister": "Charge at register",
      "resv.loaded": "{n} item(s) added to the sale.",
      "resv.notfound": "Folio not found.",
      "resv.cobradaMsg": "Reservation marked as charged.",
      "resv.canceladaMsg": "Reservation cancelled.",
      "resv.confirmCancel": "Cancel reservation {folio}? This cannot be undone.",
      "resv.status.pendiente": "Pending", "resv.status.cobrada": "Charged", "resv.status.cancelada": "Cancelled",

      "login.title": "Welcome back",
      "login.sub": "Sign in with your GeekPoint POS account.",
      "login.email": "Email", "login.password": "Password", "login.submit": "Sign in",
      "login.demo": "Demo accounts (password: password)",
      "login.badcreds": "Wrong email or password.",
      "login.noapi": "No API connection. Check that the PHP server and MySQL are running.",

      "nav.overview": "Overview", "nav.branches": "Branches", "nav.users": "Users",
      "nav.inventory": "Inventory", "nav.products": "Products", "nav.registers": "Registers",
      "nav.sales": "Sales", "nav.pos": "Point of sale", "nav.home": "Home",

      "admin.title": "General Administrator Panel",
      "manager.title": "Management Panel",
      "pos.title": "Point of sale",

      "kpi.salesToday": "Sales today", "kpi.salesMonth": "Sales this month",
      "kpi.branchesActive": "Active branches", "kpi.lowStock": "Stock alerts",
      "kpi.users": "Active users", "kpi.products": "Active products",
      "kpi.registers": "Active registers", "kpi.invValue": "Inventory value",
      "kpi.ticketAvg": "Average ticket",

      "col.branch": "Branch", "col.city": "City", "col.status": "Status",
      "col.today": "Today", "col.month": "Month", "col.tickets": "Tickets", "col.lowstock": "Low stock",
      "col.name": "Name", "col.email": "Email", "col.role": "Role", "col.lastlogin": "Last login",
      "col.sku": "SKU", "col.category": "Category", "col.price": "Price", "col.stock": "Stock",
      "col.min": "Min", "col.actions": "Actions", "col.folio": "Folio", "col.cashier": "Cashier",
      "col.total": "Total", "col.method": "Payment", "col.date": "Date", "col.qty": "Qty",
      "col.movement": "Movement", "col.product": "Product", "col.delta": "Δ", "col.result": "Result",
      "col.register": "Register", "col.top": "Best sellers",

      "status.active": "Active", "status.inactive": "Inactive",
      "role.admin": "Administrator", "role.manager": "Manager", "role.cashier": "Cashier",
      "method.cash": "Cash", "method.card": "Card", "method.transfer": "Transfer",

      "btn.new": "New", "btn.newBranch": "New branch", "btn.newUser": "New user",
      "btn.newProduct": "New product", "btn.newRegister": "New register",
      "btn.save": "Save", "btn.cancel": "Cancel", "btn.edit": "Edit", "btn.delete": "Delete",
      "btn.adjust": "Adjust stock", "btn.activate": "Activate", "btn.deactivate": "Deactivate",
      "btn.viewTicket": "View receipt", "btn.print": "Print", "btn.charge": "Charge",
      "btn.clear": "Clear", "btn.retry": "Retry",

      "pos.search": "Search by name, SKU or category…",
      "pos.all": "All", "pos.cart": "Current sale", "pos.empty": "No products added yet.",
      "pos.subtotal": "Subtotal", "pos.tax": "Tax", "pos.total": "Total",
      "pos.paidWith": "Pay with", "pos.received": "Received", "pos.change": "Change",
      "pos.customer": "Customer (optional)", "pos.register": "Register",
      "pos.done": "Sale recorded", "pos.lowWarn": "Low stock",
      "pos.outOfStock": "Out of stock", "pos.needPayment": "Cash received is less than the total.",

      "ticket.title": "SALES RECEIPT", "ticket.thanks": "Thank you for your purchase!",
      "ticket.folio": "Folio", "ticket.branch": "Branch", "ticket.cashier": "Served by",
      "ticket.date": "Date", "ticket.items": "Items", "ticket.back": "Back to POS",
      "ticket.paper": "Paper",

      "form.branchCode": "Code", "form.branchName": "Name", "form.city": "City",
      "form.state": "State", "form.address": "Address", "form.phone": "Phone",
      "form.hours": "Opening hours",
      "form.password": "Password", "form.passwordHint": "Leave empty to keep it",
      "form.assignBranch": "Assigned branch", "form.description": "Description",
      "form.taxRate": "Tax rate", "form.minStock": "Minimum stock", "form.initialStock": "Initial stock",
      "form.adjustMode": "Mode", "form.setTo": "Set to", "form.addRemove": "Add / subtract",
      "form.quantity": "Quantity", "form.note": "Note",

      "prodadm.new": "New product",
      "form.prodadm.name": "Product name",
      "form.prodadm.category": "Category",
      "form.prodadm.price": "Price (MXN)",
      "form.prodadm.editorial": "Publisher / Brand",
      "form.prodadm.maker": "Brand / Manufacturer",
      "form.prodadm.scale": "Scale / Line (optional)",
      "form.prodadm.synopsis": "Synopsis / description (Spanish)",
      "prodadm.synopsisPh": "Spanish synopsis for the storefront…",
      "form.prodadm.figurePng": "Figure / character cutout (transparent PNG)",
      "form.prodadm.image": "Cover / images (comma-separated URLs)",
      "form.prodadm.imageHint": "The first URL is the cover shown in the store.",
      "form.tags": "Store tags",
      "form.tagsHint": "Comma-separated; shown on the store card. E.g. novedad, preventa",
      "prodadm.orUpload": "or upload a file from your computer",
      "prodadm.uploading": "Uploading images…",
      "prodadm.uploadFail": "Image upload failed.",
      "prodadm.stockByBranch": "Initial stock per branch",
      "prodadm.needStock": "Set stock for at least one branch.",
      "prodadm.deleted": "Product removed ({n} record(s)).",
      "prodadm.restock": "Add stock by branch",
      "prodadm.restockTitle": "Add stock — {name}",
      "prodadm.restockHint": "Amount to ADD to each branch's current stock (0 = no change).",
      "prodadm.restockDone": "Stock added.",
      "prodadm.notInBranch": "no stock — will be created",

      "empty.none": "No records yet.",
      "confirm.delete": "Delete “{name}”? This cannot be undone.",
      "toast.saved": "Changes saved.", "toast.deleted": "Record deleted.",
      "toast.created": "Record created.", "toast.error": "Something went wrong.",
      "toast.stockAdjusted": "Stock updated.", "toast.sessionEnd": "Signed out.",

      "guard.login": "Sign in to continue.",
      "misc.loading": "Loading…", "misc.of": "of", "misc.branch": "Branch",
      "misc.welcome": "Hi, {name}", "misc.last14": "Last 14 days",
      "misc.cashierRank": "Performance by cashier", "misc.recentSales": "Recent sales",
      "misc.movements": "Inventory movements", "misc.alerts": "Products on alert"
    }
  };

  var lang = "es";
  try {
    var saved = localStorage.getItem("gp_lang");
    if (saved === "es" || saved === "en") lang = saved;
  } catch (e) {}

  function t(key, vars) {
    var table = DICT[lang] || DICT.es;
    var str = table[key];
    if (str == null) str = (DICT.es[key] != null ? DICT.es[key] : key);
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] != null ? vars[k] : "{" + k + "}";
      });
    }
    return str;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function set(next) {
    if (next !== "es" && next !== "en") return;
    if (next === lang) return;   // ya está en ese idioma: no re-renderizar ni disparar el evento
    lang = next;
    try { localStorage.setItem("gp_lang", lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang);
    apply(document);
    // Los listeners (store.js) son responsables de CONSERVAR su propio estado
    // (categoría activa, etc.) al re-renderizar por este evento.
    window.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang: lang } }));
  }

  function pick(obj) {
    // Elige obj.es / obj.en (o array {es:[],en:[]})
    if (!obj) return obj;
    return obj[lang] != null ? obj[lang] : obj.es;
  }

  window.__I18N__ = DICT;
  window.I18N = {
    t: t, apply: apply, set: set, pick: pick,
    get lang() { return lang; }
  };

  document.documentElement.setAttribute("lang", lang);
})();
