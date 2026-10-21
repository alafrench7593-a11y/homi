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
import { useChild, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { useNightFeeds, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { clock, planLines, span, tonightInfo } from '@/lib/domain/sleepPlanner';
import { NIGHT_BANDS } from '@/content/nightHelp';
import type { Child } from '@/lib/types';
import { radius, spacing } from '@/theme/tokens';

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
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: BG }} testID="tonight">
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.md, gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Tappable accessibilityRole="button" accessibilityLabel="Fermer l’aide pour cette nuit" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Row gap={6}><Icon name="x" color={MUTED} size={20} /><Text color={MUTED}>Fermer</Text></Row>
          </Tappable>
          <Tappable accessibilityRole="button" accessibilityLabel="Numéros d’urgence" onPress={() => router.push('/emergency')} hitSlop={10} style={{ minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" color="#C7A0A0" size={22} />
          </Tappable>
        </Row>
        <Text variant="title" color={TEXT}>Aide pour cette nuit</Text>
        {kids.length > 1 ? (
          <Row wrap>{kids.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child?.id} onPress={() => router.setParams({ child: c.id })} />)}</Row>
        ) : null}
        {child ? <TonightBody child={child} /> : <Text color={TEXT}>Ajoutez le profil d’un enfant pour utiliser cette aide.</Text>}
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
        <Info label="Dernier réveil" value={info.lastWake ? clock(info.lastWake) : '—'} testID="tonight-last-wake" />
        <Info label="Dernier repas de nuit" value={info.lastFeed ? clock(info.lastFeed) : 'non noté'} testID="tonight-last-feed" />
        <Info label="Sommeil précédent" value={info.previousSleepMinutes !== null ? span(info.previousSleepMinutes) : '—'} testID="tonight-previous" />
        <Info label="Réveils cette nuit" value={String(info.wakings)} testID="tonight-wakings" />
      </Row>
      <View style={{ backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: LINE, padding: spacing.sm, gap: 4 }}>
        <Text variant="small" weight="bold" color={TEXT}>{`Repères généraux · ${band.title.toLowerCase()}`}</Text>
        {band.points.slice(0, 3).map((p) => <Text key={p} variant="small" color={MUTED}>{`• ${p}`}</Text>)}
        <Text variant="small" color={MUTED}>• Si vous sentez la fatigue ou l’agacement monter, couchez votre enfant sur le dos dans son lit, en sécurité, et accordez-vous quelques minutes au calme.</Text>
        <Tappable accessibilityRole="link" accessibilityLabel="Plus d’aide pour la nuit" onPress={() => router.push({ pathname: '/night/help', params: { child: child.id } })} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="small" color={TEXT}>Plus d’aide pour la nuit, couchage en sécurité →</Text>
        </Tappable>
      </View>
      <Text variant="caption" color={MUTED}>Aucun son n’est joué. Les estimations de sommeil ne s’affichent pas la nuit.</Text>
      {/* Grands boutons en bas : prochaine action enregistrable, utilisable d'une main */}
      <View style={{ marginTop: 'auto', gap: spacing.xs }} testID="tonight-actions">
        <SleepRecordButtons child={child} plan={plan} tone="night" />
        <Row wrap>
          <BigButton tone="night" icon="droplet" label="Repas de nuit" hint="Tétée ou biberon, en mode nuit" onPress={() => router.push('/night')} testID="tonight-feed" />
        </Row>
      </View>
    </View>
  );
}
