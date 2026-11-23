/**
 * Plaques de verre dépoli des logos d'outils (fournies par la propriétaire, 21/11/2026) : une par catégorie du
 * catalogue, 256 px (assets/brand/tool-glass/glass, script scripts/da/tool-glass-import.cjs). L'urgence reprend la
 * plaque Santé et Aura la plaque Compte (sa lumière bleu nuit fait la différence).
 */
import type { ImageSourcePropType } from 'react-native';
import type { LogoCategory } from '@/theme/toolLogo';

export const GLASS_PLATES: Record<Exclude<LogoCategory, 'urgent' | 'aura'>, ImageSourcePropType> = {
  feeding: require('../../../assets/brand/tool-glass/glass/feeding.png'),
  sleep: require('../../../assets/brand/tool-glass/glass/sleep.png'),
  care: require('../../../assets/brand/tool-glass/glass/care.png'),
  health: require('../../../assets/brand/tool-glass/glass/health.png'),
  cycle: require('../../../assets/brand/tool-glass/glass/cycle.png'),
  pregnancy: require('../../../assets/brand/tool-glass/glass/pregnancy.png'),
  school: require('../../../assets/brand/tool-glass/glass/school.png'),
  couple: require('../../../assets/brand/tool-glass/glass/couple.png'),
  family: require('../../../assets/brand/tool-glass/glass/family.png'),
  community: require('../../../assets/brand/tool-glass/glass/community.png'),
  account: require('../../../assets/brand/tool-glass/glass/account.png'),
};

/** Plaque d'une catégorie de logo. */
export function glassPlate(category: LogoCategory): ImageSourcePropType {
  if (category === 'urgent') return GLASS_PLATES.health;
  if (category === 'aura') return GLASS_PLATES.account;
  return GLASS_PLATES[category];
}
