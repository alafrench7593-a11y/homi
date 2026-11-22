/**
 * Point de couple — suivi par semaine (22/11/2026). Même donnée que le formulaire (couple_checkins) :
 *  · semaine sélectionnée gardée dans l'adresse (« ?week= ») ; questions notées en grand (« 2 sur 3 »), « rien de
 *    noté » si la semaine n'a pas de point ;
 *  · les dernières semaines notées en liste ; une semaine → sa fiche (Tray) : corriger ce qui pèse / ce qu'on décide /
 *    le merci en valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture échoue.
 *  · Mode embrouille actif : aucun texte libre n'est montré (même règle que l'écran), seulement le compte.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { GlassButton } from '@/components/glass';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import type { CoupleCheckin } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { checkinFilled } from '@/lib/domain/homeTrack';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero, HmRow, HmWeekStepper } from './kit';

const weekLabel = (w: string) => tr('hm.cp.weekOf', { date: formatDate(w, { day: 'numeric', month: 'long' }) });

export function CoupleWeekTrack({ week, onWeek, checkins, hidden }: { week: string; onWeek: (w: string) => void; checkins: readonly CoupleCheckin[]; hidden: boolean }) {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const current = checkins.find((c) => c.week_of === week) ?? null;
  const n = checkinFilled(current);
  const recent = [...checkins].filter((c) => checkinFilled(c) != null).sort((a, b) => (a.week_of < b.week_of ? 1 : -1)).slice(0, 6);
  const opened = openWeek ? checkins.find((c) => c.week_of === openWeek) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-cp">
      <HmWeekStepper monday={week} onSelect={onWeek} testID="hm-cp-week" />
      <HmHero testID="hm-cp-hero" value={n == null ? null : String(n)} unit={tr('hm.cp.unit')} emptyLabel={tr('hm.cp.none')}
        caption={current && !hidden && current.decisions ? tr('hm.cp.decided', { text: current.decisions }) : null}>
        {hidden ? null : <GlassButton variant="secondary" icon="edit-2" label={n == null ? tr('hm.cp.note') : tr('hm.cp.fix')} testID="hm-cp-open" onPress={() => setOpenWeek(week)} />}
      </HmHero>
      {recent.length ? (
        <View testID="hm-cp-list">
          <Text variant="label" muted>{tr('hm.cp.recent')}</Text>
          {recent.map((c) => (
            <HmRow key={c.id} time={formatDate(c.week_of, { day: 'numeric', month: 'short' })} icon="message-square" title={weekLabel(c.week_of)}
              detail={tr('hm.cp.filled', { count: checkinFilled(c) ?? 0 })} testID={`hm-cp-row-${c.week_of}`}
              onPress={hidden ? undefined : () => { onWeek(c.week_of); setOpenWeek(c.week_of); }} />
          ))}
        </View>
      ) : null}
      {openWeek && !hidden ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenWeek(null); }} testID="hm-cp-tray"
          title={weekLabel(openWeek)} hero={tr('hm.cp.ratio', { count: checkinFilled(opened) ?? 0 })}
          lines={[opened?.heavy ? tr('hm.cp.heavyL', { text: opened.heavy }) : null, opened?.decisions ? tr('hm.cp.decided', { text: opened.decisions }) : null, opened?.thanks ? tr('hm.cp.thanksL', { text: opened.thanks }) : null]}
          fields={[
            { key: 'heavy', label: tr('cm.cp.heavy'), kind: 'multiline', maxLength: 1000 },
            { key: 'decisions', label: tr('cm.cp.decisions'), kind: 'multiline', maxLength: 2000 },
            { key: 'thanks', label: tr('cm.cp.thanks'), kind: 'text', maxLength: 500 },
          ]}
          initial={{ heavy: opened?.heavy ?? '', decisions: opened?.decisions ?? '', thanks: opened?.thanks ?? '' }}
          onSave={async (d) => {
            if (!hid) return tr('hm.err.noHousehold');
            const row = { heavy: d.heavy.trim() || null, decisions: d.decisions.trim() || null, thanks: d.thanks.trim() || null };
            try {
              if (opened) await backend.update('couple_checkins', row, [eq('id', opened.id)]);
              else await backend.insert('couple_checkins', { ...row, household_id: hid, week_of: openWeek });
              inv('couple_checkins');
              return 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </View>
  );
}
