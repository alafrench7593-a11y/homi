/**
 * Icônes de la barre d'onglets (planche fournie par la propriétaire, 21/11/2026) : tuiles de verre lavande,
 * pictogrammes blancs sculptés. Aujourd'hui, Moi, Ajouter, Enfant, Famille.
 */
import type { ImageSourcePropType } from 'react-native';

export const TAB_IMAGES: Record<'today' | 'me' | 'add' | 'child' | 'family', ImageSourcePropType> = {
  today: require('../../assets/brand/tabs/today.png'),
  me: require('../../assets/brand/tabs/me.png'),
  add: require('../../assets/brand/tabs/add.png'),
  child: require('../../assets/brand/tabs/child.png'),
  family: require('../../assets/brand/tabs/family.png'),
};

/**
 * « Symbole allumé » de chaque icône (ticket 2) : la couleur de la lumière, limitée au SYMBOLE (masque calculé par
 * scripts/brand/tab-light-masks.py, aussi écrit en <nom>-mask.png), plus vive au cœur du dessin. Posé sur l'icône,
 * seule son opacité varie (src/brand/toolGlass/TabLight.tsx).
 */
export const TAB_LIT: Record<keyof typeof TAB_IMAGES, ImageSourcePropType> = {
  today: require('../../assets/brand/tabs/today-lit.png'),
  me: require('../../assets/brand/tabs/me-lit.png'),
  add: require('../../assets/brand/tabs/add-lit.png'),
  child: require('../../assets/brand/tabs/child-lit.png'),
  family: require('../../assets/brand/tabs/family-lit.png'),
};
