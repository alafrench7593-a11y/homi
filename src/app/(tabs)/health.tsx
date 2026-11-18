/**
 * Onglet « Moi » : cycle, santé et rendez-vous, humeur, bien-être, lectures et Questions.
 * Quand l'onglet voisin est « Grossesse » (grossesse en cours sans enfant), les outils de la grossesse y sont rangés :
 * ils ne sont pas répétés ici (une seule destination par outil).
 */
import React from 'react';
import { HubScreen } from '@/features/hubs/HubScreen';
import { childTabMode } from '@/features/hubs/hubMap';
import { useActivePregnancy, useTrackedChildren } from '@/lib/data/hooks';

export default function MeTab() {
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const mode = childTabMode({ children: children?.length ?? 0, pregnancy: !!pregnancy });
  return <HubScreen hub="health" excludeCategories={mode === 'pregnancy' ? ['pregnancy'] : undefined} />;
}
