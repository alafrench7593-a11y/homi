/**
 * Mon journal intime (refonte v3, 13/11/2026) — pages datées, humeur du jour, relecture et modification.
 * Les pages sont les bilans d'humeur qui portent un texte (table `mood_checkins`) : privées par construction
 * (visibles uniquement par leur autrice, jamais par le foyer), exportées et supprimées avec le compte.
 * Aucune page n'est générée ; aucun score, aucun diagnostic. Une humeur « très difficile » propose l'aide.
 *
 * Parcours : choisir l'humeur du jour (orbes, la lumière se déplace vers le choix) → la page s'ouvre (le champ
 * apparaît) → « Garder cette page » (bouton principal pleine largeur au-dessus du clavier, une seule soumission) →
 * confirmation selon le résultat RÉEL → la page rejoint « Mes pages » (surfaces mates, par mois) → ouverture par
 * transition carte → détail (`/me/mood/[id]`) ; « Modifier » depuis le détail revient ici (`?edit=<id>`).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Field, Icon, Text } from '@/components/ui';
import { capitalize, ComposerAction, EntryRow, MoodOrbs, SaveResult, SupportBanner } from '@/features/mood/MoodJournalUI';
import { Reveal } from '@/motion';
import { useDiaryPage } from '@/features/mood/useMoodJournal';
import { useMoods } from '@/lib/data/hooks';
import { diaryPages, groupByMonth } from '@/lib/domain/diary';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing, typography } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const ERR: Record<'empty' | 'mood' | 'long', TKey> = { empty: 'dy.errEmpty', mood: 'dy.errMood', long: 'dy.errLong' };
const editorial = { fontFamily: typography.editorial.fontFamily, fontSize: typography.editorial.fontSize, lineHeight: typography.editorial.lineHeight, letterSpacing: typography.editorial.letterSpacing };

export default function Diary() {
  const t = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const moodsQ = useMoods(200);
  const pages = useMemo(() => diaryPages(moodsQ.data), [moodsQ.data]);
  const months = useMemo(() => groupByMonth(pages), [pages]);
  const p = useDiaryPage();

  // Arrivée depuis le détail (« Modifier la page ») : la page s'ouvre en modification une seule fois
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!edit || handled.current === edit) return;
    const target = moodsQ.data?.find((x) => x.id === edit);
    if (!target) return;
    handled.current = edit;
    p.startEdit(target);
  }, [edit, moodsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const editing = p.editingId ? moodsQ.data?.find((x) => x.id === p.editingId) : undefined;
  const open = !!p.mood || !!p.text || !!p.editingId;
  const loading = moodsQ.isLoading && !moodsQ.data;
  const failed = moodsQ.isError && !moodsQ.data;
  const support = p.outcome && p.outcome.kind !== 'error' ? p.outcome.support : null;

  return (
    <Screen back title={tr('dy.title')} subtitle={tr('dy.subtitle')} tool={false}
      footer={(
        <View style={{ gap: spacing.xs }}>
          <ComposerAction label={tr(p.editingId ? 'dy.update' : 'dy.save')} icon="feather" onPress={p.save} disabled={!open} testID="diary-save" />
          {p.editingId ? <Button label={tr('dy.cancelEdit')} variant="ghost" full onPress={p.cancelEdit} testID="diary-cancel-edit" /> : null}
        </View>
      )}>
      <Text accessibilityRole="text" style={[editorial, { color: t.colors.text }]} maxFontSizeMultiplier={typography.editorial.maxScale}>{tr('dy.tagline')}</Text>

      {/* Composeur : humeur d'abord, puis la page s'ouvre */}
      <View testID="diary-composer" style={{ gap: spacing.sm }}>
        <Text style={{ fontFamily: fonts.serifItalic, fontSize: typography.editorialS.fontSize, lineHeight: typography.editorialS.lineHeight, color: t.colors.textMuted }}>
          {editing ? tr('dy.editing', { date: formatDate(editing.checked_at, { day: 'numeric', month: 'long' }) }) : capitalize(formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}
        </Text>
        <MoodOrbs value={p.mood} onChange={p.setMood} label={tr('dy.mood')} hint={tr('mj.diary.pickFirst')} testIDPrefix="diary-mood" />
        {open ? (
          <Reveal visible appear>
            <Field label={tr('dy.field')} value={p.text} onChangeText={p.setText} multiline maxLength={p.max} placeholder={tr('dy.placeholder')} style={{ minHeight: 140, textAlignVertical: 'top' }} testID="diary-text" />
          </Reveal>
        ) : null}
        {p.error ? <Text variant="small" color={t.colors.danger} accessibilityLiveRegion="polite" testID="diary-error">{tr(ERR[p.error])}</Text> : null}
      </View>

      {p.outcome ? <SaveResult outcome={p.outcome} sentTitle={tr(p.outcome.kind !== 'error' && p.outcome.id ? 'mj.diary.updatedTitle' : 'mj.diary.savedTitle')} sentBody={tr('mj.diary.sentBody')} onRetry={p.save} testID="diary-result" /> : null}
      {support ? <SupportBanner urgent={false} testID="diary-support" /> : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
        <Icon name="lock" size={14} color={t.colors.textMuted} />
        <Text variant="caption" muted style={{ flex: 1 }}>{tr('dy.private')}</Text>
      </View>

      {/* Mes pages : lecture sur surfaces mates, par mois */}
      {loading ? <Skeleton rows={3} /> : null}
      {failed ? <ErrorView error={moodsQ.error} onRetry={() => void moodsQ.refetch()} title={tr('dy.listErr')} /> : null}
      {!loading && !failed && !pages.length ? <EmptyState icon="book-open" title={tr('dy.none')} body={tr('dy.noneBody')} /> : null}

      {months.map((mo) => (
        <View key={mo.key} style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[editorial, { color: t.colors.text, marginTop: spacing.sm }]} maxFontSizeMultiplier={typography.editorial.maxScale}>{capitalize(formatDate(mo.pages[0].checked_at, { month: 'long', year: 'numeric' }))}</Text>
          {mo.pages.map((pg) => (
            <EntryRow key={pg.id} m={pg} testID="diary-page" onOpen={() => router.push({ pathname: '/me/mood/[id]', params: { id: pg.id } })} />
          ))}
        </View>
      ))}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
