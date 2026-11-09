/**
 * Sommeil en sécurité : repères reformulés d'après des sources officielles françaises, datées.
 * Toujours gratuits. Aucune méthode d'endormissement n'est imposée ici.
 */
import type { ArticleSource } from './articles/library';
import { localized } from '@/i18n/localized';

export const SAFE_SLEEP_SOURCES: ArticleSource[] = [
  { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Le sommeil de bébé', url: 'https://www.sante.fr/node/1875883', consulted_on: '2026-10-21', published: '2024-12-05' },
  { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: '2026-10-20', published: '2024-10-10' },
];

/** Repères du couchage, reformulés (Santé.fr, publié le 5 décembre 2024). */
const SAFE_SLEEP_POINTS_FR: string[] = [
  'Pour chaque sommeil, nuit comme sieste : sur le dos, à plat, dans son propre lit.',
  'Un lit conforme aux exigences de sécurité, avec un matelas ferme adapté à sa taille et un drap housse.',
  'Une turbulette (gigoteuse) à sa taille plutôt qu’une couverture.',
  'Rien autour de lui : ni oreiller, ni coussin, ni couverture, ni tour de lit ; avant 6 mois, aucun objet mou qui pourrait couvrir son visage.',
  'Son lit dans la chambre des parents, au moins pendant les 6 premiers mois.',
  'Une chambre aérée chaque jour, autour de 18 à 20 °C, sans tabac.',
  'Ne pas le laisser s’endormir avec un biberon dans son lit.',
];

const SAFE_SLEEP_POINTS_EN: string[] = [
  'For every sleep, night-time and naps: on their back, flat, in their own bed.',
  'A cot that meets safety requirements, with a firm mattress that fits it and a fitted sheet.',
  'A baby sleeping bag in the right size rather than a blanket.',
  'Nothing around them: no pillow, cushion, blanket or cot bumper; before 6 months, no soft object that could cover their face.',
  'Their cot in the parents’ room, at least for the first 6 months.',
  'A room aired every day, at around 18 to 20 °C, smoke-free.',
  'Do not let them fall asleep with a bottle in their cot.',
];
const SAFE_SLEEP_POINTS_ES: string[] = [
  'En cada sueño, de noche y en la siesta: boca arriba, en plano, en su propia cuna.',
  'Una cuna que cumpla las normas de seguridad, con un colchón firme adaptado a su tamaño y una sábana bajera ajustable.',
  'Un saco de dormir de su talla en lugar de una manta.',
  'Nada a su alrededor: ni almohada, ni cojín, ni manta, ni chichonera; antes de los 6 meses, ningún objeto blando que pueda cubrirle la cara.',
  'Su cuna en la habitación de los padres, al menos durante los 6 primeros meses.',
  'Una habitación ventilada cada día, a unos 18 a 20 °C, sin humo de tabaco.',
  'No dejar que se duerma con un biberón en la cuna.',
];
const SAFE_SLEEP_POINTS_DE: string[] = [
  'Bei jedem Schlaf, nachts wie mittags: auf dem Rücken, flach, im eigenen Bett.',
  'Ein Bett, das den Sicherheitsanforderungen entspricht, mit einer festen, passenden Matratze und einem Spannbetttuch.',
  'Ein Schlafsack in seiner Größe statt einer Decke.',
  'Nichts um es herum: kein Kissen, keine Decke, kein Nestchen; vor 6 Monaten kein weicher Gegenstand, der sein Gesicht bedecken könnte.',
  'Sein Bett im Elternschlafzimmer, mindestens in den ersten 6 Monaten.',
  'Ein täglich gelüftetes Zimmer, etwa 18 bis 20 °C, rauchfrei.',
  'Es nicht mit einer Flasche im Bett einschlafen lassen.',
];
const SAFE_SLEEP_POINTS_IT: string[] = [
  'Per ogni sonno, di notte come per il pisolino: a pancia in su, in piano, nel suo lettino.',
  'Un lettino conforme alle norme di sicurezza, con un materasso rigido della misura giusta e un lenzuolo con angoli.',
  'Un sacco nanna della sua taglia al posto di una coperta.',
  'Niente intorno a lui: né cuscino, né guanciale, né coperta, né paracolpi; prima dei 6 mesi, nessun oggetto morbido che possa coprirgli il viso.',
  'Il suo lettino nella camera dei genitori, almeno per i primi 6 mesi.',
  'Una stanza aerata ogni giorno, intorno ai 18-20 °C, senza fumo.',
  'Non lasciarlo addormentare con il biberon nel lettino.',
];
export const SAFE_SLEEP_POINTS: string[] = localized(SAFE_SLEEP_POINTS_FR, SAFE_SLEEP_POINTS_EN, { es: SAFE_SLEEP_POINTS_ES, de: SAFE_SLEEP_POINTS_DE, it: SAFE_SLEEP_POINTS_IT });
