"""Serveur local qui imite l'hébergement Vercel du site HOMI (vercel.json) :
fichier existant → servi ; « /chemin » → « chemin.html » s'il existe (cleanUrls) ; dossier → index.html ;
sinon coquille de l'application (app.html). Usage : site_server.py <dist> <port>"""
import http.server, os, sys

ROOT, PORT = sys.argv[1], int(sys.argv[2])


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass

    def send_head(s):
        raw = s.path.split('?')[0].split('#')[0]
        p = s.translate_path(raw)
        if os.path.isdir(p) and os.path.exists(os.path.join(p, 'index.html')):
            pass
        elif os.path.isfile(p):
            pass
        elif os.path.isfile(p.rstrip('/') + '.html'):
            s.path = raw.rstrip('/') + '.html'
        else:
            s.path = '/app.html'
        return super().send_head()

    def end_headers(s):
        s.send_header('Cache-Control', 'no-cache')
        super().end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
