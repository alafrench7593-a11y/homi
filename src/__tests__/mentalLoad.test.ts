import {
  classifyDump, exhaustionLevel, extractDate, extractTime, mentalLoad, paperStatus, parseBrainDump, PROCEDURE_PAPERS, prepDue, shares, taskCategoryOf, upcomingPrep,
} from '@/lib/domain/mentalLoad';

const TODAY = '2026-11-07'; // samedi

describe('vider ma tête', () => {
  it('dates et heures écrites', () => {
    expect(extractDate('demain', TODAY)).toBe('2026-11-08');
    expect(extractDate('lundi', TODAY)).toBe('2026-11-09');
    expect(extractDate('samedi', TODAY)).toBe('2026-11-14');
    expect(extractDate('le 12', TODAY)).toBe('2026-11-12');
    expect(extractDate('le 3', TODAY)).toBe('2026-12-03');
    expect(extractDate('05/01', TODAY)).toBe('2027-01-05');
    expect(extractDate('appeler mamie', TODAY)).toBeNull();
    expect(extractTime('pédiatre à 14h30')).toBe('14:30');
    expect(extractTime('rdv 9h')).toBe('09:00');
  });
  it('rangement proposé', () => {
    expect(classifyDump('plus de couches')).toBe('shopping');
    expect(classifyDump('appeler la CAF')).toBe('admin');
    expect(classifyDump('prendre rdv pédiatre')).toBe('appointment');
    expect(classifyDump('pédiatre jeudi à 17h')).toBe('event');
    expect(classifyDump('anniversaire de Léo samedi')).toBe('event');
    expect(classifyDump('trier les jouets')).toBe('task');
  });
  it('découpe un texte en vrac', () => {
    const items = parseBrainDump('vaccin de Lina, cadeau anniversaire samedi\nplus de couches; appeler la CAF', TODAY);
    expect(items.map((i) => i.kind)).toEqual(['appointment', 'shopping', 'shopping', 'admin']);
    expect(items[1].domain).toBe('birthdays');
    expect(items[1].date).toBe('2026-11-14');
    expect(items[0].domain).toBe('health');
    expect(taskCategoryOf(items[2])).toBe('shopping');
  });
});

describe('qui y pense', () => {
  it('compte qui note, qui fait, qui porte les domaines', () => {
    const now = new Date('2026-11-07T12:00:00Z');
    const t = (created_by: string, done_by: string | null, status = 'done') => ({ created_by, assignee_id: null, done_by, status, created_at: '2026-11-01T10:00:00Z' });
    const rows = mentalLoad([t('a', 'b'), t('a', 'a'), t('a', null, 'todo'), t('b', 'b')], [{ owner_id: 'a' }, { owner_id: 'a' }, { owner_id: 'b' }], ['a', 'b'], now);
    expect(rows).toEqual([{ person: 'a', thought: 3, done: 1, assigned: 0, domains: 2 }, { person: 'b', thought: 1, done: 2, assigned: 0, domains: 1 }]);
    expect(shares(rows, 'thought')).toEqual({ a: 75, b: 25 });
    expect(shares(rows, 'assigned')).toBeNull();
  });
});

describe('échéances', () => {
  it('anniversaires, rentrée, papiers qui expirent, fenêtre de préparation', () => {
    const kids = [{ id: 'c1', first_name: 'Lina', birth_date: '2025-12-01' }, { id: 'c2', first_name: 'Noé', birth_date: '2020-11-20' }];
    const items = upcomingPrep(TODAY, kids, [{ id: 'p1', kind: 'id_card', label: null, expires_on: '2026-12-31', child_id: 'c2' }]);
    expect(items.map((i) => i.key)).toEqual(['birthday_c2', 'birthday_c1', 'christmas', 'paper_p1']);
    expect(prepDue(items[0], TODAY)).toBe(true);
    expect(prepDue(items[2], TODAY)).toBe(false);
    expect(upcomingPrep('2026-07-20', kids, []).some((i) => i.key === 'school')).toBe(true);
  });
});

describe('je suis à bout / papiers', () => {
  it('niveau ressenti borné', () => {
    expect(exhaustionLevel([0, 1, 0, 1, 1, 0])).toEqual({ total: 3, level: 'low' });
    expect(exhaustionLevel([2, 2, 1, 1, 0, 1])).toEqual({ total: 7, level: 'medium' });
    expect(exhaustionLevel([3, 3, 2, 2, 2, 9])).toEqual({ total: 15, level: 'high' });
  });
  it('état des papiers', () => {
    expect(paperStatus(undefined, TODAY)).toBe('missing');
    expect(paperStatus({ document_id: null, expires_on: null }, TODAY)).toBe('no_photo');
    expect(paperStatus({ document_id: 'd', expires_on: '2026-12-01' }, TODAY)).toBe('expiring');
    expect(paperStatus({ document_id: 'd', expires_on: '2026-10-01' }, TODAY)).toBe('expired');
    expect(paperStatus({ document_id: 'd', expires_on: '2028-01-01' }, TODAY)).toBe('ok');
    expect(PROCEDURE_PAPERS.school).toContain('proof_address');
  });
});
