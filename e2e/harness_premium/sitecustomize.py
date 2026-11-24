"""Banc d'essai e2e — démo avec abonnement simulé (Premium strict depuis le 22/11/2026).

Chargé automatiquement par Python quand ce dossier est dans PYTHONPATH ET que E2E_PREMIUM=1 :
  PYTHONPATH=e2e/harness_premium E2E_PREMIUM=1 python3 e2e/<scénario>.py
Chaque page ouverte par Playwright reçoit un script d'initialisation qui, dans l'état local de la DÉMO
(localStorage « toietmoi.demo.v1 », données fictives, aucun serveur), ajoute un abonnement actif au compte de démo
s'il n'en a pas. Rien n'est modifié dans l'application ; sans E2E_PREMIUM=1 ce module ne fait rien.
Les scénarios qui testent l'offre ou le blocage sans abonnement se lancent SANS cette variable.
"""
import os

if os.environ.get('E2E_PREMIUM') == '1':
    _JS = """(() => { try {
      const K = 'toietmoi.demo.v1'; const raw = localStorage.getItem(K); if (!raw) return;
      const s = JSON.parse(raw); const me = s && s.session && s.session.userId; if (!me || !s.tables) return;
      const subs = s.tables.subscriptions = s.tables.subscriptions || [];
      if (subs.some((x) => x.user_id === me && ['active', 'trial', 'grace'].includes(x.status))) return;
      subs.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual',
        expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), will_renew: true });
      localStorage.setItem(K, JSON.stringify(s));
    } catch (e) {} })();"""
    try:
        from playwright.sync_api._generated import Browser, BrowserContext

        _new_context, _new_page = Browser.new_context, Browser.new_page

        def new_context(self, *a, **k):
            ctx = _new_context(self, *a, **k); ctx.add_init_script(_JS); return ctx

        def new_page(self, *a, **k):
            pg = _new_page(self, *a, **k); pg.context.add_init_script(_JS); return pg

        Browser.new_context, Browser.new_page = new_context, new_page
    except Exception:  # Playwright absent : rien à faire
        pass
