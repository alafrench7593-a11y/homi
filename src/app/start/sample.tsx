/**
 * Famille d'exemple (/start/sample) — l'ancienne destination de « Découvrir sans compte » (décision de la
 * propriétaire, 04/12/2026) : ce bouton de /welcome mène désormais au parcours /start (démo avant tout compte) ; la
 * famille d'exemple reste accessible par un lien secondaire du résultat de la démo, et par cette adresse (scripts e2e).
 * Même démonstration qu'avant (données fictives sur l'appareil, achats simulés et signalés) ; rien d'autre ne change.
 * Un compte réel connecté n'est jamais basculé en démonstration : retour à l'accueil.
 * Ticket 1 (visite) : réseau lent → phrase explicite au bout de 4 s ; échec du chargement → message et « Réessayer »
 * (avant : retour silencieux vers /welcome, sans explication).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Loading, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function StartSample() {
  const th = useTheme();
  const { session, ready } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState<'loading' | 'slow' | 'failed'>('loading');
  const start = useCallback(() => {
    setState('loading');
    const slow = setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), 4000);
    void startDemoWithoutAccount().then(() => setEntered(true), () => setState('failed')).finally(() => clearTimeout(slow));
  }, []);
  // Accueil ouvert quand la session de la visite est connue de l'application (jamais d'état « sans session » → /welcome)
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (entered && session) router.replace('/(tabs)'); }, [entered, session]);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (session && !isDemo) { router.replace('/(tabs)'); return; }
    start();
  }, [ready, session, start]);
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center', padding: spacing.lg, gap: spacing.md }} testID="fw-sample-loading">
      {state === 'failed' ? (
        <View style={{ gap: spacing.md, alignItems: 'center' }} testID="fw-sample-failed" accessibilityLiveRegion="polite">
          <Text center>{tr('visit.failed')}</Text>
          <Button label={tr('visit.retry')} icon="refresh-cw" onPress={start} testID="fw-sample-retry" />
          <Button label={tr('common.back')} variant="ghost" onPress={() => router.replace('/welcome')} testID="fw-sample-back" />
        </View>
      ) : (
        <>
          <Loading label={tr('fw.sample')} />
          {state === 'slow' ? <Text center muted accessibilityLiveRegion="polite" testID="fw-sample-slow">{tr('visit.slow')}</Text> : null}
        </>
      )}
    </View>
  );
}
