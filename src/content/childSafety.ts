/**
 * Repères de sécurité pour le suivi de l'enfant, issus de sources publiques vérifiées le 18 octobre 2026.
 * Ils disent QUAND demander un avis, jamais ce que l'enfant « a ».
 */
export interface SafetySource { title: string; publisher: string; url: string }

export const CHILD_SOURCES = {
  sleep: { title: 'Comment coucher votre bébé pour lui assurer confort et sécurité ?', publisher: 'mpedia (Association française de pédiatrie ambulatoire), relayé par Santé.fr', url: 'https://www.mpedia.fr/art-coucher-mon-bebe/' },
  stools: { title: 'Selles de bébé : tout comprendre pour mieux les surveiller', publisher: 'mpedia (AFPA), relayé par Santé.fr', url: 'https://www.sante.fr/selles-de-bebe-de-0-6-mois-decryptage-complet' },
  dehydration: { title: 'Déshydratation chez l’enfant', publisher: 'Le Manuel MSD (grand public)', url: 'https://www.msdmanuals.com/fr/accueil/les-faits-en-bref-problèmes-de-santé-infantiles/troubles-divers-chez-les-nourrissons-et-les-jeunes-enfants/déshydratation-chez-l-enfant' },
  fever: { title: 'Mon enfant a de la fièvre', publisher: 'ARS Normandie, d’après le carnet de santé (ministère de la Santé)', url: 'https://www.urml-normandie.org/wp-content/uploads/2023/11/A5-fievre-enfant.pdf' },
} satisfies Record<string, SafetySource>;

export const SAFE_SLEEP = [
  'Toujours sur le dos, pour la nuit comme pour les siestes — ni sur le ventre, ni sur le côté.',
  'Dans son propre lit, idéalement dans la chambre des parents les premiers mois. Le partage du lit est déconseillé, surtout avant 3 mois.',
  'Un matelas ferme aux dimensions du lit, un drap-housse bien ajusté.',
  'Rien dans le lit : ni couette, ni couverture, ni oreiller, ni tour de lit, ni coussin ou cocon.',
  'Une turbulette (gigoteuse) adaptée à sa taille, jusqu’à 2 ans.',
  'Une chambre entre 18 et 20 °C, sans trop le couvrir.',
  'Jamais de sommeil sur un canapé ou dans un lit d’adulte. Pas de tabac dans son entourage.',
];

export const DEHYDRATION_SIGNS = [
  'Moins de couches mouillées que d’habitude',
  'Bouche sèche, pleurs sans larmes',
  'Yeux ou fontanelle (le haut du crâne) qui semblent creusés',
  'Bébé inhabituellement endormi, mou ou moins réactif',
  'Incapable de garder les liquides',
];
