import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useAuth } from '@/lib/auth';
import { Dock } from '@/components/Dock';
import { t as tr } from '@/i18n';
import { useDigestSync } from '@/lib/data/hooks-social';
import { useAutoNotificationsSync } from '@/lib/data/hooks-autoNotifs';

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

export default function TabsLayout() {
  const { session, ready } = useAuth();
  if (ready && !session) return <Redirect href="/welcome" />;
  return (
    <>
    {session ? <DigestSync /> : null}
    {session ? <AutoNotificationsSync /> : null}
    {/* HOMI (13/11/2026) : 5 onglets — Accueil · Santé · Bébé · Famille · Communauté. Profil = avatar en haut à droite.
        Les anciens onglets restent des routes valides hors de la barre (`href: null`) : liens profonds, notifications, tests ;
        on y arrive depuis les hubs (accès directs), la recherche universelle et « Tous les outils ». */}
    <Tabs detachInactiveScreens backBehavior="history" screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, freezeOnBlur: true }} tabBar={(props) => <Dock {...props} />}>
      <Tabs.Screen name="index" options={{ title: tr('tab.home') }} />
      <Tabs.Screen name="health" options={{ title: tr('nav.tab.health') }} />
      <Tabs.Screen name="baby" options={{ title: tr('nav.tab.baby') }} />
      <Tabs.Screen name="household" options={{ title: tr('nav.tab.family') }} />
      <Tabs.Screen name="community" options={{ title: tr('tab.community') }} />
      {/* Hors de la barre : Agenda (→ Famille), Suivi (→ Bébé), Outils (→ Accueil et recherche), Questions (→ Santé), Moi, Profil (avatar) */}
      <Tabs.Screen name="agenda" options={{ title: tr('tab.agenda'), href: null }} />
      <Tabs.Screen name="track" options={{ title: tr('tab.track'), href: null }} />
      <Tabs.Screen name="tools" options={{ title: tr('dock.tools'), href: null }} />
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask'), href: null }} />
      <Tabs.Screen name="moi" options={{ title: tr('tab.me'), href: null }} />
      <Tabs.Screen name="profile" options={{ title: tr('tab.profile'), href: null }} />
    </Tabs>
    </>
  );
}
