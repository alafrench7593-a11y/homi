/** Onglets de la fiche enfant (dont « Besoins particuliers » : neurodéveloppement, traitements prescrits). */
import type { IconName } from '@/components/ui';

export type ChildTab = 'apercu' | 'croissance' | 'etapes' | 'sante' | 'alimentation' | 'besoins';
export const CHILD_TABS: { value: ChildTab; label: string; icon: IconName }[] = [
  { value: 'apercu', label: 'Aperçu', icon: 'sun' },
  { value: 'croissance', label: 'Croissance', icon: 'trending-up' },
  { value: 'etapes', label: 'Étapes', icon: 'star' },
  { value: 'sante', label: 'Santé', icon: 'heart' },
  { value: 'alimentation', label: 'Alimentation', icon: 'feather' },
  { value: 'besoins', label: 'Besoins particuliers', icon: 'compass' },
];
