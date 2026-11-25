"""Icônes du site HOMI à partir du logo « noir sur blanc » (1024 px) : favicon.ico (16/32/48), icon-32.png,
apple-touch-icon.png (180, fond blanc plein comme iOS l'exige), icon-512.png. Usage : site-icons.py <logo.png> <dist>"""
import sys, os
from PIL import Image
src, dist = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
im.resize((180, 180), Image.LANCZOS).save(os.path.join(dist, 'apple-touch-icon.png'), optimize=True)
im.resize((512, 512), Image.LANCZOS).save(os.path.join(dist, 'icon-512.png'), optimize=True)
im.resize((32, 32), Image.LANCZOS).save(os.path.join(dist, 'icon-32.png'), optimize=True)
im.save(os.path.join(dist, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
print('icônes du site : favicon.ico, icon-32.png, apple-touch-icon.png, icon-512.png')
