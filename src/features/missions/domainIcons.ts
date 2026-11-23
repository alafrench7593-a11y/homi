import type { DomainKey } from '@/lib/domain/mentalLoad';

/** Icône (MaterialCommunityIcons) de chaque domaine confiable : « Confier un domaine » et « Responsabilités ». */
export const DOMAIN_ICON: Record<DomainKey, string> = {
  health: 'stethoscope', school: 'school', activities: 'run', birthdays: 'cake-variant', shopping: 'cart', meals: 'silverware-fork-knife',
  laundry: 'washing-machine', admin: 'file-document-multiple', home: 'home-variant', holidays: 'bag-suitcase', clothes: 'tshirt-crew', nights: 'weather-night',
  baby: 'baby-face-outline', childcare: 'human-male-child', pets: 'paw',
};
