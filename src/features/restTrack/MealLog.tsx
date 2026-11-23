/**
 * Repas d'un enfant — journal (22/11/2026). Lit les MÊMES lignes que le formulaire « Repas » du suivi (`meals` de CET
 * enfant, via `useLogs`) et que le carnet de garde ; rien n'est recopié :
 *  · repas notés le jour choisi en grand (jour gardé dans l'adresse « ?day= ») ; « Rien de noté » en pointillé,
 *    jamais 0 ; semaine touchable (un repère par jour) ;
 *  · liste : heure en colonne fixe, aliments ou description, texture, note ;
 *  · fiche (Tray) : corriger l'heure, les aliments et la note — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé,
 *    brouillon gardé si l'écriture échoue ; écrit par `useEditLog('meal')` (même chemin que le formulaire complet).
 * Aucune quantité conseillée, aucune déduction d'allergie à partir d'une note.
 */
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Card } from '@/components/ui';
import { GlassButton } from '@/components/glass';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { useEditLog } from '@/lib/data/hooks-quickTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import { countByDay, hmText, minutesOf, parseHm } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { mealLine, mealPatch, mealsOfDay, type MealLike } from '@/lib/domain/restTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { HmEmpty, HmFixTray, HmHero, HmRow, HmWeek, useUrlDay } from '@/features/homeTrack/kit';

const textureLabel = (x: string | null | undefined) => (x ? tr(`rs.meal.tex.${x}` as TKey) : null);

export function MealLog({ childId, childName }: { childId: string; childName: string }) {
  const q = useLogs<MealLike>('meal', childId, 60, { includePending: true });
  const edit = useEditLog('meal');
  const [day, setDay] = useUrlDay();
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const today = mealsOfDay(list, day);
  const marks = useMemo(() => countByDay(list, weekDays(day), (m) => isoDay(new Date(m.at))), [list, day]);
  const open = list.find((m) => m.id === openId) ?? null;
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  const add = () => router.push({ pathname: '/track/[kind]', params: { kind: 'meal', child: childId } });
  return (
    <>
      <HmHero testID="rs-meal-hero" value={today.length ? String(today.length) : null}
        unit={tr('rs.meal.unit', { count: today.length, name: childName, day: dayLabel })}
        emptyLabel={tr('rs.meal.none', { day: dayLabel })}
        caption={today.length ? tr('rs.meal.last', { time: clock(new Date(today[today.length - 1].at)) }) : null}>
        <GlassButton variant="secondary" icon="plus" label={tr('rs.meal.add')} testID="rs-meal-add" onPress={add} />
      </HmHero>
      <HmWeek testID="rs-meal-week" day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('rs.meal.count', { count: n })} />
      {today.length ? (
        <Card testID="rs-meal-list">
          {today.map((m) => (
            <HmRow key={m.id} testID={`rs-meal-${m.id}`} time={clock(new Date(m.at))} icon="coffee"
              title={mealLine(m) ?? tr('rs.meal.untitled')}
              detail={[textureLabel(m.texture), m.reaction_note].filter(Boolean).join(' · ') || null}
              onPress={(m as { _pending?: boolean })._pending ? undefined : () => setOpenId(m.id)} />
          ))}
        </Card>
      ) : <HmEmpty testID="rs-meal-empty" label={tr('rs.meal.none', { day: dayLabel })} />}
      {open ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenId(null); }} testID="rs-meal-tray"
          title={tr('rs.meal.trayTitle', { name: childName })} hero={clock(new Date(open.at))}
          lines={[mealLine(open) ?? tr('rs.meal.untitled'), formatDate(open.at, { weekday: 'long', day: 'numeric', month: 'long' }), textureLabel(open.texture), open.reaction_note ? tr('rs.note', { note: open.reaction_note }) : null]}
          editTitle={tr('rs.meal.fixTitle')}
          onFullForm={() => router.push({ pathname: '/track/[kind]', params: { kind: 'meal', id: open.id, child: childId } })}
          fields={[
            { key: 'time', label: tr('rs.time'), kind: 'time' },
            { key: 'foods', label: tr('rs.meal.foods'), kind: 'text', maxLength: 400, hint: tr('rs.meal.foodsHint') },
            { key: 'note', label: tr('rs.note.label'), kind: 'multiline', maxLength: 1000 },
          ]}
          initial={{ time: hmText(minutesOf(open.at)), foods: (open.foods ?? []).join(', '), note: open.reaction_note ?? '' }}
          validate={(d) => (parseHm(d.time) == null ? tr('rs.badTime') : null)}
          onSave={async (d) => {
            const patch = mealPatch(open, { time: d.time ?? '', foods: d.foods ?? '', note: d.note ?? '' });
            if (!patch) return tr('rs.badTime');
            if (!Object.keys(patch).length) return 'ok';
            try {
              const res = await edit(open.id, patch, open as unknown as Record<string, unknown>);
              return res === 'changed' ? tr('rs.changedMeanwhile') : 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </>
  );
}
