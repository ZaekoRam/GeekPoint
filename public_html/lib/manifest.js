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
        phone: "33 3615 4021", hours: "Lun–Sáb 11:00–21:00 · Dom 12:00–19:00"
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
      { id: "manga-11", title: "Attack on Titan",  author: "Hajime Isayama",  category: "manga",   price: 169, tags: [], volumes: 34, tomos: 34, accent: "#7a5c3e",
        synopsis: "La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos." },
      { id: "manga-12", title: "Naruto",            author: "Masashi Kishimoto", category: "manga", price: 155, tags: [], volumes: 72, accent: "#ffd400",
        synopsis: "Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea." },
      { id: "manga-13", title: "Bleach",            author: "Tite Kubo",       category: "manga",   price: 159, tags: [], volumes: 74, accent: "#00e5ff",
        synopsis: "Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos." },
      { id: "manga-14", title: "Fullmetal Alchemist", author: "Hiromu Arakawa", category: "manga", price: 189, tags: [], volumes: 27, accent: "#e4002b",
        synopsis: "Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida." },
      { id: "manga-15", title: "Death Note",        author: "Tsugumi Ohba",    category: "manga",   price: 149, tags: [], volumes: 12, accent: "#8b5bff",
        synopsis: "Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios." },
      { id: "manga-16", title: "Tokyo Ghoul",       author: "Sui Ishida",      category: "manga",   price: 165, tags: [], volumes: 14, accent: "#ff2d95",
        synopsis: "Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos." },
      { id: "manga-17", title: "My Hero Academia",  author: "Kohei Horikoshi", category: "manga",   price: 165, tags: [], volumes: 40, accent: "#0b8a3d",
        synopsis: "En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno." },
      { id: "manga-18", title: "Hunter x Hunter",   author: "Yoshihiro Togashi", category: "manga",  price: 159, tags: [], volumes: 37, accent: "#0b8a3d",
        synopsis: "Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen." },
      { id: "manga-19", title: "Haikyu!!",          author: "Haruichi Furudate", category: "manga", price: 155, tags: [], volumes: 45, accent: "#ffd400",
        synopsis: "Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto." },
      { id: "manga-20", title: "Kaguya-sama: Love is War", author: "Aka Akasaka", category: "manga", price: 169, tags: [], volumes: 28, accent: "#ff2d95",
        synopsis: "Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota." },
      { id: "manga-21", title: "Frieren: Beyond Journey's End", author: "Kanehito Yamada", category: "manga", price: 175, tags: ["preventa"], volumes: 13, accent: "#00e5ff",
        synopsis: "La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían." },
      { id: "comics-1", title: "JoJo's Bizarre Adventure", author: "Hirohiko Araki", category: "comics", price: 299, tags: [], volumes: 8, accent: "#ffd400",
        synopsis: "La saga de la familia Joestar contra fuerzas sobrenaturales a lo largo de generaciones y continentes." },
      { id: "comics-2", title: "Invincible",       author: "Robert Kirkman",  category: "comics",  price: 329, tags: [], volumes: 25, accent: "#00e5ff",
        synopsis: "Mark Grayson hereda los poderes de su padre, el superhéroe más poderoso del planeta… y su terrible secreto." },
      { id: "comics-3", title: "Solo Leveling",     author: "Chugong",         category: "comics",  price: 259, tags: ["novedad"], volumes: 12, accent: "#8b5bff",
        synopsis: "El cazador más débil de la humanidad, Sung Jin-Woo, obtiene un sistema que le permite subir de nivel sin límite." },
      { id: "comics-4", title: "Tower of God",      author: "SIU",             category: "comics",  price: 269, tags: [], volumes: 10, accent: "#00e5ff",
        synopsis: "Bam entra a una torre infinita para alcanzar a Rachel, la única persona que conoció, y enfrenta una prueba en cada piso." },
      { id: "comics-5", title: "The God of High School", author: "Yongje Park", category: "comics", price: 249, tags: [], volumes: 12, accent: "#e4002b",
        synopsis: "Un torneo de artes marciales entre preparatorianos esconde una guerra por el poder de los dioses." },
      { id: "comics-6", title: "Batman: Year One",  author: "Frank Miller",    category: "comics",  price: 349, tags: [], volumes: 1, accent: "#ffd400",
        synopsis: "El primer año de Bruce Wayne como Batman y el de Jim Gordon en una Gotham podrida hasta los cimientos." },
      { id: "comics-7", title: "The Sandman",       author: "Neil Gaiman",     category: "comics",  price: 389, tags: [], volumes: 10, accent: "#8b5bff",
        synopsis: "Sueño, uno de los Eternos, escapa tras 70 años de cautiverio y debe reconstruir su reino y enmendar sus errores." },
      { id: "comics-8", title: "Watchmen",          author: "Alan Moore",      category: "comics",  price: 359, tags: [], volumes: 1, accent: "#ff2d95",
        synopsis: "En una América alterna, el asesinato de un vigilante retirado destapa una conspiración que redefine el heroísmo." },
      { id: "figuras-1", title: "Gojo Satoru - Figura 1/7", author: "GeekPoint Collection", category: "figuras", price: 2490, tags: ["preventa"], accent: "#8b5bff",
        synopsis: "Escala 1/7, PVC pintado a mano, 27 cm. Incluye efecto de Infinito y base temática." },
      { id: "figuras-2", title: "Power - Figura S.H.F.", author: "GeekPoint Collection", category: "figuras", price: 1890, tags: [], accent: "#ff2d95",
        synopsis: "Figura articulada de 16 cm con accesorios intercambiables y hacha de sangre." },
      { id: "figuras-3", title: "Nezuko - Figura 1/8", author: "GeekPoint Collection", category: "figuras", price: 1690, tags: [], accent: "#ff2d95",
        synopsis: "Escala 1/8, 21 cm, con caja de bambú y pose de combate en modo demonio." },
      { id: "figuras-4", title: "Rem - Figura 1/7", author: "GeekPoint Collection", category: "figuras", price: 2190, tags: [], accent: "#00e5ff",
        synopsis: "Re:Zero. Escala 1/7, 24 cm, con maza y efecto de agua translúcido." },
      { id: "figuras-5", title: "Anya Forger - Nendoroid", author: "GeekPoint Collection", category: "figuras", price: 1290, tags: ["novedad"], accent: "#ffd400",
        synopsis: "Spy x Family. Nendoroid de 10 cm con tres caras intercambiables, incluida la sonrisa 'heh'." },
      { id: "figuras-6", title: "Makima - Figura 1/7", author: "GeekPoint Collection", category: "figuras", price: 2390, tags: ["preventa"], accent: "#e4002b",
        synopsis: "Chainsaw Man. Escala 1/7, 25 cm, con base de cadenas y mirada de Control." },
      { id: "figuras-7", title: "Levi Ackerman - Figura 1/7", author: "GeekPoint Collection", category: "figuras", price: 2290, tags: [], accent: "#7a5c3e",
        synopsis: "Attack on Titan. Escala 1/7, 26 cm, en pose de maniobra con equipo tridimensional." },
      { id: "figuras-8", title: "Megumin - Nendoroid", author: "GeekPoint Collection", category: "figuras", price: 1190, tags: [], accent: "#ff2d95",
        synopsis: "KonoSuba. Nendoroid de 10 cm con báculo, efecto de explosión y cara de conjuro." },
      { id: "tcg-1", title: "Pokémon TCG - Elite Trainer Box", author: "The Pokémon Company", category: "tcg", price: 1290, tags: ["novedad"], accent: "#ffd400",
        synopsis: "Caja con 9 sobres, 65 fundas, 45 cartas de Energía, dados y contadores de daño." },
      { id: "tcg-2", title: "One Piece TCG - Booster Box", author: "Bandai", category: "tcg", price: 1490, tags: [], accent: "#e4002b",
        synopsis: "Caja sellada con 24 sobres del set más reciente. Ideal para draft y coleccionismo." },
      { id: "tcg-3", title: "Magic - Bundle", author: "Wizards of the Coast", category: "tcg", price: 1190, tags: [], accent: "#8b5bff",
        synopsis: "9 sobres de Colección, 20 tierras foil, caja de almacenamiento y contador giratorio." },
      { id: "tcg-4", title: "Yu-Gi-Oh! - Structure Deck", author: "Konami", category: "tcg", price: 349, tags: [], accent: "#8b5bff",
        synopsis: "Baraja de 40 cartas lista para jugar, con estrategia enfocada y cartas exclusivas." },
      { id: "tcg-5", title: "Disney Lorcana - Illumineer's Trove", author: "Ravensburger", category: "tcg", price: 1390, tags: ["novedad"], accent: "#00e5ff",
        synopsis: "8 sobres, dos mazos de inicio, cartas de tinta y organizador para empezar a jugar." }
    ]
  };
})();
