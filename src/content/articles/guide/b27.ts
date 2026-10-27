/** Guide complet — lot 27 (27/10/2026) : vie pratique et organisation (budget bébé, liste de naissance, achats, valise et papiers de maternité, retour à la maison, coin bébé et coin change, routines, nuits à deux, aides à domicile, crédit d'impôt, congés, reprise du travail, enfant malade, modes de garde, menus, courses et repas rapides, parent solo). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». Aucune dose de médicament, aucune marque. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page (publication, mise à jour ou vérification), quand elle est indiquée.
const S = {
  // Préparer l'arrivée, aides et démarches
  monenfantPreparer: { label: 'monenfant.fr (Caf) — Préparer l’arrivée de l’enfant', url: 'https://monenfant.fr/pr%C3%A9parer-l-arriv%C3%A9e-de-l-enfant', consulted_on: C, published: '2026-10-08' },
  monenfantNaissance: { label: 'monenfant.fr (Caf) — Les informations utiles pour vos premiers mois de parent', url: 'https://monenfant.fr/web/guest/les-demarches-a-la-naissance', consulted_on: C, published: '2026-10-08' },
  monenfantModes: { label: 'monenfant.fr (Caf) — Quel mode d’accueil choisir ?', url: 'https://monenfant.fr/quel-mode-d-accueil-choisir', consulted_on: C, published: '2026-09-04' },
  cafJeunesParents: { label: 'caf.fr — Jeunes parents : la Caf vous accompagne', url: 'https://www.caf.fr/allocataires/vies-de-famille/articles/jeunes-parents-la-caf-vous-accompagne', consulted_on: C, published: '2025-10-30' },
  cafCreche: { label: 'caf.fr — Trouver une place en crèche : mode d’emploi', url: 'https://www.caf.fr/allocataires/vies-de-famille/articles/trouver-une-place-en-creche-mode-d-emploi', consulted_on: C, published: '2022-05-12' },
  cafAad: { label: 'caf.fr — Parents : tout savoir sur l’aide et l’accompagnement à domicile', url: 'https://caf.fr/allocataires/actualites/actualites-nationales/parents-tout-savoir-sur-l-aide-et-l-accompagnement-domicile', consulted_on: C, published: '2026-10-05' },
  cafAadPresse: { label: 'caf.fr — Chaque année, 40 000 familles bénéficient de l’aide et de l’accompagnement à domicile soutenus par les Caf', url: 'https://caf.fr/professionnels/presse/publications/chaque-annee-40-000-familles-beneficiaires-de-l-aide-et-de-l-accompagnement-domicile-soutenue-par', consulted_on: C, published: '2026-10-08' },
  spCmg: { label: 'Service-Public.fr — Complément de libre choix du mode de garde (CMG) « emploi direct »', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F39152', consulted_on: C, published: '2026-06-26' },
  spCredit: { label: 'Service-Public.fr — Crédit d’impôt pour l’emploi d’un salarié à domicile', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F12', consulted_on: C, published: '2026-04-15' },
  spRetractation: { label: 'Service-Public.fr — Achat à distance : droit de rétractation du consommateur', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F10485', consulted_on: C, published: '2026-01-01' },
  // Congés et travail
  spCsn: { label: 'Service-Public.fr — Entrée en vigueur du congé supplémentaire de naissance : quelles modalités pratiques ?', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18939', consulted_on: C, published: '2026-06-23' },
  spCsnFaq: { label: 'Service-Public.fr — FAQ : congé supplémentaire de naissance, les réponses à vos questions', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18982', consulted_on: C, published: '2026-07-03' },
  ameliCsn: { label: 'ameli.fr — Qu’est-ce que le congé supplémentaire de naissance ?', url: 'https://www.ameli.fr/assure/actualites/qu-est-ce-que-le-conge-supplementaire-de-naissance', consulted_on: C, published: '2026-08-27' },
  spAllaitement: { label: 'Service-Public.fr — Une salariée peut-elle allaiter pendant les heures de travail ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1769', consulted_on: C, published: '2025-08-11' },
  spTempsPartiel: { label: 'Service-Public.fr — Congé parental d’éducation à temps partiel du salarié du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2332', consulted_on: C, published: '2026-06-01' },
  spEnfantMalade: { label: 'Service-Public.fr — Congé pour enfant malade du salarié du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F151', consulted_on: C, published: '2026-03-27' },
  spPresenceParentale: { label: 'Service-Public.fr — Congé de présence parentale du salarié du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1631', consulted_on: C, published: '2026-06-15' },
  // Maternité et retour à la maison
  ameliAccouchement: { label: 'ameli.fr — Accouchement et retour à domicile : prise en charge et accompagnement', url: 'https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/accouchement-retour-domicile', consulted_on: C, published: '2026-07-24' },
  ameliRetour: { label: 'ameli.fr — Après l’accouchement : le retour à la maison', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-domicile', consulted_on: C, published: '2026-08-27' },
  mpediaValise: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Valise pour la maternité : être prête pour l’accouchement', url: 'https://www.mpedia.fr/art-kit-de-naissance-trousseau-de-bebe/', consulted_on: C, published: '2020-04-07' },
  // Sommeil, soins, sécurité
  ameliCoucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
  ameliSommeilEnfant: { label: 'ameli.fr — Une bonne hygiène de vie pour que mon enfant dorme bien', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/hygiene-vie-bon-sommeil-enfant', consulted_on: C, published: '2026-03-12' },
  santeSommeil: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Le sommeil de bébé', url: 'https://www.sante.fr/le-sommeil-de-bebe-0', consulted_on: C, published: '2026-07-06' },
  santeHygiene: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — L’hygiène corporelle de bébé', url: 'https://www.sante.fr/lhygiene-corporelle-de-bebe', consulted_on: C, published: '2025-06-10' },
  santeAccidents: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  dgccrfPuericulture: { label: 'economie.gouv.fr (DGCCRF) — Articles de puériculture : les clés pour choisir des produits sûrs', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/articles-de-puericulture-les-cles-pour-choisir-des-produits-surs', consulted_on: C, published: '2026-04-28' },
  // Entourage, santé mentale, parent solo
  santeEntourage: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Le rôle de l’entourage des parents', url: 'https://www.sante.fr/le-role-de-lentourage-des-parents', consulted_on: C, published: '2024-08-26' },
  santeMentaleParents: { label: 'Santé.fr (Psycom) — La santé mentale des parents', url: 'https://www.sante.fr/la-sante-mentale-des-parents', consulted_on: C, published: '2025-08-04' },
  mpediaSolos: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Parents solos : conseils et astuces pour assurer au quotidien', url: 'https://www.mpedia.fr/art-parents-solos-conseils/', consulted_on: C, published: '2022-04-20' },
  // Repas et courses
  spf50astuces: { label: 'Santé publique France / Manger Bouger — 50 petites astuces pour manger mieux et bouger plus (brochure)', url: 'https://www.santepubliquefrance.fr/sites/default/files/cadic_files/documents/spf00006444.pdf', consulted_on: C },
  ameliRepas: { label: 'ameli.fr — Alimentation de l’adulte : des repas équilibrés au fil de la semaine', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-adulte/alimentation-adulte-equilibre-repas', consulted_on: C, published: '2026-03-10' },
} satisfies Record<string, ArticleSource>;

const P: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['pregnant'], status: 'to_review' };
const PN: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['pregnant', 'newborn'], status: 'to_review' };
const N: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['newborn'], status: 'to_review' };
const NS: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['newborn', 'parents_sleep'], status: 'to_review' };
const NC: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['newborn', 'child'], status: 'to_review' };
const PNC: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['pregnant', 'newborn', 'child'], status: 'to_review' };
const CH: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['child'], status: 'to_review' };

const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel (médecin, sage-femme, puéricultrice de PMI).';
const FIN_DROITS = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel : votre Caf, votre caisse d’Assurance Maladie, votre employeur ou Service-Public.fr restent les références pour votre situation précise.';

export const GUIDE_B27: LibArticle[] = [
  {
    ...PN, slug: 'budget-bebe-anticiper-depenses-premiere-annee', category: 'vie-pratique',
    title: 'Budget bébé : anticiper les dépenses de la première année sans tout acheter d’avance',
    summary: 'Les grands postes de dépenses liés à l’arrivée d’un enfant, les aides à connaître et des idées concrètes pour étaler les achats et garder la maîtrise de votre budget.',
    tags: ['budget bébé', 'coût d’un bébé', 'dépenses naissance', 'économiser', 'équipement bébé', 'aides Caf', 'prime à la naissance', 'mode de garde coût', 'simulateur'],
    sources: [S.monenfantPreparer, S.cafJeunesParents, S.dgccrfPuericulture],
    body_md: `## En bref
- Le site monenfant.fr de la Caf rappelle qu’il est inutile de tout acheter avant la naissance : un lit, un siège auto et un espace pour le change suffisent pour commencer, le reste se complète selon les besoins.
- Le poste le plus lourd sur la durée est souvent le **mode de garde** : son coût dépend du mode choisi, de vos ressources et de votre situation familiale. Des simulateurs officiels permettent de l’estimer.
- Plusieurs aides de la Caf peuvent alléger le budget, sous conditions : prime à la naissance, allocation de base, complément de libre choix du mode de garde (CMG), PreParE.
- Le matériel d’occasion ou prêté peut aider, à condition de vérifier son état, sa notice et ses dispositifs de sécurité.

## Comprendre
L’arrivée d’un enfant modifie le budget du foyer de plusieurs façons : des achats ponctuels (équipement), des dépenses régulières (vêtements, couches, alimentation, produits d’hygiène), parfois une baisse temporaire de revenus pendant les congés, puis le coût de la garde au moment de la reprise du travail.

Plutôt que de chercher un montant « type », qui varie énormément d’une famille à l’autre, il est plus utile de lister **vos** postes, de repérer ceux qui reviennent chaque mois, et d’identifier les aides auxquelles vous pouvez prétendre. Les montants des aides changent chaque année au 1er avril : fiez-vous toujours aux simulateurs de caf.fr et de monenfant.fr plutôt qu’à un chiffre lu ailleurs.

## Au quotidien
- **Faites un tableau simple en trois colonnes** : « indispensable avant la naissance », « utile dans les premiers mois », « plus tard ». Placez dans la première colonne le lit, le siège auto et le nécessaire pour le change, comme le suggère monenfant.fr.
- **Estimez tôt le coût de la garde.** Pendant la grossesse, utilisez sur monenfant.fr l’estimation du coût d’une place en crèche et la simulation du CMG pour une assistante maternelle ou une garde à domicile. Comparer plusieurs scénarios aide à choisir et à anticiper.
- **Repérez les aides dès la grossesse.** La prime à la naissance, sous conditions de ressources, est versée au cours du 7e mois. L’allocation de base peut ensuite être versée chaque mois, sous conditions, jusqu’aux 3 ans de l’enfant.
- **Étalez les achats.** Les vêtements par exemple : bébé grandit vite, et prévoir quelques tailles différentes vaut mieux qu’un stock d’une seule taille.
- **Occasion et prêts : vérifiez avant d’accepter.** La DGCCRF rappelle qu’un article d’occasion peut ne pas tenir compte des normes récentes, arriver sans notice et avoir des pièces de sécurité usées. Contrôlez freins, harnais, verrouillages, et demandez la notice ou cherchez-la en ligne.
- **Gardez une petite réserve** pour les imprévus des premiers mois (un article à remplacer, une taille de vêtements qui arrive plus vite que prévu).

## Questions fréquentes
**Faut-il acheter tout le matériel avant l’accouchement ?**
Non. monenfant.fr conseille de prévoir l’équipement de base, puis de compléter progressivement selon les besoins réels de l’enfant. Beaucoup d’articles ne servent qu’à partir de quelques mois.

**Comment connaître les aides auxquelles nous avons droit ?**
Les simulateurs de caf.fr et de monenfant.fr donnent une estimation selon vos ressources et votre situation. Vous pouvez aussi contacter votre Caf par téléphone, sur place ou par courriel.

**Le matériel prêté par des proches est-il une bonne idée ?**
Il peut l’être, si l’article est complet, en bon état et adapté à l’âge et au poids de l’enfant. Vérifiez qu’il porte le nom du fabricant et la référence du modèle, et consultez le site RappelConso pour savoir s’il a fait l’objet d’un rappel.

**Comment réduire les dépenses de garde ?**
Le CMG peut prendre en charge une partie des frais pour une assistante maternelle, une garde à domicile ou une micro-crèche, sous conditions. Un relais petite enfance (RPE) peut vous aider à comparer les solutions près de chez vous.

## Quand demander conseil
Si votre budget vous inquiète ou si vous rencontrez des difficultés financières, contactez votre Caf ou le centre communal d’action sociale (CCAS) de votre mairie : un travailleur social peut faire le point avec vous. Si ces soucis pèsent lourdement sur votre moral au point de vous sentir dépassé, parlez-en à votre médecin ou à votre sage-femme ; en cas d’idées noires, appelez le **3114**, à toute heure.

${FIN_DROITS}`,
  },
  {
    ...PN, slug: 'aides-caf-arrivee-bebe-calendrier-des-demarches', category: 'droits-demarches',
    title: 'Aides de la Caf à l’arrivée de bébé : le calendrier des démarches, de la grossesse aux premiers mois',
    summary: 'Prime à la naissance, allocation de base, PreParE, CMG : à quel moment chaque aide intervient, à qui la demander et comment ne rien oublier.',
    tags: ['Caf', 'Paje', 'prime à la naissance', 'allocation de base', 'PreParE', 'CMG', 'démarches naissance', 'déclarer naissance Caf', 'calendrier démarches'],
    sources: [S.cafJeunesParents, S.monenfantNaissance, S.spCmg],
    body_md: `## En bref
- La prestation d’accueil du jeune enfant (Paje) regroupe plusieurs aides de la Caf, toutes **sous conditions** : prime à la naissance, allocation de base, PreParE et complément de libre choix du mode de garde (CMG).
- La prime à la naissance est versée au cours du **7e mois de grossesse**, sous conditions de ressources.
- Après la naissance, il faut informer la Caf, la caisse d’Assurance Maladie et votre complémentaire santé, après la déclaration de naissance en mairie dans les 5 jours.
- Le CMG se demande à la Caf (ou à la MSA), puis se gère chaque mois via Pajemploi si vous employez directement une assistante maternelle ou une garde à domicile.

## Comprendre
Ces aides n’arrivent pas toutes au même moment et ne se demandent pas toutes de la même façon. Les avoir en tête sous forme de calendrier évite d’en oublier une et aide à prévoir le budget.

**La prime à la naissance** aide à faire face aux premières dépenses. Elle est versée au cours du 7e mois de grossesse, sous conditions de ressources, et pour chaque enfant en cas de naissances multiples.

**L’allocation de base** est versée chaque mois, sous conditions de ressources, à partir du mois qui suit la naissance et jusqu’aux 3 ans de l’enfant. Elle existe à taux plein ou partiel selon les revenus.

**La PreParE** (prestation partagée d’éducation de l’enfant) concerne le parent qui cesse ou réduit son activité pour s’occuper de son enfant. Elle est accessible dès le premier enfant, à condition notamment de justifier de huit trimestres de cotisations vieillesse.

**Le CMG** prend en charge une partie des frais de garde (assistante maternelle, garde à domicile, association ou entreprise de garde à domicile, micro-crèche). Pour l’emploi direct, il concerne en général les enfants de moins de 6 ans, et jusqu’à 12 ans pour un parent isolé.

## Au quotidien
- **Pendant la grossesse** : vérifiez que votre dossier Caf est à jour (adresse, situation familiale, ressources). Si vous n’êtes pas allocataire, créez votre compte. Faites une simulation sur caf.fr.
- **Au 7e mois** : surveillez le versement de la prime à la naissance si vous y avez droit. En cas de doute, contactez votre Caf.
- **Dans les 5 jours après la naissance** : déclarez la naissance à la mairie. Ensuite, informez la Caf, votre caisse d’Assurance Maladie et votre complémentaire santé.
- **Avant la reprise du travail** : si vous employez une assistante maternelle ou une garde à domicile, faites la demande de CMG auprès de la Caf et inscrivez-vous comme employeur sur Pajemploi.
- **Si vous réduisez ou arrêtez votre activité** : renseignez-vous sur la PreParE et sur le congé parental auprès de votre employeur.
- **Tout au long** : signalez rapidement à la Caf tout changement (naissance, séparation, mise en couple, chômage, déménagement).

## Questions fréquentes
**Les montants sont-ils les mêmes chaque année ?**
Non, ils sont revalorisés chaque année au 1er avril. Consultez caf.fr pour connaître les montants en vigueur et faites une simulation avec votre situation.

**Le CMG est-il versé automatiquement ?**
Non. La première demande se fait auprès de la Caf ou de la MSA. Ensuite, vous déclarez chaque mois la rémunération de votre salarié sur Pajemploi, qui calcule et verse le CMG puis indique ce qui reste à votre charge.

**Peut-on cumuler plusieurs aides ?**
Certaines se cumulent, d’autres non, ou seulement dans certains cas. Par exemple, la PreParE est cumulable avec le CMG en cas de travail à temps partiel. Votre Caf est la meilleure source pour votre situation.

**Où trouver un accompagnement pour comprendre tout cela ?**
monenfant.fr présente les démarches et les aides, et propose de contacter un relais petite enfance (RPE) pour les questions sur la garde. Les lieux d’accueil enfants-parents (LAEP) et les maisons des 1000 premiers jours sont aussi des lieux d’écoute et d’orientation.

## Quand demander conseil
Contactez votre Caf si un versement attendu n’arrive pas, si votre situation change ou si vous ne savez pas quelle aide demander. Si la période vous épuise ou vous angoisse, parlez-en à votre sage-femme, à votre médecin ou à la PMI ; en cas d’idées suicidaires, appelez le **3114**.

${FIN_DROITS}`,
  },
  {
    ...P, slug: 'liste-de-naissance-essentiel-securite-bien-choisir', category: 'materiel',
    title: 'Liste de naissance : l’essentiel, le superflu et les critères de sécurité',
    summary: 'Comment construire une liste de naissance utile, par ordre de priorité, et quels repères de sécurité vérifier pour chaque article proposé par vos proches.',
    tags: ['liste de naissance', 'cadeaux naissance', 'équipement bébé', 'indispensable bébé', 'puériculture', 'normes', 'marquage CE', 'NF', 'occasion'],
    min_week: 12, max_week: 40,
    sources: [S.monenfantPreparer, S.dgccrfPuericulture, S.santeSommeil],
    body_md: `## En bref
- Une liste de naissance permet à vos proches d’offrir des choses vraiment utiles et d’éviter les doublons.
- Commencez par l’équipement de base cité par monenfant.fr : un lit, un siège auto et un espace pour le change. Le reste peut venir progressivement.
- Pour chaque article de puériculture, la DGCCRF conseille de vérifier les informations obligatoires : fabricant, modèle, consignes en français, âge et poids maximum d’utilisation.
- Le lit de bébé doit porter le marquage CE ou NF, avec un matelas ferme et adapté à ses dimensions.

## Comprendre
On reçoit souvent beaucoup de vêtements de naissance et de peluches, et moins d’objets réellement utiles. Une liste organisée par priorité oriente vos proches sans rien leur imposer.

Le sommeil est un bon point de départ. Santé.fr rappelle que bébé dort dans son propre lit dès la naissance, sur le dos, sans oreiller, couverture, couette, tour de lit ni peluche. Inutile donc de mettre sur la liste une parure de lit avec couette ou un tour de lit : une **turbulette** à la bonne taille et des draps-housses adaptés au matelas sont plus utiles.

La DGCCRF rappelle qu’un article de puériculture est présumé conforme s’il respecte une norme publiée ou dispose d’une attestation d’examen de type. Les sièges auto relèvent, eux, de règles de sécurité routière spécifiques.

## Au quotidien
**Organisez votre liste en trois niveaux :**
- **Priorité 1, avant la naissance** : lit avec matelas adapté, draps-housses, turbulettes, siège auto adapté au poids de bébé, nécessaire pour le change, quelques vêtements de tailles différentes.
- **Priorité 2, premiers mois** : moyen de transport (poussette ou porte-bébé), tapis d’éveil, linges et bavoirs, thermomètre de bain.
- **Priorité 3, plus tard** : chaise haute, barrières de sécurité, cache-prises, matériel pour les repas.

**Pour chaque article, vérifiez :**
- l’âge, la taille et le poids indiqués, et l’usage prévu ;
- la présence du nom du fabricant, du modèle et des consignes en français ;
- l’avertissement « Ne pas laisser l’enfant sans surveillance » quand il est exigé ;
- pour le lit, le marquage CE ou NF ;
- la possibilité de laver les textiles.

**Idées pour une liste plus utile** : participation à un gros article, abonnement de couches, repas préparés pour les premières semaines, heures de baby-sitting ou de ménage offertes, livres pour bébé. Vous pouvez indiquer ce que vous avez déjà pour éviter les doublons.

**Après la naissance** : aérez le lit neuf avant l’arrivée de bébé, comme le conseille Santé.fr, et lavez les textiles neufs avant la première utilisation.

## Questions fréquentes
**Peut-on demander du matériel d’occasion ?**
Oui, mais la DGCCRF rappelle qu’un article d’occasion peut être moins sûr qu’un modèle récent, arriver sans notice et présenter des pièces de sécurité usées. Vérifiez son fonctionnement et consultez RappelConso.

**Faut-il un tour de lit ou un cale-bébé ?**
Non. Santé.fr recommande de coucher bébé sur le dos, à plat, dans un lit dégagé : sans oreiller, coussin, couverture, tour de lit ni doudou à proximité.

**Le babyphone est-il indispensable ?**
Il dépend de votre logement. S’il vous est utile, choisissez un appareil aux normes CE ou NF, placez-le loin de bébé, jamais dans le lit, et éteignez-le quand vous ne vous en servez pas.

**Comment dire non à un cadeau inadapté sans vexer ?**
Remerciez pour l’intention, expliquez simplement les recommandations de couchage, et proposez un échange ou une autre idée de la liste.

## Quand demander conseil
En cas de doute sur la sécurité d’un article (lit, transat, porte-bébé, siège auto), demandez conseil à la sage-femme, à la puéricultrice de PMI ou au vendeur, et consultez la notice. Si un enfant s’est blessé avec un produit, appelez le **15** ou le **112** en cas d’urgence, puis signalez le problème sur SignalConso.

${FIN}`,
  },
  {
    ...PN, slug: 'acheter-materiel-bebe-en-ligne-retractation-rappels', category: 'materiel',
    title: 'Acheter le matériel de bébé en ligne : droit de rétractation, notices et rappels de produits',
    summary: 'Ce que dit le droit pour un achat à distance, les exceptions à connaître pour les articles d’hygiène, et les réflexes à prendre à la réception d’un article de puériculture.',
    tags: ['achat en ligne', 'droit de rétractation', '14 jours', 'retour colis', 'puériculture', 'notice', 'RappelConso', 'SignalConso', 'vente à distance'],
    sources: [S.spRetractation, S.dgccrfPuericulture],
    body_md: `## En bref
- Pour un achat en ligne, par téléphone ou par correspondance, vous disposez en principe d’un délai de rétractation d’au moins **14 jours**, à partir du lendemain de la réception du bien.
- Certains produits en sont exclus, notamment les biens ouverts qui ne peuvent pas être renvoyés pour des raisons d’hygiène, et les biens personnalisés.
- Pour se rétracter, il faut **le dire au vendeur** par écrit (formulaire ou message) avant la fin du délai : renvoyer le colis sans rien dire ne suffit pas.
- À la réception d’un article de puériculture, vérifiez la présence des consignes de sécurité en français, de l’âge et du poids maximum, et conservez la notice.

## Comprendre
Acheter en ligne est pratique quand on attend un enfant ou qu’on sort peu avec un nouveau-né. Le droit de rétractation permet de changer d’avis sans justification, mais il a ses règles.

**Le délai** est de 14 jours calendaires minimum, y compris pour les produits soldés, d’occasion ou déstockés vendus par un professionnel. Pour plusieurs articles d’une même commande, il court à partir du lendemain de la réception du dernier. S’il se termine un week-end ou un jour férié, il est reporté au premier jour ouvrable suivant. Si le vendeur ne vous a pas informé de ce droit, le délai peut être prolongé de 12 mois.

**Les frais de retour** sont en principe à votre charge, sauf si le vendeur les prend en charge ou ne vous en a pas informé. Le vendeur doit vous rembourser dans les 14 jours suivant votre décision, frais de livraison initiaux compris, mais il peut attendre de récupérer le produit ou la preuve de son expédition.

**Côté sécurité**, la DGCCRF rappelle que les articles de puériculture doivent indiquer le fabricant ou l’importateur, le modèle, et les informations de sécurité en français.

## Au quotidien
- **Avant de commander**, lisez les conditions de retour et repérez les articles qui ne pourront pas être retournés une fois ouverts (articles d’hygiène, par exemple).
- **À la réception**, ouvrez le colis rapidement, sans retirer les protections d’hygiène si vous hésitez, et vérifiez : article complet, notice en français, âge et poids d’utilisation, état des pièces de sécurité.
- **Si vous changez d’avis**, envoyez le formulaire type ou un message clair au vendeur, puis renvoyez le produit. Gardez une preuve de la date d’envoi : en cas de litige, c’est à vous de prouver que le délai a été respecté.
- **Rangez les notices** dans une pochette dédiée : elles serviront pour le montage, l’entretien et pour retrouver le modèle en cas de rappel.
- **Consultez RappelConso** de temps en temps, ou lorsque vous recevez un article prêté ou acheté d’occasion.
- **Ne modifiez jamais** un article de puériculture et respectez scrupuleusement les conditions d’utilisation du fabricant.

## Questions fréquentes
**Le droit de rétractation s’applique-t-il entre particuliers ?**
Il concerne les achats auprès d’un professionnel. Pour un achat entre particuliers, renseignez-vous sur les conditions de la plateforme utilisée avant de payer.

**Le vendeur peut-il me rembourser en avoir ?**
Le remboursement se fait par le même moyen de paiement, sauf accord de votre part. Un avoir n’est possible que si vous l’acceptez expressément ou si l’achat a été fait ainsi.

**Que faire si le remboursement tarde ?**
Vous pouvez adresser une mise en demeure au vendeur ; un modèle est proposé sur Service-Public.fr. Pour une question, RéponseConso (DGCCRF) peut être contacté.

**Un article reçu me semble dangereux : que faire ?**
Ne l’utilisez pas, contactez le vendeur et signalez le problème sur SignalConso. Vérifiez aussi s’il figure sur RappelConso.

## Quand demander conseil
En cas de litige, rapprochez-vous d’une association de consommateurs ou de RéponseConso. Si un enfant a été blessé ou a avalé une pièce d’un produit, appelez immédiatement le **15** ou le **112**.

${FIN_DROITS}`,
  },
  {
    ...P, slug: 'valise-maternite-trousseau-bebe-quand-la-preparer', category: 'vie-pratique',
    title: 'Valise de maternité : le trousseau de bébé, vos affaires et quand la préparer',
    summary: 'Une liste pratique pour la valise de maternité, à adapter à la liste fournie par votre établissement, avec des conseils pour choisir les vêtements de bébé.',
    tags: ['valise maternité', 'trousseau bébé', 'sac maternité', 'que mettre dans la valise', 'vêtements naissance', 'siège auto sortie maternité', 'préparer accouchement'],
    min_week: 28, max_week: 42,
    sources: [S.mpediaValise, S.ameliAccouchement, S.santeSommeil],
    body_md: `## En bref
- Préparez la valise **à l’avance**, pour partir sereinement le moment venu.
- Demandez d’abord **la liste de votre maternité** : les établissements ne fournissent pas tous les mêmes choses (couches, draps, linge).
- Pour bébé : bodies en coton, brassières ou gilets, pyjamas, chaussettes, turbulette ou surpyjama, langes, bavoirs, couches taille naissance si elles ne sont pas fournies, une tenue chaude pour la sortie selon la saison.
- Prévoyez le **siège auto** adapté (ou couffin ou porte-bébé selon votre moyen de transport) pour le retour, ainsi que votre carte Vitale et les documents de suivi.

## Comprendre
Il n’existe pas de liste universelle. Chaque maternité a ses habitudes, et le contenu dépend aussi de la saison et de la durée prévue du séjour. mpedia, le site de l’Association française de pédiatrie ambulatoire, conseille de partir de la liste de l’établissement et de préparer la valise en avance.

Pour les vêtements, le poids de naissance n’est pas connu à l’avance : mieux vaut prévoir **des tailles différentes**, de la naissance à 1 mois. Les vêtements simples, à boutons-pression, sont plus faciles à enfiler que ceux qui passent par la tête. Lavez les vêtements neufs avant de les utiliser.

Pour la nuit, Santé.fr rappelle que bébé dort sans couverture ni couette : une turbulette ou un surpyjama à sa taille remplace la couverture.

## Au quotidien
**Pour bébé** (à adapter à la liste de la maternité) :
- bodies en coton, de forme croisée, de plusieurs tailles ;
- brassières ou gilets ;
- plusieurs pyjamas ;
- chaussons et chaussettes ;
- une turbulette ou un surpyjama à la bonne taille ;
- quelques langes pour les petites régurgitations et des bavoirs ;
- couches taille nouveau-né si la maternité n’en fournit pas ;
- une petite brosse à cheveux ;
- une tenue chaude pour la sortie (combinaison ou nid d’ange selon la saison) ;
- draps et alèse pour le berceau, s’ils ne sont pas fournis.

**Pour vous** : vêtements confortables, de quoi dormir, affaires de toilette, chaussons, serviettes, protections adaptées et sous-vêtements selon les conseils de la maternité, et, si vous souhaitez allaiter, des vêtements pratiques pour les tétées. Ajoutez chargeur de téléphone, une bouteille d’eau et de quoi vous occuper.

**Les papiers** : carte Vitale à jour, carte de complémentaire santé, pièce d’identité, dossier de suivi de grossesse et résultats d’examens, et tout document demandé par la maternité. Si vous avez fait une reconnaissance anticipée, emportez-en une copie.

**Pour le retour** : le siège auto installé à l’avance dans la voiture, ou le couffin ou le porte-bébé selon votre mode de transport.

**Astuce d’organisation** : préparez deux sacs, un petit pour la salle de naissance et un plus grand pour le séjour, et laissez une liste visible pour la personne qui pourrait devoir apporter des affaires en plus.

## Questions fréquentes
**À partir de quand préparer la valise ?**
Il n’y a pas de date officielle. L’essentiel est qu’elle soit prête à l’avance, surtout si vous habitez loin de la maternité ou si un départ rapide est possible. Demandez l’avis de votre sage-femme.

**Les couches et le linge sont-ils fournis par la maternité ?**
Cela dépend des établissements : certains fournissent couches, draps ou taies, d’autres non. C’est pourquoi mpedia conseille de demander la liste du trousseau à votre maternité avant de préparer la valise.

**Peut-on rentrer en taxi ou à pied avec bébé ?**
Le transport doit être adapté : siège auto installé selon la notice en voiture, couffin ou porte-bébé sinon. Renseignez-vous à l’avance sur les possibilités selon votre trajet.

## Quand demander conseil
Appelez la maternité ou partez sans attendre en cas de perte de liquide, de saignements, de contractions régulières selon les consignes reçues, de fièvre, ou si vous sentez moins bouger votre bébé. En cas d’urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...P, slug: 'sejour-maternite-papiers-carte-vitale-frais-a-prevoir', category: 'droits-demarches',
    title: 'Séjour à la maternité : papiers, carte Vitale, mutuelle et frais à prévoir',
    summary: 'Ce qui est pris en charge pendant l’accouchement et le séjour, ce qui reste à votre charge (chambre particulière, dépassements) et les démarches à faire avant le jour J.',
    tags: ['frais maternité', 'chambre particulière', 'mutuelle maternité', 'carte Vitale', 'clinique conventionnée', 'remboursement accouchement', 'complémentaire santé solidaire', 'forfait hospitalier'],
    min_week: 20, max_week: 42,
    sources: [S.ameliAccouchement],
    body_md: `## En bref
- À l’hôpital ou en clinique conventionnée, l’accouchement, la péridurale et les frais de séjour sont pris en charge à **100 %** dans la limite des tarifs de l’Assurance Maladie, pour un séjour plafonné à 12 jours.
- Les **frais de confort** (chambre particulière, télévision…) et les **dépassements d’honoraires** ne sont jamais remboursés par l’Assurance Maladie. Votre complémentaire santé peut les couvrir selon votre contrat.
- En clinique non conventionnée, les tarifs sont souvent plus élevés et le reste à charge peut être important.
- Mettez votre carte Vitale à jour après la déclaration de grossesse et pensez à interroger votre mutuelle avant l’accouchement.

## Comprendre
Selon l’Assurance Maladie, à l’hôpital ou dans une clinique conventionnée, vous n’avez en principe rien à payer pour l’accouchement et le séjour, sauf les dépassements d’honoraires et les frais de confort. L’établissement est remboursé directement. Le forfait hospitalier est entièrement couvert du 1er jour du 6e mois de grossesse au 12e jour après l’accouchement.

Dans une clinique **non conventionnée**, les mêmes actes sont remboursés à 100 % sur la base des tarifs de l’Assurance Maladie, mais les prix pratiqués sont généralement plus élevés : vous devez avancer les frais et le reste à charge peut être important. Pour savoir si un établissement est conventionné, contactez votre caisse.

Le transport vers la maternité, en ambulance ou autre, peut être pris en charge s’il est prescrit par un médecin.

## Au quotidien
**Pendant la grossesse :**
- **Mettez à jour votre carte Vitale** après la prise en compte de votre grossesse (en pharmacie, en quelques minutes), puis au moins une fois par an.
- **Appelez votre complémentaire santé** pour savoir ce qu’elle rembourse : chambre particulière (par nuit et dans quelle limite), dépassements d’honoraires, éventuels services à la naissance. Demandez une réponse écrite.
- **Renseignez-vous auprès de la maternité** sur le tarif de la chambre particulière et sur la présence éventuelle de dépassements d’honoraires.
- **Si vous n’avez pas de complémentaire ou si vos ressources sont modestes**, vous pouvez demander la Complémentaire santé solidaire ; un simulateur est disponible sur mesdroitssociaux.gouv.fr.

**À préparer dans la valise :** carte Vitale, carte de complémentaire santé, pièce d’identité, dossier de suivi, et les documents demandés par l’établissement.

**Après la naissance :**
- Déclarez la naissance à la mairie dans les 5 jours.
- Déclarez ensuite l’enfant à votre caisse via votre compte ameli : il sera inscrit sur votre carte Vitale. Vous pouvez aussi l’inscrire sur celle de l’autre parent, quelle que soit votre situation familiale. Sans compte ameli, appelez le 36 46 ou envoyez le formulaire 3705 avec une copie de l’acte de naissance ou du livret de famille.
- Informez votre complémentaire santé pour que l’enfant soit couvert.

## Questions fréquentes
**La chambre particulière est-elle remboursée ?**
Pas par l’Assurance Maladie : c’est un frais de confort. Selon votre contrat, votre complémentaire peut la prendre en charge en tout ou partie.

**Faut-il avancer des frais pendant le séjour ?**
À l’hôpital ou en clinique conventionnée, en principe non, sauf dépassements et frais de confort. En clinique non conventionnée, vous devez avancer les frais.

**Pourquoi inscrire l’enfant sur les deux cartes Vitale ?**
Cela permet au parent qui accompagne l’enfant chez un professionnel de santé d’être remboursé directement, sans feuille de soins papier.

**Le tiers payant supprime-t-il toute dépense ?**
Pour les soins couverts à 100 % au titre de la maternité, vous n’avancez rien, mais les dépassements d’honoraires restent à votre charge, et la participation forfaitaire et les franchises restent dues.

## Quand demander conseil
Pour une question sur vos droits, contactez votre caisse d’Assurance Maladie (36 46) ou votre complémentaire santé. Pour toute inquiétude médicale pendant la grossesse (saignements, pertes de liquide, douleurs inhabituelles, fièvre, bébé qui bouge moins), contactez la maternité ; en cas d’urgence, appelez le **15** ou le **112**.

${FIN_DROITS}`,
  },
  {
    ...P, slug: 'preparer-retour-maison-pendant-grossesse-check-list', category: 'vie-pratique',
    title: 'Préparer le retour à la maison dès la grossesse : la check-list des derniers mois',
    summary: 'Sage-femme à contacter, sortie précoce et Prado, repas d’avance, entourage, logement : ce qui peut s’organiser avant l’accouchement pour des premiers jours plus sereins.',
    tags: ['retour maternité', 'préparer arrivée bébé', 'sage-femme à domicile', 'Prado', 'sortie précoce', 'organisation post-partum', 'check-list naissance', 'repas congelés'],
    min_week: 24, max_week: 42,
    sources: [S.ameliAccouchement, S.ameliRetour, S.santeEntourage],
    body_md: `## En bref
- Après un séjour standard à la maternité, c’est à vous d’**organiser le suivi à domicile** avant de partir : l’Assurance Maladie recommande de contacter une sage-femme dès le lendemain de la naissance.
- La sage-femme peut vous suivre à domicile jusqu’au **12e jour** de l’enfant, avec une prise en charge à 100 % (part Assurance Maladie).
- En cas de sortie précoce, proposée par l’équipe et jamais obligatoire, un conseiller de l’Assurance Maladie peut organiser le service **Prado** à la maternité.
- Repérer dès maintenant les personnes de votre entourage qui pourront aider (repas, ménage, aînés) allège beaucoup les premières semaines.

## Comprendre
Les premiers jours à la maison sont souvent intenses : fatigue de l’accouchement, tétées ou biberons fréquents, nuits courtes, visites. Une partie de l’organisation peut être pensée pendant la grossesse, quand vous avez un peu plus de disponibilité.

**Le suivi par une sage-femme.** Elle aide pour les premiers soins (cordon), vérifie l’état de bébé (alimentation, transit, éveil), conseille sur l’allaitement et l’organisation familiale, et peut parler avec vous du vécu de l’accouchement. Vous pouvez la choisir dans l’annuaire santé d’ameli ou demander la liste proposée par la maternité.

**La sortie précoce** concerne un retour dans les 72 heures après un accouchement par voie basse, ou 96 heures après une césarienne. La première visite de la sage-femme doit alors avoir lieu dans les 24 heures suivant le retour. Vous pouvez revenir sur votre choix jusqu’au dernier moment.

**L’entourage.** Santé.fr (1000 premiers jours) conseille d’identifier les personnes à l’écoute, celles qui peuvent donner un coup de main et celles qui encouragent, pour les solliciter en renfort au moment voulu.

## Au quotidien
**Côté suivi :**
- Repérez une ou deux sages-femmes libérales près de chez vous et notez leurs coordonnées.
- Notez les numéros utiles sur une fiche visible : maternité, sage-femme, médecin traitant, PMI, 15.

**Côté maison :**
- Cuisinez en double pendant les dernières semaines et congelez des portions (soupes, plats mijotés).
- Faites un stock de produits de base et de produits d’entretien pour limiter les courses au retour.
- Installez le lit de bébé dans votre chambre et un coin change avec tout à portée de main.
- Installez le siège auto dans la voiture en suivant la notice.

**Côté entourage :**
- Faites la liste de ce que d’autres peuvent prendre en charge : courses, repas, linge, garde des aînés, promener le chien.
- Mettez-vous d’accord à deux sur les visites : quand, combien de temps, et qui annonce la nouvelle.

**Côté démarches :** préparez ce qu’il faut pour la déclaration de naissance en mairie, à faire dans les 5 jours, et vérifiez que votre carte Vitale est à jour.

## Questions fréquentes
**La sage-femme vient-elle automatiquement à la maison ?**
Pas toujours. Après un séjour standard, c’est à vous de prendre contact. En cas de sortie précoce avec Prado, le conseiller de l’Assurance Maladie organise le premier rendez-vous avec la sage-femme de votre choix.

**Que se passe-t-il après le 12e jour ?**
Selon l’Assurance Maladie, deux séances de suivi postnatal sont possibles entre le 8e jour et la 14e semaine. Un entretien postnatal précoce et une consultation postnatale sont ensuite prévus dans les deux premiers mois environ ; la maternité ou la sage-femme vous indiquera le calendrier.

**Et si nous n’avons pas d’entourage proche ?**
La Caf peut, selon votre situation, cofinancer une aide à domicile. La PMI et les associations de parents sont aussi des appuis. Parlez-en pendant la grossesse avec votre sage-femme.

## Quand demander conseil
Après la naissance, contactez rapidement la sage-femme ou la maternité si vous avez de la fièvre, des saignements abondants, une douleur importante, ou si bébé mange peu, est très somnolent ou vous inquiète. En cas d’urgence, appelez le **15** ou le **112**. Si vous vous sentez très mal moralement, parlez-en sans attendre ; en cas d’idées suicidaires, appelez le **3114**.

${FIN}`,
  },
  {
    ...NS, slug: 'premieres-semaines-maison-organiser-journees-avec-nouveau-ne', category: 'vie-pratique',
    title: 'Les premières semaines à la maison : organiser ses journées avec un nouveau-né',
    summary: 'Rythme du bébé, repos des parents, change et bain, tâches à alléger : des repères concrets pour traverser les premières semaines sans chercher à tout faire.',
    tags: ['premières semaines bébé', 'organisation nouveau-né', 'rythme bébé', 'fatigue jeune parent', 'sieste', 'bain bébé fréquence', 'post-partum quotidien', 'routine bébé'],
    min_age_months: 0, max_age_months: 3,
    sources: [S.santeSommeil, S.santeHygiene, S.ameliRetour],
    body_md: `## En bref
- Les premières semaines, l’horloge biologique de bébé n’est pas encore réglée : il peut dormir plus le jour que la nuit, à des horaires irréguliers. Entre 0 et 3 mois, le sommeil total est de 14 à 17 heures, par tranches de 2 à 4 heures.
- Plutôt que d’imposer des horaires, couchez bébé dès les premiers signes de sommeil : bâillements, yeux frottés, pleurnichements, agitation.
- Un bain tous les deux ou trois jours suffit pour l’hygiène, et il peut être reporté si vous êtes fatigué.
- Pour vous : petites siestes quand bébé dort, aide de l’entourage, et tâches non essentielles mises de côté.

## Comprendre
Les journées avec un nouveau-né ne suivent pas encore un planning régulier. Chercher à « caler » des horaires précis trop tôt peut être source de frustration. Santé.fr rappelle que l’alternance jour-nuit se met en place progressivement, et que la plupart des bébés commencent à dormir 5 à 6 heures d’affilée vers 3-4 mois, avec de grandes différences d’un enfant à l’autre.

Votre corps récupère aussi de la grossesse et de l’accouchement. L’Assurance Maladie conseille de vous ménager, de faire de petites siestes pendant que bébé dort, de vous entourer de proches, de manger varié et de boire de l’eau. Elle recommande aussi d’éviter de porter de lourdes charges les premières semaines.

## Au quotidien
**Aider bébé à distinguer le jour de la nuit :**
- le matin, ouvrez les volets ; le soir, baissez la lumière ;
- gardez les moments d’éveil et de jeu pour la journée ;
- la nuit, restez dans le calme, avec une lumière faible, sans écran.

**Simplifier les soins :**
- Les premiers jours, bébé est changé souvent, environ 6 fois par jour, parfois davantage. Santé.fr propose de le changer après chaque tétée, et entre les tétées seulement s’il est gêné.
- Pour le bain, choisissez un moment où bébé est éveillé et de bonne humeur, préparez tout à l’avance, et comptez environ 5 minutes. Les jours sans bain, nettoyez le visage et les mains lors d’un change.

**Alléger le reste :**
- Faites une liste de trois priorités par jour, pas davantage.
- Acceptez de relâcher certaines exigences (repassage, ménage approfondi, repas élaborés).
- Déléguez ce qui peut l’être : courses en ligne ou par un proche, repas apportés, linge.
- Notez les questions qui vous viennent pour la prochaine visite de la sage-femme ou de la puéricultrice.

**À deux :** répartissez clairement certains moments (bain, change du soir, courses, lessive), et prévoyez des temps de repos pour chacun.

## Questions fréquentes
**Faut-il réveiller bébé pour respecter un horaire ?**
Santé.fr indique qu’il est inutile d’imposer des horaires de sommeil au nouveau-né. Certaines situations (petit poids, jaunisse, début d’allaitement) peuvent toutefois justifier des consignes particulières pour les repas : suivez celles de la sage-femme ou du médecin.

**Le bain quotidien est-il indispensable ?**
Non. Un bain tous les deux ou trois jours suffit pour l’hygiène, selon Santé.fr. S’il est un moment de plaisir pour vous et bébé, vous pouvez en donner plus souvent.

**Comment trouver du temps pour se reposer ?**
Dormez quand bébé dort, au moins une fois dans la journée, et laissez à un proche ou à l’autre parent un créneau avec bébé pour vous permettre de souffler.

## Quand demander conseil
Consultez rapidement si bébé a de la fièvre, refuse de s’alimenter, est inhabituellement mou ou difficile à réveiller, respire difficilement, ou si son teint change. En cas d’urgence, appelez le **15** ou le **112**. Pour vous, parlez à votre médecin ou à votre sage-femme si la tristesse, l’anxiété ou l’épuisement s’installent ; en cas d’idées noires, appelez le **3114**. Ne secouez jamais un bébé : si vous êtes à bout, posez-le en sécurité dans son lit et demandez de l’aide.

${FIN}`,
  },
  {
    ...PN, slug: 'aide-a-domicile-caf-tisf-aes-grossesse-naissance', category: 'droits-demarches',
    title: 'Aide à domicile de la Caf pendant la grossesse ou après la naissance : TISF, AES, démarches',
    summary: 'Qui peut bénéficier de l’aide et de l’accompagnement à domicile cofinancés par la Caf, ce que font les professionnels, ce qu’il reste à payer et comment faire la demande.',
    tags: ['aide à domicile', 'TISF', 'AES', 'AVS', 'Caf aide naissance', 'aide ménagère naissance', 'SAAD', 'quotient familial', 'épuisement parental'],
    sources: [S.cafAad, S.cafAadPresse, S.santeMentaleParents],
    body_md: `## En bref
- L’**aide et l’accompagnement à domicile (AAD)** est un service cofinancé par les Caf, pour une durée limitée, quand un événement bouleverse l’équilibre familial : grossesse, naissance (jusqu’aux 2 ans de l’enfant), adoption, séparation, maladie, décès…
- Il concerne les familles du régime général qui attendent un premier enfant ou ont au moins un enfant de moins de 18 ans.
- Les interventions sont assurées par des professionnels diplômés : **accompagnant éducatif et social (AES)** ou **technicien de l’intervention sociale et familiale (TISF)**.
- La demande se fait **directement auprès d’un service d’aide à domicile (SAAD) conventionné**, et non auprès de la Caf. Le reste à charge dépend du quotient familial.

## Comprendre
Selon la Caf, ce service vise à aider à concilier vie familiale, professionnelle et sociale, à soutenir la relation parent-enfant et à favoriser l’autonomie de la famille. Les professionnels interviennent à domicile pour aider les parents auprès de leurs enfants ou pour certaines tâches matérielles.

**Les motifs** sont regroupés par thèmes : l’arrivée d’un enfant (grossesse, naissance jusqu’aux 2 ans, adoption), la dynamique familiale (recomposition, santé d’un enfant ou d’un parent, déménagement, prévention de l’épuisement parental sur orientation d’un professionnel, arrivée d’un troisième enfant ou plus…), la rupture familiale (séparation, décès) et l’inclusion (parent isolé en démarche d’insertion, enfant potentiellement porteur de handicap).

**La durée** est définie lors d’un diagnostic, dans un plan d’action qui fixe les objectifs et le nombre d’heures. Elle ne peut pas dépasser un an.

**Le coût.** La Caf prend en charge une partie du coût horaire. Une participation calculée selon le quotient familial reste à votre charge : en 2026, elle va de 13 centimes à 11,88 € de l’heure selon la situation.

## Au quotidien
- **Repérez les services conventionnés** sur la page locale de votre Caf (rubrique offre de service de votre département).
- **Contactez le service** : il réalise un diagnostic de votre situation et vérifie si vous pouvez bénéficier de l’aide.
- **Préparez vos besoins** : moments de la journée difficiles, aînés à accompagner, repas, linge, rendez-vous médicaux, soutien dans les soins au bébé.
- **Définissez ensemble les modalités** : jours, horaires, tâches, objectifs.
- **Pensez-y même tard** : la demande peut être déposée jusqu’à un an après l’événement.
- **Parlez-en aux professionnels** qui vous suivent (sage-femme, PMI, assistante sociale) : ils peuvent vous orienter, notamment en cas d’épuisement.

## Questions fréquentes
**Quelle différence entre un TISF et un AES ?**
Les deux sont diplômés. Santé.fr (Psycom) indique qu’une TISF peut aider aux repas, aux démarches, aux devoirs et aux rendez-vous médicaux, avec un coût qui dépend des revenus. Le service d’aide à domicile choisit avec vous le professionnel adapté à vos besoins.

**Faut-il être allocataire pour en bénéficier ?**
Il faut relever du régime général de la Sécurité sociale et attendre un premier enfant ou avoir un enfant à charge de moins de 18 ans. Le service vérifie votre éligibilité lors du diagnostic.

**L’aide à domicile remplace-t-elle une garde d’enfant ?**
Non. Elle accompagne la famille pendant une période difficile ; le parent n’est absent du domicile que dans une proportion limitée du temps d’intervention, fixée selon le motif.

**Et en cas de naissance de jumeaux ?**
La page nationale ne détaille pas ce cas. Renseignez-vous auprès de votre Caf locale et du service d’aide à domicile.

## Quand demander conseil
Si vous vous sentez épuisé, débordé ou isolé, parlez-en à votre médecin, à votre sage-femme ou à la PMI : ils peuvent vous orienter vers ce dispositif ou d’autres soutiens. En cas d’idées suicidaires, appelez le **3114**. Si vous craignez pour la sécurité d’un enfant, appelez le **119**.

${FIN_DROITS}`,
  },
  {
    ...PNC, slug: 'menage-garde-a-domicile-credit-impot-avance-immediate', category: 'droits-demarches',
    title: 'Ménage, garde d’enfants à domicile : comment fonctionne le crédit d’impôt emploi à domicile',
    summary: 'Les services concernés, le taux de 50 %, les plafonds, l’avance immédiate et les justificatifs à garder quand on fait appel à une aide à la maison.',
    tags: ['crédit d’impôt', 'emploi à domicile', 'services à la personne', 'aide ménagère', 'garde à domicile', 'CESU', 'avance immédiate', 'Pajemploi', 'impôts'],
    sources: [S.spCredit, S.spCmg],
    body_md: `## En bref
- L’emploi d’un salarié à votre domicile ouvre droit à un **crédit d’impôt de 50 %** des dépenses payées dans l’année, après déduction des aides reçues (comme le CMG ou une aide de l’employeur).
- Sont notamment concernés : l’entretien de la maison, la **garde d’enfants à domicile**, la préparation de repas, le soutien scolaire, le petit bricolage et le petit jardinage.
- Vous pouvez employer directement un salarié ou passer par une structure (association, entreprise, organisme prestataire ou mandataire).
- Avec l’**avance immédiate**, le crédit d’impôt peut être déduit au moment du paiement pour certains services, au lieu d’attendre l’année suivante.

## Comprendre
Selon Service-Public.fr, le crédit d’impôt s’applique si vous êtes domicilié fiscalement en France et que vous employez un salarié qui intervient à votre domicile, en direct ou via une structure déclarée ou à but non lucratif.

**Les plafonds 2026.** Dans le cas général, les dépenses sont retenues dans la limite de 12 000 € par an, portée à 15 000 € si vous avez un enfant à charge. La première année d’emploi direct, le plafond est relevé. Certains services ont des sous-plafonds (petit bricolage, assistance informatique, petits travaux de jardinage).

**Les aides se déduisent.** Si vous percevez le CMG pour une garde à domicile, la part prise en charge est retirée des dépenses retenues. Pour une garde à domicile en emploi direct, le CMG prend en charge une partie des cotisations dans la limite d’un plafond mensuel.

**Le calendrier.** Les dépenses de 2026 sont déclarées en 2027. Un acompte de 60 % est versé en janvier, calculé sur le crédit de l’année précédente, puis le solde à l’été.

## Au quotidien
- **Définissez votre besoin** : quelques heures de ménage par semaine pendant les premiers mois, une garde à domicile à la reprise du travail, de l’aide pour les repas.
- **Choisissez le mode d’emploi** : emploi direct (vous êtes employeur, avec le CESU ou Pajemploi pour la garde d’enfants) ou recours à un organisme qui vous facture.
- **Renseignez-vous sur l’avance immédiate.** En emploi direct, il faut avoir souscrit au CESU+, activer l’option depuis votre compte et obtenir l’accord du salarié. Via un organisme, celui-ci peut vous la proposer et déduire le crédit de la facture. Pour la garde d’enfants de moins de 6 ans, Service-Public.fr indique que l’avance immédiate est prévue au plus tard le 1er septembre 2027.
- **Payez par un moyen traçable** : une facture payée en espèces n’est pas acceptée.
- **Conservez les justificatifs** : attestations de l’Urssaf en emploi direct, factures des organismes.
- **Vérifiez la déclaration de revenus** : les sommes payées via le CESU ou Pajemploi sont pré-remplies, mais doivent être contrôlées.

## Questions fréquentes
**Le crédit d’impôt concerne-t-il l’assistante maternelle ?**
Ce dispositif vise l’emploi d’un salarié **à votre domicile**. L’assistante maternelle accueille l’enfant chez elle ou en maison d’assistantes maternelles : les frais de garde hors du domicile relèvent d’autres règles fiscales. Renseignez-vous sur impots.gouv.fr ou Service-Public.fr.

**Comment le montant est-il calculé ?**
Il correspond à 50 % des dépenses retenues, après déduction des aides perçues. Il est calculé automatiquement par l’administration fiscale et apparaît sur votre avis d’imposition, à partir de ce que vous avez déclaré.

**Les livraisons de courses ou de repas sont-elles concernées ?**
Les services hors domicile ne comptent que s’ils font partie d’une offre comprenant des services à domicile, fournie par le même prestataire. La livraison de repas fait exception et peut être éligible seule.

**Quel délai pour voir l’argent ?**
Sans avance immédiate, le crédit est versé l’année suivant les dépenses : acompte en janvier, solde l’été.

## Quand demander conseil
Pour votre situation fiscale, contactez votre centre des finances publiques ou consultez Service-Public.fr. Si la charge du quotidien devient trop lourde et que vous vous sentez épuisé, parlez-en à votre médecin ou à la PMI ; en cas d’idées suicidaires, appelez le **3114**.

${FIN_DROITS}`,
  },
  {
    ...N, slug: 'accepter-aide-entourage-qui-fait-quoi-apres-naissance', category: 'vie-pratique',
    title: 'Accepter l’aide de l’entourage après la naissance : qui fait quoi, et comment poser ses limites',
    summary: 'Identifier les bonnes personnes, demander une aide concrète (repas, ménage, aînés), organiser les visites et savoir dire non sans culpabiliser.',
    tags: ['aide entourage', 'visites après naissance', 'grands-parents', 'demander de l’aide', 'poser ses limites', 'post-partum', 'famille', 'amis', 'isolement'],
    min_age_months: 0, max_age_months: 6,
    sources: [S.santeEntourage, S.ameliRetour, S.santeMentaleParents],
    body_md: `## En bref
- Santé.fr (1000 premiers jours) rappelle que l’entourage aide les parents à exprimer leurs ressentis, à se sentir moins dépassés et à trouver des solutions.
- Identifiez qui écoute bien, qui peut donner un coup de main concret, et qui vous encourage : ce ne sont pas toujours les mêmes personnes.
- L’aide la plus utile est souvent très concrète : tâches ménagères, repas, garde des aînés pendant que vous vous occupez du bébé.
- Vous pouvez refuser une aide devenue envahissante et ne pas suivre tous les conseils reçus, sans culpabiliser.

## Comprendre
Après une naissance, beaucoup de proches veulent aider, mais ne savent pas comment. De votre côté, il peut être difficile de demander, par peur de déranger ou de paraître dépassé. Pourtant, l’Assurance Maladie conseille de vous entourer de proches, famille, amis ou personne de confiance, pour pouvoir confier le bébé quelques instants et souffler.

Une personne bienveillante respecte vos choix, vos doutes et vos envies. Elle écoute sans juger et donne son avis sans l’imposer. Ce soutien limite l’isolement et redonne confiance, en rappelant que d’autres parents vivent la même chose.

Pour les questions médicales, en revanche, seuls les professionnels de santé peuvent répondre : un avis de proche, même bien intentionné, ne remplace pas celui de la sage-femme, du médecin ou de la PMI.

## Au quotidien
**Faites une liste de tâches à confier**, affichée sur le réfrigérateur ou partagée sur une messagerie :
- apporter un repas ou faire une course ;
- lancer une lessive, étendre, plier ;
- passer l’aspirateur, vider le lave-vaisselle ;
- emmener l’aîné à l’école ou au parc ;
- garder bébé une heure pendant que vous dormez ou prenez une douche.

**Organisez les visites :**
- proposez des créneaux courts, à des heures qui vous conviennent ;
- demandez aux visiteurs malades de reporter, et à tous de se laver les mains avant de prendre bébé ;
- n’hésitez pas à dire que vous êtes fatigué et à écourter.

**Répartissez à deux le rôle de « filtre »** : l’un des parents gère les messages et les visites, l’autre se repose.

**Pensez aux autres relais** : associations de parentalité ou de périnatalité, lieux d’accueil enfants-parents, ateliers pour parents. Santé.fr cite aussi les lieux « kid friendly » comme les cafés-poussettes.

## Questions fréquentes
**Comment refuser un conseil sans vexer ?**
Remerciez, puis expliquez simplement que vous suivez les conseils de votre sage-femme ou de votre médecin. Vous n’êtes pas obligé de justifier chaque choix.

**Les grands-parents veulent venir tous les jours : que faire ?**
Proposez un rythme qui vous convient et donnez-leur une mission précise (repas, linge, aîné). Une aide ciblée est souvent mieux vécue par tous qu’une présence continue.

**Nous n’avons pas de famille à proximité : vers qui se tourner ?**
La PMI, la sage-femme, les associations locales, les lieux d’accueil enfants-parents et l’aide à domicile cofinancée par la Caf peuvent prendre le relais.

**Demander de l’aide, est-ce un signe d’échec ?**
Non. Les sources de santé publique présentent au contraire le soutien de l’entourage comme une ressource précieuse pour les parents.

## Quand demander conseil
Si vous vous sentez isolé, triste la plupart du temps, anxieux ou épuisé depuis plus de deux semaines, parlez-en à votre médecin, à votre sage-femme ou à la PMI. En cas d’idées suicidaires, appelez le **3114**, à toute heure. En cas d’urgence médicale, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...PN, slug: 'coin-bebe-petit-logement-chambre-parents-six-mois', category: 'securite',
    title: 'Un coin bébé dans un petit logement ou dans la chambre des parents',
    summary: 'Où placer le lit de bébé pendant les six premiers mois, comment aménager un espace sûr quand la place manque, et les erreurs à éviter.',
    tags: ['coin bébé', 'petit appartement', 'chambre des parents', 'lit bébé', 'cododo', 'aménagement', 'sécurité sommeil', 'mort inattendue du nourrisson', 'studio bébé'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.ameliCoucher, S.santeSommeil, S.santeAccidents],
    body_md: `## En bref
- Pendant au moins les **six premiers mois**, le lit de bébé peut rester dans la chambre des parents : c’est rassurant et cela facilite les soins de nuit. Bébé dort dans **son propre lit**, pas dans le lit des parents.
- Un petit espace suffit : un lit conforme (marquage CE ou NF), un matelas ferme aux bonnes dimensions, un drap-housse adapté, une turbulette à la bonne taille.
- Éloignez le lit des fenêtres, des cordons de rideaux et de stores, des prises, rallonges et lampes.
- Aérez chaque jour, ne fumez pas dans le logement, et visez une température de 18 à 20 °C.

## Comprendre
Il n’est pas nécessaire d’avoir une chambre dédiée pour accueillir un bébé. L’Assurance Maladie recommande même de partager la chambre (sans partager le lit) pendant les six premiers mois. Santé.fr précise qu’après six mois, bébé peut dormir dans une autre pièce si le logement le permet.

Ce qui compte, c’est la **sécurité du couchage** : sur le dos, à plat, dans un lit dégagé, sans oreiller, couette, couverture, tour de lit ni peluche. Les lits d’adulte, canapés, fauteuils et poufs ne conviennent pas, même pour une courte sieste. Le siège auto « coque » est réservé aux déplacements et ne remplace pas le lit.

Les lits de cododo accolés au lit parental doivent être fixés sans laisser d’interstice.

## Au quotidien
**Choisir l’emplacement :**
- loin d’une fenêtre ;
- à distance des rideaux, voilages, cordons de stores, lampes, prises et rallonges ;
- sans objet posé au-dessus du lit qui pourrait tomber dedans ;
- un mobile, s’il y en a un, bien fixé et hors de portée.

**Gagner de la place en gardant un couchage sûr :**
- un lit à barreaux ou un berceau conforme, plutôt qu’un empilement de coussins ou un matelas posé sur un meuble ;
- si vous utilisez un lit parapluie, gardez uniquement son matelas d’origine, sans en ajouter ;
- un rangement vertical fixé au mur pour les vêtements et les couches ;
- un coin change sur une commode stable, avec tout à portée de main.

**Vivre à plusieurs dans une pièce :**
- la nuit, utilisez une lumière faible et évitez les écrans et veilleuses à LED ;
- le jour, laissez bébé faire ses siestes à la lumière naturelle ;
- ne laissez pas les animaux accéder au lit de bébé.

**Quand bébé commence à bouger** : fixez au mur les commodes et bibliothèques, sécurisez les tiroirs et installez des cache-prises.

## Questions fréquentes
**Peut-on dormir avec bébé dans le lit parental ?**
Les recommandations françaises demandent que bébé dorme dans son propre lit. Vous pouvez le prendre pour une tétée ou un câlin, puis le recoucher dans son lit avant de vous rendormir. Ne gardez pas bébé avec vous si vous êtes très fatigué ou si vous prenez un médicament qui diminue la vigilance.

**Un lit neuf doit-il être préparé ?**
Santé.fr conseille d’aérer un lit neuf avant l’arrivée de bébé, et de vérifier que le matelas correspond exactement aux dimensions du lit.

**Le babyphone est-il utile dans un petit logement ?**
Souvent moins. S’il vous sert, placez-le loin de bébé, jamais dans le lit, et éteignez-le quand vous ne l’utilisez pas.

**À quel âge passer dans une autre pièce ?**
Pas avant six mois selon les recommandations, puis selon votre logement et votre organisation.

## Quand demander conseil
Parlez à la sage-femme, à la puéricultrice de PMI ou au médecin de toute question sur le couchage, surtout pour un bébé prématuré ou malade. Si bébé ne respire pas, devient bleu ou ne réagit pas, appelez immédiatement le **15** ou le **112**.

${FIN}`,
  },
  {
    ...PN, slug: 'organiser-coin-change-securite-tout-a-portee', category: 'securite',
    title: 'Organiser le coin change : tout à portée de main, une main sur bébé',
    summary: 'Où installer le change, quoi y ranger, quels produits garder vraiment, et les gestes qui évitent les chutes depuis la table à langer.',
    tags: ['table à langer', 'coin change', 'chute bébé', 'matelas à langer', 'couches', 'produits bébé', 'organisation change', 'sécurité bébé', 'lingettes'],
    min_age_months: 0, max_age_months: 24,
    sources: [S.santeHygiene, S.santeAccidents, S.dgccrfPuericulture],
    body_md: `## En bref
- La chute depuis une hauteur (table à langer, lit sans barreaux, canapé) fait partie des accidents domestiques à prévenir : gardez **toujours une main sur bébé**.
- Organisez l’espace pour que tout soit à portée de main **avant** d’installer bébé.
- Si vous devez vous éloigner, emmenez bébé ou posez-le en sécurité dans son lit ou au sol.
- Peu de produits sont nécessaires : eau tiède, gant ou coton, savon doux sans parfum en cas de selles, couches non parfumées et sans lotion de préférence.

## Comprendre
Bébé est changé souvent : environ 6 fois par jour les premiers jours, parfois 10 à 12 fois. Un coin change bien pensé fait gagner du temps et limite les risques.

Santé.fr (1000 premiers jours) rappelle que le danger principal est la chute : un bébé peut se tortiller ou se retourner plus tôt qu’on ne l’imagine. D’où la règle simple d’une main posée sur lui dès que vous tendez le bras pour attraper quelque chose.

Côté produits, Santé.fr conseille de les limiter : pas besoin de parfum, de crèmes multiples ou d’eaux nettoyantes. Le savon n’est pas indispensable et peut irriter la peau ; s’il est utilisé, il doit être à base végétale, sans parfum, sans antibactérien et sans huile essentielle. Les lingettes sont à utiliser avec modération, notamment quand on n’a pas accès à l’eau.

La DGCCRF rappelle que les tables à langer font partie des articles de puériculture qui doivent comporter des consignes en français et respecter des exigences de stabilité.

## Au quotidien
**Choisir l’emplacement :**
- une surface stable, à bonne hauteur pour votre dos, près d’un point d’eau si possible ;
- loin d’une fenêtre et hors de portée des prises et rallonges ;
- avec un rangement juste à côté, accessible d’une main.

**Ce qu’il faut à portée de main :**
- couches de la bonne taille ;
- gants de toilette propres ou coton, eau tiède ;
- savon doux pour les selles ;
- serviette, body et pyjama de rechange ;
- un sac ou une poubelle pour les couches sales ;
- éventuellement une huile simple pour les massages.

**Rangez hors de portée** les produits, ciseaux, épingles et petits objets. Ne laissez pas de sac plastique près du change.

**Le geste du change :**
- nettoyez de l’avant vers l’arrière ;
- après des urines, l’eau tiède suffit ; après des selles, savon, rinçage puis séchage soigneux ;
- ne décalottez pas un petit garçon non circoncis, ne passez pas entre les lèvres de la vulve chez une petite fille ;
- parlez à bébé, enveloppez-le de vos mains et avant-bras s’il est mal à l’aise sans vêtements.

**Hors de la maison** : un tapis de change posé au sol est souvent plus sûr qu’une surface en hauteur inconnue.

## Questions fréquentes
**Une table à langer est-elle indispensable ?**
Non. Une commode stable avec un matelas à langer ou un change au sol peuvent convenir. L’essentiel est la stabilité et votre confort.

**Les lingettes sont-elles déconseillées ?**
Santé.fr conseille de les utiliser avec modération, car elles restent sur la peau et peuvent contenir des allergènes. L’eau et un gant restent la solution de base.

**Quelles couches choisir ?**
Santé.fr recommande des couches non parfumées et sans lotion, de préférence sans blanchiment chloré. Les couches lavables sont une autre option.

**Bébé s’agite pendant le change : que faire ?**
Préparez tout avant, proposez-lui un objet à tenir, parlez-lui et allez à l’essentiel. Si vous devez vous interrompre, posez-le au sol ou dans son lit.

## Quand demander conseil
Après une chute, appelez le **15** ou le **112** si bébé perd connaissance, vomit, pleure de façon inhabituelle, est très somnolent ou si vous êtes inquiet ; dans tous les cas, demandez un avis médical rapide pour un nourrisson. Parlez au médecin ou à la sage-femme d’un érythème fessier qui ne s’améliore pas ou s’accompagne de fièvre.

${FIN}`,
  },
  {
    ...NS, slug: 'routine-du-soir-bebe-rituel-a-deux', category: 'sommeil',
    title: 'Construire la routine du soir de bébé, à deux : bain, repas, câlin, coucher',
    summary: 'Pourquoi un rituel répété aide bébé à s’endormir, comment le construire selon votre organisation familiale et comment le partager entre les parents.',
    tags: ['rituel du coucher', 'routine du soir', 'coucher bébé', 'endormissement', 'bain du soir', 'histoire du soir', 'écrans', 'veilleuse', 'organisation parents'],
    min_age_months: 0, max_age_months: 36,
    sources: [S.santeSommeil, S.ameliSommeilEnfant, S.ameliCoucher],
    body_md: `## En bref
- Répéter chaque soir les mêmes gestes (câlin, histoire, musique douce, berceuse, petite lumière) aide bébé à comprendre que le moment du sommeil arrive et adoucit la séparation.
- Chaque famille peut choisir le rituel qui lui convient : l’important est sa **régularité**, pas sa complexité.
- Le soir, baissez la lumière et évitez les écrans et veilleuses à LED. Pas d’écran avant 3 ans.
- Le rituel se partage : chaque parent peut avoir « son » moment, ce qui aide aussi bébé à s’endormir avec l’un comme avec l’autre.

## Comprendre
Les tout-petits n’ont pas la notion de l’heure. Ce sont les repères répétés qui leur indiquent ce qui va se passer. L’Assurance Maladie insiste sur l’importance des repères temporels : alternance jour et nuit, repas, jeux et promenades à des heures régulières, coucher et lever réguliers, y compris le week-end.

Pour les premiers mois, Santé.fr rappelle qu’il est inutile d’imposer des horaires : on couche bébé dès les premiers signes de sommeil (bâillements, yeux frottés, pleurnichements, agitation). Le rituel s’installe autour de ces signes, puis devient plus régulier en grandissant. Entre 1 et 2 ans, des horaires réguliers de coucher et de lever sont recommandés.

Pour un enfant plus grand, l’Assurance Maladie conseille une activité calme avant le coucher (lecture, bain ou douche) et d’éviter les activités très stimulantes dans les trois heures qui précèdent.

## Au quotidien
**Un exemple de rituel, à adapter :**
1. Fin des jeux animés, lumière tamisée.
2. Bain ou toilette, si c’est le soir du bain.
3. Pyjama, turbulette.
4. Tétée ou biberon, si c’est le moment.
5. Câlin, comptine ou petite histoire.
6. Mise au lit, toujours sur le dos, dans un lit dégagé, avec les mêmes mots.

**Le partager à deux :**
- l’un donne le bain, l’autre lit l’histoire, puis vous alternez certains soirs ;
- gardez les mêmes étapes et les mêmes mots, quel que soit le parent ;
- notez le rituel pour les grands-parents ou la personne qui garde bébé.

**Les points d’attention :**
- ne laissez pas bébé s’endormir avec un biberon dans le lit (habitude de manger pour s’endormir, risque de caries) ;
- ne donnez jamais de médicament pour faire dormir un bébé ;
- la tétine peut être proposée pour dormir, sans la forcer ni la remettre dans la bouche d’un bébé endormi ;
- pas de collier ni d’attache de sucette autour du cou.

**Pour les plus grands** : éteignez téléphone, ordinateur et télévision une à deux heures avant le coucher, et rangez les appareils hors de la chambre.

## Questions fréquentes
**À partir de quel âge mettre en place un rituel ?**
Dès les premières semaines, quelques gestes doux et répétés peuvent être proposés. Ils deviennent plus structurés au fil des mois.

**Le bain du soir est-il obligatoire ?**
Non. Un bain tous les deux ou trois jours suffit pour l’hygiène. Si le bain excite votre enfant, placez-le plutôt à un autre moment.

**Bébé ne s’endort qu’avec un seul parent : comment faire ?**
Gardez strictement les mêmes étapes, et laissez l’autre parent prendre progressivement le relais sur un moment, puis sur tout le rituel.

**Et si le rituel s’allonge sans fin ?**
Fixez un nombre d’étapes, par exemple une histoire et une chanson, et annoncez-les à l’avance.

## Quand demander conseil
Parlez au médecin de l’enfant ou à la PMI si les difficultés de sommeil durent, retentissent sur la journée de l’enfant ou vous épuisent. Ne secouez jamais un bébé : si vous êtes à bout, posez-le en sécurité dans son lit, sortez de la pièce quelques minutes et appelez quelqu’un. En cas de détresse, appelez le **3114** ; si un enfant est en danger, le **119**.

${FIN}`,
  },
  {
    ...CH, slug: 'routine-du-matin-famille-creche-ecole-sans-course', category: 'vie-pratique',
    title: 'La routine du matin en famille : partir à la crèche ou à l’école sans courir',
    summary: 'Préparer la veille, un petit-déjeuner simple et complet, des étapes visuelles pour l’enfant, pas d’écran : des idées pour des matins plus calmes.',
    tags: ['routine du matin', 'matin école', 'crèche', 'petit-déjeuner enfant', 'retard', 'organisation famille', 'autonomie', 'écrans le matin', 'horaires réguliers'],
    min_age_months: 12, max_age_months: 120,
    sources: [S.ameliSommeilEnfant, S.ameliRepas, S.santeMentaleParents],
    body_md: `## En bref
- Des horaires de coucher et de lever **réguliers**, y compris le week-end, facilitent les réveils : c’est l’un des repères conseillés par l’Assurance Maladie.
- Préparer la veille (vêtements, sac, goûter, papiers) libère du temps et de l’énergie le matin.
- Un petit-déjeuner complet associe un produit céréalier, un produit laitier, un fruit et une boisson non sucrée.
- Laissez l’enfant faire seul ce qu’il peut faire, avec des étapes simples, quitte à ce que ce soit moins rapide ou moins parfait.

## Comprendre
Le matin concentre souvent les tensions : temps limité, enfant encore endormi, adultes qui doivent partir travailler. Une partie de la solution se joue… la veille au soir. Un enfant qui s’est couché à une heure régulière se réveille plus facilement. L’Assurance Maladie rappelle aussi que les écrans le soir peuvent retarder l’endormissement.

L’autonomie est un autre levier. Santé.fr (Psycom) encourage à favoriser l’autonomie de l’enfant et à accepter de relâcher certaines exigences. Concrètement, un enfant de 3 ans qui enfile ses chaussures seul met plus de temps, mais il apprend, et l’adulte peut faire autre chose pendant ce temps.

## Au quotidien
**La veille au soir :**
- préparez les vêtements avec l’enfant (deux tenues au choix pour les plus petits) ;
- remplissez le sac : doudou, change, cahier, goûter, autorisation signée ;
- dressez la table du petit-déjeuner ;
- posez clés, badge et papiers au même endroit.

**Le matin, une séquence fixe**, par exemple :
1. Lever, câlin, lumière du jour.
2. Toilette, habillage.
3. Petit-déjeuner assis.
4. Brossage des dents.
5. Chaussures, manteau, départ.

**Pour les enfants qui ne savent pas lire**, affichez la séquence en dessins ou en photos à hauteur d’enfant. Il peut déplacer une pince à linge à chaque étape réalisée.

**Le petit-déjeuner, simple et complet :** pain, de préférence complet, ou céréales peu sucrées ; lait ou yaourt ; un fruit ; de l’eau. Il peut se préparer en quelques minutes.

**Les écrans** : pas d’écran avant 3 ans. Pour les plus grands, le matin, mieux vaut s’en passer : ils captent l’attention et allongent chaque étape.

**À deux** : répartissez les rôles de façon claire (l’un s’occupe des enfants, l’autre du petit-déjeuner et des sacs) et alternez si besoin.

**Prévoyez une marge** de dix minutes : l’imprévu (couche à changer, chaussure introuvable) est la règle plutôt que l’exception.

## Questions fréquentes
**Mon enfant refuse de petit-déjeuner : faut-il insister ?**
Mieux vaut ne pas forcer. Proposez un petit-déjeuner simple et laissez-le manger à son rythme ; si l’appétit vient plus tard, une collation peut être prévue, en respectant deux heures avant le repas suivant. Parlez-en au médecin si le manque d’appétit s’accompagne d’autres signes.

**Il traîne à chaque étape : que faire ?**
Réduisez le nombre de choix, utilisez un support visuel, félicitez chaque étape réussie, et réveillez-le un peu plus tôt si possible plutôt que de multiplier les rappels.

**Le week-end, faut-il garder les mêmes horaires ?**
L’Assurance Maladie conseille de garder des horaires de coucher et de lever réguliers, y compris le week-end, pour préserver le sommeil de l’enfant.

## Quand demander conseil
Parlez au médecin de l’enfant si votre enfant est très difficile à réveiller, fatigué en permanence, ronfle beaucoup ou se plaint souvent de maux de ventre ou de tête le matin. Si les matins vous épuisent et que vous vous sentez à bout, parlez-en à votre médecin ; en cas de détresse, appelez le **3114**. Si un enfant est en danger, appelez le **119**.

${FIN}`,
  },
  {
    ...NS, slug: 'nuits-a-deux-relais-sommeil-parents-nouveau-ne', category: 'sommeil',
    title: 'Les nuits à deux avec un nouveau-né : organiser des relais pour que chacun dorme',
    summary: 'Comment parler des nuits en couple, mettre en place des tours de garde, protéger les siestes et éviter les situations à risque quand la fatigue s’accumule.',
    tags: ['nuits bébé', 'relais de nuit', 'fatigue parents', 'manque de sommeil', 'réveils nocturnes', 'couple', 'sieste parents', 'allaitement nuit', 'tour de garde'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.santeSommeil, S.ameliCoucher, S.ameliRetour],
    body_md: `## En bref
- Les réveils nocturnes peuvent être très éprouvants. Santé.fr conseille d’en **parler en couple** pour organiser des temps de repos pour chacun, et de consulter la PMI ou le médecin de l’enfant **avant d’être épuisé**.
- Entre 0 et 3 mois, bébé dort par tranches de 2 à 4 heures : les nuits complètes viennent plus tard, à un âge très variable.
- Quand bébé se réveille, il n’a pas forcément faim : il peut avoir besoin de câlins, dans le calme et une lumière faible.
- Ne gardez pas bébé dans votre lit si vous êtes très fatigué, et ne vous endormez jamais avec lui sur un canapé ou un fauteuil.

## Comprendre
Le manque de sommeil s’accumule vite et touche l’humeur, la patience et la vigilance. Santé.fr (Psycom) cite le manque prolongé de sommeil ou de repos parmi les situations qui compliquent la santé mentale des parents.

Organiser des relais, c’est reconnaître que les deux parents ont besoin de récupérer, y compris celui qui travaille et celui qui allaite. Les solutions varient selon le mode d’alimentation, la reprise du travail de chacun et la configuration du logement.

Côté sécurité, l’Assurance Maladie recommande que bébé dorme dans la chambre des parents, mais dans **son propre lit**, au moins pendant les six premiers mois. Vous pouvez le prendre pour une tétée ou un câlin, puis le recoucher avant de vous rendormir.

## Au quotidien
**Parler des nuits, à froid** (pas à 3 heures du matin) :
- qui se lève quand, selon les jours de travail ;
- qui récupère le matin, qui fait une sieste l’après-midi ;
- quel signal pour demander un relais quand l’un n’en peut plus.

**Quelques organisations possibles :**
- **par moitié de nuit** : l’un couvre le début de soirée et la première partie de la nuit, l’autre la seconde ;
- **par nuit** : une nuit sur deux, chacun a une nuit plus protégée, si possible dans une autre pièce avec des bouchons d’oreille ;
- **en cas d’allaitement** : l’autre parent peut se charger du change, du rot, du recouchage, et prendre bébé le matin pour laisser dormir le parent qui allaite ;
- **le week-end** : une grasse matinée chacun son tour.

**Protéger le repos dans la journée :**
- dormez quand bébé dort, au moins une fois par jour ;
- confiez bébé à un proche pour une sieste ;
- réduisez les tâches non essentielles.

**Garder les nuits calmes pour bébé :** lumière faible, peu de paroles, pas d’écran ; gardez les jeux pour la journée.

**Les gestes à éviter quand on est épuisé :** s’endormir avec bébé dans les bras, sur un canapé ou un fauteuil ; garder bébé dans son lit après avoir pris un médicament qui diminue la vigilance ; coucher bébé avec un autre enfant.

## Questions fréquentes
**Le parent qui allaite doit-il gérer toutes les nuits ?**
Non. Même si ce parent est seul à pouvoir allaiter, l’autre peut assurer tout le reste : change, recouchage, câlins, et prendre le relais le matin.

**Faut-il réveiller l’autre parent qui travaille le lendemain ?**
C’est à décider ensemble. Un parent qui dort mal pendant des semaines s’épuise aussi ; un partage, même inégal selon les jours, protège le couple.

**Quand bébé fera-t-il ses nuits ?**
Vers 3-4 mois, beaucoup de bébés commencent à dormir 5 à 6 heures d’affilée, mais cela varie beaucoup et peut prendre plusieurs mois.

## Quand demander conseil
Consultez la PMI, votre médecin ou celui de l’enfant si la fatigue devient écrasante, si vous vous sentez à bout ou si vous avez peur de perdre patience. Ne secouez jamais un bébé : posez-le en sécurité dans son lit et demandez de l’aide. En cas d’idées suicidaires, appelez le **3114** ; si un enfant est en danger, le **119** ; en cas d’urgence, le **15** ou le **112**.

${FIN}`,
  },
  {
    ...N, slug: 'conge-supplementaire-de-naissance-2026-organiser-a-deux', category: 'droits-demarches',
    title: 'Le congé supplémentaire de naissance (2026) : comment l’organiser à deux',
    summary: 'Le nouveau congé de 1 ou 2 mois par parent, ouvert depuis le 1er juillet 2026 : à quel moment le prendre, comment prévenir l’employeur et comment l’articuler avec les autres congés.',
    tags: ['congé supplémentaire de naissance', 'congé naissance 2026', 'nouveau congé parent', 'indemnités journalières de naissance', 'congé paternité', 'congé maternité', 'PreParE', 'CMG', 'prévenir employeur'],
    min_age_months: 0, max_age_months: 9,
    sources: [S.spCsn, S.spCsnFaq, S.ameliCsn],
    body_md: `## En bref
- Créé par la loi de financement de la Sécurité sociale pour 2026, ce congé **s’ajoute** aux congés de maternité, de paternité et d’accueil de l’enfant ou d’adoption : il ne les remplace pas.
- Chaque parent peut prendre **1 ou 2 mois**, éventuellement en deux périodes d’un mois, en même temps que l’autre parent ou à tour de rôle. C’est un droit individuel, non transférable.
- Il concerne les enfants nés ou adoptés à partir du 1er janvier 2026 (ou nés prématurément alors que la naissance était prévue à partir de cette date), et doit commencer **dans les 9 mois** suivant la naissance, après les congés de maternité, de paternité ou d’adoption.
- Les salariés préviennent leur employeur au moins **un mois** avant (15 jours si le congé suit directement le congé de paternité ou d’adoption).

## Comprendre
Ce congé est accessible depuis le 1er juillet 2026. Il concerne les salariés, mais aussi, selon leurs règles propres, les agents publics, les travailleurs indépendants, les artistes-auteurs, les demandeurs d’emploi et d’autres publics listés par Service-Public.fr.

**L’indemnisation** des salariés est assurée par l’Assurance Maladie, sous forme d’indemnités journalières de naissance : 70 % du salaire le premier mois, puis 60 % le second, dans la limite d’un plafond (4 005 € brut mensuel au 1er janvier 2026). L’employeur n’est pas obligé de compléter, sauf accord ou convention plus favorable. L’indemnité est versée après chaque mois de congé.

**Pour les enfants nés au premier semestre 2026**, des règles transitoires s’appliquent : selon la FAQ de Service-Public.fr, le congé doit débuter dans les 9 mois à compter du 1er juillet 2026, soit avant le 1er avril 2027.

**Les cumuls.** Ce congé ne peut pas être pris en même temps que la PreParE, mais les deux peuvent se suivre, dans n’importe quel ordre. En principe, il n’est pas cumulable avec le CMG pour le même enfant, sauf exceptions pour les enfants nés ou adoptés entre le 1er janvier et le 30 juin 2026. Il n’est pas non plus cumulable avec les indemnités maladie, les allocations chômage ou l’AJPP.

## Au quotidien
- **Faites un calendrier commun** des congés de chacun : fin du congé de maternité, congé de paternité et d’accueil, puis congé supplémentaire, puis éventuellement congé parental.
- **Choisissez entre simultané et alterné.** Ensemble, pour partager les premières semaines ; à tour de rôle, pour retarder l’entrée en mode de garde.
- **Pensez au mode de garde** : le congé peut décaler la date d’accueil ; prévenez la crèche ou l’assistante maternelle tôt.
- **Prévenez l’employeur par écrit** (lettre recommandée ou remise en main propre) en indiquant la date de début, la durée et, si besoin, les dates de fractionnement. Le ministère du Travail propose un modèle de courrier. Aucune démarche n’est à faire auprès de la caisse pour un salarié : l’employeur transmet.
- **Indépendants, salariés payés par CESU ou Pajemploi** : la demande se fait en ligne sur le téléservice dédié indiqué par ameli.fr.
- **Anticipez le budget** : l’indemnité est inférieure au salaire et dégressive.

## Questions fréquentes
**Faut-il faire une démarche auprès de l’Assurance Maladie ?**
Pas pour un salarié : il suffit d’informer l’employeur, qui transmet la demande à la caisse. Les indépendants et les salariés payés par CESU ou Pajemploi font, eux, leur demande en ligne.

**Peut-on le prendre en une seule fois à deux mois ?**
Oui, ou en deux périodes d’un mois. Chaque parent décide pour son propre congé.

**Et si l’on est au chômage ?**
Les demandeurs d’emploi peuvent en bénéficier : il faut prévenir France Travail puis faire la demande en ligne. Les allocations chômage sont suspendues pendant le congé.

## Quand demander conseil
Pour votre situation précise, contactez votre service RH, votre caisse d’Assurance Maladie ou consultez Service-Public.fr. Si la période après la naissance vous pèse moralement, parlez-en à votre médecin ou à votre sage-femme ; en cas d’idées suicidaires, appelez le **3114**.

${FIN_DROITS}`,
  },
  {
    ...NC, slug: 'reprise-du-travail-apres-bebe-check-list-pratique', category: 'vie-pratique',
    title: 'Reprise du travail après bébé : la check-list pratique des dernières semaines de congé',
    summary: 'Mode de garde, période d’adaptation, allaitement au travail, temps partiel, plan B en cas de maladie : ce qu’il est utile de préparer avant de reprendre.',
    tags: ['reprise du travail', 'retour au travail après congé maternité', 'fin de congé', 'adaptation crèche', 'allaitement au travail', 'temps partiel', 'enfant malade', 'organisation', 'plan B garde'],
    min_age_months: 2, max_age_months: 36,
    sources: [S.spAllaitement, S.spTempsPartiel, S.spEnfantMalade],
    body_md: `## En bref
- Anticipez la **période d’adaptation** chez l’assistante maternelle ou à la crèche : elle se déroule en général sur plusieurs jours avant la reprise. Demandez ses modalités au lieu d’accueil.
- Si vous allaitez, la loi prévoit **une heure par jour** pour allaiter pendant les heures de travail, jusqu’au premier anniversaire de l’enfant, en deux fois 30 minutes (20 minutes si un local dédié est prévu).
- Un **congé parental à temps partiel** est possible sous conditions (au moins 1 an d’ancienneté, au moins 16 heures par semaine). L’employeur doit être prévenu 1 mois avant la fin du congé de maternité ou d’adoption si le temps partiel suit immédiatement.
- Préparez un **plan B** pour les jours où l’enfant sera malade : le congé pour enfant malade existe, mais il est limité et en principe non rémunéré.

## Comprendre
La reprise du travail mêle émotions et logistique. Préparer la partie pratique quelques semaines avant aide souvent à vivre plus sereinement la séparation.

**L’allaitement au travail.** Selon Service-Public.fr, l’heure quotidienne d’allaitement n’est pas rémunérée, sauf convention collective plus favorable. Son placement peut faire l’objet d’un accord avec l’employeur ; à défaut, elle se situe au milieu de chaque demi-journée. Dans les entreprises de 100 salariées et plus, un local dédié est obligatoire ; dans les plus petites, la salariée doit pouvoir se reposer allongée dans des conditions convenables.

**Le temps partiel parental.** L’employeur ne peut pas le refuser si les conditions sont remplies. La durée de travail est fixée par avenant, et le salaire est proportionnel au temps travaillé. La PreParE peut, sous conditions, compenser une partie de la baisse de revenus.

**L’enfant malade.** Un salarié du privé a droit à 3 jours par an pour un enfant malade de moins de 16 ans, ou 5 jours si l’enfant a moins d’un an ou si le salarié a au moins trois enfants de moins de 16 ans. Une convention collective peut prévoir davantage.

## Au quotidien
**Six à huit semaines avant :**
- confirmez la date d’accueil avec la crèche ou l’assistante maternelle ;
- si vous souhaitez un temps partiel parental, envoyez le courrier dans les délais ;
- si vous allaitez, parlez à votre employeur de l’organisation des pauses et du lieu pour tirer votre lait.

**Deux à quatre semaines avant :**
- démarrez l’adaptation progressive ;
- préparez le sac de l’enfant (change, vêtements, doudou) et une fiche avec ses habitudes ;
- faites un essai du trajet complet aux heures réelles.

**La semaine de la reprise :**
- prévoyez des repas simples ou congelés ;
- couchez-vous tôt les premiers jours ;
- gardez une marge le matin.

**Le plan B maladie :** listez les personnes mobilisables (autre parent, grands-parents, voisin, garde ponctuelle), vérifiez votre convention collective, et discutez avec votre employeur des possibilités de télétravail ou d’aménagement s’il en existe.

## Questions fréquentes
**Faut-il un certificat médical pour le congé enfant malade ?**
Oui : le salarié remet à son employeur, au plus vite, un certificat médical attestant la maladie ou l’accident de l’enfant.

**L’heure d’allaitement s’applique-t-elle si je tire mon lait ?**
Service-Public.fr parle d’allaiter pendant les heures de travail ; renseignez-vous auprès de votre employeur ou de votre convention collective pour l’organisation pratique du tire-lait.

**Peut-on revenir à temps plein avant la fin prévue du temps partiel ?**
En principe avec l’accord de l’employeur, sauf décès de l’enfant ou baisse importante des ressources du ménage.

**Comment vivre la séparation ?**
Une adaptation progressive, une fiche d’habitudes et des retrouvailles calmes le soir aident souvent. Les émotions de la reprise sont abordées dans un article dédié.

## Quand demander conseil
Si la reprise s’accompagne d’une tristesse, d’une anxiété ou d’un épuisement qui durent, parlez-en à votre médecin, à votre sage-femme ou au médecin du travail. En cas d’idées suicidaires, appelez le **3114**.

${FIN_DROITS}`,
  },
  {
    ...CH, slug: 'enfant-malade-quand-on-travaille-conges-et-solutions', category: 'droits-demarches',
    title: 'Enfant malade quand on travaille : congés possibles et solutions de garde',
    summary: 'Congé enfant malade, congé de présence parentale pour une maladie grave, relais de l’entourage et solutions locales : s’organiser quand l’enfant ne peut pas aller à la crèche ou à l’école.',
    tags: ['enfant malade', 'congé enfant malade', 'jours enfant malade', 'présence parentale', 'AJPP', 'garde enfant malade', 'certificat médical', 'convention collective', 'CCAS'],
    min_age_months: 3, max_age_months: 192,
    sources: [S.spEnfantMalade, S.spPresenceParentale, S.mpediaSolos],
    body_md: `## En bref
- Dans le secteur privé, le **congé pour enfant malade** est de 3 jours par an pour un enfant de moins de 16 ans, et de 5 jours si l’enfant a moins d’un an ou si vous avez au moins trois enfants de moins de 16 ans. Une convention collective peut prévoir mieux.
- Ce congé est **en principe non rémunéré**, sauf disposition conventionnelle (et règles particulières en Moselle, Bas-Rhin et Haut-Rhin). Il faut remettre un certificat médical à l’employeur au plus vite.
- Pour une maladie, un accident ou un handicap **grave** nécessitant une présence soutenue, le **congé de présence parentale** peut aller jusqu’à 310 jours ouvrés, avec l’allocation journalière de présence parentale (AJPP) sous conditions.
- Préparer à l’avance une liste de relais (autre parent, proches, garde ponctuelle) évite de tout improviser.

## Comprendre
Les petits enfants tombent souvent malades, surtout lors des premières années en collectivité. La crèche, l’assistante maternelle ou l’école peut demander de garder l’enfant à la maison dans certaines situations.

**Le congé pour enfant malade** ne demande pas d’ancienneté, y compris pendant la période d’essai. L’employeur ne peut ni le refuser ni le reporter, dans la limite des jours prévus. La convention collective applicable est celle de l’activité principale de l’entreprise : un simulateur sur Service-Public.fr permet de connaître vos droits.

**Le congé de présence parentale** concerne un enfant de moins de 20 ans atteint d’une pathologie grave. Le certificat médical doit attester la gravité et le besoin de présence et de soins contraignants. La demande se fait à l’employeur au moins 10 jours avant, puis chaque absence est signalée 48 heures avant, sauf urgence. Le contrat est suspendu ; l’AJPP se demande à la Caf ou à la MSA.

## Au quotidien
**Avant que la situation arrive :**
- renseignez-vous sur votre convention collective ;
- discutez à deux de la répartition des jours d’absence, pour ne pas faire peser toutes les absences sur le même parent ;
- établissez une liste de personnes à appeler, avec leurs disponibilités ;
- renseignez-vous auprès de votre mairie ou de votre CCAS : mpedia mentionne qu’une assistante sociale du CCAS peut parfois mettre en place une garde ponctuelle pendant les maladies des enfants ;
- gardez à la maison un minimum (thermomètre, sérum physiologique, numéro du médecin, de la pharmacie de garde).

**Le jour même :**
- prévenez votre employeur dès que possible ;
- prenez rendez-vous chez le médecin si l’état de l’enfant le nécessite, et demandez le certificat pour l’employeur ;
- alternez avec l’autre parent si la maladie dure plusieurs jours.

**Si vous êtes parent solo**, les difficultés sont plus fortes, notamment en période d’essai. Le réseau (proches, parents d’élèves, voisins) et les services sociaux sont des appuis précieux.

## Questions fréquentes
**Les jours enfant malade sont-ils payés ?**
En principe non, sauf si votre convention collective le prévoit, et sauf en Alsace-Moselle où le salaire est maintenu.

**Les deux parents ont-ils chacun droit à ces jours ?**
Le droit est attaché au salarié qui assume la charge de l’enfant. Renseignez-vous auprès de votre employeur ou de votre convention collective sur l’application dans votre situation.

**Que faire si l’enfant est hospitalisé longtemps ?**
Le congé de présence parentale et l’AJPP peuvent être envisagés. Parlez-en à l’équipe soignante et à l’assistante sociale de l’hôpital, et contactez votre Caf.

## Quand demander conseil
Appelez le **15** ou le **112** si votre enfant a du mal à respirer, est très somnolent, ne réagit pas normalement, présente des taches qui ne s’effacent pas à la pression ou des signes de déshydratation. Hors urgence, consultez le médecin traitant ou le médecin de garde. Si vous êtes épuisé, appelez votre médecin ; en cas d’idées suicidaires, le **3114**.

${FIN_DROITS}`,
  },
  {
    ...PN, slug: 'chercher-mode-de-garde-pendant-grossesse-calendrier-questions', category: 'ecole-garde',
    title: 'Chercher un mode de garde pendant la grossesse : calendrier, critères et questions à poser',
    summary: 'Quand commencer, comment comparer crèche, assistante maternelle, MAM et garde à domicile, et quelles questions préparer pour les rencontres.',
    tags: ['mode de garde', 'inscription crèche', 'place en crèche', 'assistante maternelle', 'MAM', 'garde à domicile', 'relais petite enfance', 'RPE', 'monenfant.fr'],
    min_week: 8, max_week: 42,
    sources: [S.monenfantModes, S.cafCreche, S.monenfantPreparer],
    body_md: `## En bref
- Commencez vos recherches **dès la grossesse** : les places sont limitées dans de nombreuses communes et certaines démarches demandent de l’anticipation.
- Pour la crèche, renseignez-vous auprès de votre mairie **dès le début de la grossesse** : chaque collectivité a ses règles et son calendrier.
- Il n’existe pas de solution idéale : le choix dépend des besoins de l’enfant, de votre organisation et de votre budget.
- Le **relais petite enfance (RPE)** présente les solutions près de chez vous et répond aux questions sur les contrats et les aides.

## Comprendre
Les principaux modes d’accueil présentés par monenfant.fr sont :
- **la crèche** (collective, micro-crèche, familiale, parentale), encadrée par des professionnels de la petite enfance, avec un accueil régulier, occasionnel ou à temps partiel selon l’établissement ;
- **l’assistante maternelle**, professionnelle agréée par le conseil départemental, qui accueille l’enfant chez elle : c’est le premier mode d’accueil en France ;
- **la maison d’assistantes maternelles (MAM)**, où plusieurs assistantes maternelles travaillent ensemble dans un local aménagé ;
- **la garde d’enfant à domicile**, où un professionnel garde l’enfant chez vous.

La Caf rappelle que l’accueil en crèche n’est pas obligatoire pour les communes et que les délais varient beaucoup d’une ville à l’autre. Les professionnels conseillent de ne pas idéaliser un mode d’accueil et de rester ouvert à d’autres solutions.

## Au quotidien
**Avant de chercher, clarifiez vos besoins :**
- vos horaires de travail (temps plein, partiel, décalés) ;
- le nombre d’heures d’accueil par semaine ;
- la distance acceptable entre domicile, travail et lieu d’accueil ;
- l’aide ponctuelle possible de l’entourage ;
- vos besoins pendant les vacances.

**Un calendrier indicatif :**
- **1er trimestre** : renseignez-vous à la mairie sur les modalités d’inscription en crèche ; contactez le RPE.
- **2e trimestre** : déposez les demandes ; visitez des structures ; listez des assistantes maternelles disponibles sur monenfant.fr.
- **3e trimestre** : rencontrez des assistantes maternelles ; estimez les coûts avec les simulateurs.
- **Après la naissance** : confirmez votre choix et la date d’adaptation en fonction de vos congés.

**Questions à poser lors des rencontres :**
- horaires, jours de fermeture, organisation des vacances ;
- déroulement de l’adaptation ;
- organisation des repas, des siestes, des sorties ;
- conduite en cas de fièvre ou de maladie ;
- façon dont les informations sont transmises chaque jour ;
- pour une assistante maternelle : agrément, nombre d’enfants accueillis, solution de remplacement en cas d’absence.

**Pensez au coût** : il dépend du mode d’accueil, de vos ressources et de votre situation. Le CMG peut prendre en charge une partie des frais pour une assistante maternelle, une garde à domicile ou une micro-crèche, sous conditions.

## Questions fréquentes
**Les enfants nés en début d’année ont-ils plus de chances en crèche ?**
La Caf indique que les enfants nés entre janvier et avril ont souvent plus de chances, car des places se libèrent à la rentrée en maternelle des plus grands.

**Comment trouver une assistante maternelle ?**
monenfant.fr propose une recherche géolocalisée ; le RPE peut aussi vous orienter et vous accompagner pour le contrat.

**Et si nous n’avons aucune place à la date voulue ?**
Combinez temporairement plusieurs solutions (congés successifs des parents, entourage, garde partagée), et maintenez vos demandes à jour.

## Quand demander conseil
Le RPE, votre mairie et votre Caf sont les interlocuteurs pour l’accueil et les aides. Si la recherche vous angoisse au point de peser sur votre moral, parlez-en à votre sage-femme ou à votre médecin ; en cas d’idées suicidaires, appelez le **3114**.

${FIN_DROITS}`,
  },
  {
    ...NC, slug: 'employer-assistante-maternelle-etapes-pajemploi-cmg', category: 'ecole-garde',
    title: 'Employer une assistante maternelle : les étapes, de la rencontre à la déclaration Pajemploi',
    summary: 'Vérifier l’agrément, établir le contrat, demander le CMG, déclarer chaque mois sur Pajemploi : le parcours d’un parent employeur, expliqué pas à pas.',
    tags: ['assistante maternelle', 'parent employeur', 'Pajemploi', 'Pajemploi+', 'CMG', 'contrat assistante maternelle', 'agrément', 'RPE', 'garde à domicile'],
    min_age_months: 2, max_age_months: 72,
    sources: [S.spCmg, S.monenfantModes, S.cafJeunesParents],
    body_md: `## En bref
- Quand vous confiez votre enfant à une assistante maternelle, vous devenez son **employeur** : contrat, rémunération, déclaration mensuelle.
- L’assistante maternelle est une professionnelle **agréée par le conseil départemental**.
- Le **CMG** (complément de libre choix du mode de garde) prend en charge une partie des frais. Pour une assistante maternelle agréée, les cotisations sont prises en charge à 100 %, et une partie du salaire selon vos ressources.
- Vous devez vous inscrire sur **Pajemploi** et y déclarer chaque mois la rémunération versée. Pajemploi calcule et verse le CMG et vous indique le reste à charge.

## Comprendre
L’assistante maternelle accueille votre enfant chez elle ou dans une maison d’assistantes maternelles (MAM), selon des horaires convenus avec vous. Le relais petite enfance (RPE) peut répondre à vos questions sur les contrats, les démarches et les aides.

**Le CMG « emploi direct »** concerne en général les enfants de moins de 6 ans, et jusqu’à 12 ans pour un parent isolé. Il faut qu’au moins un parent en couple travaille (ou se trouve dans une situation assimilée : indemnités journalières, chômage indemnisé, formation rémunérée), sauf exceptions (études, AAH, RSA ou ASS sous conditions). Le montant dépend de vos ressources, du nombre d’enfants, du coût horaire de la garde dans la limite d’un plafond, et du nombre d’heures par mois. Les règles de calcul ont changé au 1er septembre 2025 ; un simulateur est disponible.

**Pajemploi+** (option) simplifie le paiement : Pajemploi prélève sur votre compte le salaire diminué du CMG, puis verse le salaire à l’assistante maternelle. Il faut son accord avant d’activer l’option.

## Au quotidien
1. **Rencontrez** plusieurs assistantes maternelles, si possible chez elles, et posez vos questions (horaires, vacances, repas, sorties, maladie, remplacement).
2. **Vérifiez l’agrément** : demandez à le voir (nombre et âge des enfants autorisés).
3. **Rédigez le contrat** ensemble : horaires, jours, période d’adaptation, salaire, frais de repas, indemnités d’entretien, congés. Le RPE peut vous aider à le relire.
4. **Faites la première demande de CMG** à la Caf (ou à la MSA). Si vous n’êtes pas allocataire, créez d’abord votre compte Caf.
5. **Inscrivez-vous sur Pajemploi** comme employeur.
6. **Chaque mois, déclarez** la rémunération sur Pajemploi. Le CMG est versé à partir du mois précédant la demande si les conditions sont remplies.
7. **Signalez tout changement** à la Caf : naissance, séparation, mise en couple, chômage, déménagement.

**Conseils d’organisation :**
- notez chaque jour les heures d’arrivée et de départ ;
- gardez une copie du contrat, de l’agrément et des déclarations ;
- prévoyez avec l’assistante maternelle une solution pour ses congés et ses absences.

## Questions fréquentes
**Le CMG est-il versé si un seul parent travaille ?**
En couple, il suffit en principe qu’au moins un des deux travaille. Vérifiez votre cas sur Service-Public.fr.

**Que se passe-t-il en cas de résidence alternée ?**
Depuis le 1er décembre 2025, le CMG peut être versé à chacun des deux parents, chacun selon sa situation, si la résidence alternée est réelle.

**Peut-on cumuler CMG et congé parental ?**
La PreParE est cumulable avec le CMG en cas de travail à temps partiel. Pour le congé supplémentaire de naissance, le cumul n’est en principe pas possible pour le même enfant, sauf exceptions.

**Qui contacter pour une question sur le contrat ?**
Le RPE de votre secteur, que vous pouvez trouver sur monenfant.fr.

## Quand demander conseil
Pour les droits et le CMG, contactez votre Caf ; pour le contrat, le RPE. Si vous avez des inquiétudes sur la façon dont votre enfant est accueilli, parlez-en avec l’assistante maternelle et, si besoin, avec le service de PMI du département qui délivre les agréments. Si un enfant est en danger, appelez le **119**.

${FIN_DROITS}`,
  },
  {
    ...NC, slug: 'menus-de-la-semaine-jeunes-parents-planifier-simplement', category: 'alimentation',
    title: 'Les menus de la semaine quand on est jeunes parents : planifier simplement',
    summary: 'Une méthode en quatre étapes pour prévoir les repas de la semaine, avec une vingtaine de recettes qui tournent, des repères d’équilibre et une liste de courses qui en découle.',
    tags: ['menus de la semaine', 'planning repas', 'organisation repas', 'idées repas famille', 'liste de courses', 'Fabrique à menus', 'repas équilibrés', 'gagner du temps', 'cuisine famille'],
    sources: [S.spf50astuces, S.ameliRepas],
    body_md: `## En bref
- L’équilibre se construit **sur la semaine**, pas sur un seul repas : l’Assurance Maladie rappelle qu’il dépend des habitudes prises sur la durée.
- Une astuce de Santé publique France : faire tourner **une vingtaine de recettes simples**, qui évoluent avec les saisons, et planifier les menus le week-end en impliquant la famille.
- Quelques repères pour la semaine : des légumes et des fruits à chaque repas, des féculents (de préférence complets), des légumineuses au moins deux fois, du poisson au moins deux fois, et une quantité modérée de viande.
- Le site Manger Bouger propose « La Fabrique à menus », qui génère des idées de menus et une liste de courses.

## Comprendre
Avec un bébé ou de jeunes enfants, la question « qu’est-ce qu’on mange ce soir ? » peut devenir une source de fatigue quotidienne. Planifier une fois par semaine évite de décider tous les jours, limite les courses de dernière minute et le gaspillage.

Les repères de l’Assurance Maladie pour l’adulte aident à composer cette semaine : au moins 5 fruits et légumes par jour, avec davantage de légumes que de fruits ; des féculents à chaque repas selon l’appétit ; des légumineuses (lentilles, pois chiches, haricots) au moins deux fois par semaine ; du poisson au moins deux fois par semaine ; la volaille plutôt que les viandes rouges, elles-mêmes limitées, et peu de charcuterie. Il est aussi conseillé d’alterner les sources de protéines, de privilégier les produits bruts et de saison, et de limiter les produits ultra-transformés.

## Au quotidien
**Étape 1 — Votre liste de recettes.** Notez une vingtaine de plats simples que tout le monde aime : omelette et salade, lentilles aux légumes, pâtes complètes aux légumes, poisson et pommes de terre vapeur, soupe et tartines, chili sans viande aux haricots rouges… Renouvelez-la au fil des saisons.

**Étape 2 — Le planning.** Le week-end, remplissez une grille de la semaine (midi et soir si besoin) :
- deux soirs « poisson » ;
- deux soirs « légumineuses » ;
- un soir « œufs » ;
- un soir « restes » ;
- un soir « simple » (soupe, tartines, fromage, fruit).

**Étape 3 — Cuisiner en avance quand c’est possible.** Lavez la salade et les crudités, faites cuire des légumes au four ou à la vapeur pour quelques jours, préparez un plat mijoté en grande quantité et congelez des portions.

**Étape 4 — La liste de courses.** Déduisez-la directement du planning, et complétez avec les basiques du placard.

**Pour les enfants** : beaucoup de plats familiaux conviennent à tous, en adaptant la texture et l’assaisonnement selon l’âge. Pour les bébés en cours de diversification, suivez les repères donnés par le médecin ou la PMI.

**Gardez de la souplesse** : le planning est un appui, pas une contrainte. Échanger deux soirs n’a aucune importance.

## Questions fréquentes
**Combien de temps faut-il pour planifier ?**
Une fois la liste de recettes établie, une dizaine de minutes par semaine suffisent souvent, surtout si le planning est fait à deux.

**Faut-il bannir certains aliments ?**
Pour l’adulte, l’Assurance Maladie rappelle qu’il n’y a pas d’aliments interdits : tout se consomme en quantités adaptées à l’âge, à la santé et à l’activité. Les produits gras, salés ou sucrés sont à limiter. Pendant une grossesse ou en cas de régime prescrit, des précautions particulières s’appliquent.

**Comment éviter de manger toujours la même chose ?**
Faites évoluer la liste avec les saisons, testez une nouvelle recette par semaine ou par quinzaine, et utilisez les épices et les herbes pour varier les goûts.

**Les plats préparés sont-ils à éviter absolument ?**
Mieux vaut les limiter et choisir, le cas échéant, ceux classés A ou B au Nutri-Score. Les conserves et surgelés nature (légumes, légumineuses, poisson) sont une bonne alternative rapide.

## Quand demander conseil
Demandez l’avis d’un médecin ou d’un diététicien si vous suivez un régime particulier, si vous allaitez et avez des questions sur votre alimentation, ou si l’alimentation de votre enfant vous inquiète (refus alimentaire durable, perte de poids). En cas de difficultés financières pour se nourrir, contactez le CCAS de votre mairie. En cas de malaise ou de réaction allergique grave, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...NC, slug: 'repas-rapides-equilibres-parents-fatigues-idees', category: 'alimentation',
    title: 'Repas rapides et équilibrés pour parents fatigués : idées en moins de 15 minutes',
    summary: 'Des associations simples à partir du placard, du réfrigérateur et du congélateur, pour manger correctement même les soirs où l’énergie manque.',
    tags: ['repas rapide', 'dîner rapide', 'recette facile', 'parents fatigués', 'repas équilibré', 'conserves', 'surgelés', 'légumineuses', 'œufs'],
    sources: [S.spf50astuces, S.ameliRepas, S.ameliRetour],
    body_md: `## En bref
- Les conserves nature (légumes, légumineuses, thon au naturel, sardines) et les légumes surgelés sont des alliés économiques pour préparer vite.
- Pâtes et semoule complètes cuisent rapidement : la semoule se réhydrate en quelques minutes.
- Les œufs, plusieurs fois par semaine, se préparent de nombreuses façons en quelques minutes.
- Après une naissance, l’Assurance Maladie conseille de manger varié et de boire beaucoup d’eau, et de ne pas faire de régime en cas d’allaitement.

## Comprendre
Les soirs de grande fatigue, la tentation est forte de sauter le repas ou de grignoter. Avoir en tête quelques associations « de secours », réalisables avec ce qu’on a dans les placards, aide à manger correctement sans effort.

La brochure « 50 petites astuces » de Santé publique France et Manger Bouger propose justement des idées rapides, à base de produits simples. Elle encourage aussi à cuisiner un peu plus que nécessaire quand on en a l’énergie, pour avoir des restes ou des portions à congeler.

Côté équilibre, l’Assurance Maladie conseille des fruits et légumes et des féculents (de préférence complets) à chaque repas, et d’alterner les sources de protéines : légumineuses, poisson, volaille, œufs.

## Au quotidien
**Des idées en moins de 15 minutes**, inspirées des astuces de Santé publique France :
- **Semoule express** : semoule complète réhydratée, légumes surgelés ou ratatouille, pois chiches en bocal.
- **Chili sans viande** : haricots rouges en conserve, tomates concassées, riz, herbes et épices.
- **Pâtes et pois cassés** cuits ensemble, avec des dés de poivron.
- **Assiette de la mer** : maquereau, sardines ou thon au naturel, pommes de terre vapeur, betterave sous vide.
- **Poisson nature**, frais ou surgelé, cuit au micro-ondes avec citron et aneth.
- **Œufs** : omelette aux légumes surgelés, œufs au plat ou mollets, avec du pain complet et une salade.
- **Soupe maison congelée** en portions, avec tartines et fromage.

**Une base de placard** pour ces repas : pâtes, riz et semoule complets, légumes secs, conserves de légumes, de légumineuses et de poisson, tomates concassées, épices et herbes séchées, huile de colza ou d’olive.

**Au congélateur** : légumes nature, poisson nature, portions de plats maison, herbes surgelées.

**Pour gagner encore du temps** :
- cuisinez le double quand vous en avez l’énergie et congelez ;
- un autocuiseur réduit fortement le temps de cuisson des légumes secs ;
- lentilles et pois cassés ne nécessitent pas de trempage.

**Pour vous, après la naissance** : gardez une bouteille d’eau près du lieu des tétées ou des biberons, et une collation simple à portée de main (fruit, yaourt, pain).

## Questions fréquentes
**Les conserves et les surgelés sont-ils aussi bons que le frais ?**
Santé publique France les recommande comme solutions rapides et économiques, en privilégiant les versions nature plutôt que les plats cuisinés.

**Faut-il faire tremper les légumes secs la veille ?**
Lentilles et pois cassés ne nécessitent pas de trempage. Haricots secs, pois chiches et fèves demandent au moins 12 heures de trempage, sauf si vous les achetez précuits, en bocal, en conserve ou surgelés.

**Peut-on manger la même chose que les enfants ?**
Souvent oui, en adaptant la texture et le sel pour les plus petits. Pour un bébé en diversification, suivez les conseils du médecin ou de la PMI.

**Et si on n’a vraiment pas faim le soir ?**
L’Assurance Maladie conseille de garder trois repas par jour à heures régulières. Les soirs sans appétit, un repas léger (soupe, yaourt, fruit, pain) peut suffire ; si vous allaitez, elle rappelle de ne pas faire de régime.

## Quand demander conseil
Parlez à votre médecin ou à votre sage-femme si vous perdez l’appétit durablement, si vous perdez du poids sans le vouloir, ou si la fatigue s’accompagne d’une tristesse persistante. En cas de difficultés pour vous nourrir, le CCAS de votre mairie peut vous orienter. En cas d’idées suicidaires, appelez le **3114**.

${FIN}`,
  },
  {
    ...PNC, slug: 'courses-avec-bebe-liste-placard-drive-nutri-score', category: 'vie-pratique',
    title: 'Faire les courses avec un bébé : liste type, placard de base, drive et Nutri-Score',
    summary: 'Organiser les courses quand on sort peu ou avec une poussette : une liste de base, le choix du drive ou de la livraison, les repères pour lire les étiquettes et les gestes pour la chaîne du froid.',
    tags: ['courses', 'liste de courses', 'drive', 'livraison courses', 'placard de base', 'Nutri-Score', 'courses avec bébé', 'budget alimentation', 'fin de marché'],
    sources: [S.spf50astuces, S.ameliRepas, S.spRetractation],
    body_md: `## En bref
- Faire une **liste avant d’acheter** évite les achats superflus : c’est la première astuce de Santé publique France pour les courses.
- Gardez en réserve des **basiques** : pâtes, semoule et riz complets, légumes secs, conserves nature, surgelés non cuisinés.
- Le **Nutri-Score** aide à comparer les produits : privilégiez ceux classés A ou B et limitez ceux classés D ou E.
- Drive, retrait en magasin ou livraison peuvent soulager les premières semaines ; pour les produits non alimentaires achetés en ligne, le droit de rétractation de 14 jours s’applique en principe, sauf exceptions.

## Comprendre
Avec un nouveau-né, faire les courses peut devenir un vrai défi : horaires des tétées, poussette dans les rayons, sacs lourds alors que l’Assurance Maladie conseille d’éviter de porter de lourdes charges les premières semaines après l’accouchement. Organiser les courses à l’avance permet de sortir moins souvent et de déléguer plus facilement.

La liste est aussi un outil d’équilibre et de budget. Santé publique France rappelle que les féculents, les légumes secs, les conserves nature et les produits de saison sont parmi les options les plus économiques, et que manger un peu moins de viande et de produits transformés, et davantage de produits de saison, permet de faire des économies. Boire l’eau du robinet réduit aussi les dépenses et les déchets.

## Au quotidien
**Une liste type, à adapter :**
- **Placard** : pâtes, riz, semoule (de préférence complets), lentilles, pois chiches, conserves de légumes et de poisson, tomates concassées, huile de colza ou d’olive, épices, flocons d’avoine, pain de mie complet ou pain à congeler.
- **Frais** : légumes et fruits de saison, œufs, yaourts et fromages, une source de protéines pour quelques jours.
- **Congélateur** : légumes nature, poisson nature, fruits, pain.
- **Bébé et maison** : couches, produits d’hygiène simples, produits d’entretien.

**Organiser la liste par rayon** fait gagner du temps en magasin. Une liste partagée sur téléphone permet à l’autre parent ou à un proche de faire les courses à votre place.

**Lire les étiquettes rapidement :**
- comparez avec le Nutri-Score, à l’intérieur d’une même catégorie ;
- choisissez des produits avec peu d’additifs ;
- regardez le prix au kilo plutôt que le prix du paquet.

**Drive, retrait ou livraison :**
- préparez la commande pendant une sieste de bébé ;
- gardez un panier « habituel » à reprendre chaque semaine ;
- au retour, rangez d’abord les produits frais et surgelés au réfrigérateur et au congélateur.

**Avec bébé en magasin** : choisissez des heures calmes, préférez le porte-bébé ou la poussette, et ne laissez jamais bébé seul, ni dans le chariot ni dans la voiture.

**Pour le budget** : les fins de marché ou les commerces à prix réduits permettent parfois d’acheter fruits et légumes moins cher.

## Questions fréquentes
**Le drive coûte-t-il plus cher ?**
Cela dépend des enseignes et des frais éventuels. Il aide souvent à limiter les achats impulsifs, puisque l’on suit sa liste.

**Peut-on retourner des courses alimentaires livrées ?**
Les biens périssables font partie des exceptions au droit de rétractation. En cas de produit abîmé ou manquant, contactez le service client du vendeur.

**Le Nutri-Score suffit-il pour bien choisir ?**
C’est un repère utile pour comparer des produits similaires. L’équilibre se construit surtout avec des produits bruts, variés et de saison.

## Quand demander conseil
Si vous avez du mal à remplir le réfrigérateur faute de moyens, le CCAS de votre mairie, la Caf ou une assistante sociale peuvent vous orienter vers des aides. Si la fatigue vous empêche de faire face au quotidien, parlez-en à votre médecin ou à votre sage-femme ; en cas d’idées suicidaires, appelez le **3114**.

${FIN}`,
  },
  {
    ...NC, slug: 'parent-solo-organiser-quotidien-aides-relais', category: 'vie-pratique',
    title: 'Parent solo : organiser le quotidien, trouver des relais et garder du temps pour soi',
    summary: 'Les aides spécifiques aux parents isolés, les relais possibles autour de vous, l’organisation entre deux foyers et l’importance de prendre soin de vous.',
    tags: ['parent solo', 'famille monoparentale', 'parent isolé', 'mère célibataire', 'père seul', 'résidence alternée', 'aides parent isolé', 'CMG parent isolé', 'temps pour soi'],
    sources: [S.mpediaSolos, S.cafAad, S.spCmg],
    body_md: `## En bref
- Élever seul un enfant demande une organisation solide et des **relais** : entourage, autres parents, professionnels et services sociaux.
- Certaines aides tiennent compte de la situation de parent isolé : par exemple, le **CMG** peut être versé jusqu’aux 12 ans de l’enfant (au lieu de 6 ans), et l’**aide à domicile** cofinancée par la Caf est ouverte au parent isolé engagé dans une démarche d’insertion professionnelle.
- En cas de séparation avec résidence alternée, des passages de relais apaisés, dans un lieu neutre comme la sortie de l’école, aident les enfants.
- Prendre du temps pour soi, sans culpabiliser, fait partie de l’organisation : un parent qui prend soin de lui est plus disponible pour ses enfants.

## Comprendre
Les parents solos, qu’ils élèvent leur enfant seuls ou en alternance avec l’autre parent, cumulent souvent toutes les tâches : travail, trajets, repas, rendez-vous, enfant malade. mpedia souligne que les imprévus, comme un enfant malade, peuvent fragiliser l’emploi, en particulier en période d’essai, et que le coût d’une garde ponctuelle peut être élevé.

**Les professionnels à solliciter** cités par mpedia : médecin, médecin de l’enfant, PMI, CCAS, CMP, Caf. L’assistante sociale du CCAS peut mettre en place certains accompagnements, comme une garde ponctuelle pendant les maladies de l’enfant ou pour faire les courses.

**Les aides de la Caf** : le CMG emploi direct est versé, pour un parent seul, jusqu’aux 12 ans de l’enfant, à condition de travailler (ou de se trouver dans une situation assimilée ou exemptée). Depuis le 1er décembre 2025, en cas de résidence alternée réelle, chacun des deux parents peut percevoir un CMG calculé selon sa propre situation. L’aide et l’accompagnement à domicile (AAD) peuvent intervenir lors d’une séparation ou pour un parent isolé en insertion.

## Au quotidien
**Construire son réseau :**
- notez trois à cinq personnes à appeler en cas d’imprévu (proches, voisins, parents d’élèves) ;
- proposez des échanges de services avec d’autres parents (sorties d’école, mercredis) ;
- repérez les lieux d’accueil enfants-parents et les associations de parents solos près de chez vous.

**Simplifier la logistique :**
- planifiez les repas de la semaine et faites des courses groupées ;
- préparez les sacs et vêtements la veille ;
- en résidence alternée, dupliquez vêtements et affaires du quotidien pour limiter les valises.

**Entre deux foyers :**
- privilégiez des transitions calmes, dans un lieu neutre ;
- évitez les conflits devant les enfants et ne les interrogez pas sur l’autre parent ;
- permettez-leur d’appeler librement l’autre parent.

**Préserver du temps pour soi** : un loisir, une sortie, un moment de repos régulier. mpedia rappelle que ces moments sont souvent les premiers sacrifiés, alors qu’ils sont essentiels.

## Questions fréquentes
**Quelles aides demander en priorité ?**
Faites le point avec votre Caf ou une assistante sociale : elles peuvent vérifier vos droits selon votre situation (ressources, mode de garde, logement).

**Comment gérer un enfant malade sans relais ?**
Renseignez-vous sur votre convention collective et sur le congé enfant malade, et contactez le CCAS pour savoir si une garde ponctuelle est possible près de chez vous.

**Où trouver du soutien psychologique ?**
Le médecin traitant, la PMI ou un CMP peuvent vous orienter. Un psychologue peut aussi accompagner les enfants lors d’une séparation.

## Quand demander conseil
Parlez à votre médecin si la fatigue, la tristesse ou l’anxiété s’installent. En cas d’idées suicidaires, appelez le **3114**, à toute heure. Si un enfant est en danger, appelez le **119** ; en cas de violences conjugales, le **3919** ; en cas d’urgence, le **17**, le **15** ou le **112**.

${FIN}`,
  },
];
