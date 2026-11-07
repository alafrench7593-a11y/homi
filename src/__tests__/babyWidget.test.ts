import { babyWidgetContent, type BabyWidgetTexts } from '@/widgets/babyWidgetContent';

const tx: BabyWidgetTexts = { appName: 'Au fil de nous', open: 'Ouvrir l’application', bottle: (t, n) => `Biberon de ${n} : ${t}`, dose: (t, w) => `Traitement (${w}) : ${t}`, nothing: 'Rien de prévu' };
const NOW = new Date(2026, 10, 7, 10, 0);
const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const at = (h: number, mi = 0) => new Date(2026, 10, 7, h, mi);

describe('widget « Bébé »', () => {
  it('discret par défaut : rien de lisible par un tiers', () => {
    const c = babyWidgetContent({ detailed: false, now: NOW, bottles: [{ due_at: at(11).toISOString(), childName: 'Lina' }], doses: [{ at: at(12), who: 'Moi' }], fmt }, tx);
    expect(c).toEqual({ title: 'Au fil de nous', line1: 'Ouvrir l’application', line2: '' });
  });
  it('détaillé : heures du prochain biberon et de la prochaine prise, jamais de nom de médicament', () => {
    const c = babyWidgetContent({ detailed: true, now: NOW, bottles: [{ due_at: at(14).toISOString(), childName: 'Noé' }, { due_at: at(11, 30).toISOString(), childName: 'Lina' }], doses: [{ at: at(20), who: 'Moi' }, { at: at(12), who: 'Lina' }], fmt }, tx);
    expect(c.line1).toBe('Biberon de Lina : 11:30');
    expect(c.line2).toBe('Traitement (Lina) : 12:00');
  });
  it('une prise passée de plus de 30 min n’est plus affichée ; rien de prévu → message neutre', () => {
    expect(babyWidgetContent({ detailed: true, now: NOW, bottles: [], doses: [{ at: at(9), who: 'Moi' }], fmt }, tx).line1).toBe('Rien de prévu');
    expect(babyWidgetContent({ detailed: true, now: NOW, bottles: [], doses: [{ at: at(9, 45), who: 'Moi' }], fmt }, tx).line1).toBe('Traitement (Moi) : 09:45');
  });
});
