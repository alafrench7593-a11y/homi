import { assessSafety, auditAnswer, crisisMessage, urgentContacts } from '../../supabase/functions/_shared/safety';
import { assessProduct } from '../../supabase/functions/_shared/product-rules';
import { buildSystemPrompt, sanitizeContext } from '../../supabase/functions/_shared/assistant-prompt';

describe('détection des situations de crise (avant tout appel à l’IA)', () => {
  it.each([
    'Je n’en peux plus, je pense au suicide',
    'j ai envie de mourir depuis la naissance',
    'J’ai peur de faire du mal à mon bébé quand il pleure',
    'Ma famille serait mieux sans moi',
    'Je veux disparaître',
  ])('« %s » -> crise', (msg) => {
    expect(assessSafety(msg).level).toBe('crisis');
  });

  it.each([
    'Mon bébé ne respire plus normalement, il devient bleu',
    'Ma fille de 2 mois a de la fièvre',
    'Je saigne beaucoup depuis l’accouchement',
    'Je ne sens plus bouger mon bébé depuis ce matin',
    'Il a avalé une pile',
  ])('« %s » -> urgence médicale', (msg) => {
    expect(assessSafety(msg).level).toBe('medical_urgent');
  });

  it.each(['Que mettre dans la valise de maternité ?', 'Comment commencer la diversification ?', 'À quoi sert la rééducation du périnée ?'])(
    '« %s » -> question ordinaire',
    (msg) => {
      expect(assessSafety(msg).level).toBe('none');
    },
  );

  it('affiche le 3114, le 15 et le 112 en cas de crise', () => {
    const m = crisisMessage('crisis');
    expect(m).toContain('3114');
    expect(m).toContain('15');
    expect(m).toContain('112');
    expect(m).toMatch(/intelligence artificielle/);
  });
});

describe('contrôle des réponses de l’assistant', () => {
  it('bloque les posologies, garanties et usurpations', () => {
    expect(auditAnswer('Donnez 15 mg/kg de paracétamol')).toContain('posologie');
    expect(auditAnswer('Rassurez-vous, tout va bien.')).toContain('garantie de sécurité');
    expect(auditAnswer('Il n’est pas nécessaire de consulter.')).toContain('découragement à consulter');
    expect(auditAnswer('En tant que sage-femme… je suis sage-femme')).toContain('usurpation de qualité');
    expect(auditAnswer('Préparez la carte Vitale et le dossier de suivi.')).toEqual([]);
  });
  it('ne transmet qu’un contexte minimal et validé', () => {
    const c = sanitizeContext({ journeys: ['pregnant', 'hack'], pregnancyWeekSA: 24.4, firstName: 'Lina', multiplicity: 'twins', childrenAgesMonths: [7, 'x', 400] });
    expect(c).toEqual({ journeys: ['pregnant'], pregnancyWeekSA: 24, multiplicity: 'twins', childrenAgesMonths: [7], postpartumWeeks: null });
    const prompt = buildSystemPrompt('Toi & Moi', c, []);
    expect(prompt).toMatch(/jamais comme médecin/i);
    expect(prompt).toMatch(/jumeaux/);
    expect(prompt).not.toMatch(/Lina/);
  });
});

describe('évaluation transparente des produits', () => {
  const brie = {
    name: 'Brie démo', category: 'food', ingredients: ['Lait cru de vache', 'Sel'], declared_allergens: ['lait'],
    attributes: { raw_milk: true, cheese_type: 'soft' }, data_source: 'Base fictive', data_retrieved_at: '2026-10-15', is_demo: true,
  };
  it('signale le lait cru pendant la grossesse, avec critère et source', () => {
    const a = assessProduct(brie, { pregnant: true });
    const f = a.findings.find((x) => x.level === 'avoid_advised');
    expect(f?.title).toMatch(/lait cru/i);
    expect(f?.criterion).toBeTruthy();
    expect(f?.source).toBeTruthy();
  });
  it('fait l’exception pour les pâtes pressées cuites', () => {
    const a = assessProduct({ ...brie, attributes: { raw_milk: true, cheese_type: 'hard_cooked' } }, { pregnant: true });
    expect(a.findings.some((x) => x.level === 'avoid_advised')).toBe(false);
  });
  it('ne conclut jamais à l’absence de danger et marque les données fictives', () => {
    const a = assessProduct({ ...brie, attributes: {} , ingredients: ['Pomme'] }, {});
    expect(a.disclaimers.join(' ')).toMatch(/absence d’alerte ne signifie pas/);
    expect(a.disclaimers[0]).toMatch(/FICTIVES/);
  });
  it('croise les allergies déclarées de l’enfant', () => {
    const a = assessProduct({ ...brie, attributes: {} }, { childAgeMonths: 20, childDeclaredAllergies: ['lait'] });
    expect(a.findings.some((x) => x.level === 'avoid_advised' && /allergie/.test(x.title))).toBe(true);
  });
  it('signale les informations manquantes', () => {
    const a = assessProduct({ name: 'X', category: 'cream', data_source: 's', data_retrieved_at: 'd' }, {});
    expect(a.missing).toEqual(expect.arrayContaining(['Liste des ingrédients / composition', 'Allergènes déclarés']));
  });
});

