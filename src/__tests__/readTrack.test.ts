import {
  EMPTY_READING, favoritesOf, inAppointment, isFav, localHm, MAX_POSITIONS, mergeIntoAppointment, nextAppointmentFor, opened,
  positionOf, profileKey, questionCounts, questionKey, restoreY, resumeOf, savePosition, scanJournal, toggleFav, validateQuestion,
  type ApptLike, type ReadRef,
} from '@/lib/domain/readTrack';

const now = new Date('2026-11-22T10:00:00Z');
const art: ReadRef = { kind: 'article', id: 'sommeil-bebe', title: '  Le sommeil de bébé ', href: '/article/sommeil-bebe' };
const guide: ReadRef = { kind: 'guide', id: 'firstaid', title: 'Premiers secours', href: '/guide/firstaid' };

describe('mémoire de lecture', () => {
  it('clé de profil : enfant, grossesse, moi', () => {
    expect(profileKey({ userId: 'u1', scope: 'baby', childId: 'c1' })).toBe('u1|child:c1');
    expect(profileKey({ userId: 'u1', scope: 'pregnancy', pregnancyId: 'p1' })).toBe('u1|pregnancy:p1');
    expect(profileKey({ userId: '', scope: 'none' })).toBe('anon|me:none');
    expect(profileKey({ userId: 'u1', scope: 'baby', childId: 'c1' })).not.toBe(profileKey({ userId: 'u1', scope: 'baby', childId: 'c2' }));
  });

  it('favori : ajout en tête, retrait, titre nettoyé', () => {
    let p = toggleFav(EMPTY_READING, art, now);
    p = toggleFav(p, guide, now);
    expect(p.favorites.map((f) => f.id)).toEqual(['firstaid', 'sommeil-bebe']);
    expect(p.favorites[1].title).toBe('Le sommeil de bébé');
    expect(isFav(p, 'article', 'sommeil-bebe')).toBe(true);
    p = toggleFav(p, art, now);
    expect(isFav(p, 'article', 'sommeil-bebe')).toBe(false);
    expect(favoritesOf(p, ['guide'])).toHaveLength(1);
    expect(EMPTY_READING.favorites).toHaveLength(0); // jamais modifié
  });

  it('ouverture puis position : reprise au bon endroit', () => {
    let p = opened(EMPTY_READING, art, now);
    expect(p.last).toMatchObject({ kind: 'article', id: 'sommeil-bebe', y: 0 });
    expect(restoreY(p, 'article', 'sommeil-bebe')).toBeNull();
    p = savePosition(p, 'article', 'sommeil-bebe', 812.6, now);
    expect(positionOf(p, 'article', 'sommeil-bebe')).toBe(813);
    expect(p.last?.y).toBe(813);
    expect(restoreY(p, 'article', 'sommeil-bebe')).toBe(813);
    // autre contenu ouvert, puis retour : la position de l'article est gardée
    p = opened(p, guide, now);
    expect(p.last?.id).toBe('firstaid');
    p = opened(p, art, now);
    expect(p.last?.y).toBe(813);
  });

  it('position : valeurs invalides ignorées, négatif ramené à 0, inchangé = même objet', () => {
    const p = savePosition(EMPTY_READING, 'article', 'a', Number.NaN, now);
    expect(p).toBe(EMPTY_READING);
    expect(positionOf(savePosition(EMPTY_READING, 'article', 'a', -20, now), 'article', 'a')).toBe(0);
    const q = savePosition(EMPTY_READING, 'article', 'a', 100, now);
    expect(savePosition(q, 'article', 'a', 100, now)).toBe(q);
  });

  it('positions : les plus anciennes sont oubliées', () => {
    let p = EMPTY_READING;
    for (let i = 0; i < MAX_POSITIONS + 5; i++) p = savePosition(p, 'article', `a${i}`, 100 + i, new Date(now.getTime() + i * 1000));
    expect(Object.keys(p.positions)).toHaveLength(MAX_POSITIONS);
    expect(positionOf(p, 'article', 'a0')).toBe(0);
    expect(positionOf(p, 'article', `a${MAX_POSITIONS + 4}`)).toBe(100 + MAX_POSITIONS + 4);
  });

  it('carte « Reprendre » : pas le contenu affiché, filtre par type', () => {
    const p = opened(EMPTY_READING, art, now);
    expect(resumeOf(p)?.id).toBe('sommeil-bebe');
    expect(resumeOf(p, { except: { kind: 'article', id: 'sommeil-bebe' } })).toBeNull();
    expect(resumeOf(p, { kinds: ['guide'] })).toBeNull();
    expect(resumeOf(EMPTY_READING)).toBeNull();
  });
});

