/**
 * Page d'abonnement : formule « HOMI Famille » et explication des crédits HOMI IA (26/11/2026).
 *  - Famille : niveau supérieur du groupe d'abonnements « HOMI Premium » (homi_family_monthly) ; prix de la boutique ;
 *    le même Premium pour tous les adultes (owner / coparent) du foyer de la personne abonnée (_premium_of) et un solde
 *    de crédits mensuel commun (credit_accounts.household_id). Depuis Premium : montée immédiate, prix au prorata
 *    (règle de la boutique) ; renouvellement automatique écrit à côté du bouton.
 *  - Crédits : volumes lus dans la configuration du serveur ; règles en clair ; aucune promesse tant que l'IA est
 *    éteinte (mention « pas encore ouverte »).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Banner, Button, Card, Icon, Loading, Text, type IconName } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';
import { aiAssistantOnline } from '@/config/features';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCreditConfig } from '@/lib/data/hooks-credits';
import { DEFAULT_GRANTS } from '@/lib/credits/model';
import { getPurchaseMode, loadFamilyPlans, purchasesSdk } from '@/lib/purchaseMode';
import { PurchaseError } from '@/lib/premium/purchaseErrors';
import { errorFeedback, outcomeFeedback } from '@/features/premium/paywallModel';
import { motionHaptic } from '@/motion';

export function useFamilyPlans() {
  const mode = getPurchaseMode();
  return useQuery({ queryKey: ['plans', 'family', mode, localeTag()], queryFn: loadFamilyPlans, staleTime: 600_000, retry: false, enabled: mode !== 'unavailable' });
}

function Line({ icon, text }: { icon: IconName; text: string }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }} accessible accessibilityLabel={text}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={15} color={th.colors.primary} /></View>
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

/**
 * Carte Famille. `current` : la personne a un abonnement Famille personnel ; `premiumProductId` : elle a un Premium
 * personnel (le bouton devient « Passer à Famille », sans second abonnement).
 */
export function FamilyOffer({ current, premiumProductId }: { current: boolean; premiumProductId: string | null }) {
  const plans = useFamilyPlans();
  const config = useCreditConfig();
  const toast = useToast();
  const inv = useInvalidate();
  const [busy, setBusy] = useState(false);
  const plan = plans.data?.[0];
  const grant = config.data?.grants.family ?? DEFAULT_GRANTS.family;
  const mode = getPurchaseMode();

  async function buy() {
    if (!plan || busy) return;
    setBusy(true);
    try {
      const out = await purchasesSdk().purchase(plan, { currentProductId: premiumProductId });
      inv('subscriptions', 'access', 'plans', 'credits');
      if (out === 'confirmed') { motionHaptic('success'); toast(tr('fam.thanks'), 'success'); } else toast(outcomeFeedback(out).text, 'info');
    } catch (e) {
      if (e instanceof PurchaseError) toast(errorFeedback(e.kind).text, e.kind === 'unknown' ? 'error' : 'info');
      else toast(friendlyError(e, tr('pay2.err.unknown')), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tone="lavender" testID="family-offer">
      <View style={{ gap: spacing.sm }}>
        <Text weight="bold" accessibilityRole="header">{tr('fam.title')}</Text>
        <Line icon="users" text={tr('fam.body', { count: grant })} />
        <Line icon="clipboard" text={tr('fam.nanny')} />
        {current ? <Text weight="bold" testID="family-current">{tr('fam.current')}</Text>
          : mode === 'unavailable' ? null
          : plans.isLoading ? <Loading />
          : !plan ? <Text variant="small" muted testID="family-unavailable">{tr('fam.unavailable')}</Text>
          : (
            <>
              <Text variant="title" testID="family-price">{tr('fam.price', { price: plan.price })}</Text>
              <Button label={premiumProductId ? tr('fam.upgrade', { price: plan.price }) : tr('fam.cta', { price: plan.price })} icon="users"
                loading={busy} disabled={busy} onPress={() => void buy()} testID="family-buy" full />
              <Text variant="caption" muted testID="family-renewal">{tr('fam.renewal')}</Text>
              {premiumProductId ? <Text variant="caption" muted>{tr('fam.upgradeNote')}</Text> : null}
              {plan.demo ? <Text variant="caption" muted>{tr('u1.sub.demoBody')}</Text> : null}
            </>
          )}
      </View>
    </Card>
  );
}

/** Crédits HOMI IA : ce que chaque formule inclut et les règles, sans promesse tant que l'IA n'est pas ouverte. */
export function CreditsInfoCard({ signedIn = true }: { signedIn?: boolean }) {
  const config = useCreditConfig();
  const g = config.data?.grants ?? DEFAULT_GRANTS;
  return (
    <Card testID="credits-info">
      <View style={{ gap: spacing.xs }}>
        <Text weight="bold" accessibilityRole="header">{tr('cr.sub.title')}</Text>
        <Line icon="zap" text={tr('cr.sub.premium', { count: g.premium })} />
        <Line icon="users" text={tr('cr.sub.family', { count: g.family })} />
        <Text variant="small" muted>{tr('cr.sub.rules')}</Text>
        {!aiAssistantOnline() ? <Banner tone="info">{tr('cr.rules.soon')}</Banner> : null}
        {signedIn ? <Button label={tr('cr.sub.link')} icon="credit-card" variant="secondary" onPress={() => router.push('/settings/credits')} testID="credits-link" full /> : null}
      </View>
    </Card>
  );
}
