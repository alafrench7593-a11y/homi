/**
 * Humeur et bien-être de l'enfant : un journal descriptif (pleurs, énergie, appétit, sommeil,
 * confort digestif, événements inhabituels). Aucune conclusion médicale à partir d'un comportement.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { HistoryHeader, TodaySummary } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, haptic, Icon, ListRow, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { useTheme } from '@/theme/ThemeProvider';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { WELLBEING_SCALES } from '@/lib/domain/childCare';
import { insertOrQueue } from '@/lib/offline';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';

type Scales = Partial<Record<(typeof WELLBEING_SCALES)[number]['key'], 1 | 2 | 3>>;
interface Entry { id: string; at: string; mood: number | null; unusual_event: string | null; note: string | null; crying: number | null; irritability: number | null; energy: number | null; appetite: number | null; sleep: number | null; digestive_comfort: number | null }
const moodLabels = () => [tr('u4.wb.m1'), tr('u4.wb.m2'), tr('u4.wb.m3'), tr('u4.wb.m4'), tr('u4.wb.m5')];
const MOOD_ICONS = ['cloud-rain', 'cloud', 'cloud-drizzle', 'sun', 'star'] as const;

export default function ChildWellbeing() {
  const toast = useToast();
  const MOODS = moodLabels();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const q = useRows<Entry>(['child_wellbeing', id ?? ''], id ? { table: 'child_wellbeing', filters: [eq('child_id', id)], order: [{ col: 'at', asc: false }], limit: 60 } : null);
  const [mood, setMood] = useState<number | null>(null);
  const [scales, setScales] = useState<Scales>({});
  const [unusual, setUnusual] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(false);
  const th = useTheme();

  /** Un tap sur une humeur : enregistré tout de suite (les détails restent possibles ensuite). */
  async function quickMood(level: number) {
    if (!child || saving) return;
    setSaving(true);
    try {
      await insertOrQueue('child_wellbeing', { child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), mood: level, unusual_event: null, note: null });
      inv('child_wellbeing');
      haptic('success');
      toast(tr('u4.wb.noted', { mood: MOODS[level - 1].toLowerCase() }));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }

  async function save() {
    if (!child) return;
    if (!mood && !Object.keys(scales).length && !unusual.trim() && !note.trim()) return toast(tr('u4.wb.atLeast'), 'error');
    setSaving(true);
    try {
      await insertOrQueue('child_wellbeing', { child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), mood, ...scales, unusual_event: unusual.trim() || null, note: note.trim() || null });
      inv('child_wellbeing');
      haptic('success');
      toast(tr('u4.wb.savedShort'));
      setMood(null); setScales({}); setUnusual(''); setNote(''); setDetails(false);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }
  async function remove(e: Entry) {
    if (!(await confirm(tr('u4.wb.delQ'), new Date(e.at).toLocaleString(localeTag()), tr('u4.wb.delete')))) return;
    try { await backend.remove('child_wellbeing', [eq('id', e.id)]); inv('child_wellbeing'); toast(tr('u4.wb.deleted')); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  const describe = (e: Entry) => [e.mood ? MOODS[e.mood - 1] : null, ...WELLBEING_SCALES.map((s) => (e[s.key] ? `${s.label} : ${s.levels[(e[s.key] as number) - 1].toLowerCase()}` : null)), e.unusual_event].filter(Boolean).join(' · ');

  const entries = q.data ?? [];
  const todayKey = new Date().toDateString();
  const todayEntries = entries.filter((e) => new Date(e.at).toDateString() === todayKey);
  const weekAgo = Date.now() - 7 * 86400_000;
  const lastMood = todayEntries.find((e) => e.mood)?.mood;
  const empty = !mood && !Object.keys(scales).length && !unusual.trim() && !note.trim();

  return (
    <Screen back title={tr('u4.wb.title')} subtitle={child ? tr('u4.wb.subtitle', { name: child.first_name }) : undefined}
      action={details ? { label: tr('u4.wb.saveDetails'), icon: 'check', onPress: () => void save(), disabled: saving || empty, testID: 'wellbeing-save' } : undefined}>
      <TodaySummary items={[
        { icon: 'smile', value: lastMood ? MOODS[lastMood - 1] : '—', label: tr('u4.wb.sumMood') },
        { icon: 'edit-3', value: String(todayEntries.length), label: tr('u4.wb.sumToday') },
        { icon: 'calendar', value: String(entries.filter((e) => Date.parse(e.at) >= weekAgo).length), label: tr('u4.wb.sum7') },
      ]} />
      {/* humeur en un tap : enregistrée aussitôt */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text weight="bold">{child ? tr('u4.wb.todayNamed', { name: child.first_name }) : tr('u4.wb.today')}</Text>
          <Row style={{ gap: 6 }}>
            {MOODS.map((m, i) => {
              const on = lastMood === i + 1;
              return (
                <Tappable key={m} accessibilityRole="button" accessibilityLabel={tr('u4.wb.quickA11y', { mood: m })} onPress={() => void quickMood(i + 1)} testID={`wellbeing-quick-${i + 1}`}
                  style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: 18, borderWidth: 1,
                    borderColor: on ? th.colors.gold : tint(th.colors.primary, 0.25), backgroundColor: on ? tint(th.colors.gold, th.isDark ? 0.3 : 0.18) : 'transparent' }}>
                  <Icon name={MOOD_ICONS[i]} size={22} color={on ? th.colors.gold : th.colors.primary} />
                  <Text variant="caption" center numberOfLines={2} style={{ fontSize: 11 }}>{m}</Text>
                </Tappable>
              );
            })}
          </Row>
          <Button label={details ? tr('u4.wb.hideDetails') : tr('u4.wb.addDetails')} variant="ghost" size="sm" icon={details ? 'chevron-up' : 'plus'} onPress={() => setDetails((d) => !d)} testID="wellbeing-details" />
        </View>
      </Card>
      {details ? (
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text weight="bold">{tr('u4.wb.details')}</Text>
          <Row wrap>{MOODS.map((m, i) => <Chip key={m} label={m} selected={mood === i + 1} onPress={() => setMood(mood === i + 1 ? null : i + 1)} />)}</Row>
          {WELLBEING_SCALES.map((s) => (
            <View key={s.key} style={{ gap: 4 }}>
              <Text weight="medium">{s.label}</Text>
              <Row wrap>{s.levels.map((l, i) => <Chip key={l} label={l} selected={scales[s.key] === i + 1} onPress={() => setScales((c) => ({ ...c, [s.key]: c[s.key] === i + 1 ? undefined : ((i + 1) as 1 | 2 | 3) }))} />)}</Row>
            </View>
          ))}
          <Field label={tr('u4.wb.unusual')} optional value={unusual} onChangeText={setUnusual} maxLength={300} placeholder={tr('u4.wb.unusualPh')} />
          <Field label={tr('u4.wb.note')} optional multiline value={note} onChangeText={setNote} maxLength={2000} />
        </View>
      </Card>
      ) : null}
      <Text variant="caption" muted>{tr('u4.wb.caveat')}</Text>

      <HistoryHeader title={tr('u4.wb.previous')} count={entries.length || undefined} />
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="smile" title={tr('u4.wb.nothing')} /> : null}
      {(q.data ?? []).map((e, i) => (
        <StaggerItem key={e.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="smile" title={new Date(e.at).toLocaleString(localeTag(), { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} subtitle={[describe(e), e.note].filter(Boolean).join(' — ')} right={<Button label={tr('u4.wb.delete')} size="sm" variant="ghost" onPress={() => remove(e)} />} />
          </Card>
        </StaggerItem>
      ))}
    </Screen>
  );
}
