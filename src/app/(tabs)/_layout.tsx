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
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <Dock {...props} />}>
      <Tabs.Screen name="index" options={{ title: tr('tab.home') }} />
      <Tabs.Screen name="track" options={{ title: tr('tab.track') }} />
      <Tabs.Screen name="ask" options={{ title: tr('tab.ask') }} />
      <Tabs.Screen name="discover" options={{ title: tr('tab.discover') }} />
      <Tabs.Screen name="community" options={{ title: tr('tab.community') }} />
    </Tabs>
  );
}
