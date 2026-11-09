/**
 * Repères ÉDUCATIFS semaine par semaine (en SA).
 * Taille et poids : MOYENNES GÉNÉRALES publiées par une source française, arrondies ; entre deux points
 * publiés, la valeur est interpolée. Ce ne sont jamais les mesures de VOTRE bébé (seule l'échographie mesure).
 * Les comparaisons avec des fruits sont seulement illustratives.
 */

import { t as tr, formatNumber } from '@/i18n';
import { localized } from '@/i18n/localized';

/** Source des tailles et poids moyens affichés. */
export const FETAL_SIZE_SOURCE = {
  name: 'mpedia (Association française de pédiatrie ambulatoire) — « La grossesse mois par mois »',
  url: 'https://www.mpedia.fr/art-grossesse-mois-apres-mois/',
  updatedOn: '2022-09-23',
} as const;

interface SizePoint {
  sa: number;
  lengthCm: number;
  weightG: number;
  compare: string;
}

/** Valeurs de la source (6 à 41 SA). Avant 6 SA, aucune valeur n'est affichée. */
const SIZES_FR: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'un grain de riz' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'une myrtille' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'une olive' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'un citron vert' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'un citron' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'un avocat' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'un poivron' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'une banane' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'une papaye' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'un épi de maïs' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'une laitue' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'une aubergine' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'un chou' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'une noix de coco' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'un melon' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'une laitue romaine' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'une petite citrouille' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'une pastèque' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'une pastèque' },
];
const SIZES_EN: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'a grain of rice' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'a blueberry' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'an olive' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'a lime' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'a lemon' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'an avocado' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'a pepper' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'a banana' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'a papaya' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'an ear of sweetcorn' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'a lettuce' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'an aubergine' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'a cabbage' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'a coconut' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'a melon' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'a romaine lettuce' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'a small pumpkin' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'a watermelon' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'a watermelon' },
];
const SIZES_ES: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'un grano de arroz' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'un arándano' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'una aceituna' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'una lima' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'un limón' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'un aguacate' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'un pimiento' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'un plátano' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'una papaya' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'una mazorca de maíz' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'una lechuga' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'una berenjena' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'una col' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'un coco' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'un melón' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'una lechuga romana' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'una calabaza pequeña' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'una sandía' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'una sandía' },
];
const SIZES_DE: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'ein Reiskorn' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'eine Heidelbeere' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'eine Olive' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'eine Limette' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'eine Zitrone' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'eine Avocado' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'eine Paprika' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'eine Banane' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'eine Papaya' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'ein Maiskolben' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'ein Salatkopf' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'eine Aubergine' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'ein Kohlkopf' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'eine Kokosnuss' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'eine Melone' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'ein Römersalat' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'ein kleiner Kürbis' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'eine Wassermelone' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'eine Wassermelone' },
];
const SIZES_IT: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'un chicco di riso' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'un mirtillo' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'un’oliva' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'un lime' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'un limone' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'un avocado' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'un peperone' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'una banana' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'una papaya' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'una pannocchia di mais' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'un cespo di lattuga' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'una melanzana' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'un cavolo' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'una noce di cocco' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'un melone' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'una lattuga romana' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'una piccola zucca' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'un’anguria' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'un’anguria' },
];
const SIZES = localized(SIZES_FR, SIZES_EN, { es: SIZES_ES, de: SIZES_DE, it: SIZES_IT });

interface Stage {
  from: number;
  to: number;
  baby: string[];
  mother: string[];
}

