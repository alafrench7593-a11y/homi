/**
 * Trouver un professionnel de santé — module remplaçable (src/lib/advice/professionals.ts).
 * Aucune donnée du suivi n'est transmise au site ouvert. Aucune intégration n'est simulée :
 *  - Doctolib : pas d'API publique pour une application grand public, et ses conditions d'utilisation (avril 2026) exigent
 *    une autorisation écrite préalable pour créer un lien vers la plateforme → aucun lien tant que cette autorisation n'existe pas ;
 *  - France : Annuaire santé de l'Assurance Maladie, centres de santé sexuelle (QuestionSexualité), pharmacien ;
 *  - Royaume-Uni : recherche de services du NHS ; ailleurs : orientation générale.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { providersFor } from '@/lib/advice/professionals';
import { useRegion } from '@/features/cycle/AdviceCard';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function ProfessionalScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const region = useRegion();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [why, setWhy] = useState(false);
  const list = providersFor(region, reason ?? null);
  const open = (url: string) => Linking.openURL(url).catch(() => toast(tr('pro.openError'), 'error'));

  return (
    <Screen back title={tr('pro.title')} subtitle={tr('pro.subtitle')}>
      <Rise>
        <Glass>
          <Ink variant="heading">{tr('pro.cardTitle')}</Ink>
          <Ink>{tr('pro.cardBody')}</Ink>
          {list[0]?.url ? <Button label={tr('pro.search')} icon="search" onPress={() => open(list[0].url!)} full /> : null}
          <Button label={tr('pro.why')} variant="ghost" onPress={() => setWhy((v) => !v)} full />
          {why ? <Rise><Ink variant="small">{tr('pro.whyBody')}</Ink></Rise> : null}
        </Glass>
      </Rise>
      {list.map((p, i) => (
        <Rise key={p.id} delay={60 + i * 50}>
          <Glass onPress={p.url ? () => open(p.url!) : undefined} accessibilityLabel={tr(p.label as TKey)} accessibilityHint={p.url ? tr('pro.private') : undefined}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <CycleIcon name={p.icon} color={c.mauve} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="bold">{tr(p.label as TKey)}</Ink>
                <Ink variant="small" soft>{tr(p.hint as TKey)}</Ink>
              </View>
              {p.url ? <CycleIcon name="export" size={18} color={c.inkSoft} /> : null}
            </View>
          </Glass>
        </Rise>
      ))}
      <Ink variant="caption" soft>{tr('pro.booking')}</Ink>
      <Ink variant="caption" soft>{tr('pro.private')}</Ink>
    </Screen>
  );
}
