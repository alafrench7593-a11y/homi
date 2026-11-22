/**
 * Accueil — planche 1 du brief client (« Accueil, Sommeil et Aura ») : section « Aujourd'hui », une carte de verre
 * dense avec le pictogramme dans un support rond, « Sieste en cours », le minuteur HH:MM:SS qui avance à la seconde,
 * « Depuis 13 h 10 » et une seule action « Voir la sieste ». Sieste terminée : « Dernière sieste », « 1 h 25 », heures,
 * note. Dessous, deux tuiles : « Relais parent » et « Outils ».
 * Un toucher ouvre Sommeil avec CETTE session sélectionnée (« /sleep/<enfant>?nap=<session> »). Rien du jour : la carte
 * ne s'affiche pas (pas de rangée de zéros). Même donnée source que Sommeil, la catégorie et le relais.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { napState } from './NapNow';
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
      <Tappable accessibilityRole="button" accessibilityLabel={`${title}, ${child.first_name}. ${open ? span(minutes) : big}. ${sub}. ${tr('nn.home.see')}`} testID="home-nap" onPress={openNap}>
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.lg, gap: spacing.xs }}>
          {/* pictogramme dans un support de verre rond, comme sur la planche */}
          <Glass variant="card" radius={26} style={{ width: 52, height: 52, marginBottom: spacing.xs }} contentStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="moon" size={22} color={t.colors.text} />
          </Glass>
          <Text weight="bold" style={{ fontSize: 20 }} numberOfLines={1}>{title}</Text>
          {/* minuteur : chiffres de largeur fixe pour qu'ils ne dansent pas à chaque seconde */}
          <Text testID="home-nap-duration" maxFontSizeMultiplier={1.3} accessibilityLiveRegion="none"
            style={{ fontSize: 44, lineHeight: 50, letterSpacing: -0.5, fontFamily: fonts.display, color: t.colors.text, fontVariant: ['tabular-nums'] }}>{big}</Text>
          <Text variant="small" muted style={{ fontVariant: ['tabular-nums'] }} testID="home-nap-sub">{sub}</Text>
          {last.note ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="message-square" size={14} color={t.colors.textMuted} />
              <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>{last.note}</Text>
            </View>
          ) : null}
          <GlassButton variant="secondary" size="sm" label={tr('nn.home.see')} testID="home-nap-see" style={{ alignSelf: 'center', marginTop: spacing.sm }} onPress={openNap} />
        </Glass>
      </Tappable>
      {/* Deux tuiles de la planche : le relais (lit les mêmes sessions) et les outils */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Tile icon="users" label={tr('nn.home.relay')} testID="home-relay" onPress={() => router.push({ pathname: '/family/relay', params: { child: child.id } } as never)} />
        <Tile icon="briefcase" label={tr('nn.home.tools')} testID="home-nap-tools" onPress={() => router.push('/tools' as never)} />
      </View>
    </View>
  );
}
