/* =============================================================
   Servicio de búsqueda de FIGURAS.  window.FigureAPI
   Fuente: proxy PHP  GET /api/figures/search?q=...
   (AmiAmi con respaldo a un catálogo local curado).

   - search({ name })          -> Promise<[figure]>
   - suggestedPriceMXN(figure)  -> number|null
   - toProductDraft(fig, stockByBranch) -> objeto para POST /products/import
   ============================================================= */
(function () {
  "use strict";

  // Tipo de cambio aproximado JPY -> MXN para el precio sugerido de AmiAmi.
  var JPY_MXN = 0.13;

  function get(path) {
    if (!window.API || !API.base) return Promise.reject(new Error("API no disponible"));
    return API.get(path, { noAuthRedirect: true });
  }

  function normalize(f) {
    f = f || {};
    var apiBase = (window.__CONFIG__ || {}).apiBase || "";
    var img = f.image_url || "";
    // Portada generada del respaldo local: relativa -> absoluta (mismo origen).
    if (img && !/^https?:|^data:/.test(img) && apiBase) {
      img = apiBase.replace(/\/+$/, "") + "/" + img.replace(/^\/+/, "");
    }
    var priceMXN = f.price_mxn != null
      ? Number(f.price_mxn)
      : (f.price_jpy != null ? Math.round(Number(f.price_jpy) * JPY_MXN) : null);
    return {
      external_id: String(f.external_id || ""),
      name: f.name || "",
      manufacturer: f.manufacturer || "",
      scale: f.scale || "",
      image_url: img,
      priceMXN: priceMXN,
      source: f.source || "figure"
    };
  }

  function search(opts) {
    opts = opts || {};
    var name = (opts.name || "").trim();
    if (name.length < 2) return Promise.resolve({ items: [], source: "none" });
    return get("figures/search?q=" + encodeURIComponent(name)).then(function (d) {
      return {
        items: (d && d.items || []).map(normalize),
        source: (d && d.source) || "figure"
      };
    });
  }

  function suggestedPriceMXN(fig) {
    return fig && fig.priceMXN != null ? fig.priceMXN : null;
  }

  /** SKU legible y estable:  FIG-<MARCA3>-<SLUG>. */
  function skuFor(fig) {
    var maker = (fig.manufacturer || "FIG").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "FIG";
    var slug = String(fig.name || fig.external_id || "x")
      .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 24);
    return ("FIG-" + maker + "-" + slug).slice(0, 40);
  }

  /**
   * Borrador de producto GeekPoint (categoría figuras).
   * description = "<Fabricante> · <Escala> · <detalle>"  (lo parsea el backend).
   * `stockByBranch` = { branchId: cantidad }.
   */
  function toProductDraft(fig, stockByBranch) {
    var bits = [];
    if (fig.manufacturer) bits.push(fig.manufacturer);
    if (fig.scale) bits.push(fig.scale);
    bits.push("Figura de colección");
    return {
      source: "figure:" + (fig.source || "amiami"),
      external_id: fig.external_id,
      sku: skuFor(fig),
      name: (fig.name || "").slice(0, 180),
      category_slug: "figuras",
      price: suggestedPriceMXN(fig) || 0,
      image_url: fig.image_url || "",
      description: bits.join(" · ").slice(0, 500),
      manufacturer: fig.manufacturer || "",
      scale: fig.scale || "",
      stock_by_branch: stockByBranch || {}
    };
  }

  window.FigureAPI = {
    search: search,
    suggestedPriceMXN: suggestedPriceMXN,
    skuFor: skuFor,
    toProductDraft: toProductDraft
  };
})();
