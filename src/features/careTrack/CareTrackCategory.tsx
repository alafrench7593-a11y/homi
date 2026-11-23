/**
 * Remontée des mini-apps de suivi Soins / Santé / Sommeil de la mère dans leur catégorie (/tools/<catégorie>) —
 * 22/11/2026. Lit les MÊMES lignes que les mini-apps (aucune copie) et n'affiche une ligne que si une donnée du JOUR
 * existe ; rien de noté aujourd'hui → aucune ligne (jamais « 0 »). Toucher une ligne ouvre la mini-app sur CETTE saisie.
 *  · Soins (enfant affiché) : dents notées aujourd'hui, moments notés aujourd'hui, photos de l'album prises aujourd'hui ;
 *  · Santé : documents datés ou déposés aujourd'hui, page du journal intime d'aujourd'hui (privée), bilan
 *    « Je suis à bout » d'aujourd'hui (privé) ;
 *  · Sommeil : ma nuit (réveil aujourd'hui) — durée notée telle quelle.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { TABULAR } from '@/features/homeTrack/kit';
import { t as tr, type TKey } from '@/i18n';
import { useActiveSubject, useChildren, useDocuments, useMoods } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { useExhaustionCheckins } from '@/lib/data/hooks-mental';
import { useChildPhotos } from '@/lib/data/hooks-photos';
import { useParentSleepLogs } from '@/lib/data/hooks-sleep';
import { countOn, dayOfStamp } from '@/lib/domain/careTrack';
import { formatDuration, todayISO } from '@/lib/domain/dates';
import { diaryPages } from '@/lib/domain/diary';
import { exhaustionLevel } from '@/lib/domain/mentalLoad';
import { nightMinutes, timeOfIso } from '@/lib/domain/parentSleep';
import { clock } from '@/lib/domain/sleepPlanner';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export interface LineSpec { key: string; icon: IconName; label: string; value: string; sub?: string | null; onPress: () => void }

function Line({ l }: { l: LineSpec }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" testID={`ct-cat-${l.key}`} accessibilityLabel={`${l.label}. ${l.value}${l.sub ? `. ${l.sub}` : ''}`}
      onPress={() => { haptic('selection'); l.onPress(); }}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={l.icon} size={18} color={t.colors.textMuted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="caption" muted>{l.label}</Text>
        <Text weight="bold" style={[{ fontSize: 20, lineHeight: 26, fontFamily: fonts.display }, TABULAR]} testID={`ct-cat-${l.key}-value`}>{l.value}</Text>
        {l.sub ? <Text variant="caption" muted style={TABULAR}>{l.sub}</Text> : null}
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}

/** Panneau « Noté aujourd'hui » d'une catégorie (aussi utilisé par les repas et les vaccins, finishMeals). */
export function Panel({ lines, testID }: { lines: LineSpec[]; testID: string }) {
  if (!lines.length) return null;
  return (
    <Glass variant="card" radius={radius.xl} style={{ marginBottom: spacing.sm }} contentStyle={{ padding: spacing.md, gap: 4 }} testID={testID}>
      <Text variant="label" muted accessibilityRole="header">{tr('ct.cat.today')}</Text>
      {lines.map((l) => <Line key={l.key} l={l} />)}
    </Glass>
  );
}

function useChild(): Child | null {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  return subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
}

