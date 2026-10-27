/** Guide complet — lot 19 (27/10/2026) : petits maux de l’enfant de A à Z (rhume, toux, saignement de nez, verrues, molluscum, impétigo, mal de tête, mal de gorge, laryngite, conjonctivite, orgelet, grippe…). Articles rédigés avec l’aide d’une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles ou de référence françaises réellement lues le 2026-10-27. `published` = date affichée par la page. */
const S = {
  rhinoReco: { label: 'ameli.fr — Reconnaître la rhinopharyngite du bébé et de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-enfant/reconnaitre-rhinopharyngite', consulted_on: C, published: '2026-02-04' },
  rhinoQueFaire: { label: 'ameli.fr — Rhinopharyngite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-enfant/que-faire-cas-faut-consulter', consulted_on: C },
  rhinoTraitement: { label: 'ameli.fr — Traitement de la rhinopharyngite de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-enfant/traitement-medical', consulted_on: C },
  rhinoPrev: { label: 'ameli.fr — Prévenir la rhinopharyngite de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-enfant/prevention', consulted_on: C, published: '2026-02-04' },
  lavageNez: { label: 'ameli.fr — Comment pratiquer un lavage de nez chez un enfant ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/soins/pratiquer-lavage-nez-enfant', consulted_on: C },
  santeToux: { label: 'Santé.fr — Toux de l’enfant', url: 'https://www.sante.fr/toux-de-lenfant', consulted_on: C, published: '2026-08-12' },
  ameliToux: { label: 'ameli.fr — Toux : quand consulter et comment la calmer ?', url: 'https://www.ameli.fr/assure/sante/themes/toux/calmer-toux-cas-faut-consulter', consulted_on: C },
  coqSymptomes: { label: 'ameli.fr — Coqueluche : définition, transmission et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/coqueluche/definition-transmission-symptomes', consulted_on: C, published: '2026-03-12' },
  coqQueFaire: { label: 'ameli.fr — Comment réagir en cas de coqueluche ?', url: 'https://www.ameli.fr/assure/sante/themes/coqueluche/que-faire-quand-consulter', consulted_on: C, published: '2026-03-12' },
  epistaxisAmeli: { label: 'ameli.fr — Saignement de nez ou épistaxis', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/epistaxis-saignement-de-nez', consulted_on: C },
  epistaxisSante: { label: 'Santé.fr — Saignement de nez (épistaxis)', url: 'https://www.sante.fr/saignement-de-nez-epistaxis', consulted_on: C, published: '2026-08-13' },
  verruesDef: { label: 'ameli.fr — Définition et causes des verrues cutanées', url: 'https://www.ameli.fr/assure/sante/themes/verrues/definition-apparition-verrues-cutanees', consulted_on: C, published: '2025-05-27' },
  verruesQueFaire: { label: 'ameli.fr — Verrues sur la peau : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/verrues/que-faire-quand-consulter-verrues', consulted_on: C },
  verruesTraitement: { label: 'ameli.fr — Verrues : la consultation et le traitement', url: 'https://www.ameli.fr/assure/sante/themes/verrues/consultation-traitements-verrues', consulted_on: C, published: '2025-05-27' },
  verrueSante: { label: 'Santé.fr — Verrue', url: 'https://www.sante.fr/verrue', consulted_on: C, published: '2026-08-13' },
  dermatoVerrues: { label: 'Dermato-Info (Société française de dermatologie) — Tout savoir sur les verrues', url: 'https://dermato-info.fr/tout-savoir-sur-les-verrues', consulted_on: C, published: '2026-03-21' },
  sfdMolluscum: { label: 'Société française de dermatologie — Molluscum contagiosum : une infection virale fréquente chez l’enfant (communiqué)', url: 'https://www.sfdermato.org/upload/presse/260721014940_sfd-cp-molluscum-contagiosum-enfant-vdef.pdf', consulted_on: C, published: '2026-07-21' },
  sfpCollectivites: { label: 'Société française de pédiatrie, DGS et Assurance Maladie — Guide pratique « Collectivités de jeunes enfants et maladies infectieuses »', url: 'https://www.ameli.fr/sites/default/files/Documents/4900/document/collectivites-maladies-infectieuses_assurance-maladie.pdf', consulted_on: C, published: '2006-11' },
  impetigoSante: { label: 'Santé.fr (Antibio’Malin) — Impétigo', url: 'https://www.sante.fr/impetigo', consulted_on: C, published: '2022-03-15' },
  impetigoPrev: { label: 'ameli.fr — Prévenir la survenue de l’impétigo', url: 'https://www.ameli.fr/assure/sante/themes/impetigo/prevention', consulted_on: C, published: '2026-01-27' },
  impetigoTraitement: { label: 'ameli.fr — Impétigo : consultation, traitement et évolution', url: 'https://www.ameli.fr/assure/sante/themes/impetigo/consultation-traitement-evolution', consulted_on: C, published: '2026-01-27' },
  malTeteDef: { label: 'ameli.fr — Mal de tête (céphalée) : définition et causes', url: 'https://www.ameli.fr/assure/sante/themes/mal-tete/definition-causes', consulted_on: C, published: '2026-06-29' },
  malTeteCalmer: { label: 'ameli.fr — Mal de tête : comment être soulagé(e) et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/mal-tete/calmer-cas-faut-consulter', consulted_on: C, published: '2026-06-29' },
  santeMauxTete: { label: 'Santé.fr — Maux de tête et migraine', url: 'https://www.sante.fr/maux-de-tete-et-migraine', consulted_on: C, published: '2026-08-12' },
  migraineSymptomes: { label: 'ameli.fr — Migraine : symptômes, facteurs déclenchants et évolution', url: 'https://www.ameli.fr/assure/sante/themes/migraine/symptomes-facteurs-declenchants-evolution', consulted_on: C, published: '2025-10-17' },
  migraineReflexes: { label: 'ameli.fr — Que faire et quand consulter en cas de migraine ?', url: 'https://www.ameli.fr/assure/sante/themes/migraine/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2025-10-17' },
  meningite: { label: 'ameli.fr — Méningite : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/themes/meningite-aigue/symptomes-diagnostic-evolution', consulted_on: C, published: '2024-04-08' },
  fievreEnfant: { label: 'ameli.fr — Votre enfant a de la fièvre : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2024-09-03' },
  angineSante: { label: 'Santé.fr — Angine et mal de gorge de l’enfant', url: 'https://www.sante.fr/angine-et-mal-de-gorge-de-lenfant', consulted_on: C, published: '2026-08-12' },
  larynxDef: { label: 'ameli.fr — Définition et symptômes de la laryngite (enfant)', url: 'https://www.ameli.fr/assure/sante/themes/laryngite-enfant/definition-symptomes', consulted_on: C },
  larynxReflexes: { label: 'ameli.fr — Laryngite de l’enfant : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/laryngite-enfant/bons-reflexes-bons-gestes', consulted_on: C, published: '2026-02-13' },
  antibioLarynx: { label: 'Santé.fr (Antibio’Malin) — Laryngite', url: 'https://www.sante.fr/antibiomalin-pour-savoir-comment-bien-utiliser-les-antibiotiques/laryngite', consulted_on: C, published: '2026-05-19' },
  essoufflement: { label: 'ameli.fr — Je suis brutalement essoufflé et j’ai du mal à respirer : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/essoufflement-recent/je-suis-brutalement-essouffle-et-j-ai-du-mal-respirer-que-faire', consulted_on: C },
  collyre: { label: 'ameli.fr — Comment bien mettre un collyre ?', url: 'https://www.ameli.fr/assure/sante/medicaments/utiliser-recycler-medicaments/mettre-collyre', consulted_on: C },
  conjReco: { label: 'ameli.fr — Reconnaître une conjonctivite', url: 'https://www.ameli.fr/assure/sante/themes/conjonctivite/reconnaitre-conjonctivite', consulted_on: C, published: '2025-11-17' },
  conjQueFaire: { label: 'ameli.fr — Conjonctivite : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/conjonctivite/que-faire-quand-consulter', consulted_on: C, published: '2025-05-06' },
  antibioConj: { label: 'Santé.fr (Antibio’Malin) — Conjonctivite', url: 'https://www.sante.fr/antibiomalin-pour-savoir-comment-bien-utiliser-les-antibiotiques/conjonctivite', consulted_on: C, published: '2026-09-24' },
  oeilRouge: { label: 'ameli.fr — Œil rouge : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/oeil-rouge/que-faire-quand-consulter', consulted_on: C, published: '2026-01-06' },
  corpsEtrangerOeil: { label: 'ameli.fr — Corps étranger dans l’œil', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/oeil', consulted_on: C, published: '2025-10-20' },
  orgeletReco: { label: 'ameli.fr — Reconnaître un orgelet', url: 'https://www.ameli.fr/assure/sante/themes/orgelet/reconnaitre-orgelet', consulted_on: C, published: '2026-06-26' },
  orgeletReflexes: { label: 'ameli.fr — Orgelet : que faire pour le soigner ?', url: 'https://www.ameli.fr/assure/sante/themes/orgelet/bons-reflexes-que-faire', consulted_on: C, published: '2025-04-23' },
  orgeletConsult: { label: 'ameli.fr — Orgelet : la consultation et le traitement', url: 'https://www.ameli.fr/assure/sante/themes/orgelet/consultation-traitement', consulted_on: C, published: '2026-06-26' },
  grippeReco: { label: 'ameli.fr — Reconnaître la grippe : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/themes/grippe/reconnaitre-grippe', consulted_on: C, published: '2026-09-25' },
  grippePrev: { label: 'ameli.fr — Prévenir la grippe : comprendre la vaccination et les gestes barrières', url: 'https://www.ameli.fr/assure/sante/themes/grippe/prevention', consulted_on: C },
  santeGrippe: { label: 'Santé.fr — Grippe', url: 'https://www.sante.fr/grippe-1', consulted_on: C, published: '2026-08-12' },
  vaccinGrippe: { label: 'Vaccination Info Service (Santé publique France) — Grippe', url: 'https://www.vaccination-info-service.fr/Les-maladies-et-leurs-vaccins/grippe', consulted_on: C, published: '2026-10-13' },
  gestesBarrieres: { label: 'ameli.fr — Les gestes barrières pour limiter la transmission des virus saisonniers et du Covid-19', url: 'https://www.ameli.fr/assure/sante/themes/gestes-barrieres/les-gestes-barrieres-adopter', consulted_on: C, published: '2026-09-23' },
  gestesEnfants: { label: 'Santé.fr — « Les enfants n’ont pas besoin de suivre les gestes barrières » (Faux)', url: 'https://www.sante.fr/gestes-barrieres/les-enfants-nont-pas-besoin-de-suivre-les-gestes-barrieres', consulted_on: C, published: '2025-10-02' },
  herpesAmeli: { label: 'ameli.fr — Que faire et quand consulter en cas d’herpès labial ou bouton de fièvre ?', url: 'https://www.ameli.fr/assure/sante/themes/herpes-labial/que-faire-cas-faut-consulter', consulted_on: C, published: '2025-06-20' },
  herpesAntibio: { label: 'Santé.fr (Antibio’Malin) — Herpès, bouton de fièvre', url: 'https://www.sante.fr/antibiomalin-pour-savoir-comment-bien-utiliser-les-antibiotiques/herpes-bouton-de-fievre', consulted_on: C, published: '2022-03-08' },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l’article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, du pharmacien, de la PMI ou des professionnels qui suivent votre enfant._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**, joignables gratuitement même depuis un téléphone bloqué ou sans crédit.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['child'], min_age_months: 12, max_age_months: 144, status: 'to_review', ...x,
});

export const GUIDE_B19: LibArticle[] = [
  // ------------------------------------------------------------------ nez et rhume
  a({
    slug: 'rhume-enfant-rhinopharyngite-soulager-a-la-maison',
    title: 'Rhume de l’enfant (rhinopharyngite) : soulager à la maison, jour après jour',
    summary: 'Nez qui coule, petite fièvre, toux : comment accompagner un enfant enrhumé à la maison et repérer les signes qui doivent faire consulter.',
    category: 'sante-enfant', tags: ['rhume', 'rhinopharyngite', 'nez qui coule', 'nez bouché', 'morve verte', 'fièvre', 'toux', 'lavage de nez', 'virus'],
    sources: [S.rhinoReco, S.rhinoQueFaire, S.rhinoTraitement],
    body_md: `## En bref
- Le rhume, appelé **rhinopharyngite**, est une infection virale bénigne : c’est la maladie infectieuse la plus fréquente chez l’enfant, surtout entre 5 mois et 8 ans.
- Il guérit le plus souvent **seul, en moins de 10 jours**. Les antibiotiques n’agissent pas sur les virus.
- Les soins reposent sur le **nez dégagé**, des boissons proposées souvent, une chambre aérée et pas trop chauffée.
- Un écoulement qui devient **jaune ou vert** ne signifie pas, à lui seul, une surinfection.
- Les sprays nasaux **vasoconstricteurs** sont contre-indiqués avant 15 ans.

## Comprendre
Selon l’Assurance Maladie, la rhinopharyngite touche la muqueuse du nez et celle du pharynx, à l’arrière des fosses nasales. Sous l’effet du virus, la muqueuse nasale gonfle et produit beaucoup de sécrétions : le nez se bouche ou coule. Plusieurs virus peuvent en être responsables, le plus souvent un rhinovirus. L’immunité acquise après un rhume est courte et ne protège pas contre les autres virus : un enfant peut donc en enchaîner plusieurs au cours d’un même hiver.

Le déroulé habituel, d’après ameli.fr :
- **Incubation** de 1 à 7 jours.
- **Début** avec une fièvre modérée (en général sous 39 °C) et un nez bouché, puis un écoulement nasal.
- **Fièvre** qui dure au maximum 3 jours ; l’enfant reste en général tonique.
- **Écoulement** de 2 à 10 jours, d’abord clair, puis souvent épais, jaune ou verdâtre.
- **Autres signes possibles** : mal de gorge, éternuements, toux jusqu’à 10 jours, parfois avec des vomissements.

Les symptômes sont au maximum vers le 2e ou le 3e jour, puis diminuent. Des complications, le plus souvent bactériennes, peuvent survenir : otite, sinusite, conjonctivite purulente. Le rhume peut aussi précéder une bronchiolite, une bronchite ou une laryngite dues au même virus.

## Au quotidien
**Dégager le nez**
- Faites-le moucher dans un mouchoir jetable, jeté aussitôt, s’il sait le faire.
- S’il est trop petit, lavez-lui le nez avec du sérum physiologique ou une solution d’eau de mer en dosettes unidoses.
- Évitez d’utiliser trop souvent le mouche-bébé, qui peut irriter la muqueuse.
- Évitez la climatisation, qui assèche l’air et le nez.

**Accompagner la toux**
- La toux aide à évacuer les sécrétions : elle n’est pas à supprimer systématiquement.
- Humidifiez l’air, faites boire régulièrement, proposez des repas plus petits et plus fréquents pour limiter la fatigue.
- Avant 2 ans, antitussifs et fluidifiants bronchiques sont contre-indiqués. Après 2 ans, demandez conseil au pharmacien ou au médecin avant tout sirop.

**Gérer la fièvre**
- Installez l’enfant dans une pièce fraîche et aérée (18 à 20 °C), sans trop le couvrir ni le déshabiller entièrement.
- Proposez-lui souvent à boire, même s’il ne réclame pas.
- Évitez le bain nettement plus froid que sa température : il risque de frissonner.
- Un médicament n’est pas toujours nécessaire si la température reste sous 38,5 °C. Le paracétamol est le médicament de référence, à la dose adaptée au poids indiquée par le médecin ou le pharmacien. Pas d’aspirine sans avis médical, et pas d’ibuprofène en cas de varicelle ou de déshydratation.

## Questions fréquentes
**Son nez coule vert : faut-il un antibiotique ?** Non, pas pour cette seule raison. Selon ameli.fr, un écoulement épais et coloré fait partie de l’évolution habituelle de la rhinopharyngite. Les antibiotiques sont réservés aux complications bactériennes diagnostiquées par un médecin.

**Puis-je utiliser un spray pour déboucher son nez ?** Les lavages et le mouchage suffisent dans la plupart des cas. Si vous souhaitez un spray, choisissez un produit adapté à son âge, avec l’aide du pharmacien. Les vasoconstricteurs nasaux sont contre-indiqués avant 15 ans.

**Pourquoi attrape-t-il rhume sur rhume ?** Chaque rhume peut être dû à un virus différent et l’immunité acquise est courte. Les enfants malades souvent avant 3 ans le sont en général de moins en moins ensuite.

## Quand demander conseil
**Consultez en urgence** si l’enfant a moins de 3 mois et de la fièvre ; si sa fièvre atteint 40 °C ; s’il a du mal à respirer ; s’il somnole, répond mal ou pleure faiblement ; s’il est très pâle ou a des taches violacées sur la peau ; s’il a des maux de tête violents ou des vomissements ; ou en cas de diarrhée ou de vomissements importants.

**Consultez le médecin** si la fièvre dépasse 38,5 °C plus de 3 jours ou apparaît après 3 jours de rhume ; si la toux ou le nez bouché ne s’améliorent pas après 10 jours ; s’il a mal à l’oreille ou un écoulement d’oreille ; s’il a les yeux qui collent ou les paupières gonflées ; s’il mange mal ou vomit ; ou si son comportement change et vous inquiète. ${URG}

${FIN}`,
  }),
  a({
    slug: 'apprendre-a-se-moucher-lavage-de-nez-enfant',
    title: 'Apprendre à se moucher et laver le nez d’un enfant qui bouge : le mode d’emploi',
    summary: 'Les gestes du lavage de nez selon l’âge, comment s’y prendre avec un enfant qui se débat et comment lui apprendre à se moucher seul.',
    category: 'sante-enfant', min_age_months: 6, max_age_months: 96,
    tags: ['se moucher', 'lavage de nez', 'sérum physiologique', 'nez bouché', 'rhume', 'mouche-bébé', 'spray eau de mer', 'hygiène'],
    sources: [S.lavageNez, S.rhinoQueFaire, S.gestesBarrieres],
    body_md: `## En bref
- Le **lavage de nez au sérum physiologique** est le geste de base quand le nez est encombré ; il est indolore, même s’il peut être désagréable.
- On utilise des **dosettes unidoses** ou une solution saline en spray, jamais d’eau du robinet ou d’eau minérale.
- À partir de 6 mois, le lavage peut se faire **couché ou assis**, dos contre le parent ; on verse toujours dans la **narine la plus haute**.
- Dès qu’il sait le faire, l’enfant participe : il **se mouche** après le lavage, dans un mouchoir jetable.
- **Jamais de vasoconstricteur** nasal avant 15 ans.

## Comprendre
Un enfant enrhumé respire, mange et dort mieux avec un nez dégagé. L’Assurance Maladie rappelle que le mouche-bébé est moins efficace que le lavage pour désobstruer le nez et qu’il peut irriter la muqueuse s’il est utilisé trop souvent. Le lavage, lui, fait ressortir les sécrétions par l’autre narine ou par la gorge.

Se moucher est un apprentissage : un tout-petit ne sait pas encore souffler par le nez bouche fermée. Les gestes barrières y sont liés : se moucher dans un **mouchoir à usage unique**, le jeter aussitôt dans une poubelle, puis se laver les mains limite la transmission des virus à l’entourage.

## Au quotidien
**Le lavage chez l’enfant à partir de 6 mois (fiche ameli.fr)**
1. Lavez-vous les mains et préparez une dosette neuve.
2. Allongez l’enfant sur le côté, ou asseyez-le dos contre vous, la tête tournée sur le côté.
3. Placez l’embout à l’entrée de la narine la plus haute et pressez doucement : le sérum ressort souvent par l’autre narine avec les sécrétions.
4. Attendez qu’il ait bien avalé et que le nez se soit vidé, puis essuyez avec un mouchoir jetable.
5. Si le nez reste bouché, recommencez de l’autre côté avec une autre dosette, tête tournée dans l’autre sens.

**Avec un enfant qui se débat**
- Si vous êtes seul, asseyez-le entre vos jambes, la tête contre vos cuisses et les bras maintenus sous vos cuisses, puis tournez sa tête sur le côté.
- Expliquez-lui calmement ce que vous allez faire, sans vous précipiter : l’embout ne doit pas le blesser.
- Avec un spray salin, pulvérisez sans trop de pression, nettoyez l’embout à l’eau chaude après usage et réservez le flacon à cet enfant.

**Quand il sait se moucher**
- Faites-le asseoir, tête inclinée sur le côté, et mettez le sérum ou une courte pulvérisation dans la narine la plus haute.
- Demandez-lui de souffler par le nez dans le mouchoir, puis recommencez de l’autre côté.

**Idées pour apprendre à se moucher**
- Montrez l’exemple : mouchez-vous devant lui, une narine après l’autre, en exagérant le geste.
- Jouez à souffler par le nez, bouche fermée, sur une petite plume ou un morceau de papier de soie.
- Gardez des mouchoirs à sa hauteur et une poubelle à couvercle à proximité.
- Félicitez-le de se laver les mains après s’être mouché : c’est un vrai geste barrière.

## Questions fréquentes
**Combien de fois par jour laver le nez ?** Dès que le nez paraît plein de sécrétions, notamment avant les repas et le coucher. Il n’est pas utile de répéter le lavage sur une narine déjà dégagée. Le rythme précis peut être discuté avec le médecin ou le pharmacien.

**Puis-je utiliser de l’eau du robinet ?** Non. L’eau du robinet et l’eau minérale ne sont pas assez salées et peuvent contenir des germes. Utilisez du sérum physiologique ou une solution saline adaptée.

**Il pleure à chaque lavage, est-ce que je lui fais mal ?** Le geste est indolore mais désagréable. Allez doucement, sans forcer, et rassurez-le. Si le nez saigne, s’il pleure de douleur ou si le geste vous paraît impossible, parlez-en au médecin ou au pharmacien qui pourra vous montrer la technique.

**Les sprays « décongestionnants » sont-ils une alternative ?** Les vasoconstricteurs en spray ou en solution nasale sont contre-indiqués chez l’enfant jusqu’à 15 ans, en raison d’effets secondaires possibles graves. Demandez toujours conseil au pharmacien.

## Quand demander conseil
Consultez si le nez bouché ou la toux ne s’améliorent pas après 10 jours, si une fièvre apparaît ou dure, si l’enfant a mal à l’oreille, si ses yeux collent ou si ses paupières gonflent. Appelez sans attendre s’il a du mal à respirer, s’il est très fatigué, somnolent ou ne boit plus. ${URG}

${FIN}`,
  }),
  a({
    slug: 'rhumes-a-repetition-enfant-creche-ecole',
    title: 'Enrhumé tout l’hiver : pourquoi les petits enchaînent les rhumes et ce qui aide',
    summary: 'Crèche, école, fratrie : pourquoi un jeune enfant enchaîne les rhumes, ce qui peut les favoriser et les gestes qui limitent la contagion.',
    category: 'sante-enfant', min_age_months: 6, max_age_months: 96,
    tags: ['rhumes à répétition', 'rhinopharyngite récidivante', 'crèche', 'collectivité', 'immunité', 'végétations', 'tabac', 'prévention'],
    sources: [S.rhinoReco, S.rhinoPrev, S.sfpCollectivites],
    body_md: `## En bref
- Les jeunes enfants tombent souvent malades parce que leur **système immunitaire n’est pas encore mature** ; ces infections courantes participent à son développement.
- Les enfants en **crèche** sont plus souvent enrhumés que ceux gardés à la maison.
- Les infections ORL à répétition s’améliorent le plus souvent **avec l’âge**, et deviennent rares après 6 ans.
- On parle de rhinopharyngite **récidivante** au-delà de 6 épisodes par an : un avis médical est alors utile.
- **Tabac, air sec, pollution** favorisent les rhumes ; le lavage des mains et l’aération limitent la transmission.

## Comprendre
Selon l’Assurance Maladie, la rhinopharyngite est la maladie infectieuse la plus courante de l’enfant, surtout entre 5 mois et 8 ans, principalement en automne et en hiver. Plusieurs virus en sont responsables et l’immunité laissée par chacun est courte : un enfant peut donc enchaîner plusieurs rhumes dans la même saison. Les enfants souvent malades avant 3 ans le sont de moins en moins par la suite, et rarement après 6 ans, le plus souvent sans séquelles.

Certains facteurs favorisent les rhumes : le tabagisme passif, la pollution et l’air sec, qui gênent l’évacuation des sécrétions ; un terrain allergique ; un reflux chez le nourrisson ; la vie en collectivité pendant les épidémies ; une carence en fer ; certaines maladies chroniques.

Au-delà de 6 épisodes par an, on parle de **rhinopharyngite récidivante**. L’enfant peut sembler avoir un « rhume perpétuel », un peu atténué en été. Les végétations peuvent alors grossir : l’enfant respire par la bouche et peut mal dormir.

## Au quotidien
**Limiter la contagion à la maison**
- Lavez-vous les mains au savon environ 30 secondes, avant les repas, avant et après les soins à l’enfant, après les toilettes, les transports et en rentrant à la maison. Lavez aussi les siennes, et gardez ses ongles courts.
- Ne partagez pas biberons, sucettes ni couverts ; lavez-les et séchez-les aussitôt.
- Nettoyez régulièrement jouets et peluches.
- Aérez chaque jour l’ensemble du logement.
- Évitez toute exposition à la fumée de tabac.

**Si un parent est malade**
- Mouchez-vous, toussez et éternuez dans un mouchoir jetable, jeté aussitôt, ou dans le pli du coude.
- Portez un masque jetable auprès d’un bébé.
- Évitez de l’embrasser sur le visage.

**Ce que le médecin peut regarder**
Selon le cas, le médecin peut rechercher et corriger une carence en fer, traiter un reflux ou prendre en charge une allergie. Il vérifie aussi les oreilles, car des rhumes répétés peuvent s’accompagner d’otites.

## Questions fréquentes
**Doit-il rester à la maison à chaque rhume ?** Le guide de la Société française de pédiatrie sur les collectivités de jeunes enfants ne prévoit pas d’éviction pour une rhinopharyngite. La fréquentation peut être déconseillée en phase aiguë si les symptômes sont importants ; c’est au cas par cas, selon le confort de l’enfant et l’avis de la structure.

**Faudrait-il retarder son entrée en crèche ?** L’Assurance Maladie conseille de retarder l’entrée en crèche jusqu’à 3 mois. Au-delà, la décision dépend de votre organisation familiale ; parlez-en avec le médecin si votre enfant a une maladie chronique.

**Ses rhumes à répétition vont-ils abîmer sa santé ?** Ils sont fatigants pour l’enfant comme pour vous, mais ils s’améliorent le plus souvent avec l’âge, sans séquelles. Un suivi médical permet de repérer une complication, comme une otite qui traîne ou une gêne pour respirer la nuit.

**Respirer bouche ouverte la nuit, est-ce un signe à signaler ?** Oui. Un enfant qui respire en permanence par la bouche, ronfle ou dort mal mérite un examen, notamment pour vérifier ses végétations.

## Quand demander conseil
Prenez rendez-vous si votre enfant a plus de 6 rhumes par an, s’il semble enrhumé en permanence, respire par la bouche ou dort mal, s’il a des otites répétées ou si vous vous sentez épuisé par cet enchaînement. Consultez rapidement en cas de fièvre élevée ou qui dure, de mal d’oreille, de gêne respiratoire ou de changement de comportement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ toux
  a({
    slug: 'toux-enfant-seche-ou-grasse-soulager',
    title: 'Toux de l’enfant, sèche ou grasse : comprendre et soulager sans sirop',
    summary: 'La toux est un réflexe de défense : voici comment soulager un enfant qui tousse, ce qu’il vaut mieux éviter et quand la toux doit faire consulter.',
    category: 'sante-enfant', safety_critical: true,
    tags: ['toux', 'toux sèche', 'toux grasse', 'sirop', 'antitussif', 'nuit', 'miel', 'enfant qui tousse'],
    sources: [S.santeToux, S.ameliToux, S.rhinoTraitement],
    body_md: `## En bref
- La toux est un **symptôme**, pas une maladie : c’est un réflexe qui aide à dégager les voies respiratoires.
- **Sèche** (sans glaires) ou **grasse** (avec sécrétions), elle accompagne souvent un rhume, mais aussi d’autres maladies.
- Pas de **sirop contre la toux avant 2 ans** ; après 2 ans, un avis médical ou pharmaceutique est préférable, même pour un produit en vente libre.
- Air humidifié, boissons fréquentes, nez dégagé et absence de tabac sont les premiers soins.
- Une **difficulté à respirer** ou une toux après un étouffement imposent d’appeler le 15.

## Comprendre
Santé.fr rappelle que la toux résulte d’une irritation de la gorge, de la trachée ou des bronches. Elle peut accompagner une rhinopharyngite, une laryngite, une bronchiolite, une pneumonie, de l’asthme, la coqueluche, la rougeole ou la grippe. Elle peut aussi être provoquée par un corps étranger inhalé ou des substances irritantes (fumée, poussière, gaz).

On distingue la toux **sèche**, sans glaires, et la toux **grasse**, avec des sécrétions utiles à l’élimination des microbes. Elle peut être **aiguë**, comme lors d’un rhume, ou **chronique**, par exemple liée à une allergie. Selon l’Assurance Maladie, la toux d’une rhinopharyngite peut durer jusqu’à une dizaine de jours et ne nécessite pas de traitement particulier.

## Au quotidien
**Soulager sans médicament**
- Ne fumez pas à la maison, ni ailleurs en présence de l’enfant, et évitez parfums d’ambiance et aérosols.
- Aérez chaque jour et maintenez la chambre autour de 19-20 °C, avec un air pas trop sec.
- Faites boire souvent, par petites quantités.
- Dégagez le nez avec du sérum physiologique : un nez bouché fait couler les sécrétions dans la gorge.
- La nuit, l’enfant plus grand peut être installé la tête un peu surélevée.
- Le miel peut apaiser la gorge, surtout avant le coucher, mais jamais avant 1 an.
- Dès 3 ans, Santé.fr mentionne l’inhalation de vapeur d’eau chaude ; restez à côté de l’enfant pour éviter toute brûlure.

**Les médicaments contre la toux**
- **Avant 2 ans** : ni antitussif, ni fluidifiant bronchique ; ils sont contre-indiqués.
- **Après 2 ans** : les antitussifs sont réservés aux toux sèches vraiment gênantes, quelques jours seulement, et jamais en cas de toux grasse, car ils favorisent l’accumulation des sécrétions.
- Les antitussifs à base de **codéine** sont contre-indiqués avant 12 ans.
- Les fluidifiants sont rarement indispensables.
- Dans tous les cas, demandez conseil au pharmacien ou au médecin avant d’en donner.

## Questions fréquentes
**Pourquoi tousse-t-il plus la nuit ?** Allongé, l’enfant avale moins bien les sécrétions qui coulent du nez vers la gorge. Laver le nez avant le coucher et surélever légèrement la tête de l’enfant plus grand peut aider.

**Une toux grasse veut-elle dire qu’il a une bronchite ?** Pas forcément. Les sécrétions d’un rhume peuvent rendre la toux grasse. C’est l’ensemble des signes (fièvre, respiration, état général) qui oriente, et le médecin qui pose le diagnostic.

**Faut-il un antibiotique pour arrêter la toux ?** Non, la plupart des toux de l’enfant sont dues à des virus, sur lesquels les antibiotiques n’agissent pas. Seul un médecin peut juger d’une infection bactérienne.

**Au bout de combien de temps s’inquiéter d’une toux qui traîne ?** Consultez si un enfant sans fièvre tousse depuis plus de 8 jours, si la toux s’aggrave, et toujours si elle dure plus de 3 semaines.

## Quand demander conseil
**Appelez le 15 ou le 112** si l’enfant a du mal à respirer ou à avaler, si sa voix s’éteint, si son état se dégrade, si la toux ressemble à un aboiement avec gêne respiratoire, si vous voyez ses ailes du nez battre ou le creux du cou se creuser à chaque inspiration (n’attendez pas qu’il bleuisse), ou si la toux a commencé brutalement après un étouffement (suspicion de corps étranger).

**Consultez dans la journée** pour un bébé de moins de 3 mois qui tousse, une toux avec forte fièvre, mal de gorge ou sifflements, un nourrisson qui tousse et mange mal, ou un enfant au comportement inhabituel. ${URG}

${FIN}`,
  }),
  a({
    slug: 'toux-qui-dure-quintes-coqueluche-enfant',
    title: 'Toux en quintes qui dure : penser à la coqueluche',
    summary: 'Des quintes de toux violentes, parfois suivies d’une reprise bruyante ou de vomissements : les signes qui évoquent la coqueluche et la conduite à tenir.',
    category: 'sante-enfant', safety_critical: true, min_age_months: 0,
    journeys: ['child', 'newborn'],
    tags: ['coqueluche', 'quintes de toux', 'chant du coq', 'toux persistante', 'nourrisson', 'vaccination', 'éviction', 'contagion'],
    sources: [S.coqSymptomes, S.coqQueFaire, S.ameliToux],
    body_md: `## En bref
- La coqueluche est une **infection bactérienne très contagieuse** qui donne des **quintes de toux** pouvant durer plusieurs semaines.
- Elle est **grave chez le nourrisson** de moins de 6 mois, qui n’est pas encore protégé par la vaccination.
- Entre les quintes, l’enfant peut paraître en forme, sans fièvre.
- Une toux en quintes, ou une toux qui dure plus de 7 jours et s’aggrave, justifie de **consulter**.
- Toux chez un bébé de moins de 3 mois, lèvres qui bleuissent ou pauses respiratoires : **urgence**.

## Comprendre
Selon l’Assurance Maladie, la coqueluche est due à la bactérie *Bordetella pertussis*. Elle se transmet par les gouttelettes émises en toussant ou en parlant : une personne malade peut en contaminer de nombreuses autres, dans la famille ou en collectivité. Dans les pays où les enfants sont vaccinés, ce sont souvent des adolescents ou des adultes, dont la protection a diminué, qui contaminent des nourrissons trop jeunes pour être vaccinés.

Le déroulement typique :
- **Incubation** sans symptôme, de 7 jours à 3 semaines.
- **Début** comme un rhume pendant 1 à 2 semaines, parfois avec une fièvre très faible, puis une toux modérée.
- **Phase des quintes** : toux soudaine, violente et répétée, qui coupe le souffle. Le visage peut devenir rouge ou bleuté, de petits points rouges peuvent apparaître autour des yeux, et des vomissements suivent souvent la quinte.
- **Fin de quinte** : longue inspiration bruyante et aiguë, le « chant du coq ».

Les quintes sont souvent plus fréquentes la nuit. Sans traitement, elles durent 4 à 6 semaines, puis la toux régresse lentement. La contagiosité commence dès le rhume et cesse cinq jours après le début d’un antibiotique adapté. La coqueluche peut être attrapée plusieurs fois, car l’immunité diminue avec le temps et la vaccination nécessite des rappels.

## Au quotidien
**Soulager l’enfant malade (conseils ameli.fr)**
- Humidifiez l’air et gardez la chambre à 19-20 °C.
- Ne fumez pas, nulle part dans le logement.
- Faites boire souvent de petites quantités, surtout s’il vomit.
- Proposez de petites quantités de nourriture, plus souvent, et gardez-le en position verticale avant et après les repas.
- Lavez-lui le nez ou mouchez-le si le nez est bouché.
- Ne donnez ni antitussif ni fluidifiant : ils sont inefficaces et peuvent être dangereux.

**Protéger l’entourage**
- Quand le diagnostic est posé, l’enfant reste à la maison et vous prévenez la crèche ou l’école.
- Il reste à domicile 3 à 5 jours après le début de l’antibiotique selon le médicament prescrit, ou 3 semaines après le début de la toux sans antibiotique.
- En cas de suspicion, il reste à la maison tant que le diagnostic n’est pas écarté.
- Pendant cette période, évitez tout contact avec des nourrissons et des personnes mal vaccinées ; lavage des mains et masque pour l’entourage.

## Questions fréquentes
**Mon enfant est vacciné, peut-il quand même l’attraper ?** Oui, c’est possible, car la protection diminue avec le temps et des rappels sont prévus. Vérifiez avec le médecin que son carnet de vaccination est à jour, ainsi que celui des adultes de la maison.

**Un adulte de la maison tousse depuis des semaines et un bébé va arriver, que faire ?** Il doit consulter. Chez l’adulte, la coqueluche est souvent atypique : une toux qui persiste et s’aggrave au-delà d’une semaine doit la faire évoquer.

**Nous avons été en contact avec un enfant malade : faut-il consulter ?** Sans symptôme et avec des vaccinations à jour, l’enfant peut en général continuer à aller à l’école. S’il tousse ou si ses vaccinations ne sont pas à jour, consultez.

**Pourquoi éviter les sirops ?** Les antitussifs et fluidifiants ne raccourcissent pas la coqueluche et peuvent être dangereux. Les mesures de confort et l’antibiotique prescrit, s’il y en a un, sont les seuls traitements utiles.

## Quand demander conseil
**Consultez rapidement, voire aux urgences**, si un nourrisson de moins de 3 mois tousse ; si les lèvres ou le bout des doigts bleuissent pendant les quintes ; s’il fait des pauses respiratoires, même brèves, ou respire vite ou difficilement ; s’il est somnolent, mou, fait un malaise ou des convulsions ; s’il refuse de boire, vomit beaucoup ou semble déshydraté ; ou en cas de forte fièvre.

**Consultez le médecin** pour une toux en quintes, une toux qui dure plus de 7 jours et s’aggrave, une toux chez un bébé de 3 à 6 mois, ou après un contact avec un malade si les vaccinations ne sont pas à jour. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ nez qui saigne
  a({
    slug: 'saignement-de-nez-enfant-bons-gestes',
    title: 'Saignement de nez chez l’enfant : les bons gestes, sans pencher la tête en arrière',
    summary: 'Assis, penché en avant, narines pincées dix minutes : les gestes pour arrêter un saignement de nez chez l’enfant et les signes qui doivent alerter.',
    category: 'premiers-secours', safety_critical: true, min_age_months: 24,
    tags: ['saignement de nez', 'épistaxis', 'nez qui saigne', 'premiers secours', 'compression', 'tête en arrière', 'enfant'],
    sources: [S.epistaxisAmeli, S.epistaxisSante],
    body_md: `## En bref
- Le saignement de nez (épistaxis) vient de petits vaisseaux des fosses nasales. Il est **le plus souvent bénin** et survient aussi souvent chez l’enfant que chez l’adulte.
- Bon réflexe : enfant **assis, légèrement penché en avant**, qui respire par la bouche.
- **Pincer les narines** juste sous la partie osseuse du nez, **10 minutes chronométrées**, sans relâcher pour vérifier.
- **Ne jamais basculer la tête en arrière** : le sang coule dans la gorge, peut être avalé et faire vomir.
- Un saignement abondant par les deux narines, un malaise ou un choc important au visage justifient d’appeler le **15**.

## Comprendre
Le sang peut couler par une ou deux narines, ou descendre dans la gorge et être avalé ou craché. Selon Santé.fr, aucune cause n’est souvent retrouvée chez l’enfant. Une muqueuse fragilisée par un doigt dans le nez, un grattage, un éternuement violent bouche fermée, un rhume, une allergie ou un air trop sec peut saigner facilement.

La coagulation prend du temps : l’Assurance Maladie précise qu’il faut au moins 7 minutes. C’est pourquoi on maintient la pression 10 minutes d’affilée, montre en main, sans lâcher toutes les minutes pour regarder si cela saigne encore.

## Au quotidien
**Pendant le saignement**
1. Gardez votre calme : votre ton rassure l’enfant. Proposez-lui un mouchoir et une bassine ou une serviette sombre.
2. Faites-le **moucher très doucement, une seule fois**, pour évacuer les plus gros caillots.
3. Installez-le **assis**, le corps légèrement penché en avant, le regard vers le sol. Demandez-lui de **respirer par la bouche** et de cracher le sang qui arrive dans la bouche plutôt que de l’avaler.
4. **Pincez les narines** entre le pouce et l’index, juste sous l’os du nez. Un enfant plus grand peut le faire lui-même, guidé par vous.
5. Maintenez **10 minutes chronométrées**. Pour l’occuper : une histoire, une chanson, un dessin animé court.
6. Si le saignement continue, **recommencez 10 minutes**. Du froid (glaçons enveloppés dans un linge) posé au-dessus du nez peut aider à resserrer les vaisseaux.

**Après l’arrêt**
- Pas de mouchage pendant au moins 12 heures, puis délicatement.
- Éternuer et tousser bouche ouverte.
- Ne pas mettre les doigts dans le nez, ne pas gratter les croûtes.
- Humidifier l’air de la maison.
- Éviter les jeux très physiques pendant quelques jours si le saignement a été long.

**À éviter**
- Pencher la tête en arrière ou allonger l’enfant.
- Introduire du coton ou un objet dans la narine.
- Donner de l’aspirine ou un anti-inflammatoire sans avis médical.
- Utiliser des sprays décongestionnants.

## Questions fréquentes
**Il a avalé du sang et vomi, est-ce grave ?** Le sang avalé peut faire vomir ; c’est justement pour cela qu’on penche la tête en avant. Si l’enfant est pâle, en sueur ou fait un malaise, appelez le 15.

**Le saignement reprend le soir, que faire ?** Selon Santé.fr, s’il reprend, l’enfant se mouche doucement pour retirer les caillots, puis on recommence la compression. Si le saignement ne cède pas après une deuxième tentative bien faite, consultez.

**Son nez saigne après une chute ou un coup, que faire ?** Un saignement qui suit un traumatisme du visage ou de la tête justifie un avis médical dans la journée. En cas de traumatisme important de la face, ne comprimez pas et appelez le 15.

**Faut-il emmener l’enfant chez le médecin après chaque saignement ?** Non, si le saignement s’arrête avec les bons gestes et ne se répète pas. Consultez s’ils deviennent fréquents ou abondants.

## Quand demander conseil
**Appelez le 15 ou le 112** si le sang coule abondamment par les deux narines et dans la gorge ; si l’enfant devient pâle, transpire, a le cœur qui bat vite, s’agite ou fait un malaise ; s’il a un trouble de la coagulation ou un traitement qui fluidifie le sang ; ou si le saignement suit un traumatisme grave.

**Consultez dans la journée** si le saignement ne s’arrête pas malgré deux compressions bien faites, s’il est abondant, s’il suit un coup au visage ou à la tête, ou si les saignements se répètent. ${URG}

${FIN}`,
  }),
  a({
    slug: 'saignements-de-nez-a-repetition-enfant-prevenir',
    title: 'Saignements de nez à répétition chez l’enfant : prévenir et savoir quand consulter',
    summary: 'Doigt dans le nez, air sec, rhume : ce qui fragilise le nez des enfants, les gestes de prévention au quotidien et ce que peut proposer le médecin.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['saignement de nez', 'épistaxis', 'à répétition', 'air sec', 'croûtes', 'humidifier', 'ORL', 'cautérisation'],
    sources: [S.epistaxisSante, S.epistaxisAmeli],
    body_md: `## En bref
- Chez l’enfant, les saignements de nez répétés n’ont **souvent pas de cause précise** retrouvée.
- Un **doigt dans le nez**, un mouchage trop fort, un **air sec**, un rhume ou une allergie fragilisent la muqueuse.
- Prévention : **moucher doucement**, une narine à la fois, **humidifier** l’air et la muqueuse, ne pas gratter les croûtes.
- Des saignements **fréquents ou abondants** justifient un avis médical, parfois une consultation ORL.
- Le médecin peut vérifier la coagulation et proposer un geste local si besoin.

## Comprendre
La muqueuse de l’avant du nez est très riche en petits vaisseaux, juste sous la surface. Santé.fr cite parmi les facteurs qui l’abîment : un choc, le grattage, un éternuement violent bouche fermée, le soleil, l’air trop sec, une allergie ou un rhume. Plus rarement, des saignements répétés révèlent une autre cause : trouble de la coagulation, maladie héréditaire des vaisseaux, anomalie de la cloison ou petite tumeur, le plus souvent bénigne, comme le précise l’Assurance Maladie.

Une fois qu’un vaisseau a saigné, une croûte se forme. Si l’enfant la gratte ou se mouche fort, le saignement peut reprendre : un cercle vicieux s’installe parfois, surtout en hiver avec le chauffage.

## Au quotidien
**Protéger la muqueuse**
- Humidifiez les pièces, surtout en hiver ; évitez les chambres surchauffées.
- Humidifiez le nez avec du sérum physiologique, notamment en période de rhume.
- Évitez les longues expositions à un air très froid ou très sec.
- Limitez les sprays décongestionnants, qui ne sont de toute façon pas adaptés à l’enfant.

**Changer quelques habitudes**
- Apprenez-lui à se moucher doucement, une narine à la fois.
- Montrez-lui à éternuer bouche ouverte.
- Gardez ses ongles courts ; proposez-lui un mouchoir plutôt que le doigt quand son nez le gêne.
- Ne grattez pas les croûtes et dites-lui de ne pas y toucher.

**Tenir un petit carnet**
Notez pour chaque saignement la date, la narine concernée, la durée, le contexte (rhume, chaleur, effort, choc, matin au réveil) et ce qui l’a arrêté. Ces informations aident le médecin à repérer une cause ou un déclencheur.

**Avoir les bons gestes prêts**
Enfant assis, penché en avant, narines pincées sous l’os du nez 10 minutes chronométrées, sans pencher la tête en arrière. Après l’arrêt, pas de mouchage pendant plusieurs heures.

## Questions fréquentes
**Saigner souvent du nez, est-ce le signe d’une maladie du sang ?** Le plus souvent non : la plupart des saignements de l’enfant sont liés à une muqueuse fragile. Mais si les saignements sont abondants, très fréquents, ou s’il y a aussi des bleus faciles, des saignements de gencives ou des antécédents familiaux, le médecin pourra demander une prise de sang pour vérifier la coagulation.

**Que peut faire l’ORL ?** Après examen du nez, il peut proposer une cautérisation chimique ou électrique d’un petit vaisseau, sous anesthésie locale, pour les saignements peu abondants venant de l’avant du nez. D’autres techniques existent pour les saignements plus importants.

**Il saigne surtout la nuit, pourquoi ?** L’air de la chambre est souvent sec et chaud, et l’enfant peut se gratter le nez en dormant. Humidifier la chambre et le nez avant le coucher peut aider ; parlez-en au médecin si cela persiste.

**Peut-il continuer le sport ?** Après un saignement long ou difficile à arrêter, l’Assurance Maladie conseille d’éviter les efforts physiques intenses pendant un temps. Demandez au médecin quand reprendre.

## Quand demander conseil
Consultez le médecin traitant si les saignements se répètent, s’ils sont abondants, s’ils ne s’arrêtent pas après 10 minutes de compression malgré plusieurs tentatives, s’ils suivent un choc au visage ou à la tête, ou s’ils s’accompagnent de bleus inhabituels. Appelez le 15 en cas de saignement très abondant par les deux narines, de pâleur, de sueurs ou de malaise. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ peau
  a({
    slug: 'verrues-mains-doigts-enfant',
    title: 'Verrues sur les mains et les doigts de l’enfant : attendre ou traiter ?',
    summary: 'Très fréquentes entre 5 et 15 ans, les verrues disparaissent souvent seules : comment limiter leur extension, les options de traitement et quand consulter.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['verrues', 'verrue vulgaire', 'doigts', 'ongles', 'papillomavirus', 'acide salicylique', 'cryothérapie', 'peau'],
    sources: [S.verruesDef, S.verruesTraitement, S.dermatoVerrues],
    body_md: `## En bref
- Les verrues sont de petites excroissances **bénignes** de la peau dues à un **papillomavirus**.
- Les enfants de **5 à 15 ans** sont les plus touchés : une majorité aura au moins une verrue vulgaire.
- Beaucoup **disparaissent spontanément** en quelques mois, mais certaines persistent des années.
- **Ne pas gratter, ronger ni couper** : cela favorise de nouvelles verrues.
- Les traitements détruisent la verrue mais **pas le virus** : les récidives sont fréquentes.

## Comprendre
Selon l’Assurance Maladie, les verrues dites « communes » ou « vulgaires » sont rondes, rugueuses, en dôme de quelques millimètres. Elles siègent surtout sur les doigts et le dos des mains, parfois autour ou sous les ongles, où elles peuvent être douloureuses et déformer l’ongle. Les virus en cause sur la peau ne provoquent pas de cancer cutané.

Le virus entre par une petite lésion de la peau : écorchure, peau sèche ou abîmée. Il se transmet par contact direct, et l’enfant peut se « contaminer lui-même » en grattant ou en mordillant une verrue. Les ongles rongés autour d’une verrue sont donc une porte d’entrée classique. La Société française de dermatologie (Dermato-Info) précise que serrer la main ou partager un verre ne suffit généralement pas à transmettre une verrue, et qu’il est inutile d’isoler la vaisselle ou le linge de l’enfant.

Côté évolution, Dermato-Info indique qu’environ un tiers des verrues disparaissent en 6 mois et deux tiers en 2 ans. Attendre peut donc être un choix raisonnable si la verrue ne gêne pas l’enfant.

## Au quotidien
**Limiter l’extension**
- Encouragez l’enfant à ne pas toucher, gratter ni mordiller ses verrues.
- Gardez ses ongles courts et aidez-le à ne pas se ronger les ongles autour d’une verrue (occuper ses mains, en parler calmement).
- Lavez-vous les mains, et les siennes, après avoir touché la verrue ou appliqué un produit.
- N’essayez pas de couper, arracher ou brûler une verrue : cela échoue souvent et crée des plaies qui peuvent s’infecter.
- Hydratez les mains sèches ou gercées en hiver.

**Si vous choisissez un traitement en pharmacie**
- Les produits verrucides contiennent de l’acide salicylique et d’autres substances **corrosives**. Ils sont contre-indiqués **avant 2 ans** et ne s’appliquent ni sur le visage, ni sur une peau abîmée.
- Suivez strictement la notice pour ne pas brûler la peau saine autour ; le traitement dure en moyenne 4 à 8 semaines.
- Rangez ces produits dans leur emballage, avec la notice, **hors de portée des enfants**, de préférence en hauteur.
- Demandez conseil au pharmacien pour choisir un produit adapté à l’âge.

**Ce que peut proposer le médecin**
Le diagnostic se fait à l’examen. Selon l’âge, le type et la localisation, il peut proposer la cryothérapie (azote liquide), souvent en plusieurs séances, ou d’autres techniques. Aucune méthode n’a montré de supériorité nette. Santé.fr rappelle que la cryothérapie est douloureuse : le choix se discute avec l’enfant et ses parents.

## Questions fréquentes
**Peut-il aller à l’école avec des verrues ?** Oui. Selon ameli.fr, un enfant porteur de verrues peut continuer à fréquenter l’école ou la crèche en suivant les conseils de prévention.

**Pourquoi la verrue revient-elle après le traitement ?** Le traitement détruit la verrue visible, pas le virus. De nouvelles verrues peuvent apparaître à côté ou ailleurs.

**Les remèdes de grand-mère marchent-ils ?** Les méthodes alternatives n’ont pas fait la preuve de leur efficacité, selon Dermato-Info. Évitez surtout tout ce qui pourrait brûler ou blesser la peau.

## Quand demander conseil
Prenez rendez-vous si la verrue est sur le visage ou près d’un ongle, si elle est douloureuse, se multiplie, change de couleur ou de forme, saigne ou s’ulcère, ou si les soins n’ont pas suffi. Consultez rapidement en cas de brûlure importante ou de signes d’infection après un traitement (rougeur qui s’étend, gonflement, pus). En cas de doute sur la nature d’une lésion, demandez un avis. ${URG}

${FIN}`,
  }),
  a({
    slug: 'verrue-plantaire-enfant-piscine-sport',
    title: 'Verrue plantaire de l’enfant : piscine, sport pieds nus et douleur à la marche',
    summary: 'Comment reconnaître une verrue plantaire, la différencier d’un cor, continuer piscine et sport sans la transmettre, et quand demander un avis.',
    category: 'sante-enfant', min_age_months: 36,
    tags: ['verrue plantaire', 'pied', 'piscine', 'sport', 'judo', 'gymnastique', 'sandales', 'douleur pied'],
    sources: [S.verruesDef, S.verruesQueFaire, S.verrueSante],
    body_md: `## En bref
- Une verrue plantaire se forme sous le pied, surtout sur les **zones d’appui**, et peut être **douloureuse à la marche**.
- Elle est due à un papillomavirus qui profite d’une peau ramollie ou abîmée : **piscines, douches collectives et salles de sport** favorisent sa transmission.
- La **piscine et le sport pieds nus restent possibles**, en couvrant la verrue et en portant des sandales autour des bassins.
- Beaucoup de verrues disparaissent seules, mais cela peut prendre des mois.
- **Ne pas creuser ni inciser** la verrue soi-même.

## Comprendre
L’Assurance Maladie décrit deux formes de verrues plantaires :
- la verrue **unique et profonde**, bien délimitée par un anneau de corne, avec de petits points noirs au centre (de minuscules vaisseaux, qui peuvent la faire saigner) ; elle fait mal à la marche ;
- les verrues **en mosaïque**, multiples et superficielles, regroupées en plaques épaissies, beaucoup moins douloureuses.

Pour la distinguer d’un cor : la verrue fait mal quand on la **pince** entre deux doigts, alors que le cor n’est sensible qu’à la pression ; les petits points noirs et l’interruption des lignes de la peau sont propres à la verrue.

L’eau chaude ramollit la corne des pieds et les surfaces rugueuses autour des bassins favorisent les micro-lésions, d’où la fréquence des verrues plantaires chez les enfants nageurs, judokas ou gymnastes. Selon Santé.fr, plusieurs mois peuvent s’écouler entre la contamination et l’apparition de la verrue.

## Au quotidien
**Pour l’enfant qui a une verrue plantaire (conseils ameli.fr)**
- Couvrez la verrue avec un pansement étanche ou un vernis incolore avant la baignade.
- Faites-lui porter des sandales dans les douches et autour des bassins.
- Ne partagez pas serviettes, chaussettes ni chaussures.
- Séchez bien ses pieds après le sport et la douche, y compris entre les orteils.
- En dehors de la baignade, évitez les pansements adhésifs classiques : leur retrait peut abîmer la peau et favoriser de nouvelles verrues.

**Pour toute la famille**
- Évitez de marcher pieds nus dans les lieux publics, piscines et vestiaires.
- Changez les chaussettes chaque jour et laissez sécher les chaussures de sport.

**Les traitements possibles**
- Des verrucides à base d’acide salicylique existent en pharmacie. Ils sont **corrosifs**, contre-indiqués avant 2 ans, et doivent être appliqués en suivant strictement la notice. Le pharmacien vous aide à choisir.
- Des pansements occlusifs, imperméables, peuvent être laissés plusieurs semaines ; sur une verrue plantaire, ils renforcent l’action du produit associé.
- Santé.fr mentionne qu’un pansement étanche maintenu sur la verrue peut être aussi efficace qu’un traitement plus agressif.
- Si cela ne suffit pas, le médecin, un dermatologue ou un podologue peut proposer d’autres méthodes.

## Questions fréquentes
**Doit-il arrêter la piscine ou le judo ?** Non. Ameli.fr indique que piscine et sports pieds nus restent possibles, à condition de couvrir la verrue et de respecter ces précautions. Prévenez l’encadrant si une protection particulière est demandée.

**La verrue saigne quand il marche, est-ce inquiétant ?** Les petits vaisseaux au centre peuvent saigner. En revanche, une verrue qui s’ulcère, saigne souvent ou ne guérit pas doit être montrée au médecin.

**Peut-on la creuser avec une lime ?** Seul un décapage doux, prévu par la notice du traitement, avec une lime jetable jetée après usage, est envisageable. Ne coupez jamais et n’incisez pas : risque d’infection et de saignement.

## Quand demander conseil
Consultez si la verrue gêne la marche, si elle est très douloureuse, se multiplie, saigne ou s’ulcère, si elle ne disparaît pas après plusieurs mois ou si les soins n’ont pas suffi. Consultez rapidement en cas de brûlure ou de signes d’infection après un traitement : rougeur qui s’étend, gonflement, pus, fièvre. Un enfant diabétique ou immunodéprimé doit voir le médecin avant tout traitement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'molluscum-contagiosum-enfant',
    title: 'Molluscum contagiosum : ces petites « perles » sur la peau de l’enfant',
    summary: 'Petites boules couleur chair avec un creux au centre : comment reconnaître les molluscums, limiter leur extension et savoir quand un traitement se discute.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['molluscum contagiosum', 'boutons', 'perles', 'peau', 'eczéma', 'piscine', 'contagion', 'virus'],
    sources: [S.sfdMolluscum, S.sfpCollectivites],
    body_md: `## En bref
- Le molluscum contagiosum est une **infection virale bénigne** de la peau, fréquente chez les enfants de **2 à 12 ans**.
- Il donne de petites élevures en forme de **perles**, couleur chair ou rosée, avec un **petit creux au centre**, en général ni douloureuses ni prurigineuses.
- Il **guérit spontanément**, le plus souvent sans cicatrice, mais cela peut prendre plusieurs mois, voire 1 à 2 ans.
- Un **traitement n’est pas systématique** : il se discute au cas par cas.
- **Pas d’éviction** de la crèche ou de l’école.

## Comprendre
Selon la Société française de dermatologie, le virus responsable, de la famille des poxvirus, se transmet :
- par contact direct de peau à peau ;
- par **auto-contamination** : l’enfant gratte, touche ou perce une lésion, puis touche une autre zone de son corps ;
- par des objets partagés : serviettes, gants de toilette, vêtements, jouets.

Les lésions mesurent de 1 à 5 mm. De nouvelles peuvent apparaître à côté des premières, ce qui donne l’impression d’une infection qui n’en finit pas. Les enfants qui ont un **eczéma atopique** sont plus exposés, car leur peau est plus fragile et ils se grattent. Chez les personnes immunodéprimées, les lésions peuvent être plus nombreuses et plus grosses.

Une lésion qui devient rouge et sensible n’est pas forcément infectée : la SFD indique que c’est souvent une réaction immunitaire qui **précède la disparition** spontanée.

## Au quotidien
**Limiter l’extension**
- Encouragez l’enfant à ne pas gratter, toucher ni percer les lésions.
- Gardez ses ongles courts.
- Chaque membre de la famille a sa serviette et son gant de toilette.
- Évitez les bains collectifs entre frères et sœurs pendant cette période.
- Lavez-vous les mains après avoir touché les lésions.

**Prendre soin de la peau**
- Hydratez régulièrement la peau, surtout si elle est sèche ou atopique, pour renforcer la barrière cutanée.
- Si un eczéma apparaît autour des lésions, montrez-le au médecin : la SFD recommande de **traiter l’eczéma**, y compris autour des molluscums, car cela limite le grattage. Aucune étude n’a montré que les crèmes prescrites pour l’eczéma favorisent la dissémination.

**Piscine et activités**
Selon la SFD, le risque semble surtout lié aux contacts rapprochés et au partage des serviettes, pas à l’eau elle-même. La baignade reste possible : ne partagez pas ses affaires, couvrez les lésions exposées (vêtement en lycra ou pansement étanche) et hydratez la peau après.

## Questions fréquentes
**Faut-il les enlever ?** Pas forcément. Une simple surveillance suffit souvent. Un traitement peut se discuter en cas de gêne importante (zone visible), d’eczéma autour des lésions, de surinfection, de risque de transmission important dans la famille, ou d’immunodépression. Les options (traitements locaux, curetage sous crème anesthésiante, plus rarement cryothérapie) se choisissent avec l’enfant et ses parents.

**Un antibiotique peut-il les faire disparaître ?** Non. C’est une infection virale. Un antibiotique n’est utile qu’en cas de surinfection bactérienne, diagnostiquée par un médecin.

**Peut-il aller à la crèche ou à l’école ?** Oui. Le guide de la Société française de pédiatrie sur les collectivités de jeunes enfants ne prévoit pas d’éviction. Il recommande le lavage des mains et le nettoyage des surfaces et des jouets.

**Les frères et sœurs vont-ils l’attraper ?** C’est possible, d’où l’intérêt de ne pas partager le linge de toilette et d’éviter les bains ensemble. Un frère ou une sœur qui a de l’eczéma mérite une attention particulière.

## Quand demander conseil
Consultez pour confirmer le diagnostic devant des lésions inhabituelles, et si les lésions deviennent douloureuses, très inflammatoires ou nombreuses, si de l’eczéma apparaît autour, si une lésion suinte ou forme des croûtes jaunâtres (surinfection possible), ou si votre enfant a une maladie qui fragilise ses défenses. ${URG}

${FIN}`,
  }),
  a({
    slug: 'impetigo-enfant-reconnaitre-soigner-contagion',
    title: 'Impétigo de l’enfant : croûtes couleur miel, soins et retour à l’école',
    summary: 'L’impétigo est une infection bactérienne de la peau très contagieuse : le reconnaître, le soigner avec le médecin et éviter qu’il ne s’étende ou se transmette.',
    category: 'sante-enfant', min_age_months: 6,
    tags: ['impétigo', 'croûtes jaunes', 'staphylocoque', 'peau', 'contagion', 'éviction', 'antibiotique', 'école', 'crèche'],
    sources: [S.impetigoSante, S.impetigoPrev, S.impetigoTraitement],
    body_md: `## En bref
- L’impétigo est une **infection bactérienne** de la peau, **très contagieuse**, fréquente chez l’enfant.
- Forme la plus courante : petites cloques qui se rompent et laissent des **croûtes jaunâtres** (couleur miel), souvent autour de la **bouche ou du nez**.
- Il nécessite une **consultation** : le médecin choisit le traitement selon l’étendue.
- **Toilette à l’eau et au savon deux fois par jour**, ongles courts, mains lavées : l’hygiène fait partie du traitement.
- École ou crèche : possible si les lésions sont **couvertes** ; sinon, éviction jusqu’à **72 heures** après le début de l’antibiotique.

## Comprendre
Selon Santé.fr (Antibio’Malin), l’impétigo est dû surtout au staphylocoque doré, parfois à un streptocoque. On distingue :
- l’**impétigo croûteux**, le plus fréquent : petites cloques fragiles, puis lésions suintantes couvertes d’une croûte jaunâtre entourée de rougeur, souvent sur le visage, sans fièvre ;
- l’**impétigo bulleux**, plus rare, surtout chez le nourrisson : grosse ampoule molle, souvent sur le siège ou autour des organes génitaux, parfois avec une petite fièvre.

La bactérie se transmet par les mains, souvent au sein d’une famille ou à l’école. Elle peut déjà être présente dans le nez et pénétrer par une petite blessure. L’impétigo est plus fréquent en été, après une piqûre d’insecte grattée, ou en surinfection d’une maladie qui démange (varicelle, eczéma, herpès, poux, gale).

## Au quotidien
**Les soins à la maison, en plus du traitement prescrit**
- Lavez la peau de l’enfant à l’eau et au savon, de préférence surgras, deux fois par jour, puis rincez bien.
- Il n’est pas utile de désinfecter les lésions à l’alcool ; le médecin dit si un pansement est nécessaire.
- Coupez ses ongles court et empêchez-le, autant que possible, de toucher ses croûtes, de sucer son pouce ou de se ronger les ongles.
- Changez ses sous-vêtements chaque jour et préférez des vêtements amples en coton si le corps est touché.
- Évitez l’exposition prolongée des lésions au soleil.

**Protéger la fratrie et l’entourage**
- Lavez-vous les mains avant et après chaque contact avec l’enfant atteint.
- Ne partagez ni linge de toilette, ni vêtements, ni objets familiers, et lavez les jouets avant de les prêter.
- Limitez autant que possible les contacts rapprochés avec les frères et sœurs.
- Les autres enfants de la maison sont examinés et traités si besoin.

**Collectivité**
- Si les lésions sont peu étendues et peuvent être **protégées par un pansement**, l’enfant peut aller à l’école ou à la crèche.
- Si elles sont trop étendues pour être couvertes, l’éviction est maintenue **72 heures après le début du traitement**.
- Dans tous les cas, prévenez la direction de l’établissement.

## Questions fréquentes
**Quel traitement le médecin peut-il prescrire ?** Pour un impétigo peu étendu, une pommade antibiotique pendant quelques jours, avec les soins d’hygiène. Pour une forme étendue, bulleuse ou chez un enfant fragile, un antibiotique par la bouche. Ne réutilisez pas une ancienne pommade sans avis médical.

**Combien de temps dure-t-il ?** Bien traité, l’impétigo guérit en une quinzaine de jours, sans cicatrice. Les récidives sont possibles, surtout si la bactérie est présente dans le nez.

**Comment éviter qu’il revienne ?** Nettoyez soigneusement toute petite plaie, piqûre ou écorchure ; traitez les maladies de peau qui démangent ; apprenez à l’enfant à bien se laver les mains, dès 2 ans.

## Quand demander conseil
Consultez le médecin ou le pédiatre devant des lésions qui évoquent un impétigo. Consultez **sans tarder** pour un impétigo bulleux chez un bébé de moins de 6 mois, un impétigo avec fièvre, des lésions nombreuses ou qui s’étendent vite, ou si l’enfant semble abattu. Reconsultez si les lésions ne s’améliorent pas sous traitement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ tête
  a({
    slug: 'mal-de-tete-enfant-causes-courantes-soulager',
    title: 'Mal de tête chez l’enfant : les causes courantes et comment le soulager',
    summary: 'Fièvre, fatigue, écrans, vue à corriger : ce qui donne le plus souvent mal à la tête aux enfants, les gestes qui soulagent et quand consulter.',
    category: 'sante-enfant', min_age_months: 36,
    tags: ['mal de tête', 'céphalée', 'maux de tête', 'enfant', 'fièvre', 'vue', 'lunettes', 'écrans', 'sommeil'],
    sources: [S.malTeteDef, S.malTeteCalmer, S.santeMauxTete],
    body_md: `## En bref
- La grande majorité des maux de tête de l’enfant sont des **migraines**, des **céphalées de tension** ou un mélange des deux.
- Ils accompagnent aussi souvent une **infection virale** bénigne avec fièvre (rhume, sinusite, grippe).
- Un **défaut de vue** non corrigé (myopie, astigmatisme, hypermétropie) peut donner des maux de tête.
- Repos au calme, boissons, repas réguliers, sommeil suffisant et pause d’écrans soulagent souvent.
- Les causes graves sont **rares** et s’accompagnent en général d’autres signes : ce sont eux qu’il faut connaître.

## Comprendre
Selon l’Assurance Maladie, chez l’enfant comme chez l’adulte, les céphalées se distinguent par leur mode de début, leur localisation, leur intensité, leurs circonstances et les signes associés.
- La **céphalée de tension** donne une douleur diffuse, modérée, en pression, sans nausées ni vomissements, qui ne s’aggrave pas à l’effort mais augmente avec le stress ou la fatigue.
- La **migraine** de l’enfant est souvent sous-estimée : crises plus courtes que chez l’adulte, douleur souvent des deux côtés ou au front, avec pâleur et troubles digestifs.
- Un mal de tête peut suivre un **épisode de fièvre** lié à un virus ou à une rhinosinusite.
- Les **troubles de la vue** non corrigés peuvent provoquer des céphalées.

Santé.fr cite aussi parmi les facteurs déclenchants le bruit, des lunettes mal adaptées ou absentes, le stress, et l’abus de médicaments contre la douleur, qui peut entretenir des maux de tête.

## Au quotidien
**Pendant le mal de tête**
- Proposez un moment de repos au calme, lumière tamisée, sans écran.
- Faites-le boire.
- Proposez une collation s’il a sauté un repas.
- Un linge frais sur le front peut apaiser.
- Si un médicament paraît utile, le paracétamol est le premier choix chez l’enfant, à la dose adaptée à son poids indiquée par le médecin ou le pharmacien. Un seul médicament à la fois ; pas d’aspirine sans avis médical ; pas d’ibuprofène en cas de varicelle ou de déshydratation.

**Prévenir au quotidien**
- Des horaires de coucher et de lever réguliers, et un sommeil suffisant.
- Des repas à heures régulières, sans sauter le petit-déjeuner.
- Assez d’eau dans la journée, surtout quand il fait chaud ou après le sport.
- Des pauses régulières lors des écrans et du travail scolaire.
- Une activité physique régulière et des moments de détente.
- Un contrôle de la vue s’il plisse les yeux, se rapproche des écrans ou se plaint en fin de journée d’école.

**Tenir un carnet**
Notez la date, l’heure, la durée, ce qu’il faisait, ce qu’il a mangé, son sommeil de la veille et ce qui l’a soulagé. Ce carnet aide le médecin à faire la différence entre migraine, céphalée de tension ou autre cause.

## Questions fréquentes
**Mon enfant a souvent mal à la tête en rentrant de l’école, pourquoi ?** Fatigue, faim, soif, bruit, concentration prolongée ou vue à corriger sont des pistes fréquentes. Un carnet sur deux ou trois semaines et un rendez-vous chez le médecin permettent de faire le point.

**Peut-on lui donner un antidouleur à chaque fois ?** Un usage trop fréquent des médicaments contre la douleur peut entretenir les maux de tête. Si votre enfant en a besoin plusieurs jours par semaine, parlez-en au médecin.

**Faut-il faire un scanner ou une IRM ?** La plupart des maux de tête de l’enfant ne nécessitent pas d’imagerie. C’est le médecin qui juge, après l’examen, si un examen complémentaire est utile.

## Quand demander conseil
**Appelez le 15 ou le 112** pour un mal de tête brutal et violent, avec fièvre et raideur de la nuque, vomissements, somnolence, confusion, troubles de la parole ou de la marche, faiblesse d’un membre, convulsions, ou après un choc violent à la tête.

**Consultez** si les maux de tête sont nouveaux et intenses, s’accompagnent de troubles de la vision ou de vomissements, réveillent l’enfant la nuit, s’aggravent sur des semaines, changent de nature, ou gênent sa vie scolaire. ${URG}

${FIN}`,
  }),
  a({
    slug: 'migraine-enfant-reconnaitre-crise-que-faire',
    title: 'Migraine de l’enfant : reconnaître une crise et l’aider à la traverser',
    summary: 'Pâleur, mal de tête des deux côtés, mal au ventre, vomissements : à quoi ressemble une migraine chez l’enfant et que faire pendant et entre les crises.',
    category: 'sante-enfant', min_age_months: 36, max_age_months: 180,
    tags: ['migraine', 'migraine enfant', 'crise', 'vomissements', 'pâleur', 'mal au ventre', 'facteurs déclenchants', 'sommeil'],
    sources: [S.migraineSymptomes, S.migraineReflexes, S.malTeteDef],
    body_md: `## En bref
- La migraine touche **5 à 10 % des enfants** et elle est souvent sous-estimée.
- Chez l’enfant, la crise est **plus courte**, la douleur est souvent **des deux côtés**, précédée d’une **pâleur**, avec **vomissements ou maux de ventre** fréquents.
- Les anciennes « crises de foie » ou « crises d’acétone » sont aujourd’hui considérées comme de vraies migraines.
- Pendant la crise : **repos au calme et dans le noir**, linge froid sur le front, boissons.
- Un **diagnostic médical** est nécessaire, notamment au début, pour confirmer qu’il s’agit bien d’une migraine.

## Comprendre
Selon l’Assurance Maladie, une crise de migraine associe une douleur modérée à intense, souvent pulsatile, aggravée par l’effort et les mouvements, à des signes comme des nausées, des vomissements, une gêne à la lumière, au bruit ou aux odeurs. Chez l’enfant, la crise dure moins longtemps, la douleur est plus souvent bilatérale ou frontale, une pâleur du visage la précède, et les troubles digestifs sont marqués : ils peuvent même prendre le dessus sur le mal de tête.

Certaines personnes ont une **aura** avant la douleur : troubles visuels, picotements, difficultés à parler, qui s’installent en quelques minutes et disparaissent complètement. La migraine avec aura est moins fréquente que la migraine sans aura.

Les **facteurs déclenchants** cités par ameli.fr : manque ou excès de sommeil, repas sauté, stress ou au contraire relâchement soudain, bruit, lumières clignotantes, odeurs, certains aliments, variations météo. Ils varient d’une personne à l’autre.

## Au quotidien
**Pendant la crise**
- Dès les premiers signes, installez l’enfant allongé dans une pièce **calme et sombre**.
- Posez un **linge froid** sur son front.
- Faites-le **boire**, surtout s’il vomit.
- Prévenez l’école que l’enfant peut avoir besoin de s’isoler un moment à l’infirmerie.
- Si le médecin a prévu un médicament, donnez-le **le plus tôt possible** dans la crise, en suivant sa prescription. Chez l’enfant, il s’agit en général du paracétamol ou, en cas de contre-indication, d’un anti-inflammatoire ; jamais d’aspirine sans avis médical, jamais d’ibuprofène en cas de varicelle. Les comprimés et gélules sont déconseillés avant 6 ans à cause du risque de fausse route.

**Entre les crises : l’hygiène de vie**
- Horaires de sommeil réguliers, en semaine comme le week-end, et durée suffisante.
- Repas réguliers, sans sauter le petit-déjeuner ni le goûter.
- Activité physique régulière, qui aide à espacer les crises.
- Repérage des situations stressantes et moments de détente.
- Pas de régime d’éviction strict : on réduit seulement ce qui déclenche clairement les crises.

**Le carnet de crises**
Notez la date, l’heure, la durée, les signes, ce qui a précédé (sommeil, repas, émotion, écran, sport) et ce qui a soulagé. Apportez-le au médecin : il aide au diagnostic et à l’ajustement du traitement.

## Questions fréquentes
**Mon enfant vomit et a mal au ventre sans fièvre, cela peut-il être une migraine ?** Oui, chez l’enfant les troubles digestifs sont fréquents pendant la crise. Mais d’autres causes sont possibles : seul un médecin peut faire la différence.

**Peut-il aller à l’école le lendemain d’une crise ?** Une crise dure en général quelques heures. Si votre enfant a récupéré, il peut reprendre ses activités ; parlez avec l’école de la possibilité de se reposer au calme si une crise survient en classe.

**Doit-il prendre un traitement de fond ?** Si les crises sont fréquentes ou perturbent sa scolarité, le médecin peut envisager d’autres traitements. Il n’existe pas de traitement qui guérisse définitivement la migraine, mais on peut soulager et espacer les crises.

**Faut-il éviter le chocolat ?** Pas systématiquement. Si vous remarquez qu’un aliment précis déclenche ses crises, limitez-le, sans régime strict.

## Quand demander conseil
Consultez si vous pensez que votre enfant a des migraines, si les crises sont plus fréquentes ou plus fortes, si elles gênent l’école ou les activités, s’il prend des antidouleurs plus de 3 jours par semaine, ou si le traitement ne fonctionne plus. **Appelez le 15 ou le 112** devant un mal de tête brutal et inhabituel, avec fièvre et raideur de nuque, trouble de la conscience, faiblesse d’un côté du corps, troubles de la parole ou convulsions. ${URG}

${FIN}`,
  }),
  a({
    slug: 'mal-de-tete-enfant-signes-alerte-urgence',
    title: 'Mal de tête de l’enfant : les signes d’alerte qui imposent d’appeler le 15',
    summary: 'Fièvre et raideur de nuque, taches qui ne s’effacent pas, choc à la tête, somnolence : les situations où un mal de tête relève de l’urgence.',
    category: 'sante-enfant', safety_critical: true, min_age_months: 12,
    tags: ['mal de tête', 'signes d’alerte', 'méningite', 'purpura', 'raideur de nuque', 'traumatisme crânien', 'urgence', 'monoxyde de carbone'],
    sources: [S.malTeteCalmer, S.meningite, S.fievreEnfant],
    body_md: `## En bref
- La plupart des maux de tête de l’enfant sont bénins ; les causes graves sont **rares**, mais il faut savoir les reconnaître.
- Un mal de tête **brutal, violent, inhabituel**, ou accompagné de **fièvre, raideur de la nuque, vomissements, somnolence** impose d’appeler le **15**.
- Devant un enfant fiévreux et abattu, **déshabillez-le** et regardez sa peau : des **taches qui ne s’effacent pas** à la pression sont une urgence absolue.
- Un mal de tête **après un choc violent** à la tête relève aussi de l’urgence.
- Plusieurs personnes avec mal de tête dans un même logement, surtout le matin : pensez au **monoxyde de carbone**.

## Comprendre
L’Assurance Maladie rappelle que les causes graves de maux de tête (méningite, hémorragie, hypertension dans le crâne, tumeur) s’accompagnent généralement d’**autres symptômes**. Ce sont ces signes associés, plus que l’intensité seule de la douleur, qui orientent.

La **méningite** de l’enfant associe souvent fièvre parfois élevée, maux de tête intenses avec gêne à la lumière et au bruit, nausées ou vomissements, raideur de la nuque (douleur à l’arrière du cou quand il bouge la tête), teint gris ou marbré, grande fatigue, parfois somnolence, confusion ou convulsions. Chez le nourrisson, les signes sont moins typiques : comportement inhabituel, gémissements, pleurs incessants ou somnolence, refus de manger, teint gris, bébé « mou ».

Certaines infections à méningocoque peuvent évoluer très vite avec un **purpura** : des taches rouge vif ou violacées, en forme d’étoile ou de bleus, qui **ne s’effacent pas** quand on appuie dessus.

## Au quotidien
**Le réflexe d’observation**
- Regardez le comportement de votre enfant : joue-t-il, répond-il normalement, peut-il bouger la tête, se plaint-il de la lumière ?
- S’il a de la fièvre et paraît abattu, déshabillez-le entièrement et examinez toute sa peau. Appuyez du doigt sur une tache : si elle ne disparaît pas à la pression, appelez immédiatement le 15.
- Prenez sa température si vous pensez qu’il a de la fièvre.

**En attendant les secours**
- Restez auprès de lui, au calme.
- Notez l’heure d’apparition des signes et préparez son carnet de santé.
- Au téléphone, décrivez précisément ce que vous voyez et suivez les consignes du médecin régulateur.

**Après un choc à la tête**
Surveillez l’enfant dans les heures qui suivent : un mal de tête qui augmente, des vomissements répétés, une somnolence inhabituelle, une confusion ou un comportement étrange justifient d’appeler le 15.

**Penser au monoxyde de carbone**
L’Assurance Maladie cite l’intoxication au monoxyde de carbone parmi les causes de maux de tête, souvent la nuit ou au réveil, avec vertiges, fatigue ou troubles de la vue. Si plusieurs personnes du foyer ont ces signes en même temps, aérez, sortez du logement et appelez le 15 ou le 18.

## Questions fréquentes
**Mon enfant a de la fièvre et mal à la tête, faut-il toujours aller aux urgences ?** Non. Un mal de tête accompagne souvent une infection virale banale. Ce sont la raideur de nuque, les vomissements, l’altération de l’état général, la somnolence ou les taches sur la peau qui doivent faire appeler le 15. En cas de doute, appelez votre médecin ou le 15, qui vous orientera.

**Comment savoir si la nuque est raide ?** L’enfant a mal en penchant la tête en avant, refuse de baisser le menton vers la poitrine ou garde la tête figée. Ne forcez pas le mouvement : décrivez ce que vous observez au médecin.

**Quelle fièvre doit inquiéter ?** Selon ameli.fr, une fièvre au-delà de 40 °C, une fièvre chez un bébé de moins de 3 mois, ou une fièvre avec dégradation de l’état général, maux de tête importants, raideur de nuque ou vomissements nécessitent une consultation en urgence.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** devant un mal de tête soudain et violent, d’intensité maximale d’emblée ; un mal de tête avec fièvre, raideur de nuque et vomissements ; des taches sur la peau qui ne s’effacent pas à la pression ; une somnolence, une confusion, des troubles de la parole ou de la marche, une faiblesse d’un côté ou des convulsions ; un mal de tête après un choc violent à la tête ; un mal de tête avec douleur d’un œil et vision floue.

**Consultez dans la journée** pour un mal de tête nouveau et intense, ou accompagné de vomissements, de troubles de la vision ou d’une grande fatigue. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ gorge et larynx
  a({
    slug: 'mal-de-gorge-enfant-soulager-angine-ou-pas',
    title: 'Mal de gorge de l’enfant : rhume ou angine, et comment le soulager',
    summary: 'Un mal de gorge n’est pas toujours une angine : ce qui oriente, le rôle du test rapide après 3 ans, et les astuces pour faire boire et manger un enfant qui a mal.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['mal de gorge', 'angine', 'pharyngite', 'test rapide', 'streptocoque', 'avaler', 'repas', 'fièvre'],
    sources: [S.angineSante, S.rhinoReco, S.sfpCollectivites],
    body_md: `## En bref
- Un mal de gorge accompagne souvent un **rhume** : il est alors dû à un virus et passe avec lui.
- L’**angine** est une inflammation des amygdales ; elle est le plus souvent **virale**, presque toujours avant 2 ans et demi.
- Après 3 ans, le médecin peut faire un **test rapide** dans la gorge pour savoir si un streptocoque est en cause : seul ce cas justifie un antibiotique.
- Fièvre et mal de gorge sans signe de rhume : **pas d’automédication**, consultez.
- Boissons fraîches, aliments **mous et tièdes**, pas d’aliments acides ou très salés : de quoi l’aider à avaler.

## Comprendre
Selon l’Assurance Maladie, le rhume (rhinopharyngite) enflamme la muqueuse du pharynx : rougeur, gonflement, douleur, qui peuvent gêner l’alimentation chez le petit enfant. Ce mal de gorge accompagne le nez qui coule et la toux, et suit l’évolution du rhume.

L’angine, elle, touche les amygdales. Santé.fr décrit des signes typiques : mal de gorge, difficulté à avaler, fièvre parfois élevée avec frissons, perte d’appétit, parfois maux de tête ou mal au ventre. La plupart des angines sont virales. Chez l’enfant plus grand, environ une sur cinq est due au streptocoque A. C’est pour ce cas que le médecin réalise, à partir de 3 ans, un prélèvement de gorge avec un test rapide : s’il est positif, un antibiotique est prescrit pour éviter de rares complications.

## Au quotidien
**Faire boire et manger malgré la douleur**
- Proposez souvent de l’eau, par petites gorgées, plutôt fraîches.
- Préférez les aliments mous et tièdes : soupes, purées, semoule, compotes, yaourts, glace.
- Évitez les aliments acides (agrumes, jus de fruits acides), très salés ou croquants.
- Ne forcez pas à finir l’assiette : l’hydratation compte davantage que les quantités pendant quelques jours.

**Soulager**
- Le paracétamol peut soulager la douleur et la fièvre, à la dose adaptée au poids indiquée par le médecin ou le pharmacien.
- Selon Santé.fr, des gargarismes d’eau salée peuvent soulager **à partir de 6 ans**, si l’enfant sait les faire sans avaler.
- Les pastilles et sprays pour la gorge ne sont envisageables que chez l’enfant plus grand, après avis du pharmacien, en respectant la notice ; les pastilles sont à éviter chez le petit (risque de fausse route).
- Humidifiez l’air de la chambre en période de chauffage et éloignez l’enfant de la fumée de tabac.

**Collectivité**
Selon le guide de la Société française de pédiatrie, une angine virale n’impose pas d’éviction. Une angine à streptocoque impose une éviction jusqu’à 2 jours après le début de l’antibiotique.

## Questions fréquentes
**Comment savoir si c’est une angine ?** On ne peut pas le savoir à la maison. Un mal de gorge avec nez qui coule et toux évoque plutôt un rhume ; une fièvre avec mal de gorge sans signe de rhume justifie de consulter pour un examen et, après 3 ans, un test.

**Pourquoi le médecin ne fait-il pas de test avant 3 ans ?** Avant cet âge, l’angine est considérée comme virale ; le traitement vise alors la douleur et la fièvre.

**L’antibiotique est prescrit : quand peut-il retourner à l’école ?** Pour une angine à streptocoque, l’enfant peut retourner en collectivité 2 jours après le début de l’antibiotique. Il faut poursuivre le traitement jusqu’au bout, même s’il va mieux.

**Il refuse de manger depuis deux jours, est-ce grave ?** Un appétit réduit est fréquent pendant quelques jours. Ce qui compte, c’est qu’il boive. S’il ne boit plus ou urine moins, consultez sans attendre.

## Quand demander conseil
**Consultez dans la journée** si le mal de gorge est difficile à supporter ou s’accompagne de fièvre, de maux de tête, de vomissements ou d’une gêne pour respirer. **Reconsultez** si les symptômes ne s’améliorent pas après 48 heures de soins. **Appelez le 15 ou le 112** si l’enfant n’arrive plus à avaler sa salive et bave, respire difficilement, ne peut plus boire, ou paraît très abattu. ${URG}

${FIN}`,
  }),
  a({
    slug: 'laryngite-enfant-toux-aboyante-nuit',
    title: 'Laryngite de l’enfant : toux « qui aboie » la nuit, que faire ?',
    summary: 'Voix enrouée, toux rauque, respiration bruyante au milieu de la nuit : comment réagir face à une laryngite et reconnaître les signes qui imposent le 15.',
    category: 'sante-enfant', safety_critical: true, min_age_months: 6, max_age_months: 96,
    tags: ['laryngite', 'toux rauque', 'toux aboyante', 'croup', 'voix cassée', 'respiration bruyante', 'nuit', 'urgence', 'épiglottite'],
    sources: [S.larynxDef, S.larynxReflexes, S.antibioLarynx],
    body_md: `## En bref
- La laryngite est une **inflammation du larynx**, le plus souvent **virale**, qui touche surtout les enfants de **1 à 3 ans**.
- Signes typiques : **voix enrouée**, **toux rauque « aboyante »**, respiration **bruyante** et difficile, souvent **la nuit**.
- Elle relève d’un **examen médical dans la journée**, pas de l’automédication.
- Pendant la crise : **rassurer l’enfant**, le garder **assis**, au calme ; l’agitation aggrave la gêne.
- Lèvres bleues, enfant qui bave et n’avale plus sa salive, enfant de moins de 6 mois : **15 ou 112**.

## Comprendre
Selon l’Assurance Maladie, la laryngite fait le plus souvent suite à un rhume. Le virus provoque un gonflement (œdème) dans le larynx, ce qui rétrécit le passage de l’air et modifie la voix. Le larynx du jeune enfant est proportionnellement plus étroit et sa muqueuse gonfle plus facilement, d’où la fréquence de la laryngite à cet âge. Elle survient toute l’année, avec des pics en automne et au printemps.

Les signes apparaissent souvent un ou deux jours après le début du rhume, **la nuit**, et s’aggravent progressivement : voix rauque, toux aboyante, respiration plus lente et bruyante à l’inspiration, parfois **tirage** (le creux au-dessus du sternum, sous les clavicules ou entre les côtes se creuse à chaque inspiration). La fièvre est en général modérée.

Il ne faut pas la confondre avec l’**épiglottite**, devenue très rare grâce à la vaccination contre *Haemophilus influenzae* : début brutal, fièvre au-delà de 39 °C, enfant qui ne parvient plus à avaler sa salive, bave, respire bouche ouverte et reste assis. C’est une urgence absolue.

## Au quotidien
**Pendant une crise nocturne**
- Restez calme et rassurez votre enfant : la peur et les pleurs augmentent la gêne respiratoire.
- Gardez-le **assis** ou dans vos bras, en position verticale ; ne l’allongez pas s’il respire mal.
- Proposez une activité calme (histoire, câlin, chanson douce).
- Santé.fr mentionne la possibilité de s’installer avec l’enfant dans une salle de bains remplie de vapeur d’eau chaude en cas de toux rauque ; restez avec lui et éloignez-le de l’eau très chaude.
- Observez sa respiration : rythme, bruit, creusement du cou ou entre les côtes, couleur des lèvres.

**Les jours suivants**
- Dégagez le nez : mouchage dans un mouchoir jetable ou lavage au sérum physiologique.
- Faites boire souvent ; maintenez la chambre entre 18 et 20 °C ; aucune fumée de tabac.
- Pour la fièvre ou l’inconfort, le paracétamol est le médicament de référence, à la dose adaptée au poids.
- Pas de sirop contre la toux sans avis médical : la toux est un réflexe de défense.
- Pas d’anti-inflammatoire sans avis médical dans un contexte infectieux ; jamais d’aspirine sans avis médical ; jamais de vasoconstricteur nasal avant 15 ans.
- Le médecin peut prescrire un traitement anti-inflammatoire adapté si besoin.

## Questions fréquentes
**Faut-il des antibiotiques ?** Non dans la grande majorité des cas : la laryngite est virale. Les laryngites bactériennes sont très rares.

**Les crises vont-elles revenir les nuits suivantes ?** C’est possible pendant quelques jours. Si les symptômes persistent au-delà de 2 à 3 jours après un premier examen, ou si la toux s’aggrave avec de la fièvre, reconsultez.

**Comment la prévenir ?** Lavage des mains (apprenez-le à votre enfant dès 2 ans), aération, température de 18 à 20 °C, pas de tabac, pas de partage de sucettes ni de couverts, et des vaccinations à jour, notamment contre *Haemophilus influenzae*.

## Quand demander conseil
**Consultez le jour même** pour une toux rauque avec respiration bruyante chez un enfant en bon état général.

**Appelez immédiatement le 15 ou le 112** si l’enfant a **moins de 6 mois** ; s’il refuse de boire ; s’il est très pâle ; si ses lèvres ou ses doigts bleuissent ; si sa respiration est irrégulière ; s’il est agité, somnolent, confus ou très fatigué ; s’il n’arrive plus à avaler, bave en continu, avec une fièvre au-delà de 39 °C ; s’il ne peut pas rester assis ; ou s’il a une maladie cardiaque ou chronique. Ne l’allongez pas pendant le trajet. ${URG}

${FIN}`,
  }),
  a({
    slug: 'enfant-respire-mal-signes-de-lutte-respiratoire',
    title: 'Mon enfant respire mal : reconnaître les signes de lutte respiratoire',
    summary: 'Respiration rapide, creux entre les côtes, ailes du nez qui battent, lèvres bleues : les signes qui montrent qu’un enfant a du mal à respirer et quoi faire.',
    category: 'premiers-secours', safety_critical: true, min_age_months: 0,
    journeys: ['child', 'newborn'],
    tags: ['difficulté à respirer', 'détresse respiratoire', 'tirage', 'ailes du nez', 'lèvres bleues', 'urgence', 'laryngite', 'fausse route', 'bronchiolite'],
    sources: [S.essoufflement, S.fievreEnfant, S.larynxDef],
    body_md: `## En bref
- Chez l’enfant, une gêne respiratoire peut venir d’une **laryngite**, d’une **bronchiolite** chez le nourrisson, d’une crise d’**asthme** ou d’une **fausse route**.
- **Signes de lutte** : respiration très rapide, **creusement** entre les côtes ou au-dessus du sternum, **battement des ailes du nez**, ventre qui pompe, difficulté à parler ou à téter.
- **Signes d’épuisement** : lèvres ou ongles **bleutés**, sueurs, agitation ou au contraire **somnolence**, pauses respiratoires.
- Devant ces signes : **15 ou 112**, sans attendre que l’enfant bleuisse.
- En attendant : enfant **installé dans la position où il respire le mieux**, souvent assis, au calme.

## Comprendre
L’Assurance Maladie décrit trois situations fréquentes chez l’enfant essoufflé : la **laryngite** (voix enrouée, toux rauque, respiration bruyante), la **bronchiolite** du nourrisson (difficulté à respirer et fièvre, surtout en période d’épidémie) et la **fausse route** au cours d’un repas (toux brutale, puis difficulté à respirer).

Quand respirer devient difficile, le corps compense : c’est la **lutte respiratoire**. On l’observe en regardant l’enfant torse nu :
- une respiration **très rapide**, courte et superficielle ;
- le **tirage** : à chaque inspiration, la peau se creuse entre les côtes, au-dessus du sternum ou des clavicules ;
- le **battement des ailes du nez**, très visible chez le petit ;
- le ventre qui travaille fort, l’enfant qui tend le cou ou se penche en avant ;
- une difficulté à parler, à finir ses phrases, à boire ou à téter.

Si la gêne dure, l’enfant peut s’épuiser : lèvres, ongles ou extrémités bleutés, sueurs, agitation, confusion ou somnolence, pauses respiratoires. C’est une **urgence vitale**.

## Au quotidien
**Observer avant d’agir**
- Découvrez le torse de l’enfant et regardez sa respiration pendant une minute, au calme.
- Écoutez : bruit à l’inspiration (laryngite), sifflement à l’expiration (bronches, asthme), gémissement.
- Regardez sa couleur, son comportement, sa capacité à parler ou à boire.

**Appeler le 15 ou le 112**
- Donnez votre nom, l’adresse exacte (étage, code), l’âge de l’enfant.
- Décrivez ce que vous voyez : rythme, creusement, couleur, état de conscience, heure de début.
- Ne raccrochez pas avant qu’on vous le dise : le médecin régulateur peut vous donner des consignes.
- Pour les personnes sourdes, malentendantes ou ayant du mal à parler, le **114** permet d’alerter par SMS.

**En attendant les secours**
- Installez l’enfant dans la position où il respire le mieux, souvent **assis** ; ne l’allongez pas de force.
- Restez auprès de lui, parlez calmement.
- S’il a un asthme connu et un traitement de crise prescrit, suivez le plan d’action remis par le médecin.
- S’il perd connaissance mais respire, placez-le en **position latérale de sécurité** et signalez-le au 15.

## Questions fréquentes
**Comment compter la respiration ?** Comptez les mouvements du ventre ou de la poitrine pendant une minute, enfant au calme. Le chiffre aide le médecin, mais ce sont surtout les signes de lutte et le comportement qui comptent : ne retardez pas l’appel pour compter.

**Il tousse brutalement après avoir joué avec un petit objet, que faire ?** Une toux sèche, en quintes, apparue brutalement après un étouffement fait suspecter un corps étranger inhalé : appelez le 15, même si la toux se calme ensuite.

**Le nez bouché suffit-il à le gêner ?** Chez le tout-petit, un nez très encombré peut gêner la respiration et les tétées : un lavage de nez aide. Mais si des signes de lutte persistent après le lavage, consultez sans tarder.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** devant tout signe de lutte respiratoire marquée (respiration très rapide, tirage, battement des ailes du nez, impossibilité de parler ou de boire), des lèvres ou des ongles bleutés, des pauses respiratoires, une somnolence ou une agitation inhabituelle, ou une gêne respiratoire après une fausse route.

**Consultez dans la journée** pour une gêne respiratoire légère sans signe de lutte, une respiration sifflante, ou une toux avec fièvre chez un nourrisson. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ yeux
  a({
    slug: 'conjonctivite-enfant-nettoyer-yeux-mettre-collyre',
    title: 'Conjonctivite de l’enfant : nettoyer les yeux et mettre un collyre sans bataille',
    summary: 'Les gestes pratiques pour nettoyer des yeux qui collent, mettre un collyre à un enfant qui bouge et éviter de transmettre la conjonctivite à la famille.',
    category: 'sante-enfant', min_age_months: 12,
    tags: ['conjonctivite', 'yeux qui collent', 'collyre', 'sérum physiologique', 'compresse', 'œil rouge', 'hygiène', 'crèche'],
    sources: [S.collyre, S.conjQueFaire, S.antibioConj],
    body_md: `## En bref
- La conjonctivite est une inflammation de la membrane qui recouvre le blanc de l’œil et l’intérieur des paupières ; chez l’enfant, elle est **souvent virale**.
- Dans tous les cas : **lavages au sérum physiologique** plusieurs fois par jour, avec une **compresse neuve par œil**.
- Les conjonctivites virales et bactériennes sont **contagieuses** : mains lavées avant et après les soins, pas de partage de linge.
- Un collyre antibiotique n’est utile que sur **avis médical** ; pas de collyre aux corticoïdes sans ordonnance.
- Une conjonctivite **n’impose pas d’éviction** de la crèche ou de l’école.

## Comprendre
Selon l’Assurance Maladie, la conjonctivite donne un œil rouge, des démangeaisons, une sensation de sable dans l’œil, un écoulement clair ou épais, des paupières collées au réveil. La forme **virale**, très fréquente chez l’enfant, touche souvent les deux yeux avec des sécrétions claires, parfois en même temps qu’un rhume. La forme **bactérienne**, moins fréquente, commence souvent d’un côté, avec des sécrétions jaunes et épaisses. Il existe aussi des conjonctivites **allergiques** (pollens, animaux) et **irritatives** (chlore, fumée), qui ne sont pas contagieuses.

Santé.fr (Antibio’Malin) rappelle que les antibiotiques ne servent à rien dans les formes virales, allergiques ou irritatives. Chez l’enfant de moins de 2 ans, une conjonctivite doit être vue par un médecin dans la journée.

## Au quotidien
**Nettoyer des yeux qui collent**
1. Lavez-vous les mains à l’eau et au savon.
2. Imbibez une compresse stérile de sérum physiologique (ou d’eau tiède pour décoller les cils le matin).
3. Nettoyez de l’angle interne de l’œil (côté nez) vers l’extérieur, en un seul passage.
4. Prenez une **nouvelle compresse pour chaque passage et pour chaque œil**.
5. Jetez les compresses et relavez-vous les mains.

**Mettre un collyre prescrit (fiche ameli.fr)**
1. Lavez-vous les mains, vérifiez le produit, la date de péremption et la date d’ouverture du flacon (souvent 15 ou 28 jours maximum après ouverture selon la notice).
2. Installez l’enfant assis ou allongé, tête inclinée en arrière, regard vers le plafond.
3. Maintenez son front d’une main et soulevez doucement la paupière supérieure avec le pouce.
4. De l’autre main, tenez le flacon au-dessus de l’œil sans toucher l’embout, et tirez doucement la paupière inférieure avec l’auriculaire pour former une petite poche.
5. Déposez le nombre de gouttes prescrit, relâchez, puis appuyez une dizaine de secondes sur le coin interne de l’œil.
6. Essuyez ce qui coule sur la joue avec un mouchoir propre.

Pour un tout-petit, faites-vous aider pour tenir ses bras, ou enveloppez-le dans une serviette de bain. Une dosette unidose ouverte se jette après usage, et un flacon ne se partage pas entre enfants.

**Éviter la transmission**
- Mains lavées avant et après avoir touché les yeux ; expliquez à l’enfant de ne pas se frotter les yeux.
- Serviette et gant de toilette personnels ; taie d’oreiller changée souvent.
- Pas de partage de jouets portés au visage pendant la phase aiguë.

## Questions fréquentes
**Peut-il aller à la crèche ou à l’école ?** Oui. Selon Santé.fr et le guide de la Société française de pédiatrie, une conjonctivite, virale ou bactérienne, n’impose pas d’éviction. La structure peut vous demander de poursuivre les soins à la maison et d’apporter le traitement si besoin.

**Peut-on réutiliser le collyre d’un frère ou d’une sœur ?** Non. Un flacon ouvert est personnel, se conserve un temps limité et ne convient pas forcément à une autre situation.

**Combien de temps cela dure-t-il ?** La conjonctivite infectieuse guérit le plus souvent en une semaine environ. Consultez si elle persiste au-delà de 6 jours ou s’aggrave.

## Quand demander conseil
**Consultez dans la journée** pour une conjonctivite chez un enfant de moins de 2 ans, un œil gonflé avec fièvre au-delà de 38 °C, un œil rouge et douloureux, une vision floue qui ne s’améliore pas en clignant, une gêne importante à la lumière, ou un produit chimique ou un objet dans l’œil. **Consultez dans les jours qui viennent** si l’écoulement ne cède pas aux lavages. ${URG}

${FIN}`,
  }),
  a({
    slug: 'oeil-rouge-enfant-quand-consulter-urgence',
    title: 'Œil rouge chez l’enfant : quand s’inquiéter et quand consulter vite',
    summary: 'Conjonctivite, poussière, choc, produit ménager : savoir quels signes accompagnant un œil rouge imposent une consultation en urgence chez l’enfant.',
    category: 'sante-enfant', safety_critical: true, min_age_months: 0,
    journeys: ['child', 'newborn'],
    tags: ['œil rouge', 'yeux rouges', 'corps étranger', 'produit chimique dans l’œil', 'vision floue', 'douleur œil', 'urgence ophtalmologique', 'conjonctivite'],
    sources: [S.oeilRouge, S.corpsEtrangerOeil, S.conjReco],
    body_md: `## En bref
- Un œil rouge est le plus souvent une **conjonctivite** ou une **irritation** sans gravité.
- Mais un œil rouge avec **baisse de la vision**, **douleur intense**, **gêne à la lumière**, après un **choc** ou une **projection** relève de l’**urgence ophtalmologique**.
- **Produit chimique** dans l’œil : **rincer immédiatement à l’eau tiède au moins 15 minutes**, puis urgences ophtalmologiques.
- Ne jamais retirer un corps étranger avec un objet rigide (pince, cure-dent).
- Chez le **nourrisson de moins de 2 ans**, un œil rouge qui coule (pus) doit être vu **dans la journée**.

## Comprendre
L’Assurance Maladie rappelle qu’un œil rouge peut révéler d’autres atteintes qu’une conjonctivite : une **kératite** (atteinte de la cornée) qui menace la vision, une **uvéite**, ou plus rarement d’autres maladies de l’œil. Elles se reconnaissent à des signes associés : douleur forte, baisse de vision, gêne à la lumière. Chez l’enfant, les traumatismes et les corps étrangers (sable, poussière, éclaboussure de produit ménager) sont aussi des causes fréquentes.

Le principe d’ameli.fr est simple : **si la vision baisse avec un œil rouge, une consultation ophtalmologique urgente s’impose**. Dans les autres cas, on consulte son médecin ou on applique des soins simples.

## Au quotidien
**Projection de produit chimique (javel, détergent, produit pour lave-vaisselle…)**
1. Empêchez l’enfant de se frotter l’œil.
2. Rincez **immédiatement et abondamment** à l’eau tiède, paupières maintenues ouvertes (idéalement à deux), sous un filet d’eau doux ou avec un récipient propre.
3. Rincez **au moins 15 minutes**, sans interruption.
4. Ne posez ni pansement ni compresse.
5. Rendez-vous ensuite immédiatement aux urgences ophtalmologiques avec l’emballage du produit. En cas de doute ou de malaise, appelez le 15.

**Poussière, sable ou cil**
- Lavez-vous les mains et empêchez l’enfant de frotter.
- Faites-le cligner plusieurs fois, ou rincez doucement avec du sérum physiologique ou de l’eau tiède, sans toucher l’œil.
- Pour l’enfant plus grand, rabattre la paupière supérieure sur l’inférieure permet aux cils de balayer l’œil.
- Si cela ne sort pas, n’insistez pas : consultez.

**Ne jamais faire**
- Utiliser une pince, un coton-tige, un cure-dent ou tout objet rigide.
- Mettre un collyre « qui traîne » ou un collyre aux corticoïdes sans ordonnance.

**Prévenir**
- Rangez produits ménagers et pastilles de lave-vaisselle en hauteur ou sous clé.
- Lunettes de protection pour l’enfant qui bricole avec vous ; pas de pistolets à billes ou jouets projectiles inadaptés.
- Lunettes de soleil adaptées et lunettes de natation si le chlore l’irrite.

## Questions fréquentes
**Une tache rouge vif sur le blanc de l’œil, sans douleur : est-ce grave ?** Il peut s’agir d’une petite hémorragie sous la conjonctive, qui se résorbe le plus souvent seule en 10 à 20 jours. Chez l’enfant, montrez-la au médecin, surtout si elle suit un choc ou se répète.

**Après le retrait d’une poussière, il dit encore sentir quelque chose : que faire ?** Une sensation de frottement peut persister un peu. Si la douleur, la rougeur ou le larmoiement continuent, ou si la poussière semble toujours là, consultez un ophtalmologiste.

**L’œil est rouge et la paupière gonflée avec de la fièvre : est-ce une conjonctivite ?** Un œil gonflé avec fièvre au-delà de 38 °C doit être vu dans la journée par un ophtalmologiste ou un médecin.

## Quand demander conseil
**Urgences ophtalmologiques ou 15** après un choc à l’œil, une projection de liquide ou d’objet, un corps étranger coincé ou planté, une plaie de l’œil ; en cas de baisse soudaine de la vision, de vision floue, de gêne forte à la lumière, de douleur intense, ou de maux de tête, vomissements ou fièvre associés.

**Dans la journée** : nourrisson de moins de 2 ans avec un œil rouge qui coule, œil gonflé avec fièvre. **Dans les jours qui viennent** : rougeur qui ne s’améliore pas, cause inconnue, écoulement persistant, réaction à un produit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'orgelet-chalazion-enfant-paupiere',
    title: 'Orgelet ou chalazion : la petite boule sur la paupière de l’enfant',
    summary: 'Comment reconnaître un orgelet, le différencier d’un chalazion, le soigner avec des compresses tièdes sans le percer, et quand consulter.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['orgelet', 'compère-loriot', 'chalazion', 'paupière gonflée', 'bouton sur l’œil', 'compresse chaude', 'yeux', 'enfant'],
    sources: [S.orgeletReco, S.orgeletReflexes, S.orgeletConsult],
    body_md: `## En bref
- L’**orgelet** (ou « compère-loriot ») est une petite **infection** à la racine d’un cil : une bosse rouge et douloureuse au bord de la paupière, avec souvent une pointe blanche.
- Il **guérit le plus souvent seul** en quelques jours, aidé par des soins simples.
- **Ne pas percer, ne pas presser, ne pas frotter** ; mains lavées avant chaque soin.
- **Compresses tièdes** quelques minutes, plusieurs fois par jour, en vérifiant bien la température chez l’enfant.
- Le **chalazion** est différent : une glande bouchée, non infectieuse, qui forme une boule dans l’épaisseur de la paupière.

## Comprendre
Selon l’Assurance Maladie, l’orgelet est une sorte de furoncle qui se développe à partir du follicule d’un cil, le plus souvent à cause d’un staphylocoque. Le bord de la paupière rougit et gonfle, une bosse très douloureuse apparaît à la base des cils avec une pointe de pus, et l’œil peut gratter ou être sensible à la lumière. En général, la poche de pus s’ouvre au bout de quelques jours et l’orgelet guérit.

L’habitude de **se frotter les yeux** favorise les orgelets, tout comme une sécheresse oculaire, le maquillage des yeux chez l’adolescente, ou certaines maladies qui fragilisent les défenses.

Le **chalazion** est une réaction inflammatoire liée à l’obstruction d’une glande de la paupière (glande de Meibomius) qui lubrifie l’œil. La glande gonfle et forme une petite boule, située plus en retrait du bord de la paupière, côté peau ou côté intérieur. Son traitement relève du médecin (pommade, massage, parfois petite intervention).

## Au quotidien
**Les soins de l’orgelet (fiche ameli.fr)**
- Lavez-vous les mains à l’eau et au savon avant de toucher l’œil de l’enfant.
- Nettoyez les paupières plusieurs fois par jour avec du sérum physiologique stérile en dosettes unidoses.
- Appliquez une compresse stérile imbibée d’eau chaude sur l’œil fermé, quelques minutes, trois à quatre fois par jour : cela aide à réduire l’inflammation et à drainer le pus. **Testez d’abord la température sur l’intérieur de votre poignet** pour éviter toute brûlure.
- Ne percez pas, ne pressez pas l’orgelet et empêchez l’enfant de se frotter l’œil.
- N’utilisez ni collyre ni pommade antibiotique pour les yeux sans avis médical.
- Si l’enfant a mal, demandez au médecin ou au pharmacien quel antidouleur donner et à quelle dose selon son poids. Évitez les anti-inflammatoires dans ce contexte infectieux.

**Pour faire accepter la compresse**
- Proposez-la pendant une histoire ou un dessin animé court.
- Laissez l’enfant tenir lui-même la compresse s’il est assez grand.

**Prévenir les récidives**
- Apprenez-lui à ne pas se frotter les yeux et à se laver les mains souvent.
- Serviette de toilette personnelle ; ne pas partager avec une personne qui a un orgelet, un furoncle ou un impétigo.
- Pour l’adolescente qui se maquille : démaquillage chaque soir, produits personnels renouvelés régulièrement.
- Lentilles de contact : hygiène stricte, et pas de port tant que l’orgelet n’est pas guéri.

## Questions fréquentes
**Est-ce contagieux ?** L’orgelet est une infection bactérienne : par précaution, lavez-vous les mains et ne partagez pas les serviettes, comme le conseille ameli.fr.

**Comment faire la différence avec un chalazion ?** L’orgelet est au ras des cils, rouge, douloureux, avec une pointe blanche. Le chalazion est une boule plus ferme dans l’épaisseur de la paupière. En cas de doute, le médecin fera la différence.

**Il en fait souvent, pourquoi ?** Le frottement des yeux, une sécheresse, une peau grasse des paupières ou une fragilité des défenses peuvent être en cause. Des orgelets à répétition justifient une consultation.

## Quand demander conseil
Consultez si la douleur est très forte, si la paupière est très gonflée, si l’enfant a de la fièvre, si l’œil devient rouge ou la vision trouble, si la pointe blanche ne s’ouvre pas seule, si l’orgelet dure plus de deux semaines malgré les soins, ou s’il revient régulièrement. Un gonflement de la paupière qui s’étend, rouge et chaud, avec fièvre, doit être vu rapidement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ grippe et virus de l’hiver
  a({
    slug: 'grippe-enfant-reconnaitre-soigner-surveiller',
    title: 'Grippe chez l’enfant : la reconnaître, le soigner et surveiller les complications',
    summary: 'Forte fièvre, courbatures, grande fatigue : comment se manifeste la grippe chez l’enfant, comment l’accompagner à la maison et quand consulter.',
    category: 'sante-enfant', safety_critical: true, min_age_months: 6,
    tags: ['grippe', 'virus', 'fièvre', 'courbatures', 'fatigue', 'toux', 'épidémie', 'contagion', 'hiver'],
    sources: [S.grippeReco, S.santeGrippe, S.fievreEnfant],
    body_md: `## En bref
- La grippe est une infection virale saisonnière, de **novembre à avril** en général ; les enfants y jouent un grand rôle dans la circulation du virus.
- Elle commence **brutalement** : forte fièvre autour de 39 °C avec frissons, grande fatigue, courbatures, maux de tête, puis toux sèche.
- Chez l’enfant, la **contagion** peut durer **jusqu’à 7 jours** après le début des symptômes.
- Les soins : **repos, boissons, confort** ; pas d’aspirine chez l’enfant ; pas d’antibiotique contre le virus.
- Un **nourrisson de moins de 6 mois** est particulièrement fragile face à la grippe.

## Comprendre
Selon l’Assurance Maladie, les symptômes apparaissent en moyenne dans les 48 heures après la contamination : forte fièvre avec frissons, fatigue intense, abattement, perte d’appétit, douleurs musculaires et articulaires, maux de tête, et une toux sèche qui arrive après les autres signes. Chez une personne en bonne santé, la guérison survient en une semaine environ, mais la **fatigue peut durer 3 à 4 semaines** et la toux deux semaines.

Le virus se transmet par les gouttelettes émises en toussant ou en éternuant, et par les objets touchés (poignées, jouets, téléphone). Santé.fr précise que les enfants de moins de 15 ans représentent une part importante des cas chaque hiver.

Des complications sont possibles : surinfection bactérienne (otite, sinusite, pneumonie), aggravation d’une maladie chronique (asthme, diabète, maladie cardiaque), et plus rarement des formes graves. Les **nourrissons de moins de 6 mois**, qui ne peuvent pas être vaccinés, font souvent des formes sévères nécessitant une hospitalisation.

## Au quotidien
**Accompagner l’enfant malade**
- Repos : laissez-le dormir et proposez des activités calmes.
- Hydratation : proposez souvent de l’eau ou une boisson qu’il aime, même s’il ne réclame pas.
- Chambre fraîche et aérée, enfant pas trop couvert, sans le déshabiller entièrement.
- Pas de bain nettement plus froid que sa température.
- Pour la fièvre mal supportée ou les courbatures, le paracétamol est le médicament de référence, à la dose adaptée à son poids. **Jamais d’aspirine** chez l’enfant sans avis médical.
- Des antiviraux peuvent être prescrits par le médecin dans certaines situations ; ils sont plus utiles s’ils sont pris dans les 48 heures.

**Protéger la famille**
- Gardez l’enfant à la maison tant qu’il est fébrile et fatigué.
- Lavage des mains fréquent, mouchoirs jetables, aération quotidienne.
- Masque pour les adultes malades, surtout auprès d’un bébé ; masque possible pour l’enfant à partir de 6 ans.
- Évitez les visites aux personnes fragiles et le contact avec un nourrisson.

## Questions fréquentes
**Grippe ou rhume, comment faire la différence ?** La grippe commence brutalement, avec une forte fièvre, des courbatures et une grande fatigue qui « mettent au lit ». Le rhume donne surtout un nez qui coule et une fièvre modérée. Grippe et Covid-19 peuvent se ressembler : le médecin peut demander un test.

**Faut-il des antibiotiques ?** Non contre la grippe elle-même, qui est virale. Ils ne sont utiles qu’en cas de surinfection bactérienne diagnostiquée.

**Quand peut-il retourner à l’école ?** Quand la fièvre a disparu et qu’il a retrouvé assez d’énergie. Il peut rester fatigué quelques semaines : prévoyez un rythme plus doux.

**Peut-on l’éviter ?** La vaccination est proposée chaque année aux enfants de 2 à 17 ans et recommandée pour ceux qui ont certaines maladies. Les gestes barrières complètent la protection.

## Quand demander conseil
**Appelez le 15 ou le 112** si l’enfant a du mal à respirer (respiration rapide, creusement entre les côtes, ailes du nez qui battent, pauses), s’il est somnolent, répond mal ou a le teint marbré, s’il a des maux de tête importants avec raideur de la nuque ou vomissements, s’il fait des convulsions, ou s’il présente des signes de déshydratation.

**Consultez dans la journée** pour un bébé de moins de 3 mois fiévreux (en urgence), une fièvre au-delà de 40 °C, une fièvre de plus de 3 jours, une fièvre qui revient après une amélioration, un mal d’oreille, ou si votre enfant a une maladie chronique. ${URG}

${FIN}`,
  }),
  a({
    slug: 'vaccin-grippe-enfant-2-17-ans-questions',
    title: 'Vaccin contre la grippe pour les enfants : pour qui, où et comment ?',
    summary: 'Depuis la recommandation de la HAS, la vaccination antigrippale peut être proposée à tous les enfants de 2 à 17 ans : qui est concerné, remboursement, qui peut vacciner.',
    category: 'sante-enfant', min_age_months: 6, max_age_months: 216,
    tags: ['vaccin grippe', 'vaccination', 'grippe', '2 à 17 ans', 'enfant à risque', 'asthme', 'remboursement', 'bon de prise en charge', 'pharmacien'],
    sources: [S.vaccinGrippe, S.grippePrev, S.grippeReco],
    body_md: `## En bref
- La vaccination contre la grippe peut être **proposée chaque année à tous les enfants de 2 à 17 ans**, même en bonne santé.
- Elle est **recommandée** dès **6 mois** pour les enfants atteints de certaines **maladies chroniques** (asthme, maladie cardiaque, diabète, obésité…).
- Les **bébés de moins de 6 mois** ne sont pas vaccinés : ils sont protégés par la vaccination de leur mère pendant la grossesse et par celle de leur entourage.
- Remboursement à **65 %** pour les 2-17 ans sans maladie à risque ; **100 %** pour les enfants à risque, avec un bon de prise en charge.
- Avant 11 ans, la prescription se fait par un **médecin ou une sage-femme**.

## Comprendre
La grippe touche beaucoup d’enfants chaque hiver, et ils contribuent fortement à la circulation du virus. C’est pourquoi la Haute Autorité de santé a recommandé d’ouvrir la vaccination à l’ensemble des enfants de 2 à 17 ans, comme le rappellent l’Assurance Maladie et Vaccination Info Service.

Le vaccin est mis à jour chaque année selon les virus attendus : il faut donc le refaire **chaque automne**. Selon ameli.fr, il contient des fractions de virus inactivés et **ne peut pas donner la grippe**. La protection s’installe environ deux semaines après l’injection. Il réduit le risque de formes graves et de complications, sans empêcher toujours la maladie.

**Les enfants pour qui la vaccination est recommandée dès 6 mois** (Vaccination Info Service) : maladies respiratoires (asthme, mucoviscidose…), cardiaques (cardiopathie congénitale, insuffisance cardiaque…), neurologiques ou neuromusculaires graves, rénales ou hépatiques chroniques, métaboliques (diabète, obésité), déficits immunitaires, cancers, greffes, infection par le VIH, drépanocytose.

## Au quotidien
**Organiser la vaccination**
- **Avant 11 ans** : la prescription est faite par un médecin ou une sage-femme. L’injection est réalisée par le médecin, la sage-femme, ou un infirmier sur prescription.
- **À partir de 11 ans** : un infirmier ou un pharmacien formé peut aussi prescrire et vacciner.
- La vaccination est notée dans le carnet de santé ou dans Mon espace santé.
- Le professionnel précise le schéma adapté à l’âge de l’enfant et à ses vaccinations antérieures.

**Côté remboursement**
- Enfant de 2 à 17 ans sans maladie à risque : vaccin remboursé à 65 %, sans bon envoyé par l’Assurance Maladie.
- Enfant à risque : vaccin pris en charge à 100 %, avec un bon délivré par un médecin, une sage-femme, un infirmier ou un pharmacien.

**Le jour de l’injection**
- Si l’enfant a de la fièvre ou une maladie aiguë, la vaccination est reportée.
- Signalez toute allergie connue, notamment aux œufs ou aux protéines de poulet, ou une réaction lors d’un vaccin précédent.
- Les effets secondaires sont en général bénins et passagers : douleur ou rougeur au point d’injection, courbatures, maux de tête, petite fièvre.

**Préparer l’enfant**
Expliquez-lui simplement ce qui va se passer, sans promettre « que ça ne fera pas mal ». Un doudou, un câlin, une distraction (chanson, bulle de savon) aident souvent.

## Questions fréquentes
**Mon enfant est en bonne santé, est-ce utile ?** La vaccination peut lui être proposée, c’est un choix à discuter avec son médecin. Elle le protège et limite aussi la transmission à la famille, notamment aux bébés et aux personnes fragiles.

**J’attends un bébé, qui doit se faire vacciner ?** La vaccination est recommandée pendant la grossesse, à tout stade : elle protège la mère et le bébé jusqu’à ses 6 mois. Si le nourrisson a un facteur de risque (prématurité, maladie cardiaque, pulmonaire…), la vaccination de son entourage est recommandée.

**Les traitements homéopathiques remplacent-ils le vaccin ?** Non. Ameli.fr précise qu’ils ne sont pas des vaccins.

**Le vaccin protège-t-il contre les autres virus de l’hiver ?** Non, il cible la grippe. Les gestes barrières restent utiles contre les rhumes, la bronchiolite ou la gastro-entérite.

## Quand demander conseil
Parlez de la vaccination avec le médecin, la sage-femme ou le pharmacien dès l’automne, surtout si votre enfant a une maladie chronique. Consultez après la vaccination en cas de réaction inhabituelle ou de fièvre qui dure. Une réaction allergique grave est exceptionnelle : gonflement du visage, difficulté à respirer ou malaise imposent d’appeler le 15. ${URG}

${FIN}`,
  }),
  a({
    slug: 'gestes-barrieres-enfant-virus-hiver-apprendre',
    title: 'Gestes barrières : les apprendre aux enfants pour passer l’hiver',
    summary: 'Se laver les mains, tousser dans son coude, se moucher dans un mouchoir jetable, aérer : comment transmettre ces réflexes aux enfants de façon ludique.',
    category: 'sante-enfant', min_age_months: 24,
    tags: ['gestes barrières', 'lavage des mains', 'tousser dans son coude', 'mouchoir', 'masque enfant', 'aération', 'virus de l’hiver', 'école'],
    sources: [S.gestesBarrieres, S.gestesEnfants, S.rhinoPrev],
    body_md: `## En bref
- Les gestes barrières **s’apprennent dès le plus jeune âge** : ils protègent l’enfant et son entourage contre les virus respiratoires, et aussi contre la gastro-entérite.
- **Lavage des mains** à l’eau et au savon pendant **au moins 30 secondes**, aux moments clés de la journée.
- **Tousser et éternuer dans le pli du coude** ; se moucher dans un **mouchoir à usage unique**, jeté aussitôt.
- **Aérer** chaque pièce 5 à 10 minutes par jour, quel que soit le temps.
- Les enfants **à partir de 6 ans** peuvent porter un masque.

## Comprendre
Santé.fr rappelle que l’idée selon laquelle « les enfants n’ont pas besoin des gestes barrières » est fausse : ces gestes sont essentiels dès le plus jeune âge et s’apprennent facilement. Les enfants transmettent eux aussi les virus de l’hiver.

Selon l’Assurance Maladie, les virus passent surtout par les mains, qui touchent des surfaces puis le visage, et par les gouttelettes projetées en toussant ou en éternuant. Les sécrétions du nez contiennent beaucoup de virus, qui peuvent survivre plusieurs heures sur un mouchoir. Dans une pièce fermée, des gouttelettes peuvent rester en suspension longtemps : d’où l’importance d’aérer.

## Au quotidien
**Le lavage des mains**
- **Quand** : en arrivant à l’école et en rentrant à la maison, avant et après les repas, après les toilettes, après s’être mouché ou avoir toussé, après les transports, après avoir joué dehors ou caressé un animal, avant de rendre visite à une personne fragile.
- **Comment** : savon, puis frotter paumes, dos des mains, entre les doigts, bout des doigts et ongles, poignets, au moins 30 secondes ; rincer ; sécher avec une serviette propre.
- **Astuce** : chanter deux fois « Joyeux anniversaire » ou une comptine qui dure 30 secondes ; un marchepied stable devant le lavabo aide le petit à le faire seul.
- La solution hydroalcoolique dépanne hors de la maison, sur des mains non visiblement sales ; gardez le flacon hors de portée des petits.
- Gardez les ongles courts.

**Tousser, éternuer, se moucher**
- Jouez à « faire le vampire » : tousser ou éternuer dans le pli du coude.
- Mouchoirs à sa hauteur, poubelle à couvercle à proximité, et mains lavées après.
- Montrez l’exemple : les enfants imitent les adultes.

**À la maison**
- Ouvrez grand les fenêtres 5 à 10 minutes chaque jour, davantage en période d’épidémie ; ouvrir deux fenêtres opposées crée un courant d’air efficace.
- Ne partagez pas couverts, gourdes, sucettes ; lavez régulièrement jouets et peluches.
- Pas de fumée de tabac à l’intérieur.

**Quand quelqu’un est malade**
- Un adulte malade porte un masque, surtout auprès d’un bébé ou d’une personne fragile, jusqu’à 48 heures après la fin des symptômes.
- Un enfant de 6 ans et plus peut porter un masque adapté à sa taille ; montrez-lui comment le mettre et l’enlever par les élastiques.
- On évite les bisous et les câlins visage contre visage avec un nourrisson.

## Questions fréquentes
**Mon enfant de 3 ans oublie toujours, comment faire ?** Associez le lavage des mains à des moments fixes de la routine (avant le goûter, au retour de l’école) et félicitez-le. Un petit tableau avec des images peut l’aider à s’en souvenir.

**Le gel hydroalcoolique est-il adapté aux petits ?** Il dépanne en dehors de la maison, mais le savon reste la référence. Surveillez son utilisation pour qu’il ne porte pas ses mains à la bouche ou aux yeux juste après, et rangez le flacon hors de portée.

**Faut-il éviter les lieux publics avec un bébé l’hiver ?** L’Assurance Maladie conseille d’éviter les lieux publics très fréquentés avec un nourrisson de moins de 3 mois, surtout pendant les épidémies.

## Quand demander conseil
Parlez-en au médecin si votre enfant enchaîne les infections, si vous accueillez un nourrisson ou une personne fragile à la maison, ou si votre enfant a une maladie chronique (la vaccination contre la grippe peut alors être recommandée). Consultez rapidement en cas de fièvre élevée, de difficulté à respirer, de signes de déshydratation ou de changement de comportement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'enfant-malade-creche-ecole-eviction-quand-garder',
    title: 'Enfant malade : crèche ou école, quand faut-il le garder à la maison ?',
    summary: 'Rhume, conjonctivite, impétigo, angine, coqueluche : les maladies qui imposent une éviction de la collectivité et celles qui ne l’imposent pas, selon les repères officiels.',
    category: 'ecole-garde', min_age_months: 3, max_age_months: 144,
    journeys: ['child', 'newborn'],
    tags: ['éviction', 'crèche', 'école', 'enfant malade', 'collectivité', 'contagion', 'impétigo', 'angine', 'coqueluche', 'conjonctivite'],
    sources: [S.sfpCollectivites, S.coqQueFaire, S.impetigoTraitement],
    body_md: `## En bref
- L’**éviction** (interdiction temporaire de collectivité) ne concerne qu’un **petit nombre de maladies** et se décide sur **avis médical**.
- Pour la plupart des petits maux (rhume, conjonctivite, bouton de fièvre, molluscum, verrues), **pas d’éviction** : c’est le **confort de l’enfant** qui guide.
- **Impétigo** : éviction seulement si les lésions ne peuvent pas être couvertes, jusqu’à **72 heures** après le début du traitement.
- **Angine à streptocoque** : retour **2 jours** après le début de l’antibiotique. **Coqueluche** : retour **3 à 5 jours** après le début de l’antibiotique selon le médicament.
- Dans tous les cas, **prévenez la structure** d’une maladie contagieuse.

## Comprendre
Le guide pratique « Collectivités de jeunes enfants et maladies infectieuses », conçu par la Société française de pédiatrie avec la Direction générale de la santé et l’Assurance Maladie, pose un principe : l’éviction est une **obligation réglementaire réservée à quelques maladies**. Pour les autres, la fréquentation de la collectivité pendant la phase aiguë est simplement **déconseillée si les symptômes sont importants**, et la décision se prend au cas par cas, en fonction du confort de l’enfant.

Ce guide date de 2006 ; certaines durées ont été précisées depuis par l’Assurance Maladie, notamment pour la coqueluche et l’impétigo. Le règlement de fonctionnement de votre crèche peut aussi prévoir ses propres modalités : renseignez-vous auprès de la direction.

## Au quotidien
**Pas d’éviction (selon le guide SFP et ameli.fr)**
- **Rhume (rhinopharyngite)** : lavages de nez, mouchoirs jetables, lavage des mains.
- **Conjonctivite**, virale ou bactérienne : une compresse neuve par œil, mains lavées avant et après les soins.
- **Grippe** : pas d’éviction réglementaire, mais l’enfant fiévreux et épuisé est mieux à la maison.
- **Bouton de fièvre (herpès)** : lavage des mains ; protéger les lésions près d’enfants qui ont de l’eczéma.
- **Molluscum contagiosum** : lavage des mains, nettoyage des jouets et des surfaces.
- **Verrues** : l’enfant continue à aller à l’école en suivant les conseils de prévention.
- **Angine virale**.

**Éviction**
- **Impétigo** : pas d’éviction si les lésions peuvent être protégées par un pansement ; sinon, éviction maintenue **72 heures après le début du traitement**. À signaler à la direction.
- **Angine à streptocoque A** : éviction jusqu’à **2 jours après le début de l’antibiotique**.
- **Coqueluche** : l’enfant reste à la maison **3 à 5 jours après le début de l’antibiotique** selon le médicament prescrit, ou **3 semaines après le début de la toux** sans antibiotique. En cas de suspicion, il reste à la maison tant que le diagnostic n’est pas écarté.

**Garder son enfant même sans éviction**
Un enfant fiévreux, très fatigué, qui ne mange pas, tousse beaucoup ou a besoin d’une surveillance rapprochée sera plus à l’aise à la maison. Le personnel peut aussi vous appeler si l’état de votre enfant change dans la journée.

## Questions fréquentes
**La crèche refuse mon enfant enrhumé, est-ce possible ?** Le rhume n’est pas une maladie à éviction selon le guide SFP, mais la structure peut estimer que l’état de l’enfant ne permet pas un accueil confortable en phase aiguë. Échangez avec la direction et, si besoin, avec le médecin de la structure.

**Faut-il un certificat de non-contagion pour revenir ?** Cela dépend de la maladie et du règlement de la structure. Demandez-le à l’avance pour éviter un aller-retour.

**Comment m’organiser au travail ?** Renseignez-vous sur vos droits en cas d’enfant malade auprès de votre employeur ou de votre convention collective, et prévoyez si possible une solution de relais (proche, garde ponctuelle).

**Les médicaments peuvent-ils être donnés à la crèche ?** Cela dépend de la prescription et du protocole de la structure : apportez l’ordonnance et parlez-en avec l’équipe.

## Quand demander conseil
Consultez le médecin pour savoir si une maladie impose une éviction et pour combien de temps. Consultez rapidement si votre enfant a une fièvre élevée ou persistante, du mal à respirer, une éruption inhabituelle, des signes de déshydratation ou un comportement inhabituel. ${URG}

${FIN}`,
  }),
  a({
    slug: 'bouton-de-fievre-herpes-labial-enfant',
    title: 'Bouton de fièvre chez l’enfant : soigner l’herpès labial et protéger les plus petits',
    summary: 'Picotements puis petites cloques sur la lèvre : comment se manifeste l’herpès labial chez l’enfant, les soins utiles, les erreurs à éviter et les précautions avec les bébés.',
    category: 'sante-enfant', min_age_months: 12,
    tags: ['bouton de fièvre', 'herpès labial', 'herpès', 'lèvre', 'cloques', 'bisous', 'bébé', 'contagion', 'aphtes'],
    sources: [S.herpesAntibio, S.herpesAmeli, S.sfpCollectivites],
    body_md: `## En bref
- Le bouton de fièvre est dû au **virus de l’herpès** (HSV-1), le plus souvent attrapé **dans la petite enfance** par la salive.
- Une poussée commence par des **picotements**, puis une rougeur et un **bouquet de petites cloques** sur la lèvre, qui sèchent en **croûte** et guérissent en 7 à 10 jours.
- Il est **contagieux** des premiers signes jusqu’à l’apparition des croûtes : **pas de bisous**, surtout aux bébés.
- **Ne pas arracher la croûte**, pas d’alcool, **pas de crème à la cortisone ni aux antibiotiques**.
- Douleur ou rougeur de l’**œil** avec un bouton de fièvre : **consultez dans la journée**.

## Comprendre
Selon Santé.fr (Antibio’Malin), le virus de l’herpès se transmet par la salive, surtout dans l’enfance. Après la première infection, il reste « endormi » dans un nerf et peut se réveiller plus tard sous forme de boutons de fièvre : fatigue, autre infection (rhume, grippe), soleil, froid peuvent déclencher une poussée. Beaucoup d’adultes portent ce virus sans jamais avoir de poussée.

La **première infection** passe souvent inaperçue. Elle peut aussi donner des **lésions douloureuses dans la bouche avec de la fièvre**, qui guérissent en général seules en une quinzaine de jours. Dans ce cas, l’enfant peut avoir du mal à manger et à boire : l’hydratation devient la priorité.

## Au quotidien
**Soigner un bouton de fièvre**
- Dès les premiers picotements, demandez conseil au pharmacien : une crème antivirale peut être proposée, mais certaines ont un **âge minimum** ; lisez la notice.
- Appliquez la crème en débordant autour du bouton, sans la mettre dans l’œil ou la bouche, et lavez-vous les mains avant et après.
- Les crèmes **anesthésiantes** sont contre-indiquées chez l’enfant (risque de fausse route).
- Laissez la croûte tomber seule ; coupez les ongles pour limiter le grattage.
- Pour la douleur, demandez au médecin ou au pharmacien quel antidouleur donner selon son poids.

**À éviter**
- Arracher la croûte : cela retarde la cicatrisation.
- Désinfecter à l’alcool, qui irrite.
- Les crèmes à la cortisone, qui peuvent provoquer des complications graves.
- Les crèmes antibiotiques, inutiles contre un virus.
- Les baumes et rouges à lèvres partagés.

**Protéger l’entourage**
- Pas de bisous pendant la poussée, en particulier aux **nourrissons**, aux personnes dont les défenses sont fragiles et aux **femmes enceintes**.
- Ne pas partager verres, couverts, brosse à dents, gourde, serviette ni baume à lèvres.
- Lavage des mains après avoir touché le bouton.
- Si un adulte de la maison a un bouton de fièvre, il évite d’embrasser le bébé et se lave les mains avant de s’en occuper.
- Attention aux enfants qui ont de l’**eczéma** : le guide de la Société française de pédiatrie recommande de protéger les lésions d’herpès à leur contact.

**Si les boutons sont dans la bouche avec de la fièvre**
Proposez souvent de petites gorgées d’eau fraîche et des aliments froids et mous (yaourt, compote, glace), en évitant les aliments acides ou salés. Surveillez qu’il urine normalement.

## Questions fréquentes
**Peut-il aller à l’école ou à la crèche ?** Oui. Le guide SFP ne prévoit pas d’éviction pour l’herpès ; il recommande le lavage des mains et la protection des lésions près d’enfants eczémateux.

**Pourquoi revient-il toujours au même endroit ?** Le virus reste dans le nerf de cette zone et se réactive par moments. Si le soleil déclenche les poussées, protégez son visage (chapeau, crème solaire à indice élevé).

**Combien de temps est-il contagieux ?** Des premiers signes de la poussée (picotements, cloques) jusqu’à l’apparition des croûtes. C’est pendant cette période qu’il faut être le plus vigilant avec les bisous et le partage d’objets.

## Quand demander conseil
**Consultez dans la journée** en cas de forte fièvre ou de douleur intense, de douleur ou de rougeur de l’œil, de gêne à la lumière, ou si votre enfant a une maladie qui fragilise ses défenses ou un eczéma étendu. **Consultez dans les jours qui viennent** si la poussée est plus forte que d’habitude, si le bouton s’étend ou ne cicatrise pas après 10 jours, ou si les poussées sont fréquentes (plus de 6 par an). **Appelez le 15** si un nourrisson présente des lésions avec fièvre et refuse de boire, ou si un enfant ne boit plus, urine peu ou est très abattu. ${URG}

${FIN}`,
  }),
];
