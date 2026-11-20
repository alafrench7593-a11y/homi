/**
 * « Mes réponses » (20/11/2026) — depuis « Modifier mon parcours » : chaque réponse du parcours d'accueil se modifie
 * ici (profil, quotidien, alimentation, priorités), avec les mêmes listes que l'onboarding. À l'enregistrement,
 * `profiles.onboarding_answers` (version 3) est mis à jour et les outils proposés sur l'accueil sont RECALCULÉS.
 * Enfants et grossesse se gèrent dans leurs propres écrans (rien n'est créé ni supprimé ici). Jamais besoin de refaire
 * l'onboarding.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Button } from '@/components/ui';
import { FeedingStep, HouseholdChoiceStep, PrioritiesStep, ProfileStep } from '@/features/onboarding/JourneySteps';
import { useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { emptyJourneyAnswers, journeyAnswersPayload, readJourneyAnswers, type JourneyAnswers } from '@/lib/personalization';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function JourneyAnswers() {
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const toast = useToast();
  const [a, setA] = useState<JourneyAnswers>(emptyJourneyAnswers);
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || !profile) return;
    setA(readJourneyAnswers(profile.onboarding_answers) ?? emptyJourneyAnswers());
    setName(profile.display_name ?? '');
    setReady(true);
  }, [profile, ready]);

  async function save() {
    // les autres champs enregistrés (recommandations d'origine, ancienne situation) sont conservés
    const prev = (profile?.onboarding_answers ?? {}) as Record<string, unknown>;
    await update.mutateAsync({ onboarding_answers: { ...prev, ...journeyAnswersPayload(a) }, onboarding_version: 3, display_name: name.trim() || profile?.display_name || null } as never);
    toast(tr('o3.edit.saved'));
    router.back();
  }

  return (
    <Screen back title={tr('o3.edit.title')} subtitle={tr('o3.edit.sub')}>
      <View style={{ gap: spacing.xl }} testID="journey-answers">
        <ProfileStep value={a.profile} name={name} onName={setName} onChange={(profile) => setA((x) => ({ ...x, profile }))} />
        <HouseholdChoiceStep value={a.household} invite={a.invite} onChange={(household) => setA((x) => ({ ...x, household }))} onInvite={(invite) => setA((x) => ({ ...x, invite }))} />
        <FeedingStep value={a.feeding} onChange={(feeding) => setA((x) => ({ ...x, feeding }))} />
        <PrioritiesStep value={a.priorities} onChange={(priorities) => setA((x) => ({ ...x, priorities }))} />
        {a.invite ? <Button label={tr('o3.edit.invite')} icon="user-plus" variant="secondary" full onPress={() => router.push('/settings/family' as never)} testID="journey-answers-invite" /> : null}
        <Button label={tr('o3.edit.save')} icon="check" full loading={update.isPending} disabled={!ready} onPress={() => void save()} testID="journey-answers-save" />
      </View>
    </Screen>
  );
}
