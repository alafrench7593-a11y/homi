/**
 * /demo — démonstration publique (site web) : famille fictive, sans compte, données sur l'appareil uniquement
 * (moteur local src/lib/backend/demo.ts : aucune écriture ne part vers le serveur).
 *
 *  - `?outil=<identifiant du catalogue>` (cartes de la page publique) : l'outil s'ouvre directement, pour l'enfant
 *    d'exemple concerné (même catalogue que l'application : src/lib/domain/toolCatalog.ts) ; l'accueil reste derrière
 *    (retour navigateur).
 *  - Un VRAI compte connecté n'est jamais basculé en démonstration en silence : écran de choix (ouvrir mon espace, ou
 *    me déconnecter de ce navigateur puis voir la démo). Aucun événement de la démo n'est écrit dans un compte.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Loading, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { demoToolHref } from '@/features/launch/demoTool';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function DemoEntry() {
  const th = useTheme();
  const { session, ready } = useAuth();
  const { outil } = useLocalSearchParams<{ outil?: string }>();
  const toolId = typeof outil === 'string' && /^[a-z0-9_.]{1,64}$/.test(outil) ? outil : null;
  const started = useRef(false);
  const [state, setState] = useState<'loading' | 'slow' | 'failed' | 'account'>('loading');
  const [entered, setEntered] = useState(false);

  const start = useCallback(() => {
    setState('loading');
    const slow = setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), 4000);
    void startDemoWithoutAccount().then(() => setEntered(true), () => setState('failed')).finally(() => clearTimeout(slow));
  }, []);

  // Démo prête (session locale connue de l'application) : accueil, puis l'outil demandé par-dessus
  useEffect(() => {
    if (!entered || !session || !isDemo) return;
    let alive = true;
    void (async () => {
      const href = toolId ? await demoToolHref(toolId).catch(() => null) : null;
      if (!alive) return;
      router.replace('/(tabs)');
      if (href) setTimeout(() => router.push(href as never), 0);
    })();
    return () => { alive = false; };
  }, [entered, session, toolId]);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (session && !isDemo) { setState('account'); return; }
    if (session && isDemo) { setEntered(true); return; }
    start();
  }, [ready, session, start]);

  async function signOutThenDemo() {
    setState('loading');
    await backend.auth.signOut().catch(() => undefined);
    start();
  }

  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center', padding: spacing.lg, gap: spacing.md }} testID="demo-entry">
      {state === 'account' ? (
        <View style={{ gap: spacing.md, maxWidth: 480, alignSelf: 'center', width: '100%' }} testID="demo-account-choice">
          <Text variant="title" center accessibilityRole="header">{tr('webDemo.accountTitle')}</Text>
          <Text center muted>{tr('webDemo.accountBody')}</Text>
          <Button label={tr('webDemo.openMine')} onPress={() => router.replace('/app' as never)} testID="demo-open-mine" />
          <Button label={tr('webDemo.signOutDemo')} variant="secondary" onPress={() => void signOutThenDemo()} testID="demo-sign-out" />
        </View>
      ) : state === 'failed' ? (
        <View style={{ gap: spacing.md, alignItems: 'center' }} testID="demo-failed" accessibilityLiveRegion="polite">
          <Text center>{tr('visit.failed')}</Text>
          <Button label={tr('visit.retry')} icon="refresh-cw" onPress={start} testID="demo-retry" />
        </View>
      ) : (
        <>
          <Loading label={tr('fw.sample')} />
          {state === 'slow' ? <Text center muted accessibilityLiveRegion="polite">{tr('visit.slow')}</Text> : null}
        </>
      )}
    </View>
  );
}
