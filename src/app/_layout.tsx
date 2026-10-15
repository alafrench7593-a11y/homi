import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_500Medium } from '@expo-google-fonts/bricolage-grotesque/500Medium';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider, useToast } from '@/components/Overlays';
import { configureNotifications, notificationsSupported, registerPushToken, snoozeLocally } from '@/lib/notifications';
import { startOfflineSync } from '@/lib/offline';
import { configurePurchases, resetPurchasesUser } from '@/lib/purchases';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureNotifications();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, networkMode: 'offlineFirst', gcTime: 1000 * 60 * 60 * 24 },
    mutations: { networkMode: 'always' },
  },
});

// Cache des données récentes sur l'appareil : consultation possible hors connexion.
// Les conversations avec l'assistant et les documents ne sont pas mis en cache.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'toietmoi.cache.v1', throttleTime: 2000 });
const PRIVATE_KEYS = ['assistant_messages', 'assistant_conversations', 'documents', 'mood_checkins'];

function Bootstrap() {
  const { session } = useAuth();
  const toast = useToast();

  useEffect(() => startOfflineSync((n) => toast(`${n} entrée${n > 1 ? 's' : ''} synchronisée${n > 1 ? 's' : ''}.`)), [toast]);

  useEffect(() => {
    if (session) {
      configurePurchases(session.userId).catch(() => undefined);
      registerPushToken().catch(() => undefined);
    } else {
      resetPurchasesUser().catch(() => undefined);
    }
  }, [session]);

  // Ouverture depuis une notification : lien profond vers l'écran concerné, actions « Reporter » / « C'est fait »
  useEffect(() => {
    if (!notificationsSupported) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const content = response.notification.request.content;
      const url = content.data?.url as string | undefined;
      if (response.actionIdentifier === 'snooze') {
        snoozeLocally(content.title ?? 'Rappel', content.body ?? undefined, url).catch(() => undefined);
        return;
      }
      if (response.actionIdentifier === 'done') return;
      if (url && url.startsWith('/')) router.push(url as never);
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  return null;
}

function Navigator() {
  const t = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background }, animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="track/[kind]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="night" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
      <Stack.Screen name="assistant/chat" options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ BricolageGrotesque_700Bold, BricolageGrotesque_500Medium, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' && !q.queryKey.some((k) => PRIVATE_KEYS.includes(String(k))) },
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <Bootstrap />
              <Navigator />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
