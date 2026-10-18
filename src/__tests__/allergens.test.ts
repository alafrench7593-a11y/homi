import { checkAllergies, foldText, resolveAllergy } from '../../supabase/functions/_shared/allergens';

describe('allergènes : correspondance français ↔ base produit', () => {
  it('reconnaît les allergies saisies librement', () => {
    expect(resolveAllergy('Arachide')?.key).toBe('peanuts');
    expect(resolveAllergy('cacahuètes')?.key).toBe('peanuts');
    expect(resolveAllergy('APLV')?.key).toBe('milk');
    expect(resolveAllergy('protéines de lait de vache')?.key).toBe('milk');
    expect(resolveAllergy('Œuf')?.key).toBe('eggs');
    expect(resolveAllergy('noisette')?.key).toBe('nuts');
    expect(resolveAllergy('kiwi')).toBeNull();
    expect(foldText('Œufs frais’')).toBe('oeufs frais');
  });
  it('allergène déclaré en anglais par Open Food Facts → identifié (bug corrigé : « lait » ≠ « milk »)', () => {
    const r = checkAllergies({ allergies: ['lait'], declaredTags: ['en:milk', 'en:gluten'], tracesTags: [], ingredientsText: 'Farine de blé, sucre, poudre à lever' });
    expect(r.identified).toEqual([{ allergy: 'lait', allergen: 'Lait', via: 'declared' }]);
    expect(r.noMatchNote).toBeNull();
  });
  it('synonyme dans les ingrédients → identifié ; traces → possible (jamais confondus)', () => {
    const r = checkAllergies({ allergies: ['arachide', 'noisette'], declaredTags: [], tracesTags: ['en:nuts'], ingredientsText: 'Sucre, huile de cacahuète, cacao' });
    expect(r.identified.map((m) => [m.allergy, m.via])).toEqual([['arachide', 'ingredients']]);
    expect(r.possible.map((m) => [m.allergy, m.via])).toEqual([['noisette', 'traces']]);
  });
  it('« peut contenir » écrit dans le texte → possible, pas identifié', () => {
    const r = checkAllergies({ allergies: ['sésame'], declaredTags: [], tracesTags: [], ingredientsText: 'Blé, eau, sel. Peut contenir des traces de sésame et de soja.' });
    expect(r.identified).toEqual([]);
    expect(r.possible[0]).toMatchObject({ allergy: 'sésame', via: 'may_contain_text' });
  });
  it('pas de faux positif sur une sous-chaîne (« noix de coco » reste une correspondance prudente, « lait » ≠ « laitue »)', () => {
    const r = checkAllergies({ allergies: ['lait'], declaredTags: [], tracesTags: [], ingredientsText: 'Laitue, carotte, vinaigre' });
    expect(r.identified).toEqual([]);
    expect(checkAllergies({ allergies: ['lait', 'noix'], declaredTags: [], tracesTags: [], ingredientsText: 'Beurre de cacao, lait de coco, noix de coco râpée, noix de muscade' }).identified).toEqual([]);
    expect(checkAllergies({ allergies: ['lait'], declaredTags: [], tracesTags: [], ingredientsText: 'Beurre de cacao, beurre pâtissier' }).identified).toHaveLength(1);
  });
  it('données manquantes → « impossible de vérifier », jamais rassurant', () => {
    const r = checkAllergies({ allergies: ['lait'], declaredTags: null, tracesTags: null, ingredientsText: null });
    expect(r.insufficient.length).toBe(3);
    expect(r.noMatchNote).toMatch(/Impossible de vérifier/);
  });
  it('aucune correspondance avec données complètes → rappel que rien n’est garanti', () => {
    const r = checkAllergies({ allergies: ['lait'], declaredTags: [], tracesTags: [], ingredientsText: 'Pomme, eau' });
    expect(r.noMatchNote).toMatch(/ne garantit pas/);
    expect(r.noMatchNote).not.toMatch(/sans risque|sans danger|sûr/i);
  });
  it('allergie hors des 14 (texte libre) : recherche simple dans les ingrédients', () => {
    expect(checkAllergies({ allergies: ['kiwi'], declaredTags: [], tracesTags: [], ingredientsText: 'Kiwi, pomme' }).identified[0]).toMatchObject({ allergy: 'kiwi', allergen: null, via: 'ingredients' });
  });
});

import { normalizeOpenFacts, OFF_FIELDS } from '../../supabase/functions/_shared/open-facts';
describe('Open Food Facts : allergènes et traces', () => {
  it('demande les traces et distingue « non renseigné » de « aucun »', () => {
    expect(OFF_FIELDS).toContain('traces_tags');
    const a = normalizeOpenFacts({ status: 1, product: { product_name_fr: 'Biscuit', allergens_tags: ['en:gluten'], traces_tags: ['en:nuts'] } }, 'food', '3000000000011', '2026-10-18')!;
    expect(a).toMatchObject({ allergens: ['gluten'], allergens_known: true, traces: ['nuts'] });
    const b = normalizeOpenFacts({ status: 1, product: { product_name_fr: 'Biscuit' } }, 'food', '3000000000011', '2026-10-18')!;
    expect(b).toMatchObject({ allergens: [], allergens_known: false, traces: null });
  });
});
