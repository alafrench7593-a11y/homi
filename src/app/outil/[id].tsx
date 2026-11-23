/**
 * /outil/<id> — carte d'outil de la page publique vers la VRAIE web app.
 * Route privée : sans session, la garde de session note l'adresse, ouvre l'accueil / la connexion, puis y revient.
 * Connecté : l'outil s'ouvre pour l'enfant affiché (ou le plus jeune du foyer), l'accueil reste derrière (retour).
 * Outil indisponible pour ce foyer (aucun enfant, profil différent) : « Mes outils », jamais d'écran vide.
 */
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { familyToolHref } from '@/features/launch/demoTool';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';

export default function OpenTool() {
  const th = useTheme();
  const { session, ready } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const subject = useUiStore((s) => s.subject);
  const done = useRef(false);
  useEffect(() => {
    if (!ready || !session || done.current) return;
    done.current = true;
    const toolId = typeof id === 'string' && /^[a-z0-9_.]{1,64}$/.test(id) ? id : null;
    void (async () => {
      const href = toolId ? await familyToolHref(toolId, subject?.type === 'child' ? subject.id : null).catch(() => null) : null;
      router.replace('/(tabs)');
      setTimeout(() => router.push((href ?? '/(tabs)/tools') as never), 0);
    })();
  }, [ready, session, id, subject]);
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center' }} testID="open-tool">
      <Loading label={tr('common.loadingA11y')} />
    </View>
  );
}
