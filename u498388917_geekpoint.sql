-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 01-10-2026 a las 16:53:31
-- Versión del servidor: 11.8.9-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u498388917_geekpoint`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `branches`
--

CREATE TABLE `branches` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `city` varchar(90) NOT NULL DEFAULT '',
  `state` varchar(90) NOT NULL DEFAULT '',
  `address` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(40) NOT NULL DEFAULT '',
  `hours` varchar(120) NOT NULL DEFAULT '',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `branches`
--

INSERT INTO `branches` (`id`, `code`, `name`, `city`, `state`, `address`, `phone`, `hours`, `status`, `created_at`, `updated_at`) VALUES
(1, 'GKP-CDMX', 'GeekPoint Reforma', 'Ciudad de México', 'CDMX', 'Av. Paseo de la Reforma 222, Local 14', '55 5512 8890', 'Lun–Dom 11:00–21:00', 'active', '2026-08-30 06:03:46', '2026-09-04 06:17:43'),
(2, 'GKP-GDL', 'GeekPoint Chapultepec', 'Guadalajara', 'Jalisco', 'Av. Chapultepec Sur 480', '33 3615 4021', 'Lun–Dom 11:00–21:00', 'active', '2026-08-30 06:03:46', '2026-09-04 06:17:43'),
(3, 'GKP-MTY', 'GeekPoint Valle', 'Monterrey', 'Nuevo León', 'Av. San Pedro 1000, Plaza Fiesta', '81 8342 7715', 'Lun–Dom 11:00–21:00', 'active', '2026-08-30 06:03:46', '2026-09-04 06:17:43'),
(4, 'GKP-MID', 'GeekPoint Mérida', 'Mérida', 'Yucatán', 'Calle 34A 6767 58 y 60 Centro', '9901887766', 'Lun–Dom 11:00–21:00', 'active', '2026-09-01 19:32:08', '2026-09-04 06:17:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catalog_cache`
--

