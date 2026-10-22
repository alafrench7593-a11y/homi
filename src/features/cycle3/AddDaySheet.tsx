/**
 * « Ajouter aujourd'hui » (ou un autre jour) : les 5 raccourcis favoris, puis « Voir toutes les catégories ».
 * Une pastille = une saisie ; les détails (intensité, heures, température, note…) restent facultatifs.
 * Après l'enregistrement : résumé du jour, « À savoir aujourd'hui » et, après un rapport, sa situation estimée
 * dans le cycle (textes exacts) avec, si besoin, les informations de contraception d'urgence (gratuites).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useUserId } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { useSetConsent } from '@/lib/data/hooks';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { useCycleCustomItems, useCycleData, useInsightFeedback, useRunCycleOps } from '@/lib/data/hooks-cycle3';
import { useConsumeQuota, usePremiumAccess } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isPremiumRequired } from '@/lib/premium/features';
import { canKeepPhotos, deleteEncryptedPhoto, keepEncryptedPhoto } from '@/lib/cycleAnalysis/privacy';
import {
  categoryOrder, daySummaryItems, effectiveFavorites, joinFr, PILLS, planDay, readDay, shortcutCategory, togglePill,
  type CategoryKey, type DayState, type Goal, type Shortcut,
} from '@/lib/domain/cycleDaily';
import { intercourseInfo, todayInsight } from '@/lib/domain/cycleInsights';
import { parseCycleVoice } from '@/lib/domain/cycleVoice';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { InsightView, IntercourseView } from './InsightCard';
import { LockedCard, Pill, pillLabel, useLocked } from './ui';

const SHORTCUT_ICON: Record<string, string> = {
  period: 'droplet', pain: 'zap', mood: 'smile', body: 'activity', sleep: 'moon', fertility: 'sun', intimacy: 'heart', contraception: 'shield', habits: 'coffee', notes: 'edit-3',
  mucus: 'droplet', temperature: 'thermometer', ovulation_test: 'sun', pregnancy_test: 'clipboard', intercourse: 'heart', pill: 'check-circle', missed_pill: 'alert-circle', incident: 'alert-triangle', reminders: 'bell',
};
export const shortcutIcon = (s: string) => SHORTCUT_ICON[s] ?? 'circle';

const PAIN_GENDER: Record<string, 'fp' | 'fs' | 'ms' | 'mp'> = {
  cramps: 'fp', back_pain: 'ms', migraine: 'fs', headache: 'ms', pelvic_pain: 'fs', breast_tenderness: 'mp', dyspareunia: 'fs', pain_other: 'fs',
};
const levelOf = (n: number) => (n <= 3 ? 'light' : n <= 6 ? 'moderate' : n <= 8 ? 'strong' : 'veryStrong');
const lowerFirst = (s: string) => s.replace(/^./, (c) => c.toLowerCase());

/** « fatigue, crampes légères et sommeil difficile » */
export function summaryText(d: DayState, hideIntimate: boolean): string {
  const items = daySummaryItems(d,
    (p) => (p === 'temperature' || p === 'note' ? tr(`c3.p.${p}` as TKey) : lowerFirst(pillLabel(p))),
    (p, label, n) => (PAIN_GENDER[p] ? tr('c3.sint.item', { item: label, level: tr(`c3.lvl.${PAIN_GENDER[p]}.${levelOf(n)}` as TKey) }) : label),
    hideIntimate);
  return joinFr(items, tr('c3.add.and'));
}

