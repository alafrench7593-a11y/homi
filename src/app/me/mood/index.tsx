/**
 * Bilan d'humeur (refonte v3 « Lightly », 13/11/2026) — privé (visible uniquement par vous), facultatif, sans score
 * ni diagnostic. Si les réponses évoquent une détresse, on propose doucement les numéros d'aide.
 *
 * Parcours : entrée → choisir une humeur (orbes de verre givré, la lumière se déplace vers le choix, les choix se
 * rapprochent) → la zone de saisie apparaît (ressentis, question de sécurité, note) → « Enregistrer : … » (bouton
 * principal pleine largeur, au-dessus du clavier, une seule soumission) → confirmation selon le résultat RÉEL
 * (enregistré / gardé hors ligne / erreur) → semaine (tuiles `DataTile`, comptes réels) et historique (surfaces
 * mates) → ouverture d'un bilan par transition carte → détail (`/me/mood/[id]`).
 * Point focal : la sélection active, puis le bouton principal une fois l'humeur choisie.
 */
import React, { useRef } from 'react';
import { View, type FlatList } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { DataTile } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Chip, Field, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { MoodSupportCard } from '@/features/mood/MoodSupportCard';
import { ComposerAction, EntryRow, feelingLabel, moodLabel, MoodOrbs, Reveal, SaveResult, SupportBanner } from '@/features/mood/MoodJournalUI';
import { FEELINGS, NOTE_MAX, weekSummary } from '@/features/mood/model';
import { useMoodCheckin } from '@/features/mood/useMoodJournal';
import { useMoods } from '@/lib/data/hooks';
import type { MoodCheckin } from '@/lib/types';
import { useMotion } from '@/motion/useMotion';
import { frequentValues, withFrequentFirst } from '@/lib/domain/quickPicks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { formatNumber, t as tr } from '@/i18n';

