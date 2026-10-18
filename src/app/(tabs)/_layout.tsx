import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useAuth } from '@/lib/auth';
import { Dock } from '@/components/Dock';
import { t as tr } from '@/i18n';

export default function TabsLayout() {
  const { session, ready } = useAuth();
  if (ready && !session) return <Redirect href="/welcome" />;
  return (
    <Tabs detachInactiveScreens screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, freezeOnBlur: true }} tabBar={(props) => <Dock {...props} />}>
      <Tabs.Screen name="index" options={{ title: tr('tab.home') }} />
      <Tabs.Screen name="track" options={{ title: tr('tab.track') }} />
      {/* Au centre exact de la barre ; appui long : ajout rapide (ancien bouton « + ») */}
      <Tabs.Screen name="tools" options={{ title: tr('dock.tools') }} />
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask') }} />
      {/* Toujours accessible (Outils › Questions, lectures et communauté, liens profonds), hors de la barre pour la symétrie */}
      <Tabs.Screen name="community" options={{ title: tr('tab.community'), href: null }} />
      <Tabs.Screen name="profile" options={{ title: tr('tab.profile') }} />
    </Tabs>
  );
}
