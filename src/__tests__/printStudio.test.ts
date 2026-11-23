/** Print Studio : gabarits imprimables (sans écran pour l'enfant) — échappement, limites, formats, pictogrammes. */
import { cardsSheet, checklistSheet, glyph, nowNextSheet, routineSheet, storySheet } from '@/lib/print/templates';

describe('gabarits imprimables', () => {
  it('routine : une carte par étape, pictogramme imprimable, prénom, A4', () => {
    const h = routineSheet({ title: 'Le matin', childName: 'Lina', steps: [{ icon: 'toothbrush-paste', label: 'Brosser les dents' }, { icon: 'tshirt-crew', label: 'S’habiller' }, { icon: null, label: '  ' }] });
    expect(h).toContain('size:A4'); expect(h).toContain('🪥'); expect(h).toContain('Lina');
    expect(h.match(/class="card"/g)).toHaveLength(2);
  });
  it('texte du parent échappé (aucune injection HTML)', () => {
    const h = checklistSheet({ title: '<script>x</script>', items: ['a & b', '<img src=x onerror=1>'] });
    expect(h).not.toContain('<script>x'); expect(h).not.toContain('<img src'); expect(h).toContain('a &amp; b');
  });
  it('compact = A5, deux colonnes', () => { expect(cardsSheet({ title: 'C', cards: [{ label: 'Pause', icon: '✋' }], format: 'compact' })).toContain('size:A5'); });
  it('Maintenant / Ensuite : deux cases libellées', () => {
    const h = nowNextSheet({ now: { label: 'Dents' }, next: { label: 'Histoire' }, labels: { now: 'Maintenant', next: 'Ensuite' } });
    expect(h).toContain('Maintenant'); expect(h).toContain('Ensuite'); expect(h.match(/class="card"/g)).toHaveLength(2);
  });
  it('histoire : une phrase par page, limites', () => {
    expect(storySheet({ title: 'Dentiste', pages: Array.from({ length: 30 }, (_, i) => ({ label: `Phrase ${i}` })) }).match(/<p>/g)).toHaveLength(20);
  });
  it('pictogramme inconnu → puce neutre', () => { expect(glyph('inconnu-xyz')).toBe('●'); expect(glyph('🦷')).toBe('🦷'); });
});
