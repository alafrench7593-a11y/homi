/**
 * « Mes réponses » (20/11/2026) — depuis « Modifier mon parcours » : chaque réponse du parcours d'accueil se modifie
 * ici (profil, quotidien, alimentation, priorités), avec les mêmes listes que l'onboarding. À l'enregistrement,
 * `profiles.onboarding_answers` (version 3) est mis à jour et les outils proposés sur l'accueil sont RECALCULÉS.
 * Enfants et grossesse se gèrent dans leurs propres écrans (rien n'est créé ni supprimé ici). Jamais besoin de refaire
 * l'onboarding.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/States';
import { FeedingStep, HouseholdChoiceStep, PrioritiesStep, ProfileStep } from '@/features/onboarding/JourneySteps';
import { useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { emptyJourneyAnswers, journeyAnswersPayload, readJourneyAnswers, type JourneyAnswers } from '@/lib/personalization';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function JourneyAnswersScreen() {
  const profile = useProfile().data;
  return (
    <Screen back title={tr('o3.edit.title')} subtitle={tr('o3.edit.sub')}>
      {/* le formulaire part des réponses enregistrées : monté une fois le profil chargé */}
      {profile ? <AnswersForm profile={profile} /> : <Skeleton kind="detail" />}
    </Screen>
  );
}

type Profile = NonNullable<ReturnType<typeof useProfile>['data']>;

function AnswersForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const toast = useToast();
  const [a, setA] = useState<JourneyAnswers>(() => readJourneyAnswers(profile.onboarding_answers) ?? emptyJourneyAnswers());
  const [name, setName] = useState(profile.display_name ?? '');

  async function save() {
    // les autres champs enregistrés (recommandations d'origine, ancienne situation) sont conservés
    const prev = (profile.onboarding_answers ?? {}) as Record<string, unknown>;
    await update.mutateAsync({ onboarding_answers: { ...prev, ...journeyAnswersPayload(a) }, onboarding_version: 3, display_name: name.trim() || profile.display_name || null } as never);
    toast(tr('o3.edit.saved'));
    router.back();
  }

  return (
      <View style={{ gap: spacing.xl }} testID="journey-answers">
        <ProfileStep value={a.profile} name={name} onName={setName} onChange={(profile) => setA((x) => ({ ...x, profile }))} />
        <HouseholdChoiceStep value={a.household} invite={a.invite} onChange={(household) => setA((x) => ({ ...x, household }))} onInvite={(invite) => setA((x) => ({ ...x, invite }))} />
        <FeedingStep value={a.feeding} onChange={(feeding) => setA((x) => ({ ...x, feeding }))} />
        <PrioritiesStep value={a.priorities} onChange={(priorities) => setA((x) => ({ ...x, priorities }))} />
        {a.invite ? <Button label={tr('o3.edit.invite')} icon="user-plus" variant="secondary" full onPress={() => router.push('/settings/family' as never)} testID="journey-answers-invite" /> : null}
        <Button label={tr('o3.edit.save')} icon="check" full loading={update.isPending} onPress={() => void save()} testID="journey-answers-save" />
      </View>
  );
}
