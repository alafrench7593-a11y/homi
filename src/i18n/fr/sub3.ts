/**
 * Page d'abonnement finalisée (17/11/2026) : promesse, comparatif en trois blocs (sans abonnement, Premium, en
 * famille), origine de l'abonnement, gestion. Chaque affirmation est reliée au code qui la rend vraie dans
 * src/features/premium/offerModel.ts (vérifié par src/__tests__/subscriptionPage.test.tsx) et dans ABONNEMENT.md § 0.2.
 * Aucun prix ni aucune durée d'essai ici : ils viennent de la boutique à l'exécution.
 */
export const sub3 = {
  'sub3.promise': 'Premium ouvre le suivi complet de ta famille : toi, tes enfants et la maison, dans une seule application.',
  'sub3.cmp.title': 'Ce qui change avec Premium',

  'sub3.free.title': 'Sans abonnement',
  'sub3.free.urgent': 'Urgences : numéros d’urgence, contraception d’urgence, « Je craque » et mode urgence du foyer.',
  'sub3.free.safety': 'Aide après la naissance, alertes officielles de rappel de produits, sources et références.',
  'sub3.free.account': 'Ton compte, ton profil, tes parcours et la présentation de HOMI.',
  'sub3.free.settings': 'Réglages : confidentialité, langue, notifications, foyer, synchronisation, abonnement.',
  'sub3.free.data': 'Export de toutes tes données et suppression du compte. Rien n’est effacé à la fin d’un abonnement.',
  'sub3.free.legal': 'Mentions légales et « Donner mon avis ».',
  'sub3.free.childcare': 'Espace nounou : inviter la nounou de tes enfants ou rejoindre une garde.',
  'sub3.free.rest': 'Les outils de suivi s’ouvrent avec Premium.',

  'sub3.prem.title': 'HOMI Premium',
  'sub3.prem.me.title': 'Pour moi',
  'sub3.prem.me.text': 'Cycle et contraception, projet bébé, grossesse semaine par semaine, post-partum, humeur et sommeil.',
  'sub3.prem.child.title': 'Pour mon enfant',
  'sub3.prem.child.text': 'Biberons, allaitement, couches, sommeil, diversification, étapes du développement, vaccins et traitements.',
  'sub3.prem.family.title': 'Pour ma famille',
  'sub3.prem.family.text': 'Tâches et routines du foyer, agenda familial, courses et stocks, relais de nuit, répartition de la charge mentale.',
  'sub3.prem.tools.title': 'Mes outils',
  'sub3.prem.tools.text': 'Repas et menus de la semaine, scanner de produits, documents de santé, rendez-vous, résumés, bibliothèque, communauté.',
  'sub3.prem.same': 'Les trois formules ouvrent exactement le même Premium.',

  'sub3.fam.title': 'En famille',
  'sub3.fam.adult': 'Un autre adulte de ton foyer profite du même Premium sans supplément : il n’a rien à acheter.',
  'sub3.fam.one': 'Un seul autre adulte par abonnement. Si tu as créé le foyer : le premier co-parent qui l’a rejoint. Si tu l’as rejoint : la personne qui l’a créé.',
  'sub3.fam.nanny': 'Une nounou invitée ouvre sans abonnement les écrans de garde (suivi du jour, biberons, sommeil, tâches, courses, agenda, documents partagés) et y note ce qu’elle fait pour ton foyer. Elle ne reçoit pas Premium pour ses propres outils.',

  'sub3.recommended': 'Formule conseillée : son prix ramené au mois est le plus bas.',
  'sub3.plan.current': 'ta formule actuelle',
  'sub3.manage.ios': 'Ouvre la page Abonnements de ton compte Apple.',
  'sub3.manage.android': 'Ouvre la page Abonnements de Google Play.',
  'sub3.continueFree': 'Continuer sans m’abonner',

  'sub3.origin.label': 'Origine',
  'sub3.origin.own': 'Achat personnel',
  'sub3.origin.shared': 'Partagé par {name}',
  'sub3.origin.sharedAnon': 'Partagé par l’autre adulte de ton foyer',
  'sub3.shared.note': 'Tu n’as rien à payer. Ton accès dure tant que cet abonnement est actif et que vous faites tous les deux partie du foyer. Les dates de facturation sont visibles par la personne abonnée.',
  'sub3.sub.included': 'Ce que comprend ton Premium',
};
