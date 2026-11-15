/**
 * Temps 6 bis — Accords (inchangés sur le fond) : données de santé obligatoires, le reste facultatif ; comptes Apple /
 * Google : majorité et CGU demandées ici. Liste dense sur surface MATE (lisible sur toutes les palettes).
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Row, Text, Toggle, haptic } from '@/components/ui';
import { MattePanel } from '@/features/entry/EntryKit';
import { CheckRow, LegalLink } from '@/features/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import type { ConsentPurpose } from '@/lib/types';
import { StepTitle } from './kit';

/** Accords proposés à l'inscription : clé enregistrée, clé de texte, obligatoire. */
export const CONSENT_ROWS: [ConsentPurpose, 'healthData' | 'aiAssistant' | 'documentReading' | 'crashReports' | 'analytics', boolean][] = [
  ['health_data', 'healthData', true], ['ai_assistant', 'aiAssistant', false], ['document_reading', 'documentReading', false],
  ['crash_reports', 'crashReports', false], ['analytics', 'analytics', false],
];

export function ConsentsStep({ consents, onConsents, needSignup, adult, terms, onAdult, onTerms }: {
  consents: Record<ConsentPurpose, boolean>; onConsents: (c: Record<ConsentPurpose, boolean>) => void;
  needSignup: boolean; adult: boolean; terms: boolean; onAdult: (v: boolean) => void; onTerms: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('onb.consents.title')} lead={tr('onb.consents.private')} />
      {needSignup ? (
        <MattePanel>
          <CheckRow label={tr('auth.signUp.adultA11y')} checked={adult} onChange={onAdult}><Text variant="small">{tr('auth.signUp.adult')} *</Text></CheckRow>
          <CheckRow label={tr('auth.signUp.termsA11y')} checked={terms} onChange={onTerms}><Text variant="small">{tr('auth.signUp.terms')} *</Text></CheckRow>
          <Row wrap style={{ paddingLeft: 34 }}>
            <LegalLink doc="terms">{tr('auth.signUp.readTerms')}</LegalLink>
            <LegalLink doc="privacy">{tr('auth.signUp.readPrivacy')}</LegalLink>
          </Row>
        </MattePanel>
      ) : null}
      <MattePanel style={{ gap: 0, paddingVertical: spacing.xs }} testID="onb-consents">
        {CONSENT_ROWS.map(([k, msg, required], i) => {
          const title = tr(`onb.consent.${msg}` as const);
          const desc = tr(`onb.consent.${msg}.desc` as const);
          // Toute la ligne est l'interrupteur (cible ≥ 48 px) ; l'interrupteur dessiné n'est qu'un témoin
          return (
            <Pressable key={k} testID={`onb-consent-${k}`} accessibilityRole="switch" accessibilityState={{ checked: consents[k] }} aria-checked={consents[k]}
              accessibilityLabel={`${title}${required ? ' *' : ''}. ${desc}`}
              onPress={() => { haptic('selection'); onConsents({ ...consents, [k]: !consents[k] }); }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: t.material.lines.separator, opacity: pressed ? 0.85 : 1 })}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold">{title}{required ? ' *' : ''}</Text>
                <Text variant="small" muted>{desc}</Text>
              </View>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
                <Toggle label={title} value={consents[k]} onChange={() => undefined} />
              </View>
            </Pressable>
          );
        })}
      </MattePanel>
      <Text variant="caption" muted>{tr('onb.consents.footnote')}</Text>
    </View>
  );
}
