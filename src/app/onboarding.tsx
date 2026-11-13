/**
 * Première ouverture : court, doux, et ne demande que l'utile (HOMI, entrée Keynote).
 * Un point focal par étape d'accueil (logo, puis coche de l'écran « prêt »), une seule action principale en pied
 * d'écran (« Continuer » à largeur stable, au-dessus du clavier) ; « Retour » est un bouton rond qui revient à l'étape
 * précédente SANS perdre la saisie (tout l'état vit ici, les étapes sont des vues contrôlées).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, Row, Text, Toggle } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { ensureHousehold } from '@/lib/data/hooks';
import { requestPermission } from '@/lib/notifications';
import { runOps } from '@/lib/journeys/manager';
import { bodyJourney, childJourneyType, closeOps, planChange, type JourneyRow } from '@/lib/journeys/model';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { ConsentPurpose, Journey } from '@/lib/types';
import { ChildForm, createChild, createPregnancy, emptyChild, emptyPregnancy, PregnancyForm, validateChild, validatePregnancy, type ChildDraft } from '@/features/profiles';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { FocalMark, useCompactEntry } from '@/features/entry/EntryKit';
import { DEMO_PILL_HEIGHT } from '@/components/DemoBar';
import { useBackendMode } from '@/lib/demoMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INTERESTS, interestHint, interestLabel, journeyOptions, reminderSuggestions, type Interest } from '@/lib/domain/journeys';
import { formatList, getLocale, t as tr } from '@/i18n';
import { BRAND } from '@/config/brand';
import { eq } from '@/lib/backend';
import { LEGAL_VERSIONS } from '@/lib/authFlow';
import { CheckRow, LegalLink } from '@/features/auth';
import { clearDraftLocally, loadDraftLocally, restoreDraft, saveDraftLocally, type BottleFeeding, type OnboardingDraft } from '@/lib/onboardingDraft';
import { Tappable } from '@/components/Tappable';
import { StaggerItem, StepProgress, StepSwap } from '@/components/Motion';

type Step = 'intro' | 'journeys' | 'pregnancy' | 'children' | 'reminders' | 'consents';

/** Accords proposés à l'inscription : clé enregistrée, clé de texte, obligatoire. */
const CONSENT_ROWS: [ConsentPurpose, 'healthData' | 'aiAssistant' | 'documentReading' | 'crashReports' | 'analytics', boolean][] = [
  ['health_data', 'healthData', true], ['ai_assistant', 'aiAssistant', false], ['document_reading', 'documentReading', false],
  ['crash_reports', 'crashReports', false], ['analytics', 'analytics', false],
];

/** Résumé affiché une fois l'espace créé (écran « prêt »). */
interface ReadySummary { journeys: string[]; pregnancy: boolean; children: number; reminders: number; cycle: boolean; community: boolean }