describe('fièvre du nourrisson : pas de faux positif au-delà de 3 mois', () => {
  it.each(['Mon nouveau-né a 38,2 de fièvre', 'Mon bébé de 3 semaines a de la fièvre', 'Elle a 6 jours et de la fièvre'])('« %s » -> urgence', (m) => {
    expect(assessSafety(m).level).toBe('medical_urgent');
  });
  it('enfant de 4 ans avec fièvre : question ordinaire (pas de dramatisation)', () => {
    expect(assessSafety('Mon fils de 4 ans a de la fièvre, que noter pour le médecin ?').level).toBe('none');
  });
});

describe('signaux d’alerte grossesse, post-partum et bébé (court-circuit avant l’IA)', () => {
  it.each([
    'Je perds les eaux à 33 SA',
    'J’ai des contractions régulières à 31 SA',
    'Je suis enceinte et je suis tombée sur le ventre',
    'Je vois des mouches devant les yeux depuis ce matin',
    'Enceinte de 30 semaines, j’ai un mal de tête violent',
    'J’ai de la fièvre depuis ma césarienne',
    'Mon mollet est gonflé et douloureux depuis l’accouchement',
    'J’ai une douleur dans la poitrine et je suis essoufflée',
    'Je remplis une serviette par heure depuis la naissance',
    'Mon bébé est tout mou et difficile à réveiller',
    'La fontanelle de mon bébé est bombée',
    'Mon fils a des taches violettes qui ne s’effacent pas',
    'Mon nourrisson vomit vert',
    'Mon bébé ne boit plus depuis hier et a des couches sèches depuis ce matin',
    'Ma fille est tombée de la table à langer sur la tête',
  ])('« %s » -> urgence médicale', (msg) => {
    expect(assessSafety(msg).level).toBe('medical_urgent');
  });

  it.each(['J’entends des voix depuis la naissance du bébé', 'J’ai envie de secouer mon bébé quand il pleure'])('« %s » -> crise', (msg) => {
    expect(assessSafety(msg).level).toBe('crisis');
  });

  it.each([
    'Quels sont les signes d’une perte des eaux ?',
    'Je suis à 39 SA, comment se passe une césarienne programmée ?',
    'Combien de couches par jour pour un nouveau-né, en moyenne ?',
    'Comment soulager les contractions de fin de grossesse à 39 SA ?',
    'Mon bébé de 6 mois refuse la purée de carottes',
    'Comment organiser les nuits avec des jumeaux ?',
    'Quelle contraception après l’accouchement ?',
  ])('« %s » -> question ordinaire (pas de faux positif)', (msg) => {
    expect(assessSafety(msg).level).toBe('none');
  });

  it('la carte d’urgence propose 15, 112, 3114 et le 114 par SMS', () => {
    const medical = urgentContacts('medical_urgent');
    expect(medical.map((c) => c.number)).toEqual(['15', '112', '114', '3114']);
    expect(medical.find((c) => c.number === '114')?.channel).toBe('sms');
    expect(urgentContacts('crisis')[0].number).toBe('3114');
    expect(crisisMessage('medical_urgent')).toMatch(/114/);
    expect(crisisMessage('medical_urgent')).toMatch(/3114/);
    expect(crisisMessage('crisis')).toMatch(/114\*\* par SMS/);
  });
});
