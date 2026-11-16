/**
 * Première ouverture — onboarding v2 « immersif » (19/11/2026), en 8 temps :
 *  1 Ouverture (logo HOMI, titre, action immédiate) · 2 Situation · 3 Besoins + foyer (+ formulaires grossesse /
 *  enfants si le parcours l'exige) · 4 « Qui s'en occupe ? » (geste) · 5 Démonstration (vrais composants, données
 *  d'exemple) · 6 Synthèse calculée + rappels, puis accords · 7 Révélation (opérations réelles) · 8 Premium (sauté si
 *  déjà abonné·e).
 * Conservé de la v1 : prénom, parcours (bodyJourney / childJourneyType / planChange / runOps), grossesse et enfants
 * (createPregnancy / createChild + validations, sans doublon en cas de nouvel essai), rappels suggérés + autorisation
 * des notifications, accords (CONSENT_ROWS, LEGAL_VERSIONS, données de santé obligatoires), brouillon local ET profil
 * avec reprise, ensureHousehold, `onboarding_completed`. Les réponses (situation, besoins, foyer, répartition,
 * recommandations) sont enregistrées dans `profiles.onboarding_answers` (version 2).
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
import { requestPermission } from '@/lib/notifications';
import { runOps } from '@/lib/journeys/manager';
import { bodyJourney, childJourneyType, closeOps, planChange, type JourneyRow } from '@/lib/journeys/model';
import { addDays, todayISO } from '@/lib/domain/dates';
import { reminderSuggestions } from '@/lib/domain/journeys';
import type { ConsentPurpose } from '@/lib/types';
import { ChildForm, createChild, createPregnancy, emptyChild, emptyPregnancy, PregnancyForm, validateChild, validatePregnancy, type ChildDraft } from '@/features/profiles';
import { LEGAL_VERSIONS } from '@/lib/authFlow';
import { clearDraftLocally, loadDraftLocally, restoreDraft, saveDraftLocally, type BottleFeeding, type OnboardingDraft, type OnboardingStep } from '@/lib/onboardingDraft';
import {
  answersPayload, emptyAnswers, interestsFor, journeysFor, needsChildrenForm, needsPregnancyForm, ONBOARDING_VERSION, personalize, situationsFromJourneys,
  splitDeck, type OnboardingAnswers,
} from '@/lib/onboarding/personalize';
import { artForAnswers, OnbProgress, StepFade, StepTitle } from '@/features/onboarding/kit';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { OpeningStep } from '@/features/onboarding/OpeningStep';
import { SITUATION_SPACE, SituationStep } from '@/features/onboarding/SituationStep';
import { HouseholdStep, NeedsStep } from '@/features/onboarding/NeedsStep';
import { SplitStep } from '@/features/onboarding/SplitStep';
import { DemoStep } from '@/features/onboarding/DemoStep';
import { PlanStep } from '@/features/onboarding/PlanStep';
import { ConsentsStep } from '@/features/onboarding/ConsentsStep';
import { RevealStep, type RevealLine } from '@/features/onboarding/RevealStep';
import { PremiumStep } from '@/features/onboarding/PremiumStep';
import { spacing } from '@/theme/tokens';
import { formatList, getLocale, t as tr, type TKey } from '@/i18n';

type Step = Exclude<OnboardingStep, 'feeding'>;
type Phase = 'flow' | 'reveal' | 'premium';

/** Temps (1 à 8) de chaque étape enregistrée. */
const TEMPS: Record<Step, number> = { intro: 1, journeys: 2, needs: 3, household: 3, pregnancy: 3, children: 3, split: 4, demo: 5, reminders: 6, consents: 6 };
const TOTAL_TEMPS = 8;

