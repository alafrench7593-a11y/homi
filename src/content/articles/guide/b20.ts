/** Guide complet — lot 20 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  ameliBrulure: { label: 'ameli.fr — Brûlures de la peau : réagir en cas d’urgence', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/brulures-peau', consulted_on: C, published: '2026-04-24' },
  ameliCoupure: { label: 'ameli.fr — Coupure cutanée : réagir en cas d’urgence', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/coupure-cutanee', consulted_on: C },
  ameliPlaie: { label: 'ameli.fr — Comment bien soigner une plaie ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/soins/soigner-plaie', consulted_on: C, published: '2025-08-06' },
  ameliIntox: { label: 'ameli.fr — Intoxication par voie orale (par ingestion)', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/intoxication-voie-orale-ingestion', consulted_on: C, published: '2025-09-11' },
  ameliEcchymose: { label: 'ameli.fr — Ecchymose, « bleu » et hématome cutané', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/ecchymose-bleu-hematome-cutane', consulted_on: C },
  ameliOngle: { label: 'ameli.fr — Traumatisme de l’ongle et de l’extrémité des doigts', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/traumatisme-ongle-extremite-doigt', consulted_on: C },
  ameliElec: { label: 'ameli.fr — Électrisation et électrocution', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/electrisation-electrocution', consulted_on: C },
  ameliDent: { label: 'ameli.fr — Traumatisme dentaire : dent contuse, fêlée, cassée ou luxée', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/traumatisme-dentaire', consulted_on: C, published: '2025-09-16' },
  ameliGuepes: { label: 'ameli.fr — Piqûres de guêpes, abeilles, frelons et bourdons', url: 'https://www.ameli.fr/assure/sante/urgence/morsures-griffures-piqures/piqures-guepes-abeilles-frelons-bourdons', consulted_on: C, published: '2026-03-16' },
  ameliMorsure: { label: 'ameli.fr — Morsure de chien ou de chat', url: 'https://www.ameli.fr/assure/sante/urgence/morsures-griffures-piqures/morsure-chien-chat', consulted_on: C, published: '2025-10-06' },
  ameliGriffures: { label: 'ameli.fr — Griffures de chat', url: 'https://www.ameli.fr/assure/sante/urgence/morsures-griffures-piqures/griffures-chat', consulted_on: C, published: '2025-04-23' },
  ameliSerpent: { label: 'ameli.fr — Morsures de serpents', url: 'https://www.ameli.fr/assure/sante/urgence/morsures-griffures-piqures/morsure-serpent', consulted_on: C, published: '2025-07-29' },
  ameliEte: { label: 'ameli.fr — Morsures et piqûres : les bons réflexes face aux petits maux de l’été', url: 'https://www.ameli.fr/assure/actualites/morsures-et-piqures-les-bons-reflexes-face-aux-petits-maux-de-l-ete', consulted_on: C, published: '2026-06-25' },
  ameliMoustiques: { label: 'ameli.fr — Prévention commune à toutes les maladies transmises par les moustiques', url: 'https://www.ameli.fr/assure/sante/themes/piqure-moustique-maladies/prevention-commune', consulted_on: C },
  ameliNez: { label: 'ameli.fr — Corps étrangers dans le nez', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/nez', consulted_on: C },
  ameliOeil: { label: 'ameli.fr — Corps étranger dans l’œil', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/oeil', consulted_on: C, published: '2025-10-20' },
  ameliPile: { label: 'ameli.fr — Mon enfant a avalé une pile bouton : agir vite', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/mon-enfant-avale-une-pile-bouton-agir-vite', consulted_on: C, published: '2025-11-20' },
  ameliInhale: { label: 'ameli.fr — Corps étranger inhalé par fausse route', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/inhale', consulted_on: C, published: '2018-04-12' },
  ameliPeau: { label: 'ameli.fr — Corps étranger sous la peau', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/peau', consulted_on: C, published: '2017-04-24' },
  ameliSoleil: { label: 'ameli.fr — Coup de soleil et conséquences sur la santé de l’exposition au soleil', url: 'https://www.ameli.fr/assure/sante/themes/coup-soleil/coup-soleil-risque-exposition-solaire', consulted_on: C },
  ameliNoyade: { label: 'ameli.fr — Fortes chaleurs : un risque de noyade augmenté', url: 'https://www.ameli.fr/assure/sante/themes/canicule-chaleur/chaleur-noyade', consulted_on: C, published: '2026-06-01' },
  santeBrulure: { label: 'Santé.fr — Brûlure', url: 'https://www.sante.fr/brulure', consulted_on: C, published: '2026-08-12' },
  santePiqures: { label: 'Santé.fr — Piqûre d’insectes et d’autres animaux', url: 'https://www.sante.fr/piqure-dinsectes-et-dautres-animaux', consulted_on: C },
  santeCO: { label: 'Santé.fr — Comment éviter une intoxication au monoxyde de carbone ?', url: 'https://www.sante.fr/comment-eviter-une-intoxication-au-monoxyde-de-carbone', consulted_on: C },
  santePiles: { label: 'Santé.fr — Piles bouton : prévenir l’ingestion et adopter les bons réflexes en cas d’accident', url: 'https://www.sante.fr/piles-bouton-prevenir-lingestion-et-adopter-les-bons-reflexes-en-cas-daccident', consulted_on: C, published: '2019-06-11' },
  crBebeEtouffe: { label: 'Croix-Rouge française — Que faire si mon bébé s’étouffe ?', url: 'https://www.croix-rouge.fr/mes-infos-bebe/que-faire-si-mon-bebe-setouffe', consulted_on: C, published: '2021-05-12' },
  crBebeArret: { label: 'Croix-Rouge française — Que faire si mon bébé fait un arrêt cardiaque ?', url: 'https://www.croix-rouge.fr/mes-infos-bebe/que-faire-si-mon-bebe-fait-un-arret-cardiaque', consulted_on: C, published: '2022-06-30' },
  crBebeConscience: { label: 'Croix-Rouge française — Que faire si mon bébé perd connaissance ?', url: 'https://www.croix-rouge.fr/mes-infos-bebe/que-faire-si-mon-bebe-perd-connaissance', consulted_on: C, published: '2021-05-15' },
  crNoyade: { label: 'Croix-Rouge française — Que faire en cas de noyade ?', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/noyade', consulted_on: C },
  crPiqures: { label: 'Croix-Rouge française — Les piqûres d’insectes, d’animaux marins ou morsures', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/les-piqures-dinsectes-danimaux-marins-ou-morsures', consulted_on: C },
  crBrulure: { label: 'Croix-Rouge française — Que faire en cas de brûlure ?', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/que-faire-en-cas-de-brulure', consulted_on: C },
  crInconscience: { label: 'Croix-Rouge française — L’inconscience', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/inconscience', consulted_on: C },
  cr4Etapes: { label: 'Croix-Rouge française — Les étapes pour porter secours : protéger, alerter, secourir', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/4-etapes-pour-porter-secours', consulted_on: C },
  crFormations: { label: 'Croix-Rouge française — Je me forme aux premiers secours', url: 'https://www.croix-rouge.fr/formations', consulted_on: C },
  interieurGQS: { label: 'Ministère de l’Intérieur — Les gestes qui sauvent', url: 'https://www.interieur.gouv.fr/actualites/actualites-du-ministere/gestes-qui-sauvent', consulted_on: C, published: '2023-02-08' },
  infoGouvAider: { label: 'info.gouv.fr — Situations d’urgence : gestes qui sauvent et engagement citoyen', url: 'https://www.info.gouv.fr/risques/aider', consulted_on: C, published: '2023-09-28' },
  arsTete: { label: 'ARS Normandie — Mon enfant s’est cogné la tête', url: 'https://www.normandie.ars.sante.fr/mon-enfant-sest-cogne-la-tete', consulted_on: C, published: '2025-03-12' },
  arsTiques: { label: 'ARS Grand Est — Tiques et maladie de Lyme : se protéger, agir et consulter', url: 'https://www.grand-est.ars.sante.fr/tiques-et-maladie-de-lyme-1', consulted_on: C },
  ansesIntox: { label: 'Anses — Intoxications accidentelles de l’enfant : quelles sont les plus fréquentes et les plus graves ?', url: 'https://www.anses.fr/fr/content/intoxications-accidentelles-de-lenfant-quelles-sont-les-plus-frequentes-et-les-plus-graves', consulted_on: C, published: '2024-07-03' },
  ansesMarins: { label: 'Anses — Identifier physalies, méduses et vives pour mieux prévenir les piqûres', url: 'https://www.anses.fr/en/content/identifying-physalia-jellyfish-and-weever-fish-to-better-prevent-stings', consulted_on: C, published: '2026-07-06' },
  ansesAimants: { label: 'Anses — Billes aimantées : à tenir hors de portée des enfants', url: 'https://www.anses.fr/en/news/keep-objects-containing-magnetic-balls-out-reach-children', consulted_on: C, published: '2021-06-24' },
  baignades: { label: 'Ministère chargé de la santé — Eaux de baignade : noyade', url: 'https://baignades.sante.gouv.fr/baignades/editorial/fr/conseils/noyade_s.html', consulted_on: C, published: '2019-08-27' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article t’informe et t’aide à réagir ; il ne remplace ni une formation aux premiers secours, ni l’avis du médecin, du pharmacien ou des secours. En cas de doute, appelle le 15 (ou le 112)._';
const BASE = { status: 'to_review' as const, category: 'premiers-secours' as const };
const BB = { ...BASE, journeys: ['newborn'] as LibArticle['journeys'] };
const TOUS = { ...BASE, journeys: ['newborn', 'child'] as LibArticle['journeys'] };

export const GUIDE_B20: LibArticle[] = [
  // ------------------------------------------------------------------ chutes et chocs
  {
    ...BB, min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'bebe-tombe-sur-la-tete-avant-un-an-que-faire',
    title: 'Bébé est tombé sur la tête avant 1 an : que faire tout de suite ?',
    summary: 'Chute de la table à langer, du lit ou du canapé : pourquoi un bébé de moins d’un an doit être vu par un médecin après un choc à la tête, et comment réagir en attendant.',
    tags: ['chute bébé', 'bébé tombé du lit', 'table à langer', 'choc à la tête bébé', 'bosse bébé', 'bébé tombé canapé', 'traumatisme crânien'],
    sources: [S.crBebeConscience, S.arsTete, S.ameliEcchymose],
    body_md: `## En bref
- Avant 1 an, un bébé qui est **tombé sur la tête** doit être **vu immédiatement par un médecin**, selon la Croix-Rouge française, même s’il pleure aussitôt et paraît aller bien.
- S’il ne réagit plus, respire mal, a une convulsion ou vomit : **appelle le 15** (ou le 112) sans attendre.
- Ne le secoue jamais pour le « réveiller » : parle-lui et stimule-le doucement.
- Après un choc à la tête, une **surveillance de 48 heures** est recommandée par l’ARS Normandie.
- La meilleure prévention : ne jamais laisser bébé seul sur une surface en hauteur, même une seconde.

## Comprendre
Les tout-petits ont une tête lourde par rapport à leur corps : quand ils tombent, c’est souvent elle qui heurte le sol. Un bébé ne sait pas encore dire qu’il a mal à la tête, qu’il voit trouble ou qu’il a la nausée ; les signes d’alerte sont donc plus difficiles à repérer. C’est pour cette raison que la Croix-Rouge française recommande, après une chute sur la tête avant 12 mois, un examen médical **immédiat**.

Une **bosse** peut apparaître : c’est un hématome du cuir chevelu, c’est-à-dire du sang collecté sous la peau. L’Assurance Maladie rappelle qu’une bosse accompagnée d’une perte de connaissance, de troubles de la conscience ou d’un hématome autour des deux yeux (« en lunettes ») est une urgence. L’absence de bosse, à l’inverse, ne permet pas d’écarter un choc important.

Après un choc à la tête, des changements de comportement peuvent apparaître dans les heures qui suivent : d’où la surveillance de 48 heures conseillée par l’ARS Normandie, qui résume la conduite à tenir en quatre temps : je protège, j’observe, j’agis, je surveille.

## Au quotidien
**Juste après la chute**
1. Garde ton calme et approche-toi de bébé sans le brusquer.
2. Observe : réagit-il à ta voix et au toucher ? Pleure-t-il ? Respire-t-il normalement ? Bouge-t-il bras et jambes ?
3. S’il ne réagit pas mais respire, place-le dans tes bras en position latérale de sécurité (voir l’article dédié) et **appelle le 15**.
4. S’il réagit, prends-le contre toi, rassure-le, puis **appelle ton médecin ou le 15** pour qu’il soit examiné rapidement, comme le recommande la Croix-Rouge pour les moins de 12 mois.
5. Sur une bosse, tu peux appliquer du froid **enveloppé dans un linge fin** (jamais de glace directement sur la peau), quelques minutes.

**Les heures suivantes**
- Note l’heure, la hauteur de la chute et la surface (carrelage, parquet, tapis) : le médecin te le demandera.
- Observe son comportement habituel : éveil, tétées ou biberons, pleurs, tonus, façon de bouger.
- Rappelle le médecin ou le 15 si quelque chose te paraît inhabituel.

**Prévenir les chutes**
- Ne quitte jamais bébé sur la table à langer, même un instant, et prépare tout le matériel avant de commencer.
- Pose le transat ou le cosy au sol, jamais sur une table ou un plan de travail.
- Dès qu’il se retourne, ne le laisse plus seul sur un lit d’adulte ou un canapé.

## Questions fréquentes
**Il a pleuré tout de suite puis s’est calmé : faut-il quand même consulter ?** Oui. Avant 1 an, la Croix-Rouge française recommande qu’un bébé tombé sur la tête soit vu immédiatement par un médecin, même si tout semble rentré dans l’ordre.

**Peut-il dormir après la chute ?** Demande-le au médecin qui l’examine : il te dira comment le surveiller, y compris pendant le sommeil. S’il te paraît anormalement somnolent ou difficile à réveiller, appelle le 15.

**La bosse est grosse : est-ce plus grave ?** La taille de la bosse ne dit pas tout. Ce sont surtout le comportement de bébé et les signes d’alerte qui comptent ; c’est pourquoi l’avis médical est nécessaire.

**Je me sens coupable, il est tombé pendant que je m’étais retourné(e).** Ces chutes arrivent dans beaucoup de familles, en une fraction de seconde. Faire examiner bébé et adapter ses habitudes, c’est déjà prendre soin de lui.

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 112) si bébé a perdu connaissance, même brièvement, s’il est mou, très somnolent ou difficile à réveiller, s’il vomit, s’il convulse, s’il respire mal, ou si un hématome apparaît autour des deux yeux. Dans tous les autres cas, fais-le examiner rapidement par un médecin le jour même. Si tu constates des bleus inexpliqués chez un bébé qui ne se déplace pas encore, parles-en à un médecin ; en cas d’inquiétude pour un enfant, le 119 est joignable à toute heure.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 12, max_age_months: 120,
    slug: 'bosse-et-bleu-chez-l-enfant-froid-et-surveillance',
    title: 'Bosse ou bleu après un choc : les bons gestes et ce qui doit alerter',
    summary: 'Ton enfant s’est cogné : comment soulager une bosse ou un bleu avec le froid, combien de temps surveiller et quels signes imposent d’appeler le 15.',
    tags: ['bosse', 'bleu enfant', 'ecchymose', 'hématome', 'enfant cogné tête', 'œil au beurre noir', 'glace bosse', 'surveillance 48 heures'],
    safety_critical: true,
    sources: [S.ameliEcchymose, S.arsTete, S.ameliDent],
    body_md: `## En bref
- Un **bleu** (ecchymose) est une tache plate due à un peu de sang dans la peau ; un **hématome** est une collection de sang plus profonde, qui fait une saillie, comme une bosse.
- Le premier geste : du **froid enveloppé dans un tissu fin**, environ 15 minutes, jamais directement sur la peau.
- Après un choc à la tête, l’ARS Normandie conseille de **surveiller l’enfant pendant 48 heures**.
- Perte de connaissance, vomissements, somnolence inhabituelle, comportement étrange : **appelle le 15**.
- Des bleus fréquents sans raison ou inexpliqués méritent un avis médical.

## Comprendre
Selon l’Assurance Maladie, le bleu et l’hématome sont le plus souvent bénins. Le bleu est bleu, noir ou violacé et ne disparaît pas quand on appuie dessus ; la peau reste intacte. L’hématome, plus profond, passe du bleu foncé au vert puis au jaune et met plus longtemps à disparaître. Ils ne font pas mal au repos mais sont sensibles quand on appuie.

La couleur évolue en général du rouge foncé au noir en 48 à 72 heures, puis vers le violet, le vert et le jaune ; la plupart des bleus disparaissent en quelques semaines.

Certaines localisations ont un nom : la **bosse** sur le crâne (hématome du cuir chevelu), l’**œil au beurre noir**, l’hématome sous l’ongle après un coup sur le doigt. Les enfants, qui courent, grimpent et tombent beaucoup, en collectionnent souvent sur les tibias, les genoux ou le front.

## Au quotidien
**Juste après le choc**
- Rassure ton enfant et regarde s’il se comporte comme d’habitude : il répond, pleure, bouge normalement.
- Applique une poche de froid ou des glaçons **dans un linge fin**, pendant environ 15 minutes ; renouvelle si besoin. Le contact direct de la glace peut provoquer une gelure.
- Pour la douleur, demande conseil à ton pharmacien ou à ton médecin sur un antidouleur adapté à l’âge et au poids de ton enfant. L’Assurance Maladie rappelle que le paracétamol est à privilégier et qu’il faut éviter l’aspirine.
- L’arnica a une efficacité inconstante : là aussi, demande conseil au pharmacien.

**S’il s’est cogné la tête**
- Surveille-le pendant 48 heures, comme le recommande l’ARS Normandie : des changements de comportement peuvent apparaître dans ce délai.
- Propose une activité calme le reste de la journée et préviens la crèche, l’assistante maternelle ou l’école.
- Si le choc a touché la bouche, vérifie aussi les dents (voir l’article sur les dents cassées ou tombées).

## Questions fréquentes
**Faut-il réveiller mon enfant la nuit après un choc à la tête ?** Demande au médecin ou au 15 comment le surveiller dans ta situation. S’il te paraît anormalement somnolent ou difficile à réveiller, appelle le 15.

**La bosse est très grosse mais il joue normalement : que faire ?** Le comportement compte davantage que la taille de la bosse. Garde-le sous surveillance et demande un avis médical en cas de doute. Un hématome qui grossit, devient chaud et douloureux, ou s’accompagne de fièvre doit être montré au médecin.

**Il a souvent des bleus sur les jambes : est-ce inquiétant ?** Les bleus des tibias sont fréquents chez un enfant actif. L’Assurance Maladie conseille en revanche de consulter si les bleus apparaissent souvent sans raison, s’ils s’accompagnent de saignements (nez, gencives) ou de fatigue, ou après un nouveau médicament.

**Un œil au beurre noir est-il grave ?** Souvent non, mais un choc violent sur l’œil avec trouble de la vue, douleur intense ou œil qui bouge mal nécessite une consultation en urgence.

## Quand demander conseil
Appelle le **15** (ou le 112) si, après un choc à la tête, ton enfant a perdu connaissance, vomit, est confus, très somnolent, se plaint de fourmillements ou présente un hématome autour des deux yeux ; si un choc au ventre ou au thorax s’accompagne de pâleur ou de malaise ; ou si un hématome très volumineux l’empêche de bouger. Consulte rapidement en cas de choc violent sur l’œil ou d’hématome qui grossit et chauffe. Des bleus inexpliqués, surtout s’ils ont la forme d’un objet, doivent être signalés à un médecin ; si tu crains qu’un enfant soit en danger, appelle le 119.

${FIN}`,
  },
  // ------------------------------------------------------------------ plaies
  {
    ...TOUS, min_age_months: 6, max_age_months: 120,
    slug: 'petite-coupure-ecorchure-enfant-nettoyer-proteger',
    title: 'Petite coupure, écorchure, écharde : nettoyer et protéger pas à pas',
    summary: 'Genou écorché, doigt coupé, écharde : les étapes simples pour soigner une petite plaie à la maison, et les signes qui doivent faire consulter.',
    tags: ['écorchure', 'genou écorché', 'petite coupure', 'écharde', 'désinfecter plaie enfant', 'pansement', 'tétanos', 'plaie infectée'],
    sources: [S.ameliPlaie, S.ameliCoupure, S.ameliPeau],
    body_md: `## En bref
- Lave-toi d’abord les mains, puis **rince et nettoie la plaie à l’eau et au savon** (ou au sérum physiologique).
- Préfère des **compresses stériles** au coton, et évite l’alcool et les produits agressifs.
- Couvre d’un pansement propre, à changer chaque jour les premiers jours.
- Vérifie dans le carnet de santé que la **vaccination contre le tétanos** est à jour.
- Rougeur qui s’étend, chaleur, pus, fièvre : consulte.

## Comprendre
Les plaies superficielles, comme les éraflures, écorchures et coupures peu profondes et peu étendues, peuvent être soignées à la maison selon l’Assurance Maladie. Une coupure est superficielle quand ses bords restent proches et ne s’écartent pas. Elle devient plus préoccupante quand elle est profonde, longue, aux bords déchiquetés, souillée, ou située sur le visage, les mains, les pieds ou près d’une articulation.

Le principal risque d’une petite plaie est l’**infection**. Un bon nettoyage dès le départ est donc le geste le plus utile. Le tétanos est une autre raison de vérifier le carnet de santé : si la vaccination n’est pas à jour ou si tu ne sais pas, un avis médical est conseillé dans les 48 heures.

## Au quotidien
**Soigner une écorchure ou une petite coupure**
1. Lave-toi les mains au savon (ou avec une solution hydroalcoolique si tu n’as pas d’eau).
2. Rince la plaie à l’eau tiède ou à température ambiante pour enlever la terre, les graviers ou les débris.
3. Nettoie à l’eau et au savon, ou au sérum physiologique, avec une compresse stérile.
4. Si la plaie saigne, appuie dessus avec une compresse sèche jusqu’à l’arrêt du saignement.
5. Pour une plaie plus étendue, demande conseil au pharmacien pour un antiseptique adapté à l’âge de ton enfant. L’Assurance Maladie signale que la chlorhexidine peut, rarement, provoquer une allergie grave dans l’heure (urticaire, gonflement, gêne respiratoire, malaise) : dans ce cas, appelle le 15.
6. Couvre d’un pansement adhésif ou d’une compresse stérile.
7. Change le pansement chaque jour pendant 2 à 3 jours, puis tous les 2 jours si la plaie est propre, et dès qu’il est mouillé ou sale.

**Une écharde ou une épine**
- Nettoie la zone, stérilise une pince fine et retire l’écharde **dans l’angle où elle est entrée**, sous une bonne lumière.
- Pour une épine ou une fibre qui casse facilement, l’Assurance Maladie suggère d’essayer d’abord un ruban adhésif.
- Si le retrait est incomplet ou difficile, n’insiste pas : consulte.

**Pour rassurer ton enfant** : explique chaque étape, laisse-le choisir son pansement ou tenir la compresse, souffle doucement pendant le nettoyage.

## Questions fréquentes
**Faut-il laisser la plaie « à l’air » pour qu’elle sèche ?** L’Assurance Maladie conseille au contraire de la protéger par un pansement, qui la garde propre et légèrement humide.

**Puis-je utiliser du coton ?** Mieux vaut des compresses stériles : le coton peut laisser des fibres dans la plaie.

**Comment savoir si la plaie s’infecte ?** Douleur qui augmente, rougeur ou gonflement qui s’étend, écoulement jaunâtre ou verdâtre, fièvre : ce sont des signes d’infection qui justifient une consultation dans la journée.

**Les bandelettes adhésives sont-elles utiles ?** Pour une coupure propre, peu profonde et aux bords nets, elles peuvent rapprocher les bords. Pose-les perpendiculairement à la coupure ; en cas de doute, montre la plaie au médecin ou au pharmacien.

## Quand demander conseil
Consulte un médecin dans les **6 heures** si la coupure est profonde, longue, béante ou déchiquetée, si elle touche le visage, une articulation ou la plante du pied, si un corps étranger reste dedans, si l’objet était sale, ou si ton enfant se plaint de fourmillements ou d’une perte de sensibilité. Consulte aussi si le vaccin contre le tétanos n’est pas à jour. Appelle le **15** (ou le 112) si le saignement est abondant malgré la compression ou si ton enfant pâlit, devient somnolent ou fait un malaise.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'plaie-qui-saigne-beaucoup-enfant-comprimer-alerter',
    title: 'Plaie qui saigne beaucoup : comprimer, allonger, alerter',
    summary: 'Coupure profonde, saignement qui ne s’arrête pas : les gestes à faire en attendant les secours, ce qu’il ne faut pas faire et quand une suture est nécessaire.',
    tags: ['hémorragie', 'saignement abondant', 'coupure profonde', 'compression', 'points de suture', 'cuir chevelu saigne', 'garrot'],
    sources: [S.ameliCoupure, S.ameliPlaie, S.interieurGQS],
    body_md: `## En bref
- Face à un saignement abondant : **appuie fermement et directement sur la plaie**, sans relâcher.
- Si possible, protège tes mains (gants, sac plastique) et utilise un linge propre ou des compresses.
- **Allonge ton enfant** et fais appeler le **15** (ou le 112) pendant que tu maintiens la pression.
- Si le sang traverse le linge, **ajoutes-en un autre par-dessus** sans retirer le premier.
- Pas de garrot, rien à boire : suis les consignes du médecin régulateur.

## Comprendre
La plupart des coupures du quotidien saignent peu et s’arrêtent avec une pression de quelques minutes. Certaines plaies saignent pourtant beaucoup : une coupure profonde, une plaie qui touche un vaisseau, ou une blessure du **cuir chevelu**, très vascularisé. L’Assurance Maladie précise que les coupures du cuir chevelu saignent abondamment, qu’il faut les comprimer et consulter, car une suture est souvent nécessaire.

Le ministère de l’Intérieur décrit le geste qui sauve en cas d’hémorragie : si le sang gicle ou coule, comprimer directement la plaie en se protégeant les mains, allonger la victime et garder la pression jusqu’à l’arrivée des secours. Un saignement qui « pulse » évoque une artère et constitue une urgence.

Un saignement important peut entraîner un état de choc. Les signes décrits par l’Assurance Maladie : somnolence, peau pâle, pouls et respiration rapides, soif intense, vomissements.

## Au quotidien
**Les gestes, dans l’ordre**
1. **Protège-toi** si possible : gants à usage unique, ou à défaut un sac plastique sur la main.
2. **Comprime** : appuie fortement sur la plaie avec une compresse, un linge ou un vêtement propre. À défaut, appuie avec la main.
3. **Allonge** ton enfant et rassure-le en lui parlant calmement.
4. **Alerte** : fais appeler le 15 ou le 112 par une autre personne ; si tu es seul(e), appelle en gardant la pression, haut-parleur activé.
5. **Maintiens la pression** sans regarder sous le linge toutes les minutes. Si le sang traverse, ajoute un second linge par-dessus.
6. Couvre-le pour qu’il n’ait pas froid et reste près de lui jusqu’à l’arrivée des secours.

**À ne pas faire**
- Poser un garrot : l’Assurance Maladie déconseille de le faire.
- Donner à boire ou à manger.

**Saignement modéré**
Une compression forte de 5 à 10 minutes, membre surélevé, suffit souvent. Si le saignement persiste après 15 minutes de pression, consulte rapidement.

## Questions fréquentes
**Combien de temps ai-je pour faire recoudre une plaie ?** L’Assurance Maladie indique qu’une suture se fait idéalement dans les 6 heures (6 à 8 heures au maximum pour une plaie profonde). Ne tarde donc pas à consulter.

**La plaie est sur la tête et saigne énormément : est-ce forcément grave ?** Le cuir chevelu saigne beaucoup, même pour une plaie de petite taille. Comprime et consulte. Si ton enfant a perdu connaissance, vomit ou se comporte de façon inhabituelle, appelle le 15.

**Faut-il désinfecter avant de comprimer ?** Non : quand le saignement est abondant, la priorité est d’arrêter le saignement et d’alerter. Les soins de la plaie viendront ensuite.

**Et après ?** Les professionnels vérifieront la vaccination contre le tétanos et la nécessité de points, de colle ou de bandelettes.

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 112) si le saignement est abondant malgré la compression, si le sang gicle, si la plaie est profonde ou étendue, si ton enfant a un trouble de la coagulation, ou en cas de pâleur, somnolence, malaise ou perte de connaissance. Consulte dans les 6 heures pour toute plaie profonde, longue, aux bords écartés, sur le visage, une main, un pied ou près d’une articulation. Le 114 permet de joindre les secours par SMS pour les personnes sourdes, malentendantes ou ayant des difficultés à parler.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120,
    slug: 'doigt-coince-dans-une-porte-ongle-noir-enfant',
    title: 'Doigt coincé dans une porte, ongle noir ou arraché : que faire ?',
    summary: 'Le « doigt de porte » est un accident fréquent avant 5 ans : soulager, repérer ce qui nécessite une consultation, conserver un ongle ou un fragment, et prévenir.',
    tags: ['doigt coincé porte', 'ongle noir', 'hématome sous l’ongle', 'ongle arraché', 'doigt écrasé enfant', 'bloque-porte', 'anti-pince doigts'],
    sources: [S.ameliOngle, S.ameliEcchymose],
    body_md: `## En bref
- Chez l’enfant, le « doigt de porte » représente **3,5 % des accidents domestiques**, surtout **avant 5 ans**, selon l’Assurance Maladie.
- Avant **12 ans**, l’Assurance Maladie conseille de **consulter** après un traumatisme de l’ongle ou du bout du doigt.
- Un **ongle arraché** se conserve dans une compresse propre : il peut parfois être remis en place aux urgences.
- Doigt sectionné : **15 ou 112**, et conservation du fragment dans un double sac avec de la glace, sans contact direct.
- Bloque-portes et dispositifs anti-pince-doigts limitent le risque.

## Comprendre
Un doigt peut se coincer dans une porte, un tiroir, une charnière ou être écrasé par un objet lourd. Les lésions possibles vont de l’hématome sous l’ongle (ongle noir) à la plaie, à la fracture d’une phalange, à l’ongle arraché, voire à la section du bout du doigt.

L’**hématome sous l’ongle** est du sang collecté sous la tablette de l’ongle. Petit et peu douloureux, il disparaît en quelques mois avec la repousse. Plus étendu et douloureux, il peut être évacué par un professionnel. L’Assurance Maladie décrit une technique, mais elle recommande une consultation chez l’enfant de moins de 12 ans : ce n’est pas un geste à faire toi-même sur ton enfant.

L’ongle repousse lentement : la repousse commence 3 à 6 semaines après le traumatisme et prend 3 à 6 mois pour un doigt. Si la racine de l’ongle a été abîmée, il peut repousser ondulé, strié ou fendu.

## Au quotidien
**Dans les premières minutes**
- Libère le doigt, rassure ton enfant et regarde : saigne-t-il ? L’ongle est-il décollé ? Le doigt est-il déformé ?
- Applique du froid **enveloppé dans un tissu fin** pour calmer la douleur et limiter le gonflement.
- Retire une bague ou un objet qui pourrait serrer en cas de gonflement.
- S’il y a une plaie : nettoie à l’eau savonneuse, rince, couvre d’une compresse propre.

**Si l’ongle est arraché**
- Récupère-le et garde-le dans une compresse propre.
- Rendez-vous aux urgences : l’ongle peut être repositionné sous anesthésie locale, et une radiographie recherche une fracture.

**Si un fragment du doigt est sectionné**
1. Appelle le 15 ou le 112.
2. Comprime la plaie en cas de saignement abondant, **sans garrot**.
3. Enveloppe le fragment dans un tissu propre, mets-le dans un sac étanche, puis place ce sac dans un second sac contenant des glaçons, sans contact direct avec la glace.

**Prévenir**
- Installe des bloque-portes ou des dispositifs anti-pince-doigts sur les portes les plus utilisées.
- Apprends à ton enfant à ne pas claquer les portes et à garder les mains loin des charnières.

## Questions fréquentes
**L’ongle est devenu noir mais il ne se plaint pas : faut-il consulter ?** Un petit hématome indolore disparaît avec la repousse de l’ongle. Mais chez un enfant de moins de 12 ans, l’Assurance Maladie conseille de consulter après ce type de traumatisme ; demande au moins l’avis de ton médecin.

**L’ongle va-t-il tomber ?** C’est possible. Un nouvel ongle repousse en général en quelques mois. Protège le doigt par un pansement pendant cette période.

**Comment savoir s’il y a une fracture ?** Une douleur intense ou persistante, un doigt déformé ou très gonflé doivent faire consulter : seule une radiographie permet de le dire.

**Que surveiller les jours suivants ?** La douleur, la rougeur et le gonflement : s’ils augmentent, une infection est possible.

## Quand demander conseil
Appelle le **15** (ou le 112) en cas de doigt sectionné ou de saignement abondant qui ne cède pas à la compression. Rendez-vous aux urgences si l’ongle est arraché, si le doigt est déformé ou si la plaie est importante. Consulte ton médecin pour tout traumatisme de l’ongle chez un enfant de moins de 12 ans, en cas de douleur intense ou persistante, de signes d’infection, ou si la vaccination contre le tétanos n’est pas à jour.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120,
    slug: 'dent-cassee-ou-tombee-apres-une-chute-enfant',
    title: 'Dent cassée, déplacée ou tombée après une chute : les bons réflexes',
    summary: 'Dent de lait ou dent définitive, cassée ou expulsée : comment réagir, comment conserver la dent et quand consulter un chirurgien-dentiste en urgence.',
    tags: ['dent cassée enfant', 'dent tombée chute', 'dent expulsée', 'dent de lait', 'dent définitive', 'traumatisme dentaire', 'dentiste urgence', 'lèvre qui saigne'],
    sources: [S.ameliDent],
    body_md: `## En bref
- Un choc sur la bouche peut ébranler, fêler, casser, déplacer ou faire tomber une dent : **consulte en urgence un chirurgien-dentiste** si la dent est expulsée, cassée, déplacée ou si ça saigne.
- **Dent de lait expulsée : ne la remets pas en place.**
- **Dent définitive expulsée** : tiens-la par la couronne, rince-la légèrement si elle est sale et essaie de la replacer ; consulte **idéalement dans les 20 minutes**.
- Si tu ne peux pas la replacer, conserve-la **dans du lait ou du sérum physiologique**, jamais à sec ni dans la glace.
- Choc violent à la tête, perte de connaissance, vomissements : **15**.

## Comprendre
L’Assurance Maladie distingue plusieurs lésions après un choc :
- la **contusion** : la dent est ébranlée mais intacte et ne bouge pas ; elle peut perdre sa vitalité dans les jours ou semaines suivants et devenir grisâtre ;
- la **fêlure** : une fissure de l’émail, souvent invisible même à la radiographie ;
- la **fracture** : un morceau de dent est cassé ;
- la **luxation** : la dent est déplacée dans son logement ; si elle en est complètement sortie, on parle d’**expulsion**.

Ce sont surtout les dents de devant qui sont touchées, lors des chutes, des jeux ou du sport. Même sans lésion visible, la pulpe (la partie vivante de la dent) peut avoir souffert, d’où l’intérêt d’un rendez-vous chez le dentiste.

## Au quotidien
**Juste après le choc**
1. Rassure ton enfant et regarde sa bouche : dent manquante, cassée, de travers, saignement ?
2. Vérifie qu’il va bien par ailleurs : s’il a perdu connaissance, vomit ou si le choc a été violent, appelle le 15.
3. Pour un saignement : appuie avec une compresse stérile pendant environ quatre minutes.
4. Si la lèvre gonfle, applique de l’eau froide.

**Si une dent est tombée**
- Retrouve-la et **tiens-la par la couronne** (la partie blanche visible), jamais par la racine.
- **Dent de lait** : ne la replace pas. Garde-la et consulte le dentiste.
- **Dent définitive** : rince-la légèrement si elle est sale, puis essaie de la remettre doucement dans son logement. Si c’est impossible ou incertain, place-la dans du lait ou du sérum physiologique. Pars sans attendre chez un chirurgien-dentiste.

**Si la dent est déplacée mais toujours en place** : n’y touche pas et consulte rapidement.

**Si la dent est cassée** : garde le fragment si tu le retrouves et prends rendez-vous en urgence.

**Pour la douleur**, demande conseil au pharmacien ou au médecin sur un antidouleur adapté à l’âge de ton enfant.

**Prévenir** : protège-dents pour les sports à risque, casque à vélo, siège auto adapté et surveillance des plus jeunes lorsqu’ils apprennent à marcher et à grimper.

## Questions fréquentes
**Comment savoir si c’est une dent de lait ou une dent définitive ?** Les premières dents définitives de devant apparaissent généralement vers 6 ou 7 ans. En cas de doute, ne replace pas la dent : conserve-la dans du lait et consulte sans attendre.

**Faut-il quand même consulter pour une dent de lait tombée ?** Oui : l’Assurance Maladie indique de ne pas la replacer, mais une dent expulsée justifie une consultation en urgence chez le chirurgien-dentiste, qui vérifiera la bouche et les dents voisines.

**La dent ne bouge pas et ne fait plus mal : faut-il consulter ?** Oui, prends rendez-vous : une dent contuse peut perdre sa vitalité dans les semaines qui suivent, et le dentiste peut demander une radiographie.

**À quoi sert le certificat médical ?** Le dentiste ou le médecin décrit les lésions dans un certificat, utile pour une éventuelle prise en charge par les assurances, par exemple scolaire.

## Quand demander conseil
Appelle le **15** (ou le 112) si le choc à la tête a été violent, s’il survient lors d’un accident grave, si ton enfant a perdu connaissance ou a vomi. Consulte **en urgence un chirurgien-dentiste** si une dent est expulsée, cassée ou déplacée, ou en cas de saignement qui persiste ou de plaie étendue de la bouche. Prends rendez-vous rapidement même pour une dent simplement ébranlée.

${FIN}`,
  },
  // ------------------------------------------------------------------ brûlures
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'brulure-enfant-refroidir-couvrir-appeler',
    title: 'Brûlure chez l’enfant : refroidir, couvrir, appeler le 15',
    summary: 'Liquide chaud renversé, four, fer à repasser : le geste qui limite les dégâts, ce qu’il ne faut jamais mettre sur une brûlure et pourquoi on appelle le 15 pour un jeune enfant.',
    tags: ['brûlure enfant', 'brûlure bébé', 'eau chaude renversée', 'refroidir brûlure', 'cloque', 'brûlure au second degré', 'que mettre sur une brûlure'],
    sources: [S.ameliBrulure, S.santeBrulure, S.crBrulure],
    body_md: `## En bref
- **Refroidis immédiatement** la brûlure sous l’eau : l’Assurance Maladie conseille une eau tempérée (environ 20 °C) pendant une vingtaine de minutes, sans refroidir tout le corps.
- Chez le bébé et le jeune enfant, la Croix-Rouge recommande de **limiter le refroidissement à environ 10 minutes** et de garder le reste du corps au chaud.
- Retire les vêtements **sauf s’ils collent à la peau**, puis couvre d’un linge propre.
- **Ni beurre, ni huile, ni crème, ni glace**, et ne perce pas les cloques.
- L’Assurance Maladie recommande d’appeler le **15** pour toute brûlure chez un **nourrisson ou un enfant de moins de 5 ans**, quelle que soit sa taille.

## Comprendre
La gravité d’une brûlure dépend de sa **profondeur**, de son **étendue**, de sa **localisation** et de l’âge de la personne. Les très jeunes enfants sont plus vulnérables.

L’Assurance Maladie décrit plusieurs degrés :
- **1er degré** : peau rouge, sèche, douloureuse, sans cloque (comme un coup de soleil léger) ;
- **2e degré superficiel** : peau rouge, gonflée, suintante, avec des cloques au liquide clair, très douloureuse ;
- **2e degré profond** : peau pâle sous les cloques, peu sensible ;
- **3e degré** : plaie brune ou noire, peu douloureuse car les nerfs sont détruits.

Pour estimer l’étendue, la paume de la main de la victime (doigts compris) représente environ 1 % de la surface du corps. Santé.fr considère une brûlure comme grave quand les cloques dépassent la moitié de la paume de la victime, ou quand elle touche les yeux, le nez, les mains ou la zone des orifices naturels.

## Au quotidien
**Les gestes, dans l’ordre**
1. Éloigne ton enfant de la source de chaleur. Si ses vêtements brûlent, couvre-le d’une couverture ou d’un tissu non synthétique et empêche-le de courir.
2. Refroidis la zone brûlée sous l’eau, jet doux, en évitant l’eau glacée. Chez le tout-petit, surveille frissons et pâleur.
3. Retire vêtements et bijoux, sauf s’ils adhèrent à la peau (dans ce cas, n’arrache rien).
4. Couvre la brûlure d’un linge propre et sec, et couvre ton enfant pour qu’il ait chaud.
5. Appelle le 15 dans les situations listées plus bas ; ne lui donne ni à boire ni à manger avant l’avis du médecin régulateur.

**À ne jamais faire**
- Appliquer beurre, huile, farine, lait, dentifrice, miel ou pommade « maison ».
- Mettre de la glace ou de l’eau glacée.
- Percer les cloques ou arracher un vêtement collé.
- Utiliser du coton directement sur la plaie.

**Pour une petite brûlure du 1er degré chez un enfant plus grand**, après refroidissement, l’Assurance Maladie conseille un pansement stérile non adhérent et une crème conseillée par le pharmacien. En cas de doute sur la profondeur, fais voir la brûlure.

**Prévenir à la maison** : poignées de casseroles tournées vers le mur, boissons chaudes hors de portée, jamais d’enfant sur les genoux en buvant chaud, eau du bain vérifiée (37 °C), biberon testé sur l’avant-bras, four, fer à repasser et cheminée inaccessibles.

## Questions fréquentes
**La brûlure est toute petite : faut-il vraiment appeler le 15 ?** Pour un nourrisson ou un enfant de moins de 5 ans, l’Assurance Maladie recommande d’appeler le 15 quelle que soit la surface ; Santé.fr conseille aussi de ne pas hésiter à appeler pour un enfant. Le médecin régulateur te dira s’il faut consulter et où.

**Une cloque s’est formée : je la perce ?** Non. La cloque protège la peau en dessous. Couvre-la et fais-la examiner.

**Pourquoi pas d’eau glacée ?** L’Assurance Maladie déconseille la glace et l’eau glacée ; chez l’enfant, la Croix-Rouge souligne aussi le risque de refroidissement général (hypothermie).

**Combien de temps pour guérir ?** Environ une semaine pour un 1er degré et 2 à 3 semaines pour un 2e degré superficiel, selon l’Assurance Maladie. Le 2e degré profond laisse des cicatrices et peut nécessiter des soins spécialisés.

## Quand demander conseil
Appelle le **15** (ou le 112) pour toute brûlure chez un nourrisson ou un enfant de moins de 5 ans ; au-delà, si la brûlure dépasse 5 % du corps, si elle touche le visage, le cou, les mains, les organes génitaux, la bouche ou les yeux, si la peau est blanche, brune ou noire, si la brûlure est d’origine électrique ou chimique, ou si elle s’accompagne de fièvre, de frissons ou d’un changement de comportement. En cas d’incendie, appelle le 18 ou le 112. Consulte ensuite en cas de signes d’infection : fièvre, rougeur qui s’étend, pus, douleur qui persiste.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'produit-chimique-dans-l-oeil-ou-sur-la-peau-enfant',
    title: 'Produit ménager dans l’œil ou sur la peau : rincer longtemps, puis consulter',
    summary: 'Éclaboussure de produit ménager, javel ou poussière dans l’œil : le rinçage qui limite les lésions, les gestes à éviter et quand aller aux urgences ophtalmologiques.',
    tags: ['produit dans l’œil', 'javel dans l’œil enfant', 'brûlure chimique', 'rincer œil', 'poussière dans l’œil', 'sable dans l’œil', 'urgences ophtalmologiques'],
    sources: [S.ameliOeil, S.crBrulure, S.ameliIntox],
    body_md: `## En bref
- Un produit chimique dans l’œil est une **urgence** : les lésions commencent dès les premières minutes.
- **Rince à grande eau pendant au moins 15 minutes**, œil bien ouvert, puis va **sans attendre aux urgences ophtalmologiques** avec le nom du produit.
- Sur la peau : retire les vêtements souillés et **rince abondamment au moins 20 minutes**, selon la Croix-Rouge.
- Ne frotte pas, ne pose pas de pansement sur l’œil, n’essaie pas de « neutraliser » le produit.
- Si ton enfant a aussi avalé le produit, appelle le centre antipoison ou le 15.

## Comprendre
Les produits ménagers peuvent provoquer de véritables brûlures chimiques. L’Assurance Maladie précise que les **acides** causent surtout des brûlures superficielles de l’œil, tandis que les **produits basiques**, comme l’eau de Javel ou la soude, provoquent des brûlures profondes. Dans tous les cas, plus le rinçage commence tôt, plus il est efficace.

Une simple **poussière**, un grain de sable ou un cil sont beaucoup plus fréquents et le plus souvent sans gravité, mais un geste maladroit peut enfoncer le corps étranger ou irriter l’œil.

## Au quotidien
**Produit chimique dans l’œil**
1. Rince immédiatement à l’eau, sous un filet d’eau tiède ou avec une carafe, **pendant au moins 15 minutes**.
2. Maintiens l’œil ouvert, idéalement avec l’aide d’une autre personne, comme le conseille l’Assurance Maladie.
3. Demande-lui de faire tourner son œil dans tous les sens pendant le rinçage, s’il en est capable.
4. Ne pose ni pansement ni bandage.
5. Dès la fin du rinçage, pars aux urgences ophtalmologiques en emportant l’emballage du produit.

**Produit chimique sur la peau** (Croix-Rouge)
- Protège tes mains, retire les vêtements contaminés.
- Si c’est une poudre, époussette-la d’abord, puis rince abondamment pendant au moins 20 minutes.
- Couvre d’une compresse non adhérente et consulte rapidement.
- N’applique jamais un autre produit pour « neutraliser ».

**Poussière, sable ou cil dans l’œil**
- Lave-toi les mains et empêche ton enfant de se frotter l’œil.
- Fais-le cligner plusieurs fois, ou rince à l’eau tiède ou au sérum physiologique.
- N’utilise ni coton-tige, ni pince, ni objet rigide, et n’insiste pas si cela ne sort pas.

**Prévenir** : garde les produits ménagers dans leur emballage d’origine, en hauteur et sous clé, et ne les transvase jamais dans une bouteille de boisson. Range-les juste après usage. Interdise les jouets qui projettent des billes ou des flèches aux jeunes enfants.

## Questions fréquentes
**Mon enfant crie et ferme l’œil : comment rincer ?** Fais-toi aider : une personne le tient et le rassure, l’autre écarte doucement les paupières et rince. Les lésions apparaissent dès les premières minutes : commence le rinçage le plus vite possible et poursuis-le au moins 15 minutes.

**L’œil ne semble plus rouge après le rinçage : faut-il encore consulter ?** Oui, après une projection de produit chimique, l’Assurance Maladie recommande de se rendre sans attendre aux urgences ophtalmologiques.

**Il a aussi pu en avaler : que faire ?** Ne le fais pas vomir et ne lui donne rien à boire ; appelle le centre antipoison ou, s’il ne va pas bien, le 15.

**Quand une poussière justifie-t-elle de consulter ?** Si elle reste dans l’œil, si la douleur, la rougeur ou le larmoiement persistent, ou si la vue est trouble.

## Quand demander conseil
Va **en urgence** en ophtalmologie après toute projection de produit chimique dans l’œil, une projection violente (éclat de bois ou de métal), un objet coincé ou enfoncé dans l’œil, une plaie de l’œil, une douleur intense ou une vision trouble. Appelle le **15** (ou le 112) si ton enfant a du mal à respirer, a avalé le produit et ne va pas bien, ou si la brûlure touche aussi le visage, les lèvres ou les narines.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120, safety_critical: true,
    slug: 'enfant-electrise-prise-electrique-que-faire',
    title: 'Enfant électrisé par une prise ou un appareil : couper le courant avant tout',
    summary: 'Doigts dans une prise, fil dénudé, appareil près de l’eau : comment intervenir sans se mettre en danger, pourquoi consulter même sans brûlure visible et comment sécuriser la maison.',
    tags: ['électrisation enfant', 'doigts dans la prise', 'cache-prise', 'décharge électrique', 'électrocution', 'fil dénudé', 'brûlure électrique'],
    sources: [S.ameliElec, S.ameliBrulure],
    body_md: `## En bref
- **Ne touche jamais ton enfant à mains nues** tant qu’il est en contact avec la source électrique.
- **Coupe le courant** (débranche, abaisse le disjoncteur) ; sinon, écarte la source avec un objet sec et non conducteur, en étant isolé(e) du sol.
- **Appelle le 15, le 18 ou le 112** : même une électrisation qui paraît bénigne peut nécessiter un examen et un contrôle du cœur.
- Inconscient mais respire : position latérale de sécurité ; ne respire pas : massage cardiaque.
- Selon l’Assurance Maladie, **un tiers des victimes d’accidents électriques domestiques sont des enfants**.

## Comprendre
L’électrisation est le passage d’un courant électrique dans le corps. Le corps, riche en eau, conduit le courant, qui entre souvent par la main. Les lésions peuvent être des brûlures, des troubles du rythme cardiaque, ou des blessures liées à une contraction musculaire ou une chute.

L’Assurance Maladie souligne un point important : les **brûlures visibles peuvent sembler minimes alors que les atteintes internes sont importantes**. À la maison, le courant basse tension provoque surtout des **troubles cardiaques**. C’est pourquoi un avis médical est utile même quand l’enfant paraît aller bien.

Les signes possibles : picotements, décharge, impossibilité de lâcher l’objet, brûlures, douleurs ou spasmes musculaires, maux de tête, troubles de la conscience, convulsions, difficultés à respirer, troubles du rythme cardiaque.

## Au quotidien
**Les gestes, dans l’ordre**
1. **Protège-toi** : ne touche pas ton enfant s’il est encore en contact avec l’appareil ou le fil.
2. **Coupe le courant** : débranche la prise ou abaisse le disjoncteur. Si c’est impossible, écarte la source avec un objet sec et non conducteur (manche à balai en bois, chaise en bois), en te tenant isolé(e) du sol.
3. **Alerte** : appelle le 15, le 18 ou le 112 en précisant qu’il s’agit d’un accident électrique domestique et l’état de ton enfant. Ne raccroche pas en premier.
4. **S’il est conscient** : reste près de lui, surveille-le et refroidis les éventuelles brûlures sous l’eau tempérée (voir l’article sur les brûlures).
5. **S’il est inconscient et respire** : position latérale de sécurité, couvre-le, surveille sa respiration.
6. **S’il ne respire pas** : commence le massage cardiaque et suis les consignes du médecin régulateur.

**Sécuriser la maison**
- Cache-prises sur toutes les prises accessibles, prises abîmées réparées.
- Pas de fils dénudés, de rallonges fendillées ou de multiprises surchargées.
- Aucun appareil branché près du bain ou d’un point d’eau ; chargeurs rangés hors des pièces humides.
- Matériel conforme (marquage CE) et installation vérifiée par un professionnel au moindre doute.
- Débranche en tenant la prise, jamais en tirant sur le fil, et montre l’exemple à ton enfant.

## Questions fréquentes
**Il a pris une petite « châtaigne » et va bien : faut-il appeler ?** Oui, appelle le 15 pour en parler : l’Assurance Maladie indique que, même sans lésion visible, une consultation peut être nécessaire, avec parfois un électrocardiogramme pour vérifier le rythme du cœur.

**Je suis enceinte et j’ai reçu une décharge en le secourant : que faire ?** L’Assurance Maladie précise que, chez la femme enceinte, tout accident électrique, même bénin, impose une hospitalisation pour surveillance. Appelle le 15.

**Les cache-prises suffisent-ils ?** Ils réduisent nettement le risque, mais la surveillance et l’apprentissage des règles restent indispensables.

**Un orage peut-il être dangereux ?** La foudre peut causer des brûlures et des lésions cardiaques ou neurologiques : appelle immédiatement les secours si une personne est touchée.

## Quand demander conseil
Appelle **toujours** le **15**, le 18 ou le 112 après une électrisation d’un enfant, même si elle paraît bénigne, et immédiatement en cas de brûlure, de perte de connaissance, de convulsions, de gêne respiratoire, de malaise ou de douleur dans la poitrine. Pour une installation électrique douteuse ou un appareil qui picote, fais intervenir un électricien.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120,
    slug: 'coup-de-soleil-enfant-que-faire',
    title: 'Coup de soleil chez l’enfant : soulager et savoir quand s’inquiéter',
    summary: 'Peau rouge et douloureuse, cloques : reconnaître un coup de soleil, les gestes qui soulagent, les signes d’insolation et pourquoi les tout-petits doivent être vus rapidement.',
    tags: ['coup de soleil enfant', 'coup de soleil bébé', 'cloques soleil', 'brûlure solaire', 'insolation', 'peau rouge soleil', 'après-soleil'],
    sources: [S.ameliSoleil, S.crBrulure, S.santeBrulure],
    body_md: `## En bref
- Un coup de soleil est une **brûlure de la peau** causée par les rayons UVB.
- Mets ton enfant **à l’ombre**, **refroidis** la peau à l’eau tempérée et fais-le **boire**.
- Ne perce pas les cloques, ne gratte pas, et pas de nouvelle exposition avant guérison complète.
- Pour un coup de soleil étendu, pense à l’**insolation** : maux de tête, fièvre, somnolence, vomissements.
- Un nourrisson ou un jeune enfant brûlé par le soleil doit être montré rapidement à un professionnel ; en cas de signes de gravité, **15**.

## Comprendre
L’Assurance Maladie décrit les coups de soleil comme les autres brûlures :
- **1er degré** : rougeur sans cloque, apparue 6 à 24 heures après l’exposition, qui blanchit sous la pression du doigt ; la peau peut peler, et la guérison prend environ une semaine ;
- **2e degré superficiel** : cloques remplies d’un liquide clair, entourées d’une rougeur douloureuse ; guérison en deux semaines environ, avec parfois des taches durables ;
- **2e degré profond** : cloques au fond pâle, peu douloureuses ; guérison en un mois environ, avec un risque de cicatrice.

La peau des enfants est plus fragile. L’Assurance Maladie rappelle que l’exposition au soleil favorise la plupart des cancers de la peau : la prévention reste le meilleur soin.

L’**insolation**, liée à l’exposition directe de la tête au soleil, peut accompagner un coup de soleil : maux de tête intenses, somnolence, nausées, forte fièvre, parfois perte de connaissance, selon l’Assurance Maladie. L’exposition au soleil peut aussi déshydrater, surtout les enfants.

## Au quotidien
**Soulager un coup de soleil léger** (d’après la Croix-Rouge et Santé.fr)
- Installe ton enfant à l’ombre ou dans une pièce fraîche.
- Refroidis la peau à l’eau tempérée (douche ou linges humides), sans eau glacée.
- Propose-lui souvent à boire ; Santé.fr conseille de vérifier l’absence d’insolation pour un coup de soleil assez étendu.
- Applique une crème hydratante ou apaisante conseillée par le pharmacien, adaptée à son âge.
- Pour la douleur, demande au médecin ou au pharmacien quel antidouleur convient à ton enfant.
- Habille-le de vêtements amples et légers, et garde-le à l’abri du soleil jusqu’à guérison.

**À éviter** : percer les cloques, gratter, appliquer des produits non adaptés (huile, alcool), réexposer la peau.

**Prévenir**
- Évite le soleil aux heures les plus chaudes, privilégie l’ombre.
- Chapeau à larges bords, t-shirt, lunettes de soleil adaptées, maillot anti-UV.
- Crème solaire à indice élevé pour enfant sur les zones découvertes, renouvelée régulièrement et après la baignade ; elle ne permet pas de rester plus longtemps au soleil.
- Les bébés ne doivent pas être exposés directement au soleil.

## Questions fréquentes
**Les cloques sont apparues le soir : est-ce plus grave ?** Les cloques signent une brûlure au 2e degré. Chez un enfant, fais examiner la brûlure par un médecin, surtout si elle est étendue ou touche le visage.

**La peau pèle : que faire ?** Laisse-la peler seule, sans arracher, et continue à hydrater la peau.

**Il a de la fièvre après une journée au soleil : est-ce le coup de soleil ?** Fièvre, maux de tête, somnolence ou vomissements peuvent signer une insolation ou un coup de chaleur : mets-le au frais, fais-le boire s’il est bien réveillé et demande un avis médical sans tarder.

**Une crème solaire suffit-elle pour un bébé ?** Non : avant tout, pas d’exposition directe, de l’ombre et des vêtements couvrants.

## Quand demander conseil
Appelle le **15** (ou le 112) si ton enfant est anormalement somnolent, confus, vomit, a une forte fièvre, convulse ou perd connaissance après une exposition au soleil ou à la chaleur. Consulte rapidement pour un coup de soleil chez un nourrisson ou un jeune enfant, pour des cloques, une brûlure étendue ou sur le visage, ou si la douleur persiste ; consulte aussi en cas de signes d’infection (pus, rougeur qui s’étend, fièvre).

${FIN}`,
  },
  // ------------------------------------------------------------------ piqûres et morsures
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'piqure-guepe-abeille-frelon-enfant-que-faire',
    title: 'Piqûre de guêpe, d’abeille ou de frelon : soulager et repérer une allergie',
    summary: 'Retirer le dard d’abeille, laver, appliquer du froid : les bons gestes après une piqûre d’hyménoptère, et les signes d’allergie ou de piqûre dans la gorge qui imposent le 15.',
    tags: ['piqûre de guêpe enfant', 'piqûre d’abeille', 'frelon', 'dard', 'allergie piqûre', 'choc anaphylactique', 'piqûre dans la bouche', 'gonflement'],
    sources: [S.ameliGuepes, S.ameliEte, S.santePiqures],
    body_md: `## En bref
- La réaction habituelle : **douleur, rougeur, gonflement et démangeaisons** autour de la piqûre, qui disparaissent en quelques heures.
- **Abeille** : retire vite le dard en le **grattant avec l’ongle ou une carte**, sans pince qui pourrait écraser la poche à venin.
- Lave à l’eau et au savon, désinfecte, applique du **froid enveloppé dans un tissu**.
- **Piqûre dans la bouche ou la gorge**, signes d’allergie, ou **4 à 5 piqûres chez un enfant** : appelle le **15**.
- Si ton enfant a un stylo d’adrénaline prescrit, utilise-le selon les consignes reçues et appelle le 15.

## Comprendre
Guêpes, abeilles, frelons et bourdons font partie des hyménoptères ; seules les femelles piquent. L’abeille laisse son dard barbelé dans la peau, qui continue d’injecter du venin pendant plusieurs minutes. Guêpes et frelons peuvent piquer plusieurs fois, surtout près de leur nid ou autour de la nourriture. Selon l’Assurance Maladie, les piqûres sont plus fréquentes en juillet et en août.

Trois situations sont des urgences :
- une **piqûre au visage, au cou, dans la bouche ou la gorge**, où le gonflement peut gêner la respiration ;
- les **piqûres multiples** : la réaction toxique survient à partir de **4 ou 5 piqûres chez l’enfant** (contre plus de 20 chez l’adulte), avec fatigue, vomissements, diarrhée, maux de tête, vertiges ou malaise ;
- la **réaction allergique**, possible après une seule piqûre chez une personne déjà sensibilisée : gonflement de plus de 10 cm, urticaire sur tout le corps, gonflement des lèvres, de la langue, des yeux ou de la gorge, difficulté à respirer ou à avaler, malaise, pâleur ou coloration bleutée.

## Au quotidien
**Piqûre sans signe d’urgence**
1. Éloigne ton enfant de l’insecte et identifie-le si possible.
2. Abeille : retire le dard au plus vite en grattant avec l’ongle ou le bord d’une carte.
3. Retire bagues et bracelets si la piqûre est sur la main ou le bras.
4. Lave à l’eau et au savon, puis applique un antiseptique adapté à son âge.
5. Pose du froid enveloppé dans un tissu, jamais de glace directement sur la peau (Santé.fr conseille de ne pas dépasser 15 à 20 minutes).
6. Empêche-le de se gratter et garde-le au calme une trentaine de minutes, en le surveillant.
7. Vérifie que sa vaccination contre le tétanos est à jour.
8. Pour la douleur ou les démangeaisons, demande conseil au pharmacien sur un produit adapté à l’âge de ton enfant.

**Piqûre dans la bouche** : appelle le 15 ; en attendant, un enfant assez grand peut sucer un glaçon pour limiter le gonflement, comme l’indique l’Assurance Maladie.

**Prévenir**
- Vêtements clairs et couvrants, pas de parfum ni de crème très odorante.
- Pas de boissons sucrées en canette ni de fruits tombés laissés à l’air libre ; vérifie le verre ou la gourde avant de boire.
- Pas de pieds nus dans l’herbe, surtout près des fleurs ou d’un point d’eau.
- Apprends à ton enfant à rester calme et à s’éloigner lentement, sans gestes brusques.
- Ne détruis pas un nid toi-même : signale-le à la mairie.

## Questions fréquentes
**Le gonflement a doublé le lendemain : est-ce une allergie ?** Un gonflement local peut être important, surtout après un frelon. L’Assurance Maladie conseille de consulter si, après 24 heures, la zone reste très rouge, enflée ou douloureuse. Un gonflement de plus de 10 cm ou des signes à distance de la piqûre (urticaire généralisée, gêne respiratoire) sont des signes d’allergie : appelle le 15.

**Faut-il utiliser une pince à épiler pour le dard ?** L’Assurance Maladie déconseille la pince, qui risque de faire éclater la poche à venin ; mieux vaut gratter.

**Mon enfant a déjà fait une grosse réaction : que prévoir ?** Parles-en à ton médecin, qui pourra l’orienter vers un allergologue et prescrire si besoin une trousse d’urgence. Informe l’école ou le centre de loisirs ; un PAI peut être mis en place.

**Les guêpes reviennent sans cesse à table : que faire ?** Couvre les aliments, débarrasse rapidement, et éloigne ton enfant calmement plutôt que de chasser l’insecte.

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 112) en cas de piqûre dans la bouche ou la gorge, de gêne pour respirer ou avaler, de gonflement du visage, des lèvres ou de la langue, d’urticaire étendue, de malaise, de pâleur, de vomissements, ou de plusieurs piqûres chez un enfant. En attendant les secours, si ton enfant est inconscient et respire, mets-le en position latérale de sécurité. Consulte ton médecin si la zone reste très rouge, enflée ou douloureuse après 24 heures.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120,
    slug: 'piqures-de-moustiques-bebe-enfant-soulager-prevenir',
    title: 'Piqûres de moustiques chez bébé et l’enfant : soulager et protéger selon l’âge',
    summary: 'Boutons qui grattent, piqûres qui s’infectent : soulager sans gratter, choisir une protection adaptée à l’âge (moustiquaire, vêtements, répulsifs) et savoir ce qui ne marche pas.',
    tags: ['piqûre de moustique bébé', 'moustique tigre', 'répulsif enfant', 'moustiquaire', 'démangeaisons', 'bouton qui gratte', 'anti-moustique bébé'],
    sources: [S.santePiqures, S.ameliMoustiques, S.ameliEte],
    body_md: `## En bref
- Les piqûres de moustiques sont le plus souvent **sans gravité mais très irritantes**.
- Pour soulager : **ne pas gratter**, laver la zone, appliquer du **froid enveloppé** dans un tissu.
- La protection la plus sûre pour un bébé : une **moustiquaire en bon état** sur le lit ou la poussette, et des vêtements couvrants.
- Les répulsifs cutanés dépendent de l’âge : l’Assurance Maladie indique que l’**IR3535 est possible dès 6 mois** et que le **DEET est contre-indiqué avant 2 ans**. Demande conseil au pharmacien.
- Bracelets, huiles essentielles, vitamine B1 ou homéopathie sont **jugés inefficaces**.

## Comprendre
Santé.fr range les piqûres de moustiques parmi les piqûres habituellement bénignes mais qui démangent beaucoup. Chez l’enfant, le grattage peut abîmer la peau et favoriser une surinfection : d’où l’intérêt de soulager vite les démangeaisons.

Dans certaines régions et lors de voyages, les moustiques peuvent aussi transmettre des maladies : c’est pourquoi l’Assurance Maladie insiste sur la prévention, et invite à signaler le moustique tigre dans les communes où il n’a pas encore été repéré.

## Au quotidien
**Soulager une piqûre**
- Lave la zone à l’eau et au savon.
- Applique du froid (poche de froid ou glaçon dans un linge) quelques minutes, sans dépasser 15 à 20 minutes selon Santé.fr.
- Plutôt que de gratter, frotte doucement avec la paume de la main, comme le suggère Santé.fr ; coupe court les ongles de ton enfant.
- Demande au pharmacien un produit apaisant adapté à l’âge de ton enfant si les démangeaisons sont fortes.

**Protéger selon l’âge** (recommandations de l’Assurance Maladie)
- **Pour tous** : vêtements amples, légers et couvrants ; moustiquaires à mailles fines aux fenêtres ; moustiquaire sur le lit ou le berceau, vérifiée sans trou, que l’enfant ne doit pas porter à la bouche.
- **Répulsifs cutanés** : à appliquer seulement sur la peau découverte, en évitant les yeux, la bouche, les plaies, **les mains et le visage des enfants**. Préfère crèmes et lotions aux sprays. Respecte le nombre d’applications indiqué et lave la peau quand le risque est passé.
- **Avant 6 mois** : mise sur la moustiquaire et les vêtements, et demande conseil à un professionnel avant tout répulsif.
- **Avec la crème solaire** : applique-la d’abord, attends une vingtaine de minutes, puis le répulsif.
- Range les répulsifs hors de portée des enfants et n’utilise jamais de produits destinés aux animaux.

**Autour de la maison** : vide les soucoupes, couvre les réserves d’eau, entretiens les gouttières et range les objets qui retiennent l’eau de pluie, car les moustiques pondent dans l’eau stagnante.

## Questions fréquentes
**Les bracelets anti-moustiques sont-ils utiles pour un bébé ?** Non : l’Assurance Maladie classe les bracelets, rubans, huiles essentielles, vitamine B1 et homéopathie parmi les mesures inefficaces.

**Un diffuseur électrique dans la chambre suffit-il ?** Les diffuseurs, la climatisation ou les ventilateurs sont des mesures d’appoint : ils ne remplacent pas la moustiquaire et, selon l’âge, les répulsifs.

**La piqûre est devenue rouge, chaude et gonflée avec du pus : que faire ?** Ce sont des signes possibles de surinfection : consulte ton médecin.

**Nous partons en zone tropicale avec un bébé : que prévoir ?** Prends rendez-vous avec ton médecin ou un centre de vaccinations internationales avant le départ, pour adapter la protection à la destination et à l’âge.

## Quand demander conseil
Consulte si une piqûre s’infecte (rougeur qui s’étend, chaleur, pus, fièvre) ou si ton enfant a de la fièvre après un séjour dans une zone où circulent des maladies transmises par les moustiques. Appelle le **15** (ou le 112) en cas de gonflement du visage ou de la langue, de démangeaisons ou plaques rouges sur tout le corps, de malaise ou de difficulté à respirer.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120,
    slug: 'tique-sur-mon-enfant-retirer-et-surveiller',
    title: 'Une tique sur mon enfant : la retirer correctement et surveiller un mois',
    summary: 'Après une balade en forêt ou au jardin : où chercher les tiques sur un enfant, comment les retirer avec un tire-tique, ce qu’il ne faut pas faire et quand consulter pour la maladie de Lyme.',
    tags: ['tique enfant', 'tire-tique', 'maladie de Lyme', 'érythème migrant', 'plaque rouge après tique', 'balade forêt', 'enlever une tique'],
    sources: [S.arsTiques, S.santePiqures, S.ameliEte],
    body_md: `## En bref
- Après une sortie dans la nature, **inspecte tout le corps** de ton enfant : cuir chevelu, aisselles, aine, arrière des genoux.
- Retire la tique **le plus vite possible** avec un **tire-tique** de pharmacie, sans l’écraser.
- **Pas d’alcool, d’éther, d’huile, de vaseline ou de vernis**, et ne la brûle pas.
- Désinfecte, puis **surveille la zone pendant au moins un mois**.
- **Plaque rouge qui s’étend en cercle** autour de la piqûre, fièvre, fatigue inhabituelle : consulte ton médecin.

## Comprendre
Les tiques vivent dans les forêts, les zones humides et les hautes herbes, mais aussi dans les parcs et les jardins. Elles sont surtout actives d’avril à octobre, précise l’ARS Grand Est. Leur piqûre est **indolore** : c’est pourquoi l’inspection du corps est indispensable, en particulier chez les enfants, qui jouent souvent dans l’herbe.

Les tiques peuvent transmettre la **maladie de Lyme** (borréliose), une infection non contagieuse. Toutes les tiques ne sont pas infectées, et le risque augmente avec la durée pendant laquelle la tique reste accrochée : d’où l’intérêt de la retirer rapidement.

Le premier signe de la maladie est souvent l’**érythème migrant** : une plaque rouge, centrée sur la piqûre, qui s’étend progressivement en cercle dans les jours ou semaines qui suivent. Elle peut aussi apparaître ailleurs sur le corps. Une maladie de Lyme non traitée peut ensuite provoquer des atteintes neurologiques ou articulaires.

## Au quotidien
**Avant la balade**
- Vêtements clairs et couvrants, pantalon rentré dans les chaussettes, chaussures fermées.
- Reste au milieu des chemins, évite les broussailles et les hautes herbes.
- Les produits anti-tiques pour vêtements ont des précautions particulières pour les enfants et les femmes enceintes : lis la notice et demande conseil au pharmacien.
- Emporte un tire-tique.

**Au retour**
- Inspecte tout le corps de ton enfant, y compris le **cuir chevelu**, derrière les oreilles, les aisselles, l’aine et l’arrière des genoux.

**Retirer une tique**
1. Utilise le tire-tique selon sa notice, au plus près de la peau.
2. Décroche la tique sans écraser son corps.
3. Désinfecte la zone et lave-toi les mains.
4. Si un petit morceau reste dans la peau, il sort généralement seul, comme une écharde, selon l’ARS Grand Est.
5. Note la date et l’endroit de la piqûre (une photo aide), puis surveille la peau pendant un mois.

## Questions fréquentes
**Faut-il « endormir » la tique avec de l’éther ou de l’alcool avant de la retirer ?** Non. L’ARS Grand Est et Santé.fr déconseillent l’alcool, l’éther, l’huile, la vaseline ou le vernis, et il ne faut jamais la brûler.

**Je n’ai pas de tire-tique : que faire ?** L’ARS Grand Est indique qu’une pince à épiler ou les doigts peuvent dépanner, à condition de ne pas écraser le corps de la tique. Le tire-tique reste l’outil le plus adapté.

**Faut-il consulter après chaque piqûre de tique ?** Pas forcément : retire-la, désinfecte et surveille. Consulte si une plaque rouge s’étend, ou en cas de maux de tête, de courbatures ou d’autres signes inhabituels dans les semaines qui suivent.

**Puis-je signaler la piqûre ?** Oui, via le programme de science participative CiTIQUE (application ou site), qui aide la recherche.

## Quand demander conseil
Consulte ton médecin si une **plaque rouge** s’étend autour de la piqûre dans le mois qui suit, si plusieurs plaques apparaissent, ou si ton enfant présente des maux de tête, des courbatures ou tout autre signe inhabituel dans les semaines qui suivent la piqûre. Appelle le **15** (ou le 112) en cas de malaise, de gêne respiratoire ou de gonflement du visage.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'morsure-ou-griffure-de-chien-ou-de-chat-enfant',
    title: 'Morsure ou griffure de chien ou de chat : soigner vite et consulter',
    summary: 'Laver longuement, désinfecter, surveiller l’infection : les soins d’une morsure ou d’une griffure chez l’enfant, les situations qui imposent le 15 et les questions de rage et de tétanos.',
    tags: ['morsure de chien enfant', 'morsure de chat', 'griffure de chat', 'maladie des griffes du chat', 'rage', 'tétanos', 'morsure au visage', 'animal domestique'],
    sources: [S.ameliMorsure, S.ameliGriffures],
    body_md: `## En bref
- **Lave abondamment** la plaie à l’eau et au savon, rince, sèche, désinfecte, couvre d’un pansement stérile.
- Les enfants sont les plus touchés par les morsures de chien, avec un risque plus élevé de blessures **à la tête et au cou**.
- **Morsure au visage, au cou ou aux organes génitaux, plaie profonde ou hémorragie** : appelle le **15**.
- Consulte rapidement pour une **morsure de chat**, une morsure aux mains, aux pieds ou près d’une articulation, ou si l’animal n’est pas connu.
- **Ne laisse jamais un enfant seul avec un animal**, même familier.

## Comprendre
Selon l’Assurance Maladie, le chien est l’animal le plus souvent en cause, suivi du chat. Les morsures de chat paraissent souvent discrètes mais peuvent être **profondes** et atteindre tendons, articulations ou nerfs ; elles présentent un risque infectieux élevé. Une plaie de peau léchée par un chien se traite comme une morsure.

Les complications possibles : infection, plaie profonde, hémorragie, fracture, tétanos, rage si l’animal est porteur, séquelles esthétiques ou psychologiques.

Les **griffures de chat** peuvent transmettre la **maladie des griffes du chat**, due à une bactérie transmise par les puces. Elle touche surtout les moins de 20 ans : 1 à 3 semaines après la griffure apparaissent une rougeur ou un bouton, des ganglions douloureux à proximité, de la fatigue, parfois une petite fièvre. Les nourrissons sont aussi plus exposés à une autre infection, la pasteurellose, qui donne douleur, rougeur et gonflement dans les heures qui suivent.

## Au quotidien
**Soigner une morsure ou une griffure**
1. Lave immédiatement et longuement à l’eau et au savon, retire les saletés, rince.
2. Sèche, applique un antiseptique adapté à l’âge de ton enfant, couvre d’un pansement stérile.
3. En cas de saignement, comprime avec un linge propre et surélève le membre.
4. Chaque jour : nettoie, désinfecte, surveille l’aspect de la plaie et la température.

L’Assurance Maladie signale que la chlorhexidine peut, rarement, provoquer une réaction allergique grave dans l’heure : urticaire, gonflement, gêne respiratoire, malaise. Dans ce cas, appelle le 15.

**Informations à rassembler** : l’animal (le tien, celui d’un voisin, un animal errant ?), l’heure et les circonstances, le carnet de vaccination de l’animal et le carnet de santé de ton enfant.

**Prévenir**
- Ne laisse jamais un enfant seul avec un animal.
- Apprends-lui à ne pas déranger un animal qui dort, mange ou protège ses petits, à ne pas le tirer par la queue ou les oreilles, à ne pas le coincer.
- Pas de caresse à un chien inconnu sans l’accord de son propriétaire.
- Lave les mains de ton enfant après avoir joué avec un chat ; traite régulièrement ton chat contre les puces.

## Questions fréquentes
**La morsure est petite et c’est notre chien : faut-il consulter ?** Une petite morsure bien nettoyée peut être soignée à la maison, mais consulte si elle est sur la main, le pied, le visage ou près d’une articulation, si elle est profonde, ou si la vaccination contre le tétanos n’est pas à jour.

**Faut-il s’inquiéter de la rage ?** Si l’animal est connu, il doit être suivi par un vétérinaire pendant 15 jours. S’il est inconnu ou errant, ton médecin t’orientera vers un centre antirabique. La rage est une maladie mortelle une fois déclarée : ne néglige pas cette question.

**Quand l’infection apparaît-elle ?** En général vers 24 heures après une morsure de chien, plus tôt après une morsure de chat : douleur, rougeur, gonflement, pus ou fièvre.

**Une griffure près de l’œil est-elle plus grave ?** Oui : l’Assurance Maladie demande un avis immédiat, avec un avis ophtalmologique, si la griffure est près de l’œil ou si une conjonctivite apparaît.

## Quand demander conseil
Appelle le **15** (ou le 112) pour une morsure au visage, au cou ou aux organes génitaux, une plaie déchiquetée ou profonde, une hémorragie, ou une perte de sensibilité ou de mobilité. Consulte rapidement pour une morsure de chat, une morsure aux mains, aux pieds ou près d’une articulation, un animal inconnu ou non vacciné contre la rage, un tétanos non à jour, une griffure près de l’œil, ou tout signe d’infection (rougeur, pus, traînée rouge, ganglions, fièvre).

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'morsure-de-vipere-enfant-que-faire',
    title: 'Morsure de serpent en randonnée : les gestes qui aident et ceux à proscrire',
    summary: 'En France métropolitaine, la vipère est le seul serpent venimeux : reconnaître une morsure, appeler le 15, immobiliser, et oublier garrot, aspiration et kits antivenin.',
    tags: ['morsure de vipère', 'serpent enfant', 'randonnée', 'couleuvre', 'garrot', 'aspi-venin', 'envenimation'],
    sources: [S.ameliSerpent, S.crPiqures],
    body_md: `## En bref
- En France métropolitaine, la **vipère** est le seul serpent venimeux vivant en liberté ; sa morsure est très rarement mortelle mais nécessite toujours les secours.
- **Appelle le 15** (ou le 112), garde ton enfant **calme, allongé et immobile**.
- Retire tout ce qui serre (bagues, bracelets, chaussures), nettoie la plaie, **immobilise le membre**.
- **Pas de garrot, pas d’aspiration, pas d’incision**, pas de glace ni de pommade, et pas de kit antivenin.
- Marque au stylo les limites du gonflement avec l’heure.

## Comprendre
L’Assurance Maladie explique qu’une morsure peut être « sèche », sans injection de venin : elle ne provoque alors que des signes locaux. Une **envenimation** se reconnaît à deux points de morsure, des douleurs vives, un gonflement et une rougeur ; des signes digestifs, cardiaques, respiratoires ou neurologiques peuvent apparaître plus tard. D’où l’importance d’une prise en charge médicale, même si l’enfant semble aller bien au début.

Pour distinguer les espèces, l’Assurance Maladie décrit la couleuvre avec une tête et une pupille rondes, et la vipère avec une **tête triangulaire** et une **pupille fendue verticalement**. Mais ne cherche pas à t’approcher pour vérifier : une photo prise à distance suffit.

À l’hôpital, la prise en charge repose sur la surveillance et le traitement de la douleur ; le sérum antivenin est réservé aux formes graves.

## Au quotidien
**Les gestes, dans l’ordre** (d’après l’Assurance Maladie et la Croix-Rouge)
1. Éloigne ton enfant du serpent sans chercher à l’attraper ni à le tuer.
2. Appelle le 15 ou le 112, même depuis un téléphone bloqué ou sans crédit.
3. Allonge ton enfant, rassure-le et limite ses mouvements. En lieu isolé, la Croix-Rouge conseille de le transporter sans le faire marcher.
4. Retire bagues, bracelets, montre et chaussures du côté mordu.
5. Nettoie la plaie à l’eau propre et au savon, couvre d’un linge propre.
6. Immobilise le membre ; l’Assurance Maladie conseille de le surélever.
7. Trace au stylo le contour du gonflement et note l’heure, pour que les soignants voient son évolution.
8. Ne le laisse pas seul.

**À ne pas faire**
- Garrot ou bandage serré.
- Sucer, aspirer, inciser ou comprimer la plaie ; la Croix-Rouge déconseille aussi les dispositifs d’extraction du venin.
- Appliquer de la glace ou une pommade, injecter quoi que ce soit (l’Assurance Maladie juge les kits antivenin inefficaces).
- Donner de l’alcool, du thé ou du café.
- Donner un médicament sans l’avis du médecin régulateur : demande-lui ce qui convient pour la douleur.

**Prévenir en randonnée**
- Chaussures fermées et montantes, pantalon long dans les zones de rochers et de hautes herbes.
- Regarde avant de t’asseoir, de poser la main sur une pierre ou de soulever un tronc.
- Ne laisse pas les enfants jouer dans des endroits difficiles à surveiller, et apprends-leur à ne jamais toucher ni exciter un serpent.

## Questions fréquentes
**Le serpent s’est enfui et je ne sais pas si c’était une vipère : faut-il appeler ?** Oui. Appelle le 15 et décris la scène : le médecin régulateur évaluera le risque.

**Mon enfant n’a presque pas mal : est-ce rassurant ?** Pas suffisamment : des signes peuvent apparaître plus tard. Suis les consignes du 15.

**Peut-on lui donner à boire ?** Suis l’avis du médecin régulateur ; ne donne en tout cas ni thé, ni café, ni alcool.

**Comment éviter de surprendre un serpent ?** Chaussures fermées et montantes, bâton en randonnée, et attention aux endroits où l’on pose mains et pieds, comme le recommandent l’Assurance Maladie et la Croix-Rouge.

## Quand demander conseil
Appelle **toujours le 15** (ou le 112) après une morsure de serpent chez un enfant, même si elle paraît bénigne, et décris précisément les signes. Rappelle immédiatement si le gonflement s’étend, si ton enfant vomit, a mal au ventre, devient pâle, somnolent, respire mal ou fait un malaise. Le 114 permet de joindre les secours par SMS pour les personnes sourdes ou malentendantes.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120,
    slug: 'meduse-vive-oursin-a-la-plage-enfant',
    title: 'Méduse, vive, oursin : les piqûres de la plage et les bons gestes',
    summary: 'Douleur brutale dans l’eau ou sur le sable : reconnaître une piqûre de méduse, de physalie ou de vive, rincer à l’eau de mer, soulager par la chaleur et savoir quand appeler le 15.',
    tags: ['piqûre de méduse enfant', 'vive', 'physalie', 'oursin', 'plage', 'piqûre animal marin', 'eau de mer', 'vinaigre méduse'],
    sources: [S.ansesMarins, S.crPiqures, S.ameliEte],
    body_md: `## En bref
- **Sors immédiatement de l’eau** : une douleur intense peut entraîner un risque de noyade.
- **Méduse ou physalie** : rince à **l’eau de mer**, jamais à l’eau douce ; retire les filaments **sans les toucher**, avec du sable sec et une carte rigide.
- **Vive** (douleur très intense après avoir marché dans le sable) : trempe la zone dans de l’eau **chaude**, sans brûler la peau (l’Anses indique de ne pas dépasser 42 °C) et consulte.
- **Oursin** : retire les piquants à la pince et désinfecte.
- **Malaise, gêne respiratoire** : appelle le **15** ou va au poste de secours.

## Comprendre
L’Anses a analysé les piqûres d’animaux marins signalées aux centres antipoison entre 2015 et 2024. Les **vives**, petits poissons enfouis dans le sable, sont en cause dans plus de la moitié des cas : elles provoquent une douleur brutale et extrêmement intense, un gonflement qui peut s’étendre à tout le membre, et parfois des complications locales durables. Les **méduses** donnent le plus souvent des lésions bénignes : brûlure, rougeur ou traces en lignes, démangeaisons pendant plusieurs jours. Les **physalies** provoquent une douleur très intense et, dans environ 15 % des cas, des signes généraux (vomissements, douleurs, contractions musculaires, gêne respiratoire).

Les **oursins** ne sont pas venimeux dans nos régions, mais leurs piquants peuvent s’infecter, rappelle la Croix-Rouge.

## Au quotidien
**Méduse ou physalie**
1. Sors ton enfant de l’eau et empêche-le de frotter ou de gratter.
2. Rince abondamment à l’eau de mer, si possible tiède. Pour une physalie, l’Anses conseille de l’eau de mer additionnée de vinaigre blanc (une part de vinaigre pour trois parts d’eau) ; à défaut, de l’eau de mer seule.
3. Retire les filaments visibles sans les toucher : recouvre de sable sec (ou de mousse à raser), laisse sécher, puis racle avec un objet rigide comme une carte.
4. Rince de nouveau à l’eau de mer, puis applique un antiseptique.
5. Ne rince jamais à l’eau douce.

**Vive**
- Plonge le pied ou la main dans de l’eau aussi chaude que possible sans brûler la peau (au maximum 42 °C selon l’Anses ; vérifie la température avec ta propre main), ou approche un sèche-cheveux, le plus tôt possible.
- Désinfecte et consulte : la Croix-Rouge recommande un avis médical en urgence.

**Oursin**
- Retire rapidement les piquants avec une pince désinfectée, puis désinfecte la peau.
- Surveille les jours suivants : rougeur, chaleur ou pus doivent faire consulter.

**Prévenir**
- Sandales en plastique ou chaussons d’eau sur les rochers et dans les zones sableuses où vivent les vives.
- Pas de baignade quand des méduses ou des physalies sont signalées ; privilégie les zones surveillées.
- Apprends aux enfants à ne jamais toucher une méduse ou une physalie échouée : elle reste urticante, même morte.

## Questions fréquentes
**Faut-il uriner sur une piqûre de méduse ?** Ce geste ne fait pas partie des recommandations. Suis les étapes ci-dessus : eau de mer, sable sec, carte rigide, antiseptique.

**Pourquoi pas d’eau douce ?** L’Anses le déconseille formellement : rince uniquement à l’eau de mer, si possible tiède.

**Les marques de méduse durent plusieurs jours : faut-il consulter ?** Les démangeaisons peuvent durer quelques jours. Consulte ou appelle un centre antipoison si les lésions évoluent de façon anormale ou s’infectent.

**Mon enfant a très mal après une vive : pourquoi pleure-t-il autant ?** La douleur d’une piqûre de vive est réputée extrêmement intense. Applique la chaleur et consulte sans attendre.

## Quand demander conseil
Appelle le **15** (ou le 112), ou va immédiatement au poste de secours, si ton enfant fait un malaise, a du mal à respirer, vomit, se plaint de douleurs dans la poitrine ou le ventre, ou présente des contractions musculaires. Consulte en urgence après une piqûre de vive. Vois un médecin ou contacte un centre antipoison si les lésions s’aggravent, s’étendent ou s’infectent.

${FIN}`,
  },
  // ------------------------------------------------------------------ corps étrangers, intoxications
  {
    ...TOUS, min_age_months: 6, max_age_months: 96,
    slug: 'objet-dans-le-nez-enfant-que-faire',
    title: 'Un objet coincé dans le nez de mon enfant : ce qu’il faut faire et éviter',
    summary: 'Perle, petit pois, morceau de jouet : pourquoi ne pas tenter de l’extraire soi-même chez l’enfant, le seul geste utile à essayer et le cas particulier des piles bouton.',
    tags: ['objet dans le nez', 'perle dans le nez', 'corps étranger nez enfant', 'pile bouton nez', 'écoulement d’une narine', 'ORL'],
    sources: [S.ameliNez, S.ameliInhale],
    body_md: `## En bref
- Chez l’enfant, **n’utilise aucun instrument** (pince, coton-tige) pour retirer un objet du nez : tu risques de l’enfoncer, voire de le faire passer dans les bronches.
- Un enfant qui a un objet dans le nez, ou qui dit s’en être mis un, doit être **vu rapidement par un médecin**.
- Un enfant assez grand peut essayer de **se moucher doucement en bouchant l’autre narine**, après avoir inspiré par la bouche.
- **Pile bouton** dans le nez : urgence, à retirer **en moins de 2 heures**.
- Gêne pour respirer : **15**.

## Comprendre
Les jeunes enfants explorent leur corps et y introduisent volontiers de petits objets : perles, morceaux de jouets, capuchons, petits aliments. Souvent, personne ne l’a vu. L’Assurance Maladie décrit les signes qui peuvent alerter :
- **tout de suite** : une seule narine bouchée, un écoulement clair (parfois avec un peu de sang) du même côté, une gêne pour respirer d’un côté ;
- **plusieurs jours après**, si l’introduction est passée inaperçue : un **écoulement purulent d’une seule narine** qui dure, parfois avec du sang, une douleur d’un côté du visage, des éternuements.

Un objet peut aussi passer de l’arrière du nez vers les voies respiratoires, d’où la prudence avec les manipulations. Chez l’ORL, l’objet est repéré avec un petit appareil et retiré par la narine ; une anesthésie générale est parfois nécessaire chez un enfant jeune ou agité.

## Au quotidien
**Ce que tu peux essayer**
- Reste calme et rassure ton enfant.
- S’il est assez grand pour comprendre : demande-lui d’inspirer par la bouche (pour ne pas enfoncer l’objet), bouche la narine libre, puis fais-le souffler **doucement** par la narine concernée.
- Si l’objet ne sort pas, n’insiste pas.

**Ce qu’il ne faut pas faire**
- Introduire une pince, un coton-tige ou tout autre instrument dans le nez d’un enfant.
- Attendre plusieurs jours en espérant que l’objet sorte seul.

**Prévenir**
- Apprends-lui à ne rien mettre dans son nez, doigts compris.
- Choisis des jouets adaptés à son âge, marqués CE, sans petites pièces détachables ; surveille les jeux des aînés (perles, petites briques).
- Range hors de portée piles, capuchons, petits objets et petits aliments durs.

## Questions fréquentes
**Je vois l’objet à l’entrée de la narine : puis-je le prendre à la pince ?** L’Assurance Maladie réserve cette tentative à l’adulte avec un objet très visible ; elle déconseille l’usage d’un instrument chez l’enfant. Fais-le examiner.

**Il a un écoulement d’une seule narine depuis une semaine : est-ce un rhume ?** Un écoulement purulent d’un seul côté, qui dure, peut révéler un objet oublié dans le nez. Parles-en à ton médecin.

**Pourquoi une pile bouton est-elle si urgente ?** Elle peut brûler les tissus en peu de temps : l’Assurance Maladie indique qu’elle doit être retirée en moins de 2 heures. Il en va de même pour une pastille de produit chimique : consulte sans attendre ou appelle le 15.

**Et si l’objet a été avalé ou inhalé ?** S’il tousse brutalement ou respire mal, pense à une fausse route : voir les articles sur l’étouffement et sur les piles bouton avalées.

## Quand demander conseil
Appelle le **15** (ou le 112) si ton enfant a du mal à respirer, si le saignement est très abondant (en attendant : narines pincées, tête penchée en avant), ou après un choc au visage. Consulte **en urgence** pour une pile bouton ou une pastille chimique dans le nez. Consulte rapidement un médecin dans tous les autres cas d’objet dans le nez, ou en cas de fièvre, de rougeur du nez ou d’écoulement d’un seul côté.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120, safety_critical: true,
    slug: 'pile-bouton-ou-aimant-avale-enfant-urgence',
    title: 'Pile bouton ou aimants avalés : une urgence, même sans symptôme',
    summary: 'Une pile bouton avalée peut brûler l’œsophage en quelques heures et plusieurs aimants peuvent perforer l’intestin : appeler tout de suite, laisser l’enfant à jeun, ne pas faire vomir.',
    tags: ['pile bouton avalée', 'aimant avalé', 'billes aimantées', 'enfant a avalé', 'corps étranger avalé', 'télécommande', 'centre antipoison'],
    sources: [S.ameliPile, S.santePiles, S.ansesAimants],
    body_md: `## En bref
- Une **pile bouton avalée**, ou même seulement soupçonnée, est une **urgence** : appelle **tout de suite le 15** ou un **centre antipoison** en précisant qu’il s’agit d’une pile bouton.
- **Laisse ton enfant à jeun**, ne lui donne rien à boire ni à manger et **ne le fais pas vomir**.
- Garde l’emballage ou un appareil identique pour les soignants.
- **Plusieurs aimants** avalés peuvent s’attirer à travers l’intestin et le perforer : contacte immédiatement un centre antipoison.
- Prévention : piles neuves **et usagées** hors de portée, compartiments à piles vissés.

## Comprendre
Les piles bouton se trouvent dans de nombreux objets du quotidien : télécommandes, calculatrices, montres, appareils photo, aides auditives, certains jouets électriques. Une fois avalée, une pile peut rester coincée dans l’œsophage et provoquer des **brûlures**, une perforation ou des saignements brutaux. Santé.fr résume : « chaque minute compte ». L’Assurance Maladie recommande diagnostic et traitement dans un délai **maximal de 2 heures**, avec une radiographie pour localiser la pile et, si elle est bloquée dans l’œsophage, une endoscopie sans délai. Les enfants de 5 ans et moins et les grosses piles (15 mm de diamètre ou plus) sont les plus à risque.

L’ingestion passe souvent inaperçue. Les signes qui doivent faire y penser : fièvre, salivation importante, refus de manger, difficulté à avaler, voix anormale, toux ou difficulté à respirer, douleur dans la poitrine, malaise, pâleur.

Les **aimants**, notamment les petites billes aimantées des jouets « anti-stress » pour adultes ou de certains jeux de construction, sont beaucoup plus dangereux qu’un objet inerte de même taille. L’Anses explique que plusieurs billes avalées peuvent se coller entre elles à travers les parois de l’intestin, provoquer une occlusion et des perforations nécessitant une chirurgie lourde.

## Au quotidien
**Si tu penses que ton enfant a avalé une pile bouton**
1. Appelle immédiatement le 15 ou un centre antipoison et dis « pile bouton ».
2. Ne lui donne rien à manger ni à boire.
3. Ne le fais pas vomir : la pile pourrait se coincer dans l’œsophage.
4. Récupère l’emballage ou l’appareil d’où vient la pile.
5. Rendez-vous à l’hôpital indiqué par ton interlocuteur.

**Au téléphone**, donne : ton numéro, ton nom et celui de l’enfant, l’adresse exacte, l’heure probable de l’ingestion, la description de la pile, les signes observés. Ne raccroche pas avant qu’on te le demande.

**Après la sortie de l’hôpital**, l’Assurance Maladie recommande une surveillance d’un mois : consulte en cas de fièvre, toux, refus de manger, vomissements, douleurs au ventre, absence de selles ou sang dans les selles.

**Prévenir**
- Range les piles neuves et usagées hors de portée, comme des médicaments ; rapporte les usagées au point de collecte sans tarder.
- Vérifie que les compartiments à piles se ferment par une vis ou un système de sécurité ; sinon, range l’appareil hors de portée.
- Garde les objets contenant des billes aimantées loin des enfants, qui peuvent les prendre pour des bonbons ; respecte l’âge indiqué sur les jouets.

## Questions fréquentes
**Il n’a aucun symptôme : faut-il vraiment appeler ?** Oui. L’Assurance Maladie demande de considérer toute suspicion comme une ingestion tant qu’une radiographie ne l’a pas écartée. L’absence de symptôme au début n’est pas rassurante.

**Puis-je lui donner du miel ou de l’eau en attendant ?** Suis la consigne de l’Assurance Maladie : rien à boire, rien à manger, sauf indication contraire des soignants que tu as au téléphone.

**Il a avalé une seule bille aimantée : est-ce grave ?** Contacte immédiatement un centre antipoison pour un avis : il est difficile d’être sûr du nombre avalé, et l’Anses explique que le danger vient surtout de plusieurs aimants qui s’attirent entre eux dans l’intestin.

**La pile est ressortie dans les selles : faut-il consulter ?** Signale-le au médecin qui suit ton enfant. Sans expulsion dans les 2 semaines, l’Assurance Maladie conseille de consulter.

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 112) ou un **centre antipoison** dès qu’une pile bouton ou des aimants ont pu être avalés, même sans symptôme. Appelle le 15 sans attendre si ton enfant respire mal, bave beaucoup, refuse d’avaler, vomit du sang, devient pâle ou fait un malaise.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 6, max_age_months: 120, safety_critical: true,
    slug: 'enfant-a-avale-un-produit-ou-un-medicament-que-faire',
    title: 'Mon enfant a avalé un médicament ou un produit ménager : que faire ?',
    summary: 'Dosette de lessive, comprimé trouvé au sol, flacon ouvert : les réflexes face à une intoxication, ce qu’il ne faut surtout pas faire et comment ranger pour éviter l’accident.',
    tags: ['intoxication enfant', 'centre antipoison', 'enfant a bu du produit', 'dosette lessive', 'médicament avalé', 'produit ménager', 'faire vomir'],
    sources: [S.ameliIntox, S.ansesIntox],
    body_md: `## En bref
- Ton enfant est **inconscient** ou respire mal : **15** (ou 112), puis position latérale de sécurité.
- Il est **conscient** : appelle **un centre antipoison**, même s’il n’a **aucun symptôme**.
- **Ne le fais pas vomir, ne lui donne ni eau ni lait**, ne le laisse pas seul, ne le transporte pas de ton propre initiative.
- Garde l’emballage, la notice et ce qui reste du produit.
- Selon l’Anses, les **produits d’entretien** et les **médicaments** sont les premières causes d’intoxication accidentelle chez l’enfant.

## Comprendre
La majorité des intoxications de l’enfant surviennent **avant 4 ans** et sont accidentelles, rappelle l’Assurance Maladie. Les petits explorent avec la bouche et ne distinguent pas un bonbon d’un comprimé, ni une boisson d’un produit transvasé.

L’Anses a analysé les intoxications accidentelles des moins de 15 ans signalées aux centres antipoison. Les produits d’entretien arrivent en tête, et près de la moitié concernent les produits de lessive, en particulier les **dosettes de lessive liquide**, attirantes et concentrées. Les déboucheurs peuvent provoquer des brûlures. Les **médicaments** sont la deuxième cause, mais la première cause des cas graves, notamment les antidouleurs opioïdes, certains médicaments du cœur et les somnifères ou anxiolytiques. Le **cannabis** est en outre devenu la première cause d’admission en réanimation des moins de 6 ans pour intoxication, d’après la même analyse.

Les symptômes peuvent être absents au début : c’est pourquoi on appelle **sans attendre**, même si l’enfant semble aller bien.

## Au quotidien
**Les bons réflexes**
1. Éloigne le produit de ton enfant, sans le jeter : il sera utile aux soignants.
2. Regarde s’il est conscient et respire normalement.
3. **Inconscient** : appelle le 15, mets-le en position latérale de sécurité, surveille sa respiration.
4. **Conscient** : appelle un centre antipoison (numéros sur le site des centres antipoison et sur ameli.fr), ou le 15 s’il présente des signes.
5. Prépare les informations : âge et poids de l’enfant, nom exact du produit, quantité possible, heure, symptômes, maladies connues.
6. Si un transfert à l’hôpital est décidé, emporte emballages et notices.

**À ne pas faire**
- Faire vomir : l’Assurance Maladie le déconseille formellement.
- Donner du lait ou de l’eau « pour diluer ».
- Attendre l’apparition de symptômes avant d’appeler.

**Prévenir à la maison… et ailleurs**
- Médicaments rangés **en hauteur et sous clé**, jamais laissés dans un sac ou sur une table.
- Produits ménagers dans leur **emballage d’origine**, jamais transvasés dans une bouteille de boisson, rangés en hauteur ou sous clé, refermés juste après usage.
- Dosettes de lessive hors de vue et de portée.
- Même vigilance chez les grands-parents, chez des amis ou en vacances, où les rangements sont rarement adaptés aux enfants.
- Ne consomme pas de cannabis en présence d’enfants et ne laisse aucun produit à leur portée.

## Questions fréquentes
**Il a seulement léché le bouchon : faut-il appeler ?** Oui, appelle le centre antipoison : il évaluera le risque selon le produit et la quantité, et toi dira s’il faut surveiller à la maison ou consulter.

**Je ne sais pas combien de comprimés il a pris : que dire ?** Compte ce qui reste si possible et indique la quantité maximale qu’il a pu prendre : le centre antipoison adaptera ses conseils.

**Le centre antipoison peut-il me répondre la nuit ?** Les centres antipoison répondent 24 heures sur 24.

**Et s’il s’agit de plantes ou de champignons ?** Même conduite : appelle un centre antipoison et garde à portée de main ce qui reste de la plante ou du champignon, comme pour tout produit suspect.

## Quand demander conseil
Appelle le **15** (ou le 112) si ton enfant est inconscient, somnolent, convulse, respire mal, a des brûlures dans la bouche, bave beaucoup ou fait un malaise. Dans tous les autres cas, appelle **un centre antipoison sans attendre**, même sans symptôme. Le 114 permet de joindre les secours par SMS pour les personnes sourdes ou malentendantes.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'monoxyde-de-carbone-reconnaitre-et-reagir-en-famille',
    title: 'Monoxyde de carbone : reconnaître une intoxication et protéger toute la famille',
    summary: 'Maux de tête et nausées chez plusieurs personnes de la maison, surtout l’hiver : aérer, couper les appareils, sortir et appeler. Ce gaz invisible est la première cause d’hospitalisation pour intoxication des moins de 6 ans.',
    tags: ['monoxyde de carbone', 'intoxication CO', 'chaudière', 'chauffage', 'détecteur de monoxyde', 'maux de tête nausées hiver', 'groupe électrogène'],
    sources: [S.santeCO, S.ansesIntox],
    body_md: `## En bref
- Le monoxyde de carbone (CO) est un gaz **incolore et inodore** produit par une combustion incomplète (chaudière, chauffe-eau, poêle, cheminée, chauffage d’appoint, groupe électrogène…).
- Signes : **maux de tête, nausées ou vomissements, grande fatigue, malaise** — souvent chez plusieurs personnes du même logement.
- En cas de doute : **aère, arrête les appareils, sors**, puis appelle le **15, le 18 ou le 112**.
- Selon l’Anses, c’est la **première cause d’hospitalisation pour intoxication chez les moins de 6 ans**, surtout l’hiver.
- Prévention : entretien annuel des appareils, ramonage, aération quotidienne, aérations jamais bouchées.

## Comprendre
Le CO prend la place de l’oxygène dans le sang. Comme il ne se voit ni ne se sent, l’intoxication est difficile à repérer : ses signes peuvent passer pour une simple fatigue ou un virus. Les nourrissons sont particulièrement touchés, et l’Anses indique que le CO est la première cause de décès dans les données d’intoxication de l’enfant qu’elle a analysées.

Santé.fr liste de nombreuses sources possibles : chaudières, chauffe-eau, cheminées, poêles, chauffages d’appoint non électriques, braseros, barbecues, moteurs de voiture, groupes électrogènes. D’où l’importance de l’entretien des appareils et de la ventilation du logement.

## Au quotidien
**Si tu suspectes une intoxication**
1. **Aère immédiatement** : ouvre portes et fenêtres.
2. **Arrête les appareils à combustion** si tu peux le faire sans danger.
3. **Sors** de l’habitation avec toute la famille et les animaux.
4. **Appelle le 15, le 18 ou le 112** (114 pour les personnes sourdes ou malentendantes) si quelqu’un a des symptômes.
5. Ne rentre pas avant l’avis d’un professionnel qualifié.

**Avant l’hiver**
- Fais vérifier chaudière, chauffe-eau, poêle et inserts par un professionnel qualifié.
- Fais ramoner mécaniquement conduits et cheminées au moins une fois par an.

**Pendant l’hiver**
- Aère ton logement au moins deux fois par jour pendant 10 minutes, comme le conseille Santé.fr.
- Ne bouche jamais les entrées et sorties d’air, même par grand froid.
- Utilise les chauffages d’appoint de façon intermittente et seulement s’ils sont prévus pour cela.

**Toute l’année**
- Jamais de barbecue, de brasero ou de groupe électrogène à l’intérieur, y compris dans un garage : le groupe électrogène s’installe dehors.
- Ne laisse jamais tourner un moteur de voiture dans un garage fermé.
- N’utilise pas pour te chauffer des appareils non conçus pour cela (cuisinière, four).

## Questions fréquentes
**Un détecteur de monoxyde de carbone est-il obligatoire ?** Non, contrairement au détecteur de fumée. Santé.fr indique qu’il existe des détecteurs répondant à la norme NF EN 50291 ; ils ne remplacent pas l’entretien des appareils.

**Détecteur de fumée et détecteur de CO, est-ce la même chose ?** Non, et la conduite à tenir diffère : en cas d’alarme de CO, on **aère et on sort** ; en cas d’incendie, les consignes sont différentes (rester à l’abri, fermer les portes et attendre les secours près d’une fenêtre).

**Toute la famille a mal à la tête : faut-il penser au CO ?** Des maux de tête, nausées ou une fatigue inhabituelle chez plusieurs personnes d’un même logement, surtout en période de chauffage, doivent faire penser au CO. Aère, sors et appelle.

**Le chauffage au bois est-il concerné ?** Oui : poêles, inserts et cheminées doivent être entretenus et leurs conduits ramonés régulièrement.

## Quand demander conseil
Appelle **immédiatement le 15**, le 18 ou le 112 après avoir aéré et quitté le logement si une ou plusieurs personnes ont des maux de tête, des nausées, des vomissements, une fatigue inhabituelle, un malaise ou une perte de connaissance. Si une personne est inconsciente et respire, mets-la en position latérale de sécurité une fois à l’air libre. Pour l’entretien de tes appareils, fais appel à un professionnel qualifié.

${FIN}`,
  },
  // ------------------------------------------------------------------ gestes vitaux
  {
    ...BB, min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'bebe-de-moins-d-un-an-qui-s-etouffe-claques-et-compressions',
    title: 'Bébé de moins d’un an qui s’étouffe : les claques dans le dos et les compressions',
    summary: 'Avant 1 an, les gestes d’expulsion sont spécifiques : reconnaître une obstruction totale, alterner 5 claques dans le dos et 5 compressions sur le sternum, et appeler les secours.',
    tags: ['bébé s’étouffe', 'étouffement nourrisson', 'fausse route bébé', 'claques dans le dos', 'compressions thoraciques bébé', 'obstruction des voies aériennes'],
    sources: [S.crBebeEtouffe, S.ameliInhale],
    body_md: `## En bref
- **Bébé tousse, pleure ou fait du bruit en respirant** : l’obstruction est partielle, **laisse-le tousser** et surveille-le ; ne tape pas dans son dos, ne mets pas les doigts dans sa bouche.
- **Bébé ne tousse plus, ne crie plus, ne pleure plus et bleuit** : obstruction totale, **urgence absolue**.
- Fais appeler le **15** (ou le 112) et alterne **5 claques dans le dos** puis **5 compressions sur le sternum**, tête toujours plus basse que le corps.
- Arrête dès que l’objet sort ou que bébé respire ou pleure.
- Même si tout rentre dans l’ordre, un **avis médical** est nécessaire.

## Comprendre
L’Assurance Maladie rappelle que les fausses routes touchent surtout les moins de 3 ans. Quand l’objet ou l’aliment bloque **partiellement** les voies respiratoires, la toux est le meilleur moyen de l’expulser : toute manœuvre risquerait de le déplacer et d’aggraver la situation. Quand l’obstruction est **totale**, l’air ne passe plus : bébé ne peut plus tousser ni pleurer, son visage bleuit vite. Chez le tout-petit, les signes sont parfois moins visibles que chez l’adulte.

Les gestes chez le nourrisson diffèrent de ceux de l’enfant plus grand et de l’adulte : pas de compression sur le ventre, mais des claques dans le dos et des compressions sur la poitrine, tête basse. Ils sont décrits ci-dessous d’après la Croix-Rouge française ; rien ne remplace leur apprentissage sur mannequin.

## Au quotidien
**Obstruction totale : les gestes de la Croix-Rouge française**
1. **Fais appeler le 15 ou le 112**. Si tu es seul(e), mets le téléphone sur haut-parleur.
2. **Claques dans le dos** : couche bébé à plat ventre sur ton avant-bras, la tête plus basse que le corps, en maintenant sa mâchoire ouverte avec tes doigts. Donne **jusqu’à 5 claques** fermes avec le talon de l’autre main, entre les omoplates.
3. **Compressions thoraciques** si l’objet n’est pas sorti : retourne bébé sur le dos sur ton autre avant-bras, en soutenant sa nuque, tête toujours plus basse. Place **deux doigts sur la moitié inférieure du sternum** et appuie **jusqu’à 5 fois**, profondément et sans précipitation.
4. Si l’objet est visible dans la bouche, retire-le délicatement avec le petit doigt. Ne fouille jamais à l’aveugle.
5. **Répète** 5 claques puis 5 compressions jusqu’à ce que bébé respire, pleure ou expulse l’objet, en suivant les consignes du médecin régulateur.
6. S’il perd connaissance et ne respire plus, commence la réanimation (voir l’article sur le bébé inconscient et l’arrêt cardiaque).

**Après l’épisode**
- Prends bébé dans tes bras, rassure-le, et **demande un avis médical** au 15 même s’il va bien : une surveillance est nécessaire.
- L’Assurance Maladie précise qu’après une asphyxie, un passage à l’hôpital est indispensable, que l’objet ait été expulsé ou non, pour vérifier qu’il ne reste rien dans les voies respiratoires ; pendant le transport, le nourrisson reste en position assise.

**Prévenir**
- Propose des aliments adaptés à son âge et à sa capacité de mâcher ; coupe les aliments ronds.
- Reste près de lui pendant les repas, assis, au calme.
- Garde petits objets, piles, pièces et jouets des aînés hors de portée.

## Questions fréquentes
**Faut-il suspendre bébé par les pieds ?** Non. Cette pratique est déconseillée par l’Assurance Maladie. Utilise les gestes décrits ci-dessus.

**Il tousse fort et devient rouge : dois-je donner des claques ?** Non : tant qu’il tousse, il expulse lui-même. Reste près de lui, surveille, et appelle le 15 si la toux ne s’arrête pas ou si sa respiration reste gênée.

**L’objet est sorti et il sourit : est-ce fini ?** Demande un avis médical : selon l’Assurance Maladie, un objet peut être descendu dans les bronches, et l’hôpital vérifiera qu’il a bien été expulsé.

**Où apprendre ces gestes ?** Des initiations aux premiers secours de l’enfant et du nourrisson existent, notamment à la Croix-Rouge (voir l’article sur les formations).

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 112) dès que bébé ne peut plus tousser, pleurer ou respirer, ou qu’il bleuit ; continue les gestes pendant l’appel. Après tout épisode d’étouffement, même résolu, demande un avis médical. Consulte aussi en cas de toux, de gêne respiratoire ou de sifflement dans les jours qui suivent une fausse route.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'noyade-enfant-que-faire-en-attendant-les-secours',
    title: 'Noyade : les gestes à faire en attendant les secours',
    summary: 'Enfant retrouvé dans l’eau ou sorti en difficulté : alerter sans se mettre en danger, vérifier la conscience et la respiration, position latérale de sécurité ou réanimation, et pourquoi consulter même s’il va bien.',
    tags: ['noyade enfant', 'que faire noyade', 'piscine', 'baignade', 'réanimation', 'insufflations', 'hydrocution', 'premiers secours plage'],
    sources: [S.crNoyade, S.baignades, S.ameliNoyade],
    body_md: `## En bref
- **Ne prends pas de risque** : alerte le surveillant de baignade, tends un objet qui flotte, appelle à l’aide.
- Une fois l’enfant hors de l’eau : **conscient** → couvre-le, rassure-le et appelle les secours ; **inconscient qui respire** → position latérale de sécurité ; **ne respire pas** → réanimation.
- La Croix-Rouge décrit pour la noyade **5 insufflations au départ**, puis des cycles de **30 compressions et 2 insufflations**.
- Appelle le **15, le 18 ou le 112** dans tous les cas.
- Même s’il va bien ensuite, l’enfant doit être **examiné**, notamment pour les poumons.

## Comprendre
La noyade est une asphyxie : l’eau envahit les voies respiratoires. Selon l’Assurance Maladie, Santé publique France a recensé 1 418 noyades entre le 1er juin et le 30 septembre 2025, dont 409 mortelles ; les enfants de moins de 6 ans représentaient 27 % des victimes. La Croix-Rouge rappelle que la noyade reste la première cause de mortalité accidentelle chez les enfants.

Après un épisode dans l’eau, même bref, des complications pulmonaires peuvent apparaître : c’est pourquoi la Croix-Rouge recommande un examen médical même chez l’enfant conscient.

L’**hydrocution**, un choc thermique lors d’une entrée brutale dans une eau froide, peut aussi provoquer une perte de connaissance dans l’eau. Maux de tête, crampes ou angoisse sont des signaux pour regagner le bord.

## Au quotidien
**Les gestes de la Croix-Rouge française**
1. **Protège-toi et alerte** : ne te mets pas en danger. Préviens le surveillant ou le maître-nageur, tends un objet flottant, appelle à l’aide. Fais appeler le 15, le 18 ou le 112.
2. Une fois l’enfant sorti, **parle-lui**, pose-lui des questions : réagit-il ?
3. **Conscient et respire** : allonge-le confortablement, couvre-le, calme-le, appelle les secours.
4. **Inconscient mais respire** : bascule doucement sa tête en arrière et relève son menton, vérifie pendant 10 secondes qu’il respire, alerte, puis place-le en **position latérale de sécurité** et surveille sa respiration.
5. **Ne respire pas normalement** : fais appeler les secours et un défibrillateur, et commence la réanimation : 5 insufflations au départ, puis 30 compressions thoraciques et 2 insufflations, en continu. Chez le nourrisson, les compressions se font avec deux doigts (voir l’article dédié à l’arrêt cardiaque du bébé). Si tu n’es pas formé(e) ou ne peux pas insuffler, fais au moins les compressions, en suivant les consignes du médecin régulateur.
6. Continue jusqu’à la reprise d’une respiration normale ou l’arrivée des secours.

**Prévenir** (ministère chargé de la santé, Assurance Maladie, Croix-Rouge)
- Une surveillance constante : un adulte responsable de chaque enfant, comme le conseille l’Assurance Maladie, à portée de bras des plus petits ; baigne-toi avec eux.
- Brassards ou maillot à flotteurs adaptés à la taille de l’enfant ; les bouées et objets gonflables ne protègent pas de la noyade.
- Piscine privée : dispositif de sécurité conforme et toujours en place ; vigilance particulière avec les piscines hors-sol.
- Zones de baignade surveillées, entrée progressive dans l’eau, apprentissage précoce de la nage.
- Ne perds jamais de vue un enfant qui joue au bord de l’eau et ne le laisse jamais seul dans l’eau.

## Questions fréquentes
**Il a bu la tasse, a toussé, puis joue à nouveau : faut-il consulter ?** Après un épisode de difficulté dans l’eau, la Croix-Rouge recommande qu’il soit examiné. Appelle le 15 pour avis, surtout s’il tousse, respire vite, est fatigué ou vomit dans les heures qui suivent.

**Faut-il le mettre la tête en bas pour vider l’eau ?** Ce geste ne fait pas partie de la conduite à tenir décrite par la Croix-Rouge : suis les étapes ci-dessus et les consignes du 15.

**Je ne suis pas formé(e) : vaut-il mieux ne rien faire ?** Non. Alerte, et suis les consignes du médecin régulateur au téléphone : il te guidera.

**Mon enfant sait nager : puis-je relâcher la surveillance ?** Non : savoir nager ne supprime pas le risque. La surveillance par un adulte reste indispensable.

## Quand demander conseil
Appelle **immédiatement le 15**, le 18 ou le 112 pour toute noyade ou quasi-noyade, même si l’enfant semble récupérer. Rappelle le 15 sans attendre si, dans les heures qui suivent, il tousse, respire vite ou difficilement, vomit, est très fatigué, somnolent ou confus.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'enfant-inconscient-pls-ou-massage-cardiaque',
    title: 'Bébé ou enfant inconscient : position latérale de sécurité ou massage cardiaque ?',
    summary: 'Vérifier la conscience puis la respiration, mettre en position latérale de sécurité s’il respire, commencer la réanimation s’il ne respire pas : les repères selon l’âge, en attendant les secours.',
    tags: ['enfant inconscient', 'bébé inconscient', 'PLS', 'position latérale de sécurité', 'massage cardiaque bébé', 'arrêt cardiaque enfant', 'défibrillateur', 'réanimation'],
    sources: [S.crBebeConscience, S.crBebeArret, S.crInconscience],
    body_md: `## En bref
- **Vérifie la conscience** (il réagit à la voix, au toucher ?) puis **la respiration** pendant 10 secondes maximum, tête en position neutre (bébé) ou basculée en arrière (enfant), menton relevé.
- **Il respire** : **position latérale de sécurité** — dans tes bras pour un bébé, au sol pour un enfant — puis appel du **15** et surveillance.
- **Il ne respire pas** : fais appeler le **15** et apporter un **défibrillateur**, et commence la réanimation.
- Chez le bébé, la Croix-Rouge décrit **5 insufflations**, puis des cycles de **30 compressions à deux doigts** et **2 insufflations**.
- Ces gestes s’apprennent : une formation de quelques heures donne confiance.

## Comprendre
Quand un enfant perd connaissance, ses muscles se relâchent et sa langue peut basculer vers l’arrière de la gorge et bloquer le passage de l’air. La position latérale de sécurité (PLS) maintient les voies respiratoires dégagées et permet aux liquides de s’écouler par la bouche.

La Croix-Rouge française rappelle que les causes sont multiples (intoxication, chute ou choc à la tête, forte fièvre…) mais que la conduite à tenir est la même. Elle souligne aussi qu’un enfant inconscient est en urgence vitale : il peut s’étouffer ou faire un arrêt cardiaque. Chaque minute compte, et le pire est de ne rien faire.

Les repères ci-dessous résument les pages de la Croix-Rouge française. Ils ne remplacent pas une formation pratique.

## Au quotidien
**1. Vérifier la conscience**
- Parle-lui, fais du bruit, stimule-le doucement. Chez le bébé, la Croix-Rouge propose de claquer des doigts près des oreilles, chatouiller la plante des pieds et vérifier s’il serre ton doigt.

**2. Vérifier la respiration**
- Allonge-le sur le dos. Bébé : tête en position neutre, menton légèrement relevé. Enfant : une main sur le front pour basculer doucement la tête en arrière, deux doigts sous le menton pour le relever.
- Regarde si la poitrine se soulève, écoute, sens le souffle sur ta joue, **10 secondes au maximum**.

**3a. Il respire : la PLS**
- **Bébé** : prends-le dans tes bras, sur le côté, bouche ouverte et tête légèrement inclinée vers le bas, et garde-le ainsi jusqu’à l’arrivée des secours.
- **Enfant** : place-le sur le côté au sol, comme décrit par la Croix-Rouge (bras le plus proche à angle droit, l’autre main contre sa joue, jambe opposée relevée, puis fais-le rouler vers toi ; ouvre sa bouche sans bouger la tête). Après une chute ou un accident, appelle d’abord et suis les consignes, car bouger la tête peut être déconseillé.
- Appelle le 15, couvre-le, vérifie régulièrement sa respiration.

**3b. Il ne respire pas : la réanimation**
- Fais appeler le 15 (ou le 18, le 112) et apporter un défibrillateur ; si tu es seul(e) avec un bébé, la Croix-Rouge décrit les 5 insufflations avant l’appel.
- **Bébé** : 5 insufflations en englobant sa bouche et son nez, en soufflant lentement jusqu’à ce que la poitrine se soulève. Puis 30 compressions avec **deux doigts** juste au-dessus de la pointe basse du sternum, environ 4 cm de profondeur, à un rythme de 100 à 120 par minute, puis 2 insufflations. Continue sans interruption.
- **Enfant plus grand** : la technique de compression dépend de sa taille ; le médecin régulateur te guidera pas à pas par téléphone.
- Dès qu’un défibrillateur arrive, allume-le et suis ses instructions vocales : il complète le massage.

## Questions fréquentes
**J’ai peur de lui faire mal en massant : que faire ?** Face à un enfant qui ne respire pas, le risque est de ne rien faire. Le médecin du 15 te guide pas à pas.

**Un défibrillateur peut-il être utilisé sur un enfant ?** La Croix-Rouge présente le défibrillateur comme un complément du massage, y compris chez le bébé : l’appareil guide l’utilisateur par la voix.

**Il a fait un malaise et s’est réveillé tout de suite : faut-il consulter ?** Oui, une évaluation médicale est nécessaire ; la Croix-Rouge rappelle aussi qu’après une chute sur la tête, un bébé de moins de 12 mois doit être vu immédiatement par un médecin.

**Il convulse : que faire ?** Appelle le 15 et suis les consignes du médecin régulateur ; éloigne ce qui pourrait le blesser. Quand les mouvements ont cessé, s’il ne réagit pas mais respire, mets-le en PLS.

## Quand demander conseil
Appelle **immédiatement le 15** (ou le 18, le 112 ; le 114 par SMS pour les personnes sourdes ou malentendantes) dès qu’un bébé ou un enfant ne réagit plus, même s’il respire. Prépare les informations utiles : âge, circonstances, durée de l’inconscience, antécédents, médicaments ou produits possibles. Ne raccroche pas avant que le médecin régulateur te le dise.

${FIN}`,
  },
  {
    ...TOUS, min_age_months: 0, max_age_months: 120, safety_critical: true,
    slug: 'appeler-le-15-ou-le-112-que-dire-pour-son-enfant',
    title: 'Appeler le 15, le 18 ou le 112 pour son enfant : quel numéro et que dire ?',
    summary: 'Les numéros d’urgence, les informations à donner, pourquoi ne pas raccrocher le premier, et les autres recours quand ce n’est pas une urgence vitale.',
    tags: ['appeler le 15', 'samu', '112', '18 pompiers', '114 sms', 'numéro urgence enfant', 'message d’alerte', 'médecin de garde'],
    sources: [S.cr4Etapes, S.interieurGQS, S.ameliCoupure],
    body_md: `## En bref
- **15** : Samu, pour une urgence médicale. **18** : sapeurs-pompiers (accident, incendie). **112** : numéro d’urgence européen. **114** : par SMS, pour les personnes sourdes, malentendantes ou ayant des difficultés à parler.
- Ces numéros sont **gratuits**, joignables d’un fixe ou d’un mobile, **même bloqué ou sans crédit**.
- Donne ton **numéro**, l’**adresse précise** (étage, code), ce qui s’est passé, l’**état de l’enfant** et ce que tu as déjà fait.
- **Ne raccroche pas** avant qu’on te le demande : le médecin régulateur peut te guider.
- En cas de doute, appelle : c’est le rôle du 15 de t’orienter.

## Comprendre
Le Samu (15) est organisé autour d’un **médecin régulateur** qui évalue la situation au téléphone et décide de la réponse adaptée : conseil, orientation vers un médecin, envoi d’une équipe ou d’une ambulance. Les pompiers (18) interviennent pour les accidents, incendies et secours à personne. Le 112 fonctionne dans toute l’Union européenne et te met en relation avec les secours.

La Croix-Rouge française et le ministère de l’Intérieur décrivent une chaîne simple : **protéger** (vérifier qu’il n’y a pas de danger supplémentaire : circulation, feu, électricité), **apprécier l’état** de la victime (conscience, respiration), **alerter**, puis **secourir** en attendant les secours.

## Au quotidien
**Prépare-toi avant d’en avoir besoin**
- Enregistre 15, 18, 112 et le numéro du centre antipoison de ta région dans ton téléphone.
- Note ton adresse complète, le code d’entrée et l’étage près du téléphone fixe ou sur le réfrigérateur, pour la baby-sitter ou les grands-parents.
- Apprends aux enfants dès qu’ils en sont capables à composer le 15 ou le 112 et à dire leur adresse.

**Le message d’alerte** (Croix-Rouge française, ministère de l’Intérieur, Assurance Maladie)
1. Le numéro de téléphone d’où tu appelles.
2. Ton nom et celui de l’enfant.
3. L’adresse exacte : commune, rue, numéro, bâtiment, étage, code d’accès, repères.
4. Ce qui s’est passé : chute, brûlure, produit avalé, malaise…
5. Les risques éventuels : incendie, fumée, électricité.
6. Le nombre de victimes et l’état de chacune : âge, conscience, respiration, saignement.
7. Les gestes déjà faits.
8. Réponds calmement aux questions et **ne raccroche pas** avant que l’interlocuteur te le demande.

**Pendant l’attente**
- Mets le haut-parleur pour garder les mains libres.
- Si possible, envoie quelqu’un ouvrir la porte, allumer la lumière et guider les secours.
- Prépare le carnet de santé, la liste des médicaments, l’emballage d’un produit avalé.

## Questions fréquentes
**15, 18 ou 112 : et si je me trompe de numéro ?** L’essentiel est de donner l’alerte vite : le 112 fonctionne partout dans l’Union européenne, et le 15 reste le numéro de l’urgence médicale.

**Je ne suis pas sûr(e) que ce soit grave : ai-je le droit d’appeler le 15 ?** Oui. En cas de doute sur une urgence vitale, le 15 est fait pour t’orienter.

**Et si ce n’est pas une urgence vitale, le soir ou le week-end ?** Appelle ton médecin traitant ; en dehors de ses horaires, la permanence des soins de ta région peut t’orienter vers un médecin de garde.

**Mon enfant peut-il appeler lui-même ?** Oui : apprends-lui à composer le 15 ou le 112, à dire son nom, son adresse et ce qui se passe, et à ne pas raccrocher.

## Quand demander conseil
Appelle **le 15** (ou le 112) sans attendre si ton enfant ne réagit plus, respire mal, devient bleu, convulse, saigne abondamment, s’est gravement brûlé, a avalé un produit ou une pile bouton, a fait une chute importante ou un malaise. Appelle le **18** pour un incendie ou un accident, le **114** par SMS si tu ne peux pas parler. Pour les situations non vitales, contacte ton médecin traitant ou la permanence des soins.

${FIN}`,
  },
  {
    ...TOUS, journeys: ['pregnant', 'newborn', 'child'], safety_critical: false,
    slug: 'se-former-aux-gestes-qui-sauvent-quand-on-est-parent',
    title: 'Se former aux gestes qui sauvent quand on est parent : quelles formations ?',
    summary: 'Initiation aux gestes qui sauvent, premiers secours citoyen, initiation enfant et nourrisson : ce que chaque formation enseigne, sa durée et comment trouver une session près de chez toi.',
    tags: ['formation premiers secours', 'PSC', 'gestes qui sauvent', 'secourisme parent', 'premiers secours nourrisson', 'Croix-Rouge formation', 'futur parent'],
    sources: [S.crFormations, S.infoGouvAider, S.interieurGQS],
    body_md: `## En bref
- Les **gestes qui sauvent** s’apprennent en quelques heures, sur mannequin, avec un formateur.
- La Croix-Rouge française propose notamment : **Gestes qui sauvent (GQS)** en 2 heures, **Premiers secours citoyen (PSC)** en 8 heures, et une **initiation aux premiers secours enfant et nourrisson** de 4 h 30.
- Les formations sont aussi proposées par d’autres associations agréées ; la préfecture en tient la liste, rappelle info.gouv.fr.
- Une formation pendant la grossesse ou les premiers mois de bébé est un bon moment : tu y apprends aussi la prévention des accidents.
- Les gestes se révisent : un rappel régulier aide à les garder en mémoire.

## Comprendre
Les gestes d’urgence essentiels, selon info.gouv.fr, sont : **alerter les secours, masser, défibriller et traiter les hémorragies**. Le ministère de l’Intérieur y ajoute la protection, l’évaluation de la victime, la conduite à tenir face à un étouffement, à une personne inconsciente qui respire ou à un malaise.

Ces gestes ne s’apprennent pas vraiment en lisant : la pratique sur mannequin, avec les corrections d’un formateur, permet de trouver la bonne position, la bonne profondeur de compression ou le bon geste de claque dans le dos. Les gestes destinés aux nourrissons diffèrent de ceux des adultes et des grands enfants ; les initiations spécifiques à l’enfant et au nourrisson sont donc précieuses pour les parents, les grands-parents et toute personne qui garde de jeunes enfants.

## Au quotidien
**Les formations grand public de la Croix-Rouge française**
- **Gestes qui sauvent (GQS)**, 2 heures : arrêt cardiaque, perte de connaissance, hémorragie, alerte et protection. Pour découvrir les premiers secours.
- **Premiers secours citoyen (PSC)**, 8 heures : l’ensemble des gestes de premiers secours (arrêt cardiaque, perte de connaissance, étouffement, hémorragie, malaises, traumatismes), avec théorie et pratique sur mannequin.
- **Initiation aux premiers secours enfant et nourrisson**, 4 h 30 : sensibilisation aux accidents de la vie courante et gestes adaptés aux enfants et aux bébés.

Les tarifs et les sessions varient selon les lieux ; renseigne-toi auprès des délégations locales ou des autres associations agréées.

**Pour en tirer le meilleur**
- Viens à deux si possible : les deux parents, ou un parent et un grand-parent.
- Pose tes questions sur les situations qui t’inquiètent : fausse route au repas, chute de la table à langer, piscine.
- Après la formation, affiche les numéros d’urgence à la maison et fais le point sur la sécurité de chaque pièce.
- Repère où se trouvent les défibrillateurs près de chez toi, de la crèche ou de l’école.
- Prévois une session de rappel de temps en temps.

**Adapter aux enfants** : la Croix-Rouge précise que la formation GQS est accessible dès 10 ans. Apprendre à son enfant à alerter et à donner son adresse est déjà un premier geste qui sauve.

## Questions fréquentes
**Je suis enceinte : puis-je suivre une formation ?** Parles-en à l’organisme de formation et à ta sage-femme ou médecin : la pratique sur mannequin peut être adaptée à ta situation.

**Une vidéo en ligne suffit-elle ?** Une vidéo aide à réviser, mais ne remplace pas la pratique encadrée, qui corrige les gestes.

**Les formations sont-elles reconnues ?** La Croix-Rouge indique que les formations GQS et PSC sont reconnues par l’État.

**Je n’ai pas le temps pour une journée entière : que choisir ?** Une initiation courte vaut mieux que rien : 2 heures suffisent pour apprendre l’alerte, la position latérale de sécurité, le massage cardiaque et l’arrêt d’une hémorragie.

## Quand demander conseil
Pour trouver une session, contacte ta préfecture, une association agréée de sécurité civile, la Croix-Rouge française ou ta mairie ; la maternité, la PMI ou ta sage-femme peuvent aussi t’orienter. Et dans l’urgence, souviens-toi : appelle le **15** (ou le 112), le médecin régulateur te guide au téléphone.

${FIN}`,
  },
];
