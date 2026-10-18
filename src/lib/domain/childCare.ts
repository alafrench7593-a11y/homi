/**
 * Suivi de l'enfant : logique pure, testée.
 * Chronomètre de biberon fondé sur des horodatages (cohérent après navigation ou fermeture),
 * repères de sécurité sur les selles, la digestion et la fièvre (quand consulter, jamais un diagnostic),
 * évaluation d'une mesure UNIQUEMENT par rapport au plan écrit par le professionnel de l'enfant.
 * L'application ne calcule jamais une quantité, une dose ni une fréquence.
 */

// ------------------------------------------------------------------ chronomètre de biberon
export interface BottleChrono { started_at: string | null; paused_at: string | null; paused_seconds: number; ended_at: string | null }

/** Secondes de prise réellement écoulées (pauses déduites), recalculées depuis les horodatages. */
export function bottleElapsed(b: BottleChrono, now: Date = new Date()): number {
  if (!b.started_at) return 0;
  const end = b.ended_at ? Date.parse(b.ended_at) : b.paused_at ? Date.parse(b.paused_at) : now.getTime();
  return Math.max(0, Math.floor((end - Date.parse(b.started_at)) / 1000) - (b.paused_seconds ?? 0));
}

/** Reprise après pause : la durée de pause s'ajoute au total (plafonné à 24 h). */
export function resumePatch(b: BottleChrono, now: Date = new Date()) {
  if (!b.paused_at) return {};
  const add = Math.max(0, Math.floor((now.getTime() - Date.parse(b.paused_at)) / 1000));
  return { paused_at: null, paused_seconds: Math.min(86400, (b.paused_seconds ?? 0) + add) };
}

export const formatChrono = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ------------------------------------------------------------------ selles et digestion
export type StoolColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'pale' | 'other';
export const STOOL_COLORS: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Jaune' }, { value: 'green', label: 'Verte' }, { value: 'brown', label: 'Marron' },
  { value: 'pale', label: 'Blanche, mastic, très pâle' }, { value: 'black', label: 'Noire' }, { value: 'red', label: 'Rouge' }, { value: 'other', label: 'Autre' },
];
export const STOOL_CONSISTENCY: { value: 'liquid' | 'soft' | 'formed' | 'hard'; label: string }[] = [
  { value: 'liquid', label: 'Liquide' }, { value: 'soft', label: 'Molle' }, { value: 'formed', label: 'Moulée' }, { value: 'hard', label: 'Dure' },
];

export interface SafetyNotice { level: 'urgent' | 'soon' | 'watch'; title: string; body: string; source: 'stools' | 'dehydration' | 'fever' }

/** Repère après un change. Jamais d'hypothèse sur la cause : seulement quand demander un avis. */
export function stoolNotice(d: { stool_color?: StoolColor | null; blood_seen?: boolean | null }): SafetyNotice | null {
  if (d.stool_color === 'pale') {
    return { level: 'urgent', title: 'Selles blanches, mastic ou très pâles : à montrer à un médecin en urgence', body: 'Contactez votre médecin ou le 15 aujourd’hui. Si possible, gardez la couche ou prenez-la en photo pour la montrer.', source: 'stools' };
  }
  if (d.stool_color === 'black' || d.stool_color === 'red' || d.blood_seen) {
    return { level: 'soon', title: 'Selles noires, rouges ou avec du sang : consultez sans attendre', body: 'Montrez-les à votre médecin, à votre pédiatre ou appelez le 15 si votre enfant semble mal. Gardez la couche ou prenez une photo.', source: 'stools' };
  }
  return null;
}

/**
 * Repères sur 24 h glissantes, à partir de ce qui a été noté : vomissements ou diarrhées répétés,
 * moins de couches mouillées que d'habitude, fièvre avant 3 mois.
 */
export function digestionNotices(o: {
  now?: Date; ageMonths: number;
  observations: { at: string; kind: string; value_num?: number | null }[];
  diapers: { at: string; wet: boolean; stool_consistency?: string | null }[];
}): SafetyNotice[] {
  const now = (o.now ?? new Date()).getTime();
  const day = (at: string) => now - Date.parse(at) <= 86400000 && Date.parse(at) <= now;
  const out: SafetyNotice[] = [];
  const fever = o.observations.find((x) => x.kind === 'temperature' && day(x.at) && (x.value_num ?? 0) >= 38);
  if (fever && o.ageMonths < 3) {
    out.push({ level: 'urgent', title: 'Fièvre chez un bébé de moins de 3 mois', body: 'À cet âge, une température de 38 °C ou plus peut être une urgence : consultez un médecin ou appelez le 15.', source: 'fever' });
  }
  const vomits = o.observations.filter((x) => x.kind === 'vomit' && day(x.at)).length;
  const diarrhea = o.observations.filter((x) => x.kind === 'diarrhea' && day(x.at)).length + o.diapers.filter((d) => d.stool_consistency === 'liquid' && day(d.at)).length;
  if (vomits >= 3 || diarrhea >= 3) {
    out.push({ level: 'watch', title: vomits >= 3 ? 'Plusieurs vomissements notés en 24 h' : 'Plusieurs selles liquides notées en 24 h', body: 'Surveillez l’hydratation. Au moindre signe de déshydratation, ou si votre enfant vous inquiète, consultez rapidement.', source: 'dehydration' });
  }
  // Couches mouillées : comparaison avec la moyenne des 3 jours précédents, seulement si assez de données
  const wet = (fromH: number, toH: number) => o.diapers.filter((d) => d.wet && now - Date.parse(d.at) >= fromH * 3600000 && now - Date.parse(d.at) < toH * 3600000).length;
  const today = wet(0, 24);
  const before = [wet(24, 48), wet(48, 72), wet(72, 96)];
  if (before.every((n) => n >= 3)) {
    const avg = before.reduce((a, b) => a + b, 0) / 3;
    if (today <= avg / 2) out.push({ level: 'watch', title: 'Moins de couches mouillées que les jours précédents', body: 'D’après ce qui a été noté. Si c’est bien le cas, cela peut être un signe de déshydratation : demandez un avis médical.', source: 'dehydration' });
  }
  return out;
}

