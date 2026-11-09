/**
 * Suivi de l'enfant : logique pure, testée.
 * Chronomètre de biberon fondé sur des horodatages (cohérent après navigation ou fermeture),
 * repères de sécurité sur les selles, la digestion et la fièvre (quand consulter, jamais un diagnostic),
 * évaluation d'une mesure UNIQUEMENT par rapport au plan écrit par le professionnel de l'enfant.
 * L'application ne calcule jamais une quantité, une dose ni une fréquence.
 */

import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

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
const STOOL_COLORS_FR: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Jaune' }, { value: 'green', label: 'Verte' }, { value: 'brown', label: 'Marron' },
  { value: 'pale', label: 'Blanche, mastic, très pâle' }, { value: 'black', label: 'Noire' }, { value: 'red', label: 'Rouge' }, { value: 'other', label: 'Autre' },
];
const STOOL_COLORS_EN: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Yellow' }, { value: 'green', label: 'Green' }, { value: 'brown', label: 'Brown' },
  { value: 'pale', label: 'White, putty-coloured, very pale' }, { value: 'black', label: 'Black' }, { value: 'red', label: 'Red' }, { value: 'other', label: 'Other' },
];
const STOOL_COLORS_ES: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Amarilla' }, { value: 'green', label: 'Verde' }, { value: 'brown', label: 'Marrón' },
  { value: 'pale', label: 'Blanca, color masilla, muy pálida' }, { value: 'black', label: 'Negra' }, { value: 'red', label: 'Roja' }, { value: 'other', label: 'Otro' },
];
const STOOL_COLORS_DE: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Gelb' }, { value: 'green', label: 'Grün' }, { value: 'brown', label: 'Braun' },
  { value: 'pale', label: 'Weiß, kittfarben, sehr hell' }, { value: 'black', label: 'Schwarz' }, { value: 'red', label: 'Rot' }, { value: 'other', label: 'Andere' },
];
const STOOL_COLORS_IT: { value: StoolColor; label: string }[] = [
  { value: 'yellow', label: 'Gialla' }, { value: 'green', label: 'Verde' }, { value: 'brown', label: 'Marrone' },
  { value: 'pale', label: 'Bianca, color stucco, molto chiara' }, { value: 'black', label: 'Nera' }, { value: 'red', label: 'Rossa' }, { value: 'other', label: 'Altro' },
];
export const STOOL_COLORS = localized(STOOL_COLORS_FR, STOOL_COLORS_EN, { es: STOOL_COLORS_ES, de: STOOL_COLORS_DE, it: STOOL_COLORS_IT });
const STOOL_CONSISTENCY_FR: { value: 'liquid' | 'soft' | 'formed' | 'hard'; label: string }[] = [
  { value: 'liquid', label: 'Liquide' }, { value: 'soft', label: 'Molle' }, { value: 'formed', label: 'Moulée' }, { value: 'hard', label: 'Dure' },
];
const STOOL_CONSISTENCY_EN: { value: 'liquid' | 'soft' | 'formed' | 'hard'; label: string }[] = [
  { value: 'liquid', label: 'Liquid' }, { value: 'soft', label: 'Soft' }, { value: 'formed', label: 'Formed' }, { value: 'hard', label: 'Hard' },
];
const STOOL_CONSISTENCY_ES: typeof STOOL_CONSISTENCY_FR = [
  { value: 'liquid', label: 'Líquida' }, { value: 'soft', label: 'Blanda' }, { value: 'formed', label: 'Formada' }, { value: 'hard', label: 'Dura' },
];
const STOOL_CONSISTENCY_DE: typeof STOOL_CONSISTENCY_FR = [
  { value: 'liquid', label: 'Flüssig' }, { value: 'soft', label: 'Weich' }, { value: 'formed', label: 'Geformt' }, { value: 'hard', label: 'Hart' },
];
const STOOL_CONSISTENCY_IT: typeof STOOL_CONSISTENCY_FR = [
  { value: 'liquid', label: 'Liquida' }, { value: 'soft', label: 'Morbida' }, { value: 'formed', label: 'Formata' }, { value: 'hard', label: 'Dura' },
];
export const STOOL_CONSISTENCY = localized(STOOL_CONSISTENCY_FR, STOOL_CONSISTENCY_EN, { es: STOOL_CONSISTENCY_ES, de: STOOL_CONSISTENCY_DE, it: STOOL_CONSISTENCY_IT });

export interface SafetyNotice { level: 'urgent' | 'soon' | 'watch'; title: string; body: string; source: 'stools' | 'dehydration' | 'fever' }

