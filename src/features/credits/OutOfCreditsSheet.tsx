/**
 * Feuille « Vous n'avez plus de crédits » : ouverte quand le serveur répond `insufficient_credits` (assistant,
 * « Analyser avec HOMI IA »). Affiche le solde, la date de retour des crédits mensuels, les 3 packs aux prix de la
 * boutique (achat via RevenueCat ; faux magasin en démonstration) et la restauration des achats.
 * Aucune urgence ni compte à rebours ; « Plus tard » toujours visible.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Loading, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useCreditStatus } from '@/lib/data/hooks-credits';
import { totalRemaining } from '@/lib/credits/model';
import { getPurchaseMode, purchasesSdk } from '@/lib/purchaseMode';
import { friendlyError } from '@/lib/data/hooks-settings';
import { PackList } from './CreditsParts';

export function OutOfCreditsSheet({ visible, onClose, cost }: { visible: boolean; onClose: () => void; cost?: number }) {
  const status = useCreditStatus();
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const s = status.data;
  const renewal = s?.next_renewal && s.subscribed ? formatDate(s.next_renewal, { day: 'numeric', month: 'long' }) : null;

  async function restore() {
    setRestoring(true);
    try {
      await purchasesSdk().restore();
      await status.refetch();
      toast(tr('cr.out.restoreDone'), 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={tr('cr.out.title')}>
      <View style={{ gap: spacing.md }} testID="credits-out-sheet">
        {status.isLoading || !s ? <Loading /> : (
          <>
            {cost ? <Text testID="credits-out-cost">{tr('cr.out.body', { count: cost, left: totalRemaining(s) })}</Text> : null}
            {/* Solde compact : les 3 packs restent visibles sans défiler, même en 320 × 568 */}
            <Text variant="small" weight="bold" testID="credits-out-balance">
              {tr('cr.balance.total', { count: totalRemaining(s) })}
            </Text>
            <Text variant="small" muted testID="credits-out-renewal">
              {renewal ? tr('cr.out.renewal', { count: s.monthly_allowance, date: renewal }) : tr('cr.out.noRenewal')}
            </Text>
            <PackList subscribed={s.subscribed} onBought={() => { void status.refetch(); onClose(); }} />
          </>
        )}
        {getPurchaseMode() !== 'unavailable' ? (
          <View style={{ gap: 4 }}>
            <Button label={tr('cr.out.restore')} icon="refresh-cw" variant="ghost" loading={restoring} onPress={() => void restore()} testID="credits-out-restore" full />
            <Text variant="caption" muted center>{tr('cr.out.restoreNote')}</Text>
          </View>
        ) : null}
        <Button label={tr('cr.out.myCredits')} variant="secondary" icon="credit-card" onPress={() => { onClose(); router.push('/settings/credits'); }} testID="credits-out-mine" full />
        <Button label={tr('cr.out.later')} variant="ghost" onPress={onClose} testID="credits-out-later" full />
      </View>
    </Sheet>
  );
}
