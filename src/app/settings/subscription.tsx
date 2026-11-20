/**
 * Page d'abonnement « HOMI Premium » (URL inchangée : /settings/subscription, paramètres ?feature= et ?plan=).
 *
 * Non abonné·e, de haut en bas :
 *  1. la promesse en une phrase ;
 *  2. le comparatif en trois cartes — « Sans abonnement » (liste réelle), « HOMI Premium » (par besoin), « En famille »
 *     (le second adulte inclus sans surcoût, ce que peut faire une nounou) : src/features/premium/offerModel.ts ;
 *  3. les trois formules aux prix de la boutique, équivalent mensuel et économie CALCULÉS, formule conseillée signalée
 *     avec sa raison (PlanPicker, partagé avec l'écran Premium) ;
 *  4. l'essai, seulement si la boutique le confirme pour cette personne : durée, date exacte de fin, date et montant
 *     du premier prélèvement, comment annuler avant (TrialTimeline) ;
 *  5. le bouton d'achat avec, juste dessous et visibles en même temps que lui, ce qui est prélevé et le renouvellement
 *     automatique en clair (PurchaseCta), puis comment annuler et l'origine du prix ;
 *  6. « Restaurer mes achats », « Gérer mon abonnement » (page Abonnements de la boutique), CGU et confidentialité,
 *     et « Continuer sans m'abonner », toujours visible.
 * Abonné·e : formule en cours, prochaine échéance ou fin d'accès si résilié, origine (achat personnel ou partagé par
 * l'autre adulte du foyer), changer de formule, gérer / annuler, restaurer.
 * 26/11/2026 : formule « HOMI Famille » (niveau supérieur du même groupe, prix de la boutique, renouvellement écrit à
 * côté du bouton) et crédits HOMI Aura (ce que chaque formule inclut, règles, lien « Mes crédits ») — sans promesse tant
 * que l'IA n'est pas ouverte. Les anciennes offres (Assistant IA, outils à vie) ne sont plus affichées.
 *
 * Aucun prix en dur, aucun compte à rebours, aucune urgence, aucune case à cocher. Mêmes textes de conditions et
 * mêmes calculs que l'écran Premium (src/features/premium/paywallModel.ts). Sur le web : pas d'achat. Les droits sont
 * confirmés par le serveur (has_premium), jamais par l'application seule.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { CreditsInfoCard, FamilyOffer } from '@/features/credits/FamilyOffer';
import { CompareBlocks } from '@/features/premium/CompareBlocks';
import { PlanPicker } from '@/features/premium/PlanPicker';
import { PurchaseCta, PurchaseFinePrint } from '@/features/premium/PurchaseCta';
import { TrialTimeline } from '@/features/premium/TrialTimeline';
import { defaultPeriod, errorFeedback, outcomeFeedback, ownActive, periodOfSub, planName } from '@/features/premium/paywallModel';
import { MySubscriptionCard, PremiumActivated, usePlans, WebPurchaseNotice, webWithoutPurchase } from '@/features/subscription';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { goUp } from '@/lib/links';
import { FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { tierOfProduct, type Plan, type PlanPeriod } from '@/lib/premium/plans';
import { PurchaseError } from '@/lib/premium/purchaseErrors';
import { purchasesSdk } from '@/lib/purchaseMode';
import { Cascade, motionHaptic } from '@/motion';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const PERIODS: PlanPeriod[] = ['monthly', 'six_months', 'annual'];

export default function SubscriptionScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const pathname = usePathname() ?? '/settings/subscription';
  const params = useLocalSearchParams<{ feature?: string; plan?: string }>();
  const ent = useEntitlement();
  const premium = ent.premium;
  const sub = ent.sub;
  const plans = usePlans();
  const mode = plans.mode;
  const [busy, setBusy] = useState(false);
  const tried = params.feature && params.feature in FEATURES ? (params.feature as PremiumFeature) : null;
  const wanted = PERIODS.includes(params.plan as PlanPeriod) ? (params.plan as PlanPeriod) : null;

  // Abonnement personnel en cours : on propose un changement de formule, jamais un second abonnement
  const own = ownActive(sub, premium);
  // Formule Famille personnelle : le Premium (3 durées) n'est pas proposé (redescendre se fait dans la boutique)
  const ownFamily = own && tierOfProduct(sub?.product_id) === 'family';
  const currentPeriod = own && !ownFamily ? periodOfSub(sub) : null;
  const sharedOnly = premium && !own;
  // Un·e abonné·e n'est plus éligible à l'offre d'essai (une fois par groupe d'abonnements) : jamais affichée ici
  const list = useMemo<Plan[]>(() => (plans.data ?? []).map((p) => (own ? { ...p, trialDays: 0 } : p)), [plans.data, own]);
  const [selected, setSelected] = useState<PlanPeriod | null>(wanted);
  useEffect(() => {
    if (selected || !list.length) return;
    setSelected(currentPeriod ? list.find((p) => p.period !== currentPeriod)?.period ?? list[0].period : defaultPeriod(list));
  }, [list, selected, currentPeriod]);
  // La formule choisie vient d'être achetée (elle devient la formule actuelle) : proposer un changement, pas elle-même
  useEffect(() => {
    if (!currentPeriod) return;
    setSelected((s) => (s === currentPeriod ? list.find((p) => p.period !== currentPeriod)?.period ?? s : s));
    // seulement quand la formule actuelle change : un choix fait ensuite par la personne est respecté
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPeriod]);
  const chosen = list.find((p) => p.period === selected);

  async function buy() {
    if (!chosen || busy) return;
    setBusy(true);
    try {
      const out = await purchasesSdk().purchase(chosen, { currentProductId: own ? sub?.product_id ?? null : null });
      inv('subscriptions', 'access', 'plans');
      if (out === 'confirmed') {
        motionHaptic('success');
        toast(currentPeriod ? tr('sub2.page.changed') : outcomeFeedback(out).text, 'success');
      } else toast(outcomeFeedback(out).text, 'info');
    } catch (e) {
      if (e instanceof PurchaseError) toast(errorFeedback(e.kind).text, e.kind === 'unknown' ? 'error' : 'info');
      else toast(friendlyError(e, tr('pay2.err.unknown')), 'error');
    } finally {
      setBusy(false);
    }
  }

  const isCurrent = !!chosen && chosen.period === currentPeriod;
  const changeLabel = !chosen || !currentPeriod ? undefined : isCurrent ? tr('sub2.cta.isCurrent') : tr('sub2.cta.change', { plan: planName(chosen.period) });

  const offer = webWithoutPurchase(mode) ? <WebPurchaseNotice /> : mode === 'unavailable' ? (
    <Banner tone="info" title={tr('u1.sub.soonTitle')}>{tr('u1.sub.soonBody')}</Banner>
  ) : plans.isLoading ? <Loading label={tr('u1.sub.loadingOffers')} /> : plans.isError || !list.length ? (
    <>
      <Banner tone="warning" title={tr('u1.sub.offersDown')}>{plans.isError ? friendlyError(plans.error, tr('u1.sub.storeUnreachable')) : tr('u1.sub.storeUnreachable')}</Banner>
      <Button label={tr('u1.sub.retry')} icon="refresh-cw" variant="secondary" onPress={() => void plans.refetch()} testID="plans-retry" />
    </>
  ) : (
    <View style={{ gap: spacing.md }} testID="sub3-offer">
      <PlanPicker plans={list} selected={selected} onSelect={setSelected} currentPeriod={currentPeriod} />
      {chosen && chosen.trialDays > 0 ? (
        <Card tone="soft"><TrialTimeline plan={chosen} /></Card>
      ) : null}
      {chosen ? (
        <>
          {/* Bouton + ce qui est prélevé + renouvellement automatique : même bloc que l'écran Premium */}
          <PurchaseCta plan={chosen} label={changeLabel} chargeLine={currentPeriod ? tr('sub2.page.changeNote') : undefined}
            loading={busy} disabled={busy || isCurrent} onPress={() => void buy()} testID="plan-buy" />
          <PurchaseFinePrint plan={chosen} omitCancel={chosen.trialDays > 0} />
        </>
      ) : null}
      {mode === 'test' ? <Banner tone="demo" title={tr('u1.sub.demoTitle')}>{tr('u1.sub.demoBody')}</Banner> : null}
    </View>
  );

  return (
    <Screen back title={tr('sub2.page.screen')}>
      {!premium ? (
        <Cascade index={0}>
          <Text variant="heading" accessibilityRole="header" testID="sub3-promise">{tr('sub3.promise')}</Text>
        </Cascade>
      ) : null}

      {tried && !premium ? (
        <Card tone="gold">
          <View testID="sub-tried">
            <Row><Icon name={FEATURES[tried].icon as never} size={18} /><Text weight="bold" style={{ flex: 1 }}>{featureTitle(tried)}</Text></Row>
            <Text variant="small" style={{ marginTop: 4 }}>{FEATURES[tried].benefit}</Text>
          </View>
        </Card>
      ) : null}

      {/* Activation confirmée par le serveur pendant que la page est ouverte (achat, restauration, essai) */}
      <PremiumActivated premium={premium} />

      {/* Abonné·e : formule, échéance ou fin d'accès, origine, gestion, restauration */}
      {premium ? <View testID="sub-status"><MySubscriptionCard showDiscover={false} /></View> : null}

      {!premium ? (
        <>
          <SectionTitle title={tr('sub3.cmp.title')} />
          <CompareBlocks />
        </>
      ) : null}

      {!sharedOnly && !ownFamily ? (
        <>
          <SectionTitle title={currentPeriod ? tr('sub2.page.change') : tr('sub2.page.choose')} />
          {offer}
        </>
      ) : null}

      {/* Famille : niveau supérieur (tous les adultes du foyer, crédits en commun) ; jamais pour un accès partagé */}
      {!sharedOnly && !webWithoutPurchase(mode) ? (
        <FamilyOffer current={!!ownFamily} premiumProductId={own && !ownFamily ? sub?.product_id ?? null : null} />
      ) : null}
      <CreditsInfoCard />

      {/* Sans abonnement : état, « Gérer mon abonnement » (page de la boutique), restauration, CGU et confidentialité */}
      {!premium ? (
        <>
          <View testID="sub-status"><MySubscriptionCard showDiscover={false} /></View>
          <Button label={tr('sub3.continueFree')} variant="ghost" onPress={() => goUp(pathname)} testID="sub3-continue-free" full />
        </>
      ) : null}

      {premium ? (
        <>
          <SectionTitle title={tr('sub3.sub.included')} />
          <CompareBlocks free={false} startIndex={0} />
        </>
      ) : null}
    </Screen>
  );
}