/** Repère après un change. Jamais d'hypothèse sur la cause : seulement quand demander un avis. */
export function stoolNotice(d: { stool_color?: StoolColor | null; blood_seen?: boolean | null }): SafetyNotice | null {
  if (d.stool_color === 'pale') {
    return { level: 'urgent', title: tr('l6.care.paleTitle'), body: tr('l6.care.paleBody'), source: 'stools' };
  }
  if (d.stool_color === 'black' || d.stool_color === 'red' || d.blood_seen) {
    return { level: 'soon', title: tr('l6.care.bloodTitle'), body: tr('l6.care.bloodBody'), source: 'stools' };
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
    out.push({ level: 'urgent', title: tr('l6.care.feverTitle'), body: tr('l6.care.feverBody'), source: 'fever' });
  }
  const vomits = o.observations.filter((x) => x.kind === 'vomit' && day(x.at)).length;
  const diarrhea = o.observations.filter((x) => x.kind === 'diarrhea' && day(x.at)).length + o.diapers.filter((d) => d.stool_consistency === 'liquid' && day(d.at)).length;
  if (vomits >= 3 || diarrhea >= 3) {
    out.push({ level: 'watch', title: vomits >= 3 ? tr('l6.care.vomitTitle') : tr('l6.care.looseTitle'), body: tr('l6.care.hydrationBody'), source: 'dehydration' });
  }
  // Couches mouillées : comparaison avec la moyenne des 3 jours précédents, seulement si assez de données
  const wet = (fromH: number, toH: number) => o.diapers.filter((d) => d.wet && now - Date.parse(d.at) >= fromH * 3600000 && now - Date.parse(d.at) < toH * 3600000).length;
  const today = wet(0, 24);
  const before = [wet(24, 48), wet(48, 72), wet(72, 96)];
  if (before.every((n) => n >= 3)) {
    const avg = before.reduce((a, b) => a + b, 0) / 3;
    if (today <= avg / 2) out.push({ level: 'watch', title: tr('l6.care.wetTitle'), body: tr('l6.care.wetBody'), source: 'dehydration' });
  }
  return out;
}

// ------------------------------------------------------------------ suivi de santé (plan médical)
export interface Tracker { kind: 'measure' | 'observation'; low_threshold: number | null; high_threshold: number | null; thresholds_from_plan: boolean; plan_by: string | null }

/**
 * Situe une mesure par rapport aux repères du PLAN écrit par le professionnel de l'enfant.
 * Sans plan : aucune interprétation. Jamais de conseil de dose ou de traitement.
 */
export function planCheck(tracker: Tracker, value: number | null): { status: 'no_plan' | 'within' | 'below' | 'above'; message: string } {
  if (value == null || tracker.kind !== 'measure' || !tracker.thresholds_from_plan || (tracker.low_threshold == null && tracker.high_threshold == null)) {
    return { status: 'no_plan', message: tr('l6.care.noPlan') };
  }
  if (tracker.low_threshold != null && value < tracker.low_threshold) return { status: 'below', message: tr('l6.care.below', { by: tracker.plan_by ?? '' }) };
  if (tracker.high_threshold != null && value > tracker.high_threshold) return { status: 'above', message: tr('l6.care.above', { by: tracker.plan_by ?? '' }) };
  return { status: 'within', message: tr('l6.care.within') };
}