export function AddDaySheet({ visible, onClose, iso, start, goal }: { visible: boolean; onClose: () => void; iso: string; start?: CategoryKey | null; goal: Goal }) {
  const t = useTheme();
  const toast = useToast();
  const data = useCycleData();
  const { prefs } = useCyclePreferences();
  const run = useRunCycleOps();
  const feedbackQ = useInsightFeedback();
  const trends = usePremiumAccess('cycle_trends');
  const isToday = iso === data.today;
  const sources = useMemo(() => data.sources(iso), [data, iso]);
  const initial = useMemo(() => readDay(iso, sources), [iso, sources]);
  const [state, setState] = useState<DayState>(initial);
  const [cat, setCat] = useState<CategoryKey | null>(start ?? null);
  const [all, setAll] = useState(false);
  const [done, setDone] = useState<DayState | null>(null);
  const intimateLocked = useLocked('intimate', prefs.lock_mode);
  useEffect(() => { if (visible) { setState(initial); setCat(start ?? null); setAll(false); setDone(null); } }, [visible, iso]); // eslint-disable-line react-hooks/exhaustive-deps

  const favorites = effectiveFavorites(goal, prefs.favorites, data.intimate);
  const order = categoryOrder(goal, true);
  const title = isToday ? tr('c3.add.title') : tr('c3.add.titleDay', { date: formatDate(`${iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }) });
  const toggle = (p: string) => setState((s) => togglePill(s, p));

  async function save() {
    const ops = planDay(iso, initial, state, sources);
    try {
      if (ops.length) await run.mutateAsync(ops);
      haptic('success');
      setDone(state);
    } catch (e) {
      if (isPremiumRequired(e)) { trends.showPreview(); return; }
      toast(friendlyError(e), 'error');
    }
  }

  // ─── Après l'enregistrement ───
  if (done) {
    const summary = summaryText(done, false);
    const insight = todayInsight({
      today: iso, periods: data.periods, est: data.est, logs: data.logs, todayItems: done.pills, todayPain: done.painIntensity, goal, premium: trends.premium,
      feedback: Object.fromEntries((feedbackQ.data ?? []).map((f) => [f.insight_key, f.helpful ? 'helpful' : 'not_me'])),
    });
    const sex = done.pills.includes('sex_logged') ? intercourseInfo(iso, data.periods, data.est, {
      protected: done.pills.includes('sex_protected'), condom: done.pills.includes('sex_condom'), contraception: done.pills.includes('sex_contraception'),
      incident: done.pills.includes('sex_incident'), forgot: done.pills.includes('sex_forgot'), unprotected: done.pills.includes('sex_unprotected'), time: done.sexTime,
    }) : null;
    const missed = done.pills.includes('pill_missed');
    return (
      <Sheet visible={visible} onClose={onClose} title={tr('c3.add.saved')}>
        <View testID="c3-summary" accessibilityLiveRegion="polite" style={{ padding: spacing.md, borderRadius: 18, backgroundColor: t.colors.surfaceAlt }}>
          <Text weight="bold">{summary ? (isToday ? tr('c3.add.summary', { list: summary }) : tr('c3.add.summaryDay', { date: formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'long' }), list: summary })) : tr('c3.add.nothing')}</Text>
        </View>
        {sex ? <IntercourseView info={sex} date={iso} /> : null}
        {missed && !sex?.needsEmergencyInfo ? (
          <Button label={tr('c3.ec.open')} icon="info" variant="secondary" onPress={() => { onClose(); router.push({ pathname: '/cycle/emergency', params: { date: iso } } as never); }} full testID="c3-ec-open" />
        ) : null}
        <InsightView insight={insight} onAction={onClose} />
        <Button label={tr('common.close')} onPress={onClose} full testID="c3-done" />
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {/* Mes 5 raccourcis */}
      <View testID="c3-favorites" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {favorites.map((s) => {
          const target = shortcutCategory(s as Shortcut);
          const on = target === cat;
          return (
            <Chip key={s} label={tr(`c3.sc.${s}` as TKey)} icon={shortcutIcon(s) as never} selected={on} testID={`c3-fav-${s}`}
              onPress={() => { if (target === 'reminders') { onClose(); router.push('/contraception/reminders' as never); return; } setCat(on ? null : target); setAll(false); }} />
          );
        })}
      </View>
      <Tappable accessibilityRole="button" testID="c3-all" onPress={() => setAll((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 }}>
        <Icon name={all ? 'chevron-up' : 'grid'} size={16} color={t.colors.primary} />
        <Text weight="bold" color={t.colors.primary}>{all ? tr('c3.add.back') : tr('c3.add.allCategories')}</Text>
      </Tappable>
      {all ? (
        <View testID="c3-categories" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {order.map((c) => <Chip key={c} label={tr(`c3.cat.${c}` as TKey)} icon={shortcutIcon(c) as never} selected={cat === c} onPress={() => { setCat(c); setAll(false); }} testID={`c3-cat-${c}`} />)}
        </View>
      ) : null}

      {cat ? (
        <View testID={`c3-panel-${cat}`} style={{ gap: spacing.sm }}>
          <Text variant="heading">{tr(`c3.cat.${cat}` as TKey)}</Text>
          {cat === 'intimacy' && intimateLocked ? <LockedCard /> : cat === 'intimacy' && !data.intimate ? <IntimateOptIn /> : (
            <CategoryPanel cat={cat} state={state} setState={setState} toggle={toggle} iso={iso} />
          )}
        </View>
      ) : null}

      <VoiceEntry onApply={(pills, pain, temp) => setState((s) => {
        let n = s;
        for (const p of pills) if (!n.pills.includes(p)) n = togglePill(n, p);
        return { ...n, painIntensity: pain ?? n.painIntensity, temperature: temp ?? n.temperature };
      })} />

      <Text variant="small" muted testID="c3-live-summary">{state.pills.length || state.note.trim() || state.temperature != null ? tr('c3.day.notes', { list: summaryText(state, false) }) : tr('c3.add.nothing')}</Text>
      <Button label={tr('c3.add.save')} icon="check" onPress={save} loading={run.isPending} full testID="c3-save" />
    </Sheet>
  );
}

// ─── Panneau d'une catégorie ───────────────────────────────────────────────────────────────────────

function CategoryPanel({ cat, state, setState, toggle, iso }: { cat: CategoryKey; state: DayState; setState: React.Dispatch<React.SetStateAction<DayState>>; toggle: (p: string) => void; iso: string }) {
  const pills = (list: string[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {list.map((p) => <Pill key={p} id={p} label={pillLabel(p)} selected={state.pills.includes(p)} onPress={() => toggle(p)} category={cat} />)}
    </View>
  );
  const set = (patch: Partial<DayState>) => setState((s) => ({ ...s, ...patch }));
  switch (cat) {
    case 'period':
      return (
        <>
          {pills(PILLS.period)}
          <Options label={tr('c3.f.color')} values={['red', 'dark_red', 'brown', 'pink', 'other']} value={state.color} labelOf={(v) => tr(`c3.color.${v}` as TKey)} onChange={(v) => set({ color: v })} />
          <Options label={tr('c3.f.protection')} values={['pad', 'tampon', 'cup', 'period_underwear', 'disc', 'other']} value={state.protection} labelOf={(v) => tr(`c3.prot.${v}` as TKey)} onChange={(v) => set({ protection: v })} />
        </>
      );
    case 'pain':
      return (
        <>
          {pills(PILLS.pain)}
          <ScaleRow label={tr('c3.f.intensityLabel')} max={10} value={state.painIntensity} onChange={(v) => set({ painIntensity: v })} valueLabel={(v) => tr('c3.f.intensity', { value: v })} testID="c3-intensity" />
        </>
      );
    case 'mood': return pills(PILLS.mood);
    case 'body': return pills(PILLS.body);
    case 'sleep':
      return (
        <>
          {pills(PILLS.sleep)}
          <Row gap={spacing.sm}>
            <View style={{ flex: 1 }}><TimeField label={tr('c3.f.bedtime')} value={state.bedtime} onChange={(v) => set({ bedtime: v })} /></View>
            <View style={{ flex: 1 }}><TimeField label={tr('c3.f.waketime')} value={state.waketime} onChange={(v) => set({ waketime: v })} /></View>
          </Row>
          <ScaleRow label={tr('c3.f.quality', { value: state.sleepQuality ?? '–' })} max={5} value={state.sleepQuality} onChange={(v) => set({ sleepQuality: v })} />
          <ScaleRow label={tr('c3.f.wakings', { value: state.wakings ?? '–' })} max={6} min={0} value={state.wakings} onChange={(v) => set({ wakings: v })} />
          <ScaleRow label={tr('c3.f.fatigue', { value: state.fatigue ?? '–' })} max={5} value={state.fatigue} onChange={(v) => set({ fatigue: v })} />
          <ScaleRow label={tr('c3.f.energy', { value: state.energy ?? '–' })} max={5} value={state.energy} onChange={(v) => set({ energy: v })} />
        </>
      );
    case 'fertility':
      return (
        <>
          <Text variant="small" weight="bold">{tr('c3.f.mucus')}</Text>
          {pills(PILLS.fertility.filter((p) => p.startsWith('mucus_') || p === 'ovulation_pain'))}
          <TempField value={state.temperature} onChange={(v) => set({ temperature: v })} />
          <Text variant="small" weight="bold">{tr('c3.f.ovuTest')}</Text>
          {pills(['ovu_positive', 'ovu_negative', 'ovu_uncertain'])}
          <Text variant="small" weight="bold">{tr('c3.f.pregTest')}</Text>
          {pills(['preg_positive', 'preg_negative', 'preg_uncertain'])}
          <Text variant="caption" muted>{tr('c3.f.testNote')}</Text>
        </>
      );
    case 'intimacy':
      return (
        <>
          {pills(PILLS.intimacy)}
          {state.pills.includes('sex_logged') ? (
            <>
              <TimeField label={tr('c3.f.time')} value={state.sexTime} onChange={(v) => set({ sexTime: v })} />
              <Field label={tr('c3.f.privateNote')} optional value={state.sexNote ?? ''} onChangeText={(v) => set({ sexNote: v })} maxLength={1000} multiline />
            </>
          ) : null}
          <Text variant="caption" muted>{tr('c3.priv.never')}</Text>
        </>
      );
    case 'contraception':
      return (
        <>
          {pills(PILLS.contraception)}
          {state.pills.includes('treatment') ? <Field label={tr('c3.f.treatment')} value={state.treatment ?? ''} onChangeText={(v) => set({ treatment: v })} maxLength={80} /> : null}
          <Text variant="caption" muted>{tr('c3.f.noDose')}</Text>
          <Button label={tr('c3.rem.title')} icon="bell" variant="ghost" onPress={() => router.push('/contraception/reminders' as never)} testID="c3-reminders" />
        </>
      );
    case 'habits':
      return <>{pills(PILLS.habits)}<Text variant="caption" muted>{tr('c3.f.habitsHint')}</Text></>;
    case 'notes':
      return <NotesPanel state={state} set={set} iso={iso} />;
  }
}

function Options({ label, values, value, labelOf, onChange }: { label: string; values: string[]; value: string | null; labelOf: (v: string) => string; onChange: (v: string | null) => void }) {
  return (
    <View style={{ gap: 4 }}>
      <Text variant="small" weight="bold">{label}</Text>
      <Row wrap>{values.map((v) => <Chip key={v} label={labelOf(v)} selected={value === v} onPress={() => onChange(value === v ? null : v)} />)}</Row>
    </View>
  );
}

function ScaleRow({ label, max, min = 1, value, onChange, valueLabel, testID }: { label: string; max: number; min?: number; value: number | null; onChange: (v: number | null) => void; valueLabel?: (v: number) => string; testID?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Text variant="small" weight="bold">{value != null && valueLabel ? valueLabel(value) : label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => {
          const on = value === n;
          return (
            <Tappable key={n} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${label} ${n}`} onPress={() => { haptic('selection'); onChange(on ? null : n); }}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.colors.primary : t.colors.surfaceAlt }}>
              <Text weight="bold" color={on ? t.colors.primaryText : t.colors.text}>{String(n)}</Text>
            </Tappable>
          );
        })}
      </View>
    </View>
  );
}

