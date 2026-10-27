/** Guide complet — lot 15 (27/10/2026) : grossesse, petits maux complémentaires (rhume, toux, gorge, grippe, fièvre, gastro, maux de tête, migraine, insomnie, impatiences, gencives, nez, mycose, pertes, envies d'uriner, sciatique, canal carpien, essoufflement, palpitations, vertiges, démangeaisons, fatigue). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». Aucune dose de médicament. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est indiquée.
const S = {
  ameliMedGrossesse: { label: 'ameli.fr — Médicaments et grossesse', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/medicament-grossesse', consulted_on: C, published: '2025-04-28' },
  ameliRhume: { label: 'ameli.fr — Rhinopharyngite de l’adulte : quel traitement ?', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-adulte/traitement-medical', consulted_on: C, published: '2026-02-04' },
  ansmRhume: { label: 'ANSM — Vous avez un rhume : que faire ? (document patient)', url: 'https://ansm.sante.fr/uploads/2021/09/13/information-pour-les-patients-vous-avez-un-rhume-que-faire-2.pdf', consulted_on: C, published: '2020-09' },
  ameliToux: { label: 'ameli.fr — Quand consulter et comment calmer la toux ?', url: 'https://www.ameli.fr/assure/sante/themes/toux/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2018-06-15' },
  ameliGorge: { label: 'ameli.fr — Mal de gorge : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/mal-gorge/que-faire-consultation-medicale', consulted_on: C, published: '2021-02-08' },
  ameliGrippe: { label: 'ameli.fr — Grippe : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/grippe/que-faire-quand-consulter', consulted_on: C, published: '2026-09-25' },
  ameliGrippeVaccin: { label: 'ameli.fr — Le vaccin contre la grippe, essentiel pour protéger les femmes enceintes et leur futur enfant', url: 'https://www.ameli.fr/assure/actualites/le-vaccin-contre-la-grippe-essentiel-pour-proteger-les-femmes-enceintes-et-leur-futur-enfant', consulted_on: C, published: '2026-10-20' },
  ameliGastro: { label: 'ameli.fr — Diarrhée et gastro-entérite de l’adulte : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-adulte/bons-reflexes-que-faire', consulted_on: C, published: '2025-01-02' },
  ameliGastroTraitement: { label: 'ameli.fr — Gastro-entérite de l’adulte : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-adulte/consultation-traitement', consulted_on: C, published: '2025-01-03' },
  ameliMalTete: { label: 'ameli.fr — Mal de tête : comment être soulagé(e) et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/mal-tete/calmer-cas-faut-consulter', consulted_on: C, published: '2026-06-29' },
  ameliMigraine: { label: 'ameli.fr — Que faire et quand consulter en cas de migraine ?', url: 'https://www.ameli.fr/assure/sante/themes/migraine/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2025-10-17' },
  ameliMigraineTraitement: { label: 'ameli.fr — Migraine : consultation médicale et traitement', url: 'https://www.ameli.fr/assure/sante/themes/migraine/diagnostic-traitement', consulted_on: C, published: '2026-01-22' },
  ameliHta: { label: 'ameli.fr — Diagnostic de l’hypertension artérielle au cours de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/hypertension-arterielle-grossesse/diagnostic', consulted_on: C, published: '2025-07-24' },
  santePreeclampsie: { label: 'Santé.fr — Prééclampsie', url: 'https://www.sante.fr/preeclampsie', consulted_on: C, published: '2026-08-13' },
  santePreeclampsieGrave: { label: 'Santé.fr — Pré-éclampsie : une maladie de la grossesse fréquente et pouvant être gravissime', url: 'https://www.sante.fr/pre-eclampsie-une-maladie-de-la-grossesse-frequente-et-pouvant-etre-gravissime', consulted_on: C, published: '2021-12-30' },
  santeInsomnie: { label: 'Santé.fr — Insomnie', url: 'https://www.sante.fr/insomnie', consulted_on: C, published: '2026-08-12' },
  santeCalendrier: { label: 'Santé.fr (mpedia) — Le calendrier de grossesse', url: 'https://www.sante.fr/le-calendrier-de-grossesse', consulted_on: C, published: '2026-06-02' },
  santeConsult8: { label: 'Santé.fr — Grossesse : la consultation du 8e mois', url: 'https://www.sante.fr/grossesse-la-consultation-de-8eme-mois', consulted_on: C, published: '2018-01-11' },
  sante9eMois: { label: 'Santé.fr — 9e mois : suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/9eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C, published: '2025-07-09' },
  ameliSjsr: { label: 'ameli.fr — Jambes sans repos et mouvements périodiques nocturnes : définition et causes', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-jambes-sans-repos-impatiences/definition-causes', consulted_on: C, published: '2026-04-17' },
  ameliSjsrReflexes: { label: 'ameli.fr — Impatiences : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-jambes-sans-repos-impatiences/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2026-04-17' },
  ameliDents: { label: 'ameli.fr — Femme enceinte : prendre soin de ses dents', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/femme-enceinte-soins-dentaire-mtdents', consulted_on: C },
  ameliDentsBilan: { label: 'ameli.fr — Grossesse : soins dentaires et consultation chez le dentiste', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/grossesse-soins-dentaires-dentiste-consultation', consulted_on: C, published: '2026-07-14' },
  ameliNez: { label: 'ameli.fr — Saignement de nez ou épistaxis', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/epistaxis-saignement-de-nez', consulted_on: C },
  ameliVaginiteQueFaire: { label: 'ameli.fr — Mycose vaginale et autres vaginites : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/que-faire-quand-consulter', consulted_on: C, published: '2024-12-23' },
  ameliVaginite: { label: 'ameli.fr — Reconnaître une vaginite', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/definition-symptomes-facteurs-favorisants', consulted_on: C, published: '2025-01-06' },
  ameliVaginiteTraitement: { label: 'ameli.fr — Mycose vaginale et autres vaginites : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/themes/vaginite/consultation-traitement', consulted_on: C, published: '2024-12-23' },
  ameliInfections: { label: 'ameli.fr — Les infections bactériennes pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/infections/infections-bacteriennes', consulted_on: C, published: '2025-05-21' },
  ameliSciatique: { label: 'ameli.fr — Sciatique, comment la reconnaître ?', url: 'https://www.ameli.fr/assure/sante/themes/sciatique/reconnaitre-sciatique', consulted_on: C, published: '2023-12-06' },
  ameliSciatiqueReflexes: { label: 'ameli.fr — Sciatique : comment être soulagé(e) et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/sciatique/que-faire-quand-consulter', consulted_on: C, published: '2026-03-20' },
  ameliCarpien: { label: 'ameli.fr — Syndrome du canal carpien : définition, fréquence et causes', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-canal-carpien/comprendre-syndrome-canal-carpien', consulted_on: C, published: '2026-01-29' },
  ameliCarpienSymptomes: { label: 'ameli.fr — Symptômes, diagnostic et évolution du syndrome du canal carpien', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-canal-carpien/symptomes-diagnostic-evolution', consulted_on: C, published: '2025-05-05' },
  ameliCarpienTraitement: { label: 'ameli.fr — Traitement du syndrome du canal carpien', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-canal-carpien/traitement', consulted_on: C, published: '2025-05-05' },
  ameliActive: { label: 'ameli.fr — Enceinte et active : quelles précautions ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-activite-physique/enceinte-active-precautions', consulted_on: C, published: '2026-08-27' },
  ameliEssoufflement: { label: 'ameli.fr — Je suis brutalement essoufflé et j’ai du mal à respirer : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/essoufflement-recent/je-suis-brutalement-essouffle-et-j-ai-du-mal-respirer-que-faire', consulted_on: C, published: '2025-11-19' },
  ameliPalpitations: { label: 'ameli.fr — Que faire en cas de palpitations cardiaques ?', url: 'https://www.ameli.fr/assure/sante/themes/palpitations-cardiaques/bons-reflexes', consulted_on: C, published: '2026-03-12' },
  ameliMalaise: { label: 'ameli.fr — Réagir en cas d’urgence : perte de connaissance', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/perte-connaissance', consulted_on: C },
  ameliPrurit: { label: 'ameli.fr — Démangeaisons de la peau ou prurit cutané : définition et causes', url: 'https://www.ameli.fr/assure/sante/themes/demangeaisons-peau/definition-causes', consulted_on: C, published: '2026-04-16' },
  ameliPruritQueFaire: { label: 'ameli.fr — Que faire quand la peau gratte ?', url: 'https://www.ameli.fr/assure/sante/themes/demangeaisons-peau/que-faire', consulted_on: C },
  ameliAnemie: { label: 'ameli.fr — Qu’est-ce qu’une anémie par carence en fer et quelles sont les causes ?', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/definition-causes-anemie-carence-fer', consulted_on: C, published: '2026-06-09' },
  ameliAnemieSymptomes: { label: 'ameli.fr — Symptômes et diagnostic de l’anémie par carence en fer', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/symptomes-diagnostic', consulted_on: C, published: '2024-04-22' },
  santeHuilesEssentielles: { label: 'Santé.fr — Les huiles essentielles ont-elles prouvé leur efficacité et leur sécurité ?', url: 'https://www.sante.fr/decryptage/nos-reponses/les-huiles-essentielles-ont-elles-prouve-leur-efficacite-et-leur-securite', consulted_on: C, published: '2023-06-26' },
} satisfies Record<string, ArticleSource>;

/** Champs communs : parcours « grossesse ». */
const K: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['pregnant'], status: 'to_review' };

const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (sage-femme, médecin, pharmacien).';