describe('questions de consultation', () => {
  const qs = [
    { id: '1', question: 'Combien de biberons par jour ?', done: false, answer: null },
    { id: '2', question: 'Vitamine D jusqu’à quand', done: true, answer: '18 mois' },
    { id: '3', question: 'Peut-il dormir sur le ventre ?', done: false, answer: '' },
  ];
  it('compte : à poser, posées, avec réponse', () => {
    expect(questionCounts(qs)).toEqual({ toAsk: 2, asked: 1, answered: 1 });
    expect(questionCounts([])).toEqual({ toAsk: 0, asked: 0, answered: 0 });
  });
  it('comparaison : casse, espaces et ponctuation finale ignorées', () => {
    expect(questionKey('  Combien de   biberons par jour ?? ')).toBe(questionKey('combien de biberons par jour'));
  });
  it('validation : vide, doublon, soi-même autorisé', () => {
    expect(validateQuestion('   ', qs, null)).toBe('empty');
    expect(validateQuestion('combien de biberons par jour', qs, null)).toBe('dup');
    expect(validateQuestion('Combien de biberons par jour ?', qs, '1')).toBeNull();
    expect(validateQuestion('Nouvelle question', qs, null)).toBeNull();
  });

  const appt = (o: Partial<ApptLike>): ApptLike => ({ id: 'x', starts_at: '2026-11-25T09:00:00Z', child_id: null, pregnancy_id: null, for_parent: false, questions: [], title: 'RDV', ...o });
  it('prochain rendez-vous À VENIR du même profil', () => {
    const list = [
      appt({ id: 'past', child_id: 'c1', starts_at: '2026-11-20T09:00:00Z' }),
      appt({ id: 'later', child_id: 'c1', starts_at: '2026-12-10T09:00:00Z' }),
      appt({ id: 'soon', child_id: 'c1', starts_at: '2026-11-24T09:00:00Z' }),
      appt({ id: 'other', child_id: 'c2', starts_at: '2026-11-23T09:00:00Z' }),
      appt({ id: 'preg', pregnancy_id: 'p1', starts_at: '2026-11-23T08:00:00Z' }),
      appt({ id: 'me', for_parent: true, starts_at: '2026-11-26T08:00:00Z' }),
    ];
    expect(nextAppointmentFor(list, { childId: 'c1' }, now)?.id).toBe('soon');
    expect(nextAppointmentFor(list, { pregnancyId: 'p1' }, now)?.id).toBe('preg');
    expect(nextAppointmentFor(list, { me: true }, now)?.id).toBe('me');
    expect(nextAppointmentFor(list, { childId: 'c9' }, now)).toBeNull();
  });
  it('fusion dans le rendez-vous : seulement les questions à poser absentes, ordre gardé', () => {
    const m = mergeIntoAppointment(['Peut-il dormir sur le ventre'], qs);
    expect(m.added).toBe(1);
    expect(m.questions).toEqual(['Peut-il dormir sur le ventre', 'Combien de biberons par jour ?']);
    expect(mergeIntoAppointment(m.questions, qs).added).toBe(0);
    expect(mergeIntoAppointment(null, []).questions).toEqual([]);
    expect(inAppointment({ questions: m.questions }, 'combien de biberons par jour')).toBe(true);
    expect(inAppointment(null, 'x')).toBe(false);
  });
});

describe('journal des scans', () => {
  it('regroupe par jour local, du plus récent au plus ancien ; heure telle qu’enregistrée', () => {
    const a = new Date(2026, 10, 22, 9, 5).toISOString();
    const b = new Date(2026, 10, 22, 18, 40).toISOString();
    const c = new Date(2026, 10, 20, 7, 0).toISOString();
    const rows = [
      { id: 'a', analysed_at: a, created_at: a },
      { id: 'c', analysed_at: null, created_at: c },
      { id: 'b', analysed_at: b, created_at: a },
    ];
    const j = scanJournal(rows);
    expect(j.map((g) => g.day)).toEqual(['2026-11-22', '2026-11-20']);
    expect(j[0].items.map((s) => s.id)).toEqual(['b', 'a']);
    expect(localHm(b)).toBe('18:40');
    expect(localHm(a)).toBe('09:05');
    expect(scanJournal([])).toEqual([]);
  });
});
