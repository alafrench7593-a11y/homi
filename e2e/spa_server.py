"""Serveur de test de la version web exportée (SPA : toute adresse inconnue renvoie index.html).
Usage : spa_server.py <dossier dist> <port> [--gzip]
  --gzip : sert les fichiers texte (.js, .html, .json, .css, .svg, .ttf, .map) compressés en gzip si le navigateur
           l'accepte (Accept-Encoding), comme doit le faire l'hébergement web (QA E-06). Les versions compressées sont
           gardées en mémoire ; rien n'est écrit dans le dossier. Les fichiers hachés de _expo/static reçoivent un
           cache long (immutable). Sans l'option : comportement d'origine, sans compression."""
import gzip, http.server, os, sys

args = [a for a in sys.argv[1:] if not a.startswith('--')]
ROOT, PORT = args[0], int(args[1])
GZIP = '--gzip' in sys.argv[1:]
COMPRESSIBLE = ('.js', '.html', '.json', '.css', '.svg', '.ttf', '.map')
CACHE = {}


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass

    def send_head(s):
        p = s.translate_path(s.path.split('?')[0])
        if not os.path.exists(p) or os.path.isdir(p) and not os.path.exists(os.path.join(p, 'index.html')):
            s.path = '/index.html'
            p = os.path.join(ROOT, 'index.html')
        if os.path.isdir(p):
            p = os.path.join(p, 'index.html')
        if GZIP and p.endswith(COMPRESSIBLE) and 'gzip' in s.headers.get('Accept-Encoding', ''):
            if p not in CACHE:
                with open(p, 'rb') as f:
                    CACHE[p] = gzip.compress(f.read(), 6)
            body = CACHE[p]
            s.send_response(200)
            s.send_header('Content-Type', s.guess_type(p))
            s.send_header('Content-Encoding', 'gzip')
            s.send_header('Vary', 'Accept-Encoding')
            s.send_header('Content-Length', str(len(body)))
            s.send_header('Cache-Control', 'public, max-age=31536000, immutable' if '/_expo/static/' in s.path else 'no-cache')
            s.end_headers()
            if s.command == 'HEAD':
                return None
            s.wfile.write(body)
            return None
        return super().send_head()


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
