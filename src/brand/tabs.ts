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
