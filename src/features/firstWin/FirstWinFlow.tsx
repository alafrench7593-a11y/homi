/**
 * Parcours court AVANT l'abonnement — refonte du 21/11/2026, deux écrans :
 *  1. « Où en est ta famille ? » : l'étape de vie, puis, juste dessous, les besoins qui se révèlent (glissement court) ;
 *     un seul bouton « Continuer », actif quand un besoin est choisi. Contenu défilant (petit iPhone, texte agrandi),
 *     aucune hauteur fixe ; le retour arrière garde les réponses ;
 *  2. la démo guidée par Aura (consigne courte prédéfinie, aucun appel IA) dans le VRAI composant de l'outil avec des
 *     données « Exemple » ; après l'action, le résultat reste affiché à sa place (plus d'écran « résultat ») et le
 *     bouton lié au besoin (« Utiliser ce suivi pour mon bébé ») ouvre l'offre.
 * Aucun compte demandé ici (le compte vient APRÈS le choix de la formule, juste avant le paiement). Progression gardée
 * sur l'appareil : fermeture et réouverture reprennent à la même étape.
 * Mouvement : entrées en cascade courte, besoins révélés (`Reveal`) ; Réduire les animations → états finaux immédiats.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Button, IconButton, Text, type IconName } from '@/components/ui';
import { HeroArt } from '@/features/entry/HeroArt';
import { saveIntroProfiles } from '@/features/intro/model';
import { ChoiceList, ChoiceRow, OnbProgress, StepTitle } from '@/features/onboarding/kit';
import { track } from '@/lib/analytics/events';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { Cascade, motionHaptic, Reveal } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { DEMOS } from './demos';
import { AuraBubble } from './kit';
import {
  DEMO_OF, FLOW_STEPS, loadProgress, needsForMany, saveProgress, STAGE_PROFILE, STAGES, stepFor, toggleStage, USE_CTA,
  type DemoResult, type FirstWinProgress, type FlowStep, type LifeStage, type NeedId,
} from './model';

const STAGE_ICON: Record<LifeStage, IconName> = { pregnancy: 'heart', baby: 'moon', child: 'sun' };
const NEED_ICON: Record<NeedId, IconName> = { prepare_birth: 'check-square', feed_sleep: 'clock', mornings: 'sunrise', relay: 'users' };
const STAGE_ART = { pregnancy: 'grossesse', baby: 'bebe', child: 'enfants' } as const;

export function FirstWinFlow({ initialStep, source = 'first_open' }: { initialStep?: FlowStep; source?: string }) {
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const [p, setP] = useState<FirstWinProgress | null | undefined>(undefined);
  const [step, setStep] = useState<FlowStep>('profile');
  const started = useRef(false);
  const demoViewed = useRef<string | null>(null);
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const { session } = useAuth();
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    void loadProgress().then((saved) => {
      if (!alive) return;
      setP(saved);
      const resumeAt = stepFor(saved);
      setStep(initialStep && FLOW_STEPS.indexOf(initialStep) <= FLOW_STEPS.indexOf(resumeAt) ? initialStep : resumeAt);
      if (!saved && !started.current) { started.current = true; void track('onboarding_started', { source }); }
    });
    return () => { alive = false; };
  }, [initialStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scroll.current?.scrollTo?.({ y: 0, animated: false }); }, [step]);
  // Abandon écran par écran : une vue par écran affiché
  const loaded = p !== undefined;
  useEffect(() => { if (loaded) void track('onboarding_step_viewed', { step }); }, [step, loaded]);

  async function update(patch: Partial<FirstWinProgress>, next?: FlowStep) {
    setP(await saveProgress(patch));
    if (next) setStep(next);
  }
  const back = () => {
    if (step === 'demo') return setStep('profile'); // les réponses restent sélectionnées
    setIntroSeen(true);
    return router.canGoBack() ? router.back() : router.replace('/welcome');
  };

  const stage = p?.stage ?? null;
  const stages = p?.stages ?? (stage ? [stage] : []);
  const need = p?.need ?? null;
  const demo = need ? DEMO_OF[need] : null;
  const result = p?.result ?? null;
  // Démo commencée : une fois par besoin affiché (dédupliqué), sans donnée personnelle
  useEffect(() => {
    if (step !== 'demo' || !need || demoViewed.current === need) return;
    demoViewed.current = need;
    void track('demo_started', { stage, need });
  }, [step, need]); // eslint-disable-line react-hooks/exhaustive-deps

  if (p === undefined) return <View style={{ flex: 1, backgroundColor: th.colors.background }} />;
  const Demo = demo ? DEMOS[demo] : null;

  // Plusieurs réponses possibles (23/11/2026) : plus d'étapes cochées = plus d'outils préparés après l'inscription
  function chooseStage(s: LifeStage) {
    const next = toggleStage(stages, s);
    void saveIntroProfiles(next.map((x) => STAGE_PROFILE[x])); // préremplit l'onboarding du foyer après l'inscription
    void track('onboarding_answer', { step: 'stage', stage: s });
    // Le besoin choisi reste s'il est encore proposé ; sinon le besoin et la démo repartent de zéro
    const keep = need && needsForMany(next).includes(need);
    void update({ stages: next, stage: next[0] ?? null, ...(keep ? {} : { need: null, demoDone: false, result: null }) });
    // Les besoins viennent juste dessous : la page glisse pour les montrer (petit iPhone, texte agrandi)
    if (next.length) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 260);
  }
  function chooseNeed(n: NeedId) {
    if (n === need) return;
    void track('onboarding_answer', { step: 'need', stage, need: n });
    void update({ need: n, demoDone: false, result: null });
  }
  function demoDone(r: DemoResult) {
    motionHaptic('success');
    void track('demo_completed', { stage, need, step: 'demo' });
    void update({ demoDone: true, result: r });
  }

  const body = step === 'profile' ? (
    <View style={{ gap: spacing.md }} testID="fw-step-profile">
      <Cascade index={0}><AuraBubble text={tr('fw.stage.aura')} /></Cascade>
      {/* Titre, illustration et choix rapprochés ; l'illustration suit l'étape choisie */}
      <Cascade index={1}>
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <HeroArt name={stage ? STAGE_ART[stage] : 'famille'} size={96} testID="fw-stage-art" />
          <StepTitle title={tr('fw.stage.title')} />
        </View>
      </Cascade>
      <Cascade index={2}>
        <Text variant="small" muted center testID="fw-stage-multi">{tr('fw.stage.multi')}</Text>
        <ChoiceList label={tr('fw.stage.title')} testID="fw-stages">
          {STAGES.map((s) => (
            <ChoiceRow key={s} icon={STAGE_ICON[s]} label={tr(`fw.stage.${s}` as TKey)} hint={s === 'pregnancy' ? undefined : tr(`fw.stage.${s}.d` as TKey)} selected={stages.includes(s)}
              onPress={() => chooseStage(s)} testID={`fw-stage-${s}`} />
          ))}
        </ChoiceList>
      </Cascade>
      {/* Les besoins se révèlent juste sous la réponse ; la page défile pour les montrer (petit écran) */}
      <Reveal visible={!!stage} scrollIntoView testID="fw-needs">
        <View style={{ gap: spacing.sm }}>
          <Text variant="heading" accessibilityRole="header" testID="fw-need-title">{tr('fw.need.title')}</Text>
          <ChoiceList label={tr('fw.need.title')} radio>
            {needsForMany(stages).map((n) => (
              <ChoiceRow key={n} radio icon={NEED_ICON[n]} label={tr(`fw.need.${n}` as TKey)} hint={tr(`fw.need.${n}.d` as TKey)} selected={need === n}
                onPress={() => chooseNeed(n)} testID={`fw-need-${n}`} />
            ))}
          </ChoiceList>
        </View>
      </Reveal>
    </View>
  ) : Demo && demo ? (
    <View style={{ gap: spacing.md }} testID="fw-step-demo">
      <Cascade index={0}><AuraBubble text={tr(result ? `fw.demo.${demo}.after` as TKey : `fw.demo.${demo}.aura` as TKey)} /></Cascade>
      {/* Le résultat reste dans le vrai composant (la sieste à sa place dans la frise, la tâche cochée…) */}
      <Cascade index={1}><Demo onDone={demoDone} result={result} /></Cascade>
    </View>
  ) : null;

  const footer = step === 'profile' ? (
    <View style={{ gap: spacing.xxs }}>
      <Button label={tr('fw.continue')} size="lg" full icon="arrow-right" disabled={!stage || !need}
        onPress={() => { void update({}, 'demo'); }} testID="fw-continue" />
      <Button label={tr('fw.haveAccount')} variant="ghost" size="sm" onPress={() => router.push('/auth/sign-in')} testID="fw-have-account" />
    </View>
  ) : result && need ? (
    <Reveal visible appear testID="fw-use">
      <View style={{ gap: spacing.xxs }}>
        <Button label={tr(USE_CTA[need])} size="lg" full icon="arrow-right" onPress={() => router.push('/start/offers')} testID="fw-see-offers" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.sm }}>
          <Button label={tr('fw.result.replay')} variant="ghost" size="sm" onPress={() => void update({ demoDone: false, result: null })} testID="fw-replay" />
          {/* Famille d'exemple (décision de la propriétaire) : lien secondaire, sans compte */}
          {!session ? <Button label={tr('fw.sample')} variant="ghost" size="sm" onPress={() => router.push('/start/sample' as never)} testID="fw-sample" /> : null}
        </View>
      </View>
    </Reveal>
  ) : null;

  const index = FLOW_STEPS.indexOf(step);
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, paddingTop: top }} testID="first-win">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <IconButton icon="arrow-left" label={tr('fw.back')} tone="filled" onPress={back} testID="fw-back" />
        <View style={{ flex: 1 }}>
          <OnbProgress count={FLOW_STEPS.length} index={index} label={tr('fw.progress', { step: index + 1, total: FLOW_STEPS.length })} />
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