const TIME = /^([01]?\d|2[0-3])[:h ]?([0-5]\d)$/;
function TimeField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const [text, setText] = useState(value ?? '');
  const [err, setErr] = useState<string | undefined>();
  return (
    <Field label={label} optional value={text} placeholder="22:30" keyboardType="numbers-and-punctuation" error={err} hint={err ? undefined : tr('c3.f.timeHint')}
      onChangeText={(v) => {
        setText(v);
        const m = v.trim().match(TIME);
        if (!v.trim()) { setErr(undefined); onChange(null); } else if (m) { setErr(undefined); onChange(`${m[1].padStart(2, '0')}:${m[2]}`); } else setErr(tr('c3.f.timeInvalid'));
      }} />
  );
}

function TempField({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value != null ? String(value).replace('.', ',') : '');
  const [err, setErr] = useState<string | undefined>();
  return (
    <Field label={tr('c3.f.temperature')} value={text} keyboardType="decimal-pad" placeholder="36,5" error={err} suffix="°C"
      onChangeText={(v) => {
        setText(v);
        const n = Number(v.replace(',', '.'));
        if (!v.trim()) { setErr(undefined); onChange(null); } else if (Number.isFinite(n) && n >= 35 && n <= 40) { setErr(undefined); onChange(Math.round(n * 100) / 100); } else setErr(tr('c3.f.tempInvalid'));
      }} />
  );
}