const STAGES_FR: Stage[] = [
  { from: 0, to: 7, baby: ['Les toutes premières structures se mettent en place.', 'Le cœur commence à se former.'],
    mother: ['Fatigue, seins sensibles ou nausées sont possibles — ou absents : chaque grossesse est différente.'] },
  { from: 8, to: 13, baby: ['Les principaux organes se forment.', 'Les mains et les pieds se dessinent.'],
    mother: ['Les nausées peuvent être présentes, puis s’atténuer chez beaucoup de personnes autour de la fin du 1er trimestre.', 'C’est souvent la période de la première échographie.'] },
  { from: 14, to: 19, baby: ['Le bébé bouge beaucoup, même si on ne le sent pas encore toujours.', 'Les traits du visage s’affinent.'],
    mother: ['Beaucoup de personnes retrouvent un peu d’énergie.', 'Les premiers mouvements peuvent être perçus entre 16 et 22 SA environ.'] },
  { from: 20, to: 27, baby: ['Le bébé entend des sons, dont votre voix.', 'Il alterne des périodes d’éveil et de sommeil.'],
    mother: ['Le ventre s’arrondit ; le dos peut être sollicité.', 'C’est souvent la période de l’échographie du 2e trimestre.'] },
  { from: 28, to: 33, baby: ['Le bébé prend du poids et ses poumons poursuivent leur maturation.', 'Il ouvre les yeux par moments.'],
    mother: ['Le sommeil peut devenir moins confortable.', 'Signalez toute diminution nette des mouvements du bébé.'] },
  { from: 34, to: 37, baby: ['Le bébé prend des forces et des réserves.', 'Il se positionne souvent pour la naissance.'],
    mother: ['Des contractions irrégulières peuvent apparaître.', 'Pensez à préparer la valise et les papiers.'] },
  { from: 38, to: 45, baby: ['Le bébé est prêt à naître : il continue de grandir jusqu’à la naissance.'],
    mother: ['Le terme approche : suivez les consignes de votre maternité pour savoir quand venir.'] },
];

const STAGES_EN: Stage[] = [
  { from: 0, to: 7, baby: ['The very first structures are forming.', 'The heart is starting to develop.'],
    mother: ['Tiredness, tender breasts or nausea are possible, or none at all: every pregnancy is different.'] },
  { from: 8, to: 13, baby: ['The main organs are forming.', 'Hands and feet are taking shape.'],
    mother: ['Nausea may be present, then ease for many people around the end of the first trimester.', 'This is often when the first scan takes place.'] },
  { from: 14, to: 19, baby: ['Your baby moves a lot, even if you cannot always feel it yet.', 'Facial features are becoming more defined.'],
    mother: ['Many people get a little energy back.', 'First movements may be felt at around 16 to 22 weeks.'] },
  { from: 20, to: 27, baby: ['Your baby can hear sounds, including your voice.', 'They alternate between periods of waking and sleeping.'],
    mother: ['Your bump is rounding out; your back may feel the strain.', 'This is often when the second-trimester scan takes place.'] },
  { from: 28, to: 33, baby: ['Your baby is putting on weight and their lungs are continuing to mature.', 'They open their eyes at times.'],
    mother: ['Sleep may become less comfortable.', 'Report any clear reduction in your baby’s movements.'] },
  { from: 34, to: 37, baby: ['Your baby is building up strength and reserves.', 'They often settle into position for the birth.'],
    mother: ['Irregular contractions may appear.', 'Think about packing your bag and gathering your papers.'] },
  { from: 38, to: 45, baby: ['Your baby is ready to be born: they keep growing right up to the birth.'],
    mother: ['Your due date is approaching: follow your maternity unit’s guidance on when to come in.'] },
];

