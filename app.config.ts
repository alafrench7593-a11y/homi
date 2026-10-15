import type { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BRAND = require('./src/config/brand.json');

const config: ExpoConfig = {
  name: BRAND.name,
  slug: BRAND.slug,
  version: '0.1.0',
  scheme: BRAND.scheme,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: BRAND.bundleId,
    infoPlist: {
      NSCameraUsageDescription:
        'La caméra sert uniquement à scanner un produit ou photographier un document que vous choisissez d’enregistrer.',
      NSPhotoLibraryUsageDescription:
        'L’accès aux photos sert uniquement à ajouter une image que vous choisissez (document, photo de profil, produit à analyser).',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BRAND.bundleId,
    adaptiveIcon: {
      backgroundColor: '#F6EFE6',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM'],
    predictiveBackGestureEnabled: false,
  },
  web: { bundler: 'metro', favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    'expo-sharing',
    ['expo-splash-screen', { backgroundColor: '#F6EFE6', image: './assets/icon.png', imageWidth: 120 }],
    ['expo-notifications', { color: '#C97B63' }],
    ['expo-camera', { cameraPermission: 'La caméra sert à scanner un produit ou un document.', recordAudioAndroid: false }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
