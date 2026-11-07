/**
 * Bilan d'humeur — privé (visible uniquement par vous), facultatif, sans score ni diagnostic.
 * Si les réponses évoquent une détresse, on propose doucement les numéros d'aide.
 */
import { insertOrQueue } from '@/lib/offline';
import { MoodSupportCard } from '@/features/mood/MoodSupportCard';
import { formatDate, t as tr, type TKey } from '@/i18n';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { MiniBars, TodaySummary } from '@/components/MiniApp';
import { frequentValues, withFrequentFirst } from '@/lib/domain/quickPicks';
import { EmergencyList } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useMoods } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { MoodCheckin } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const moodList = (): { value: MoodCheckin['mood']; label: string }[] => [
  { value: 1, label: tr('u8.mood.m1') },
  { value: 2, label: tr('u8.mood.m2') },
  { value: 3, label: tr('u8.mood.m3') },
  { value: 4, label: tr('u8.mood.m4') },
  { value: 5, label: tr('u8.mood.m5') },
];
const moodLabel = (m: number) => moodList().find((x) => x.value === m)?.label ?? '';

const FEELINGS = ['Fatigue', 'Inquiétude', 'Tristesse', 'Solitude', 'Irritabilité', 'Débordement', 'Désespoir', 'Calme', 'Joie', 'Fierté', 'Soutien', 'Tendresse'];
const HEAVY = ['Désespoir'];
/** Les valeurs enregistrées restent en français ; seul l'affichage est traduit. */
const FEELING_KEYS: Record<string, string> = { Fatigue: 'tired', Inquiétude: 'worry', Tristesse: 'sadness', Solitude: 'lonely', Irritabilité: 'irritable', Débordement: 'overwhelmed', Désespoir: 'despair', Calme: 'calm', Joie: 'joy', Fierté: 'pride', Soutien: 'supported', Tendresse: 'tenderness' };
const feelingLabel = (f: string) => (FEELING_KEYS[f] ? tr(`u8.mood.fl.${FEELING_KEYS[f]}` as TKey) : f);

function isDistress(mood: number | null, feelings: string[], safety: boolean) {
  return safety || mood === 1 || feelings.some((f) => HEAVY.includes(f));
}

function SupportBanner({ urgent }: { urgent: boolean }) {
  return (
    <Banner
      tone={urgent ? 'danger' : 'warning'}
      title={urgent ? tr('u8.mood.support.urgentTitle') : tr('u8.mood.support.softTitle')}
      action={
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          <EmergencyList compact />
          <Button label={tr('u8.mood.support.allHelp')} variant="secondary" size="sm" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start' }} />
        </View>
      }
    >
      <Text variant="small">
        {urgent
          ? tr('u8.mood.support.urgent')
          : tr('u8.mood.support.soft')}
      </Text>
    </Banner>
  );
}

