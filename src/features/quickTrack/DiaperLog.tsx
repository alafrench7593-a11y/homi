/**
 * Couches — journal rapide d'un enfant (mini-app `/track/diaper`, sous les tuiles « en un geste » existantes) :
 * dernier change en évidence (type, heure, « il y a … »), historique horodaté d'aujourd'hui et d'hier ; toucher une
 * ligne ouvre sa fiche (Tray) pour corriger l'heure ou le type. `focusId` ouvre directement la fiche d'un change
 * (lien depuis la catégorie Soins). Écriture : même chemin que le formulaire (`guardedLogUpdate`).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { useEditLog } from '@/lib/data/hooks-quickTrack';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock } from '@/lib/domain/sleepPlanner';
import { dayKey, diaperPatch, diaperType, hhmm, lastDiaper, proposedTime, type DiaperType } from '@/lib/domain/quickTrack';
import type { Child, Diaper } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, TimeEditor, useGuardedSave } from './EntryTray';

const MIN = 60_000;
export const diaperLabel = (t: DiaperType) => tr(`qt.d.type.${t}` as TKey);
export const DIAPER_ICON: Record<DiaperType, IconName> = { wet: 'droplet', stool: 'circle', both: 'layers', none: 'minus' };

export function DiaperLog({ child, focusId, onFocusDone }: { child: Child; focusId?: string | null; onFocusDone?: () => void }) {
  const t = useTheme();
  const now = useNow(30_000);
  const q = useLogs<Diaper>('diaper', child.id, 3);
  const rows = useMemo(() => (q.data ?? []).filter((d) => d.child_id === child.id).sort((a, b) => b.at.localeCompare(a.at)), [q.data, child.id]);
  const last = lastDiaper(rows, child.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!focusId || !rows.some((d) => d.id === focusId)) return;
    setOpenId(focusId); setVisible(true); onFocusDone?.();
  }, [focusId, rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = dayKey(now); const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const groups = [today, yesterday].map((k) => ({ k, rows: rows.filter((d) => dayKey(new Date(d.at)) === k) })).filter((g) => g.rows.length);
  const selected = rows.find((d) => d.id === openId) ?? null;
  const open = (id: string) => { haptic('selection'); setOpenId(id); setVisible(true); };
  if (!last) return null;
  const lt = diaperType(last);
  return (
    <View style={{ gap: spacing.sm }} testID="qt-diaper-log">
      <Tappable accessibilityRole="button" testID="qt-diaper-last" onPress={() => open(last.id)}
        accessibilityLabel={`${tr('qt.d.lastTitle', { name: child.first_name })}. ${diaperLabel(lt)}. ${clock(new Date(last.at))}. ${agoLabel(last.at, now)}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('qt.d.lastTitle', { name: child.first_name })}</Text>
            <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Text testID="qt-diaper-last-ago" maxFontSizeMultiplier={1.3} style={[{ fontSize: 34, lineHeight: 40, letterSpacing: -1, fontFamily: HERO.fontFamily, color: t.colors.text }, TABULAR]}>{agoLabel(last.at, now)}</Text>
          </View>
          <Text weight="bold" style={TABULAR} testID="qt-diaper-last-what">{tr('qt.d.whatAt', { what: diaperLabel(lt), time: clock(new Date(last.at)) })}</Text>
        </Glass>
      </Tappable>
      {groups.length ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="qt-diaper-history">
          {groups.map((g) => (
            <View key={g.k} style={{ gap: 2 }}>
              <Text variant="label" style={{ marginTop: 4 }}>{g.k === today ? tr('qt.today') : tr('qt.yesterday')}{` · ${tr('qt.d.count', { count: g.rows.length })}`}</Text>
              {g.rows.map((d) => {
                const ty = diaperType(d);
                return (
                  <Tappable key={d.id} accessibilityRole="button" testID={`qt-diaper-row-${d.id}`} onPress={() => open(d.id)}
                    accessibilityLabel={`${clock(new Date(d.at))}, ${diaperLabel(ty)}. ${tr('qt.openToFix')}`}
                    style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
                    <Text weight="bold" style={[{ width: 72 }, TABULAR]}>{clock(new Date(d.at))}</Text>
                    <Icon name={DIAPER_ICON[ty]} size={16} color={t.colors.textMuted} />
                    <Text style={{ flex: 1 }}>{diaperLabel(ty)}</Text>
                    {d.note ? <Icon name="message-square" size={14} color={t.colors.primary} /> : null}
                    <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
                  </Tappable>
                );
              })}
            </View>
          ))}
        </Glass>
      ) : null}
      <DiaperEntryTray child={child} diaper={selected} open={visible && !!selected} onOpenChange={setVisible} />
    </View>
  );
}

export function DiaperEntryTray({ child, diaper, open, onOpenChange }: { child: Child; diaper: Diaper | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!diaper) return null;
  const at = new Date(diaper.at);
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="qt-diaper-tray" title={tr('qt.d.trayTitle', { name: child.first_name })}
      hero={diaperLabel(diaperType(diaper))}
      lines={[
        tr('qt.b.atClock', { time: clock(at) }) + ` · ${formatDate(at, { weekday: 'long', day: 'numeric', month: 'long' })}`,
        diaper.note ? tr('qt.note', { note: diaper.note }) : null,
      ]}
      editLabel={tr('qt.d.fix')}
      editor={<DiaperEditView key={`${diaper.id}:${diaper.at}:${diaper.wet}:${diaper.stool}`} diaper={diaper} />}
      onFullForm={() => router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: child.id, id: diaper.id } } as never)} />
  );
}

type EditType = Exclude<DiaperType, 'none'>;

function DiaperEditView({ diaper }: { diaper: Diaper }) {
  const t = useTheme();
  const { goBack } = useTray();
  const edit = useEditLog('diaper');
  const at0 = new Date(diaper.at);
  const type0 = diaperType(diaper);
  const [text, setText] = useState(hhmm(at0));
  const [type, setType] = useState<EditType>(type0 === 'none' ? 'wet' : type0);
  const g = useGuardedSave();
  const at = proposedTime(diaper.at, text);
  const changed = (!!at && at.getTime() !== at0.getTime()) || type !== type0;
  const step = (d: number) => { const b = at ?? at0; const n = new Date(b.getTime() + d * MIN); if (n.getTime() <= Date.now()) setText(hhmm(n)); g.setError(null); };
  const cancel = () => { setText(hhmm(at0)); setType(type0 === 'none' ? 'wet' : type0); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (!at) return tr('qt.edit.invalid');
    const patch: Record<string, unknown> = { at: at.toISOString() };
    if (type !== type0) Object.assign(patch, diaperPatch(type));
    const res = await edit(diaper.id, patch, diaper as unknown as Record<string, unknown>);
    if (res === 'changed') return tr('qt.edit.changedMeanwhile');
    haptic('success');
    goBack();
    return 'ok';
  });
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="qt-diaper-editor">
      <EditHeader title={tr('qt.d.fixTitle')} />
      <Text testID="qt-diaper-edit-type" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[HERO, { color: t.colors.text, textAlign: 'center', fontSize: 44, lineHeight: 50 }]}>{diaperLabel(type)}</Text>
      <Text weight="bold" center style={TABULAR} testID="qt-diaper-edit-proposed">
        {changed && at ? tr('qt.d.proposed', { what: diaperLabel(type), time: clock(at) }) : tr('qt.d.recorded', { what: diaperLabel(type0), time: clock(at0) })}
      </Text>
      {changed ? <Text variant="small" muted center testID="qt-diaper-edit-before">{tr('qt.d.before', { what: diaperLabel(type0), time: clock(at0) })}</Text> : null}
      <GlassSegmentedControl testID="qt-diaper-edit-kind" label={tr('qt.d.typeLabel')} value={type} onChange={(v) => { setType(v); g.setError(null); }}
        options={(['wet', 'stool', 'both'] as EditType[]).map((v) => ({ value: v, label: diaperLabel(v), testID: `qt-diaper-edit-${v}` }))} />
      {type0 !== 'none' && type0 !== type && type === 'wet' && diaper.stool ? <Text variant="caption" muted>{tr('qt.d.stoolDetailsCleared')}</Text> : null}
      <TimeEditor text={text} onText={(v) => { setText(v); g.setError(null); }} onStep={step} valid={!!at} testID="qt-diaper-edit" />
      <EditActions onCancel={cancel} onSave={save} canSave={changed && !!at} busy={g.busy} error={g.error} testID="qt-diaper-edit" />
    </View>
  );
}
