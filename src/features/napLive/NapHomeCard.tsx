/**
 * Accueil — planche 1 du brief client (« Accueil, Sommeil et Aura ») : section « Aujourd'hui », une carte de verre
 * dense avec le pictogramme dans un support rond, « Sieste en cours », le minuteur HH:MM:SS qui avance à la seconde,
 * « Depuis 13 h 10 » et une seule action « Voir la sieste ». Sieste terminée : « Dernière sieste », « 1 h 25 », heures,
 * note. Dessous, deux tuiles : « Relais parent » et « Journal » (l'entrée « Mes apps » est déjà au-dessus).
 * Un toucher ouvre Sommeil avec CETTE session sélectionnée (« /sleep/<enfant>?nap=<session> »). Rien du jour : la carte
 * ne s'affiche pas (pas de rangée de zéros). Même donnée source que Sommeil, la catégorie et le relais.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { napState } from './NapNow';
import { StageHero } from '@/components/stage/StageHero';
import { isDayNap } from '@/lib/domain/sleepSummary';

/** 2 542 s → « 00:42:22 » (minuteur de la planche : heures sur deux chiffres). */
export function hms(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Horloge à la seconde, seulement pendant une sieste en cours (aucun minuteur inutile sinon). */
function useSecondTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function Tile({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={onPress} style={{ flex: 1 }}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm }}>
        <Icon name={icon} size={22} color={t.colors.text} />
        <Text variant="small" weight="medium" numberOfLines={1}>{label}</Text>
      </Glass>
    </Tappable>
  );
}

export function NapHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const { sleeps, now } = useSleepPlan(child);
  const st = napState(child, (sleeps ?? []) as Sleep[], now);
  // « Dernière sieste » : jamais une nuit (même règle que la catégorie : isDayNap)
  const last = st.open ?? [...st.today].filter((s) => s.ended_at && isDayNap(s)).sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;
  const tick = useSecondTick(!!st.open);
  if (!last) return null;
  const open = !!st.open;
  const startMs = Date.parse(last.started_at);
  const minutes = Math.max(0, Math.round(((last.ended_at ? Date.parse(last.ended_at) : now.getTime()) - startMs) / 60_000));
  const from = clock(new Date(last.started_at));
  const range = tr('nn.tray.range', { from, to: last.ended_at ? clock(new Date(last.ended_at)) : '…' });
  const big = open ? hms((tick - startMs) / 1000) : span(minutes);
  const sub = open ? tr('nn.home.since', { time: from }) : range;
  const title = open ? tr('nn.home.ongoingTitle') : tr('nn.home.lastTitle');
  const openNap = () => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, nap: last.id } } as never);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="title" accessibilityRole="header" testID="home-today-title">{tr('nn.home.today')}</Text>
      {/* Scène « Whoop / Keynote » : minuteur géant sur verre sombre, une seule action */}
      <Tappable accessibilityRole="button" accessibilityLabel={`${title}, ${child.first_name}. ${open ? span(minutes) : big}. ${sub}. ${tr('nn.home.see')}`} testID="home-nap" onPress={openNap}>
        <StageHero eyebrow={`${title} · ${child.first_name}`} value={big} caption={sub} detail={last.note ? `« ${last.note} »` : null}
          a11y={`${title}, ${child.first_name}. ${open ? span(minutes) : big}. ${sub}`} size={open ? 56 : 64} testID="home-nap-stage">
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface }} testID="home-nap-see">
            <Text variant="small" weight="bold">{tr('nn.home.see')}</Text>
            <Icon name="arrow-right" size={14} color={t.colors.text} />
          </View>
        </StageHero>
      </Tappable>
      {/* Deux tuiles de la planche : le relais (lit les mêmes sessions) et les outils */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Tile icon="users" label={tr('nn.home.relay')} testID="home-relay" onPress={() => router.push({ pathname: '/family/relay', params: { child: child.id } } as never)} />
        {/* « Outils » existe déjà juste au-dessus (« Mes apps ») : la seconde tuile ouvre le journal du jour (planche 2) */}
        <Tile icon="list" label={tr('nn.home.dayLog')} testID="home-nap-journal" onPress={() => router.push('/track' as never)} />
      </View>
    </View>
  );
}
