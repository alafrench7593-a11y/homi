/** Instagram HOMI — SOURCE UNIQUE du contenu (visuels, légendes, hashtags, stories, reels).
 *  Pour une nouvelle publication : ajouter un objet à POSTS (même forme), puis `node scripts/insta-render.mjs ONLY=16`.
 *  Règles : écrans RÉELS de l'app (public/screens), illustrations de l'app (public/art), aucune photo de personne générée,
 *  aucun témoignage présenté comme réel, aucune promesse médicale. Vouvoiement (marketing), phrases courtes.
 *
 *  Grille du profil (la plus récente en haut à gauche) : colonne 1 = émotion, 2 = produit, 3 = éducation.
 *  Publication n → colonne ((15 - n) % 3) + 1 pour les 15 premières : 15/12/09/06/03 émotion, 14/11/08/05/02 produit, 13/10/07/04/01 éducation. */
export type Kind = 'emotion' | 'produit' | 'education';
export type Slide = { kicker: string; title: string; body: string; screen?: string; art?: string; chips?: string[] };
export type Post = {
  n: number; kind: Kind; sujet: string; accroche: string; sous?: string;
  art?: string; screen?: string; screen2?: string; chips?: string[]; dark?: boolean; robot?: boolean;
  slides?: Slide[];                       // carrousels (éducation)
  probleme: string; fonction: string;     // problématique parentale → vraie fonctionnalité HOMI
  legende: string; cta: string; seo: string[]; hashtags: string[];
  story: { haut: string; bas: string };   // déclinaison story
  reel?: { voix: string; duree: number }; // publications produit : reel 1080×1920
};

const H = { base: ['#homi', '#parentalite', '#mamanetbebe'], preg: ['#grossesse', '#enceinte', '#futuremaman'], bebe: ['#bebe', '#jeuneparent', '#viedeparents'] };

