/**
 * Mouvements du bébé — séance de comptage (famille « temps et sessions », 22/11/2026).
 *  · maintenant : séance en cours → le COMPTE en grand, le minuteur tiré de la donnée (maintenant − début, il
 *    continue application fermée), « Annuler le dernier », « Terminer » ; sinon la dernière séance ;
 *  · sept jours : une barre par jour (mouvements comptés), jour sans séance = pointillés « rien de noté », jamais 0 ;
 *    toucher un jour liste ses séances (heure en colonne, compte, durée, chevron) ;
 *  · fiche d'une séance (Tray) : compte, heures et note ; « Corriger » = valeurs PROVISOIRES, Annuler, Enregistrer
 *    verrouillé contre le double appui, brouillon conservé si l'écriture échoue ; Supprimer après confirmation.
 * Aucun seuil, aucun « nombre à atteindre », aucune interprétation : en cas de doute, on appelle la maternité.
 * L'action principale (bas de l'écran) est posée par la route : `useKickMain()`.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton, GlassIconButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { confirm, useToast } from '@/components/Overlays';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useActivePregnancy } from '@/lib/data/hooks';
import { useKickRows, useKickWrite } from '@/lib/data/hooks-pregTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import { stopwatch } from '@/lib/domain/breastSession';
import { isoDay } from '@/lib/domain/journalTrack';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { kickSeconds, kickSessions, kicksByDay, ongoingKick, proposedRange, type KickSession } from '@/lib/domain/pregTrack';
import { hhmm } from '@/lib/domain/quickTrack';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { useTicker } from '@/features/breastTrack/SessionBand';
import { DayBars } from '@/features/quickTrack/DayBars';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, useGuardedSave } from '@/features/quickTrack/EntryTray';

export const kickCount = (n: number) => tr('pg.k.count', { count: n });
const dur = (s: KickSession, now: Date) => span(kickSeconds(s, now) / 60);

/** Séances lues dans la table + l'action principale de l'écran (commencer / mouvement senti), verrouillée. */
export function useKickState() {
  const q = useKickRows();
  const sessions = useMemo(() => kickSessions(q.data ?? []), [q.data]);
  const live = ongoingKick(sessions);
  return { q, sessions, live };
}

export function useKickMain(live: KickSession | null) {
  const toast = useToast();
  const pregnancy = useActivePregnancy();
  const write = useKickWrite();
  const inflight = useRef(false);
  const run = async (fn: () => Promise<unknown>) => {
    if (inflight.current) return;
    inflight.current = true;
    try { await fn(); } catch (e) { toast(friendlyError(e), 'error'); } finally { inflight.current = false; }
  };
  const week = pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null;
  return live
    ? { label: tr('pg.k.tap'), icon: 'plus' as const, testID: 'kick-tap', onPress: () => run(async () => { haptic('selection'); await write.mutateAsync({ op: 'tap', session: live, at: new Date() }); }) }
    : { label: tr('pg.k.start'), icon: 'play' as const, testID: 'kick-start', onPress: () => run(async () => { haptic('success'); await write.mutateAsync({ op: 'start', pregnancyId: pregnancy?.id ?? null, week: week != null ? Math.min(45, week) : null, at: new Date() }); }) };
}

