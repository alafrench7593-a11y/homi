"""
Outil de présentation (hors application) : capture une page HTML locale (planche, aperçu de logos) en PNG.
Usage : python3 scripts/da/render.py <page.html> <sortie.png> [largeur] [hauteur] [échelle] [fond transparent 0|1]
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

src, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1560
h = int(sys.argv[4]) if len(sys.argv) > 4 else 1100
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 1
transparent = len(sys.argv) > 6 and sys.argv[6] == '1'
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=scale)
    pg.goto(pathlib.Path(src).resolve().as_uri())
    pg.wait_for_timeout(300)
    pg.screenshot(path=out, full_page=True, omit_background=transparent)
    b.close()
print('ok', out)
