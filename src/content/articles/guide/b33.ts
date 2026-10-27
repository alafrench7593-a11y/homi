/** Guide complet — lot 33 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles ou de référence françaises).
const S = {
  vaginiteDef: { label: 'ameli.fr — Reconnaître une vaginite (définition, symptômes, facteurs favorisants)', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/definition-symptomes-facteurs-favorisants', consulted_on: C },
  vaginiteQuand: { label: 'ameli.fr — Mycose vaginale et autres vaginites : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/que-faire-quand-consulter', consulted_on: C, published: '2024-12-23' },
  vaginiteTraitement: { label: 'ameli.fr — Mycose vaginale et autres vaginites : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/consultation-traitement', consulted_on: C, published: '2024-12-23' },
  vaginitePrevention: { label: 'ameli.fr — Comment prévenir la vaginite et ses récidives ?', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/prevention', consulted_on: C, published: '2024-08-13' },
  pertesCngof: { label: 'Santé.fr (contenu CNGOF) — Faire la différence entre les pertes blanches, les infections et mycoses génitales', url: 'https://www.sante.fr/faire-la-difference-entre-les-pertes-blanches-les-infections-et-mycoses-genitales', consulted_on: C, published: '2019-03-26' },
  hygieneQS: { label: 'QuestionSexualité (Santé publique France) — Hygiène intime féminine : quelle routine adopter', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/l-hygiene-et-le-suivi-medical/hygiene-intime-feminine-quelle-routine-adopter', consulted_on: C },
  pertesFSJ: { label: 'Fil Santé Jeunes — Les pertes blanches : c’est naturel !', url: 'https://www.filsantejeunes.com/les-pertes-blanches-5690', consulted_on: C, published: '2021-10-23' },
  mycosesQS: { label: 'QuestionSexualité (Santé publique France) — Tout ce qu’il faut savoir sur la mycose vaginale et la mycose du gland', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-maladies-de-la-sphere-sexuelle/que-sont-les-mycoses-genitales', consulted_on: C },
  depistageCol: { label: 'ameli.fr — Dépistage organisé du cancer du col de l’utérus', url: 'https://www.ameli.fr/assure/sante/themes/cancer-col-uterus/depistage-organise-cancer-col-uterus', consulted_on: C, published: '2026-10-20' },
  preventionCol: { label: 'ameli.fr — Prévenir le cancer du col de l’utérus : vaccination HPV et frottis de dépistage', url: 'https://www.ameli.fr/assure/sante/themes/cancer-col-uterus/prevention-cancer-col-uterus', consulted_on: C },
  hpvVIS: { label: 'Vaccination Info Service (Santé publique France) — Infections à papillomavirus humains (HPV)', url: 'https://www.vaccination-info-service.fr/Les-maladies-et-leurs-vaccins/Infections-a-Papillomavirus-humains-HPV', consulted_on: C, published: '2026-01-01' },
  premiereGynecoQS: { label: 'QuestionSexualité (Santé publique France) — Comment se passe la première consultation gynécologique ?', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/l-hygiene-et-le-suivi-medical/comment-se-passe-la-premiere-consultation-gynecologique', consulted_on: C },
  premiereGynecoFSJ: { label: 'Fil Santé Jeunes — La première consultation gynéco', url: 'https://www.filsantejeunes.com/premiere-consultation-gyneco-5687', consulted_on: C, published: '2024-02-27' },
  suiviFemmes: { label: 'Santé.fr (contenu QuestionSexualité / Santé publique France) — Santé sexuelle : quel suivi médical pour les femmes ?', url: 'https://www.sante.fr/sante-sexuelle-quel-suivi-medical-pour-les-femmes', consulted_on: C, published: '2026-05-11' },
  cystiteDef: { label: 'ameli.fr — Cystite (infection urinaire) : symptômes et causes', url: 'https://www.ameli.fr/assure/sante/themes/cystite/reconnaitre-cystite', consulted_on: C },
  cystiteQuand: { label: 'ameli.fr — Cystite : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/cystite/que-faire-cystite', consulted_on: C, published: '2025-05-13' },
  cystitePrevention: { label: 'ameli.fr — Prévenir l’infection urinaire et les récidives de cystite', url: 'https://www.ameli.fr/assure/sante/themes/cystite/prevention-recidives', consulted_on: C },
  depisterGratuitQS: { label: 'QuestionSexualité (Santé publique France) — Où se faire dépister gratuitement ?', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-depistages/ou-se-faire-depister-gratuitement', consulted_on: C },
  istAmeli: { label: 'ameli.fr — Symptômes, diagnostic et évolution des IST', url: 'https://www.ameli.fr/assure/sante/themes/mst-ist/symptomes-diagnostic-evolution', consulted_on: C, published: '2025-12-02' },
  chlamydiaSante: { label: 'Santé.fr — Infections génitales à Chlamydia', url: 'https://www.sante.fr/infections-genitales-chlamydia', consulted_on: C, published: '2026-08-13' },
  herpesQS: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que l’herpès génital ?', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-infections-sexuellement-transmissibles/qu-est-ce-que-l-herpes-genital', consulted_on: C },
  herpesAmeli: { label: 'ameli.fr — Que faire pendant et entre les poussées d’herpès génital ?', url: 'https://www.ameli.fr/assure/sante/themes/herpes-genital/que-faire-poussees-herpes', consulted_on: C, published: '2021-01-02' },
  dyspareunieQS: { label: 'QuestionSexualité (Santé publique France) — Dyspareunies : douleurs pendant les rapports sexuels', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-troubles-de-la-sexualite/dyspareunies-douleurs-pendant-les-rapports-sexuels', consulted_on: C },
  dyspareunieEndo: { label: 'Santé.fr (contenu EndoFrance) — La dyspareunie : douleurs lors des rapports sexuels', url: 'https://www.sante.fr/endometriose/la-dyspareunie-douleurs-lors-des-rapports-sexuels', consulted_on: C, published: '2024-01-05' },
  vaginismeQS: { label: 'QuestionSexualité (Santé publique France) — Le vaginisme, c’est quoi ?', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-troubles-de-la-sexualite/le-vaginisme-c-est-quoi', consulted_on: C },
  vulveQS: { label: 'QuestionSexualité (Santé publique France) — Quand la vulve est douloureuse', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-troubles-de-la-sexualite/quand-la-vulve-est-douloureuse', consulted_on: C },
  menopauseSexuQS: { label: 'QuestionSexualité (Santé publique France) — Sexualité, ménopause et andropause', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/la-sexualite-au-cours-de-la-vie/la-sexualite-apres-la-menopause-et-l-andropause', consulted_on: C },
  menopauseVivre: { label: 'Santé.fr — Vivre au mieux la ménopause', url: 'https://www.sante.fr/menopause-perimenopause/vivre-au-mieux-menopause', consulted_on: C },
  libidoContraQS: { label: 'QuestionSexualité (Santé publique France) — La contraception fait-elle baisser la libido ?', url: 'https://www.questionsexualite.fr/site/choisir-sa-contraception/ma-contraception-et-moi/la-contraception-fait-elle-baisser-la-libido', consulted_on: C },
  devoirConjugalQS: { label: 'QuestionSexualité (Santé publique France) — Le devoir conjugal, ça existe ?', url: 'https://www.questionsexualite.fr/site/lutter-contre-les-violences-et-discriminations/les-droits/le-devoir-conjugal-ca-existe', consulted_on: C },
  incontinenceCauses: { label: 'ameli.fr — Incontinence urinaire : mécanisme, fréquence et causes', url: 'https://www.ameli.fr/assure/sante/themes/incontinence-urinaire/mecanismes-frequence-causes', consulted_on: C, published: '2026-04-10' },
  incontinenceTraitement: { label: 'ameli.fr — Traitement de l’incontinence urinaire', url: 'https://www.ameli.fr/assure/sante/themes/incontinence-urinaire/traitement', consulted_on: C },
  seinExamens: { label: 'Santé.fr (contenu Institut national du cancer) — Cancer du sein : quels examens et à quel âge ?', url: 'https://www.sante.fr/cancer-du-sein-quels-examens-et-quel-age', consulted_on: C, published: '2018-08-10' },
  seinDepistageFaq: { label: 'Santé.fr (contenu Institut national du cancer) — Le dépistage du cancer du sein : les réponses à vos questions', url: 'https://www.sante.fr/le-depistage-du-cancer-du-sein-les-reponses-vos-questions', consulted_on: C, published: '2021-10-12' },
  seinSante: { label: 'Santé.fr — Cancer du sein', url: 'https://www.sante.fr/cancer-du-sein', consulted_on: C, published: '2026-08-13' },
  violencesSexuelles: { label: 'arretonslesviolences.gouv.fr (Gouvernement) — Violences sexuelles : besoin d’aide', url: 'https://arretonslesviolences.gouv.fr/besoin-d-aide/violences-sexuelles', consulted_on: C },
  preventionIst: { label: 'ameli.fr — Prévenir les IST', url: 'https://www.ameli.fr/assure/sante/themes/mst-ist/prevention', consulted_on: C, published: '2026-03-05' },
  gonocoqueQS: { label: 'QuestionSexualité (Santé publique France) — La blennorragie gonococcique (ou chaude-pisse), c’est quoi ?', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-infections-sexuellement-transmissibles/qu-est-ce-que-la-blennorragie-gonococcique-ou-chaude-pisse', consulted_on: C },
  condylomes: { label: 'Santé.fr — Verrues génitales (condylomes)', url: 'https://www.sante.fr/verrues-genitales-condylomes', consulted_on: C, published: '2026-08-13' },
  trichoQS: { label: 'QuestionSexualité (Santé publique France) — Les mycoplasmes et la trichomonase, c’est quoi ?', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-infections-sexuellement-transmissibles/que-sont-les-mycoplasmes-et-la-trichomonase', consulted_on: C },
  tpeQS: { label: 'QuestionSexualité (Santé publique France) — Le TPE : le traitement d’urgence après une exposition au VIH', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-moyens-de-protection/que-faire-en-cas-d-urgence-apres-une-exposition-au-vih', consulted_on: C },
  prepSIS: { label: 'Sida Info Service — La PrEP protège du VIH', url: 'https://www.sida-info-service.org/dossier-la-prep/', consulted_on: C, published: '2026-07-15' },
} satisfies Record<string, ArticleSource>;

const FIN = 'Cet article t’informe et ne remplace pas l’avis d’un ou d’une professionnelle de santé (médecin, sage-femme, gynécologue, pharmacien).';

const a = (x: Omit<LibArticle, 'status' | 'journeys' | 'category'> & { journeys?: LibArticle['journeys']; category?: LibArticle['category'] }): LibArticle => ({
  journeys: ['avoid'], category: 'sante-intime', status: 'to_review', ...x,
});

export const GUIDE_B33: LibArticle[] = [
  // ------------------------------------------------------------ pertes, mycose, vaginose, hygiène
  a({
    slug: 'pertes-vaginales-hors-grossesse-reperes-couleur-odeur',
    title: 'Pertes vaginales : les repères pour savoir ce qui doit faire consulter',
    summary: 'Couleur, texture, odeur, variations au fil du cycle : ce que disent les sources officielles sur les pertes blanches habituelles et sur les signes qui évoquent une infection.',
    tags: ['pertes blanches', 'pertes vaginales', 'leucorrhées', 'glaire cervicale', 'pertes jaunes', 'pertes vertes', 'odeur intime', 'pertes marron', 'sécrétions'],
    sources: [S.pertesCngof, S.pertesFSJ, S.vaginiteDef],
    body_md: `## En bref
- Les pertes blanches sont des **sécrétions naturelles** du vagin et du col de l’utérus : elles apparaissent quelques mois avant les premières règles et disparaissent à la ménopause.
- Elles **changent au fil du cycle** : plus filantes et abondantes autour de l’ovulation (comme du blanc d’œuf cru), plus épaisses avant les règles.
- Selon le CNGOF, des pertes habituelles ne s’accompagnent **ni de brûlures, ni de démangeaisons, ni de mauvaise odeur**.
- Des pertes en grumeaux, mousseuses, grisâtres, jaunes ou vertes, malodorantes, ou associées à des brûlures, démangeaisons ou douleurs méritent une **consultation rapide**.

## Comprendre
Tes pertes viennent de deux endroits : la muqueuse du vagin et la glaire fabriquée par le col de l’utérus. Elles sont pilotées par tes hormones. Fil Santé Jeunes rappelle qu’elles ont plusieurs rôles : aider le vagin à se nettoyer tout seul en éliminant les cellules mortes, le garder humide, le protéger des bactéries et virus et entretenir l’équilibre de la flore vaginale. Elles sont généralement blanches ou jaune pâle, transparentes ou un peu laiteuses, et le plus souvent sans odeur marquée. Leur quantité et leur aspect varient d’une personne à l’autre.

Au cours du cycle, le Collège national des gynécologues et obstétriciens français (CNGOF) décrit ces variations : avant l’ovulation, le col produit une glaire filante ; au milieu du cycle, elle ressemble à du blanc d’œuf et peut être abondante ; après l’ovulation, elle perd sa filance. Sous pilule, la glaire est souvent moins abondante et moins filante, ce qui peut surprendre quand on arrête sa contraception. Après la ménopause, les sécrétions diminuent.

À ne pas confondre : la lubrification qui apparaît lors de l’excitation sexuelle est un autre liquide que les pertes blanches.

Le vagin abrite une flore équilibrée. Elle peut être modifiée par des antibiotiques, des changements hormonaux, une hygiène trop agressive ou un microbe transmis lors d’un rapport. C’est là que les pertes peuvent changer d’aspect.

## Au quotidien
**Quelques repères d’aspect décrits par l’Assurance Maladie et le CNGOF** (ils orientent, ils ne remplacent pas un examen) :
- pertes blanches, épaisses, comme du « lait caillé » ou du yaourt, avec démangeaisons : évoquent une **mycose** ;
- pertes fluides, abondantes, grisâtres, avec une odeur de poisson : évoquent une **vaginose bactérienne** ;
- pertes jaunâtres ressemblant à du pus, avec brûlures en urinant : peuvent évoquer une **IST** comme le gonocoque ou la chlamydia ;
- pertes verdâtres et mousseuses : peuvent évoquer un parasite, le trichomonas.

**Prendre soin de toi sans perturber la flore :**
- une toilette uniquement externe, avec un produit doux et non parfumé ;
- pas de douche vaginale, même si tu trouves l’odeur gênante : cela risque d’aggraver les choses ;
- des sous-vêtements en coton ;
- noter dans ton calendrier de cycle les jours où les pertes changent : tu repéreras plus facilement ce qui est habituel pour toi.

## Questions fréquentes
**Mes pertes sont plus abondantes certains jours, est-ce inquiétant ?** Les variations au fil du cycle sont décrites par les sources : autour de l’ovulation, elles peuvent être abondantes et filantes. Ce qui doit t’alerter, c’est surtout l’apparition d’odeur, de démangeaisons, de brûlures ou de douleurs.

**Des pertes jaunes, est-ce forcément une infection ?** Fil Santé Jeunes décrit des pertes habituelles blanches ou jaune pâle. En revanche, des pertes franchement jaunes, vertes ou purulentes, surtout avec d’autres signes, justifient de consulter.

**Les pertes abondantes sont-elles un signe de grossesse ?** Fil Santé Jeunes précise qu’elles ne sont pas un signe fiable de grossesse. En cas de doute, un test de grossesse est plus parlant.

**Puis-je porter un protège-slip tous les jours ?** Les sources consultées insistent surtout sur le fait d’éviter ce qui irrite (frottements, produits parfumés, matières synthétiques). Si tu en utilises, choisis-les non parfumés et change-les souvent.

## Quand demander conseil
Consulte dans les jours qui viennent ton ou ta médecin, une sage-femme ou un ou une gynécologue si tes pertes changent d’odeur, de couleur ou de texture, ou s’accompagnent de démangeaisons, brûlures ou douleurs pendant les rapports. Consulte dans la journée en cas de douleurs dans le bas du ventre, de brûlures en urinant ou si tu es peut-être enceinte. Fièvre avec douleurs pelviennes, douleur brutale et intense ou malaise : appelle le **15** ou le **112**. Une gêne qui t’empêche de vivre normalement n’est pas à subir.

${FIN}`,
  }),
  a({
    slug: 'mycose-vaginale-reconnaitre-soigner-eviter-recidives',
    title: 'Mycose vaginale : la reconnaître, la soigner, éviter les récidives',
    summary: 'Démangeaisons, pertes en « lait caillé », brûlures : comment reconnaître une mycose vaginale, quand l’automédication est possible et quand il vaut mieux consulter.',
    tags: ['mycose', 'mycose vaginale', 'candidose', 'candida', 'démangeaisons', 'ovule', 'mycose à répétition', 'lait caillé', 'vulvovaginite'],
    sources: [S.vaginiteQuand, S.mycosesQS, S.pertesCngof],
    body_md: `## En bref
- La mycose vaginale est due à la prolifération d’un champignon, **Candida albicans**, habituellement présent dans le vagin : c’est un **déséquilibre de la flore**, pas une IST.
- Signes typiques : **démangeaisons**, vulve rouge et irritée, **pertes blanches épaisses en grumeaux**, parfois brûlures en urinant et douleurs pendant les rapports.
- Si tu as **déjà eu une mycose** et que tu reconnais exactement les mêmes symptômes, l’Assurance Maladie indique qu’un traitement local sans ordonnance est possible, sur conseil du pharmacien.
- Première fois, doute, grossesse, diabète, pertes odorantes ou colorées, récidives : **consulte**.

## Comprendre
L’Assurance Maladie explique que les mycoses sont les plus fréquentes des vaginites, et QuestionSexualité (Santé publique France) estime qu’environ 75 % des femmes en auront au moins une dans leur vie. Le champignon en cause vit normalement dans le vagin sans poser de problème ; il prolifère quand l’équilibre de la flore change.

Plusieurs situations peuvent favoriser une mycose : un traitement antibiotique, la grossesse, certaines contraceptions hormonales, un diabète mal équilibré, une baisse des défenses immunitaires, mais aussi une toilette intime trop fréquente ou des douches vaginales, des vêtements serrés ou synthétiques. Une mycose ne retarde pas les règles : selon le CNGOF, si tes règles sont perturbées, il faut consulter pour en chercher la cause.

## Au quotidien
**Si tu reconnais une mycose déjà connue** (et que tu n’es pas enceinte), l’Assurance Maladie donne ces repères :
- demande conseil à ton pharmacien : il existe des traitements locaux (ovules, capsules, comprimés gynécologiques, crèmes) sans ordonnance ;
- les ovules et capsules se placent de préférence le soir au coucher ;
- l’amélioration peut prendre 24 à 48 heures : une absence d’effet immédiat n’est pas forcément un échec ;
- évite les rapports tant que le traitement n’a pas agi, ou utilise un préservatif.

**Pendant et après la crise :**
- toilette uniquement externe, une à deux fois par jour, avec un produit doux ;
- sous-vêtements en coton, vêtements pas trop serrés à l’entrejambe ;
- ne reste pas longtemps dans un maillot de bain mouillé ;
- sèche bien la vulve après la toilette ;
- si tu as eu des mycoses, évite les crèmes spermicides, qui peuvent irriter.

**Côté partenaire :** QuestionSexualité indique que le risque de mycose du gland est plus élevé chez les partenaires de femmes ayant une mycose vaginale. Si ton ou ta partenaire a des rougeurs, démangeaisons ou un dépôt blanchâtre, il ou elle peut consulter aussi.

## Questions fréquentes
**Combien de temps dure une mycose ?** Selon le CNGOF, avec un traitement adapté, les troubles régressent rapidement et la guérison survient en général en une huitaine de jours. Non traitée, elle peut durer longtemps.

**À partir de quand parle-t-on de mycoses à répétition ?** À partir de quatre épisodes par an, selon QuestionSexualité. Le CNGOF recommande alors de rechercher un facteur favorisant (comme un diabète) ou un autre foyer, et d’adapter le traitement avec un professionnel.

**Faut-il faire un prélèvement ?** Pas toujours. Le CNGOF indique qu’en cas de doute sur une infection, des prélèvements permettent d’identifier le germe et d’adapter le traitement ; c’est aussi utile en cas de récidives.

**Les probiotiques aident-ils ?** QuestionSexualité indique qu’ils peuvent être recommandés en prévention ; demandes-en l’intérêt à ton médecin ou ton pharmacien.

## Quand demander conseil
Consulte dans les jours qui viennent s’il s’agit d’une première fois, si tu as un doute, si les pertes sont jaunes, vertes, mousseuses ou malodorantes, si les symptômes persistent après le traitement ou reviennent vite, ou si tu as une maladie chronique comme un diabète. Consulte **dans la journée** si tu es enceinte ou penses l’être, ou si tu as des douleurs dans le ventre ou des brûlures en urinant. Fièvre avec douleurs pelviennes : appelle le **15** ou le **112**. Des démangeaisons qui t’empêchent de dormir ou de vivre normalement ne sont pas à subir.

${FIN}`,
  }),
  a({
    slug: 'vaginose-bacterienne-odeur-pertes-grises-que-faire',
    title: 'Vaginose bactérienne : odeur de poisson, pertes grisâtres, que faire ?',
    summary: 'La vaginose bactérienne est un déséquilibre de la flore vaginale : comment la distinguer d’une mycose, pourquoi consulter et comment limiter les récidives.',
    tags: ['vaginose', 'vaginose bactérienne', 'gardnerella', 'odeur de poisson', 'pertes grises', 'flore vaginale', 'lactobacilles', 'mauvaise odeur intime'],
    sources: [S.pertesCngof, S.vaginiteTraitement, S.vaginitePrevention],
    body_md: `## En bref
- La vaginose bactérienne vient d’un **déséquilibre de la flore vaginale** : une bactérie normalement présente, *Gardnerella vaginalis*, prolifère.
- Signes décrits par le CNGOF : **pertes abondantes, fluides, grisâtres**, parfois bulleuses, avec une **odeur de poisson**.
- Contrairement à la mycose, elle se soigne avec un **antibiotique prescrit** par un professionnel : l’automédication n’est pas adaptée.
- Une flore respectée (pas de douche vaginale, toilette externe douce) aide à **limiter les récidives**.

## Comprendre
Ton vagin est protégé par une flore dominée par des bactéries appelées lactobacilles (ou bacilles de Döderlein). Elles maintiennent un milieu acide qui empêche d’autres germes de se multiplier. Quand cet équilibre se rompt, d’autres bactéries prennent le dessus : c’est la vaginose.

L’Assurance Maladie liste ce qui peut perturber la flore : un excès d’hygiène intime, les douches vaginales et produits introduits dans le vagin, certains produits irritants (gels douche, savons parfumés), les antibiotiques, ou encore les rapports sexuels. Pour les vaginites d’origine bactérienne, elle décrit des pertes fluides, abondantes, grisâtres ou jaunâtres et malodorantes.

La vaginose se distingue de la mycose : avec une mycose, les pertes sont plutôt blanches, épaisses, en grumeaux, et ce sont les démangeaisons qui dominent. Avec une vaginose, c’est surtout l’odeur qui frappe. Selon la page du CNGOF publiée sur Santé.fr, la vaginose ne nécessite pas de traiter le partenaire, à la différence des IST comme la chlamydia ou le trichomonas, pour lesquelles le ou les partenaires doivent être traités en même temps.

## Au quotidien
**Avant la consultation :**
- évite la toilette intime juste avant le rendez-vous : le médecin ou la sage-femme pourra observer les pertes, et un prélèvement vaginal pourra identifier le germe ;
- note depuis quand tu as les symptômes, s’ils reviennent après les règles ou les rapports, et si tu as pris récemment des antibiotiques.

**Pendant le traitement :**
- prends le traitement prescrit en entier, même si l’odeur disparaît vite ;
- lave uniquement l’extérieur, deux fois par jour au plus, avec un produit doux ;
- si tu as des rapports, utilise un préservatif tant que le diagnostic n’est pas posé : une IST peut donner des signes proches.

**Pour limiter les récidives (repères de l’Assurance Maladie) :**
- pas de douche vaginale ni de produit « purifiant » intime ;
- un savon doux, non parfumé, pas d’antiseptique moussant ;
- essuie-toi d’avant en arrière après être allée aux toilettes ;
- change souvent de protection pendant les règles ;
- sous-vêtements en coton plutôt que synthétiques.

## Questions fréquentes
**L’odeur revient régulièrement : que faire ?** Les vaginites peuvent récidiver. Note quand les symptômes reviennent (après les règles, après un rapport, après des antibiotiques) et parles-en : un traitement adapté et la recherche d’un facteur favorisant peuvent être discutés.

**Une douche vaginale peut-elle enlever l’odeur ?** Non : l’Assurance Maladie déconseille les douches vaginales, qui perturbent la flore protectrice et favorisent les vaginites. Mieux vaut consulter.

**Est-ce une infection sexuellement transmissible ?** Non, c’est un déséquilibre de la flore. Mais comme des IST peuvent donner des pertes malodorantes, le diagnostic par un professionnel est important, et un dépistage peut être proposé.

**Et si je suis enceinte ?** L’Assurance Maladie recommande de consulter dans la journée en cas de vaginite pendant la grossesse, car certaines infections peuvent avoir des conséquences pour le bébé.

## Quand demander conseil
Consulte ton ou ta médecin, une sage-femme ou un ou une gynécologue dans les jours qui viennent en cas de pertes malodorantes, grisâtres, jaunes ou vertes. Consulte **dans la journée** si tu es enceinte ou peut-être enceinte, ou si tu as des douleurs dans le ventre ou des brûlures en urinant. Fièvre avec douleurs pelviennes : appelle le **15** ou le **112**. Une gêne qui revient sans cesse et pèse sur ta vie intime mérite une vraie prise en charge.

${FIN}`,
  }),
  a({
    slug: 'hygiene-intime-gestes-a-eviter-douche-vaginale',
    title: 'Hygiène intime : les bons gestes et ce qu’il vaut mieux éviter',
    summary: 'Le vagin se nettoie tout seul : la routine conseillée par les sources officielles, et les pratiques (douche vaginale, produits parfumés, « purifiants ») qui favorisent les infections.',
    tags: ['hygiène intime', 'toilette intime', 'douche vaginale', 'savon intime', 'flore vaginale', 'odeur', 'protège-slip', 'vulve', 'pH'],
    sources: [S.hygieneQS, S.vaginitePrevention, S.vaginiteDef],
    body_md: `## En bref
- Le vagin **se nettoie tout seul** grâce à ses sécrétions : la toilette concerne uniquement la **vulve**, à l’extérieur.
- Une toilette **une fois par jour** (deux au maximum selon l’Assurance Maladie), avec un savon **doux, non parfumé**, au pH neutre ou acide.
- À éviter : **douches vaginales**, lavage à l’intérieur du vagin, antiseptiques moussants, parfums, talc, déodorants intimes, produits « purificateurs ».
- Trop d’hygiène fragilise la flore et **favorise mycoses et vaginoses**.

## Comprendre
Le vagin abrite une flore protectrice, surtout composée de lactobacilles, qui maintient un milieu acide défavorable aux germes. QuestionSexualité (Santé publique France) rappelle que toute intervention qui détruit cette flore favorise les infections et les mycoses. L’Assurance Maladie cite l’excès d’hygiène intime, les produits irritants, les douches vaginales et les produits introduits dans le vagin parmi les facteurs qui favorisent les vaginites.

Autrement dit, se laver plus souvent ou avec des produits plus forts ne rend pas « plus propre » : cela peut au contraire provoquer irritations, odeurs et infections. Une légère odeur personnelle et des pertes qui varient au fil du cycle font partie du fonctionnement du corps.

## Au quotidien
**La routine décrite par QuestionSexualité :**
1. Lave la vulve d’avant en arrière.
2. Lave ensuite la région anale, sans revenir vers la vulve.
3. Rince soigneusement.
4. Sèche en douceur, sans frotter, avec ta serviette personnelle.

**Choisir ton produit (sans marque, juste des critères) :**
- un savon doux ou un gel lavant non parfumé, au pH neutre ou acide ;
- pas d’antiseptique moussant au quotidien ;
- si un produit pique ou irrite, arrête-le : l’Assurance Maladie conseille de supprimer les produits qui irritent.

**Les autres gestes qui comptent (Assurance Maladie) :**
- essuie-toi d’avant en arrière après les toilettes ;
- change souvent de tampon ou de protection pendant les règles ;
- préfère les sous-vêtements en coton et évite les vêtements très serrés ;
- ne reste pas longtemps en maillot de bain mouillé ;
- si tu utilises un diaphragme, lave-le à l’eau savonneuse après chaque utilisation, sans désinfectant, puis rince-le et sèche-le ;
- si un lubrifiant, un spermicide ou un préservatif t’irrite, parles-en : il existe d’autres options.

**Après un rapport :** une toilette externe simple suffit ; le vagin n’a pas besoin d’être lavé à l’intérieur.

## Questions fréquentes
**J’ai une odeur qui me gêne, une douche vaginale peut-elle aider ?** Non. QuestionSexualité déconseille la douche vaginale même en cas d’odeur désagréable ou de pertes inhabituelles, car elle risque d’aggraver la situation. Une odeur forte et nouvelle mérite plutôt l’avis d’un médecin ou d’un pharmacien.

**Les lingettes intimes, c’est une bonne idée ?** Les sources consultées ne les recommandent pas pour un usage quotidien. Si tu en utilises ponctuellement, choisis-les sans parfum et arrête en cas d’irritation.

**Les produits « détox » ou « purifiants » vaginaux vendus en ligne ?** QuestionSexualité les déconseille fortement. Rien ne doit être introduit dans le vagin pour le « nettoyer ».

**Et pour une petite fille ?** L’Assurance Maladie note que les muqueuses des fillettes sont fragiles : une toilette externe douce et bien rincée, et apprendre à s’essuyer d’avant en arrière, limitent les irritations.

## Quand demander conseil
Consulte si tu as des démangeaisons, des brûlures, des pertes inhabituelles (odeur, couleur, texture) ou des douleurs pendant les rapports : l’hygiène seule ne règle pas une infection. Chez une enfant, des pertes malodorantes peuvent venir d’un petit objet introduit dans le vagin : l’Assurance Maladie recommande de consulter dans la journée. Fièvre avec douleurs pelviennes : **15** ou **112**.

${FIN}`,
  }),
  // ------------------------------------------------------------ suivi gynécologique et dépistages
  a({
    slug: 'premiere-consultation-gynecologique-deroulement-confidentialite',
    title: 'Première consultation gynécologique : comment ça se passe ?',
    summary: 'Quand y aller, avec qui, ce qui se dit, l’examen qu’on peut refuser, la confidentialité même quand on est mineure : tout pour aborder sereinement son premier rendez-vous.',
    tags: ['première consultation gynécologique', 'gynéco', 'premier rendez-vous', 'examen gynécologique', 'mineure', 'confidentialité', 'planning familial', 'adolescente', 'sage-femme'],
    journeys: ['avoid', 'child'],
    sources: [S.premiereGynecoFSJ, S.premiereGynecoQS],
    body_md: `## En bref
- Il n’y a **pas d’âge imposé** : tu peux y aller dès que tu as une question (contraception, règles, corps, sexualité, IST) ou une inquiétude. QuestionSexualité conseille une première visite **avant 25 ans**, âge du premier frottis.
- Tu peux voir un ou une **gynécologue**, mais aussi un **médecin généraliste** ou une **sage-femme**.
- Le premier rendez-vous est surtout **une discussion**. Selon Fil Santé Jeunes, il n’y a en général pas d’examen lors de la première consultation, et **tu peux refuser** d’être examinée.
- La consultation est **confidentielle**, y compris pour les mineures.

## Comprendre
Fil Santé Jeunes décrit la première consultation comme un temps d’échange : le ou la professionnelle se présente, t’explique le déroulement, puis te pose des questions sur ta santé, tes antécédents personnels et familiaux, tes habitudes (tabac, alimentation, vie sexuelle) et d’éventuels traitements. Tu peux parler de tout : ton corps, tes règles, ta contraception, ta sexualité, tes doutes.

L’examen gynécologique n’est pas automatique. QuestionSexualité rappelle que tu n’es pas obligée de te déshabiller ni d’être examinée, qu’un examen n’est pas toujours utile et que tu peux le refuser. Quand il est proposé, c’est quand tu te sens prête, à ta demande ou sur proposition du ou de la professionnelle. Tu peux demander à voir le matériel avant, et dire si tu te sens gênée.

Sur la confidentialité, Fil Santé Jeunes est clair : ce que tu dis reste entre toi et le ou la professionnelle, même si tu es mineure. Rien n’est transmis à tes parents, sauf si tu es en danger. Les moins de 18 ans n’ont pas besoin d’autorisation parentale pour consulter, selon QuestionSexualité.

## Au quotidien
**Choisir où aller :**
- un cabinet en ville ou un centre de santé ;
- un centre de santé sexuelle ou de planification familiale : Fil Santé Jeunes précise que les consultations y sont anonymes et gratuites pour les mineures ;
- l’hôpital.
En ville, la consultation est payante mais généralement remboursée par l’Assurance Maladie. Tu peux demander à voir une femme si tu préfères.

**Préparer ton rendez-vous :**
- note la date de tes dernières règles et, si tu peux, la durée habituelle de tes cycles (ton calendrier de cycle t’y aide) ;
- liste tes questions à l’avance : on oublie souvent ce qu’on voulait demander ;
- pense à tes antécédents familiaux connus (cancers, maladies cardiovasculaires, diabète) ;
- prends ta carte Vitale si tu en as une.

**Venir accompagnée ?** Tu peux venir seule ou avec un parent, une personne de confiance, un ou une amie, ton ou ta partenaire. Cette personne peut rester tout ou partie du rendez-vous ; la partie intime se passe entre toi et le ou la professionnelle.

**Si tu ne te sens pas à l’aise**, tu as le droit de changer de professionnel. Un bon suivi repose sur la confiance.

## Questions fréquentes
**Je n’ai jamais eu de rapport, est-ce utile d’y aller ?** Oui, si tu as des questions sur tes règles, tes pertes, ta puberté ou la contraception. La consultation n’est pas réservée aux personnes qui ont une vie sexuelle.

**On va forcément me faire un frottis ?** Non. QuestionSexualité rappelle que le premier frottis de dépistage est recommandé à partir de 25 ans.

**Mes parents vont-ils le savoir ?** Pas si tu ne le souhaites pas : la consultation est confidentielle. Dans un centre de santé sexuelle, elle est anonyme et gratuite pour les mineures.

**Et si j’ai un souci urgent avant le rendez-vous ?** Fil Santé Jeunes conseille de consulter rapidement pour une mycose, une infection ou des douleurs, sans attendre une « première consultation » programmée.

**À qui poser mes questions en attendant ?** Fil Santé Jeunes propose une ligne anonyme et gratuite, le **0800 235 236**, tous les jours de 9 h à 23 h. L’infirmière scolaire, le médecin ou le pharmacien peuvent aussi t’aider.

## Quand demander conseil
Consulte sans attendre en cas de douleurs dans le bas du ventre, de pertes inhabituelles, de brûlures en urinant, de retard de règles avec des douleurs, ou après un rapport à risque (contraception d’urgence, dépistage des IST). Douleur brutale et intense, saignement très abondant avec malaise, fièvre avec douleurs pelviennes : appelle le **15** ou le **112**. Si tu as subi des violences, tu peux appeler le **3919** (gratuit et anonyme) ; si tu es mineure et en danger, le **119**.

${FIN}`,
  }),
  a({
    slug: 'suivi-gynecologique-gynecologue-sage-femme-generaliste-qui-fait-quoi',
    title: 'Gynécologue, sage-femme ou médecin généraliste : qui fait quoi pour ton suivi ?',
    summary: 'Trois professionnels peuvent assurer ton suivi gynécologique : ce que chacun peut faire, quand voir un ou une spécialiste et à quel rythme consulter.',
    tags: ['suivi gynécologique', 'gynécologue', 'sage-femme', 'médecin généraliste', 'accès direct', 'frottis', 'contraception', 'planning familial', 'remboursement'],
    sources: [S.suiviFemmes, S.depistageCol, S.premiereGynecoQS],
    body_md: `## En bref
- Ton suivi gynécologique peut être assuré par un ou une **gynécologue**, une **sage-femme** ou ton **médecin généraliste**.
- Tous trois peuvent **prescrire une contraception**, faire un bilan et **dépister les IST** ; le frottis de dépistage peut aussi être fait par chacun d’eux.
- Selon Santé.fr, il est préférable de voir un ou une gynécologue en cas de **maladie gynécologique**, de problème d’**infertilité** ou de **grossesse à risque**.
- Tu peux consulter une sage-femme ou un ou une gynécologue **sans ordonnance de ton médecin généraliste** et être remboursée.

## Comprendre
En France, le suivi gynécologique de prévention n’est pas réservé aux gynécologues. Santé.fr (contenu de Santé publique France) rappelle que la sage-femme et le médecin généraliste peuvent assurer le suivi gynécologique et le suivi de grossesse, au même titre que le ou la gynécologue. Ils exercent en cabinet, à l’hôpital ou dans les centres de planification familiale (centres de santé sexuelle).

L’Assurance Maladie liste les professionnels qui peuvent réaliser un frottis de dépistage du cancer du col de l’utérus : médecin généraliste, gynécologue, sage-femme, mais aussi centres de santé, centres d’examens de santé de l’Assurance Maladie, centres de planification, hôpitaux et certains laboratoires.

En cas de problème particulier, ton ou ta professionnelle habituelle peut t’orienter vers un ou une spécialiste : gynécologue pour une maladie gynécologique, sexologue pour une difficulté dans ta sexualité, par exemple.

## Au quotidien
**Qui choisir selon ta situation (repères) :**
- **suivi de prévention, contraception, frottis, dépistage des IST** : généraliste, sage-femme ou gynécologue, selon ta préférence et les disponibilités près de chez toi ;
- **maladie gynécologique connue ou suspectée** (endométriose, fibromes, saignements inexpliqués), **difficulté à concevoir**, **grossesse à risque** : plutôt un ou une gynécologue ;
- **question confidentielle, besoin de gratuité, mineure** : un centre de santé sexuelle (planning familial).

**Le rythme conseillé par Santé.fr :**
- une consultation de suivi gynécologique **au moins une fois par an** ;
- et au moindre doute, ou lors d’un changement important : premiers rapports, nouveau partenaire, changement de contraception, désir d’enfant, grossesse.

**Organiser ton suivi :**
- garde dans ton calendrier la date de ton dernier frottis et de ton dernier dépistage d’IST ;
- note tes questions entre deux rendez-vous ;
- si tu changes de professionnel, demande une copie de tes derniers résultats.

**Femmes ayant des rapports avec des femmes :** les recommandations sont les mêmes, avec un rendez-vous conseillé chaque année. Santé.fr reconnaît que tous les professionnels ne sont pas formés à leur santé sexuelle ; n’hésite pas à poser la question ou à t’adresser au Planning familial.

## Questions fréquentes
**Une sage-femme peut-elle me suivre si je ne suis pas enceinte ?** Oui. Le suivi gynécologique de prévention et la contraception font partie de ses missions, selon Santé.fr.

**Dois-je passer par mon médecin traitant pour voir un ou une gynécologue ?** Santé.fr indique qu’une prescription du médecin généraliste n’est pas nécessaire pour être remboursée lors d’une consultation chez une sage-femme ou un ou une gynécologue.

**Mon médecin généraliste peut-il faire mon frottis ?** Oui, l’Assurance Maladie le cite parmi les professionnels qui réalisent ce prélèvement.

**Je ne suis pas à l’aise avec mon ou ma praticienne, puis-je changer ?** Oui. QuestionSexualité rappelle que tu peux changer de professionnel si tu ne te sens pas à l’aise.

## Quand demander conseil
N’attends pas ton rendez-vous annuel en cas de pertes inhabituelles, de douleurs pelviennes, de saignements entre les règles ou après les rapports, de douleurs pendant les rapports, ou de règles qui t’empêchent de vivre normalement : une douleur de ce type n’est pas à subir. Saignement très abondant avec malaise, douleur brutale intense (surtout avec un retard de règles), fièvre avec douleurs pelviennes : appelle le **15** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'depistage-cancer-col-uterus-frottis-test-hpv-ages-rythme',
    title: 'Dépistage du cancer du col de l’utérus : frottis, test HPV, à quel âge et à quel rythme',
    summary: 'De 25 à 65 ans, un dépistage régulier permet de repérer le papillomavirus ou des cellules anormales avant un cancer : examens selon l’âge, invitation, remboursement et autoprélèvement.',
    tags: ['frottis', 'test HPV', 'cancer du col', 'dépistage', 'papillomavirus', 'autoprélèvement', 'cytologie', 'col de l’utérus', 'invitation assurance maladie'],
    sources: [S.depistageCol, S.preventionCol],
    body_md: `## En bref
- Le dépistage est recommandé à **toutes les femmes de 25 à 65 ans**, sauf avis contraire du médecin, même vaccinées contre les HPV.
- **De 25 à 29 ans** : examen des cellules du col (cytologie). Deux frottis à un an d’intervalle, puis un trois ans plus tard si les résultats sont normaux.
- **De 30 à 65 ans** : **test HPV**, trois ans après la dernière cytologie normale, puis **tous les cinq ans** tant qu’il est négatif.
- Avec l’invitation de l’Assurance Maladie, l’**analyse est prise en charge à 100 %**, sans avance de frais.

## Comprendre
Les papillomavirus humains (HPV) sont à l’origine de 70 à 90 % des cancers du col de l’utérus, selon l’Assurance Maladie. Une infection par un HPV « à haut risque » peut, des années plus tard, entraîner des anomalies des cellules du col, puis un cancer. Le dépistage permet de repérer le virus ou ces cellules anormales **avant** qu’elles n’évoluent, en l’absence de tout symptôme.

Le prélèvement se fait comme un frottis : le ou la professionnelle place un spéculum et prélève des cellules à la surface du col. Ce qui change selon l’âge, c’est l’analyse :
- avant 30 ans, on regarde les cellules au microscope (cytologie) ; si elle est anormale, la recherche d’HPV peut se faire sur le même prélèvement ;
- à partir de 30 ans, on recherche d’abord le virus (test HPV) ; s’il est positif, on examine les cellules sur le même prélèvement, et d’autres examens peuvent suivre.

Un test HPV positif ne veut pas dire cancer : il signale la présence du virus et la nécessité d’un suivi.

## Au quotidien
**Où le faire ?** Chez ton ou ta médecin généraliste, un ou une gynécologue, une sage-femme, mais aussi en centre de santé, en centre d’examens de santé de l’Assurance Maladie, en centre de planification familiale, à l’hôpital ou dans certains laboratoires.

**Les invitations :** l’Assurance Maladie envoie des invitations par courrier et sur le compte ameli aux femmes de 26 à 65 ans en retard de dépistage. En cas de perte, tu peux la retrouver sur ton compte ameli, en demander une à ton médecin ou à ton pharmacien, ou appeler le **36 46**.

**Combien ça coûte ?** Avec l’invitation, l’analyse (cytologie ou test HPV) est prise en charge à 100 %. La consultation et le prélèvement sont remboursés à 70 % sur la base du tarif conventionnel, le reste étant généralement couvert par la complémentaire santé.

**L’autoprélèvement vaginal :** il est proposé aux femmes de plus de 30 ans qui se font peu ou pas dépister. Tu fais toi-même le prélèvement ; si le test HPV est positif, un frottis chez un ou une professionnelle est ensuite nécessaire.

**Pour t’organiser :**
- note la date et le type de ton dernier dépistage dans ton calendrier ;
- demande comment tu recevras les résultats.

## Questions fréquentes
**Je suis vaccinée contre les HPV, dois-je quand même me faire dépister ?** Oui. L’Assurance Maladie précise que le vaccin ne protège pas contre tous les HPV à risque : le dépistage reste nécessaire.

**Je n’ai plus de rapports, ou j’ai une partenaire femme : suis-je concernée ?** Les recommandations s’adressent à toutes les femmes de 25 à 65 ans, sauf avis contraire du médecin. Parles-en avec ton ou ta professionnelle.

**J’ai un traitement qui diminue mes défenses immunitaires.** La Haute Autorité de santé recommande dans certains cas un dépistage plus rapproché ; ton médecin t’indiquera le calendrier adapté.

**Le frottis fait-il mal ?** Il peut être un peu inconfortable. Dis-le si tu as mal ou si tu es tendue : le ou la professionnelle peut adapter sa façon de faire.

## Quand demander conseil
Le dépistage concerne les femmes **sans symptômes**. Si tu as des saignements après les rapports, entre les règles ou après la ménopause, des pertes inhabituelles ou des douleurs pelviennes, consulte sans attendre la date de ton prochain dépistage. Saignement très abondant avec malaise ou douleur brutale intense : **15** ou **112**. Recevoir un résultat anormal peut être angoissant : n’hésite pas à poser toutes tes questions, et si l’anxiété devient envahissante, tu peux appeler le **3114**.

${FIN}`,
  }),
  a({
    slug: 'vaccin-hpv-papillomavirus-filles-garcons-rattrapage',
    title: 'Vaccin contre les papillomavirus (HPV) : pour qui, quand et pourquoi',
    summary: 'Filles et garçons dès 11 ans, campagne gratuite en 5e, rattrapage : ce que disent les sources officielles sur la vaccination contre les HPV, son efficacité et ses effets indésirables.',
    tags: ['vaccin HPV', 'papillomavirus', 'Gardasil', 'vaccination collège', 'rattrapage', 'cancer du col', 'verrues génitales', 'garçons', 'adolescent'],
    journeys: ['avoid', 'child'],
    min_age_months: 108,
    sources: [S.hpvVIS, S.preventionCol],
    body_md: `## En bref
- Les HPV se transmettent lors des **contacts sexuels** : environ **8 personnes sur 10** y seront exposées au cours de leur vie, selon Vaccination Info Service.
- La vaccination est recommandée aux **filles et aux garçons à partir de 11 ans**, avec **2 doses** entre 11 et 14 ans.
- Un **rattrapage** est possible ensuite, avec 3 doses ; Vaccination Info Service indique qu’il est ouvert **jusqu’à 26 ans inclus** depuis le 19 décembre 2025.
- Le vaccin est **gratuit au collège** (classe de 5e). Il ne remplace pas le **dépistage** du cancer du col à partir de 25 ans.

## Comprendre
Les papillomavirus humains sont très répandus : selon Vaccination Info Service, dans 60 % des cas l’infection survient au début de la vie sexuelle. Certains types peuvent provoquer des lésions précancéreuses, des verrues génitales et des cancers. Vaccination Info Service rappelle que le cancer du col de l’utérus représente près de 3 000 nouveaux cas par an en France, et qu’environ 6 400 cancers par an sont liés aux HPV, dont un sur quatre chez les hommes. C’est pourquoi la vaccination est recommandée aux garçons depuis le 1er janvier 2021.

Les préservatifs n’offrent qu’une **protection partielle** contre les HPV.

Le vaccin est le plus efficace **avant le début de la vie sexuelle** : la protection contre les types de virus couverts est alors proche de 100 %, selon Vaccination Info Service. Elle est moindre après les premiers rapports, car le vaccin ne soigne pas une infection déjà présente. Le vaccin recommandé pour toute nouvelle vaccination couvre neuf types de HPV ; une vaccination commencée doit être terminée avec le même vaccin.

## Au quotidien
**Pour ton enfant (11 à 14 ans) :**
- deux injections espacées de quelques mois (Vaccination Info Service indique un schéma à 0 et 5 mois) ;
- au collège, en 5e, la vaccination est proposée gratuitement ; elle nécessite **l’accord écrit des deux parents** ou représentants légaux ;
- elle peut aussi se faire chez le médecin, la sage-femme, en centre de vaccination, en centre de santé sexuelle ou en CeGIDD ;
- une dose peut être faite le même jour qu’un rappel prévu à cet âge : demande au médecin.

**Pour toi, si tu n’es pas vaccinée :** parle du rattrapage à ton médecin ou à ta sage-femme. En dehors du collège, le vaccin est remboursé à 65 % par l’Assurance Maladie sur prescription, le reste étant généralement pris en charge par la complémentaire ; il est gratuit pour les bénéficiaires de la Complémentaire santé solidaire et dans certains centres.

**Si une dose a été oubliée :** il n’est pas nécessaire de tout recommencer ; il suffit de compléter les doses manquantes.

**Préparer l’injection avec un ado :** expliquer à quoi sert le vaccin, prévoir de rester assis pendant la surveillance d’un quart d’heure recommandée après l’injection, car des malaises peuvent survenir chez les adolescents.

## Questions fréquentes
**Quels sont les effets indésirables ?** Selon Vaccination Info Service, la douleur au point d’injection est fréquente et plus marquée qu’avec d’autres vaccins, ainsi que rougeur ou gonflement. Fièvre et douleurs musculaires ou articulaires sont possibles. Une allergie grave est très rare.

**Le vaccin augmente-t-il le risque de maladies auto-immunes ?** Les études indépendantes citées par Vaccination Info Service n’ont pas montré d’augmentation de ce risque, et l’ANSM n’a pas détecté de signal de sécurité.

**Pourquoi vacciner si jeune ?** Parce que l’efficacité est maximale avant toute exposition au virus, et que le schéma à 2 doses est réservé aux 11-14 ans.

**Je suis vaccinée : puis-je arrêter les frottis ?** Non, le dépistage reste nécessaire de 25 à 65 ans, car le vaccin ne couvre pas tous les HPV à risque.

## Quand demander conseil
Parle de la vaccination avec ton ou ta médecin, ta sage-femme ou ton pharmacien, surtout si ton enfant ou toi avez une maladie ou un traitement qui diminue les défenses immunitaires. Après une injection, appelle le **15** ou le **112** en cas de gonflement du visage, de difficulté à respirer ou à avaler, ou de malaise important.

${FIN}`,
  }),
  // ------------------------------------------------------------ infections urinaires et IST
  a({
    slug: 'cystite-infection-urinaire-reconnaitre-agir-prevenir',
    title: 'Cystite : reconnaître une infection urinaire, agir vite et prévenir les récidives',
    summary: 'Brûlures en urinant, envies pressantes, urines troubles : les bons réflexes face à une cystite, les signes qui doivent faire consulter dans la journée et les gestes de prévention.',
    tags: ['cystite', 'infection urinaire', 'brûlures en urinant', 'envie fréquente d’uriner', 'pyélonéphrite', 'cystite après rapport', 'cystite à répétition', 'pharmacie', 'vessie'],
    safety_critical: true,
    sources: [S.cystiteDef, S.cystiteQuand, S.cystitePrevention],
    body_md: `## En bref
- La cystite est une **infection de la vessie**, due dans 90 % des cas à une bactérie du tube digestif (*Escherichia coli*). Elle est fréquente chez la femme.
- Signes typiques : **brûlures en urinant**, **envies pressantes et fréquentes** pour de petites quantités, gêne dans le bas-ventre, urines troubles, odorantes, parfois avec du sang.
- **Pas de fièvre** dans une cystite simple : **fièvre, frissons ou douleur dans le dos ou sur le côté** font craindre une atteinte du rein et imposent de **consulter dans la journée**.
- Boire suffisamment, ne pas se retenir et **uriner après les rapports** aident à prévenir les récidives.

## Comprendre
La bactérie, naturellement présente dans l’intestin, remonte de l’extérieur jusqu’à la vessie par l’urètre, puis s’y multiplie. L’Assurance Maladie explique que l’urètre court des femmes, les rapports sexuels (surtout avec des spermicides), la grossesse, la baisse des œstrogènes après la ménopause, un prolapsus ou des fuites urinaires favorisent ces infections.

Une cystite qui n’est pas traitée assez vite peut s’étendre aux reins : c’est la **pyélonéphrite**, qui se manifeste notamment par de la fièvre et dont le traitement est urgent.

On parle de cystites **récidivantes** à partir de **4 infections en 12 mois**. Elles justifient un suivi médical et des mesures de prévention adaptées.

## Au quotidien
**Dès les premiers symptômes, l’Assurance Maladie conseille :**
- de **boire beaucoup**, au moins 1,5 litre par jour d’eau ou de boissons non alcoolisées, sauf contre-indication médicale ;
- de ne pas te retenir d’uriner et de **bien vider ta vessie** à chaque fois ;
- d’éviter les rapports sexuels jusqu’à la disparition des symptômes ;
- de prendre rendez-vous avec ton ou ta médecin ou ta sage-femme, **ou de t’adresser à ton pharmacien** : les femmes de 16 à 65 ans qui ont récemment des brûlures en urinant ou des envies fréquentes ou urgentes peuvent y faire un test de dépistage, et le pharmacien peut, si nécessaire, délivrer un antibiotique dans un cadre défini.

**Pour prévenir (repères de l’Assurance Maladie) :**
- boire régulièrement dans la journée et lutter contre la constipation ;
- aller aux toilettes dès que le besoin se fait sentir ;
- t’essuyer d’avant en arrière après être allée à la selle ;
- pas de douche vaginale, ni de produits intimes parfumés ou de bains moussants ;
- sous-vêtements en coton, pantalons pas trop moulants ;
- si les cystites surviennent après les rapports : **uriner juste après** et éviter les spermicides.

**En cas de récidives :** parles-en à ton ou ta médecin. Selon ta situation, un professionnel peut proposer la canneberge, un traitement local après la ménopause ou un traitement préventif ; un suivi médical régulier est alors recommandé.

## Questions fréquentes
**Puis-je attendre que ça passe ?** Les sources recommandent d’agir dès les premiers signes : boire, et consulter ou voir ton pharmacien. Une cystite non traitée peut atteindre les reins.

**Les symptômes ne passent pas sous antibiotique, que faire ?** Recontacte rapidement ton ou ta médecin si les symptômes s’aggravent dans les jours qui suivent le début du traitement.

**Les rapports peuvent-ils déclencher des cystites ?** Oui, c’est un facteur favorisant connu. Uriner juste après le rapport et éviter les spermicides font partie des conseils de prévention.

**Et chez une petite fille ?** La cystite y ressemble à celle de l’adulte : prends rendez-vous chez le médecin. Avant 2 ans, l’infection touche souvent les reins avec des signes trompeurs (fièvre inexpliquée, pleurs en urinant, vomissements) : elle doit être prise en charge rapidement.

## Quand demander conseil
Consulte **dans la journée** en cas de fièvre, de frissons, de douleur dans le dos ou sur le côté, si tu es enceinte, si tu as une maladie chronique (diabète, maladie rénale) ou une baisse des défenses immunitaires, ou pour une suspicion d’infection urinaire chez un enfant. Fièvre élevée avec malaise, vomissements empêchant de boire ou altération de l’état général : appelle le **15** ou le **112**. Des cystites à répétition qui gâchent ta vie intime ne sont pas à subir : parles-en.

${FIN}`,
  }),
  a({
    slug: 'depistage-ist-ou-quand-gratuit-sans-ordonnance',
    title: 'Dépistage des IST : quand le faire, où, et comment en bénéficier gratuitement',
    summary: 'Les IST sont souvent silencieuses : les situations où se faire dépister, les lieux possibles (laboratoire sans ordonnance, CeGIDD, centre de santé sexuelle) et les conditions de gratuité.',
    tags: ['dépistage IST', 'IST', 'MST', 'CeGIDD', 'test VIH', 'laboratoire sans ordonnance', 'Mon test IST', 'gratuit', 'rapport non protégé', 'chlamydia'],
    sources: [S.depisterGratuitQS, S.istAmeli, S.suiviFemmes],
    body_md: `## En bref
- Les infections sexuellement transmissibles (IST) sont **souvent sans symptômes** : selon l’Assurance Maladie, le dépistage est le seul moyen de savoir si l’on est infecté.
- Se faire dépister est conseillé après un **rapport non protégé**, en cas de **plusieurs partenaires**, avant d’**arrêter le préservatif** avec un nouveau partenaire, et à chaque doute.
- **Le dépistage du VIH est gratuit pour tout le monde** en laboratoire, **sans ordonnance ni rendez-vous**.
- Chlamydia, gonocoque, syphilis et hépatite B : **gratuits sans ordonnance avant 26 ans** ; avec une ordonnance, gratuits à tout âge.

## Comprendre
Les IST les plus courantes sont la chlamydiose, le gonocoque, la syphilis, l’hépatite B, l’herpès génital, les papillomavirus, les mycoplasmes, la trichomonase et le VIH. L’Assurance Maladie rappelle que beaucoup d’entre elles passent inaperçues, alors qu’elles peuvent entraîner des complications : douleurs pelviennes chroniques, infertilité, grossesse extra-utérine, transmission au bébé à l’accouchement, et, pour certains HPV, des cancers.

Santé.fr (contenu QuestionSexualité) recommande un dépistage régulier si tu as plusieurs partenaires dans l’année, même en utilisant le préservatif, et à chaque fois que tu envisages d’arrêter le préservatif avec un nouveau partenaire régulier. Le dépistage peut aussi être fait à tout moment en cas de doute.

## Au quotidien
**Où te faire dépister ?** (QuestionSexualité)
- **En laboratoire, sans ordonnance ni rendez-vous** : le dépistage du VIH y est gratuit pour toutes et tous. Un court questionnaire sur place indique les autres dépistages recommandés dans ta situation.
- **En CeGIDD** (centres gratuits d’information, de dépistage et de diagnostic) **et dans certains centres de santé sexuelle** : dépistage gratuit du VIH et des autres IST.
- **Chez ton ou ta médecin ou ta sage-femme** : l’ordonnance permet un dépistage gratuit en laboratoire, quel que soit ton âge.
- **Associations** : certaines proposent gratuitement des tests rapides (TROD) et des autotests du VIH et de l’hépatite B.
- **À domicile** : si tu as entre **18 et 25 ans**, tu peux commander sur le site mon-test-ist.ameli.fr un kit d’autoprélèvement pour la chlamydia et le gonocoque, sans avance de frais.

**Combien ça coûte ?**
- VIH : gratuit partout ;
- chlamydia, gonocoque, syphilis, hépatite B sans ordonnance : gratuits avant 26 ans ; à partir de 26 ans, remboursés à 60 % par l’Assurance Maladie, le reste par la complémentaire ;
- avec une ordonnance : gratuits quel que soit l’âge.

**Comment ça se passe ?** Selon l’infection recherchée : une prise de sang (VIH, syphilis, hépatite B), un prélèvement vaginal ou un prélèvement d’urine (chlamydia, gonocoque). C’est simple et généralement indolore.

**Garder une trace :** note la date de ton dernier dépistage dans ton calendrier pour savoir quand refaire le point.

## Questions fréquentes
**Je n’ai aucun symptôme, est-ce utile ?** Oui : c’est justement parce que les IST sont souvent silencieuses que le dépistage est recommandé dans les situations à risque.

**Un résultat négatif juste après un rapport suffit-il ?** Certaines infections ne sont détectables qu’après un délai. Demande au laboratoire, au CeGIDD ou à ton ou ta médecin s’il faut refaire un test plus tard.

**Mon ou ma partenaire doit-il ou elle aussi se faire dépister ?** Si une IST est trouvée, il faut prévenir ses partenaires récents pour qu’ils se fassent dépister et, si besoin, traiter.

**À qui poser mes questions anonymement ?** Sida Info Service répond au **0 800 840 800**, de façon anonyme et gratuite.

## Quand demander conseil
Consulte rapidement en cas d’écoulement, de pertes inhabituelles, de brûlures en urinant, de douleurs pendant les rapports, de lésions ou boutons génitaux, de ganglions dans l’aine, de fièvre ou de douleurs dans le bas-ventre. Après un rapport à risque d’exposition au VIH, un traitement d’urgence peut être proposé : rends-toi **au plus vite** aux urgences ou dans un CeGIDD. Fièvre avec douleurs pelviennes : **15** ou **112**. En cas de rapport non consenti, tu peux appeler le **3919** ou le **17**.

${FIN}`,
  }),
  a({
    slug: 'chlamydia-infection-silencieuse-depistage-traitement',
    title: 'Chlamydia : une IST souvent silencieuse, pourquoi se faire dépister',
    summary: 'Très fréquente avant 25 ans et le plus souvent sans symptôme, la chlamydiose peut menacer la fertilité si elle n’est pas traitée : signes possibles, dépistage, traitement et partenaires.',
    tags: ['chlamydia', 'chlamydiose', 'IST', 'infection silencieuse', 'infertilité', 'dépistage', 'kit autoprélèvement', 'salpingite', 'jeunes'],
    sources: [S.chlamydiaSante, S.istAmeli, S.depisterGratuitQS],
    body_md: `## En bref
- La chlamydiose est une IST due à la bactérie *Chlamydia trachomatis*, **très fréquente chez les moins de 25 ans**.
- Elle est le plus souvent **silencieuse** : selon Santé.fr, moins de 30 % des femmes infectées ont des symptômes. On reste **contagieuse** même sans signes.
- Non traitée, elle peut atteindre l’utérus et les trompes et entraîner **douleurs pelviennes chroniques, infertilité ou grossesse extra-utérine**.
- Le dépistage est **simple et indolore**, **gratuit sans ordonnance avant 26 ans**, et le traitement repose sur des antibiotiques.

## Comprendre
Santé.fr indique qu’environ 4 % des jeunes femmes de moins de 25 ans seraient infectées en France, davantage en région parisienne. Comme l’infection passe souvent inaperçue, elle peut se transmettre et progresser longtemps sans être repérée.

Quand il y a des signes, ils peuvent être : des brûlures en urinant ou pendant les rapports, des pertes vaginales inhabituelles, des douleurs dans le ventre, de légers saignements, parfois une conjonctivite. L’Assurance Maladie décrit aussi des formes aiguës avec fièvre et douleurs pelviennes. Chez les hommes, elle peut provoquer brûlures, écoulement ou testicules douloureux, mais elle est souvent silencieuse aussi.

Les complications sont plus fréquentes chez les femmes, justement parce que l’infection est discrète : inflammation de l’utérus et des trompes, pouvant laisser des séquelles sur la fertilité ou favoriser une grossesse extra-utérine. Pendant la grossesse, la bactérie peut être transmise au nouveau-né. Une chlamydiose augmente aussi le risque d’infection par le VIH.

## Au quotidien
**Te faire dépister :**
- par prélèvement vaginal (souvent réalisable toi-même) ou par analyse d’urine ;
- chez ton ou ta médecin, ta sage-femme, ton ou ta gynécologue, ou gratuitement en CeGIDD et en centre de santé sexuelle ;
- en laboratoire sans ordonnance : gratuit avant 26 ans ;
- à domicile entre 18 et 25 ans : kit d’autoprélèvement chlamydia et gonocoque à commander sur mon-test-ist.ameli.fr, sans avance de frais.

**Si le résultat est positif :**
- le traitement est un antibiotique par voie orale, prescrit par un ou une professionnelle ;
- Santé.fr recommande de s’abstenir de rapports pendant la semaine qui suit le début du traitement ;
- si les symptômes persistent, recontacte ton ou ta médecin ; une consultation de contrôle peut être prévue ;
- **préviens tes partenaires récents** pour qu’ils se fassent dépister et, si besoin, traiter, afin d’éviter de te réinfecter ;
- l’Assurance Maladie note que les récidives sont fréquentes dans les premiers mois : un nouveau dépistage peut t’être proposé.

**Prévenir :** le préservatif à chaque rapport, y compris pour la fellation selon Santé.fr, et un dépistage régulier si tu changes de partenaire.

## Questions fréquentes
**Je n’ai aucun symptôme, pourquoi me dépister ?** Parce que la majorité des infections sont silencieuses et que le dépistage est le seul moyen de les repérer avant d’éventuelles complications.

**La chlamydia rend-elle forcément stérile ?** Non. Le risque concerne surtout les infections qui ne sont pas traitées et qui atteignent les trompes. D’où l’intérêt d’un dépistage précoce.

**Puis-je l’attraper à nouveau après un traitement ?** Oui, si un ou une partenaire infectée n’a pas été traitée, ou lors d’un nouveau contact. Le traitement ne protège pas pour l’avenir.

**Comment l’annoncer à un ou une partenaire ?** Simplement et sans culpabiliser : l’infection est fréquente et souvent silencieuse, personne ne pouvait le savoir sans test. Le CeGIDD peut t’aider à trouver les mots.

## Quand demander conseil
Consulte rapidement en cas de pertes inhabituelles, de brûlures en urinant, de saignements après les rapports ou entre les règles, ou de douleurs pendant les rapports. Fièvre avec douleurs pelviennes, ou douleur brutale et intense avec un retard de règles (grossesse extra-utérine possible) : appelle le **15** ou le **112**. Si tu as un projet de grossesse, parle de ton dépistage à ton ou ta professionnelle.

${FIN}`,
  }),
  a({
    slug: 'herpes-genital-poussees-contagion-vivre-avec',
    title: 'Herpès génital : comprendre les poussées, limiter la transmission, vivre avec',
    summary: 'L’herpès génital est une IST virale qui évolue par poussées : reconnaître les signes, se soulager pendant une crise, protéger son ou sa partenaire et prévenir en cas de grossesse.',
    tags: ['herpès génital', 'herpès', 'IST', 'cloques', 'vésicules', 'poussée', 'récidive', 'contagion', 'grossesse herpès'],
    sources: [S.herpesQS, S.herpesAmeli, S.istAmeli],
    body_md: `## En bref
- L’herpès génital est une **IST virale très contagieuse** : il se manifeste par de **petites cloques douloureuses** sur les organes génitaux, l’anus ou la bouche, avec démangeaisons et brûlures.
- Le virus **reste dans l’organisme** : après la première crise, des **poussées** peuvent revenir, ou jamais ; selon l’Assurance Maladie, elles tendent à s’espacer.
- Un **traitement sur ordonnance**, commencé tôt, réduit la durée et l’intensité des crises, sans éliminer le virus.
- Le virus peut être transmis **même sans lésion visible**, et le préservatif ne protège qu’en partie.

## Comprendre
QuestionSexualité indique que l’herpès génital touche environ une personne sur huit entre 15 et 49 ans dans le monde. Les premiers symptômes apparaissent au minimum une semaine après la contamination : petites bulles douloureuses, démangeaisons, parfois fièvre, maux de tête, douleurs au ventre ou en urinant.

Le diagnostic repose sur l’examen médical, parfois complété par un prélèvement sur les lésions. Il peut être posé par ton ou ta médecin, ta sage-femme, ton ou ta gynécologue, ou dans un CeGIDD ou un centre de santé sexuelle, où le dépistage est anonyme et gratuit.

L’Assurance Maladie précise un point important : le virus peut être présent par intermittence sur les muqueuses **sans aucun signe**, et donc se transmettre. Le préservatif ne protège pas suffisamment, car des lésions peuvent se trouver en dehors de la zone couverte ; il reste utile pour limiter les risques. Il n’existe pas de vaccin.

Comme toute IST, l’herpès fragilise les muqueuses et augmente le risque de contamination par le VIH.

## Au quotidien
**Pendant une poussée (conseils de l’Assurance Maladie) :**
- consulte dès les premiers symptômes : le traitement est d’autant plus efficace qu’il est précoce ;
- pour la douleur, demande conseil à ton ou ta médecin ou à ton pharmacien et respecte la notice ;
- n’applique pas de crème ou de produit sur les lésions de ta propre initiative : cela peut les aggraver et retarder la cicatrisation ;
- nettoie les lésions à l’eau et au savon, sans alcool, puis sèche doucement ;
- laisse-les à l’air libre, sans pansement ; porte des vêtements amples et des sous-vêtements en coton ;
- bois abondamment si tu as des brûlures en urinant ;
- évite les rapports pendant la poussée.

**Entre les poussées :**
- apprends à reconnaître les signes qui annoncent une crise chez toi, pour commencer le traitement vite ;
- informe ton ou ta médecin, ton ou ta gynécologue et ton ou tes partenaires ;
- l’Assurance Maladie conseille d’éviter le stress, qui peut affaiblir les défenses immunitaires.

**En parler à un ou une partenaire :** c’est une conversation délicate mais importante. Tu peux expliquer que l’infection est fréquente, qu’elle se gère et que vous pouvez décider ensemble des précautions.

## Questions fréquentes
**Les crises vont-elles revenir toute ma vie ?** Pas forcément : QuestionSexualité indique que les crises suivantes peuvent survenir à tout moment ou ne jamais survenir.

**Puis-je transmettre l’herpès sans poussée ?** Oui, le virus peut être présent sans signe visible. C’est pourquoi l’information du partenaire et les précautions comptent.

**Est-ce dangereux si je suis enceinte ?** L’herpès peut être transmis au bébé lors de l’accouchement. Si tu as déjà eu un herpès génital, préviens **immédiatement** ton ou ta médecin ou ta sage-femme dès le début de la grossesse.

**Les lésions peuvent-elles toucher d’autres zones que le sexe ?** Oui : QuestionSexualité décrit des cloques possibles sur les organes génitaux, l’anus ou la bouche. Signale à ton ou ta médecin toutes les zones touchées.

## Quand demander conseil
Consulte dès l’apparition de lésions génitales, si la douleur persiste malgré les antalgiques, ou si tu es enceinte et as des antécédents d’herpès. Fièvre élevée avec malaise ou état qui se dégrade rapidement : appelle le **15** ou le **112**. Vivre avec une IST peut peser sur le moral ; si tu te sens dépassée, tu peux appeler le **3114**.

${FIN}`,
  }),
  // ------------------------------------------------------------ sexualité et confort intime
  a({
    slug: 'douleurs-pendant-les-rapports-dyspareunie-causes-solutions',
    title: 'Douleurs pendant les rapports (dyspareunie) : les causes possibles et les solutions',
    summary: 'Avoir mal pendant ou après la pénétration n’est pas à subir : les causes physiques fréquentes, le lien avec l’endométriose, ce qui peut aider et les professionnels à consulter.',
    tags: ['dyspareunie', 'douleur pendant les rapports', 'mal pendant la pénétration', 'rapports douloureux', 'endométriose', 'lubrifiant', 'sexologue', 'douleur profonde'],
    journeys: ['avoid', 'ttc'],
    sources: [S.dyspareunieQS, S.dyspareunieEndo],
    body_md: `## En bref
- La dyspareunie désigne les **douleurs liées à la pénétration** ou à une tentative de pénétration, pendant ou après le rapport. Elle concerne environ **7,5 % des femmes** sexuellement actives, selon QuestionSexualité.
- La douleur peut être **superficielle** (vulve, entrée du vagin) ou **profonde** (au fond du vagin, dans le bas-ventre).
- Les causes sont le plus souvent **physiques** : lubrification insuffisante, mycose, IST, sécheresse, endométriose, cicatrice, kyste ou fibrome…
- Cette douleur est **réelle** et des solutions existent : **parles-en** à un ou une gynécologue ou une sage-femme.

## Comprendre
QuestionSexualité liste les principales causes physiques chez les personnes ayant un vagin : un manque de lubrification, une mycose vaginale, une infection sexuellement transmissible, une sécheresse vaginale (liée par exemple à une contraception mal adaptée ou à la ménopause), un dysfonctionnement des muscles du périnée, l’endométriose, une cicatrice d’épisiotomie, un kyste, un fibrome ou leurs traitements. Une douleur qui s’installe progressivement oriente plutôt vers une cause physique.

**Douleur profonde et endométriose :** Santé.fr (contenu EndoFrance) explique que la douleur ressentie au fond du vagin lors de la pénétration est un symptôme fréquent de l’endométriose et fait partie des signes qui orientent vers ce diagnostic, surtout si elle s’associe à des règles douloureuses, des troubles digestifs ou urinaires. Elle peut apparaître dès les premiers rapports ou bien plus tard, et varier d’une gêne à l’impossibilité d’avoir des rapports.

**Les causes psychologiques** (difficultés de couple, baisse de désir, expérience traumatique, anxiété) ne doivent être envisagées qu’après un examen médical attentif. Même dans ce cas, la douleur n’est pas « dans la tête » : elle est bien ressentie. Non prise en charge, elle peut entraîner une baisse du désir et peser sur le couple.

## Au quotidien
**Ce qui peut aider, selon QuestionSexualité :**
- un **lubrifiant** pendant les rapports, première piste à envisager ;
- prendre le temps des préliminaires, pour favoriser l’excitation et la lubrification naturelle ;
- si la douleur vient d’un périnée contracté, des massages doux peuvent soulager ;
- les crèmes anesthésiantes locales existent mais peuvent diminuer le plaisir : demande d’abord l’avis d’un médecin ou d’un pharmacien, car certains produits fragilisent les préservatifs.

**En parler à ton ou ta partenaire :** expliquer que la douleur est réelle, convenir d’un signal pour arrêter, explorer d’autres formes de sexualité que la pénétration. EndoFrance encourage ce dialogue pour trouver des solutions ensemble.

**Préparer la consultation :**
- note où tu as mal (entrée du vagin ou fond), à quel moment (début, pendant, après), dans quelles positions ;
- note si tu as aussi des règles douloureuses, des troubles digestifs ou urinaires ;
- indique ta contraception et tes éventuelles infections récentes.

## Questions fréquentes
**Est-ce que je dois continuer les rapports malgré la douleur ?** Non. Ton consentement et ton confort comptent ; personne ne peut t’obliger à un rapport. Arrêter quand ça fait mal et consulter permet de trouver la cause.

**Qui consulter ?** Un ou une gynécologue ou une sage-femme, qui pourra t’orienter. Selon la cause, d’autres professionnels peuvent intervenir : kinésithérapeute spécialisé dans le périnée, sexologue, psychologue, gynécologue spécialisé dans les douleurs pelviennes. Choisis une personne qui prend le temps de t’écouter et de t’examiner.

**On m’a dit que c’était psychologique.** EndoFrance met en garde contre ce raccourci : une endométriose peut être à l’origine de douleurs profondes. Si tu n’es pas entendue, demande un autre avis.

**La douleur peut-elle compliquer un projet de grossesse ?** EndoFrance note qu’une dyspareunie importante peut, en réduisant les rapports, peser sur la fertilité du couple ; et l’endométriose elle-même peut être en cause. Parles-en à ton ou ta professionnelle.

## Quand demander conseil
Consulte si la douleur se répète, s’aggrave, s’accompagne de saignements après les rapports, de pertes inhabituelles, de fièvre ou de règles très douloureuses. Une douleur qui t’empêche de vivre ta sexualité comme tu le souhaites n’est pas à subir. Douleur brutale et intense dans le bas-ventre (surtout avec un retard de règles) ou fièvre avec douleurs pelviennes : appelle le **15** ou le **112**. Si des rapports te sont imposés, tu peux appeler le **3919**.

${FIN}`,
  }),
  a({
    slug: 'secheresse-vaginale-causes-lubrifiant-hydratant-traitements',
    title: 'Sécheresse vaginale : pourquoi elle apparaît et ce qui peut soulager',
    summary: 'Contraception, ménopause, irritation : les causes de la sécheresse vaginale, la différence entre lubrifiant et hydratant, et les traitements locaux à discuter avec un professionnel.',
    tags: ['sécheresse vaginale', 'sécheresse intime', 'lubrifiant', 'hydratant vaginal', 'ménopause', 'atrophie vaginale', 'irritation', 'rapports douloureux', 'œstrogènes'],
    sources: [S.menopauseVivre, S.menopauseSexuQS, S.libidoContraQS],
    body_md: `## En bref
- La sécheresse vaginale se traduit par un manque de lubrification, des **irritations**, parfois des **douleurs pendant les rapports**.
- Elle est fréquente **autour de la ménopause** (baisse des œstrogènes), mais peut aussi être liée à une **contraception hormonale** faiblement dosée, à des produits irritants ou à un manque d’excitation.
- Un **lubrifiant** pendant les rapports et un **hydratant vaginal** utilisé régulièrement peuvent aider.
- Selon Santé.fr, ces gênes **ne sont pas une fatalité** : des traitements locaux, dont certains à base d’œstrogènes, peuvent être proposés.

## Comprendre
La lubrification du vagin dépend en grande partie des œstrogènes. QuestionSexualité explique qu’à la ménopause, la baisse de ces hormones rend la lubrification moins abondante et plus lente, et peut s’accompagner d’une perte de souplesse de la muqueuse (atrophie vaginale) rendant la pénétration inconfortable, voire douloureuse.

Avant la ménopause, la sécheresse peut avoir d’autres origines. QuestionSexualité indique que certaines contraceptions hormonales faiblement dosées en œstrogènes peuvent provoquer une sécheresse vaginale chez certaines femmes. Les produits d’hygiène intime parfumés ou agressifs, que Santé.fr conseille d’éviter, peuvent aussi irriter la muqueuse. Enfin, un manque d’excitation (fatigue, stress, préliminaires trop courts) réduit la lubrification naturelle.

## Au quotidien
**Lubrifiant ou hydratant, quelle différence ?**
- le **lubrifiant** s’utilise **au moment du rapport** pour faciliter la pénétration ; il en existe à base d’eau ou de silicone ;
- l’**hydratant vaginal** s’utilise **régulièrement**, en dehors des rapports, pour améliorer le confort de la muqueuse au quotidien ; Santé.fr le cite parmi les options.

**Bien choisir (sans marque) :**
- préfère des produits **sans parfum** ;
- si tu utilises des préservatifs, vérifie sur l’emballage que le lubrifiant est **compatible** : certains produits gras fragilisent le latex ;
- arrête un produit qui pique ou irrite, et demande conseil à ton pharmacien.

**Protéger ta muqueuse :**
- évite les produits d’hygiène intime parfumés ou agressifs et les douches vaginales ;
- porte des sous-vêtements en coton ;
- prends le temps des préliminaires pendant les rapports, comme le conseille QuestionSexualité.

**Les traitements à discuter :** si les gênes persistent, un ou une médecin, gynécologue ou sage-femme peut proposer un traitement local, notamment à base d’œstrogènes, contre la sécheresse et l’atrophie vaginale. Si ta contraception semble en cause, il est possible d’en changer en en parlant avec un professionnel.

## Questions fréquentes
**Je ne suis pas ménopausée et j’ai une sécheresse, est-ce possible ?** Oui. Une contraception hormonale, des produits irritants ou un manque d’excitation peuvent jouer, selon les sources consultées. Un examen permet aussi d’écarter une infection.

**La sécheresse peut-elle faire baisser le désir ?** QuestionSexualité indique que l’inconfort lié à la sécheresse peut freiner la sexualité et faire baisser la libido. La soulager peut aider à retrouver du plaisir.

**Tous les lubrifiants vont-ils avec les préservatifs ?** Non : les produits gras peuvent fragiliser les préservatifs en latex. Vérifie l’emballage ou demande conseil au pharmacien pour un produit adapté à la muqueuse et compatible.

**Faut-il en parler à mon ou ma partenaire ?** Santé.fr encourage à en parler avec son partenaire et avec un professionnel : cela évite que la douleur s’installe et permet d’adapter vos moments d’intimité.

## Quand demander conseil
Consulte si la sécheresse s’accompagne de démangeaisons, brûlures, pertes inhabituelles, saignements (en particulier **après la ménopause**, ce qui doit toujours faire consulter) ou de douleurs pendant les rapports qui persistent. Une gêne qui t’empêche de vivre normalement ou ta sexualité comme tu le souhaites n’est pas à subir : une sage-femme, un ou une gynécologue, ton médecin généraliste ou un ou une sexologue peuvent t’aider.

${FIN}`,
  }),
  a({
    slug: 'vaginisme-comprendre-prise-en-charge',
    title: 'Vaginisme : quand la pénétration est impossible ou très douloureuse',
    summary: 'Le vaginisme est une contraction involontaire du périnée qui empêche ou rend douloureuse toute pénétration : comprendre ses formes, ses causes possibles et la prise en charge qui fonctionne.',
    tags: ['vaginisme', 'pénétration impossible', 'contraction périnée', 'tampon impossible', 'peur de la pénétration', 'sexothérapie', 'kinésithérapeute', 'premier rapport'],
    journeys: ['avoid', 'ttc'],
    sources: [S.vaginismeQS, S.dyspareunieQS, S.premiereGynecoQS],
    body_md: `## En bref
- Le vaginisme est une **contraction involontaire des muscles du périnée** autour du vagin, qui se déclenche lors d’une tentative d’insertion (doigt, tampon, spéculum, pénis) ou à la simple pensée d’une pénétration.
- Il rend la pénétration **douloureuse, voire impossible**. Ce n’est ni un manque d’envie, ni un rejet du ou de la partenaire.
- Il peut exister **depuis toujours** (primaire) ou **apparaître plus tard** (secondaire), dans toutes les situations ou seulement certaines.
- QuestionSexualité le dit clairement : **le vaginisme n’est pas une fatalité**. Une prise en charge pluridisciplinaire aide.

## Comprendre
QuestionSexualité décrit plusieurs formes :
- **primaire** : présent depuis le début de la vie sexuelle ;
- **secondaire** : apparu après une période où la pénétration était possible ;
- **total** : dans toutes les situations et avec tout objet ;
- **partiel** ou situationnel : la pénétration est possible dans certains contextes ou avec certaines personnes, pas dans d’autres.

Les causes sont propres à chaque personne : une cause physique, des douleurs de la vulve (vulvodynie), une éducation stricte ou des interdits, la peur d’une grossesse, un traumatisme sexuel… Quelle que soit l’origine, le résultat est une forte contraction du périnée. Un cercle peut ensuite s’installer : la douleur génère de l’angoisse, qui renforce la contraction, qui renforce la douleur.

Les sensations sont souvent décrites comme une brûlure ou une impression de déchirement, avec de la peur à l’idée d’une introduction dans le vagin. La contraction est involontaire : on ne peut pas la « décider ».

## Au quotidien
**Te rappeler l’essentiel :** la sexualité ne se résume pas à la pénétration. Le désir et le plaisir restent possibles, par d’autres pratiques, sans pression.

**Parler avec ton ou ta partenaire :** QuestionSexualité souligne que le dialogue est essentiel pour lui faire comprendre que les contractions sont involontaires et ne disent rien de ton envie ni de vos sentiments. Vous pouvez convenir ensemble de mettre la pénétration de côté le temps de la prise en charge.

**Trouver le bon accompagnement :**
- psychologue, médecin, gynécologue, sage-femme ou conseiller ou conseillère conjugale : choisis quelqu’un avec qui tu te sens écoutée et en confiance ;
- la prise en charge associe généralement une **sexothérapie** et un **travail corporel** personnel, souvent accompagné par un **kinésithérapeute** spécialisé dans le périnée ;
- elle se construit dans la durée, à ton rythme.

**Pendant les consultations :** tu as le droit de **refuser un toucher vaginal** ou un examen avec spéculum. Tu peux demander qu’on t’explique chaque geste avant, et arrêter à tout moment. QuestionSexualité rappelle aussi qu’un examen n’est pas toujours nécessaire lors d’une consultation gynécologique.

## Questions fréquentes
**Je n’arrive pas à mettre un tampon, est-ce du vaginisme ?** Pas forcément. Mais si toute tentative déclenche une contraction réflexe et une douleur, parles-en à un ou une professionnelle.

**Est-ce que c’est « dans ma tête » ?** Le vaginisme associe le corps et les émotions. La contraction est réelle et involontaire, et des causes physiques peuvent être en jeu : c’est pour cela qu’un examen respectueux et une prise en charge globale sont utiles.

**Puis-je avoir un enfant si j’ai un vaginisme ?** Le vaginisme se soigne, et des solutions existent pour un projet de grossesse : parles-en à ton ou ta gynécologue ou à ta sage-femme.

**Combien de temps dure la prise en charge ?** Elle varie selon chaque personne. QuestionSexualité indique qu’elle s’inscrit dans la durée.

## Quand demander conseil
Consulte dès que la pénétration est impossible ou douloureuse, ou que la peur t’empêche de vivre ta sexualité comme tu le souhaites : ce n’est pas à subir. Si le vaginisme est lié à des violences sexuelles, tu peux être aidée : **3919** (gratuit, anonyme, 24 h/24) ; en cas de danger immédiat, **17** ou **112**. Si tu te sens très angoissée ou déprimée, le **3114** répond jour et nuit.

${FIN}`,
  }),
  a({
    slug: 'baisse-du-desir-libido-causes-contraception-en-parler',
    title: 'Baisse du désir : les causes possibles et à qui en parler',
    summary: 'Contraception, sécheresse, douleur, fatigue, ménopause : ce qui peut faire varier le désir, ce que tu peux essayer et pourquoi ton consentement reste toujours la règle.',
    tags: ['baisse de libido', 'désir sexuel', 'plus envie', 'libido', 'contraception et libido', 'pilule', 'sécheresse', 'couple', 'consentement', 'sexologue'],
    sources: [S.libidoContraQS, S.menopauseSexuQS, S.devoirConjugalQS],
    body_md: `## En bref
- Le désir varie au fil de la vie, des périodes et des relations. Une baisse n’est un problème **que si elle te préoccupe** ou te fait souffrir.
- Plusieurs facteurs peuvent jouer : **contraception hormonale** chez certaines femmes, **sécheresse vaginale**, **douleurs pendant les rapports**, **ménopause**, maladie ou traitement, contexte de vie.
- Des **solutions existent** : lubrifiant, changement de contraception, traitement d’une douleur, accompagnement sexologique.
- Le **consentement** reste la règle : personne, même dans un couple marié, ne peut t’obliger à un rapport.

## Comprendre
**Contraception :** QuestionSexualité explique que les études sur le lien entre pilule et désir ne sont pas unanimes. Certaines femmes signalent une baisse de libido sous contraception hormonale (pilule, patch, anneau, implant, DIU hormonal), d’autres un effet favorable, par exemple quand les règles deviennent moins douloureuses. Deux pistes sont avancées : certains contraceptifs pourraient diminuer le taux de testostérone, et les contraceptions faiblement dosées en œstrogènes peuvent provoquer une sécheresse vaginale. Chaque femme réagit différemment.

**Sécheresse et douleur :** une lubrification insuffisante ou des rapports douloureux freinent logiquement l’envie. Soigner la cause peut suffire à retrouver du désir.

**Ménopause :** selon QuestionSexualité, environ 40 % des femmes ménopausées signalent un problème sexuel, mais la ménopause n’en est pas la seule cause : une maladie, un traitement ou d’autres facteurs peuvent aussi intervenir. Certaines femmes ressentent au contraire un regain de sexualité, libérées de la contraception et des règles.

**Le contexte :** fatigue, stress, changements émotionnels, estime de soi, difficultés dans la relation peuvent aussi peser.

## Au quotidien
**Des pistes à explorer :**
- note dans ton calendrier si ton envie varie selon le moment du cycle, la fatigue ou un changement récent (nouvelle contraception, traitement) : c’est utile pour en parler ;
- si la sécheresse gêne, un **lubrifiant** (à base d’eau ou de silicone) peut aider ;
- prends le temps des préliminaires, qui favorisent l’excitation et la lubrification ;
- si tu soupçonnes ta contraception, **n’arrête pas seule** sans solution de relais : parles-en à ton médecin, ta sage-femme ou ton ou ta gynécologue, qui pourront te proposer une autre méthode ;
- QuestionSexualité rappelle qu’il existe des contraceptions sans hormones (préservatif, DIU au cuivre, diaphragme, cape cervicale).

**Dans le couple :**
- parler de ses envies et de ses limites, sans reproche ;
- se rappeler que l’intimité ne se résume pas à la pénétration ;
- une consultation de sexologie ou de conseil conjugal peut aider à rouvrir le dialogue.

## Questions fréquentes
**Je n’ai plus envie, suis-je « anormale » ?** Non. Le désir est variable et il n’existe pas de « bonne » fréquence. Ce qui compte, c’est ce que toi tu ressens et souhaites.

**Mon ou ma partenaire insiste, dois-je accepter ?** Non. QuestionSexualité est clair : le « devoir conjugal » n’existe pas. Imposer un acte sexuel à quelqu’un, y compris à son conjoint, est interdit par la loi.

**Le DIU au cuivre change-t-il le désir ?** Il ne modifie pas l’équilibre hormonal, selon QuestionSexualité. Si les fils gênent ton ou ta partenaire, un ou une professionnelle peut les raccourcir.

**Existe-t-il des traitements ?** QuestionSexualité indique que des solutions médicales existent, selon la cause. Un professionnel pourra en discuter avec toi.

## Quand demander conseil
Parles-en à ton médecin, à une sage-femme, à un ou une gynécologue ou à un ou une sexologue si la baisse de désir te préoccupe, s’accompagne de douleurs, de sécheresse ou de tristesse persistante. Si tu te sens déprimée ou à bout, appelle le **3114** (jour et nuit). Si des rapports te sont imposés ou si tu subis des violences, le **3919** est gratuit et anonyme, 24 h/24 ; en cas de danger immédiat, **17** ou **112**.

${FIN}`,
  }),
  // ------------------------------------------------------------ périnée, seins, vulve, violences
  a({
    slug: 'fuites-urinaires-femme-hors-grossesse-effort-urgence-perinee',
    title: 'Fuites urinaires en dehors de la grossesse : comprendre et agir',
    summary: 'Fuites quand tu tousses, cours ou ris, ou envies pressantes impossibles à retenir : les types de fuites urinaires, leurs causes et la rééducation du périnée, premier traitement.',
    tags: ['fuites urinaires', 'incontinence urinaire', 'incontinence d’effort', 'envie pressante', 'périnée', 'rééducation périnéale', 'sport et fuites', 'kinésithérapeute', 'ménopause'],
    sources: [S.incontinenceCauses, S.incontinenceTraitement],
    body_md: `## En bref
- Les fuites urinaires ne concernent pas que la grossesse ou le grand âge : elles peuvent toucher des femmes **jeunes**, y compris sportives ou n’ayant pas accouché.
- Il existe des fuites **à l’effort** (toux, rire, saut, port de charges), des fuites **par urgence** (besoin pressant impossible à retenir) et des formes **mixtes**.
- Selon l’Assurance Maladie, la **rééducation du périnée** est le **traitement initial** des fuites à l’effort, et elle est aussi recommandée pour les autres formes.
- Beaucoup de femmes n’en parlent pas : pourtant des solutions existent, **ose en parler**.

## Comprendre
L’Assurance Maladie distingue trois formes :
- **l’incontinence d’effort** : une fuite sans envie préalable, lors d’un effort (marche, saut, port de charge, changement de position) ou d’un effort minime (toux, rire, éternuement) ;
- **l’hyperactivité vésicale** (« urgenterie ») : une fuite précédée d’un besoin urgent et impérieux, parfois au repos ou la nuit ;
- **l’incontinence mixte**, qui associe les deux et représente environ la moitié des cas.

Plusieurs facteurs peuvent favoriser les fuites : les suites d’une grossesse ou d’un accouchement difficile, la ménopause (baisse des hormones), le surpoids, la constipation chronique, une toux chronique, certains médicaments, une consommation importante de caféine, d’alcool ou de tabac. Les sports qui sollicitent le périnée de façon répétée (course à pied, trampoline, sauts, haltérophilie…) peuvent révéler une fragilité. Chez des femmes sans facteur particulier et n’ayant pas accouché, une fragilité des tissus de soutien est suspectée.

Des fuites par urgence peuvent aussi être liées à une **infection urinaire** : un examen médical permet de rechercher une cause à traiter.

## Au quotidien
**Les repères de la prise en charge (Assurance Maladie) :**
- la **rééducation périnéo-sphinctérienne** est réalisée par un ou une kinésithérapeute (ou une sage-femme après un accouchement) ; elle vise à renforcer le plancher pelvien et demande ta participation active ;
- un **travail d’auto-rééducation** entre les séances est recommandé : les exercices appris en séance sont à refaire chez toi ;
- un **traitement comportemental** peut aider : adapter ta consommation de liquides et reprogrammer tes passages aux toilettes pour les espacer progressivement ;
- le rééducateur donne aussi des conseils de postures et d’activité ;
- traiter ce qui favorise les fuites : constipation, toux chronique, surpoids.

**Si tu fais du sport :** ne renonce pas forcément à ton activité, mais parles-en : un ou une kinésithérapeute peut t’aider à adapter tes entraînements et à renforcer ton périnée.

**Noter ce qui se passe :** pendant quelques jours, note dans ton calendrier quand surviennent les fuites (effort, envie pressante, nuit), ce que tu bois et combien de fois tu urines. Ces informations aident beaucoup lors de la consultation.

**Après la ménopause :** l’Assurance Maladie indique que des œstrogènes locaux, proposés en cas de sécheresse vaginale, améliorent souvent les fuites associées.

## Questions fréquentes
**Faut-il boire moins pour fuir moins ?** Pas de ta propre initiative : boire trop peu favorise les infections urinaires et la constipation. Le traitement comportemental consiste à **adapter** les apports avec un professionnel, pas à les supprimer.

**Je n’ai jamais accouché, est-ce possible ?** Oui, l’Assurance Maladie l’évoque, notamment chez des sportives ou en cas de fragilité des tissus de soutien.

**La rééducation suffit-elle ?** C’est le traitement de première intention. Si les fuites persistent malgré elle, d’autres options (médicaments pour l’hyperactivité vésicale, chirurgie dans certains cas) peuvent être discutées avec un médecin.

**À qui en parler ?** À ton médecin généraliste, ta sage-femme ou ton ou ta gynécologue, qui pourront prescrire une rééducation.

## Quand demander conseil
Consulte si les fuites te gênent, même un peu : ce n’est pas à subir. Consulte rapidement si elles s’accompagnent de brûlures en urinant, de sang dans les urines, de douleurs, ou d’une sensation de boule ou de pesanteur dans le vagin. Fièvre avec douleurs dans le dos ou sur le côté : consulte dans la journée ; en cas de malaise, appelle le **15** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'depistage-cancer-du-sein-examen-clinique-mammographie-signes',
    title: 'Dépistage du cancer du sein : examen des seins, mammographie et signes à connaître',
    summary: 'Examen clinique des seins dès 25 ans, mammographie tous les deux ans de 50 à 74 ans, signes qui doivent faire consulter : les repères de l’Institut national du cancer.',
    tags: ['cancer du sein', 'dépistage', 'mammographie', 'palpation des seins', 'boule dans le sein', 'examen clinique', 'octobre rose', 'mamelon', 'facteurs de risque'],
    safety_critical: true,
    sources: [S.seinExamens, S.seinDepistageFaq, S.seinSante],
    body_md: `## En bref
- L’Institut national du cancer recommande un **examen clinique des seins** (observation et palpation) par un ou une professionnelle **tous les ans dès 25 ans**.
- **De 50 à 74 ans**, sans symptôme ni risque particulier : une **mammographie tous les deux ans**, complétée si besoin par une échographie, dans le cadre du **dépistage organisé gratuit**.
- Les femmes à **risque élevé** (antécédents familiaux, prédisposition) peuvent bénéficier d’un suivi spécifique : parles-en.
- Une boule, un changement de la peau ou du mamelon, un écoulement doivent faire **consulter sans attendre**, quel que soit ton âge.

## Comprendre
Le cancer du sein est le plus fréquent des cancers chez la femme. Santé.fr rappelle qu’environ 80 % des cas sont diagnostiqués après 50 ans, d’où le dépistage organisé à partir de cet âge. Ce programme propose gratuitement, depuis 2004, une mammographie tous les deux ans. Selon Santé.fr (INCa), les mammographies normales y sont relues par un second radiologue expérimenté, par sécurité. L’INCa souligne que le dépistage a des bénéfices et des limites, et recommande de s’informer avant de décider.

**Facteurs de risque cités par Santé.fr :** l’âge, des antécédents familiaux (mère, sœur ou fille atteinte), des antécédents personnels, certaines lésions bénignes du sein, des radiothérapies du thorax, une exposition prolongée aux œstrogènes (premières règles précoces, ménopause tardive, première grossesse tardive ou absence de grossesse). D’autres sont liés au mode de vie : surpoids après la ménopause, tabac, alcool, manque d’activité physique, certains traitements hormonaux pris longtemps. Pour la pilule, Santé.fr précise que le risque supplémentaire est minime.

## Au quotidien
**Avant 50 ans :**
- demande un examen de tes seins lors de ta consultation de suivi gynécologique annuelle, chez ton médecin, ta sage-femme ou ton ou ta gynécologue ;
- si une proche (mère, sœur, fille) a eu un cancer du sein ou de l’ovaire, signale-le : un dépistage adapté à ton risque peut t’être proposé.

**De 50 à 74 ans :**
- dans le cadre du dépistage organisé, la mammographie est proposée gratuitement tous les deux ans : garde ton courrier d’invitation et prends rendez-vous chez un radiologue ;
- note la date dans ton calendrier pour ne pas laisser passer l’échéance.

**Connaître tes seins :** observer et palper tes seins de temps en temps, par exemple sous la douche, t’aide à remarquer un changement. Cela ne remplace pas l’examen par un professionnel ni la mammographie.

**Les signes qui doivent faire consulter (Santé.fr) :**
- une **masse dure** dans un sein, souvent indolore, aux contours irréguliers ;
- des **ganglions durs** sous l’aisselle ;
- un **écoulement spontané** par un mamelon ;
- un **mamelon qui se rétracte** ou une **peau qui change** (dure, grumeleuse, aspect « peau d’orange ») ;
- une modification de la forme ou du volume d’un sein.

**Réduire ce qui peut l’être :** limiter l’alcool, ne pas fumer, bouger régulièrement, surveiller son poids après la ménopause.

## Questions fréquentes
**J’ai trouvé une boule, est-ce un cancer ?** Pas forcément : beaucoup de boules sont bénignes. Mais seul un examen permet de le savoir ; consulte rapidement.

**J’ai moins de 50 ans, ai-je droit à une mammographie ?** En dehors du dépistage organisé, une mammographie peut être prescrite si un examen le justifie ou si ton risque est élevé.

**Et après 74 ans ?** Selon l’INCa, la question se discute au cas par cas avec ton médecin.

**La pilule augmente-t-elle le risque ?** Santé.fr indique un risque supplémentaire minime en cas de prise prolongée ; parles-en à ton ou ta professionnelle si tu as des antécédents familiaux.

## Quand demander conseil
Consulte **rapidement** ton médecin, ta sage-femme ou ton ou ta gynécologue en cas de boule, d’écoulement, de rétraction du mamelon ou de changement de la peau d’un sein, même si tu as eu une mammographie récente. Attendre un résultat peut être très angoissant : n’hésite pas à demander du soutien, et si l’anxiété te submerge, le **3114** répond jour et nuit.

${FIN}`,
  }),
  a({
    slug: 'demangeaisons-brulures-vulve-douloureuse-vulvodynie',
    title: 'Démangeaisons, brûlures, vulve douloureuse : causes possibles et que faire',
    summary: 'Mycose, irritation, sécheresse, IST ou vulvodynie : ce qui peut provoquer des démangeaisons ou des douleurs de la vulve, les gestes qui soulagent et pourquoi consulter.',
    tags: ['démangeaisons vulve', 'brûlure vulve', 'vulvodynie', 'vulve douloureuse', 'irritation intime', 'prurit vulvaire', 'mycose', 'lichen', 'gratter'],
    sources: [S.vulveQS, S.vaginiteDef, S.vaginitePrevention],
    body_md: `## En bref
- Démangeaisons et brûlures de la vulve sont **fréquentes** : mycose, vaginite, irritation par des produits ou des frottements, sécheresse, IST, maladie de peau…
- Quand des **douleurs vulvaires durent au moins trois mois**, on parle de **vulvodynie**, souvent sans lésion visible.
- QuestionSexualité le rappelle : **avoir mal à la vulve n’est pas à banaliser** ; un avis médical est utile.
- Des gestes simples soulagent souvent : coton, vêtements amples, produits sans parfum, lessive douce.

## Comprendre
**Les causes les plus courantes de démangeaisons** sont les vulvovaginites. L’Assurance Maladie explique que la vaginite est presque toujours associée à une irritation de la vulve, avec démangeaisons ou brûlures, lèvres rouges et gonflées, parfois douleurs pendant les rapports ou en urinant. Elle peut être infectieuse (mycose, bactérie, parasite, herpès) ou non infectieuse : irritation par des produits (gels douche, savons, lubrifiants, spermicides), frottements, sous-vêtements serrés, maladie de peau étendue à la vulve, ou baisse des œstrogènes après la ménopause.

**La vulvodynie** est décrite par QuestionSexualité comme une douleur vulvaire qui persiste au moins trois mois : brûlure (la sensation la plus fréquente), impression de chair à vif ou de coupure, irritation qui donne envie de se gratter, douleur au contact (position assise prolongée, serviette hygiénique, vélo, vêtements serrés), douleur intense pendant les rapports. Le plus souvent, aucune lésion n’est visible. Les causes possibles sont nombreuses : déshydratation de la vulve, infection (mycose, IST), maladie de peau comme le lichen, atteinte d’un nerf, irritation par des produits d’hygiène ou de lessive, endométriose, déséquilibre hormonal (périménopause), cicatrice d’épisiotomie ou d’intervention, maladie auto-immune. Ces douleurs ont souvent un retentissement émotionnel.

## Au quotidien
**Ce qui peut soulager (QuestionSexualité, Assurance Maladie) :**
- des sous-vêtements en **coton** et des vêtements **peu serrés** à l’entrejambe ;
- dormir sans sous-vêtement ;
- des produits d’hygiène intime et une **lessive sans parfum**, hypoallergéniques ;
- une toilette **uniquement externe**, une à deux fois par jour, puis bien sécher sans frotter ;
- pas de douche vaginale, de déodorant intime ou de talc ;
- hydrater la vulve avec un produit dédié, si la peau est sèche ;
- éviter de rester longtemps en maillot de bain mouillé.

**Pendant les rapports :** un lubrifiant peut aider ; QuestionSexualité cite aussi des gels anesthésiants ou des massages du périnée pour certaines personnes, à discuter avec un professionnel. L’écoute de ton ou ta partenaire compte.

**Pour la consultation :** note depuis quand les symptômes durent, ce qui les déclenche ou les soulage, les produits utilisés, et s’il y a des pertes associées. Évite la toilette intime juste avant le rendez-vous, pour que les pertes puissent être examinées.

## Questions fréquentes
**Des démangeaisons, c’est forcément une mycose ?** Non. La mycose est fréquente, mais une irritation, une sécheresse, une IST ou une maladie de peau peuvent donner des signes proches. Si ce n’est pas une mycose déjà connue et reconnue, consulte avant de te traiter.

**J’ai mal mais rien ne se voit, est-ce réel ?** Oui. QuestionSexualité indique que dans la vulvodynie, le plus souvent aucune lésion n’est visible. La douleur est bien réelle et mérite une prise en charge.

**Qui consulter ?** D’abord ton médecin traitant ou ton ou ta gynécologue. Selon les cas : dermatologue, kinésithérapeute spécialisé dans le périnée, psychologue ou sexologue.

**Et chez une petite fille ?** L’Assurance Maladie cite, chez l’enfant, une toilette incomplète, des oxyures (petits vers intestinaux) ou un objet introduit dans le vagin. Un écoulement malodorant justifie de consulter dans la journée.

## Quand demander conseil
Consulte si les démangeaisons ou brûlures durent plus de quelques jours, reviennent, s’accompagnent de pertes inhabituelles, de plaies, de boutons ou de cloques, ou si tu as mal pendant les rapports. Une douleur qui t’empêche de t’asseoir, de dormir ou de vivre normalement n’est pas à subir. Fièvre avec douleurs pelviennes : **15** ou **112**.

${FIN}`,
  }),
  a({
    slug: 'violences-sexuelles-ou-trouver-aide-3919-17-112',
    title: 'Violences sexuelles : où trouver de l’aide, que faire, quels numéros',
    summary: 'Personne n’a le droit de t’imposer un acte sexuel : les numéros à connaître, les premiers réflexes de santé, comment porter plainte et où être accompagnée, à ton rythme.',
    tags: ['violences sexuelles', 'agression sexuelle', 'viol', '3919', 'consentement', 'porter plainte', 'victime', 'aide', 'viol conjugal', 'harcèlement'],
    safety_critical: true,
    sources: [S.violencesSexuelles, S.devoirConjugalQS],
    body_md: `## En bref
- **Personne n’a le droit de t’imposer un acte sexuel** que tu ne désires pas, y compris dans un couple ou un mariage.
- **En danger immédiat** : appelle le **17** (police, gendarmerie) ou le **112** ; par SMS, le **114**. Pour une urgence médicale, le **15**.
- Pour parler, être écoutée et orientée : le **3919** (Violences Femmes Info), **gratuit et anonyme, 24 h/24 et 7 j/7**.
- La responsabilité revient **uniquement à l’auteur**. Rien de ce que tu as fait, dit ou porté ne justifie des violences.

## Comprendre
Le site gouvernemental arretonslesviolences.gouv.fr rappelle que les violences sexuelles portent atteinte à l’intégrité physique et psychologique. Elles recouvrent notamment le viol, l’agression sexuelle, le harcèlement sexuel, le voyeurisme, l’exploitation sexuelle et la diffusion de contenus intimes, y compris en ligne.

Le **consentement** doit être libre, éclairé, spécifique, préalable et révocable : il ne se déduit **ni du silence, ni de l’absence de réaction**. Tu peux changer d’avis à tout moment.

Dans le couple, QuestionSexualité est clair : le « devoir conjugal » **n’existe pas**. La loi n’impose pas de rapports sexuels aux personnes mariées, et imposer un acte sexuel à son conjoint ou à sa conjointe est puni par la loi ; le fait d’être en couple avec la victime est même une circonstance aggravante.

Les réactions après des violences sont très variables : sidération, honte, colère, troubles du sommeil, peur… Il n’y a pas de « bonne » façon de réagir.

## Au quotidien
**Les premiers réflexes possibles (arretonslesviolences.gouv.fr)**, à ton rythme :
- **ne pas rester seule** : parler à une personne de confiance, à un ou une professionnelle de santé, à une association ;
- **consulter un ou une médecin** rapidement : il ou elle peut établir un constat et un certificat médical, et proposer les soins d’urgence nécessaires (contraception d’urgence, traitement préventif contre le VIH, dépistage et traitement d’éventuelles infections) ;
- si c’est possible, ne pas te laver et garder les vêtements dans un **sac en papier** : cela peut servir de preuve ;
- **conserver les traces numériques** (messages, photos, vidéos) ;
- en cas de traumatisme, te faire accompagner par un ou une professionnelle formée : il existe des centres régionaux de psychotraumatisme.

**Porter plainte :** au commissariat ou à la gendarmerie, quand tu te sens prête. Les délais pour porter plainte sont longs (par exemple 20 ans pour un viol sur une personne majeure), et même au-delà, il reste possible de déposer plainte. Une plateforme de signalement en ligne, accessible depuis service-public.fr, permet d’échanger par tchat 24 h/24 avec des policiers ou gendarmes formés ; tu peux quitter rapidement le tchat et effacer l’historique.

**Dans les transports :** le **3117** (appel) ou le **31177** (SMS) permettent d’alerter, 24 h/24.

**D’autres soutiens :** le Collectif féministe contre le viol (**0800 05 95 95**), les associations d’aide aux victimes et les CIDFF, que tu trouveras via l’annuaire d’arretonslesviolences.gouv.fr.

## Questions fréquentes
**Je n’ai pas dit non, est-ce quand même une violence ?** Oui, si tu n’étais pas consentante. Le consentement ne se déduit pas du silence ou de l’absence de réaction.

**C’était mon ou ma partenaire.** Être en couple ne donne aucun droit sur ton corps. Le 3919 peut t’écouter et t’orienter, sans jugement.

**Je ne suis pas prête à porter plainte.** Tu peux d’abord te faire soigner, en parler, être accompagnée. Un certificat médical établi tôt peut être utile plus tard.

**Un proche m’a confié des violences, comment l’aider ?** L’écouter sans juger, lui dire qu’il ou elle n’est pas responsable, l’informer des numéros. Le 3919 s’adresse aussi à l’entourage.

## Quand demander conseil
En danger immédiat : **17**, **112** ou SMS au **114**. Besoin de soins urgents : **15**. Pour parler : **3919**, gratuit, anonyme, 24 h/24. Si une personne mineure est en danger, appelle le **119**. Si tu as des idées noires ou te sens submergée, le **3114** répond jour et nuit.

${FIN}`,
  }),
  // ------------------------------------------------------------ prévention et autres IST
  a({
    slug: 'preservatifs-gratuits-prevention-ist-moins-26-ans-limites',
    title: 'Préservatifs et prévention des IST : les obtenir gratuitement et connaître leurs limites',
    summary: 'Seuls les préservatifs protègent des IST : comment en obtenir gratuitement en pharmacie avant 26 ans, pourquoi les associer à sa contraception, et ce contre quoi ils protègent moins bien.',
    tags: ['préservatif gratuit', 'préservatif pharmacie', 'moins de 26 ans', 'prévention IST', 'préservatif interne', 'double protection', 'contraception et IST', 'remboursement préservatif'],
    sources: [S.preventionIst, S.depisterGratuitQS, S.vaginitePrevention],
    body_md: `## En bref
- Selon l’Assurance Maladie, **seuls les préservatifs** (externe et interne) protègent des IST : pilule, implant, patch, anneau, DIU et spermicides **ne protègent pas** des infections.
- **Avant 26 ans**, certains préservatifs sont **gratuits en pharmacie, sans ordonnance et sans âge minimum**, sur présentation de ta carte Vitale, d’une attestation de droits ou d’une pièce d’identité.
- **À partir de 26 ans**, certains préservatifs sont remboursés à 60 % sur prescription d’un médecin, d’une sage-femme ou d’un centre de santé sexuelle.
- Le préservatif protège **moins bien** contre les papillomavirus et l’herpès, dont les lésions peuvent se trouver hors de la zone couverte.

## Comprendre
L’Assurance Maladie recommande d’utiliser un préservatif **à chaque rapport et avec chaque partenaire**, tant que tu n’es pas certaine que ton ou ta partenaire n’a pas d’IST. Pour arrêter le préservatif avec un nouveau partenaire régulier, un dépistage des deux est conseillé.

Le préservatif reste précieux même si tu as déjà une contraception : on parle de **double protection** (contraception contre la grossesse, préservatif contre les IST).

**Ses limites :** l’Assurance Maladie précise qu’il ne protège pas totalement contre les HPV, ni pendant une primo-infection ou une poussée d’herpès, car des lésions proches des organes génitaux restent un risque. Dans ces situations, il vaut mieux éviter les rapports, même protégés. Le vaccin HPV et le dépistage complètent alors la prévention.

L’enquête citée par l’Assurance Maladie montre que l’utilisation du préservatif a reculé ces dernières années, y compris lors du premier rapport : en parler reste important.

## Au quotidien
**Obtenir des préservatifs gratuitement (moins de 26 ans) :**
- va en pharmacie avec ta carte Vitale, une attestation de droits ou une pièce d’identité ;
- une boîte est remise par passage ;
- les mineures peuvent justifier de leur âge ou de leur couverture par une **déclaration sur l’honneur** et demander que la délivrance reste **confidentielle** ;
- les centres de santé sexuelle, CeGIDD, Espaces santé jeunes et services de santé universitaires sont aussi des lieux d’information et souvent de distribution.

**Bien choisir (sans marque) :**
- vérifie le **marquage CE** et la **date de péremption** sur l’emballage ;
- en cas d’allergie au latex, il existe des modèles sans latex, dont certains sont pris en charge ;
- utilise un lubrifiant compatible (à base d’eau ou de silicone) : les produits gras fragilisent le latex ;
- si un préservatif ou un spermicide t’irrite, parles-en : l’Assurance Maladie cite ces produits parmi les causes possibles d’irritation.

**Le préservatif interne** se place dans le vagin et peut être posé à l’avance ; c’est une option si tu veux gérer toi-même ta protection.

**Si le préservatif craque ou glisse :** pense à la contraception d’urgence si tu n’as pas d’autre contraception, au dépistage des IST, et, en cas de risque d’exposition au VIH, au traitement d’urgence à débuter au plus vite (urgences ou CeGIDD).

## Questions fréquentes
**Dois-je avoir une ordonnance pour les préservatifs gratuits ?** Non, pas avant 26 ans. À partir de 26 ans, une prescription permet un remboursement partiel de certains modèles.

**Je suis sous pilule, ai-je besoin d’un préservatif ?** Pour te protéger des IST, oui : la pilule ne protège que de la grossesse.

**Peut-on mettre deux préservatifs pour être plus protégés ?** Non : le frottement entre deux préservatifs augmente le risque de rupture. Un seul, bien posé, suffit.

**Où trouver plus d’informations ?** Sida Info Service répond au **0 800 840 800**, de façon anonyme et gratuite.

## Quand demander conseil
Après un rapport sans préservatif ou un accident de préservatif, ne reste pas seule avec ton inquiétude : pharmacie (contraception d’urgence), CeGIDD, médecin ou sage-femme (dépistage). Si tu as des symptômes (pertes inhabituelles, brûlures, lésions), consulte rapidement. Si un rapport t’a été imposé, appelle le **3919** ou, en danger immédiat, le **17** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'gonocoque-blennorragie-chaude-pisse-symptomes-traitement',
    title: 'Gonocoque (blennorragie, « chaude-pisse ») : signes, dépistage et traitement',
    summary: 'Le gonocoque est une IST bactérienne souvent silencieuse chez les femmes : signes possibles, dépistage simple, traitement antibiotique et importance de traiter les partenaires.',
    tags: ['gonocoque', 'gonorrhée', 'blennorragie', 'chaude-pisse', 'IST', 'pertes jaunes', 'brûlures urinaires', 'dépistage', 'antibiotique'],
    sources: [S.gonocoqueQS, S.istAmeli, S.pertesCngof],
    body_md: `## En bref
- Le gonocoque (*Neisseria gonorrhoeae*) est une **bactérie transmise lors des rapports sexuels**, qui peut toucher le sexe, l’anus et la gorge.
- Les signes, quand il y en a, apparaissent **2 à 7 jours** après le rapport : brûlures, écoulement ou pertes jaunes, douleur dans le bas-ventre, parfois fièvre ou mal de gorge.
- Chez les femmes, l’infection est **souvent silencieuse** : selon l’Assurance Maladie, jusqu’à 70 % n’ont pas de symptômes.
- Elle se soigne avec des **antibiotiques**, et **les partenaires doivent être traités en même temps**.

## Comprendre
QuestionSexualité décrit des brûlures et/ou un écoulement jaune au niveau du vagin, de la verge ou de l’anus, de la fièvre, une douleur dans le bas-ventre, et parfois une angine quand la gorge est touchée. Le CNGOF, sur Santé.fr, évoque des pertes jaunâtres ressemblant à du pus, avec des brûlures en urinant, et une possible irritation de la gorge après une fellation.

Le problème, c’est que l’infection passe souvent inaperçue, surtout chez les femmes. Non traitée, elle peut remonter vers l’utérus et les trompes. L’Assurance Maladie cite comme complications des douleurs pelviennes chroniques, une infertilité, une grossesse extra-utérine, des infections d’autres organes (notamment les articulations), et une transmission possible au bébé à l’accouchement. Le gonocoque fragilise aussi les muqueuses et augmente nettement le risque de contamination par le VIH.

Il n’existe **pas de vaccin** contre le gonocoque.

## Au quotidien
**Te faire dépister :**
- par un prélèvement à l’entrée du vagin, indolore, que tu peux souvent réaliser toi-même ; un prélèvement de gorge ou d’anus peut être proposé selon les pratiques ;
- chez ton médecin, ta sage-femme, ton ou ta gynécologue, en centre de santé sexuelle, ou en CeGIDD (anonyme et gratuit) ;
- en laboratoire **sans ordonnance ni rendez-vous** : gratuit avant 26 ans ;
- entre 18 et 25 ans, avec le **kit d’autoprélèvement** chlamydia et gonocoque à commander sur mon-test-ist.ameli.fr.

**Si le test est positif :**
- prends le traitement antibiotique prescrit **jusqu’au bout** ;
- **préviens tes partenaires** récents : ils doivent être dépistés et traités en même temps pour éviter de vous recontaminer ;
- évite les rapports jusqu’à la fin du traitement et l’avis de ton ou ta professionnelle ;
- un dépistage des autres IST (chlamydia, syphilis, VIH, hépatite B) est souvent proposé en même temps, car elles peuvent être associées.

**Prévenir :** le préservatif à chaque rapport, y compris lors des rapports oraux, et un dépistage régulier si tu as plusieurs partenaires.

## Questions fréquentes
**Je n’ai aucun signe, mon partenaire a été diagnostiqué : que faire ?** Fais-toi dépister et traiter même sans symptôme : l’infection est souvent silencieuse chez les femmes.

**Peut-on l’attraper par la bouche ?** Oui, le gonocoque peut toucher la gorge. Le dépistage peut alors inclure un prélèvement de gorge.

**Le traitement protège-t-il pour l’avenir ?** Non. On peut être réinfectée lors d’un nouveau contact, notamment si un partenaire n’a pas été traité.

**Mes pertes sont jaunes, est-ce le gonocoque ?** Pas forcément : d’autres infections donnent des pertes jaunes. Seul un prélèvement permet de le savoir.

## Quand demander conseil
Consulte rapidement en cas de pertes jaunes ou purulentes, de brûlures en urinant, de douleurs dans le bas-ventre ou pendant les rapports, ou si un ou une partenaire t’annonce une IST. Fièvre avec douleurs pelviennes, ou douleur brutale et intense avec retard de règles : appelle le **15** ou le **112**. Une gêne qui dure n’est pas à subir.

${FIN}`,
  }),
  a({
    slug: 'condylomes-verrues-genitales-hpv-traitement-vaccin',
    title: 'Condylomes (verrues génitales) : les reconnaître, les traiter, les prévenir',
    summary: 'Dues à certains papillomavirus, les verrues génitales sont fréquentes et peuvent récidiver : leur aspect, les traitements possibles, la place du préservatif et du vaccin HPV.',
    tags: ['condylomes', 'verrues génitales', 'HPV', 'papillomavirus', 'crête de coq', 'bouton sur la vulve', 'cryothérapie', 'vaccin HPV', 'IST'],
    sources: [S.condylomes, S.istAmeli, S.hpvVIS],
    body_md: `## En bref
- Les condylomes sont des **verrues génitales** dues à certains **papillomavirus humains (HPV)**, transmis lors des rapports, notamment par **contact peau à peau**.
- Ce sont de petites excroissances rosées ou grisâtres, plates ou en relief, parfois **invisibles à l’œil nu**, sur la vulve, l’anus, le périnée, voire dans le vagin ou sur le col.
- Le traitement **détruit les lésions** (froid, laser, électrocoagulation, traitement local) mais **n’élimine pas le virus** : des **récidives** sont possibles.
- Le **vaccin HPV** protège contre les types responsables d’environ 90 % des condylomes, à condition d’être fait avant l’infection.

## Comprendre
Santé.fr explique qu’il existe de nombreux types de HPV : certains provoquent des condylomes, d’autres, plus rares, peuvent entraîner des cancers (notamment du col de l’utérus). Les condylomes eux-mêmes sont le plus souvent bénins, mais l’Assurance Maladie note qu’ils sont souvent **difficiles à éradiquer**.

Ils peuvent apparaître **plusieurs années après la contamination**, ce qui rend souvent impossible de savoir quand et avec qui l’infection a été transmise. Ils peuvent provoquer des démangeaisons ou des saignements pendant les rapports. La contamination peut aussi se faire par les doigts, et une mère porteuse peut transmettre le virus au bébé à l’accouchement.

Selon Santé.fr, le risque est plus élevé quand la vie sexuelle a débuté tôt, en cas de nombreux partenaires ou d’une autre IST.

## Au quotidien
**Si tu remarques une petite excroissance :**
- ne tente pas de la retirer toi-même : un ou une professionnelle doit d’abord confirmer de quoi il s’agit ;
- consulte ton médecin, ta sage-femme, ton ou ta gynécologue ou un ou une dermatologue ; un CeGIDD ou un centre de santé sexuelle peuvent aussi t’orienter.

**Le traitement (Santé.fr) :**
- destruction des lésions visibles par le froid (azote liquide), le laser ou l’électrocoagulation ;
- parfois un traitement local à appliquer, sur prescription ;
- une **surveillance** sur plusieurs semaines ou mois, car de nouvelles lésions peuvent apparaître.

**Pendant cette période :**
- le préservatif est indispensable pour limiter le risque, même s’il ne protège pas totalement, car des lésions peuvent se trouver hors de la zone couverte ;
- informer ton ou ta partenaire lui permet de surveiller sa peau et de consulter si besoin ;
- un dépistage des autres IST peut être proposé.

**Le dépistage du col reste important :** le frottis ou le test HPV à partir de 25 ans permet de repérer les HPV à risque de cancer, qui ne sont pas ceux des condylomes.

## Questions fréquentes
**Les condylomes peuvent-ils donner un cancer ?** Les types de HPV responsables des condylomes sont généralement différents de ceux à haut risque de cancer. Mais on peut être porteuse de plusieurs types : suis ton dépistage du col.

**Mon ou ma partenaire m’a-t-il ou elle « trompée » ?** Pas forcément : les condylomes peuvent apparaître des années après la contamination. Il est souvent impossible de savoir d’où vient l’infection.

**Le vaccin peut-il soigner mes condylomes ?** Non : Santé.fr précise qu’il est inefficace si l’infection est déjà là. D’où l’intérêt de vacciner avant le début de la vie sexuelle, filles et garçons.

**Les condylomes reviennent : est-ce un échec ?** Les récidives sont fréquentes, car le virus reste présent. Retourne consulter à chaque nouvelle lésion ; la surveillance fait partie du traitement.

## Quand demander conseil
Consulte devant toute excroissance, bouton ou lésion sur le sexe ou l’anus, des démangeaisons qui persistent ou des saignements après les rapports. Si tu es enceinte et as des condylomes, parles-en à ta sage-femme ou à ton médecin. Vivre avec une IST peut peser sur le moral et sur le couple : si tu te sens dépassée, le **3114** répond jour et nuit.

${FIN}`,
  }),
  a({
    slug: 'trichomonase-mycoplasme-pertes-mousseuses-ist',
    title: 'Trichomonase et mycoplasmes : ces IST qui donnent des pertes inhabituelles',
    summary: 'Pertes verdâtres et mousseuses, brûlures, démangeaisons : la trichomonase et l’infection à mycoplasme sont des IST fréquentes, à faire diagnostiquer et traiter avec ses partenaires.',
    tags: ['trichomonase', 'trichomonas', 'mycoplasme', 'mycoplasma genitalium', 'pertes vertes', 'pertes mousseuses', 'odeur', 'IST', 'vaginite'],
    sources: [S.trichoQS, S.istAmeli, S.pertesCngof],
    body_md: `## En bref
- La **trichomonase** est due à un parasite, *Trichomonas vaginalis* ; l’infection à **mycoplasme** (*Mycoplasma genitalium*) à une bactérie. Ce sont deux **IST fréquentes**.
- Signes possibles : **pertes inhabituelles** (verdâtres, mousseuses, malodorantes pour la trichomonase), **brûlures**, **démangeaisons**, brûlures en urinant.
- Les signes apparaissent à partir d’**environ une semaine** après la contamination.
- Le diagnostic repose sur un **prélèvement**, et le traitement doit concerner **toi et tes partenaires en même temps**.

## Comprendre
**La trichomonase :** le CNGOF, sur Santé.fr, décrit des pertes verdâtres, mousseuses, avec une odeur particulière. L’Assurance Maladie mentionne des pertes souvent malodorantes, des démangeaisons et des brûlures urinaires chez la femme, alors que chez l’homme elle passe souvent inaperçue, parfois avec des brûlures en urinant. Son traitement repose sur un antiparasitaire prescrit.

**Les mycoplasmes :** chez la femme, l’Assurance Maladie cite des pertes vaginales, une inflammation du col, des saignements après les rapports ou entre les règles, des brûlures urinaires. Le traitement est antibiotique ; la guérison est fréquente mais des récidives sont possibles. Non traitée, l’infection peut se compliquer d’infections génitales hautes, d’infertilité ou de grossesse extra-utérine.

Ces deux infections fragilisent les muqueuses et **augmentent nettement le risque de contamination par le VIH**, selon QuestionSexualité. Il n’existe **pas de vaccin**.

**À ne pas confondre :** des pertes malodorantes peuvent aussi venir d’une vaginose bactérienne (déséquilibre de la flore, qui n’est pas une IST), et des pertes épaisses avec démangeaisons d’une mycose. Seul un prélèvement fait la différence.

## Au quotidien
**Se faire diagnostiquer :**
- un prélèvement local (vaginal, ou premier jet d’urine) suffit ;
- il peut être prescrit par ton médecin, ta sage-femme ou ton ou ta gynécologue, ou fait en centre de santé sexuelle ou en CeGIDD, où il est **anonyme et gratuit** ;
- évite la toilette intime juste avant, pour que les pertes puissent être examinées.

**Pendant le traitement :**
- prends le traitement prescrit en entier (QuestionSexualité indique qu’il peut associer des antibiotiques et un traitement local) ;
- **ton ou tes partenaires doivent être traités en même temps**, même sans symptômes, pour éviter de vous recontaminer ;
- évite les rapports ou utilise un préservatif jusqu’à la guérison ;
- continue une toilette externe douce, sans douche vaginale.

**Prévenir :** le préservatif à chaque rapport, et un dépistage des IST lors d’un changement de partenaire.

## Questions fréquentes
**Mon partenaire n’a aucun symptôme, doit-il quand même être traité ?** Oui. Chez l’homme, la trichomonase est souvent silencieuse ; sans traitement simultané, la réinfection est probable.

**Ces infections sont-elles graves ?** Elles se soignent. Mais non traitées, elles peuvent entraîner des complications et facilitent la transmission du VIH : d’où l’intérêt de consulter vite.

**J’ai des pertes mousseuses, puis-je prendre un traitement contre la mycose ?** Non : un antifongique ne soigne ni la trichomonase ni les mycoplasmes. L’Assurance Maladie déconseille l’automédication en cas de pertes jaunes, vertes ou malodorantes.

**Faut-il refaire un dépistage après ?** Ton ou ta professionnelle te dira si un contrôle est utile, notamment en cas de symptômes persistants ou de récidive.

## Quand demander conseil
Consulte dans les jours qui viennent en cas de pertes vertes, jaunes, mousseuses ou malodorantes, de démangeaisons, de brûlures ou de saignements après les rapports. Consulte dans la journée si tu es enceinte ou peux l’être, ou en cas de douleurs dans le bas-ventre. Fièvre avec douleurs pelviennes : appelle le **15** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'tpe-prep-vih-traitement-urgence-48-heures-prevention',
    title: 'Risque d’exposition au VIH : le traitement d’urgence (TPE) dans les 48 heures, et la PrEP',
    summary: 'Après un rapport non protégé, un préservatif qui craque ou une agression, un traitement d’urgence peut réduire le risque de VIH s’il est débuté vite : où, quand, comment ; et ce qu’est la PrEP.',
    tags: ['TPE', 'traitement post-exposition', 'VIH', 'préservatif craqué', 'rapport à risque', '48 heures', 'PrEP', 'urgences', 'CeGIDD', 'prévention'],
    safety_critical: true,
    sources: [S.tpeQS, S.prepSIS, S.depisterGratuitQS],
    body_md: `## En bref
- Après une exposition possible au VIH (rapport sans préservatif ou préservatif rompu, agression sexuelle…), un **traitement post-exposition (TPE)** peut être proposé.
- Il doit être commencé **le plus tôt possible**, **idéalement dans les 4 heures** et **au plus tard dans les 48 heures**.
- On l’obtient aux **urgences d’un hôpital** (24 h/24) ou dans un **CeGIDD** aux heures d’ouverture. Il est accessible **à toute personne**, y compris **mineure sans autorisation parentale** et **sans couverture sociale**.
- La **PrEP** est une autre stratégie : un traitement préventif pris par des personnes séronégatives exposées au VIH. Elle **ne protège pas des autres IST**.

## Comprendre
**Le TPE** est un traitement antirétroviral pris pendant **30 jours**. QuestionSexualité explique qu’un médecin évalue d’abord le risque et décide si le traitement est nécessaire ou si une surveillance suffit. Il est prescrit pour deux ou trois jours, puis confirmé ou arrêté lors d’un second rendez-vous avec un médecin référent VIH. Plus il est pris tôt, plus il est efficace. QuestionSexualité indique que le traitement est pris en charge à 100 %.

Les situations concernées : un rapport non protégé (absence ou rupture du préservatif, agression sexuelle), un oubli de PrEP suivi d’un rapport à risque, un partage de matériel d’injection, un accident d’exposition au sang.

**La PrEP** (prophylaxie pré-exposition) consiste, selon Sida Info Service, à prendre un traitement en continu ou à la demande pour éviter d’être contaminé. Elle s’adresse aux personnes qui n’ont pas le VIH et qui sont exposées, par exemple en cas de partenaires multiples, et à toute personne qui s’estime exposée et en fait la demande. **Tout médecin** peut la prescrire, en ville, en centre de santé, en CeGIDD ou à l’hôpital. Elle nécessite un suivi et des dépistages réguliers des IST. Sida Info Service rappelle enfin qu’une personne vivant avec le VIH sous traitement efficace, avec une charge virale indétectable, ne transmet pas le virus.

## Au quotidien
**Si tu as pris un risque :**
1. N’attends pas le lendemain si tu peux agir tout de suite : rends-toi aux **urgences** ou dans un **CeGIDD**. Tu peux appeler avant de venir.
2. Si c’est possible, viens avec ton ou ta partenaire : un test rapide des deux peut aider à évaluer le risque.
3. Un dépistage du VIH et d’autres infections (hépatites, syphilis…) te sera proposé.
4. Si le TPE est prescrit, prends-le **régulièrement, à heures fixes**, pendant toute la durée prévue. Des effets comme fatigue, nausées, maux de ventre, diarrhée ou maux de tête sont fréquents : signale-les, le traitement peut être ajusté.

**Pense aussi aux autres risques :** si tu n’as pas d’autre contraception, la **contraception d’urgence** (en pharmacie) est à prendre au plus vite ; un **dépistage des autres IST** est utile, au bon moment.

**Pour la PrEP :** parles-en à ton médecin, à un CeGIDD ou à un centre de santé sexuelle si tu te sens régulièrement exposée.

**Trouver un lieu :** l’annuaire de Sida Info Service recense les urgences et CeGIDD proches ; la ligne **0 800 840 800** est anonyme et gratuite.

## Questions fréquentes
**Il s’est passé plus de 48 heures, que faire ?** Le TPE n’est plus proposé au-delà, mais un dépistage reste essentiel, ainsi qu’un avis en CeGIDD ou chez ton médecin.

**Je suis mineure, puis-je y aller seule ?** Oui, le TPE est accessible aux mineurs sans autorisation parentale.

**La PrEP remplace-t-elle le préservatif ?** Elle protège du VIH, mais seul le préservatif protège aussi des autres IST. Les deux sont complémentaires.

**Après une agression sexuelle ?** Le médecin peut proposer en urgence la contraception d’urgence, le TPE, des traitements contre d’éventuelles infections et établir un certificat. Tu peux aussi appeler le **3919**, gratuit et anonyme.

## Quand demander conseil
Après une exposition au VIH, c’est une **urgence** : urgences de l’hôpital ou CeGIDD, **sans attendre**, et au plus tard dans les 48 heures. En cas de violences, danger immédiat : **17** ou **112** ; besoin de soins urgents : **15**.

${FIN}`,
  }),
];
