/* =============================================================
   Servicio de búsqueda Pokémon TCG.  window.PokemonAPI
   Fuente: https://pokemontcg.io (API pública v2), consumida a través
   del proxy PHP de GeekPoint  ->  GET /api/pokemon/cards  ·  /api/pokemon/sets
   (el proxy evita problemas de red/CORS y cachea la respuesta).

   - searchCards({ name, setId, page, pageSize }) -> Promise<{cards,total,page,pageSize}>
   - listSets()                                  -> Promise<[{id,name,series,releaseDate}]>
   - marketPrice(card)                            -> number|null   (MXN aprox.)
   - toProductDraft(card, stockByBranch)         -> objeto para POST /products/import
   ============================================================= */
(function () {
  "use strict";

  // Tipo de cambio aproximado USD->MXN para el "precio de mercado sugerido".
  // Las cartas de pokemontcg.io vienen en USD; el catálogo GeekPoint es MXN.
  var USD_MXN = 20.0;

  var _setsCache = null;

  function get(path) {
    if (!window.API || !API.base) return Promise.reject(new Error("API no disponible"));
    return API.get(path, { noAuthRedirect: true });
  }

  /**
   * Busca cartas por nombre y/o set.
   * @param {{name?:string,setId?:string,page?:number,pageSize?:number}} opts
   */
  function searchCards(opts) {
    opts = opts || {};
    var name = (opts.name || "").trim();
    var setId = opts.setId || "";
    if (name.length < 2 && !setId) {
      return Promise.resolve({ cards: [], total: 0, page: 1, pageSize: 0 });
    }
    var page = Math.max(1, opts.page || 1);
    var pageSize = Math.min(60, Math.max(1, opts.pageSize || 24));

    var qs = "pokemon/cards?page=" + page + "&pageSize=" + pageSize;
    if (name) qs += "&name=" + encodeURIComponent(name);
    if (setId) qs += "&set=" + encodeURIComponent(setId);

    return get(qs).then(function (d) {
      return {
        cards: (d && d.data || []).map(normalize),
        total: (d && d.totalCount) || (d && d.data ? d.data.length : 0),
        page: (d && d.page) || page,
        pageSize: (d && d.pageSize) || pageSize
      };
    });
  }

  /** Lista de sets/expansiones (cacheada en memoria). */
  function listSets() {
    if (_setsCache) return Promise.resolve(_setsCache);
    return get("pokemon/sets").then(function (d) {
      _setsCache = (d && d.data || []).map(function (s) {
        return { id: s.id, name: s.name, series: s.series, releaseDate: s.releaseDate, total: s.total };
      });
      return _setsCache;
    }).catch(function () { return []; });
  }

  function normalize(c) {
    c = c || {};
    var img = c.images || {};
    var usd = bestMarketUSD(c);
    return {
      id: c.id,
      name: c.name || "",
      supertype: c.supertype || "",
      subtypes: c.subtypes || [],
      hp: c.hp || null,
      types: c.types || [],
      rarity: c.rarity || "",
      number: c.number || "",
      artist: c.artist || "",
      flavorText: c.flavorText || "",
      set: c.set ? { id: c.set.id, name: c.set.name, series: c.set.series, ptcgoCode: c.set.ptcgoCode } : null,
      image: img.large || img.small || "",
      imageSmall: img.small || img.large || "",
      tcgplayer: c.tcgplayer || null,
      cardmarket: c.cardmarket || null,
      marketUSD: usd,
      marketMXN: usd != null ? Math.round(usd * USD_MXN * 100) / 100 : null
    };
  }

  /** Mejor precio de mercado en USD a partir de tcgplayer.prices (o cardmarket). */
  function bestMarketUSD(card) {
    var tp = card && card.tcgplayer && card.tcgplayer.prices;
    if (tp) {
      var order = ["normal", "holofoil", "reverseHolofoil", "1stEditionHolofoil", "1stEditionNormal", "unlimitedHolofoil"];
      for (var i = 0; i < order.length; i++) {
        var p = tp[order[i]];
        if (p && (p.market || p.mid || p.low)) return p.market || p.mid || p.low;
      }
      for (var k in tp) {
        if (tp[k] && (tp[k].market || tp[k].mid || tp[k].low)) return tp[k].market || tp[k].mid || tp[k].low;
      }
    }
    var cm = card && card.cardmarket && card.cardmarket.prices;
    if (cm && (cm.trendPrice || cm.averageSellPrice)) return cm.trendPrice || cm.averageSellPrice;
    return null;
  }

  function marketPrice(card) {
    return card && card.marketMXN != null ? card.marketMXN : null;
  }

  /** SKU estable y legible: PKM-<SET>-<NUMERO>. */
  function skuFor(card) {
    var set = (card.set && (card.set.ptcgoCode || card.set.id)) || "PKM";
    var num = String(card.number || card.id || "").replace(/[^A-Za-z0-9]/g, "");
    return ("PKM-" + set + "-" + num).toUpperCase().slice(0, 40);
  }

  /**
   * Convierte una carta en un borrador de producto GeekPoint (categoría TCG).
   * `stockByBranch` = { branchId: cantidad }.
   */
  function toProductDraft(card, stockByBranch) {
    var setName = card.set ? card.set.name : "";
    var descBits = [];
    if (card.supertype) descBits.push(card.supertype);
    if (card.types && card.types.length) descBits.push(card.types.join("/"));
    if (card.rarity) descBits.push(card.rarity);
    if (setName) descBits.push(setName + (card.number ? " #" + card.number : ""));
    if (card.hp) descBits.push("HP " + card.hp);

    return {
      source: "pokemontcg",
      external_id: card.id,
      sku: skuFor(card),
      name: (card.name + (setName ? " · " + setName : "")).slice(0, 180),
      category_slug: "tcg",
      price: marketPrice(card) || 0,
      image_url: card.image || card.imageSmall || "",
      description: descBits.join(" · ").slice(0, 500),
      rarity: card.rarity || "",
      types: card.types || [],
      stock_by_branch: stockByBranch || {}
    };
  }

  window.PokemonAPI = {
    searchCards: searchCards,
    listSets: listSets,
    marketPrice: marketPrice,
    skuFor: skuFor,
    toProductDraft: toProductDraft
  };
})();
