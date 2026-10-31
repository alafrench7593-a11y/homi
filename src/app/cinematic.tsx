/**
 * Introduction cinématique : jouée une seule fois, à la toute première ouverture (puis l'introduction
 * en diapositives et la création du compte), et rejouable depuis Réglages › Mon accueil (`?replay=1`).
 * Marquée comme vue dès son lancement : si l'application est fermée pendant l'introduction, elle ne
 * se relance pas, et une erreur d'affichage ne bloque jamais l'accès (repli immédiat sur l'application).
 */
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CinematicIntro } from '@/features/cinematicIntro/CinematicIntro';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';

class IntroBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Cinematic() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const setCinematicSeen = useUiStore((s) => s.setCinematicSeen);
  const introSeen = useUiStore((s) => s.introSeen);
  const { session, ready } = useAuth();

  useEffect(() => { setCinematicSeen(true); }, [setCinematicSeen]);

  const done = useCallback(() => {
    if (replay) {
      if (router.canGoBack()) router.back(); else router.replace('/');
      return;
    }
    // Sans compte : directement l'introduction en diapositives (ou l'accueil), sinon l'aiguillage habituel
    if (ready && !session) router.replace(introSeen ? '/welcome' : '/intro');
    else router.replace('/');
  }, [introSeen, ready, replay, session]);

  return (
    <View style={{ flex: 1 }} testID="cinematic-intro">
      <StatusBar style="light" />
      <IntroBoundary onError={done}>
        <CinematicIntro onDone={done} />
      </IntroBoundary>
    </View>
  );
}
