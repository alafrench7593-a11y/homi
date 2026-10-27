/** Guide complet — lot 16 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ».
 * Thème : examens et analyses de la grossesse expliqués (prises de sang, sérologies, glycémie, NFS, groupe sanguin, échographies, monitoring, dépistages, examens de fin de grossesse).
 * Aucune dose, aucun diagnostic : chaque article renvoie au professionnel qui suit la grossesse. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page.
const S = {
  sp: { label: 'Service-public.fr — Grossesse : examens médicaux', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F963', consulted_on: C, published: '2026-03-16' },
  has: { label: 'HAS — Suivi et orientation des femmes enceintes en fonction des situations à risque identifiées (recommandations, mise à jour mai 2016)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/suivi_des_femmes_enceintes_-_recommandations_23-04-2008.pdf', consulted_on: C, published: '2016-05' },
  ameliInf: { label: 'ameli.fr — Infections pendant la grossesse : recherche et prévention', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/infections/recherche-prevention', consulted_on: C },
  ameliBact: { label: 'ameli.fr — Les infections bactériennes pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/infections/infections-bacteriennes', consulted_on: C, published: '2025-05-21' },
  ameliToxo: { label: 'ameli.fr — Toxoplasmose : prévention', url: 'https://www.ameli.fr/assure/sante/themes/toxoplasmose/prevention', consulted_on: C, published: '2024-05-28' },
  santeSuivi: { label: 'Santé.fr — Le suivi médical de la grossesse', url: 'https://www.sante.fr/le-suivi-medical-de-la-grossesse', consulted_on: C, published: '2022-07-27' },
  santeCal: { label: 'Santé.fr — Le calendrier de grossesse', url: 'https://www.sante.fr/le-calendrier-de-grossesse', consulted_on: C, published: '2026-06-02' },
  sante8: { label: 'Santé.fr — Grossesse : la consultation du 8e mois', url: 'https://www.sante.fr/grossesse-la-consultation-de-8eme-mois', consulted_on: C, published: '2018-01-11' },
  sante9: { label: 'Santé.fr — 9e mois : suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/9eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C, published: '2025-07-09' },
  santeDG: { label: 'Santé.fr — Diabète gestationnel', url: 'https://www.sante.fr/diabete-gestationnel', consulted_on: C, published: '2026-08-13' },
  ameliDG: { label: 'ameli.fr — Diabète gestationnel : traitement et suivi de la femme enceinte et du bébé', url: 'https://www.ameli.fr/assure/sante/themes/diabete-gestationnel/traitement-suivi-femme-enceinte-bebe', consulted_on: C },
  santePreecl: { label: 'Santé.fr — Prééclampsie', url: 'https://www.sante.fr/node/2055815', consulted_on: C, published: '2026-08-13' },
  santeRub: { label: 'Santé.fr — Rubéole', url: 'https://www.sante.fr/rubeole', consulted_on: C, published: '2026-08-12' },
  santeHepB: { label: 'Santé.fr — Hépatite B', url: 'https://www.sante.fr/hepatite-b', consulted_on: C, published: '2026-08-13' },
  hasVih: { label: 'HAS — Grossesse et VIH : désir d’enfant, soins de la femme enceinte et prévention de la transmission mère-enfant (fiche, avril 2024)', url: 'https://cns.sante.fr/wp-content/uploads/2024/06/fiche_vih_grossesse_22_mai_2024.pdf', consulted_on: C, published: '2024-04-25' },
  hasT21: { label: 'HAS — Trisomie 21 : la HAS actualise ses recommandations concernant le dépistage prénatal', url: 'https://www.has-sante.fr/jcms/c_2768535/fr/trisomie-21-la-has-actualise-ses-recommandations-concernant-le-depistage-prenatal-de-la-trisomie-21', consulted_on: C, published: '2017-05-17' },
  santeDPN: { label: 'Santé.fr (Agence de la biomédecine) — Je suis enceinte : peut-on déceler les maladies génétiques potentielles de mon enfant avant sa naissance ?', url: 'https://www.sante.fr/node/776875', consulted_on: C, published: '2017-11-21' },
  cneof: { label: 'Conférence nationale d’échographie obstétricale et fœtale (CNEOF) — L’échographie de dépistage prénatal (rapport, juillet 2016)', url: 'https://www.ordre-sages-femmes.fr/wp-content/uploads/2015/10/Rapport-CNEOF-2016.pdf', consulted_on: C, published: '2016-07-14' },
  nimesAmnio: { label: 'CHU de Nîmes, CPDPN — Fiche d’information : l’amniocentèse', url: 'https://www.chu-nimes.fr/sites/default/files/media/2025-04/cpdpn-fiche-information-amniocentese.pdf', consulted_on: C },
  nimesBiopsie: { label: 'CHU de Nîmes, CPDPN — Fiche d’information : la biopsie de trophoblaste', url: 'https://www.chu-nimes.fr/sites/default/files/media/2025-04/cpdpn-fiche-information-biopsie-trophoblaste.pdf', consulted_on: C },
  nimesCpdpn: { label: 'CHU de Nîmes — Centre pluridisciplinaire de diagnostic prénatal : document d’information générale', url: 'https://chu-nimes.fr/sites/default/files/media/2025-04/cpdpn-plaquette-document-information-generale.pdf', consulted_on: C },
  ansm: { label: 'Afssaps (aujourd’hui ANSM) — Informations sur les risques liés à l’échographie à usage non médical (mai 2005)', url: 'https://archive.ansm.sante.fr/content/download/6132/59485/version/7/file/qr_echoqest.pdf', consulted_on: C, published: '2005-05' },
  macsf: { label: 'MACSF (assureur des professionnels de santé) — Qu’est-ce qu’une échographie « plaisir » ? Cadre juridique', url: 'https://www.macsf.fr/responsabilite-professionnelle/cadre-juridique/echographie-plaisir-fin-pratique-contestee', consulted_on: C },
  hasAcc: { label: 'HAS — Accouchement normal : accompagnement de la physiologie et interventions médicales (synthèse, décembre 2017)', url: 'https://www.has-sante.fr/portail/upload/docs/application/pdf/2018-01/fs_accouchement_v3.pdf', consulted_on: C, published: '2017-12' },
  ameliDroits: { label: 'ameli.fr — Grossesse : prise en charge (droits et démarches)', url: 'https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/grossesse', consulted_on: C, published: '2017-05-02' },
  secu05Maternite: { label: 'Sécurité sociale des Hautes-Alpes (Caf et CPAM) — Parcours maternité : support d’information (janvier 2026)', url: 'https://caf.fr/sites/default/files/medias/051/CCSS05_Parcours_maternite_01_2026.pdf', consulted_on: C },
  ameliDents: { label: 'ameli.fr — Femme enceinte : l’examen bucco-dentaire de prévention', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/femme-enceinte-soins-dentaire-mtdents', consulted_on: C },
  ameliAlim: { label: 'ameli.fr — L’alimentation pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/alimentation-grossesse', consulted_on: C, published: '2026-06-18' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin, de la sage-femme ou du professionnel de santé qui suit votre grossesse.';
const URG = 'En cas d’urgence (saignement abondant, perte de connaissance, convulsions, douleur violente, difficulté à respirer), appelez le 15 ou le 112.';
const PSY = 'Si l’attente ou l’annonce d’un résultat vous submerge, parlez-en à votre équipe ; en cas d’idées noires, le 3114 (prévention du suicide) répond 24 h/24, gratuitement.';
const FAMILY: Pick<LibArticle, 'journeys' | 'status' | 'category'> = { journeys: ['pregnant'], status: 'to_review', category: 'suivi-grossesse' };

export const GUIDE_B16: LibArticle[] = [
  // ───────────────────────────── Sérologies et dépistages infectieux ─────────────────────────────
  {
    ...FAMILY,
    slug: 'serologie-toxoplasmose-comprendre-resultat-controle-mensuel',
    title: 'Sérologie de la toxoplasmose : comprendre son résultat et le contrôle chaque mois',
    summary: 'Pourquoi la toxoplasmose est recherchée dès le début de la grossesse, ce que signifie être « immunisée » ou non, et comment se déroule la surveillance mensuelle.',
    body_md: `Sur l’ordonnance de la première prise de sang figure presque toujours la toxoplasmose. Selon le résultat, vous n’en entendrez plus parler… ou vous aurez une prise de sang chaque mois jusqu’à l’accouchement. Voici comment s’y retrouver.

## En bref
- La sérologie de la toxoplasmose fait partie des examens obligatoires de la première consultation, sauf si un document prouve déjà que vous êtes immunisée.
- Si vous êtes immunisée, la surveillance s’arrête en général là.
- Si vous ne l’êtes pas, une sérologie est refaite à chaque consultation mensuelle, jusqu’au 9e mois.
- Il n’existe pas de vaccin : la protection repose sur les précautions d’hygiène et d’alimentation, du début de la grossesse jusqu’à l’accouchement.
- Seul le professionnel qui vous suit interprète le résultat : demandez-lui de vous l’expliquer.

## Comprendre
La toxoplasmose est une infection due à un parasite. Elle passe souvent inaperçue chez l’adulte, mais une première contamination pendant la grossesse peut se transmettre au fœtus à travers le placenta. C’est pourquoi on cherche à savoir, dès le début, si vous avez déjà rencontré ce parasite.

La prise de sang recherche des **anticorps**, c’est-à-dire les traces laissées par une infection passée ou récente. Schématiquement :
- **vous êtes immunisée** : vous avez déjà eu la toxoplasmose avant la grossesse, souvent sans le savoir ;
- **vous n’êtes pas immunisée** (on dit aussi « séronégative ») : vous n’avez jamais été en contact avec le parasite, et une contamination reste possible ;
- **le résultat demande un contrôle** : il arrive que le laboratoire ou le prescripteur demande une nouvelle prise de sang pour dater une éventuelle infection. Ce n’est pas un diagnostic en soi.

Les recommandations de la Haute Autorité de santé prévoient de refaire la sérologie lors de la deuxième consultation (avant 15 semaines d’aménorrhée) si la première était négative, puis à chaque consultation intermédiaire et à celle du 9e mois. L’objectif est de repérer rapidement une contamination pendant la grossesse, pour que l’équipe puisse proposer les examens et la prise en charge adaptés.

## Au quotidien
- **Gardez tous vos résultats** dans le même dossier, y compris ceux d’une grossesse précédente : un document prouvant l’immunité peut éviter une prise de sang inutile.
- **Faites la prise de sang mensuelle à temps**, idéalement quelques jours avant la consultation, pour que le résultat soit disponible.
- **Appliquez les précautions** si vous n’êtes pas immunisée : viande bien cuite, fruits, légumes et herbes soigneusement lavés, mains lavées après avoir manipulé de la terre ou de la viande crue, gants pour jardiner, litière du chat confiée à quelqu’un d’autre si possible.
- **Notez la date de chaque prise de sang** sur votre calendrier ou dans l’application : c’est un rendez-vous facile à oublier.
- **Posez vos questions** si le compte rendu comporte des termes que vous ne comprenez pas : la sage-femme ou le médecin peut vous traduire chaque ligne.

## Questions fréquentes
**Je suis non immunisée : dois-je m’inquiéter ?** Ce n’est pas une maladie, seulement l’absence de protection. Les précautions et la surveillance mensuelle sont justement là pour vous accompagner.

**Je suis immunisée : dois-je encore faire attention à la viande ?** La toxoplasmose n’est alors plus la préoccupation principale, mais d’autres précautions alimentaires, comme celles contre la listériose, restent valables pour toutes les femmes enceintes.

**Le résultat parle d’un contrôle à refaire : qu’est-ce que cela veut dire ?** Certains résultats ne permettent pas de conclure d’emblée. Une deuxième prise de sang, parfois dans le même laboratoire, aide à interpréter la situation. Attendez l’avis du professionnel avant de tirer des conclusions.

**Faut-il refaire une prise de sang après l’accouchement ?** Selon votre situation, le professionnel peut prescrire un dernier contrôle. Renseignez-vous lors de la consultation du 9e mois.

**Mon conjoint doit-il faire le test ?** La sérologie concerne la femme enceinte. Votre conjoint peut en revanche vous aider en prenant en charge la litière ou le jardinage.

## Quand demander conseil
Si vous avez de la fièvre, des ganglions ou une grande fatigue, ou si un résultat vous inquiète, appelez la sage-femme ou le médecin qui vous suit sans attendre la prochaine consultation. ${URG}

${END}`,
    tags: ['toxoplasmose', 'sérologie', 'prise de sang', 'immunisée', 'non immunisée', 'contrôle mensuel', 'séronégative'],
    sources: [S.has, S.ameliToxo, S.santeCal],
  },
  {
    ...FAMILY,
    slug: 'serologie-rubeole-grossesse-resultat',
    title: 'Sérologie de la rubéole pendant la grossesse : pourquoi, quand et que faire du résultat',
    summary: 'La rubéole est recherchée au début de la grossesse : ce que signifie le résultat, les précautions si vous n’êtes pas protégée et la vaccination après l’accouchement.',
    body_md: `La rubéole est devenue rare, mais une infection en début de grossesse peut avoir des conséquences graves pour le bébé. C’est pourquoi votre protection est vérifiée dès les premières semaines.

## En bref
- Le dépistage de la rubéole est obligatoire au début de la grossesse, sauf si un document prouve déjà votre immunité.
- Le risque pour le bébé dépend du moment de l’infection : il est le plus élevé avant 12 semaines d’aménorrhée.
- Si vous n’êtes pas immunisée, la sérologie est refaite au cours de la grossesse, jusqu’à 18 semaines d’aménorrhée.
- Le vaccin (ROR) ne se fait pas pendant la grossesse ; il peut être proposé après l’accouchement.
- Évitez le contact avec une personne qui a une éruption de petits boutons roses, surtout pendant les 4 premiers mois.

## Comprendre
La rubéole est une maladie virale qui se transmet par la salive et les sécrétions du nez et de la gorge. Chez l’adulte, elle ressemble à une rougeole atténuée : fièvre modérée pendant un ou deux jours, puis petites taches roses, surtout sur le thorax, qui disparaissent vite, parfois avec des ganglions dans le cou ou derrière les oreilles. Une personne est contagieuse une semaine avant l’éruption et jusqu’à deux semaines après.

Pendant la grossesse, le virus peut traverser le placenta. Selon Santé.fr :
- **avant 12 semaines d’aménorrhée**, l’infection peut provoquer des malformations graves (cœur, yeux, oreilles, système nerveux) ;
- **entre 12 et 18 semaines**, le risque concerne surtout la surdité ;
- **après 18 semaines**, le risque devient très faible.
Une rubéole peut aussi entraîner une fausse couche ou un accouchement prématuré.

La sérologie recherche les anticorps qui témoignent d’une protection, acquise par la vaccination ou par une ancienne infection. Si vous avez un carnet de vaccination montrant deux doses, ou une ancienne prise de sang positive, montrez-les : cela peut suffire.

## Au quotidien
- **Rassemblez vos preuves de vaccination** (carnet de santé, carnet de vaccination) avant la première consultation.
- **Si vous n’êtes pas immunisée**, tenez-vous à distance des personnes, notamment des enfants, qui présentent une éruption de boutons roses en cours ou récente.
- **Prévenez la crèche, l’école ou votre employeur** si vous travaillez avec de jeunes enfants, pour être informée en cas de cas déclaré.
- **Pensez au vaccin après la naissance** : la vaccination rattrapera la protection pour une future grossesse.
- **Après un vaccin ROR**, une grossesse doit être évitée pendant un mois, grâce à une contraception.

## Questions fréquentes
**J’ai été vaccinée enfant : faut-il quand même faire la prise de sang ?** La sérologie n’est prescrite qu’en l’absence de document prouvant l’immunité. Si vous avez la trace de deux doses de vaccin, parlez-en au professionnel.

**Je ne suis pas protégée : puis-je être vaccinée tout de suite ?** Non. Le vaccin contre la rubéole est un vaccin vivant, contre-indiqué pendant la grossesse. Il sera proposé après l’accouchement.

**J’ai été en contact avec un enfant qui a des boutons : que faire ?** Contactez rapidement votre sage-femme ou votre médecin en précisant la date du contact. Il n’existe pas de traitement spécifique, mais une prise de sang peut être prescrite pour faire le point.

**Pourquoi le contrôle s’arrête-t-il à 18 semaines ?** Parce qu’au-delà, le risque pour le bébé devient très faible ; la surveillance se concentre sur la période où une infection aurait le plus de conséquences.

## Quand demander conseil
Appelez votre sage-femme ou votre médecin si vous avez de la fièvre avec une éruption, ou si vous avez été exposée à une personne malade. ${URG}

${END}`,
    tags: ['rubéole', 'sérologie', 'immunité', 'vaccin ROR', 'éruption', 'prise de sang début de grossesse'],
    max_week: 20,
    sources: [S.santeRub, S.has, S.ameliInf],
  },
  {
    ...FAMILY,
    slug: 'depistage-syphilis-grossesse',
    title: 'Le dépistage de la syphilis pendant la grossesse : un examen obligatoire expliqué',
    summary: 'Pourquoi la syphilis est recherchée chez toutes les femmes enceintes, comment se passe le test et ce qui est proposé si le résultat est positif.',
    body_md: `Voir « syphilis » sur une ordonnance de grossesse peut surprendre. Il s’agit pourtant d’un examen prévu pour toutes les femmes enceintes, sans aucun jugement sur la vie de chacune.

## En bref
- Le dépistage de la syphilis fait partie des examens obligatoires de la première consultation prénatale.
- Il se fait par une simple prise de sang, en même temps que les autres sérologies.
- La syphilis peut se transmettre au bébé à travers le placenta si elle n’est pas traitée.
- Grâce à ce dépistage, la syphilis congénitale est devenue rare en France.
- En cas de résultat positif, un traitement antibiotique existe : le professionnel vous explique la suite.

## Comprendre
La syphilis est une infection sexuellement transmissible due à une bactérie. Elle peut rester discrète pendant longtemps, sans symptôme gênant : on peut donc être porteuse sans le savoir. C’est la raison pour laquelle on ne se contente pas de demander s’il y a eu des symptômes ; on la recherche chez toutes les femmes enceintes.

Selon l’Assurance maladie, une mère infectée et non traitée peut transmettre la bactérie au bébé à travers le placenta. Le risque de transmission est particulièrement élevé lorsque l’infection est récente (moins d’un an). Les conséquences pour l’enfant peuvent être graves : mort fœtale ou décès peu après la naissance, prématurité, petit poids de naissance, ou séquelles comme une surdité, des troubles de la vue ou des malformations.

Le dépistage précoce permet de traiter à temps et de protéger le bébé. La HAS le classe parmi les examens obligatoires de la première consultation, avec le groupe sanguin, les sérologies de la toxoplasmose et de la rubéole et la recherche de l’hépatite B.

## Au quotidien
- **Faites la prise de sang dès réception de l’ordonnance** : elle regroupe plusieurs sérologies en un seul prélèvement.
- **Parlez librement de votre situation** : un nouveau partenaire, des rapports non protégés ou une IST passée sont des informations médicales utiles, confidentielles, qui ne seront pas jugées.
- **Pensez au préservatif** pendant la grossesse si vous ou votre partenaire avez un risque d’exposition aux IST : l’Assurance maladie le recommande, y compris enceinte.
- **Si un traitement est prescrit**, suivez-le jusqu’au bout et faites les contrôles demandés.
- **Proposez à votre partenaire de se faire dépister** si votre résultat est positif : c’est important pour éviter une nouvelle contamination.

## Questions fréquentes
**Pourquoi ce test alors que je n’ai aucun symptôme ?** Justement parce que la syphilis peut passer inaperçue. Le dépistage est systématique pour que personne ne passe entre les mailles du filet.

**Un résultat positif signifie-t-il que le bébé est infecté ?** Non. Un résultat positif doit être confirmé et interprété par le professionnel. Un traitement adapté pendant la grossesse réduit fortement le risque pour le bébé.

**Le test peut-il être refait plus tard ?** Selon votre situation (nouveau partenaire, exposition, symptômes), le professionnel peut prescrire un nouveau test au cours de la grossesse.

**Est-ce remboursé ?** Les examens de suivi de grossesse sont pris en charge par l’Assurance maladie. Présentez votre carte Vitale au laboratoire.

## Quand demander conseil
Consultez rapidement en cas de plaie ou d’ulcération sur les organes génitaux ou dans la bouche, d’éruption sur la peau, ou si vous apprenez qu’un partenaire a une IST. ${URG}

${END}`,
    tags: ['syphilis', 'IST', 'dépistage', 'sérologie', 'prise de sang', 'infection sexuellement transmissible'],
    sources: [S.ameliBact, S.has, S.ameliInf],
  },
  {
    ...FAMILY,
    slug: 'depistage-hepatite-b-antigene-hbs-grossesse',
    title: 'Hépatite B : pourquoi l’antigène HBs est recherché pendant la grossesse',
    summary: 'Le dépistage de l’hépatite B est obligatoire chez la femme enceinte : ce que recherche l’examen et comment le bébé est protégé dès la naissance si besoin.',
    body_md: `Sur vos résultats, vous lirez peut-être « Ag HBs » ou « antigène HBs ». C’est le dépistage de l’hépatite B, un examen obligatoire pendant la grossesse.

## En bref
- Le test de dépistage de l’hépatite B est obligatoire chez la femme enceinte.
- Il recherche l’antigène HBs, qui signale la présence du virus.
- Une mère porteuse chronique du virus a un risque élevé de le transmettre à son bébé au moment de l’accouchement.
- Si la mère est porteuse, un traitement préventif est administré au nouveau-né dès la naissance, et la vaccination est recommandée dès la naissance.
- Le dépistage est aussi recommandé pour l’entourage proche et les partenaires d’une personne porteuse.

## Comprendre
L’hépatite B est une infection du foie due à un virus qui se transmet notamment par le sang et par voie sexuelle. On peut en être porteuse pendant des années sans symptôme.

Pendant la grossesse, le virus ne provoque pas de malformation. Le risque principal se situe au moment de l’accouchement : selon Santé.fr, une mère porteuse chronique transmet le virus à son bébé dans environ 90 % des cas en l’absence de prévention. Un nouveau-né infecté peut devenir porteur chronique et développer plus tard une maladie du foie. D’où l’intérêt de savoir à l’avance : l’équipe peut alors protéger le bébé dès ses premières heures.

**À quel moment ?** La HAS recommande de rechercher l’antigène HBs dès la première consultation. Service-public.fr mentionne aussi ce dépistage lors de la prise de sang du 6e mois. En pratique, votre prescripteur choisit le moment ; l’important est que le résultat figure dans votre dossier avant l’accouchement.

**Et si je suis porteuse ?** Santé.fr indique qu’un traitement de la mère pendant la grossesse n’est en général pas nécessaire pour prévenir la transmission, mais qu’un traitement est donné au nouveau-né à la naissance, avec une vaccination dès la naissance. Un suivi spécialisé de votre foie peut aussi vous être proposé.

## Au quotidien
- **Vérifiez que le résultat figure dans votre dossier** de maternité avant le terme.
- **Si vous êtes porteuse**, assurez-vous que la maternité en est informée : la prévention du bébé se fait dans les premières heures.
- **Pensez à l’entourage** : partenaire et personnes vivant sous le même toit peuvent se faire dépister et, si besoin, vacciner.
- **Notez les dates de vaccination** du bébé dans son carnet de santé : le calendrier doit être respecté pour qu’il soit bien protégé.
- **Faites le point sur vos propres vaccins** : si vous n’êtes ni porteuse ni vaccinée, parlez de la vaccination avec le professionnel.

## Questions fréquentes
**Le résultat est négatif : faut-il refaire le test ?** Le plus souvent non, sauf exposition à risque pendant la grossesse. Le professionnel vous dira s’il souhaite un contrôle.

**Pourrai-je allaiter si je suis porteuse ?** Posez la question à l’équipe de la maternité : elle vous conseillera selon votre situation et la protection mise en place pour le bébé.

**Le bébé sera-t-il forcément infecté si je suis porteuse ?** Non : c’est justement l’objectif du traitement préventif et de la vaccination dès la naissance.

**L’hépatite B est-elle dangereuse pour ma grossesse ?** Elle n’est pas connue pour causer de malformation. Le suivi permet surtout de protéger le bébé et de surveiller votre foie.

## Quand demander conseil
Consultez si vous avez une jaunisse (peau ou yeux jaunes), des urines très foncées, une grande fatigue, ou si vous apprenez qu’un proche est porteur du virus. ${URG}

${END}`,
    tags: ['hépatite B', 'antigène HBs', 'Ag HBs', 'dépistage', 'vaccination nouveau-né', 'transmission mère-enfant'],
    sources: [S.santeHepB, S.has, S.sp],
  },
  {
    ...FAMILY,
    slug: 'test-vih-pendant-la-grossesse',
    title: 'Le test du VIH pendant la grossesse : proposé à toutes, et ce qu’il permet',
    summary: 'Pourquoi le dépistage du VIH est proposé à chaque femme enceinte, quand il peut être refait, le dépistage du partenaire et ce qui se passe si le résultat est positif.',
    body_md: `Le test du VIH figure parmi les analyses du début de grossesse. Il est proposé à toutes les femmes, quelle que soit leur histoire, parce qu’un résultat connu tôt change tout pour la protection du bébé.

## En bref
- Le test du VIH est proposé à toutes les femmes lors du premier examen prénatal, avec les autres sérologies ; vous pouvez le refuser.
- Si le test est négatif mais qu’un risque d’exposition persiste, un nouveau test peut être proposé au 6e mois, voire à l’accouchement.
- Le dépistage est aussi proposé au partenaire, idéalement vers le 4e mois.
- Pour une femme vivant avec le VIH, un traitement bien suivi réduit fortement le risque de transmission au bébé.
- Le suivi du bébé comprend plusieurs prises de sang jusqu’à 18 à 24 mois.

## Comprendre
Le VIH peut être présent sans aucun symptôme pendant des années. Le dépistage pendant la grossesse permet, si besoin, de démarrer ou d’ajuster un traitement antirétroviral. Selon la fiche de la HAS publiée en 2024, un traitement adapté, pris sans oubli, réduit fortement le risque de transmission de la mère à l’enfant. Les vomissements pouvant diminuer l’efficacité du traitement, il faut les signaler au médecin.

**Le partenaire aussi.** La HAS recommande de proposer le dépistage au partenaire, idéalement lors de l’examen du 4e mois, quel que soit le statut de la femme enceinte. C’est une démarche de prévention pour le couple et pour le bébé.

**Si vous vivez avec le VIH**, un suivi mensuel est recommandé à l’hôpital, en infectiologie, et avec un gynécologue. Le mode d’accouchement dépend de la charge virale à l’approche du terme et de raisons obstétricales : quand la charge virale est indétectable, un accouchement par voie basse n’est pas contre-indiqué. L’allaitement n’est envisageable que dans des conditions strictes, discutées avec l’équipe, avec un suivi renforcé de la mère et de l’enfant.

**Le suivi du bébé** comporte une prise de sang quelques jours après la naissance, puis à 1, 3 et 6 mois, et un dernier contrôle entre 18 et 24 mois, une fois les anticorps de la mère disparus.

## Au quotidien
- **Acceptez le test en connaissance de cause** : il fait partie des prises de sang du début, sans prélèvement supplémentaire.
- **Signalez toute situation d’exposition** pendant la grossesse (nouveau partenaire, partenaire non dépisté, rapport non protégé) : un nouveau test pourra être proposé.
- **Encouragez votre partenaire** à se faire dépister ; c’est possible chez le médecin, au laboratoire ou dans un centre de dépistage.
- **En cas de traitement**, organisez-vous pour ne pas oublier de prise (alarme, pilulier) et prévenez l’équipe si les nausées vous empêchent de le garder.
- **Gardez une copie** de vos résultats et du plan de suivi dans le dossier remis à la maternité.

## Questions fréquentes
**Le test est-il obligatoire ?** Il est proposé systématiquement, mais vous pouvez le refuser. Les professionnels vous en expliquent l’intérêt pour le bébé.

**Mon test est négatif au début : faut-il le refaire ?** Pas forcément. Il peut être refait au 6e mois ou à l’accouchement en cas de risque d’exposition, par exemple un partenaire séropositif ou non dépisté.

**Les traitements contre le VIH sont-ils compatibles avec la grossesse ?** Selon la HAS, les antirétroviraux utilisés pendant la grossesse sont considérés comme sûrs. Le traitement est choisi et suivi par l’équipe spécialisée.

**Mon résultat sera-t-il confidentiel ?** Oui, il relève du secret médical. Vous décidez à qui vous en parlez.

## Quand demander conseil
Après une exposition à risque (rapport non protégé avec un partenaire de statut inconnu, rupture de préservatif), contactez sans attendre un médecin ou les urgences : un traitement préventif est possible, à débuter le plus tôt possible. ${URG} ${PSY}

${END}`,
    tags: ['VIH', 'test VIH', 'dépistage', 'sérologie', 'partenaire', 'transmission mère-enfant', 'IST'],
    sources: [S.hasVih, S.sp],
  },
  // ───────────────────────────── Groupe sanguin et sang ─────────────────────────────
  {
    ...FAMILY,
    slug: 'groupe-sanguin-deux-determinations-carte-grossesse',
    title: 'Groupe sanguin pendant la grossesse : pourquoi deux prises de sang et une carte',
    summary: 'Groupe ABO, Rhésus, Kell : à quoi sert la détermination du groupe sanguin pendant la grossesse, pourquoi elle est faite deux fois et l’intérêt de la carte de groupe.',
    body_md: `Même si vous connaissez votre groupe sanguin, la maternité vous demandera un document officiel. Explications sur cet examen discret mais essentiel.

## En bref
- Le groupe sanguin (ABO), le Rhésus complet et le groupe Kell font partie des examens obligatoires du début de grossesse.
- Une deuxième détermination est demandée si elle n’a pas déjà été faite, au plus tard en fin de grossesse.
- Les deux résultats permettent d’établir une carte de groupe sanguin, à apporter à la maternité.
- Ces informations servent à anticiper une éventuelle incompatibilité avec le bébé et à préparer l’accouchement, au cas où une transfusion serait nécessaire.
- Si vous êtes Rhésus négatif, une surveillance particulière est prévue.

## Comprendre
Le groupe sanguin décrit des marqueurs présents à la surface des globules rouges. On regarde notamment :
- **le groupe ABO** (A, B, AB ou O) ;
- **le Rhésus** (positif ou négatif), et ses sous-groupes, d’où le terme « Rhésus complet » ;
- **le groupe Kell**, un autre marqueur utile en cas de transfusion ou d’incompatibilité.

Pourquoi deux fois ? Une seule erreur d’étiquetage ou de saisie pourrait avoir des conséquences graves le jour où une transfusion serait nécessaire. Deux prélèvements distincts, réalisés à des moments différents, sécurisent le résultat. Service-public.fr situe la deuxième détermination en fin de grossesse, au 8e ou au 9e mois, si elle n’a pas été faite avant. Le calendrier de Santé.fr conseille d’établir la carte de groupe vers le 5e mois si elle n’existe pas encore.

Lors d’une première grossesse, le groupe est déterminé au début. Si vous avez déjà une carte de groupe valide comportant deux déterminations, le professionnel peut en tenir compte.

## Au quotidien
- **Cherchez votre carte de groupe sanguin** si vous en avez une (grossesse précédente, opération, don du sang) et montrez-la à la première consultation.
- **Vérifiez qu’elle comporte deux déterminations** ; sinon, la deuxième prise de sang sera prescrite.
- **Rangez la carte dans votre dossier de maternité** ou dans votre portefeuille, et pensez à la glisser dans la valise.
- **Prenez-la en photo** : utile si vous oubliez le document le jour J, même si l’original reste demandé.
- **Signalez toute transfusion passée** : cela peut modifier la surveillance (recherche d’anticorps irréguliers).

## Questions fréquentes
**Je connais mon groupe : pourquoi le refaire ?** Parce que la maternité a besoin d’un résultat de laboratoire fiable, établi selon des règles strictes. Une information orale ou une ancienne analyse isolée ne suffit pas.

**Que se passe-t-il si je suis Rhésus négatif ?** Une recherche d’anticorps irréguliers est faite à plusieurs reprises, et une prévention peut être proposée selon le groupe du bébé. Votre professionnel vous explique les étapes.

**Le groupe du père compte-t-il ?** Il peut aider à anticiper, notamment si vous êtes Rhésus négatif. Les examens biologiques prescrits au futur père dans le cadre de la grossesse sont pris en charge par l’Assurance maladie.

**J’ai perdu ma carte : que faire ?** Demandez au laboratoire qui a réalisé les analyses ou au professionnel qui vous suit : un duplicata ou une nouvelle détermination peut être organisé.

## Quand demander conseil
Si vous ne retrouvez pas vos résultats à l’approche du terme, parlez-en dès la consultation du 8e mois. En cas de saignement pendant la grossesse, contactez la maternité, surtout si vous êtes Rhésus négatif. ${URG}

${END}`,
    tags: ['groupe sanguin', 'rhésus', 'Kell', 'carte de groupe', 'deuxième détermination', 'prise de sang', 'transfusion'],
    sources: [S.has, S.sp, S.santeCal],
  },
  {
    ...FAMILY,
    slug: 'rai-recherche-agglutinines-irregulieres-grossesse',
    title: 'La RAI (recherche d’agglutinines irrégulières) : à quoi sert cette prise de sang ?',
    summary: 'Comprendre la RAI, cet examen qui recherche des anticorps dirigés contre les globules rouges, pour qui il est répété et ce qu’il permet d’anticiper.',
    body_md: `« RAI » : trois lettres qui reviennent sur plusieurs ordonnances de grossesse. Derrière ce sigle se cache un examen de prévention pour le bébé.

## En bref
- La RAI recherche dans votre sang des anticorps dirigés contre certains marqueurs des globules rouges, en dehors des anticorps habituels anti-A et anti-B.
- Elle fait partie des examens obligatoires de la première consultation.
- Elle est répétée pendant la grossesse si vous êtes Rhésus négatif, ou si vous êtes Rhésus positif avec un antécédent de transfusion.
- Service-public.fr mentionne une RAI au 6e mois puis à répéter aux 8e et 9e mois dans ces situations.
- Un résultat positif ne signifie pas que le bébé est malade : il conduit à des examens et à une surveillance adaptés.

## Comprendre
Nos globules rouges portent des marqueurs, comme le Rhésus. Il arrive que le système immunitaire d’une femme fabrique des anticorps contre un marqueur qu’elle ne possède pas, mais que le bébé a hérité de l’autre parent. On parle alors d’« allo-immunisation ». Ces anticorps peuvent, dans certains cas, traverser le placenta et détruire des globules rouges du bébé, ce qui peut provoquer une anémie chez lui.

Comment une femme peut-elle produire ces anticorps ? Le plus souvent après un contact avec du sang différent du sien : une transfusion, ou le passage de quelques globules rouges du bébé dans la circulation de la mère lors d’une grossesse précédente, d’un saignement, d’un choc sur le ventre ou d’un geste comme une amniocentèse.

La RAI sert à repérer ces anticorps tôt. Les recommandations de la HAS prévoient une RAI à la première consultation pour toutes, puis des contrôles répétés lors des consultations suivantes, systématiques si vous êtes Rhésus D négatif, et chez les femmes Rhésus positif ayant déjà été transfusées.

Pour les femmes Rhésus négatif, une injection d’immunoglobulines anti-D peut être proposée dans certaines situations, par exemple après une amniocentèse ou une biopsie de trophoblaste, comme l’indiquent les fiches d’information des centres de diagnostic prénatal. Le professionnel vous explique quand et pourquoi.

## Au quotidien
- **Notez les dates des RAI** prévues sur votre calendrier de grossesse, surtout si vous êtes Rhésus négatif.
- **Faites la prise de sang avant l’injection** si une injection d’anti-D est prévue le même jour : suivez l’ordre indiqué par votre sage-femme ou votre médecin.
- **Signalez sans attendre** tout saignement, toute chute ou tout choc sur le ventre : une prévention peut être nécessaire rapidement.
- **Mentionnez vos antécédents** de transfusion, de fausse couche, d’IVG ou de grossesse extra-utérine : ces informations comptent pour la surveillance.
- **Gardez vos résultats et votre carte de groupe** ensemble dans le dossier de maternité.

## Questions fréquentes
**Ma RAI est négative : qu’est-ce que cela veut dire ?** Aucun anticorps irrégulier n’a été retrouvé à ce moment-là. Si vous êtes Rhésus négatif, les contrôles continuent car la situation peut évoluer.

**Ma RAI est positive : mon bébé est-il en danger ?** Pas forcément. Certains anticorps n’ont pas de conséquence pour le bébé ; d’autres demandent une surveillance spécialisée. Le laboratoire identifie l’anticorps et le professionnel vous oriente si besoin.

**Je suis Rhésus positif : suis-je concernée ?** La RAI est faite au début pour toutes. Elle n’est répétée qu’en cas d’antécédent de transfusion ou sur décision du professionnel.

**L’injection d’anti-D fausse-t-elle la RAI ?** Elle peut apparaître sur une RAI faite ensuite. Signalez toujours au laboratoire la date d’une injection récente.

## Quand demander conseil
Contactez la maternité le jour même en cas de saignement, de choc ou de chute sur le ventre, surtout si vous êtes Rhésus négatif. ${URG}

${END}`,
    tags: ['RAI', 'agglutinines irrégulières', 'anticorps', 'rhésus négatif', 'anti-D', 'allo-immunisation', 'prise de sang'],
    sources: [S.has, S.sp, S.nimesAmnio],
  },
  {
    ...FAMILY,
    slug: 'numeration-formule-sanguine-anemie-grossesse',
    title: 'NFS et anémie pendant la grossesse : comprendre la numération sanguine',
    summary: 'Pourquoi une numération formule sanguine est prescrite au cours de la grossesse, ce qu’elle mesure et comment l’anémie par manque de fer est prise en charge.',
    body_md: `La « NFS », ou numération formule sanguine, est l’une des analyses les plus courantes. Pendant la grossesse, elle sert surtout à repérer une anémie, fréquente en fin de grossesse.

## En bref
- La NFS compte les globules rouges, les globules blancs et les plaquettes, et mesure l’hémoglobine.
- Service-public.fr la mentionne lors des prises de sang des 5e et 6e mois ; la HAS la prévoit parmi les examens des consultations intermédiaires.
- Elle peut être prescrite dès le début de la grossesse en cas de facteur de risque d’anémie.
- Les besoins en fer augmentent pendant la grossesse, surtout à la fin.
- Si un manque de fer est repéré, le médecin ou la sage-femme peut prescrire du fer : ne prenez pas de complément sans avis.

## Comprendre
La numération mesure plusieurs éléments du sang :
- **les globules rouges et l’hémoglobine**, qui transportent l’oxygène : une baisse évoque une anémie ;
- **les globules blancs**, qui participent à la défense contre les infections ;
- **les plaquettes**, qui interviennent dans la coagulation : leur nombre est aussi utile avant l’accouchement et une éventuelle péridurale.

Pendant la grossesse, le volume de sang augmente et le bébé puise dans vos réserves. Selon l’Assurance maladie, le fer est indispensable, surtout en fin de grossesse, pour éviter une carence et l’anémie qu’elle peut entraîner.

La HAS recommande une numération dès la première consultation en cas de facteur de risque d’anémie, puis au cours des consultations intermédiaires. Votre prescripteur adapte le calendrier selon votre situation : grossesses rapprochées, grossesse multiple, alimentation végétalienne, saignements, antécédents.

## Au quotidien
- **Faites la prise de sang à la date prévue**, sans être forcément à jeun sauf indication contraire sur l’ordonnance.
- **Mangez des aliments sources de fer** : viandes, poissons, légumes secs (lentilles, pois chiches, haricots).
- **Ne prenez pas de complément de votre propre initiative** : l’Assurance maladie déconseille les compléments alimentaires sans avis médical, car certains contiennent des vitamines ou des minéraux nocifs à forte dose.
- **Si vous êtes végétalienne**, parlez-en au professionnel : une supplémentation peut être nécessaire.
- **Signalez une fatigue inhabituelle**, un essoufflement au moindre effort ou des vertiges : ces signes justifient de vérifier la numération.

## Questions fréquentes
**Pourquoi mes résultats sont-ils marqués « hors norme » ?** Les valeurs de référence imprimées par le laboratoire ne sont pas toujours celles de la grossesse. Seul le professionnel peut dire si un écart demande une action.

**Le fer prescrit peut-il donner des troubles digestifs ?** Cela arrive. Parlez-en au professionnel plutôt que d’arrêter seule : il peut ajuster la prescription.

**L’anémie est-elle dangereuse pour le bébé ?** Une anémie importante mérite d’être prise en charge, pour vous comme pour lui. C’est l’objectif de ce dépistage et des contrôles qui suivent.

**Les plaquettes basses empêchent-elles la péridurale ?** Le médecin anesthésiste examine vos résultats lors de la consultation pré-anesthésique et vous informe des possibilités.

## Quand demander conseil
Consultez si vous ressentez une grande fatigue persistante, un essoufflement inhabituel, des palpitations ou des malaises. Appelez la maternité en cas de saignement. ${URG}

${END}`,
    tags: ['NFS', 'numération formule sanguine', 'anémie', 'fer', 'hémoglobine', 'plaquettes', 'prise de sang 6e mois'],
    sources: [S.sp, S.has, S.ameliAlim],
  },
  {
    ...FAMILY,
    slug: 'hgpo-test-diabete-gestationnel-deroulement',
    title: 'Le test du diabète gestationnel (HGPO) : pour qui, quand et comment il se déroule',
    summary: 'L’hyperglycémie provoquée par voie orale dépiste le diabète gestationnel chez les femmes qui ont des facteurs de risque : préparation, déroulement et suite du test.',
    body_md: `On l’appelle souvent « le test du sucre ». L’HGPO, pour hyperglycémie provoquée par voie orale, permet de repérer un diabète qui apparaît pendant la grossesse.

## En bref
- Le diabète gestationnel apparaît en général entre la 24e et la 28e semaine de grossesse, chez des femmes sans diabète connu.
- Le dépistage est pratiqué lorsqu’au moins un facteur de risque est présent (surpoids, âge supérieur à 35 ans, antécédents de diabète…).
- Le test consiste à boire une boisson sucrée (75 g de glucose) puis à faire plusieurs prises de sang : à jeun, une heure et deux heures après.
- Prévoyez de rester au laboratoire environ deux heures.
- Si le diabète est confirmé, le suivi repose d’abord sur l’alimentation et l’activité physique, et parfois sur l’insuline.

## Comprendre
Pendant la grossesse, certaines hormones rendent le corps moins sensible à l’insuline. Chez certaines femmes, la glycémie (le taux de sucre dans le sang) s’élève alors au-delà des valeurs attendues : c’est le diabète gestationnel. Selon l’Assurance maladie, il touche environ 5 % des femmes enceintes.

**Qui est concernée ?** Santé.fr cite comme facteurs de risque, notamment : surpoids ou obésité, antécédents personnels ou familiaux de diabète, âge supérieur à 35 ans, bébé de plus de 4 kg lors d’une grossesse précédente, fœtus grand pour son âge ou excès de liquide amniotique à l’échographie, traitement prolongé par corticoïdes. Le dépistage est pratiqué dès qu’un de ces facteurs est présent. Chez les femmes à risque élevé, il peut aussi être fait plus tôt.

**Pourquoi dépister ?** Un diabète non équilibré expose le bébé à un poids de naissance élevé (macrosomie) et à une hypoglycémie à la naissance. Le traitement réduit les complications ; la plupart des femmes concernées accouchent d’un bébé en bonne santé.

**Le déroulement.** Vous arrivez à jeun. Une première prise de sang mesure la glycémie de départ, puis vous buvez une solution contenant 75 g de glucose. D’autres prises de sang sont faites une heure puis deux heures plus tard. Les seuils d’interprétation sont appliqués par le laboratoire et le prescripteur.

## Au quotidien
- **Vérifiez sur l’ordonnance** les consignes de jeûne et prenez rendez-vous si le laboratoire le demande.
- **Suivez les consignes du laboratoire** pendant le test : on vous demande en général de rester assise et au calme, sans manger ni fumer, entre les prises de sang.
- **Emportez de quoi patienter** (livre, écouteurs) et une collation pour après la dernière prise de sang.
- **Faites-vous accompagner** si vous craignez un malaise ; prévenez le personnel si vous vous sentez mal ou si vous vomissez la boisson.
- **Gardez le résultat** pour la consultation suivante, où il sera interprété avec vous.

## Questions fréquentes
**La boisson est-elle désagréable ?** Elle est très sucrée ; certaines femmes ont des nausées. Boire lentement dans le temps indiqué peut aider. Si vous vomissez, le test devra en général être refait : signalez-le.

**Je n’ai aucun facteur de risque : dois-je faire le test ?** Le dépistage est ciblé sur les femmes qui ont des facteurs de risque. Votre professionnel décide avec vous selon votre dossier.

**Le test est positif : que se passe-t-il ensuite ?** Une prise en charge est organisée : conseils alimentaires, activité physique adaptée et, si le médecin le juge utile, autosurveillance de la glycémie au doigt. Une insuline est proposée si la glycémie reste trop élevée malgré ces mesures.

**Le diabète disparaît-il après l’accouchement ?** Le plus souvent, oui. Le professionnel vous indiquera le suivi à prévoir après la naissance, notamment un contrôle de la glycémie, et les conseils pour la suite.

## Quand demander conseil
Si vous avez très soif, urinez beaucoup plus que d’habitude ou si l’échographie évoque un gros bébé, parlez-en à votre professionnel. ${URG}

${END}`,
    tags: ['HGPO', 'diabète gestationnel', 'test du sucre', 'glycémie', 'glucose', 'prise de sang à jeun', '24-28 SA'],
    min_week: 20, max_week: 32,
    sources: [S.santeDG, S.ameliDG, S.santeSuivi],
  },
  {
    ...FAMILY,
    slug: 'bandelette-urinaire-sucre-albumine-consultation',
    title: 'La bandelette urinaire à chaque consultation : sucre, albumine et infection',
    summary: 'Pourquoi on vous demande vos urines à chaque rendez-vous de grossesse, ce que recherche la bandelette et comment bien recueillir l’échantillon.',
    body_md: `À chaque consultation de grossesse, ou presque, on vous tend un petit pot. La bandelette urinaire est rapide, indolore, et apporte des informations précieuses.

## En bref
- La recherche de sucre (glycosurie) et d’albumine, c’est-à-dire de protéines (protéinurie), dans les urines est obligatoire à chaque consultation prénatale.
- À partir du 4e mois, la bandelette sert aussi à dépister une infection urinaire sans symptôme.
- Une bandelette positive pour l’infection conduit à un examen des urines au laboratoire (ECBU).
- La présence de protéines avec une tension élevée peut faire évoquer une prééclampsie.
- Si la bandelette montre du sucre ou des protéines, le professionnel décide des examens à faire ensuite.

## Comprendre
La bandelette est une petite languette couverte de zones réactives qui changent de couleur au contact de l’urine. En quelques instants, elle donne plusieurs indications :
- **le sucre** : sa présence peut s’observer pendant la grossesse, mais elle mérite d’être interprétée par le professionnel, notamment dans le contexte du diabète gestationnel ;
- **les protéines** (albumine) : leur présence, surtout associée à une tension élevée, est un signe surveillé de près. Santé.fr rappelle que la prévention de la prééclampsie repose d’abord sur ces contrôles mensuels : mesure de la tension et recherche de protéines dans les urines ;
- **les leucocytes et les nitrites** : ils orientent vers une infection urinaire.

La HAS classe la recherche de sucre et de protéines parmi les examens obligatoires de toutes les consultations, et le dépistage des infections urinaires sans symptôme par bandelette parmi les examens proposés systématiquement. L’Assurance maladie précise que les infections urinaires sont fréquentes pendant la grossesse, souvent sans symptôme ou avec des signes discrets : la bandelette permet de les repérer.

## Au quotidien
- **Recueillez de préférence le milieu du jet**, après une toilette intime simple : cela limite les faux résultats.
- **Utilisez un flacon propre**, idéalement fourni par le cabinet ou la pharmacie.
- **Si vous faites la bandelette à la maison**, respectez le temps de lecture indiqué et notez le résultat pour le professionnel.
- **Buvez normalement** avant le rendez-vous, sans excès ni restriction.
- **Signalez vos symptômes**, même si la bandelette est négative : brûlures, envies pressantes, douleurs dans le bas du ventre.

## Questions fréquentes
**La bandelette a montré des traces de sucre : ai-je un diabète ?** Pas forcément. La bandelette ne suffit pas à poser un diagnostic ; le professionnel décide s’il faut un test de glycémie.

**Que veulent dire des protéines dans mes urines ?** Elles peuvent avoir plusieurs explications, dont une contamination de l’échantillon. Associées à une tension élevée, elles justifient un avis rapide. Le professionnel peut demander un dosage au laboratoire.

**Pourquoi un ECBU alors que je n’ai rien senti ?** Parce qu’une infection urinaire peut rester silencieuse et, non traitée, atteindre les reins. L’ECBU identifie la bactérie et le traitement adapté.

**Puis-je faire la bandelette en pharmacie ?** Santé.fr indique que la mesure de la tension et la bandelette urinaire peuvent souvent être réalisées en pharmacie lorsque cela est nécessaire rapidement, par exemple en cas de gonflement soudain des chevilles.

## Quand demander conseil
Consultez rapidement en cas de brûlures en urinant, d’envies fréquentes, de douleurs dans le bas du ventre ou de fièvre. Un gonflement rapide et important des chevilles, du visage ou des mains, des maux de tête persistants ou des troubles de la vue justifient un avis médical en urgence. ${URG}

${END}`,
    tags: ['bandelette urinaire', 'albumine', 'protéinurie', 'glycosurie', 'sucre dans les urines', 'analyse d’urine', 'consultation mensuelle'],
    sources: [S.has, S.ameliBact, S.santePreecl],
  },
  {
    ...FAMILY,
    slug: 'ecbu-infection-urinaire-grossesse',
    title: 'ECBU et infection urinaire pendant la grossesse : dépister et traiter à temps',
    summary: 'Les infections urinaires sont fréquentes et parfois silencieuses pendant la grossesse : quand un ECBU est prescrit, comment le faire et pourquoi le contrôle après traitement compte.',
    body_md: `L’ECBU, ou examen cytobactériologique des urines, est un examen d’urine réalisé au laboratoire. Pendant la grossesse, il est souvent prescrit après une bandelette positive ou chez les femmes plus exposées aux infections urinaires.

## En bref
- Pendant la grossesse, la pression du bébé sur la vessie et la stagnation des urines favorisent les infections urinaires.
- Les symptômes sont souvent absents ou discrets.
- Un ECBU est fait si la bandelette est positive, et de façon régulière chez les femmes à risque (diabète, cystites à répétition, anomalie des voies urinaires).
- En cas d’infection, un antibiotique compatible avec la grossesse est prescrit sans attendre.
- Un ECBU de contrôle est réalisé 8 à 10 jours après la fin du traitement.

## Comprendre
L’Assurance maladie explique que les infections urinaires sont fréquentes chez la femme enceinte. Non traitée, une infection de la vessie peut remonter vers les reins (pyélonéphrite), une complication associée à un risque d’accouchement prématuré. D’où l’importance de dépister les infections, même sans symptôme.

**Qui fait un ECBU ?**
- les femmes dont la bandelette urinaire est positive lors d’une consultation ;
- les femmes ayant une malformation ou un dysfonctionnement des voies urinaires, un diabète ou des cystites à répétition : pour elles, l’Assurance maladie indique un ECBU dès la première consultation, puis chaque mois à partir du 4e mois.

**Comment est-il interprété ?** Le laboratoire recherche des globules blancs et des bactéries, identifie la bactérie et teste sa sensibilité aux antibiotiques (antibiogramme). Un traitement est souvent débuté avant le résultat de l’antibiogramme, puis ajusté si besoin.

## Au quotidien
- **Lavez-vous les mains**, faites une toilette intime à l’eau et au savon ou avec la lingette fournie, puis recueillez le milieu du jet dans le flacon stérile.
- **Apportez l’échantillon rapidement** au laboratoire, ou conservez-le selon les consignes données.
- **Préférez les urines du matin** si l’ordonnance le précise.
- **Buvez régulièrement dans la journée** et n’attendez pas pour aller aux toilettes.
- **Suivez le traitement jusqu’au bout**, même si les symptômes disparaissent, et faites l’ECBU de contrôle à la date prévue.

## Questions fréquentes
**Je n’ai aucune brûlure : pourquoi traiter ?** Parce qu’une infection peut être présente sans symptôme et évoluer vers les reins. Le dépistage permet justement de traiter tôt.

**Les antibiotiques sont-ils compatibles avec la grossesse ?** Le professionnel choisit un antibiotique adapté à la grossesse et à la bactérie identifiée. Ne prenez jamais un ancien traitement de votre propre initiative.

**L’infection revient souvent : que faire ?** Parlez-en : des ECBU réguliers peuvent être programmés, et des conseils adaptés vous seront donnés.

**Les envies fréquentes d’uriner sont-elles un signe d’infection ?** Elles sont fréquentes pendant la grossesse sans infection. En revanche, des brûlures, des douleurs ou des urines troubles doivent faire consulter.

## Quand demander conseil
Consultez rapidement votre médecin ou votre sage-femme en cas de douleurs dans le bas du ventre, d’envies pressantes ou de brûlures en urinant. Consultez en urgence en cas de fièvre, de frissons, de douleur dans le dos ou sur le côté, de vomissements ou de contractions. ${URG}

${END}`,
    tags: ['ECBU', 'infection urinaire', 'cystite', 'pyélonéphrite', 'analyse d’urine', 'antibiogramme', 'brûlures urinaires'],
    safety_critical: true,
    sources: [S.ameliBact, S.has],
  },
  {
    ...FAMILY,
    category: 'sante-grossesse',
    slug: 'tension-arterielle-surveillance-preeclampsie',
    title: 'Tension artérielle et prééclampsie : ce que surveille chaque consultation',
    summary: 'Pourquoi votre tension est mesurée à chaque rendez-vous, ce qu’est l’hypertension de la grossesse et les signes de prééclampsie qui justifient d’appeler sans attendre.',
    body_md: `Le brassard gonflé à chaque consultation n’est pas une simple formalité. La mesure de la tension, associée à la recherche de protéines dans les urines, sert à repérer tôt une prééclampsie.

## En bref
- La tension est mesurée à chaque consultation de grossesse, au repos.
- L’hypertension de la grossesse correspond à une tension supérieure à 14/9, apparue après 20 semaines chez une femme sans hypertension connue.
- La prééclampsie associe une tension élevée et des protéines dans les urines ; elle survient dans la seconde moitié de la grossesse.
- Maux de tête persistants, bourdonnements d’oreilles, mouches ou éclairs devant les yeux, douleur forte sous les côtes à droite : ces signes justifient un avis urgent.
- Un gonflement rapide et important des chevilles impose de consulter en urgence pour mesurer la tension et faire une bandelette.

## Comprendre
La prééclampsie est une maladie de la grossesse liée à un développement anormal des vaisseaux du placenta. Selon Santé.fr, elle concerne environ 3 à 4 % des grossesses. Elle peut évoluer vers l’éclampsie, qui provoque des convulsions. C’est l’une des principales causes de complications graves pour la mère et le bébé en France, d’où une surveillance attentive.

**Les facteurs de risque** cités par Santé.fr : première grossesse, nouveau partenaire, antécédent personnel ou familial (mère, sœur) de prééclampsie, obésité, hypertension chronique, maladie rénale chronique, syndrome des antiphospholipides, âge supérieur à 40 ans, grossesse multiple.

**Ce que fait la consultation.** La sage-femme ou le médecin mesure votre tension au repos, recherche des protéines dans les urines et vous interroge sur des signes d’hypertension : maux de tête, gonflements, bourdonnements, troubles visuels. La consultation du 8e mois insiste particulièrement sur ces signes.

**Si une hypertension est repérée**, une surveillance plus rapprochée est organisée : contrôles de tension, analyses de sang et d’urine, échographies et enregistrements du rythme cardiaque du bébé. Selon la gravité, un traitement, un repos à domicile ou une hospitalisation peuvent être proposés.

## Au quotidien
- **Arrivez un peu en avance** et asseyez-vous quelques minutes avant la mesure : l’effort ou le stress peuvent faire monter les chiffres.
- **Mesurez votre tension à la maison** seulement si on vous l’a demandé, avec un appareil validé, et notez les résultats.
- **Connaissez vos facteurs de risque** et parlez-en dès le début de la grossesse.
- **Gardez sur vous le numéro de la maternité** et celui du 15.
- **Ne minimisez pas les signes** : un mal de tête inhabituel qui ne passe pas mérite un appel, même un dimanche.

## Questions fréquentes
**Ma tension était un peu haute au cabinet : est-ce grave ?** Une mesure isolée ne suffit pas. Le professionnel peut la refaire au repos, ou demander des contrôles. Suivez ses consignes.

**Les pieds gonflés sont-ils toujours un signe de prééclampsie ?** Les jambes lourdes et les chevilles un peu gonflées en fin de journée sont fréquentes. Un gonflement rapide et important, du visage ou des mains, ou associé à d’autres signes, demande en revanche un avis en urgence.

**La prééclampsie disparaît-elle après la naissance ?** Les symptômes s’améliorent en général dans les jours qui suivent l’accouchement, mais une surveillance reste nécessaire, y compris après la sortie de la maternité.

**Puis-je faire contrôler ma tension en pharmacie ?** Oui, Santé.fr indique que la tension et la bandelette urinaire peuvent souvent être faites en pharmacie. En présence de signes d’alerte, contactez directement la maternité ou le 15.

## Quand demander conseil
Appelez la maternité ou le 15 sans attendre en cas de maux de tête intenses ou persistants, de bourdonnements d’oreilles, de troubles de la vue (mouches, éclairs), de douleur forte en haut du ventre ou sous les côtes à droite, de gonflement brutal du visage, des mains ou des chevilles, ou si le bébé bouge moins. En cas de convulsions ou de perte de connaissance, appelez immédiatement le 15 ou le 112.

${END}`,
    tags: ['tension artérielle', 'hypertension', 'prééclampsie', 'pré-éclampsie', 'protéinurie', 'maux de tête', 'œdème', 'signes d’alerte'],
    min_week: 20,
    safety_critical: true,
    sources: [S.santePreecl, S.sante8, S.has],
  },
  // ───────────────────────────── Échographies ─────────────────────────────
  {
    ...FAMILY,
    slug: 'echographie-premier-trimestre-11-13-sa-datation',
    title: 'L’échographie du 1er trimestre (11 à 13 SA) : datation, nombre de bébés et clarté nucale',
    summary: 'Ce que vérifie la première échographie de dépistage, pourquoi elle doit être faite dans une fenêtre précise et comment elle s’intègre au dépistage de la trisomie 21.',
    body_md: `C’est souvent la première fois que vous voyez votre bébé à l’écran. Au-delà de l’émotion, cette échographie a des objectifs médicaux précis, et elle se fait dans un créneau de quelques semaines.

## En bref
- La première échographie de dépistage se fait entre 11 et 13 semaines d’aménorrhée (SA) et 6 jours.
- Elle date précisément la grossesse et permet de fixer la date prévue d’accouchement.
- Elle vérifie le nombre d’embryons et, en cas de jumeaux, leurs caractéristiques (placenta partagé ou non).
- Elle mesure la clarté nucale, utilisée avec une prise de sang et votre âge pour calculer le risque de trisomie 21, si vous acceptez ce dépistage.
- Elle peut aussi repérer certaines anomalies, mais ne permet pas de tout voir.

## Comprendre
La Conférence nationale d’échographie obstétricale et fœtale (CNEOF) décrit trois objectifs pour cet examen : **dater la grossesse**, **identifier et caractériser une grossesse multiple** et **participer à l’évaluation du risque d’anomalie chromosomique**. Elle permet aussi de dépister certaines pathologies.

**La datation.** L’échographiste mesure la longueur de l’embryon, de la tête aux fesses (longueur cranio-caudale). À ce stade, tous les embryons grandissent à peu près au même rythme : cette mesure donne donc une date de début de grossesse fiable, plus précise que la date des dernières règles. C’est sur elle que s’appuient le calendrier des examens et la date prévue d’accouchement.

**La clarté nucale.** C’est un petit espace rempli de liquide sous la peau de la nuque du fœtus. Sa mesure, associée à la longueur cranio-caudale, au dosage de marqueurs dans votre sang et à votre âge, permet de calculer un risque de trisomie 21. D’après la HAS, selon le niveau de risque, un test ADN sur prise de sang ou un caryotype peut ensuite être proposé. Ce dépistage est proposé à toutes, jamais imposé.

**Les jumeaux.** Si deux embryons sont visibles, l’échographie précise s’ils partagent ou non un placenta, ce qui change le suivi.

## Au quotidien
- **Prenez rendez-vous tôt** : les créneaux entre 11 et 13 SA sont parfois très demandés, et la mesure de la clarté nucale n’est utilisable que dans cette fenêtre.
- **Apportez** l’ordonnance, votre carte Vitale, et le formulaire de consentement au dépistage si on vous l’a remis.
- **Demandez s’il faut avoir la vessie pleine** : les consignes varient selon les cabinets. Selon la position du bébé, l’examen se fait par le ventre et parfois par voie vaginale.
- **Venez accompagnée** si vous le souhaitez ; renseignez-vous sur la présence d’enfants, qui n’est pas toujours possible.
- **Posez vos questions à la fin** : l’échographiste a besoin de concentration pendant les mesures.

## Questions fréquentes
**La date d’accouchement peut-elle changer après cette échographie ?** Oui, c’est même son rôle : la date est souvent corrigée de quelques jours par rapport au calcul fait avec les dernières règles.

**L’échographie peut-elle voir le sexe du bébé ?** À ce stade, ce n’est pas un objectif de l’examen. Santé.fr indique que le sexe peut être déterminé lors de l’échographie du 2e trimestre.

**Le bébé ne s’est pas mis en bonne position : que se passe-t-il ?** L’échographiste peut vous demander de bouger, de marcher un peu ou de revenir un peu plus tard pour terminer les mesures.

**Une clarté nucale « augmentée » veut-elle dire que mon bébé est malade ?** Non. C’est un élément du calcul de risque, qui peut conduire à proposer d’autres examens. Seul un examen diagnostique peut conclure.

## Quand demander conseil
Avant ou après l’échographie, consultez en urgence en cas de saignement abondant, de douleur intense dans le bas du ventre ou de malaise. ${URG} ${PSY}

${END}`,
    tags: ['échographie premier trimestre', 'échographie de datation', 'clarté nucale', '12 SA', 'jumeaux', 'date d’accouchement', 'trisomie 21'],
    min_week: 9, max_week: 15,
    sources: [S.cneof, S.santeSuivi, S.hasT21],
  },
  {
    ...FAMILY,
    slug: 'echographie-morphologique-deuxieme-trimestre',
    title: 'L’échographie morphologique du 2e trimestre (20 à 25 SA) : ce qui est examiné',
    summary: 'La deuxième échographie de dépistage observe l’anatomie et la croissance du bébé : déroulement, ce qu’elle peut et ne peut pas montrer, et suites possibles.',
    body_md: `Vers la moitié de la grossesse, la deuxième échographie est la plus longue et la plus détaillée. On l’appelle souvent « morphologique », car elle observe la forme des organes du bébé.

## En bref
- Elle se fait entre 20 et 25 semaines d’aménorrhée, souvent vers 22 SA.
- Elle vérifie le développement et la croissance du bébé grâce à des mesures et à l’observation des organes.
- Elle observe aussi le placenta et le liquide amniotique.
- Le sexe du bébé peut être déterminé à ce stade, si vous souhaitez le connaître.
- C’est un examen de dépistage : il ne peut pas repérer toutes les anomalies.

## Comprendre
Cet examen du 5e mois porte sur la **morphologie et la croissance** du fœtus : Santé.fr précise que des mesures sont réalisées pour vérifier que le développement se déroule bien.

Concrètement, l’échographiste examine l’une après l’autre les grandes structures : la tête et le cerveau, la face, la colonne vertébrale, le cœur, les poumons, l’abdomen, les reins et la vessie, les membres. Il mesure la tête, l’abdomen et le fémur pour suivre la croissance. Il regarde aussi la position du placenta et la quantité de liquide amniotique.

**Les limites.** La CNEOF insiste sur l’information à donner aux futurs parents : l’échographie de dépistage n’est pas un examen de diagnostic, et un diagnostic exhaustif est impossible, même avec des examens de deuxième intention. Certaines particularités ne sont pas visibles, ou apparaissent plus tard. La qualité de l’image dépend aussi de la position du bébé et de l’épaisseur de la paroi abdominale.

**Si quelque chose demande à être vérifié**, une échographie de contrôle, ou une échographie dite « diagnostique » réalisée par un échographiste référent, peut être proposée. Dans certaines situations, le dossier est discuté avec un centre pluridisciplinaire de diagnostic prénatal.

## Au quotidien
- **Prévoyez du temps** : l’examen peut durer plus longtemps que le premier, surtout si le bébé bouge beaucoup ou se cache.
- **Dites à l’avance si vous voulez connaître le sexe** ou non, pour que l’échographiste fasse attention à ne pas le révéler par mégarde.
- **Apportez les comptes rendus précédents** (échographie du 1er trimestre, résultats du dépistage).
- **Évitez la crème hydratante sur le ventre** le jour même si le cabinet vous le conseille.
- **Notez vos questions** : le compte rendu contient des abréviations que la sage-femme ou le médecin peut vous expliquer.

## Questions fréquentes
**Pourquoi l’échographiste ne parle-t-il pas pendant l’examen ?** Il a besoin de concentration pour réaliser des mesures précises. Son silence ne signifie pas qu’il y a un problème : il fera le point avec vous à la fin.

**Mon bébé est « petit » ou « grand » sur le compte rendu : est-ce inquiétant ?** Les mesures sont comparées à des courbes de référence. Un écart isolé est interprété par le professionnel, qui peut proposer un contrôle.

**Peut-on refaire l’échographie si le bébé était mal placé ?** Oui. Si certaines structures n’ont pas pu être vues, un nouveau rendez-vous est souvent proposé.

**L’échographie peut-elle nuire au bébé ?** Pour une échographie médicale, aucun effet nocif n’a été démontré à ce jour ; l’ANSM recommande seulement de limiter l’exposition aux ultrasons au nécessaire.

## Quand demander conseil
Appelez la maternité en cas de saignements, de perte de liquide, de contractions régulières ou de douleurs inhabituelles. ${URG} ${PSY}

${END}`,
    tags: ['échographie morphologique', 'deuxième échographie', '22 SA', 'sexe du bébé', 'morphologie', 'croissance du bébé'],
    min_week: 18, max_week: 26,
    sources: [S.santeSuivi, S.cneof, S.ansm],
  },
  {
    ...FAMILY,
    slug: 'echographie-troisieme-trimestre-croissance-placenta',
    title: 'L’échographie du 3e trimestre (30 à 35 SA) : croissance, placenta et position du bébé',
    summary: 'La troisième échographie prépare l’accouchement : estimation du poids, localisation du placenta, présentation du bébé, et pourquoi l’estimation reste approximative.',
    body_md: `La dernière échographie de dépistage a lieu au 7e ou au début du 8e mois. Elle sert surtout à préparer l’accouchement et à repérer un bébé qui grandirait moins bien.

## En bref
- Elle se fait entre 30 et 35 semaines d’aménorrhée, souvent vers 32 SA.
- Elle contrôle la croissance du bébé et estime son poids.
- Elle repère un retard de croissance in utero et vérifie la position du placenta.
- Elle précise la présentation du bébé (tête en bas, siège…) et la quantité de liquide amniotique.
- L’estimation du poids est approximative : elle peut s’écarter du poids réel de plus ou moins 10 % environ.

## Comprendre
Selon la CNEOF, l’échographie du 3e trimestre a pour objectif principal de **dépister un retard de croissance intra-utérin** et certaines pathologies, et de **localiser le placenta**. L’échographiste calcule un poids estimé à partir de plusieurs mesures (tête, abdomen, fémur), comparé à des courbes de référence.

Santé.fr ajoute que cet examen évalue les conditions de l’accouchement : la position du bébé, son poids et sa croissance. La consultation du 8e mois s’appuie sur ses résultats pour discuter de la voie d’accouchement.

**Pourquoi le poids estimé n’est-il qu’une estimation ?** Le bébé n’est pas pesé : son poids est calculé à partir de mesures, avec une marge d’erreur. Santé.fr la décrit comme « assez approximative », de l’ordre de plus ou moins 10 %. Un bébé annoncé à 3 kg peut donc peser sensiblement plus ou moins à la naissance.

**Le placenta.** S’il est situé bas, près du col de l’utérus (placenta dit « praevia »), cela peut modifier le suivi et les conditions d’accouchement. L’équipe vous expliquera ce qui est prévu.

**Et ensuite ?** Si une croissance faible, un excès ou un manque de liquide amniotique ou une autre particularité est repéré, des échographies de surveillance, éventuellement avec un Doppler, et des enregistrements du rythme cardiaque du bébé peuvent être proposés.

## Au quotidien
- **Prenez rendez-vous dans la bonne fenêtre** (30 à 35 SA), en tenant compte de la date de la consultation du 8e mois.
- **Apportez les comptes rendus** des échographies précédentes : l’échographiste compare l’évolution de la croissance.
- **Parlez de vos sensations** : si le bébé bouge moins, dites-le, même le jour de l’échographie.
- **Ne vous focalisez pas sur un chiffre** : c’est l’évolution de la croissance au fil des examens qui compte.
- **Prévoyez un coussin ou un temps de pause** si rester allongée sur le dos vous fait tourner la tête : signalez-le, l’examen peut se faire légèrement sur le côté.

## Questions fréquentes
**Le bébé est en siège à 32 SA : faut-il s’inquiéter ?** Beaucoup de bébés se retournent encore ensuite. La position sera vérifiée lors des consultations suivantes, et des solutions peuvent être proposées si elle persiste.

**On m’annonce un gros bébé : aurai-je une césarienne ?** Pas forcément. Le poids estimé est approximatif, et la décision dépend de nombreux éléments discutés avec l’équipe.

**Que signifient les courbes sur le compte rendu ?** Les mesures sont reportées sur des courbes de référence, qui situent la croissance du bébé par rapport à d’autres bébés du même terme. Le professionnel vous explique où se situe votre bébé et si un contrôle est utile.

**Faudra-t-il d’autres échographies ?** Elles ne sont pas systématiques. Elles sont prescrites si la grossesse ou le bébé le justifient, par exemple en cas de terme dépassé.

## Quand demander conseil
Appelez la maternité si le bébé bouge moins que d’habitude, en cas de saignements, de perte de liquide, de contractions régulières avant 37 SA ou de maux de tête intenses avec troubles de la vue. ${URG}

${END}`,
    tags: ['échographie troisième trimestre', '32 SA', 'poids estimé', 'placenta', 'présentation', 'siège', 'retard de croissance'],
    min_week: 28, max_week: 36,
    sources: [S.cneof, S.santeSuivi, S.sante9],
  },
  {
    ...FAMILY,
    slug: 'echographie-depistage-diagnostique-focalisee-differences',
    title: 'Échographie de dépistage, diagnostique ou focalisée : quelles différences ?',
    summary: 'Toutes les échographies de grossesse n’ont pas le même but : comprendre les trois échographies de dépistage, les examens de deuxième intention, les échographies ciblées et le consentement.',
    body_md: `Vous avez peut-être entendu parler d’« échographie de référence », d’« écho de contrôle » ou d’« écho du col ». Ces termes désignent des examens aux objectifs différents.

## En bref
- Trois échographies de dépistage sont proposées à toutes les femmes, une par trimestre.
- Une échographie diagnostique, dite de deuxième intention, est réalisée par un échographiste très expérimenté quand une anomalie est suspectée ou qu’un risque particulier existe.
- Une échographie focalisée répond à une question précise : vitalité du bébé, liquide amniotique, position du placenta, longueur du col…
- Le dépistage prénatal fait l’objet d’une information et d’un consentement écrit.
- Aucune échographie ne permet de garantir l’absence de toute anomalie.

## Comprendre
**Les échographies de dépistage.** Ce sont les trois examens du suivi habituel : vers 11–13 SA, 20–25 SA et 30–35 SA. Elles s’adressent à toutes les femmes enceintes et cherchent à repérer les situations qui demandent une attention particulière. L’Agence de la biomédecine rappelle que d’autres échographies peuvent être prescrites en cas de pathologie de la grossesse ou du fœtus.

**L’échographie diagnostique.** La CNEOF la décrit comme un examen de deuxième ligne, réalisé par un médecin très expérimenté, idéalement impliqué dans un centre pluridisciplinaire de diagnostic prénatal. Elle est indiquée lorsqu’une anomalie est suspectée ou constatée au dépistage, en cas de risque génétique accru, d’exposition à un risque infectieux ou toxique, ou lorsque l’échographie de dépistage n’a pas pu être complète. Elle peut s’intéresser plus précisément au cœur, au cerveau, aux reins, à la croissance, au liquide amniotique ou aux jumeaux.

**L’échographie focalisée.** Elle répond à une question limitée, souvent en urgence ou pour surveiller une situation connue : confirmer qu’une grossesse est bien dans l’utérus au 1er trimestre, vérifier la vitalité du bébé, son bien-être (liquide amniotique, Doppler du cordon), estimer son poids, localiser le placenta, mesurer le col de l’utérus en cas de risque d’accouchement prématuré, suivre la croissance en cas de retard, de grossesse multiple ou de terme dépassé.

**Le consentement.** Selon la CNEOF, un formulaire de consentement au dépistage prénatal est signé par la femme et par le professionnel qui l’a informée. Il couvre l’ensemble du dépistage ; vous en gardez un exemplaire, à présenter lors des échographies.

## Au quotidien
- **Demandez quel est l’objectif** d’une échographie supplémentaire : vous comprendrez mieux ce qu’elle peut répondre.
- **Gardez tous vos comptes rendus et clichés** dans un même dossier : chaque échographiste les compare aux précédents.
- **Conservez votre exemplaire du consentement** et apportez-le aux échographies de dépistage.
- **Notez le nom du lieu et de l’échographiste** si vous êtes orientée vers un centre de référence.
- **Faites-vous accompagner** si un examen diagnostique est programmé : l’attente peut être éprouvante.

## Questions fréquentes
**Une échographie de contrôle signifie-t-elle qu’il y a un problème ?** Pas forcément. Elle est souvent proposée parce qu’une structure n’a pas pu être bien vue, ou pour suivre une mesure dans le temps.

**Puis-je refuser une échographie ?** Chaque examen nécessite votre consentement. Le professionnel vous explique ce qu’il apporte, pour que vous décidiez en connaissance de cause.

**Pourquoi l’échographie ne voit-elle pas tout ?** Parce que certaines anomalies ne sont pas visibles à l’image, ou apparaissent tardivement, et que la qualité dépend de nombreux facteurs. La CNEOF souligne qu’un diagnostic exhaustif est impossible.

**Une échographie du col, à quoi sert-elle ?** Elle mesure la longueur du col de l’utérus, utile pour évaluer un risque d’accouchement prématuré dans certaines situations.

## Quand demander conseil
Appelez la maternité en cas de saignements, de contractions, de perte de liquide ou si le bébé bouge moins, sans attendre la prochaine échographie. ${URG} ${PSY}

${END}`,
    tags: ['échographie de référence', 'échographie diagnostique', 'échographie de contrôle', 'échographie du col', 'Doppler', 'consentement', 'dépistage prénatal'],
    sources: [S.cneof, S.santeDPN],
  },
  {
    ...FAMILY,
    slug: 'echographie-souvenir-3d-hors-suivi-medical',
    title: 'Échographies « souvenir » ou 3D commerciales : ce qu’il faut savoir',
    summary: 'Pourquoi les autorités sanitaires déconseillent les échographies sans but médical, ce que dit la réglementation et comment garder de beaux souvenirs autrement.',
    body_md: `Des vidéos en 3D de son bébé avant la naissance, à offrir ou à partager : l’idée séduit. Pourtant, les échographies réalisées sans but médical sont déconseillées en France, et encadrées par la loi.

## En bref
- Les échographies du suivi de grossesse ont un objectif médical ; l’exposition aux ultrasons y est limitée au nécessaire.
- Pour ces examens médicaux, aucun effet nocif pour le fœtus n’a été démontré à ce jour.
- Les échographies « souvenir » exposent le fœtus plus longtemps et de façon ciblée, sans bénéfice médical : l’Afssaps (aujourd’hui ANSM) recommande de ne pas exposer inutilement le fœtus.
- La réglementation française réserve l’échographie fœtale aux médecins et aux sages-femmes, à des fins médicales.
- Vous pouvez demander des clichés lors de vos échographies médicales.

## Comprendre
Une échographie repose sur des ultrasons : une sonde envoie des ondes que les tissus renvoient, et un logiciel reconstruit l’image. Les ultrasons ont deux types d’effets possibles sur les tissus, thermique et mécanique. Lors d’un examen médical habituel, aucun effet nocif n’a été démontré, et le bénéfice attendu l’emporte très largement. Par précaution, on recommande toutefois de limiter l’exposition au minimum nécessaire.

Dans une échographie « souvenir », la situation est différente. Pour obtenir une jolie vidéo, l’opérateur expose longtemps et en continu une petite zone, souvent le visage. Selon le document de l’Afssaps, aucune donnée scientifique ne permet de connaître les effets biologiques de ces conditions d’exposition sur le fœtus, et le risque est jugé plus élevé, sans aucun bénéfice médical.

**Ce que dit la réglementation.** Un décret de 2017 interdit l’utilisation des échographes destinés à l’imagerie fœtale humaine par des personnes qui ne sont ni médecins ni sages-femmes, ainsi que leur vente à ces personnes. Un arrêté de 2018 précise que l’échographie obstétricale a une finalité médicale (évaluation des risques, diagnostic, surveillance) et ne doit pas être présentée comme une « échographie souvenir ». Des poursuites ont déjà été engagées contre des entreprises proposant ce service.

**Et la 3D en consultation ?** L’échographie 3D fonctionne sur le même principe que la 2D, avec un logiciel de reconstruction en volume. Certains praticiens l’utilisent pour mieux voir une structure précise, dans un cadre médical.

## Au quotidien
- **Demandez une image ou deux** à la fin de vos échographies médicales : de nombreux praticiens peuvent vous en imprimer ou vous en transmettre.
- **Méfiez-vous des offres commerciales** d’échographie « plaisir », en boutique, à domicile ou dans des salons.
- **Créez d’autres souvenirs** : photos du ventre mois après mois, journal de grossesse, enregistrement des battements du cœur entendus en consultation si le professionnel l’accepte.
- **Évitez les appareils à ultrasons vendus pour écouter le cœur du bébé à la maison** : ils exposent eux aussi le fœtus sans but médical et ne remplacent pas un examen. En cas de doute sur les mouvements du bébé, appelez plutôt la maternité.
- **Conservez les clichés à l’abri de la lumière** ou scannez-les : le papier thermique s’efface avec le temps.

## Questions fréquentes
**Une échographie médicale de plus est-elle dangereuse ?** Une échographie prescrite pour une raison médicale n’est pas contre-indiquée : son bénéfice l’emporte largement.

**Puis-je demander une échographie pour connaître le sexe plus tôt ?** L’échographie n’a pas vocation à répondre à une curiosité ; le sexe peut en général être vu lors de l’échographie du 2e trimestre si vous le souhaitez.

**Mon entourage veut m’offrir une séance 3D : que répondre ?** Vous pouvez expliquer que les autorités sanitaires la déconseillent, et proposer une séance photo de grossesse à la place.

## Quand demander conseil
Si vous êtes inquiète pour votre bébé, ne cherchez pas à vous rassurer par une échographie commerciale : appelez la maternité ou votre sage-femme, qui peut vous examiner. Si le bébé bouge moins, consultez le jour même. ${URG}

${END}`,
    tags: ['échographie souvenir', 'échographie 3D', 'échographie plaisir', 'ultrasons', 'doppler fœtal', 'photo échographie'],
    sources: [S.ansm, S.macsf],
  },
  // ───────────────────────────── Diagnostic prénatal ─────────────────────────────
  {
    ...FAMILY,
    slug: 'amniocentese-deroulement-risques-resultats',
    title: 'L’amniocentèse : déroulement, précautions et délais de résultats',
    summary: 'Quand une amniocentèse est proposée, comment se passe le prélèvement de liquide amniotique, ce qu’il faut savoir sur les risques et les signes qui doivent faire consulter ensuite.',
    body_md: `Une amniocentèse est proposée lorsqu’il faut une réponse diagnostique, par exemple après un dépistage de trisomie 21 à risque élevé ou une image particulière à l’échographie. C’est un geste court, mais une décision qui mérite du temps.

## En bref
- L’amniocentèse consiste à prélever un peu de liquide amniotique avec une aiguille très fine, sous contrôle échographique.
- Elle est possible à partir de 15 semaines d’aménorrhée.
- Elle permet notamment d’établir le caryotype du fœtus, seul examen qui confirme ou écarte une trisomie 21.
- Le risque de fausse couche lié au geste est faible, et surtout présent dans les 8 à 10 jours qui suivent.
- Les premiers résultats arrivent en quelques jours ; d’autres analyses prennent 1 à 3 semaines.

## Comprendre
Le liquide amniotique contient des cellules du fœtus. En les analysant, le laboratoire peut étudier les chromosomes (caryotype) ou rechercher d’autres anomalies génétiques ou infectieuses selon l’indication. Selon la HAS, le caryotype fœtal reste le seul examen qui permet de poser un diagnostic de trisomie 21 ; le dépistage, lui, ne fait qu’estimer un risque. La HAS estime le risque de perte fœtale lié aux prélèvements à environ 0,1 %, et la fiche du centre de diagnostic prénatal du CHU de Nîmes indique un risque de fausse couche de l’ordre de 0,5 à 1 %. Les chiffres varient selon les sources : demandez à l’équipe qui vous suit de vous expliquer celui qu’elle retient.

**Le déroulement**, d’après cette fiche : l’échographiste repère la poche de liquide, désinfecte le ventre, puis introduit une aiguille très fine à travers la paroi abdominale pour aspirer une petite quantité de liquide. La piqûre est décrite comme pas plus douloureuse qu’une prise de sang. Vous repartez peu de temps après.

**Le consentement.** Un formulaire de consentement est signé avant le prélèvement : il est indispensable pour que le laboratoire puisse analyser l’échantillon.

**Si vous êtes Rhésus négatif**, une injection d’immunoglobulines anti-D est réalisée.

## Au quotidien
- **Il n’est pas nécessaire d’être à jeun** ; une vessie modérément remplie convient, selon les consignes du centre.
- **Prenez une douche le matin** et portez des vêtements propres.
- **Apportez votre dossier complet** : carte Vitale, carte de mutuelle, carte de groupe sanguin, échographies, sérologies et résultats du dépistage.
- **Signalez vos antécédents**, vos traitements et vos allergies : certains augmentent le risque de saignement ou d’infection.
- **Reposez-vous pendant 24 heures** : le repos au lit n’est pas nécessaire, mais évitez les efforts. Organisez la garde des aînés si besoin.

## Questions fréquentes
**Suis-je obligée de faire une amniocentèse ?** Non. C’est une proposition. Vous pouvez prendre le temps de réfléchir, poser toutes vos questions et accepter ou refuser.

**Le test ADN sur prise de sang peut-il la remplacer ?** Non : selon la HAS, ce test affine le dépistage mais ne pose pas de diagnostic. Il peut être proposé avant, selon le niveau de risque.

**Comment vais-je recevoir les résultats ?** Le laboratoire les adresse à votre médecin, qui vous les communique. Demandez à l’avance comment et quand vous serez contactée.

**Puis-je venir accompagnée ?** Oui, c’est même conseillé, pour le soutien comme pour le trajet du retour.

## Quand demander conseil
Après une amniocentèse, consultez en urgence en cas de douleurs ou de contractions de l’utérus, de saignement, de perte de liquide ou de fièvre. ${URG} ${PSY}

${END}`,
    tags: ['amniocentèse', 'caryotype', 'diagnostic prénatal', 'liquide amniotique', 'trisomie 21', 'anti-D', 'résultats'],
    min_week: 14, max_week: 36,
    safety_critical: true,
    sources: [S.nimesAmnio, S.hasT21],
  },
  {
    ...FAMILY,
    slug: 'biopsie-de-trophoblaste-choriocentese',
    title: 'La biopsie de trophoblaste (choriocentèse) : un prélèvement plus précoce',
    summary: 'Quand et comment se fait une biopsie de trophoblaste, en quoi elle diffère de l’amniocentèse, les précautions à prendre et les signes qui doivent faire consulter.',
    body_md: `La biopsie de trophoblaste, aussi appelée choriocentèse ou biopsie de villosités choriales, permet d’obtenir un diagnostic plus tôt dans la grossesse que l’amniocentèse.

## En bref
- Elle consiste à prélever un petit fragment du futur placenta (le trophoblaste), qui a le même patrimoine génétique que le fœtus dans la grande majorité des cas.
- Elle se fait en général entre 11 et 14 semaines d’aménorrhée.
- Elle est proposée par exemple après un dépistage combiné du 1er trimestre à risque élevé, ou en cas de maladie génétique connue dans la famille.
- Le prélèvement se fait le plus souvent à travers la paroi du ventre, sous contrôle échographique.
- Les premiers résultats arrivent en quelques jours ; d’autres analyses demandent 1 à 3 semaines.

## Comprendre
Comme l’amniocentèse, la biopsie de trophoblaste permet d’établir le caryotype du fœtus ou de rechercher une anomalie génétique précise. La HAS rappelle que le caryotype fœtal, obtenu par amniocentèse ou par choriocentèse, est le seul examen qui permet de poser un diagnostic de trisomie 21. Son intérêt principal est la précocité : réalisée dès la fin du 1er trimestre, elle donne une réponse plus tôt.

**Le déroulement**, d’après la fiche d’information du centre pluridisciplinaire de diagnostic prénatal du CHU de Nîmes : une échographie vérifie d’abord que les conditions sont favorables et choisit la technique. Le plus souvent, une aiguille est introduite à travers la paroi abdominale, sous échographie et dans des conditions stériles, pour aspirer quelques fragments. Une anesthésie locale peut être faite. D’autres voies, par le vagin, sont parfois utilisées.

**Les risques.** La même fiche indique un risque de fausse couche de l’ordre de 0,5 à 1 %, surtout dans les 8 à 10 jours suivant le geste, parfois sans signe annonciateur ; la HAS estime pour sa part ce risque à environ 0,1 % pour les prélèvements invasifs. Les infections graves sont exceptionnelles. Rarement, le prélèvement échoue ou le résultat est difficile à interpréter : il arrive qu’une anomalie soit limitée au placenta. Dans ce cas, une vérification par amniocentèse peut être proposée quelques semaines plus tard. Si la position du placenta n’est pas favorable, le geste peut être reporté ou remplacé par une amniocentèse.

**Si vous êtes Rhésus négatif**, une injection d’immunoglobulines anti-D est réalisée.

## Au quotidien
- **Vous n’avez pas besoin d’être à jeun** ni d’avoir la vessie très pleine, sauf consigne différente du centre.
- **Douchez-vous le matin** et portez des vêtements propres.
- **Apportez votre dossier** : carte Vitale, mutuelle, carte de groupe sanguin, échographies, sérologies, résultats des marqueurs sériques.
- **Informez l’équipe** de vos antécédents, de vos traitements et de vos allergies.
- **Prévoyez 24 heures de repos** : le repos au lit n’est pas nécessaire, mais évitez les efforts et faites-vous raccompagner.

## Questions fréquentes
**Pourquoi me propose-t-on une biopsie plutôt qu’une amniocentèse ?** Parce qu’elle peut être faite plus tôt, ou parce qu’une analyse génétique particulière le justifie. L’équipe vous explique ses raisons et les alternatives.

**Est-ce douloureux ?** La fiche du CHU de Nîmes décrit une piqûre pas plus douloureuse qu’une prise de sang.

**Puis-je reprendre le travail le lendemain ?** Le repos est conseillé pendant 24 heures. Parlez-en avec le médecin, qui peut adapter le conseil à votre activité.

**Qui m’annoncera les résultats ?** Ils sont envoyés à votre médecin, qui vous les communique. Demandez comment vous serez prévenue.

## Quand demander conseil
Consultez en urgence en cas de douleurs, de saignement, de perte de liquide ou de fièvre dans les jours qui suivent le prélèvement. ${URG} ${PSY}

${END}`,
    tags: ['biopsie de trophoblaste', 'choriocentèse', 'villosités choriales', 'caryotype', 'diagnostic prénatal', 'premier trimestre'],
    min_week: 10, max_week: 16,
    safety_critical: true,
    sources: [S.nimesBiopsie, S.hasT21, S.santeDPN],
  },
  {
    ...FAMILY,
    slug: 'cpdpn-centre-diagnostic-prenatal-anomalie-suspectee',
    title: 'Une anomalie est suspectée : le rôle du centre pluridisciplinaire de diagnostic prénatal (CPDPN)',
    summary: 'Ce qu’est un CPDPN, quand et comment un dossier y est présenté, les examens qui peuvent être proposés et le soutien dont vous pouvez bénéficier.',
    body_md: `Entendre qu’une échographie ou une analyse « doit être vérifiée » est souvent un choc. En France, des centres spécialisés accompagnent les futurs parents dans ces moments.

## En bref
- Un centre pluridisciplinaire de diagnostic prénatal (CPDPN) est une structure prévue par la loi de bioéthique.
- Il réunit notamment des gynécologues-obstétriciens, des échographistes spécialisés, des généticiens, des pédiatres et des psychologues.
- Votre dossier peut y être présenté par votre médecin, votre sage-femme ou votre échographiste, ou à votre demande, avec votre consentement écrit.
- Le centre propose des examens complémentaires, un suivi adapté, un lieu d’accouchement et un suivi après la naissance si besoin.
- Un soutien psychologique peut être demandé à tout moment.

## Comprendre
Selon l’Agence de la biomédecine, le diagnostic prénatal consiste à rechercher chez l’embryon ou le fœtus une malformation ou une maladie grave, d’origine génétique, infectieuse ou autre. Il est recommandé lorsqu’une maladie génétique grave est connue dans la famille ou lorsque l’échographie révèle une anomalie. Il est strictement encadré, et il ne garantit pas l’absence de toute maladie. Son objectif est de pouvoir soigner l’enfant à naître, ou d’aider les parents à se préparer à l’accueillir.

**Comment se passe la présentation d’un dossier ?** D’après le document d’information du CPDPN du CHU de Nîmes : le dossier médical (échographies, résultats biologiques) est transmis au centre avec votre consentement signé. Il est discuté lors d’une réunion pluridisciplinaire. Les propositions de prise en charge vous sont ensuite expliquées par votre médecin ou votre sage-femme référent, ou par un membre du centre. Un compte rendu écrit est adressé au professionnel qui a sollicité le centre et, si vous le souhaitez, à vous-même.

**Quels examens ?** Échographies diagnostiques, autres imageries comme l’IRM, prises de sang pour des analyses biologiques ou génétiques, prélèvements comme l’amniocentèse ou la biopsie de trophoblaste, consultations spécialisées (généticien, pédiatre…).

**Si une maladie d’une particulière gravité, reconnue comme incurable au moment du diagnostic, est confirmée**, le CPDPN en informe les parents. Seul ce centre peut délivrer, à la demande du couple, l’attestation permettant une interruption médicale de grossesse. C’est une décision qui appartient aux parents, accompagnés par l’équipe.

## Au quotidien
- **Demandez un écrit** ou prenez des notes : les informations sont nombreuses et l’émotion empêche souvent de tout retenir.
- **Venez à deux** ou avec une personne de confiance aux rendez-vous importants.
- **Posez toutes vos questions**, même celles qui vous paraissent naïves : quels sont les scénarios possibles, quels délais, quelles aides.
- **Demandez à rencontrer le psychologue** du centre : ce soutien est prévu pour tous les parents, quelle que soit la situation.
- **Prenez soin de vous** : sommeil, alimentation, arrêt de travail si nécessaire ; parlez-en à votre médecin.

## Questions fréquentes
**Puis-je contacter moi-même le CPDPN ?** Oui, certains centres acceptent une prise de contact directe par leur secrétariat. Le plus souvent, c’est votre professionnel qui organise la démarche.

**Suis-je obligée d’accepter les examens proposés ?** Non. Chaque examen nécessite votre accord, après une information claire sur ses bénéfices et ses risques.

**Le centre me suivra-t-il après la naissance ?** Selon la situation, un suivi postnatal adapté est proposé, en lien avec les pédiatres.

**Et si tout s’avère rassurant ?** Le suivi habituel de la grossesse reprend. Il est fréquent d’avoir besoin d’un peu de temps pour se remettre de cette inquiétude : n’hésitez pas à en parler.

## Quand demander conseil
${PSY} Vous pouvez aussi demander un rendez-vous avec le psychologue du centre ou de la maternité. ${URG}

${END}`,
    tags: ['CPDPN', 'diagnostic prénatal', 'anomalie échographie', 'malformation', 'conseil génétique', 'IMG', 'soutien psychologique'],
    safety_critical: true,
    sources: [S.nimesCpdpn, S.santeDPN, S.cneof],
  },
  // ───────────────────────────── Pratique et fin de grossesse ─────────────────────────────
  {
    ...FAMILY,
    category: 'droits-demarches',
    slug: 'examens-grossesse-remboursement-prise-en-charge',
    title: 'Examens de grossesse : ce qui est pris en charge et comment éviter d’avancer les frais',
    summary: 'Consultations, prises de sang, échographies, dépistages, examen bucco-dentaire : comment l’Assurance maladie prend en charge les examens de la grossesse.',
    body_md: `Entre les prises de sang, les échographies et les consultations, les examens de grossesse sont nombreux. La plupart sont pris en charge par l’Assurance maladie, à condition d’avoir bien déclaré votre grossesse.

## En bref
- Les examens de suivi de la grossesse sont pris en charge par l’Assurance maladie.
- Les consultations prénatales obligatoires (une avant la fin du 3e mois, puis une par mois) sont prises en charge à 100 %.
- À partir du 1er jour du 6e mois et jusqu’au 12e jour après l’accouchement, les frais médicaux remboursables sont pris en charge à 100 %, qu’ils soient liés ou non à la grossesse.
- L’examen bucco-dentaire de prévention est pris en charge à 100 %, sans avance de frais.
- Le tiers payant s’applique chez les professionnels de ville pour les soins pris en charge à 100 % au titre de la maternité ; les dépassements d’honoraires restent à votre charge.

## Comprendre
**La déclaration de grossesse ouvre les droits.** Elle doit être faite auprès de l’Assurance maladie avant la fin du 3e mois de grossesse. Pensez ensuite à mettre à jour votre carte Vitale.

**Les examens biologiques.** Selon la page de l’Assurance maladie consacrée à la prise en charge de la grossesse, les examens biologiques complémentaires prescrits dans ce cadre sont pris en charge à 100 %, y compris ceux du futur père. Le caryotype fœtal et le dépistage de certaines maladies génétiques, lorsqu’ils sont nécessaires, sont pris en charge à 100 % avec tiers payant.

**Les échographies.** Cette même page, datée de 2017, indique que les deux premières échographies, avant la fin du 5e mois, sont prises en charge à 70 %, et que la troisième, à partir du 6e mois, est prise en charge à 100 %. Un support d’information de la Sécurité sociale des Hautes-Alpes (Caf et CPAM) daté de janvier 2026 reprend la même règle pour les deux premières échographies (70 %, dans la limite des tarifs de base de l’Assurance maladie), puis rappelle qu’à partir du 6e mois tous les frais médicaux remboursables sont pris en charge à 100 %. D’autres échographies peuvent être prises en charge en cas de pathologie de la grossesse ou du bébé. Les taux pouvant évoluer, vérifiez votre situation sur votre compte ameli.

**La préparation à la naissance et à la parentalité.** Les séances animées par un médecin ou une sage-femme sont prises en charge à 100 %. Elles commencent le plus souvent au 7e mois.

**L’examen bucco-dentaire.** Il est proposé à partir du 4e mois et jusqu’à 6 mois après l’accouchement, pris en charge à 100 %. Les soins éventuels sont remboursés au taux habituel.

## Au quotidien
- **Vérifiez que votre déclaration de grossesse a bien été enregistrée** sur votre compte ameli.
- **Mettez à jour votre carte Vitale** en pharmacie ou à une borne après la déclaration.
- **Présentez votre carte Vitale** à chaque examen : c’est ce qui déclenche le tiers payant.
- **Demandez s’il y a un dépassement d’honoraires** avant une échographie dans un cabinet privé, et renseignez-vous auprès de votre mutuelle.
- **Gardez vos décomptes** en cas d’erreur : contactez votre caisse si un examen de grossesse n’a pas été pris en charge comme prévu.

## Questions fréquentes
**Mon conjoint doit-il payer ses analyses ?** Les examens biologiques prescrits au futur père dans le cadre de la grossesse sont pris en charge à 100 %, selon l’Assurance maladie.

**Les médicaments sont-ils remboursés à 100 % ?** À partir du 6e mois, les frais médicaux remboursables sont pris en charge à 100 %, y compris la pharmacie. Avant, le taux habituel s’applique hors examens obligatoires.

**Et si je n’ai pas de mutuelle ?** Renseignez-vous auprès de votre caisse : selon vos ressources, la Complémentaire santé solidaire peut vous aider. Une assistante sociale de la maternité ou de la PMI peut aussi vous accompagner.

**Le dépistage néonatal du bébé est-il payant ?** Non, il est gratuit.

## Quand demander conseil
Si une difficulté administrative vous fait renoncer à un examen, parlez-en à la sage-femme, à la PMI ou à l’assistante sociale de la maternité : des solutions existent. Ne reportez jamais une consultation urgente pour une question de remboursement. ${URG}

${END}`,
    tags: ['remboursement', 'prise en charge 100 %', 'tiers payant', 'échographie remboursée', 'carte Vitale', 'déclaration de grossesse', 'ameli'],
    sources: [S.ameliDroits, S.secu05Maternite, S.ameliDents],
  },
  {
    ...FAMILY,
    slug: 'monitoring-enregistrement-rythme-cardiaque-foetal',
    title: 'Le monitoring : à quoi sert l’enregistrement du rythme cardiaque du bébé ?',
    summary: 'Quand un monitoring est réalisé pendant la grossesse ou l’accouchement, comment il se déroule et quelle différence entre surveillance continue et auscultation intermittente.',
    body_md: `Deux capteurs posés sur le ventre, une ceinture, un appareil qui imprime des courbes : le « monito » fait partie des images classiques de la fin de grossesse. Voici ce qu’il mesure et pourquoi on le propose.

## En bref
- Le monitoring, ou cardiotocographie, enregistre le rythme cardiaque du bébé et les contractions de l’utérus.
- Pendant la grossesse, il est réalisé en cas de besoin : consultation aux urgences de la maternité, situation de surveillance particulière, terme dépassé, avant et après certains gestes.
- À l’arrivée en salle de naissance, l’état du bébé est évalué par un enregistrement d’environ 20 minutes ou par une auscultation intermittente.
- Pendant le travail, la HAS prévoit une surveillance continue ou intermittente, selon votre choix éclairé et l’organisation de la maternité.
- Si votre bébé bouge moins, contactez la maternité : un monitoring permet de vérifier son état.

## Comprendre
**Comment ça marche ?** Un capteur à ultrasons, placé sur le ventre, détecte les battements du cœur du bébé. Un second capteur mesure la tension du ventre, reflet des contractions. L’appareil trace les deux courbes en même temps, ce qui permet de voir comment le cœur du bébé réagit aux contractions. Les équipes interprètent l’enregistrement selon des classifications de référence.

**Pendant la grossesse.** L’Assurance maladie cite les enregistrements du rythme cardiaque fœtal parmi les examens de surveillance possibles, par exemple en cas de diabète gestationnel mal équilibré ou d’hypertension. Santé.fr indique qu’un enregistrement est fait avant et après une version par manœuvre externe, le geste qui aide un bébé en siège à se retourner.

**Pendant l’accouchement**, la HAS recommande, à l’admission, de vérifier que vous avez senti le bébé bouger dans les 24 heures précédentes et d’évaluer son état soit par un enregistrement continu d’environ 20 minutes, soit par une auscultation intermittente. Pendant le travail, deux options existent :
- **l’auscultation intermittente** : la sage-femme écoute le cœur pendant et juste après une contraction, toutes les 15 minutes en phase active, ce qui suppose une sage-femme disponible pour vous ;
- **l’enregistrement continu**, interprété selon des classifications de référence.
Après information sur les bénéfices et inconvénients de chacune, c’est vous qui choisissez, en tenant compte des possibilités de la maternité. La HAS recommande aussi que le matériel vous permette de bouger et de rester confortable.

## Au quotidien
- **Installez-vous confortablement** : demi-assise ou sur le côté plutôt qu’à plat sur le dos, qui peut provoquer un malaise.
- **Allez aux toilettes avant** : l’enregistrement dure en général au moins une vingtaine de minutes.
- **Signalez les mouvements du bébé** si l’équipe vous le demande.
- **Demandez des explications** sur la courbe : seule l’équipe peut interpréter les variations du rythme.
- **Exprimez vos souhaits** pour le travail : surveillance continue ou intermittente, possibilité de bouger, ballon. Notez-les dans votre projet de naissance.

## Questions fréquentes
**Le capteur ne trouve plus le cœur du bébé : est-ce grave ?** Le plus souvent, le bébé a simplement bougé. La sage-femme replace le capteur.

**Pourquoi refaire un monitoring alors que l’échographie était bonne ?** Les deux examens ne donnent pas les mêmes informations : l’échographie regarde la croissance et l’anatomie, le monitoring le rythme cardiaque à un moment donné.

**Faut-il un monitoring tous les jours en fin de grossesse ?** Non. Il est prescrit selon la situation, par exemple lorsque le terme est dépassé ou en cas de surveillance particulière.

**Puis-je bouger pendant le travail avec un monitoring ?** La HAS recommande que le matériel de surveillance permette de bouger et de rester confortable ; renseignez-vous sur les possibilités de votre maternité. Sous péridurale, la mobilisation se fait selon un protocole de l’équipe.

## Quand demander conseil
Appelez la maternité le jour même si votre bébé bouge moins ou différemment, si vous perdez du liquide, saignez, avez des contractions régulières, de la fièvre, ou des maux de tête intenses avec troubles de la vue. ${URG}

${END}`,
    tags: ['monitoring', 'monito', 'rythme cardiaque fœtal', 'cardiotocographie', 'bébé bouge moins', 'surveillance', 'salle de naissance'],
    min_week: 24,
    safety_critical: true,
    sources: [S.hasAcc, S.ameliDG, S.sante8],
  },
  {
    ...FAMILY,
    slug: 'examen-clinique-consultation-hauteur-uterine-toucher-vaginal',
    title: 'Poids, hauteur utérine, toucher vaginal : les gestes de la consultation prénatale',
    summary: 'Ce que mesure et vérifie la sage-femme ou le médecin lors de chaque consultation mensuelle, et pourquoi le toucher vaginal n’est pas systématique.',
    body_md: `En plus des prises de sang et des échographies, chaque consultation comprend un examen. Savoir à quoi sert chaque geste aide à se sentir actrice de son suivi.

## En bref
- À chaque consultation : poids, tension artérielle, recherche de sucre et de protéines dans les urines.
- À partir du 4e mois : mesure de la hauteur utérine, écoute du cœur du bébé, questions sur les mouvements et les contractions.
- En fin de grossesse : vérification de la présentation du bébé (tête en bas ou en siège).
- Le toucher vaginal n’est pas systématique : il est réalisé quand il apporte une information utile.
- Vous pouvez à tout moment poser des questions, demander une explication ou refuser un geste.

## Comprendre
Selon les recommandations de la HAS, l’examen clinique des consultations du 4e au 9e mois comprend : la mesure du poids et de la tension, la mesure de la **hauteur utérine** à partir du 4e mois, l’écoute des **bruits du cœur** du bébé, la recherche de **mouvements actifs** et de **contractions**, et l’appréciation de la **présentation** du bébé en fin de grossesse.

**La hauteur utérine** est la distance, mesurée avec un mètre ruban, entre le haut de l’os du pubis et le haut de l’utérus. Elle augmente au fil des mois et donne une idée de la croissance du bébé et de la quantité de liquide amniotique. Une mesure inattendue peut conduire à une échographie de contrôle.

**Le poids et la tension.** La prise de poids est suivie pour repérer une évolution trop rapide ou trop faible ; la tension sert notamment à repérer une hypertension ou une prééclampsie. Santé.fr précise qu’à la consultation du 8e mois, l’examen recherche aussi des signes d’hypertension : maux de tête, œdèmes, bourdonnements, troubles visuels.

**Les contractions.** Santé.fr indique qu’une fréquence inférieure à 10 contractions par jour est considérée comme habituelle au 8e mois ; des contractions plus rapprochées conduisent à vérifier le col.

**Le toucher vaginal.** Il n’est pas réalisé à chaque consultation : selon Santé.fr, il n’est pas systématique, car il peut être inconfortable ou provoquer des contractions. Il peut être proposé pour évaluer le col en cas de contractions ou en fin de grossesse.

## Au quotidien
- **Portez des vêtements faciles à ouvrir** au niveau du ventre.
- **Videz votre vessie avant l’examen**, sauf si on vous demande vos urines : apportez alors le flacon ou demandez-en un.
- **Préparez vos remarques** : mouvements du bébé, contractions, fuites, gonflements, sommeil, moral.
- **Demandez votre courbe de poids ou de hauteur utérine** si vous souhaitez suivre l’évolution.
- **Dites si un geste vous gêne** : le professionnel doit vous expliquer ce qu’il fait et recueillir votre accord. Vous pouvez demander une pause ou refuser.

## Questions fréquentes
**Ma hauteur utérine est plus petite que celle de mon amie : est-ce inquiétant ?** Elle varie d’une femme à l’autre selon la morphologie. C’est son évolution, mesurée par le professionnel, qui compte.

**Pourquoi me pèse-t-on à chaque fois ?** Le poids est un repère parmi d’autres, interprété sans jugement. Si la pesée vous met mal à l’aise, dites-le.

**Peut-on écouter le cœur du bébé à chaque rendez-vous ?** À partir du 4e mois, l’écoute des bruits du cœur fait partie de l’examen habituel.

**J’ai vécu des examens gynécologiques difficiles : puis-je le dire ?** Oui. Le professionnel peut adapter sa façon de faire, et vous proposer d’autres solutions ou un accompagnement.

## Quand demander conseil
N’attendez pas la consultation suivante en cas de contractions régulières avant 37 SA, de perte de liquide, de saignements, si le bébé bouge moins, ou en cas de maux de tête intenses avec troubles de la vue. ${URG}

${END}`,
    tags: ['hauteur utérine', 'toucher vaginal', 'consultation prénatale', 'examen clinique', 'poids grossesse', 'bruits du cœur', 'présentation'],
    min_week: 14,
    sources: [S.has, S.sante8],
  },
  {
    ...FAMILY,
    slug: 'examen-bucco-dentaire-prevention-grossesse',
    title: 'L’examen bucco-dentaire de grossesse : un rendez-vous de prévention pris en charge',
    summary: 'À partir du 4e mois, un examen chez le dentiste est proposé et pris en charge : invitation, démarches, déroulement et gencives qui saignent.',
    body_md: `Parmi les examens de la grossesse, il y en a un qu’on oublie facilement : le rendez-vous chez le dentiste. Il est pourtant prévu pour toutes, et pris en charge.

## En bref
- Un examen bucco-dentaire de prévention est proposé à partir du 4e mois de grossesse et jusqu’à 6 mois après l’accouchement.
- Il est pris en charge à 100 % par l’Assurance maladie.
- Vous recevez une invitation et un formulaire de prise en charge au 4e mois, par courrier ou sur votre compte ameli.
- Le dentiste vérifie dents et gencives, donne des conseils d’hygiène et aborde la santé bucco-dentaire du futur bébé.
- Les soins éventuels se font lors d’autres rendez-vous, remboursés au taux habituel.

## Comprendre
Pendant la grossesse, les changements hormonaux rendent les gencives plus fragiles. L’Assurance maladie décrit la **gingivite de grossesse** : elle apparaît en général entre le 3e et le 9e mois, les gencives deviennent rouges, gonflées et saignent facilement. Elle disparaît le plus souvent après l’accouchement, mais mérite un suivi chez le dentiste.

L’examen de prévention permet de faire le point au bon moment. Le dentiste examine l’état des dents et des gencives, vous conseille sur le brossage et, si des soins sont nécessaires, vous propose un ou plusieurs rendez-vous. Il parle aussi des premiers gestes pour les dents de votre enfant.

**Les démarches.** Prenez rendez-vous chez votre dentiste habituel ou un dentiste proche de chez vous. Le jour du rendez-vous, présentez votre carte Vitale à jour et le formulaire de prise en charge. Si vous l’avez perdu, demandez-le à votre caisse d’assurance maladie ou à votre dentiste, qui peut le rééditer. Le formulaire peut aussi être utilisé à l’hôpital.

## Au quotidien
- **Prenez rendez-vous dès réception de l’invitation** : les délais chez le dentiste peuvent être longs, et l’examen peut déboucher sur des soins à programmer.
- **Brossez-vous les dents deux fois par jour** avec une brosse souple et un dentifrice fluoré ; brossez plus doucement les zones qui saignent, sans les éviter.
- **Limitez les grignotages sucrés** entre les repas.
- **Dites au dentiste que vous êtes enceinte** et à quel terme : il adaptera ses soins si besoin.
- **Pensez à votre futur bébé** : profitez du rendez-vous pour demander des repères sur les premiers soins de ses dents, un sujet abordé lors de cet examen.

## Questions fréquentes
**Peut-on se faire soigner les dents enceinte ?** Oui, des soins peuvent être réalisés pendant la grossesse. Le dentiste choisit le moment et les techniques adaptés, en tenant compte de votre terme.

**Mes gencives saignent : dois-je arrêter de brosser ?** Non. Continuez à brosser doucement et consultez : un saignement des gencives est un motif de suivi chez le dentiste.

**L’examen est-il possible après la naissance ?** Oui, il reste accessible jusqu’à 6 mois après l’accouchement, selon l’Assurance maladie.

**J’ai perdu le formulaire : puis-je quand même faire l’examen ?** Oui. Demandez-le à votre caisse d’assurance maladie ou à votre dentiste, qui peut le rééditer, et présentez votre carte Vitale à jour.

**Les soins sont-ils gratuits ?** L’examen est pris en charge à 100 %. Les soins qui en découlent sont remboursés au taux habituel, et à 100 % à partir du 6e mois de grossesse pour les frais remboursables.

## Quand demander conseil
Consultez rapidement en cas de douleur dentaire importante, d’abcès, de gonflement de la joue ou de fièvre. ${URG}

${END}`,
    tags: ['dentiste', 'examen bucco-dentaire', 'gingivite de grossesse', 'gencives qui saignent', 'soins dentaires', 'prévention', 'M’T dents'],
    min_week: 14,
    sources: [S.ameliDents, S.ameliDroits],
  },
  {
    ...FAMILY,
    slug: 'examens-neuvieme-mois-fin-de-grossesse',
    title: 'Les examens du 9e mois : la dernière consultation avant l’accouchement',
    summary: 'Ce que comprend la 7e consultation prénatale, les analyses encore prévues, les documents à réunir et la surveillance si le terme est dépassé.',
    body_md: `La consultation du 9e mois est la dernière du suivi prénatal. Elle fait le point sur votre santé et celle du bébé, et vérifie que tout est prêt pour l’accouchement.

## En bref
- La 7e et dernière consultation prénatale a lieu au 9e mois.
- Analyses prévues : recherche de sucre et de protéines dans les urines, sérologie de la toxoplasmose si vous n’êtes pas immunisée.
- Si la 2e détermination du groupe sanguin n’a pas été faite, elle est réalisée ; la recherche d’anticorps irréguliers est répétée si vous êtes Rhésus négatif ou avez été transfusée.
- Les résultats du prélèvement pour le streptocoque B (fait entre 35 et 38 SA) et de la consultation d’anesthésie doivent figurer dans le dossier.
- La présentation du bébé et les modalités d’accouchement sont rediscutées.

## Comprendre
Selon la HAS, la consultation du 9e mois comprend obligatoirement la recherche de sucre et de protéines dans les urines et, si la précédente était négative, la sérologie de la toxoplasmose. Un ECBU peut être prescrit en cas d’antécédent d’infection urinaire ou de diabète. Service-public.fr précise que la 2e détermination du groupe sanguin est faite à ce moment si elle n’a pas eu lieu avant, et que la recherche d’anticorps irréguliers est répétée chez les femmes Rhésus négatif ou ayant été transfusées.

**L’examen clinique** reprend les gestes habituels : tension, poids, hauteur utérine, cœur du bébé, contractions. La position du bébé est vérifiée : tête en bas, siège ou autre. Santé.fr indique que la question de la voie d’accouchement, si elle était en suspens, est revue lors de cette visite ou à l’entrée en travail.

**Le streptocoque B.** Le prélèvement vaginal est réalisé entre 35 et 38 SA. Si vous êtes porteuse, un antibiotique vous sera donné pendant le travail pour protéger le bébé : vérifiez que le résultat est bien dans votre dossier.

**Et si le terme est dépassé ?** Une surveillance est organisée, avec des consultations et des examens rapprochés à la maternité (monitoring, échographie). L’équipe vous explique le calendrier et, si besoin, les modalités d’un déclenchement.

## Au quotidien
- **Réunissez votre dossier** : carte de groupe sanguin (deux déterminations), résultats de sérologies, comptes rendus d’échographies, résultat du streptocoque B, compte rendu d’anesthésie.
- **Gardez ce dossier dans votre sac** ou dans la valise de maternité.
- **Vérifiez le trajet et les numéros** : maternité, 15, personne qui vous accompagnera.
- **Faites la dernière prise de sang de toxoplasmose** à temps si vous n’êtes pas immunisée, et demandez si un contrôle après l’accouchement est prévu.
- **Préparez vos questions** sur le déroulement de l’accouchement, la douleur, l’allaitement, la sortie de maternité.

## Questions fréquentes
**Le bébé bouge moins en fin de grossesse : est-ce attendu ?** Ses mouvements changent car il a moins de place, mais vous devez continuer à le sentir bouger. S’il bouge moins ou différemment, appelez la maternité le jour même.

**Faut-il refaire une échographie au 9e mois ?** Elle n’est pas systématique. Elle peut être prescrite selon la situation, par exemple si le terme est dépassé.

**Que dois-je faire si je perds les eaux ?** Rendez-vous à la maternité, même sans contraction, et signalez le résultat de votre prélèvement de streptocoque B.

**J’ai oublié de faire la deuxième détermination du groupe sanguin : est-ce un problème ?** Signalez-le à la consultation : elle peut encore être faite, y compris à la maternité.

## Quand demander conseil
Allez à la maternité si vous perdez du liquide, saignez, avez des contractions régulières et douloureuses, de la fièvre, des maux de tête intenses avec troubles de la vue, ou si le bébé bouge moins. ${URG}

${END}`,
    tags: ['9e mois', 'dernière consultation', 'terme dépassé', 'toxoplasmose', 'groupe sanguin', 'streptocoque B', 'dossier maternité'],
    min_week: 36, max_week: 42,
    safety_critical: true,
    sources: [S.has, S.sp, S.sante8],
  },
];
