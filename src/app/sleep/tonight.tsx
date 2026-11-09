/**
 * « Aide pour cette nuit » : l'essentiel d'un coup d'œil, en bleu nuit très sombre, contrastes adoucis,
 * aucun son, grands boutons placés en bas de l'écran pour une utilisation à une main.
 * Dernier réveil, dernier repas de nuit, durée du sommeil précédent, nombre de réveils, prochaine action
 * enregistrable, repères généraux selon l'âge. Toujours gratuit. Ne modifie jamais la luminosité du téléphone.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Chip, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { BigButton, SleepRecordButtons } from '@/features/sleep';
import { useChild, useChildrenLoading, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { useNightFeeds, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { clock, planLines, span, tonightInfo } from '@/lib/domain/sleepPlanner';
import { NIGHT_BANDS } from '@/content/nightHelp';
import type { Child } from '@/lib/types';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

// Bleu nuit, lumière réduite (couleurs propres à cet écran)
const BG = '#070B1C';
const CARD = '#0F1530';
const LINE = '#1B2550';
const TEXT = '#B9C3E6';
const MUTED = '#7C87B2';

function Info({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View testID={testID} style={{ flexGrow: 1, flexBasis: '45%', backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: LINE, padding: spacing.sm, gap: 2 }}>
      <Text variant="caption" color={MUTED}>{label}</Text>
      <Text weight="bold" color={TEXT}>{value}</Text>
    </View>
  );
}

export default function Tonight() {
  const params = useLocalSearchParams<{ child?: string }>();
  const scope = useScope();
  const fromLink = useChild(typeof params.child === 'string' ? params.child : null);
  const childrenQ = useTrackedChildren();
  const kids = (childrenQ.data ?? []).filter((c) => c.enabled_tracking.includes('sleep'));
  const child = fromLink ?? scope.child ?? kids[0] ?? null;
  const childrenLoading = useChildrenLoading();
  // Premier écran après connexion : « Chargement… », pas « ajoutez le profil d'un enfant » à tort
  const loading = !child && (!scope.loaded || childrenLoading);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: BG }} testID="tonight">
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.md, gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Tappable accessibilityRole="button" accessibilityLabel={tr('u4.tonight.closeA11y')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Row gap={6}><Icon name="x" color={MUTED} size={20} /><Text color={MUTED}>{tr('u4.tonight.close')}</Text></Row>
          </Tappable>
          <Tappable accessibilityRole="button" accessibilityLabel={tr('u4.tonight.emergency')} onPress={() => router.push('/emergency')} hitSlop={10} style={{ minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" color="#C7A0A0" size={22} />
          </Tappable>
        </Row>
        <Text variant="title" color={TEXT}>{tr('u4.tonight.title')}</Text>
        {kids.length > 1 ? (
          <Row wrap>{kids.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child?.id} onPress={() => router.setParams({ child: c.id })} />)}</Row>
        ) : null}
        {child ? <TonightBody child={child} /> : <Text color={TEXT}>{tr(loading ? 'common.loadingA11y' : 'u4.tonight.noChild')}</Text>}
      </ScrollView>
    </View>
  );
}

function TonightBody({ child }: { child: Child }) {
  const { plan, sleeps, now } = useSleepPlan(child, 20_000);
  const feeds = useNightFeeds(child.id);
  const info = tonightInfo(sleeps, child.id, feeds, now);
  const months = childAge(child.birth_date).months;
  const band = NIGHT_BANDS.find((b) => months >= b.fromMonths && months < b.toMonths) ?? NIGHT_BANDS[NIGHT_BANDS.length - 1];
  const state = plan ? planLines(plan, child.first_name, child.sex, now)[0].text : '';
  return (
    <View style={{ flexGrow: 1, gap: spacing.sm }}>
      <Text color={TEXT} testID="tonight-state">{`${child.first_name} · ${state}`}</Text>
      <Row wrap>
        <Info label={tr('u4.tonight.lastWake')} value={info.lastWake ? clock(info.lastWake) : '—'} testID="tonight-last-wake" />
        <Info label={tr('u4.tonight.lastFeed')} value={info.lastFeed ? clock(info.lastFeed) : tr('u4.tonight.notNoted')} testID="tonight-last-feed" />
        <Info label={tr('u4.tonight.prevSleep')} value={info.previousSleepMinutes !== null ? span(info.previousSleepMinutes) : '—'} testID="tonight-previous" />
        <Info label={tr('u4.tonight.wakings')} value={String(info.wakings)} testID="tonight-wakings" />
      </Row>
      <View style={{ backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: LINE, padding: spacing.sm, gap: 4 }}>
        <Text variant="small" weight="bold" color={TEXT}>{tr('u4.tonight.general', { band: band.title.toLowerCase() })}</Text>
        {band.points.slice(0, 3).map((p) => <Text key={p} variant="small" color={MUTED}>{`• ${p}`}</Text>)}
        <Text variant="small" color={MUTED}>{tr('u4.tonight.tired')}</Text>
        <Tappable accessibilityRole="link" accessibilityLabel={tr('u4.tonight.moreA11y')} onPress={() => router.push({ pathname: '/night/help', params: { child: child.id } })} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="small" color={TEXT}>{tr('u4.tonight.more')}</Text>
        </Tappable>
      </View>
      <Text variant="caption" color={MUTED}>{tr('u4.tonight.noSound')}</Text>
      {/* Grands boutons en bas : prochaine action enregistrable, utilisable d'une main */}
      <View style={{ marginTop: 'auto', gap: spacing.xs }} testID="tonight-actions">
        <SleepRecordButtons child={child} plan={plan} tone="night" />
        <Row wrap>
          <BigButton tone="night" icon="droplet" label={tr('u4.tonight.nightFeed')} hint={tr('u4.tonight.nightFeedHint')} onPress={() => router.push('/night')} testID="tonight-feed" />
        </Row>
      </View>
    </View>
  );
}
