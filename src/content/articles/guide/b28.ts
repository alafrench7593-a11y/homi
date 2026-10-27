/** Guide complet — lot 28 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  srSiege: { label: 'Sécurité routière — Les bons gestes de sécurité routière, dès le plus jeune âge (dépliant siège auto)', url: 'https://www.securite-routiere.gouv.fr/sites/default/files/2026-05/sr_siege_auto_depliant_2025_bd_1.pdf', consulted_on: C, published: '2025-12' },
  santeDeshyd: { label: 'Santé.fr — Déshydratation de bébé : comment l’éviter', url: 'https://www.sante.fr/deshydratation-de-bebe-comment-leviter', consulted_on: C, published: '2025-12-08' },
  santeChaleurEnfants: { label: 'Santé.fr — Comment protéger votre santé et celle de vos enfants en cas de fortes chaleurs ?', url: 'https://www.sante.fr/comment-proteger-votre-sante-et-celle-de-vos-enfants-en-cas-de-fortes-chaleurs', consulted_on: C, published: '2025-07-17' },
  ameliCaniculeRisque: { label: 'ameli.fr — Canicule : la protection spécifique des personnes à risque', url: 'https://www.ameli.fr/assure/sante/themes/canicule-chaleur/canicule-chaleur/protection-specifique-personnes-risque', consulted_on: C, published: '2026-06-10' },
  ameliMaladiesCanicule: { label: 'ameli.fr — Chaleur mal supportée : éruption cutanée, crampes, malaise, insolation, coup de chaleur', url: 'https://www.ameli.fr/assure/sante/themes/canicule-chaleur/maladies-liees-canicule', consulted_on: C },
  santeCoupChaleur: { label: 'Santé.fr — Tout savoir sur le coup de chaleur', url: 'https://www.sante.fr/tout-savoir-sur-le-coup-de-chaleur', consulted_on: C, published: '2026-08-12' },
  ameliFroid: { label: 'ameli.fr — Bien se protéger du froid', url: 'https://www.ameli.fr/assure/sante/themes/froid-pathologies-sante/savoir-proteger-froid', consulted_on: C, published: '2019-11-14' },
  santeFroidEnfant: { label: 'Santé.fr — Quels réflexes prendre pour protéger son enfant du grand froid ?', url: 'https://www.sante.fr/quels-reflexes-prendre-pour-proteger-son-enfant-du-grand-froid', consulted_on: C, published: '2025-07-23' },
  ameliMdt: { label: 'ameli.fr — Mal des transports : symptômes et causes', url: 'https://www.ameli.fr/assure/sante/themes/mal-transports/symptomes-causes', consulted_on: C, published: '2025-01-10' },
  mpediaMdt: { label: 'mpedia.fr (AFPA) — Mal des transports chez l’enfant : symptômes et solutions', url: 'https://www.mpedia.fr/art-mal-des-transports/', consulted_on: C, published: '2025-07-04' },
  santeCinetose: { label: 'Santé.fr — Mal des transports (cinétose)', url: 'https://www.sante.fr/mal-des-transports-cinetose', consulted_on: C, published: '2026-08-12' },
  mpediaAltitude: { label: 'mpedia.fr (AFPA) — Quelles précautions prendre pour amener bébé en altitude', url: 'https://www.mpedia.fr/art-bebe-altitude/', consulted_on: C, published: '2015-01-10' },
  douaneAvion: { label: 'Douane française — Ce qui est autorisé ou interdit en avion', url: 'https://www.douane.gouv.fr/en/what-allowedprohibited-air', consulted_on: C },
  ecologieAvion: { label: 'Ministère de la Transition écologique (DGAC) — Conseils pratiques avant de prendre l’avion', url: 'https://www.ecologie.gouv.fr/en/public-policies/practical-tips-you-fly', consulted_on: C, published: '2023-07-11' },
  pasteurVoyage: { label: 'Institut Pasteur — Recommandations générales avant votre voyage', url: 'https://www.pasteur.fr/fr/centre-medical/vaccination/recommandations-generales', consulted_on: C, published: '2026-08-19' },
  ameliTrousse: { label: 'ameli.fr — Comment préparer sa trousse de médicaments pour partir en voyage ?', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/preparer-trousse-medicaments-voyage', consulted_on: C, published: '2025-07-21' },
  ameliVacEtranger: { label: 'ameli.fr — Vacances à l’étranger : votre prise en charge', url: 'https://www.ameli.fr/assure/droits-demarches/europe-international/protection-sociale-etranger/vacances-etranger', consulted_on: C, published: '2026-04-30' },
  ameliCeam: { label: 'ameli.fr — Commander une carte européenne d’assurance maladie (CEAM)', url: 'https://www.ameli.fr/assure/adresses-et-contacts/votre-carte-vitale-appli-carte-vitale-carte-europeenne-d-assurance-maladie-ceam/commander-une-carte-europeenne-d-assurance-maladie-ceam', consulted_on: C },
  spAst: { label: 'Service-Public.gouv.fr — Autorisation de sortie du territoire (AST)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1359', consulted_on: C, published: '2026-03-20' },
  spMineur: { label: 'Service-Public.gouv.fr — Avec quels documents un mineur français peut-il voyager à l’étranger ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1922', consulted_on: C, published: '2023-08-08' },
  douaneAst: { label: 'Douane française — Autorisation de sortie du territoire (AST) pour les mineurs', url: 'https://www.douane.gouv.fr/fiche/autorisation-de-sortie-du-territoire-ast-pour-les-mineurs', consulted_on: C, published: '2026-08-03' },
  diploFormalites: { label: 'France Diplomatie — Les formalités de passage des frontières', url: 'https://www.diplomatie.gouv.fr/fr/informations-pratiques/preparer-son-depart/les-formalites-de-passage-des-frontieres', consulted_on: C, published: '2026-06-05' },
  diploMineur: { label: 'France Diplomatie — Autoriser la circulation à l’étranger d’un enfant mineur', url: 'https://www.diplomatie.gouv.fr/fr/services-aux-francaises-et-aux-francais/formalites-avant-le-depart/autoriser-la-circulation-a-l-etranger-d-un-enfant-mineur', consulted_on: C, published: '2026-08-03' },
  ameliVaccVoyage: { label: 'ameli.fr — Vaccination : conseils avant un voyage', url: 'https://www.ameli.fr/assure/sante/themes/vaccination/vaccination-voyage', consulted_on: C },
  mpediaVaccVoyage: { label: 'mpedia.fr (AFPA) — Les vaccins obligatoires et recommandés pour l’enfant voyageur', url: 'https://www.mpedia.fr/art-les-vaccins-pour-enfant-voyageur/', consulted_on: C, published: '2021-11-17' },
  ameliPrevSpec: { label: 'ameli.fr — Prévention spécifique : paludisme, fièvre jaune, encéphalite japonaise, dengue', url: 'https://www.ameli.fr/assure/sante/themes/piqure-moustique-maladies/prevention-specifique', consulted_on: C },
  mpediaPalu: { label: 'mpedia.fr (AFPA) — Le paludisme', url: 'https://www.mpedia.fr/art-paludisme/', consulted_on: C, published: '2020-10-19' },
  arsOccitanie: { label: 'ARS Occitanie — Voyageurs : les bons gestes avant le départ et au retour', url: 'https://www.occitanie.ars.sante.fr/voyageurs-les-bons-gestes-avant-le-depart-et-au-retour', consulted_on: C, published: '2026-04-30' },
  ameliGastroPrev: { label: 'ameli.fr — Prévenir la gastro-entérite chez l’enfant et la vaccination des nourrissons', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-enfant/prevention', consulted_on: C, published: '2026-05-29' },
  ameliJetLag: { label: 'ameli.fr — Que faire pour limiter les effets du décalage horaire ou « jet lag » ?', url: 'https://www.ameli.fr/assure/sante/themes/decalage-horaire-et-sante-jet-lag/jet-lag-decalage-horaire-que-faire', consulted_on: C, published: '2025-02-13' },
  ameliSoleil: { label: 'ameli.fr — Dangers du soleil : comment s’en protéger ?', url: 'https://www.ameli.fr/assure/sante/themes/coup-soleil/prevention', consulted_on: C, published: '2026-03-10' },
  santeSoleilEnfant: { label: 'Santé.fr — Comment protéger son enfant du soleil ?', url: 'https://www.sante.fr/comment-proteger-son-enfant-du-soleil', consulted_on: C, published: '2023-07-06' },
  santeUv: { label: 'Santé.fr — Les rayons UV : quels effets sur la santé et celle de vos enfants ?', url: 'https://www.sante.fr/les-rayons-uv-quels-effets-sur-la-sante-et-celle-de-vos-enfants', consulted_on: C, published: '2025-07-09' },
  santeProduitSolaire: { label: 'Santé.fr — Comment choisir et utiliser un produit de protection solaire ?', url: 'https://www.sante.fr/comment-choisir-et-utiliser-un-produit-de-protection-solaire', consulted_on: C, published: '2025-07-09' },
  sportsBaignade: { label: 'Ministère des Sports — Se baigner en toute sécurité : prévention des noyades', url: 'https://www.sports.gouv.fr/se-baigner-en-toute-securite-prevention-des-noyades-602', consulted_on: C },
  sportsPiscine: { label: 'Ministère des Sports — Piscine privée et jeunes enfants : les règles de sécurité pour prévenir les noyades', url: 'https://www.sports.gouv.fr/piscine-privee-et-jeunes-enfants-les-regles-de-securite-pour-prevenir-les-noyades-10176', consulted_on: C, published: '2026-05-29' },
  arsBaignade: { label: 'ARS Grand Est — Baignade en milieu naturel : qualité de l’eau et conseils', url: 'https://www.grand-est.ars.sante.fr/baignade-en-milieu-naturel', consulted_on: C, published: '2026-06-18' },
  spfFenetres: { label: 'Santé publique France — Campagne de prévention des chutes d’enfants par les fenêtres', url: 'https://www.santepubliquefrance.fr/en/les-actualites/sante-publique-france-relaunching-its-campaign-prevent-children-falling-out-windows', consulted_on: C, published: '2017-05-04' },
  ameliCoucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe et vous aide à préparer vos voyages ; il ne remplace pas l’avis du médecin, du pharmacien, de la sage-femme ou de la puéricultrice qui suivent votre enfant._';
const BASE = { status: 'to_review' as const };
const BB = ['newborn'] as LibArticle['journeys'];
const TOUS = ['newborn', 'child'] as LibArticle['journeys'];
const ENF = ['child'] as LibArticle['journeys'];

export const GUIDE_B28: LibArticle[] = [
  // ------------------------------------------------------------------ voiture
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique',
    slug: 'long-trajet-en-voiture-avec-bebe-ou-enfant-organiser',
    title: 'Long trajet en voiture avec bébé ou enfant : préparer, attacher, faire des pauses',
    summary: 'Départ en vacances par la route : comment installer votre enfant en sécurité, organiser les pauses et garder tout le monde au frais et hydraté pendant le trajet.',
    tags: ['voyage en voiture', 'long trajet', 'vacances', 'siège auto', 'pauses', 'route des vacances', 'bébé voiture', 'départ en vacances'],
    sources: [S.srSiege, S.santeDeshyd, S.ameliCoucher],
    body_md: `## En bref
- Le siège auto est **obligatoire jusqu’à 10 ans**, homologué et adapté à la taille de l’enfant, et l’enfant doit être attaché **quelle que soit la distance**, rappelle la Sécurité routière.
- Un enfant de moins de 10 ans voyage **à l’arrière**, sauf exceptions prévues (bébé dos à la route avec **airbag désactivé**, par exemple).
- **Retirez le manteau** avant d’attacher l’enfant : le harnais doit rester bien ajusté.
- Prévoyez des **pauses régulières** pour faire boire l’enfant : il a plus chaud dans son siège, où l’air circule mal.
- Ne laissez **jamais** un enfant seul dans la voiture, même quelques minutes.

## Comprendre
Un long trajet, c’est plusieurs heures assis, attaché, avec peu de mouvement et parfois de la chaleur. Pour un tout-petit, c’est fatigant ; pour les parents, c’est souvent un moment de stress. Bien préparer le voyage permet de rouler plus sereinement.

La sécurité passe d’abord par le **dispositif de retenue**. Selon le dépliant de la Sécurité routière (norme R129), l’enfant voyage **dos à la route** jusqu’à environ 83 cm et 15 mois, et il est recommandé de le garder dos à la route **le plus longtemps possible**. Viennent ensuite le siège baquet avec harnais ou à bouclier, puis, au-delà d’environ 1 m, le **rehausseur avec dossier**. Les tailles varient selon les fabricants : la notice du siège fait foi. En cas de choc à 50 km/h, un enfant non attaché subit l’équivalent d’une chute du quatrième étage.

Le confort thermique compte aussi. Santé.fr rappelle que l’enfant souffre davantage de la chaleur dans son siège auto, sans circulation d’air : d’où l’intérêt des **pare-soleil**, d’une climatisation **pas trop froide** et de **pauses pour l’hydrater**.

## Au quotidien
**La veille du départ**
- Vérifiez que le siège est bien installé (Isofix ou ceinture, selon la notice) et réglé à la taille actuelle de l’enfant.
- Préparez un sac accessible : eau, gobelet ou biberon, collation légère, change complet, couches, lingettes, mouchoirs, sac pour le linge sale, doudou.
- Gardez les documents utiles (carnet de santé, ordonnances, carte Vitale) à portée de main.

**Au moment de partir**
- Habillez l’enfant de vêtements légers et confortables ; posez le manteau ou une couverture **par-dessus** le harnais une fois attaché, si besoin.
- Rangez les objets lourds dans le coffre : en cas de freinage, tout objet libre dans l’habitacle peut être projeté.
- Si vous le pouvez, roulez aux heures plus fraîches de la journée et utilisez des pare-soleil.

**Pendant la route**
- Faites des **pauses régulières** : boire, changer, se dégourdir les jambes. Pour un bébé, c’est aussi l’occasion de le sortir du siège et de le changer de position.
- Proposez de l’eau régulièrement ; un bébé allaité peut être mis au sein plus souvent, le lait maternel étant riche en eau.
- Pour allaiter ou donner un biberon, **arrêtez-vous** : on ne détache jamais un enfant pendant que la voiture roule.
- Occupez les plus grands avec des chansons, des jeux de devinettes ou d’observation (couleurs des voitures, animaux), plutôt qu’avec un écran s’ils sont sensibles au mal des transports.

## Questions fréquentes
**Pour un petit trajet, puis-je le prendre sur mes genoux ?** Non. La Sécurité routière insiste : l’enfant est attaché dans un siège adapté quelle que soit la distance. Dans vos bras, vous ne pourriez pas le retenir en cas de choc.

**Peut-il dormir longtemps dans son siège ?** Le siège auto est fait pour les déplacements. L’Assurance Maladie rappelle que la coque ne remplace pas un lit, car la tête peut basculer vers l’avant. À l’arrivée ou pendant les pauses longues, installez-le dans un vrai couchage.

**Le siège d’occasion du cousin convient-il ?** Soyez prudent avec un siège dont vous ignorez l’histoire (choc, pièces manquantes, notice perdue). Vérifiez l’étiquette d’homologation (le « E » dans un cercle) et l’adéquation à la taille de votre enfant.

**Faut-il partir de nuit ?** Pour les enfants très sujets au mal des transports, cela peut aider, car l’enfant dort (voir l’article sur le mal des transports). Mais le conducteur doit être reposé : la fatigue au volant reste un danger majeur.

## Quand demander conseil
Demandez conseil au pédiatre ou au médecin avant un long trajet si votre bébé est très jeune, prématuré ou malade. Pendant le voyage, consultez si l’enfant refuse de boire, vomit à répétition ou semble très abattu. En cas d’urgence (malaise, difficultés à respirer, enfant qui ne réagit plus), arrêtez-vous en sécurité et appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'securite', safety_critical: true,
    slug: 'enfant-seul-dans-la-voiture-chaleur-danger-reflexes',
    title: 'Enfant seul dans une voiture : pourquoi c’est dangereux, même cinq minutes',
    summary: 'Chaleur, déshydratation, coup de chaleur : pourquoi ne jamais laisser un enfant seul dans un véhicule, des astuces pour ne pas l’oublier et que faire si vous voyez un enfant enfermé.',
    tags: ['enfant oublié voiture', 'voiture chaleur', 'coup de chaleur', 'bébé voiture été', 'enfant enfermé voiture', 'canicule voiture'],
    sources: [S.ameliCaniculeRisque, S.santeChaleurEnfants, S.santeCoupChaleur],
    body_md: `## En bref
- Ne laissez **jamais** un enfant seul dans un véhicule stationné, **même brièvement et même fenêtres ouvertes**, rappelle l’Assurance Maladie.
- Un nourrisson peut se **déshydrater en quelques heures** ; dans une voiture fermée au soleil, la chaleur monte vite.
- Si vous voyez un enfant seul dans une voiture, appelez **immédiatement le 15 ou le 112**.
- En attendant les secours, si c’est possible, sortez-le et rafraîchissez-le.
- Des petites routines (sac ou téléphone posé à l’arrière) aident à ne jamais oublier un enfant endormi.

## Comprendre
Une voiture garée au soleil devient rapidement une fournaise : l’air ne circule plus, le soleil chauffe l’habitacle à travers les vitres, et entrouvrir une fenêtre ne suffit pas. Les jeunes enfants régulent mal leur température et ne peuvent pas sortir seuls ni appeler à l’aide. L’Assurance Maladie souligne que laisser un enfant dans un véhicule, même peu de temps, augmente le risque de **déshydratation** et de **coup de chaleur**.

Le coup de chaleur est une **urgence médicale**. Selon Santé.fr, il peut se manifester par une peau rouge, une sensation de chaleur intense, des troubles du comportement (de la somnolence à l’agitation), une fatigue et une soif intenses, des nausées ou des vomissements ; il peut aller jusqu’au coma. Chez le nourrisson, la déshydratation peut se traduire par une baisse de tonus, un teint grisâtre, des yeux cernés, une peau et une langue sèches.

Ces drames ne concernent pas que des parents « négligents » : la fatigue, un changement d’habitude (ce n’est pas vous qui déposez d’habitude l’enfant à la crèche), un enfant qui s’endort sans bruit… Tout le monde peut être concerné, d’où l’intérêt de routines simples.

## Au quotidien
**Ne jamais le laisser, même « juste le temps de »**
- Payer l’essence, acheter le pain, poster une lettre : prenez l’enfant avec vous, même endormi.
- Ne laissez pas non plus les clés à sa portée : un enfant peut s’enfermer en jouant.
- Garez-vous si possible à l’ombre et utilisez des pare-soleil ; à l’arrivée, l’habitacle sera moins chaud.

**Des astuces contre l’oubli**
- Posez à l’arrière, près de l’enfant, un objet dont vous aurez forcément besoin : sac, téléphone, badge de travail.
- Prenez l’habitude de **regarder la banquette arrière** à chaque fois que vous sortez de la voiture.
- Convenez avec la crèche ou l’assistante maternelle qu’elle vous appelle si l’enfant n’est pas arrivé à l’heure prévue.
- Quand la routine change (autre parent qui conduit, autre trajet), dites-le à voix haute : « Aujourd’hui, c’est moi qui dépose Léa. »

**Pendant les trajets d’été**
- Emportez **suffisamment d’eau** pour tout le trajet, comme le conseillent Santé.fr et l’Assurance Maladie.
- Faites des pauses pour faire boire l’enfant.

## Questions fréquentes
**La climatisation tourne, je reste à côté de la voiture : est-ce acceptable ?** Le conseil officiel est clair : ne jamais laisser un enfant seul dans un véhicule. Une panne, une portière qui se verrouille ou un imprévu peuvent vous éloigner plus longtemps que prévu.

**Et en hiver, il n’y a pas de risque ?** Le risque de chaleur est moindre, mais d’autres dangers persistent (froid, enfant qui manipule des commandes, frein, fenêtres électriques). La règle reste la même.

**Je vois un enfant seul dans une voiture au soleil. Ai-je le droit d’agir ?** L’Assurance Maladie demande d’appeler **immédiatement le 15 ou le 112**, puis, si possible, de faire sortir l’enfant et de le rafraîchir en attendant les secours, qui vous guideront.

**Comment le rafraîchir si l’enfant a eu très chaud ?** Installez-le à l’ombre et au calme, déshabillez-le, rafraîchissez-le avec de l’eau ou des linges humides et créez un courant d’air, tout en appelant les secours.

## Quand demander conseil
Appelez le **15** ou le **112** sans attendre si un enfant a été enfermé dans une voiture chaude, s’il est somnolent, difficile à réveiller, très rouge ou au contraire grisâtre, s’il vomit, convulse ou respire mal. S’il semble aller bien après une forte chaleur, faites-le tout de même examiner rapidement par un médecin, surtout s’il s’agit d’un nourrisson. Si vous vous sentez épuisé(e) au point de craindre un oubli, parlez-en : à votre médecin, à la PMI ou, en cas de détresse, au **3114**.

${FIN}`,
  },
  {
    ...BASE, journeys: ENF, category: 'sante-enfant', min_age_months: 12, max_age_months: 144,
    slug: 'mal-des-transports-enfant-prevenir-et-soulager',
    title: 'Mal des transports chez l’enfant : le prévenir et le soulager en voiture, bateau ou car',
    summary: 'Pâleur, bâillements, nausées puis vomissements : comprendre le mal des transports de l’enfant, l’installer au mieux, organiser le trajet et savoir quand consulter.',
    tags: ['mal des transports', 'cinétose', 'enfant vomit en voiture', 'nausées voiture', 'mal de mer', 'mal au cœur en voiture', 'car', 'bateau'],
    sources: [S.ameliMdt, S.mpediaMdt, S.santeCinetose],
    body_md: `## En bref
- Le mal des transports est **courant entre 2 et 12 ans** et **rare chez le nourrisson**, selon l’Assurance Maladie.
- Il vient d’un **conflit d’informations** : l’oreille interne sent le mouvement, les yeux voient un habitacle immobile.
- Les premiers signes (pâleur, salivation, bâillements, agitation) doivent faire **marquer une pause** avant les vomissements.
- Une collation légère avant le départ, le regard vers l’horizon, pas d’écran ni de lecture, de l’air frais : ces gestes aident.
- Aucun médicament ne doit être donné à un enfant sans l’avis d’un médecin ou d’un pharmacien.

## Comprendre
Pour tenir debout et s’orienter, le cerveau croise ce que voient les yeux, ce que ressent l’oreille interne (l’organe de l’équilibre) et les sensations du corps. En voiture, l’enfant assis regarde souvent l’intérieur de l’habitacle, immobile, alors que son oreille interne enregistre virages, freinages et accélérations. Ces messages contradictoires provoquent un malaise, explique l’Assurance Maladie.

Les signes sont souvent progressifs : gêne dans le haut du ventre, nausées, pâleur, sueurs froides, salivation abondante, puis vomissements. Chez le jeune enfant, on peut voir des pleurs, de l’agitation, des **bâillements** ou un refus de manger. D’après mpedia (Association française de pédiatrie ambulatoire), certains enfants deviennent somnolents. Les symptômes disparaissent en général quelques minutes après l’arrêt.

Les routes sinueuses, la mer agitée et les turbulences favorisent le malaise ; le **bateau** est le transport le plus souvent en cause. L’anxiété compte aussi : un enfant qui a déjà vomi peut se sentir mal avant même le départ. Bonne nouvelle : le mal des transports diminue généralement en grandissant.

## Au quotidien
**Avant de partir**
- Proposez un **repas léger**, sans partir le ventre vide : par exemple un yaourt, une compote ou quelques biscuits salés.
- Préparez les bagages à l’avance pour éviter la précipitation : un départ détendu aide.
- Gardez à portée de main : sacs, lingettes, vêtements de rechange, eau.

**Bien l’installer**
- Dans son siège auto (obligatoire jusqu’à 10 ans), placez-le de préférence **au centre de la banquette arrière**, avec une vue dégagée vers l’avant et l’horizon.
- Dans le train ou le car, choisissez une place **dans le sens de la marche**, près d’une fenêtre ; en bateau, restez **à l’extérieur** plutôt qu’en cabine.

**Pendant le trajet**
- Encouragez-le à regarder **loin devant**, à garder la tête droite et à éviter les mouvements brusques.
- Évitez **lecture, écrans et coloriage**, qui fixent le regard sur un point immobile.
- **Aérez** régulièrement l’habitacle.
- Aux premiers signes (pâleur, bâillements, salivation, pleurs), **arrêtez-vous** dès que possible, faites-le sortir prendre l’air et marcher un peu quand il se sent mieux.
- Les jeux de voix (chansons, devinettes, « je vois une voiture rouge ») occupent sans fixer le regard.

**Et les traitements ?**
mpedia indique qu’aucun médicament n’a démontré une réelle efficacité chez l’enfant en prévention systématique ; une prescription s’évalue au cas par cas, et les patchs sont réservés à l’adulte. Santé.fr précise que l’efficacité des bracelets n’a jamais été prouvée. Parlez-en au médecin ou au pharmacien avant tout produit.

## Questions fréquentes
**Mon bébé de 8 mois vomit en voiture : est-ce le mal des transports ?** Il est rare à cet âge. Des vomissements chez un bébé peuvent avoir d’autres causes (reflux, infection, repas récent) : parlez-en au médecin, surtout s’ils se répètent.

**Rouler de nuit, ça aide ?** Pour un enfant très sensible, mpedia mentionne que partir de nuit peut aider, car l’enfant dort. À condition que le conducteur soit reposé.

**Il vomit et ne garde plus rien : que surveiller ?** Santé.fr rappelle que les jeunes enfants qui vomissent doivent être surveillés de près, car ils peuvent se **déshydrater** s’ils ne gardent pas les liquides. Proposez de petites gorgées d’eau souvent, et demandez conseil si cela persiste.

**Le gingembre peut-il l’aider ?** mpedia le cite parmi les remèdes parfois utilisés, avec une efficacité variable et sans preuve solide. Demandez l’avis du pharmacien.

## Quand demander conseil
Consultez si les nausées et vomissements **persistent plusieurs heures** après la fin du trajet, s’ils surviennent **à chaque déplacement** au point d’empêcher les trajets nécessaires, ou si l’enfant a aussi des vertiges en dehors des transports : le médecin vérifiera l’oreille interne. Appelez le **15** si l’enfant est très abattu, ne garde rien depuis plusieurs heures ou présente des signes de déshydratation (bouche sèche, yeux cernés, somnolence inhabituelle).

${FIN}`,
  },
  // ------------------------------------------------------------------ avion et trousse
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique', max_age_months: 72,
    slug: 'prendre-l-avion-avec-bebe-oreilles-bagage-cabine',
    title: 'Prendre l’avion avec un bébé ou un jeune enfant : oreilles, bagage cabine et confort',
    summary: 'Douleurs d’oreille au décollage et à l’atterrissage, liquides en cabine, repas de bébé, rhume avant le départ : les points à préparer pour un vol plus serein.',
    tags: ['avion bébé', 'oreilles avion', 'décollage', 'atterrissage', 'bagage cabine', 'liquides avion', 'petits pots avion', 'voyage en avion enfant'],
    sources: [S.mpediaAltitude, S.douaneAvion, S.ecologieAvion],
    body_md: `## En bref
- La cabine d’un avion est **pressurisée** à un niveau proche de celui d’une altitude d’environ **2 000 m**, rappelle mpedia (AFPA).
- Les **variations rapides d’altitude** (montée et surtout descente) peuvent provoquer des **douleurs d’oreille**, favorisées par un rhume ou une otite.
- Faire **téter ou boire** l’enfant pendant ces phases l’aide à déglutir et à équilibrer la pression.
- En cabine, les liquides sont limités à des flacons de **100 ml** dans un sac transparent ; les **aliments pour bébé** figurent parmi les objets généralement autorisés, selon la Douane. Vérifiez les règles de votre compagnie.
- Avant de partir avec un bébé enrhumé ou qui a une otite, **demandez l’avis du médecin**.

## Comprendre
Derrière le tympan se trouve une petite cavité remplie d’air, reliée au fond de la gorge par un fin canal (la trompe d’Eustache). Quand la pression change vite, comme lors de la descente d’un avion, d’un téléphérique ou d’une route de col, cet air doit se rééquilibrer. Les adultes déglutissent ou bâillent spontanément ; les tout-petits y arrivent moins bien. mpedia décrit ce « barotraumatisme » : des douleurs d’oreille, qui peuvent être favorisées par une **rhinopharyngite** en cours ou à répétition, des otites antérieures ou une otite séro-muqueuse.

La déglutition ouvre la trompe d’Eustache : c’est pourquoi l’on conseille de faire **téter ou boire** l’enfant (sein, biberon, gobelet ou gourde selon l’âge) pendant les changements d’altitude.

Côté bagages, la Douane rappelle la règle générale des **liquides en cabine** : flacons de moins de 100 ml, dans un sac plastique transparent d’un litre maximum. Les aliments pour bébé font partie des objets généralement autorisés, et les **médicaments** aussi, idéalement avec une ordonnance. Le ministère chargé des transports précise que chaque compagnie peut appliquer des règles plus strictes : vérifiez son site avant le départ, et gardez une **ordonnance** si un médicament liquide est nécessaire pendant le vol.

## Au quotidien
**Avant le vol**
- Si bébé est enrhumé, a de la fièvre ou une otite récente, consultez avant le départ : le médecin dira si le voyage est raisonnable et comment soulager.
- Renseignez-vous auprès de la compagnie : poussette (en cabine ou en soute), siège auto, nacelle, place réservée pour les enfants, nourriture.
- Préparez un sac cabine pratique : couches et change, vêtements de rechange (pour l’enfant et pour vous), doudou, petits jouets silencieux, collations, gourde ou biberon, mouchoirs, carnet de santé, médicaments habituels avec leur ordonnance.

**Pendant le vol**
- Proposez le sein, le biberon ou de l’eau **au décollage et surtout pendant la descente**, qui commence souvent bien avant l’atterrissage.
- Pour un enfant plus grand, faire boire à la paille, mâcher, bâiller exprès ou rire avec lui aide aussi.
- Habillez-le en couches faciles à enlever : la température varie entre l’aéroport, la cabine et la destination.
- Bougez avec lui quand la consigne lumineuse le permet : un petit tour dans l’allée apaise souvent.

**À l’arrivée**
- Si l’enfant pleure en se tenant l’oreille, proposez-lui encore à boire. Si la douleur persiste après l’atterrissage, faites-le examiner.

## Questions fréquentes
**À partir de quel âge un bébé peut-il prendre l’avion ?** mpedia évoque des voyages possibles dès 2 mois. Pour un nouveau-né, un prématuré ou un bébé ayant une maladie, demandez l’avis du pédiatre ; les compagnies ont aussi leurs propres conditions.

**Faut-il le réveiller pour le faire boire à la descente ?** S’il dort paisiblement, vous pouvez le laisser dormir. S’il se réveille en pleurant, proposez-lui alors le sein, le biberon ou à boire.

**Puis-je emporter du lait infantile préparé ?** La page de la Douane consultée ne mentionne pas explicitement le lait infantile. Renseignez-vous auprès de la compagnie et de l’aéroport avant le départ, et prévoyez de quoi préparer les biberons sur place.

**Mon enfant a une otite : faut-il annuler ?** Seul le médecin peut le dire après l’avoir examiné. Une otite favorise les douleurs liées à la pression.

## Quand demander conseil
Consultez avant de partir si votre enfant est enrhumé, fiévreux ou a eu une otite récente, ou s’il s’agit d’un très jeune bébé. Après le vol, consultez si la douleur d’oreille persiste, s’il y a de la fièvre ou un écoulement de l’oreille. Pendant le vol, signalez immédiatement à l’équipage tout malaise ou difficulté à respirer ; à terre, appelez le **15** ou le **112** en cas d’urgence.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique',
    slug: 'trousse-de-voyage-famille-quoi-emporter-sans-automedication',
    title: 'Trousse de voyage pour la famille : quoi emporter, sans faire d’automédication',
    summary: 'Pansements, thermomètre, tire-tiques, crème solaire, sachets de réhydratation, ordonnances : composer une trousse adaptée à la destination et à l’âge des enfants, avec le pharmacien.',
    tags: ['trousse de voyage', 'trousse à pharmacie', 'vacances', 'médicaments voyage', 'SRO', 'tire-tique', 'thermomètre', 'enfant voyage'],
    sources: [S.ameliTrousse, S.pasteurVoyage, S.santeDeshyd],
    body_md: `## En bref
- Il n’existe **pas de trousse type** : son contenu dépend de la destination, de la saison, de la durée du séjour, de l’âge des enfants et de leur santé, souligne l’Assurance Maladie.
- Le **matériel de soin** (pansements, compresses, antiseptique, pince à épiler, tire-tiques, thermomètre) est la base.
- Les **sachets de réhydratation orale (SRO)** sont recommandés pour les jeunes enfants en pays chaud.
- Chez l’enfant, de nombreux médicaments sont **contre-indiqués selon l’âge** : faites préparer la trousse avec le médecin ou le pharmacien.
- Emportez le **carnet de santé**, les ordonnances et la **CEAM** (en Europe).

## Comprendre
En vacances, on est loin de son médecin, parfois de la pharmacie, et l’on change d’alimentation, de climat et d’activités. Une trousse bien pensée permet de faire face aux petits bobos et de **gagner du temps** en attendant un avis médical. Elle ne sert pas à soigner seul une fièvre, une diarrhée ou une douleur importante chez un enfant.

L’Assurance Maladie insiste sur un point : chez l’enfant, en cas de diarrhée ou de gastro-entérite, la priorité est de **surveiller la déshydratation**, et la plupart des médicaments contre la diarrhée sont contre-indiqués aux jeunes âges. Certains sont interdits avant 12 ans, d’autres déconseillés avant 15 ans ou contre-indiqués avant 2 ans. C’est pourquoi il vaut mieux demander conseil avant le départ que de piocher dans la trousse des adultes.

L’Institut Pasteur rappelle aussi de garder les antipaludiques et autres médicaments **hors de portée des enfants**, y compris à l’hôtel ou en location.

## Au quotidien
**Les documents**
- Carnet de santé de chaque enfant, ordonnances en cours, carte Vitale.
- CEAM pour chaque membre de la famille en Europe ; attestation d’assurance assistance-rapatriement si vous en avez une.
- Hors Union européenne, carnet de vaccination international si un vaccin est exigé ; pour un enfant ayant une maladie chronique, un compte rendu médical, si possible traduit en anglais.

**Le matériel de soin**
- Solution hydroalcoolique, savon, antiseptique (demandez conseil au pharmacien ; l’Assurance Maladie signale un risque d’allergie à la chlorhexidine).
- Compresses stériles, pansements de différentes tailles, sparadrap, bande.
- Ciseaux, pince à épiler, **tire-tiques**, épingles de sûreté.
- **Thermomètre**, sérum physiologique en unidoses.

**Selon la destination**
- Protection solaire adaptée aux enfants (indice 50 recommandé), chapeau, lunettes.
- Moustiquaire (de berceau pour les petits) et répulsif adapté à l’âge, choisi avec le pharmacien.
- **Sachets de SRO** pour un pays chaud ou un long séjour ; Santé.fr conseille d’en emporter en vacances.
- Moyens de rendre l’eau potable (comprimés ou filtre) si l’eau en bouteille capsulée risque de manquer.

**Les médicaments**
- Les traitements habituels de l’enfant, en quantité suffisante, avec une marge si le retour est retardé.
- Les médicaments contre la fièvre ou la douleur que le médecin ou le pharmacien vous ont conseillés **pour l’âge et le poids** de votre enfant, dans leur boîte d’origine avec la notice.
- En pays chaud, demandez comment conserver les médicaments : la chaleur peut les altérer, et l’Assurance Maladie déconseille par exemple les suppositoires par forte chaleur.

## Questions fréquentes
**Puis-je reprendre ce qui reste de la dernière maladie ?** Un médicament prescrit pour une situation précise ne convient pas forcément à une autre. Vérifiez aussi les dates de péremption et demandez au pharmacien.

**La trousse doit-elle aller en soute ou en cabine ?** Les médicaments indispensables voyagent en **cabine**, avec l’ordonnance, comme le recommande l’Assurance Maladie ; une réserve peut aller en soute si leur conservation le permet.

**Faut-il emporter des médicaments contre la diarrhée pour l’enfant ?** Chez l’enfant, la base est la réhydratation avec des SRO. Pour le reste, demandez un avis médical, car beaucoup de produits sont contre-indiqués selon l’âge.

## Quand demander conseil
Faites le point avec le médecin ou le pharmacien **plusieurs semaines avant** un voyage lointain. Sur place, consultez rapidement en cas de fièvre chez un nourrisson, de diarrhée ou de vomissements qui durent, de refus de boire, de douleur importante ou de plaie qui s’infecte. Appelez le **15** (ou le **112** en Europe) en cas d’urgence : malaise, difficultés à respirer, somnolence inhabituelle, convulsion.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'maladies-chroniques',
    slug: 'traitement-habituel-enfant-en-voyage-ordonnance-conservation',
    title: 'Votre enfant a un traitement au long cours : partir en voyage sans interruption',
    summary: 'Asthme, diabète, épilepsie, allergie sévère… Comment anticiper la quantité de médicaments, l’ordonnance, le transport en avion, la conservation à la chaleur et les horaires de prise.',
    tags: ['traitement chronique voyage', 'médicaments avion', 'ordonnance voyage', 'conservation médicaments chaleur', 'PAI vacances', 'stylo injecteur avion', 'enfant asthmatique voyage', 'diabète enfant voyage'],
    sources: [S.ameliTrousse, S.ecologieAvion, S.ameliVacEtranger],
    body_md: `## En bref
- **Consultez le médecin avant le départ** pour adapter le traitement au voyage (durée, climat, décalage horaire).
- Prévoyez **assez de médicaments** pour tout le séjour, avec une **marge** en cas de retour retardé.
- En avion, médicaments, stylos injecteurs, seringues et aiguilles voyagent **en cabine**, avec l’**ordonnance** (noms en DCI) et, si besoin, une **attestation médicale**.
- Chaleur et grand froid peuvent imposer des conditions particulières de **conservation** : renseignez-vous.
- Pour un séjour à l’étranger de plus d’un mois, une **délivrance en une fois** est possible sous conditions.

## Comprendre
Quand un enfant vit avec une maladie chronique, les vacances demandent un peu plus d’organisation, mais elles restent souvent possibles, avec de l’anticipation. L’objectif est simple : que le traitement ne s’interrompe pas et reste efficace, malgré les changements de rythme, de climat et de fuseau horaire.

L’Assurance Maladie recommande de garder sur soi une **ordonnance** mentionnant les médicaments en **dénomination commune internationale (DCI)**, c’est-à-dire le nom de la molécule, compréhensible à l’étranger. Pour les stylos injecteurs, seringues et aiguilles, une attestation médicale en français et si possible en anglais facilite les contrôles. Le ministère chargé des transports précise que si un médicament liquide est nécessaire pendant le vol, il faut pouvoir présenter une prescription du médecin.

Pour la durée, le pharmacien délivre en principe un mois de traitement. Pour un séjour à l’étranger de plus d’un mois et de moins de six mois, le médecin peut indiquer sur l’ordonnance la mention « à délivrer en une fois pour départ à l’étranger », et le pharmacien vous fait remplir une attestation. Cette dérogation ne concerne pas les déplacements en métropole ou dans les DOM. Au-delà de six mois, contactez votre caisse (3646).

## Au quotidien
**Un mois avant**
- Prenez rendez-vous avec le médecin qui suit votre enfant : traitement de fond, traitement de crise, conduite à tenir sur place, éventuel plan d’urgence écrit.
- Si votre enfant a un PAI (projet d’accueil individualisé) à l’école, emportez une copie des consignes : elles aident les adultes qui l’encadreront en colonie ou au centre de loisirs.
- Vérifiez les dates de péremption, notamment des traitements d’urgence.

**Préparer le transport**
- Gardez les médicaments dans leur **emballage d’origine**, avec la notice.
- En avion : tout en **bagage cabine**, une réserve en soute si la conservation le permet ; les biothérapies voyagent en cabine dans un conditionnement isotherme.
- Pour les médicaments à conserver au frais, demandez au pharmacien la solution adaptée (pochette isotherme, etc.) et la température à respecter.

**Sur place**
- Ne laissez pas les médicaments dans une voiture au soleil ni près d’une source de chaleur.
- Si les prises sont à heure fixe, demandez au médecin comment les décaler avec le **décalage horaire**.
- Repérez à l’avance la pharmacie et l’hôpital les plus proches.

**Côté remboursement**
- En Europe, la **CEAM** couvre les soins devenus nécessaires pendant le séjour. Hors Europe, seuls les soins urgents et imprévus peuvent être remboursés au retour, sur la base des tarifs français : l’Assurance Maladie conseille une assurance couvrant frais médicaux et rapatriement dans les pays où les soins sont chers.

## Questions fréquentes
**Faut-il traduire l’ordonnance ?** La DCI est comprise partout. Un compte rendu médical en anglais est recommandé par l’Assurance Maladie pour les personnes ayant une maladie chronique.

**Peut-on acheter le médicament sur place s’il manque ?** Les noms commerciaux et les dosages peuvent différer. D’où l’intérêt d’une marge suffisante et d’une ordonnance en DCI ; en cas de doute, demandez à un pharmacien ou à un médecin local.

**Mon enfant a un stylo d’adrénaline : où le ranger ?** Toujours avec vous, en cabine et pendant les sorties, jamais en soute. Demandez à son médecin une attestation pour les contrôles.

## Quand demander conseil
Parlez du projet de voyage au médecin qui suit votre enfant **suffisamment tôt**, surtout pour une destination lointaine, chaude ou en altitude. Sur place, consultez sans tarder si les symptômes de la maladie se modifient, si un traitement a été oublié ou perdu. Appelez le **15** (ou le **112**) en cas de crise grave : gêne respiratoire, malaise, réaction allergique étendue.

${FIN}`,
  },
  // ------------------------------------------------------------------ démarches
  {
    ...BASE, journeys: TOUS, category: 'droits-demarches',
    slug: 'papiers-d-identite-enfant-voyage-etranger-carte-passeport',
    title: 'Papiers d’identité de l’enfant pour voyager : carte d’identité, passeport, visa',
    summary: 'Même un bébé a besoin de sa propre pièce d’identité pour franchir une frontière : ce qu’il faut selon la destination, quand s’y prendre, et pourquoi le livret de famille ne peut pas être exigé.',
    tags: ['carte d’identité enfant', 'passeport bébé', 'passeport mineur', 'voyage étranger enfant', 'documents voyage', 'visa enfant', 'livret de famille', 'frontière'],
    sources: [S.spMineur, S.diploFormalites, S.diploMineur],
    body_md: `## En bref
- Pour voyager avec un parent dans l’**Union européenne ou l’espace Schengen**, un mineur français présente une **carte nationale d’identité valide** ; ailleurs, un **passeport individuel valide**, parfois avec un **visa**, selon le pays.
- Les mêmes règles s’appliquent **pour un bébé** : il lui faut sa propre pièce d’identité.
- Le **livret de famille ne peut pas être exigé** au passage de la frontière, même si l’enfant ne porte pas le même nom que le parent, précise Service-Public.
- Certains pays demandent une **preuve que l’autre parent autorise** le voyage : un simple courrier sur papier libre, selon France Diplomatie.
- Vérifiez les exigences du pays sur la fiche **« Conseils aux voyageurs »** de diplomatie.gouv.fr, bien avant le départ.

## Comprendre
On pense souvent aux billets et à l’hébergement, moins aux papiers des enfants. Pourtant, sans pièce d’identité valide et adaptée à la destination, l’embarquement ou le passage de la frontière peut être refusé.

Service-Public distingue deux situations. Si l’enfant voyage **avec un de ses parents**, il lui faut une carte d’identité valide pour l’UE ou l’espace Schengen, et un passeport (éventuellement avec visa) pour les autres pays. S’il voyage **sans ses parents** (seul, en colonie, avec ses grands-parents), il lui faut en plus une **autorisation de sortie du territoire (AST)**, présentée dans un article dédié.

France Diplomatie rappelle qu’en dehors de l’Union européenne, la plupart des États exigent un **passeport valide plusieurs mois après la date de retour**, et que les délais d’obtention d’un visa peuvent être longs. Elle conseille aussi de conserver chez soi une **photocopie** des documents emportés et de prévoir des photos d’identité. Le ministère recommande enfin d’inscrire l’enfant sur **Ariane**, le service qui permet au consulat de joindre les voyageurs en cas de crise majeure.

## Au quotidien
**Dès que le voyage se précise**
- Vérifiez la date de validité des pièces d’identité de **chaque** membre de la famille, enfants compris.
- Consultez la fiche « Conseils aux voyageurs » du pays de destination (et des pays d’escale) : pièce acceptée, durée de validité exigée, visa, autorisation de l’autre parent.
- Si un passeport est nécessaire, faites la demande tôt : en période de vacances, les délais de rendez-vous peuvent s’allonger.

**Pour la demande**
- Renseignez-vous auprès de la mairie qui recueille les demandes sur les pièces à apporter et les conditions de dépôt.
- Préparez une photo d’identité récente aux normes : chez un bébé, le visage change vite.

**Avant de partir**
- Rangez les pièces d’identité ensemble, dans un endroit sûr et accessible (pas dans la valise en soute).
- Gardez une copie papier et une copie numérique des documents.
- Si votre enfant voyage avec un seul de ses parents vers un pays qui le demande, préparez un **courrier d’autorisation** de l’autre parent, accompagné d’une copie de sa pièce d’identité.

**En cas de perte ou de vol à l’étranger**
- Déclarez-le d’abord à la police locale, puis contactez l’ambassade ou le consulat de France, qui peut délivrer un document d’urgence (payant, avec un délai).
- Ne voyagez pas avec un passeport déclaré perdu ou volé, même retrouvé.

## Questions fréquentes
**Mon bébé de 3 mois peut-il voyager sans papiers puisqu’il est dans mes bras ?** Non. Service-Public indique que les mêmes règles s’appliquent à un bébé : il lui faut sa propre carte d’identité ou son propre passeport selon la destination.

**Nous ne portons pas le même nom : dois-je emporter le livret de famille ?** Il ne peut pas être exigé à la frontière, précise Service-Public. Certains parents choisissent d’emporter une copie d’un acte de naissance ou du livret par précaution, notamment pour des pays qui demandent une preuve de filiation : vérifiez la fiche du pays.

**Je pars seul(e) avec mon enfant, l’autre parent doit-il signer quelque chose ?** En France, aucune AST n’est nécessaire si l’enfant voyage avec l’un de ses parents. Mais certains pays exigent une preuve de l’accord de l’autre parent : renseignez-vous auprès de l’ambassade du pays.

**La carte d’identité de mon enfant expire pendant le séjour : est-ce un problème ?** Elle doit être valide pour voyager, et certains pays exigent une validité au-delà du retour. Anticipez le renouvellement.

## Quand demander conseil
En cas de doute sur les papiers exigés, contactez l’ambassade ou le consulat du pays de destination, ou consultez Service-Public et France Diplomatie. Si vous craignez un départ de l’enfant à l’étranger sans votre accord, ou si un enfant semble en danger, appelez le **119** (Allô Enfance en danger), joignable à toute heure, ou le **17** en cas d’urgence.

${FIN}`,
  },
  {
    ...BASE, journeys: ENF, category: 'droits-demarches', min_age_months: 24, max_age_months: 216,
    slug: 'autorisation-de-sortie-du-territoire-ast-enfant-mode-d-emploi',
    title: 'Autorisation de sortie du territoire (AST) : quand votre enfant voyage sans vous',
    summary: 'Colonie à l’étranger, séjour linguistique, vacances avec les grands-parents : qui doit remplir l’AST, comment, pour combien de temps, et quels documents l’enfant doit avoir sur lui.',
    tags: ['AST', 'autorisation de sortie du territoire', 'cerfa 15646', 'enfant voyage seul', 'colonie étranger', 'séjour linguistique', 'voyage grands-parents', 'mineur non accompagné'],
    sources: [S.spAst, S.douaneAst, S.spMineur],
    body_md: `## En bref
- L’**AST** est obligatoire pour un mineur qui réside habituellement en France et **quitte le territoire sans être accompagné** d’un titulaire de l’autorité parentale.
- Un enfant qui voyage **avec un seul de ses parents** n’a **pas besoin d’AST**, même si les parents sont séparés, précise Service-Public.
- Le formulaire **cerfa n° 15646** se remplit en ligne ou à la main, puis se signe : **aucune démarche** en mairie ou en préfecture.
- L’enfant présente l’AST originale, **sa** pièce d’identité valide (et un visa si besoin) et une **copie de la pièce d’identité** du parent signataire.
- L’AST est valable pour la durée choisie par le parent, **un an au maximum**.

## Comprendre
L’AST existe depuis le 15 janvier 2017. Son but est de protéger les mineurs qui voyagent sans leurs parents. Elle concerne tous les mineurs résidant en France, français ou étrangers, et vaut aussi pour les voyages **au sein de l’Union européenne**, rappelle la Douane.

Elle n’est pas exigée quand l’enfant voyage avec son père ou avec sa mère. Elle l’est quand il part **seul**, avec des **grands-parents**, un oncle, des amis, en **colonie** ou en **séjour linguistique**. Service-Public précise aussi un cas souvent oublié : un mineur qui se rend de la métropole vers un département d’outre-mer doit avoir une AST s’il fait une **escale à l’étranger**.

Un seul parent titulaire de l’autorité parentale suffit pour signer. Si l’autorité parentale est conjointe, l’un des parents peut signer sans l’accord de l’autre, même si Service-Public recommande de se mettre d’accord pour éviter les conflits. En cas d’autorité parentale exclusive décidée par un juge, seul le parent qui la détient peut signer.

Attention : si une **opposition** ou une **interdiction de sortie du territoire** a été prononcée, l’enfant ne peut pas partir, même avec une AST.

## Au quotidien
**Remplir le formulaire**
- Téléchargez le cerfa n° 15646 sur Service-Public, ou remplissez-le en ligne avant de l’imprimer.
- Indiquez l’identité de l’enfant, celle du parent signataire, la destination et la **durée** de l’autorisation (un voyage précis ou une période plus longue, dans la limite d’un an).
- Signez l’original.

**Ce que l’enfant doit avoir sur lui (mineur français)**
- La **carte d’identité ou le passeport valide** de l’enfant, et un **visa** si le pays l’exige.
- L’**AST originale** signée.
- Une **photocopie lisible** de la carte d’identité ou du passeport du parent signataire (valide, ou périmé depuis moins de 5 ans pour un parent français).
- Pour un mineur étranger ou un parent étranger, les pièces diffèrent : vérifiez la fiche Service-Public correspondante.

**Avec l’organisateur du séjour**
- Les organismes de colonies et de séjours linguistiques demandent souvent une copie à l’avance : conservez un double.
- Confiez les documents à l’accompagnateur ou à l’enfant selon son âge, dans une pochette dédiée.

## Questions fréquentes
**Faut-il faire valider l’AST en mairie ?** Non. La Douane et Service-Public sont clairs : il n’y a pas d’enregistrement en mairie, en préfecture ou au commissariat.

**Le livret de famille est-il exigé si nos noms diffèrent ?** Non, il ne peut pas être exigé : l’AST suffit, même si le nom du parent signataire diffère de celui de l’enfant. En emporter une copie peut être utile par précaution.

**Mon ado part avec sa classe à l’étranger : faut-il une AST ?** La fiche consultée ne traite pas spécifiquement des voyages scolaires, mais la règle générale s’applique : sans parent, l’AST est requise. L’établissement vous indiquera les documents demandés.

**Que faire si l’AST est refusée à la frontière ?** Service-Public indique que l’on peut contacter la Police aux frontières ; en cas de refus d’embarquement par une compagnie, une réclamation peut être déposée, puis la DGAC saisie sans réponse sous deux mois.

## Quand demander conseil
Pour un cas particulier (enfant de nationalité étrangère, autorité parentale exclusive, parents en désaccord), renseignez-vous sur Service-Public ou auprès d’un professionnel du droit de la famille. Si vous craignez qu’un enfant soit emmené à l’étranger contre la volonté d’un parent ou qu’il soit en danger, appelez le **119**, ou le **17** en cas d’urgence.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'droits-demarches',
    slug: 'carte-europeenne-assurance-maladie-ceam-enfants-soins-europe',
    title: 'Se faire soigner en Europe avec ses enfants : la CEAM et le remboursement pas à pas',
    summary: 'Une carte par personne, à demander au moins 15 jours avant le départ : comment fonctionne la carte européenne d’assurance maladie, ce qu’elle couvre et comment se faire rembourser au retour.',
    tags: ['CEAM', 'carte européenne d’assurance maladie', 'soins en Europe', 'remboursement étranger', 'vacances Europe', 'formulaire S3125', 'certificat provisoire', 'enfant malade en vacances'],
    sources: [S.ameliVacEtranger, S.ameliCeam],
    body_md: `## En bref
- La **CEAM** est utilisable dans l’**Union européenne**, l’**Espace économique européen**, en **Suisse** et au **Royaume-Uni**.
- **Chaque membre de la famille**, y compris les **enfants de moins de 16 ans**, doit avoir **sa propre carte**, rappelle l’Assurance Maladie.
- Demandez-la **au moins 15 jours avant le départ** ; elle est valable **jusqu’à 2 ans** (jamais au-delà de vos droits).
- Départ dans moins de 15 jours : un **certificat provisoire de remplacement**, valable **3 mois**, peut être délivré.
- Elle couvre les soins **devenus nécessaires pendant le séjour** (urgents ou imprévus), pas un séjour organisé pour se faire soigner.

## Comprendre
Votre enfant se réveille avec de la fièvre à Barcelone, se coupe le pied sur une plage grecque ou fait une otite en Italie : grâce à la CEAM, il peut être soigné selon les règles du pays, comme un assuré local.

Selon la législation du pays, l’Assurance Maladie indique que vous n’aurez **rien à avancer**, ou que vous devrez **payer puis vous faire rembourser**. Dans ce second cas, le remboursement se fait sur la base des tarifs du pays de séjour, dans la limite des frais engagés ; vous pouvez aussi choisir les règles françaises.

La CEAM ne remplace pas une assurance assistance : elle ne prend pas en charge, par exemple, un **rapatriement**. Selon votre situation (contrat d’assurance, carte bancaire, mutuelle), une couverture complémentaire peut être utile ; renseignez-vous avant de partir.

## Au quotidien
**Commander les cartes**
- En ligne, dans votre **compte ameli** (rubrique Démarches) ou dans l’application Compte ameli, pour chaque membre de la famille.
- Par téléphone au **3646** si vous n’avez pas de compte, avec la carte Vitale à portée de main.
- La CEAM existe aussi sous **forme dématérialisée** dans l’application Compte ameli.
- Vérifiez la date de validité des cartes déjà reçues : elles expirent.

**Sur place**
- Présentez la CEAM de l’enfant au médecin, à la pharmacie ou à l’hôpital.
- Gardez **toutes les factures**, ordonnances et preuves de paiement.

**Au retour, si vous avez payé**
- Déclarez les frais dans votre compte ameli (rubrique Démarches, frais de santé à l’étranger) ou envoyez le **formulaire S3125** avec les justificatifs à votre caisse.
- Si vous êtes en arrêt de travail pendant le séjour (par exemple pour vous-même), l’avis d’arrêt doit être envoyé à votre caisse **sous 48 heures**.

## Questions fréquentes
**Mon bébé est né il y a un mois, a-t-il besoin de sa propre CEAM ?** Oui : l’Assurance Maladie précise que chaque membre de la famille, y compris les enfants de moins de 16 ans, doit avoir sa propre carte. Si le départ est dans moins de 15 jours, demandez le certificat provisoire.

**La CEAM couvre-t-elle une consultation prévue avant de partir ?** Non. Elle concerne uniquement les soins devenus nécessaires pendant le séjour.

**Faut-il une CEAM pour aller dans les DOM ?** Les départements d’outre-mer font partie de la France : votre carte Vitale suffit.

**Nous partons hors d’Europe : la CEAM sert-elle ?** Non. Consultez l’article sur les soins hors Europe : seuls les soins urgents et imprévus peuvent être remboursés au retour, sur la base des tarifs français.

## Quand demander conseil
Pour toute question sur vos droits, contactez votre caisse d’Assurance Maladie (3646) ou consultez ameli.fr avant le départ. Sur place, en cas d’urgence, composez le **112**, numéro d’urgence européen gratuit. En cas de fièvre chez un nourrisson, de difficultés à respirer ou de somnolence inhabituelle, n’attendez pas : faites soigner l’enfant, les démarches de remboursement viendront après.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'droits-demarches',
    slug: 'soins-hors-europe-enfant-remboursement-assurance-rapatriement',
    title: 'Voyage hors d’Europe avec des enfants : soins sur place, remboursement et assurance',
    summary: 'États-Unis, Asie, Afrique, Amérique latine : ce que l’Assurance Maladie rembourse (ou non) si votre enfant doit être soigné, et les précautions à prendre avant de partir.',
    tags: ['soins à l’étranger', 'hors Europe', 'assurance voyage', 'rapatriement', 'remboursement soins étranger', 'enfant malade voyage', 'Cleiss', 'frais médicaux'],
    sources: [S.ameliVacEtranger, S.ameliTrousse, S.diploFormalites],
    body_md: `## En bref
- Hors Europe, seuls les **soins urgents et imprévus** peuvent être pris en charge par l’Assurance Maladie, **au retour**, et après avis du médecin-conseil.
- Le remboursement se fait sur la base des **tarifs forfaitaires français**, et non des frais réels : il peut être très inférieur à ce que vous avez payé.
- Dans les pays où les soins sont chers (États-Unis, Canada, certains pays d’Asie), l’Assurance Maladie recommande un **contrat d’assistance** couvrant frais médicaux et **rapatriement sanitaire**.
- Si vous partez dans un pays d’origine lié à la France par une **convention de sécurité sociale**, une prise en charge sur place est parfois possible : renseignez-vous auprès de votre caisse.
- Emportez carnets de santé, ordonnances et, pour un enfant ayant une maladie chronique, un **compte rendu médical en anglais**.

## Comprendre
En dehors de l’Union européenne, de l’Espace économique européen, de la Suisse et du Royaume-Uni, la CEAM ne fonctionne pas. Si votre enfant doit être soigné, vous **payez sur place** l’intégralité des frais.

À votre retour, vous pouvez demander un remboursement à votre caisse. L’Assurance Maladie précise que son médecin-conseil apprécie si la situation relevait bien de l’urgence. Si c’est accepté, le remboursement se fait aux **tarifs forfaitaires français** ; si c’est refusé, aucun recours n’est possible. Une hospitalisation de quelques jours dans un pays où les soins coûtent cher peut donc laisser un reste à charge très important.

C’est pourquoi l’Assurance Maladie conseille, pour ces destinations, un contrat d’assistance ou d’assurance couvrant à la fois les **frais médicaux** et le **rapatriement**. Vous pouvez vous renseigner auprès de votre caisse, de votre assureur, d’une agence de voyage, du Cleiss (Centre des liaisons européennes et internationales de sécurité sociale) ou du ministère des Affaires étrangères.

## Au quotidien
**Avant de partir**
- Lisez attentivement les garanties dont vous disposez peut-être déjà (contrat d’assurance, mutuelle, moyens de paiement) : plafonds, franchises, pays couverts, prise en charge des enfants, numéro d’assistance à appeler.
- Notez le numéro d’assistance et votre numéro de contrat dans votre téléphone **et** sur papier.
- Consultez la fiche « Conseils aux voyageurs » du pays sur diplomatie.gouv.fr : situation sanitaire, épidémies en cours, conditions d’entrée.
- Préparez les documents médicaux : carnet de santé, carnet de vaccination international si un vaccin est exigé, ordonnances en DCI.

**Sur place, si l’enfant doit être soigné**
- Si vous avez un contrat d’assistance, appelez son numéro : il vous indiquera la marche à suivre prévue par votre contrat.
- Conservez **toutes les factures** détaillées et les preuves de paiement, ainsi que les comptes rendus médicaux.
- Demandez des documents lisibles (en anglais si possible) précisant le diagnostic et les soins.

**Au retour**
- Envoyez à votre caisse les factures et justificatifs ; la demande est facultative mais recommandée si les soins étaient urgents.
- Transmettez aussi les documents à votre mutuelle ou à votre assurance selon leurs conditions.

## Questions fréquentes
**Un simple médecin pour une otite, est-ce un soin « urgent et imprévu » ?** C’est le médecin-conseil de votre caisse qui apprécie si la situation relevait de l’urgence. Gardez tous les justificatifs et le compte rendu de consultation.

**Notre famille est originaire du pays où nous allons : y a-t-il des règles particulières ?** Si la France a signé une convention de sécurité sociale avec ce pays, une prise en charge sur place est parfois possible. Contactez votre caisse avant le départ ; le site du Cleiss recense ces accords.

**L’assistance rapatriement est-elle utile pour un court séjour ?** Le risque ne dépend pas de la durée : un accident ou une hospitalisation peut survenir dès le premier jour. Comparez les garanties au coût des soins dans le pays visité.

## Quand demander conseil
Faites le point avec votre caisse et votre assureur **avant** de réserver un voyage lointain avec des enfants, et avec votre médecin pour les vaccins et la trousse. Sur place, n’attendez pas pour faire soigner un enfant qui a de la fièvre (surtout un nourrisson ou au retour d’une zone tropicale), qui respire mal, qui ne boit plus ou qui est inhabituellement somnolent. Composez le numéro d’urgence local, ou contactez l’ambassade ou le consulat de France si vous êtes en difficulté.

${FIN}`,
  },
  // ------------------------------------------------------------------ santé du voyageur
  {
    ...BASE, journeys: TOUS, category: 'sante-enfant',
    slug: 'vaccins-avant-un-voyage-a-l-etranger-avec-enfant',
    title: 'Vaccins avant un voyage à l’étranger avec un enfant : quand et où consulter ?',
    summary: 'Fièvre jaune, hépatite A, rage, typhoïde… Comment préparer la consultation du voyageur pour votre enfant, combien de temps à l’avance, et pourquoi vérifier d’abord le calendrier vaccinal français.',
    tags: ['vaccins voyage', 'enfant voyageur', 'fièvre jaune', 'hépatite A', 'rage', 'typhoïde', 'centre de vaccinations internationales', 'carnet de vaccination international'],
    sources: [S.ameliVaccVoyage, S.mpediaVaccVoyage, S.ameliPrevSpec],
    body_md: `## En bref
- Consultez **au moins six semaines avant le départ**, conseille l’Assurance Maladie ; mpedia (AFPA) suggère même de se renseigner **deux mois avant**, car certains vaccins demandent plusieurs injections.
- Première étape : vérifier que l’enfant (et les parents) sont **à jour du calendrier vaccinal français**.
- Certains vaccins (**fièvre jaune**, **encéphalite japonaise**) ne se font que dans les **centres agréés de vaccinations internationales**.
- Le vaccin contre la fièvre jaune est **contre-indiqué avant 9 mois** (sauf épidémie, à partir de 6 mois), et doit être fait **au moins 10 jours avant** le départ.
- Les recommandations sont **mises à jour chaque année** : seul un professionnel peut établir le programme adapté à votre enfant.

## Comprendre
Les vaccins du voyageur dépendent de nombreux éléments : la **destination**, la **durée** et les **conditions** du séjour (hôtel ou zone rurale, saison des pluies…), l’**âge** de l’enfant, son **état de santé** et les vaccins déjà reçus. C’est pourquoi l’Assurance Maladie conseille de voir le médecin traitant, ou un centre de vaccinations internationales, pour établir un plan vaccinal sur mesure.

Avant tout, l’enfant doit être à jour des vaccinations **obligatoires et recommandées en France**. mpedia rappelle qu’un retard se rattrape : chaque dose déjà faite compte.

Selon les destinations, d’autres vaccins peuvent être proposés : **hépatite A** dans les pays où l’hygiène est précaire, **fièvre typhoïde** pour certains séjours en pays tropicaux, **méningocoques**, **encéphalite à tiques** pour la nature en Europe centrale et du Nord au printemps et en été, **rage** pour un séjour long ou isolé dans une zone à risque. L’Assurance Maladie souligne que la vaccination antirabique avant exposition est recommandée dès que le jeune enfant **commence à marcher**, car il est plus exposé aux morsures et griffures. Même vacciné, un enfant mordu doit être soigné rapidement sur place.

La **fièvre jaune** est obligatoire pour résider en Guyane et indispensable pour tout séjour en zone endémique (régions intertropicales d’Afrique et d’Amérique du Sud). Elle est inscrite sur le **carnet de vaccination international**, à présenter aux frontières des pays qui l’exigent. Un rappel peut être nécessaire, notamment pour un enfant vacciné avant 2 ans.

## Au quotidien
**Préparer la consultation**
- Prenez rendez-vous tôt, en particulier avant les vacances d’été.
- Apportez le **carnet de santé** de chaque enfant, la liste des pays et des étapes, les dates, le type d’hébergement et les activités prévues.
- Signalez les éventuelles maladies, allergies ou traitements de l’enfant, et une grossesse ou un allaitement pour la maman.

**Organiser le calendrier**
- Certains vaccins demandent **plusieurs injections espacées** de quelques semaines, et l’efficacité met souvent **2 à 3 semaines** à s’installer, précise mpedia.
- Profitez de la consultation pour parler aussi de la **prévention du paludisme**, des moustiques, de l’eau et de la trousse de voyage.

**Avant de partir**
- Glissez le carnet de vaccination international et le carnet de santé dans les papiers de voyage.
- Notez les dates des rappels à prévoir au retour.

## Questions fréquentes
**Mon bébé a 6 mois et nous partons en Afrique de l’Ouest : peut-il être vacciné contre la fièvre jaune ?** L’Assurance Maladie indique que ce vaccin n’est pas recommandé avant 9 mois, sauf épidémie (une injection est alors possible entre 6 et 9 mois). Elle précise aussi que si la vaccination est impossible, les voyages en zone endémique sont formellement déconseillés. Parlez-en avec le centre de vaccinations.

**Existe-t-il un vaccin contre le paludisme pour les voyageurs ?** La prévention repose sur un médicament préventif prescrit par le médecin, associé à la protection contre les piqûres de moustiques. Voir l’article dédié.

**Les vaccins du voyageur sont-ils remboursés ?** La page consultée ne traite pas du remboursement : renseignez-vous auprès du centre de vaccination ou de votre caisse.

## Quand demander conseil
Consultez dès que le projet de voyage se précise, idéalement **deux mois avant**. Après une vaccination, contactez le médecin si l’enfant a une fièvre élevée ou une réaction qui vous inquiète. Appelez le **15** en cas de malaise, de gêne respiratoire, de gonflement du visage ou d’éruption étendue survenant après une injection.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'sante-enfant', safety_critical: true,
    slug: 'paludisme-voyage-zone-tropicale-avec-enfant-prevention',
    title: 'Paludisme : protéger son enfant avant, pendant et après un séjour en zone tropicale',
    summary: 'Pourquoi il est déconseillé d’emmener un jeune enfant en zone impaludée, comment combiner traitement préventif et protection contre les piqûres, et pourquoi toute fièvre au retour doit faire consulter en urgence.',
    tags: ['paludisme', 'malaria', 'zone tropicale', 'moustiquaire', 'répulsif enfant', 'traitement préventif', 'chimioprophylaxie', 'fièvre au retour'],
    sources: [S.pasteurVoyage, S.mpediaPalu, S.ameliPrevSpec],
    body_md: `## En bref
- Le paludisme est transmis par la piqûre d’un **moustique anophèle**, qui pique **entre le coucher et le lever du soleil**.
- L’Institut Pasteur **déconseille d’emmener de jeunes enfants en zone impaludée** ; si le voyage est nécessaire, il se prépare **bien avant** avec un médecin.
- Aucune mesure ne suffit seule : il faut **associer** le traitement préventif prescrit et la **protection contre les piqûres** (moustiquaire imprégnée, vêtements couvrants, répulsif adapté à l’âge).
- Le traitement préventif se **poursuit après le retour**, même si l’enfant va bien.
- **Toute fièvre** au retour d’une zone tropicale doit faire **consulter en urgence**, même des semaines après.

## Comprendre
Le paludisme est une maladie parasitaire. L’une des espèces de parasite, *Plasmodium falciparum*, peut être mortelle, rappelle mpedia (AFPA). Il n’existe pas de vaccin pour les voyageurs : la prévention repose sur deux piliers indissociables.

**1. Le traitement préventif (chimioprophylaxie).** Il est prescrit par le médecin, adapté à la destination (certains parasites sont résistants), à la durée du séjour, à l’âge et au **poids** de l’enfant. L’Assurance Maladie précise qu’un tel traitement n’est plus recommandé pour un séjour de moins de 7 jours dans une zone à transmission faible ou modérée avec une exposition peu risquée : c’est donc au médecin d’évaluer. Selon le médicament, il se commence avant le départ et se **poursuit plusieurs semaines après le retour**. L’Assurance Maladie déconseille d’acheter des antipaludiques sur internet ou à l’étranger (contrefaçons) et déconseille fortement les tisanes ou gélules à base d’*Artemisia*.

**2. La protection contre les piqûres.** Selon l’Institut Pasteur, la **moustiquaire imprégnée d’insecticide** est la protection la plus efficace contre les moustiques qui piquent la nuit ; lits et berceaux doivent en être équipés. Elle doit être intacte et bien bordée. La climatisation ne suffit pas à empêcher les piqûres. Pour les répulsifs cutanés, l’Institut Pasteur indique que leur innocuité n’est pas établie avant 2 ans : demandez conseil au médecin ou au pharmacien, qui choisira un produit adapté à l’âge.

## Au quotidien
**Avant le départ**
- Consultez le médecin ou un centre de conseils aux voyageurs plusieurs semaines avant : traitement préventif, vaccins, moustiquaire de berceau, répulsifs.
- Faites préciser par écrit les modalités de prise du traitement préventif et sa durée après le retour.

**Sur place**
- Dès la fin de journée : vêtements longs et couvrants, chaussures fermées, répulsif adapté à l’âge, uniquement sur la peau saine et découverte.
- Pour dormir : **moustiquaire** imprégnée bien bordée sous le matelas, au-dessus du lit ou du berceau.
- Appliquez la crème solaire d’abord, et le répulsif **20 minutes** après, comme le rappelle mpedia ; rincez la peau de l’enfant avant le coucher.
- Donnez le traitement préventif **régulièrement**, sans oubli, et gardez-le **hors de portée** des enfants.
- Évitez les sorties à la tombée de la nuit, la marche pieds nus et la baignade en eau douce stagnante.

**Au retour**
- Poursuivez le traitement préventif le temps prescrit.
- Surveillez l’apparition de fièvre, frissons, fatigue, maux de tête, courbatures, troubles digestifs, pendant plusieurs semaines voire plusieurs mois.

## Questions fréquentes
**Les bracelets anti-moustiques ou la citronnelle suffisent-ils ?** Non. mpedia cite les bracelets, les ultrasons, la citronnelle, les huiles essentielles et la vitamine B1 parmi les moyens **inefficaces**.

**Mon enfant a pris son traitement préventif : est-il totalement protégé ?** Non. L’Institut Pasteur rappelle qu’une chimioprophylaxie bien suivie ne garantit pas une protection totale. D’où l’importance de la protection contre les piqûres et de la vigilance au retour.

**Nous rendons visite à la famille, nous connaissons le pays : faut-il ces précautions ?** Oui. Les recommandations s’appliquent à tous les enfants voyageurs, que l’on séjourne à l’hôtel ou en famille : parlez-en au médecin avant le départ.

## Quand demander conseil
Pendant le séjour comme au retour, **toute fièvre**, même modérée, chez un enfant ayant séjourné en zone impaludée doit faire **consulter en urgence** ; l’Institut Pasteur précise que chez le nourrisson, il faut consulter pour tout malaise, même sans fièvre. Signalez toujours le voyage au médecin. Appelez le **15** (ou le numéro d’urgence local) si l’enfant est somnolent, convulse, respire mal ou vomit tout ce qu’il boit.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'sante-enfant', safety_critical: true,
    slug: 'fievre-au-retour-de-voyage-enfant-consulter',
    title: 'Fièvre, éruption, fatigue au retour de voyage : quand consulter pour son enfant ?',
    summary: 'Paludisme, dengue, chikungunya et autres infections peuvent se déclarer après le retour : les signes à surveiller pendant les semaines qui suivent un séjour lointain et ce qu’il faut dire au médecin.',
    tags: ['fièvre retour voyage', 'retour des tropiques', 'paludisme', 'dengue', 'chikungunya', 'Zika', 'éruption cutanée', 'enfant fièvre'],
    sources: [S.pasteurVoyage, S.arsOccitanie, S.mpediaPalu],
    body_md: `## En bref
- « Toute fièvre au retour des tropiques doit être considérée a priori comme un **paludisme** jusqu’à preuve du contraire », rappelle l’Institut Pasteur.
- Consultez **en urgence** en cas de fièvre, même légère, de nausées, de maux de tête, de courbatures ou de fatigue, pendant le séjour ou dans les **mois** qui suivent.
- Après une zone où circulent dengue, chikungunya ou Zika, l’ARS Occitanie conseille de rester attentif **jusqu’à 3 semaines** et de consulter en cas d’éruption, de douleurs articulaires ou musculaires, de maux de tête ou de conjonctivite.
- **Dites toujours au médecin** où et quand l’enfant a voyagé.
- Continuez à **éviter les piqûres** au retour : un moustique peut transmettre le virus à l’entourage.

## Comprendre
Certaines infections ont une période d’**incubation** : le temps entre la contamination et les premiers signes. Une maladie attrapée pendant les vacances peut donc se déclarer une fois rentré, parfois des semaines plus tard. mpedia (AFPA) précise que l’incubation du paludisme est en général d’une à deux semaines, mais peut durer plusieurs mois.

Le **paludisme** se manifeste classiquement par des accès de frissons, de fièvre élevée puis de sueurs, mais il peut aussi prendre une forme trompeuse chez l’enfant : fatigue, pâleur, irritabilité, troubles digestifs. C’est une **urgence**, car il peut s’aggraver rapidement. Le diagnostic se fait par un **examen de sang**.

La **dengue**, le **chikungunya** et le **Zika** sont transmis par les moustiques du genre *Aedes*, qui piquent surtout **le jour**. L’ARS Occitanie indique que le virus est présent dans le sang à partir de 2 jours avant les symptômes et jusqu’à 7 jours après : une personne malade peut alors, via un moustique tigre, contaminer son entourage, y compris en France métropolitaine où ce moustique est présent.

Chez le nourrisson, les signes d’infection sont souvent discrets. L’Institut Pasteur recommande de consulter pour **tout malaise**, même sans fièvre.

## Au quotidien
**Dans les semaines qui suivent le retour**
- Prenez la température de l’enfant s’il semble fatigué, grognon, chaud ou s’il mange moins.
- Si un **traitement préventif du paludisme** a été prescrit, poursuivez-le jusqu’au bout, même si tout va bien.
- Continuez à protéger l’enfant des moustiques pendant quelques jours (vêtements, moustiquaire, répulsif adapté à l’âge).

**Si la fièvre apparaît**
- Consultez **le jour même** un médecin ou un service d’urgences, sans attendre de voir si cela passe.
- Précisez : pays et régions visités, dates d’aller et de retour, traitement préventif pris ou non (et comment), piqûres, baignades en eau douce, contacts avec des animaux.
- Apportez le carnet de santé et le carnet de vaccination international.
- Ne donnez pas de médicament de vous-même sans avis : le médecin vous dira quoi donner pour soulager l’enfant en attendant les résultats.

**Autres signes à signaler**
- Éruption cutanée, douleurs articulaires ou musculaires, yeux rouges, diarrhée qui dure, toux persistante, plaie qui ne guérit pas, morsure ou griffure d’animal pendant le séjour.

## Questions fréquentes
**Il a juste 38 °C et joue : faut-il vraiment consulter en urgence ?** Au retour d’une zone où sévit le paludisme, oui : l’Institut Pasteur demande de consulter en urgence même pour une fièvre légère. Le médecin décidera des examens.

**Nous sommes rentrés il y a deux mois, est-ce encore lié au voyage ?** C’est possible : le paludisme peut survenir plusieurs mois après. Mentionnez toujours le voyage, même ancien.

**Le traitement préventif a été bien pris, cela exclut-il le paludisme ?** Non. Une chimioprophylaxie bien suivie ne garantit pas une protection totale, rappelle l’Institut Pasteur.

## Quand demander conseil
Consultez **en urgence** pour toute fièvre chez un enfant revenu d’une zone tropicale. Appelez le **15** (ou le **112**) sans attendre si l’enfant est très somnolent ou difficile à réveiller, s’il convulse, respire mal, vomit tout ce qu’il boit, a des taches violacées sur la peau, ou si un nourrisson paraît mou ou fait un malaise.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'alimentation-bebe',
    slug: 'eau-biberons-repas-enfant-en-voyage-pays-chaud',
    title: 'Eau, biberons et repas de l’enfant en voyage dans un pays où l’hygiène est précaire',
    summary: 'Eau en bouteille capsulée, lait pasteurisé, fruits pelés, plats servis brûlants : les règles d’hygiène alimentaire à appliquer pour toute la famille, et le cas particulier des biberons.',
    tags: ['eau potable voyage', 'biberon voyage', 'turista', 'hygiène alimentaire voyage', 'eau en bouteille', 'glaçons', 'lait voyage', 'allaitement voyage'],
    sources: [S.ameliGastroPrev, S.pasteurVoyage, S.ameliTrousse],
    body_md: `## En bref
- Buvez et faites boire uniquement de l’**eau en bouteille capsulée, ouverte devant vous**, ou de l’eau rendue potable (ébullition, filtration, désinfection).
- Évitez l’eau du robinet **même pour se brosser les dents**, les **glaçons**, l’eau en sachet et les jus de fruits frais artisanaux, conseille l’Assurance Maladie.
- Pour les **biberons**, l’Institut Pasteur recommande l’eau minérale ou une eau filtrée bouillie, et la **stérilisation** du matériel.
- L’**allaitement maternel** est encouragé en voyage : il évite la question de l’eau et du matériel.
- Règle d’or pour les aliments : **« bien cuit, bouilli, pelé… ou on évite »**.

## Comprendre
Dans de nombreux pays, l’eau du robinet et certains aliments peuvent transmettre des microbes responsables de la diarrhée du voyageur (la « turista »). Chez l’adulte, elle est souvent bénigne et disparaît en général en 1 à 3 jours, selon l’Institut Pasteur. Chez le jeune enfant, le risque principal est la **déshydratation**, qui peut s’installer vite, surtout par forte chaleur.

Il n’existe pas de vaccin contre la turista : la prévention repose sur l’**hygiène des mains** et l’**hygiène alimentaire**. Pour certaines destinations, le médecin peut proposer un vaccin contre la fièvre typhoïde, une autre maladie transmise par l’eau et les aliments contaminés.

L’Assurance Maladie précise les gestes : faire bouillir l’eau **une minute** si l’eau en bouteille n’est pas disponible, ou la désinfecter avec un produit adapté, après filtration si elle est trouble. Le lait doit être **pasteurisé ou bouilli**, et la chaîne du froid respectée.

## Au quotidien
**L’eau**
- Eau en bouteille capsulée, ouverte devant vous, pour boire, préparer les biberons et se brosser les dents.
- À défaut : eau bouillie une minute, ou désinfectée avec des comprimés ou un filtre adapté (demandez conseil au pharmacien avant le départ).
- Pas de glaçons dans les boissons, pas d’eau en sachet.

**Les biberons**
- Préparez-les avec de l’eau minérale en bouteille ou une eau filtrée et bouillie, en suivant les instructions de la boîte de lait et les conseils de votre médecin ou de votre sage-femme.
- **Stérilisez** ou faites bouillir biberons et tétines ; lavez-vous les mains au savon avant chaque préparation.
- Préparez le biberon au moment de le donner ; ne gardez pas un biberon entamé.
- Prévoyez assez de lait infantile pour le séjour, au cas où vous ne trouveriez pas le même sur place.

**Les repas**
- Viande, poisson, œufs et crustacés **bien cuits** ; plats servis **fumants**.
- Pas de crudités ni de fruits non pelés par vous-même ; épluchez les fruits juste avant de les donner.
- Évitez buffets tièdes, plats réchauffés, fruits de mer, glaces et sorbets artisanaux, nourriture de rue sauf si elle est cuite et servie brûlante.
- Pour la diversification, les petits pots du commerce fermés et les purées maison préparées avec de l’eau sûre sont des options pratiques.

**Les mains**
- Lavage des mains au **savon** (l’eau seule ne suffit pas) avant les repas, avant de cuisiner, après les toilettes et après chaque change.
- Gardez une solution hydroalcoolique pour les moments sans point d’eau, à utiliser sur des mains propres.

## Questions fréquentes
**Je suis en voyage avec un bébé allaité : dois-je lui donner de l’eau en plus ?** Par forte chaleur, un bébé allaité peut être mis au sein plus souvent, le lait maternel étant riche en eau. Pour toute question sur des apports d’eau supplémentaires, demandez l’avis du médecin ou de la sage-femme.

**L’eau du robinet de l’hôtel est-elle sûre ?** Dans un pays où l’eau n’est pas potable, considérez que non, même dans un bel hôtel. Utilisez l’eau en bouteille capsulée.

**Les fruits lavés à l’eau du robinet, c’est suffisant ?** Non : si l’eau n’est pas potable, elle peut elle-même contaminer. Préférez les fruits que vous pelez vous-même.

## Quand demander conseil
Avant le départ, parlez au médecin ou à la sage-femme de l’alimentation de votre bébé en voyage, et au pharmacien des moyens de rendre l’eau potable et des **sachets de réhydratation orale**. Sur place, consultez rapidement si un nourrisson a une diarrhée ou des vomissements, refuse de boire, ou si l’enfant semble déshydraté (bouche sèche, yeux cernés, somnolence, peu d’urines). Appelez le **15** ou le numéro d’urgence local en cas de somnolence importante, de malaise ou si l’enfant ne garde rien.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'sante-enfant', safety_critical: true,
    slug: 'diarrhee-en-voyage-enfant-rehydrater-surveiller',
    title: 'Diarrhée de l’enfant en voyage : réhydrater d’abord, surveiller, consulter',
    summary: 'Turista, gastro des vacances : pourquoi les sachets de réhydratation orale sont le premier réflexe, pourquoi la plupart des médicaments antidiarrhéiques sont contre-indiqués chez l’enfant, et les signes qui imposent de consulter.',
    tags: ['diarrhée voyage', 'turista', 'gastro vacances', 'SRO', 'soluté de réhydratation', 'déshydratation enfant', 'vomissements', 'enfant malade en vacances'],
    sources: [S.ameliTrousse, S.santeDeshyd, S.santeCoupChaleur],
    body_md: `## En bref
- Chez l’enfant, le danger de la diarrhée, c’est la **déshydratation**, surtout en pays chaud et chez le nourrisson.
- Le premier réflexe : le **soluté de réhydratation orale (SRO)**, proposé souvent, par petites quantités, en laissant l’enfant boire à sa soif.
- L’**allaitement** se poursuit, en complément des SRO.
- La plupart des médicaments contre la diarrhée sont **contre-indiqués** chez l’enfant selon l’âge : ne donnez rien sans avis médical.
- Vomissements qui persistent, diarrhée qui ne s’arrête pas, somnolence : **consultez rapidement**.

## Comprendre
Une diarrhée fait perdre de l’eau et des sels minéraux. L’enfant, et plus encore le nourrisson, a une réserve en eau plus faible que l’adulte : Santé.fr rappelle qu’un nourrisson peut se **déshydrater en quelques heures**. La chaleur, la fièvre et les vomissements accélèrent cette perte.

Les **solutés de réhydratation orale** apportent dans les bonnes proportions de l’eau, du sucre et des sels minéraux. Ils sont en vente libre en pharmacie et remboursés sur ordonnance ; Santé.fr conseille d’en **emporter en vacances**, et l’Assurance Maladie les recommande pour les jeunes enfants en pays chaud. Ils se préparent avec de l’**eau sûre** (en bouteille capsulée, ou bouillie), en suivant exactement la notice.

L’Assurance Maladie met en garde sur les médicaments : chez l’enfant, la plupart sont contre-indiqués. Certains ralentisseurs du transit sont **interdits avant 12 ans**, les antisécrétoires déconseillés avant 15 ans, et certains absorbants contre-indiqués avant 2 ans. D’où l’importance de demander un avis médical plutôt que d’utiliser la trousse des adultes.

## Au quotidien
**Dès les premières selles liquides**
- Proposez le SRO **très régulièrement**, par petites gorgées (à la cuillère, au gobelet, à la seringue ou au biberon selon l’âge), et laissez l’enfant boire à sa soif.
- S’il vomit, attendez quelques minutes puis reprenez par toutes petites quantités, plus souvent.
- Continuez l’allaitement. Pour l’alimentation, suivez les conseils du médecin.

**Surveiller**
- Notez le nombre de selles, les vomissements, ce que l’enfant boit, et s’il urine (couches mouillées).
- Santé.fr indique que, avant 1 an, plus de 6 à 7 selles liquides par jour signale une diarrhée importante.
- Si vous avez un pèse-bébé à disposition, la perte de poids aide le médecin à évaluer la gravité.
- Signes de déshydratation à guetter : bouche et lèvres sèches, yeux cernés ou enfoncés, peu d’urines, enfant inhabituellement somnolent, mou, grisâtre ou au contraire très agité.

**Éviter la contagion**
- Lavage des mains au savon après chaque change ou passage aux toilettes, et avant de préparer les repas.
- Linge souillé lavé à part, toilettes ou pot nettoyés après chaque épisode.

## Questions fréquentes
**Puis-je remplacer le SRO par du soda ou du jus ?** Non : ces boissons ne contiennent pas les sels minéraux nécessaires et sont souvent trop sucrées. Le SRO de pharmacie reste la référence ; emportez-en avant de partir.

**Je n’ai pas de SRO sur place : que faire ?** Cherchez une pharmacie et demandez des sachets de réhydratation ; l’Institut Pasteur conseille de connaître les sachets de réhydratation orale de type OMS avant de partir. En attendant, continuez à faire boire l’enfant (sein, eau sûre) et demandez un avis médical.

**Le médicament antidiarrhéique que je prends moi-même peut-il aider mon enfant ?** Non, ne le lui donnez pas : plusieurs sont interdits ou déconseillés chez l’enfant selon l’âge.

**Quand peut-il reprendre la plage et la piscine ?** Quand la diarrhée s’est arrêtée et qu’il a retrouvé son énergie. En attendant, gardez-le au frais et à l’ombre.

## Quand demander conseil
Consultez **rapidement** un médecin si l’enfant a moins de 6 mois, si les vomissements persistent et qu’il ne garde pas ce qu’il boit, si la diarrhée ne s’arrête pas, s’il a de la fièvre, du sang dans les selles, ou si vous voyez des signes de déshydratation. Appelez le **15** (ou le **112**, ou le numéro d’urgence local) s’il est très somnolent, difficile à réveiller, mou, grisâtre, ou s’il refuse totalement de boire.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'securite', safety_critical: true,
    slug: 'animaux-en-voyage-rage-morsure-enfant-que-faire',
    title: 'Chiens, singes, chats errants en voyage : prévenir les morsures et réagir face au risque de rage',
    summary: 'La rage est présente dans la quasi-totalité des pays : pourquoi les enfants sont plus exposés, les règles pour approcher (ou non) les animaux, et les gestes en cas de morsure, griffure ou léchage.',
    tags: ['rage', 'morsure chien voyage', 'singe', 'griffure', 'animaux errants', 'vaccin rage enfant', 'voyage enfant', 'morsure étranger'],
    sources: [S.pasteurVoyage, S.ameliVaccVoyage, S.mpediaVaccVoyage],
    body_md: `## En bref
- La **rage** est une maladie **toujours mortelle** une fois déclarée, présente dans la **quasi-totalité des pays** ; le chien est le principal vecteur, mais tout mammifère peut la transmettre, rappelle l’Institut Pasteur.
- Les enfants sont **plus exposés** : ils approchent volontiers les animaux, et l’Institut Pasteur demande de redoubler de vigilance avec eux.
- Règle simple : **ne pas approcher, caresser ni toucher** les animaux, même familiers, jeunes ou morts.
- Après une morsure, une griffure ou un léchage sur une plaie : **laver 15 minutes** à l’eau et au savon, rincer, appliquer un antiseptique et **consulter rapidement**.
- Une vaccination avant le départ peut être proposée selon le séjour ; elle ne dispense jamais de consulter après une exposition.

## Comprendre
Le virus de la rage se transmet par la salive d’un animal infecté, lors d’une morsure, d’une griffure ou d’un léchage sur une peau abîmée ou une muqueuse. L’Institut Pasteur souligne qu’un animal peut être **contagieux avant d’avoir des symptômes** : un chien qui paraît en bonne santé n’écarte pas le risque.

Une fois les signes de la maladie apparus, il n’y a plus de traitement efficace. Mais un **traitement après exposition**, débuté rapidement, est très efficace : c’est pourquoi il faut consulter **sans attendre** une structure médicale après tout contact à risque, même minime.

L’Assurance Maladie indique que la vaccination antirabique **avant exposition** est recommandée pour les séjours prolongés ou aventureux en zone à haut risque, et pour l’enfant **dès qu’il commence à marcher**, plus exposé aux morsures et griffures. mpedia (AFPA) précise qu’elle se fait en trois injections et qu’elle **ne dispense pas** d’un traitement après exposition, mais qu’elle le simplifie. Le choix se fait avec le médecin ou le centre de vaccinations internationales, selon la destination et le type de séjour.

## Au quotidien
**Expliquer les règles aux enfants avant de partir**
- « On ne touche pas les animaux qu’on ne connaît pas, même s’ils ont l’air gentils. »
- « On ne donne pas à manger aux singes, aux chiens ou aux chats des rues. »
- « Si un animal t’a griffé, mordu ou léché une égratignure, tu le dis tout de suite, même si ça ne fait pas mal. »
- Avec les plus petits, gardez-les près de vous dans les lieux où circulent des animaux (temples, marchés, plages, sites touristiques avec des singes).

**Sur place**
- Ne laissez pas traîner de nourriture dans les sacs ouverts : elle attire singes et chiens.
- Gardez une distance avec les animaux, même apparemment domestiques.
- Ne ramenez **aucun animal** en France : c’est strictement interdit sans certificat sanitaire et vaccinal officiel, rappelle l’Institut Pasteur, avec des sanctions prévues.

**En cas de morsure, griffure ou léchage sur une plaie**
1. Lavez la zone **15 minutes** à l’eau et au savon, puis rincez abondamment.
2. Appliquez un antiseptique.
3. **Consultez rapidement** une structure médicale, sur place, même si la plaie paraît minime et même si l’enfant est vacciné.
4. Notez le lieu, l’animal, les circonstances, et si possible ce qu’il advient de l’animal.

**Autres animaux**
- Contre les serpents, scorpions et araignées : chaussures montantes, pantalons longs, faire du bruit en marchant, secouer vêtements, chaussures et literie avant de les utiliser.

## Questions fréquentes
**Le chiot de l’hôtel l’a juste léché sur une égratignure : faut-il consulter ?** Oui. Un léchage sur une peau abîmée est une exposition possible. Lavez, désinfectez et consultez.

**Mon enfant a été vacciné avant de partir : doit-il quand même consulter ?** Oui. La vaccination préventive ne dispense pas d’un traitement après exposition ; elle réduit le nombre d’injections nécessaires.

**Nous sommes rentrés et il m’avoue une griffure de chat survenue pendant le voyage : est-il trop tard ?** Consultez sans attendre votre médecin ou un centre antirabique et expliquez la situation : il évaluera la conduite à tenir.

## Quand demander conseil
Consultez **rapidement** après toute morsure, griffure ou léchage sur une plaie par un mammifère en voyage, même au retour. Parlez de la vaccination antirabique avec le médecin **plusieurs semaines avant** un séjour long ou isolé. Appelez le **15** (ou le numéro d’urgence local) en cas de morsure importante, de saignement abondant, de morsure au visage ou au cou, ou de piqûre ou morsure d’animal venimeux, en décrivant l’animal, sans garrot ni succion.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'sommeil',
    slug: 'decalage-horaire-bebe-enfant-voyage-lointain',
    title: 'Décalage horaire avec un bébé ou un enfant : adapter les rythmes pas à pas',
    summary: 'Avant le vol, pendant le voyage et à l’arrivée : comment utiliser la lumière, les repas et les siestes pour aider votre enfant à se caler sur l’heure locale, et pourquoi éviter la mélatonine en complément alimentaire.',
    tags: ['décalage horaire', 'jet lag', 'sommeil bébé voyage', 'fuseau horaire', 'vol long-courrier', 'sieste', 'mélatonine enfant', 'rythme enfant'],
    sources: [S.ameliJetLag],
    body_md: `## En bref
- L’Assurance Maladie conseille de **décaler progressivement** coucher, lever et repas quelques jours avant le départ, et d’adopter **au plus vite** les horaires locaux.
- La **lumière du jour** est le meilleur allié : s’y exposer au bon moment aide l’horloge interne à se recaler.
- Une **sieste courte** à l’arrivée peut aider ; chez le tout-petit, gardez des siestes adaptées à son âge en les calant sur l’heure locale.
- Les **compléments alimentaires à base de mélatonine sont à éviter** chez les enfants et les adolescents.
- Pour un séjour très court (2 à 3 jours), garder le rythme de la maison peut être plus simple.

## Comprendre
Notre corps fonctionne selon une **horloge interne** d’environ 24 heures, qui règle le sommeil, la faim et la vigilance. Quand on traverse plusieurs fuseaux horaires, cette horloge reste quelque temps à l’heure de départ : c’est le décalage horaire, ou « jet lag ». Il se traduit par des difficultés d’endormissement, des réveils nocturnes, une fatigue en journée et parfois des troubles de l’appétit.

L’Assurance Maladie ne donne pas de conseils spécifiques aux enfants, mais ses recommandations générales s’adaptent bien à la vie de famille. Les enfants, surtout les tout-petits, ont besoin de **repères** : lumière, repas, bain, histoire du soir. Ce sont ces rituels, déplacés à l’heure locale, qui aident leur organisme à s’ajuster.

Vers l’est, il faut s’endormir plus tôt que d’habitude ; vers l’ouest, rester éveillé plus tard : la lumière se gère différemment dans chaque cas.

## Au quotidien
**Quelques jours avant le départ**
- Si c’est possible, décalez doucement l’heure du coucher, du lever et des repas vers celle de la destination. Avec un bébé, faites-le par petites étapes, sans forcer.
- Privilégiez, si vous avez le choix, un **vol de jour**, qui limite la dette de sommeil.

**Pendant le vol**
- Réglez votre montre sur l’heure de destination pour vous repérer.
- Laissez l’enfant dormir quand il en a besoin, en reproduisant ses rituels (doudou, gigoteuse, berceuse).
- Proposez régulièrement à boire.

**À l’arrivée**
- Calez rapidement les **repas** et le **coucher** sur l’heure locale.
- **Voyage vers l’est** : sortez à la lumière le matin et avant le déjeuner.
- **Voyage vers l’ouest** : profitez de la lumière en fin d’après-midi et en soirée pour retarder l’endormissement.
- Une sieste courte peut dépanner un enfant épuisé ; pour un bébé, gardez ses siestes habituelles mais aux heures locales, en évitant une sieste trop tardive qui retarderait la nuit.
- Évitez les activités excitantes et les écrans avant le coucher.
- Comptez souvent quelques jours d’ajustement : soyez indulgent(e) avec vous-même et avec l’enfant.

**Au retour**
- Les mêmes principes s’appliquent dans l’autre sens : si possible, prévoyez un ou deux jours de transition avant la reprise de la crèche ou de l’école.

## Questions fréquentes
**Puis-je donner de la mélatonine à mon enfant pour l’aider ?** L’Assurance Maladie indique que les compléments alimentaires contenant de la mélatonine sont **à éviter chez les enfants et les adolescents**. La mélatonine médicament, chez l’enfant, est réservée à des troubles du sommeil bien particuliers, pas au décalage horaire. Ne donnez aucun produit pour dormir sans avis médical.

**Mon bébé se réveille en pleine nuit pour jouer : que faire ?** Gardez la pièce dans la pénombre, parlez doucement, évitez les jeux et les écrans, proposez une tétée ou un câlin si besoin, puis recouchez-le. Le jour, exposez-le à la lumière naturelle.

**Pour une semaine de vacances, faut-il vraiment changer de rythme ?** Pour 2 à 3 jours, l’Assurance Maladie suggère de garder le rythme de départ. Pour une semaine ou plus, s’adapter à l’heure locale est en général plus confortable.

## Quand demander conseil
Parlez-en au médecin si votre enfant a une maladie chronique avec un traitement à heure fixe : il vous dira comment adapter les prises. Consultez si les troubles du sommeil persistent bien après le retour ou s’accompagnent d’autres signes (fièvre, refus de manger, abattement). Si l’épuisement des parents devient lourd, n’hésitez pas à en parler à un professionnel ; en cas de détresse, le **3114** est joignable jour et nuit.

${FIN}`,
  },
  // ------------------------------------------------------------------ soleil, mer, montagne, chaleur, froid
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique',
    slug: 'journee-a-la-plage-avec-bebe-et-enfant-soleil-organisation',
    title: 'Une journée à la plage avec bébé ou un jeune enfant : horaires, ombre, eau et sable',
    summary: 'Organiser la plage en famille quand on a un bébé ou un tout-petit : quelles heures privilégier, pourquoi le parasol ne suffit pas, que mettre dans le sac et comment surveiller la baignade.',
    tags: ['plage bébé', 'plage enfant', 'soleil', 'parasol', 'tee-shirt anti-UV', 'vacances mer', 'chapeau', 'sable chaud'],
    sources: [S.ameliSoleil, S.santeSoleilEnfant, S.santeDeshyd],
    body_md: `## En bref
- Les **bébés ne doivent pas être exposés au soleil** : ombre, vêtements couvrants et chapeau à larges bords, rappelle l’Assurance Maladie.
- Évitez la plage aux heures les plus fortes : **entre 12 h et 16 h** en métropole l’été, **entre 10 h et 14 h** en outre-mer, selon l’Assurance Maladie.
- Le **parasol ne protège pas complètement** : le sable et l’eau réfléchissent une partie des UV.
- Un enfant qui joue au soleil s’expose **autant** qu’un enfant allongé : **tee-shirt anti-UV**, chapeau, lunettes, crème indice 50.
- Faites **boire régulièrement**, sans attendre la soif, et ne quittez jamais l’enfant des yeux près de l’eau.

## Comprendre
La plage cumule plusieurs facteurs qui augmentent l’exposition aux UV : un soleil souvent fort, peu d’abri naturel, et des surfaces claires (sable, eau) qui **renvoient le rayonnement**. Le vent frais et les nuages donnent une fausse impression de sécurité : l’Assurance Maladie rappelle qu’il faut se protéger même par temps couvert.

La peau des enfants est fine et leur système pigmentaire immature. Les coups de soleil et les expositions intenses pendant l’enfance sont un facteur de risque majeur de mélanome à l’âge adulte. Santé.fr (avec mpedia) insiste : ne laissez jamais un enfant **nu ou torse nu** à la plage, et protégez sa peau même s’il est déjà bronzé, car le bronzage ne protège pas.

Pour les tout-petits, Santé.fr recommande, pendant les premiers mois, d’**éviter la plage entre 11 h et 17 h**, en gardant bébé au frais, et rappelle que l’ombre des arbres et des parasols laisse passer des UV.

## Au quotidien
**Choisir le moment**
- Arrivez tôt le matin et revenez en fin d’après-midi ; gardez le milieu de journée pour le repas et la sieste à l’ombre, au frais.
- Pour un bébé de quelques mois, une courte balade au bord de l’eau en début ou en fin de journée, à l’ombre, peut suffire.

**Le sac de plage**
- Tee-shirt anti-UV (ou vêtement long et léger), chapeau à larges bords couvrant nuque et oreilles, lunettes de soleil enveloppantes (catégorie 3 ou 4, marquage CE).
- Crème solaire pour enfant, indice 50, à renouveler toutes les 2 heures et après chaque baignade.
- Grande bouteille d’eau, gourde ou biberon, collations rafraîchissantes (fruits, laitages au frais).
- Parasol ou abri, serviette sèche de rechange, chaussons pour le sable chaud ou les rochers.

**Sur place**
- Installez-vous à l’ombre, en gardant à l’esprit que l’ombre ne bloque pas tous les UV : gardez chapeau et tee-shirt.
- Proposez à boire **régulièrement** ; un bébé allaité peut être mis au sein plus souvent.
- Vérifiez la température du sable avant de poser l’enfant ou ses pieds.
- Changez le maillot mouillé contre un vêtement sec pour le repos.
- Pour la baignade, désignez **un adulte qui ne fait que surveiller**, et restez à portée de bras des plus petits.

**Au retour**
- Rincez la peau, appliquez un soin apaisant si besoin, et observez : rougeur, chaleur, fatigue inhabituelle.

## Questions fréquentes
**Mon bébé de 4 mois peut-il aller à la plage ?** Il peut venir avec vous à condition de ne pas être exposé au soleil : à l’ombre, couvert, avec un chapeau, aux heures fraîches, et en surveillant qu’il n’ait pas trop chaud.

**La crème indice 50 suffit-elle à le protéger ?** Non. Elle complète l’ombre, les vêtements et le chapeau ; elle ne permet pas de rester plus longtemps au soleil.

**Il fait nuageux, faut-il quand même mettre de la crème ?** Oui : les nuages ne suppriment pas les UV.

**Le parasol suffit-il pour la sieste de bébé ?** Non : l’Assurance Maladie rappelle que les parasols ne protègent pas complètement. Gardez bébé couvert, avec un chapeau, et préférez un endroit frais et ombragé, voire le logement aux heures chaudes.

## Quand demander conseil
Consultez si un coup de soleil est étendu, forme des cloques, ou s’accompagne de fièvre, de maux de tête ou de vomissements, et toujours s’il touche un bébé. Appelez le **15** (ou le **112**) si l’enfant est très somnolent, confus, a une forte fièvre après une exposition au soleil, ou perd connaissance. Pour un enfant qui a avalé de l’eau en se baignant et qui tousse ou respire mal, appelez aussi les secours.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'materiel',
    slug: 'creme-solaire-enfant-choisir-indice-appliquer-renouveler',
    title: 'Crème solaire pour enfant : choisir l’indice, bien l’appliquer et la renouveler',
    summary: 'Indice SPF, UVA et UVB, résistance à l’eau, date de péremption, ordre crème puis répulsif : le mode d’emploi d’un produit solaire pour les enfants, qui ne remplace jamais l’ombre et les vêtements.',
    tags: ['crème solaire enfant', 'indice 50', 'SPF', 'protection solaire', 'UVA UVB', 'écran total', 'indice UV', 'renouveler crème'],
    sources: [S.santeProduitSolaire, S.ameliSoleil, S.santeSoleilEnfant],
    body_md: `## En bref
- La crème solaire est un **complément** : la première protection reste **l’ombre**, puis les **vêtements**, le **chapeau** et les **lunettes**.
- Pour les enfants, l’Assurance Maladie recommande un **indice 50**, voire le considère comme indispensable, avec une protection contre les **UVA et les UVB**.
- Appliquez une **couche généreuse** sur toutes les zones découvertes, environ **30 minutes avant** l’exposition, même par temps nuageux.
- **Renouvelez toutes les 2 heures** et après chaque baignade, activité intense ou forte transpiration, même si la crème est dite « résistante à l’eau ».
- Vérifiez la **date de péremption** : au-delà, l’efficacité diminue.

## Comprendre
Les **UVB** provoquent surtout les coups de soleil ; les **UVA** pénètrent plus profondément et participent au vieillissement de la peau. Les deux sont impliqués dans les cancers cutanés, dont plus de 80 % sont liés à une surexposition, selon Santé.fr. L’emballage doit donc mentionner une protection contre les deux types de rayons.

L’**indice (SPF)** mesure surtout la protection contre les UVB. Il existe plusieurs niveaux : faible (6 à 10), moyen (15 à 25), haut (30 à 50) et très haut (50+). Plus la peau est claire et plus l’ensoleillement est fort, plus l’indice doit être élevé. Santé.fr rapporte les recommandations du Haut Conseil de la santé publique : SPF 30 minimum pour un indice UV de 3 à 7, et **SPF 50 ou plus fortement conseillé** à partir d’un indice UV de 8. L’Assurance Maladie précise qu’en été, l’indice atteint souvent 7 ou 8 en France et peut dépasser 10 en haute montagne.

À savoir : l’appellation « **écran total** » n’est plus autorisée en France. Aucune crème ne bloque 100 % des UV, et une crème d’indice élevé **ne permet pas de rester plus longtemps** au soleil.

Pour les enfants, Santé.fr (avec mpedia) indique que les **filtres minéraux** semblent préférables, et conseille un produit adapté aux enfants et résistant à l’eau.

## Au quotidien
**Choisir**
- Un produit pour enfants, indice 50 ou 50+, mentionnant **UVA et UVB**.
- Vérifiez la composition si votre enfant a déjà réagi à un produit (allergie, réaction au soleil).
- Évitez les « huiles solaires » sans filtre (accélérateurs de bronzage), les autobronzants et les compléments au carotène : ils ne protègent pas.
- Notez la date d’ouverture ; ne réutilisez pas un tube entamé depuis longtemps ou exposé à la chaleur sans vérifier sa date.

**Appliquer**
- Environ 30 minutes avant de sortir, sur peau sèche.
- Une **couche épaisse** sur toutes les zones découvertes, sans oublier : oreilles, tempes, nuque, racine des cheveux, dos des mains, dessus des pieds.
- Avec un tout-petit qui gigote, transformez le moment en jeu (« on dessine des points sur le nez »), et appliquez par zones.

**Renouveler**
- Toutes les **2 heures**, et après chaque baignade (après avoir séché l’enfant), activité sportive ou forte transpiration.
- Gardez le tube à l’ombre, dans le sac, pour qu’il ne chauffe pas.

**Avec un répulsif anti-moustiques**
- Appliquez la crème solaire d’abord, puis le répulsif au moins **20 minutes** après.

## Questions fréquentes
**Peut-on mettre de la crème solaire à un bébé de quelques mois ?** Avant 1 an, l’enfant ne doit pas être exposé au soleil : la protection repose sur l’ombre et les vêtements. Pour une petite zone découverte, demandez conseil au pharmacien ou au médecin sur le produit adapté.

**La crème de l’an dernier est-elle encore bonne ?** Regardez la date de péremption et l’indication de durée après ouverture. Au-delà, l’efficacité diminue, rappelle Santé.fr.

**Mon enfant a la peau mate, a-t-il besoin d’une crème ?** Oui. Le risque est plus élevé pour les peaux claires, mais l’Assurance Maladie recommande une protection quel que soit le phototype, et une protection renforcée pour tous les enfants.

## Quand demander conseil
Demandez conseil au pharmacien pour choisir un produit adapté à l’âge, à la peau et à la destination. Consultez si l’enfant présente une éruption, des démangeaisons ou des plaques après l’application, ou un coup de soleil avec cloques ou fièvre. Appelez le **15** en cas de gonflement du visage, de gêne respiratoire ou de malaise.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique',
    slug: 'montagne-en-ete-avec-bebe-enfant-altitude-soleil-randonnee',
    title: 'La montagne l’été avec un bébé ou un enfant : altitude, soleil, oreilles et randonnée',
    summary: 'Jusqu’où monter avec un tout-petit, pourquoi les UV sont plus forts en altitude, comment éviter les douleurs d’oreille en téléphérique et quelles précautions prendre en porte-bébé.',
    tags: ['montagne bébé', 'altitude bébé', 'randonnée enfant', 'porte-bébé', 'téléphérique', 'UV montagne', 'mal des montagnes', 'vacances montagne été'],
    sources: [S.mpediaAltitude, S.ameliSoleil, S.santeUv],
    body_md: `## En bref
- mpedia (AFPA) indique qu’un bébé peut aller jusqu’à environ **2 000 m** ; au-delà, il faut rester prudent et **monter par paliers**.
- Le **mal aigu des montagnes** apparaît au-dessus de 3 000 m, avec des signes **très atypiques** chez le nourrisson et l’enfant.
- Les **montées et descentes rapides** (téléphérique, route de col) peuvent faire mal aux oreilles : faites **téter ou boire** l’enfant.
- En altitude, l’indice UV peut **dépasser 10** : chapeau, vêtements couvrants, lunettes de catégorie 3 ou 4, crème indice 50.
- En porte-bébé, surveillez la **circulation des jambes** et la température : bébé, immobile, ne se réchauffe pas en marchant.

## Comprendre
**L’altitude.** mpedia rappelle que la cabine d’un avion est pressurisée à un niveau proche de 2 000 m : à cette altitude, l’oxygène diminue très légèrement et la gêne n’apparaît qu’à l’effort. Au-delà, l’organisme a besoin de s’acclimater, d’où l’intérêt de monter progressivement. Au-dessus de 3 000 m peut survenir le mal aigu des montagnes ; chez le tout-petit, il est difficile à repérer car ses signes sont atypiques. La prudence est donc de mise pour les sommets accessibles en remontée mécanique.

**Les oreilles.** Une variation rapide d’altitude peut provoquer un barotraumatisme : douleur d’oreille, voire, rarement, perforation du tympan. Il est favorisé par un rhume en cours, des otites à répétition ou une otite séro-muqueuse. mpedia conseille des paliers lors des montées ou descentes rapides et de faire boire l’enfant pour l’aider à déglutir.

**Le soleil.** En altitude, l’air filtre moins les UV. Santé.fr indique qu’en juin, l’indice UV atteint 10 ou plus en montagne ; l’Assurance Maladie rappelle que l’indice peut dépasser 10 en haute montagne et que le vent frais donne un faux sentiment de sécurité. Les yeux sont aussi exposés : les lunettes de **catégorie 4** conviennent à la haute montagne (mais pas à la conduite).

## Au quotidien
**Organiser le séjour**
- Choisissez un hébergement à altitude modérée et gardez les sommets pour les plus grands, en montant progressivement.
- Si votre enfant est enrhumé ou a une otite, évitez les remontées mécaniques rapides et demandez conseil au médecin.
- Prévoyez des balades courtes, adaptées au rythme de l’enfant, avec des pauses régulières.

**Le sac de randonnée**
- Eau en quantité suffisante, collations, chapeau à larges bords, lunettes de soleil enveloppantes, crème solaire indice 50.
- Couches de vêtements : le temps change vite en montagne, et la température baisse avec l’altitude et en fin de journée.
- Trousse de base, dont un **tire-tiques**, et vêtements de pluie.

**En porte-bébé**
- Gardez le visage de bébé dégagé.
- Vérifiez régulièrement ses mains, ses pieds et ses jambes : coloration, température, pas de compression.
- Protégez-le du soleil (il ne peut pas se mettre à l’ombre) et du froid (il ne bouge pas).

**En téléphérique ou sur une route de col**
- Proposez le sein, le biberon, la gourde, ou une collation à mâcher pendant la montée et surtout la descente.

## Questions fréquentes
**Peut-on emmener un bébé de 2 mois à 1 800 m ?** D’après mpedia, une altitude autour de 2 000 m est envisageable chez le bébé. Pour un très jeune nourrisson, un prématuré ou un bébé ayant une maladie respiratoire ou cardiaque, demandez l’avis du pédiatre.

**Faut-il éviter les sommets à 3 000 m en téléphérique ?** Avec un tout-petit, mieux vaut s’abstenir : c’est au-delà de 3 000 m que survient le mal aigu des montagnes, et ses signes sont difficiles à repérer chez l’enfant.

**Il fait frais, faut-il quand même de la crème ?** Oui. La fraîcheur ne protège pas des UV, plus forts en altitude.

## Quand demander conseil
Demandez l’avis du médecin avant un séjour en altitude si votre enfant est très jeune, a une maladie chronique (respiratoire, cardiaque) ou une infection ORL. Sur place, redescendez et consultez si l’enfant devient inhabituellement grognon, somnolent, vomit, refuse de manger ou respire vite en altitude. Appelez le **15** ou le **112** en cas de malaise, de gêne respiratoire, de chute avec choc à la tête, ou si l’enfant ne réagit plus normalement.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'vie-pratique',
    slug: 'vacances-a-la-neige-bebe-enfant-froid-soleil-route',
    title: 'Vacances à la neige avec bébé ou enfant : froid, soleil, porte-bébé et route enneigée',
    summary: 'Comment habiller un tout-petit pour sortir dans la neige, pourquoi préférer la poussette au porte-bébé par grand froid, se protéger de la réverbération et préparer le trajet en voiture.',
    tags: ['neige bébé', 'ski enfant', 'froid bébé', 'vacances au ski', 'porte-bébé froid', 'réverbération', 'lunettes neige', 'route enneigée'],
    sources: [S.santeFroidEnfant, S.ameliFroid, S.ameliSoleil],
    body_md: `## En bref
- Les bébés **refroidissent vite** : ils perdent beaucoup de chaleur par la tête et ne peuvent ni se réchauffer en bougeant ni dire qu’ils ont froid, rappelle Santé.fr.
- Par **grand froid**, évitez de sortir avec un nourrisson ; l’Assurance Maladie déconseille les sorties par températures très basses avant **3 mois**.
- Si vous sortez, préférez **landau ou poussette** au porte-bébé, qui peut comprimer les jambes et favoriser les **gelures** des pieds et des jambes.
- La **neige réfléchit** les UV : chapeau ou bonnet, lunettes de **catégorie 3 ou 4** enveloppantes et crème indice 50, même en hiver.
- Sur la route, préparez une **réserve** (eau, nourriture, couvertures, vêtements chauds) et retirez le manteau de l’enfant avant de l’attacher.

## Comprendre
Un bébé refroidit vite, et sa tête représente une grande part de sa surface corporelle. Dans un porte-bébé ou une poussette, il reste immobile : contrairement à l’adulte qui marche, il ne se réchauffe pas. C’est pourquoi Santé.fr recommande de bien couvrir **la tête, les mains et les pieds**, et de **superposer plusieurs couches** de vêtements.

En montagne, le froid s’accompagne souvent de **vent**, qui accentue la sensation de froid, et d’un soleil intense. La neige est une surface très réfléchissante : l’Assurance Maladie rappelle que les sols réfléchissants et l’altitude donnent un faux sentiment de sécurité. Les yeux des enfants, plus fragiles, doivent être protégés.

Les **engelures** se manifestent sur les extrémités (doigts, orteils, oreilles, nez) par une zone rouge ou violacée, douloureuse et gonflée, décrit l’Assurance Maladie. Des vêtements humides et des chaussures trop serrées les favorisent.

## Au quotidien
**Habiller pour sortir**
- Plusieurs couches fines plutôt qu’une seule épaisse ; une couche extérieure imperméable au vent et à l’eau.
- Bonnet couvrant les oreilles, moufles, chaussettes chaudes, bottes **larges et imperméables** pour ne pas comprimer les pieds.
- Changez sans attendre les vêtements mouillés par la neige.
- Vérifiez régulièrement la température de la nuque de bébé (ni froide, ni moite) et l’aspect de ses mains et pieds.

**Organiser les sorties**
- Avec un nourrisson, sorties courtes, aux heures les plus douces, à l’abri du vent.
- Par grand froid, préférez le landau ou la poussette, qui permettent à l’enfant de bouger, au porte-bébé.
- Pour les plus grands, alternez activités dans la neige et pauses au chaud, avec boissons chaudes (non brûlantes) et collations.

**Se protéger du soleil**
- Lunettes enveloppantes de catégorie 3 ou 4 avec marquage CE, ou masque adapté à l’âge.
- Crème indice 50 sur le visage, les oreilles et le cou, renouvelée régulièrement.

**La route**
- Consultez la météo et l’état des routes ; reportez un long trajet non indispensable par neige ou verglas.
- Équipez la voiture selon les obligations de la zone, faites le plein, emportez eau, nourriture, couvertures dont une de survie, vêtements de rechange et médicaments habituels.
- Retirez le manteau de l’enfant avant de l’attacher dans son siège, puis couvrez-le par-dessus le harnais.
- Si vous êtes bloqué : moteur 10 minutes par heure, fenêtre entrouverte, pot d’échappement dégagé de la neige (risque de **monoxyde de carbone**).

## Questions fréquentes
**Mon bébé peut-il dormir dehors dans sa poussette à la montagne ?** Par grand froid, évitez. S’il fait une sieste en poussette lors d’une sortie, vérifiez souvent qu’il n’a ni froid ni trop chaud, et ne le couvrez pas d’une couverture qui pourrait remonter sur son visage.

**À partir de quel âge peut-il faire du ski ?** Cela dépend de son développement et de son envie ; parlez-en avec l’école de ski, qui propose souvent des jardins d’enfants.

**Faut-il des lunettes de soleil à un bébé ?** Ses yeux sont fragiles : protégez-les par l’ombre de la capote et un chapeau, et, si vous le pouvez, des lunettes adaptées à son âge et bien filtrantes.

## Quand demander conseil
Consultez si une zone de peau reste blanche, dure, insensible ou très douloureuse après un retour au chaud, ou si des cloques apparaissent. Appelez le **15** ou le **112** si un enfant est très froid au toucher, pâle, somnolent, difficile à réveiller ou respire mal, ou en cas de suspicion d’intoxication au monoxyde de carbone (maux de tête, nausées, malaise de plusieurs personnes dans un même lieu).

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'sante-enfant', safety_critical: true,
    slug: 'canicule-en-vacances-enfant-reconnaitre-coup-de-chaleur',
    title: 'Canicule en vacances : protéger son enfant et reconnaître un coup de chaleur',
    summary: 'Location sans climatisation, visites en plein soleil, longues journées dehors : les gestes pour garder les enfants au frais pendant une vague de chaleur, les signes d’alerte et les réflexes en attendant les secours.',
    tags: ['canicule enfant', 'coup de chaleur', 'insolation', 'déshydratation', 'vague de chaleur vacances', 'bébé chaleur', 'hyperthermie', 'fortes chaleurs'],
    sources: [S.ameliMaladiesCanicule, S.ameliCaniculeRisque, S.santeCoupChaleur],
    body_md: `## En bref
- Proposez de l’**eau fraîche au moins une fois par heure**, sans attendre la soif, y compris la nuit si l’enfant se réveille, conseille l’Assurance Maladie.
- Laissez les bébés **en couche**, y compris pour dormir, et habillez les plus grands léger, ample et clair, avec un chapeau dehors.
- Sortez **tôt le matin ou le soir** et limitez les promenades des nourrissons de moins d’un an.
- Le **coup de chaleur** est une **urgence** : peau très chaude, troubles du comportement, somnolence, vomissements, fièvre élevée.
- En cas de coup de chaleur suspecté, appelez **immédiatement le 15 ou le 112** et rafraîchissez l’enfant en attendant.

## Comprendre
Les enfants, surtout les plus jeunes, sont **plus vulnérables** à la chaleur : ils se déshydratent plus vite et dépendent des adultes pour boire, se mettre à l’ombre ou se découvrir. Santé.fr rappelle qu’un nourrisson peut se **déshydrater en quelques heures**.

L’Assurance Maladie distingue plusieurs situations :
- l’**insolation**, due à l’exposition directe de la tête au soleil : maux de tête violents, somnolence, nausées, fièvre élevée, parfois perte de connaissance ;
- la **déshydratation** : soif, bouche sèche, urines rares et foncées, fatigue, puis yeux enfoncés, peau sèche, fièvre, changement de comportement ;
- le **coup de chaleur**, urgence médicale : température très élevée, troubles de la conscience (confusion, convulsions, perte de connaissance), peau rouge et chaude.

Chez le nourrisson, Santé.fr décrit comme signes de déshydratation une baisse de tonus, un teint grisâtre, des yeux cernés, une peau et une langue sèches, une fièvre et parfois des convulsions.

L’Assurance Maladie précise que le **paracétamol et l’aspirine** sont déconseillés en cas de coup de chaleur : le premier est inefficace, le second peut gêner l’adaptation de l’organisme. C’est le **rafraîchissement** et l’appel aux secours qui comptent.

## Au quotidien
**Dans le logement**
- Gardez les volets fermés le jour ; aérez seulement quand l’air extérieur est plus frais.
- Installez l’enfant dans la pièce la plus fraîche ; sinon, passez quelques heures dans un lieu frais à proximité.
- Ne laissez jamais un enfant seul près d’une fenêtre ouverte ou sur un balcon.
- Proposez des **bains tièdes** (un à deux degrés sous la température du corps), toujours sous surveillance, ou brumisez son visage et son corps.

**Les journées**
- Programmez visites et balades tôt le matin et en soirée ; gardez le milieu de journée pour des activités calmes à l’intérieur.
- Eau à volonté, fruits, légumes et laitages riches en eau.
- Pendant un pic de pollution, restez attentif à la toux, à la gêne respiratoire ou à une crise d’asthme.

**En voiture**
- Assez d’eau pour tout le trajet, pare-soleil, pauses pour faire boire.
- **Jamais** d’enfant seul dans un véhicule.

**Si l’enfant a eu trop chaud**
1. Mettez-le à l’ombre et au calme, dans une pièce fraîche.
2. Déshabillez-le et rafraîchissez-le : linges humides, aspersion d’eau fraîche, courant d’air.
3. Faites-le boire s’il est bien conscient.
4. Si vous suspectez un coup de chaleur, appelez **le 15 ou le 112** sans attendre.

## Questions fréquentes
**Puis-je donner un médicament contre la fièvre après un coup de chaleur ?** L’Assurance Maladie déconseille le paracétamol et l’aspirine dans cette situation. Rafraîchissez l’enfant et appelez les secours, qui vous guideront.

**Le ventilateur suffit-il ?** Il aide à créer un courant d’air, surtout sur une peau humidifiée. Placez-le à distance et hors de portée de l’enfant.

**Mon enfant a des petits boutons rouges qui grattent dans le cou : est-ce grave ?** L’Assurance Maladie décrit une éruption due à la chaleur et à la transpiration, fréquente chez les enfants : rafraîchissez-le et habillez-le en coton ample. Consultez si les démangeaisons sont gênantes ou si l’éruption s’accompagne de fièvre.

## Quand demander conseil
Appelez **immédiatement le 15 ou le 112** si l’enfant a une fièvre élevée après une exposition à la chaleur, s’il est confus, très somnolent, difficile à réveiller, s’il convulse, perd connaissance, vomit, refuse ou ne peut plus boire, ou si sa peau change de couleur (grisâtre, marbrée). Consultez un médecin rapidement pour un nourrisson qui boit moins, mouille moins ses couches ou paraît inhabituellement grognon par forte chaleur.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'securite', safety_critical: true,
    slug: 'baignade-mer-lac-riviere-vacances-enfant-securite',
    title: 'Baignade en mer, lac ou rivière avec des enfants : choisir le lieu et surveiller',
    summary: 'Zones surveillées, drapeaux, qualité de l’eau, cyanobactéries, courant : les points à vérifier avant de se baigner en milieu naturel avec des enfants, et l’organisation de la surveillance entre adultes.',
    tags: ['baignade enfant', 'noyade', 'plage surveillée', 'lac', 'rivière', 'qualité eau de baignade', 'cyanobactéries', 'drapeaux plage'],
    sources: [S.sportsBaignade, S.arsBaignade, S.sportsPiscine],
    body_md: `## En bref
- Restez **avec les enfants** quand ils jouent au bord de l’eau ou dans l’eau, **même en zone surveillée**, et baignez-vous en même temps qu’eux, conseille le ministère des Sports.
- Désignez **un seul adulte responsable** de la surveillance, **qui ne fait rien d’autre** ; restez **à portée de bras** des plus jeunes.
- Préférez les **zones de baignade surveillées** et respectez les **drapeaux** et les consignes des sauveteurs.
- Vérifiez la **qualité de l’eau** (affichage en mairie et sur le site, ou baignades.sante.gouv.fr) ; ne vous baignez pas dans une eau colorée ou couverte d’écume (**cyanobactéries**).
- Se baigner en lac ou en rivière est plus difficile qu’en piscine : courant, froid, profondeur variable.

## Comprendre
La noyade est la première cause de mort accidentelle chez les moins de 25 ans en France, rappelle le ministère des Sports, qui souligne qu’« à tous les âges et dans tous les lieux, la baignade comporte des risques ». Une noyade survient **vite et sans bruit**, même dans peu d’eau. Un enfant qui sait nager doit lui aussi rester sous surveillance continue.

En milieu naturel, d’autres risques s’ajoutent. Les ARS contrôlent la qualité de l’eau des sites de baignade autorisés pendant la saison ; les résultats sont affichés en mairie et sur place, et publiés sur le site du ministère chargé de la santé. Quand l’eau n’est pas conforme, le maire doit interdire la baignade. L’ARS Grand Est conseille aussi d’éviter de se baigner **pendant et juste après la pluie**, qui peut dégrader temporairement la qualité de l’eau.

Les **cyanobactéries**, qui prolifèrent l’été ou au début de l’automne dans les plans d’eau et rivières, forment des films ou écumes colorés (bleu, vert, rouge) ; certaines produisent des toxines. Ne vous baignez pas dans une eau qui a changé de couleur, et tenez les chiens éloignés.

## Au quotidien
**Choisir le lieu**
- Renseignez-vous : zone surveillée, interdite ou dangereuse ? Horaires de surveillance ?
- À l’arrivée, demandez aux sauveteurs les dangers du jour (courants, baïnes, marée, fond).
- Consultez la météo et l’état de la mer.
- Pour un lac ou une rivière, vérifiez que la baignade y est autorisée et consultez les derniers résultats de qualité.

**Organiser la surveillance**
- Avant d’aller dans l’eau, annoncez qui surveille ; passez le relais à voix haute (« À toi de surveiller »).
- Le surveillant ne lit pas, ne regarde pas son téléphone, ne s’endort pas.
- Avec plusieurs adultes et plusieurs enfants, un référent par enfant.
- Pour les plus petits, l’ARS Grand Est conseille des brassards ou un maillot à flotteurs ; ils **ne remplacent jamais** la surveillance.

**Entrer dans l’eau en sécurité**
- Entrez progressivement, surtout si l’eau est froide et après une longue exposition au soleil ou un effort.
- Pas de baignade si l’enfant a froid, frissonne ou ne se sent pas bien.
- Ne poussez et ne forcez jamais un enfant à aller dans l’eau ; pas de jeux de « coulage ».

**Après la baignade**
- Douche et séchage, notamment pour limiter la « dermatite du baigneur » dans certains lacs.
- Sortez de l’eau et rangez les jouets gonflables : ils attirent les enfants vers l’eau.

## Questions fréquentes
**Mon enfant porte des brassards, puis-je m’éloigner un moment ?** Non. Aucun équipement ne remplace la vigilance d’un adulte, rappelle le ministère des Sports.

**Il a bu la tasse et tousse : faut-il s’inquiéter ?** Sortez-le de l’eau. En cas de toux, vomissements, gêne respiratoire, ou si son état ne redevient pas habituel dans les 5 minutes, appelez le **15**, le **18** ou le **112**.

**Quand commencer à apprendre à nager ?** Le ministère des Sports recommande de commencer vers 3 ou 4 ans, par exemple avec le programme d’Aisance aquatique, et indique des cours « Savoir nager » pour les 6-12 ans.

**Peut-on se baigner après le repas ?** L’ARS Grand Est conseille d’attendre environ deux heures après un repas copieux.

## Quand demander conseil
Appelez le **112**, le **18** ou le **15** en cas de noyade ou de suspicion de noyade ; en mer, le **196** depuis la côte. Consultez un médecin si l’enfant présente, après une baignade en milieu naturel, des troubles digestifs, une éruption cutanée ou des problèmes d’oreilles, en indiquant le lieu et la date de la baignade.

${FIN}`,
  },
  {
    ...BASE, journeys: TOUS, category: 'securite', safety_critical: true, max_age_months: 96,
    slug: 'location-de-vacances-securiser-piscine-fenetres-escaliers',
    title: 'Location de vacances, gîte, chez les grands-parents : sécuriser les lieux en arrivant',
    summary: 'Piscine, fenêtres, balcons, escaliers, produits ménagers, médicaments à portée : le tour du logement à faire en arrivant dans un lieu qui n’est pas équipé pour les jeunes enfants.',
    tags: ['location vacances sécurité', 'piscine enfant', 'chute fenêtre', 'défenestration', 'accidents domestiques vacances', 'gîte bébé', 'grands-parents sécurité', 'noyade piscine'],
    sources: [S.sportsPiscine, S.spfFenetres, S.pasteurVoyage],
    body_md: `## En bref
- En vacances, les enfants découvrent un lieu **inconnu**, souvent **non adapté** aux tout-petits : faites le tour du logement **dès l’arrivée**.
- **Piscine** : la majorité des noyades des moins de 6 ans surviennent dans des piscines privées, souvent **en dehors des temps de baignade** ; sécurisez l’accès après chaque baignade.
- **Fenêtres et balcons** : ne laissez jamais un enfant seul près d’une fenêtre ouverte et **éloignez les meubles** sur lesquels il pourrait grimper.
- Rangez en hauteur **médicaments**, produits ménagers, alcool, briquets et petits objets.
- Aucun équipement ne remplace la **surveillance** d’un adulte.

## Comprendre
À la maison, on a pris des habitudes : produits rangés, escaliers fermés, fenêtres sécurisées. Dans une location, un gîte ou chez des proches, ces repères disparaissent, alors que l’attention des adultes est souvent moins soutenue (fatigue du voyage, retrouvailles, apéritifs, plusieurs familles réunies).

Le ministère des Sports rappelle qu’en 2025, **27 % des noyades** ont concerné des enfants de **moins de 6 ans**, principalement dans des **piscines privées**. Les témoignages qu’il relaie décrivent des noyades survenues **hors des temps de baignade**, dont une dans une piscine de location de vacances : un enfant qui s’éloigne quelques minutes pendant que les adultes sont occupés.

Santé publique France a montré, dans une enquête menée en 2013, que les **chutes graves par les fenêtres** concernent surtout des enfants de moins de 6 ans, au printemps et en été, souvent aux heures de préparation des repas. Dans la moitié des cas, un **meuble** était placé sous la fenêtre, et un adulte était présent dans le logement dans la grande majorité des cas.

## Au quotidien
**Le tour du logement en arrivant**
- **Piscine, bassin, mare** : repérez le dispositif de sécurité (barrière, couverture, abri, alarme) et vérifiez qu’il fonctionne et qu’il est bien refermé. Gardez les portes donnant sur l’extérieur fermées.
- **Fenêtres et balcons** : éloignez lits, chaises, canapés, coffres et pots de fleurs ; vérifiez les garde-corps ; gardez les fenêtres fermées ou bloquées quand l’enfant est dans la pièce sans vous.
- **Escaliers et mezzanines** : repérez les accès dangereux ; une barrière de sécurité portable peut être utile.
- **Cuisine** : manches de casseroles vers l’intérieur, produits ménagers et couteaux rangés en hauteur.
- **Médicaments** : ceux des adultes (et des grands-parents) hors de portée et hors de vue, y compris dans les sacs et les tables de nuit. L’Institut Pasteur rappelle aussi de garder les antipaludiques hors de portée des enfants.
- **Électricité** : prises accessibles, rallonges, appareils de chauffage d’appoint.
- **Petits objets** : piles bouton, aimants, cacahuètes, billes, à ranger.

**Organiser la surveillance**
- Avec plusieurs adultes, désignez clairement **qui surveille** à quel moment, surtout pendant les repas et les moments de détente au bord de la piscine.
- Après la baignade, sortez les jouets de l’eau et refermez l’accès à la piscine.
- Si un enfant manque à l’appel, cherchez **d’abord dans l’eau**.

## Questions fréquentes
**La piscine de la location a une alarme : est-ce suffisant ?** Le ministère des Sports insiste : aucun équipement ne remplace la vigilance d’un adulte. Un dispositif de sécurité est une aide, pas une surveillance.

**Mon enfant sait nager : puis-je le laisser près de la piscine ?** Un enfant qui sait nager doit rester sous surveillance continue, rappelle le ministère des Sports.

**Chez les grands-parents, il y a beaucoup de médicaments : comment en parler ?** Simplement, avant l’arrivée : demandez-leur de les ranger en hauteur et hors de vue, comme vous le feriez vous-même. C’est une précaution, pas un reproche.

## Quand demander conseil
En cas de noyade, appelez immédiatement le **15**, le **18** ou le **112**. Si un enfant a avalé de l’eau et tousse, vomit, respire mal, ou si son état ne redevient pas habituel dans les 5 minutes, appelez aussi les secours. En cas de chute d’une hauteur, d’ingestion d’un médicament, d’un produit ménager ou d’une pile bouton, appelez le **15** ou un centre antipoison sans attendre de symptômes.

${FIN}`,
  },
  {
    ...BASE, journeys: BB, category: 'securite', safety_critical: true, max_age_months: 24,
    slug: 'faire-dormir-bebe-en-vacances-lit-parapluie-couchage-securise',
    title: 'Faire dormir bébé ailleurs qu’à la maison : lit parapluie, hôtel, famille',
    summary: 'En vacances, chez des proches ou à l’hôtel, les règles du couchage sécurisé restent les mêmes : sur le dos, dans son propre lit, sans objets mous ni matelas ajouté, et jamais dans le siège auto pour la nuit.',
    tags: ['lit parapluie', 'couchage bébé vacances', 'mort inattendue du nourrisson', 'sommeil bébé hôtel', 'bébé dort chez les grands-parents', 'matelas lit parapluie', 'gigoteuse', 'couffin'],
    sources: [S.ameliCoucher],
    body_md: `## En bref
- Bébé dort **sur le dos**, **à plat**, **dans son propre lit**, la nuit comme pour les siestes, y compris en vacances.
- Dans un **lit parapluie**, gardez **uniquement le matelas d’origine** : n’en ajoutez pas un second.
- **Pas d’oreiller, de couette, de couverture, de peluche volumineuse** : une **gigoteuse** à sa taille suffit.
- Le **siège auto** ne remplace pas un lit : la tête peut basculer vers l’avant et gêner la respiration.
- Ne vous endormez pas avec bébé sur un **canapé** ou un **fauteuil**, et ne le couchez pas avec un autre enfant.

## Comprendre
Le couchage sécurisé est l’un des moyens les plus efficaces de prévenir la mort inattendue du nourrisson. L’Assurance Maladie rappelle que le simple fait de coucher les bébés sur le dos a fait baisser de 75 % le taux de mort subite du nourrisson en France entre 1991 et 1997.

En vacances, tout change : le lit, la chambre, la température, parfois le fuseau horaire. On improvise plus facilement (un oreiller pour caler, une couette parce qu’il fait frais, une sieste dans la coque après la route). Or les règles sont les mêmes partout : un **lit adapté**, un **matelas ferme** et bien ajusté, **rien autour** de bébé.

Le **lit parapluie** est pratique, mais son matelas fin peut sembler peu confortable. C’est pourtant le seul adapté : un matelas supplémentaire posé dessus crée des **interstices** où le visage de bébé peut se coincer, et rend le couchage trop mou. L’Assurance Maladie rappelle aussi de monter le lit selon la notice, avec les seules pièces fournies.

## Au quotidien
**Avant de partir**
- Demandez à l’hébergement s’il fournit un lit bébé, et dans quel état ; à défaut, emportez votre lit parapluie, vérifié et complet.
- Prévoyez la gigoteuse ou le surpyjama habituel, adapté à la saison de la destination.
- Emportez le doudou (petit et plat) et les repères du coucher : berceuse, histoire, veilleuse si vous en utilisez.

**À l’arrivée**
- Montez le lit selon la notice, verrouillez bien les côtés.
- Installez-le **loin des fenêtres**, des rideaux et cordons, des lampes, des prises et rallonges, et hors de portée de tout mobile mal fixé.
- Si l’hébergement fournit un lit, vérifiez l’écartement des barreaux (entre 4,5 et 6,5 cm selon la norme européenne), la fermeté du matelas et l’absence d’espace entre matelas et bords.
- Ne posez jamais un couffin en hauteur sur un meuble : au sol uniquement.

**La température**
- Visez une chambre ni trop chaude ni trop froide, idéalement autour de 18 à 20 °C, aérée chaque jour.
- Par forte chaleur, bébé peut dormir en simple couche ; par temps frais, une gigoteuse plus chaude plutôt qu’une couverture.
- Vérifiez sa nuque : elle ne doit pas être moite.

**Partager la chambre**
- Pendant les six premiers mois, l’Assurance Maladie recommande que bébé dorme dans la même pièce que ses parents, mais **dans son propre lit**.
- Si vous le prenez dans votre lit pour une tétée ou un câlin, recouchez-le dans le sien avant de vous rendormir, surtout si vous êtes très fatigué(e).

## Questions fréquentes
**Il s’est endormi dans son siège auto pendant le trajet : dois-je le réveiller ?** À l’arrivée, sortez-le du siège et couchez-le à plat dans un lit adapté, même s’il se réveille un peu.

**Les grands-parents ont gardé l’ancien lit de famille : est-il utilisable ?** Vérifiez les barreaux, la stabilité, l’état du matelas (ferme, aux bonnes dimensions) et l’absence de pièces manquantes. En cas de doute, préférez votre lit parapluie.

**Il fait froid dans le gîte, puis-je ajouter une couverture ?** Non : préférez une gigoteuse plus chaude ou un surpyjama, et chauffez raisonnablement la pièce. Le drap et la couette ne sont utilisables qu’à partir de 3 ans.

## Quand demander conseil
Parlez du sommeil de votre bébé avec le médecin, la sage-femme ou la puéricultrice de PMI si vous avez des questions, en particulier pour un bébé prématuré ou qui a des problèmes de santé. Appelez immédiatement le **15** ou le **112** si bébé ne respire pas normalement, est inerte, change de couleur (pâle, bleuté) ou ne réagit pas. Si la fatigue des nuits devient trop lourde, parlez-en ; en cas de détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
];
