/**
 * Détection des situations qui demandent une aide HUMAINE immédiate.
 * Module pur (sans dépendance) : utilisé par la fonction « assistant »
 * ET par l'application (bilan émotionnel), testé par Jest.
 *
 * Principe : en cas de doute, on affiche les ressources. Un faux positif
 * affiche des numéros utiles ; un faux négatif pourrait coûter une vie.
 */

export type SafetyLevel = 'none' | 'medical_urgent' | 'crisis';

export interface SafetyResult {
  level: SafetyLevel;
  reasons: string[];
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ');

// Idées suicidaires, auto-agression, peur de faire du mal à soi ou à l'enfant
const CRISIS_PATTERNS: [RegExp, string][] = [
  [/\b(suicid|me suicider|me tuer|en finir|mettre fin a (mes jours|ma vie))/, 'idées suicidaires'],
  [/\b(envie|besoin|pense|penser|idee) (de|a) (mourir|disparaitre|ne plus (etre la|me reveiller))/, 'idées de mort'],
  [/\b(je veux|j ai envie de|voudrais) (mourir|disparaitre)/, 'idées de mort'],
  [/\b(me faire du mal|me blesser|me scarifier|me mutiler)/, 'auto-agression'],
  [/\b(faire du mal|blesser|secouer|frapper|etouffer) (a |à )?(mon|ma|mes|le|la) ?(bebe|enfant|fils|fille|jumeaux|petit|petite)/, 'peur de faire du mal à l’enfant'],
  [/\bpeur de (lui|leur) faire du mal/, 'peur de faire du mal à l’enfant'],
  [/\b(sans moi (il|elle|ils|elles) seraient mieux|(mon|ma) (bebe|famille) serait mieux sans moi)/, 'sentiment d’être un fardeau'],
  [/\b(plus envie de vivre|plus de raison de vivre|la vie n a plus de sens)/, 'perte du sens de la vie'],
  [/\b(il|elle|on) me (frappe|bat|menace)|violence(s)? conjugale/, 'violences'],
];

// Signes d'urgence médicale : on oriente vers le 15 / 112, sans interpréter
const MEDICAL_PATTERNS: [RegExp, string][] = [
  [/\b(ne respire (plus|pas|mal)|respire (tres )?mal|arret (de la )?respiration|devient (bleu|violet)|levres bleues)/, 'difficulté respiratoire'],
  [/\b(convuls|crise d epilepsie|tremble de tout son corps)/, 'convulsions'],
  [/\b(inconscient|ne reagit (plus|pas)|perte de connaissance|s est evanoui|malaise grave)/, 'perte de connaissance'],
  [/\b(saigne (beaucoup|abondamment)|hemorragie|perd (beaucoup )?de sang|caillots? (enormes|tres gros))/, 'saignement important'],
  [/\b(gonfle(ment)? (du visage|des levres|de la langue|de la gorge)|choc anaphylactique|urticaire geante)/, 'réaction allergique grave'],
  [/\b(a avale|a ingere|a bu) (un |une |des |du |de la )?(medicament|produit menager|pile|aimant|javel|lessive)/, 'ingestion dangereuse'],
  [/\b(ne sens plus (le |mon |mes )?(bebe|bouger)|(bebe|il|elle) ne bouge plus)/, 'mouvements fœtaux diminués'],
  [/\bperte des eaux.{0,30}(verte|marron|teintee)|\beaux (vertes|teintees)/, 'liquide amniotique teinté'],
  [/\b(maux? de tete (violent|intense)|voit des (mouches|eclairs)).{0,60}(enceinte|grossesse)|(enceinte|grossesse).{0,60}(maux? de tete (violent|intense)|voit des (mouches|eclairs))/, 'signes possibles de pré-éclampsie'],
];

// Fièvre chez un nourrisson de moins de 3 mois : toujours un avis médical rapide
const INFANT_UNDER_3M = /\b(nouveau[ -]?ne|nourrisson|bebe|fille|fils|enfant|il|elle)\b.{0,20}\b((de |a |a peine )?([0-9]|1[0-2]) (jours?|semaines?)|(de |a )?(moins de )?(1|2|un|deux) mois|3 mois)\b|\bnouveau[ -]?ne\b/;

export function assessSafety(text: string): SafetyResult {
  const t = normalize(text);
  const crisis = CRISIS_PATTERNS.filter(([re]) => re.test(t)).map(([, r]) => r);
  if (crisis.length) return { level: 'crisis', reasons: unique(crisis) };
  const medical = MEDICAL_PATTERNS.filter(([re]) => re.test(t)).map(([, r]) => r);
  if (/\bfievre|\b(38|39|40)([.,][0-9])? ?(°|degres)/.test(t) && INFANT_UNDER_3M.test(t)) medical.push('fièvre chez un nourrisson');
  if (medical.length) return { level: 'medical_urgent', reasons: unique(medical) };
  return { level: 'none', reasons: [] };
}

const unique = (a: string[]) => [...new Set(a)];

/** Réponse humaine immédiate, sans appel à l'IA, toujours gratuite. */
export function crisisMessage(level: Exclude<SafetyLevel, 'none'>): string {
  if (level === 'crisis') {
    return [
      'Ce que vous traversez compte, et vous n’avez pas à le porter seule ou seul.',
      '',
      'Si vous pensez au suicide, si vous avez peur de vous faire du mal ou de faire du mal à quelqu’un :',
      '• appelez le **3114** (prévention du suicide, gratuit, 24 h/24) ;',
      '• en cas de danger immédiat, appelez le **15** ou le **112** ;',
      '• si un enfant est en danger, le **119** répond aussi 24 h/24.',
      '',
      'Si vous le pouvez, ne restez pas seule ou seul : appelez une personne de confiance et demandez-lui de venir.',
      'Je suis une intelligence artificielle : je ne peux pas vous aider comme une personne le ferait, mais ces professionnels le peuvent, maintenant.',
    ].join('\n');
  }
  return [
    'Ce que vous décrivez peut nécessiter une aide médicale **rapide**.',
    '',
    '• Appelez le **15** (SAMU) ou le **112** sans attendre.',
    '• Si vous avez un doute, appelez quand même : ce sont les professionnels qui évalueront la situation.',
    '',
    'Je suis une intelligence artificielle et je ne peux pas évaluer une urgence. Je reste disponible ensuite pour vous aider à préparer les informations à transmettre.',
  ].join('\n');
}

/** Formulations interdites dans une réponse de l'assistant (posologies, garanties). */
const FORBIDDEN_OUTPUT: [RegExp, string][] = [
  [/\b\d+([.,]\d+)?\s?(mg|milligrammes?|µg|mcg|ui)\b(?!.*(cm|kg de poids))/i, 'posologie'],
  [/\b\d+([.,]\d+)?\s?mg\s?\/\s?kg\b/i, 'posologie'],
  [/\b(il n'?est pas (utile|necessaire|nécessaire) de consulter|inutile de consulter|pas besoin de (consulter|voir un medecin|voir un médecin))/i, 'découragement à consulter'],
  [/\b(tout va bien|c'?est (tout a fait|totalement) normal|aucun danger|sans (aucun )?danger|je vous garantis)\b/i, 'garantie de sécurité'],
  [/\bje suis (medecin|médecin|sage-femme|pediatre|pédiatre|infirmi[eè]re?)\b/i, 'usurpation de qualité'],
];

export function auditAnswer(answer: string): string[] {
  const a = answer.replace(/[’‘]/g, "'");
  return FORBIDDEN_OUTPUT.filter(([re]) => re.test(a)).map(([, r]) => r);
}
