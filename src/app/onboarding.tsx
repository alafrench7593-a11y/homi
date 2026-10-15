/** Première ouverture : court, doux, et ne demande que l'utile. */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, haptic, Icon, type IconName, Row, Text, Toggle } from '@/components/ui';
import { FetusOrb } from '@/components/FetusOrb';
import { WeeksRing } from '@/components/DayClock';
import { useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { ensureHousehold } from '@/lib/data/hooks';
import { requestPermission } from '@/lib/notifications';
import type { ConsentPurpose, Journey } from '@/lib/types';
import { ChildForm, createChild, createPregnancy, emptyChild, emptyPregnancy, PregnancyForm, validateChild, validatePregnancy, type ChildDraft } from '@/features/profiles';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';
import { JOURNEY_OPTIONS } from '@/lib/domain/journeys';
import { BRAND } from '@/config/brand';

const JOURNEYS: { key: Journey; label: string; icon: IconName; hint: string }[] = JOURNEY_OPTIONS;

const REMINDERS = [
  { key: 'appointments', label: 'Rendez-vous et examens' },
  { key: 'checklists', label: 'Listes de préparation' },
  { key: 'bottles', label: 'Biberons ou tétées (vous choisirez la fréquence)' },
  { key: 'medication', label: 'Traitements prescrits' },
];

type Step = 'intro' | 'journeys' | 'pregnancy' | 'children' | 'reminders' | 'consents';

export default function Onboarding() {
  const t = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const userId = useUserId();
  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [pregnancy, setPregnancy] = useState(emptyPregnancy());
  const [pErrors, setPErrors] = useState<Record<string, string>>({});
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild()]);
  const [cErrors, setCErrors] = useState<Record<string, string>[]>([{}]);
  const [reminders, setReminders] = useState<string[]>(['appointments', 'checklists']);
  const [consents, setConsents] = useState<Record<ConsentPurpose, boolean>>({ terms: true, health_data: true, ai_assistant: true, document_reading: false, analytics: false, crash_reports: false, marketing: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPregnancy = journeys.includes('pregnant');
  const needsChildren = journeys.some((j) => j === 'newborn' || j === 'child' || j === 'family');
  const steps = useMemo<Step[]>(() => ['intro', 'journeys', ...(needsPregnancy ? ['pregnancy' as Step] : []), ...(needsChildren ? ['children' as Step] : []), 'reminders', 'consents'], [needsPregnancy, needsChildren]);
  const idx = steps.indexOf(step);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const prev = () => setStep(steps[Math.max(idx - 1, 0)]);

  function goNext() {
    if (step === 'journeys' && !journeys.length) return setError('Choisissez au moins une situation (vous pourrez la modifier plus tard).');
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
    if (!consents.health_data) return setError('Sans votre accord pour les données de santé, l’application ne peut pas enregistrer de suivi. Vous pourrez retirer cet accord à tout moment.');
    setSaving(true);
    setError(null);
    try {
      await backend.insert('consents', (Object.entries(consents) as [ConsentPurpose, boolean][]).map(([purpose, granted]) => ({ user_id: userId, purpose, granted })));
      const hid = await ensureHousehold(name ? `Famille de ${name}` : 'Ma famille');
      if (needsPregnancy) await createPregnancy(hid, userId, pregnancy);
      if (needsChildren) for (const c of children) if (c.first_name.trim()) await createChild(hid, c);
      await backend.update('privacy_settings', { analytics_enabled: consents.analytics, crash_reports_enabled: consents.crash_reports }, [{ col: 'user_id', op: 'eq', value: userId }]);
      await backend.update('profiles', { display_name: name.trim() || null, journeys, onboarding_completed: true }, [{ col: 'id', op: 'eq', value: userId }]);
      if (reminders.length) await requestPermission().catch(() => undefined);
      await qc.invalidateQueries();
      haptic('success');
      toast('Bienvenue ! Votre espace est prêt.');
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
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
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Étape ${idx + 1} sur ${steps.length}`}>
      {steps.map((s, i) => (
        <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= idx ? t.colors.primary : t.colors.border }} />
      ))}
    </View>
  );

  const footer = step === 'intro' ? (
    <Button label="Commencer" size="lg" full onPress={goNext} />
  ) : (
    <Row>
      <Button label="Retour" variant="secondary" onPress={prev} style={{ flex: 1 }} />
      {step === 'consents' ? (
        <Button label="C’est parti" loading={saving} onPress={finish} style={{ flex: 2 }} />
      ) : (
        <Button label="Continuer" onPress={goNext} style={{ flex: 2 }} />
      )}
    </Row>
  );

  return (
    <Screen stars={step === 'intro'} footer={footer}>
      {step !== 'intro' && progress}
      {error ? <Banner tone="warning">{error}</Banner> : null}

      {step === 'intro' && (
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
          <View style={{ width: 250, height: 250, borderRadius: 125, backgroundColor: palette.night, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <WeeksRing week={18} size={240}><FetusOrb growth={0.5} size={180} interactive={false} /></WeeksRing>
          </View>
          <Text variant="hero" center accessibilityRole="header">Bienvenue</Text>
          <Text center muted style={{ maxWidth: 340 }}>
            {BRAND.name} s’adapte à votre histoire. Quelques questions, toutes facultatives sauf l’essentiel, et votre espace est prêt.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Field label="Comment souhaitez-vous qu’on vous appelle ?" optional value={name} onChangeText={setName} maxLength={40} autoCapitalize="words" />
          </View>
          {isDemo && <Button label="Explorer avec une famille exemple" variant="ghost" icon="eye" loading={saving} onPress={loadSample} />}
        </View>
      )}

      {step === 'journeys' && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="title" accessibilityRole="header">Où en êtes-vous ?</Text>
          <Text muted>Plusieurs réponses possibles. Vous pourrez changer de parcours à tout moment.</Text>
          {JOURNEYS.map((j) => {
            const sel = journeys.includes(j.key);
            return (
              <Pressable
                key={j.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`${j.label}. ${j.hint}`}
                onPress={() => { haptic('selection'); setJourneys(sel ? journeys.filter((x) => x !== j.key) : [...journeys, j.key]); }}
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
              </Pressable>
            );
          })}
        </View>
      )}

      {step === 'pregnancy' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">Votre grossesse</Text>
          <Text muted>Ces informations servent uniquement à afficher la bonne semaine et des contenus adaptés. Elles sont modifiables et supprimables.</Text>
          <PregnancyForm value={pregnancy} onChange={setPregnancy} errors={pErrors} />
        </View>
      )}

      {step === 'children' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">{children.length > 1 ? 'Vos enfants' : 'Votre enfant'}</Text>
          <Text muted>Le prénom et la date de naissance suffisent. Tout le reste est facultatif.</Text>
          {children.map((c, i) => (
            <Card key={i}>
              <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text weight="bold">Enfant {i + 1}</Text>
                {children.length > 1 && (
                  <Chip label="Retirer" icon="x" onPress={() => { setChildren(children.filter((_, j) => j !== i)); setCErrors(cErrors.filter((_, j) => j !== i)); }} />
                )}
              </Row>
              <ChildForm value={c} onChange={(v) => setChildren(children.map((x, j) => (j === i ? v : x)))} errors={cErrors[i] ?? {}} />
            </Card>
          ))}
          <Button label="Ajouter un autre enfant" variant="secondary" icon="plus" onPress={() => { setChildren([...children, emptyChild()]); setCErrors([...cErrors, {}]); }} />
        </View>
      )}

      {step === 'reminders' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">Des rappels, si vous le souhaitez</Text>
          <Text muted>Rien n’est programmé automatiquement : vous choisissez ce qui vous aide. Le téléphone vous demandera ensuite l’autorisation d’envoyer des notifications.</Text>
          <Row wrap>
            {REMINDERS.map((r) => (
              <Chip key={r.key} label={r.label} selected={reminders.includes(r.key)} onPress={() => setReminders(reminders.includes(r.key) ? reminders.filter((x) => x !== r.key) : [...reminders, r.key])} />
            ))}
          </Row>
          <Banner tone="info">{'Vous pourrez créer, modifier, reporter ou supprimer chaque rappel dans Réglages › Rappels.'}</Banner>
        </View>
      )}

      {step === 'consents' && (
        <View style={{ gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">Vos données, vos choix</Text>
          <Text muted>Vos informations sont privées. Personne d’autre ne peut les voir, sauf les personnes que vous invitez et uniquement ce que vous partagez.</Text>
          {([
            ['health_data', 'Données de santé et de suivi', 'Nécessaire pour enregistrer grossesse, mesures, suivi du bébé. Retirable à tout moment.', true],
            ['ai_assistant', 'Assistant conversationnel', 'Vos questions sont envoyées à un service d’IA, sans nom ni document. Désactivable.', false],
            ['document_reading', 'Lecture automatique des documents', 'Propose d’extraire la date ou le nom d’un examen. Toujours « à vérifier ».', false],
            ['crash_reports', 'Rapports d’erreurs techniques', 'Aide à corriger les bugs. Jamais de donnée de santé.', false],
            ['analytics', 'Statistiques d’usage anonymes', 'Aide à améliorer l’application. Jamais de donnée de santé ni de conversation.', false],
          ] as [ConsentPurpose, string, string, boolean][]).map(([k, title, desc, required]) => (
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
          <Text variant="caption" muted>* indispensable au suivi. Vous pouvez exporter ou supprimer toutes vos données dans Réglages › Confidentialité.</Text>
        </View>
      )}
    </Screen>
  );
}
