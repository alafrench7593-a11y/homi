import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebInteractionStyles } from '@/components/WebInteractionStyles';
import { ThemeProvider, useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { backdropVariant, DesertScene } from '@/components/scene/DesertScene';
import { MorphHost } from '@/motion/Morph';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider, useToast } from '@/components/Overlays';
import { PremiumPreviewHost } from '@/components/Premium';
import { SleepNotificationsHost } from '@/features/sleep';
import { useHouseholdRevocationGuard } from '@/lib/householdPurge';
import { usePantryMigration } from '@/lib/data/hooks-stocks';
import { configureNotifications, notificationRoute, notificationsSupported, registerPushToken, snoozeLocally, handleDoneResponse } from '@/lib/notifications';
import { startOfflineSync, useOfflineStore } from '@/lib/offline';
import { configurePurchases, resetPurchasesUser } from '@/lib/purchases';
import { usePurchasesSync } from '@/lib/data/hooks-premium';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { useLowPower } from '@/lib/lowPower';
import { JourneyGuard } from '@/components/JourneyGuard';
import { PremiumGate } from '@/components/PremiumGate';
import { DemoBar } from '@/components/DemoBar';
import { OfflinePill } from '@/components/OfflinePill';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { initCrashReporting, setCrashReportingAllowed } from '@/lib/crashReporting';
import { backend, eq } from '@/lib/backend';
import { LaunchIntro } from '@/components/LaunchIntro';
import { duration as motionDuration, intro } from '@/theme/motion';

/** Écran d'erreur global (expo-router) : jamais d'écran blanc. */
export const ErrorBoundary = AppErrorBoundary;

SplashScreen.preventAutoHideAsync().catch(() => undefined);
// L'écran de lancement natif s'efface en fondu sur l'introduction d'ouverture (même couleur de fond)
try { SplashScreen.setOptions({ fade: true, duration: intro.splashFadeMs }); } catch { /* web, anciennes versions */ }
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
// user_journeys est conservé (types de parcours, pas de donnée de santé) : sans lui, l'accueil et l'onglet Suivi
// restaient bloqués hors connexion. En ligne, il est rechargé dès l'ouverture (un parcours archivé disparaît aussitôt).
// google_places / google_photo : contenus Google jamais enregistrés sur l'appareil (conditions d'utilisation de Google Maps Platform)
// Jamais écrites en clair sur le téléphone (cache persisté) : données intimes et de santé, liens signés des photos.
// Contrepartie assumée : ces écrans se rechargent depuis le serveur après un redémarrage de l'appli.
const PRIVATE_KEYS = ['assistant_messages', 'assistant_conversations', 'documents', 'mood_checkins', 'google_places', 'google_photo',
  'period_entries', 'periods', 'symptom_logs', 'bleeding_logs', 'discharge_logs', 'fertility_observations', 'intercourse_logs', 'ovulation_tests', 'pregnancy_tests',
  'cycle_journal', 'cycle_custom_items', 'cycle_shares', 'contraception_logs', 'postpartum_checkins', 'postpartum_actions', 'postpartum_shared_status',
  'trusted_contacts', 'child_treatments', 'treatment_logs', 'child_needs', 'child_need_entries', 'pregnancy_symptom_logs', 'maternal_weights',
  'notifications', 'child_photos', 'child-photo-url'];

import { useHouseholdId } from '@/lib/data/hooks';
import { useRealtimeSync, wireFocusAndOnline } from '@/lib/sync';
import { t as tr } from '@/i18n';
import { isPublicRoute } from '@/lib/publicRoutes';

function Bootstrap() {
  const { session } = useAuth();
  const toast = useToast();
  // Synchronisation : premier plan / réseau, et temps réel du foyer (droits appliqués par le serveur)
  useEffect(() => wireFocusAndOnline(), []);
  const householdId = useHouseholdId();
  useRealtimeSync(session ? householdId : null, session?.userId ?? null);

  useEffect(() => startOfflineSync((n) => toast(tr('sync.done', { count: n }))), [toast]);
  // Saisie refusée par le serveur (ex. Premium requis) : prévenir une fois, le détail est dans Réglages › Synchronisation
  useEffect(() => {
    let prev = useOfflineStore.getState().conflicts.length;
    return useOfflineStore.subscribe((s) => {
      if (s.conflicts.length > prev) toast(tr('pw.sync.conflict'), 'error');
      prev = s.conflicts.length;
    });
  }, [toast]);
  // Abonnement : relecture de has_premium après une resynchronisation avec RevenueCat (subscription-sync)
  usePurchasesSync();
  // Retrait ou départ d'un foyer : ses données lues auparavant sont effacées de ce téléphone
  useHouseholdRevocationGuard();
  // Ancien garde-manger local → inventaire du foyer (serveur), une seule fois, sans perte ni doublon
  usePantryMigration();

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
    // Appli fermée au moment du choix : « C'est fait » / « Dans 15 min » enregistrés à l'ouverture
    // (appli ouverte : traités par l'écouteur de configureNotifications, sans doublon ici)
    const last = Notifications.getLastNotificationResponse();
    if (last) handleDoneResponse(last).catch(() => undefined);
    open(last);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  return null;
}

