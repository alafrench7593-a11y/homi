/**
 * « Mon sommeil » — le sommeil du parent lui-même (distinct de celui du bébé).
 * Carnet privé (visible uniquement par vous), descriptif : aucune cible, aucune norme, aucun diagnostic.
 */
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { BarChart, StatPill } from '@/components/Charts';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteParentSleep, useParentSleepLogs, useSaveParentSleep, useSleepContext } from '@/lib/data/hooks-sleep';
import { addDays, formatDuration, frToISO, todayISO } from '@/lib/domain/dates';
import {
  durationInput, estimateSleepMinutes, formatHHMM, nightLabel, nightMinutes, parseDuration, parseHHMM, resolveNight,
  sleepTips, summarizeWeek, supportSignal, timeOfIso, totalNapMinutes, validateSleepForm,
} from '@/lib/domain/parentSleep';
import { toFrDate } from '@/lib/validation';
import type { Nap, ParentSleepInput, ParentSleepLog, Scale5 } from '@/lib/types-sleep';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const QUALITY = ['Très agitée', 'Agitée', 'Moyenne', 'Plutôt reposante', 'Reposante'];
const FATIGUE = ['Reposé·e', 'Un peu fatigué·e', 'Fatigué·e', 'Très fatigué·e', 'Épuisé·e'];
const MOOD = ['Très difficile', 'Difficile', 'Entre les deux', 'Plutôt bien', 'Bien'];

