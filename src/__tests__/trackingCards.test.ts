import { childTrackProfile, lastInfo, nextDose, trackActions, whenLabel } from '@/lib/domain/trackingCards';

const NOW = new Date(2026, 9, 22, 15, 0);
const at = (h: number, m = 0, day = 22) => new Date(2026, 9, day, h, m).toISOString();

describe('cartes de suivi : actions selon le profil', () => {
  it('grossesse : sommeil, humeur, repas, rendez-vous ; poids facultatif ; jamais biberon, tétée ni couche', () => {
    const r = trackActions({ profile: 'pregnancy' });
    expect(r.primary).toEqual(['mother_sleep', 'mood', 'meal', 'appointment']);
    expect(r.more).toEqual(['weight']);
    expect(trackActions({ profile: 'pregnancy', hideWeight: true }).more).toEqual([]);
    for (const k of ['bottle', 'breastfeed', 'diaper', 'pumping']) expect([...r.primary, ...r.more]).not.toContain(k);
  });
  it('nouveau-né : biberon, tétée, couche, sommeil', () => {
    expect(trackActions({ profile: 'newborn', enabled: ['bottle', 'breastfeed', 'diaper', 'sleep'], ageMonths: 1 }).primary).toEqual(['bottle', 'breastfeed', 'diaper', 'sleep']);
  });
  it('bébé en diversification : repas, sommeil, biberon, couche', () => {
    expect(trackActions({ profile: 'diversification', enabled: ['bottle', 'diaper', 'sleep', 'meal'], ageMonths: 9 }).primary).toEqual(['meal', 'sleep', 'bottle', 'diaper']);
  });
  it('enfant plus grand : repas, sommeil, médicaments prescrits, rendez-vous ; pas de biberon après 2 ans', () => {
    const r = trackActions({ profile: 'child', enabled: ['sleep', 'meal', 'bottle'], ageMonths: 60 });
    expect(r.primary).toEqual(['meal', 'sleep', 'medication', 'appointment']);
    expect(r.more).not.toContain('bottle');
  });
  it('suivi non activé : la carte suivante prend la place', () => {
    expect(trackActions({ profile: 'newborn', enabled: ['bottle', 'diaper', 'sleep'], ageMonths: 2 }).primary).toEqual(['bottle', 'diaper', 'sleep', 'observation']);
  });
  it('profil d’un enfant selon l’âge et le parcours', () => {
    expect(childTrackProfile(2, { mealsEnabled: true })).toBe('newborn');
    expect(childTrackProfile(8, { mealsEnabled: true })).toBe('diversification');
    expect(childTrackProfile(8, { mealsEnabled: false })).toBe('newborn');
    expect(childTrackProfile(30, { mealsEnabled: true })).toBe('child');
    expect(childTrackProfile(10, { journey: 'child', mealsEnabled: true })).toBe('child');
  });
});

describe('cartes de suivi : dernière information', () => {
  it('textes des exemples demandés', () => {
    expect(lastInfo('bottle', { bottle: { at: at(13, 10), consumed_ml: 150, prepared_ml: 180 } }, { now: NOW })).toBe('Dernier biberon à 13 h 10 – 150 ml');
    expect(lastInfo('breastfeed', { breastfeed: { started_at: at(11, 0), ended_at: at(11, 18), side: 'left' } }, { now: NOW })).toBe('Dernière tétée : côté gauche – 18 min');
    expect(lastInfo('diaper', { diaper: { at: at(14, 5) } }, { now: NOW })).toBe('Dernier change à 14 h 05');
    expect(lastInfo('sleep', { sleep: { started_at: at(14, 18), ended_at: null } }, { name: 'Lina', now: NOW })).toBe('Lina dort depuis 42 min');
    expect(lastInfo('meal', { meal: { at: at(12, 15) } }, { now: NOW })).toBe('Dernier repas à 12 h 15');
  });
  it('dates relatives et cas vides', () => {
    expect(whenLabel(at(22, 5, 21), NOW)).toBe('hier à 22 h 05');
    expect(whenLabel(at(9, 0, 18), NOW)).toMatch(/^le 18 oct\.? à 9 h$/);
    expect(lastInfo('bottle', {}, { now: NOW })).toBe('Aucun biberon noté');
    expect(lastInfo('sleep', { sleep: { started_at: at(12, 0), ended_at: at(13, 30) } }, { sex: 'female', now: NOW })).toBe('Réveillée à 13 h 30');
    expect(lastInfo('medication', { medication: { name: 'Amoxicilline', nextAt: at(18, 0) } }, { now: NOW })).toBe('Amoxicilline : prochaine prise à 18 h');
    expect(lastInfo('medication', {}, { now: NOW })).toBe('Aucun traitement prescrit en cours');
  });
  it('prochaine prise d’après les heures de l’ordonnance', () => {
    expect(new Date(nextDose(['08:00', '20:00'], NOW)!).getHours()).toBe(20);
    expect(new Date(nextDose(['08:00'], NOW)!).getDate()).toBe(23);
    expect(nextDose([], NOW)).toBeNull();
  });
});
