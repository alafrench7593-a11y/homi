/** Documents juridiques : CGU, confidentialité, mentions légales, suppression du compte, aide (5 langues). */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card, Text } from '@/components/ui';
import { ACCOUNT_DELETION, LEGAL_NOTICE, PRIVACY, SUPPORT, TERMS, type LegalDoc } from '@/content/legal';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Adresses : /legal/terms, /legal/privacy, /legal/notice, /legal/delete-account, /legal/support (inconnue → CGU). */
export function legalDoc(doc: string | undefined): LegalDoc {
  switch (doc) {
    case 'privacy': return PRIVACY;
    case 'notice': return LEGAL_NOTICE;
    case 'delete-account': return ACCOUNT_DELETION;
    case 'support': return SUPPORT;
    default: return TERMS;
  }
}

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = legalDoc(doc);
  return (
    <Screen back title={d.title} subtitle={tr('u6.legal.updated', { date: d.updated })}>
      {d.sections.map((s) => (
        <Card key={s.title}>
          <Text weight="bold" accessibilityRole="header">{s.title}</Text>
          <Text variant="small" style={{ marginTop: spacing.xs }}>{s.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
