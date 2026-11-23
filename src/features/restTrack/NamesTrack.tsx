/**
 * Prénoms — liste partagée gardés / écartés (22/11/2026). Même table que les favoris (`name_favorites`) : un prénom
 * écarté reste dans la liste du foyer (rangé à part, `list_label` = « Ecartes »), il n'est pas supprimé ; les votes
 * sont ceux de « Nos prénoms » (`name_votes`), comptés pour / contre, sans score ni classement par personne.
 *  · `NamesHero` : nombre de prénoms gardés en grand, gardés / écartés / proposés par moi ; liste choisie gardée dans
 *    l'adresse (« ?list=aside ») ;
 *  · `NameFixTray` : fiche d'un prénom (qui l'a proposé, quand, votes) ; « Corriger » l'orthographe ou le ranger
 *    (gardé / écarté) — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture échoue.
 */
import React from 'react';
import { View } from 'react-native';
import { GlassSegmentedControl } from '@/components/glass';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isSetAside, NAME_KEPT, NAME_SET_ASIDE, nameFixError, type NameFavLike } from '@/lib/domain/restTrack';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero } from '@/features/homeTrack/kit';

export type NameList = 'kept' | 'aside';

export function NamesHero({ kept, aside, mine, list, onList }: { kept: number; aside: number; mine: number; list: NameList; onList: (l: NameList) => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <HmHero testID="rs-names-hero" value={kept ? String(kept) : null} unit={tr('rs.names.unit', { count: kept })} emptyLabel={tr('rs.names.none')}
        split={[
          { label: tr('rs.names.kept'), value: String(kept), testID: 'rs-names-kept' },
          { label: tr('rs.names.aside'), value: String(aside), testID: 'rs-names-aside' },
          { label: tr('rs.names.mine'), value: String(mine), testID: 'rs-names-mine' },
        ]} />
      <GlassSegmentedControl<NameList> testID="rs-names-list" label={tr('rs.names.listA11y')} value={list} onChange={onList}
        options={[{ value: 'kept', label: tr('rs.names.keptCount', { count: kept }) }, { value: 'aside', label: tr('rs.names.asideCount', { count: aside }) }]} />
    </View>
  );
}

export function NameFixTray({ fav, favorites, pro, con, proposedBy, onClose }: {
  fav: NameFavLike | null; favorites: readonly NameFavLike[]; pro: number; con: number; proposedBy: string; onClose: () => void;
}) {
  const inv = useInvalidate();
  if (!fav) return null;
  const aside = isSetAside(fav);
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="rs-name-tray" title={aside ? tr('rs.names.asideOne') : tr('rs.names.keptOne')} hero={fav.name}
      lines={[
        tr('rs.names.proposed', { who: proposedBy, date: formatDate(fav.created_at, { day: 'numeric', month: 'long', year: 'numeric' }) }),
        pro || con ? tr('rs.names.votes', { pro, con }) : tr('rs.names.noVotes'),
      ]}
      editTitle={tr('rs.names.fixTitle', { name: fav.name })}
      fields={[
        { key: 'name', label: tr('rs.names.spelling'), kind: 'text', maxLength: 40 },
        { key: 'list', label: tr('rs.names.where'), kind: 'choice', options: [tr('rs.names.kept'), tr('rs.names.aside')] },
      ]}
      initial={{ name: fav.name, list: aside ? '1' : '0' }}
      validate={(d) => {
        const err = nameFixError(d.name, d.list === '1' ? NAME_SET_ASIDE : NAME_KEPT, fav.id, favorites);
        return err ? tr(`rs.names.err.${err}` as TKey) : null;
      }}
      onSave={async (d) => {
        const list = d.list === '1' ? NAME_SET_ASIDE : NAME_KEPT;
        const err = nameFixError(d.name, list, fav.id, favorites);
        if (err) return tr(`rs.names.err.${err}` as TKey);
        const patch: Record<string, unknown> = {};
        if (d.name.trim() !== fav.name) patch.name = d.name.trim();
        if (list !== fav.list_label) patch.list_label = list;
        if (!Object.keys(patch).length) return 'ok';
        try {
          // garde : rien n'est écrasé si le prénom a changé entre-temps (le brouillon reste, avec le message)
          const res = await backend.update('name_favorites', patch, [eq('id', fav.id), eq('name', fav.name), eq('list_label', fav.list_label)]);
          inv('name_favorites');
          return Array.isArray(res) && res.length === 0 ? tr('rs.changedMeanwhile') : 'ok';
        } catch (e) { return friendlyError(e); }
      }} />
  );
}
