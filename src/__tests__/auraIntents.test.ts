/**
 * Intentions locales d'Aura : les demandes du brief d'audit (22/11/2026), en français et en anglais, avec les droits
 * et les données ACTUELS. Aucune carte n'enregistre : elle ouvre l'écran ou le brouillon.
 */
import { matchIntent, memberCan, resolveIntent, timesIn, type IntentContext, type MemberLike } from '@/lib/aura/intents';

const iso = (d: number, h: number, m: number) => new Date(2026, 10, d, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 15, 20);
const owner: MemberLike = { role: 'owner', can_view: [], can_edit: [] };
const t = (k: string, v?: Record<string, string | number>) => (v ? `${k} ${JSON.stringify(v)}` : k);
const base = (over: Partial<IntentContext> = {}): IntentContext => ({
  children: [{ id: 'lina', first_name: 'Lina' }], activeChildId: 'lina', member: owner,
  catalog: [{ id: 'baby_breastfeed', label: 'Allaitement', href: '/track/breastfeed?child=lina' }, { id: 'baby_bottle', label: 'Biberon', href: '/bottle/lina' }],
  pregnancyCatalog: [], sleeps: [
    { id: 'aprem', child_id: 'lina', started_at: iso(23, 13, 10), ended_at: iso(23, 14, 35), kind: 'nap' },
    { id: 'matin', child_id: 'lina', started_at: iso(23, 9, 30), ended_at: iso(23, 10, 10), kind: 'nap' },
    { id: 'noe', child_id: 'noe', started_at: iso(23, 13, 0), ended_at: iso(23, 14, 35), kind: 'nap' },
  ], now: NOW, t, clock: (d) => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`, ...over,
});

describe('reconnaissance (FR / EN)', () => {
  it.each([
    ['Mon bébé prend le sein', { kind: 'open_tool', toolId: 'baby_breastfeed' }],
    ['My baby is nursing', { kind: 'open_tool', toolId: 'baby_breastfeed' }],
    ['Il vient de finir son bib', { kind: 'open_tool', toolId: 'baby_bottle' }],
    ['she just finished her bottle', { kind: 'open_tool', toolId: 'baby_bottle' }],
    ['J’ai mis 14 h 35 mais elle s’est réveillée à 14 h 20', { kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }],
    ['I logged 2:35 pm but she woke up at 2:20 pm', { kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }],
    ['Je passe le relais à son père', { kind: 'prepare_relay' }],
    ['handover to her dad', { kind: 'prepare_relay' }],
    ['Où j’ajoute son poids ?', { kind: 'add_measure', metric: 'weight_kg' }],
    ['where do I add his weight?', { kind: 'add_measure', metric: 'weight_kg' }],
    ['Qu’est-ce que je peux faire sur HOMI pendant ma grossesse ?', { kind: 'profile_tools', profile: 'pregnancy' }],
    ['Comment je change d’enfant ?', { kind: 'switch_child' }],
    ['how do I switch child', { kind: 'switch_child' }],
    ['Il a fait caca, je change sa couche', { kind: 'open_tool', toolId: 'baby_diaper' }],
  ])('« %s »', (q, expected) => { expect(matchIntent(q)).toEqual(expected); });
  it('une question ouverte ne déclenche aucune carte locale (elle va au modèle)', () => {
    expect(matchIntent('Comment gérer la fatigue des premières semaines ?')).toBeNull();
  });
  it('heures : « 14 h 35 », « 14h20 », « 2:20 pm », « 9 h »', () => {
    expect(timesIn('14 h 35 puis 14h20, 2:20 pm et 9 h')).toEqual(['14:35', '14:20', '14:20', '09:00']);
  });
});

describe('résolution avec les données et droits actuels', () => {
  it('allaitement : ouvre l’outil pour l’enfant actif (rien ne démarre seul)', () => {
    expect(resolveIntent({ kind: 'open_tool', toolId: 'baby_breastfeed' }, base())).toMatchObject({ status: 'ready', href: '/track/breastfeed?child=lina' });
  });
  it('sieste 14 h 35 → 14 h 20 : la bonne sieste, en modification, valeur proposée (non enregistrée)', () => {
    const r = resolveIntent({ kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }, base());
    expect(r).toMatchObject({ status: 'ready', href: '/sleep/lina?nap=aprem&fix=14:20' });
  });
  it('deux siestes possibles : UNE question, puis la sieste choisie', () => {
    const r = resolveIntent({ kind: 'fix_sleep_end', wrong: null, right: '14:20' }, base({ sleeps: [...base().sleeps, { id: 'x', child_id: 'lina', started_at: iso(23, 13, 40), ended_at: iso(23, 14, 35), kind: 'nap' }] }));
    expect(r.status).toBe('ready'); // sans heure fausse : la plus récente
    const amb = resolveIntent({ kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }, base({ sleeps: [...base().sleeps, { id: 'x', child_id: 'lina', started_at: iso(23, 13, 40), ended_at: iso(23, 14, 35), kind: 'nap' }] }));
    expect(amb.status).toBe('ask');
    if (amb.status !== 'ask') return;
    expect(amb.options).toHaveLength(2);
    expect(resolveIntent(amb.options[1].intent, base())).toMatchObject({ status: 'ready' });
  });
  it('aucune sieste à 14 h 35 : expliqué, avec une possibilité qui fonctionne', () => {
    expect(resolveIntent({ kind: 'fix_sleep_end', wrong: '11:00', right: '10:50' }, base())).toMatchObject({ status: 'unavailable', alternative: { href: '/sleep/lina' } });
  });
  it('les données de Noé ne sont jamais proposées pour Lina', () => {
    const r = resolveIntent({ kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }, base());
    expect(JSON.stringify(r)).not.toContain('noe');
  });
  it('relais : ouvre le BROUILLON de l’enfant (envoyer reste un autre geste)', () => {
    expect(resolveIntent({ kind: 'prepare_relay' }, base())).toMatchObject({ status: 'ready', href: '/family/relay?child=lina' });
  });
  it('poids : la saisie du poids dans Croissance', () => {
    expect(resolveIntent({ kind: 'add_measure', metric: 'weight_kg' }, base())).toMatchObject({ status: 'ready', href: '/child/lina?tab=croissance&focus=weight_kg' });
  });
  it('plusieurs enfants sans enfant affiché : une seule question « Pour quel enfant ? »', () => {
    const ctx = base({ children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }], activeChildId: null });
    const r = resolveIntent({ kind: 'prepare_relay' }, ctx);
    expect(r).toMatchObject({ status: 'ask', question: 'aura.it.whichChild' });
  });
  it('plusieurs enfants : le prénom est sur la carte', () => {
    const ctx = base({ children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }] });
    const r = resolveIntent({ kind: 'open_tool', toolId: 'baby_bottle' }, ctx);
    expect(r.status === 'ready' && r.label).toContain('Lina');
  });
  it('droits RETIRÉS : la même carte devient indisponible (relecture à l’appui)', () => {
    const limited: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: ['noe'] };
    expect(resolveIntent({ kind: 'open_tool', toolId: 'baby_bottle' }, base({ member: limited })).status).toBe('unavailable');
    const viewOnly: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: null };
    expect(resolveIntent({ kind: 'fix_sleep_end', wrong: '14:35', right: '14:20' }, base({ member: viewOnly }))).toMatchObject({ status: 'unavailable', alternative: { href: '/sleep/lina' } });
  });
  it('changer d’enfant : propose les enfants réels ; un seul enfant : expliqué', () => {
    expect(resolveIntent({ kind: 'switch_child' }, base()).status).toBe('unavailable');
    const two = resolveIntent({ kind: 'switch_child' }, base({ children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }] }));
    expect(two.status === 'select_child' && two.options.map((o) => o.childId)).toEqual(['lina', 'noe']);
  });
  it('grossesse : outils réellement disponibles, sinon possibilité de déclarer la grossesse', () => {
    expect(resolveIntent({ kind: 'profile_tools', profile: 'pregnancy' }, base()).status).toBe('unavailable');
    const r = resolveIntent({ kind: 'profile_tools', profile: 'pregnancy' }, base({ pregnancyCatalog: [{ id: 'preg_moves', label: 'Mouvements', href: '/pregnancy/moves' }] }));
    expect(r).toMatchObject({ status: 'list', items: [{ href: '/pregnancy/moves' }] });
  });
  it('memberCan : propriétaire, domaine, périmètre d’enfants', () => {
    expect(memberCan(owner, 'edit', 'daily', 'x')).toBe(true);
    expect(memberCan({ role: 'caregiver', can_view: ['daily'], can_edit: ['daily'], child_scope: ['a'] }, 'edit', 'daily', 'b')).toBe(false);
    expect(memberCan(null, 'view', 'daily')).toBe(false);
  });
});
