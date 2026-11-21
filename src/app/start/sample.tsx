/**
 * Famille d'exemple (/start/sample) — l'ancienne destination de « Découvrir sans compte » (décision de la
 * propriétaire, 04/12/2026) : ce bouton de /welcome mène désormais au parcours /start (démo avant tout compte) ; la
 * famille d'exemple reste accessible par un lien secondaire du résultat de la démo, et par cette adresse (scripts e2e).
 * Même démonstration qu'avant (données fictives sur l'appareil, achats simulés et signalés) ; rien d'autre ne change.
 * Un compte réel connecté n'est jamais basculé en démonstration : retour à l'accueil.
 */
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';

export default function StartSample() {
  const th = useTheme();
  const { session, ready } = useAuth();
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (session && !isDemo) { router.replace('/(tabs)'); return; }
    void startDemoWithoutAccount().then(() => router.replace('/(tabs)'), () => router.replace('/welcome'));
  }, [ready, session]);
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center' }} testID="fw-sample-loading">
      <Loading label={tr('fw.sample')} />
    </View>
  );
}