export default function MoodScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const moodsQ = useMoods(60);
  const moods = moodsQ.data;
  const c = useMoodCheckin();
  const motion = useMotion();
  const listRef = useRef<FlatList<MoodCheckin>>(null);
  // Après l'envoi, la confirmation (en haut) doit être visible : la liste y remonte (sans animation si Réduire les animations)
  const save = async () => {
    const out = await c.save();
    if (out) listRef.current?.scrollToOffset({ offset: 0, animated: !motion.off });
  };

  const loading = moodsQ.isLoading && !moods;
  const failed = moodsQ.isError && !moods;
  const week = weekSummary(moods);
  // Mes ressentis habituels (d'après MES bilans) en tête des choix
  const feelingOptions = withFrequentFirst([...FEELINGS], frequentValues((moods ?? []).flatMap((m) => m.feelings.map((f) => ({ value: f, at: m.checked_at }))), 4));
  const shownSupport = c.outcome && c.outcome.kind !== 'error' ? c.outcome.support : null;

  return (
    <Screen back title={tr('u8.mood.title')} subtitle={tr('u8.mood.subtitle')} scroll={false} padded={false}
      footer={<ComposerAction label={c.mood ? tr('u8.mood.saveNamed', { mood: moodLabel(c.mood) }) : tr('u8.mood.saveMain')} shortLabel={tr('common.save')} onPress={save} disabled={!c.mood} testID="mood-main-action" />}>
      <VirtualList
        ref={listRef}
        data={loading || failed ? [] : moods ?? []}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            {/* Résultat réel du dernier envoi : en tête, la liste y remonte après l'envoi */}
            {c.outcome ? (
              <SaveResult outcome={c.outcome} sentTitle={tr('mj.result.sentTitle')} testID="mood-result"
                onRetry={c.mood ? save : undefined} onNext={() => router.push('/me/diary')} nextLabel={tr('mj.toDiary')} />
            ) : null}
            {/* 1. Choisir : grande question légère, orbes posés sur la scène */}
            <View style={{ gap: spacing.sm }} testID="mood-composer">
              <Text style={{ fontFamily: typography.headingL.fontFamily, fontSize: typography.headingL.fontSize, lineHeight: typography.headingL.lineHeight, letterSpacing: typography.headingL.letterSpacing, color: t.colors.text }} maxFontSizeMultiplier={typography.headingL.maxScale} accessibilityRole="header">
                {week.today ? tr('mj.againQ') : tr('u8.mood.todayIs')}
              </Text>
              <MoodOrbs value={c.mood} onChange={c.setMood} label={tr('u8.mood.moodA11y')} hint={tr('mj.pickHint')} testIDPrefix="mood" />
              {c.error ? <Text variant="small" color={t.colors.danger} accessibilityLiveRegion="polite" testID="mood-error">{tr(c.error === 'mood' ? 'u8.mood.pick' : 'u8.mood.max')}</Text> : null}
            </View>

            {/* 2. Saisir : apparaît une fois l'humeur choisie */}
            {c.mood ? (
              <Reveal testID="mood-details">
                <MatteSurface padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
                  <Text weight="bold">{tr('u8.mood.present')} <Text variant="small" muted>{tr('u8.mood.optional')}</Text></Text>
                  <Row wrap>
                    {feelingOptions.map((f) => <Chip key={f} label={feelingLabel(f)} selected={c.feelings.includes(f)} onPress={() => c.toggleFeeling(f)} />)}
                  </Row>
                </MatteSurface>
                <Field label={tr('u8.mood.journal')} optional value={c.note} onChangeText={c.setNote} multiline maxLength={NOTE_MAX} placeholder={tr('u8.mood.journalPh')} style={{ minHeight: 110, textAlignVertical: 'top' }} testID="mood-note" />
                <MatteSurface padded={spacing.md} contentStyle={{ gap: 6 }}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <Text style={{ flex: 1 }}>{tr('u8.mood.safetyQ')}</Text>
                    <Toggle label={tr('u8.mood.safetyToggle')} value={c.safety} onChange={c.setSafety} />
                  </Row>
                  <Text variant="caption" muted>{tr('u8.mood.safetyNote')}</Text>
                </MatteSurface>
                {c.support ? <SupportBanner urgent={c.support === 'urgent'} testID="mood-support-now" /> : null}
              </Reveal>
            ) : null}

            {shownSupport ? <SupportBanner urgent={shownSupport === 'urgent'} testID="mood-support-after" /> : !c.mood ? <MoodSupportCard /> : null}

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
              <Icon name="lock" size={14} color={t.colors.textMuted} />
              <Text variant="caption" muted style={{ flex: 1 }}>{tr('u8.mood.banner')}</Text>
            </View>

            {/* 4. Ma semaine : comptes réels, micrographique seulement avec ≥ 2 jours notés */}
            {!loading && !failed ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DataTile style={{ flex: 1 }} testID="mood-week" icon="heart" label={tr('mj.week.checkins')}
                  value={week.count ? formatNumber(week.count) : null} context={tr('u8.mood.last7')} emptyText={tr('mj.week.none')}
                  series={week.real >= 2 ? week.series : undefined} trendLabel={week.real >= 2 ? tr('mj.week.trendA11y', { n: week.days }) : undefined} />
                <DataTile style={{ flex: 1 }} testID="mood-week-pages" icon="book-open" tint="accent2" label={tr('mj.week.pages')}
                  value={week.pages ? formatNumber(week.pages) : null} context={tr('u8.mood.last7')} emptyText={tr('mj.week.noPages')}
                  onPress={() => router.push('/me/diary')} />
              </View>
            ) : null}

            <SectionTitle title={tr('u8.mood.previous')} />
            {loading ? <Skeleton rows={2} /> : null}
            {failed ? <ErrorView error={moodsQ.error} onRetry={() => void moodsQ.refetch()} title={tr('u8.mood.listErr')} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : <EmptyState icon="heart" title={tr('u8.mood.none')} body={tr('u8.mood.noneBody')} />}
        renderItem={({ item: m }) => <EntryRow m={m} testID="mood-entry" onOpen={() => router.push({ pathname: '/me/mood/[id]', params: { id: m.id } })} />}
      />
    </Screen>
  );
}
