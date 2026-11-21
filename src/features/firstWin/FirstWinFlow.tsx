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
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { Cascade, motionHaptic, SuccessCheck } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { DEMOS, resultText } from './demos';
import { AuraBubble, NO_HYPHENS } from './kit';
import {
  DEMO_OF, loadProgress, needsFor, saveProgress, STAGE_PROFILE, STAGES, stepFor,
  type DemoResult, type FirstWinProgress, type FlowStep, type LifeStage, type NeedId,
} from './model';

const STEPS: FlowStep[] = ['stage', 'need', 'demo', 'result'];
const STAGE_ICON: Record<LifeStage, IconName> = { pregnancy: 'heart', baby: 'moon', child: 'sun' };
const NEED_ICON: Record<NeedId, IconName> = { prepare_birth: 'check-square', feed_sleep: 'clock', mornings: 'sunrise', relay: 'users' };
const STAGE_ART = { pregnancy: 'grossesse', baby: 'bebe', child: 'enfants' } as const;

export function FirstWinFlow({ initialStep, source = 'first_open' }: { initialStep?: FlowStep; source?: string }) {
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const [p, setP] = useState<FirstWinProgress | null | undefined>(undefined);
  const [step, setStep] = useState<FlowStep>('stage');
  const started = useRef(false);
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const { session } = useAuth();
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    void loadProgress().then((saved) => {
      if (!alive) return;
      setP(saved);
      const resumeAt = stepFor(saved);
      setStep(initialStep && STEPS.indexOf(initialStep) <= STEPS.indexOf(resumeAt) ? initialStep : resumeAt);
      if (!saved && !started.current) { started.current = true; void track('onboarding_started', { source }); }
    });
    return () => { alive = false; };
  }, [initialStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scroll.current?.scrollTo?.({ y: 0, animated: false }); }, [step]);
  // Abandon écran par écran (onboarding.md § 6 du skill) : une vue par écran affiché
  const loaded = p !== undefined;
  useEffect(() => { if (loaded) void track('onboarding_step_viewed', { step }); }, [step, loaded]);

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
    void track('onboarding_answer', { step: 'stage', stage: s });
    void update({ stage: s, need: s === stage ? need : null, demoDone: s === stage ? p?.demoDone ?? false : false, result: s === stage ? result : null }, 'need');
  }
  function chooseNeed(n: NeedId) {
    void track('onboarding_answer', { step: 'need', stage, need: n });
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
        <View style={{ flex: 1, gap: spacing.md, justifyContent: 'space-between' }} testID="fw-step-stage">
          <View style={{ gap: spacing.md }}>
            <Cascade index={0}><AuraBubble text={tr('fw.stage.aura')} /></Cascade>
            <Cascade index={1}><StepTitle title={tr('fw.stage.title')} /></Cascade>
          </View>
          {/* Une image sur chaque écran (screens.md § 6) : l'illustration de l'accueil, reprise ici */}
          <View style={{ alignItems: 'center' }}><HeroArt name="famille" size={128} testID="fw-stage-art" /></View>
          {/* Réponses dans la zone du pouce : la question en haut, les cartes en bas */}
          <View style={{ gap: spacing.xs }}>
          <Cascade index={2}>
            <ChoiceList label={tr('fw.stage.title')} radio>
              {STAGES.map((s) => (
                <ChoiceRow key={s} radio icon={STAGE_ICON[s]} label={tr(`fw.stage.${s}` as TKey)} hint={s === 'pregnancy' ? undefined : tr(`fw.stage.${s}.d` as TKey)} selected={stage === s}
                  onPress={() => chooseStage(s)} testID={`fw-stage-${s}`} />
              ))}
            </ChoiceList>
          </Cascade>
          <Button label={tr('fw.haveAccount')} variant="ghost" onPress={() => router.push('/auth/sign-in')} testID="fw-have-account" />
          </View>
        </View>
      );
      case 'need': return (
        <View style={{ flex: 1, gap: spacing.md, justifyContent: 'space-between' }} testID="fw-step-need">
          <View style={{ gap: spacing.sm, alignItems: 'center' }}>
            {stage ? <Cascade index={0}><HeroArt name={STAGE_ART[stage]} size={112} testID="fw-need-art" /></Cascade> : null}
            {/* La réponse précédente, reprise : elle compte pour la suite */}
            {stage ? <Text variant="caption" weight="bold" muted center testID="fw-need-echo">{tr(`fw.stage.${stage}` as TKey)}</Text> : null}
            <Cascade index={1}><StepTitle title={tr('fw.need.title')} /></Cascade>
          </View>
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
          <View accessible accessibilityLabel={`${tr('fw.result.a11y')}. ${tr(`fw.title.${need}` as TKey)}. ${resultText(result)}`} style={{ alignItems: 'center', gap: spacing.xs }}>
            <SuccessCheck visible size={56} color={th.colors.success} />
            <Text variant="title" center accessibilityRole="header" style={NO_HYPHENS} testID="fw-result-title">{tr(`fw.title.${need}` as TKey)}</Text>
            <Text center muted style={NO_HYPHENS} testID="fw-result-text">{resultText(result)}</Text>
          </View>
          {/* Ce que la personne vient de faire, en version courte (le vrai composant, sans le reste de la démo) */}
          <Demo onDone={() => undefined} result={result} compact />
        </View>
      ) : null;
    }
  })();

  const footer = step === 'result' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('fw.result.seeOffers')} size="lg" full icon="arrow-right" onPress={() => router.push('/start/offers')} testID="fw-see-offers" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.sm }}>
        <Button label={tr('fw.result.replay')} variant="ghost" size="sm" onPress={() => void update({ demoDone: false, result: null }, 'demo')} testID="fw-replay" />
        {/* Famille d'exemple (décision de la propriétaire) : lien secondaire, sans compte */}
        {!session ? <Button label={tr('fw.sample')} variant="ghost" size="sm" onPress={() => router.push('/start/sample' as never)} testID="fw-sample" /> : null}
      </View>
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
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {body}
      </ScrollView>
      {footer ? <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: bottom + spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center' }}>{footer}</View> : null}
    </View>
  );
}
