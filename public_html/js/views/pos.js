/* =============================================================
   Vista: Módulo POS (cajero) + Ticket.  window.Views.pos / Views.ticket
   ============================================================= */
(function () {
  "use strict";
  window.Views = window.Views || {};
  var $ = UI.$, $$ = UI.$$, esc = UI.escHTML, V = window.Views;

  var ctx = {
    branchId: null, branches: [], registers: [], registerId: null, categories: [],
    products: [], filter: { q: "", cat: "" }, method: "cash", loaded: false
  };

  /** id de la 1ª caja ACTIVA de la sucursal (para que el POS arranque en "Caja 1"). */
  function firstRegisterId() {
    var r = (ctx.registers || []).filter(function (x) { return x.status === "active"; })[0];
    return r ? r.id : null;
  }

  var EMOJI = { manga: "📗", figuras: "🗿", tcg: "🃏", comics: "💥", coleccionables: "🎁" };

  /* Botón "Imprimir" con la impresora animada (.printer). Conserva onclick=window.print(). */
  function printBtn() {
    return '<button type="button" class="btn btn--ghost btn--sm printbtn" data-print>' +
      '<span class="printer" aria-hidden="true">' +
        '<span class="printer__paper"><svg viewBox="0 0 8 8" class="printer__svg" fill="none">' +
          '<path d="M6.28951 1.3867C6.91292 0.809799 7.00842 0 7.00842 0C7.00842 0 6.45246 0.602112 5.54326 0.602112C4.82505 0.602112 4.27655 0.596787 4.07703 0.595012L3.99644 0.594302C1.94904 0.594302 0.290039 2.25224 0.290039 4.29715C0.290039 6.34206 1.94975 8 3.99644 8C6.04312 8 7.70284 6.34206 7.70284 4.29715C7.70347 3.73662 7.57647 3.18331 7.33147 2.67916C7.08647 2.17502 6.7299 1.73327 6.2888 1.38741L6.28951 1.3867ZM3.99679 6.532C2.76133 6.532 1.75875 5.53084 1.75875 4.29609C1.75875 3.06133 2.76097 2.06018 3.99679 2.06018C4.06423 2.06014 4.13163 2.06311 4.1988 2.06905L4.2414 2.07367C4.25028 2.07438 4.26057 2.0758 4.27406 2.07651C4.81533 2.1436 5.31342 2.40616 5.67465 2.81479C6.03589 3.22342 6.23536 3.74997 6.23554 4.29538C6.23554 5.53084 5.23439 6.532 3.9975 6.532H3.99679Z"/>' +
          '<path d="M6.756 1.82386C6.19293 2.09 5.58359 2.24445 4.96173 2.27864C4.74513 2.17453 4.51296 2.10653 4.27441 2.07734C4.4718 2.09225 5.16906 2.07947 5.90892 1.66374C6.04642 1.58672 6.1743 1.49364 6.28986 1.38647C6.45751 1.51849 6.61346 1.6647 6.756 1.8235V1.82386Z"/>' +
        '</svg></span>' +
        '<span class="printer__dot"></span>' +
        '<span class="printer__out"><span class="printer__paper-out"></span></span>' +
      '</span>' +
      '<span>' + esc(I18N.t("btn.print")) + '</span>' +
    '</button>';
  }

  /* Selector de tamaño de papel para la impresión del ticket (térmica / A4). */
  function printOptsHTML() {
    var m = (window.UI && UI.printMode && UI.printMode()) || "80";
    function opt(v, label) { return '<option value="' + v + '"' + (m === v ? ' selected' : '') + '>' + label + '</option>'; }
    return '<label class="ticket-print-opts">' +
      '<span>' + esc(I18N.t("ticket.paper") || "Papel") + '</span>' +
      '<select class="select select--sm" data-printmode>' +
        opt("80", "Térmica 80 mm") + opt("58", "Térmica 58 mm") + opt("a4", "Hoja A4") +
      '</select></label>';
  }
  function bindPrintOpts(scope) {
    var sel = scope.querySelector("[data-printmode]");
    if (sel && window.UI && UI.setPrintMode) {
      sel.addEventListener("change", function () { UI.setPrintMode(sel.value); });
    }
  }

  function render() {
    return (
      '<div class="pos-view">' +
        '<div class="content__head" style="padding:1rem clamp(1rem,3vw,2rem) 0">' +
          '<h1>' + esc(I18N.t("pos.title")) + '</h1>' +
          '<span class="spacer"></span>' +
          '<span data-branch-slot></span>' +
          '<button class="btn btn--ghost btn--sm" data-resv-open>🎫 ' + esc(I18N.t("resv.pos")) + '</button>' +
          '<a class="btn btn--ghost btn--sm" href="#/" data-link>← ' + esc(I18N.t("nav.home")) + '</a>' +
          '<button class="btn btn--ghost btn--sm" data-logout>' + esc(I18N.t("cta.logout")) + '</button>' +
        '</div>' +
        '<div class="content"><div class="pos">' +
          '<div>' +
            '<div class="pos__search"><input class="input" data-q placeholder="' + esc(I18N.t("pos.search")) + '" autocomplete="off"></div>' +
            '<div class="pos__cats" data-cats></div>' +
            '<div class="pos__grid" data-grid>' + V._loading() + '</div>' +
          '</div>' +
          '<aside class="cart" data-cart></aside>' +
        '</div></div>' +
      '</div>'
    );
  }

  function mount(root) {
    var grid = $("[data-grid]", root);
    ctx.method = "cash";
    STORE.cart = STORE.cart || [];

    resolveBranch(root).then(function () {
      return Promise.all([
        API.get("categories").then(function (d) { ctx.categories = d.categories; }),
        API.get("registers" + (isAdmin() ? "?branch_id=" + ctx.branchId : "")).then(function (d) { ctx.registers = d.registers; }).catch(function () { ctx.registers = []; })
      ]);
    }).then(function () {
      ctx.registerId = firstRegisterId();   // el POS arranca con la Caja 1 elegida
      renderCats(root);
      renderCart(root);
      loadProducts(root);
    }).catch(function (err) {
      grid.innerHTML = V._error(err);
    });

    // eventos
    var onQ = UI.debounce(function () {
      ctx.filter.q = $("[data-q]", root).value.trim();
      loadProducts(root);
    }, 260);
    $("[data-q]", root).addEventListener("input", onQ);

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-resv-open]")) { resvModal(root); return; }
      var pickBtn = e.target.closest("[data-pick-series]");
      if (pickBtn) { volumePickerModal(pickBtn.getAttribute("data-pick-series")); return; }
      var addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        var id = addBtn.getAttribute("data-add");
        var p = null;
        ctx.products.some(function (g) {
          if (g.children && g.children.length) return false;   // series: se agrega desde el selector
          var s = g.sample || g;
          if (String(s.id) === id) { p = s; return true; }
          return false;
        });
        if (p) { STORE.cartAdd(mapProduct(p)); }
        return;
      }
      var inc = e.target.closest("[data-inc]"); if (inc) return STORE.cartInc(+inc.getAttribute("data-inc"));
      var dec = e.target.closest("[data-dec]"); if (dec) return STORE.cartDec(+dec.getAttribute("data-dec"));
      var rm = e.target.closest("[data-rm]");
      if (rm) {
        var id = +rm.getAttribute("data-rm");
        var row = rm.closest(".citem");
        if (row && !UI.reduced) {
          row.classList.add("cart-item-leaving");
          setTimeout(function () { STORE.cartRemove(id); }, 200);
        } else {
          STORE.cartRemove(id);
        }
        return;
      }
      var clr = e.target.closest("[data-clear]"); if (clr) return STORE.cartClear();
      var pm = e.target.closest("[data-method]"); if (pm) { ctx.method = pm.getAttribute("data-method"); renderCart(root); return; }
      var charge = e.target.closest("[data-charge]"); if (charge) return checkout(root);
    });

    var offCart = STORE.on("cart", function () { renderCart(root); });
    var onLang = function () {
      $("[data-q]", root).setAttribute("placeholder", I18N.t("pos.search"));
      renderCats(root); renderCart(root);
      var grid = $("[data-grid]", root);
      if (ctx.products.length) grid.innerHTML = ctx.products.map(cardHTML).join("");
    };
    window.addEventListener("i18n:change", onLang);
    root.__cleanup = function () { offCart(); window.removeEventListener("i18n:change", onLang); };
  }

  function isAdmin() { return STORE.role === "admin"; }

  function resolveBranch(root) {
    var slot = $("[data-branch-slot]", root);
    if (STORE.user && STORE.user.branch_id) {
      ctx.branchId = STORE.user.branch_id;
      var bn = (STORE.session.branch && STORE.session.branch.name) || I18N.t("misc.branch");
      slot.innerHTML = '<span class="chip">' + esc(bn) + '</span>';
      return Promise.resolve();
    }
    // admin: elegir sucursal
    return API.get("branches").then(function (d) {
      ctx.branches = d.branches.filter(function (b) { return b.status === "active"; });
      ctx.branchId = ctx.branches.length ? ctx.branches[0].id : null;
      slot.innerHTML = '<select class="select" data-branch style="width:auto;min-width:160px">' +
        ctx.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join("") + '</select>';
      $("[data-branch]", root).addEventListener("change", function () {
        ctx.branchId = +this.value;
        STORE.cartClear();
        API.get("registers?branch_id=" + ctx.branchId).then(function (r) { ctx.registers = r.registers; ctx.registerId = firstRegisterId(); renderCart(root); });
        loadProducts(root);
      });
    });
  }

  function renderCats(root) {
    var host = $("[data-cats]", root);
    var all = '<button class="chip' + (ctx.filter.cat === "" ? " is-active" : "") + '" data-cat="">' + esc(I18N.t("pos.all")) + '</button>';
    host.innerHTML = all + ctx.categories.map(function (c) {
      return '<button class="chip' + (ctx.filter.cat == c.id ? " is-active" : "") + '" data-cat="' + c.id + '">' +
        (c.icon || "") + ' ' + esc(I18N.pick({ es: c.name_es, en: c.name_en })) + '</button>';
    }).join("");
    host.onclick = function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      ctx.filter.cat = b.getAttribute("data-cat");
      renderCats(root);
      loadProducts(root);
    };
  }

  function loadProducts(root) {
    var grid = $("[data-grid]", root);
    if (!ctx.branchId) { grid.innerHTML = '<p class="muted">' + esc(I18N.t("empty.none")) + '</p>'; return; }
    // Límite más alto que antes: al plegar por serie se necesitan las filas
    // crudas de TODOS los tomos/números para poder ofrecerlos en el selector.
    var qs = "?status=active&limit=300&branch_id=" + ctx.branchId;
    if (ctx.filter.q) qs += "&q=" + encodeURIComponent(ctx.filter.q);
    if (ctx.filter.cat) qs += "&category_id=" + ctx.filter.cat;
    return API.get("products" + qs).then(function (d) {
      // Mismo plegado que Admin/Gerente: los tomos de manga y números de
      // cómic se esconden bajo su serie (no se repite la portada por tomo).
      var folded = (V._foldSeries && V._groupBySku)
        ? V._foldSeries(V._groupBySku(d.products))
        : { list: d.products.map(function (p) { return { sku: p.sku, sample: p, name: p.name, category_slug: p.category_slug, price: p.price, effective_price: p.effective_price, discount_status: p.discount_status, discount_percent: p.discount_percent, total: p.stock }; }), bySku: {} };
      ctx.products = folded.list;
      ctx.bySku = folded.bySku;
      grid.innerHTML = ctx.products.length ? ctx.products.map(cardHTML).join("")
        : '<div class="state"><div class="state__icon">🔍</div><p>' + esc(I18N.t("empty.none")) + '</p></div>';
      // Portadas reales del catálogo de la tienda: si aún no cargó, repinta.
      if (ctx.products.length && window.Catalog && Catalog.load && !Catalog.ready) {
        var snapshot = ctx.products;
        Catalog.load().then(function () {
          if (ctx.products === snapshot && grid.isConnected) grid.innerHTML = ctx.products.map(cardHTML).join("");
        }).catch(function () {});
      }
    }).catch(function (err) { grid.innerHTML = V._error(err); });
  }

  /* Tarjeta de la grilla del POS. Manga y cómics SIEMPRE ofrecen "Elige tomo"
     (igual que Admin/Gerente ofrecen "Tomos y precios" para toda esa
     categoría, tengan o no ya una ficha propia por tomo) — el botón NO agrega
     nada directo: abre el selector (volumePickerModal). El resto de
     categorías agrega directo al ticket como siempre. */
  function cardHTML(g) {
    var isSeries = g.category_slug === "manga" || g.category_slug === "comics";
    var s = g.sample || g;                      // fila cruda (id, stock… de ESTA sucursal)
    var total = g.groupTotal != null ? g.groupTotal : (g.total != null ? g.total : (s.stock || 0));
    var out = total === 0;
    var art = EMOJI[g.category_slug] || "📦";
    var cls = "prod" + (out ? " is-out" : (s.low_stock ? " is-low" : ""));
    var cover = (V._productCover ? V._productCover(g) : "") || "";
    var name = g.displayName || g.name;
    var discounted = !isSeries && g.discount_status === "active" && Number(g.effective_price) < Number(g.price);
    var priceHTML = discounted
      ? '<del>' + UI.money(g.price, true) + '</del><strong>' + UI.money(g.effective_price, true) + '</strong><small>−' + g.discount_percent + '%</small>'
      : UI.money((isSeries ? g.price : (g.effective_price != null ? g.effective_price : g.price)), true);
    return (
      '<button type="button" class="' + cls + '"' +
        (isSeries ? ' data-pick-series="' + esc(g.sku) + '"' : ' data-add="' + s.id + '"' + (out ? " disabled" : "")) + '>' +
        '<span class="prod__media">' +
          (cover
            ? '<img src="' + esc(cover) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">'
            : '<span class="prod__art">' + art + '</span>') +
          '<span class="prod__badge">' + (isSeries ? esc(I18N.t("prod.pickVolume")) : (out ? esc(I18N.t("pos.outOfStock")) : (total + " u"))) + '</span>' +
        '</span>' +
        '<span class="prod__body">' +
          '<span class="prod__name">' + esc(name) + '</span>' +
          '<span class="prod__price">' + priceHTML + '</span>' +
        '</span>' +
      '</button>'
    );
  }

  function _pad2(v) { return v < 10 ? "0" + v : "" + v; }
  function _volNum(g) {
    var s = g.sample || g;
    var m = String(s.sku || "").match(/-(\d+)$/) || String(s.name || "").match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }
  /* Copia superficial de una fila cruda con nombre/SKU de exhibición
     reemplazados — para tomos "virtuales" (sin ficha propia): el `id` real
     (el de la serie) es el que se vende y descuenta de stock; nombre y SKU
     son solo cosméticos, para que el ticket muestre "Vol. N" y su SKU. */
  function _withOverrides(sample, overrides) {
    var out = {};
    for (var k in sample) if (Object.prototype.hasOwnProperty.call(sample, k)) out[k] = sample[k];
    for (var k2 in overrides) if (Object.prototype.hasOwnProperty.call(overrides, k2)) out[k2] = overrides[k2];
    return out;
  }

  /* Selector de tomo/número: se abre al pulsar la tarjeta de un manga o
     cómic — MISMO criterio que "Tomos y precios" en Admin: se listan TODOS
     los tomos 1..N (no solo los que ya tienen ficha propia en la BD). Cada
     fila agrega ESE tomo puntual al ticket — "una parte para añadir producto
     a la venta actual", sin tocar precio ni stock. */
  function volumePickerModal(sku) {
    var g = ctx.bySku && ctx.bySku[sku];
    if (!g) return;
    var byNum = {};
    // El marcador de serie de manga (SKU "MNG-S-…", sin número de tomo) no es
    // un artículo vendible por sí mismo — solo agrupa a sus tomos. Un cómic SÍ
    // vende su propio número más bajo (es el "padre" real).
    ((g._series ? [] : [g]).concat(g.children || [])).forEach(function (k) {
      var n = _volNum(k);
      if (n > 0) byNum[n] = k;
    });
    var maxExisting = Object.keys(byNum).reduce(function (m, k) { return Math.max(m, +k); }, 0);
    var descMatch = String((g.sample && g.sample.description) || "").match(/(\d{1,3})\s*tomos?/i);
    var total = descMatch ? Math.min(parseInt(descMatch[1], 10), 80) : (maxExisting || 12);
    var base = String(g.sku || "").replace(/-S-/i, "-").replace(/-\d{1,3}$/, "").replace(/[^A-Za-z0-9]+$/, "");
    var seriesName = g.displayName || g.name;
    var seriesSample = g.sample || g;

    // Fila real (ya tiene ficha propia) o "virtual": hereda precio/stock de
    // la serie (como "stock serie: N" en Admin). `sample` es solo para
    // MOSTRAR la fila (con su "Vol. N" y SKU cosmético); `cartSample` es lo
    // que de verdad se vende — en un tomo virtual es la FICHA REAL de la
    // serie (mismo id para todos), porque es el único registro de stock que
    // existe: el ticket/inventario lo cobra como la serie, no como "Vol. N".
    var rows = [];
    for (var v = 1; v <= total; v++) {
      var k = byNum[v];
      if (k) {
        var realSample = k.sample || k;
        rows.push({ sample: realSample, cartSample: realSample, name: k.displayName || k.name, virtual: false });
      } else {
        var vName = seriesName + " " + I18N.t("prod.volume") + " " + v;
        var vSku = base + "-" + _pad2(v);
        rows.push({
          sample: _withOverrides(seriesSample, { name: vName, sku: vSku }),
          cartSample: seriesSample, name: vName, virtual: true
        });
      }
    }

    // Misma estética que "Tomos y precios" en Admin/Gerente (.pkm-branches /
    // .pkm-branch): línea de serie + SKU, encabezado en mono/mayúsculas y la
    // cuadrícula de filas. Aquí cada fila ES el botón — tocarla agrega ESE
    // tomo a la venta actual (sin precio/stock editable, solo vender).
    var c = document.createElement("div");
    c.innerHTML =
      '<p class="muted" style="margin-bottom:.6rem">' + esc(seriesName) +
        ' · <span class="mono">' + esc(g.sku) + '</span></p>' +
      '<p class="field__label mono" style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.1em;margin:.6rem 0 .5rem">' +
        esc(I18N.t("pos.pickVolumeHint")) + '</p>' +
      '<div class="pkm-branches">' + rows.map(function (r, i) {
        var s = r.sample;
        var out = (s.stock || 0) === 0;
        var discounted = !r.virtual && s.discount_status === "active" && Number(s.effective_price) < Number(s.price);
        var priceHTML = discounted
          ? '<del class="muted" style="font-size:.7rem;font-weight:400">' + UI.money(s.price, true) + '</del> ' +
              UI.money(s.effective_price, true)
          : UI.money(s.effective_price != null ? s.effective_price : s.price, true);
        return '<button type="button" class="pkm-branch" data-vol-idx="' + i + '"' + (out ? " disabled" : "") +
            ' style="border:0;width:100%;text-align:left' + (out ? ";opacity:.5" : "") + '">' +
          '<span>' + esc(r.name) +
            '<br><small class="muted mono" style="font-size:.62rem">' + esc(s.sku) + ' · ' +
              (out ? esc(I18N.t("pos.outOfStock")) : esc(I18N.t("col.stock").toLowerCase()) +
                (r.virtual ? " " + esc(I18N.t("volumes.seriesStock")) : "") + ': ' + s.stock) +
            '</small></span>' +
          '<span class="mono" style="font-weight:700;white-space:nowrap">' + priceHTML + '</span>' +
        '</button>';
      }).join("") + '</div>';
    UI.modal({ title: I18N.t("prod.pickVolume") + " · " + esc(seriesName), content: c, wide: true });
    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-vol-idx]");
      if (!b || b.disabled) return;
      var row = rows[parseInt(b.getAttribute("data-vol-idx"), 10)];
      if (!row) return;
      STORE.cartAdd(mapProduct(row.cartSample));
      // Confirma cuál tomo se eligió aunque en el carrito quede agrupado bajo
      // la serie (un tomo virtual no tiene línea propia: comparte el stock).
      UI.toast(I18N.t("prod.added") + (row.virtual ? ": " + row.name : ""), "ok");
      // El modal NO se cierra: se puede seguir agregando varios tomos de la
      // misma serie de un tirón. Se cierra con la ✕ o el fondo, como siempre.
    });
  }

  function mapProduct(p) {
    return {
      id: p.id, name: p.name, sku: p.sku,
      list_price: p.price, price: p.effective_price != null ? p.effective_price : p.price,
      discount_percent: p.discount_status === "active" ? p.discount_percent : 0,
      unit_savings: p.discount_status === "active" ? p.unit_savings : 0, tax_rate: p.tax_rate,
      stock: p.stock, art: EMOJI[p.category_slug] || "📦"
    };
  }

  function renderCart(root) {
    var host = $("[data-cart]", root);
    var t = STORE.cartTotals();
    var items = STORE.cart;

    var itemsHTML = items.length ? items.map(function (l) {
      var discounted = Number(l.unit_savings) > 0;
      return (
        '<div class="citem">' +
          '<div><div class="citem__name">' + esc(l.name) + '</div>' +
            '<div class="citem__sub">' + (discounted
              ? '<del>' + UI.money(l.list_price) + '</del> ' + UI.money(l.price) + ' · −' + l.discount_percent + '%'
              : UI.money(l.price)) + ' · ' + esc(l.sku) + '</div></div>' +
          '<div class="citem__qty">' +
            '<button class="qbtn" data-dec="' + l.id + '">−</button>' +
            '<span class="mono">' + l.qty + '</span>' +
            '<button class="qbtn" data-inc="' + l.id + '">+</button>' +
          '</div>' +
          '<div class="citem__line num">' + UI.money(l.price * l.qty) + '</div>' +
          '<button class="citem__rm" data-rm="' + l.id + '" title="✕">✕</button>' +
        '</div>'
      );
    }).join("") : '<p class="muted" style="padding:1rem 0">' + esc(I18N.t("pos.empty")) + '</p>';

    var activeRegs = ctx.registers.filter(function (r) { return r.status === "active"; });
    if (activeRegs.length && !activeRegs.some(function (r) { return r.id == ctx.registerId; })) {
      ctx.registerId = activeRegs[0].id;                    // por defecto, la Caja 1
    }
    var regSel = activeRegs.length
      ? '<div class="field"><label>' + esc(I18N.t("pos.register")) + '</label><select class="select" data-register>' +
        activeRegs.map(function (r) {
          return '<option value="' + r.id + '"' + (r.id == ctx.registerId ? " selected" : "") + '>' + esc(r.name) + '</option>';
        }).join("") + '</select></div>'
      : "";

    var methods = ["cash", "card", "transfer"].map(function (m) {
      return '<button class="chip' + (ctx.method === m ? " is-active" : "") + '" data-method="' + m + '">' + esc(I18N.t("method." + m)) + '</button>';
    }).join("");

    var cashRow = ctx.method === "cash"
      ? '<div class="field"><label>' + esc(I18N.t("pos.received")) + '</label>' +
        '<input class="input" type="number" min="0" step="0.01" data-paid placeholder="' + t.total.toFixed(2) + '"></div>' +
        '<div class="cart__totals"><div class="row"><span>' + esc(I18N.t("pos.change")) + '</span><span data-change>' + UI.money(0) + '</span></div></div>'
      : "";

    host.innerHTML =
      '<h2>' + esc(I18N.t("pos.cart")) + (t.count ? ' · <span class="mono">' + t.count + '</span>' : "") + '</h2>' +
      '<div class="cart__items">' + itemsHTML + '</div>' +
      '<div class="cart__totals">' +
        (t.discount > 0 ? '<div class="row cart__discount"><span>' + esc(I18N.t("discount.total")) + '</span><span class="num">−' + UI.money(t.discount) + '</span></div>' : '') +
        '<div class="row"><span>' + esc(I18N.t("pos.subtotal")) + '</span><span class="num">' + UI.money(t.subtotal) + '</span></div>' +
        '<div class="row"><span>' + esc(I18N.t("pos.tax")) + ' (16%)</span><span class="num">' + UI.money(t.tax) + '</span></div>' +
        '<div class="row row--total"><span>' + esc(I18N.t("pos.total")) + '</span><span class="num" data-total>' + UI.money(t.total) + '</span></div>' +
      '</div>' +
      '<div class="field" style="margin-top:.6rem"><label>' + esc(I18N.t("pos.customer")) + '</label><input class="input" data-customer></div>' +
      regSel +
      '<label class="muted mono" style="font-size:.7rem">' + esc(I18N.t("pos.paidWith")) + '</label>' +
      '<div class="pay-methods">' + methods + '</div>' +
      cashRow +
      '<div style="display:flex;gap:.5rem;margin-top:.4rem">' +
        '<button class="btn btn--ghost btn--sm" data-clear ' + (items.length ? "" : "disabled") + '>' + esc(I18N.t("btn.clear")) + '</button>' +
        '<button class="btn btn--neon btn--block" data-charge ' + (items.length ? "" : "disabled") + '>' + esc(I18N.t("btn.charge")) + ' · ' + UI.money(t.total) + '</button>' +
      '</div>';

    var paid = $("[data-paid]", host);
    if (paid) {
      paid.addEventListener("input", function () {
        var change = (parseFloat(paid.value) || 0) - t.total;
        $("[data-change]", host).textContent = UI.money(change > 0 ? change : 0);
      });
    }
    var regEl = $("[data-register]", host);
    if (regEl) regEl.addEventListener("change", function () { ctx.registerId = +this.value || null; });
  }

  function checkout(root) {
    var host = $("[data-cart]", root);
    var t = STORE.cartTotals();
    if (!STORE.cart.length) return;

    var method = ctx.method;
    var paidInput = $("[data-paid]", host);
    var amountPaid = paidInput && paidInput.value ? parseFloat(paidInput.value) : t.total;
    if (method === "cash" && amountPaid < t.total) {
      UI.toast(I18N.t("pos.needPayment"), "warn");
      return;
    }
    var regEl = $("[data-register]", host);
    var payload = {
      branch_id: ctx.branchId,
      register_id: (regEl && regEl.value ? +regEl.value : null) || ctx.registerId || null,
      customer_name: ($("[data-customer]", host) || {}).value || "",
      payment_method: method,
      amount_paid: amountPaid,
      expected_total: t.total,
      items: STORE.cart.map(function (l) { return { product_id: l.id, quantity: l.qty }; })
    };

    var btn = $("[data-charge]", host);
    btn.classList.add("is-loading");
    API.post("sales", payload).then(function (d) {
      btn.classList.remove("is-loading");
      STORE.cartClear();
      UI.toast(I18N.t("pos.done") + " · " + d.sale.folio, "ok");
      showTicketModal(d.sale);
      loadProducts(root);
    }).catch(function (err) {
      btn.classList.remove("is-loading");
      if (err && err.data && err.data.error === "price_changed") {
        (err.data.lines || []).forEach(function (serverLine) {
          var line = STORE.cart.find(function (l) { return l.id == serverLine.product_id; });
          if (!line) return;
          line.list_price = serverLine.list_unit_price;
          line.price = serverLine.unit_price;
          line.discount_percent = serverLine.discount_percent;
          line.unit_savings = serverLine.unit_discount;
        });
        renderCart(root);
        UI.toast(I18N.t("discount.posUpdated"), "warn");
        return;
      }
      UI.toast(err.message || I18N.t("toast.error"), "error");
      loadProducts(root);
    });
  }

  /* ---------------- Ticket ---------------- */
  function ticketHTML(s) {
    var loc = I18N.lang === "en" ? "en-US" : "es-MX";
    var rows = (s.items || []).map(function (it) {
      var detail = Number(it.unit_discount) > 0
        ? '<small>' + esc(I18N.t("discount.listPrice")) + ' ' + UI.money(it.list_unit_price) + ' · −' + it.discount_percent + '% · ' + UI.money(it.unit_price) + '</small>'
        : '';
      return '<div class="t-row"><span>' + it.quantity + '× ' + esc(it.product_name) + detail + '</span><span>' + UI.money(it.line_total) + '</span></div>';
    }).join("");
    return (
      '<div class="ticket">' +
        '<h2>◈ GEEKPOINT POS</h2>' +
        '<p style="text-align:center" class="muted">' + esc(s.branch_name || "") + '<br>' + esc(s.branch_address || "") + '</p>' +
        '<hr>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.folio")) + '</span><span>' + esc(s.folio) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.date")) + '</span><span>' + UI.fmtDate(s.created_at, true) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("ticket.cashier")) + '</span><span>' + esc(s.cashier_name || "") + '</span></div>' +
        (s.register_name ? '<div class="t-row"><span>' + esc(I18N.t("pos.register")) + '</span><span>' + esc(s.register_name) + '</span></div>' : "") +
        '<hr>' + rows + '<hr>' +
        (Number(s.discount_total) > 0 ? '<div class="t-row"><span>' + esc(I18N.t("discount.total")) + '</span><span>−' + UI.money(s.discount_total) + '</span></div>' : '') +
        '<div class="t-row"><span>' + esc(I18N.t("pos.subtotal")) + '</span><span>' + UI.money(s.subtotal) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("pos.tax")) + '</span><span>' + UI.money(s.tax) + '</span></div>' +
        '<div class="t-row t-row--total"><span>' + esc(I18N.t("pos.total")) + '</span><span>' + UI.money(s.total) + '</span></div>' +
        '<div class="t-row"><span>' + esc(I18N.t("method." + s.payment_method)) + '</span><span>' + UI.money(s.amount_paid) + '</span></div>' +
        (s.payment_method === "cash" ? '<div class="t-row"><span>' + esc(I18N.t("pos.change")) + '</span><span>' + UI.money(s.change_due) + '</span></div>' : "") +
        '<hr><p style="text-align:center">' + esc(I18N.t("ticket.thanks")) + '</p>' +
      '</div>'
    );
  }

  function showTicketModal(s) {
    var wrap = document.createElement("div");
    wrap.innerHTML = ticketHTML(s) +
      '<div class="ticket__actions">' +
        printOptsHTML() +
        printBtn() +
        '<a class="btn btn--neon btn--sm" href="#/ticket/' + s.id + '" data-link>' + esc(I18N.t("btn.viewTicket")) + '</a>' +
      '</div>';
    UI.modal({ content: wrap });
    bindPrintOpts(wrap);
    wrap.querySelector("[data-link]").addEventListener("click", UI.closeModal);
    // "Imprimir": lanza la impresión y vuelve al POS en un solo paso.
    wrap.querySelector("[data-print]").addEventListener("click", function () {
      window.print();
      UI.closeModal();
    });
  }

  /* ---------------- Apartados (cobro de reservas de la tienda) ---------------- */
  function skuFromRef(ref) {
    return String(ref || "").replace(/^local-(tcg|comics|manga|figuras|coleccionables|preventa)-/, "").toUpperCase();
  }

  function resvModal(root) {
    var wrap = document.createElement("div");
    wrap.className = "resv-pos";
    wrap.innerHTML =
      '<div class="resv-lookup">' +
        '<input class="input" data-resv-folio placeholder="' + esc(I18N.t("resv.lookup")) + '" autocomplete="off">' +
        '<button class="btn btn--neon btn--sm" data-resv-find>' + esc(I18N.t("resv.searchBtn")) + '</button>' +
      '</div>' +
      '<p class="mono" style="font-size:.68rem;color:var(--faint);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.5rem">' + esc(I18N.t("resv.pending")) + '</p>' +
      '<div class="resv-list" data-resv-list>' + V._loading() + '</div>' +
      '<div data-resv-detail></div>';
    UI.modal({ title: I18N.t("resv.pos"), content: wrap, wide: true });

    var listEl = wrap.querySelector("[data-resv-list]");
    var detailEl = wrap.querySelector("[data-resv-detail]");
    var folioEl = wrap.querySelector("[data-resv-folio]");

    function rowHTML(r) {
      var prods = r.items_summary || (r.items || []).map(function (it) { return it.quantity + "× " + it.title; }).join(" · ");
      return '<div class="resv-item" data-folio="' + esc(r.folio) + '">' +
        '<div class="resv-item__main">' +
          '<div class="resv-item__folio">' + esc(r.folio) + ' · <span class="badge">' + esc(I18N.t("resv.status." + r.status)) + '</span></div>' +
          '<div class="resv-item__meta">' + esc(r.customer_name) +
            (r.customer_phone ? ' · ☎ ' + esc(r.customer_phone) : '') +
            (r.branch_name ? ' · ' + esc(r.branch_name) : '') + '</div>' +
          '<div class="resv-item__prods">' + esc(prods || '—') + '</div>' +
        '</div>' +
        '<div class="resv-item__side">' +
          '<div class="resv-item__total mono">' + UI.money(r.total) + '</div>' +
          (r.status === "pendiente" ? '<button class="btn btn--ghost btn--sm" data-resv-ready="' + esc(r.folio) + '">' + esc(I18N.t("resv.markReady")) + '</button>' : '') +
          '<button class="btn btn--neon btn--sm" data-resv-charge="' + esc(r.folio) + '">' + esc(I18N.t("resv.chargeAtRegister")) + '</button>' +
          '<button class="btn btn--ghost btn--sm" data-resv-cancel="' + esc(r.folio) + '">' + esc(I18N.t("btn.cancel")) + '</button>' +
        '</div>' +
      '</div>';
    }

    function loadList() {
      listEl.innerHTML = V._loading();
      API.get("reservations?status=activos" + (ctx.branchId ? "&branch_id=" + ctx.branchId : "")).then(function (d) {
        var rs = d.reservations || [];
        listEl.innerHTML = rs.length ? rs.map(rowHTML).join("")
          : '<p class="muted">' + esc(I18N.t("resv.none")) + '</p>';
      }).catch(function (e) { listEl.innerHTML = V._error(e); });
    }
    loadList();

    function showDetail(r) {
      var actionable = r.status === "pendiente" || r.status === "lista";
      detailEl.innerHTML =
        '<div class="card" style="margin-top:1rem;padding:1rem">' +
          '<h3 style="font-size:1rem">' + esc(r.folio) + ' · <span class="badge">' + esc(I18N.t("resv.status." + r.status)) + '</span></h3>' +
          '<p class="muted" style="font-size:.82rem;margin:.3rem 0">' + esc(I18N.t("resv.customer")) + ': ' + esc(r.customer_name) +
            (r.customer_phone ? ' · ' + esc(r.customer_phone) : '') + (r.customer_email ? ' · ' + esc(r.customer_email) : '') +
            (r.branch_name ? ' · ' + esc(r.branch_name) : '') + '</p>' +
          '<div class="resv-detail__items">' + (r.items || []).map(function (it) {
            return '<div style="display:flex;justify-content:space-between;font-size:.84rem;gap:.8rem">' +
              '<span>' + it.quantity + '× ' + esc(it.title) + '</span><span class="mono">' + UI.money(it.line_total) + '</span></div>';
          }).join("") + '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-top:.6rem;font-weight:700">' +
            '<span>' + esc(I18N.t("pos.total")) + '</span><span class="mono">' + UI.money(r.total) + '</span></div>' +
          (actionable ? '<div style="display:flex;gap:.6rem;margin-top:1rem;flex-wrap:wrap">' +
            (r.status === "pendiente" ? '<button class="btn btn--ghost btn--sm" data-resv-ready="' + esc(r.folio) + '">' + esc(I18N.t("resv.markReady")) + '</button>' : '') +
            '<button class="btn btn--ghost btn--sm" data-resv-cancel="' + esc(r.folio) + '">' + esc(I18N.t("resv.cancelBtn")) + '</button>' +
            '<button class="btn btn--neon" data-resv-charge="' + esc(r.folio) + '">' + esc(I18N.t("resv.charge")) + '</button>' +
          '</div>' : '') +
        '</div>';
    }

    function fetchFolio(folio) {
      detailEl.innerHTML = V._loading();
      API.get("reservations/" + encodeURIComponent(folio)).then(showDetail).catch(function () {
        detailEl.innerHTML = '<p class="muted" style="margin-top:1rem">' + esc(I18N.t("resv.notfound")) + '</p>';
      });
    }

    function chargeReservation(folio) {
      var btn = wrap.querySelector('[data-resv-charge="' + folio + '"]');
      if (btn) btn.classList.add("is-loading");
      API.get("reservations/" + encodeURIComponent(folio)).then(function (r) {
        var wanted = (r.items || []).map(function (it) { return { sku: skuFromRef(it.product_ref), qty: it.quantity }; })
          .filter(function (x) { return x.sku; });
        return Promise.all(wanted.map(function (x) {
          return API.get("products?branch_id=" + ctx.branchId + "&q=" + encodeURIComponent(x.sku) + "&limit=5")
            .then(function (d) {
              var p = (d.products || []).find(function (pp) { return pp.sku === x.sku; });
              if (!p) return 0;
              for (var i = 0; i < x.qty; i++) STORE.cartAdd(mapProduct(p));
              return 1;
            }).catch(function () { return 0; });
        })).then(function (hits) {
          var n = hits.reduce(function (a, b) { return a + b; }, 0);
          return API.patch("reservations/" + encodeURIComponent(folio) + "/status", { status: "cobrada" }).then(function () {
            UI.toast(I18N.t("resv.cobradaMsg") + " · " + I18N.t("resv.loaded", { n: n }), "ok");
            UI.closeModal();
            loadProducts(root);
          });
        });
      }).catch(function (err) {
        if (btn) btn.classList.remove("is-loading");
        UI.toast((err && err.message) || I18N.t("toast.error"), "error");
      });
    }

    function cancelReservation(folio) {
      if (!window.confirm(I18N.t("resv.confirmCancel", { folio: folio }))) return;
      API.patch("reservations/" + encodeURIComponent(folio) + "/status", { status: "cancelada" }).then(function () {
        UI.toast(I18N.t("resv.canceladaMsg"), "ok");
        detailEl.innerHTML = "";
        loadList();
      }).catch(function (err) { UI.toast((err && err.message) || I18N.t("toast.error"), "error"); });
    }

    function markReadyReservation(folio) {
      var btn = wrap.querySelector('[data-resv-ready="' + folio + '"]');
      if (btn) btn.classList.add("is-loading");
      API.patch("reservations/" + encodeURIComponent(folio) + "/status", { status: "lista" }).then(function (r) {
        UI.toast(I18N.t("resv.readyMsg"), "ok");
        if (detailEl.innerHTML) showDetail(r);
        loadList();
      }).catch(function (err) {
        if (btn) btn.classList.remove("is-loading");
        UI.toast((err && err.message) || I18N.t("toast.error"), "error");
      });
    }

    wrap.addEventListener("click", function (e) {
      // Botones primero: no deben disparar el detalle de la fila.
      var chg = e.target.closest("[data-resv-charge]");
      if (chg) return chargeReservation(chg.getAttribute("data-resv-charge"));
      var can = e.target.closest("[data-resv-cancel]");
      if (can) return cancelReservation(can.getAttribute("data-resv-cancel"));
      var rdy = e.target.closest("[data-resv-ready]");
      if (rdy) return markReadyReservation(rdy.getAttribute("data-resv-ready"));
      if (e.target.closest("[data-resv-find]")) {
        var f = folioEl.value.trim().toUpperCase();
        return f && fetchFolio(f);
      }
      var itm = e.target.closest("[data-folio]");
      if (itm) return fetchFolio(itm.getAttribute("data-folio"));
    });
    folioEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var f = folioEl.value.trim().toUpperCase();
      if (f) fetchFolio(f);
    });
  }

  // Vista ruta #/ticket/:id
  var ticketView = {
    roles: ["cashier", "manager", "admin"],
    render: function () { return '<div class="ticket-wrap">' + V._loading() + '</div>'; },
    mount: function (root, params) {
      var host = $(".ticket-wrap", root);
      API.get("sales/" + params.id).then(function (d) {
        host.innerHTML = ticketHTML(d.sale) +
          '<div class="ticket__actions">' +
            printOptsHTML() +
            printBtn() +
            '<a class="btn btn--neon btn--sm" href="#/pos" data-link>' + esc(I18N.t("ticket.back")) + '</a>' +
          '</div>';
        bindPrintOpts(host);
        var pb = host.querySelector("[data-print]");
        if (pb) pb.addEventListener("click", function () { window.print(); });
      }).catch(function (err) { host.innerHTML = V._error(err); });
    }
  };

  V.pos = { render: render, mount: mount, roles: ["cashier", "manager", "admin"] };
  V.ticket = ticketView;
})();
