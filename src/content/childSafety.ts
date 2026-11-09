/**
 * Repères de sécurité pour le suivi de l'enfant, issus de sources publiques vérifiées le 18 octobre 2026.
 * Ils disent QUAND demander un avis, jamais ce que l'enfant « a ».
 */
import { localized } from '@/i18n/localized';

export interface SafetySource { title: string; publisher: string; url: string }

export const CHILD_SOURCES = {
  sleep: { title: 'Comment coucher votre bébé pour lui assurer confort et sécurité ?', publisher: 'mpedia (Association française de pédiatrie ambulatoire), relayé par Santé.fr', url: 'https://www.mpedia.fr/art-coucher-mon-bebe/' },
  stools: { title: 'Selles de bébé : tout comprendre pour mieux les surveiller', publisher: 'mpedia (AFPA), relayé par Santé.fr', url: 'https://www.sante.fr/selles-de-bebe-de-0-6-mois-decryptage-complet' },
  dehydration: { title: 'Déshydratation chez l’enfant', publisher: 'Le Manuel MSD (grand public)', url: 'https://www.msdmanuals.com/fr/accueil/les-faits-en-bref-problèmes-de-santé-infantiles/troubles-divers-chez-les-nourrissons-et-les-jeunes-enfants/déshydratation-chez-l-enfant' },
  fever: { title: 'Mon enfant a de la fièvre', publisher: 'ARS Normandie, d’après le carnet de santé (ministère de la Santé)', url: 'https://www.urml-normandie.org/wp-content/uploads/2023/11/A5-fievre-enfant.pdf' },
} satisfies Record<string, SafetySource>;

const SAFE_SLEEP_FR = [
  'Toujours sur le dos, pour la nuit comme pour les siestes — ni sur le ventre, ni sur le côté.',
  'Dans son propre lit, idéalement dans la chambre des parents les premiers mois. Le partage du lit est déconseillé, surtout avant 3 mois.',
  'Un matelas ferme aux dimensions du lit, un drap-housse bien ajusté.',
  'Rien dans le lit : ni couette, ni couverture, ni oreiller, ni tour de lit, ni coussin ou cocon.',
  'Une turbulette (gigoteuse) adaptée à sa taille, jusqu’à 2 ans.',
  'Une chambre entre 18 et 20 °C, sans trop le couvrir.',
  'Jamais de sommeil sur un canapé ou dans un lit d’adulte. Pas de tabac dans son entourage.',
];

const DEHYDRATION_SIGNS_FR = [
  'Moins de couches mouillées que d’habitude',
  'Bouche sèche, pleurs sans larmes',
  'Yeux ou fontanelle (le haut du crâne) qui semblent creusés',
  'Bébé inhabituellement endormi, mou ou moins réactif',
  'Incapable de garder les liquides',
];

const SAFE_SLEEP_EN = [
  'Always on the back, for night sleep and naps alike — not on the tummy, not on the side.',
  'In their own cot, ideally in the parents’ room for the first months. Bed-sharing is not recommended, especially before 3 months.',
  'A firm mattress that fits the cot, with a well-fitted fitted sheet.',
  'Nothing in the cot: no duvet, no blanket, no pillow, no bumper, no cushion or nest.',
  'A baby sleeping bag suited to their size, up to 2 years.',
  'A room between 18 and 20 °C, without overdressing them.',
  'Never sleeping on a sofa or in an adult bed. No smoking around them.',
];

const DEHYDRATION_SIGNS_EN = [
  'Fewer wet nappies than usual',
  'Dry mouth, crying without tears',
  'Eyes or fontanelle (the soft spot on top of the head) that look sunken',
  'Baby unusually sleepy, floppy or less responsive',
  'Unable to keep fluids down',
];

