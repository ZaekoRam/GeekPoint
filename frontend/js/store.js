/* =============================================================
   Estado de la aplicación.  window.STORE
   ============================================================= */
(function () {
  "use strict";

  var SKEY = "gp_session";
  var listeners = {};

  function emit(ev, payload) {
    (listeners[ev] || []).forEach(function (fn) { UI.safe(function () { fn(payload); }); });
    window.dispatchEvent(new CustomEvent("store:" + ev, { detail: payload }));
  }
  function on(ev, fn) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return function () { listeners[ev] = listeners[ev].filter(function (f) { return f !== fn; }); };
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SKEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && s.token && s.user) ? s : null;
    } catch (e) { return null; }
  }

  function loadShop() {
    try { var r = JSON.parse(localStorage.getItem("gp_shopcart") || "[]"); return Array.isArray(r) ? r : []; }
    catch (e) { return []; }
  }
  function saveShop(arr) { try { localStorage.setItem("gp_shopcart", JSON.stringify(arr)); } catch (e) {} }

  var STORE = {
    session: loadSession(),
    cart: [],            // POS: { id, name, sku, price, tax_rate, stock, qty, art }
    shopCart: loadShop(), // Tienda: { id, title, price, cover, qty }
    posContext: {        // se fija al entrar al POS
      branchId: null, registerId: null, paymentMethod: "cash",
      customer: "", amountPaid: null
    },

    on: on,

    /* ---------- sesión ---------- */
    setSession: function (token, user, branch) {
      this.session = { token: token, user: user, branch: branch || null };
      try { localStorage.setItem(SKEY, JSON.stringify(this.session)); } catch (e) {}
      emit("session", this.session);
    },
    updateSessionBranch: function (branch) {
      if (!this.session) return;
      this.session.branch = branch;
      try { localStorage.setItem(SKEY, JSON.stringify(this.session)); } catch (e) {}
      emit("session", this.session);
    },
    clearSession: function () {
      this.session = null;
      this.cart = [];
      try { localStorage.removeItem(SKEY); } catch (e) {}
      emit("session", null);
      emit("cart", this.cart);
    },
    get user() { return this.session ? this.session.user : null; },
    get role() { return this.session ? this.session.user.role : null; },
    isLogged: function () { return !!this.session; },
    STAFF_ROLES: ["admin", "manager", "cashier"],
    isStaff: function () {
      return !!this.session && this.STAFF_ROLES.indexOf(this.session.user.role) !== -1;
    },
    homeRoute: function () {
      if (!this.session) return "#/acceso";
      var r = this.session.user.role;
      if (r === "admin") return "#/admin";
      if (r === "manager") return "#/manager";
      if (r === "cashier") return "#/pos";
      return "#/";   // cliente: su "panel" es la propia tienda / catálogo
    },

    /* ---------- carrito POS ---------- */
    cartAdd: function (product) {
      var line = this.cart.find(function (l) { return l.id === product.id; });
      var max = Number(product.stock) || 0;
      if (line) {
        if (line.qty < max) line.qty += 1;
        else { UI.toast(I18N.t("pos.outOfStock"), "warn"); return; }
      } else {
        if (max <= 0) { UI.toast(I18N.t("pos.outOfStock"), "warn"); return; }
        this.cart.push({
          id: product.id, name: product.name, sku: product.sku,
          price: Number(product.price), tax_rate: Number(product.tax_rate) || 0.16,
          stock: max, qty: 1, art: product.art || "📦"
        });
      }
      emit("cart", this.cart);
    },
    cartSetQty: function (id, qty) {
      var line = this.cart.find(function (l) { return l.id === id; });
      if (!line) return;
      qty = Math.max(0, Math.min(qty, line.stock));
      if (qty === 0) { this.cartRemove(id); return; }
      line.qty = qty;
      emit("cart", this.cart);
    },
    cartInc: function (id) { var l = this.cart.find(function (x) { return x.id === id; }); if (l) this.cartSetQty(id, l.qty + 1); },
    cartDec: function (id) { var l = this.cart.find(function (x) { return x.id === id; }); if (l) this.cartSetQty(id, l.qty - 1); },
    cartRemove: function (id) {
      this.cart = this.cart.filter(function (l) { return l.id !== id; });
      emit("cart", this.cart);
    },
    cartClear: function () { this.cart = []; emit("cart", this.cart); },

    /* ---------- carrito de la TIENDA (cliente) ---------- */
    shopAdd: function (product, qty) {
      qty = qty || 1;
      var line = this.shopCart.find(function (l) { return l.id === product.id; });
      if (line) line.qty += qty;
      else this.shopCart.push({
        id: product.id, title: product.title, price: Number(product.price) || 0,
        cover: product.cover || "", qty: qty
      });
      saveShop(this.shopCart);
      emit("shop", this.shopCart);
    },
    shopSetQty: function (id, qty) {
      var line = this.shopCart.find(function (l) { return l.id === id; });
      if (!line) return;
      qty = Math.max(0, qty);
      if (qty === 0) return this.shopRemove(id);
      line.qty = qty;
      saveShop(this.shopCart);
      emit("shop", this.shopCart);
    },
    shopRemove: function (id) {
      this.shopCart = this.shopCart.filter(function (l) { return l.id !== id; });
      saveShop(this.shopCart);
      emit("shop", this.shopCart);
    },
    shopClear: function () { this.shopCart = []; saveShop(this.shopCart); emit("shop", this.shopCart); },
    shopCount: function () { return this.shopCart.reduce(function (n, l) { return n + l.qty; }, 0); },
    shopTotal: function () {
      return Math.round(this.shopCart.reduce(function (s, l) { return s + l.price * l.qty; }, 0) * 100) / 100;
    },

    cartTotals: function () {
      var subtotal = 0, tax = 0, total = 0, count = 0;
      this.cart.forEach(function (l) {
        var lineTotal = l.price * l.qty;              // precio con IVA incluido
        var lineSub = lineTotal / (1 + l.tax_rate);
        subtotal += lineSub;
        tax += lineTotal - lineSub;
        total += lineTotal;
        count += l.qty;
      });
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        count: count
      };
    }
  };

  window.STORE = STORE;
})();
