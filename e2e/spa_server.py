import http.server, os, sys
ROOT=sys.argv[1]; PORT=int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def log_message(s,*a): pass
    def send_head(s):
        p=s.translate_path(s.path.split('?')[0])
        if not os.path.exists(p) or os.path.isdir(p) and not os.path.exists(os.path.join(p,'index.html')):
            s.path='/index.html'
        return super().send_head()
http.server.ThreadingHTTPServer(('127.0.0.1',PORT),H).serve_forever()
