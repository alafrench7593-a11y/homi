/** Méthodes de contraception : fiches neutres et factuelles. Le choix se fait avec un professionnel. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Text } from '@/components/ui';
import { CONTRACEPTION_FOOTER, CONTRACEPTION_INTRO, CONTRACEPTION_METHODS } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';

export default function MethodsScreen() {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Screen back title={tr('u7.contra.methods.title')} subtitle={tr('u7.contra.methods.subtitle')}>
      <Banner tone="info">{CONTRACEPTION_INTRO}</Banner>
      {CONTRACEPTION_METHODS.map((m) => {
        const expanded = open === m.kind;
        return (
          <Card key={m.kind}>
            <Tappable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={tr(expanded ? 'u7.contra.methods.hide' : 'u7.contra.methods.show', { title: m.title })} onPress={() => setOpen(expanded ? null : m.kind)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold">{m.title}</Text>
                <Text variant="small">{m.summary}</Text>
                <Text variant="small" muted>{m.typicalUse}</Text>
              </View>
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={t.colors.textMuted} />
            </Tappable>
            {expanded ? (
              <View style={{ gap: 6, marginTop: spacing.sm }}>
                <Text variant="small"><Text variant="small" weight="bold">{tr('u7.contra.methods.how')}</Text>{m.howItWorks}</Text>
                {m.goodToKnow.map((g) => <Text key={g} variant="small">{`• ${g}`}</Text>)}
              </View>
            ) : null}
          </Card>
        );
      })}
      <Text variant="small" muted>{CONTRACEPTION_FOOTER}</Text>
      <Banner tone="warning" title={tr('u7.contra.methods.warnTitle')}>{tr('u7.contra.methods.warnBody')}</Banner>
      <Button label={tr('u7.contra.methods.prepare')} icon="help-circle" onPress={() => router.push('/contraception/consultation' as never)} />
    </Screen>
  );
}
