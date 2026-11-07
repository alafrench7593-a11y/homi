import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useAuth } from '@/lib/auth';
import { Dock } from '@/components/Dock';
import { t as tr } from '@/i18n';
import { useDigestSync } from '@/lib/data/hooks-social';

/** Notifications du résumé quotidien : reprogrammées selon les réglages (nouvel appareil, réinstallation). */
function DigestSync() {
  useDigestSync();
  return null;
}

export default function TabsLayout() {
  const { session, ready } = useAuth();
  if (ready && !session) return <Redirect href="/welcome" />;
  return (
    <>
    {session ? <DigestSync /> : null}
    <Tabs detachInactiveScreens screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, freezeOnBlur: true }} tabBar={(props) => <Dock {...props} />}>
      <Tabs.Screen name="index" options={{ title: tr('tab.home') }} />
      <Tabs.Screen name="track" options={{ title: tr('tab.track') }} />
      {/* Au centre exact de la barre ; appui long : ajout rapide (ancien bouton « + ») */}
      <Tabs.Screen name="tools" options={{ title: tr('dock.tools') }} />
      <Tabs.Screen name="community" options={{ title: tr('tab.community') }} />
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask') }} />
      {/* « Moi » retiré de la barre (choix de la propriétaire) : profil communautaire depuis Communauté, compte privé depuis l'avatar ; la route reste (liens profonds) */}
      <Tabs.Screen name="moi" options={{ title: tr('tab.me'), href: null }} />
      {/* Profil de la personne (07/11/2026, demande de la propriétaire) : dans la barre, à droite, avec sa photo ;
          toujours aussi accessible depuis l'avatar en haut à droite */}
      <Tabs.Screen name="profile" options={{ title: tr('tab.profile') }} />
    </Tabs>
    </>
  );
}
