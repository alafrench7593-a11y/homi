/**
 * « Découvrir HOMI » — présentation façon keynote (src/features/discover/Keynote.tsx). Remplace l'introduction de
 * première ouverture (/cinematic) : jouée une seule fois à la toute première ouverture (`cinematicSeen`, marquée vue dès
 * son lancement : fermer l'application pendant la présentation ne la relance pas), puis relançable depuis
 * Réglages → Découvrir HOMI (`?replay=1`). Une erreur d'affichage ne bloque jamais l'accès (sortie immédiate).
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DiscoverKeynote } from '@/features/discover/Keynote';
import { useDiscoverNav } from '@/features/discover/useDiscoverNav';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

class KeynoteBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Discover() {
  const t = useTheme();
  const nav = useDiscoverNav();
  const setCinematicSeen = useUiStore((s) => s.setCinematicSeen);
  useEffect(() => { setCinematicSeen(true); }, [setCinematicSeen]);
  return (
    <View style={{ flex: 1 }} testID="discover">
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeynoteBoundary onError={nav.exit}>
        <DiscoverKeynote onExit={nav.exit} onCatalog={nav.openCatalog} onOpenTool={nav.openTool} />
      </KeynoteBoundary>
    </View>
  );
}