/**
 * Garde de session : un lien profond ou une adresse web (/bottle/…, /settings, /cycle…) ouvert sans session,
 * ou une session qui expire sur un écran ouvert directement, renvoie vers l'accueil de connexion
 * au lieu d'un écran vide ou d'un chargement sans fin.
 */
function SessionGuard() {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !session && pathname && !isPublicRoute(pathname)) router.replace('/welcome');
  }, [ready, session, pathname]);
  return null;
}

function SessionLoading() {
  const { ready } = useAuth();
  const t = useTheme();
  if (ready) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }} testID="session-loading">
      <ActivityIndicator color={t.colors.primary} accessibilityLabel={tr('common.loadingA11y')} />
    </View>
  );
}

function Navigator() {
  const t = useTheme();
  const base = t.isDark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: 'transparent', text: t.colors.text, primary: t.colors.primary, border: 'transparent' } };
  return (
    <NavThemeProvider value={navTheme}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade', animationDuration: motionDuration.screen }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="track/[kind]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="night" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="cinematic" options={{ animation: 'fade', animationDuration: 500, gestureEnabled: false }} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                <SessionGuard />
                <WebInteractionStyles />
                <WebFrame>
                  <Backdrop />
                  <Navigator />
                  {/* Transition carte → détail : la surface d'origine s'agrandit au-dessus de la navigation */}
                  <MorphHost />
                  {/* Session pas encore restaurée : écran de chargement (évite les faux « introuvable » au démarrage) */}
                  <SessionLoading />
                  {/* Premium strict : écran Premium par-dessus les écrans réservés (src/lib/premium/access.ts) */}
                  <PremiumGate />
                  <JourneyGuard />
                  <DemoBar />
                  <OfflinePill />
                  <PremiumPreviewHost />
                  <SleepNotificationsHost />
                  {/* Introduction d'ouverture : au-dessus de tout, sans capter les touchers, une fois par lancement */}
                  <LaunchIntro />
                </WebFrame>
              </ToastProvider>
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E2F5', padding: 24 }}>
      <View style={{ flex: 1, width: 420, maxHeight: 900, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#635878', shadowOpacity: 0.28, shadowRadius: 50, shadowOffset: { width: 0, height: 24 } }}>
        {children}
      </View>
    </View>
  );
}

/**
 * Fond unique, derrière toutes les pages (HOMI v3) : scène « désert sci-fi » vectorielle (`DesertScene`), aux couleurs
 * de la palette affichée. Variante `immersive` à l'ouverture et sur l'accueil, `calm` partout ailleurs (écrans
 * denses). Le passage clair ↔ sombre se fait par un voile qui s'efface (400 ms ; Réduire les animations : immédiat) ;
 * un changement de palette est interpolé par le ThemeProvider (lumière, reflets, accents et scène ensemble).
 * Image fixe avec Réduire les animations, en économie d'énergie, en arrière-plan et la nuit.
 */
function Backdrop() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const lowPower = useLowPower();
  const pathname = usePathname();
  // voile du mode précédent, qui s'efface quand le mode change
  const [veil, setVeil] = useState<string | null>(null);
  const prevBg = useRef(t.colors.background);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (prevBg.current === t.colors.background) return;
    const from = prevBg.current;
    prevBg.current = t.colors.background;
    if (reduce) { setVeil(null); return; }
    setVeil(from);
    fade.setValue(1);
    Animated.timing(fade, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => { if (finished) setVeil(null); });
  }, [t.colors.background, reduce, fade]);
  // Pendant l'introduction cinématique, elle seule joue une vidéo (fond fixe dessous, jamais noir)
  if (pathname === '/cinematic') return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.background }} />;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: t.colors.background }} testID={t.isDark ? 'bg-night' : 'bg-powder'}>
      <DesertScene variant={backdropVariant(pathname)} still={lowPower} />
      {veil ? <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: veil, opacity: fade }]} /> : null}
    </View>
  );
}
