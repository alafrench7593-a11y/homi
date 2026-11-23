/**
 * Communauté — « Reprendre » (22/11/2026). App de LECTURE : ni frise ni courbe. Deux reprises, chacune affichée
 * seulement si la donnée existe : les publications enregistrées (favoris, `useSavedPosts`) et la dernière catégorie
 * lue (`community_topic_views`, date de la dernière lecture). La plateforme ne garde pas la position de lecture d'un
 * fil : « reprendre un fil » à l'endroit exact n'est donc pas proposé. Sans aucune des deux : rien n'est affiché.
 */
import React from 'react';
import { ListGroup, ListRow } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';

export function CommunityResume({ savedCount, last, onSaved, onLast }: {
  savedCount: number; last: { title: string; at: string } | null; onSaved: () => void; onLast: () => void;
}) {
  if (!savedCount && !last) return null;
  return (
    <ListGroup title={tr('rs.cm.title')} testID="rs-cm-resume">
      {savedCount ? <ListRow icon="bookmark" title={tr('rs.cm.saved')} subtitle={tr('rs.cm.savedCount', { count: savedCount })} onPress={onSaved} testID="rs-cm-saved" /> : null}
      {last ? <ListRow icon="book-open" title={tr('rs.cm.last', { title: last.title })} subtitle={tr('rs.cm.lastAt', { date: formatDate(last.at, { weekday: 'long', day: 'numeric', month: 'long' }) })} onPress={onLast} testID="rs-cm-last" /> : null}
    </ListGroup>
  );
}