CREATE TABLE `catalog_cache` (
  `cache_key` varchar(64) NOT NULL,
  `payload` longtext NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `catalog_cache`
--

INSERT INTO `catalog_cache` (`cache_key`, `payload`, `updated_at`) VALUES
('catalog', '{\"products\":[{\"id\":\"manga-101517\",\"title\":\"Jujutsu Kaisen\",\"series\":\"Jujutsu Kaisen\",\"search_title\":\"Jujutsu Kaisen\",\"author\":\"Gege Akutami\",\"category\":\"manga\",\"price\":189,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg\",\"tags\":[\"novedad\"],\"synopsis\":\"Aunque Yuji Itadori se parece a un adolescente normal, ¡su inmensa fuerza física es algo digno de contemplar! Todos los clubes deportivos quieren que se una, pero Itadori prefiere pasar el rato con los marginados de la escuela en el Club de Investigación Oculta. Un día, el club logra poner sus manos en un objeto mal…\",\"volumes\":30,\"tomos\":30,\"score\":8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":3},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":10},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":3}]},{\"id\":\"manga-105778\",\"title\":\"Chainsaw Man\",\"series\":\"Chainsaw Man\",\"search_title\":\"Chainsaw Man\",\"author\":\"Tatsuki Fujimoto\",\"category\":\"manga\",\"price\":179,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx105778-euxXZEIfDY2u.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png\",\"tags\":[\"novedad\"],\"synopsis\":\"¡El nombre lo dice todo! ¡La vida de pobreza de Denji cambia para siempre cuando se fusiona con su perro motosierra, Pochita! Ahora vive en la gran ciudad y es un cazador de demonios oficial. ¡Pero tiene mucho que aprender sobre su nuevo trabajo y sus poderes de motosierra! (Fuente: MANGA Plus) Notas: - Nominado al …\",\"volumes\":24,\"tomos\":24,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":8},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":1},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":8}]},{\"id\":\"manga-30013\",\"title\":\"One Piece\",\"series\":\"One Piece\",\"search_title\":\"One Piece\",\"author\":\"Eiichirou Oda\",\"category\":\"manga\",\"price\":165,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-BeslEMqiPhlk.jpg\",\"tags\":[],\"synopsis\":\"Cuando era niño, Monkey D. Luffy se inspiró para convertirse en pirata escuchando los cuentos del bucanero \\\"Red-Haired\\\" Shanks. Pero su vida cambió cuando Luffy se comió accidentalmente la fruta del diablo Gum-Gum y ganó el poder de estirarse como el caucho... ¡a costa de no poder nadar nunca más! Años más tarde, aú…\",\"volumes\":null,\"tomos\":null,\"score\":9.1,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":11},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":4},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":11}]},{\"id\":\"manga-87216\",\"title\":\"Demon Slayer: Kimetsu no Yaiba\",\"series\":\"Demon Slayer: Kimetsu no Yaiba\",\"search_title\":\"Kimetsu no Yaiba\",\"author\":\"Koyoharu Gotouge\",\"category\":\"manga\",\"price\":159,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87216-c9bSNVD10UuD.png\",\"tags\":[],\"synopsis\":\"El escenario es el Japón de la era Taisho. Tanjirou es un joven de buen corazón que vivió pacíficamente con su familia como vendedor de carbón. Su vida normal cambia por completo cuando su familia es masacrada por demonios. La única otra sobreviviente, la hermana menor de Tanjirou, Nezuko, se ha convertido en un fer…\",\"volumes\":23,\"tomos\":23,\"score\":7.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"manga-108556\",\"title\":\"SPY x FAMILY\",\"series\":\"SPY x FAMILY\",\"search_title\":\"Spy x Family\",\"author\":\"Tatsuya Endou\",\"category\":\"manga\",\"price\":179,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx108556-NHjkz0BNJhLx.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108556-NHjkz0BNJhLx.jpg\",\"tags\":[],\"synopsis\":\"El maestro espía con nombre en código <Twilight> ha pasado sus días en misiones encubiertas, todo por el sueño de un mundo mejor. Pero un día, recibe una nueva orden particularmente difícil del comando. ¡¿Para su misión, debe formar una familia temporal y comenzar una nueva vida?! ¡Un espía/acción/comedia sobre una …\",\"volumes\":null,\"tomos\":null,\"score\":8.3,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":0},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":7}]},{\"id\":\"manga-132029\",\"title\":\"Dandadan\",\"series\":\"Dandadan\",\"search_title\":\"Dandadan\",\"author\":\"Yukinobu Tatsu\",\"category\":\"manga\",\"price\":175,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx132029-prGF4gePdSKv.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132029-prGF4gePdSKv.jpg\",\"tags\":[\"preventa\"],\"synopsis\":\"Momo Ayase entabla una amistad inusual con el fanático de los ovnis de su escuela, a quien apoda \\\"Okarun\\\" porque tiene un nombre que no se puede decir en voz alta. Mientras Momo cree en los espíritus, piensa que los extraterrestres no son más que tonterías. Su nueva amiga, por su parte, piensa exactamente lo contrar…\",\"volumes\":null,\"tomos\":null,\"score\":8.2,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":9},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":2},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":9}]},{\"id\":\"manga-117195\",\"title\":\"[Oshi no Ko]\",\"series\":\"[Oshi no Ko]\",\"search_title\":\"Oshi no Ko\",\"author\":\"Aka Akasaka\",\"category\":\"manga\",\"price\":179,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx117195-r3kf8eF0xkDJ.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx117195-r3kf8eF0xkDJ.png\",\"tags\":[\"preventa\"],\"synopsis\":\"Gorou es un ginecólogo y fanático de los ídolos que está en estado de shock después de que su estrella favorita, Ai, anuncie una pausa improvisada. ¡Poco se da cuenta Gorou de que está a punto de forjar un vínculo con ella que desafía todo sentido común! ¡Las mentiras son el arma de un ídolo! (Fuente: Yen Press) Not…\",\"volumes\":16,\"tomos\":16,\"score\":7.8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":1},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":8},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":1}]},{\"id\":\"manga-106130\",\"title\":\"Blue Lock\",\"series\":\"Blue Lock\",\"search_title\":\"Blue Lock\",\"author\":\"Muneyuki Kaneshiro\",\"category\":\"manga\",\"price\":169,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx106130-yPNeuSu75ey1.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106130-yPNeuSu75ey1.jpg\",\"tags\":[],\"synopsis\":\"Después de una desastrosa derrota en la Copa del Mundo de 2018, el equipo de Japón lucha por reagruparse. Pero, ¿qué falta? Un Ace Striker absoluto, que puede guiarlos a la victoria. La Unión Japonesa de Fútbol está empeñada en crear un delantero que tenga hambre de goles y sed de victoria, y que pueda ser el instru…\",\"volumes\":null,\"tomos\":null,\"score\":8.2,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"manga-30002\",\"title\":\"Berserk\",\"series\":\"Berserk\",\"search_title\":\"Berserk\",\"author\":\"Kentarou Miura\",\"category\":\"manga\",\"price\":349,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg\",\"tags\":[],\"synopsis\":\"Su nombre es Guts, el Espadachín Negro, un guerrero temido del que solo se habla en susurros. Portador de una espada gigantesca, una mano de hierro y las cicatrices de innumerables batallas y torturas, su carne también está indeleblemente marcada con La Marca, un símbolo profano que atrae las fuerzas de la oscuridad…\",\"volumes\":null,\"tomos\":41,\"score\":9.2,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":0},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":7}]},{\"id\":\"manga-30642\",\"title\":\"Vinland Saga\",\"series\":\"Vinland Saga\",\"search_title\":\"Vinland Saga\",\"author\":\"Makoto Yukimura\",\"category\":\"manga\",\"price\":229,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30642-0mjRDkf4THpo.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30642-0mjRDkf4THpo.jpg\",\"tags\":[],\"synopsis\":\"Cuando era niño, Thorfinn se sentó a los pies del gran Leif Ericson y se emocionó con los cuentos salvajes de una tierra muy al oeste. Pero sus fantasías juveniles fueron destrozadas por una incursión mercenaria. Criado por los vikingos que asesinaron a su padre, Thorfinn se convirtió en un guerrero aterrador, busca…\",\"volumes\":29,\"tomos\":29,\"score\":9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"manga-30026\",\"title\":\"Hunter x Hunter\",\"series\":\"Hunter x Hunter\",\"search_title\":\"Hunter x Hunter\",\"author\":\"Yoshihiro Togashi\",\"category\":\"manga\",\"price\":159,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30026-uCvXMudMzmwI.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30026-uCvXMudMzmwI.jpg\",\"tags\":[],\"synopsis\":\"Gon puede ser un chico de campo, pero tiene grandes aspiraciones. A pesar de las protestas de su tía Mito, Gon decide seguir los pasos de su padre y convertirse en un legendario cazador. Los aspirantes a cazadores comienzan su viaje en un barco sacudido por la tormenta, donde Gon se encuentra con Leorio y Kurapika, …\",\"volumes\":null,\"tomos\":null,\"score\":8.8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"manga-85486\",\"title\":\"My Hero Academia\",\"series\":\"My Hero Academia\",\"search_title\":\"Boku no Hero Academia\",\"author\":\"Kouhei Horikoshi\",\"category\":\"manga\",\"price\":165,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx85486-INqnYx8gL3eX.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85486-INqnYx8gL3eX.jpg\",\"tags\":[],\"synopsis\":\"Middle school student Izuku Midoriya wants to be a hero more than anything, but he hasn’t got an ounce of power in him. With no chance of ever getting into the prestigious U.A. High School for budding heroes, his life is looking more and more like a dead end. Then an encounter with All Might, the greatest hero of th…\",\"volumes\":42,\"tomos\":42,\"score\":7.8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":2},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":9},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":2}]},{\"id\":\"manga-53390\",\"title\":\"Attack on Titan\",\"series\":\"Attack on Titan\",\"search_title\":\"Shingeki no Kyojin\",\"author\":\"Hajime Isayama\",\"category\":\"manga\",\"price\":169,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx53390-1RsuABC34P9D.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx53390-1RsuABC34P9D.jpg\",\"tags\":[],\"synopsis\":\"In this post-apocalyptic sci-fi story, humanity has been devastated by the bizarre, giant humanoids known as the Titans. Little is known about where they came from or why they are bent on consuming mankind. Seemingly unintelligent, they have roamed the world for years, killing everyone they see. For the past century…\",\"volumes\":34,\"tomos\":34,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":8},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":1},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":8}]},{\"id\":\"manga-105398\",\"title\":\"Solo Leveling\",\"series\":\"Solo Leveling\",\"search_title\":\"Solo Leveling\",\"author\":\"So-Ryeong Gi\",\"category\":\"manga\",\"price\":219,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx105398-b673Vt5ZSuz3.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg\",\"tags\":[\"novedad\"],\"synopsis\":\"In a world where awakened beings called “Hunters” must battle deadly monsters to protect humanity, Seong Jin-U, nicknamed “the weakest hunter of all mankind,” finds himself in a constant struggle for survival. One day, after a brutal encounter in an overpowered dungeon wipes out his party and threatens to end his li…\",\"volumes\":15,\"tomos\":15,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":6},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":13},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":6}]},{\"id\":\"manga-118586\",\"title\":\"Frieren: Beyond Journey\'s End\",\"series\":\"Frieren: Beyond Journey’s End\",\"search_title\":\"Sousou no Frieren\",\"author\":\"Kanehito Yamada\",\"category\":\"manga\",\"price\":175,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx118586-CXKgWikBFQgS.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118586-CXKgWikBFQgS.jpg\",\"tags\":[\"preventa\"],\"synopsis\":\"The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land. With the great struggle over, they all go their separate ways to live a quiet life. But as an elf…\",\"volumes\":null,\"tomos\":null,\"score\":8.7,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":6},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":13},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":6}]},{\"id\":\"manga-30011\",\"title\":\"Naruto\",\"series\":\"Naruto\",\"search_title\":\"Naruto\",\"author\":\"Masashi Kishimoto\",\"category\":\"manga\",\"price\":155,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fnx30011-9yUF1dXWgDOx.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx30011-9yUF1dXWgDOx.jpg\",\"tags\":[],\"synopsis\":\"Twelve years ago the Village Hidden in the Leaves was attacked by a fearsome threat. A nine-tailed fox spirit claimed the life of the village leader, the Hokage, and many others. Today, the village is at peace and a troublemaking kid named Naruto is struggling to graduate from Ninja Academy. His goal may be to becom…\",\"volumes\":72,\"tomos\":72,\"score\":7.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":9},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":2},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":9}]},{\"id\":\"manga-30012\",\"title\":\"Bleach\",\"series\":\"Bleach\",\"search_title\":\"Bleach\",\"author\":\"Tite Kubo\",\"category\":\"manga\",\"price\":159,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30012-1epmVfTSv2rr.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30012-1epmVfTSv2rr.png\",\"tags\":[],\"synopsis\":\"Ichigo Kurosaki has always been able to see ghosts, but this ability doesn\'t change his life nearly as much as his close encounter with Rukia Kuchiki, a Soul Reaper and member of the mysterious Soul Society. While fighting a Hollow, an evil spirit that preys on humans who display psychic energy, Rukia attempts to le…\",\"volumes\":74,\"tomos\":74,\"score\":8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"manga-30021\",\"title\":\"Death Note\",\"series\":\"Death Note\",\"search_title\":\"Death Note\",\"author\":\"Tsugumi Ooba\",\"category\":\"manga\",\"price\":149,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30021-FE6kmrfpuKyb.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30021-FE6kmrfpuKyb.jpg\",\"tags\":[],\"synopsis\":\"Light Yagami is an ace student with great prospects—and he’s bored out of his mind. But all that changes when he finds the Death Note, a notebook dropped by a rogue Shinigami death god. Any human whose name is written in the notebook dies, and Light has vowed to use the power of the Death Note to rid the world of ev…\",\"volumes\":12,\"tomos\":12,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":5},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":12},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":5}]},{\"id\":\"manga-30025\",\"title\":\"Fullmetal Alchemist\",\"series\":\"Fullmetal Alchemist\",\"search_title\":\"Fullmetal Alchemist\",\"author\":\"Hiromu Arakawa\",\"category\":\"manga\",\"price\":189,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30025-mpPVpCKFTowt.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30025-mpPVpCKFTowt.png\",\"tags\":[],\"synopsis\":\"Alchemy tore the Elric brothers’ bodies apart. Can their bond make them whole again? In this world, alchemists are those who study and perform the art of alchemical transmutation—the science of manipulating and transforming matter. They are bounded by the Law of Equivalent Exchange: in order to gain something, one m…\",\"volumes\":27,\"tomos\":27,\"score\":8.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":9},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":2},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":9}]},{\"id\":\"manga-63327\",\"title\":\"Tokyo Ghoul\",\"series\":\"Tokyo Ghoul\",\"search_title\":\"Tokyo Ghoul\",\"author\":\"Sui Ishida\",\"category\":\"manga\",\"price\":165,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx63327-glC9cDxYBja9.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx63327-glC9cDxYBja9.png\",\"tags\":[],\"synopsis\":\"Shy Ken Kaneki is thrilled to go on a date with the beautiful Rize. But it turns out that she’s only interested in his body—eating it, that is. When a morally questionable rescue transforms him into the first half-human half-Ghoul hybrid, Ken is drawn into the dark and violent world of Ghouls, which exists alongside…\",\"volumes\":14,\"tomos\":14,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":5},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":12},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":5}]},{\"id\":\"manga-181735\",\"title\":\"Haikyu!!\",\"series\":\"Haikyuu!!\",\"search_title\":\"Haikyuu!!\",\"author\":\"Haruichi Furudate\",\"category\":\"manga\",\"price\":155,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx181735-xIoXaQmtjkuC.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx181735-xIoXaQmtjkuC.png\",\"tags\":[],\"synopsis\":\"\",\"volumes\":null,\"tomos\":null,\"score\":6.3,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":1},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":8},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":1}]},{\"id\":\"manga-126244\",\"title\":\"Kaguya-sama: Love is War\",\"series\":\"Kaguya-sama wa Kokurasetai Darkness\",\"search_title\":\"Kaguya-sama wa Kokurasetai\",\"author\":\"Aka Akasaka\",\"category\":\"manga\",\"price\":169,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx126244-VjHVPG4o7T3N.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126244-VjHVPG4o7T3N.jpg\",\"tags\":[],\"synopsis\":\"1. Yu complains about manga fanservice as the girls are taking a bath. 2. Yu and Miyuki comment on a stray porn mag. Note: Published in two separate issues of Young Jump GOLD.\",\"volumes\":null,\"tomos\":null,\"score\":6.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":6},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":13},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":6}]},{\"id\":\"comics-88339\",\"title\":\"JoJo\'s Bizarre Adventure\",\"series\":\"JoJo no Kimyou na Bouken\",\"search_title\":\"JoJo no Kimyou na Bouken\",\"author\":\"Hiroshi Yamaguchi\",\"category\":\"comics\",\"price\":299,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx88339-aGpw5a4g81Au.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx88339-aGpw5a4g81Au.jpg\",\"tags\":[],\"synopsis\":\"It tells two original storylines set in Stardust Crusaders. The story in this book recounts events that are completely unknown in the manga that take place in the course of the adventures of Jotaro Kujo and his comrades. Their march to the lair of DIO is interrupted by three powerful Stand users. The first chapter i…\",\"volumes\":1,\"tomos\":1,\"score\":7.2,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":13},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":6},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":13}]},{\"id\":\"comics-85143\",\"title\":\"Tower of God\",\"series\":\"Tower of God\",\"search_title\":\"Tower of God\",\"author\":\"SIU\",\"category\":\"comics\",\"price\":269,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx85143-23oup3ETbFJk.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85143-23oup3ETbFJk.jpg\",\"tags\":[\"novedad\"],\"synopsis\":\"What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire—it\'s here. (Source: WEBTOON)\",\"volumes\":null,\"tomos\":null,\"score\":8.1,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":9},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":2},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":9}]},{\"id\":\"comics-85141\",\"title\":\"The God of High School\",\"series\":\"The God of High School\",\"search_title\":\"The God of High School\",\"author\":\"Yong-Je Park\",\"category\":\"comics\",\"price\":249,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx85141-qHR957V3FVco.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85141-qHR957V3FVco.png\",\"tags\":[],\"synopsis\":\"Mori Jin is a high school student and Taekwondo specialist who enters \\\"The God of High School,\\\" a fighting tournament that promises the winner anything they want. What began as a competition to seek out the best high school fighter soon reveals itself to be part of a much greater plot that goes beyond Mori\'s wildest…\",\"volumes\":null,\"tomos\":null,\"score\":7.6,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":7},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":7}]},{\"id\":\"comics-119257\",\"title\":\"Omniscient Reader\'s Viewpoint\",\"series\":\"Omniscient Reader\",\"search_title\":\"Omniscient Reader\",\"author\":\"UMI\",\"category\":\"comics\",\"price\":279,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx119257-Pi21aq3ey9GG.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg\",\"tags\":[],\"synopsis\":\"Back then, Dok-Ja had no idea. He had no idea his favorite web novel \'Three Ways to Survive the Apocalypse\' was going to come to life, and that he would become the only person to know how the world was going to end. He also had no idea he would end up becoming the protagonist of this novel-turned-reality. Now, Dok-J…\",\"volumes\":null,\"tomos\":null,\"score\":8.6,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":5},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":12},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":5}]},{\"id\":\"comics-59983\",\"title\":\"Noblesse\",\"series\":\"Noblesse\",\"search_title\":\"Noblesse\",\"author\":\"Jae-Ho Son\",\"category\":\"comics\",\"price\":239,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx59983-cfSjrRxuAlAD.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx59983-cfSjrRxuAlAD.png\",\"tags\":[],\"synopsis\":\"Rai wakes up from an 820-year-long sleep and starts his new life as a student in a high school founded by his loyal servant, Frankenstein. But his peaceful days with other human students are soon interrupted by mysterious attackers known as the \\\"Unions.\\\" (Source: WEBTOON)\",\"volumes\":null,\"tomos\":null,\"score\":7.6,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":7},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":7}]},{\"id\":\"comics-86848\",\"title\":\"Lookism\",\"series\":\"Lookism\",\"search_title\":\"Lookism\",\"author\":\"Tae-Jun Park\",\"category\":\"comics\",\"price\":229,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx86848-4CSItSclJUvi.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86848-4CSItSclJUvi.jpg\",\"tags\":[],\"synopsis\":\"Daniel is an unattractive loner who wakes up in a different body. Now tall, handsome, and cooler than ever in his new form, Daniel aims to achieve everything he couldn\'t before. How far will he go to keep his body... and his secrets?(Source: WEBTOON)\",\"volumes\":null,\"tomos\":null,\"score\":7.8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":6},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":13},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":6}]},{\"id\":\"figuras-105469\",\"title\":\"Gojo Satoru - Figura 1/7\",\"series\":\"Jujutsu Kaisen 0\",\"search_title\":\"Jujutsu Kaisen 0\",\"author\":\"Gege Akutami\",\"category\":\"figuras\",\"price\":2490,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx105469-IvLF5yIf6LBC.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105469-IvLF5yIf6LBC.jpg\",\"tags\":[\"preventa\"],\"synopsis\":\"Yuta Okkotsu is a nervous high school student who is suffering from a serious problem—his childhood friend Rika has turned into a curse and won\'t leave him alone. Since Rika is no ordinary curse, his plight is noticed by Satoru Gojo, a teacher at Jujutsu High, a school where fledgling exorcists learn how to combat c…\",\"volumes\":1,\"tomos\":1,\"score\":8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":7},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":7}]},{\"id\":\"figuras-105778\",\"title\":\"Power - Figura S.H.F.\",\"series\":\"Chainsaw Man\",\"search_title\":\"Chainsaw Man\",\"author\":\"Tatsuki Fujimoto\",\"category\":\"figuras\",\"price\":1890,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx105778-euxXZEIfDY2u.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png\",\"tags\":[],\"synopsis\":\"¡El nombre lo dice todo! ¡La vida de pobreza de Denji cambia para siempre cuando se fusiona con su perro motosierra, Pochita! Ahora vive en la gran ciudad y es un cazador de demonios oficial. ¡Pero tiene mucho que aprender sobre su nuevo trabajo y sus poderes de motosierra! (Fuente: MANGA Plus) Notas: - Nominado al …\",\"volumes\":24,\"tomos\":24,\"score\":8.4,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":8},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":1},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":8}]},{\"id\":\"figuras-87216\",\"title\":\"Nezuko - Figura 1/8\",\"series\":\"Demon Slayer: Kimetsu no Yaiba\",\"search_title\":\"Kimetsu no Yaiba\",\"author\":\"Koyoharu Gotouge\",\"category\":\"figuras\",\"price\":1690,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87216-c9bSNVD10UuD.png\",\"tags\":[],\"synopsis\":\"El escenario es el Japón de la era Taisho. Tanjirou es un joven de buen corazón que vivió pacíficamente con su familia como vendedor de carbón. Su vida normal cambia por completo cuando su familia es masacrada por demonios. La única otra sobreviviente, la hermana menor de Tanjirou, Nezuko, se ha convertido en un fer…\",\"volumes\":23,\"tomos\":23,\"score\":7.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"figuras-85737\",\"title\":\"Rem - Figura 1/7\",\"series\":\"Re:ZERO -Starting Life in Another World-\",\"search_title\":\"Re:Zero kara Hajimeru Isekai Seikatsu\",\"author\":\"Tappei Nagatsuki\",\"category\":\"figuras\",\"price\":2190,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx85737-WkWOr5EgwPyo.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-WkWOr5EgwPyo.jpg\",\"tags\":[],\"synopsis\":\"Subaru Natsuki was just trying to get to the convenience store but wound up summoned to another world. He encounters the usual things--life-threatening situations, silver haired beauties, cat fairies--you know, normal stuff. All that would be bad enough, but he\'s also gained the most inconvenient magical ability of …\",\"volumes\":null,\"tomos\":null,\"score\":8.8,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":1},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":8},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":1}]},{\"id\":\"figuras-108556\",\"title\":\"Anya Forger - Nendoroid\",\"series\":\"SPY x FAMILY\",\"search_title\":\"Spy x Family\",\"author\":\"Tatsuya Endou\",\"category\":\"figuras\",\"price\":1290,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx108556-NHjkz0BNJhLx.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108556-NHjkz0BNJhLx.jpg\",\"tags\":[\"novedad\"],\"synopsis\":\"El maestro espía con nombre en código <Twilight> ha pasado sus días en misiones encubiertas, todo por el sueño de un mundo mejor. Pero un día, recibe una nueva orden particularmente difícil del comando. ¡¿Para su misión, debe formar una familia temporal y comenzar una nueva vida?! ¡Un espía/acción/comedia sobre una …\",\"volumes\":null,\"tomos\":null,\"score\":8.3,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":0},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":7}]},{\"id\":\"figuras-100937\",\"title\":\"Zero Two - Figura 1/7\",\"series\":\"DARLING in the FRANXX\",\"search_title\":\"Darling in the FranXX\",\"author\":\"Kentarou Yabuki\",\"category\":\"figuras\",\"price\":2290,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fnx100937-yGH5hLbEFtOv.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx100937-yGH5hLbEFtOv.jpg\",\"tags\":[],\"synopsis\":\"In a devastated post-apocalyptic future, Earth is a ruinous wasteland. Humanity’s only remaining strongholds are mobile fortress cities called Plantations. Massive beasts known as klaxosaurs, the planet’s new apex predators, have pushed mankind to the edge of extinction, and within the walls of the Plantations, thin…\",\"volumes\":8,\"tomos\":8,\"score\":7.1,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":11},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":4},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":11}]},{\"id\":\"figuras-118586\",\"title\":\"Frieren - Figura 1/7\",\"series\":\"Frieren: Beyond Journey’s End\",\"search_title\":\"Sousou no Frieren\",\"author\":\"Kanehito Yamada\",\"category\":\"figuras\",\"price\":1990,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx118586-CXKgWikBFQgS.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118586-CXKgWikBFQgS.jpg\",\"tags\":[\"preventa\"],\"synopsis\":\"The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land. With the great struggle over, they all go their separate ways to live a quiet life. But as an elf…\",\"volumes\":null,\"tomos\":null,\"score\":8.7,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":6},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":13},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":6}]},{\"id\":\"tcg-30928\",\"title\":\"Pokemon TCG - Elite Trainer Box\",\"series\":\"Pokémon Adventures\",\"search_title\":\"Pokemon Adventures\",\"author\":\"Hidenori Kusaka\",\"category\":\"tcg\",\"price\":1290,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30928-RPsTlrXezNsv.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30928-RPsTlrXezNsv.jpg\",\"tags\":[\"novedad\"],\"synopsis\":\"Red is just a normal kid living in the rural Pallet Town, when he decides to go out on his own adventure, along with his rival since childhood, Green. In this world of Pokemon, he makes many friends, humans and Pokemon alike. However, all is not well. Team Rocket is trying to capture Mew, a very rare Pokemon, and is…\",\"volumes\":null,\"tomos\":null,\"score\":7.9,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":2},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":9},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":2}]},{\"id\":\"tcg-30013\",\"title\":\"One Piece TCG - Booster Box\",\"series\":\"One Piece\",\"search_title\":\"One Piece\",\"author\":\"Eiichirou Oda\",\"category\":\"tcg\",\"price\":1490,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-BeslEMqiPhlk.jpg\",\"tags\":[],\"synopsis\":\"Cuando era niño, Monkey D. Luffy se inspiró para convertirse en pirata escuchando los cuentos del bucanero \\\"Red-Haired\\\" Shanks. Pero su vida cambió cuando Luffy se comió accidentalmente la fruta del diablo Gum-Gum y ganó el poder de estirarse como el caucho... ¡a costa de no poder nadar nunca más! Años más tarde, aú…\",\"volumes\":null,\"tomos\":null,\"score\":9.1,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":11},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":4},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":11}]},{\"id\":\"tcg-30054\",\"title\":\"Yu-Gi-Oh! TCG - Structure Deck\",\"series\":\"Yu-Gi-Oh!\",\"search_title\":\"Yu-Gi-Oh!\",\"author\":\"Kazuki Takahashi\",\"category\":\"tcg\",\"price\":1190,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30054-HwrRlsJYePNF.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30054-HwrRlsJYePNF.jpg\",\"tags\":[],\"synopsis\":\"10th grader Yugi spent most of his time alone playing games--until he solved the Millennium Puzzle, a mysterious Egyptian artifact! Possessed by the puzzle, Yugi becomes Yu-Gi-Oh, the King of Games, and challenges evil-doers to the Shadow Games--weird games with high stakes and high risks! These graphic novels conta…\",\"volumes\":38,\"tomos\":38,\"score\":7.7,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":10},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":3},{\"code\":\"GKP-MTY\",\"name\":\"Valle\",\"stock\":10}]},{\"id\":\"tcg-53956\",\"title\":\"Magic - Play Booster Box\",\"series\":\"Magic: The Gathering - Moe Tsukinu Honoo\",\"search_title\":\"Magic The Gathering\",\"author\":\"Yoshino Himori\",\"category\":\"tcg\",\"price\":1390,\"currency\":\"MXN\",\"cover\":\"catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Fmedium%2F23956.jpg\",\"cover_raw\":\"https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/23956.jpg\",\"tags\":[],\"synopsis\":\"The story evolves around Chandra Nalaar, a young firemage who trains at the Kerald Keep in the mountains to learn how to control her powers. But life isn\'t that easy because the Order of Heliud, a sect of mages bent on imposing their draconian law across the land, is now also expanding their dominion to the woodland…\",\"volumes\":2,\"tomos\":2,\"score\":null,\"branches\":[{\"code\":\"GKP-CDMX\",\"name\":\"Reforma\",\"stock\":0},{\"code\":\"GKP-GDL\",\"name\":\"Chapultepec\",\"stock\":7}]}],\"source\":\"anilist\",\"generated_at\":\"2026-09-22T07:58:32+00:00\"}', '2026-09-22 07:58:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(60) NOT NULL,
  `name_es` varchar(90) NOT NULL,
  `name_en` varchar(90) NOT NULL,
  `icon` varchar(16) NOT NULL DEFAULT '',
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `slug`, `name_es`, `name_en`, `icon`, `sort_order`) VALUES
(1, 'manga', 'Manga', 'Manga', '📚', 1),
(2, 'figuras', 'Figuras', 'Figures', '🗿', 2),
(3, 'tcg', 'Cartas TCG', 'TCG Cards', '🃏', 3),
(4, 'comics', 'Cómics', 'Comics', '💥', 4),
(5, 'coleccionables', 'Coleccionables', 'Collectibles', '🎁', 5),
(6, 'preventa', 'Preventas', 'Pre-orders', '🎫', 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `sku` varchar(40) NOT NULL,
  `name` varchar(180) NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `description` varchar(500) NOT NULL DEFAULT '',
  `tags` varchar(120) NOT NULL DEFAULT '',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `discount_starts_at` datetime DEFAULT NULL,
  `discount_ends_at` datetime DEFAULT NULL,
  `tax_rate` decimal(4,3) NOT NULL DEFAULT 0.160,
  `stock` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) NOT NULL DEFAULT 3,
  `image_url` varchar(1000) NOT NULL DEFAULT '',
  `figure_png_url` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `branch_id`, `sku`, `name`, `category_id`, `description`, `tags`, `price`, `discount_percent`, `discount_starts_at`, `discount_ends_at`, `tax_rate`, `stock`, `min_stock`, `image_url`, `figure_png_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'MNG-JJK-01', 'Jujutsu Kaisen Vol. 1', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 24, 3, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-09 02:24:58'),
(2, 1, 'MNG-CSM-05', 'Chainsaw Man Vol. 5', 1, 'Edición español, Panini Manga.', '', 149.00, 0.00, NULL, NULL, 0.160, 1, 5, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-11 17:39:23'),
(3, 1, 'MNG-OPC-105', 'One Piece Vol. 105', 1, 'Edición español, Panini Manga.', '', 159.00, 0.00, NULL, NULL, 0.160, 17, 6, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-09 20:00:12'),
(4, 1, 'MNG-SPY-11', 'Spy x Family Vol. 11', 1, 'Edición español.', '', 159.00, 0.00, NULL, NULL, 0.160, 9, 5, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(5, 1, 'FIG-GOJO-16', 'Figura Gojo Satoru 1/7', 2, 'Escala 1/7, PVC, 26 cm.', '', 2490.00, 0.00, NULL, NULL, 0.160, 3, 2, '', NULL, 'inactive', '2026-08-30 06:03:46', '2026-09-08 17:48:45'),
(7, 1, 'TCG-PKM-151', 'Pokémon TCG — Booster 151', 3, 'Sobre sellado, 10 cartas.', '', 119.00, 0.00, NULL, NULL, 0.160, 60, 15, 'https://images.pokemontcg.io/sv3pt5/199_hires.png', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(8, 1, 'TCG-OP-ETB', 'One Piece TCG — Elite Trainer Box', 3, 'Caja con 8 sobres + accesorios.', '', 1290.00, 0.00, NULL, NULL, 0.160, 5, 4, 'catalog/cover?kind=tcg&pub=ONE%20PIECE&t=One%20Piece%20TCG', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(9, 1, 'COL-KEY-JJK', 'Llavero acrílico Jujutsu (surtido)', 5, 'Acrílico doble cara, 6 cm.', '', 59.00, 0.00, NULL, NULL, 0.160, 80, 20, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(10, 1, 'COL-POST-OP', 'Póster One Piece Wano 60x90', 5, 'Papel couché 250g.', '', 149.00, 0.00, NULL, NULL, 0.160, 5, 6, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-15 16:53:44'),
(11, 2, 'MNG-JJK-01', 'Jujutsu Kaisen Vol. 1', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 11, 3, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-09 02:24:58'),
(12, 2, 'MNG-BLK-21', 'Blue Lock Vol. 21', 1, 'Edición español.', '', 159.00, 0.00, NULL, NULL, 0.160, 3, 5, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(13, 2, 'MNG-KNY-23', 'Kimetsu no Yaiba Vol. 23', 1, 'Edición español, tomo final.', '', 149.00, 0.00, NULL, NULL, 0.160, 20, 6, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(15, 2, 'FIG-EREN-POP', 'Funko Pop! Eren Titán', 2, 'Vinyl super sized 15 cm.', '', 749.00, 0.00, NULL, NULL, 0.160, 6, 4, '', NULL, 'inactive', '2026-08-30 06:03:46', '2026-09-08 17:48:07'),
(16, 2, 'TCG-PKM-151', 'Pokémon TCG — Booster 151', 3, 'Sobre sellado, 10 cartas.', '', 119.00, 0.00, NULL, NULL, 0.160, 45, 15, 'https://images.pokemontcg.io/sv3pt5/199_hires.png', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(17, 2, 'TCG-MTG-LCI', 'Magic — Bundle Lost Caverns', 3, 'Bundle con 9 sobres Set.', '', 1490.00, 0.00, NULL, NULL, 0.160, 2, 3, 'https://api.scryfall.com/cards/named?exact=Cavern%20of%20Souls&format=image&version=large', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(18, 2, 'COL-MOU-ANM', 'Mousepad XL anime (surtido)', 5, '90x40 cm, base antiderrapante.', '', 249.00, 0.00, NULL, NULL, 0.160, 14, 6, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(19, 2, 'COL-PIN-KNY', 'Pin metálico Kimetsu (surtido)', 5, 'Esmaltado, broche mariposa.', '', 49.00, 0.00, NULL, NULL, 0.160, 5, 12, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(20, 3, 'MNG-JJK-01', 'Jujutsu Kaisen Vol. 1', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 8, 3, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-09 02:24:58'),
(21, 3, 'MNG-DND-12', 'Dandadan Vol. 12', 1, 'Edición español.', '', 159.00, 0.00, NULL, NULL, 0.160, 6, 5, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(23, 3, 'TCG-PKM-151', 'Pokémon TCG — Booster 151', 3, 'Sobre sellado, 10 cartas.', '', 119.00, 0.00, NULL, NULL, 0.160, 30, 15, 'https://images.pokemontcg.io/sv3pt5/199_hires.png', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(24, 3, 'COL-STK-MIX', 'Stickers holográficos (paquete)', 5, 'Paquete de 12 piezas.', '', 39.00, 0.00, NULL, NULL, 0.160, 50, 15, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(25, 1, 'MNG-S-JJK', 'Jujutsu Kaisen', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-14 19:19:13'),
(26, 2, 'MNG-S-JJK', 'Jujutsu Kaisen', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(27, 3, 'MNG-S-JJK', 'Jujutsu Kaisen', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(28, 1, 'MNG-S-CSM', 'Chainsaw Man', 1, 'Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública. · 17 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 7, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-22 03:20:12'),
(29, 2, 'MNG-S-CSM', 'Chainsaw Man', 1, 'Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública. · 17 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(30, 3, 'MNG-S-CSM', 'Chainsaw Man', 1, 'Denji fusiona su cuerpo con Pochita y se convierte en el Hombre Motosierra, cazando demonios para la División de Seguridad Pública. · 17 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(31, 1, 'MNG-S-OP', 'One Piece', 1, 'Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas. · 108 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(32, 2, 'MNG-S-OP', 'One Piece', 1, 'Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas. · 108 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(33, 3, 'MNG-S-OP', 'One Piece', 1, 'Monkey D. Luffy zarpa para encontrar el tesoro legendario One Piece y convertirse en el Rey de los Piratas. · 108 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 8, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(34, 1, 'MNG-S-DS', 'Demon Slayer', 1, 'Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko. · 23 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 1, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-15 16:50:24'),
(35, 2, 'MNG-S-DS', 'Demon Slayer', 1, 'Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko. · 23 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(36, 3, 'MNG-S-DS', 'Demon Slayer', 1, 'Tanjiro Kamado se une a los Cazadores de Demonios tras la masacre de su familia y la transformación de su hermana Nezuko. · 23 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 4, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(37, 1, 'MNG-S-SXF', 'Spy x Family', 1, 'Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra. · 13 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 5, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(38, 2, 'MNG-S-SXF', 'Spy x Family', 1, 'Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra. · 13 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(39, 3, 'MNG-S-SXF', 'Spy x Family', 1, 'Un espía, una asesina y una telépata fingen ser una familia para cumplir una misión que evita una guerra. · 13 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 4, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(40, 1, 'MNG-S-DND', 'Dandadan', 1, 'Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales. · 15 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-15 16:53:55'),
(41, 2, 'MNG-S-DND', 'Dandadan', 1, 'Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales. · 15 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 16, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(42, 3, 'MNG-S-DND', 'Dandadan', 1, 'Momo cree en fantasmas, Okarun en aliens. Ambos tienen razón, y ahora comparten poderes sobrenaturales. · 15 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 4, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(43, 1, 'MNG-S-ONK', 'Oshi no Ko', 1, 'Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento. · 14 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 12, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(44, 2, 'MNG-S-ONK', 'Oshi no Ko', 1, 'Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento. · 14 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 15, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(45, 3, 'MNG-S-ONK', 'Oshi no Ko', 1, 'Un médico renace como hijo de su ídola favorita y descubre el lado oscuro de la industria del entretenimiento. · 14 tomos', '', 179.00, 0.00, NULL, NULL, 0.160, 6, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(46, 1, 'MNG-S-BLK', 'Blue Lock', 1, '300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés. · 27 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 11, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-08 18:59:20'),
(47, 2, 'MNG-S-BLK', 'Blue Lock', 1, '300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés. · 27 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(48, 3, 'MNG-S-BLK', 'Blue Lock', 1, '300 delanteros compiten en un búnker para forjar al mejor egoísta del fútbol japonés. · 27 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(49, 1, 'MNG-S-BSK', 'Berserk', 1, 'Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios. · 42 tomos', '', 349.00, 0.00, NULL, NULL, 0.160, 9, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-02 22:17:32'),
(50, 2, 'MNG-S-BSK', 'Berserk', 1, 'Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios. · 42 tomos', '', 349.00, 0.00, NULL, NULL, 0.160, 3, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(51, 3, 'MNG-S-BSK', 'Berserk', 1, 'Guts, el Espadachín Negro, persigue venganza en un mundo medieval brutal poblado de demonios. · 42 tomos', '', 349.00, 0.00, NULL, NULL, 0.160, 12, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(52, 1, 'MNG-S-VS', 'Vinland Saga', 1, 'Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos. · 28 tomos', '', 229.00, 0.00, NULL, NULL, 0.160, 3, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(53, 2, 'MNG-S-VS', 'Vinland Saga', 1, 'Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos. · 28 tomos', '', 229.00, 0.00, NULL, NULL, 0.160, 5, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(54, 3, 'MNG-S-VS', 'Vinland Saga', 1, 'Thorfinn busca venganza entre vikingos, hasta que la esclavitud le enseña que no tiene enemigos. · 28 tomos', '', 229.00, 0.00, NULL, NULL, 0.160, 16, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(55, 1, 'MNG-S-AOT', 'Attack on Titan', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 3, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(56, 2, 'MNG-S-AOT', 'Attack on Titan', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(57, 3, 'MNG-S-AOT', 'Attack on Titan', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 6, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(58, 1, 'MNG-S-NRT', 'Naruto', 1, 'Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea. · 72 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-09 19:59:44'),
(59, 2, 'MNG-S-NRT', 'Naruto', 1, 'Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea. · 72 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 7, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(60, 3, 'MNG-S-NRT', 'Naruto', 1, 'Naruto Uzumaki, un ninja adolescente con un zorro de nueve colas sellado dentro, sueña con ser Hokage de su aldea. · 72 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 5, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(61, 1, 'MNG-S-BLE', 'Bleach', 1, 'Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos. · 74 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-22 03:20:00'),
(62, 2, 'MNG-S-BLE', 'Bleach', 1, 'Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos. · 74 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 4, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(63, 3, 'MNG-S-BLE', 'Bleach', 1, 'Ichigo Kurosaki obtiene poderes de Shinigami y debe proteger a los vivos de los espíritus llamados Huecos. · 74 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 11, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(64, 1, 'MNG-S-FMA', 'Fullmetal Alchemist', 1, 'Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 12, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(65, 2, 'MNG-S-FMA', 'Fullmetal Alchemist', 1, 'Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 11, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(66, 3, 'MNG-S-FMA', 'Fullmetal Alchemist', 1, 'Los hermanos Elric buscan la Piedra Filosofal para recuperar sus cuerpos tras una transmutación humana fallida. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(67, 1, 'MNG-S-DN', 'Death Note', 1, 'Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios. · 12 tomos', '', 149.00, 0.00, NULL, NULL, 0.160, 7, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(68, 2, 'MNG-S-DN', 'Death Note', 1, 'Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios. · 12 tomos', '', 149.00, 0.00, NULL, NULL, 0.160, 5, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(69, 3, 'MNG-S-DN', 'Death Note', 1, 'Light Yagami encuentra un cuaderno que mata a quien escriba su nombre y decide crear un mundo nuevo como su dios. · 12 tomos', '', 149.00, 0.00, NULL, NULL, 0.160, 15, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(70, 1, 'MNG-S-TG', 'Tokyo Ghoul', 1, 'Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos. · 14 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(71, 2, 'MNG-S-TG', 'Tokyo Ghoul', 1, 'Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos. · 14 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 3, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(72, 3, 'MNG-S-TG', 'Tokyo Ghoul', 1, 'Ken Kaneki sobrevive a un ataque ghoul y despierta convertido en un híbrido atrapado entre dos mundos. · 14 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 4, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(73, 1, 'MNG-S-MHA', 'My Hero Academia', 1, 'En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno. · 40 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 10, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(74, 2, 'MNG-S-MHA', 'My Hero Academia', 1, 'En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno. · 40 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 5, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(75, 3, 'MNG-S-MHA', 'My Hero Academia', 1, 'En un mundo donde casi todos tienen superpoderes, Izuku Midoriya nace sin ninguno pero hereda el del héroe número uno. · 40 tomos', '', 165.00, 0.00, NULL, NULL, 0.160, 6, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(76, 1, 'MNG-S-HXH', 'Hunter x Hunter', 1, 'Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen. · 37 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 12, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-09-11 19:11:58'),
(77, 2, 'MNG-S-HXH', 'Hunter x Hunter', 1, 'Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen. · 37 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(78, 3, 'MNG-S-HXH', 'Hunter x Hunter', 1, 'Gon Freecss se hace cazador para encontrar a su padre y recorre un mundo lleno de bestias, subastas y Nen. · 37 tomos', '', 159.00, 0.00, NULL, NULL, 0.160, 9, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(79, 1, 'MNG-S-HQ', 'Haikyu!!', 1, 'Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto. · 45 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 17, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(80, 2, 'MNG-S-HQ', 'Haikyu!!', 1, 'Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto. · 45 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(81, 3, 'MNG-S-HQ', 'Haikyu!!', 1, 'Shoyo Hinata, bajo de estatura pero con un salto imposible, jura llevar al equipo de voleibol del Karasuno a lo más alto. · 45 tomos', '', 155.00, 0.00, NULL, NULL, 0.160, 11, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(82, 1, 'MNG-S-KGY', 'Kaguya-sama: Love is War', 1, 'Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota. · 28 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 13, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(83, 2, 'MNG-S-KGY', 'Kaguya-sama: Love is War', 1, 'Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota. · 28 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 15, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(84, 3, 'MNG-S-KGY', 'Kaguya-sama: Love is War', 1, 'Dos genios del consejo estudiantil se enamoran, pero ninguno confesará primero: sería admitir la derrota. · 28 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 3, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(85, 1, 'MNG-S-FRN', 'Frieren: Beyond Journey\'s End', 1, 'La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían. · 13 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 14, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(86, 2, 'MNG-S-FRN', 'Frieren: Beyond Journey\'s End', 1, 'La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían. · 13 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 15, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(87, 3, 'MNG-S-FRN', 'Frieren: Beyond Journey\'s End', 1, 'La maga elfa Frieren sobrevive siglos a sus compañeros de aventura y emprende un viaje para entender lo que los humanos sentían. · 13 tomos', '', 175.00, 0.00, NULL, NULL, 0.160, 12, 4, '', NULL, 'active', '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(200, 1, 'CMC-BAT-142', 'Batman #142 (variante)', 4, 'DC Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png', NULL, 'active', '2026-08-30 06:05:28', '2026-09-09 19:59:44'),
(201, 2, 'CMC-BAT-142', 'Batman #142 (variante)', 4, 'DC Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(202, 3, 'CMC-BAT-142', 'Batman #142 (variante)', 4, 'DC Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/4/4d/BatmanComicIssue1%2C1940.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(203, 1, 'CMC-ASM-300', 'The Amazing Spider-Man #300', 4, 'Marvel Comics · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(204, 2, 'CMC-ASM-300', 'The Amazing Spider-Man #300', 4, 'Marvel Comics · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 2, 4, 'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(205, 3, 'CMC-ASM-300', 'The Amazing Spider-Man #300', 4, 'Marvel Comics · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 2, 4, 'https://upload.wikimedia.org/wikipedia/en/5/54/AmazingSpider-Man1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(206, 1, 'CMC-INV-1', 'Invincible #1', 4, 'Image Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 8, 4, 'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(207, 2, 'CMC-INV-1', 'Invincible #1', 4, 'Image Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(208, 3, 'CMC-INV-1', 'Invincible #1', 4, 'Image Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/0/07/Invincible_Issue_75.jpeg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(209, 1, 'CMC-XMEN-35', 'X-Men #35', 4, 'Marvel Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 12, 4, 'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(210, 2, 'CMC-XMEN-35', 'X-Men #35', 4, 'Marvel Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 10, 4, 'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(211, 3, 'CMC-XMEN-35', 'X-Men #35', 4, 'Marvel Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/6/61/X-Men_7_%282010%29%2C_Bachalo_variant_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(212, 1, 'CMC-WATCH-1', 'Watchmen #1', 4, 'DC Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(213, 2, 'CMC-WATCH-1', 'Watchmen #1', 4, 'DC Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(214, 3, 'CMC-WATCH-1', 'Watchmen #1', 4, 'DC Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(215, 1, 'CMC-DKR-1', 'The Dark Knight Returns #1', 4, 'DC Comics · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(216, 2, 'CMC-DKR-1', 'The Dark Knight Returns #1', 4, 'DC Comics · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(217, 3, 'CMC-DKR-1', 'The Dark Knight Returns #1', 4, 'DC Comics · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Batman_The_Dark_Knight_Returns_1_%28February_1986%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(218, 1, 'CMC-SAGA-1', 'Saga #1', 4, 'Image Comics · edición individual a color.', '', 75.00, 0.00, NULL, NULL, 0.160, 14, 4, 'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-09-01 17:18:43'),
(219, 2, 'CMC-SAGA-1', 'Saga #1', 4, 'Image Comics · edición individual a color.', '', 75.00, 0.00, NULL, NULL, 0.160, 11, 4, 'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(220, 3, 'CMC-SAGA-1', 'Saga #1', 4, 'Image Comics · edición individual a color.', '', 75.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/7/78/Saga1coverByFionaStaples.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(221, 1, 'CMC-VENOM-1', 'Venom #1', 4, 'Marvel Comics · edición individual a color.', '', 110.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-09-15 16:52:54'),
(222, 2, 'CMC-VENOM-1', 'Venom #1', 4, 'Marvel Comics · edición individual a color.', '', 110.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(223, 3, 'CMC-VENOM-1', 'Venom #1', 4, 'Marvel Comics · edición individual a color.', '', 110.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/8/86/Venom_Lethal_Protector_no_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(224, 1, 'CMC-FLPT-1', 'Flashpoint #1', 4, 'DC Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(225, 2, 'CMC-FLPT-1', 'Flashpoint #1', 4, 'DC Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(226, 3, 'CMC-FLPT-1', 'Flashpoint #1', 4, 'DC Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 2, 4, 'https://upload.wikimedia.org/wikipedia/en/f/fa/Flashpoint_%28DC_Comics%29.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(227, 1, 'CMC-SPAWN-1', 'Spawn #1', 4, 'Image Comics · edición individual a color.', '', 139.00, 0.00, NULL, NULL, 0.160, 8, 4, 'https://upload.wikimedia.org/wikipedia/en/d/d9/Spawn_Classic.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(228, 3, 'CMC-SPAWN-1', 'Spawn #1', 4, 'Image Comics · edición individual a color.', '', 139.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/d/d9/Spawn_Classic.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(229, 1, 'CMC-DP-1', 'Deadpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 13, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:28', '2026-09-01 19:01:22'),
(230, 2, 'CMC-DP-1', 'Deadpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(231, 3, 'CMC-DP-1', 'Deadpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 10, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(232, 1, 'CMC-WOLV-1', 'Wolverine #1', 4, 'Marvel Comics · edición individual a color.', '', 115.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(233, 2, 'CMC-WOLV-1', 'Wolverine #1', 4, 'Marvel Comics · edición individual a color.', '', 115.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(234, 3, 'CMC-WOLV-1', 'Wolverine #1', 4, 'Marvel Comics · edición individual a color.', '', 115.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/6/6d/Wolverine_%28vol._1%29_1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(235, 1, 'CMC-CW-1', 'Civil War #1', 4, 'Marvel Comics · edición individual a color.', '', 125.00, 0.00, NULL, NULL, 0.160, 0, 4, 'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-09-22 03:20:12'),
(236, 2, 'CMC-CW-1', 'Civil War #1', 4, 'Marvel Comics · edición individual a color.', '', 125.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(237, 3, 'CMC-CW-1', 'Civil War #1', 4, 'Marvel Comics · edición individual a color.', '', 125.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/2/23/Civil_War_7.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(238, 1, 'CMC-SECW-1', 'Secret Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 135.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(239, 2, 'CMC-SECW-1', 'Secret Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 135.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(240, 3, 'CMC-SECW-1', 'Secret Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 135.00, 0.00, NULL, NULL, 0.160, 2, 4, 'https://upload.wikimedia.org/wikipedia/en/0/08/Secretwars1.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(241, 1, 'CMC-AC-1000', 'Superman: Action Comics #1000', 4, 'DC Comics · edición individual a color.', '', 199.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-09-09 20:00:30'),
(242, 2, 'CMC-AC-1000', 'Superman: Action Comics #1000', 4, 'DC Comics · edición individual a color.', '', 199.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(243, 3, 'CMC-AC-1000', 'Superman: Action Comics #1000', 4, 'DC Comics · edición individual a color.', '', 199.00, 0.00, NULL, NULL, 0.160, 8, 4, 'https://upload.wikimedia.org/wikipedia/en/1/1c/Action_Comics_1000.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(244, 1, 'CMC-FLASH-1', 'The Flash #1', 4, 'DC Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 11, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(245, 2, 'CMC-FLASH-1', 'The Flash #1', 4, 'DC Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 8, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(246, 3, 'CMC-FLASH-1', 'The Flash #1', 4, 'DC Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b7/Flash_v1_105.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(247, 1, 'CMC-STW-1', 'Star Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-09-09 20:00:30'),
(248, 2, 'CMC-STW-1', 'Star Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(249, 3, 'CMC-STW-1', 'Star Wars #1', 4, 'Marvel Comics · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/0/02/Star_Wars_Vol_2-001_%282015%29.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(250, 1, 'CMC-THOR-1', 'Thor #1', 4, 'Marvel Comics · edición individual a color.', '', 105.00, 0.00, NULL, NULL, 0.160, 8, 4, 'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(251, 2, 'CMC-THOR-1', 'Thor #1', 4, 'Marvel Comics · edición individual a color.', '', 105.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(252, 3, 'CMC-THOR-1', 'Thor #1', 4, 'Marvel Comics · edición individual a color.', '', 105.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/a/aa/Thor126.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(253, 1, 'CMC-AVEN-1', 'Avengers #1', 4, 'Marvel Comics · edición individual a color.', '', 145.00, 0.00, NULL, NULL, 0.160, 2, 4, 'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-31 00:18:19'),
(254, 2, 'CMC-AVEN-1', 'Avengers #1', 4, 'Marvel Comics · edición individual a color.', '', 145.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(255, 3, 'CMC-AVEN-1', 'Avengers #1', 4, 'Marvel Comics · edición individual a color.', '', 145.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/8/84/Avengers-1.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(256, 1, 'CMC-DD-1', 'Daredevil #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 10, 4, 'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(257, 3, 'CMC-DD-1', 'Daredevil #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/1/14/Daredevil_65.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(258, 1, 'CMC-HQ-1', 'Harley Quinn #1', 4, 'DC Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 13, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(259, 2, 'CMC-HQ-1', 'Harley Quinn #1', 4, 'DC Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 10, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(260, 3, 'CMC-HQ-1', 'Harley Quinn #1', 4, 'DC Comics · edición individual a color.', '', 95.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b2/Harley_Quinn_comic_book.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(261, 1, 'CMC-SAND-1', 'The Sandman #1', 4, 'DC Vertigo · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(262, 2, 'CMC-SAND-1', 'The Sandman #1', 4, 'DC Vertigo · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(263, 3, 'CMC-SAND-1', 'The Sandman #1', 4, 'DC Vertigo · edición individual a color.', '', 129.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/8/85/Sandman_no.1_%28Modern_Age%29.comiccover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(264, 1, 'CMC-HB-1', 'Hellboy #1', 4, 'Dark Horse Comics · edición individual a color.', '', 139.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(265, 2, 'CMC-HB-1', 'Hellboy #1', 4, 'Dark Horse Comics · edición individual a color.', '', 139.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(266, 3, 'CMC-HB-1', 'Hellboy #1', 4, 'Dark Horse Comics · edición individual a color.', '', 139.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/a/ad/Hellboy_SoD_TPB_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(267, 1, 'CMC-TMNT-1', 'Teenage Mutant Ninja Turtles #1', 4, 'IDW Publishing · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(268, 2, 'CMC-TMNT-1', 'Teenage Mutant Ninja Turtles #1', 4, 'IDW Publishing · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(269, 3, 'CMC-TMNT-1', 'Teenage Mutant Ninja Turtles #1', 4, 'IDW Publishing · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/6/60/TMNT_IDW_no_2_cover.jpg', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(270, 1, 'CMC-MK-1', 'Moon Knight #1', 4, 'Marvel Comics · edición individual a color.', '', 105.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/4/4a/Moon_Knight_%28Marc_Spector%29.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(271, 2, 'CMC-MK-1', 'Moon Knight #1', 4, 'Marvel Comics · edición individual a color.', '', 105.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/4/4a/Moon_Knight_%28Marc_Spector%29.png', NULL, 'active', '2026-08-30 06:05:28', '2026-08-30 06:05:28'),
(272, 1, 'CMC-GWEN-1', 'Gwenpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 9, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(273, 2, 'CMC-GWEN-1', 'Gwenpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(274, 3, 'CMC-GWEN-1', 'Gwenpool #1', 4, 'Marvel Comics · edición individual a color.', '', 99.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(275, 1, 'CMC-GWEN-25', 'The Unbelievable Gwenpool #25', 4, 'Marvel Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 6, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(276, 2, 'CMC-GWEN-25', 'The Unbelievable Gwenpool #25', 4, 'Marvel Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(277, 3, 'CMC-GWEN-25', 'The Unbelievable Gwenpool #25', 4, 'Marvel Comics · edición individual a color.', '', 119.00, 0.00, NULL, NULL, 0.160, 3, 4, 'https://upload.wikimedia.org/wikipedia/en/b/b6/Gwenpool_2.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(278, 1, 'CMC-DP-45', 'Deadpool #45', 4, 'Marvel Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 7, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:41', '2026-09-09 18:38:51'),
(279, 2, 'CMC-DP-45', 'Deadpool #45', 4, 'Marvel Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(280, 3, 'CMC-DP-45', 'Deadpool #45', 4, 'Marvel Comics · edición individual a color.', '', 89.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(281, 1, 'CMC-UXM-266', 'Uncanny X-Men #266', 4, 'Marvel Comics · edición individual a color.', '', 145.00, 0.00, NULL, NULL, 0.160, 5, 4, 'https://upload.wikimedia.org/wikipedia/en/9/94/Gambit_%28Marvel_Comics%29.png', NULL, 'active', '2026-08-30 06:05:41', '2026-09-05 08:03:02'),
(282, 3, 'CMC-UXM-266', 'Uncanny X-Men #266', 4, 'Marvel Comics · edición individual a color.', '', 145.00, 0.00, NULL, NULL, 0.160, 4, 4, 'https://upload.wikimedia.org/wikipedia/en/9/94/Gambit_%28Marvel_Comics%29.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(283, 1, 'MNG-OP-102', 'One Piece Vol. 102', 1, 'Panini Manga · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 17, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-09-09 20:00:12'),
(284, 2, 'MNG-OP-102', 'One Piece Vol. 102', 1, 'Panini Manga · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 12, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(285, 3, 'MNG-OP-102', 'One Piece Vol. 102', 1, 'Panini Manga · edición individual a color.', '', 159.00, 0.00, NULL, NULL, 0.160, 9, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30013-BeslEMqiPhlk.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(286, 1, 'MNG-JJK-24', 'Jujutsu Kaisen Vol. 24', 1, 'Panini Manga · edición individual a color.', '', 189.00, 0.00, NULL, NULL, 0.160, 14, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-09-09 02:25:29'),
(287, 2, 'MNG-JJK-24', 'Jujutsu Kaisen Vol. 24', 1, 'Panini Manga · edición individual a color.', '', 189.00, 0.00, NULL, NULL, 0.160, 10, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-09-09 02:25:29'),
(288, 3, 'MNG-JJK-24', 'Jujutsu Kaisen Vol. 24', 1, 'Panini Manga · edición individual a color.', '', 189.00, 0.00, NULL, NULL, 0.160, 7, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx101517-H3TdM3g5ZUe9.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-09-09 02:25:29'),
(289, 1, 'MNG-DS-23', 'Demon Slayer: Kimetsu no Yaiba Vol. 23', 1, 'Panini Manga · edición individual a color.', '', 149.00, 0.00, NULL, NULL, 0.160, 11, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(290, 2, 'MNG-DS-23', 'Demon Slayer: Kimetsu no Yaiba Vol. 23', 1, 'Panini Manga · edición individual a color.', '', 149.00, 0.00, NULL, NULL, 0.160, 8, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(291, 3, 'MNG-DS-23', 'Demon Slayer: Kimetsu no Yaiba Vol. 23', 1, 'Panini Manga · edición individual a color.', '', 149.00, 0.00, NULL, NULL, 0.160, 6, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx87216-c9bSNVD10UuD.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(292, 1, 'MNG-DBS-18', 'Dragon Ball Super Vol. 18', 1, 'Panini Manga · edición individual a color.', '', 155.00, 0.00, NULL, NULL, 0.160, 9, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx86508-QSahE7mTFEXl.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(293, 3, 'MNG-DBS-18', 'Dragon Ball Super Vol. 18', 1, 'Panini Manga · edición individual a color.', '', 155.00, 0.00, NULL, NULL, 0.160, 5, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx86508-QSahE7mTFEXl.png', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(294, 1, 'MNG-BSK-41', 'Berserk Vol. 41', 1, 'Panini Manga · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 5, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(295, 2, 'MNG-BSK-41', 'Berserk Vol. 41', 1, 'Panini Manga · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 3, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(296, 3, 'MNG-BSK-41', 'Berserk Vol. 41', 1, 'Panini Manga · edición individual a color.', '', 349.00, 0.00, NULL, NULL, 0.160, 2, 4, 'catalog/image?src=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fmanga%2Fcover%2Flarge%2Fbx30002-Cul4OeN7bYtn.jpg', NULL, 'active', '2026-08-30 06:05:41', '2026-08-30 06:05:41'),
(309, 1, 'FIG-KOTO-ARTORIA17', 'Artoria Pendragon 1/7', 2, 'Kotobukiya · Escala 1/7 · Fate, línea ArtFX J. PVC, ~25 cm.', '', 3800.00, 0.00, NULL, NULL, 0.160, 2, 2, 'catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=front,catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=side,catalog/cover?kind=figura&pub=KOTOBUKIYA&accent=%23ffd400&t=Artoria%20Pendragon%201%2F7&a=back', NULL, 'inactive', '2026-08-30 06:05:54', '2026-09-08 17:46:50');
INSERT INTO `products` (`id`, `branch_id`, `sku`, `name`, `category_id`, `description`, `tags`, `price`, `discount_percent`, `discount_starts_at`, `discount_ends_at`, `tax_rate`, `stock`, `min_stock`, `image_url`, `figure_png_url`, `status`, `created_at`, `updated_at`) VALUES
(312, 1, 'FIG-POP-UP-PARADE-LUCY-L-S', 'POP UP PARADE Lucy L Size', 2, 'Good Smile Company · comprala ta buena', '', 6767.00, 0.00, NULL, NULL, 0.160, 12, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/mx8wfBHLnJ4Uqs5iXc3k9PtFCZKuN61E.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/day2iTL1msPYDXhUZ4bFrcGvW0wpfHMj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/1UYHnA0Dmaj7Mqe94cr3fTWNtJQ65GLB.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260830_071156_760da17d411f.png', 'active', '2026-08-30 07:11:56', '2026-08-31 00:09:50'),
(313, 2, 'FIG-POP-UP-PARADE-LUCY-L-S', 'POP UP PARADE Lucy L Size', 2, 'Good Smile Company · comprala ta buena', '', 6767.00, 0.00, NULL, NULL, 0.160, 2, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/mx8wfBHLnJ4Uqs5iXc3k9PtFCZKuN61E.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/day2iTL1msPYDXhUZ4bFrcGvW0wpfHMj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/1UYHnA0Dmaj7Mqe94cr3fTWNtJQ65GLB.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260830_071156_760da17d411f.png', 'active', '2026-08-30 07:11:56', '2026-08-30 07:11:56'),
(314, 3, 'FIG-POP-UP-PARADE-LUCY-L-S', 'POP UP PARADE Lucy L Size', 2, 'Good Smile Company · comprala ta buena', '', 6767.00, 0.00, NULL, NULL, 0.160, 2, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/mx8wfBHLnJ4Uqs5iXc3k9PtFCZKuN61E.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/day2iTL1msPYDXhUZ4bFrcGvW0wpfHMj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1137607/1UYHnA0Dmaj7Mqe94cr3fTWNtJQ65GLB.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260830_071156_760da17d411f.png', 'active', '2026-08-30 07:11:56', '2026-08-30 07:11:56'),
(316, 1, 'FIG-POP-UP-PARADE-MAKIMA', 'POP UP PARADE Makima', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE is a series of figures that are easy to collect with affordable prices and speedy releases! Each figure typically stands around 17-18cm in height and the series features a vast selection of characters from popular anime and game series, with many more to be added soon!', 'novedad', 1500.00, 0.00, NULL, NULL, 0.160, 65, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110184/large/0425fed1f79565aa2ac05502b17cd22b.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110187/large/1432cb9e547c04568e355f0efcdc18c3.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110186/large/557f9e50e6790da88992f7e5dc8aa7ef.jpg,https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_57d0691b4ed3.png', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_5be3c3e21fb5.png', 'active', '2026-09-08 18:15:44', '2026-09-25 22:13:00'),
(317, 2, 'FIG-POP-UP-PARADE-MAKIMA', 'POP UP PARADE Makima', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE is a series of figures that are easy to collect with affordable prices and speedy releases! Each figure typically stands around 17-18cm in height and the series features a vast selection of characters from popular anime and game series, with many more to be added soon!', 'novedad', 1500.00, 0.00, NULL, NULL, 0.160, 67, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110184/large/0425fed1f79565aa2ac05502b17cd22b.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110187/large/1432cb9e547c04568e355f0efcdc18c3.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110186/large/557f9e50e6790da88992f7e5dc8aa7ef.jpg,https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_57d0691b4ed3.png', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_5be3c3e21fb5.png', 'active', '2026-09-08 18:15:44', '2026-09-08 18:15:44'),
(318, 3, 'FIG-POP-UP-PARADE-MAKIMA', 'POP UP PARADE Makima', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE is a series of figures that are easy to collect with affordable prices and speedy releases! Each figure typically stands around 17-18cm in height and the series features a vast selection of characters from popular anime and game series, with many more to be added soon!', 'novedad', 1500.00, 0.00, NULL, NULL, 0.160, 67, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110184/large/0425fed1f79565aa2ac05502b17cd22b.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110187/large/1432cb9e547c04568e355f0efcdc18c3.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110186/large/557f9e50e6790da88992f7e5dc8aa7ef.jpg,https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_57d0691b4ed3.png', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_5be3c3e21fb5.png', 'active', '2026-09-08 18:15:44', '2026-09-08 18:15:44'),
(319, 4, 'FIG-POP-UP-PARADE-MAKIMA', 'POP UP PARADE Makima', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE is a series of figures that are easy to collect with affordable prices and speedy releases! Each figure typically stands around 17-18cm in height and the series features a vast selection of characters from popular anime and game series, with many more to be added soon!', 'novedad', 1500.00, 0.00, NULL, NULL, 0.160, 67, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110184/large/0425fed1f79565aa2ac05502b17cd22b.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110187/large/1432cb9e547c04568e355f0efcdc18c3.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20230119/13817/110186/large/557f9e50e6790da88992f7e5dc8aa7ef.jpg,https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_57d0691b4ed3.png', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_181544_5be3c3e21fb5.png', 'active', '2026-09-08 18:15:44', '2026-09-08 18:15:44'),
(321, 1, 'PKM-POR-21', 'Mega Starmie ex · Perfect Order', 3, 'Pokémon · Water · Double Rare · Perfect Order #21 · HP 330', '', 67.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://images.scrydex.com/pokemon/me3-21/large', NULL, 'active', '2026-09-08 18:20:23', '2026-09-08 18:20:23'),
(322, 2, 'PKM-POR-21', 'Mega Starmie ex · Perfect Order', 3, 'Pokémon · Water · Double Rare · Perfect Order #21 · HP 330', '', 67.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://images.scrydex.com/pokemon/me3-21/large', NULL, 'active', '2026-09-08 18:20:23', '2026-09-08 18:20:23'),
(323, 3, 'PKM-POR-21', 'Mega Starmie ex · Perfect Order', 3, 'Pokémon · Water · Double Rare · Perfect Order #21 · HP 330', '', 67.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://images.scrydex.com/pokemon/me3-21/large', NULL, 'active', '2026-09-08 18:20:23', '2026-09-08 18:20:23'),
(324, 4, 'PKM-POR-21', 'Mega Starmie ex · Perfect Order', 3, 'Pokémon · Water · Double Rare · Perfect Order #21 · HP 330', '', 67.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://images.scrydex.com/pokemon/me3-21/large', NULL, 'active', '2026-09-08 18:20:23', '2026-09-08 18:20:23'),
(326, 1, 'FIG-POP-UP-PARADE-SP-JETT', 'POP UP PARADE SP Jett', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE SP is a branch of POP UP PARADE figures that transcends the boundaries of the regular POP UP PARADE lineup with special surprises! This installment features a special figure that is impressive in both volume and details!', '', 1200.00, 0.00, NULL, NULL, 0.160, 9, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/hrx5e4bTSpcA3ZQ8Ld9HWkC1mwVJzqyK.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/kYCiKe7S0aXrTun28B3Nf5xqbRJc6VPj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/MNCYQfJ1V4ua5zX3ETeD7UbqRjhBKgkd.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_182525_44872eb04057.png', 'active', '2026-09-08 18:25:26', '2026-09-12 02:11:30'),
(327, 2, 'FIG-POP-UP-PARADE-SP-JETT', 'POP UP PARADE SP Jett', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE SP is a branch of POP UP PARADE figures that transcends the boundaries of the regular POP UP PARADE lineup with special surprises! This installment features a special figure that is impressive in both volume and details!', '', 1200.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/hrx5e4bTSpcA3ZQ8Ld9HWkC1mwVJzqyK.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/kYCiKe7S0aXrTun28B3Nf5xqbRJc6VPj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/MNCYQfJ1V4ua5zX3ETeD7UbqRjhBKgkd.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_182525_44872eb04057.png', 'active', '2026-09-08 18:25:26', '2026-09-08 19:43:47'),
(328, 3, 'FIG-POP-UP-PARADE-SP-JETT', 'POP UP PARADE SP Jett', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE SP is a branch of POP UP PARADE figures that transcends the boundaries of the regular POP UP PARADE lineup with special surprises! This installment features a special figure that is impressive in both volume and details!', '', 1200.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/hrx5e4bTSpcA3ZQ8Ld9HWkC1mwVJzqyK.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/kYCiKe7S0aXrTun28B3Nf5xqbRJc6VPj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/MNCYQfJ1V4ua5zX3ETeD7UbqRjhBKgkd.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_182525_44872eb04057.png', 'active', '2026-09-08 18:25:26', '2026-09-08 19:43:47'),
(329, 4, 'FIG-POP-UP-PARADE-SP-JETT', 'POP UP PARADE SP Jett', 2, 'Good Smile Company · POP UP PARADE · POP UP PARADE SP is a branch of POP UP PARADE figures that transcends the boundaries of the regular POP UP PARADE lineup with special surprises! This installment features a special figure that is impressive in both volume and details!', '', 1200.00, 0.00, NULL, NULL, 0.160, 10, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/hrx5e4bTSpcA3ZQ8Ld9HWkC1mwVJzqyK.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/kYCiKe7S0aXrTun28B3Nf5xqbRJc6VPj.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1141572/MNCYQfJ1V4ua5zX3ETeD7UbqRjhBKgkd.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_182525_44872eb04057.png', 'active', '2026-09-08 18:25:26', '2026-09-08 19:43:47'),
(331, 1, 'FIG-NENDOROID-SADAKO', 'Nendoroid Sadako', 2, 'Good Smile Company · Nendoroid · Sadako is joining the Nendoroid series! The Nendoroid comes with two interchangeable face plates: a grinning face and a vicious evil face for when she attacks her victims. Optional parts include Sadako\'s well and a video tape.\n\nA background sheet to display her crawling out of a TV is also included. In addition to standard front hair part, a front hair part to display her with one eye visible and a front hair part to display her with her hair falling to the groun', 'novedad', 1000.00, 0.00, NULL, NULL, 0.160, 12, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106345/large/5c2f4ca402f26e83dc7a3d034f25d565.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106346/large/9eb3bc371870b3e02d294e8cf6bb868c.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106347/large/2ae2f1b0e5cd5475fdd87ce6156b1202.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106348/large/3f1b69d38a4fd5a7a811abf455b8bdb1.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106349/large/45f06c47929c64c55ef0757b540b5306.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_194118_3dc99b6684d1.png', 'active', '2026-09-08 18:31:08', '2026-09-08 19:41:19'),
(332, 2, 'FIG-NENDOROID-SADAKO', 'Nendoroid Sadako', 2, 'Good Smile Company · Nendoroid · Sadako is joining the Nendoroid series! The Nendoroid comes with two interchangeable face plates: a grinning face and a vicious evil face for when she attacks her victims. Optional parts include Sadako\'s well and a video tape.\n\nA background sheet to display her crawling out of a TV is also included. In addition to standard front hair part, a front hair part to display her with one eye visible and a front hair part to display her with her hair falling to the groun', 'novedad', 1000.00, 0.00, NULL, NULL, 0.160, 12, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106345/large/5c2f4ca402f26e83dc7a3d034f25d565.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106346/large/9eb3bc371870b3e02d294e8cf6bb868c.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106347/large/2ae2f1b0e5cd5475fdd87ce6156b1202.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106348/large/3f1b69d38a4fd5a7a811abf455b8bdb1.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106349/large/45f06c47929c64c55ef0757b540b5306.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_194118_3dc99b6684d1.png', 'active', '2026-09-08 18:31:08', '2026-09-08 19:41:19'),
(333, 3, 'FIG-NENDOROID-SADAKO', 'Nendoroid Sadako', 2, 'Good Smile Company · Nendoroid · Sadako is joining the Nendoroid series! The Nendoroid comes with two interchangeable face plates: a grinning face and a vicious evil face for when she attacks her victims. Optional parts include Sadako\'s well and a video tape.\n\nA background sheet to display her crawling out of a TV is also included. In addition to standard front hair part, a front hair part to display her with one eye visible and a front hair part to display her with her hair falling to the groun', 'novedad', 1000.00, 0.00, NULL, NULL, 0.160, 12, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106345/large/5c2f4ca402f26e83dc7a3d034f25d565.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106346/large/9eb3bc371870b3e02d294e8cf6bb868c.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106347/large/2ae2f1b0e5cd5475fdd87ce6156b1202.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106348/large/3f1b69d38a4fd5a7a811abf455b8bdb1.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106349/large/45f06c47929c64c55ef0757b540b5306.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_194118_3dc99b6684d1.png', 'active', '2026-09-08 18:31:08', '2026-09-08 19:41:19'),
(334, 4, 'FIG-NENDOROID-SADAKO', 'Nendoroid Sadako', 2, 'Good Smile Company · Nendoroid · Sadako is joining the Nendoroid series! The Nendoroid comes with two interchangeable face plates: a grinning face and a vicious evil face for when she attacks her victims. Optional parts include Sadako\'s well and a video tape.\n\nA background sheet to display her crawling out of a TV is also included. In addition to standard front hair part, a front hair part to display her with one eye visible and a front hair part to display her with her hair falling to the groun', 'novedad', 1000.00, 0.00, NULL, NULL, 0.160, 12, 3, 'https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106345/large/5c2f4ca402f26e83dc7a3d034f25d565.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106346/large/9eb3bc371870b3e02d294e8cf6bb868c.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106347/large/2ae2f1b0e5cd5475fdd87ce6156b1202.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106348/large/3f1b69d38a4fd5a7a811abf455b8bdb1.jpg,https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20221024/13452/106349/large/45f06c47929c64c55ef0757b540b5306.jpg', 'https://seashell-gorilla-962180.hostingersite.com/uploads/products/20260908_194118_3dc99b6684d1.png', 'active', '2026-09-08 18:31:08', '2026-09-08 19:41:19'),
(336, 1, 'PKM-POP8-2', 'Lucario · POP Series 8', 3, 'Pokémon · Fighting · Rare · POP Series 8 #2 · HP 90', '', 501.20, 0.00, NULL, NULL, 0.160, 3, 3, 'https://images.pokemontcg.io/pop8/2_hires.png', NULL, 'active', '2026-09-08 18:34:52', '2026-09-08 18:34:52'),
(337, 2, 'PKM-POP8-2', 'Lucario · POP Series 8', 3, 'Pokémon · Fighting · Rare · POP Series 8 #2 · HP 90', '', 501.20, 0.00, NULL, NULL, 0.160, 3, 3, 'https://images.pokemontcg.io/pop8/2_hires.png', NULL, 'active', '2026-09-08 18:34:53', '2026-09-08 18:34:53'),
(338, 3, 'PKM-POP8-2', 'Lucario · POP Series 8', 3, 'Pokémon · Fighting · Rare · POP Series 8 #2 · HP 90', '', 501.20, 0.00, NULL, NULL, 0.160, 4, 3, 'https://images.pokemontcg.io/pop8/2_hires.png', NULL, 'active', '2026-09-08 18:34:53', '2026-09-08 18:34:53'),
(339, 4, 'PKM-POP8-2', 'Lucario · POP Series 8', 3, 'Pokémon · Fighting · Rare · POP Series 8 #2 · HP 90', '', 501.20, 0.00, NULL, NULL, 0.160, 2, 3, 'https://images.pokemontcg.io/pop8/2_hires.png', NULL, 'active', '2026-09-08 18:34:53', '2026-09-08 18:34:53'),
(341, 4, 'PKM-PFL-109', 'Mega Charizard X ex · Phantasmal Flames', 3, 'Pokémon · Fire · Ultra Rare · Phantasmal Flames #109 · HP 360', '', 546.00, 0.00, NULL, NULL, 0.160, 3, 3, 'https://images.pokemontcg.io/me2/109_hires.png', NULL, 'active', '2026-09-08 19:06:37', '2026-09-08 19:06:37'),
(342, 1, 'MNG-JJK-17', 'Jujutsu Kaisen Vol. 17', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-08 19:47:38', '2026-09-09 02:25:14'),
(343, 2, 'MNG-JJK-17', 'Jujutsu Kaisen Vol. 17', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-08 19:47:38', '2026-09-09 02:25:14'),
(344, 3, 'MNG-JJK-17', 'Jujutsu Kaisen Vol. 17', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-08 19:47:38', '2026-09-09 02:25:14'),
(345, 4, 'MNG-JJK-17', 'Jujutsu Kaisen Vol. 17', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-08 19:47:38', '2026-09-09 02:25:14'),
(346, 4, 'MNG-JJK-01', 'Jujutsu Kaisen Vol. 1', 1, 'Yuji Itadori se traga un dedo maldito y comparte cuerpo con Ryomen Sukuna. Ahora estudia hechicería para exorcizar maldiciones. · 27 tomos', '', 189.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-08 19:47:38', '2026-09-09 02:24:58'),
(349, 1, 'MNG-AOT-01', 'Attack on Titan Vol. 1', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:24', '2026-09-10 01:20:24'),
(350, 2, 'MNG-AOT-01', 'Attack on Titan Vol. 1', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 3, 3, '', NULL, 'active', '2026-09-10 01:20:24', '2026-09-10 01:20:24'),
(351, 3, 'MNG-AOT-01', 'Attack on Titan Vol. 1', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:24', '2026-09-10 01:20:24'),
(352, 4, 'MNG-AOT-01', 'Attack on Titan Vol. 1', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:24', '2026-09-10 01:20:24'),
(353, 1, 'MNG-AOT-04', 'Attack on Titan Vol. 4', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:33', '2026-09-10 01:20:33'),
(354, 2, 'MNG-AOT-04', 'Attack on Titan Vol. 4', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 4, 3, '', NULL, 'active', '2026-09-10 01:20:33', '2026-09-10 01:20:38'),
(355, 3, 'MNG-AOT-04', 'Attack on Titan Vol. 4', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:33', '2026-09-10 01:20:33'),
(356, 4, 'MNG-AOT-04', 'Attack on Titan Vol. 4', 1, 'La humanidad vive tras enormes muros para protegerse de los Titanes. Cuando un Titán Colosal derriba la muralla, Eren Jaeger jura exterminarlos a todos. · 34 tomos', '', 169.00, 0.00, NULL, NULL, 0.160, 0, 3, '', NULL, 'active', '2026-09-10 01:20:33', '2026-09-10 01:20:33'),
(357, 2, 'COL-GSDJ', 'gsdj', 5, 'ssdfg · dg · wd', '', 1.00, 0.00, NULL, NULL, 0.160, 1, 3, '', 'wd', 'active', '2026-09-10 17:55:51', '2026-09-10 17:55:51'),
(359, 1, 'PKM-SMA-SV64', 'Lucario-GX · Hidden Fates Shiny Vault', 3, 'Pokémon · Fighting · Rare Shiny GX · Hidden Fates Shiny Vault #SV64 · HP 210', '', 1689.00, 0.00, NULL, NULL, 0.160, 1, 3, 'https://images.pokemontcg.io/sma/SV64_hires.png', NULL, 'active', '2026-09-12 02:40:40', '2026-09-12 02:40:40'),
(360, 2, 'PKM-SMA-SV64', 'Lucario-GX · Hidden Fates Shiny Vault', 3, 'Pokémon · Fighting · Rare Shiny GX · Hidden Fates Shiny Vault #SV64 · HP 210', '', 1689.00, 0.00, NULL, NULL, 0.160, 1, 3, 'https://images.pokemontcg.io/sma/SV64_hires.png', NULL, 'active', '2026-09-12 02:40:40', '2026-09-12 02:40:40'),
(361, 3, 'PKM-SMA-SV64', 'Lucario-GX · Hidden Fates Shiny Vault', 3, 'Pokémon · Fighting · Rare Shiny GX · Hidden Fates Shiny Vault #SV64 · HP 210', '', 1689.00, 0.00, NULL, NULL, 0.160, 1, 3, 'https://images.pokemontcg.io/sma/SV64_hires.png', NULL, 'active', '2026-09-12 02:40:40', '2026-09-12 02:40:40'),
(362, 4, 'PKM-SMA-SV64', 'Lucario-GX · Hidden Fates Shiny Vault', 3, 'Pokémon · Fighting · Rare Shiny GX · Hidden Fates Shiny Vault #SV64 · HP 210', '', 1689.00, 0.00, NULL, NULL, 0.160, 1, 3, 'https://images.pokemontcg.io/sma/SV64_hires.png', NULL, 'active', '2026-09-12 02:40:40', '2026-09-12 02:40:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registers`
--

CREATE TABLE `registers` (
  `id` int(10) UNSIGNED NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `registers`
--

INSERT INTO `registers` (`id`, `branch_id`, `name`, `status`, `created_at`) VALUES
(1, 1, 'Caja 1 — Entrada', 'active', '2026-08-30 06:03:46'),
(2, 1, 'Caja 2 — Planta alta', 'active', '2026-08-30 06:03:46'),
(3, 2, 'Caja 1 — Principal', 'active', '2026-08-30 06:03:46'),
(4, 2, 'Caja 2 — TCG', 'active', '2026-08-30 06:03:46'),
(5, 3, 'Caja 1 — Principal', 'active', '2026-08-30 06:03:46'),
(8, 4, 'Caja 1', 'active', '2026-09-04 06:17:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservations`
--

CREATE TABLE `reservations` (
  `id` int(10) UNSIGNED NOT NULL,
  `folio` varchar(16) NOT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(120) NOT NULL,
  `customer_email` varchar(160) NOT NULL DEFAULT '',
  `customer_phone` varchar(40) NOT NULL DEFAULT '',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pendiente','lista','cobrada','cancelada') NOT NULL DEFAULT 'pendiente',
  `note` varchar(255) NOT NULL DEFAULT '',
  `sale_id` bigint(20) UNSIGNED DEFAULT NULL,
  `resolved_by` int(10) UNSIGNED DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reservations`
--

INSERT INTO `reservations` (`id`, `folio`, `branch_id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `subtotal`, `tax`, `total`, `status`, `note`, `sale_id`, `resolved_by`, `ready_at`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 'GP-2909', 2, NULL, 'Keyli govea rodriguez', 'keyli.karina.kk1lv@gmail.com', '+523141616404', 1629.31, 260.69, 1890.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-08-31 00:03:46', '2026-08-31 00:03:46'),
(2, 'GP-9542', NULL, NULL, 'jghhjghgjgh', '', '', 1489.66, 238.34, 1728.00, 'cobrada', '', NULL, 5, NULL, '2026-09-01 17:14:07', '2026-09-01 17:11:23', '2026-09-01 17:14:07'),
(3, 'GP-2485', 3, NULL, 'sixseven', '', '', 6073.28, 971.72, 7045.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-01 17:16:24', '2026-09-01 17:16:24'),
(4, 'GP-4770', 1, NULL, 'sixseven', '', '', 2150.00, 344.00, 2494.00, 'cobrada', '', NULL, 5, NULL, '2026-09-01 17:18:10', '2026-09-01 17:17:37', '2026-09-01 17:18:10'),
(5, 'GP-5861', 1, NULL, 'sixseven', '', '', 6082.76, 973.24, 7056.00, 'cobrada', '', NULL, 5, NULL, '2026-09-01 17:19:48', '2026-09-01 17:19:31', '2026-09-01 17:19:48'),
(6, 'GP-2634', 1, NULL, 'sevensix', '', '', 6082.76, 973.24, 7056.00, 'cobrada', '', NULL, 5, NULL, '2026-09-01 17:20:59', '2026-09-01 17:20:37', '2026-09-01 17:20:59'),
(7, 'GP-0678', 1, NULL, 'fercho', '', '', 5833.62, 933.38, 6767.00, 'cobrada', '', NULL, 5, NULL, '2026-09-01 19:01:43', '2026-09-01 19:00:31', '2026-09-01 19:01:43'),
(8, 'GP-3128', 1, NULL, 'MNBFVMDVBMDVBN', '', '', 2564.66, 410.34, 2975.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-02 22:16:49', '2026-09-02 22:16:49'),
(9, 'GP-1871', NULL, NULL, 'marcou', '', '', 1568.10, 250.90, 1819.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-08 15:16:44', '2026-09-08 15:16:44'),
(10, 'GP-8608', 1, NULL, 'david', '', '', 111.21, 17.79, 129.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-08 19:03:43', '2026-09-08 19:03:43'),
(11, 'GP-4715', 1, NULL, 'carolina', '', '', 287.93, 46.07, 334.00, 'cobrada', '', NULL, 1, NULL, '2026-09-09 18:35:14', '2026-09-09 18:34:36', '2026-09-09 18:35:14'),
(12, 'GP-1944', 2, NULL, 'jhfjy', '', '', 154.31, 24.69, 179.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-09 21:54:18', '2026-09-09 21:54:18'),
(13, 'GP-2091', NULL, NULL, 'sadsad', '', '', 1766.38, 282.62, 2049.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-10 00:14:56', '2026-09-10 00:14:56'),
(14, 'GP-8894', 1, NULL, '467', 'dsg@f', '-kl', 119.83, 19.17, 139.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-10 17:48:54', '2026-09-10 17:48:54'),
(15, 'GP-5719', 2, NULL, 'miirinda', 'hola@gmail.com', '123455', 137.07, 21.93, 159.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-10 19:27:44', '2026-09-10 19:27:44'),
(16, 'GP-9246', 1, NULL, 'jhhgf', '', '', 1293.10, 206.90, 1500.00, 'cobrada', '', NULL, 2, NULL, '2026-09-10 19:28:34', '2026-09-10 19:28:08', '2026-09-10 19:28:34'),
(17, 'GP-6194', 1, NULL, 'juan pablo', '', '', 270.69, 43.31, 314.00, 'cobrada', '', NULL, 5, NULL, '2026-09-11 19:11:54', '2026-09-11 19:11:26', '2026-09-11 19:11:54'),
(18, 'GP-7552', 1, NULL, 'TRAFALGAR', '', '', 1034.48, 165.52, 1200.00, 'cobrada', '', NULL, 5, NULL, '2026-09-12 02:11:28', '2026-09-12 02:08:57', '2026-09-12 02:11:28'),
(19, 'GP-9273', 1, NULL, 'TKJDSHAJKDAS', '', '', 1034.48, 165.52, 1200.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-09-12 02:10:19', '2026-09-12 02:10:19'),
(20, 'GP-0362', 1, 9, 'marco antonio Yanez Gonzalez', 'asdasd@gmail.com', '321313', 102.59, 16.41, 119.00, 'lista', '', NULL, NULL, '2026-09-22 07:37:31', NULL, '2026-09-22 07:37:03', '2026-09-22 07:37:31'),
(21, 'GP-5332', 1, NULL, 'asdfghjkl', '', '', 133.62, 21.38, 155.00, 'cobrada', '', NULL, 5, NULL, '2026-09-25 22:16:05', '2026-09-25 22:15:22', '2026-09-25 22:16:05'),
(22, 'GP-1770', 2, NULL, 'hghghgh', '', '', 145.69, 23.31, 169.00, 'pendiente', '', NULL, NULL, NULL, NULL, '2026-10-01 16:04:18', '2026-10-01 16:04:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservation_items`
--

CREATE TABLE `reservation_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `reservation_id` int(10) UNSIGNED NOT NULL,
  `product_ref` varchar(64) NOT NULL DEFAULT '',
  `is_preventa` tinyint(1) NOT NULL DEFAULT 0,
  `title` varchar(200) NOT NULL,
  `list_unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `unit_discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `line_total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reservation_items`
--

INSERT INTO `reservation_items` (`id`, `reservation_id`, `product_ref`, `is_preventa`, `title`, `list_unit_price`, `discount_percent`, `unit_discount`, `unit_price`, `quantity`, `line_total`) VALUES
(1, 1, 'local-figuras-fig-luffy-g5', 0, 'Figura Luffy Gear 5 S.H.F.', 1890.00, 0.00, 0.00, 1890.00, 1, 1890.00),
(2, 2, 'local-manga-mng-s-sxf-v4', 0, 'Spy x Family Vol. 4', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(3, 2, 'local-comics-cmc-asm-300', 0, 'The Amazing Spider-Man #300', 349.00, 0.00, 0.00, 349.00, 1, 349.00),
(4, 2, 'local-figuras-fig-gsc-erenpup', 0, 'Eren Yeager Titan Form - POP UP PARADE', 1200.00, 0.00, 0.00, 1200.00, 1, 1200.00),
(5, 3, 'local-comics-cmc-gwen-1', 0, 'Gwenpool #1', 99.00, 0.00, 0.00, 99.00, 1, 99.00),
(6, 3, 'local-figuras-fig-pop-up-parade-lucy-l-s', 0, 'POP UP PARADE Lucy L Size', 6767.00, 0.00, 0.00, 6767.00, 1, 6767.00),
(7, 3, 'local-manga-mng-s-sxf', 0, 'Spy x Family', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(8, 4, 'local-comics-cmc-stw-1', 0, 'Star Wars #1', 129.00, 0.00, 0.00, 129.00, 1, 129.00),
(9, 4, 'local-figuras-fig-mikasa-17', 0, 'Figura Mikasa 1/7', 2290.00, 0.00, 0.00, 2290.00, 1, 2290.00),
(10, 4, 'local-comics-cmc-saga-1', 0, 'Saga #1', 75.00, 0.00, 0.00, 75.00, 1, 75.00),
(11, 5, 'local-figuras-fig-pop-up-parade-lucy-l-s', 0, 'POP UP PARADE Lucy L Size', 6767.00, 0.00, 0.00, 6767.00, 1, 6767.00),
(12, 5, 'local-comics-cmc-venom-1', 0, 'Venom #1', 110.00, 0.00, 0.00, 110.00, 1, 110.00),
(13, 5, 'local-manga-mng-s-csm', 0, 'Chainsaw Man', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(14, 6, 'local-figuras-fig-pop-up-parade-lucy-l-s', 0, 'POP UP PARADE Lucy L Size', 6767.00, 0.00, 0.00, 6767.00, 1, 6767.00),
(15, 6, 'local-comics-cmc-venom-1', 0, 'Venom #1', 110.00, 0.00, 0.00, 110.00, 1, 110.00),
(16, 6, 'local-manga-mng-s-csm', 0, 'Chainsaw Man', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(17, 7, 'local-figuras-fig-pop-up-parade-lucy-l-s', 0, 'POP UP PARADE Lucy L Size', 6767.00, 0.00, 0.00, 6767.00, 1, 6767.00),
(18, 8, 'local-manga-mng-s-tg-v1', 0, 'Tokyo Ghoul Vol. 1', 165.00, 0.00, 0.00, 165.00, 1, 165.00),
(19, 8, 'local-manga-mng-s-blk-v5', 0, 'Blue Lock Vol. 5', 169.00, 0.00, 0.00, 169.00, 1, 169.00),
(20, 8, 'local-manga-mng-s-kgy', 0, 'Kaguya-sama: Love is War', 169.00, 0.00, 0.00, 169.00, 1, 169.00),
(21, 8, 'local-manga-mng-s-fma', 0, 'Fullmetal Alchemist', 189.00, 0.00, 0.00, 189.00, 1, 189.00),
(22, 8, 'local-manga-mng-s-hxh', 0, 'Hunter x Hunter', 159.00, 0.00, 0.00, 159.00, 1, 159.00),
(23, 8, 'local-manga-mng-s-jjk', 0, 'Jujutsu Kaisen', 189.00, 0.00, 0.00, 189.00, 1, 189.00),
(24, 8, 'local-manga-mng-s-sxf', 0, 'Spy x Family', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(25, 8, 'local-manga-mng-s-ble', 0, 'Bleach', 159.00, 0.00, 0.00, 159.00, 1, 159.00),
(26, 8, 'local-manga-mng-s-frn', 0, 'Frieren: Beyond Journey\'s End', 175.00, 0.00, 0.00, 175.00, 1, 175.00),
(27, 8, 'local-manga-mng-s-dnd', 0, 'Dandadan', 175.00, 0.00, 0.00, 175.00, 1, 175.00),
(28, 8, 'local-manga-mng-s-csm', 0, 'Chainsaw Man', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(29, 8, 'series-dragon-ball-super', 0, 'Dragon Ball Super', 155.00, 0.00, 0.00, 155.00, 1, 155.00),
(30, 8, 'local-manga-mng-s-tg', 0, 'Tokyo Ghoul', 165.00, 0.00, 0.00, 165.00, 1, 165.00),
(31, 8, 'local-manga-mng-s-bsk', 0, 'Berserk', 349.00, 0.00, 0.00, 349.00, 1, 349.00),
(32, 8, 'local-manga-mng-s-dn', 0, 'Death Note', 149.00, 0.00, 0.00, 149.00, 1, 149.00),
(33, 8, 'local-manga-mng-s-hq', 0, 'Haikyu!!', 155.00, 0.00, 0.00, 155.00, 1, 155.00),
(34, 8, 'local-comics-cmc-xmen-35', 0, 'X-Men #35', 95.00, 0.00, 0.00, 95.00, 1, 95.00),
(35, 9, 'local-comics-cmc-dd-1', 0, 'Daredevil #1', 99.00, 0.00, 0.00, 99.00, 1, 99.00),
(36, 9, 'local-figuras-fig-gsc-nezuko1194', 0, 'Nezuko Kamado Nendoroid #1194', 1390.00, 0.00, 0.00, 1390.00, 1, 1390.00),
(37, 9, 'local-manga-mng-s-frn-v5', 0, 'Frieren: Beyond Journey\'s End Vol. 5', 175.00, 0.00, 0.00, 175.00, 1, 175.00),
(38, 9, 'local-manga-mng-s-hq-v1', 0, 'Haikyu!! Vol. 1', 155.00, 0.00, 0.00, 155.00, 1, 155.00),
(39, 10, 'local-comics-cmc-inv-1', 0, 'Invincible #1', 129.00, 0.00, 0.00, 129.00, 1, 129.00),
(40, 11, 'local-manga-mng-s-dnd-v1', 0, 'Dandadan Vol. 1', 175.00, 0.00, 0.00, 175.00, 1, 175.00),
(41, 11, 'local-manga-mng-s-hxh-v2', 0, 'Hunter x Hunter Vol. 2', 159.00, 0.00, 0.00, 159.00, 1, 159.00),
(42, 12, 'local-manga-mng-s-csm-v3', 0, 'Chainsaw Man Vol. 3', 179.00, 0.00, 0.00, 179.00, 1, 179.00),
(43, 13, 'local-figuras-fig-eren-pop', 0, 'Funko Pop! Eren Titán', 749.00, 0.00, 0.00, 749.00, 1, 749.00),
(44, 13, 'local-comics-cmc-spawn-1', 0, 'Spawn #1', 139.00, 0.00, 0.00, 139.00, 1, 139.00),
(45, 13, 'local-comics-cmc-inv-1', 0, 'Invincible #1', 129.00, 0.00, 0.00, 129.00, 9, 1161.00),
(46, 14, 'local-comics-cmc-hb-1', 0, 'Hellboy #1', 139.00, 0.00, 0.00, 139.00, 1, 139.00),
(47, 15, 'local-comics-cmc-dkr-1', 0, 'The Dark Knight Returns #1', 159.00, 0.00, 0.00, 159.00, 1, 159.00),
(48, 16, 'local-figuras-fig-pop-up-parade-makima', 0, 'POP UP PARADE Makima', 1500.00, 0.00, 0.00, 1500.00, 1, 1500.00),
(49, 17, 'local-manga-mng-s-nrt-v1', 0, 'Naruto Vol. 1', 155.00, 0.00, 0.00, 155.00, 1, 155.00),
(50, 17, 'local-manga-mng-s-hxh', 0, 'Hunter x Hunter', 159.00, 0.00, 0.00, 159.00, 1, 159.00),
(51, 18, 'local-figuras-fig-pop-up-parade-sp-jett', 0, 'POP UP PARADE SP Jett', 1200.00, 0.00, 0.00, 1200.00, 1, 1200.00),
(52, 19, 'local-figuras-fig-pop-up-parade-sp-jett', 0, 'POP UP PARADE SP Jett', 1200.00, 0.00, 0.00, 1200.00, 1, 1200.00),
(53, 20, 'local-comics-cmc-tmnt-1', 0, 'Teenage Mutant Ninja Turtles #1', 119.00, 0.00, 0.00, 119.00, 1, 119.00),
(54, 21, 'series-dragon-ball-super-v1', 0, 'Dragon Ball Super Vol. 1', 155.00, 0.00, 0.00, 155.00, 1, 155.00),
(55, 22, 'local-manga-mng-aot-01', 0, 'Attack on Titan Vol. 1', 169.00, 0.00, 0.00, 169.00, 1, 169.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `folio` varchar(24) NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `register_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `customer_name` varchar(120) NOT NULL DEFAULT '',
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','card','transfer') NOT NULL DEFAULT 'cash',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `change_due` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('completed','void') NOT NULL DEFAULT 'completed',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sales`
--

INSERT INTO `sales` (`id`, `folio`, `branch_id`, `register_id`, `user_id`, `customer_name`, `subtotal`, `tax`, `total`, `payment_method`, `amount_paid`, `change_due`, `status`, `created_at`) VALUES
(1, 'CDMX-000001', 1, 1, 5, 'Mostrador', 298.00, 47.68, 345.68, 'cash', 400.00, 54.32, 'completed', '2026-08-28 06:03:46'),
(2, 'CDMX-000002', 1, 1, 5, 'Mostrador', 119.00, 19.04, 138.04, 'card', 138.04, 0.00, 'completed', '2026-08-29 06:03:46'),
(3, 'CDMX-000003', 1, 2, 5, 'Ana L.', 2490.00, 398.40, 2888.40, 'transfer', 2888.40, 0.00, 'completed', '2026-08-30 00:03:46'),
(4, 'GDL-000001', 2, 3, 6, 'Mostrador', 308.00, 49.28, 357.28, 'cash', 360.00, 2.72, 'completed', '2026-08-29 06:03:46'),
(5, 'GDL-000002', 2, 4, 6, 'Mostrador', 1490.00, 238.40, 1728.40, 'card', 1728.40, 0.00, 'completed', '2026-08-30 03:03:46'),
(6, 'MTY-000001', 3, 5, 7, 'Mostrador', 158.00, 25.28, 183.28, 'cash', 200.00, 16.72, 'completed', '2026-08-30 01:03:46'),
(7, 'CDMX-000004', 1, NULL, 5, '', 250.00, 40.00, 290.00, 'cash', 290.00, 0.00, 'completed', '2026-08-30 06:15:07'),
(8, 'CDMX-000005', 1, NULL, 5, '', 76.72, 12.28, 89.00, 'cash', 89.00, 0.00, 'completed', '2026-08-30 06:20:39'),
(9, 'CDMX-000006', 1, NULL, 5, '', 128.45, 20.55, 149.00, 'cash', 149.00, 0.00, 'completed', '2026-08-30 06:22:41'),
(10, 'CDMX-000007', 1, NULL, 5, '', 125.00, 20.00, 145.00, 'cash', 145.00, 0.00, 'completed', '2026-08-30 06:28:07'),
(11, 'CDMX-000008', 1, NULL, 5, '', 3275.86, 524.14, 3800.00, 'cash', 3800.00, 0.00, 'completed', '2026-08-30 06:38:05'),
(12, 'CDMX-000009', 1, NULL, 5, '', 5833.62, 933.38, 6767.00, 'cash', 6767.00, 0.00, 'completed', '2026-08-30 08:09:22'),
(13, 'CDMX-000010', 1, NULL, 5, '', 154.31, 24.69, 179.00, 'cash', 179.00, 0.00, 'completed', '2026-08-31 00:00:27'),
(14, 'CDMX-000011', 1, NULL, 5, '', 137.07, 21.93, 159.00, 'cash', 159.00, 0.00, 'completed', '2026-08-31 00:00:35'),
(15, 'CDMX-000012', 1, NULL, 5, '', 5833.62, 933.38, 6767.00, 'cash', 6767.00, 0.00, 'completed', '2026-08-31 00:05:18'),
(16, 'CDMX-000013', 1, NULL, 5, '', 125.00, 20.00, 145.00, 'cash', 145.00, 0.00, 'completed', '2026-08-31 00:18:19'),
(17, 'CDMX-000014', 1, NULL, 5, '', 323.28, 51.72, 375.00, 'cash', 375.00, 0.00, 'completed', '2026-08-31 14:58:12'),
(18, 'CDMX-000015', 1, NULL, 5, '', 107.76, 17.24, 125.00, 'cash', 125.00, 0.00, 'completed', '2026-08-31 19:01:05'),
(19, 'CDMX-000016', 1, NULL, 5, '', 145.69, 23.31, 169.00, 'cash', 169.00, 0.00, 'completed', '2026-09-01 16:49:49'),
(20, 'CDMX-000017', 1, NULL, 5, '', 125.00, 20.00, 145.00, 'cash', 145.00, 0.00, 'completed', '2026-09-01 17:03:49'),
(21, 'CDMX-000018', 1, NULL, 5, '', 175.87, 28.13, 204.00, 'cash', 204.00, 0.00, 'completed', '2026-09-01 17:18:43'),
(22, 'CDMX-000019', 1, NULL, 5, '', 85.34, 13.66, 99.00, 'cash', 99.00, 0.00, 'completed', '2026-09-01 19:01:22'),
(23, 'CDMX-000020', 1, NULL, 5, '', 377.58, 60.42, 438.00, 'cash', 438.00, 0.00, 'completed', '2026-09-02 22:17:32'),
(24, 'CDMX-000021', 1, NULL, 5, '', 154.31, 24.69, 179.00, 'card', 179.00, 0.00, 'completed', '2026-09-02 22:17:41'),
(25, 'CDMX-000022', 1, NULL, 5, '', 451.73, 72.27, 524.00, 'cash', 524.00, 0.00, 'completed', '2026-09-05 08:03:02'),
(26, 'CDMX-000023', 1, 1, 5, '', 145.69, 23.31, 169.00, 'cash', 169.00, 0.00, 'completed', '2026-09-08 18:59:20'),
(27, 'CDMX-000024', 1, 1, 5, '', 128.45, 20.55, 149.00, 'cash', 149.00, 0.00, 'completed', '2026-09-09 18:24:51'),
(28, 'CDMX-000025', 1, 1, 5, '', 76.72, 12.28, 89.00, 'cash', 89.00, 0.00, 'completed', '2026-09-09 18:38:51'),
(29, 'CDMX-000026', 1, 1, 5, '', 210.34, 33.66, 244.00, 'cash', 244.00, 0.00, 'completed', '2026-09-09 19:59:44'),
(30, 'CDMX-000027', 1, 1, 5, '', 274.14, 43.86, 318.00, 'cash', 318.00, 0.00, 'completed', '2026-09-09 20:00:12'),
(31, 'CDMX-000028', 1, 1, 5, '', 282.76, 45.24, 328.00, 'cash', 500.00, 172.00, 'completed', '2026-09-09 20:00:30'),
(32, 'CDMX-000029', 1, 1, 5, '', 244.83, 39.17, 284.00, 'cash', 300.00, 16.00, 'completed', '2026-09-09 21:55:11'),
(33, 'CDMX-000030', 1, 1, 2, '', 1293.10, 206.90, 1500.00, 'cash', 1500.00, 0.00, 'completed', '2026-09-10 19:28:37'),
(34, 'CDMX-000031', 1, 1, 5, '', 128.45, 20.55, 149.00, 'cash', 149.00, 0.00, 'completed', '2026-09-10 22:08:57'),
(35, 'CDMX-000032', 1, 1, 5, '', 128.45, 20.55, 149.00, 'cash', 149.00, 0.00, 'completed', '2026-09-11 17:39:23'),
(36, 'CDMX-000033', 1, 1, 5, '', 137.07, 21.93, 159.00, 'cash', 159.00, 0.00, 'completed', '2026-09-11 19:11:58'),
(37, 'CDMX-000034', 1, 1, 5, '', 1034.48, 165.52, 1200.00, 'cash', 1200.00, 0.00, 'completed', '2026-09-12 02:11:30'),
(38, 'CDMX-000035', 1, 1, 5, '', 162.93, 26.07, 189.00, 'cash', 189.00, 0.00, 'completed', '2026-09-14 19:19:13'),
(39, 'CDMX-000036', 1, 1, 5, '', 137.07, 21.93, 159.00, 'cash', 159.00, 0.00, 'completed', '2026-09-15 16:50:24'),
(40, 'CDMX-000037', 1, 1, 5, '', 94.83, 15.17, 110.00, 'cash', 110.00, 0.00, 'completed', '2026-09-15 16:52:54'),
(41, 'CDMX-000038', 1, 1, 5, '', 128.45, 20.55, 149.00, 'cash', 149.00, 0.00, 'completed', '2026-09-15 16:53:44'),
(42, 'CDMX-000039', 1, 1, 5, '', 150.86, 24.14, 175.00, 'cash', 175.00, 0.00, 'completed', '2026-09-15 16:53:55'),
(43, 'CDMX-000040', 1, 1, 5, '', 291.38, 46.62, 338.00, 'cash', 338.00, 0.00, 'completed', '2026-09-22 03:20:00'),
(44, 'CDMX-000041', 1, 1, 5, '', 262.07, 41.93, 304.00, 'cash', 304.00, 0.00, 'completed', '2026-09-22 03:20:12'),
(45, 'CDMX-000042', 1, 1, 5, '', 1293.10, 206.90, 1500.00, 'cash', 1500.00, 0.00, 'completed', '2026-09-25 22:13:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `product_name` varchar(180) NOT NULL,
  `sku` varchar(40) NOT NULL DEFAULT '',
  `list_unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `unit_discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_price` decimal(10,2) NOT NULL,
  `tax_rate` decimal(4,3) NOT NULL DEFAULT 0.160,
  `quantity` int(11) NOT NULL,
  `line_subtotal` decimal(12,2) NOT NULL,
  `line_tax` decimal(12,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `product_name`, `sku`, `list_unit_price`, `discount_percent`, `unit_discount`, `unit_price`, `tax_rate`, `quantity`, `line_subtotal`, `line_tax`, `line_total`) VALUES
(1, 1, 1, 'Jujutsu Kaisen Vol. 1', 'MNG-JJK-01', 149.00, 0.00, 0.00, 149.00, 0.160, 2, 298.00, 47.68, 345.68),
(2, 2, 7, 'Pokémon TCG — Booster 151', 'TCG-PKM-151', 119.00, 0.00, 0.00, 119.00, 0.160, 1, 119.00, 19.04, 138.04),
(3, 3, 5, 'Figura Gojo Satoru 1/7', 'FIG-GOJO-16', 2490.00, 0.00, 0.00, 2490.00, 0.160, 1, 2490.00, 398.40, 2888.40),
(4, 4, 15, 'Kimetsu no Yaiba Vol. 23', 'MNG-KNY-23', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 149.00, 23.84, 172.84),
(5, 4, 13, 'Jujutsu Kaisen Vol. 1', 'MNG-JJK-01', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 159.00, 25.44, 184.44),
(6, 5, 19, 'Magic — Bundle Lost Caverns', 'TCG-MTG-LCI', 1490.00, 0.00, 0.00, 1490.00, 0.160, 1, 1490.00, 238.40, 1728.40),
(7, 6, 25, 'Dandadan Vol. 12', 'MNG-DND-12', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 158.00, 25.28, 183.28),
(8, 7, 253, 'Avengers #1', 'CMC-AVEN-1', 145.00, 0.00, 0.00, 145.00, 0.160, 2, 250.00, 40.00, 290.00),
(9, 8, 200, 'Batman #142 (variante)', 'CMC-BAT-142', 89.00, 0.00, 0.00, 89.00, 0.160, 1, 76.72, 12.28, 89.00),
(10, 9, 2, 'Chainsaw Man Vol. 5', 'MNG-CSM-05', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 128.45, 20.55, 149.00),
(11, 10, 253, 'Avengers #1', 'CMC-AVEN-1', 145.00, 0.00, 0.00, 145.00, 0.160, 1, 125.00, 20.00, 145.00),
(12, 11, 309, 'Artoria Pendragon 1/7', 'FIG-KOTO-ARTORIA17', 3800.00, 0.00, 0.00, 3800.00, 0.160, 1, 3275.86, 524.14, 3800.00),
(13, 12, 312, 'POP UP PARADE Lucy L Size', 'FIG-POP-UP-PARADE-LUCY-L-S', 6767.00, 0.00, 0.00, 6767.00, 0.160, 1, 5833.62, 933.38, 6767.00),
(14, 13, 28, 'Chainsaw Man', 'MNG-S-CSM', 179.00, 0.00, 0.00, 179.00, 0.160, 1, 154.31, 24.69, 179.00),
(15, 14, 61, 'Bleach', 'MNG-S-BLE', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(16, 15, 312, 'POP UP PARADE Lucy L Size', 'FIG-POP-UP-PARADE-LUCY-L-S', 6767.00, 0.00, 0.00, 6767.00, 0.160, 1, 5833.62, 933.38, 6767.00),
(17, 16, 253, 'Avengers #1', 'CMC-AVEN-1', 145.00, 0.00, 0.00, 145.00, 0.160, 1, 125.00, 20.00, 145.00),
(18, 17, 235, 'Civil War #1', 'CMC-CW-1', 125.00, 0.00, 0.00, 125.00, 0.160, 3, 323.28, 51.72, 375.00),
(19, 18, 235, 'Civil War #1', 'CMC-CW-1', 125.00, 0.00, 0.00, 125.00, 0.160, 1, 107.76, 17.24, 125.00),
(20, 19, 46, 'Blue Lock', 'MNG-S-BLK', 169.00, 0.00, 0.00, 169.00, 0.160, 1, 145.69, 23.31, 169.00),
(21, 20, 281, 'Uncanny X-Men #266', 'CMC-UXM-266', 145.00, 0.00, 0.00, 145.00, 0.160, 1, 125.00, 20.00, 145.00),
(22, 21, 247, 'Star Wars #1', 'CMC-STW-1', 129.00, 0.00, 0.00, 129.00, 0.160, 1, 111.21, 17.79, 129.00),
(23, 21, 218, 'Saga #1', 'CMC-SAGA-1', 75.00, 0.00, 0.00, 75.00, 0.160, 1, 64.66, 10.34, 75.00),
(24, 22, 229, 'Deadpool #1', 'CMC-DP-1', 99.00, 0.00, 0.00, 99.00, 0.160, 1, 85.34, 13.66, 99.00),
(25, 23, 49, 'Berserk', 'MNG-S-BSK', 349.00, 0.00, 0.00, 349.00, 0.160, 1, 300.86, 48.14, 349.00),
(26, 23, 200, 'Batman #142 (variante)', 'CMC-BAT-142', 89.00, 0.00, 0.00, 89.00, 0.160, 1, 76.72, 12.28, 89.00),
(27, 24, 28, 'Chainsaw Man', 'MNG-S-CSM', 179.00, 0.00, 0.00, 179.00, 0.160, 1, 154.31, 24.69, 179.00),
(28, 25, 34, 'Demon Slayer', 'MNG-S-DS', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(29, 25, 221, 'Venom #1', 'CMC-VENOM-1', 110.00, 0.00, 0.00, 110.00, 0.160, 2, 189.66, 30.34, 220.00),
(30, 25, 281, 'Uncanny X-Men #266', 'CMC-UXM-266', 145.00, 0.00, 0.00, 145.00, 0.160, 1, 125.00, 20.00, 145.00),
(31, 26, 46, 'Blue Lock', 'MNG-S-BLK', 169.00, 0.00, 0.00, 169.00, 0.160, 1, 145.69, 23.31, 169.00),
(32, 27, 2, 'Chainsaw Man Vol. 5', 'MNG-CSM-05', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 128.45, 20.55, 149.00),
(33, 28, 278, 'Deadpool #45', 'CMC-DP-45', 89.00, 0.00, 0.00, 89.00, 0.160, 1, 76.72, 12.28, 89.00),
(34, 29, 200, 'Batman #142 (variante)', 'CMC-BAT-142', 89.00, 0.00, 0.00, 89.00, 0.160, 1, 76.72, 12.28, 89.00),
(35, 29, 58, 'Naruto', 'MNG-S-NRT', 155.00, 0.00, 0.00, 155.00, 0.160, 1, 133.62, 21.38, 155.00),
(36, 30, 3, 'One Piece Vol. 105', 'MNG-OPC-105', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(37, 30, 283, 'One Piece Vol. 102', 'MNG-OP-102', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(38, 31, 241, 'Superman: Action Comics #1000', 'CMC-AC-1000', 199.00, 0.00, 0.00, 199.00, 0.160, 1, 171.55, 27.45, 199.00),
(39, 31, 247, 'Star Wars #1', 'CMC-STW-1', 129.00, 0.00, 0.00, 129.00, 0.160, 1, 111.21, 17.79, 129.00),
(40, 32, 34, 'Demon Slayer', 'MNG-S-DS', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(41, 32, 235, 'Civil War #1', 'CMC-CW-1', 125.00, 0.00, 0.00, 125.00, 0.160, 1, 107.76, 17.24, 125.00),
(42, 33, 316, 'POP UP PARADE Makima', 'FIG-POP-UP-PARADE-MAKIMA', 1500.00, 0.00, 0.00, 1500.00, 0.160, 1, 1293.10, 206.90, 1500.00),
(43, 34, 10, 'Póster One Piece Wano 60x90', 'COL-POST-OP', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 128.45, 20.55, 149.00),
(44, 35, 2, 'Chainsaw Man Vol. 5', 'MNG-CSM-05', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 128.45, 20.55, 149.00),
(45, 36, 76, 'Hunter x Hunter', 'MNG-S-HXH', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(46, 37, 326, 'POP UP PARADE SP Jett', 'FIG-POP-UP-PARADE-SP-JETT', 1200.00, 0.00, 0.00, 1200.00, 0.160, 1, 1034.48, 165.52, 1200.00),
(47, 38, 25, 'Jujutsu Kaisen', 'MNG-S-JJK', 189.00, 0.00, 0.00, 189.00, 0.160, 1, 162.93, 26.07, 189.00),
(48, 39, 34, 'Demon Slayer', 'MNG-S-DS', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(49, 40, 221, 'Venom #1', 'CMC-VENOM-1', 110.00, 0.00, 0.00, 110.00, 0.160, 1, 94.83, 15.17, 110.00),
(50, 41, 10, 'Póster One Piece Wano 60x90', 'COL-POST-OP', 149.00, 0.00, 0.00, 149.00, 0.160, 1, 128.45, 20.55, 149.00),
(51, 42, 40, 'Dandadan', 'MNG-S-DND', 175.00, 0.00, 0.00, 175.00, 0.160, 1, 150.86, 24.14, 175.00),
(52, 43, 28, 'Chainsaw Man', 'MNG-S-CSM', 179.00, 0.00, 0.00, 179.00, 0.160, 1, 154.31, 24.69, 179.00),
(53, 43, 61, 'Bleach', 'MNG-S-BLE', 159.00, 0.00, 0.00, 159.00, 0.160, 1, 137.07, 21.93, 159.00),
(54, 44, 28, 'Chainsaw Man', 'MNG-S-CSM', 179.00, 0.00, 0.00, 179.00, 0.160, 1, 154.31, 24.69, 179.00),
(55, 44, 235, 'Civil War #1', 'CMC-CW-1', 125.00, 0.00, 0.00, 125.00, 0.160, 1, 107.76, 17.24, 125.00),
(56, 45, 316, 'POP UP PARADE Makima', 'FIG-POP-UP-PARADE-MAKIMA', 1500.00, 0.00, 0.00, 1500.00, 0.160, 1, 1293.10, 206.90, 1500.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `user_agent` varchar(255) NOT NULL DEFAULT '',
  `ip` varchar(45) NOT NULL DEFAULT '',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `token_hash`, `user_agent`, `ip`, `expires_at`, `created_at`) VALUES
(7, 2, 'e6eba948a6585165f1556102517691d8cb93a28f7967455dba16ec429ae688d0', 'User-Agent: MQQBrowser/26 Mozilla/5.0 (Linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1', '2806:2f0:52c0:e2af:c4d9:7ac3:9d76:ad7a', '2026-08-30 18:27:48', '2026-08-30 06:27:48'),
(54, 2, '2a23369de32d59ff062df07a149704c1d1937a3a7d02756506ea63c123bb1b3a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2806:2f0:52c0:e2af:5fa6:ebd:46e6:32e', '2026-09-05 07:22:33', '2026-09-04 19:22:33'),
(61, 1, '25af01441d1415c1d6c430a059fe2050ba93dd785c31f71c678a340cd5e77b7b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.46388.4 Chrome/148.0.7778.280 Safari/537.36 MSIX', '189.203.206.94', '2026-09-06 10:07:01', '2026-09-05 22:07:01'),
(62, 1, '4affafbdc282814e6c5b16fcb0d3a048c2551730d6155383d83ee39e631038ab', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0 (Edition std-2)', '189.203.206.94', '2026-09-06 14:31:07', '2026-09-06 02:31:07'),
(79, 1, 'aabb779c7b3ec76a663a1655be5a9377d4dfda4444e4c1c661f687f5adc32e97', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2806:2f0:52c0:e2af:619b:5ea9:f29d:7575', '2026-09-09 14:15:05', '2026-09-09 02:15:05'),
(83, 1, '9d6882c5935050033704433598391a9d2936c296fd9f3079a791a020e8b82221', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5def:26af:b261:455d', '2026-09-09 17:14:45', '2026-09-09 05:14:45'),
(84, 1, '7da560d95d1c90c510b61a2c3e695779a3d533999b5a599a6114cde0790c3fed', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5def:26af:b261:455d', '2026-09-09 17:25:39', '2026-09-09 05:25:39'),
(105, 8, 'bccaf639e28ed6175bd555cb02ab9310b91d5a65e630ff224cc10d4af7f59301', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0 (Edition std-2)', '187.204.2.169', '2026-09-10 06:44:47', '2026-09-09 18:44:47'),
(113, 1, '1e846439c98a2ece5409c780f7cee62a21e3c1c1ba5b3f56f005a00d52ad2bdd', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.46388.4 Chrome/148.0.7778.280 Safari/537.36 MSIX', '2806:102e:2a:4be1:9dac:6b26:b7d8:399f', '2026-09-10 10:29:35', '2026-09-09 22:29:35'),
(118, 1, 'f8c7efdcb01effea78b9ec899b5ad34cc76c91cde1239b3fa9b6723dc5edf32f', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5d93:236f:684a:c38f', '2026-09-10 12:24:16', '2026-09-10 00:24:16'),
(119, 1, 'ac3138a85ed902a261adb359f75ca9927adebd1e305f20eed71edfc648c0a41e', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5d93:236f:684a:c38f', '2026-09-10 12:24:27', '2026-09-10 00:24:27'),
(120, 1, 'aff6655029ad410457727a35e8ef29addf31c879861500137c5a0d7755dde7ad', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5d93:236f:684a:c38f', '2026-09-10 12:24:48', '2026-09-10 00:24:48'),
(121, 2, '019c8b0f60009932e598ebccfde0028580a85ed7c719026bb08028b7f3248506', 'geekpoint-preview-proxy', '2806:102e:2a:4be1:5d93:236f:684a:c38f', '2026-09-10 13:31:25', '2026-09-10 01:31:25'),
(149, 5, 'f8ce9146419eb5f7ed2110ee897ab9bab3a5641516ad9766ef8f82afa69e2e96', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition std-2)', '187.204.7.209', '2026-09-15 07:19:04', '2026-09-14 19:19:04'),
(155, 1, '31220396fd5fc46b8872aee53f14001c76bcecd504b35379bcb75d22d9320a68', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition std-2)', '187.204.7.209', '2026-09-16 04:07:20', '2026-09-15 16:07:20'),
(159, 5, '6d496f68976780f7f4c79fbfa795d49822cb75e088033dfe4b66caec8ff98d13', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition std-2)', '187.144.249.44', '2026-09-16 07:25:04', '2026-09-15 19:25:04'),
(165, 5, 'a210c0ecbfdcac7f6bb4c4d828f58269cb6eec4063b0b986acdf498fc20aaa4b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0 (Edition ASUS)', '2806:2f0:52c0:e2af:fd99:9e1:41f9:8402', '2026-09-22 15:19:31', '2026-09-22 03:19:31'),
(166, 5, 'b3dac5b31f395b4f99fcf577209d5c11f0a0a36d329dc4d227fba261e315ad11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.49585.0 Chrome/152.0.7977.76 Safari/537.36 MSIX', '2806:102e:2a:f738:7965:93ea:6f36:b98f', '2026-09-22 15:49:02', '2026-09-22 03:49:02'),
(170, 9, 'dda121b8558c0b3e55252706c3228f8970bd4a7006a13ab928332c548dc0da75', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/2.2553.1 Chrome/152.0.7977.76 Safari/537.36 MSIX', '2806:102e:2a:f738:5868:8686:494c:1b33', '2026-09-22 19:32:40', '2026-09-22 07:32:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `type` enum('sale','restock','adjustment','void') NOT NULL,
  `quantity_delta` int(11) NOT NULL,
  `resulting_stock` int(11) NOT NULL,
  `reference` varchar(60) NOT NULL DEFAULT '',
  `note` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `branch_id`, `product_id`, `user_id`, `type`, `quantity_delta`, `resulting_stock`, `reference`, `note`, `created_at`) VALUES
(1, 1, 1, 5, 'sale', -2, 24, 'CDMX-000001', 'Venta mostrador', '2026-08-28 06:03:46'),
(2, 1, 7, 5, 'sale', -1, 60, 'CDMX-000002', 'Venta mostrador', '2026-08-29 06:03:46'),
(3, 1, 5, 5, 'sale', -1, 3, 'CDMX-000003', 'Venta Ana L.', '2026-08-30 00:03:46'),
(4, 2, 15, 6, 'sale', -1, 20, 'GDL-000001', 'Venta mostrador', '2026-08-29 06:03:46'),
(5, 2, 13, 6, 'sale', -1, 11, 'GDL-000001', 'Venta mostrador', '2026-08-29 06:03:46'),
(6, 2, 19, 6, 'sale', -1, 2, 'GDL-000002', 'Venta mostrador', '2026-08-30 03:03:46'),
(7, 3, 25, 7, 'sale', -1, 6, 'MTY-000001', 'Venta mostrador', '2026-08-30 01:03:46'),
(8, 1, 2, 2, 'restock', 12, 4, 'OC-2291', 'Recepción parcial proveedor', '2026-08-26 06:03:46'),
(9, 1, 253, 5, 'sale', -2, 4, 'CDMX-000004', 'Venta POS', '2026-08-30 06:15:07'),
(10, 1, 200, 5, 'sale', -1, 9, 'CDMX-000005', 'Venta POS', '2026-08-30 06:20:39'),
(11, 1, 2, 5, 'sale', -1, 3, 'CDMX-000006', 'Venta POS', '2026-08-30 06:22:41'),
(12, 1, 253, 5, 'sale', -1, 3, 'CDMX-000007', 'Venta POS', '2026-08-30 06:28:07'),
(13, 1, 309, 5, 'sale', -1, 2, 'CDMX-000008', 'Venta POS', '2026-08-30 06:38:05'),
(14, 1, 312, 1, 'restock', 2, 2, 'IMPORT', 'manual', '2026-08-30 07:11:56'),
(15, 2, 313, 1, 'restock', 2, 2, 'IMPORT', 'manual', '2026-08-30 07:11:56'),
(16, 3, 314, 1, 'restock', 2, 2, 'IMPORT', 'manual', '2026-08-30 07:11:56'),
(17, 1, 312, 5, 'sale', -1, 1, 'CDMX-000009', 'Venta POS', '2026-08-30 08:09:22'),
(18, 1, 28, 5, 'sale', -1, 10, 'CDMX-000010', 'Venta POS', '2026-08-31 00:00:27'),
(19, 1, 61, 5, 'sale', -1, 15, 'CDMX-000011', 'Venta POS', '2026-08-31 00:00:35'),
(20, 1, 312, 5, 'sale', -1, 0, 'CDMX-000012', 'Venta POS', '2026-08-31 00:05:18'),
(21, 1, 312, 2, 'restock', 4, 4, 'AJUSTE', '', '2026-08-31 00:09:31'),
(22, 1, 312, 2, 'restock', 8, 12, 'AJUSTE', '', '2026-08-31 00:09:50'),
(23, 1, 253, 5, 'sale', -1, 2, 'CDMX-000013', 'Venta POS', '2026-08-31 00:18:19'),
(24, 1, 235, 5, 'sale', -3, 3, 'CDMX-000014', 'Venta POS', '2026-08-31 14:58:12'),
(25, 1, 235, 5, 'sale', -1, 2, 'CDMX-000015', 'Venta POS', '2026-08-31 19:01:05'),
(26, 1, 46, 5, 'sale', -1, 12, 'CDMX-000016', 'Venta POS', '2026-09-01 16:49:49'),
(27, 1, 281, 5, 'sale', -1, 6, 'CDMX-000017', 'Venta POS', '2026-09-01 17:03:49'),
(28, 1, 247, 5, 'sale', -1, 8, 'CDMX-000018', 'Venta POS', '2026-09-01 17:18:43'),
(29, 1, 218, 5, 'sale', -1, 14, 'CDMX-000018', 'Venta POS', '2026-09-01 17:18:43'),
(30, 1, 229, 5, 'sale', -1, 13, 'CDMX-000019', 'Venta POS', '2026-09-01 19:01:22'),
(31, 1, 49, 5, 'sale', -1, 9, 'CDMX-000020', 'Venta POS', '2026-09-02 22:17:32'),
(32, 1, 200, 5, 'sale', -1, 8, 'CDMX-000020', 'Venta POS', '2026-09-02 22:17:32'),
(33, 1, 28, 5, 'sale', -1, 9, 'CDMX-000021', 'Venta POS', '2026-09-02 22:17:41'),
(34, 1, 34, 5, 'sale', -1, 3, 'CDMX-000022', 'Venta POS', '2026-09-05 08:03:02'),
(35, 1, 221, 5, 'sale', -2, 4, 'CDMX-000022', 'Venta POS', '2026-09-05 08:03:02'),
(36, 1, 281, 5, 'sale', -1, 5, 'CDMX-000022', 'Venta POS', '2026-09-05 08:03:02'),
(38, 1, 316, 1, 'restock', 67, 67, 'IMPORT', 'manual', '2026-09-08 18:15:44'),
(39, 2, 317, 1, 'restock', 67, 67, 'IMPORT', 'manual', '2026-09-08 18:15:44'),
(40, 3, 318, 1, 'restock', 67, 67, 'IMPORT', 'manual', '2026-09-08 18:15:44'),
(41, 4, 319, 1, 'restock', 67, 67, 'IMPORT', 'manual', '2026-09-08 18:15:44'),
(44, 1, 321, 1, 'restock', 10, 10, 'IMPORT', 'pokemontcg me3-21', '2026-09-08 18:20:23'),
(45, 2, 322, 1, 'restock', 10, 10, 'IMPORT', 'pokemontcg me3-21', '2026-09-08 18:20:23'),
(46, 3, 323, 1, 'restock', 10, 10, 'IMPORT', 'pokemontcg me3-21', '2026-09-08 18:20:23'),
(47, 4, 324, 1, 'restock', 10, 10, 'IMPORT', 'pokemontcg me3-21', '2026-09-08 18:20:23'),
(49, 1, 326, 1, 'restock', 10, 10, 'IMPORT', 'manual', '2026-09-08 18:25:26'),
(50, 2, 327, 1, 'restock', 10, 10, 'IMPORT', 'manual', '2026-09-08 18:25:26'),
(51, 3, 328, 1, 'restock', 10, 10, 'IMPORT', 'manual', '2026-09-08 18:25:26'),
(52, 4, 329, 1, 'restock', 10, 10, 'IMPORT', 'manual', '2026-09-08 18:25:26'),
(54, 1, 331, 1, 'restock', 12, 12, 'IMPORT', 'manual', '2026-09-08 18:31:08'),
(55, 2, 332, 1, 'restock', 12, 12, 'IMPORT', 'manual', '2026-09-08 18:31:08'),
(56, 3, 333, 1, 'restock', 12, 12, 'IMPORT', 'manual', '2026-09-08 18:31:08'),
(57, 4, 334, 1, 'restock', 12, 12, 'IMPORT', 'manual', '2026-09-08 18:31:08'),
(59, 1, 336, 1, 'restock', 3, 3, 'IMPORT', 'pokemontcg pop8-2', '2026-09-08 18:34:53'),
(60, 2, 337, 1, 'restock', 3, 3, 'IMPORT', 'pokemontcg pop8-2', '2026-09-08 18:34:53'),
(61, 3, 338, 1, 'restock', 4, 4, 'IMPORT', 'pokemontcg pop8-2', '2026-09-08 18:34:53'),
(62, 4, 339, 1, 'restock', 2, 2, 'IMPORT', 'pokemontcg pop8-2', '2026-09-08 18:34:53'),
(64, 1, 46, 5, 'sale', -1, 11, 'CDMX-000023', 'Venta POS', '2026-09-08 18:59:20'),
(65, 4, 341, 1, 'restock', 3, 3, 'IMPORT', 'pokemontcg me2-109', '2026-09-08 19:06:37'),
(66, 1, 2, 5, 'sale', -1, 2, 'CDMX-000024', 'Venta POS', '2026-09-09 18:24:51'),
(67, 1, 278, 5, 'sale', -1, 7, 'CDMX-000025', 'Venta POS', '2026-09-09 18:38:51'),
(68, 1, 200, 5, 'sale', -1, 7, 'CDMX-000026', 'Venta POS', '2026-09-09 19:59:44'),
(69, 1, 58, 5, 'sale', -1, 14, 'CDMX-000026', 'Venta POS', '2026-09-09 19:59:44'),
(70, 1, 3, 5, 'sale', -1, 17, 'CDMX-000027', 'Venta POS', '2026-09-09 20:00:12'),
(71, 1, 283, 5, 'sale', -1, 17, 'CDMX-000027', 'Venta POS', '2026-09-09 20:00:12'),
(72, 1, 241, 5, 'sale', -1, 9, 'CDMX-000028', 'Venta POS', '2026-09-09 20:00:30'),
(73, 1, 247, 5, 'sale', -1, 7, 'CDMX-000028', 'Venta POS', '2026-09-09 20:00:30'),
(74, 1, 34, 5, 'sale', -1, 2, 'CDMX-000029', 'Venta POS', '2026-09-09 21:55:11'),
(75, 1, 235, 5, 'sale', -1, 1, 'CDMX-000029', 'Venta POS', '2026-09-09 21:55:11'),
(76, 2, 350, 1, 'restock', 3, 3, 'IMPORT', 'volume', '2026-09-10 01:20:24'),
(77, 2, 354, 1, 'restock', 2, 2, 'IMPORT', 'volume', '2026-09-10 01:20:33'),
(78, 2, 354, 1, 'restock', 2, 4, 'AJUSTE', 'Ajuste desde Tomos y precios', '2026-09-10 01:20:38'),
(79, 2, 357, 1, 'restock', 1, 1, 'IMPORT', 'manual', '2026-09-10 17:55:51'),
(80, 2, NULL, 1, 'restock', 99, 99, 'IMPORT', 'manual', '2026-09-10 17:56:38'),
(81, 1, 316, 2, 'sale', -1, 66, 'CDMX-000030', 'Venta POS', '2026-09-10 19:28:37'),
(82, 1, 10, 5, 'sale', -1, 6, 'CDMX-000031', 'Venta POS', '2026-09-10 22:08:57'),
(83, 1, 2, 5, 'sale', -1, 1, 'CDMX-000032', 'Venta POS', '2026-09-11 17:39:23'),
(84, 1, 76, 5, 'sale', -1, 12, 'CDMX-000033', 'Venta POS', '2026-09-11 19:11:58'),
(85, 1, 326, 5, 'sale', -1, 9, 'CDMX-000034', 'Venta POS', '2026-09-12 02:11:30'),
(86, 1, 359, 1, 'restock', 1, 1, 'IMPORT', 'pokemontcg sma-SV64', '2026-09-12 02:40:40'),
(87, 2, 360, 1, 'restock', 1, 1, 'IMPORT', 'pokemontcg sma-SV64', '2026-09-12 02:40:40'),
(88, 3, 361, 1, 'restock', 1, 1, 'IMPORT', 'pokemontcg sma-SV64', '2026-09-12 02:40:40'),
(89, 4, 362, 1, 'restock', 1, 1, 'IMPORT', 'pokemontcg sma-SV64', '2026-09-12 02:40:40'),
(90, 4, NULL, 1, 'restock', 99, 99, 'IMPORT', 'volume', '2026-09-14 19:01:15'),
(91, 2, NULL, 1, 'restock', 99, 99, 'AJUSTE', 'Ajuste desde Tomos y precios', '2026-09-14 19:02:48'),
(92, 1, NULL, 1, 'restock', 99, 99, 'AJUSTE', 'Ajuste desde Tomos y precios', '2026-09-14 19:03:02'),
(93, 1, NULL, 1, 'restock', 99, 198, 'AJUSTE', 'Ajuste desde Tomos y precios', '2026-09-14 19:03:10'),
(94, 3, NULL, 1, 'restock', 99, 99, 'AJUSTE', 'Ajuste desde Tomos y precios', '2026-09-14 19:03:38'),
(95, 1, 25, 5, 'sale', -1, 10, 'CDMX-000035', 'Venta POS', '2026-09-14 19:19:13'),
(96, 1, 34, 5, 'sale', -1, 1, 'CDMX-000036', 'Venta POS', '2026-09-15 16:50:24'),
(97, 1, 221, 5, 'sale', -1, 3, 'CDMX-000037', 'Venta POS', '2026-09-15 16:52:54'),
(98, 1, 10, 5, 'sale', -1, 5, 'CDMX-000038', 'Venta POS', '2026-09-15 16:53:44'),
(99, 1, 40, 5, 'sale', -1, 14, 'CDMX-000039', 'Venta POS', '2026-09-15 16:53:55'),
(100, 1, 28, 5, 'sale', -1, 8, 'CDMX-000040', 'Venta POS', '2026-09-22 03:20:00'),
(101, 1, 61, 5, 'sale', -1, 14, 'CDMX-000040', 'Venta POS', '2026-09-22 03:20:00'),
(102, 1, 28, 5, 'sale', -1, 7, 'CDMX-000041', 'Venta POS', '2026-09-22 03:20:12'),
(103, 1, 235, 5, 'sale', -1, 0, 'CDMX-000041', 'Venta POS', '2026-09-22 03:20:12'),
(104, 1, 316, 5, 'sale', -1, 65, 'CDMX-000042', 'Venta POS', '2026-09-25 22:13:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','cashier','customer') NOT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `branch_id`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Adriana Sáenz', 'admin@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, 'active', '2026-09-22 03:18:00', '2026-08-30 06:03:46', '2026-09-22 03:18:00'),
(2, 'Marco Beltrán', 'gerente.cdmx@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 1, 'active', '2026-09-22 07:18:30', '2026-08-30 06:03:46', '2026-09-22 07:18:30'),
(3, 'Lucía Franco', 'gerente.gdl@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 2, 'active', NULL, '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(4, 'Diego Molina', 'gerente.mty@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 3, 'active', NULL, '2026-08-30 06:03:46', '2026-09-18 18:38:14'),
(5, 'Paola Ríos', 'caja.cdmx@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier', 1, 'active', '2026-09-25 22:15:52', '2026-08-30 06:03:46', '2026-09-25 22:15:52'),
(6, 'Kevin Ortega', 'caja.gdl@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier', 2, 'active', NULL, '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(7, 'Sofía Nava', 'caja.mty@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier', 3, 'active', NULL, '2026-08-30 06:03:46', '2026-08-30 06:03:46'),
(8, 'José Carlo Ramirez Bacelis', 'ramirezbacelis@gmail.com', '$2y$10$j6v0A.IjSQdbAln6L1p16evlTihS5xrix7nZS959zbsOpbaR.eApm', 'manager', 4, 'active', '2026-10-01 16:07:26', '2026-09-03 22:18:35', '2026-10-01 16:07:26'),
(9, 'Cliente Demo', 'cliente@geekpoint.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', NULL, 'active', '2026-09-22 07:32:40', '2026-09-22 07:24:25', '2026-09-22 07:32:40');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_consolidated_inventory`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_consolidated_inventory` (
`product_name` varchar(180)
,`category_slug` varchar(60)
,`branches_count` bigint(21)
,`total_stock` decimal(32,0)
,`branches_low_stock` decimal(23,0)
,`avg_price` decimal(11,2)
);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_branches_code` (`code`);

--
-- Indices de la tabla `catalog_cache`
--
ALTER TABLE `catalog_cache`
  ADD PRIMARY KEY (`cache_key`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categories_slug` (`slug`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_products_branch_sku` (`branch_id`,`sku`),
  ADD KEY `ix_products_branch` (`branch_id`),
  ADD KEY `ix_products_category` (`category_id`),
  ADD KEY `ix_products_name` (`name`),
  ADD KEY `ix_products_lowstock` (`branch_id`,`stock`);

--
-- Indices de la tabla `registers`
--
ALTER TABLE `registers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_registers_branch` (`branch_id`);

--
-- Indices de la tabla `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reservations_folio` (`folio`),
  ADD KEY `ix_reservations_status` (`status`),
  ADD KEY `ix_reservations_branch` (`branch_id`),
  ADD KEY `fk_reservations_sale` (`sale_id`),
  ADD KEY `fk_reservations_user` (`resolved_by`),
  ADD KEY `ix_reservations_user` (`user_id`);

--
-- Indices de la tabla `reservation_items`
--
ALTER TABLE `reservation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_resitems_res` (`reservation_id`);

--
-- Indices de la tabla `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sales_folio` (`folio`),
  ADD KEY `ix_sales_branch_date` (`branch_id`,`created_at`),
  ADD KEY `ix_sales_user` (`user_id`),
  ADD KEY `fk_sales_register` (`register_id`);

--
-- Indices de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_sale_items_sale` (`sale_id`),
  ADD KEY `ix_sale_items_product` (`product_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sessions_token` (`token_hash`),
  ADD KEY `ix_sessions_user` (`user_id`);

--
-- Indices de la tabla `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_mov_branch_date` (`branch_id`,`created_at`),
  ADD KEY `ix_mov_product` (`product_id`),
  ADD KEY `fk_mov_user` (`user_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `ix_users_branch` (`branch_id`),
  ADD KEY `ix_users_role` (`role`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=367;

--
-- AUTO_INCREMENT de la tabla `registers`
--
ALTER TABLE `registers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `reservation_items`
--
ALTER TABLE `reservation_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT de la tabla `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de la tabla `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=175;

--
-- AUTO_INCREMENT de la tabla `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_consolidated_inventory`
--
DROP TABLE IF EXISTS `v_consolidated_inventory`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u498388917_acmon`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_consolidated_inventory`  AS SELECT `p`.`name` AS `product_name`, `c`.`slug` AS `category_slug`, count(distinct `p`.`branch_id`) AS `branches_count`, sum(`p`.`stock`) AS `total_stock`, sum(case when `p`.`stock` <= `p`.`min_stock` then 1 else 0 end) AS `branches_low_stock`, round(avg(`p`.`price`),2) AS `avg_price` FROM (`products` `p` left join `categories` `c` on(`c`.`id` = `p`.`category_id`)) WHERE `p`.`status` = 'active' GROUP BY `p`.`name`, `c`.`slug` ;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `registers`
--
ALTER TABLE `registers`
  ADD CONSTRAINT `fk_registers_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservations_customer` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservations_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservations_user` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `reservation_items`
--
ALTER TABLE `reservation_items`
  ADD CONSTRAINT `fk_resitems_res` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sales_register` FOREIGN KEY (`register_id`) REFERENCES `registers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `fk_mov_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mov_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