function NotesPanel({ state, set, iso }: { state: DayState; set: (p: Partial<DayState>) => void; iso: string }) {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const custom = useCycleCustomItems();
  const customAccess = usePremiumAccess('cycle_custom');
  const [tag, setTag] = useState('');
  const [item, setItem] = useState('');
  const [busy, setBusy] = useState(false);
  function addTag() {
    const v = tag.trim();
    if (!v || v.length > 30 || /[<>]/.test(v)) return toast(tr('c3.f.tagInvalid'), 'info');
    if (!state.tags.includes(v) && state.tags.length < 10) set({ tags: [...state.tags, v] });
    setTag('');
  }
  async function addItem() {
    if (!customAccess.require()) return;
    const v = item.trim();
    if (!v) return;
    try { await backend.insert('cycle_custom_items', { user_id: userId, label: v }); inv('cycle_custom_items'); setItem(''); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function photo() {
    if (!userId) return;
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
      if (r.canceled || !r.assets[0]) return;
      const path = await keepEncryptedPhoto(userId, r.assets[0].uri);
      set({ photoPath: path });
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <>
      <Field label={tr('c3.f.note')} optional value={state.note} onChangeText={(v) => set({ note: v })} placeholder={tr('c3.f.notePlaceholder')} maxLength={2000} multiline testID="c3-note" />
      <Text variant="small" weight="bold">{tr('c3.f.tags')}</Text>
      {state.tags.length ? <Row wrap>{state.tags.map((x) => <Chip key={x} label={`#${x}`} selected onPress={() => set({ tags: state.tags.filter((y) => y !== x) })} />)}</Row> : null}
      <Row gap={spacing.xs} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}><Field label={tr('c3.f.addTag')} value={tag} onChangeText={setTag} placeholder={tr('c3.f.tagPlaceholder')} maxLength={30} onSubmitEditing={addTag} testID="c3-tag" /></View>
        <Button label="+" onPress={addTag} variant="secondary" accessibilityLabel={tr('c3.f.addTag')} />
      </Row>
      {!customAccess.premium ? <Text variant="caption" muted>{tr('c3.f.tagLimit')}</Text> : null}
      <Text variant="small" weight="bold">{tr('c3.f.custom')}</Text>
      {(custom.data ?? []).length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {(custom.data ?? []).map((c) => <Pill key={c.id} id={c.id} label={c.label} category="notes" selected={state.customItems.includes(c.id)} onPress={() => set({ customItems: state.customItems.includes(c.id) ? state.customItems.filter((x) => x !== c.id) : [...state.customItems, c.id] })} />)}
        </View>
      ) : null}
      <Row gap={spacing.xs} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}><Field label={tr('c3.f.customAdd')} value={item} onChangeText={setItem} placeholder={tr('c3.f.customPlaceholder')} maxLength={30} /></View>
        <Button label="+" onPress={addItem} variant="secondary" accessibilityLabel={tr('c3.f.customAdd')} icon={customAccess.premium ? undefined : 'star'} />
      </Row>
      <Text variant="small" weight="bold">{tr('c3.f.photo')}</Text>
      {canKeepPhotos() ? (
        state.photoPath
          ? <Button label={tr('c3.f.photoRemove')} icon="trash-2" variant="ghost" onPress={async () => { await deleteEncryptedPhoto(state.photoPath).catch(() => undefined); set({ photoPath: null }); }} />
          : <Button label={tr('c3.f.photoAdd')} icon="image" variant="ghost" loading={busy} onPress={photo} />
      ) : <Text variant="caption" muted>{tr('c3.f.photoUnavailable')}</Text>}
      <Text variant="caption" muted>{iso}</Text>
    </>
  );
}

