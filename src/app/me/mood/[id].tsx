/**
 * Détail d'un bilan d'humeur / d'une page de journal (refonte v3, 13/11/2026) — privé, lecture sur surface MATE.
 *  - Arrivée par la transition carte → détail (`MorphTarget`, même identifiant que la ligne touchée) ; au retour, la
 *    surface revient vers la même ligne (re-mesurée). Réduire les animations : affichage immédiat.
 *  - Contenu : date, humeur (icône + libellé), ressentis, note (voix éditoriale), relais d'aide si une réponse
 *    inquiétante avait été notée.
 *  - Actions : modifier / écrire la page dans le journal (secondaire), supprimer (action sensible, confirmation) —
 *    le retour n'a lieu que si la suppression a RÉELLEMENT réussi.
 *  - États : chargement, introuvable (supprimé ailleurs), erreur de chargement.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SecondaryButton, SensitiveButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Chip, Icon, Row, Text } from '@/components/ui';
import { capitalize, feelingLabel, moodLabel, SupportBanner } from '@/features/mood/MoodJournalUI';
import { entryMorphId, MOOD_ICON } from '@/features/mood/model';
import { useRemoveCheckin } from '@/features/mood/useMoodJournal';
import { useMoods } from '@/lib/data/hooks';
import { MorphTarget } from '@/motion/Morph';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing, typography } from '@/theme/tokens';
import { formatDate, formatTime, t as tr } from '@/i18n';

export default function MoodEntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const q = useMoods(200);
  const m = q.data?.find((x) => x.id === id);
  const { remove, removing } = useRemoveCheckin();

  if (!m) {
    return (
      <Screen back title={tr('mj.detail.title')}>
        {q.isLoading ? <Skeleton kind="detail" />
          : q.isError ? <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('u8.mood.listErr')} />
            : <View testID="mood-detail-missing"><EmptyState icon="search" title={tr('mj.detail.notFound')} body={tr('mj.detail.notFoundBody')} action={{ label: tr('mj.detail.backList'), icon: 'arrow-left', onPress: () => router.replace('/me/mood') }} /></View>}
      </Screen>
    );
  }

  const d = new Date(m.checked_at);
  const hasPage = !!m.journal?.trim();

  return (
    <Screen back title={tr('mj.detail.title')} subtitle={tr('mj.detail.private')}>
      <MorphTarget id={entryMorphId(m.id)} testID="mood-detail" style={{ gap: spacing.md }}>
        <MatteSurface padded={spacing.lg} contentStyle={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: typography.editorial.fontSize, lineHeight: typography.editorial.lineHeight, color: t.colors.text }} maxFontSizeMultiplier={typography.editorial.maxScale} accessibilityRole="header">
              {capitalize(formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }))}
            </Text>
            <Text variant="small" muted>{tr('mj.detail.at', { time: formatTime(d) })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} testID="mood-detail-mood">
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.surfaces.frosted.fill, borderWidth: 1, borderColor: t.material.surfaces.frosted.edge }}>
              <Icon name={MOOD_ICON[m.mood]} size={20} color={t.colors.primary} />
            </View>
            <Text weight="bold" style={{ flex: 1 }}>{moodLabel(m.mood)}</Text>
          </View>
          {m.feelings.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text variant="small" weight="bold" muted>{tr('mj.detail.feelings')}</Text>
              <Row wrap>{m.feelings.map((f) => <Chip key={f} label={feelingLabel(f)} />)}</Row>
            </View>
          ) : null}
          <View style={{ gap: spacing.xs }}>
            <Text variant="small" weight="bold" muted>{tr('mj.detail.note')}</Text>
            {hasPage
              ? <Text testID="mood-detail-text" selectable style={{ fontFamily: fonts.serifItalic, fontSize: typography.bodyL.fontSize, lineHeight: typography.bodyL.lineHeight + 2, color: t.colors.text }}>{m.journal}</Text>
              : <Text variant="small" muted>{tr('mj.detail.noNote')}</Text>}
          </View>
        </MatteSurface>

        {m.safety_concern || m.mood === 1 ? <SupportBanner urgent={m.safety_concern} /> : null}

        <View style={{ gap: spacing.sm }}>
          <SecondaryButton label={tr(hasPage ? 'mj.detail.editPage' : 'mj.detail.addPage')} icon="feather" full
            onPress={() => router.push({ pathname: '/me/diary', params: { edit: m.id } })} testID="mood-detail-edit" />
          {/* action sensible en retrait : le point focal reste la lecture */}
          <SensitiveButton label={tr('mj.detail.delete')} icon="trash-2" size="sm" style={{ alignSelf: 'center', marginTop: spacing.sm }} loading={removing === m.id}
            confirmTitle={tr('u8.mood.delQ')} confirmMessage={tr('u8.mood.final')} confirmLabel={tr('u8.mood.delete')}
            onPress={async () => { if (await remove(m.id, tr('u8.mood.deleted'))) { if (router.canGoBack()) router.back(); else router.replace('/me/mood'); } }} testID="mood-detail-delete" />
        </View>
      </MorphTarget>
    </Screen>
  );
}
