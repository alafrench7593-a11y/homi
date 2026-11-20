/**
 * Libellés de la galerie des pictogrammes (/dev/icons) — écran de QA réservé au mode développeur et à la
 * démonstration. Textes de QA en français uniquement (ce ne sont pas des textes de l'application).
 */
import type { HomiIconName } from '@/brand/icons';
import type { PaletteName } from '@/theme/tokens';

export const I = {
  title: 'Pictogrammes HOMI',
  lead: 'Grille 24 · trait 1,75 arrondi · deux tons (encre + aplat de catégorie) · inactif / actif',
  back: 'Retour',
  light: 'Clair',
  dark: 'Sombre',
  inactive: 'inactif',
  active: 'actif',
  hand: 'Main de la visite guidée',
  tools: 'Outils',
  none: 'aucun',
  groups: { tabs: 'Barre du bas', header: 'En-tête', categories: '9 catégories', intro: 'Outils de l’introduction' } as const,
  palettes: { homi: 'HOMI', lavande: 'Lavande', nuit: 'Nuit', sauge: 'Sauge', champagne: 'Champagne' } as Record<PaletteName, string>,
  names: {
    today: 'Aujourd’hui', me: 'Moi', child: 'Enfant', pregnancy: 'Grossesse', family: 'Famille', add: 'Ajouter',
    community: 'Communauté', notifications: 'Notifications', emergency: 'Urgences', account: 'Compte',
    feeding: 'Alimentation', sleep: 'Sommeil', care: 'Soins', health: 'Santé', cycle: 'Cycle', school: 'École', couple: 'Couple',
    tools: 'Mes outils', timer: 'Minuteur', notebook: 'Carnet', next: 'Prochaine action',
  } as Partial<Record<HomiIconName, string>>,
};
