import { onLocaleChange } from '@/i18n';
/**
 * Contenus de grossesse : « Comment je me sens aujourd'hui ? » et « Bien manger enceinte ».
 * Rédigés à partir de pages officielles françaises réellement consultées (dates affichées ci-dessous).
 * Règles de rédaction (jamais contournées) :
 *  · jamais « c'est normal », « il n'y a aucun danger » ni « inutile de consulter » ;
 *  · aucun diagnostic, aucun médicament, aucune dose, aucun complément recommandé automatiquement ;
 *  · ce sont des informations générales, pas un avis médical personnalisé ;
 *  · statut éditorial : « À vérifier » tant qu'un professionnel n'a pas relu (voir docs/RELECTURE_CONTENUS.md).
 */
// Sources seules (pas le texte des articles de la bibliothèque) : QA E-06
import { S as L } from './articles/library/sources';
import type { ArticleSource } from './articles/library/types';
import { inLang, localized } from '@/i18n/localized';
import { careES } from './pregnancyCare.es';
import { careDE } from './pregnancyCare.de';
import { careIT } from './pregnancyCare.it';

const C = '2026-10-22';

/** Pages consultées le 22 octobre 2026 (en plus de celles de la bibliothèque, consultées le 20 octobre). */
const CARE_SOURCES_FR = {
  ameliProgramme1: { label: 'ameli.fr — Grossesse : le programme de suivi et la première consultation', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/grossesse-soins-dentaires-dentiste-consultation', consulted_on: C, published: '2026-07-14' },
  ameliMensuel: { label: 'ameli.fr — Suivi mensuel de la grossesse à partir du 4e mois', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/consultation-suivi-mensuel', consulted_on: C, published: '2026-06-02' },
  santeCalendrier: { label: 'Santé.fr — Le calendrier de grossesse', url: 'https://www.sante.fr/le-calendrier-de-grossesse', consulted_on: C, published: '2026-06-02' },
  petitsMaux: { label: '1000 premiers jours (Santé publique France) — Les petits maux de la grossesse', url: 'https://www.1000-premiers-jours.fr/fr/les-petits-maux-de-la-grossesse', consulted_on: C },
  preeclampsie: { label: 'ameli.fr — Pré-éclampsie : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/preeclampsie/diagnostic-evolution', consulted_on: C, published: '2025-07-24' },
  consult8: { label: 'Santé.fr — Grossesse : la consultation du 8e mois', url: 'https://www.sante.fr/grossesse-la-consultation-de-8eme-mois', consulted_on: C, published: '2018-01-11' },
  mois9: { label: 'Santé.fr — 9e mois, suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/9eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C, published: '2025-07-09' },
  rgo: { label: 'Santé.fr — Brûlures d’estomac et RGO', url: 'https://www.sante.fr/brulures-destomac-et-rgo', consulted_on: C },
  jambesLourdes: { label: 'ameli.fr — Jambes lourdes : symptômes, causes et facteurs favorisants', url: 'https://www.ameli.fr/assure/sante/themes/jambes-lourdes/symptomes-causes-facteurs-favorisants', consulted_on: C },
  cholestase: { label: 'CNGOF — Cholestase gravidique, recommandations pour la pratique clinique (2023)', url: 'https://cngof.fr/app/uploads/2025/11/Cholestase20gravidique202023-RPC.pdf', consulted_on: C },
  ameliAliments: { label: 'ameli.fr — Les aliments à éviter et les précautions d’hygiène pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/les-aliments-eviter-et-les-precautions-d-hygiene-pendant-la-grossesse', consulted_on: C, published: '2026-06-19' },
  ameliAlimentation: { label: 'ameli.fr — Adapter son alimentation pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/alimentation-grossesse', consulted_on: C, published: '2026-06-18' },
  listeriose: { label: 'Santé.fr — Listériose pendant la grossesse, quels aliments éviter ?', url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter', consulted_on: C },
  toxoplasmose: { label: 'Santé.fr — La toxoplasmose enceinte, comment l’éviter ?', url: 'https://www.sante.fr/la-toxoplasmose-enceinte-comment-leviter', consulted_on: C },
} satisfies Record<string, ArticleSource>;
const S = CARE_SOURCES_FR;
export type CareSources = typeof CARE_SOURCES_FR;
export type SafetyContact = { readonly key: 'samu' | 'eu' | 'sms'; readonly label: string; readonly phone: '15' | '112' | '114' };

// ─── « Comment je me sens aujourd'hui ? » ───────────────────────────────────────────────────────

export type SymptomKey =
  | 'nausea' | 'vomiting' | 'fatigue' | 'dizziness' | 'headache' | 'reflux' | 'constipation' | 'bloating' | 'breasts'
  | 'back_pain' | 'pelvic_pain' | 'contractions' | 'discharge' | 'bleeding' | 'itching' | 'breathless' | 'swollen_legs'
  | 'sleep' | 'mood' | 'anxiety' | 'movements' | 'other';

/** Ordre d'affichage. `fromSA` : proposé seulement à partir de ce terme (mouvements du bébé). */
export const SYMPTOMS: { key: SymptomKey; fromSA?: number }[] = [
  { key: 'nausea' }, { key: 'vomiting' }, { key: 'fatigue' }, { key: 'dizziness' }, { key: 'headache' }, { key: 'reflux' },
  { key: 'constipation' }, { key: 'bloating' }, { key: 'breasts' }, { key: 'back_pain' }, { key: 'pelvic_pain' }, { key: 'contractions' },
  { key: 'discharge' }, { key: 'bleeding' }, { key: 'itching' }, { key: 'breathless' }, { key: 'swollen_legs' }, { key: 'sleep' },
  { key: 'mood' }, { key: 'anxiety' }, { key: 'movements', fromSA: 16 }, { key: 'other' },
];

export interface SymptomCare {
  /** Semaines d'aménorrhée où ce symptôme est souvent décrit (indicatif). null : pas de période particulière. */
  frequentSA: [number, number] | null;
  help: string[];
  ask: string[];
  sources: ArticleSource[];
}

const DOUBT_FR = 'En cas de doute, appelez votre sage-femme, votre médecin ou votre maternité : vous ne dérangez pas.';

const SYMPTOM_CARE_FR: Record<SymptomKey, SymptomCare> = {
  nausea: {
    frequentSA: [4, 16],
    help: ['Manger souvent, en petites quantités, sans rester longtemps à jeun.', 'Choisir ce qui vous fait envie, en évitant les plats gras, frits ou épicés.', 'Boire régulièrement, par petites gorgées.', 'Se lever doucement, aérer, éviter les odeurs qui déclenchent les nausées.', 'Se reposer : la fatigue peut les aggraver.'],
    ask: ['Si les nausées gênent la vie quotidienne : des solutions existent, parlez-en à votre médecin ou à votre sage-femme.', 'Aucun médicament ni produit « naturel » sans avis d’un professionnel.'],
    sources: [L.ameliNausees, L.ameliNauseesConsult],
  },
  vomiting: {
    frequentSA: [4, 16],
    help: ['Boire souvent, par petites quantités, pour éviter la déshydratation.', 'Fractionner les repas et privilégier ce qui passe le mieux.'],
    ask: ['Rapidement si vous ne gardez plus les liquides, perdez du poids, avez très soif, la bouche sèche, des urines foncées, de la fièvre ou une fatigue inhabituelle.', 'Des vomissements très importants et persistants (hyperémèse gravidique) nécessitent un traitement rapide.'],
    sources: [L.ameliNausees, L.ameliNauseesConsult],
  },
  fatigue: {
    frequentSA: [4, 14],
    help: ['Se reposer dès que possible et accepter l’aide proposée.', 'Garder des horaires de sommeil réguliers.', 'Une activité douce (marche, natation, gymnastique douce) si votre situation le permet.'],
    ask: ['Si la fatigue est intense, s’installe ou s’accompagne d’essoufflement, de pâleur ou de malaises : parlez-en à votre professionnel.'],
    sources: [S.petitsMaux, L.ameliActive],
  },
  dizziness: {
    frequentSA: null,
    help: ['Se lever doucement, s’asseoir ou s’allonger sur le côté dès que la tête tourne.', 'Boire régulièrement et ne pas rester longtemps à jeun.'],
    ask: ['Rapidement en cas de malaise, de perte de connaissance, de vertiges qui reviennent ou s’accompagnent de maux de tête, de troubles de la vue ou d’essoufflement.'],
    sources: [L.ameliMensuel],
  },
  headache: {
    frequentSA: null,
    help: ['Se reposer au calme, boire régulièrement.', 'Aucun médicament sans avis : l’aspirine et les anti-inflammatoires sont à éviter en particulier pendant les derniers mois.'],
    ask: ['En urgence après 20 SA si les maux de tête s’accompagnent de troubles de la vue (taches, éclairs, vision floue), de bourdonnements d’oreilles, d’une douleur en barre en haut du ventre ou d’un gonflement brutal du visage ou des mains.'],
    sources: [S.preeclampsie, S.consult8, S.petitsMaux],
  },
  reflux: {
    frequentSA: [20, 41],
    help: ['Faire des repas plus petits et plus fréquents.', 'Éviter de s’allonger juste après le repas ; surélever la tête du lit peut aider.', 'Repérer les aliments qui aggravent les brûlures.'],
    ask: ['Si les brûlures sont fréquentes ou gênent le sommeil : parlez-en à votre professionnel ou à votre pharmacien avant tout médicament.'],
    sources: [S.rgo, L.ameliPremiersSignes],
  },
  constipation: {
    frequentSA: null,
    help: ['Boire régulièrement dans la journée.', 'Privilégier les aliments riches en fibres : légumes, fruits, légumineuses, féculents complets.', 'Bouger un peu chaque jour si possible.'],
    ask: ['Si la constipation dure, est douloureuse ou s’accompagne de saignements : parlez-en à votre professionnel. Pas de laxatif sans avis.'],
    sources: [S.ameliAlimentation, S.petitsMaux],
  },
  bloating: {
    frequentSA: null,
    help: ['Manger lentement, fractionner les repas.', 'Repérer les aliments qui gonflent davantage.', 'Une marche après le repas peut aider.'],
    ask: ['Rapidement si le ventre devient dur et douloureux, ou si des douleurs s’installent.'],
    sources: [L.ameliPremiersSignes],
  },
  breasts: {
    frequentSA: [4, 14],
    help: ['Un soutien-gorge confortable, adapté à la taille qui change.'],
    ask: ['Si une rougeur, une boule ou une douleur localisée apparaît : parlez-en à votre professionnel.'],
    sources: [L.ameliPremiersSignes],
  },
  back_pain: {
    frequentSA: [20, 41],
    help: ['Une activité douce : marche, natation, gymnastique douce, yoga prénatal.', 'Des massages du dos et des jambes peuvent soulager.', 'Éviter de porter lourd et se pencher en pliant les genoux.'],
    ask: ['Si la douleur est intense, revient par vagues régulières (comme des contractions) ou s’accompagne de fièvre ou de brûlures en urinant : consultez rapidement.'],
    sources: [S.petitsMaux, L.ameliActive],
  },
  pelvic_pain: {
    frequentSA: [14, 41],
    help: ['Se reposer, varier les positions, éviter de rester longtemps debout.'],
    ask: ['Rapidement si la douleur est forte, d’un seul côté, avec des saignements, de la fièvre, ou si elle revient de façon régulière.'],
    sources: [L.ameliSaign1, L.ameliMensuel],
  },
  contractions: {
    frequentSA: [20, 41],
    help: ['Se reposer et noter leur fréquence et leur durée.'],
    ask: ['Des contractions peu douloureuses, irrégulières et peu nombreuses (moins de 10 par jour) sont décrites pendant la grossesse.', 'Contactez sans tarder votre maternité si elles deviennent douloureuses, se rapprochent au fil des heures, ou s’accompagnent de saignements ou d’une perte de liquide.'],
    sources: [S.ameliMensuel, S.consult8],
  },
  discharge: {
    frequentSA: null,
    help: ['Des pertes blanchâtres, sans odeur ni démangeaison, sont souvent décrites pendant la grossesse.'],
    ask: ['Rapidement en cas d’odeur forte, de démangeaisons, de brûlures ou de couleur inhabituelle.', 'Allez à la maternité si un liquide s’écoule de façon continue : cela peut évoquer une rupture de la poche des eaux.'],
    sources: [S.consult8, S.mois9],
  },
  bleeding: {
    frequentSA: null,
    help: ['Notez l’heure, l’abondance et la couleur, et ce qui l’accompagne (douleurs, contractions).'],
    ask: ['Au 2e ou 3e trimestre, tout saignement doit être vu en urgence à la maternité, même indolore.', 'Au 1er trimestre : consultez rapidement ; en urgence (15 ou 112) si le saignement est abondant, avec malaise, douleurs du bas-ventre ou fièvre.'],
    sources: [L.ameliSaign1, L.ameliSaign23, S.consult8],
  },
  itching: {
    frequentSA: null,
    help: ['Une peau bien hydratée et des vêtements amples peuvent aider pour des démangeaisons légères.'],
    ask: ['Consultez rapidement si les démangeaisons sont intenses, surtout sur les paumes des mains et la plante des pieds, ou la nuit, en particulier au 3e trimestre : un bilan peut être nécessaire.'],
    sources: [S.cholestase],
  },
  breathless: {
    frequentSA: [28, 41],
    help: ['Ralentir le rythme, faire des pauses, se tenir droite pour laisser de la place aux poumons.'],
    ask: ['Rapidement si l’essoufflement apparaît au repos, s’aggrave ou s’accompagne d’une douleur dans la poitrine, de palpitations ou d’un malaise (appelez le 15 en cas de douleur dans la poitrine).'],
    sources: [L.ameliMensuel],
  },
  swollen_legs: {
    frequentSA: [28, 41],
    help: ['Marcher, nager, faire de la gymnastique douce.', 'Surélever les jambes au repos, éviter de rester longtemps debout ou assise.'],
    ask: ['Rapidement si un mollet devient gonflé, dur et douloureux, ou si le visage et les mains gonflent brutalement avec une prise de poids rapide.'],
    sources: [S.petitsMaux, S.jambesLourdes, S.preeclampsie],
  },
  sleep: {
    frequentSA: null,
    help: ['Un moment calme avant le coucher, limiter la caféine le soir.', 'Dormir sur le côté, avec un coussin sous le ventre ou entre les genoux.'],
    ask: ['Si le manque de sommeil vous pèse ou s’accompagne de tristesse ou de perte d’intérêt : parlez-en à votre professionnel.'],
    sources: [S.petitsMaux, L.nhsFatigueGrossesse],
  },
  mood: {
    frequentSA: null,
    help: ['Partager ce que vous ressentez avec votre partenaire ou une personne de confiance.', 'Prendre soin de vous : repos, repas réguliers, activité douce.'],
    ask: ['Si la tristesse, les pleurs ou l’irritabilité durent plus de deux semaines : parlez-en à votre sage-femme ou à votre médecin.', 'Si vous avez des idées de vous faire du mal : appelez le 3114 (gratuit, 24 h/24).'],
    sources: [L.ameliPsy, L.ameliAidePsy, S.petitsMaux],
  },
  anxiety: {
    frequentSA: null,
    help: ['En parler : partenaire, entourage, préparation à la naissance.', 'Respiration lente, moments de calme.'],
    ask: ['Si l’anxiété est permanente, empêche de dormir ou de faire les choses du quotidien : parlez-en à votre sage-femme ou à votre médecin. L’entretien prénatal précoce est un moment prévu pour cela.', 'Si vous avez des idées de vous faire du mal : appelez le 3114 (gratuit, 24 h/24).'],
    sources: [L.ameliPsy, L.ameliAidePsy],
  },
  movements: {
    frequentSA: null,
    help: ['Les sensations changent au fil des semaines ; en fin de grossesse, le bébé, plus à l’étroit, peut bouger différemment.'],
    ask: ['Si vous sentez votre bébé bouger moins que d’habitude, ou plus du tout : contactez votre maternité sans attendre, de jour comme de nuit.'],
    sources: [S.mois9],
  },
  other: {
    frequentSA: null,
    help: ['Notez quand cela a commencé, à quelle fréquence et ce qui soulage ou aggrave : ces notes aident lors du rendez-vous.'],
    ask: [DOUBT_FR],
    sources: [L.ameliMensuel],
  },
};

/** Signes de sécurité affichés quand le symptôme est intense, inhabituel ou inquiétant. */
const SAFETY_CONTACTS_FR = [
  { key: 'samu', label: 'SAMU', phone: '15' },
  { key: 'eu', label: 'Urgences (numéro européen)', phone: '112' },
  { key: 'sms', label: 'Urgences pour les personnes sourdes ou malentendantes (SMS)', phone: '114' },
] as const;

// ─── « Bien manger enceinte » ───────────────────────────────────────────────────────────────────

export interface FoodSection { key: string; title: string; items: { title: string; text: string }[]; sources: ArticleSource[] }

const EAT_INTERESTING_FR: FoodSection = {
  key: 'interesting',
  title: 'Les repères du quotidien',
  items: [
    { title: 'Fruits et légumes', text: 'Au moins cinq portions par jour, crus bien lavés ou cuits.' },
    { title: 'Féculents et légumineuses', text: 'À chaque repas, en privilégiant les céréales complètes et les légumes secs (lentilles, pois chiches, haricots).' },
    { title: 'Produits laitiers', text: 'Trois par jour, pasteurisés (pas de lait cru).' },
    { title: 'Viande, poisson ou œufs', text: 'Une à deux fois par jour, toujours bien cuits.' },
    { title: 'Eau', text: 'À volonté, tout au long de la journée.' },
    { title: 'Rythme', text: 'Trois repas sans en sauter et, à partir du 2e trimestre, une collation si besoin.' },
  ],
  sources: [S.ameliAlimentation],
};

const EAT_AVOID_FR: FoodSection = {
  key: 'avoid',
  title: 'À éviter ou à préparer avec précaution',
  items: [
    { title: 'Alcool', text: 'Totalement déconseillé pendant toute la grossesse, quelle que soit la quantité.' },
    { title: 'Fromages au lait cru', text: 'À éviter, surtout à pâte molle, ainsi que les croûtes de fromage et les fromages râpés vendus en sachet.' },
    { title: 'Charcuteries cuites et produits à la coupe', text: 'Rillettes, pâtés, foie gras, produits en gelée et aliments servis à la coupe : à éviter.' },
    { title: 'Poisson et viande crus ou peu cuits', text: 'Sushis, tartares, ceviches, poissons fumés ou marinés, coquillages crus, surimi, tarama : à éviter. Viande et poisson cuits à cœur.' },
    { title: 'Graines germées crues', text: 'À éviter.' },
    { title: 'Certains poissons', text: 'Espadon, marlin, requin, lamproie : à éviter. Thon, dorade, brochet et autres prédateurs sauvages : à limiter. Poissons d’eau douce (anguille, carpe…) : au maximum une fois tous les deux mois.' },
    { title: 'Soja et réglisse', text: 'Aliments au soja déconseillés par précaution (la sauce soja reste possible de temps en temps). Réglisse à éviter sous toutes ses formes.' },
    { title: 'Caféine', text: 'À limiter : le repère cité par l’Assurance Maladie est de 300 mg par jour au maximum. Boissons énergisantes à éviter.' },
  ],
  sources: [S.ameliAliments, S.ameliAlimentation, S.listeriose],
};

const EAT_HYGIENE_FR: FoodSection = {
  key: 'hygiene',
  title: 'Hygiène et cuisson',
  items: [
    { title: 'Réfrigérateur', text: 'Réglé à 4 °C au maximum, nettoyé régulièrement. Respecter les dates limites et consommer vite après ouverture.' },
    { title: 'Restes', text: 'Pas plus de 3 jours, réchauffés jusqu’à être chauds partout.' },
    { title: 'Cru et cuit séparés', text: 'Ne pas mettre en contact viande crue, légumes non lavés et aliments prêts à manger.' },
    { title: 'Lavage', text: 'Laver soigneusement fruits, légumes et herbes, les ustensiles, et se laver les mains avant de cuisiner et après avoir touché de la viande crue.' },
    { title: 'Décongélation', text: 'Au réfrigérateur, jamais sur le plan de travail.' },
    { title: 'Jardin et animaux', text: 'Si vous n’êtes pas immunisée contre la toxoplasmose : jardiner avec des gants et éviter la litière du chat.' },
  ],
  sources: [S.ameliAliments, S.toxoplasmose],
};

export interface Nutrient { key: 'iron' | 'calcium' | 'protein' | 'fiber' | 'b9'; title: string; why: string; where: string; professional: string }
/** Repères généraux : jamais une quantité à atteindre, jamais un complément conseillé par l'application. */
const NUTRIENTS_FR: Nutrient[] = [
  { key: 'iron', title: 'Fer', why: 'Les besoins augmentent, surtout en fin de grossesse.', where: 'Légumes secs, poisson, viande.', professional: 'Votre médecin ou votre sage-femme peut prescrire du fer si besoin : suivez ses conseils.' },
  { key: 'calcium', title: 'Calcium', why: 'Utile au squelette du bébé, surtout au 3e trimestre.', where: 'Produits laitiers pasteurisés, certaines eaux minérales riches en calcium.', professional: 'Parlez de vos habitudes (sans produits laitiers par exemple) avec votre professionnel.' },
  { key: 'protein', title: 'Protéines', why: 'Elles accompagnent la croissance du bébé.', where: 'Viande, poisson, œufs bien cuits, légumineuses, produits laitiers.', professional: 'En cas d’alimentation végétarienne ou végétalienne, demandez conseil à votre professionnel.' },
  { key: 'fiber', title: 'Fibres', why: 'Elles aident le transit, souvent ralenti pendant la grossesse.', where: 'Légumes, fruits, légumineuses, féculents complets.', professional: 'Si la constipation dure, parlez-en avant de prendre un laxatif.' },
  { key: 'b9', title: 'Vitamine B9 (folates)', why: 'Importante en tout début de grossesse pour le développement du système nerveux.', where: 'Légumes verts à feuilles, légumineuses.', professional: 'L’alimentation seule ne suffit pas en début de grossesse : c’est votre médecin ou votre sage-femme qui prescrit éventuellement un complément et en indique la durée. L’application n’en recommande jamais.' },
];

/** Ne jamais prendre de complément de soi-même : texte affiché sur chaque écran d'alimentation de grossesse. */
const SUPPLEMENT_NOTICE_FR = 'L’application ne recommande aucun complément alimentaire. Certains contiennent des vitamines ou des minéraux nocifs à forte dose : suivez les conseils du professionnel qui accompagne votre grossesse.';
const NOT_ADVICE_FR = 'Informations générales issues de sources officielles françaises, pas un avis médical personnalisé.';
const NUTRITION_SOURCES_FR: ArticleSource[] = [S.ameliAlimentation, S.ameliAliments, S.listeriose, S.toxoplasmose, L.santeB9];

// ─── English version (same shape, same keys, same order) ─────────────────────────────────────────

const CARE_SOURCES_EN: typeof CARE_SOURCES_FR = {
  ameliProgramme1: { ...CARE_SOURCES_FR.ameliProgramme1, label: 'ameli.fr — Pregnancy: the follow-up programme and the first appointment' },
  ameliMensuel: { ...CARE_SOURCES_FR.ameliMensuel, label: 'ameli.fr — Monthly pregnancy follow-up from the 4th month' },
  santeCalendrier: { ...CARE_SOURCES_FR.santeCalendrier, label: 'Santé.fr — The pregnancy calendar' },
  petitsMaux: { ...CARE_SOURCES_FR.petitsMaux, label: '1000 premiers jours (Santé publique France) — Common pregnancy complaints' },
  preeclampsie: { ...CARE_SOURCES_FR.preeclampsie, label: 'ameli.fr — Pre-eclampsia: symptoms, diagnosis and course' },
  consult8: { ...CARE_SOURCES_FR.consult8, label: 'Santé.fr — Pregnancy: the 8th-month appointment' },
  mois9: { ...CARE_SOURCES_FR.mois9, label: 'Santé.fr — 9th month, pregnancy follow-up week by week' },
  rgo: { ...CARE_SOURCES_FR.rgo, label: 'Santé.fr — Heartburn and reflux' },
  jambesLourdes: { ...CARE_SOURCES_FR.jambesLourdes, label: 'ameli.fr — Heavy legs: symptoms, causes and contributing factors' },
  cholestase: { ...CARE_SOURCES_FR.cholestase, label: 'CNGOF — Intrahepatic cholestasis of pregnancy, clinical practice guidelines (2023)' },
  ameliAliments: { ...CARE_SOURCES_FR.ameliAliments, label: 'ameli.fr — Foods to avoid and hygiene precautions during pregnancy' },
  ameliAlimentation: { ...CARE_SOURCES_FR.ameliAlimentation, label: 'ameli.fr — Adapting your diet during pregnancy' },
  listeriose: { ...CARE_SOURCES_FR.listeriose, label: 'Santé.fr — Listeriosis in pregnancy: which foods to avoid?' },
  toxoplasmose: { ...CARE_SOURCES_FR.toxoplasmose, label: 'Santé.fr — Toxoplasmosis in pregnancy: how to avoid it' },
};
const SE = CARE_SOURCES_EN;

const DOUBT_EN = 'If in doubt, call your midwife, your doctor or your maternity unit: you are not disturbing them.';

const SYMPTOM_CARE_EN: Record<SymptomKey, SymptomCare> = {
  nausea: {
    frequentSA: [4, 16],
    help: ['Eat often, in small amounts, without going long on an empty stomach.', 'Choose what appeals to you, avoiding greasy, fried or spicy dishes.', 'Drink regularly, in small sips.', 'Get up slowly, air the room, avoid smells that trigger nausea.', 'Rest: tiredness can make it worse.'],
    ask: ['If the nausea affects daily life: there are solutions, so talk to your doctor or midwife.', 'No medicine or “natural” product without a professional’s advice.'],
    sources: [L.ameliNausees, L.ameliNauseesConsult],
  },
  vomiting: {
    frequentSA: [4, 16],
    help: ['Drink often, in small amounts, to avoid dehydration.', 'Split meals into smaller ones and favour whatever stays down best.'],
    ask: ['Promptly if you can no longer keep liquids down, are losing weight, are very thirsty, have a dry mouth, dark urine, a fever or unusual tiredness.', 'Very heavy, persistent vomiting (hyperemesis gravidarum) needs prompt treatment.'],
    sources: [L.ameliNausees, L.ameliNauseesConsult],
  },
  fatigue: {
    frequentSA: [4, 14],
    help: ['Rest whenever you can and accept the help you are offered.', 'Keep regular sleep times.', 'Gentle activity (walking, swimming, gentle exercise) if your situation allows.'],
    ask: ['If the tiredness is intense, persists or comes with breathlessness, paleness or faintness: talk to your healthcare professional.'],
    sources: [SE.petitsMaux, L.ameliActive],
  },
  dizziness: {
    frequentSA: null,
    help: ['Get up slowly, sit or lie on your side as soon as your head spins.', 'Drink regularly and avoid going long on an empty stomach.'],
    ask: ['Promptly if you faint or lose consciousness, or if dizziness keeps coming back or comes with headaches, vision problems or breathlessness.'],
    sources: [SE.ameliMensuel],
  },
  headache: {
    frequentSA: null,
    help: ['Rest somewhere quiet, drink regularly.', 'No medicine without advice: aspirin and anti-inflammatories are to be avoided, particularly in the last months.'],
    ask: ['Urgently after 20 weeks of amenorrhoea if headaches come with vision problems (spots, flashes, blurred vision), ringing in the ears, a band-like pain in the upper belly or sudden swelling of the face or hands.'],
    sources: [SE.preeclampsie, SE.consult8, SE.petitsMaux],
  },
  reflux: {
    frequentSA: [20, 41],
    help: ['Have smaller, more frequent meals.', 'Avoid lying down straight after eating; raising the head of the bed may help.', 'Spot the foods that make the burning worse.'],
    ask: ['If the burning is frequent or disturbs your sleep: talk to your healthcare professional or pharmacist before taking any medicine.'],
    sources: [SE.rgo, L.ameliPremiersSignes],
  },
  constipation: {
    frequentSA: null,
    help: ['Drink regularly through the day.', 'Favour foods rich in fibre: vegetables, fruit, pulses, wholegrain starchy foods.', 'Move a little every day if possible.'],
    ask: ['If the constipation lasts, is painful or comes with bleeding: talk to your healthcare professional. No laxative without advice.'],
    sources: [SE.ameliAlimentation, SE.petitsMaux],
  },
  bloating: {
    frequentSA: null,
    help: ['Eat slowly, split meals into smaller ones.', 'Spot the foods that cause more bloating.', 'A walk after meals may help.'],
    ask: ['Promptly if the belly becomes hard and painful, or if pain sets in.'],
    sources: [L.ameliPremiersSignes],
  },
  breasts: {
    frequentSA: [4, 14],
    help: ['A comfortable bra, suited to your changing size.'],
    ask: ['If redness, a lump or a localised pain appears: talk to your healthcare professional.'],
    sources: [L.ameliPremiersSignes],
  },
  back_pain: {
    frequentSA: [20, 41],
    help: ['Gentle activity: walking, swimming, gentle exercise, prenatal yoga.', 'Back and leg massages may bring relief.', 'Avoid heavy lifting and bend with your knees.'],
    ask: ['If the pain is intense, comes in regular waves (like contractions) or comes with a fever or burning when passing urine: seek advice promptly.'],
    sources: [SE.petitsMaux, L.ameliActive],
  },
  pelvic_pain: {
    frequentSA: [14, 41],
    help: ['Rest, vary your positions, avoid standing for long periods.'],
    ask: ['Promptly if the pain is strong, on one side only, with bleeding or a fever, or if it comes back at regular intervals.'],
    sources: [L.ameliSaign1, L.ameliMensuel],
  },
  contractions: {
    frequentSA: [20, 41],
    help: ['Rest and note how often they come and how long they last.'],
    ask: ['Contractions that are barely painful, irregular and few (fewer than 10 a day) are described during pregnancy.', 'Contact your maternity unit without delay if they become painful, get closer together over the hours, or come with bleeding or a loss of fluid.'],
    sources: [SE.ameliMensuel, SE.consult8],
  },
  discharge: {
    frequentSA: null,
    help: ['Whitish discharge with no smell or itching is often described during pregnancy.'],
    ask: ['Promptly if there is a strong smell, itching, burning or an unusual colour.', 'Go to the maternity unit if fluid is leaking continuously: this may suggest that the waters have broken.'],
    sources: [SE.consult8, SE.mois9],
  },
  bleeding: {
    frequentSA: null,
    help: ['Note the time, the amount and the colour, and what comes with it (pain, contractions).'],
    ask: ['In the 2nd or 3rd trimester, any bleeding should be seen urgently at the maternity unit, even if painless.', 'In the 1st trimester: seek advice promptly; urgently (call 15 or 112) if the bleeding is heavy, or comes with faintness, lower abdominal pain or a fever.'],
    sources: [L.ameliSaign1, L.ameliSaign23, SE.consult8],
  },
  itching: {
    frequentSA: null,
    help: ['Well-moisturised skin and loose clothing may help with mild itching.'],
    ask: ['Seek advice promptly if the itching is intense, especially on the palms of the hands and soles of the feet, or at night, in particular in the 3rd trimester: tests may be needed.'],
    sources: [SE.cholestase],
  },
  breathless: {
    frequentSA: [28, 41],
    help: ['Slow down, take breaks, hold yourself upright to leave room for your lungs.'],
    ask: ['Promptly if breathlessness appears at rest, gets worse or comes with chest pain, palpitations or faintness (call 15 for chest pain).'],
    sources: [SE.ameliMensuel],
  },
  swollen_legs: {
    frequentSA: [28, 41],
    help: ['Walk, swim, do gentle exercise.', 'Raise your legs when resting, avoid standing or sitting for long periods.'],
    ask: ['Promptly if a calf becomes swollen, hard and painful, or if the face and hands swell suddenly with rapid weight gain.'],
    sources: [SE.petitsMaux, SE.jambesLourdes, SE.preeclampsie],
  },
  sleep: {
    frequentSA: null,
    help: ['A calm moment before bed, limit caffeine in the evening.', 'Sleep on your side, with a cushion under your belly or between your knees.'],
    ask: ['If lack of sleep is weighing on you or comes with sadness or loss of interest: talk to your healthcare professional.'],
    sources: [SE.petitsMaux, L.nhsFatigueGrossesse],
  },
  mood: {
    frequentSA: null,
    help: ['Share how you feel with your partner or someone you trust.', 'Look after yourself: rest, regular meals, gentle activity.'],
    ask: ['If sadness, tears or irritability last more than two weeks: talk to your midwife or your doctor.', 'If you have thoughts of harming yourself: call 3114 (free, 24 hours a day).'],
    sources: [L.ameliPsy, L.ameliAidePsy, SE.petitsMaux],
  },
  anxiety: {
    frequentSA: null,
    help: ['Talk about it: partner, family and friends, antenatal classes.', 'Slow breathing, moments of calm.'],
    ask: ['If the anxiety is constant, stops you sleeping or doing everyday things: talk to your midwife or your doctor. The early prenatal interview is a time set aside for this.', 'If you have thoughts of harming yourself: call 3114 (free, 24 hours a day).'],
    sources: [L.ameliPsy, L.ameliAidePsy],
  },
  movements: {
    frequentSA: null,
    help: ['The sensations change over the weeks; late in pregnancy, the baby, with less room, may move differently.'],
    ask: ['If you feel your baby moving less than usual, or not at all: contact your maternity unit without waiting, day or night.'],
    sources: [SE.mois9],
  },
  other: {
    frequentSA: null,
    help: ['Note when it started, how often it happens and what relieves or worsens it: these notes help at your appointment.'],
    ask: [DOUBT_EN],
    sources: [SE.ameliMensuel],
  },
};

const SAFETY_CONTACTS_EN = [
  { key: 'samu', label: 'SAMU (emergency medical service)', phone: '15' },
  { key: 'eu', label: 'Emergencies (European number)', phone: '112' },
  { key: 'sms', label: 'Emergencies for deaf or hard-of-hearing people (text message)', phone: '114' },
] as const;

const EAT_INTERESTING_EN: FoodSection = {
  key: 'interesting',
  title: 'Everyday guidelines',
  items: [
    { title: 'Fruit and vegetables', text: 'At least five portions a day, raw (well washed) or cooked.' },
    { title: 'Starchy foods and pulses', text: 'At every meal, favouring wholegrain cereals and dried pulses (lentils, chickpeas, beans).' },
    { title: 'Dairy products', text: 'Three a day, pasteurised (no raw milk).' },
    { title: 'Meat, fish or eggs', text: 'Once or twice a day, always well cooked.' },
    { title: 'Water', text: 'As much as you like, throughout the day.' },
    { title: 'Rhythm', text: 'Three meals without skipping any and, from the 2nd trimester, a snack if needed.' },
  ],
  sources: [SE.ameliAlimentation],
};

const EAT_AVOID_EN: FoodSection = {
  key: 'avoid',
  title: 'To avoid or to prepare with care',
  items: [
    { title: 'Alcohol', text: 'Not recommended at all throughout pregnancy, whatever the amount.' },
    { title: 'Raw-milk cheeses', text: 'To avoid, especially soft cheeses, as well as cheese rinds and grated cheese sold in bags.' },
    { title: 'Cooked cold meats and deli-counter products', text: 'Rillettes, pâtés, foie gras, jellied products and foods served from the deli counter: to avoid.' },
    { title: 'Raw or undercooked fish and meat', text: 'Sushi, tartare, ceviche, smoked or marinated fish, raw shellfish, surimi, taramasalata: to avoid. Cook meat and fish right through.' },
    { title: 'Raw sprouted seeds', text: 'To avoid.' },
    { title: 'Certain fish', text: 'Swordfish, marlin, shark, lamprey: to avoid. Tuna, sea bream, pike and other wild predators: to limit. Freshwater fish (eel, carp…): at most once every two months.' },
    { title: 'Soya and liquorice', text: 'Soya foods are not recommended as a precaution (soy sauce is still fine from time to time). Liquorice is to be avoided in all its forms.' },
    { title: 'Caffeine', text: 'To limit: the guideline quoted by the French health insurance service (Assurance Maladie) is 300 mg a day at most. Energy drinks are to be avoided.' },
  ],
  sources: [SE.ameliAliments, SE.ameliAlimentation, SE.listeriose],
};

const EAT_HYGIENE_EN: FoodSection = {
  key: 'hygiene',
  title: 'Hygiene and cooking',
  items: [
    { title: 'Fridge', text: 'Set to 4 °C at most, cleaned regularly. Respect use-by dates and eat quickly once opened.' },
    { title: 'Leftovers', text: 'No more than 3 days, reheated until piping hot all the way through.' },
    { title: 'Raw and cooked kept apart', text: 'Do not let raw meat, unwashed vegetables and ready-to-eat foods touch.' },
    { title: 'Washing', text: 'Wash fruit, vegetables and herbs and utensils thoroughly, and wash your hands before cooking and after handling raw meat.' },
    { title: 'Defrosting', text: 'In the fridge, never on the worktop.' },
    { title: 'Garden and pets', text: 'If you are not immune to toxoplasmosis: wear gloves for gardening and avoid the cat litter.' },
  ],
  sources: [SE.ameliAliments, SE.toxoplasmose],
};

const NUTRIENTS_EN: Nutrient[] = [
  { key: 'iron', title: 'Iron', why: 'Needs increase, especially late in pregnancy.', where: 'Pulses, fish, meat.', professional: 'Your doctor or midwife can prescribe iron if needed: follow their advice.' },
  { key: 'calcium', title: 'Calcium', why: 'Useful for the baby’s skeleton, especially in the 3rd trimester.', where: 'Pasteurised dairy products, some calcium-rich mineral waters.', professional: 'Talk about your habits (for example, no dairy) with your healthcare professional.' },
  { key: 'protein', title: 'Protein', why: 'It supports the baby’s growth.', where: 'Meat, fish, well-cooked eggs, pulses, dairy products.', professional: 'If you eat a vegetarian or vegan diet, ask your healthcare professional for advice.' },
  { key: 'fiber', title: 'Fibre', why: 'It helps digestion, which is often slower during pregnancy.', where: 'Vegetables, fruit, pulses, wholegrain starchy foods.', professional: 'If the constipation lasts, talk about it before taking a laxative.' },
  { key: 'b9', title: 'Vitamin B9 (folate)', why: 'Important in very early pregnancy for the development of the nervous system.', where: 'Leafy green vegetables, pulses.', professional: 'Diet alone is not enough in early pregnancy: it is your doctor or midwife who may prescribe a supplement and say how long to take it. The app never recommends one.' },
];

const SUPPLEMENT_NOTICE_EN = 'The app does not recommend any food supplement. Some contain vitamins or minerals that are harmful in high doses: follow the advice of the professional who is looking after your pregnancy.';
const NOT_ADVICE_EN = 'General information from official French sources, not personalised medical advice.';
const NUTRITION_SOURCES_EN: ArticleSource[] = [SE.ameliAlimentation, SE.ameliAliments, SE.listeriose, SE.toxoplasmose, L.santeB9];

// ─── Espagnol, allemand, italien (fichiers frères : même forme, mêmes clés, même ordre) ──────────
const ES = careES(CARE_SOURCES_FR);
const DE = careDE(CARE_SOURCES_FR);
const IT = careIT(CARE_SOURCES_FR);
const more = <K extends keyof typeof ES>(k: K) => ({ es: ES[k], de: DE[k], it: IT[k] });

export const CARE_SOURCES = localized(CARE_SOURCES_FR, CARE_SOURCES_EN, more('CARE_SOURCES'));
export const SYMPTOM_CARE = localized(SYMPTOM_CARE_FR, SYMPTOM_CARE_EN, more('SYMPTOM_CARE'));
export const SAFETY_CONTACTS = localized(SAFETY_CONTACTS_FR, SAFETY_CONTACTS_EN as unknown as typeof SAFETY_CONTACTS_FR, {
  es: ES.SAFETY_CONTACTS as unknown as typeof SAFETY_CONTACTS_FR, de: DE.SAFETY_CONTACTS as unknown as typeof SAFETY_CONTACTS_FR, it: IT.SAFETY_CONTACTS as unknown as typeof SAFETY_CONTACTS_FR,
});
export const EAT_INTERESTING = localized(EAT_INTERESTING_FR, EAT_INTERESTING_EN, more('EAT_INTERESTING'));
export const EAT_AVOID = localized(EAT_AVOID_FR, EAT_AVOID_EN, more('EAT_AVOID'));
export const EAT_HYGIENE = localized(EAT_HYGIENE_FR, EAT_HYGIENE_EN, more('EAT_HYGIENE'));
export const NUTRIENTS = localized(NUTRIENTS_FR, NUTRIENTS_EN, more('NUTRIENTS'));
export const NUTRITION_SOURCES = localized(NUTRITION_SOURCES_FR, NUTRITION_SOURCES_EN, more('NUTRITION_SOURCES'));
/** Textes simples : constantes françaises (API inchangée) + versions suivant la langue en cours (supplementNotice(), notAdvice()). */
const supplementAll = () => ({ fr: SUPPLEMENT_NOTICE_FR, en: SUPPLEMENT_NOTICE_EN, ...more('SUPPLEMENT_NOTICE') });
const notAdviceAll = () => ({ fr: NOT_ADVICE_FR, en: NOT_ADVICE_EN, ...more('NOT_ADVICE') });
export let SUPPLEMENT_NOTICE = inLang(supplementAll());
export let NOT_ADVICE = inLang(notAdviceAll());
onLocaleChange(() => {
  SUPPLEMENT_NOTICE = inLang(supplementAll());
  NOT_ADVICE = inLang(notAdviceAll());
});
export const supplementNotice = () => inLang(supplementAll());
export const notAdvice = () => inLang(notAdviceAll());
