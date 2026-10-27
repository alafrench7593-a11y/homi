/** Guide complet — lot 23 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ».
 * Thème : bien choisir le matériel de bébé (poussette, siège auto, lit et matelas, gigoteuse, portage, transat, chaise haute, bain, babyphone, parc, biberons, sucette).
 * Aucune marque : on explique comment choisir (normes, marquages, âge et poids indiqués, notice, rappels de produits). */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page.
const S = {
  dgccrfPueri: { label: 'DGCCRF (economie.gouv.fr) — Fiche pratique : articles de puériculture', url: 'https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/puericulture-articles', consulted_on: C },
  dgccrfChaise: { label: 'DGCCRF (economie.gouv.fr) — Chaises hautes et sièges de table pour enfants : résultats d’enquête', url: 'https://www.economie.gouv.fr/dgccrf/chaises-hautes-pour-enfants', consulted_on: C },
  rappels: { label: 'economie.gouv.fr — Retraits et rappels de produits : comment signaler et s’informer sur les produits à risque', url: 'https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/retraits-et-rappels-de-produits-comment-signaler-et-sinformer-sur-les-produits-risque', consulted_on: C, published: '2026-03-30' },
  srSiege: { label: 'Sécurité routière — Dépliant « Siège auto : bien protéger son enfant »', url: 'https://www.securite-routiere.gouv.fr/sites/default/files/2024-11/depliant_siege_auto.pdf', consulted_on: C },
  mpediaSieges: { label: 'mpedia (Association française de pédiatrie ambulatoire) — Les sièges auto', url: 'https://www.mpedia.fr/art-sieges-auto/', consulted_on: C, published: '2023-07-17' },
  ameliCoucher: { label: 'ameli.fr — Coucher bébé en toute sécurité', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
  mpediaCouchage: { label: 'mpedia (AFPA) — Chambre, lit, couchage : prévenir la mort inattendue du nourrisson', url: 'https://www.mpedia.fr/art-coucher-mon-bebe/', consulted_on: C, published: '2023-07-17' },
  santeSommeil: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Le sommeil de bébé', url: 'https://www.sante.fr/le-sommeil-de-bebe-0', consulted_on: C, published: '2024-12-05' },
  santeLandau: { label: 'Santé.fr (mpedia, AFPA) — Landau, poussette, coques, transats : comment choisir ?', url: 'https://www.sante.fr/node/1068786', consulted_on: C, published: '2025-05-06' },
  mpediaEcharpe: { label: 'mpedia (AFPA) — Porter bébé avec une écharpe de portage', url: 'https://www.mpedia.fr/art-echarpe-portage/', consulted_on: C, published: '2021-11-05' },
  girondePortage: { label: 'Département de la Gironde (PMI) — Porter un enfant en toute sécurité, en écharpe ou porte-bébé', url: 'https://gironde.fr/sites/default/files/2024-12/82x145-3volets-Porter%20un%20enfant-19112024-5.pdf', consulted_on: C, published: '2024-11' },
  ameliBain: { label: 'ameli.fr — Donner le bain à bébé', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/donner-bain-bebe', consulted_on: C },
  santeAccidents: { label: 'Santé.fr (mpedia, AFPA) — Accidents domestiques : protéger au quotidien votre enfant', url: 'https://www.sante.fr/accidents-domestiques-proteger-au-quotidien-votre-enfant', consulted_on: C, published: '2026-01-26' },
  santeEviter: { label: 'Santé.fr — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  santeTrotteur: { label: 'Santé.fr Décryptage — Est-il vrai que les trotteurs pour bébés sont déconseillés ?', url: 'https://www.sante.fr/decryptage/nos-reponses/est-il-vrai-que-les-trotteurs-pour-bebes-sont-deconseilles', consulted_on: C, published: '2023-07-05' },
  santeTrotteurMpedia: { label: 'Santé.fr (mpedia, AFPA) — Trotteurs bébé : une mauvaise idée pour apprendre à marcher', url: 'https://www.sante.fr/node/1093858', consulted_on: C, published: '2025-04-16' },
  santeOndes: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — S’informer sur les sources d’ondes et les rayonnements lumineux', url: 'https://www.sante.fr/node/1871303', consulted_on: C, published: '2019-07-12' },
  santeAir: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Adopter les bons gestes pour améliorer son air intérieur', url: 'https://www.sante.fr/adopter-les-bons-gestes-pour-ameliorer-son-air-interieur', consulted_on: C, published: '2025-10-10' },
  ansesBiberons: { label: 'Afssa (aujourd’hui Anses) — Recommandations d’hygiène pour la préparation et la conservation des biberons (questions-réponses, juillet 2006)', url: 'https://www.anses.fr/fr/system/files/MIC-QR-Biberons.pdf', consulted_on: C, published: '2006-07' },
  hasPlagio: { label: 'HAS — Prévenir la plagiocéphalie sans augmenter le risque de mort inattendue du nourrisson', url: 'https://www.has-sante.fr/jcms/p_3160772/fr/prevenir-la-plagiocephalie-sans-augmenter-le-risque-de-mort-inattendue-du-nourrisson', consulted_on: C, published: '2020-03-05' },
  afssapsLits: { label: 'Afssaps (aujourd’hui ANSM) — Risque de piégeage des enfants dans les lits-parcs (questions-réponses)', url: 'https://archive.ansm.sante.fr/content/download/15600/181898/version/6/file/QR-lits-parcs.pdf', consulted_on: C, published: '2009-10-20' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du pédiatre, du médecin, de la sage-femme ou de la puéricultrice de PMI qui suit votre enfant.';
const URG = 'En cas d’urgence (enfant inconscient, qui respire mal, qui convulse, chute avec choc à la tête suivie de vomissements ou de somnolence, noyade même brève), appelez le 15 ou le 112.';
const DANGER = 'Si vous craignez qu’un enfant soit en danger, le 119 (Allô enfance en danger) répond 24 h/24, gratuitement.';
const BASE: Pick<LibArticle, 'status' | 'category'> = { status: 'to_review', category: 'materiel' };

export const GUIDE_B23: LibArticle[] = [
  // ───────────────────────────── Repères généraux ─────────────────────────────
  {
    ...BASE,
    slug: 'lire-etiquette-materiel-puericulture-normes-marquages',
    title: 'Lire l’étiquette d’un article de puériculture : normes, marquages, âge et notice',
    summary: 'Comment repérer, sur l’emballage et sur le produit, les informations qui disent si un article de puériculture est conforme et adapté à votre enfant.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['puériculture', 'norme', 'marquage CE', 'NF', 'conforme aux exigences de sécurité', 'étiquette', 'notice', 'liste de naissance', 'acheter'],
    sources: [S.dgccrfPueri, S.santeEviter, S.santeSommeil],
    body_md: `Devant un rayon de poussettes, de transats ou de lits, l’apparence et le prix prennent vite le dessus. Pourtant, les informations les plus utiles pour la sécurité de votre enfant tiennent souvent en quelques lignes sur l’étiquette et dans la notice.

## En bref
- En France, les articles de puériculture destinés aux moins de 4 ans sont encadrés par un décret dit « puériculture » : ils doivent être stables, solides et ne pas exposer l’enfant à des blessures.
- Sur le produit, cherchez la mention « conforme aux exigences de sécurité », un marquage CE ou NF selon le produit, l’identité du fabricant ou de l’importateur et la référence du modèle.
- L’âge, la taille ou le poids indiqués sont des limites de sécurité, pas des suggestions.
- La notice doit être en français : elle explique le montage, l’utilisation et les précautions.
- Gardez emballage, notice et ticket : ils servent en cas de défaut ou de rappel.

## Comprendre
La DGCCRF rappelle que le décret « puériculture » concerne une longue liste d’objets : chaises hautes, transats, rehausseurs, berceaux, lits fixes et pliants, baignoires et sièges de bain, tables à langer, porte-bébés et écharpes, poussettes, trotteurs, barrières, parcs… Ces articles doivent être stables, résister à une utilisation raisonnablement prévisible et protéger l’enfant des coupures, brûlures, pincements, étranglements et étouffements. Leurs dispositifs de sécurité (freins, verrous, harnais) ne doivent pas pouvoir être actionnés par l’enfant.

Un article est présumé conforme lorsqu’il respecte les normes publiées au Journal officiel ou qu’il dispose d’une attestation d’un organisme accrédité. Le fabricant ou l’importateur doit être identifiable (nom ou marque, adresse) et le modèle indiqué.

D’autres objets du quotidien de bébé ne relèvent pas de ce décret mais restent soumis à l’obligation générale de sécurité : sucettes et attache-sucettes, anneaux de dentition, matelas, gigoteuses, tours de lit, matelas à langer, veilleuses, cache-prises… Les sièges auto relèvent, eux, de la réglementation routière, avec leur propre étiquette d’homologation.

## Au quotidien
- **Lisez l’étiquette avant le prix** : âge, poids ou taille maximum, mention de conformité, nom du fabricant, référence du modèle.
- **Pour le couchage**, Santé publique France conseille un lit portant le marquage CE ou NF et la mention « conforme aux exigences de sécurité ».
- **Choisissez selon l’usage réel** : la DGCCRF conseille de vérifier que l’article correspond à ce que vous voulez en faire, plutôt que de choisir sur l’esthétique.
- **Préférez les articles lavables**, dont la housse se retire facilement.
- **Lisez la notice en entier** au montage, puis rangez-la dans une pochette « matériel bébé » avec les tickets.
- **Contrôlez régulièrement** les pièces les plus sollicitées : pliage, freins, verrous, harnais, roues, poignées.
- **Ne bricolez pas** un article abîmé et n’en changez pas l’usage : contactez le service après-vente.

## Questions fréquentes
**Le marquage CE suffit-il à garantir qu’un produit est adapté à mon enfant ?** Il indique que le fabricant déclare respecter les exigences européennes qui s’appliquent, mais il ne dit rien de l’âge ou du poids de votre enfant. Ces limites figurent sur l’étiquette et dans la notice.

**Un article vendu dans un autre pays de l’Union européenne est-il conforme ?** Il doit respecter les mêmes exigences de sécurité. Vérifiez quand même la présence d’une notice compréhensible.

**Que faire si la notice est perdue ?** Notez la référence du modèle et demandez-la au fabricant ou au vendeur. Sans notice, le montage et les limites d’utilisation restent incertains.

**Les produits très bon marché vendus en ligne sont-ils contrôlés ?** Ils sont soumis aux mêmes règles, mais les contrôles relèvent régulièrement des défauts de marquage ou de notice. Prenez le temps de vérifier les mentions avant d’acheter.

## Quand demander conseil
Si un article vous semble instable, cassé ou mal conçu, cessez de l’utiliser et signalez-le sur SignalConso. Pour toute question sur l’installation de votre bébé (couchage, portage, transport), la puéricultrice de PMI, la sage-femme ou le pédiatre peut vous aider. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'rappel-produit-puericulture-verifier-que-faire',
    title: 'Rappel de produit : vérifier son matériel de bébé et savoir quoi faire',
    summary: 'Où trouver les rappels de produits, comment vérifier si votre poussette, votre siège ou votre sucette est concerné et que faire si c’est le cas.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['rappel conso', 'rappel produit', 'retrait', 'signalconso', 'numéro de lot', 'puériculture', 'produit dangereux', 'remboursement'],
    safety_critical: true,
    sources: [S.rappels, S.dgccrfPueri],
    body_md: `Un modèle de poussette, de transat ou de sucette peut être rappelé des mois après votre achat, lorsqu’un défaut est découvert. Savoir où regarder et comment réagir prend quelques minutes et protège votre enfant.

## En bref
- Un **retrait** concerne un produit encore en magasin ; un **rappel** concerne un produit déjà vendu, que les acheteurs doivent rapporter ou cesser d’utiliser.
- RappelConso est le portail officiel qui recense les rappels de produits en France ; on peut y chercher par mot-clé ou par catégorie.
- Si votre article est concerné : mettez-le de côté, gardez l’emballage, le numéro de lot et le ticket, puis suivez la conduite indiquée dans la fiche de rappel.
- Un défaut constaté sur un produit se signale sur SignalConso.
- Les médicaments et dispositifs médicaux ne figurent pas sur RappelConso : consultez le site de l’ANSM.

## Comprendre
Selon la fiche du ministère de l’Économie, un rappel suppose toujours un retrait préalable des rayons, mais tous les retraits ne donnent pas lieu à un rappel. Ces mesures peuvent faire suite à un contrôle, un signalement, un accident, une alerte nationale ou européenne ou un autocontrôle du fabricant.

Chaque fiche de rappel décrit le produit (photo, référence, lots concernés), le risque identifié et la conduite à tenir : retour en magasin, destruction selon des consignes précises ou contact avec le service client. En magasin, l’information peut aussi être affichée en rayon, imprimée sur le ticket ou envoyée par SMS ou courriel aux titulaires d’une carte de fidélité.

Au niveau européen, la Commission publie chaque semaine les produits dangereux signalés par les États membres sur le système Safety Gate.

## Au quotidien
- **Tenez une liste** de votre matériel (type, référence du modèle, date d’achat, magasin) dans un carnet ou dans vos notes : vérifier un rappel prend alors une minute.
- **Photographiez l’étiquette** de chaque gros article (poussette, siège auto, lit, chaise haute) à l’achat : le numéro de lot s’efface parfois avec le temps.
- **Consultez RappelConso** de temps en temps, en tapant le type de produit (poussette, transat, sucette, lit…).
- **Pour un article d’occasion ou prêté**, faites la vérification avant la première utilisation.
- **Si votre article est rappelé** : arrêtez de l’utiliser, rangez-le hors de portée et suivez la procédure ; gardez preuves d’achat et photos.
- **En cas de malaise ou d’effet inhabituel** après l’utilisation d’un produit rappelé, demandez l’avis d’un professionnel de santé.
- **En cas de litige** avec le vendeur, une association de consommateurs agréée peut vous aider.

## Questions fréquentes
**Je n’ai plus le ticket : puis-je quand même rapporter le produit ?** La fiche de rappel précise la procédure. Gardez toujours les éléments disponibles (emballage, photos, relevé bancaire) et présentez-les au magasin ou au service client.

**Comment signaler un défaut que j’ai constaté moi-même ?** Sur SignalConso, plateforme administrée par la DGCCRF, qui vous guide pas à pas. Vous pouvez aussi contacter la DGCCRF.

**Un produit rappelé peut-il être revendu ou donné ?** Non : suivez la procédure prévue pour qu’il ne circule plus. Prévenez aussi la personne à qui vous l’auriez prêté.

**Le rappel concerne un médicament ou un thermomètre médical de mon enfant : où regarder ?** Les médicaments et dispositifs médicaux relèvent de l’ANSM, qui publie ses propres informations de sécurité.

## Quand demander conseil
Si votre enfant a été blessé ou semble souffrant après l’utilisation d’un produit, consultez un médecin et conservez le produit pour le signalement. Un effet indésirable sur la santé peut aussi être déclaré sur le portail de signalement du ministère chargé de la santé. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'materiel-bebe-occasion-ou-prete-verifications',
    title: 'Matériel de bébé d’occasion ou prêté : les vérifications avant de l’utiliser',
    summary: 'Poussette, lit, chaise haute ou siège auto de seconde main : ce qu’il faut contrôler, ce qu’il vaut mieux acheter neuf et comment éviter les mauvaises surprises.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['occasion', 'seconde main', 'prêt', 'brocante', 'vide-grenier', 'puériculture', 'siège auto occasion', 'lit occasion', 'économiser'],
    sources: [S.dgccrfPueri, S.santeLandau, S.mpediaSieges, S.mpediaCouchage],
    body_md: `Le matériel de bébé sert peu de temps : récupérer une poussette ou un lit auprès de proches, ou acheter d’occasion, est tentant et souvent économique. Quelques vérifications permettent de le faire sereinement.

## En bref
- Un article d’occasion peut avoir un niveau de sécurité inférieur aux modèles récents et être vendu sans notice ni emballage.
- Vérifiez le fonctionnement de chaque pièce de sécurité : freins, verrous de pliage, harnais, fixations.
- Pour le siège auto, la prudence s’impose : évitez un siège dont vous ne connaissez ni la provenance ni l’histoire.
- Pour un lit, contrôlez la solidité, l’écartement des barreaux et l’état de la peinture.
- Vérifiez si le modèle n’a pas fait l’objet d’un rappel.

## Comprendre
La DGCCRF signale plusieurs limites des articles d’occasion : normes parfois plus anciennes, absence fréquente de notice, pièces de sécurité pouvant être abîmées. Elle ajoute qu’une propreté apparente ne garantit pas l’hygiène.

Pour la poussette et le transat, les pédiatres de l’AFPA conseillent un matériel conforme aux normes européennes en vigueur et déconseillent pour cette raison les achats en brocante, où il est difficile de connaître l’âge du produit.

Pour le siège auto, la Sécurité routière invite à la prudence et à éviter un siège dont on ignore la provenance et l’usage passé. mpedia ajoute que les sièges fabriqués avant 1995 ne doivent plus être utilisés.

## Au quotidien
- **Demandez la notice** (ou cherchez-la auprès du fabricant à partir de la référence) et l’âge du produit.
- **Poussette** : testez le pliage et le verrouillage, les deux freins, le harnais et ses boucles, les roues et la suspension, l’absence de fissures sur le châssis.
- **Lit** : vérifiez qu’il ne bouge pas, que tous les barreaux sont présents et solides, que leur écartement reste étroit, qu’aucune vis ne manque et que la peinture n’est pas écaillée. Achetez un matelas neuf, ferme, aux dimensions exactes du lit.
- **Chaise haute** : stabilité, harnais complet, tablette qui se verrouille, absence de petites pièces qui se détachent ou d’arêtes coupantes.
- **Siège auto** : n’acceptez qu’un siège dont vous connaissez l’histoire (pas d’accident), avec son étiquette d’homologation lisible, toutes ses pièces et sa notice.
- **Textiles** (housses, nacelle) : lavez-les avant usage selon l’étiquette.
- **Consultez RappelConso** avec le type de produit et la référence du modèle.
- **Ne réparez pas vous-même** une pièce de sécurité cassée : si elle ne peut pas être remplacée par le fabricant, renoncez à l’article.

## Questions fréquentes
**Qu’est-il préférable d’acheter neuf ?** Le matelas, pour qu’il soit ferme et parfaitement ajusté, et le siège auto, dont l’histoire compte. Les tétines et sucettes s’achètent aussi neuves pour des raisons d’hygiène et d’usure.

**Un siège auto prêté par la famille convient-il ?** Oui si vous savez qu’il n’a pas subi d’accident, qu’il est complet avec sa notice, que son étiquette d’homologation est lisible et qu’il est adapté à la taille de votre enfant et à votre voiture.

**Peut-on utiliser un siège à l’ancienne norme R44 ?** Ces sièges ne sont plus vendus depuis le 1er septembre 2024, mais la Sécurité routière précise qu’ils peuvent continuer à être utilisés.

**Le lit de famille en bois ancien peut-il resservir ?** Faites contrôler sa solidité, l’écartement des barreaux et l’état de la peinture. En cas de doute, préférez un lit récent portant la mention de conformité.

## Quand demander conseil
En cas de doute sur un siège auto, demandez conseil à un magasin spécialisé ou au fabricant. Pour le couchage, la puéricultrice de PMI peut vous aider à vérifier l’installation. ${URG}

${END}`,
  },
  // ───────────────────────────── Poussette ─────────────────────────────
  {
    ...BASE,
    slug: 'choisir-poussette-selon-mode-de-vie',
    title: 'Choisir sa poussette selon son mode de vie : combiné, canne, trois roues ou double',
    summary: 'Les grandes familles de poussettes, les questions à se poser avant l’achat et les points techniques à vérifier en magasin.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 48,
    tags: ['poussette', 'landau', 'combiné', 'trio', 'poussette canne', 'poussette trois roues', 'poussette double', 'EN 1888', 'liste de naissance'],
    sources: [S.santeLandau, S.dgccrfPueri],
    body_md: `La poussette est souvent l’achat le plus coûteux de la liste de naissance. La meilleure n’est pas la plus chère : c’est celle qui correspond à votre logement, à vos trajets et à l’âge de votre enfant.

## En bref
- Commencez par vos contraintes : appartement ou maison, ascenseur ou escaliers, voiture ou transports en commun, ville ou campagne.
- La poussette doit respecter la norme européenne EN 1888 (stabilité, verrouillage du pliage, frein, harnais, solidité).
- Avant 6 mois environ, bébé a besoin d’une position allongée (nacelle ou assise qui s’incline complètement).
- Vérifiez en magasin le pliage, le poids, l’encombrement dans votre coffre et la hauteur du guidon.
- Une assise réversible permet de garder bébé face à vous au début.

## Comprendre
Les pédiatres de l’AFPA distinguent plusieurs familles :
- **Le combiné (« 3 en 1 »)** : un châssis avec nacelle, coque-siège auto et hamac. La nacelle sert jusqu’à 4 à 6 mois environ, le hamac à partir de 6 mois, quand bébé tient assis. Évolutif et confortable, mais coûteux.
- **La poussette « américaine »** : une assise d’un seul bloc qui passe de la position allongée à assise. Moins chère, mais plus lourde et moins confortable qu’un combiné.
- **La poussette canne** : légère, compacte, pratique dans les transports et les magasins. Certains modèles conviennent dès la naissance : vérifiez l’âge indiqué et l’inclinaison du dossier.
- **La trois roues** : grandes roues et suspension, à l’aise sur tous les terrains, mais lourde, encombrante et chère.
- **La poussette double** : pour des jumeaux ou des enfants d’âges rapprochés ; lourde et moins maniable.

En ville, de petites roues orientables sont plus maniables ; à la campagne, de grandes roues passent mieux sur les chemins. Sans ascenseur, un modèle léger et peu encombrant change le quotidien.

## Au quotidien
- **Mesurez votre coffre** et l’entrée de votre logement avant d’acheter.
- **Essayez le pliage** d’une main, plusieurs fois : il doit être rapide et le verrouillage fiable.
- **Réglez le guidon** à la taille de chaque adulte qui poussera.
- **Regardez la suspension**, souvent absente des modèles d’entrée de gamme.
- **Vérifiez les accessoires** inclus ou en option : habillage pluie, capote, panier, adaptateurs pour une coque.
- **Préférez une housse déhoussable et lavable**.
- **Contrôlez l’étiquette** : référence à la norme EN 1888, âge et poids maximum, nom du fabricant.

## Questions fréquentes
**Faut-il absolument un combiné ?** Non. L’important est que bébé puisse être allongé à plat les premiers mois. Une poussette dont le dossier s’incline complètement, si la notice l’autorise dès la naissance, peut convenir.

**Poussette canne dès la naissance : est-ce possible ?** Seulement si la notice l’autorise et si le dossier s’allonge. Sinon, réservez-la à l’enfant qui tient assis.

**La coque peut-elle se fixer sur la poussette ?** Sur de nombreux modèles, oui, grâce à des adaptateurs. Vérifiez que le verrouillage est solide et que le déverrouillage ne peut être actionné que par un adulte.

**À quel âge n’a-t-on plus besoin de poussette ?** Cela dépend de l’enfant et des distances. Encourager la marche dès qu’il en est capable reste une bonne idée, la poussette servant pour les longs trajets.

## Quand demander conseil
Si votre bébé est né prématurément ou a une particularité de santé, demandez au pédiatre la position la plus adaptée pour ses sorties. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'poussette-securite-au-quotidien-frein-harnais',
    title: 'Poussette : les gestes de sécurité au quotidien (frein, harnais, sacs, entretien)',
    summary: 'Harnais attaché, frein à chaque arrêt, pas de sacs au guidon, entretien régulier : les réflexes simples qui évitent chutes et basculements.',
    journeys: ['newborn', 'child'],
    max_age_months: 48,
    tags: ['poussette', 'sécurité', 'frein', 'harnais', 'basculement', 'sac', 'entretien', 'pliage', 'doigts coincés'],
    sources: [S.santeLandau, S.dgccrfPueri, S.santeEviter],
    body_md: `Une poussette bien choisie reste sûre à condition d’être bien utilisée. Les accidents les plus fréquents (chute, basculement, doigts coincés) s’évitent avec quelques réflexes.

## En bref
- Attachez votre enfant avec le harnais à chaque trajet, même court.
- Actionnez le frein à chaque arrêt, même sur un terrain qui paraît plat.
- Ne suspendez pas de sacs de courses au guidon : la poussette peut basculer.
- Ne laissez jamais votre enfant sans surveillance dans la poussette.
- Vérifiez régulièrement roues, freins, verrous et harnais.

## Comprendre
Les pédiatres de l’AFPA rappellent que l’enfant doit toujours être attaché par le harnais et ne jamais rester sans surveillance dans la poussette. Un enfant qui se penche, se redresse ou essaie de descendre peut faire basculer l’ensemble, surtout si le centre de gravité est déjà déplacé par des sacs accrochés aux poignées.

La DGCCRF demande aussi de vérifier régulièrement les pièces les plus sollicitées (pliage, freinage, verrouillage, harnais, roues) et de ne pas réparer soi-même une pièce usée ou cassée.

## Au quotidien
- **Harnais** : ajustez-le à la taille de l’enfant et à l’épaisseur de ses vêtements ; utilisez toutes les sangles prévues (épaules, taille, entrejambe).
- **Frein** : prenez l’habitude de le mettre dès que vous lâchez le guidon, au passage piéton, dans le bus ou devant un magasin.
- **Charge** : utilisez le panier sous l’assise, dans la limite de poids indiquée par la notice.
- **Pliage et dépliage** : faites-les loin de l’enfant et vérifiez le verrouillage (souvent un « clic ») avant de l’installer, pour éviter les doigts coincés et la fermeture inattendue.
- **Nacelle** : elle n’est pas un siège auto et ne doit pas être posée sur un autre support, comme un chariot de supermarché.
- **Escaliers et escalators** : préférez l’ascenseur ; sinon, sortez l’enfant et portez-le.
- **Chaleur et soleil** : privilégiez l’ombre et utilisez la capote prévue par le fabricant.
- **Entretien** : nettoyez roues et mécanismes, vérifiez l’usure des freins et des boucles ; en cas de pièce défectueuse, contactez le service après-vente.

## Questions fréquentes
**Mon enfant refuse le harnais : que faire ?** Restez constant et expliquez simplement que la poussette ne roule que s’il est attaché. Un petit rituel (chanson, jouet réservé à la poussette) peut aider.

**Puis-je accrocher un sac à langer au guidon ?** Selon la notice, certains crochets sont prévus pour une charge limitée. Le plus prudent reste le panier : la poussette peut basculer en arrière dès que l’enfant descend.

**Le frein d’une seule roue suffit-il ?** Suivez la conception de votre modèle et vérifiez qu’il immobilise vraiment la poussette, y compris en légère pente.

**Faut-il laisser l’enfant dormir longtemps dans la poussette ?** Pour un nourrisson, la position allongée à plat sur le dos est la plus adaptée au sommeil ; une fois rentré, couchez-le dans son lit.

## Quand demander conseil
Après une chute de la poussette, surveillez votre enfant et consultez un médecin au moindre doute, notamment en cas de choc à la tête. Une somnolence inhabituelle, des vomissements répétés ou un comportement inhabituel nécessitent un avis médical rapide. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'nacelle-coque-hamac-quel-mode-selon-age',
    title: 'Nacelle, coque ou hamac : quel mode de transport selon l’âge de bébé ?',
    summary: 'À quoi sert chaque élément du combiné, à partir de quand passer de la nacelle au hamac et pourquoi la coque est réservée aux trajets.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 24,
    tags: ['nacelle', 'coque', 'cosy', 'hamac', 'combiné', 'trio', 'poussette', 'position allongée', 'plagiocéphalie'],
    sources: [S.santeLandau, S.mpediaSieges, S.mpediaCouchage],
    body_md: `Nacelle, coque, hamac : dans un combiné, chaque élément a un rôle et une période d’utilisation. Bien les distinguer permet d’installer bébé dans la position la mieux adaptée à son âge.

## En bref
- La **nacelle** permet un transport allongé ; les pédiatres de l’AFPA la situent jusqu’à 4 à 6 mois environ.
- La **coque** est d’abord un siège auto ; elle maintient bébé semi-allongé, dos à la route en voiture.
- Le **hamac** (siège de poussette) convient à partir de 6 mois environ, quand bébé tient assis.
- La coque n’est pas un lit : la tête de bébé peut basculer vers l’avant pendant le sommeil.
- Limitez le temps passé dans la coque et le transat au strict nécessaire.

## Comprendre
La **nacelle** offre un transport allongé confortable pour un nouveau-né. Certaines sont homologuées pour la voiture, installées en travers de la banquette. mpedia précise toutefois que la nacelle auto n’est pas autorisée dans de nombreux pays et que les pédiatres privilégient la coque dos à la route pour la voiture.

La **coque** maintient bébé en position semi-allongée et soutient sa tête et sa nuque. Elle se fixe souvent sur le châssis de la poussette ou sur une base dans la voiture. ameli rappelle qu’elle ne remplace pas le lit : la tête du nourrisson peut tomber en avant. mpedia conseille, pour limiter la tête plate (plagiocéphalie), de réduire au strict nécessaire le temps passé dans la coque et le transat et de privilégier la nacelle de landau pour les promenades.

Le **hamac** est la position assise de la poussette. Il est conseillé de le placer d’abord face au parent pour garder le contact visuel.

## Au quotidien
- **Pour les promenades des premiers mois**, préférez la nacelle ou une assise inclinée à plat.
- **Pour la voiture**, utilisez la coque homologuée, dos à la route, bien harnachée.
- **À l’arrivée**, sortez bébé de la coque s’il dort et couchez-le à plat sur le dos dans son lit.
- **Passez au hamac** quand bébé tient assis seul et que la notice l’autorise ; commencez face à vous.
- **Vérifiez le verrouillage** de chaque élément sur le châssis à chaque installation.
- **Ne posez pas la nacelle** sur un support non prévu (chariot, table, lit).
- **Suivez les limites** de poids ou de taille indiquées pour chaque élément.

## Questions fréquentes
**Faut-il acheter à la fois une nacelle et une coque ?** Pas forcément. mpedia indique que les pédiatres déconseillent de multiplier les achats : pour la voiture, la coque dos à la route est privilégiée ; pour les balades, une nacelle ou une assise qui s’allonge complètement suffit.

**Bébé peut-il faire une longue sieste dans la coque ?** Ce n’est pas recommandé : la position semi-assise n’est pas adaptée au sommeil prolongé. Lors des longs trajets en voiture, faites des pauses régulières.

**À quel moment passer de la nacelle au hamac ?** Quand votre enfant tient assis sans aide, autour de 6 mois en général, et dans les limites indiquées par la notice.

**La coque peut-elle servir de transat à la maison ?** Elle peut dépanner ponctuellement, posée au sol, mais elle ne doit pas devenir le lieu de vie de bébé ni son lit.

## Quand demander conseil
Si vous remarquez que la tête de votre bébé s’aplatit d’un côté ou qu’il tourne toujours la tête du même côté, parlez-en au pédiatre ou au médecin. ${URG}

${END}`,
  },
  // ───────────────────────────── Siège auto ─────────────────────────────
  {
    ...BASE,
    slug: 'siege-auto-normes-r44-r129-tailles-groupes',
    title: 'Siège auto : comprendre les normes R44 et R129 (i-Size), les groupes et les tailles',
    summary: 'Ce que signifient les étiquettes d’homologation, la différence entre classement par poids et par taille, et quel type de siège à chaque étape.',
    journeys: ['pregnant', 'newborn', 'child'],
    max_age_months: 120,
    tags: ['siège auto', 'R44', 'R129', 'i-Size', 'groupe 0+', 'groupe 1', 'Isofix', 'homologation', 'dos à la route'],
    sources: [S.srSiege, S.mpediaSieges],
    body_md: `Groupe 0+, i-Size, R44, R129, Isofix… Le vocabulaire des sièges auto peut dérouter. Voici les repères pour lire une étiquette et savoir quel siège correspond à votre enfant.

## En bref
- Jusqu’à 10 ans, l’enfant voyage dans un siège auto homologué adapté à sa taille et à sa corpulence, quelle que soit la distance.
- L’étiquette d’homologation porte un « E » dans un cercle suivi d’un chiffre indiquant le pays d’homologation (2 pour la France).
- L’ancienne norme **R44** classe les sièges par **poids** (groupes) ; la norme **R129** les classe par **taille** et allonge la période dos à la route.
- Les sièges R44 ne sont plus vendus depuis le 1er septembre 2024 mais peuvent encore être utilisés.
- Les tailles exactes varient selon les modèles : suivez toujours la notice.

## Comprendre
**Norme R129.** La Sécurité routière indique qu’elle impose le système de fixation Isofix, classe les sièges selon la taille de l’enfant et allonge la période obligatoire dos à la route. mpedia précise qu’avec cette norme (aussi appelée i-Size), l’enfant voyage dos à la route au moins jusqu’à 15 mois. Les grandes étapes données par la Sécurité routière :
- **jusqu’à 83 cm et 15 mois** : siège dos à la route, en position semi-allongée ;
- **jusqu’à 1 m** : siège baquet avec harnais ou siège à réceptacle (bouclier) ; il est recommandé de garder l’enfant dos à la route le plus longtemps possible ;
- **au-delà d’1 m et jusqu’à 10 ans** : rehausseur avec dossier, l’enfant étant maintenu par la ceinture de la voiture.

**Norme R44 (groupes de poids).** Les sièges encore en circulation sont classés par groupes. mpedia les résume ainsi : groupe 0 et 0+ pour les bébés (coque dos à la route, jusqu’à 13 kg pour le 0+), groupe 1 de 9 à 18 kg environ, groupes 2 et 3 pour les plus grands (jusqu’à 36 kg). Certains sièges couvrent plusieurs groupes.

**Isofix.** Ce système relie le siège à des points d’ancrage métalliques de la voiture ; il équipe tous les véhicules neufs depuis 2011.

## Au quotidien
- **Lisez l’étiquette d’homologation** du siège : norme, plage de taille ou de poids, sens d’installation.
- **Repérez les ancrages Isofix** de votre voiture et lisez la notice du véhicule.
- **Mesurez votre enfant** régulièrement : avec un siège R129, c’est la taille qui guide le passage au siège suivant.
- **Gardez votre enfant dos à la route** aussi longtemps que son siège le permet.
- **À l’avant**, un siège dos à la route n’est possible qu’avec l’airbag passager désactivé.
- **Retirez manteau ou combinaison épaisse** avant d’attacher le harnais.

## Questions fréquentes
**Mon siège R44 est-il devenu interdit ?** Non : il ne peut plus être vendu neuf, mais il peut continuer à être utilisé s’il est en bon état et adapté à l’enfant.

**Pourquoi garder l’enfant dos à la route si longtemps ?** En cas de choc frontal, cette position répartit les forces sur tout le dos et protège la tête et la nuque, encore fragiles chez le jeune enfant.

**Mon enfant a les jambes repliées dos à la route : faut-il le tourner ?** Le repère à suivre est la limite de taille ou de poids indiquée par le fabricant du siège ; la Sécurité routière recommande de garder l’enfant dos à la route le plus longtemps possible.

**Un siège i-Size convient-il à toutes les voitures ?** Pas toujours. Vérifiez la liste de compatibilité du fabricant et la notice de votre véhicule, et essayez-le si possible.

## Quand demander conseil
En cas de doute sur la compatibilité ou l’installation, demandez conseil à un vendeur spécialisé ou au fabricant. Après tout accident, même léger, faites vérifier votre enfant par un médecin s’il a reçu un choc. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'choisir-siege-auto-essayer-installer',
    title: 'Acheter un siège auto : essayer, vérifier la compatibilité et bien l’installer',
    summary: 'Les questions à poser en magasin, les points à contrôler sur sa voiture et les réflexes d’installation qui font la différence en cas de choc.',
    journeys: ['pregnant', 'newborn', 'child'],
    max_age_months: 120,
    tags: ['siège auto', 'acheter', 'installation', 'Isofix', 'ceinture', 'harnais', 'airbag', 'manteau', 'voiture'],
    sources: [S.srSiege, S.mpediaSieges],
    body_md: `Un siège auto protège bien… s’il est adapté à l’enfant, compatible avec la voiture et correctement installé. Prendre une demi-heure pour l’essayer et apprendre ses gestes vaut largement le détour.

## En bref
- Vérifiez l’étiquette d’homologation et la plage de taille ou de poids avant d’acheter.
- Essayez le siège en magasin, si possible avec votre enfant, et dans votre voiture.
- Fixation : Isofix bien enclenché, ou ceinture tendue, ni lâche ni vrillée.
- Harnais ajusté : à peine une main entre l’enfant et les sangles, sans manteau épais.
- Siège à l’arrière en priorité ; à l’avant dos à la route uniquement avec l’airbag désactivé.

## Comprendre
La Sécurité routière rappelle que les enfants de moins de 10 ans doivent voyager dans un siège homologué adapté à leur taille et à leur corpulence, à l’arrière, sauf exceptions (bébé dos à la route avec airbag désactivé, absence de sièges arrière ou de ceintures, sièges arrière déjà occupés par des enfants). Le conducteur doit vérifier que chaque passager est attaché ; une amende pouvant atteindre 750 euros est encourue.

Selon la même source, 29 % des enfants tués en voiture n’étaient pas attachés ou l’étaient mal. Un harnais trop lâche ou porté par-dessus une doudoune laisse l’enfant glisser ou être projeté en cas de choc.

## Au quotidien
- **En magasin** : demandez à installer le siège dans votre voiture, vérifiez qu’il tient sans jeu et que le harnais se règle facilement.
- **Lisez les deux notices**, celle du siège et celle de la voiture (emplacements autorisés, airbags, ancrages).
- **Fixation par ceinture** : suivez exactement le passage indiqué sur le siège et dans sa notice, puis vérifiez que la ceinture est tendue, ni lâche ni vrillée.
- **Harnais** : sangles sur les épaules et entre les jambes, boucle fermée avec un « clic », serrage vérifié à chaque trajet.
- **Vêtements** : retirez manteau ou combinaison, attachez l’enfant, puis posez la couverture ou le manteau par-dessus.
- **Ceinture pour les plus grands** : la partie haute passe sur l’épaule, jamais sur le cou ni sous le bras.
- **Habitudes** : apprenez à votre enfant à s’attacher dès qu’il monte et expliquez-lui pourquoi.
- **Habitacle** : rangez les objets posés sur la plage arrière ou la banquette, qui deviennent des projectiles en cas de choc ; bloquez les portes arrière.

## Questions fréquentes
**Isofix ou ceinture : lequel choisir ?** Cela dépend du siège et de votre voiture : la norme R129 impose l’Isofix, présent sur tous les véhicules neufs depuis 2011. Dans tous les cas, suivez la notice et vérifiez que le siège est fermement ancré.

**Puis-je installer le siège à l’avant ?** Seulement dans les cas prévus par la réglementation ; un siège dos à la route à l’avant impose de désactiver l’airbag passager.

**Pour un trajet de cinq minutes, faut-il vraiment attacher l’enfant ?** Oui, l’obligation vaut quelle que soit la distance, et les accidents surviennent aussi près de chez soi.

**Comment savoir si le harnais est assez serré ?** À plat sur la poitrine, vous ne devez pouvoir glisser qu’une main à peine entre l’enfant et les sangles.

## Quand demander conseil
Si votre enfant a une particularité de santé (prématurité, plâtre, besoin d’une position particulière), demandez au pédiatre ou à l’équipe médicale quel dispositif est adapté. Ne laissez jamais un enfant seul dans une voiture, même quelques minutes. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'rehausseur-voiture-quand-passer-dossier',
    title: 'Le rehausseur : quand y passer, avec ou sans dossier, et jusqu’à quand ?',
    summary: 'Le rehausseur positionne la ceinture de la voiture sur le corps de l’enfant : voici les repères pour bien le choisir et l’utiliser jusqu’à 10 ans.',
    journeys: ['child'],
    min_age_months: 36,
    max_age_months: 132,
    tags: ['rehausseur', 'siège auto', 'dossier', 'ceinture de sécurité', 'groupe 2/3', '10 ans', '1,35 m', 'voiture', 'enfant'],
    sources: [S.srSiege, S.mpediaSieges],
    body_md: `Quand l’enfant grandit, le siège à harnais laisse place au rehausseur. Son rôle est simple mais essentiel : placer la ceinture de la voiture au bon endroit sur un corps encore trop petit pour elle.

## En bref
- La Sécurité routière situe le passage au rehausseur avec dossier au-delà d’1 m environ, et son usage jusqu’à 10 ans.
- mpedia rappelle que l’obligation court jusqu’à 10 ans, ou jusqu’à ce que l’enfant soit assez grand pour la ceinture seule (entre 1,35 m et 1,50 m selon les situations).
- Le rehausseur **avec dossier** est recommandé : il maintient le buste et guide la ceinture.
- La ceinture doit passer sur l’épaule, jamais sur le cou ni sous le bras, et bas sur le bassin.
- Les limites de taille ou de poids de la notice priment toujours.

## Comprendre
Une ceinture de sécurité est conçue pour un adulte. Sur un enfant trop petit, la sangle haute passe sur le cou et la sangle basse remonte sur le ventre : elle ne retient alors plus l’enfant aux bons endroits. Le rehausseur surélève l’enfant pour que la ceinture repose sur les os solides (épaule, clavicule, bassin).

Le dossier ajoute un maintien du buste et de la tête, notamment lorsque l’enfant s’endort, et comporte souvent un guide pour la sangle d’épaule. mpedia ne juge acceptable un rehausseur sans dossier que si la ceinture passe bien sur l’épaule et non sur le cou.

## Au quotidien
- **Ne passez pas trop tôt au rehausseur** : tant que l’enfant entre dans son siège à harnais selon la notice, il y est mieux protégé.
- **Vérifiez le passage de la ceinture** à chaque trajet : sangle haute sur l’épaule, jamais sur le cou ; sangle basse à plat sur le bassin ; aucune torsion.
- **Réglez la hauteur du dossier** au fil de la croissance, selon la notice.
- **Expliquez à votre enfant** de ne jamais glisser la ceinture sous le bras ou derrière le dos, et de ne pas se détacher pendant le trajet.
- **Pour le covoiturage ou les grands-parents**, prévoyez un rehausseur supplémentaire ou facile à transférer.
- **Vérifiez l’homologation** sur l’étiquette (E dans un cercle) et choisissez une housse lavable.

## Questions fréquentes
**Mon enfant a 8 ans et réclame la ceinture seule : que répondre ?** Que l’obligation dépend de l’âge et de la taille, et que la ceinture n’est efficace que si elle passe au bon endroit sur son corps. Un rehausseur discret avec dossier peut faciliter l’acceptation.

**Peut-on utiliser un simple coussin rehausseur sans dossier ?** S’il est homologué et que la ceinture passe correctement sur l’épaule, il peut être utilisé ; le modèle avec dossier reste recommandé.

**À 10 ans, mon enfant mesure moins d’1,35 m : que faire ?** Tant que la ceinture ne se place pas correctement sur lui, gardez le rehausseur ; mpedia relie l’usage de la ceinture seule à la taille de l’enfant.

**Le rehausseur doit-il être homologué ?** Oui : comme tout dispositif de retenue pour enfant, il porte une étiquette d’homologation (E dans un cercle) qui précise la plage de taille ou de poids. Un coussin ordinaire ou un livre ne le remplace pas.

**L’enfant peut-il s’asseoir à l’avant avec un rehausseur ?** La règle générale est de placer les moins de 10 ans à l’arrière, sauf exceptions prévues par la réglementation.

## Quand demander conseil
Si votre enfant a un handicap, une particularité de posture ou un plâtre, demandez au médecin ou à l’équipe de rééducation quel dispositif de retenue est adapté. ${URG}

${END}`,
  },
  // ───────────────────────────── Couchage ─────────────────────────────
  {
    ...BASE,
    slug: 'choisir-lit-bebe-barreaux-norme',
    title: 'Choisir le lit de bébé : marquage, barreaux, stabilité et emplacement',
    summary: 'Les critères de sécurité d’un lit à barreaux ou d’un berceau, et où l’installer pendant les premiers mois.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['lit bébé', 'lit à barreaux', 'berceau', 'couffin', 'écartement barreaux', 'conforme aux exigences de sécurité', 'chambre des parents', 'EN 716', 'couchage'],
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCouchage, S.afssapsLits, S.santeSommeil],
    body_md: `Le lit est l’endroit où votre bébé passera le plus de temps sans vous voir. C’est aussi l’un des achats pour lesquels les règles de sécurité sont les plus précises.

## En bref
- Dès la naissance, bébé dort dans son propre lit, jamais dans un lit d’adulte, un canapé ou un fauteuil, même pour une sieste.
- Choisissez un lit portant le marquage CE ou NF et la mention « conforme aux exigences de sécurité ».
- L’écartement entre les barreaux doit rester étroit : ameli indique 4,5 à 6,5 cm selon la norme européenne.
- Utilisez uniquement les pièces fournies et suivez la notice de montage.
- Pendant au moins les six premiers mois, installez le lit dans la chambre des parents.

## Comprendre
Un lit bien conçu évite que l’enfant se coince la tête, un bras ou une jambe, et qu’il bascule par-dessus le bord en grandissant. La norme NF EN 716, citée par l’ancienne Afssaps, fixe notamment un écartement des barreaux inférieur ou égal à 65 mm, mesuré en appliquant une force qui simule l’enfant poussant entre les barreaux : un lit qui semble conforme au repos peut donc s’écarter davantage sous la pression. Pour un berceau, ameli conseille de vérifier aussi les espaces horizontaux.

Santé publique France recommande d’installer le lit dans la chambre des parents au moins les six premiers mois : c’est le contexte de sommeil le plus protecteur selon mpedia, bébé dormant dans son propre lit, près de vous. Un lit neuf gagne à être déballé tôt pour bien s’aérer.

## Au quotidien
- **À l’achat** : vérifiez la mention de conformité, le nom du fabricant, la référence et la notice en français.
- **Au montage** : serrez toutes les vis, n’ajoutez aucune pièce non prévue, vérifiez que le lit ne bouge pas.
- **Sommier réglable** : la position haute facilite les soins des premières semaines ; abaissez-le dès que bébé commence à se redresser, selon la notice.
- **Emplacement** : loin des cordons de stores ou de rideaux, des radiateurs et des meubles sur lesquels l’enfant pourrait grimper plus tard.
- **Mobile** : fixé solidement, hors de portée des mains de bébé.
- **Lit d’occasion** : contrôlez la solidité, chaque barreau, l’écartement et l’état de la peinture ; achetez un matelas neuf.
- **Animaux** : ameli conseille de leur interdire l’accès à la chambre.

## Questions fréquentes
**Berceau, couffin ou lit à barreaux dès la naissance ?** Les trois sont possibles s’ils sont conformes, stables et équipés d’un matelas ferme et ajusté. Le berceau ou le couffin sert quelques mois ; le lit à barreaux dure plus longtemps.

**Puis-je laisser bébé dormir dans notre lit « juste pour cette nuit » ?** ameli indique qu’on peut le prendre pour une tétée, un soin ou un câlin, mais qu’il doit être recouché dans son propre lit avant de se rendormir, surtout si vous êtes fatigué.

**À partir de quand bébé peut-il dormir dans sa chambre ?** Santé publique France indique qu’après six mois il peut dormir dans une autre pièce si le logement le permet.

**Faut-il un lit évolutif ?** C’est une question de budget et de place. L’important est que la configuration bébé respecte les mêmes règles de sécurité.

## Quand demander conseil
Si vous hésitez sur l’installation du couchage, la puéricultrice de PMI ou la sage-femme peut vous conseiller, y compris à domicile. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'choisir-matelas-bebe-ferme-ajuste',
    title: 'Le matelas de bébé : ferme, aux bonnes dimensions, sans rien ajouter',
    summary: 'Pourquoi le matelas doit être ferme et parfaitement ajusté au lit, comment le vérifier et ce qu’il ne faut jamais rajouter dessus.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['matelas bébé', 'matelas ferme', 'drap-housse', 'alèse', 'lit parapluie', 'surmatelas', 'couchage', 'mort inattendue du nourrisson'],
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCouchage, S.santeSommeil, S.dgccrfPueri],
    body_md: `On imagine volontiers qu’un matelas moelleux est plus confortable pour un bébé. Pour un nourrisson, c’est l’inverse : la fermeté et l’ajustement au lit sont des critères de sécurité.

## En bref
- Le matelas doit être **ferme**, de la **dimension exacte** du lit, sans espace sur les côtés.
- ameli conseille un matelas portant la mention « conforme aux exigences de sécurité ».
- Le drap-housse doit être bien ajusté, pas trop grand.
- Ne posez jamais bébé sur une peau de mouton, une serviette éponge, un molleton ou un surmatelas.
- Dans un lit parapluie, n’ajoutez jamais de matelas supplémentaire.

## Comprendre
Un matelas trop mou se creuse sous le poids du bébé : son visage peut s’y enfoncer et il respire alors moins bien. Un matelas trop petit laisse un espace où la tête ou le corps peuvent se coincer. mpedia rappelle que le matelas doit avoir les dimensions du cadre du lit « pour éviter tout risque d’étouffement ».

C’est la même logique pour le lit parapluie : ses parois souples peuvent se déformer, et un matelas ajouté crée un interstice entre la paroi et le matelas. ameli, mpedia et Santé.fr insistent sur ce point : on n’utilise que le matelas fourni avec le lit parapluie.

Le matelas ne relève pas du décret « puériculture », rappelle la DGCCRF, mais il reste soumis à l’obligation générale de sécurité : la mention de conformité, le nom du fabricant et les dimensions indiquées sur l’étiquette sont vos meilleurs repères au moment de l’achat. Le confort de bébé ne dépend pas d’un matelas moelleux : un nourrisson dort bien sur une surface plane et ferme, couché sur le dos.

## Au quotidien
- **À l’achat** : vérifiez les dimensions du matelas par rapport à l’intérieur du lit et la mention de conformité.
- **Vérification** : posé dans le lit, le matelas ne doit laisser aucun interstice sur les côtés ni aux extrémités.
- **Protection** : une alèse et un drap-housse adaptés, bien tendus, sans plis.
- **Rien d’autre** : ni oreiller, ni couette, ni couverture, ni coussin de calage, ni peluche volumineuse.
- **Entretien** : aérez la chambre chaque jour ; mpedia conseille d’aspirer régulièrement le lit et le matelas contre les acariens.
- **Matelas déformé ou abîmé** : remplacez-le.
- **Lit parapluie** : seulement le matelas d’origine, bien à plat.

## Questions fréquentes
**Un matelas d’occasion convient-il ?** Il est plus prudent d’acheter un matelas neuf : on ignore comment il a été conservé et s’il a gardé sa fermeté.

**Le matelas du lit parapluie est très fin : puis-je ajouter un matelas plus confortable ?** Non. Le matelas supplémentaire crée un risque de coincement entre la paroi souple et le matelas.

**Faut-il changer de matelas quand bébé grandit ?** Tant qu’il reste ferme, intact et ajusté au lit, il peut servir. Si vous passez à un lit plus grand, achetez un matelas aux dimensions exactes du nouveau lit.

**Faut-il un matelas « déhoussable » ou « respirant » ?** Une housse lavable est pratique. Les autres arguments commerciaux ne remplacent pas les deux critères essentiels : fermeté et ajustement.

**Mon bébé régurgite : puis-je surélever le matelas ?** Ne modifiez pas l’installation de votre propre initiative : parlez-en au pédiatre. ameli précise de ne pas utiliser de dispositif pour maintenir bébé dans une position.

## Quand demander conseil
Si votre bébé a des difficultés respiratoires, des reflux importants ou une particularité de santé, demandez au pédiatre quel couchage est adapté. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'gigoteuse-turbulette-choisir-taille-saison',
    title: 'Gigoteuse ou turbulette : bien choisir la taille et l’épaisseur selon la saison',
    summary: 'La gigoteuse remplace couette et couverture jusqu’à 2 ans : comment choisir la bonne taille, adapter l’épaisseur à la chambre et vérifier que bébé n’a pas trop chaud.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['gigoteuse', 'turbulette', 'sac de couchage bébé', 'couette', 'couverture', 'température chambre', 'trop chaud', 'couchage'],
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCouchage, S.santeSommeil],
    body_md: `La gigoteuse (ou turbulette) est un sac de couchage avec emmanchures. Elle garde bébé au chaud sans rien qui puisse lui recouvrir le visage. Encore faut-il qu’elle soit à sa taille et adaptée à la température de la chambre.

## En bref
- Pas de drap ni de couette ni de couverture pour couvrir bébé : la gigoteuse ou un surpyjama les remplace.
- Elle doit être **à la taille** de l’enfant : trop grande, bébé peut glisser à l’intérieur.
- mpedia conseille la gigoteuse jusqu’à 2 ans, pour la nuit comme pour les siestes ; ameli situe l’usage d’une couette à partir de 3 ans.
- Température conseillée de la chambre : 18 à 20 °C.
- Pour vérifier que bébé n’a pas trop chaud, touchez sa nuque : elle ne doit pas être moite.

## Comprendre
Une couette ou une couverture peut remonter sur le visage d’un nourrisson qui ne sait pas encore la repousser. La gigoteuse, fermée autour du corps, laisse les bras libres et les jambes bouger, sans tissu qui puisse remonter sur la tête. Si elle est trop grande, l’encolure ou les emmanchures laissent bébé glisser vers l’intérieur : d’où l’importance de la taille.

Trop couvrir est aussi à éviter. ameli conseille de ne pas superposer les couches et mpedia rappelle de ne pas trop couvrir un bébé, surtout s’il a de la fièvre.

La chambre joue aussi son rôle : ameli et Santé publique France recommandent une température de 18 à 20 °C et une aération quotidienne. mpedia ajoute qu’une hygrométrie de 40 à 50 % est idéale et qu’on aère sans créer de courants d’air. Dans une pièce plus chaude, une gigoteuse plus légère et moins de couches en dessous suffisent souvent.

## Au quotidien
- **Taille** : choisissez selon la taille ou l’âge indiqué ; l’encolure doit être ajustée sans serrer et les emmanchures ne doivent pas laisser passer la tête.
- **Épaisseur** : adaptez-la à la saison et à la température réelle de la chambre ; regardez les indications du fabricant.
- **Dessous** : un body et un pyjama adaptés à la saison ; évitez d’empiler les couches.
- **Vérification** : nuque tiède et sèche ; si elle est moite, découvrez légèrement bébé.
- **Fermeture** : vérifiez que la fermeture éclair ou les pressions sont solides et sans pièce qui se détache.
- **Siestes** : la gigoteuse sert aussi en journée ; pas de plaid sur bébé.
- **Lavage** : prévoyez-en au moins deux pour pouvoir laver l’une pendant que l’autre sert.

## Questions fréquentes
**Mon bébé a toujours les mains froides : a-t-il froid ?** ameli propose un repère simple : toucher sa nuque. Tiède et sèche, elle indique en général une tenue adaptée ; moite, elle signale qu’il est trop couvert.

**Une gigoteuse à manches longues est-elle une bonne idée en hiver ?** Elle peut convenir si elle est à la bonne taille et si bébé n’a pas trop chaud ; ajustez les couches en dessous.

**Les nids d’ange ou cocons conviennent-ils pour dormir ?** mpedia déconseille de caler bébé avec un cocon, un coussin ou un pouf : il doit pouvoir bouger librement, à plat sur le dos.

**Une gigoteuse d’occasion convient-elle ?** Oui si elle est à la bonne taille, en bon état, avec une fermeture solide, et lavée avant usage.

**Quand passer à la couette ?** ameli indique qu’une couette n’est utilisable qu’à partir de 3 ans.

## Quand demander conseil
Si votre bébé a de la fièvre, transpire beaucoup ou semble avoir froid malgré une tenue adaptée, demandez conseil au médecin. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'tour-de-lit-cale-bebe-coussin-anti-tete-plate-a-eviter',
    title: 'Tour de lit, cale-bébé, coussin anti-tête plate : les accessoires de couchage à éviter',
    summary: 'Pourquoi les pédiatres et la HAS déconseillent les accessoires qui calent ou entourent bébé dans son lit, et quoi faire à la place.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 24,
    tags: ['tour de lit', 'cale-bébé', 'cale-tête', 'coussin anti-tête plate', 'plagiocéphalie', 'réducteur de lit', 'détecteur de mouvement', 'mort inattendue du nourrisson', 'liste de naissance'],
    safety_critical: true,
    sources: [S.mpediaCouchage, S.hasPlagio, S.ameliCoucher],
    body_md: `Les rayons et les listes de naissance proposent de nombreux accessoires de couchage présentés comme rassurants. Plusieurs d’entre eux sont pourtant déconseillés par les autorités de santé.

## En bref
- Le **tour de lit** est déconseillé : bébé peut enfouir son visage dans le rebord rembourré.
- Les **cale-bébés, cale-tête et coussins anti-tête plate** limitent les mouvements ; la HAS déconseille ces coussins.
- Pas d’oreiller, de couette, de peau de mouton, de peluche volumineuse ni de coussin d’allaitement dans le lit.
- mpedia indique que les cale-bébés et les détecteurs de mouvement n’ont pas fait la preuve de leur efficacité ni de leur innocuité.
- Le lit le plus sûr est le plus simple : matelas ferme, drap-housse ajusté, gigoteuse à la taille.

## Comprendre
Dans un lit, tout objet mou peut couvrir le nez et la bouche d’un nourrisson qui ne sait pas encore s’en dégager. Le tour de lit en est un exemple : mpedia le déconseille car bébé peut y enfouir la tête. ameli ajoute que, s’il est malgré tout utilisé, il doit être fin, ferme, bien attaché et non rembourré.

La HAS a pris position en 2020 sur la tête plate (plagiocéphalie) : le couchage sur le dos reste impératif pour prévenir la mort inattendue du nourrisson, mais les coussins anti-tête plate et les dispositifs qui immobilisent bébé ont des effets délétères parce qu’ils l’empêchent de bouger librement. La prévention passe plutôt par la liberté de mouvement quand il est éveillé.

ameli précise aussi de ne pas utiliser de dispositif (serviette roulée, coussin) pour maintenir bébé sur le dos, et de ne pas le forcer à rester sur le dos une fois qu’il sait se retourner seul.

## Au quotidien
- **Rayez de la liste de naissance** : tour de lit rembourré, cale-bébé, coussin anti-tête plate, oreiller, couette, peau de mouton.
- **Proposez plutôt** : une gigoteuse supplémentaire, des draps-housses ajustés, un tapis d’éveil ferme.
- **Contre la tête plate**, suivez la HAS : temps sur le ventre quand bébé est éveillé et surveillé, sur un tapis ferme au sol, jouets autour de lui, postures variées. mpedia conseille aussi d’alterner l’orientation de sa tête et de changer de temps en temps la position du lit dans la chambre.
- **Doudou** : mpedia rappelle d’éviter qu’il recouvre la tête ou le visage ; Santé publique France signale qu’avant six mois les objets mous près du visage sont dangereux.
- **Rien autour du cou** : ni collier, ni chaînette, ni cordon de sucette, ni lange noué.

## Questions fréquentes
**Le tour de lit protège des chocs contre les barreaux : n’est-ce pas utile ?** Les autorités de santé jugent que le risque d’étouffement l’emporte. Un lit conforme a des barreaux suffisamment rapprochés pour éviter les coincements.

**Le pédiatre a constaté une tête plate : faut-il un coussin ?** La HAS déconseille ces coussins. Le professionnel vous proposera des conseils de positionnement adaptés et, si besoin, une prise en charge spécifique.

**Les détecteurs de mouvement vendus en magasin sont-ils utiles ?** mpedia indique qu’ils n’ont pas fait la preuve de leur efficacité ; ils ne remplacent pas un couchage sûr.

**Puis-je garder le cadeau reçu pour décorer la chambre ?** Oui, hors du lit et hors de portée de bébé.

## Quand demander conseil
Si la tête de votre bébé se déforme ou s’il tourne toujours la tête du même côté, consultez le pédiatre ou le médecin. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'lit-parapluie-berceau-cododo-accole-securite',
    title: 'Lit parapluie, berceau et lit accolé au lit parental : les points de sécurité',
    summary: 'Les règles propres aux couchages d’appoint et aux lits « cododo » qui s’accrochent au lit des parents.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['lit parapluie', 'lit pliant', 'berceau', 'cododo', 'side-bed', 'lit accolé', 'voyage', 'couchage', 'chambre des parents'],
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCouchage, S.santeEviter],
    body_md: `Lit pliant pour les week-ends, berceau pour les premières semaines, lit qui s’accroche au lit parental pour faciliter les tétées : ces couchages ont chacun leurs règles.

## En bref
- **Lit parapluie** : uniquement le matelas fourni, jamais de matelas supplémentaire.
- **Berceau** : stable, conforme, matelas ferme et ajusté, espaces horizontaux à vérifier.
- **Lit accolé (« cododo »)** : il doit être fixé au lit parental, sans aucun interstice.
- Bébé dort toujours dans son propre espace de couchage, sur le dos, sans couette ni oreiller.
- Ne jamais coucher bébé avec un autre enfant ni s’endormir avec lui sur un canapé ou un fauteuil.

## Comprendre
**Le lit parapluie** a des parois souples qui peuvent se déformer. Si l’on ajoute un matelas plus épais, un espace se crée entre la paroi et le matelas, dans lequel bébé peut glisser et se coincer. C’est pourquoi ameli, mpedia et Santé.fr insistent : seul le matelas vendu avec le lit est utilisé.

**Le berceau** convient aux premiers mois, tant que bébé ne se redresse pas. ameli conseille de vérifier les espaces horizontaux et d’utiliser uniquement les pièces fournies.

**Le lit accolé** permet d’avoir bébé à portée de main tout en lui laissant son propre couchage. ameli précise qu’il doit être fixé au lit parental sans interstice. Le partage du même lit (bébé dans le lit des parents) est, selon mpedia, un facteur de risque de mort inattendue du nourrisson, surtout avant 3 mois.

## Au quotidien
- **Montage** : suivez la notice, vérifiez que chaque verrou est enclenché et que le fond est bien à plat.
- **Lit parapluie en voyage** : emportez sa notice en photo, vérifiez l’état des parois et des verrous à chaque montage.
- **Lit accolé** : fixez-le au lit parental comme le prévoit la notice, sans aucun interstice, et vérifiez les fixations régulièrement ; aucun coussin, couette ou oreiller ne doit déborder vers bébé.
- **Fatigue** : si vous vous sentez très fatigué, sous médicament qui diminue la vigilance, ou après avoir bu de l’alcool, recouchez bébé dans son lit avant de vous endormir.
- **Hors du lit** : ne laissez pas bébé dormir dans la coque auto, le transat ou la poussette une fois arrivé.
- **Limites** : respectez l’âge ou le poids maximum du berceau et du lit accolé ; passez au lit à barreaux quand bébé commence à se redresser.

## Questions fréquentes
**Le lit parapluie peut-il servir de lit principal ?** S’il est conforme et utilisé avec son seul matelas, il peut dépanner. Pour un usage quotidien prolongé, un lit à barreaux offre souvent plus de confort aux parents pour les soins.

**Peut-on mettre deux matelas fins l’un sur l’autre dans le lit parapluie ?** Non, même fins : tout matelas ajouté crée un risque de coincement.

**Le hamac ou le couffin à bascule suspendu convient-il pour la nuit ?** Respectez l’usage prévu par la notice ; pour le sommeil, la règle reste une surface plane et ferme, bébé sur le dos.

**Bébé s’endort au sein dans notre lit : que faire ?** ameli conseille de le recoucher dans son propre lit avant de vous rendormir.

## Quand demander conseil
La sage-femme, la puéricultrice de PMI ou le pédiatre peuvent vous aider à organiser des nuits plus faciles, notamment si vous allaitez. Si l’épuisement vous submerge, parlez-en ; en cas d’idées noires, le 3114 répond 24 h/24. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'preparer-chambre-bebe-air-interieur-meubles',
    title: 'Préparer la chambre ou le coin de bébé : meubles, peinture, aération',
    summary: 'Quand terminer l’aménagement, comment limiter les polluants des meubles et de la peinture, et quels objets éviter dans la pièce.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 12,
    tags: ['chambre bébé', 'coin bébé', 'peinture', 'meubles neufs', 'COV', 'aérer', 'air intérieur', 'bougie parfumée', 'veilleuse', 'travaux grossesse'],
    sources: [S.santeAir, S.santeSommeil, S.santeOndes],
    body_md: `Repeindre, monter les meubles, décorer : préparer le coin de bébé fait partie des plaisirs de l’attente. Quelques précautions permettent d’éviter que ce nid tout neuf soit chargé de polluants.

## En bref
- Santé publique France conseille de terminer l’aménagement du coin de bébé **au moins trois mois** avant son arrivée.
- Choisissez des produits de bricolage et de décoration peu émissifs (une étiquette indique leurs émissions de composés organiques volatils).
- La femme enceinte ne participe pas aux travaux ; bébé n’est pas installé dans une pièce qui vient d’être peinte, vernie ou collée.
- Aérez chaque pièce au moins 10 minutes par jour, été comme hiver.
- Pas de bougies parfumées, d’encens ni de parfums d’ambiance ; pas de tabac dans le logement.

## Comprendre
Les meubles, les revêtements de sol, les peintures, vernis et colles peuvent émettre des substances volatiles (dont le formaldéhyde). Santé publique France rappelle que l’air intérieur est souvent plus pollué que l’air extérieur et que l’aération reste le moyen le plus efficace pour l’assainir. Les plantes ne dépolluent pas l’intérieur, et l’efficacité des purificateurs d’air du commerce n’est pas prouvée.

Les bougies, l’encens et les parfums d’intérieur n’éliminent pas la pollution : ils ajoutent des particules fines et des composés volatils. Quant au tabac, ses substances imprègnent tissus, moquettes et meubles, puis sont réémises.

## Au quotidien
- **Calendrier** : prévoyez peinture et montage tôt dans la grossesse, confiés à une autre personne.
- **Peinture et colle** : lisez l’étiquette d’émissions, respectez les consignes d’usage et aérez pendant et après.
- **Meubles** : déballez-les tôt et laissez la pièce bien aérée ; Santé publique France conseille de déballer tôt un lit neuf.
- **Ménage** : peu de produits, pas de sprays, des produits simples ; aspirateur avec filtre adapté, chiffons microfibres.
- **Ventilation** : ne bouchez pas les grilles et nettoyez-les.
- **Température** : 18 à 20 °C dans la chambre.
- **Lumière** : évitez les veilleuses LED à lumière bleue pour les nourrissons et les écrans dans la chambre.
- **Sécurité** : lit loin des cordons de stores et de rideaux ; meubles hauts fixés au mur.

## Questions fréquentes
**Faut-il absolument une chambre séparée ?** Non. Pendant au moins les six premiers mois, le lit est conseillé dans la chambre des parents. Un coin bébé bien pensé suffit.

**Un purificateur d’air est-il utile ?** Selon Santé publique France, son efficacité n’est pas prouvée ; aérer et ventiler restent les gestes les plus efficaces.

**Puis-je mettre un diffuseur d’huiles essentielles pour une bonne odeur ?** Les parfums d’intérieur ajoutent des substances dans l’air ; Santé publique France conseille de les éviter, comme les bougies et l’encens.

**Les meubles d’occasion sont-ils préférables aux neufs ?** Les sources consultées ne tranchent pas. Neufs ou non, aérez bien la pièce ; pour le lit, vérifiez sa solidité et sa conformité.

## Quand demander conseil
Si un membre du foyer souhaite arrêter de fumer, un professionnel de santé ou Tabac info service peut l’accompagner. Pour toute question sur l’environnement de bébé, la sage-femme ou la PMI peut vous conseiller. ${URG}

${END}`,
  },
  // ───────────────────────────── Portage ─────────────────────────────
  {
    ...BASE,
    slug: 'choisir-porte-bebe-echarpe-ou-preforme',
    title: 'Choisir un porte-bébé : écharpe, préformé, ventral ou dorsal ?',
    summary: 'Les différents moyens de portage, les critères de choix selon l’âge et la morphologie, et la position à rechercher pour bébé.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['porte-bébé', 'écharpe de portage', 'préformé', 'portage', 'physiologique', 'ventral', 'dorsal', 'face au monde', 'PMI'],
    sources: [S.girondePortage, S.santeLandau, S.mpediaEcharpe],
    body_md: `Porter son bébé contre soi rassure souvent l’enfant et libère les mains de l’adulte. Encore faut-il choisir un moyen de portage adapté à l’âge de l’enfant, à votre corps et à vos activités.

## En bref
- Le porte-bébé doit être de qualité, en bon état, bien ajusté et adapté à l’âge, à la morphologie de l’enfant et à l’activité.
- La position recherchée : bébé vertical, assis-accroupi, dos arrondi, tête dans l’alignement du tronc, menton décollé de la poitrine.
- Les pédiatres de l’AFPA situent le portage ventral de la naissance à 9 mois environ, le dorsal à partir de 9 mois environ.
- mpedia déconseille le portage face au monde.
- Les professionnels de PMI peuvent accompagner gratuitement l’apprentissage du portage.

## Comprendre
On distingue l’**écharpe** (une longue bande de tissu que l’on noue) et les **porte-bébés prêts à porter** (préformés, avec boucles ou sangles). mpedia indique que l’écharpe convient jusqu’à 10 à 12 kg environ ; au-delà, un porte-bébé qui respecte l’enroulement du corps, avec une assise large et profonde, prend le relais.

Selon la position, on parle de portage **ventral** (bébé contre la poitrine du porteur), **latéral** (sur la hanche) ou **dorsal** (sur le dos, plus tard). Le document de la PMI de la Gironde insiste sur une position respectueuse de la physiologie : bassin basculé, dos arrondi, toute la base du corps soutenue, mains à portée de la bouche, voies respiratoires dégagées.

mpedia déconseille le portage face au monde : le tissu comprime alors la cage thoracique, l’enfant repose sur ses organes génitaux et ne peut pas se replier contre l’adulte s’il a peur ou s’il est fatigué.

## Au quotidien
- **Essayez avant d’acheter** : en atelier de portage, auprès de la PMI ou en magasin, avec un poupon ou votre bébé.
- **Vérifiez l’étiquette** : âge et poids minimum et maximum, notice en français, teinture garantie sans substances toxiques.
- **Assise** : mpedia la souhaite large et profonde, pour que l’enfant soit assis-accroupi, bassin basculé, dos arrondi.
- **Réglages** : le porte-bébé doit pouvoir s’ajuster à chaque porteur ; testez-le à deux si vous comptez le partager.
- **Hauteur** : bébé porté assez haut, tête à la base de votre cou, pour garder un œil sur son visage.
- **Vêtements** : une couche de tissu compte comme une couche de vêtement ; protégez tête et extrémités du froid ou du soleil.
- **Entretien** : contrôlez coutures, boucles et sangles ; ne réparez pas vous-même une pièce de sécurité.

## Questions fréquentes
**Écharpe ou préformé pour un nouveau-né ?** Les deux sont possibles si le modèle est prévu dès la naissance et bien réglé. L’écharpe s’ajuste finement mais demande un apprentissage ; le préformé est plus rapide à mettre.

**Puis-je porter face au monde quand bébé est curieux ?** mpedia le déconseille. Le portage sur la hanche ou sur le dos, plus tard, permet à l’enfant de regarder autour de lui.

**Le porte-bébé peut-il remplacer le siège auto ?** Non. La PMI de la Gironde rappelle qu’il ne remplace pas un siège homologué.

**Jusqu’à quel âge peut-on porter ?** Tant que le moyen de portage est adapté au poids de l’enfant et que vous êtes à l’aise ; respectez les limites de la notice.

## Quand demander conseil
Si vous avez mal au dos, au périnée ou aux épaules en portant, ou si votre bébé est né prématurément, demandez conseil à la sage-femme, au kinésithérapeute ou à la PMI avant de poursuivre. ${URG}

${END}`,
  },
  {
    ...BASE,
    slug: 'portage-securite-respiration-visage-degage',
    title: 'Portage : les règles de sécurité pour que bébé respire bien',
    summary: 'Visage visible, menton décollé, voies respiratoires libres, vigilance du porteur : les points à contrôler à chaque fois que vous portez votre bébé.',
    journeys: ['newborn'],
    max_age_months: 24,
    tags: ['portage', 'écharpe de portage', 'porte-bébé', 'respiration', 'visage dégagé', 'position berceau', 'sécurité', 'nouveau-né'],
    safety_critical: true,
    sources: [S.mpediaEcharpe, S.girondePortage, S.mpediaCouchage],
    body_md: `Dans une écharpe ou un porte-bébé, un nourrisson ne peut pas toujours changer de position seul. La première règle du portage est donc de garder en permanence ses voies respiratoires dégagées.

## En bref
- Bébé est porté **verticalement**, poitrine contre le porteur, tête à la base de votre cou.
- Son **visage reste visible** et découvert, son **nez dégagé**, son **menton décollé** de sa poitrine.
- Évitez la position « berceau allongé » au fond du tissu.
- Ne portez pas en dormant, et évitez de porter sous l’effet de médicaments qui diminuent la vigilance, d’alcool ou de drogue.
- Pour réajuster le nouage, sortez bébé plutôt que de le tenir à bout de bras dans le tissu.

## Comprendre
Un nourrisson dont le menton est collé à la poitrine, ou dont le visage est enfoncé dans le tissu ou dans votre vêtement, peut respirer moins bien sans faire de bruit. mpedia insiste sur une précaution essentielle : garder en permanence le nez dégagé, en orientant le visage sur le côté, en évitant qu’un vêtement couvre sa tête (surtout l’hiver) et en le portant assez haut pour garder un œil sur son visage.

La PMI de la Gironde déconseille la position « berceau allongé », où le bébé est couché sur le dos au fond du tissu : son menton peut alors se replier sur sa poitrine. Elle rappelle aussi d’adapter ses activités : pas de secousses, pas de risque de chute, pas de pratiques intenses.

La vigilance du porteur fait partie de la sécurité : le même document conseille de ne pas porter pendant son propre sommeil et d’éviter médicaments qui diminuent la vigilance, alcool et drogue. Enfin, le porte-bébé ne remplace pas un siège auto homologué : en voiture, bébé voyage toujours dans son siège, même pour un court trajet.

## Au quotidien
- **Le contrôle en un coup d’œil** : je vois son visage, son nez est libre, son menton est décollé de sa poitrine, sa tête est à la base de mon cou.
- **Pendant l’installation**, gardez une main sous ses fesses jusqu’à ce que le nouage soit terminé.
- **En hiver**, un manteau de portage ou un vêtement adapté peut couvrir l’ensemble, sans recouvrir son visage.
- **Surveillez** sa couleur, sa tonicité, s’il a trop chaud ou trop froid, et proposez-lui à boire ou le sein régulièrement.
- **Activités** : pas de vélo, de course, de cuisine près des plaques ou d’activité à risque de chute en portant.
- **Fatigue** : si vous sentez le sommeil vous gagner, posez bébé sur le dos dans son lit.

## Questions fréquentes
**Bébé s’endort dans l’écharpe : faut-il le sortir ?** Il peut dormir porté si sa position reste verticale, son visage visible et son nez dégagé, et si vous restez éveillé et attentif. Pour un sommeil prolongé, couchez-le à plat sur le dos dans son lit.

**Mon bébé a la tête enfoncée dans le tissu : comment corriger ?** Remontez-le pour que sa tête soit à la base de votre cou, resserrez le tissu et tournez son visage sur le côté. En cas de doute, détachez-le et recommencez.

**Jusqu’à quel poids porter en écharpe ?** mpedia situe l’écharpe jusqu’à 10 à 12 kg environ ; au-delà, un porte-bébé prêt à porter, à assise large et profonde, prend le relais.

**Un prématuré peut-il être porté ?** Demandez l’avis de l’équipe qui le suit avant de commencer.

## Quand demander conseil
Si votre bébé change de couleur, respire de façon inhabituelle ou semble mou, sortez-le immédiatement du porte-bébé et allongez-le à plat. S’il ne respire pas ou ne réagit pas, appelez le 15 ou le 112. Pour apprendre les bons gestes, la PMI ou une sage-femme formée au portage peut vous accompagner.

${END}`,
  },
  // ───────────────────────────── Transat ─────────────────────────────
  {
    ...BASE,
    slug: 'transat-bebe-choisir-norme-stabilite',
    title: 'Le transat de bébé : bien le choisir et l’utiliser en sécurité',
    summary: 'Norme, harnais, inclinaison, poids maximum et règles d’installation : les critères pour choisir un transat et éviter chutes et basculements.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 9,
    tags: ['transat', 'balancelle', 'EN 12790', 'harnais', 'chute', 'stabilité', 'plagiocéphalie', 'puériculture', 'liste de naissance'],
    sources: [S.santeLandau, S.mpediaCouchage, S.hasPlagio, S.dgccrfPueri],
    body_md: `Le transat permet d’installer bébé en position semi-assise pour un repas, un moment d’éveil près de vous ou une pause. Pratique, il doit cependant être bien choisi, toujours posé au sol et utilisé avec modération.

## En bref
- Le transat doit être conforme à la norme européenne EN 12790 et équipé d’un harnais (3 ou 5 points).
- Les pédiatres de l’AFPA indiquent un usage jusqu’à 9 kg environ : respectez la limite de la notice.
- Ne le posez **jamais en hauteur** (table, lit, canapé, plan de travail).
- Choisissez au moins deux inclinaisons et une housse lavable.
- Limitez le temps passé dans le transat au strict nécessaire et ne le transformez pas en lit.

## Comprendre
Un bébé qui gigote dans son transat peut le faire glisser ou basculer, surtout sur une surface en hauteur ou souple. C’est pourquoi l’AFPA insiste sur la stabilité et sur un usage au sol uniquement. Le harnais empêche bébé de glisser ou de se redresser au point de basculer.

Côté développement, mpedia conseille de limiter au strict nécessaire le temps en coque et en transat pour prévenir la tête plate, et la HAS rappelle que le bébé éveillé doit rester libre de ses mouvements, y compris sur le ventre sous surveillance, sur un tapis ferme au sol. Le transat n’est pas adapté au sommeil prolongé : bébé dort à plat sur le dos dans son lit.

La DGCCRF range les transats parmi les articles du décret « puériculture » : ils doivent être stables, solides, avec des dispositifs de sécurité que l’enfant ne peut pas actionner, et une notice qui précise le montage et les limites d’utilisation. Comme pour tout article de puériculture, choisissez-le d’abord selon l’usage prévu et l’âge, plutôt que sur son apparence.

## Au quotidien
- **À l’achat** : vérifiez la référence à la norme EN 12790, le poids maximum, le harnais, la base antidérapante, le poids et le pliage.
- **Installation** : au sol, sur une surface plane, loin des escaliers, des portes, des animaux et des sources de chaleur.
- **Harnais** : attaché à chaque fois, même pour quelques minutes.
- **Pièces sollicitées** : la DGCCRF cite les poignées de transat parmi les éléments à contrôler régulièrement.
- **Surveillance** : installez le transat dans la pièce où vous êtes, là où vous voyez bébé.
- **Limites** : respectez le poids maximum et les conditions d’usage de la notice ; un bébé qui commence à se retourner ou à vouloir s’asseoir peut davantage faire bouger son transat.
- **Entretien** : contrôlez les poignées, l’armature et les boucles ; signalez tout défaut.

## Questions fréquentes
**Bébé s’est endormi dans le transat : dois-je le laisser ?** Pour une sieste, mieux vaut le coucher à plat sur le dos dans son lit, dans un environnement sûr.

**Le transat peut-il servir pour donner le biberon ou la purée ?** L’AFPA le cite pour les repas en position semi-assise. Restez à côté de bébé et gardez le harnais attaché.

**Combien de temps par jour dans le transat ?** Aucune durée précise n’est fixée par les sources consultées ; l’idée est de réserver le transat à des moments courts et de privilégier le tapis au sol quand bébé est éveillé.

**Balancelle électrique ou transat simple ?** Les mêmes règles s’appliquent : conformité, harnais, stabilité, usage limité et jamais pour la nuit.

## Quand demander conseil
Après une chute de transat, surtout si elle a eu lieu depuis une hauteur, consultez un médecin au moindre doute ; vomissements, somnolence inhabituelle, pleurs inconsolables ou bosse importante nécessitent un avis rapide. ${URG}

${END}`,
  },
  // ───────────────────────────── Repas, toilette, change ─────────────────────────────
  {
    ...BASE,
    slug: 'chaise-haute-siege-de-table-choisir',
    title: 'Chaise haute et siège de table : bien choisir et éviter les chutes',
    summary: 'Les mentions à vérifier sur une chaise haute ou un siège de table, les risques relevés par la DGCCRF et les réflexes au moment du repas.',
    journeys: ['newborn', 'child'],
    min_age_months: 6,
    max_age_months: 48,
    tags: ['chaise haute', 'siège de table', 'rehausseur de chaise', 'harnais', 'chute', 'diversification', 'repas', 'puériculture'],
    sources: [S.dgccrfChaise, S.santeAccidents, S.santeEviter],
    body_md: `Avec la diversification, la chaise haute entre dans la cuisine. Elle permet à l’enfant de partager les repas à table, à condition d’être stable, bien réglée et toujours utilisée avec le harnais.

## En bref
- Chaises hautes et sièges de table relèvent du décret « puériculture » et d’une norme spécifique.
- Vérifiez sur le produit : marquages réglementaires, notice en français, avertissements, version et date de la norme appliquée, matériaux.
- Principaux risques : chute, petites pièces qui se détachent, arêtes coupantes ; pour le siège de table, doigts ou pieds coincés et chute s’il est mal fixé.
- Attachez toujours votre enfant et restez près de lui.
- Éloignez la chaise de la table : l’enfant peut s’y appuyer du pied et basculer en arrière.

## Comprendre
Lors d’une enquête, la DGCCRF a relevé sur certaines chaises hautes des petits éléments détachables (risque d’étouffement) et des arêtes vives, et, plus souvent encore, des informations insuffisantes pour les consommateurs : notices incomplètes, avertissements manquants. Pour les sièges de table, qui se fixent au plateau, les défauts portaient surtout sur les conseils d’installation et de réglage, alors qu’une mauvaise fixation peut entraîner une chute.

Les pédiatres de l’AFPA rappellent qu’un enfant bien attaché peut quand même se pousser en arrière avec la jambe contre une table trop proche. Santé.fr conseille de garder une main sur bébé dès qu’il est en hauteur et, si vous devez vous éloigner, de l’emmener ou de le poser au sol ou dans son lit.

## Au quotidien
- **À l’achat** : stabilité (pieds écartés, base large), harnais complet avec entrejambe, tablette qui se verrouille, housse lavable, notice claire.
- **Réglages** : suivez la procédure pour retirer et remettre la tablette, et vérifiez le verrouillage à chaque fois.
- **Harnais** : attaché à chaque repas, ajusté à l’épaisseur des vêtements.
- **Emplacement** : loin de la table, des plaques de cuisson, du four, des fenêtres et des cordons de stores.
- **Grimper** : ne laissez pas un enfant monter seul sur la chaise ; elle peut basculer.
- **Siège de table** : seulement sur une table stable, au plateau épais et solide, comme le prévoit la notice ; jamais sur une nappe ou une table en verre si la notice l’exclut.
- **Entretien** : contrôlez les vis, les boucles et l’absence de pièces qui se détachent.

## Questions fréquentes
**À partir de quand utiliser la chaise haute ?** Quand votre enfant tient assis seul et selon l’âge indiqué par le fabricant ; certains modèles ont une position inclinée prévue pour les plus petits, à utiliser comme indiqué.

**Le rehausseur de chaise est-il une alternative ?** Pour un enfant plus grand, oui, s’il est conforme, fixé à une chaise stable et équipé d’une sangle.

**Peut-on laisser l’enfant finir son repas pendant qu’on va répondre au téléphone ?** Mieux vaut l’emmener ou le poser au sol : une chute arrive en quelques secondes.

**Les chaises hautes évolutives en bois sont-elles plus sûres ?** Le matériau compte moins que la conformité, la stabilité, le harnais et le respect de la notice.

## Quand demander conseil
Après une chute de chaise haute, consultez un médecin au moindre doute, surtout si l’enfant a pris un coup sur la tête, vomit, est inhabituellement somnolent ou pleure sans pouvoir être consolé. En cas d’étouffement (l’enfant ne peut plus respirer, tousser ni pleurer), appelez immédiatement le 15 ou le 112. ${URG}

${END}`,
  },
  {
    ...BASE,
    category: 'securite',
    slug: 'baignoire-transat-de-bain-anneau-choisir-securite',
    title: 'Baignoire, transat de bain, anneau : bien choisir le matériel du bain',
    summary: 'Quel matériel pour baigner bébé selon son âge, à quelle température et pourquoi aucun accessoire ne remplace votre présence à côté de lui.',
    journeys: ['pregnant', 'newborn', 'child'],
    max_age_months: 48,
    tags: ['baignoire bébé', 'transat de bain', 'anneau de bain', 'siège de bain', 'thermomètre de bain', 'tapis antidérapant', 'noyade', 'brûlure', 'bain'],
    safety_critical: true,
    sources: [S.ameliBain, S.santeAccidents, S.dgccrfPueri],
    body_md: `Baignoire posée au sol, transat de bain, anneau, thermomètre : le matériel du bain rend le moment plus confortable. Il ne protège pourtant pas de la noyade, qui peut survenir en quelques instants, sans bruit.

## En bref
- Ne laissez **jamais** votre enfant seul dans le bain, même avec un transat, un anneau ou un tapis antidérapant, même s’il tient assis ou a 2 ou 3 ans.
- ameli rappelle qu’un bébé peut se noyer en quelques minutes, sans un bruit, même dans 20 cm d’eau.
- Température de l’eau : 37 °C au maximum, vérifiée au thermomètre ou, à défaut, avec le coude.
- Une baignoire pour bébé posée au sol est plus stable qu’une baignoire sur pieds.
- Le transat de bain est réservé aux nourrissons de moins de 8 kg et de moins de 70 cm.

## Comprendre
ameli décrit plusieurs équipements :
- **la baignoire pour bébé** : celles posées au sol sont plus stables que celles montées sur pieds ;
- **le transat ou siège de bain** (toile ou plastique), installé dans la grande baignoire : il maintient bébé semi-allongé et libère les mains, mais il faut vérifier en permanence qu’il reste stable ;
- **le tapis antidérapant**, à fixer au fond de la baignoire une fois que bébé tient assis, vers 7 à 9 mois ;
- **l’anneau de bain**, qui maintient l’enfant assis en cas de bascule ;
- **le thermomètre de bain**, pour ne pas dépasser 37 °C.

Ces objets relèvent du décret « puériculture ». Mais aucun ne surveille l’enfant à votre place : les pédiatres de l’AFPA rappellent qu’avant 3 ans l’enfant ne doit jamais rester seul dans son bain, même dans un siège adapté ou sur un tapis antidérapant.

## Au quotidien
- **Préparez tout avant** : serviette, vêtements, couche, produits à portée de main ; téléphone éteint ou sur répondeur.
- **Eau** : 8 à 12 cm de profondeur selon ameli ; faites couler l’eau froide puis la chaude, terminez par un peu d’eau froide et mélangez à la main.
- **Robinet** : ne faites jamais couler l’eau quand bébé est dans la baignoire et ne vidangez pas pendant le bain.
- **Salle de bain** : 22 à 25 °C, sans courant d’air.
- **Une main sur bébé** dès que vous tendez le bras pour attraper quelque chose.
- **Sortie imprévue** (sonnette, téléphone) : enveloppez bébé dans une serviette et emmenez-le.
- **Après le bain** : videz immédiatement la baignoire et rangez les accessoires.
- **Jouets de bain** : adaptés à l’âge, conformes, séchés après chaque usage.

## Questions fréquentes
**L’anneau de bain permet-il de m’éloigner une minute ?** Non. Il aide l’enfant à rester assis, mais ne l’empêche ni de basculer ni de glisser. Restez à portée de main.

**Mon enfant a 3 ans et adore jouer seul dans le bain : est-ce possible ?** ameli rappelle de ne jamais laisser un enfant seul dans son bain, y compris à 2 ou 3 ans. Restez dans la pièce et gardez un œil sur lui.

**Faut-il un thermomètre de bain ?** Il aide à vérifier facilement que l’eau ne dépasse pas 37 °C. Sans thermomètre, plongez le coude : la chaleur doit être agréable.

**Le mitigeur thermostatique est-il utile ?** Santé.fr cite le mitigeur préréglé et le chauffe-eau réglé au minimum comme moyens de limiter les brûlures.

## Quand demander conseil
En cas de brûlure, refroidissez la zone sous l’eau tiède et demandez un avis médical. Si un enfant a été retrouvé dans l’eau, même brièvement et même s’il semble aller bien, appelez le 15 ou le 112. ${URG}

${END}`,
  },
  {
    ...BASE,
    category: 'securite',
    slug: 'table-a-langer-matelas-a-langer-chutes',
    title: 'Table à langer et matelas à langer : choisir et éviter les chutes',
    summary: 'Les chutes de la table à langer peuvent arriver dès la naissance : comment choisir son espace de change et organiser le geste pour ne jamais lâcher bébé.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 24,
    tags: ['table à langer', 'matelas à langer', 'change', 'commode', 'chute', 'couche', 'sécurité', 'puériculture'],
    safety_critical: true,
    sources: [S.santeAccidents, S.santeEviter, S.dgccrfPueri],
    body_md: `On imagine qu’un nouveau-né ne bouge pas beaucoup. Pourtant, les pédiatres rappellent qu’un bébé peut basculer de la table à langer dès la naissance, en un mouvement ou en se poussant avec les pieds.

## En bref
- Restez près de bébé et ne le quittez pas des yeux pendant le change.
- Préparez tout le matériel à portée de main avant de l’installer.
- Si vous devez vous éloigner, emmenez-le ou posez-le au sol ou dans son lit.
- La table à langer relève du décret « puériculture » ; le matelas à langer, de l’obligation générale de sécurité.
- Une ceinture de matelas ou des rebords ne remplacent pas votre main.

## Comprendre
Les pédiatres de l’AFPA expliquent que les chutes de la table à langer surviennent souvent quand l’adulte est distrait : un téléphone qui sonne, la sonnette, un produit oublié. Le bébé se tortille, pousse sur ses pieds, se retourne pour la première fois… et tombe d’une hauteur importante pour sa taille. Santé.fr conseille de garder une main sur lui dès qu’il est en hauteur, que ce soit sur la table à langer, une chaise haute, un canapé ou un lit sans barreaux.

La DGCCRF classe les tables à langer parmi les articles du décret « puériculture » (stabilité, solidité, notice) ; les matelas à langer en sont exclus mais doivent rester sûrs.

Le change est aussi un moment où l’enfant peut attraper ce qui se trouve à côté de lui. Santé.fr rappelle de ranger les produits d’entretien et les médicaments en hauteur, dans un placard fermé, et de garder hors de portée les petits objets qu’il pourrait porter à la bouche : pièces de monnaie, perles, boutons, petites pièces de jouets.

## Au quotidien
- **À l’achat** : une table stable, à une hauteur confortable pour votre dos, avec rebords ; vérifiez la notice et le poids maximum de l’enfant.
- **Matelas** : adapté aux dimensions du plan de change, qui ne glisse pas, lavable.
- **Organisation** : couches, lingettes ou coton, eau, crème, vêtements propres et sac à couches à portée de main, du côté où vous ne lâchez pas bébé.
- **Une main sur bébé** pendant tout le change, même pour attraper un objet.
- **Distraction** : laissez sonner le téléphone ou la porte, ou emmenez bébé avec vous.
- **Alternative** : un matelas à langer posé au sol supprime le risque de chute, notamment chez les grands-parents ou en voyage.
- **Environnement** : produits et petits objets hors de portée de sa main ; pas de radiateur brûlant à côté.

## Questions fréquentes
**Mon bébé ne se retourne pas encore : puis-je m’éloigner une seconde ?** Non : le premier retournement est souvent inattendu, et bébé peut aussi glisser en poussant sur ses pieds.

**Les tables à langer qui se posent sur la baignoire sont-elles sûres ?** Elles doivent être bien fixées et utilisées comme le prévoit la notice ; vérifiez leur stabilité à chaque fois.

**Une commode avec plan à langer est-elle une bonne idée ?** Elle peut convenir si elle est stable, fixée au mur si nécessaire, et si le plan de change est assez large.

**Que faire si bébé est tombé mais semble aller bien ?** Surveillez-le attentivement et demandez un avis médical, surtout s’il s’agit d’un nourrisson ou s’il y a eu un choc à la tête.

## Quand demander conseil
Après une chute, consultez rapidement s’il s’agit d’un nourrisson, s’il a une bosse, vomit, est somnolent, pâle ou difficile à réveiller, ou pleure de façon inhabituelle. En cas de perte de connaissance ou de convulsions, appelez immédiatement le 15 ou le 112. ${DANGER}

${END}`,
  },
  // ───────────────────────────── Babyphone, parc, trotteur ─────────────────────────────
  {
    ...BASE,
    slug: 'babyphone-ecoute-bebe-choisir-installer',
    title: 'Babyphone et écoute-bébé : bien le choisir et l’installer',
    summary: 'Normes CE ou NF, distance du lit, extinction quand il ne sert pas : les conseils de Santé publique France pour utiliser un écoute-bébé.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['babyphone', 'écoute-bébé', 'veille-bébé', 'ondes', 'radiofréquences', 'caméra bébé', 'veilleuse', 'lumière bleue', 'chambre'],
    sources: [S.santeOndes, S.santeSommeil],
    body_md: `Un écoute-bébé permet d’entendre son enfant depuis une autre pièce. Ce n’est pas un équipement indispensable, surtout les premiers mois où bébé dort dans votre chambre, mais il peut rendre service. Voici comment le choisir et l’installer.

## En bref
- Choisissez un appareil portant la norme CE ou NF, récent et adapté à l’âge de l’enfant.
- Ne le placez pas trop près de bébé : jamais dans le berceau ni dans le lit.
- Éteignez-le quand vous ne vous en servez pas.
- Il ne remplace ni la surveillance d’un adulte ni un couchage sûr.
- Évitez les veilleuses LED à lumière bleue et les écrans dans la chambre de bébé.

## Comprendre
Les écoute-bébés fonctionnent souvent par ondes radio. Santé publique France, dans le cadre des 1000 premiers jours, recommande par précaution des appareils aux normes CE ou NF, de les tenir éloignés du lit et de les éteindre lorsqu’ils ne servent pas. Les mêmes conseils s’appliquent aux jouets d’éveil radiocommandés.

Pendant au moins les six premiers mois, Santé publique France conseille d’installer le lit de bébé dans la chambre des parents : un écoute-bébé est alors surtout utile pour les siestes ou les soirées. Les modèles avec caméra ou écran ajoutent une source de lumière : la lumière bleue des écrans et des veilleuses LED peut perturber les rythmes de bébé.

Un écoute-bébé reste un outil de confort pour l’adulte. Il ne prévient pas les accidents du sommeil : ce sont les règles de couchage (sur le dos, dans son propre lit, matelas ferme, gigoteuse à la taille, rien autour du visage ni du cou) qui protègent bébé pendant qu’il dort, avec une chambre entre 18 et 20 °C, aérée et sans tabac.

## Au quotidien
- **À l’achat** : vérifiez la mention CE ou NF, la notice en français et l’âge d’usage indiqué.
- **Placement** : posez l’émetteur à distance du lit, sur un meuble stable, hors de portée de l’enfant.
- **Câbles** : fixez le fil d’alimentation hors de portée et loin du lit, pour éviter tout risque d’étranglement ou de chute de l’appareil.
- **Volume** : réglez-le pour entendre les pleurs sans réagir au moindre bruit.
- **Extinction** : éteignez l’émetteur quand vous êtes avec bébé ou quand il est réveillé.
- **Écran** : si votre modèle en a un, gardez-le de votre côté et évitez de le regarder en continu la nuit.
- **Veilleuse** : préférez une ambiance sombre la nuit ; évitez les veilleuses LED à lumière bleue.

## Questions fréquentes
**Faut-il vraiment un écoute-bébé ?** Pas forcément. Dans un petit logement ou si bébé dort dans votre chambre, il n’apporte souvent pas grand-chose. Il peut être utile dans une maison à étage.

**Les capteurs de mouvement ou de respiration associés rendent-ils le sommeil plus sûr ?** mpedia indique que les détecteurs de mouvement n’ont pas fait la preuve de leur efficacité ni de leur innocuité ; ils ne remplacent pas les règles de couchage.

**Quelle distance laisser entre l’appareil et le lit ?** Les sources consultées ne donnent pas de distance chiffrée : elles conseillent de ne pas le placer près de bébé ni dans le lit, et de suivre la notice du fabricant.

**Puis-je utiliser un vieux téléphone comme babyphone ?** Les mêmes principes s’appliquent : appareil éloigné du lit, éteint quand il ne sert pas, câble hors de portée.

## Quand demander conseil
Si vous êtes très inquiet la nuit au point de ne plus dormir, parlez-en à la sage-femme, au médecin ou à la PMI : ils peuvent vous aider à trouver des repères rassurants. En cas d’idées noires, le 3114 répond 24 h/24. Un bébé qui ne respire pas, devient bleu ou ne réagit plus nécessite d’appeler immédiatement le 15 ou le 112.

${END}`,
  },
  {
    ...BASE,
    slug: 'parc-bebe-et-trotteur-que-choisir',
    title: 'Parc à barreaux ou trotteur : que choisir quand bébé commence à bouger ?',
    summary: 'Pourquoi les pédiatres se méfient du trotteur, ce que dit la réglementation, et comment le parc et le tapis au sol aident l’enfant à se mettre debout.',
    journeys: ['newborn'],
    min_age_months: 4,
    max_age_months: 24,
    tags: ['trotteur', 'youpala', 'parc bébé', 'parc à barreaux', 'marche', 'apprendre à marcher', 'chute escalier', 'EN 1273', 'barrière de sécurité'],
    safety_critical: true,
    sources: [S.santeTrotteur, S.santeTrotteurMpedia, S.afssapsLits],
    body_md: `Quand bébé commence à se déplacer, la question d’un trotteur ou d’un parc revient souvent. Les deux objets n’ont pas du tout la même place dans les recommandations des professionnels.

## En bref
- Le **trotteur** (ou youpala) permet à l’enfant de se déplacer vite, sans freinage : les principaux accidents sont des chutes dans les escaliers, souvent avec traumatisme crânien.
- Il n’aide pas à apprendre à marcher ; les pédiatres de l’AFPA le jugent dangereux et susceptible de retarder la marche.
- Il n’est pas interdit dans l’Union européenne mais doit respecter la norme EN 1273 ; il est interdit en crèche et chez les assistantes maternelles en France.
- Le **tapis au sol** et le **parc à barreaux** sont les alternatives proposées par les pédiatres.
- Pour le parc, l’écartement des barreaux doit rester étroit (65 mm au plus selon la norme citée par l’ancienne Afssaps).

## Comprendre
Santé.fr explique qu’un trotteur peut atteindre environ 1 mètre par seconde sans moyen de freinage. Les risques : chutes dans les escaliers, chocs contre les meubles, basculement, accès à des objets dangereux ou brûlants. Une étude toulousaine citée par Santé.fr recense une majorité de traumatismes crâniens parmi les accidents de trotteur. Les psychomotriciens ajoutent que l’enfant n’y prend pas vraiment appui sur ses jambes et acquiert mal l’équilibre.

Le **parc à barreaux** permet à l’enfant, dans un espace sûr, de se hisser debout, de se tenir et de faire ses premiers pas en se tenant aux barreaux, puis de lâcher une main, puis les deux. Le **tapis d’éveil** au sol lui permet de se retourner, s’asseoir, ramper et marcher à quatre pattes : autant d’étapes qui préparent la marche.

## Au quotidien
- **Préférez le sol** : un tapis ferme, des jouets autour, un adulte à proximité.
- **Parc** : vérifiez la conformité, la stabilité, le verrouillage des côtés et l’écartement des barreaux ; pas de filet abîmé, pas de gros coussins ni de jouets qui serviraient de marchepied.
- **Escaliers** : installez des barrières de sécurité homologuées en haut et en bas.
- **Si vous utilisez malgré tout un trotteur** : surveillance permanente, loin des escaliers, des marches et de la cuisine, enfant capable de tenir assis seul, poids respecté, usage occasionnel et arrêt dès qu’il prend de la vitesse ou marche.
- **Chaussures** : mpedia met en garde contre les chaussons de naissance qui peuvent gêner le bon développement du pied ; pour les premiers pas dehors, demandez conseil au professionnel qui suit l’enfant.

## Questions fréquentes
**On m’a offert un trotteur : que faire ?** Vous pouvez choisir de ne pas l’utiliser. Si vous le faites, suivez strictement les avertissements du fabricant et les précautions ci-dessus.

**Le « pousseur » (chariot à pousser) est-il un trotteur ?** Non : l’enfant marche par lui-même en poussant un objet. Choisissez-le stable, adapté à l’âge, et utilisez-le sur un sol plat.

**Le parc ne risque-t-il pas d’enfermer l’enfant ?** Utilisé pour des moments courts, il offre un espace sûr pendant que vous êtes occupé à proximité. Le reste du temps, laissez l’enfant explorer une pièce sécurisée.

**Mon enfant ne marche pas encore à 14 mois : est-ce inquiétant ?** L’âge de la marche varie beaucoup d’un enfant à l’autre. Parlez-en au médecin lors des examens de suivi si vous avez un doute.

## Quand demander conseil
Après une chute dans un escalier ou un choc à la tête, consultez rapidement ; vomissements, somnolence, convulsions ou perte de connaissance imposent d’appeler le 15 ou le 112. Si vous vous interrogez sur le développement moteur de votre enfant, parlez-en au pédiatre ou au médecin traitant.

${END}`,
  },
  // ───────────────────────────── Biberons, sucettes ─────────────────────────────
  {
    ...BASE,
    slug: 'biberons-tetines-choisir-materiel-entretien',
    title: 'Biberons et tétines : choisir le matériel, l’entretenir et le remplacer',
    summary: 'Ce qu’il faut vérifier sur un biberon et ses tétines, le matériel utile pour les laver et sécher, et pourquoi le micro-ondes est déconseillé pour les chauffer.',
    journeys: ['pregnant', 'newborn'],
    max_age_months: 36,
    tags: ['biberon', 'tétine de biberon', 'silicone', 'caoutchouc', 'goupillon', 'égouttoir', 'chauffe-biberon', 'micro-ondes', 'stérilisateur', 'lave-vaisselle'],
    sources: [S.ansesBiberons, S.dgccrfPueri, S.santeAccidents],
    body_md: `Que vous donniez le biberon dès la naissance, en complément de l’allaitement ou plus tard, le choix du matériel soulève vite des questions : quels biberons, quelles tétines, faut-il un stérilisateur ou un chauffe-biberon ? Voici les repères issus des recommandations d’hygiène.

## En bref
- Les biberons et tétines sont des matériaux au contact des aliments : ils doivent respecter la réglementation qui s’y applique.
- Les tétines en **silicone** passent au lave-vaisselle ; celles en **caoutchouc** se lavent à la main, car la chaleur les détériore.
- La stérilisation n’est en général pas nécessaire pour un enfant en bonne santé, selon l’Afssa (aujourd’hui Anses).
- Le micro-ondes est déconseillé pour chauffer un biberon : la chaleur est inégale et peut brûler la bouche et la gorge.
- Remplacez une tétine abîmée, fendue ou collante.

## Comprendre
Les recommandations de l’Afssa reposent sur une idée simple : un biberon bien lavé et bien séché suffit pour un enfant en bonne santé. Après usage, on vide le biberon, on le rince à l’eau froide, puis on le lave au lave-vaisselle (cycle complet à 65 °C minimum, avec séchage) ou à la main avec du liquide vaisselle et un goupillon propre. L’Afssa note aussi que les stérilisateurs du commerce, les procédés chimiques et les dispositifs pour micro-ondes ne peuvent pas être qualifiés de stérilisation au sens des normes.

Réchauffer le lait n’est pas indispensable. Si vous le faites, l’Afssa recommande le bain-marie ou un chauffe-biberon, puis d’agiter le biberon et de tester quelques gouttes sur l’intérieur de l’avant-bras. Le micro-ondes est déconseillé : selon la forme du biberon, la température peut être très inégale, avec un risque de brûlures parfois graves.

## Au quotidien
- **À l’achat** : vérifiez l’âge indiqué pour la tétine, la notice, la possibilité de démonter toutes les pièces pour les laver.
- **Tétine** : choisissez celle prévue pour l’âge de votre bébé ; si la tétée au biberon semble difficile (bébé s’étouffe, s’épuise, s’agace), demandez conseil à la sage-femme, à la puéricultrice ou au pédiatre plutôt que de couper la tétine.
- **Matériel utile** : un goupillon propre, un égouttoir vertical, éventuellement un chauffe-biberon.
- **Séchage** : biberon démonté, tête en bas, à l’air libre, dans un endroit propre et sec, loin de l’évier ; pas d’essuyage au torchon.
- **Contrôle** : examinez régulièrement tétines et bagues ; jetez une tétine fissurée, déformée ou collante, et un biberon rayé ou fêlé.
- **Température** : testez toujours quelques gouttes sur l’avant-bras avant de donner le biberon.

## Questions fréquentes
**Verre ou plastique ?** Les deux existent ; l’essentiel est que le biberon soit conforme, adapté à l’âge, facile à nettoyer et en bon état. Le verre est plus lourd et peut casser ; le plastique se raye avec le temps.

**Combien de biberons prévoir ?** Cela dépend de votre organisation et du mode d’alimentation ; pour les quantités et le rythme, référez-vous au professionnel qui suit votre bébé.

**Faut-il un stérilisateur ?** Selon l’Afssa, ce n’est en général pas nécessaire pour un enfant en bonne santé. Suivez l’avis de l’équipe médicale si votre bébé est prématuré ou malade.

**Les tétines « anti-coliques » sont-elles efficaces ?** Les sources consultées ne permettent pas de l’affirmer. Si votre bébé pleure beaucoup après les repas, parlez-en au pédiatre.

## Quand demander conseil
Si votre bébé tousse, s’étouffe ou s’épuise pendant les biberons, boit très peu, vomit souvent ou prend mal du poids, consultez le pédiatre ou le médecin. En cas de brûlure de la bouche, demandez un avis médical. ${URG}

${END}`,
  },
  {
    ...BASE,
    category: 'securite',
    slug: 'sucette-attache-sucette-collier-securite',
    title: 'Sucette et attache-sucette : choisir, entretenir et éviter cordons et colliers',
    summary: 'Les points de sécurité d’une sucette et d’une attache-sucette, et pourquoi colliers, chaînettes et cordons n’ont pas leur place autour du cou de bébé.',
    journeys: ['pregnant', 'newborn', 'child'],
    max_age_months: 48,
    tags: ['sucette', 'tétine', 'attache-sucette', 'cordon', 'collier d’ambre', 'strangulation', 'étouffement', 'anneau de dentition', 'sommeil'],
    safety_critical: true,
    sources: [S.ameliCoucher, S.santeAccidents, S.santeEviter, S.dgccrfPueri],
    body_md: `Beaucoup de bébés trouvent du réconfort à téter une sucette. Choisir et entretenir cet objet du quotidien, et bien utiliser l’attache-sucette, évite deux risques : l’étouffement par une pièce qui se détache et l’étranglement par un cordon.

## En bref
- Sucettes, attache-sucettes et anneaux de dentition sont soumis à l’obligation générale de sécurité : achetez-les neufs, conformes, avec l’âge indiqué.
- Contrôlez la sucette régulièrement : remplacez-la dès qu’elle est fendue, collante, déformée ou que la tétine bouge.
- Dans le lit, ni collier, ni chaîne, ni cordelette avec sucette, rappelle ameli.
- Les colliers d’ambre n’ont pas prouvé leur efficacité contre les douleurs dentaires et exposent à un risque de strangulation.
- Ne trempez jamais la sucette dans du miel, du sucre ou toute autre substance.

## Comprendre
Une sucette abîmée peut se fendre et libérer un morceau que l’enfant risque d’avaler de travers. L’attache-sucette, pratique en promenade, devient dangereuse si elle est longue, attachée autour du cou ou laissée dans le lit pendant le sommeil. ameli demande de ne jamais laisser de collier, de chaîne ou de cordelette avec sucette lors du couchage, et mpedia de ne rien laisser autour du cou de bébé.

Santé.fr et les pédiatres de l’AFPA alertent aussi sur les colliers d’ambre, présentés comme soulageant les poussées dentaires sans preuve, et responsables d’étranglements. Boucles d’oreilles et gris-gris présentent le même type de risque.

## Au quotidien
- **À l’achat** : sucette neuve, solidement assemblée, avec l’âge indiqué et une notice ; attache-sucette courte, qui se fixe au vêtement et jamais autour du cou.
- **Contrôle** : tirez sur la tétine avant chaque utilisation ; vérifiez qu’elle n’est ni fendue ni collante.
- **Hygiène** : nettoyez-la régulièrement à l’eau et selon la notice ; prévoyez-en plusieurs pour pouvoir en changer.
- **Attache-sucette** : uniquement quand vous êtes avec l’enfant éveillé ; retirez-la avant la sieste et la nuit.
- **Jamais autour du cou** : ni ruban, ni cordon, ni collier, ni chaînette de baptême portée la nuit.
- **Dents** : pour soulager une poussée dentaire, parlez-en au pédiatre ou au pharmacien plutôt que d’utiliser un collier.
- **Rappels** : vérifiez de temps en temps RappelConso, les sucettes et attaches faisant parfois l’objet de rappels.

## Questions fréquentes
**Faut-il donner une sucette à mon bébé ?** C’est un choix personnel. Si vous allaitez, parlez-en à la sage-femme ou à la consultante en lactation, qui vous aidera à trouver le bon moment.

**Puis-je laisser la sucette pour dormir ?** Si votre enfant en a une, retirez toujours l’attache-sucette et tout cordon avant le coucher, comme le demande ameli.

**Comment savoir si la sucette est trop vieille ?** Dès qu’elle change d’aspect (fissure, trou, texture collante, déformation), remplacez-la.

**Que vérifier sur un anneau de dentition ?** Comme la sucette, il relève de l’obligation générale de sécurité : choisissez-le conforme, adapté à l’âge, en bon état, et suivez la notice pour son nettoyage et sa conservation (certains ne vont pas au congélateur).

## Quand demander conseil
Si votre enfant a avalé un morceau de sucette et tousse, respire mal ou change de couleur, appelez immédiatement le 15 ou le 112. Pour arrêter la sucette ou si elle semble gêner le langage ou les dents, parlez-en au pédiatre ou au chirurgien-dentiste.

${END}`,
  },
];
