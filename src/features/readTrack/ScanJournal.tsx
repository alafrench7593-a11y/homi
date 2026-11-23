/**
 * Journal des scans (22/11/2026) : analyses regroupées par jour, heure en colonne fixe à gauche, pictogramme du type,
 * nom du produit, résultat TEL QU'IL A ÉTÉ LU (badge de l'analyse enregistrée, aucune réinterprétation), étoile de
 * favori et chevron vers la fiche. L'étoile et l'ouverture sont deux cibles séparées (jamais un bouton dans un bouton).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { Icon, ListGroup, Text } from '@/components/ui';
import { VerdictBadge } from '@/features/scanner/components';
import { formatDate, t as tr } from '@/i18n';
import { localHm, scanJournal } from '@/lib/domain/readTrack';
import type { ScanRow } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { StarToggle } from './ReadingMemory';
import { TABULAR } from '@/features/homeTrack/kit';

export function ScanJournal({ rows, favorites, onToggleFavorite, testID = 'scan-journal' }: {
  rows: ScanRow[]; favorites: Set<string>; onToggleFavorite: (id: string) => void; testID?: string;
}) {
  const days = scanJournal(rows);
  return (
    <View style={{ gap: spacing.md }} testID={testID}>
      {days.map((g) => (
        <ListGroup key={g.day} title={formatDate(`${g.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })} testID={`${testID}-${g.day}`}>
          {g.items.map((s, i) => <ScanJournalRow key={s.id} s={s} first={i === 0} favorite={favorites.has(s.id)} onToggleFavorite={() => onToggleFavorite(s.id)} />)}
        </ListGroup>
      ))}
    </View>
  );
}

function ScanJournalRow({ s, first, favorite, onToggleFavorite }: { s: ScanRow; first: boolean; favorite: boolean; onToggleFavorite: () => void }) {
  const t = useTheme();
  const name = s.product_snapshot?.name ?? tr('u6.sc.no_name');
  const time = localHm(s.analysed_at ?? s.created_at);
  const kind = s.kind === 'food' ? tr('u6.sc.food') : tr('u6.sc.product');
  const detail = [kind, s.product_snapshot?.brand, s.is_demo ? tr('u6.sc.demo_data') : null].filter(Boolean).join(' · ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, paddingRight: spacing.xs, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderColor: t.colors.border }} testID={`scan-row-${s.id}`}>
      <Tappable accessibilityRole="button" accessibilityLabel={`${time}, ${tr('u6.sc.see_result', { name })}`} testID={`scan-open-${s.id}`}
        onPress={() => router.push(`/scanner/result/${s.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, paddingVertical: 8 }}>
        <Text weight="bold" style={[{ width: 48 }, TABULAR]}>{time}</Text>
        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Icon name={s.kind === 'food' ? 'search' : 'maximize'} size={16} color={t.colors.text} />
        </View>
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text weight="medium" numberOfLines={2}>{name}</Text>
          {s.verdict ? <VerdictBadge verdict={s.verdict} small /> : <Text variant="caption" muted>{tr('scn.notAnalysed')}</Text>}
          <Text variant="caption" muted numberOfLines={1}>{detail}</Text>
        </View>
      </Tappable>
      <StarToggle active={favorite} title={name} onPress={onToggleFavorite} testID={`scan-fav-${s.id}`} />
      <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
    </View>
  );
}
