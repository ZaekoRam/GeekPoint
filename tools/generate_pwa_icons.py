"""
GeekPoint — generador de iconos de la PWA.

Rasteriza el logo existente del proyecto (el favicon SVG de index.html:
cuadro amarillo Panini #ffd400 + "G" en Arial Black) a los PNG que usa
public_html/manifest.webmanifest y el apple-touch-icon de iOS.

    python tools/generate_pwa_icons.py

Requiere Pillow y la fuente Arial Black (C:/Windows/Fonts/ariblk.ttf en
Windows; ruta configurable con la variable de entorno GP_ICON_FONT).

  - icon-<n>.png      purpose "any": misma composición que el favicon
                      (viewBox 100: texto en x=50, baseline y=72, size 68).
  - maskable-<n>.png  purpose "maskable": fondo a sangre y la "G" reducida
                      y centrada dentro de la zona segura (círculo de radio
                      40 % del lado) para que Android no la recorte.
  - apple-touch-icon.png  180x180 opaco (iOS redondea las esquinas solo).

Si cambias el logo, vuelve a ejecutar este script e incrementa SW_VERSION
en public_html/sw.js para que el Service Worker refresque su precaché.
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public_html", "icons")
FONT = os.environ.get("GP_ICON_FONT", r"C:\Windows\Fonts\ariblk.ttf")

PANINI = (0xFF, 0xD4, 0x00, 255)   # --panini
INK = (0x0C, 0x0C, 0x0E, 255)      # --ink-fixed

ANY_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]
SUPERSAMPLE = 4                     # se dibuja a 4x y se reduce (bordes limpios)


def favicon_layout(size):
    """Réplica del favicon: <text x=50 y=72 font-size=68 text-anchor=middle>."""
    s = size * SUPERSAMPLE
    img = Image.new("RGBA", (s, s), PANINI)
    font = ImageFont.truetype(FONT, round(s * 0.68))
    ImageDraw.Draw(img).text((s * 0.50, s * 0.72), "G", font=font, fill=INK, anchor="ms")
    return img.resize((size, size), Image.LANCZOS)


def maskable_layout(size):
    """'G' centrada ópticamente dentro del 80 % central (zona segura maskable)."""
    s = size * SUPERSAMPLE
    img = Image.new("RGBA", (s, s), PANINI)
    draw = ImageDraw.Draw(img)
    safe_radius = s * 0.40 * 0.86          # 14 % de margen extra dentro del círculo seguro
    font_px = round(s * 0.68)
    for _ in range(40):                    # reduce hasta que el bbox quepa en el círculo
        font = ImageFont.truetype(FONT, font_px)
        l, t, r, b = draw.textbbox((0, 0), "G", font=font, anchor="lt")
        if math.hypot((r - l) / 2, (b - t) / 2) <= safe_radius:
            break
        font_px = round(font_px * 0.96)
    l, t, r, b = draw.textbbox((0, 0), "G", font=font, anchor="lt")
    x = (s - (r - l)) / 2 - l
    y = (s - (b - t)) / 2 - t
    draw.text((x, y), "G", font=font, fill=INK, anchor="lt")
    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    path = os.path.join(OUT, name)
    img.convert("RGB").save(path, "PNG", optimize=True)   # opaco: sin canal alfa
    print("  ", os.path.relpath(path, ROOT), img.size)


def main():
    if not os.path.isfile(FONT):
        sys.exit("No se encontró la fuente Arial Black en %s (usa GP_ICON_FONT)." % FONT)
    os.makedirs(OUT, exist_ok=True)
    for n in ANY_SIZES:
        save(favicon_layout(n), "icon-%d.png" % n)
    for n in MASKABLE_SIZES:
        save(maskable_layout(n), "maskable-%d.png" % n)
    save(favicon_layout(180), "apple-touch-icon.png")


if __name__ == "__main__":
    main()
