/* =============================================================
   GeekPoint — datos de marca + catálogo de respaldo.
   Un solo global: window.__BRAND__
   El catálogo real llega de /api/catalog (Jikan/MyAnimeList).
   Esta lista se usa si el servidor no responde.
   ============================================================= */
(function () {
  "use strict";

  window.__BRAND__ = {
    name: "GeekPoint",
    slogan: { es: "Tu Portal Coleccionable & Sistema POS Multi-Sede",
              en: "Your Collectibles Portal & Multi-Branch POS System" },

    categories: [
      { slug: "manga",    icon: "📚" },
      { slug: "figuras",  icon: "🗿" },
      { slug: "tcg",      icon: "🃏" },
      { slug: "comics",   icon: "💥" },
      { slug: "preventa", icon: "🔥" }
    ],

    branches: [
      {
        code: "GKP-CDMX", name: "GeekPoint Reforma", status: "active",
        city: "Ciudad de México", address: "Av. Paseo de la Reforma 222, Local 14",
        phone: "55 5512 8890", hours: "Lun–Dom 11:00–21:00"
      },
      {
        code: "GKP-GDL", name: "GeekPoint Chapultepec", status: "active",
        city: "Guadalajara, Jalisco", address: "Av. Chapultepec Sur 480",
        phone: "33 3615 4021", hours: "Lun–Sáb 11:00–20:00"
      },
      {
        code: "GKP-MTY", name: "GeekPoint Valle", status: "active",
        city: "Monterrey, Nuevo León", address: "Av. San Pedro 1000, Plaza Fiesta",
        phone: "81 8342 7715", hours: "Lun–Dom 11:00–21:00"
      }
    ],

    // Catálogo de respaldo (sin red). Portadas = arte "manga ink" generado.
    fallbackCatalog: [
      { id: "manga-1", title: "Jujutsu Kaisen",   author: "Gege Akutami",    category: "manga",   price: 189, tags: ["novedad"], volumes: 27, accent: "#8b5bff",
        synopsis: "Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones." },
      { id: "manga-2", title: "Chainsaw Man",      author: "Tatsuki Fujimoto", category: "manga",  price: 179, tags: ["novedad"], volumes: 17, accent: "#ff2d95",
        synopsis: "Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública." },
      { id: "manga-3", title: "One Piece",         author: "Eiichiro Oda",    category: "manga",   price: 165, tags: [], volumes: 108, accent: "#00e5ff",
        synopsis: "Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas." },
      { id: "manga-4", title: "Demon Slayer",      author: "Koyoharu Gotouge", category: "manga",  price: 159, tags: [], volumes: 23, accent: "#0b8a3d",
        synopsis: "Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko." },
      { id: "manga-5", title: "Spy x Family",      author: "Tatsuya Endo",    category: "manga",   price: 179, tags: [], volumes: 13, accent: "#ffd400",
        synopsis: "Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra." },
      { id: "manga-6", title: "Dandadan",          author: "Yukinobu Tatsu",  category: "manga",   price: 175, tags: ["preventa"], volumes: 15, accent: "#00e5ff",
        synopsis: "Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales." },
      { id: "manga-7", title: "Oshi no Ko",        author: "Aka Akasaka",     category: "manga",   price: 179, tags: ["preventa"], volumes: 14, accent: "#ff2d95",
        synopsis: "Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento." },
      { id: "manga-8", title: "Blue Lock",         author: "Muneyuki Kaneshiro", category: "manga", price: 169, tags: [], volumes: 27, accent: "#8b5bff",
        synopsis: "300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés." },
      { id: "manga-9", title: "Berserk",           author: "Kentaro Miura",   category: "manga",   price: 349, tags: [], volumes: 42, accent: "#e4002b",
        synopsis: "Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios." },
      { id: "manga-10", title: "Vinland Saga",     author: "Makoto Yukimura", category: "manga",   price: 229, tags: [], volumes: 28, accent: "#0b8a3d",
        synopsis: "Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos." },
      { id: "comics-1", title: "JoJo's Bizarre Adventure", author: "Hirohiko Araki", category: "comics", price: 299, tags: [], volumes: 8, accent: "#ffd400",
        synopsis: "La saga de la familia Joestar contra fuerzas sobrenaturales a lo largo de generaciones y continentes." },
      { id: "comics-2", title: "Invincible",       author: "Robert Kirkman",  category: "comics",  price: 329, tags: [], volumes: 25, accent: "#00e5ff",
        synopsis: "Mark Grayson hereda los poderes de su padre, el superhéroe más poderoso del planeta… y su terrible secreto." },
      { id: "figuras-1", title: "Gojo Satoru — Figura 1/7", author: "GeekPoint Collection", category: "figuras", price: 2490, tags: ["preventa"], accent: "#8b5bff",
        synopsis: "Escala 1/7, PVC pintado a mano, 27 cm. Incluye efecto de Infinito y base temática." },
      { id: "figuras-2", title: "Power — Figura S.H.F.", author: "GeekPoint Collection", category: "figuras", price: 1890, tags: [], accent: "#ff2d95",
        synopsis: "Figura articulada de 16 cm con accesorios intercambiables y hacha de sangre." },
      { id: "figuras-3", title: "Nezuko — Figura 1/8", author: "GeekPoint Collection", category: "figuras", price: 1690, tags: [], accent: "#ff2d95",
        synopsis: "Escala 1/8, 21 cm, con caja de bambú y pose de combate en modo demonio." },
      { id: "tcg-1", title: "Pokémon TCG — Elite Trainer Box", author: "The Pokémon Company", category: "tcg", price: 1290, tags: ["novedad"], accent: "#ffd400",
        synopsis: "Caja con 9 sobres, 65 fundas, 45 cartas de Energía, dados y contadores de daño." },
      { id: "tcg-2", title: "One Piece TCG — Booster Box", author: "Bandai", category: "tcg", price: 1490, tags: [], accent: "#e4002b",
        synopsis: "Caja sellada con 24 sobres del set más reciente. Ideal para draft y coleccionismo." },
      { id: "tcg-3", title: "Magic — Bundle", author: "Wizards of the Coast", category: "tcg", price: 1190, tags: [], accent: "#8b5bff",
        synopsis: "9 sobres de Colección, 20 tierras foil, caja de almacenamiento y contador giratorio." }
    ]
  };
})();
