/**
 * Première ouverture — onboarding v3 en 6 ÉTAPES (20/11/2026, demande de la propriétaire ; tutoiement dans ce parcours) :
 *  1 « Pour commencer, parle-nous un peu de toi » (plusieurs réponses) · 2 « Qui fait partie de ton quotidien ? » ·
 *  3 enfants et grossesse (tout facultatif ; jumeaux : même date proposée) · 4 alimentation du nourrisson (seulement
 *  s'il y en a un) · 5 « Qu'aimerais-tu simplifier avec HOMI ? » · 6 ton tableau de bord personnalisé : aperçu calculé
 *  par le moteur réel (src/lib/personalization), accords, puis la RÉVÉLATION (opérations réelles + outils choisis et
 *  leurs raisons), l'écran Premium (sauté si déjà abonné·e) et la proposition de visite guidée.
 * Conservé de la v2 : ouverture (logo), prénom, création du foyer, de la grossesse et des enfants (createPregnancy /
 * createChild, sans doublon en cas de nouvel essai), parcours (planChange / runOps), accords (données de santé
 * obligatoires), brouillon local ET profil avec reprise (anciens brouillons v1/v2 repris à l'étape équivalente),
 * `onboarding_completed`. Les réponses sont enregistrées dans `profiles.onboarding_answers` (version 3) et RELUES par
 * le moteur ; elles se modifient ensuite dans « Modifier mon parcours » (src/app/journeys/answers.tsx).
 * Les comptes qui ont terminé ne passent plus ici (src/app/index.tsx).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Banner, Button, IconButton, Row, Text, haptic } from '@/components/ui';
import { MattePanel, useCompactEntry } from '@/features/entry/EntryKit';
import { useDemoInset } from '@/components/demoInset';
import { useUserId } from '@/lib/auth';
import { backend, eq, isDemo } from '@/lib/backend';
import { ensureHousehold, usePremium } from '@/lib/data/hooks';
import { runOps } from '@/lib/journeys/manager';
import { bodyJourney, childJourneyType, closeOps, planChange, type JourneyRow } from '@/lib/journeys/model';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { ConsentPurpose } from '@/lib/types';
import { ChildForm, createChild, createPregnancy, emptyChild, emptyPregnancy, PregnancyForm, validateChild, validatePregnancy, type ChildDraft } from '@/features/profiles';
import { LEGAL_VERSIONS } from '@/lib/authFlow';
import { introJourneyAnswers, loadIntroProfile } from '@/features/intro/model';
import { loadProgress, saveProgress } from '@/features/firstWin/model';
import { clearDraftLocally, loadDraftLocally, restoreDraft, saveDraftLocally, type BottleFeeding, type OnboardingDraft, type OnboardingStep } from '@/lib/onboardingDraft';
import { interestsFor, journeysFor, personalize, situationsFromJourneys, type Situation } from '@/lib/onboarding/personalize';
import { asksChildren, asksFamily, asksFeeding, asksPregnancy, legacyAnswers, previewFacts } from '@/lib/onboarding/v3';
import { emptyJourneyAnswers, journeyAnswersPayload, readJourneyAnswers, recommend, type JourneyAnswers } from '@/lib/personalization';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { artForAnswers, OnbProgress, StepFade, StepTitle } from '@/features/onboarding/kit';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { OpeningStep } from '@/features/onboarding/OpeningStep';
import { DashboardPreview, FamilyStep, FeedingStep, HouseholdChoiceStep, PrioritiesStep, ProfileStep } from '@/features/onboarding/JourneySteps';
import { ConsentsStep } from '@/features/onboarding/ConsentsStep';
import { RevealStep, type RevealLine } from '@/features/onboarding/RevealStep';
import { PremiumStep } from '@/features/onboarding/PremiumStep';
import { InviteOtherParent } from '@/features/couple/CoupleKit';
import { deferTourOffer, TourOfferStep, useScreenOpen, useTourAllowed } from '@/features/tour/TourEntry';
import { tourDispatch } from '@/features/tour/store';
import { spacing } from '@/theme/tokens';
import { formatList, getLocale, t as tr, type TKey } from '@/i18n';

type Step = 'intro' | 'profile' | 'household' | 'family' | 'feeding' | 'priorities' | 'consents';
type Phase = 'flow' | 'reveal' | 'premium' | 'tour';

/** Étape (1 à 6) de chaque écran ; l'ouverture n'est pas comptée. */
const TEMPS: Record<Step, number> = { intro: 0, profile: 1, household: 2, family: 3, feeding: 4, priorities: 5, consents: 6 };
const TOTAL_TEMPS = 6;
/** Étape d'un ancien brouillon (v1, v2) → étape équivalente du parcours en 6 étapes (jamais tout refaire). */
const FROM_OLD: Record<OnboardingStep, Step> = {
  intro: 'intro', journeys: 'profile', profile: 'profile', needs: 'household', household: 'household', pregnancy: 'family', children: 'family', family: 'family',
  feeding: 'feeding', split: 'priorities', demo: 'priorities', reminders: 'priorities', priorities: 'priorities', consents: 'consents',
};
/** Espace ouvert par chaque situation (ligne de la révélation). */
const SITUATION_SPACE: Record<Situation, 'health' | 'baby' | 'family'> = { ttc: 'health', pregnant: 'health', cycle: 'health', baby: 'baby', kids: 'baby', home: 'family' };

