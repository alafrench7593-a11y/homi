/** Guide complet — lot 32 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
const FSJ = 'Santé.fr (contenu Fil santé jeunes / EPE Île-de-France)';
// Sources réellement consultées (pages officielles ou de référence françaises).
const S = {
  ameliRegles: { label: 'ameli.fr — Informations et conseils sur les règles ou menstruations', url: 'https://www.ameli.fr/assure/sante/themes/puberte/informations-conseils-regles', consulted_on: C, published: '2026-09-29' },
  fsjPremieres: { label: `${FSJ} — Les premières règles`, url: 'https://www.sante.fr/node/135698', consulted_on: C, published: '2024-06-17' },
  fsjAge: { label: `${FSJ} — À quel âge arrivent les premières règles ?`, url: 'https://www.sante.fr/node/135741', consulted_on: C, published: '2016-11-08' },
  fsjAmenorrhee: { label: `${FSJ} — L’aménorrhée ou l’absence de règles`, url: 'https://www.sante.fr/node/135701', consulted_on: C, published: '2024-02-23' },
  cafParler: { label: 'caf.fr (Vies de famille) — Les premières règles : comment en parler avec sa fille ?', url: 'https://caf.fr/allocataires/vies-de-famille/articles/les-premieres-regles-comment-en-parler-avec-sa-fille', consulted_on: C, published: '2025-11-03' },
  santeTroubles: { label: 'Santé.fr — Troubles des règles', url: 'https://www.sante.fr/node/2055757', consulted_on: C, published: '2026-08-13' },
  qsCycle: { label: 'QuestionSexualité (Santé publique France) — Le cycle menstruel', url: 'https://www.questionsexualite.fr/comprendre-la-conception-et-la-grossesse/la-sexualite-reproductive/le-cycle-menstruel', consulted_on: C },
  qsNaturelles: { label: 'QuestionSexualité (Santé publique France) — Que sont les méthodes naturelles ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/que-sont-les-methodes-naturelles', consulted_on: C },
  ameliNaturelles: { label: 'ameli.fr — Les méthodes naturelles de contraception', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-naturelles-contraception', consulted_on: C, published: '2018-05-30' },
  ameliAmenorrhee: { label: 'ameli.fr — Qu’est-ce qu’une aménorrhée et quand faut-il s’inquiéter de l’absence de règles ?', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/amenorrhee-regles-retard-absence', consulted_on: C },
  ameliAmenoConsult: { label: 'ameli.fr — Consultation et bilan médical en cas d’absence de règles', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/absence-de-regles-consultation', consulted_on: C },
  ameliPuberteTardive: { label: 'ameli.fr — Puberté précoce et puberté tardive', url: 'https://www.ameli.fr/assure/sante/themes/puberte/puberte-precoce-tardive', consulted_on: C },
  ameliContraPostPartum: { label: 'ameli.fr — Quelle contraception après un accouchement ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-et-nouveau-ne/contraception-apres-un-accouchement', consulted_on: C },
  ameliFausseCouche: { label: 'ameli.fr — Fausse couche', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/fausse-couche', consulted_on: C },
  citeFausseCouche: { label: 'Cité de la santé (Cité des sciences et de l’industrie) — Questions-santé : Fausse couche', url: 'https://www.cite-sciences.fr/fr/au-programme/lieux-ressources/cite-de-la-sante/une-question-en-sante/questions-sante/toutes-les-questions/2023/12/fausse-couche', consulted_on: C, published: '2023-12-08' },
  ivgApres: { label: 'ivg.gouv.fr (ministère de la Santé) — Après l’IVG', url: 'https://ivg.gouv.fr/apres-ivg', consulted_on: C, published: '2025-11-18' },
  ameliApresIvg: { label: 'ameli.fr — Après une IVG : suivi et contraception', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/ivg/suivi-et-contraception-apres-une-ivg', consulted_on: C },
  ansmIvg: { label: 'ANSM — IVG médicamenteuse : pourquoi la consultation médicale de contrôle est indispensable et obligatoire', url: 'https://ansm.sante.fr/actualites/interruption-volontaire-de-grossesse-ivg-medicamenteuse-pourquoi-la-consultation-medicale-de-controle-est-indispensable-et-obligatoire', consulted_on: C, published: '2022-09-15' },
  hasFibromes: { label: 'HAS — Fiche pertinence : traitements non médicamenteux des fibromes utérins', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2023-09/fiche_pertinence_fibromes_uterins_2023-09-15_17-16-19_699.pdf', consulted_on: C, published: '2022-11-24' },
  ameliEndoSymptomes: { label: 'ameli.fr — Endométriose : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/themes/endometriose/symptomes-diagnostic-evolution', consulted_on: C, published: '2017-03-12' },
  ameliEndoTraitement: { label: 'ameli.fr — Le traitement de l’endométriose', url: 'https://www.ameli.fr/assure/sante/themes/endometriose/traitement', consulted_on: C },
  santeEndo: { label: 'Santé.fr — Endométriose (mini-site du Service public d’information en santé)', url: 'https://www.sante.fr/endometriose', consulted_on: C },
  santeEndoRegles: { label: 'Santé.fr (contenu EndoFrance) — Symptômes de l’endométriose : les règles douloureuses', url: 'https://www.sante.fr/endometriose/symptomes-de-lendometriose-les-regles-douloureuses', consulted_on: C, published: '2024-01-05' },
  santeEndoExamens: { label: 'Santé.fr — Endométriose : examens complémentaires', url: 'https://www.sante.fr/endometriose/diagnostic-et-examens/examens-complementaires', consulted_on: C },
  santeEndoTest: { label: 'Santé.fr — Endométriose : en quoi consiste le test salivaire de l’endométriose ?', url: 'https://www.sante.fr/endometriose/endometriose-en-quoi-consiste-le-test-salivaire-de-lendometriose', consulted_on: C, published: '2025-03-26' },
  santeEndoSoutien: { label: 'Santé.fr — Endométriose : soutien au quotidien', url: 'https://www.sante.fr/endometriose/vivre-avec/soutien-au-quotidien', consulted_on: C },
  santeEndoAides: { label: 'Santé.fr — Endométriose : prise en charge et aides sociales', url: 'https://www.sante.fr/endometriose/droits-des-patients/prise-en-charge-et-aides-sociales', consulted_on: C },
  santeAdenomyose: { label: 'Santé.fr (contenu EndoFrance) — Qu’est-ce que l’adénomyose ?', url: 'https://www.sante.fr/endometriose/quest-ce-que-ladenomyose', consulted_on: C, published: '2024-08-08' },
  ameliSopkSymptomes: { label: 'ameli.fr — Symptômes, diagnostic et évolution du syndrome des ovaires polykystiques', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-ovaires-polykystiques/symptomes-diagnostic-evolution', consulted_on: C, published: '2026-01-12' },
  ameliSopkTraitement: { label: 'ameli.fr — Traitement du syndrome des ovaires polykystiques', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-ovaires-polykystiques/traitement', consulted_on: C, published: '2025-12-09' },
  cngofKystes: { label: 'CNGOF — Recommandations pour la pratique clinique : prise en charge des kystes de l’ovaire présumés bénins (2001)', url: 'https://cngof.fr/app/uploads/2025/11/Ovaires202001-Prise20en20charge20des20kystes20de20l27ovaire20prC3A9sumC3A9s20bC3A9nins.pdf', consulted_on: C, published: '2001-12-07' },
  hasIop: { label: 'HAS / FIRENDO — Insuffisance ovarienne prématurée : synthèse à destination du médecin traitant (PNDS)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2021-05/synthese_mg_insuffisance_ovarienne_prematuree.pdf', consulted_on: C, published: '2021-05-01' },
  santeMenopause: { label: 'Santé.fr — Ménopause et périménopause', url: 'https://www.sante.fr/menopause-perimenopause', consulted_on: C },
  santeMenoSymptomes: { label: 'Santé.fr — Les symptômes de la ménopause', url: 'https://www.sante.fr/menopause-perimenopause/symptomes-menopause', consulted_on: C },
  santeMenoTraitements: { label: 'Santé.fr — Les traitements pour la ménopause', url: 'https://www.sante.fr/menopause-perimenopause/traitements-pour-menopause', consulted_on: C },
  santeMenoVivre: { label: 'Santé.fr — Vivre au mieux la ménopause', url: 'https://www.sante.fr/menopause-perimenopause/vivre-au-mieux-menopause', consulted_on: C },
  santeMenoIdees: { label: 'Santé.fr — Idées reçues sur la ménopause', url: 'https://www.sante.fr/menopause-perimenopause/idees-recues-sur-menopause', consulted_on: C },
  arcEndometre: { label: 'Fondation ARC pour la recherche sur le cancer — Le cancer de l’endomètre', url: 'https://www.fondation-arc.org/sinformer-sur-le-cancer/les-differents-cancers/le-cancer-de-lendometre/', consulted_on: C, published: '2026-06-05' },
  curieEndometre: { label: 'Institut Curie — Symptômes et diagnostic du cancer de l’endomètre', url: 'https://curie.fr/symptomes-et-diagnostic-du-cancer-de-lendometre', consulted_on: C },
  santeMenoActivite: { label: 'Santé.fr (contenu Santé publique France – Manger Bouger) — Activité physique pour les femmes à la ménopause', url: 'https://www.sante.fr/activite-physique-pour-les-femmes-la-menopause', consulted_on: C, published: '2022-10-18' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article t’informe ; il ne remplace pas l’avis d’un médecin, d’une sage-femme ou d’un·e gynécologue._';
const URG = 'En cas de saignement très abondant avec malaise, de douleur brutale et intense dans le ventre (surtout avec un retard de règles), de fièvre avec douleurs dans le bas-ventre ou de signes de choc toxique (fièvre brutale, éruption, malaise) en portant un tampon ou une coupe : appelle le **15** (SAMU) ou le **112**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys' | 'category'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['avoid'], category: 'cycle-ages', status: 'to_review', ...x,
});

export const GUIDE_B32: LibArticle[] = [
  // ------------------------------------------------------------ puberté et premiers cycles
  a({
    slug: 'premieres-regles-ce-qui-se-passe-ado',
    title: 'Mes premières règles : à quoi ça ressemble et comment je me prépare',
    summary: 'Pour les ados : quand arrivent les premières règles, à quoi elles ressemblent, comment te préparer et à qui en parler si quelque chose t’inquiète.',
    tags: ['premières règles', 'ménarche', 'puberté', 'ado', 'règles à 11 ans', 'règles à 12 ans', 'protections', 'serviette', 'saignement culotte'],
    journeys: ['avoid', 'child'], min_age_months: 96, max_age_months: 216,
    sources: [S.fsjPremieres, S.fsjAge, S.ameliRegles],
    body_md: `## En bref
- Les premières règles arrivent le plus souvent **entre 10 et 15 ans**, en moyenne vers 12-13 ans, mais certaines filles sont réglées avant 10 ans et d’autres plus tard.
- Elles viennent en général **environ deux ans après** le début du développement des seins et des poils du pubis.
- Le premier signe est souvent une **petite tache de sang** dans la culotte ou en allant aux toilettes, rouge ou plutôt marron.
- Avoir ses règles veut dire qu’une **grossesse devient possible**, même dès un premier rapport non protégé.
- Garde **une protection dans ton sac** dès le début de la puberté : tu seras tranquille le jour J.

## Comprendre
Chaque mois, à partir de la puberté, la paroi intérieure de l’utérus (l’endomètre) s’épaissit pour accueillir une éventuelle grossesse. S’il n’y a pas de fécondation, cette muqueuse se détache et s’écoule par le vagin : ce sont les règles. Elles durent en général 3 à 6 ou 7 jours et sont souvent plus abondantes les premiers jours.

Les premières règles sont souvent discrètes : quelques traces de sang, parfois un peu épais, dont la couleur va du rouge au marron. Fil santé jeunes rappelle que la couleur ne dit rien de ta santé. Tu peux aussi remarquer, dans les mois qui précèdent, des pertes blanches ou jaunâtres dans ta culotte : elles font partie des changements de la puberté.

Au début, il est fréquent que les règles soient **irrégulières** : rapprochées, puis absentes pendant plusieurs mois. Le cycle se règle souvent en un à deux ans, parfois plus. Chacune a son propre rythme : ce n’est pas parce que tes amies sont réglées que tu es « en retard ».

## Au quotidien
- **Prépare une petite trousse** : une ou deux serviettes (ou la protection que tu préfères), une culotte de rechange, quelques mouchoirs. Glisse-la dans ton sac de cours.
- **Choisis ta protection** : les serviettes sont souvent les plus simples pour commencer. Les tampons (les plus fins conviennent souvent au début), la coupe menstruelle et la culotte menstruelle sont aussi possibles. Lis toujours la notice.
- **Change ta protection régulièrement**. Un tampon se change toutes les 4 à 6 heures et ne se porte pas la nuit, à cause du risque rare mais grave de choc toxique.
- **Au collège ou au lycée**, l’infirmerie peut souvent te dépanner en protections et t’accueillir si tu as mal.
- **Note tes dates** dans un carnet, un calendrier ou dans l’app : tu verras ton rythme se dessiner peu à peu.
- **Tu peux continuer tes activités**, sport compris : les règles n’obligent pas à t’arrêter.
- **Parles-en à quelqu’un de confiance** : ta mère, ton père, une sœur, une tante, l’infirmière scolaire… Les personnes qui ont leurs règles savent souvent de quoi tu parles, mais un homme peut aussi t’aider si tu le souhaites.

## Questions fréquentes
**Est-ce que ça fait mal ?** Les premières règles sont souvent peu douloureuses, mais chacune est différente. Tu peux ressentir des crampes dans le ventre, des douleurs dans le dos, des seins sensibles, un ventre gonflé, des boutons ou des maux de tête. Une bouillotte, une douche chaude ou un peu de marche aident souvent.

**Je me sens triste ou énervée avant mes règles, pourquoi ?** Les variations d’hormones peuvent jouer sur l’humeur : fatigue, irritabilité, tristesse, parfois quelques jours avant les règles. Si ça te gêne vraiment, parles-en à un adulte de confiance ou à un médecin.

**Et si mes règles arrivent en plein cours ?** Avec une protection adaptée, une tache ne se voit pas. Demande à aller aux toilettes ou à l’infirmerie. Une veste nouée autour de la taille dépanne aussi.

**J’ai 15 ans et toujours pas mes règles, je dois m’inquiéter ?** Certaines filles sont réglées plus tard. Si elles ne sont pas arrivées à 16 ans (ou si tu as d’autres questions avant), un rendez-vous chez un médecin, une sage-femme, un·e gynécologue ou au Planning familial permet de faire le point.

## Quand demander conseil
Une douleur qui t’empêche d’aller en cours ou de faire tes activités n’est pas à subir : parles-en à ton médecin, notamment lors des examens de suivi proposés entre 11 et 13 ans puis entre 15 et 16 ans. Consulte aussi si tes règles sont très abondantes ou très longues, si elles n’ont pas commencé à 16 ans, ou si elles disparaissent plus de 3 mois. Tu peux appeler Fil santé jeunes, gratuit et anonyme pour les 12-25 ans, au **0 800 235 236**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'parler-des-regles-a-sa-fille',
    title: 'Parler des règles à sa fille : quand commencer et quoi lui dire',
    summary: 'À quel âge aborder les règles avec ta fille, comment en parler simplement, quoi préparer avec elle et quand l’accompagner chez un professionnel.',
    tags: ['parler des règles', 'premières règles', 'fille', 'puberté', 'parents', 'éducation', 'ménarche', 'dialogue'],
    journeys: ['avoid', 'child'], min_age_months: 96, max_age_months: 192,
    sources: [S.cafParler, S.ameliRegles, S.ameliPuberteTardive],
    body_md: `## En bref
- En France, les premières règles arrivent **en moyenne vers 12 ans**, environ 18 à 24 mois après le début du développement des seins (souvent vers 9-10 ans).
- Une gynécologue interrogée par la Caf conseille d’**engager la discussion vers 9 ans**, avec des mots adaptés à son âge, car certaines filles sont réglées tôt.
- L’objectif : qu’elle **ne soit pas surprise** au premier saignement, et qu’elle sache que c’est une étape que vivent toutes les femmes, sans tabou.
- Préparez ensemble **une trousse** avec une ou deux protections à garder dans son sac.

## Comprendre
Les règles ne sont pas le premier signe de la puberté : chez la fille, tout commence le plus souvent par la poussée des seins, puis la pilosité. Les premières règles viennent ensuite, mais la date reste imprévisible. Une enfant qui n’a jamais entendu parler des règles peut avoir très peur en voyant du sang. Une enfant informée, au contraire, sait quoi faire et à qui le dire.

Parler des règles, c’est aussi transmettre qu’elles témoignent d’un corps en bonne santé et qu’elles n’empêchent pas de vivre : école, sport, sorties. Certaines jeunes filles ressentent au début de la honte ou une impression de saleté ; ameli.fr indique que ces sentiments s’estompent généralement en quelques mois, surtout quand on peut en parler librement à la maison.

## Au quotidien
- **Saisir les occasions** : une publicité, un paquet de serviettes dans la salle de bain, une question sur un livre… Ça évite le « grand discours » solennel.
- **Utiliser les vrais mots** : utérus, vagin, règles, protections. Tu peux t’appuyer sur un livre ou une bande dessinée adaptée à son âge (ameli.fr signale par exemple une BD gratuite sur la puberté sur santebd.org, à regarder d’abord toi-même).
- **Expliquer les protections** : serviettes, tampons, coupe, culotte menstruelle. Elle peut utiliser serviettes ou tampons dès le début ; les culottes menstruelles peuvent aider en cas de flux abondant. Montre-lui comment les utiliser et rappelle qu’il faut les changer régulièrement (un tampon, toutes les 4 à 6 heures, jamais plus de 8 heures, et pas la nuit).
- **Préparer le jour J** : une ou deux protections dans le sac dès le début de la puberté, une culotte de rechange, et le réflexe de filer à l’infirmerie si besoin.
- **Parler hygiène sans excès** : une toilette intime habituelle suffit, se laver trop peut déséquilibrer la flore vaginale.
- **Penser au budget** : depuis le 1er octobre 2026, certaines culottes et coupes menstruelles achetées en pharmacie peuvent être prises en charge pour les moins de 26 ans (voir ameli.fr pour les conditions).
- **Impliquer les deux parents** si possible : un père peut tout à fait en parler, acheter des protections et rassurer.

## Questions fréquentes
**Elle ne veut pas en parler avec moi, que faire ?** C’est fréquent à cet âge. Laisse un livre à disposition, dis-lui que tu es là, et propose-lui d’en parler à une sœur, une amie, une tante ou un professionnel de santé si elle préfère.

**Ses cycles sont très irréguliers, faut-il s’inquiéter ?** Au début, les cycles sont souvent longs et irréguliers, parfois espacés de deux ou trois mois. Ils se régularisent en général en un à deux ans. Noter les dates aide à y voir clair.

**Elle a très mal pendant ses règles, est-ce qu’elle doit « faire avec » ?** Non. Les règles douloureuses sont fréquentes chez les ados, mais une douleur qui l’empêche d’aller en cours ou qui ne passe pas avec un antalgique adapté mérite une consultation.

**Faut-il parler aussi de contraception ?** Les premières règles signifient qu’une grossesse est possible. Sans tout aborder d’un coup, tu peux lui dire qu’elle pourra toujours te poser la question, ou à un médecin, une sage-femme ou au Planning familial.

## Quand demander conseil
Consultez un médecin généraliste, un pédiatre, une sage-femme ou un·e gynécologue si les règles sont très douloureuses ou entraînent des absences scolaires, très abondantes ou très longues, si elles disparaissent plus de 3 mois, ou si elles ne sont pas apparues à 15 ans ou quatre ans après le début du développement des seins. Si des signes de puberté apparaissent avant 8 ans, parlez-en aussi au médecin. Fil santé jeunes (**0 800 235 236**) répond gratuitement aux 12-25 ans. ${URG}

${FIN}`,
  }),
  a({
    slug: 'premiers-cycles-irreguliers-adolescence',
    title: 'Cycles irréguliers à l’adolescence : ce qui est attendu et ce qui doit faire consulter',
    summary: 'Pourquoi les premiers cycles sont souvent irréguliers, combien de temps ça peut durer, comment les suivre et quels signes justifient un rendez-vous.',
    tags: ['cycle irrégulier', 'règles irrégulières', 'adolescente', 'premiers cycles', 'retard de règles', 'puberté', 'calendrier'],
    journeys: ['avoid', 'child'], min_age_months: 108, max_age_months: 216,
    sources: [S.ameliRegles, S.fsjAge, S.santeTroubles],
    body_md: `## En bref
- Après les premières règles, les cycles sont **souvent irréguliers** : règles rapprochées, puis absentes plusieurs mois.
- Ils deviennent généralement réguliers **en un à deux ans**, parfois plus.
- Chez l’adulte, un cycle dure en moyenne 28 jours ; ameli.fr situe l’intervalle habituel entre **21 et 35 jours**.
- **Noter les dates** de tes règles aide à repérer ton rythme et à répondre précisément au médecin.
- Une absence de règles **de plus de 3 mois**, des règles très abondantes ou très douloureuses justifient une consultation.

## Comprendre
Le cycle dépend d’un dialogue entre le cerveau (hypothalamus et hypophyse), les ovaires et l’utérus. À la puberté, ce dialogue se met en place progressivement : l’ovulation ne se produit pas forcément à chaque cycle au début. C’est surtout la première partie du cycle (avant l’ovulation) qui varie en longueur, ce qui explique des règles tantôt en avance, tantôt très en retard.

Fil santé jeunes rappelle que les règles peuvent être rapprochées ou absentes plusieurs mois au départ, et que le cycle se stabilise au bout de quelques années. La Caf, citant une gynécologue, précise qu’au début de la vie génitale les cycles sont souvent plus longs et peuvent atteindre deux ou trois mois.

D’autres facteurs peuvent aussi jouer, à tout âge : stress, fatigue, changement de rythme de vie, perte de poids rapide, troubles alimentaires, sport très intense. Et dès lors qu’il y a eu des rapports sexuels, un retard peut aussi signifier une grossesse.

## Au quotidien
- **Tiens un calendrier** : note le premier jour de chaque règle, leur durée, leur abondance (nombre de protections changées dans la journée) et les douleurs. L’app peut t’y aider.
- **Calcule la durée de ton cycle** : du premier jour des règles au premier jour des règles suivantes.
- **Aie toujours une protection sur toi**, puisque la date est imprévisible.
- **Prends soin de ton rythme** : sommeil suffisant, repas réguliers et variés, activité physique plaisir. Ça ne garantit pas un cycle régulier, mais ça aide le corps à fonctionner.
- **En cas de rapport sexuel**, un retard de règles doit faire penser à une grossesse : un test de grossesse urinaire (en pharmacie) lève le doute.

## Questions fréquentes
**Mes règles reviennent toutes les 3 semaines, c’est grave ?** Des cycles un peu courts peuvent se voir au début. Si les règles reviennent très souvent, sont très abondantes ou te fatiguent, parles-en à un médecin : des pertes de sang importantes peuvent faire baisser le fer.

**Je n’ai pas eu mes règles depuis 4 mois, que faire ?** Au-delà de 3 mois sans règles, ameli.fr recommande une consultation pour en chercher la cause. S’il y a eu un rapport, fais d’abord un test de grossesse.

**La pilule va-t-elle « régulariser » mon cycle ?** Une contraception hormonale donne des saignements réguliers, mais ce ne sont pas des règles au sens naturel, et elle ne traite pas la cause d’une irrégularité. Le choix d’une contraception se discute avec un professionnel.

**Est-ce que le sport peut couper les règles ?** Une activité physique très intensive, surtout avec une alimentation insuffisante, peut entraîner une absence de règles. Si c’est ton cas, parles-en à ton médecin ou au médecin du sport.

## Quand demander conseil
Consulte un médecin, une sage-femme ou un·e gynécologue si : tes règles sont absentes plus de 3 mois, elles n’ont pas commencé à 16 ans, elles sont très abondantes (protection à changer très souvent, caillots, fatigue) ou très longues, ou si la douleur t’empêche de vivre normalement. Si tu as une relation compliquée avec la nourriture ou ton poids, tu peux en parler à ton médecin ou à Fil santé jeunes (**0 800 235 236**). ${URG}

${FIN}`,
  }),
  a({
    slug: 'ovulation-signes-glaire-temperature',
    title: 'Ovulation : glaire, température, sensations… les signes que tu peux observer',
    summary: 'Comment se passe l’ovulation, quels signes (glaire cervicale, température au réveil, sensations) peuvent l’accompagner, et pourquoi les observer ne suffit pas comme contraception.',
    tags: ['ovulation', 'glaire cervicale', 'température basale', 'pertes blanches', 'période fertile', 'cycle', 'connaître son cycle'],
    journeys: ['avoid', 'ttc'],
    sources: [S.qsNaturelles, S.ameliRegles, S.ameliNaturelles],
    body_md: `## En bref
- L’ovulation, c’est la libération d’un ovule par un ovaire, déclenchée par un **pic d’hormone LH**. Dans un cycle de 28 jours, elle a lieu vers le **14e jour**, mais elle peut se décaler.
- Avant l’ovulation, la **glaire cervicale** devient plus abondante, fluide et filante.
- Après l’ovulation, la **température au réveil** monte légèrement.
- Observer ces signes aide à **connaître son corps**, mais ce n’est pas une contraception fiable sans formation : le stress, la fatigue ou un mauvais sommeil peuvent décaler l’ovulation.

## Comprendre
Pendant la première partie du cycle (phase folliculaire), un follicule mûrit dans l’ovaire sous l’effet de l’hormone FSH et produit des œstrogènes, qui épaississent la paroi de l’utérus. Les glandes du col de l’utérus fabriquent alors une glaire qui aide les spermatozoïdes à remonter. Puis un pic de LH provoque l’ovulation. Le follicule vide devient le « corps jaune » et produit de la progestérone : c’est la phase lutéale, qui dure en général 12 à 16 jours. Sans fécondation, la progestérone chute et les règles arrivent.

C’est surtout la phase avant l’ovulation qui varie. C’est pour ça qu’on ne peut pas prédire l’ovulation à coup sûr en comptant les jours. QuestionSexualité rappelle aussi que les spermatozoïdes peuvent survivre **jusqu’à 5 jours**, ce qui élargit la période où un rapport peut conduire à une grossesse.

## Au quotidien
Voici ce que tu peux observer, si ça t’intéresse de mieux connaître ton cycle :
- **La glaire cervicale** : après les règles, la glaire apparaît puis devient plus abondante, fluide et filante à l’approche de l’ovulation. On l’observe matin et soir sur le papier toilette ou la culotte, ou par le toucher.
- **La température au réveil** : prise chaque matin à la même heure, avant de se lever, elle monte légèrement après l’ovulation et reste plus haute jusqu’aux règles. Elle confirme donc l’ovulation **après coup**.
- **La position du col** : certaines méthodes y ajoutent la palpation du col de l’utérus.
- **Les sensations** : certaines personnes ressentent une petite gêne d’un côté du bas-ventre au milieu du cycle (voir l’article sur la douleur d’ovulation).
- **Les tests d’ovulation** vendus en pharmacie mesurent les variations hormonales du cycle dans les urines.

Note tout dans ton calendrier ou dans l’app : au fil des mois, tu verras se dessiner ton propre rythme.

## Questions fréquentes
**Peut-on utiliser ces signes comme contraception ?** Les méthodes dites naturelles existent (glaire, températures, méthode symptothermique qui combine les deux). Selon QuestionSexualité, elles demandent une formation, souvent 12 cycles d’observation et l’abstinence ou une méthode barrière pendant une partie du cycle. Elles sont moins efficaces en pratique que les méthodes médicalisées, déconseillées en cas de cycles irréguliers, à l’adolescence et en périménopause, et ne protègent pas des IST. Si tu veux éviter une grossesse, parles-en à un professionnel pour choisir une méthode adaptée.

**Mes pertes changent au cours du mois, est-ce une infection ?** Une glaire transparente et filante autour de l’ovulation est un phénomène du cycle. En revanche, des pertes qui sentent mauvais, changent de couleur (verdâtre, grisâtre) ou s’accompagnent de démangeaisons, brûlures ou douleurs justifient une consultation.

**Et si je veux un bébé ?** Repérer la glaire filante peut t’aider à situer ta période fertile. Si la grossesse tarde à venir, parles-en à ton médecin ou à une sage-femme.

**J’ai une contraception hormonale : est-ce que j’ovule ?** Selon la méthode, l’ovulation peut être bloquée (pilule combinée, patch…) ou non ; les signes observés n’ont alors pas la même signification.

## Quand demander conseil
Consulte si tu as des pertes inhabituelles (odeur, couleur, démangeaisons), des saignements entre les règles, des cycles très irréguliers ou une douleur pelvienne qui te gêne au quotidien : une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ après une naissance, une fausse couche, une IVG
  a({
    slug: 'retour-de-couches-allaitement-cycle',
    title: 'Retour de couches : quand reviennent les règles, avec ou sans allaitement',
    summary: 'Ce qu’est le retour de couches, pourquoi l’allaitement le retarde, pourquoi une grossesse reste possible avant les premières règles et quand consulter.',
    tags: ['retour de couches', 'règles après accouchement', 'allaitement', 'post-partum', 'MAMA', 'ovulation après bébé', 'contraception après accouchement'],
    journeys: ['avoid', 'newborn'],
    sources: [S.ameliContraPostPartum, S.santeTroubles, S.ameliAmenorrhee],
    body_md: `## En bref
- Le **retour de couches**, ce sont les premières règles après l’accouchement.
- **Sans allaitement**, l’ovulation ne reprend pas avant le 21e jour après la naissance ; Santé.fr indique un retour des règles attendu en général **4 à 8 semaines** après l’accouchement.
- **Avec allaitement**, la prolactine produite lors des tétées bloque l’ovulation : les règles reviennent souvent **plus tard**, parfois à l’arrêt de l’allaitement.
- **Une grossesse est possible avant les premières règles**, puisque l’ovulation précède les règles : ameli.fr conseille une contraception dès le 21e jour si tu ne souhaites pas de nouvelle grossesse.
- La fatigue ou une dépression peuvent aussi retarder le retour des règles.

## Comprendre
Pendant la grossesse, le cycle est suspendu. Après l’accouchement, il se remet en route progressivement. Les saignements des premières semaines (les lochies) ne sont pas des règles : ce sont les suites de l’accouchement, le temps que l’utérus retrouve sa taille.

Quand tu allaites, la succion du bébé déclenche la production de prolactine, une hormone qui bloque l’ovulation. Plus les tétées sont fréquentes, jour et nuit, plus cet effet est marqué. Dès que les tétées s’espacent (introduction de biberons, nuits plus longues, diversification, reprise du travail), l’ovulation peut revenir, souvent sans prévenir.

Le premier cycle peut être différent de ceux d’avant : règles plus abondantes, plus longues ou plus courtes, cycle irrégulier pendant quelque temps. Chaque corps retrouve son rythme à sa façon.

## Au quotidien
- **Note la date de la fin des lochies** et celle de tes premières règles dans l’app : ce sera utile pour ton suivi.
- **Parle contraception tôt** avec la sage-femme ou le médecin, idéalement à la maternité ou lors de la consultation postnatale : le choix dépend notamment de l’allaitement.
- **Connais les conditions de la MAMA** (méthode de l’allaitement maternel et de l’aménorrhée) : bébé de moins de 6 mois, allaitement exclusif au sein à la demande jour et nuit (sans longues pauses entre les tétées), et aucune règle depuis l’accouchement. Dès qu’une condition n’est plus remplie, il faut une autre contraception.
- **Prévois des protections** pour le retour de couches, qui peut surprendre par son abondance.
- **Prends soin de toi** : sommeil autant que possible, alimentation variée, aide de l’entourage.

## Questions fréquentes
**J’allaite et je n’ai pas mes règles depuis 8 mois, est-ce un problème ?** Pendant l’allaitement, l’absence de règles est attendue selon ameli.fr. Pense seulement à une contraception si tu ne souhaites pas de grossesse, et parles-en à ton médecin si tu as un doute.

**Peut-on tomber enceinte avant le retour de couches ?** Oui. L’ovulation a lieu environ deux semaines avant les règles : on peut donc ovuler, et être enceinte, sans avoir revu ses règles.

**Mes règles sont revenues alors que j’allaite encore, est-ce que mon lait va changer ?** Le retour des règles ne t’oblige pas à arrêter d’allaiter. En revanche, la MAMA ne fonctionne plus comme contraception à partir de ce moment.

**Mon retour de couches est très abondant, est-ce attendu ?** Les premières règles peuvent être plus abondantes que d’habitude. Mais des saignements qui imposent de changer de protection très souvent, avec des caillots, une fatigue intense, un malaise ou de la fièvre, nécessitent un avis rapide.

## Quand demander conseil
Consulte si tes règles ne sont pas revenues plusieurs semaines après l’arrêt de l’allaitement (ou 2 mois après l’accouchement sans allaitement), si tes saignements sont très abondants, malodorants ou accompagnés de fièvre ou de douleurs, ou si tu as un doute sur une grossesse (fais un test). Une douleur qui t’empêche de vivre normalement n’est pas à subir. Si tu te sens épuisée, triste ou envahie d’idées noires, parles-en vite à un professionnel ; le **3114** répond jour et nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'regles-apres-une-fausse-couche',
    title: 'Les règles après une fausse couche : à quoi t’attendre',
    summary: 'Saignements de la fausse couche, délai habituel avant les premières règles, reprise de l’ovulation, signes qui doivent faire consulter et soutien.',
    tags: ['fausse couche', 'règles après fausse couche', 'retour des règles', 'ovulation', 'saignements', 'deuil périnatal', 'cycle'],
    journeys: ['avoid', 'ttc'], safety_critical: true,
    sources: [S.ameliFausseCouche, S.citeFausseCouche, S.ameliAmenoConsult],
    body_md: `## En bref
- Les saignements de la fausse couche elle-même peuvent être légers ou abondants, durer plusieurs jours, voire **jusqu’à 15 jours** après un traitement médicamenteux.
- La Cité de la santé indique que l’ovulation revient souvent **2 à 4 semaines** après une fausse couche très précoce ; les premières règles arrivent alors **4 à 6 semaines** après, parfois **6 à 8 semaines**.
- Une **ovulation peut survenir avant les premières règles** : une nouvelle grossesse est possible tout de suite.
- Pendant les saignements, on évite les **tampons** ; ameli.fr conseille d’attendre environ deux semaines avant les rapports.
- Fièvre, saignements très abondants, douleurs qui augmentent : consulte sans attendre.

## Comprendre
Après une fausse couche, l’utérus doit d’abord se vider (spontanément, avec un médicament ou par un geste chirurgical), puis les hormones de grossesse (hCG) redescendent progressivement. Le cycle se remet en route ensuite : une ovulation, puis environ deux semaines plus tard, les règles.

Plus la grossesse était avancée et l’imprégnation hormonale forte, plus le retour des règles peut prendre du temps. Les premières règles peuvent aussi être un peu différentes : plus abondantes, plus douloureuses ou plus courtes. Le cycle retrouve souvent son rythme habituel au fil des mois suivants.

Une fausse couche isolée est suivie, en général, de grossesses sans difficultés. Si plusieurs fausses couches se répètent, un bilan médical est proposé.

## Au quotidien
- **Utilise des serviettes** plutôt que des tampons ou une coupe tant que les saignements de la fausse couche durent, pour limiter le risque d’infection.
- **Va à la consultation ou à l’échographie de contrôle** si elle est prévue : elle vérifie que l’utérus est bien vide.
- **Note le premier jour de tes saignements** et celui de tes premières règles dans l’app.
- **Si tu ne veux pas de grossesse tout de suite**, parle contraception avec le médecin ou la sage-femme dès maintenant.
- **Si tu souhaites une nouvelle grossesse**, elle peut être envisagée dès que tu te sens rétablie ; une consultation préconceptionnelle permet de faire le point.
- **Accorde-toi du temps** : la tristesse, le sentiment de vide ou la culpabilité sont fréquents après une fausse couche. Tu as le droit d’en parler et d’être aidée.

## Questions fréquentes
**Comment distinguer les saignements de la fausse couche et les premières règles ?** Les saignements de la fausse couche commencent avec elle et diminuent progressivement. Les règles reviennent après un intervalle sans saignement. En cas de doute, demande conseil.

**Mes règles ne sont pas revenues 8 semaines après, et mon test est négatif.** Le délai varie. Si tu dépasses largement ces repères, ou si tu as des symptômes, consulte : le professionnel pourra vérifier la situation, notamment le taux d’hormones, et répondre à ta situation précise.

**Le test de grossesse reste positif après la fausse couche, pourquoi ?** Les hormones de grossesse mettent un certain temps à disparaître du sang. Seul le professionnel qui te suit peut interpréter ce résultat avec l’examen et l’échographie.

**Je suis de groupe Rhésus négatif, est-ce important ?** Oui : ameli.fr indique qu’un traitement anti-D est administré après la fausse couche dans ce cas. Signale-le à l’équipe.

## Quand demander conseil
Consulte rapidement en cas de fièvre, de frissons, de saignements abondants, de douleurs qui augmentent fortement ou si le traitement n’agit pas dans les 24 heures. Appelle le **15** ou le **112** en cas de saignements très abondants ou de signes de choc (faiblesse, vertiges, confusion, cœur qui s’accélère). Une douleur sévère et persistante dans le ventre, pouvant aller jusqu’à l’épaule, avec de petits saignements et une grande faiblesse, peut évoquer une grossesse extra-utérine : c’est une urgence. Si la peine devient trop lourde, le **3114** répond jour et nuit.

${FIN}`,
  }),
  a({
    slug: 'regles-et-cycle-apres-une-ivg',
    title: 'Saignements, règles et cycle après une IVG',
    summary: 'Combien de temps durent les saignements après une IVG, quand reviennent les règles et l’ovulation, pourquoi la visite de contrôle compte et quand consulter.',
    tags: ['IVG', 'règles après IVG', 'saignements après IVG', 'visite de contrôle', 'ovulation', 'contraception après IVG', 'avortement'],
    safety_critical: true,
    sources: [S.ivgApres, S.ameliApresIvg, S.ansmIvg],
    body_md: `## En bref
- Après une IVG, les saignements peuvent être **plus abondants que des règles** les premiers jours et durer **de quelques jours à trois semaines**.
- L’ovulation peut revenir **en moyenne 15 à 20 jours** après l’IVG : une **grossesse est possible avant le retour des règles**.
- Les règles reviennent en général **4 à 6 semaines** après, selon la contraception choisie.
- La **visite de contrôle** (14 à 21 jours après) est indispensable : les saignements seuls ne prouvent pas que l’IVG a fonctionné.
- Fièvre, douleurs du bas-ventre ou saignements inquiétants : consulte sans tarder.

## Comprendre
Que l’IVG soit médicamenteuse ou instrumentale, le corps doit éliminer la grossesse puis remettre son cycle en route. Les hormones de grossesse diminuent progressivement : c’est pour cela qu’un test urinaire peut rester positif jusqu’à trois semaines après, sans que cela signifie un échec.

L’ANSM rappelle que, pour l’IVG médicamenteuse, la visite de contrôle est obligatoire : c’est le seul moyen de confirmer l’efficacité (le risque d’échec est d’environ 5 %). Elle peut comprendre un examen clinique, une prise de sang (dosage des β-hCG) ou une échographie, pris en charge à 100 %.

Selon ivg.gouv.fr, le risque d’infertilité n’est pas lié à l’IVG elle-même mais à d’éventuelles complications, rares dans des conditions sécurisées.

## Au quotidien
- **Préfère les serviettes** : ivg.gouv.fr conseille de ne pas utiliser de tampons et d’attendre une dizaine de jours avant les rapports avec pénétration.
- **Note les dates** de tes saignements et de tes premières règles dans l’app.
- **Pense à la contraception dès maintenant** : aucune méthode n’est contre-indiquée après une IVG, sauf cas particulier. Une contraception hormonale peut débuter très vite, un DIU peut être posé selon la méthode d’IVG. Seuls les préservatifs protègent aussi des IST.
- **Avec une pilule combinée**, les saignements surviennent à la fin de la première plaquette ; **avec un DIU hormonal**, les règles peuvent devenir irrégulières ou absentes.
- **Garde la date de ta visite de contrôle** et n’hésite pas à poser tes questions ce jour-là.
- **Pour le Rhésus négatif**, une injection d’anti-D est prévue : signale ton groupe sanguin.

## Questions fréquentes
**Je ne saigne presque pas, est-ce que l’IVG a marché ?** L’abondance des saignements ne permet pas de conclure, dans un sens comme dans l’autre. Seule la visite de contrôle le confirme.

**Mes règles ne sont pas revenues 6 semaines après.** Le délai dépend de la contraception choisie. Sans contraception hormonale et sans règles, fais le point avec le professionnel qui t’a suivie : une nouvelle grossesse est possible dès l’ovulation.

**Est-ce que je pourrai avoir des enfants plus tard ?** ivg.gouv.fr indique que le risque d’infertilité n’est pas augmenté là où l’IVG est légale, y compris après deux IVG ou plus.

**Comment vais-je me sentir ?** Le vécu est personnel. Tu peux demander un entretien psycho-social, voir un psychologue ou appeler le numéro vert anonyme et gratuit « IVG, contraception, sexualités » : **0 800 08 11 11**.

## Quand demander conseil
Consulte sans tarder en cas de fièvre, de douleurs du bas-ventre ou de saignements vaginaux qui t’inquiètent dans les jours qui suivent. Une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG} Si tu ressens une grande détresse ou des idées noires, appelle le **3114**.

${FIN}`,
  }),
  // ------------------------------------------------------------ cycle et mode de vie
  a({
    slug: 'absence-de-regles-stress-poids-sport-intense',
    title: 'Plus de règles à cause du stress, d’une perte de poids ou du sport ?',
    summary: 'Comment le stress, une perte de poids, des troubles alimentaires ou un sport très intense peuvent suspendre le cycle, et quel bilan proposer après 3 mois sans règles.',
    tags: ['aménorrhée', 'plus de règles', 'stress', 'perte de poids', 'sport intensif', 'anorexie', 'troubles alimentaires', 'retard de règles'],
    sources: [S.fsjAmenorrhee, S.ameliAmenoConsult, S.qsCycle],
    body_md: `## En bref
- On parle d’**aménorrhée secondaire** quand les règles sont absentes **depuis plus de 3 mois** chez une personne qui était réglée.
- Avant tout, s’il y a eu un rapport, **un test de grossesse** lève le doute.
- Le cycle dépend du cerveau, des ovaires et de l’utérus : **stress prolongé, fatigue, choc émotionnel, perte de poids brutale, alimentation insuffisante, sport très intensif** peuvent le suspendre.
- Au-delà de 3 mois sans règles, **un bilan médical** est recommandé pour en trouver la cause.
- Prendre une pilule pour « faire revenir » les règles sans connaître la cause est déconseillé par ameli.fr.

## Comprendre
Le cerveau (hypothalamus et hypophyse) commande les ovaires grâce aux hormones FSH et LH. QuestionSexualité explique qu’un stress physique ou émotionnel augmente le cortisol, qui, à forte dose, peut suspendre temporairement le cycle. Le corps « met en pause » la fonction de reproduction quand il se sent en difficulté : manque d’énergie, épuisement, émotion forte.

Fil santé jeunes cite parmi les causes possibles : changement de rythme de vie, fatigue, stress prolongé, troubles ou carences alimentaires, perte de poids brutale, événement bouleversant, activité physique intensive, contraception hormonale ou certains médicaments. D’autres causes sont médicales (syndrome des ovaires polykystiques, problème de thyroïde ou d’hypophyse…) : c’est pourquoi on ne se contente pas de supposer.

Une absence de règles prolongée liée à un manque d’œstrogènes n’est pas anodine : ces hormones participent aussi à la solidité des os.

## Au quotidien
- **Fais un test de grossesse** en cas de rapport, même protégé.
- **Note dans l’app** la date de tes dernières règles, les changements récents (stress, examens, déménagement, deuil), ton alimentation, ton entraînement et ton poids si tu le suis.
- **Prépare la consultation** : ameli.fr conseille de pouvoir indiquer l’âge des premières règles de ta mère et de tes sœurs, tes cycles d’avant, ta contraception et la date de son arrêt, tes autres symptômes (acné, pilosité, bouffées de chaleur, écoulement des seins), ta pratique sportive et un éventuel régime restrictif.
- **Si tu fais beaucoup de sport**, veille à manger suffisamment pour couvrir tes dépenses et parles-en à ton médecin ou au médecin du sport.
- **Si le stress est en cause**, cherche ce qui peut t’aider à souffler : sommeil, pauses, activité plaisir, soutien d’un proche ou d’un professionnel.

## Questions fréquentes
**Quels examens peut-on me proposer ?** Selon ameli.fr : un examen général (poids, taille, IMC), parfois gynécologique avec ton accord, une courbe de température, un test aux progestatifs, des dosages hormonaux sanguins (estradiol, LH, FSH, prolactine…) et une échographie pelvienne. D’autres examens sont possibles selon la situation.

**Mes règles reviendront-elles toutes seules ?** Souvent, quand la cause est levée (reprise de poids, baisse de l’entraînement, période moins stressante), le cycle peut repartir. Mais seul le bilan permet de savoir ce qui se passe.

**Ma relation à la nourriture est compliquée.** Tu n’es pas seule. Parles-en à ton médecin : les troubles du comportement alimentaire se soignent, et l’absence de règles peut en être un signe.

**Sans règles, je ne peux pas tomber enceinte ?** Ne compte pas dessus : l’ovulation peut revenir avant les règles.

## Quand demander conseil
Consulte si tes règles sont absentes depuis plus de 3 mois, si tu n’as jamais eu de règles à 16 ans, si tu as perdu beaucoup de poids, si tu as des bouffées de chaleur avant 40 ans ou un écoulement par les seins. Une douleur qui t’empêche de vivre normalement n’est pas à subir. Si tu te sens à bout ou envahie d’idées noires, appelle le **3114**. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ maladies gynécologiques fréquentes
  a({
    slug: 'fibromes-uterins-comprendre-et-traiter',
    title: 'Fibromes utérins : comprendre, surveiller, traiter',
    summary: 'Ce que sont les fibromes de l’utérus, les symptômes qu’ils peuvent donner, pourquoi certains ne se traitent pas et comment se prend la décision quand un traitement est utile.',
    tags: ['fibrome', 'myome', 'fibrome utérin', 'règles abondantes', 'ménorragie', 'myomectomie', 'embolisation', 'hystérectomie'],
    sources: [S.hasFibromes, S.santeTroubles],
    body_md: `## En bref
- Les fibromes (ou myomes) sont des **tumeurs bénignes** du muscle de l’utérus ; la HAS précise qu’ils ne se transforment pas en cancer.
- Ils sont **très fréquents** : 20 à 30 % des femmes de plus de 30 ans, davantage après 40 ans.
- Beaucoup ne donnent **aucun symptôme**. Quand ils en donnent : **règles abondantes** ou saignements irréguliers, douleurs ou sensation de pesanteur dans le bassin, parfois des difficultés à concevoir.
- **Sans symptôme, pas de traitement** en général. Avec des symptômes, on commence le plus souvent par des médicaments.
- Les fibromes arrêtent de grossir après la ménopause et peuvent alors régresser.

## Comprendre
Un fibrome se développe à partir des cellules musculaires de l’utérus. Il peut y en avoir un seul ou plusieurs, de quelques millimètres à plus de 20 cm. Leur emplacement compte : ceux qui déforment la cavité de l’utérus (sous-muqueux) donnent plus souvent des règles abondantes ; ceux qui poussent vers l’extérieur peuvent appuyer sur la vessie ou le rectum.

Les symptômes concernent 20 à 50 % des femmes ayant des fibromes. Des règles très abondantes peuvent entraîner une fatigue et une baisse du fer. L’évolution est imprévisible : certains fibromes restent stables, d’autres grossissent.

## Au quotidien
- **Suis tes règles dans l’app** : durée, abondance (nombre de protections changées par jour, débordements la nuit, caillots), douleurs. C’est précieux pour le médecin.
- **Repère la fatigue** : essoufflement, pâleur, grande lassitude peuvent signaler un manque de fer en cas de règles abondantes.
- **Prépare les rendez-vous** : note tes questions sur les options, la fertilité, la sexualité, l’arrêt de travail.
- **Si un traitement non médicamenteux est discuté**, la HAS décrit plusieurs options, sans hiérarchie entre elles :
  - la **myomectomie** (retirer les fibromes en gardant l’utérus), par les voies naturelles (hystéroscopie), cœlioscopie ou ouverture du ventre ;
  - l’**embolisation des artères utérines**, réalisée par un radiologue, qui réduit l’apport de sang au fibrome ;
  - l’**hystérectomie** (retrait de l’utérus), traitement radical ;
  - la destruction de la muqueuse de l’utérus (endométrectomie) dans certains cas, quand il n’y a plus de projet de grossesse.
- **La décision se prend avec toi** : tu as droit à une information complète, à un temps de réflexion et à exprimer tes priorités (garder ton utérus, projet de grossesse, durée de récupération).

## Questions fréquentes
**Faut-il faire une échographie régulière si mon fibrome ne me gêne pas ?** La HAS indique qu’une échographie systématique n’est pas utile en cas de fibrome sans symptôme. Ton médecin adapte le suivi à ta situation.

**Un fibrome empêche-t-il d’avoir un enfant ?** Pas forcément. Certains fibromes, surtout ceux qui déforment la cavité utérine, peuvent jouer sur la fertilité. Si tu as un projet de grossesse, dis-le : cela change les options proposées.

**Combien de temps d’arrêt après une intervention ?** À titre indicatif, la HAS mentionne environ une semaine après une embolisation, 2 à 4 semaines après une myomectomie et environ un mois après une hystérectomie.

**Mon fibrome va-t-il disparaître à la ménopause ?** Sa croissance s’arrête après la ménopause et il régresse souvent.

## Quand demander conseil
Consulte si tes règles deviennent plus abondantes ou plus longues, si tu saignes entre les règles, si tu as des douleurs ou une pesanteur dans le bassin, des envies fréquentes d’uriner ou une grande fatigue. Une douleur qui t’empêche de vivre normalement n’est pas à subir. Tout saignement après la ménopause doit faire consulter. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ endométriose et adénomyose
  a({
    slug: 'endometriose-comprendre-symptomes',
    title: 'Endométriose : comprendre la maladie et reconnaître ses symptômes',
    summary: 'Ce qu’est l’endométriose, les douleurs et autres signes qui doivent y faire penser, pourquoi le diagnostic arrive souvent tard et vers qui te tourner.',
    tags: ['endométriose', 'règles douloureuses', 'dysménorrhée', 'douleurs pelviennes', 'douleur rapports', 'symptômes endométriose', 'maladie chronique'],
    sources: [S.santeEndo, S.ameliEndoSymptomes, S.santeEndoRegles],
    body_md: `## En bref
- L’endométriose est une **maladie inflammatoire chronique** : du tissu qui ressemble à la muqueuse de l’utérus se trouve en dehors de l’utérus et réagit aux hormones à chaque cycle.
- Elle concerne **environ une femme sur dix** en âge d’avoir des règles, selon Santé.fr.
- Le symptôme principal : des **règles douloureuses** qui reviennent à chaque cycle, ne cèdent pas à un antalgique simple et **empêchent les activités** (se lever, travailler, aller en cours).
- Autres signes possibles : douleurs pendant les rapports, douleurs pelviennes fréquentes, douleurs pour uriner ou aller à la selle pendant les règles.
- Le diagnostic est souvent tardif : ameli.fr évoque **8 à 10 ans** entre les premiers symptômes et la confirmation. En parler tôt change les choses.

## Comprendre
À chaque cycle, les lésions d’endométriose se comportent comme la muqueuse de l’utérus : elles saignent, provoquent une inflammation et peuvent laisser des cicatrices fibreuses et des adhérences entre les organes. Elles se situent surtout dans le bassin (ovaires, ligaments, rectum, vessie…), plus rarement ailleurs.

L’intensité de la douleur ne dépend pas de la taille des lésions mais de leur profondeur. Selon les organes touchés, ameli.fr décrit des **signes urinaires** (douleur en urinant, sang dans les urines pendant les règles) ou **digestifs** (douleur pour aller à la selle, sang dans les selles, sensation de tension douloureuse). Certaines formes sont silencieuses et découvertes lors d’un bilan, par exemple d’infertilité. Toutes les personnes atteintes ne sont pas concernées par l’infertilité.

La maladie suit le cycle hormonal : elle diminue et disparaît généralement après la ménopause.

## Au quotidien
- **Tiens un journal de tes douleurs** dans l’app : jour du cycle, intensité (de 0 à 10), localisation, ce qui t’a soulagée ou non, activités annulées. C’est l’outil le plus utile pour la consultation.
- **Note les autres symptômes** : douleurs aux rapports, troubles digestifs ou urinaires pendant les règles, saignements entre les règles, fatigue.
- **Ose dire que tu as mal.** Santé.fr rappelle que ces symptômes ne sont pas à banaliser. EndoFrance le formule ainsi : la douleur n’est pas « dans ta tête ».
- **Pour soulager en attendant**, la chaleur (bouillotte), le repos et un antalgique adapté peuvent aider ; si rien n’y fait, c’est justement un signal pour consulter.
- **Fais-toi accompagner** si tu le souhaites : une personne de confiance, une association de patientes (EndoFrance, ENDOmind…).

## Questions fréquentes
**Avoir des règles douloureuses, est-ce forcément de l’endométriose ?** Non. Beaucoup de personnes ont mal pendant leurs règles sans avoir d’endométriose, notamment lors des premiers cycles. Ce qui doit alerter : une douleur cyclique, qui résiste à un antalgique simple et empêche tes activités, ou qui s’accompagne d’autres symptômes.

**Peut-on avoir une endométriose à l’adolescence ?** Oui, elle peut se manifester dès les premières années de règles. Des douleurs importantes et répétées chez une ado, qui la font manquer les cours, méritent d’en parler au médecin.

**Est-ce que ça s’aggrave forcément ?** L’évolution varie d’une personne à l’autre. Les traitements visent à soulager les symptômes et à faire régresser les lésions.

**Qui consulter en premier ?** Ton médecin traitant, un·e gynécologue ou une sage-femme. Si besoin, ils t’orientent vers la filière endométriose de ta région.

## Quand demander conseil
Consulte si tes règles t’obligent à rester couchée, à manquer les cours ou le travail, si un antalgique simple ne suffit pas, si tu as mal pendant les rapports, ou si tu as des troubles digestifs ou urinaires qui reviennent avec les règles. Une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG}

${FIN}`,
  }),
  a({
    slug: 'endometriose-diagnostic-examens',
    title: 'Endométriose : comment se fait le diagnostic, étape par étape',
    summary: 'De la première consultation à l’échographie, l’IRM et le test salivaire : comment on confirme une endométriose et comment préparer tes rendez-vous.',
    tags: ['diagnostic endométriose', 'échographie endovaginale', 'IRM pelvienne', 'cœlioscopie', 'test salivaire', 'filière endométriose', 'examen gynécologique'],
    sources: [S.santeEndoExamens, S.ameliEndoSymptomes, S.santeEndoTest],
    body_md: `## En bref
- Tout commence par une **consultation** : médecin traitant, gynécologue ou sage-femme, qui écoute tes symptômes et t’examine si besoin.
- L’**échographie pelvienne**, de préférence endovaginale, est souvent le premier examen d’imagerie ; l’**IRM** précise les lésions profondes.
- Un **examen normal n’exclut pas** la maladie : d’autres examens peuvent être prescrits.
- La **cœlioscopie** n’est plus recommandée pour le seul diagnostic : on la réserve aux situations où une chirurgie est justifiée.
- Un **test salivaire** est pris en charge de façon temporaire, en troisième intention, pour les diagnostics complexes.

## Comprendre
Le diagnostic de l’endométriose est difficile parce que les symptômes sont variés et se confondent avec ceux d’autres troubles. Santé.fr insiste : en cas de doute, il faut en parler rapidement, car une détection précoce permet un accompagnement plus adapté. Les **filières endométriose** régionales organisent un parcours de soins de proximité.

Les examens possibles :
- **Examen gynécologique** (toucher vaginal et/ou rectal) : le plus souvent utile pour orienter. Il doit t’être expliqué à l’avance, respecter ton intimité et se faire avec ton accord ; tu peux dire stop.
- **Échographie pelvienne** : avec une sonde endovaginale, elle donne des images de très bonne qualité. Elle repère bien les kystes de l’ovaire liés à l’endométriose, mais peut passer à côté d’autres lésions.
- **IRM pelvienne** : elle détecte kystes, nodules et lésions profondes et précise leur emplacement, notamment avant une chirurgie.
- **Examens complémentaires** dans certaines formes profondes : échographie endorectale, examens du rein et des voies urinaires, scanner spécifique du côlon.
- **Cœlioscopie** : petite caméra introduite par le nombril, qui permet de voir les lésions, de prélever et de traiter. Elle n’est plus faite uniquement pour poser le diagnostic.
- **Test salivaire** : il analyse l’ARN de la salive. Depuis février 2025, il est pris en charge dans un cadre dérogatoire et temporaire (forfait innovation), en troisième intention, quand l’imagerie est négative ou incertaine.

## Au quotidien
- **Apporte ton journal de cycle et de douleurs** (l’app peut t’aider à le tenir) : dates des règles, intensité, traitements essayés.
- **Note tes questions** avant le rendez-vous : quels examens, pourquoi, quels délais, qui lira les images.
- **Demande si l’échographiste ou le radiologue a l’habitude de l’endométriose** : la qualité de l’examen dépend beaucoup de l’expérience.
- **Pour l’examen**, ameli.fr indique que le ou la gynécologue examine si possible pendant les règles ; pour rechercher une adénomyose, l’échographie est plutôt faite en deuxième partie de cycle.
- **Fais-toi accompagner** si tu le souhaites, et n’hésite pas à demander un deuxième avis.

## Questions fréquentes
**Mon échographie est normale mais j’ai toujours mal.** Une échographie normale n’exclut pas une endométriose, en particulier certaines lésions superficielles. Parles-en : une IRM ou un avis dans une filière spécialisée peuvent être proposés, et la douleur se traite même sans diagnostic définitif.

**L’examen gynécologique m’angoisse.** Dis-le. Le professionnel doit t’expliquer pourquoi il le propose, peut adapter sa façon de faire et s’arrêter si tu le demandes.

**Le test salivaire remplace-t-il les autres examens ?** Non. Il intervient après la consultation et l’imagerie, quand le diagnostic reste incertain, et son évaluation est encore en cours.

**Combien de temps pour avoir un diagnostic ?** Le délai a longtemps été très long. Tenir un journal précis et consulter tôt aident à raccourcir le parcours.

## Quand demander conseil
Consulte si tes règles sont douloureuses au point de t’empêcher de vivre normalement, si tu as mal pendant les rapports, ou si tu as des troubles digestifs ou urinaires qui reviennent pendant les règles. Une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG}

${FIN}`,
  }),
  a({
    slug: 'endometriose-traitements-options',
    title: 'Endométriose : les traitements possibles et comment ils agissent',
    summary: 'Traitements de la douleur, traitements hormonaux, chirurgie et approches complémentaires : ce que proposent les sources officielles et comment se décide le traitement.',
    tags: ['traitement endométriose', 'traitement hormonal', 'chirurgie endométriose', 'antalgiques', 'centre antidouleur', 'cœlioscopie', 'ALD 31'],
    sources: [S.ameliEndoTraitement, S.santeEndo],
    body_md: `## En bref
- Le traitement est **personnalisé** : sans symptôme, une simple surveillance est possible ; avec des symptômes, on associe le plus souvent **traitement hormonal et traitement de la douleur**.
- Les traitements hormonaux **arrêtent les règles** : sans saignement des lésions, la douleur diminue et les lésions régressent. Les cicatrices fibreuses, elles, ne régressent pas.
- La douleur se traite **tôt et par paliers**, avec un suivi médical.
- La **chirurgie** est réservée à certaines situations (douleur invalidante malgré les médicaments, infertilité avec projet de grossesse) et doit être faite par des équipes expertes.
- Les formes sévères peuvent ouvrir droit à une **prise en charge à 100 % (ALD hors liste)** sous conditions.

## Comprendre
**Les traitements hormonaux.** Ameli.fr cite en première intention des traitements progestatifs (pilule progestative, implant, progestatif plus puissant), choisis avec toi selon tes contre-indications, ta santé et tes préférences. D’autres options existent en troisième intention, comme les analogues de la GnRH, qui mettent le corps au repos hormonal pendant quelques mois ; leurs effets (bouffées de chaleur, fragilisation des os) sont compensés par un apport hormonal sous contrôle médical. Ameli.fr signale aussi que deux progestatifs (acétate de chlormadinone et acétate de nomégestrol) exposent à un **risque de méningiome** en traitement prolongé : si tu en prends, parles-en à ton médecin.

**Le traitement de la douleur.** Une douleur non soulagée durablement rend le système nerveux plus sensible. D’où l’intérêt de la traiter tôt, par paliers, en évitant les anti-inflammatoires au long cours. Pour les douleurs chroniques, d’autres médicaments à visée antalgique peuvent être proposés, et un **centre antidouleur** peut prendre le relais en cas de douleurs rebelles.

**La chirurgie.** Souvent par cœlioscopie, elle détruit ou retire les lésions. Elle se prépare avec plusieurs spécialistes (gynécologue, urologue, chirurgien digestif…). Sans projet de grossesse, un traitement hormonal est en général prescrit ensuite pour limiter le risque de récidive.

**Les approches complémentaires** (acupuncture, ostéopathie douce, yoga, hypnose) peuvent compléter la prise en charge médicale, sans la remplacer. En cas de troubles digestifs associés, un accompagnement diététique est souvent utile.

## Au quotidien
- **Ne modifie pas un traitement seule** : parles-en à ton médecin si les effets indésirables te gênent, d’autres options existent.
- **N’associe pas plusieurs antalgiques** sans avis médical et respecte les durées indiquées.
- **Évalue ce qui marche** : note dans l’app ton niveau de douleur avant et après un changement de traitement.
- **Pose toutes tes questions** : effets sur la fertilité, la sexualité, la durée du traitement, les alternatives. La décision se partage.
- **Renseigne-toi sur l’ALD 31** avec ton médecin si ta maladie est sévère et demande des soins nombreux et coûteux.

## Questions fréquentes
**Le traitement hormonal guérit-il l’endométriose ?** Il soulage et fait régresser les lésions tant qu’il est pris, mais la maladie peut récidiver. C’est une maladie chronique, qui se suit dans le temps.

**Et si je veux un enfant ?** Les traitements hormonaux qui bloquent les règles sont alors arrêtés ou adaptés. Le projet de grossesse change la stratégie : parles-en dès que possible (un article de l’app est dédié à endométriose et désir de grossesse).

**La chirurgie est-elle obligatoire ?** Non. Elle est proposée dans des situations précises, quand le bénéfice attendu dépasse les risques.

**Le sport peut-il aider ?** Le ministère des Sports propose une ressource « En mouvement avec l’endométriose », relayée par Santé.fr. Une activité adaptée, à ton rythme, peut faire partie de la prise en charge.

## Quand demander conseil
Consulte si ta douleur n’est pas contrôlée, si un traitement te pose problème ou si de nouveaux symptômes apparaissent (saignements digestifs ou urinaires, fièvre). Une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG} Si la douleur chronique pèse sur ton moral au point d’avoir des idées noires, appelle le **3114**.

${FIN}`,
  }),
  a({
    slug: 'endometriose-vivre-avec-travail-droits',
    title: 'Vivre avec l’endométriose : travail, droits, soutien au quotidien',
    summary: 'S’organiser avec une endométriose : aménagements au travail, médecin du travail, temps partiel thérapeutique, ALD, aides et soutien psychologique.',
    tags: ['vivre avec endométriose', 'travail', 'médecin du travail', 'temps partiel thérapeutique', 'ALD 31', 'aides sociales', 'soutien psychologique', 'associations'],
    sources: [S.santeEndo, S.santeEndoSoutien, S.santeEndoAides],
    body_md: `## En bref
- Les symptômes peuvent devenir **invalidants autour et pendant les règles** : s’appuyer sur un réseau de soutien (proches, aide à domicile, garde d’enfants, soutien psychologique) aide beaucoup.
- Au travail, tu peux rencontrer le **médecin du travail**, tenu au secret médical, qui peut proposer un **aménagement de poste**.
- **Parler ou non de ta maladie à ton employeur** est un choix personnel.
- Le **temps partiel thérapeutique** permet une reprise progressive après un arrêt.
- Certaines formes ouvrent droit à l’**ALD 31** (prise en charge à 100 % des soins liés à la maladie) ; d’autres aides existent selon la situation.

## Comprendre
L’endométriose est une maladie chronique dont les symptômes varient d’un mois à l’autre. Santé.fr note que certaines femmes voient leur vie professionnelle freinée par la douleur, surtout lorsque le poste impose de rester longtemps debout ou de se déplacer souvent. Vivre avec la maladie, c’est donc aussi organiser son quotidien et connaître ses droits.

**Côté droits** : l’endométriose ne figure pas sur la liste des ALD 30, mais certaines formes graves, évoluant depuis plus de 6 mois et nécessitant des soins coûteux, peuvent relever d’une ALD « hors liste » (ALD 31), demandée par ton médecin auprès de l’Assurance Maladie. Selon la situation, d’autres dispositifs peuvent être étudiés : pension d’invalidité, reconnaissance de la qualité de travailleur handicapé (RQTH), allocation aux adultes handicapés (AAH) via la MDPH.

## Au quotidien
- **Anticipe tes « mauvais jours »** grâce au suivi de cycle dans l’app : prévois des journées plus légères, du télétravail si c’est possible, des repas déjà prêts.
- **Prépare ton kit** : bouillotte, vêtements confortables, protections, traitement prescrit, bouteille d’eau.
- **Au travail** : prends rendez-vous avec le médecin du travail pour discuter d’aménagements (horaires, poste assis, pauses, télétravail). L’Anact propose des ressources pour les entreprises, relayées par Santé.fr.
- **Bouge à ton rythme** : le ministère des Sports a publié des repères « En mouvement avec l’endométriose » ; l’activité physique adaptée peut s’intégrer au parcours de soins.
- **Prends soin de ta santé mentale** : la douleur chronique fatigue et isole. Un psychologue, des techniques de relaxation ou des groupes de parole peuvent aider.
- **Rejoins une association** de patientes (EndoFrance, ENDOmind, Info-endométriose…) pour échanger et t’informer.
- **Dans le couple**, parle des douleurs pendant les rapports : il existe des solutions, et l’intimité ne se résume pas à la pénétration.

## Questions fréquentes
**Dois-je dire à mon employeur que j’ai une endométriose ?** Ce n’est pas obligatoire. Le médecin du travail, lui, est tenu au secret et peut demander des aménagements sans détailler ta maladie.

**Qu’est-ce que le temps partiel thérapeutique ?** C’est une reprise progressive à temps partiel après une maladie, prescrite par le médecin, qui permet de ne pas perdre de salaire selon les conditions prévues.

**Comment demander l’ALD 31 ?** C’est ton médecin traitant qui fait la demande auprès de l’Assurance Maladie, avec un protocole de soins, si ta situation correspond aux critères.

**Je me sens incomprise par mon entourage.** C’est un vécu fréquent. Partager des ressources fiables (Santé.fr, associations) ou proposer à un proche de t’accompagner en consultation peut aider à faire comprendre la maladie.

## Quand demander conseil
Consulte si ta douleur n’est plus contrôlée, si tu ne peux plus travailler ou étudier, ou si ton moral baisse fortement. Une douleur qui t’empêche de vivre normalement n’est pas à subir. Si tu as des idées noires, appelle le **3114**, gratuit, jour et nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'adenomyose-comprendre-symptomes-traitements',
    title: 'Adénomyose : l’« endométriose interne » de l’utérus',
    summary: 'Ce qu’est l’adénomyose, ses symptômes (règles abondantes, longues, douloureuses), comment on la diagnostique et quels traitements peuvent être proposés.',
    tags: ['adénomyose', 'endométriose interne', 'règles abondantes', 'règles longues', 'règles douloureuses', 'saignements entre les règles', 'utérus'],
    sources: [S.santeAdenomyose, S.santeEndoRegles],
    body_md: `## En bref
- L’adénomyose correspond à la présence de **tissu semblable à la muqueuse de l’utérus dans le muscle de l’utérus** (le myomètre). On la décrit souvent comme une « endométriose interne ».
- Elle est **fréquente** et **souvent silencieuse** : deux fois sur trois, elle ne donne aucun symptôme.
- Quand elle en donne : **règles abondantes et longues** (plus de 7 jours), **règles douloureuses**, **saignements entre les règles**.
- Le diagnostic repose sur l’**échographie** (idéalement endovaginale) et, si besoin, l’**IRM**.
- Seules les formes qui gênent sont traitées.

## Comprendre
Dans l’endométriose « classique », le tissu se développe hors de l’utérus. Dans l’adénomyose, il infiltre la paroi musculaire de l’utérus, au niveau de la zone de jonction entre la muqueuse et le muscle. Elle peut être diffuse, localisée (un ou quelques foyers) ou liée à une endométriose profonde voisine. Les deux maladies sont souvent associées, mais l’une n’entraîne pas forcément l’autre.

Longtemps, on pensait qu’elle concernait surtout les femmes de plus de 40 ans ayant eu plusieurs grossesses. Grâce à l’imagerie, elle est aujourd’hui diagnostiquée aussi chez des femmes plus jeunes. Selon l’article d’EndoFrance relayé par Santé.fr, le stérilet n’est pas un facteur de risque.

Côté symptômes, l’article cite des règles abondantes dans environ la moitié des cas, des règles douloureuses dans environ un tiers, et des saignements entre les règles dans environ un cas sur cinq. Certaines formes sont très douloureuses.

## Au quotidien
- **Mesure ton flux** : note dans l’app la durée des règles, le nombre de protections changées par jour, les débordements nocturnes, les caillots.
- **Surveille ta fatigue** : des règles abondantes répétées peuvent entraîner un manque de fer. Parles-en à ton médecin, qui pourra prescrire une prise de sang.
- **Prévois des protections adaptées** aux jours de fort flux (et pense à les changer régulièrement).
- **Prépare l’échographie** : pour l’adénomyose, elle est idéalement réalisée en deuxième partie de cycle.
- **Les traitements possibles**, selon ta situation et ton projet de grossesse : DIU hormonal (qui réduit les saignements), progestatif en continu, analogues de la GnRH avec apport hormonal associé, embolisation des artères utérines (qui conserve l’utérus, mais les symptômes peuvent revenir), et en dernier recours l’hystérectomie.

## Questions fréquentes
**Quelle différence avec un fibrome ?** Le fibrome est une boule bien délimitée de tissu musculaire ; l’adénomyose infiltre la paroi de l’utérus. Les symptômes se ressemblent (règles abondantes), et l’IRM permet de les distinguer.

**L’adénomyose empêche-t-elle d’avoir un enfant ?** Elle est souvent retrouvée lors de bilans d’infertilité et pourrait gêner l’implantation de l’embryon. Si tu as un projet de grossesse, parles-en : la prise en charge sera adaptée.

**Faut-il traiter une adénomyose découverte par hasard ?** Non : seules les formes qui donnent des symptômes sont traitées.

**Est-ce que ça disparaît à la ménopause ?** Comme l’endométriose, l’adénomyose dépend des hormones ; parles-en avec ton médecin pour savoir ce qui est attendu dans ta situation.

## Quand demander conseil
Consulte si tes règles durent plus de 7 jours, sont si abondantes que tu dois changer de protection très souvent ou te lever la nuit, si tu saignes entre les règles, si tu es très fatiguée ou si tes douleurs te gênent. Une douleur qui t’empêche de vivre normalement n’est pas à subir. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ SOPK, kystes
  a({
    slug: 'sopk-au-quotidien-symptomes-hygiene-de-vie',
    title: 'SOPK au quotidien : cycles, acné, pilosité, moral… ce qui peut aider',
    summary: 'Vivre avec un syndrome des ovaires polykystiques hors projet bébé : les symptômes, ce que l’hygiène de vie peut changer, les traitements des symptômes et le soutien psychologique.',
    tags: ['SOPK', 'syndrome des ovaires polykystiques', 'cycles irréguliers', 'acné', 'pilosité', 'hirsutisme', 'chute de cheveux', 'estime de soi'],
    sources: [S.ameliSopkSymptomes, S.ameliSopkTraitement],
    body_md: `## En bref
- Le SOPK est une **maladie chronique** liée à un **excès d’androgènes** (hormones dites masculines) produits par les ovaires, qui perturbe l’ovulation.
- Ses signes varient beaucoup : **cycles longs ou absents**, **pilosité excessive**, **acné** souvent inflammatoire, **chute de cheveux** sur le dessus du crâne, surpoids, fatigue, anxiété…
- Il n’existe **pas de traitement qui guérit** le SOPK, mais on peut **traiter les symptômes** et en limiter les conséquences, jusqu’à la ménopause.
- L’**hygiène de vie** (alimentation, activité physique, arrêt du tabac) a un vrai rôle ; le **soutien psychologique** est jugé indispensable par ameli.fr.

## Comprendre
Dans le SOPK, l’excès d’androgènes empêche l’ovulation de se faire régulièrement. Résultat : des cycles souvent de plus de 35 à 40 jours depuis l’adolescence, parfois une absence de règles. Les androgènes expliquent aussi les signes visibles : poils sur le visage, la poitrine, le dos (chez environ 70 % des femmes concernées), acné qui persiste après 20 ans, chute de cheveux.

Le diagnostic repose, chez l’adulte, sur au moins deux critères parmi trois : signes d’excès d’androgènes (visibles ou à la prise de sang), ovulation rare ou absente, ovaires d’aspect polykystique à l’échographie. Chez l’adolescente, on regarde les troubles du cycle qui persistent 1 à 2 ans après la puberté, associés à des signes d’excès d’androgènes ; l’échographie n’est pas utilisée à cet âge.

Le SOPK touche aussi l’image de soi : ameli.fr cite l’anxiété, l’humeur dépressive et une image négative de soi parmi les symptômes possibles.

## Au quotidien
- **Suis ton cycle dans l’app** : même irrégulier, il est utile de noter les dates de règles, les longues périodes sans règles et tes symptômes.
- **Alimentation** : privilégie une alimentation équilibrée, en limitant sucres rapides et graisses. Pas besoin de régime restrictif ; avance pas à pas.
- **Activité physique** : bouger davantage est recommandé à l’adolescence comme à l’âge adulte. Choisis une activité qui te plaît pour qu’elle dure.
- **Poids** : en cas de surpoids, ameli.fr indique qu’une perte d’environ 10 % du poids initial peut réduire l’excès d’androgènes, améliorer les cycles et l’humeur. Un accompagnement (médecin, diététicien) aide à y arriver sans culpabilité.
- **Tabac** : l’arrêt est recommandé pour protéger ton cœur et tes vaisseaux.
- **Moral** : parles-en. Le dispositif « Mon soutien psy » permet des séances chez un psychologue prises en charge par l’Assurance Maladie.
- **Peau et cheveux** : parles-en à ton médecin ou à un dermatologue avant d’enchaîner les produits ; des traitements médicaux existent.

## Questions fréquentes
**Quels traitements pour l’acné et la pilosité ?** Ameli.fr cite en première intention une pilule œstroprogestative, qui régule aussi les cycles. D’autres médicaments peuvent être proposés si besoin. Certains exposent à des risques (thrombose, méningiome) et sont réévalués chaque année : pose toutes tes questions à ton médecin.

**Pourquoi est-il important d’avoir des règles régulièrement ?** Des cycles très espacés sans ovulation peuvent laisser la muqueuse de l’utérus s’épaissir. Rétablir des saignements réguliers protège l’endomètre ; c’est un des objectifs du traitement.

**Le SOPK disparaît-il ?** C’est une maladie chronique. Les symptômes liés au cycle peuvent s’améliorer après la ménopause, mais les risques métaboliques, eux, peuvent persister : le suivi continue.

**Est-ce que je pourrai avoir des enfants ?** Le SOPK est une cause fréquente de difficultés à concevoir, mais des solutions existent. L’app propose un article dédié au SOPK et désir de grossesse.

## Quand demander conseil
Consulte si tes cycles sont très longs ou absents depuis plus de 3 mois, si la pilosité, l’acné ou la chute de cheveux apparaissent ou s’aggravent vite, si tu prends du poids sans comprendre pourquoi, ou si tu te sens découragée, anxieuse ou triste. Une douleur qui t’empêche de vivre normalement n’est pas à subir. Si tu as des idées noires, appelle le **3114**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'sopk-sante-long-terme-suivi',
    title: 'SOPK : protéger ta santé sur le long terme (cœur, glycémie, endomètre, sommeil)',
    summary: 'Pourquoi le SOPK demande un suivi même sans projet de grossesse : risque de diabète, de syndrome métabolique, d’atteinte de l’endomètre, d’apnées du sommeil, et les examens réguliers utiles.',
    tags: ['SOPK', 'syndrome métabolique', 'diabète de type 2', 'insulinorésistance', 'cholestérol', 'apnée du sommeil', 'cancer de l’endomètre', 'suivi'],
    sources: [S.ameliSopkSymptomes, S.ameliSopkTraitement, S.santeMenoSymptomes],
    body_md: `## En bref
- Au-delà des cycles et de la peau, le SOPK a des **effets métaboliques** : l’excès d’androgènes favorise la **prise de poids** et l’**insulinorésistance**.
- Il augmente le risque de **syndrome métabolique**, de **diabète de type 2**, de **foie gras** (stéatose) et d’**apnées du sommeil**, surtout en cas de surpoids.
- Des cycles très espacés exposent à un **risque accru de cancer de l’endomètre** : c’est une raison de traiter les troubles du cycle.
- Un **suivi régulier** de la glycémie, du cholestérol, de la tension et du poids est recommandé, y compris après la ménopause.

## Comprendre
**Le syndrome métabolique** associe, selon ameli.fr, un tour de taille élevé (plus de 80 cm chez la femme) à au moins deux autres éléments : triglycérides élevés, « bon » cholestérol (HDL) bas, tension artérielle élevée, glycémie à jeun élevée. C’est un facteur de risque d’angine de poitrine, d’infarctus et d’AVC. Le SOPK en augmente le risque.

**L’insulinorésistance**, c’est quand le corps répond moins bien à l’insuline. Elle peut se voir sur la peau sous forme de taches foncées et veloutées (nuque, aisselles, plis de l’aine), appelées acanthosis nigricans.

**L’endomètre** : sans ovulation régulière, la muqueuse de l’utérus est exposée aux œstrogènes sans le « contrepoids » de la progestérone, ce qui peut favoriser son épaississement. D’où l’objectif de rétablir des cycles ou des saignements réguliers.

Santé.fr rappelle qu’après la ménopause, les symptômes du SOPK peuvent s’améliorer, mais que **le risque cardiovasculaire peut persister** (diabète, cholestérol, hypertension, surpoids).

## Au quotidien
- **Fais ton bilan sanguin** quand il est prescrit : ameli.fr cite glycémie, parfois test d’hyperglycémie provoquée, insuline, cholestérol et triglycérides.
- **Fais vérifier ta tension** régulièrement (chez le médecin, en pharmacie).
- **Mesure ton tour de taille** de temps en temps, sans obsession : c’est un repère utile pour le médecin.
- **Bouge chaque jour** et limite le temps assise : ameli.fr recommande d’augmenter l’activité physique, à tout âge.
- **Mange équilibré** en limitant sucres rapides, boissons sucrées et graisses ; un diététicien peut t’accompagner.
- **Arrête le tabac** si tu fumes (Tabac info service : 39 89).
- **Parle de ton sommeil** : ronflements, pauses respiratoires signalées par ton ou ta partenaire, fatigue au réveil peuvent évoquer des apnées.
- **Note tes saignements** dans l’app : une longue absence de règles ou des saignements anormaux se signalent.

## Questions fréquentes
**Je suis mince, suis-je concernée ?** Les complications métaboliques sont plus fréquentes en cas de surpoids, mais le suivi reste conseillé : parles-en avec ton médecin pour adapter les examens.

**Un médicament peut-il être proposé pour la glycémie ?** Oui, si l’hygiène de vie ne suffit pas, ton médecin peut prescrire un traitement et t’en expliquer les effets possibles.

**Le SOPK donne-t-il un cancer ?** Le risque de cancer de l’endomètre est augmenté ; pour d’autres cancers gynécologiques, il est seulement suspecté et étudié. Traiter les troubles du cycle et signaler tout saignement anormal fait partie de la prévention.

**Faut-il continuer le suivi après la ménopause ?** Oui, car les risques cardiovasculaires et métaboliques peuvent persister.

## Quand demander conseil
Consulte si tu as très soif, urines beaucoup ou te sens très fatiguée, si tes règles sont absentes plus de 3 mois sans contraception, si tu as des saignements inhabituels, des ronflements avec fatigue au réveil, ou des taches foncées qui apparaissent sur la peau. Appelle le **15** ou le **112** en cas de douleur dans la poitrine, d’essoufflement brutal ou de signes d’AVC (visage déformé, bras faible, troubles de la parole).

${FIN}`,
  }),
  a({
    slug: 'kyste-ovaire-fonctionnel-organique',
    title: 'Kyste de l’ovaire : fonctionnel ou organique, surveiller ou opérer ?',
    summary: 'Ce qu’est un kyste de l’ovaire, la différence entre kyste fonctionnel et organique, comment se fait la surveillance et quels signes imposent une consultation en urgence.',
    tags: ['kyste ovaire', 'kyste ovarien', 'kyste fonctionnel', 'torsion ovaire', 'échographie pelvienne', 'douleur ovaire', 'cœlioscopie'],
    safety_critical: true,
    sources: [S.cngofKystes, S.santeTroubles, S.santeEndoExamens],
    body_md: `## En bref
- Un kyste de l’ovaire est une **poche de liquide** qui se forme sur ou dans un ovaire. La grande majorité sont **bénins**.
- Les **kystes fonctionnels** sont liés au fonctionnement de l’ovaire au cours du cycle et **disparaissent souvent d’eux-mêmes** ; on les reconnaît justement à leur disparition à l’échographie.
- Les **kystes organiques** (dont ceux liés à l’endométriose) persistent et peuvent nécessiter une intervention.
- L’**échographie**, de préférence par voie endovaginale, est l’examen de référence.
- Une **douleur brutale et intense** d’un côté du bas-ventre, avec nausées ou malaise, peut signaler une complication (torsion) : c’est une **urgence**.

## Comprendre
À chaque cycle, un follicule grossit dans l’ovaire avant de libérer l’ovule. Il arrive qu’il continue à grossir ou se remplisse de liquide : c’est un kyste fonctionnel. Il peut parfois allonger un cycle ; Santé.fr note qu’un cycle anormalement long avec douleurs des seins et du ventre, alors que le test de grossesse est négatif, peut être lié à un kyste de l’ovaire.

Les kystes organiques, eux, ne dépendent pas du cycle et ne disparaissent pas spontanément. Certains signes à l’échographie (taille importante, partie solide, cloisons, paroi épaisse) orientent le médecin vers un kyste organique. L’échographie endovaginale repère bien notamment les kystes liés à l’endométriose.

Selon les recommandations du CNGOF, pendant la période où l’on a ses règles et en l’absence de symptôme, une **surveillance de 1 à 3 cycles** avec contrôle échographique est souvent proposée avant d’envisager une chirurgie. Lorsqu’une intervention est utile, elle se fait le plus souvent par **cœlioscopie**, en retirant le kyste et en conservant l’ovaire quand c’est possible.

## Au quotidien
- **Fais l’échographie de contrôle** prévue, idéalement au moment du cycle indiqué par le médecin.
- **Note tes symptômes dans l’app** : douleurs (côté, intensité, moment du cycle), retard de règles, pesanteur, douleurs pendant les rapports.
- **Ne change pas de contraception de toi-même** : le CNGOF indique qu’il n’est pas recommandé de changer de pilule pour un kyste fonctionnel isolé et sans symptôme.
- **Garde les comptes rendus** d’échographie pour pouvoir comparer d’un examen à l’autre.
- **Connais les signes d’urgence** (ci-dessous) et n’hésite pas à les dire à tes proches.

## Questions fréquentes
**Un kyste peut-il être un cancer ?** La grande majorité des kystes sont bénins. Une petite proportion de kystes présumés bénins se révèle maligne, d’où l’importance de l’échographie et du suivi proposé par le médecin.

**Ma pilule empêche-t-elle les kystes ?** Selon le CNGOF, sous pilule faiblement dosée, des follicules continuent à se développer et un kyste fonctionnel reste possible. Un traitement hormonal n’est pas recommandé pour « faire disparaître » un kyste fonctionnel sans symptôme.

**Et après la ménopause ?** Des kystes peuvent aussi être découverts après la ménopause. La conduite à tenir est alors différente et se discute avec le gynécologue.

**Une ponction peut-elle suffire ?** Elle n’a pas montré d’intérêt par rapport à la simple surveillance pour un kyste fonctionnel sans symptôme.

## Quand demander conseil
Appelle le **15** ou le **112** en cas de douleur brutale et très intense dans le bas-ventre, surtout d’un seul côté, avec nausées, vomissements, malaise ou fièvre : il peut s’agir d’une torsion de l’ovaire ou, en cas de retard de règles, d’une grossesse extra-utérine. Consulte rapidement si tu as des douleurs pelviennes qui durent, une sensation de pesanteur, un ventre qui gonfle, des douleurs pendant les rapports ou des saignements inhabituels. Une douleur qui t’empêche de vivre normalement n’est pas à subir.

${FIN}`,
  }),
  // ------------------------------------------------------------ ménopause précoce et saignements après la ménopause
  a({
    slug: 'insuffisance-ovarienne-prematuree-menopause-precoce',
    title: 'Ménopause précoce ou insuffisance ovarienne prématurée : comprendre et être accompagnée',
    summary: 'Quand les règles s’arrêtent avant 40 ans : ce qu’est l’insuffisance ovarienne prématurée, comment on la diagnostique, pourquoi un traitement hormonal est proposé et ce qu’elle change pour la fertilité.',
    tags: ['ménopause précoce', 'insuffisance ovarienne prématurée', 'IOP', 'règles arrêtées avant 40 ans', 'bouffées de chaleur jeune', 'fertilité', 'don d’ovocytes'],
    journeys: ['avoid', 'ttc'],
    sources: [S.hasIop, S.santeMenoIdees, S.santeTroubles],
    body_md: `## En bref
- On parle d’**insuffisance ovarienne prématurée (IOP)** quand les règles deviennent rares ou s’arrêtent **plus de 4 mois avant 40 ans**, avec une prise de sang qui montre une FSH élevée (confirmée deux fois) et un estradiol bas.
- Elle concerne environ **1 à 2 % des femmes de 40 ans**, plus rarement avant.
- Signes possibles : **règles absentes ou espacées**, **bouffées de chaleur**, sueurs nocturnes, troubles du sommeil ou de l’humeur, sécheresse vaginale, baisse du désir.
- Un **traitement hormonal** est en général proposé, au moins jusqu’à l’âge habituel de la ménopause (vers 51 ans), pour protéger les os, le cœur et la qualité de vie.
- Le mot « insuffisance » ne veut pas dire que tout est définitif : une **grossesse spontanée reste possible** dans une petite proportion de cas.

## Comprendre
Les ovaires cessent de fonctionner normalement plus tôt que prévu. Les causes peuvent être génétiques (anomalies des chromosomes ou de certains gènes), auto-immunes, ou liées à une chirurgie des deux ovaires, une chimiothérapie ou une radiothérapie. Dans la majorité des cas (environ 60 à 70 % selon le protocole national), aucune cause n’est retrouvée.

Le diagnostic précoce est important, car le manque d’œstrogènes fragilise les os et augmente le risque cardiovasculaire. Le bilan comprend souvent un **caryotype** (étude des chromosomes), une recherche génétique ciblée, un bilan thyroïdien, parfois une échographie ; une densitométrie osseuse est faite au diagnostic.

Santé.fr distingue la ménopause dite anticipée (entre 40 et 45 ans) de l’IOP avant 40 ans, qui doit être prise en charge.

## Au quotidien
- **Note tes cycles dans l’app** : la date des dernières règles et la durée sans règles sont des informations clés.
- **Si tu as un traitement hormonal**, prends-le régulièrement et parles-en à ton médecin si tu as des effets gênants : il existe plusieurs façons de l’adapter. Le protocole national indique qu’il n’y a pas d’augmentation démontrée du risque de cancer du sein lorsque ce traitement est pris avant l’âge naturel de la ménopause.
- **Protège tes os** : activité physique régulière avec impacts (marche, danse), apports suffisants en calcium et vitamine D, pas de tabac.
- **Pense contraception** si tu ne veux pas de grossesse : la fonction des ovaires peut fluctuer. Parles-en avec ton médecin.
- **Sexualité** : en cas de sécheresse ou de douleur, des solutions existent (lubrifiants, traitements locaux, traitement hormonal).
- **Prends soin de ton moral** : l’annonce peut être un choc, surtout si tu avais un projet d’enfant. Un soutien psychologique et des groupes de parole sont recommandés.
- **Suivi annuel** : examen gynécologique et des seins, poids, tension, bilan thyroïdien.

## Questions fréquentes
**Puis-je encore avoir un enfant ?** Une grossesse spontanée survient dans environ 4 à 6 % des cas, sans qu’on puisse prédire qui sera concernée. Le don d’ovocytes est la principale option proposée en cas de projet d’enfant ; l’adoption est une autre voie.

**Le traitement hormonal est-il le même que celui de la ménopause ?** Le principe est proche (œstrogènes et progestatif pour protéger l’utérus), mais les objectifs et la durée diffèrent : il s’agit de remplacer des hormones qui manquent trop tôt.

**Mes sœurs ou mes filles sont-elles concernées ?** Si une cause génétique est retrouvée, une consultation de génétique peut être proposée à la famille.

**Ai-je fait quelque chose de mal ?** Non. Dans la plupart des cas, la cause n’est pas connue, et ce n’est la faute de personne.

## Quand demander conseil
Consulte si tes règles sont absentes plus de 3 mois avant 40 ans (après avoir écarté une grossesse), ou si tu as des bouffées de chaleur, des sueurs nocturnes et des cycles irréguliers à un âge jeune. Si tu as des idées noires, appelle le **3114**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'saignements-apres-la-menopause-consulter',
    title: 'Saignement après la ménopause : toujours consulter',
    summary: 'Pourquoi tout saignement survenant plus de 12 mois après les dernières règles doit faire consulter, quels examens peuvent être proposés et ce qu’il faut savoir sur le cancer de l’endomètre.',
    tags: ['saignement après ménopause', 'métrorragies', 'ménopause', 'cancer de l’endomètre', 'biopsie endomètre', 'hystéroscopie', 'pertes de sang'],
    safety_critical: true,
    sources: [S.santeMenoSymptomes, S.arcEndometre, S.curieEndometre],
    body_md: `## En bref
- On est ménopausée après **12 mois consécutifs sans règles** (hors contraception).
- **Tout saignement après ce délai** doit faire consulter un médecin, même s’il est léger, unique, ou s’il ressemble à quelques traces.
- Un saignement peut avoir plusieurs causes, mais c’est aussi le **principal signe d’alerte du cancer de l’endomètre**, diagnostiqué dans 95 % des cas après la ménopause.
- Détecté tôt, ce cancer a un **bon pronostic** : consulter vite fait vraiment la différence.

## Comprendre
Après la ménopause, la muqueuse de l’utérus (l’endomètre) ne se renouvelle plus chaque mois : il n’y a donc plus de raison de saigner. Un saignement peut avoir plusieurs origines (muqueuse fragilisée par le manque d’œstrogènes, polype, effet d’un traitement hormonal…), mais seul un examen permet de savoir.

La Fondation ARC rappelle que le cancer de l’endomètre est le deuxième cancer gynécologique le plus fréquent en France, qu’il survient le plus souvent entre 55 et 70 ans et que son symptôme principal est un **saignement vaginal anormal, en particulier après la ménopause**. Des pertes blanches inhabituelles ou des douleurs du bas-ventre peuvent l’accompagner. Il n’existe pas de dépistage organisé : c’est l’attention à ce signe et le suivi gynécologique qui permettent de le repérer tôt. Parmi les facteurs de risque cités : l’âge, l’obésité, l’hypertension, une prédisposition génétique, certains traitements hormonaux.

Santé.fr recommande aussi de consulter, dès la périménopause, en cas de saignements après les rapports, entre les règles ou inattendus, ou de règles très abondantes et rapprochées avec caillots.

## Au quotidien
- **Ne laisse pas passer** un saignement, même minime : prends rendez-vous rapidement avec ton médecin, ton ou ta gynécologue ou ta sage-femme.
- **Note dans l’app** la date de tes dernières règles, la date et l’aspect du saignement (traces, sang rouge, pertes rosées ou brunes), s’il a suivi un rapport.
- **Signale tes traitements** : traitement hormonal de la ménopause, traitement d’un cancer du sein, anticoagulants…
- **À quoi t’attendre** : un examen gynécologique et, selon la situation, un prélèvement de la muqueuse de l’utérus (biopsie), parfois réalisé en consultation, ou une **hystéroscopie** (examen de l’intérieur de l’utérus avec une petite caméra). Seule l’analyse du tissu permet de poser un diagnostic certain.
- **Garde tes dépistages à jour** (col de l’utérus, sein, côlon) : la ménopause est un bon moment pour faire le point.

## Questions fréquentes
**C’était juste quelques traces roses, dois-je vraiment consulter ?** Oui. La quantité ne dit pas la cause. Un rendez-vous permet de lever le doute.

**Je prends un traitement hormonal de la ménopause et je saigne.** Selon le schéma de traitement, des saignements peuvent être prévus. Mais des saignements inattendus ou qui changent doivent être signalés à ton médecin.

**Mes règles se sont arrêtées il y a 8 mois et reviennent.** Tant que les 12 mois sans règles ne sont pas atteints, on est en périménopause et des règles peuvent revenir. Des saignements très abondants, rapprochés, avec caillots ou après les rapports méritent toutefois une consultation.

**J’ai peur du résultat.** C’est compréhensible. Un saignement n’est pas synonyme de cancer, et quand un cancer de l’endomètre est trouvé, il l’est le plus souvent à un stade précoce (environ trois quarts des cas selon la Fondation ARC), avec un bon pronostic.

## Quand demander conseil
Consulte rapidement pour tout saignement survenant plus de 12 mois après tes dernières règles, ou pour des pertes inhabituelles ou des douleurs pelviennes qui persistent. Appelle le **15** ou le **112** si le saignement est très abondant avec malaise, pâleur ou vertiges. Si l’inquiétude devient envahissante, parles-en à un proche ou à un professionnel.

${FIN}`,
  }),
  // ------------------------------------------------------------ périménopause et ménopause
  a({
    slug: 'perimenopause-reperer-les-premiers-signes',
    title: 'Périménopause : repérer les premiers signes, souvent dès la quarantaine',
    summary: 'Ce qu’est la périménopause, à quel âge elle commence, les changements possibles (cycles, bouffées de chaleur, sommeil, humeur) et pourquoi la contraception reste nécessaire.',
    tags: ['périménopause', 'préménopause', 'règles irrégulières 45 ans', 'premières bouffées de chaleur', 'humeur', 'sommeil', 'contraception 45 ans'],
    sources: [S.santeMenopause, S.santeMenoIdees, S.santeMenoSymptomes],
    body_md: `## En bref
- La **périménopause** (ou préménopause) est la période qui précède la ménopause : les œstrogènes **fluctuent**.
- Elle commence **en moyenne vers 47 ans** et dure **environ 4 ans**, mais elle peut débuter dès la quarantaine.
- Signes possibles : **règles irrégulières**, plus ou moins abondantes, **premières bouffées de chaleur**, irritabilité, troubles du sommeil ou de l’humeur.
- **Une grossesse reste possible** : la contraception doit être maintenue tant que la ménopause n’est pas confirmée.
- Aucun test sanguin isolé ne permet de « dater » la ménopause : le diagnostic est surtout clinique.

## Comprendre
Pendant la périménopause, les ovaires fonctionnent de façon de plus en plus irrégulière. Certains cycles s’accompagnent d’une ovulation, d’autres non. Les taux d’hormones montent et descendent, ce qui explique des cycles tantôt courts, tantôt longs, des règles parfois plus abondantes, et des symptômes qui vont et viennent.

Santé.fr précise qu’en France il n’existe pas de recommandations officielles spécifiques à la prise en charge de la périménopause : un traitement hormonal peut être envisagé au cas par cas, notamment en cas d’état dépressif sans autre cause identifiée. La page met aussi en garde contre les « produits miracles » vendus en ligne, dont l’efficacité n’est pas validée.

Le dosage de la FSH existe, mais son taux varie beaucoup pendant cette période : un résultat isolé ne suffit pas. Les autotests vendus en pharmacie ont les mêmes limites.

## Au quotidien
- **Continue à noter tes cycles** dans l’app : dates, abondance, durée, symptômes. C’est le meilleur moyen de voir l’évolution et d’en parler avec ton médecin.
- **Repère tes symptômes** : bouffées de chaleur, sueurs la nuit, réveils, irritabilité, baisse de moral, difficultés de concentration.
- **Garde ta contraception** : après 50 ans et sans contraception hormonale, le risque de grossesse est généralement considéré comme négligeable après 12 mois sans règles ; avant 50 ans, deux ans sans règles sont habituellement recommandés. Avec une contraception hormonale, demande conseil pour savoir quand arrêter.
- **Prends soin de ton hygiène de vie** : activité physique régulière, alimentation équilibrée riche en calcium, sommeil, limitation de l’alcool et arrêt du tabac.
- **Profite de « Mon bilan prévention »** proposé entre 45 et 50 ans pour faire le point sur ta santé (tension, poids, habitudes de vie).

## Questions fréquentes
**J’ai encore mes règles, puis-je être en périménopause ?** Oui. La périménopause peut commencer entre 40 et 50 ans, alors que les règles sont encore présentes, simplement plus irrégulières.

**Je prends une pilule en continu, comment savoir où j’en suis ?** La pilule peut supprimer les saignements et masquer la ménopause. Vers la cinquantaine, ton médecin peut te proposer une autre méthode de contraception pour y voir plus clair. N’arrête pas ta pilule sans solution de remplacement si tu ne souhaites pas de grossesse.

**Ma baisse de moral vient-elle de la périménopause ?** Les fluctuations hormonales peuvent favoriser un état dépressif, surtout si tu as déjà vécu des épisodes dépressifs. Mais une dépression ne doit pas être automatiquement attribuée à la ménopause : parles-en à un professionnel.

**Des compléments peuvent-ils aider ?** Leur efficacité n’est pas démontrée et certains présentent des risques. Demande l’avis de ton médecin ou de ton pharmacien.

## Quand demander conseil
Consulte en cas de saignements après les rapports ou entre les règles, de règles très abondantes, rapprochées (moins de 3 semaines) avec caillots, de symptômes qui gênent ta vie quotidienne, ou de tristesse ou d’anxiété qui durent. Si tu as des idées noires, appelle le **3114**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'menopause-symptomes-a-connaitre',
    title: 'Ménopause : tous les symptômes possibles et qui consulter',
    summary: 'Bouffées de chaleur, sommeil, humeur, sécheresse vaginale, troubles urinaires, articulations : les manifestations possibles de la ménopause et les professionnels qui peuvent t’accompagner.',
    tags: ['ménopause', 'symptômes ménopause', 'syndrome climatérique', 'sécheresse vaginale', 'fuites urinaires', 'douleurs articulaires', 'prise de poids', 'gynécologue'],
    sources: [S.santeMenoSymptomes, S.santeMenopause],
    body_md: `## En bref
- La ménopause, c’est l’**arrêt définitif des règles**, confirmé après **12 mois consécutifs sans règles** (sans contraception). Elle survient **en moyenne vers 51 ans**.
- Ce n’est **pas une maladie** mais une étape naturelle ; elle peut pourtant s’accompagner de signes gênants, regroupés sous le nom de **syndrome climatérique**.
- Les plus fréquents : **bouffées de chaleur** (au moins 75 % des femmes), **sueurs nocturnes**, troubles du **sommeil** et de l’**humeur**, **sécheresse vaginale**, troubles **urinaires**.
- La plupart des femmes n’en ressentent que quelques-uns, d’intensité très variable.
- Des solutions existent : **en parler** est la première étape.

## Comprendre
La baisse progressive des œstrogènes agit sur tout le corps. Santé.fr décrit :
- **Les bouffées de chaleur** : sensation de chaleur brutale, parfois rougeur du visage et cœur qui s’accélère, durant de 30 secondes à 2 minutes ; souvent d’abord la nuit.
- **Les changements du cycle** dès la périménopause : règles plus ou moins abondantes, irrégulières.
- **Les troubles du sommeil** : liés aux sueurs nocturnes mais aussi directement aux changements hormonaux, avec fatigue, baisse de concentration et de mémoire.
- **Les troubles de l’humeur** : sautes d’humeur, irritabilité, parfois épisodes dépressifs caractérisés.
- **La sécheresse vaginale** : moins de lubrification, parois plus fines, qui peuvent rendre les rapports inconfortables, parfois avec une baisse du désir.
- **Les troubles urinaires** : fuites liées à la perte de tonus du périnée (syndrome génito-urinaire de la ménopause), souvent tus alors que des traitements existent.
- **D’autres signes** : maux de tête, fatigue, douleurs musculaires ou articulaires, prise de poids surtout au niveau du ventre, peau et cheveux plus secs.

À plus long terme, la baisse des œstrogènes augmente le risque d’**ostéoporose** et de **maladies cardiovasculaires**.

## Au quotidien
- **Fais la liste de tes symptômes** et de leur retentissement (sommeil, travail, vie intime) avant le rendez-vous : l’app peut t’aider à les noter.
- **Choisis ton interlocuteur** :
  - le **médecin généraliste**, premier interlocuteur, pour le diagnostic, le bilan global (cœur, os) et un éventuel traitement ;
  - le ou la **gynécologue**, pour les symptômes hormonaux, le traitement hormonal de la ménopause et le suivi gynécologique ;
  - la **sage-femme**, pour la prévention, les conseils de mode de vie et les traitements locaux sans hormones de la sécheresse ;
  - l’**endocrinologue** pour les situations complexes ; un diététicien ou un psychologue si besoin.
- **Ne garde pas pour toi les fuites urinaires ou la sécheresse** : rééducation du périnée, lubrifiants, hydratants ou traitements locaux peuvent aider.
- **Adapte ton hygiène de vie** : activité physique, alimentation riche en calcium, sommeil régulier, moins d’alcool, pas de tabac.

## Questions fréquentes
**Faut-il une prise de sang pour savoir si je suis ménopausée ?** Non, dans la tranche d’âge habituelle : le diagnostic repose sur l’absence de règles pendant 12 mois. Aucun dosage hormonal ni échographie n’est nécessaire.

**Les symptômes durent-ils des années ?** Les bouffées de chaleur s’atténuent en général au bout de quelques mois, mais persistent parfois plusieurs années. Chaque femme vit la ménopause à sa façon.

**Prend-on forcément du poids ?** Non. Les besoins énergétiques et la masse musculaire diminuent, et la graisse se répartit davantage sur le ventre, mais l’alimentation, l’activité et le sommeil jouent beaucoup.

**Et l’endométriose ou le SOPK ?** Les symptômes de l’endométriose et du SOPK peuvent s’améliorer après la ménopause, mais le risque cardiovasculaire lié au SOPK peut persister.

## Quand demander conseil
Consulte si tes symptômes gênent ta vie quotidienne, en cas de saignement plus de 12 mois après tes dernières règles, de tristesse ou de perte d’intérêt qui durent, ou de fuites urinaires. Si tu as des idées noires, appelle le **3114**. Appelle le **15** ou le **112** en cas de douleur dans la poitrine ou de signes d’AVC.

${FIN}`,
  }),
  a({
    slug: 'bouffees-de-chaleur-sueurs-nocturnes-soulager',
    title: 'Bouffées de chaleur et sueurs nocturnes : ce qui peut vraiment aider',
    summary: 'Comprendre les bouffées de chaleur de la (péri)ménopause, repérer leurs déclencheurs, les astuces du quotidien et les traitements dont l’efficacité est reconnue.',
    tags: ['bouffées de chaleur', 'sueurs nocturnes', 'ménopause', 'périménopause', 'déclencheurs', 'plantes ménopause', 'traitement hormonal'],
    sources: [S.santeMenoVivre, S.santeMenoSymptomes, S.santeMenoTraitements],
    body_md: `## En bref
- Les bouffées de chaleur touchent **au moins 75 %** des femmes en cours de ménopause. Elles durent **de 30 secondes à 2 minutes**, souvent d’abord la nuit (sueurs nocturnes).
- Certains **déclencheurs** sont fréquents : plats épicés, boissons chaudes, alcool, caféine, stress.
- Des **gestes simples** aident à les supporter : vêtements en couches, matières respirantes, eau fraîche, chambre fraîche.
- L’**hypnose** et les **thérapies cognitivo-comportementales (TCC)** peuvent aider.
- Le **traitement hormonal de la ménopause** est le plus efficace, réservé aux symptômes qui altèrent fortement la qualité de vie, après évaluation des bénéfices et des risques.

## Comprendre
Les bouffées de chaleur sont liées à la baisse des œstrogènes. Elles se manifestent par une vague de chaleur, parfois avec une rougeur du visage et un pouls qui s’accélère. Elles surviennent spontanément ou sont provoquées par certains déclencheurs. La nuit, elles s’accompagnent parfois de sueurs abondantes qui perturbent le sommeil.

En général, les bouffées de chaleur s’atténuent au bout de quelques mois ; dans de rares cas, elles persistent plusieurs années. Leur intensité varie énormément d’une femme à l’autre.

## Au quotidien
- **Habille-toi en couches** faciles à retirer, en matières respirantes (coton, lin).
- **Garde de l’eau fraîche** à portée de main, un éventail ou un brumisateur.
- **Repère tes déclencheurs** en notant dans l’app quand surviennent tes bouffées (après un café, un verre de vin, un plat épicé, une réunion stressante…).
- **La nuit** : chambre fraîche, vêtements de nuit légers, repas du soir léger, pas d’alcool ni de caféine le soir, horaires de coucher réguliers.
- **Bouge régulièrement** : Santé.fr indique qu’un effet direct de l’activité physique sur les bouffées de chaleur n’est pas démontré, mais elle protège le cœur, les os, le sommeil et le moral.
- **Limite l’alcool** : il peut aggraver les bouffées, perturber le sommeil et favoriser la prise de poids.
- **Si elles deviennent invalidantes**, consulte : des traitements efficaces existent.

## Questions fréquentes
**Les plantes et compléments marchent-ils ?** Leur efficacité n’est pas démontrée de façon convaincante. Les plantes riches en phytoestrogènes (soja, trèfle rouge…) pourraient légèrement réduire les bouffées, mais les résultats sont contradictoires, et ces produits ne sont pas dénués de risques, notamment en cas d’antécédent de cancer hormonodépendant. Demande conseil à ton médecin ou à ton pharmacien.

**Existe-t-il des traitements sans hormones ?** Santé.fr mentionne quelques traitements non hormonaux, dont l’intérêt est jugé limité. Ton médecin peut en discuter avec toi, notamment si le traitement hormonal t’est contre-indiqué.

**Le traitement hormonal est-il dangereux ?** Il comporte des risques (cancer du sein, complications vasculaires), d’où une décision individuelle, la dose efficace la plus faible, la voie cutanée (gel, patch) privilégiée et une réévaluation au moins annuelle. Un article de l’app lui est consacré.

**Et si j’ai des bouffées de chaleur avant 40 ans ?** Associées à des règles absentes ou très espacées, elles doivent faire consulter pour rechercher une insuffisance ovarienne prématurée.

## Quand demander conseil
Consulte si les bouffées de chaleur ou les sueurs nocturnes perturbent ton sommeil, ton travail ou ta vie sociale, si tu manques de sommeil depuis des semaines, ou si elles apparaissent avant 40 ans. Appelle le **15** ou le **112** si une sensation de chaleur s’accompagne d’une douleur dans la poitrine, d’un essoufflement ou d’un malaise.

${FIN}`,
  }),
  a({
    slug: 'traitement-hormonal-menopause-information',
    title: 'Traitement hormonal de la ménopause (THM) : pour qui, quels bénéfices, quels risques',
    summary: 'Ce qu’est le THM, dans quelles situations il peut être proposé selon les recommandations relayées par Santé.fr, ses contre-indications, ses risques et comment se décide le traitement.',
    tags: ['traitement hormonal de la ménopause', 'THM', 'THS', 'œstrogènes', 'progestérone', 'cancer du sein', 'gel patch', 'méningiome'],
    sources: [S.santeMenoTraitements, S.santeMenoIdees, S.santeMenopause],
    body_md: `## En bref
- Le **traitement hormonal de la ménopause (THM)**, autrefois appelé traitement hormonal substitutif, apporte les hormones que les ovaires ne produisent plus.
- Il est **le plus efficace contre les bouffées de chaleur et les sueurs nocturnes**, et peut aussi améliorer le sommeil, certains troubles génitaux et prévenir la perte osseuse.
- Il est **réservé aux symptômes qui altèrent fortement la qualité de vie** : il n’est **ni obligatoire ni systématique**.
- Il comporte des **risques** (cancer du sein, complications vasculaires), d’où une **décision individuelle**, la dose efficace la plus faible, la durée la plus courte possible et une **réévaluation au moins annuelle**.
- La **voie cutanée** (gel ou patch) est à privilégier.

## Comprendre
Le THM associe en général un **œstrogène** (le plus souvent l’estradiol) et, chez les femmes qui ont encore leur utérus, un **progestatif** qui protège la muqueuse de l’utérus : les œstrogènes seuls augmentent le risque de cancer de l’endomètre. Il peut être pris selon un schéma cyclique (avec des saignements chaque mois) ou continu (sans règles).

Selon les recommandations de la HAS (2025) relayées par Santé.fr :
- **Indication principale** : des troubles importants, notamment des bouffées de chaleur, retentissant fortement sur la qualité de vie, si la femme le souhaite, après une information claire sur les risques.
- **Os** : chez les femmes à risque élevé de fracture, le THM n’est envisagé qu’en cas d’intolérance ou de contre-indication aux traitements de référence de l’ostéoporose.
- **Suivi** : réévaluation par le médecin au moins une fois par an.

Les **contre-indications** citées : antécédent personnel de maladie cardiovasculaire, cancer du sein ou de l’utérus, saignements vaginaux anormaux non expliqués.

Santé.fr indique que le rapport bénéfices-risques est généralement favorable s’il est **débuté avant 60 ans ou dans les 10 ans** suivant la ménopause, en l’absence de contre-indication. Le risque de cancer du sein augmente surtout **au-delà de 5 ans** et par **voie orale**. La voie cutanée expose à moins de risque de caillot et d’AVC.

## Au quotidien
- **Prépare la consultation** : tes symptômes et leur impact, tes antécédents personnels et familiaux (cancer du sein, phlébite, AVC, infarctus), ton tabagisme, tes dépistages.
- **Fais l’examen clinique et gynécologique** proposé avant de commencer, et garde tes dépistages du cancer du sein à jour.
- **Fais-toi expliquer** pourquoi le traitement est proposé dans ton cas, ses bénéfices attendus et ses risques.
- **Sois attentive à certains progestatifs** : l’ANSM a recommandé de ne plus prescrire la chlormadinone et le nomégestrol dans le THM, et d’autres progestatifs font l’objet d’une surveillance en raison d’un risque de **méningiome**. Signale à ton médecin des maux de tête inhabituels, des troubles de la vue, de la parole, de la mémoire ou de l’audition, des vertiges, des convulsions ou une faiblesse.
- **N’arrête pas et ne modifie pas ton traitement seule** : parles-en à ton médecin.
- **Méfie-toi des promesses** des réseaux sociaux : aucune étude solide ne montre que la testostérone soulage les symptômes de la ménopause ; son seul bénéfice démontré concerne une baisse persistante du désir sexuel source de souffrance.

## Questions fréquentes
**Peut-on le commencer dès les premiers signes ?** Oui, selon Santé.fr, il peut être débuté tôt, dès les premiers signes de ménopause, après un examen clinique et gynécologique complet tenant compte des antécédents familiaux.

**Combien de temps peut-on le prendre ?** Tant que les symptômes altèrent la qualité de vie, avec une réévaluation au moins annuelle de l’intérêt du traitement.

**Et la sécheresse vaginale seule ?** Des traitements locaux (crèmes, ovules, anneau à base d’œstrogènes) existent, avec un passage dans le sang jugé négligeable, ainsi que des hydratants et lubrifiants en vente libre.

**Les hormones « naturelles » ou « bio-identiques » sont-elles sans danger ?** Aucun traitement hormonal n’est dénué de risque. Les plantes à phytoestrogènes elles-mêmes peuvent présenter des risques proches de ceux des œstrogènes : elles s’utilisent sous contrôle médical.

## Quand demander conseil
Consulte avant de commencer, puis au moins une fois par an. Consulte rapidement en cas de saignement inattendu, de grosseur ou d’écoulement d’un sein, de douleur ou de gonflement d’un mollet, ou de maux de tête inhabituels. Appelle le **15** ou le **112** en cas de douleur dans la poitrine, d’essoufflement brutal ou de signes d’AVC (visage déformé, bras faible, troubles de la parole).

${FIN}`,
  }),
  a({
    slug: 'apres-la-menopause-proteger-os-et-coeur',
    title: 'Après la ménopause : prendre soin de tes os et de ton cœur',
    summary: 'Pourquoi le risque d’ostéoporose et de maladies cardiovasculaires augmente après la ménopause, et les repères d’activité physique, d’alimentation et de suivi qui aident à se protéger.',
    tags: ['ostéoporose', 'ménopause', 'santé des os', 'calcium', 'vitamine D', 'maladies cardiovasculaires', 'activité physique', 'ostéodensitométrie'],
    sources: [S.santeMenoActivite, S.santeMenoVivre, S.santeMenopause],
    body_md: `## En bref
- La baisse des œstrogènes **accélère la perte osseuse** : le risque d’**ostéoporose** et de **fracture** augmente après la ménopause.
- Le **risque cardiovasculaire** augmente aussi : dix ans après la ménopause, il devient aussi élevé chez les femmes que chez les hommes du même âge, selon Santé.fr.
- Repères d’activité : **au moins 30 minutes d’activité dynamique par jour**, du **renforcement musculaire** et des exercices d’**équilibre et de souplesse** chaque semaine, et **moins de temps assise**.
- **Calcium**, **vitamine D**, **arrêt du tabac**, **peu d’alcool** et un **suivi médical régulier** complètent la protection.
- Il n’est **jamais trop tard** pour commencer.

## Comprendre
Les œstrogènes participent à l’entretien de l’os et à la protection des vaisseaux. Quand ils diminuent, l’os se renouvelle moins bien et peut devenir plus fragile : c’est l’ostéoporose, qui expose à des fractures en cas de chute. En parallèle, la tension, le cholestérol, la glycémie et la graisse abdominale ont tendance à augmenter, ce qui accroît le risque d’infarctus et d’AVC.

Santé publique France (Manger Bouger) rappelle que l’activité physique ralentit la perte de densité osseuse, voire l’augmente, et aide à prévenir les maladies cardiovasculaires, le diabète de type 2 et certains cancers. Les activités avec impacts, comme le step ou la course, sont particulièrement intéressantes pour les os.

Une **ostéodensitométrie** (mesure de la densité osseuse) peut être prescrite, notamment en cas d’antécédent de fracture, de tabagisme, de faible poids (IMC inférieur à 19) ou de traitements qui fragilisent les os.

## Au quotidien
- **Bouge chaque jour** : marche rapide, escaliers, jardinage, danse, vélo… au moins 30 minutes d’activité dynamique.
- **Renforce tes muscles** plusieurs fois par semaine : porter tes courses, monter les escaliers, exercices avec le poids du corps.
- **Travaille l’équilibre et la souplesse** deux fois par semaine (yoga, tai-chi, étirements) : c’est aussi une façon de prévenir les chutes.
- **Lève-toi régulièrement** : ne reste pas assise des heures d’affilée, surtout devant les écrans.
- **Mange varié** : légumes, fruits, céréales complètes, légumineuses, poissons, assez de protéines pour préserver tes muscles, et des aliments riches en calcium (produits laitiers, certaines eaux minérales). La vitamine D est aussi indispensable aux os ; parles-en à ton médecin.
- **Arrête le tabac**, qui augmente les risques cardiovasculaires et d’ostéoporose ; limite l’alcool (au maximum 2 verres par jour et pas tous les jours, sachant que ces repères ne correspondent pas à une consommation dénuée de risque).
- **Fais le point avec ton médecin** : tension, poids, cholestérol, glycémie, et dépistages des cancers du sein, du col et du côlon. « Mon bilan prévention » est proposé entre 45 et 50 ans.
- **Si tu reprends le sport**, vas-y progressivement.

## Questions fréquentes
**Le traitement hormonal protège-t-il les os ?** Il peut prévenir la perte osseuse, mais chez les femmes à risque élevé de fracture, il n’est envisagé qu’en cas d’intolérance ou de contre-indication aux traitements de référence de l’ostéoporose. La décision se prend avec ton médecin.

**Je n’ai jamais fait de sport, est-ce trop tard ?** Non. Un peu d’activité est déjà bénéfique, et plus il y en a, mieux c’est.

**Dois-je prendre des compléments de calcium ?** Commence par l’alimentation. Les compléments ne se prennent pas au hasard : demande l’avis de ton médecin ou de ton pharmacien.

**Comment savoir si mes os sont fragiles ?** Ton médecin évalue ton risque et peut prescrire une ostéodensitométrie si tu as des facteurs de risque.

## Quand demander conseil
Consulte en cas de fracture survenue après une simple chute, ou pour faire le point sur ton risque cardiovasculaire. Appelle le **15** ou le **112** en cas de douleur dans la poitrine, d’essoufflement brutal, ou de signes d’AVC : visage déformé, bras ou jambe qui faiblit, troubles de la parole.

${FIN}`,
  }),
  a({
    slug: 'menopause-sommeil-humeur-moral',
    title: 'Ménopause : retrouver le sommeil et prendre soin de ton moral',
    summary: 'Insomnie, réveils nocturnes, irritabilité, anxiété ou déprime autour de la ménopause : comprendre ce qui se passe et ce qui peut aider, et quand consulter.',
    tags: ['ménopause', 'insomnie', 'sommeil', 'humeur', 'irritabilité', 'dépression', 'anxiété', 'TCC'],
    sources: [S.santeMenoVivre, S.santeMenoSymptomes, S.santeMenoIdees],
    body_md: `## En bref
- Autour de la ménopause, le sommeil peut être perturbé par les **sueurs nocturnes**, mais aussi **directement par les changements hormonaux**.
- Le manque de sommeil retentit sur la **vigilance**, la **concentration**, la **mémoire** et l’**humeur**.
- **Sautes d’humeur, irritabilité, anxiété** sont fréquentes ; des **épisodes dépressifs** peuvent aussi survenir, surtout si tu en as déjà vécu.
- Une routine de sommeil, l’activité physique et le lien social aident ; les **thérapies cognitivo-comportementales (TCC)** sont efficaces contre l’insomnie.
- Une **tristesse ou une perte d’intérêt qui durent** doivent faire consulter sans attendre.

## Comprendre
Les fluctuations des œstrogènes et de la progestérone influencent le sommeil et les émotions. À cela s’ajoutent les bouffées de chaleur qui réveillent, la fatigue qui s’accumule et, souvent, une période de vie chargée : enfants ados ou qui partent, parents vieillissants, pression professionnelle. Santé.fr rappelle que ces bouleversements personnels peuvent aggraver les troubles de l’humeur.

Pour autant, une dépression ne doit pas être automatiquement attribuée à la ménopause : elle mérite d’être reconnue et soignée comme telle. Santé.fr précise qu’en périménopause, un traitement hormonal peut être envisagé au cas par cas, notamment en cas d’état dépressif sans autre cause identifiée.

## Au quotidien
- **Garde des horaires réguliers** de coucher et de lever, même le week-end.
- **Prépare une chambre fraîche**, des vêtements de nuit légers, une couette adaptée ; garde de l’eau fraîche près du lit.
- **Allège le dîner** et évite l’alcool et la caféine le soir.
- **Bouge dans la journée** : l’activité physique régulière favorise le sommeil et réduit l’anxiété.
- **Si tu ne dors pas**, plutôt que de rester des heures au lit à ruminer, lève-toi pour une activité calme et reviens te coucher quand la fatigue revient.
- **Ménage-toi des moments de détente** : relaxation, respiration, méditation, yoga, selon ce qui te convient.
- **Garde du lien** : vie sociale, échanges avec d’autres femmes qui traversent la même étape, parler de ce que tu ressens à tes proches.
- **Note ton sommeil et ton humeur** dans l’app : tu repéreras mieux ce qui t’aide, et tu pourras en parler précisément avec ton médecin.

## Questions fréquentes
**Les somnifères sont-ils une solution ?** En cas d’insomnie persistante, consulte : Santé.fr cite les TCC parmi les traitements efficaces. Les médicaments éventuels se discutent avec ton médecin.

**Je m’énerve pour un rien, est-ce la ménopause ?** L’irritabilité est fréquente avant et pendant la ménopause, liée aux hormones et au manque de sommeil. Si elle pèse sur ta vie ou tes relations, parles-en.

**Mes trous de mémoire m’inquiètent.** Le manque de sommeil peut réduire la concentration et la mémoire. Si ces difficultés persistent ou s’aggravent, fais le point avec ton médecin.

**Le traitement hormonal peut-il aider ?** Il peut améliorer le sommeil en réduisant les bouffées de chaleur, mais il se décide au cas par cas, selon les bénéfices et les risques.

## Quand demander conseil
Consulte si tu dors mal depuis plusieurs semaines, si tu te sens triste, anxieuse ou sans envie la plupart du temps depuis plus de deux semaines, ou si ton humeur pèse sur ta vie familiale ou professionnelle. Si tu as des idées noires ou envie de mourir, appelle le **3114**, gratuit, jour et nuit. En cas de danger immédiat, appelle le **15** ou le **112**.

${FIN}`,
  }),
];