export default function Onboarding() {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const userId = useUserId();
  const premium = usePremium();
  const [step, setStep] = useState<Step>('intro');
  const [phase, setPhase] = useState<Phase>('flow');
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
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
  const deck = useMemo(() => splitDeck(answers), [answers.situations, answers.needs, answers.helpers]); // eslint-disable-line react-hooks/exhaustive-deps
  const suggestions = useMemo(() => reminderSuggestions(journeys), [journeys]);

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
        setAnswers(d.answers ?? { ...emptyAnswers(), ...situationsFromJourneys(d.journeys), needs: (d.interests ?? []).filter((x): x is 'health' | 'community' => x === 'health' || x === 'community') });
        setStep(d.step === 'feeding' ? 'reminders' : (d.step as Step));
      }
      if (alive) { clearTimeout(fallback); setHydrated(true); }
    })();
    return () => { alive = false; clearTimeout(fallback); };
  }, [userId]);

  // Sauvegarde à chaque étape et à chaque modification (après une courte pause), sur l'appareil ET dans le profil
  useEffect(() => {
    if (!hydrated || !userId || finishing.current || phase !== 'flow') return;
    const id = setTimeout(() => {
      const d: OnboardingDraft = { v: 1, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests, answers, savedAt: new Date().toISOString() };
      void saveDraftLocally(userId, d);
      backend.update('profiles', { onboarding_state: d }, [eq('id', userId)]).catch(() => undefined);
    }, 400);
    return () => clearTimeout(id);
  }, [hydrated, userId, phase, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests, answers]);

  const needsPregnancy = needsPregnancyForm(answers);
  const needsChildren = needsChildrenForm(answers);
  const steps = useMemo<Step[]>(() => [
    'intro', 'journeys', 'needs', 'household', ...(needsPregnancy ? ['pregnancy' as Step] : []), ...(needsChildren ? ['children' as Step] : []),
    'split', 'demo', 'reminders', 'consents',
  ], [needsPregnancy, needsChildren]);
  const idx = Math.max(0, steps.indexOf(step));
  // Sens du dernier changement d'étape (entrée depuis la droite en avançant, depuis la gauche en revenant)
  const lastIdx = useRef(idx);
  const dir = idx >= lastIdx.current ? 1 : -1;
  useEffect(() => { lastIdx.current = idx; }, [idx]);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const prev = () => { setError(null); setStep(steps[Math.max(idx - 1, 0)]); };
  const temps = phase === 'reveal' ? 7 : phase === 'premium' ? 8 : TEMPS[step];

  function goNext() {
    if (step === 'journeys' && !answers.situations.length) return setError(tr('o2.sit.required'));
    if (step === 'pregnancy') {
      const v = validatePregnancy(pregnancy);
      setPErrors(v.errors);
      if (!v.due) return;
    }
    if (step === 'children') {
      const all = children.map(validateChild);
      setCErrors(all.map((a) => a.errors));
      if (all.some((a) => !a.birth)) return;
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
  const expectedLines = 3 + (needsPregnancy ? 1 : 0) + (needsChildren ? 1 : 0) + (journeys.length ? 1 : 0) + 1;

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
        for (const c of children) {
          if (!c.first_name.trim()) continue;
          const v = validateChild(c);
          if (existing.some((e) => e.first_name.trim().toLowerCase() === c.first_name.trim().toLowerCase() && e.birth_date === v.birth)) continue;
          await createChild(hid, c);
          created++;
        }
        // Chaque enfant du foyer suivi dans son propre parcours (bébé < 2 ans, enfant ensuite)
        const kids = await backend.select<{ id: string; birth_date: string }>({ table: 'children', filters: [eq('household_id', hid)] });
        for (const k of kids) await runOps(planChange(await jrows(), userId, { type: childJourneyType(k.birth_date, today), childId: k.id, householdId: hid }, 'archive', today)).catch(() => undefined);
        if (journeys.includes('newborn') && kids.some((k) => k.birth_date > addDays(today, -365))) await runOps(planChange(await jrows(), userId, { type: 'postpartum' }, 'archive', today)).catch(() => undefined);
        done('children', tr('o2.reveal.children', { count: Math.max(created, children.filter((c) => c.first_name.trim()).length) }));
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
      const chosen = suggestions.filter((r) => reminders.includes(r.key));
      if (chosen.length) {
        await backend.insert('reminders', chosen.map((r) => ({ user_id: userId, household_id: hid, category: r.category, title: r.title, body: r.body, schedule: r.schedule, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: r.deep_link, journey_type: r.journey_type })));
        await requestPermission().catch(() => undefined);
      }
      done('reminders', chosen.length ? tr('o2.reveal.reminders', { count: chosen.length }) : tr('o2.reveal.remindersNone'));
      // Réponses du parcours (colonne 20261119000100) : jamais bloquant si le serveur n'a pas encore la colonne
      const saved = await backend.update('profiles', { onboarding_answers: answersPayload(answers, plan), onboarding_version: ONBOARDING_VERSION }, [{ col: 'id', op: 'eq', value: userId }]).then(() => true, () => false);
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
  }

  const back = <IconButton icon="arrow-left" tone="filled" label={tr('common.back')} onPress={prev} testID="onb-back" />;
  const footer = phase === 'premium' ? (
    <View style={{ gap: spacing.xs }}>
      <Button label={tr('o2.prem.see')} size="lg" full icon="star" testID="onb-premium-see"
        onPress={() => { router.replace('/(tabs)'); router.push({ pathname: '/premium', params: { from: 'onboarding' } } as never); }} />
      <Button label={tr('o2.prem.skip')} variant="secondary" size="lg" full testID="onb-premium-skip" onPress={() => exit()} />
    </View>
  ) : phase === 'reveal' ? (
    revealDone ? (
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('common.continue')} size="lg" full testID="onb-reveal-next" onPress={() => (premium ? exit() : setPhase('premium'))} />
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
      {temps > 1 ? <OnbProgress count={TOTAL_TEMPS} index={temps - 1} label={tr('o2.progress', { step: temps, total: TOTAL_TEMPS })} /> : null}
      {/* Temps 2 à 6 : l'illustration de la situation choisie, sur le halo, reste en place d'une question à l'autre (fondu
          enchaîné quand la situation principale change) ; seules les questions entrent et sortent. */}
      {phase === 'flow' && step !== 'intro' ? (
        <HeroArt name={artForAnswers(answers)} size={heroSize(win, { max: 150, min: 88, reserve: 690 })} reveal={false} testID="onb-art" style={{ marginTop: compact ? 0 : spacing.xs }} />
      ) : null}
      {error && phase === 'flow' ? <Banner tone="warning">{error}</Banner> : null}
      <StepFade key={key} dir={phase === 'flow' ? dir : 1}>
        {phase === 'reveal' ? (
          <RevealStep lines={lines} total={expectedLines} done={revealDone} error={error}
            title={name.trim() ? tr('o2.reveal.titleNamed', { name: name.trim() }) : tr('o2.reveal.title')} />
        ) : phase === 'premium' ? (
          <PremiumStep features={plan.premium} childName={childName} />
        ) : step === 'intro' ? (
          <OpeningStep compact={compact} />
        ) : step === 'journeys' ? (
          <SituationStep situations={answers.situations} cycleGoal={answers.cycleGoal}
            onChange={(situations) => { setError(null); setAnswers((a) => ({ ...a, situations })); }} onGoal={(cycleGoal) => setAnswers((a) => ({ ...a, cycleGoal }))} />
        ) : step === 'needs' ? (
          <NeedsStep answers={answers} onNeeds={(needs) => setAnswers((a) => ({ ...a, needs }))} />
        ) : step === 'household' ? (
          <HouseholdStep answers={answers} name={name} onName={setName}
            onSharing={(sharing) => setAnswers((a) => ({ ...a, sharing, split: {} }))} onHelpers={(helpers) => setAnswers((a) => ({ ...a, helpers }))} />
        ) : step === 'pregnancy' ? (
          <View style={{ gap: spacing.md }}>
            <StepTitle title={tr('onb.pregnancy.title')} lead={tr('onb.pregnancy.body')} />
            <MattePanel><PregnancyForm value={pregnancy} onChange={setPregnancy} errors={pErrors} /></MattePanel>
          </View>
        ) : step === 'children' ? (
          <View style={{ gap: spacing.md }}>
            <StepTitle title={tr('onb.children.title', { count: children.length })} lead={tr('onb.children.body')} />
            {children.map((c, i) => (
              <MattePanel key={i}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text weight="bold">{tr('onb.children.item', { n: i + 1 })}</Text>
                  {children.length > 1 ? (
                    <Button label={tr('onb.children.remove')} variant="ghost" icon="x" size="sm"
                      onPress={() => { setChildren(children.filter((_, j) => j !== i)); setCErrors(cErrors.filter((_, j) => j !== i)); }} />
                  ) : null}
                </Row>
                <ChildForm value={c} onChange={(v) => setChildren(children.map((x, j) => (j === i ? v : x)))} errors={cErrors[i] ?? {}} />
              </MattePanel>
            ))}
            <Button label={tr('onb.children.add')} variant="secondary" icon="plus" onPress={() => { setChildren([...children, emptyChild()]); setCErrors([...cErrors, {}]); }} />
          </View>
        ) : step === 'split' ? (
          <SplitStep answers={answers} deck={deck} name={name}
            onAssign={(task, who) => setAnswers((a) => ({ ...a, split: { ...a.split, [task]: who } }))} onReset={() => setAnswers((a) => ({ ...a, split: {} }))} />
        ) : step === 'demo' ? (
          <DemoStep answers={answers} deck={deck} name={name} />
        ) : step === 'reminders' ? (
          <PlanStep plan={plan} reminders={suggestions} chosen={reminders}
            onToggleReminder={(k) => { haptic('selection'); setReminders(reminders.includes(k) ? reminders.filter((x) => x !== k) : [...reminders, k]); }} />
        ) : (
          <ConsentsStep consents={consents} onConsents={setConsents} needSignup={needSignupConsents} adult={adult} terms={terms} onAdult={setAdult} onTerms={setTerms} />
        )}
      </StepFade>
    </Screen>
  );
}