// ─── Saisie vocale (confirmation obligatoire) ─────────────────────────────────────────────────────

type SpeechCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start: () => void };
const speech = (): SpeechCtor | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

function VoiceEntry({ onApply }: { onApply: (pills: string[], pain: number | null, temp: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const access = usePremiumAccess('voice_entry');
  const consume = useConsumeQuota('voice_entries_per_month');
  const parsed = text.trim() ? parseCycleVoice(text) : null;
  const Rec = speech();
  if (!open) return <Button label={tr('c3.f.voice')} icon="mic" variant="ghost" onPress={() => setOpen(true)} testID="c3-voice" />;
  function dictate() {
    if (!Rec) return;
    const r = new Rec();
    r.lang = 'fr-FR'; r.interimResults = false;
    r.onresult = (e) => setText(e.results[0]?.[0]?.transcript ?? '');
    r.onerror = () => setListening(false); r.onend = () => setListening(false);
    setListening(true); r.start();
  }
  async function apply() {
    if (!parsed?.pills.length) return;
    if (!access.premium) {
      const r = await consume();
      if (!r.allowed) { access.showPreview(undefined, { used: r.used, quota: r.quota, unit: 'saisies vocales' }); return; }
    }
    onApply(parsed.pills, parsed.painIntensity, parsed.temperature);
    setText(''); setOpen(false);
  }
  return (
    <View testID="c3-voice-panel" style={{ gap: spacing.xs }}>
      <Row gap={spacing.xs} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}><Field label={tr('c3.f.voicePlaceholder')} value={text} onChangeText={setText} placeholder={tr('c3.f.voiceHint')} testID="c3-voice-text" /></View>
        {Rec ? <Button label="" icon="mic" variant="secondary" onPress={dictate} disabled={listening} accessibilityLabel={tr('c3.f.voice')} /> : null}
      </Row>
      {parsed ? (
        parsed.pills.length ? (
          <Banner tone="info" title={tr('c3.f.voiceConfirm')}>
            {parsed.pills.map((p) => pillLabel(p)).join(', ') + (parsed.painIntensity != null ? ` · ${tr('c3.f.intensity', { value: parsed.painIntensity })}` : '') + (parsed.temperature != null ? ` · ${String(parsed.temperature).replace('.', ',')} °C` : '')}
          </Banner>
        ) : <Text variant="small" muted>{tr('c3.f.voiceNothing')}</Text>
      ) : null}
      {parsed?.pills.length ? <Button label={tr('c3.f.voiceApply')} icon="check" variant="secondary" onPress={apply} testID="c3-voice-apply" /> : null}
    </View>
  );
}

// ─── Activation volontaire de la vie sexuelle ─────────────────────────────────────────────────────

export function IntimateOptIn() {
  const toast = useToast();
  const save = useSaveCyclePreferences();
  const consent = useSetConsent();
  async function enable() {
    try {
      await consent.mutateAsync({ purpose: 'intimate_data' as never, granted: true });
      await save.mutateAsync({ track_intercourse: true });
      haptic('success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <View testID="c3-intimate-optin" style={{ gap: spacing.xs }}>
      <Text weight="bold">{tr('c3.priv.optinTitle')}</Text>
      <Text variant="small" muted>{tr('c3.priv.optinBody')}</Text>
      <Button label={tr('c3.priv.optinAccept')} icon="lock" onPress={enable} loading={save.isPending || consent.isPending} testID="c3-intimate-enable" />
    </View>
  );
}
