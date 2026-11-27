/**
 * Widgets iOS ajoutés le 27/11/2026 (Aura, Relais, Santé, Mon histoire) : contenu calculé à partir de vraies données,
 * états vide / discret / déconnecté, frises (le widget change seul à l'heure), choix de l'enfant des widgets, photo
 * « Mon histoire » (≤ 300 px, purgée à la déconnexion).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { auraEntries, healthEntries, pickWidgetChild, relayEntries, signedOut, storyEntries } from '@/widgets/model';

const NOW = new Date(2026, 10, 27, 14, 0, 0); // 27/11/2026 14:00 locale
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m, 0).toISOString();
const base = { title: 'T', msg: 'M', url: 'homi://x' };

describe('enfant des widgets', () => {
  const kids = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('choix des widgets, sinon accueil, sinon profil actif, sinon le premier', () => {
    expect(pickWidgetChild(kids, { widgetChildId: 'c', homeChildId: 'b', subjectChildId: 'a' })?.id).toBe('c');
    expect(pickWidgetChild(kids, { widgetChildId: null, homeChildId: 'b', subjectChildId: 'a' })?.id).toBe('b');
    expect(pickWidgetChild(kids, { widgetChildId: null, homeChildId: null, subjectChildId: 'c' })?.id).toBe('c');
    expect(pickWidgetChild(kids, { widgetChildId: null, homeChildId: null, subjectChildId: null })?.id).toBe('a');
  });
  it('un choix qui n’existe plus (autre compte, enfant retiré) est ignoré', () => {
    expect(pickWidgetChild(kids, { widgetChildId: 'zz', homeChildId: 'zz', subjectChildId: null })?.id).toBe('a');
    expect(pickWidgetChild([], { widgetChildId: 'a', homeChildId: null, subjectChildId: null })).toBeNull();
    expect(pickWidgetChild(null, { widgetChildId: 'a', homeChildId: null, subjectChildId: null })).toBeNull();
  });
  it('le réglage est effacé au changement de compte', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUiStore } = require('@/lib/store') as typeof import('@/lib/store');
    useUiStore.getState().setWidgetChildId('a');
    expect(useUiStore.getState().widgetChildId).toBe('a');
    useUiStore.getState().resetAccount();
    expect(useUiStore.getState().widgetChildId).toBeNull();
  });
});

describe('widget Aura (règles locales, sans IA)', () => {
  const l = { step: 'Prochaine étape', ask: 'À demander', prio: 'Priorités', late: '', today: 'auj', appt: 'Rendez-vous', none: '-' };
  const ctx = { now: NOW, discreet: false, lateN: (n: number) => `${n} en retard`, todayN: (n: number) => `${n} aujourd’hui`, askCta: 'Demander' };
  const input = {
    step: { title: 'Note une sieste', cta: 'Enregistrer', href: 'homi://sleep/c1' },
    question: { text: 'Comment l’endormir ?', href: 'homi://assistant?theme=baby_health&draft=x' },
    tasks: { late: 2, today: 1, href: 'homi://family' },
    appts: [{ title: 'Pédiatre', at: at(27, 16), href: 'homi://calendar' }, { title: 'Demain', at: at(28, 9), href: 'homi://calendar' }, { title: 'Passé', at: at(27, 9), href: 'homi://calendar' }],
    tools: [{ label: 'Biberons', why: 'Pour ton bébé', href: 'homi://bottle' }, { label: 'Sommeil', why: 'x', href: 'homi://sleep' }],
  };
  it('prochaine étape en tête, priorités : retard, rendez-vous du jour, tâches du jour, puis outils', () => {
    const e = auraEntries(input, base, ctx, l);
    const p = e[0].props;
    expect(p).toMatchObject({ s: 'ok', kind: 'step', head: 'Prochaine étape', body: 'Note une sieste', cta: 'Enregistrer', ctaU: 'homi://sleep/c1', n: 3 });
    expect(p.rows.map((r) => r.k)).toEqual(['late', 'appt', 'task', 'tool']);
    expect(p.rows[1]).toMatchObject({ t: 'Pédiatre', at: Date.parse(at(27, 16)) });
    // seuls les rendez-vous d'aujourd'hui, à venir : l'entrée suivante (après 16 h) n'en a plus
    expect(e).toHaveLength(2);
    expect(e[1].date.getTime()).toBe(Date.parse(at(27, 16)) + 60_000);
    expect(e[1].props.rows.some((r) => r.k === 'appt')).toBe(false);
  });
  it('sans prochaine étape : une question du thème, ouverte pré-remplie (jamais envoyée)', () => {
    const p = auraEntries({ ...input, step: null }, base, ctx, l)[0].props;
    expect(p).toMatchObject({ kind: 'ask', body: 'Comment l’endormir ?', cta: 'Demander' });
    expect(p.ctaU).toContain('draft=');
    expect(p.ctaU).not.toMatch(/[?&]q=/);
  });
  it('mode discret : aucun intitulé de rendez-vous', () => {
    const e = auraEntries(input, base, { ...ctx, discreet: true }, l);
    expect(JSON.stringify(e)).not.toContain('Pédiatre');
  });
  it('rien à proposer : état vide ; aucune donnée : vide ; déconnecté : aucune donnée', () => {
    expect(auraEntries({ step: null, question: null, tasks: null, appts: [], tools: [] }, base, ctx, l)[0].props.s).toBe('empty');
    expect(auraEntries(null, base, ctx, l)[0].props.s).toBe('empty');
    expect(signedOut(base, NOW)[0].props).toEqual({ ...base, s: 'out' });
  });
});

describe('widget Relais', () => {
  const l = { now: 'De garde', nobody: 'Personne', next: 'Prochain', until: 'jusqu’à', sent: 'Transmis', events: 'év.', week: '7 j', mine: 'Toi', other: 'Coparent', none: '-' };
  const ctx = { now: NOW, discreet: false, you: 'Toi', coparent: 'Coparent', fallbackName: 'Bébé' };
  const shifts = [
    { user_id: 'me', starts_at: at(27, 13), ends_at: at(27, 22), status: 'planned' },
    { user_id: 'p2', starts_at: at(27, 22), ends_at: at(28, 6), status: 'confirmed' },
    { user_id: 'p2', starts_at: at(28, 22), ends_at: at(29, 6), status: 'cancelled' },
    { user_id: 'me', starts_at: at(25, 22), ends_at: at(26, 6), status: 'planned' },
  ];
  const nameOf = (id: string) => (id === 'p2' ? 'Jean' : '?');
  it('qui est de garde, jusqu’à quand, prochain relais et dernier relais transmis', () => {
    const e = relayEntries({ shifts, me: 'me', nameOf, lastSent: { at: at(27, 7), count: 12 }, childName: 'Lina' }, base, ctx, l);
    expect(e[0].props).toMatchObject({ s: 'ok', nowWho: 'Toi', nowMine: true, nowEnd: Date.parse(at(27, 22)), nextWho: 'Jean', nextAt: Date.parse(at(27, 22)), sentAt: Date.parse(at(27, 7)), sentN: 12, mine7: 1, other7: 1 });
    // gardes annulées et passées ignorées ; une entrée à chaque début/fin de garde
    expect(e.map((x) => x.date.getTime()).slice(1)).toEqual([Date.parse(at(27, 22)), Date.parse(at(28, 6))]);
    expect(e[1].props).toMatchObject({ nowWho: 'Jean', nowMine: false, nextAt: 0 });
    expect(e[2].props).toMatchObject({ nowWho: '', nextAt: 0 });
  });
  it('mode discret : pas de prénom du coparent ni de l’enfant', () => {
    const e = relayEntries({ shifts, me: 'me', nameOf, lastSent: null, childName: 'Lina' }, base, { ...ctx, discreet: true }, l);
    expect(JSON.stringify(e)).not.toMatch(/Jean|Lina/);
    expect(e[0].props.nextWho).toBe('Coparent');
  });
  it('aucune garde ni relais : vide ; déconnecté : vide', () => {
    expect(relayEntries({ shifts: [], me: 'me', nameOf, lastSent: null, childName: null }, base, ctx, l)[0].props.s).toBe('empty');
    expect(relayEntries(null, base, ctx, l)[0].props.s).toBe('empty');
  });
});

describe('widget Santé (sensible)', () => {
  const l = { vaccine: 'Vaccin', due: 'à faire', appt: 'Rendez-vous', dose: 'Prise', doses: 'prises', none: '-', allDone: 'Faites' };
  const ctx = { now: NOW, discreet: false, detailed: true, fallbackName: 'Bébé' };
  const input = {
    childName: 'Lina', vaccine: { date: '2026-12-02', label: 'ROR', due: false },
    appts: [{ at: at(26, 9), title: 'Passé' }, { at: at(29, 9), title: 'Pédiatre' }],
    doses: [{ at: at(27, 8), done: true }, { at: at(27, 20), done: false }, { at: at(28, 8), done: false }],
  };
  it('prochaine prise (heure seulement), prises du jour, rendez-vous et vaccin à venir', () => {
    const e = healthEntries(input, base, ctx, l);
    const p = e[0].props;
    expect(p).toMatchObject({ s: 'ok', name: 'Lina', doseAt: Date.parse(at(27, 20)), doseDone: 1, doseTotal: 2, apptAt: Date.parse(at(29, 9)), apptT: 'Pédiatre', vacT: 'ROR', vacDue: false });
    // à l'heure de la prise, le widget passe à la suivante ; à minuit, les prises du jour repartent
    const after = e.find((x) => x.date.getTime() === Date.parse(at(27, 20)) + 60_000)!;
    expect(after.props.doseAt).toBe(Date.parse(at(28, 8)));
    const midnight = e.find((x) => x.date.getHours() === 0)!;
    expect(midnight.props).toMatchObject({ doseDone: 0, doseTotal: 1 });
  });
  it('discret par défaut : intitulés génériques ; mode discret : ni prénom ni intitulé', () => {
    const d = healthEntries(input, base, { ...ctx, detailed: false }, l)[0].props;
    expect(d).toMatchObject({ vacT: 'Vaccin', apptT: 'Rendez-vous' });
    const m = healthEntries(input, base, { ...ctx, discreet: true }, l);
    expect(JSON.stringify(m)).not.toMatch(/Lina|ROR|Pédiatre/);
  });
  it('un vaccin dont la date est passée est « à faire »', () => {
    expect(healthEntries({ ...input, vaccine: { date: '2026-11-20', label: 'X', due: true } }, base, ctx, l)[0].props.vacDue).toBe(true);
  });
  it('aucune donnée : vide', () => {
    expect(healthEntries({ childName: null, vaccine: null, appts: [], doses: [] }, base, ctx, l)[0].props.s).toBe('empty');
    expect(healthEntries(null, base, ctx, l)[0].props.s).toBe('empty');
  });
  it('le modèle ne reçoit jamais le nom d’un médicament', () => {
    // le type d'entrée des prises ne porte que l'heure et l'état : vérifié à la source de la synchronisation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = (require('fs') as { readFileSync(p: string, e: 'utf8'): string }).readFileSync(`${__dirname}/../widgets/useWidgetsSync.ts`, 'utf8');
    const block = src.slice(src.indexOf('const health = useMemo'), src.indexOf('// ---------- Mon histoire'));
    expect(block).toMatch(/dosesFor\(d, tr1/);
    expect(block).not.toMatch(/\.treatment\b|treatment\.name|dose_text/);
  });
});
declare const __dirname: string;

describe('widget Mon histoire', () => {
  const l = { age: 'Âge', memory: 'Souvenir', thisWeek: 'cette semaine', yearsAgo: '', memories: 'souvenirs', none: '-', photo: '' };
  const ctx = { now: NOW, discreet: false, ageText: (_b: string, d: string) => `âge au ${d}`, yearsAgo: (n: number) => `il y a ${n} an`, fallbackName: 'Bébé' };
  const pages = [{ date: '2025-11-26', title: 'Premiers pas', text: null }, { date: '2026-11-25', title: null, text: 'Au parc' }, { date: '2026-01-10', title: 'x', text: null }];
  const input = { childName: 'Lina', birth: '2025-03-02', photo: { file: 'file:///g/homi-story-p1.jpg', taken_on: '2026-11-20', caption: 'Crèche' }, pages };
  it('photo, âge exact du jour, souvenir de la même semaine une année précédente', () => {
    const e = storyEntries(input, base, ctx, l);
    expect(e[0].props).toMatchObject({ s: 'ok', name: 'Lina', age: 'âge au 2026-11-27', photo: 'file:///g/homi-story-p1.jpg', caption: 'Crèche', memT: 'Premiers pas', memWhen: 'il y a 1 an', total: 3, week: 1 });
    // l'âge avance seul chaque jour à minuit (7 jours d'avance)
    expect(e).toHaveLength(8);
    expect(e[1].date.getHours()).toBe(0);
    expect(e[1].props.age).toBe('âge au 2026-11-28');
  });
  it('sinon le souvenir le plus récent de la semaine', () => {
    const p = storyEntries({ ...input, pages: pages.slice(1) }, base, ctx, l)[0].props;
    expect(p).toMatchObject({ memT: 'Au parc', memWhen: 'cette semaine' });
  });
  it('sans photo prête : aucune image (jamais d’image d’exemple)', () => {
    const p = storyEntries({ ...input, photo: null }, base, ctx, l)[0].props;
    expect(p.photo).toBe('');
    expect(p.s).toBe('ok');
  });
  it('mode discret : ni photo, ni prénom, ni texte de souvenir', () => {
    const e = storyEntries(input, base, { ...ctx, discreet: true }, l);
    expect(JSON.stringify(e)).not.toMatch(/Lina|homi-story|Crèche|Premiers pas/);
  });
  it('sans enfant ou sans date de naissance : vide', () => {
    expect(storyEntries(null, base, ctx, l)[0].props.s).toBe('empty');
    expect(storyEntries({ ...input, birth: '' }, base, ctx, l)[0].props.s).toBe('empty');
  });
});

describe('photo « Mon histoire » dans le dossier partagé', () => {
  const files: Record<string, boolean> = {};
  const deleted: string[] = [];
  const resized: { width: number; height: number }[] = [];
  beforeAll(() => {
    jest.resetModules();
    jest.doMock('expo-widgets', () => ({ widgetsDirectory: 'file:///group', createWidget: (name: string) => ({ name }) }));
    jest.doMock('expo-file-system', () => {
      class File {
        uri: string; name: string;
        constructor(a: string | { uri: string }, b?: string) { const dir = typeof a === 'string' ? a : a.uri; this.name = b ?? dir.split('/').pop()!; this.uri = b ? `${dir}/${b}` : dir; }
        get exists() { return !!files[this.uri]; }
        delete() { deleted.push(this.uri); delete files[this.uri]; }
        moveSync(t: File) { delete files[this.uri]; files[t.uri] = true; }
        write() { files[this.uri] = true; }
        static async downloadFileAsync(_u: string, t: File) { files[t.uri] = true; return t; }
      }
      class Directory { uri: string; constructor(u: string) { this.uri = u; } list() { return Object.keys(files).filter((k) => k.startsWith(this.uri + '/')).map((k) => new File(k)); } }
      return { File, Directory, Paths: { cache: 'file:///cache' } };
    });
    jest.doMock('expo-image-manipulator', () => ({
      SaveFormat: { JPEG: 'jpeg' },
      manipulateAsync: async (_uri: string, actions: { resize?: { width: number; height: number } }[]) => {
        if (actions[0]?.resize) { resized.push(actions[0].resize); files['file:///cache/out.jpg'] = true; return { uri: 'file:///cache/out.jpg', ...actions[0].resize }; }
        return { uri: 'file:///cache/probe.jpg', width: 4000, height: 3000 };
      },
    }));
  });
  afterAll(() => { jest.dontMock('expo-widgets'); jest.dontMock('expo-file-system'); jest.dontMock('expo-image-manipulator'); jest.resetModules(); });

  it('petite copie (≤ 300 px), téléchargée une seule fois, puis purgée à la déconnexion', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const push = require('@/widgets/push.ios') as typeof import('@/widgets/push.ios');
    let signed = 0;
    const sign = async () => { signed++; return 'https://storage.example/child-photos/x.jpg?token=t'; };
    const uri = await push.storyPhotoFile({ id: 'p1', width: null, height: null }, sign);
    expect(uri).toBe('file:///group/homi-story-p1.jpg');
    expect(Math.max(resized[0].width, resized[0].height)).toBeLessThanOrEqual(push.STORY_PHOTO_MAX);
    expect(resized[0]).toEqual({ width: 300, height: 225 });
    // déjà prête : aucun nouveau lien ni téléchargement
    expect(await push.storyPhotoFile({ id: 'p1' }, sign)).toBe(uri);
    expect(signed).toBe(1);
    // échec du lien : pas de photo
    expect(await push.storyPhotoFile({ id: 'p2' }, async () => { throw new Error('offline'); })).toBe('');
    push.clearAllWidgets();
    expect(deleted).toContain('file:///group/homi-story-p1.jpg');
    expect(Object.keys(files).some((k) => k.includes('homi-story-p1'))).toBe(false);
  });
});
