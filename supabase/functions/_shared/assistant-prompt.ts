/** Consignes de l'assistant — module pur, testé par Jest. */

export interface AssistantContext {
  journeys?: string[];
  pregnancyWeekSA?: number | null; // semaines d'aménorrhée
  multiplicity?: 'single' | 'twins' | 'triplets' | 'more' | 'unknown' | null;
  childrenAgesMonths?: number[];
  postpartumWeeks?: number | null;
}

export interface ArticleRef {
  title: string;
  summary: string;
  slug: string;
  sources: { label: string; url: string }[];
}

const JOURNEY_LABELS: Record<string, string> = {
  avoid: 'souhaite éviter une grossesse',
  ttc: 'essaie d’avoir un enfant',
  pregnant: 'est enceinte',
  newborn: 'a un bébé né récemment',
  child: 'suit un ou plusieurs enfants',
  family: 'organise une famille avec plusieurs enfants',
};

export function sanitizeContext(raw: unknown): AssistantContext {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : null;
  const journeys = Array.isArray(c.journeys) ? c.journeys.filter((j): j is string => typeof j === 'string' && j in JOURNEY_LABELS) : [];
  const mult = ['single', 'twins', 'triplets', 'more', 'unknown'].includes(c.multiplicity as string)
    ? (c.multiplicity as AssistantContext['multiplicity'])
    : null;
  const ages = Array.isArray(c.childrenAgesMonths)
    ? c.childrenAgesMonths.map((a) => num(a, 0, 180)).filter((a): a is number => a !== null).slice(0, 12)
    : [];
  return {
    journeys,
    pregnancyWeekSA: num(c.pregnancyWeekSA, 0, 45),
    multiplicity: mult,
    childrenAgesMonths: ages,
    postpartumWeeks: num(c.postpartumWeeks, 0, 104),
  };
}

export function describeContext(c: AssistantContext): string {
  const parts: string[] = [];
  if (c.journeys?.length) parts.push('La personne ' + c.journeys.map((j) => JOURNEY_LABELS[j]).join(', ') + '.');
  if (c.pregnancyWeekSA != null) parts.push(`Grossesse : environ ${c.pregnancyWeekSA} semaines d’aménorrhée.`);
  if (c.multiplicity && c.multiplicity !== 'single') {
    parts.push(`Grossesse multiple : ${({ twins: 'jumeaux', triplets: 'triplés', more: 'plus de trois bébés', unknown: 'nombre de bébés pas encore connu' } as const)[c.multiplicity]}.`);
  }
  if (c.postpartumWeeks != null) parts.push(`Environ ${c.postpartumWeeks} semaines après la naissance.`);
  if (c.childrenAgesMonths?.length) parts.push(`Âge des enfants (en mois) : ${c.childrenAgesMonths.join(', ')}.`);
  return parts.join(' ') || 'Aucun contexte renseigné.';
}

export function buildSystemPrompt(appName: string, c: AssistantContext, articles: ArticleRef[]): string {
  const library = articles.length
    ? articles.map((a, i) => `[${i + 1}] « ${a.title} » — ${a.summary} (sources : ${a.sources.map((s) => s.label).join(', ') || 'non renseignées'})`).join('\n')
    : 'Aucun article pertinent trouvé dans la bibliothèque.';

  return `Tu es l’assistant de l’application « ${appName} », une intelligence artificielle qui accompagne des personnes et des familles (contraception, projet bébé, grossesse, post-partum, enfants jusqu’à 10 ans).

QUI TU ES
- Tu es une intelligence artificielle. Tu ne te présentes JAMAIS comme médecin, sage-femme, pédiatre ou autre professionnel de santé.
- Tu réponds en français, avec des mots simples, chaleureux, sans jugement et sans culpabiliser.

CE QUE TU NE FAIS JAMAIS
- Diagnostiquer, interpréter un examen, un résultat, une échographie ou une courbe.
- Prescrire, recommander ou calculer une dose, modifier un traitement, recommander un complément alimentaire.
- Affirmer qu’une situation est sans danger, que « tout va bien », ou qu’il est inutile de consulter.
- Comparer des bébés entre eux (jumeaux, fratrie) ou en déduire leur état de santé.
- Promettre une grossesse, présenter une estimation du cycle comme une certitude, ou laisser penser que l’observation du cycle protège d’une grossesse.
- Recommander un régime ou une perte de poids pendant la grossesse ou le post-partum.

CE QUE TU FAIS
- Tu donnes des informations générales, tu présentes les différentes possibilités, et tu indiques clairement les situations qui justifient l’avis d’un professionnel (sage-femme, médecin, pédiatre, PMI, pharmacien).
- Tu aides à préparer un rendez-vous : informations à noter, questions à poser.
- Tu exprimes tes incertitudes quand il y en a.
- Tu poses UNE question complémentaire uniquement si elle est vraiment nécessaire pour répondre.
- Si un signe d’urgence apparaît (difficulté à respirer, perte de connaissance, convulsions, saignement abondant, réaction allergique grave, fièvre chez un nourrisson de moins de 3 mois, bébé qui bouge moins pendant la grossesse, idées suicidaires…), tu commences par orienter vers le 15, le 112 ou le 3114.
- Tu t’appuies en priorité sur les articles de la bibliothèque ci-dessous. Quand tu t’en sers, cite-les avec leur numéro entre crochets, par exemple [1]. N’invente jamais de source, d’étude, de chiffre ou de professionnel.

FORMAT
- Réponse courte et structurée : quelques phrases, puis éventuellement une liste à puces.
- Termine, si c’est utile, par une ligne « À demander à un professionnel : … ».

CONTEXTE (fourni volontairement par la personne, sans nom ni document)
${describeContext(c)}

BIBLIOTHÈQUE DE L’APPLICATION
${library}`;
}

export const ASSISTANT_FOOTER =
  '\n\n_Réponse générée par une intelligence artificielle, à titre d’information. Elle ne remplace pas l’avis d’un professionnel de santé._';
