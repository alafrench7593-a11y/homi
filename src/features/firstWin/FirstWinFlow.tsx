/**
 * Parcours court AVANT l'abonnement (03/12/2026), un écran = un rôle :
 *  1. étape de vie (grossesse / bébé / enfant jusqu'à 10 ans) ;
 *  2. « Qu'est-ce qui te faciliterait la journée ? » (au plus 4 réponses par étape) ;
 *  3. mini-démo guidée par Aura (messages prédéfinis, aucun appel IA, vrais composants, données « Exemple ») ;
 *  4. résultat juste après l'action + ce qu'on retrouverait au quotidien → « Voir les offres ».
 * Aucun compte demandé ici (le compte vient APRÈS le choix de la formule, juste avant le paiement). Progression gardée
 * sur l'appareil : fermeture et réouverture reprennent à la même étape ; retour arrière d'étape en étape.
 * Mouvement : entrées en cascade courte (`Cascade`) ; Réduire les animations → états finaux immédiats.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Button, IconButton, Text, type IconName } from '@/components/ui';
import { HeroArt } from '@/features/entry/HeroArt';
import { saveIntroProfile } from '@/features/intro/model';
import { ChoiceList, ChoiceRow, OnbProgress, StepTitle } from '@/features/onboarding/kit';
import { track } from '@/lib/analytics/events';
import { useUiStore } from '@/lib/store';
import { Cascade, motionHaptic, SuccessCheck } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { DEMOS, resultText } from './demos';
import { AuraBubble, BenefitLine, NO_HYPHENS } from './kit';
import {
  DEMO_OF, loadProgress, needsFor, saveProgress, STAGE_PROFILE, STAGES, stepFor,
  type DemoResult, type FirstWinProgress, type FlowStep, type LifeStage, type NeedId,
} from './model';

const STEPS: FlowStep[] = ['stage', 'need', 'demo', 'result'];
const STAGE_ICON: Record<LifeStage, IconName> = { pregnancy: 'heart', baby: 'moon', child: 'sun' };
const NEED_ICON: Record<NeedId, IconName> = { prepare_birth: 'check-square', feed_sleep: 'clock', mornings: 'sunrise', relay: 'users' };
const STAGE_ART = { pregnancy: 'grossesse', baby: 'bebe', child: 'enfants' } as const;

export function FirstWinFlow({ initialStep }: { initialStep?: FlowStep }) {
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const [p, setP] = useState<FirstWinProgress | null | undefined>(undefined);
  const [step, setStep] = useState<FlowStep>('stage');
  const started = useRef(false);
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    void loadProgress().then((saved) => {
      if (!alive) return;
      setP(saved);
      const resumeAt = stepFor(saved);
      setStep(initialStep && STEPS.indexOf(initialStep) <= STEPS.indexOf(resumeAt) ? initialStep : resumeAt);
      if (!saved && !started.current) { started.current = true; void track('onboarding_started', { source: 'first_open' }); }
    });
    return () => { alive = false; };
  }, [initialStep]);

  useEffect(() => { scroll.current?.scrollTo?.({ y: 0, animated: false }); }, [step]);

  async function update(patch: Partial<FirstWinProgress>, next?: FlowStep) {
    setP(await saveProgress(patch));
    if (next) setStep(next);
  }
  const back = () => {
    const i = STEPS.indexOf(step);
    if (i <= 0) { setIntroSeen(true); return router.canGoBack() ? router.back() : router.replace('/welcome'); }
    setStep(STEPS[step === 'result' ? 1 : i - 1]);
  };

  if (p === undefined) return <View style={{ flex: 1, backgroundColor: th.colors.background }} />;
  const stage = p?.stage ?? null;
  const need = p?.need ?? null;
  const demo = need ? DEMO_OF[need] : null;
  const Demo = demo ? DEMOS[demo] : null;
  const result = p?.result ?? null;

  function chooseStage(s: LifeStage) {
    void saveIntroProfile(STAGE_PROFILE[s]); // préremplit l'onboarding du foyer après l'inscription
    void update({ stage: s, need: s === stage ? need : null, demoDone: s === stage ? p?.demoDone ?? false : false, result: s === stage ? result : null }, 'need');
  }
  function chooseNeed(n: NeedId) {
    void update({ need: n, demoDone: n === need ? p?.demoDone ?? false : false, result: n === need ? result : null }, 'demo');
  }
  function demoDone(r: DemoResult) {
    motionHaptic('success');
    void track('demo_completed', { stage, need, step: 'demo' });
    void update({ demoDone: true, result: r }, 'result');
  }

  const body = (() => {
    switch (step) {
      case 'stage': return (
        <View style={{ gap: spacing.md }} testID="fw-step-stage">
          <Cascade index={0}><AuraBubble text={tr('fw.stage.aura')} /></Cascade>
          <Cascade index={1}><StepTitle title={tr('fw.stage.title')} /></Cascade>
          <Cascade index={2}>
            <ChoiceList label={tr('fw.stage.title')} radio>
              {STAGES.map((s) => (
                <ChoiceRow key={s} radio icon={STAGE_ICON[s]} label={tr(`fw.stage.${s}` as TKey)} hint={tr(`fw.stage.${s}.d` as TKey)} selected={stage === s}
                  onPress={() => chooseStage(s)} testID={`fw-stage-${s}`} />
              ))}
            </ChoiceList>
          </Cascade>
          <Button label={tr('fw.haveAccount')} variant="ghost" onPress={() => router.push('/auth/sign-in')} testID="fw-have-account" />
        </View>
      );
      case 'need': return (
        <View style={{ gap: spacing.md }} testID="fw-step-need">
          {stage ? <Cascade index={0}><View style={{ alignItems: 'center' }}><HeroArt name={STAGE_ART[stage]} size={112} testID="fw-need-art" /></View></Cascade> : null}
          <Cascade index={1}><StepTitle title={tr('fw.need.title')} lead={tr('fw.need.lead')} /></Cascade>
          <Cascade index={2}>
            <ChoiceList label={tr('fw.need.title')} radio>
              {needsFor(stage).map((n) => (
                <ChoiceRow key={n} radio icon={NEED_ICON[n]} label={tr(`fw.need.${n}` as TKey)} hint={tr(`fw.need.${n}.d` as TKey)} selected={need === n}
                  onPress={() => chooseNeed(n)} testID={`fw-need-${n}`} />
              ))}
            </ChoiceList>
          </Cascade>
        </View>
      );
      case 'demo': return Demo && demo ? (
        <View style={{ gap: spacing.md }} testID="fw-step-demo">
          <Cascade index={0}><AuraBubble text={tr(`fw.demo.${demo}.aura` as TKey)} /></Cascade>
          <Cascade index={1}><Demo onDone={demoDone} result={result} /></Cascade>
        </View>
      ) : null;
      case 'result': return Demo && demo && result && need ? (
        <View style={{ gap: spacing.md }} testID="fw-step-result">
          <View accessible accessibilityRole="header" accessibilityLabel={`${tr('fw.result.a11y')}. ${resultText(result)}`} style={{ alignItems: 'center', gap: spacing.xs }}>
            <SuccessCheck visible size={56} color={th.colors.success} />
            <Text variant="title" center>{tr(`fw.title.${need}` as TKey)}</Text>
            <Text center muted style={NO_HYPHENS} testID="fw-result-text">{resultText(result)}</Text>
          </View>
          <Demo onDone={() => undefined} result={result} />
          <View style={{ gap: spacing.xs }} testID="fw-daily">
            <Text variant="label" accessibilityRole="header">{tr('fw.result.dailyTitle')}</Text>
            {[1, 2, 3].map((i) => <BenefitLine key={i} text={tr(`fw.result.d.${demo}.${i}` as TKey)} />)}
          </View>
        </View>
      ) : null;
    }
  })();

  const footer = step === 'result' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('fw.result.seeOffers')} size="lg" full icon="arrow-right" onPress={() => router.push('/start/offers')} testID="fw-see-offers" />
      <Button label={tr('fw.result.replay')} variant="ghost" full onPress={() => void update({ demoDone: false, result: null }, 'demo')} testID="fw-replay" />
    </View>
  ) : null;

  const index = STEPS.indexOf(step);
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, paddingTop: top }} testID="first-win">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <IconButton icon="arrow-left" label={tr('fw.back')} tone="filled" onPress={back} testID="fw-back" />
        <View style={{ flex: 1 }}>
          <OnbProgress count={STEPS.length} index={index} label={tr('fw.progress', { step: index + 1, total: STEPS.length })} />
        </View>
        <View style={{ width: MIN_TOUCH }} />
      </View>
      <ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {body}
      </ScrollView>
      {footer ? <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: bottom + spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center' }}>{footer}</View> : null}
    </View>
  );
}