function CareLines({ child }: { child: Child }) {
  const today = todayISO();
  const ms = useMilestones(child.id).data ?? [];
  const photos = useChildPhotos(child.id).data ?? [];
  const teeth = ms.filter((m) => m.kind === 'tooth' && m.happened_on === today);
  const moments = ms.filter((m) => m.kind !== 'tooth' && m.happened_on === today);
  const pics = photos.filter((p) => p.taken_on === today);
  const lines: LineSpec[] = [];
  if (teeth.length) lines.push({ key: 'teeth', icon: 'circle', label: tr('ct.cat.teeth', { name: child.first_name }), value: tr('ct.teeth.unitToday', { count: teeth.length }), sub: teeth.map((m) => m.title).join(', '),
    onPress: () => router.push({ pathname: '/teeth', params: { child: child.id, tooth: teeth[0].id } } as never) });
  if (moments.length) lines.push({ key: 'moments', icon: 'star', label: tr('ct.cat.moments', { name: child.first_name }), value: tr('ct.moment.count', { count: moments.length }), sub: moments.map((m) => m.title).join(', '),
    onPress: () => router.push({ pathname: '/child/[id]', params: { id: child.id, tab: 'etapes', moment: moments[0].id } } as never) });
  if (pics.length) lines.push({ key: 'album', icon: 'image', label: tr('ct.cat.album', { name: child.first_name }), value: tr('ct.album.count', { count: pics.length }), sub: null,
    onPress: () => router.push({ pathname: '/child/[id]/album', params: { id: child.id, photo: pics[0].id } } as never) });
  return <Panel lines={lines} testID="ct-cat-care" />;
}

function HealthLines() {
  const today = todayISO();
  const docs = (useDocuments().data ?? []).filter((d) => !d.archived && (d.doc_date === today || dayOfStamp(d.created_at) === today));
  const pages = diaryPages(useMoods(30).data);
  const pagesToday = countOn(pages, (p) => dayOfStamp(p.checked_at), today);
  const checks = (useExhaustionCheckins().data ?? []).filter((c) => dayOfStamp(c.created_at) === today);
  const lines: LineSpec[] = [];
  if (docs.length) lines.push({ key: 'docs', icon: 'folder', label: tr('ct.cat.docs'), value: tr('ct.docs.count', { count: docs.length }), sub: docs.slice(0, 2).map((d) => d.title).join(', '),
    onPress: () => router.push({ pathname: '/documents', params: { doc: docs[0].id } } as never) });
  if (pagesToday) lines.push({ key: 'diary', icon: 'edit', label: tr('ct.cat.diary'), value: tr('ct.diary.pages', { count: pagesToday }), sub: tr('ct.cat.private'),
    onPress: () => router.push({ pathname: '/me/diary', params: { page: pages.find((p) => dayOfStamp(p.checked_at) === today)!.id } } as never) });
  if (checks.length) lines.push({ key: 'ex', icon: 'battery', label: tr('ct.cat.ex'), value: tr(`cm.ex.r.${exhaustionLevel(checks[0].answers).level}` as TKey), sub: `${clock(new Date(checks[0].created_at))} · ${tr('ct.cat.private')}`,
    onPress: () => router.push({ pathname: '/family/exhausted', params: { check: checks[0].id } } as never) });
  return <Panel lines={lines} testID="ct-cat-health" />;
}

function SleepLines() {
  const today = todayISO();
  const log = (useParentSleepLogs(7).data ?? []).find((l) => l.log_date === today) ?? null;
  if (!log) return null;
  const m = nightMinutes(log);
  const range = log.bedtime && log.wake_time ? `${timeOfIso(log.bedtime)} → ${timeOfIso(log.wake_time)}` : null;
  return <Panel testID="ct-cat-sleep" lines={[{ key: 'mysleep', icon: 'cloud', label: tr('ct.cat.mySleep'), value: m != null ? formatDuration(m) : tr('ct.sleep.noDuration'),
    sub: [range, tr('ct.sleep.wakings', { count: log.night_wakings ?? 0 })].filter(Boolean).join(' · '),
    onPress: () => router.push({ pathname: '/me/sleep', params: { night: log.id } } as never) }]} />;
}

export function CareTrackCategory({ category }: { category: 'care' | 'health' | 'sleep' }) {
  const child = useChild();
  if (category === 'care') return child ? <CareLines key={child.id} child={child} /> : null;
  if (category === 'health') return <HealthLines />;
  return <SleepLines />;
}
