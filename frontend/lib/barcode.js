/* =============================================================
   Code 128-B → SVG.  window.Barcode.code128svg(text, opts)
   Sin dependencias. Genera un código de barras escaneable por
   cualquier lector de POS. opts: { height, moduleWidth, showText }
   ============================================================= */
(function () {
  "use strict";

  // Anchos (bar/space, empieza en bar) por valor 0..106. STOP (106) = 7 módulos.
  var P = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ];
  var START_B = 104, STOP = 106;

  function encode(text) {
    var data = [];
    for (var i = 0; i < text.length; i++) {
      var v = text.charCodeAt(i) - 32;          // Code B: ASCII 32..126
      if (v < 0 || v > 94) v = 0;               // fuera de rango -> espacio
      data.push(v);
    }
    var sum = START_B;
    for (var k = 0; k < data.length; k++) sum += data[k] * (k + 1);
    var check = sum % 103;
    return [START_B].concat(data, [check, STOP]);
  }

  function code128svg(text, opts) {
    opts = opts || {};
    text = String(text == null ? "" : text);
    var mw = opts.moduleWidth || 2;
    var h = opts.height || 70;
    var showText = opts.showText !== false;
    var quiet = 10;                             // zona muda (módulos)
    var codes = encode(text);

    var x = quiet * mw;
    var rects = "";
    for (var c = 0; c < codes.length; c++) {
      var widths = P[codes[c]];
      for (var j = 0; j < widths.length; j++) {
        var w = parseInt(widths[j], 10) * mw;
        if (j % 2 === 0) {                      // posiciones pares = barra
          rects += '<rect x="' + x + '" y="0" width="' + w + '" height="' + h + '"/>';
        }
        x += w;
      }
    }
    var totalW = x + quiet * mw;
    var fullH = h + (showText ? 22 : 0);

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalW + '" height="' + fullH +
      '" viewBox="0 0 ' + totalW + ' ' + fullH + '" role="img" aria-label="Código de barras ' + esc(text) + '">' +
      '<rect width="' + totalW + '" height="' + fullH + '" fill="#ffffff"/>' +
      '<g fill="#0c0c0e">' + rects + '</g>' +
      (showText ? '<text x="' + (totalW / 2) + '" y="' + (h + 17) +
        '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" letter-spacing="2" fill="#0c0c0e">' +
        esc(text) + '</text>' : "") +
      '</svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.Barcode = {
    code128svg: code128svg,
    /** data-URI lista para <img src>. */
    code128dataURI: function (text, opts) {
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(code128svg(text, opts));
    }
  };
})();
