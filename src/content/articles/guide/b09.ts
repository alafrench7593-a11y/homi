/**
 * Guide complet — lot 09 (27/10/2026) : exercices et bien-être pendant la grossesse
 * (respiration, dos, posture, étirements, périnée, préparation physique à l'accouchement, sophrologie et relaxation,
 * sommeil et activité, bouger au travail).
 * Articles rédigés avec l'aide d'une IA à partir de pages officielles françaises réellement consultées le 2026-10-27
 * (HAS, Santé.fr / Santé publique France, ministère chargé des Sports, ameli.fr, INRS, Code du travail numérique) : statut « À vérifier ».
 * Les exercices décrits reprennent ceux des sources ; leur adaptation à chaque grossesse relève de la sage-femme ou du médecin.
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27. `published` = date de publication ou de mise à jour affichée par la page.
const S = {
  hasSynthese: { label: 'HAS — Prescription d’activité physique pendant la grossesse et le post-partum (synthèse)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2022-08/synthese_aps_grossesse_post_partum_vf.pdf', consulted_on: C, published: '2022-07-13' },
  hasFiche: { label: 'HAS — Grossesse : l’activité physique pour votre santé (fiche pour les patientes)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2022-11/ap_fiche_grossesse.pdf', consulted_on: C, published: '2022-12' },
  santeIdees: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Idées d’activités et de mouvements à faire pendant la grossesse', url: 'https://www.sante.fr/activite-physique-pendant-la-grossesse', consulted_on: C, published: '2023-05-09' },
  santeAP: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — L’activité physique pendant la grossesse', url: 'https://www.sante.fr/node/1871127', consulted_on: C, published: '2023-04-25' },
  guideSports: { label: 'Ministère chargé des Sports — Guide « Activités physiques et sportives et maternité » (diffusé sur monenfant.fr)', url: 'https://www.monenfant.fr/documents/20143/108676/GUIDE+-+APS+ET+MATERNIT%C3%89+-+vf+-oct+2020.pdf/bc54ed63-2e5a-84eb-4b4c-ef5f37ab6004', consulted_on: C },
  hasPNP: { label: 'HAS — Préparation à la naissance et à la parentalité (recommandations professionnelles)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/preparation_naissance_recos.pdf', consulted_on: C, published: '2005-11' },
  santePNP: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Les séances de préparation à la naissance et à la parentalité', url: 'https://www.sante.fr/les-seances-de-preparation-la-naissance-et-la-parentalite', consulted_on: C, published: '2022-10-21' },
  ameliPNP: { label: 'ameli.fr — Préparation à la naissance et à la parentalité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/preparation-parentalite', consulted_on: C },
  hasAccouchement: { label: 'HAS — Accouchement normal : accompagnement de la physiologie et interventions médicales (fiche de synthèse)', url: 'https://www.has-sante.fr/portail/upload/docs/application/pdf/2018-01/fs_accouchement_v3.pdf', consulted_on: C, published: '2017-12' },
  santeIncontinence: { label: 'Santé.fr — Incontinence urinaire', url: 'https://www.sante.fr/incontinence-urinaire', consulted_on: C, published: '2026-08-13' },
  santeJambes: { label: 'Santé.fr — Jambes lourdes', url: 'https://www.sante.fr/jambes-lourdes', consulted_on: C, published: '2026-08-12' },
  santeInsomnie: { label: 'Santé.fr — Insomnie', url: 'https://www.sante.fr/insomnie', consulted_on: C, published: '2026-08-12' },
  santeStress: { label: 'Santé.fr (Fédération française de cardiologie) — Des conseils simples pour réduire son stress', url: 'https://www.sante.fr/node/1877805', consulted_on: C, published: '2019-10-18' },
  infoGouvSM: { label: 'info.gouv.fr — Prendre soin de sa santé mentale', url: 'https://www.info.gouv.fr/grand-dossier/parlons-sante-mentale/comment-bien-prendre-soin-de-sa-sante-mentale', consulted_on: C, published: '2026-03-17' },
  ameliLombalgie: { label: 'Assurance Maladie — Livret « Je souffre de lombalgie » (2e édition)', url: 'https://cramif.fr/sites/default/files/2017-11/ameli-lombalgie-que-faire_assurance-maladie.pdf', consulted_on: C, published: '2017-10' },
  inrsRepro: { label: 'INRS — Risques pour la reproduction : démarche de prévention', url: 'https://www.inrs.fr/risques/reproduction/demarche-prevention.html', consulted_on: C, published: '2017-08-02' },
  inrsEcran: { label: 'INRS — Travail sur écran : ce qu’il faut retenir', url: 'https://www.inrs.fr/risques/travail-ecran/ce-qu-il-faut-retenir.html', consulted_on: C, published: '2025-06-11' },
  codeTravailAbsences: { label: 'Code du travail numérique (fiche Service-public.fr) — Une salariée a-t-elle droit à des absences liées à sa grossesse ?', url: 'https://code.travail.gouv.fr/fiche-service-public/une-salariee-a-t-elle-droit-a-des-absences-liees-a-sa-grossesse', consulted_on: C, published: '2025-09-05' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis de la sage-femme ou du médecin qui suivent votre grossesse et connaissent votre situation.';

const PREG = { journeys: ['pregnant'] as LibArticle['journeys'], status: 'to_review' as const };

export const GUIDE_B09: LibArticle[] = [
  // ───────────────────────────── Respiration ─────────────────────────────
  {
    ...PREG,
    slug: 'respiration-grossesse-exercices-au-quotidien',
    title: 'Respirer pendant la grossesse : des exercices simples pour le quotidien',
    summary: 'Respiration lente, souffle long à l’expiration, pauses de quelques minutes : des gestes simples pour se poser, accompagner les changements du corps et préparer les séances de préparation à la naissance.',
    category: 'corps-grossesse',
    body_md: `Au fil des mois, beaucoup de futures mères remarquent que leur respiration change : elle semble plus courte, surtout quand le ventre prend de la place. Apprendre à respirer calmement ne demande ni matériel ni tenue de sport, et peut devenir un petit rendez-vous avec vous-même plusieurs fois par jour.

## En bref
- Le travail de la respiration fait partie de la gymnastique douce conseillée pendant la grossesse et des séances de préparation à la naissance.
- Au troisième trimestre, respirer peut devenir plus difficile : certains exercices physiques paraissent alors plus durs.
- Une respiration lente et régulière, avec une expiration un peu plus longue, aide à se détendre.
- À partir du 5e mois, on évite de rester longtemps allongée à plat sur le dos : préférez la position assise ou couchée sur le côté.
- Si vous êtes essoufflée au repos, ou si l'essoufflement ne passe pas en vous reposant, parlez-en sans attendre à un professionnel.

## Comprendre
Pendant la grossesse, le corps s'adapte en permanence. Les repères de Santé publique France signalent qu'au troisième trimestre, la respiration peut devenir plus difficile, ce qui rend certains exercices plus durs. C'est une des raisons pour lesquelles l'intensité de l'activité physique s'ajuste au fil des mois.

La respiration est aussi un outil. Le guide du ministère chargé des Sports sur la maternité décrit la gymnastique douce comme un travail de la respiration, de prise de conscience du bassin et du périnée. Les séances de préparation à la naissance et à la parentalité proposent, elles aussi, des exercices de respiration utiles pendant la grossesse et l'accouchement, ainsi que des exercices de relaxation.

Dans la vie de tous les jours, quelques minutes de respiration lente permettent de faire une pause, de relâcher les épaules et de prendre conscience de son corps.

## Au quotidien
- **Installez-vous confortablement** : assise sur une chaise, dos soutenu, pieds à plat ; ou couchée sur le côté, un coussin entre les genoux. Évitez la position à plat sur le dos prolongée à partir du 5e mois.
- **Posez une main sur le ventre, l'autre sur la poitrine** : inspirez par le nez en laissant le ventre se soulever doucement, puis soufflez lentement par la bouche, comme pour faire vaciller la flamme d'une bougie sans l'éteindre.
- **Allongez l'expiration** : sans forcer, laissez le souffle sortir un peu plus longtemps qu'il n'est entré. Quelques cycles suffisent pour commencer.
- **Relâchez les zones tendues** à chaque expiration : mâchoire, épaules, mains.
- **Fixez-vous des repères** : avant de vous lever le matin, après le déjeuner, au coucher. Trois à cinq minutes à chaque fois.
- **Pendant l'effort, soufflez** : lors d'un exercice de renforcement ou d'une montée d'escalier, expirez au moment où vous forcez, sans bloquer votre souffle.
- **Arrêtez si la tête tourne** : respirez normalement et reprenez plus tard, plus doucement.

## Questions fréquentes
**Je me sens vite essoufflée en fin de grossesse : dois-je arrêter de bouger ?**
Pas forcément. Les repères conseillent une activité d'intensité modérée, c'est-à-dire qui permet de tenir une conversation. Ralentissez si vous ne pouvez plus parler. En revanche, un essoufflement excessif qui ne cède pas au repos est un signe pour arrêter et consulter.

**Existe-t-il une « bonne » technique de respiration ?**
Il n'existe pas une méthode unique. Les séances de préparation à la naissance vous apprendront des exercices adaptés à la grossesse et à l'accouchement ; la sage-femme peut vous aider à trouver ce qui vous convient.

**Puis-je faire ces exercices allongée sur le dos ?**
En début de grossesse, oui. À partir du 5e mois, il est conseillé d'éviter de rester longtemps à plat sur le dos : préférez la position assise ou couchée sur le côté.

**La respiration peut-elle m'aider à dormir ?**
Un moment calme avant le coucher aide beaucoup de personnes à s'endormir. Quelques minutes de respiration lente peuvent trouver leur place dans ce rituel ; les séances de préparation proposent aussi des exercices de relaxation.

## Quand demander conseil
Parlez-en à la sage-femme ou au médecin si vous êtes essoufflée au moindre effort ou au repos, si vous avez des palpitations, des vertiges ou des malaises. Une douleur ou une pression dans la poitrine, une gêne respiratoire brutale ou un essoufflement important sont des urgences : appelez le 15 ou le 112. Si l'anxiété vous submerge ou si vous avez des idées noires, vous pouvez appeler le 3114, joignable à toute heure.

${END}`,
    tags: ['respiration', 'souffle', 'essoufflement', 'détente', 'exercices', 'grossesse', 'relaxation'],
    sources: [S.santeAP, S.guideSports, S.santePNP],
  },
  {
    ...PREG,
    slug: 'respiration-travail-accouchement-se-preparer',
    title: 'La respiration pour le travail et l’accouchement : comment s’y préparer',
    summary: 'Les séances de préparation à la naissance apprennent des exercices de respiration et de relaxation pour accompagner les contractions ; le jour J, vous pousserez de la façon qui vous semble la plus efficace, guidée par l’équipe.',
    category: 'accouchement',
    min_week: 20,
    body_md: `« Comment vais-je respirer pendant les contractions ? » La question revient souvent en fin de grossesse. La respiration ne supprime pas la douleur, mais elle peut aider à traverser chaque contraction, à se relâcher entre deux, et à se sentir actrice de ce moment.

## En bref
- Les séances de préparation à la naissance et à la parentalité comprennent des exercices de respiration et de relaxation utiles pendant le travail.
- La HAS cite la relaxation et la respiration parmi les techniques corporelles pour faciliter le travail.
- Pendant le travail, l'équipe accompagne les moyens de soulagement non médicamenteux que vous choisissez (bain, relaxation, massages, hypnose…).
- Au moment de pousser, il n'y a pas de technique imposée : la femme pousse de la manière qui lui semble la plus efficace.
- S'entraîner régulièrement pendant la grossesse rend ces gestes plus familiers le jour J.

## Comprendre
Dans ses recommandations sur la préparation à la naissance, la HAS décrit les objectifs des techniques corporelles : mieux connaître son corps, s'adapter aux changements de la grossesse, apprendre la relaxation et la respiration pour faciliter le travail, et découvrir des positions pour le travail et la naissance. Plusieurs approches existent (préparation dite psychoprophylactique, sophrologie, préparation aquatique, haptonomie, yoga…) ; la HAS précise qu'aucune n'a été formellement évaluée, ce qui laisse la place à vos préférences.

Pour l'accouchement lui-même, les recommandations de la HAS sur l'accouchement normal insistent sur un soutien continu, individuel et personnalisé. L'équipe accompagne la femme dans le choix des moyens non médicamenteux qu'elle souhaite : immersion dans l'eau, relaxation, acupuncture, hypnose ou massages, selon ce que propose la maternité.

Pour la poussée, la HAS recommande de ne pas commencer à pousser dès la dilatation complète, mais de laisser le bébé descendre, puis de pousser de la façon qui semble la plus efficace à la femme. Autrement dit, il n'y a pas une respiration « obligatoire » : la sage-femme vous guidera au moment venu.

## Au quotidien
- **Inscrivez-vous aux séances de préparation** : sept séances sont prises en charge par l'Assurance Maladie lorsqu'elles sont assurées par une sage-femme ou un médecin. Elles ont souvent lieu à partir du 7e mois.
- **Entraînez-vous un peu chaque jour** : quelques minutes de respiration lente, assise ou couchée sur le côté, avec une expiration longue et relâchée.
- **Associez souffle et relâchement** : à chaque expiration, détendez les épaules, la mâchoire, les mains.
- **Imaginez une vague** : certaines femmes se représentent la contraction comme une vague qui monte puis redescend, et accompagnent la montée et la descente par le souffle.
- **Impliquez votre partenaire** : il ou elle peut respirer avec vous, vous rappeler de relâcher les épaules, vous masser le dos.
- **Parlez de vos souhaits** : bain, ballon, déambulation, massages… notez-les et parlez-en à la maternité pour savoir ce qui est possible.

## Questions fréquentes
**Si je n'ai pas fait de préparation, saurai-je respirer ?**
Oui, l'équipe est là pour vous accompagner pas à pas. La préparation aide à se sentir plus à l'aise, mais il n'est jamais trop tard : même quelques exercices appris en fin de grossesse peuvent servir.

**Faut-il bloquer sa respiration pour pousser ?**
Les recommandations n'imposent pas de technique : vous poussez comme cela vous semble le plus efficace, au moment indiqué par l'équipe. La sage-femme peut vous proposer différentes façons de faire.

**La respiration remplace-t-elle la péridurale ?**
Ce sont deux choses différentes. La respiration et la relaxation peuvent aider à vivre les contractions, avec ou sans péridurale. Le choix de l'analgésie se discute avec l'équipe, et vous pouvez changer d'avis pendant le travail.

**Mon partenaire peut-il apprendre ces exercices ?**
Oui. Certaines séances de préparation sont ouvertes au second parent, notamment pour expliquer le déroulement de l'accouchement et la façon d'aider.

## Quand demander conseil
Contactez la maternité ou appelez le 15 en cas de pertes de liquide, de saignements, de contractions régulières et douloureuses avant le terme, de diminution des mouvements du bébé, de maux de tête intenses ou de troubles de la vue. Si l'approche de l'accouchement vous angoisse beaucoup, parlez-en lors de l'entretien prénatal précoce ou à votre sage-femme ; en cas de détresse, le 3114 répond à toute heure.

${END}`,
    tags: ['respiration', 'contractions', 'accouchement', 'travail', 'poussée', 'préparation à la naissance', 'douleur'],
    sources: [S.hasPNP, S.hasAccouchement, S.santePNP],
  },
  {
    ...PREG,
    slug: 'souffler-a-l-effort-eviter-apnee-grossesse',
    title: 'Souffler à l’effort, ne pas bloquer sa respiration : la règle d’or des exercices enceinte',
    summary: 'Pendant la grossesse, les recommandations demandent d’éviter les exercices où l’on bloque sa respiration : on expire pendant l’effort, on garde une intensité qui permet de parler.',
    category: 'sport',
    body_md: `Soulever une charge en retenant son souffle, tenir une position de gainage en apnée : ces réflexes sont fréquents. Pendant la grossesse, les recommandations demandent de les éviter. La règle à retenir est simple : on souffle à l'effort.

## En bref
- La HAS conseille d'éviter les exercices avec blocage respiratoire (manœuvre de Valsalva) ou contractions prolongées sans respirer.
- « On souffle à l'effort » : expirez au moment où vous poussez, tirez ou soulevez.
- L'intensité recommandée est modérée : vous devez pouvoir tenir une conversation.
- Les sports qui demandent de bloquer sa respiration sollicitent fortement le périnée.
- La plongée sous-marine est interdite pendant toute la grossesse.

## Comprendre
Bloquer sa respiration pendant un effort augmente la pression dans le ventre. La synthèse de la HAS sur l'activité physique pendant la grossesse recommande donc d'éviter les exercices comportant une manœuvre de Valsalva (on inspire, on ferme la gorge et on pousse) et les contractions musculaires prolongées en apnée.

Cette pression se transmet aussi vers le bas, sur le périnée. La page de Santé.fr sur l'incontinence urinaire conseille d'ailleurs d'éviter les sports qui sollicitent fortement le périnée, notamment ceux qui impliquent de bloquer sa respiration.

Les pages de Santé publique France sur les exercices pendant la grossesse le rappellent : il faut respirer pendant les exercices, ne pas retenir sa respiration, et souffler à l'effort. Le guide du ministère chargé des Sports reprend la même consigne. Enfin, l'intensité modérée se vérifie facilement : si vous ne pouvez plus parler en bougeant, l'effort est trop intense.

## Au quotidien
- **Repérez la phase d'effort** : dans un exercice, c'est le moment où vous montez, poussez ou soulevez. Expirez à ce moment-là, inspirez dans la phase de retour.
- **Comptez à voix haute** pendant un maintien : impossible de compter en apnée !
- **Gainage : préférez des versions douces** proposées par les sources (dos plaqué contre un mur en soufflant, par exemple) aux positions tenues longtemps.
- **Portez autrement** : pour soulever un sac de courses ou un enfant, pliez les genoux, gardez la charge près du corps et soufflez en vous relevant. Au travail, le port de charges est à éviter.
- **Vérifiez l'intensité** avec le test de la parole.
- **Écoutez votre périnée** : une sensation de pesanteur ou des fuites pendant un exercice sont un signal pour l'adapter et en parler à la sage-femme.

## Questions fréquentes
**Je fais de la musculation : dois-je arrêter ?**
Le renforcement musculaire d'intensité modérée est recommandé pendant la grossesse. Il s'agit d'adapter : charges plus légères, respiration continue, pas d'apnée, pas de position prolongée sur le dos à partir du 2e trimestre. Parlez-en avec le professionnel qui vous suit et, si possible, un encadrant formé.

**Et pour aller à la selle ?**
Poussez sans forcer longtemps en apnée, en soufflant doucement. Une alimentation riche en fibres et une bonne hydratation aident à limiter la constipation ; parlez-en si elle persiste.

**Le chant ou les instruments à vent posent-ils problème ?**
Les sources consultées ne traitent pas ce point. Si vous pratiquez de façon intensive, évoquez-le avec votre sage-femme.

**Pourquoi la plongée est-elle interdite ?**
Le guide du ministère chargé des Sports indique que la plongée sous-marine est interdite quelle que soit la période de la grossesse.

## Quand demander conseil
Arrêtez l'exercice et consultez si vous ressentez un essoufflement qui ne passe pas au repos, des vertiges ou un malaise, des maux de tête, une faiblesse musculaire qui vous déséquilibre, une douleur ou un gonflement du mollet, des contractions régulières et douloureuses, un saignement ou une perte de liquide. Une douleur ou une pression dans la poitrine est une urgence : appelez le 15 ou le 112.

${END}`,
    tags: ['respiration', 'apnée', 'Valsalva', 'musculation', 'renforcement', 'périnée', 'souffler'],
    sources: [S.hasSynthese, S.santeIdees, S.santeIncontinence],
  },
  // ───────────────────────────── Dos et posture ─────────────────────────────
  {
    ...PREG,
    slug: 'mal-de-dos-grossesse-bouger-pour-soulager',
    title: 'Mal de dos pendant la grossesse : comprendre et bouger pour soulager',
    summary: 'Le mal de dos est fréquent pendant la grossesse ; l’activité physique régulière, adaptée, contribue à diminuer les douleurs lombaires et pelviennes, alors que l’immobilité peut les entretenir.',
    category: 'corps-grossesse',
    body_md: `Bas du dos qui tire en fin de journée, raideur au réveil, gêne en restant debout : le mal de dos accompagne beaucoup de grossesses. Bonne nouvelle, les recommandations montrent que bouger fait partie des solutions.

## En bref
- Selon la HAS, l'activité physique pendant la grossesse diminue les douleurs lombaires et pelviennes (sans forcément les prévenir).
- Le renforcement musculaire modéré aide à garder une bonne posture et à prévenir les douleurs lombaires.
- La natation reste possible en cas de douleurs du dos et soulage grâce à la portance de l'eau.
- Le repos complet et la sédentarité peuvent entretenir le mal de dos : mieux vaut rester actif, en adaptant.
- Les séances de préparation à la naissance enseignent des gestes et postures pour limiter les maux de dos.

## Comprendre
Pendant la grossesse, le ventre s'arrondit, le centre de gravité se déplace et le corps se cambre souvent davantage. La prise de poids joue aussi : Santé publique France rappelle que l'activité physique limite le risque de prise de poids excessive, donc le risque de mal de dos.

La synthèse de la HAS sur l'activité physique pendant la grossesse indique que celle-ci diminue les douleurs lombaires et pelviennes. Le renforcement musculaire d'intensité modérée a, entre autres objectifs, de favoriser une bonne posture et de prévenir les douleurs lombaires. Pour les femmes qui ont des douleurs du dos, la natation reste possible ; le guide du ministère chargé des Sports souligne que ce sport « porté », sans chocs, soulage les douleurs lombaires.

Plus largement, l'Assurance Maladie rappelle à propos de la lombalgie que le repos et la sédentarité peuvent entretenir la douleur : il est conseillé de garder ses activités autant que possible, en les adaptant, et d'augmenter progressivement une activité supportable.

## Au quotidien
- **Bougez un peu chaque jour** : marche, natation, gymnastique douce. Visez progressivement 30 minutes par jour d'activité modérée si votre grossesse le permet.
- **Ne restez pas figée** : levez-vous et marchez un peu au moins toutes les deux heures, ou bougez au moins une minute par heure quand vous êtes assise.
- **Faites des exercices doux pour le dos** : dos contre un mur en soufflant, position à quatre pattes en arrondissant puis relâchant doucement le dos (sans creuser excessivement), étirement des genoux vers la poitrine en début de grossesse.
- **Soignez vos gestes** : pliez les genoux pour ramasser un objet, gardez les charges près du corps, évitez de porter lourd.
- **Choisissez un siège qui soutient** : un appui au creux des reins aide en position assise prolongée.
- **Essayez la piscine** : nager ou marcher dans l'eau, à rythme régulier, en évitant les heures d'affluence.
- **Pensez à la chaleur** : elle fait partie des moyens cités pour soulager le mal de dos ; une douche chaude sur le bas du dos peut détendre. Évitez en revanche les environnements chauds et humides pendant l'effort.

## Questions fréquentes
**Faut-il porter une ceinture de grossesse ?**
Les sources consultées n'en parlent pas. Si vous l'envisagez, demandez conseil à la sage-femme, au médecin ou au kinésithérapeute qui pourra vérifier si elle est adaptée à votre situation.

**Est-ce que je peux prendre un antidouleur ?**
Pendant la grossesse, aucun médicament ne doit être pris sans l'avis d'un médecin, d'une sage-femme ou d'un pharmacien, y compris ceux vendus sans ordonnance.

**La douleur est du côté de la fesse et descend dans la jambe : est-ce le dos ?**
Une douleur qui descend dans la jambe mérite d'être décrite au professionnel qui vous suit, pour qu'il en recherche l'origine et vous propose une prise en charge adaptée.

**Un kinésithérapeute peut-il m'aider ?**
Oui, sur prescription, un kinésithérapeute peut proposer des exercices et des techniques adaptées à la grossesse. Parlez-en à votre médecin ou sage-femme.

## Quand demander conseil
Consultez si la douleur est intense, vous réveille la nuit, s'accompagne de fièvre, de brûlures en urinant, d'engourdissements, de faiblesse dans une jambe ou de troubles pour uriner. En fin de grossesse, une douleur dans le bas du dos qui revient à intervalles réguliers peut correspondre à des contractions : contactez la maternité, surtout avant 37 semaines. En cas de saignements, de perte de liquide ou de douleur brutale et intense, appelez le 15 ou le 112.

${END}`,
    tags: ['mal de dos', 'lombalgie', 'lombaires', 'bassin', 'douleur', 'natation', 'posture'],
    sources: [S.hasSynthese, S.guideSports, S.ameliLombalgie],
  },
  {
    ...PREG,
    slug: 'exercices-dos-grossesse-programme-simple',
    title: 'Exercices pour le dos pendant la grossesse : un petit programme à faire chez soi',
    summary: 'Dos plaqué contre un mur, équilibre à quatre pattes, étirements doux : des exercices tirés du guide du ministère chargé des Sports, à adapter avec la sage-femme.',
    category: 'sport',
    body_md: `Quelques minutes d'exercices réguliers peuvent aider à garder un dos plus confortable. Les mouvements ci-dessous sont repris du guide du ministère chargé des Sports sur la pratique sportive pendant la maternité, relayé par Santé publique France. Ils se font sans matériel, ou avec une simple bouteille d'eau.

## En bref
- Le renforcement musculaire modéré favorise une bonne posture et aide à prévenir les douleurs lombaires.
- Rythme indicatif : 1 à 2 fois par semaine selon Santé publique France, environ 3 fois selon le guide des Sports, qui conseille de ne pas enchaîner deux jours consécutifs.
- On souffle à l'effort et on ne bloque jamais sa respiration.
- À partir du 5e mois, on évite les positions prolongées à plat sur le dos.
- Chaque exercice s'arrête en cas de douleur, de vertige ou de contraction.

## Comprendre
La HAS recommande d'associer, pendant la grossesse, des activités d'endurance, du renforcement musculaire d'intensité modérée et des assouplissements. Le renforcement vise notamment une bonne posture et la prévention des douleurs lombaires. Le guide des Sports propose des exercices simples, décrits ci-dessous.

Ces exercices s'adressent aux grossesses sans contre-indication. La sage-femme ou le médecin peuvent vous dire s'ils conviennent à votre situation et comment les adapter.

## Au quotidien
Avant de commencer, échauffez-vous quelques minutes en marchant sur place et en faisant des cercles d'épaules. Buvez de l'eau.

- **Le dos au mur** : debout, dos contre un mur, genoux légèrement fléchis. En soufflant, plaquez le bas du dos contre le mur en contractant le bas du ventre. Tenez environ 20 secondes en continuant à respirer, relâchez. Le guide propose 10 répétitions ; commencez par moins si besoin.
- **L'équilibre à quatre pattes** : à genoux, mains au sol sous les épaules. Décollez un bras et la jambe opposée, sans creuser le dos. Tenez quelques secondes ou faites de petits battements, puis changez de côté.
- **Le pont assis** : assise au sol, appui sur les mains et les pieds, décollez les fesses en vous grandissant. Tenez environ 10 secondes, redescendez lentement. Le guide propose 10 répétitions.
- **Les épaules** : assise, dos droit, une petite bouteille d'eau dans chaque main. Montez les mains vers les épaules en gardant les coudes bas, puis redescendez en freinant. Séries de 10.
- **L'étirement du dos** (en début de grossesse) : allongée, ramenez les genoux vers la poitrine en les écartant, respirez calmement, puis reposez les pieds en contrôlant la descente. Plus tard dans la grossesse, demandez à la sage-femme une variante sans rester à plat sur le dos.
- **Pour finir** : quelques minutes de respiration lente, assise ou couchée sur le côté.

## Questions fréquentes
**Combien de fois par semaine ?**
Santé publique France évoque des exercices de renforcement 1 à 2 fois par semaine ; le guide des Sports en propose environ 3 fois par semaine, sans deux jours consécutifs. Commencez doucement et augmentez selon vos sensations.

**Je ressens une gêne au niveau du pubis pendant un exercice : que faire ?**
Arrêtez l'exercice qui déclenche la douleur et parlez-en à la sage-femme ou au médecin, qui pourra vous proposer des mouvements adaptés.

**Puis-je faire ces exercices jusqu'à l'accouchement ?**
Beaucoup peuvent être poursuivis en les adaptant, mais les positions évoluent avec le ventre. En fin de grossesse, privilégiez la marche, la gymnastique douce et les activités dans l'eau, comme le suggère le guide des Sports.

**Est-ce utile si j'ai déjà mal ?**
L'activité physique diminue les douleurs lombaires et pelviennes selon la HAS. Si la douleur augmente pendant ou après un exercice, arrêtez-le et demandez conseil.

## Quand demander conseil
Arrêtez et consultez en cas d'essoufflement qui ne cède pas au repos, de vertiges, de maux de tête, de faiblesse musculaire, de douleur ou gonflement d'un mollet, de contractions régulières et douloureuses, de saignement ou de perte de liquide. Une douleur dans la poitrine impose d'appeler le 15 ou le 112.

${END}`,
    tags: ['exercices dos', 'renforcement', 'gainage doux', 'mal de dos', 'à la maison', 'gymnastique douce'],
    sources: [S.santeIdees, S.guideSports, S.hasSynthese],
  },
  {
    ...PREG,
    slug: 'posture-grossesse-debout-assise',
    title: 'Posture pendant la grossesse : se tenir debout et assise quand le ventre s’arrondit',
    summary: 'Changer souvent de position, éviter la station debout immobile et les longues périodes assises, soutenir le bas du dos : des repères simples pour ménager son corps.',
    category: 'corps-grossesse',
    body_md: `Le ventre qui s'arrondit modifie l'équilibre du corps. Sans y penser, on se cambre davantage, on se tient sur une hanche, on reste longtemps dans la même position. Quelques ajustements simples aident à soulager le dos et les jambes.

## En bref
- La HAS conseille d'éviter la station debout immobile prolongée pendant la grossesse.
- Rester assise longtemps n'est pas idéal non plus : levez-vous et bougez au moins une minute par heure, ou marchez un peu toutes les deux heures.
- L'équilibre change au fil de la grossesse : soyez attentive aux risques de chute.
- Les séances de préparation à la naissance apprennent des gestes et postures pour limiter les petits maux, comme le mal de dos.
- Une vidéo de l'Assurance Maladie présente les bonnes positions debout, assise et couchée.

## Comprendre
Les recommandations de la HAS sur l'activité physique pendant la grossesse demandent de limiter le temps passé assis, de rompre les longues périodes assises en se levant et en bougeant au moins une minute par heure, et d'éviter de rester debout immobile longtemps. Rester debout sans bouger gêne aussi le retour veineux, ce qui favorise la sensation de jambes lourdes.

L'Assurance Maladie met à disposition une vidéo sur les postures pendant la grossesse (debout, assise, couchée), pour limiter les problèmes de digestion, de dos et de retour veineux. Les séances de préparation à la naissance comprennent aussi des conseils de gestes et postures.

L'équilibre se modifie au fil des mois : la HAS invite à en tenir compte et à éviter les activités qui exposent à des chutes.

## Au quotidien
**Debout**
- Répartissez le poids sur les deux pieds, genoux légèrement déverrouillés.
- Grandissez-vous comme si un fil vous tirait vers le haut par le sommet de la tête, épaules relâchées.
- Si vous devez rester debout, bougez : transférez le poids d'un pied sur l'autre, marchez quelques pas, posez un pied sur une petite marche.
- Portez des chaussures stables et confortables.

**Assise**
- Asseyez-vous au fond du siège, un appui (coussin ou serviette roulée) au creux des reins.
- Pieds à plat, éventuellement sur un petit repose-pieds.
- Évitez de croiser les jambes longtemps.
- Levez-vous régulièrement : une alarme sur le téléphone peut aider.

**Pour se relever**
- Avancez-vous au bord du siège, pieds écartés, et poussez sur les jambes en soufflant, en vous aidant des mains.

**Au repos**
- À partir du 5e mois, évitez de rester allongée à plat sur le dos : préférez le côté, avec un coussin entre les genoux.
- Surélevez les jambes au repos si elles sont lourdes.

## Questions fréquentes
**Le ballon de gymnastique est-il une bonne chaise ?**
Le guide du ministère chargé des Sports propose des exercices assis sur un ballon. Pour l'utiliser, choisissez un ballon adapté à votre taille, posez-le sur un sol non glissant et restez près d'un appui : l'équilibre change pendant la grossesse. Il ne soutient pas le dos : alternez avec une vraie chaise.

**Les talons hauts sont-ils déconseillés ?**
Les sources consultées n'en parlent pas directement, mais elles invitent à limiter les risques de chute. Des chaussures stables aident à garder l'équilibre.

**Rester debout au travail, est-ce un problème ?**
L'INRS recommande d'éviter pour les femmes enceintes le travail debout à piétiner et de leur permettre de s'asseoir, par exemple quelques minutes toutes les heures. Parlez-en au médecin du travail.

**Comment éviter de trop me cambrer ?**
L'exercice du dos plaqué contre un mur, en contractant le bas du ventre et en soufflant, aide à prendre conscience de la position du bassin.

## Quand demander conseil
Parlez-en à la sage-femme ou au médecin si la douleur de dos ou de bassin vous gêne pour marcher, dormir ou travailler. Consultez sans attendre en cas de gonflement brutal, douloureux ou d'un seul côté d'une jambe, de vertiges, de malaise ou de chute sur le ventre. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    tags: ['posture', 'debout', 'assise', 'dos', 'cambrure', 'équilibre', 'jambes lourdes'],
    sources: [S.hasSynthese, S.ameliPNP, S.inrsRepro],
  },
  {
    ...PREG,
    slug: 'gestes-quotidien-dos-grossesse-porter-se-lever',
    title: 'Porter, se pencher, sortir du lit : les gestes du quotidien qui ménagent le dos enceinte',
    summary: 'Plier les genoux, garder la charge près du corps, souffler en se relevant, sortir du lit en passant par le côté : des gestes simples pour protéger le dos pendant la grossesse.',
    category: 'corps-grossesse',
    body_md: `Ramasser un jouet, porter les courses, sortir de la voiture, se lever du lit : ces gestes répétés des dizaines de fois par jour pèsent sur le dos. Pendant la grossesse, quelques réflexes aident à les rendre plus confortables.

## En bref
- Pour porter, pliez les genoux et gardez la charge près du corps.
- Soufflez pendant l'effort, sans bloquer votre respiration.
- Au travail, le port de charges est à éviter pendant la grossesse.
- Pour sortir du lit, passez par le côté plutôt que de vous relever d'un coup sur le dos.
- La HAS recommande d'apprendre des postures protectrices pendant la grossesse et après la naissance.

## Comprendre
Dans ses recommandations sur la préparation à la naissance, la HAS mentionne l'intérêt des postures protectrices pendant la grossesse et après la naissance, par exemple pour soulever et porter le bébé ou ramasser des jouets. Ces gestes s'apprennent pendant les séances de préparation.

Le livret de l'Assurance Maladie sur la lombalgie donne des repères valables pour tous : plier les genoux et garder le poids près du corps pour porter une charge, se lever et s'étirer régulièrement, régler son siège avec un appui au creux des reins.

Pendant la grossesse s'ajoutent deux points. D'une part, il est conseillé de ne pas bloquer sa respiration pendant l'effort. D'autre part, l'INRS recommande d'éviter le port de charges pour les femmes enceintes au travail ; le médecin du travail peut proposer une dispense de port de charges.

## Au quotidien
- **Ramasser un objet** : approchez-vous, écartez les pieds, pliez les genoux en gardant le dos droit, ou posez un genou au sol. Soufflez en vous relevant.
- **Porter les courses** : faites plusieurs petits trajets, répartissez le poids dans les deux mains, ou utilisez un chariot. Demandez de l'aide pour les packs d'eau.
- **Porter un aîné** : privilégiez les câlins assis ; s'il faut le porter, pliez les genoux, gardez-le contre vous et soufflez. Invitez-le à monter seul sur vos genoux ou sur une marche.
- **Sortir du lit** : tournez-vous sur le côté, laissez glisser les jambes hors du lit, et poussez sur vos bras pour vous asseoir. Restez un instant assise avant de vous lever.
- **Sortir de la voiture** : pivotez d'abord les deux jambes vers l'extérieur, puis levez-vous en poussant sur les jambes.
- **Ménage et jardin** : ces activités comptent comme de l'activité physique. Alternez les tâches, évitez de rester longtemps penchée, et portez des gants pour jardiner.
- **Mettre ses chaussures** : asseyez-vous, ramenez le pied vers vous plutôt que de vous pencher debout.

## Questions fréquentes
**Jusqu'à quel poids puis-je porter ?**
Les sources consultées ne donnent pas de poids limite pour la vie quotidienne. Au travail, l'INRS conseille d'éviter le port de charges. Pour votre situation, demandez conseil à la sage-femme ou au médecin.

**Je ressens une douleur aiguë en me retournant dans le lit : que faire ?**
Bougez lentement, en roulant le bassin et les épaules en même temps, genoux pliés. Si la douleur est intense ou persistante, parlez-en à la sage-femme ou au médecin.

**Est-ce que je peux continuer à porter mon aîné en écharpe ?**
Les sources consultées ne traitent pas ce point. Parlez-en avec votre sage-femme, qui tiendra compte du terme, de votre dos et du poids de l'enfant.

**Après la naissance, ces gestes restent-ils utiles ?**
Oui : la HAS les cite pour porter le bébé, le coucher, ramasser les jouets. Ils seront utiles pendant des années !

## Quand demander conseil
Consultez si une douleur apparaît brutalement après un effort et ne cède pas, si elle s'accompagne d'engourdissement ou de faiblesse d'une jambe, de fièvre ou de troubles urinaires. Après une chute sur le ventre, contactez la maternité. En cas de saignement, de perte de liquide ou de contractions douloureuses, appelez le 15 ou le 112.

${END}`,
    tags: ['porter', 'gestes', 'dos', 'se lever', 'courses', 'aîné', 'port de charges'],
    sources: [S.hasPNP, S.ameliLombalgie, S.inrsRepro],
  },
  {
    ...PREG,
    slug: 'etirements-doux-grossesse',
    title: 'Étirements doux pendant la grossesse : lesquels et comment',
    summary: 'Dos, bras, épaules, cuisses : la plupart des étirements classiques restent possibles pendant la grossesse, en douceur, en respirant et sans rester longtemps à plat sur le dos après le 5e mois.',
    category: 'sport',
    body_md: `S'étirer fait du bien : on relâche les tensions, on respire, on prend conscience de son corps. Pendant la grossesse, les étirements font partie des activités recommandées, à condition de rester dans la douceur.

## En bref
- La HAS recommande d'associer endurance, renforcement et assouplissements pendant la grossesse.
- La plupart des étirements classiques restent possibles (dos, cuisses, épaules, pectoraux, abdominaux).
- Chaque séance peut se terminer par 10 à 15 minutes de retour au calme avec des étirements doux.
- On étire sans à-coups, en respirant, sans chercher à aller loin.
- À partir du 5e mois, on évite de rester à plat sur le dos : on adapte les positions.

## Comprendre
La synthèse de la HAS sur l'activité physique pendant la grossesse recommande de combiner trois types d'activités : endurance, renforcement musculaire et assouplissement. Elle conseille un échauffement de 10 à 15 minutes et une récupération de même durée avec des étirements doux.

Le guide du ministère chargé des Sports et Santé publique France indiquent que la plupart des étirements classiques peuvent être pratiqués. Ils rappellent deux consignes : respirer pendant l'étirement et éviter la position complètement allongée sur le dos à partir du 5e mois.

Les sources invitent à rester à l'écoute de son corps : l'étirement doit rester agréable, sans douleur ni à-coups.

## Au quotidien
Voici des étirements proposés par Santé publique France, à faire lentement, 30 secondes environ chacun, en respirant calmement.

- **Bras et épaules** : debout, mains jointes, tendez les bras vers le haut en respirant profondément, sans creuser le bas du dos.
- **Avant de la cuisse** : debout, une main en appui sur un dossier de chaise, pliez une jambe pour rapprocher le talon des fesses, tenez puis changez de jambe.
- **Dos** (en début de grossesse) : allongée, ramenez les genoux vers la poitrine en les écartant pour laisser de la place au ventre, respirez, puis reposez les pieds en contrôlant. Plus tard, faites-le assise ou demandez une variante à la sage-femme.
- **Côtés du buste** : assise, une main sur la chaise, tendez l'autre bras au-dessus de la tête et inclinez-vous légèrement sur le côté en expirant.
- **Nuque** : assise, inclinez doucement la tête vers une épaule, puis vers l'autre.
- **Mollets** : debout face au mur, mains en appui, reculez une jambe tendue, talon au sol, puis changez.

Quelques idées pour en faire une habitude : un étirement en sortant de la douche, deux pendant la pause du travail, une petite série avant le coucher.

## Questions fréquentes
**Les postures de yoga sont-elles des étirements adaptés ?**
Le yoga prénatal fait partie des activités encadrées conseillées pendant la grossesse : un enseignant formé peut corriger les postures et proposer des variantes adaptées à chaque trimestre.

**J'ai mal au pubis ou à l'aine en écartant les jambes : est-ce grave ?**
Arrêtez l'étirement qui provoque la douleur et parlez-en à la sage-femme ou au médecin, qui pourra en rechercher la cause et vous proposer des mouvements adaptés.

**Combien de temps tenir chaque étirement ?**
Santé publique France propose environ 30 secondes, en respirant profondément. Sans douleur et sans à-coups.

**Puis-je m'étirer si j'ai des crampes la nuit ?**
Un étirement doux du mollet peut soulager une crampe. Si les crampes sont fréquentes ou s'accompagnent d'un gonflement, parlez-en au professionnel qui vous suit.

## Quand demander conseil
Consultez si un étirement provoque une douleur vive, si une douleur du bassin vous gêne pour marcher, ou en cas de mollet douloureux, chaud ou gonflé, surtout d'un seul côté. En cas de saignement, de perte de liquide, de contractions régulières et douloureuses ou de douleur dans la poitrine, appelez le 15 ou le 112.

${END}`,
    tags: ['étirements', 'souplesse', 'assouplissement', 'dos', 'épaules', 'crampes', 'détente'],
    sources: [S.santeIdees, S.hasSynthese, S.guideSports],
  },
  // ───────────────────────────── Périnée ─────────────────────────────
  {
    ...PREG,
    slug: 'perinee-pendant-la-grossesse-comprendre',
    title: 'Le périnée pendant la grossesse : à quoi il sert et pourquoi s’en occuper',
    summary: 'Le périnée soutient la vessie, l’utérus et le rectum ; pendant la grossesse, il est sollicité, et son renforcement est recommandé pour améliorer le contrôle de la vessie et limiter les fuites urinaires.',
    category: 'corps-grossesse',
    body_md: `On en entend surtout parler après l'accouchement, avec la rééducation. Pourtant, le périnée mérite de l'attention dès la grossesse. Comprendre son rôle aide à mieux le ressentir, à le muscler et à le protéger au quotidien.

## En bref
- Le périnée (ou plancher pelvien) est un ensemble de muscles qui ferme le bas du bassin et soutient la vessie, l'utérus et le rectum.
- Pendant la grossesse, il porte un poids croissant et subit l'effet des changements du corps.
- La HAS indique que le renforcement du plancher pelvien améliore le contrôle de la vessie et aide à prévenir l'incontinence urinaire.
- L'activité physique pendant la grossesse diminue le risque d'incontinence urinaire pendant la grossesse et après la naissance.
- La sage-femme ou le professionnel qui suit la grossesse peut vous montrer comment travailler votre périnée.

## Comprendre
Le périnée est un « hamac » de muscles et de tissus tendu entre le pubis, à l'avant, et le coccyx, à l'arrière. Il entoure l'urètre, le vagin et l'anus. Il participe à la continence (retenir l'urine, les gaz et les selles), au soutien des organes du bassin et à la sexualité.

Pendant la grossesse, le poids du bébé, de l'utérus et du liquide amniotique augmente, et la pression sur le plancher pelvien aussi. L'accouchement par voie basse l'étire fortement. Santé.fr rappelle que les accouchements répétés favorisent l'incontinence d'effort, et qu'une rééducation du périnée est prescrite après l'accouchement pour la prévenir.

Pendant la grossesse, la HAS et le guide du ministère chargé des Sports recommandent un entraînement du plancher pelvien en complément de l'activité physique. La HAS précise que ce renforcement vise à améliorer le contrôle de la vessie et à prévenir l'incontinence urinaire. Les séances de préparation à la naissance comprennent d'ailleurs un travail du bassin et du périnée.

## Au quotidien
- **Apprenez à le sentir** : imaginez que vous retenez un gaz ou que vous serrez doucement le vagin vers l'intérieur et vers le haut. Les fesses, les cuisses et le ventre restent détendus.
- **Ne faites pas le « stop pipi » aux toilettes** de façon répétée : la consigne d'arrêter le jet sert à repérer le muscle, pas à s'entraîner pendant la miction. Demandez conseil à la sage-femme.
- **Respirez** : le périnée se travaille en respirant librement, jamais en bloquant le souffle.
- **Évitez les poussées inutiles** : aux toilettes, ne forcez pas longtemps ; soufflez doucement.
- **Protégez-le pendant l'effort** : les sports qui sollicitent fortement le périnée, notamment ceux où l'on bloque sa respiration, sont à éviter ; la HAS déconseille aussi les activités avec impacts ou sauts pendant la grossesse.
- **Contractez avant l'effort** : avant d'éternuer, de tousser ou de soulever quelque chose, serrez légèrement le périnée.
- **Demandez une évaluation** : si vous avez du mal à le sentir, la sage-femme peut vous guider lors d'une consultation ou d'une séance de préparation.

## Questions fréquentes
**Muscler son périnée pendant la grossesse rend-il l'accouchement plus difficile ?**
Les recommandations consultées encouragent au contraire son entraînement pendant la grossesse. La préparation à la naissance associe d'ailleurs travail du périnée, respiration et relaxation : il s'agit d'apprendre à le contracter, mais aussi à le relâcher.

**Faut-il faire de la rééducation pendant la grossesse ?**
On parle plutôt d'entraînement ou de prise de conscience pendant la grossesse. La rééducation proprement dite a lieu après l'accouchement, après évaluation, avec une sage-femme ou un kinésithérapeute.

**Mon périnée sera-t-il « abîmé » après l'accouchement ?**
Chaque accouchement est différent. Un suivi est prévu après la naissance : la consultation postnatale permet de faire le point et de prescrire une rééducation si besoin.

**Peut-on parler de sexualité et de périnée avec la sage-femme ?**
Oui, ce sont des sujets de santé à part entière. N'hésitez pas à poser vos questions.

## Quand demander conseil
Parlez-en à la sage-femme ou au médecin en cas de fuites urinaires, de sensation de pesanteur dans le vagin, de douleurs pendant les rapports, de brûlures en urinant ou de besoin d'uriner très fréquent et douloureux. Une perte de liquide clair et continue peut correspondre à une fissure de la poche des eaux : contactez la maternité. En cas de saignement ou de douleur intense, appelez le 15 ou le 112.

${END}`,
    tags: ['périnée', 'plancher pelvien', 'incontinence', 'fuites urinaires', 'vessie', 'Kegel'],
    sources: [S.hasSynthese, S.santeIncontinence, S.guideSports],
  },
  {
    ...PREG,
    slug: 'exercices-perinee-grossesse-contracter-relacher',
    title: 'Exercices du périnée pendant la grossesse : contracter, relâcher, progresser',
    summary: 'Contracter quelques secondes, relâcher, répéter, imaginer un ascenseur qui monte : des exercices simples proposés par Santé publique France, à faire en respirant, plusieurs fois par jour.',
    category: 'sport',
    body_md: `Les exercices du périnée ont un avantage : ils se font partout, assise au bureau, dans les transports ou devant une série, sans que personne ne le remarque. Voici comment les pratiquer pendant la grossesse.

## En bref
- Santé publique France propose : assise, contracter le périnée 10 secondes, relâcher 5 secondes, répéter 10 fois, plusieurs fois par jour.
- Une variante consiste à imaginer un ascenseur qui monte et descend étage par étage.
- La phase de relâchement compte autant que la contraction.
- On respire librement pendant tout l'exercice.
- La sage-femme peut vérifier que vous contractez les bons muscles.

## Comprendre
Le renforcement du plancher pelvien est recommandé pendant la grossesse : la HAS indique qu'il améliore le contrôle de la vessie et aide à prévenir l'incontinence urinaire. Le guide du ministère chargé des Sports précise que la sage-femme ou le professionnel qui suit la grossesse indique comment le réaliser.

Santé.fr, dans sa page sur l'incontinence urinaire, décrit un exercice de base : contracter fortement les muscles du périnée comme pour arrêter brusquement d'uriner, tenir 2 à 3 secondes, puis relâcher, en séries réparties dans la journée. Pratiqués régulièrement, ces exercices semblent prévenir l'incontinence d'effort.

La difficulté la plus fréquente est de contracter d'autres muscles à la place du périnée : fesses, cuisses ou abdominaux, ou de bloquer la respiration. D'où l'intérêt d'apprendre avec un professionnel.

## Au quotidien
**Trouver le bon muscle**
- Asseyez-vous, dos droit, pieds à plat. Imaginez que vous retenez un gaz et une envie d'uriner en même temps, en serrant vers l'intérieur et vers le haut.
- Vérifiez que fesses, cuisses et ventre restent détendus, et que vous respirez.

**L'exercice de base**
- Contractez le périnée pendant 10 secondes (ou moins au début), en continuant à respirer.
- Relâchez complètement pendant 5 secondes : sentez le périnée redescendre.
- Répétez 10 fois. Faites cette série plusieurs fois dans la journée.

**L'ascenseur**
- Contractez très légèrement : c'est le 1er étage.
- Serrez un peu plus à chaque « étage », jusqu'au 5e, sans retenir votre souffle.
- Redescendez étage par étage, jusqu'au relâchement complet.

**Les contractions rapides**
- Contractez fort une à deux secondes, relâchez, plusieurs fois de suite : utile avant d'éternuer ou de tousser.

**Idées pour ne pas oublier**
- Associez les exercices à un moment fixe : feu rouge, pause café, publicités, brossage des dents.

## Questions fréquentes
**Je ne sens rien quand je contracte : est-ce que je m'y prends mal ?**
C'est une difficulté fréquente au début. Essayez dans une autre position (couchée sur le côté, à quatre pattes) et demandez à la sage-femme de vous guider ; elle peut vérifier la contraction lors d'un examen.

**Puis-je faire ces exercices jusqu'à l'accouchement ?**
Les sources consultées recommandent l'entraînement du plancher pelvien pendant la grossesse, sans limite de terme. En fin de grossesse, insistez aussi sur la détente et le relâchement, qui seront utiles le jour J.

**Les boules de geisha ou appareils sont-ils utiles ?**
Les sources consultées n'en parlent pas pour la grossesse. N'utilisez pas d'appareil sans l'avis de la sage-femme ou du médecin.

**Est-ce que ces exercices remplacent la rééducation après la naissance ?**
Non. Après l'accouchement, la consultation postnatale permet d'évaluer le périnée et une rééducation est prescrite, réalisée par une sage-femme ou un kinésithérapeute.

## Quand demander conseil
Parlez-en si vous ressentez une douleur pendant les exercices, si les fuites urinaires apparaissent ou augmentent, ou en cas de sensation de pesanteur. Consultez rapidement en cas de brûlures en urinant, de fièvre ou de douleurs dans le bas du ventre. Une perte de liquide, un saignement ou des contractions régulières et douloureuses avant le terme justifient de contacter la maternité ou d'appeler le 15.

${END}`,
    tags: ['exercices périnée', 'Kegel', 'ascenseur', 'plancher pelvien', 'incontinence', 'contraction'],
    sources: [S.santeIdees, S.santeIncontinence, S.hasSynthese],
  },
  {
    ...PREG,
    slug: 'fuites-urinaires-grossesse-que-faire',
    title: 'Fuites urinaires pendant la grossesse : comprendre et agir',
    summary: 'Une fuite en toussant, en riant ou en courant peut survenir pendant la grossesse ; exercices du périnée, activité adaptée et quelques habitudes aident, et il est utile d’en parler à la sage-femme.',
    category: 'corps-grossesse',
    body_md: `Quelques gouttes en éternuant, en riant ou en courant : beaucoup de femmes enceintes n'osent pas en parler. Ces fuites ont une explication, et des solutions existent. En parler à la sage-femme est une démarche utile, sans gêne à avoir.

## En bref
- Les fuites à l'effort (toux, rire, éternuement, saut) sont liées à une pression qui dépasse la capacité du périnée à retenir l'urine.
- Le renforcement du plancher pelvien améliore le contrôle de la vessie et aide à prévenir l'incontinence urinaire, selon la HAS.
- L'activité physique pendant la grossesse diminue le risque d'incontinence urinaire pendant la grossesse et après la naissance.
- Limiter les boissons irritantes pour la vessie et éviter de trop boire le soir peuvent aider.
- Une perte de liquide continue peut être autre chose qu'une fuite urinaire : en cas de doute, consultez.

## Comprendre
Pendant la grossesse, l'utérus appuie sur la vessie et le périnée supporte un poids croissant. Lors d'un effort brusque, la pression dans le ventre augmente d'un coup : si le périnée ne se contracte pas assez vite ou assez fort, quelques gouttes peuvent s'échapper. On parle d'incontinence d'effort.

La synthèse de la HAS indique que l'activité physique pendant la grossesse diminue le risque d'incontinence urinaire pendant la grossesse et en post-partum, et que le renforcement du plancher pelvien vise à améliorer le contrôle de la vessie. La page Santé.fr sur l'incontinence urinaire précise que des exercices du périnée pratiqués régulièrement semblent prévenir l'incontinence d'effort.

Santé.fr donne aussi des conseils de prévention : limiter l'alcool (à exclure pendant la grossesse), le thé, le café et les colas, éviter de trop boire le soir en privilégiant l'hydratation le matin et l'après-midi, et éviter les sports qui sollicitent fortement le périnée, notamment ceux qui impliquent de bloquer sa respiration.

## Au quotidien
- **Faites vos exercices de périnée** chaque jour : contractions tenues puis relâchées, et contractions rapides.
- **Contractez avant l'effort** : serrez le périnée juste avant de tousser, d'éternuer, de rire ou de soulever un objet.
- **Buvez bien, mais au bon moment** : l'hydratation reste essentielle pendant la grossesse. Répartissez l'eau dans la journée et buvez un peu moins juste avant le coucher.
- **Limitez thé, café et sodas** : ils peuvent irriter la vessie, et la caféine est à modérer pendant la grossesse.
- **Adaptez vos activités** : préférez la marche, la natation ou la gymnastique douce aux activités avec sauts et impacts, déconseillées pendant la grossesse.
- **Prenez le temps aux toilettes** : videz votre vessie sans pousser ni vous presser.
- **Protégez-vous si besoin** avec une protection adaptée, changée régulièrement.

## Questions fréquentes
**Comment savoir si c'est de l'urine ou du liquide amniotique ?**
Une fuite urinaire survient en général à l'effort et s'arrête. Un écoulement de liquide clair, continu ou qui revient sans effort peut correspondre à une fissure de la poche des eaux : contactez la maternité sans attendre pour vérifier.

**Les fuites vont-elles disparaître après la naissance ?**
Cela dépend de chaque femme. Une rééducation du périnée est prescrite après l'accouchement pour prévenir l'incontinence ; parlez de vos fuites lors de la consultation postnatale.

**Dois-je boire moins pour éviter les fuites ?**
Non, l'hydratation reste importante pendant la grossesse. Il s'agit plutôt de mieux répartir les boissons et de limiter celles qui irritent la vessie.

**J'ai des brûlures en urinant en plus des fuites : est-ce lié ?**
Des brûlures, des envies très fréquentes et douloureuses ou des urines troubles peuvent évoquer une infection urinaire, qui doit être traitée pendant la grossesse : consultez rapidement.

## Quand demander conseil
Parlez de toute fuite urinaire à la sage-femme ou au médecin. Consultez rapidement en cas de brûlures urinaires, de fièvre, de douleurs dans le dos ou le bas du ventre, ou d'urines avec du sang. Contactez la maternité en cas de perte de liquide continue, de saignements ou de contractions régulières. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    tags: ['fuites urinaires', 'incontinence', 'périnée', 'vessie', 'toux', 'éternuement', 'perte de liquide'],
    sources: [S.santeIncontinence, S.hasSynthese],
  },
  // ───────────────────────────── Renforcement et préparation physique ─────────────────────────────
  {
    ...PREG,
    slug: 'renforcement-musculaire-doux-grossesse',
    title: 'Renforcement musculaire en douceur pendant la grossesse',
    summary: 'Un renforcement d’intensité modérée, sollicitant les grands groupes musculaires, aide la posture, le dos, le retour veineux et la préparation à l’accouchement ; on évite l’apnée, la position sur le dos prolongée et les charges lourdes.',
    category: 'sport',
    body_md: `Muscler son corps pendant la grossesse, ce n'est pas chercher la performance : c'est l'aider à porter le bébé, à garder une bonne posture et à se préparer à l'accouchement puis aux premiers mois avec un nourrisson.

## En bref
- La HAS recommande un renforcement musculaire d'intensité modérée, sollicitant les principaux groupes musculaires.
- Objectifs cités : bonne posture, prévention des douleurs lombaires, renforcement du plancher pelvien, préparation à l'accouchement, meilleur retour veineux.
- Rythme indicatif : 1 à 2 fois par semaine selon Santé publique France, environ 3 fois selon le guide des Sports, sans deux jours consécutifs.
- On souffle à l'effort, on évite le blocage respiratoire et, à partir de 24 semaines d'aménorrhée, la position couchée sur le dos.
- On privilégie les positions debout, assise ou couchée sur le côté.

## Comprendre
La synthèse de la HAS sur l'activité physique pendant la grossesse détaille les objectifs du renforcement musculaire : maintenir une bonne posture, prévenir les douleurs lombaires et le diastasis des grands droits (écartement des muscles abdominaux), renforcer le plancher pelvien et le contrôle de la vessie, préparer l'accouchement, supporter la prise de poids et améliorer le retour veineux.

Elle précise les précautions : éviter les exercices avec blocage respiratoire, éviter la position couchée sur le dos à partir de 24 semaines d'aménorrhée en privilégiant la position sur le côté ou debout, tenir compte de la baisse possible de l'équilibre.

Le guide du ministère chargé des Sports propose de faire du renforcement environ 3 fois par semaine, sans deux jours consécutifs, en complément des activités d'endurance quotidiennes. Santé publique France évoque 1 à 2 séances par semaine, en plus de 30 minutes d'activité modérée par jour. L'essentiel est la régularité, à un niveau adapté.

## Au quotidien
Une séance type, de 20 à 30 minutes, peut ressembler à ceci :
- **Échauffement** (5 à 10 minutes) : marche sur place, cercles d'épaules et de bras, transfert du poids d'un pied sur l'autre.
- **Jambes** : position accroupie pieds écartés et tournés vers l'extérieur, dos le plus droit possible, descente lente, en vous tenant à un appui si besoin ; le guide des Sports la propose en répétitions.
- **Bras et poitrine** : assise, pressez un ballon entre vos mains au niveau de la poitrine en soufflant, tenez une vingtaine de secondes, relâchez.
- **Épaules** : petites bouteilles d'eau dans les mains, montez les mains aux épaules en gardant les coudes bas, redescendez en freinant.
- **Dos et fessiers** : à quatre pattes, décollez un bras et la jambe opposée sans creuser le dos.
- **Abdominaux profonds** : dos contre un mur, plaquez le bas du dos en contractant le bas du ventre et en soufflant.
- **Périnée** : quelques séries de contractions et relâchements.
- **Retour au calme** : étirements doux et respiration lente.

Adaptez le nombre de répétitions à vos sensations : vous devez pouvoir parler, sans douleur.

## Questions fréquentes
**Puis-je faire des abdominaux classiques (crunchs) ?**
Les sources consultées recommandent d'éviter la position sur le dos à partir de 24 semaines et le blocage respiratoire. Elles proposent plutôt des exercices doux comme le dos plaqué au mur. Demandez à la sage-femme ou à un encadrant formé ce qui convient à votre situation.

**Je m'entraînais en salle avant la grossesse : que changer ?**
Le renforcement reste recommandé, avec une intensité modérée et sans recherche de performance. Réduisez les charges, gardez une respiration continue et évitez les exercices sur le dos à partir du 2e trimestre. Parlez de votre pratique avec le professionnel qui vous suit.

**Qu'est-ce que le diastasis ?**
C'est l'écartement des muscles grands droits de l'abdomen. La HAS cite sa prévention parmi les objectifs du renforcement pendant la grossesse. Si vous avez des questions à ce sujet, parlez-en à la sage-femme, pendant la grossesse comme lors de la consultation postnatale.

**Faut-il un matériel particulier ?**
Non : une chaise, un mur, un tapis, des bouteilles d'eau et éventuellement un ballon suffisent.

## Quand demander conseil
Arrêtez et consultez si vous ressentez un essoufflement qui ne passe pas au repos, des vertiges, des maux de tête, une faiblesse musculaire qui vous déséquilibre, une douleur ou un gonflement du mollet, des contractions régulières et douloureuses, un saignement ou une perte de liquide. Une douleur ou une pression dans la poitrine est une urgence : appelez le 15 ou le 112.

${END}`,
    tags: ['renforcement musculaire', 'musculation', 'abdominaux', 'diastasis', 'squat', 'séance', 'exercices'],
    sources: [S.hasSynthese, S.guideSports, S.santeIdees],
  },
  {
    ...PREG,
    slug: 'preparation-physique-accouchement-troisieme-trimestre',
    title: 'Se préparer physiquement à l’accouchement au troisième trimestre',
    summary: 'Marche, gymnastique douce, activités dans l’eau, travail du bassin, du périnée et de la respiration : en fin de grossesse, l’activité continue en douceur et s’associe aux séances de préparation à la naissance.',
    category: 'accouchement',
    min_week: 24,
    body_md: `En fin de grossesse, le ventre est lourd, le souffle plus court, et la question de l'accouchement occupe les pensées. Continuer à bouger, à son rythme, fait partie de la préparation. Voici comment s'y prendre au troisième trimestre.

## En bref
- Au 8e mois, le guide du ministère chargé des Sports conseille de privilégier la marche, la gymnastique douce, la natation et les activités dans l'eau.
- L'activité physique pendant la grossesse peut diminuer la durée du travail et le recours à la césarienne, selon la HAS.
- La respiration, le travail du bassin et du périnée, la relaxation et les positions pour l'accouchement s'apprennent pendant les séances de préparation.
- L'intensité s'adapte : au troisième trimestre, certains exercices deviennent plus durs.
- On évite la position allongée sur le dos, les sauts, les chutes et la chaleur.

## Comprendre
La synthèse de la HAS indique que l'activité physique pendant la grossesse pourrait diminuer la durée du travail et le recours à la césarienne. Le guide du ministère chargé des Sports cite aussi une expulsion légèrement plus courte et moins d'extractions instrumentales. Le renforcement musculaire a, parmi ses objectifs, la préparation à l'accouchement.

Au troisième trimestre, Santé publique France rappelle que la respiration peut devenir plus difficile. Le guide des Sports conseille alors, au 8e mois, la marche, la gymnastique douce et les activités aquatiques. La HAS recommande d'éviter la position couchée sur le dos à partir de 24 semaines, les activités avec sauts ou risque de chute, et les environnements chauds.

Les séances de préparation à la naissance, souvent à partir du 7e mois, complètent cette activité : la HAS cite parmi leurs objectifs l'apprentissage de la respiration, de la relaxation, du travail du bassin et du périnée, et des positions pour le travail et la naissance.

## Au quotidien
- **Marchez chaque jour** : c'est l'activité accessible jusqu'à l'accouchement. Fractionnez si besoin (2 fois 15 minutes, 3 fois 10 minutes).
- **Mobilisez votre bassin** : assise sur un ballon ou sur une chaise, faites de petits mouvements d'avant en arrière et des cercles, en respirant.
- **Essayez la position accroupie soutenue** : pieds écartés, dos droit, en vous tenant à un appui, descendez lentement puis remontez en soufflant.
- **Allez dans l'eau** : nager ou marcher dans l'eau soulage le dos et active le retour veineux.
- **Entraînez la respiration et la détente** : quelques minutes par jour, en associant expiration longue et relâchement des épaules et du périnée.
- **Travaillez votre périnée**, en insistant sur le relâchement autant que sur la contraction.
- **Reposez-vous aussi** : alternez activité et repos, couchée sur le côté.

## Questions fréquentes
**Faut-il marcher beaucoup pour « faire venir » le bébé ?**
Les sources consultées ne présentent pas la marche comme un moyen de déclencher l'accouchement. Elles la recommandent pour ses bienfaits sur la santé et le bien-être, à un rythme confortable.

**Je suis très fatiguée en fin de grossesse : dois-je quand même bouger ?**
Adaptez : quelques minutes de marche ou d'étirements doux comptent. Écoutez votre fatigue et parlez-en à la sage-femme si elle est intense, car une fatigue importante fait partie des signaux à signaler.

**Peut-on encore faire du yoga ou du pilates au 9e mois ?**
Ces activités peuvent être poursuivies sous forme adaptée, idéalement en cours prénatal encadré, sauf avis contraire du professionnel qui vous suit.

**Et si mon médecin m'a demandé de me reposer ?**
Suivez ses consignes. En cas de contre-indication, l'activité physique est limitée ou adaptée ; les activités de la vie quotidienne restent souvent possibles, mais demandez-lui ce qui est permis.

## Quand demander conseil
Contactez la maternité ou appelez le 15 en cas de contractions régulières et douloureuses avant 37 semaines, de perte de liquide, de saignement, de diminution des mouvements du bébé, de maux de tête intenses, de troubles de la vue ou de gonflement brutal du visage et des mains. Arrêtez toute activité en cas de vertiges, de douleur dans la poitrine ou d'essoufflement qui ne cède pas au repos.

${END}`,
    tags: ['préparation à l\'accouchement', 'troisième trimestre', '9e mois', 'bassin', 'marche', 'fin de grossesse'],
    sources: [S.guideSports, S.hasSynthese, S.hasPNP],
  },
  {
    ...PREG,
    slug: 'bouger-changer-de-position-pendant-le-travail',
    title: 'Bouger et changer de position pendant le travail : ce que disent les recommandations',
    summary: 'Les recommandations de la HAS demandent que les femmes puissent changer régulièrement de position pendant le travail, et que le monitoring permette mobilité et confort ; s’y préparer pendant la grossesse aide le jour J.',
    category: 'accouchement',
    min_week: 24,
    body_md: `Marcher, se pencher en avant, se balancer, s'installer à quatre pattes ou sur le côté : pendant le travail, bouger peut aider à se sentir mieux. Les recommandations françaises encouragent cette liberté de mouvement, en tenant compte de la sécurité et de l'organisation de la maternité.

## En bref
- La HAS demande que les équipes permettent aux femmes de changer régulièrement de position pendant le travail, pour leur confort.
- Le monitoring doit permettre la mobilité et le confort.
- Sous péridurale, la mobilisation ou la déambulation restent possibles si la maternité a un protocole adapté.
- Aucune position n'est imposée : il s'agit de trouver ce qui vous soulage.
- Les positions pour le travail et la naissance font partie des apprentissages de la préparation à la naissance.

## Comprendre
Dans ses recommandations sur l'accouchement normal, la HAS indique que les équipes doivent disposer des moyens humains et matériels pour que les femmes changent régulièrement de position, afin d'améliorer leur confort et de prévenir les complications liées à une posture prolongée. La surveillance du rythme cardiaque du bébé doit, elle aussi, permettre la mobilité.

Sous analgésie péridurale, la HAS indique que la femme peut se mobiliser ou déambuler, à condition qu'un protocole formalisé existe dans la maternité. Chaque établissement a donc ses propres possibilités.

La HAS recommande aussi un soutien continu, individuel et personnalisé, et d'accompagner les moyens de soulagement non médicamenteux choisis par la femme (immersion, relaxation, massages…). Le projet de naissance permet d'exprimer ses préférences, dans le respect de la sécurité et des protocoles. Les recommandations sur la préparation à la naissance citent, parmi les objectifs des techniques corporelles, l'apprentissage des positions pour le travail et la naissance.

## Au quotidien
Pendant la grossesse, vous pouvez déjà vous familiariser avec quelques positions, en douceur et en respirant :
- **Debout penchée en avant**, les mains sur une table ou sur les épaules de votre partenaire, en balançant doucement le bassin.
- **Assise sur un ballon**, en faisant des cercles avec le bassin.
- **À quatre pattes** ou à genoux, le buste appuyé sur un ballon ou des coussins, en relâchant le dos.
- **Couchée sur le côté**, un coussin entre les genoux.
- **Assise à califourchon** sur une chaise, les bras sur le dossier.

Quelques conseils pour préparer le jour J :
- **Renseignez-vous auprès de la maternité** : ballons, baignoire, monitoring sans fil, possibilités de déambulation, sous péridurale ou non.
- **Notez vos souhaits** dans un projet de naissance et parlez-en avec l'équipe.
- **Impliquez votre partenaire** : il ou elle peut vous soutenir dans les positions, masser le bas du dos, vous rappeler de respirer.

## Questions fréquentes
**Pourrai-je bouger si j'ai une péridurale ?**
Cela dépend de la maternité et de votre situation. La HAS indique que c'est possible si l'établissement a un protocole formalisé. Posez la question lors de la visite ou de la consultation d'anesthésie.

**Y a-t-il une position meilleure que les autres pour accoucher ?**
Les recommandations consultées n'imposent pas de position. La sage-femme vous aidera à trouver celle qui vous convient, selon le déroulement du travail.

**Puis-je boire pendant le travail ?**
La HAS indique que les liquides clairs (eau, thé sans lait, café noir, jus sans pulpe…) sont autorisés pour les femmes à faible risque d'anesthésie générale. Les aliments solides ne le sont pas pendant la phase active. L'équipe vous dira ce qui s'applique à vous.

**Et si je ne veux pas bouger ?**
C'est votre choix. L'objectif est votre confort : certaines femmes préfèrent rester calmes, sur le côté par exemple.

## Quand demander conseil
Contactez la maternité si vous pensez être en travail, et sans attendre en cas de perte de liquide, de saignement, de diminution des mouvements du bébé, de fièvre ou de douleur intense et continue. Avant 37 semaines, des contractions régulières justifient d'appeler. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    tags: ['positions accouchement', 'travail', 'mobilité', 'péridurale', 'ballon', 'projet de naissance', 'déambulation'],
    sources: [S.hasAccouchement, S.hasPNP],
  },
  {
    ...PREG,
    slug: 'debuter-activite-physique-enceinte-peu-sportive',
    title: 'Vous n’étiez pas sportive avant la grossesse : comment commencer en douceur',
    summary: 'Commencer par 15 minutes au moins 3 jours par semaine, puis augmenter progressivement vers 30 minutes par jour : la grossesse peut être le moment de prendre de nouvelles habitudes, avec l’accord du professionnel.',
    category: 'sport',
    body_md: `Vous n'aviez pas d'activité physique régulière avant d'être enceinte ? Rien ne vous empêche de commencer maintenant. La grossesse est même souvent un bon moment pour adopter des habitudes qui feront du bien à toute la famille.

## En bref
- Si vous étiez peu active, Santé publique France conseille de commencer par 15 minutes, au moins 3 jours par semaine, puis d'augmenter progressivement.
- L'objectif, en l'absence de contre-indication, est d'arriver à au moins 30 minutes par jour d'activité modérée.
- Une activité physique n'est pas forcément un sport : marche, ménage, jardinage, jeux avec un enfant comptent.
- Activités suggérées pour débuter : marche, natation, étirements, gymnastique douce, yoga prénatal, pilates.
- L'intensité est modérée : vous pouvez parler pendant l'effort.

## Comprendre
Les recommandations s'adressent à toutes les femmes enceintes sans contre-indication médicale, qu'elles aient été sportives ou non. La HAS rappelle que l'activité physique n'augmente pas le risque de naissance prématurée, de fausse couche ou de complications de l'accouchement, et qu'elle est bénéfique pour la santé physique et mentale de la mère et pour l'enfant.

Pour les femmes peu actives, Santé publique France propose de commencer par 15 minutes au moins 3 jours par semaine, puis d'augmenter progressivement jusqu'à 30 minutes par jour. Le guide du ministère chargé des Sports conseille de partir de la marche déjà pratiquée au quotidien et d'allonger la durée de quelques minutes chaque jour. Il cite comme activités adaptées la natation, la marche nordique, les activités à faible impact, les étirements, le yoga prénatal, le pilates et la gymnastique douce.

Votre sage-femme ou votre médecin peut vous dire si une activité est adaptée à votre situation. La HAS précise qu'un avis médical peut être utile selon le type ou l'intensité d'activité envisagée.

## Au quotidien
- **Partez de ce que vous faites déjà** : descendez un arrêt de bus plus tôt, prenez les escaliers à votre rythme, allez à pied chercher le pain.
- **Fractionnez** : 3 fois 10 minutes comptent autant qu'une demi-heure d'un coup.
- **Augmentez petit à petit** : quelques minutes de plus chaque semaine.
- **Choisissez ce qui vous plaît** et ce qui est facile d'accès près de chez vous : c'est le meilleur moyen de tenir.
- **Essayez un cours prénatal** : natation, aquagym, yoga ou pilates pour femmes enceintes. L'encadrant peut corriger les postures.
- **Équipez-vous simplement** : de bonnes chaussures, des vêtements confortables, une bouteille d'eau.
- **Bougez à deux** : une marche avec votre partenaire ou une amie est aussi un moment pour parler.
- **Notez vos progrès** dans un carnet ou une application.

## Questions fréquentes
**Est-il trop tard pour commencer au 2e ou au 3e trimestre ?**
Non. Il s'agit d'adapter l'activité au terme : en fin de grossesse, le guide des Sports conseille la marche, la gymnastique douce et les activités dans l'eau.

**Je suis très fatiguée au premier trimestre : comment faire ?**
Le guide des Sports suggère, en cas de nausées ou de baisse d'envie au premier trimestre, de marcher au quotidien en attendant de pouvoir faire plus.

**La course à pied est-elle adaptée pour débuter ?**
Les sources la réservent en priorité aux femmes qui la pratiquaient déjà avant la grossesse. Pour débuter, la marche rapide est une bonne alternative.

**Faut-il un certificat médical ?**
Pour une inscription en club ou en cours, renseignez-vous sur les conditions demandées. Dans tous les cas, parlez de votre projet d'activité avec la sage-femme ou le médecin.

## Quand demander conseil
Demandez conseil avant de commencer si vous avez une maladie chronique, une complication de grossesse, une grossesse multiple ou des antécédents d'accouchement prématuré. Arrêtez et consultez en cas d'essoufflement au repos, de vertiges, de contractions douloureuses, de saignement, de perte de liquide ou de mollet douloureux. Une douleur dans la poitrine impose d'appeler le 15 ou le 112.

${END}`,
    tags: ['débuter', 'sédentaire', 'reprendre le sport', 'marche', 'activité modérée', 'motivation'],
    sources: [S.santeAP, S.guideSports, S.hasFiche],
  },
  // ───────────────────────────── Bien-être, sophrologie, préparation ─────────────────────────────
  {
    ...PREG,
    slug: 'sophrologie-pendant-la-grossesse',
    title: 'La sophrologie pendant la grossesse : de quoi s’agit-il ?',
    summary: 'Exercices rythmés par la respiration et détente du corps : la sophrologie fait partie des approches proposées en préparation à la naissance ; elle s’apprend avec un professionnel et ne remplace pas le suivi médical.',
    category: 'sante-mentale',
    body_md: `La sophrologie est souvent citée parmi les préparations à la naissance. Que recouvre-t-elle, comment la pratiquer et qu'en attendre ? Voici des repères pour vous faire une idée et choisir en connaissance de cause.

## En bref
- La sophrologie associe des exercices rythmés par la respiration, pour mieux ressentir son corps et vivre le moment présent.
- La HAS la cite parmi les techniques corporelles de la préparation à la naissance, en précisant qu'aucune de ces techniques n'a été formellement évaluée.
- Elle peut aider à se détendre et à aborder la grossesse et l'accouchement plus sereinement, selon les préférences de chacune.
- Ces techniques demandent, au moins au début, l'accompagnement d'un professionnel.
- Les séances de préparation prises en charge par l'Assurance Maladie sont celles assurées par une sage-femme ou un médecin.

## Comprendre
La page de la Fédération française de cardiologie relayée par Santé.fr décrit la sophrologie comme un ensemble d'exercices rythmés par la respiration, pour mieux ressentir son corps et vivre le présent. Elle la range parmi les techniques d'aide pour réduire le stress, au même titre que la relaxation, la méditation ou la cohérence cardiaque, en précisant que ces techniques impliquent, au moins au début, l'accompagnement d'un thérapeute.

Dans le cadre de la grossesse, la HAS liste plusieurs approches possibles pour les techniques corporelles de la préparation à la naissance : préparation dite psychoprophylactique (respiration, bascule du bassin, poussée), sophrologie, préparation aquatique, haptonomie, acupuncture, yoga. Elle indique qu'aucune n'a été évaluée. Leur objectif commun : mieux connaître son corps, s'adapter aux changements, apprendre la relaxation et la respiration pour faciliter le travail.

Concrètement, une séance associe le plus souvent des exercices de respiration et de détente du corps ; le contenu varie selon le professionnel.

## Au quotidien
- **Demandez à votre sage-femme** : certaines proposent la sophrologie dans leurs séances de préparation à la naissance, prises en charge par l'Assurance Maladie.
- **Vérifiez la formation du praticien** si vous consultez en dehors des sages-femmes et médecins, et renseignez-vous sur le tarif : ces séances ne sont alors pas remboursées par l'Assurance Maladie.
- **Pratiquez entre les séances** : quelques minutes par jour, au calme, assise ou couchée sur le côté.
- **Exemple d'exercice simple** : inspirez lentement par le nez, soufflez longuement en relâchant les épaules ; puis parcourez mentalement votre corps de la tête aux pieds en relâchant chaque zone.
- **Utilisez-la au quotidien** : avant une échographie qui vous inquiète, lors d'une insomnie, dans les transports.
- **Impliquez votre partenaire** s'il ou elle le souhaite : certaines séances sont ouvertes au second parent.

## Questions fréquentes
**La sophrologie est-elle efficace contre la douleur de l'accouchement ?**
La HAS indique que les différentes techniques corporelles n'ont pas été formellement évaluées. Beaucoup de femmes y trouvent un appui pour se détendre ; cela ne remplace pas les autres moyens de soulagement, dont vous pourrez parler avec l'équipe.

**Peut-on combiner sophrologie et préparation classique ?**
Oui. Vous pouvez choisir une sage-femme qui propose la sophrologie dans les séances de préparation, ou compléter la préparation par des séances à part.

**À partir de quand commencer ?**
Il n'y a pas de date imposée. Les séances de préparation ont généralement lieu à partir du 7e mois, mais vous pouvez commencer à apprendre des techniques de relaxation plus tôt.

**La sophrologie peut-elle aider en cas d'anxiété importante ?**
Elle peut aider à gérer le stress du quotidien. Si l'anxiété est envahissante, empêche de dormir ou de vivre normalement, parlez-en à votre sage-femme ou médecin : un accompagnement psychologique peut être proposé.

## Quand demander conseil
Parlez à un professionnel si vous vous sentez triste, angoissée ou épuisée la plupart du temps, si vous ne dormez plus, ou si vous avez des idées noires. L'entretien prénatal précoce est un moment pour aborder ces difficultés. En cas de détresse ou d'idées suicidaires, appelez le 3114 (à toute heure) ; en cas d'urgence, le 15 ou le 112.

${END}`,
    tags: ['sophrologie', 'relaxation', 'stress', 'préparation à la naissance', 'détente', 'respiration'],
    sources: [S.hasPNP, S.santeStress, S.santePNP],
  },
  {
    ...PREG,
    slug: 'relaxation-meditation-respiration-lente-grossesse',
    title: 'Relaxation, méditation, respiration lente : se détendre pendant la grossesse',
    summary: 'Relâcher ses muscles un par un, observer ses pensées sans les juger, respirer lentement : des techniques simples pour réduire le stress, à apprendre si possible avec un professionnel.',
    category: 'sante-mentale',
    body_md: `Rendez-vous médicaux, questions sur l'avenir, fatigue, travail : la grossesse peut aussi être une période chargée en émotions. S'accorder chaque jour un moment de détente aide à traverser ces mois plus sereinement.

## En bref
- S'accorder chaque jour un moment de détente (relaxation, méditation, lecture, musique) fait partie des conseils simples pour réduire son stress.
- La relaxation consiste à relâcher ses muscles un par un et à repérer les zones de tension.
- La méditation propose d'observer ses pensées, émotions et sensations sans les juger.
- Une respiration lente, jusqu'à environ six respirations par minute, est une autre technique décrite.
- L'activité physique régulière renforce aussi le bien-être psychologique pendant la grossesse.

## Comprendre
La Fédération française de cardiologie, dans une page relayée par Santé.fr, propose dix réflexes pour réduire son stress : se faire plaisir chaque jour, bouger au moins 30 minutes, s'accorder un moment de détente, exprimer ses émotions, parler avec ses proches, respecter son sommeil, et consulter si besoin. Elle décrit plusieurs techniques : respiration lente, relaxation, méditation, sophrologie, cohérence cardiaque. Elle précise que ces techniques demandent, au moins au début, l'accompagnement d'un thérapeute.

Pendant la grossesse, Santé publique France rappelle que l'activité physique améliore le bien-être physique et psychologique et aide à s'adapter aux changements du corps. Les séances de préparation à la naissance comprennent des exercices de relaxation et de méditation.

Ressentir de l'inquiétude, de l'énervement ou de la peur pendant la grossesse arrive à beaucoup de futurs parents. Il est conseillé d'y prêter attention et d'en parler à l'autre parent, aux proches ou à des professionnels.

## Au quotidien
- **Relaxation progressive** : installée confortablement (assise ou couchée sur le côté), contractez doucement une zone (mains, épaules, visage…) quelques secondes, puis relâchez en soufflant. Passez d'une zone à l'autre.
- **Respiration lente** : inspirez par le nez en comptant lentement, soufflez un peu plus longtemps. Restez sur un rythme confortable, sans forcer ni retenir votre souffle.
- **Méditation de quelques minutes** : concentrez-vous sur les sensations de votre respiration ; quand une pensée arrive, notez-la sans la juger et revenez au souffle.
- **Un rituel détente** : bain tiède, musique douce, lecture, carnet de grossesse.
- **Bougez** : une marche dehors, une séance de natation ou de yoga prénatal aident aussi à se relâcher.
- **Limitez les sources de stress évitables** : informations anxiogènes, écrans tard le soir.
- **Partagez** : parlez de ce qui vous inquiète à votre partenaire, à des proches, à la sage-femme.

## Questions fréquentes
**Les applications de méditation sont-elles utiles ?**
Elles peuvent aider à pratiquer régulièrement. Choisissez des contenus sobres, sans promesse de résultats, et arrêtez si un exercice vous met mal à l'aise.

**Le stress peut-il nuire à mon bébé ?**
Le stress du quotidien fait partie de la vie. S'il devient envahissant ou durable, il est utile d'en parler à un professionnel, pour votre bien-être et celui de votre famille, sans culpabiliser.

**Qu'est-ce que la cohérence cardiaque ?**
C'est une technique qui vise à synchroniser le rythme du cœur et celui de la respiration. Elle fait partie des techniques citées pour réduire le stress ; un professionnel peut vous l'enseigner.

**Je n'arrive pas à me détendre : est-ce que je m'y prends mal ?**
Ces techniques demandent de l'entraînement, et ce qui convient varie d'une personne à l'autre. Essayez plusieurs approches, avec l'aide d'une sage-femme ou d'un professionnel formé.

## Quand demander conseil
Si l'anxiété, la tristesse ou l'irritabilité durent plus de deux semaines, vous empêchent de dormir ou de faire vos activités, parlez-en à votre sage-femme, votre médecin ou lors de l'entretien prénatal précoce. Un psychologue peut être proposé. En cas d'idées noires ou de détresse, appelez le 3114, joignable à toute heure. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    tags: ['relaxation', 'méditation', 'stress', 'anxiété', 'cohérence cardiaque', 'détente', 'bien-être'],
    sources: [S.santeStress, S.santeAP, S.santePNP],
  },
  {
    ...PREG,
    slug: 'choisir-sa-preparation-a-la-naissance-methodes',
    title: 'Préparation classique, sophrologie, yoga, eau, haptonomie : choisir sa préparation à la naissance',
    summary: 'Sept séances de préparation sont prises en charge par l’Assurance Maladie lorsqu’elles sont assurées par une sage-femme ou un médecin ; plusieurs approches corporelles existent, à choisir selon vos envies.',
    category: 'accouchement',
    body_md: `Au moment de s'inscrire à la préparation à la naissance, les futurs parents découvrent parfois une grande variété de propositions. Comment s'y retrouver ? Voici ce que disent les sources officielles et quelques questions pour vous aider à choisir.

## En bref
- Le parcours commence par l'entretien prénatal précoce, puis sept séances de préparation à la naissance et à la parentalité.
- Ces séances sont prises en charge à 100 % par l'Assurance Maladie lorsqu'elles sont réalisées par une sage-femme ou un médecin.
- Elles abordent la grossesse, l'accouchement, le retour à la maison et les besoins du bébé, avec des exercices corporels, de respiration et de relaxation.
- Plusieurs approches corporelles existent : préparation dite classique, sophrologie, préparation aquatique, haptonomie, yoga…
- La HAS précise qu'aucune n'a été formellement évaluée : le choix dépend de vos préférences.

## Comprendre
Selon Santé.fr et ameli.fr, la préparation commence par l'entretien prénatal précoce, conseillé tôt dans la grossesse, puis comprend sept séances, souvent collectives, parfois individuelles, généralement à partir du 7e mois. Vous pouvez choisir le professionnel qui suit votre grossesse ou un autre ; pour être remboursé, il doit s'agir d'une sage-femme ou d'un médecin.

Le contenu des séances est varié : déroulement de la grossesse, de l'accouchement et des suites de couches ; exercices corporels, initiation au yoga prénatal et exercices de respiration ; relaxation et méditation ; gestes et postures pour limiter les petits maux comme le mal de dos ; rôle de l'équipe ; compétences et besoins du bébé ; préparation du retour à la maison.

La HAS cite plusieurs approches corporelles possibles : la préparation dite psychoprophylactique (respiration, bascule du bassin, techniques de poussée), la sophrologie, la préparation aquatique, l'haptonomie, l'acupuncture et le yoga. Elle précise qu'aucune n'a été évaluée. L'haptonomie, par exemple, s'appuie sur le toucher et le contact avec le bébé à travers le ventre, souvent avec le second parent.

## Au quotidien
Quelques questions pour choisir :
- **Qu'est-ce qui me fait du bien ?** Bouger dans l'eau, respirer, méditer, échanger en groupe, être en tête-à-tête…
- **Mon partenaire veut-il participer ?** Certaines approches l'impliquent beaucoup ; certaines séances sont ouvertes au second parent.
- **Qu'est-ce qui est proche de chez moi ou de ma maternité ?** Beaucoup de maternités et de sages-femmes libérales proposent des séances.
- **Ai-je des besoins particuliers ?** Grossesse multiple, première grossesse, peur de l'accouchement, précédent accouchement difficile : parlez-en lors de l'entretien prénatal précoce, le contenu peut être adapté.
- **Quel coût ?** Les séances avec une sage-femme ou un médecin sont remboursées ; les autres praticiens ne le sont pas par l'Assurance Maladie.

Bon à savoir : certaines caisses d'Assurance Maladie organisent des ateliers collectifs sur la maternité ; le 36 46 vous indique s'il en existe dans votre département.

## Questions fréquentes
**Puis-je combiner plusieurs approches ?**
Oui. Vous pouvez suivre les séances avec une sage-femme et ajouter, si vous le souhaitez, une activité comme le yoga prénatal ou la natation.

**Est-il trop tard si je suis à 8 mois ?**
Il n'est jamais trop tard pour demander : même quelques séances peuvent aider. Parlez-en vite à votre sage-femme.

**Et pour un deuxième enfant ?**
La préparation reste possible et peut être adaptée : elle permet de revenir sur un premier accouchement, de préparer l'aîné à l'arrivée du bébé.

**Mon employeur doit-il me libérer pour les séances ?**
Renseignez-vous auprès de votre service des ressources humaines ou de votre convention collective ; les règles d'absence liées à la grossesse sont aussi présentées sur le Code du travail numérique.

## Quand demander conseil
Si l'accouchement vous fait très peur, si un accouchement précédent a été difficile, ou si vous vous sentez dépassée, parlez-en à la sage-femme ou au médecin : un accompagnement adapté peut être proposé. En cas de détresse, le 3114 répond à toute heure. Pour toute urgence pendant la grossesse (saignement, perte de liquide, douleur intense), appelez le 15 ou le 112.

${END}`,
    tags: ['préparation à la naissance', 'haptonomie', 'sophrologie', 'yoga prénatal', 'préparation aquatique', 'séances', 'remboursement'],
    sources: [S.santePNP, S.ameliPNP, S.hasPNP],
  },
  {
    ...PREG,
    slug: 'second-parent-preparation-physique-et-bien-etre',
    title: 'Le second parent dans la préparation : bouger, respirer et soutenir ensemble',
    summary: 'Marcher ensemble, apprendre les exercices de respiration, participer aux séances ouvertes, masser le dos : le second parent a toute sa place dans la préparation physique et le bien-être pendant la grossesse.',
    category: 'accouchement',
    body_md: `La grossesse se vit dans un seul corps, mais elle se prépare souvent à deux. Le second parent peut jouer un rôle concret dans le bien-être de la future mère et dans la préparation de l'accouchement.

## En bref
- Bouger à deux (marche, natation, danse) est une façon simple de partager la grossesse et de soutenir l'activité de la future mère.
- L'entretien prénatal précoce peut se faire en couple, et certaines séances de préparation sont ouvertes au second parent.
- Comprendre le déroulement de l'accouchement aide le second parent à soutenir et à détendre la future mère.
- La HAS recommande un soutien continu pendant le travail et cite les massages parmi les moyens de soulagement non médicamenteux.
- Le second parent peut s'absenter pour trois des examens médicaux obligatoires de la grossesse, sans perte de salaire.

## Comprendre
Les recommandations de la HAS sur la préparation à la naissance encouragent la participation des futurs pères, et plus largement du second parent, à l'entretien et aux séances. Santé.fr rapporte qu'une séance expliquant le déroulement de l'accouchement aide le partenaire à accompagner et détendre la future mère le jour J.

Pendant le travail, la HAS recommande que chaque femme bénéficie d'un soutien continu, individuel et personnalisé, et que l'équipe accompagne les moyens non médicamenteux choisis, dont les massages et la relaxation. Le second parent peut participer à ce soutien, en lien avec l'équipe.

Côté travail, le Code du travail prévoit que le conjoint ou la personne vivant en couple avec la salariée enceinte peut s'absenter pour trois des examens médicaux obligatoires, sans baisse de rémunération.

## Au quotidien
- **Bougez ensemble** : une marche quotidienne, une sortie à la piscine, une séance de danse dans le salon. C'est bon pour vous deux.
- **Apprenez la respiration** : faites les exercices ensemble, le soir ; le jour J, vous pourrez respirer au même rythme.
- **Massez le dos** : bas du dos, épaules, nuque, avec des gestes lents et une pression que la future mère ajuste. Demandez-lui ce qui lui fait du bien.
- **Aidez aux positions** : servez d'appui quand elle se penche en avant, aidez-la à se relever, installez les coussins.
- **Prenez le relais** sur les tâches lourdes : courses, packs d'eau, port de l'aîné, ménage qui demande de se pencher longtemps.
- **Venez aux séances** ouvertes au second parent et à l'entretien prénatal précoce si vous le souhaitez tous les deux.
- **Préparez le jour J** : trajet vers la maternité, sac, souhaits de la future mère concernant les positions, le bain, la musique.
- **Prenez soin de vous** : sommeil, activité, moments pour souffler. Un parent reposé soutient mieux.

## Questions fréquentes
**Je ne suis pas à l'aise avec l'idée de l'accouchement : comment me préparer ?**
Les séances d'information sur le déroulement de l'accouchement sont faites pour ça. Vous pouvez aussi poser vos questions à la sage-femme pendant l'entretien prénatal précoce.

**Comment masser sans faire mal ?**
Demandez à la future mère de guider la pression, évitez d'appuyer fort sur le ventre et arrêtez si elle ressent une gêne. La sage-femme peut vous montrer des gestes simples en séance.

**Puis-je assister à l'échographie ?**
Les règles d'absence au travail prévoient trois examens obligatoires pour le second parent. Pour la présence en salle, renseignez-vous auprès du lieu de l'examen.

**Et si nous ne sommes pas en couple ?**
La future mère peut être accompagnée par une personne de son choix, selon les règles de la maternité. Parlez-en lors de l'entretien prénatal précoce.

## Quand demander conseil
Si vous voyez la future mère très triste, angoissée, épuisée ou repliée sur elle-même, encouragez-la à en parler à un professionnel, et parlez-en vous aussi si vous allez mal. Le 3114 répond à toute heure en cas de détresse. En cas de saignement, perte de liquide, douleur intense ou malaise, appelez le 15 ou le 112.

${END}`,
    tags: ['second parent', 'père', 'partenaire', 'massage', 'soutien', 'accouchement', 'couple'],
    sources: [S.hasAccouchement, S.santePNP, S.codeTravailAbsences],
  },
  // ───────────────────────────── Sommeil et repos ─────────────────────────────
  {
    ...PREG,
    slug: 'activite-physique-et-sommeil-grossesse',
    title: 'Bouger pour mieux dormir pendant la grossesse',
    summary: 'L’activité physique améliore la qualité du sommeil pendant la grossesse ; quelques repères d’horaires, une sieste courte et un rituel calme le soir complètent ces bienfaits.',
    category: 'sommeil',
    body_md: `Ventre qui encombre, envies d'uriner, pensées qui tournent : le sommeil est souvent mis à mal pendant la grossesse. L'activité physique pendant la journée fait partie des leviers simples pour dormir mieux.

## En bref
- Santé publique France cite un sommeil de meilleure qualité parmi les bienfaits de l'activité physique pendant la grossesse.
- Faire du sport dans la journée facilite l'endormissement ; une activité intense tard le soir peut le retarder.
- Une sieste de vingt minutes maximum peut compenser une nuit perturbée, sans devenir la cause de troubles nocturnes.
- Un rituel calme le soir (lecture, musique, relaxation) prépare au sommeil.
- Pendant la grossesse, aucun médicament pour dormir ne doit être pris sans avis médical.

## Comprendre
Parmi les bienfaits de l'activité physique pendant la grossesse, Santé publique France mentionne un meilleur bien-être physique et psychologique et un sommeil de meilleure qualité. Les recommandations sont d'au moins 30 minutes par jour d'activité modérée, en l'absence de contre-indication.

Les conseils généraux d'hygiène du sommeil s'appliquent aussi. La page Santé.fr sur l'insomnie indique que le sport dans la journée facilite l'endormissement, mais qu'il vaut mieux éviter le sport après 20 h. La page gouvernementale sur la santé mentale conseille d'arrêter le sport 3 à 4 heures avant le coucher, de s'exposer à la lumière du jour le matin, de limiter les excitants après 14 h et de se déconnecter des écrans 1 à 2 heures avant de dormir.

Santé.fr rappelle aussi que les médicaments pour dormir ne doivent jamais être utilisés pendant la grossesse sans avis médical.

## Au quotidien
- **Bougez plutôt le matin ou l'après-midi** : une marche à la lumière du jour combine deux atouts pour le sommeil.
- **Gardez des horaires réguliers** de coucher et de lever, y compris le week-end.
- **Sieste courte** : si la nuit a été difficile, une sieste de vingt minutes environ peut aider, de préférence en début d'après-midi.
- **Le soir, place au calme** : étirements doux, respiration lente, relaxation, bain tiède, lecture.
- **Dînez léger** et limitez les boissons à la caféine en fin de journée (la caféine est de toute façon à modérer pendant la grossesse).
- **Préparez la chambre** : température autour de 18 à 20 °C, obscurité, literie confortable.
- **Installez-vous sur le côté** avec des coussins à partir du 2e trimestre.
- **Si vous ne dormez pas**, levez-vous après 20 à 30 minutes et faites une activité calme avant de retenter.

## Questions fréquentes
**Faire du sport le soir m'empêchera-t-il de dormir ?**
Les sources conseillent d'éviter l'activité intense en soirée. Une courte promenade calme ou des étirements doux avant le coucher sont différents d'une séance soutenue.

**Je suis épuisée : dois-je quand même bouger ?**
Écoutez votre fatigue. Même quelques minutes de marche comptent. Une fatigue intense et inhabituelle mérite d'être signalée à la sage-femme ou au médecin.

**Les tisanes peuvent-elles m'aider ?**
Certaines plantes ne sont pas recommandées pendant la grossesse. Demandez conseil à votre pharmacien, sage-femme ou médecin avant d'en consommer.

**Les écrans le soir gênent-ils vraiment ?**
Il est conseillé de s'en déconnecter 1 à 2 heures avant de dormir. Remplacer le téléphone par un livre ou une musique douce peut faciliter l'endormissement.

## Quand demander conseil
Consultez si l'insomnie dure, si vous ronflez beaucoup avec une fatigue importante, si des jambes sans repos vous empêchent de dormir, ou si le manque de sommeil s'accompagne de tristesse ou d'angoisse. En cas de détresse ou d'idées noires, appelez le 3114. Maux de tête intenses, troubles de la vue ou essoufflement au repos imposent d'appeler le 15 ou le 112.

${END}`,
    tags: ['sommeil', 'insomnie', 'activité physique', 'sieste', 'fatigue', 'endormissement', 'écrans'],
    sources: [S.santeAP, S.santeInsomnie, S.infoGouvSM],
  },
  {
    ...PREG,
    slug: 'positions-de-repos-et-de-sommeil-enceinte',
    title: 'Se reposer et dormir enceinte : sur le côté, avec des coussins',
    summary: 'À partir du 5e mois (24 semaines d’aménorrhée), il est conseillé d’éviter la position couchée à plat sur le dos ; la position sur le côté, avec des coussins, est souvent la plus confortable.',
    category: 'sommeil',
    min_week: 20,
    body_md: `Au fil des semaines, trouver une position confortable pour se reposer devient un petit défi. Les recommandations donnent un repère clair pour la seconde moitié de la grossesse : éviter de rester à plat sur le dos.

## En bref
- La HAS recommande d'éviter la position couchée sur le dos à partir de 24 semaines d'aménorrhée, surtout en cas de malaise, et de préférer la position sur le côté.
- Le guide du ministère chargé des Sports et Santé publique France conseillent d'éviter la position complètement allongée sur le dos de façon prolongée à partir du 5e mois.
- Des coussins entre les genoux, sous le ventre ou dans le dos rendent la position sur le côté plus confortable.
- Surélever les jambes au repos et relever légèrement les pieds du lit la nuit aident le retour veineux.
- Si vous vous réveillez sur le dos, il suffit de vous réinstaller sur le côté.

## Comprendre
En position couchée sur le dos, l'utérus devenu lourd peut appuyer sur les gros vaisseaux situés derrière lui, ce qui peut gêner la circulation et provoquer un malaise chez certaines femmes. C'est pourquoi la HAS recommande, à partir de 24 semaines d'aménorrhée, d'éviter la position couchée sur le dos et de privilégier la position sur le côté ou debout pour les exercices. Les sources de Santé publique France et du ministère chargé des Sports parlent d'éviter la position complètement allongée à partir du 5e mois.

Pour les jambes lourdes, fréquentes en fin de grossesse, Santé.fr conseille de surélever les jambes au repos et de relever les pieds du lit la nuit pour faciliter le retour veineux.

## Au quotidien
- **Couchée sur le côté** : genoux légèrement pliés, un coussin entre les genoux pour soulager le bassin et le dos.
- **Un coussin sous le ventre** quand il devient lourd, et un autre dans le dos pour ne pas rouler.
- **Coussin de grossesse** : un long coussin peut remplacer plusieurs oreillers ; choisissez-le ferme, lavable, et avec une housse amovible.
- **Changez de côté** quand vous en avez besoin : aucun côté n'est imposé par les sources consultées.
- **Semi-assise** : si vous avez des remontées acides ou êtes essoufflée, surélevez le buste avec des oreillers.
- **Jambes** : au repos dans la journée, allongez-les sur un coussin ; la nuit, surélevez légèrement les pieds du lit.
- **Pour vous relever**, passez par le côté et poussez sur vos bras.
- **Pendant les exercices au sol**, préférez la position sur le côté, à quatre pattes ou assise.

## Questions fréquentes
**Je me réveille sur le dos : est-ce grave ?**
Il est courant de changer de position en dormant. Réinstallez-vous simplement sur le côté ; des coussins dans le dos aident à garder la position. Si vous ressentez un malaise allongée sur le dos, tournez-vous sur le côté.

**Puis-je encore dormir sur le ventre ?**
En début de grossesse, si c'est confortable, oui. Au fil des mois, le ventre rend cette position difficile, et le côté devient plus confortable.

**Côté gauche ou côté droit ?**
Les sources consultées recommandent la position sur le côté, sans préciser de côté. Choisissez celui qui vous convient et alternez.

**Les exercices allongée sur le dos sont-ils interdits ?**
Ils sont à éviter de façon prolongée à partir du 5e mois. Demandez des variantes à la sage-femme ou à l'enseignant du cours prénatal.

## Quand demander conseil
Tournez-vous sur le côté et parlez-en à la sage-femme si vous ressentez malaises, vertiges, nausées ou sueurs en position allongée. Consultez rapidement en cas de gonflement brutal du visage ou des mains, de maux de tête intenses, de troubles de la vue, de mollet douloureux et gonflé ou de diminution des mouvements du bébé. En cas de malaise avec perte de connaissance ou de gêne respiratoire, appelez le 15 ou le 112.

${END}`,
    tags: ['position pour dormir', 'sommeil', 'dormir sur le côté', 'coussin de grossesse', 'repos', 'malaise'],
    sources: [S.hasSynthese, S.santeIdees, S.santeJambes],
  },
  // ───────────────────────────── Au travail ─────────────────────────────
  {
    ...PREG,
    slug: 'bouger-au-travail-enceinte-pauses-actives',
    title: 'Bouger au travail quand on est enceinte : des pauses actives',
    summary: 'Se lever et bouger au moins une minute par heure, marcher un peu toutes les deux heures, profiter des trajets : de petites habitudes au travail comptent pour la santé pendant la grossesse.',
    category: 'quotidien-grossesse',
    body_md: `Une journée de travail peut vite se résumer à des heures assise, ou au contraire à des heures debout. Pendant la grossesse, glisser du mouvement dans la journée fait partie des recommandations. Voici comment faire, sans matériel.

## En bref
- La HAS recommande de rompre les longues périodes assises en se levant et en bougeant au moins une minute par heure.
- Santé publique France conseille de bouger au moins toutes les deux heures, même si vous faites déjà 30 minutes d'activité par jour.
- Les déplacements domicile-travail et les activités professionnelles comptent comme activité physique.
- Une courte marche après de longues périodes assise aide la circulation.
- Le médecin du travail peut proposer des aménagements si le poste est difficile.

## Comprendre
Les recommandations sur l'activité physique pendant la grossesse ne concernent pas seulement le sport. La HAS demande de réduire le temps total passé assis et de rompre les longues périodes assises en se levant au moins une minute par heure. Santé publique France conseille de bouger au moins toutes les deux heures et de penser à une courte marche après de longues périodes assise, au travail, devant un écran ou en voiture.

Santé publique France rappelle aussi que l'activité physique peut être professionnelle, liée aux déplacements, domestique ou de loisir. Les trajets à pied ou à vélo vers le travail en font partie, en adaptant au terme et à l'équilibre.

Bouger régulièrement aide aussi le retour veineux : Santé.fr conseille, contre les jambes lourdes, de petites marches plusieurs fois par jour et d'éviter la station debout prolongée et le piétinement.

## Au quotidien
**Pauses actives de 1 à 3 minutes**
- Levez-vous, marchez jusqu'à la fenêtre, la machine à café ou l'imprimante d'un autre étage.
- Debout, montez sur la pointe des pieds puis redescendez sur les talons, une dizaine de fois.
- Assise, faites des cercles de chevilles et fléchissez les pieds.
- Faites rouler les épaules vers l'arrière, inclinez doucement la tête d'un côté puis de l'autre.
- Mains jointes, tendez les bras vers le haut sans creuser le dos, en respirant.
- Faites une série de contractions du périnée : personne ne le remarquera.

**Organisation**
- Programmez un rappel discret toutes les heures.
- Proposez des réunions debout ou en marchant quand c'est possible.
- Buvez régulièrement : aller remplir sa gourde est aussi une pause.
- Profitez de la pause déjeuner pour marcher 10 à 15 minutes dehors.
- Descendez un arrêt plus tôt ou garez-vous un peu plus loin, si vous vous sentez bien.

## Questions fréquentes
**Mon poste ne me permet pas de bouger : que faire ?**
Parlez-en au médecin du travail. L'INRS recommande de l'informer rapidement de la grossesse ; il peut étudier la situation et proposer des adaptations.

**Est-ce que le vélo pour aller au travail reste possible ?**
Le vélo fait partie des activités citées par Santé publique France. Au fil de la grossesse, l'équilibre change : la HAS invite à éviter les activités à risque de chute. Parlez-en avec la sage-femme selon votre trajet et votre terme.

**En télétravail, comment ne pas rester figée ?**
Les mêmes repères s'appliquent : se lever chaque heure, alterner assis et debout, faire une vraie pause déjeuner, sortir marcher.

**Les escaliers sont-ils déconseillés ?**
Monter les escaliers à son rythme est une activité du quotidien. Tenez la rampe, surtout en fin de grossesse, et ralentissez si vous êtes essoufflée.

## Quand demander conseil
Parlez au médecin du travail ou à la sage-femme si votre travail vous fatigue beaucoup, vous oblige à porter des charges, à rester debout longtemps ou à travailler de nuit. Arrêtez-vous et consultez en cas de contractions régulières, de saignement, de perte de liquide, de vertiges ou de malaise. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    tags: ['travail', 'bureau', 'pauses', 'sédentarité', 'télétravail', 'bouger', 'enceinte au travail'],
    sources: [S.hasSynthese, S.santeAP, S.inrsRepro],
  },
  {
    ...PREG,
    slug: 'travail-assis-sur-ecran-enceinte-posture',
    title: 'Travail assis sur écran pendant la grossesse : régler son poste et sa posture',
    summary: 'Un siège bien réglé avec un appui lombaire, un écran à bonne hauteur, des pauses régulières et l’alternance assis-debout rendent les journées sur écran plus confortables pendant la grossesse.',
    category: 'quotidien-grossesse',
    body_md: `Plusieurs heures par jour devant un ordinateur, avec un ventre qui s'arrondit : le dos, la nuque et les jambes le font vite sentir. Quelques réglages et habitudes aident à rendre le poste plus confortable.

## En bref
- L'INRS recommande un poste bien dimensionné, un écran positionné à la bonne distance et à la bonne hauteur, et des pauses régulières.
- Alterner position assise et debout et se déplacer régulièrement font partie des conseils de prévention.
- Pendant la grossesse, la HAS recommande de se lever et bouger au moins une minute par heure.
- Un appui au creux des reins et les pieds bien posés soulagent le bas du dos.
- Le médecin du travail peut proposer un aménagement du poste.

## Comprendre
L'INRS, dans ses conseils sur le travail sur écran, recommande d'aménager le poste pour permettre des postures adaptées, avec un mobilier bien dimensionné ; de positionner correctement l'écran en distance et en hauteur ; d'adapter l'éclairage ; de prévoir des pauses régulières et des pauses visuelles en regardant au loin ; d'alterner les tâches sur écran avec d'autres activités ; et d'alterner position assise et debout. Les bureaux à hauteur variable sont cités comme une option.

Pendant la grossesse, ces conseils prennent encore plus de sens. Le ventre éloigne du bureau, le dos se cambre, la circulation dans les jambes est moins bonne. Le livret de l'Assurance Maladie sur la lombalgie conseille de régler la hauteur du siège, de placer un appui au creux des reins et de se lever pour s'étirer régulièrement.

## Au quotidien
- **Siège** : asseyez-vous au fond, réglez la hauteur pour avoir les pieds à plat et les genoux à peu près à hauteur des hanches. Ajoutez un petit coussin au creux des reins.
- **Repose-pieds** : utile si vos pieds ne touchent pas bien le sol, et pour soulager les jambes.
- **Écran** : en face de vous, à une distance confortable, le haut de l'écran à peu près à hauteur des yeux. Avec un portable, un support et un clavier séparés aident.
- **Clavier et souris** près du bord du bureau, coudes près du corps, épaules relâchées.
- **Ventre** : si le ventre vous éloigne du bureau, rapprochez le clavier plutôt que de vous pencher en avant.
- **Pauses visuelles** : toutes les heures, regardez au loin quelques instants.
- **Alternez** : passez un appel debout, lisez un document en marchant, utilisez un bureau réglable si possible.
- **Jambes** : évitez de les croiser longtemps, bougez les chevilles régulièrement.

## Questions fréquentes
**Les écrans sont-ils dangereux pendant la grossesse ?**
Les sources consultées sur le travail sur écran portent sur la posture, la fatigue visuelle et l'organisation du travail. Pour toute question sur l'exposition au travail, parlez-en au médecin du travail.

**Puis-je demander un siège adapté ?**
Oui, parlez-en à votre employeur et au médecin du travail. L'INRS indique que celui-ci peut proposer des adaptations du poste, dans le respect du secret médical.

**J'ai des fourmillements dans les mains en tapant : est-ce lié ?**
Signalez-le à la sage-femme ou au médecin, qui pourra en rechercher la cause. En attendant, gardez les poignets dans l'alignement des avant-bras et faites des pauses.

**Le ballon peut-il remplacer ma chaise de bureau ?**
Il peut servir quelques minutes pour bouger le bassin, mais il ne soutient pas le dos et l'équilibre change pendant la grossesse. Alternez plutôt avec une chaise réglable.

## Quand demander conseil
Parlez au médecin du travail si votre poste vous fait souffrir ou ne peut pas être adapté. Consultez votre médecin ou sage-femme en cas de douleurs persistantes du dos ou des poignets, de jambes très gonflées, ou de fatigue intense. Un mollet douloureux, chaud et gonflé, surtout d'un seul côté, ou une gêne respiratoire brutale imposent de consulter en urgence : appelez le 15 ou le 112.

${END}`,
    tags: ['travail sur écran', 'bureau', 'ergonomie', 'posture assise', 'siège', 'dos', 'télétravail'],
    sources: [S.inrsEcran, S.ameliLombalgie, S.hasSynthese],
  },
  {
    ...PREG,
    slug: 'travail-debout-port-de-charges-enceinte',
    title: 'Travail debout, piétinement et port de charges pendant la grossesse',
    summary: 'L’INRS recommande d’éviter pour les femmes enceintes le travail debout à piétiner et le port de charges, et de pouvoir s’asseoir régulièrement ; le médecin du travail peut proposer un aménagement.',
    category: 'quotidien-grossesse',
    body_md: `Commerce, soins, restauration, logistique, enseignement : de nombreux métiers obligent à rester debout ou à porter. Pendant la grossesse, ces contraintes se font plus lourdes. Des repères existent pour les limiter et des interlocuteurs peuvent vous aider.

## En bref
- L'INRS recommande d'éviter le travail debout à piétiner et de permettre à toute femme enceinte de s'asseoir, par exemple quelques minutes toutes les heures.
- Le port de charges est à éviter ; le médecin du travail peut proposer une dispense.
- Le travail de nuit ou posté est à éviter à partir de la 12e semaine d'aménorrhée, selon l'INRS.
- La station debout immobile prolongée est aussi déconseillée par la HAS ; elle favorise les jambes lourdes.
- Des bas de contention peuvent être prescrits, notamment aux femmes qui travaillent debout.

## Comprendre
L'INRS recommande d'informer rapidement le médecin du travail de la grossesse, voire du projet de grossesse. Dans le respect du secret médical, il peut étudier le poste et proposer des adaptations, comme une dispense de port de charges, ou une affectation à un autre poste. L'INRS conseille d'éviter le travail debout à piétiner, de permettre de s'asseoir régulièrement, d'éviter le port de charges et le travail de nuit ou posté à partir de 12 semaines d'aménorrhée.

La HAS, dans ses recommandations sur l'activité physique pendant la grossesse, demande aussi d'éviter la station debout immobile prolongée.

Pour les jambes, Santé.fr explique qu'en fin de grossesse, l'utérus gêne le retour veineux et que les hormones et l'augmentation du volume sanguin favorisent le gonflement des chevilles et la sensation de jambes lourdes. Des bas de contention adaptés peuvent être prescrits ; ils sont recommandés aux femmes ayant des varices avant la grossesse et à celles qui travaillent debout.

## Au quotidien
- **Asseyez-vous dès que possible** : un tabouret haut ou un siège assis-debout à proximité du poste permet de se poser quelques minutes.
- **Bougez plutôt que piétiner** : marchez quelques pas, transférez le poids d'un pied sur l'autre, montez sur la pointe des pieds.
- **Posez un pied sur une marche** ou un repose-pied, en alternant, pour soulager le bas du dos.
- **Déléguez les charges** : demandez de l'aide, utilisez un chariot, fractionnez les charges. Si vous devez soulever, pliez les genoux, gardez l'objet près du corps et soufflez.
- **Chaussez-vous confortablement**, avec des chaussures stables.
- **Pendant les pauses**, surélevez les jambes et buvez de l'eau.
- **Évitez la chaleur au sol** et les chaussettes trop serrées, qui gênent la circulation.
- **Le soir**, surélevez les jambes et une douche fraîche sur les jambes peut soulager.

## Questions fréquentes
**Dois-je dire à mon employeur que je suis enceinte pour obtenir un aménagement ?**
L'INRS recommande d'informer rapidement le médecin du travail, qui est tenu au secret médical. Il peut proposer des adaptations à l'employeur. Pour vos droits précis, renseignez-vous auprès des ressources humaines, des représentants du personnel ou de Service-public.fr.

**Mon salaire baisse-t-il si on change mon poste ?**
Les règles en cas de changement d'affectation pendant la grossesse sont détaillées sur Service-public.fr. Renseignez-vous auprès des ressources humaines ou des représentants du personnel pour votre situation.

**Les bas de contention sont-ils obligatoires ?**
Ils se prescrivent après avis médical. Parlez-en à votre médecin ou sage-femme si vos jambes sont lourdes ou si vous travaillez debout.

**Je travaille de nuit : que faire ?**
L'INRS conseille d'éviter le travail de nuit ou posté à partir de 12 semaines d'aménorrhée. Parlez-en au médecin du travail.

## Quand demander conseil
Consultez si la fatigue est intense, si les douleurs du dos ou du bassin vous empêchent de travailler, si vos jambes gonflent beaucoup. Un gonflement soudain, douloureux ou d'un seul côté, ou accompagné de fièvre, doit faire consulter rapidement. Contractions régulières, saignement, perte de liquide ou malaise au travail : appelez le 15 ou le 112.

${END}`,
    tags: ['travail debout', 'port de charges', 'médecin du travail', 'aménagement de poste', 'jambes lourdes', 'travail de nuit'],
    sources: [S.inrsRepro, S.santeJambes, S.hasSynthese],
  },
  // ───────────────────────────── Sécurité ─────────────────────────────
  {
    ...PREG,
    slug: 'signes-pour-arreter-exercice-grossesse-contre-indications',
    title: 'Exercice pendant la grossesse : les signes pour arrêter et les situations où l’activité est limitée',
    summary: 'Essoufflement qui ne passe pas au repos, vertiges, douleur dans la poitrine, mollet douloureux, contractions, saignement ou perte de liquide : ces signes imposent d’arrêter et de consulter ; certaines situations limitent l’activité.',
    category: 'sante-grossesse',
    safety_critical: true,
    body_md: `L'activité physique est recommandée pendant la grossesse, mais il est essentiel de connaître les signaux qui doivent faire arrêter immédiatement, et les situations où elle doit être limitée ou adaptée. Gardez ces repères en tête, et partagez-les avec votre entourage.

## En bref
- Arrêtez l'effort et consultez en cas d'essoufflement excessif qui ne cède pas au repos, de vertiges, de malaise ou de maux de tête.
- Arrêtez aussi en cas de faiblesse musculaire qui vous déséquilibre, de douleur ou gonflement du mollet, de contractions régulières et douloureuses, de saignement ou de perte de liquide.
- Une douleur ou une pression dans la poitrine est une urgence : appelez le 15 ou le 112.
- Certaines situations médicales contre-indiquent l'activité intense ou demandent une évaluation au cas par cas.
- En cas de doute, c'est la sage-femme ou le médecin qui fixe ce qui est possible pour vous.

## Comprendre
La HAS et le guide du ministère chargé des Sports listent les signes qui doivent faire arrêter l'activité et consulter, pendant ou après l'effort : essoufflement excessif ou persistant au repos, fatigue intense, vertiges, malaise ou évanouissement, maux de tête, douleur dans la poitrine, douleur ou gonflement d'un mollet, faiblesse musculaire avec perte d'équilibre, contractions utérines douloureuses ou régulières, saignement vaginal, perte de liquide amniotique. La HAS précise que la douleur ou la pression thoracique est une urgence médicale.

La HAS distingue aussi des contre-indications. Certaines sont dites absolues pour l'activité physique soutenue : par exemple rupture prématurée de la poche des eaux, travail prématuré, saignements persistants inexpliqués ou placenta prævia après 24 semaines, pré-éclampsie, béance du col ou cerclage, signes de retard de croissance du bébé. D'autres sont relatives et demandent une évaluation bénéfices-risques avec l'obstétricien : fausses couches à répétition, hypertension de la grossesse, grossesse gémellaire à partir de 28 semaines, anémie importante, diabète mal équilibré, certaines maladies cardiaques, pulmonaires ou thyroïdiennes, tabagisme important, entre autres. Le guide des Sports précise qu'en cas de contre-indication absolue, les activités de la vie quotidienne peuvent souvent se poursuivre, sans activité intense.

## Au quotidien
- **Parlez de votre activité** à chaque consultation : la sage-femme ou le médecin vous dira ce qui est adapté.
- **Ne partez pas seule loin** en fin de grossesse : gardez un téléphone chargé, informez quelqu'un de votre trajet.
- **Buvez de l'eau** avant, pendant et après l'effort, et évitez la chaleur.
- **Gardez le test de la parole** : si vous ne pouvez plus parler, ralentissez.
- **Si un signe apparaît**, arrêtez-vous, asseyez-vous ou allongez-vous sur le côté, et appelez.
- **Notez ce qui s'est passé** (heure, durée, symptômes) pour le décrire au professionnel.
- **Après un arrêt**, ne reprenez pas sans avoir eu un avis.

## Questions fréquentes
**J'ai eu une petite contraction pendant ma marche : dois-je m'inquiéter ?**
Un durcissement isolé du ventre qui passe au repos peut survenir. Des contractions régulières, douloureuses, ou qui ne cèdent pas au repos font partie des signes pour arrêter et consulter, surtout avant 37 semaines.

**J'ai une grossesse gémellaire : puis-je faire du sport ?**
La HAS classe la grossesse gémellaire à partir de 28 semaines parmi les contre-indications relatives : l'activité se décide avec l'obstétricien, selon votre situation.

**Mon médecin m'a demandé du repos : puis-je faire des étirements ?**
Suivez ses consignes et demandez-lui précisément ce qui est permis. Les mouvements autorisés dépendent de la raison du repos.

**Faut-il surveiller sa fréquence cardiaque ?**
Le guide des Sports indique que, si vous la mesurez, la valeur à ne pas dépasser se fixe avec le professionnel qui suit la grossesse. Le test de la parole reste un repère simple.

## Quand demander conseil
Appelez le 15 ou le 112 en cas de douleur ou de pression dans la poitrine, de perte de connaissance, de gêne respiratoire importante, de saignement abondant ou de douleur abdominale intense. Contactez la maternité sans attendre en cas de perte de liquide, de contractions régulières avant le terme ou de diminution des mouvements du bébé ; un mollet douloureux et gonflé doit faire consulter en urgence. Pour les autres signes listés, arrêtez l'activité et consultez rapidement la sage-femme ou le médecin.

${END}`,
    tags: ['signes d\'alerte', 'arrêter le sport', 'contre-indications', 'contractions', 'saignement', 'urgence', 'essoufflement'],
    sources: [S.hasSynthese, S.hasFiche, S.guideSports],
  },
];