// ------------------------------------------------------------------ suivi de santé (plan médical)
export interface Tracker { kind: 'measure' | 'observation'; low_threshold: number | null; high_threshold: number | null; thresholds_from_plan: boolean; plan_by: string | null }

/**
 * Situe une mesure par rapport aux repères du PLAN écrit par le professionnel de l'enfant.
 * Sans plan : aucune interprétation. Jamais de conseil de dose ou de traitement.
 */
export function planCheck(tr: Tracker, value: number | null): { status: 'no_plan' | 'within' | 'below' | 'above'; message: string } {
  if (value == null || tr.kind !== 'measure' || !tr.thresholds_from_plan || (tr.low_threshold == null && tr.high_threshold == null)) {
    return { status: 'no_plan', message: 'Mesure notée. L’application ne l’interprète pas sans les repères de votre plan.' };
  }
  if (tr.low_threshold != null && value < tr.low_threshold) return { status: 'below', message: `En dessous du repère de votre plan (${tr.plan_by}). Suivez la conduite à tenir écrite dans ce plan, ou contactez l’équipe qui suit votre enfant.` };
  if (tr.high_threshold != null && value > tr.high_threshold) return { status: 'above', message: `Au-dessus du repère de votre plan (${tr.plan_by}). Suivez la conduite à tenir écrite dans ce plan, ou contactez l’équipe qui suit votre enfant.` };
  return { status: 'within', message: 'Dans les repères de votre plan.' };
}

// ------------------------------------------------------------------ bien-être de l'enfant
export const WELLBEING_SCALES: { key: 'crying' | 'irritability' | 'energy' | 'appetite' | 'sleep' | 'digestive_comfort'; label: string; levels: [string, string, string] }[] = [
  { key: 'crying', label: 'Pleurs', levels: ['Peu', 'Comme d’habitude', 'Beaucoup'] },
  { key: 'irritability', label: 'Irritabilité', levels: ['Calme', 'Comme d’habitude', 'Très grognon'] },
  { key: 'energy', label: 'Énergie', levels: ['Fatigué', 'Comme d’habitude', 'Très actif'] },
  { key: 'appetite', label: 'Appétit', levels: ['Petit appétit', 'Comme d’habitude', 'Grand appétit'] },
  { key: 'sleep', label: 'Sommeil', levels: ['Agité', 'Comme d’habitude', 'Très bon'] },
  { key: 'digestive_comfort', label: 'Confort digestif', levels: ['Inconfort', 'Comme d’habitude', 'Très bien'] },
];

export const DEV_DOMAINS: { value: 'motor' | 'language' | 'communication' | 'social' | 'autonomy' | 'learning' | 'eating' | 'sleep' | 'other'; label: string }[] = [
  { value: 'motor', label: 'Motricité' }, { value: 'language', label: 'Langage' }, { value: 'communication', label: 'Communication' },
  { value: 'social', label: 'Relations' }, { value: 'autonomy', label: 'Autonomie' }, { value: 'learning', label: 'Apprentissages' },
  { value: 'eating', label: 'Alimentation' }, { value: 'sleep', label: 'Sommeil' }, { value: 'other', label: 'Autre' },
];

// ------------------------------------------------------------------ dents de lait (schéma)
/** 20 dents de lait, dans l'ordre des arcades (haut droite → haut gauche, bas gauche → bas droite, vu de face). */
export const PRIMARY_TEETH: { id: string; label: string; arch: 'top' | 'bottom'; index: number }[] = [
  ...['Deuxième molaire', 'Première molaire', 'Canine', 'Incisive latérale', 'Incisive centrale'].map((n, i) => ({ id: `t-r-${i}`, label: `${n} en haut, droite`, arch: 'top' as const, index: i })),
  ...['Incisive centrale', 'Incisive latérale', 'Canine', 'Première molaire', 'Deuxième molaire'].map((n, i) => ({ id: `t-l-${i}`, label: `${n} en haut, gauche`, arch: 'top' as const, index: i + 5 })),
  ...['Deuxième molaire', 'Première molaire', 'Canine', 'Incisive latérale', 'Incisive centrale'].map((n, i) => ({ id: `b-r-${i}`, label: `${n} en bas, droite`, arch: 'bottom' as const, index: i })),
  ...['Incisive centrale', 'Incisive latérale', 'Canine', 'Première molaire', 'Deuxième molaire'].map((n, i) => ({ id: `b-l-${i}`, label: `${n} en bas, gauche`, arch: 'bottom' as const, index: i + 5 })),
];
