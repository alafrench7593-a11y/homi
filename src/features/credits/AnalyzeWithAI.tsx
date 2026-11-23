/**
 * Bouton générique « Analyser avec HOMI Aura — X crédits », prêt à poser sur un outil (il n'est posé sur AUCUN écran
 * d'outil pour l'instant : voir docs/CREDITS_IA.md § Où poser le bouton).
 *
 *  - le coût vient de la configuration du serveur (credit_settings) et est affiché AVANT tout consentement ;
 *  - confirmation explicite (coût, solde restant après l'analyse, données envoyées pour cette analyse seulement) ;
 *  - état de chargement, erreur (« aucun crédit n'a été utilisé ») avec « Réessayer » ;
 *  - solde insuffisant (vérifié avant, et refus `insufficient_credits` du serveur) → feuille d'achat de packs ;
 *  - IA éteinte (interrupteur de l'application ou du serveur) : texte discret, l'outil reste entièrement utilisable ;
 *  - sans abonnement : renvoi vers Premium (aucun crédit sans abonnement).
 * `run` appelle la fonction serveur de l'outil, qui RÉSERVE puis DÉBITE (ou restitue) côté serveur avec la clé
 * d'idempotence `requestId` : un double appui ne débite jamais deux fois.
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { confirm } from '@/components/Overlays';
import { Banner, Button, Text } from '@/components/ui';
import { formatNumber, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { aiAssistantOnline } from '@/config/features';
import { uuid } from '@/lib/uuid';
import { useCreditConfig, useCreditStatus, useRefreshCredits } from '@/lib/data/hooks-credits';
import { canAfford, costOf, isAiOff, isInsufficientCredits, totalRemaining, type CreditAction } from '@/lib/credits/model';
import { OutOfCreditsSheet } from './OutOfCreditsSheet';

export interface AnalyzeWithAIProps<T> {
  /** Action facturée (clé `cost.<action>` de credit_settings). */
  action: CreditAction;
  /** Appel serveur de l'analyse ; reçoit la clé d'idempotence à transmettre (`request_id`). */
  run: (o: { requestId: string }) => Promise<T>;
  onResult?: (result: T) => void;
  /** Démonstration (écran « Mes crédits ») : action simulée sans IA, même si l'IA n'est pas encore ouverte. */
  demo?: boolean;
  testID?: string;
}

export function AnalyzeWithAI<T>({ action, run, onResult, demo = false, testID = 'analyze-ai' }: AnalyzeWithAIProps<T>) {
  const config = useCreditConfig();
  const status = useCreditStatus();
  const refresh = useRefreshCredits();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState(false);
  const pending = useRef<string | null>(null);
  const cost = costOf(action, config.data);
  const aiOpen = demo || (aiAssistantOnline() && config.data?.ai_enabled !== false);

  if (!aiOpen) {
    // L'outil fonctionne normalement : seule l'analyse IA est indisponible
    return <Text variant="caption" muted testID={`${testID}-off`}>{aiAssistantOnline() ? tr('cr.ai.off') : tr('cr.ai.soon')}</Text>;
  }
  const s = status.data;
  if (s && !s.subscribed) {
    return <Button label={tr('cr.ai.premium')} icon="star" variant="secondary" onPress={() => router.push('/settings/subscription')} testID={`${testID}-premium`} full />;
  }

  async function start() {
    if (busy) return;
    setFailed(false);
    if (s && !canAfford(s, cost)) { setSheet(true); return; }
    const ok = await confirm(
      tr('cr.ai.confirmTitle'),
      tr('cr.ai.confirmBody', { count: cost, after: formatNumber(Math.max(0, totalRemaining(s) - cost)) }),
      tr('cr.ai.confirm', { count: cost }),
      false,
    );
    if (!ok) return;
    // Même clé si la personne relance après une coupure réseau : jamais deux débits pour la même demande
    pending.current ??= uuid();
    setBusy(true);
    try {
      const out = await run({ requestId: pending.current });
      pending.current = null;
      onResult?.(out);
    } catch (e) {
      if (isInsufficientCredits(e)) { pending.current = null; setSheet(true); }
      else if (isAiOff(e)) { pending.current = null; setFailed(true); }
      else setFailed(true);
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <Button
        label={busy ? tr('cr.ai.loading') : tr('cr.ai.cta', { count: cost })}
        icon="zap"
        variant="secondary"
        loading={busy}
        disabled={busy || status.isLoading}
        onPress={() => void start()}
        testID={`${testID}-button`}
        full
      />
      {failed ? (
        <Banner tone="warning" action={<Button label={tr('cr.ai.retry')} size="sm" variant="ghost" onPress={() => void start()} testID={`${testID}-retry`} />}>
          {tr('cr.ai.error')}
        </Banner>
      ) : null}
      <OutOfCreditsSheet visible={sheet} onClose={() => setSheet(false)} cost={cost} />
    </View>
  );
}