export const POSTS: Post[] = [
  { n: 1, kind: 'education', sujet: 'Présentation HOMI', accroche: 'Toute votre vie familiale. Enfin réunie.', sous: 'Ce que HOMI fait pour vous, en 3 gestes.', art: 'famille',
    slides: [
      { kicker: '01 · Suivre', title: 'Grossesse, sommeil, biberons, croissance.', body: 'Tout est noté au même endroit, de la première semaine à ses 10 ans.', screen: 'accueil' },
      { kicker: '02 · Partager', title: 'Le coparent voit ce que vous choisissez de partager.', body: 'Relais de nuit, missions, agenda commun : chacun sait où en est l’autre.', screen: 'relais-nuit' },
      { kicker: '03 · Se faire aider', title: 'Aura et une communauté de parents.', body: 'Aura retrouve le bon outil. La communauté répond à « vous aussi ? ».', screen: 'c-fil-0' },
    ],
    probleme: 'Dix applications, des notes partout, rien n’est relié.', fonction: 'Accueil HOMI : grossesse, bébé, famille et communauté dans une seule app.',
    legende: 'Une app pour la grossesse, une pour les biberons, des notes dans le téléphone, un groupe de messages pour les rendez-vous… et la tête qui déborde.\n\nHOMI réunit tout au même endroit, de la grossesse aux 10 ans de votre enfant. Suivre, partager avec le coparent, se faire aider : glissez pour voir comment.',
    cta: 'Découvrez HOMI, lien en bio.', seo: ['application famille', 'application grossesse', 'suivi bébé', 'organisation familiale'], hashtags: [...H.base, '#organisationfamiliale', '#appparents', '#chargementale'],
    story: { haut: 'Toute votre vie familiale.', bas: 'Enfin réunie.' } },
  { n: 2, kind: 'produit', sujet: 'Charge mentale', accroche: 'Être maman ne devrait pas signifier penser à tout.', screen: 'i-charge', chips: ['Vider ma tête', 'Missions sans relances', 'Qui pense à quoi'],
    probleme: '« Pourquoi suis-je la seule à devoir penser à tout ? »', fonction: 'Répartition de la charge mentale, Vider ma tête, Missions.',
    legende: 'Le vaccin, le cadeau d’anniversaire, les couches, le rendez-vous chez le pédiatre… Penser à tout, c’est un travail invisible.\n\nAvec HOMI, vous videz votre tête en vrac, l’app range en tâches, et chacun voit qui pense à quoi. Les missions partent au coparent sans relances.',
    cta: 'Enregistrez ce post pour en parler à deux.', seo: ['charge mentale maman', 'partage des tâches couple', 'organisation famille'], hashtags: [...H.base, '#chargementale', '#mamanfatiguee', '#partagedestaches', '#egalitecouple'],
    story: { haut: 'Penser à tout,', bas: 'c’est aussi du travail.' }, reel: { voix: 'Être maman ne devrait pas signifier penser à tout. Videz votre tête : HOMI range en tâches, et chacun voit qui pense à quoi.', duree: 15 } },
  { n: 3, kind: 'emotion', sujet: 'Aura', accroche: 'Et si votre copilote connaissait votre quotidien ?', sous: 'Aura, l’assistante de HOMI.', robot: true,
    probleme: '« Je ne sais même plus où j’ai noté ça. »', fonction: 'Aura : retrouve le bon outil, note un biberon dicté, prépare le relais.',
    legende: '« Il vient de boire 150 ml. » « Prépare le relais de cette nuit. » Vous le dites, Aura s’en occupe dans HOMI.\n\nAura est une intelligence artificielle : elle ne remplace ni un médecin, ni une sage-femme.',
    cta: 'Dites bonjour à Aura, lien en bio.', seo: ['assistant parents', 'intelligence artificielle famille', 'aide jeune parent'], hashtags: [...H.base, '#aura', '#assistantfamilial', '#jeuneparent'],
    story: { haut: 'Vous le dites.', bas: 'Aura s’en occupe.' } },
  { n: 4, kind: 'education', sujet: 'Grossesse', accroche: 'Neuf mois qui changent toute une vie.', sous: '3 repères pour vivre sa grossesse sereinement.', art: 'grossesse',
    slides: [
      { kicker: '01 · Chaque semaine', title: 'Comprendre ce qui change, pour bébé et pour vous.', body: 'Les illustrations sont artistiques : ni une échographie, ni l’image de votre bébé.', screen: 'g-accueil-1' },
      { kicker: '02 · Vos rendez-vous', title: 'Consultations, échographies, questions à poser.', body: 'Le prochain rendez-vous et son compte à rebours, sans rien oublier.', screen: 'g-rdv' },
      { kicker: '03 · La préparation', title: 'Valise, projet de naissance, listes à deux.', body: 'Vous cochez chacun de votre côté, tout se met à jour.', screen: 'g-listes' },
    ],
    probleme: '« Je suis à combien de semaines, déjà ? Et qu’est-ce que je dois préparer ? »', fonction: 'Espace Grossesse : semaine par semaine, rendez-vous, listes et projet de naissance.',
    legende: 'Neuf mois, c’est à la fois long et très court. Entre les rendez-vous, la valise et les questions, on peut vite se sentir dépassée.\n\nDans l’espace Grossesse de HOMI : votre semaine, vos rendez-vous et votre préparation, au même endroit. Glissez pour les 3 repères.',
    cta: 'Enregistrez pour votre prochaine semaine.', seo: ['suivi grossesse semaine par semaine', 'valise maternité', 'projet de naissance'], hashtags: [...H.preg, ...H.base.slice(0, 1), '#valisematernite', '#projetdenaissance'],
    story: { haut: 'Neuf mois', bas: 'qui changent toute une vie.' } },
  { n: 5, kind: 'produit', sujet: 'Sommeil', accroche: 'Il est 3 h du matin. Encore.', screen: 'sommeil', dark: true, chips: ['Réveil noté en un geste', 'Mode nuit', 'Relais de nuit'],
    probleme: '« J’aimerais juste dormir une nuit entière. »', fonction: 'Sommeil de l’enfant (mode nuit), Relais de nuit.',
    legende: '3 h du matin, le téléphone en luminosité minimale, et une seule question : il a dormi combien de temps ?\n\nLe mode nuit de HOMI note un réveil en un geste, sans vous éblouir. Et le relais de nuit permet de dormir chacun son tour.',
    cta: 'Taguez la personne qui fait les nuits avec vous.', seo: ['sommeil bébé', 'réveils nocturnes bébé', 'nuits jeune parent'], hashtags: [...H.bebe, '#sommeilbebe', '#nuitsblanches', '#relaisdenuit'],
    story: { haut: 'Il est 3 h du matin.', bas: 'Encore.' }, reel: { voix: 'Il est trois heures du matin. Encore. Avec HOMI, un réveil se note en un geste, et le relais de nuit vous laisse dormir chacun votre tour.', duree: 15 } },
  { n: 6, kind: 'emotion', sujet: 'Communauté', accroche: 'Trouvez des parents qui vous comprennent.', sous: 'Groupes par étape, sous pseudonyme.', art: 'enfants',
    probleme: '« Suis-je la seule à vivre ça ? »', fonction: 'Communauté HOMI : groupes thématiques, publications, réponses.',
    legende: 'Il y a des questions qu’on n’ose pas poser à son entourage. Dans la communauté HOMI, des parents qui traversent la même étape vous répondent, sous pseudonyme.\n\nLes échanges entre parents ne remplacent pas un avis médical.',
    cta: 'Rejoignez votre groupe, lien en bio.', seo: ['communauté parents', 'forum maman', 'soutien jeune maman'], hashtags: [...H.base, '#communautéparents', '#entremamans', '#soutienparental'],
    story: { haut: 'Vous n’êtes pas seule.', bas: 'Trouvez votre village.' } },
  { n: 7, kind: 'education', sujet: 'Coparent', accroche: 'Vous êtes deux. Pourquoi tout repose sur vous ?', sous: '3 façons de partager vraiment.', art: 'projet-bebe',
    slides: [
      { kicker: '01 · Inviter', title: 'Un code à 6 chiffres, 30 secondes.', body: 'Le coparent rejoint votre foyer, même avant d’avoir créé son compte.', chips: ['Code valable 48 h', 'Usage unique'] },
      { kicker: '02 · Se relayer', title: 'Le relais de nuit, pour dormir chacun son tour.', body: 'Ce qui s’est passé, ce qui est prévu : tout est prêt pour celui qui prend le relais.', screen: 'relais-nuit' },
      { kicker: '03 · Demander sans relancer', title: 'Les missions : une demande, une réponse.', body: 'Acheter du lait avant 18 h ? Il accepte, c’est noté, pas de relance.', screen: 'i-missions' },
    ],
    probleme: '« Depuis qu’on est parents, c’est toujours moi qui gère. »', fonction: 'Invitation coparent (code 6 chiffres), Relais de nuit, Missions.',
    legende: 'Partager la charge, ce n’est pas « aider » : c’est savoir quoi faire sans qu’on ait à le demander.\n\nAvec HOMI, le coparent rejoint votre foyer en 30 secondes, voit ce que vous partagez, prend le relais la nuit et répond aux missions. Glissez pour les 3 étapes.',
    cta: 'Envoyez ce post à votre coparent.', seo: ['coparentalité', 'partage tâches parents', 'relais nuit bébé'], hashtags: [...H.base, '#coparentalite', '#papaimplique', '#chargementale'],
    story: { haut: 'Vous êtes deux.', bas: 'Partagez vraiment.' } },
  { n: 8, kind: 'produit', sujet: 'Biberon', accroche: 'Fini les « Il a bu combien ? »', screen: 'journee-biberons', robot: true, chips: ['Biberon enregistré — 150 ml', 'Vu par le coparent', 'Journée en un coup d’œil'],
    probleme: '« Il a bu combien ? À quelle heure ? »', fonction: 'Biberon : minuteur, journée des biberons, dictée à Aura.',
    legende: '« Il a bu combien ? » « Le dernier, c’était à quelle heure ? » La question qu’on se pose dix fois par jour.\n\nDans HOMI, le biberon se note en un geste, ou se dicte à Aura : « Il vient de boire 150 ml. » Le coparent le voit tout de suite.',
    cta: 'Enregistrez pour la prochaine nuit.', seo: ['suivi biberon', 'quantité biberon bébé', 'appli biberon'], hashtags: [...H.bebe, '#biberon', '#allaitementmixte', '#suivibebe'],
    story: { haut: 'Il a bu combien ?', bas: 'C’est noté.' }, reel: { voix: 'Fini les « il a bu combien ? ». Dites « il vient de boire cent cinquante millilitres », HOMI le note, et le coparent le voit aussitôt.', duree: 15 } },
  { n: 9, kind: 'emotion', sujet: 'Mon histoire', accroche: 'Il grandit. Son histoire aussi.', sous: 'Mon histoire, le livre de vie de votre enfant.', art: 'bebe',
    probleme: '« Je n’ai rien noté de ses premières fois. »', fonction: 'Mon histoire : chapitres de la grossesse aux 10 ans, photos et premières fois.',
    legende: 'Les premiers sourires, les premiers pas, le premier mot. On croit qu’on s’en souviendra toujours.\n\nMon histoire range chaque photo et chaque « première fois » dans le livre de vie de votre enfant, de la grossesse à ses 10 ans. Les photos restent privées.',
    cta: 'Commencez son histoire, lien en bio.', seo: ['album bébé', 'livre de naissance', 'souvenirs enfant'], hashtags: [...H.base, '#albumbebe', '#premierefois', '#souvenirsdenfance'],
    story: { haut: 'Il grandit.', bas: 'Son histoire aussi.' } },
  { n: 10, kind: 'education', sujet: 'Post-partum', accroche: 'Et si on prenait aussi soin de maman ?', sous: '3 rappels pour l’après-naissance.', art: 'cycle',
    slides: [
      { kicker: '01 · Ce que vous ressentez compte', title: 'Fatigue, larmes, joie : tout peut coexister.', body: 'Le dire, même en un mot, aide à y voir clair. Et à en parler à un professionnel.', chips: ['Je suis à bout de forces', 'J’ai besoin de repos'] },
      { kicker: '02 · Vous n’êtes pas seule', title: 'Un groupe Post-partum et bien-être de la mère.', body: 'Des mères qui traversent la même période, sous pseudonyme.', screen: 'c-fil-1' },
      { kicker: '03 · Demander de l’aide', title: 'En cas de détresse, appelez le 3114.', body: 'Urgence : 15 ou 112. Ces numéros sont aussi dans HOMI, à portée de main.', chips: ['3114', '15 · 112'] },
    ],
    probleme: '« Personne ne m’avait préparée au post-partum. »', fonction: 'Espace post-partum, groupe communautaire, numéros d’urgence dans l’app.',
    legende: 'On prépare la naissance pendant des mois. L’après, beaucoup moins. Fatigue, émotions en montagnes russes, corps qui change : c’est normal d’en parler.\n\nGlissez pour 3 rappels. Et si ça ne va pas : 3114 (prévention du suicide, 24 h/24), 15 ou 112 en urgence.',
    cta: 'Envoyez ce post à une maman qui vient d’accoucher.', seo: ['post-partum', 'baby blues', 'santé mentale maman'], hashtags: [...H.base, '#postpartum', '#quatriemetrimestre', '#santementalemaman'],
    story: { haut: 'Et si on prenait', bas: 'aussi soin de maman ?' } },
  { n: 11, kind: 'produit', sujet: 'Organisation', accroche: 'Une seule action. Tout se synchronise.', screen: 'journee-biberons', screen2: 'relais-nuit', chips: ['Camille a noté un biberon', 'À l’instant', 'Sur les deux téléphones'],
    probleme: '« Tu l’as noté où ? »', fonction: 'Synchronisation du foyer en temps réel.',
    legende: 'Vous notez un biberon, le coparent le voit. Il ajoute un rendez-vous, il apparaît chez vous. Plus de « tu l’as noté où ? ».\n\nHOMI synchronise le foyer en temps réel, et chacun choisit ce qu’il partage.',
    cta: 'Invitez votre coparent, lien en bio.', seo: ['application partagée couple', 'agenda familial partagé', 'organisation parents'], hashtags: [...H.base, '#organisationfamiliale', '#agendafamilial', '#coparentalite'],
    story: { haut: 'Une seule action.', bas: 'Tout se synchronise.' }, reel: { voix: 'Une seule action. Tout se synchronise. Vous notez un biberon, il apparaît aussitôt sur le téléphone du coparent.', duree: 15 } },
  { n: 12, kind: 'emotion', sujet: 'Couple', accroche: 'Vous êtes devenus parents. N’oubliez pas votre couple.', sous: 'Point de couple, Moments à deux, Se comprendre.', art: 'projet-bebe',
    probleme: '« Depuis qu’on est parents, on ne se parle plus pareil. »', fonction: 'Point de couple, Moments à deux, Se comprendre.',
    legende: 'Le bébé dort enfin, et vous parlez… des couches. C’est normal, et ça se travaille.\n\nDix minutes par semaine pour faire le point, une idée de moment à deux, des mots pour dire ce qu’on ressent : HOMI garde aussi une place pour votre couple.',
    cta: 'Envoyez ce post à votre moitié.', seo: ['couple après bébé', 'jeunes parents couple', 'communication couple'], hashtags: [...H.base, '#couple', '#couplejeunesparents', '#viedecouple'],
    story: { haut: 'Parents,', bas: 'et toujours un couple.' } },
  { n: 13, kind: 'education', sujet: 'TDAH', accroche: 'Comprendre avant de culpabiliser.', sous: 'TDAH : 3 pistes pour les parents.', art: 'enfants',
    slides: [
      { kicker: '01 · S’informer à la source', title: 'Des vidéos officielles, dans l’app.', body: 'Santé publique France, HAS, Assurance Maladie : « TDAH : un enfant turbulent ? », « Les difficultés des parents ».', screen: 'i-videos' },
      { kicker: '02 · Une journée à la fois', title: '3 choses aujourd’hui, pas plus.', body: 'Trois priorités et dix minutes pour démarrer : le reste attend.', screen: 'i-focus' },
      { kicker: '03 · Échanger', title: 'Un groupe Troubles neurodéveloppementaux.', body: 'TDAH, autisme, troubles dys : des parents qui vivent la même chose. Pas un avis médical.', chips: ['TDAH', 'Autisme', 'Troubles dys'] },
    ],
    probleme: '« Je me demande ce que j’ai raté. »', fonction: 'Vidéos officielles, 3 choses aujourd’hui, groupe Troubles neurodéveloppementaux.',
    legende: 'Un enfant TDAH n’est pas un enfant « mal élevé », et ses parents ne sont pas « trop laxistes ». Comprendre change le regard, y compris sur soi.\n\nGlissez pour 3 pistes. Seul un professionnel de santé peut poser un diagnostic.',
    cta: 'Enregistrez et partagez à un parent concerné.', seo: ['TDAH enfant', 'parent enfant TDAH', 'neurodéveloppement'], hashtags: [...H.base, '#tdah', '#tdahenfant', '#neurodiversite', '#parentalitebienveillante'],
    story: { haut: 'Comprendre', bas: 'avant de culpabiliser.' } },
  { n: 14, kind: 'produit', sujet: 'Préparation naissance', accroche: 'Bébé arrive. Préparez-vous ensemble.', screen: 'g-listes', chips: ['Valise de maternité', 'Projet de naissance', 'Coché à deux'],
    probleme: '« On n’a rien préparé et c’est dans 6 semaines. »', fonction: 'Listes de préparation (valise, affaires de bébé, démarches), Projet de naissance.',
    legende: 'Valise de maternité, affaires de bébé, démarches, projet de naissance : la liste s’allonge à l’approche du terme.\n\nDans HOMI, vous la préparez à deux, chacun coche de son côté, et vous voyez ce qu’il reste.',
    cta: 'Enregistrez pour votre valise.', seo: ['valise maternité liste', 'préparer arrivée bébé', 'liste naissance'], hashtags: [...H.preg, '#valisematernite', '#arriveebebe', '#troisiemetrimestre'],
    story: { haut: 'Bébé arrive.', bas: 'Préparez-vous ensemble.' }, reel: { voix: 'Bébé arrive. Préparez-vous ensemble. Valise, projet de naissance, listes : chacun coche de son côté, et vous voyez ce qu’il reste.', duree: 15 } },
  { n: 15, kind: 'emotion', sujet: 'Écosystème HOMI', accroche: 'De la grossesse à ses 10 ans.', sous: 'HOMI. La famille, autrement.', art: 'famille',
    probleme: '« On change d’app à chaque étape. »', fonction: 'HOMI accompagne la famille de la grossesse aux 10 ans.',
    legende: 'La grossesse, les premières nuits, les premiers pas, la rentrée, les 10 ans. Une seule app qui grandit avec votre famille.\n\nHOMI. La famille, autrement.',
    cta: 'Téléchargez HOMI, lien en bio.', seo: ['application famille', 'suivi enfant', 'grossesse bébé enfant'], hashtags: [...H.base, '#famille', '#grandirensemble', '#viedefamille'],
    story: { haut: 'De la grossesse', bas: 'à ses 10 ans.' } },
];

export const HIGHLIGHTS: { id: string; label: string; art?: string; robot?: boolean; preset?: string }[] = [
  { id: 'aura', label: 'Aura', robot: true }, { id: 'grossesse', label: 'Grossesse', art: 'foetus/sa-20.webp' }, { id: 'bebe', label: 'Bébé', art: 'art/bebe.webp' },
  { id: 'couple', label: 'Couple', art: 'art/projet-bebe.webp' }, { id: 'famille', label: 'Famille', art: 'art/foyer-maison.webp' }, { id: 'communaute', label: 'Communauté', preset: 'heart' },
  { id: 'souvenirs', label: 'Souvenirs', art: 'art/enfants.webp' }, { id: 'faq', label: 'FAQ', preset: 'star' },
];
/** Ordre d'affichage de la grille (plus récente en haut à gauche). */
export const GRID = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
