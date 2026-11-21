import React from 'react';
import { Redirect, useSegments } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useAuth } from '@/lib/auth';
import { useMemberships } from '@/lib/data/hooks';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { useTheme } from '@/theme/ThemeProvider';
import { Dock } from '@/components/Dock';
import { t as tr } from '@/i18n';
import { useDigestSync } from '@/lib/data/hooks-social';
import { useAutoNotificationsSync } from '@/lib/data/hooks-autoNotifs';
import { AuraIntroHost } from '@/features/aura/AuraEntry';

/** Notifications du résumé quotidien : reprogrammées selon les réglages (nouvel appareil, réinstallation). */
function DigestSync() {
  useDigestSync();
  return null;
}

/** Notifications automatiques (rendez-vous, tâches, échéances, papiers) : reprogrammées dès que les données changent. */
function AutoNotificationsSync() {
  useAutoNotificationsSync();
  return null;
}

/** Routes d'onglet ouvertes à un compte nounou (les autres le renvoient vers « Mes gardes »). */
const CAREGIVER_TABS = new Set(['profile', 'community', 'moi']);

export default function TabsLayout() {
  const { session, ready } = useAuth();
  const t = useTheme();
  const caregiver = isCaregiverOnly(useMemberships().data);
  const segments = useSegments() as string[];
  const leaf = segments[segments.length - 1] ?? '';
  if (ready && !session) return <Redirect href="/welcome" />;
  // Compte qui n'est QUE nounou : les écrans du foyer (accueil, Moi, Enfant, Famille, outils…) ne le concernent pas ;
  // son accueil est « Mes gardes ». Profil, Communauté et « Moi communautaire » lui restent ouverts.
  if (caregiver && !CAREGIVER_TABS.has(leaf)) return <Redirect href={'/garde' as never} />;
  return (
    <>
    {session ? <DigestSync /> : null}
    {session ? <AutoNotificationsSync /> : null}
    {/* Fond de chaque onglet défini dès le premier rendu (couleur du thème : jamais de flash blanc au premier passage) ;
        changement d'onglet sans animation du navigateur : l'écran arrive en fondu bref (`Screen`, voile frère). */}
    {/* Refonte du 17/11/2026 : Aujourd'hui · Moi · [action centrale] · Enfant · Famille. « Outils » : entrée fixe en tête
        d'Aujourd'hui et dans l'action centrale ; Communauté : bouton en haut à droite des écrans d'onglet.
        Les autres routes d'onglet restent valides hors de la barre (`href: null`) : liens profonds, notifications, tests. */}
    <Tabs detachInactiveScreens backBehavior="history" screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.colors.background }, freezeOnBlur: true, animation: 'none' }} tabBar={(props) => <Dock {...props} />}>
      <Tabs.Screen name="index" options={{ title: tr('nav.tab.today') }} />
      <Tabs.Screen name="health" options={{ title: tr('nav.tab.me') }} />
      <Tabs.Screen name="baby" options={{ title: tr('nav.tab.child') }} />
      <Tabs.Screen name="household" options={{ title: tr('nav.tab.family') }} />
      {/* Hors de la barre : Communauté (bouton d'en-tête), Agenda (→ Famille), Suivi (→ Enfant), Outils (→ Aujourd'hui), Questions (→ Moi), Moi communautaire, Profil (avatar) */}
      <Tabs.Screen name="community" options={{ title: tr('tab.community'), href: null }} />
      <Tabs.Screen name="agenda" options={{ title: tr('tab.agenda'), href: null }} />
      <Tabs.Screen name="track" options={{ title: tr('tab.track'), href: null }} />
      <Tabs.Screen name="tools" options={{ title: tr('dock.tools'), href: null }} />
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask'), href: null }} />
      <Tabs.Screen name="moi" options={{ title: tr('tab.me'), href: null }} />
      <Tabs.Screen name="profile" options={{ title: tr('tab.profile'), href: null }} />
    </Tabs>
    {/* Présentation d'Aura : une fois par compte, à la première arrivée (hors visite guidée), relançable */}
    {session ? <AuraIntroHost /> : null}
    </>
  );
}