// ------------------------------------------------------------------ bien-être de l'enfant
const WELLBEING_SCALES_FR: { key: 'crying' | 'irritability' | 'energy' | 'appetite' | 'sleep' | 'digestive_comfort'; label: string; levels: [string, string, string] }[] = [
  { key: 'crying', label: 'Pleurs', levels: ['Peu', 'Comme d’habitude', 'Beaucoup'] },
  { key: 'irritability', label: 'Irritabilité', levels: ['Calme', 'Comme d’habitude', 'Très grognon'] },
  { key: 'energy', label: 'Énergie', levels: ['Fatigué', 'Comme d’habitude', 'Très actif'] },
  { key: 'appetite', label: 'Appétit', levels: ['Petit appétit', 'Comme d’habitude', 'Grand appétit'] },
  { key: 'sleep', label: 'Sommeil', levels: ['Agité', 'Comme d’habitude', 'Très bon'] },
  { key: 'digestive_comfort', label: 'Confort digestif', levels: ['Inconfort', 'Comme d’habitude', 'Très bien'] },
];
const WELLBEING_SCALES_EN: typeof WELLBEING_SCALES_FR = [
  { key: 'crying', label: 'Crying', levels: ['Little', 'As usual', 'A lot'] },
  { key: 'irritability', label: 'Irritability', levels: ['Calm', 'As usual', 'Very grumpy'] },
  { key: 'energy', label: 'Energy', levels: ['Tired', 'As usual', 'Very active'] },
  { key: 'appetite', label: 'Appetite', levels: ['Small appetite', 'As usual', 'Big appetite'] },
  { key: 'sleep', label: 'Sleep', levels: ['Restless', 'As usual', 'Very good'] },
  { key: 'digestive_comfort', label: 'Digestive comfort', levels: ['Discomfort', 'As usual', 'Very good'] },
];
const WELLBEING_SCALES_ES: typeof WELLBEING_SCALES_FR = [
  { key: 'crying', label: 'Llanto', levels: ['Poco', 'Como siempre', 'Mucho'] },
  { key: 'irritability', label: 'Irritabilidad', levels: ['Tranquilo', 'Como siempre', 'Muy gruñón'] },
  { key: 'energy', label: 'Energía', levels: ['Cansado', 'Como siempre', 'Muy activo'] },
  { key: 'appetite', label: 'Apetito', levels: ['Poco apetito', 'Como siempre', 'Mucho apetito'] },
  { key: 'sleep', label: 'Sueño', levels: ['Agitado', 'Como siempre', 'Muy bueno'] },
  { key: 'digestive_comfort', label: 'Bienestar digestivo', levels: ['Molestias', 'Como siempre', 'Muy bien'] },
];
const WELLBEING_SCALES_DE: typeof WELLBEING_SCALES_FR = [
  { key: 'crying', label: 'Weinen', levels: ['Wenig', 'Wie immer', 'Viel'] },
  { key: 'irritability', label: 'Reizbarkeit', levels: ['Ruhig', 'Wie immer', 'Sehr quengelig'] },
  { key: 'energy', label: 'Energie', levels: ['Müde', 'Wie immer', 'Sehr aktiv'] },
  { key: 'appetite', label: 'Appetit', levels: ['Wenig Appetit', 'Wie immer', 'Großer Appetit'] },
  { key: 'sleep', label: 'Schlaf', levels: ['Unruhig', 'Wie immer', 'Sehr gut'] },
  { key: 'digestive_comfort', label: 'Verdauung', levels: ['Beschwerden', 'Wie immer', 'Sehr gut'] },
];
const WELLBEING_SCALES_IT: typeof WELLBEING_SCALES_FR = [
  { key: 'crying', label: 'Pianto', levels: ['Poco', 'Come al solito', 'Molto'] },
  { key: 'irritability', label: 'Irritabilità', levels: ['Calmo', 'Come al solito', 'Molto nervoso'] },
  { key: 'energy', label: 'Energia', levels: ['Stanco', 'Come al solito', 'Molto attivo'] },
  { key: 'appetite', label: 'Appetito', levels: ['Poco appetito', 'Come al solito', 'Molto appetito'] },
  { key: 'sleep', label: 'Sonno', levels: ['Agitato', 'Come al solito', 'Molto buono'] },
  { key: 'digestive_comfort', label: 'Benessere digestivo', levels: ['Fastidio', 'Come al solito', 'Molto bene'] },
];
export const WELLBEING_SCALES: typeof WELLBEING_SCALES_FR = localized(WELLBEING_SCALES_FR, WELLBEING_SCALES_EN, { es: WELLBEING_SCALES_ES, de: WELLBEING_SCALES_DE, it: WELLBEING_SCALES_IT });

const DEV_DOMAINS_FR: { value: 'motor' | 'language' | 'communication' | 'social' | 'autonomy' | 'learning' | 'eating' | 'sleep' | 'other'; label: string }[] = [
  { value: 'motor', label: 'Motricité' }, { value: 'language', label: 'Langage' }, { value: 'communication', label: 'Communication' },
  { value: 'social', label: 'Relations' }, { value: 'autonomy', label: 'Autonomie' }, { value: 'learning', label: 'Apprentissages' },
  { value: 'eating', label: 'Alimentation' }, { value: 'sleep', label: 'Sommeil' }, { value: 'other', label: 'Autre' },
];
const DEV_DOMAINS_EN: typeof DEV_DOMAINS_FR = [
  { value: 'motor', label: 'Motor skills' }, { value: 'language', label: 'Language' }, { value: 'communication', label: 'Communication' },
  { value: 'social', label: 'Relationships' }, { value: 'autonomy', label: 'Independence' }, { value: 'learning', label: 'Learning' },
  { value: 'eating', label: 'Eating' }, { value: 'sleep', label: 'Sleep' }, { value: 'other', label: 'Other' },
];
const DEV_DOMAINS_ES: typeof DEV_DOMAINS_FR = [
  { value: 'motor', label: 'Motricidad' }, { value: 'language', label: 'Lenguaje' }, { value: 'communication', label: 'Comunicación' },
  { value: 'social', label: 'Relaciones' }, { value: 'autonomy', label: 'Autonomía' }, { value: 'learning', label: 'Aprendizajes' },
  { value: 'eating', label: 'Alimentación' }, { value: 'sleep', label: 'Sueño' }, { value: 'other', label: 'Otro' },
];
const DEV_DOMAINS_DE: typeof DEV_DOMAINS_FR = [
  { value: 'motor', label: 'Motorik' }, { value: 'language', label: 'Sprache' }, { value: 'communication', label: 'Kommunikation' },
  { value: 'social', label: 'Beziehungen' }, { value: 'autonomy', label: 'Selbstständigkeit' }, { value: 'learning', label: 'Lernen' },
  { value: 'eating', label: 'Ernährung' }, { value: 'sleep', label: 'Schlaf' }, { value: 'other', label: 'Anderes' },
];
const DEV_DOMAINS_IT: typeof DEV_DOMAINS_FR = [
  { value: 'motor', label: 'Motricità' }, { value: 'language', label: 'Linguaggio' }, { value: 'communication', label: 'Comunicazione' },
  { value: 'social', label: 'Relazioni' }, { value: 'autonomy', label: 'Autonomia' }, { value: 'learning', label: 'Apprendimenti' },
  { value: 'eating', label: 'Alimentazione' }, { value: 'sleep', label: 'Sonno' }, { value: 'other', label: 'Altro' },
];
export const DEV_DOMAINS: typeof DEV_DOMAINS_FR = localized(DEV_DOMAINS_FR, DEV_DOMAINS_EN, { es: DEV_DOMAINS_ES, de: DEV_DOMAINS_DE, it: DEV_DOMAINS_IT });