const SAFE_SLEEP_ES = [
  'Siempre boca arriba, tanto por la noche como en las siestas: ni boca abajo ni de lado.',
  'En su propia cuna, idealmente en la habitación de los padres los primeros meses. No se recomienda compartir la cama, sobre todo antes de los 3 meses.',
  'Un colchón firme del tamaño de la cuna y una sábana bajera bien ajustada.',
  'Nada en la cuna: ni edredón, ni manta, ni almohada, ni protector de cuna, ni cojín o nido.',
  'Un saco de dormir adaptado a su talla, hasta los 2 años.',
  'Una habitación entre 18 y 20 °C, sin abrigarlo demasiado.',
  'Nunca dormir en un sofá ni en una cama de adulto. Nada de tabaco a su alrededor.',
];

const DEHYDRATION_SIGNS_ES = [
  'Menos pañales mojados de lo habitual',
  'Boca seca, llanto sin lágrimas',
  'Ojos o fontanela (la parte blanda de arriba de la cabeza) que parecen hundidos',
  'Bebé inusualmente adormilado, flojo o menos reactivo',
  'Incapaz de retener los líquidos',
];

const SAFE_SLEEP_DE = [
  'Immer auf dem Rücken, nachts wie beim Tagschlaf – weder auf dem Bauch noch auf der Seite.',
  'Im eigenen Bettchen, in den ersten Monaten idealerweise im Schlafzimmer der Eltern. Vom gemeinsamen Schlafen im Elternbett wird abgeraten, besonders vor 3 Monaten.',
  'Eine feste Matratze in der passenden Größe und ein gut sitzendes Spannbettlaken.',
  'Nichts im Bett: keine Bettdecke, keine Wolldecke, kein Kissen, kein Nestchen, kein Polster oder Babynest.',
  'Ein Schlafsack in passender Größe, bis 2 Jahre.',
  'Eine Raumtemperatur zwischen 18 und 20 °C, ohne es zu warm anzuziehen.',
  'Niemals auf einem Sofa oder in einem Erwachsenenbett schlafen lassen. Kein Rauchen in seiner Umgebung.',
];

const DEHYDRATION_SIGNS_DE = [
  'Weniger nasse Windeln als sonst',
  'Trockener Mund, Weinen ohne Tränen',
  'Augen oder Fontanelle (die weiche Stelle oben am Kopf), die eingesunken wirken',
  'Baby ungewöhnlich schläfrig, schlaff oder weniger reaktionsfreudig',
  'Kann keine Flüssigkeit bei sich behalten',
];

const SAFE_SLEEP_IT = [
  'Sempre a pancia in su, di notte come durante i pisolini: né a pancia in giù né su un fianco.',
  'Nel suo lettino, idealmente nella camera dei genitori nei primi mesi. Dormire nel lettone è sconsigliato, soprattutto prima dei 3 mesi.',
  'Un materasso rigido delle dimensioni del lettino e un lenzuolo con angoli ben aderente.',
  'Niente nel lettino: né piumone, né coperta, né cuscino, né paracolpi, né cuscini o nidi.',
  'Un sacco nanna adatto alla sua taglia, fino ai 2 anni.',
  'Una camera tra 18 e 20 °C, senza coprirlo troppo.',
  'Mai dormire su un divano o in un letto da adulti. Niente fumo intorno a lui.',
];

const DEHYDRATION_SIGNS_IT = [
  'Meno pannolini bagnati del solito',
  'Bocca secca, pianto senza lacrime',
  'Occhi o fontanella (la parte morbida in cima alla testa) che sembrano infossati',
  'Bebè insolitamente assonnato, molle o meno reattivo',
  'Incapace di trattenere i liquidi',
];

export const SAFE_SLEEP = localized(SAFE_SLEEP_FR, SAFE_SLEEP_EN, { es: SAFE_SLEEP_ES, de: SAFE_SLEEP_DE, it: SAFE_SLEEP_IT });
export const DEHYDRATION_SIGNS = localized(DEHYDRATION_SIGNS_FR, DEHYDRATION_SIGNS_EN, { es: DEHYDRATION_SIGNS_ES, de: DEHYDRATION_SIGNS_DE, it: DEHYDRATION_SIGNS_IT });
