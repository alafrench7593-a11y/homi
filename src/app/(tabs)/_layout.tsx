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
      <Tabs.Screen name="community" options={{ title: tr('tab.community') }} />
      <Tabs.Screen name="moi" options={{ title: tr('tab.me') }} />
      {/* L'assistant s'ouvre depuis l'accueil et les outils ; la route reste (liens profonds), hors de la barre */}
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask'), href: null }} />
      {/* Le Profil s'ouvre depuis l'avatar en haut à droite ; la route reste (liens profonds), hors de la barre */}
      <Tabs.Screen name="profile" options={{ title: tr('tab.profile'), href: null }} />
    </Tabs>
  );
}
