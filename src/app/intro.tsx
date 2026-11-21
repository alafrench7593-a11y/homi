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
import { prefetchDemoContent } from '@/lib/lazyContent';
import { useUiStore } from '@/lib/store';
import { IntroFlow } from '@/features/intro/IntroFlow';
import { LAST_PAGE, loadIntroProfile, saveIntroProfile, type IntroProfile } from '@/features/intro/model';
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
  // Visite (ticket 1) : la démonstration se télécharge pendant la lecture, au repos
  useEffect(() => { prefetchDemoContent(); }, []);
  // Profil déjà choisi (retour après un changement de langue) : les tableaux restent ceux de ce profil
  const [initial, setInitial] = useState<IntroProfile | null | undefined>(undefined);
  useEffect(() => { let alive = true; void loadIntroProfile().then((p) => { if (alive) setInitial(p); }); return () => { alive = false; }; }, []);
  // La keynote « Découvrir HOMI » n'est plus jouée à la première ouverture : l'introduction la remplace
  useEffect(() => { setCinematicSeen(true); }, [setCinematicSeen]);

  function leave(to: 'sign-up' | 'sign-in' | 'demo') {
    setIntroSeen(true);
    if (to === 'demo') {
      if (busy) return;
      setBusy(true);
      // Réseau lent (web : morceaux de la démonstration) : état explicite au bout de 4 s ; échec : message + nouvel
      // appui possible (le chargement réessaie) — jamais de bouton qui tourne sans fin ni d'échec silencieux
      const slow = setTimeout(() => toast(tr('visit.slow'), 'info'), 4000);
      void startDemoWithoutAccount().then(() => router.replace('/(tabs)'), () => toast(tr('visit.failed'), 'error'))
        .finally(() => { clearTimeout(slow); setBusy(false); });
      return;
    }
    router.replace(to === 'sign-up' ? '/auth/sign-up' : '/auth/sign-in');
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
      {initial === undefined ? null : (
        <IntroBoundary onError={() => { setIntroSeen(true); router.replace('/welcome'); }}>
          <IntroFlow initialPage={scene === 'start' ? LAST_PAGE : 0} initialProfile={initial} onProfile={(p) => { void saveIntroProfile(p); }}
            onLeave={leave} onLanguage={chooseLanguage} demoBusy={busy} />
        </IntroBoundary>
      )}
    </View>
  );
}
