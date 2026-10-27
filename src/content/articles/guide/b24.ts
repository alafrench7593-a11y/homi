/** Guide complet — lot 24 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  jouetsAge: { label: 'Santé.fr (DGCCRF) — Sécurité des jouets : optez pour un produit adapté à l’âge de l’enfant !', url: 'https://www.sante.fr/node/1268419', consulted_on: C, published: '2019-06-11' },
  conseilsJouets: { label: 'economie.gouv.fr (Bercy infos) — Nos conseils pour choisir les jouets de vos enfants en toute sécurité', url: 'https://www.economie.gouv.fr/particuliers/choix-conseil-achat-jouets-securite-enfants', consulted_on: C },
  dgccrfControle: { label: 'economie.gouv.fr (DGCCRF) — Comment la DGCCRF s’assure de la sécurité des jouets', url: 'https://www.economie.gouv.fr/dgccrf/comment-la-dgccrf-sassure-de-la-securite-des-jouets', consulted_on: C },
  dgccrfSurveillance: { label: 'economie.gouv.fr (DGCCRF) — La sécurité des jouets sous surveillance', url: 'https://www.economie.gouv.fr/dgccrf/la-securite-des-jouets-sous-surveillance', consulted_on: C },
  dgccrfVigilance: { label: 'economie.gouv.fr (DGCCRF) — Pour la protection des enfants : vigilance sur la sécurité des jouets', url: 'https://www.economie.gouv.fr/dgccrf/pour-la-protection-des-enfants-vigilance-sur-la-securite-des-jouets', consulted_on: C },
  jeuxConstruction: { label: 'economie.gouv.fr (DGCCRF) — Jeux de construction et de société : misez sur la sécurité !', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/jeux-de-construction-et-de-societe-misez-sur-la-securite', consulted_on: C, published: '2025-10-27' },
  peluches: { label: 'Santé.fr (DGCCRF) — Peluches : attention aux petits éléments !', url: 'https://www.sante.fr/node/1268429', consulted_on: C, published: '2020-12-21' },
  porteurs: { label: 'Santé.fr (DGCCRF) — Jouets porteurs : optez pour un produit adapté à l’âge de l’enfant !', url: 'https://www.sante.fr/node/1268425', consulted_on: C, published: '2019-06-11' },
  trottinettes: { label: 'economie.gouv.fr (DGCCRF) — Trottinettes : achetez un produit sûr !', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/trottinettes-achetez-un-produit-sur', consulted_on: C, published: '2022-12-14' },
  bicyclettes: { label: 'economie.gouv.fr (DGCCRF) — Bicyclettes : au rayon de la sécurité', url: 'https://www.economie.gouv.fr/dgccrf/bicyclettes-au-rayon-securite', consulted_on: C },
  pilesBouton: { label: 'Santé.fr (Ministère chargé de la Santé) — Piles bouton : prévention des risques d’ingestion par les jeunes enfants', url: 'https://www.sante.fr/node/1184265', consulted_on: C, published: '2024-12-16' },
  pilesBoutonDgccrf: { label: 'Santé.fr (DGCCRF) — Piles bouton : prévenir l’ingestion et adopter les bons réflexes en cas d’accident', url: 'https://www.sante.fr/node/1268367', consulted_on: C, published: '2019-06-11' },
  billesAimantees: { label: 'Santé publique France (avec DGS, DGCCRF, Anses) — Objets contenant des billes aimantées : à tenir hors de portée des enfants', url: 'https://www.santepubliquefrance.fr/presse/2021/objets-contenant-des-billes-aimantees-a-tenir-hors-de-portee-des-enfants', consulted_on: C, published: '2021-06-11' },
  ambre: { label: 'Santé.fr (Service public d’information en santé) — Les colliers d’ambre soulagent-ils les poussées dentaires des bébés ?', url: 'https://www.sante.fr/node/6846669', consulted_on: C, published: '2023-03-20' },
  puericulture: { label: 'economie.gouv.fr (DGCCRF) — Puériculture (articles)', url: 'https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/puericulture-articles', consulted_on: C },
  rappelConso: { label: 'Service-public.gouv.fr — RappelConso recense les rappels de produits dangereux ou défectueux', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18561', consulted_on: C, published: '2025-10-27' },
  retraitsRappels: { label: 'economie.gouv.fr (Bercy infos) — Retraits et rappels de produits : comment signaler et s’informer sur les produits à risque ?', url: 'https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/retraits-et-rappels-de-produits-comment-signaler-et-sinformer-sur-les-produits-risque', consulted_on: C, published: '2026-03-30' },
  incRappels: { label: 'INC (Institut national de la consommation) — Rappels de produits, comment ça marche ?', url: 'https://www.inc-conso.fr/content/rappels-de-produits-comment-ca-marche', consulted_on: C, published: '2025-02-19' },
  incCasques: { label: 'INC (Institut national de la consommation) — Les casques vélo pour enfants', url: 'https://www.inc-conso.fr/node/10658', consulted_on: C, published: '2018-08-21' },
  casquePrefecture: { label: 'Préfecture de Lot-et-Garonne — Communiqué : obligation du port du casque à vélo pour les enfants de moins de 12 ans', url: 'https://www.lot-et-garonne.gouv.fr/contenu/telechargement/10719/98831/file/cp-obligationcasqueveloenfant2-1.pdf', consulted_on: C, published: '2016-12-22' },
  edpm: { label: 'Ministère de la Transition écologique — Trottinettes électriques et EDPM : la réglementation en vigueur', url: 'https://www.ecologie.gouv.fr/trottinettes-electriques-et-edpm-reglementation-en-vigueur', consulted_on: C, published: '2026-02-06' },
  cnil: { label: 'CNIL — Jouets connectés : quels conseils pour les sécuriser ?', url: 'https://www.cnil.fr/fr/jouets-connectes-quels-conseils-pour-les-securiser', consulted_on: C, published: '2017-02-28' },
  lunettes: { label: 'economie.gouv.fr (DGCCRF) — Lunettes de soleil : comment choisir la bonne protection ?', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/lunettes-de-soleil-comment-choisir-la-bonne-protection', consulted_on: C, published: '2026-01-16' },
  arsSoleil: { label: 'ARS Grand Est — Risques solaires : profitez du soleil en toute sécurité (dépliant)', url: 'https://www.grand-est.ars.sante.fr/media/110709/download', consulted_on: C },
  zeroAccident: { label: 'Santé.fr — « Zéro accident, un jeu d’enfant » : le serious game pour prévenir les accidents domestiques', url: 'https://www.sante.fr/node/8031855', consulted_on: C, published: '2024-05-15' },
  livret1000: { label: 'Ministère des Solidarités et de la Santé — Le livret de nos 1000 premiers jours', url: 'https://solidarites.gouv.fr/sites/solidarite/files/2023-01/livret-1000-premiers-jours.pdf', consulted_on: C },
  coucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, du pharmacien, de la puéricultrice de PMI ou des professionnels qui suivent votre enfant._';
const URG = 'En cas d’urgence (étouffement, gêne respiratoire, ingestion d’une pile ou d’un aimant, malaise), appelez le **15** (SAMU) ou le **112** ; les personnes sourdes ou malentendantes peuvent joindre le **114**. Pour une question d’intoxication sans signe de gravité, un **centre antipoison** peut vous conseiller.';
const DANGER = 'Si vous pensez qu’un enfant est en danger, appelez le **119** (Allô Enfance en danger), gratuit, jour et nuit.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['newborn', 'child'], status: 'to_review', ...x,
});

export const GUIDE_B24: LibArticle[] = [
  // ------------------------------------------------------------ bien choisir : règles générales
  a({
    slug: 'marquage-ce-jouet-ce-qu-il-garantit',
    title: 'Le marquage CE sur un jouet : ce qu’il garantit et ce qu’il faut vérifier en plus',
    summary: 'Ce que signifie le logo CE apposé sur un jouet, ses limites, et la petite liste de vérifications à faire avant d’acheter.',
    category: 'securite', tags: ['marquage CE', 'logo CE', 'norme jouet', 'sécurité des jouets', 'acheter un jouet', 'notice en français', 'DGCCRF', 'jouet dangereux'],
    min_age_months: 0, max_age_months: 168, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.jouetsAge, S.conseilsJouets, S.dgccrfControle],
    body_md: `## En bref
- Le **marquage CE** est obligatoire sur les jouets destinés aux enfants de moins de 14 ans : par ce logo, le fabricant atteste que le jouet respecte les exigences essentielles de sécurité.
- Il doit être **visible, lisible et indélébile**, sur le jouet ou son emballage.
- C’est une déclaration du fabricant, contrôlée par la DGCCRF : il ne remplace pas la lecture de **l’âge indiqué** et des **avertissements**.
- Vérifiez aussi la présence d’une **notice en français** et de l’**identité du fabricant ou de l’importateur**.

## Comprendre
En France, la sécurité des jouets est encadrée par le décret n° 2010-166 du 22 février 2010, qui transpose une directive européenne. Il s’applique aux jouets destinés aux enfants de moins de 14 ans. Parce que les jeunes enfants ne perçoivent pas toujours le danger, les exigences sont renforcées : elles portent sur les propriétés mécaniques et physiques, l’inflammabilité, la composition chimique, les caractéristiques électriques et l’hygiène. Le jouet doit être sûr dans une utilisation normale **et prévisible** : un enfant qui le met à la bouche, le tire ou le démonte.

Avant la mise sur le marché, le fabricant établit une documentation technique, évalue les dangers et la conformité de son produit, puis appose le marquage CE. Ce n’est donc pas une note de qualité : c’est l’engagement du fabricant que les règles sont respectées. La DGCCRF vérifie ensuite sur le terrain. En 2022, elle indique avoir contrôlé environ 2 200 établissements et analysé 674 jouets en laboratoire, dont 17 % ont été déclarés non conformes et dangereux, puis retirés ou rappelés. Ce taux reflète des contrôles ciblés, pas l’ensemble du marché.

Parmi les manquements relevés : absence de marquage CE, avertissements obligatoires manquants, mention « 0-3 ans » sur des jouets en réalité destinés à des enfants plus âgés, notices sans consignes de sécurité en français. La DGCCRF note que les règles sont souvent moins bien connues des petits artisans, de certains discounters, des vendeurs de marchés et de marchés de Noël, et des lieux dont le jouet n’est pas le métier (musées, parcs d’attractions, presse).

## Au quotidien
**En magasin ou en ligne, prenez une minute pour vérifier :**
- **Le logo CE**, bien lisible, sur le jouet ou l’emballage.
- **L’âge conseillé et les avertissements** (« Ne convient pas aux enfants de moins de 36 mois », surveillance d’un adulte…).
- **La notice en français**, avec les consignes d’utilisation et de sécurité.
- **Le nom et l’adresse** du fabricant ou de l’importateur : ils permettent de retrouver le produit en cas de rappel.

**Puis regardez le jouet lui-même :**
- Pour un jeune enfant, préférez des **mécanismes simples** ; évitez les mécanismes pliants qui peuvent pincer ou couper.
- Préférez les plastiques **colorés dans la masse** à la peinture, qui peut s’écailler.
- Pour un jouet à piles, vérifiez que le **compartiment est solide** et que les piles ne sont pas facilement accessibles.
- Si possible, **manipulez le jouet** avant l’achat.

**Situations à surveiller :** un jouet acheté sur un stand de marché, gagné à la fête foraine ou offert avec un magazine mérite le même examen qu’un jouet acheté en magasin spécialisé.

## Questions fréquentes
**Un jouet sans marquage CE est-il forcément dangereux ?**
On ne peut pas le savoir : l’absence de logo signifie que l’obligation n’est pas respectée et qu’aucune garantie n’est affichée. Mieux vaut ne pas le confier à un jeune enfant et signaler le produit sur SignalConso.

**Le marquage CE suffit-il pour choisir ?**
Non. Un jouet conforme peut être dangereux pour un enfant plus jeune que l’âge prévu, par exemple à cause de petites pièces. L’âge et les avertissements comptent autant que le logo.

**Une figurine de collection ou une décoration de fête est-elle un jouet ?**
Pas forcément. La DGCCRF cite des objets qui attirent les enfants sans être conçus pour eux : poupées de collection, décorations de fêtes, modèles réduits pour adultes, puzzles de plus de 500 pièces, figurines de collection. Gardez-les hors de portée des plus jeunes.

**Qui contrôle les jouets ?**
La DGCCRF. Les produits jugés dangereux sont retirés de la vente ou rappelés, et les rappels sont publiés sur le site RappelConso.

## Quand demander conseil
Si un jouet se casse en laissant de petits morceaux, chauffe, ou a blessé votre enfant, cessez de l’utiliser et signalez-le sur SignalConso. Si votre enfant a pu avaler un élément, une pile ou un aimant, ou s’il s’étouffe, n’attendez pas. ${URG}

${FIN}`,
  }),
  a({
    slug: 'ne-convient-pas-moins-de-36-mois-lire-avertissements-jouet',
    title: '« Ne convient pas aux moins de 36 mois » : bien lire l’âge et les avertissements d’un jouet',
    summary: 'Ce que signifient l’âge indiqué, le pictogramme « 0-3 ans barré » et les autres avertissements obligatoires, et comment s’en servir pour choisir.',
    category: 'securite', tags: ['moins de 36 mois', 'pictogramme 0-3 ans', 'âge jouet', 'avertissement jouet', 'petites pièces', 'étouffement', 'notice', 'choisir un jouet'],
    min_age_months: 0, max_age_months: 120,
    sources: [S.jouetsAge, S.porteurs, S.jeuxConstruction],
    body_md: `## En bref
- Un jouet qui peut être dangereux pour un enfant de moins de 3 ans doit porter un **avertissement** : un texte (« Attention ! Ne convient pas aux enfants de moins de 36 mois ») ou un **pictogramme d’âge**.
- Cet avertissement doit préciser **le danger** en cause : petites pièces, longs cordons, petites balles…
- L’âge indiqué n’est **pas un niveau de difficulté** : c’est d’abord une information de sécurité.
- D’autres jouets portent des avertissements propres : jouets aquatiques, d’activité, chimiques, jouets contenant des aliments, coffrets avec aimants.

## Comprendre
Les avertissements d’âge ne sont pas décoratifs. Selon la DGCCRF, les jouets susceptibles d’être dangereux pour les enfants de moins de 36 mois doivent porter une mise en garde, sous forme de phrase ou de logo, accompagnée de la mention du **danger précis** qui justifie cette précaution : risque d’étouffement par de petits éléments, d’étranglement par de longs cordons, d’étouffement par de petites balles.

Pourquoi 3 ans ? Avant cet âge, les enfants explorent beaucoup avec la bouche et n’ont pas conscience du danger. Un jouet parfaitement adapté à un enfant de 6 ans peut donc présenter un risque réel pour son petit frère de 18 mois. L’avertissement ne s’applique pas aux jouets qui, à l’évidence, ne sont pas destinés aux moins de 3 ans.

L’âge indiqué sert aussi à adapter la **complexité technique**. Pour les jeux de construction, la DGCCRF évoque par exemple des pièces motorisées à partir de 8 ans et des mécanismes complexes à partir de 10 ans. Les coffrets d’expériences magnétiques ou électriques peuvent porter la mention « Ne convient pas aux enfants de moins de 8 ans. Ce produit contient de petits aimants ».

Autre point relevé lors des contrôles : la mention « 0-3 ans » apposée à tort sur des jouets destinés à des enfants plus âgés. Si l’objet vous paraît manifestement inadapté à un bébé (petites pièces, mécanisme fragile), fiez-vous à votre observation.

## Au quotidien
**Avant l’achat**
- Repérez l’âge minimal et le pictogramme, puis lisez **en entier** les mentions de l’emballage et de la notice.
- Pour un porteur destiné à un enfant qui commence à marcher (12 à 18 mois), la DGCCRF conseille un modèle qu’il peut facilement enjamber, qui lui permet de poser les pieds à plat au sol et qui roule facilement.
- Pensez à l’enfant réel : ses capacités, ses habitudes (met-il encore tout à la bouche ?), et les autres enfants de la maison.

**Après l’achat**
- Gardez la notice, au moins tant que le jouet est utilisé : elle contient les consignes et les coordonnées utiles en cas de rappel.
- Expliquez à l’enfant le fonctionnement du jouet et les gestes à éviter.
- Rangez à part les jouets marqués « 3 ans et plus » si un tout-petit vit à la maison ou vient en visite.

**Exemple** : un coffret de perles à enfiler « dès 5 ans » ravit votre aînée de 6 ans. Elle peut l’utiliser à table pendant la sieste du petit, puis le ranger dans une boîte fermée, en hauteur.

## Questions fréquentes
**Mon enfant de 2 ans est très habile : puis-je lui donner un jouet « 3 ans et plus » ?**
L’avertissement ne parle pas d’habileté mais d’un danger, le plus souvent l’étouffement par de petites pièces. Même un enfant très dégourdi peut porter un petit objet à la bouche : mieux vaut respecter l’âge indiqué.

**Que faire si l’emballage n’indique aucun âge ?**
Les avertissements sont obligatoires lorsque le jouet le justifie. En leur absence, examinez le jouet avec prudence, évitez de le donner à un tout-petit, et vous pouvez signaler le produit sur SignalConso.

**Le jeu de société de mon aîné contient des dés et des pions : est-ce un problème ?**
Ces petites pièces peuvent présenter un risque d’étouffement pour les jeunes enfants. La DGCCRF conseille de proposer aux tout-petits des jeux conçus pour eux et de ranger les autres hors de portée.

**Les avertissements de poids ou de surveillance sont-ils importants ?**
Oui : la DGCCRF demande de vérifier aussi les mentions de poids maximal, d’aptitude et de surveillance par un adulte, qui conditionnent une utilisation sûre.

## Quand demander conseil
En cas de doute sur l’adéquation d’un jouet à votre enfant, demandez conseil au vendeur, à la puéricultrice de PMI ou au professionnel de la petite enfance qui accueille votre enfant. Si votre enfant a mis en bouche et avalé une petite pièce, tousse, s’étouffe ou respire mal, agissez sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jouets-des-aines-et-tout-petits-partager-en-securite',
    title: 'Jouets des aînés, tout-petits à la maison : organiser le partage en sécurité',
    summary: 'Quand plusieurs âges cohabitent, les petites pièces des grands deviennent un risque pour les petits : idées concrètes pour ranger, jouer ensemble et responsabiliser.',
    category: 'securite', tags: ['frères et sœurs', 'fratrie', 'petites pièces', 'jouets des grands', 'rangement des jouets', 'étouffement', 'cousins', 'billes'],
    min_age_months: 6, max_age_months: 120,
    sources: [S.conseilsJouets, S.jouetsAge, S.zeroAccident],
    body_md: `## En bref
- La DGCCRF recommande d’**empêcher les plus jeunes d’utiliser les jouets des plus grands** et de **ranger les petits objets** hors de leur portée.
- Billes, perles, piles bouton, petites figurines : ces objets peuvent être avalés ou introduits dans le nez ou les oreilles.
- Un **coin « jeux des grands »** et des **boîtes fermées** en hauteur simplifient beaucoup le quotidien.
- Associer l’aîné aux règles le valorise, mais la surveillance reste celle des adultes.

## Comprendre
Dans une famille, les jouets circulent : l’aîné laisse traîner ses briques, la cousine de passage apporte ses perles, le petit dernier hérite d’une caisse de jouets. Or un jouet conforme pour un enfant de 7 ans peut être dangereux pour un enfant de 1 an. Les jouets destinés aux plus de 3 ans peuvent contenir de petites pièces, des aimants ou des mécanismes plus fins, ce qui explique les avertissements « ne convient pas aux moins de 36 mois ».

Les accidents de la vie courante sont la première cause de décès chez les 1 à 4 ans, d’après l’enquête de Santé publique France citée par Santé.fr. Parmi les risques principaux figurent les étouffements, et Santé.fr conseille d’éloigner les petits objets (billes, piles bouton, petits jouets) qui peuvent être avalés ou introduits dans le nez ou les oreilles. La DGCCRF rappelle aussi d’expliquer aux enfants le fonctionnement des jouets et les manipulations à éviter.

## Au quotidien
**Organiser l’espace**
- Créez une **zone des grands** : bureau, table haute ou chambre avec porte fermée, où les jeux à petites pièces se pratiquent.
- Rangez ces jeux dans des **boîtes avec couvercle**, sur une étagère haute plutôt que dans un coffre au sol.
- Gardez à hauteur du tout-petit uniquement ses jouets à lui, adaptés à son âge.

**Organiser le moment de jeu**
- Les grands jeux de construction ou de perles peuvent se faire **pendant la sieste** du petit, ou à table, à distance.
- Après la séance, un **tour de ramassage** ensemble : un jeu de « chasse aux pièces » sous la table rend la tâche plus amusante.
- Pour jouer ensemble, choisissez des jeux adaptés au plus jeune : gros cubes, ballons, jeux d’imitation sans petits accessoires, livres cartonnés.

**Responsabiliser l’aîné, sans le charger**
- Expliquez avec des mots simples : « Ton petit frère met tout dans sa bouche ; les petites pièces peuvent le faire étouffer. »
- Valorisez son rôle (« tu m’aides à protéger ta sœur »), sans lui confier la surveillance : c’est le rôle d’un adulte.

**Penser aux visites**
Lorsque des enfants plus âgés viennent jouer, ou lorsque vous rendez visite à une famille dont les enfants sont plus grands, faites un petit tour de la pièce de jeu à hauteur du tout-petit.

## Questions fréquentes
**Mon aîné de 4 ans ne comprend pas pourquoi il doit ranger ses jouets en hauteur. Comment faire ?**
Une règle simple et constante (« les petites pièces vivent dans la boîte bleue ») est plus efficace qu’une longue explication. Montrez l’exemple et rangez avec lui.

**Les jouets de l’aîné peuvent-ils être transmis au cadet ?**
Oui, quand le cadet atteint l’âge prévu, après vérification de l’état du jouet (pièces qui se détachent, piles, coutures). Les jouets anciens peuvent ne plus répondre aux normes actuelles.

**À partir de quel âge le petit peut-il jouer avec les jeux des grands ?**
Quand il a l’âge indiqué sur l’emballage. Avant, privilégiez les jeux communs adaptés au plus jeune.

**Les billes sont-elles dangereuses pour un tout-petit ?**
Les billes font partie des petits objets que Santé.fr conseille d’éloigner des jeunes enfants, car ils peuvent être avalés ou inhalés.

## Quand demander conseil
Si votre enfant tousse brutalement, s’étouffe, respire bruyamment après avoir joué avec de petits objets, ou si vous pensez qu’il en a avalé un ou mis un dans son nez ou son oreille, faites-le examiner rapidement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ piles, aimants, cordons
  a({
    slug: 'piles-bouton-maison-reperer-ranger-choisir',
    title: 'Piles bouton à la maison : repérer les objets qui en contiennent, ranger et choisir',
    summary: 'Télécommandes, montres, jouets, veilleuses : où se cachent les piles bouton, pourquoi elles sont dangereuses pour les jeunes enfants, et comment s’en protéger.',
    category: 'securite', tags: ['pile bouton', 'piles plates', 'télécommande', 'compartiment à piles', 'jouet à piles', 'ingestion', 'veilleuse', 'piles usagées'],
    min_age_months: 0, max_age_months: 72, safety_critical: true, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.pilesBouton, S.pilesBoutonDgccrf, S.conseilsJouets],
    body_md: `## En bref
- Avaler une pile bouton est une **urgence médicale** : des lésions graves peuvent survenir en moins de deux heures.
- Une **pile usagée reste dangereuse**.
- Gardez toutes les piles bouton, **neuves comme usagées**, hors de portée des enfants.
- Préférez les objets dont le **compartiment à piles se ferme par une vis** ou un système de verrouillage.

## Comprendre
Les piles bouton sont de petites piles plates et rondes. Elles sont de plus en plus présentes dans les objets du quotidien, et les cas d’ingestion par de jeunes enfants ont fortement augmenté, selon le ministère chargé de la Santé. Entre 1999 et 2018, il recense 6 décès (dont 5 jeunes enfants) et 51 complications graves, et environ 4 500 appels aux centres antipoison sur ce sujet.

Pourquoi est-ce si grave ? Comme tout petit objet, la pile peut provoquer un étouffement. Mais elle peut aussi rester coincée dans l’œsophage, parfois **sans aucun symptôme**, et provoquer des brûlures, des perforations ou des saignements brutaux. Le risque de blocage est plus élevé pour les piles de **15 mm de diamètre ou plus**, et la brûlure s’aggrave nettement après la deuxième heure.

**Où les trouve-t-on ?** Le ministère cite notamment : jouets, aides auditives, télécommandes, montres, veilleuses, lampes, lasers, porte-clés, thermomètres, balances électroniques, stylos, réveils, détecteurs de fumée, calculatrices, lecteurs de glycémie.

Côté jouets, la DGCCRF relève régulièrement des piles bouton accessibles dans des jouets électriques destinés aux enfants de plus de 3 ans : un jouet de l’aîné peut donc devenir un danger pour le cadet.

## Au quotidien
**Faire l’inventaire**
- Faites le tour de la maison à la recherche des objets à piles bouton : salon (télécommandes), salle de bain (balance), chambre (veilleuse, réveil), entrée (porte-clés), sac à main.
- Vérifiez que chaque compartiment est **solide et difficile à ouvrir**. S’il s’ouvre facilement, ne laissez pas l’objet à portée d’un enfant, ou fixez le couvercle.

**Ranger et jeter**
- Rangez les piles de rechange **dans leur emballage d’origine**, dans un placard fermé ou en hauteur. Des rappels de produits ont concerné des emballages pas assez résistants pour empêcher l’accès des enfants.
- Ne laissez pas traîner les **piles usagées** sur un meuble ou dans un vide-poche : déposez-les rapidement dans un bac de collecte.
- Changez les piles hors de la vue des enfants.

**Choisir**
- Au moment d’acheter un jouet ou un objet à piles, préférez un compartiment **fermé par une vis** ou un verrouillage.
- Pour tout petit objet lumineux ou électronique, appliquez la même vérification : si la pile est accessible, l’objet reste hors de portée.

**Prévenir l’entourage**
Grands-parents, assistante maternelle, amis : parlez-leur des piles bouton : il suffit d’une montre ou d’une télécommande posée sur une table basse pour qu’un accident survienne.

## Questions fréquentes
**Une pile vide peut-elle encore être dangereuse ?**
Oui. Le ministère chargé de la Santé précise qu’une pile usagée reste dangereuse et peut provoquer le même type de lésions.

**Comment savoir si mon enfant a avalé une pile ?**
Souvent, il n’y a **aucun signe visible**. Si une pile a disparu, si un compartiment est ouvert ou si votre enfant a été vu avec une pile, considérez que l’ingestion est possible et appelez.

**Les jouets vendus en France peuvent-ils avoir des piles accessibles ?**
Ils ne devraient pas, mais la DGCCRF en trouve lors de ses contrôles. Vérifiez vous-même la solidité du compartiment.

**Faut-il préférer un jouet sans piles ?**
Pour un tout-petit, un jouet simple sans électronique limite ce risque. Si le jouet a des piles, le compartiment vissé est la meilleure garantie.

## Quand demander conseil
Au moindre doute d’ingestion, même sans symptôme : appelez **immédiatement** un centre antipoison ou le **15**, ne faites ni manger, ni boire, ni vomir l’enfant, et gardez l’emballage ou l’objet pour identifier la pile. ${URG}

${FIN}`,
  }),
  a({
    slug: 'pile-bouton-avalee-que-faire',
    title: 'Pile bouton avalée ou suspectée : les bons réflexes, minute par minute',
    summary: 'Pourquoi chaque minute compte, qui appeler, ce qu’il ne faut pas faire, et quoi apporter aux urgences.',
    category: 'premiers-secours', tags: ['pile bouton avalée', 'ingestion pile', 'urgence enfant', 'centre antipoison', '15', 'corps étranger', 'enfant a avalé', 'œsophage'],
    min_age_months: 0, max_age_months: 120, safety_critical: true,
    sources: [S.pilesBouton, S.pilesBoutonDgccrf],
    body_md: `## En bref
- **Le simple doute suffit** : appelez immédiatement un centre antipoison ou le **15**, même si votre enfant va bien.
- Signalez clairement qu’il s’agit d’**une pile bouton**.
- **Ne donnez rien à manger ni à boire** et **ne faites pas vomir**.
- Apportez l’**emballage ou l’objet** d’où provient la pile.

## Comprendre
Avaler une pile bouton est une urgence médicale. Selon le ministère chargé de la Santé, des complications graves, parfois mortelles, peuvent apparaître **en moins de deux heures** : brûlure et perforation de l’œsophage, saignements brutaux et imprévisibles, perforation des voies respiratoires. La brûlure locale devient beaucoup plus sévère **après la deuxième heure**. Le traitement peut être lourd et laisser des séquelles.

Le piège, c’est que l’enfant peut **ne présenter aucun signe** : la pile peut rester bloquée dans l’œsophage sans symptôme apparent. Le risque de blocage est plus important pour les piles de 15 mm de diamètre ou plus. Ces accidents concernent surtout les enfants de moins de 6 ans, d’après les informations de la DGCCRF relayées par Santé.fr.

C’est pourquoi on n’attend pas que l’enfant « montre quelque chose » : on agit sur le soupçon.

## Au quotidien
**Les situations qui doivent alerter**
- Vous trouvez votre enfant avec un objet dont le compartiment est ouvert et la pile manquante.
- Une pile a disparu de la table ou de son emballage.
- Votre enfant dit, ou un autre enfant raconte, qu’il a « mangé » une pile.
- Vous voyez une pile dans sa bouche et ne savez pas s’il en a avalé une autre.

**Ce que vous faites, dans l’ordre**
1. **Appelez tout de suite** un centre antipoison ou le 15 (le 112 ou le 18 sont aussi possibles ; le 114 pour les personnes sourdes ou malentendantes).
2. Dites « **pile bouton** » dès le début de l’appel, l’âge de l’enfant, l’heure probable et, si vous le savez, la taille de la pile.
3. **Ne lui donnez rien** à manger ou à boire, sauf consigne contraire du médecin régulateur.
4. **Ne le faites pas vomir.**
5. Récupérez l’**objet, l’emballage ou une pile identique** : cela aide les médecins à connaître le type et la taille.
6. Suivez les consignes : le plus souvent, l’enfant est orienté vers un service d’urgences désigné, auquel le centre antipoison transmet la conduite à tenir.

**Pendant le trajet**
Restez auprès de l’enfant et suivez les consignes reçues au téléphone. Si l’on vous a indiqué un service d’urgences, rendez-vous-y directement plutôt que chez un médecin de ville.

**Si l’enfant s’étouffe**
S’il ne peut plus respirer, tousser ni parler, il s’agit d’un étouffement : appelez le 15 ou le 112 et suivez les consignes de l’opérateur.

## Questions fréquentes
**Mon enfant joue normalement, je ne suis pas sûr qu’il ait avalé la pile. J’attends ?**
Non. Les autorités sanitaires demandent d’appeler même sans certitude et même sans symptôme, car les lésions progressent sans bruit.

**Et s’il a avalé une pile plate de montre, très petite ?**
Appelez quand même. Seuls les professionnels peuvent évaluer la situation selon la taille, l’âge et le délai.

**Le centre antipoison est-il joignable la nuit ?**
Les centres antipoison répondent en permanence ; leurs coordonnées figurent sur centres-antipoison.net. Le 15 reste joignable à tout moment.

**Une pile usagée est-elle moins grave ?**
Non : une pile usagée peut provoquer le même type de lésions.

**Comment éviter que cela se reproduise ?**
Faites l’inventaire des objets à piles bouton, choisissez des compartiments vissés et rangez les piles, neuves ou usagées, hors de portée.

## Quand demander conseil
Toute suspicion d’ingestion de pile bouton justifie un appel **immédiat**, de jour comme de nuit, même si votre enfant ne présente aucun signe. Si vous avez un doute après coup sur un épisode passé inaperçu, appelez aussi : seul un professionnel peut évaluer la situation. ${URG}

${FIN}`,
  }),
  a({
    slug: 'aimants-billes-aimantees-danger-enfants',
    title: 'Aimants et billes aimantées : un danger sous-estimé pour les enfants',
    summary: 'Pourquoi deux aimants avalés peuvent perforer l’intestin, quels objets en contiennent, et que faire si vous soupçonnez une ingestion.',
    category: 'securite', tags: ['aimants', 'billes aimantées', 'billes magnétiques', 'jeu de construction magnétique', 'objet anti-stress', 'ingestion', 'perforation', 'moins de 14 ans'],
    min_age_months: 0, max_age_months: 168, safety_critical: true,
    sources: [S.billesAimantees, S.jouetsAge, S.conseilsJouets],
    body_md: `## En bref
- Des **billes aimantées avalées** peuvent s’attirer à travers la paroi de l’intestin, provoquer une occlusion et des **perforations** : les cas les plus graves nécessitent une chirurgie lourde.
- Elles sont bien plus dangereuses qu’un objet inerte de même taille (perle de verre, pièce de monnaie).
- Les objets « anti-stress » ou de bureau à billes magnétiques ne sont généralement **pas destinés aux moins de 14 ans**.
- En cas de doute d’ingestion, **même non confirmée**, appelez un centre antipoison ; en cas de signe de gravité, le **15** ou le **112**.

## Comprendre
En 2021, Santé publique France, la Direction générale de la santé, la DGCCRF et l’Anses ont alerté sur deux cas graves chez des enfants de 3 ans ou moins, qui avaient avalé des billes aimantées de 3 à 5 mm provenant d’objets anti-stress pour adultes. Les autorités rappellent aussi que les billes de certains jeux de construction peuvent être avalées par de jeunes enfants.

Le mécanisme est particulier : lorsqu’un enfant avale **plusieurs aimants**, ou un aimant et un objet métallique, ceux-ci peuvent s’attirer d’une anse intestinale à l’autre, pincer la paroi, bloquer le tube digestif et la perforer. La DGCCRF précise qu’un aimant accessible peut aussi provoquer un étouffement.

Côté réglementation, les produits à billes magnétiques (blocs de construction, gadgets de bureau) relèvent le plus souvent de l’obligation générale de sécurité et ne sont pas conçus pour les moins de 14 ans ; les fabricants doivent indiquer de les tenir éloignés des enfants. Les billes aimantées qui accompagnent un jouet doivent, elles, respecter la réglementation sur les jouets. Les coffrets d’expériences magnétiques ou électriques portent l’avertissement : « Attention ! Ne convient pas aux enfants de moins de 8 ans. Ce produit contient de petits aimants. »

Les autorités soulignent que des objets pour adultes, des jeux de construction « 14 ans et plus » ou des jouets magnétiques pour les 3-14 ans peuvent devenir très dangereux lorsqu’un plus jeune enfant s’en empare. Les enfants peuvent aussi confondre les billes avec des **bonbons**.

## Au quotidien
- **Repérez les aimants** de la maison : objets anti-stress, sculptures de bureau, aimants de réfrigérateur dont l’aimant se détache, jeux de construction magnétiques, tableaux et lettres aimantées, accessoires de décoration.
- Gardez les objets à billes magnétiques **strictement hors de portée** des enfants, rangés dans une boîte fermée.
- Pour un jeu de construction magnétique, vérifiez l’**âge indiqué** et inspectez régulièrement les pièces : un aimant qui se détache d’une pièce cassée doit être retiré immédiatement.
- Comptez les billes après usage d’un jeu qui en contient, avec l’aîné : une bille manquante se cherche tout de suite.
- **Expliquez** aux enfants plus grands (et aux adolescents) que ces billes ne se mettent jamais dans la bouche.
- Avant d’offrir un gadget magnétique, vérifiez qu’il n’y a pas de jeune enfant dans le foyer.

## Questions fréquentes
**Un seul aimant avalé est-il moins grave ?**
Le risque majeur vient de l’attraction entre plusieurs aimants ou avec un objet métallique, mais on ne sait pas toujours combien de billes ont été avalées. Dans tous les cas, demandez un avis sans tarder.

**Mon enfant semble en pleine forme après avoir peut-être avalé une bille. J’attends ?**
Non. Les autorités demandent d’appeler un centre antipoison dès la **suspicion**, même si l’ingestion n’est pas confirmée.

**Les lettres aimantées pour réfrigérateur sont-elles concernées ?**
Tout aimant accessible peut être avalé. Vérifiez que les aimants sont bien intégrés et ne se détachent pas, et gardez les plus petits hors de portée des tout-petits.

**Que deviennent les produits dangereux ?**
Les produits déclarés dangereux font l’objet de rappels par la DGCCRF, publiés sur RappelConso.

## Quand demander conseil
En cas de suspicion d’ingestion d’aimants : contactez immédiatement un centre antipoison (centres-antipoison.net). Si votre enfant a mal au ventre, vomit, s’étouffe ou paraît mal, appelez le 15 ou le 112. ${URG}

${FIN}`,
  }),
  a({
    slug: 'collier-ambre-chainette-attache-sucette-etranglement',
    title: 'Collier d’ambre, chaînette, attache-sucette au cou : pourquoi rien autour du cou de bébé',
    summary: 'Les colliers de dentition n’ont pas fait la preuve de leur efficacité et exposent à l’étranglement ; voici les alternatives et les bons réflexes avec la tétine.',
    category: 'securite', tags: ['collier d’ambre', 'collier de dentition', 'chaînette', 'médaille', 'attache-sucette', 'tétine', 'étranglement', 'poussée dentaire', 'anneau de dentition'],
    min_age_months: 0, max_age_months: 36,
    sources: [S.ambre, S.puericulture, S.coucher],
    body_md: `## En bref
- **Aucune étude** n’a démontré l’efficacité des colliers d’ambre sur les désagréments des poussées dentaires.
- Leur **dangerosité est avérée** : risque d’étranglement et d’étouffement si les perles sont avalées.
- Le risque concerne **tout collier ou chaînette** porté par un nourrisson, pas seulement l’ambre ; les pédiatres déconseillent aussi d’**attacher la tétine au cou**.
- Pour soulager les gencives : un **anneau de dentition** en matière élastique, mis au réfrigérateur (pas au congélateur), et l’avis du pharmacien.

## Comprendre
Les premières dents apparaissent généralement entre le 3e et le 8e mois. On leur attribue souvent fièvre, diarrhée ou irritabilité, mais Santé.fr rappelle qu’aucune preuve ne relie ces épisodes à la dentition. Depuis longtemps, des objets « protecteurs » ont été proposés : médailles, colliers de graines, de buis ou d’ambre.

Sur l’efficacité, le constat est net : aucune étude ne la démontre. L’explication avancée par certains fabricants (des « ions » libérés par frottement) n’a jamais été étudiée. La DGCCRF a obligé en 2012 une société à retirer l’allégation selon laquelle l’ambre soulagerait les douleurs dentaires, et l’ANSM avait interdit en 2011 des publicités aux allégations non prouvées.

Sur les risques, en revanche, les signaux sont clairs. La Société française de pédiatrie a alerté les parents en 2012. Lors d’une enquête de la DGCCRF en 2015, 28 colliers et bracelets dangereux ont été identifiés, presque tous en ambre. Selon les normes citées par Santé.fr, un collier pour enfant doit céder à partir d’une certaine traction (le fermoir doit se rompre pour éviter l’étranglement) tout en étant assez solide pour que les perles ne soient pas avalées : un équilibre délicat. Les attaches-sucettes, les tétines et les anneaux de dentition restent soumis à l’obligation générale de sécurité du Code de la consommation, rappelle la DGCCRF.

## Au quotidien
**Ce qu’on évite**
- Tout **collier, chaînette, médaille ou bracelet** de perles sur un nourrisson, de jour comme de nuit, même sous surveillance.
- La **tétine suspendue au cou** par un ruban ou une ficelle.
- Tout lien autour du cou du bébé. Pour dormir, l’Assurance Maladie recommande un lit dégagé, sans oreiller, couette ni peluche volumineuse.

**Ce qu’on peut proposer**
- Un **anneau de dentition** en matière élastique, passé au réfrigérateur. Évitez le congélateur : le froid intense peut brûler la gencive.
- Demander conseil au pharmacien ou au médecin pour les produits à appliquer sur la gencive.

**Si vous utilisez une attache-sucette**
Choisissez un modèle prévu pour cet usage, qui s’accroche au vêtement et jamais autour du cou, et vérifiez régulièrement son état. Pour le sommeil, gardez un lit dégagé, comme le recommande l’Assurance Maladie.

**Le cadeau de naissance**
Une médaille de baptême ou une gourmette offerte par la famille peut être gardée précieusement… dans une boîte, pour plus tard.

## Questions fréquentes
**Et si je l’enlève pour la nuit et la sieste ?**
Le risque d’étranglement ou d’étouffement par les perles existe aussi en journée. Santé.fr conclut qu’il ne faut jamais faire porter de collier ou de chaînette à un nourrisson.

**Le collier en bois, en silicone ou porté à la cheville est-il plus sûr ?**
Le danger tient à la forme (un lien et des petites perles), quel que soit le matériau. L’enquête de 2015 de la DGCCRF a d’ailleurs aussi identifié un modèle en noisetier.

**Mon bébé est très gêné par ses dents : que faire ?**
Proposez l’anneau réfrigéré, des câlins, et parlez-en au médecin ou au pharmacien. Si votre bébé a de la fièvre, ne l’attribuez pas d’emblée aux dents.

**On m’a offert un collier d’ambre en pharmacie : est-ce gage de sécurité ?**
Non. Le lieu de vente ne change pas le risque. Les auteurs d’une étude citée par Santé.fr ont d’ailleurs proposé d’interdire leur vente en pharmacie.

## Quand demander conseil
Si votre bébé a de la fièvre, refuse de boire, ou si quelque chose vous inquiète pendant une poussée dentaire, consultez votre médecin. Si un lien s’est enroulé autour de son cou ou s’il a avalé une perle et respire mal, appelez immédiatement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'peluches-poupees-bien-choisir-verifier',
    title: 'Peluches et poupées : coutures, yeux, rembourrage, ce qu’il faut vérifier',
    summary: 'Les points de contrôle de la DGCCRF avant d’offrir une peluche à un tout-petit, l’entretien au fil du temps, et la place des peluches dans le lit.',
    category: 'securite', tags: ['peluche', 'doudou', 'poupée', 'poupon', 'coutures', 'rembourrage', 'yeux de peluche', 'bouillotte peluche', 'sommeil'],
    min_age_months: 0, max_age_months: 72, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.peluches, S.dgccrfControle, S.coucher],
    body_md: `## En bref
- Une peluche pour tout-petit ne doit pas avoir de **petits éléments** qui s’arrachent, des **coutures** trop fragiles ni de matériaux inflammables.
- Avant l’achat : vérifiez **yeux et nez bien fixés**, coutures solides, **poils qui ne se détachent pas** quand on secoue.
- Évitez les peluches « en situation » avec de **petits accessoires** attachés (skis, échelle, hotte…).
- Dans le lit d’un bébé, pas de **peluche volumineuse** : elle pourrait recouvrir son visage.

## Comprendre
Les peluches comptent parmi les jouets préférés des jeunes enfants, mais ce sont aussi des objets qu’ils mâchonnent, sucent et traînent partout. La DGCCRF rappelle qu’elles doivent être conçues pour les tout-petits : pas de petits éléments, souples ou rigides, qui s’arrachent facilement ; des coutures capables de retenir le rembourrage et les petits éléments (par exemple un grelot à l’intérieur) ; pas de matériaux inflammables. Certaines peluches sont d’ailleurs déconseillées aux moins de 36 mois.

Lors de ses contrôles, la DGCCRF relève régulièrement des **rembourrages accessibles** (risque d’étouffement si l’enfant en avale). Elle signale aussi un point de vigilance sur les **bouillottes peluches à chauffer au micro-ondes**, qui peuvent provoquer des brûlures.

Pour le sommeil, l’Assurance Maladie déconseille dans le lit du bébé les oreillers, couettes, édredons, peaux de mouton et **peluches volumineuses**, qui peuvent recouvrir son visage.

## Au quotidien
**En magasin, le test en cinq gestes**
1. **Regardez** les accessoires : pompons, feutrine collée, rubans, boutons. Ce qui peut se détacher peut être avalé.
2. **Tirez doucement** sur les yeux, le nez, les oreilles : ils doivent être solidement fixés.
3. **Inspectez les coutures** et la qualité du tissu : le rembourrage ne doit pas être accessible.
4. **Secouez** la peluche : les poils ne doivent pas se détacher.
5. **Choisissez la taille** : une peluche trop grande sera difficile à manipuler pour un petit.

La DGCCRF conseille de préférer une peluche non emballée, que l’on peut toucher.

**À la maison, au fil du temps**
- Inspectez régulièrement les peluches les plus aimées : une couture qui lâche, un œil qui bouge, une étiquette qui se déchire.
- Réparez solidement ou mettez de côté une peluche abîmée.
- Suivez les consignes de lavage de l’étiquette.
- Rangez à part les peluches de collection, les poupées décoratives et celles qui portent de petits accessoires.

**Pour dormir**
Pour un bébé, le lit reste dégagé : sur le dos, dans une gigoteuse adaptée, sans peluche volumineuse. Si vous souhaitez lui laisser un doudou, demandez conseil à votre médecin ou à la PMI sur le moment et le type d’objet.

**Les bouillottes peluches**
La DGCCRF signale un risque de brûlure. Si vous en utilisez une, respectez strictement la notice (temps et puissance de chauffe) et vérifiez la température avant de la donner à l’enfant.

## Questions fréquentes
**Une peluche avec un grelot est-elle adaptée à un bébé ?**
Elle doit avoir des coutures assez solides pour que le grelot reste inaccessible. Vérifiez-les régulièrement.

**Les poupées aux cheveux longs ou aux petits vêtements conviennent-elles aux tout-petits ?**
Regardez l’âge indiqué : les petits accessoires (chaussures, barrettes) et certaines poupées de collection ne conviennent pas aux moins de 3 ans.

**La peluche gagnée à la fête foraine est-elle sûre ?**
Elle doit respecter les mêmes règles, mais la DGCCRF relève davantage de manquements chez certains vendeurs non spécialisés. Faites le test des cinq gestes.

**Faut-il laver une peluche neuve ?**
Suivez simplement les consignes d’entretien de l’étiquette.

## Quand demander conseil
Si votre enfant a avalé un morceau de rembourrage, un œil ou un petit élément et tousse, s’étouffe ou respire mal, appelez immédiatement. Pour une brûlure liée à une bouillotte, refroidissez sous l’eau tempérée et demandez un avis médical. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jouets-occasion-herites-vide-grenier-verifier',
    title: 'Jouets d’occasion, hérités ou de vide-grenier : les vérifications avant de les donner',
    summary: 'Les jouets anciens peuvent ne plus répondre aux normes actuelles : comment trier, inspecter et décider de garder, réparer ou écarter.',
    category: 'securite', tags: ['jouets d’occasion', 'vide-grenier', 'seconde main', 'jouets anciens', 'jouets hérités', 'brocante', 'piles anciennes', 'normes'],
    min_age_months: 0, max_age_months: 120,
    sources: [S.conseilsJouets, S.jouetsAge, S.rappelConso],
    body_md: `## En bref
- La DGCCRF le rappelle : **les jouets anciens peuvent ne pas répondre aux normes de sécurité actuelles**.
- Les vieux jouets à **piles anciennes, abîmées ou mal remplacées** peuvent présenter un danger.
- Les articles **d’occasion ne sont pas soumis** à la déclaration de rappel sur RappelConso : c’est à vous de vérifier.
- Sans notice ni emballage, l’âge et les avertissements sont souvent perdus : **examinez le jouet** avec un regard de tout-petit.

## Comprendre
La seconde main est économique et écologique, et les jouets de famille ont souvent une grande valeur affective. Mais un jouet a pu être conçu à une époque où les règles étaient différentes, ou s’user avec le temps : plastique devenu cassant, peinture qui s’écaille, coutures fatiguées, compartiment à piles fragilisé.

La DGCCRF conseille de préférer les plastiques colorés dans la masse à la peinture qui peut s’écailler, les mécanismes simples pour les jeunes enfants, et de vérifier que les piles ne sont pas facilement accessibles. Elle précise que les vieux jouets, notamment à piles anciennes, abîmées ou mal remplacées, peuvent ne plus respecter les normes et présenter un danger.

Autre point méconnu : selon Service-public.fr, les articles d’occasion, reconditionnés ou les antiquités ne sont pas soumis à la déclaration sur RappelConso. Pour un jouet encore récent, vous pouvez néanmoins rechercher s’il a fait l’objet d’un rappel lorsqu’il était neuf.

## Au quotidien
**Au vide-grenier ou sur une plateforme de seconde main**
- Demandez l’**âge prévu** et la notice si elle existe ; regardez si le **marquage CE** est encore visible.
- Manipulez le jouet : pièces qui bougent, éléments qui se détachent, arêtes coupantes, fissures.
- Pour un jouet à piles : ouvrez le compartiment. Traces de coulure, couvercle qui ne tient plus, vis manquante : prudence.
- Pour une peluche : coutures, yeux, rembourrage.
- Évitez les jouets dont vous ne pouvez pas évaluer l’état (lots fermés, photos floues).

**Pour les jouets hérités de la famille**
- Faites un tri : certains seront des **objets souvenirs**, à exposer en hauteur ou à ressortir quand l’enfant sera plus grand, sous surveillance.
- Retirez les **piles anciennes** et ne remettez en service un jouet électrique que s’il est en bon état.
- Méfiez-vous des jouets peints anciens dont la peinture s’effrite et des petites pièces (billes, figurines, accessoires de dînette miniatures) pour un enfant de moins de 3 ans.

**Nettoyer**
Lavez ou nettoyez selon la matière. Un jouet propre en apparence n’est pas forcément en bon état : l’inspection reste indispensable.

**Donner ou revendre à votre tour**
Joignez la notice si vous l’avez, signalez l’âge prévu et les éventuels défauts, et écartez les jouets cassés.

## Questions fréquentes
**Le train électrique de mon enfance peut-il servir à mon fils de 5 ans ?**
Peut-être, sous surveillance et après vérification de l’état des câbles, du transformateur et des petites pièces. Il ne répond probablement pas aux normes actuelles : traitez-le comme un objet à utiliser avec un adulte.

**Comment savoir si un jouet d’occasion a été rappelé ?**
Si vous connaissez le fabricant et le modèle, recherchez-le sur RappelConso, rubrique jouets. L’absence de résultat ne garantit pas la sécurité d’un jouet ancien ou usé.

**Les jouets en bois anciens sont-ils plus sûrs ?**
Pas forcément : peinture qui s’écaille, échardes, petites pièces ou ficelles peuvent poser problème. Examinez-les comme les autres.

**Un jouet sans âge indiqué peut-il convenir à un bébé ?**
Seulement s’il ne présente aucune petite pièce, aucun élément détachable, aucun cordon long et aucune pile accessible. Dans le doute, réservez-le aux plus grands.

## Quand demander conseil
Si un jouet ancien se casse et que votre enfant a pu avaler un morceau, une bille ou une pile, ou s’il s’est blessé, demandez un avis médical sans tarder. ${URG}

${FIN}`,
  }),
  a({
    slug: 'acheter-jouets-en-ligne-places-de-marche-vigilance',
    title: 'Acheter des jouets en ligne et sur les places de marché : les points de vigilance',
    summary: 'Les contrôles de la DGCCRF montrent davantage de jouets non conformes chez certains vendeurs en ligne : comment choisir le site, lire la fiche produit et réagir à réception.',
    category: 'securite', tags: ['acheter en ligne', 'place de marché', 'marketplace', 'jouet pas cher', 'vendeur hors Europe', 'contrefaçon', 'achat internet jouet', 'SignalConso'],
    min_age_months: 0, max_age_months: 168, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.dgccrfControle, S.conseilsJouets, S.rappelConso],
    body_md: `## En bref
- La DGCCRF réalise chaque année des **achats « mystères »** sur les places de marché : en 2022, une part importante des jouets analysés étaient non conformes, et beaucoup dangereux.
- Les problèmes viennent souvent de **vendeurs tiers**, fréquemment situés hors d’Europe, qui méconnaissent les normes.
- Choisissez un **site de confiance**, identifiez **qui vend** réellement, et lisez l’âge et les avertissements sur la fiche produit.
- À réception, vérifiez le jouet comme en magasin : **marquage CE, notice en français, avertissements**.

## Comprendre
Les jouets se vendent aussi en ligne, sur des sites spécialisés ou des places de marché. Les sites de vente à distance doivent afficher certaines informations obligatoires, rappelle la DGCCRF. Pourtant, ses contrôles montrent que l’achat en ligne demande une vigilance particulière.

Depuis 2018, la DGCCRF mène une campagne annuelle d’achats sur les places de marché. En 2022, sur 49 jouets analysés (déguisements, peluches, peintures au doigt, pâte à modeler, jeux à piles), elle indique 28 % de produits non conformes et 41 % de non conformes et dangereux. Elle pointe des vendeurs tiers, souvent hors Europe, et des dispositifs de filtrage insuffisants. Les obligations des places de marché ont été renforcées par le règlement européen sur les services numériques, applicable depuis février 2024.

Service-public.fr indique aussi qu’en septembre 2025, la DGCCRF et les autorités européennes ont obtenu le retrait d’une dizaine de produits dangereux vendus sur de grandes places de marché, dont des jouets, et recommande une vigilance particulière pour les achats hors Union européenne.

## Au quotidien
**Avant de commander**
- Distinguez le **site** du **vendeur** : sur une place de marché, le jouet peut être vendu par une entreprise tierce. Regardez son nom, son pays, ses coordonnées.
- Lisez la fiche : **âge minimal**, avertissements (« ne convient pas aux moins de 36 mois »…), mention du marquage CE, photos de l’emballage.
- Comme le conseille la DGCCRF, choisissez un **site de confiance**.
- Une description approximative, sans âge ni avertissement, ou mal traduite, est un signal d’alerte.
- Vérifiez sur **RappelConso** si le produit fait l’objet d’un rappel.

**À la réception**
- Examinez l’emballage : marquage CE, âge, avertissements, nom et adresse du fabricant ou de l’importateur, notice en français.
- Inspectez le jouet : petites pièces détachables, compartiment à piles non vissé, aimants accessibles, cordons longs sur un déguisement.
- Si quelque chose cloche, **ne le donnez pas à l’enfant** : contactez le vendeur pour un retour, et signalez le produit.

**Les catégories à surveiller particulièrement**
Les contrôles de la DGCCRF citent souvent : déguisements (inflammabilité, cordons), peluches (rembourrage accessible), jouets lumineux (intensité des LED), jouets à piles bouton, pâtes à modeler et peintures au doigt (substances chimiques).

## Questions fréquentes
**Un jouet vendu par une grande plateforme est-il forcément contrôlé ?**
Non. La plateforme héberge souvent des vendeurs tiers ; les contrôles de la DGCCRF montrent des taux de non-conformité élevés chez certains d’entre eux.

**Comment signaler un jouet dangereux acheté en ligne ?**
Sur SignalConso, rubrique dédiée aux achats sur internet. La DGCCRF peut ensuite intervenir.

**Le jouet ne porte pas de marquage CE alors que la photo en montrait un : que faire ?**
Ne l’utilisez pas, contactez le vendeur pour un retour et signalez-le sur SignalConso.

**Les jouets vendus hors Union européenne respectent-ils nos normes ?**
Rien ne le garantit : Service-public.fr recommande une vigilance particulière pour ces achats.

## Quand demander conseil
Si un jouet acheté en ligne a blessé votre enfant, provoqué une réaction cutanée, ou si votre enfant en a avalé un élément, demandez un avis médical et conservez le produit et la commande pour le signalement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ rappels et signalements
  a({
    slug: 'rappel-de-jouet-rappelconso-que-faire',
    title: 'Un jouet de votre enfant est rappelé : s’informer et réagir avec RappelConso',
    summary: 'Comment savoir si un jouet est concerné par un rappel, vérifier le lot, et obtenir un remboursement ou un échange.',
    category: 'securite', tags: ['rappel jouet', 'RappelConso', 'rappel conso', 'jouet rappelé', 'numéro de lot', 'remboursement', 'retrait', 'alerte produit'],
    min_age_months: 0, max_age_months: 168, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.rappelConso, S.retraitsRappels, S.incRappels],
    body_md: `## En bref
- **RappelConso** est le site public qui recense les rappels de produits dangereux, alimentaires et non alimentaires, dont les **jouets**.
- Un **retrait** concerne un produit encore en magasin ; un **rappel**, un produit déjà vendu, que l’on rapporte ou détruit.
- Si vous possédez un jouet rappelé : **mettez-le de côté**, vérifiez le **lot** et suivez les consignes de la fiche.
- Gardez **emballages, tickets et notices** des jouets récents : ils facilitent l’identification et le remboursement.

## Comprendre
Lorsqu’un fabricant, un importateur ou un distributeur décide de rappeler un produit pour une raison de sécurité, il doit le déclarer sur RappelConso, le site géré par la DGCCRF, et en informer les consommateurs. Ces mesures peuvent faire suite à un contrôle des autorités, à un signalement, à un accident ou à une alerte nationale ou européenne.

La différence entre les deux mesures est simple : il n’y a pas de rappel sans retrait, mais un retrait peut exister sans rappel. Le **retrait** consiste à enlever le produit des rayons et des entrepôts. Le **rappel** s’adresse aux personnes qui l’ont déjà acheté.

Un rappel vise en général des **lots précis**, vendus dans certaines enseignes, sur une période donnée. Il ne concerne pas forcément tous les exemplaires d’un modèle. Les médicaments et dispositifs médicaux suivent une procédure distincte, gérée par l’ANSM. Les articles d’occasion, reconditionnés ou les antiquités ne sont pas soumis à la déclaration sur RappelConso.

## Au quotidien
**S’informer**
- Sur **RappelConso** : recherche par catégorie (rubrique jouets), filtres par date ou type de risque, fiche détaillée pour chaque rappel. Vous pouvez aussi recevoir des **alertes** dès la publication d’un rappel.
- En magasin : affichettes en rayon, mention sur le ticket de caisse, SMS ou courriel aux détenteurs de carte de fidélité.
- Par la presse, qui relaie parfois les alertes.
- Avant d’acheter, la DGCCRF conseille de consulter RappelConso pour vérifier qu’un jouet n’est pas concerné.

**Si un jouet que vous possédez est rappelé**
1. **Retirez-le** des mains de l’enfant et mettez-le hors de portée.
2. **Comparez** avec la fiche : photo, nom, numéro de lot ou référence, distributeur, période de vente.
3. **Suivez les instructions** : retour en magasin pour remboursement ou échange, destruction selon les consignes, ou contact avec le service client.
4. **Conservez les preuves d’achat** (ticket, photos) et l’emballage.
5. **Prévenez votre entourage** : le même jouet a pu être offert aux cousins, à la crèche, chez l’assistante maternelle.

**Une astuce d’organisation**
Gardez dans une pochette les tickets et notices des jouets de valeur ou électroniques, ou photographiez les étiquettes avec le numéro de lot.

## Questions fréquentes
**Le jouet n’a jamais posé de problème chez nous. Faut-il quand même le rendre ?**
Oui. Un rappel signifie qu’un risque a été identifié pour ce produit ; le fait qu’aucun incident ne soit survenu ne protège pas des suivants.

**Je n’ai plus le ticket de caisse. Puis-je être remboursé ?**
La fiche RappelConso précise les modalités propres à chaque rappel, dans sa rubrique d’informations pratiques. Renseignez-vous auprès du magasin indiqué.

**Mon enfant a joué avec le jouet rappelé : que dois-je surveiller ?**
Selon le risque décrit (petites pièces, substance chimique, pile accessible…), surveillez son état. En cas de symptôme inhabituel, demandez conseil à un professionnel de santé.

**Existe-t-il des alertes au niveau européen ?**
Oui, le système **Safety Gate** de la Commission européenne publie chaque semaine une liste de produits dangereux signalés dans l’Union.

## Quand demander conseil
Si votre enfant a été exposé au défaut décrit dans le rappel et présente un symptôme inhabituel, consultez votre médecin. En cas d’ingestion d’une pile, d’un aimant ou d’une petite pièce, ou de gêne respiratoire, appelez sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'signaler-jouet-dangereux-signalconso',
    title: 'Un jouet vous semble dangereux ou a blessé votre enfant : comment le signaler',
    summary: 'SignalConso, DDPP, portail des effets indésirables : à qui s’adresser, quelles informations garder, et ce que devient votre signalement.',
    category: 'vie-pratique', tags: ['signaler un jouet', 'SignalConso', 'jouet dangereux', 'accident jouet', 'DDPP', 'réclamation', 'DGCCRF', 'litige'],
    min_age_months: 0, max_age_months: 168,
    sources: [S.retraitsRappels, S.incRappels, S.jouetsAge],
    body_md: `## En bref
- **SignalConso** permet de signaler en quelques clics un défaut de sécurité, un produit défectueux ou un problème avec un vendeur, en magasin comme en ligne.
- Pour un **produit non alimentaire** comme un jouet, vous pouvez aussi saisir la DGCCRF ou la **direction départementale de protection des populations** (DDPP ou DDETSPP).
- **Conservez** le jouet, l’emballage, la notice, la preuve d’achat et des photos.
- D’abord, **mettez l’enfant à l’abri** et, s’il est blessé, faites-le soigner.

## Comprendre
Les signalements des consommateurs sont une source précieuse pour les autorités. Selon la DGCCRF, lorsqu’elle reçoit une plainte concernant la sécurité d’un jouet, elle identifie le responsable de la mise sur le marché et peut faire analyser le produit ; la commercialisation peut être suspendue dans l’attente des résultats. Si le jouet est jugé dangereux, un retrait ou un rappel peut être décidé et publié sur RappelConso.

**SignalConso** est la plateforme publique de la DGCCRF. Elle sert à signaler un problème (défaut de sécurité, produit défectueux, pratique commerciale douteuse), alors que RappelConso informe sur les produits déjà identifiés comme dangereux. Vous choisissez « achat en magasin » ou « achat sur internet », puis vous êtes guidé.

Pour les **effets indésirables sur la santé** liés à certains produits (cosmétiques, produits d’entretien, aliments…), un portail du ministère chargé de la santé recueille les signalements des usagers comme des professionnels.

## Au quotidien
**Juste après l’incident**
- Mettez le jouet hors de portée et éloignez les autres enfants.
- Soignez ou faites soigner votre enfant si besoin.
- Ne jetez rien : le jouet, ses morceaux, l’emballage et la notice serviront à identifier le produit.

**Rassembler les informations**
- Nom du jouet, fabricant ou importateur, référence, numéro de lot si présent.
- Lieu et date d’achat (ticket, confirmation de commande, nom du vendeur sur une place de marché).
- Photos du défaut : pièce qui se détache, compartiment à piles qui s’ouvre, cordon trop long, échauffement.
- Description courte et factuelle de ce qui s’est passé, et de l’âge de l’enfant.

**Faire le signalement**
- Sur **SignalConso**, en suivant le parcours proposé.
- Ou auprès de la **DDPP/DDETSPP** du département où se trouve le commerce.
- Vous pouvez aussi contacter le vendeur ou le fabricant pour demander un remboursement. En cas de litige, une association de consommateurs agréée peut vous aider à rédiger une réclamation.

**Exemples de situations à signaler**
- Un hochet dont une partie se détache dès les premiers jours.
- Une peluche dont le rembourrage sort par une couture.
- Un jouet lumineux dont la lumière éblouit fortement.
- Un déguisement avec un long cordon au cou.
- Un jouet sans marquage CE ni notice en français.

## Questions fréquentes
**Mon signalement sera-t-il vraiment lu ?**
Les signalements alimentent le travail des enquêteurs. Plus ils sont précis (photos, références), plus ils sont utiles.

**Faut-il attendre un accident pour signaler ?**
Non. Un défaut constaté (pièce qui se détache, piles accessibles, absence d’avertissement) peut être signalé avant tout accident.

**Puis-je signaler un jouet acheté sur internet ?**
Oui, SignalConso prévoit un parcours dédié aux achats sur internet, en plus de celui des achats en magasin.

**Le signalement remplace-t-il une plainte ?**
Non. Si vous souhaitez porter plainte, le portail Ma Sécurité permet une démarche en ligne.

## Quand demander conseil
Si votre enfant est blessé, a avalé un élément, s’est brûlé ou a respiré un produit, l’urgence est d’abord médicale : demandez un avis à votre médecin ou appelez selon la gravité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'objets-attirants-qui-ne-sont-pas-des-jouets',
    title: 'Figurines de collection, décorations, gadgets : ces objets qui attirent les enfants sans être des jouets',
    summary: 'Certains objets ressemblent à des jouets mais n’en sont pas : lesquels, pourquoi ils posent problème aux plus jeunes, et comment les ranger.',
    category: 'securite', tags: ['figurine de collection', 'décoration de Noël', 'gadget', 'objet anti-stress', 'imitation d’aliment', 'modèle réduit', 'puzzle 1000 pièces', 'pas un jouet'],
    min_age_months: 0, max_age_months: 120,
    sources: [S.jouetsAge, S.conseilsJouets, S.billesAimantees],
    body_md: `## En bref
- Poupées de collection, décorations de fêtes, modèles réduits pour adultes, figurines de collection, puzzles de plus de 500 pièces : la DGCCRF les cite parmi les **objets attirants qui ne sont pas des jouets**.
- Ils ne sont **pas conçus** pour résister aux usages d’un jeune enfant : petites pièces, pointes, verre, aimants, piles.
- Les **objets d’adulte** (gadgets, papeterie, imitations d’aliments, décorations de Noël) sont à garder **hors de portée**.
- Les objets anti-stress à billes aimantées ont été à l’origine d’accidents graves chez des enfants de 3 ans ou moins.

## Comprendre
Un enfant ne fait pas la différence entre un jouet et un objet qui y ressemble. Pour lui, une figurine posée sur une étagère, une boule de sapin brillante ou un fruit en résine sont des invitations à jouer. Or ces objets ne sont pas soumis aux exigences propres aux jouets : ils peuvent contenir de petits éléments, se briser en éclats, comporter des aimants ou des piles accessibles.

La DGCCRF conseille donc d’**éviter les objets attirants non adaptés aux jeunes enfants** : poupées de collection ou folkloriques, décorations de fêtes, modèles réduits pour collectionneurs, puzzles de plus de 500 pièces, figurines de collection. Elle recommande aussi de garder hors de portée les **articles destinés aux adultes** : gadgets, papeterie, imitations d’aliments, décorations de Noël.

Santé publique France et ses partenaires ont alerté en 2021 sur des objets anti-stress pour adultes contenant de petites billes aimantées, avalées par de jeunes enfants avec des complications graves. Ces billes peuvent aussi être confondues avec des bonbons.

## Au quotidien
**Faire le tour de la maison à hauteur d’enfant**
- Étagères basses, table basse, rebords de fenêtre : y a-t-il des figurines, bibelots, bougies décoratives, galets ou billes en verre ?
- Bureau : trombones, punaises, gommes en forme de fruits, gadgets magnétiques, stylos à piles.
- Cuisine et salle à manger : imitations d’aliments décoratives, aimants de réfrigérateur.

**Les périodes de fête**
- Placez les décorations fragiles ou petites **en hauteur** sur le sapin, et préférez des décorations incassables en bas.
- Surveillez les guirlandes, les petits sujets de crèche, les confettis et les petites décorations de table.
- Après une fête, faites un ramassage au sol : capuchons, petites pièces, ballons dégonflés.

**Les collections des adultes et des aînés**
- Rangez les modèles réduits, figurines et puzzles en cours dans une **pièce fermée** ou une vitrine.
- Expliquez à l’aîné collectionneur pourquoi ses figurines restent dans sa chambre, porte fermée, quand le petit circule.

**Les objets offerts en cadeau**
Un gadget lumineux, un porte-clés figurine ou un objet anti-stress offert « pour amuser l’enfant » mérite d’être examiné : est-ce un jouet, avec marquage CE et âge indiqué, ou un objet d’adulte ?

## Questions fréquentes
**Comment savoir si un objet est un jouet ?**
Un jouet porte un marquage CE et, le plus souvent, un âge et des avertissements. Le fabricant ou l’importateur doit déterminer si son produit relève de la réglementation sur les jouets et définir la classe d’âge.

**Une figurine vendue en magasin de jouets est-elle forcément un jouet ?**
Pas toujours : certaines figurines sont des objets de collection pour adultes. Lisez l’emballage.

**Mon enfant de 6 ans peut-il manipuler ces objets ?**
Selon l’objet, sous surveillance et en expliquant les précautions. Le risque principal concerne les plus jeunes, qui portent les objets à la bouche, et les objets à aimants ou à piles.

**Les imitations d’aliments sont-elles dangereuses ?**
Elles attirent particulièrement les enfants, qui peuvent vouloir les goûter. La DGCCRF les cite parmi les objets d’adulte à garder hors de portée.

## Quand demander conseil
Si votre enfant a mis en bouche ou avalé un élément d’un objet décoratif, une bille, un aimant ou une pile, ou s’il s’est coupé avec un éclat, demandez un avis rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jouets-lumineux-sonores-electriques-led-piles',
    title: 'Jouets lumineux, sonores et électriques : LED, volume, piles et chargeurs',
    summary: 'Ce que la DGCCRF relève sur les jouets électriques (intensité des LED, piles accessibles, volume sonore) et les vérifications à faire avant et après l’achat.',
    category: 'securite', tags: ['jouet électrique', 'jouet lumineux', 'LED', 'jouet sonore', 'volume sonore', 'piles', 'transformateur', 'jouet à piles', 'rétine'],
    min_age_months: 0, max_age_months: 144,
    sources: [S.dgccrfControle, S.dgccrfVigilance, S.jouetsAge],
    body_md: `## En bref
- Parmi les dangers relevés par la DGCCRF sur les jouets électriques : **piles bouton accessibles**, **intensité lumineuse excessive des LED** (risque de lésion de la rétine) et **volume sonore**.
- Lors d’une action européenne de 2021, plus de la moitié des jouets électriques testés présentaient des manquements de marquage ou de notice.
- Vérifiez la **solidité du boîtier** et l’**inaccessibilité des piles**.
- Lisez la notice : précautions de charge, piles à utiliser, âge, surveillance.

## Comprendre
Les jouets qui s’allument, chantent ou bougent tout seuls ont beaucoup de succès. Ils réunissent aussi plusieurs sources de risques. La DGCCRF cite parmi les dangers principaux : les piles bouton accessibles dans des jouets électriques pour les plus de 3 ans, l’intensité lumineuse excessive de certaines LED, susceptible de provoquer des lésions de la rétine, et elle invite les consommateurs à être attentifs au volume sonore.

En 2021, une action européenne sur les jouets électriques a montré que plus de 52 % des jouets testés ne respectaient pas les règles de marquage ou de notice, et 25 % ne respectaient pas la norme européenne de sécurité des jouets électriques. Les jouets à piles destinés aux plus de 3 ans étaient plus souvent non conformes (37 %) que ceux destinés aux moins de 3 ans (16 %). Parmi les produits retirés figuraient des jouets de bain lumineux.

La DGCCRF rappelle aussi que des piles anciennes, abîmées ou mélangées peuvent être à l’origine d’accidents, et que les vieux jouets peuvent ne plus répondre aux normes actuelles.

## Au quotidien
**Avant l’achat**
- Vérifiez le **marquage CE**, l’âge, les avertissements et la **notice en français**.
- Regardez le **compartiment à piles** : il doit être solide ; pour les jeunes enfants, préférez une fermeture vissée.
- Essayez si possible le jouet en magasin : une lumière qui **éblouit** quand on la regarde de près, un son **strident** collé à l’oreille sont des signaux d’alerte.
- Pour un jouet rechargeable, regardez le chargeur fourni et les consignes de charge.

**À la maison**
- Changez les piles vous-même, hors de la vue des enfants, en respectant le type indiqué ; évitez de mélanger des piles anciennes, abîmées ou différentes.
- Déposez les piles usagées dans un **bac de collecte**.
- Surveillez l’état du jouet : boîtier fendu, couvercle qui ne tient plus, échauffement inhabituel.
- Pour la recharge, suivez la notice et le chargeur prévu.

**Le son et la lumière, au quotidien**
- Un jouet sonore utilisé tout près de l’oreille ou dans une petite pièce peut être très bruyant : préférez les modèles à **volume réglable** et le niveau le plus bas.
- Évitez que l’enfant fixe une lumière intense de près.

## Questions fréquentes
**Les jouets lumineux sont-ils déconseillés ?**
Non, mais certains modèles non conformes émettent une lumière trop intense. Achetez des produits conformes, chez des vendeurs identifiables, et soyez attentif à l’éblouissement.

**Mon enfant met son jouet musical contre son oreille : est-ce un problème ?**
La DGCCRF invite à être attentif au volume sonore. Si le jouet vous semble fort, baissez le volume ou retirez-le.

**Peut-on remplacer les piles d’origine par des piles rechargeables ?**
Suivez les indications de la notice sur le type de piles à utiliser.

**Le jouet chauffe pendant la charge : que faire ?**
Débranchez-le, ne l’utilisez plus et signalez le problème au vendeur ou sur SignalConso.

## Quand demander conseil
Si votre enfant se plaint des yeux après avoir regardé une lumière intense, s’il semble moins bien entendre, ou s’il a pu avaler une pile, demandez un avis médical ; pour une pile, appelez immédiatement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'deguisements-enfant-securite-inflammabilite-cordons',
    title: 'Déguisements d’enfant : inflammabilité, cordons et accessoires, les points de sécurité',
    summary: 'Carnaval, Halloween, anniversaires : ce que les contrôles révèlent sur les déguisements et comment choisir un costume adapté à l’âge.',
    category: 'securite', tags: ['déguisement', 'costume', 'carnaval', 'Halloween', 'inflammable', 'cordon', 'accessoires', 'bougie', 'masque'],
    min_age_months: 12, max_age_months: 144,
    sources: [S.dgccrfControle, S.dgccrfVigilance, S.dgccrfSurveillance],
    body_md: `## En bref
- La DGCCRF cite chaque année l’**inflammabilité** et la **longueur des cordons** parmi les principaux défauts des déguisements.
- Un long cordon au cou ou à la taille expose à un risque d’**étranglement**.
- Les déguisements figurent parmi les produits les plus souvent non conformes lors des achats en ligne contrôlés.
- Tenez toujours l’enfant déguisé **à distance des bougies et des flammes**.

## Comprendre
Les déguisements pour enfants sont des jouets : ils doivent porter le marquage CE et respecter des exigences de sécurité, notamment sur l’inflammabilité. Pourtant, les rapports de contrôle de la DGCCRF les citent régulièrement : déguisements inflammables, cordons trop longs, avertissements manquants. En 2021, la DGCCRF mentionne parmi les dangers clés les longs cordons de déguisements pouvant causer une strangulation ; en 2020, ses analyses relevaient des costumes inflammables.

Lors de ses achats « mystères » de 2022 sur les places de marché, les déguisements faisaient partie des catégories analysées, avec un taux élevé de produits non conformes et dangereux.

Pourquoi l’inflammabilité compte-t-elle ? Les tissus synthétiques légers, volants, capes et perruques peuvent s’enflammer au contact d’une bougie, d’une citrouille éclairée ou d’un gâteau d’anniversaire.

## Au quotidien
**Choisir le costume**
- Vérifiez le **marquage CE**, l’âge et les avertissements.
- Pour un tout-petit, préférez un costume **simple** : pas de petits accessoires cousus qui s’arrachent (boutons, perles, paillettes), pas de long cordon.
- Évitez les **cordons et liens coulissants** au niveau du cou ; méfiez-vous des capes nouées autour du cou.
- Choisissez une **taille adaptée** : un costume trop long fait trébucher.
- Les masques doivent laisser **bien voir et respirer**.

**Le jour de la fête**
- Expliquez à l’enfant de rester loin des **bougies**, citrouilles éclairées et barbecues ; préférez les bougies électriques dans la décoration.
- Vérifiez que l’enfant **voit bien** autour de lui, en particulier pour une sortie dans la rue le soir.
- Pour un défilé ou une sortie nocturne, ajoutez un élément **rétro-réfléchissant** visible.
- Retirez le costume pour la sieste et la nuit.

**Les accessoires**
Épées, baguettes, chapeaux, couronnes, faux bijoux : vérifiez qu’ils sont prévus pour l’âge de l’enfant, sans pointe dure et sans petite pièce détachable pour un enfant de moins de 3 ans. Les faux colliers ne conviennent pas aux bébés.

## Questions fréquentes
**Les déguisements doivent-ils porter le marquage CE ?**
Oui : les déguisements pour enfants sont contrôlés comme des jouets, et la DGCCRF relève parmi les manquements l’absence de marquage CE et d’avertissements.

**Un costume d’adulte retouché convient-il à un enfant ?**
Un costume pour adulte n’est pas un jouet et n’obéit pas aux mêmes exigences. Préférez un costume prévu pour les enfants.

**Comment savoir si le tissu est inflammable ?**
On ne peut pas le vérifier à la maison. D’où l’intérêt d’un costume conforme, avec marquage CE, et d’une distance stricte avec les flammes.

**Les déguisements achetés en ligne sont-ils plus risqués ?**
La DGCCRF a relevé de nombreux produits non conformes chez certains vendeurs tiers des places de marché. Vérifiez marquage, notice et cordons à réception.

## Quand demander conseil
En cas de flamme sur un vêtement : faites rouler l’enfant au sol ou étouffez le feu avec une couverture, refroidissez la brûlure à l’eau tempérée et appelez le **15** ou le **112**. Si un cordon s’est serré autour du cou, appelez immédiatement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ types de jouets
  a({
    slug: 'jeux-construction-societe-choisir-selon-age-6-12-ans',
    title: 'Jeux de construction et de société pour les 6–12 ans : choisir selon l’âge et gérer les petites pièces',
    summary: 'Pièces motorisées, mécanismes complexes, puzzles géants, pions et dés : les repères de la DGCCRF pour bien choisir, et s’organiser quand un plus petit est à la maison.',
    category: 'securite', tags: ['jeu de construction', 'jeu de société', 'briques', 'maquette', 'puzzle', 'petites pièces', 'cadeau enfant', 'âge conseillé'],
    min_age_months: 72, max_age_months: 144, journeys: ['child'],
    sources: [S.jeuxConstruction, S.jouetsAge, S.billesAimantees],
    body_md: `## En bref
- Adaptez le jeu et sa **complexité technique** à l’âge : la DGCCRF évoque les pièces **motorisées à partir de 8 ans** et les **mécanismes complexes à partir de 10 ans**.
- Pions, dés et petites pièces présentent un risque d’**étouffement** pour les jeunes enfants : rangez-les hors de leur portée.
- Les coffrets d’expériences **magnétiques ou électriques** portent souvent la mention « ne convient pas aux moins de 8 ans ».
- Cinq réflexes avant d’acheter : **CE**, avertissements, vendeur identifiable, prix cohérent, âge et niveau de l’enfant.

## Comprendre
Entre 6 et 12 ans, les jeux de construction et de société deviennent plus riches : maquettes, circuits, robots à monter, jeux de stratégie. La DGCCRF rappelle qu’il faut adapter le jouet **et sa complexité** à l’âge de l’enfant. Les plus jeunes de cette tranche préfèrent souvent des modèles figuratifs (maisons, véhicules, robots, animaux) et des constructions qui « servent » une fois terminées.

Ces jeux comportent presque toujours de **petites pièces**. Elles ne posent pas de problème pour un enfant de 8 ans, mais peuvent provoquer un étouffement chez un frère ou une sœur de 2 ans. La DGCCRF conseille de donner aux tout-petits des jeux conçus pour eux. Les jeux destinés aux plus de 3 ans portent un avertissement et un logo d’exclusion d’âge.

Les jeux magnétiques méritent une attention particulière : les autorités sanitaires ont alerté sur des billes aimantées issues de jeux de construction ou d’objets pour adultes, avalées par de jeunes enfants avec des complications graves.

## Au quotidien
**Les cinq réflexes de la DGCCRF avant d’acheter**
1. Vérifiez le **marquage CE**.
2. Lisez tous les **avertissements** de l’emballage.
3. Achetez auprès de commerces ou de fabricants identifiables, et manipulez le produit si possible.
4. Méfiez-vous des **prix anormalement bas**, qui peuvent signaler une contrefaçon.
5. Choisissez un jeu adapté à l’**âge, aux capacités et au niveau** de l’enfant.

**Choisir le bon niveau**
- Un jeu trop difficile décourage ; un jeu trop simple lasse. L’âge indiqué donne un repère, mais votre connaissance de l’enfant compte.
- Dans les magasins spécialisés, vous pouvez souvent demander conseil, voire tester un jeu sur place.
- Les **puzzles de plus de 500 pièces** sont cités par la DGCCRF parmi les objets qui ne sont pas des jouets.

**S’organiser à la maison**
- Prévoyez un **plateau** ou une boîte à rebords pour monter les constructions : les pièces se perdent moins.
- Rangez les jeux à petites pièces dans des boîtes fermées, en hauteur, si un tout-petit vit ou passe à la maison.
- Faites jouer les grands à table ou dans leur chambre pendant que le petit dort ou est occupé ailleurs.
- Après une partie, comptez rapidement les pions et les dés.

**Pour les jeux de société en famille**
Choisissez un jeu accessible à tous, et laissez au plus jeune un rôle adapté (lancer le dé sous surveillance, piocher les cartes) plutôt que les petites pièces.

## Questions fréquentes
**Mon enfant de 7 ans veut un robot à moteur marqué « 8 ans et plus ». Est-ce raisonnable ?**
L’âge reflète la complexité et les risques identifiés par le fabricant. Vous pouvez accompagner le montage, mais respectez l’indication si elle concerne la sécurité (petites pièces, aimants, électricité).

**Les jeux de construction aimantés conviennent-ils aux petits ?**
Seulement ceux conçus pour leur âge, avec des aimants intégrés et inaccessibles. Vérifiez régulièrement qu’aucune pièce n’est fendue.

**Faut-il garder la boîte d’origine ?**
C’est pratique : elle contient l’âge, les avertissements et les références utiles en cas de rappel.

**Que faire d’une pièce cassée qui laisse apparaître un aimant ?**
Retirez-la immédiatement et rangez-la hors de portée, ou jetez-la.

## Quand demander conseil
Si un plus jeune enfant a pu avaler une petite pièce ou un aimant, ou s’il tousse et respire mal après avoir joué avec les jeux des grands, demandez un avis sans attendre ; pour un aimant, appelez un centre antipoison. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jouets-de-bain-et-jouets-aquatiques-choisir-surveiller',
    title: 'Jouets de bain et jouets aquatiques : bien les choisir et ne jamais oublier la surveillance',
    summary: 'Petites pièces, LED, substances chimiques, avertissements obligatoires : ce qu’il faut vérifier, et pourquoi un jouet aquatique ne remplace jamais un adulte.',
    category: 'securite', tags: ['jouets de bain', 'jouet aquatique', 'bouée', 'jouet gonflable', 'piscine', 'noyade', 'surveillance', 'canard de bain'],
    min_age_months: 6, max_age_months: 120,
    sources: [S.jouetsAge, S.dgccrfSurveillance, S.zeroAccident],
    body_md: `## En bref
- Les **jouets aquatiques** doivent porter des **avertissements** spécifiques, notamment sur la surveillance par un adulte.
- Les contrôles de la DGCCRF relèvent des **petites pièces** sur des jouets de bain pour moins de 3 ans, des jouets de bain lumineux non conformes et, en 2022, des canards de bain contenant une substance interdite au-delà des seuils.
- Un enfant peut se noyer dans **très peu d’eau** : surveillance permanente, à portée de main.
- Un jouet gonflable n’est **pas un équipement de sécurité**.

## Comprendre
Le bain et les jeux d’eau sont des moments privilégiés. Les jouets qui les accompagnent doivent respecter la réglementation des jouets et, pour les **jouets aquatiques**, comporter des avertissements particuliers, comme ceux qui portent sur la surveillance d’un adulte. Lors de ses contrôles de 2020, la DGCCRF a relevé des avertissements réglementaires manquants sur des jouets aquatiques, et des petites pièces sur des jouets destinés aux moins de 3 ans, dont des jouets de bain et des hochets.

En 2021, la DGCCRF signale le retrait de près de 9 000 jouets de bain lumineux non conformes. En 2022, dans le cadre d’une action européenne sur les substances chimiques, des canards de bain en plastique contenant du bisphénol A au-delà des seuils réglementaires ont été retirés du marché.

Mais le principal danger, près de l’eau, reste la **noyade**. Santé.fr rappelle de surveiller bébé en permanence près de tout point d’eau, car un enfant peut se noyer dans très peu d’eau, et de préparer tout le matériel avant le bain.

## Au quotidien
**Choisir**
- Vérifiez **marquage CE**, âge et avertissements, en particulier la mention de surveillance.
- Pour les moins de 3 ans : pas de petites pièces détachables, pas de jouet dont un élément peut se dévisser.
- Pour un jouet lumineux : compartiment à piles **étanche et vissé**.
- Préférez des jouets faciles à **nettoyer et à sécher**.

**Entretenir**
- Après le bain, videz l’eau des jouets et laissez-les sécher.
- Écartez les jouets abîmés ou fissurés.

**Surveiller, toujours**
- Préparez **avant le bain** serviette, vêtements et jouets : vous n’aurez pas à vous éloigner.
- Restez **à portée de main** pendant toute la durée du bain, même avec un siège de bain ou un anneau.
- Si on sonne ou si le téléphone vibre, sortez l’enfant de l’eau et emmenez-le.
- Videz la baignoire, la pataugeoire ou la piscine gonflable dès la fin du jeu.

**Dehors : piscine, plage, pataugeoire**
- Les bouées, matelas et jouets gonflables sont des jouets : ils ne protègent pas de la noyade.
- Un adulte désigné surveille, sans téléphone ni lecture, et reste près de l’enfant dans l’eau.

## Questions fréquentes
**Les jouets avec un petit trou qui gicle sont-ils problématiques ?**
L’eau stagne à l’intérieur. Videz-les et laissez-les sécher ; écartez ceux qui restent sales.

**Comment savoir si un jouet de bain contient des substances interdites ?**
On ne peut pas le vérifier soi-même. Achetez des jouets conformes chez des vendeurs identifiables et consultez RappelConso.

**Un siège de bain permet-il de s’éloigner un instant ?**
Non : quel que soit l’équipement, la surveillance doit rester constante et à portée de main.

**Mon enfant de 4 ans nage avec une bouée : puis-je le laisser seul quelques minutes ?**
Non. Un jouet gonflable peut se dégonfler, se retourner ou glisser ; l’enfant doit rester sous la surveillance directe d’un adulte.

## Quand demander conseil
Si un enfant a été retrouvé dans l’eau, même brièvement, et tousse, respire mal ou semble somnolent, appelez immédiatement le 15 ou le 112. Si votre enfant a avalé une petite pièce de jouet de bain et tousse ou s’étouffe, appelez aussi. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ vélo, trottinette, EDPM
  a({
    slug: 'casque-velo-enfant-choisir-taille-regler',
    title: 'Casque de vélo de l’enfant : choisir la bonne taille et bien le régler',
    summary: 'Obligatoire avant 12 ans, le casque protège seulement s’il est conforme, à la bonne taille et bien ajusté : le mode d’emploi pas à pas.',
    category: 'materiel', tags: ['casque vélo', 'casque enfant', 'EN 1078', 'tour de tête', 'jugulaire', 'casque obligatoire', 'moins de 12 ans', 'vélo enfant'],
    min_age_months: 12, max_age_months: 156,
    sources: [S.incCasques, S.casquePrefecture, S.trottinettes],
    body_md: `## En bref
- Depuis le **22 mars 2017**, le casque est **obligatoire** à vélo pour les enfants de **moins de 12 ans**, conducteurs ou passagers.
- Un casque conforme porte le **marquage CE** et la référence de la norme **EN 1078** (casques de cycliste).
- La taille correspond au **tour de tête** : mesurez avec un mètre de couturier, puis **essayez**.
- Un casque bien réglé est **centré**, ni trop en avant ni trop en arrière, jugulaire et réglage arrière ajustés.

## Comprendre
L’obligation du port du casque pour les moins de 12 ans vise à réduire les blessures au visage et les traumatismes crâniens. Elle s’applique que l’enfant pédale ou soit transporté. C’est l’adulte qui accompagne l’enfant qui en est responsable : il encourt une amende de 4e classe s’il transporte un enfant sans casque ou encadre un groupe d’enfants non protégés.

Un casque se compose d’une **coque** qui amortit les chocs (une mousse recouverte d’un film plastique dur) et d’un **système de rétention** : sangles, boucle, réglage arrière. Pour l’INC, il doit porter le marquage CE et la mention de la norme EN 1078. Lors d’un essai de 18 casques pour enfants, l’INC a trouvé des résultats globalement satisfaisants, mais seuls 5 modèles respectaient entièrement la norme, notamment l’obligation d’une notice en français.

Attention aux confusions : la DGCCRF rappelle qu’une **imitation de casque** (accessoire de déguisement, casque-jouet) n’est pas un équipement de protection et ne protège pas l’enfant.

## Au quotidien
**Choisir la taille**
- Mesurez le **tour de tête** avec un mètre de couturier.
- Les tailles s’expriment en centimètres (par exemple 47-53 cm) ou en lettres (S, M, L) : comparez avec le tableau du fabricant.
- **Essayez** avec l’enfant : c’est la méthode la plus fiable. Ne prenez pas une taille au-dessus « pour qu’il dure plus longtemps ».

**Régler, pas à pas**
1. Posez le casque **bien centré**, ni trop en avant ni trop en arrière.
2. Serrez le **réglage arrière** (souvent une molette ou un velcro) jusqu’à ce que le casque tienne sans serrer.
3. Ajustez les **sangles** de chaque côté pour qu’elles soient bien à plat.
4. Fermez la **jugulaire** : elle doit maintenir le casque sans gêner la déglutition.
5. Vérifiez que le casque **ne gêne pas la vue** et ne bascule ni vers l’avant ni vers l’arrière quand l’enfant bouge la tête.

**Les petits plus**
- Une mousse de confort sous la jugulaire évite de pincer la peau.
- Des **éléments réfléchissants** ou un feu à l’arrière améliorent la visibilité.
- Les aérations rendent le casque plus agréable, donc mieux porté.

**Faire accepter le casque**
Montrez l’exemple : les enfants qui voient leurs parents casqués le portent plus volontiers. Laissez l’enfant choisir la couleur parmi des modèles conformes.

## Questions fréquentes
**Le casque est-il obligatoire sur une draisienne ou une trottinette ?**
L’obligation légale concerne le vélo. Pour les trottinettes et bicyclettes vendues comme jouets, la notice doit recommander des équipements de protection, dont le casque.

**Mon enfant a 12 ans : peut-il rouler sans casque ?**
L’obligation s’arrête à 12 ans, mais le casque reste recommandé à tout âge.

**Peut-on acheter un casque d’occasion ?**
On ne connaît pas son histoire (chocs, vieillissement). Si vous le faites, vérifiez marquage, notice et état de la coque et des sangles.

**Le casque doit-il être changé après une chute ?**
Si le casque a subi un choc important, suivez les recommandations de la notice du fabricant ; dans le doute, remplacez-le.

## Quand demander conseil
Après une chute avec choc à la tête, surveillez votre enfant. Appelez le 15 ou le 112 s’il perd connaissance, vomit, est inhabituellement somnolent, se plaint d’un mal de tête qui augmente, ou si son comportement vous inquiète. ${URG}

${FIN}`,
  }),
  a({
    slug: 'enfant-passager-velo-siege-remorque-casque',
    title: 'Transporter son enfant à vélo : casque, siège, remorque et bon sens',
    summary: 'Le casque est obligatoire aussi pour l’enfant passager ; ce qu’il faut vérifier sur le siège ou la remorque, et sur le vélo lui-même.',
    category: 'materiel', tags: ['siège vélo enfant', 'remorque vélo', 'porte-bébé vélo', 'enfant passager', 'casque obligatoire', 'vélo cargo', 'balade à vélo', 'puériculture'],
    min_age_months: 9, max_age_months: 96,
    sources: [S.casquePrefecture, S.puericulture, S.bicyclettes],
    body_md: `## En bref
- Un enfant de moins de 12 ans transporté à vélo doit porter un **casque**, comme s’il pédalait lui-même ; l’adulte est responsable.
- Les **remorques à vélo** pour jeunes enfants relèvent de la réglementation des articles de puériculture : vérifiez l’âge, la taille et le poids prévus.
- Respectez la **notice** (montage, conditions d’utilisation, précautions) et contrôlez régulièrement fixations, harnais et freins.
- Le vélo lui-même doit être en bon état : **deux freins** indépendants, éclairage, mentions obligatoires.

## Comprendre
Depuis mars 2017, le port du casque est obligatoire pour les enfants de moins de 12 ans à vélo, qu’ils soient **conducteurs ou passagers**. L’adulte qui transporte un enfant sans casque s’expose à une amende de 4e classe. La mesure vise à réduire les blessures au visage et les traumatismes crâniens.

Le décret de 1991 sur les articles de puériculture concerne les produits pour enfants de moins de 4 ans qui servent notamment au **transport** ; la DGCCRF y cite les remorques à vélo. Ces articles doivent être stables, protéger l’enfant contre les blessures (coupures, brûlures, pincements, étranglement, étouffement), et leurs dispositifs de sécurité ne doivent pas pouvoir être manœuvrés par l’enfant. Ils doivent indiquer le fabricant ou l’importateur et être accompagnés d’une notice de montage et d’utilisation.

Côté vélo, la DGCCRF rappelle que les bicyclettes doivent être vendues montées et réglées, sans arêtes coupantes, avec un repère de hauteur maximale de selle et de potence et deux systèmes de freinage indépendants.

## Au quotidien
**Avant d’acheter un siège ou une remorque**
- Vérifiez l’**âge minimal**, la **taille** et le **poids maximal** indiqués, et la compatibilité avec votre vélo.
- Regardez la qualité des **fixations**, du **harnais**, des boucles, et la protection des pieds contre les rayons.
- Lisez la notice avant l’achat si possible : elle doit être en français.
- Ne choisissez pas sur l’apparence : la DGCCRF conseille de vérifier que le produit correspond à l’usage prévu.

**Avant chaque sortie**
- Casque de l’enfant bien réglé (centré, jugulaire fermée).
- Harnais attaché, sangles ajustées.
- Fixations du siège ou attelage de la remorque contrôlés.
- Freins, pneus et éclairage du vélo vérifiés.

**Sur la route**
- Commencez par de courts trajets, sur des voies calmes ou des pistes cyclables, le temps de vous habituer au poids et à l’équilibre.
- Pensez à la visibilité : éclairage et éléments réfléchissants.
- Habillez l’enfant selon la météo : passager immobile, il a plus vite froid que vous.

**Entretien**
Ne réparez pas vous-même une pièce abîmée d’un siège ou d’une remorque et ne modifiez pas le produit : la DGCCRF conseille de contacter le service après-vente.

## Questions fréquentes
**À partir de quel âge peut-on transporter un bébé à vélo ?**
Cela dépend du dispositif : l’âge et le poids minimaux sont indiqués par le fabricant. Pour un tout-petit, demandez aussi l’avis de votre médecin.

**Le casque est-il obligatoire dans une remorque ?**
L’obligation vise les enfants de moins de 12 ans transportés à vélo comme passagers. Gardez le casque pour tous les trajets.

**Siège ou remorque d’occasion : bonne idée ?**
Possible, mais la DGCCRF prévient que les articles d’occasion peuvent ne plus respecter les règles, manquer de notice ou avoir des pièces de sécurité abîmées. Vérifiez le fonctionnement de chaque fixation.

**Peut-on ajouter un siège sur un vélo électrique ?**
Suivez les indications du fabricant du vélo et du siège sur la compatibilité et la charge maximale.

## Quand demander conseil
Après une chute avec choc à la tête, consultez rapidement si votre enfant pleure de façon inhabituelle, vomit, est somnolent ou si son comportement change ; appelez le 15 ou le 112 en cas de perte de connaissance. ${URG}

${FIN}`,
  }),
  a({
    slug: 'trottinette-electrique-hoverboard-gyropode-enfant-regles',
    title: 'Trottinette électrique, hoverboard, gyropode : les règles pour les enfants et les ados',
    summary: 'Interdits sur la voie publique avant 14 ans, les engins de déplacement personnel motorisés obéissent à des règles précises : âge, équipements, vitesse, assurance.',
    category: 'securite', tags: ['trottinette électrique', 'hoverboard', 'gyropode', 'monoroue', 'EDPM', '14 ans', 'casque', 'assurance', 'code de la route'],
    min_age_months: 96, max_age_months: 216, journeys: ['child'],
    sources: [S.edpm, S.trottinettes, S.incCasques],
    body_md: `## En bref
- Depuis le **1er septembre 2023**, il faut avoir **au moins 14 ans** pour conduire une trottinette électrique ou un autre engin de déplacement personnel motorisé (EDPM) sur la voie publique.
- L’engin doit avoir **feux avant et arrière**, **catadioptres**, **freins** et **avertisseur sonore**, et être **bridé à 25 km/h**.
- **Pas de passager**, **pas de trottoir** (sauf engin tenu à la main), **pas d’écouteurs** ni de téléphone tenu en main.
- Une **assurance** est obligatoire.

## Comprendre
Les EDPM regroupent les trottinettes et patinettes électriques, les gyropodes, les monoroues et les hoverboards. Le ministère de la Transition écologique précise que l’âge minimum pour les conduire est passé de 12 à **14 ans** au 1er septembre 2023.

Les règles de circulation sont précises. En agglomération, les utilisateurs doivent emprunter les pistes et bandes cyclables lorsqu’elles existent ; à défaut, ils peuvent rouler sur les routes limitées à 50 km/h ou moins. Hors agglomération, la circulation est obligatoire sur les voies vertes et pistes cyclables. Les trottoirs sont interdits, sauf à tenir l’engin à la main. Le transport de passagers est interdit : l’engin est à usage strictement personnel. Le port d’un vêtement ou d’un équipement rétro-réfléchissant est fortement conseillé la nuit ou par mauvaise visibilité.

Les sanctions existent : amende de 135 € (4e classe) pour non-respect des règles de circulation, transport d’un passager, circulation sur le trottoir ou débridage ; amende de 5e classe pour un engin dont la vitesse maximale par construction dépasse 25 km/h.

À ne pas confondre : les trottinettes **non motorisées** vendues comme jouets portent l’avertissement « À utiliser avec des équipements de protection. Ne pas utiliser sur la voie publique », rappelle la DGCCRF.

## Au quotidien
**Avant d’acheter pour un adolescent**
- Vérifiez qu’il a **14 ans** s’il doit circuler sur la voie publique.
- Contrôlez les **équipements obligatoires** et que la vitesse maximale par construction ne dépasse pas 25 km/h.
- Souscrivez l’**assurance** obligatoire pour l’utilisateur, et vérifiez ce qu’elle couvre.

**Équiper**
- Même si la page ministérielle ne détaille pas d’obligation de casque pour les EDPM, un **casque conforme** et bien réglé reste une protection essentielle ; ajoutez gants et protections selon l’usage.
- Gilet ou brassard **rétro-réfléchissant** pour la nuit et le mauvais temps.

**Poser les règles en famille**
- Un seul passager : le conducteur.
- Pas d’écouteurs, pas de téléphone en main.
- Pas de débridage : c’est interdit et dangereux.
- Itinéraire préparé ensemble, en privilégiant les pistes cyclables.

**Et pour les plus jeunes ?**
Un enfant de moins de 14 ans ne peut pas conduire d’EDPM sur la voie publique. Pour se déplacer, le vélo (casque obligatoire avant 12 ans) reste l’option adaptée ; une trottinette vendue comme jouet ne s’utilise pas sur la voie publique.

## Questions fréquentes
**Mon enfant de 11 ans peut-il utiliser un hoverboard dans une allée privée ?**
L’âge de 14 ans concerne la circulation sur la voie publique. Sur un terrain privé, suivez l’âge indiqué par le fabricant, avec casque, protections et surveillance.

**Peut-on transporter son enfant sur sa trottinette électrique ?**
Non : le transport de passager est interdit.

**Les trottinettes en libre-service sont-elles assurées ?**
Les opérateurs en libre-service doivent assurer leurs usagers, selon le ministère.

**Le casque est-il obligatoire ?**
La page du ministère ne le mentionne pas pour les EDPM ; il est en revanche obligatoire à vélo avant 12 ans. Il reste vivement conseillé.

## Quand demander conseil
Après une chute, consultez si votre enfant a une douleur qui persiste, une déformation, une plaie importante, ou après un choc à la tête s’il vomit, devient somnolent ou se comporte inhabituellement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'velo-jouet-ou-bicyclette-acheter-premier-vrai-velo',
    title: 'Vélo-jouet ou vraie bicyclette : bien acheter le vélo de son enfant',
    summary: 'Ce qui distingue un vélo vendu comme jouet d’une bicyclette, et les points à contrôler à l’achat : freins, selle, montage, notice.',
    category: 'materiel', tags: ['vélo enfant', 'premier vélo', 'bicyclette', 'vélo jouet', 'freins', 'hauteur de selle', 'acheter un vélo', 'voie publique'],
    min_age_months: 30, max_age_months: 144,
    sources: [S.trottinettes, S.bicyclettes, S.incCasques],
    body_md: `## En bref
- Les vélos et trottinettes **vendus comme jouets** doivent porter l’avertissement « À utiliser avec des équipements de protection. Ne pas utiliser sur la voie publique » : ils sont réservés à un **usage familial**.
- Une **bicyclette** doit être vendue **montée et réglée**, avec **deux freins indépendants**, un **repère de hauteur maximale** de selle et de potence et sans arêtes coupantes.
- Vérifiez les **mentions obligatoires** et la **notice en français**.
- Le **casque** est obligatoire à vélo avant 12 ans.

## Comprendre
Pour la DGCCRF, les trottinettes et bicyclettes figurent parmi les jouets les plus dangereux, en raison des risques de chute et de collision. Lorsqu’ils sont vendus comme **jouets**, ces engins doivent porter un avertissement précisant qu’ils s’utilisent avec des équipements de protection et **pas sur la voie publique**. Ils se distinguent ainsi des articles de sport et de loisirs. Leur notice doit rappeler que la pratique demande de l’adresse et recommander des protections (casque, gants, genouillères, coudières).

Les **bicyclettes**, elles, sont soumises à des exigences de conception : livrées montées et réglées, sans arêtes coupantes, avec un repère de hauteur maximale de selle et de potence, et deux systèmes de freinage indépendants. Lors d’une enquête, la DGCCRF a relevé un taux d’anomalie de 39 % chez les professionnels contrôlés : éclairage ou avertisseur absents sur des modèles exposés, mentions obligatoires manquantes (adresse du responsable, service après-vente), notices non traduites. Elle a accordé une attention particulière aux vélos pour jeunes enfants.

## Au quotidien
**Définir l’usage**
- Pour rouler dans le jardin, une allée ou un parc fermé, un vélo-jouet adapté à la taille de l’enfant peut suffire.
- Pour circuler sur la voie publique (piste cyclable, rue calme, trajet vers l’école), choisissez une **bicyclette**, pas un jouet.

**À l’achat, vérifiez**
- La **taille** : l’enfant doit pouvoir poser les pieds au sol et atteindre le guidon sans s’étirer. Faites-le essayer.
- Les **freins** : deux systèmes indépendants sur une bicyclette, faciles à actionner par une petite main.
- Le **repère de hauteur maximale** sur la tige de selle et la potence.
- L’absence d’**arêtes coupantes** et la solidité apparente du cadre, de la fourche, de la selle et du tube de direction.
- L’**éclairage** et l’**avertisseur** (sonnette), ou leur installation lors des réglages en magasin.
- La **notice en français** et les coordonnées du responsable de la mise sur le marché.

**Au fil de la croissance**
- Remontez la selle au besoin, sans dépasser le repère.
- Vérifiez régulièrement freins, pneus, serrage du guidon et des roues.

**Le casque**
Il doit être conforme (marquage CE, norme EN 1078), à la bonne taille et bien réglé. Une imitation de casque ne protège pas.

## Questions fréquentes
**Les petites roues stabilisatrices sont-elles indispensables ?**
Ce n’est pas une question de sécurité réglementaire. Beaucoup d’enfants apprennent l’équilibre sur une draisienne avant de passer au vélo ; choisissez avec l’enfant selon sa progression.

**Puis-je acheter un vélo en ligne ?**
Oui, mais une bicyclette doit être livrée montée et réglée. À réception, vérifiez freins, serrage et réglages, ou faites-les contrôler.

**Un vélo d’occasion convient-il ?**
Souvent, après vérification des freins, du cadre, des pneus et de la chaîne. En cas de doute, faites-le réviser.

**Mon enfant peut-il rouler sur le trottoir ?**
Les règles de circulation des enfants à vélo dépendent de leur âge ; renseignez-vous sur le code de la route et accompagnez-le.

## Quand demander conseil
Après une chute, consultez si une douleur persiste, si un membre est déformé ou si une plaie est profonde. Après un choc à la tête, appelez le 15 ou le 112 en cas de perte de connaissance, de vomissements, de somnolence inhabituelle ou de changement de comportement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ objets du quotidien
  a({
    slug: 'jouets-connectes-montre-enfant-vie-privee-securite',
    title: 'Jouets connectés et montres pour enfants : protéger sa vie privée et ses données',
    summary: 'Poupées, robots, montres connectées : les conseils de la CNIL pour choisir, paramétrer et utiliser ces objets sans exposer votre enfant.',
    category: 'securite', tags: ['jouet connecté', 'montre connectée', 'robot', 'vie privée', 'données personnelles', 'CNIL', 'Bluetooth', 'Wi-Fi', 'mot de passe', 'géolocalisation'],
    min_age_months: 24, max_age_months: 156, journeys: ['child'],
    sources: [S.cnil, S.conseilsJouets],
    body_md: `## En bref
- Un jouet connecté **collecte des informations** et les transmet par Bluetooth, Wi-Fi ou internet.
- Ces données peuvent être utilisées pour de la **publicité ciblée** ou détournées par des personnes malveillantes.
- Avant l’achat, vérifiez les **conditions d’utilisation**, l’**hébergement des données** et la possibilité de **désactiver** certaines fonctions.
- Avant d’offrir : **changez les mots de passe par défaut**, installez les **mises à jour**, n’activez que l’utile.

## Comprendre
Poupées qui parlent, robots, montres connectées, consoles : ces objets ont l’air inoffensifs, mais ils collectent des informations (voix, photos, position, habitudes) et les envoient vers des applications ou des serveurs. La CNIL explique que ces données peuvent servir à cibler des publicités, ou être détournées pour des arnaques, des usurpations d’identité ou du harcèlement.

Elle souligne aussi un point délicat : certains jouets permettent aux parents d’**écouter ou de réécouter** les conversations de l’enfant avec son jouet. Cette possibilité peut porter atteinte à l’intimité de l’enfant et à la confiance qu’il accorde à ses parents.

Les fabricants ont l’obligation légale de prendre toutes les précautions utiles pour protéger les données collectées. Mais la CNIL invite à se méfier des jouets connectés **bon marché**, qui peuvent négliger la vie privée et la sécurité.

## Au quotidien
**Avant d’acheter**
- Lisez les **conditions d’utilisation** : sont-elles en français et compréhensibles ?
- Cherchez où sont **hébergées** les données et si elles sont partagées avec des partenaires.
- Vérifiez qu’un **contact** permet d’exercer vos droits (accès, suppression).
- Regardez si vous pouvez **désactiver** des fonctions comme la géolocalisation.
- Vérifiez que l’objet et son application peuvent être protégés par un **mot de passe solide**.
- En cas de doute, demandez conseil dans un magasin spécialisé ; les tests de consommateurs et avis d’utilisateurs peuvent aider.

**Avant de le donner à l’enfant**
- Assurez-vous que personne ne peut se connecter au jouet **sans bouton physique ou sans mot de passe**.
- **Changez** les mots de passe ou codes par défaut.
- Protégez votre téléphone et votre box internet par des mots de passe.
- Choisissez un mot de passe **unique** pour le compte du jouet.
- Vérifiez qu’un **voyant** indique quand le jouet écoute ou transmet.
- Installez régulièrement les **mises à jour de sécurité**.

**À l’inscription**
- Ne donnez que le **strict minimum** : si seul l’âge est nécessaire, une date approximative peut suffire.
- Utilisez une **adresse électronique dédiée** et des **pseudonymes**.
- N’activez que les fonctions vraiment utiles.

**Au quotidien et à la fin**
- **Éteignez** le jouet quand il ne sert pas.
- Désactivez le partage automatique vers les réseaux sociaux.
- Quand l’enfant n’utilise plus le jouet, **effacez les données** du jouet et du service en ligne.

## Questions fréquentes
**Faut-il expliquer à l’enfant que son jouet enregistre ?**
Oui, avec des mots adaptés : cela respecte son intimité et l’aide à comprendre ce qu’il partage.

**Une montre connectée avec géolocalisation est-elle une bonne idée ?**
La CNIL recommande de vérifier qu’on peut contrôler les données collectées et désactiver la géolocalisation. Pesez l’intérêt réel et parlez-en avec votre enfant.

**Un jouet connecté doit-il porter le marquage CE ?**
Oui, comme tout jouet. Il ne dit rien, en revanche, de la protection des données : ce sont deux sujets distincts.

**Que faire avant de revendre ou donner le jouet ?**
Effacez les données du jouet et supprimez le compte associé au service en ligne.

## Quand demander conseil
Si vous pensez que le jouet a été piraté ou que des informations sur votre enfant circulent, coupez la connexion, changez les mots de passe et signalez-le. Si votre enfant est contacté par un inconnu, harcelé ou semble en danger, n’hésitez pas à demander de l’aide. ${DANGER} ${URG}

${FIN}`,
  }),
  a({
    slug: 'lunettes-de-soleil-enfant-choisir-categorie-filtre',
    title: 'Lunettes de soleil pour enfant : marquage CE, catégorie de filtre et pièges à éviter',
    summary: 'Les lunettes fantaisie en plastique teinté peuvent mal protéger : comment lire le marquage, choisir la catégorie et compléter avec chapeau et ombre.',
    category: 'materiel', tags: ['lunettes de soleil', 'lunettes enfant', 'catégorie 3', 'filtre UV', 'marquage CE', 'yeux', 'soleil', 'plage', 'montagne'],
    min_age_months: 6, max_age_months: 156,
    sources: [S.lunettes, S.arsSoleil],
    body_md: `## En bref
- Des lunettes de soleil doivent porter un **marquage CE** visible, lisible et indélébile, et une **notice en français** qui indique la **catégorie** de protection.
- Les catégories vont de **0 à 4** : seules les catégories **3 et 4** conviennent à une **forte luminosité** (mer, montagne).
- La DGCCRF met en garde contre les **lunettes fantaisie** pour enfants en plastique teinté, à la protection parfois insuffisante.
- Des verres **sombres** ne sont pas forcément plus protecteurs contre les UV.

## Comprendre
Les yeux des enfants sont particulièrement sensibles aux UV : le cristallin, transparent pendant l’enfance et l’adolescence, ne les filtre pas comme celui d’un adulte, rappelle l’ARS Grand Est. Les lunettes de soleil sont donc utiles, avec une forme **enveloppante**.

La DGCCRF détaille les **cinq catégories** de filtres définies par la norme NF EN ISO 12312-1 :
- **Catégorie 0** : pas de protection contre les UV, usage de confort ou d’esthétique.
- **Catégories 1 et 2** : luminosité faible à moyenne.
- **Catégories 3 et 4** : forte ou exceptionnelle luminosité, comme en mer ou en montagne.

La catégorie 4 ne convient pas à la conduite et porte un symbole spécifique. La teinte ne dit pas tout : des verres foncés réduisent l’éblouissement mais pas forcément les UV, alors que des verres clairs traités peuvent filtrer tous les UV sans réduire l’éblouissement.

## Au quotidien
**À l’achat**
- Cherchez le **marquage CE** sur la monture ou l’étiquette.
- Lisez la **notice** : catégorie du filtre, performances, entretien. Elle doit être rédigée en français.
- Pour la plage, la neige ou la montagne, choisissez une **catégorie 3** (ou 4 pour des conditions exceptionnelles, hors conduite).
- Préférez une monture **enveloppante**, à la bonne taille, qui tient bien sur le nez et derrière les oreilles.
- Méfiez-vous des lunettes vendues comme accessoire de déguisement ou jouet : sans indication de catégorie, considérez qu’elles ne protègent pas.
- La résistance des verres (incassables ou non, résistance aux rayures) peut être indiquée : utile pour un enfant actif.

**Au quotidien**
- Les lunettes complètent, mais ne remplacent pas, les autres protections : **chapeau à larges bords** qui couvre aussi le cou, **ombre**, vêtements.
- Entre 12 h et 16 h, les UV sont les plus intenses en métropole : recherchez l’ombre.
- Les **bébés** ne doivent jamais être exposés directement au soleil.
- Rangez les lunettes dans un étui pour éviter les rayures.

**Faire accepter les lunettes**
Laissez l’enfant choisir la couleur parmi des modèles conformes et mettez les vôtres en même temps : l’exemple aide beaucoup.

## Questions fréquentes
**Les lunettes de soleil sont-elles utiles pour un bébé ?**
Pour un bébé, la priorité est de **ne pas l’exposer** au soleil : ombre, chapeau, vêtements. Demandez conseil au médecin ou au pharmacien si vous souhaitez des lunettes adaptées.

**Des lunettes très foncées protègent-elles mieux ?**
Pas forcément. C’est la catégorie et la mention de protection UV qui comptent, pas la teinte.

**Faut-il des lunettes par temps nuageux ?**
À la mer ou à la montagne, la luminosité peut rester forte. Adaptez la catégorie à la luminosité.

**Les lunettes « catégorie 4 » conviennent-elles à un enfant à la montagne ?**
Elles sont prévues pour une luminosité exceptionnelle. Elles sont inadaptées à la conduite, ce qui ne concerne pas l’enfant, mais demandez conseil à un opticien selon l’activité.

## Quand demander conseil
Si votre enfant a les yeux rouges, douloureux, larmoyants ou se plaint d’être ébloui après une exposition, consultez un médecin. Une baisse de vision ou une douleur intense justifie un avis rapide. ${URG}

${FIN}`,
  }),
  a({
    slug: 'livres-pour-bebe-et-enfant-choisir-selon-age-securite',
    title: 'Livres pour bébé et jeune enfant : choisir selon l’âge, en pensant aussi à la sécurité',
    summary: 'Tissu, carton, livres sonores ou à rabats : comment choisir des livres adaptés à l’âge, à mettre entre les petites mains en limitant les risques.',
    category: 'activites-eveil', tags: ['livres bébé', 'livre en tissu', 'livre cartonné', 'livre sonore', 'lecture', 'bibliothèque', 'éveil', 'petites pièces'],
    min_age_months: 0, max_age_months: 72, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.livret1000, S.jouetsAge, S.pilesBouton],
    body_md: `## En bref
- Partager des moments de **lecture** aide l’enfant à découvrir les mots, les sons, les formes et les couleurs, rappelle le livret des 1000 premiers jours.
- Pour les plus petits, qui mettent tout à la bouche, choisissez des livres **robustes** : tissu, carton épais, sans petits éléments détachables.
- Les **livres sonores ou lumineux** fonctionnent souvent avec des piles : vérifiez que le compartiment est **solide et difficile à ouvrir**.
- Les livres-jouets avec accessoires (figurines, ventouses, perles) relèvent des mêmes précautions que les jouets : **âge et avertissements**.

## Comprendre
Le livret des 1000 premiers jours encourage à partager des histoires et des chansons avec l’enfant dès ses premiers mois : ces moments soutiennent l’apprentissage du langage. Il cite les **bibliothèques**, les centres sociaux et les modes d’accueil comme lieux d’éveil culturel, où l’on peut emprunter et découvrir des livres sans tout acheter.

Un livre de bébé n’est pas qu’un objet à regarder : il se mâchonne, se tire, se jette. Selon sa fabrication, il peut comporter des éléments qui se détachent (pompons, petits accessoires cousus, morceaux de carton qui se délitent) ou un module électronique. Les règles de sécurité des jouets, rappelées par la DGCCRF, aident à choisir : éléments bien fixés, pas de petites pièces pour les moins de 3 ans, piles inaccessibles. Le ministère chargé de la Santé rappelle que l’ingestion d’une pile bouton est une urgence médicale, et conseille de choisir des produits dont le compartiment à piles ne peut pas être ouvert par un enfant.

## Au quotidien
**De 0 à 12 mois**
- Livres en **tissu** ou **imagiers cartonnés** à grosses pages, faciles à tourner et à nettoyer.
- Images simples et contrastées, comptines, livres à toucher dont les matières sont **bien collées ou cousues**.
- Vérifiez les éventuels anneaux, rubans ou accroches : solides, sans cordon long.

**De 1 à 3 ans**
- Livres à **rabats** et à **tirettes** robustes : ils plaisent beaucoup, mais vérifiez régulièrement que rien ne se détache.
- Imagiers, histoires courtes, livres-comptines.
- Pour un livre sonore : compartiment **vissé**, son pas trop fort, et rangement après usage.

**De 3 à 6 ans**
- Albums plus longs, livres documentaires simples, premières histoires à épisodes.
- Les livres-jeux avec accessoires (autocollants, pièces de puzzle, figurines) : respectez l’**âge indiqué**, surtout s’il y a un plus petit à la maison.

**Entretenir sa bibliothèque**
- Un livre cartonné mâchonné qui se délite ou une page en tissu décousue : réparez solidement ou mettez de côté.
- Rangez les livres des grands, plus fragiles, hors de portée des tout-petits.
- Proposez un panier de livres « pour les petits » accessible au sol.

**Le moment de lecture**
Installez-vous confortablement, laissez l’enfant tourner les pages, mâchonner, revenir dix fois sur la même image : tout cela fait partie de la découverte.

## Questions fréquentes
**Faut-il acheter beaucoup de livres ?**
Non. Quelques livres, relus souvent, suffisent ; les bibliothèques permettent de varier sans dépenser.

**Mon bébé mâchonne ses livres : faut-il l’en empêcher ?**
C’est une façon d’explorer. Choisissez des livres adaptés (tissu, carton épais) et surveillez qu’aucun morceau ne se détache.

**Les livres sonores sont-ils déconseillés ?**
Non, mais ils contiennent souvent des piles : vérifiez le compartiment et rangez-les hors de portée quand ils ne servent pas.

**Les livres anciens de la famille peuvent-ils servir ?**
Oui pour la lecture partagée, sous surveillance. Évitez de laisser un tout-petit seul avec un livre fragile qui pourrait se déchirer en petits morceaux.

## Quand demander conseil
Si vous vous interrogez sur le langage de votre enfant, parlez-en au médecin ou à la PMI. S’il a avalé un morceau de livre, un petit élément ou une pile, ou s’il s’étouffe, agissez sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'offrir-un-jouet-check-list-grands-parents-anniversaire',
    title: 'Offrir un jouet (grands-parents, anniversaires, fêtes) : la check-list sécurité',
    summary: 'Avant d’offrir un jouet à un enfant qui n’est pas le vôtre, ou de recevoir des cadeaux en nombre : les vérifications simples qui évitent les mauvaises surprises.',
    category: 'securite', tags: ['cadeau enfant', 'offrir un jouet', 'Noël', 'anniversaire', 'grands-parents', 'liste de cadeaux', 'âge du jouet', 'sécurité'],
    min_age_months: 0, max_age_months: 144, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.conseilsJouets, S.jeuxConstruction, S.jouetsAge],
    body_md: `## En bref
- Choisissez un jouet **adapté à l’âge, aux capacités et au niveau** de l’enfant, en tenant compte des **autres enfants** du foyer.
- Vérifiez **marquage CE**, **avertissements**, **notice en français**, et consultez **RappelConso**.
- Privilégiez un vendeur identifiable et méfiez-vous des **prix anormalement bas**.
- Après l’ouverture des cadeaux : **lire les notices**, **expliquer** le fonctionnement, **ramasser** les petits éléments et les emballages.

## Comprendre
Offrir un jouet est un plaisir, mais celui qui offre ne connaît pas toujours la maison où le cadeau arrivera : un bébé y vit-il ? L’enfant met-il encore tout à la bouche ? Les règles de la DGCCRF s’appliquent à chaque achat, et elles valent aussi pour les cadeaux reçus.

Pour la DGCCRF, le choix repose sur quelques réflexes : vérifier le **marquage CE**, lire **tous les avertissements**, acheter auprès de commerces ou de marques identifiables, se méfier des **prix anormalement bas** (possible contrefaçon), et choisir selon l’âge, les capacités et le niveau de l’enfant. Avant l’achat, elle conseille aussi de consulter **RappelConso** pour vérifier que le produit n’est pas rappelé.

Les jours de fête, les risques s’additionnent : petites pièces des nouveaux jouets, piles bouton, aimants, emballages et attaches qui traînent, décorations à hauteur d’enfant. La DGCCRF recommande de lire les consignes avant utilisation, d’expliquer le jouet à l’enfant et d’empêcher les plus jeunes d’utiliser les jouets des plus grands.

## Au quotidien
**Pour celui qui offre**
- Demandez aux parents l’**âge exact**, les envies, et s’il y a un **tout-petit** dans la maison.
- Proposez une **liste** partagée : les parents peuvent y indiquer les jouets qui conviennent.
- Regardez l’**âge indiqué** sur l’emballage, et pas seulement l’illustration.
- Gardez le **ticket** : il facilite un échange si le jouet ne convient pas, et un remboursement en cas de rappel.
- Évitez les objets qui **ne sont pas des jouets** : figurines de collection, gadgets d’adulte, objets à billes aimantées.

**Pour les parents qui reçoivent**
- Ouvrez les cadeaux **à table** ou sur un tapis, et ramassez au fur et à mesure films plastiques, attaches, petits sachets.
- Mettez de côté les jouets « 3 ans et plus » si un plus petit est présent.
- Lisez la **notice** avant de lancer un jouet électrique ou motorisé ; installez les piles vous-même.
- Si un jouet vous paraît **inadapté ou douteux** (pas de marquage CE, piles accessibles, cordon long), remerciez chaleureusement et rangez-le hors de portée, le temps de vérifier.

**Formuler les choses avec tact**
« Merci, il est superbe ! On va le garder pour quand Léa aura 3 ans, elle met encore tout à la bouche. » Une phrase simple ménage la relation sans renoncer à la sécurité.

## Questions fréquentes
**Les grands-parents offrent des jouets anciens de la famille : que faire ?**
Accueillez-les comme des souvenirs précieux, examinez-les et réservez ceux qui ne conviennent pas pour plus tard. Les jouets anciens peuvent ne pas répondre aux normes actuelles.

**Comment savoir si un jouet est adapté à un enfant que je connais peu ?**
Fiez-vous à l’âge indiqué et demandez aux parents. Les magasins spécialisés peuvent aussi conseiller.

**Un jouet acheté à l’étranger pendant les vacances convient-il ?**
Vérifiez marquage CE, âge et avertissements en français. En leur absence, prudence.

**Faut-il offrir des jouets à piles à un tout-petit ?**
Ce n’est pas interdit, mais vérifiez que le compartiment est vissé et que le jouet est prévu pour son âge.

## Quand demander conseil
Pendant les fêtes, gardez à l’esprit les numéros d’urgence : si un enfant s’étouffe, a avalé une pile ou un aimant, ou s’est blessé avec un jouet, appelez immédiatement. ${URG}

${FIN}`,
  }),
];