// ---------------------------------------------------------------- petits composants
function ScalePicker({ label, labels, value, onChange }: { label: string; labels: string[]; value: Scale5 | null; onChange: (v: Scale5 | null) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}<Text variant="small" muted>{'  '}(facultatif)</Text></Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 6 }}>
        {([1, 2, 3, 4, 5] as Scale5[]).map((v) => {
          const sel = value === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${v} sur 5 : ${labels[v - 1]}`}
              onPress={() => { haptic('selection'); onChange(sel ? null : v); }}
              style={({ pressed }) => ({
                flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center',
                borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : pressed ? t.colors.surfaceAlt : t.colors.surface,
              })}
            >
              <Text weight="bold" color={sel ? t.colors.primaryText : t.colors.text}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" muted>{value ? labels[value - 1] : `1 = ${labels[0].toLowerCase()} · 5 = ${labels[4].toLowerCase()}`}</Text>
    </View>
  );
}

function TimeField({ label, value, onChange, error, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Field label={label} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType="numbers-and-punctuation" maxLength={5} error={error} />
    </View>
  );
}

function SupportBanner({ fatigue, lowMood }: { fatigue: boolean; lowMood: boolean }) {
  const toast = useToast();
  const what = fatigue && lowMood
    ? 'Vous avez noté une grande fatigue plusieurs jours de suite, et une humeur très basse.'
    : fatigue ? 'Vous avez noté une grande fatigue plusieurs jours de suite.' : 'Vous avez noté une humeur très basse ces derniers jours.';
  return (
    <Banner
      tone="warning"
      icon="heart"
      title="Prendre soin de vous compte aussi"
      action={
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label="Appeler le 3114" size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL('tel:3114').catch(() => toast('Appel impossible depuis cet appareil. Composez le 3114.', 'error'))} />
          <Button label="Ressources d’aide" size="sm" variant="secondary" icon="life-buoy" onPress={() => router.push('/emergency')} />
        </Row>
      }
    >
      <Text variant="small">
        {`${what} Ce n’est pas un diagnostic : simplement, en parler à votre médecin, votre sage-femme ou à la PMI peut vraiment aider, et vous n’avez pas à attendre le prochain rendez-vous. Si vous vous sentez en détresse, le 3114 répond gratuitement, 24 h/24. En cas de danger immédiat, appelez le 15 ou le 112.`}
      </Text>
    </Banner>
  );
}

// ---------------------------------------------------------------- formulaire
interface FormState {
  id: string | null;
  date: string;
  bed: string;
  wake: string;
  wakings: string;
  details: { at: string; minutes: string }[];
  duration: string;
  durationEdited: boolean;
  naps: Nap[];
  quality: Scale5 | null;
  fatigue: Scale5 | null;
  mood: Scale5 | null;
  note: string;
}

function emptyForm(date = todayISO()): FormState {
  return { id: null, date: toFrDate(date), bed: '', wake: '', wakings: '0', details: [], duration: '', durationEdited: false, naps: [], quality: null, fatigue: null, mood: null, note: '' };
}

function formFromLog(l: ParentSleepLog): FormState {
  return {
    id: l.id,
    date: toFrDate(l.log_date),
    bed: timeOfIso(l.bedtime),
    wake: timeOfIso(l.wake_time),
    wakings: String(l.night_wakings ?? 0),
    details: (l.waking_details ?? []).map((d) => ({ at: d.at ?? '', minutes: d.minutes != null ? String(d.minutes) : '' })),
    duration: l.duration_edited ? durationInput(l.sleep_minutes) : '',
    durationEdited: l.duration_edited,
    naps: (l.naps ?? []).map((n) => ({ ...n })),
    quality: l.quality, fatigue: l.fatigue, mood: l.mood,
    note: l.note ?? '',
  };
}

const norm = (hhmm: string) => {
  const m = parseHHMM(hhmm);
  return m == null ? null : formatHHMM(m);
};

function SleepFormSheet({ initial, logs, onClose }: { initial: FormState; logs: ParentSleepLog[]; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveParentSleep();
  const del = useDeleteParentSleep();
  const [f, setF] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((cur) => ({ ...cur, [k]: v }));

  const iso = frToISO(f.date);
  const night = iso && f.bed && f.wake ? resolveNight(iso, f.bed, f.wake) : null;
  const detailsNum = f.details.map((d) => ({ at: norm(d.at), minutes: d.minutes.trim() && /^\d+$/.test(d.minutes.trim()) ? Number(d.minutes) : null }));
  const auto = night ? estimateSleepMinutes(night.bedtime, night.wake, detailsNum) : null;
  const durationShown = f.durationEdited ? f.duration : auto != null ? durationInput(auto) : '';
  const count = f.wakings.trim() === '' ? 0 : Number(f.wakings);

  function setCount(n: number) {
    set('wakings', String(Math.max(0, Math.min(30, n))));
  }

  async function submit() {
    const today = todayISO();
    const e: Record<string, string> = {};
    if (!iso) e.logDate = 'Date attendue au format JJ/MM/AAAA.';
    Object.assign(e, iso ? validateSleepForm({ logDate: iso, bed: f.bed, wake: f.wake, wakings: f.wakings, details: f.details, duration: f.durationEdited ? f.duration : '', durationEdited: f.durationEdited, naps: f.naps }, today) : {});
    if (!e.logDate && iso && logs.some((l) => l.log_date === iso && l.id !== f.id)) e.logDate = 'Une nuit est déjà notée pour ce jour : ouvrez-la depuis la liste pour la modifier.';
    const minutes = f.durationEdited ? parseDuration(f.duration) : auto;
    const hasContent = !!night || minutes != null || f.naps.length > 0 || count > 0 || f.quality || f.fatigue || f.mood || f.note.trim();
    if (!hasContent && !Object.keys(e).length) e.form = 'Notez au moins une information (heures, durée, sieste, ressenti…).';
    setErrors(e);
    if (Object.keys(e).length || !iso) return;
    const details = detailsNum.filter((d) => d.at != null || d.minutes != null);
    const input: ParentSleepInput = {
      log_date: iso,
      bedtime: night ? night.bedtime.toISOString() : null,
      wake_time: night ? night.wake.toISOString() : null,
      night_wakings: Math.max(count, details.length),
      waking_details: details,
      sleep_minutes: minutes ?? null,
      duration_edited: f.durationEdited && minutes != null,
      naps: f.naps.map((n) => ({ start: norm(n.start) ?? n.start, end: norm(n.end) ?? n.end })),
      quality: f.quality, fatigue: f.fatigue, mood: f.mood,
      note: f.note.trim() || null,
    };
    try {
      await save.mutateAsync({ id: f.id, input });
      haptic('success');
      toast(f.id ? 'Nuit modifiée.' : 'Nuit enregistrée, elle reste privée.');
      onClose();
    } catch (err) {
      toast(friendlyError(err, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    }
  }

  async function remove() {
    if (!f.id) return;
    if (!(await confirm('Supprimer cette nuit ?', 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await del.mutateAsync(f.id);
      toast('Nuit supprimée.');
      onClose();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Sheet visible onClose={onClose} title={f.id ? 'Modifier ma nuit' : 'Noter ma nuit'}>
      <Field label="Jour du réveil" value={f.date} onChangeText={(v) => set('date', v)} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" maxLength={10} error={errors.logDate}
        hint={iso ? `${nightLabel(iso)}` : undefined} />
      {!f.id && (
        <Row>
          <Chip label="Cette nuit" selected={iso === todayISO()} onPress={() => set('date', toFrDate(todayISO()))} />
          <Chip label="La nuit d’avant" selected={iso === addDays(todayISO(), -1)} onPress={() => set('date', toFrDate(addDays(todayISO(), -1)))} />
        </Row>
      )}

      <Row style={{ alignItems: 'flex-start' }}>
        <TimeField label="Coucher" value={f.bed} onChange={(v) => set('bed', v)} placeholder="22:30" error={errors.bed} />
        <TimeField label="Réveil" value={f.wake} onChange={(v) => set('wake', v)} placeholder="07:00" error={errors.wake} />
      </Row>

      <View style={{ gap: 6 }}>
        <Text variant="label">Réveils dans la nuit</Text>
        <Row>
          <IconButton icon="minus" label="Un réveil de moins" onPress={() => setCount(count - 1)} style={{ backgroundColor: t.colors.surfaceAlt }} />
          <Text variant="heading" style={{ minWidth: 40, textAlign: 'center' }} accessibilityLiveRegion="polite">{Number.isFinite(count) ? count : 0}</Text>
          <IconButton icon="plus" label="Un réveil de plus" onPress={() => setCount(count + 1)} style={{ backgroundColor: t.colors.surfaceAlt }} />
        </Row>
        {errors.wakings ? <Text variant="small" color={t.colors.danger}>{errors.wakings}</Text> : null}
        {f.details.map((d, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Row style={{ alignItems: 'flex-end' }}>
              <TimeField label={`Réveil ${i + 1} · heure`} value={d.at} placeholder="03:15" onChange={(v) => set('details', f.details.map((x, j) => (j === i ? { ...x, at: v } : x)))} />
              <View style={{ flex: 1 }}>
                <Field label="Éveillé·e (min)" value={d.minutes} onChangeText={(v) => set('details', f.details.map((x, j) => (j === i ? { ...x, minutes: v } : x)))} placeholder="20" keyboardType="number-pad" maxLength={3} />
              </View>
              <IconButton icon="x" label={`Retirer le réveil ${i + 1}`} onPress={() => set('details', f.details.filter((_, j) => j !== i))} />
            </Row>
            {errors[`detail${i}`] ? <Text variant="small" color={t.colors.danger}>{errors[`detail${i}`]}</Text> : null}
          </View>
        ))}
        {f.details.length < 30 && (
          <Button label="Préciser un réveil (heure, durée)" size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }}
            onPress={() => { set('details', [...f.details, { at: '', minutes: '' }]); if (count <= f.details.length) setCount(f.details.length + 1); }} />
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Field label="Durée approximative de sommeil" optional value={durationShown} placeholder="7h30" maxLength={8} error={errors.duration}
          onChangeText={(v) => setF((cur) => ({ ...cur, duration: v, durationEdited: true }))}
          hint={f.durationEdited ? 'Durée saisie par vous.' : 'Calculée à partir du coucher, du réveil et des éveils notés. Vous pouvez la corriger.'} />
        {f.durationEdited && auto != null && (
          <Button label={`Revenir au calcul (${formatDuration(auto)})`} size="sm" variant="ghost" icon="refresh-cw" style={{ alignSelf: 'flex-start' }}
            onPress={() => setF((cur) => ({ ...cur, duration: '', durationEdited: false }))} />
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Text variant="label">Siestes de la journée</Text>
        {f.naps.map((n, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Row style={{ alignItems: 'flex-end' }}>
              <TimeField label={`Sieste ${i + 1} · début`} value={n.start} placeholder="14:00" onChange={(v) => set('naps', f.naps.map((x, j) => (j === i ? { ...x, start: v } : x)))} />
              <TimeField label="Fin" value={n.end} placeholder="14:45" onChange={(v) => set('naps', f.naps.map((x, j) => (j === i ? { ...x, end: v } : x)))} />
              <IconButton icon="x" label={`Retirer la sieste ${i + 1}`} onPress={() => set('naps', f.naps.filter((_, j) => j !== i))} />
            </Row>
            {errors[`nap${i}`] ? <Text variant="small" color={t.colors.danger}>{errors[`nap${i}`]}</Text> : null}
          </View>
        ))}
        {f.naps.length < 12 && (
          <Button label="Ajouter une sieste" size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }} onPress={() => set('naps', [...f.naps, { start: '', end: '' }])} />
        )}
      </View>

      <ScalePicker label="Qualité du sommeil" labels={QUALITY} value={f.quality} onChange={(v) => set('quality', v)} />
      <ScalePicker label="Fatigue aujourd’hui" labels={FATIGUE} value={f.fatigue} onChange={(v) => set('fatigue', v)} />
      <ScalePicker label="Humeur" labels={MOOD} value={f.mood} onChange={(v) => set('mood', v)} />

      <Field label="Notes" optional value={f.note} onChangeText={(v) => set('note', v)} multiline maxLength={2000} placeholder="Ce qui a aidé, ce qui a gêné…" style={{ minHeight: 90, textAlignVertical: 'top' }} />

      {errors.form ? <Banner tone="warning">{errors.form}</Banner> : null}
      <Button label={f.id ? 'Enregistrer les modifications' : 'Enregistrer ma nuit'} onPress={submit} loading={save.isPending} full />
      {f.id && <Button label="Supprimer cette nuit" variant="ghost" icon="trash-2" loading={del.isPending} onPress={remove} />}
    </Sheet>
  );
}

// ---------------------------------------------------------------- écran
function logSubtitle(l: ParentSleepLog): string {
  const parts: string[] = [];
  if (l.bedtime && l.wake_time) parts.push(`${timeOfIso(l.bedtime)} → ${timeOfIso(l.wake_time)}`);
  if (l.night_wakings) parts.push(`${l.night_wakings} réveil${l.night_wakings > 1 ? 's' : ''}`);
  const naps = (l.naps ?? []).length;
  if (naps) parts.push(`${naps} sieste${naps > 1 ? 's' : ''} (${formatDuration(totalNapMinutes(l.naps))})`);
  if (l.quality) parts.push(`qualité ${l.quality}/5`);
  if (l.fatigue) parts.push(`fatigue ${l.fatigue}/5`);
  if (l.mood) parts.push(`humeur ${l.mood}/5`);
  return parts.join(' · ');
}

export default function MySleepScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const logsQ = useParentSleepLogs(90);
  const { data: logs } = logsQ;
  const [removingId, setRemovingId] = useState<string | null>(null);
  const del = useDeleteParentSleep();
  const toast = useToast();
  const ctx = useSleepContext();
  const [form, setForm] = useState<FormState | null>(null);

  const today = todayISO();
  const week = useMemo(() => summarizeWeek(logs ?? [], today), [logs, today]);
  const signal = useMemo(() => supportSignal(logs ?? [], today), [logs, today]);
  const tips = useMemo(() => sleepTips(ctx), [ctx]);
  const todayLog = logs?.find((l) => l.log_date === today);

  async function remove(l: ParentSleepLog) {
    if (!(await confirm('Supprimer cette nuit ?', 'Cette action est définitive.', 'Supprimer'))) return;
    setRemovingId(l.id);
    try {
      await del.mutateAsync(l.id);
      toast('Nuit supprimée.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  const tipsTitle = ctx.postpartum && ctx.pregnant ? 'Repères pour vous, en ce moment' : ctx.postpartum ? 'Repères après la naissance' : ctx.pregnant ? 'Repères pendant la grossesse' : 'Repères pour mieux dormir';

  const loading = logsQ.isLoading && !logs;
  const failed = logsQ.isError && !logs;

  return (
    <Screen back title="Mon sommeil" subtitle="Votre sommeil à vous, sans objectif ni note." scroll={false} padded={false}>
      <VirtualList
        data={loading || failed ? [] : logs ?? []}
        keyExtractor={(l) => l.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info" icon="lock">{'Ce carnet est visible uniquement par vous, même au sein de votre foyer. Il décrit vos nuits sans les comparer à une norme et ne pose aucun diagnostic.'}</Banner>

            {signal.show && <SupportBanner fatigue={signal.fatigue} lowMood={signal.lowMood} />}

            <Appear kind="soft">
              <Button label={todayLog ? 'Modifier ma nuit' : 'Noter ma nuit'} icon="moon" full onPress={() => setForm(todayLog ? formFromLog(todayLog) : emptyForm())} />
            </Appear>

            <SectionTitle title="Mes 7 derniers jours" />
            {loading ? <Skeleton kind="card" rows={1} /> : failed ? (
              <ErrorView error={logsQ.error} onRetry={() => void logsQ.refetch()} title="Impossible d’afficher vos nuits" />
            ) : (
            <Card>
              {week.nightsLogged > 0 ? (
                <BarChart
                  data={week.days.map((d) => ({ label: d.label, value: d.minutes != null ? Math.round((d.minutes / 60) * 10) / 10 : 0 }))}
                  unit="h"
                  accessibilityLabel="Durée de sommeil de chaque nuit, en heures, sur les 7 derniers jours"
                />
              ) : (
                <Text muted>Aucune nuit notée ces 7 derniers jours. Il n’y a aucune obligation : notez seulement si cela vous aide.</Text>
              )}
              <Row wrap style={{ marginTop: spacing.sm }}>
                <StatPill value={week.avgSleepMinutes != null ? formatDuration(week.avgSleepMinutes) : '—'} label={`Durée moyenne (${week.nightsLogged} nuit${week.nightsLogged > 1 ? 's' : ''})`} />
                <StatPill value={String(week.napsCount)} label={week.napsCount ? `Sieste${week.napsCount > 1 ? 's' : ''} · ${formatDuration(week.napMinutes)}` : 'Siestes'} />
                <StatPill value={String(week.totalWakings)} label="Réveils nocturnes" />
              </Row>
              <Row wrap style={{ marginTop: spacing.xs }}>
                <StatPill value={week.avgQuality != null ? `${String(week.avgQuality).replace('.', ',')}/5` : '—'} label="Qualité moyenne" />
                <StatPill value={week.avgFatigue != null ? `${String(week.avgFatigue).replace('.', ',')}/5` : '—'} label="Fatigue moyenne" />
              </Row>
              <Text variant="caption" muted style={{ marginTop: spacing.sm }}>Ces chiffres décrivent simplement ce que vous avez noté. Chaque période de vie a ses nuits.</Text>
            </Card>
            )}

            <SectionTitle title={tipsTitle} />
            <Text variant="small" muted>Des idées générales, à prendre ou à laisser. Elles ne remplacent pas l’avis de votre médecin ou de votre sage-femme.</Text>
            {tips.map((tip) => (
              <Card key={tip.key} tone="lavender">
                <Row style={{ alignItems: 'flex-start' }}>
                  <Icon name={tip.icon as IconName} color={t.colors.lavender} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text weight="bold">{tip.title}</Text>
                    <Text variant="small">{tip.text}</Text>
                  </View>
                </Row>
              </Card>
            ))}
            <Banner tone="info" title="Quand en parler ?">
              {'Si le sommeil reste difficile même quand vous en avez l’occasion, si la fatigue pèse sur vos journées ou sur votre moral, votre médecin, votre sage-femme ou la PMI peuvent en parler avec vous.'}
            </Banner>

            <SectionTitle title="Mes nuits" />
            {loading ? <Skeleton rows={3} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState icon="moon" title="Aucune nuit notée pour l’instant" body="Notez seulement si cela vous aide." action={{ label: 'Noter ma nuit', icon: 'moon', onPress: () => setForm(emptyForm()) }} />
        )}
        renderItem={({ item: l }) => {
          const m = nightMinutes(l);
          return (
            <Card style={{ paddingVertical: spacing.xs }}>
              <ListRow
                icon="moon"
                title={`${nightLabel(l.log_date)}${m != null ? ` · ${formatDuration(m)}` : ''}`}
                subtitle={[logSubtitle(l), l.note ? (l.note.length > 80 ? `${l.note.slice(0, 80)}…` : l.note) : null].filter(Boolean).join(' — ') || undefined}
                onPress={() => setForm(formFromLog(l))}
                right={<Button label="Supprimer" size="sm" variant="ghost" loading={removingId === l.id} onPress={() => remove(l)} accessibilityLabel={`Supprimer la ${nightLabel(l.log_date).toLowerCase()}`} />}
              />
            </Card>
          );
        }}
        ListFooterComponent={(
          <View style={{ marginTop: spacing.sm }}>
            <ListRow icon="life-buoy" title="Besoin d’aide maintenant" subtitle="3114, 15, 112 et autres ressources gratuites" onPress={() => router.push('/emergency')} />
          </View>
        )}
      />

      {form && <SleepFormSheet key={form.id ?? 'new'} initial={form} logs={logs ?? []} onClose={() => setForm(null)} />}
    </Screen>
  );
}
