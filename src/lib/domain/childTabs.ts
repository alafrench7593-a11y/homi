/** Onglets de la fiche enfant (dont « Besoins particuliers » : neurodéveloppement, traitements prescrits). */
import type { IconName } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';

export type ChildTab = 'apercu' | 'croissance' | 'etapes' | 'sante' | 'alimentation' | 'besoins';
const TABS: { value: ChildTab; key: TKey; icon: IconName }[] = [
  { value: 'apercu', key: 'u7.childTab.apercu', icon: 'sun' },
  { value: 'croissance', key: 'u7.childTab.croissance', icon: 'trending-up' },
  { value: 'etapes', key: 'u7.childTab.etapes', icon: 'star' },
  { value: 'sante', key: 'u7.childTab.sante', icon: 'heart' },
  { value: 'alimentation', key: 'u7.childTab.alimentation', icon: 'feather' },
  { value: 'besoins', key: 'u7.childTab.besoins', icon: 'compass' },
];
/** D-04 (QA) : libellés lus dans la langue en cours à chaque accès. */
export const CHILD_TABS: { value: ChildTab; readonly label: string; icon: IconName }[] = TABS.map((tab) => ({
  value: tab.value, icon: tab.icon, get label() { return tr(tab.key); },
}));
