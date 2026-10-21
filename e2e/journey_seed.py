"""
Aide aux tests de bout en bout : choisit le parcours « corps » actif de la démo (table user_journeys), pour ouvrir
les écrans propres à ce parcours (la garde d'accès ferme ceux d'un parcours inactif).
  body : 'ttc' | 'avoid' | 'cycle' | 'pregnancy' ; postpartum : True pour ajouter un post-partum actif.
"""

SET_BODY = """([body, postpartum]) => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.tables.profiles[0].id;
  const keep = (s.tables.user_journeys || []).filter(j => j.type === 'baby' || j.type === 'child' || (j.type === 'postpartum' && postpartum));
  const preg = (s.tables.pregnancies || []).find(p => p.status === 'active');
  const row = (type, extra) => ({ id: 'e2e-' + type, user_id: me, household_id: null, type, status: 'active', started_on: '2026-01-01', ended_on: null, end_reason: null, pregnancy_id: null, child_id: null, created_at: new Date().toISOString(), ...extra });
  if (body === 'pregnancy' && preg) keep.push(row('pregnancy', { household_id: preg.household_id, pregnancy_id: preg.id, started_on: preg.lmp_date || '2026-04-01' }));
  else if (body && body !== 'pregnancy') keep.push(row(body, {}));
  if (postpartum && !keep.some(j => j.type === 'postpartum')) keep.push(row('postpartum', {}));
  s.tables.user_journeys = keep;
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""


def body_for(path):
    """Parcours nécessaire pour ouvrir un écran (None = indifférent)."""
    if path.startswith('/fertility'):
        return ('ttc', False)
    if path.startswith('/contraception'):
        return ('avoid', False)
    if path.startswith('/cycle'):
        return ('ttc', False)
    if path.startswith('/postpartum'):
        return ('pregnancy', True)
    if path.startswith('/pregnancy'):
        return ('pregnancy', False)
    return None


def ensure(pg, path, state):
    """Applique le parcours voulu si l'écran l'exige ; `state` mémorise le dernier choix (évite les rechargements inutiles)."""
    need = body_for(path)
    if need and state.get('cur') != need:
        pg.evaluate(SET_BODY, list(need)); state['cur'] = need


# Mode complet (les suites historiques vérifient tout le contenu ; le mode simple est vérifié par essentiels.py)
SIMPLE_OFF = """() => {
  const raw = localStorage.getItem('toietmoi.ui'); const v = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  v.state = { ...(v.state || {}), simpleMode: false }; localStorage.setItem('toietmoi.ui', JSON.stringify(v));
}"""
