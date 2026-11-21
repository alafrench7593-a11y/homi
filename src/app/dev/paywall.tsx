/**
 * Prévisualisation des trois maquettes du paywall « première réussite » (QA visuelle, captures Playwright) :
 * /dev/paywall?direction=A|B|C&trial=1|0&need=feed_sleep&variant=need|generic&catalog=ready|loading|offline&phase=idle|cancelled…
 * &reminder=0 : frise sans l'étape « rappel » (rendu web réel). Par défaut la maquette montre l'iPhone (rappel possible).
 * A et B forment la paire du test « héros » du skill Paywall Designer (résultat contre frise) ; C est l'ancienne direction.
 * Vrai composant (`PaywallView`), grille de DÉMONSTRATION signalée, résultat de démo d'exemple ; aucun achat possible.
 * Accessible comme /dev/glass : mode développeur ou démonstration ; ailleurs, retour à l'accueil.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { isDemo } from '@/lib/backend';
import { useDeveloperMode } from '@/lib/devMode';
import { demoFamilyPlans, demoPlans } from '@/lib/premium/plans';
import { PaywallView, DIRECTIONS, type Direction } from '@/features/firstWin/PaywallView';
import { isNeed, DEMO_OF, type DemoResult, type TitleVariant } from '@/features/firstWin/model';
import { defaultOfferKey, offerCards, type CatalogState, type PurchasePhase } from '@/features/firstWin/offer';
import { localeTag } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const CATALOG: CatalogState[] = ['loading', 'offline', 'unavailable', 'error', 'empty', 'ready'];
const PHASES: PurchasePhase[] = ['idle', 'buying', 'cancelled', 'deferred', 'pending', 'failed', 'confirmed', 'restoring', 'restored', 'restore_none', 'restore_failed'];

export default function PaywallPreview() {
  const q = useLocalSearchParams<{ direction?: string; trial?: string; need?: string; variant?: string; catalog?: string; phase?: string; plan?: string; reminder?: string }>();
  const dev = useDeveloperMode();
  const th = useTheme();
  const direction: Direction = DIRECTIONS.find((d) => d === q.direction) ?? 'B';
  const trial = q.trial !== '0';
  const need = isNeed(q.need) ? q.need : 'feed_sleep';
  const variant: TitleVariant = q.variant === 'generic' ? 'generic' : 'need';
  const catalog: CatalogState = CATALOG.find((c) => c === q.catalog) ?? 'ready';
  const phase: PurchasePhase = PHASES.find((p) => p === q.phase) ?? 'idle';
  // Date fixe : captures reproductibles (frise et conditions)
  const now = useMemo(() => new Date('2026-12-03T10:30:00'), []);
  const cards = useMemo(() => {
    const prem = demoPlans(localeTag()).map((p) => (trial ? p : { ...p, trialDays: 0 }));
    return offerCards(prem, demoFamilyPlans(localeTag()), localeTag());
  }, [trial]);
  const [selected, setSelected] = useState<string | null>(() => defaultOfferKey(cards, q.plan ?? null));
  const result: DemoResult = { kind: DEMO_OF[need], itemKey: need === 'prepare_birth' ? 'maternity_bag:6' : need === 'mornings' ? 'tshirt-crew' : need === 'relay' ? 'mission' : 'nap', at: '2026-12-03T10:24:00' };
  // La démonstration reprend après le chargement de la page : court délai avant de rediriger (comme /dev/icons)
  const [grace, setGrace] = useState(true);
  useEffect(() => { const id = setTimeout(() => setGrace(false), 800); return () => clearTimeout(id); }, []);
  if (!dev && !isDemo) return grace ? <View style={{ flex: 1, backgroundColor: th.colors.background }} /> : <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background }}>
      <PaywallView direction={direction} variant={variant} need={need} result={result} cards={cards} selectedKey={selected} onSelect={setSelected}
        catalog={catalog} phase={phase} aiOnline={false} now={now} reminder={q.reminder !== '0'} needsAccount
        onBuy={() => undefined} onRetry={() => undefined} onRestore={() => undefined} onClose={() => router.back()} onLegal={(doc) => router.push(`/legal/${doc}`)} />
    </View>
  );
}
