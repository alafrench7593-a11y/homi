/**
 * Aura 2.0 — actions qui ENREGISTRENT (sieste, biberon) et lectures sans IA (sommeil du jour) : reconnaissance FR/EN
 * (fautes, familier), calculs, conflits, doublons, droits. L'écriture elle-même passe par useAddLog (même chemin que
 * les écrans) et n'a lieu qu'après l'appui du parent : ici on vérifie la préparation.
 */
import { matchIntent, resolveIntent, sleepMinutesToday, sleepWindow, span, type IntentContext, type MemberLike } from '@/lib/aura/intents';

const iso = (d: number, h: number, m: number) => new Date(2026, 10, d, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 16, 0);
const owner: MemberLike = { role: 'owner', can_view: [], can_edit: [] };
const t = (k: string, v?: Record<string, string | number>) => (v ? `${k} ${JSON.stringify(v)}` : k);
const ctx = (over: Partial<IntentContext> = {}): IntentContext => ({
  children: [{ id: 'lina', first_name: 'Lina' }], activeChildId: 'lina', member: owner, catalog: [], pregnancyCatalog: [],
  sleeps: [{ id: 'matin', child_id: 'lina', started_at: iso(23, 9, 30), ended_at: iso(23, 10, 10), kind: 'nap' },
    { id: 'nuit', child_id: 'lina', started_at: iso(22, 20, 0), ended_at: iso(23, 7, 0), kind: 'night' }],
  bottles: [], now: NOW, t, clock: (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`, ...over,
});

describe('reconnaissance', () => {
  it.each([
    ['Mon bébé s’est endormi à 14 h 20 et réveillé à 15 h 45', { kind: 'log_sleep', start: '14:20', end: '15:45' }],
    ['il a dormi de 14h à 15h30, ajoute ça', { kind: 'log_sleep', start: '14:00', end: '15:30' }],
    ['sieste 13h10 14h05', { kind: 'log_sleep', start: '13:10', end: '14:05' }],
    ['she fell asleep at 1:20 pm and woke up at 2:45 pm', { kind: 'log_sleep', start: '13:20', end: '14:45' }],
    ['Il vient de boire 150 ml', { kind: 'log_bottle', ml: 150 }],
    ['bib de 120ml fini', { kind: 'log_bottle', ml: 120 }],
    ['he drank 90 ml', { kind: 'log_bottle', ml: 90 }],
    ['Combien mon fils a dormi aujourd’hui ?', { kind: 'sleep_today' }],
    ['how much did she sleep today', { kind: 'sleep_today' }],
  ])('« %s »', (q, expected) => { expect(matchIntent(q)).toEqual(expected); });
  it('une correction reste une correction (priorité)', () => {
    expect(matchIntent('J’ai mis 14 h 35 mais elle s’est réveillée à 14 h 20')).toMatchObject({ kind: 'fix_sleep_end' });
  });
  it('un nombre sans biberon ni boisson ne crée rien', () => { expect(matchIntent('elle pèse 150 g de plus')?.kind).not.toBe('log_bottle'); });
  it('quantité absurde ignorée', () => { expect(matchIntent('il a bu 2000 ml')?.kind).not.toBe('log_bottle'); });
});

describe('calculs déterministes', () => {
  it('durée', () => { expect(span(85)).toBe('1 h 25'); expect(span(45)).toBe('45 min'); expect(span(120)).toBe('2 h'); });
  it('fenêtre : passage de minuit et jamais dans le futur', () => {
    const night = sleepWindow('20:30', '06:10', NOW)!;
    expect(night.start.getDate()).toBe(22); expect(night.end.getDate()).toBe(23);
    const later = sleepWindow('17:00', '18:00', NOW)!; // pas encore arrivé aujourd'hui → hier
    expect(later.start.getDate()).toBe(22);
    expect(sleepWindow('14:00', '14:02', NOW)).toBeNull();
  });
  it('sommeil du jour : la nuit d’avant est coupée à minuit', () => {
    expect(sleepMinutesToday(ctx().sleeps, NOW)).toBe(7 * 60 + 40);
  });
});

describe('préparation (rien n’est écrit ici)', () => {
  it('sieste : résumé, ligne prête, durée exacte', () => {
    const r = resolveIntent({ kind: 'log_sleep', start: '14:20', end: '15:45' }, ctx());
    expect(r.status).toBe('confirm');
    if (r.status !== 'confirm') return;
    expect(r.write.kind).toBe('sleep');
    expect(r.write.row).toMatchObject({ child_id: 'lina', kind: 'nap', started_at: iso(23, 14, 20), ended_at: iso(23, 15, 45) });
    expect(r.doneLabel).toContain('1 h 25');
    expect(r.viewHref).toBe('/sleep/lina');
  });
  it('chevauchement : refus, renvoi vers Sommeil', () => {
    const r = resolveIntent({ kind: 'log_sleep', start: '09:00', end: '10:00' }, ctx());
    expect(r).toMatchObject({ status: 'unavailable', alternative: { href: '/sleep/lina' } });
  });
  it('biberon : doublon récent refusé, sinon prêt', () => {
    expect(resolveIntent({ kind: 'log_bottle', ml: 150 }, ctx({ bottles: [{ at: iso(23, 15, 55), consumed_ml: 150 }] })).status).toBe('unavailable');
    const r = resolveIntent({ kind: 'log_bottle', ml: 150 }, ctx());
    expect(r).toMatchObject({ status: 'confirm', write: { kind: 'bottle', row: { child_id: 'lina', consumed_ml: 150 } } });
  });
  it('droits : lecture seule → aucune écriture proposée ; enfant hors périmètre → rien', () => {
    const viewer: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: ['lina'] };
    expect(resolveIntent({ kind: 'log_bottle', ml: 120 }, ctx({ member: viewer })).status).toBe('unavailable');
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ member: viewer })).status).toBe('answer');
    const other: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: ['daily'], child_scope: ['noe'] };
    expect(resolveIntent({ kind: 'log_sleep', start: '14:20', end: '15:45' }, ctx({ member: other })).status).toBe('unavailable');
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ member: other })).status).toBe('unavailable');
  });
  it('plusieurs enfants sans profil actif : Aura demande lequel', () => {
    const r = resolveIntent({ kind: 'log_bottle', ml: 120 }, ctx({ activeChildId: null, children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }] }));
    expect(r.status).toBe('ask');
  });
  it('réponse fondée sur les données, jamais inventée', () => {
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ sleeps: [] }))).toMatchObject({ status: 'answer', text: expect.stringContaining('noSleepToday') });
  });
});

// ---------------------------------------------------------------- rendez-vous, tâche confiée, tétée par côté
import { apptTitle, cleanTitle, resolveWhen, whenIn } from '@/lib/aura/intents';
import { foldText } from '@/lib/domain/toolSearch';

describe('rendez-vous, tâche, tétée : reconnaissance', () => {
  it.each([
    ['Ajoute un rendez-vous chez le pédiatre mardi à 10 h', { kind: 'add_appointment', title: 'Pédiatre', when: { weekday: 2 }, time: '10:00' }],
    ['rdv dentiste demain 14h30', { kind: 'add_appointment', title: 'Dentiste', when: { rel: 1 }, time: '14:30' }],
    ['book a pediatrician appointment on friday at 9:30 am', { kind: 'add_appointment', title: 'Pédiatre', when: { weekday: 5 }, time: '09:30' }],
    ['note le rendez-vous vaccin le 12/12', { kind: 'add_appointment', title: 'Vaccin', when: { day: 12, month: 12 }, time: null }],
    ['Rappelle à mon conjoint de préparer le sac de crèche demain', { kind: 'assign_task', title: 'Préparer le sac de crèche', when: { rel: 1 }, time: null }],
    ['demande à mon mari d’acheter du lait ce soir', { kind: 'assign_task', title: 'Acheter du lait', when: { rel: 0 }, time: null }],
    ['remind my partner to book the swimming class', { kind: 'assign_task', title: 'Book the swimming class', when: null, time: null }],
    ['Rappelle à mon conjoint de prendre rendez-vous chez le dentiste', { kind: 'assign_task', title: 'Prendre rendez-vous chez le dentiste', when: null, time: null }],
    ['Je commence à allaiter à gauche', { kind: 'start_breastfeed', side: 'left' }],
    ['start breastfeeding on the right', { kind: 'start_breastfeed', side: 'right' }],
  ])('« %s »', (q, expected) => { expect(matchIntent(q)).toEqual(expected); });
  it('« elle tète à gauche » sans demande de démarrage : simple ouverture d’Allaitement', () => {
    expect(matchIntent('elle a tété à gauche')?.kind).toBe('open_tool');
  });
});

describe('dates : jamais dans le passé', () => {
  const MON = new Date(2026, 10, 23, 16, 0); // lundi 23/11/2026
  it('jour de semaine = prochaine occurrence ; même jour = semaine suivante', () => {
    expect(resolveWhen({ weekday: 2 }, MON).getDate()).toBe(24);
    expect(resolveWhen({ weekday: 1 }, MON).getDate()).toBe(30);
  });
  it('JJ/MM passé → l’an prochain', () => { expect(resolveWhen({ day: 2, month: 1 }, MON).getFullYear()).toBe(2027); });
  it('heure seule ≠ date', () => { expect(whenIn(foldText('à 10 h 30'))).toBeNull(); });
  it('titres', () => { expect(apptTitle(foldText('chez la sage-femme'))).toBe('Sage-femme'); expect(cleanTitle('sortir le chien samedi à 9 h')).toBe('Sortir le chien'); });
});

describe('rendez-vous, tâche, tétée : destinations (formulaire pré-rempli, rien d’écrit)', () => {
  const two = { activeChildId: null, children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }] };
  it('rendez-vous pédiatre : formulaire Rendez-vous rempli (date, heure, enfant)', () => {
    const r = resolveIntent({ kind: 'add_appointment', title: 'Pédiatre', when: { weekday: 2 }, time: '10:00' }, ctx());
    expect(r.status).toBe('ready');
    if (r.status !== 'ready') return;
    expect(r.href).toMatch(/^\/appointments\?new=quick&at=/);
    expect(new Date(decodeURIComponent(r.href.split('at=')[1].split('&')[0])).getHours()).toBe(10);
    expect(r.href).toContain('child=lina');
  });
  it('rendez-vous pédiatre avec deux enfants : Aura demande lequel', () => {
    expect(resolveIntent({ kind: 'add_appointment', title: 'Pédiatre', when: { rel: 1 }, time: null }, ctx(two)).status).toBe('ask');
  });
  it('rendez-vous dentiste (adulte) : aucun enfant imposé', () => {
    const r = resolveIntent({ kind: 'add_appointment', title: 'Dentiste', when: { rel: 1 }, time: '14:30' }, ctx(two));
    expect(r).toMatchObject({ status: 'ready' }); if (r.status === 'ready') expect(r.href).not.toContain('child=');
  });
  it('lecture seule santé : pas de rendez-vous d’enfant proposé', () => {
    const viewer: MemberLike = { role: 'coparent', can_view: ['health'], can_edit: [], child_scope: ['lina'] };
    expect(resolveIntent({ kind: 'add_appointment', title: 'Pédiatre', when: { rel: 1 }, time: null }, ctx({ member: viewer })).status).toBe('unavailable');
  });
  it('tâche : formulaire Missions rempli (titre, date)', () => {
    const r = resolveIntent({ kind: 'assign_task', title: 'Préparer le sac de crèche', when: { rel: 1 }, time: null }, ctx());
    expect(r).toMatchObject({ status: 'ready', href: '/family/missions/new?title=Pr%C3%A9parer%20le%20sac%20de%20cr%C3%A8che&date=24/11/2026' });
  });
  it('tétée : séance ouverte avec le côté ; lecture seule → refus', () => {
    expect(resolveIntent({ kind: 'start_breastfeed', side: 'left' }, ctx())).toMatchObject({ status: 'ready', href: '/track/breastfeed?child=lina&start=left' });
    const viewer: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: ['lina'] };
    expect(resolveIntent({ kind: 'start_breastfeed', side: 'left' }, ctx({ member: viewer })).status).toBe('unavailable');
  });
});

describe('lectures sans IA : médicament, biberons', () => {
  it.each([
    ['Est-ce que j’ai donné son médicament ce matin ?', { kind: 'med_check', period: 'morning' }],
    ['did I give her medicine today', { kind: 'med_check', period: 'today' }],
    ['il a pris son doliprane ?', { kind: 'med_check', period: 'today' }],
    ['combien de biberons aujourd’hui', { kind: 'bottles_today' }],
    ['how much milk did he drink today', { kind: 'bottles_today' }],
  ])('« %s »', (q, expected) => { expect(matchIntent(q)).toEqual(expected); });
  const med = { treatments: [{ id: 't1', child_id: 'lina', name: 'Vitamine D', active: true }] };
  it('aucune prise notée → jamais « non donné », renvoi vers Traitements', () => {
    const r = resolveIntent({ kind: 'med_check', period: 'morning' }, ctx({ ...med, doses: [] }));
    expect(r).toMatchObject({ status: 'answer', href: '/child/lina/needs?tab=treatments', text: expect.stringContaining('noDose') });
  });
  it('prise notée ce matin → nom et heure ; une prise de l’après-midi ne compte pas pour « ce matin »', () => {
    const doses = [{ treatment_id: 't1', scheduled_for: iso(23, 8, 30), status: 'taken', logged_at: iso(23, 8, 40) }, { treatment_id: 't1', scheduled_for: iso(23, 14, 0), status: 'taken' }];
    const r = resolveIntent({ kind: 'med_check', period: 'morning' }, ctx({ ...med, doses }));
    expect(r.status === 'answer' && r.text).toContain('Vitamine D (8:40)');
    expect(r.status === 'answer' && r.text).not.toContain('14:00');
  });
  it('pas de traitement : dit qu’aucun n’est enregistré ; droits santé requis', () => {
    expect(resolveIntent({ kind: 'med_check', period: 'today' }, ctx()).status === 'answer').toBe(true);
    const daily: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: ['lina'] };
    expect(resolveIntent({ kind: 'med_check', period: 'today' }, ctx({ ...med, member: daily })).status).toBe('unavailable');
  });
  it('biberons du jour : nombre et total, hier exclu', () => {
    const bottles = [{ at: iso(23, 9, 0), consumed_ml: 150 }, { at: iso(23, 12, 30), consumed_ml: 120 }, { at: iso(22, 22, 0), consumed_ml: 180 }];
    const r = resolveIntent({ kind: 'bottles_today' }, ctx({ bottles }));
    expect(r.status === 'answer' && r.text).toContain('"count":2');
    expect(r.status === 'answer' && r.text).toContain('"ml":270');
  });
});
