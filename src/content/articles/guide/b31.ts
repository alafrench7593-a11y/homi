/** Guide complet — lot 31 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles ou de référence françaises).
const S = {
  ameliRegles: { label: 'ameli.fr — Informations et conseils sur les règles ou menstruations', url: 'https://www.ameli.fr/assure/sante/themes/puberte/informations-conseils-regles', consulted_on: C, published: '2026-09-29' },
  ameliSaignDef: { label: 'ameli.fr — Qu’est-ce qu’un saignement gynécologique anormal en dehors de la grossesse ?', url: 'https://www.ameli.fr/assure/sante/themes/saignements-gynecologiques-anormaux/saignements-gynecologiques-anormaux-definition', consulted_on: C },
  ameliSaignCauses: { label: 'ameli.fr — Saignements entre les règles ou règles très abondantes : quelles causes ?', url: 'https://www.ameli.fr/assure/sante/themes/saignements-gynecologiques-anormaux/saignements-entre-les-regles-ou-regles-abondantes-longues-les-causes', consulted_on: C },
  qsRegles: { label: 'QuestionSexualité (Santé publique France) — Règles : tout savoir sur le cycle menstruel', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/le-corps-et-son-fonctionnement/tout-savoir-sur-les-regles', consulted_on: C },
  santeTroubles: { label: 'Santé.fr — Troubles des règles', url: 'https://www.sante.fr/troubles-des-regles', consulted_on: C, published: '2026-08-14' },
  santeDysmeno: { label: 'Santé.fr — Règles douloureuses (dysménorrhées)', url: 'https://www.sante.fr/regles-douloureuses-dysmenorrhees', consulted_on: C, published: '2026-08-12' },
  ameliDouleursCauses: { label: 'ameli.fr — Douleurs pendant les règles ou dysménorrhée : quelles sont les causes ?', url: 'https://www.ameli.fr/assure/sante/themes/regles-douloureuses/douleurs-regles', consulted_on: C, published: '2026-09-29' },
  ameliDouleursTtt: { label: 'ameli.fr — Règles douloureuses : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/themes/regles-douloureuses/consultation-traitement', consulted_on: C, published: '2025-06-25' },
  ameliAmeno: { label: 'ameli.fr — Qu’est-ce qu’une aménorrhée et quand faut-il s’inquiéter de l’absence de règles ?', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/amenorrhee-regles-retard-absence', consulted_on: C },
  ameliAmenoCauses: { label: 'ameli.fr — Aménorrhée secondaire, arrêt des règles de plus de 3 mois : quelles causes ?', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/amenorrhee-regles-retard-absence-0', consulted_on: C },
  ansesProtections: { label: 'Anses — Protections intimes : composition et choc toxique, toutes nos recommandations', url: 'https://www.anses.fr/fr/content/protections-intimes-composition-et-choc-toxique-toutes-nos-recommandations', consulted_on: C, published: '2025-05-28' },
  ameliProtections: { label: 'ameli.fr — Protections intimes périodiques : comment les utiliser en toute sécurité ?', url: 'https://www.ameli.fr/assure/sante/themes/regles-et-protections-intimes/protections-intimes-periodiques-comment-les-utiliser-en-toute-securite', consulted_on: C, published: '2026-09-29' },
  ameliChoc: { label: 'ameli.fr — Protections périodiques et risque de choc toxique lors des règles', url: 'https://www.ameli.fr/assure/sante/themes/regles-et-protections-intimes/protections-periodiques-et-risque-de-choc-toxique-lors-des-regles', consulted_on: C, published: '2026-09-29' },
  qsProtections: { label: 'QuestionSexualité (Santé publique France) — Quelle protection hygiénique adopter pendant les règles ?', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/le-corps-et-son-fonctionnement/quelle-protection-pendant-les-regles', consulted_on: C },
  dgccrfProtections: { label: 'DGCCRF (economie.gouv.fr) — Produits d’hygiène féminine : serviettes, tampons et coupes menstruelles', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/produits-dhygiene-feminine-serviettes-tampons-et-coupes-menstruelles', consulted_on: C, published: '2024-04-03' },
  etudiantReutilisables: { label: 'etudiant.gouv.fr — Protections menstruelles réutilisables : ce qui va changer en 2026', url: 'https://www.etudiant.gouv.fr/fr/protections-menstruelles-reutilisables-ce-qui-va-changer-en-2026-3422', consulted_on: C, published: '2026-09-30' },
  egalitePrecarite: { label: 'Ministère chargé de l’Égalité femmes-hommes — Le Gouvernement engagé pour lutter contre la précarité menstruelle', url: 'https://www.egalite-femmes-hommes.gouv.fr/journee-mondiale-de-lhygiene-menstruelle-le-gouvernement-est-pleinement-engage-pour-lutter-contre-la-precarite-menstruelle-28-mai-2021', consulted_on: C, published: '2021-05-28' },
  ameliSaignBilan: { label: 'ameli.fr — Saignements entre les règles ou règles très abondantes : quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/saignements-gynecologiques-anormaux/saignements-entre-les-regles-ou-regles-tres-abondantes-longues-le-bilan', consulted_on: C },
  ameliAnemieCauses: { label: 'ameli.fr — Qu’est-ce qu’une anémie par carence en fer et quelles sont les causes ?', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/definition-causes-anemie-carence-fer', consulted_on: C, published: '2026-06-09' },
  ameliAnemieSympt: { label: 'ameli.fr — Symptômes et diagnostic de l’anémie par carence en fer', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/symptomes-diagnostic', consulted_on: C, published: '2024-04-22' },
  ameliFer: { label: 'ameli.fr — Bien couvrir ses besoins en fer et consulter en cas de saignement', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/couvrir-besoins-fer-age', consulted_on: C, published: '2023-07-31' },
  santeThe: { label: 'Santé.fr — Boire du thé en mangeant empêche-t-il l’absorption du fer ?', url: 'https://www.sante.fr/decryptage/nos-reponses/boire-du-en-mangeant-empeche-t-il-labsorption-du-fer', consulted_on: C, published: '2026-07-06' },
  ameliMigraine: { label: 'ameli.fr — Migraine : symptômes, facteurs déclenchants et évolution', url: 'https://www.ameli.fr/assure/sante/themes/migraine/symptomes-facteurs-declenchants-evolution', consulted_on: C, published: '2025-10-17' },
  ameliMigraineTtt: { label: 'ameli.fr — Migraine : consultation médicale et traitement', url: 'https://www.ameli.fr/assure/sante/themes/migraine/diagnostic-traitement', consulted_on: C, published: '2026-01-22' },
  sportsCycle: { label: 'Ministère des Sports — Cycle menstruel et performance (guide IPCS, sportives de haut niveau)', url: 'https://www.sports.gouv.fr/sites/default/files/2025-09/guide-ipcs-cycle-menstruel-et-performance-pdf-47358.pdf', consulted_on: C },
  psycomFemmes: { label: 'Psycom (Santé mentale Info) — La santé mentale des femmes', url: 'https://www.psycom.org/sinformer/la-sante-mentale/la-sante-mentale-des-femmes/', consulted_on: C, published: '2026-09-16' },
  filsanteRegles: { label: 'Fil Santé Jeunes — Vivre avec les règles', url: 'https://www.filsantejeunes.com/vivre-avec-les-regles-18771', consulted_on: C, published: '2024-02-23' },
  etudiantEndo: { label: 'etudiant.gouv.fr — Endométriose : les aménagements d’études qui s’adaptent à vos besoins', url: 'https://www.etudiant.gouv.fr/fr/amenagements-endometriose', consulted_on: C, published: '2025-01-20' },
  santeEndoTravail: { label: 'Santé.fr — Endométriose et travail : 3 ressources pour comprendre et agir en entreprise', url: 'https://www.sante.fr/endometriose/endometriose-et-travail-3-ressources-pour-comprendre-et-agir-en-entreprise', consulted_on: C, published: '2024-03-07' },
  santeTests: { label: 'Santé.fr (contenu Fil Santé Jeunes) — Les tests de grossesse', url: 'https://www.sante.fr/les-tests-de-grossesse', consulted_on: C, published: '2022-07-27' },
  qsEnceinte: { label: 'QuestionSexualité (Santé publique France) — Enceinte : comment savoir ?', url: 'https://www.questionsexualite.fr/comprendre-la-conception-et-la-grossesse/la-grossesse/comment-savoir-si-vous-etes-enceinte', consulted_on: C },
  ameliSopk: { label: 'ameli.fr — Symptômes, diagnostic et évolution du syndrome des ovaires polykystiques', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-ovaires-polykystiques/symptomes-diagnostic-evolution', consulted_on: C, published: '2026-01-12' },
  ameliNaturelles: { label: 'ameli.fr — Les méthodes naturelles de contraception', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-naturelles-contraception', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article t’informe ; il ne remplace pas l’avis d’un médecin, d’une sage-femme, d’un ou d’une gynécologue ou d’un pharmacien._';
const URG = 'En cas de saignement très abondant avec malaise, de douleur brutale et intense dans le ventre (surtout si tes règles sont en retard), de fièvre avec douleurs du bas-ventre, ou de fièvre élevée avec malaise pendant le port d’un tampon ou d’une coupe, appelle le **15** (SAMU) ou le **112**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys' | 'category'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['avoid'], category: 'regles', status: 'to_review', ...x,
});

export const GUIDE_B31: LibArticle[] = [
  // ------------------------------------------------------------ repères
  a({
    slug: 'regles-duree-abondance-reperes',
    title: 'Durée, abondance, couleur : les repères pour connaître tes règles',
    summary: 'Combien de jours durent les règles, quelle quantité de sang, pourquoi la couleur change : les repères donnés par les sources de santé publique pour mieux te situer.',
    tags: ['durée des règles', 'combien de jours règles', 'quantité de sang règles', 'couleur des règles', 'sang marron', 'cycle menstruel', 'règles normales', 'flux'],
    journeys: ['avoid', 'ttc'],
    sources: [S.ameliRegles, S.ameliSaignDef, S.qsRegles],
    body_md: `## En bref
- Selon l’Assurance Maladie, les règles durent **en général 3 à 6 jours** et sont souvent plus abondantes les **3 premiers jours**.
- Un cycle dure **en moyenne 28 jours**, avec des écarts courants **entre 23 et 35 jours**.
- La quantité de sang perdue sur l’ensemble des règles est souvent estimée **sous 60 ml** (environ 4 cuillères à soupe) ; au-delà de **80 ml** ou de **7 jours**, on parle de règles abondantes.
- La couleur varie selon la vitesse d’écoulement : **rouge et fluide** quand le sang coule vite, **marron et plus épais** quand il coule lentement.
- Chaque personne a ses propres repères : ce qui compte surtout, c’est un **changement** par rapport à ton habitude.

## Comprendre
Les règles correspondent à l’élimination de la couche superficielle de la muqueuse de l’utérus (l’endomètre) quand il n’y a pas eu de fécondation. Le premier jour des règles marque le début d’un nouveau cycle.

Le cycle comporte deux phases séparées par l’ovulation. La première (phase folliculaire) peut varier en longueur d’un cycle à l’autre : c’est elle qui explique la plupart des différences de durée. La seconde (phase lutéale) est plus stable, autour de 12 à 16 jours. Quand il n’y a pas de grossesse, la baisse des hormones déclenche les règles.

Le sang des règles n’est pas du sang « comme celui d’une coupure » : il contient aussi de la muqueuse utérine et de la glaire. QuestionSexualité explique ainsi les différences de couleur : un sang rouge vif s’écoule rapidement ; un sang marron, un peu grumeleux, a mis plus de temps à sortir, s’est oxydé et a épaissi. Les fins de règles sont donc souvent plus sombres.

Côté quantité, les repères officiels diffèrent un peu selon la manière de compter : l’Assurance Maladie parle de règles abondantes au-delà de 80 ml et/ou plus de 6 jours ; QuestionSexualité retient une perte inférieure à 60 ml comme habituelle et parle de ménorragies au-delà de 80 ml et/ou 7 jours. Comme personne ne mesure ses règles au millilitre, ces chiffres servent surtout de point de repère.

À l’adolescence et à l’approche de la ménopause, les cycles sont souvent plus irréguliers.

## Au quotidien
- **Compte la durée de ton cycle** : du premier jour des règles au premier jour des règles suivantes. Au bout de 3 ou 4 cycles, tu obtiens une moyenne.
- **Note quelques infos simples** dans un calendrier ou dans l’app : date de début, nombre de jours, jours les plus abondants, douleur éventuelle.
- **Observe ton rythme de changement de protection** : c’est un bon indicateur concret de l’abondance.
- **Garde toujours une protection sur toi** : les règles peuvent arriver sans prévenir, surtout si ton cycle varie.
- Les règles ne t’obligent pas à arrêter tes activités, sport compris.

## Questions fréquentes
**Mes règles durent 2 jours seulement, est-ce un souci ?** La durée varie beaucoup d’une personne à l’autre. Si c’est ton fonctionnement habituel et que tu te sens bien, c’est surtout un changement net ou des signes associés (douleurs, saignements entre les règles) qui doivent amener à en parler à un professionnel.

**Pourquoi mon sang est-il marron au début ou à la fin ?** Parce qu’il s’écoule lentement et a le temps de s’oxyder. C’est fréquent en tout début et en fin de règles.

**Comment savoir si j’ai des règles abondantes ?** Un repère pratique donné par QuestionSexualité : devoir changer de protection **au moins toutes les deux heures pendant toute une journée**. Des règles qui débordent malgré tes protections habituelles, ou qui durent plus d’une semaine, méritent aussi une consultation.

**Mon cycle change d’un mois à l’autre, faut-il s’inquiéter ?** Des variations de quelques jours sont courantes, notamment parce que la première phase du cycle varie. Des cycles très courts, très longs ou très imprévisibles sont à évoquer avec un professionnel.

## Quand demander conseil
Consulte si tes règles deviennent très abondantes ou très longues et gênent ton quotidien, si elles s’accompagnent de douleurs importantes et répétées, si tu saignes entre les règles, ou si tes règles s’arrêtent plus de 3 mois (hors grossesse, allaitement ou ménopause). Une douleur qui t’empêche de vivre normalement n’a pas à être subie : elle mérite une consultation.

${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-abondantes-menorragies-quand-consulter',
    title: 'Règles abondantes (ménorragies) : les reconnaître et quand consulter',
    summary: 'Protections qui débordent, règles qui durent plus d’une semaine : comment reconnaître des règles abondantes, leurs causes possibles et pourquoi en parler à un professionnel.',
    tags: ['règles abondantes', 'ménorragie', 'règles hémorragiques', 'règles longues', 'flux abondant', 'fibrome', 'polype', 'stérilet cuivre', 'fatigue règles'],
    safety_critical: true,
    sources: [S.ameliSaignDef, S.ameliSaignCauses, S.santeTroubles],
    body_md: `## En bref
- On parle de **ménorragies** quand les règles sont anormalement **abondantes** (plus de 80 ml) et/ou **longues** (plus de 6 à 7 jours selon les sources).
- Signe concret : des protections qui **ne suffisent plus**, ou qu’il faut changer **toutes les deux heures** pendant une journée entière.
- Les causes les plus fréquentes sont des **déséquilibres hormonaux**, des **polypes ou fibromes**, l’**adénomyose**, le **stérilet au cuivre** et, plus rarement, des **anomalies de la coagulation**.
- Des règles très abondantes qui gênent ton quotidien justifient **un avis médical** : il existe des traitements.

## Comprendre
L’Assurance Maladie définit les ménorragies comme des saignements survenant à la date prévue des règles mais anormalement abondants (plus de 80 ml) et/ou longs (plus de 6 jours). Santé.fr parle de règles dépassant leur durée habituelle ou d’un flux qui n’est plus contrôlé par tes protections habituelles.

Les causes possibles sont nombreuses :
- **Déséquilibres hormonaux**, en particulier les troubles de l’ovulation, fréquents à la puberté et à l’approche de la ménopause : les premiers et les derniers cycles sont souvent plus abondants.
- **Polypes et fibromes de l’utérus**, des formations le plus souvent bénignes.
- **Adénomyose**, quand de la muqueuse utérine se trouve dans le muscle de l’utérus.
- **Stérilet au cuivre** : Santé.fr indique qu’un stérilet hormonal peut alors être envisagé avec le professionnel.
- **Anomalies de la coagulation** (comme la maladie de Willebrand), rares, que l’on recherche notamment chez l’adolescente et la jeune femme.
- Un **traitement anticoagulant** pris pour une autre raison.
- Plus rarement, une anomalie de l’endomètre, comme un épaississement (hyperplasie).

Le traitement vise la cause : certains médicaments hormonaux, d’autres qui agissent sur la coagulation ou les contractions de l’utérus, ou la prise en charge d’un fibrome ou d’un polype. C’est le médecin qui choisit selon ta situation.

## Au quotidien
- **Note ce que tu observes** pendant 2 ou 3 cycles : nombre de jours, nombre de protections par jour, protections qui débordent, nuits où tu dois te lever, présence de caillots. Ces infos aident beaucoup en consultation.
- **Adapte tes protections** à ton flux plutôt que de garder plus longtemps une protection interne très absorbante : l’Anses recommande un pouvoir absorbant adapté et un changement régulier.
- **Sois attentive à la fatigue**, à l’essoufflement ou à une pâleur : des pertes de sang importantes répétées peuvent conduire à une anémie, à vérifier avec un médecin.
- **Prévois un kit** (protections de rechange, sous-vêtement) au travail, à l’école ou en sortie pour vivre plus sereinement les jours les plus abondants.

## Questions fréquentes
**Des règles abondantes, est-ce grave ?** Le plus souvent, la cause est bénigne. Mais elles peuvent fatiguer, perturber la vie quotidienne et cacher une cause qui se traite : c’est pourquoi elles méritent un avis médical.

**Quels examens peut-on me proposer ?** Selon la situation, un examen clinique, une échographie et, chez l’adolescente ou la jeune femme, la recherche d’un trouble de la coagulation. D’autres examens ne sont faits que si l’échographie montre quelque chose de suspect.

**Mon stérilet au cuivre rend mes règles plus abondantes, que faire ?** C’est une cause connue. Parles-en au professionnel qui te suit : il pourra discuter avec toi d’autres options de contraception.

**À l’adolescence, mes règles sont très abondantes, est-ce que ça passe ?** Les troubles de l’ovulation des premiers cycles se résolvent souvent spontanément, mais un traitement peut soulager. Consulte, notamment si des proches ont des problèmes de saignement.

## Quand demander conseil
Prends rendez-vous si tes règles débordent malgré tes protections habituelles, durent plus d’une semaine, s’accompagnent de fatigue marquée, d’essoufflement ou de pâleur, ou si elles deviennent plus abondantes qu’avant. Pour en savoir plus sur les maladies rares de la coagulation, Maladies Rares Info Services répond au **0800 40 40 43** (appel gratuit).

${URG}

${FIN}`,
  }),
  a({
    slug: 'saignements-entre-les-regles-spotting',
    title: 'Saignements entre les règles (spotting) : causes possibles et quand consulter',
    summary: 'Petites pertes brunâtres, saignement après un rapport, saignements sous pilule : ce que peuvent signifier des saignements en dehors des règles et pourquoi les signaler.',
    tags: ['spotting', 'saignement entre les règles', 'métrorragie', 'pertes marron', 'saignement après rapport', 'saignement sous pilule', 'oubli de pilule', 'polype'],
    safety_critical: true,
    sources: [S.ameliSaignDef, S.ameliSaignCauses],
    body_md: `## En bref
- On parle de **métrorragie** pour un saignement en dehors des règles, et de **spotting** quand il est peu abondant, souvent brunâtre.
- Cause fréquente : la **contraception hormonale** (oubli de pilule, contraception progestative, stérilet hormonal).
- D’autres causes sont à rechercher : **infection**, **polype**, **fibrome**, **lésion du col de l’utérus**.
- Un saignement **après un rapport sexuel** doit être signalé à un professionnel.
- En cas de **retard de règles** avec saignement et douleur, pense à une grossesse et consulte rapidement.

## Comprendre
L’Assurance Maladie distingue plusieurs types de saignements anormaux hors grossesse : les métrorragies (saignements en dehors des règles), le spotting (petite quantité, souvent brunâtre) et les ménométrorragies (saignements anormaux pendant et entre les règles).

Les déséquilibres hormonaux sont la cause la plus fréquente :
- sous **pilule œstroprogestative**, des saignements peuvent apparaître en cas d’oubli ou de déséquilibre entre les hormones ;
- une **contraception progestative** (pilule, stérilet hormonal) entraîne souvent de petits saignements modérés ;
- à la puberté et à l’approche de la ménopause, les troubles de l’ovulation rendent les cycles irréguliers.

D’autres causes sont à rechercher par un professionnel :
- **infection gynécologique**, dont certaines infections sexuellement transmissibles qui touchent le col (pertes, douleurs pendant les rapports, petits saignements) ;
- **polypes** de l’utérus ou du col, **fibromes** ;
- **endométrite** (infection de la muqueuse utérine), avec fièvre et pertes anormales ;
- **lésion ou cancer du col de l’utérus** : l’Assurance Maladie précise que les saignements surviennent d’abord après les rapports, peu abondants et sans douleur, d’où l’intérêt du dépistage régulier ;
- plus rarement, un traitement anticoagulant ou un trouble de la coagulation.

## Au quotidien
- **Note les dates** des saignements dans ton calendrier : moment du cycle, abondance, couleur, lien éventuel avec un rapport ou un oubli de pilule.
- **Sous pilule**, relis la notice et les consignes en cas d’oubli ; si tu as un doute sur ta protection contraceptive, demande conseil à un pharmacien.
- **Pense au dépistage du cancer du col** de l’utérus aux âges recommandés : il repère des lésions avant qu’elles ne donnent des symptômes.
- **Protège-toi des IST** avec le préservatif et fais-toi dépister en cas de doute.
- Un protège-slip peut suffire pour du spotting ; change-le régulièrement.

## Questions fréquentes
**J’ai eu des petits saignements après avoir commencé une nouvelle pilule, est-ce inquiétant ?** Les saignements sont fréquents avec certaines contraceptions hormonales, surtout au début. S’ils persistent, augmentent ou te gênent, parles-en au professionnel qui te l’a prescrite.

**Je saigne un peu après les rapports, que faire ?** Consulte : cela peut venir du col de l’utérus (infection, polype, lésion). Un examen simple permet souvent d’y voir clair.

**Peut-on saigner au moment de l’ovulation ?** Certaines personnes observent de petites pertes au milieu du cycle. Comme d’autres causes sont possibles, il vaut mieux en parler à un professionnel si cela se répète ou si c’est nouveau.

**Et si j’ai du retard et des saignements ?** Fais un test de grossesse. Un saignement avec douleur du ventre en début de grossesse nécessite un avis médical rapide.

## Quand demander conseil
Consulte si les saignements entre les règles se répètent, apparaissent après les rapports, s’accompagnent de pertes inhabituelles, de douleurs ou de fièvre, ou surviennent après la ménopause. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
  a({
    slug: 'syndrome-premenstruel-spm-comprendre-soulager',
    title: 'Syndrome prémenstruel (SPM) : comprendre ce qui se passe et mieux vivre ces jours-là',
    summary: 'Seins tendus, ventre gonflé, irritabilité, coup de blues avant les règles : ce qu’est le syndrome prémenstruel, ce qui peut aider au quotidien et quand en parler.',
    tags: ['syndrome prémenstruel', 'SPM', 'avant les règles', 'seins douloureux', 'ballonnements', 'irritabilité', 'humeur avant les règles', 'rétention d’eau'],
    journeys: ['avoid', 'ttc'],
    sources: [S.santeTroubles, S.ameliRegles, S.qsRegles],
    body_md: `## En bref
- Le **syndrome prémenstruel** regroupe des symptômes physiques et émotionnels qui apparaissent **environ une semaine avant les règles** et disparaissent **en un ou deux jours** après leur début.
- Signes fréquents : **seins tendus**, **ballonnements**, sensation de gonflement, maux de tête, **irritabilité**, tristesse, fatigue.
- Ses mécanismes sont encore mal connus ; il est lié aux variations hormonales après l’ovulation.
- Des habitudes de vie peuvent aider, même si leur efficacité n’est pas démontrée scientifiquement.
- S’il est **invalidant**, parles-en à un médecin : des solutions existent.

## Comprendre
Santé.fr décrit le syndrome prémenstruel (SPM) comme un ensemble de symptômes qui survient environ une semaine avant les règles et disparaît un ou deux jours après leur arrivée.

**Côté corps** : seins douloureux, prise de poids passagère, sensation de gonflement, ballonnements, maux de ventre, douleurs dans le bas du dos. Une partie de ces symptômes s’explique par une rétention d’eau.

**Côté émotions** : tristesse, manque d’énergie, crises de larmes, irritabilité, anxiété.

Les mécanismes ne sont pas complètement compris : le SPM serait lié à la baisse des hormones sexuelles en fin de cycle, après l’ovulation. Son intensité varie beaucoup d’une personne à l’autre et d’un cycle à l’autre.

Chez une petite partie des femmes (5 à 10 % selon QuestionSexualité), les symptômes émotionnels sont sévères, avec humeur dépressive ou forte anxiété : on parle alors de **trouble dysphorique prémenstruel**, qui nécessite d’en parler à un médecin.

## Au quotidien
Santé.fr cite plusieurs pistes, en précisant que leur efficacité n’est pas démontrée scientifiquement. Tu peux tester ce qui te fait du bien :
- **Alimentation** : moins de sel dans les jours qui précèdent les règles, et limiter les excitants (café, alcool, tabac).
- **Bouger** : marche, vélo, natation, danse… ou des pratiques de **relaxation**.
- **Sommeil** : te coucher à heures régulières et préserver ton temps de repos.
- **Stress** : alléger ton planning si possible ces jours-là, prévoir des moments pour toi.
- **Repérer** : note tes symptômes dans un calendrier pendant 2 ou 3 cycles. Voir qu’ils reviennent toujours à la même période aide à anticiper, à en parler à ton entourage et à préparer la consultation.
- **En parler** : expliquer à ton ou ta partenaire, à ta famille ou à tes amis ce que tu traverses peut alléger la tension.

## Questions fréquentes
**Comment savoir si c’est un SPM ou autre chose ?** Le SPM a un calendrier typique : il revient avant chaque règles et s’efface dès leur début. Si tes symptômes durent tout le mois, ne s’améliorent pas avec les règles ou s’aggravent, parles-en à un médecin.

**Existe-t-il des traitements ?** Si le SPM est invalidant, Santé.fr indique que le médecin peut proposer un antalgique ou un anti-inflammatoire, et parfois d’autres traitements selon les symptômes. Demande conseil avant toute automédication.

**Mes seins sont douloureux avant les règles, est-ce lié ?** La tension mammaire fait partie des signes les plus cités du SPM. Une boule qui persiste après les règles, un écoulement ou une modification de la peau doivent en revanche être montrés à un professionnel.

**Le SPM peut-il changer avec l’âge ?** Oui, il peut évoluer, et l’Assurance Maladie cite aussi le syndrome prémenstruel parmi les signes possibles de la périménopause.

## Quand demander conseil
Consulte si tes symptômes perturbent ton travail, tes études, ta vie de couple ou tes relations, ou si tu te sens très triste, anxieuse ou à bout avant tes règles. Si tu as des idées noires, appelle le **3114** (numéro national de prévention du suicide), gratuit, 24 h/24. En cas d’urgence, appelle le **15** ou le **112**.

${FIN}`,
  }),
  // ------------------------------------------------------------ protections
  a({
    slug: 'serviettes-hygieniques-jetables-lavables-bien-choisir',
    title: 'Serviettes hygiéniques jetables ou lavables : bien choisir et bien les utiliser',
    summary: 'Avantages, limites, absorption, entretien des serviettes lavables, étiquetage : tout pour choisir des serviettes adaptées à ton flux et les utiliser en confiance.',
    tags: ['serviette hygiénique', 'serviette lavable', 'protège-slip', 'protection externe', 'protection de nuit', 'composition serviette', 'serviette sans parfum', 'protection périodique'],
    sources: [S.qsProtections, S.ameliProtections, S.dgccrfProtections],
    body_md: `## En bref
- Les serviettes sont des **protections externes** : elles se fixent dans la culotte, sans rien introduire dans le vagin.
- Elles sont **faciles à utiliser** et conseillées **la nuit** par l’Assurance Maladie, notamment pour réduire le risque de choc toxique lié aux protections internes.
- Les modèles **lavables** doivent être lavés avant le premier usage, puis entretenus selon les consignes et **bien séchés**.
- Choisis une absorption **adaptée à ton flux** et privilégie les produits **sans parfum**.
- Depuis avril 2024, la **composition** et les **précautions d’usage** doivent figurer sur l’emballage ou la notice.

## Comprendre
La DGCCRF classe les protections en deux familles : les **protections externes** (serviettes, protège-slips, culottes menstruelles, jetables ou réutilisables) et les **protections internes** (tampons et coupes). Selon cette fiche, les protections externes n’ont, à ce jour, pas été associées au syndrome de choc toxique menstruel.

**Serviettes jetables** : elles tiennent grâce à une bande adhésive. QuestionSexualité souligne leur facilité d’utilisation ; côté contraintes, elles sont à usage unique, doivent être changées régulièrement selon le flux, demandent un endroit pour se changer et une poubelle, et leur coût mensuel peut peser.

**Serviettes lavables** : elles se fixent avec un ou plusieurs boutons pression. Elles sont réutilisables mais demandent un entretien rigoureux. QuestionSexualité indique une durée de port de 4 à 6 heures, avec des changements plus fréquents si le flux est abondant, un rinçage à l’eau froide puis un lavage entre 30 et 60 °C, et surtout un **séchage complet** avant de les réutiliser, pour limiter le risque de mycose.

**Protège-slips** : utiles pour de très petites pertes (fin de règles, spotting). Les modèles lavables suivent les mêmes règles d’entretien.

Depuis le 1er avril 2024, un décret impose que l’étiquetage ou la notice des protections intimes précise la composition, les modalités et précautions d’utilisation et les effets indésirables possibles (irritations, intolérances, allergies…).

## Au quotidien
- **Adapte l’absorption** au moment des règles : plus absorbante les jours de fort flux, plus fine en fin de règles.
- **Change-la régulièrement**, sans attendre qu’elle soit saturée, pour le confort et l’hygiène.
- **Lave-toi les mains** avant et après chaque changement, comme le recommandent l’Assurance Maladie et l’Anses.
- **Privilégie les produits sans parfum ni lotion parfumée**, conseil de la DGCCRF pour limiter les substances potentiellement allergisantes.
- **Lis l’étiquette** : composition, précautions, consignes d’entretien. Méfie-toi des mentions commerciales très flatteuses sur les matières premières.
- **Pour les lavables** : prévois un petit sac hermétique pour transporter une serviette utilisée, et assez de pièces pour avoir le temps qu’elles sèchent.
- **La nuit** : une serviette adaptée (plus longue ou plus absorbante) est la protection conseillée, plutôt qu’un tampon.

## Questions fréquentes
**Serviettes ou tampons, qu’est-ce qui est mieux ?** Il n’y a pas de « meilleure » protection : tout dépend de ton confort, de tes activités et de ton flux. Beaucoup de personnes alternent selon les moments.

**Ma serviette me donne des irritations, que faire ?** Change plus souvent, essaie un modèle sans parfum ou une autre matière, et vérifie la composition. Si l’irritation persiste ou s’accompagne de démangeaisons ou de pertes inhabituelles, consulte.

**Les serviettes lavables sont-elles hygiéniques ?** Oui, si elles sont bien lavées selon les consignes et complètement sèches avant d’être réutilisées.

**Combien de temps garder une serviette ?** Les sources ne fixent pas de durée unique pour les jetables : change-la selon ton flux, dès qu’elle est bien imprégnée. QuestionSexualité indique 4 à 6 heures pour les serviettes lavables, avec des changements plus fréquents si le flux est abondant.

## Quand demander conseil
Parles-en à un médecin, une sage-femme ou un pharmacien en cas d’irritation, de démangeaisons ou de pertes inhabituelles qui persistent, ou si tes règles sont si abondantes que les serviettes débordent. Une douleur pendant les règles qui t’empêche de vivre normalement mérite aussi une consultation.

${URG}

${FIN}`,
  }),
  a({
    slug: 'tampons-bien-choisir-mettre-retirer',
    title: 'Tampons : bien choisir l’absorption, les mettre, les retirer et respecter la durée de port',
    summary: 'Comment choisir un tampon adapté à ton flux, le mettre en place sans douleur, le changer à temps et pourquoi éviter de le porter la nuit.',
    tags: ['tampon', 'mettre un tampon', 'tampon applicateur', 'absorption tampon', 'durée tampon', 'tampon la nuit', 'protection interne', 'premier tampon'],
    sources: [S.ameliProtections, S.qsProtections, S.dgccrfProtections],
    body_md: `## En bref
- Un tampon se place dans le vagin et absorbe les règles ; un fil reste à l’extérieur pour le retirer.
- Change-le **au plus tard toutes les 4 à 6 heures** et ne le garde **jamais plus de 6 heures**.
- Choisis l’**absorption la plus faible** qui convient à ton flux : un tampon trop absorbant reste plus longtemps en place.
- **N’en porte que pendant les règles** et **privilégie une serviette la nuit**.
- Si tu as déjà eu un **choc toxique**, les protections internes ne sont pas recommandées.

## Comprendre
Les tampons sont des protections internes à usage unique, très discrets et disponibles pour tous les types de flux. Ils existent **avec ou sans applicateur** et en plusieurs tailles ; selon l’Assurance Maladie, les plus fins peuvent convenir dès les premières règles et quand le flux est faible.

Le principal risque lié aux protections internes est le **syndrome de choc toxique menstruel**, rare mais grave. L’Assurance Maladie précise que garder un tampon plus de 6 heures, ou le porter toute la nuit, double le risque, et que ne pas suivre la notice est aussi associé à un risque accru. D’après l’Anses, ce risque est lié aux conditions d’utilisation (durée de port, absorption supérieure au besoin), et non aux matériaux.

Depuis le 1er avril 2024, la notice des tampons doit indiquer leur composition, la durée maximale de port de 6 heures, le port uniquement pendant les règles, la recommandation d’une protection externe la nuit et les symptômes du choc toxique.

## Au quotidien
**Pour le mettre (QuestionSexualité)** :
- lave-toi les mains, installe-toi dans une position où tu te sens détendue ;
- **sans applicateur** : place la pointe à l’entrée du vagin, pousse doucement, puis enfonce un peu plus si tu le sens ;
- **avec applicateur** : introduis l’applicateur, pousse le tube intérieur avec l’index pour libérer le tampon, puis retire l’applicateur ;
- le fil doit rester à l’extérieur. Bien placé, un tampon ne se sent pas.

**Pour le retirer** : mains propres, détends-toi et tire doucement sur le fil. S’il frotte, c’est souvent qu’il n’est pas assez imbibé : une absorption plus faible conviendra peut-être mieux.

**Pour bien l’utiliser** :
- note l’heure ou mets une alarme, surtout les journées chargées ;
- alterne avec des serviettes, en particulier **la nuit** ;
- garde des tampons de rechange et une serviette sur toi ;
- n’utilise pas de tampon pour des pertes hors règles.

## Questions fréquentes
**Peut-on utiliser des tampons dès les premières règles ?** Oui, si tu en as envie. Les tampons les plus fins sont les plus adaptés au début. L’Assurance Maladie conseille de te faire expliquer l’utilisation par une personne de confiance ou un professionnel de santé.

**Ça fait mal de mettre un tampon ?** Il peut y avoir une gêne au début. Prends ton temps, détends-toi, essaie une autre position ou un modèle plus fin. Une douleur forte et persistante à l’insertion mérite d’en parler à un professionnel.

**Et si j’oublie un tampon ?** Retire-le dès que tu y penses. Si tu n’arrives pas à le retirer, consulte un médecin ou une sage-femme. Si tu as de la fièvre ou un malaise, c’est une urgence.

**Faut-il un tampon plus absorbant pour le garder plus longtemps ?** Non : l’absorption doit correspondre à ton flux, pas à la durée. Un tampon trop absorbant pour ton flux augmente le risque de choc toxique selon l’Anses et la DGCCRF.

## Quand demander conseil
Consulte si tu n’arrives pas à retirer un tampon, si tu as des douleurs, des démangeaisons ou des pertes inhabituelles. Retire immédiatement le tampon et consulte en urgence en cas de **fièvre élevée, vomissements, diarrhée, éruption type coup de soleil, vertiges ou malaise** pendant ou peu après les règles : ce sont des signes possibles de choc toxique.

${URG}

${FIN}`,
  }),
  a({
    slug: 'coupe-menstruelle-cup-utilisation-entretien',
    title: 'Coupe menstruelle (cup) : la mettre, la vider, l’entretenir en toute sécurité',
    summary: 'Insertion, retrait, durée de port, stérilisation et précautions : le mode d’emploi de la coupe menstruelle selon les recommandations officielles.',
    tags: ['coupe menstruelle', 'cup', 'cup menstruelle', 'stériliser cup', 'vider cup', 'protection réutilisable', 'cup choc toxique', 'cup remboursée'],
    sources: [S.ameliProtections, S.qsProtections, S.dgccrfProtections],
    body_md: `## En bref
- La coupe menstruelle se place dans le vagin et **recueille** le sang au lieu de l’absorber.
- L’Assurance Maladie recommande de la **vider toutes les 4 à 6 heures au maximum** ; ne dépasse jamais la durée indiquée sur la notice.
- Lave-la avant le premier usage, nettoie-la entre deux utilisations (eau chaude et savon sans huile ni parfum) et suis la notice pour la **stérilisation**.
- Comme le tampon, c’est une **protection interne** : à utiliser **seulement pendant les règles**, et pas si tu as déjà eu un choc toxique.
- Depuis le 1er octobre 2026, une coupe achetée en pharmacie peut être **prise en charge** sous conditions.

## Comprendre
La coupe est une protection interne réutilisable. QuestionSexualité cite ses avantages (réutilisable, économique sur plusieurs années) et ses contraintes : l’insertion et le retrait demandent un peu d’entraînement, il faut un point d’eau et un endroit tranquille, être à l’aise avec le sang, et l’achat initial a un coût.

Côté sécurité, l’Anses rappelle que le choc toxique concerne les protections internes, tampons comme coupes, et que le risque dépend surtout de la durée de port. Le décret entré en vigueur le 1er avril 2024 impose pour les coupes l’indication des mesures d’hygiène, d’un vidage régulier (toutes les 4 à 6 heures), d’un port uniquement pendant les règles et de la recommandation d’une protection externe la nuit.

Les durées de port citées varient selon les sources et les produits (certaines notices indiquent jusqu’à 6 à 8 heures) : retiens la règle la plus prudente, celle de l’Assurance Maladie, et la notice de ton produit.

## Au quotidien
**Avant la première utilisation** : lave-la, et stérilise-la selon la notice ; QuestionSexualité décrit la stérilisation à l’eau bouillante quelques minutes ou au stérilisateur, avant la première utilisation et à chaque début de règles.

**Pour l’insérer** : mains propres, plie la coupe (plusieurs pliages existent), insère-la, puis vérifie qu’elle s’est bien dépliée. Si elle reste pliée, repositionne-la.

**Pour la retirer** : pince la base pour casser l’effet ventouse, **ne tire pas seulement sur la tige**, puis retire-la doucement en la gardant droite. Vide-la dans les toilettes.

**Entre deux utilisations** : selon l’Assurance Maladie, nettoie-la avec de l’eau chaude et un savon sans huile et sans parfum, puis rince bien.

**Bien choisir** : il existe plusieurs tailles et souplesses ; le fabricant indique généralement des repères (âge, flux, accouchement). Lis la composition et la notice avant d’acheter.

## Questions fréquentes
**La coupe est-elle plus sûre que le tampon pour le choc toxique ?** Non : ce sont deux protections internes, et le risque existe avec les deux. Respecte les durées de port et privilégie une protection externe la nuit.

**Ma coupe fuit, pourquoi ?** Souvent parce qu’elle ne s’est pas complètement dépliée, qu’elle est mal positionnée ou que la taille ne te convient pas. Un professionnel de santé peut t’aider.

**Puis-je la porter la nuit ?** L’Assurance Maladie et la réglementation recommandent une protection externe la nuit (serviette ou culotte menstruelle), y compris quand on utilise une coupe le jour.

**Comment obtenir le remboursement ?** Depuis le 1er octobre 2026, les moins de 26 ans et les bénéficiaires de la Complémentaire santé solidaire peuvent être remboursés pour une coupe référencée achetée en pharmacie, dans la limite de 15,80 € et de 2 produits (coupe ou culotte) par période de 12 mois.

## Quand demander conseil
Consulte si tu n’arrives pas à retirer ta coupe, en cas de douleur, d’irritation ou de pertes inhabituelles. Retire-la immédiatement et consulte en urgence si tu as de la **fièvre élevée, des vomissements, une diarrhée, une éruption cutanée ou un malaise** pendant ou juste après tes règles.

${URG}

${FIN}`,
  }),
  a({
    slug: 'culotte-menstruelle-choisir-entretenir',
    title: 'Culotte menstruelle : bien la choisir, la porter et l’entretenir',
    summary: 'Flux, durée de port, lavage, séchage, étiquetage et remboursement : ce qu’il faut savoir avant d’adopter la culotte menstruelle.',
    tags: ['culotte menstruelle', 'culotte de règles', 'shorty menstruel', 'laver culotte menstruelle', 'protection lavable', 'culotte remboursée', 'protection externe', 'règles nuit'],
    sources: [S.qsProtections, S.ameliProtections, S.dgccrfProtections],
    body_md: `## En bref
- La culotte menstruelle **absorbe les règles** sans rien introduire dans le vagin : c’est une **protection externe**.
- Elle existe en plusieurs formes (culotte, shorty, tanga) et niveaux d’absorption : choisis selon **ton flux**.
- Lave-la **avant le premier usage**, puis selon les **consignes du fabricant** ; un bon rinçage après usage est indispensable.
- Les protections externes n’ont, à ce jour, **pas été associées au choc toxique** selon la DGCCRF.
- Depuis le 1er octobre 2026, une culotte référencée achetée en pharmacie peut être **remboursée** sous conditions.

## Comprendre
QuestionSexualité présente la culotte menstruelle comme confortable, enfilée comme une culotte classique, avec un coût total inférieur à celui des protections jetables sur plusieurs années. Ses contraintes : être à l’aise avec le sang, rincer soigneusement après usage, disposer d’un point d’eau et, idéalement, d’un petit sac hermétique pour transporter une culotte portée, et un coût d’achat initial élevé.

La durée de port annoncée peut aller jusqu’à une douzaine d’heures selon les modèles et le flux : réfère-toi toujours à la notice et change plus tôt si tu sens une saturation.

Côté réglementation, la composition des culottes menstruelles doit être indiquée selon les règles européennes d’étiquetage des textiles ; depuis avril 2024, l’étiquetage ou la notice doit aussi préciser les précautions d’utilisation et les effets indésirables possibles. La DGCCRF a inclus ces produits dans ses contrôles des nouvelles protections intimes.

## Au quotidien
- **Choisis l’absorption** selon tes jours : une culotte « flux abondant » pour le début des règles ou la nuit, une plus légère pour la fin.
- **Prévois-en plusieurs** pour avoir le temps de les laver et les faire sécher entre deux usages.
- **Lave-la avant la première utilisation**, comme le recommande l’Assurance Maladie.
- **Après usage** : rince à l’eau froide jusqu’à ce que l’eau soit claire, puis lave et sèche selon l’étiquette.
- **Sèche-la complètement** avant de la remettre, pour l’hygiène et le confort.
- **Hors de chez toi** : un petit sac étanche permet de ranger une culotte portée.
- **Lis l’étiquette** : composition, consignes, et méfie-toi des allégations commerciales trop flatteuses.
- **Remboursement** : achète-la en pharmacie, parmi les produits référencés par le ministère de la Santé, si tu as moins de 26 ans ou si tu bénéficies de la Complémentaire santé solidaire. La prise en charge est plafonnée à 19 € par culotte et à 2 produits (culotte ou coupe) par période de 12 mois.

## Questions fréquentes
**Peut-on la porter la nuit ?** Oui : c’est une protection externe, et l’Assurance Maladie recommande justement une protection externe la nuit. Choisis un modèle adapté à ton flux nocturne.

**Est-elle adaptée aux règles très abondantes ?** Certaines personnes la combinent avec une autre protection les jours de fort flux. Si tes protections débordent régulièrement, parle de l’abondance de tes règles à un professionnel.

**Sent-elle mauvais ?** Changée régulièrement et bien lavée, la culotte menstruelle limite les odeurs. Une odeur forte et inhabituelle de tes pertes peut signaler une infection et mérite un avis.

**Est-ce adapté aux ados ?** Oui, c’est souvent une protection appréciée au début, car elle ne demande aucune manipulation dans le vagin. Le remboursement s’applique aux moins de 26 ans.

## Quand demander conseil
Consulte en cas d’irritation, de démangeaisons, de pertes ou d’odeurs inhabituelles qui persistent, ou si tes règles sont si abondantes que tu dois changer de protection très souvent. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
  a({
    slug: 'syndrome-choc-toxique-menstruel-signes-prevention',
    title: 'Syndrome du choc toxique menstruel : reconnaître les signes et le prévenir',
    summary: 'Ce qu’est le choc toxique lié aux tampons et aux coupes, les symptômes qui doivent faire réagir tout de suite et les gestes simples pour le prévenir.',
    tags: ['choc toxique', 'syndrome du choc toxique', 'SCT', 'tampon fièvre', 'cup fièvre', 'staphylocoque doré', 'protection interne danger', 'urgence règles'],
    safety_critical: true,
    sources: [S.ameliChoc, S.dgccrfProtections, S.ansesProtections],
    body_md: `## En bref
- Le choc toxique menstruel est une **réaction grave et brutale**, rare, qui survient pendant les règles ou peu après, liée aux **protections internes** (tampons, coupes).
- Il est dû à une **toxine** produite par certains **staphylocoques dorés** présents dans le vagin.
- Signes d’alerte : **fièvre élevée soudaine**, vomissements, diarrhée, **éruption type coup de soleil**, douleurs musculaires, vertiges, malaise.
- Au moindre doute : **retire immédiatement** le tampon ou la coupe et **appelle le 15 ou le 112**.
- Prévention : **6 heures maximum**, absorption adaptée, **protection externe la nuit**, protection interne seulement pendant les règles.

## Comprendre
Selon l’Assurance Maladie, une bactérie de la famille des staphylocoques dorés est présente dans le vagin d’environ 1 % des femmes, sans symptôme. Quand un tampon ou une coupe est porté, le sang stagne et favorise sa multiplication ; certaines souches produisent une toxine qui passe dans le sang et agit sur tout l’organisme. Plusieurs cas sont signalés chaque année en France, surtout chez des adolescentes.

La DGCCRF précise que les cas signalés concernent principalement une mauvaise utilisation des tampons ou des coupes : port trop long ou protection inadaptée au flux. Les protections externes (serviettes, culottes menstruelles) n’ont, à ce jour, pas été associées à ce syndrome. L’Anses souligne que le risque est lié aux conditions d’utilisation et non aux matériaux.

Facteurs de risque cités par l’Assurance Maladie : garder un tampon plus de 6 heures et le porter toute la nuit (chacun double le risque), ne pas lire ou ne pas suivre la notice.

**Les signes** (ils n’apparaissent pas forcément tous en même temps) :
- fièvre forte et brutale ;
- signes ressemblant à une grippe (douleurs musculaires, mal de gorge) ou à une gastro (nausées, vomissements, diarrhée, douleurs du ventre) ;
- éruption rouge généralisée, comme un coup de soleil, sur la peau et parfois dans la bouche ;
- vertiges, malaise, voire perte de connaissance.

Le traitement, à l’hôpital, doit être rapide.

## Au quotidien
- **Change ton tampon ou vide ta coupe** toutes les 4 à 6 heures au plus, sans jamais dépasser 6 heures.
- **Prends l’absorption la plus faible** qui convient à ton flux.
- **La nuit**, utilise une serviette ou une culotte menstruelle.
- **N’utilise une protection interne que pendant les règles.**
- **Lave-toi les mains** avant et après chaque changement.
- **Lis la notice** : depuis avril 2024, elle doit décrire les symptômes du choc toxique.
- **Mets une alarme** sur ton téléphone si tu as tendance à oublier.
- **Parles-en aux ados** autour de toi : elles sont les plus concernées.

## Questions fréquentes
**Je n’ai porté mon tampon que 7 heures, dois-je m’inquiéter ?** Retire-le dès que tu t’en rends compte, reprends des changements plus fréquents et reste attentive : si de la fièvre, des vomissements, une éruption ou un malaise apparaissent dans les jours qui suivent, consulte en urgence.

**Peut-on refaire un choc toxique ?** Les personnes qui en ont déjà eu un ne doivent pas utiliser de protection interne, selon l’Assurance Maladie et la réglementation. Parles-en à ton médecin.

**Les tampons bio ou en coton évitent-ils le choc toxique ?** L’Anses n’a pas établi de lien entre les matériaux et ce risque : c’est la durée de port et l’absorption qui comptent.

**Et la coupe menstruelle ?** Elle est aussi concernée : les mêmes règles de durée et de port la nuit s’appliquent.

## Quand demander conseil
**Urgence** : en cas de fièvre élevée, vomissements, diarrhée, éruption type coup de soleil, vertiges ou malaise pendant ou peu après tes règles avec une protection interne, retire-la tout de suite et appelle le **15** ou le **112**. Dis que tu portais un tampon ou une coupe.

${URG}

${FIN}`,
  }),
  a({
    slug: 'precarite-menstruelle-protections-gratuites-remboursees',
    title: 'Précarité menstruelle : protections gratuites, remboursement et où trouver de l’aide',
    summary: 'Si acheter des protections est difficile, voici les dispositifs publics existants : remboursement des coupes et culottes, distributions pour étudiantes, collégiennes et personnes en grande précarité.',
    tags: ['précarité menstruelle', 'protections gratuites', 'remboursement culotte menstruelle', 'remboursement cup', 'complémentaire santé solidaire', 'étudiante règles', 'CROUS protections', 'moins de 26 ans'],
    sources: [S.etudiantReutilisables, S.ameliProtections, S.egalitePrecarite],
    body_md: `## En bref
- On parle de **précarité menstruelle** quand l’accès aux protections est difficile ou impossible, surtout pour des raisons financières.
- Depuis le **1er octobre 2026**, les **coupes** et **culottes menstruelles** achetées en pharmacie peuvent être **remboursées** pour les **moins de 26 ans** et les bénéficiaires de la **Complémentaire santé solidaire** (C2S), sans limite d’âge pour ces derniers.
- Limites : **2 produits par période de 12 mois**, produits **référencés** par le ministère de la Santé, prix plafonnés.
- Des **distributions gratuites** ont été mises en place pour les étudiantes, des collégiennes et lycéennes et des personnes en grande précarité, avec des associations.
- Tu n’as pas à avoir honte d’en parler : c’est un **enjeu de santé publique**.

## Comprendre
Le ministère chargé de l’Égalité femmes-hommes définit la précarité menstruelle comme la situation de personnes dont l’accès aux protections hygiéniques est difficile ou impossible pour des raisons avant tout financières. En 2021, il évoquait près de 2 millions de femmes concernées et des jeunes filles qui manquent l’école à cause de leurs règles. Manquer de protections peut conduire à garder une protection trop longtemps ou à utiliser des solutions de fortune, avec des risques pour la santé et un impact sur les études, le travail et l’estime de soi.

**Le remboursement des protections réutilisables** (depuis le 1er octobre 2026) :
- **qui** : les personnes de moins de 26 ans, sans condition de ressources, et les bénéficiaires de la C2S, sans limite d’âge ;
- **quoi** : les coupes et culottes menstruelles référencées, achetées **en pharmacie** ;
- **combien** : prix limites de 15,80 € pour une coupe et 19 € pour une culotte ; selon etudiant.gouv.fr, l’Assurance Maladie rembourse 55 à 65 % pour les moins de 26 ans (le reste pouvant être couvert par une complémentaire) et 100 % pour les bénéficiaires de la C2S ;
- **combien de fois** : 2 produits par période de 12 mois, à partir du premier achat.

**Les distributions gratuites** : en 2021, le gouvernement annonçait des protections gratuites dans les résidences et services de santé universitaires du réseau des CROUS et des distributeurs dans des restaurants universitaires, l’extension d’expérimentations dans des collèges et lycées de plusieurs départements, et des actions avec des associations (maraudes, épiceries solidaires, collectes) pour les personnes sans abri ou en grande précarité. L’offre varie selon les lieux.

## Au quotidien
- **Demande en pharmacie** quels produits sont référencés pour le remboursement et quelles sont les modalités de prise en charge.
- **Si tu as de faibles ressources**, vérifie si tu as droit à la **Complémentaire santé solidaire** : elle ouvre aussi la prise en charge à 100 % de ces protections.
- **Étudiante** : renseigne-toi auprès du service de santé de ton université ou du CROUS.
- **Collégienne ou lycéenne** : l’infirmerie scolaire peut souvent dépanner et t’écouter.
- **En difficulté** : les associations de solidarité, les épiceries solidaires et les centres sociaux peuvent t’orienter.
- **Une coupe peut durer plusieurs années** si elle est bien entretenue (environ 5 ans selon etudiant.gouv.fr) : c’est un investissement qui peut alléger le budget.
- **Ne garde jamais une protection interne plus de 6 heures** pour économiser : le risque de choc toxique augmente.

## Questions fréquentes
**Faut-il une ordonnance pour le remboursement ?** Les sources consultées précisent l’achat en pharmacie de produits référencés ; demande au pharmacien les modalités exactes au moment de l’achat.

**Les serviettes et tampons jetables sont-ils remboursés ?** Le dispositif de 2026 concerne les coupes et culottes réutilisables.

**Je n’ose pas demander de l’aide, c’est gênant…** Les règles concernent la moitié de la population. Les infirmières scolaires, les services de santé étudiants et les associations sont là pour ça.

## Quand demander conseil
Si tes règles sont si abondantes qu’elles te coûtent beaucoup de protections, parles-en à un médecin ou à une sage-femme : des règles abondantes peuvent se traiter. Une douleur qui t’empêche d’aller en cours ou au travail mérite aussi une consultation. Si tu te sens très isolée ou à bout, appelle le **3114**, gratuit, 24 h/24.

${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ douleurs et symptômes
  a({
    slug: 'regles-douloureuses-chaleur-mouvement-gestes-qui-soulagent',
    title: 'Douleurs de règles : chaleur, mouvement, repos… les gestes qui peuvent soulager',
    summary: 'Bouillotte, bain chaud, marche, relaxation, sommeil : les gestes du quotidien cités par les sources officielles pour atténuer les crampes de règles, et leurs limites.',
    tags: ['douleurs de règles', 'crampes règles', 'bouillotte', 'soulager règles', 'règles douloureuses naturel', 'yoga règles', 'massage ventre', 'dysménorrhée'],
    sources: [S.ameliRegles, S.santeDysmeno, S.qsRegles],
    body_md: `## En bref
- Les crampes de règles viennent des **contractions de l’utérus** qui évacue sa muqueuse ; elles touchent le bas-ventre, parfois le dos et les cuisses.
- **Chaleur** (bouillotte, bain ou douche chaude), **massage du ventre**, **activité physique douce** et **relaxation** font partie des gestes cités par l’Assurance Maladie et Santé.fr.
- Dormir suffisamment et limiter **alcool, café et tabac** avant et pendant les règles peut aussi aider.
- Ces gestes complètent, sans le remplacer, l’avis d’un professionnel si la douleur est forte.
- Une douleur qui **t’empêche de vivre normalement** n’est pas à subir : elle mérite une consultation.

## Comprendre
Pendant les règles, l’utérus se contracte pour évacuer l’endomètre. Ces contractions sont favorisées par des substances appelées prostaglandines ; quand elles sont trop fortes, le muscle utérin est moins bien oxygéné, ce qui provoque la douleur. Elle dure en général un à deux ou trois jours, au moment où le flux est le plus abondant.

Les douleurs de règles sont très fréquentes à l’adolescence (50 à 70 % des adolescentes selon l’Assurance Maladie) et diminuent souvent après 18 ans. Elles peuvent s’accompagner de fatigue, de troubles digestifs, de nausées ou de maux de tête.

Des gestes simples peuvent détendre les muscles du bas-ventre. Ils ne conviennent pas à toutes et ne suffisent pas toujours : si la douleur reste forte, un professionnel peut proposer un traitement adapté et rechercher une cause.

## Au quotidien
**La chaleur**
- Une **bouillotte** sur le bas-ventre ou le bas du dos, allongée au calme.
- Un **bain** ou une **douche chaude**.
- Vérifie la température pour éviter les brûlures, et ne t’endors pas avec une source de chaleur très chaude contre la peau.

**Le mouvement**
- Une **activité physique douce** : marche, natation, vélo tranquille. Santé.fr indique que bouger soulage souvent.
- Des étirements, du **yoga** ou de la **relaxation** (respiration lente, détente musculaire).
- Les règles ne t’obligent pas à arrêter le sport : adapte l’intensité à ton ressenti.

**Le massage**
- Des mouvements circulaires doux sur le bas-ventre, éventuellement avec une huile neutre.

**Le repos et l’hygiène de vie**
- **Dormir suffisamment** avant et pendant les règles.
- **Limiter alcool, café et tabac** sur cette période ; l’Assurance Maladie note que le tabac aggraverait les douleurs.
- Prévoir des vêtements confortables qui ne serrent pas le ventre.

**Les médicaments**
- Si tu as besoin d’un antidouleur, demande conseil à ton pharmacien ou à ton médecin, qui vérifiera les contre-indications. Santé.fr conseille d’éviter l’aspirine pendant les règles. Ne prolonge pas l’automédication sans avis.

## Questions fréquentes
**La chaleur peut-elle vraiment aider ?** C’est l’un des gestes les plus cités par les sources de santé publique pour détendre le bas-ventre contracté. Son effet varie selon les personnes.

**Faire du sport pendant les règles, ça n’aggrave pas les douleurs ?** Au contraire, une activité douce soulage souvent. Écoute ton corps : si l’effort intense te gêne, privilégie la marche ou les étirements ces jours-là.

**Les douleurs vont-elles diminuer avec le temps ?** Chez beaucoup de personnes, elles s’atténuent au fil des années. Si elles augmentent, apparaissent tardivement ou ne cèdent pas, consulte.

**Je rate des cours ou le travail à cause de mes règles, est-ce une raison de consulter ?** Oui. Les règles douloureuses sont la première cause d’absentéisme scolaire chez les adolescentes ; une douleur qui t’empêche d’étudier ou de travailler doit être prise en charge.

## Quand demander conseil
Consulte si la douleur est intense, revient chaque mois malgré ces gestes, apparaît après des années de règles peu douloureuses, ou s’accompagne de douleurs pendant les rapports, de règles abondantes ou de saignements entre les règles. Un bilan peut être nécessaire, notamment pour rechercher une endométriose.

${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-douloureuses-endometriose-adenomyose-signes-a-ne-pas-banaliser',
    title: 'Quand les douleurs de règles cachent autre chose : les signes à ne pas banaliser',
    summary: 'Dysménorrhée primaire ou secondaire, endométriose, adénomyose, fibromes, stérilet au cuivre : comprendre quand une douleur de règles doit faire chercher une cause.',
    tags: ['endométriose', 'adénomyose', 'dysménorrhée secondaire', 'douleur règles anormale', 'douleur rapports', 'fibrome', 'échographie pelvienne', 'IRM endométriose'],
    safety_critical: true,
    sources: [S.ameliDouleursCauses, S.ameliDouleursTtt, S.santeDysmeno],
    body_md: `## En bref
- La **dysménorrhée primaire** apparaît à l’adolescence, dans les mois qui suivent les premières règles ; elle est fréquente et le plus souvent bénigne.
- La **dysménorrhée secondaire** survient chez une adulte dont les règles étaient peu ou pas douloureuses : une **cause est toujours recherchée**.
- Causes possibles : **endométriose**, **adénomyose**, **fibrome**, **polypes**, **stérilet au cuivre** (surtout s’il s’est déplacé), changement de contraception hormonale, infection.
- Signes associés à signaler : **douleurs pendant les rapports**, **règles abondantes**, **saignements entre les règles**.
- L’examen de première intention est souvent l’**échographie pelvienne** ; l’IRM complète parfois le bilan.

## Comprendre
L’Assurance Maladie distingue deux situations.

**La dysménorrhée primaire** est liée à un excès de prostaglandines qui rend les contractions de l’utérus trop fortes. Elle est favorisée par des règles précoces, des antécédents familiaux, l’absence de grossesse antérieure, et le tabac l’aggraverait. Même à l’adolescence, une douleur qui s’aggrave doit faire rechercher une cause, car l’**endométriose peut débuter tôt**, ou plus rarement une malformation de l’utérus ou du vagin.

**La dysménorrhée secondaire** fait suspecter une maladie sous-jacente :
- **l’endométriose** : des fragments de tissu semblable à l’endomètre se trouvent en dehors de l’utérus ; ils réagissent aux hormones et saignent à chaque cycle ;
- **l’adénomyose** : ces fragments sont situés dans le muscle de l’utérus ;
- **un fibrome** ou des **polypes** de l’endomètre ;
- **un stérilet au cuivre**, surtout s’il est déplacé ;
- **un changement de contraception hormonale** ;
- **une infection génitale** chronique, citée par Santé.fr.

Santé.fr retient trois situations qui doivent amener à consulter : une douleur inhabituelle avant ou pendant les règles, des règles devenues difficiles à supporter, des douleurs qui apparaissent après plusieurs années de règles peu douloureuses.

## Au quotidien
- **Note ta douleur** chaque cycle, par exemple sur une échelle de 0 à 10, avec les jours concernés, ce qui soulage ou non, et les absences au travail ou en cours.
- **Repère les signes associés** : douleur pendant ou après les rapports, douleur en allant aux toilettes pendant les règles, saignements entre les règles, règles plus abondantes qu’avant, fatigue.
- **Prépare la consultation** avec ces notes : elles aident le médecin, la sage-femme ou le gynécologue à orienter le bilan.
- **Sache à quoi t’attendre** : l’examen dépend de ta situation ; chez une jeune fille qui n’a jamais eu de rapport, l’examen gynécologique n’est pas réalisé. L’échographie peut se faire par le ventre ou par voie vaginale, qui détecte mieux certaines lésions ; l’échographiste demande toujours ton accord.
- **Si une cause est trouvée**, le traitement est adapté à cette maladie. Sinon, le médecin peut proposer des anti-inflammatoires, une contraception hormonale qui atténue ou supprime les règles, ou un stérilet hormonal.

## Questions fréquentes
**Mes règles ont toujours été douloureuses, est-ce forcément une endométriose ?** Non. Mais une douleur forte qui gêne ta vie quotidienne mérite un avis, quelle que soit ton histoire.

**Pourquoi mes douleurs ont-elles changé après la pose d’un stérilet au cuivre ?** C’est une cause connue de dysménorrhée secondaire, surtout si le stérilet s’est déplacé. Parles-en au professionnel qui l’a posé.

**L’échographie était normale, mais j’ai toujours mal. Et maintenant ?** L’échographie par voie abdominale peut être insuffisante pour l’endométriose ; d’autres examens (échographie endovaginale, IRM) peuvent être discutés. N’hésite pas à reconsulter.

**Est-ce que ça peut jouer sur la fertilité ?** Santé.fr rappelle que l’endométriose peut entraîner des difficultés à concevoir : c’est une raison de plus de consulter tôt.

## Quand demander conseil
Prends rendez-vous si ta douleur est inhabituelle, s’aggrave, t’empêche d’étudier ou de travailler, ou s’accompagne de douleurs pendant les rapports, de règles abondantes ou de saignements entre les règles. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
  a({
    slug: 'caillots-pendant-les-regles-mesurer-abondance',
    title: 'Caillots pendant les règles : comment évaluer l’abondance de ton flux',
    summary: 'Caillots, sang foncé, protections qui débordent la nuit : comment observer et noter ton flux avec des repères simples, comme ceux utilisés par les médecins.',
    tags: ['caillots règles', 'caillots de sang', 'règles abondantes', 'score de Higham', 'débordement nuit', 'sang foncé règles', 'mesurer règles', 'flux menstruel'],
    sources: [S.ameliSaignBilan, S.qsRegles, S.ameliSaignDef],
    body_md: `## En bref
- Le sang des règles contient de la **muqueuse utérine** et de la **glaire** ; quand il s’écoule lentement, il fonce et peut épaissir.
- La **présence de caillots** fait partie des éléments que le médecin te demandera pour évaluer l’abondance des règles, avec le **nombre de protections** et les **débordements la nuit**.
- Un outil simple, le **score de Higham**, permet de noter le remplissage de tes protections jour après jour.
- Repères cités par l’Assurance Maladie pour les protections réutilisables : vider la coupe **toutes les 2 à 3 heures** pendant plus de 7 jours, ou devoir changer la culotte la plus absorbante **avant 12 heures**, signalent des règles anormalement abondantes.
- Des caillots associés à des règles très abondantes, à de la fatigue ou à un malaise doivent amener à **consulter**.

## Comprendre
QuestionSexualité explique que le sang des règles est différent du sang d’une coupure : il contient aussi de la muqueuse de l’utérus et de la glaire. Quand il s’écoule vite, il est rouge et fluide ; quand il s’écoule plus lentement, il a le temps de foncer, de coaguler un peu et d’épaissir, d’où un aspect parfois marron ou grumeleux.

Les sources consultées ne fixent pas de taille de caillot « limite ». En revanche, l’Assurance Maladie classe la présence de caillots parmi les éléments à signaler en consultation, au même titre que le nombre de protections par jour et les débordements nocturnes. Ensemble, ces informations permettent d’estimer si tes règles sont anormalement abondantes (au-delà d’environ 80 ml par cycle).

**Le score de Higham**, décrit par l’Assurance Maladie : chaque jour de règles, tu comptes tes protections et tu notes leur remplissage. Une protection peu remplie compte 1 point, moyennement remplie 5 points, très remplie 20 points. Tu ajoutes aussi la présence de caillots et les débordements. Un total au-delà de 100 sur l’ensemble des règles correspond à des règles anormalement abondantes.

## Au quotidien
- **Pendant 2 ou 3 cycles**, note chaque jour : nombre de protections, remplissage (peu, moyen, très), caillots (oui/non, petits ou gros), débordements, nuits où tu as dû te lever.
- **Utilise un calendrier** ou le suivi de l’app : il suffit de quelques secondes par jour.
- **Note aussi** ta fatigue, un essoufflement inhabituel à l’effort, des vertiges : ce sont des signes possibles d’anémie.
- **Pense à tes traitements** : contraception, aspirine, anti-inflammatoires ou anticoagulants peuvent influencer les saignements ; mentionne-les en consultation.
- **Pour les nuits abondantes**, adapte ta protection (serviette plus absorbante, culotte menstruelle) plutôt que de garder une protection interne trop longtemps.

## Questions fréquentes
**Avoir quelques petits caillots, est-ce inquiétant ?** Les sources consultées ne donnent pas de seuil. Ce qui doit t’alerter, c’est l’ensemble du tableau : caillots fréquents ou volumineux, protections qui débordent, règles longues, fatigue. Dans ce cas, consulte.

**Pourquoi le médecin me pose-t-il autant de questions ?** Pour estimer objectivement l’abondance de tes règles et orienter le bilan (prise de sang, échographie).

**Mes règles sont plus abondantes depuis quelque temps, et j’ai des caillots. Que faire ?** Un changement par rapport à ton habitude est une bonne raison de consulter : un fibrome, un polype, un déséquilibre hormonal ou un stérilet au cuivre peuvent être en cause.

**Le sang marron est-il un caillot ?** Pas forcément : c’est souvent du sang qui s’est écoulé lentement et s’est oxydé, fréquent en début et en fin de règles.

## Quand demander conseil
Consulte ton médecin traitant ou une sage-femme si tes règles sont plus abondantes ou plus longues qu’avant, si tu as souvent des caillots, si tes protections débordent ou si tu te sens fatiguée et essoufflée. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-fer-fatigue-anemie',
    title: 'Règles, fatigue et manque de fer : repérer une anémie et bien couvrir ses besoins',
    summary: 'Pourquoi des règles abondantes peuvent épuiser les réserves en fer, quels signes doivent faire penser à une anémie et comment l’alimentation peut aider.',
    tags: ['anémie', 'carence en fer', 'fatigue règles', 'ferritine', 'aliments riches en fer', 'thé et fer', 'vitamine C fer', 'essoufflement'],
    sources: [S.ameliAnemieCauses, S.ameliAnemieSympt, S.santeThe],
    body_md: `## En bref
- Entre la puberté et la ménopause, les **règles augmentent les besoins en fer** ; les **adolescentes** font partie des personnes à risque de carence.
- Des **règles très abondantes ou longues** peuvent conduire à une **anémie par carence en fer**.
- Signes possibles : **pâleur**, **fatigue**, **essoufflement à l’effort**, maux de tête, vertiges, ongles cassants, peau et cheveux secs.
- Le diagnostic repose sur une **prise de sang** (hémoglobine, ferritine) prescrite par un médecin.
- L’alimentation aide : **viandes, poissons, légumineuses, légumes verts**, de la **vitamine C** au repas, et le **thé plutôt à distance** des repas.

## Comprendre
L’anémie correspond à un taux trop bas d’hémoglobine, la protéine des globules rouges qui transporte l’oxygène. Le fer est indispensable pour la fabriquer : quand il manque, les réserves s’épuisent d’abord (carence en fer), puis l’anémie peut s’installer.

Selon l’Assurance Maladie, les **pertes de sang** sont une cause majeure de carence en fer chez l’adulte, et parmi les pertes visibles figurent les **règles très abondantes et/ou longues** et les saignements entre les règles. Les adolescentes sont plus exposées, à cause de la croissance, des règles et parfois d’une alimentation déséquilibrée ou restrictive. Les régimes végétariens ou végétaliens stricts demandent aussi de la vigilance.

L’anémie s’installe souvent progressivement et peut passer inaperçue au début. Quand elle s’aggrave, apparaissent pâleur, fatigue, essoufflement à l’effort, maux de tête, vertiges ou sensation de « tête qui tourne » en se levant ; le manque de fer peut aussi rendre la peau et les cheveux secs et les ongles cassants.

Le médecin prescrit une **numération formule sanguine** et un dosage de la **ferritine**, qui reflète les réserves de fer. Il recherche aussi la cause : si ce sont tes règles, un bilan gynécologique permettra de les traiter.

## Au quotidien
**Varier les sources de fer** :
- le **fer héminique**, le mieux absorbé, se trouve dans les viandes, abats, poissons et fruits de mer ;
- le **fer non héminique** se trouve dans les légumineuses (lentilles, pois chiches, haricots), les céréales, les noix, le jaune d’œuf et les légumes à feuilles vertes.

**Favoriser son absorption** (Santé.fr) :
- ajoute de la **vitamine C** au repas : poivrons, agrumes, choux, fraises, de nombreux fruits ;
- bois **le thé ou le café plutôt à distance des repas** : leurs tanins diminuent l’absorption du fer d’origine végétale ; environ une heure après le repas, l’effet n’est plus gênant selon plusieurs études ;
- le **trempage et la cuisson** des légumineuses et céréales complètes réduisent les phytates qui freinent l’absorption.

**Ne pas s’auto-supplémenter** : un complément de fer se discute avec un médecin, après une prise de sang.

## Questions fréquentes
**Je suis toujours fatiguée pendant mes règles, est-ce le fer ?** Ce n’est pas la seule explication possible (douleur, sommeil perturbé, SPM), mais une fatigue persistante, surtout avec des règles abondantes, justifie une prise de sang.

**Je suis végétarienne, suis-je plus à risque ?** Le fer végétal est moins bien absorbé. En associant légumineuses, céréales, vitamine C et en éloignant le thé des repas, tu améliores tes apports. Parles-en à ton médecin si tu as des règles abondantes.

**Le sport intensif peut-il jouer ?** Le guide du ministère des Sports sur le cycle rappelle que des règles abondantes peuvent entraîner fatigue et risque d’anémie chez les sportives, et recommande de consulter pour en chercher la cause.

## Quand demander conseil
Consulte ton médecin traitant si tu te sens anormalement fatiguée, pâle, essoufflée ou si tu as des vertiges, surtout avec des règles abondantes ou longues. Un saignement abondant avec malaise ou grande faiblesse est une urgence.

${URG}

${FIN}`,
  }),
  a({
    slug: 'sport-et-regles-adapter-sa-pratique',
    title: 'Sport et règles : continuer à bouger, adapter sa pratique et repérer les signaux',
    summary: 'Peut-on faire du sport pendant les règles, que changent les phases du cycle, quand une absence de règles chez une sportive doit alerter : les repères officiels.',
    tags: ['sport règles', 'sport cycle menstruel', 'piscine règles', 'sportive aménorrhée', 'RED-S', 'déficit énergétique', 'performance cycle', 'entraînement règles'],
    journeys: ['avoid', 'child'],
    sources: [S.sportsCycle, S.ameliRegles, S.ameliAmenoCauses],
    body_md: `## En bref
- Les règles **n’imposent pas d’arrêter tes activités**, sport compris, rappelle l’Assurance Maladie ; une **activité douce** peut même soulager les douleurs.
- Pendant les règles, les hormones sont au plus bas : certaines sportives se sentent moins performantes, surtout en endurance. **Écoute ton ressenti**.
- Une **absence de règles** ou **moins de 6 cycles par an** chez une sportive doit amener à consulter : cela peut traduire un **déficit d’énergie**.
- Des **règles abondantes** peuvent entraîner fatigue et **anémie**, à vérifier avec un médecin.
- Aucune contraception n’améliore ni ne limite la performance, selon le ministère des Sports, en dehors de ses éventuels effets indésirables.

## Comprendre
Le guide « Cycle menstruel et performance » du ministère des Sports, conçu pour les sportives de haut niveau, donne des repères utiles à toutes. Il rappelle qu’un cycle dure en moyenne 28 jours, avec des variations, et que les règles durent normalement moins de 7 jours. Pendant les règles, le niveau d’hormones est au plus bas et la performance peut être un peu plus limitée ; le guide conseille de tenir compte de son ressenti et de sa fatigue.

La semaine qui précède les règles, le syndrome prémenstruel peut se manifester par des ballonnements, des jambes lourdes, des crampes, des maux de tête, une tension des seins, des fringales, de la fatigue, des troubles de l’humeur et du sommeil. La prise de poids passagère liée au cycle ne justifie pas de régime.

**Le point de vigilance majeur : le déficit énergétique.** Quand les apports alimentaires ne couvrent pas la dépense (entraînement intense, restriction alimentaire), l’organisme peut « mettre en pause » les cycles. L’Assurance Maladie cite les sportives d’endurance, de sports esthétiques ou à catégories de poids. Le guide du ministère décrit les signes d’alerte : fatigue chronique, performances en baisse, blessures plus fréquentes. Les conséquences possibles touchent notamment les os (fractures de fatigue). Ces troubles sont réversibles en quelques mois avec une prise en charge adaptée.

## Au quotidien
- **Adapte l’intensité** à ton ressenti les jours de règles : technique, endurance douce, étirements si tu es fatiguée.
- **Choisis une protection adaptée** à ton activité et change-la régulièrement ; respecte la durée maximale de port des protections internes (6 heures).
- **Hydrate-toi et mange suffisamment** : un apport énergétique adapté à ton entraînement protège ton cycle et tes os.
- **Note ton cycle** : dates des règles, douleurs, fatigue, performances. Repérer un cycle qui s’allonge ou disparaît permet de réagir tôt.
- **Si tu entraînes des ados**, sache qu’un cycle qui s’arrête n’est pas un signe de « bonne forme » et qu’il mérite un avis médical.

## Questions fréquentes
**Peut-on nager pendant les règles ?** Oui, avec une protection adaptée à la baignade (tampon ou coupe), changée en respectant la durée maximale de port.

**Mes règles ont disparu depuis que je m’entraîne plus, est-ce grave ?** Ce n’est pas anodin : le guide recommande une consultation en cas d’absence de règles ou de cycles irréguliers depuis le début de l’entraînement. Un bilan permet de vérifier tes apports et ta santé osseuse.

**Faut-il adapter son entraînement à chaque phase du cycle ?** Le guide invite surtout à tenir compte de ton ressenti. Noter ton cycle et tes sensations t’aide à repérer ce qui te concerne personnellement.

**Je ne veux pas en parler à mon entraîneur…** Tu n’es pas obligée. L’essentiel est d’en parler à un professionnel de santé : médecin, médecin du sport, sage-femme.

## Quand demander conseil
Consulte si tes règles s’arrêtent plus de 3 mois, si tu as moins de 6 cycles par an, si tu n’as pas eu tes premières règles à 16 ans, si tes douleurs ou ton syndrome prémenstruel gênent ton entraînement, ou si tu te sens épuisée. Une douleur qui t’empêche de vivre normalement n’a pas à être subie. Si tu as une relation difficile avec l’alimentation, parles-en : des professionnels peuvent t’aider.

${URG}

${FIN}`,
  }),
  a({
    slug: 'migraine-des-regles-catameniale',
    title: 'Migraine pendant les règles : comprendre la migraine menstruelle et mieux la gérer',
    summary: 'Pourquoi certaines migraines reviennent autour des règles, comment tenir un agenda des crises et quelles pistes discuter avec ton médecin.',
    tags: ['migraine règles', 'migraine menstruelle', 'migraine cataméniale', 'mal de tête règles', 'céphalée cycle', 'migraine avec aura', 'agenda migraine', 'pilule migraine'],
    sources: [S.ameliMigraine, S.ameliMigraineTtt, S.ameliDouleursCauses],
    body_md: `## En bref
- Chez la femme, la **chute des œstrogènes en fin de cycle** peut déclencher une migraine dite **menstruelle** ou **cataméniale**, de **2 jours avant à 3 jours après** le début des règles.
- La forme « pure » (crises uniquement au moment des règles) est **rare** ; environ **une migraineuse sur trois** a des crises menstruelles en plus d’autres crises.
- Tenir un **agenda des crises** avec la **date des règles** aide le médecin à poser le diagnostic et à choisir un traitement.
- En cas de **migraine avec aura**, la contraception **œstroprogestative est contre-indiquée** : parles-en avant tout choix de contraception.
- Un mal de tête **brutal, inhabituel**, avec fièvre ou troubles neurologiques qui persistent nécessite une **prise en charge urgente**.

## Comprendre
La migraine est une maladie fréquente, qui touche 2 à 3 fois plus les femmes que les hommes. La crise associe une douleur souvent d’un seul côté, pulsatile, aggravée par l’effort, et parfois des nausées, des vomissements, une gêne à la lumière, au bruit ou aux odeurs. Certaines personnes ont une **aura** : des signes visuels (points lumineux, vision floue), des fourmillements ou des difficultés à parler, qui durent de quelques minutes à une heure avant la douleur.

L’Assurance Maladie explique que la chute brutale des œstrogènes en fin de cycle peut provoquer une crise survenant de deux jours avant à trois jours après le début des règles. D’autres facteurs peuvent s’ajouter : manque ou excès de sommeil, repas sauté, stress ou relâchement du stress, alcool. Les règles douloureuses elles-mêmes peuvent aussi s’accompagner de maux de tête.

## Au quotidien
- **Tiens un agenda** : date et heure de la crise, durée, intensité, facteurs déclenchants, **date de tes règles**, médicaments pris et leur effet. Le suivi de cycle de l’app peut t’aider à faire le lien.
- **Anticipe** : si tes crises reviennent au même moment du cycle, allège ton planning, prévois du repos et garde à portée de main ce que ton médecin t’a conseillé.
- **Soigne ton rythme**, surtout autour des règles : horaires de coucher et de lever réguliers, repas à heures fixes, hydratation.
- **Bouge régulièrement** : l’Assurance Maladie cite l’activité d’endurance (marche rapide, vélo, course) parmi les mesures utiles entre les crises.
- **Repère tes déclencheurs** personnels (alcool, manque de sommeil, certains aliments) sans te lancer dans un régime strict.
- **Surveille ta consommation d’antidouleurs** : des prises trop fréquentes peuvent entretenir des maux de tête chroniques. Compte tes jours de prise et parles-en à ton médecin.

## Questions fréquentes
**Existe-t-il un traitement spécifique de la migraine menstruelle ?** Oui, le médecin peut proposer un traitement de crise adapté et, dans certains cas, un traitement hormonal ciblé autour des règles. C’est à décider avec lui selon ta situation et tes contre-indications.

**Ma pilule peut-elle jouer sur mes migraines ?** Le choix de la contraception dépend de ton âge et de la présence d’une aura. Si tu as des migraines avec aura, une pilule œstroprogestative est contre-indiquée : signale-le toujours.

**Faut-il faire des examens ?** Pour une migraine typique, l’Assurance Maladie indique qu’aucun examen n’est en général nécessaire : le diagnostic repose sur l’interrogatoire et un examen normal.

**Je pensais que c’était « juste » un mal de tête de règles…** La migraine peut altérer la qualité de vie, les études et le travail ; un tiers des personnes concernées n’ont jamais consulté. Des traitements existent.

## Quand demander conseil
Consulte si tes crises sont fréquentes, intenses, durent plusieurs jours ou te font manquer cours ou travail, ou si tu prends souvent des antidouleurs. Appelle le **15** ou le **112** en cas de mal de tête brutal et très intense, de fièvre avec raideur de la nuque, ou de signes neurologiques (paralysie, troubles de la parole, de la vision) qui ne disparaissent pas.

${URG}

${FIN}`,
  }),
  a({
    slug: 'trouble-dysphorique-premenstruel-tdpm',
    title: 'Trouble dysphorique prémenstruel (TDPM) : quand l’humeur s’effondre avant les règles',
    summary: 'Tristesse intense, anxiété, irritabilité qui reviennent chaque cycle avant les règles : reconnaître le trouble dysphorique prémenstruel et oser en parler.',
    tags: ['TDPM', 'trouble dysphorique prémenstruel', 'déprime avant les règles', 'anxiété règles', 'humeur cycle', 'idées noires règles', 'SPM sévère', 'santé mentale cycle'],
    safety_critical: true,
    sources: [S.qsRegles, S.psycomFemmes, S.santeTroubles],
    body_md: `## En bref
- Le **trouble dysphorique prémenstruel** (TDPM) est une forme **sévère** du syndrome prémenstruel, centrée sur l’humeur : **humeur dépressive** ou **forte anxiété** avant les règles.
- Il concerne **5 à 10 %** des femmes selon QuestionSexualité.
- Signe clé : les symptômes reviennent **à chaque cycle** dans les jours qui précèdent les règles, puis s’atténuent après leur début.
- Ce n’est ni un caprice ni un manque de volonté : **parles-en à un médecin**, des prises en charge existent.
- En cas d’**idées noires**, appelle le **3114**, gratuit, jour et nuit.

## Comprendre
Beaucoup de personnes ressentent des variations d’humeur avant les règles : c’est le syndrome prémenstruel, avec par exemple de l’irritabilité, de la tristesse ou de la fatigue. Pour une minorité, ces symptômes sont si intenses qu’ils bouleversent le quotidien : on parle alors de trouble dysphorique prémenstruel.

Psycom, le site d’information en santé mentale, décrit les symptômes psychologiques qui peuvent apparaître à l’approche des règles : tristesse, manque d’énergie, sensation de malaise, crises de larmes, irritabilité, impatience, anxiété. Il rappelle, en citant l’Inserm, que souffrir à chaque cycle n’a pas à être accepté. Il recommande d’envisager un TDPM, mais aussi d’autres causes comme une endométriose ou un syndrome des ovaires polykystiques, quand les règles s’accompagnent d’une douleur qui empêche toute activité, d’une grande fatigue ou d’une anxiété élevée, et d’en parler à un médecin.

Selon Santé.fr, le syndrome prémenstruel est lié aux variations hormonales en fin de cycle, après l’ovulation, par des mécanismes encore mal connus. Les symptômes s’estompent en général un ou deux jours après l’arrivée des règles. C’est ce rythme qui distingue le TDPM d’une dépression ou d’un trouble anxieux présents tout le mois, même si les deux peuvent coexister.

## Au quotidien
- **Note ton humeur chaque jour** pendant au moins deux cycles, avec la date de tes règles : une échelle simple (de 1 à 5), quelques mots, ton sommeil. Ce relevé est précieux pour le médecin.
- **Anticipe les jours difficiles** : Psycom suggère d’alléger ton agenda ou de télétravailler si c’est possible pendant les périodes de vulnérabilité.
- **Préviens tes proches** de ce qui se passe : cela évite des malentendus et permet d’être soutenue.
- **Prends soin des bases** : sommeil régulier, activité physique, limiter alcool et excitants. Ces mesures peuvent aider, même si elles ne suffisent pas toujours.
- **Prépare la consultation** : tes notes, depuis quand cela dure, l’impact sur tes études, ton travail, ta vie de couple ou de famille, ta contraception actuelle.
- **Pense au soutien psychologique** : médecin traitant, psychologue, service de santé étudiante pour les étudiantes.

## Questions fréquentes
**Comment savoir si c’est un TDPM ou une dépression ?** Le TDPM suit le cycle : les symptômes surviennent avant les règles et s’améliorent ensuite. Si tu te sens mal tout le mois, parles-en aussi à un médecin : c’est lui qui pourra faire la part des choses.

**Ma contraception peut-elle jouer ?** Les hormones peuvent influencer l’humeur, dans un sens ou dans l’autre. Ne change pas de traitement seule : discutes-en avec le professionnel qui te la prescrit.

**Est-ce que ça se soigne ?** Le médecin peut proposer différentes approches selon tes symptômes. L’important est de ne pas rester seule avec cette souffrance.

**J’ai honte de mes réactions avant les règles…** Ce que tu ressens a une origine réelle. En parler, c’est déjà reprendre de la marge de manœuvre.

## Quand demander conseil
Consulte si tes symptômes perturbent ta vie chaque mois, si tu te sens très triste, très anxieuse ou à bout. Si tu as des idées suicidaires ou te sens en danger, appelle immédiatement le **3114** (numéro national de prévention du suicide, gratuit, 24 h/24) ou le **15** / **112** en cas d’urgence. Les 12-25 ans peuvent aussi joindre Fil Santé Jeunes au **0800 235 236** (anonyme et gratuit).

${FIN}`,
  }),
  a({
    slug: 'retard-de-regles-test-de-grossesse-autres-causes',
    title: 'Retard de règles : quand faire un test de grossesse et quelles autres causes possibles',
    summary: 'Tes règles n’arrivent pas : à quel moment faire un test, urinaire ou sanguin, comment l’interpréter et quelles autres raisons peuvent expliquer un retard.',
    tags: ['retard de règles', 'règles en retard', 'test de grossesse', 'quand faire un test', 'test sanguin bêta-hCG', 'test négatif retard', 'stress règles', 'enceinte ou pas'],
    journeys: ['avoid', 'ttc'],
    safety_critical: true,
    sources: [S.qsEnceinte, S.santeTests, S.ameliAmeno],
    body_md: `## En bref
- Un retard de règles peut être le **premier signe d’une grossesse**, mais le **stress**, le **sport**, les **voyages** ou d’autres causes peuvent aussi décaler les règles.
- Le **test de grossesse** est le seul moyen fiable de savoir si tu es enceinte.
- **Test urinaire** : à partir de la date prévue des règles, avec les premières urines du matin ; si tes cycles sont irréguliers, environ **3 semaines après le rapport**.
- **Test sanguin** : le plus fiable, possible dès **14 jours après le rapport**, remboursé sur ordonnance.
- **Retard + douleur brutale ou saignements** : consulte en urgence.

## Comprendre
L’Assurance Maladie rappelle qu’une absence de règles à la date prévue peut être le premier signe d’une grossesse, mais que ce signe ne suffit pas : le stress, le sport ou les voyages peuvent aussi retarder les règles. QuestionSexualité ajoute que les signes souvent associés à la grossesse (seins sensibles, fatigue, nausées, envie d’uriner plus souvent, humeur changeante) peuvent aussi venir d’un stress, du syndrome prémenstruel ou d’un déséquilibre hormonal.

**Le test urinaire** détecte l’hormone de grossesse (hCG) dans les urines. Elle n’est détectable qu’environ 10 jours après la fécondation : un test fait trop tôt peut être faussement négatif. QuestionSexualité conseille de le faire à partir de la date prévue des règles ; Santé.fr (contenu Fil Santé Jeunes) recommande d’attendre 21 jours après le rapport à risque pour un résultat fiable. Il s’achète sans ordonnance en pharmacie ou en grande surface ; il peut être pris en charge dans les centres de santé sexuelle (ex-centres de planification).

**Le test sanguin** (dosage de la bêta-hCG) se fait en laboratoire dès 14 jours après le rapport. Il est remboursé sur prescription ; les mineures et les personnes sans couverture sociale peuvent obtenir une ordonnance dans un centre de santé sexuelle.

Certaines situations peuvent fausser un test urinaire : un test trop précoce, certains médicaments, du sang dans les urines ou une infection urinaire.

## Au quotidien
- **Regarde ton calendrier** : date des dernières règles, durée habituelle de ton cycle, date du rapport non ou mal protégé.
- **Si le rapport date de moins de 5 jours** et que tu ne souhaites pas de grossesse, pense à la **contraception d’urgence**, disponible en pharmacie, d’autant plus efficace qu’elle est prise tôt.
- **Fais le test au bon moment**, de préférence le matin, et lis bien la notice.
- **Test négatif mais toujours pas de règles ?** Refais un test quelques jours plus tard ou demande une prise de sang, et consulte si le retard persiste.
- **Test positif ?** Consulte un professionnel de santé : pour confirmer et suivre la grossesse si tu la poursuis, ou le plus tôt possible si tu envisages une IVG ou si tu hésites.

## Questions fréquentes
**Le stress peut-il vraiment retarder les règles ?** Oui, les sources officielles citent le stress, comme le sport intense ou les voyages, parmi les causes possibles d’un retard.

**J’ai eu des petits saignements à la place de mes règles, puis-je être enceinte ?** QuestionSexualité indique que des saignements en début de grossesse peuvent être pris pour des règles. En cas de doute, fais un test.

**Je prends la pilule et je n’ai pas eu mes règles pendant la pause.** Relis la notice et, en cas d’oubli de comprimé ou de doute, fais un test et demande conseil à un pharmacien ou à ton médecin.

**À partir de quand faut-il consulter pour un retard sans grossesse ?** Si les règles ne reviennent pas pendant plus de 3 mois (hors allaitement et ménopause), l’Assurance Maladie recommande de consulter pour en chercher la cause.

## Quand demander conseil
Consulte si ton test est positif, si le doute persiste malgré un test négatif, ou si ton retard se prolonge. **Retard de règles avec douleur brutale et intense du ventre, saignements, malaise** : cela peut évoquer une grossesse extra-utérine ou une fausse couche, appelle le **15** ou le **112**. Les 12-25 ans peuvent joindre Fil Santé Jeunes au **0800 235 236**.

${FIN}`,
  }),
  a({
    slug: 'amenorrhee-regles-absentes-causes-quand-consulter',
    title: 'Règles absentes (aménorrhée) : les causes possibles et quand consulter',
    summary: 'Pas de règles depuis plus de 3 mois, ou pas encore de premières règles à 16 ans : ce que recouvre l’aménorrhée, ses causes fréquentes et le bilan possible.',
    tags: ['aménorrhée', 'plus de règles', 'règles absentes', 'arrêt des règles', 'pas de règles 3 mois', 'aménorrhée primaire', 'règles après pilule', 'prolactine'],
    journeys: ['avoid', 'child'],
    sources: [S.ameliAmeno, S.ameliAmenoCauses, S.santeTroubles],
    body_md: `## En bref
- L’**aménorrhée** désigne l’absence de règles chez une personne en âge d’être réglée, en dehors de la **grossesse**, de l’**allaitement** et de la **ménopause**.
- **Aménorrhée primaire** : pas de premières règles à **16 ans**. **Aménorrhée secondaire** : plus de règles depuis **plus de 3 mois** alors qu’elles étaient régulières.
- Causes fréquentes : **grossesse**, **stress ou choc psychologique**, **perte de poids** ou **troubles alimentaires**, **sport intense**, **SOPK**, excès de **prolactine**, arrêt récent de la pilule.
- Dans tous ces cas, **consulte** : l’aménorrhée signale un dérèglement dont il faut trouver la cause.
- Commence toujours par un **test de grossesse** en cas de rapport sexuel.

## Comprendre
L’Assurance Maladie précise que les premières règles surviennent habituellement entre 10 et 15 ans. Ne pas être réglée à 16 ans justifie une consultation ; la cause la plus fréquente est un retard pubertaire, selon Santé.fr, mais d’autres causes plus rares sont recherchées.

Pour l’aménorrhée secondaire, les principales causes décrites sont :
- **la grossesse**, à éliminer en premier ;
- **des causes « fonctionnelles »**, réversibles : choc émotionnel ou événement traumatisant, stress important, **anorexie** ou apports alimentaires insuffisants, **sport intense** (endurance, sports esthétiques ou à catégories de poids). Les règles reviennent en général quand la situation s’améliore ; un arrêt prolongé peut fragiliser les os ;
- **l’arrêt de la pilule** : la reprise des cycles peut prendre quelques semaines ; au-delà de 3 mois, une cause est recherchée ;
- **le syndrome des ovaires polykystiques (SOPK)**, avec cycles longs ou absents, parfois acné, pilosité ou chute de cheveux ;
- **un excès de prolactine**, lié à certains médicaments ou à un adénome hypophysaire bénin, parfois avec un écoulement par les mamelons ;
- **l’insuffisance ovarienne prématurée** (avant 40 ans), avec bouffées de chaleur ;
- **des causes utérines** après une IVG instrumentale, un curetage ou une chirurgie (adhérences, col rétréci) ;
- plus rarement, d’autres causes hormonales ou génétiques.

## Au quotidien
- **Fais un test de grossesse** si tu as eu un rapport, même protégé, puis consulte si le doute persiste.
- **Note tes dates** : dernières règles, arrêt éventuel d’une contraception, changements récents (poids, entraînement, stress, médicaments).
- **Prends soin de ton alimentation** si tu fais beaucoup de sport : un apport insuffisant peut suffire à interrompre les cycles.
- **Ne te mets pas en danger** en attendant que « ça revienne » : une consultation permet d’agir tôt, notamment pour protéger tes os.
- **Prépare les questions** du médecin : acné, pilosité, écoulement par les seins, bouffées de chaleur, maux de tête, troubles de la vue.

## Questions fréquentes
**Mes règles ne sont pas revenues depuis l’arrêt de ma pilule, est-ce inquiétant ?** Un délai de quelques semaines est fréquent. Au-delà de 3 mois sans règles, consulte.

**Je n’ai plus mes règles depuis que je mange moins, est-ce grave ?** C’est un signal à prendre au sérieux : l’Assurance Maladie cite la restriction alimentaire parmi les causes d’arrêt des règles, avec un risque pour les os. Parles-en à un médecin ; si l’alimentation est devenue une source d’angoisse, des professionnels peuvent t’accompagner.

**Quels examens peut-on me prescrire ?** Selon les cas : prise de sang (hCG, dosages hormonaux), échographie pelvienne, parfois d’autres examens orientés par le médecin.

**Je n’ai pas de règles pendant l’allaitement, faut-il consulter ?** Non, c’est attendu pendant l’allaitement ; mais l’allaitement ne protège pas toujours d’une grossesse : une contraception reste nécessaire si tu ne souhaites pas être enceinte.

## Quand demander conseil
Consulte si tu n’as pas eu tes premières règles à 16 ans, si tes règles se sont arrêtées depuis plus de 3 mois, si tu as des signes associés (acné ou pilosité nouvelles, écoulement par les seins, bouffées de chaleur, maux de tête). En cas de troubles alimentaires, de mal-être ou d’idées noires, appelle le **3114**.

${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-irregulieres-hors-projet-bebe',
    title: 'Règles irrégulières : comprendre ce qui fait varier ton cycle et quand consulter',
    summary: 'Cycles qui changent d’un mois à l’autre, très courts ou très longs : les explications possibles, de la puberté au SOPK, et les repères pour savoir quand en parler.',
    tags: ['règles irrégulières', 'cycle irrégulier', 'cycle long', 'cycle court', 'SOPK', 'ovaires polykystiques', 'puberté cycle', 'périménopause'],
    sources: [S.santeTroubles, S.ameliSopk, S.ameliRegles],
    body_md: `## En bref
- Un cycle dure en moyenne **28 jours**, avec des variations courantes **entre environ 23-25 et 35 jours** selon les sources.
- Les cycles sont souvent **irréguliers à l’adolescence** (ils se régularisent en général en **un à deux ans**) et à l’approche de la **ménopause**.
- Des cycles **plus longs que 35 à 40 jours** depuis l’adolescence, avec **acné**, **pilosité** ou **chute de cheveux**, peuvent évoquer un **syndrome des ovaires polykystiques** (SOPK).
- Stress, perte de poids, sport intense, contraception ou certains médicaments peuvent aussi dérégler le cycle.
- Noter tes dates sur plusieurs mois est le meilleur point de départ.

## Comprendre
Selon l’Assurance Maladie, la longueur du cycle varie surtout à cause de la première phase (avant l’ovulation) ; la seconde phase est plus stable. Santé.fr rappelle qu’un cycle plus court ou plus long que la moyenne n’est pas forcément un problème. Ce qui compte, c’est ta régularité personnelle et les signes associés.

**À la puberté**, les ovulations ne sont pas encore régulières : les règles peuvent espacer, puis revenir plus abondantes. **Autour de 45-50 ans**, la périménopause entraîne aussi des cycles irréguliers.

**Le SOPK** est un trouble hormonal fréquent. L’Assurance Maladie décrit des cycles de plus de 35 à 40 jours, présents depuis l’adolescence, pouvant aller jusqu’à l’absence de règles, souvent associés à un excès d’hormones masculines : pilosité accrue, acné qui persiste après 20 ans, chute de cheveux. Un surpoids, de la fatigue, une humeur dépressive ou de l’anxiété peuvent s’y ajouter. Le diagnostic repose sur des critères précis, avec prise de sang et parfois échographie. C’est une maladie chronique dont les symptômes se soignent, et qui mérite un suivi (risques métaboliques notamment).

**D’autres causes** : Santé.fr cite un kyste de l’ovaire en cas de cycle particulièrement long avec seins douloureux et maux de ventre et un test de grossesse négatif. Les troubles de l’ovulation, la contraception hormonale, un stress important ou un déficit énergétique (sport intense, apports insuffisants) peuvent aussi jouer.

## Au quotidien
- **Note le premier jour de chaque règles** pendant au moins 3 à 6 mois : la durée de chaque cycle apparaît vite.
- **Ajoute les signes associés** : douleurs, abondance, saignements entre les règles, acné, pilosité, poids, stress, sport.
- **Garde toujours une protection sur toi** quand ton cycle est imprévisible.
- **Si tu as des rapports**, rappelle-toi qu’un cycle irrégulier rend les « calculs » de période fertile très peu fiables : utilise une contraception adaptée si tu ne souhaites pas de grossesse.
- **En cas de retard** après un rapport, fais un test de grossesse.

## Questions fréquentes
**J’ai 14 ans et mes règles sont irrégulières, faut-il consulter ?** Les cycles mettent souvent un à deux ans à se régulariser. Consulte si tes règles sont très abondantes, très douloureuses, ou si elles disparaissent plus de 3 mois.

**Mon cycle varie de quelques jours chaque mois, est-ce un trouble ?** De petites variations sont courantes. Des cycles régulièrement inférieurs à environ 21-23 jours ou supérieurs à 35 jours méritent d’en parler.

**Le SOPK se soigne-t-il ?** Il ne se guérit pas, mais ses symptômes se traitent et un suivi permet de prévenir les complications. Une prise en charge du retentissement psychologique est aussi recommandée.

**Un kyste de l’ovaire peut-il allonger un cycle ?** Santé.fr l’évoque en cas de cycle particulièrement long avec seins douloureux, maux de ventre et test de grossesse négatif. Seul un examen permet de le confirmer : consulte si tu te reconnais dans cette situation.

## Quand demander conseil
Consulte si tes cycles sont régulièrement très courts ou très longs, si tes règles disparaissent plus de 3 mois, si tu as de l’acné ou une pilosité qui te gênent, ou si tes règles deviennent très abondantes ou très douloureuses. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
  a({
    slug: 'troubles-digestifs-pendant-les-regles',
    title: 'Ventre gonflé, diarrhée, nausées pendant les règles : comprendre et soulager',
    summary: 'Pourquoi le cycle peut chambouler la digestion, ce qui peut aider au quotidien et quels signes digestifs doivent faire consulter.',
    tags: ['diarrhée règles', 'ballonnements règles', 'nausées règles', 'ventre gonflé', 'troubles digestifs cycle', 'constipation règles', 'fringales', 'endométriose digestive'],
    sources: [S.ameliDouleursCauses, S.qsRegles, S.sportsCycle],
    body_md: `## En bref
- Les règles s’accompagnent souvent de **troubles digestifs** : **diarrhée**, **nausées**, parfois **vomissements**, selon l’Assurance Maladie et QuestionSexualité.
- Avant les règles, le syndrome prémenstruel peut donner des **ballonnements**, une sensation de gonflement et des **fringales**.
- Ces troubles sont souvent plus marqués quand les **règles sont douloureuses**.
- Repas légers, hydratation, chaleur et activité douce peuvent aider.
- Des **douleurs digestives fortes à chaque cycle** (en allant à la selle, par exemple) méritent un avis : une **endométriose** peut être en cause.

## Comprendre
L’Assurance Maladie liste, parmi les symptômes qui accompagnent les règles douloureuses, des signes digestifs (nausées, vomissements, diarrhée), une fatigue et une sensation de malaise. QuestionSexualité souligne que les règles douloureuses s’accompagnent souvent de fatigue et de troubles digestifs.

Les douleurs de règles sont liées à un excès de prostaglandines qui provoquent des contractions de l’utérus. Les sources consultées associent les troubles digestifs à ces règles douloureuses sans en détailler le mécanisme : retiens surtout qu’ils font partie des symptômes fréquemment décrits et qu’ils peuvent être pris en compte dans le traitement des douleurs.

Dans les jours qui précèdent les règles, le syndrome prémenstruel peut entraîner ballonnements, sensation de gonflement et prise de poids passagère liée à la rétention d’eau, ainsi que des fringales. Le guide du ministère des Sports sur le cycle rappelle que cette prise de poids cyclique ne justifie pas de régime.

Quand les troubles digestifs sont très douloureux et reviennent à chaque cycle, ils peuvent faire partie d’une endométriose, dont les lésions peuvent toucher différents organes du bassin. Un avis médical permet d’en avoir le cœur net.

## Au quotidien
- **Mange léger et en plusieurs petits repas** les jours sensibles, en évitant les plats très gras ou épicés si tu remarques qu’ils te gênent.
- **Bois régulièrement**, surtout en cas de diarrhée ou de vomissements, pour éviter de te déshydrater.
- **Limite sel, alcool et excitants** avant les règles : Santé.fr les cite pour atténuer le syndrome prémenstruel, même si leur efficacité n’est pas démontrée scientifiquement.
- **Mets de la chaleur** sur le ventre (bouillotte) et **bouge doucement** : marche, étirements.
- **Prévois** une tenue confortable et repère les toilettes quand tu sors les premiers jours de règles.
- **Note tes symptômes** dans ton calendrier : jour du cycle, type de trouble, intensité. Cela aide à anticiper et à en parler.
- **Demande conseil** à un pharmacien ou à ton médecin avant de prendre un médicament, surtout si tu as d’autres traitements.

## Questions fréquentes
**Pourquoi ai-je la diarrhée au début de mes règles ?** La diarrhée fait partie des symptômes souvent associés aux règles douloureuses selon l’Assurance Maladie et QuestionSexualité. Si elle est très gênante, douloureuse ou dure au-delà des règles, consulte.

**Ballonnements avant les règles : est-ce le SPM ?** C’est l’un des symptômes les plus cités. Ils disparaissent en général avec l’arrivée des règles.

**J’ai mal en allant à la selle pendant mes règles, est-ce lié ?** Une douleur de ce type, répétée à chaque cycle, doit être signalée : elle peut orienter vers une endométriose.

**Faut-il faire un régime pour le ventre gonflé ?** Non, la prise de poids cyclique est passagère et ne justifie pas de régime.

## Quand demander conseil
Consulte si les troubles digestifs sont intenses, durent au-delà des règles, s’accompagnent de sang dans les selles, d’une perte de poids, d’une fièvre, ou de douleurs fortes à chaque cycle. Une douleur qui t’empêche de vivre normalement n’a pas à être subie. En cas de vomissements avec fièvre élevée et malaise pendant le port d’un tampon ou d’une coupe, retire-la et appelle le 15.

${URG}

${FIN}`,
  }),
  a({
    slug: 'humeur-et-sommeil-selon-le-cycle',
    title: 'Humeur, énergie et sommeil au fil du cycle : mieux comprendre tes variations',
    summary: 'Fatigue, irritabilité, sommeil perturbé avant ou pendant les règles : ce que disent les sources sur les liens entre hormones, humeur et sommeil, et comment t’organiser.',
    tags: ['humeur cycle', 'sommeil règles', 'fatigue avant les règles', 'insomnie règles', 'émotions cycle', 'hormones humeur', 'déprime règles', 'énergie cycle'],
    sources: [S.filsanteRegles, S.psycomFemmes, S.sportsCycle],
    body_md: `## En bref
- Les variations des **hormones** au cours du cycle peuvent influencer l’**humeur**, l’**énergie** et le **sommeil**.
- Avant les règles, le **syndrome prémenstruel** peut s’accompagner de fatigue, de troubles de l’humeur et du sommeil.
- Pendant les règles, la **chute hormonale** peut donner de la **somnolence** ou un petit coup de **déprime** ; des règles douloureuses aggravent souvent le tout.
- Le mode de vie, le sommeil, l’alimentation et les tensions du quotidien jouent aussi beaucoup.
- **Suivre ton cycle** permet d’anticiper les périodes plus fragiles et d’adapter ton organisation.

## Comprendre
Fil Santé Jeunes explique qu’avant les règles, les variations d’œstradiol et de progestérone peuvent provoquer le syndrome prémenstruel, avec des fluctuations d’humeur. Ces fluctuations dépendent aussi de facteurs extérieurs : rythme de vie, sommeil, appétit, tensions familiales. Pendant les règles, la chute des hormones peut entraîner somnolence ou déprime, et des règles douloureuses aggravent les symptômes physiques comme psychologiques.

Le guide « Cycle menstruel et performance » du ministère des Sports cite, parmi les symptômes de la semaine qui précède les règles, la fatigue et les troubles de l’humeur et du sommeil, à côté des ballonnements, maux de tête ou tensions mammaires.

Psycom, site d’information en santé mentale, souligne l’intérêt de suivre son cycle et de noter ses variations d’humeur pour anticiper les périodes de fatigue ou de vulnérabilité, et d’en parler à un médecin quand cela pèse.

Chaque personne a son propre profil : certaines ne ressentent presque rien, d’autres vivent des variations marquées. Quand l’humeur s’effondre chaque mois, on parle de trouble dysphorique prémenstruel, qui nécessite un avis médical.

## Au quotidien
**Observer**
- Note chaque jour, en quelques secondes : humeur, énergie, qualité du sommeil, douleur, jour du cycle. Après deux ou trois cycles, des tendances apparaissent souvent.

**S’organiser**
- Garde les tâches les plus exigeantes pour les jours où tu te sens en forme, si c’est possible.
- Les jours plus fragiles, allège ton agenda, prévois des pauses et des moments pour toi.

**Prendre soin de son sommeil**
- Des horaires de coucher et de lever réguliers, une chambre calme et sombre.
- Limite écrans, café et alcool le soir.
- En cas de douleur nocturne, la chaleur (bouillotte) et une protection adaptée pour la nuit (serviette ou culotte menstruelle) aident à mieux dormir.

**Se soutenir**
- Une activité physique régulière, même douce, aide l’humeur et le sommeil.
- Explique à tes proches ce que tu traverses : cela allège la tension et évite les malentendus.

## Questions fréquentes
**Pourquoi je pleure plus facilement avant mes règles ?** Les variations hormonales de fin de cycle peuvent rendre plus sensible. Si ces moments deviennent très douloureux ou envahissants, parles-en à un médecin.

**Je dors mal pendant mes règles, que faire ?** Douleurs, peur de tacher et variations hormonales peuvent perturber le sommeil. Une protection adaptée la nuit, la chaleur et un rythme régulier aident ; si la douleur te réveille souvent, consulte.

**Les applis de suivi de cycle sont-elles utiles pour l’humeur ?** Psycom cite le suivi du cycle, y compris avec des applis, comme un moyen d’anticiper les périodes de vulnérabilité. Elles ne remplacent pas un avis médical.

**Ma contraception change-t-elle mon humeur ?** Les hormones peuvent avoir un effet, variable d’une personne à l’autre. Parles-en au professionnel qui te la prescrit avant de modifier quoi que ce soit.

## Quand demander conseil
Consulte si ton humeur ou ton sommeil sont très perturbés chaque mois, si tu te sens triste ou anxieuse la plupart du temps, ou si la fatigue ne passe pas. Si tu as des idées noires, appelle le **3114** (gratuit, 24 h/24) ; les 12-25 ans peuvent aussi joindre Fil Santé Jeunes au **0800 235 236**. En cas d’urgence, appelle le **15** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'sexualite-pendant-les-regles',
    title: 'Sexualité pendant les règles : envies, idées reçues et protection',
    summary: 'Avoir des rapports pendant les règles, c’est un choix à deux : ce qu’il faut savoir sur le risque de grossesse, les IST et le confort.',
    tags: ['rapport pendant les règles', 'sexe règles', 'grossesse pendant les règles', 'IST règles', 'préservatif règles', 'libido cycle', 'tampon rapport', 'idées reçues règles'],
    sources: [S.qsRegles, S.filsanteRegles, S.santeDysmeno],
    body_md: `## En bref
- Les règles **ne sont pas une contre-indication** aux rapports sexuels : c’est à chacun et chacune de décider s’il ou elle se sent à l’aise.
- **Une grossesse reste possible** : les spermatozoïdes peuvent survivre jusqu’à **5 jours** et, avec un cycle court, l’ovulation peut survenir peu après les règles.
- Les rapports non protégés pendant les règles peuvent **augmenter le risque de transmission de certaines IST**.
- Le **préservatif** protège à la fois des IST et de la grossesse.
- **Retire ton tampon** avant un rapport avec pénétration vaginale.

## Comprendre
Il existe beaucoup d’idées reçues sur les rapports pendant les règles. Fil Santé Jeunes rappelle que les règles ne sont pas une contre-indication et que chaque partenaire décide s’il ou elle est à l’aise. Certaines personnes ont plus de désir à ce moment-là, d’autres moins, d’autres pas du tout : tout cela se respecte, et personne n’a à se forcer.

**Le risque de grossesse** : QuestionSexualité explique qu’une grossesse est possible sans contraception pendant les règles, pour deux raisons. D’une part, avec des cycles courts, l’ovulation peut survenir très tôt, peu après la fin des règles. D’autre part, les spermatozoïdes peuvent survivre jusqu’à cinq jours dans l’appareil génital. Sans contraception, il n’existe donc pas de moment du cycle où une grossesse serait impossible.

**Le risque d’IST** : les rapports non protégés pendant les règles augmentent le risque de transmission de certaines infections sexuellement transmissibles, selon QuestionSexualité et Fil Santé Jeunes. Le sang peut faciliter cette transmission.

**Et les douleurs ?** Santé.fr mentionne que l’activité sexuelle peut, chez certaines personnes, réduire les troubles liés aux règles. À l’inverse, si les rapports sont douloureux, notamment en profondeur, c’est un signe à signaler à un professionnel : cela peut évoquer une endométriose.

## Au quotidien
- **Parlez-en** avant : envies, limites, gêne éventuelle. Le consentement compte à chaque moment.
- **Utilise un préservatif** si tu n’as pas de contraception ou si le statut IST de ton ou ta partenaire n’est pas connu.
- **Retire tampon ou coupe** avant une pénétration vaginale ; un tampon oublié doit être retiré dès que possible.
- **Côté pratique** : une serviette de bain foncée, des mouchoirs, une douche avant ou après peuvent mettre plus à l’aise.
- **Pense à d’autres formes d’intimité** si tu préfères éviter la pénétration ces jours-là.
- **En cas de rapport non protégé**, la contraception d’urgence est possible en pharmacie, et un dépistage des IST peut être utile.

## Questions fréquentes
**Peut-on tomber enceinte pendant les règles ?** Oui, c’est possible, surtout avec un cycle court. Si tu ne souhaites pas de grossesse, garde une contraception efficace.

**C’est sale d’avoir des rapports pendant les règles ?** Non, le sang des règles fait partie du fonctionnement normal du corps. C’est une question de confort et de choix personnel.

**Le sexe pendant les règles soulage-t-il les douleurs ?** Santé.fr indique que l’activité sexuelle peut réduire ces troubles chez certaines personnes. Ce n’est pas le cas pour toutes, et rien ne t’y oblige.

**J’ai mal pendant les rapports, surtout pendant mes règles.** Parles-en à un médecin, une sage-femme ou un gynécologue : des douleurs pendant les rapports ne sont pas à subir et peuvent avoir une cause qui se traite.

## Quand demander conseil
Consulte en cas de douleur pendant ou après les rapports, de saignements après les rapports en dehors des règles, de pertes ou de démangeaisons inhabituelles, ou après un rapport à risque d’IST. Les 12-25 ans peuvent joindre Fil Santé Jeunes au **0800 235 236**. En cas de violence sexuelle, appelle le **17** ou le **112** ; le **3919** écoute les femmes victimes de violences.

${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-au-travail-et-a-l-ecole-amenagements',
    title: 'Règles douloureuses au travail, à l’école ou à la fac : s’organiser et demander des aménagements',
    summary: 'Absences, douleurs, fatigue : comment t’organiser, à qui t’adresser et quels aménagements existent à l’école, à l’université et en entreprise.',
    tags: ['règles travail', 'règles école', 'congé menstruel', 'aménagement études endométriose', 'absence règles', 'service de santé étudiante', 'infirmière scolaire', 'télétravail règles'],
    journeys: ['avoid', 'child'],
    sources: [S.ameliDouleursCauses, S.etudiantEndo, S.santeEndoTravail],
    body_md: `## En bref
- Les règles douloureuses sont la **première cause d’absentéisme scolaire** chez les adolescentes et **professionnel** chez les jeunes femmes, selon l’Assurance Maladie.
- Une douleur qui t’empêche d’aller en cours ou au travail **n’est pas à subir** : elle mérite une consultation et un traitement adapté.
- À l’université, le **service de santé étudiante** est la porte d’entrée pour des **aménagements d’études** (absences tolérées, temps additionnel aux examens…), validés par un médecin.
- En entreprise, des aménagements d’horaires, de poste, du **télétravail** ou des jours supplémentaires peuvent être discutés, **dans le respect du secret médical**.
- Un **kit** dans ton sac et une organisation anticipée allègent beaucoup les jours difficiles.

## Comprendre
L’Assurance Maladie souligne que les règles douloureuses sont la première cause d’absentéisme scolaire chez l’adolescente et professionnel chez la jeune femme. Pourtant, beaucoup de personnes n’osent pas en parler, par gêne ou parce que la douleur de règles a longtemps été banalisée.

**Pour les étudiantes**, etudiant.gouv.fr détaille, à propos de l’endométriose, les aménagements possibles, à faire valider par un médecin après un entretien : tolérance pour les absences justifiées médicalement, aménagement de l’emploi du temps, modalités d’examen adaptées ou dispense d’assiduité, étalement du cursus, temps additionnel aux examens, régime spécial d’études dans le cadre du handicap. Certaines universités proposent aussi un **congé menstruel**. Le **service de santé étudiante**, accessible à tous les étudiants, est le point de départ ; on peut y consulter selon les cas un médecin, une sage-femme, un gynécologue ou une infirmière.

**Pour les salariées**, Santé.fr relaie les ressources de l’Anact (affiche, quiz, guide) qui invitent les entreprises à agir sur les horaires, le poste et l’activité, à renforcer le soutien managérial dans le respect du secret médical, et cite le télétravail et des jours de congés supplémentaires parmi les pistes. Ces mesures s’inscrivent idéalement dans une démarche collective de l’entreprise sur les maladies chroniques.

## Au quotidien
- **Consulte** si tes règles t’empêchent régulièrement d’étudier ou de travailler : un traitement adapté peut changer ton quotidien, et une cause comme l’endométriose peut être recherchée.
- **Prépare un kit** : protections de rechange, sous-vêtement, petit sac hermétique, antidouleur conseillé par ton médecin ou ton pharmacien, bouillotte souple si possible.
- **Note ton cycle** pour anticiper : éviter de caler un examen oral ou une réunion importante le jour le plus difficile quand tu as le choix.
- **Au collège ou au lycée**, l’infirmerie scolaire peut t’accueillir et t’aider à en parler à ta famille.
- **À la fac**, prends rendez-vous au service de santé étudiante ; un étudiant relais-santé ou le relais handicap peuvent t’aider dans les démarches.
- **Au travail**, tu n’as pas à révéler ton diagnostic à ton employeur. Tu peux t’adresser à la médecine du travail ou aux ressources humaines pour discuter d’aménagements.

## Questions fréquentes
**Le congé menstruel existe-t-il partout ?** Non : selon etudiant.gouv.fr, certaines universités le proposent ; en entreprise, cela dépend des accords et des politiques internes.

**Dois-je dire à mon manager que j’ai des règles douloureuses ?** Ce n’est pas une obligation. Les aménagements peuvent se discuter sans détailler ta santé, dans le respect du secret médical.

**Ma fille rate souvent l’école à cause de ses règles, que faire ?** Aide-la à prendre rendez-vous avec son médecin : des douleurs qui font manquer l’école doivent être prises en charge, et un bilan d’endométriose peut être nécessaire.

## Quand demander conseil
Consulte si tes règles te font manquer des cours ou le travail, si la douleur résiste à ce qui t’a été conseillé, ou si elle s’accompagne de règles très abondantes. Si tu te sens à bout ou isolée, appelle le **3114** ; les 12-25 ans peuvent joindre Fil Santé Jeunes au **0800 235 236**.

${URG}

${FIN}`,
  }),
  a({
    slug: 'suivre-son-cycle-calendrier-quoi-noter',
    title: 'Suivre ton cycle dans un calendrier : quoi noter, pourquoi, et ses limites',
    summary: 'Dates des règles, flux, douleurs, humeur : comment tenir un calendrier de cycle utile pour toi et pour ton médecin, sans le confondre avec une contraception.',
    tags: ['calendrier règles', 'suivi du cycle', 'appli règles', 'noter ses règles', 'durée du cycle', 'journal des symptômes', 'méthode calendrier', 'prévoir ses règles'],
    journeys: ['avoid', 'ttc'],
    sources: [S.qsRegles, S.psycomFemmes, S.ameliNaturelles],
    body_md: `## En bref
- Noter le **premier jour de tes règles** chaque mois permet de connaître la **durée de ton cycle** et d’anticiper les prochaines règles.
- Ajouter quelques infos (**abondance**, **douleur**, **humeur**, **saignements entre les règles**) en fait un outil précieux pour **repérer un changement** et préparer une consultation.
- Psycom recommande ce suivi pour **anticiper** les périodes de fatigue ou de vulnérabilité.
- Un calendrier **n’est pas une contraception** : l’Assurance Maladie rappelle que la méthode du calendrier a un **taux d’échec élevé** et ne protège pas des IST.
- Le suivi de cycle de l’app sert à **t’informer**, pas à poser un diagnostic.

## Comprendre
QuestionSexualité explique comment calculer la durée de ton cycle : on compte les jours entre le premier jour des règles et le premier jour des règles suivantes. Au bout de trois ou quatre cycles, si ceux-ci sont réguliers, on obtient une bonne moyenne.

Un calendrier bien tenu aide à répondre aux questions que posent les professionnels : date des dernières règles, durée et abondance des règles, nombre de protections par jour, saignements entre les règles, douleurs, retentissement sur ta vie quotidienne. Pour la migraine menstruelle, l’Assurance Maladie conseille par exemple de noter la date des règles dans l’agenda des crises.

Psycom souligne que suivre son cycle et noter ses variations d’humeur, éventuellement avec une appli, permet d’anticiper les périodes plus fragiles et d’alléger son agenda quand c’est possible.

**Attention à la contraception.** La méthode dite du calendrier (Ogino) consiste à éviter les rapports pendant la période supposée fertile. L’Assurance Maladie la réserve aux personnes ayant des cycles réguliers, qui connaissent bien leur cycle et acceptent un risque de grossesse, et indique que les méthodes naturelles ont un taux d’échec élevé en pratique et ne protègent pas des IST. Une prédiction de règles ou d’ovulation dans une appli ne remplace pas une contraception.

## Au quotidien
**Le minimum utile**
- Le premier jour des règles et le jour où elles se terminent.

**Pour aller plus loin** (quelques secondes par jour)
- Abondance : légère, moyenne, forte ; nombre de protections ; caillots ; débordements la nuit.
- Douleur sur une échelle de 0 à 10, et ce qui l’a soulagée.
- Humeur, énergie, sommeil.
- Saignements ou pertes inhabituelles entre les règles.
- Événements particuliers : maladie, stress, voyage, changement de contraception, sport intense.

**Bien s’en servir**
- Regarde ton calendrier avant une consultation, ou montre-le au professionnel.
- Repère les **changements** : cycle qui s’allonge, règles plus abondantes, douleur qui augmente.
- Garde une protection sur toi quelques jours avant la date prévue, surtout si ton cycle varie.
- Si tu ne souhaites pas de grossesse, utilise une contraception efficace, indépendamment de ce que prédit ton calendrier.

## Questions fréquentes
**Mon appli prévoit mes règles, est-ce fiable ?** Elle se base sur tes cycles précédents : plus tes cycles sont réguliers, plus l’estimation est proche. Elle peut se tromper, surtout en cas de cycle irrégulier.

**Puis-je utiliser mon calendrier pour savoir quand je suis fertile ?** Une estimation est possible, mais elle reste incertaine. Si tu as un projet de grossesse, parles-en à un professionnel ; si tu veux éviter une grossesse, ne t’y fie pas comme contraception.

**Combien de temps faut-il noter ?** Trois ou quatre cycles donnent une première moyenne. Continuer permet de repérer les changements au fil des années.

**Mes données sont-elles utiles même si tout va bien ?** Oui : connaître ton fonctionnement habituel aide à remarquer plus vite ce qui change.

## Quand demander conseil
Consulte si ton calendrier montre des cycles très courts ou très longs, des règles absentes plus de 3 mois, des règles très abondantes ou longues, des saignements entre les règles ou des douleurs croissantes. Une douleur qui t’empêche de vivre normalement n’a pas à être subie.

${URG}

${FIN}`,
  }),
];