export const GUIDE_B15: LibArticle[] = [
  {
    ...K, slug: 'rhume-enceinte-nez-bouche-que-faire', category: 'sante-grossesse',
    title: 'Rhume et nez bouché pendant la grossesse : comment se soulager',
    summary: 'Lavages de nez, repos, air frais : les gestes qui aident quand on est enceinte et enrhumée, et pourquoi les décongestionnants sont à éviter.',
    tags: ['rhume', 'nez bouché', 'rhinopharyngite', 'enceinte', 'lavage de nez', 'décongestionnant', 'vasoconstricteur', 'sérum physiologique'],
    sources: [S.ameliRhume, S.ansmRhume, S.ameliMedGrossesse],
    body_md: `## En bref
- Le rhume (rhinopharyngite) est d'origine virale et guérit spontanément, en général en 7 à 10 jours.
- Les lavages de nez au sérum physiologique ou à l'eau de mer, suivis d'un mouchage, sont le premier geste.
- Les médicaments **vasoconstricteurs** (décongestionnants, en comprimés ou en spray) sont **contre-indiqués pendant la grossesse**.
- Avant tout médicament, même vendu sans ordonnance, demandez l'avis de votre pharmacien, de votre sage-femme ou de votre médecin.

## Comprendre
Un rhume est une infection du nez et de la gorge causée par un virus. L'Assurance Maladie rappelle que les antibiotiques n'agissent que sur les bactéries : ils ne soignent donc pas un rhume, chez la femme enceinte comme chez les autres adultes. Le traitement vise seulement à vous soulager en attendant la guérison.

Les **décongestionnants** méritent une attention particulière. Ils réduisent la sensation de nez bouché, mais l'Agence nationale de sécurité du médicament (ANSM) signale des effets indésirables rares mais graves (infarctus, AVC, réactions cutanées sévères). L'Assurance Maladie indique qu'ils sont contre-indiqués pendant la grossesse et l'allaitement ; l'ANSM précise qu'ils sont fortement déconseillés pendant la grossesse et qu'un avis médical est indispensable avant toute prise. Depuis le 11 décembre 2024, les comprimés ne sont délivrés que sur ordonnance. Ces produits sont souvent associés, dans une même boîte, à d'autres substances : lisez toujours la composition.

Plus largement, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse et de signaler votre grossesse à tout professionnel qui vous conseille un traitement.

## Au quotidien
**Dégager le nez**
- Faites des lavages de nez réguliers (sérum physiologique, spray d'eau de mer ou d'eau thermale), puis mouchez-vous doucement, une narine après l'autre.
- Utilisez des mouchoirs à usage unique et jetez-les aussitôt.

**Mieux respirer la nuit**
- Dormez la tête un peu surélevée, avec un oreiller supplémentaire.
- Gardez la chambre fraîche, autour de 18 à 20 °C, et aérez-la chaque jour.
- Évitez la climatisation, qui assèche les muqueuses, ainsi que le tabac et la fumée des autres.

**Prendre soin de vous**
- Buvez régulièrement : eau, bouillons, tisanes adaptées à la grossesse (demandez conseil pour les plantes).
- Reposez-vous autant que possible ; le rhume fatigue, et la grossesse aussi.
- Protégez votre entourage : lavage des mains, toux dans le coude, masque si vous côtoyez des personnes fragiles.

**Si vous avez de la fièvre ou mal**
L'Assurance Maladie indique que le paracétamol est l'antalgique à privilégier et qu'il peut être utilisé pendant la grossesse, en respectant les règles d'usage de la notice. Les anti-inflammatoires (ibuprofène, kétoprofène…) sont à éviter : leur automédication est contre-indiquée pendant toute la grossesse, et ils sont formellement contre-indiqués à partir du 6e mois.

## Questions fréquentes
**Puis-je utiliser un spray nasal « pour nez bouché » acheté en pharmacie ?**
Tout dépend de sa composition. Les sprays d'eau de mer ou de sérum physiologique servent au lavage. Les sprays contenant un vasoconstricteur sont contre-indiqués pendant la grossesse. Montrez le produit à votre pharmacien et dites-lui que vous êtes enceinte.

**Un rhume peut-il gêner le bébé ?**
Un rhume simple touche surtout le nez et la gorge. En revanche, une fièvre au-dessus de 38 °C pendant la grossesse justifie d'appeler votre médecin dans la journée (voir notre article sur la fièvre pendant la grossesse).

**Les huiles essentielles peuvent-elles déboucher le nez ?**
L'Assurance Maladie déconseille fortement les huiles essentielles pendant la grossesse. Mieux vaut s'en tenir aux lavages de nez.

**Combien de temps dure un rhume ?**
En général 7 à 10 jours. Si les symptômes persistent ou ne s'améliorent pas après 5 jours, l'ANSM conseille de consulter.

## Quand demander conseil
Contactez votre médecin ou votre sage-femme dans la journée en cas de fièvre au-dessus de 38 °C, de douleur du visage ou d'oreille qui augmente, de symptômes qui durent plus de 5 jours ou qui s'aggravent. Appelez le **15** ou le **112** en cas de difficulté à respirer, de douleur dans la poitrine ou de malaise.

${FIN}`,
  },
  {
    ...K, slug: 'toux-pendant-la-grossesse-que-faire', category: 'sante-grossesse',
    title: 'Tousser pendant la grossesse : soulager la toux et savoir quand consulter',
    summary: 'Toux sèche ou grasse : les gestes qui apaisent, pourquoi les sirops ne sont pas anodins quand on est enceinte, et les signes qui doivent faire consulter.',
    tags: ['toux', 'toux sèche', 'toux grasse', 'sirop', 'enceinte', 'bronchite', 'fièvre', 'miel'],
    sources: [S.ameliToux, S.ameliMedGrossesse],
    body_md: `## En bref
- La toux accompagne souvent un rhume ou une infection virale ; une toux grasse régresse en général en deux à trois semaines.
- Certains médicaments contre la toux sont **contre-indiqués chez la femme enceinte** : demandez toujours conseil à votre pharmacien.
- Air sain, boissons, tête surélevée la nuit et miel peuvent apaiser.
- Toux avec fièvre au-dessus de 38 °C pendant la grossesse : consultez votre médecin **dans la journée**.

## Comprendre
Tousser est un réflexe de défense : la toux aide à dégager les voies respiratoires. On distingue la **toux sèche**, qui irrite sans rien ramener, et la **toux grasse**, qui fait remonter des sécrétions. Cette différence compte pour le choix d'un éventuel traitement.

L'Assurance Maladie rappelle que les antitussifs (médicaments qui calment la toux) sont souvent peu efficaces, peuvent entraîner des effets indésirables, dont une baisse de vigilance, et privent la toux de son rôle utile. Ils ne sont pas adaptés à une toux grasse. Quant aux expectorants et fluidifiants, ils ne font l'objet d'aucune recommandation scientifique. Surtout, **certains médicaments contre la toux sont contre-indiqués pendant la grossesse** : lisez la notice et parlez-en à votre pharmacien.

De façon générale, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse, y compris pour les produits vendus sans ordonnance ou à base de plantes.

## Au quotidien
**Assainir l'air**
- Évitez le tabac et les pièces enfumées ; si vous fumez, parlez-en à votre sage-femme ou à votre médecin, qui peuvent vous aider à arrêter.
- Aérez votre logement plusieurs fois par jour.
- Limitez les parfums d'intérieur, bougies parfumées et aérosols, qui irritent les voies respiratoires.

**La nuit**
- Surélevez votre tête avec un ou deux oreillers.
- Gardez un verre d'eau à portée de main.
- Si la toux vous réveille, levez-vous un moment, buvez quelques gorgées et respirez calmement.

**Boire et adoucir**
- Buvez régulièrement tout au long de la journée.
- Le miel peut apaiser la gorge, notamment avant le coucher.

**Ménager son corps**
- Si vous avez de petites fuites urinaires en toussant, parlez-en à votre sage-femme : elle peut vous conseiller.
- Reposez-vous : une infection, même banale, fatigue davantage pendant la grossesse.

## Questions fréquentes
**Puis-je prendre un sirop contre la toux ?**
Pas sans conseil. Certains sirops sont contre-indiqués pendant la grossesse et les antitussifs ne conviennent pas à une toux grasse. Votre pharmacien vous orientera selon le type de toux et le stade de votre grossesse.

**Ma toux dure depuis plus de deux semaines, est-ce inquiétant ?**
Une toux grasse peut durer deux à trois semaines. Au-delà de trois semaines malgré les mesures prises, ou si elle s'aggrave ou gêne vos activités, l'Assurance Maladie conseille de consulter.

**J'ai de la fièvre et je tousse : que faire ?**
Pendant la grossesse, une fièvre au-dessus de 38 °C avec une toux justifie de consulter votre médecin dans la journée.

**Tousser fort, est-ce un souci pour la grossesse ?**
Une toux forte et répétée est surtout fatigante et inconfortable (ventre, côtes). Parlez-en si elle devient pénible, et consultez sans attendre si vous ressentez des douleurs du ventre, des contractions ou un écoulement en toussant.

## Quand demander conseil
Consultez dans la journée en cas de fièvre au-dessus de 38 °C, d'essoufflement ou d'autres symptômes associés. Consultez dans les jours qui viennent si la toux persiste au-delà de trois semaines, s'aggrave ou devient gênante. Appelez le **15** ou le **112** sans tarder en cas de difficulté à inspirer, de douleur dans la poitrine avec crachats sanglants ou mousseux, ou de sensation d'étouffement.

${FIN}`,
  },
  {
    ...K, slug: 'mal-de-gorge-pendant-la-grossesse', category: 'sante-grossesse',
    title: 'Mal de gorge pendant la grossesse : apaiser et repérer ce qui doit faire consulter',
    summary: 'Boissons, aliments frais, voix au repos : comment soulager un mal de gorge enceinte, et quels médicaments demandent de la prudence.',
    tags: ['mal de gorge', 'angine', 'gorge qui gratte', 'pastilles', 'enceinte', 'paracétamol', 'anti-inflammatoire'],
    sources: [S.ameliGorge, S.ameliMedGrossesse, S.ameliRhume],
    body_md: `## En bref
- Un mal de gorge accompagne souvent un rhume et passe en quelques jours.
- Boire souvent par petites gorgées, manger frais et ménager sa voix aident à se sentir mieux.
- Les **anti-inflammatoires** (AINS) sont contre-indiqués à partir du 6e mois de grossesse, et leur automédication est contre-indiquée pendant toute la grossesse.
- Difficulté à respirer ou à avaler : consultez **dans la journée**.

## Comprendre
La gorge irritée, qui gratte ou qui brûle en avalant, est le plus souvent liée à une infection virale de la sphère ORL. L'Assurance Maladie explique que la production de salive aide à calmer l'inflammation : c'est pourquoi sucer une pastille ou un bonbon soulage souvent.

Pendant la grossesse, le choix des produits demande plus d'attention. L'Assurance Maladie indique que le paracétamol peut être utilisé pendant la grossesse, en respectant la notice, et que les AINS (comme l'ibuprofène) sont contre-indiqués à partir du 6e mois. Plus largement, elle rappelle que toute automédication par AINS est contre-indiquée pendant la grossesse, même en gel ou en crème. Les pastilles, collutoires et bains de bouche vendus en pharmacie contiennent des substances variées : demandez au pharmacien ce qui convient à votre situation.

## Au quotidien
**Ce qui soulage**
- Sucez des pastilles adaptées (conseillées par votre pharmacien) ou des bonbons : la salive apaise la gorge.
- Préférez les aliments frais et faciles à avaler : yaourts, compotes, soupes tièdes, purées.
- Évitez les boissons et plats très chauds, épicés ou acides, qui irritent.
- Buvez souvent, par petites gorgées.

**Ménager sa gorge**
- Ne forcez pas sur la voix et évitez de vous racler la gorge.
- Aérez votre chambre chaque jour et gardez une température modérée.
- Tenez-vous loin de la fumée de tabac.

**Traiter la cause**
- Si le nez coule ou est bouché, les lavages de nez limitent l'écoulement dans la gorge.
- Si votre mal de gorge vient plutôt de remontées acides (fréquentes en fin de grossesse), le soulagement passe par d'autres gestes : repas plus légers, ne pas s'allonger juste après manger. Parlez-en à votre sage-femme.
- En cas d'allergie connue (pollens, poussière), limitez l'exposition.

## Questions fréquentes
**Puis-je prendre des pastilles vendues sans ordonnance ?**
Certaines contiennent des anesthésiques locaux, des antiseptiques ou d'autres substances. Signalez votre grossesse au pharmacien, qui vous conseillera un produit adapté.

**Comment savoir si c'est une angine ?**
Seul un professionnel peut le dire après examen. Une angine due à une bactérie se traite par antibiotique, alors qu'une infection virale guérit seule. Si la douleur est forte, s'accompagne de fièvre ou ne passe pas, consultez.

**Le mal de gorge peut-il venir de l'estomac ?**
Oui, des remontées acides peuvent irriter la gorge. L'Assurance Maladie cite le reflux parmi les causes à traiter pour soulager un mal de gorge.

**Au bout de combien de temps consulter ?**
Si le mal de gorge ne régresse pas après 5 jours, s'il revient souvent ou si une fatigue importante persiste plus d'une semaine, consultez votre médecin.

## Quand demander conseil
Consultez dans la journée si vous avez du mal à respirer ou à avaler, si vous ne parvenez plus à boire, ou en cas de fièvre au-dessus de 38 °C. Consultez dans les jours qui viennent si le mal de gorge dure plus de 5 jours ou revient souvent. Appelez le **15** ou le **112** si vous avez une gêne respiratoire importante, des lèvres bleutées ou un malaise.

${FIN}`,
  },
  {
    ...K, slug: 'grippe-pendant-la-grossesse-reagir', category: 'sante-grossesse', safety_critical: true,
    title: 'Grippe pendant la grossesse : reconnaître, réagir vite et se protéger',
    summary: 'Pourquoi la grippe demande de consulter rapidement quand on est enceinte, ce que vous pouvez faire à la maison, et l’intérêt du vaccin.',
    tags: ['grippe', 'fièvre', 'courbatures', 'enceinte', 'vaccin grippe', 'virus', 'hiver', 'gestes barrières'],
    sources: [S.ameliGrippe, S.ameliGrippeVaccin, S.ameliToux],
    body_md: `## En bref
- Les femmes enceintes sont particulièrement vulnérables face à la grippe : en cas de symptômes, **consultez rapidement votre médecin**.
- À la maison : boire beaucoup, se reposer, vêtements légers, masque et gestes barrières.
- La vaccination est possible **quel que soit le trimestre** et protège aussi le bébé pendant ses 6 premiers mois.
- Essoufflement au repos, fièvre qui revient après une amélioration ou troubles de la conscience : il faut un avis médical très vite.

## Comprendre
La grippe est une infection virale qui débute souvent brutalement : fièvre élevée, courbatures, grande fatigue, maux de tête, toux. L'Assurance Maladie présente les femmes enceintes comme très vulnérables face à cette maladie : une grippe peut entraîner une atteinte pulmonaire sévère, une hospitalisation ou une naissance prématurée. C'est pourquoi la grossesse figure parmi les situations où il faut **consulter rapidement** son médecin traitant en cas de grippe, sans attendre que les symptômes s'aggravent.

La prévention repose d'abord sur le **vaccin**. Selon l'Assurance Maladie, il peut être fait dès le début de la campagne de vaccination, quel que soit le trimestre de grossesse. Les anticorps de la mère protègent l'enfant pendant ses 6 premiers mois, période où il est le plus fragile et ne peut pas être vacciné lui-même. L'Assurance Maladie indique que ces vaccins ne sont associés à aucun sur-risque de fausse couche, de malformation ou de maladie de l'enfant.

## Au quotidien
**Si vous pensez avoir la grippe**
- Appelez votre médecin traitant ou votre sage-femme pour être examinée rapidement ; signalez que vous êtes enceinte et à combien de semaines.
- Buvez régulièrement et abondamment tant que vous avez de la fièvre.
- Portez des vêtements légers, évitez de vous couvrir de couettes épaisses.
- Reposez-vous ; faites-vous aider pour les repas, les courses et les aînés.
- Pour la fièvre et les douleurs, l'Assurance Maladie indique que le paracétamol est généralement conseillé, en respectant ses contre-indications ; demandez l'avis du médecin ou du pharmacien. Pas d'anti-inflammatoire sans avis médical.

**Protéger l'entourage**
- Portez un masque dès que vous n'êtes pas seule.
- Lavez-vous souvent les mains, toussez dans votre coude.

**Se faire vacciner**
- Le vaccin peut être prescrit et fait par un médecin, une sage-femme, un pharmacien ou un infirmier.
- Un bon de prise en charge permet de retirer le vaccin sans frais en pharmacie.
- Les gestes barrières viennent en complément, pendant toute la saison.

## Questions fréquentes
**Est-ce une grippe ou un rhume ?**
Le rhume touche surtout le nez et la gorge, avec peu ou pas de fièvre. La grippe donne en général une fièvre plus élevée, des courbatures et une fatigue marquée. Dans le doute, appelez votre médecin.

**Puis-je me faire vacciner au premier trimestre ?**
Oui : l'Assurance Maladie indique que la vaccination est possible quel que soit le trimestre.

**J'ai été vaccinée l'an dernier, est-ce suffisant ?**
Le vaccin contre la grippe est adapté chaque année aux virus en circulation : il se refait à chaque saison. Parlez-en à votre sage-femme ou à votre pharmacien.

**Le bébé est-il protégé à la naissance si je suis vaccinée ?**
Oui, c'est l'un des grands intérêts du vaccin pendant la grossesse : il protège le nourrisson pendant ses 6 premiers mois.

## Quand demander conseil
Consultez rapidement votre médecin dès les premiers symptômes de grippe. Demandez un avis médical très vite en cas d'essoufflement au repos ou de difficulté à respirer, de fièvre qui réapparaît après une amélioration, de toux avec crachats purulents ou sanglants, de diarrhée avec déshydratation ou de fièvre mal supportée. Appelez le **15** ou le **112** en cas de difficulté respiratoire importante, de douleur dans la poitrine, de confusion ou de malaise.

${FIN}`,
  },
  {
    ...K, slug: 'fievre-pendant-la-grossesse-que-faire', category: 'sante-grossesse', safety_critical: true,
    title: 'Fièvre pendant la grossesse : les bons réflexes',
    summary: 'Au-delà de 38 °C, une fièvre pendant la grossesse justifie un avis médical dans la journée : comment la mesurer, quoi faire en attendant, quand appeler le 15.',
    tags: ['fièvre', 'température', '38 degrés', 'enceinte', 'infection', 'frissons', 'paracétamol', 'quand consulter'],
    sources: [S.ameliToux, S.ameliGrippe, S.ameliInfections],
    body_md: `## En bref
- Pendant la grossesse, une température **au-dessus de 38 °C** justifie de contacter votre médecin ou votre sage-femme **dans la journée**.
- La fièvre est un signe, pas une maladie : il faut en chercher la cause (virus, infection urinaire, autre infection).
- En attendant : boire, se reposer, se découvrir ; demandez conseil avant tout médicament.
- Fièvre avec difficulté à respirer, contractions, perte de liquide ou malaise : appelez le **15** ou partez à la maternité.

## Comprendre
La fièvre traduit le plus souvent une réaction de l'organisme à une infection. Pendant la grossesse, elle mérite une attention particulière, car certaines infections doivent être recherchées et traitées rapidement. L'Assurance Maladie indique ainsi qu'une femme enceinte qui a une température supérieure à 38 °C, par exemple avec une toux, doit consulter son médecin dans la journée. En cas de grippe, la grossesse fait partie des situations où il faut consulter rapidement.

Parmi les causes possibles, les **infections urinaires** sont fréquentes pendant la grossesse, car la pression du bébé sur la vessie favorise la stase des urines. Leurs symptômes sont souvent discrets ; l'Assurance Maladie souligne que le principal risque est l'infection des reins (pyélonéphrite), qui peut entraîner un accouchement prématuré. C'est l'une des raisons pour lesquelles une fièvre doit être examinée par un professionnel.

## Au quotidien
**Mesurer correctement**
- Utilisez un thermomètre médical, au repos, en dehors d'un bain chaud ou d'un effort.
- Notez l'heure et la valeur ; recommencez quelques heures plus tard si besoin.
- Notez aussi les autres signes : frissons, toux, brûlures en urinant, douleurs du dos ou du ventre, éruption, contractions.

**En attendant l'avis médical**
- Buvez régulièrement et abondamment.
- Portez des vêtements légers, évitez les couvertures épaisses, gardez la pièce aérée.
- Reposez-vous.
- Pour un médicament contre la fièvre, demandez l'avis du médecin, de la sage-femme ou du pharmacien. L'Assurance Maladie indique que le paracétamol est généralement conseillé contre la fièvre, dans le respect de ses contre-indications ; les anti-inflammatoires ne doivent pas être pris en automédication pendant la grossesse.

**Préparer l'appel**
- Ayez sous la main votre terme (en semaines), vos traitements en cours et vos derniers résultats d'analyses.
- Si votre maternité dispose d'un numéro pour les urgences obstétricales, gardez-le dans votre téléphone.

## Questions fréquentes
**38 °C, est-ce vraiment de la fièvre ?**
Le repère donné par l'Assurance Maladie pour consulter pendant la grossesse est une température supérieure à 38 °C. En dessous, surveillez l'évolution et les autres symptômes.

**Puis-je attendre le lendemain si je me sens bien ?**
Le conseil officiel est de consulter dans la journée. Un appel à votre médecin, à votre sage-femme ou à la maternité permet d'évaluer la situation.

**La fièvre peut-elle venir d'une infection urinaire sans brûlures ?**
Oui, les symptômes d'infection urinaire sont souvent peu marqués pendant la grossesse. C'est pourquoi une bandelette urinaire est faite chaque mois à partir du 4e mois, et pourquoi une fièvre doit être examinée.

**Et en fin de grossesse ?**
Une fièvre associée à des contractions, à une perte de liquide ou à des pertes inhabituelles nécessite de contacter la maternité sans attendre.

## Quand demander conseil
Contactez votre médecin ou votre sage-femme dans la journée pour toute fièvre au-dessus de 38 °C. Appelez la maternité ou le **15** (ou le **112**) sans attendre en cas de fièvre avec difficulté à respirer, douleur dans la poitrine, raideur de la nuque, confusion, contractions, perte de liquide, saignements ou si votre bébé bouge moins.

${FIN}`,
  },
  {
    ...K, slug: 'gastro-enterite-pendant-la-grossesse', category: 'sante-grossesse',
    title: 'Gastro-entérite pendant la grossesse : s’hydrater et savoir quand consulter',
    summary: 'Diarrhée, vomissements : boire avant tout, manger léger, éviter les médicaments sans avis, et repérer les signes de déshydratation.',
    tags: ['gastro', 'gastro-entérite', 'diarrhée', 'vomissements', 'déshydratation', 'enceinte', 'hydratation', 'virus'],
    sources: [S.ameliGastro, S.ameliGastroTraitement, S.ameliMedGrossesse],
    body_md: `## En bref
- La priorité est d'**éviter la déshydratation** : buvez plus que d'habitude, par petites quantités, souvent.
- Petits repas simples (riz, pâtes, pommes de terre, carottes cuites, bouillons) et pause temporaire des produits laitiers.
- Pas de médicament contre la diarrhée ou les vomissements sans l'avis de votre pharmacien ou de votre médecin.
- Urines rares, bouche sèche, somnolence ou impossibilité de boire : consultez **immédiatement**.

## Comprendre
La gastro-entérite est une infection du tube digestif, le plus souvent due à un virus. Elle provoque diarrhée, parfois vomissements, douleurs du ventre et fièvre. L'Assurance Maladie rappelle que la prise en charge vise d'abord à éviter la déshydratation et la contamination de l'entourage, et que les antibiotiques ne sont pas utiles dans la grande majorité des cas, puisque les diarrhées aiguës sont surtout d'origine virale.

Pendant la grossesse, la déshydratation est à surveiller de près : ses signes (urines rares, bouche sèche, soif intense, somnolence) doivent faire consulter immédiatement. Par ailleurs, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse, y compris pour les médicaments sans ordonnance : signalez toujours votre grossesse au pharmacien.

Si vous vomissez depuis le début de la grossesse, sans diarrhée ni fièvre, il s'agit plus probablement de nausées et vomissements de grossesse, qui ont leur propre prise en charge : parlez-en à votre sage-femme ou à votre médecin.

## Au quotidien
**Boire, encore et souvent**
- Buvez davantage que d'habitude : eau, eau légèrement sucrée, bouillon de légumes salé.
- Si vous vomissez, buvez par toutes petites gorgées, à intervalles réguliers, plutôt qu'un grand verre d'un coup.
- Le médecin peut prescrire un soluté de réhydratation orale, à prendre fréquemment par petites quantités.
- Évitez les boissons glacées.

**Manger léger**
- Privilégiez de petits repas plus fréquents : riz, pâtes, semoule, pommes de terre, carottes cuites, viandes maigres bien cuites, bouillons.
- Évitez temporairement les fruits et légumes crus et les aliments riches en fibres (la banane fait exception).
- Mettez de côté le lait et les produits laitiers quelques jours.
- Ne vous forcez pas à manger les premières heures : boire compte davantage.

**Éviter de contaminer les autres**
- Lavez-vous très souvent les mains, surtout après être allée aux toilettes et avant de cuisiner.
- Ne partagez ni serviette, ni couverts, ni verre.
- Si possible, laissez quelqu'un d'autre préparer les repas de la famille.

**Se reposer**
Allongez-vous dès que possible, levez-vous lentement pour limiter les étourdissements.

## Questions fréquentes
**Puis-je prendre un médicament contre la diarrhée ?**
Demandez conseil d'abord. L'Assurance Maladie précise que les ralentisseurs du transit sont à éviter en cas de sang dans les selles et ne remplacent pas l'hydratation, et que les pansements intestinaux peuvent diminuer l'effet d'autres médicaments. Pendant la grossesse, l'avis du pharmacien ou du médecin est indispensable.

**La gastro peut-elle déclencher des contractions ?**
Une gastro rend le ventre douloureux et peut être difficile à distinguer de contractions. Si vous ressentez des contractions régulières, des douleurs qui ne passent pas ou une perte de liquide, contactez la maternité.

**Comment éviter une gastro quand les enfants l'ont ?**
Lavage des mains fréquent, linge et toilettes nettoyés, couverts séparés. Faites-vous aider pour les soins des enfants malades si possible.

**Au bout de combien de temps consulter ?**
Si la diarrhée ou les vomissements durent plus de deux jours, consultez. Pendant la grossesse, n'hésitez pas à appeler plus tôt en cas de fièvre, de douleurs ou si vous ne gardez rien.

## Quand demander conseil
Consultez dans la journée en cas de forte fièvre, de douleurs importantes, de grande fatigue ou si vous ne parvenez pas à boire. Consultez dans les jours qui viennent si les symptômes durent plus de deux jours ou s'il y a du sang ou des glaires dans les selles. Consultez **immédiatement** en cas de signes de déshydratation (urines rares, soif intense, bouche sèche, somnolence, confusion), et appelez le **15** ou le **112** si vous ne tenez plus debout ou faites un malaise.

${FIN}`,
  },
  {
    ...K, slug: 'maux-de-tete-pendant-la-grossesse-soulager', category: 'corps-grossesse',
    title: 'Maux de tête pendant la grossesse : soulager et repérer les signes d’alerte',
    summary: 'Repos, hydratation, repas réguliers : les gestes pour un mal de tête ordinaire, ce qu’il faut savoir sur les antalgiques, et quand le mal de tête doit faire consulter.',
    tags: ['mal de tête', 'maux de tête', 'céphalée', 'enceinte', 'paracétamol', 'ibuprofène', 'fatigue', 'écrans'],
    sources: [S.ameliMalTete, S.ameliHta, S.santeConsult8],
    body_md: `## En bref
- Repos au calme, eau, repas réguliers et moins d'écrans soulagent souvent un mal de tête ordinaire.
- Le paracétamol peut être utilisé pendant la grossesse, à la plus petite dose efficace et le moins longtemps possible : demandez conseil.
- Les anti-inflammatoires (ibuprofène…) sont contre-indiqués à partir du 6e mois ; avant, n'en prenez pas sans avis médical.
- Un mal de tête inhabituel, surtout en deuxième partie de grossesse, avec troubles de la vue, bourdonnements d'oreilles ou gonflement : consultez **en urgence**.

## Comprendre
Les maux de tête ont de nombreuses causes : fatigue, manque de sommeil, repas sautés, déshydratation, tension, écrans, chaleur. La grossesse, avec ses bouleversements de rythme et de sommeil, peut les favoriser. Souvent, du repos et quelques mesures simples suffisent à les soulager.

Pendant la grossesse, deux points méritent d'être connus. D'abord les **médicaments** : l'Assurance Maladie indique que le paracétamol est l'antalgique à privilégier et qu'il peut être pris pendant la grossesse, à la plus petite dose efficace et sur la durée la plus courte ; elle rappelle aussi qu'un surdosage peut entraîner des lésions graves du foie. Les AINS, eux, sont contre-indiqués à partir du 6e mois de grossesse ; avant, ne les prenez pas sans avis médical.

Ensuite, à partir de la deuxième moitié de la grossesse, un mal de tête **inhabituel** peut être un signe d'hypertension. Santé.fr cite, parmi les signes d'hypertension à signaler, les maux de tête, les gonflements des mains, du visage ou des pieds, les bourdonnements d'oreilles et les « petites mouches » devant les yeux.

## Au quotidien
**Dès les premiers signes**
- Faites une pause au calme, dans une pièce peu éclairée, et allongez-vous si possible.
- Buvez un grand verre d'eau, puis régulièrement dans la journée.
- Mangez quelque chose si votre dernier repas date : sauter un repas peut déclencher ou entretenir un mal de tête.
- Éloignez-vous des écrans.

**Prévenir**
- Gardez des repas et des collations réguliers.
- Essayez de dormir à des heures régulières, sans forcément dormir plus que d'habitude (dormir trop peut aussi aggraver une céphalée).
- Bougez chaque jour à votre rythme : une marche à l'air frais aide souvent.
- Aérez les pièces, évitez la chaleur excessive et les lieux enfumés.

**Garder une trace**
Notez dans un carnet ou votre téléphone les jours, l'heure, la durée et les circonstances de vos maux de tête : c'est utile pour en parler lors de votre consultation mensuelle.

## Questions fréquentes
**Puis-je prendre le même médicament qu'avant ma grossesse ?**
Pas forcément. Beaucoup de médicaments contre la douleur contiennent des anti-inflammatoires ou des associations de substances. Montrez votre boîte à votre pharmacien ou à votre sage-femme avant de la reprendre.

**Le paracétamol est-il possible pendant toute la grossesse ?**
L'Assurance Maladie indique qu'il peut être utilisé pendant la grossesse, en respectant la notice, à la plus petite dose efficace et le moins longtemps possible. Si vous en avez besoin plusieurs jours de suite, parlez-en.

**Pourquoi me prend-on la tension à chaque consultation ?**
La tension est mesurée à chaque consultation mensuelle pour dépister une hypertension, qui peut se manifester notamment par des maux de tête.

## Quand demander conseil
Parlez-en à votre médecin ou à votre sage-femme si les maux de tête deviennent fréquents, changent de caractère ou ne cèdent pas. Consultez **dans la journée** pour un mal de tête nouveau et intense, ou accompagné de vomissements, de baisse de la vision ou de grande fatigue. À partir de la deuxième moitié de la grossesse, un mal de tête inhabituel avec troubles visuels, bourdonnements d'oreilles ou gonflement rapide du visage ou des mains impose une consultation **en urgence**. Appelez le **15** ou le **112** pour un mal de tête brutal et violent, avec faiblesse d'un côté du corps, troubles de la parole, confusion, fièvre ou raideur de la nuque.

${FIN}`,
  },
  {
    ...K, slug: 'migraine-et-grossesse', category: 'corps-grossesse',
    title: 'Migraine et grossesse : ce qui change et comment gérer les crises',
    summary: 'La grossesse est souvent une période plus calme pour les migraineuses ; voici comment gérer une crise, adapter son traitement et prévenir les déclencheurs.',
    tags: ['migraine', 'crise de migraine', 'enceinte', 'traitement de fond', 'triptan', 'céphalée', 'déclencheurs'],
    sources: [S.ameliMigraineTraitement, S.ameliMigraine, S.ameliMedGrossesse],
    body_md: `## En bref
- Selon l'Assurance Maladie, la grossesse est en général un moment d'accalmie pour les femmes migraineuses.
- Ne prenez **aucun médicament** contre la migraine, ni pour la crise ni en traitement de fond, sans en parler à votre médecin.
- L'aspirine et les anti-inflammatoires sont contre-indiqués ; certains traitements de fond le sont aussi.
- Une pièce calme et sombre, un linge froid sur le front et de l'eau aident pendant la crise.

## Comprendre
La migraine est une maladie qui se manifeste par des crises de maux de tête souvent intenses, parfois accompagnées de nausées et d'une gêne à la lumière ou au bruit. Beaucoup de femmes migraineuses constatent moins de crises pendant leur grossesse : l'Assurance Maladie parle d'un moment d'accalmie.

Les traitements, en revanche, doivent être revus. D'après l'Assurance Maladie :
- pour la crise, le **paracétamol** est le traitement de première intention pendant la grossesse ; certains **triptans** peuvent être utilisés si le paracétamol ne suffit pas, sur prescription ;
- l'**aspirine** et les **anti-inflammatoires non stéroïdiens** (AINS) sont contre-indiqués ;
- parmi les traitements de fond, le **topiramate** est contre-indiqué pendant la grossesse, et les **anti-CGRP** sont à éviter car leurs effets chez la femme enceinte sont mal connus.

Si vous preniez un traitement de fond avant d'être enceinte, ne l'arrêtez pas et ne le modifiez pas seule : contactez votre médecin dès que vous apprenez votre grossesse, pour faire le point ensemble.

## Au quotidien
**Pendant une crise**
- Allongez-vous dans une pièce calme et sombre.
- Posez un linge frais sur votre front.
- Buvez de l'eau, surtout si vous avez vomi.
- Si votre médecin vous a indiqué un traitement compatible avec la grossesse, prenez-le dès le début de la crise, comme il vous l'a expliqué.

**Limiter les déclencheurs**
- Gardez des horaires de lever et de coucher réguliers et un sommeil suffisant.
- Mangez à heures régulières, sans sauter de repas, et buvez régulièrement.
- Bougez chaque jour, à un rythme adapté à votre grossesse : la marche est une bonne option.
- Si certains aliments déclenchent vos crises (chocolat, aliments contenant du glutamate…), réduisez-les sans pour autant suivre un régime strict.
- Prenez des temps de relaxation et évitez les lieux bruyants quand c'est possible.

**Tenir un calendrier des crises**
Notez la date, la durée, l'intensité, les circonstances et ce que vous avez pris. Ce calendrier aide votre médecin à adapter la prise en charge.

## Questions fréquentes
**Mes crises ne diminuent pas, est-ce inquiétant ?**
Chaque grossesse est différente. Si les crises restent fréquentes ou intenses, parlez-en à votre médecin : il existe des options compatibles avec la grossesse.

**Puis-je reprendre mon triptan habituel ?**
Seul votre médecin peut le dire : l'Assurance Maladie précise que certains triptans peuvent être utilisés pendant la grossesse si le paracétamol est inefficace, mais pas tous, et toujours sur prescription.

**Comment distinguer ma migraine habituelle d'un autre mal de tête ?**
Si le mal de tête ne ressemble pas à vos crises habituelles (plus brutal, plus intense, avec des troubles visuels différents, des bourdonnements, un gonflement du visage ou des mains, ou de la fièvre), consultez sans attendre.

## Quand demander conseil
Consultez votre médecin dès le début de la grossesse si vous êtes migraineuse, et ensuite si les crises perturbent votre vie quotidienne ou si vous prenez des antalgiques plus de trois jours par semaine. Consultez **en urgence** pour un mal de tête inhabituel en deuxième partie de grossesse, surtout avec troubles visuels, bourdonnements d'oreilles ou gonflements. Appelez le **15** ou le **112** pour un mal de tête brutal et violent, avec faiblesse d'un membre, troubles de la parole, confusion ou raideur de la nuque.

${FIN}`,
  },
  {
    ...K, slug: 'maux-de-tete-troubles-visuels-preeclampsie-signes-alerte', category: 'sante-grossesse', safety_critical: true, min_week: 20,
    title: 'Mal de tête, « mouches » devant les yeux, gonflement brutal : penser à la prééclampsie',
    summary: 'À partir du milieu de la grossesse, certains symptômes peuvent signaler une hypertension ou une prééclampsie : les reconnaître et consulter sans attendre.',
    tags: ['prééclampsie', 'pré-éclampsie', 'hypertension', 'tension', 'mal de tête', 'mouches volantes', 'œdème', 'gonflement', 'acouphènes'],
    sources: [S.santePreeclampsie, S.santePreeclampsieGrave, S.ameliHta],
    body_md: `## En bref
- La prééclampsie associe une tension élevée et des protéines dans les urines ; elle survient au plus tôt après 20 semaines d'aménorrhée, parfois après l'accouchement.
- Signes d'alerte : **maux de tête persistants**, **bourdonnements d'oreilles**, **taches ou « mouches » devant les yeux**, **douleur forte sous les côtes** (surtout à droite).
- Des **chevilles, mains ou visage qui gonflent rapidement** justifient une consultation urgente.
- Face à ces signes, n'attendez pas le prochain rendez-vous : consultez en urgence (maternité, **15** ou **112**).

## Comprendre
Pendant la grossesse, la tension artérielle est mesurée à chaque consultation mensuelle, et une bandelette urinaire recherche notamment des protéines. L'Assurance Maladie précise que l'apparition de protéines dans les urines est anormale pendant la grossesse ; associée à une hypertension, elle est le signe d'une **prééclampsie**.

Santé.fr indique que la prééclampsie apparaît au plus tôt au milieu du deuxième trimestre, peut survenir peu avant l'accouchement ou après, et qu'elle peut évoluer rapidement après les premiers symptômes, surtout au troisième trimestre. Elle nécessite une prise en charge et une surveillance très régulières, souvent à l'hôpital.

Les symptômes décrits par les sources officielles sont :
- des maux de tête persistants ou violents ;
- des troubles visuels : hypersensibilité à la lumière, taches noires ou lumineuses qui bougent (« mouches volantes »), brillances ;
- des bourdonnements d'oreilles (acouphènes) ;
- une douleur forte juste sous les côtes, en particulier à droite ;
- des gonflements (œdèmes) importants et rapides, une prise de poids brutale de plusieurs kilos en quelques jours ;
- parfois des vomissements, ou des urines qui diminuent.

Ces signes ne veulent pas forcément dire prééclampsie, mais ils doivent être vérifiés rapidement par une mesure de la tension et une recherche de protéines dans les urines.

## Au quotidien
**Connaître les signes**
- Relisez la liste ci-dessus avec votre partenaire ou un proche : en cas de doute, il est plus facile d'agir à deux.
- Gardez dans votre téléphone le numéro des urgences de votre maternité.

**Aux consultations**
- Signalez tout mal de tête inhabituel, trouble de la vue ou gonflement apparu récemment, même s'il a disparu.
- Si l'on vous a prescrit une automesure de la tension à domicile, suivez la méthode indiquée et notez aussi vos symptômes.

**Distinguer les gonflements**
Des jambes un peu lourdes ou des chevilles qui gonflent en fin de journée, surtout quand il fait chaud, peuvent survenir pendant la grossesse. Ce qui doit alerter, c'est un gonflement **rapide et important**, qui touche aussi les mains ou le visage, ou qui s'accompagne d'autres signes de la liste.

## Questions fréquentes
**J'ai mal à la tête en fin de grossesse : dois-je m'inquiéter ?**
Un mal de tête n'est pas toujours lié à la tension, mais à partir de 20 semaines, un mal de tête persistant ou inhabituel doit faire contrôler votre tension rapidement, surtout s'il s'accompagne d'autres signes.

**Peut-on mesurer la tension en pharmacie ?**
Santé.fr indique que la mesure de la tension et la recherche de protéines dans les urines peuvent aussi se faire en pharmacie. En présence de signes d'alerte, la maternité ou le médecin restent l'interlocuteur à privilégier.

**La prééclampsie peut-elle survenir après l'accouchement ?**
Oui, selon Santé.fr, elle peut apparaître dans le post-partum. Les mêmes signes doivent alerter après la naissance.

**Que se passe-t-il si c'est une prééclampsie ?**
La prise en charge dépend de la gravité : surveillance rapprochée, traitement, hospitalisation, et parfois accouchement anticipé décidé par l'équipe.

## Quand demander conseil
Consultez **en urgence**, sans attendre le prochain rendez-vous, en cas de maux de tête persistants, de troubles visuels, de bourdonnements d'oreilles, de douleur forte sous les côtes ou de gonflement rapide du visage, des mains ou des chevilles. Appelez le **15** ou le **112** en cas de convulsions, de malaise, de douleur intense ou si les symptômes sont très marqués.

${FIN}`,
  },
  {
    ...K, slug: 'insomnie-fin-de-grossesse-nuits-difficiles', category: 'corps-grossesse', min_week: 28,
    title: 'Insomnie en fin de grossesse : que faire des nuits blanches ?',
    summary: 'Réveils fréquents, endormissement difficile, pensées qui tournent : des repères pour mieux dormir au troisième trimestre et ne pas rester seule avec la fatigue.',
    tags: ['insomnie', 'sommeil', 'réveils nocturnes', 'fin de grossesse', 'troisième trimestre', 'fatigue', 'somnifère', 'enceinte'],
    sources: [S.santeInsomnie, S.santeConsult8, S.ameliMedGrossesse],
    body_md: `## En bref
- Les insomnies deviennent plus fréquentes en fin de grossesse, surtout à partir de 36 semaines selon Santé.fr.
- Horaires réguliers, chambre fraîche et sombre, moins d'écrans le soir et peu d'excitants après 16 heures aident.
- Si le sommeil ne vient pas, mieux vaut se lever pour une activité calme que rester à lutter dans le lit.
- Pas de somnifère sans avis médical pendant la grossesse.

## Comprendre
En fin de grossesse, plusieurs petits maux s'additionnent la nuit : envies d'uriner plus fréquentes, ventre qui gêne pour trouver une position, remontées acides, crampes, bébé qui bouge, pensées tournées vers l'accouchement. Santé.fr cite les insomnies parmi les désagréments du 8e mois, en particulier à partir de 36 semaines.

On parle d'insomnie aiguë quand les difficultés durent d'une nuit à quelques semaines. Elle est souvent liée à une période particulière, comme la fin de grossesse. Les conseils de base sont les mêmes que pour tout adulte, adaptés à votre corps qui change. Côté médicaments, Santé.fr est clair : chez la femme enceinte, les hypnotiques ne doivent jamais être utilisés sans avis préalable du médecin. L'Assurance Maladie rappelle aussi que certains somnifères pris en fin de grossesse peuvent entraîner des signes de sevrage chez le nouveau-né.

## Au quotidien
**Le soir**
- Limitez café, thé et sodas caféinés, surtout après 16 heures, et évitez l'alcool.
- Dînez léger, sans trop de graisses, et pas trop tard, pour limiter les remontées acides.
- Éloignez les écrans au moment du coucher et coupez les notifications.
- Choisissez un rituel apaisant : douche tiède, lecture, musique douce, respiration lente.
- Buvez surtout dans la journée et un peu moins juste avant de vous coucher, pour limiter les levers nocturnes (sans réduire vos boissons sur la journée).

**La chambre**
- Gardez-la sombre, calme, aérée, entre 18 et 20 °C.
- Installez-vous sur le côté, avec un coussin entre les genoux ou sous le ventre si cela vous soulage.

**Quand le sommeil ne vient pas**
- Si vous ne dormez pas au bout d'un moment, levez-vous et faites une activité calme sous une lumière tamisée ; revenez au lit quand la somnolence revient.
- Évitez de regarder l'heure sans cesse.
- Notez sur un papier ce qui vous préoccupe (liste pour la valise, questions pour la sage-femme) : cela aide à « déposer » ses pensées.

**Dans la journée**
- Une petite sieste peut aider, mais restez autour d'une vingtaine de minutes si vos nuits sont difficiles.
- Bougez un peu chaque jour, de préférence pas trop tard le soir.

## Questions fréquentes
**Est-ce que mon manque de sommeil gêne le bébé ?**
Votre fatigue vous concerne d'abord, et elle mérite d'être prise au sérieux. Parlez-en à votre sage-femme : elle peut vous aider à trouver ce qui vous empêche de dormir et des solutions adaptées.

**Puis-je prendre une tisane ou un complément « sommeil » ?**
L'Assurance Maladie déconseille fortement les compléments alimentaires et les huiles essentielles pendant la grossesse, et recommande de demander conseil avant tout produit à base de plantes.

**Et si ce sont surtout mes pensées qui m'empêchent de dormir ?**
L'anxiété en fin de grossesse est fréquente. En parler à votre sage-femme, à votre médecin ou lors des séances de préparation à la naissance peut vraiment alléger. Des techniques de relaxation apprises avec un professionnel peuvent aussi aider.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si l'insomnie dure, pèse sur vos journées ou votre moral, ou si elle s'accompagne de démangeaisons, d'impatiences dans les jambes ou de ronflements importants. Si vous vous sentez très angoissée, triste ou à bout, n'attendez pas : en cas de détresse ou d'idées noires, appelez le **3114** (24 h/24). En cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'jambes-sans-repos-impatiences-grossesse', category: 'corps-grossesse',
    title: 'Impatiences dans les jambes pendant la grossesse (syndrome des jambes sans repos)',
    summary: 'Besoin irrésistible de bouger les jambes le soir : ce que sont les impatiences, pourquoi la grossesse les favorise, et ce qui peut soulager.',
    tags: ['jambes sans repos', 'impatiences', 'syndrome des jambes sans repos', 'enceinte', 'sommeil', 'fer', 'anémie', 'fourmillements'],
    sources: [S.ameliSjsr, S.ameliSjsrReflexes, S.ameliAnemie],
    body_md: `## En bref
- Les impatiences se manifestent par un **besoin pressant de bouger les jambes**, avec des sensations désagréables, surtout le soir et au repos.
- Selon l'Assurance Maladie, elles concernent 20 à 30 % des femmes enceintes et disparaissent généralement après l'accouchement.
- Un manque de fer peut jouer un rôle : parlez-en à votre sage-femme ou à votre médecin.
- Marcher, s'étirer, masser, appliquer du chaud ou du froid peut soulager.

## Comprendre
Le syndrome des jambes sans repos, aussi appelé « impatiences », est un trouble du sommeil. L'Assurance Maladie le décrit comme un besoin urgent et irrésistible de bouger les jambes, accompagné de sensations désagréables : picotements, fourmillements, tiraillements, décharges électriques ou brûlures. Ces sensations surviennent au repos, surtout allongée, le soir ou la nuit, et parfois en position assise prolongée (voyage, réunion, spectacle). Elles sont soulagées par le mouvement, ce qui oblige souvent à se lever et à marcher.

Les mécanismes exacts restent mal connus. Deux facteurs semblent jouer un rôle : une **insuffisance en fer** dans l'organisme, avec ou sans anémie, et un manque de dopamine dans certaines zones du système nerveux. La grossesse fait partie des causes reconnues : les besoins en fer augmentent fortement, et l'Assurance Maladie indique que les femmes enceintes sont particulièrement exposées à la carence, surtout en fin de grossesse.

Les impatiences ne sont pas des crampes : la crampe est une contraction douloureuse et brève d'un muscle, alors que les impatiences sont une sensation désagréable qui pousse à bouger.

## Au quotidien
**Quand les sensations arrivent**
- Levez-vous et marchez quelques minutes.
- Étirez doucement les mollets et les cuisses, massez vos jambes.
- Essayez des compresses fraîches ou un bain chaud (pas brûlant), selon ce qui vous soulage.
- Occupez votre esprit avec une activité qui demande de l'attention : mots croisés, tricot, jeu.

**Au fil de la journée**
- Gardez une activité physique régulière et adaptée à votre grossesse ; des étirements doux avant le coucher peuvent aider.
- Réduisez le thé, le café et les boissons énergisantes ; l'alcool et le tabac sont à éviter pendant la grossesse.
- Évitez les repas copieux et les efforts intenses en fin de journée.
- Gardez des horaires de sommeil réguliers, une chambre calme et sombre, sans écran juste avant de dormir.

**Penser au fer**
Une alimentation variée qui apporte du fer (viande, poisson, légumes secs, associés à des fruits ou légumes riches en vitamine C) contribue à couvrir les besoins. Un bilan sanguin permet de vérifier si un complément est nécessaire : c'est au professionnel qui vous suit d'en décider.

## Questions fréquentes
**Les impatiences vont-elles durer après la naissance ?**
L'Assurance Maladie indique qu'elles disparaissent généralement après l'accouchement. Si elles persistent, parlez-en à votre médecin.

**Puis-je prendre un traitement ?**
Les médicaments des impatiences ne se prennent que sur prescription, et pendant la grossesse, le médecin évalue ce qui est possible. Évitez l'automédication et signalez vos impatiences à tout professionnel qui vous prescrit un médicament, car certains traitements (dont certains antihistaminiques) peuvent les aggraver.

**Est-ce lié à mes jambes lourdes ?**
Ce sont deux choses différentes : les jambes lourdes concernent la circulation veineuse, les impatiences sont un trouble neurologique du sommeil. Les deux peuvent coexister pendant la grossesse.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si les impatiences reviennent souvent, perturbent votre sommeil, votre concentration ou votre humeur : un bilan, notamment du fer, peut être utile. Consultez rapidement en cas de mollet gonflé, dur, chaud ou douloureux (signe possible de phlébite). En cas d'essoufflement brutal ou de douleur dans la poitrine, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'gencives-qui-saignent-gingivite-de-grossesse', category: 'corps-grossesse',
    title: 'Gencives qui saignent pendant la grossesse : la gingivite de grossesse au quotidien',
    summary: 'Pourquoi les gencives deviennent sensibles, comment les brosser sans les agresser, et comment profiter de l’examen bucco-dentaire pris en charge.',
    tags: ['gencives qui saignent', 'gingivite', 'dents', 'dentiste', 'brossage', 'enceinte', 'examen bucco-dentaire', 'vomissements'],
    sources: [S.ameliDents, S.ameliDentsBilan],
    body_md: `## En bref
- Les changements hormonaux de la grossesse rendent les gencives plus sensibles aux bactéries : elles peuvent devenir **rouges, gonflées et saigner** facilement, entre le 3e et le 9e mois.
- Continuez à brosser, **plus doucement** sur les zones sensibles, avec une brosse souple et un dentifrice fluoré.
- Un **examen bucco-dentaire** est pris en charge à 100 % du 4e mois de grossesse jusqu'à 6 mois après l'accouchement.
- Après un vomissement : rincez-vous la bouche et attendez au moins une heure avant de vous brosser les dents.

## Comprendre
Pendant la grossesse, les hormones modifient la réaction des gencives à la plaque dentaire. L'Assurance Maladie explique qu'elles deviennent plus sensibles aux bactéries, ce qui peut provoquer une inflammation : la **gingivite de grossesse**. On la remarque souvent au brossage, quand un peu de sang apparaît sur la brosse ou dans le crachat, ou quand la gencive paraît plus rouge et plus gonflée. Elle disparaît généralement après l'accouchement, mais elle mérite un suivi chez le dentiste.

Le premier réflexe est souvent de moins brosser là où ça saigne. C'est l'inverse qui aide : la plaque entretient l'inflammation. Il s'agit donc de **continuer à nettoyer soigneusement**, mais en douceur.

Les vomissements, fréquents en début de grossesse, ont aussi un effet sur les dents : l'acide de l'estomac fragilise l'émail et favorise les caries. D'où le conseil de se rincer la bouche et d'attendre avant de se brosser les dents.

## Au quotidien
**Le brossage**
- Brossez vos dents après chaque repas, avec une brosse à poils souples et un dentifrice fluoré.
- Nettoyez toutes les faces des dents, y compris la jonction entre la dent et la gencive.
- Sur les zones enflammées, réduisez la pression sans les éviter.
- Passez le fil dentaire avec précaution ; si vos espaces entre les dents sont larges ou vos gencives fragiles, les brossettes interdentaires conviennent souvent mieux.
- En cas de doute sur votre technique, demandez au dentiste de vous la montrer.

**Après un vomissement**
- Rincez-vous la bouche à l'eau, ou avec un bain de bouche au bicarbonate ou au fluor.
- Attendez au moins une heure avant de vous brosser les dents.

**Profiter de l'examen bucco-dentaire**
- L'Assurance Maladie vous invite à un examen bucco-dentaire pris en charge à 100 %, du premier jour du 4e mois de grossesse jusqu'au dernier jour du 6e mois après l'accouchement.
- Apportez votre carte Vitale à jour, le courrier d'invitation et le formulaire de prise en charge ; s'il est perdu, la CPAM ou le dentiste peuvent le rééditer.
- Le dentiste vérifie dents et gencives, vous conseille et peut proposer des rendez-vous de soins. Les soins suivants sont remboursés aux conditions habituelles.
- La sage-femme qui fait votre bilan prénatal de prévention peut aussi vous rappeler l'importance du suivi bucco-dentaire.

## Questions fréquentes
**Les saignements sont-ils dus à une brosse trop dure ?**
Ce peut être un facteur. Une brosse souple et un geste doux limitent l'irritation, mais la cause principale est l'inflammation liée aux hormones et à la plaque.

**Peut-on se faire soigner les dents enceinte ?**
L'examen prévu par l'Assurance Maladie sert justement à faire le point et à programmer les soins utiles. Signalez votre grossesse et son terme au dentiste, qui adaptera sa prise en charge.

**La gingivite va-t-elle disparaître toute seule ?**
Elle disparaît généralement après l'accouchement, mais une bonne hygiène et un suivi chez le dentiste pendant la grossesse restent recommandés.

**Les bains de bouche sont-ils utiles ?**
Après un vomissement, un rinçage à l'eau ou un bain de bouche au bicarbonate ou au fluor est conseillé. Pour un usage régulier, demandez l'avis du dentiste ou du pharmacien.

## Quand demander conseil
Prenez rendez-vous chez le dentiste si vos gencives saignent souvent, sont douloureuses ou gonflées, ou si vous avez mal à une dent. Consultez rapidement en cas de gonflement de la joue, de fièvre ou de douleur dentaire intense. En cas de gonflement important du visage avec difficulté à avaler ou à respirer, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'saignement-de-nez-enceinte-gestes', category: 'corps-grossesse',
    title: 'Saignement de nez pendant la grossesse : les bons gestes',
    summary: 'Tête penchée en avant, narines pincées dix minutes : comment arrêter un saignement de nez, ce qu’il faut éviter et quand consulter.',
    tags: ['saignement de nez', 'épistaxis', 'nez qui saigne', 'enceinte', 'compression', 'tension', 'premiers secours'],
    sources: [S.ameliNez, S.ameliHta, S.ameliMedGrossesse],
    body_md: `## En bref
- Asseyez-vous, **penchez la tête en avant** (jamais en arrière) et respirez par la bouche.
- Mouchez-vous doucement une fois, puis **pincez les narines** juste sous l'os du nez pendant **10 minutes** sans relâcher.
- Évitez l'aspirine et les anti-inflammatoires sauf prescription, et limitez les sprays décongestionnants (contre-indiqués pendant la grossesse).
- Saignement abondant, par les deux narines ou vers la gorge, ou malaise : appelez le **15**.

## Comprendre
Un saignement de nez vient le plus souvent de petits vaisseaux fragiles situés à l'avant de la cloison nasale. L'air sec, le mouchage fort, le grattage ou un rhume peuvent les irriter. La plupart des saignements de nez s'arrêtent avec une compression bien faite.

Pendant la grossesse, deux points méritent attention. D'une part, certains médicaments favorisent les saignements : l'Assurance Maladie conseille de ne pas prendre d'aspirine ni d'anti-inflammatoires sauf prescription, et ces derniers ne doivent de toute façon pas être pris en automédication pendant la grossesse. Les sprays décongestionnants, qui sont à limiter en cas de saignement de nez, sont par ailleurs contre-indiqués pendant la grossesse. D'autre part, l'hypertension artérielle fait partie des causes possibles de saignements de nez répétés : l'Assurance Maladie mentionne d'ailleurs les saignements de nez parmi les symptômes à noter lors d'un contrôle de la tension pendant la grossesse. Si vos saignements se répètent, signalez-le lors de votre consultation.

## Au quotidien
**Pour arrêter le saignement**
1. Asseyez-vous et penchez la tête vers l'avant, en respirant par la bouche.
2. Mouchez-vous très doucement, une seule fois, pour évacuer les caillots.
3. Pincez les deux narines entre le pouce et l'index, juste sous la partie osseuse du nez, pendant 10 minutes, montre en main. Ne relâchez pas pour vérifier.
4. Si le saignement continue, recommencez 10 minutes.
5. Vous pouvez poser de la glace (dans un linge) sur le milieu du visage, au-dessus du nez.

**Après**
- Ne vous mouchez pas pendant au moins 12 heures, puis faites-le délicatement.
- Toussez ou éternuez bouche ouverte.
- Ne grattez pas les croûtes et ne mettez rien dans le nez.
- Évitez pendant deux semaines les gros efforts, le port de charges lourdes et de pencher la tête vers le bas.
- Si le saignement a été long, dormez la tête un peu surélevée quelques nuits.

**Prévenir**
- Humidifiez l'air de la maison, surtout l'hiver.
- Faites des lavages de nez doux au sérum physiologique si votre nez est sec ou encombré.
- Mouchez-vous sans forcer, une narine après l'autre.

## Questions fréquentes
**Pourquoi ne pas pencher la tête en arrière ?**
Le sang coulerait dans la gorge : on ne verrait plus si le saignement continue. L'Assurance Maladie recommande de pencher la tête vers l'avant.

**Puis-je mettre un coton dans le nez ?**
L'Assurance Maladie conseille de ne rien introduire dans le nez. La compression avec les doigts est le geste recommandé.

**Mes saignements reviennent souvent : que faire ?**
Consultez votre médecin. Il pourra contrôler votre tension et, si besoin, vous orienter vers un ORL.

## Quand demander conseil
Consultez votre médecin si le saignement persiste ou s'aggrave malgré deux compressions de 10 minutes, ou s'il se répète. Appelez le **15** ou le **112** si le sang coule en abondance par les deux narines et dans la gorge, si le saignement s'accompagne de pâleur, de sueurs, d'un malaise ou d'un pouls rapide, s'il survient après un choc important, ou si vous prenez un traitement qui fluidifie le sang. Dans l'attente des secours, poursuivez la compression (sauf traumatisme important du visage).

${FIN}`,
  },
  {
    ...K, slug: 'mycose-vaginale-pendant-la-grossesse', category: 'sante-grossesse',
    title: 'Mycose vaginale pendant la grossesse : pourquoi consulter plutôt que se soigner seule',
    summary: 'Démangeaisons, brûlures, pertes blanches épaisses : reconnaître une mycose, pourquoi l’automédication ne concerne pas les femmes enceintes, et les gestes d’hygiène qui aident.',
    tags: ['mycose', 'mycose vaginale', 'candidose', 'démangeaisons intimes', 'pertes blanches', 'vaginite', 'enceinte', 'ovule'],
    sources: [S.ameliVaginiteQueFaire, S.ameliVaginite, S.ameliVaginiteTraitement],
    body_md: `## En bref
- La mycose vaginale se manifeste par des **démangeaisons**, des **brûlures** de la vulve et du vagin, et des **pertes blanches épaisses**, « comme du lait caillé ».
- Hors grossesse, on peut parfois se soigner seule ; **enceinte, l'automédication ne s'applique pas** : consultez dans la journée.
- Une infection vaginale pendant la grossesse peut avoir des conséquences pour le bébé (dont un risque d'accouchement prématuré) : d'où l'importance d'un diagnostic.
- Toilette intime externe, savon doux, sous-vêtements en coton : des gestes simples limitent l'irritation.

## Comprendre
La mycose vaginale est une infection due à un champignon, presque toujours *Candida albicans*. C'est, selon l'Assurance Maladie, la plus fréquente des vaginites. Elle se reconnaît à des démangeaisons, des sensations de brûlure, des grandes lèvres souvent rouges, enflées et douloureuses, et des pertes blanchâtres et épaisses.

D'autres infections vaginales donnent des signes différents : des pertes fluides, grisâtres ou jaunâtres et malodorantes évoquent une infection bactérienne ; des pertes mousseuses et malodorantes, un parasite. Elles demandent d'autres traitements. C'est l'une des raisons pour lesquelles l'Assurance Maladie demande aux femmes enceintes, ou qui pensent l'être, de **consulter leur médecin dans la journée** : une infection vaginale peut avoir des conséquences pour le fœtus, notamment un risque d'accouchement prématuré, et peut contaminer le bébé à l'accouchement.

Le médecin ou la sage-femme vous examine et peut faire un prélèvement vaginal pour identifier le germe. Pour la mycose, le traitement est local (ovules, capsules ou crème antifongiques), adapté à la grossesse. Pendant la grossesse, un suivi est prévu jusqu'à l'accouchement pour vérifier la guérison et l'absence de récidive.

## Au quotidien
**Avant la consultation**
- Évitez la toilette intime juste avant le rendez-vous : le professionnel pourra mieux observer les pertes.
- Notez depuis quand vous avez des symptômes et s'ils ont changé.

**Hygiène intime**
- Une toilette intime une à deux fois par jour, uniquement sur la partie externe.
- Utilisez un savon doux à pH neutre, sans parfum.
- Pas de douche vaginale : elle déséquilibre la flore.
- Rincez bien et séchez en tamponnant.

**Vêtements**
- Préférez les sous-vêtements en coton et les vêtements amples ; les tissus synthétiques et serrés favorisent la macération.
- Changez rapidement un maillot de bain mouillé.

**Pendant le traitement**
- Les ovules ou capsules s'utilisent de préférence le soir au coucher.
- Évitez les rapports sexuels ou utilisez un préservatif.
- L'amélioration peut prendre 24 à 48 heures.

## Questions fréquentes
**J'ai déjà eu des mycoses, je connais les symptômes. Puis-je acheter un traitement en pharmacie ?**
Pas pendant la grossesse : l'Assurance Maladie précise que l'automédication ne concerne pas les femmes enceintes. Consultez votre médecin ou votre sage-femme dans la journée.

**La mycose est-elle plus fréquente pendant la grossesse ?**
Les mycoses sont fréquentes chez les femmes en général. Les antibiotiques, le diabète ou certains médicaments les favorisent. Quelle que soit la cause, enceinte, il faut consulter.

**Mon partenaire doit-il être traité ?**
Pour une mycose, l'abstinence ou le préservatif pendant le traitement suffit en général. Pour certaines infections considérées comme sexuellement transmissibles, le partenaire doit être traité en même temps : le médecin vous le dira.

**Et si ça revient ?**
Les récidives sont possibles. Signalez-les : on parle de mycose récidivante à partir de quatre épisodes par an, et elle demande un traitement adapté.

## Quand demander conseil
Pendant la grossesse, consultez **dans la journée** en cas de démangeaisons, brûlures ou pertes inhabituelles. Consultez sans attendre si vous avez aussi des douleurs du ventre, des brûlures en urinant, de la fièvre, des contractions ou un écoulement de liquide. En cas de saignement abondant ou de douleur intense, appelez la maternité ou le **15**.

${FIN}`,
  },
  {
    ...K, slug: 'pertes-vaginales-grossesse-quoi-surveiller', category: 'corps-grossesse',
    title: 'Pertes vaginales pendant la grossesse : ce qui est habituel, ce qui doit faire consulter',
    summary: 'Les sécrétions augmentent souvent pendant la grossesse : comment reconnaître des pertes habituelles, une infection, un bouchon muqueux ou un écoulement de liquide.',
    tags: ['pertes blanches', 'pertes vaginales', 'sécrétions', 'enceinte', 'odeur', 'infection vaginale', 'bouchon muqueux', 'perte des eaux'],
    sources: [S.santeCalendrier, S.ameliVaginite, S.ameliInfections],
    body_md: `## En bref
- Des **sécrétions vaginales plus abondantes** sont citées par Santé.fr parmi les changements du 5e mois de grossesse.
- Des pertes sans odeur désagréable et sans irritation correspondent en général aux sécrétions habituelles.
- **Odeur forte, couleur jaune, verte ou grise, démangeaisons, brûlures** : consultez dans la journée.
- **Écoulement de liquide clair et continu**, ou **sang rouge** : partez à la maternité.

## Comprendre
Le vagin produit en permanence des sécrétions qui le protègent. Leur aspect varie : en dehors de la grossesse, l'Assurance Maladie décrit des sécrétions plus fluides et transparentes autour de l'ovulation, plus laiteuses avant les règles, sans odeur désagréable ni effet irritant. Pendant la grossesse, Santé.fr signale que les sécrétions vaginales deviennent souvent plus abondantes, notamment vers le 5e mois.

Certaines pertes doivent être montrées à un professionnel :
- **des pertes blanches, épaisses « comme du lait caillé », avec démangeaisons et brûlures** évoquent une mycose ;
- **des pertes fluides, grisâtres ou jaunâtres, malodorantes** évoquent une infection bactérienne ;
- **des pertes mousseuses, abondantes, malodorantes** évoquent un parasite.

L'Assurance Maladie rappelle que les infections vaginales bactériennes sont recherchées par prélèvement et traitées pendant la grossesse, car le bébé peut être contaminé à l'accouchement. Elle indique aussi qu'un prélèvement est fait systématiquement en fin de grossesse pour rechercher le streptocoque B, présent sans symptôme chez une partie des femmes.

En fin de grossesse, deux autres écoulements sont à connaître : le **bouchon muqueux**, une glaire parfois teintée de sang qui annonce que l'accouchement approche, et la **perte des eaux**, un écoulement de liquide clair, qui impose de se rendre à la maternité.

## Au quotidien
**Prendre soin de la zone intime**
- Toilette externe une à deux fois par jour, au savon doux, sans douche vaginale.
- Sous-vêtements en coton, changés chaque jour ; évitez les vêtements trop serrés.
- Si vous utilisez des protège-slips, changez-les souvent et préférez des modèles non parfumés.

**Observer sans s'inquiéter**
- Repérez l'aspect habituel de vos pertes : quantité, couleur, odeur.
- Un changement net (odeur, couleur, démangeaisons) mérite un avis.
- En fin de grossesse, si vous ne savez pas s'il s'agit de liquide ou de pertes, mettez une protection propre et observez : un liquide qui mouille en continu doit vous faire appeler la maternité.

## Questions fréquentes
**Mes pertes sont abondantes mais sans odeur, dois-je consulter ?**
Des sécrétions plus abondantes, sans odeur ni irritation, font partie des changements décrits pendant la grossesse. Signalez-le à votre prochaine consultation si cela vous préoccupe, et plus tôt si leur aspect change.

**J'ai des pertes un peu rosées après un examen ou un rapport : que faire ?**
Parlez-en à votre sage-femme ou à votre médecin. Tout saignement rouge, même peu abondant, doit amener à consulter rapidement.

**Comment savoir si j'ai perdu les eaux ?**
La perte des eaux se présente comme un écoulement de liquide clair, souvent continu. En cas de doute, la maternité peut vérifier : il vaut mieux y aller pour rien que rester dans l'incertitude.

## Quand demander conseil
Consultez **dans la journée** en cas de pertes malodorantes, jaunes, vertes ou grises, de démangeaisons, de brûlures ou de douleurs en urinant. Rendez-vous **à la maternité** en cas d'écoulement de liquide, de saignement, de contractions régulières avant terme, de fièvre ou si votre bébé bouge moins. En cas de saignement abondant ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'envies-frequentes-d-uriner-grossesse', category: 'corps-grossesse',
    title: 'Envies fréquentes d’uriner pendant la grossesse : comprendre et faire la différence avec une infection',
    summary: 'L’utérus appuie sur la vessie, surtout en fin de grossesse ; voici comment vivre avec ces envies et reconnaître les signes d’une infection urinaire.',
    tags: ['envie d’uriner', 'uriner souvent', 'vessie', 'pipi la nuit', 'enceinte', 'infection urinaire', 'cystite', 'brûlures urinaires'],
    sources: [S.santeCalendrier, S.santeConsult8, S.ameliInfections],
    body_md: `## En bref
- Les envies d'uriner plus fréquentes sont citées par Santé.fr au 5e mois, puis au 8e mois, quand **l'utérus appuie sur la vessie**.
- Continuez à **bien boire** : réduire vos boissons n'est pas une solution et peut favoriser les infections urinaires.
- **Brûlures en urinant, douleurs du bas du ventre ou fièvre** : consultez rapidement, une infection urinaire est possible.
- Les infections urinaires sont souvent discrètes pendant la grossesse : c'est pourquoi une bandelette urinaire est faite chaque mois à partir du 4e mois.

## Comprendre
La vessie se trouve juste devant l'utérus. À mesure que le bébé grandit, l'utérus prend de la place et appuie sur elle, ce qui réduit la quantité d'urine qu'elle peut contenir confortablement. Santé.fr mentionne des envies d'uriner fréquentes vers le 5e mois, puis de nouveau au 8e mois, et les cite parmi les désagréments de fin de grossesse.

Envie fréquente ne veut pas toujours dire simple pression. L'Assurance Maladie explique que la pression du bébé sur la vessie et le ralentissement de l'écoulement des urines favorisent les **infections urinaires** pendant la grossesse. Leurs signes sont les douleurs du bas du ventre, l'envie fréquente d'uriner et les brûlures en urinant, mais ils sont souvent absents ou peu marqués. Or le principal risque d'une infection non traitée est l'infection des reins (pyélonéphrite), qui peut entraîner un accouchement prématuré. D'où le dépistage systématique : une bandelette urinaire chaque mois à partir du 4e mois, et un examen des urines au laboratoire (ECBU) si elle est positive ou si des symptômes apparaissent.

## Au quotidien
**Boire suffisamment**
- Buvez régulièrement tout au long de la journée ; Santé.fr rappelle de boire de l'eau pour éviter les infections urinaires.
- Si les levers nocturnes vous épuisent, buvez davantage le matin et l'après-midi, un peu moins juste avant le coucher, sans diminuer le total de la journée.

**Aux toilettes**
- Allez uriner dès que l'envie se présente, sans vous retenir longtemps.
- Prenez votre temps pour vider complètement la vessie.
- Essuyez-vous de l'avant vers l'arrière.
- Urinez après les rapports sexuels.

**La nuit**
- Laissez une veilleuse sur le trajet des toilettes et dégagez le passage pour éviter les chutes.
- Levez-vous lentement : asseyez-vous d'abord au bord du lit quelques instants.

**Au quotidien**
- Repérez les toilettes lors de vos sorties et trajets ; n'hésitez pas à demander l'accès en expliquant que vous êtes enceinte.
- Si vous avez de petites fuites en toussant ou en riant, parlez-en à votre sage-femme : des exercices du périnée peuvent aider.

## Questions fréquentes
**Je me lève trois fois par nuit, est-ce que cela va durer ?**
Les envies sont souvent plus marquées en fin de grossesse, quand le bébé descend dans le bassin. Elles diminuent en général après l'accouchement. Si vous avez aussi des brûlures ou des douleurs, consultez.

**J'ai une envie pressante mais j'urine peu : que faire ?**
Cela peut venir de la pression sur la vessie, mais c'est aussi un signe possible d'infection, surtout avec des brûlures. Pendant la grossesse, faites vérifier vos urines rapidement.

**La bandelette mensuelle suffit-elle ?**
Elle permet de dépister une infection sans symptôme. Si des symptômes apparaissent entre deux consultations, n'attendez pas le prochain rendez-vous.

## Quand demander conseil
Consultez rapidement votre médecin ou votre sage-femme en cas de brûlures en urinant, de douleurs du bas du ventre, d'urines troubles ou de sang dans les urines. Consultez en urgence, ou rendez-vous à la maternité, en cas de fièvre, de frissons, de douleur dans le bas du dos sur le côté, de vomissements ou de contractions. En cas de malaise ou de douleur intense, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'petits-maux-fin-de-grossesse-8e-9e-mois', category: 'corps-grossesse', min_week: 33,
    title: 'Les petits maux du 8e et du 9e mois : panorama et signes qui doivent alerter',
    summary: 'Brûlures d’estomac, jambes lourdes, doigts engourdis, insomnies, pesanteur : les désagréments fréquents de fin de grossesse et les situations où il faut consulter.',
    tags: ['fin de grossesse', '8e mois', '9e mois', 'petits maux', 'troisième trimestre', 'pesanteur', 'insomnie', 'signes d’alerte'],
    sources: [S.santeConsult8, S.santeCalendrier, S.sante9eMois],
    body_md: `## En bref
- Les derniers mois sont souvent marqués par plusieurs inconforts à la fois : remontées acides, constipation, jambes lourdes, mal de dos, doigts engourdis, insomnies, envies d'uriner.
- La plupart sont liés aux changements de la grossesse et s'atténuent en général après la naissance.
- Saignement, écoulement de liquide, contractions rapprochées, maux de tête avec troubles visuels ou gonflement brutal : consultez **en urgence**.
- Chaque désagrément peut être signalé lors de la consultation du 8e mois : c'est aussi fait pour ça.

## Comprendre
Santé.fr liste les désagréments fréquents de la fin de grossesse : brûlures d'estomac ou remontées acides après les repas, constipation qui s'accentue, jambes lourdes voire varices, douleurs dorsales, fourmillements ou engourdissement des doigts, insomnies (surtout à partir de 36 semaines) et envies d'uriner plus fréquentes. Le calendrier de grossesse de Santé.fr ajoute, au 9e mois, une **pesanteur pelvienne** de plus en plus marquée, des contractions plus fréquentes mais irrégulières et des difficultés à dormir. Le bébé, plus à l'étroit, peut aussi bouger différemment.

Ces inconforts sont pénibles mais attendus. D'autres signes, en revanche, doivent faire consulter sans attendre, car ils peuvent annoncer un accouchement prématuré ou une complication. Santé.fr cite notamment : tout saignement, des contractions fréquentes ou rapprochées, un écoulement permanent de liquide, et les signes d'hypertension (maux de tête, gonflement des mains, du visage ou des pieds, bourdonnements d'oreilles, « petites mouches » devant les yeux).

## Au quotidien
**Pour la digestion**
- Fractionnez les repas en plus petites portions, mangez lentement.
- Évitez de vous allonger juste après manger ; surélevez la tête du lit si les remontées vous gênent la nuit.
- Contre la constipation : boissons régulières, fruits, légumes, céréales complètes, et un peu de marche chaque jour.

**Pour les jambes et le dos**
- Surélevez vos jambes dans la journée quand vous êtes assise ou allongée.
- Évitez de rester longtemps debout sans bouger.
- Pour vous lever du lit, tournez-vous d'abord sur le côté, puis poussez sur vos bras.

**Pour les mains**
Si vos doigts fourmillent la nuit, secouer la main ou la laisser pendre hors du lit soulage souvent ; signalez-le à votre sage-femme (voir notre article sur le canal carpien).

**Pour les nuits**
- Dormez sur le côté, avec des coussins entre les genoux ou sous le ventre.
- Gardez un rituel calme le soir et une chambre fraîche.

**Pour le moral**
Fatigue, impatience, inquiétude à l'approche de l'accouchement : parlez-en à votre entourage, à la sage-femme, lors des séances de préparation à la naissance.

## Questions fréquentes
**Je sens moins mon bébé bouger, est-ce lié au manque de place ?**
Le bébé a moins d'espace en fin de grossesse et ses mouvements peuvent changer. Mais si vous sentez qu'il bouge **moins que d'habitude**, contactez la maternité sans attendre : seule une vérification permet de vous rassurer.

**Combien de contractions par jour, c'est trop ?**
Les repères varient selon les pages de Santé.fr : l'une indique que les contractions habituelles restent peu douloureuses et peu fréquentes (moins de 10 par jour), le calendrier de grossesse conseille de contacter le médecin qui vous suit au-delà de 5 par jour à partir du 7e mois. Dans tous les cas, des contractions régulières, rapprochées ou douloureuses doivent faire appeler la maternité, et en cas de doute, appelez.

**La pesanteur dans le bas du ventre est-elle un signe d'accouchement ?**
Elle s'accentue souvent au 9e mois quand le bébé descend. Si elle s'accompagne de contractions régulières, de saignement ou d'écoulement, rendez-vous à la maternité.

## Quand demander conseil
Rendez-vous **à la maternité** ou appelez le **15** (ou le **112**) en cas de saignement, d'écoulement de liquide, de contractions régulières ou rapprochées avant terme, de fièvre, de bébé qui bouge moins, de maux de tête intenses avec troubles visuels ou de gonflement brutal du visage et des mains. Pour les autres désagréments, parlez-en à votre sage-femme ou à votre médecin. Si votre moral est au plus bas, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'sciatique-pendant-la-grossesse', category: 'corps-grossesse',
    title: 'Sciatique pendant la grossesse : soulager la douleur qui descend dans la jambe',
    summary: 'Douleur du bas du dos qui irradie dans la fesse et la jambe : pourquoi la grossesse favorise la sciatique, les positions qui soulagent et les signes d’urgence.',
    tags: ['sciatique', 'lombosciatique', 'nerf sciatique', 'douleur jambe', 'mal de dos', 'enceinte', 'fesse', 'chaleur'],
    sources: [S.ameliSciatique, S.ameliSciatiqueReflexes, S.ameliMedGrossesse],
    body_md: `## En bref
- La sciatique associe une douleur du bas du dos et une douleur de la jambe, sur le trajet du nerf sciatique.
- Les changements de posture de la grossesse entraînent souvent des lombosciatiques, qui rentrent en général dans l'ordre après l'accouchement.
- Rester actif sans forcer, adopter des positions qui soulagent et appliquer de la chaleur (sans se brûler) aident.
- Faiblesse de la jambe, perte de sensibilité du périnée, troubles pour uriner : **consultez en urgence**.

## Comprendre
Le nerf sciatique est le plus gros et le plus long nerf du corps. Il part du bas du dos, passe dans la fesse et descend à l'arrière de la cuisse jusqu'au pied. Quand l'une de ses racines est irritée, la douleur suit ce trajet : derrière la cuisse, sur le côté ou l'arrière de la jambe, parfois jusqu'au pied. Elle s'accompagne parfois de fourmillements, d'un engourdissement ou d'une faiblesse.

L'Assurance Maladie indique que les modifications de la posture liées à la grossesse entraînent souvent des lombosciatiques et que, en général, tout rentre dans l'ordre après l'accouchement. La douleur est souvent déclenchée par un effort, s'accentue en position assise, en toussant ou en éternuant, et se calme plutôt en position allongée. Contrairement à une phlébite, la jambe n'est ni gonflée ni colorée.

Rarement, la sciatique prend une forme qui demande une prise en charge rapide : douleur extrême non calmée, perte de force dans la jambe, ou atteinte des nerfs du bassin (troubles de la sensibilité du périnée, difficultés pour uriner ou retenir les selles).

## Au quotidien
**Bouger malgré tout**
- Le repos au lit prolongé est déconseillé. Si la douleur est supportable, poursuivez vos activités en les adaptant, sans forcer.
- La marche, à votre rythme, est souvent bien tolérée.
- Évitez les mouvements et positions qui déclenchent la douleur, et les ports de charges.

**Les positions qui soulagent**
- Sur le côté (la position conseillée en fin de grossesse) : glissez un coussin ferme entre vos genoux, éventuellement un autre sous le ventre.
- Assise : changez de position souvent, levez-vous régulièrement, gardez les pieds à plat.

**La chaleur**
- Une bouillotte, un coussin chauffant ou une douche chaude peuvent détendre les muscles contractés.
- Attention aux brûlures, surtout si vous sentez moins bien la zone.

**Les médicaments**
L'Assurance Maladie indique que le paracétamol peut être pris pendant la grossesse, sous réserve de l'absence de contre-indications, et que les anti-inflammatoires font partie des médicaments contre-indiqués pendant la grossesse (en automédication, et totalement à partir du 6e mois, même en gel ou en crème). Demandez conseil à votre pharmacien, votre sage-femme ou votre médecin.

**Se faire accompagner**
Parlez-en à votre sage-femme ou à votre médecin : ils peuvent vous orienter vers un kinésithérapeute ou d'autres professionnels qui adapteront exercices et postures à votre grossesse.

## Questions fréquentes
**La sciatique peut-elle gêner l'accouchement ?**
Parlez-en à l'équipe qui vous suit, qui pourra adapter les positions pendant le travail. La plupart des sciatiques de grossesse s'améliorent après la naissance.

**Est-ce une sciatique ou une douleur du bassin ?**
Seul un examen permet de le dire. Une douleur qui descend derrière la cuisse et sous le genou évoque plutôt une sciatique ; une douleur au niveau du pubis ou des articulations du bassin a d'autres causes. Décrivez précisément où vous avez mal.

**Puis-je mettre une ceinture de grossesse ?**
Demandez l'avis de votre sage-femme ou du kinésithérapeute, qui vous diront si elle peut vous aider et comment la porter.

## Quand demander conseil
Consultez votre médecin si la douleur ne s'améliore pas après quelques jours, si elle augmente, surtout la nuit, ou si un engourdissement ou une faiblesse progressive de la jambe apparaît. Consultez **en urgence** en cas de douleur extrême non calmée, de paralysie ou perte de force de la jambe, de perte de sensibilité du périnée, de difficultés pour uriner, de fuites urinaires ou de perte de contrôle des selles, ou si la douleur s'accompagne de fièvre ou de brûlures urinaires. En cas de mollet gonflé et douloureux ou d'essoufflement brutal, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'canal-carpien-pendant-la-grossesse-doigts-engourdis', category: 'corps-grossesse',
    title: 'Doigts engourdis, mains qui fourmillent la nuit : le syndrome du canal carpien pendant la grossesse',
    summary: 'La grossesse favorise la compression d’un nerf du poignet ; reconnaître les signes, soulager les nuits et savoir quand consulter.',
    tags: ['canal carpien', 'fourmillements', 'doigts engourdis', 'mains', 'poignet', 'enceinte', 'attelle', 'nerf médian'],
    sources: [S.ameliCarpien, S.ameliCarpienSymptomes, S.ameliCarpienTraitement],
    body_md: `## En bref
- Le syndrome du canal carpien provoque **fourmillements, engourdissement et décharges** dans le pouce, l'index, le majeur et une partie de l'annulaire.
- La **grossesse le favorise** ; il régresse en général après l'accouchement, mais peut réapparaître à une grossesse suivante.
- Les symptômes sont souvent **nocturnes** : secouer la main ou la laisser pendre hors du lit soulage.
- Si les symptômes persistent ou s'aggravent, ou si vous perdez de la force, consultez rapidement.

## Comprendre
Au poignet, le nerf médian passe dans un tunnel étroit, le canal carpien, avec les tendons des doigts. Lorsqu'il est comprimé, il envoie des signaux anormaux : picotements et fourmillements sur la face palmaire des trois premiers doigts, engourdissement, lourdeur de la main, sensations de décharge électrique. Ces troubles peuvent remonter vers l'avant-bras et toucher les deux mains, pas forcément en même temps.

L'Assurance Maladie cite la grossesse parmi les facteurs hormonaux qui favorisent ce syndrome. Elle précise qu'il régresse après l'accouchement, mais qu'il peut réapparaître lors des grossesses suivantes.

Les symptômes surviennent surtout la nuit, ou en journée lors de certains gestes ou du maintien prolongé d'une position (tenir un téléphone, conduire, taper au clavier). Sans prise en charge, une compression qui dure peut entraîner des douleurs, une perte de sensibilité puis une baisse de force du pouce, avec des objets qui tombent des mains. C'est pourquoi l'Assurance Maladie insiste sur l'importance de consulter rapidement si les symptômes persistent ou s'aggravent.

## Au quotidien
**La nuit**
- Évitez de dormir les poignets pliés, sous l'oreiller ou sous la joue.
- Quand les fourmillements vous réveillent, secouez la main ou laissez-la pendre hors du lit.
- Une **attelle de repos nocturne**, qui maintient le poignet en position neutre, est l'un des traitements proposés ; elle se discute avec votre médecin ou votre sage-femme.

**Dans la journée**
- Faites des pauses régulières lors des gestes répétitifs (clavier, souris, couture, épluchage).
- Changez souvent de prise et évitez de garder le poignet plié ou en torsion longtemps.
- Évitez les efforts de force répétés et les vibrations (certains outils de bricolage ou de jardinage).
- Au travail, parlez de l'aménagement de votre poste avec la médecine du travail si besoin.

**Ménager ses mains**
- Utilisez des objets plus légers et plus faciles à saisir.
- Faites-vous aider pour les tâches qui sollicitent beaucoup les poignets.

## Questions fréquentes
**Pourquoi les deux mains sont-elles touchées ?**
L'atteinte est souvent bilatérale, mais pas forcément symétrique ni simultanée. Signalez-le, même si une main est plus gênée que l'autre.

**Faut-il faire un examen ?**
Le médecin examine la sensibilité, la force et la mobilité de vos doigts ; cet examen suffit souvent. Un électroneuromyogramme peut être prescrit s'il le juge utile.

**Les symptômes vont-ils disparaître après la naissance ?**
L'Assurance Maladie indique que les symptômes régressent spontanément dans environ un tiers des cas, notamment après une grossesse, et que le syndrome régresse après l'accouchement. Si la gêne persiste après la naissance, consultez : d'autres traitements existent.

**Porter mon bébé va-t-il aggraver les choses ?**
Les gestes répétés de portage, de change ou de biberon sollicitent les poignets. Alternez les mains, gardez le poignet droit quand c'est possible et parlez-en au médecin si la gêne revient.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin dès que les fourmillements reviennent régulièrement ou vous réveillent. Consultez rapidement si les symptômes persistent, s'aggravent, si vous perdez de la sensibilité ou de la force dans les doigts. Consultez **en urgence**, ou appelez le **15** ou le **112**, en cas d'engourdissement soudain d'un côté du corps, de faiblesse brutale d'un bras ou de troubles de la parole.

${FIN}`,
  },
  {
    ...K, slug: 'essoufflement-pendant-la-grossesse', category: 'corps-grossesse',
    title: 'Essoufflée pendant la grossesse : ce qui est attendu et ce qui doit alerter',
    summary: 'Le volume sanguin augmente, le ventre prend de la place : l’essoufflement est fréquent pendant la grossesse ; voici comment s’adapter et reconnaître les signes d’urgence.',
    tags: ['essoufflement', 'souffle court', 'respirer', 'enceinte', 'escaliers', 'anémie', 'embolie', 'difficulté à respirer'],
    sources: [S.santeCalendrier, S.ameliActive, S.ameliEssoufflement],
    body_md: `## En bref
- Santé.fr cite l'essoufflement dès le 2e mois, lié à l'augmentation du volume sanguin et du rythme cardiaque, puis de nouveau au 6e mois.
- Ralentir, faire des pauses et adapter ses efforts aide au quotidien.
- Un essoufflement **anormal à l'effort**, ou qui **ne cesse pas au repos**, doit faire arrêter l'activité et consulter.
- Essoufflement brutal, douleur dans la poitrine, lèvres bleutées ou mollet gonflé et douloureux : appelez le **15** ou le **112**.

## Comprendre
Pendant la grossesse, le corps s'adapte pour apporter oxygène et nutriments au bébé : le volume de sang augmente et le cœur bat plus vite. Santé.fr mentionne ainsi un essoufflement dès le 2e mois. Plus tard, quand le ventre prend de la place, le calendrier de grossesse de Santé.fr cite de nouveau l'essoufflement, au 6e mois.

Monter des escaliers, porter des courses ou marcher vite peut donc vous laisser plus à bout de souffle qu'avant. Cela ne doit pas empêcher de bouger, au contraire, mais invite à adapter l'intensité.

Certaines situations sortent de ce cadre. L'Assurance Maladie demande d'arrêter toute activité et de consulter en cas d'essoufflement anormal à l'effort, surtout s'il ne cesse pas au repos. Un manque de fer (anémie), plus fréquent pendant la grossesse, peut aussi donner un essoufflement à l'effort, avec fatigue et pâleur. Enfin, un essoufflement **brutal** peut révéler une urgence : crise d'asthme, infection pulmonaire, réaction allergique, ou embolie pulmonaire, parfois annoncée par une douleur d'un mollet (phlébite).

## Au quotidien
**Adapter ses efforts**
- Prenez les escaliers à votre rythme, faites une pause sur le palier.
- Fractionnez les courses et les tâches ménagères, faites-vous livrer ou aider.
- Pendant une activité physique, gardez une intensité qui vous permet de parler.

**Respirer plus confortablement**
- Tenez-vous droite, épaules relâchées.
- Pratiquez une respiration lente, en soufflant longuement par la bouche.
- La nuit, un oreiller supplémentaire ou la position sur le côté peuvent aider.

**Préserver son souffle**
- Évitez le tabac et les lieux enfumés.
- Aérez votre logement chaque jour.
- Si vous êtes asthmatique, poursuivez votre traitement et parlez-en avec votre médecin dès le début de la grossesse.

## Questions fréquentes
**Mon essoufflement peut-il manquer d'oxygène au bébé ?**
Un essoufflement léger lié aux adaptations de la grossesse fait partie des changements décrits par les sources officielles. Un essoufflement inhabituel, au repos ou qui s'aggrave doit, lui, être examiné rapidement.

**Comment savoir si c'est une anémie ?**
Seule une prise de sang permet de le dire. Une fatigue importante, une pâleur, des vertiges ou un essoufflement à l'effort sont des raisons d'en parler à votre sage-femme ou à votre médecin.

**Puis-je continuer le sport ?**
Oui, en général, en l'adaptant. L'Assurance Maladie demande d'arrêter et de consulter en cas d'essoufflement anormal, de douleur dans la poitrine, de vertiges ou de malaise.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme si vous êtes plus essoufflée qu'avant sans raison évidente, si l'essoufflement survient pour de petits efforts ou s'accompagne de fatigue, de palpitations ou de toux. Consultez dans la journée en cas d'essoufflement avec fièvre. Appelez le **15** ou le **112** en cas d'essoufflement brutal, de respiration très rapide, de difficulté à parler, de lèvres ou d'extrémités bleutées, de douleur dans la poitrine, de mollet gonflé et douloureux, ou de gonflement du visage.

${FIN}`,
  },
  {
    ...K, slug: 'palpitations-coeur-qui-bat-vite-grossesse', category: 'corps-grossesse',
    title: 'Cœur qui bat vite, palpitations pendant la grossesse : quand s’inquiéter ?',
    summary: 'Le cœur travaille davantage pendant la grossesse ; comprendre les palpitations, limiter ce qui les favorise et reconnaître les signes d’urgence.',
    tags: ['palpitations', 'cœur qui bat vite', 'tachycardie', 'rythme cardiaque', 'enceinte', 'caféine', 'stress', 'anémie'],
    sources: [S.ameliPalpitations, S.santeCalendrier, S.ameliAnemieSymptomes],
    body_md: `## En bref
- Pendant la grossesse, le volume sanguin et le rythme cardiaque augmentent, ce qui peut donner l'impression que le cœur bat plus fort ou plus vite.
- Caféine, tabac, stress, manque de sommeil et certains médicaments peuvent favoriser les palpitations.
- Noter quand elles surviennent, combien de temps elles durent et ce qui les accompagne aide le médecin.
- Palpitations avec malaise, douleur dans la poitrine, difficulté à respirer ou vertiges : appelez le **15** ou le **112**.

## Comprendre
On parle de palpitations quand on perçoit ses battements de cœur de façon inhabituelle : cœur qui bat fort, vite, de manière irrégulière, ou sensation de « raté ». Santé.fr indique que, dès le 2e mois de grossesse, le volume sanguin et le rythme cardiaque augmentent. Il est donc fréquent de sentir son cœur davantage, surtout à l'effort.

L'Assurance Maladie cite plusieurs circonstances qui peuvent déclencher des palpitations : la caféine (café, thé, boissons énergisantes), le tabac, le stress et les crises d'angoisse, le manque de sommeil, le manque d'exercice, ou certains médicaments. Une anémie peut aussi donner une fatigue, un essoufflement et des vertiges, et elle est plus fréquente pendant la grossesse : c'est une piste que votre médecin peut vérifier par une prise de sang.

Certaines palpitations doivent être explorées par un médecin, et quelques situations relèvent de l'urgence.

## Au quotidien
**Observer**
- Notez le moment où elles commencent et s'arrêtent, leur durée, leur régularité, ce que vous faisiez et les autres sensations (essoufflement, vertige, douleur).
- Si vous avez un tensiomètre, notez votre fréquence cardiaque pendant l'épisode.

**Réduire ce qui les favorise**
- Limitez le café, le thé, les sodas caféinés et évitez les boissons énergisantes.
- Pendant la grossesse, l'arrêt du tabac est bénéfique à tout moment : demandez de l'aide à votre sage-femme ou à votre médecin.
- Prenez soin de votre sommeil autant que possible.
- Bougez régulièrement à votre rythme ; la marche est souvent une bonne option.
- Essayez des techniques de relaxation ou de respiration lente quand vous sentez le stress monter.

**Avec les médicaments**
Si vous prenez un traitement, lisez la notice et parlez à votre médecin ou à votre pharmacien des palpitations. N'arrêtez jamais un traitement sans avis médical.

## Questions fréquentes
**Mon cœur bat vite quand je monte les escaliers : est-ce lié à la grossesse ?**
Le cœur travaille davantage pendant la grossesse, et un rythme plus rapide à l'effort fait partie des adaptations décrites. Si cela survient au repos, de façon prolongée, ou avec d'autres signes, consultez.

**Quand faut-il consulter son médecin ?**
L'Assurance Maladie conseille de consulter si les palpitations vous inquiètent, si elles reviennent souvent, durent, s'aggravent ou changent, si votre cœur bat à plus de 100 battements par minute hors effort, fièvre ou angoisse, ou si vous avez des antécédents cardiaques ou une maladie chronique.

**Est-ce que l'angoisse peut donner des palpitations ?**
Oui, le stress et les crises d'angoisse font partie des causes citées. Si l'anxiété est très présente pendant votre grossesse, parlez-en : un soutien existe.

## Quand demander conseil
Parlez-en à votre médecin ou à votre sage-femme si les palpitations sont fréquentes, durent, s'aggravent ou apparaissent au repos. Appelez le **15** ou le **112** si elles s'accompagnent d'un malaise (avec ou sans perte de connaissance), d'une douleur dans la poitrine, de difficultés à respirer, de sueurs abondantes, de vertiges, de maux de tête intenses, ou d'une perte de force ou d'un engourdissement d'un côté du corps ou du visage. Si l'angoisse vous submerge, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'vertiges-malaises-pendant-la-grossesse', category: 'corps-grossesse',
    title: 'Vertiges, tête qui tourne, malaises pendant la grossesse : prévenir et réagir',
    summary: 'Station debout prolongée, lever trop rapide, repas sauté, chaleur : ce qui favorise les malaises pendant la grossesse, comment les prévenir et que faire si l’on se sent partir.',
    tags: ['vertiges', 'malaise', 'tête qui tourne', 'étourdissement', 'malaise vagal', 'hypotension', 'enceinte', 'hypoglycémie'],
    sources: [S.santeCalendrier, S.ameliActive, S.ameliMalaise],
    body_md: `## En bref
- La station debout prolongée peut faire baisser la tension et provoquer un malaise ; un lever trop rapide ou un repas sauté aussi.
- Santé.fr conseille de dormir de préférence sur le côté gauche pour éviter les malaises vagaux, et signale un risque de malaises hypoglycémiques vers le 4e mois.
- Si vous vous sentez partir : **allongez-vous** ou asseyez-vous immédiatement, desserrez vos vêtements.
- Malaise avec perte de connaissance, douleur dans la poitrine, maux de tête inhabituels, troubles de la vue ou saignement : appelez le **15** ou le **112**.

## Comprendre
Pendant la grossesse, rester longtemps debout sans bouger peut faire baisser la tension : l'Assurance Maladie présente la station debout prolongée comme une source d'hypotension et de malaise. La position allongée sur le dos compte aussi : l'Assurance Maladie déconseille les exercices sur le dos à partir de 24 semaines, et Santé.fr recommande de dormir plutôt sur le côté gauche pour éviter les malaises vagaux.

Le malaise vagal est une perte de connaissance brève, souvent annoncée par des sueurs, des nausées, des étourdissements, une faiblesse dans les jambes ou un voile devant les yeux. Une atmosphère chaude et confinée, une émotion forte, une douleur vive ou une station debout prolongée le favorisent.

Santé.fr mentionne aussi, vers le 4e mois, un risque de **malaises hypoglycémiques**, liés à une baisse du sucre dans le sang, par exemple après une longue période sans manger. Enfin, une anémie peut donner une sensation de tête qui tourne : votre médecin peut la rechercher par une prise de sang.

## Au quotidien
**Prévenir**
- Levez-vous en deux temps : asseyez-vous d'abord quelques instants au bord du lit ou du canapé.
- Évitez de rester longtemps debout immobile ; si c'est inévitable (file d'attente, transport), bougez les jambes, contractez les mollets, ou asseyez-vous dès que possible.
- Ne sautez pas de repas, prévoyez une collation (fruit, yaourt, pain, poignée d'oléagineux) dans votre sac.
- Buvez régulièrement, surtout quand il fait chaud.
- Évitez les lieux surchauffés et confinés.
- Pour dormir ou vous reposer, préférez la position sur le côté, de préférence le gauche.

**Si vous vous sentez partir**
- Allongez-vous par terre ou asseyez-vous immédiatement, pour éviter de chuter.
- Desserrez ce qui serre (ceinture, soutien-gorge).
- Respirez lentement, demandez de l'aide autour de vous.
- Ne vous relevez que lorsque vous vous sentez bien, et doucement.

**Pour l'entourage**
Si une femme enceinte perd connaissance : allongez-la, de préférence sur le côté gauche, surveillez sa respiration, et appelez le **15** si elle ne reprend pas conscience en quelques minutes, si sa respiration ou son pouls sont anormaux, ou s'il y a d'autres signes inquiétants. Si elle est inconsciente et respire, mettez-la en position latérale de sécurité.

## Questions fréquentes
**Les vertiges sont-ils dangereux pour le bébé ?**
Le principal risque immédiat est la chute. Mais des malaises répétés doivent être signalés à votre sage-femme ou à votre médecin, qui recherchera une cause (tension, anémie, sucre dans le sang).

**J'ai la tête qui tourne quand je me lève le matin, que faire ?**
Levez-vous lentement, asseyez-vous d'abord au bord du lit, et prenez rapidement un petit-déjeuner. Si cela se répète, parlez-en lors de votre consultation.

**Faut-il consulter après un malaise ?**
Oui. Pendant la grossesse, signalez tout malaise à votre sage-femme ou à votre médecin. Après une perte de connaissance brève sans signe de gravité, l'Assurance Maladie indique que le médecin régulateur conseille de consulter le médecin traitant ou le médecin de garde.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme après un malaise, ou si les vertiges se répètent. Arrêtez toute activité et consultez en cas de vertiges, de troubles de l'équilibre, de malaise ou de maux de tête inhabituels. Appelez le **15** ou le **112** en cas de perte de connaissance qui dure plus de quelques minutes, de douleur dans la poitrine, de difficulté à respirer, de vision double ou de perte de vision, de troubles de la parole, de chute avec choc au ventre, de saignement ou de contractions.

${FIN}`,
  },
  {
    ...K, slug: 'demangeaisons-pendant-la-grossesse-cholestase', category: 'sante-grossesse', safety_critical: true,
    title: 'Démangeaisons pendant la grossesse : soulager la peau et repérer une cholestase',
    summary: 'Peau sèche, plaques qui grattent ou démangeaisons intenses en fin de grossesse : ce qui peut soulager et quand demander un avis rapidement.',
    tags: ['démangeaisons', 'prurit', 'cholestase', 'grossesse', 'ça gratte', 'peau sèche', 'foie', 'jaunisse'],
    sources: [S.ameliPrurit, S.ameliPruritQueFaire, S.ameliVaginiteQueFaire],
    body_md: `## En bref
- La grossesse fait partie des causes hormonales de démangeaisons ; elles disparaissent généralement après l'accouchement.
- Peau sèche, ventre qui se tend, plaques rouges sur les cuisses et l'abdomen en fin de grossesse : des soins simples soulagent souvent.
- Des démangeaisons **intenses, généralisées**, surtout en fin de grossesse, peuvent révéler une **cholestase de la grossesse** : demandez conseil à votre sage-femme ou à votre médecin rapidement.
- Démangeaisons intimes avec pertes : consultez dans la journée, sans automédication.

## Comprendre
Les démangeaisons (prurit) sont une sensation désagréable qui donne envie de se gratter. L'Assurance Maladie cite la grossesse parmi leurs causes, et précise que les démangeaisons liées à la grossesse disparaissent en général après l'accouchement. Plusieurs situations sont possibles.

**La peau sèche et tendue.** Le ventre qui s'étire, la chaleur, les douches chaudes, certains savons ou textiles peuvent irriter la peau et la faire gratter.

**Les papules et plaques prurigineuses de la grossesse.** L'Assurance Maladie décrit une affection cutanée courante en fin de grossesse, avec des rougeurs qui démangent sur les cuisses et l'abdomen.

**La cholestase de la grossesse.** Elle correspond à une rétention de bile dans le foie. Elle survient surtout en fin de grossesse, provoque des démangeaisons, et guérit quelques jours après l'accouchement, parfois plus lentement. Une jaunisse n'est présente que dans environ 10 % des cas : on ne peut donc pas l'écarter parce que la peau n'est pas jaune. L'Assurance Maladie souligne qu'il est important, dans ces situations, de demander conseil à une sage-femme ou à son médecin, qui pourra prescrire une prise de sang.

**Les démangeaisons intimes.** Une mycose vaginale démange aussi : pendant la grossesse, elle doit être vue par un professionnel dans la journée.

## Au quotidien
**Hydrater la peau**
- Appliquez une crème émolliente simple, sans parfum, sur la peau encore légèrement humide après la douche.
- Préférez une huile de toilette, un pain surgras ou un nettoyant doux sans savon.
- Évitez les atmosphères trop sèches : aérez et pensez à l'humidité de la chambre en hiver.

**Douche et vêtements**
- Prenez des douches tièdes et courtes plutôt que des bains chauds.
- Séchez-vous en tamponnant, sans frotter.
- Portez des vêtements amples, légers, en coton ; évitez la laine et les synthétiques directement sur la peau.

**Limiter le grattage**
- Gardez les ongles courts et limés.
- Tapotez ou appliquez un linge frais sur la zone qui démange plutôt que de gratter.
- Évitez les nouveaux cosmétiques, parfums et lessives pendant cette période.

**Avant un produit**
Demandez conseil à votre pharmacien ou à votre sage-femme avant d'appliquer une crème médicamenteuse : certains produits ne conviennent pas pendant la grossesse, et les huiles essentielles sont déconseillées.

## Questions fréquentes
**Comment reconnaître une cholestase ?**
Seule une prise de sang permet de la confirmer. Les démangeaisons en fin de grossesse, surtout si elles sont intenses, généralisées ou gênent le sommeil, justifient d'en parler rapidement à votre sage-femme ou à votre médecin.

**Mes démangeaisons sont surtout sur le ventre : est-ce lié aux vergetures ?**
La peau qui s'étire peut gratter. Une crème hydratante aide souvent. Si des plaques rouges apparaissent ou si les démangeaisons s'étendent, consultez.

**Les démangeaisons vont-elles disparaître après l'accouchement ?**
Selon l'Assurance Maladie, les démangeaisons liées à la grossesse disparaissent généralement après l'accouchement ; pour la cholestase, quelques jours après, parfois plus longtemps.

## Quand demander conseil
Demandez conseil rapidement à votre sage-femme ou à votre médecin en cas de démangeaisons intenses, généralisées, qui gênent votre sommeil, ou si la peau ou le blanc des yeux jaunit. Consultez aussi en cas de lésions de grattage, de plaques, de fièvre ou de grande fatigue. Contactez la maternité sans attendre si vous sentez votre bébé bouger moins. En cas de gonflement du visage ou de difficulté à respirer, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'fatigue-et-anemie-pendant-la-grossesse', category: 'sante-grossesse',
    title: 'Fatigue, pâleur, souffle court : penser à l’anémie pendant la grossesse',
    summary: 'Les besoins en fer augmentent fortement pendant la grossesse ; reconnaître les signes d’une anémie, comprendre le bilan sanguin et en parler au bon moment.',
    tags: ['anémie', 'fer', 'carence en fer', 'fatigue', 'pâleur', 'enceinte', 'prise de sang', 'hémoglobine', 'ferritine'],
    sources: [S.ameliAnemie, S.ameliAnemieSymptomes, S.santeCalendrier],
    body_md: `## En bref
- Les besoins en fer augmentent fortement pendant la grossesse (croissance du bébé et du placenta, augmentation du volume sanguin).
- Les femmes enceintes sont particulièrement touchées par l'anémie par manque de fer, surtout en fin de grossesse et en cas de grossesse multiple.
- Fatigue, pâleur, essoufflement à l'effort, maux de tête, vertiges peuvent la signaler, mais elle passe souvent inaperçue.
- Le diagnostic se fait par prise de sang ; un éventuel traitement est décidé par le professionnel qui vous suit.

## Comprendre
L'anémie correspond à un taux d'hémoglobine trop bas dans le sang. L'hémoglobine, contenue dans les globules rouges, transporte l'oxygène vers les organes ; pour la fabriquer, le corps a besoin de fer. Quand le fer manque, sa production diminue : c'est l'anémie par carence en fer.

Pendant la grossesse, l'Assurance Maladie explique que les besoins en fer augmentent fortement. Elle fixe le seuil d'anémie chez la femme enceinte à 105 g/l d'hémoglobine à partir du deuxième trimestre. Les femmes enceintes font partie des populations à risque, en particulier en fin de grossesse, en cas de grossesse multiple, ou si l'alimentation apporte peu de fer (régime végétarien ou végétalien strict, par exemple).

La fatigue est fréquente pendant la grossesse : Santé.fr la cite dès le 2e mois. Elle ne veut pas dire anémie. Mais une fatigue qui s'installe, avec une pâleur, un essoufflement à l'effort, des maux de tête, une sensation de tête qui tourne ou une faiblesse en se levant d'une chaise, doit faire penser à vérifier. La peau et les cheveux secs ou des ongles cassants peuvent aussi traduire un manque de fer. L'anémie s'installe souvent progressivement et peut être découverte lors d'une prise de sang de suivi.

## Au quotidien
**Dans l'assiette**
- Variez les sources de fer : viande, poisson, œufs bien cuits, légumes secs (lentilles, pois chiches, haricots).
- Associez-les à des fruits ou légumes riches en vitamine C au même repas, qui favorisent l'absorption du fer d'origine végétale.
- Si vous ne mangez pas de viande ou de poisson, parlez-en à votre sage-femme ou à votre médecin pour bien composer vos repas.

**Économiser son énergie**
- Accordez-vous des pauses dans la journée et couchez-vous plus tôt quand c'est possible.
- Déléguez ce qui peut l'être : courses, ménage, trajets.
- Gardez une activité physique douce, adaptée à votre forme : elle aide souvent à mieux supporter la fatigue.

**Avec les professionnels**
- Signalez votre fatigue lors des consultations mensuelles : c'est une information utile.
- Si une prise de sang est prescrite, demandez qu'on vous explique les résultats (hémoglobine, et parfois ferritine, qui reflète les réserves en fer).
- Ne prenez pas de complément en fer ou de complément alimentaire de votre propre initiative : c'est le professionnel qui vous suit qui décide d'un traitement et de sa durée.

## Questions fréquentes
**Je suis fatiguée tout le temps, ai-je forcément une anémie ?**
Non, la fatigue a de nombreuses causes pendant la grossesse : changements hormonaux, sommeil perturbé, charge du quotidien. Mais en parler permet de vérifier, par une simple prise de sang, qu'il n'y a pas de manque de fer.

**Comment savoir si mes résultats sont bons ?**
Le seuil indiqué par l'Assurance Maladie pour la femme enceinte est de 105 g/l d'hémoglobine à partir du deuxième trimestre. Votre sage-femme ou votre médecin interprète vos résultats en tenant compte de votre situation.

**Le fer se trouve-t-il seulement dans la viande rouge ?**
Non : le poisson, les œufs et les légumes secs en apportent aussi. Le fer d'origine animale est mieux absorbé ; l'ajout de vitamine C aide pour les sources végétales.

## Quand demander conseil
Parlez-en à votre médecin ou à votre sage-femme si vous êtes très fatiguée, pâle, essoufflée pour de petits efforts, si vous avez des vertiges ou des palpitations. Consultez rapidement en cas de saignements, même modérés. Appelez le **15** ou le **112** en cas de malaise avec perte de connaissance, de douleur dans la poitrine ou de difficulté à respirer. Si la fatigue s'accompagne d'une tristesse persistante ou d'un sentiment d'épuisement, parlez-en, et en cas de détresse, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'petits-maux-grossesse-demander-au-pharmacien', category: 'sante-grossesse',
    title: 'Petits maux de la grossesse : ce qu’il faut savoir avant d’ouvrir l’armoire à pharmacie',
    summary: 'Anti-inflammatoires, décongestionnants, huiles essentielles, compléments : les produits courants qui demandent un avis pendant la grossesse, et comment bien se faire conseiller.',
    tags: ['automédication', 'médicaments', 'pharmacie', 'enceinte', 'anti-inflammatoire', 'huiles essentielles', 'plantes', 'pictogramme grossesse'],
    sources: [S.ameliMedGrossesse, S.santeHuilesEssentielles, S.ameliRhume],
    body_md: `## En bref
- Pendant la grossesse, l'Assurance Maladie recommande d'**éviter l'automédication** et de demander conseil avant tout médicament, même sans ordonnance ou à base de plantes.
- Les **anti-inflammatoires** (AINS) ne doivent pas être pris en automédication pendant la grossesse ; ils sont contre-indiqués à partir du 6e mois, même en gel ou en crème.
- Les **décongestionnants** (vasoconstricteurs) sont contre-indiqués pendant la grossesse.
- Les **huiles essentielles** et les **compléments alimentaires** sont fortement déconseillés.

## Comprendre
Rhume, mal de tête, douleur de dos, gorge irritée : pendant la grossesse, les petits maux ne manquent pas, et le réflexe de prendre ce que l'on a à la maison est naturel. Pourtant, certains produits très courants ne conviennent pas à la femme enceinte. L'Assurance Maladie rappelle que le risque de malformation lié à certains médicaments est maximal au premier trimestre, que d'autres sont toxiques pour le bébé plus tard dans la grossesse, et que certains médicaments pris en fin de grossesse peuvent entraîner des effets chez le nouveau-né.

Les principaux points de vigilance :
- **Anti-inflammatoires non stéroïdiens** (ibuprofène, kétoprofène, etc.) : toute automédication est contre-indiquée pendant la grossesse ; jusqu'au 5e mois, ils ne sont prescrits qu'en cas de nécessité absolue et sur une très courte durée ; à partir du 6e mois (24 semaines d'aménorrhée), ils sont contre-indiqués, y compris en crème ou en gel. L'aspirine est aussi concernée.
- **Vasoconstricteurs** contre le nez bouché : contre-indiqués pendant la grossesse et l'allaitement.
- **Huiles essentielles** : Santé.fr rappelle qu'elles concentrent des substances potentiellement irritantes et toxiques, et que leur utilisation ne convient pas aux femmes enceintes.
- **Compléments alimentaires** : fortement déconseillés sans avis, sauf ceux prescrits (par exemple l'acide folique).
- **Médicaments « habituels »** : un traitement pour une maladie chronique ne doit être ni arrêté ni modifié seule ; parlez-en à votre médecin dès que vous savez que vous êtes enceinte.

Sur les boîtes, deux pictogrammes vous aident : « Médicament + grossesse = danger » (à n'utiliser qu'en l'absence d'alternative, sur avis médical) et « Médicament + grossesse = interdit ».

## Au quotidien
**Faire le tri dans l'armoire à pharmacie**
- Mettez de côté les anti-inflammatoires (comprimés, gels, crèmes), les décongestionnants, les huiles essentielles et les compléments non prescrits.
- Gardez les produits simples, comme le sérum physiologique pour le nez et un thermomètre.
- Vérifiez les associations : beaucoup de médicaments « contre le rhume » ou « contre la douleur » contiennent plusieurs substances.

**Bien se faire conseiller**
- Dites d'emblée au pharmacien que vous êtes enceinte, et à combien de semaines.
- Signalez votre grossesse à tout professionnel : médecin, dentiste, kinésithérapeute.
- Lisez la notice et cherchez les pictogrammes grossesse.
- Notez dans votre carnet ou votre téléphone ce que vous prenez, pour en parler à la consultation.

**Les gestes qui soulagent sans médicament**
Lavage de nez, repos, hydratation, chaleur pour le dos, position sur le côté pour dormir, repas fractionnés : ces mesures simples sont détaillées dans nos articles sur chaque petit mal.

## Questions fréquentes
**Le paracétamol est-il possible ?**
L'Assurance Maladie indique que le paracétamol peut être utilisé pendant la grossesse, dans le respect des règles d'usage de la notice. Demandez conseil si vous en avez besoin plusieurs jours de suite.

**Les produits « naturels » sont-ils plus sûrs ?**
Pas forcément. Plantes, huiles essentielles et compléments contiennent des substances actives. L'Assurance Maladie recommande de demander conseil avant tout produit à base de plantes.

**J'ai pris un anti-inflammatoire sans savoir que j'étais enceinte : que faire ?**
Ne restez pas seule avec l'inquiétude : parlez-en à votre médecin ou à votre sage-femme, qui évaluera la situation selon le moment de la grossesse et le produit pris.

## Quand demander conseil
Appelez votre pharmacien, votre sage-femme ou votre médecin avant de prendre un médicament ou un produit dont vous n'avez pas encore parlé avec eux pendant cette grossesse. En cas de prise accidentelle d'un produit en quantité importante, de malaise ou de réaction après un médicament (gonflement du visage, difficulté à respirer, éruption), appelez le **15** ou le **112** ; le centre antipoison peut aussi être contacté.

${FIN}`,
  },
];
