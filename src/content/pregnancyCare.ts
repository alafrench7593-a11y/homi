/**
 * Contenus de grossesse : « Comment je me sens aujourd'hui ? » et « Bien manger enceinte ».
 * Rédigés à partir de pages officielles françaises réellement consultées (dates affichées ci-dessous).
 * Règles de rédaction (jamais contournées) :
 *  · jamais « c'est normal », « il n'y a aucun danger » ni « inutile de consulter » ;
 *  · aucun diagnostic, aucun médicament, aucune dose, aucun complément recommandé automatiquement ;
 *  · ce sont des informations générales, pas un avis médical personnalisé ;
 *  · statut éditorial : « À vérifier » tant qu'un professionnel n'a pas relu (voir docs/RELECTURE_CONTENUS.md).
 */
import { LIBRARY_SOURCES as L, type ArticleSource } from './articles/library';

const C = '2026-10-22';

/** Pages consultées le 22 octobre 2026 (en plus de celles de la bibliothèque, consultées le 20 octobre). */
export const CARE_SOURCES = {
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
const S = CARE_SOURCES;

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

const DOUBT = 'En cas de doute, appelez votre sage-femme, votre médecin ou votre maternité : vous ne dérangez pas.';

export const SYMPTOM_CARE: Record<SymptomKey, SymptomCare> = {
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
    ask: [DOUBT],
    sources: [L.ameliMensuel],
  },
};

/** Signes de sécurité affichés quand le symptôme est intense, inhabituel ou inquiétant. */
export const SAFETY_CONTACTS = [
  { key: 'samu', label: 'SAMU', phone: '15' },
  { key: 'eu', label: 'Urgences (numéro européen)', phone: '112' },
  { key: 'sms', label: 'Urgences pour les personnes sourdes ou malentendantes (SMS)', phone: '114' },
] as const;

// ─── « Bien manger enceinte » ───────────────────────────────────────────────────────────────────

export interface FoodSection { key: string; title: string; items: { title: string; text: string }[]; sources: ArticleSource[] }

export const EAT_INTERESTING: FoodSection = {
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

export const EAT_AVOID: FoodSection = {
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

export const EAT_HYGIENE: FoodSection = {
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
export const NUTRIENTS: Nutrient[] = [
  { key: 'iron', title: 'Fer', why: 'Les besoins augmentent, surtout en fin de grossesse.', where: 'Légumes secs, poisson, viande.', professional: 'Votre médecin ou votre sage-femme peut prescrire du fer si besoin : suivez ses conseils.' },
  { key: 'calcium', title: 'Calcium', why: 'Utile au squelette du bébé, surtout au 3e trimestre.', where: 'Produits laitiers pasteurisés, certaines eaux minérales riches en calcium.', professional: 'Parlez de vos habitudes (sans produits laitiers par exemple) avec votre professionnel.' },
  { key: 'protein', title: 'Protéines', why: 'Elles accompagnent la croissance du bébé.', where: 'Viande, poisson, œufs bien cuits, légumineuses, produits laitiers.', professional: 'En cas d’alimentation végétarienne ou végétalienne, demandez conseil à votre professionnel.' },
  { key: 'fiber', title: 'Fibres', why: 'Elles aident le transit, souvent ralenti pendant la grossesse.', where: 'Légumes, fruits, légumineuses, féculents complets.', professional: 'Si la constipation dure, parlez-en avant de prendre un laxatif.' },
  { key: 'b9', title: 'Vitamine B9 (folates)', why: 'Importante en tout début de grossesse pour le développement du système nerveux.', where: 'Légumes verts à feuilles, légumineuses.', professional: 'L’alimentation seule ne suffit pas en début de grossesse : c’est votre médecin ou votre sage-femme qui prescrit éventuellement un complément et en indique la durée. L’application n’en recommande jamais.' },
];

/** Ne jamais prendre de complément de soi-même : texte affiché sur chaque écran d'alimentation de grossesse. */
export const SUPPLEMENT_NOTICE = 'L’application ne recommande aucun complément alimentaire. Certains contiennent des vitamines ou des minéraux nocifs à forte dose : suivez les conseils du professionnel qui accompagne votre grossesse.';
export const NOT_ADVICE = 'Informations générales issues de sources officielles françaises, pas un avis médical personnalisé.';
export const NUTRITION_SOURCES: ArticleSource[] = [S.ameliAlimentation, S.ameliAliments, S.listeriose, S.toxoplasmose, L.santeB9];
