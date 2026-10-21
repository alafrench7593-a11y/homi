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
import { WebInteractionStyles } from '@/components/WebInteractionStyles';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider, useToast } from '@/components/Overlays';
import { PremiumPreviewHost } from '@/components/Premium';
import { SleepNotificationsHost } from '@/features/sleep';
import { configureNotifications, notificationRoute, notificationsSupported, registerPushToken, snoozeLocally } from '@/lib/notifications';
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
import { JourneyGuard } from '@/components/JourneyGuard';
import { DemoBar } from '@/components/DemoBar';
import { OfflinePill } from '@/components/OfflinePill';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { initCrashReporting, setCrashReportingAllowed } from '@/lib/crashReporting';
import { backend, eq } from '@/lib/backend';

/** Écran d'erreur global (expo-router) : jamais d'écran blanc. */
export const ErrorBoundary = AppErrorBoundary;

SplashScreen.preventAutoHideAsync().catch(() => undefined);
configureNotifications();
initCrashReporting();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, networkMode: 'offlineFirst', gcTime: 1000 * 60 * 60 * 24 },
    mutations: { networkMode: 'always' },
  },
});

// Cache des données récentes sur l'appareil : consultation possible hors connexion.
// Les conversations avec l'assistant et les documents ne sont pas mis en cache.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'toietmoi.cache.v1', throttleTime: 2000 });
// user_journeys : jamais repris d'un ancien cache (un parcours archivé ne doit pas réapparaître à l'ouverture)
const PRIVATE_KEYS = ['assistant_messages', 'assistant_conversations', 'documents', 'mood_checkins', 'user_journeys'];

import { useHouseholdId } from '@/lib/data/hooks';
import { useRealtimeSync, wireFocusAndOnline } from '@/lib/sync';
import { t as tr } from '@/i18n';

function Bootstrap() {
  const { session } = useAuth();
  const toast = useToast();
  // Synchronisation : premier plan / réseau, et temps réel du foyer (droits appliqués par le serveur)
  useEffect(() => wireFocusAndOnline(), []);
  const householdId = useHouseholdId();
  useRealtimeSync(session ? householdId : null, session?.userId ?? null);

  useEffect(() => startOfflineSync((n) => toast(tr('sync.done', { count: n }))), [toast]);

  useEffect(() => {
    if (session) {
      // Rapports de plantage : seulement avec l'accord donné dans Profil › Confidentialité
      backend.select<{ crash_reports_enabled: boolean }>({ table: 'privacy_settings', filters: [eq('user_id', session.userId)] })
        .then(([p]) => setCrashReportingAllowed(!!p?.crash_reports_enabled))
        .catch(() => setCrashReportingAllowed(false));
      configurePurchases(session.userId).catch(() => undefined);
      registerPushToken().catch(() => undefined);
    } else {
      setCrashReportingAllowed(false);
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
      // Traitement (« Pris »…) et biberon (« Reporter », « Annuler ») : notés sans ouvrir d'écran ;
      // « Noter le biberon » et « Modifier l'intervalle » ouvrent l'écran du bon enfant
      const route = notificationRoute(response.actionIdentifier, content.data as never);
      if (route) router.push(route as never);
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
      <Stack.Screen name="sleep/tonight" options={{ animation: 'fade' }} />
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
            <I18nProvider>
              <ToastProvider>
                <Bootstrap />
                <WebInteractionStyles />
                <WebFrame>
                  <Backdrop />
                  <Navigator />
                  <JourneyGuard />
                  <DemoBar />
                  <OfflinePill />
                  <PremiumPreviewHost />
                  <SleepNotificationsHost />
                </WebFrame>
              </ToastProvider>
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Sur un grand écran (version web), l'app garde un format téléphone centré au lieu de s'étirer. */
function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  // Contrôle de la mise en page tablette / ordinateur (tests) : localStorage « toietmoi.frame » = « off »
  let off = false;
  try { off = Platform.OS === 'web' && globalThis.localStorage?.getItem('toietmoi.frame') === 'off'; } catch { off = false; }
  if (Platform.OS !== 'web' || width < 600 || off) return <>{children}</>;
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
