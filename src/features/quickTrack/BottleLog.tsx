/**
 * Biberons — journal rapide d'un enfant (mini-app `/bottle/<enfant>`) :
 *  · `BottleQuickLog` : saisie à UNE main. Heure visible (« maintenant », ±5 min), quantité bue reprise de la
 *    dernière prise notée par le parent (jamais une recommandation), un grand bouton en bas, Annuler quelques secondes.
 *    Écrit par le même chemin que le formulaire (`useAddLog('bottle')`, file hors connexion comprise) ; un rappel actif
 *    repart de ce biberon (même délai), comme pour un biberon en direct.
 *  · `BottleLog` : dernier biberon en évidence, historique horodaté (aujourd'hui, hier) ; toucher une ligne ouvre sa
 *    fiche (Tray) pour corriger l'heure ou la quantité. `focusId` ouvre directement la fiche d'un biberon (lien
 *    depuis la catégorie Alimentation ou l'accueil).
 *  · `BottleHomeCard` : dernier biberon (heure, ml, « il y a … ») pour l'accueil (non inséré ici).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useAddLog, useInvalidate } from '@/lib/data/hooks';
import { useBottleHistory, useBottleTimer, useNow, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import { useEditLog } from '@/lib/data/hooks-quickTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import { updateLastBottleTime } from '@/lib/domain/bottleTimer';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock } from '@/lib/domain/sleepPlanner';
import { bottleEditError, clampMl, dayKey, hhmm, lastBottle, lastConsumedMl, proposedTime } from '@/lib/domain/quickTrack';
import type { BottleRecord } from '@/lib/types-bottle';
import type { Child } from '@/lib/types';
import { uuid } from '@/lib/uuid';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, TimeEditor, useGuardedSave } from './EntryTray';

type BottleRow = BottleRecord & { in_progress?: boolean | null; _pending?: boolean };
const MIN = 60_000;
const UNDO_MS = 8000;
const RESAVE_MS = 1500;
const mlText = (n: number | null | undefined) => (n == null ? tr('qt.b.noQty') : tr('qt.b.ml', { n }));

// ------------------------------------------------------------------ saisie à une main
export function BottleQuickLog({ child, bottles }: { child: Child; bottles: readonly BottleRow[] }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const add = useAddLog('bottle');
  const timer = useBottleTimer(child.id);
  const updateTimer = useUpdateBottleTimer();
  const now = useNow(30_000);
  const last = lastBottle(bottles, child.id, now);
  const usual = lastConsumedMl(bottles, child.id);
  const [ml, setMl] = useState<number | null>(usual);
  const touched = useRef(false);
  // La quantité reprise arrive avec les données : seulement tant que le parent n'a rien touché
  useEffect(() => { if (!touched.current) setMl(usual); }, [usual]);
  const [back, setBack] = useState(0); // minutes avant maintenant (0 = maintenant)
  const at = new Date(now.getTime() - back * MIN);
  const inflight = useRef(false);
  // Un deuxième appui juste après l'enregistrement (double appui, rebond) n'ajoute pas un second biberon
  const savedAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const setQty = (v: number | null) => { touched.current = true; setMl(v); };

  async function save() {
    if (inflight.current || ml == null || Date.now() - savedAt.current < RESAVE_MS) return;
    inflight.current = true; setBusy(true);
    const id = uuid();
    const when = new Date(Date.now() - back * MIN);
    try {
      const res = await add.mutateAsync({ id, child_id: child.id, household_id: child.household_id, at: when.toISOString(), prepared_ml: null, consumed_ml: ml, planned_next_ml: null, milk_type: last?.milk_type ?? null, note: null });
      savedAt.current = Date.now();
      haptic('success');
      // Un rappel actif repart de ce biberon (même délai), comme à la fin d'un biberon en direct
      let next: string | null = null;
      const active = timer.active;
      if (active && when.getTime() >= Date.parse(active.last_bottle_at)) {
        try { const p = updateLastBottleTime(active, when); await updateTimer.mutateAsync({ id: active.id, patch: p }); next = p.due_at; } catch { next = null; }
      }
      toast(res === 'queued' ? tr('qt.b.queued', { ml }) : next ? tr('qt.b.savedNext', { ml, time: clock(new Date(next)) }) : tr('qt.b.saved', { ml, name: child.first_name }), res === 'queued' ? 'info' : 'success');
      setBack(0);
      if (res === 'sent') {
        setUndo(id);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
      }
    } catch (e) {
      toast(friendlyError(e, tr('qt.b.saveFail')), 'error');
    } finally { inflight.current = false; setBusy(false); }
  }
  async function cancel() {
    if (!undo) return;
    const id = undo; setUndo(null);
    try { await backend.remove('bottles', [eq('id', id)]); inv('bottles'); toast(tr('qt.b.undone'), 'info'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="qt-bottle-quick">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
        <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{tr('qt.b.quickTitle')}</Text>
        {last ? <Text variant="caption" muted testID="qt-bottle-quick-last">{tr('qt.b.lastAgo', { ago: agoLabel(last.at, now) })}</Text> : null}
      </View>
      {/* Heure visible, réglable d'un pouce */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="clock" size={18} color={t.colors.textMuted} />
        <Text weight="bold" style={[{ flex: 1, fontSize: 20 }, TABULAR]} testID="qt-bottle-quick-time" accessibilityLiveRegion="polite">
          {back === 0 ? tr('qt.b.atNow', { time: clock(at) }) : tr('qt.b.at', { time: clock(at) })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="sm" full label={tr('qt.edit.minus5')} testID="qt-bottle-quick-earlier" onPress={() => setBack((b) => Math.min(b + 5, 12 * 60))} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="sm" full label={tr('qt.edit.plus5')} disabled={back === 0} testID="qt-bottle-quick-later" onPress={() => setBack((b) => Math.max(0, b - 5))} /></View>
        {back ? <View style={{ flex: 1 }}><GlassButton variant="tertiary" size="sm" full label={tr('qt.b.now')} testID="qt-bottle-quick-now" onPress={() => setBack(0)} /></View> : null}
      </View>
      {/* Quantité bue en grand, puis grands boutons −10 / +10 sous le pouce */}
      <Text testID="qt-bottle-quick-ml" maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite" style={[HERO, { textAlign: 'center', color: ml == null ? t.colors.textMuted : t.colors.text }, TABULAR]}>{ml == null ? tr('qt.b.mlUnknown') : tr('qt.b.ml', { n: ml })}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="lg" full label={tr('qt.b.minus10')} testID="qt-bottle-quick-minus" disabled={ml == null || ml <= 0} onPress={() => setQty(clampMl((ml ?? 0) - 10))} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="lg" full label={tr('qt.b.plus10')} testID="qt-bottle-quick-plus" disabled={ml != null && ml >= 500} onPress={() => setQty(clampMl((ml ?? 0) + 10))} /></View>
      </View>
      <Text variant="caption" muted center testID="qt-bottle-quick-hint">{usual != null ? (ml === usual ? tr('qt.b.sameAsLast', { ml: usual }) : tr('qt.b.lastWas', { ml: usual })) : tr('qt.b.noUsual')}</Text>
      {usual == null && ml == null ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
          {[60, 90, 120, 150, 180].map((n) => <GlassButton key={n} variant="tertiary" size="sm" label={tr('qt.b.ml', { n })} testID={`qt-bottle-quick-preset-${n}`} onPress={() => setQty(n)} />)}
        </View>
      ) : null}
      <GlassButton variant="primary" size="lg" full icon="check" testID="qt-bottle-quick-save" disabled={ml == null || busy}
        label={ml == null ? tr('qt.b.chooseQty') : tr('qt.b.save', { ml, time: clock(at) })} onPress={save} />
      {undo ? (
        <Tappable accessibilityRole="button" onPress={cancel} testID="qt-bottle-quick-undo"
          style={({ pressed }) => ({ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 14, opacity: pressed ? 0.6 : 1 })}>
          <Icon name="rotate-ccw" size={14} color={t.colors.primary} />
          <Text variant="small" weight="bold" color={t.colors.primary}>{tr('qt.b.undo')}</Text>
        </Tappable>
      ) : null}
    </Glass>
  );
}