export default function MoodScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const moodsQ = useMoods(60);
  const { data: moods } = moodsQ;
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodCheckin['mood'] | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [safety, setSafety] = useState(false);
  const [journal, setJournal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDistress, setSavedDistress] = useState<null | 'urgent' | 'soft'>(null);

  const distressNow = isDistress(mood, feelings, safety);

  function toggleFeeling(f: string) {
    setFeelings((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function save() {
    if (!mood) return setError(tr('u8.mood.pick'));
    if (journal.length > 6000) return setError(tr('u8.mood.max'));
    setError(null);
    setSaving(true);
    try {
      await insertOrQueue('mood_checkins', { user_id: userId, checked_at: new Date().toISOString(), mood, feelings, safety_concern: safety, journal: journal.trim() || null });
      inv('mood_checkins');
      const d = isDistress(mood, feelings, safety);
      setSavedDistress(d ? (safety || feelings.some((f) => HEAVY.includes(f)) ? 'urgent' : 'soft') : null);
      haptic('success');
      toast(tr('u8.mood.saved'));
      setMood(null);
      setFeelings([]);
      setSafety(false);
      setJournal('');
    } catch (e) {
      toast(friendlyError(e, tr('u8.mood.saveFail')), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u8.mood.delQ'), tr('u8.mood.final'), tr('u8.mood.delete')))) return;
    setRemovingId(id);
    try {
      await backend.remove('mood_checkins', [eq('id', id)]);
      inv('mood_checkins');
      toast(tr('u8.mood.deleted'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  const loading = moodsQ.isLoading && !moods;
  const lastMood = moods?.[0];
  const weekAgo = Date.now() - 7 * 86400_000;
  const weekCount = (moods ?? []).filter((m) => new Date(m.checked_at).getTime() >= weekAgo).length;
  const todayDone = !!lastMood && new Date(lastMood.checked_at).toDateString() === new Date().toDateString();
  const failed = moodsQ.isError && !moods;
  // Mes ressentis habituels (d'après MES bilans) en tête des choix ; tendance des 7 derniers jours
  const feelingOptions = withFrequentFirst(FEELINGS, frequentValues((moods ?? []).flatMap((m) => m.feelings.map((f) => ({ value: f, at: m.checked_at }))), 4));
  const days7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const trend = days7.map((d) => (moods ?? []).find((m) => new Date(m.checked_at).toDateString() === d.toDateString())?.mood ?? 0);

  return (
    <Screen back title={tr('u8.mood.title')} subtitle={tr('u8.mood.subtitle')} scroll={false} padded={false}
      action={{ label: mood ? tr('u8.mood.saveNamed', { mood: moodLabel(mood) }) : tr('u8.mood.saveMain'), icon: 'check', onPress: () => save(), disabled: saving, testID: 'mood-main-action' }}>
      <VirtualList
        data={loading || failed ? [] : moods ?? []}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info">{tr('u8.mood.banner')}</Banner>

            <TodaySummary title={tr('u8.mood.point')} items={[
              { icon: 'check-circle', value: todayDone ? tr('u8.mood.done') : '—', label: tr('u8.mood.today') },
              { icon: 'heart', value: lastMood ? moodLabel(lastMood.mood) : '—', label: tr('u8.mood.lastCheck') },
              { icon: 'calendar', value: String(weekCount), label: tr('u8.mood.last7') },
            ]} />

            {trend.some((x) => x > 0) ? <MiniBars values={trend} labels={days7.map((d) => formatDate(d, { weekday: 'short' }).replace('.', '').slice(0, 2).toLowerCase())} testID="mood-week" /> : null}
            {savedDistress ? <SupportBanner urgent={savedDistress === 'urgent'} /> : <MoodSupportCard />}

            <Card>
              <Text weight="bold">{tr('u8.mood.todayIs')}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={tr('u8.mood.moodA11y')} style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm }}>
                {moodList().map((m) => {
                  const sel = mood === m.value;
                  return (
                    <Tappable
                      key={m.value}
                      bare
                      accessibilityRole="radio"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={m.label}
                      onPress={() => { haptic('selection'); setMood(m.value); setSavedDistress(null); }}
                      style={({ pressed }) => ({
                        flex: 1, minHeight: 84, borderRadius: 18, borderWidth: 1.2, paddingHorizontal: 4, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6,
                        borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : pressed ? t.colors.surfaceAlt : t.colors.surface,
                      })}
                    >
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View key={i} style={{ width: 5, height: 5 + i * 2, borderRadius: 3, alignSelf: 'flex-end', backgroundColor: i <= m.value ? (sel ? t.colors.primaryText : t.colors.lavender) : t.colors.border }} />
                        ))}
                      </View>
                      <Text variant="caption" weight="medium" center numberOfLines={2} color={sel ? t.colors.primaryText : t.colors.text}>{m.label}</Text>
                    </Tappable>
                  );
                })}
              </View>
              {error ? <Text variant="small" color={t.colors.danger} style={{ marginTop: spacing.xs }}>{error}</Text> : null}
            </Card>

            <Card>
              <Text weight="bold">{tr('u8.mood.present')} <Text variant="small" muted>{tr('u8.mood.optional')}</Text></Text>
              <Row wrap style={{ marginTop: spacing.sm }}>
                {feelingOptions.map((f) => <Chip key={f} label={feelingLabel(f)} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />)}
              </Row>
            </Card>

            <Card tone="soft">
              <Row style={{ alignItems: 'flex-start' }}>
                <Text style={{ flex: 1 }}>{tr('u8.mood.safetyQ')}</Text>
                <Toggle label={tr('u8.mood.safetyToggle')} value={safety} onChange={(v) => { setSafety(v); setSavedDistress(null); }} />
              </Row>
              <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u8.mood.safetyNote')}</Text>
            </Card>

            {distressNow && !savedDistress && <SupportBanner urgent={safety || feelings.some((f) => HEAVY.includes(f))} />}

            <Field label={tr('u8.mood.journal')} optional value={journal} onChangeText={setJournal} multiline maxLength={6000} placeholder={tr('u8.mood.journalPh')} style={{ minHeight: 110, textAlignVertical: 'top' }} />
            <SectionTitle title={tr('u8.mood.previous')} />
            {loading ? <Skeleton rows={2} /> : null}
            {failed ? <ErrorView error={moodsQ.error} onRetry={() => void moodsQ.refetch()} title={tr('u8.mood.listErr')} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : <EmptyState icon="heart" title={tr('u8.mood.none')} body={tr('u8.mood.noneBody')} />}
        renderItem={({ item: m }) => (
          <Card style={{ paddingVertical: spacing.xs }}>
            <ListRow
              icon={m.safety_concern ? 'life-buoy' : 'heart'}
              title={`${formatDate(m.checked_at, { weekday: 'long', day: 'numeric', month: 'long' })} · ${moodLabel(m.mood)}`}
              subtitle={[m.feelings.map(feelingLabel).join(', '), m.journal ? (m.journal.length > 90 ? `${m.journal.slice(0, 90)}…` : m.journal) : null].filter(Boolean).join(' — ') || undefined}
              right={<Button label={tr('u8.mood.delete')} size="sm" variant="ghost" loading={removingId === m.id} onPress={() => remove(m.id)} accessibilityLabel={tr('u8.mood.delA11y', { date: formatDate(m.checked_at, {}) })} />}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
