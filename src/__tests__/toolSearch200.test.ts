/**
 * Recherche locale sur les 200 entrées du catalogue (outils + fonctions nommées de la liste des 200) : plus de 100
 * formulations réelles FR et EN, avec fautes, sans accents et langage parlé ; l'outil attendu doit être dans les
 * 3 premiers résultats. Les requêtes hors sujet ne renvoient RIEN (l'écran propose alors les catégories).
 * Exemples imposés : « Mon bébé prend le sein », « Je veux suivre ses nuits », « Je cherche une nounou »,
 * « Je suis épuisée et mon mari ne comprend pas ».
 */
import { setLocale } from '@/i18n';
import { toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { SCOPES, type ScopeCtx } from '@/lib/journeys/tools';

/** Tout le catalogue atteignable par un foyer complet (chaque portée, un enfant, une grossesse, un post-partum). */
function fullCatalog(): CatalogTool[] {
  const seen = new Set<string>();
  const out: CatalogTool[] = [];
  for (const scope of SCOPES) {
    const ctx: ScopeCtx = { scope, childId: scope === 'baby' || scope === 'child' ? 'c1' : null, pregnancyId: 'p1', babyId: 'c1', postpartum: true };
    for (const t of toolCatalog(ctx)) {
      const prev = out.find((x) => x.id === t.id);
      if (!prev) { seen.add(t.id); out.push({ ...t, fns: [...(t.fns ?? [])] }); continue; }
      for (const f of t.fns ?? []) if (!prev.fns!.some((x) => x.id === f.id)) prev.fns!.push(f);
    }
  }
  return out;
}

const FR: [string, string[]][] = [
  ['Mon bébé prend le sein', ['baby_breastfeed']],
  ['mon bebe prend le sein', ['baby_breastfeed']],
  ['il tète', ['baby_breastfeed']],
  ['il tete toutes les heures', ['baby_breastfeed']],
  ['elle tète beaucoup la nuit', ['baby_breastfeed']],
  ['chronomètre d’allaitement', ['baby_breastfeed']],
  ['allaitemnet', ['baby_breastfeed']],
  ['quel sein la dernière fois', ['h200_67', 'baby_breastfeed']],
  ['tire-lait', ['h200_71']],
  ['je tire mon lait', ['h200_71']],
  ['noter un biberon', ['baby_bottle']],
  ['combien de ml il a bu aujourd hui', ['h200_70', 'baby_bottle', 'baby_bottle_history']],
  ['combien de mesurettes', ['bottle_scoops']],
  ['Je veux suivre ses nuits', ['kid_sleep']],
  ['bébé ne dort pas', ['kid_sleep', 'kid_sleep_rhythm']],
  ['mon fils ne dort pas la nuit', ['kid_sleep', 'kid_sleep_rhythm']],
  ['il se réveille la nuit', ['kid_sleep', 'h200_88', 'kid_sleep_rhythm']],
  ['sieste', ['kid_sleep', 'h200_87']],
  ['graphique du sommeil', ['h200_90', 'kid_sleep_rhythm']],
  ['je dors mal', ['sleep']],
  ['39 de fièvre', ['h200_102', 'kid_health']],
  ['39 de fievre', ['h200_102', 'kid_health']],
  ['il a de la fièvre', ['h200_102', 'kid_health']],
  ['fivre bebe', ['h200_102', 'kid_health']],
  ['prendre sa température', ['h200_102', 'kid_health']],
  ['il est malade', ['kid_health']],
  ['rhume et toux', ['kid_health']],
  ['il fait ses dents', ['kid_teeth']],
  ['poussée dentaire', ['kid_teeth']],
  ['mal aux dents bebe', ['kid_teeth']],
  ['vaccins', ['kid_vaccines']],
  ['prochain vaccin', ['kid_vaccines', 'h200_98']],
  ['carnet de vaccination', ['h200_99', 'kid_vaccines']],
  ['combien il pèse', ['h200_92', 'kid_profile']],
  ['courbe de croissance', ['h200_95', 'kid_profile', 'h200_93']],
  ['périmètre crânien', ['h200_94']],
  ['couches', ['baby_diaper']],
  ['caca vert', ['baby_diaper']],
  ['rendez-vous pédiatre', ['appointments', 'h200_100', 'consult_questions']],
  ['questions pour le pédiatre', ['consult_questions', 'h200_109']],
  ['doliprane donné à quelle heure', ['medications', 'kid_treatments']],
  ['rappel médicament', ['h200_105', 'medications']],
  ['quand commencer la diversification', ['baby_foods', 'h200_111']],
  ['diversificaton', ['baby_foods', 'h200_111']],
  ['allergie arachide', ['h200_114', 'scan_avoid']],
  ['il refuse de manger', ['meals', 'baby_foods']],
  ['menu de la semaine', ['meal_menu']],
  ['liste de courses', ['family_shopping']],
  ['recette pour bébé', ['meals']],
  ['scanner une étiquette', ['scan_food', 'scan_product']],
  ['Je cherche une nounou', ['h200_141', 'h200_142']],
  ['je cherche une nouno', ['h200_141', 'h200_142', 'childcare']],
  ['combien coûte une crèche par mois', ['h200_146', 'h200_147']],
  ['budget de garde', ['h200_147', 'h200_146']],
  ['heures de garde du mois', ['h200_149']],
  ['contrat de la nounou', ['h200_151', 'documents']],
  ['carnet de liaison', ['h200_153', 'childcare']],
  ['photos de la crèche', ['childcare', 'h200_158']],
  ['écrire à la nounou', ['h200_159', 'childcare']],
  ['Je suis épuisée et mon mari ne comprend pas', ['couple_understand']],
  ['je suis epuisee et mon mari comprend rien', ['couple_understand']],
  ['on se dispute tout le temps', ['couple_understand']],
  ['je n en peux plus', ['exhaustion_check', 'family_sos', 'couple_understand']],
  ['qui fait quoi à la maison', ['mental_load', 'family_domains', 'family_tasks']],
  ['charge mentale', ['mental_load']],
  ['tâches ménagères', ['family_tasks']],
  ['qui se lève cette nuit', ['family_nights']],
  ['inviter mon mari', ['h200_162']],
  ['agenda familial', ['family_calendar']],
  ['garde alternée', ['custody']],
  ['maman solo', ['solo_parent']],
  ['semaine de grossesse', ['preg_evolution']],
  ['je suis enceinte', ['preg_evolution', 'preg_calendar']],
  ['bébé bouge moins', ['preg_moves']],
  ['nausées', ['h200_36', 'preg_feel']],
  ['idées de prénoms', ['preg_names']],
  ['valise maternité', ['h200_45', 'preg_lists']],
  ['quand vont arriver mes règles', ['cycle_home', 'cycle_calendar', 'h200_2']],
  ['ovulation', ['h200_17', 'ttc_cycle', 'ttc_tests']],
  ['oubli de pilule', ['h200_9', 'avoid_contraception', 'avoid_reminders']],
  ['école maternelle', ['kid_school']],
  ['devoirs', ['kid_school', 'kid_routines']],
  ['que faire avec mon enfant ce week-end', ['h200_131', 'nearby']],
  ['rencontrer d autres parents', ['community']],
  ['premiers pas', ['journal', 'kid_grow']],
  ['papiers administratifs', ['family_papers']],
  ['plus de lessive', ['family_stocks', 'h200_184']],
  ['urgence', ['emergency']],
];

const EN: [string, string[]][] = [
  ['my baby is breastfeeding', ['baby_breastfeed']],
  ['breastfeeding timer', ['baby_breastfeed']],
  ['nursing log', ['baby_breastfeed', 'h200_68']],
  ['which breast last', ['h200_67', 'baby_breastfeed']],
  ['breast pump', ['h200_71']],
  ['log a bottle', ['baby_bottle']],
  ['formula feed', ['baby_bottle']],
  ['baby wont sleep', ['kid_sleep', 'kid_sleep_rhythm']],
  ['baby won t sleep at night', ['kid_sleep', 'kid_sleep_rhythm']],
  ['track his nights', ['kid_sleep']],
  ['nap timer', ['kid_sleep', 'h200_87']],
  ['teething pain', ['kid_teeth']],
  ['teething', ['kid_teeth']],
  ['fever 39', ['h200_102', 'kid_health']],
  ['baby has a fever', ['h200_102', 'kid_health']],
  ['sick baby', ['kid_health']],
  ['vaccines', ['kid_vaccines']],
  ['how much does my baby weigh', ['h200_92', 'kid_profile']],
  ['growth chart', ['h200_95', 'kid_profile']],
  ['diaper log', ['baby_diaper']],
  ['nappy', ['baby_diaper']],
  ['starting solids', ['baby_foods', 'h200_111']],
  ['food allergy', ['h200_114', 'scan_avoid']],
  ['meal plan', ['meal_menu']],
  ['shopping list', ['family_shopping']],
  ['find a nanny', ['h200_141', 'h200_142', 'childcare']],
  ['childcare', ['childcare']],
  ['daily log from the nanny', ['h200_153', 'childcare']],
  ['my husband doesnt understand me', ['couple_understand']],
  ['i am exhausted and my partner does not understand', ['couple_understand', 'exhaustion_check']],
  ['who does what', ['mental_load', 'family_domains', 'family_tasks']],
  ['family calendar', ['family_calendar']],
  ['pregnancy week by week', ['preg_evolution']],
  ['kick count', ['preg_moves']],
  ['hospital bag', ['h200_45', 'preg_lists']],
  ['period tracker', ['cycle_home', 'cycle_calendar']],
  ['when do i ovulate', ['h200_17', 'ttc_cycle', 'ttc_tests']],
  ['birth control pill', ['h200_9', 'avoid_contraception', 'avoid_reminders']],
  ['homework', ['kid_school', 'kid_routines']],
  ['meet other parents', ['community']],
];

const NO_MATCH = ['météo de demain', 'horaires du train pour Lyon', 'réserver un hôtel à Rome', 'fix my car', 'cours du bitcoin'];

const run = (rows: [string, string[]][], lang: string, tools: CatalogTool[]) => {
  setLocale(lang as never);
  const fails: string[] = [];
  for (const [q, want] of rows) {
    const got = searchCatalog(tools, q).results.slice(0, 3).map((r) => r.tool.id);
    if (!got.some((g) => want.includes(g))) fails.push(`${q} → ${got.join(', ') || '(rien)'} (attendu ${want.join(' | ')})`);
  }
  return fails;
};

describe('recherche : 200 entrées, plus de 100 formulations réelles', () => {
  afterAll(() => setLocale('fr' as never));
  it('au moins 100 formulations FR et EN', () => {
    expect(FR.length + EN.length).toBeGreaterThanOrEqual(100);
  });
  it('les fonctions nommées de la liste des 200 sont indexées comme entrées à part', () => {
    setLocale('fr' as never);
    const got = searchCatalog(fullCatalog(), 'Suivi du sein gauche et droit').results.map((r) => r.tool.id);
    expect(got[0]).toBe('h200_67');
  });
  it('FR : l’outil attendu est dans les 3 premiers résultats', () => {
    expect(run(FR, 'fr', fullCatalog())).toEqual([]);
  });
  it('EN : l’outil attendu est dans les 3 premiers résultats', () => {
    expect(run(EN, 'en', fullCatalog())).toEqual([]);
  });
  it('requêtes hors sujet ou outil absent : aucun résultat au hasard (l’écran propose les catégories)', () => {
    setLocale('fr' as never);
    expect(NO_MATCH.filter((q) => searchCatalog(fullCatalog(), q).understood).map((q) => `${q} → ${searchCatalog(fullCatalog(), q).results.map((r) => r.tool.id).join(', ')}`)).toEqual([]);
  });
  it('outils construits le 20/11/2026 : trouvés par leur nom', () => {
    setLocale('fr' as never);
    for (const [q, id] of [['chronomètre des contractions', 'h200_39'], ['stock de lait', 'h200_73'], ['animaux', 'h200_189'], ['dépenses', 'h200_186'], ['projet de naissance', 'h200_44']]) {
      expect([q, searchCatalog(fullCatalog(), q).results.slice(0, 3).map((r) => r.tool.id)]).toEqual([q, expect.arrayContaining([id])]);
    }
  });
  it('DE / ES / IT : au moins les noms de la liste', () => {
    for (const [lang, q, id] of [['de', 'Zahnen', 'kid_teeth'], ['es', 'Dentición', 'kid_teeth'], ['it', 'Dentizione', 'kid_teeth'], ['de', 'Carnet', ''], ['it', 'Seno sinistro e destro', 'h200_67']] as const) {
      if (!id) continue;
      setLocale(lang as never);
      expect([lang, q, searchCatalog(fullCatalog(), q).results.slice(0, 3).map((r) => r.tool.id)]).toEqual([lang, q, expect.arrayContaining([id])]);
    }
  });
});