// ------------------------------------------------------------------ dernier biberon + historique
export function BottleLog({ child, bottles, focusId, onFocusDone }: { child: Child; bottles: readonly BottleRow[]; focusId?: string | null; onFocusDone?: () => void }) {
  const t = useTheme();
  const now = useNow(30_000);
  const taken = useMemo(() => bottles.filter((b) => b.child_id === child.id && !b.in_progress).sort((a, b) => b.at.localeCompare(a.at)), [bottles, child.id]);
  const last = lastBottle(taken, child.id, now);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  // Lien direct vers un biberon (catégorie, accueil) : sa fiche s'ouvre une fois les données arrivées
  useEffect(() => {
    if (!focusId || !taken.some((b) => b.id === focusId && !b._pending)) return;
    setOpenId(focusId); setVisible(true); onFocusDone?.();
  }, [focusId, taken]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = dayKey(now); const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const recent = taken.filter((b) => { const k = dayKey(new Date(b.at)); return k === today || k === yesterday; });
  const groups = [today, yesterday].map((k) => ({ k, rows: recent.filter((b) => dayKey(new Date(b.at)) === k) })).filter((g) => g.rows.length);
  const selected = taken.find((b) => b.id === openId) ?? null;
  const open = (id: string) => { haptic('selection'); setOpenId(id); setVisible(true); };

  return (
    <View style={{ gap: spacing.sm }} testID="qt-bottle-log">
      {last ? (
        <Tappable accessibilityRole="button" testID="qt-bottle-last" onPress={() => open(last.id)} disabled={!!last._pending}
          accessibilityLabel={`${tr('qt.b.lastTitle', { name: child.first_name })}. ${mlText(last.consumed_ml)}. ${clock(new Date(last.at))}. ${agoLabel(last.at, now)}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('qt.b.lastTitle', { name: child.first_name })}</Text>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Text testID="qt-bottle-last-ml" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1 }, HERO_FONT, { color: t.colors.text }, TABULAR]}>{mlText(last.consumed_ml)}</Text>
              <Text weight="bold" style={TABULAR}>{tr('qt.b.atClock', { time: clock(new Date(last.at)) })}</Text>
            </View>
            <Text variant="small" muted testID="qt-bottle-last-ago">{agoLabel(last.at, now)}</Text>
          </Glass>
        </Tappable>
      ) : (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md }} testID="qt-bottle-none">
          <Text variant="small" muted>{tr('qt.b.none', { name: child.first_name })}</Text>
        </Glass>
      )}
      {groups.length ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="qt-bottle-history">
          {groups.map((g) => (
            <View key={g.k} style={{ gap: 2 }}>
              <Text variant="label" style={{ marginTop: 4 }}>{g.k === today ? tr('qt.today') : tr('qt.yesterday')}</Text>
              {g.rows.map((b) => (
                <Tappable key={b.id} accessibilityRole="button" testID={`qt-bottle-row-${b.id}`} onPress={() => open(b.id)} disabled={!!b._pending}
                  accessibilityLabel={`${clock(new Date(b.at))}, ${mlText(b.consumed_ml)}. ${tr('qt.openToFix')}`}
                  style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
                  <Text weight="bold" style={[{ width: 72 }, TABULAR]}>{clock(new Date(b.at))}</Text>
                  <Text style={[{ flex: 1 }, TABULAR]}>{[mlText(b.consumed_ml), b.prepared_ml != null ? tr('qt.b.preparedShort', { n: b.prepared_ml }) : null].filter(Boolean).join(' · ')}</Text>
                  {b.note ? <Icon name="message-square" size={14} color={t.colors.primary} /> : null}
                  {/* Noté hors ligne, encore en file : son identifiant n'existe pas encore sur le serveur, pas de correction */}
                  {b._pending ? <Text variant="caption" muted>{tr('qt.pending')}</Text> : <Icon name="chevron-right" size={16} color={t.colors.textMuted} />}
                </Tappable>
              ))}
            </View>
          ))}
          <GlassButton variant="tertiary" size="sm" icon="list" label={tr('qt.b.allHistory')} testID="qt-bottle-all" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
            onPress={() => router.push({ pathname: '/bottle/history', params: { child: child.id } } as never)} />
        </Glass>
      ) : null}
      <BottleEntryTray child={child} bottle={selected} open={visible && !!selected} onOpenChange={setVisible} />
    </View>
  );
}

const HERO_FONT = { fontFamily: HERO.fontFamily };

// ------------------------------------------------------------------ fiche d'un biberon
export function BottleEntryTray({ child, bottle, open, onOpenChange }: { child: Child; bottle: BottleRow | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!bottle) return null;
  const at = new Date(bottle.at);
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="qt-bottle-tray" title={tr('qt.b.trayTitle', { name: child.first_name })}
      hero={mlText(bottle.consumed_ml)}
      lines={[
        tr('qt.b.atClock', { time: clock(at) }) + ` · ${formatDate(at, { weekday: 'long', day: 'numeric', month: 'long' })}`,
        bottle.prepared_ml != null ? tr('qt.b.prepared', { n: bottle.prepared_ml }) : null,
        bottle.milk_type ? bottle.milk_type : null,
        bottle.note ? tr('qt.note', { note: bottle.note }) : null,
      ]}
      editLabel={tr('qt.b.fix')}
      editor={<BottleEditView key={`${bottle.id}:${bottle.at}:${bottle.consumed_ml}`} bottle={bottle} />}
      onFullForm={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: child.id, id: bottle.id } } as never)} />
  );
}

function BottleEditView({ bottle }: { bottle: BottleRow }) {
  const t = useTheme();
  const { goBack } = useTray();
  const edit = useEditLog('bottle');
  const at0 = new Date(bottle.at);
  const [text, setText] = useState(hhmm(at0));
  const [ml, setMl] = useState<number | null>(bottle.consumed_ml);
  const g = useGuardedSave();
  const at = proposedTime(bottle.at, text);
  const qtyErr = bottleEditError({ consumed: ml, prepared: bottle.prepared_ml });
  const changed = (!!at && at.getTime() !== at0.getTime()) || ml !== bottle.consumed_ml;
  const step = (d: number) => { const b = at ?? at0; const n = new Date(b.getTime() + d * MIN); if (n.getTime() <= Date.now()) setText(hhmm(n)); g.setError(null); };
  const cancel = () => { setText(hhmm(at0)); setMl(bottle.consumed_ml); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (!at || qtyErr) return tr('qt.edit.invalid');
    const res = await edit(bottle.id, { at: at.toISOString(), consumed_ml: ml }, bottle as unknown as Record<string, unknown>);
    if (res === 'changed') return tr('qt.edit.changedMeanwhile');
    haptic('success');
    goBack();
    return 'ok';
  });
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="qt-bottle-editor">
      <EditHeader title={tr('qt.b.fixTitle')} />
      <Text testID="qt-bottle-edit-ml" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[HERO, { color: t.colors.text, textAlign: 'center' }, TABULAR]}>{ml == null ? tr('qt.b.mlUnknown') : tr('qt.b.ml', { n: ml })}</Text>
      <Text weight="bold" center style={TABULAR} testID="qt-bottle-edit-proposed">
        {changed && at ? tr('qt.b.proposed', { qty: mlText(ml), time: clock(at) }) : tr('qt.b.recorded', { qty: mlText(bottle.consumed_ml), time: clock(at0) })}
      </Text>
      {changed ? <Text variant="small" muted center testID="qt-bottle-edit-before">{tr('qt.b.before', { qty: mlText(bottle.consumed_ml), time: clock(at0) })}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="lg" full label={tr('qt.b.minus10')} testID="qt-bottle-edit-minus" disabled={ml == null || ml <= 0} onPress={() => { setMl(clampMl((ml ?? 0) - 10)); g.setError(null); }} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="secondary" size="lg" full label={tr('qt.b.plus10')} testID="qt-bottle-edit-plus" disabled={ml != null && ml >= 500} onPress={() => { setMl(clampMl((ml ?? 0) + 10)); g.setError(null); }} /></View>
      </View>
      {qtyErr === 'over' ? <Text variant="small" color={t.colors.danger} testID="qt-bottle-edit-over">{tr('qt.b.overPrepared', { n: bottle.prepared_ml ?? 0 })}</Text> : null}
      <TimeEditor text={text} onText={(v) => { setText(v); g.setError(null); }} onStep={step} valid={!!at} testID="qt-bottle-edit" />
      <EditActions onCancel={cancel} onSave={save} canSave={changed && !!at && !qtyErr} busy={g.busy} error={g.error} testID="qt-bottle-edit" />
    </View>
  );
}

// ------------------------------------------------------------------ accueil
/** Dernier biberon de l'enfant (heure, ml, « il y a … ») ; un toucher ouvre Biberons sur CE biberon. Rien : rien. */
export function BottleHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const now = useNow(60_000);
  const q = useBottleHistory(child.id, 2);
  const last = lastBottle((q.data ?? []) as BottleRow[], child.id, now);
  if (!last) return null;
  const title = tr('qt.b.lastTitle', { name: child.first_name });
  return (
    <Tappable accessibilityRole="button" testID="home-bottle" accessibilityLabel={`${title}. ${mlText(last.consumed_ml)}. ${clock(new Date(last.at))}. ${agoLabel(last.at, now)}. ${tr('qt.b.openApp')}`}
      onPress={() => router.push({ pathname: '/bottle/[childId]', params: { childId: child.id, bottle: last.id } } as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="coffee" size={16} color={t.colors.textMuted} />
          <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2}>{title}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text testID="home-bottle-ml" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1 }, HERO_FONT, { color: t.colors.text }, TABULAR]}>{mlText(last.consumed_ml)}</Text>
          <Text weight="bold" style={TABULAR}>{tr('qt.b.atClock', { time: clock(new Date(last.at)) })}</Text>
        </View>
        <Text variant="small" muted testID="home-bottle-ago">{agoLabel(last.at, now)}</Text>
      </Glass>
    </Tappable>
  );
}
