jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
import { appearsVerbatim, datesInLine, looksGarbled, parseDocumentText } from '@/lib/documents/textParse';
import { suggestCategory } from '@/lib/documents/taxonomy';

export const BLOOD = `LABORATOIRE DE BIOLOGIE MÉDICALE DES LILAS
Dr Martin Dupont
Prélèvement du 03/09/2026 à 08:12
COMPTE RENDU D'ANALYSES
HÉMATOLOGIE
Hémoglobine ............ 11,8 g/dL (12,0 - 16,0)
Plaquettes 245 G/L (150 - 400)
Ferritine 9 µg/L (15 - 150)
BIOCHIMIE
Glycémie à jeun 0,92 g/L [0,70 - 1,10]
TSH 2,1 mUI/L
Conclusion : contrôle conseillé dans 3 mois.
Rendez-vous de contrôle le 03/12/2026`;

export const ORDO = `Dr Claire Bernard
Pédiatre
Paris, le 12 octobre 2026
ORDONNANCE
Léo, 18 mois, 11 kg
AMOXICILLINE 250 mg/5 ml poudre pour suspension buvable
1 dose-poids matin et soir pendant 6 jours
DOLIPRANE 2,4 % suspension buvable
si fièvre, 1 dose-poids toutes les 6 heures
SÉRUM PHYSIOLOGIQUE
À renouveler 1 fois`;

describe('dates', () => {
  it('jour/mois/année, ISO, en toutes lettres', () => {
    expect(datesInLine('le 03/09/2026')[0]).toMatchObject({ iso: '2026-09-03', ambiguous: true });
    expect(datesInLine('le 23/09/2026')[0]).toMatchObject({ iso: '2026-09-23', ambiguous: false });
    expect(datesInLine('2026-10-12')[0]).toMatchObject({ iso: '2026-10-12', ambiguous: false });
    expect(datesInLine('Paris, le 12 octobre 2026')[0]).toMatchObject({ iso: '2026-10-12', ambiguous: false });
    expect(datesInLine('le 1er mars 2027')[0].iso).toBe('2027-03-01');
  });
  it('date impossible ou année à deux chiffres : jamais certaine', () => {
    expect(datesInLine('31/02/2026')[0]).toMatchObject({ iso: null, ambiguous: true });
    expect(datesInLine('15/09/26')[0]).toMatchObject({ iso: '2026-09-15', ambiguous: true });
  });
});

describe('bilan sanguin', () => {
  const p = parseDocumentText(BLOOD);
  it('type, laboratoire, auteur, date de prélèvement', () => {
    expect(p.category).toBe('blood_test');
    expect(p.establishment?.text).toMatch(/^LABORATOIRE DE BIOLOGIE/);
    expect(p.author?.text).toBe('Dr Martin Dupont');
    expect(p.dates.find((d) => d.kind === 'sampling')?.iso).toBe('2026-09-03');
  });
  it('valeurs recopiées exactement, unités et plages du document', () => {
    const v = Object.fromEntries(p.values.map((x) => [x.name, x]));
    expect(v['Hémoglobine']).toMatchObject({ value: '11,8', unit: 'g/dL', range: '12,0 - 16,0', confidence: 'high' });
    expect(v['Ferritine']).toMatchObject({ value: '9', unit: 'µg/L', range: '15 - 150' });
    expect(v['Glycémie à jeun']).toMatchObject({ value: '0,92', unit: 'g/L', range: '0,70 - 1,10' });
    expect(v['TSH']).toMatchObject({ value: '2,1', unit: 'mUI/L', range: null, confidence: 'medium' });
    expect(p.values.some((x) => /normal|anormal|bas|élevé/i.test(JSON.stringify(x)))).toBe(false);
  });
  it('conclusion et échéance recopiées', () => {
    expect(p.conclusions[0].text).toBe('Conclusion : contrôle conseillé dans 3 mois.');
    expect(p.deadlines.some((d) => d.date === '03/12/2026')).toBe(true);
  });
});

describe('ordonnance', () => {
  const p = parseDocumentText(ORDO);
  it('reconnue, prescripteur et date', () => {
    expect(p.category).toBe('prescription');
    expect(p.author?.text).toBe('Dr Claire Bernard');
    expect(p.documentDate?.iso).toBe('2026-10-12');
    expect(p.values).toEqual([]);
  });
  it('médicaments : nom, dose, consignes et durée recopiés ; ce qui manque reste manquant', () => {
    const amox = p.medications.find((m) => m.name.startsWith('AMOXICILLINE'))!;
    expect(amox).toMatchObject({ dose: '250 mg/5 ml', duration: 'pendant 6 jours' });
    expect(amox.instructions).toMatch(/matin et soir/);
    const doli = p.medications.find((m) => m.name.startsWith('DOLIPRANE'))!;
    expect(doli.dose).toBe('2,4 %');
    expect(doli.duration).toBeNull();
    expect(doli.missing).toContain('duration');
  });
  it('renouvellement recopié', () => {
    expect(p.renewal).toBe('À renouveler 1 fois');
  });
});

describe('lecture incertaine', () => {
  it('lignes illisibles signalées, jamais transformées en valeur', () => {
    const p = parseDocumentText('Bilan sanguin\nFerr#t%ne ?? 4§ µg/L\nHémoglobine [illisible] g/dL\nPlaquettes 245 G/L');
    expect(p.uncertain.map((u) => u.reason)).toEqual(['marker', 'illegible']);
    expect(p.values.map((v) => v.name)).toEqual(['Plaquettes']);
    expect(looksGarbled('§§¤¤ ##@@ ~~')).toBe('garbled');
  });
  it('vaccins et non-médical', () => {
    const p = parseDocumentText('Carnet de vaccination\nHexyon 1re dose le 15/02/2025\nPrevenar 13 rappel 15/04/2025');
    expect(p.category).toBe('vaccination');
    expect(p.vaccines).toHaveLength(2);
    expect(p.vaccines[0].date).toBe('15/02/2025');
    expect(suggestCategory('Facture n° 2026-118\nMontant TTC 45,00 €')).toBe('invoice');
    expect(suggestCategory('Recette de la tarte aux pommes')).toBeNull();
  });
  it('appearsVerbatim protège les chiffres', () => {
    expect(appearsVerbatim(BLOOD, '11,8 g/dL')).toBe(true);
    expect(appearsVerbatim(BLOOD, '11.8 g/dL')).toBe(true);
    expect(appearsVerbatim(BLOOD, '18,1 g/dL')).toBe(false);
  });
});
