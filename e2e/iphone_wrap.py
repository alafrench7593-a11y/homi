"""
Lance un parcours e2e existant en « mode iPhone » : chaque contexte de navigateur reçoit le script de
iphone_sim.py qui retire les outils JavaScript absents de Hermes / React Native, avant le démarrage de l'appli.
Usage : NAV_URL=http://127.0.0.1:8831 python3 e2e/iphone_wrap.py e2e/navigation.py
Le parcours garde ses propres vérifications ; un écran « Oups » le fait échouer comme sur iPhone.
"""
import os, runpy, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import Browser  # noqa: E402
from iphone_sim import HERMES  # noqa: E402

_new_context = Browser.new_context


def new_context(self, *a, **k):
    ctx = _new_context(self, *a, **k)
    ctx.add_init_script(HERMES)
    return ctx


Browser.new_context = new_context
_new_page = Browser.new_page


def new_page(self, *a, **k):
    ctx = self.new_context(*a, **k)
    return ctx.new_page()


Browser.new_page = new_page
script = sys.argv[1]
sys.argv = sys.argv[1:]
runpy.run_path(script, run_name='__main__')