export default function Onboarding() {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const userId = useUserId();
  const premium = usePremium();
  const [step, setStep] = useState<Step>('intro');
  const [phase, setPhase] = useState<Phase>('flow');
  const [name, setName] = useState('');
  const [ja, setJa] = useState<JourneyAnswers>(emptyJourneyAnswers);
  const answers = useMemo(() => legacyAnswers(ja), [ja]);
  const [pregnancy, setPregnancy] = useState(emptyPregnancy());
  const [pErrors, setPErrors] = useState<Record<string, string>>({});
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild()]);
  const [cErrors, setCErrors] = useState<Record<string, string>[]>([{}]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [consents, setConsents] = useState<Record<ConsentPurpose, boolean>>({ terms: true, health_data: true, ai_assistant: false, document_reading: false, analytics: false, crash_reports: false, marketing: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bottleFeeding, setBottleFeeding] = useState<BottleFeeding>(null);
  // Comptes Apple / Google : l'âge et les CGU n'ont pas été demandés à l'inscription
  const [needSignupConsents, setNeedSignupConsents] = useState(false);
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lines, setLines] = useState<RevealLine[]>([]);
  const [revealDone, setRevealDone] = useState(false);
  const finishing = useRef(false);
  const compact = useCompactEntry();
  const win = useWindowDimensions();
  // Démonstration : la pastille « Démo » flotte en haut ; l'écran (sans en-tête) lui laisse sa place
  const demoInset = useDemoInset();
  const demoTop = demoInset ? { paddingTop: insets.top + spacing.md + demoInset } : undefined;

  // Web : aucun défilement horizontal parasite (focus d'un élément qui dépasse pendant une animation) ; le contenu
  // reste aligné sur 0..largeur. Sans effet sur iOS / Android (zones de défilement verticales uniquement).
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const doc = (globalThis as unknown as { document?: Document }).document;
    const win = globalThis as unknown as Window;
    if (!doc) return undefined;
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement | Document | null;
      if (el && 'scrollLeft' in el && el instanceof HTMLElement && el.scrollLeft && !/(auto|scroll)/.test(win.getComputedStyle(el).overflowX)) el.scrollLeft = 0;
      if (win.scrollX) win.scrollTo(0, win.scrollY);
    };
    doc.addEventListener('scroll', onScroll, true);
    return () => doc.removeEventListener('scroll', onScroll, true);
  }, []);

  const journeys = useMemo(() => journeysFor(answers), [answers]);
  const interests = useMemo(() => interestsFor(answers), [answers]);
  const plan = useMemo(() => personalize(answers), [answers]);
  // Aperçu du tableau de bord : le moteur réel, sur les réponses et les enfants / la grossesse saisis
  const pregWeeks = useMemo(() => { const v = validatePregnancy(pregnancy); return v.due ? pregnancyProgress(v.due).weeksSA : null; }, [pregnancy]);
  const facts = useMemo(() => previewFacts(ja, children, pregWeeks), [ja, children, pregWeeks]);

  // Reprise : brouillon le plus récent entre l'appareil et le profil (anciens brouillons v1 compris)
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    // Jamais bloqué sur un écran vide : au pire, on commence au début
    const fallback = setTimeout(() => { if (alive) setHydrated(true); }, 2500);
    (async () => {
      const local = await loadDraftLocally(userId);
      let remote: OnboardingDraft | null = null;
      try {
        const [p] = await backend.select<{ onboarding_state: unknown }>({ table: 'profiles', filters: [eq('id', userId)] });
        remote = restoreDraft((p?.onboarding_state as object) ?? null);
      } catch { /* hors ligne : brouillon local */ }
      try {
        const signed = await backend.select({ table: 'consents', filters: [eq('user_id', userId), eq('purpose', 'terms'), eq('granted', true)], limit: 1 });
        if (alive) setNeedSignupConsents(!signed.length);
      } catch { /* on redemandera à l'envoi si besoin */ }
      const d = [local, remote].filter(Boolean).sort((a, b) => String(b!.savedAt ?? '').localeCompare(String(a!.savedAt ?? '')))[0];
      if (alive && d) {
        setName(d.name); setPregnancy(d.pregnancy); setChildren(d.children.length ? d.children : [emptyChild()]);
        setCErrors(d.children.map(() => ({}))); setReminders(d.reminders); setConsents(d.consents); setBottleFeeding(d.bottleFeeding ?? null);
        setJa(d.answers3 ?? readJourneyAnswers(d.answers ?? situationsFromJourneys(d.journeys)) ?? emptyJourneyAnswers());
        setStep(FROM_OLD[d.step] ?? 'profile');
      } else if (alive) {
        // aucun brouillon : le profil choisi dans l'intro préremplit l'étape 1
        const pre = await loadIntroProfile();
        if (pre && alive) {
          const seed = introJourneyAnswers(pre);
          setJa((x) => (x.profile.length ? x : { ...x, profile: seed.profile, household: x.household ?? seed.household }));
        }
      }
      if (alive) { clearTimeout(fallback); setHydrated(true); }
    })();
    return () => { alive = false; clearTimeout(fallback); };
  }, [userId]);

  // Sauvegarde à chaque étape et à chaque modification (après une courte pause), sur l'appareil ET dans le profil
  useEffect(() => {
    if (!hydrated || !userId || finishing.current || phase !== 'flow') return;
    const id = setTimeout(() => {
      const d: OnboardingDraft = { v: 1, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests, answers, answers3: ja, savedAt: new Date().toISOString() };
      void saveDraftLocally(userId, d);
      backend.update('profiles', { onboarding_state: d }, [eq('id', userId)]).catch(() => undefined);
    }, 400);
    return () => clearTimeout(id);
  }, [hydrated, userId, phase, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests, answers, ja]);

  // Tout est facultatif à l'étape 3 : on ne crée que ce qui est confirmé (date valide ; prénom et date de l'enfant)
  const needsPregnancy = asksPregnancy(ja) && !!pregnancy.date.trim();
  const filledChildren = children.filter((c) => c.first_name.trim() || c.birth_date.trim());
  const needsChildren = asksChildren(ja) && filledChildren.length > 0;
  const steps = useMemo<Step[]>(() => [
    'intro', 'profile', 'household', ...(asksFamily(ja) ? ['family' as Step] : []), ...(asksFeeding(ja, children) ? ['feeding' as Step] : []), 'priorities', 'consents',
  ], [ja, children]);
  const idx = Math.max(0, steps.indexOf(step));
  // Sens du dernier changement d'étape (entrée depuis la droite en avançant, depuis la gauche en revenant)
  const lastIdx = useRef(idx);
  const dir = idx >= lastIdx.current ? 1 : -1;
  useEffect(() => { lastIdx.current = idx; }, [idx]);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const prev = () => { setError(null); setStep(steps[Math.max(idx - 1, 0)]); };
  const temps = phase === 'reveal' ? 6 : phase === 'premium' || phase === 'tour' ? 0 : TEMPS[step];
  // Visite guidée proposée après la révélation et Premium (jamais à une nounou, jamais pendant une urgence)
  // L'accueil doit être ouvert (Premium ou essai) : sinon la visite est gardée pour plus tard (carte de l'accueil)
  const tourAllowed = useTourAllowed();
  const homeOpen = useScreenOpen('/');
  const afterPremium = () => {
    if (tourAllowed && homeOpen) return setPhase('tour');
    if (tourAllowed) deferTourOffer();
    exit();
  };

  function goNext() {
    if (step === 'profile' && !ja.profile.length) return setError(tr('o3.profile.required'));
    if (step === 'family') {
      // grossesse : vérifiée seulement si une date est saisie ; enfant : seulement s'il est commencé (prénom ou date)
      const v = needsPregnancy ? validatePregnancy(pregnancy) : { errors: {}, due: 'ok' };
      setPErrors(v.errors);
      const all = children.map((c) => (c.first_name.trim() || c.birth_date.trim() ? validateChild(c) : { errors: {}, birth: 'skip' }));
      setCErrors(all.map((a) => a.errors));
      if (!v.due || all.some((a) => !a.birth)) return;
    }
    setError(null);
    next();
  }

  function startFinish() {
    if (needSignupConsents && (!adult || !terms)) return setError(tr('onb.consents.signupRequired'));
    if (!consents.health_data) return setError(tr('onb.consents.healthRequired'));
    setError(null);
    setPhase('reveal');
    void finish();
  }

  /** Total de lignes attendues (fenêtres de la maison) : seulement les opérations qui auront lieu. */
  const expectedLines = 3 + (needsPregnancy ? 1 : 0) + (needsChildren ? 1 : 0) + (journeys.length ? 1 : 0);

  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setSaving(true);
    setError(null);
    setLines([]);
    const done = (key: string, text: string) => setLines((l) => (l.some((x) => x.key === key) ? l : [...l, { key, text }]));
    try {
      if (needSignupConsents) {
        await backend.rpc('record_signup_consents', { p_terms_version: LEGAL_VERSIONS.terms, p_privacy_version: LEGAL_VERSIONS.privacy, p_is_adult: true });
        setNeedSignupConsents(false);
      }
      await backend.insert('consents', (Object.entries(consents) as [ConsentPurpose, boolean][]).filter(([purpose]) => purpose !== 'terms').map(([purpose, granted]) => ({ user_id: userId, purpose, granted })));
      done('consents', tr('o2.reveal.consents'));
      const hid = await ensureHousehold(name.trim() ? tr('onb.householdName', { name: name.trim() }) : undefined);
      done('household', tr('o2.reveal.household'));
      // Nouvel essai après une erreur : on ne recrée pas ce qui existe déjà
      // Parcours : une vraie ligne par parcours (user_journeys) ; profiles.journeys en est déduit côté serveur
      const today = todayISO();
      const jrows = () => backend.select<JourneyRow>({ table: 'user_journeys', filters: [eq('user_id', userId)] });
      if (needsPregnancy) {
        const active = await backend.select<{ id: string }>({ table: 'pregnancies', filters: [eq('household_id', hid), eq('status', 'active')], limit: 1 });
        const pid = active[0]?.id ?? (await createPregnancy(hid, userId, pregnancy)).id;
        const rows = await jrows();
        if (!rows.some((r) => r.status === 'active' && r.type === 'pregnancy')) {
          await runOps([...(bodyJourney(rows, userId) ? closeOps(bodyJourney(rows, userId)!, 'archive', 'pregnancy', today) : []), { kind: 'insert', table: 'user_journeys', row: { user_id: userId, household_id: hid, type: 'pregnancy', pregnancy_id: pid, started_on: today } }]);
        }
        done('pregnancy', tr('o2.reveal.pregnancy'));
      } else {
        const body = (['ttc', 'avoid', 'cycle'] as const).find((j) => journeys.includes(j));
        if (body) await runOps(planChange(await jrows(), userId, { type: body }, 'archive', today));
      }
      if (needsChildren) {
        const existing = await backend.select<{ first_name: string; birth_date: string }>({ table: 'children', filters: [eq('household_id', hid)] });
        let created = 0;
        for (const c of filledChildren) {
          if (!c.first_name.trim()) continue;
          const v = validateChild(c);
          if (existing.some((e) => e.first_name.trim().toLowerCase() === c.first_name.trim().toLowerCase() && e.birth_date === v.birth)) continue;
          await createChild(hid, c);
          created++;
        }
        // Chaque enfant du foyer suivi dans son propre parcours (bébé < 2 ans, enfant ensuite)
        const kids = await backend.select<{ id: string; birth_date: string }>({ table: 'children', filters: [eq('household_id', hid)] });
        for (const k of kids) await runOps(planChange(await jrows(), userId, { type: childJourneyType(k.birth_date, today), childId: k.id, householdId: hid }, 'archive', today)).catch(() => undefined);
        if (journeys.includes('newborn') && !ja.profile.includes('dad') && kids.some((k) => k.birth_date > addDays(today, -365))) await runOps(planChange(await jrows(), userId, { type: 'postpartum' }, 'archive', today)).catch(() => undefined);
        done('children', tr('o2.reveal.children', { count: Math.max(created, filledChildren.length) }));
      }
      if (journeys.length) {
        const spaces = [...new Set(answers.situations.map((s) => SITUATION_SPACE[s]))].map((x) => tr(`o2.space.${x}` as TKey));
        done('journeys', tr('o2.reveal.spaces', { list: formatList(spaces) }));
      }
      await backend.update('privacy_settings', { analytics_enabled: consents.analytics, crash_reports_enabled: consents.crash_reports }, [{ col: 'user_id', op: 'eq', value: userId }]);
      await backend.update('profiles', {
        display_name: name.trim() || null, interests, locale: getLocale(), onboarding_completed: true, onboarding_state: null,
        ...(answers.sharing ? { family_situation: answers.sharing } : {}),
      }, [{ col: 'id', op: 'eq', value: userId }]);
      await clearDraftLocally(userId);
      // Réponses du parcours (colonne 20261119000100, version 3) : RELUES par le moteur de recommandation ; jamais
      // bloquant si le serveur n'a pas encore la colonne. Les recommandations calculées sont gardées pour mémoire.
      const tools = recommend(facts, {}, { max: 10 }).map((r) => r.id);
      const payload = journeyAnswersPayload(ja, { situations: answers.situations, needs: answers.needs, sharing: answers.sharing, recommendations: { tools, first_action: plan.first.key, premium: plan.premium } });
      const saved = await backend.update('profiles', { onboarding_answers: payload, onboarding_version: 3 }, [{ col: 'id', op: 'eq', value: userId }]).then(() => true, () => false);
      if (saved) done('answers', tr('o2.reveal.answers'));
      await qc.invalidateQueries();
      haptic('success');
      setRevealDone(true);
    } catch (e) {
      finishing.current = false;
      setError(e instanceof Error && e.message ? e.message : tr('onb.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function loadSample() {
    setSaving(true);
    try {
      await backend.insert('consents', [{ user_id: userId, purpose: 'health_data', granted: true }, { user_id: userId, purpose: 'ai_assistant', granted: true }]);
      await backend.rpc('load_sample_family');
      await qc.invalidateQueries();
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  function exit(route?: string) {
    router.replace('/(tabs)');
    if (route) router.push(route as never);
    // Parcours « première réussite » : l'outil essayé avant l'achat s'ouvre dès que le foyer est créé
    else void loadProgress().then((fw) => { if (fw?.openAfter) { void saveProgress({ openAfter: null }); router.push(fw.openAfter as never); } });
  }

  const back = <IconButton icon="arrow-left" tone="filled" label={tr('common.back')} onPress={prev} testID="onb-back" />;
  const footer = phase === 'tour' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('tour.offer.start')} size="lg" full icon="compass" testID="onb-tour-start"
        onPress={() => { router.replace('/(tabs)'); tourDispatch({ type: 'start' }); }} />
      <Button label={tr('tour.later')} variant="secondary" size="lg" full testID="onb-tour-later" onPress={() => { deferTourOffer(); exit(); }} />
    </View>
  ) : phase === 'premium' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('o2.prem.see')} size="lg" full icon="star" testID="onb-premium-see"
        onPress={() => { if (tourAllowed) deferTourOffer(); router.replace('/(tabs)'); router.push({ pathname: '/premium', params: { from: 'onboarding' } } as never); }} />
      <Button label={tr('o2.prem.skip')} variant="secondary" size="lg" full testID="onb-premium-skip" onPress={afterPremium} />
    </View>
  ) : phase === 'reveal' ? (
    revealDone ? (
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('common.continue')} size="lg" full testID="onb-reveal-next" onPress={() => (premium ? afterPremium() : setPhase('premium'))} />
        <Button label={tr('o2.reveal.startWith', { action: tr(`o2.first.${plan.first.key}` as TKey) })} variant="ghost" full testID="onb-first-action" onPress={() => exit(plan.first.route)} />
      </View>
    ) : error ? (
      <Row style={{ alignItems: 'center' }}>
        <IconButton icon="arrow-left" tone="filled" label={tr('common.back')} onPress={() => { setPhase('flow'); setError(null); }} />
        <Button label={tr('o2.reveal.retry')} size="lg" loading={saving} onPress={() => void finish()} style={{ flex: 1 }} testID="onb-retry" />
      </Row>
    ) : <Button label={tr('o2.reveal.working')} size="lg" full loading disabled onPress={() => undefined} />
  ) : step === 'intro' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('o2.open.cta')} size="lg" full onPress={goNext} testID="onb-start" />
      {isDemo ? <Button label={tr('onb.sample')} variant="ghost" icon="eye" full loading={saving} onPress={loadSample} /> : null}
    </View>
  ) : (
    <Row style={{ alignItems: 'center' }}>
      {back}
      {step === 'consents' ? (
        <Button label={tr('o2.consents.cta')} size="lg" loading={saving} disabled={saving} onPress={startFinish} style={{ flex: 1 }} testID="onb-finish" />
      ) : (
        <Button label={tr('common.continue')} size="lg" onPress={goNext} style={{ flex: 1 }} testID="onb-next" />
      )}
    </Row>
  );

  if (!hydrated) return <Screen footer={null} contentStyle={demoTop}><View style={{ flex: 1 }} /></Screen>;

  const childName = children.find((c) => c.first_name.trim())?.first_name.trim() ?? null;
  const key = phase === 'flow' ? step : phase;
  return (
    <Screen footer={footer} contentStyle={demoTop}>
      {temps > 0 ? <OnbProgress count={TOTAL_TEMPS} index={temps - 1} label={tr('o3.progress', { step: temps, total: TOTAL_TEMPS })} /> : null}
      {/* Temps 2 à 6 : l'illustration de la situation choisie, sur le halo, reste en place d'une question à l'autre (fondu
          enchaîné quand la situation principale change) ; seules les questions entrent et sortent. */}
      {phase === 'flow' && step !== 'intro' ? (
        <HeroArt name={artForAnswers(answers)} size={heroSize(win, { max: 150, min: 88, reserve: 690 })} reveal={false} testID="onb-art" style={{ marginTop: compact ? 0 : spacing.xs }} />
      ) : null}
      {error && phase === 'flow' ? <Banner tone="warning">{error}</Banner> : null}
      <StepFade key={key} dir={phase === 'flow' ? dir : 1}>
        {phase === 'reveal' ? (
          <View style={{ gap: spacing.md }}>
            <RevealStep lines={lines} total={expectedLines} done={revealDone} error={error}
              title={name.trim() ? tr('o2.reveal.titleNamed', { name: name.trim() }) : tr('o2.reveal.title')} />
            {/* 19/11/2026 : foyer à deux → « Ajouter l'autre parent à votre famille ? » (Inviter maintenant / Plus tard) */}
            {/* 6 — ton tableau de bord : les outils choisis par le moteur, avec leurs raisons */}
            {revealDone ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="label" accessibilityRole="header">{tr('o3.dash.title')}</Text>
                <DashboardPreview facts={facts} max={6} testID="onb-reveal-tools" />
              </View>
            ) : null}
            {/* « Inviter un autre parent » : le lien d'invitation existant ; aucun droit n'est déduit des réponses */}
            {revealDone && (ja.invite || ja.household === 'partner' || ja.household === 'separated') ? <InviteOtherParent testID="onb-invite" /> : null}
          </View>
        ) : phase === 'tour' ? (
          <TourOfferStep />
        ) : phase === 'premium' ? (
          <PremiumStep features={plan.premium} childName={childName} />
        ) : step === 'intro' ? (
          <OpeningStep compact={compact} />
        ) : step === 'profile' ? (
          <ProfileStep value={ja.profile} name={name} onName={setName} onChange={(profile) => { setError(null); setJa((a) => ({ ...a, profile })); }} />
        ) : step === 'household' ? (
          <HouseholdChoiceStep value={ja.household} invite={ja.invite} onChange={(household) => setJa((a) => ({ ...a, household }))} onInvite={(invite) => setJa((a) => ({ ...a, invite }))} />
        ) : step === 'family' ? (
          <FamilyStep answers={ja} pregnancy={pregnancy} onPregnancy={setPregnancy} pErrors={pErrors} kids={children} cErrors={cErrors}
            onChildren={(list) => { setChildren(list.length ? list : [emptyChild()]); setCErrors(list.map(() => ({}))); }} />
        ) : step === 'feeding' ? (
          <FeedingStep value={ja.feeding} onChange={(feeding) => setJa((a) => ({ ...a, feeding }))} />
        ) : step === 'priorities' ? (
          <PrioritiesStep value={ja.priorities} onChange={(priorities) => setJa((a) => ({ ...a, priorities }))} />
        ) : (
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <StepTitle title={tr('o3.dash.title')} lead={tr('o3.dash.lead')} />
              <DashboardPreview facts={facts} max={6} />
            </View>
            <ConsentsStep consents={consents} onConsents={setConsents} needSignup={needSignupConsents} adult={adult} terms={terms} onAdult={setAdult} onTerms={setTerms} />
          </View>
        )}
      </StepFade>
    </Screen>
  );
}
