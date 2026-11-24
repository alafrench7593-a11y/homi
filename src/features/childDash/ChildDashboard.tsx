/**
 * Tableau de bord de l'enfant (onglet Enfant, 24/11/2026 — organisation demandée par la propriétaire, maquette « Léa »).
 *  1. En-tête : avatar, prénom, âge, dernière taille et dernier poids NOTÉS (rien si non mesuré) ;
 *  2. Grille de 8 accès : les outils du catalogue disponibles pour cet enfant (sommeil, biberon, allaitement, croissance,
 *     dents, couches, santé), puis « Plus » ;
 *  3. « Aujourd'hui » : les dernières saisies du jour, à leur heure ;
 *  4. « Synthèse du jour » : uniquement des faits calculés sur les saisies (aucun « bon rythme », aucune note).
 * Aucune IA, aucun crédit. Les totaux reposent sur `summarizeDay` (« non renseigné » n'est jamais « zéro »).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Icon, Row, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { AnimatedProgressRing } from '@/components/motion/AnimatedProgressRing';
import { ChildAvatar } from '@/features/childAvatar';
import { useMeasurements } from '@/lib/data/hooks';
import { useCareDay } from '@/lib/data/hooks-nounou';
import { useRecentFeeds } from '@/lib/data/hooks-feeding';
import { childAge } from '@/lib/domain/child';
import { formatDuration, formatTime, todayISO } from '@/lib/domain/dates';
import { summarizeDay } from '@/lib/domain/nounou';
import { todaySleepMinutes } from '@/lib/domain/childDash';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import type { Child } from '@/lib/types';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

/** Grille (maquette) : outil du catalogue → nom court ; croissance = onglet de la fiche de l'enfant. Un outil absent pour
 *  cet âge est sauté ; 7 tuiles au plus, puis « Plus ». */
export const DASH_TOOLS: { id: string; label: string; icon?: IconName; href?: (childId: string) => string }[] = [
  { id: 'kid_sleep_rhythm', label: 'cd.tile.sleep' },
  { id: 'baby_bottle_timer', label: 'cd.tile.bottle' },
  { id: 'baby_breastfeed', label: 'cd.tile.feed' },
  { id: 'kid_profile', label: 'cd.tile.growth', icon: 'trending-up', href: (id) => `/child/${id}?tab=croissance` },
  { id: 'kid_teeth', label: 'cd.tile.teeth' },
  { id: 'baby_diaper', label: 'cd.tile.diapers' },
  { id: 'kid_health', label: 'cd.tile.health' },
  { id: 'baby_foods', label: 'cd.tile.foods' },
];

export function dashTools(catalog: readonly Pick<CatalogTool, 'id'>[], max = 7) {
  const have = new Set(catalog.map((c) => c.id));
  return DASH_TOOLS.filter((d) => have.has(d.id)).slice(0, max);
}

const KIND_ICON: Record<string, IconName> = { sleep: 'moon', bottle: 'droplet', feed: 'heart', diaper: 'wind', meal: 'coffee', observation: 'thermometer' };

