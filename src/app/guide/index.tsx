/**
 * « Guides pratiques » : l'entrée unique des fiches de lecture rangées par besoin (maladies, premiers secours,
 * sommeil, école, droits au travail…). Les guides proposés sont ceux du profil affiché ; chacun ouvre son écran
 * de lecture (`/guide/<sujet>`). Avant le 17/11/2026, chaque guide était un « outil » à part dans le catalogue.
 */
import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { ListGroup, ListRow } from '@/components/ui';
import { useScope } from '@/lib/data/hooks-scope';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { t as tr } from '@/i18n';

export default function GuidesIndex() {
  const scope = useScope();
  const guides = useMemo(() => toolCatalog(scope).find((x) => x.id === 'guides')?.subs ?? [], [scope]);
  return (
    <Screen back title={tr('th.gi.title')} subtitle={tr('th.gi.sub')}>
      {guides.length ? (
        <ListGroup testID="guides-list">
          {guides.map((g) => (
            <ListRow key={g.id} icon={g.icon} title={g.label} subtitle={g.hint} onPress={() => router.push(g.href as never)} testID={`guide-${g.id.split('.')[1]}`} />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="book-open" title={tr('th.gi.empty')} body={tr('th.gi.emptyB')} action={{ label: tr('th.gi.library'), onPress: () => router.push('/library' as never) }} />
      )}
    </Screen>
  );
}
