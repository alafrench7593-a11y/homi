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
export const SAFE_SLEEP_POINTS: string[] = localized(SAFE_SLEEP_POINTS_FR, SAFE_SLEEP_POINTS_EN);
