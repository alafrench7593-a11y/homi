/**
 * Calendrier déplié sous un champ date (audit final du 23/11/2026) : « Aujourd'hui », « Hier », mois précédent /
 * suivant, choix direct de l'année (date de naissance sans défilement interminable), grille du mois. Aucune fenêtre
 * modale (le champ est souvent déjà dans une feuille) : pas de double fenêtre, pas de conflit avec le clavier.
 * La saisie au clavier JJ/MM/AAAA reste possible ; le calendrier écrit dans le même champ.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Tappable } from './Tappable';
import { Icon, Text } from './ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';
import { addDays, monthGrid, parseFr, shiftMonth, todayYmd, yearRange, ymdKey, ymdToFr, type Ymd } from '@/lib/domain/calendarGrid';

const CELL = 40;

export function InlineCalendar({ value, onPick, testID = 'inline-calendar' }: { value: string; onPick: (fr: string) => void; testID?: string }) {
  const t = useTheme();
  const today = todayYmd();
  const picked = parseFr(value);
  const [view, setView] = useState(() => ({ y: (picked ?? today).y, m: (picked ?? today).m }));
  const [years, setYears] = useState(false);
  const loc = localeTag();
  const title = useMemo(() => new Date(view.y, view.m, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' }), [view, loc]);
  // Initiales des jours, lundi en premier (5 janvier 2026 = lundi)
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 5 + i).toLocaleDateString(loc, { weekday: 'narrow' })), [loc]);
  const pick = (v: Ymd) => onPick(ymdToFr(v));
  const same = (a: Ymd | null, b: Ymd) => !!a && ymdKey(a) === ymdKey(b);

  const chip = (label: string, onPress: () => void, id: string) => (
    <Tappable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={`${testID}-${id}`}
      style={{ minHeight: 36, paddingHorizontal: spacing.sm, borderRadius: 18, justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
      <Text variant="small" weight="bold">{label}</Text>
    </Tappable>
  );
  const nav = (dir: -1 | 1) => (
    <Tappable accessibilityRole="button" accessibilityLabel={tr(dir < 0 ? 'cal.prev' : 'cal.next')} onPress={() => setView(shiftMonth(view.y, view.m, dir))} testID={`${testID}-${dir < 0 ? 'prev' : 'next'}`}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }}>
      <Icon name={dir < 0 ? 'chevron-left' : 'chevron-right'} size={20} color={t.colors.text} />
    </Tappable>
  );

  return (
    <View testID={testID} style={{ gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
        {chip(tr('cal.today'), () => { setView({ y: today.y, m: today.m }); pick(today); }, 'today')}
        {chip(tr('cal.yesterday'), () => { const y = addDays(today, -1); setView({ y: y.y, m: y.m }); pick(y); }, 'yesterday')}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {nav(-1)}
        <Tappable accessibilityRole="button" accessibilityLabel={tr('cal.pickYear', { title })} onPress={() => setYears((v) => !v)} testID={`${testID}-title`}
          style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}>
          <Text weight="bold" style={{ textTransform: 'capitalize' }}>{title}</Text>
          <Icon name={years ? 'chevron-up' : 'chevron-down'} size={16} color={t.colors.textMuted} />
        </Tappable>
        {nav(1)}
      </View>
      {years ? (
        // Années : de 1930 à l'an prochain, la plus récente en premier (naissance d'un parent comme d'un enfant)
        <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} testID={`${testID}-years`}>
          {yearRange(1930, today.y + 1).map((y) => (
            <Tappable key={y} accessibilityRole="button" accessibilityState={{ selected: y === view.y }} accessibilityLabel={String(y)} onPress={() => { setView({ y, m: view.m }); setYears(false); }}
              testID={`${testID}-year-${y}`}
              style={{ width: 68, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: y === view.y ? t.colors.primary : t.colors.surfaceAlt }}>
              <Text weight="bold" color={y === view.y ? t.tokens.action.text : t.colors.text}>{y}</Text>
            </Tappable>
          ))}
        </ScrollView>
      ) : (
        <View>
          <View style={{ flexDirection: 'row' }}>
            {weekdays.map((w, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{w}</Text>)}
          </View>
          {monthGrid(view.y, view.m).map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row' }}>
              {week.map((d, di) => {
                if (!d) return <View key={di} style={{ flex: 1, height: CELL }} />;
                const day = { y: view.y, m: view.m, d };
                const sel = same(picked, day);
                const isToday = same(today, day);
                return (
                  <Tappable key={di} accessibilityRole="button" accessibilityState={{ selected: sel }}
                    accessibilityLabel={new Date(day.y, day.m, d).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    onPress={() => pick(day)} testID={`${testID}-day-${d}`}
                    style={{ flex: 1, height: CELL, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: sel ? t.colors.primary : 'transparent', borderWidth: isToday && !sel ? 1 : 0, borderColor: t.colors.text }}>
                      <Text weight={sel || isToday ? 'bold' : 'regular'} color={sel ? t.tokens.action.text : t.colors.text}>{d}</Text>
                    </View>
                  </Tappable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