// ------------------------------------------------------------------ dents de lait (schéma)
/** 20 dents de lait, dans l'ordre des arcades (haut droite → haut gauche, bas gauche → bas droite, vu de face). */
type Tooth = { id: string; label: string; arch: 'top' | 'bottom'; index: number };
function buildTeeth(n: { second: string; first: string; canine: string; lateral: string; central: string }, place: (name: string, arch: 'top' | 'bottom', side: 'right' | 'left') => string): Tooth[] {
  const right = [n.second, n.first, n.canine, n.lateral, n.central];
  const left = [n.central, n.lateral, n.canine, n.first, n.second];
  return [
    ...right.map((x, i) => ({ id: `t-r-${i}`, label: place(x, 'top', 'right'), arch: 'top' as const, index: i })),
    ...left.map((x, i) => ({ id: `t-l-${i}`, label: place(x, 'top', 'left'), arch: 'top' as const, index: i + 5 })),
    ...right.map((x, i) => ({ id: `b-r-${i}`, label: place(x, 'bottom', 'right'), arch: 'bottom' as const, index: i })),
    ...left.map((x, i) => ({ id: `b-l-${i}`, label: place(x, 'bottom', 'left'), arch: 'bottom' as const, index: i + 5 })),
  ];
}
const PRIMARY_TEETH_FR: Tooth[] = buildTeeth(
  { second: 'Deuxième molaire', first: 'Première molaire', canine: 'Canine', lateral: 'Incisive latérale', central: 'Incisive centrale' },
  (name, arch, side) => `${name} en ${arch === 'top' ? 'haut' : 'bas'}, ${side === 'right' ? 'droite' : 'gauche'}`,
);
const PRIMARY_TEETH_EN: Tooth[] = buildTeeth(
  { second: 'Second molar', first: 'First molar', canine: 'Canine', lateral: 'Lateral incisor', central: 'Central incisor' },
  (name, arch, side) => `${name}, ${arch === 'top' ? 'upper' : 'lower'} ${side}`,
);
const PRIMARY_TEETH_ES: Tooth[] = buildTeeth(
  { second: 'Segundo molar', first: 'Primer molar', canine: 'Canino', lateral: 'Incisivo lateral', central: 'Incisivo central' },
  (name, arch, side) => `${name} ${arch === 'top' ? 'superior' : 'inferior'} ${side === 'right' ? 'derecho' : 'izquierdo'}`,
);
const PRIMARY_TEETH_DE: Tooth[] = buildTeeth(
  { second: 'Zweiter Backenzahn', first: 'Erster Backenzahn', canine: 'Eckzahn', lateral: 'Seitlicher Schneidezahn', central: 'Mittlerer Schneidezahn' },
  (name, arch, side) => `${name}, ${arch === 'top' ? 'oben' : 'unten'} ${side === 'right' ? 'rechts' : 'links'}`,
);
const PRIMARY_TEETH_IT: Tooth[] = buildTeeth(
  { second: 'Secondo molare', first: 'Primo molare', canine: 'Canino', lateral: 'Incisivo laterale', central: 'Incisivo centrale' },
  (name, arch, side) => `${name} ${arch === 'top' ? 'superiore' : 'inferiore'} ${side === 'right' ? 'destro' : 'sinistro'}`,
);
export const PRIMARY_TEETH: Tooth[] = localized(PRIMARY_TEETH_FR, PRIMARY_TEETH_EN, { es: PRIMARY_TEETH_ES, de: PRIMARY_TEETH_DE, it: PRIMARY_TEETH_IT });
