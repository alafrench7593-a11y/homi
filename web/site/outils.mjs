/** Outils gratuits du site : utiles sans HOMI, calcul 100 % local (rien n'est envoyé), passerelle naturelle vers l'app. */
export const DOMAIN_LABELS = { health: 'Santé et rendez-vous médicaux', school: 'École, crèche et devoirs', activities: 'Activités des enfants', birthdays: 'Anniversaires et cadeaux',
  shopping: 'Courses', meals: 'Repas et menus', laundry: 'Linge', admin: 'Papiers et démarches', home: 'Ménage et maison', holidays: 'Vacances et valises',
  clothes: 'Vêtements des enfants', nights: 'Nuits et réveils', baby: 'Soins du bébé', childcare: 'Garde et nounou', pets: 'Animaux' };
export const OUTILS = [
  { slug: 'checklist-naissance', name: 'Checklist naissance', title: 'Checklist naissance : valise de maternité, affaires de bébé, démarches | HOMI',
    desc: 'Checklist gratuite pour préparer la naissance : valise de maternité, affaires de bébé, logement, démarches et achats. Cochez, imprimez ; rien n’est envoyé.',
    h1: 'Checklist naissance', lead: 'Valise de maternité, affaires de bébé, démarches : tout ce qu’il faut préparer, à cocher au fil des semaines. Vos coches restent sur cet appareil.',
    kind: 'checklist', lists: ['maternity_bag', 'baby_items', 'admin', 'home', 'purchases', 'coparent', 'siblings', 'multiples'], optional: ['siblings', 'multiples'],
    homi: ['application-grossesse', 'Dans HOMI, ces listes se cochent depuis le téléphone, à côté du suivi de grossesse.'],
    faq: [['Quand préparer la valise de maternité ?', 'Beaucoup de maternités conseillent qu’elle soit prête quelques semaines avant le terme ; suivez les consignes de votre maternité, qui fournit souvent sa propre liste.'],
      ['Mes coches sont-elles enregistrées ?', 'Uniquement dans ce navigateur, sur cet appareil. Rien n’est envoyé à HOMI ni à un tiers.']] },
  { slug: 'repartition-charge-mentale', name: 'Test de répartition de la charge mentale', title: 'Test de répartition de la charge mentale du couple | HOMI',
    desc: 'Questionnaire gratuit : pour 15 domaines du foyer, qui y pense et qui le fait ? Obtenez votre répartition en deux minutes. Calcul local, rien n’est envoyé.',
    h1: 'Qui pense à quoi à la maison ?', lead: 'Pour chaque domaine du foyer, indiquez qui y pense (anticiper, se souvenir, prévoir) et qui le fait. Le résultat s’affiche tout de suite, sans inscription.',
    kind: 'mentalload',
    homi: ['application-charge-mentale-couple', 'Dans HOMI, la répartition se suit dans le temps et un domaine entier peut être confié à l’autre parent.'],
    faq: [['Qu’est-ce que la charge mentale ?', 'C’est le travail invisible d’anticiper, de planifier et de se souvenir de ce qu’il faut faire pour le foyer, en plus de le faire.'],
      ['Mes réponses sont-elles enregistrées ?', 'Non : le calcul se fait dans votre navigateur et rien n’est envoyé. Les réponses disparaissent quand vous quittez la page.']] },
];