export default function Onboarding() {
  const t = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const userId = useUserId();
  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('');
  const [journeys, setJourneys] = useState<Journey[]>([]);
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
  const [interests, setInterests] = useState<Interest[]>([]);
  const [ready, setReady] = useState<ReadySummary | null>(null);
  const JOURNEYS = journeyOptions();
  const finishing = useRef(false);
  const compact = useCompactEntry();
  // Démonstration : la pastille « Démo » flotte en haut ; l'écran (sans en-tête) lui laisse sa place
  const demoTop = useBackendMode().isDemo ? { paddingTop: insets.top + spacing.md + DEMO_PILL_HEIGHT } : undefined;

  // Reprise : brouillon le plus récent entre l'appareil et le profil
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const local = await loadDraftLocally(userId);
      let remote: OnboardingDraft | null = null;
      try {
        const [p] = await backend.select<{ onboarding_state: unknown }>({ table: 'profiles', filters: [eq('id', userId)] });
        remote = restoreDraft((p?.onboarding_state as object) ?? null);
      } catch { /* hors ligne : brouillon local */ }
      try {
        const terms = await backend.select({ table: 'consents', filters: [eq('user_id', userId), eq('purpose', 'terms'), eq('granted', true)], limit: 1 });
        if (alive) setNeedSignupConsents(!terms.length);
      } catch { /* on redemandera à l'envoi si besoin */ }
      const d = [local, remote].filter(Boolean).sort((a, b) => String(b!.savedAt ?? '').localeCompare(String(a!.savedAt ?? '')))[0];
      if (alive && d) {
        setName(d.name); setJourneys(d.journeys); setPregnancy(d.pregnancy); setChildren(d.children.length ? d.children : [emptyChild()]);
        setCErrors(d.children.map(() => ({}))); setReminders(d.reminders); setConsents(d.consents); setBottleFeeding(d.bottleFeeding ?? null);
        setInterests((d.interests ?? []).filter((x): x is Interest => x === 'health' || x === 'community'));
        setStep(d.step === 'feeding' ? 'reminders' : (d.step as Step));
      }
      if (alive) setHydrated(true);
    })();
    return () => { alive = false; };
  }, [userId]);

  // Sauvegarde à chaque étape et à chaque modification (après une courte pause)
  useEffect(() => {
    if (!hydrated || !userId || finishing.current) return;
    const id = setTimeout(() => {
      const d: OnboardingDraft = { v: 1, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests, savedAt: new Date().toISOString() };
      void saveDraftLocally(userId, d);
      backend.update('profiles', { onboarding_state: d }, [eq('id', userId)]).catch(() => undefined);
    }, 500);
    return () => clearTimeout(id);
  }, [hydrated, userId, step, name, journeys, pregnancy, children, reminders, consents, bottleFeeding, interests]);

  const needsPregnancy = journeys.includes('pregnant');
  const needsChildren = journeys.some((j) => j === 'newborn' || j === 'child' || j === 'family');
  const steps = useMemo<Step[]>(() => ['intro', 'journeys', ...(needsPregnancy ? ['pregnancy' as Step] : []), ...(needsChildren ? ['children' as Step] : []), 'reminders', 'consents'], [needsPregnancy, needsChildren]);
  const idx = steps.indexOf(step);
  // Sens du dernier changement d'étape (glissement depuis la droite en avançant, depuis la gauche en revenant)
  const lastIdx = useRef(idx);
  const dir = idx >= lastIdx.current ? 1 : -1;
  useEffect(() => { lastIdx.current = idx; }, [idx]);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const prev = () => setStep(steps[Math.max(idx - 1, 0)]);

  function goNext() {
    if (step === 'journeys' && !journeys.length) return setError(tr('onb.journeys.required'));
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

  async function finish() {
    if (finishing.current) return;
    if (needSignupConsents && (!adult || !terms)) return setError(tr('onb.consents.signupRequired'));
    if (!consents.health_data) return setError(tr('onb.consents.healthRequired'));
    finishing.current = true;
    setSaving(true);
    setError(null);
    try {
      if (needSignupConsents) {
        await backend.rpc('record_signup_consents', { p_terms_version: LEGAL_VERSIONS.terms, p_privacy_version: LEGAL_VERSIONS.privacy, p_is_adult: true });
        setNeedSignupConsents(false);
      }
      await backend.insert('consents', (Object.entries(consents) as [ConsentPurpose, boolean][]).filter(([purpose]) => purpose !== 'terms').map(([purpose, granted]) => ({ user_id: userId, purpose, granted })));
      const hid = await ensureHousehold(name ? tr('onb.householdName', { name }) : undefined);
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
      } else {
        const body = (['ttc', 'avoid', 'cycle'] as const).find((j) => journeys.includes(j));
        if (body) await runOps(planChange(await jrows(), userId, { type: body }, 'archive', today));
      }
      let createdChildren = 0;
      if (needsChildren) {
        const existing = await backend.select<{ first_name: string; birth_date: string }>({ table: 'children', filters: [eq('household_id', hid)] });
        for (const c of children) {
          if (!c.first_name.trim()) continue;
          const v = validateChild(c);
          if (existing.some((e) => e.first_name.trim().toLowerCase() === c.first_name.trim().toLowerCase() && e.birth_date === v.birth)) continue;
          await createChild(hid, c);
          createdChildren++;
        }
        // Chaque enfant du foyer suivi dans son propre parcours (bébé < 2 ans, enfant ensuite)
        const kids = await backend.select<{ id: string; birth_date: string }>({ table: 'children', filters: [eq('household_id', hid)] });
        for (const k of kids) await runOps(planChange(await jrows(), userId, { type: childJourneyType(k.birth_date, today), childId: k.id, householdId: hid }, 'archive', today)).catch(() => undefined);
        if (journeys.includes('newborn') && kids.some((k) => k.birth_date > addDays(today, -365))) await runOps(planChange(await jrows(), userId, { type: 'postpartum' }, 'archive', today)).catch(() => undefined);
      }
      await backend.update('privacy_settings', { analytics_enabled: consents.analytics, crash_reports_enabled: consents.crash_reports }, [{ col: 'user_id', op: 'eq', value: userId }]);
      await backend.update('profiles', { display_name: name.trim() || null, interests, locale: getLocale(), onboarding_completed: true, onboarding_state: null }, [{ col: 'id', op: 'eq', value: userId }]);
      await clearDraftLocally(userId);
      const chosen = reminderSuggestions(journeys).filter((r) => reminders.includes(r.key));
      if (chosen.length) {
        await backend.insert('reminders', chosen.map((r) => ({ user_id: userId, household_id: hid, category: r.category, title: r.title, body: r.body, schedule: r.schedule, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: r.deep_link, journey_type: r.journey_type })));
        await requestPermission().catch(() => undefined);
      }
      await qc.invalidateQueries();
      haptic('success');
      const labels = JOURNEYS.filter((o) => journeys.includes(o.key)).map((o) => o.label);
      setReady({
        journeys: labels,
        pregnancy: needsPregnancy,
        children: needsChildren ? Math.max(createdChildren, children.filter((c) => c.first_name.trim()).length) : 0,
        reminders: chosen.length,
        cycle: journeys.some((j) => j === 'cycle' || j === 'ttc' || j === 'avoid'),
        community: interests.includes('community'),
      });
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

  const progress = (
    <StepProgress count={steps.length} index={idx} color={t.colors.primary} track={t.colors.border} accessibilityLabel={tr('onb.progress', { step: idx + 1, total: steps.length })} />
  );

  const footer = ready ? (
    <Button label={tr('onb.ready.cta')} size="lg" full onPress={() => router.replace('/(tabs)')} />
  ) : step === 'intro' ? (
    <Button label={tr('onb.start')} size="lg" full onPress={goNext} />
  ) : (
    <Row style={{ alignItems: 'center' }}>
      <IconButton icon="arrow-left" tone="filled" label={tr('common.back')} onPress={prev} />
      {step === 'consents' ? (
        <Button label={tr('onb.go')} size="lg" loading={saving} disabled={saving} onPress={finish} style={{ flex: 1 }} testID="onb-finish" />
      ) : (
        <Button label={tr('common.continue')} size="lg" onPress={goNext} style={{ flex: 1 }} testID="onb-next" />
      )}
    </Row>
  );

  if (ready) {
    const lines: { icon: IconName; text: string }[] = [
      ...(ready.journeys.length ? [{ icon: 'compass' as IconName, text: tr('onb.ready.journeys', { list: formatList(ready.journeys) }) }] : []),
      ...(ready.pregnancy ? [{ icon: 'moon' as IconName, text: tr('onb.ready.pregnancy') }] : []),
      ...(ready.children ? [{ icon: 'smile' as IconName, text: tr('onb.ready.children', { count: ready.children }) }] : []),
      ...(ready.cycle ? [{ icon: 'calendar' as IconName, text: tr('onb.ready.cycle') }] : []),
      { icon: 'bell' as IconName, text: tr('onb.ready.reminders', { count: ready.reminders }) },
      ...(ready.community ? [{ icon: 'users' as IconName, text: tr('onb.ready.community') }] : []),
      { icon: 'lock' as IconName, text: tr('onb.ready.privacy') },
    ];
    return (
      <Screen stars footer={footer} contentStyle={demoTop}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg }}>
          {/* Compte prêt : la pastille de confirmation apparaît en « pop », puis le résumé en cascade */}
          <FocalMark icon="check" size={compact ? 120 : 200} />
          <Text variant="title" center accessibilityRole="header">{name.trim() ? tr('onb.ready.titleNamed', { name: name.trim() }) : tr('onb.ready.title')}</Text>
          <Text center muted style={{ maxWidth: 340 }}>{tr('onb.ready.body')}</Text>
        </View>
        <Card>
          <View style={{ gap: spacing.sm }} accessibilityRole="list">
            {lines.map((l, i) => (
              <StaggerItem key={l.text} index={i + 3}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Icon name={l.icon} color={t.colors.primary} />
                  <Text style={{ flex: 1 }}>{l.text}</Text>
                </Row>
              </StaggerItem>
            ))}
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen stars={step === 'intro'} footer={footer} contentStyle={demoTop}>
      {step !== 'intro' && progress}
      {error ? <Banner tone="warning">{error}</Banner> : null}

      <StepSwap key={step} dir={dir}>
      {step === 'intro' && (
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: compact ? 0 : spacing.md }}>
          <FocalMark logo size={compact ? 140 : 240} />
          <Text variant="hero" center accessibilityRole="header">{tr('onb.welcome')}</Text>
          <Text center muted style={{ maxWidth: 340 }}>
            {tr('onb.welcomeBody', { app: BRAND.name })}
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Field label={tr('onb.nameLabel')} optional value={name} onChangeText={setName} maxLength={40} autoCapitalize="words" />
          </View>
          {isDemo && <Button label={tr('onb.sample')} variant="ghost" icon="eye" loading={saving} onPress={loadSample} />}
        </View>
      )}

      {step === 'journeys' && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="title" accessibilityRole="header">{tr('onb.journeys.title')}</Text>
          <Text muted>{tr('onb.journeys.body')}</Text>
          {JOURNEYS.filter((j) => j.key !== 'avoid' && j.key !== 'ttc').map((j) => {
            // « Suivre mon cycle » : une seule carte ; l'objectif se choisit juste en dessous
            const BODY = ['cycle', 'avoid', 'ttc'] as Journey[];
            const isCycle = j.key === 'cycle';
            const sel = isCycle ? journeys.some((x) => BODY.includes(x)) : journeys.includes(j.key);
            return (
              <View key={j.key} style={{ gap: spacing.xs }}>
              <Tappable
                key={j.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`${j.label}. ${j.hint}`}
                onPress={() => { haptic('selection'); setJourneys(isCycle ? (sel ? journeys.filter((x) => !BODY.includes(x)) : [...journeys, 'cycle']) : sel ? journeys.filter((x) => x !== j.key) : [...journeys, j.key]); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.4, borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.surface : 'transparent' }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? t.colors.primary : t.colors.surfaceAlt }}>
                  <Icon name={j.icon} color={sel ? t.colors.primaryText : t.colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{j.label}</Text>
                  <Text variant="small" muted>{j.hint}</Text>
                </View>
                {sel && <Icon name="check-circle" color={t.colors.primary} />}
              </Tappable>
              {isCycle && sel ? (
                <View testID="onb-objective" style={{ gap: 4, paddingLeft: spacing.md }}>
                  <Text variant="small" weight="bold">{tr('pj.objective.title')}</Text>
                  <Row wrap>
                    {(['cycle', 'avoid', 'ttc'] as const).map((o) => (
                      <Chip key={o} label={tr(`pj.choice.${o}`)} selected={journeys.includes(o)} onPress={() => setJourneys([...journeys.filter((x) => !BODY.includes(x)), o])} />
                    ))}
                  </Row>
                </View>
              ) : null}
              </View>
            );
          })}
          <Text weight="bold" style={{ marginTop: spacing.sm }}>{tr('onb.interests.title')}</Text>
          <Row wrap>
            {INTERESTS.map((it) => {
              const on = interests.includes(it.key);
              return (
                <Chip key={it.key} icon={it.icon} label={interestLabel(it.key)} accessibilityLabel={`${interestLabel(it.key)}. ${interestHint(it.key)}`} selected={on} onPress={() => { haptic('selection'); setInterests(on ? interests.filter((x) => x !== it.key) : [...interests, it.key]); }} />
              );
            })}
          </Row>
        </View>
      )}

      {step === 'pregnancy' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">{tr('onb.pregnancy.title')}</Text>
          <Text muted>{tr('onb.pregnancy.body')}</Text>
          <PregnancyForm value={pregnancy} onChange={setPregnancy} errors={pErrors} />
        </View>
      )}

      {step === 'children' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">{tr('onb.children.title', { count: children.length })}</Text>
          <Text muted>{tr('onb.children.body')}</Text>
          {children.map((c, i) => (
            <Card key={i}>
              <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text weight="bold">{tr('onb.children.item', { n: i + 1 })}</Text>
                {children.length > 1 && (
                  <Chip label={tr('onb.children.remove')} icon="x" onPress={() => { setChildren(children.filter((_, j) => j !== i)); setCErrors(cErrors.filter((_, j) => j !== i)); }} />
                )}
              </Row>
              <ChildForm value={c} onChange={(v) => setChildren(children.map((x, j) => (j === i ? v : x)))} errors={cErrors[i] ?? {}} />
            </Card>
          ))}
          <Button label={tr('onb.children.add')} variant="secondary" icon="plus" onPress={() => { setChildren([...children, emptyChild()]); setCErrors([...cErrors, {}]); }} />
        </View>
      )}

      {step === 'reminders' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">{tr('onb.reminders.title')}</Text>
          <Text muted>{tr('onb.reminders.body')}</Text>
          {!reminderSuggestions(journeys).length ? <Text variant="small" muted>{tr('onb.reminders.none')}</Text> : null}
          <Row wrap>
            {reminderSuggestions(journeys).map((r) => (
              <Chip key={r.key} label={r.label} selected={reminders.includes(r.key)} onPress={() => setReminders(reminders.includes(r.key) ? reminders.filter((x) => x !== r.key) : [...reminders, r.key])} />
            ))}
          </Row>
          <Banner tone="info">{tr('onb.reminders.where')}</Banner>
        </View>
      )}

      {step === 'consents' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">{tr('onb.consents.title')}</Text>
          {needSignupConsents ? (
            <Card>
              <CheckRow label={tr('auth.signUp.adultA11y')} checked={adult} onChange={setAdult}><Text variant="small">{tr('auth.signUp.adult')} *</Text></CheckRow>
              <CheckRow label={tr('auth.signUp.termsA11y')} checked={terms} onChange={setTerms}>
                <Text variant="small">{tr('auth.signUp.terms')} *</Text>
              </CheckRow>
              <Row wrap style={{ paddingLeft: 34 }}>
                <LegalLink doc="terms">{tr('auth.signUp.readTerms')}</LegalLink>
                <LegalLink doc="privacy">{tr('auth.signUp.readPrivacy')}</LegalLink>
              </Row>
            </Card>
          ) : null}
          <Text muted>{tr('onb.consents.private')}</Text>
          {(CONSENT_ROWS).map(([k, msg, required]) => [k, tr(`onb.consent.${msg}` as const), tr(`onb.consent.${msg}.desc` as const), required] as const).map(([k, title, desc, required]) => (
            <Card key={k}>
              <Row>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="bold">{title}{required ? ' *' : ''}</Text>
                  <Text variant="small" muted>{desc}</Text>
                </View>
                <Toggle label={title} value={consents[k]} onChange={(v) => setConsents({ ...consents, [k]: v })} />
              </Row>
            </Card>
          ))}
          <Text variant="caption" muted>{tr('onb.consents.footnote')}</Text>
        </View>
      )}
      </StepSwap>
    </Screen>
  );
}
