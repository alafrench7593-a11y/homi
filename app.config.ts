import type { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BRAND = require('./src/config/brand.json');

// Textes des autorisations iOS traduits dans les 5 langues de l'appli (InfoPlist.strings, un dossier par langue).
// Le français reste aussi la valeur par défaut ci-dessous (infoPlist et plugins). Pas de guillemet droit " dans ces
// textes : Expo les recopie tels quels dans les fichiers .strings. NSMotionUsageDescription : jamais demandée (aucun
// capteur de mouvement utilisé), mais la clé existe car expo-location embarque ce code ; texte clair plutôt que
// le texte anglais par défaut.
const IOS_PERMISSION_TEXTS: Record<'fr' | 'en' | 'es' | 'de' | 'it', Record<string, string>> = {
  fr: {
    NSCameraUsageDescription: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.',
    NSPhotoLibraryUsageDescription: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
    NSFaceIDUsageDescription: 'Face ID protège l’accès aux informations les plus intimes de votre suivi du cycle.',
    NSLocationWhenInUseUsageDescription: 'Facultatif : votre position du moment sert seulement à trouver des lieux publics pour les familles près de vous. Elle est envoyée au service de recherche de lieux pour cette recherche, mais n’est jamais enregistrée ni montrée à quelqu’un.',
    NSMotionUsageDescription: 'HOMI n’utilise pas les capteurs de mouvement : cette autorisation ne vous est jamais demandée.',
  },
  en: {
    NSCameraUsageDescription: 'The camera is used to scan a product and to photograph what you choose to add: a document, a cycle test, a profile photo or a photo for your child’s album.',
    NSPhotoLibraryUsageDescription: 'Photo access is used only to add an image you choose: a document, a profile photo, a cycle test, a product to analyse or a photo for your child’s album.',
    NSFaceIDUsageDescription: 'Face ID protects access to the most private information in your cycle tracking.',
    NSLocationWhenInUseUsageDescription: 'Optional: your current location is used only to find public family-friendly places near you. It is sent to the place search service for that search, but it is never stored or shown to anyone.',
    NSMotionUsageDescription: 'HOMI does not use motion sensors: you will never be asked for this permission.',
  },
  es: {
    NSCameraUsageDescription: 'La cámara sirve para escanear un producto y fotografiar lo que eliges añadir: un documento, una prueba del ciclo, una foto de perfil o del álbum de tu hijo.',
    NSPhotoLibraryUsageDescription: 'El acceso a las fotos solo sirve para añadir una imagen que eliges: un documento, una foto de perfil, una prueba del ciclo, un producto que analizar o el álbum de tu hijo.',
    NSFaceIDUsageDescription: 'Face ID protege el acceso a la información más íntima de tu seguimiento del ciclo.',
    NSLocationWhenInUseUsageDescription: 'Opcional: tu ubicación actual solo sirve para encontrar lugares públicos para familias cerca de ti. Se envía al servicio de búsqueda de lugares para esa búsqueda, pero nunca se guarda ni se muestra a nadie.',
    NSMotionUsageDescription: 'HOMI no utiliza los sensores de movimiento: nunca se te pedirá este permiso.',
  },
  de: {
    NSCameraUsageDescription: 'Die Kamera dient dazu, ein Produkt zu scannen und das zu fotografieren, was du hinzufügen möchtest: ein Dokument, einen Zyklustest, ein Profilfoto oder ein Foto für das Album deines Kindes.',
    NSPhotoLibraryUsageDescription: 'Der Zugriff auf Fotos dient nur dazu, ein von dir gewähltes Bild hinzuzufügen: ein Dokument, ein Profilfoto, einen Zyklustest, ein zu analysierendes Produkt oder ein Foto für das Album deines Kindes.',
    NSFaceIDUsageDescription: 'Face ID schützt den Zugang zu den intimsten Informationen deiner Zyklusverfolgung.',
    NSLocationWhenInUseUsageDescription: 'Optional: Dein aktueller Standort dient nur dazu, öffentliche, familienfreundliche Orte in deiner Nähe zu finden. Er wird für diese Suche an den Dienst für die Ortssuche gesendet, aber nie gespeichert oder jemandem gezeigt.',
    NSMotionUsageDescription: 'HOMI nutzt keine Bewegungssensoren: Diese Berechtigung wird nie angefragt.',
  },
  it: {
    NSCameraUsageDescription: 'La fotocamera serve a scansionare un prodotto e a fotografare ciò che scegli di aggiungere: un documento, un test del ciclo, una foto del profilo o dell’album di tuo figlio.',
    NSPhotoLibraryUsageDescription: 'L’accesso alle foto serve solo ad aggiungere un’immagine che scegli: un documento, una foto del profilo, un test del ciclo, un prodotto da analizzare o l’album di tuo figlio.',
    NSFaceIDUsageDescription: 'Face ID protegge l’accesso alle informazioni più intime del monitoraggio del tuo ciclo.',
    NSLocationWhenInUseUsageDescription: 'Facoltativo: la tua posizione attuale serve solo a trovare luoghi pubblici per famiglie vicino a te. Viene inviata al servizio di ricerca dei luoghi per quella ricerca, ma non viene mai salvata né mostrata a nessuno.',
    NSMotionUsageDescription: 'HOMI non utilizza i sensori di movimento: questa autorizzazione non ti verrà mai richiesta.',
  },
};

const config: ExpoConfig = {
  name: BRAND.name,
  slug: BRAND.slug,
  // Compte Expo de HOMI : fourni par l'environnement (jamais celui de HOMI)
  owner: process.env.EXPO_OWNER,
  version: '0.1.0',
  scheme: BRAND.scheme,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  // Textes des autorisations iOS dans les 5 langues (voir IOS_PERMISSION_TEXTS)
  locales: Object.fromEntries(Object.entries(IOS_PERMISSION_TEXTS).map(([lang, ios]) => [lang, { ios }])),
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
      backgroundColor: '#06090B',
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
    // Logotype HOMI v4 (scripts/homi/brand.mjs) : le mot-symbole, clair sur ivoire, sombre sur obsidienne (fonds du thème)
    ['expo-splash-screen', { backgroundColor: '#F1EEE7', image: './assets/splash-icon.png', imageWidth: 220, dark: { backgroundColor: '#06090B', image: './assets/splash-icon-dark.png' } }],
    ['expo-notifications', { color: '#5B2A86' }],
    ['expo-local-authentication', { faceIDPermission: 'Face ID protège l’accès aux informations les plus intimes de votre suivi du cycle.' }],
    // Widget iOS « Mon cycle » (discret par défaut) — nécessite une build de développement, indisponible dans Expo Go
    ['expo-widgets', { widgets: [{ name: 'CycleWidget', displayName: 'Mon cycle', description: 'Jour du cycle, de façon discrète si vous le souhaitez.', ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'] } },
      // Widget « Bébé » (07/11/2026) : prochain biberon et prochaine prise, discret par défaut, jamais le nom d'un médicament
      { name: 'BabyWidget', displayName: 'Bébé', description: 'Heure du prochain biberon et de la prochaine prise, si vous le souhaitez.', ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'] } }] }],
    // Choix de photos : pas de micro (aucune vidéo n'est enregistrée), mêmes textes que ci-dessus
    ['expo-image-picker', {
      photosPermission: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
      cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.',
      microphonePermission: false,
    }],
    ['expo-camera', { cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil ou de l’album de votre enfant.', microphonePermission: false, recordAudioAndroid: false }],
    // « Près de chez moi » : position facultative, au premier plan seulement, jamais enregistrée ni partagée
    ['expo-location', { locationWhenInUsePermission: 'Facultatif : votre position du moment sert seulement à trouver des lieux publics pour les familles près de vous. Elle est envoyée au service de recherche de lieux pour cette recherche, mais n’est jamais enregistrée ni montrée à quelqu’un.', motionUsagePermission: IOS_PERMISSION_TEXTS.fr.NSMotionUsageDescription, locationAlwaysAndWhenInUsePermission: false, locationAlwaysPermission: false, isAndroidBackgroundLocationEnabled: false, isIosBackgroundLocationEnabled: false, isAndroidForegroundServiceEnabled: false }],
    // « Sorties près de chez moi » : fond de carte Google (Maps SDK). Clés restreintes à l'application (identifiant
    // iOS / paquet Android + empreinte SHA-1), lues à la construction depuis l'environnement, jamais écrites dans le dépôt.
    ['react-native-maps', { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY, androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Seulement « configurée ou non » (jamais la valeur) pour afficher un état clair si la carte manque
    googleMapsNative: { ios: !!process.env.GOOGLE_MAPS_IOS_API_KEY, android: !!process.env.GOOGLE_MAPS_ANDROID_API_KEY },
  },
};

export default config;
