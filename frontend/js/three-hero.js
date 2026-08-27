/* =============================================================
   Hero 3D — tomos de manga / cartas / figuras flotando.
   Portadas REALES por tomo (MangaDex), variadas y sin repetir.
   Hover "Pop-Out Book": el tomo se abre suave (~123°) y las caras
   internas muestran ILUSTRACIÓN REAL en B&N dentro de paneles de
   manga. Se revierte suave al quitar el cursor.  window.HERO3D
   ============================================================= */
(function () {
  "use strict";

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  var S = {
    started: false, running: false, raf: 0,
    renderer: null, scene: null, camera: null, group: null, canvas: null,
    ray: null, mouse: null, lastHitAt: 0,
    hovered: null,        // pick mesh
    hoveredUnit: null,    // grupo del tomo o mesh plano
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    objs: [],             // unidades animadas (grupos de tomo + meshes planos)
    pick: [],             // objetivos de raycast
    usedCovers: {}        // urls de portada ya usadas (evita repetir)
  };

  /* Reparte por categoría (round-robin) para garantizar tomos + cartas + cajas. */
  function interleave(list, max) {
    var buckets = { manga: [], comics: [], tcg: [], figuras: [] };
    list.forEach(function (p) { (buckets[p.category] || (buckets.manga)).push(p); });
    var order = ["manga", "tcg", "figuras", "comics"];
    var out = [], i = 0;
    while (out.length < max && out.length < list.length) {
      var b = buckets[order[i % order.length]];
      if (b && b.length) out.push(b.shift());
      i++;
      if (i > max * 6) break;
    }
    return out;
  }

  function hashInt(s) {
    var h = 0; s = String(s);
    for (var i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  function mkTex(canvas, repeat) {
    var t = new THREE.CanvasTexture(canvas);
    if ("colorSpace" in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    return t;
  }

  /* ---- Canto de páginas apiladas (lateral del tomo) ---- */
  var _pageTex = null;
  function pageTexture() {
    if (_pageTex) return _pageTex;
    var c = document.createElement("canvas");
    c.width = 96; c.height = 512;
    var g = c.getContext("2d");
    g.fillStyle = "#efe9d8"; g.fillRect(0, 0, c.width, c.height);
    var grad = g.createLinearGradient(0, 0, c.width, 0);
    grad.addColorStop(0, "rgba(0,0,0,.14)");
    grad.addColorStop(0.12, "rgba(0,0,0,0)");
    grad.addColorStop(0.88, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,.16)");
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    var tones = ["#ded7c1", "#cfc6ac", "#c0b696", "#b4a988"];
    var y = 0;
    while (y < c.height) {
      var step = 2 + Math.random() * 3;
      g.strokeStyle = tones[(Math.random() * tones.length) | 0];
      g.lineWidth = Math.random() < 0.15 ? 1.6 : 0.8;
      g.beginPath();
      g.moveTo(0, y + (Math.random() - 0.5));
      g.lineTo(c.width, y + (Math.random() - 0.5));
      g.stroke();
      y += step;
    }
    _pageTex = mkTex(c, true);
    return _pageTex;
  }

  /* ---- Portada real dentro de un marco de tinta (cara frontal del tomo) ---- */
  function frameCover(img) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 700;
    var g = c.getContext("2d");
    g.fillStyle = "#efe9d8"; g.fillRect(0, 0, 512, 700);
    if (img && img.complete && img.naturalWidth) {
      var s = Math.max(512 / img.naturalWidth, 700 / img.naturalHeight);
      var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      g.drawImage(img, (512 - dw) / 2, (700 - dh) / 2, dw, dh);
    }
    g.strokeStyle = "#0c0c0e"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 686);
    return mkTex(c);
  }

  /* ---- Doble página interior: ILUSTRACIÓN REAL (B&N) en paneles de manga ---- */
  function mangaPanels(img, seed, isLeft) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 640;
    var g = c.getContext("2d");
    g.fillStyle = "#f2efe4"; g.fillRect(0, 0, 512, 640);
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    var m = 22;
    var panels = isLeft
      ? [[m, m, 512 - m * 2, 240], [m, m + 258, 232, 330], [m + 248, m + 258, 512 - m * 2 - 248, 330]]
      : [[m, m, 232, 236], [m + 248, m, 512 - m * 2 - 248, 236], [m, m + 254, 512 - m * 2, 338]];

    panels.forEach(function (P, pi) {
      var x = P[0], y = P[1], w = P[2], h = P[3];
      g.save();
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      if (img && img.complete && img.naturalWidth) {
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var zoom = 1.1 + rnd() * 1.0;
        var sw = iw / zoom, sh = ih / zoom;
        var sx = (iw - sw) * (0.1 + 0.8 * rnd());
        var sy = Math.min((ih - sh) * (0.04 + 0.55 * rnd() + pi * 0.1), ih - sh);
        try { g.filter = "grayscale(1) contrast(1.45) brightness(1.03)"; } catch (e) {}
        g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
        g.filter = "none";
      } else {
        g.fillStyle = "#14141a"; g.fillRect(x, y, w, h);
      }
      // trama de semitono
      g.fillStyle = "rgba(12,12,14,.13)";
      for (var yy = y + h * 0.45; yy < y + h; yy += 8)
        for (var xx = x; xx < x + w; xx += 8) { g.beginPath(); g.arc(xx, yy, 1.5, 0, 7); g.fill(); }
      g.restore();
      g.lineWidth = 7; g.strokeStyle = "#0c0c0e"; g.strokeRect(x, y, w, h);
    });

    // Globo de diálogo sobre el panel grande
    var big = panels[panels.length - 1];
    var bx = big[0] + big[2] * 0.5, by = big[1] + 44, bw = Math.min(big[2] * 0.6, 240), bh = 66;
    g.fillStyle = "#fff"; g.strokeStyle = "#0c0c0e"; g.lineWidth = 4;
    g.beginPath(); g.ellipse(bx, by, bw / 2, bh / 2, 0, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 3;
    for (var l = 0; l < 3; l++) { g.beginPath(); g.moveTo(bx - bw / 2 + 14, by - 14 + l * 12); g.lineTo(bx + bw / 2 - 14, by - 14 + l * 12); g.stroke(); }

    // Barra de título
    g.fillStyle = "#0c0c0e"; g.fillRect(m, 640 - 60, 512 - m * 2, 40);
    g.fillStyle = "#ffd400"; g.textAlign = "left"; g.textBaseline = "middle";
    g.font = "700 20px Bangers, Anton, 'Arial Black', sans-serif";
    g.fillText(isLeft ? "GEEKPOINT MANGA" : "MANGA INK EDITION", m + 14, 640 - 40);
    g.fillStyle = "#0c0c0e"; g.font = "600 16px 'JetBrains Mono', monospace";
    g.textAlign = isLeft ? "left" : "right";
    g.fillText(isLeft ? "42" : "43", isLeft ? m + 2 : 512 - m - 2, 32);

    return mkTex(c);
  }

  /* ---- Contraportada con la marca ---- */
  var _backTex = null;
  function backTexture() {
    if (_backTex) return _backTex;
    var c = document.createElement("canvas");
    c.width = 512; c.height = 700;
    var g = c.getContext("2d");
    g.fillStyle = "#0c0c0e"; g.fillRect(0, 0, 512, 700);
    g.fillStyle = "#ffd400"; g.fillRect(36, 270, 440, 140);
    g.fillStyle = "#0c0c0e";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "900 92px Bangers, 'Arial Black', sans-serif";
    g.fillText("GEEKPOINT", 256, 340);
    g.fillStyle = "#efe9d8";
    g.font = "700 20px 'JetBrains Mono', monospace";
    g.fillText("MANGA INK EDITION", 256, 452);
    var x = 110; g.fillStyle = "#efe9d8";
    while (x < 402) { var bw = 2 + ((x * 7) % 6); g.fillRect(x, 560, bw, 76); x += bw + 3 + ((x * 3) % 4); }
    g.strokeStyle = "#ffd400"; g.lineWidth = 8; g.strokeRect(14, 14, 484, 672);
    _backTex = mkTex(c);
    return _backTex;
  }

  /* =============================================================
     Construcción de piezas
     ============================================================= */

  /* Elige la portada de un tomo REAL, sin repetir entre piezas del hero. */
  function pickCoverUrl(product) {
    var vc = (product.volume_covers || []).slice();
    if (vc.length) {
      for (var j = vc.length - 1; j > 0; j--) {
        var k = (Math.random() * (j + 1)) | 0, tmp = vc[j]; vc[j] = vc[k]; vc[k] = tmp;
      }
      for (var m = 0; m < vc.length; m++) {
        if (!S.usedCovers[vc[m].url]) { S.usedCovers[vc[m].url] = 1; return { url: vc[m].url, v: vc[m].v }; }
      }
      return { url: vc[0].url, v: vc[0].v };
    }
    return { url: (window.Catalog && Catalog.coverURL(product)) || "", v: null };
  }

  function makeTome(product) {
    var W = 1.5, H = 2.15, D = 0.30, CT = 0.05;
    var tome = new THREE.Group();
    var seed = hashInt(product.id);

    var pageR = pageTexture().clone(); pageR.needsUpdate = true; pageR.repeat.set(1, 1);
    var pageT = pageTexture().clone(); pageT.needsUpdate = true; pageT.repeat.set(1, 3);
    var spine = new THREE.MeshStandardMaterial({ color: new THREE.Color(product.accent || "#ffd400"), roughness: .5 });

    // Caras interiores: se rellenan con ILUSTRACIÓN REAL al cargar la imagen.
    var rightPage = new THREE.MeshStandardMaterial({ color: "#17171d", roughness: .9 });
    var leftPage = new THREE.MeshStandardMaterial({ color: "#17171d", roughness: .9 });

    var body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [
      new THREE.MeshStandardMaterial({ map: pageR, color: "#fff", roughness: .95 }), // +X canto
      spine,                                                                          // -X lomo
      new THREE.MeshStandardMaterial({ map: pageT, color: "#fff", roughness: .95 }), // +Y
      new THREE.MeshStandardMaterial({ map: pageT.clone(), color: "#fff", roughness: .95 }), // -Y
      rightPage,                                                                      // +Z página derecha
      new THREE.MeshStandardMaterial({ map: backTexture(), color: "#fff", roughness: .85 }) // -Z contraportada marca
    ]);
    tome.add(body);

    var pivot = new THREE.Group();
    pivot.position.set(-W / 2, 0, D / 2 + 0.001);
    tome.add(pivot);

    var coverFront = new THREE.MeshStandardMaterial({ color: "#cfc8b6", roughness: .55 });
    coverFront.emissive = new THREE.Color(product.accent || "#ffd400");
    coverFront.emissiveIntensity = 0;
    var cover = new THREE.Mesh(new THREE.BoxGeometry(W, H, CT), [
      spine, spine, spine, spine,
      coverFront,   // +Z portada real del tomo
      leftPage      // -Z página izquierda interior
    ]);
    cover.position.set(W / 2, 0, 0);
    pivot.add(cover);

    // Portada REAL del tomo (MangaDex) — variada y sin repetir. Sin sellos.
    var picked = pickCoverUrl(product);
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      coverFront.map = frameCover(img); coverFront.color.set("#fff"); coverFront.needsUpdate = true;
      rightPage.map = mangaPanels(img, seed, false); rightPage.color.set("#fff"); rightPage.needsUpdate = true;
      leftPage.map = mangaPanels(img, seed + 7, true); leftPage.color.set("#fff"); leftPage.needsUpdate = true;
    };
    img.onerror = function () { /* materiales base se quedan */ };
    img.src = picked.url;

    body.userData.owner = tome;
    tome.userData = {
      product: product, type: "tome",
      pivot: pivot, coverFront: coverFront, body: body, vol: picked.v
    };
    S.pick.push(body);
    return tome;
  }

  function makeFlat(product, kind) {
    var dims = kind === "card" ? [1.5, 2.1, 0.05] : [1.85, 1.95, 0.95];
    var accent = new THREE.Color(product.accent || "#ffd400");
    var front = new THREE.MeshStandardMaterial({ color: "#cfc8b6", roughness: .55 });
    front.emissive = accent.clone(); front.emissiveIntensity = 0;
    var side = new THREE.MeshStandardMaterial({ color: accent, roughness: .5 });
    var edge = new THREE.MeshStandardMaterial({ color: "#e9e4d5", roughness: .9 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(dims[0], dims[1], dims[2]),
      [side, side, edge, edge, front, new THREE.MeshStandardMaterial({ color: "#15151a", roughness: .8 })]);

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      front.map = frameCover(img); front.color.set("#fff"); front.needsUpdate = true;
    };
    img.src = pickCoverUrl(product).url;

    mesh.userData.owner = mesh;
    mesh.userData.product = product;
    mesh.userData.type = "flat";
    mesh.userData.coverFront = front;
    S.pick.push(mesh);
    return mesh;
  }

  /* =============================================================
     Ciclo de vida
     ============================================================= */

  function start(canvas) {
    if (S.started || !canvas || typeof THREE === "undefined" || !hasWebGL() || !window.Catalog) return;
    S.canvas = canvas; S.started = true; S.usedCovers = {};

    var isMobile = window.innerWidth < 900 || /Mobi|Android/i.test(navigator.userAgent);
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true });
    } catch (err) {
      S.started = false;
      console.warn("[HERO3D] WebGL no disponible:", err && err.message);
      return;
    }
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, ratio(canvas), 0.1, 100);
    camera.position.set(0, 0, 13);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    var k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(4, 6, 8); scene.add(k);
    var rim = new THREE.PointLight(0x00e5ff, 60, 40); rim.position.set(-8, -3, 6); scene.add(rim);
    var rim2 = new THREE.PointLight(0xffd400, 50, 40); rim2.position.set(9, 5, 4); scene.add(rim2);

    var group = new THREE.Group();
    scene.add(group);

    var products = window.Catalog.all();
    if (!products.length) products = ((window.__BRAND__ || {}).fallbackCatalog || []);
    var pick = interleave(products, isMobile ? 9 : 16);

    pick.forEach(function (p, i) {
      var kind = p.category === "tcg" ? "card" : (p.category === "figuras" ? "box" : "tome");
      var unit = kind === "tome" ? makeTome(p) : makeFlat(p, kind);

      var ring = 4.0 + (i % 4) * 2.15;
      var ang = (i / pick.length) * Math.PI * 2 + 0.35;
      var px = Math.cos(ang) * ring + (Math.random() - .5) * 1.4;
      var py = (Math.random() - .5) * 7.2;
      var pz = Math.sin(ang) * ring - 3.0 + (Math.random() - .5) * 1.4;
      unit.position.set(px, py, pz);

      var ry = (Math.random() - .5) * 0.32;
      unit.rotation.set((Math.random() - .5) * 0.14, ry, (Math.random() - .5) * 0.1);

      unit.userData.base = { px: px, py: py, pz: pz, rx: unit.rotation.x, ry: ry, rz: unit.rotation.z };
      unit.userData.floatPhase = Math.random() * Math.PI * 2;
      unit.userData.floatAmp = 0.2 + Math.random() * 0.34;
      unit.userData.wobble = 0.04 + Math.random() * 0.05;
      unit.userData.hoverAmt = 0;
      unit.userData.hoverTarget = 0;
      group.add(unit);
      S.objs.push(unit);
    });

    S.renderer = renderer; S.scene = scene; S.camera = camera; S.group = group;
    S.ray = new THREE.Raycaster(); S.mouse = new THREE.Vector2(-2, -2);

    window.addEventListener("resize", onResize, { passive: true });
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", function () { S.mouse.set(-2, -2); });
    canvas.addEventListener("click", onClick);
    canvas.style.cursor = "grab";

    resume();
  }

  function ratio(c) { return (c.clientWidth || innerWidth) / Math.max(1, c.clientHeight || innerHeight); }
  function onResize() {
    if (!S.renderer) return;
    S.renderer.setSize(S.canvas.clientWidth, S.canvas.clientHeight, false);
    S.camera.aspect = ratio(S.canvas);
    S.camera.updateProjectionMatrix();
  }
  function onMove(e) {
    var r = S.canvas.getBoundingClientRect();
    S.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    S.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  function setHover(pickMesh) {
    if (S.hovered === pickMesh) return;
    var oldUnit = S.hoveredUnit;
    if (oldUnit) oldUnit.userData.hoverTarget = 0;

    S.hovered = pickMesh;
    S.hoveredUnit = pickMesh ? pickMesh.userData.owner : null;
    S.canvas.style.cursor = pickMesh ? "pointer" : "grab";

    if (S.hoveredUnit) {
      S.hoveredUnit.userData.hoverTarget = 1;
    }
  }

  function onClick() {
    if (S.hoveredUnit && S.hoveredUnit.userData.product) {
      window.dispatchEvent(new CustomEvent("hero:pick", { detail: { id: S.hoveredUnit.userData.product.id } }));
    }
  }

  function tick() {
    if (!S.running) return;
    S.raf = requestAnimationFrame(tick);
    var now = performance.now();
    var t = now * 0.001;
    var sp = S.reduced ? 0.4 : 1;

    S.group.rotation.y += 0.0009 * sp;
    var gy = S.group.rotation.y;

    S.objs.forEach(function (u) {
      var d = u.userData, b = d.base;

      d.hoverAmt += (d.hoverTarget - d.hoverAmt) * 0.11;
      if (d.hoverAmt < 0.001) d.hoverAmt = 0;
      var e = d.hoverAmt;

      var floatY = Math.sin(t * 0.6 + d.floatPhase) * d.floatAmp * (S.reduced ? 0.4 : 1);
      u.position.y = b.py + floatY + e * 0.5;
      u.position.z = b.pz + e * 2.4;
      u.position.x = b.px;

      var wob = Math.sin(t * 0.3 + d.floatPhase) * d.wobble * (1 - e);
      u.rotation.y = -gy + b.ry + wob;
      u.rotation.x = b.rx * (1 - e);
      u.rotation.z = b.rz * (1 - e);

      var s = 1 + e * 0.12;
      u.scale.set(s, s, s);

      if (d.type === "tome") {
        // apertura suave de la cubierta (depth-mesh interpolation)
        var openMax = S.reduced ? -0.95 : -2.15;
        d.pivot.rotation.y = e * openMax;
        d.coverFront.emissiveIntensity = e * 0.25;
      } else if (d.coverFront) {
        d.coverFront.emissiveIntensity = e * 0.5;
      }
    });

    // raycast con histéresis
    if (S.mouse.x > -1.5) {
      S.ray.setFromCamera(S.mouse, S.camera);
      var hit = S.ray.intersectObjects(S.pick, false)[0];
      if (hit) { setHover(hit.object); S.lastHitAt = now; }
      else if (S.hovered && now - (S.lastHitAt || 0) > 150) setHover(null);
    } else if (S.hovered) {
      setHover(null);
    }

    S.renderer.render(S.scene, S.camera);
  }

  function resume() {
    if (!S.started || S.running || !S.canvas || !S.canvas.isConnected) return;
    S.running = true; S.raf = requestAnimationFrame(tick);
  }
  function stop() { S.running = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }
  function destroy() {
    stop();
    window.removeEventListener("resize", onResize);
    if (S.renderer) { try { S.renderer.dispose(); } catch (e) {} }
    S.started = false; S.hovered = null; S.hoveredUnit = null;
    S.objs = []; S.pick = []; S.usedCovers = {};
    S.renderer = S.scene = S.camera = S.group = S.canvas = null;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else resume();
  });

  window.HERO3D = { start: start, stop: stop, resume: resume, destroy: destroy, hasWebGL: hasWebGL, pageTexture: pageTexture, backTexture: backTexture };
})();
