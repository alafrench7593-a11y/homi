/**
 * Espace Nounou — journal de garde d'une journée (22/11/2026). Lit les MÊMES saisies que le carnet (`useCareDay` :
 * biberons, repas, siestes, couches, observations, arrivées / départs / activités, photos) ; rien n'est recopié :
 *  · jour gardé dans l'adresse (« ?day= »), jour précédent / suivant (jamais après aujourd'hui) ;
 *  · nombre de saisies du jour en grand, « Rien de noté » en pointillé sinon (jamais 0) ;
 *  · liste : heure en colonne fixe à gauche, pictogramme, type + détail, auteur, chevron ;
 *  · fiche (Tray) : corriger l'heure (même jour) et la note — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé,
 *    brouillon gardé si l'écriture échoue. Les saisies du suivi passent par `guardedLogUpdate` (même chemin que le
 *    formulaire complet : réseau exigé, entrée inchangée depuis son ouverture) ; une photo ou une saisie encore en file
 *    ne se corrige pas ici.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Card, haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { backend, eq, type Filter } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { editGuards, guardedLogUpdate } from '@/lib/data/hooks-quickTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import { hmText, minutesOf, parseHm } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, shiftDay } from '@/lib/domain/journalTrack';
import type { CareItem } from '@/lib/domain/nounou';
import { carePatch, careEditSpec, type CareEditSpec } from '@/lib/domain/restTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import type { LogKind } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius } from '@/theme/tokens';
import { itemDetail, KIND_ICON, KIND_LABEL } from '@/features/nounou/CareUI';
import { HmEmpty, HmFixTray, HmHero, HmRow, TABULAR } from '@/features/homeTrack/kit';

const LOG_OF: Record<string, LogKind | undefined> = { bottles: 'bottle', meals: 'meal', sleeps: 'sleep', diapers: 'diaper', child_observations: 'observation' };

/** Jour précédent / suivant ; « suivant » indisponible au-delà d'aujourd'hui. */
export function CareDayStepper({ day, onSelect }: { day: string; onSelect: (d: string) => void }) {
  const t = useTheme();
  const today = isoDay(new Date());
  const canNext = day < today;
  const pick = (d: string) => { haptic('selection'); onSelect(d); };
  const label = day === today ? tr('rs.care.today') : formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <Glass variant="card" radius={radius.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }} testID="rs-care-days">
      <Tappable accessibilityRole="button" accessibilityLabel={tr('rs.care.prev')} testID="rs-care-prev" onPress={() => pick(shiftDay(day, -1))}
        style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-left" size={22} color={t.colors.text} />
      </Tappable>
      <Text weight="bold" center style={[{ flex: 1 }, TABULAR]} accessibilityRole="header" testID="rs-care-day">{label}</Text>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('rs.care.next')} accessibilityState={{ disabled: !canNext }} disabled={!canNext} testID="rs-care-next"
        onPress={() => pick(shiftDay(day, 1))} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.3 }}>
        <Icon name="chevron-right" size={22} color={t.colors.text} />
      </Tappable>
    </Glass>
  );
}

export function CareDayHero({ items, day, authorOf }: { items: CareItem[]; day: string; authorOf: (id: string | null, origin: string | null) => string }) {
  const last = items[0];
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <HmHero testID="rs-care-hero" value={items.length ? String(items.length) : null} unit={tr('rs.care.unit', { count: items.length, day: dayLabel })}
      emptyLabel={tr('rs.care.none', { day: dayLabel })}
      caption={last ? tr('rs.care.last', { time: clock(new Date(last.at)), who: authorOf(last.authorId, last.origin) }) : null} />
  );
}

export function CareJournal({ items, authorOf, loading }: { items: CareItem[]; authorOf: (id: string | null, origin: string | null) => string; loading?: boolean }) {
  const t = useTheme();
  const inv = useInvalidate();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = items.find((it) => `${it.kind}-${it.id}` === openKey) ?? null;
  const spec: CareEditSpec | null = open ? careEditSpec(open.kind, open.pending) : null;
  if (!items.length) return loading ? null : <HmEmpty testID="rs-care-empty" />;
  return (
    <>
      <Card testID="rs-care-list">
        {items.map((it) => {
          const label = it.important ? tr('nn.kind.important') : tr(KIND_LABEL[it.kind]);
          const editable = !!careEditSpec(it.kind, it.pending);
          const detail = [itemDetail(it), tr('nn.by', { name: authorOf(it.authorId, it.origin) }), it.pending ? tr('nn.pending') : null].filter(Boolean).join(' · ');
          return (
            <View key={`${it.kind}-${it.id}`} style={it.important ? { borderLeftWidth: 3, borderLeftColor: t.colors.danger, paddingLeft: 6 } : undefined}>
              <HmRow testID={`rs-care-row-${it.kind}`} time={clock(new Date(it.at))} icon={it.important ? 'alert-triangle' : KIND_ICON[it.kind]} title={label} detail={detail}
                onPress={editable ? () => setOpenKey(`${it.kind}-${it.id}`) : undefined} />
            </View>
          );
        })}
      </Card>
      {open && spec ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenKey(null); }} testID="rs-care-tray"
          title={open.important ? tr('nn.kind.important') : tr(KIND_LABEL[open.kind])} hero={clock(new Date(open.at))}
          lines={[itemDetail(open) || null, tr('nn.by', { name: authorOf(open.authorId, open.origin) }), formatDate(open.at, { weekday: 'long', day: 'numeric', month: 'long' })]}
          editTitle={tr('rs.care.fixTitle', { what: tr(KIND_LABEL[open.kind]) })}
          fields={[
            { key: 'time', label: open.kind === 'sleep' ? tr('rs.care.sleepStart') : tr('rs.time'), kind: 'time' },
            { key: 'note', label: tr('rs.note.label'), kind: 'multiline', maxLength: 1000 },
          ]}
          initial={{ time: hmText(minutesOf(String(open.row[spec.timeCol]))), note: typeof open.row[spec.noteCol] === 'string' ? String(open.row[spec.noteCol]) : '' }}
          validate={(d) => (parseHm(d.time) == null ? tr('rs.badTime') : null)}
          onSave={async (d) => {
            const res = carePatch(spec, open.row, { time: d.time ?? '', note: d.note ?? '' }, new Date());
            if ('error' in res) return tr(`rs.care.err.${res.error}` as TKey);
            if (!Object.keys(res.patch).length) return 'ok';
            try {
              const kind = LOG_OF[spec.table];
              if (kind) {
                const r = await guardedLogUpdate(kind, open.id, res.patch, open.row);
                inv('care_day', spec.table);
                return r === 'changed' ? tr('rs.changedMeanwhile') : 'ok';
              }
              const rows = await backend.update(spec.table, res.patch, [eq('id', open.id), ...(editGuards(res.patch, open.row) as Filter[])]);
              inv('care_day', spec.table);
              return Array.isArray(rows) && rows.length === 0 ? tr('rs.changedMeanwhile') : 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </>
  );
}
