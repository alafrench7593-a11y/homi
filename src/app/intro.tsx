/**
 * Introduction de première ouverture (20/11/2026) : « Je suis… » → trois tableaux des vrais outils du profil →
 * « Commencer » / « J'ai déjà un compte » / « Découvrir sans compte » (src/features/intro/IntroFlow.tsx).
 * Jouée à la toute première ouverture sans compte (src/app/index.tsx), rejouable depuis l'accueil sans compte
 * (/welcome, langue : `?scene=start`). Le profil choisi est gardé dans le brouillon local `intro.profile`
 * (src/features/intro/model.ts) pour préremplir l'onboarding. Une erreur d'affichage ne bloque jamais l'accès.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { haptic } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { t as tr } from '@/i18n';
import { getLocale } from '@/i18n';
import { returnHereAfterLocaleChange } from '@/i18n/I18nProvider';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { useAuth } from '@/lib/auth';
import { prefetchDemoContent } from '@/lib/lazyContent';
import { useUiStore } from '@/lib/store';
import { KeynoteIntro } from '@/features/intro/KeynoteIntro';
import { KEYNOTE_LAST } from '@/features/intro/model';
import { useTheme } from '@/theme/ThemeProvider';

class IntroBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Intro() {
  const t = useTheme();
  const { scene } = useLocalSearchParams<{ scene?: string }>();
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const setCinematicSeen = useUiStore((s) => s.setCinematicSeen);
  const setLocalePref = useUiStore((s) => s.setLocalePref);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [entered, setEntered] = useState(false);
  const { session } = useAuth();
  useEffect(() => { if (entered && session) router.replace('/(tabs)'); }, [entered, session]);
  // Visite (ticket 1) : la démonstration se télécharge pendant la lecture, au repos
  useEffect(() => { prefetchDemoContent(); }, []);
  // La keynote « Découvrir HOMI » n'est plus jouée à la première ouverture : l'introduction la remplace
  useEffect(() => { setCinematicSeen(true); }, [setCinematicSeen]);

  // « Commencer » (24/11/2026) : la présentation mène au parcours guidé par Aura (étape de vie → besoin → démo → compte)
  function leave(to: 'start' | 'sign-in' | 'demo') {
    setIntroSeen(true);
    if (to === 'demo') {
      if (busy) return;
      setBusy(true);
      // Réseau lent (web : morceaux de la démonstration) : état explicite au bout de 4 s ; échec : message + nouvel
      // appui possible (le chargement réessaie) — jamais de bouton qui tourne sans fin ni d'échec silencieux
      const slow = setTimeout(() => toast(tr('visit.slow'), 'info'), 4000);
      // Ouverture de l'accueil quand la session de la visite est CONNUE de l'application (effet ci-dessous) : naviguer
      // juste après startDemoWithoutAccount laissait passer un état transitoire « prête, sans session » → renvoi vers
      // /welcome (course révélée quand la démonstration est déjà préchargée).
      void startDemoWithoutAccount().then(() => setEntered(true), () => toast(tr('visit.failed'), 'error'))
        .finally(() => { clearTimeout(slow); setBusy(false); });
      return;
    }
    router.replace((to === 'start' ? '/start' : '/auth/sign-in') as never);
  }
  function chooseLanguage(code: string) {
    if (code === getLocale()) return;
    haptic('selection');
    returnHereAfterLocaleChange('/intro?scene=start');
    setLocalePref(code);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <IntroBoundary onError={() => { setIntroSeen(true); router.replace('/start' as never); }}>
        <KeynoteIntro initialPage={scene === 'start' ? KEYNOTE_LAST : 0} onLeave={leave} onLanguage={chooseLanguage} demoBusy={busy} />
      </IntroBoundary>
    </View>
  );
}