const STAGES_ES: Stage[] = [
  { from: 0, to: 7, baby: ['Se están formando las primerísimas estructuras.', 'El corazón empieza a formarse.'],
    mother: ['Puede haber cansancio, pechos sensibles o náuseas, o nada de eso: cada embarazo es diferente.'] },
  { from: 8, to: 13, baby: ['Se forman los principales órganos.', 'Las manos y los pies se van dibujando.'],
    mother: ['Puede haber náuseas, que en muchas personas se suavizan hacia el final del 1.er trimestre.', 'Suele ser el momento de la primera ecografía.'] },
  { from: 14, to: 19, baby: ['El bebé se mueve mucho, aunque todavía no siempre se note.', 'Los rasgos de la cara se van definiendo.'],
    mother: ['Muchas personas recuperan algo de energía.', 'Los primeros movimientos pueden notarse más o menos entre las 16 y las 22 SA.'] },
  { from: 20, to: 27, baby: ['El bebé oye sonidos, entre ellos tu voz.', 'Alterna periodos de vigilia y de sueño.'],
    mother: ['La barriga se redondea; la espalda puede resentirse.', 'Suele ser el momento de la ecografía del 2.º trimestre.'] },
  { from: 28, to: 33, baby: ['El bebé gana peso y sus pulmones siguen madurando.', 'Abre los ojos a ratos.'],
    mother: ['El sueño puede volverse menos cómodo.', 'Avisa de cualquier disminución clara de los movimientos del bebé.'] },
  { from: 34, to: 37, baby: ['El bebé gana fuerza y reservas.', 'A menudo se coloca para el nacimiento.'],
    mother: ['Pueden aparecer contracciones irregulares.', 'Piensa en preparar la bolsa y los papeles.'] },
  { from: 38, to: 45, baby: ['El bebé está listo para nacer: sigue creciendo hasta el nacimiento.'],
    mother: ['Se acerca la fecha prevista: sigue las indicaciones de tu maternidad para saber cuándo ir.'] },
];

const STAGES_DE: Stage[] = [
  { from: 0, to: 7, baby: ['Die allerersten Strukturen entstehen.', 'Das Herz beginnt sich zu bilden.'],
    mother: ['Müdigkeit, empfindliche Brüste oder Übelkeit sind möglich – oder gar nicht vorhanden: Jede Schwangerschaft ist anders.'] },
  { from: 8, to: 13, baby: ['Die wichtigsten Organe bilden sich.', 'Hände und Füße nehmen Gestalt an.'],
    mother: ['Übelkeit kann auftreten und lässt bei vielen gegen Ende des 1. Trimesters nach.', 'Oft ist das die Zeit des ersten Ultraschalls.'] },
  { from: 14, to: 19, baby: ['Das Baby bewegt sich viel, auch wenn man es noch nicht immer spürt.', 'Die Gesichtszüge werden feiner.'],
    mother: ['Viele bekommen wieder etwas mehr Energie.', 'Die ersten Bewegungen können etwa zwischen der 16. und 22. SSW (SA) gespürt werden.'] },
  { from: 20, to: 27, baby: ['Das Baby hört Geräusche, auch deine Stimme.', 'Es wechselt zwischen Wach- und Schlafphasen.'],
    mother: ['Der Bauch wird runder; der Rücken kann beansprucht werden.', 'Oft ist das die Zeit des Ultraschalls im 2. Trimester.'] },
  { from: 28, to: 33, baby: ['Das Baby nimmt zu und seine Lunge reift weiter.', 'Es öffnet zeitweise die Augen.'],
    mother: ['Der Schlaf kann unbequemer werden.', 'Melde jede deutliche Abnahme der Kindsbewegungen.'] },
  { from: 34, to: 37, baby: ['Das Baby sammelt Kraft und Reserven.', 'Oft dreht es sich in die Geburtsposition.'],
    mother: ['Unregelmäßige Wehen können auftreten.', 'Denk daran, die Kliniktasche und die Unterlagen vorzubereiten.'] },
  { from: 38, to: 45, baby: ['Das Baby ist bereit für die Geburt: Es wächst bis zur Geburt weiter.'],
    mother: ['Der Termin rückt näher: Halte dich an die Hinweise deiner Geburtsklinik, wann du kommen sollst.'] },
];