export function KickNow({ sessions, live, loading = false }: { sessions: KickSession[]; live: KickSession | null; loading?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const write = useKickWrite();
  const now = useTicker(!!live);
  const p = useLocalSearchParams<{ day?: string; session?: string }>();
  const days = useMemo(() => kicksByDay(sessions, now, 7), [sessions, now]);
  const selDay = days.find((d) => d.day === p.day)?.day ?? isoDay(now);
  const sel = days.find((d) => d.day === selDay)!;
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const busy = useRef(false);
  // lien direct vers une séance (accueil, catégorie) : sa fiche s'ouvre
  useEffect(() => {
    if (!p.session || !sessions.some((s) => s.id === p.session)) return;
    setOpenId(p.session); setVisible(true); router.setParams({ session: undefined } as never);
  }, [p.session, sessions]);
  const selected = sessions.find((s) => s.id === openId) ?? null;
  const last = live ?? sessions[0] ?? null;
  const act = async (fn: () => Promise<unknown>) => {
    if (busy.current) return; busy.current = true;
    try { await fn(); } catch (e) { toast(friendlyError(e), 'error'); } finally { busy.current = false; }
  };
  const open = (id: string) => { haptic('selection'); setOpenId(id); setVisible(true); };
  return (
    <View style={{ gap: spacing.md }} testID="kick-now">
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.lg, gap: spacing.xs, alignItems: 'center' }} testID="kick-hero">
        <Text variant="small" weight="medium" muted center testID="kick-hero-title">
          {live ? tr('pg.k.liveSince', { time: clock(new Date(live.start)) }) : last ? tr('pg.k.lastTitle') : loading ? ' ' : tr('pg.k.noneYet')}
        </Text>
        <Text testID="kick-count" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
          accessibilityLabel={last ? kickCount(last.count) : tr('pg.k.noneYet')}
          style={[HERO, { fontSize: 72, lineHeight: 80, color: t.colors.text, textAlign: 'center' }, TABULAR]}>{last ? String(last.count) : '—'}</Text>
        <Text weight="bold" center style={TABULAR} testID="kick-unit">
          {live ? tr('pg.k.unitNoted', { count: live.count })
            : last ? tr('pg.k.unitLast', { count: last.count, dur: dur(last, now), when: formatDate(last.start, { weekday: 'long', day: 'numeric', month: 'long' }), time: clock(new Date(last.start)) })
              : loading ? ' ' : tr('pg.k.how')}
        </Text>
        {live ? (
          <Text testID="kick-timer" maxFontSizeMultiplier={1.3} accessibilityLabel={tr('pg.k.timerA11y', { time: stopwatch(kickSeconds(live, now)) })}
            style={[{ fontSize: 28, lineHeight: 34, fontFamily: fonts.display, color: t.colors.textMuted }, TABULAR]}>{stopwatch(kickSeconds(live, now))}</Text>
        ) : null}
        {live ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' }}>
            <GlassButton variant="tertiary" icon="rotate-ccw" label={tr('pg.k.undo')} testID="kick-undo" disabled={!live.count}
              onPress={() => act(() => write.mutateAsync({ op: 'undo', session: live }))} />
            <GlassButton variant="secondary" icon="square" label={tr('pg.k.end')} testID="kick-end"
              onPress={() => act(async () => { haptic('success'); await write.mutateAsync({ op: 'end', session: live, at: new Date() }); })} />
          </View>
        ) : last ? (
          <GlassButton variant="tertiary" icon="edit-2" label={tr('pg.k.openLast')} testID="kick-open-last" onPress={() => open(last.id)} />
        ) : null}
      </Glass>

      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="kick-week">
        <Text variant="label">{tr('pg.k.week')}</Text>
        <DayBars testID="kick-bars" days={days.map((d) => ({ day: d.day, value: d.value }))} selected={selDay} minMax={10}
          onSelect={(day) => router.setParams({ day } as never)} describe={(d) => (d.value == null ? tr('pg.none') : kickCount(d.value))} />
        <Text variant="label" testID="kick-day-title">{formatDate(`${selDay}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {sel.sessions.length ? sel.sessions.map((s) => (
          <Tappable key={s.id} accessibilityRole="button" testID={`kick-row-${s.id}`} onPress={() => open(s.id)}
            accessibilityLabel={`${clock(new Date(s.start))}. ${kickCount(s.count)}. ${s.ongoing ? tr('pg.k.ongoing') : dur(s, now)}. ${tr('pg.openToFix')}`}
            style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
            <Text weight="bold" style={[{ width: 72 }, TABULAR]}>{clock(new Date(s.start))}</Text>
            <Icon name="radio" size={16} color={s.ongoing ? t.colors.primary : t.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={TABULAR}>{kickCount(s.count)}</Text>
              <Text variant="caption" muted style={TABULAR}>{s.ongoing ? tr('pg.k.ongoing') : tr('pg.k.range', { from: clock(new Date(s.start)), to: clock(new Date(s.end!)), dur: dur(s, now) })}</Text>
            </View>
            {s.note ? <Icon name="message-square" size={14} color={t.colors.primary} /> : null}
            <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
          </Tappable>
        )) : (
          <View testID="kick-day-none" style={{ minHeight: 48, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="small" muted>{tr('pg.none')}</Text>
          </View>
        )}
      </Glass>
      <KickTray session={selected} open={visible && !!selected} onOpenChange={setVisible} now={now} />
    </View>
  );
}

function KickTray({ session, open, onOpenChange, now }: { session: KickSession | null; open: boolean; onOpenChange: (v: boolean) => void; now: Date }) {
  if (!session) return null;
  const s = session;
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="kick-tray" title={tr('pg.k.trayTitle')}
      hero={String(s.count)} heroLabel={kickCount(s.count)}
      lines={[
        s.ongoing ? tr('pg.k.unitLive', { count: s.count, time: stopwatch(kickSeconds(s, now)) }) : tr('pg.k.unitShort', { count: s.count, dur: dur(s, now) }),
        `${formatDate(s.start, { weekday: 'long', day: 'numeric', month: 'long' })} · ${s.ongoing ? tr('pg.k.since', { time: clock(new Date(s.start)) }) : tr('pg.k.rangeOnly', { from: clock(new Date(s.start)), to: clock(new Date(s.end!)) })}`,
        s.note ? tr('pg.note', { note: s.note }) : null,
      ]}
      editLabel={tr('pg.fix')}
      editor={<KickEdit key={`${s.id}:${s.start}:${s.end}:${s.count}:${s.note}`} s={s} onDone={() => onOpenChange(false)} />} />
  );
}

function KickEdit({ s, onDone }: { s: KickSession; onDone: () => void }) {
  const t = useTheme();
  const { goBack } = useTray();
  const write = useKickWrite();
  const g = useGuardedSave();
  const start0 = hhmm(new Date(s.start));
  const end0 = s.end ? hhmm(new Date(s.end)) : null;
  const [count, setCount] = useState(s.count);
  const [startText, setStartText] = useState(start0);
  const [endText, setEndText] = useState<string | null>(end0);
  const [note, setNote] = useState(s.note ?? '');
  const range = proposedRange(s.start, startText, endText, new Date());
  const changed = count !== s.count || startText !== start0 || endText !== end0 || note.trim() !== (s.note ?? '');
  const reset = () => { setCount(s.count); setStartText(start0); setEndText(end0); setNote(s.note ?? ''); g.setError(null); };
  const cancel = () => { reset(); goBack(); };
  const save = () => g.run(async () => {
    if (!range) return tr('pg.k.badRange');
    await write.mutateAsync({ op: 'correct', session: s, start: range.start, end: range.end, count, note: note.trim() || null });
    haptic('success'); goBack();
    return 'ok';
  });
  const remove = async () => {
    if (!(await confirm(tr('pg.k.deleteTitle'), tr('pg.k.deleteBody', { count: s.count }), tr('pg.delete')))) return;
    const ok = await g.run(async () => { await write.mutateAsync({ op: 'delete', session: s }); return 'ok'; });
    if (ok) onDone();
  };
  const step = (d: number) => { setCount((c) => Math.max(0, Math.min(999, c + d))); g.setError(null); };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="kick-editor">
      <EditHeader title={tr('pg.k.fixTitle')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <GlassIconButton icon="minus" label={tr('pg.k.minus')} testID="kick-edit-minus" size={52} disabled={count <= 0} onPress={() => step(-1)} />
        <Text testID="kick-edit-count" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[HERO, { fontSize: 52, lineHeight: 58, color: t.colors.text, minWidth: 80, textAlign: 'center' }, TABULAR]}>{String(count)}</Text>
        <GlassIconButton icon="plus" label={tr('pg.k.plus')} testID="kick-edit-plus" size={52} onPress={() => step(1)} />
      </View>
      <Text weight="bold" center style={TABULAR} testID="kick-edit-proposed">
        {changed ? tr('pg.k.proposed', { count }) : tr('pg.k.recorded', { count: s.count })}
      </Text>
      {changed && count !== s.count ? <Text variant="small" muted center testID="kick-edit-before">{tr('pg.k.before', { count: s.count })}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Field label={tr('pg.k.startLabel')} value={startText} onChangeText={(v) => { setStartText(v); g.setError(null); }} keyboardType="numbers-and-punctuation" maxLength={5} testID="kick-edit-start" />
        </View>
        {endText != null ? (
          <View style={{ flex: 1 }}>
            <Field label={tr('pg.k.endLabel')} value={endText} onChangeText={(v) => { setEndText(v); g.setError(null); }} keyboardType="numbers-and-punctuation" maxLength={5} testID="kick-edit-end" />
          </View>
        ) : null}
      </View>
      {!range ? <Text variant="small" color={t.colors.danger} testID="kick-edit-badrange">{tr('pg.k.badRange')}</Text> : null}
      <Field label={tr('pg.noteLabel')} optional value={note} onChangeText={(v) => { setNote(v); g.setError(null); }} maxLength={300} testID="kick-edit-note" />
      <EditActions onCancel={cancel} onSave={save} canSave={changed && !!range} busy={g.busy} error={g.error} testID="kick-edit" />
      <GlassButton variant="tertiary" icon="trash-2" label={tr('pg.k.delete')} testID="kick-edit-delete" disabled={g.busy} onPress={() => void remove()} />
    </View>
  );
}
