/**
 * Rappels — ce qui sonne ensuite (22/11/2026). Même donnée que la liste (reminders) :
 *  · le prochain rappel actif en grand (« 18 h 30 »), son titre et sa date dessous, « actifs / en pause » ; aucun rappel
 *    actif : « rien de prévu » en pointillé ;
 *  · les prochains rappels (heure en colonne fixe) ; un rappel quotidien ou hebdomadaire → sa fiche (Tray) : corriger
 *    l'heure en valeur provisoire (±5 min), Annuler, Enregistrer verrouillé (écrit par `useSaveReminder`, comme le
 *    formulaire, puis reprogrammation des notifications).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { friendlyError, useSaveReminder } from '@/lib/data/hooks-settings';
import { hmText, parseHm } from '@/lib/domain/homeTrack';
import { describeSchedule, nextOccurrence } from '@/lib/domain/reminders';
import { clock } from '@/lib/domain/sleepPlanner';
import type { Reminder } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero, HmRow } from './kit';

export function ReminderTrack({ reminders, onEdit }: { reminders: readonly Reminder[]; onEdit: (r: Reminder) => void }) {
  const save = useSaveReminder();
  const [openId, setOpenId] = useState<string | null>(null);
  const now = new Date();
  const upcoming = reminders.filter((r) => r.enabled).map((r) => ({ r, at: nextOccurrence(r.schedule, now) })).filter((x): x is { r: Reminder; at: Date } => !!x.at).sort((a, b) => a.at.getTime() - b.at.getTime());
  const next = upcoming[0] ?? null;
  const off = reminders.filter((r) => !r.enabled).length;
  const opened = openId ? reminders.find((r) => r.id === openId) ?? null : null;
  const timed = opened && (opened.schedule.type === 'daily' || opened.schedule.type === 'weekly') ? opened.schedule : null;
  if (!reminders.length) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-rem">
      <HmHero testID="hm-rem-hero" value={next ? clock(next.at) : null} emptyLabel={tr('hm.rem.none')}
        unit={next ? `${next.r.title} · ${formatDate(next.at, { weekday: 'long', day: 'numeric', month: 'short' })}` : null}
        split={[{ label: tr('hm.rem.active'), value: String(reminders.length - off), testID: 'hm-rem-on' }, { label: tr('hm.rem.paused'), value: String(off), testID: 'hm-rem-off' }]} />
      {upcoming.length > 1 ? (
        <View testID="hm-rem-list">
          <Text variant="label" muted>{tr('hm.rem.coming')}</Text>
          {upcoming.slice(0, 5).map(({ r, at }) => (
            <HmRow key={r.id} time={clock(at)} icon="bell" title={r.title} detail={`${formatDate(at, { weekday: 'short', day: 'numeric' })} · ${describeSchedule(r.schedule)}`}
              testID={`hm-rem-row-${r.id}`} onPress={() => (r.schedule.type === 'daily' || r.schedule.type === 'weekly' ? setOpenId(r.id) : onEdit(r))} />
          ))}
        </View>
      ) : null}
      {opened && timed ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenId(null); }} testID="hm-rem-tray"
          title={opened.title} hero={hmText(timed.hour * 60 + timed.minute)} lines={[describeSchedule(opened.schedule), opened.body]}
          editLabel={tr('hm.rem.fix')} onFullForm={() => onEdit(opened)}
          fields={[{ key: 'time', label: tr('hm.rem.time'), kind: 'time' }]}
          initial={{ time: hmText(timed.hour * 60 + timed.minute) }}
          validate={(d) => (parseHm(d.time) == null ? tr('hm.fix.badTime') : null)}
          onSave={async (d) => {
            const m = parseHm(d.time);
            if (m == null) return tr('hm.fix.badTime');
            try {
              await save.mutateAsync({ id: opened.id, draft: { title: opened.title, body: opened.body, category: opened.category, enabled: opened.enabled, deep_link: opened.deep_link,
                pregnancy_id: opened.pregnancy_id, child_id: opened.child_id, shared: opened.shared, schedule: { ...timed, hour: Math.floor(m / 60), minute: m % 60 } } });
              return 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </View>
  );
}
