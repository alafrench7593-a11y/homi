/** Guide complet — lot 34 (27/10/2026) : contraception et IVG (choisir, consultation, gratuité, prise de la pilule au quotidien, situations particulières, contraception d'urgence, IVG, couple, idées reçues). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». Tutoiement (module cycle). Aucune dose de médicament, aucune marque. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est indiquée.
const S = {
  santeChoisir: { label: 'Santé.fr (QuestionSexualité, Santé publique France) — Comment choisir la contraception qui vous convient ?', url: 'https://www.sante.fr/comment-choisir-la-contraception-qui-vous-convient', consulted_on: C, published: '2024-09-26' },
  ameliChoisir: { label: 'ameli.fr — Comment bien choisir sa contraception ?', url: 'https://www.ameli.fr/assure/sante/themes/contraception/choisir-mode-contraception', consulted_on: C, published: '2026-01-12' },
  santeQuiOu: { label: 'Santé.fr (Fil santé jeunes) — La contraception, qui et où ?', url: 'https://www.sante.fr/node/137983', consulted_on: C, published: '2024-07-29' },
  spContraception: { label: 'Service-Public.fr — Contraception', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F707', consulted_on: C, published: '2026-09-28' },
  ameliHormonale: { label: 'ameli.fr — Contraception hormonale : pilule, patch, anneau vaginal, implant, injection', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-contraception-hormonale', consulted_on: C },
  qsPilule: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que la pilule contraceptive ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/la-pilule-comment-ca-marche', consulted_on: C },
  ansmPilule: { label: 'ANSM — Dossier thématique : pilule contraceptive', url: 'https://ansm.sante.fr/dossiers-thematiques/pilule-contraceptive', consulted_on: C, published: '2026-08-11' },
  ameliCu: { label: 'ameli.fr — Quelles méthodes de contraception d’urgence ?', url: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/comprendre-contraception-urgence', consulted_on: C, published: '2025-12-15' },
  qsLibido: { label: 'QuestionSexualité (Santé publique France) — La contraception fait-elle baisser la libido ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/la-contraception-fait-elle-baisser-la-libido', consulted_on: C },
  spIvg: { label: 'Service-Public.fr — Interruption volontaire de grossesse (IVG)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1551', consulted_on: C },
  ivgEtapes: { label: 'ivg.gouv.fr (ministère de la Santé) — Quelles sont les étapes de l’IVG ?', url: 'https://ivg.gouv.fr/ivg-etape-par-etape', consulted_on: C, published: '2026-01-27' },
  ameliIvg: { label: 'ameli.fr — Deux méthodes d’IVG : IVG médicamenteuse et IVG instrumentale', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/ivg/methodes-ivg-suivi', consulted_on: C },
  qsIvgMed: { label: 'QuestionSexualité (Santé publique France) — L’IVG médicamenteuse : comment ça marche ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/l-interruption-volontaire-de-grossesse/comment-se-passe-une-ivg-medicamenteuse', consulted_on: C },
  qsIvgInstr: { label: 'QuestionSexualité (Santé publique France) — Comment se passe une IVG instrumentale', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/l-interruption-volontaire-de-grossesse/comment-se-passe-une-ivg-instrumentale', consulted_on: C },
  qsIvgEffets: { label: 'QuestionSexualité (Santé publique France) — Connaître les effets secondaires après une IVG', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/l-interruption-volontaire-de-grossesse/ivg-quels-sont-les-effets-indesirables', consulted_on: C },
  qsIvgContraception: { label: 'QuestionSexualité (Santé publique France) — Choisir sa contraception après une IVG', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/l-interruption-volontaire-de-grossesse/quelle-contraception-choisir-apres-une-ivg', consulted_on: C },
  qsIvgParler: { label: 'QuestionSexualité (Santé publique France) — À qui parler de son IVG ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/l-interruption-volontaire-de-grossesse/parler-de-l-ivg', consulted_on: C },
  ameliCuReflexes: { label: 'ameli.fr — Les bons réflexes après une contraception d’urgence', url: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/bons-reflexes-contraception-urgence', consulted_on: C },
  qsCu: { label: 'QuestionSexualité (Santé publique France) — Comprendre la contraception d’urgence', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/la-contraception-d-urgence/contraception-d-urgence-comment-ca-marche', consulted_on: C },
  qsMasculine: { label: 'QuestionSexualité (Santé publique France) — La contraception masculine', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/contraception-masculine-comment-ca-marche', consulted_on: C },
  qsPremiers: { label: 'QuestionSexualité (Santé publique France) — Contraception lors des premiers rapports sexuels', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/premiers-rapports-sexuels-quelle-contraception', consulted_on: C },
  qsFaq: { label: 'QuestionSexualité (Santé publique France) — Foire aux questions sur la sexualité', url: 'https://www.questionsexualite.fr/foire-aux-questions', consulted_on: C },
  ameliPerimeno: { label: 'ameli.fr — Périménopause (préménopause) : symptômes et contraception', url: 'https://www.ameli.fr/assure/sante/themes/menopause/perimenopause-premenopause-symptomes-et-contraception', consulted_on: C, published: '2026-04-09' },
  ameliSterilet: { label: 'ameli.fr — La contraception par stérilet ou dispositif intra-utérin (DIU)', url: 'https://www.ameli.fr/assure/sante/themes/contraception/contraception-sterilet', consulted_on: C },
  ansmDiu: { label: 'ANSM — Dossier thématique : dispositif intra-utérin (stérilet)', url: 'https://ansm.sante.fr/dossiers-thematiques/dispositif-intra-uterin-sterilet', consulted_on: C },
  ameliAdo: { label: 'ameli.fr — L’entrée dans la vie sexuelle et la contraception à l’adolescence', url: 'https://www.ameli.fr/assure/sante/themes/puberte/entree-vie-sexuelle-contraception-adolescence', consulted_on: C, published: '2021-01-03' },
  ameliNaturelles: { label: 'ameli.fr — Les méthodes naturelles de contraception', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-naturelles-contraception', consulted_on: C, published: '2018-05-30' },
  qsNaturelles: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que la contraception naturelle ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/que-sont-les-methodes-naturelles', consulted_on: C },
  qsTableau: { label: 'QuestionSexualité (Santé publique France) — Tous les moyens de contraception dans un tableau comparatif', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/tableau-comparatif-pour-vous-guider-dans-votre-choix-de-contraception', consulted_on: C },
  qsChanger: { label: 'QuestionSexualité (Santé publique France) — Comment changer de contraception ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/comment-changer-de-contraception', consulted_on: C },
  santeRegles: { label: 'Santé.fr — L’impact de la contraception sur les règles', url: 'https://www.sante.fr/limpact-de-la-contraception-sur-les-regles', consulted_on: C, published: '2024-02-23' },
} satisfies Record<string, ArticleSource>;

const A: Pick<LibArticle, 'journeys' | 'status' | 'category'> = { journeys: ['avoid'], status: 'to_review', category: 'contraception' };
const AT: Pick<LibArticle, 'journeys' | 'status' | 'category'> = { journeys: ['avoid', 'ttc'], status: 'to_review', category: 'contraception' };
const AC: Pick<LibArticle, 'journeys' | 'status' | 'category'> = { journeys: ['avoid', 'child'], status: 'to_review', category: 'contraception' };

const FIN = 'Cet article t’informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (médecin, sage-femme, pharmacien).';

export const GUIDE_B34: LibArticle[] = [
  {
    ...A, slug: 'choisir-sa-contraception-criteres-questions',
    title: 'Choisir sa contraception : les critères qui comptent vraiment et les questions à te poser',
    summary: 'Santé, mode de vie, envie ou non d’hormones, projet d’enfant : les repères pour préparer ton choix de contraception avec un médecin ou une sage-femme.',
    tags: ['choisir sa contraception', 'quelle contraception', 'contraception sans hormones', 'méthode contraceptive', 'efficacité pratique', 'consultation contraception', 'questionnaire contraception'],
    sources: [S.santeChoisir, S.ameliChoisir],
    body_md: `## En bref
- Il n’existe pas de « meilleure » contraception dans l’absolu : la bonne, c’est **celle qui te convient et que tu utiliseras correctement** au quotidien.
- Le choix se fait **avec un médecin ou une sage-femme**, en tenant compte de ta santé, de ton mode de vie, de ton âge et de ton éventuel projet d’enfant.
- Il existe des méthodes **avec ou sans hormones**, de courte ou de longue durée.
- Seuls les **préservatifs** protègent des infections sexuellement transmissibles (IST) ; ils peuvent s’ajouter à une autre méthode.
- Un questionnaire de Santé publique France sur QuestionSexualité t’aide à préparer la consultation.

## Comprendre
**Efficacité théorique et efficacité pratique.** Chaque méthode a une efficacité « parfaite », mesurée quand elle est utilisée exactement comme prévu, et une efficacité « pratique », qui tient compte de la vraie vie : oublis, décalages, préservatif mis trop tard… L’Assurance Maladie rappelle que l’efficacité pratique se rapproche de l’efficacité théorique seulement si la méthode est adaptée à la personne. Une méthode peu contraignante pour toi limite le risque de grossesse non prévue.

**Les grandes familles.** Santé publique France présente : implant, DIU (stérilet) au cuivre ou hormonal, pilule, contraceptif injectable, anneau vaginal, patch, préservatifs externe et interne, diaphragme, cape cervicale, spermicides, retrait, abstinence périodique et contraception définitive (stérilisation). Certaines contiennent des hormones, d’autres non.

**Ce que le professionnel prend en compte.** Ton état de santé et tes antécédents personnels et familiaux (hypertension, cholestérol, diabète, troubles de la coagulation, migraine, IST), le tabac, les méthodes déjà essayées, les effets que tu souhaites éviter, ton âge, tes pratiques sexuelles et ton désir d’enfant ou non, à court ou à long terme.

## Au quotidien
Avant la consultation, prends quelques minutes pour réfléchir à ces questions (il n’y a pas de bonne ou de mauvaise réponse) :
- **Quelle méthode me paraît la moins contraignante ?** Une prise chaque jour, un geste chaque semaine ou chaque mois, ou une méthode posée pour plusieurs années ?
- **Vais-je l’utiliser correctement ?** Si tes horaires sont décalés ou que tu voyages souvent, une prise quotidienne à heure fixe peut être plus difficile.
- **Avec ou sans hormones ?** Note ce qui compte pour toi et pourquoi.
- **Ai-je des contre-indications à signaler ?** Migraine, tabac, antécédent de phlébite dans la famille, traitement en cours…
- **Comment associer mon ou ma partenaire ?** La contraception concerne les deux personnes, et l’Assurance Maladie encourage à impliquer le partenaire.

Le questionnaire de QuestionSexualité classe en quelques minutes les méthodes en « les plus adaptées », « possibles » et « contre-indications probables ». Tu peux enregistrer le résultat et le montrer au professionnel : c’est un point de départ pour la discussion, pas une prescription.

Garde en tête qu’un choix n’est jamais définitif : si la méthode ne te convient pas (effets gênants, contraintes), tu peux en changer avec l’aide du professionnel qui te suit, en organisant le relais pour ne pas rester sans protection.

## Questions fréquentes
**Je ne sais pas du tout quoi choisir : est-ce un problème ?**
Pas du tout. La consultation de contraception sert justement à échanger et à poser toutes tes questions. La décision se prend ensemble.

**Une méthode sans hormones est-elle forcément moins efficace ?**
Non. Le DIU au cuivre, par exemple, fait partie des méthodes sans hormones. Ce qui change surtout l’efficacité, c’est la facilité d’utilisation au quotidien.

**Ma contraception me protège-t-elle des IST ?**
Seuls les préservatifs externe et interne protègent des IST. Avec un nouveau partenaire, tu peux les associer à ta contraception habituelle.

**Et si je veux un enfant dans un an ou deux ?**
Dis-le au professionnel : cela fait partie des critères de choix, et il pourra t’expliquer comment se passe l’arrêt de chaque méthode.

## Quand demander conseil
Prends rendez-vous avec un médecin ou une sage-femme pour toute première contraception, si ta méthode actuelle te gêne ou si ta santé a changé (nouvelle maladie, nouveau traitement, grossesse récente). Tu peux aussi appeler le numéro vert national « IVG, contraception, sexualités » au **0800 08 11 11**, anonyme et gratuit. En cas de rapport non protégé, pense à la contraception d’urgence sans attendre. En cas de détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...A, slug: 'consultation-contraception-deroulement-examens',
    title: 'La consultation de contraception : comment elle se passe, quelles questions, quels examens',
    summary: 'Entretien, examen, prise de sang avant une contraception hormonale, suivi : ce qui t’attend lors d’un rendez-vous pour ta contraception, et ce qui n’est pas obligatoire.',
    tags: ['consultation contraception', 'premier rendez-vous contraception', 'examen gynécologique', 'prise de sang pilule', 'bilan sanguin contraception', 'sage-femme', 'médecin généraliste'],
    sources: [S.ameliChoisir, S.santeQuiOu],
    body_md: `## En bref
- Un **médecin** (généraliste ou gynécologue) ou une **sage-femme** peut te prescrire ta contraception, en cabinet, dans un centre de santé sexuelle ou dans un service de santé étudiante.
- La consultation commence par un **entretien** sur ta santé, tes antécédents et tes habitudes de vie.
- L’**examen gynécologique n’est pas obligatoire** : il nécessite ton consentement, et tu peux demander des explications sur chaque geste.
- Avant une contraception hormonale, une **prise de sang** est prescrite (au minimum cholestérol, triglycérides et glycémie).
- La consultation est **confidentielle**, y compris pour les mineures.

## Comprendre
**L’entretien.** Le professionnel te pose des questions pour choisir avec toi une méthode adaptée : âge des premières règles, maladies passées, antécédents dans ta famille (hypertension, cholestérol, diabète, phlébite ou embolie, troubles de la coagulation), migraine, IST, vaccinations, tabac, traitements en cours, pratiques sexuelles. Il ne s’agit pas de te juger : ces informations servent à repérer d’éventuelles contre-indications.

**Les explications.** Il te présente les méthodes possibles, leurs avantages, leurs inconvénients et leur efficacité, la prévention des IST et, si tu fumes, les aides pour arrêter.

**L’examen.** Selon Fil santé jeunes, un examen général peut être réalisé (poids, taille, tension, palpation des seins). Si tu viens seulement pour des renseignements ou une pilule, il peut s’arrêter là. Un examen gynécologique est généralement proposé ; l’Assurance Maladie précise qu’il **n’est pas obligatoire** et nécessite ton accord. Le frottis de dépistage du cancer du col de l’utérus est proposé à partir de 25 ans.

**Les examens biologiques.** Pour une contraception hormonale, un bilan sanguin est prescrit (cholestérol, triglycérides, glycémie au minimum). Des examens de la coagulation sont ajoutés en cas de facteur de risque, par exemple un antécédent de phlébite.

## Au quotidien
Pour te sentir à l’aise le jour J :
- **Note tes questions** sur ton téléphone avant d’y aller : effets possibles, que faire en cas d’oubli, comment arrêter plus tard…
- **Prépare tes infos** : date de tes dernières règles, traitements en cours (y compris ceux pris sans ordonnance ou à base de plantes), antécédents familiaux que tu connais.
- **Tu peux venir seule ou accompagnée** de la personne de ton choix. Si tu es mineure, le professionnel peut te recevoir seule et l’entretien reste confidentiel.
- **Tu peux dire stop** à tout moment pendant un examen, ou demander à le reporter.
- **Demande ce qui est prévu ensuite** : date du bilan sanguin, rendez-vous de suivi, durée de l’ordonnance.

Le médecin ou la sage-femme fixe ensuite le rythme du suivi. Une contraception peut toujours être changée si elle ne te convient pas.

## Questions fréquentes
**Faut-il forcément aller chez un gynécologue ?**
Non. Un médecin généraliste ou une sage-femme peuvent aussi prescrire et suivre ta contraception. Les centres de santé sexuelle et les services de santé étudiante en proposent également.

**Je n’ai jamais eu de rapport : dois-je avoir un examen gynécologique ?**
L’examen n’est pas obligatoire et demande ton consentement. Parle librement de ce qui te met mal à l’aise.

**Pourquoi une prise de sang avant la pilule ?**
Elle permet de vérifier certains paramètres (cholestérol, triglycérides, glycémie) avant une contraception hormonale et d’adapter le choix si besoin.

**Est-ce que mes parents seront prévenus ?**
Non : la consultation est confidentielle, et le parcours de contraception est sans avance de frais jusqu’à 26 ans.

## Quand demander conseil
Consulte sans attendre une nouvelle échéance si tu ressens un effet gênant avec ta contraception, si un nouveau problème de santé apparaît, ou si tu as un doute sur une grossesse. En cas de douleur brutale et intense dans le ventre avec un retard de règles, de saignement très abondant avec malaise ou de fièvre avec douleurs pelviennes, appelle le **15** ou le **112**. Le **0800 08 11 11** (IVG, contraception, sexualités) répond gratuitement et anonymement.

${FIN}`,
  },
  {
    ...AC, slug: 'contraception-gratuite-confidentielle-mineures-moins-26-ans',
    title: 'Contraception gratuite et confidentielle : ce que prévoit la loi pour les mineures et les moins de 26 ans',
    summary: 'Sans accord des parents, sans avance de frais jusqu’à 26 ans, préservatifs pris en charge sans ordonnance : tes droits pour accéder à la contraception.',
    tags: ['contraception gratuite', 'contraception mineure', 'sans les parents', 'moins de 26 ans', 'préservatifs gratuits', 'centre de santé sexuelle', 'confidentialité', 'remboursement contraception'],
    min_age_months: 144,
    sources: [S.spContraception, S.ameliChoisir, S.santeQuiOu],
    body_md: `## En bref
- Une mineure **n’a pas besoin de l’accord de ses parents** pour obtenir une prescription, la délivrance ou la pose d’un contraceptif.
- Jusqu’à **26 ans**, le parcours de contraception se fait **sans avance de frais** : consultations, certains examens de sang, pose et retrait, contraceptifs remboursables.
- Les **préservatifs** des marques listées par l’Assurance Maladie sont pris en charge à 100 % **sans ordonnance** en pharmacie avant 26 ans, sans âge minimum.
- Les **centres de santé sexuelle** délivrent gratuitement certains contraceptifs aux mineures qui souhaitent garder le secret.
- Une ligne anonyme et gratuite répond à tes questions : **0800 08 11 11**.

## Comprendre
**La confidentialité.** Selon Service-Public.fr, le consentement des parents n’est pas exigé pour la prescription, la délivrance ou l’administration d’un contraceptif à une mineure. Le médecin ou la sage-femme peut te recevoir seule et l’entretien reste confidentiel. Tu peux aussi aller dans un centre de santé sexuelle sans que tes parents le sachent.

**Ce qui est pris en charge à 100 % avant 26 ans** (et à 65 % ensuite) : DIU, implant, diaphragme, progestatifs injectables et certaines pilules. Les préservatifs listés sont à 100 % sans ordonnance avant 26 ans (60 % sur ordonnance après). La contraception définitive est prise en charge à 80 % quel que soit l’âge. Le patch, l’anneau vaginal, la cape cervicale et les spermicides ne sont pas remboursés.

**Sans avance de frais jusqu’à 26 ans**, d’après Service-Public.fr :
- les consultations de suivi chez un médecin ou une sage-femme la première année d’accès à la contraception, puis une consultation annuelle ;
- certains examens de sang (glycémie à jeun, cholestérol total, triglycérides), une fois par an ;
- les actes de pose, de changement ou de retrait d’un contraceptif ;
- les contraceptifs remboursables délivrés en pharmacie sur ordonnance.

Fil santé jeunes rappelle aussi que la consultation contraception-prévention est gratuite avant 26 ans et que, dans un centre de santé sexuelle, tu n’as rien à avancer.

## Au quotidien
- **En pharmacie**, demande les préservatifs pris en charge : une boîte par délivrance (de 6 à 24 préservatifs selon la boîte).
- **Préservatifs gratuits** : les centres de santé sexuelle et les CeGIDD (centres gratuits d’information, de dépistage et de diagnostic des IST) en distribuent aussi.
- **Si tu ne veux pas utiliser la carte Vitale de tes parents**, le centre de santé sexuelle est une bonne porte d’entrée : il peut te délivrer certains contraceptifs gratuitement et en toute discrétion.
- **L’infirmière scolaire** peut renouveler une ordonnance de pilule de moins d’un an et délivrer la contraception d’urgence.
- **Ta complémentaire santé (mutuelle)** peut rembourser certains frais non pris en charge, selon ton contrat.

## Questions fréquentes
**À partir de quel âge puis-je avoir une contraception ?**
Les textes ne fixent pas d’âge minimum pour la contraception, et les préservatifs remboursés sont accessibles sans âge minimum. Le professionnel t’aide à choisir une méthode adaptée.

**Le pharmacien peut-il refuser de me donner des préservatifs parce que je suis mineure ?**
La prise en charge des préservatifs listés se fait sans ordonnance et sans âge minimum avant 26 ans.

**Un garçon peut-il aussi en profiter ?**
Oui : les préservatifs externes pris en charge et les consultations de santé sexuelle concernent aussi les garçons et les jeunes hommes.

**Et après 26 ans ?**
La prise en charge passe à 65 % pour les contraceptifs remboursables ; la mutuelle peut compléter.

## Quand demander conseil
Après un rapport non protégé ou un accident de préservatif, pense à la contraception d’urgence le plus vite possible (gratuite en pharmacie, sans ordonnance). Pour toute question, appelle le **0800 08 11 11** ou rends-toi dans un centre de santé sexuelle. Si tu subis des pressions ou des violences, ou si un enfant ou un ado est en danger, le **119** est joignable jour et nuit ; en cas d’urgence, le **17** ou le **112**.

${FIN}`,
  },
  {
    ...A, slug: 'renouveler-contraception-ordonnance-pharmacien-infirmier',
    title: 'Renouveler sa contraception : ordonnance, pharmacien, infirmier, et que faire si elle arrive à terme',
    summary: 'Durée d’une ordonnance de pilule, prolongation par un infirmier ou un pharmacien, rendez-vous de suivi : les règles pour ne jamais te retrouver sans contraception.',
    tags: ['renouvellement pilule', 'ordonnance périmée', 'ordonnance contraception', 'pharmacien pilule', 'infirmier contraception', 'fin de plaquette', 'suivi contraception'],
    sources: [S.ameliChoisir, S.spContraception, S.santeQuiOu],
    body_md: `## En bref
- Une pilule peut être **prescrite pour 12 mois** et le pharmacien la délivre **par périodes de 3 mois**.
- Un **infirmier** peut renouveler une prescription de pilule datant de moins d’un an, pour **6 mois au maximum**, sans nouveau renouvellement ensuite.
- Un **pharmacien** peut faire des délivrances supplémentaires dans les mêmes conditions de durée.
- Après cette prolongation, une **nouvelle prescription** par un médecin ou une sage-femme est nécessaire.
- Anticipe : prends rendez-vous **avant** la dernière plaquette.

## Comprendre
**Pourquoi l’ordonnance a une durée limitée.** La contraception hormonale demande un suivi régulier : vérifier la tension, refaire si besoin le bilan sanguin, faire le point sur les effets ressentis, ta santé, le tabac, tes nouveaux traitements. C’est le médecin ou la sage-femme qui fixe le rythme des consultations de suivi.

**Les relais possibles.** D’après l’Assurance Maladie et Service-Public.fr :
- l’**infirmier** peut renouveler certaines prescriptions de contraceptifs oraux de moins d’un an, pour 6 mois au maximum, non renouvelables ;
- le **pharmacien** peut assurer des délivrances supplémentaires, dans les mêmes conditions de durée ;
- l’**infirmière scolaire** peut renouveler une ordonnance de pilule de moins d’un an et délivrer la contraception d’urgence ;
- la **conseillère conjugale et familiale** peut, selon Fil santé jeunes, dépanner d’une plaquette de pilule et délivrer la pilule du lendemain.

**Pour les méthodes de longue durée** (implant, DIU), il n’y a pas de renouvellement mensuel, mais une date de retrait ou de changement à respecter, et un suivi à prévoir avec le professionnel.

## Au quotidien
- **Note la date de fin de ton ordonnance** dans ton calendrier, avec un rappel un mois avant.
- **Compte tes plaquettes** : quand il t’en reste une, c’est le moment de prendre rendez-vous.
- **Garde une photo de ton ordonnance** : en cas de perte, cela aide le professionnel ou le pharmacien à identifier ta pilule exacte.
- **En voyage**, emporte assez de plaquettes pour toute la durée, plus une de réserve, dans ton bagage à main.
- **Si tu changes de pilule** lors du renouvellement, demande comment faire la transition pour rester protégée.
- **Garde une contraception d’urgence** chez toi en cas d’oubli ou de rupture de stock.

## Questions fréquentes
**Mon ordonnance est expirée et il me reste deux jours de pilule : que faire ?**
Va voir ton pharmacien avec ta dernière ordonnance : si elle date de moins d’un an, une délivrance supplémentaire est possible dans les conditions prévues. Sinon, un infirmier peut aussi renouveler une prescription de moins d’un an. Prends rendez-vous rapidement pour une nouvelle prescription.

**Puis-je arrêter ma pilule quelques jours, le temps d’avoir un rendez-vous ?**
Une interruption non prévue expose à un risque de grossesse. Demande conseil à ton pharmacien et utilise des préservatifs en attendant.

**Le renouvellement par l’infirmier concerne-t-il le patch ou l’anneau ?**
Les sources consultées parlent des contraceptifs oraux (pilules). Pour les autres méthodes, renseigne-toi auprès du professionnel qui te suit.

**La téléconsultation est-elle possible ?**
Parle-en au professionnel qui te suit : il pourra te dire si un rendez-vous en présentiel est nécessaire, par exemple pour mesurer la tension.

## Quand demander conseil
Consulte si tu as eu un rapport alors que ta contraception était interrompue (contraception d’urgence le plus vite possible), si tu ressens un effet gênant ou si ta santé a changé depuis la dernière prescription. Appelle le **15** ou le **112** en cas de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine ou de trouble soudain de la parole ou de la vue.

${FIN}`,
  },
  {
    ...A, slug: 'pilule-vomissements-diarrhee-que-faire',
    title: 'Vomissements, diarrhée, gastro : ta pilule est-elle toujours efficace ?',
    summary: 'Pourquoi des vomissements ou une diarrhée peuvent faire baisser l’efficacité de la pilule, ce que disent les sources officielles et quand penser à la contraception d’urgence.',
    tags: ['pilule vomissement', 'gastro pilule', 'diarrhée pilule', 'pilule efficacité', 'vomir après la pilule', 'malade pilule', 'intoxication alimentaire'],
    sources: [S.ameliHormonale, S.ansmPilule, S.qsPilule],
    body_md: `## En bref
- La pilule agit en étant **absorbée par l’intestin**. Si tu vomis ou as une diarrhée importante peu après la prise, les hormones peuvent ne pas avoir été absorbées.
- L’ANSM rappelle que l’efficacité de la pilule **diminue fortement** en cas d’oubli, de vomissements ou de diarrhée.
- Pour la pilule combinée, l’Assurance Maladie indique de **reprendre un autre comprimé** (de la même couleur, donc d’une autre plaquette) si tu as vomi ou eu une diarrhée dans les quatre heures suivant la prise, puis de continuer normalement le lendemain.
- Si les troubles durent plusieurs jours, la situation se rapproche d’un **oubli** : demande conseil à ton pharmacien.
- Le patch, l’anneau, l’implant et les DIU ne passent pas par l’intestin.

## Comprendre
**Pourquoi la gastro compte.** Un comprimé avalé doit séjourner assez longtemps dans le tube digestif pour que les hormones passent dans le sang. Des vomissements juste après la prise, ou une diarrhée abondante, peuvent l’en empêcher. Le comprimé est alors considéré comme « non pris ».

**Ce que disent les sources.**
- L’**Assurance Maladie**, pour la pilule combinée : en cas de vomissements ou de diarrhée dans les quatre heures après la prise, prendre un autre comprimé de même couleur (un comprimé actif), puis reprendre la plaquette le lendemain à l’heure habituelle. Elle conseille aussi, en cas de nausées, de prendre la pilule au cours d’un repas.
- L’**ANSM** souligne la baisse d’efficacité en cas de vomissements ou de diarrhées, sans détailler de règle unique : la **notice de ta pilule** fait foi.
- **QuestionSexualité** rappelle que des vomissements ou une diarrhée peuvent éliminer la pilule et compromettre son efficacité.

**Et la pilule progestative ?** Les délais d’oubli sont plus courts pour certaines pilules progestatives (3 heures pour celles au lévonorgestrel). Si tu en prends une, relis la notice ou demande conseil au pharmacien dès que tu es malade.

## Au quotidien
- **Garde une plaquette de réserve** : prendre un comprimé de remplacement décale ta plaquette, et il te faudra un comprimé en plus.
- **Note l’heure de la prise et l’heure des vomissements** : c’est ce que le pharmacien te demandera.
- **Si tu as des nausées le matin**, parles-en au professionnel qui te suit : décaler la prise au repas peut aider (tout changement d’heure se fait selon les règles de ta pilule).
- **Pendant une gastro qui dure**, utilise des préservatifs jusqu’à ce que tu aies l’avis du pharmacien.
- **Si tu as eu un rapport** dans les jours précédents et un doute sur la protection, pense à la contraception d’urgence, gratuite et sans ordonnance en pharmacie.
- **Pour te réhydrater**, bois souvent par petites gorgées ; le pharmacien peut te conseiller une solution de réhydratation.

## Questions fréquentes
**J’ai vomi six heures après ma pilule : dois-je en reprendre une ?**
D’après la règle donnée par l’Assurance Maladie pour la pilule combinée, la reprise concerne les troubles survenant dans les quatre heures suivant la prise. Au-delà, demande au pharmacien si ta pilule a une consigne différente.

**La diarrhée d’un seul épisode compte-t-elle ?**
Ce sont surtout les diarrhées importantes qui posent problème. En cas de doute, considère la situation comme un oubli et demande conseil.

**Je prends un médicament contre la diarrhée : est-ce un problème ?**
Signale toujours au pharmacien que tu prends une pilule quand tu achètes un médicament, même sans ordonnance.

**Mon anneau ou mon patch sont-ils concernés ?**
Non, ils ne passent pas par l’intestin. Leurs propres règles (décollement, expulsion) s’appliquent.

## Quand demander conseil
Demande l’avis d’un pharmacien ou d’un médecin si les vomissements ou la diarrhée durent plus d’une journée, si tu n’as pas tes règles à la fin de la plaquette suivante, ou si tu as un doute sur une grossesse (l’Assurance Maladie indique qu’un test peut être fait 21 jours après un oubli). Appelle le **15** ou le **112** si tu ne peux plus boire, si tu as du sang dans les selles ou les vomissements, une forte fièvre ou un malaise.

${FIN}`,
  },
  {
    ...A, slug: 'contraception-medicaments-interactions-pharmacien',
    title: 'Contraception et autres médicaments : les interactions à connaître et le bon réflexe en pharmacie',
    summary: 'Certains traitements et le millepertuis peuvent rendre une contraception hormonale moins efficace : pourquoi signaler ta contraception à chaque nouvelle prescription.',
    tags: ['interaction pilule', 'médicaments pilule', 'millepertuis', 'antibiotique pilule', 'épilepsie contraception', 'VIH contraception', 'tuberculose', 'pharmacien', 'notice'],
    sources: [S.ansmPilule, S.ameliCu, S.qsPilule],
    body_md: `## En bref
- Certains médicaments **diminuent l’efficacité** des contraceptifs hormonaux, en particulier de la pilule.
- L’Assurance Maladie cite des traitements de l’**épilepsie**, de la **tuberculose** et du **VIH**, ainsi que le **millepertuis** (plante), parmi ceux qui peuvent réduire l’efficacité de la pilule d’urgence.
- L’ANSM précise que les pilules progestatives sont **contre-indiquées** avec le millepertuis.
- Le bon réflexe : **signale ta contraception** à chaque consultation et à chaque achat en pharmacie, même pour un produit « naturel ».
- Le **DIU au cuivre** n’est pas concerné par ces interactions hormonales.

## Comprendre
**Pourquoi un médicament peut gêner une contraception.** Certaines substances accélèrent l’élimination des hormones par le foie : la quantité d’hormones dans le sang devient alors insuffisante pour bloquer l’ovulation. D’autres situations (vomissements, diarrhée) empêchent l’absorption du comprimé. L’ANSM résume que l’efficacité de la pilule « diminue fortement » en cas d’oubli, de vomissements, de diarrhées ou lorsqu’elle est prise avec d’autres médicaments.

**Ce que citent les sources officielles.**
- **Millepertuis** : cette plante, parfois utilisée contre le moral en baisse, est contre-indiquée avec les pilules progestatives selon l’ANSM, et peut réduire l’efficacité de la pilule d’urgence selon l’Assurance Maladie.
- **Traitements de l’épilepsie, de la tuberculose et du VIH** : certains peuvent réduire l’efficacité de la contraception d’urgence hormonale (Assurance Maladie). Dans ces situations, le DIU au cuivre est une option à discuter.
- **Les autres médicaments** : la liste complète figure dans la **notice** de ta contraception, rubrique « Autres médicaments ». QuestionSexualité mentionne aussi l’existence d’interactions sans toutes les nommer.

**L’inverse existe aussi.** Une contraception hormonale peut parfois modifier l’effet d’un autre traitement. C’est pourquoi le médecin ou le pharmacien a besoin de la liste complète de ce que tu prends.

## Au quotidien
- **Garde à jour une liste** de tes traitements (y compris compléments alimentaires, plantes, tisanes « actives », huiles essentielles) dans ton téléphone.
- **À chaque nouvelle ordonnance**, dis : « Je prends une contraception hormonale, est-ce compatible ? »
- **En pharmacie**, même pour un produit sans ordonnance, pose la même question.
- **Si une interaction existe**, demande combien de temps utiliser des préservatifs en plus, et pendant combien de temps après l’arrêt du traitement.
- **Pour un traitement long**, discute d’une méthode qui n’est pas concernée (par exemple le DIU au cuivre) avec ton médecin ou ta sage-femme.
- **Après un rapport** pendant une période où ta contraception était peut-être moins efficace, pense à la contraception d’urgence et précise au pharmacien les traitements en cours.

## Questions fréquentes
**Les antibiotiques annulent-ils l’effet de la pilule ?**
Les sources consultées ne donnent pas de règle générale sur les antibiotiques. Demande au médecin ou au pharmacien pour ton traitement précis, et lis la notice.

**Le millepertuis en tisane, c’est pareil ?**
L’ANSM parle du millepertuis et des médicaments à base de millepertuis. Par prudence, signale toute préparation qui en contient.

**Mon implant ou mon DIU hormonal sont-ils concernés ?**
Ce sont aussi des contraceptions hormonales : vérifie avec le professionnel qui te suit si ton nouveau traitement est compatible.

**Je prends un traitement depuis longtemps : est-il trop tard pour en parler ?**
Non. Parles-en dès maintenant, et utilise des préservatifs en attendant la réponse.

## Quand demander conseil
Consulte ou appelle ton pharmacien avant de commencer un nouveau traitement, ou dès que tu réalises qu’il peut interagir avec ta contraception. Après un rapport non protégé, la contraception d’urgence est à prendre le plus vite possible. Si tu prends du millepertuis parce que ton moral est bas, parles-en aussi à ton médecin ; en cas de détresse ou d’idées noires, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...A, slug: 'prendre-sa-pilule-heure-voyage-decalage-horaire',
    title: 'Prendre sa pilule au quotidien : heure fixe, changement d’horaire, voyage et décalage horaire',
    summary: 'Comment choisir ton heure de prise, la changer en restant protégée, et gérer un voyage avec décalage horaire selon les règles de l’Assurance Maladie.',
    tags: ['heure pilule', 'changer heure pilule', 'décalage horaire pilule', 'voyage pilule', 'rappel pilule', 'application pilule', 'plaquette', 'retard de pilule'],
    sources: [S.ameliHormonale, S.qsPilule, S.ansmPilule],
    body_md: `## En bref
- La pilule se prend **tous les jours à heure régulière**.
- Le décalage toléré est de **12 heures** pour la pilule combinée, et de **3 heures** pour certaines pilules progestatives (12 heures pour celles au désogestrel).
- Pour **changer d’heure**, fais-le en début de plaquette, en **avançant** l’heure de prise.
- En **voyage avec décalage horaire**, l’Assurance Maladie conseille de garder l’heure française, ou d’avancer la prise, sans dépasser le délai toléré.
- Un **rappel** (alarme, application) aide beaucoup.

## Comprendre
**Pourquoi l’heure compte.** La pilule maintient un niveau d’hormones suffisant pour empêcher la grossesse. Si l’écart entre deux prises dépasse la marge de ta pilule, la protection peut ne plus être assurée. Les marges diffèrent :
- **pilule combinée** (œstrogène + progestatif) : 12 heures ;
- **pilule progestative au lévonorgestrel** : 3 heures ;
- **pilule progestative au désogestrel** : 12 heures.

Ta notice indique la marge exacte de ta pilule : c’est elle qui fait foi.

**Changer d’heure de prise.** L’Assurance Maladie conseille de le faire en début de plaquette, en avançant l’heure, sans décalage supérieur à 12 heures (pilules œstroprogestatives) ou 3 heures (pilules progestatives concernées). Avancer, c’est raccourcir un intervalle, ce qui ne fait pas baisser la protection.

**Voyager.** Avec un décalage horaire, deux options selon l’Assurance Maladie : continuer à prendre la pilule à l’heure française, ou avancer l’heure de prise. L’important est de ne jamais retarder la prise au-delà de la marge de ta pilule.

## Au quotidien
- **Choisis un moment stable** de ta journée, y compris le week-end : réveil, brossage des dents, repas du soir.
- **Mets une alarme récurrente** et range la plaquette là où tu fais ce geste.
- **Exemple de voyage vers l’ouest** (tu « gagnes » des heures) : si tu prends ta pilule à 8 h en France et pars à New York, garder l’heure française revient à la prendre à 2 h du matin sur place. Tu peux plutôt la prendre plus tôt, la veille au soir sur place, ce qui avance la prise.
- **Vers l’est** (tu « perds » des heures), la prise arrive naturellement plus tôt ; garde le même repère.
- **Emporte tes plaquettes en bagage à main**, avec une de réserve et l’ordonnance.
- **Ta trousse de voyage** : préservatifs et contraception d’urgence peuvent être utiles, notamment si les pharmacies sont difficiles d’accès sur place.

## Questions fréquentes
**Je me suis trompée de jour sur la plaquette : est-ce grave ?**
Si tu as bien pris un comprimé actif chaque jour, l’essentiel est respecté. Pour une pilule avec des comprimés de couleurs différentes, demande conseil au pharmacien pour ne pas te tromper de phase.

**Puis-je prendre ma pilule à des heures différentes en semaine et le week-end ?**
Seulement si l’écart reste dans la marge de ta pilule. Le plus simple est de garder la même heure tous les jours.

**Que faire si j’ai dépassé la marge ?**
C’est un oubli : suis la conduite prévue par ta notice et demande conseil au pharmacien. En cas de rapport récent, pense à la contraception d’urgence.

**Une application de suivi peut-elle remplacer l’alarme ?**
Oui, si elle t’envoie un rappel fiable. L’ANSM cite le réveil ou une application comme aides utiles.

## Quand demander conseil
Demande conseil à ton pharmacien après tout dépassement de la marge, avant un long voyage si tu as un doute, ou si les oublis deviennent fréquents : d’autres méthodes sans prise quotidienne existent. Consulte en cas de saignements entre les règles qui persistent. Appelle le **15** ou le **112** devant une douleur ou un gonflement d’un mollet, un essoufflement brutal ou une douleur thoracique, surtout après un long trajet.

${FIN}`,
  },
  {
    ...A, slug: 'effets-indesirables-contraception-hormonale-humeur-libido-saignements',
    title: 'Humeur, libido, saignements, acné : quand ta contraception hormonale ne te convient pas',
    summary: 'Les effets indésirables les plus fréquents de la contraception hormonale, comment en parler et changer de méthode sans rester sans protection.',
    tags: ['effets secondaires pilule', 'pilule humeur', 'pilule libido', 'spotting pilule', 'saignements contraception', 'acné pilule', 'dépression pilule', 'pharmacovigilance', 'changer de pilule'],
    sources: [S.ansmPilule, S.qsLibido, S.santeRegles],
    body_md: `## En bref
- La contraception hormonale peut entraîner des effets indésirables. Selon l’ANSM, les plus fréquents avec la pilule sont les **saignements irréguliers**, la prise de poids, des **troubles de l’humeur** voire une dépression, des maux de tête, une **baisse de la libido**, de l’acné, une chute de cheveux, une pilosité excessive, des kystes ovariens et des douleurs des seins.
- Les **saignements entre les règles** sont fréquents au début, mais ne doivent pas durer.
- Chaque personne réagit différemment : une autre pilule ou une **autre méthode**, avec ou sans hormones, peut mieux te convenir.
- Tu n’as pas à subir un effet qui te gêne : **parles-en** à ton médecin ou à ta sage-femme.
- Tu peux aussi **déclarer un effet indésirable** sur le portail de l’ANSM.

## Comprendre
**Saignements.** D’après Santé.fr, les saignements entre les règles (« spotting ») sont fréquents au début d’une contraception hormonale, le temps que le corps s’habitue. S’ils persistent, le dosage ou la méthode peut ne pas convenir. Avec certaines méthodes progestatives (implant, certaines pilules, DIU hormonal), les règles peuvent devenir irrégulières ou disparaître.

**Libido.** QuestionSexualité explique que les études ne concordent pas : certaines femmes décrivent moins de désir sous contraception hormonale, d’autres davantage, par exemple parce que leurs règles sont moins douloureuses. Une sécheresse vaginale est possible avec les pilules faiblement dosées en œstrogènes ; des lubrifiants peuvent aider. Le patch, l’anneau, l’implant et le DIU hormonal contiennent aussi des hormones et peuvent avoir des effets comparables.

**Humeur.** L’ANSM cite les troubles de l’humeur et la dépression parmi les effets possibles. Un changement de moral après le début d’une contraception mérite d’être signalé, sans attendre la prochaine consultation.

**Rappel important.** Ta contraception n’est pas forcément la cause d’un symptôme. Le professionnel t’aide à faire le point.

## Au quotidien
- **Note ce que tu ressens** pendant deux ou trois mois : date de début de la contraception, saignements, humeur, désir, maux de tête. Le suivi de cycle de l’app peut t’y aider.
- **Prépare la liste de tes contraceptions passées** : l’ANSM conseille de l’établir avec le médecin lors d’un changement de pilule.
- **N’arrête pas brutalement** sans solution de relais : utilise des préservatifs en attendant le rendez-vous, et demande comment passer d’une méthode à l’autre.
- **Explore les options sans hormones** si tu le souhaites : préservatifs, DIU au cuivre, diaphragme ou cape (avec spermicide).
- **Pour la sécheresse vaginale**, un lubrifiant peut aider ; demande conseil au pharmacien.

## Questions fréquentes
**Combien de temps attendre avant de juger une nouvelle pilule ?**
Les saignements du début peuvent s’atténuer en quelques semaines. Mais un effet qui te pèse (humeur, douleurs, maux de tête) justifie d’en parler tout de suite.

**La pilule fait-elle grossir ?**
L’ANSM cite la prise de poids parmi les effets possibles, et QuestionSexualité indique que les pilules progestatives peuvent la favoriser chez certaines femmes. Ce n’est pas systématique : parles-en si tu constates un changement.

**Comment déclarer un effet indésirable ?**
Sur le portail de signalement accessible depuis le site de l’ANSM, toi-même ou avec l’aide d’un professionnel.

**Changer de méthode, c’est compliqué ?**
Non, mais il faut organiser le passage pour rester protégée. Le professionnel te dira quand commencer la nouvelle méthode.

## Quand demander conseil
Consulte si un effet te gêne, si des saignements persistent, en cas de douleur intense ou de maux de tête qui changent. Appelle le **15** ou le **112** devant une douleur ou un gonflement d’un mollet, un essoufflement brutal, une douleur dans la poitrine, une faiblesse d’un côté du corps ou un trouble soudain de la parole ou de la vue. Si ton moral s’effondre ou si tu as des idées noires, appelle le **3114**, jour et nuit.

${FIN}`,
  },
  {
    ...A, slug: 'ivg-droits-delais-demarches-etapes',
    title: 'IVG : tes droits, les délais et les démarches étape par étape',
    summary: 'Jusqu’à quand, auprès de qui, avec quelles consultations, à quel coût : le parcours d’une interruption volontaire de grossesse en France, selon les sources officielles.',
    tags: ['IVG', 'avortement', 'interruption volontaire de grossesse', 'délai IVG', '14 semaines', 'démarches IVG', 'numéro vert IVG', 'IVG gratuite', 'délit d’entrave'],
    sources: [S.spIvg, S.ivgEtapes, S.ameliIvg],
    body_md: `## En bref
- En France, l’IVG est possible **jusqu’à la fin de la 14e semaine de grossesse**, soit 16 semaines après le début des dernières règles.
- Deux méthodes existent : **médicamenteuse** (jusqu’à la fin de la 7e semaine de grossesse, soit 9 semaines après le début des dernières règles) et **instrumentale** (jusqu’à la fin de la 14e semaine).
- Elle est réalisée par un **médecin** ou une **sage-femme**, à l’hôpital, en clinique, en cabinet, en centre de santé ou en centre de santé sexuelle selon la méthode.
- Il n’y a **plus de délai de réflexion obligatoire** entre les consultations.
- L’IVG et les soins associés sont **pris en charge à 100 %**, sans avance de frais. Le **0800 08 11 11** répond gratuitement et anonymement.

## Comprendre
**Un droit personnel.** La décision t’appartient. QuestionSexualité rappelle que l’IVG est un droit exercé individuellement, sans l’accord du partenaire. Il n’y a pas d’âge minimum. Entraver l’accès à l’IVG, y compris par des pressions ou des informations volontairement trompeuses, est un délit puni par la loi.

**Les étapes**, d’après ivg.gouv.fr :
1. **Prendre rendez-vous** avec un médecin ou une sage-femme, en général dans les 5 jours suivant ton appel, en présentiel ou en téléconsultation selon l’offre. Si le professionnel ne pratique pas d’IVG, il doit te le dire et t’orienter vers quelqu’un qui le fait.
2. **Consultation d’information** : explications sur les deux méthodes, les lieux, les risques et effets possibles ; remise d’un guide et d’une attestation de consultation.
3. **Entretien psychosocial** : obligatoire pour les mineures, proposé aux majeures, qui peuvent le refuser.
4. **Consultation de recueil du consentement** : tu donnes ton consentement par écrit, tu choisis la méthode et le lieu. C’est aussi le moment de parler contraception et dépistage des IST. Pour une majeure, information et consentement peuvent se faire lors d’une même consultation.
5. **Réalisation de l’IVG**, avec des antidouleurs systématiquement prescrits.
6. **Consultation de suivi** entre le 14e et le 21e jour, en présentiel ou en téléconsultation, pour vérifier que la grossesse est bien interrompue et parler contraception.

**Les examens.** Datation de la grossesse (examen, échographie ou prise de sang), groupe sanguin (une injection est faite si tu es de Rhésus négatif), et, si tu le souhaites, dépistage des IST et du cancer du col.

## Au quotidien
- **Agis vite si tu hésites** : plus tôt tu prends rendez-vous, plus tu as le choix de la méthode.
- **Calcule tes semaines** à partir du premier jour de tes dernières règles ; le professionnel datera précisément la grossesse.
- **Choisis une personne de confiance** pour t’accompagner, si tu le souhaites.
- **Pour trouver un professionnel**, appelle le 0800 08 11 11 ou utilise le tchat du site ivg-contraception-sexualites.org.
- **Méfie-toi des sites qui se présentent comme neutres** mais cherchent à te dissuader : privilégie ivg.gouv.fr et les services publics.

## Questions fréquentes
**Combien ça coûte ?**
Pour les assurées, l’IVG et les soins associés sont pris en charge à 100 % par l’Assurance Maladie, sans avance de frais ni dépassement d’honoraires, et l’anonymat peut être garanti.

**Dois-je attendre plusieurs jours entre deux rendez-vous ?**
Non : il n’existe plus de délai de réflexion minimal. Si tu es mineure, l’entretien psychosocial doit avoir lieu avant le consentement.

**Mon médecin peut-il refuser ?**
Un professionnel peut ne pas pratiquer d’IVG, mais il doit te le dire et te donner le nom de professionnels qui la réalisent.

**Une IVG empêche-t-elle d’avoir un enfant plus tard ?**
Selon QuestionSexualité, une IVG réalisée dans de bonnes conditions n’affecte pas la fertilité.

## Quand demander conseil
Prends rendez-vous dès que tu envisages une IVG. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le ventre avec un retard de règles (une grossesse extra-utérine est possible), de saignement très abondant avec malaise, ou de fièvre avec douleurs. Si tu subis des pressions ou des violences, appelle le **3919** (violences faites aux femmes) ou, en danger immédiat, le **17** ou le **112**. En cas de grande détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...A, slug: 'ivg-medicamenteuse-deroulement-saignements-douleurs', safety_critical: true,
    title: 'L’IVG médicamenteuse : comment elle se déroule, à quoi t’attendre et quand appeler',
    summary: 'Les deux prises de médicaments, les saignements et les douleurs, l’accompagnement à domicile et la visite de contrôle d’une IVG médicamenteuse.',
    tags: ['IVG médicamenteuse', 'avortement médicamenteux', 'IVG à domicile', 'saignements IVG', 'douleur IVG', 'téléconsultation IVG', 'visite de contrôle IVG'],
    sources: [S.qsIvgMed, S.ivgEtapes, S.ameliIvg],
    body_md: `## En bref
- L’IVG médicamenteuse est possible **jusqu’à la fin de la 7e semaine de grossesse** (9 semaines après le début des dernières règles).
- Elle repose sur **deux médicaments pris à 24 à 48 heures d’intervalle** : le premier interrompt la grossesse, le second déclenche l’expulsion.
- Elle peut se faire **à domicile**, en cabinet, en centre de santé ou à l’hôpital ; la téléconsultation est possible.
- Les **saignements** ressemblent à des règles abondantes, plus importants le jour de la seconde prise, puis diminuent.
- Une **visite de contrôle** entre le 14e et le 21e jour est indispensable : les saignements seuls ne prouvent pas que la grossesse est arrêtée.

## Comprendre
**Les deux étapes.** Selon QuestionSexualité, le premier comprimé (mifépristone) bloque l’hormone qui maintient la grossesse. Le second (misoprostol), pris 24 à 48 heures plus tard, provoque des contractions et l’expulsion. Après une téléconsultation, les médicaments se récupèrent en pharmacie ; le professionnel remet un mémo pratique.

**Le rythme de l’expulsion.** D’après ivg.gouv.fr et QuestionSexualité, elle survient dans les 4 heures suivant la seconde prise dans environ 60 % des cas, et dans les 24 à 72 heures dans les autres cas. L’efficacité est d’environ 95 % ; en cas d’échec, une IVG instrumentale est proposée.

**Les saignements.** Ils peuvent commencer après le premier comprimé, sont très importants le jour du second, puis diminuent. Ils durent souvent une dizaine de jours et peuvent, selon QuestionSexualité, se prolonger jusqu’à 30 jours.

**Les effets possibles.** Des douleurs comparables à des règles, parfois plus fortes (des antidouleurs sont prescrits à l’avance) ; des nausées, vomissements ou diarrhées après le second médicament. Si tu vomis dans les 30 minutes suivant le second médicament, contacte le professionnel qui te suit : une nouvelle prise peut être nécessaire. Si tu es de Rhésus négatif, une injection est prévue.

## Au quotidien
- **Choisis un moment calme** pour la seconde prise, idéalement un jour sans obligation. Un arrêt de travail peut être prescrit.
- **Ne reste pas seule** : une personne de confiance à tes côtés est recommandée.
- **Prépare** des protections hygiéniques épaisses (serviettes plutôt que tampons, sauf avis contraire), une bouillotte, de quoi boire et manger léger, le numéro du lieu qui te suit.
- **Prends les antidouleurs prescrits** comme indiqué, sans attendre que la douleur soit forte.
- **Note la date du rendez-vous de contrôle** et ne le saute pas, même si tout semble terminé.
- **Parle contraception** avant : la fertilité revient immédiatement, et la plupart des méthodes peuvent commencer le jour même.

## Questions fréquentes
**Est-ce douloureux ?**
L’intensité varie d’une personne à l’autre. Les contractions ressemblent à des douleurs de règles, parfois plus fortes ; les antalgiques prescrits aident à les atténuer.

**Comment savoir si l’IVG a fonctionné ?**
Par la visite de contrôle : examen, échographie ou prise de sang. Un test urinaire peut rester positif jusqu’à trois semaines.

**Puis-je la faire si j’habite loin d’un hôpital ?**
Oui, elle peut se faire à domicile, mais il vaut mieux pouvoir rejoindre rapidement un service d’urgence en cas de besoin. Parle de ta situation avec le professionnel.

**Les symptômes de grossesse vont-ils disparaître ?**
Fatigue, nausées et seins sensibles disparaissent en quelques jours. S’ils persistent au-delà de sept jours, consulte.

## Quand demander conseil
Contacte rapidement le professionnel ou le service de gynécologie qui te suit en cas de fièvre au-delà de 38 °C, de saignements très abondants, de très fortes douleurs dans le ventre ou de malaise. Si les saignements sont très importants avec malaise, ou si la fièvre persiste, appelle le **15** ou le **112**. Le **0800 08 11 11** répond à tes questions.

${FIN}`,
  },
  {
    ...A, slug: 'ivg-instrumentale-aspiration-anesthesie-deroulement',
    title: 'L’IVG instrumentale (par aspiration) : anesthésie, déroulement et suites',
    summary: 'Comment se passe une IVG instrumentale, jusqu’à quand, sous quelle anesthésie, combien de temps sur place et ce qu’il faut surveiller ensuite.',
    tags: ['IVG instrumentale', 'IVG chirurgicale', 'aspiration', 'anesthésie IVG', 'IVG 14 semaines', 'ambulatoire', 'IVG hôpital'],
    sources: [S.qsIvgInstr, S.ivgEtapes, S.ameliIvg],
    body_md: `## En bref
- L’IVG instrumentale est possible **jusqu’à la fin de la 14e semaine de grossesse** (16 semaines après le début des dernières règles).
- Elle se fait **en établissement de santé** ou dans certains centres de santé, en **ambulatoire** : tu rentres chez toi le jour même, en général après quelques heures.
- Le geste dure **de 10 à 20 minutes** environ, sous **anesthésie locale** du col ou **anesthésie générale**.
- Son efficacité est d’environ **99,7 %** selon ivg.gouv.fr.
- Une **consultation de suivi** a lieu entre le 14e et le 21e jour.

## Comprendre
**Quand la choisir.** Jusqu’à 7 semaines de grossesse, les deux méthodes sont possibles ; de 7 à 14 semaines, ivg.gouv.fr indique que la méthode instrumentale est privilégiée. Certaines personnes la préfèrent aussi parce que tout se passe en une fois, sur place.

**Le déroulement.** D’après QuestionSexualité, le col de l’utérus est dilaté, puis une fine canule reliée à un dispositif d’aspiration est introduite pour retirer la grossesse. Le geste lui-même dure une dizaine à une vingtaine de minutes selon les sources.

**L’anesthésie.** Locale (au niveau du col) ou générale. Si tu choisis l’anesthésie générale, une consultation préalable avec un médecin anesthésiste est prévue. Tu restes ensuite sous surveillance quelques heures ; l’Assurance Maladie précise que l’hospitalisation dure souvent moins de 12 heures.

**L’accompagnement.** Il est **obligatoire pour les mineures**, par une personne majeure de leur choix, et recommandé pour les majeures, notamment pour le retour à domicile après une anesthésie.

**Les risques.** Les complications sont rares : saignements, infection, et de façon très rare lésion du col ou de l’utérus, ou complication liée à l’anesthésie.

## Au quotidien
- **Organise ton retour** : une personne pour te raccompagner, surtout après une anesthésie générale.
- **Respecte les consignes de jeûne** données si une anesthésie générale est prévue.
- **Parle contraception avant le geste** : selon QuestionSexualité, un DIU (au cuivre ou hormonal) peut être posé le jour de l’IVG instrumentale, et un implant aussi.
- **Les jours suivants**, des saignements sont possibles ; prévois des serviettes.
- **Prends les antidouleurs prescrits** si besoin, et repose-toi.
- **Va à la consultation de suivi**, même si tu te sens bien : elle vérifie l’absence de complication, fait le point sur ta contraception et peut proposer un accompagnement psychosocial.

## Questions fréquentes
**Vais-je sentir quelque chose sous anesthésie locale ?**
Des sensations de contraction ou de gêne sont possibles. Pose toutes tes questions lors de la consultation et indique tes préférences : le choix de l’anesthésie se discute.

**Combien de temps vais-je rester sur place ?**
Quelques heures en général, sur une journée, en ambulatoire.

**Puis-je reprendre le travail le lendemain ?**
Cela dépend de ta récupération et de ton activité. Un arrêt de travail peut être prescrit si besoin.

**Ma fertilité est-elle préservée ?**
Selon QuestionSexualité, une IVG réalisée dans de bonnes conditions n’affecte pas la fertilité, qui reprend immédiatement : d’où l’intérêt de prévoir une contraception.

## Quand demander conseil
Consulte sans tarder si les saignements sont abondants ou persistants, ou s’ils s’accompagnent de fièvre (au-delà de 38 °C), de vomissements ou de fortes douleurs. Appelle le **15** ou le **112** en cas de saignement très abondant avec malaise ou de douleur intense. Le **0800 08 11 11** reste disponible pour toute question.

${FIN}`,
  },
  {
    ...A, slug: 'apres-une-ivg-corps-emotions-contraception', safety_critical: true,
    title: 'Après une IVG : ton corps, tes émotions, ta contraception et la visite de contrôle',
    summary: 'Saignements, symptômes qui disparaissent, retour de la fertilité, contraception à commencer, émotions et soutien : ce qui se passe dans les semaines qui suivent une IVG.',
    tags: ['après IVG', 'saignements après IVG', 'contraception après IVG', 'émotions IVG', 'test positif après IVG', 'fertilité après IVG', 'soutien IVG', 'visite de contrôle'],
    sources: [S.qsIvgEffets, S.qsIvgContraception, S.qsIvgParler],
    body_md: `## En bref
- Les **saignements** peuvent durer de quelques jours à plusieurs semaines (jusqu’à 30 jours après une IVG médicamenteuse).
- La **fertilité revient immédiatement** : la plupart des contraceptions peuvent commencer le jour même de l’IVG.
- Les symptômes de grossesse disparaissent en **quelques jours** ; un test urinaire peut rester positif jusqu’à **trois semaines**.
- Les émotions sont très variables : **soulagement, tristesse**, ou les deux. Tu peux en parler à un professionnel, à un proche ou à une association.
- La **visite de contrôle** entre le 14e et le 21e jour est essentielle.

## Comprendre
**Le corps après l’IVG.** Selon QuestionSexualité, les douleurs ressemblent à des règles plus intenses, surtout après le second médicament d’une IVG médicamenteuse. Les saignements, souvent plus abondants que des règles, peuvent se prolonger. Fatigue, nausées et seins sensibles disparaissent en quelques jours ; s’ils persistent plus de sept jours, une consultation s’impose. Les complications (hémorragie, infection, douleurs persistantes) sont possibles mais rares.

**La fertilité.** Une IVG réalisée dans de bonnes conditions n’affecte pas la fertilité. Une ovulation peut survenir rapidement, avant même le retour des règles : une nouvelle grossesse est donc possible très vite.

**La contraception**, d’après QuestionSexualité :
- **pilule** (combinée ou progestative) : le jour de l’IVG ou le lendemain ;
- **patch** et **anneau** : le jour de l’IVG ;
- **implant** : posé le jour de l’IVG ;
- **DIU** (cuivre ou hormonal) : le jour d’une IVG instrumentale, ou lors de la visite de suivi après une IVG médicamenteuse ;
- **préservatifs** : à tout moment, et en attendant que la méthode choisie soit efficace.

**Les émotions.** Il n’y a pas de « bonne » façon de vivre une IVG. Certaines ressentent surtout du soulagement, d’autres de la tristesse ou un mélange des deux, parfois plus tard. Ces ressentis méritent d’être accueillis sans jugement.

## Au quotidien
- **Repose-toi** les premiers jours et accepte l’aide de tes proches.
- **Utilise des serviettes** tant que les saignements sont abondants, et note leur évolution.
- **Commence ta contraception** comme convenu avec le professionnel, ou utilise des préservatifs en attendant.
- **Va à la visite de contrôle** : elle vérifie que la grossesse est arrêtée et qu’il n’y a pas de complication, et peut te proposer un suivi psychosocial.
- **Mentionne ton IVG** dans tes antécédents auprès de ton médecin, gynécologue ou sage-femme : ils sont tenus au secret médical.
- **Si tu as besoin de parler**, un centre de santé sexuelle, un EVARS (espace vie affective, relationnelle et sexuelle), le Planning familial ou des groupes de parole peuvent t’accompagner.

## Questions fréquentes
**Quand vais-je retrouver mes règles ?**
Les sources consultées ne fixent pas de date précise. Si tu n’as pas de règles plusieurs semaines après l’IVG et que tu n’as pas commencé de contraception hormonale, fais un test (au-delà de trois semaines) et parles-en au professionnel.

**Mon test est encore positif deux semaines après : faut-il s’inquiéter ?**
Un test peut rester positif jusqu’à trois semaines. C’est la visite de contrôle (examen, échographie ou prise de sang) qui confirme l’arrêt de la grossesse.

**Mon ou ma partenaire ne comprend pas ce que je ressens.**
Chacun peut vivre l’IVG différemment. Une consultation psychosociale ou un groupe de parole peut aider, seule ou à deux.

## Quand demander conseil
Contacte rapidement le professionnel qui te suit en cas de fièvre au-delà de 38 °C, de pertes de sang très abondantes, de très fortes douleurs abdominales ou de malaise ; si les saignements sont importants avec malaise, ou si la fièvre persiste, appelle le **15** ou le **112**. Si ton moral reste très bas, si tu n’arrives plus à faire face ou si tu as des idées noires, appelle le **3114**, jour et nuit. Le **0800 08 11 11** est gratuit et anonyme.

${FIN}`,
  },
  {
    ...AC, slug: 'ivg-mineure-accompagnement-confidentialite',
    title: 'IVG quand on est mineure : confidentialité, adulte accompagnant et entretien',
    summary: 'Une mineure peut avoir recours à une IVG sans l’accord de ses parents : le rôle de l’adulte de son choix, l’entretien obligatoire et la prise en charge confidentielle.',
    tags: ['IVG mineure', 'avortement mineure', 'sans les parents', 'adulte accompagnant', 'entretien psychosocial', 'IVG anonyme', 'ado enceinte'],
    min_age_months: 144,
    sources: [S.spIvg, S.qsIvgParler, S.ivgEtapes],
    body_md: `## En bref
- Il n’y a **pas d’âge minimum** pour une IVG.
- Une mineure peut **impliquer ses parents** ou son représentant légal, ou **garder le secret**.
- Si elle garde le secret, elle doit être **accompagnée d’une personne majeure de son choix** à chaque étape.
- L’**entretien psychosocial est obligatoire** pour les mineures, avant le recueil du consentement.
- L’IVG est **prise en charge à 100 %**, sans avance de frais, et l’anonymat peut être garanti.

## Comprendre
**Un droit qui t’appartient.** Selon Service-Public.fr, une mineure peut choisir de demander le consentement d’un parent ou de son représentant légal, ou de garder l’IVG confidentielle. QuestionSexualité précise que tu peux demander l’accord de tes parents sans y être obligée.

**L’adulte accompagnant.** Si tu ne veux pas en parler à tes parents, tu choisis une personne majeure qui t’accompagne dans tes démarches : un membre de ta famille, un ami adulte, un professionnel… Son rôle est de te soutenir, pas de décider à ta place. Pour une IVG instrumentale, cet accompagnement est obligatoire le jour du geste.

**L’entretien psychosocial.** Il est obligatoire pour les mineures et a lieu avant le consentement écrit. C’est un temps d’écoute avec un professionnel pour parler de ta situation, de tes questions, de ce que tu ressens, et pour t’aider si tu as besoin d’un adulte accompagnant. Il n’y a pas de délai minimal à respecter entre cet entretien et l’IVG.

**Les étapes ensuite** sont les mêmes que pour une majeure : consultation d’information, consentement, IVG médicamenteuse ou instrumentale selon le terme, puis consultation de suivi entre le 14e et le 21e jour.

## Au quotidien
- **Appelle le 0800 08 11 11** (gratuit, anonyme) ou utilise le tchat de ivg-contraception-sexualites.org pour savoir où aller près de chez toi.
- **Un centre de santé sexuelle** peut t’accueillir et t’orienter sans que tes parents le sachent.
- **L’infirmière scolaire** peut t’écouter et t’orienter.
- **Agis vite** : le choix de la méthode dépend du terme de la grossesse.
- **Garde le guide d’information** remis lors de la première consultation : il récapitule les méthodes, les lieux et les numéros utiles.
- **Si tu hésites encore**, l’entretien psychosocial et le numéro vert peuvent t’aider à réfléchir, sans jugement : la décision reste la tienne.
- **Pense à la suite** : le professionnel te proposera une contraception, elle aussi accessible confidentiellement et sans avance de frais.

## Questions fréquentes
**Mes parents recevront-ils un relevé de l’Assurance Maladie ?**
L’IVG peut être réalisée de façon anonyme et sans avance de frais. Dis-le dès le premier contact que tu souhaites la confidentialité.

**Qui peut être mon adulte accompagnant ?**
Une personne majeure de ton choix. Si tu n’as personne, parles-en lors de l’entretien psychosocial : les professionnels peuvent t’aider.

**Mon copain doit-il être d’accord ?**
Non. L’IVG est un droit personnel ; ton partenaire peut t’accompagner si tu le souhaites.

**Et si quelqu’un me met la pression, dans un sens ou dans l’autre ?**
La décision t’appartient. Parles-en lors de l’entretien ou appelle le numéro vert.

## Quand demander conseil
Prends contact dès que possible avec le 0800 08 11 11 ou un centre de santé sexuelle. Si tu subis des violences, des menaces ou des pressions, appelle le **119** (enfance en danger), jour et nuit ; en danger immédiat, le **17** ou le **112**. En cas de douleur intense dans le ventre, de saignement très abondant avec malaise ou de fièvre, appelle le **15**. Si tu te sens au bout du rouleau, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...A, slug: 'apres-pilule-du-lendemain-regles-test-reprise-contraception',
    title: 'Après la pilule du lendemain : règles, protection, test de grossesse et reprise de ta contraception',
    summary: 'Ce qui peut se passer après une contraception d’urgence hormonale, pourquoi utiliser des préservatifs jusqu’aux règles et comment reprendre ta pilule après un oubli.',
    tags: ['pilule du lendemain', 'après pilule du lendemain', 'retard de règles', 'test de grossesse', 'saignements pilule du lendemain', 'reprendre sa pilule', 'contraception d’urgence', 'pilule du surlendemain'],
    sources: [S.ameliCuReflexes, S.qsCu, S.santeRegles],
    body_md: `## En bref
- La pilule d’urgence agit **uniquement sur les rapports qui ont eu lieu avant sa prise** : utilise un **préservatif à chaque rapport jusqu’à tes prochaines règles**.
- Tes règles arrivent souvent à la date prévue, mais peuvent être **décalées de quelques jours**.
- **Retard de plus de 5 jours** : fais un test de grossesse. QuestionSexualité conseille aussi de vérifier par un test deux à trois semaines après.
- Après un oubli de pilule, **reprends ta plaquette** au dernier comprimé oublié et continue normalement.
- Un rapport non protégé expose aussi aux **IST** : pense au dépistage.

## Comprendre
**Comment agit la pilule d’urgence.** Selon QuestionSexualité, elle agit surtout en **retardant l’ovulation**. Ce n’est pas une méthode abortive. Elle n’est pas efficace à 100 %, et elle l’est d’autant plus qu’elle est prise tôt. C’est pour cela que les rapports suivants doivent être protégés : si l’ovulation est seulement repoussée, un rapport quelques jours plus tard peut aboutir à une grossesse.

**Les effets possibles.** Nausées, maux de tête ou petits saignements, qui disparaissent en général en 48 heures environ selon QuestionSexualité. Santé.fr précise que des saignements ressemblant à des règles peuvent survenir quelques jours après la prise : ils **ne prouvent pas** que la contraception d’urgence a fonctionné. Le cycle peut être perturbé, avec des règles plus tôt ou plus tard que d’habitude.

**Vomissements.** Si tu vomis dans les trois heures après la prise, un nouveau comprimé est nécessaire (QuestionSexualité mentionne aussi la diarrhée survenant dans les dix heures). Demande conseil au pharmacien.

**Si une grossesse survient malgré tout.** L’Assurance Maladie indique qu’aucun risque de malformation n’a été mis en évidence avec les pilules d’urgence : tu peux poursuivre la grossesse si tu le souhaites, ou t’informer sur l’IVG.

## Au quotidien
- **Note la date de prise et la date prévue de tes règles** dans ton suivi de cycle.
- **Garde des préservatifs à portée de main** jusqu’aux prochaines règles.
- **Si tu prenais déjà la pilule**, l’Assurance Maladie donne cet exemple : en cas d’oubli des comprimés des jours 12 et 13, reprends la plaquette au 12e comprimé puis continue normalement. Ta pilule ne sera à nouveau pleinement efficace qu’à partir de la plaquette suivante : préservatif jusqu’aux règles.
- **Si tu n’as pas de contraception régulière**, prends rendez-vous avec un médecin, une sage-femme ou un centre de santé sexuelle pour en choisir une.
- **Pour les IST**, l’Assurance Maladie conseille de consulter dans les 48 heures en cas de risque de VIH : un traitement préventif peut être proposé selon la situation.

## Questions fréquentes
**J’ai eu des saignements trois jours après : ce sont mes règles ?**
Pas forcément. Des saignements peuvent survenir après la prise sans signifier que tu n’es pas enceinte. Attends tes règles habituelles et fais un test en cas de retard de plus de 5 jours.

**Puis-je reprendre une pilule d’urgence si j’ai un autre rapport non protégé dans le même cycle ?**
L’Assurance Maladie déconseille de prendre la pilule d’urgence deux fois dans le même cycle. Demande conseil au pharmacien ou à un médecin : le DIU au cuivre est une autre option.

**Quand faire un test de grossesse ?**
En cas de retard de règles de plus de 5 jours, selon l’Assurance Maladie. QuestionSexualité conseille aussi de confirmer par un test deux à trois semaines après la prise.

**La pilule d’urgence rend-elle stérile ?**
Non : elle agit sur l’ovulation du cycle en cours et ne remplace pas une contraception régulière.

## Quand demander conseil
Consulte en cas de retard de règles, de saignements inhabituels ou de douleurs. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le bas-ventre, surtout d’un côté, avec un retard de règles (une grossesse extra-utérine est possible), ou de saignement très abondant avec malaise. Pour le VIH, le dépistage ou les urgences dans les 48 heures. Sida info service : **0 800 840 800**, à toute heure.

${FIN}`,
  },
  {
    ...A, slug: 'diu-cuivre-contraception-urgence',
    title: 'Le stérilet au cuivre en contraception d’urgence : la méthode la plus efficace, comment l’obtenir à temps',
    summary: 'Jusqu’à 5 jours après un rapport à risque, le DIU au cuivre peut être posé en urgence puis garder son rôle de contraception pendant des années.',
    tags: ['stérilet au cuivre urgence', 'DIU urgence', 'contraception d’urgence', 'rapport non protégé', '5 jours', 'stérilet', 'pilule du lendemain alternative'],
    sources: [S.ameliCu, S.ameliCuReflexes, S.ansmDiu],
    body_md: `## En bref
- Le **DIU (stérilet) au cuivre** peut être posé **jusqu’à 5 jours** après un rapport non protégé ou un accident de contraception.
- L’Assurance Maladie le présente comme **la méthode de contraception d’urgence la plus efficace**.
- Il demande une **consultation** avec un médecin ou une sage-femme, puis la pose : il faut donc agir vite.
- Une fois posé, il peut rester en place comme **contraception régulière** pendant plusieurs années.
- Il **ne protège pas des IST** : pense au dépistage après un rapport non protégé.

## Comprendre
**Deux options d’urgence.** Après un rapport à risque, tu peux prendre une pilule d’urgence (un seul comprimé, au plus tard dans les 3 ou 5 jours selon la pilule, idéalement dans les 12 heures) ou faire poser un DIU au cuivre (au plus tard dans les 5 jours). Le DIU est la méthode la plus efficace des deux.

**Pourquoi l’envisager.**
- Tu souhaites de toute façon une contraception de longue durée, sans hormones.
- Tu prends un traitement qui peut diminuer l’efficacité de la pilule d’urgence : l’Assurance Maladie cite des traitements de l’épilepsie, de la tuberculose, du VIH et le millepertuis.
- Tu as déjà pris une pilule d’urgence dans le même cycle : l’Assurance Maladie déconseille de la reprendre.

**Le coût.** Le DIU s’obtient sur ordonnance. L’Assurance Maladie indique un prix d’environ 30 euros, remboursé à 65 % ; il est pris en charge à 100 % avant 26 ans selon Service-Public.fr.

**Après la pose.** Les règles reviennent en général à la date prévue. Le DIU joue alors son rôle de contraception régulière ; l’ANSM indique une durée d’efficacité de 3 à 10 ans selon le modèle.

## Au quotidien
- **Appelle tôt** : ton médecin, une sage-femme, un centre de santé sexuelle ou le **0800 08 11 11** pour savoir qui peut poser un DIU rapidement près de chez toi.
- **En attendant le rendez-vous**, si le délai risque d’être dépassé, demande au pharmacien une pilule d’urgence : mieux vaut ne pas laisser passer le temps.
- **Note la date et l’heure du rapport** : le professionnel en aura besoin pour vérifier que tu es dans les délais.
- **Prévois un antidouleur** conseillé par le professionnel pour après la pose, et quelqu’un pour te raccompagner si tu le souhaites.
- **Fais le point sur les IST** : un dépistage peut être proposé dans le même temps.

## Questions fréquentes
**Un DIU peut-il être posé si je n’ai jamais eu d’enfant ?**
Oui : selon l’ANSM, le DIU peut être utilisé par les adolescentes et par les femmes avec ou sans enfant. Le professionnel vérifie qu’il n’y a pas de contre-indication.

**Est-ce douloureux ?**
La pose peut provoquer une douleur variable d’une personne à l’autre, et des crampes les jours suivants. Une douleur qui persiste doit être signalée.

**Puis-je le faire retirer rapidement si je ne le supporte pas ?**
Oui, un DIU peut être retiré à tout moment par un professionnel. Prévois alors une autre contraception.

**Et si les 5 jours sont dépassés ?**
Parles-en à un professionnel sans attendre, et fais un test de grossesse au moment adapté. Si une grossesse est confirmée, tu peux t’informer sur toutes les options.

## Quand demander conseil
Agis le jour même du rapport à risque. Après la pose, consulte en cas de fièvre, de douleurs qui augmentent, de pertes malodorantes ou de saignements très abondants. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le ventre, de saignement très abondant avec malaise ou de fièvre avec douleurs pelviennes.

${FIN}`,
  },
  {
    ...A, slug: 'contraception-masculine-ou-en-est-on',
    title: 'La contraception masculine : ce qui existe vraiment, ce qui est en recherche',
    summary: 'Préservatif et vasectomie, méthodes thermiques et hormonales encore en étude, retrait peu fiable : l’état des lieux de la contraception côté homme.',
    tags: ['contraception masculine', 'contraception homme', 'slip chauffant', 'anneau thermique', 'vasectomie', 'préservatif', 'pilule pour homme', 'charge contraceptive'],
    sources: [S.qsMasculine, S.ameliChoisir, S.spContraception],
    body_md: `## En bref
- Selon QuestionSexualité, il existe **deux méthodes contraceptives masculines reconnues** : le **préservatif** et la **vasectomie**.
- Les méthodes **thermiques** (sous-vêtements chauffants, anneau) et **hormonales** (gel, injections, pilule) sont **encore en recherche** : leur efficacité et leur sécurité restent à démontrer.
- Le **retrait** n’est pas une méthode fiable.
- Le préservatif est le **seul contraceptif qui protège aussi des IST**.
- La contraception concerne les deux partenaires : l’Assurance Maladie encourage à **impliquer le partenaire**.

## Comprendre
**Le préservatif externe.** Il protège de la grossesse et des IST s’il est bien utilisé, dès le début du rapport. Il peut glisser ou se rompre : d’où l’intérêt d’en connaître le bon usage et, si besoin, de l’associer à une autre méthode. Certains préservatifs sont pris en charge à 100 % sans ordonnance avant 26 ans, et à 60 % sur prescription ensuite.

**La vasectomie.** C’est une contraception définitive, réalisée par un urologue, en général sous anesthésie locale, en une quinzaine de minutes. Elle bloque les canaux qui transportent les spermatozoïdes sans toucher aux hormones, à l’érection, à l’éjaculation, à la libido ou au plaisir. Elle est accessible dès 18 ans, après un délai de réflexion de quatre mois. Des spermatozoïdes peuvent rester présents dans le sperme pendant 8 à 16 semaines : une autre contraception est nécessaire en attendant la confirmation par un examen.

**Les méthodes en recherche.** Les méthodes thermiques visent à réduire la production de spermatozoïdes en augmentant la température des testicules. QuestionSexualité souligne qu’elles ne sont pas reconnues par l’OMS et ne doivent être utilisées que sous suivi médical. Les méthodes hormonales masculines (gel, injections, pilule) sont expérimentales et ne sont pas disponibles en France.

**Le retrait.** Il a un taux d’échec élevé : le liquide qui s’écoule avant l’éjaculation peut contenir des spermatozoïdes, et du sperme déposé près de la vulve peut suffire à une grossesse.

## Au quotidien
- **Pour un homme qui veut s’impliquer** : acheter et avoir sur soi des préservatifs, apprendre à les utiliser, participer à la consultation de contraception si la partenaire le souhaite, partager les frais, se souvenir des renouvellements.
- **Si ton partenaire (ou toi) envisage une méthode thermique**, parlez-en d’abord à un médecin ou à un urologue : elle nécessite un suivi médical et ne doit pas être improvisée.
- **Pour la vasectomie**, il faut prendre le temps du délai de réflexion et poser toutes les questions sur son caractère définitif.
- **En couple stable**, cherchez ensemble la méthode qui vous convient le mieux à tous les deux, plutôt que de laisser une seule personne en porter la charge.

## Questions fréquentes
**La vasectomie est-elle réversible ?**
Elle est considérée comme une contraception définitive : le choix doit être mûrement réfléchi, d’où le délai de réflexion de quatre mois.

**Un slip chauffant acheté en ligne suffit-il ?**
Non. Selon QuestionSexualité, l’efficacité et la sécurité de ces méthodes restent à démontrer, et elles ne doivent être utilisées que sous suivi médical.

**La pilule pour homme existe-t-elle ?**
Pas en France : les méthodes hormonales masculines sont encore au stade des essais.

**Le préservatif diminue-t-il le plaisir ?**
Les sensations varient selon les personnes et les modèles ; il en existe de nombreux types. Un lubrifiant rend le rapport plus confortable et réduit le risque de rupture.

## Quand demander conseil
Un médecin, un urologue ou un centre de santé sexuelle peut répondre à toutes les questions sur la contraception masculine. Après une rupture de préservatif, la contraception d’urgence est à prendre au plus vite, et un dépistage des IST peut être utile. Une consultation rapide s’impose en cas de douleur ou de gonflement d’un testicule ; une douleur brutale et intense justifie d’appeler le **15**.

${FIN}`,
  },
  {
    ...A, slug: 'idees-recues-contraception-grossesse-vrai-faux',
    title: 'Contraception et grossesse : 10 idées reçues passées au crible',
    summary: 'Grossesse pendant les règles, première fois, retrait, ovulation au 14e jour, pilule et stérilité : ce que disent vraiment les sources de santé publique.',
    tags: ['idées reçues contraception', 'vrai faux contraception', 'enceinte pendant les règles', 'première fois enceinte', 'retrait', 'ovulation 14e jour', 'pilule stérilité', 'mythes contraception'],
    sources: [S.qsFaq, S.qsPremiers, S.qsCu],
    body_md: `## En bref
- On **peut** être enceinte en ayant un rapport pendant ses règles ou lors de son **premier rapport**.
- L’ovulation n’a **pas toujours lieu au 14e jour** : compter les jours n’est pas fiable.
- Le **retrait** et les méthodes dites « naturelles » sont moins efficaces que les autres contraceptions.
- La **pilule d’urgence** n’est pas une IVG et peut être prise jusqu’à 5 jours après le rapport selon la pilule.
- Seuls les **préservatifs** protègent des IST.

## Comprendre
Voici dix idées reçues fréquentes, et ce qu’en disent les sources de Santé publique France (QuestionSexualité).

1. **« On ne peut pas tomber enceinte pendant ses règles. »** Faux : les spermatozoïdes restent actifs plusieurs jours et une ovulation peut survenir tôt après les règles.
2. **« Pas de risque la première fois. »** Faux : une grossesse est possible dès le premier rapport, et même dès les premières règles, puisqu’elles signalent qu’une ovulation a déjà eu lieu.
3. **« L’ovulation, c’est toujours le 14e jour. »** Faux : dans un cycle de 28 jours, elle peut survenir entre le 5e et le 25e jour environ.
4. **« Les spermatozoïdes ne survivent que quelques heures. »** Faux : ils peuvent vivre jusqu’à 5 jours dans les voies génitales.
5. **« Sans pénétration, aucun risque. »** C’est rare, mais du sperme déposé sur la vulve ou à l’entrée du vagin peut remonter jusqu’à l’utérus.
6. **« Le retrait suffit. »** Faux : le liquide préséminal peut contenir des spermatozoïdes ; le taux d’échec est élevé.
7. **« La pilule du lendemain, c’est un avortement. »** Faux : elle agit surtout en retardant l’ovulation.
8. **« La pilule du lendemain ne marche que le lendemain. »** Elle est d’autant plus efficace qu’elle est prise tôt, mais peut être prise jusqu’à 3 ou 5 jours après selon la pilule ; le DIU au cuivre peut être posé jusqu’à 5 jours après.
9. **« Avec la pilule, je suis protégée des IST. »** Faux : seuls les préservatifs protègent des IST, d’où l’intérêt de la double protection.
10. **« À l’approche de la ménopause, plus besoin de contraception. »** Faux : elle reste nécessaire pendant la périménopause, tant que la ménopause n’est pas confirmée (absence de règles depuis un an).

## Au quotidien
- **Vérifie l’info à la source** : QuestionSexualité, ameli.fr, ivg.gouv.fr ou un professionnel plutôt que les forums.
- **Adopte la double protection** avec un nouveau partenaire : préservatif + autre contraception.
- **Garde une contraception d’urgence** chez toi : elle est gratuite en pharmacie, sans ordonnance.
- **En cas de doute sur une grossesse**, seul un test permet de savoir : test urinaire à partir de la date prévue des règles, ou trois semaines après le rapport si tes cycles sont irréguliers.

## Questions fréquentes
**Un retard de règles veut-il forcément dire grossesse ?**
Non, d’autres causes existent (stress important, dérèglement hormonal), mais un retard doit toujours faire penser à une grossesse possible : fais un test.

**Certains saignements peuvent-ils être confondus avec des règles en début de grossesse ?**
Oui, c’est possible. En cas de doute, consulte rapidement.

**Le préservatif interne est-il aussi efficace contre les IST ?**
Oui, les préservatifs externe et interne sont les seuls moyens de contraception qui protègent aussi des IST.

**Les applis de suivi de cycle sont-elles une contraception ?**
Compter les jours n’est pas fiable et les méthodes dites naturelles sont moins efficaces. Un suivi de cycle aide à connaître ton corps, pas à éviter une grossesse.

## Quand demander conseil
Pose tes questions à un médecin, une sage-femme, un pharmacien ou au **0800 08 11 11** (gratuit, anonyme). Après un rapport à risque, ne tarde pas pour la contraception d’urgence. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le ventre avec un retard de règles, ou de saignement très abondant avec malaise.

${FIN}`,
  },
  {
    ...A, slug: 'contraception-apres-40-ans-perimenopause',
    title: 'Contraception après 40 ans et pendant la périménopause : jusqu’à quand, laquelle ?',
    summary: 'Une grossesse reste possible jusqu’à la ménopause : pourquoi garder une contraception, comment elle peut évoluer avec l’âge et les facteurs de risque, et quand se poser la question de l’arrêt.',
    tags: ['contraception 40 ans', 'contraception 45 ans', 'périménopause contraception', 'préménopause', 'pilule après 40 ans', 'arrêter la contraception ménopause', 'grossesse après 40 ans'],
    sources: [S.ameliPerimeno, S.ameliHormonale, S.qsFaq],
    body_md: `## En bref
- La fertilité baisse avec l’âge, mais **une grossesse reste possible jusqu’à la ménopause**.
- L’Assurance Maladie rappelle que la contraception doit être **poursuivie jusqu’à la certitude de la ménopause**, c’est-à-dire après **un an sans règles**.
- Avec l’âge, le **tabac**, le **surpoids**, la **migraine** ou d’autres facteurs de risque cardiovasculaire, ta méthode peut être **réévaluée**.
- Le médecin peut proposer de passer d’une contraception œstroprogestative à une contraception **progestative** ou **barrière**.
- Les méthodes dites **naturelles** sont déconseillées à cette période, faute de fiabilité.

## Comprendre
**La périménopause.** C’est la période de transition qui précède la ménopause. Elle dure en général 2 à 4 ans, parfois plus, et les premiers signes apparaissent en moyenne vers 47 ans selon l’Assurance Maladie. Les cycles deviennent irréguliers, alternant cycles courts et longs, avec des règles parfois plus abondantes. D’autres signes sont possibles : bouffées de chaleur, sueurs nocturnes, troubles du sommeil, seins tendus, irritabilité, sécheresse vaginale…

**Pourquoi garder une contraception.** Même si les cycles sont irréguliers, une ovulation peut encore survenir. Les cycles imprévisibles rendent d’ailleurs les méthodes d’observation encore moins fiables.

**Pourquoi la méthode peut changer.** Le risque cardiovasculaire augmente avec l’âge, surtout après 35 ans et avec le tabac. L’Assurance Maladie indique que, en préménopause, le médecin peut proposer de remplacer une contraception œstroprogestative (comme la pilule combinée) par une contraception progestative ou barrière, ce qui permet aussi de suivre l’évolution des règles. Un contraceptif oral faiblement dosé ou un traitement progestatif peut parfois soulager certains troubles, en l’absence de contre-indication.

**Quand arrêter.** La ménopause se confirme par l’absence de règles depuis un an. Le moment précis de l’arrêt de la contraception se décide avec ton médecin ou ta sage-femme, d’autant qu’une contraception hormonale peut masquer les règles.

## Au quotidien
- **Fais le point chaque année** sur ta contraception : tension, tabac, poids, migraines, traitements.
- **Profite du bilan prévention** proposé entre 45 et 50 ans pour parler de ta contraception et des signes de la périménopause.
- **Note tes cycles** dans ton suivi : leur durée, l’abondance des règles, les saignements inhabituels. Ces informations aident le professionnel.
- **Garde une contraception d’urgence** chez toi : elle reste utile en cas d’oubli ou d’accident de préservatif.
- **Avec un nouveau partenaire**, le préservatif reste le seul moyen de te protéger des IST, à tout âge.

## Questions fréquentes
**Mes règles sont devenues très irrégulières : suis-je encore fertile ?**
Une grossesse reste possible tant que la ménopause n’est pas confirmée. Un retard de règles doit faire penser à une grossesse : fais un test en cas de doute.

**Puis-je garder ma pilule combinée après 40 ans ?**
Cela dépend de tes facteurs de risque. Le tabac après 35 ans, la migraine ou l’hypertension peuvent conduire à changer de méthode : c’est à décider avec le professionnel qui te suit.

**Le DIU hormonal peut-il m’accompagner jusqu’à la ménopause ?**
Les contraceptions progestatives font partie des options que le médecin peut proposer en préménopause, selon l’Assurance Maladie. Parles-en avec ton médecin ou ta sage-femme.

**Comment savoir si je suis ménopausée sous contraception hormonale ?**
Certaines contraceptions suppriment les règles et rendent le repère « un an sans règles » difficile à utiliser. Le professionnel t’aidera à organiser l’arrêt.

## Quand demander conseil
Consulte si tes règles deviennent très abondantes, si tu saignes entre les règles ou après un rapport, ou en cas de retard de règles inhabituel. Tout saignement après la ménopause doit faire consulter. Appelle le **15** ou le **112** en cas de saignement très abondant avec malaise, de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine ou de trouble soudain de la parole.

${FIN}`,
  },
  {
    ...A, slug: 'contraception-tabac-thrombose-risque-cardiovasculaire', safety_critical: true,
    title: 'Contraception, tabac et risque de thrombose : ce qu’il faut savoir et les signes qui doivent alerter',
    summary: 'Pourquoi le tabac, l’âge et certains antécédents comptent dans le choix d’une contraception hormonale, et quels symptômes imposent d’appeler le 15.',
    tags: ['pilule et tabac', 'fumer sous pilule', 'thrombose pilule', 'phlébite', 'embolie pulmonaire', 'AVC pilule', 'risque cardiovasculaire contraception', 'pilule 35 ans'],
    sources: [S.ansmPilule, S.qsPilule, S.ameliHormonale],
    body_md: `## En bref
- Les contraceptions **œstroprogestatives** (pilule combinée, patch, anneau) augmentent le risque de **thrombose** : phlébite, embolie pulmonaire, AVC.
- Selon l’ANSM, ce risque augmente avec le **tabac**, l’**obésité**, les **antécédents familiaux** de thrombose, l’**âge au-delà de 35 ans** et d’autres facteurs individuels.
- La pilule combinée **n’est pas conseillée aux fumeuses de 35 ans et plus**.
- Des **alternatives** existent : contraception progestative, DIU au cuivre ou hormonal, méthodes barrières.
- Certains symptômes imposent d’**appeler le 15** immédiatement.

## Comprendre
**Qu’est-ce qu’une thrombose ?** C’est la formation d’un caillot dans une veine (phlébite, qui peut migrer vers le poumon : embolie pulmonaire) ou dans une artère (infarctus, AVC). Les œstrogènes de synthèse favorisent la coagulation. QuestionSexualité indique que le tabagisme augmente aussi le risque de thrombose artérielle.

**Ce qui fait varier le risque.**
- **Le type de pilule** : les pilules de 3e et 4e générations exposent à un risque de thrombose veineuse plus élevé que celles de 1re et 2e générations, qui sont à privilégier en première intention.
- **Le tabac** : l’Assurance Maladie le présente comme un facteur d’aggravation du risque d’AVC ou de phlébite.
- **L’âge**, surtout au-delà de 35 ans.
- **Le surpoids, les antécédents familiaux** de thrombose, certaines maladies.

**Le suivi.** L’ANSM rappelle qu’un bilan lipidique et glycémique est nécessaire avant le début et pendant la prise. Une carte patiente, dans la boîte de la pilule, détaille les signes d’alerte. Si une maladie à risque apparaît, il faut consulter, prévenir le médecin et utiliser une autre contraception.

## Au quotidien
- **Dis-le si tu fumes**, même un peu ou occasionnellement : ce n’est pas un jugement, c’est une donnée essentielle pour choisir.
- **Si tu veux arrêter**, le professionnel qui te prescrit ta contraception peut te présenter les aides au sevrage tabagique.
- **Signale tes antécédents familiaux** : phlébite, embolie, AVC ou infarctus jeune chez tes parents, frères ou sœurs.
- **Lis la carte patiente** fournie avec ta pilule et garde-la à portée de main.
- **Lors d’une chirurgie, d’une immobilisation ou d’un plâtre**, signale ta contraception aux soignants.
- **Sur un long trajet**, bouge les jambes régulièrement et hydrate-toi.

## Questions fréquentes
**Je fume et j’ai moins de 35 ans : puis-je prendre la pilule combinée ?**
La contre-indication formelle concerne les fumeuses de 35 ans et plus, mais le tabac augmente le risque avant cet âge aussi. Parles-en avec le professionnel : une méthode sans œstrogène peut être préférable.

**La cigarette électronique compte-t-elle ?**
Les sources consultées ne la détaillent pas. Signale-la au professionnel, qui t’aidera à évaluer ta situation.

**Le patch ou l’anneau sont-ils moins risqués ?**
Ils contiennent aussi un œstrogène et un progestatif ; l’Assurance Maladie indique un risque de thrombose au moins identique à celui des pilules de 1re et 2e générations pour l’anneau.

**Les contraceptions progestatives sont-elles concernées ?**
Elles sont utilisables en cas de contre-indication aux œstroprogestatifs, par exemple après 35 ans ou en cas de tabagisme, selon l’Assurance Maladie.

## Quand demander conseil
Appelle le **15** ou le **112** sans attendre en cas de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine, de crachats de sang, de faiblesse ou d’engourdissement d’un côté du corps, de déformation de la bouche, de trouble soudain de la parole ou de la vue, ou de mal de tête brutal et inhabituel. Consulte si une migraine apparaît ou change sous contraception.

${FIN}`,
  },
  {
    ...A, slug: 'parler-contraception-dans-le-couple-charge-contraceptive',
    title: 'Parler contraception dans le couple : partager la charge et décider à deux',
    summary: 'Pourquoi la contraception concerne les deux partenaires, comment aborder le sujet, et ce que chacun peut concrètement faire au quotidien.',
    tags: ['contraception couple', 'charge contraceptive', 'partenaire contraception', 'parler de contraception', 'préservatif couple', 'arrêter le préservatif', 'dépistage couple'],
    sources: [S.santeChoisir, S.ameliChoisir, S.qsMasculine],
    body_md: `## En bref
- La contraception **concerne les deux partenaires** : l’Assurance Maladie recommande d’**impliquer le partenaire** dans la contraception et la prévention des IST.
- Santé publique France invite à te demander : « Comment associer mon partenaire à ma réflexion ? »
- Côté homme, deux méthodes sont reconnues : le **préservatif** et la **vasectomie**.
- Arrêter le préservatif dans un couple stable se prépare : **dépistage** des deux partenaires et autre contraception en place.
- Partager la charge, c’est aussi partager l’**organisation**, les **frais** et l’**attention** aux effets ressentis.

## Comprendre
**La charge contraceptive.** Dans la plupart des couples hétérosexuels, la contraception repose sur la femme : rendez-vous, prise quotidienne, effets indésirables, renouvellements, contraception d’urgence en cas d’oubli. L’Assurance Maladie rappelle que, chez l’homme, il existe le préservatif externe et la vasectomie ; les autres méthodes masculines sont encore en recherche selon QuestionSexualité.

**Décider ensemble, sans imposer.** La personne qui utilise une méthode reste seule à décider de ce qui entre dans son corps. Parler à deux ne veut pas dire faire pression : il s’agit de comprendre ce que chacun vit et attend, et de chercher la solution la plus confortable.

**Le préservatif dans un couple qui dure.** L’Assurance Maladie conseille d’utiliser des préservatifs pendant les premiers mois d’une relation suivie, puis de faire un test de dépistage : une relation stable et de confiance permet ensuite d’arrêter cette protection, à condition d’avoir une autre contraception si vous ne souhaitez pas de grossesse.

## Au quotidien
Quelques idées pour lancer la conversation et partager la charge :
- **Choisir un moment calme**, pas juste avant ou juste après un rapport.
- **Parler de ce que chacun ressent** : « Ma pilule me pèse », « J’ai peur des oublis », « Je voudrais qu’on partage les frais ».
- **Venir à deux en consultation**, si la personne concernée le souhaite : le partenaire peut poser ses questions et comprendre les contraintes.
- **Avoir toujours des préservatifs** sur soi, et apprendre à bien les utiliser, y compris le préservatif interne.
- **Partager le coût** des méthodes non remboursées (patch, anneau, certaines pilules).
- **Garder ensemble une contraception d’urgence** à la maison et savoir où la trouver.
- **Se dépister à deux** avant d’arrêter le préservatif.
- **Évoquer le projet d’enfant** : pas maintenant, peut-être dans quelques années, ou plus du tout ? Cela oriente le choix (méthode de courte ou longue durée, voire définitive).

## Questions fréquentes
**Mon partenaire refuse le préservatif : que faire ?**
Le préservatif est le seul moyen de se protéger des IST. Tu as le droit de l’exiger. Si tu subis des pressions, parles-en à un professionnel ou appelle le 0800 08 11 11.

**On veut arrêter le préservatif : par quoi commencer ?**
Un dépistage des IST pour chacun, puis la mise en place d’une autre contraception si vous ne souhaitez pas de grossesse.

**Mon partenaire envisage une vasectomie : est-ce une décision de couple ?**
C’est une décision personnelle, réfléchie (délai de réflexion de quatre mois), qui gagne à être discutée ensemble car elle est considérée comme définitive.

**Et dans un couple de femmes ?**
La question de la contraception ne se pose pas de la même façon, mais celle de la prévention des IST, du dépistage et du suivi gynécologique reste importante.

## Quand demander conseil
Tu peux consulter, seule ou à deux, un médecin, une sage-femme ou un centre de santé sexuelle pour toute question. Si la contraception devient un sujet de contrôle, de menace ou de violence (contraception imposée, sabotage, rapports forcés), appelle le **3919** (violences faites aux femmes) ; en danger immédiat, le **17** ou le **112**.

${FIN}`,
  },
  {
    ...AC, slug: 'sterilet-adolescente-femme-sans-enfant',
    title: 'Le stérilet quand on est jeune ou qu’on n’a jamais eu d’enfant : c’est possible',
    summary: 'Le DIU convient aussi aux adolescentes et aux femmes qui n’ont jamais été enceintes : ce que disent l’ANSM et l’Assurance Maladie, et comment se préparer.',
    tags: ['stérilet jeune', 'DIU sans enfant', 'stérilet nullipare', 'stérilet adolescente', 'stérilet 18 ans', 'DIU cuivre', 'DIU hormonal', 'idées reçues stérilet'],
    min_age_months: 144,
    sources: [S.ansmDiu, S.ameliSterilet, S.ameliAdo],
    body_md: `## En bref
- Selon l’ANSM et l’Assurance Maladie, le DIU (stérilet) peut être utilisé par les **adolescentes** et par les femmes **avec ou sans enfant**, en l’absence de contre-indication.
- Il existe un DIU **au cuivre** (sans hormones, de 4 à 10 ans) et un DIU **hormonal** (au lévonorgestrel, 5 ans).
- Il n’y a **pas d’oubli possible**, et il peut être **retiré à tout moment**.
- Il **ne protège pas des IST** : le préservatif reste utile avec un nouveau partenaire.
- Il est pris en charge à **100 % avant 26 ans**, sans avance de frais.

## Comprendre
**Une idée reçue tenace.** On a longtemps pensé que le stérilet était réservé aux femmes ayant déjà eu des enfants. Ce n’est pas ce que disent les sources officielles actuelles : l’ANSM indique qu’il peut être utilisé par les adolescentes et par les femmes avec ou sans enfant. L’Assurance Maladie rappelle aussi que l’âge ne limite pas le choix de la contraception, à l’exception de la stérilisation, réservée aux majeurs.

**Cuivre ou hormonal ?**
- Le **DIU au cuivre** agit comme un spermicide. Il ne contient pas d’hormones mais rend souvent les règles plus abondantes. Il peut aussi servir de contraception d’urgence.
- Le **DIU hormonal** épaissit les sécrétions du col, réduit les règles et peut les supprimer : il est parfois proposé en cas de règles très abondantes. Selon l’ANSM, il n’est pas associé à un surrisque de méningiome.

**Les contre-indications** citées par l’Assurance Maladie : malformation de l’utérus, infection en cours, saignements inexpliqués, et contre-indications propres au DIU hormonal.

**Le suivi.** Une visite de contrôle est prévue dans les 3 mois suivant la pose, puis une consultation annuelle.

## Au quotidien
- **Pose toutes tes questions** lors de la consultation : douleur à la pose, effets sur les règles, durée, retrait.
- **Demande comment soulager la douleur** pendant et après la pose ; les sensations varient d’une personne à l’autre.
- **Prévois une journée tranquille** après la pose, avec une bouillotte et la possibilité de te reposer.
- **Tu peux faire du sport** et utiliser des tampons (à changer au moins deux fois par jour, selon l’Assurance Maladie).
- **Avec un nouveau partenaire**, associe le préservatif (double protection) et pense au dépistage des IST.
- **Pour les parents** : si ton ado envisage un DIU, sache que la consultation est confidentielle. Tu peux lui dire que tu es disponible pour en parler, sans exiger de savoir.

## Questions fréquentes
**Le stérilet empêche-t-il d’avoir des enfants plus tard ?**
Non. Il peut être retiré à tout moment, notamment en cas de désir de grossesse.

**La pose est-elle plus douloureuse quand on n’a jamais accouché ?**
La douleur est très variable d’une personne à l’autre. Les crampes s’atténuent en général en quelques jours ; une douleur qui persiste doit être signalée.

**Puis-je le faire retirer si je veux un enfant ?**
Oui, à tout moment, par un professionnel. L’ANSM précise qu’il peut aussi être remplacé si besoin.

**Combien ça coûte ?**
Avant 26 ans, le DIU, sa pose et le suivi sont pris en charge sans avance de frais ; ensuite, le DIU est remboursé à 65 %.

## Quand demander conseil
Consulte en cas de saignements anormaux, de fièvre, de douleurs dans le ventre ou de pertes inhabituelles. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le bas-ventre avec un retard de règles, de fièvre avec douleurs pelviennes importantes, ou de saignement très abondant avec malaise.

${FIN}`,
  },
  {
    ...AT, slug: 'retrait-methodes-observation-fiabilite-chiffres',
    title: 'Retrait, température, glaire, calendrier : ce que valent vraiment les méthodes dites naturelles',
    summary: 'Les taux d’échec publiés par Santé publique France pour chaque méthode sans contraceptif, leurs conditions d’utilisation et pourquoi elles ne conviennent pas à tout le monde.',
    tags: ['retrait', 'coït interrompu', 'méthodes naturelles', 'méthode des températures', 'glaire cervicale', 'Ogino', 'symptothermie', 'MAMA', 'fiabilité contraception'],
    sources: [S.qsNaturelles, S.qsTableau, S.ameliNaturelles],
    body_md: `## En bref
- Les méthodes dites naturelles reposent sur l’**observation du cycle** ou sur le **retrait** ; l’Assurance Maladie juge leur taux d’échec **élevé**.
- Selon QuestionSexualité, environ **22 %** des personnes qui utilisent le retrait connaissent une grossesse en un an, **23 %** avec l’observation seule de la glaire, **15 à 25 %** avec le calendrier (Ogino).
- La **symptothermie** (température + glaire) affiche environ **2 %** d’échec, mais demande une **formation** et environ **un an d’observation** sans contraception hormonale.
- Ces méthodes ne conviennent pas aux **cycles irréguliers** et **ne protègent pas des IST**.
- Pour éviter une grossesse, l’Assurance Maladie les réserve aux femmes qui connaissent bien leur cycle, maîtrisent la méthode et **acceptent le risque** d’une grossesse.

## Comprendre
**Le retrait.** Il consiste à retirer le pénis avant l’éjaculation. Il demande une grande maîtrise et reste peu fiable : le liquide préséminal peut contenir des spermatozoïdes, et du sperme déposé près de la vulve suffit parfois. Le risque augmente en cas de nouvelle pénétration après une éjaculation. Le tableau comparatif de QuestionSexualité indique une efficacité d’environ 78 % en pratique.

**Les méthodes d’observation.**
- **Température** : une prise chaque matin pour repérer la légère hausse qui suit l’ovulation. Elle indique que l’ovulation est passée, pas qu’elle approche.
- **Glaire cervicale (Billings)** : l’observation de la glaire, qui change au cours du cycle. Elle peut être confondue avec du sperme ou d’autres pertes, et devient difficile à lire en cas de mycose ou d’infection.
- **Calendrier (Ogino)** : il suppose que l’ovulation survient toujours au même moment, ce qui est faux ; c’est l’une des moins efficaces.
- **Méthode des jours fixes** (environ 12 % d’échec, cycles de 26 à 32 jours uniquement) et **méthode des deux jours** (environ 14 %).
- **Symptothermie** : elle combine plusieurs signes et demande une formation et environ douze cycles d’observation.

**Après un accouchement**, la méthode MAMA (allaitement exclusif) a ses propres conditions strictes : bébé de moins de 6 mois, absence de retour de couches, tétées espacées de 4 à 6 heures au maximum.

## Au quotidien
- **Si tu utilises une de ces méthodes**, garde toujours une **contraception d’urgence** à la maison.
- **Associe le préservatif** pendant la période fertile, et avec tout nouveau partenaire.
- **Ne te fie pas à une appli seule** : un suivi de cycle t’aide à mieux connaître ton corps, mais calculer des « jours sûrs » reste peu fiable.
- **Si tu veux te former** à la symptothermie, parles-en avec une sage-femme ou un médecin ; la période d’apprentissage nécessite une autre protection.
- **Si une grossesse serait difficile à vivre pour toi**, parles-en : d’autres méthodes, avec ou sans hormones, sont bien plus efficaces.

## Questions fréquentes
**Le retrait vaut-il mieux que rien ?**
Il réduit un peu le risque par rapport à l’absence de toute méthode, mais reste peu fiable. Après un retrait raté ou un doute, pense à la contraception d’urgence.

**Les tests d’ovulation peuvent-ils servir de contraception ?**
L’Assurance Maladie les cite parmi les méthodes naturelles, dont le taux d’échec est élevé. Ils sont surtout conçus pour repérer la période fertile quand on souhaite concevoir.

**Et si on veut un bébé bientôt ?**
Les méthodes d’observation peuvent aider à repérer la période fertile. Pour un projet bébé, le module projet bébé de l’app t’accompagne.

**Les méthodes naturelles conviennent-elles aux cycles irréguliers ?**
La plupart supposent des cycles réguliers : elles sont encore moins fiables dans ce cas.

## Quand demander conseil
Consulte un médecin, une sage-femme ou un centre de santé sexuelle pour discuter d’une méthode plus adaptée. En cas de retard de règles, fais un test de grossesse. Appelle le **15** ou le **112** en cas de douleur brutale et intense dans le ventre avec un retard de règles, ou de saignement très abondant avec malaise.

${FIN}`,
  },
  {
    ...A, slug: 'injection-contraceptive-progestative',
    title: 'L’injection contraceptive : une méthode de dernier recours, pour qui et avec quelles précautions',
    summary: 'Le progestatif injectable protège environ trois mois par injection, mais il est réservé aux situations où aucune autre méthode n’est possible : ce qu’il faut savoir.',
    tags: ['injection contraceptive', 'piqûre contraceptive', 'progestatif injectable', 'contraception tous les 3 mois', 'densité osseuse', 'contraception sans oubli'],
    sources: [S.ameliHormonale, S.qsTableau, S.spContraception],
    body_md: `## En bref
- L’injection contraceptive est une **injection intramusculaire de progestatif**, faite par un **médecin, une infirmière ou une sage-femme**.
- Elle protège environ **trois mois** ; le tableau de QuestionSexualité indique des injections **toutes les 8 à 12 semaines**.
- L’Assurance Maladie précise que son indication est **limitée aux cas où aucune autre méthode n’est possible**, et que sa durée d’utilisation est **limitée dans le temps**.
- Ses risques cités : **thrombose veineuse**, **diminution de la densité minérale osseuse**, **prise de poids** ; les **règles irrégulières** sont fréquentes.
- Elle est **remboursée**, à 100 % avant 26 ans.

## Comprendre
**Comment elle agit.** Comme d’autres contraceptifs progestatifs, elle libère une hormone qui empêche la grossesse. Selon le tableau comparatif de Santé publique France, son efficacité est d’environ 94 % en utilisation courante et 99,7 % en utilisation parfaite : l’écart vient surtout des injections faites en retard.

**Pourquoi c’est une méthode de dernier recours.** L’Assurance Maladie liste plusieurs risques : thrombose veineuse, baisse de la densité des os, prise de poids. Les saignements irréguliers sont un effet indésirable fréquent. C’est pourquoi d’autres méthodes sont proposées en priorité et pourquoi l’injection n’est pas prévue pour être utilisée très longtemps.

**Ses atouts dans certaines situations.** Aucune manipulation au moment des rapports, pas de prise quotidienne, une méthode discrète. Elle peut être envisagée quand les autres méthodes sont contre-indiquées ou impossibles à utiliser.

**Le délai d’efficacité.** QuestionSexualité indique une efficacité qui peut demander jusqu’à 7 jours selon le moment de l’injection : utilise des préservatifs en attendant, selon les consignes du professionnel.

## Au quotidien
- **Note la date de la prochaine injection** dans ton calendrier, avec un rappel une ou deux semaines avant.
- **Prends rendez-vous à l’avance** avec le professionnel qui la réalise.
- **En cas de retard**, utilise des préservatifs et demande conseil rapidement ; pense à la contraception d’urgence si un rapport non protégé a eu lieu.
- **Prends soin de tes os** : activité physique régulière, alimentation riche en calcium, pas de tabac. Parles-en avec ton médecin.
- **Fais le point régulièrement** sur la pertinence de cette méthode : une autre peut devenir possible.
- **Avec un nouveau partenaire**, ajoute le préservatif : l’injection ne protège pas des IST.

## Questions fréquentes
**Puis-je me faire l’injection moi-même ?**
Selon l’Assurance Maladie, elle est réalisée par un médecin, une infirmière ou une sage-femme.

**Mes règles vont-elles changer ?**
Les règles irrégulières sont fréquentes avec cette méthode. Un saignement inhabituel, très abondant ou prolongé mérite une consultation.

**Combien de temps puis-je l’utiliser ?**
Sa durée d’utilisation est limitée dans le temps : le professionnel qui te suit réévalue régulièrement la situation.

**Est-elle remboursée ?**
Oui. Service-Public.fr indique une prise en charge à 100 % avant 26 ans et à 65 % ensuite.

## Quand demander conseil
Consulte si tu as dépassé la date d’injection, en cas de saignements très abondants ou prolongés, ou de douleurs. Appelle le **15** ou le **112** en cas de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine, ou de saignement très abondant avec malaise.

${FIN}`,
  },
  {
    ...A, slug: 'double-protection-preservatif-contraception-ist',
    title: 'La double protection : préservatif + contraception, quand et pourquoi',
    summary: 'Associer le préservatif à une autre contraception protège à la fois des IST et d’une grossesse : dans quelles situations, jusqu’à quand, et comment arrêter le préservatif en sécurité.',
    tags: ['double protection', 'préservatif et pilule', 'IST', 'dépistage', 'nouveau partenaire', 'rupture préservatif', 'arrêter le préservatif', 'VIH'],
    sources: [S.qsPremiers, S.ameliCuReflexes, S.ameliAdo],
    body_md: `## En bref
- Le **préservatif** (externe ou interne) est le **seul** moyen de contraception qui protège aussi des **IST**.
- La **double protection** associe le préservatif à une autre contraception (pilule, implant, DIU…) : le préservatif protège des IST, l’autre méthode prend le relais en cas de rupture ou de mauvaise utilisation.
- Selon Santé publique France, en 2016, seules **16 %** des jeunes femmes de 15 à 19 ans utilisaient la double protection lors du premier rapport.
- L’Assurance Maladie conseille les **préservatifs pendant les premiers mois** d’une relation, puis un **dépistage** avant de les arrêter.
- Le **lubrifiant** rend le rapport plus confortable et réduit le risque de rupture.

## Comprendre
**Pourquoi deux protections ?** Une contraception hormonale ou un DIU sont très efficaces contre la grossesse, mais ne protègent pas des IST (chlamydia, VIH, hépatite B, etc.). À l’inverse, le préservatif protège des IST mais peut glisser ou se rompre. Associer les deux couvre les deux risques.

**Quand y penser ?** Avec un nouveau partenaire, lors des premiers rapports, en cas de partenaires multiples, ou tant que le dépistage n’a pas été fait. L’Assurance Maladie rappelle que le préservatif est indispensable tant qu’il n’y a pas de relation stable et de dépistage du VIH.

**Bien utiliser le préservatif.** QuestionSexualité insiste : il doit être mis **dès le début**, avant toute pénétration ou éjaculation. Le lubrifiant est essentiel pour les rapports anaux.

**Arrêter le préservatif.** L’Assurance Maladie conseille d’utiliser des préservatifs pendant les trois premiers mois d’une relation suivie, puis de faire un test de dépistage. Une relation stable et de confiance permet alors d’arrêter, avec une autre contraception en place si vous ne souhaitez pas de grossesse.

## Au quotidien
- **Garde toujours des préservatifs** sur toi : avant 26 ans, ceux des marques listées sont pris en charge sans ordonnance en pharmacie ; les centres de santé sexuelle et les CeGIDD en distribuent gratuitement.
- **Vérifie la date de péremption** et le marquage CE ; conserve-les à l’abri de la chaleur et des frottements (pas dans un portefeuille serré).
- **Utilise un lubrifiant** adapté au préservatif.
- **En cas de rupture**, la partenaire peut prendre une contraception d’urgence ; pour le VIH, consulte dans les **48 heures** (dépistage ou urgences) : un traitement préventif peut être proposé.
- **Faites-vous dépister à deux** avant d’arrêter le préservatif. Les consultations et dépistages sont possibles en CeGIDD et en centre de santé sexuelle, de façon confidentielle.

## Questions fréquentes
**Je prends la pilule : ai-je vraiment besoin du préservatif ?**
Pour la grossesse, ta pilule suffit si elle est bien prise. Pour les IST, seul le préservatif protège. Avec un nouveau partenaire, la double protection est recommandée.

**Les mineurs peuvent-ils se faire dépister sans leurs parents ?**
Oui : les consultations en centre de santé sexuelle et en CeGIDD sont confidentielles, et les mineurs peuvent y aller sans autorisation parentale.

**Le préservatif interne est-il une bonne alternative ?**
Oui, il protège aussi des IST. Il se place dans le vagin avant le rapport.

## Quand demander conseil
Après un rapport à risque, consulte dans les 48 heures pour le VIH (CeGIDD, centre de santé sexuelle ou urgences) et pense à la contraception d’urgence. Consulte aussi en cas de brûlures, de pertes inhabituelles, de plaies ou de démangeaisons génitales. Sida info service répond 24 h/24 au **0 800 840 800**, et Fil santé jeunes au **0 800 235 236**.

${FIN}`,
  },
  {
    ...A, slug: 'changer-de-contraception-sans-periode-non-protegee',
    title: 'Changer de contraception sans te retrouver sans protection',
    summary: 'Les bonnes raisons de changer, les trois règles de Santé publique France pour la transition, et les questions à poser au professionnel.',
    tags: ['changer de contraception', 'changer de pilule', 'passer de la pilule au stérilet', 'arrêter la pilule', 'relais contraception', 'préservatif transition'],
    sources: [S.qsChanger, S.ameliChoisir, S.ansmPilule],
    body_md: `## En bref
- Il est tout à fait possible de **changer de contraception** si la tienne ne te convient plus : effets gênants, oublis, nouvelle situation de vie.
- Santé publique France donne trois règles : **en parler à un professionnel**, **prendre des précautions pendant la transition**, et **ne pas arrêter la pilule avant d’avoir une nouvelle méthode**.
- Pendant la transition, utilise des **préservatifs en plus**, pendant une période qui peut aller d’environ une semaine à un mois selon les méthodes.
- Entre deux pilules, **ne laisse pas de « trou »**.
- Prépare la **liste de tes contraceptions passées** pour la consultation.

## Comprendre
**Les raisons de changer.** QuestionSexualité cite : saignements entre les règles, acné, douleurs des seins, sécheresse vaginale, baisse de moral, oublis fréquents. Une méthode difficile à suivre au quotidien est en soi un inconvénient. Ta vie change aussi : nouvelle relation, fin de relation, projet d’enfant, âge, tabac, nouveau traitement, nouvelle maladie.

**Pourquoi éviter l’arrêt brutal.** Arrêter une pilule sans relais expose à une grossesse non prévue. QuestionSexualité ajoute que l’arrêt peut s’accompagner de cycles irréguliers, d’un retard de règles, ou de règles plus abondantes ou douloureuses.

**Le rôle du professionnel.** Le médecin ou la sage-femme fixe le moment exact où commencer la nouvelle méthode, selon l’ancienne et la nouvelle (pilule vers DIU, implant vers pilule, etc.), et te dit pendant combien de temps ajouter des préservatifs. L’ANSM conseille d’établir avec le médecin la liste des contraceptions hormonales déjà utilisées lors d’un changement de pilule.

## Au quotidien
Avant la consultation :
- **Note ce qui ne va pas** et depuis quand (saignements, humeur, douleurs, oublis).
- **Liste tes anciennes méthodes** et ce que tu en as pensé.
- **Réfléchis à tes attentes** : avec ou sans hormones, durée, contraintes acceptables, envie d’enfant à moyen terme. Le tableau comparatif de QuestionSexualité peut t’aider.

Pendant la transition :
- **Continue l’ancienne méthode** jusqu’au jour indiqué par le professionnel.
- **Ajoute des préservatifs** pendant la période indiquée.
- **Si tu changes de pilule**, enchaîne sans pause supplémentaire, sauf consigne contraire.
- **Garde une contraception d’urgence** à la maison en cas de doute.

## Questions fréquentes
**Faut-il attendre la fin de la plaquette pour changer ?**
Cela dépend des méthodes. Demande au professionnel le jour exact pour commencer la nouvelle.

**Je veux arrêter toute contraception hormonale : que me reste-t-il ?**
Le DIU au cuivre, les préservatifs, le diaphragme ou la cape (avec un spermicide), et les méthodes d’observation, nettement moins fiables.

**Après un implant ou un DIU, la fertilité revient-elle vite ?**
Le retrait est possible à tout moment ; une grossesse peut survenir rapidement après. Si tu ne souhaites pas de grossesse, la nouvelle méthode doit être prête.

**Combien de temps tester une nouvelle méthode ?**
Les saignements du début peuvent s’atténuer en quelques semaines. Un effet qui te pèse justifie d’en parler sans attendre.

## Quand demander conseil
Consulte un médecin, une sage-femme ou un centre de santé sexuelle avant de changer. En cas de rapport non protégé pendant la transition, prends une contraception d’urgence au plus vite. Appelle le **15** ou le **112** en cas de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur thoracique ou de trouble soudain de la parole ou de la vue.

${FIN}`,
  },
];
