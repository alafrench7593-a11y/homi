/** Guide complet — lot 11 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  activites: { label: 'Santé.fr (1000 premiers jours, Santé publique France) — Les activités avec bébé', url: 'https://www.sante.fr/les-activites-avec-bebe', consulted_on: C, published: '2025-06-03' },
  etapes: { label: 'Santé.fr (1000 premiers jours, Santé publique France) — Les étapes du développement de bébé', url: 'https://www.sante.fr/les-etapes-du-developpement-de-bebe', consulted_on: C, published: '2025-06-17' },
  bouger5ans: { label: 'Santé.fr (Manger Bouger, Santé publique France) — Les recommandations d’activité physique pour les enfants jusqu’à 5 ans', url: 'https://www.sante.fr/node/800511', consulted_on: C, published: '2023-10-10' },
  jeux01: { label: 'mpedia.fr (AFPA) — Les jeux de 0 à 1 an', url: 'https://www.mpedia.fr/art-jeux-de-0-a-1-an/', consulted_on: C, published: '2021-01-05' },
  dev03: { label: 'mpedia.fr (AFPA) — Le développement psychomoteur de 0 à 3 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-0-3-mois/', consulted_on: C, published: '2023-09-05' },
  dev36: { label: 'mpedia.fr (AFPA) — Le développement psychomoteur de 3 à 6 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-3-6-mois/', consulted_on: C, published: '2021-01-05' },
  dev69: { label: 'mpedia.fr (AFPA) — Le développement psychomoteur de 6 à 9 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-6-9-mois/', consulted_on: C, published: '2021-01-05' },
  dev912: { label: 'Santé.fr (contenu mpedia) — Le développement psychomoteur des enfants de 9 à 12 mois', url: 'https://www.sante.fr/le-developpement-psychomoteur-des-enfants-de-9-12-mois', consulted_on: C, published: '2025-05-27' },
  langage: { label: 'Santé.fr (contenu mpedia) — Les progrès du langage de 2 à 12 mois', url: 'https://www.sante.fr/progres-du-langage-de-2-12-mois', consulted_on: C, published: '2025-05-22' },
  marche: { label: 'mpedia.fr (AFPA) — L’apprentissage de la marche', url: 'https://www.mpedia.fr/art-apprentissage-marche/', consulted_on: C, published: '2021-01-05' },
  trotteurMpedia: { label: 'Santé.fr (contenu mpedia) — Trotteurs bébé : une mauvaise idée pour apprendre à marcher', url: 'https://www.sante.fr/node/1093858', consulted_on: C, published: '2025-04-16' },
  trotteurDecryptage: { label: 'Santé.fr Décryptage — Est-il vrai que les trotteurs pour bébés sont déconseillés ?', url: 'https://www.sante.fr/node/7042505', consulted_on: C, published: '2023-07-05' },
  hasDcp: { label: 'HAS — Fiche mémo : Prévention des déformations crâniennes positionnelles et mort inattendue du nourrisson', url: 'https://afpa.org/content/uploads/2020/03/HAS_Prevention-DCP_2020-02.pdf', consulted_on: C, published: '2020-02' },
  ecrans: { label: 'ameli.fr — Usage des écrans selon l’âge de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/ecrans-enfance-adolescence/usage-ecran-age', consulted_on: C, published: '2025-07-17' },
  bain: { label: 'ameli.fr — Donner le bain à bébé', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/donner-bain-bebe', consulted_on: C },
  noyade: { label: 'ameli.fr — Chaleur et baignade : prévenir les noyades', url: 'https://www.ameli.fr/assure/sante/themes/canicule-chaleur/chaleur-noyade', consulted_on: C, published: '2026-06-01' },
  soleil: { label: 'mpedia.fr (AFPA) — Soleil : quelles protections pour les enfants ?', url: 'https://www.mpedia.fr/art-soleil-quelles-protections/', consulted_on: C, published: '2023-07-06' },
  froid: { label: 'Santé.fr (RecoSanté) — Quels réflexes prendre pour protéger son enfant du grand froid ?', url: 'https://sante.fr/quels-reflexes-prendre-pour-proteger-son-enfant-du-grand-froid', consulted_on: C, published: '2025-07-23' },
  jouets: { label: 'Santé.fr (DGCCRF) — Sécurité des jouets : optez pour un produit adapté à l’âge de l’enfant', url: 'https://www.sante.fr/node/1268419', consulted_on: C, published: '2019-06-11' },
  jouetsEco: { label: 'economie.gouv.fr — Les conseils de sécurité pour choisir les jouets de vos enfants', url: 'https://www.economie.gouv.fr/particuliers/choix-conseil-achat-jouet-securite-enfant', consulted_on: C },
  portage: { label: 'mpedia.fr (AFPA) — Le portage en écharpe', url: 'https://www.mpedia.fr/art-echarpe-portage/', consulted_on: C, published: '2021-11-05' },
  carnet: { label: 'Ministère des Solidarités — Les 1000 premiers jours : carnet de bienvenue dans la parentalité', url: 'https://solidarites.gouv.fr/sites/solidarite/files/2023-01/1000-premiers-jours-carnet-de-bienvenue-dans-la-parentalite_0.pdf', consulted_on: C },
  livret: { label: 'Ministère des Solidarités — Le livret de nos 1000 premiers jours', url: 'https://solidarites.gouv.fr/sites/solidarite/files/2023-01/livret-1000-premiers-jours.pdf', consulted_on: C },
  culture: { label: 'solidarites.gouv.fr — La santé des enfants et des parents est aussi culturelle', url: 'https://solidarites.gouv.fr/la-sante-des-enfants-et-des-parents-est-aussi-culturelle-sensibilisation-aux-pratiques-culturelles', consulted_on: C },
  interactions: { label: 'solidarites.gouv.fr — Ces liens qui nous façonnent : l’importance des interactions parent-enfant', url: 'https://solidarites.gouv.fr/ces-liens-qui-nous-faconnent-limportance-des-interactions-parent-enfant', consulted_on: C, published: '2025-09-01' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe et vous donne des idées ; il ne remplace pas l’avis du médecin, de la sage-femme, de la puéricultrice de PMI ou du pédiatre qui suit votre enfant._';
const BASE = { status: 'to_review' as const };

export const GUIDE_B11: LibArticle[] = [
  // ------------------------------------------------------------------ mois par mois
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 1,
    slug: 'eveil-nouveau-ne-premier-mois-activites',
    title: 'Éveil du nouveau-né : que faire avec bébé pendant le premier mois ?',
    summary: 'Regards, voix, contact, promenades : des idées simples pour partager les moments d’éveil de votre nouveau-né sans le fatiguer.',
    tags: ['éveil nouveau-né', 'activités bébé 1 mois', 'jouer avec un nouveau-né', 'stimuler bébé', 'bébé 0 mois', 'massage bébé'],
    sources: [S.dev03, S.activites, S.livret],
    body_md: `## En bref
- Pendant le premier mois, l’éveil passe surtout par **vous** : votre visage, votre voix, votre odeur et vos bras.
- Votre bébé distingue déjà les **contrastes**, est sensible aux sons et reconnaît l’odeur de ses parents quand il est tenu contre eux.
- Les soins du quotidien (change, bain, tétée ou biberon, promenade) sont déjà des **moments d’éveil**.
- Il n’existe **pas de durée idéale** : on suit son rythme, et on s’arrête quand il détourne le regard ou s’agite.

## Comprendre
Selon les pédiatres de mpedia, le nouveau-né commence dès le premier mois à **accrocher et fixer le regard**, surtout sur ce qui est contrasté. Il est sensible aux sons et reconnaît l’odeur de ses parents. Sa motricité est encore surtout faite de **réflexes** (succion, agrippement, « marche automatique ») ; il ne tient pas encore sa tête.

Santé publique France (programme 1000 premiers jours) rappelle que, dès les premières semaines, le bébé a « déjà ses propres activités » : il observe, écoute, découvre ses mains. Vous pouvez interagir avec lui en lui parlant, en le massant ou en le promenant. Le livret des 1000 premiers jours souligne que votre voix, qu’il entendait déjà pendant la grossesse, est rassurante, et que chaque échange compte pour son développement.

Pendant ce premier trimestre, mpedia insiste sur le besoin de **contact** : être porté, bercé, câliné rassure le bébé.

## Au quotidien
- **Le face-à-face** : quand il est calme et éveillé, placez votre visage assez près et regardez-le « les yeux dans les yeux ». Parlez doucement, souriez, laissez-lui le temps de répondre par un regard ou une mimique.
- **Racontez ce que vous faites** : « Je t’enlève ta chaussette… voilà ton pied ! » Le contenu importe peu, c’est la mélodie et l’attention qui comptent.
- **Le toucher** : un massage doux après le bain, des caresses sur le dos ou les pieds, le contact peau contre peau dans vos bras.
- **Les sons doux** : chantonnez, fredonnez une berceuse, proposez une musique calme, à faible volume.
- **Les contrastes** : un mobile ou une image en noir et blanc, posés à bonne distance, peuvent capter son regard quelques instants.
- **La promenade** : en poussette ou dans les bras, l’air, la lumière et les bruits de la rue font partie de ses découvertes (protégez-le du soleil et du froid).
- **Observez ses signaux** : un regard qui se détourne, des bâillements, des pleurs ou une agitation signifient souvent « j’en ai assez ». Proposez alors du calme, des bras ou le sommeil.

## Questions fréquentes
**Faut-il acheter des jouets d’éveil dès la naissance ?**
Non, ce n’est pas indispensable. À cet âge, votre visage et votre voix sont ses meilleurs « jouets ». Si vous en offrez, vérifiez le marquage CE et l’âge indiqué.

**Mon bébé dort presque tout le temps : comment faire de l’éveil ?**
Les temps d’éveil sont courts au début. Profitez des moments où il est calme et attentif, souvent après un repas ou au change. Quelques minutes d’échange suffisent.

**Peut-on lui parler « normalement », avec des vrais mots ?**
Oui. Parlez-lui comme vous en avez envie, avec des mots simples et une voix chaleureuse. Il apprend en écoutant la mélodie de votre langue.

**Est-ce grave s’il pleure pendant un moment de jeu ?**
Les pleurs sont souvent un signal de fatigue ou de trop-plein. Arrêtez l’activité, prenez-le contre vous dans un endroit calme.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne semble jamais fixer votre regard, ne réagit pas aux bruits forts, ou si quelque chose vous inquiète dans son comportement. Apportez le carnet de santé à chaque consultation.

**Appelez le 15 ou le 112** en cas de malaise, de difficulté à respirer, de teint gris ou bleuté, ou si votre bébé est inhabituellement mou ou difficile à réveiller. Si les pleurs deviennent insupportables pour vous, posez-le en sécurité dans son lit, sortez de la pièce et demandez de l’aide : il ne faut **jamais secouer un bébé**. En cas de grande détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 1, max_age_months: 3,
    slug: 'eveil-bebe-2-3-mois-sourires-gazouillis',
    title: 'Éveil de bébé à 2 et 3 mois : sourires, gazouillis et premiers jeux',
    summary: 'Votre bébé sourit, gazouille et suit du regard : des activités concrètes pour accompagner cette période riche en échanges.',
    tags: ['éveil bébé 2 mois', 'éveil bébé 3 mois', 'sourire réponse', 'gazouillis', 'jeux bébé 3 mois', 'noir et blanc bébé'],
    sources: [S.dev03, S.langage, S.hasDcp],
    body_md: `## En bref
- Vers **2 mois**, beaucoup de bébés sourient en réponse à un sourire et émettent leurs premières vocalises (« aaa », « eee »).
- Vers **3 mois**, ils suivent du regard en tournant la tête, regardent leurs mains et modulent leurs gazouillis pour attirer l’attention.
- Les meilleurs jeux sont les **échanges** : imiter ses sons, répondre à ses sourires, chanter.
- Au sol, sur un **tapis ferme**, il peut bouger bras et jambes librement.

## Comprendre
D’après mpedia, vers 2 mois le bébé commence à soulever la tête, agite bras et jambes, suit un objet placé à bonne distance et se montre plus attiré par le **noir et blanc** que par les couleurs vives. Vers 3 mois, les réflexes s’estompent au profit de gestes volontaires, ses mains s’ouvrent plus facilement et il tient sa tête lorsqu’il est assis soutenu. Ces âges sont indicatifs : chaque enfant avance à son rythme.

Côté langage, les pédiatres de mpedia décrivent un bébé qui, vers 2 mois, sourit, produit des sons proches des voyelles et semble imiter la mélodie de votre voix ; vers 3–4 mois, il rit aux éclats et s’intéresse davantage à ce qui l’entoure.

La Haute Autorité de santé (HAS) recommande de laisser le nourrisson **bouger librement** pendant l’éveil, de varier ses postures et d’encourager les mouvements de sa tête par la voix, le toucher et le regard.

## Au quotidien
- **Le jeu du tour de parole** : quand il gazouille, répondez en imitant son son, ajoutez-en un petit nouveau, puis faites une pause pour lui laisser « sa réplique ».
- **Les grimaces partagées** : tirez la langue, ouvrez grand la bouche, souriez lentement. Certains bébés tentent d’imiter.
- **Les suivis du regard** : déplacez lentement un objet contrasté ou votre visage de gauche à droite, à bonne distance.
- **Le temps au sol** : un tapis ferme, des jouets posés **autour** de lui plutôt qu’accrochés au-dessus. Il pourra tourner la tête des deux côtés.
- **Changer de place** : parlez-lui tantôt à sa droite, tantôt à sa gauche, pour l’inciter à tourner la tête dans les deux sens.
- **Les hochets légers** : à présenter dans sa main ; il lâchera souvent sans le vouloir, c’est une découverte.
- **La musique douce** et les berceuses, à faible volume.

## Questions fréquentes
**Mon bébé ne sourit pas encore à 2 mois : que penser ?**
Les âges sont des moyennes. Continuez à lui sourire et à lui parler. Si vous avez l’impression qu’il est difficile d’établir le contact, parlez-en au médecin ou à la PMI.

**Faut-il mettre un mobile au-dessus du lit ?**
Un mobile peut capter son regard. La HAS conseille toutefois de privilégier le tapis au sol avec des jouets autour, plutôt que des arches ou mobiles qui fixent son attention dans une seule direction.

**Combien de temps jouer avec lui ?**
Il n’existe pas de durée idéale. Quelques minutes d’échange, plusieurs fois par jour, quand il est calme et réveillé, conviennent bien. Arrêtez dès qu’il détourne le regard ou pleurniche.

**Faut-il le mettre sur le ventre ?**
Sur le ventre, uniquement pendant l’éveil et **sous votre surveillance permanente**. Pour dormir, il est toujours couché sur le dos.

## Quand demander conseil
Consultez si votre bébé ne réagit pas aux bruits soudains, ne vocalise pas, ne suit jamais des yeux, ou si vous remarquez qu’il tourne toujours la tête du même côté ou que son crâne s’aplatit : un avis précoce est utile.

**Appelez le 15 ou le 112** en cas de malaise, de gêne respiratoire ou de changement brutal de comportement (bébé très mou, gris, difficile à réveiller).

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 3, max_age_months: 6,
    slug: 'eveil-bebe-4-5-mois-mains-roulades',
    title: 'Éveil de bébé à 4 et 5 mois : attraper, rouler, rire aux éclats',
    summary: 'Votre bébé découvre ses mains, attrape les objets et commence à se retourner : idées de jeux et précautions pour cette étape.',
    tags: ['éveil bébé 4 mois', 'éveil bébé 5 mois', 'bébé attrape', 'retournement', 'jeux bébé 5 mois', 'chute table à langer'],
    sources: [S.dev36, S.jeux01, S.hasDcp],
    body_md: `## En bref
- Vers **4 mois**, beaucoup de bébés tiennent leur tête, suivent des yeux dans toutes les directions, rient aux éclats et découvrent leurs mains.
- Vers **5 mois**, ils attrapent les objets à portée avec toute la paume, pédalent, sourient à leur reflet et imitent bruits et mimiques.
- Les **roulades** arrivent : ne laissez jamais votre bébé seul sur un canapé, un lit ou une table à langer.
- Hochets, objets à saisir, jeux en mousse et temps au sol sont ses meilleurs alliés.

## Comprendre
Selon mpedia, à 4 mois le bébé peut rouler du dos sur le côté et rit franchement. À 5 mois, ses gestes deviennent plus coordonnés : il saisit ce qui est à sa portée (préhension « palmaire », avec la paume), se retourne pour chercher votre regard et vous imite. Ces repères varient d’un enfant à l’autre : « votre bébé se développe à un rythme qui lui est propre ».

Les pédiatres citent les **tapis d’éveil et jeux en mousse** comme un excellent moyen de l’encourager à explorer. Pour les bébés de 0 à 6 mois, mpedia propose aussi les jeux d’imitation, les hochets et le fait de changer régulièrement l’endroit où il observe le monde.

La HAS recommande de laisser le nourrisson bouger librement au sol, sur un tapis ferme, avec des jouets autour de lui, et d’éviter une stimulation trop constante.

## Au quotidien
- **Les objets à attraper** : un hochet léger, un anneau, un tissu froissé, un jouet souple. Posez-les à côté de lui pour qu’il tende la main et roule pour les atteindre.
- **Le jeu du miroir** : un miroir incassable prévu pour bébé, posé au sol ; il sourit souvent à son reflet.
- **Les imitations** : reproduisez ses bruits (« brrr », « aaa »), il essaiera de vous répondre.
- **Les pieds** : il commence à s’intéresser à ses pieds ; des chaussettes colorées peuvent l’amuser.
- **Les changements de point de vue** : le matin dans le salon, l’après-midi près d’une fenêtre, en promenade… la variété l’intéresse.
- **La porte à la bouche** : tout ce qu’il attrape va à la bouche. N’offrez que des objets propres, solides, trop gros pour être avalés, sans petite pièce détachable.

## Questions fréquentes
**Mon bébé se retourne : puis-je encore le changer sur la table à langer ?**
Oui, en gardant toujours une main sur lui et tout le matériel à portée. Ne vous éloignez jamais, même une seconde ; au besoin, posez-le au sol.

**Faut-il l’asseoir avec des coussins ?**
La position assise s’installe progressivement. Mpedia indique qu’à 6 mois il tient assis avec un appui dans le dos. Le temps au sol, sur le dos ou le ventre, lui permet de construire cette étape à son rythme.

**Il préfère toujours le même côté : est-ce un souci ?**
Variez la place des jouets et l’endroit d’où vous lui parlez. Si la préférence est très marquée ou si sa tête se déforme, parlez-en à votre médecin.

**Il se lasse vite d’un jouet : est-il trop petit pour jouer ?**
À cet âge, l’attention est courte. Mpedia rappelle qu’un enfant se désintéresse d’un jeu trop facile comme trop difficile ; changez simplement d’activité.

## Quand demander conseil
Parlez-en au médecin si votre bébé ne tient pas encore sa tête vers 4–5 mois, s’il n’attrape aucun objet, ne rit ni ne gazouille, ou si vous avez un doute sur sa vision ou son audition.

**Appelez le 15 ou le 112** après une chute avec perte de connaissance, vomissements répétés, somnolence inhabituelle ou comportement anormal, ou en cas d’objet avalé avec gêne pour respirer.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 5, max_age_months: 8,
    slug: 'eveil-bebe-6-7-mois-assis-comptines',
    title: 'Éveil de bébé à 6 et 7 mois : s’asseoir, manipuler, rire aux comptines',
    summary: 'Position assise, passage d’un objet d’une main à l’autre, chatouilles et comptines : comment jouer avec votre bébé autour de 6 mois.',
    tags: ['éveil bébé 6 mois', 'éveil bébé 7 mois', 'bébé assis', 'comptines', 'chatouilles', 'jeux bébé 6 mois', 'babillage'],
    sources: [S.dev36, S.dev69, S.jeux01, S.bouger5ans],
    body_md: `## En bref
- Vers **6 mois**, beaucoup de bébés tiennent assis avec un appui dans le dos, jouent avec leurs pieds, roulent du ventre au dos et forment des syllabes.
- La position assise se stabilise peu à peu entre **7 et 9 mois** : les mains se libèrent pour jouer.
- Les **comptines à gestes** et les **chatouilles** déclenchent souvent de grands rires.
- Au sol, sur une surface rembourrée, il peut s’entraîner à rouler et ramper.

## Comprendre
D’après mpedia, autour de 6 mois le bébé passe seul du dos au ventre, s’appuie sur ses avant-bras, tend les jambes quand on le tient debout et produit des syllabes. Entre 7 et 9 mois, il passe d’un appui « en trépied » sur les mains à une position assise stable, le tronc droit : il peut alors jouer avec ses deux mains. Il commence aussi à passer un objet d’une main à l’autre.

Pour cet âge, mpedia recommande les **comptines avec des gestes répétés**, puis une petite variante qui surprend et fait rire, ainsi que les chatouilles. Il conseille de changer d’activité dès que l’intérêt baisse.

Manger Bouger (Santé publique France) propose, à partir de 6 mois, d’installer le bébé sur le dos sur une surface rembourrée, avec un objet coloré ou musical à côté, pour l’encourager à se retourner et à ramper, dans un espace sécurisé et sous votre regard.

## Au quotidien
- **Comptines à gestes** : « Ainsi font font font », « Petit escargot », « Bateau sur l’eau »… Répétez-les : il anticipe la suite et rit avant même le geste final.
- **Le jeu de la surprise** : refaites trois fois le même geste, puis changez un détail (plus lent, plus fort, un bisou à la fin).
- **Passer d’une main à l’autre** : proposez un cube souple, un anneau ; offrez un deuxième objet quand il en tient déjà un.
- **Le panier d’objets** : une cuillère en bois, un gobelet, une balle en tissu, une brosse douce… des objets du quotidien, propres, solides et trop gros pour être avalés.
- **L’objet un peu loin** : posez un jouet hors de portée immédiate pour qu’il roule ou rampe vers lui.
- **Les syllabes** : répondez à ses « ba-ba » ou « da-da » en les répétant, puis en ajoutant un mot (« ba-ba… ballon ! »).

## Questions fréquentes
**Faut-il l’asseoir longtemps pour l’aider à tenir assis ?**
Non. La position assise vient d’elle-même en passant par les retournements et les appuis sur les mains. Manger Bouger conseille de ne pas laisser un bébé assis ou allongé dans la même position plus d’une heure d’affilée (hors sommeil).

**Mon bébé ne rampe pas, il se déplace autrement : est-ce un problème ?**
Mpedia décrit de nombreuses façons de se déplacer : roulades, reptation, glissades sur les fesses, quatre pattes. Chaque enfant choisit son mode.

**Quelles comptines choisir ?**
Celles que vous aimez et connaissez ! Les comptines de votre enfance, dans votre langue, ont autant de valeur que d’autres.

**Mon bébé met tout à la bouche : faut-il l’en empêcher ?**
C’est sa façon d’explorer. Le rôle de l’adulte est de veiller à ce qu’il n’ait accès qu’à des objets sûrs, sans petites pièces.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne babille pas, ne réagit pas à son prénom ou aux voix, ne se retourne pas du tout, ou si vous avez une impression de « raideur » ou de « mollesse » inhabituelle.

**Appelez le 15 ou le 112** si votre bébé s’étouffe avec un objet et ne peut plus respirer, tousser ou pleurer, ou après une chute suivie de vomissements, somnolence ou comportement inhabituel.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 7, max_age_months: 10,
    slug: 'eveil-bebe-8-9-mois-explorer-cause-effet',
    title: 'Éveil de bébé à 8 et 9 mois : explorer, se déplacer, comprendre les causes et les effets',
    summary: 'Pince pouce-index, quatre pattes, « au revoir » de la main, angoisse de séparation : des jeux adaptés à votre bébé de 8–9 mois.',
    tags: ['éveil bébé 8 mois', 'éveil bébé 9 mois', 'pince pouce index', 'quatre pattes', 'angoisse de séparation', 'jeux bébé 9 mois'],
    sources: [S.dev69, S.jeux01, S.etapes],
    body_md: `## En bref
- Vers **8–9 mois**, beaucoup de bébés tiennent bien assis, se déplacent (roulades, reptation, quatre pattes…) et jettent leurs jouets pour les voir tomber.
- La **pince pouce-index** apparaît : il peut saisir de petits objets… d’où une vigilance accrue.
- Il aime les jeux de **cause à effet** : appuyer et entendre un son, faire tourner une roue.
- L’**angoisse de séparation** apparaît souvent vers 8 mois : les jeux de cache-cache aident à apprivoiser les « au revoir ».

## Comprendre
Selon mpedia, entre 6 et 9 mois l’enfant explore en frappant, poussant, manipulant. Il désigne du doigt, tend les bras pour être pris, imite vos gestes ; le « au revoir » de la main est souvent l’un des premiers gestes. Le babillage passe d’une syllabe à deux. Le carnet de santé, repris par Santé publique France, cite vers 8 mois : tenir bien assis, jeter ses jouets, faire « au revoir ».

Vers 8 mois, l’enfant commence à comprendre que les personnes et objets existent même quand il ne les voit plus. Mais la disparition de ses parents peut provoquer des pleurs : c’est l’angoisse de séparation. Mpedia propose de cacher un objet puis de le faire réapparaître, et de jouer à cache-cache pour lui montrer que le parent **revient toujours**.

Pour cette période, mpedia cite aussi les tapis d’éveil, les livres en tissu, les jeux multi-activités, les tableaux d’éveil et les bouliers.

## Au quotidien
- **Le jeu du « tombé-ramassé »** : il lâche, vous ramassez… Ce jeu qui peut lasser l’adulte est pour lui une vraie expérience. Proposez un panier dans lequel il peut faire tomber des objets.
- **Cause et effet** : boîtes à formes très simples, jouets à bouton, une boîte en carton dans laquelle on met et sort des objets, un tambour improvisé (casserole et cuillère en bois).
- **Cacher-trouver** : cachez un jouet sous un tissu devant lui, puis laissez-le chercher.
- **Les « au revoir » en douceur** : dites-lui toujours quand vous partez, même pour aller dans la pièce d’à côté, et revenez en annonçant votre retour.
- **Le parcours au sol** : coussins fermes, couverture roulée, tunnel en carton : de quoi ramper, grimper un peu, contourner.
- **Les livres** : livres en tissu, en carton épais ; nommez ce qu’il pointe du doigt.

## Questions fréquentes
**Mon bébé pleure dès que je quitte la pièce : que faire ?**
Prévenez-le, parlez-lui depuis l’autre pièce, revenez en le nommant. Jouer à cache-cache l’aide à comprendre que vous revenez. Évitez de partir en cachette.

**Il jette tout par terre : faut-il le gronder ?**
À cet âge, jeter fait partie de l’exploration. Vous pouvez proposer des objets qu’il peut lancer (balle en tissu) et ranger ceux qui sont fragiles.

**Quels objets sont dangereux maintenant ?**
Avec la pince pouce-index, il peut ramasser miettes, pièces de monnaie, piles bouton, aimants, petits jouets d’aînés. Faites régulièrement le tour du sol à sa hauteur.

**Il ne fait pas de quatre pattes : faut-il l’entraîner ?**
Non. Santé publique France rappelle qu’il n’est pas nécessaire d’entraîner bébé pour accélérer son développement, et mpedia décrit plusieurs façons de se déplacer (roulades, reptation, quatre pattes…).

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne tient pas assis vers 9 mois, ne babille pas, ne cherche pas le contact, ne pointe ni ne fait aucun geste, ou si vous avez l’impression qu’il « régresse ».

**Appelez le 15 ou le 112** en cas d’étouffement (il ne peut plus respirer, tousser ni pleurer), d’ingestion de pile bouton ou d’aimants, ou de chute suivie de troubles du comportement.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'activites-eveil', min_age_months: 9, max_age_months: 13,
    slug: 'eveil-bebe-10-12-mois-debout-premiers-mots',
    title: 'Éveil de bébé de 10 à 12 mois : se mettre debout, imiter, dire ses premiers « mots »',
    summary: 'Se hisser debout, empiler, vider et remplir, imiter les gestes des grands : des activités concrètes pour la fin de la première année.',
    tags: ['éveil bébé 10 mois', 'éveil bébé 11 mois', 'éveil bébé 1 an', 'premiers mots', 'se mettre debout', 'jeux bébé 1 an', 'porteur'],
    sources: [S.dev912, S.jeux01, S.langage],
    body_md: `## En bref
- Entre **10 et 12 mois**, beaucoup de bébés apprennent à se mettre debout, d’abord en s’appuyant aux meubles.
- Les premiers « mots » apparaissent souvent entre 9 et 12 mois ; un **geste** compte aussi comme un mot.
- Il adore **vider et remplir**, empiler deux ou trois cubes, appuyer sur des boutons, danser sur la musique.
- Il **imite** les adultes : passer l’aspirateur, se mettre de la crème… L’imitation est un jeu à part entière.

## Comprendre
Selon les pédiatres de mpedia (repris sur Santé.fr), le bébé de 9 à 12 mois apprend à se tenir debout seul après avoir maîtrisé l’assis et la position à genoux. La marche apparaît le plus souvent entre 12 et 18 mois : avant, il se déplace à quatre pattes ou autrement. Il commence à utiliser cuillère et gobelet, pointe les images dans les livres, empile deux ou trois cubes.

Ses premiers mots ressemblent souvent à des bruits d’objets ou à des syllabes simplifiées. On parle de mot quand le même son désigne toujours la même chose, souvent accompagné d’un geste. « Non » ou « au revoir » peuvent arriver avant « papa » ou « maman ». Vers 12 mois, il pointe les objets pour vous demander leur nom.

Mpedia suggère à cet âge : jouets porteurs (camion, tracteur), jouets de bain qui se remplissent, livres cartonnés, vieux catalogues à feuilleter, jeux de formes et de couleurs, briques à encastrer. Les séances de jeu sont **courtes**, quelques minutes, avec un adulte disponible.

## Au quotidien
- **Vider-remplir** : un panier et des balles en tissu, une boîte et des cuillères en bois, des gobelets à emboîter.
- **Empiler** : cubes en carton ou en mousse ; c’est surtout le plaisir de les faire tomber !
- **Le jeu du « montre-moi »** : « Où est le chat ? » dans un imagier ; nommez ce qu’il pointe.
- **La danse** : mettez une musique et dansez ensemble ; beaucoup de bébés se balancent en rythme.
- **L’imitation** : donnez-lui un chiffon pendant que vous rangez, une petite cuillère pendant que vous cuisinez (loin des plaques).
- **Le porteur** : un jouet sur lequel il s’assoit et pousse avec ses pieds renforce ses jambes et son équilibre.
- **Le parcours debout** : des meubles stables et un canapé pour se hisser et se déplacer en « cabotage ».

## Questions fréquentes
**Faut-il le faire marcher en le tenant par les mains ?**
Ce n’est pas nécessaire. Mpedia conseille d’encourager les nouveaux mouvements sans trop l’aider et rappelle que certains enfants marchent tard tout en se développant bien.

**Le trotteur peut-il l’aider ?**
Le trotteur est déconseillé par les pédiatres de mpedia, en raison du risque de chutes dans les escaliers, de chocs et de brûlures.

**Il ne dit encore aucun mot à 1 an : dois-je m’inquiéter ?**
Les repères varient. Observez surtout s’il comprend, pointe, fait des gestes et babille. En cas de doute, parlez-en au médecin ou à la PMI.

**Que faire s’il veut toucher à tout ?**
Aménagez un espace où il peut explorer librement et fixez des limites claires ailleurs. Ne le laissez jamais sans surveillance.

## Quand demander conseil
Consultez si votre enfant ne se met pas debout avec appui vers 12 mois, ne babille pas, ne réagit pas aux bruits, ne pointe pas, ou si vous avez l’impression qu’il perd des acquis.

**Appelez le 15 ou le 112** en cas de chute importante (escalier, hauteur) suivie de somnolence, vomissements ou comportement inhabituel, d’ingestion de produit ou d’objet dangereux, ou de brûlure étendue.

${FIN}`,
  },
  // ------------------------------------------------------------------ motricité
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 18,
    slug: 'motricite-libre-bebe-principe-et-mise-en-place',
    title: 'La motricité libre : laisser bébé bouger à son rythme, concrètement',
    summary: 'Ce que recouvre l’idée de motricité libre, ce qu’en disent la HAS et Santé publique France, et comment l’appliquer chez soi.',
    tags: ['motricité libre', 'Pikler', 'bébé au sol', 'laisser bébé bouger', 'développement moteur', 'jeu libre bébé'],
    sources: [S.hasDcp, S.etapes, S.activites, S.bouger5ans],
    body_md: `## En bref
- La « motricité libre » consiste à laisser le bébé **bouger spontanément**, au sol, sans le mettre dans des positions qu’il ne sait pas encore prendre seul.
- La HAS recommande de laisser le nourrisson libre de ses mouvements pendant l’éveil, sur un **tapis ferme au sol**, avec des jouets autour.
- Santé publique France rappelle qu’**il n’est pas nécessaire d’entraîner bébé** pour accélérer son développement.
- L’adulte reste **présent et attentif** : il aménage un espace sûr, encourage, s’émerveille.

## Comprendre
L’expression vient de pédagogues de la petite enfance ; elle n’est pas un protocole médical. Mais plusieurs recommandations officielles vont dans le même sens.

La HAS, dans sa fiche sur la prévention des déformations du crâne, recommande une **motricité libre et spontanée** : laisser bébé bouger, varier ses postures, encourager les rotations de la tête par la voix, le toucher et le regard. Elle conseille un tapis ferme au sol avec des jouets disposés autour, plutôt que des arches ou mobiles qui fixent l’attention. Elle déconseille les dispositifs qui limitent les mouvements (cale-bébé, coussins de positionnement, cocons…).

Santé publique France invite à laisser bébé explorer « à son rythme et à sa manière » : toucher, porter à la bouche, faire tomber, se déplacer. Le site 1000 premiers jours précise que jouer seul est bénéfique tant que bébé peut le faire sans danger d’accident et pendant une durée raisonnable : cela soutient son autonomie et sa créativité.

Manger Bouger recommande, sauf pendant le sommeil, de ne pas laisser un bébé assis ou allongé dans la même position plus d’une heure d’affilée.

## Au quotidien
- **Le sol d’abord** : un tapis ferme ou une couverture épaisse posée par terre, dans une pièce chauffée, loin des courants d’air.
- **Des vêtements souples** qui laissent bouger jambes et bras ; pieds nus quand la température le permet.
- **Des jouets à portée** : quelques objets simples posés autour, pas trop nombreux.
- **Ne pas « poser » dans une position non acquise** : plutôt que de l’asseoir calé de coussins, laissez-le trouver la position assise en passant par le ventre et le côté.
- **Encourager sans faire à sa place** : « Tu y es presque ! » plutôt que de lui donner le jouet tout de suite.
- **Un espace sécurisé** : protections sur les angles, pas de petits objets au sol, pas d’accès aux escaliers.
- **Rester disponible** : à côté, assis par terre, vous observez et partagez ses découvertes.

## Questions fréquentes
**La motricité libre veut-elle dire ne jamais porter bébé ?**
Non. La HAS recommande aussi de prendre souvent bébé dans les bras et de le porter en veillant à ce que ses voies respiratoires restent dégagées. Les deux se complètent.

**Faut-il bannir transat et siège ?**
Ils ont leur utilité ponctuelle (repas, trajet en voiture). La HAS les classe parmi les dispositifs qui limitent les mouvements : mieux vaut en limiter la durée.

**Mon bébé est frustré quand il n’atteint pas un jouet : faut-il l’aider ?**
Un peu d’effort fait partie de l’apprentissage. Si la frustration devient forte, rapprochez légèrement le jouet ou réconfortez-le.

**Et s’il est « en retard » par rapport à un autre enfant ?**
Le développement varie beaucoup d’un enfant à l’autre. Les âges sont des repères moyens ; parlez de vos doutes au médecin.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé bouge peu, semble très raide ou très mou, utilise toujours un seul côté du corps, tourne la tête toujours du même côté, ou si son crâne se déforme : un kinésithérapeute peut être proposé.

**Appelez le 15 ou le 112** en cas de chute avec perte de connaissance, vomissements ou somnolence, ou de difficulté à respirer.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 9,
    slug: 'temps-sur-le-ventre-bebe-eveil',
    title: 'Le temps sur le ventre pendant l’éveil : pourquoi, quand et comment',
    summary: 'Sur le dos pour dormir, sur le ventre pour jouer sous surveillance : repères de Manger Bouger et de la HAS, et astuces si bébé n’aime pas ça.',
    tags: ['bébé sur le ventre', 'tummy time', 'position ventrale', 'tête plate', 'plagiocéphalie', 'muscler la nuque bébé'],
    sources: [S.bouger5ans, S.hasDcp, S.etapes],
    body_md: `## En bref
- **Pour dormir, toujours sur le dos.** Le ventre, c’est uniquement pendant l’éveil, avec un adulte qui surveille en permanence.
- Manger Bouger recommande, dès que bébé tient sa tête, au moins **30 minutes par jour** sur le ventre, réparties dans la journée (par exemple 3 fois 10 minutes).
- Cette position l’aide à soulever la tête, puis les épaules, et participe à la **prévention de la tête plate**.
- S’il proteste, commencez par de très courts moments, sur vous ou à sa hauteur.

## Comprendre
Le couchage sur le dos est la règle de sécurité du sommeil. La HAS rappelle qu’il faut coucher systématiquement le nourrisson sur le dos, dans un lit adapté. En dehors du sommeil, la position sur le ventre a d’autres intérêts : bébé y renforce son cou, ses épaules, son dos, et découvre le monde sous un autre angle. Santé publique France cite, vers 2 mois, le fait que sur le ventre le bébé commence à soulever la tête puis les épaules.

Manger Bouger (Santé publique France) recommande de commencer **dès que bébé tient sa tête**, avec au moins 30 minutes réparties dans la journée, éveillé. La HAS insiste : le nourrisson doit être **surveillé en permanence** pendant les phases d’éveil sur le ventre.

Varier les positions pendant l’éveil (dos, côté, ventre, bras) fait partie des conseils de la HAS pour prévenir les déformations du crâne liées au fait de rester longtemps dans la même position.

## Au quotidien
- **Sur vous d’abord** : allongé(e) en position semi-inclinée, bébé à plat ventre sur votre poitrine. Il lève la tête pour voir votre visage.
- **Au sol, à sa hauteur** : allongez-vous face à lui, parlez, chantez. Votre visage est sa meilleure motivation.
- **Un objet à regarder** : un miroir incassable, un jouet contrasté, un livre en carton ouvert devant lui.
- **Changez de côté** : posez l’objet ou placez-vous tantôt à sa droite, tantôt à sa gauche, pour qu’il tourne la tête dans les deux sens.
- **Les bons moments** : quand il est réveillé et de bonne humeur, pas juste après le repas s’il régurgite facilement.
- **Les petites séances** : quelques minutes suffisent au début ; vous augmentez progressivement.
- **Les transitions** : profitez du change, de la sortie du bain ou du réveil de sieste pour le poser quelques instants sur le ventre.

## Questions fréquentes
**Mon bébé pleure dès qu’il est sur le ventre : faut-il insister ?**
Pas en le forçant. Raccourcissez les séances, mettez-vous face à lui, essayez sur votre ventre. Beaucoup de bébés s’y habituent progressivement.

**Peut-il s’endormir sur le ventre pendant le jeu ?**
S’il s’endort, retournez-le sur le dos et couchez-le dans son lit. Le sommeil sur le ventre est à éviter.

**À partir de quel âge commencer ?**
Manger Bouger indique de débuter dès que bébé tient sa tête. Avant, le contact sur votre poitrine, sous surveillance, est une bonne façon de commencer.

**Et quand il sait se retourner seul la nuit ?**
Continuez à le coucher sur le dos. Demandez conseil au médecin si vous avez des questions sur le couchage.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé tourne toujours la tête du même côté, si l’arrière ou le côté de son crâne s’aplatit, s’il ne parvient pas du tout à relever la tête au fil des semaines, ou s’il semble très raide ou très mou. Un torticolis ou une déformation justifie un avis précoce.

**Appelez le 15 ou le 112** si votre bébé fait un malaise, devient gris ou bleuté, a du mal à respirer ou ne réagit pas normalement.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'tapis-d-eveil-espace-de-jeu-au-sol',
    title: 'Tapis d’éveil et espace de jeu au sol : bien l’installer et le faire évoluer',
    summary: 'Tapis ferme, jouets autour plutôt qu’au-dessus, sécurité de la pièce, parc : comment aménager un coin de jeu adapté à chaque âge.',
    tags: ['tapis d’éveil', 'tapis de jeu bébé', 'coin éveil', 'arche d’éveil', 'parc bébé', 'aménager espace bébé'],
    sources: [S.hasDcp, S.trotteurMpedia, S.dev36, S.bouger5ans],
    body_md: `## En bref
- La HAS recommande un **tapis ferme au sol** avec des jouets **autour** du bébé, plutôt que des arches ou mobiles qui fixent son attention.
- Au sol, bébé peut se retourner, ramper, s’asseoir, se mettre à quatre pattes : mpedia conseille le tapis d’éveil plutôt que le trotteur.
- Peu de jouets à la fois, renouvelés régulièrement, suffisent.
- L’espace doit être **sécurisé** : rien de petit, de coupant ou de chaud à portée.

## Comprendre
Pour la HAS, le temps d’éveil au sol permet une motricité libre et spontanée, utile au développement et à la prévention des déformations du crâne. Elle conseille d’éviter une stimulation trop constante ou inadaptée à l’âge, et de privilégier les échanges avec l’adulte.

Les pédiatres de mpedia présentent le tapis d’éveil comme le lieu où bébé change de posture, du bassin aux retournements, puis à l’assise et au quatre pattes, ce qui le conduit naturellement vers la marche. Ils évoquent aussi le **parc à barreaux** comme un espace où il apprend plus tard à se mettre debout seul et à faire ses premiers pas avec appui.

Manger Bouger propose, dès 6 mois, d’installer bébé sur une surface rembourrée avec un objet coloré ou musical à côté pour l’inciter à rouler et ramper, en sécurisant l’espace.

## Au quotidien
- **Le support** : un tapis ferme et lavable, ou une couverture épaisse pliée ; évitez les surfaces molles où le visage peut s’enfoncer.
- **Les premiers mois** : 2 ou 3 objets posés de chaque côté (hochet, tissu contrasté, anneau). Changez leur place pour qu’il tourne la tête dans les deux sens.
- **Vers 4–6 mois** : des objets un peu plus loin pour l’inciter à rouler ; un miroir incassable ; des jeux en mousse.
- **Vers 7–9 mois** : coussins fermes et petits obstacles pour grimper, un tunnel, un panier d’objets à vider.
- **Vers 10–12 mois** : un meuble bas et stable pour se hisser, un porteur, des cubes à empiler.
- **La rotation des jouets** : rangez une partie des jouets et ressortez-les plus tard, ils paraîtront nouveaux.
- **La sécurité** : vérifiez le sol à sa hauteur (miettes, pièces, piles), protégez les angles, fixez les meubles qui peuvent basculer, éloignez les fils électriques.

## Questions fréquentes
**Les arches avec jouets suspendus sont-elles déconseillées ?**
La HAS recommande de privilégier un tapis au sol avec jouets autour plutôt que les arches ou mobiles qui fixent l’attention dans une seule direction. Une arche peut être utilisée de temps en temps, en variant.

**Faut-il un parc ?**
Ce n’est pas obligatoire. Mpedia le présente comme un espace utile plus tard pour se mettre debout avec appui. Il ne remplace pas la présence d’un adulte et ne doit pas devenir un lieu où l’enfant reste longtemps sans échange.

**Combien de jouets proposer ?**
Peu à la fois. Mpedia rappelle qu’un enfant se désintéresse d’un jeu trop facile comme trop difficile : observez ce qui l’intéresse.

**Puis-je le laisser seul quelques instants sur le tapis ?**
Le jeu seul est bénéfique si l’espace est sécurisé, en restant à portée de voix et de regard. Ne le laissez jamais seul sur une surface en hauteur.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé reste peu actif au sol, utilise un seul côté du corps, ou si sa tête s’aplatit d’un côté.

**Appelez le 15 ou le 112** en cas d’étouffement avec un objet, d’ingestion de pile bouton ou d’aimant, ou de chute suivie de troubles du comportement.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'transat-cosy-limiter-temps-assis-bebe',
    title: 'Transat, cosy, balancelle : pourquoi limiter le temps où bébé est installé',
    summary: 'Ce que disent la HAS et Manger Bouger sur les équipements qui limitent les mouvements, et comment organiser une journée plus « libre ».',
    tags: ['transat bébé', 'cosy', 'balancelle', 'siège bébé', 'tête plate', 'sédentarité bébé', 'combien de temps transat'],
    sources: [S.hasDcp, S.bouger5ans, S.jeux01],
    body_md: `## En bref
- La HAS range le siège-coque, le transat, la balancelle et le hamac parmi les dispositifs qui **limitent les mouvements** du nourrisson.
- Manger Bouger recommande de ne pas laisser un bébé **assis ou allongé plus d’une heure d’affilée** dans la même position, hors sommeil.
- Ces équipements gardent un intérêt ponctuel : un repas, un moment où vous devez avoir les mains libres, un trajet.
- La HAS déconseille fermement cale-bébés, cale-tête, coussins anti-tête plate, cocons et réducteurs de lit.

## Comprendre
Un bébé qui reste longtemps dans la même position, la tête appuyée au même endroit, est plus exposé aux déformations positionnelles du crâne (« tête plate »). C’est l’une des raisons pour lesquelles la HAS recommande la motricité libre au sol et le portage, et classe les équipements de contention (siège-coque, transat, balancelle, hamac) parmi ce qu’il faut limiter.

La HAS est plus nette encore pour les dispositifs utilisés dans le lit : cale-bébé, cale-tête, coussin de positionnement, coussin anti-tête plate, cocon, matelas à mémoire de forme sont **à proscrire**, car ils limitent les mouvements et augmentent le risque d’enfouissement.

Mpedia, de son côté, propose d’installer le tout-petit dans un transat pour qu’il observe son environnement, en changeant régulièrement de lieu. L’idée n’est donc pas d’interdire, mais de doser et de varier.

## Au quotidien
- **Le siège auto pour la voiture** : une fois arrivé, sortez bébé de la coque plutôt que de le laisser y dormir ou y jouer longtemps.
- **Le transat pour un moment précis** : pendant que vous cuisinez ou prenez une douche, à côté de vous, posé au sol, harnais attaché.
- **Jamais en hauteur** : un transat posé sur une table ou un plan de travail peut glisser ou basculer.
- **Alternez** : transat, tapis au sol, bras, porte-bébé, temps sur le ventre… Varier les positions est l’un des conseils de la HAS.
- **Repérez les longues durées cachées** : coque pendant les courses, puis transat à la maison, puis poussette : additionnées, elles peuvent faire beaucoup.
- **Remplacez une partie des moments « installés »** par du portage ou du temps au sol à côté de vous.

## Questions fréquentes
**Mon bébé dort bien dans son transat : puis-je l’y laisser ?**
Pour le sommeil, la HAS recommande de coucher bébé sur le dos dans un lit adapté, sur un matelas ferme, sans oreiller ni couette. S’il s’endort dans le transat, transférez-le dans son lit.

**Un coussin anti-tête plate peut-il aider ?**
La HAS le place parmi les dispositifs à proscrire. Si vous remarquez un aplatissement, parlez-en au médecin, qui pourra proposer d’autres solutions.

**La balancelle aide-t-elle à calmer les pleurs ?**
Elle peut apaiser un moment, mais les bras, le portage et un environnement calme sont aussi efficaces. Gardez-la pour de courtes durées, sous surveillance.

**Et la chaise haute ?**
Elle sert aux repas, quand bébé tient assis. En dehors des repas, le sol reste son meilleur terrain de jeu.

## Quand demander conseil
Signalez au médecin toute asymétrie du crâne ou de la position de la tête : un torticolis ou une déformation justifie une consultation précoce, souvent avec un kinésithérapeute.

**Appelez le 15 ou le 112** en cas de chute d’un transat posé en hauteur suivie de pleurs inhabituels, vomissements ou somnolence, ou si bébé a du mal à respirer.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'activites-eveil', min_age_months: 5, max_age_months: 18, safety_critical: true,
    slug: 'trotteur-bebe-risques-et-alternatives',
    title: 'Trotteur : pourquoi les pédiatres le déconseillent et que proposer à la place',
    summary: 'Chutes dans l’escalier, brûlures, marche moins bien construite : les arguments contre le trotteur et les alternatives pour se déplacer en sécurité.',
    tags: ['trotteur', 'youpala', 'apprendre à marcher', 'chute escalier bébé', 'porteur', 'parc bébé'],
    sources: [S.trotteurMpedia, S.trotteurDecryptage, S.marche],
    body_md: `## En bref
- Les pédiatres de mpedia qualifient le trotteur de « véhicule dangereux » : il permet à bébé d’aller vite vers des zones à risque.
- Santé.fr rappelle les accidents graves possibles, en particulier les **chutes dans l’escalier**, avec des traumatismes crâniens.
- Le trotteur **n’apprend pas à marcher** : bébé y est suspendu, se penche en avant et marche sur la pointe des pieds.
- À la place : **tapis d’éveil**, sol dégagé, meubles stables pour se hisser, **porteur** sur lequel il pousse avec ses jambes.

## Comprendre
Un trotteur est un siège suspendu sur roulettes. Santé.fr Décryptage rapporte qu’un bébé peut y atteindre environ un mètre par seconde, sans pouvoir freiner. Il peut heurter des meubles, faire tomber des objets sur lui, basculer, se retrouver à hauteur de la cuisinière ou de la table et attraper un objet brûlant, ou faire céder une barrière d’escalier. Plusieurs études françaises citées attribuent aux trotteurs une part importante des traumatismes crâniens des bébés, liés à des chutes dans l’escalier.

Les trotteurs vendus dans l’Union européenne doivent respecter la norme EN 1273 et porter des avertissements, mais ils sont interdits en crèche et chez les assistantes maternelles en France. Les autorités européennes ne les interdisent pas ; Santé.fr conclut que l’usage, s’il existe, doit rester **occasionnel** et sous vigilance constante.

Sur le plan moteur, mpedia explique que le trotteur place bébé trop tôt en position verticale, avant qu’il ait trouvé son propre équilibre, et peut même retarder la marche. Mpedia (apprentissage de la marche) rappelle que les jouets sur lesquels l’enfant s’assoit et pousse avec ses jambes sont plus utiles.

## Au quotidien
- **Le sol avant tout** : un tapis d’éveil, puis une pièce dégagée où il peut ramper, se mettre à quatre pattes, se hisser.
- **Des appuis stables** : canapé bas, table basse aux angles protégés, meubles fixés au mur pour qu’ils ne basculent pas.
- **Le porteur** : quand il tient bien assis et commence à se déplacer, un jouet porteur stable renforce ses jambes.
- **Le parc** : mpedia l’évoque comme un lieu où il peut se mettre debout seul en se tenant aux barreaux.
- **Les pieds nus** à la maison, pour mieux sentir le sol.
- **Si vous gardez un trotteur** : loin des escaliers, des marches, des meubles instables et des ustensiles brûlants ; usage occasionnel ; arrêt dès qu’il prend de la vitesse ou marche, comme le recommandait la Commission de la sécurité des consommateurs.

## Questions fréquentes
**Le trotteur est-il interdit en France ?**
Non, il est autorisé à la vente s’il respecte la norme européenne. Il est en revanche interdit en crèche et chez les assistantes maternelles.

**On m’en a offert un : que faire ?**
Vous pouvez choisir de ne pas l’utiliser. Si vous l’utilisez, faites-le rarement, sur une surface plane, loin des escaliers et sources de chaleur, sous votre regard.

**Mon bébé s’ennuie au sol : le trotteur l’occupe…**
Variez les objets, installez-vous à sa hauteur, proposez un panier à vider ou un parcours de coussins. Le portage peut aussi l’occuper pendant vos tâches.

**Le trotteur fait-il marcher plus tôt ?**
Non : selon mpedia, certaines études suggèrent même qu’il peut retarder la marche.

## Quand demander conseil
Parlez au médecin de toute question sur la façon dont votre enfant se déplace ou se tient debout.

**Appelez le 15 ou le 112** après une chute dans l’escalier ou d’une hauteur, surtout en cas de perte de connaissance, vomissements, somnolence, pleurs inhabituels ou bosse importante, et en cas de brûlure étendue, au visage, aux mains ou chez un bébé.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'activites-eveil', min_age_months: 8, max_age_months: 18,
    slug: 'accompagner-premiers-pas-pieds-nus-chaussures',
    title: 'Accompagner les premiers pas : pieds nus, chaussures et jeux qui aident',
    summary: 'Comment encourager votre bébé vers la marche sans le presser, quand préférer les pieds nus et comment choisir ses premières chaussures.',
    tags: ['premiers pas', 'apprendre à marcher', 'pieds nus bébé', 'premières chaussures', 'marche bébé', 'âge marche'],
    sources: [S.marche, S.dev912, S.etapes],
    body_md: `## En bref
- La marche apparaît en moyenne autour d’**un an**, mais beaucoup d’enfants marchent entre 12 et 15 mois, et attendre jusqu’à 18 mois n’est pas rare.
- À la maison, les **pieds nus** l’aident à sentir le sol et à trouver son équilibre.
- Pour sortir : des chaussures légèrement **montantes**, à **semelle souple et fine** et contrefort rigide.
- **Ne le pressez pas** : la pression peut ralentir le processus. « Lui seul sent quand il est prêt. »

## Comprendre
Selon mpedia, le bébé passe par plusieurs étapes : il se retourne vers 4 mois, sautille quand on le soutient debout vers 6–7 mois, puis, entre 9 et 12 mois, rampe, se met à quatre pattes et se hisse debout en s’appuyant aux meubles. Chaque enfant choisit son mode de déplacement. Les premiers pas se font souvent en tenant les deux mains de l’adulte, puis le bout des doigts.

Santé publique France rappelle qu’il n’est pas nécessaire d’entraîner bébé pour accélérer son développement : l’encouragement et l’émerveillement comptent davantage.

La plante des pieds est riche en terminaisons nerveuses : marcher pieds nus aide à mieux sentir le sol et améliore l’équilibre, explique mpedia. Pour les sorties, les pédiatres conseillent des chaussures faciles à enfiler, légèrement montantes pour maintenir la cheville, avec une semelle souple et fine et un contrefort rigide.

## Au quotidien
- **Un espace dégagé** : les chutes sont fréquentes au début ; écartez les objets durs et pointus, protégez les angles.
- **Des appuis** : canapé, table basse stable, meubles fixés au mur.
- **Le jeu des bras tendus** : placez-vous juste hors de sa portée, accroupi, et invitez-le à venir vers vous.
- **Des mains à hauteur d’épaule au maximum** si vous le tenez : vous l’aidez sans le tirer vers le haut.
- **Laissez-le continuer le quatre pattes** : cela l’aide à passer de la position basse à la position debout.
- **Des sols variés** (avec chaussures dehors si besoin) : parquet, tapis, herbe, sable.
- **Adaptez la promenade** : petites distances, rythme lent, poussette à proximité pour la fatigue.

## Questions fréquentes
**Mon bébé a 14 mois et ne marche pas encore : faut-il s’inquiéter ?**
Selon mpedia, une majorité d’enfants marche entre 12 et 15 mois et attendre jusqu’à 18 mois n’est pas rare. Observez qu’il progresse (se hisser, se déplacer en se tenant). Si vous avez un doute, parlez-en au médecin.

**Faut-il des chaussures dès qu’il se met debout ?**
À la maison, pieds nus ou chaussettes antidérapantes dans un environnement sûr. Les chaussures servent surtout pour l’extérieur.

**Comment choisir la taille ?**
Essayez-les en magasin, enfant debout. Vérifiez qu’il reste un peu d’espace devant les orteils et que la chaussure ne serre pas.

**Il tombe beaucoup : est-ce un problème ?**
Les chutes « sur les fesses » font partie de l’apprentissage. Ce qui compte, c’est un environnement sans danger (pas d’escalier accessible, pas d’angle saillant).

## Quand demander conseil
Consultez si votre enfant ne tient pas debout avec appui vers 12–14 mois, ne marche pas à 18 mois, boite, marche toujours sur la pointe des pieds, perd des acquis ou si un membre semble moins utilisé que l’autre.

**Appelez le 15 ou le 112** après une chute avec perte de connaissance, vomissements, somnolence inhabituelle, ou si l’enfant ne peut plus bouger un membre.

${FIN}`,
  },
  // ------------------------------------------------------------------ langage, chant, lecture
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'parler-a-bebe-au-quotidien-bain-de-langage',
    title: 'Parler à bébé au quotidien : le « bain de langage » sans y penser',
    summary: 'Raconter ce que l’on fait, répondre aux babillages, nommer ce qu’il regarde : des gestes simples pour soutenir le langage pendant la première année.',
    tags: ['parler à bébé', 'bain de langage', 'langage bébé', 'babillage', 'stimuler le langage', 'bilinguisme bébé', 'premiers mots'],
    sources: [S.langage, S.etapes, S.interactions],
    body_md: `## En bref
- Parler souvent à bébé, avec un **vocabulaire varié** et une articulation claire, soutient l’apprentissage du langage.
- Associez les mots aux **gestes et aux objets** : montrez le biberon en disant « biberon ».
- Répondez à ses gazouillis par le **jeu du tour de parole** : vous imitez, vous ajoutez un son, vous faites une pause.
- Les échanges sont plus riches **sans écran** : vous êtes plus disponible à ce qu’il exprime.

## Comprendre
Selon les pédiatres de mpedia (repris par Santé.fr), le langage se construit dès les premiers mois : sourires et sons de voyelles vers 2 mois, éclats de rire vers 3–4 mois, consonnes et réaction au prénom vers 5 mois, syllabes « ba-ba » vers 6 mois. Entre 6 et 9 mois, le bébé commence à relier certains mots à leur sens, surtout ceux qu’il entend souvent. Les premiers mots arrivent fréquemment vers 9–10 mois, et vers 12 mois il pointe les objets pour qu’on les nomme.

Santé publique France rappelle que le développement progresse grâce aux échanges du quotidien : réveil, change, toilette, repas, trajets, courses. Sa campagne sur les interactions parent-enfant insiste : **chaque moment d’échange compte**, sans compétence particulière, et ces interactions sont d’autant plus bénéfiques qu’elles ont lieu sans écran.

## Au quotidien
- **Le commentaire en direct** : « Je remplis la baignoire… l’eau coule… elle est chaude. » Pendant le change, la cuisine, la promenade.
- **Nommer ce qu’il regarde** : suivez son regard ou son doigt et mettez un mot dessus : « Oui, c’est le chien ! Il fait ouaf. »
- **Le tour de parole** : il fait « aaa », vous répondez « aaa… bonjour ! », puis vous attendez sa « réponse ».
- **Des phrases courtes et vraies** plutôt qu’un langage « bébé » permanent ; la voix chantante est naturelle et utile.
- **Les gestes avec les mots** : « au revoir » de la main, « encore », « fini »… les gestes l’aident à comprendre et à se faire comprendre.
- **Les moments sans écran** : téléphone rangé pendant le repas, le bain ou le jeu, pour être pleinement disponible.
- **Votre langue** : parlez-lui dans la langue dans laquelle vous êtes à l’aise et exprimez vos émotions.

## Questions fréquentes
**Je me sens bête à parler tout seul à mon bébé…**
Beaucoup de parents le ressentent. Commencez par décrire simplement ce que vous faites. Votre bébé vous écoute, même s’il ne répond pas encore avec des mots.

**Faut-il corriger ses « mots » mal prononcés ?**
Plutôt que de le reprendre, répétez simplement le mot correctement dans une phrase : « Oui, de l’eau ! »

**Nous parlons deux langues à la maison : est-ce gênant ?**
Le plus important est qu’il entende une langue riche et vivante. Parlez-lui dans la langue dans laquelle vous vous exprimez le plus naturellement, et posez vos questions au médecin ou à la PMI en cas de doute.

**Peut-il apprendre des mots avec des vidéos ?**
Mpedia rappelle que la télévision est passive et n’offre pas de vraie conversation, et déconseille de laisser un bébé seul devant un écran. Santé publique France rappelle que les écrans ne sont pas recommandés avant 3 ans.

## Quand demander conseil
Mpedia conseille de consulter le médecin ou la PMI si votre bébé ne sursaute pas aux bruits soudains, ne babille pas ou ne répond pas par des vocalises quand on lui parle, ou s’il existe des troubles du langage dans la famille. Des tests permettent de repérer tôt des difficultés d’audition ou de langage.

**Appelez le 15 ou le 112** en cas d’urgence (malaise, difficulté à respirer). Si vous vous sentez épuisé(e) ou en grande détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'comptines-jeux-de-doigts-chatouilles-bebe',
    title: 'Comptines, jeux de doigts et sauts sur les genoux : chanter avec bébé',
    summary: 'Pourquoi les comptines plaisent tant aux bébés et comment les utiliser selon l’âge, des berceuses aux jeux de doigts de la fin de la première année.',
    tags: ['comptines bébé', 'jeux de doigts', 'chanter à bébé', 'berceuse', 'chatouilles', 'jeux de genoux', 'éveil musical'],
    sources: [S.jeux01, S.langage, S.carnet],
    body_md: `## En bref
- Chanter, réciter des comptines et raconter favorisent l’**apprentissage du langage**, selon les pédiatres de mpedia et le carnet des 1000 premiers jours.
- Vers **6 mois**, les comptines à gestes répétés, avec une petite variante finale, déclenchent souvent le rire.
- Vers **1 an**, les jeux de doigts, chatouilles et sauts sur les genoux travaillent la **conscience du corps** et l’équilibre.
- Pas besoin de bien chanter : votre voix est celle qu’il préfère.

## Comprendre
Le carnet de bienvenue des 1000 premiers jours rappelle que la voix des parents est rassurante pour le bébé, qui la reconnaissait déjà pendant la grossesse, et encourage à chanter, raconter, faire écouter de la musique et danser. Ces activités favorisent le langage, l’autonomie et la créativité : « Rire, jouer, écouter des histoires : c’est bon pour le cerveau. »

Mpedia propose, autour de 6 mois, les **comptines et chatouilles** avec des gestes répétés, puis une légère variante qui déclenche le rire, en changeant d’activité quand l’intérêt baisse. Vers 1 an, les comptines avec les doigts, les chatouilles et les jeux de saut sur les genoux aident l’enfant à prendre conscience de son corps et de son équilibre, et renforcent la complicité.

Côté langage, mpedia recommande de réciter des comptines et de chanter des chansons, et note que les bébés s’engagent davantage quand l’adulte est joueur.

## Au quotidien
- **0–3 mois** : berceuses lentes, fredonnements pendant la tétée ou le biberon, chanson toujours la même au coucher pour créer un repère.
- **3–6 mois** : chansons avec mouvements doux des bras ou des jambes de bébé (pendant le change), sons répétés qu’il peut anticiper.
- **6–9 mois** : comptines à gestes (« Ainsi font font font », « Les petits poissons dans l’eau »…), chatouilles qui arrivent « au bout » de la comptine.
- **9–12 mois** : jeux de doigts (« Une poule sur un mur », « La petite bête qui monte »…), sauts doux sur les genoux, « à dada », toujours en tenant bien bébé.
- **Inventez** : mettez son prénom dans une chanson, chantez ce que vous faites (« On met le pyjama… »).
- **Les chansons de votre enfance**, dans votre langue, sont précieuses ; les grands-parents peuvent en transmettre d’autres.
- **Bibliothèques, PMI, lieux d’accueil parents-enfants** proposent souvent des temps de comptines et d’éveil musical.

## Questions fréquentes
**Je chante faux : est-ce grave ?**
Non. Votre bébé est surtout sensible à votre voix, à votre regard et au plaisir partagé.

**Faut-il varier les comptines ou toujours répéter les mêmes ?**
Les deux. La répétition lui permet d’anticiper et de participer ; la nouveauté l’intéresse aussi. Suivez ses réactions.

**Les sauts sur les genoux sont-ils adaptés à un petit bébé ?**
Mpedia les cite vers la fin de la première année. Avec un plus jeune, préférez des bercements doux. Tenez toujours bien le tronc et la tête, et ne secouez **jamais** un bébé.

**Peut-on utiliser des enregistrements ?**
Oui, ponctuellement, comme musique d’ambiance. Chanter vous-même, en le regardant, apporte en plus l’échange.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne réagit pas aux sons ni à votre voix, ne sourit pas aux échanges ou ne babille pas.

**Appelez le 15 ou le 112** si un bébé a été secoué, même brièvement, ou s’il présente après un jeu des vomissements, une somnolence, une pâleur ou un comportement inhabituel. Si la fatigue vous submerge, le **3114** répond jour et nuit ; si vous craignez pour la sécurité d’un enfant, appelez le **119**.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'lire-des-livres-a-bebe-des-la-naissance',
    title: 'Lire des livres à bébé dès la naissance : comment s’y prendre ?',
    summary: 'Livres en tissu, en carton, imagiers, albums : pourquoi et comment partager la lecture avec un bébé qui ne comprend pas encore les mots.',
    tags: ['lire à bébé', 'livres bébé', 'livre tissu', 'imagier', 'bibliothèque bébé', 'éveil à la lecture', 'histoire bébé'],
    sources: [S.carnet, S.culture, S.langage, S.activites],
    body_md: `## En bref
- Le bébé s’intéresse aux livres **dès la naissance** : sons, couleurs, formes l’aident à apprendre le langage.
- Lire, ce n’est pas forcément lire le texte : on regarde, on montre, on nomme, on invente.
- Livres en tissu, en carton épais, de bain, imagiers : choisissez des livres **adaptés à l’âge** et solides.
- Les **bibliothèques**, les PMI et les lieux d’accueil parents-enfants proposent souvent des lectures pour les tout-petits.

## Comprendre
Le carnet de bienvenue des 1000 premiers jours explique que le livre stimule l’imagination, la découverte de l’environnement et l’expression, et que le bébé s’y intéresse dès la naissance. Les pédiatres de mpedia recommandent de lire des imagiers, des livres cartonnés, en tissu ou de bain, et notent que des magazines pour bébés existent dès 9 mois environ.

Le ministère chargé des Solidarités souligne que l’éveil culturel et artistique, dont la lecture, favorise la curiosité et l’épanouissement de l’enfant et répond à ses besoins d’expression. Dans le cadre des 1000 premiers jours, un sac contenant des albums est remis à la maternité pour encourager les **lectures partagées** dès les premières semaines.

Santé publique France invite aussi à raconter des histoires « avec un livre ou des marionnettes » et à se renseigner en mairie sur les bibliothèques et lieux d’éveil.

## Au quotidien
- **0–3 mois** : un livre aux images contrastées tenu près de son visage ; votre voix qui lit compte plus que l’histoire.
- **3–6 mois** : livres en tissu ou plastique qu’il peut toucher et mordiller ; décrivez les images.
- **6–9 mois** : livres cartonnés à pages épaisses ; laissez-le tourner les pages, même dans le désordre.
- **9–12 mois** : imagiers, livres à toucher, à soulever ; demandez « Où est le chat ? » et attendez qu’il pointe.
- **Un rituel** : un livre avant la sieste ou le coucher crée un repère apaisant.
- **Des séances courtes** : s’il se détourne, vous refermez sans insister ; il peut aussi « lire » seul en manipulant.
- **Des livres partout** : un panier à hauteur du tapis, un livre de bain, un livre dans le sac de sortie.
- **La bibliothèque** : renseignez-vous en mairie sur les conditions d’inscription et les temps de lecture pour les tout-petits.

## Questions fréquentes
**À quoi bon lire à un bébé qui ne comprend pas ?**
Il entend la mélodie de votre voix, regarde les images, partage un moment proche de vous. Le carnet des 1000 premiers jours rappelle que ces échanges soutiennent l’apprentissage du langage.

**Il mâchouille et jette les livres : faut-il attendre ?**
Non. C’est sa façon d’explorer. Proposez des livres en tissu ou cartonnés, solides, et gardez les albums fragiles pour la lecture à deux.

**Il veut toujours le même livre : est-ce un problème ?**
La répétition le rassure et l’aide à anticiper. Vous pouvez proposer d’autres livres à côté, sans retirer son préféré.

**Comment choisir un livre pour bébé ?**
Regardez l’âge conseillé, la solidité (pas de petites pièces détachables), des images claires. Les bibliothécaires peuvent vous conseiller.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne semble pas regarder les images ni votre visage, ne réagit pas à votre voix, ou si vous avez un doute sur sa vue ou son audition.

**Appelez le 15 ou le 112** en cas d’urgence, par exemple si un morceau de livre ou d’objet a été avalé et gêne la respiration.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'musique-danse-eveil-culturel-bebe',
    title: 'Musique, danse et sorties culturelles avec bébé : par où commencer ?',
    summary: 'Écouter, danser, découvrir une bibliothèque, un musée ou un spectacle pour tout-petits : l’éveil artistique pendant la première année.',
    tags: ['éveil musical bébé', 'musique bébé', 'danser avec bébé', 'éveil culturel', 'musée bébé', 'spectacle bébé', 'ludothèque'],
    sources: [S.activites, S.culture, S.carnet],
    body_md: `## En bref
- Dès le plus jeune âge, bébé est attiré par la **musique**, la **danse**, le **mime**, le **chant** et la **lecture**.
- Ces activités soutiennent le langage, l’autonomie et la créativité, selon Santé publique France.
- Bibliothèques, ludothèques, PMI, lieux d’accueil parents-enfants, certains musées et théâtres proposent des temps pour les tout-petits.
- Un **volume doux** et des sorties courtes, adaptées à son rythme, rendent l’expérience agréable.

## Comprendre
Le site 1000 premiers jours de Santé publique France explique que les bébés sont attirés très tôt par les activités artistiques et culturelles. Il conseille de raconter des histoires, de chanter, de faire danser bébé, et de se renseigner en mairie sur les ludothèques, bibliothèques, lieux d’accueil parents-enfants et centres de PMI, qui proposent souvent des lectures et de l’éveil musical.

Le ministère chargé des Solidarités souligne que l’éveil artistique accompagne l’enfant dans la découverte du monde et la construction de ses goûts, et répond à ses besoins d’expression. Certaines bibliothèques, théâtres et musées disposent d’espaces dédiés à la petite enfance. La Charte nationale pour l’accueil du jeune enfant inclut d’ailleurs l’éveil artistique et culturel parmi ses principes.

Le carnet de bienvenue cite aussi parmi les sorties possibles : jardins, forêts, squares, musées, théâtres, cinémas, médiathèques, centres sociaux, MJC et ludothèques.

## Au quotidien
- **La musique à la maison** : variez les styles (musique douce, chansons du monde, musiques que vous aimez), à faible volume, quelques minutes.
- **Danser ensemble** : bébé dans vos bras ou en porte-bébé, bercez-vous en rythme ; plus tard, il se balancera lui-même.
- **Les instruments du quotidien** : boîte remplie de riz bien fermée, casserole et cuillère en bois, clochettes solidement fixées à un jouet prévu pour son âge.
- **Le mime et les marionnettes** : une chaussette transformée en personnage, des grimaces, des petites scènes.
- **Les temps « bébés lecteurs » ou d’éveil musical** à la bibliothèque, à la PMI ou dans un lieu d’accueil parents-enfants.
- **Le musée** : choisissez un moment calme, une visite courte, un porte-bébé plutôt qu’une poussette si les salles sont encombrées.
- **Le spectacle** : préférez ceux annoncés pour les tout-petits (durée courte, son modéré) et installez-vous près de la sortie.

## Questions fréquentes
**Le bruit d’un concert ou d’un spectacle peut-il gêner bébé ?**
Les oreilles des bébés sont sensibles. Évitez les lieux très bruyants, éloignez-vous des haut-parleurs et sortez s’il pleure ou se crispe. Demandez conseil au médecin pour toute sortie dans un lieu sonore.

**Faut-il inscrire bébé à un cours d’éveil musical ?**
Ce n’est pas indispensable. Chanter et écouter de la musique à la maison suffisent ; un atelier peut être un plaisir partagé et une occasion de rencontrer d’autres parents.

**Mon bébé pleure dans les lieux nouveaux : faut-il renoncer ?**
Commencez par des sorties courtes et calmes, à un moment où il est reposé. Restez proche, rassurez-le et repartez si besoin.

**Les sorties culturelles coûtent-elles cher ?**
Renseignez-vous auprès de votre mairie sur les activités proposées par les bibliothèques, ludothèques et lieux d’accueil, et sur leurs conditions d’accès ; les professionnels de PMI, eux, répondent gratuitement.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne réagit pas aux sons ou à la musique, ou si les bruits du quotidien semblent le bouleverser de façon très importante.

**Appelez le 15 ou le 112** en cas de malaise, de gêne respiratoire ou de comportement inhabituel. Si vous vous sentez isolé(e) ou épuisé(e), parlez-en à la PMI ; en cas de grande détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'activites-eveil', min_age_months: 4, max_age_months: 18,
    slug: 'coucou-cache-cache-bebe-permanence-objet',
    title: 'Coucou, cache-cache, objet caché : des jeux pour apprivoiser les séparations',
    summary: 'Pourquoi bébé adore les jeux de « coucou-caché », ce qu’ils lui apprennent et comment les faire évoluer de 4 mois à 1 an et demi.',
    tags: ['coucou caché', 'cache-cache bébé', 'permanence de l’objet', 'angoisse de séparation', 'jeux bébé 8 mois', 'séparation'],
    sources: [S.dev69, S.activites, S.jeux01],
    body_md: `## En bref
- Le **coucou-caché** et le **cache-cache** font partie des jeux simples recommandés par Santé publique France pour les bébés.
- Entre **8 et 12 mois**, l’enfant apprend à retrouver un objet entièrement caché : il comprend peu à peu que ce qu’il ne voit plus existe encore.
- L’**angoisse de séparation** apparaît souvent vers 8 mois ; ces jeux montrent, en douceur, que le parent **revient toujours**.
- Pas de matériel : un foulard, vos mains, un coin de canapé suffisent.

## Comprendre
Santé publique France cite le coucou et le cache-cache parmi les jeux simples, sans matériel coûteux, que les bébés adorent. Selon mpedia, entre 8 et 12 mois l’enfant retrouve un objet entièrement caché. Il comprend que ses parents existent même hors de sa vue, mais leur disparition peut encore le faire pleurer : c’est l’angoisse de séparation, fréquente vers 8 mois.

Les pédiatres de mpedia proposent de montrer un objet, le cacher puis le faire réapparaître, et de jouer à cache-cache pour montrer que le parent revient toujours. Pour les plus petits, mpedia rappelle l’intérêt des jeux d’imitation et des expressions du visage : le « coucou » est d’abord un jeu de visage qui disparaît et réapparaît.

## Au quotidien
- **Vers 4–6 mois** : cachez votre visage derrière vos mains, puis « Coucou ! ». Lentement, avec un grand sourire. Si la surprise l’effraie, rendez la réapparition plus douce.
- **Vers 6–8 mois** : posez un foulard léger sur votre tête et laissez-le le tirer. Puis sur un jouet, en laissant dépasser un bout.
- **Vers 8–10 mois** : cachez entièrement un jouet sous un tissu devant lui et laissez-le chercher. Puis sous un gobelet, sous un coussin.
- **Vers 10–12 mois** : cachez-vous derrière un fauteuil en parlant (« Où est papa ? »), réapparaissez. Il peut aussi venir vous chercher à quatre pattes.
- **Vers 12–18 mois** : il se cache à son tour (souvent en se couvrant juste les yeux !) ; jouez le jeu de le « chercher ».
- **Au quotidien** : annoncez vos départs et vos retours, même pour aller dans la pièce voisine. Évitez de partir en cachette.
- **Les livres à rabats** prolongent le jeu : « Qui se cache derrière ? »

## Questions fréquentes
**Mon bébé pleure quand je me cache : faut-il arrêter ?**
Cachez-vous moins longtemps, en continuant à parler pour qu’il entende votre voix. Le jeu doit rester un plaisir ; s’il l’angoisse, reprenez plus tard.

**Il pleure dès que je le confie à quelqu’un : est-ce lié ?**
L’angoisse de séparation est fréquente vers 8 mois. Prévenez-le, dites au revoir clairement, confiez-le à une personne qu’il connaît, et revenez en le saluant.

**Le doudou peut-il aider ?**
Pendant l’éveil, un objet familier peut rassurer. Pour le sommeil, suivez les recommandations de couchage : pas de gros objets mous dans le lit d’un jeune bébé.

**Il se cache en se couvrant les yeux : pourquoi ?**
Beaucoup de tout-petits se « cachent » ainsi. Jouez le jeu en faisant semblant de le chercher : c’est un moment de complicité.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne cherche jamais le contact, ne réagit pas à votre départ ou à votre retour, ou si les pleurs de séparation sont si intenses qu’ils perturbent durablement votre vie.

**Appelez le 15 ou le 112** en cas d’urgence. Si l’épuisement vous submerge, le **3114** répond jour et nuit ; si vous craignez pour la sécurité d’un enfant, appelez le **119**.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'eveil-sensoriel-bebe-toucher-textures-sons',
    title: 'Éveil sensoriel de bébé : textures, sons, odeurs… sans surstimuler',
    summary: 'Idées d’activités sensorielles simples avec des objets du quotidien, précautions de sécurité et signes que bébé a besoin de calme.',
    tags: ['éveil sensoriel', 'panier à trésors', 'textures bébé', 'sensoriel bébé', 'surstimulation', 'bébé fatigué', 'objets du quotidien'],
    sources: [S.etapes, S.hasDcp, S.activites, S.jouets],
    body_md: `## En bref
- Bébé découvre le monde avec **tous ses sens** : toucher, porter à la bouche, sentir, faire tomber, faire du bruit.
- Des objets du quotidien, propres et sûrs, suffisent : tissus variés, cuillère en bois, gobelet, balle souple.
- La HAS met en garde contre une **stimulation trop constante** ou inadaptée à l’âge : les moments calmes comptent aussi.
- **Sécurité** : rien de petit, de cassant, de toxique ou de coupant ; jamais de pile bouton ni d’aimant à portée.

## Comprendre
Santé publique France décrit un bébé qui explore « à son rythme et à sa manière » : il touche, porte à la bouche, sent, fait tomber, fait du bruit, se déplace et joue avec ce qui l’attire. Le site 1000 premiers jours rappelle que les activités du quotidien (repas, bain, promenade) sont déjà riches en sensations, et qu’il n’existe pas de recette toute faite.

La HAS recommande d’encourager les mouvements du bébé par des stimulations douces (toucher, voix, regard), mais d’**éviter une stimulation trop constante** ou inadaptée à son âge et de privilégier des échanges de qualité avec l’adulte.

Pour les objets proposés, la DGCCRF rappelle que les jouets doivent porter le marquage CE et que ceux marqués « ne convient pas aux enfants de moins de 36 mois » présentent un danger pour les petits (petites pièces, longs cordons, petites balles).

## Au quotidien
- **Le toucher** : un carré de tissus variés (coton, velours, laine, satin), une brosse douce, du papier froissé à manipuler sous surveillance.
- **Les sons** : une boîte en plastique bien fermée remplie de riz, une cuillère sur une casserole, du papier qui craque, votre voix qui chuchote puis chante.
- **La vue** : jeux d’ombre et de lumière près d’une fenêtre, feuillage qui bouge, livre contrasté.
- **L’odorat** : faites-lui sentir une orange coupée, du basilic, une fleur, en nommant chaque odeur.
- **Le goût**, au moment de la diversification et sur avis du professionnel qui suit votre bébé, avec des textures adaptées à son âge.
- **Le corps** : massage doux, pieds nus sur l’herbe ou sur un tapis, bain tiède.
- **Le panier d’objets** (vers 6–12 mois) : 5 ou 6 objets solides, propres, trop gros pour entrer dans la bouche, que vous vérifiez à chaque fois.

## Questions fréquentes
**Comment savoir s’il en a assez ?**
Il détourne le regard, se frotte les yeux, bâille, se cambre, pleure ou s’agite. Arrêtez l’activité, proposez un endroit calme, vos bras, ou le sommeil.

**Les jouets lumineux et sonores sont-ils utiles ?**
Ils peuvent amuser, mais ne sont pas nécessaires. Santé publique France souligne qu’il n’est pas utile d’acheter du matériel coûteux. Évitez les sons très forts près de ses oreilles.

**Peut-il jouer avec de la nourriture ?**
Pendant les repas, toucher les aliments fait partie de la découverte. Suivez les conseils du professionnel qui suit votre bébé pour les textures adaptées à son âge.

**Les bacs sensoriels (riz, pâtes, graines) sont-ils adaptés ?**
Les petits éléments présentent un risque d’étouffement chez les bébés qui mettent tout à la bouche. Préférez de gros objets ou des contenants bien fermés.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé semble ne pas voir ou ne pas entendre, réagit très fortement à certaines sensations (bruits, textures) ou au contraire semble ne réagir à presque rien.

**Appelez le 15 ou le 112** si votre bébé s’étouffe et ne peut plus respirer, tousser ni pleurer, s’il a avalé une pile bouton, un aimant ou un produit, ou s’il a un gonflement du visage ou une gêne respiratoire.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'bain-jeux-d-eau-eveil-bebe-securite',
    title: 'Le bain, moment d’éveil : jeux d’eau et règles de sécurité',
    summary: 'Faire du bain un moment de jeu et de douceur, avec des idées par âge et les règles indispensables pour prévenir noyades et brûlures.',
    tags: ['bain bébé', 'jeux de bain', 'jouets de bain', 'noyade bébé', 'température bain', 'éveil aquatique', 'sécurité bain'],
    sources: [S.bain, S.dev912, S.carnet],
    body_md: `## En bref
- L’Assurance Maladie décrit le bain comme un **moment de douceur et de partage**, avec des jouets adaptés à l’âge.
- **Ne laissez jamais votre bébé seul dans l’eau**, même assis, même quelques secondes : un bébé peut se noyer en quelques minutes, sans bruit, même dans très peu d’eau.
- Eau à **37 °C maximum** (vérifiée au thermomètre ou au coude), pièce à 22–25 °C.
- Vers 9–12 mois, les jouets qui se remplissent et se vident, les animaux et bateaux font de l’eau un vrai terrain d’expériences.

## Comprendre
L’Assurance Maladie rappelle les trois principaux risques du bain : **brûlures**, **refroidissement** et **noyade**. Elle conseille de tout préparer avant, de couper ou mettre le téléphone sur répondeur, de vérifier la température de l’eau et de ne jamais laisser l’enfant seul : si vous devez sortir, enveloppez-le dans une serviette et emmenez-le. Le carnet des 1000 premiers jours rappelle de toujours maintenir la tête de bébé hors de l’eau.

Côté éveil, l’Assurance Maladie souligne le plaisir du bain et la possibilité d’y proposer des jouets adaptés à l’âge ; un bain en fin d’après-midi peut aussi apaiser les pleurs du soir. Les pédiatres de mpedia citent, pour les 9–12 mois, les jouets de bain (animaux, bateaux, gobelets qui se remplissent), et plus tôt les livres en plastique et aspergeurs.

## Au quotidien
- **Préparer** : tout à portée de main avant de mettre bébé dans l’eau (serviette, vêtements, savon, jouets).
- **Vérifier** : thermomètre ou coude ; ne faites jamais couler l’eau quand bébé est dans la baignoire.
- **0–3 mois** : bain court et calme, une main sous sa nuque, l’autre qui fait couler doucement l’eau sur son ventre ; chantez, parlez.
- **3–6 mois** : il gigote et éclabousse ; laissez-le battre des jambes en le tenant bien.
- **6–9 mois** : un gobelet, un livre de bain, un petit animal flottant ; nommez « plein », « vide », « ça coule ».
- **9–12 mois** : transvaser avec des gobelets, faire flotter et couler, aspergeurs ; un tapis antidérapant ou un anneau de bain peut aider quand il tient assis, **sans jamais remplacer votre présence**.
- **Après le bain** : sortez-le à deux mains, enveloppez-le tout de suite, séchez bien les plis.
- **Entretien des jouets** : videz-les et laissez-les sécher ; jetez ceux qui sont abîmés ou moisis.

## Questions fréquentes
**Puis-je le laisser dans son anneau de bain le temps d’aller chercher une serviette ?**
Non. L’anneau ou le transat de bain aident à le stabiliser mais ne protègent pas de la noyade. Emmenez-le avec vous, enveloppé dans une serviette.

**Combien de temps peut durer le bain ?**
L’Assurance Maladie ne fixe pas de durée ; elle conseille de prendre son temps. Sortez-le avant qu’il ne se refroidisse ou se fatigue.

**Il a peur de l’eau : que faire ?**
Peu d’eau, une température agréable, des gestes lents, votre voix. Vous pouvez essayer le bain à deux ou la toilette au gant pendant quelque temps.

**Faut-il un bain tous les jours ?**
Selon l’Assurance Maladie, un bain tous les deux ou trois jours suffit, mais un bain quotidien est possible s’il vous fait plaisir à tous les deux.

## Quand demander conseil
Parlez au médecin d’un gonflement dans le pli de l’aine découvert pendant le bain (l’Assurance Maladie signale qu’une hernie peut être découverte à ce moment) ou de toute rougeur de peau persistante.

**Appelez immédiatement le 15 ou le 112** si votre bébé a été retrouvé la tête sous l’eau, même s’il semble aller bien ensuite, en cas de brûlure par l’eau chaude (refroidir sous l’eau tiède en attendant les conseils), ou de malaise.

${FIN}`,
  },
  // ------------------------------------------------------------------ dehors et sorties
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'sortir-dehors-avec-bebe-nature-parc',
    title: 'Sortir avec bébé : parc, forêt, square, l’éveil en plein air',
    summary: 'Pourquoi les sorties dans la nature sont recommandées dès les premiers mois et des idées concrètes pour en profiter à chaque âge.',
    tags: ['sortir avec bébé', 'promenade bébé', 'nature bébé', 'parc bébé', 'jouer dehors', 'square', 'rencontrer d’autres parents'],
    sources: [S.livret, S.activites, S.bouger5ans],
    body_md: `## En bref
- Santé publique France présente les jeux et activités en **extérieur** comme très positifs pour le développement et les apprentissages, surtout dans la nature.
- Le livret des 1000 premiers jours invite à jouer « en forêt, au jardin ou au square du quartier », autant que possible.
- Les sorties sont aussi l’occasion pour les parents de **rencontrer d’autres familles**.
- Pensez à l’essentiel : protection contre le soleil ou le froid, **de l’eau**, une tenue adaptée.

## Comprendre
Le livret des 1000 premiers jours explique que la nature favorise les apprentissages, l’attention et le vocabulaire, et aide à réduire le stress : « Jouer c’est grandir, encore plus dans la nature. » Le site 1000 premiers jours confirme que les activités en extérieur, dans les parcs et jardins d’enfants, sont bénéfiques, et rappelle de protéger bébé du soleil à la belle saison et d’emporter à boire, même pour une courte sortie.

Manger Bouger recommande, à partir de 1 an, au moins trois heures par jour d’activités variées et ludiques, si possible en plein air. Avant cela, le plein air reste une source de découvertes : lumière, bruits, odeurs, visages, mouvements.

## Au quotidien
- **0–3 mois** : promenade en poussette ou en porte-bébé, à l’abri du soleil direct et du vent ; commentez ce que vous voyez et entendez.
- **3–6 mois** : une couverture épaisse à l’ombre dans un parc ; bébé sur le dos ou sur le ventre (sous votre regard), observe les feuilles qui bougent.
- **6–9 mois** : touchez ensemble l’écorce d’un arbre, l’herbe, une feuille ; écoutez les oiseaux ; regardez les autres enfants jouer.
- **9–12 mois** : quatre pattes sur l’herbe, premiers pas avec appui sur un banc, balançoire pour bébé avec harnais si l’aire de jeux en propose, toujours en le tenant à l’œil.
- **Le square comme lieu social** : les autres parents, les assistantes maternelles et les enfants plus grands sont autant de rencontres.
- **Le sac de sortie** : eau, change, vêtement supplémentaire, chapeau ou bonnet selon la saison, un ou deux jouets, un livre en tissu.
- **Le bon moment** : un bébé reposé et nourri profite mieux de la sortie ; en été, préférez le début ou la fin de journée.

## Questions fréquentes
**À partir de quel âge peut-on sortir avec un nouveau-né ?**
Les sources consultées ne fixent pas d’âge minimum ; elles insistent sur la protection contre le soleil, la chaleur et le grand froid. Demandez conseil à la sage-femme ou au médecin, surtout si votre bébé est né prématuré ou a une santé particulière.

**Il met de la terre ou des feuilles à la bouche : que faire ?**
Surveillez de près, retirez ce qui est petit ou douteux (cailloux, mégots, baies, champignons), lavez-lui les mains après le jeu.

**Les aires de jeux sont-elles adaptées avant 1 an ?**
Certaines ont un coin pour tout-petits. Vérifiez que les jeux sont prévus pour son âge et restez à côté de lui.

**Et quand il fait mauvais ?**
Une courte sortie bien couverte reste possible, sauf par grand froid, forte chaleur ou pollution importante. Sinon, ludothèques et bibliothèques sont des alternatives.

## Quand demander conseil
Demandez conseil au médecin ou à la PMI si votre bébé a une santé fragile, est né prématuré ou si vous vous demandez quelles sorties sont adaptées pour lui.

**Appelez le 15 ou le 112** en cas d’ingestion de baie, de champignon ou de produit, de piqûre suivie d’un gonflement du visage ou d’une gêne respiratoire, de chute avec troubles du comportement, ou de signes de coup de chaleur (fièvre, somnolence, bébé très rouge ou très pâle).

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'activites-ete-bebe-soleil-chaleur',
    title: 'Activités d’été avec bébé : profiter du dehors en le protégeant du soleil',
    summary: 'Avant un an, on évite l’exposition au soleil : horaires, ombre, vêtements, eau et idées d’activités adaptées aux beaux jours.',
    tags: ['bébé soleil', 'bébé été', 'chaleur bébé', 'chapeau bébé', 'lunettes de soleil bébé', 'crème solaire bébé', 'plage bébé'],
    sources: [S.soleil, S.carnet, S.noyade],
    body_md: `## En bref
- **Avant un an**, il est recommandé d’éviter au maximum l’exposition de bébé au soleil.
- Sortez plutôt en **début ou fin de journée** et privilégiez l’**ombre**.
- Vêtements couvrants, **chapeau à larges bords**, lunettes filtrant les UV (marquage CE, catégorie 3 ou 4) et **eau** à proposer régulièrement.
- Près de l’eau, **un adulte surveille un seul enfant**, sans le quitter des yeux.

## Comprendre
Les pédiatres de mpedia recommandent vivement d’éviter au maximum l’exposition au soleil des bébés de moins d’un an. Pour les enfants en général, ils conseillent d’éviter les sorties entre 10 h et 16 h, de privilégier l’ombre, des vêtements couvrants, un chapeau à bords larges (qui protège nuque et oreilles mieux qu’une casquette) et des lunettes de soleil adaptées à l’âge, avec verres de catégorie 3 ou 4 et marquage CE. Ils rappellent que les crèmes solaires ne protègent pas à 100 % et ne doivent pas servir à prolonger l’exposition.

Le carnet de bienvenue des 1000 premiers jours rappelle aussi d’éviter l’exposition avant un an et de prévoir de l’eau. L’Assurance Maladie rappelle, pour la baignade, de ne jamais perdre l’enfant de vue et qu’un adulte ne surveille qu’un seul enfant à la fois.

## Au quotidien
- **Le bon horaire** : sorties le matin tôt ou en fin d’après-midi ; aux heures chaudes, activités calmes à l’intérieur, au frais.
- **L’ombre** : sous un arbre, un parasol, une tente anti-UV ; l’ombre ne bloque pas tous les rayons, gardez vêtements et chapeau.
- **Les jeux d’eau à l’ombre** : une bassine avec très peu d’eau, des gobelets, une éponge… **toujours avec un adulte à côté**, et videz l’eau après le jeu.
- **Dans l’herbe** : une couverture à l’ombre, des feuilles et fleurs à toucher, des bulles de savon soufflées par vous.
- **La poussette** : garez-la à l’ombre et gardez bébé couvert d’un vêtement léger et d’un chapeau ; l’ombre seule ne suffit pas toujours.
- **L’hydratation** : proposez à boire régulièrement, selon les conseils de votre professionnel de santé pour son âge (lait, eau).
- **La voiture** : ne laissez jamais un bébé seul dans une voiture, même quelques minutes.

## Questions fréquentes
**Peut-on emmener un bébé à la plage ?**
C’est possible en dehors des heures chaudes, à l’ombre, bien couvert, avec chapeau et eau, et sans exposition directe au soleil. Le sable et la réverbération augmentent l’exposition aux UV.

**La crème solaire suffit-elle ?**
Non. Mpedia rappelle qu’elle ne protège pas à 100 %. Les vêtements, le chapeau et l’ombre restent la base. Demandez conseil à votre pharmacien ou médecin pour un produit adapté à un nourrisson.

**Mon bébé peut-il se baigner dans une piscine ?**
Demandez conseil au médecin selon son âge. Dans tous les cas, l’Assurance Maladie insiste : un seul adulte surveille un seul enfant, sans jamais le quitter des yeux.

**Comment l’occuper aux heures les plus chaudes ?**
À l’intérieur, dans la pièce la plus fraîche : tapis au sol, livres, comptines, jeux d’eau dans une bassine avec très peu d’eau, sous votre surveillance constante.

## Quand demander conseil
Demandez un avis médical si votre bébé a un coup de soleil, boit moins, a moins de couches mouillées, ou semble grognon et fatigué par la chaleur.

**Appelez le 15 ou le 112** en cas de fièvre élevée avec somnolence, de peau très chaude et sèche, de vomissements, de pâleur, de bébé qui ne réagit plus normalement, ou d’accident dans l’eau, même si l’enfant semble aller bien ensuite.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'activites-hiver-bebe-froid-sorties',
    title: 'L’hiver avec bébé : sortir quand il fait froid et occuper les journées à l’intérieur',
    summary: 'Couches de vêtements, tête, mains et pieds couverts, poussette plutôt que porte-bébé par grand froid, et idées d’activités à la maison.',
    tags: ['bébé froid', 'sortir bébé hiver', 'grand froid bébé', 'habiller bébé hiver', 'activités intérieur bébé', 'porte-bébé froid'],
    sources: [S.froid, S.bouger5ans, S.carnet],
    body_md: `## En bref
- Les bébés **se refroidissent vite** : ils perdent beaucoup de chaleur par la tête et ne peuvent pas dire qu’ils ont froid.
- Par **grand froid**, Santé.fr conseille avant tout d’éviter de sortir avec un bébé.
- Plusieurs **couches fines** valent mieux qu’un seul vêtement épais ; tête, mains et pieds bien couverts.
- Par grand froid, la **poussette** est préférable au porte-bébé, qui peut comprimer les jambes et favoriser les gelures des pieds.

## Comprendre
Santé.fr (RecoSanté, à partir de sources validées par le Haut Conseil de la santé publique et Santé publique France) explique que les bébés se refroidissent rapidement et peuvent faire une hypothermie. Leur tête représente une grande part de leur surface corporelle, ils ne peuvent pas bouger pour se réchauffer ni dire qu’ils ont froid.

Les conseils : éviter de sortir quand il fait vraiment froid, couvrir la tête, les mains et les pieds, habiller en plusieurs couches. Par grand froid, préférer une poussette ou un landau au porte-bébé, qui peut comprimer les membres inférieurs et augmenter le risque de gelures des jambes et des pieds ; la poussette permet aussi à l’enfant de bouger.

Quand on reste davantage à la maison, Manger Bouger rappelle de ne pas laisser bébé assis ou allongé plus d’une heure d’affilée hors sommeil : l’hiver est une bonne saison pour le temps au sol.

## Au quotidien
- **Habiller par couches** : body, vêtement chaud, combinaison ou nid d’ange pour la poussette, bonnet, moufles, chaussons ou chaussettes épaisses.
- **Ajuster** : une couche en plus ou en moins selon la météo ; à l’intérieur ou dans un magasin chauffé, ouvrez la combinaison pour éviter qu’il ait trop chaud.
- **Les sorties courtes** aux heures les plus douces, en évitant le vent fort.
- **À l’intérieur** : tapis d’éveil, parcours de coussins, cache-cache, lecture, danse, comptines, bain-jeu ; changez de pièce pour varier les découvertes.
- **Les lieux d’accueil** : bibliothèque, ludothèque, lieu d’accueil parents-enfants : de quoi sortir au chaud et rencontrer d’autres familles.
- **La chambre** : le carnet des 1000 premiers jours recommande une température entre 18 et 20 °C pour le sommeil, bébé dans une turbulette ou gigoteuse, sans couverture ni couette.

## Questions fréquentes
**À partir de quelle température ne faut-il plus sortir ?**
Santé.fr ne fixe pas de seuil précis ; il conseille d’éviter de sortir quand les températures sont vraiment basses. Tenez compte aussi du vent et de l’humidité, et demandez conseil au médecin si votre bébé est prématuré ou fragile.

**Le porte-bébé tient chaud : pourquoi l’éviter par grand froid ?**
Le contact avec vous réchauffe le tronc, mais les jambes pendent et peuvent être comprimées, avec un risque de gelures des pieds selon Santé.fr. Par grand froid, préférez la poussette.

**Faut-il ajouter une couverture dans le lit quand il fait froid ?**
Non. Le carnet des 1000 premiers jours recommande une turbulette ou gigoteuse, sans couverture, couette ni oreiller, dans une chambre entre 18 et 20 °C.

**Comment l’occuper à l’intérieur sans écran ?**
Le sol, les livres, les comptines, un panier d’objets, des jeux de cache-cache : les activités simples suffisent.

## Quand demander conseil
Consultez si votre bébé a la peau froide et marbrée qui ne se réchauffe pas, une rougeur ou une pâleur persistante des doigts ou des pieds après une sortie, ou s’il boit moins.

**Appelez le 15 ou le 112** si votre bébé est anormalement mou, somnolent, a la peau très froide malgré le réchauffement, ou respire difficilement.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'portage-et-eveil-bebe-positions-securite',
    title: 'Portage et éveil : découvrir le monde contre vous, en toute sécurité',
    summary: 'Le portage comme moment d’éveil et de réconfort : positions selon l’âge, pourquoi éviter le « face au monde » et les règles pour garder le nez dégagé.',
    tags: ['portage bébé', 'écharpe de portage', 'porte-bébé', 'face au monde', 'éveil portage', 'portage dos', 'sécurité portage'],
    sources: [S.portage, S.hasDcp, S.froid],
    body_md: `## En bref
- Porté, bébé retrouve chaleur, odeur et enveloppement : cela l’apaise et peut **rassurer le parent**.
- Pour un nouveau-né, le **face à face** est privilégié ; plus tard, le portage sur le **côté** ou sur le **dos** peut favoriser l’éveil.
- Mpedia déconseille le portage **face au monde** : pas de repli possible en cas de peur ou de fatigue, position moins adaptée au corps du bébé.
- **Visage et nez toujours dégagés**, bébé porté assez haut, tête à la base de votre cou, visage à portée de votre regard.

## Comprendre
Selon mpedia, le portage répond à des besoins fondamentaux du bébé et peut diminuer pleurs et angoisses. Il facilite aussi les déplacements tout en restant proches. Bébé est installé dos arrondi, genoux repliés vers le nombril, bassin basculé, tête dans l’axe de la colonne.

Le portage face au monde est déconseillé : il comprime la cage thoracique, fait peser le bébé sur ses organes génitaux, comprime les artères des jambes et ne lui offre aucun moyen de repli en cas de peur ou de fatigue. Le portage sur le côté ou dans le dos, plus tard, lui permet de voir autour de lui tout en gardant ce refuge.

La HAS recommande aussi de prendre souvent bébé dans les bras ou de le porter, en veillant à ce que ses voies respiratoires restent dégagées et en variant ses postures : c’est complémentaire du temps libre au sol.

## Au quotidien
- **Le portage-découverte** : nommez ce que vous voyez pendant la promenade ou les courses ; bébé entend votre voix et sent vos mouvements.
- **Pendant les tâches** : rangement, petite cuisine froide, marche… en évitant les sources de chaleur, objets tranchants et boissons chaudes.
- **La danse** : bercez-vous en musique, bébé contre vous.
- **Les vérifications régulières** : visage visible, nez libre, menton non collé sur la poitrine, couleur et température normales.
- **En hiver** : ne couvrez jamais sa tête avec votre manteau ; par grand froid, préférez la poussette (risque de gelures des pieds signalé par Santé.fr).
- **Le choix du matériel** : l’écharpe convient, selon mpedia, jusqu’à environ 10–12 kg ; au-delà, un porte-bébé physiologique, avec assise large et profonde, qui respecte l’enroulement du corps.
- **Alternez** portage, temps au sol et bras : chaque position apporte quelque chose.

## Questions fréquentes
**Le portage empêche-t-il bébé de se développer « librement » ?**
Les deux sont complémentaires. La HAS recommande à la fois la motricité libre au sol et le portage, en variant les postures.

**Mon bébé veut voir devant : que faire ?**
Plutôt que le face au monde, essayez le portage sur la hanche ou dans le dos quand il est en âge, selon les indications du fabricant et les conseils d’un professionnel.

**Jusqu’à quel poids peut-on porter en écharpe ?**
Mpedia indique que l’écharpe convient jusqu’à environ 10–12 kg. Au-delà, un porte-bébé prêt à porter peut prendre le relais s’il respecte l’enroulement du corps et offre une assise large et profonde.

**Où apprendre à nouer une écharpe ?**
Sages-femmes, PMI, certaines maternités et ateliers de portage proposent des démonstrations. Entraînez-vous avec une main toujours sous les fesses du bébé.

## Quand demander conseil
Parlez-en à la sage-femme, à la PMI ou au médecin pour choisir un mode de portage adapté à votre bébé, surtout s’il est né prématuré, a un faible poids ou un problème de hanches.

**Appelez le 15 ou le 112** si bébé devient pâle, gris ou bleuté, respire mal, est inhabituellement mou ou ne réagit pas pendant ou après le portage.

${FIN}`,
  },
  // ------------------------------------------------------------------ jouets et écrans
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12, safety_critical: true,
    slug: 'choisir-jouets-bebe-0-12-mois-securite',
    title: 'Jouets de bébé de 0 à 12 mois : bien choisir et éviter les dangers',
    summary: 'Marquage CE, âge indiqué, mention « moins de 36 mois », piles, aimants, jouets anciens : les repères de la DGCCRF pour choisir les jouets d’éveil.',
    tags: ['jouets bébé', 'jouet d’éveil', 'marquage CE', 'moins de 36 mois', 'pile bouton', 'aimants', 'jouets d’occasion', 'sécurité jouets'],
    sources: [S.jouets, S.jouetsEco, S.carnet],
    body_md: `## En bref
- Vérifiez le **marquage CE** et l’**âge indiqué** : un jouet marqué « ne convient pas aux enfants de moins de 36 mois » ne doit pas être donné à un bébé.
- Pour les tout-petits, préférez des **mécanismes simples**, des plastiques **colorés dans la masse** plutôt que peints, un compartiment à piles **non accessible**.
- **Aimants et piles** avalés peuvent provoquer des lésions graves : consultez immédiatement en cas d’ingestion.
- Certains objets attirants **ne sont pas des jouets** (décorations, figurines de collection, poupées décoratives).

## Comprendre
La DGCCRF explique que les jouets vendus en France doivent respecter des exigences européennes renforcées (mécanique, inflammabilité, chimie, électricité, hygiène). Le marquage CE signifie que le fabricant atteste respecter ces exigences. Les jouets dangereux pour les moins de 36 mois doivent porter un avertissement (texte ou pictogramme) précisant le danger : petites pièces, longs cordons, petites balles.

Pour les aimants, la DGCCRF précise que s’ils sont avalés à deux ou plus, ils peuvent s’attirer à travers la paroi de l’intestin et provoquer une perforation ou une occlusion : il faut consulter immédiatement. Elle conseille aussi de se méfier des jouets anciens, qui peuvent ne pas respecter les normes actuelles, et des piles usées, abîmées ou mélangées.

Le carnet des 1000 premiers jours rappelle qu’aucun équipement spécial n’est nécessaire : un jouet suffit si le jeu est un plaisir partagé. Il conseille de rechercher le marquage CE ou NF et de lire les avertissements.

## Au quotidien
- **Avant l’achat** : lisez l’emballage (âge, avertissements), manipulez le jouet si possible, vérifiez qu’aucune pièce ne se détache.
- **0–6 mois** : hochets légers, anneaux, tissus contrastés, jouets souples. Évitez les cordons longs et les attaches autour du cou.
- **6–12 mois** : cubes souples, gobelets à empiler, balles en tissu, livres cartonnés, porteur stable, jouets de bain.
- **Les objets du quotidien** : cuillère en bois, gobelet, boîte en carton font d’excellents jouets, s’ils sont solides et trop gros pour être avalés.
- **Les jouets des aînés** : rangez-les hors de portée ; petites pièces, billes et figurines sont fréquentes.
- **Les jouets d’occasion ou anciens** : vérifiez leur état, le compartiment à piles, la peinture qui s’écaille ; en cas de doute, ne les donnez pas.
- **Les rappels** : consultez le site officiel RappelConso si vous avez un doute sur un produit.
- **L’entretien** : lavez régulièrement, jetez les jouets cassés ou fissurés.

## Questions fréquentes
**Le marquage CE garantit-il qu’un jouet est sûr ?**
Il indique que le fabricant affirme respecter les exigences de sécurité. La DGCCRF contrôle les produits et peut faire retirer ceux qui sont dangereux. Restez attentif à l’âge indiqué et à l’état du jouet.

**Les jouets achetés en ligne sont-ils fiables ?**
Les mêmes repères s’appliquent : marquage CE, âge indiqué, avertissements lisibles. Méfiez-vous des produits sans notice ni marquage.

**Les doudous et peluches sont-ils des jouets comme les autres ?**
Oui, ils doivent aussi respecter les normes. Vérifiez que les yeux et petits éléments sont solidement fixés. Pour le sommeil d’un jeune bébé, suivez les conseils de couchage (pas de gros objets mous dans le lit).

**Comment signaler un jouet dangereux ?**
La DGCCRF invite à signaler tout incident de sécurité à la direction départementale chargée de la protection des populations (DDPP ou DDCSPP) de votre lieu de résidence.

## Quand demander conseil
Demandez conseil au médecin si votre enfant a mis en bouche un objet dont vous ignorez s’il a été avalé, même sans symptôme.

**Appelez immédiatement le 15 ou le 112** si votre bébé a avalé une pile bouton, un ou plusieurs aimants, s’il s’étouffe (il ne peut plus respirer, tousser ni pleurer) ou s’il a une gêne respiratoire, des vomissements ou des douleurs après avoir joué avec un petit objet.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'activites-eveil', min_age_months: 0, max_age_months: 12,
    slug: 'bebe-sans-ecran-alternatives-premiere-annee',
    title: 'Pas d’écran avant 1 an (et jusqu’à 3 ans) : par quoi les remplacer au quotidien ?',
    summary: 'Ce que disent les autorités de santé sur les écrans chez le bébé, la place des appels vidéo, et des alternatives concrètes pour les moments difficiles.',
    tags: ['écrans bébé', 'télévision bébé', 'tablette bébé', 'calmer bébé sans écran', 'appel vidéo bébé', 'téléphone parent', 'alternatives écran'],
    sources: [S.ecrans, S.livret, S.jeux01],
    body_md: `## En bref
- Les écrans sont **interdits avant 3 ans** dans les modes d’accueil, et l’Assurance Maladie recommande de ne pas utiliser un écran pour **calmer un bébé** qui pleure.
- **Seule exception** citée : les appels vidéo avec des proches éloignés.
- La **télévision allumée en fond** est une exposition passive que l’Assurance Maladie demande aussi d’éviter.
- Pour apaiser : un câlin, un environnement calme, une musique douce, une promenade, un bain.

## Comprendre
L’Assurance Maladie rappelle que, depuis le 2 juillet 2025, il est interdit de laisser un enfant de moins de 3 ans devant un écran dans toutes les structures et chez tous les professionnels de l’accueil de la petite enfance. Certaines sociétés savantes recommandent même de ne pas exposer les enfants aux écrans avant 6 ans. Selon l’Assurance Maladie, l’exposition aux écrans, même brève, a des effets négatifs sur le développement de l’enfant (langage, motricité fine, attention, sommeil…). Il est important de ne pas mettre un bébé devant un écran pour le calmer ; la seule exception citée est l’appel vidéo avec la famille éloignée.

Le livret des 1000 premiers jours explique que les écrans ne sont pas adaptés aux jeunes enfants : ils perturbent le sommeil, allongent l’endormissement et, à long terme, peuvent nuire au développement. Les utiliser pour occuper ou endormir un bébé produit souvent l’effet inverse de celui recherché.

Les pédiatres de mpedia rappellent que l’écran fascine l’enfant, qui ne bouge plus et ne s’éveille plus aux sensations de son corps, et qu’un contact répété avec la télévision ou un jeu électronique le rend passif. Rien ne remplace la complicité avec ses parents.

## Au quotidien
- **Bébé pleure** : bras, portage, bercement, chanson, promenade, bain tiède ; et si rien ne marche, une pause pour vous (bébé posé en sécurité dans son lit).
- **Pendant que vous cuisinez** : bébé dans un transat posé au sol près de vous (pas trop longtemps) ou sur un tapis avec un panier d’objets, et vous lui parlez.
- **Au restaurant ou en visite** : un livre en tissu, un petit jouet, une cuillère, un sachet de « trésors » sûrs, votre visage et vos comptines.
- **En voiture ou en transport** : livres, jeux simples, chansons ; pour les trajets longs, des pauses.
- **Le téléphone des parents** : rangé pendant les repas, le bain, le jeu, pour être plus disponible.
- **La télé éteinte** quand personne ne la regarde vraiment, surtout quand bébé est dans la pièce.
- **Les grands-parents au loin** : un appel vidéo, avec vous à côté qui commentez, est une belle façon de garder le lien.

## Questions fréquentes
**Quelques minutes de dessin animé, est-ce vraiment un problème ?**
Selon l’Assurance Maladie, l’exposition aux écrans, même brève, a des effets négatifs sur le développement du jeune enfant. Il ne s’agit pas de culpabiliser : si cela arrive, revenez simplement aux activités partagées dès que possible.

**Et la musique sur une enceinte ?**
L’écoute de musique, sans image, n’est pas concernée de la même façon ; l’Assurance Maladie cite même la musique douce pour apaiser un bébé.

**Les vidéos « éducatives » pour bébé aident-elles le langage ?**
Mpedia rappelle qu’un contact répété avec la télévision ou un jeu électronique rend l’enfant passif, et que rien ne remplace la complicité avec ses parents. Parler, chanter et lire ensemble soutiennent le langage, selon le livret des 1000 premiers jours.

**Comment faire avec un aîné qui regarde la télévision ?**
Installez le bébé dans une autre pièce ou à un moment différent, et proposez des activités communes sans écran.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si vous trouvez difficile de vous passer des écrans, si votre bébé a du mal à s’apaiser autrement, ou si vous avez des inquiétudes sur son sommeil ou ses échanges.

**Appelez le 15 ou le 112** en cas d’urgence pour votre bébé. Si les pleurs deviennent insupportables, posez-le en sécurité, sortez de la pièce et demandez de l’aide : ne secouez **jamais** un bébé. En cas de grande détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
];
