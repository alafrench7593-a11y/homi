import React, { useEffect } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider, useToast } from '@/components/Overlays';
import { configureNotifications, notificationsSupported, registerPushToken, snoozeLocally } from '@/lib/notifications';
import { startOfflineSync } from '@/lib/offline';
import { configurePurchases, resetPurchasesUser } from '@/lib/purchases';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Aurora } from '@/components/Aurora';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { LiquidAurora } from '@/components/LiquidAurora';
import { VideoBackdrop } from '@/components/VideoBackdrop';
import { DemoBar } from '@/components/DemoBar';

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
  const base = t.isDark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: 'transparent', text: t.colors.text, primary: t.colors.primary, border: 'transparent' } };
  return (
    <NavThemeProvider value={navTheme}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="track/[kind]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="night" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
      <Stack.Screen name="assistant/chat" options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card' }} />
    </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, InstrumentSerif_400Regular_Italic });

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
              <WebFrame>
                <Backdrop />
                <Navigator />
                <DemoBar />
              </WebFrame>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Sur un grand écran (version web), l'app garde un format téléphone centré au lieu de s'étirer. */
function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 600) return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#140D1C', padding: 24 }}>
      <Aurora mood="evening" intensity={1.3} />
      <View style={{ flex: 1, width: 420, maxHeight: 900, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 50, shadowOffset: { width: 0, height: 24 } }}>
        {children}
      </View>
    </View>
  );
}

/** Fond vivant unique, derrière toutes les pages : vidéo en boucle, aurore en attendant qu'elle charge. */
function Backdrop() {
  const t = useTheme();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.background }}>
      <VideoBackdrop fallback={<LiquidAurora fallback={<Aurora />} />} />
    </View>
  );
}
