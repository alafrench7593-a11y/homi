/** Changer de parcours ou en ajouter un : l'accueil, les outils, les articles et les rappels s'adaptent. */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, haptic, Icon, Text } from '@/components/ui';
import { useActivePregnancy, useChildren, useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { JOURNEY_OPTIONS } from '@/lib/domain/journeys';
import type { Journey } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function Journeys() {
  const t = useTheme();
  const toast = useToast();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const [sel, setSel] = useState<Journey[]>([]);
  useEffect(() => {
    if (profile) setSel(profile.journeys.map((j) => (j === 'child' ? 'newborn' : j)));
  }, [profile]);

  const toggle = (j: Journey) => setSel((s) => (s.includes(j) ? s.filter((x) => x !== j) : [...s, j]));
  const save = async () => {
    if (!sel.length) { toast('Choisissez au moins un parcours.', 'info'); return; }
    await update.mutateAsync({ journeys: sel });
    toast('Parcours mis à jour.', 'success');
    if (sel.includes('pregnant') && !pregnancy) router.replace('/profiles/new?kind=pregnancy');
    else if ((sel.includes('newborn') || sel.includes('family')) && !(children?.length)) router.replace('/profiles/new?kind=child');
    else router.back();
  };

  return (
    <Screen back title="Mes parcours" subtitle="Vous pouvez en choisir plusieurs, par exemple « Je suis maman » et « J’essaie d’avoir un enfant ».">
      <View style={{ gap: spacing.xs }} accessibilityRole="list">
        {JOURNEY_OPTIONS.map((o) => {
          const on = sel.includes(o.key);
          return (
            <Pressable
              key={o.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${o.label}. ${o.hint}`}
              onPress={() => { haptic('selection'); toggle(o.key); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? t.colors.accentSoft : t.colors.surface }}
            >
              <Icon name={o.icon} color={on ? t.colors.primary : t.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{o.label}</Text>
                <Text variant="small" muted>{o.hint}</Text>
              </View>
              <Icon name={on ? 'check-circle' : 'circle'} color={on ? t.colors.primary : t.colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
      {sel.includes('avoid') && sel.includes('ttc') && <Banner tone="info">Vous avez choisi « éviter une grossesse » et « avoir un enfant » : l’accueil affichera le projet bébé, et vous retrouverez la contraception dans vos outils.</Banner>}
      <Button label="Enregistrer" onPress={save} loading={update.isPending} full />
    </Screen>
  );
}
