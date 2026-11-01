/**
 * Aide pour la nuit (bébé et jeune enfant) :
 *  · noter le sommeil, les réveils et les tétées ou biberons de la nuit (mode nuit) ;
 *  · un résumé simple de la nuit, sans norme ni score ;
 *  · des repères généraux et doux selon l'âge, des routines apaisantes, le couchage en sécurité ;
 *  · préparer ses questions pour le médecin ou la PMI.
 * Aucun diagnostic, aucune promesse (« il fera ses nuits »), aucune culpabilisation. Contenu « À vérifier ».
 */
import React, { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniBars } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Row, SectionTitle, Text } from '@/components/ui';
import { useScope } from '@/lib/data/hooks-scope';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useLogs, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { formatDuration } from '@/lib/domain/dates';
import { lastNights } from '@/lib/domain/night';
import { NIGHT_BANDS, NIGHT_SOURCES, QUESTIONS_FOR_PRO, SAFE_SLEEP, SEEK_HELP_NOW, SOOTHING_ROUTINES } from '@/content/nightHelp';
import { useUiStore } from '@/lib/store';
import type { Appointment, Bottle, Breastfeed, Sleep } from '@/lib/types';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function NightHelp() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ child?: string }>();
  const scope = useScope();
  const fromLink = useChild(typeof params.child === 'string' ? params.child : null);
  const child = fromLink ?? scope.child;
  const childId = child?.id ?? null;
  const sleeps = useLogs<Sleep>('sleep', childId, 8);
  const feeds = useLogs<Breastfeed>('breastfeed', childId, 8);
  const bottles = useLogs<Bottle>('bottle', childId, 8);
  const appts = useRows<Appointment>(['appointments', 'child', childId ?? ''], childId ? { table: 'appointments', filters: [eq('child_id', childId)], order: [{ col: 'starts_at' }] } : null);
  const saved = useUiStore((s) => s.nightQuestions);
  const setSaved = useUiStore((s) => s.setNightQuestions);
  const [free, setFree] = useState('');
  const nights = useMemo(() => lastNights(7, { sleeps: sleeps.data ?? [], breastfeeds: feeds.data ?? [], bottles: bottles.data ?? [] }), [sleeps.data, feeds.data, bottles.data]);

  // Pendant le chargement, un squelette (et non « aucun enfant » qui s'affichait un instant)
  if (!child && !scope.loaded) return <Screen back title={tr('nh.title')}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('nh.title')}><EmptyState icon="moon" title={tr('nh.noChild')} /></Screen>;
  const months = childAge(child.birth_date).months;
  const band = NIGHT_BANDS.find((b) => months >= b.fromMonths && months < b.toMonths) ?? NIGHT_BANDS[NIGHT_BANDS.length - 1];
  const tonight = nights[0];
  const mine = saved[child.id] ?? [];
  const toggleQ = (q: string) => setSaved(child.id, mine.includes(q) ? mine.filter((x) => x !== q) : [...mine, q]);
  const nextAppt = (appts.data ?? []).find((a) => new Date(a.starts_at).getTime() > Date.now());
  const nightLabel = (evening: string) => formatDate(`${evening}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });

  async function addToAppointment() {
    if (!nextAppt) return;
    try {
      const merged = [...new Set([...(nextAppt.questions ?? []), ...mine])];
      await backend.update('appointments', { questions: merged }, [eq('id', nextAppt.id)]);
      inv('appointments'); toast(tr('nh.q.added', { title: nextAppt.title }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('nh.title')} subtitle={tr('nh.subtitle', { name: child.first_name })}
      action={{ label: tr('nh.openNightMode'), icon: 'moon', onPress: () => router.push(`/night?child=${child.id}`), testID: 'night-open-mode' }}>
      <Banner tone="info">{tr('nh.intro')}</Banner>

      {/* Résumé simple */}
      <SectionTitle title={tr('nh.summary')} />
      {sleeps.isLoading && !sleeps.data ? <Skeleton rows={2} /> : (
        <Card>
          <View testID="night-summary">
            <Text variant="caption" weight="bold" muted>{tr('nh.nightOf', { date: nightLabel(tonight.evening) })}</Text>
            {tonight.hasData ? (
              <>
                <Text style={{ marginTop: 4 }}>{tr('nh.sleep', { d: formatDuration(tonight.sleepMinutes) })}{tonight.ongoing ? ` · ${tr('nh.ongoing')}` : ''}</Text>
                <Text variant="small">{tr('nh.periods', { count: tonight.periods })} · {tr('nh.wakings', { count: tonight.wakings })} · {tr('nh.feeds', { count: tonight.feeds })}</Text>
                {tonight.longestMinutes ? <Text variant="small" muted>{tr('nh.longest', { d: formatDuration(tonight.longestMinutes) })}</Text> : null}
              </>
            ) : <Text variant="small" muted style={{ marginTop: 4 }}>{tr('nh.empty')}</Text>}
          </View>
        </Card>
      )}
      {nights.some((n) => n.hasData) ? (
        <MiniBars testID="night-week"
          values={[...nights].reverse().map((n) => Math.round((n.sleepMinutes / 60) * 10) / 10)}
          labels={[...nights].reverse().map((n) => formatDate(`${n.evening}T12:00:00`, { weekday: 'narrow' }))} />
      ) : null}
      {nights.slice(1).some((n) => n.hasData) ? (
        <Card>
          <Text variant="caption" weight="bold" muted>{tr('nh.previous')}</Text>
          {nights.slice(1).filter((n) => n.hasData).map((n) => (
            <Row key={n.evening} style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <Text variant="small" style={{ flex: 1 }}>{nightLabel(n.evening)}</Text>
              <Text variant="small" muted>{formatDuration(n.sleepMinutes)} · {tr('nh.wakingsShort', { count: n.wakings })} · {tr('nh.feedsShort', { count: n.feeds })}</Text>
            </Row>
          ))}
        </Card>
      ) : null}
      <Text variant="caption" muted>{tr('nh.summaryNote')}</Text>

      {/* Repères par âge */}
      <SectionTitle title={tr('nh.forAge', { title: band.title })} />
      <Card>
        <View testID="night-advice">
          {band.points.map((p) => <Text key={p} variant="small" style={{ marginTop: 4 }}>• {p}</Text>)}
        </View>
      </Card>

      <SectionTitle title={tr('nh.routines')} />
      {SOOTHING_ROUTINES.map((r) => (
        <Card key={r.title}>
          <Text weight="bold">{r.title}</Text>
          {r.steps.map((s) => <Text key={s} variant="small" style={{ marginTop: 2 }}>• {s}</Text>)}
        </Card>
      ))}

      <SectionTitle title={tr('nh.safe')} />
      <Card>{SAFE_SLEEP.map((s) => <Text key={s} variant="small" style={{ marginTop: 4 }}>• {s}</Text>)}</Card>

      <View testID="night-seek-help"><Banner tone="warning" title={tr('nh.seekHelp')}>{SEEK_HELP_NOW.map((s) => `• ${s}`).join('\n')}</Banner></View>
      <Button label={tr('nh.emergency')} icon="life-buoy" variant="ghost" onPress={() => router.push('/emergency')} />

      {/* Préparer ses questions */}
      <SectionTitle title={tr('nh.q.title')} />
      <Text variant="small" muted>{tr('nh.q.intro')}</Text>
      <Row wrap>
        {QUESTIONS_FOR_PRO.map((q) => <Chip key={q} label={q} selected={mine.includes(q)} onPress={() => toggleQ(q)} />)}
        {mine.filter((q) => !QUESTIONS_FOR_PRO.includes(q)).map((q) => <Chip key={q} label={q} selected onPress={() => toggleQ(q)} />)}
      </Row>
      <Field label={tr('nh.q.own')} value={free} onChangeText={setFree} maxLength={200} testID="night-question-own" />
      <Button label={tr('nh.q.add')} size="sm" variant="ghost" onPress={() => { if (free.trim()) { setSaved(child.id, [...mine, free.trim()]); setFree(''); } }} />
      {mine.length ? (
        <View testID="night-questions" style={{ gap: spacing.xs }}>
          <Text variant="small" weight="bold">{tr('nh.q.count', { count: mine.length })}</Text>
          {nextAppt ? <Button label={tr('nh.q.toAppt', { title: nextAppt.title })} icon="calendar" variant="secondary" onPress={() => addToAppointment()} /> : <Button label={tr('nh.q.newAppt')} icon="calendar" variant="secondary" onPress={() => router.push(`/appointments?child=${child.id}`)} />}
        </View>
      ) : null}

      <SectionTitle title={tr('nh.sources')} />
      {Object.values(NIGHT_SOURCES).map((s) => (
        <Tappable key={s.url} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ minHeight: 36, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.primary}>{s.label}{s.published ? ` (${formatDate(`${s.published}T12:00:00`)})` : ''} · {tr('rc.consulted', { date: formatDate(`${s.consulted_on}T12:00:00`) })}</Text>
        </Tappable>
      ))}
      <Text variant="caption" muted testID="night-status">{tr('nh.status')}</Text>
    </Screen>
  );
}
