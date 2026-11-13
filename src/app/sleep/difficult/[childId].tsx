/**
 * « La nuit est difficile » : accompagnement pas à pas, pour l'enfant du profil choisi.
 *  1. Ce que vous observez (et, d'abord, les signes qui demandent de l'aide sans attendre : le module ne les gère pas).
 *  2. Ce qui a été noté (derniers sommeils, réveils, repas).
 *  3. Pistes générales et douces.
 *  4. Une routine calme, à cocher.
 *  5. Quand demander conseil.
 * Jamais de culpabilité, aucune méthode imposée, jamais « laisser pleurer ». Écran sombre et apaisé, gros boutons.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { StatusBar } from 'expo-status-bar';
import { Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useChild, useChildren, useMemberships } from '@/lib/data/hooks';
import { callNumber, goUp } from '@/lib/links';
import { useNightFeeds, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { lastEvents, nightPistes, NIGHT_OBSERVATIONS, WORRYING_SIGNS, type NightObservation } from '@/lib/domain/nightsHelp';
import { ownSleeps } from '@/lib/domain/sleepPlanner';
import { NIGHT_SOURCES, SOOTHING_ROUTINES } from '@/content/nightHelp';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

// Bleu nuit, lumière réduite (mêmes couleurs que « Aide pour cette nuit »)
// Thème « Nuit » HOMI : midnight violet tamisé, texte perle lilas, accent lilas (contrastes ≥ 4,5:1)
const BG = '#0F0B1E';
const CARD = '#1A1430';
const LINE = '#2E2650';
const TEXT = '#DDD0EC';
const MUTED = '#A598C0';
const ACCENT = '#B9A6EA';

const stepLabels = () => [tr('u4.dn.s1'), tr('u4.dn.s2'), tr('u4.dn.s3'), tr('u4.dn.s4'), tr('u4.dn.s5')];

export default function DifficultNight() {
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const STEPS = stepLabels();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const pathname = usePathname();
  const toast = useToast();
  const child = useChild(childId);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const { sleeps } = useSleepPlan(child);
  const feeds = useNightFeeds(child?.id);
  const [step, setStep] = useState(0);
  const [obs, setObs] = useState<NightObservation[]>([]);
  const [signs, setSigns] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const events = useMemo(() => (child ? lastEvents(ownSleeps(sleeps, child.id), feeds.map((f) => f.at)) : []), [child, sleeps, feeds]);
  if (!child) {
    // Toujours un bouton pour fermer, même si le profil ne peut pas s'afficher
    return (
      <View style={{ flex: 1, backgroundColor: BG }} testID="difficult-night">
        <StatusBar style="light" />
        <View style={{ padding: spacing.lg, paddingTop: topInset + spacing.md, gap: spacing.md }}>
          <Row style={{ alignItems: 'center' }}>
            <Tappable accessibilityRole="button" accessibilityLabel={tr('u4.dn.close')} onPress={() => goUp(pathname)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} testID="dn-close"><Icon name="x" color={MUTED} /></Tappable>
          </Row>
          {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
            <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u4.child.loadError')} />
          ) : (
            <EmptyState
              icon="user-x"
              title={tr('u4.child.notFound')}
              body={tr('u4.child.notFoundBody')}
              action={{ label: tr('u4.child.backHome'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
            />
          )}
        </View>
      </View>
    );
  }
  const name = child.first_name;
  const months = childAge(child.birth_date).months;
  const urgent = signs.filter((s) => s !== 'harm');
  const harm = signs.includes('harm');
  const routine = SOOTHING_ROUTINES[0].steps.concat(SOOTHING_ROUTINES[1].steps.slice(0, 1));

  return (
    <View style={{ flex: 1, backgroundColor: BG }} testID="difficult-night">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.md, paddingBottom: insets.bottom + 140, gap: spacing.md }}>
        <Row style={{ alignItems: 'center' }}>
          <Tappable accessibilityRole="button" accessibilityLabel={tr('u4.dn.close')} onPress={() => goUp(pathname)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" color={MUTED} /></Tappable>
          <Text variant="caption" color={MUTED} style={{ flex: 1 }}>{tr('u4.dn.stepOf', { n: step + 1, total: STEPS.length, name })}</Text>
        </Row>
        <Text variant="title" color={TEXT}>{STEPS[step]}</Text>
        {step === 0 ? <Text color={MUTED}>{tr('u4.dn.doingBest')}</Text> : null}

        {step === 0 ? (
          <>
            <Box title={tr('u4.dn.firstSigns')}>
              {WORRYING_SIGNS.map((s) => <Pick key={s.key} label={s.label} on={signs.includes(s.key)} onPress={() => setSigns(signs.includes(s.key) ? signs.filter((x) => x !== s.key) : [...signs, s.key])} testID={`dn-sign-${s.key}`} />)}
            </Box>
            {urgent.length ? (
              <Box title={tr('u4.dn.dontWait')} tone="danger" testID="dn-urgent">
                <Text color={TEXT}>{tr('u4.dn.cannotAssess')}</Text>
                <Big label={tr('u4.dn.call15')} onPress={() => callNumber('15', toast)} testID="dn-call-15" />
              </Box>
            ) : null}
            {harm ? (
              <Box title={tr('u4.dn.notAlone')} tone="danger" testID="dn-harm">
                <Text color={TEXT}>{tr('u4.dn.harmText', { name })}</Text>
                <Big label={tr('u4.dn.call119')} onPress={() => callNumber('119', toast)} testID="dn-call-119" />
              </Box>
            ) : null}
            <Box title={tr('u4.dn.whatObserve')}>
              {NIGHT_OBSERVATIONS.map((o) => <Pick key={o.key} label={o.label} on={obs.includes(o.key)} onPress={() => setObs(obs.includes(o.key) ? obs.filter((x) => x !== o.key) : [...obs, o.key])} testID={`dn-obs-${o.key}`} />)}
            </Box>
          </>
        ) : null}

        {step === 1 ? (
          <Box title={tr('u4.dn.lastEvents')} testID="dn-events">
            {events.map((e) => <Text key={e} color={TEXT} style={{ marginBottom: 4 }}>• {e}</Text>)}
            <Text variant="caption" color={MUTED}>{tr('u4.dn.onlyRecorded')}</Text>
          </Box>
        ) : null}

        {step === 2 ? nightPistes(obs, months).map((p) => (
          <Box key={p.title} title={p.title} testID="dn-pistes">
            {p.points.map((x) => <Text key={x} color={TEXT} style={{ marginBottom: 6 }}>• {x}</Text>)}
          </Box>
        )) : null}

        {step === 3 ? (
          <Box title={tr('u4.dn.tick')} testID="dn-routine">
            {routine.map((r) => <Pick key={r} label={r} on={done.includes(r)} onPress={() => setDone(done.includes(r) ? done.filter((x) => x !== r) : [...done, r])} />)}
            <Text variant="caption" color={MUTED}>{tr('u4.dn.noPerfect')}</Text>
          </Box>
        ) : null}

        {step === 4 ? (
          <>
            <Box title={tr('u4.dn.askIf')} testID="dn-pro">
              {[tr('u4.dn.adv1'), tr('u4.dn.adv2'), tr('u4.dn.adv3'), tr('u4.dn.adv4')]
                .map((x) => <Text key={x} color={TEXT} style={{ marginBottom: 6 }}>• {x}</Text>)}
              <Text color={TEXT}>{tr('u4.dn.contacts')}</Text>
            </Box>
            <Big label={tr('u4.dn.askAi')} onPress={() => router.push({ pathname: '/assistant/chat', params: { topic: 'sleep', child: child.id, q: tr('u4.dn.aiQ') } })} testID="dn-ai" />
            <Text variant="caption" color={MUTED}>{tr('u4.dn.sources', { a: NIGHT_SOURCES.santePleurs.label, b: NIGHT_SOURCES.mpediaTroublesSommeil.label, c: NIGHT_SOURCES.ameliSecoue.label })}</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: BG, borderTopWidth: 1, borderTopColor: LINE }}>
        <Row>
          {step > 0 ? <View style={{ flex: 1 }}><Big label={tr('u4.dn.back')} soft onPress={() => setStep(step - 1)} testID="dn-back" /></View> : null}
          <View style={{ flex: 1 }}>
            {step < STEPS.length - 1 ? <Big label={tr('u4.dn.next')} onPress={() => setStep(step + 1)} testID="dn-next" /> : <Big label={tr('u4.dn.finish')} onPress={() => goUp(pathname)} testID="dn-finish" />}
          </View>
        </Row>
      </View>
    </View>
  );
}

function Box({ title, children, tone, testID }: { title: string; children: React.ReactNode; tone?: 'danger'; testID?: string }) {
  return (
    <View testID={testID} style={{ backgroundColor: CARD, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: tone === 'danger' ? 'rgba(240,160,170,0.55)' : LINE }}>
      <Text weight="bold" color={tone === 'danger' ? '#F0A0AA' : TEXT}>{title}</Text>
      {children}
    </View>
  );
}
function Pick({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID?: string }) {
  return (
    <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingVertical: 4 }}>
      <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: on ? ACCENT : MUTED, backgroundColor: on ? ACCENT : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Icon name="check" size={14} color={BG} /> : null}
      </View>
      <Text color={TEXT} style={{ flex: 1 }}>{label}</Text>
    </Tappable>
  );
}
function Big({ label, onPress, soft, testID }: { label: string; onPress: () => void; soft?: boolean; testID?: string }) {
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={testID}
      style={{ minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: soft ? CARD : '#3E2F7A', borderWidth: 1, borderColor: LINE, paddingHorizontal: spacing.md }}>
      <Text weight="bold" color={TEXT}>{label}</Text>
    </Tappable>
  );
}