export function ChildDashboard({ child, catalog }: { child: Child; catalog: readonly CatalogTool[] }) {
  const t = useTheme();
  const day = todayISO();
  const care = useCareDay(child.id, day);
  const feeds = useRecentFeeds(child.id, 1);
  const measures = useMeasurements(child.id);

  const lastOf = (k: 'height_cm' | 'weight_kg') => [...(measures.data ?? [])].reverse().find((m) => m[k] != null)?.[k] ?? null;
  const h = lastOf('height_cm');
  const w = lastOf('weight_kg');
  const sub = [childAge(child.birth_date).label, h != null ? tr('cd.cm', { n: String(h).replace('.', ',') }) : null, w != null ? tr('cd.kg', { n: String(w).replace('.', ',') }) : null].filter(Boolean).join(' · ');

  const grid = useMemo(() => dashTools(catalog).map((d) => {
    const c = catalog.find((x) => x.id === d.id)!;
    return { id: d.id, theme: c.theme, icon: d.icon ?? c.icon, label: tr(d.label as never), href: d.href ? d.href(child.id) : c.href };
  }), [catalog, child.id]);

  const todayFeeds = (feeds.data ?? []).filter((f) => String(f.started_at).slice(0, 10) === day || todayISO(new Date(f.started_at)) === day);
  const items = care.items ?? [];
  const sum = summarizeDay(items);
  const entries = [
    ...items.filter((i) => ['sleep', 'bottle', 'diaper', 'meal', 'observation'].includes(i.kind)).map((i) => ({
      id: `${i.kind}-${i.id}`, kind: i.kind, at: i.at,
      title: tr(`cd.kind.${i.kind}` as never),
      detail: i.kind === 'sleep' ? (i.endAt ? formatDuration((Date.parse(String(i.endAt)) - Date.parse(i.at)) / 60_000) : tr('cd.ongoing'))
        : i.kind === 'bottle' ? (typeof i.row.consumed_ml === 'number' ? tr('cd.ml', { n: i.row.consumed_ml as number }) : tr('cd.noAmount'))
          : i.kind === 'diaper' ? [i.row.wet ? tr('cd.wet') : null, i.row.stool ? tr('cd.stool') : null].filter(Boolean).join(' + ') || tr('cd.kind.diaper')
            : '',
      href: i.kind === 'sleep' ? `/sleep/${child.id}` : i.kind === 'bottle' ? `/bottle/${child.id}` : i.kind === 'diaper' ? `/track/diaper?child=${child.id}` : `/child/${child.id}`,
    })),
    ...todayFeeds.map((f) => ({ id: `feed-${f.id}`, kind: 'feed', at: String(f.started_at), title: tr('cd.kind.feed'),
      detail: f.ended_at ? formatDuration((Date.parse(String(f.ended_at)) - Date.parse(String(f.started_at))) / 60_000) : tr('cd.ongoing'),
      href: `/track/breastfeed?child=${child.id}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  // Synthèse : part de la journée ÉCOULÉE couverte par du sommeil noté (fait mesurable, pas une note)
  const now = new Date();
  const elapsedMin = now.getHours() * 60 + now.getMinutes();
  // Sommeil d'AUJOURD'HUI seulement : une nuit commencée hier est coupée à minuit, un sommeil en cours à maintenant
  const sleepMin = todaySleepMinutes(items.filter((i) => i.kind === 'sleep').map((i) => ({ start: i.at, end: i.endAt ?? null })), now);
  const anySleep = items.some((i) => i.kind === 'sleep');

  return (
    <View style={{ gap: spacing.md }} testID="child-dash">
      {/* 1 · Qui */}
      <Row gap={spacing.md} style={{ alignItems: 'center' }}>
        <ChildAvatar child={child} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading" testID="child-dash-name">{child.first_name}</Text>
          <Text variant="small" muted testID="child-dash-sub">{sub}</Text>
        </View>
      </Row>

      {/* 2 · Accès directs */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="child-dash-grid">
        {grid.map((c) => (
          <DashTile key={c.id} label={c.label} onPress={() => router.push(c.href as never)} testID={`child-dash-tool-${c.id}`}
            glyph={<ToolGlyph id={c.id} theme={c.theme} icon={c.icon} size={40} />} />
        ))}
        <DashTile label={tr('cd.more')} onPress={() => router.push('/(tabs)/tools' as never)} testID="child-dash-more"
          glyph={<View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}><Icon name="grid" size={20} color={t.colors.text} /></View>} />
      </View>

      {/* 3 · Aujourd'hui */}
      <Card testID="child-dash-today">
        <View style={{ gap: spacing.xs }}>
          <Text weight="bold" accessibilityRole="header">{tr('cd.today')}</Text>
          {care.isLoading && !care.items ? <Text variant="small" muted>…</Text> : entries.length ? entries.slice(0, 5).map((e) => (
            <Tappable key={e.id} accessibilityRole="button" onPress={() => router.push(e.href as never)} testID={`child-dash-entry-${e.id}`}
              accessibilityLabel={`${e.title}, ${e.detail}, ${formatTime(e.at)}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingVertical: 4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
                <Icon name={KIND_ICON[e.kind] ?? 'circle'} size={18} color={t.colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="medium">{e.title}</Text>
                {e.detail ? <Text variant="small" muted>{e.detail}</Text> : null}
              </View>
              <Text variant="small" style={{ fontVariant: ['tabular-nums'] }}>{formatTime(e.at)}</Text>
            </Tappable>
          )) : <Text variant="small" muted testID="child-dash-today-empty">{tr('cd.todayEmpty', { name: child.first_name })}</Text>}
        </View>
      </Card>

      {/* 4 · Synthèse du jour : des faits, pas de verdict */}
      <Card testID="child-dash-summary">
        <View style={{ gap: spacing.sm }}>
          <Text weight="bold" accessibilityRole="header">{tr('cd.summary')}</Text>
          <Row gap={spacing.md} style={{ alignItems: 'center' }}>
            <AnimatedProgressRing progress={elapsedMin ? sleepMin / elapsedMin : 0} size={88} stroke={8} color={t.colors.primary} track={t.colors.border}
              label={tr('cd.sleepShareA11y', { sleep: formatDuration(sleepMin), elapsed: formatDuration(elapsedMin) })} testID="child-dash-ring">
              <Text weight="bold" maxFontSizeMultiplier={1.15} style={{ fontVariant: ['tabular-nums'] }}>{anySleep ? formatDuration(sleepMin) : '—'}</Text>
            </AnimatedProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <Fact label={tr('cd.f.sleep')} value={anySleep ? formatDuration(sleepMin) + (sum.sleep.ongoing ? ` · ${tr('cd.ongoing')}` : '') : tr('cd.none')} />
              <Fact label={tr('cd.f.bottles')} value={sum.bottles.count ? `${sum.bottles.count}${sum.bottles.totalMl != null ? ` · ${tr('cd.ml', { n: sum.bottles.totalMl })}` : ''}` : tr('cd.none')} />
              {todayFeeds.length ? <Fact label={tr('cd.f.feeds')} value={String(todayFeeds.length)} /> : null}
              <Fact label={tr('cd.f.diapers')} value={sum.diapers.count ? String(sum.diapers.count) : tr('cd.none')} />
            </View>
          </Row>
          <Text variant="caption" muted>{tr('cd.summaryNote')}</Text>
        </View>
      </Card>
    </View>
  );
}

function DashTile({ label, glyph, onPress, testID }: { label: string; glyph: React.ReactNode; onPress: () => void; testID: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID}
      style={{ flexBasis: '22%', flexGrow: 1, minHeight: 92, borderRadius: radius.lg, paddingVertical: spacing.xs, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
      {glyph}
      <Text variant="caption" weight="medium" center numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={1.2} style={{ fontSize: 11.5, letterSpacing: -0.2 }}>{label}</Text>
    </Tappable>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Text variant="small" muted>{label}</Text>
      <Text variant="small" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
    </Row>
  );
}
