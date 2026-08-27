/* =============================================================
   Hero 3D — tomos de manga / cartas / figuras flotando.
   Interacción estilo "Wii menu": al hacer hover el objeto brinca,
   gira 360° y proyecta resplandor neón.  window.HERO3D
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
    ray: null, mouse: null, hovered: null,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    objs: []
  };

  function tex(url, onLoad) {
    var t = new THREE.TextureLoader();
    t.setCrossOrigin("anonymous");
    return t.load(url, function (texture) {
      if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      if (onLoad) onLoad(texture);
    }, undefined, function () { /* textura falla → queda el color base */ });
  }

  /* Textura procedural de "hojas de papel apiladas" para los cantos del tomo. */
  var _pageTex = null;
  function pageTexture() {
    if (_pageTex) return _pageTex;
    var c = document.createElement("canvas");
    c.width = 96; c.height = 512;
    var g = c.getContext("2d");
    g.fillStyle = "#efe9d8"; g.fillRect(0, 0, c.width, c.height);
    // sombra suave de volumen
    var grad = g.createLinearGradient(0, 0, c.width, 0);
    grad.addColorStop(0, "rgba(0,0,0,.14)");
    grad.addColorStop(0.12, "rgba(0,0,0,0)");
    grad.addColorStop(0.88, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,.16)");
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    // líneas = cantos de las páginas
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
    _pageTex = new THREE.CanvasTexture(c);
    if ("colorSpace" in _pageTex && THREE.SRGBColorSpace) _pageTex.colorSpace = THREE.SRGBColorSpace;
    _pageTex.wrapS = _pageTex.wrapT = THREE.RepeatWrapping;
    _pageTex.anisotropy = 4;
    return _pageTex;
  }

  function makePiece(product, kind) {
    // dimensiones según tipo
    var dims = kind === "card" ? [1.5, 2.1, 0.05]
             : kind === "box"  ? [1.9, 2.0, 1.0]
             : [1.5, 2.15, 0.32]; // tomo
    var geo = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
    var accent = new THREE.Color(product.accent || "#ffd400");
    var paper = new THREE.Color("#e9e4d5");

    var isTome = kind !== "card" && kind !== "box";

    var spine = new THREE.MeshStandardMaterial({ color: accent, roughness: .5, metalness: .1 });
    var back = new THREE.MeshStandardMaterial({ color: "#15151a", roughness: .8 });
    var front = new THREE.MeshStandardMaterial({ color: "#cfc8b6", roughness: .55, metalness: .05 });
    front.emissive = accent.clone();
    front.emissiveIntensity = 0.0;

    // Cantos: hojas de papel para los tomos; papel liso para lo demás.
    function edgeMat(repV) {
      if (!isTome) return new THREE.MeshStandardMaterial({ color: paper, roughness: .9 });
      var t = pageTexture().clone();
      t.needsUpdate = true;
      t.repeat.set(1, repV || 1);
      return new THREE.MeshStandardMaterial({ map: t, color: "#ffffff", roughness: .95 });
    }
    var foreEdge = edgeMat(1);   // +X  canto (páginas sueltas)
    var head = edgeMat(3);       // +Y  cabeza
    var tail = edgeMat(3);       // -Y  pie

    // [+X, -X, +Y, -Y, +Z(frente), -Z(atrás)]
    var mats = [foreEdge, spine, head, tail, front, back];
    var mesh = new THREE.Mesh(geo, mats);

    tex(window.Catalog.coverURL(product), function (t) {
      front.map = t; front.color.set("#ffffff"); front.needsUpdate = true;
    });

    mesh.userData = { product: product, front: front, accent: accent };
    return mesh;
  }

  function start(canvas) {
    if (S.started || !canvas || typeof THREE === "undefined" || !hasWebGL() || !window.Catalog) return;
    S.canvas = canvas; S.started = true;

    var isMobile = window.innerWidth < 900 || /Mobi|Android/i.test(navigator.userAgent);
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true });
    } catch (err) {
      // Sin contexto WebGL (GPU deshabilitada, etc.) → el hero queda con su fondo ink.
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
    var pick = products.slice(0, isMobile ? 7 : 11);

    pick.forEach(function (p, i) {
      var kind = p.category === "tcg" ? "card" : (p.category === "figuras" ? "box" : "tome");
      var m = makePiece(p, kind);
      var ring = 3.6 + (i % 3) * 2.5;
      var ang = (i / pick.length) * Math.PI * 2 + 0.4;
      var px = Math.cos(ang) * ring + (Math.random() - .5) * 1.6;
      var py = (Math.random() - .5) * 6.5;
      var pz = Math.sin(ang) * ring - 2.5 + (Math.random() - .5) * 1.6;
      m.position.set(px, py, pz);
      m.rotation.set((Math.random() - .5) * .5, (Math.random() - .5) * 1.2, (Math.random() - .5) * .3);
      m.userData.base = { px: px, py: py, pz: pz, rx: m.rotation.x, ry: m.rotation.y, rz: m.rotation.z };
      m.userData.floatPhase = Math.random() * Math.PI * 2;
      m.userData.floatAmp = 0.25 + Math.random() * 0.4;
      m.userData.spin = (Math.random() - .5) * 0.004;
      group.add(m);
      S.objs.push(m);
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

  function setHover(mesh) {
    if (S.hovered === mesh) return;
    // salir del anterior
    if (S.hovered) {
      var o = S.hovered, b = o.userData.base;
      if (window.gsap) {
        gsap.killTweensOf([o.position, o.rotation, o.scale, o.userData.front]);
        gsap.to(o.position, { x: b.px, y: b.py, z: b.pz, duration: .6, ease: "power3.out",
          onComplete: function () { o.userData.hover = false; } });
        gsap.to(o.rotation, { x: b.rx, y: b.ry, z: b.rz, duration: .6, ease: "power3.out" });
        gsap.to(o.scale, { x: 1, y: 1, z: 1, duration: .5, ease: "power2.out" });
        gsap.to(o.userData.front, { emissiveIntensity: 0, duration: .5 });
      } else { o.userData.hover = false; }
    }
    S.hovered = mesh;
    S.canvas.style.cursor = mesh ? "pointer" : "grab";
    if (mesh) {
      mesh.userData.hover = true;
      var b2 = mesh.userData.base;
      if (window.gsap) {
        gsap.killTweensOf([mesh.position, mesh.rotation, mesh.scale, mesh.userData.front]);
        gsap.to(mesh.position, { z: b2.pz + 2.4, y: b2.py + 0.5, duration: .45, ease: "back.out(2)" });
        gsap.to(mesh.rotation, { y: b2.ry + Math.PI * 2, x: 0, z: 0, duration: .75, ease: "power2.inOut" });
        gsap.to(mesh.scale, { x: 1.18, y: 1.18, z: 1.18, duration: .4, ease: "back.out(2.5)" });
        gsap.to(mesh.userData.front, { emissiveIntensity: 0.55, duration: .35 });
      }
    }
  }

  function onClick() {
    if (S.hovered && S.hovered.userData.product) {
      window.dispatchEvent(new CustomEvent("hero:pick", { detail: { id: S.hovered.userData.product.id } }));
    }
  }

  function tick() {
    if (!S.running) return;
    S.raf = requestAnimationFrame(tick);
    var t = performance.now() * 0.001;
    var sp = S.reduced ? 0.4 : 1;

    S.group.rotation.y += 0.0012 * sp;

    S.objs.forEach(function (m) {
      if (m.userData.hover) return;
      var u = m.userData, b = u.base;
      m.position.y = b.py + Math.sin(t * 0.6 + u.floatPhase) * u.floatAmp * (S.reduced ? .4 : 1);
      m.rotation.y = b.ry + Math.sin(t * 0.3 + u.floatPhase) * 0.15 + u.spin * 60;
    });

    // raycast hover
    if (S.mouse.x > -1.5) {
      S.ray.setFromCamera(S.mouse, S.camera);
      var hit = S.ray.intersectObjects(S.objs, false)[0];
      setHover(hit ? hit.object : null);
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
    S.started = false; S.hovered = null; S.objs = [];
    S.renderer = S.scene = S.camera = S.group = S.canvas = null;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else resume();
  });

  window.HERO3D = { start: start, stop: stop, resume: resume, destroy: destroy, hasWebGL: hasWebGL, pageTexture: pageTexture };
})();
