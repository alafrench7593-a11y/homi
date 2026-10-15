/** Méthodes de contraception : fiches neutres et factuelles. Le choix se fait avec un professionnel. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Text } from '@/components/ui';
import { CONTRACEPTION_FOOTER, CONTRACEPTION_INTRO, CONTRACEPTION_METHODS } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function MethodsScreen() {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Screen back title="Les méthodes de contraception" subtitle="Des repères pour en parler avec un professionnel.">
      <Banner tone="info">{CONTRACEPTION_INTRO}</Banner>
      {CONTRACEPTION_METHODS.map((m) => {
        const expanded = open === m.kind;
        return (
          <Card key={m.kind}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${m.title}. ${expanded ? 'Masquer' : 'Afficher'} le détail`} onPress={() => setOpen(expanded ? null : m.kind)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold">{m.title}</Text>
                <Text variant="small">{m.summary}</Text>
                <Text variant="small" muted>{m.typicalUse}</Text>
              </View>
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={t.colors.textMuted} />
            </Pressable>
            {expanded ? (
              <View style={{ gap: 6, marginTop: spacing.sm }}>
                <Text variant="small"><Text variant="small" weight="bold">Comment ça marche : </Text>{m.howItWorks}</Text>
                {m.goodToKnow.map((g) => <Text key={g} variant="small">{`• ${g}`}</Text>)}
              </View>
            ) : null}
          </Card>
        );
      })}
      <Text variant="small" muted>{CONTRACEPTION_FOOTER}</Text>
      <Banner tone="warning" title="Le suivi du cycle n’est pas une contraception">Les estimations de cette application ne permettent pas d’éviter une grossesse. Pour choisir une méthode, parlez-en à un médecin, une sage-femme, un pharmacien ou un centre de santé sexuelle.</Banner>
      <Button label="Préparer mes questions" icon="help-circle" onPress={() => router.push('/contraception/consultation' as never)} />
    </Screen>
  );
}