const STAGES_IT: Stage[] = [
  { from: 0, to: 7, baby: ['Si formano le primissime strutture.', 'Il cuore comincia a formarsi.'],
    mother: ['Stanchezza, seno sensibile o nausea sono possibili, oppure assenti: ogni gravidanza è diversa.'] },
  { from: 8, to: 13, baby: ['Si formano gli organi principali.', 'Mani e piedi prendono forma.'],
    mother: ['La nausea può essere presente e poi attenuarsi per molte persone verso la fine del 1° trimestre.', 'Spesso è il periodo della prima ecografia.'] },
  { from: 14, to: 19, baby: ['Il bebè si muove molto, anche se non sempre lo si sente ancora.', 'I tratti del viso si definiscono.'],
    mother: ['Molte persone ritrovano un po’ di energia.', 'I primi movimenti possono essere percepiti tra le 16 e le 22 SA circa.'] },
  { from: 20, to: 27, baby: ['Il bebè sente i suoni, tra cui la tua voce.', 'Alterna periodi di veglia e di sonno.'],
    mother: ['La pancia si arrotonda; la schiena può affaticarsi.', 'Spesso è il periodo dell’ecografia del 2° trimestre.'] },
  { from: 28, to: 33, baby: ['Il bebè prende peso e i suoi polmoni continuano a maturare.', 'A tratti apre gli occhi.'],
    mother: ['Il sonno può diventare meno comodo.', 'Segnala qualsiasi netta diminuzione dei movimenti del bebè.'] },
  { from: 34, to: 37, baby: ['Il bebè accumula forze e riserve.', 'Spesso si posiziona per la nascita.'],
    mother: ['Possono comparire contrazioni irregolari.', 'Pensa a preparare la borsa e i documenti.'] },
  { from: 38, to: 45, baby: ['Il bebè è pronto a nascere: continua a crescere fino alla nascita.'],
    mother: ['Il termine si avvicina: segui le indicazioni del tuo punto nascita per sapere quando andare.'] },
];

const STAGES = localized(STAGES_FR, STAGES_EN, { es: STAGES_ES, de: STAGES_DE, it: STAGES_IT });

export interface WeekInfo {
  sa: number;
  /** null avant 6 SA : la source ne publie pas de valeur */
  lengthCm: number | null;
  weightG: number | null;
  compare: string;
  baby: string[];
  mother: string[];
  /** 0..1 — sert uniquement à faire évoluer l'illustration */
  growth: number;
}

export function weekInfo(sa: number): WeekInfo {
  const w = Math.max(4, Math.min(42, sa));
  const stage = STAGES.find((x) => w >= x.from && w <= x.to) ?? STAGES[STAGES.length - 1];
  const base = { sa: w, baby: stage.baby, mother: stage.mother, growth: Math.min(1, Math.max(0, (w - 4) / 37)) };
  if (w < SIZES[0].sa) return { ...base, lengthCm: null, weightG: null, compare: w < 5 ? tr('l4.fw.poppy') : tr('l4.fw.sesame') };
  const c = Math.min(w, SIZES[SIZES.length - 1].sa);
  let lower = SIZES[SIZES.length - 1];
  let upper = lower;
  for (let i = 0; i < SIZES.length - 1; i++) {
    if (c >= SIZES[i].sa && c <= SIZES[i + 1].sa) { lower = SIZES[i]; upper = SIZES[i + 1]; break; }
  }
  const t = upper.sa === lower.sa ? 0 : (c - lower.sa) / (upper.sa - lower.sa);
  const nearest = t < 0.5 ? lower : upper;
  return {
    ...base,
    lengthCm: Math.round((lower.lengthCm + (upper.lengthCm - lower.lengthCm) * t) * 10) / 10,
    weightG: Math.round(lower.weightG + (upper.weightG - lower.weightG) * t),
    compare: nearest.compare,
  };
}

/** « environ 23 cm », ou « moins de 5 mm » avant 6 SA. */
export function formatLength(cm: number | null): string {
  if (cm == null) return tr('l4.fw.lt5mm');
  return cm < 1 ? tr('l4.fw.aboutMm', { n: Math.round(cm * 10) }) : tr('l4.fw.aboutCm', { n: formatNumber(cm) });
}

export function formatWeight(g: number | null): string {
  if (g == null) return tr('l4.fw.lt1g');
  if (g < 1000) return tr('l4.fw.aboutG', { n: g });
  return tr('l4.fw.aboutKg', { n: formatNumber(g / 1000, { maximumFractionDigits: 1 }) });
}
