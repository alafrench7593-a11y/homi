import type { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BRAND = require('./src/config/brand.json');

const config: ExpoConfig = {
  name: BRAND.name,
  slug: BRAND.slug,
  // Compte Expo qui compile l'app (projet « Au fil de nous »)
  owner: 'babavos94s-team',
  version: '0.1.0',
  scheme: BRAND.scheme,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: BRAND.bundleId,
    // « Se connecter avec Apple » (obligatoire sur iOS dès qu'un autre login social est proposé)
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription:
        'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.',
      NSPhotoLibraryUsageDescription:
        'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
      ITSAppUsesNonExemptEncryption: false,
    },
    // Manifeste de confidentialité Apple (exigé depuis mai 2024) : aucun pistage, et les raisons
    // d'usage des API « à justifier » appelées par React Native / Expo / AsyncStorage.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
      ],
    },
  },
  android: {
    package: BRAND.bundleId,
    adaptiveIcon: {
      backgroundColor: '#F2DDD8',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM'],
    predictiveBackGestureEnabled: false,
    // pas de sauvegarde automatique Android (cache, file hors ligne, clé des photos du cycle) : les
    // données intimes restent sur le serveur protégé et sur le téléphone, jamais dans une copie Google Drive
    allowBackup: false,
  },
  web: { bundler: 'metro', favicon: './assets/favicon.png', output: 'single' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    'expo-sharing',
    'expo-apple-authentication',
    'expo-web-browser',
    ['expo-splash-screen', { backgroundColor: '#F2DDD8', image: './assets/splash-icon.png', imageWidth: 180, dark: { backgroundColor: '#1F2344', image: './assets/splash-icon.png' } }],
    ['expo-notifications', { color: '#87533F' }],
    ['expo-local-authentication', { faceIDPermission: 'Face ID protège l’accès aux informations les plus intimes de votre suivi du cycle.' }],
    // Widget iOS « Mon cycle » (discret par défaut) — nécessite une build de développement, indisponible dans Expo Go
    ['expo-widgets', { widgets: [{ name: 'CycleWidget', displayName: 'Mon cycle', description: 'Jour du cycle, de façon discrète si vous le souhaitez.', ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'] } }] }],
    // Choix de photos : pas de micro (aucune vidéo n'est enregistrée), mêmes textes que ci-dessus
    ['expo-image-picker', {
      photosPermission: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
      cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.',
      microphonePermission: false,
    }],
    ['expo-camera', { cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.', microphonePermission: false, recordAudioAndroid: false }],
    // « Près de chez moi » : position facultative, au premier plan seulement, jamais enregistrée ni partagée
    ['expo-location', { locationWhenInUsePermission: 'Facultatif : votre position du moment sert seulement à trouver des lieux publics pour les familles près de vous. Elle est envoyée au service de recherche de lieux pour cette recherche, mais n’est jamais enregistrée ni montrée à quelqu’un.', locationAlwaysAndWhenInUsePermission: false, locationAlwaysPermission: false, isAndroidBackgroundLocationEnabled: false, isIosBackgroundLocationEnabled: false, isAndroidForegroundServiceEnabled: false }],
    // « Sorties près de chez moi » : fond de carte Google (Maps SDK). Clés restreintes à l'application (identifiant
    // iOS / paquet Android + empreinte SHA-1), lues à la construction depuis l'environnement, jamais écrites dans le dépôt.
    ['react-native-maps', { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY, androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'eda6d45e-c9ca-4e87-adf1-55e6d79af2de' },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Seulement « configurée ou non » (jamais la valeur) pour afficher un état clair si la carte manque
    googleMapsNative: { ios: !!process.env.GOOGLE_MAPS_IOS_API_KEY, android: !!process.env.GOOGLE_MAPS_ANDROID_API_KEY },
  },
};

export default config;
