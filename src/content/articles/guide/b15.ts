/** Guide complet — lot 15 (27/10/2026) : grossesse, petits maux complémentaires (rhume, toux, gorge, grippe, fièvre, gastro, maux de tête, migraine, insomnie, impatiences, gencives, nez, mycose, pertes, envies d'uriner, sciatique, canal carpien, essoufflement, palpitations, vertiges, démangeaisons, fatigue). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». Aucune dose de médicament. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est indiquée.
const S = {
  ameliMedGrossesse: { label: 'ameli.fr — Médicaments et grossesse', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/medicament-grossesse', consulted_on: C, published: '2025-04-28' },
  ameliRhume: { label: 'ameli.fr — Rhinopharyngite de l’adulte : quel traitement ?', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-adulte/traitement-medical', consulted_on: C, published: '2026-02-04' },
  ansmRhume: { label: 'ANSM — Tu as un rhume : que faire ? (document patient)', url: 'https://ansm.sante.fr/uploads/2021/09/13/information-pour-les-patients-vous-avez-un-rhume-que-faire-2.pdf', consulted_on: C, published: '2020-09' },
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

const FIN = 'Cet article t’informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (sage-femme, médecin, pharmacien).';

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
- Avant tout médicament, même vendu sans ordonnance, demande l'avis de ton pharmacien, de ta sage-femme ou de ton médecin.

## Comprendre
Un rhume est une infection du nez et de la gorge causée par un virus. L'Assurance Maladie rappelle que les antibiotiques n'agissent que sur les bactéries : ils ne soignent donc pas un rhume, chez la femme enceinte comme chez les autres adultes. Le traitement vise seulement à te soulager en attendant la guérison.

Les **décongestionnants** méritent une attention particulière. Ils réduisent la sensation de nez bouché, mais l'Agence nationale de sécurité du médicament (ANSM) signale des effets indésirables rares mais graves (infarctus, AVC, réactions cutanées sévères). L'Assurance Maladie indique qu'ils sont contre-indiqués pendant la grossesse et l'allaitement ; l'ANSM précise qu'ils sont fortement déconseillés pendant la grossesse et qu'un avis médical est indispensable avant toute prise. Depuis le 11 décembre 2024, les comprimés ne sont délivrés que sur ordonnance. Ces produits sont souvent associés, dans une même boîte, à d'autres substances : lis toujours la composition.

Plus largement, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse et de signaler ta grossesse à tout professionnel qui te conseille un traitement.

## Au quotidien
**Dégager le nez**
- Fais des lavages de nez réguliers (sérum physiologique, spray d'eau de mer ou d'eau thermale), puis mouche-toi doucement, une narine après l'autre.
- Utilise des mouchoirs à usage unique et jette-les aussitôt.

**Mieux respirer la nuit**
- Dors la tête un peu surélevée, avec un oreiller supplémentaire.
- Garde la chambre fraîche, autour de 18 à 20 °C, et aère-la chaque jour.
- Évite la climatisation, qui assèche les muqueuses, ainsi que le tabac et la fumée des autres.

**Prendre soin de toi**
- Bois régulièrement : eau, bouillons, tisanes adaptées à la grossesse (demande conseil pour les plantes).
- Repose-toi autant que possible ; le rhume fatigue, et la grossesse aussi.
- Protège ton entourage : lavage des mains, toux dans le coude, masque si tu côtoies des personnes fragiles.

**Si tu as de la fièvre ou mal**
L'Assurance Maladie indique que le paracétamol est l'antalgique à privilégier et qu'il peut être utilisé pendant la grossesse, en respectant les règles d'usage de la notice. Les anti-inflammatoires (ibuprofène, kétoprofène…) sont à éviter : leur automédication est contre-indiquée pendant toute la grossesse, et ils sont formellement contre-indiqués à partir du 6e mois.

## Questions fréquentes
**Puis-je utiliser un spray nasal « pour nez bouché » acheté en pharmacie ?**
Tout dépend de sa composition. Les sprays d'eau de mer ou de sérum physiologique servent au lavage. Les sprays contenant un vasoconstricteur sont contre-indiqués pendant la grossesse. Montre le produit à ton pharmacien et dis-lui que tu es enceinte.

**Un rhume peut-il gêner le bébé ?**
Un rhume simple touche surtout le nez et la gorge. En revanche, une fièvre au-dessus de 38 °C pendant la grossesse justifie d'appeler ton médecin dans la journée (voir notre article sur la fièvre pendant la grossesse).

**Les huiles essentielles peuvent-elles déboucher le nez ?**
L'Assurance Maladie déconseille fortement les huiles essentielles pendant la grossesse. Mieux vaut s'en tenir aux lavages de nez.

**Combien de temps dure un rhume ?**
En général 7 à 10 jours. Si les symptômes persistent ou ne s'améliorent pas après 5 jours, l'ANSM conseille de consulter.

## Quand demander conseil
Contacte ton médecin ou ta sage-femme dans la journée en cas de fièvre au-dessus de 38 °C, de douleur du visage ou d'oreille qui augmente, de symptômes qui durent plus de 5 jours ou qui s'aggravent. Appelle le **15** ou le **112** en cas de difficulté à respirer, de douleur dans la poitrine ou de malaise.

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
- Certains médicaments contre la toux sont **contre-indiqués chez la femme enceinte** : demande toujours conseil à ton pharmacien.
- Air sain, boissons, tête surélevée la nuit et miel peuvent apaiser.
- Toux avec fièvre au-dessus de 38 °C pendant la grossesse : consulte ton médecin **dans la journée**.

## Comprendre
Tousser est un réflexe de défense : la toux aide à dégager les voies respiratoires. On distingue la **toux sèche**, qui irrite sans rien ramener, et la **toux grasse**, qui fait remonter des sécrétions. Cette différence compte pour le choix d'un éventuel traitement.

L'Assurance Maladie rappelle que les antitussifs (médicaments qui calment la toux) sont souvent peu efficaces, peuvent entraîner des effets indésirables, dont une baisse de vigilance, et privent la toux de son rôle utile. Ils ne sont pas adaptés à une toux grasse. Quant aux expectorants et fluidifiants, ils ne font l'objet d'aucune recommandation scientifique. Surtout, **certains médicaments contre la toux sont contre-indiqués pendant la grossesse** : lis la notice et parles-en à ton pharmacien.

De façon générale, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse, y compris pour les produits vendus sans ordonnance ou à base de plantes.

## Au quotidien
**Assainir l'air**
- Évite le tabac et les pièces enfumées ; si tu fumes, parles-en à ta sage-femme ou à ton médecin, qui peuvent t’aider à arrêter.
- Aère ton logement plusieurs fois par jour.
- Limite les parfums d'intérieur, bougies parfumées et aérosols, qui irritent les voies respiratoires.

**La nuit**
- Surélève ta tête avec un ou deux oreillers.
- Garde un verre d'eau à portée de main.
- Si la toux te réveille, lève-toi un moment, bois quelques gorgées et respire calmement.

**Boire et adoucir**
- Bois régulièrement tout au long de la journée.
- Le miel peut apaiser la gorge, notamment avant le coucher.

**Ménager son corps**
- Si tu as de petites fuites urinaires en toussant, parles-en à ta sage-femme : elle peut te conseiller.
- Repose-toi : une infection, même banale, fatigue davantage pendant la grossesse.

## Questions fréquentes
**Puis-je prendre un sirop contre la toux ?**
Pas sans conseil. Certains sirops sont contre-indiqués pendant la grossesse et les antitussifs ne conviennent pas à une toux grasse. Ton pharmacien t’orientera selon le type de toux et le stade de ta grossesse.

**Ma toux dure depuis plus de deux semaines, est-ce inquiétant ?**
Une toux grasse peut durer deux à trois semaines. Au-delà de trois semaines malgré les mesures prises, ou si elle s'aggrave ou gêne tes activités, l'Assurance Maladie conseille de consulter.

**J'ai de la fièvre et je tousse : que faire ?**
Pendant la grossesse, une fièvre au-dessus de 38 °C avec une toux justifie de consulter ton médecin dans la journée.

**Tousser fort, est-ce un souci pour la grossesse ?**
Une toux forte et répétée est surtout fatigante et inconfortable (ventre, côtes). Parles-en si elle devient pénible, et consulte sans attendre si tu ressens des douleurs du ventre, des contractions ou un écoulement en toussant.

## Quand demander conseil
Consulte dans la journée en cas de fièvre au-dessus de 38 °C, d'essoufflement ou d'autres symptômes associés. Consulte dans les jours qui viennent si la toux persiste au-delà de trois semaines, s'aggrave ou devient gênante. Appelle le **15** ou le **112** sans tarder en cas de difficulté à inspirer, de douleur dans la poitrine avec crachats sanglants ou mousseux, ou de sensation d'étouffement.

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
- Difficulté à respirer ou à avaler : consulte **dans la journée**.

## Comprendre
La gorge irritée, qui gratte ou qui brûle en avalant, est le plus souvent liée à une infection virale de la sphère ORL. L'Assurance Maladie explique que la production de salive aide à calmer l'inflammation : c'est pourquoi sucer une pastille ou un bonbon soulage souvent.

Pendant la grossesse, le choix des produits demande plus d'attention. L'Assurance Maladie indique que le paracétamol peut être utilisé pendant la grossesse, en respectant la notice, et que les AINS (comme l'ibuprofène) sont contre-indiqués à partir du 6e mois. Plus largement, elle rappelle que toute automédication par AINS est contre-indiquée pendant la grossesse, même en gel ou en crème. Les pastilles, collutoires et bains de bouche vendus en pharmacie contiennent des substances variées : demande au pharmacien ce qui convient à ta situation.

## Au quotidien
**Ce qui soulage**
- Suce des pastilles adaptées (conseillées par ton pharmacien) ou des bonbons : la salive apaise la gorge.
- Préfère les aliments frais et faciles à avaler : yaourts, compotes, soupes tièdes, purées.
- Évite les boissons et plats très chauds, épicés ou acides, qui irritent.
- Bois souvent, par petites gorgées.

**Ménager sa gorge**
- Ne force pas sur la voix et évite de te racler la gorge.
- Aère ta chambre chaque jour et garde une température modérée.
- Tiens-toi loin de la fumée de tabac.

**Traiter la cause**
- Si le nez coule ou est bouché, les lavages de nez limitent l'écoulement dans la gorge.
- Si ton mal de gorge vient plutôt de remontées acides (fréquentes en fin de grossesse), le soulagement passe par d'autres gestes : repas plus légers, ne pas s'allonger juste après manger. Parles-en à ta sage-femme.
- En cas d'allergie connue (pollens, poussière), limite l'exposition.

## Questions fréquentes
**Puis-je prendre des pastilles vendues sans ordonnance ?**
Certaines contiennent des anesthésiques locaux, des antiseptiques ou d'autres substances. Signale ta grossesse au pharmacien, qui te conseillera un produit adapté.

**Comment savoir si c'est une angine ?**
Seul un professionnel peut le dire après examen. Une angine due à une bactérie se traite par antibiotique, alors qu'une infection virale guérit seule. Si la douleur est forte, s'accompagne de fièvre ou ne passe pas, consulte.

**Le mal de gorge peut-il venir de l'estomac ?**
Oui, des remontées acides peuvent irriter la gorge. L'Assurance Maladie cite le reflux parmi les causes à traiter pour soulager un mal de gorge.

**Au bout de combien de temps consulter ?**
Si le mal de gorge ne régresse pas après 5 jours, s'il revient souvent ou si une fatigue importante persiste plus d'une semaine, consulte ton médecin.

## Quand demander conseil
Consulte dans la journée si tu as du mal à respirer ou à avaler, si tu ne parviens plus à boire, ou en cas de fièvre au-dessus de 38 °C. Consulte dans les jours qui viennent si le mal de gorge dure plus de 5 jours ou revient souvent. Appelle le **15** ou le **112** si tu as une gêne respiratoire importante, des lèvres bleutées ou un malaise.

${FIN}`,
  },
  {
    ...K, slug: 'grippe-pendant-la-grossesse-reagir', category: 'sante-grossesse', safety_critical: true,
    title: 'Grippe pendant la grossesse : reconnaître, réagir vite et se protéger',
    summary: 'Pourquoi la grippe demande de consulter rapidement quand on est enceinte, ce que tu peux faire à la maison, et l’intérêt du vaccin.',
    tags: ['grippe', 'fièvre', 'courbatures', 'enceinte', 'vaccin grippe', 'virus', 'hiver', 'gestes barrières'],
    sources: [S.ameliGrippe, S.ameliGrippeVaccin, S.ameliToux],
    body_md: `## En bref
- Les femmes enceintes sont particulièrement vulnérables face à la grippe : en cas de symptômes, **consulte rapidement ton médecin**.
- À la maison : boire beaucoup, se reposer, vêtements légers, masque et gestes barrières.
- La vaccination est possible **quel que soit le trimestre** et protège aussi le bébé pendant ses 6 premiers mois.
- Essoufflement au repos, fièvre qui revient après une amélioration ou troubles de la conscience : il faut un avis médical très vite.

## Comprendre
La grippe est une infection virale qui débute souvent brutalement : fièvre élevée, courbatures, grande fatigue, maux de tête, toux. L'Assurance Maladie présente les femmes enceintes comme très vulnérables face à cette maladie : une grippe peut entraîner une atteinte pulmonaire sévère, une hospitalisation ou une naissance prématurée. C'est pourquoi la grossesse figure parmi les situations où il faut **consulter rapidement** son médecin traitant en cas de grippe, sans attendre que les symptômes s'aggravent.

La prévention repose d'abord sur le **vaccin**. Selon l'Assurance Maladie, il peut être fait dès le début de la campagne de vaccination, quel que soit le trimestre de grossesse. Les anticorps de la mère protègent l'enfant pendant ses 6 premiers mois, période où il est le plus fragile et ne peut pas être vacciné lui-même. L'Assurance Maladie indique que ces vaccins ne sont associés à aucun sur-risque de fausse couche, de malformation ou de maladie de l'enfant.

## Au quotidien
**Si tu penses avoir la grippe**
- Appelle ton médecin traitant ou ta sage-femme pour être examinée rapidement ; signale que tu es enceinte et à combien de semaines.
- Bois régulièrement et abondamment tant que tu as de la fièvre.
- Porte des vêtements légers, évite de te couvrir de couettes épaisses.
- Repose-toi ; fais-toi aider pour les repas, les courses et les aînés.
- Pour la fièvre et les douleurs, l'Assurance Maladie indique que le paracétamol est généralement conseillé, en respectant ses contre-indications ; demande l'avis du médecin ou du pharmacien. Pas d'anti-inflammatoire sans avis médical.

**Protéger l'entourage**
- Porte un masque dès que tu n'es pas seule.
- Lave-toi souvent les mains, tousse dans ton coude.

**Se faire vacciner**
- Le vaccin peut être prescrit et fait par un médecin, une sage-femme, un pharmacien ou un infirmier.
- Un bon de prise en charge permet de retirer le vaccin sans frais en pharmacie.
- Les gestes barrières viennent en complément, pendant toute la saison.

## Questions fréquentes
**Est-ce une grippe ou un rhume ?**
Le rhume touche surtout le nez et la gorge, avec peu ou pas de fièvre. La grippe donne en général une fièvre plus élevée, des courbatures et une fatigue marquée. Dans le doute, appelle ton médecin.

**Puis-je me faire vacciner au premier trimestre ?**
Oui : l'Assurance Maladie indique que la vaccination est possible quel que soit le trimestre.

**J'ai été vaccinée l'an dernier, est-ce suffisant ?**
Le vaccin contre la grippe est adapté chaque année aux virus en circulation : il se refait à chaque saison. Parles-en à ta sage-femme ou à ton pharmacien.

**Le bébé est-il protégé à la naissance si je suis vaccinée ?**
Oui, c'est l'un des grands intérêts du vaccin pendant la grossesse : il protège le nourrisson pendant ses 6 premiers mois.

## Quand demander conseil
Consulte rapidement ton médecin dès les premiers symptômes de grippe. Demande un avis médical très vite en cas d'essoufflement au repos ou de difficulté à respirer, de fièvre qui réapparaît après une amélioration, de toux avec crachats purulents ou sanglants, de diarrhée avec déshydratation ou de fièvre mal supportée. Appelle le **15** ou le **112** en cas de difficulté respiratoire importante, de douleur dans la poitrine, de confusion ou de malaise.

${FIN}`,
  },
  {
    ...K, slug: 'fievre-pendant-la-grossesse-que-faire', category: 'sante-grossesse', safety_critical: true,
    title: 'Fièvre pendant la grossesse : les bons réflexes',
    summary: 'Au-delà de 38 °C, une fièvre pendant la grossesse justifie un avis médical dans la journée : comment la mesurer, quoi faire en attendant, quand appeler le 15.',
    tags: ['fièvre', 'température', '38 degrés', 'enceinte', 'infection', 'frissons', 'paracétamol', 'quand consulter'],
    sources: [S.ameliToux, S.ameliGrippe, S.ameliInfections],
    body_md: `## En bref
- Pendant la grossesse, une température **au-dessus de 38 °C** justifie de contacter ton médecin ou ta sage-femme **dans la journée**.
- La fièvre est un signe, pas une maladie : il faut en chercher la cause (virus, infection urinaire, autre infection).
- En attendant : boire, se reposer, se découvrir ; demande conseil avant tout médicament.
- Fièvre avec difficulté à respirer, contractions, perte de liquide ou malaise : appelle le **15** ou pars à la maternité.

## Comprendre
La fièvre traduit le plus souvent une réaction de l'organisme à une infection. Pendant la grossesse, elle mérite une attention particulière, car certaines infections doivent être recherchées et traitées rapidement. L'Assurance Maladie indique ainsi qu'une femme enceinte qui a une température supérieure à 38 °C, par exemple avec une toux, doit consulter son médecin dans la journée. En cas de grippe, la grossesse fait partie des situations où il faut consulter rapidement.

Parmi les causes possibles, les **infections urinaires** sont fréquentes pendant la grossesse, car la pression du bébé sur la vessie favorise la stase des urines. Leurs symptômes sont souvent discrets ; l'Assurance Maladie souligne que le principal risque est l'infection des reins (pyélonéphrite), qui peut entraîner un accouchement prématuré. C'est l'une des raisons pour lesquelles une fièvre doit être examinée par un professionnel.

## Au quotidien
**Mesurer correctement**
- Utilise un thermomètre médical, au repos, en dehors d'un bain chaud ou d'un effort.
- Note l'heure et la valeur ; recommence quelques heures plus tard si besoin.
- Note aussi les autres signes : frissons, toux, brûlures en urinant, douleurs du dos ou du ventre, éruption, contractions.

**En attendant l'avis médical**
- Bois régulièrement et abondamment.
- Porte des vêtements légers, évite les couvertures épaisses, garde la pièce aérée.
- Repose-toi.
- Pour un médicament contre la fièvre, demande l'avis du médecin, de la sage-femme ou du pharmacien. L'Assurance Maladie indique que le paracétamol est généralement conseillé contre la fièvre, dans le respect de ses contre-indications ; les anti-inflammatoires ne doivent pas être pris en automédication pendant la grossesse.

**Préparer l'appel**
- Aie sous la main ton terme (en semaines), tes traitements en cours et tes derniers résultats d'analyses.
- Si ta maternité dispose d'un numéro pour les urgences obstétricales, garde-le dans ton téléphone.

## Questions fréquentes
**38 °C, est-ce vraiment de la fièvre ?**
Le repère donné par l'Assurance Maladie pour consulter pendant la grossesse est une température supérieure à 38 °C. En dessous, surveille l'évolution et les autres symptômes.

**Puis-je attendre le lendemain si je me sens bien ?**
Le conseil officiel est de consulter dans la journée. Un appel à ton médecin, à ta sage-femme ou à la maternité permet d'évaluer la situation.

**La fièvre peut-elle venir d'une infection urinaire sans brûlures ?**
Oui, les symptômes d'infection urinaire sont souvent peu marqués pendant la grossesse. C'est pourquoi une bandelette urinaire est faite chaque mois à partir du 4e mois, et pourquoi une fièvre doit être examinée.

**Et en fin de grossesse ?**
Une fièvre associée à des contractions, à une perte de liquide ou à des pertes inhabituelles nécessite de contacter la maternité sans attendre.

## Quand demander conseil
Contacte ton médecin ou ta sage-femme dans la journée pour toute fièvre au-dessus de 38 °C. Appelle la maternité ou le **15** (ou le **112**) sans attendre en cas de fièvre avec difficulté à respirer, douleur dans la poitrine, raideur de la nuque, confusion, contractions, perte de liquide, saignements ou si ton bébé bouge moins.

${FIN}`,
  },
  {
    ...K, slug: 'gastro-enterite-pendant-la-grossesse', category: 'sante-grossesse',
    title: 'Gastro-entérite pendant la grossesse : s’hydrater et savoir quand consulter',
    summary: 'Diarrhée, vomissements : boire avant tout, manger léger, éviter les médicaments sans avis, et repérer les signes de déshydratation.',
    tags: ['gastro', 'gastro-entérite', 'diarrhée', 'vomissements', 'déshydratation', 'enceinte', 'hydratation', 'virus'],
    sources: [S.ameliGastro, S.ameliGastroTraitement, S.ameliMedGrossesse],
    body_md: `## En bref
- La priorité est d'**éviter la déshydratation** : bois plus que d'habitude, par petites quantités, souvent.
- Petits repas simples (riz, pâtes, pommes de terre, carottes cuites, bouillons) et pause temporaire des produits laitiers.
- Pas de médicament contre la diarrhée ou les vomissements sans l'avis de ton pharmacien ou de ton médecin.
- Urines rares, bouche sèche, somnolence ou impossibilité de boire : consulte **immédiatement**.

## Comprendre
La gastro-entérite est une infection du tube digestif, le plus souvent due à un virus. Elle provoque diarrhée, parfois vomissements, douleurs du ventre et fièvre. L'Assurance Maladie rappelle que la prise en charge vise d'abord à éviter la déshydratation et la contamination de l'entourage, et que les antibiotiques ne sont pas utiles dans la grande majorité des cas, puisque les diarrhées aiguës sont surtout d'origine virale.

Pendant la grossesse, la déshydratation est à surveiller de près : ses signes (urines rares, bouche sèche, soif intense, somnolence) doivent faire consulter immédiatement. Par ailleurs, l'Assurance Maladie recommande d'éviter l'automédication pendant la grossesse, y compris pour les médicaments sans ordonnance : signale toujours ta grossesse au pharmacien.

Si tu vomis depuis le début de la grossesse, sans diarrhée ni fièvre, il s'agit plus probablement de nausées et vomissements de grossesse, qui ont leur propre prise en charge : parles-en à ta sage-femme ou à ton médecin.

## Au quotidien
**Boire, encore et souvent**
- Bois davantage que d'habitude : eau, eau légèrement sucrée, bouillon de légumes salé.
- Si tu vomis, bois par toutes petites gorgées, à intervalles réguliers, plutôt qu'un grand verre d'un coup.
- Le médecin peut prescrire un soluté de réhydratation orale, à prendre fréquemment par petites quantités.
- Évite les boissons glacées.

**Manger léger**
- Privilégie de petits repas plus fréquents : riz, pâtes, semoule, pommes de terre, carottes cuites, viandes maigres bien cuites, bouillons.
- Évite temporairement les fruits et légumes crus et les aliments riches en fibres (la banane fait exception).
- Mets de côté le lait et les produits laitiers quelques jours.
- Ne te force pas à manger les premières heures : boire compte davantage.

**Éviter de contaminer les autres**
- Lave-toi très souvent les mains, surtout après être allée aux toilettes et avant de cuisiner.
- Ne partage ni serviette, ni couverts, ni verre.
- Si possible, laisse quelqu'un d'autre préparer les repas de la famille.

**Se reposer**
Allonge-toi dès que possible, lève-toi lentement pour limiter les étourdissements.

## Questions fréquentes
**Puis-je prendre un médicament contre la diarrhée ?**
Demande conseil d'abord. L'Assurance Maladie précise que les ralentisseurs du transit sont à éviter en cas de sang dans les selles et ne remplacent pas l'hydratation, et que les pansements intestinaux peuvent diminuer l'effet d'autres médicaments. Pendant la grossesse, l'avis du pharmacien ou du médecin est indispensable.

**La gastro peut-elle déclencher des contractions ?**
Une gastro rend le ventre douloureux et peut être difficile à distinguer de contractions. Si tu ressens des contractions régulières, des douleurs qui ne passent pas ou une perte de liquide, contacte la maternité.

**Comment éviter une gastro quand les enfants l'ont ?**
Lavage des mains fréquent, linge et toilettes nettoyés, couverts séparés. Fais-toi aider pour les soins des enfants malades si possible.

**Au bout de combien de temps consulter ?**
Si la diarrhée ou les vomissements durent plus de deux jours, consulte. Pendant la grossesse, n'hésite pas à appeler plus tôt en cas de fièvre, de douleurs ou si tu ne gardes rien.

## Quand demander conseil
Consulte dans la journée en cas de forte fièvre, de douleurs importantes, de grande fatigue ou si tu ne parviens pas à boire. Consulte dans les jours qui viennent si les symptômes durent plus de deux jours ou s'il y a du sang ou des glaires dans les selles. Consulte **immédiatement** en cas de signes de déshydratation (urines rares, soif intense, bouche sèche, somnolence, confusion), et appelle le **15** ou le **112** si tu ne tiens plus debout ou fais un malaise.

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
- Le paracétamol peut être utilisé pendant la grossesse, à la plus petite dose efficace et le moins longtemps possible : demande conseil.
- Les anti-inflammatoires (ibuprofène…) sont contre-indiqués à partir du 6e mois ; avant, n'en prends pas sans avis médical.
- Un mal de tête inhabituel, surtout en deuxième partie de grossesse, avec troubles de la vue, bourdonnements d'oreilles ou gonflement : consulte **en urgence**.

## Comprendre
Les maux de tête ont de nombreuses causes : fatigue, manque de sommeil, repas sautés, déshydratation, tension, écrans, chaleur. La grossesse, avec ses bouleversements de rythme et de sommeil, peut les favoriser. Souvent, du repos et quelques mesures simples suffisent à les soulager.

Pendant la grossesse, deux points méritent d'être connus. D'abord les **médicaments** : l'Assurance Maladie indique que le paracétamol est l'antalgique à privilégier et qu'il peut être pris pendant la grossesse, à la plus petite dose efficace et sur la durée la plus courte ; elle rappelle aussi qu'un surdosage peut entraîner des lésions graves du foie. Les AINS, eux, sont contre-indiqués à partir du 6e mois de grossesse ; avant, ne les prends pas sans avis médical.

Ensuite, à partir de la deuxième moitié de la grossesse, un mal de tête **inhabituel** peut être un signe d'hypertension. Santé.fr cite, parmi les signes d'hypertension à signaler, les maux de tête, les gonflements des mains, du visage ou des pieds, les bourdonnements d'oreilles et les « petites mouches » devant les yeux.

## Au quotidien
**Dès les premiers signes**
- Fais une pause au calme, dans une pièce peu éclairée, et allonge-toi si possible.
- Bois un grand verre d'eau, puis régulièrement dans la journée.
- Mange quelque chose si ton dernier repas date : sauter un repas peut déclencher ou entretenir un mal de tête.
- Éloigne-toi des écrans.

**Prévenir**
- Garde des repas et des collations réguliers.
- Essaie de dormir à des heures régulières, sans forcément dormir plus que d'habitude (dormir trop peut aussi aggraver une céphalée).
- Bouge chaque jour à ton rythme : une marche à l'air frais aide souvent.
- Aère les pièces, évite la chaleur excessive et les lieux enfumés.

**Garder une trace**
Note dans un carnet ou ton téléphone les jours, l'heure, la durée et les circonstances de tes maux de tête : c'est utile pour en parler lors de ta consultation mensuelle.

## Questions fréquentes
**Puis-je prendre le même médicament qu'avant ma grossesse ?**
Pas forcément. Beaucoup de médicaments contre la douleur contiennent des anti-inflammatoires ou des associations de substances. Montre ta boîte à ton pharmacien ou à ta sage-femme avant de la reprendre.

**Le paracétamol est-il possible pendant toute la grossesse ?**
L'Assurance Maladie indique qu'il peut être utilisé pendant la grossesse, en respectant la notice, à la plus petite dose efficace et le moins longtemps possible. Si tu en as besoin plusieurs jours de suite, parles-en.

**Pourquoi me prend-on la tension à chaque consultation ?**
La tension est mesurée à chaque consultation mensuelle pour dépister une hypertension, qui peut se manifester notamment par des maux de tête.

## Quand demander conseil
Parles-en à ton médecin ou à ta sage-femme si les maux de tête deviennent fréquents, changent de caractère ou ne cèdent pas. Consulte **dans la journée** pour un mal de tête nouveau et intense, ou accompagné de vomissements, de baisse de la vision ou de grande fatigue. À partir de la deuxième moitié de la grossesse, un mal de tête inhabituel avec troubles visuels, bourdonnements d'oreilles ou gonflement rapide du visage ou des mains impose une consultation **en urgence**. Appelle le **15** ou le **112** pour un mal de tête brutal et violent, avec faiblesse d'un côté du corps, troubles de la parole, confusion, fièvre ou raideur de la nuque.

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
- Ne prends **aucun médicament** contre la migraine, ni pour la crise ni en traitement de fond, sans en parler à ton médecin.
- L'aspirine et les anti-inflammatoires sont contre-indiqués ; certains traitements de fond le sont aussi.
- Une pièce calme et sombre, un linge froid sur le front et de l'eau aident pendant la crise.

## Comprendre
La migraine est une maladie qui se manifeste par des crises de maux de tête souvent intenses, parfois accompagnées de nausées et d'une gêne à la lumière ou au bruit. Beaucoup de femmes migraineuses constatent moins de crises pendant leur grossesse : l'Assurance Maladie parle d'un moment d'accalmie.

Les traitements, en revanche, doivent être revus. D'après l'Assurance Maladie :
- pour la crise, le **paracétamol** est le traitement de première intention pendant la grossesse ; certains **triptans** peuvent être utilisés si le paracétamol ne suffit pas, sur prescription ;
- l'**aspirine** et les **anti-inflammatoires non stéroïdiens** (AINS) sont contre-indiqués ;
- parmi les traitements de fond, le **topiramate** est contre-indiqué pendant la grossesse, et les **anti-CGRP** sont à éviter car leurs effets chez la femme enceinte sont mal connus.

Si tu prenais un traitement de fond avant d'être enceinte, ne l'arrête pas et ne le modifie pas seule : contacte ton médecin dès que tu apprends ta grossesse, pour faire le point ensemble.

## Au quotidien
**Pendant une crise**
- Allonge-toi dans une pièce calme et sombre.
- Pose un linge frais sur ton front.
- Bois de l'eau, surtout si tu as vomi.
- Si ton médecin t’a indiqué un traitement compatible avec la grossesse, prends-le dès le début de la crise, comme il te l'a expliqué.

**Limiter les déclencheurs**
- Garde des horaires de lever et de coucher réguliers et un sommeil suffisant.
- Mange à heures régulières, sans sauter de repas, et bois régulièrement.
- Bouge chaque jour, à un rythme adapté à ta grossesse : la marche est une bonne option.
- Si certains aliments déclenchent tes crises (chocolat, aliments contenant du glutamate…), réduis-les sans pour autant suivre un régime strict.
- Prends des temps de relaxation et évite les lieux bruyants quand c'est possible.

**Tenir un calendrier des crises**
Note la date, la durée, l'intensité, les circonstances et ce que tu as pris. Ce calendrier aide ton médecin à adapter la prise en charge.

## Questions fréquentes
**Mes crises ne diminuent pas, est-ce inquiétant ?**
Chaque grossesse est différente. Si les crises restent fréquentes ou intenses, parles-en à ton médecin : il existe des options compatibles avec la grossesse.

**Puis-je reprendre mon triptan habituel ?**
Seul ton médecin peut le dire : l'Assurance Maladie précise que certains triptans peuvent être utilisés pendant la grossesse si le paracétamol est inefficace, mais pas tous, et toujours sur prescription.

**Comment distinguer ma migraine habituelle d'un autre mal de tête ?**
Si le mal de tête ne ressemble pas à tes crises habituelles (plus brutal, plus intense, avec des troubles visuels différents, des bourdonnements, un gonflement du visage ou des mains, ou de la fièvre), consulte sans attendre.

## Quand demander conseil
Consulte ton médecin dès le début de la grossesse si tu es migraineuse, et ensuite si les crises perturbent ta vie quotidienne ou si tu prends des antalgiques plus de trois jours par semaine. Consulte **en urgence** pour un mal de tête inhabituel en deuxième partie de grossesse, surtout avec troubles visuels, bourdonnements d'oreilles ou gonflements. Appelle le **15** ou le **112** pour un mal de tête brutal et violent, avec faiblesse d'un membre, troubles de la parole, confusion ou raideur de la nuque.

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
- Face à ces signes, n'attends pas le prochain rendez-vous : consulte en urgence (maternité, **15** ou **112**).

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
- Relis la liste ci-dessus avec ton partenaire ou un proche : en cas de doute, il est plus facile d'agir à deux.
- Garde dans ton téléphone le numéro des urgences de ta maternité.

**Aux consultations**
- Signale tout mal de tête inhabituel, trouble de la vue ou gonflement apparu récemment, même s'il a disparu.
- Si l'on t’a prescrit une automesure de la tension à domicile, suis la méthode indiquée et note aussi tes symptômes.

**Distinguer les gonflements**
Des jambes un peu lourdes ou des chevilles qui gonflent en fin de journée, surtout quand il fait chaud, peuvent survenir pendant la grossesse. Ce qui doit alerter, c'est un gonflement **rapide et important**, qui touche aussi les mains ou le visage, ou qui s'accompagne d'autres signes de la liste.

## Questions fréquentes
**J'ai mal à la tête en fin de grossesse : dois-je m'inquiéter ?**
Un mal de tête n'est pas toujours lié à la tension, mais à partir de 20 semaines, un mal de tête persistant ou inhabituel doit faire contrôler ta tension rapidement, surtout s'il s'accompagne d'autres signes.

**Peut-on mesurer la tension en pharmacie ?**
Santé.fr indique que la mesure de la tension et la recherche de protéines dans les urines peuvent aussi se faire en pharmacie. En présence de signes d'alerte, la maternité ou le médecin restent l'interlocuteur à privilégier.

**La prééclampsie peut-elle survenir après l'accouchement ?**
Oui, selon Santé.fr, elle peut apparaître dans le post-partum. Les mêmes signes doivent alerter après la naissance.

**Que se passe-t-il si c'est une prééclampsie ?**
La prise en charge dépend de la gravité : surveillance rapprochée, traitement, hospitalisation, et parfois accouchement anticipé décidé par l'équipe.

## Quand demander conseil
Consulte **en urgence**, sans attendre le prochain rendez-vous, en cas de maux de tête persistants, de troubles visuels, de bourdonnements d'oreilles, de douleur forte sous les côtes ou de gonflement rapide du visage, des mains ou des chevilles. Appelle le **15** ou le **112** en cas de convulsions, de malaise, de douleur intense ou si les symptômes sont très marqués.

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

On parle d'insomnie aiguë quand les difficultés durent d'une nuit à quelques semaines. Elle est souvent liée à une période particulière, comme la fin de grossesse. Les conseils de base sont les mêmes que pour tout adulte, adaptés à ton corps qui change. Côté médicaments, Santé.fr est clair : chez la femme enceinte, les hypnotiques ne doivent jamais être utilisés sans avis préalable du médecin. L'Assurance Maladie rappelle aussi que certains somnifères pris en fin de grossesse peuvent entraîner des signes de sevrage chez le nouveau-né.

## Au quotidien
**Le soir**
- Limite café, thé et sodas caféinés, surtout après 16 heures, et évite l'alcool.
- Dîne léger, sans trop de graisses, et pas trop tard, pour limiter les remontées acides.
- Éloigne les écrans au moment du coucher et coupe les notifications.
- Choisis un rituel apaisant : douche tiède, lecture, musique douce, respiration lente.
- Bois surtout dans la journée et un peu moins juste avant de te coucher, pour limiter les levers nocturnes (sans réduire tes boissons sur la journée).

**La chambre**
- Garde-la sombre, calme, aérée, entre 18 et 20 °C.
- Installe-toi sur le côté, avec un coussin entre les genoux ou sous le ventre si cela te soulage.

**Quand le sommeil ne vient pas**
- Si tu ne dors pas au bout d'un moment, lève-toi et fais une activité calme sous une lumière tamisée ; reviens au lit quand la somnolence revient.
- Évite de regarder l'heure sans cesse.
- Note sur un papier ce qui te préoccupe (liste pour la valise, questions pour la sage-femme) : cela aide à « déposer » ses pensées.

**Dans la journée**
- Une petite sieste peut aider, mais reste autour d'une vingtaine de minutes si tes nuits sont difficiles.
- Bouge un peu chaque jour, de préférence pas trop tard le soir.

## Questions fréquentes
**Est-ce que mon manque de sommeil gêne le bébé ?**
Ta fatigue te concerne d'abord, et elle mérite d'être prise au sérieux. Parles-en à ta sage-femme : elle peut t’aider à trouver ce qui t’empêche de dormir et des solutions adaptées.

**Puis-je prendre une tisane ou un complément « sommeil » ?**
L'Assurance Maladie déconseille fortement les compléments alimentaires et les huiles essentielles pendant la grossesse, et recommande de demander conseil avant tout produit à base de plantes.

**Et si ce sont surtout mes pensées qui m'empêchent de dormir ?**
L'anxiété en fin de grossesse est fréquente. En parler à ta sage-femme, à ton médecin ou lors des séances de préparation à la naissance peut vraiment alléger. Des techniques de relaxation apprises avec un professionnel peuvent aussi aider.

## Quand demander conseil
Parles-en à ta sage-femme ou à ton médecin si l'insomnie dure, pèse sur tes journées ou ton moral, ou si elle s'accompagne de démangeaisons, d'impatiences dans les jambes ou de ronflements importants. Si tu te sens très angoissée, triste ou à bout, n'attends pas : en cas de détresse ou d'idées noires, appelle le **3114** (24 h/24). En cas d'urgence, appelle le **15** ou le **112**.

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
- Un manque de fer peut jouer un rôle : parles-en à ta sage-femme ou à ton médecin.
- Marcher, s'étirer, masser, appliquer du chaud ou du froid peut soulager.

## Comprendre
Le syndrome des jambes sans repos, aussi appelé « impatiences », est un trouble du sommeil. L'Assurance Maladie le décrit comme un besoin urgent et irrésistible de bouger les jambes, accompagné de sensations désagréables : picotements, fourmillements, tiraillements, décharges électriques ou brûlures. Ces sensations surviennent au repos, surtout allongée, le soir ou la nuit, et parfois en position assise prolongée (voyage, réunion, spectacle). Elles sont soulagées par le mouvement, ce qui oblige souvent à se lever et à marcher.

Les mécanismes exacts restent mal connus. Deux facteurs semblent jouer un rôle : une **insuffisance en fer** dans l'organisme, avec ou sans anémie, et un manque de dopamine dans certaines zones du système nerveux. La grossesse fait partie des causes reconnues : les besoins en fer augmentent fortement, et l'Assurance Maladie indique que les femmes enceintes sont particulièrement exposées à la carence, surtout en fin de grossesse.

Les impatiences ne sont pas des crampes : la crampe est une contraction douloureuse et brève d'un muscle, alors que les impatiences sont une sensation désagréable qui pousse à bouger.

## Au quotidien
**Quand les sensations arrivent**
- Lève-toi et marche quelques minutes.
- Étire doucement les mollets et les cuisses, masse tes jambes.
- Essaie des compresses fraîches ou un bain chaud (pas brûlant), selon ce qui te soulage.
- Occupe ton esprit avec une activité qui demande de l'attention : mots croisés, tricot, jeu.

**Au fil de la journée**
- Garde une activité physique régulière et adaptée à ta grossesse ; des étirements doux avant le coucher peuvent aider.
- Réduis le thé, le café et les boissons énergisantes ; l'alcool et le tabac sont à éviter pendant la grossesse.
- Évite les repas copieux et les efforts intenses en fin de journée.
- Garde des horaires de sommeil réguliers, une chambre calme et sombre, sans écran juste avant de dormir.

**Penser au fer**
Une alimentation variée qui apporte du fer (viande, poisson, légumes secs, associés à des fruits ou légumes riches en vitamine C) contribue à couvrir les besoins. Un bilan sanguin permet de vérifier si un complément est nécessaire : c'est au professionnel qui te suit d'en décider.

## Questions fréquentes
**Les impatiences vont-elles durer après la naissance ?**
L'Assurance Maladie indique qu'elles disparaissent généralement après l'accouchement. Si elles persistent, parles-en à ton médecin.

**Puis-je prendre un traitement ?**
Les médicaments des impatiences ne se prennent que sur prescription, et pendant la grossesse, le médecin évalue ce qui est possible. Évite l'automédication et signale tes impatiences à tout professionnel qui te prescrit un médicament, car certains traitements (dont certains antihistaminiques) peuvent les aggraver.

**Est-ce lié à mes jambes lourdes ?**
Ce sont deux choses différentes : les jambes lourdes concernent la circulation veineuse, les impatiences sont un trouble neurologique du sommeil. Les deux peuvent coexister pendant la grossesse.

## Quand demander conseil
Parles-en à ta sage-femme ou à ton médecin si les impatiences reviennent souvent, perturbent ton sommeil, ta concentration ou ton humeur : un bilan, notamment du fer, peut être utile. Consulte rapidement en cas de mollet gonflé, dur, chaud ou douloureux (signe possible de phlébite). En cas d'essoufflement brutal ou de douleur dans la poitrine, appelle le **15** ou le **112**.

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
- Continue à brosser, **plus doucement** sur les zones sensibles, avec une brosse souple et un dentifrice fluoré.
- Un **examen bucco-dentaire** est pris en charge à 100 % du 4e mois de grossesse jusqu'à 6 mois après l'accouchement.
- Après un vomissement : rince-toi la bouche et attends au moins une heure avant de te brosser les dents.

## Comprendre
Pendant la grossesse, les hormones modifient la réaction des gencives à la plaque dentaire. L'Assurance Maladie explique qu'elles deviennent plus sensibles aux bactéries, ce qui peut provoquer une inflammation : la **gingivite de grossesse**. On la remarque souvent au brossage, quand un peu de sang apparaît sur la brosse ou dans le crachat, ou quand la gencive paraît plus rouge et plus gonflée. Elle disparaît généralement après l'accouchement, mais elle mérite un suivi chez le dentiste.

Le premier réflexe est souvent de moins brosser là où ça saigne. C'est l'inverse qui aide : la plaque entretient l'inflammation. Il s'agit donc de **continuer à nettoyer soigneusement**, mais en douceur.

Les vomissements, fréquents en début de grossesse, ont aussi un effet sur les dents : l'acide de l'estomac fragilise l'émail et favorise les caries. D'où le conseil de se rincer la bouche et d'attendre avant de se brosser les dents.

## Au quotidien
**Le brossage**
- Brosse tes dents après chaque repas, avec une brosse à poils souples et un dentifrice fluoré.
- Nettoie toutes les faces des dents, y compris la jonction entre la dent et la gencive.
- Sur les zones enflammées, réduis la pression sans les éviter.
- Passe le fil dentaire avec précaution ; si tes espaces entre les dents sont larges ou tes gencives fragiles, les brossettes interdentaires conviennent souvent mieux.
- En cas de doute sur ta technique, demande au dentiste de te la montrer.

**Après un vomissement**
- Rince-toi la bouche à l'eau, ou avec un bain de bouche au bicarbonate ou au fluor.
- Attends au moins une heure avant de te brosser les dents.

**Profiter de l'examen bucco-dentaire**
- L'Assurance Maladie t’invite à un examen bucco-dentaire pris en charge à 100 %, du premier jour du 4e mois de grossesse jusqu'au dernier jour du 6e mois après l'accouchement.
- Apporte ta carte Vitale à jour, le courrier d'invitation et le formulaire de prise en charge ; s'il est perdu, la CPAM ou le dentiste peuvent le rééditer.
- Le dentiste vérifie dents et gencives, te conseille et peut proposer des rendez-vous de soins. Les soins suivants sont remboursés aux conditions habituelles.
- La sage-femme qui fait ton bilan prénatal de prévention peut aussi te rappeler l'importance du suivi bucco-dentaire.

## Questions fréquentes
**Les saignements sont-ils dus à une brosse trop dure ?**
Ce peut être un facteur. Une brosse souple et un geste doux limitent l'irritation, mais la cause principale est l'inflammation liée aux hormones et à la plaque.

**Peut-on se faire soigner les dents enceinte ?**
L'examen prévu par l'Assurance Maladie sert justement à faire le point et à programmer les soins utiles. Signale ta grossesse et son terme au dentiste, qui adaptera sa prise en charge.

**La gingivite va-t-elle disparaître toute seule ?**
Elle disparaît généralement après l'accouchement, mais une bonne hygiène et un suivi chez le dentiste pendant la grossesse restent recommandés.

**Les bains de bouche sont-ils utiles ?**
Après un vomissement, un rinçage à l'eau ou un bain de bouche au bicarbonate ou au fluor est conseillé. Pour un usage régulier, demande l'avis du dentiste ou du pharmacien.

## Quand demander conseil
Prends rendez-vous chez le dentiste si tes gencives saignent souvent, sont douloureuses ou gonflées, ou si tu as mal à une dent. Consulte rapidement en cas de gonflement de la joue, de fièvre ou de douleur dentaire intense. En cas de gonflement important du visage avec difficulté à avaler ou à respirer, appelle le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'saignement-de-nez-enceinte-gestes', category: 'corps-grossesse',
    title: 'Saignement de nez pendant la grossesse : les bons gestes',
    summary: 'Tête penchée en avant, narines pincées dix minutes : comment arrêter un saignement de nez, ce qu’il faut éviter et quand consulter.',
    tags: ['saignement de nez', 'épistaxis', 'nez qui saigne', 'enceinte', 'compression', 'tension', 'premiers secours'],
    sources: [S.ameliNez, S.ameliHta, S.ameliMedGrossesse],
    body_md: `## En bref
- Assieds-toi, **penche la tête en avant** (jamais en arrière) et respire par la bouche.
- Mouche-toi doucement une fois, puis **pince les narines** juste sous l'os du nez pendant **10 minutes** sans relâcher.
- Évite l'aspirine et les anti-inflammatoires sauf prescription, et limite les sprays décongestionnants (contre-indiqués pendant la grossesse).
- Saignement abondant, par les deux narines ou vers la gorge, ou malaise : appelle le **15**.

## Comprendre
Un saignement de nez vient le plus souvent de petits vaisseaux fragiles situés à l'avant de la cloison nasale. L'air sec, le mouchage fort, le grattage ou un rhume peuvent les irriter. La plupart des saignements de nez s'arrêtent avec une compression bien faite.

Pendant la grossesse, deux points méritent attention. D'une part, certains médicaments favorisent les saignements : l'Assurance Maladie conseille de ne pas prendre d'aspirine ni d'anti-inflammatoires sauf prescription, et ces derniers ne doivent de toute façon pas être pris en automédication pendant la grossesse. Les sprays décongestionnants, qui sont à limiter en cas de saignement de nez, sont par ailleurs contre-indiqués pendant la grossesse. D'autre part, l'hypertension artérielle fait partie des causes possibles de saignements de nez répétés : l'Assurance Maladie mentionne d'ailleurs les saignements de nez parmi les symptômes à noter lors d'un contrôle de la tension pendant la grossesse. Si tes saignements se répètent, signale-le lors de ta consultation.

## Au quotidien
**Pour arrêter le saignement**
1. Assieds-toi et penche la tête vers l'avant, en respirant par la bouche.
2. Mouche-toi très doucement, une seule fois, pour évacuer les caillots.
3. Pince les deux narines entre le pouce et l'index, juste sous la partie osseuse du nez, pendant 10 minutes, montre en main. Ne relâche pas pour vérifier.
4. Si le saignement continue, recommence 10 minutes.
5. Tu peux poser de la glace (dans un linge) sur le milieu du visage, au-dessus du nez.

**Après**
- Ne te mouche pas pendant au moins 12 heures, puis fais-le délicatement.
- Tousse ou éternue bouche ouverte.
- Ne gratte pas les croûtes et ne mets rien dans le nez.
- Évite pendant deux semaines les gros efforts, le port de charges lourdes et de pencher la tête vers le bas.
- Si le saignement a été long, dors la tête un peu surélevée quelques nuits.

**Prévenir**
- Humidifie l'air de la maison, surtout l'hiver.
- Fais des lavages de nez doux au sérum physiologique si ton nez est sec ou encombré.
- Mouche-toi sans forcer, une narine après l'autre.

## Questions fréquentes
**Pourquoi ne pas pencher la tête en arrière ?**
Le sang coulerait dans la gorge : on ne verrait plus si le saignement continue. L'Assurance Maladie recommande de pencher la tête vers l'avant.

**Puis-je mettre un coton dans le nez ?**
L'Assurance Maladie conseille de ne rien introduire dans le nez. La compression avec les doigts est le geste recommandé.

**Mes saignements reviennent souvent : que faire ?**
Consulte ton médecin. Il pourra contrôler ta tension et, si besoin, t’orienter vers un ORL.

## Quand demander conseil
Consulte ton médecin si le saignement persiste ou s'aggrave malgré deux compressions de 10 minutes, ou s'il se répète. Appelle le **15** ou le **112** si le sang coule en abondance par les deux narines et dans la gorge, si le saignement s'accompagne de pâleur, de sueurs, d'un malaise ou d'un pouls rapide, s'il survient après un choc important, ou si tu prends un traitement qui fluidifie le sang. Dans l'attente des secours, poursuis la compression (sauf traumatisme important du visage).

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
- Hors grossesse, on peut parfois se soigner seule ; **enceinte, l'automédication ne s'applique pas** : consulte dans la journée.
- Une infection vaginale pendant la grossesse peut avoir des conséquences pour le bébé (dont un risque d'accouchement prématuré) : d'où l'importance d'un diagnostic.
- Toilette intime externe, savon doux, sous-vêtements en coton : des gestes simples limitent l'irritation.

## Comprendre
La mycose vaginale est une infection due à un champignon, presque toujours *Candida albicans*. C'est, selon l'Assurance Maladie, la plus fréquente des vaginites. Elle se reconnaît à des démangeaisons, des sensations de brûlure, des grandes lèvres souvent rouges, enflées et douloureuses, et des pertes blanchâtres et épaisses.

D'autres infections vaginales donnent des signes différents : des pertes fluides, grisâtres ou jaunâtres et malodorantes évoquent une infection bactérienne ; des pertes mousseuses et malodorantes, un parasite. Elles demandent d'autres traitements. C'est l'une des raisons pour lesquelles l'Assurance Maladie demande aux femmes enceintes, ou qui pensent l'être, de **consulter leur médecin dans la journée** : une infection vaginale peut avoir des conséquences pour le fœtus, notamment un risque d'accouchement prématuré, et peut contaminer le bébé à l'accouchement.

Le médecin ou la sage-femme t’examine et peut faire un prélèvement vaginal pour identifier le germe. Pour la mycose, le traitement est local (ovules, capsules ou crème antifongiques), adapté à la grossesse. Pendant la grossesse, un suivi est prévu jusqu'à l'accouchement pour vérifier la guérison et l'absence de récidive.

## Au quotidien
**Avant la consultation**
- Évite la toilette intime juste avant le rendez-vous : le professionnel pourra mieux observer les pertes.
- Note depuis quand tu as des symptômes et s'ils ont changé.

**Hygiène intime**
- Une toilette intime une à deux fois par jour, uniquement sur la partie externe.
- Utilise un savon doux à pH neutre, sans parfum.
- Pas de douche vaginale : elle déséquilibre la flore.
- Rince bien et sèche en tamponnant.

**Vêtements**
- Préfère les sous-vêtements en coton et les vêtements amples ; les tissus synthétiques et serrés favorisent la macération.
- Change rapidement un maillot de bain mouillé.

**Pendant le traitement**
- Les ovules ou capsules s'utilisent de préférence le soir au coucher.
- Évite les rapports sexuels ou utilise un préservatif.
- L'amélioration peut prendre 24 à 48 heures.

## Questions fréquentes
**J'ai déjà eu des mycoses, je connais les symptômes. Puis-je acheter un traitement en pharmacie ?**
Pas pendant la grossesse : l'Assurance Maladie précise que l'automédication ne concerne pas les femmes enceintes. Consulte ton médecin ou ta sage-femme dans la journée.

**La mycose est-elle plus fréquente pendant la grossesse ?**
Les mycoses sont fréquentes chez les femmes en général. Les antibiotiques, le diabète ou certains médicaments les favorisent. Quelle que soit la cause, enceinte, il faut consulter.

**Mon partenaire doit-il être traité ?**
Pour une mycose, l'abstinence ou le préservatif pendant le traitement suffit en général. Pour certaines infections considérées comme sexuellement transmissibles, le partenaire doit être traité en même temps : le médecin te le dira.

**Et si ça revient ?**
Les récidives sont possibles. Signale-les : on parle de mycose récidivante à partir de quatre épisodes par an, et elle demande un traitement adapté.

## Quand demander conseil
Pendant la grossesse, consulte **dans la journée** en cas de démangeaisons, brûlures ou pertes inhabituelles. Consulte sans attendre si tu as aussi des douleurs du ventre, des brûlures en urinant, de la fièvre, des contractions ou un écoulement de liquide. En cas de saignement abondant ou de douleur intense, appelle la maternité ou le **15**.

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
- **Odeur forte, couleur jaune, verte ou grise, démangeaisons, brûlures** : consulte dans la journée.
- **Écoulement de liquide clair et continu**, ou **sang rouge** : pars à la maternité.

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
- Sous-vêtements en coton, changés chaque jour ; évite les vêtements trop serrés.
- Si tu utilises des protège-slips, change-les souvent et préfère des modèles non parfumés.

**Observer sans s'inquiéter**
- Repère l'aspect habituel de tes pertes : quantité, couleur, odeur.
- Un changement net (odeur, couleur, démangeaisons) mérite un avis.
- En fin de grossesse, si tu ne sais pas s'il s'agit de liquide ou de pertes, mets une protection propre et observe : un liquide qui mouille en continu doit te faire appeler la maternité.

## Questions fréquentes
**Mes pertes sont abondantes mais sans odeur, dois-je consulter ?**
Des sécrétions plus abondantes, sans odeur ni irritation, font partie des changements décrits pendant la grossesse. Signale-le à ta prochaine consultation si cela te préoccupe, et plus tôt si leur aspect change.

**J'ai des pertes un peu rosées après un examen ou un rapport : que faire ?**
Parles-en à ta sage-femme ou à ton médecin. Tout saignement rouge, même peu abondant, doit amener à consulter rapidement.

**Comment savoir si j'ai perdu les eaux ?**
La perte des eaux se présente comme un écoulement de liquide clair, souvent continu. En cas de doute, la maternité peut vérifier : il vaut mieux y aller pour rien que rester dans l'incertitude.

## Quand demander conseil
Consulte **dans la journée** en cas de pertes malodorantes, jaunes, vertes ou grises, de démangeaisons, de brûlures ou de douleurs en urinant. Rendez-vous **à la maternité** en cas d'écoulement de liquide, de saignement, de contractions régulières avant terme, de fièvre ou si ton bébé bouge moins. En cas de saignement abondant ou de malaise, appelle le **15** ou le **112**.

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
- Continue à **bien boire** : réduire tes boissons n'est pas une solution et peut favoriser les infections urinaires.
- **Brûlures en urinant, douleurs du bas du ventre ou fièvre** : consulte rapidement, une infection urinaire est possible.
- Les infections urinaires sont souvent discrètes pendant la grossesse : c'est pourquoi une bandelette urinaire est faite chaque mois à partir du 4e mois.

## Comprendre
La vessie se trouve juste devant l'utérus. À mesure que le bébé grandit, l'utérus prend de la place et appuie sur elle, ce qui réduit la quantité d'urine qu'elle peut contenir confortablement. Santé.fr mentionne des envies d'uriner fréquentes vers le 5e mois, puis de nouveau au 8e mois, et les cite parmi les désagréments de fin de grossesse.

Envie fréquente ne veut pas toujours dire simple pression. L'Assurance Maladie explique que la pression du bébé sur la vessie et le ralentissement de l'écoulement des urines favorisent les **infections urinaires** pendant la grossesse. Leurs signes sont les douleurs du bas du ventre, l'envie fréquente d'uriner et les brûlures en urinant, mais ils sont souvent absents ou peu marqués. Or le principal risque d'une infection non traitée est l'infection des reins (pyélonéphrite), qui peut entraîner un accouchement prématuré. D'où le dépistage systématique : une bandelette urinaire chaque mois à partir du 4e mois, et un examen des urines au laboratoire (ECBU) si elle est positive ou si des symptômes apparaissent.

## Au quotidien
**Boire suffisamment**
- Bois régulièrement tout au long de la journée ; Santé.fr rappelle de boire de l'eau pour éviter les infections urinaires.
- Si les levers nocturnes t’épuisent, bois davantage le matin et l'après-midi, un peu moins juste avant le coucher, sans diminuer le total de la journée.

**Aux toilettes**
- Va uriner dès que l'envie se présente, sans te retenir longtemps.
- Prends ton temps pour vider complètement la vessie.
- Essuie-toi de l'avant vers l'arrière.
- Urine après les rapports sexuels.

**La nuit**
- Laisse une veilleuse sur le trajet des toilettes et dégage le passage pour éviter les chutes.
- Lève-toi lentement : assieds-toi d'abord au bord du lit quelques instants.

**Au quotidien**
- Repère les toilettes lors de tes sorties et trajets ; n'hésite pas à demander l'accès en expliquant que tu es enceinte.
- Si tu as de petites fuites en toussant ou en riant, parles-en à ta sage-femme : des exercices du périnée peuvent aider.

## Questions fréquentes
**Je me lève trois fois par nuit, est-ce que cela va durer ?**
Les envies sont souvent plus marquées en fin de grossesse, quand le bébé descend dans le bassin. Elles diminuent en général après l'accouchement. Si tu as aussi des brûlures ou des douleurs, consulte.

**J'ai une envie pressante mais j'urine peu : que faire ?**
Cela peut venir de la pression sur la vessie, mais c'est aussi un signe possible d'infection, surtout avec des brûlures. Pendant la grossesse, fais vérifier tes urines rapidement.

**La bandelette mensuelle suffit-elle ?**
Elle permet de dépister une infection sans symptôme. Si des symptômes apparaissent entre deux consultations, n'attends pas le prochain rendez-vous.

## Quand demander conseil
Consulte rapidement ton médecin ou ta sage-femme en cas de brûlures en urinant, de douleurs du bas du ventre, d'urines troubles ou de sang dans les urines. Consulte en urgence, ou rendez-vous à la maternité, en cas de fièvre, de frissons, de douleur dans le bas du dos sur le côté, de vomissements ou de contractions. En cas de malaise ou de douleur intense, appelle le **15** ou le **112**.

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
- Saignement, écoulement de liquide, contractions rapprochées, maux de tête avec troubles visuels ou gonflement brutal : consulte **en urgence**.
- Chaque désagrément peut être signalé lors de la consultation du 8e mois : c'est aussi fait pour ça.

## Comprendre
Santé.fr liste les désagréments fréquents de la fin de grossesse : brûlures d'estomac ou remontées acides après les repas, constipation qui s'accentue, jambes lourdes voire varices, douleurs dorsales, fourmillements ou engourdissement des doigts, insomnies (surtout à partir de 36 semaines) et envies d'uriner plus fréquentes. Le calendrier de grossesse de Santé.fr ajoute, au 9e mois, une **pesanteur pelvienne** de plus en plus marquée, des contractions plus fréquentes mais irrégulières et des difficultés à dormir. Le bébé, plus à l'étroit, peut aussi bouger différemment.

Ces inconforts sont pénibles mais attendus. D'autres signes, en revanche, doivent faire consulter sans attendre, car ils peuvent annoncer un accouchement prématuré ou une complication. Santé.fr cite notamment : tout saignement, des contractions fréquentes ou rapprochées, un écoulement permanent de liquide, et les signes d'hypertension (maux de tête, gonflement des mains, du visage ou des pieds, bourdonnements d'oreilles, « petites mouches » devant les yeux).

## Au quotidien
**Pour la digestion**
- Fractionne les repas en plus petites portions, mange lentement.
- Évite de t’allonger juste après manger ; surélève la tête du lit si les remontées te gênent la nuit.
- Contre la constipation : boissons régulières, fruits, légumes, céréales complètes, et un peu de marche chaque jour.

**Pour les jambes et le dos**
- Surélève tes jambes dans la journée quand tu es assise ou allongée.
- Évite de rester longtemps debout sans bouger.
- Pour te lever du lit, tourne-toi d'abord sur le côté, puis pousse sur tes bras.

**Pour les mains**
Si tes doigts fourmillent la nuit, secouer la main ou la laisser pendre hors du lit soulage souvent ; signale-le à ta sage-femme (voir notre article sur le canal carpien).

**Pour les nuits**
- Dors sur le côté, avec des coussins entre les genoux ou sous le ventre.
- Garde un rituel calme le soir et une chambre fraîche.

**Pour le moral**
Fatigue, impatience, inquiétude à l'approche de l'accouchement : parles-en à ton entourage, à la sage-femme, lors des séances de préparation à la naissance.

## Questions fréquentes
**Je sens moins mon bébé bouger, est-ce lié au manque de place ?**
Le bébé a moins d'espace en fin de grossesse et ses mouvements peuvent changer. Mais si tu sens qu'il bouge **moins que d'habitude**, contacte la maternité sans attendre : seule une vérification permet de te rassurer.

**Combien de contractions par jour, c'est trop ?**
Les repères varient selon les pages de Santé.fr : l'une indique que les contractions habituelles restent peu douloureuses et peu fréquentes (moins de 10 par jour), le calendrier de grossesse conseille de contacter le médecin qui te suit au-delà de 5 par jour à partir du 7e mois. Dans tous les cas, des contractions régulières, rapprochées ou douloureuses doivent faire appeler la maternité, et en cas de doute, appelle.

**La pesanteur dans le bas du ventre est-elle un signe d'accouchement ?**
Elle s'accentue souvent au 9e mois quand le bébé descend. Si elle s'accompagne de contractions régulières, de saignement ou d'écoulement, rendez-vous à la maternité.

## Quand demander conseil
Rendez-vous **à la maternité** ou appelle le **15** (ou le **112**) en cas de saignement, d'écoulement de liquide, de contractions régulières ou rapprochées avant terme, de fièvre, de bébé qui bouge moins, de maux de tête intenses avec troubles visuels ou de gonflement brutal du visage et des mains. Pour les autres désagréments, parles-en à ta sage-femme ou à ton médecin. Si ton moral est au plus bas, appelle le **3114**.

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
- Faiblesse de la jambe, perte de sensibilité du périnée, troubles pour uriner : **consulte en urgence**.

## Comprendre
Le nerf sciatique est le plus gros et le plus long nerf du corps. Il part du bas du dos, passe dans la fesse et descend à l'arrière de la cuisse jusqu'au pied. Quand l'une de ses racines est irritée, la douleur suit ce trajet : derrière la cuisse, sur le côté ou l'arrière de la jambe, parfois jusqu'au pied. Elle s'accompagne parfois de fourmillements, d'un engourdissement ou d'une faiblesse.

L'Assurance Maladie indique que les modifications de la posture liées à la grossesse entraînent souvent des lombosciatiques et que, en général, tout rentre dans l'ordre après l'accouchement. La douleur est souvent déclenchée par un effort, s'accentue en position assise, en toussant ou en éternuant, et se calme plutôt en position allongée. Contrairement à une phlébite, la jambe n'est ni gonflée ni colorée.

Rarement, la sciatique prend une forme qui demande une prise en charge rapide : douleur extrême non calmée, perte de force dans la jambe, ou atteinte des nerfs du bassin (troubles de la sensibilité du périnée, difficultés pour uriner ou retenir les selles).

## Au quotidien
**Bouger malgré tout**
- Le repos au lit prolongé est déconseillé. Si la douleur est supportable, poursuis tes activités en les adaptant, sans forcer.
- La marche, à ton rythme, est souvent bien tolérée.
- Évite les mouvements et positions qui déclenchent la douleur, et les ports de charges.

**Les positions qui soulagent**
- Sur le côté (la position conseillée en fin de grossesse) : glisse un coussin ferme entre tes genoux, éventuellement un autre sous le ventre.
- Assise : change de position souvent, lève-toi régulièrement, garde les pieds à plat.

**La chaleur**
- Une bouillotte, un coussin chauffant ou une douche chaude peuvent détendre les muscles contractés.
- Attention aux brûlures, surtout si tu sens moins bien la zone.

**Les médicaments**
L'Assurance Maladie indique que le paracétamol peut être pris pendant la grossesse, sous réserve de l'absence de contre-indications, et que les anti-inflammatoires font partie des médicaments contre-indiqués pendant la grossesse (en automédication, et totalement à partir du 6e mois, même en gel ou en crème). Demande conseil à ton pharmacien, ta sage-femme ou ton médecin.

**Se faire accompagner**
Parles-en à ta sage-femme ou à ton médecin : ils peuvent t’orienter vers un kinésithérapeute ou d'autres professionnels qui adapteront exercices et postures à ta grossesse.

## Questions fréquentes
**La sciatique peut-elle gêner l'accouchement ?**
Parles-en à l'équipe qui te suit, qui pourra adapter les positions pendant le travail. La plupart des sciatiques de grossesse s'améliorent après la naissance.

**Est-ce une sciatique ou une douleur du bassin ?**
Seul un examen permet de le dire. Une douleur qui descend derrière la cuisse et sous le genou évoque plutôt une sciatique ; une douleur au niveau du pubis ou des articulations du bassin a d'autres causes. Décris précisément où tu as mal.

**Puis-je mettre une ceinture de grossesse ?**
Demande l'avis de ta sage-femme ou du kinésithérapeute, qui te diront si elle peut t’aider et comment la porter.

## Quand demander conseil
Consulte ton médecin si la douleur ne s'améliore pas après quelques jours, si elle augmente, surtout la nuit, ou si un engourdissement ou une faiblesse progressive de la jambe apparaît. Consulte **en urgence** en cas de douleur extrême non calmée, de paralysie ou perte de force de la jambe, de perte de sensibilité du périnée, de difficultés pour uriner, de fuites urinaires ou de perte de contrôle des selles, ou si la douleur s'accompagne de fièvre ou de brûlures urinaires. En cas de mollet gonflé et douloureux ou d'essoufflement brutal, appelle le **15** ou le **112**.

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
- Si les symptômes persistent ou s'aggravent, ou si tu perds de la force, consulte rapidement.

## Comprendre
Au poignet, le nerf médian passe dans un tunnel étroit, le canal carpien, avec les tendons des doigts. Lorsqu'il est comprimé, il envoie des signaux anormaux : picotements et fourmillements sur la face palmaire des trois premiers doigts, engourdissement, lourdeur de la main, sensations de décharge électrique. Ces troubles peuvent remonter vers l'avant-bras et toucher les deux mains, pas forcément en même temps.

L'Assurance Maladie cite la grossesse parmi les facteurs hormonaux qui favorisent ce syndrome. Elle précise qu'il régresse après l'accouchement, mais qu'il peut réapparaître lors des grossesses suivantes.

Les symptômes surviennent surtout la nuit, ou en journée lors de certains gestes ou du maintien prolongé d'une position (tenir un téléphone, conduire, taper au clavier). Sans prise en charge, une compression qui dure peut entraîner des douleurs, une perte de sensibilité puis une baisse de force du pouce, avec des objets qui tombent des mains. C'est pourquoi l'Assurance Maladie insiste sur l'importance de consulter rapidement si les symptômes persistent ou s'aggravent.

## Au quotidien
**La nuit**
- Évite de dormir les poignets pliés, sous l'oreiller ou sous la joue.
- Quand les fourmillements te réveillent, secoue la main ou laisse-la pendre hors du lit.
- Une **attelle de repos nocturne**, qui maintient le poignet en position neutre, est l'un des traitements proposés ; elle se discute avec ton médecin ou ta sage-femme.

**Dans la journée**
- Fais des pauses régulières lors des gestes répétitifs (clavier, souris, couture, épluchage).
- Change souvent de prise et évite de garder le poignet plié ou en torsion longtemps.
- Évite les efforts de force répétés et les vibrations (certains outils de bricolage ou de jardinage).
- Au travail, parle de l'aménagement de ton poste avec la médecine du travail si besoin.

**Ménager ses mains**
- Utilise des objets plus légers et plus faciles à saisir.
- Fais-toi aider pour les tâches qui sollicitent beaucoup les poignets.

## Questions fréquentes
**Pourquoi les deux mains sont-elles touchées ?**
L'atteinte est souvent bilatérale, mais pas forcément symétrique ni simultanée. Signale-le, même si une main est plus gênée que l'autre.

**Faut-il faire un examen ?**
Le médecin examine la sensibilité, la force et la mobilité de tes doigts ; cet examen suffit souvent. Un électroneuromyogramme peut être prescrit s'il le juge utile.

**Les symptômes vont-ils disparaître après la naissance ?**
L'Assurance Maladie indique que les symptômes régressent spontanément dans environ un tiers des cas, notamment après une grossesse, et que le syndrome régresse après l'accouchement. Si la gêne persiste après la naissance, consulte : d'autres traitements existent.

**Porter mon bébé va-t-il aggraver les choses ?**
Les gestes répétés de portage, de change ou de biberon sollicitent les poignets. Alterne les mains, garde le poignet droit quand c'est possible et parles-en au médecin si la gêne revient.

## Quand demander conseil
Parles-en à ta sage-femme ou à ton médecin dès que les fourmillements reviennent régulièrement ou te réveillent. Consulte rapidement si les symptômes persistent, s'aggravent, si tu perds de la sensibilité ou de la force dans les doigts. Consulte **en urgence**, ou appelle le **15** ou le **112**, en cas d'engourdissement soudain d'un côté du corps, de faiblesse brutale d'un bras ou de troubles de la parole.

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
- Essoufflement brutal, douleur dans la poitrine, lèvres bleutées ou mollet gonflé et douloureux : appelle le **15** ou le **112**.

## Comprendre
Pendant la grossesse, le corps s'adapte pour apporter oxygène et nutriments au bébé : le volume de sang augmente et le cœur bat plus vite. Santé.fr mentionne ainsi un essoufflement dès le 2e mois. Plus tard, quand le ventre prend de la place, le calendrier de grossesse de Santé.fr cite de nouveau l'essoufflement, au 6e mois.

Monter des escaliers, porter des courses ou marcher vite peut donc te laisser plus à bout de souffle qu'avant. Cela ne doit pas empêcher de bouger, au contraire, mais invite à adapter l'intensité.

Certaines situations sortent de ce cadre. L'Assurance Maladie demande d'arrêter toute activité et de consulter en cas d'essoufflement anormal à l'effort, surtout s'il ne cesse pas au repos. Un manque de fer (anémie), plus fréquent pendant la grossesse, peut aussi donner un essoufflement à l'effort, avec fatigue et pâleur. Enfin, un essoufflement **brutal** peut révéler une urgence : crise d'asthme, infection pulmonaire, réaction allergique, ou embolie pulmonaire, parfois annoncée par une douleur d'un mollet (phlébite).

## Au quotidien
**Adapter ses efforts**
- Prends les escaliers à ton rythme, fais une pause sur le palier.
- Fractionne les courses et les tâches ménagères, fais-toi livrer ou aider.
- Pendant une activité physique, garde une intensité qui te permet de parler.

**Respirer plus confortablement**
- Tiens-toi droite, épaules relâchées.
- Pratique une respiration lente, en soufflant longuement par la bouche.
- La nuit, un oreiller supplémentaire ou la position sur le côté peuvent aider.

**Préserver son souffle**
- Évite le tabac et les lieux enfumés.
- Aère ton logement chaque jour.
- Si tu es asthmatique, poursuis ton traitement et parles-en avec ton médecin dès le début de la grossesse.

## Questions fréquentes
**Mon essoufflement peut-il manquer d'oxygène au bébé ?**
Un essoufflement léger lié aux adaptations de la grossesse fait partie des changements décrits par les sources officielles. Un essoufflement inhabituel, au repos ou qui s'aggrave doit, lui, être examiné rapidement.

**Comment savoir si c'est une anémie ?**
Seule une prise de sang permet de le dire. Une fatigue importante, une pâleur, des vertiges ou un essoufflement à l'effort sont des raisons d'en parler à ta sage-femme ou à ton médecin.

**Puis-je continuer le sport ?**
Oui, en général, en l'adaptant. L'Assurance Maladie demande d'arrêter et de consulter en cas d'essoufflement anormal, de douleur dans la poitrine, de vertiges ou de malaise.

## Quand demander conseil
Consulte ton médecin ou ta sage-femme si tu es plus essoufflée qu'avant sans raison évidente, si l'essoufflement survient pour de petits efforts ou s'accompagne de fatigue, de palpitations ou de toux. Consulte dans la journée en cas d'essoufflement avec fièvre. Appelle le **15** ou le **112** en cas d'essoufflement brutal, de respiration très rapide, de difficulté à parler, de lèvres ou d'extrémités bleutées, de douleur dans la poitrine, de mollet gonflé et douloureux, ou de gonflement du visage.

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
- Palpitations avec malaise, douleur dans la poitrine, difficulté à respirer ou vertiges : appelle le **15** ou le **112**.

## Comprendre
On parle de palpitations quand on perçoit ses battements de cœur de façon inhabituelle : cœur qui bat fort, vite, de manière irrégulière, ou sensation de « raté ». Santé.fr indique que, dès le 2e mois de grossesse, le volume sanguin et le rythme cardiaque augmentent. Il est donc fréquent de sentir son cœur davantage, surtout à l'effort.

L'Assurance Maladie cite plusieurs circonstances qui peuvent déclencher des palpitations : la caféine (café, thé, boissons énergisantes), le tabac, le stress et les crises d'angoisse, le manque de sommeil, le manque d'exercice, ou certains médicaments. Une anémie peut aussi donner une fatigue, un essoufflement et des vertiges, et elle est plus fréquente pendant la grossesse : c'est une piste que ton médecin peut vérifier par une prise de sang.

Certaines palpitations doivent être explorées par un médecin, et quelques situations relèvent de l'urgence.

## Au quotidien
**Observer**
- Note le moment où elles commencent et s'arrêtent, leur durée, leur régularité, ce que tu faisais et les autres sensations (essoufflement, vertige, douleur).
- Si tu as un tensiomètre, note ta fréquence cardiaque pendant l'épisode.

**Réduire ce qui les favorise**
- Limite le café, le thé, les sodas caféinés et évite les boissons énergisantes.
- Pendant la grossesse, l'arrêt du tabac est bénéfique à tout moment : demande de l'aide à ta sage-femme ou à ton médecin.
- Prends soin de ton sommeil autant que possible.
- Bouge régulièrement à ton rythme ; la marche est souvent une bonne option.
- Essaie des techniques de relaxation ou de respiration lente quand tu sens le stress monter.

**Avec les médicaments**
Si tu prends un traitement, lis la notice et parle à ton médecin ou à ton pharmacien des palpitations. N'arrête jamais un traitement sans avis médical.

## Questions fréquentes
**Mon cœur bat vite quand je monte les escaliers : est-ce lié à la grossesse ?**
Le cœur travaille davantage pendant la grossesse, et un rythme plus rapide à l'effort fait partie des adaptations décrites. Si cela survient au repos, de façon prolongée, ou avec d'autres signes, consulte.

**Quand faut-il consulter son médecin ?**
L'Assurance Maladie conseille de consulter si les palpitations t’inquiètent, si elles reviennent souvent, durent, s'aggravent ou changent, si ton cœur bat à plus de 100 battements par minute hors effort, fièvre ou angoisse, ou si tu as des antécédents cardiaques ou une maladie chronique.

**Est-ce que l'angoisse peut donner des palpitations ?**
Oui, le stress et les crises d'angoisse font partie des causes citées. Si l'anxiété est très présente pendant ta grossesse, parles-en : un soutien existe.

## Quand demander conseil
Parles-en à ton médecin ou à ta sage-femme si les palpitations sont fréquentes, durent, s'aggravent ou apparaissent au repos. Appelle le **15** ou le **112** si elles s'accompagnent d'un malaise (avec ou sans perte de connaissance), d'une douleur dans la poitrine, de difficultés à respirer, de sueurs abondantes, de vertiges, de maux de tête intenses, ou d'une perte de force ou d'un engourdissement d'un côté du corps ou du visage. Si l'angoisse te submerge, appelle le **3114**.

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
- Si tu te sens partir : **allonge-toi** ou assieds-toi immédiatement, desserre tes vêtements.
- Malaise avec perte de connaissance, douleur dans la poitrine, maux de tête inhabituels, troubles de la vue ou saignement : appelle le **15** ou le **112**.

## Comprendre
Pendant la grossesse, rester longtemps debout sans bouger peut faire baisser la tension : l'Assurance Maladie présente la station debout prolongée comme une source d'hypotension et de malaise. La position allongée sur le dos compte aussi : l'Assurance Maladie déconseille les exercices sur le dos à partir de 24 semaines, et Santé.fr recommande de dormir plutôt sur le côté gauche pour éviter les malaises vagaux.

Le malaise vagal est une perte de connaissance brève, souvent annoncée par des sueurs, des nausées, des étourdissements, une faiblesse dans les jambes ou un voile devant les yeux. Une atmosphère chaude et confinée, une émotion forte, une douleur vive ou une station debout prolongée le favorisent.

Santé.fr mentionne aussi, vers le 4e mois, un risque de **malaises hypoglycémiques**, liés à une baisse du sucre dans le sang, par exemple après une longue période sans manger. Enfin, une anémie peut donner une sensation de tête qui tourne : ton médecin peut la rechercher par une prise de sang.

## Au quotidien
**Prévenir**
- Lève-toi en deux temps : assieds-toi d'abord quelques instants au bord du lit ou du canapé.
- Évite de rester longtemps debout immobile ; si c'est inévitable (file d'attente, transport), bouge les jambes, contracte les mollets, ou assieds-toi dès que possible.
- Ne saute pas de repas, prévois une collation (fruit, yaourt, pain, poignée d'oléagineux) dans ton sac.
- Bois régulièrement, surtout quand il fait chaud.
- Évite les lieux surchauffés et confinés.
- Pour dormir ou te reposer, préfère la position sur le côté, de préférence le gauche.

**Si tu te sens partir**
- Allonge-toi par terre ou assieds-toi immédiatement, pour éviter de chuter.
- Desserre ce qui serre (ceinture, soutien-gorge).
- Respire lentement, demande de l'aide autour de toi.
- Ne te relève que lorsque tu te sens bien, et doucement.

**Pour l'entourage**
Si une femme enceinte perd connaissance : allonge-la, de préférence sur le côté gauche, surveille sa respiration, et appelle le **15** si elle ne reprend pas conscience en quelques minutes, si sa respiration ou son pouls sont anormaux, ou s'il y a d'autres signes inquiétants. Si elle est inconsciente et respire, mets-la en position latérale de sécurité.

## Questions fréquentes
**Les vertiges sont-ils dangereux pour le bébé ?**
Le principal risque immédiat est la chute. Mais des malaises répétés doivent être signalés à ta sage-femme ou à ton médecin, qui recherchera une cause (tension, anémie, sucre dans le sang).

**J'ai la tête qui tourne quand je me lève le matin, que faire ?**
Lève-toi lentement, assieds-toi d'abord au bord du lit, et prends rapidement un petit-déjeuner. Si cela se répète, parles-en lors de ta consultation.

**Faut-il consulter après un malaise ?**
Oui. Pendant la grossesse, signale tout malaise à ta sage-femme ou à ton médecin. Après une perte de connaissance brève sans signe de gravité, l'Assurance Maladie indique que le médecin régulateur conseille de consulter le médecin traitant ou le médecin de garde.

## Quand demander conseil
Consulte ton médecin ou ta sage-femme après un malaise, ou si les vertiges se répètent. Arrête toute activité et consulte en cas de vertiges, de troubles de l'équilibre, de malaise ou de maux de tête inhabituels. Appelle le **15** ou le **112** en cas de perte de connaissance qui dure plus de quelques minutes, de douleur dans la poitrine, de difficulté à respirer, de vision double ou de perte de vision, de troubles de la parole, de chute avec choc au ventre, de saignement ou de contractions.

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
- Des démangeaisons **intenses, généralisées**, surtout en fin de grossesse, peuvent révéler une **cholestase de la grossesse** : demande conseil à ta sage-femme ou à ton médecin rapidement.
- Démangeaisons intimes avec pertes : consulte dans la journée, sans automédication.

## Comprendre
Les démangeaisons (prurit) sont une sensation désagréable qui donne envie de se gratter. L'Assurance Maladie cite la grossesse parmi leurs causes, et précise que les démangeaisons liées à la grossesse disparaissent en général après l'accouchement. Plusieurs situations sont possibles.

**La peau sèche et tendue.** Le ventre qui s'étire, la chaleur, les douches chaudes, certains savons ou textiles peuvent irriter la peau et la faire gratter.

**Les papules et plaques prurigineuses de la grossesse.** L'Assurance Maladie décrit une affection cutanée courante en fin de grossesse, avec des rougeurs qui démangent sur les cuisses et l'abdomen.

**La cholestase de la grossesse.** Elle correspond à une rétention de bile dans le foie. Elle survient surtout en fin de grossesse, provoque des démangeaisons, et guérit quelques jours après l'accouchement, parfois plus lentement. Une jaunisse n'est présente que dans environ 10 % des cas : on ne peut donc pas l'écarter parce que la peau n'est pas jaune. L'Assurance Maladie souligne qu'il est important, dans ces situations, de demander conseil à une sage-femme ou à son médecin, qui pourra prescrire une prise de sang.

**Les démangeaisons intimes.** Une mycose vaginale démange aussi : pendant la grossesse, elle doit être vue par un professionnel dans la journée.

## Au quotidien
**Hydrater la peau**
- Applique une crème émolliente simple, sans parfum, sur la peau encore légèrement humide après la douche.
- Préfère une huile de toilette, un pain surgras ou un nettoyant doux sans savon.
- Évite les atmosphères trop sèches : aère et pense à l'humidité de la chambre en hiver.

**Douche et vêtements**
- Prends des douches tièdes et courtes plutôt que des bains chauds.
- Sèche-toi en tamponnant, sans frotter.
- Porte des vêtements amples, légers, en coton ; évite la laine et les synthétiques directement sur la peau.

**Limiter le grattage**
- Garde les ongles courts et limés.
- Tapote ou applique un linge frais sur la zone qui démange plutôt que de gratter.
- Évite les nouveaux cosmétiques, parfums et lessives pendant cette période.

**Avant un produit**
Demande conseil à ton pharmacien ou à ta sage-femme avant d'appliquer une crème médicamenteuse : certains produits ne conviennent pas pendant la grossesse, et les huiles essentielles sont déconseillées.

## Questions fréquentes
**Comment reconnaître une cholestase ?**
Seule une prise de sang permet de la confirmer. Les démangeaisons en fin de grossesse, surtout si elles sont intenses, généralisées ou gênent le sommeil, justifient d'en parler rapidement à ta sage-femme ou à ton médecin.

**Mes démangeaisons sont surtout sur le ventre : est-ce lié aux vergetures ?**
La peau qui s'étire peut gratter. Une crème hydratante aide souvent. Si des plaques rouges apparaissent ou si les démangeaisons s'étendent, consulte.

**Les démangeaisons vont-elles disparaître après l'accouchement ?**
Selon l'Assurance Maladie, les démangeaisons liées à la grossesse disparaissent généralement après l'accouchement ; pour la cholestase, quelques jours après, parfois plus longtemps.

## Quand demander conseil
Demande conseil rapidement à ta sage-femme ou à ton médecin en cas de démangeaisons intenses, généralisées, qui gênent ton sommeil, ou si la peau ou le blanc des yeux jaunit. Consulte aussi en cas de lésions de grattage, de plaques, de fièvre ou de grande fatigue. Contacte la maternité sans attendre si tu sens ton bébé bouger moins. En cas de gonflement du visage ou de difficulté à respirer, appelle le **15** ou le **112**.

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
- Le diagnostic se fait par prise de sang ; un éventuel traitement est décidé par le professionnel qui te suit.

## Comprendre
L'anémie correspond à un taux d'hémoglobine trop bas dans le sang. L'hémoglobine, contenue dans les globules rouges, transporte l'oxygène vers les organes ; pour la fabriquer, le corps a besoin de fer. Quand le fer manque, sa production diminue : c'est l'anémie par carence en fer.

Pendant la grossesse, l'Assurance Maladie explique que les besoins en fer augmentent fortement. Elle fixe le seuil d'anémie chez la femme enceinte à 105 g/l d'hémoglobine à partir du deuxième trimestre. Les femmes enceintes font partie des populations à risque, en particulier en fin de grossesse, en cas de grossesse multiple, ou si l'alimentation apporte peu de fer (régime végétarien ou végétalien strict, par exemple).

La fatigue est fréquente pendant la grossesse : Santé.fr la cite dès le 2e mois. Elle ne veut pas dire anémie. Mais une fatigue qui s'installe, avec une pâleur, un essoufflement à l'effort, des maux de tête, une sensation de tête qui tourne ou une faiblesse en se levant d'une chaise, doit faire penser à vérifier. La peau et les cheveux secs ou des ongles cassants peuvent aussi traduire un manque de fer. L'anémie s'installe souvent progressivement et peut être découverte lors d'une prise de sang de suivi.

## Au quotidien
**Dans l'assiette**
- Varie les sources de fer : viande, poisson, œufs bien cuits, légumes secs (lentilles, pois chiches, haricots).
- Associe-les à des fruits ou légumes riches en vitamine C au même repas, qui favorisent l'absorption du fer d'origine végétale.
- Si tu ne manges pas de viande ou de poisson, parles-en à ta sage-femme ou à ton médecin pour bien composer tes repas.

**Économiser son énergie**
- Accorde-toi des pauses dans la journée et couche-toi plus tôt quand c'est possible.
- Délègue ce qui peut l'être : courses, ménage, trajets.
- Garde une activité physique douce, adaptée à ta forme : elle aide souvent à mieux supporter la fatigue.

**Avec les professionnels**
- Signale ta fatigue lors des consultations mensuelles : c'est une information utile.
- Si une prise de sang est prescrite, demande qu'on t’explique les résultats (hémoglobine, et parfois ferritine, qui reflète les réserves en fer).
- Ne prends pas de complément en fer ou de complément alimentaire de ton propre initiative : c'est le professionnel qui te suit qui décide d'un traitement et de sa durée.

## Questions fréquentes
**Je suis fatiguée tout le temps, ai-je forcément une anémie ?**
Non, la fatigue a de nombreuses causes pendant la grossesse : changements hormonaux, sommeil perturbé, charge du quotidien. Mais en parler permet de vérifier, par une simple prise de sang, qu'il n'y a pas de manque de fer.

**Comment savoir si mes résultats sont bons ?**
Le seuil indiqué par l'Assurance Maladie pour la femme enceinte est de 105 g/l d'hémoglobine à partir du deuxième trimestre. Ta sage-femme ou ton médecin interprète tes résultats en tenant compte de ta situation.

**Le fer se trouve-t-il seulement dans la viande rouge ?**
Non : le poisson, les œufs et les légumes secs en apportent aussi. Le fer d'origine animale est mieux absorbé ; l'ajout de vitamine C aide pour les sources végétales.

## Quand demander conseil
Parles-en à ton médecin ou à ta sage-femme si tu es très fatiguée, pâle, essoufflée pour de petits efforts, si tu as des vertiges ou des palpitations. Consulte rapidement en cas de saignements, même modérés. Appelle le **15** ou le **112** en cas de malaise avec perte de connaissance, de douleur dans la poitrine ou de difficulté à respirer. Si la fatigue s'accompagne d'une tristesse persistante ou d'un sentiment d'épuisement, parles-en, et en cas de détresse, appelle le **3114**.

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
- **Médicaments « habituels »** : un traitement pour une maladie chronique ne doit être ni arrêté ni modifié seule ; parles-en à ton médecin dès que tu sais que tu es enceinte.

Sur les boîtes, deux pictogrammes t’aident : « Médicament + grossesse = danger » (à n'utiliser qu'en l'absence d'alternative, sur avis médical) et « Médicament + grossesse = interdit ».

## Au quotidien
**Faire le tri dans l'armoire à pharmacie**
- Mets de côté les anti-inflammatoires (comprimés, gels, crèmes), les décongestionnants, les huiles essentielles et les compléments non prescrits.
- Garde les produits simples, comme le sérum physiologique pour le nez et un thermomètre.
- Vérifie les associations : beaucoup de médicaments « contre le rhume » ou « contre la douleur » contiennent plusieurs substances.

**Bien se faire conseiller**
- Dis d'emblée au pharmacien que tu es enceinte, et à combien de semaines.
- Signale ta grossesse à tout professionnel : médecin, dentiste, kinésithérapeute.
- Lis la notice et cherche les pictogrammes grossesse.
- Note dans ton carnet ou ton téléphone ce que tu prends, pour en parler à la consultation.

**Les gestes qui soulagent sans médicament**
Lavage de nez, repos, hydratation, chaleur pour le dos, position sur le côté pour dormir, repas fractionnés : ces mesures simples sont détaillées dans nos articles sur chaque petit mal.

## Questions fréquentes
**Le paracétamol est-il possible ?**
L'Assurance Maladie indique que le paracétamol peut être utilisé pendant la grossesse, dans le respect des règles d'usage de la notice. Demande conseil si tu en as besoin plusieurs jours de suite.

**Les produits « naturels » sont-ils plus sûrs ?**
Pas forcément. Plantes, huiles essentielles et compléments contiennent des substances actives. L'Assurance Maladie recommande de demander conseil avant tout produit à base de plantes.

**J'ai pris un anti-inflammatoire sans savoir que j'étais enceinte : que faire ?**
Ne reste pas seule avec l'inquiétude : parles-en à ton médecin ou à ta sage-femme, qui évaluera la situation selon le moment de la grossesse et le produit pris.

## Quand demander conseil
Appelle ton pharmacien, ta sage-femme ou ton médecin avant de prendre un médicament ou un produit dont tu n'as pas encore parlé avec eux pendant cette grossesse. En cas de prise accidentelle d'un produit en quantité importante, de malaise ou de réaction après un médicament (gonflement du visage, difficulté à respirer, éruption), appelle le **15** ou le **112** ; le centre antipoison peut aussi être contacté.

${FIN}`,
  },
];
