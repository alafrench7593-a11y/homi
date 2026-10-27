/** Guide complet — lot 26 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ».
 * Thème : droits, démarches et aides (prestations Caf, aides à la garde, impôts, congés, état civil, autorité parentale, séparation, santé, logement).
 * Les montants cités sont ceux affichés par les pages officielles consultées le 27/10/2026 : ils doivent être revérifiés sur caf.fr / service-public.fr. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27. Service-Public.fr redirige désormais vers service-public.gouv.fr. `published` = date « Vérifié le » affichée par la page.
const SP = 'https://www.service-public.gouv.fr/particuliers/vosdroits/';
const S = {
  spAB: { label: 'Service-Public.gouv.fr — Allocation de base de la Paje versée à la naissance d’un enfant', url: `${SP}F2552`, consulted_on: C, published: '2026-04-01' },
  spAF: { label: 'Service-Public.gouv.fr — Allocations familiales (famille de 2 enfants ou plus)', url: `${SP}F13213`, consulted_on: C, published: '2026-06-01' },
  spCF: { label: 'Service-Public.gouv.fr — Famille de 3 enfants et plus : complément familial', url: `${SP}F13214`, consulted_on: C, published: '2026-04-01' },
  spCMG: { label: 'Service-Public.gouv.fr — Complément de libre choix du mode de garde (CMG) : emploi direct', url: `${SP}F39152`, consulted_on: C, published: '2026-06-26' },
  spCMGs: { label: 'Service-Public.gouv.fr — Complément de libre choix du mode de garde (CMG) : structure (micro-crèche, organisme habilité)', url: `${SP}F345`, consulted_on: C, published: '2026-04-01' },
  cafEaje: { label: 'Caf des Pyrénées-Orientales (caf.fr) — Barème des participations familiales 2026 en établissement d’accueil du jeune enfant', url: 'https://www.caf.fr/sites/default/files/medias/661/Espace-Partenaires/Documents-Partenaires/2026-Baremes-Participation-Famille-Eaje.pdf', consulted_on: C, published: '2025-12-15' },
  spF8: { label: 'Service-Public.gouv.fr — Impôt sur le revenu : frais de garde d’enfant hors du domicile (crédit d’impôt)', url: `${SP}F8`, consulted_on: C, published: '2026-01-01' },
  spF12: { label: 'Service-Public.gouv.fr — Impôt sur le revenu : crédit d’impôt pour l’emploi d’un salarié à domicile', url: `${SP}F12`, consulted_on: C, published: '2026-04-15' },
  spQF: { label: 'Service-Public.gouv.fr — Impôt sur le revenu : quotient familial d’un couple marié ou pacsé', url: `${SP}F2705`, consulted_on: C, published: '2026-04-15' },
  spEnfCharge: { label: 'Service-Public.gouv.fr — Impôt sur le revenu : enfant mineur à charge', url: `${SP}F2633`, consulted_on: C, published: '2026-01-01' },
  spARS: { label: 'Service-Public.gouv.fr — Allocation de rentrée scolaire (ARS)', url: `${SP}F1878`, consulted_on: C, published: '2026-08-04' },
  spCNS: { label: 'Service-Public.gouv.fr — Congé supplémentaire de naissance du salarié du secteur privé', url: `${SP}F39685`, consulted_on: C, published: '2026-06-03' },
  spCNSfaq: { label: 'Service-Public.gouv.fr — Congé de naissance supplémentaire : les réponses à vos questions (FAQ)', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18982', consulted_on: C, published: '2026-07-03' },
  spNom: { label: 'Service-Public.gouv.fr — Choix du nom de famille d’un enfant par son père et sa mère', url: `${SP}F10505`, consulted_on: C, published: '2026-08-06' },
  spLivret: { label: 'Service-Public.gouv.fr — Livret de famille : délivrance à la naissance du premier enfant', url: `${SP}F11991`, consulted_on: C, published: '2026-08-12' },
  spLivretMaj: { label: 'Service-Public.gouv.fr — Mise à jour du livret de famille à la suite d’un changement', url: `${SP}F18910`, consulted_on: C, published: '2023-01-16' },
  spAP: { label: 'Service-Public.gouv.fr — Exercice de l’autorité parentale', url: `${SP}F3132`, consulted_on: C, published: '2024-05-24' },
  spResidence: { label: 'Service-Public.gouv.fr — Résidence de l’enfant en cas de séparation des parents', url: `${SP}F18785`, consulted_on: C, published: '2023-10-13' },
  spAlternee: { label: 'Service-Public.gouv.fr — Comment obtenir la garde alternée d’un enfant ?', url: `${SP}F1329`, consulted_on: C, published: '2023-10-13' },
  spIFPA: { label: 'Service-Public.gouv.fr — Intermédiation financière des pensions alimentaires (IFPA)', url: `${SP}F36407`, consulted_on: C, published: '2026-04-01' },
  spASF: { label: 'Service-Public.gouv.fr — Allocation de soutien familial (ASF) : parents séparés', url: `${SP}F815`, consulted_on: C, published: '2026-04-01' },
  spSolo: { label: 'Service-Public.gouv.fr — Vous élevez seul votre ou vos enfants : aides financières', url: `${SP}F38245`, consulted_on: C, published: '2026-04-30' },
  cafSolo: { label: 'Caf du Nord (caf.fr) — Je vis seul(e) avec mon enfant', url: 'https://www.caf.fr/allocataires/caf-du-nord/offre-de-service/vie-personnelle/je-vis-seule-avec-mon-enfant', consulted_on: C },
  spEnfMalade: { label: 'Service-Public.gouv.fr — Congé pour enfant malade du salarié du secteur privé', url: `${SP}F151`, consulted_on: C, published: '2026-03-27' },
  spAJPP: { label: 'Service-Public.gouv.fr — Allocation journalière de présence parentale (AJPP)', url: `${SP}F15132`, consulted_on: C, published: '2026-06-01' },
  spCPP: { label: 'Service-Public.gouv.fr — Congé de présence parentale du salarié dans le secteur privé', url: `${SP}F1631`, consulted_on: C, published: '2026-06-15' },
  ameliVitale: { label: 'ameli.fr — Rattachement de l’enfant sur la carte Vitale des parents', url: 'https://www.ameli.fr/assure/remboursements/etre-bien-rembourse/carte-vitale/rattachement-de-l-enfant-sur-la-carte-vitale-des-parents', consulted_on: C, published: '2026-02-26' },
  ameli20: { label: 'ameli.fr — Enfant et adolescent : 20 examens de suivi médical', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/enfant-et-adolescent-20-examens-de-suivi-medical', consulted_on: C },
  ameliCSS: { label: 'ameli.fr — Qui peut bénéficier de la Complémentaire santé solidaire ?', url: 'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante/complementaire-sante-beneficiaires', consulted_on: C, published: '2026-03-31' },
  spCNI: { label: 'Service-Public.gouv.fr — Carte d’identité d’un mineur : première demande', url: `${SP}F1342`, consulted_on: C, published: '2026-04-27' },
  spAST: { label: 'Service-Public.gouv.fr — Autorisation de sortie du territoire (AST)', url: `${SP}F1359`, consulted_on: C, published: '2026-03-20' },
  spAPL: { label: 'Service-Public.gouv.fr — Aide personnalisée au logement (APL)', url: `${SP}F12006`, consulted_on: C, published: '2026-07-01' },
  spDemenag: { label: 'Service-Public.gouv.fr — Prime de déménagement', url: `${SP}F2008`, consulted_on: C, published: '2026-04-01' },
  spParent: { label: 'Service-Public.gouv.fr — Je deviens parent', url: `${SP}F16225`, consulted_on: C, published: '2026-06-01' },
  cafAttends: { label: 'caf.fr — J’attends un enfant', url: 'https://www.caf.fr/allocataires/aides-et-demarches/ma-situation/vie-personnelle/j-attends-un-enfant', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const VERIF = 'Montants à vérifier sur caf.fr / service-public.fr : les chiffres cités sont ceux affichés par les pages officielles consultées en octobre 2026 et peuvent être revalorisés ou modifiés.';
const SOS = 'Si ces démarches s’ajoutent à une fatigue ou à une détresse qui vous dépasse, le 3114 répond 24 h/24, gratuitement. Si un enfant est en danger, appelez le 119. En cas d’urgence vitale, composez le 15 ou le 112.';
const END = 'Cet article informe et vous aide à vous repérer ; il ne remplace pas un professionnel (conseiller de la Caf, de la MSA, de l’Assurance Maladie ou des impôts, travailleur social, avocat ou juriste) qui pourra étudier votre situation.';
const BASE: Pick<LibArticle, 'status' | 'category'> = { status: 'to_review', category: 'droits-demarches' };

export const GUIDE_B26: LibArticle[] = [
  // ───────────────────────────── Prestations familiales ─────────────────────────────
  {
    ...BASE,
    slug: 'allocation-de-base-paje-conditions-montant-duree',
    title: 'L’allocation de base de la Paje : qui y a droit, combien et jusqu’à quand ?',
    summary: 'L’allocation de base aide à faire face aux dépenses d’un enfant de moins de 3 ans, sous conditions de ressources : plafonds, montant plein ou partiel, durée et démarches.',
    journeys: ['pregnant', 'newborn'],
    tags: ['allocation de base', 'Paje', 'Caf', 'MSA', 'aide naissance', 'enfant de moins de 3 ans', 'plafond de ressources', 'jumeaux'],
    max_age_months: 36,
    sources: [S.spAB, S.cafAttends],
    body_md: `Après la prime à la naissance, une autre aide de la prestation d’accueil du jeune enfant (Paje) peut prendre le relais chaque mois : l’allocation de base. Elle n’est pas automatique pour tout le monde, car elle dépend de vos ressources. Voici comment elle fonctionne.

## En bref
- L’allocation de base est versée pour un enfant à charge de moins de 3 ans, si les ressources du foyer ne dépassent pas un plafond.
- Elle existe à deux niveaux : un montant plein et un montant partiel, selon vos revenus.
- Elle commence le mois suivant la naissance et s’arrête le mois précédant le 3e anniversaire de l’enfant.
- Elle n’est versée que pour un seul enfant de moins de 3 ans à la fois, sauf naissances multiples.
- ${VERIF}

## Comprendre
**Les ressources prises en compte.** Pour les droits 2026, la Caf ou la MSA retient les revenus nets catégoriels de 2024. Le plafond dépend du nombre d’enfants à charge et de la composition du foyer : couple avec un seul revenu, couple avec deux revenus, ou parent isolé. Un couple est considéré comme ayant deux revenus lorsque chacun a perçu au moins 6 306 € par an d’activité professionnelle (en 2024).

**Les montants affichés en 2026.** Service-Public indique 198,16 € par mois pour le montant plein et 99,08 € pour le montant partiel. À titre d’exemple, pour un enfant, le plafond est de 37 118 € pour un couple à un revenu et de 49 054 € pour un couple à deux revenus ou un parent isolé ; au-dessus, il n’y a pas de droit.

**La durée.** Le versement débute le 1er jour du mois qui suit la naissance et se poursuit jusqu’au mois précédant les 3 ans de l’enfant. En cas de décès de l’enfant, l’allocation est prolongée automatiquement pendant 3 mois.

**Les cumuls.** Elle peut se cumuler avec l’allocation journalière de présence parentale (AJPP). Elle ne se cumule pas avec le complément familial, ni avec une seconde allocation de base pour un autre enfant de moins de 3 ans. En cas de jumeaux ou de triplés, une allocation est versée pour chaque enfant né lors du même accouchement.

## Au quotidien
- **Simulez vos droits** sur caf.fr dès la grossesse : la simulation vous donne une idée du montant possible avant de faire vos comptes.
- **Déclarez la naissance rapidement** dans votre espace Mon Compte de la Caf (ou auprès de la MSA). Les pièces demandées sont une copie lisible du livret de famille ou un extrait d’acte de naissance de l’enfant.
- **Signalez tout changement** : séparation, mariage, perte d’emploi, déménagement. Ces changements peuvent modifier le montant.
- **Notez les dates clés** dans votre agenda : début du versement, puis fin au mois précédant les 3 ans.
- **Anticipez la suite** : pour une famille de 3 enfants ou plus, le complément familial peut être étudié quand le plus jeune atteint 3 ans.

## Questions fréquentes
**Faut-il faire une demande spéciale pour l’allocation de base ?** Si vous êtes déjà connu de la Caf, la déclaration de la naissance permet d’étudier vos droits. Si vous ne l’êtes pas, la Caf indique que l’on crée son compte en faisant la demande de prime à la naissance, puis que l’on déclare la naissance.

**J’ai un enfant de 2 ans et un nouveau bébé : vais-je toucher deux allocations ?** Non : l’allocation de base n’est versée que pour un seul enfant de moins de 3 ans à la fois, sauf naissances multiples.

**Nous sommes juste au-dessus du seuil du montant plein : que se passe-t-il ?** Entre le seuil du montant plein et le plafond, c’est le montant partiel qui s’applique. Au-delà du plafond, l’allocation n’est pas due.

**Et en cas d’adoption ?** Les règles sont différentes : Service-Public y consacre une fiche spécifique.

## Quand demander conseil
Si votre situation est particulière (revenus irréguliers, séparation récente, travail à l’étranger, outre-mer), prenez rendez-vous avec votre Caf ou votre MSA, ou appelez Allô Service Public. Un travailleur social de la Caf peut aussi vous accompagner si le budget devient difficile. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'allocations-familiales-a-partir-du-deuxieme-enfant',
    title: 'Allocations familiales : ce qui change à l’arrivée du 2e enfant',
    summary: 'Les allocations familiales sont versées à partir de 2 enfants à charge de moins de 20 ans ; leur montant dépend des ressources, du nombre et de l’âge des enfants.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['allocations familiales', 'deuxième enfant', '2e enfant', 'troisième enfant', 'majoration pour âge', 'forfait 20 ans', 'Caf', 'MSA'],
    sources: [S.spAF],
    body_md: `En France, les allocations familiales ne sont pas versées pour un premier enfant seul : elles commencent quand la famille compte au moins deux enfants à charge. Leur montant varie selon vos revenus, le nombre d’enfants et leur âge.

## En bref
- Il faut au moins 2 enfants à charge de moins de 20 ans, qui résident en France avec vous.
- Le montant dépend des ressources du foyer : trois tranches existent, avec des plafonds qui augmentent selon le nombre d’enfants.
- Une majoration s’ajoute quand un enfant atteint un certain âge (18 ans pour les enfants nés après le 1er mars 2012).
- Si vous êtes déjà allocataire, l’ouverture des droits est automatique une fois la naissance déclarée.
- ${VERIF}

## Comprendre
**Les ressources retenues.** Pour 2026, la Caf retient le revenu net catégoriel de 2024. Pour 2 enfants, Service-Public affiche par exemple 152,25 € par mois si les ressources annuelles ne dépassent pas 79 980 €, 76,13 € entre 79 980 € et 106 604 €, et 38,07 € au-delà. Pour 3 enfants, le montant de base est de 347,32 € sous le premier plafond (86 644 €).

**La majoration pour âge.** Pour un enfant né après le 1er mars 2012, une majoration est versée à partir de ses 18 ans (à partir de 14 ans pour un enfant né avant cette date). Dans une famille de 2 enfants seulement, elle n’est pas versée pour l’aîné.

**Le forfait à 20 ans.** À 20 ans, un enfant n’est plus compté à charge. Dans une famille d’au moins 3 enfants, un forfait temporaire peut être versé automatiquement jusqu’au mois précédant ses 21 ans, s’il vit toujours chez vous et que ses revenus d’activité ne dépassent pas un plafond.

**Le complément dégressif.** Si vos revenus dépassent de peu un plafond, un complément dégressif peut atténuer la baisse.

**La résidence.** L’enfant doit vivre en France. Une absence de plus de 3 mois, même seul, suspend les allocations, sauf exceptions (études, soins, apprentissage d’une langue, formation).

## Au quotidien
- **Déclarez la naissance du 2e enfant** dans votre espace Caf ou MSA : une copie du livret de famille ou de l’acte de naissance suffit en général.
- **Retenez le rythme de versement** : les droits s’ouvrent le mois suivant la naissance, et les allocations sont versées à terme échu (les droits d’un mois sont payés au début du mois suivant).
- **Pensez à votre budget sur la durée** : le montant évolue avec l’âge des enfants et vos ressources.
- **Vous n’êtes pas encore allocataire ?** Il faut remplir une déclaration de situation et l’envoyer à la Caf, ou faire la démarche en ligne.
- **Signalez les changements** (séparation, chômage, déménagement) rapidement pour éviter des rappels de sommes.

## Questions fréquentes
**Je n’ai qu’un enfant : n’ai-je droit à rien ?** Les allocations familiales commencent à 2 enfants, mais d’autres aides existent pour un premier enfant, comme la prime à la naissance ou l’allocation de base, sous conditions de ressources.

**Nos enfants vivent en résidence alternée : qui touche les allocations ?** Le partage des allocations entre parents séparés obéit à des règles spécifiques ; Service-Public y consacre une fiche dédiée. Parlez-en avec votre Caf.

**Mon aîné va avoir 20 ans : allons-nous perdre une partie des allocations ?** Oui, il cessera d’être compté. Dans une famille d’au moins 3 enfants, le forfait temporaire peut amortir la baisse pendant un an, si les conditions sont réunies.

## Quand demander conseil
En cas de doute sur votre tranche, de changement de situation ou de séjour prolongé à l’étranger, contactez votre Caf ou votre MSA, ou Allô Service Public. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'complement-familial-famille-de-trois-enfants',
    title: 'Le complément familial : une aide pour les familles de 3 enfants et plus',
    summary: 'Le complément familial est versé, sous conditions de ressources, aux familles d’au moins 3 enfants âgés de 3 à moins de 21 ans ; il prend souvent le relais de l’allocation de base.',
    journeys: ['child', 'newborn'],
    tags: ['complément familial', 'famille nombreuse', 'trois enfants', '3 enfants', 'Caf', 'MSA', 'plafond de ressources'],
    sources: [S.spCF, S.spAB],
    body_md: `Quand une famille compte au moins trois enfants et que le plus jeune a 3 ans, une aide spécifique peut s’ajouter aux allocations familiales : le complément familial. Il est soumis à conditions de ressources et ne demande généralement pas de démarche particulière.

## En bref
- Il faut au moins 3 enfants à charge, tous âgés de 3 ans à moins de 21 ans.
- Il est versé chaque mois à partir du 3e anniversaire du plus jeune enfant.
- Deux niveaux de montant existent, le plus élevé étant réservé aux revenus les plus modestes.
- Il ne se cumule pas avec l’allocation de base de la Paje.
- ${VERIF}

## Comprendre
**Pourquoi « à partir de 3 ans » ?** Tant qu’un enfant a moins de 3 ans, c’est l’allocation de base qui peut être versée, et les deux aides ne se cumulent pas. Le complément familial prend donc souvent le relais quand le plus jeune souffle ses 3 bougies.

**Les plafonds 2026.** Ils sont calculés sur le revenu net catégoriel de 2024. Pour 3 enfants, Service-Public affiche un plafond de 44 735 € pour un couple à un revenu et de 54 724 € pour un couple à deux revenus ou un parent isolé, avec 7 456 € de plus par enfant supplémentaire. Si vous dépassez de peu le plafond, une allocation différentielle peut être versée.

**Les montants affichés.** La page indique 297,27 € par mois pour les ressources les plus faibles et 198,16 € pour les ressources intermédiaires, jusqu’au plafond. Les seuils précis dépendent de votre situation (un ou deux revenus, parent isolé, nombre d’enfants).

**Pas de démarche en principe.** Les services fiscaux transmettent les informations à la Caf ou à la MSA. Une déclaration n’est nécessaire que si cette transmission n’a pas eu lieu.

## Au quotidien
- **Vérifiez votre espace Caf** dans les mois qui suivent les 3 ans du plus jeune : le complément familial doit apparaître si vous y avez droit.
- **Déclarez vos revenus chaque année** aux impôts : c’est cette déclaration qui permet le calcul.
- **Signalez les changements familiaux** (naissance, séparation, mariage, chômage) pour que vos droits soient revus.
- **Faites une simulation** sur caf.fr si vos revenus ont changé.
- **Gardez une vue d’ensemble** : allocations familiales, complément familial et allocation de rentrée scolaire peuvent coexister, chacune avec ses propres règles.

## Questions fréquentes
**Mon 4e enfant vient de naître : le complément familial s’arrête-t-il ?** Tous les enfants pris en compte doivent avoir au moins 3 ans. Avec un nouveau bébé, c’est l’allocation de base qui peut être étudiée pour lui, et les deux ne se cumulent pas. Faites le point avec votre Caf.

**Je n’ai rien reçu alors que mes trois enfants ont plus de 3 ans.** Vérifiez que vos revenus ont bien été transmis et que vous êtes sous le plafond. Si besoin, faites une déclaration auprès de la Caf ou de la MSA.

**Les règles sont-elles les mêmes outre-mer ?** Non, les conditions et montants diffèrent dans les départements d’outre-mer.

## Quand demander conseil
Votre Caf ou votre MSA peut vérifier votre dossier et vous expliquer le calcul. Si vous rencontrez des difficultés financières, le service social de la Caf ou le centre communal d’action sociale (CCAS) de votre mairie peut vous accompagner. ${SOS}

${END}`,
  },
  // ───────────────────────────── Aides à la garde ─────────────────────────────
  {
    ...BASE,
    category: 'ecole-garde',
    slug: 'cmg-emploi-direct-assistante-maternelle-garde-a-domicile',
    title: 'Le CMG pour une assistante maternelle ou une garde à domicile : ce qui a changé depuis 2025',
    summary: 'Le complément de libre choix du mode de garde (CMG) aide à payer une assistante maternelle ou une garde à domicile ; son calcul a été réformé en septembre 2025.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['CMG', 'complément mode de garde', 'assistante maternelle', 'nounou', 'garde à domicile', 'Pajemploi', 'réforme CMG 2025', 'résidence alternée'],
    max_age_months: 144,
    sources: [S.spCMG, S.spCNSfaq],
    body_md: `Employer une assistante maternelle agréée ou une garde à domicile représente un budget. Le complément de libre choix du mode de garde (CMG) « emploi direct » en prend une partie en charge. Son mode de calcul a changé en septembre 2025 : voici l’essentiel à connaître.

## En bref
- Le CMG emploi direct concerne les parents qui emploient eux-mêmes une assistante maternelle agréée ou une garde à domicile.
- L’enfant doit en général avoir moins de 6 ans ; pour un parent isolé, l’aide peut aller jusqu’aux 12 ans de l’enfant.
- Depuis septembre 2025, le montant dépend des ressources, du nombre d’enfants, du coût horaire et du nombre d’heures de garde.
- Depuis le 1er décembre 2025, en résidence alternée, chaque parent peut recevoir son propre CMG.
- ${VERIF}

## Comprendre
**La condition d’activité.** En couple, il suffit en principe qu’un des deux travaille ; un parent seul doit travailler. Des exceptions existent (études, service civique, AAH, RSA avec inscription comme demandeur d’emploi, ASS). Les indemnités journalières, le chômage indemnisé et la formation rémunérée sont assimilés à une activité.

**Le nouveau calcul.** Le CMG est désormais calculé à partir de vos ressources mensuelles, du nombre d’enfants à charge, du coût horaire (salaire et indemnités d’entretien et de repas pour une assistante maternelle, dans la limite d’un plafond horaire) et du nombre d’heures. Si la réforme a fait baisser votre montant, un complément peut être versé automatiquement sous conditions (recours suffisant à la garde entre mars et mai 2025 et ressources sous un plafond).

**Les cotisations.** Elles sont prises en charge à 100 % pour une assistante maternelle agréée et à 50 % pour une garde à domicile, dans la limite d’un plafond.

**Les cumuls.** Le CMG peut se cumuler avec la PreParE en cas de temps partiel. Il ne se cumule pas, pour un même enfant, avec le congé de naissance supplémentaire, sauf pour les enfants nés entre le 1er janvier et le 30 juin 2026.

## Au quotidien
- **Faites une simulation** avant de signer un contrat : le simulateur officiel tient compte du nouveau calcul.
- **Inscrivez-vous comme employeur sur Pajemploi**, puis déclarez chaque mois la rémunération. Pajemploi calcule le CMG et vous indique ce qui reste à payer.
- **Pensez à l’option Pajemploi+** : avec l’accord de votre salarié, Pajemploi prélève le reste à charge et verse le salaire, ce qui évite d’avancer la totalité.
- **Faites la première demande** auprès de la Caf (avec un compte) ou de la MSA.
- **Signalez vos changements** (naissance, séparation, chômage, déménagement) : ils peuvent modifier le calcul.

## Questions fréquentes
**Le CMG est-il versé dès le premier mois ?** Il peut être versé à partir du mois précédant la demande, si les conditions sont remplies. Il s’arrête le mois civil suivant celui où une condition n’est plus remplie.

**Nous sommes séparés, en résidence alternée : comment ça marche ?** Chaque parent peut recevoir un CMG distinct, calculé selon sa propre situation. Les montants peuvent donc différer. La résidence alternée doit être effective.

**La micro-crèche est-elle concernée ?** Pas par le CMG emploi direct : la micro-crèche relève du « CMG structure », qui a ses propres règles.

## Quand demander conseil
Pour un calcul précis, contactez votre Caf ou votre MSA, Pajemploi pour les déclarations, ou le relais petite enfance de votre commune, qui accompagne parents et assistantes maternelles. ${SOS}

${END}`,
  },
  {
    ...BASE,
    category: 'ecole-garde',
    slug: 'cmg-structure-micro-creche-organisme-habilite',
    title: 'Micro-crèche ou organisme de garde à domicile : le CMG « structure » expliqué',
    summary: 'Quand votre enfant est gardé en micro-crèche ou par un organisme habilité, le CMG structure peut couvrir jusqu’à 85 % des frais, dans la limite de plafonds.',
    journeys: ['newborn', 'child'],
    tags: ['CMG structure', 'micro-crèche', 'organisme agréé', 'garde à domicile', 'horaires atypiques', 'AEEH', 'Caf'],
    max_age_months: 72,
    sources: [S.spCMGs],
    body_md: `Toutes les solutions d’accueil ne sont pas financées de la même manière. Quand votre enfant est accueilli dans une micro-crèche ou gardé chez vous par une association ou une entreprise agréée, une aide spécifique peut réduire la facture : le complément de libre choix du mode de garde (CMG) dit « structure ».

## En bref
- Le CMG structure concerne la garde en micro-crèche (12 places au plus, facturant au plus 10 € de l’heure) ou par une association ou entreprise agréée employant des salariés à domicile.
- L’enfant doit avoir moins de 6 ans.
- L’aide couvre jusqu’à 85 % des frais, dans la limite de plafonds mensuels qui dépendent des ressources, de la composition du foyer et de l’âge de l’enfant.
- Des majorations existent pour les horaires atypiques, un parent bénéficiaire de l’AAH ou un enfant bénéficiaire de l’AEEH.
- ${VERIF}

## Comprendre
**La condition d’activité.** Comme pour le CMG emploi direct, il faut en principe qu’un des deux parents travaille (ou le parent seul), avec des exceptions et des situations assimilées (indemnités journalières, chômage indemnisé, formation rémunérée).

**Les plafonds.** Service-Public cite par exemple, pour un enfant de moins de 3 ans, un plafond allant jusqu’à 992,12 € par mois pour un couple aux ressources les plus faibles et jusqu’à 1 289,77 € pour un parent isolé. Ils varient selon que l’enfant a moins de 3 ans ou de 3 à 6 ans, et selon vos revenus.

**Les majorations.** Elles s’ajoutent sans dépasser 85 % des frais : +10 % pour une garde en horaires atypiques (au moins 25 heures par mois le soir, la nuit, le dimanche ou les jours fériés), +30 % si un parent perçoit l’AAH, +30 % si l’enfant ouvre droit à l’AEEH.

**Le temps partiel.** Le CMG structure peut se cumuler avec la PreParE. Si vous travaillez à 50 % ou moins, il est divisé par deux ; entre 50 % et 80 %, il est versé en totalité. Il n’est pas possible si vous avez cessé toute activité.

## Au quotidien
- **Demandez à la structure son mode de financement** : applique-t-elle le barème de la Caf, ou fixe-t-elle ses tarifs en relevant du CMG structure ? Votre Caf pourra vous le confirmer.
- **Comparez le reste à charge** plutôt que le tarif affiché : faites la simulation officielle avec le tarif horaire et le nombre d’heures prévus.
- **Faites la demande à la Caf** (ou à la MSA, dans le premier mois de garde, avec le certificat rempli par la micro-crèche).
- **Fournissez chaque mois** l’attestation de garde ou la facture acquittée.
- **Gardez vos factures** : elles serviront aussi pour la déclaration de revenus et le crédit d’impôt.

## Questions fréquentes
**Le CMG est-il versé pour chacun de mes enfants ?** En micro-crèche, il est versé par enfant gardé. Pour un organisme de garde à domicile, il est identique quel que soit le nombre d’enfants.

**Quand s’arrête-t-il ?** En micro-crèche, le premier jour du mois civil qui suit celui où une condition n’est plus remplie, par exemple les 6 ans de l’enfant.

**Puis-je aussi bénéficier du crédit d’impôt ?** Les frais de garde hors du domicile peuvent ouvrir droit à un crédit d’impôt, après déduction du CMG perçu.

## Quand demander conseil
Votre Caf ou votre MSA, ainsi que le relais petite enfance de votre commune, peuvent vous aider à comparer les solutions. ${SOS}

${END}`,
  },
  {
    ...BASE,
    category: 'ecole-garde',
    slug: 'tarif-creche-calcul-participation-familiale',
    title: 'Combien coûte une place en crèche ? Comprendre le calcul du tarif horaire',
    summary: 'Dans les crèches financées par la Caf, le tarif horaire dépend de vos ressources et du nombre d’enfants à charge, selon un barème national avec un plancher et un plafond.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['tarif crèche', 'prix crèche', 'barème Caf', 'taux d’effort', 'PSU', 'participation familiale', 'crèche familiale', 'micro-crèche'],
    max_age_months: 72,
    sources: [S.cafEaje, S.spCMGs],
    body_md: `Beaucoup de parents découvrent avec surprise que deux familles peuvent payer un tarif très différent pour la même crèche. C’est voulu : dans les établissements financés par la Caf, le prix de l’heure dépend des ressources du foyer et du nombre d’enfants. Voici comment le calcul fonctionne.

## En bref
- Dans les crèches conventionnées par la Caf, le tarif horaire est calculé selon un barème national appelé « taux d’effort ».
- Il s’applique à vos ressources mensuelles et diminue quand le nombre d’enfants à charge augmente.
- Un plancher et un plafond de ressources encadrent le calcul.
- Selon son mode de financement, une micro-crèche applique ce barème ou fixe ses propres tarifs : dans ce second cas, renseignez-vous sur le CMG structure.
- ${VERIF}

## Comprendre
**Le taux d’effort.** Le barème 2026 diffusé par la Caf reconduit les taux de 2025. Pour un enfant à charge, en accueil collectif ou micro-crèche conventionnée, il est de 0,0619 % des ressources mensuelles par heure ; pour deux enfants, 0,0516 % ; pour trois, 0,0413 %. Les taux sont un peu plus bas en accueil familial ou parental.

**Un exemple pour comprendre.** Avec un taux de 0,0619 %, des ressources mensuelles de 3 000 € donnent un tarif d’environ 1,86 € de l’heure. Ce calcul est indicatif : la structure applique les ressources enregistrées par la Caf.

**Le plancher et le plafond.** Pour 2026, le plancher de ressources est de 814,62 € par mois : pour un enfant, le tarif minimal est alors de 0,50 € de l’heure en accueil collectif. Le plafond est de 8 500 € : pour un enfant, le tarif maximal est de 5,26 € de l’heure en accueil collectif, sauf si la structure a choisi un plafond plus élevé, ce qu’elle doit indiquer dans son règlement.

**Les ressources utilisées.** Pour les allocataires, la crèche consulte les ressources connues de la Caf. Il est donc utile de signaler tout changement de situation à la Caf, puis d’en informer la crèche.

## Au quotidien
- **Lisez le règlement de fonctionnement** de la crèche : il précise les modalités de facturation, le plafond appliqué et ce qui est compris.
- **Faites votre propre estimation** avec vos ressources mensuelles et le taux qui correspond à votre nombre d’enfants.
- **Prévenez la Caf de vos changements** (naissance, séparation, perte d’emploi) : la crèche attend la mise à jour avant de modifier le tarif.
- **Demandez comment sont comptées les heures** réservées, les absences et les jours de fermeture.
- **Pensez au crédit d’impôt** pour frais de garde hors du domicile, qui peut réduire encore le coût réel.

## Questions fréquentes
**Pourquoi mon tarif a-t-il changé en janvier ?** Le barème et les ressources de référence sont revus chaque année. Une naissance ou un changement de revenus peut aussi modifier le tarif.

**Les repas et les couches sont-ils compris ?** Le barème lu ne le précise pas : cette information figure dans le règlement de la crèche. Posez la question lors de l’inscription.

**Je ne suis pas allocataire : comment est calculé mon tarif ?** Le barème indique que la structure retient alors le revenu brut imposable figurant sur votre avis d’imposition, avant l’abattement de 10 %. Sans justificatif, le plafond peut être appliqué.

## Quand demander conseil
La direction de la crèche, le relais petite enfance ou le service petite enfance de votre mairie peuvent expliquer votre facture. En cas de difficultés de paiement, parlez-en tôt à la structure et au service social de votre Caf ou de votre mairie. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'credit-impot-frais-de-garde-enfant-moins-de-6-ans',
    title: 'Crèche, assistante maternelle : le crédit d’impôt pour frais de garde des moins de 6 ans',
    summary: 'Les frais de garde hors du domicile d’un enfant de moins de 6 ans ouvrent droit à un crédit d’impôt de 50 %, dans la limite d’un plafond et après déduction des aides.',
    journeys: ['newborn', 'child'],
    tags: ['crédit d’impôt', 'frais de garde', 'crèche', 'assistante maternelle', 'impôts', 'déclaration de revenus', 'garde alternée', 'Pajemploi'],
    max_age_months: 72,
    sources: [S.spF8, S.spCMG],
    body_md: `Si votre enfant est gardé par une assistante maternelle agréée ou dans une crèche, une partie de ce que vous payez peut vous revenir grâce à l’impôt sur le revenu. Ce crédit d’impôt bénéficie aussi aux foyers non imposables, puisque l’excédent est remboursé.

## En bref
- Il concerne les enfants de moins de 6 ans au 1er janvier de l’année d’imposition, gardés hors du domicile.
- Modes de garde concernés : assistante maternelle agréée, crèche, halte-garderie, garderie périscolaire, centre de loisirs.
- Le crédit est égal à 50 % des dépenses retenues, plafonnées à 3 500 € par enfant et par an (crédit maximal de 1 750 €).
- Il faut déduire les aides reçues, comme le CMG et les aides de l’employeur ; les frais de repas sont exclus.
- ${VERIF}

## Comprendre
**Pour quels enfants ?** Pour la déclaration 2026 (revenus 2025), l’enfant doit être né en 2019 ou après et être à votre charge. La garde à domicile relève d’un autre crédit d’impôt, celui de l’emploi d’un salarié à domicile.

**Le calcul pas à pas.** Prenez ce que vous avez réellement payé (pour une assistante maternelle : salaire net et cotisations sociales restées à votre charge), retirez le CMG et les aides de l’employeur, retirez les frais de repas. Le crédit correspond à 50 % du résultat, dans la limite du plafond. Service-Public donne l’exemple d’une assistante maternelle payée 4 500 € sur l’année avec 3 500 € de CMG : 1 000 € de dépenses retenues, soit 500 € de crédit.

**En garde alternée.** Les plafonds sont divisés par deux pour chaque parent : 1 750 € de dépenses et 875 € de crédit au maximum par enfant.

**Le versement.** Une avance de 60 %, calculée sur l’année précédente, est versée en janvier ; le solde arrive l’été après la déclaration. Si l’avance était trop élevée, le trop-perçu est repris en septembre.

## Au quotidien
- **Téléchargez l’attestation fiscale Pajemploi** depuis votre espace en ligne si vous employez une assistante maternelle.
- **Demandez une attestation annuelle** à la crèche ou au centre de loisirs.
- **Conservez les justificatifs** sans les joindre : l’administration peut les demander. Un paiement en espèces n’est pas accepté comme justificatif.
- **Vérifiez les montants préremplis** sur votre déclaration.
- **Anticipez l’avance de janvier** : si vous arrêtez la garde, une avance calculée sur l’année précédente peut être trop élevée, et le trop-perçu sera repris en septembre.

## Questions fréquentes
**Je ne paie pas d’impôt : ai-je droit au crédit ?** Oui, si le crédit dépasse l’impôt dû, l’excédent est restitué.

**Les grands-parents peuvent-ils en bénéficier ?** Oui, quand ils ont leur petit-enfant à charge parce que leur enfant majeur est rattaché à leur foyer fiscal.

**La cantine du périscolaire compte-t-elle ?** Non, les frais de repas sont exclus. Seuls les frais de garde sont retenus.

**Une avance immédiate existe-t-elle ?** Service-Public mentionne une avance immédiate annoncée à partir de septembre 2027 ; vérifiez la fiche à jour avant d’en tenir compte.

## Quand demander conseil
Votre centre des finances publiques, la messagerie de votre espace sur impots.gouv.fr ou Allô Service Public peuvent répondre à vos questions. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'credit-impot-garde-enfant-a-domicile-salarie',
    title: 'Garde d’enfant à domicile : le crédit d’impôt pour l’emploi d’un salarié',
    summary: 'Employer une garde d’enfant chez soi ouvre droit à un crédit d’impôt de 50 % des dépenses, dans des plafonds majorés selon les enfants à charge, après déduction du CMG.',
    journeys: ['newborn', 'child'],
    tags: ['garde à domicile', 'nounou à domicile', 'garde partagée', 'crédit d’impôt', 'salarié à domicile', 'Cesu', 'Pajemploi', 'avance immédiate'],
    sources: [S.spF12, S.spCMG],
    body_md: `Faire garder son enfant chez soi, seul ou en garde partagée avec une autre famille, offre de la souplesse mais coûte plus cher qu’une assistante maternelle. Un crédit d’impôt spécifique, différent de celui de la crèche, permet de récupérer une partie des dépenses.

## En bref
- Le crédit d’impôt est égal à 50 % des dépenses payées dans l’année pour l’emploi d’un salarié à domicile.
- Le plafond général est de 12 000 € de dépenses par an, majoré de 1 500 € par enfant à charge (750 € en garde alternée), sans dépasser 15 000 €.
- Les aides reçues pour cet emploi, dont le CMG, sont déduites avant le calcul.
- Les dépenses passées par Cesu ou Pajemploi sont préremplies, mais il faut les vérifier.
- ${VERIF}

## Comprendre
**Quelle différence avec le crédit d’impôt « crèche » ?** La garde hors du domicile (crèche, assistante maternelle) relève d’un crédit plafonné à 3 500 € de dépenses par enfant de moins de 6 ans. La garde au domicile relève du crédit pour l’emploi d’un salarié à domicile, avec des plafonds plus élevés, y compris pour un enfant de plus de 6 ans.

**Le calcul.** Additionnez le salaire et les cotisations payés, retirez le CMG et les autres aides, puis appliquez 50 % dans la limite du plafond. D’autres plafonds existent pour la première année d’emploi direct ou en cas d’invalidité.

**L’avance immédiate.** Pour un enfant de plus de 6 ans, en emploi direct avec le Cesu+, vous pouvez opter pour l’avance immédiate : seule la part restant à votre charge est prélevée, avec l’accord du salarié. Pour un enfant de moins de 6 ans, Service-Public indique que cette possibilité est prévue au plus tard le 1er septembre 2027.

**Sans avance immédiate.** Un acompte de 60 % est versé en janvier de l’année suivante, sur la base de l’année précédente, puis le solde arrive à l’été.

## Au quotidien
- **Déclarez votre salarié** sur Pajemploi (enfant de moins de 6 ans avec CMG) ou via le Cesu selon votre situation.
- **En garde partagée**, mettez-vous d’accord par écrit avec l’autre famille sur la répartition des heures et des frais, et vérifiez avec Pajemploi ou le Cesu ce que chaque famille doit déclarer.
- **Indiquez le type de service** « garde d’enfant » sur votre déclaration de revenus.
- **Gardez les attestations Urssaf** ou les factures de l’organisme : elles ne sont pas à joindre mais peuvent être demandées. Les paiements en espèces ne sont pas acceptés.
- **Faites vos comptes sur l’année** : CMG, crédit d’impôt et reste à charge réel.

## Questions fréquentes
**Je passe par une entreprise de garde d’enfants : ai-je droit au crédit ?** Oui, l’emploi via un organisme ouvre droit au crédit ; l’organisme peut aussi proposer l’avance immédiate et déduire le crédit de sa facture.

**Les dépenses de 2026 se déclarent quand ?** En 2027, lors de la déclaration des revenus 2026.

**Mon enfant a 7 ans et je l’ai fait garder après l’école : est-ce possible ?** Oui, l’emploi d’un salarié à domicile pour garder un enfant de plus de 6 ans ouvre aussi droit à ce crédit, dans les plafonds prévus.

## Quand demander conseil
Pour vos obligations d’employeur, contactez Pajemploi ou le Cesu ; pour l’impôt, votre centre des finances publiques ou Allô Service Public. ${SOS}

${END}`,
  },
  // ───────────────────────────── Impôts et scolarité ─────────────────────────────
  {
    ...BASE,
    slug: 'impots-naissance-enfant-a-charge-parts-quotient-familial',
    title: 'Un bébé arrive : ce qui change pour votre impôt sur le revenu',
    summary: 'Un enfant à charge augmente le nombre de parts de votre foyer fiscal : demi-part pour les deux premiers, part entière à partir du troisième, avec un avantage plafonné.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['impôts', 'quotient familial', 'demi-part', 'enfant à charge', 'déclaration de revenus', 'parents non mariés', 'garde alternée', 'parent isolé case T'],
    sources: [S.spQF, S.spEnfCharge],
    body_md: `À l’arrivée d’un enfant, la Caf n’est pas la seule à devoir être informée : votre déclaration de revenus évolue aussi. Un enfant à charge augmente le nombre de parts de votre foyer fiscal, ce qui peut réduire l’impôt. Voici les règles principales.

## En bref
- Un couple marié ou pacsé dispose de 2 parts ; chacun des deux premiers enfants ajoute une demi-part, puis chaque enfant à partir du 3e ajoute une part entière.
- Le gain d’impôt lié à chaque demi-part est plafonné (1 807 € selon la fiche consultée).
- Pour des parents non mariés, l’enfant est rattaché au foyer fiscal de l’un des deux, ou partagé si la charge l’est à égalité.
- En résidence alternée, l’avantage est partagé entre les deux parents.
- ${VERIF}

## Comprendre
**Le quotient familial.** L’impôt est calculé en divisant le revenu imposable par le nombre de parts. Avec un enfant, un couple passe à 2,5 parts ; avec deux enfants, à 3 parts ; avec trois enfants, à 4 parts ; avec quatre, à 5 parts.

**Le plafonnement.** L’administration compare l’impôt calculé avec toutes vos parts et l’impôt calculé sur 2 parts diminué du plafond. Si la différence dépasse le plafond, c’est le plafond qui s’applique. Concrètement, au-delà d’un certain niveau de revenus, l’avantage ne progresse plus.

**Qui est à charge ?** Un enfant mineur est rattaché au foyer fiscal de ses parents. Pour la déclaration 2026 (revenus 2025), un enfant né en 2007 ou après est considéré comme mineur à charge.

**Parents non mariés.** Chaque concubin déclare séparément : l’enfant est rattaché à l’un des deux. Si la charge est partagée à parts égales, chacun peut bénéficier de la moitié de l’augmentation de parts.

**Résidence alternée.** Chaque parent bénéficie d’un quart de part pour chacun des deux premiers enfants, puis d’une demi-part à partir du troisième, avec un plafond divisé en conséquence.

**Parent isolé.** Le parent qui vit seul avec son enfant à charge peut bénéficier d’une demi-part supplémentaire en cochant la case T de sa déclaration.

## Au quotidien
- **Ajoutez l’enfant** sur votre prochaine déclaration de revenus, dans la rubrique des personnes à charge.
- **Parents non mariés : décidez ensemble** du rattachement, en comparant les deux options si vos revenus sont très différents.
- **Gardez une trace** des frais de garde : ils ouvrent droit à des crédits d’impôt distincts.
- **Après une séparation**, mettez à jour votre situation et le mode de résidence des enfants.

## Questions fréquentes
**Mon enfant mineur perçoit des revenus : que faire ?** Ses revenus s’ajoutent à ceux du foyer, sauf si vous demandez une imposition distincte. Dans ce cas, il cesse d’être à votre charge fiscale et déclare lui-même ses revenus.

**Nous sommes séparés et je verse une pension : puis-je la déduire ?** Le parent qui n’a pas l’enfant à sa charge fiscale peut déduire la pension versée pour l’enfant, dans les conditions prévues. Vérifiez votre cas précis avant de remplir la déclaration.

**Pourquoi le troisième enfant compte-t-il double ?** C’est la règle du quotient familial : à partir du 3e enfant, chaque enfant ouvre droit à une part entière.

## Quand demander conseil
Pour une situation particulière (enfant handicapé, recomposition familiale, revenus à l’étranger), contactez votre centre des finances publiques, la messagerie de votre espace impots.gouv.fr ou Allô Service Public. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'allocation-de-rentree-scolaire-ars-conditions-demarches',
    title: 'L’allocation de rentrée scolaire (ARS) : conditions, montants et démarches',
    summary: 'L’ARS aide à financer la rentrée des enfants de 6 à 18 ans scolarisés, sous conditions de ressources ; elle est souvent automatique, sauf pour les 16-18 ans.',
    journeys: ['child'],
    tags: ['allocation de rentrée scolaire', 'ARS', 'rentrée', 'fournitures scolaires', 'Caf', 'MSA', 'CP', 'lycée'],
    min_age_months: 60,
    sources: [S.spARS],
    body_md: `Cartable, fournitures, vêtements : la rentrée pèse sur le budget. L’allocation de rentrée scolaire (ARS) est versée chaque été aux familles dont les ressources ne dépassent pas un plafond, pour chaque enfant de 6 à 18 ans scolarisé.

## En bref
- L’ARS concerne les enfants de 6 à 18 ans scolarisés dans un établissement ou au Cned (pour la rentrée 2026 : enfants nés entre le 16 septembre 2008 et le 31 décembre 2020 inclus, en métropole).
- Elle est soumise à un plafond de ressources qui dépend du nombre d’enfants.
- Le montant varie selon l’âge : en 2026, 426,87 € de 6 à 10 ans, 450,41 € de 11 à 14 ans, 466,02 € de 15 à 18 ans (métropole).
- Pour les allocataires, elle est versée automatiquement pour les moins de 16 ans ; pour les 16-18 ans, il faut déclarer la poursuite de la scolarité.
- ${VERIF}

## Comprendre
**Les plafonds 2026.** Ils sont calculés sur le revenu net catégoriel de 2024 : 28 956 € pour un enfant, 35 638 € pour deux, 42 320 € pour trois, puis 6 682 € de plus par enfant supplémentaire (métropole). Si vous dépassez légèrement le plafond, une allocation différentielle dégressive peut être versée.

**Le calendrier.** En 2026, le versement a commencé le 18 août en métropole (le 4 août à Mayotte). Si une déclaration arrive après cette date, le paiement intervient quelques jours après sa réception par la Caf ou la MSA.

**Les situations particulières.** Un enfant instruit en famille n’ouvre pas droit à l’ARS. Un jeune en apprentissage n’y a pas droit si sa rémunération dépasse un plafond. Pour un enfant confié à l’aide sociale à l’enfance par le juge, l’ARS est placée sur un compte bloqué et remise à l’enfant à sa majorité.

## Au quotidien
- **Vérifiez que vos déclarations de revenus** ont bien été transmises à la Caf ou à la MSA : c’est indispensable pour le versement automatique.
- **Pour un jeune de 16 à 18 ans**, faites la déclaration de scolarité ou d’apprentissage en ligne à partir de mi-juillet.
- **Votre enfant entre au CP avant 6 ans ?** Si vous n’êtes pas allocataire ou si la Caf le demande, transmettez le certificat de scolarité.
- **Vous n’êtes pas allocataire ?** Remplissez une déclaration de situation et de ressources auprès de la Caf ou de la MSA.
- **Préparez un budget de rentrée** avec la liste de fournitures de l’école, et gardez une marge pour les dépenses de septembre (assurance scolaire, cantine, activités).

## Questions fréquentes
**Mon enfant aura 6 ans après la rentrée : y a-t-il droit ?** Pour la rentrée 2026, l’enfant devait être né au plus tard le 31 décembre 2020. Un enfant plus jeune déjà inscrit au CP peut ouvrir droit à l’ARS sur présentation du certificat de scolarité.

**Je n’ai rien reçu en août.** Vérifiez votre espace Caf ou MSA : une déclaration de revenus manquante ou la déclaration de scolarité d’un jeune de plus de 16 ans peut bloquer le versement. Pensez aussi au délai de votre banque.

**L’ARS doit-elle servir uniquement aux fournitures ?** Elle est destinée à aider aux dépenses de rentrée. C’est à vous d’organiser son utilisation selon les besoins de vos enfants.

## Quand demander conseil
En cas de refus ou de doute sur votre plafond, contactez votre Caf ou votre MSA. Si la rentrée met votre budget en difficulté, le service social de la Caf, l’assistante sociale de l’établissement scolaire ou le CCAS de votre mairie peuvent vous orienter. ${SOS}

${END}`,
  },
  // ───────────────────────────── Congés ─────────────────────────────
  {
    ...BASE,
    slug: 'conge-de-naissance-supplementaire-2026',
    title: 'Le nouveau congé de naissance supplémentaire (depuis juillet 2026) : mode d’emploi',
    summary: 'Pour les enfants nés ou adoptés depuis le 1er janvier 2026, chaque parent peut prendre 1 ou 2 mois de congé indemnisé en plus des congés maternité, paternité ou d’adoption.',
    journeys: ['pregnant', 'newborn'],
    tags: ['congé de naissance', 'congé supplémentaire de naissance', 'nouveau congé 2026', 'congé parental', 'indemnités', 'second parent', 'PreParE', 'employeur'],
    max_age_months: 12,
    sources: [S.spCNS, S.spCNSfaq],
    body_md: `Depuis le 1er juillet 2026, un nouveau congé existe pour les parents : le congé de naissance supplémentaire. Il s’ajoute aux congés maternité, paternité et d’accueil de l’enfant ou d’adoption, et il est indemnisé. Voici ce qu’en disent les pages officielles pour les salariés du secteur privé.

## En bref
- Il concerne les enfants nés ou arrivés au foyer en vue d’adoption à partir du 1er janvier 2026 (ainsi que certains enfants nés prématurément fin 2025 alors que la naissance était prévue en 2026).
- Chaque parent peut prendre 1 ou 2 mois, en même temps que l’autre ou en alternance, soit jusqu’à 4 mois pour un couple.
- Le congé peut être pris en une fois ou en deux périodes d’un mois.
- Il est indemnisé par la CPAM ou la MSA : 70 % du salaire net le 1er mois, 60 % le 2e, dans la limite du plafond de la Sécurité sociale.
- ${VERIF}

## Comprendre
**Qui peut le prendre ?** La mère, le père, le conjoint, partenaire de Pacs ou concubin de la mère, et dans un couple de femmes la mère qui n’a pas accouché. Il faut avoir déjà pris son congé maternité, paternité et d’accueil de l’enfant ou d’adoption. D’autres actifs peuvent en bénéficier avec des règles adaptées : indépendants, agents publics, demandeurs d’emploi indemnisés…

**Quand le prendre ?** Dans les 9 mois qui suivent la naissance ou l’arrivée de l’enfant. Pour les enfants nés entre le 1er janvier et le 30 juin 2026, la période court du 1er juillet 2026 jusqu’à fin mars 2027 (la FAQ évoque le 1er avril 2027). Ce délai peut être allongé dans certains cas (naissances multiples, hospitalisation de l’enfant…).

**L’indemnisation.** Aucun salaire n’est versé par l’employeur, sauf accord plus favorable ; la CPAM verse une indemnité dégressive, dans la limite du plafond mensuel de la Sécurité sociale (4 005 € au 1er janvier 2026). Des conditions de cotisation ou d’heures travaillées s’appliquent.

**Les protections.** L’employeur ne peut ni refuser ni reporter le congé si le délai de prévenance est respecté. Le licenciement est interdit pendant le congé, sauf faute grave ou motif étranger à la naissance. La période compte pour l’ancienneté et, si elle dure au moins 58 jours, valide un trimestre de retraite selon la FAQ.

## Au quotidien
- **Prévenez votre employeur au moins 1 mois avant**, par lettre recommandée avec accusé de réception ou remise contre récépissé, en indiquant la durée et l’éventuel fractionnement. Le délai peut être réduit à 15 jours lorsque le congé suit immédiatement un congé paternité ou d’adoption (conditions précisées sur Service-Public).
- **Utilisez le modèle de lettre** proposé par Service-Public.
- **Vous n’avez pas de démarche à faire auprès de la CPAM** : l’employeur transmet les éléments, même si la caisse peut demander des pièces.
- **Organisez-vous à deux** : en même temps pour les premiers mois, ou en relais pour retarder l’entrée en mode de garde.
- **Faites vos comptes** : l’indemnité est inférieure au salaire, et elle ne se cumule pas avec la PreParE, le chômage ou des indemnités journalières.

## Questions fréquentes
**Puis-je enchaîner avec un congé parental ?** Oui. Le congé de naissance supplémentaire et le congé parental indemnisé par la PreParE ne se cumulent pas, mais ils peuvent se succéder, dans l’ordre de votre choix.

**Je suis indépendant(e) : comment faire ?** La demande se fait auprès de la CPAM en ligne, avec une attestation de cessation temporaire d’activité ; le montant est calculé à partir d’un forfait journalier.

**Et le CMG pour la nounou pendant ce congé ?** Pour un même enfant, le CMG n’est pas cumulable avec ce congé, sauf pour les enfants nés ou adoptés entre le 1er janvier et le 30 juin 2026.

## Quand demander conseil
Ce dispositif est récent : relisez la fiche Service-Public à jour, interrogez votre service des ressources humaines, vos représentants du personnel ou votre CPAM. En cas de refus de l’employeur alors que les conditions sont remplies, un juriste ou le conseil de prud’hommes peut être sollicité. ${SOS}

${END}`,
  },
  // ───────────────────────────── État civil et famille ─────────────────────────────
  {
    ...BASE,
    slug: 'choisir-le-nom-de-famille-de-son-enfant',
    title: 'Quel nom de famille pour votre enfant ? Les règles du choix',
    summary: 'Nom du père, de la mère ou les deux accolés : les parents choisissent une seule fois, par déclaration conjointe, et ce choix vaut pour leurs enfants suivants.',
    journeys: ['pregnant', 'newborn'],
    tags: ['nom de famille', 'double nom', 'déclaration conjointe de choix de nom', 'nom du père', 'nom de la mère', 'reconnaissance', 'état civil', 'cerfa 15286'],
    max_age_months: 12,
    sources: [S.spNom],
    body_md: `Le nom de famille d’un enfant ne se décide pas forcément « par défaut ». Les parents peuvent choisir, mais certaines règles s’appliquent, et le choix fait pour le premier enfant engage les suivants. Mieux vaut en parler à deux avant la naissance.

## En bref
- Si la filiation est établie à l’égard des deux parents, l’enfant peut porter le nom du père, celui de la mère, ou les deux accolés dans l’ordre choisi (un seul nom par parent).
- Le choix se fait une seule fois, par une déclaration conjointe signée par les deux parents (formulaire cerfa n° 15286).
- Il s’impose ensuite aux enfants suivants du couple.
- Sans choix, l’enfant de parents mariés prend le nom du père ; pour des parents non mariés, celui du parent qui l’a reconnu en premier.
- En cas de désaccord signalé à temps, l’enfant porte les deux noms dans l’ordre alphabétique.

## Comprendre
**La filiation d’abord.** Pour un couple marié, la filiation paternelle découle de la présomption de paternité. Pour un couple non marié, le père doit reconnaître l’enfant ; une reconnaissance avant la naissance permet d’établir la filiation dès le départ. Pour un couple de femmes ayant eu recours à une PMA avec donneur, la mère qui n’a pas accouché établit sa filiation par reconnaissance conjointe anticipée.

**Les noms composés.** Un parent qui porte lui-même deux noms ne transmet qu’un seul élément. Un nom composé avant 2005 est indivisible et se transmet en entier. Un nom étranger en plusieurs termes est considéré comme indivisible, sauf certificat de coutume.

**Le désaccord.** Un parent qui n’est pas d’accord doit le signaler par écrit à l’officier d’état civil au plus tard le jour de la déclaration de naissance, en pratique avant la naissance. Faute d’accord, l’enfant reçoit les deux noms dans l’ordre alphabétique (premier élément seulement si un parent a un double nom).

**Un changement plus tard.** Si le père reconnaît l’enfant après la déclaration de naissance, les parents peuvent modifier le nom par déclaration conjointe devant l’officier d’état civil. À partir de 13 ans, le consentement de l’enfant est nécessaire.

## Au quotidien
- **Parlez-en tôt** : le choix ne s’exerce qu’une fois et vaut pour toute la fratrie.
- **Remplissez la déclaration conjointe** à l’avance, signée par les deux parents à la même date, et glissez-la dans le dossier de maternité.
- **Remettez-la lors de la déclaration de naissance**, à la mairie ou au service de la maternité qui s’en charge.
- **Vérifiez l’orthographe** des noms et prénoms sur l’acte de naissance avant de partir.
- **Naissance à l’étranger** : la déclaration peut être faite lors de la demande de transcription, dans les 3 ans.

## Questions fréquentes
**Peut-on mettre un trait d’union entre les deux noms ?** Service-Public consacre une page à cette question ; renseignez-vous auprès de la mairie, car la présentation sur l’acte suit des règles précises.

**Notre premier enfant porte le nom du père : le second peut-il porter nos deux noms ?** Non, si les deux parents figuraient sur l’acte du premier enfant : le choix initial s’impose aux suivants.

**Et pour un enfant né sans vie ?** Les parents peuvent lui donner un nom de famille, selon les mêmes possibilités ; il figure sur l’acte d’enfant sans vie.

## Quand demander conseil
Le service état civil de la mairie répond aux questions pratiques. Pour une situation complexe (filiation contestée, nom étranger, changement de nom), un juriste, un point-justice ou un avocat peut vous éclairer. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'livret-de-famille-obtention-mise-a-jour',
    title: 'Le livret de famille : quand on le reçoit et comment le tenir à jour',
    summary: 'Remis gratuitement à la naissance du premier enfant ou au mariage, le livret de famille doit être mis à jour à chaque événement : naissance, mariage, divorce, décès.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['livret de famille', 'état civil', 'mairie', 'mise à jour', 'duplicata', 'parents non mariés', 'second livret'],
    sources: [S.spLivret, S.spLivretMaj],
    body_md: `Le livret de famille est souvent demandé dans les démarches, par exemple auprès de la Caf ou de l’Assurance Maladie. Il rassemble des extraits des actes d’état civil de la famille. Voici quand il est remis et comment le garder à jour.

## En bref
- Pour des parents non mariés, il est remis gratuitement par la mairie du lieu de naissance lors de la déclaration de naissance du premier enfant.
- Pour un couple marié sans enfant, il est remis le jour du mariage.
- Il contient les extraits d’actes des parents et des enfants, ainsi que des informations de droit de la famille.
- Sa mise à jour n’est pas automatique : il faut se rendre à la mairie après chaque événement.
- En cas de perte, de vol ou de séparation, un second livret peut être demandé.

## Comprendre
**Qui y figure ?** Un parent figure dans le livret s’il apparaît sur l’acte de naissance de l’enfant et si son propre acte de naissance est enregistré par un officier d’état civil français. Pour un couple de femmes, la reconnaissance conjointe anticipée est nécessaire. Si la filiation n’est établie qu’à l’égard d’un parent, la rubrique de l’autre reste vide.

**L’ordre des enfants.** Les enfants sont inscrits dans l’ordre de leur naissance. En cas d’adoption par une personne seule, le livret est remis lors de la transcription du jugement d’adoption ; pour un enfant né sans vie, il peut être demandé à la mairie.

**Naissance à l’étranger.** Le livret est délivré par les autorités consulaires françaises si l’acte de naissance de l’enfant et celui d’au moins un parent y sont enregistrés.

**La mise à jour.** Elle est obligatoire en cas de changement de situation familiale ou d’état civil : naissance d’un autre enfant, mariage, divorce, décès, changement de nom ou de prénom. Elle est gratuite. L’usage d’un livret falsifié ou non mis à jour est passible d’une amende.

## Au quotidien
- **À la naissance d’un autre enfant**, présentez le livret, votre pièce d’identité et l’acte de naissance à la mairie du lieu de naissance.
- **Après un mariage**, l’acte de mariage est inscrit dans le livret existant.
- **Rangez-le avec les papiers importants** et faites-en une copie numérique pour vos démarches courantes.
- **Préparez-le avant les démarches** : déclaration de naissance à la Caf, rattachement de l’enfant à la carte Vitale de l’autre parent.
- **En cas de séparation**, un second livret peut être demandé.

## Questions fréquentes
**Nous ne sommes pas mariés : aurons-nous un livret ?** Oui, il est remis à la naissance du premier enfant commun, gratuitement, sur présentation d’une pièce d’identité.

**Le livret est-il obligatoire pour que l’enfant voyage ?** Pour une autorisation de sortie du territoire, Service-Public précise que le livret de famille ne peut pas être exigé. Il reste utile pour prouver la filiation dans d’autres démarches.

**J’ai perdu le livret : que faire ?** Un duplicata peut être demandé en cas de perte, de vol ou de destruction ; Service-Public décrit la démarche selon votre situation.

## Quand demander conseil
Le service état civil de votre mairie est votre premier interlocuteur. Pour un événement survenu à l’étranger, contactez le Service central d’état civil de Nantes ou le consulat. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'autorite-parentale-actes-usuels-et-non-usuels',
    title: 'Autorité parentale : qui décide quoi pour votre enfant ?',
    summary: 'Les parents exercent en principe l’autorité parentale en commun ; certains actes peuvent être faits par un seul parent, d’autres exigent l’accord des deux.',
    journeys: ['newborn', 'child'],
    tags: ['autorité parentale', 'actes usuels', 'actes non usuels', 'accord des deux parents', 'reconnaissance tardive', 'juge aux affaires familiales', 'séparation', 'photos réseaux sociaux'],
    sources: [S.spAP, S.spCNI],
    body_md: `Inscrire son enfant à l’école, l’emmener chez le médecin, publier sa photo, changer d’établissement : qui peut décider ? La réponse dépend de l’autorité parentale et de la nature de la décision. Ces règles valent que les parents vivent ensemble ou non.

## En bref
- L’autorité parentale est l’ensemble des droits et devoirs des parents envers leur enfant mineur, exercés dans son intérêt.
- En principe, les deux parents l’exercent en commun, et ils ne peuvent pas y renoncer.
- Pour les actes usuels (soins courants, démarches administratives, inscription scolaire…), un parent peut agir seul.
- Pour les actes non usuels (opération programmée, changement d’orientation, diffusion de photos…), l’accord des deux est nécessaire.
- La séparation ne change pas, en principe, l’exercice en commun.

## Comprendre
**Ce que recouvre l’autorité parentale.** Protéger et surveiller l’enfant, veiller à sa santé, à son éducation, à son entretien, protéger sa vie privée et son image. Elle concerne aussi la gestion de ses biens.

**Une exception à connaître.** Si la filiation à l’égard du second parent est établie plus d’un an après la naissance, le premier parent reste seul à exercer l’autorité parentale. Le parent qui a reconnu l’enfant plus tard peut se voir confier l’exercice en commun sous certaines conditions ; Service-Public propose notamment un formulaire de déclaration conjointe d’exercice en commun. C’est une raison de plus, pour un couple non marié, de penser à la reconnaissance dès la grossesse.

**Les actes usuels.** Ce sont des actes courants, qui n’engagent pas l’avenir de l’enfant : démarches administratives, inscription scolaire, sorties scolaires, soins courants, vaccins obligatoires, suivi médical de routine. Le médecin, l’école ou l’administration peuvent considérer que le parent présent a l’accord de l’autre.

**Les actes non usuels.** Traitement lourd, hospitalisation prolongée, chirurgie programmée, changement d’orientation scolaire, inscription dans un établissement privé, éducation religieuse, sport dangereux, diffusion de photos sur les réseaux sociaux, passage à la télévision : ces décisions demandent l’accord des deux parents.

**L’exercice exclusif.** Lorsque le juge confie l’autorité à un seul parent, l’autre conserve le droit et le devoir de surveiller l’entretien et l’éducation de l’enfant et doit être informé des choix importants.

## Au quotidien
- **Informez l’autre parent** des décisions importantes, même quand un acte est usuel : cela évite bien des conflits.
- **Mettez-vous d’accord par écrit** sur les sujets sensibles (photos en ligne, activités à risque, voyages).
- **Gardez les justificatifs** de l’autorité parentale à portée de main : ils sont demandés pour les papiers d’identité de l’enfant.
- **En cas de désaccord sur un acte usuel**, un parent peut prévenir le professionnel concerné, qui ne pourra plus agir sur la seule demande de l’autre.
- **En cas de blocage**, le juge aux affaires familiales peut être saisi, sans avocat obligatoire.

## Questions fréquentes
**Un seul parent peut-il faire vacciner l’enfant ?** Les vaccins obligatoires et le suivi médical de routine font partie des actes usuels cités par Service-Public.

**Puis-je publier des photos de mon bébé sur les réseaux sociaux ?** La diffusion de photos de l’enfant sur les réseaux sociaux est citée parmi les actes qui nécessitent l’accord des deux parents. Pensez aussi à protéger sa vie privée sur le long terme.

**Je vais me séparer : vais-je perdre l’autorité parentale ?** Non, la séparation ne modifie pas en principe l’exercice en commun ; seul le juge peut le confier à un seul parent.

## Quand demander conseil
Un point-justice, un avocat ou la médiation familiale peuvent vous aider à trouver un accord. Si vous craignez pour la sécurité de votre enfant, appelez le 119. ${SOS}

${END}`,
  },
  // ───────────────────────────── Séparation ─────────────────────────────
  {
    ...BASE,
    slug: 'separation-residence-de-l-enfant-garde-alternee',
    title: 'Séparation : comment fixer la résidence de l’enfant et la garde alternée ?',
    summary: 'Résidence alternée ou chez un parent avec droit de visite : les parents peuvent s’accorder par une convention homologuée ; à défaut, le juge aux affaires familiales tranche.',
    journeys: ['newborn', 'child'],
    tags: ['séparation', 'garde alternée', 'résidence alternée', 'droit de visite et d’hébergement', 'convention parentale', 'juge aux affaires familiales', 'médiation familiale', 'divorce'],
    sources: [S.spResidence, S.spAlternee],
    body_md: `Quand les parents se séparent, une question se pose vite : où l’enfant va-t-il vivre ? La loi laisse une large place à l’accord entre parents, avec toujours le même repère : l’intérêt de l’enfant.

## En bref
- La résidence peut être alternée (l’enfant vit tour à tour chez chacun) ou fixée chez un parent, l’autre ayant un droit de visite et d’hébergement.
- Les parents décident ensemble ; en cas de désaccord, le juge aux affaires familiales (JAF) tranche.
- Un accord peut être écrit dans une convention parentale, puis homologué par le juge pour devenir exécutoire.
- L’enfant ne choisit pas lui-même, mais il peut donner son avis et demander à être entendu par le juge.
- La médiation familiale peut aider à construire un accord.

## Comprendre
**La résidence alternée.** Elle consiste à partager le temps de l’enfant de façon équitable, pas forcément identique, entre les deux domiciles. Elle suppose en pratique des domiciles proches (pour garder la même école), une bonne organisation et une communication suffisante entre parents.

**L’accord amiable.** Hors divorce, les parents peuvent rédiger une convention parentale (Service-Public propose des modèles) et la faire homologuer par le JAF sur requête conjointe, au tribunal du domicile de l’un d’eux. En cas de divorce par consentement mutuel, l’accord figure dans la convention rédigée par les avocats.

**Le désaccord.** Le parent qui le souhaite saisit le JAF du tribunal du lieu où vit l’enfant. Hors divorce, l’avocat n’est pas obligatoire. Le juge examine notamment les habitudes déjà prises, les sentiments exprimés par l’enfant, la capacité de chaque parent à respecter les droits de l’autre, d’éventuelles enquêtes sociales ou expertises, et les violences ou pressions éventuelles.

**Changer d’organisation.** Si une décision existe déjà, il faut en général justifier de circonstances nouvelles, comme un déménagement ou le souhait exprimé par l’enfant.

## Au quotidien
- **Gardez l’enfant à l’écart des conflits** : il doit pouvoir maintenir des relations avec chacun de ses parents, y compris pendant la procédure.
- **Pensez aux détails pratiques** dans la convention : rythme, vacances, trajets, fêtes, frais de cantine et d’activités, communication entre parents.
- **Adaptez le rythme à l’âge** : parlez-en avec les professionnels qui suivent votre enfant (pédiatre, PMI, psychologue) si vous hésitez pour un tout-petit.
- **Prévenez à l’avance en cas de déménagement** : le parent qui déménage doit en informer l’autre.
- **Pensez aux conséquences administratives** : Caf, impôts, CMG, pension alimentaire.

## Questions fréquentes
**La garde alternée supprime-t-elle la pension alimentaire ?** Pas forcément : une pension peut être fixée en cas d’écart important de revenus entre les parents.

**À partir de quel âge mon enfant peut-il choisir ?** Il ne choisit pas lui-même son lieu de vie, quel que soit son âge. Il peut exprimer son avis, et le juge en tient compte sans être obligé de le suivre.

**Faut-il un avocat ?** Pas pour une demande au JAF hors divorce, ni pour l’homologation d’une convention. En divorce judiciaire, l’avocat est obligatoire.

## Quand demander conseil
Un médiateur familial, un point-justice, un avocat ou Allô Service Public peuvent vous orienter. En cas de violences conjugales, appelez le 3919 ; en cas de danger immédiat, le 17. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'pension-alimentaire-intermediation-financiere-aripa',
    title: 'Pension alimentaire : l’intermédiation par la Caf (Aripa) pour éviter les impayés',
    summary: 'Avec l’intermédiation financière, la Caf ou la MSA collecte chaque mois la pension alimentaire et la reverse au parent qui la reçoit ; en cas d’impayé, elle engage le recouvrement.',
    journeys: ['newborn', 'child'],
    tags: ['pension alimentaire', 'intermédiation financière', 'Aripa', 'impayé de pension', 'Caf', 'séparation', 'recouvrement', 'ASF'],
    sources: [S.spIFPA, S.spASF],
    body_md: `Après une séparation, le versement de la pension alimentaire peut devenir une source de tension, voire d’impayés. L’Agence de recouvrement et d’intermédiation des pensions alimentaires (Aripa), gérée par la Caf ou la MSA, peut se placer entre les deux parents.

## En bref
- L’intermédiation financière (IFPA) concerne la pension alimentaire pour enfant entre parents séparés.
- Aripa collecte la pension chaque mois auprès du parent qui la doit et la reverse au parent qui la reçoit.
- Il faut que la pension soit fixée par un titre exécutoire (jugement, convention homologuée, convention d’avocats, acte notarié, titre délivré par la Caf…).
- Lorsqu’un titre exécutoire fixe la pension, l’intermédiation est en principe mise en place systématiquement.
- Le service est gratuit pour les deux parents.

## Comprendre
**Quand elle s’applique.** Le juge peut l’écarter si les deux parents la refusent expressément, sauf en cas de violences conjugales, où elle est imposée. Elle ne concerne pas les pensions entre ex-époux ni les sommes versées directement à l’enfant.

**Comment la demander.** Si le titre la prévoit, le greffe, l’avocat ou le notaire transmet le dossier : vous n’avez rien à faire. Sinon, la demande se fait en ligne auprès de la Caf ou de la MSA, même sans l’accord de l’autre parent et sans être allocataire. Pendant l’examen, la pension continue d’être versée directement.

**En cas d’impayé.** Aripa lance d’abord une démarche amiable, puis, si besoin, un recouvrement forcé (paiement direct par l’employeur, la banque, un organisme social ou recouvrement public). Elle peut agir sur les impayés des 5 années précédant la mise en place. Le parent débiteur paie alors des frais de gestion.

**En attendant le recouvrement.** Le parent isolé peut demander l’allocation de soutien familial (ASF), versée dès le premier mois d’impayé si les conditions sont remplies.

## Au quotidien
- **Demandez un titre exécutoire** si vous vous êtes mis d’accord oralement : c’est la base de l’intermédiation et du recouvrement.
- **Gardez une trace** des versements (relevés bancaires) et des impayés éventuels, mois par mois : ces éléments seront utiles à Aripa si un recouvrement devient nécessaire.
- **Faites la demande en ligne** dès que vous en voyez l’intérêt : elle peut apaiser les échanges, même sans impayé.
- **Signalez tout changement** (déménagement, nouvelle situation professionnelle, révision de la pension).

## Questions fréquentes
**Je ne suis pas allocataire de la Caf : puis-je en bénéficier ?** Oui, il n’est pas nécessaire d’être allocataire pour demander l’intermédiation.

**L’autre parent doit-il être d’accord ?** Non, la demande est possible sans son accord.

**L’autre parent ne peut pas payer : que se passe-t-il ?** En cas d’insolvabilité ou d’incarcération, l’intermédiation est suspendue et la Caf ou la MSA peut verser l’ASF si vous y avez droit.

## Quand demander conseil
Contactez la Caf, la MSA ou le site dédié aux pensions alimentaires. Un point-justice ou un avocat peut vous aider à obtenir un titre exécutoire. En cas de violences, appelez le 3919, et le 17 en cas de danger immédiat. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'allocation-de-soutien-familial-asf-parent-isole',
    title: 'L’allocation de soutien familial (ASF) quand l’autre parent ne participe pas',
    summary: 'L’ASF est versée au parent qui élève seul son enfant lorsque l’autre parent ne verse pas de pension, en verse une très faible, ou ne participe plus à son entretien.',
    journeys: ['newborn', 'child'],
    tags: ['ASF', 'allocation de soutien familial', 'parent isolé', 'parent solo', 'pension impayée', 'pension alimentaire', 'Caf', 'MSA'],
    sources: [S.spASF, S.spIFPA],
    body_md: `Élever seul son enfant sans l’aide de l’autre parent, ou avec une pension qui n’arrive pas, fragilise vite un budget. L’allocation de soutien familial (ASF) existe pour ces situations, avec des règles qui varient selon que la pension a été fixée ou non.

## En bref
- L’ASF s’adresse à la personne qui vit seule (sans vie de couple) et élève un enfant pour lequel l’autre parent ne participe plus depuis au moins un mois.
- Elle est aussi possible si la pension versée est inférieure à 200,78 € par mois (montant 2026) : on parle alors d’ASF différentielle.
- Son montant est de 200,78 € par mois et par enfant selon la fiche consultée.
- Sans pension fixée, elle est versée 4 mois : il faut, dans ce délai, saisir le juge aux affaires familiales pour fixer une pension.
- ${VERIF}

## Comprendre
**Si une pension est fixée mais non payée.** L’ASF est versée à titre d’avance, et la Caf peut agir pour récupérer la pension auprès de l’autre parent. Aripa intervient aussi via l’intermédiation financière.

**Si l’autre parent ne peut pas payer.** En cas d’insolvabilité, de chômage, d’incarcération ou de RSA, la Caf peut tout de même verser l’ASF après avoir vérifié la situation, et indique si une démarche pour fixer une pension est nécessaire.

**Si aucune pension n’est fixée.** L’ASF est versée pendant 4 mois. Pour la maintenir, il faut engager une démarche devant le juge aux affaires familiales, ou demander la révision d’une décision qui ne prévoit pas de pension.

**Si la pension est faible.** L’ASF différentielle complète la pension jusqu’au montant de l’ASF. Elle n’est pas versée si l’écart est inférieur à 15 €, et elle est payée tous les 3 mois.

**La remise en couple.** Si vous vivez de nouveau en couple, l’ASF est supprimée ; d’autres droits peuvent s’ouvrir, à vérifier avec la Caf.

## Au quotidien
- **Faites la demande** avec le formulaire de demande d’ASF et la déclaration de situation, avec les justificatifs demandés.
- **Rassemblez vos documents** : jugement ou convention, relevés montrant les impayés, éléments sur la situation de l’autre parent si vous les avez.
- **Respectez le délai de 4 mois** si aucune pension n’est fixée : notez-le dans votre agenda.
- **Signalez vos changements** rapidement, notamment une vie de couple.
- **Faites le point sur vos autres droits** : allocation de base, CMG, aides au logement, avec une simulation sur caf.fr ou mesdroitssociaux.gouv.fr.

## Questions fréquentes
**Faut-il être divorcé pour toucher l’ASF ?** Non, il faut élever seul son enfant, sans vie de couple, avec un autre parent qui ne participe pas ou peu à son entretien.

**L’ASF devra-t-elle être remboursée si l’autre parent paie plus tard ?** Lorsque l’ASF est versée en avance sur une pension fixée, la Caf peut agir pour récupérer la pension auprès de l’autre parent. Demandez à votre Caf comment cela s’applique à votre dossier.

**À partir de quand est-elle versée ?** À partir du mois qui suit la séparation des parents, si les conditions sont remplies.

## Quand demander conseil
Le service social de la Caf propose des rendez-vous gratuits aux parents qui vivent seuls avec leur enfant. Un point-justice peut vous aider à saisir le juge. En cas de violences, appelez le 3919, et le 17 en cas de danger immédiat. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'parent-solo-panorama-des-aides',
    title: 'Parent solo : le panorama des aides et des accompagnements',
    summary: 'Élever seul son enfant ouvre parfois droit à des aides spécifiques ou majorées : ASF, plafonds adaptés, CMG, aides au logement, accompagnement social de la Caf.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['parent solo', 'parent isolé', 'famille monoparentale', 'mère célibataire', 'père seul', 'aides Caf', 'ASF', 'travailleur social'],
    sources: [S.spSolo, S.cafSolo],
    body_md: `Être seul(e) avec son enfant, que ce soit dès la grossesse ou après une séparation, demande beaucoup d’énergie, y compris pour les papiers. Plusieurs aides tiennent compte de cette situation, et la Caf propose aussi un accompagnement humain. Voici un panorama pour savoir quoi vérifier.

## En bref
- L’allocation de soutien familial (ASF) peut être versée quand l’autre parent ne participe pas ou peu à l’entretien de l’enfant.
- Certaines aides ont des plafonds plus favorables pour un parent isolé, comme l’allocation de base de la Paje.
- Le CMG peut aider à financer une crèche, une micro-crèche, une assistante maternelle ou une garde à domicile.
- La Caf peut collecter la pension alimentaire et proposer un rendez-vous gratuit avec un travailleur social.
- Certaines communes versent une aide à la naissance : renseignez-vous à la mairie ou au CCAS.

## Comprendre
**Les aides financières à passer en revue.** Service-Public liste notamment : l’ASF, l’allocation de base de la Paje (sous conditions de ressources), les allocations familiales à partir de 2 enfants, la prime de déménagement à partir de 3 enfants, le CMG, la PreParE si vous réduisez ou arrêtez votre activité, l’AJPP en cas de maladie grave de l’enfant, et les aides à la scolarité. La Caf du Nord cite aussi les aides au logement, l’allocation de rentrée scolaire et le RSA, qui peut être revalorisé pour un parent isolé sous conditions.

**Les plafonds adaptés.** Pour l’allocation de base, le plafond d’un parent isolé est le même que celui d’un couple à deux revenus, donc plus élevé que celui d’un couple à un seul revenu. Pour le CMG emploi direct, un parent isolé peut en bénéficier jusqu’aux 12 ans de l’enfant.

**L’impôt.** Le parent isolé peut bénéficier d’une demi-part supplémentaire en cochant la case T de sa déclaration de revenus.

**L’accompagnement.** La Caf propose des rendez-vous gratuits avec son service social, de l’aide à domicile, la médiation familiale, des espaces de rencontre, et des lieux d’accueil pour la petite enfance. Elle peut aussi délivrer un titre exécutoire fixant une pension, sous conditions.

## Au quotidien
- **Déclarez votre situation de parent isolé** à la Caf dès qu’elle change : de nombreux calculs en dépendent.
- **Faites une simulation globale** sur caf.fr ou mesdroitssociaux.gouv.fr pour repérer les aides auxquelles vous pourriez avoir droit.
- **Demandez un rendez-vous avec un travailleur social** de la Caf ou du CCAS : il peut vous aider à monter les dossiers et à organiser votre budget.
- **Organisez un réseau de relais** (famille, amis, voisins, lieux d’accueil enfants-parents) pour souffler.
- **Gardez un dossier unique** avec vos justificatifs : jugement, relevés de pension, attestations.

## Questions fréquentes
**Je suis enceinte et seule : à quoi puis-je prétendre ?** La prime à la naissance et l’allocation de base de la Paje sont étudiées selon vos ressources. Déclarez votre grossesse et faites une simulation. Le parcours « Je deviens parent » de Service-Public liste les démarches étape par étape.

**L’autre parent n’a pas reconnu l’enfant : ai-je droit à l’ASF ?** Service-Public cite ce cas parmi ceux qui peuvent ouvrir droit à l’ASF, comme le décès de l’autre parent.

**Je retrouve un emploi : vais-je perdre mes aides ?** Certaines aides diminuent quand les revenus augmentent, d’autres (comme le CMG) supposent justement une activité. Faites une simulation avant et après la reprise.

## Quand demander conseil
Le service social de la Caf, le CCAS de votre mairie et la PMI (pour la grossesse et les tout-petits) sont là pour vous accompagner. Si vous vous sentez à bout, parlez-en à votre médecin ou à votre sage-femme. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'conge-enfant-malade-salarie-jours-par-an',
    title: 'Enfant malade : combien de jours de congé pour rester à ses côtés ?',
    summary: 'Le salarié du privé a droit à un congé pour enfant malade de moins de 16 ans : 3 jours par an, ou 5 jours pour un enfant de moins d’un an ou à partir de 3 enfants.',
    journeys: ['newborn', 'child'],
    tags: ['congé enfant malade', 'enfant malade travail', 'jours enfant malade', 'certificat médical', 'salarié', 'convention collective', 'crèche fièvre'],
    max_age_months: 192,
    sources: [S.spEnfMalade],
    body_md: `Fièvre au réveil, appel de la crèche : la maladie de l’enfant bouscule souvent l’organisation de la journée. Le Code du travail prévoit un congé spécifique pour les salariés du secteur privé, en plus des éventuels arrangements prévus par votre entreprise.

## En bref
- Le congé concerne un enfant de moins de 16 ans malade ou accidenté, dont vous avez la charge.
- Durée : 3 jours par an en principe ; 5 jours si l’enfant a moins d’un an ou si vous avez au moins 3 enfants de moins de 16 ans à charge.
- Il faut remettre un certificat médical à l’employeur dès que possible.
- L’employeur ne peut ni le refuser ni le reporter, dans la limite des jours prévus.
- En principe non rémunéré, sauf convention collective plus favorable (et règles particulières en Alsace-Moselle).

## Comprendre
**Aucune condition d’ancienneté.** Le Code du travail ne prévoit pas de condition d’ancienneté : le congé est ouvert dès la période d’essai.

**Une durée minimale.** Les durées du Code du travail sont un minimum : votre convention collective peut prévoir davantage de jours, voire leur rémunération. Service-Public propose un simulateur pour connaître les congés pour événements familiaux prévus par votre convention.

**Pas d’effet sur les congés payés.** Ces jours n’entament pas vos congés payés acquis.

**En Alsace-Moselle.** Dans le Bas-Rhin, le Haut-Rhin et la Moselle, le salaire est maintenu pendant ce congé.

**Et si la maladie est grave ?** Pour un enfant atteint d’une maladie, d’un handicap ou d’un accident d’une particulière gravité, d’autres dispositifs existent : le congé de présence parentale et l’allocation journalière de présence parentale (AJPP).

## Au quotidien
- **Prévenez votre employeur au plus vite**, puis transmettez le certificat médical (ou sa copie).
- **Consultez votre convention collective** : nombre de jours, maintien éventuel du salaire.
- **Alternez entre parents** quand c’est possible : chaque parent salarié bénéficie de ce droit auprès de son propre employeur.
- **Préparez un plan B** avec des proches ou une solution de garde ponctuelle pour les périodes d’épidémies hivernales.
- **Renseignez-vous sur les règles d’éviction** de la crèche ou de l’école, qui peuvent demander de garder l’enfant certains jours.

## Questions fréquentes
**Mon employeur peut-il me demander de poser un jour de congé payé à la place ?** Le congé pour enfant malade est un droit, que l’employeur ne peut ni refuser ni reporter dans la limite des jours acquis. Vous pouvez choisir de poser d’autres congés si vous le souhaitez, par exemple pour garder votre salaire.

**Le télétravail est-il une solution ?** C’est une organisation à discuter avec votre employeur. S’occuper d’un enfant malade et travailler en même temps est souvent difficile : le congé existe pour vous permettre d’être disponible.

**Je suis agent public ou indépendant : les règles sont-elles les mêmes ?** Non, les règles décrites ici concernent les salariés du privé. Renseignez-vous auprès de votre administration ou de votre caisse.

## Quand demander conseil
Pour la santé de votre enfant, consultez votre médecin ou votre pédiatre ; le soir et le week-end, le médecin de garde ou la pharmacie de garde peuvent vous orienter. En cas d’urgence (difficultés à respirer, enfant inconscient, convulsions), appelez le 15 ou le 112. Pour vos droits, adressez-vous aux ressources humaines, aux représentants du personnel ou à Allô Service Public. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'enfant-gravement-malade-conge-presence-parentale-ajpp',
    title: 'Enfant gravement malade ou handicapé : congé de présence parentale et AJPP',
    summary: 'Le congé de présence parentale permet de s’absenter jusqu’à 310 jours sur 3 ans pour un enfant gravement malade, accidenté ou handicapé, avec l’AJPP versée par la Caf ou la MSA.',
    journeys: ['newborn', 'child'],
    tags: ['congé de présence parentale', 'AJPP', 'enfant gravement malade', 'handicap', 'hospitalisation enfant', 'Caf', 'certificat médical', 'aidant'],
    sources: [S.spCPP, S.spAJPP],
    body_md: `Quand un enfant traverse une maladie grave, un accident sérieux ou vit avec un handicap qui demande beaucoup de soins, les parents ont besoin de temps. Le congé de présence parentale, associé à l’allocation journalière de présence parentale (AJPP), permet de s’absenter du travail tout en percevant une aide.

## En bref
- Il concerne un enfant à charge de moins de 20 ans atteint d’une maladie, d’un handicap ou d’un accident d’une particulière gravité, nécessitant une présence soutenue et des soins contraignants.
- Le congé peut aller jusqu’à 310 jours ouvrés par enfant et par pathologie, sur une période de 3 ans maximum ; il peut être renouvelé dans certains cas.
- Il se prend en une ou plusieurs fois, et, avec l’accord de l’employeur, à temps partiel ou par demi-journées.
- L’AJPP est versée par la Caf ou la MSA, dans la limite de 22 jours par mois.
- ${VERIF}

## Comprendre
**Le certificat médical.** Le médecin qui suit l’enfant atteste la gravité, le besoin de présence et la durée prévisible des soins. Pour l’AJPP, ce certificat est envoyé sous pli confidentiel, et le service médical de l’Assurance Maladie donne un avis ; l’allocation peut être versée provisoirement en attendant.

**Le montant de l’AJPP.** Service-Public affiche 66,64 € par jour et 33,32 € par demi-journée. Un complément mensuel peut s’ajouter, sous conditions de ressources, si les frais liés à la santé de l’enfant non remboursés dépassent un certain montant.

**Les protections au travail.** Il n’y a pas de condition d’ancienneté, et l’employeur ne peut ni refuser ni reporter le congé. Le licenciement est interdit pendant le congé et pendant les 10 semaines qui suivent, sauf faute grave ou motif étranger. Vous retrouvez votre poste ou un poste similaire, et la période compte pour l’ancienneté.

**Le renouvellement.** À l’issue des 3 ans, ou plus tôt si les 310 jours sont épuisés, un nouveau congé est possible en cas de rechute, de récidive ou de besoin persistant. Depuis février 2024, un nouveau certificat du médecin suffit, sans accord préalable de la Caf.

## Au quotidien
- **Écrivez à votre employeur** au moins 10 jours avant le début, par lettre recommandée ou remise contre décharge, avec le certificat médical.
- **Pour une journée isolée**, prévenez au moins 48 heures à l’avance, sauf aggravation soudaine.
- **Remplissez le formulaire AJPP** avec le médecin et envoyez-le à la Caf ou à la MSA, puis transmettez chaque mois l’attestation des jours pris.
- **Coordonnez-vous à deux** et demandez à la Caf ou à la MSA comment les jours peuvent s’organiser entre vous.
- **Pensez aux autres soutiens** : don de jours de repos par des collègues, assistante sociale de l’hôpital, associations de parents.

## Questions fréquentes
**L’AJPP se cumule-t-elle avec d’autres aides ?** Non avec plusieurs prestations, dont les indemnités maternité, paternité ou d’adoption, le congé de naissance, la PreParE, l’AAH ou les allocations chômage. Elle peut se cumuler avec l’allocation de base de la Paje.

**Mon enfant a un handicap reconnu : puis-je aussi demander l’AEEH ?** L’AJPP n’est pas cumulable avec le complément d’AEEH pour le même enfant. Faites le point avec la Caf et la MDPH sur la solution la plus adaptée.

**Puis-je interrompre le congé plus tôt ?** Oui, en cas de baisse importante des ressources ou de décès de l’enfant, en prévenant l’employeur un mois avant la reprise.

## Quand demander conseil
L’assistante sociale du service hospitalier, votre Caf, la MDPH et votre médecin traitant peuvent vous accompagner. Prendre soin de vous compte aussi : parlez de votre fatigue à un professionnel. ${SOS}

${END}`,
  },
  // ───────────────────────────── Santé : Assurance Maladie et mutuelle ─────────────────────────────
  {
    ...BASE,
    slug: 'carte-vitale-rattacher-enfant-deux-parents-mutuelle',
    title: 'Carte Vitale, mutuelle, examens remboursés : bien assurer bébé dès la naissance',
    summary: 'Après la déclaration de naissance, rattachez l’enfant à la carte Vitale des deux parents et prévenez la mutuelle ; les examens de suivi de l’enfant sont pris en charge à 100 %.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['carte Vitale', 'rattachement enfant', 'ayant droit', 'mutuelle', 'complémentaire santé', 'ameli', 'examens obligatoires', 'remboursement'],
    max_age_months: 192,
    sources: [S.ameliVitale, S.ameli20, S.spParent],
    body_md: `Dans le tourbillon des premières semaines, une démarche simple évite bien des soucis : bien inscrire bébé auprès de l’Assurance Maladie et de la complémentaire santé. Ainsi, chaque parent peut l’emmener chez le médecin avec sa propre carte Vitale.

## En bref
- Déclarez la naissance à l’Assurance Maladie (ou à la MSA) et à votre mutuelle.
- L’Assurance Maladie conseille d’inscrire l’enfant sur la carte Vitale des deux parents, quelle que soit la situation familiale.
- Une fois la prise en compte confirmée, mettez la carte Vitale à jour, par exemple en pharmacie.
- Les 20 examens de suivi médical de l’enfant, jusqu’à 16 ans, sont pris en charge à 100 % sans avance de frais, hors dépassements d’honoraires.
- Le remboursement arrive sur le compte du parent dont la carte a été utilisée.

## Comprendre
**Le rattachement aux deux parents.** L’enfant est d’abord inscrit sur la carte du parent qui a fait la démarche. Pour l’ajouter sur la carte de l’autre parent, on passe par la rubrique Démarches du compte ameli du parent déjà rattaché, ou par le formulaire 3705 envoyé à la CPAM avec une copie de l’acte de naissance ou du livret de famille à jour. Le double rattachement n’est pas possible pour les travailleurs frontaliers.

**La mutuelle.** Service-Public rappelle de déclarer la naissance à la complémentaire santé, et d’y envoyer les justificatifs des éventuels frais de dépassement. Si le parent qui présente sa carte n’a pas l’enfant sur sa mutuelle, il faut transmettre le décompte à la mutuelle de l’autre parent.

**Les examens de suivi.** Ils s’échelonnent de la naissance à 16 ans, dont trois examens après 6 ans (entre 8 et 9 ans, entre 11 et 13 ans, entre 15 et 16 ans). Ils peuvent être réalisés par un médecin généraliste ou un pédiatre, en cabinet ou en centre de santé, et jusqu’à 6 ans en PMI. Le carnet de santé est à présenter à chaque consultation.

## Au quotidien
- **Déclarez la naissance dès le retour à la maison** : c’est la première étape avant le rattachement.
- **Ajoutez ensuite l’enfant sur la carte de l’autre parent**, pour que chacun puisse consulter avec sa propre carte.
- **Vérifiez votre contrat de mutuelle** : ajout de l’enfant, délai, garanties enfants (optique, dentaire, dépassements).
- **Choisissez un médecin pour le suivi** de votre enfant et notez les dates des examens dans le carnet de santé.
- **Conservez les décomptes** pour suivre les remboursements, surtout si les deux parents ont des mutuelles différentes.

## Questions fréquentes
**Les parents sont séparés : peut-on quand même rattacher l’enfant aux deux ?** Oui, l’Assurance Maladie recommande le rattachement aux deux parents quelle que soit la situation familiale.

**Pourquoi le remboursement arrive-t-il sur le compte de l’autre parent ?** Il est versé sur le compte du parent qui a présenté sa carte Vitale lors de la consultation.

**Les vaccins et examens obligatoires coûtent-ils quelque chose ?** Les examens de suivi sont pris en charge à 100 % sans avance de frais, sauf dépassements d’honoraires. Pour les vaccins, renseignez-vous auprès de votre médecin ou sur ameli.fr.

## Quand demander conseil
Votre CPAM (par le compte ameli ou en agence), votre mutuelle et la PMI répondent aux questions pratiques. Pour la santé de votre bébé, en cas de doute, appelez votre médecin ; en cas d’urgence, le 15 ou le 112. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'complementaire-sante-solidaire-famille-avec-enfants',
    title: 'Complémentaire santé solidaire : une mutuelle gratuite ou à petit prix pour la famille',
    summary: 'La Complémentaire santé solidaire (CSS) complète les remboursements de l’Assurance Maladie pour les foyers aux revenus modestes, gratuitement ou avec une petite participation.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['Complémentaire santé solidaire', 'CSS', 'mutuelle gratuite', 'CMU', 'ACS', 'petits revenus', 'RSA', 'ameli'],
    sources: [S.ameliCSS],
    body_md: `Une mutuelle coûte cher, surtout quand la famille s’agrandit. Pour les foyers aux ressources modestes, l’Assurance Maladie propose la Complémentaire santé solidaire (CSS). Selon vos revenus, elle est gratuite ou demande une participation limitée.

## En bref
- La CSS complète les remboursements de l’Assurance Maladie et réduit vos frais de santé.
- Elle est attribuée selon les ressources du foyer et le nombre de personnes qui le composent.
- Deux formules existent : sans participation financière, ou avec une participation qui dépend de l’âge de chaque membre (8 € par mois pour une personne de 29 ans ou moins).
- Les bénéficiaires du RSA y ont droit sans participation, avec une attribution automatique si la demande de RSA a été faite sur caf.fr.
- ${VERIF}

## Comprendre
**Les ressources prises en compte.** Ce sont toutes les sommes perçues sur 12 mois (revenus, pensions alimentaires, aides régulières…), pas seulement l’avis d’imposition. La période retenue correspond aux 12 mois civils qui précèdent le mois précédant la demande.

**Les plafonds au 1er avril 2026 (métropole).** Pour 3 personnes, 18 758 € par an pour la CSS sans participation et 25 324 € avec participation ; pour 4 personnes, 21 885 € et 29 544 €. Chaque personne supplémentaire augmente le plafond. Les plafonds sont plus élevés dans les DOM et à Mayotte.

**La participation.** Elle dépend de l’âge de chacun au 1er janvier : de 8 € par mois (29 ans et moins) à 30 € (70 ans et plus), sans dépasser 1 € par jour et par personne.

**Les salariés.** Vous pouvez demander une dispense d’adhésion à la mutuelle obligatoire de votre employeur pendant la durée de votre droit à la CSS.

**Les jeunes parents étudiants.** Pour un étudiant de moins de 25 ans, la demande est en principe faite avec ses parents, mais leurs ressources ne sont pas prises en compte si l’étudiant a ou attend un enfant.

## Au quotidien
- **Renseignez-vous auprès de votre CPAM** ou sur ameli.fr avant de résilier ou de souscrire une mutuelle.
- **Comptez bien les personnes du foyer** : l’arrivée d’un bébé peut faire passer sous un plafond.
- **Rassemblez vos justificatifs** de ressources des 12 derniers mois.
- **Notez la date de fin de votre droit** pour anticiper son renouvellement.
- **Ajoutez votre nouveau-né** à votre dossier CSS après la naissance : votre CPAM vous indiquera la démarche.

## Questions fréquentes
**J’attends un bébé : est-il compté dans le foyer ?** Les règles de composition du foyer sont précisées par votre CPAM ; posez la question lors de la demande, surtout si votre situation change à la naissance.

**Je suis allocataire du RSA : dois-je faire une demande ?** Si vous avez fait votre demande de RSA sur caf.fr, l’attribution est automatique, sauf opposition. Sinon, la CPAM vous contacte ou vous pouvez faire la demande.

**Puis-je garder des garanties en plus ?** Oui, la page de l’Assurance Maladie indique qu’une sur-complémentaire peut être souscrite.

## Quand demander conseil
Votre CPAM, le service social de l’Assurance Maladie, le CCAS de votre mairie ou une permanence d’accès aux soins de santé (PASS) à l’hôpital peuvent vous aider. Ne renoncez pas à des soins pour des raisons financières : parlez-en à votre médecin. ${SOS}

${END}`,
  },
  // ───────────────────────────── Papiers et voyages ─────────────────────────────
  {
    ...BASE,
    slug: 'carte-identite-passeport-bebe-enfant-demande',
    title: 'Carte d’identité de bébé ou de l’enfant : comment faire la demande ?',
    summary: 'Un mineur peut avoir une carte d’identité dès la naissance : demande gratuite en mairie équipée, en présence de l’enfant et d’un parent exerçant l’autorité parentale.',
    journeys: ['newborn', 'child'],
    tags: ['carte d’identité', 'CNI bébé', 'passeport enfant', 'mairie', 'ANTS', 'prédemande', 'voyage', 'autorité parentale'],
    sources: [S.spCNI, S.spAP],
    body_md: `Un premier voyage, une inscription, une démarche administrative : vient un jour où il faut une pièce d’identité pour votre enfant. Bonne nouvelle, la carte d’identité d’un mineur est gratuite et peut être demandée dès la naissance. Voici comment s’y préparer.

## En bref
- Tout mineur français peut obtenir une carte d’identité, quel que soit son âge, y compris un bébé.
- La demande se fait dans n’importe quelle mairie équipée d’une station d’enregistrement, souvent sur rendez-vous.
- L’enfant et son représentant légal (parent exerçant l’autorité parentale ou tuteur) doivent être présents ensemble.
- La carte est gratuite et valable 10 ans ; elle reste valable après la majorité.
- Les empreintes digitales sont prises à partir de 12 ans.

## Comprendre
**La prédemande en ligne.** Elle est facultative mais fait gagner du temps au guichet. Vous recevez un numéro ou un QR code à présenter.

**Les pièces à apporter (originaux).** Une photo d’identité de moins de 6 mois conforme aux normes, la pièce d’identité du parent et un justificatif de domicile à son nom, le passeport de l’enfant s’il en a un. Sans passeport, un extrait d’acte de naissance de moins de 3 mois peut être demandé, sauf si la commune de naissance a dématérialisé l’état civil.

**Les situations familiales particulières.** En cas de séparation, de résidence alternée ou d’autorité parentale exclusive, des justificatifs complémentaires sont demandés (jugement, justificatif de résidence alternée…). Le parent doit pouvoir prouver qu’il exerce l’autorité parentale. La demande d’un titre d’identité fait partie des démarches administratives courantes.

**Le délai.** La carte est fabriquée ailleurs : comptez plusieurs semaines, davantage avant les vacances. Le suivi se fait sur le site de l’ANTS, avec un SMS si vous avez donné un numéro.

## Au quotidien
- **Anticipez de plusieurs semaines, voire plusieurs mois** avant un voyage, surtout à l’approche des vacances.
- **Prenez rendez-vous** dans une mairie équipée, pas forcément celle de votre domicile.
- **Faites la photo avec soin** : même pour un bébé, elle doit respecter les normes officielles. Demandez conseil au photographe.
- **Retirez la carte dans les 3 mois** après sa mise à disposition, sinon elle est détruite. À partir de 12 ans, l’enfant doit être présent au retrait.
- **Rangez la carte avec le livret de famille** et le carnet de santé dans votre dossier « papiers de l’enfant ».

## Questions fréquentes
**Faut-il les deux parents au guichet ?** La fiche indique que le mineur doit être accompagné de son représentant légal, qui doit exercer l’autorité parentale et pouvoir le prouver.

**Carte d’identité ou passeport ?** Cela dépend de la destination. Le passeport d’un mineur fait l’objet d’une démarche distincte, également décrite sur Service-Public.

**Mon enfant voyage sans nous : la carte suffit-elle ?** Non, s’il quitte la France sans un titulaire de l’autorité parentale, il lui faut aussi une autorisation de sortie du territoire.

## Quand demander conseil
La mairie, le site de l’ANTS ou Allô Service Public répondent à vos questions. En cas de conflit entre parents sur un voyage ou un titre d’identité, un point-justice ou un avocat peut vous orienter. ${SOS}

${END}`,
  },
  {
    ...BASE,
    slug: 'autorisation-de-sortie-du-territoire-enfant-sans-parent',
    title: 'Votre enfant part à l’étranger sans vous : l’autorisation de sortie du territoire',
    summary: 'Un mineur qui quitte la France sans un titulaire de l’autorité parentale doit avoir une autorisation de sortie du territoire (AST), remplie et signée par un parent.',
    journeys: ['newborn', 'child'],
    tags: ['autorisation de sortie du territoire', 'AST', 'voyage scolaire', 'séjour linguistique', 'colonie', 'mineur seul', 'grands-parents', 'frontière'],
    sources: [S.spAST, S.spAP],
    body_md: `Voyage avec les grands-parents, séjour linguistique, colonie à l’étranger : quand votre enfant quitte la France sans vous, un document supplémentaire est exigé. Il s’agit de l’autorisation de sortie du territoire (AST), qui se remplit à la maison, sans passer par la mairie.

## En bref
- L’AST est obligatoire dès qu’un mineur résidant en France quitte le territoire sans être accompagné d’un titulaire de l’autorité parentale.
- Elle n’est pas nécessaire si l’enfant voyage avec son père ou sa mère, même en cas de séparation.
- Le formulaire se télécharge sur Service-Public, se remplit et se signe par un parent titulaire de l’autorité parentale ; aucune démarche en mairie, en préfecture ou au commissariat.
- L’enfant voyage avec l’AST, la copie de la pièce d’identité du parent signataire et sa propre pièce d’identité valide.
- Sa durée est fixée par le parent, sans dépasser un an.

## Comprendre
**Qui signe ?** Un seul parent titulaire de l’autorité parentale suffit, même en couple ; Service-Public conseille toutefois d’obtenir l’accord de l’autre parent. Si l’autorité parentale est exclusive, seul le parent qui la détient peut signer.

**Les pièces qui accompagnent l’AST.** Une photocopie lisible de la carte d’identité ou du passeport du signataire, avec nom, prénoms, date et lieu de naissance, photo, signature, dates de délivrance et de validité. Pour un parent français, le titre peut être valide ou périmé depuis moins de 5 ans. L’enfant doit avoir sa propre pièce d’identité valide et, si la destination l’exige, un visa. Le livret de famille ne peut pas être exigé.

**Les cas particuliers.** Un trajet entre la métropole et un département d’outre-mer avec une escale à l’étranger nécessite une AST. Un enfant faisant l’objet d’une opposition ou d’une interdiction de sortie du territoire ne peut pas partir, même avec une AST.

## Au quotidien
- **Préparez les documents plusieurs semaines avant** : vérifiez d’abord la validité de la pièce d’identité de l’enfant, dont la fabrication prend du temps.
- **Fixez une durée adaptée** : un seul voyage, ou plusieurs mois si l’enfant voyage souvent avec un proche.
- **Remettez un dossier complet** à l’adulte accompagnant (AST, copie de votre pièce d’identité, coordonnées, carnet de santé ou informations médicales utiles).
- **Informez l’autre parent** même si sa signature n’est pas obligatoire.
- **Pour un voyage scolaire**, suivez aussi les consignes de l’établissement.

## Questions fréquentes
**Mon enfant part avec son père, nous sommes séparés : faut-il une AST ?** Non, l’AST n’est pas nécessaire lorsque l’enfant voyage avec l’un de ses parents.

**Une copie de l’AST suffit-elle ?** L’AST est présentée au garde-frontière lors du contrôle. Imprimez l’original signé et gardez une copie de sécurité.

**La compagnie aérienne refuse l’embarquement : que faire ?** Service-Public indique d’adresser une réclamation à la compagnie, puis de saisir la Direction générale de l’aviation civile sans réponse sous 2 mois.

## Quand demander conseil
Pour une question sur un voyage précis, consultez Service-Public, l’ambassade du pays de destination ou la police aux frontières. Si vous craignez un départ à l’étranger de votre enfant sans votre accord, parlez-en rapidement à un avocat ou au commissariat ; en cas de danger, le 17. ${SOS}

${END}`,
  },
  // ───────────────────────────── Logement ─────────────────────────────
  {
    ...BASE,
    slug: 'logement-apl-prime-demenagement-famille-qui-s-agrandit',
    title: 'La famille s’agrandit : aides au logement et prime de déménagement',
    summary: 'L’arrivée d’un enfant peut modifier vos aides au logement ; à partir du 3e enfant, une prime de déménagement peut rembourser une partie des frais si vous changez de logement.',
    journeys: ['pregnant', 'newborn', 'child'],
    tags: ['APL', 'aide au logement', 'ALF', 'prime de déménagement', 'déménager enceinte', 'troisième enfant', 'Caf', 'logement famille'],
    sources: [S.spAPL, S.spDemenag],
    body_md: `Une chambre en plus devient vite nécessaire quand la famille s’agrandit. Les aides au logement tiennent compte des personnes à charge, et une prime spécifique existe pour les familles nombreuses qui déménagent. Voici ce qu’il faut savoir avant de signer un nouveau bail.

## En bref
- L’aide personnalisée au logement (APL) tient compte du nombre de personnes à charge vivant au foyer, de vos ressources et du loyer.
- Tout changement de situation familiale (naissance, séparation…) doit être signalé rapidement à la Caf ou à la MSA.
- En cas de déménagement, il faut refaire une demande d’aide pour le nouveau logement.
- La prime de déménagement concerne les familles d’au moins 3 enfants (nés ou à naître) qui déménagent pendant une période liée à la grossesse ou à l’âge du dernier enfant.
- ${VERIF}

## Comprendre
**Le calcul de l’APL.** Il repose sur des barèmes qui prennent en compte les personnes à charge vivant habituellement au foyer, les ressources des 12 derniers mois du foyer, le patrimoine au-delà de 30 000 € et le loyer. Les ressources sont actualisées automatiquement tous les trois mois. Le logement doit être votre résidence principale, décent et, pour l’APL, conventionné.

**Le versement.** L’APL est versée à partir du 1er jour du mois qui suit la demande, directement au bailleur. Comptez un délai de traitement de quelques semaines si le dossier est complet.

**La prime de déménagement.** Il faut avoir au moins 3 enfants à charge, nés ou à naître, et déménager entre le premier jour du mois suivant la fin du 3e mois de grossesse et le dernier jour du mois précédant les 2 ans du dernier enfant. Il faut aussi avoir droit à l’APL ou à l’allocation de logement familiale pour le nouveau logement. Il n’y a pas de condition de ressources.

**Le montant de la prime.** Elle rembourse les frais réellement engagés dans la limite d’un plafond : 1 147,58 € pour 3 enfants, 1 243,21 € pour 4 enfants, puis 95,63 € par enfant supplémentaire (montants affichés en 2026).

## Au quotidien
- **Faites une simulation** d’aide au logement sur caf.fr avant de choisir un logement.
- **Déclarez la naissance** et toute nouvelle situation dans votre espace Caf pour que l’aide soit recalculée.
- **Gardez tous les justificatifs** du déménagement : devis, factures acquittées, location de véhicule.
- **Demandez la prime dans les 6 mois** qui suivent le déménagement, avec le formulaire prévu et les justificatifs.
- **En cas de budget serré**, une avance de 50 à 75 % du devis peut être demandée, le solde étant versé sur facture.

## Questions fréquentes
**Je suis enceinte de mon 3e enfant : puis-je déjà toucher la prime ?** Oui, si vous déménagez après la fin du 3e mois de grossesse et remplissez les autres conditions, puisque les enfants à naître sont comptés.

**Mon aide au logement a-t-elle été suspendue ?** Le versement peut être suspendu si le logement n’est plus décent, en cas d’impayés de loyer ou si des justificatifs manquent. Contactez rapidement votre Caf.

**La Caf a refusé : puis-je contester ?** Oui, dans un délai de 2 mois, avec possibilité de saisir un médiateur puis la commission de recours amiable.

## Quand demander conseil
Votre Caf ou votre MSA, l’ADIL (agence départementale d’information sur le logement) ou le CCAS de votre mairie peuvent vous accompagner. En cas de risque d’expulsion ou de logement dangereux pour la santé des enfants, signalez-le sans attendre à la mairie ou au service social. ${SOS}

${END}`,
  },
];
