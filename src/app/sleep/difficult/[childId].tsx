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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useChild, useChildren, useMemberships } from '@/lib/data/hooks';
import { callNumber, goBack } from '@/lib/links';
import { useNightFeeds, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { lastEvents, nightPistes, NIGHT_OBSERVATIONS, WORRYING_SIGNS, type NightObservation } from '@/lib/domain/nightsHelp';
import { ownSleeps } from '@/lib/domain/sleepPlanner';
import { NIGHT_SOURCES, SOOTHING_ROUTINES } from '@/content/nightHelp';
import { radius, spacing } from '@/theme/tokens';

// Bleu nuit, lumière réduite (mêmes couleurs que « Aide pour cette nuit »)
const BG = '#070B1C';
const CARD = '#0F1530';
const LINE = '#1B2550';
const TEXT = '#B9C3E6';
const MUTED = '#7C87B2';
const ACCENT = '#8FA2E8';

const STEPS = ['Ce que vous observez', 'Ce qui a été noté', 'Pistes douces', 'Une routine calme', 'Quand demander conseil'];

export default function DifficultNight() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
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
        <View style={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.md }}>
          <Row style={{ alignItems: 'center' }}>
            <Tappable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => goBack()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} testID="dn-close"><Icon name="x" color={MUTED} /></Tappable>
          </Row>
          {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
            <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title="Impossible d’afficher ce profil" />
          ) : (
            <EmptyState
              icon="user-x"
              title="Profil introuvable"
              body="Ce profil est introuvable. Il a peut-être été supprimé."
              action={{ label: 'Retour à l’accueil', icon: 'home', onPress: () => router.replace('/(tabs)') }}
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
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 140, gap: spacing.md }}>
        <Row style={{ alignItems: 'center' }}>
          <Tappable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => goBack()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" color={MUTED} /></Tappable>
          <Text variant="caption" color={MUTED} style={{ flex: 1 }}>{`Étape ${step + 1} sur ${STEPS.length} · ${name}`}</Text>
        </Row>
        <Text variant="title" color={TEXT}>{STEPS[step]}</Text>
        {step === 0 ? <Text color={MUTED}>Vous faites de votre mieux. On regarde ensemble, calmement.</Text> : null}

        {step === 0 ? (
          <>
            <Box title="D’abord : l’un de ces signes ?">
              {WORRYING_SIGNS.map((s) => <Pick key={s.key} label={s.label} on={signs.includes(s.key)} onPress={() => setSigns(signs.includes(s.key) ? signs.filter((x) => x !== s.key) : [...signs, s.key])} testID={`dn-sign-${s.key}`} />)}
            </Box>
            {urgent.length ? (
              <Box title="N’attendez pas" tone="danger" testID="dn-urgent">
                <Text color={TEXT}>Ce module ne peut pas évaluer ces signes. Appelez le 15 (ou le 112). En cas de doute sur la fièvre d’un bébé de moins de 3 mois, consultez en urgence.</Text>
                <Big label="Appeler le 15" onPress={() => callNumber('15', toast)} testID="dn-call-15" />
              </Box>
            ) : null}
            {harm ? (
              <Box title="Vous n’êtes pas seul·e" tone="danger" testID="dn-harm">
                <Text color={TEXT}>Posez {name} sur le dos dans son lit, en sécurité, et quittez la pièce quelques minutes. Ne le secouez jamais. Appelez un proche, ou le 119 (24 h/24, gratuit).</Text>
                <Big label="Appeler le 119" onPress={() => callNumber('119', toast)} testID="dn-call-119" />
              </Box>
            ) : null}
            <Box title="Qu’observez-vous ?">
              {NIGHT_OBSERVATIONS.map((o) => <Pick key={o.key} label={o.label} on={obs.includes(o.key)} onPress={() => setObs(obs.includes(o.key) ? obs.filter((x) => x !== o.key) : [...obs, o.key])} testID={`dn-obs-${o.key}`} />)}
            </Box>
          </>
        ) : null}

        {step === 1 ? (
          <Box title="Derniers événements notés" testID="dn-events">
            {events.map((e) => <Text key={e} color={TEXT} style={{ marginBottom: 4 }}>• {e}</Text>)}
            <Text variant="caption" color={MUTED}>Seulement ce qui a été noté dans l’application.</Text>
          </Box>
        ) : null}

        {step === 2 ? nightPistes(obs, months).map((p) => (
          <Box key={p.title} title={p.title} testID="dn-pistes">
            {p.points.map((x) => <Text key={x} color={TEXT} style={{ marginBottom: 6 }}>• {x}</Text>)}
          </Box>
        )) : null}

        {step === 3 ? (
          <Box title="Cochez au fur et à mesure" testID="dn-routine">
            {routine.map((r) => <Pick key={r} label={r} on={done.includes(r)} onPress={() => setDone(done.includes(r) ? done.filter((x) => x !== r) : [...done, r])} />)}
            <Text variant="caption" color={MUTED}>Gardez ce qui vous convient. Il n’existe pas de soirée parfaite.</Text>
          </Box>
        ) : null}

        {step === 4 ? (
          <>
            <Box title="Demandez conseil si…" testID="dn-pro">
              {['Les nuits restent difficiles plusieurs semaines, ou s’aggravent.', 'Il ronfle fort, fait des pauses respiratoires ou respire bruyamment en dormant.', 'Il mange moins, perd du poids, ou vous semble différent.', 'Vous êtes épuisé·e, triste ou à bout : vous aussi méritez de l’aide.']
                .map((x) => <Text key={x} color={TEXT} style={{ marginBottom: 6 }}>• {x}</Text>)}
              <Text color={TEXT}>Interlocuteurs : son médecin ou pédiatre, la PMI, la permanence de soins (116 117) la nuit, Allô Parents Bébé (0 800 00 34 56).</Text>
            </Box>
            <Big label="Demander à l’IA sommeil" onPress={() => router.push({ pathname: '/assistant/chat', params: { topic: 'sleep', child: child.id, q: 'Que puis-je essayer après plusieurs réveils ?' } })} testID="dn-ai" />
            <Text variant="caption" color={MUTED}>{`Sources : ${NIGHT_SOURCES.santePleurs.label} ; ${NIGHT_SOURCES.mpediaTroublesSommeil.label} ; ${NIGHT_SOURCES.ameliSecoue.label}.`}</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: BG, borderTopWidth: 1, borderTopColor: LINE }}>
        <Row>
          {step > 0 ? <View style={{ flex: 1 }}><Big label="Retour" soft onPress={() => setStep(step - 1)} testID="dn-back" /></View> : null}
          <View style={{ flex: 1 }}>
            {step < STEPS.length - 1 ? <Big label="Suivant" onPress={() => setStep(step + 1)} testID="dn-next" /> : <Big label="Terminer" onPress={() => goBack()} testID="dn-finish" />}
          </View>
        </Row>
      </View>
    </View>
  );
}

function Box({ title, children, tone, testID }: { title: string; children: React.ReactNode; tone?: 'danger'; testID?: string }) {
  return (
    <View testID={testID} style={{ backgroundColor: CARD, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: tone === 'danger' ? '#B5566B' : LINE }}>
      <Text weight="bold" color={tone === 'danger' ? '#F2A7B5' : TEXT}>{title}</Text>
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
      style={{ minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: soft ? CARD : '#2C3A7A', borderWidth: 1, borderColor: LINE, paddingHorizontal: spacing.md }}>
      <Text weight="bold" color={TEXT}>{label}</Text>
    </Tappable>
  );
}
