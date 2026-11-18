import type { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BRAND = require('./src/config/brand.json');

// Textes des autorisations iOS traduits dans les 5 langues de l'appli (InfoPlist.strings, un dossier par langue).
// Le français reste aussi la valeur par défaut ci-dessous (infoPlist et plugins). Pas de guillemet droit " dans ces
// textes : Expo les recopie tels quels dans les fichiers .strings. NSMotionUsageDescription : jamais demandée (aucun
// capteur de mouvement utilisé), mais la clé existe car expo-location embarque ce code ; texte clair plutôt que
// le texte anglais par défaut.
// Calendrier de l'iPhone (EventKit) : affichage des calendriers choisis dans l'agenda + ajout sur demande. iOS 17+ lit
// NSCalendarsFullAccessUsageDescription ; NSCalendarsUsageDescription reste exigée par iOS 16 et antérieurs.
const CALENDAR_PERMISSION_FR = 'Facultatif : HOMI affiche dans votre agenda familial les événements des calendriers que vous choisissez, et ajoute un événement ou un rendez-vous à votre calendrier seulement quand vous le demandez. Ce qu’il lit reste sur votre iPhone.';

const IOS_PERMISSION_TEXTS: Record<'fr' | 'en' | 'es' | 'de' | 'it', Record<string, string>> = {
  fr: {
    NSCameraUsageDescription: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil, album de votre enfant ou photo de l’enfant que vous gardez, partagée seulement avec ses parents.',
    NSPhotoLibraryUsageDescription: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
    NSPhotoLibraryAddUsageDescription: 'Facultatif : enregistre dans vos Photos une photo de votre enfant transmise par sa nounou, seulement quand vous le demandez. HOMI ne lit pas votre photothèque.',
    NSFaceIDUsageDescription: 'Face ID protège l’accès aux informations les plus intimes de votre suivi du cycle.',
    NSLocationWhenInUseUsageDescription: 'Facultatif : votre position du moment sert seulement à trouver des lieux publics pour les familles près de vous. Elle est envoyée au service de recherche de lieux pour cette recherche, mais n’est jamais enregistrée ni montrée à quelqu’un.',
    NSMotionUsageDescription: 'HOMI n’utilise pas les capteurs de mouvement : cette autorisation ne vous est jamais demandée.',
    NSCalendarsFullAccessUsageDescription: CALENDAR_PERMISSION_FR,
    NSCalendarsUsageDescription: CALENDAR_PERMISSION_FR,
  },
  en: {
    NSCameraUsageDescription: 'The camera is used to scan a product and to photograph what you choose to add: a document, a cycle test, a profile photo, a photo for your child’s album or a photo of the child you look after, shared only with their parents.',
    NSPhotoLibraryUsageDescription: 'Photo access is used only to add an image you choose: a document, a profile photo, a cycle test, a product to analyse or a photo for your child’s album.',
    NSPhotoLibraryAddUsageDescription: 'Optional: saves a photo of your child shared by their childminder to your Photos, only when you ask. HOMI does not read your photo library.',
    NSFaceIDUsageDescription: 'Face ID protects access to the most private information in your cycle tracking.',
    NSLocationWhenInUseUsageDescription: 'Optional: your current location is used only to find public family-friendly places near you. It is sent to the place search service for that search, but it is never stored or shown to anyone.',
    NSMotionUsageDescription: 'HOMI does not use motion sensors: you will never be asked for this permission.',
    NSCalendarsFullAccessUsageDescription: 'Optional: HOMI shows the events from the calendars you choose in your family planner, and adds an event or appointment to your calendar only when you ask. What it reads stays on your iPhone.',
    NSCalendarsUsageDescription: 'Optional: HOMI shows the events from the calendars you choose in your family planner, and adds an event or appointment to your calendar only when you ask. What it reads stays on your iPhone.',
  },
  es: {
    NSCameraUsageDescription: 'La cámara sirve para escanear un producto y fotografiar lo que eliges añadir: un documento, una prueba del ciclo, una foto de perfil, del álbum de tu hijo o del niño que cuidas, compartida solo con sus padres.',
    NSPhotoLibraryUsageDescription: 'El acceso a las fotos solo sirve para añadir una imagen que eliges: un documento, una foto de perfil, una prueba del ciclo, un producto que analizar o el álbum de tu hijo.',
    NSPhotoLibraryAddUsageDescription: 'Opcional: guarda en tus Fotos una foto de tu hijo compartida por su cuidadora, solo cuando lo pides. HOMI no lee tu fototeca.',
    NSFaceIDUsageDescription: 'Face ID protege el acceso a la información más íntima de tu seguimiento del ciclo.',
    NSLocationWhenInUseUsageDescription: 'Opcional: tu ubicación actual solo sirve para encontrar lugares públicos para familias cerca de ti. Se envía al servicio de búsqueda de lugares para esa búsqueda, pero nunca se guarda ni se muestra a nadie.',
    NSMotionUsageDescription: 'HOMI no utiliza los sensores de movimiento: nunca se te pedirá este permiso.',
    NSCalendarsFullAccessUsageDescription: 'Opcional: HOMI muestra en tu agenda familiar los eventos de los calendarios que elijas, y añade un evento o una cita a tu calendario solo cuando se lo pides. Lo que lee se queda en tu iPhone.',
    NSCalendarsUsageDescription: 'Opcional: HOMI muestra en tu agenda familiar los eventos de los calendarios que elijas, y añade un evento o una cita a tu calendario solo cuando se lo pides. Lo que lee se queda en tu iPhone.',
  },
  de: {
    NSCameraUsageDescription: 'Die Kamera dient dazu, ein Produkt zu scannen und das zu fotografieren, was du hinzufügen möchtest: ein Dokument, einen Zyklustest, ein Profilfoto, ein Foto für das Album deines Kindes oder ein Foto des Kindes, das du betreust, nur mit seinen Eltern geteilt.',
    NSPhotoLibraryUsageDescription: 'Der Zugriff auf Fotos dient nur dazu, ein von dir gewähltes Bild hinzuzufügen: ein Dokument, ein Profilfoto, einen Zyklustest, ein zu analysierendes Produkt oder ein Foto für das Album deines Kindes.',
    NSPhotoLibraryAddUsageDescription: 'Optional: speichert ein von der Tagesmutter geteiltes Foto deines Kindes in deinen Fotos, nur wenn du es möchtest. HOMI liest deine Mediathek nicht.',
    NSFaceIDUsageDescription: 'Face ID schützt den Zugang zu den intimsten Informationen deiner Zyklusverfolgung.',
    NSLocationWhenInUseUsageDescription: 'Optional: Dein aktueller Standort dient nur dazu, öffentliche, familienfreundliche Orte in deiner Nähe zu finden. Er wird für diese Suche an den Dienst für die Ortssuche gesendet, aber nie gespeichert oder jemandem gezeigt.',
    NSMotionUsageDescription: 'HOMI nutzt keine Bewegungssensoren: Diese Berechtigung wird nie angefragt.',
    NSCalendarsFullAccessUsageDescription: 'Optional: HOMI zeigt in deinem Familienplaner die Termine der Kalender, die du auswählst, und trägt einen Termin nur dann in deinen Kalender ein, wenn du es möchtest. Was es liest, bleibt auf deinem iPhone.',
    NSCalendarsUsageDescription: 'Optional: HOMI zeigt in deinem Familienplaner die Termine der Kalender, die du auswählst, und trägt einen Termin nur dann in deinen Kalender ein, wenn du es möchtest. Was es liest, bleibt auf deinem iPhone.',
  },
  it: {
    NSCameraUsageDescription: 'La fotocamera serve a scansionare un prodotto e a fotografare ciò che scegli di aggiungere: un documento, un test del ciclo, una foto del profilo, dell’album di tuo figlio o del bambino che accudisci, condivisa solo con i suoi genitori.',
    NSPhotoLibraryUsageDescription: 'L’accesso alle foto serve solo ad aggiungere un’immagine che scegli: un documento, una foto del profilo, un test del ciclo, un prodotto da analizzare o l’album di tuo figlio.',
    NSPhotoLibraryAddUsageDescription: 'Facoltativo: salva nelle tue Foto una foto di tuo figlio condivisa dalla tata, solo quando lo chiedi. HOMI non legge la tua libreria di foto.',
    NSFaceIDUsageDescription: 'Face ID protegge l’accesso alle informazioni più intime del monitoraggio del tuo ciclo.',
    NSLocationWhenInUseUsageDescription: 'Facoltativo: la tua posizione attuale serve solo a trovare luoghi pubblici per famiglie vicino a te. Viene inviata al servizio di ricerca dei luoghi per quella ricerca, ma non viene mai salvata né mostrata a nessuno.',
    NSMotionUsageDescription: 'HOMI non utilizza i sensori di movimento: questa autorizzazione non ti verrà mai richiesta.',
    NSCalendarsFullAccessUsageDescription: 'Facoltativo: HOMI mostra nella tua agenda di famiglia gli eventi dei calendari che scegli, e aggiunge un evento o un appuntamento al tuo calendario solo quando lo chiedi. Ciò che legge resta sul tuo iPhone.',
    NSCalendarsUsageDescription: 'Facoltativo: HOMI mostra nella tua agenda di famiglia gli eventi dei calendari che scegli, e aggiunge un evento o un appuntamento al tuo calendario solo quando lo chiedi. Ciò che legge resta sul tuo iPhone.',
  },
};

const config: ExpoConfig = {
  name: BRAND.name,
  slug: BRAND.slug,
  // Compte Expo de HOMI (alafre, projet @alafre/homi) ; EXPO_OWNER le remplace si besoin
  owner: process.env.EXPO_OWNER ?? 'alafre',
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
        'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil, album de votre enfant ou photo de l’enfant que vous gardez, partagée seulement avec ses parents.',
      NSPhotoLibraryUsageDescription:
        'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
      NSPhotoLibraryAddUsageDescription:
        'Facultatif : enregistre dans vos Photos une photo de votre enfant transmise par sa nounou, seulement quand vous le demandez. HOMI ne lit pas votre photothèque.',
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
      backgroundColor: '#EFE2DA',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM'],
    predictiveBackGestureEnabled: false,
    // pas de sauvegarde automatique Android (cache, file hors ligne, clé des photos du cycle) : les
    // données intimes restent sur le serveur protégé et sur le téléphone, jamais dans une copie Google Drive
    allowBackup: false,
    // expo-calendar déclare READ_CALENDAR / WRITE_CALENDAR : la fonction n'existe que sur iPhone, Android ne les demande pas
    blockedPermissions: ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'],
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
    // Logo HOMI v5 « maison » (scripts/homi/brand.mjs) : la maison, claire sur ivoire, sombre sur obsidienne (fonds du thème)
    ['expo-splash-screen', { backgroundColor: '#FBF4F2', image: './assets/splash-icon.png', imageWidth: 200, dark: { backgroundColor: '#1A1217', image: './assets/splash-icon-dark.png' } }],
    ['expo-notifications', { color: '#1F1B1A' }],
    ['expo-local-authentication', { faceIDPermission: 'Face ID protège l’accès aux informations les plus intimes de votre suivi du cycle.' }],
    // Widget iOS « Mon cycle » (discret par défaut) — nécessite une build de développement, indisponible dans Expo Go
    ['expo-widgets', { widgets: [{ name: 'CycleWidget', displayName: 'Mon cycle', description: 'Jour du cycle, de façon discrète si vous le souhaitez.', ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'] } },
      // Widget « Bébé » (07/11/2026) : prochain biberon et prochaine prise, discret par défaut, jamais le nom d'un médicament
      { name: 'BabyWidget', displayName: 'Bébé', description: 'Heure du prochain biberon et de la prochaine prise, si vous le souhaitez.', ios: { supportedFamilies: ['systemSmall', 'accessoryRectangular'] } }] }],
    // Choix de photos : pas de micro (aucune vidéo n'est enregistrée), mêmes textes que ci-dessus
    ['expo-image-picker', {
      photosPermission: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.',
      cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil, album de votre enfant ou photo de l’enfant que vous gardez, partagée seulement avec ses parents.',
      microphonePermission: false,
    }],
    // Espace nounou (21/11/2026) : un parent enregistre dans ses Photos une photo transmise par la nounou, sur demande
    // seulement (autorisation d'AJOUT uniquement ; la photothèque n'est jamais lue)
    ['expo-media-library', { photosPermission: 'L’accès aux photos sert uniquement à ajouter une image que vous choisissez : document, photo de profil, test du cycle, produit à analyser ou album de votre enfant.', savePhotosPermission: 'Facultatif : enregistre dans vos Photos une photo de votre enfant transmise par sa nounou, seulement quand vous le demandez. HOMI ne lit pas votre photothèque.', granularPermissions: ['photo'] }],
    ['expo-camera', { cameraPermission: 'La caméra sert à scanner un produit et à photographier ce que vous choisissez d’ajouter : document, test du cycle, photo de profil, album de votre enfant ou photo de l’enfant que vous gardez, partagée seulement avec ses parents.', microphonePermission: false, recordAudioAndroid: false }],
    // « Près de chez moi » : position facultative, au premier plan seulement, jamais enregistrée ni partagée
    ['expo-location', { locationWhenInUsePermission: 'Facultatif : votre position du moment sert seulement à trouver des lieux publics pour les familles près de vous. Elle est envoyée au service de recherche de lieux pour cette recherche, mais n’est jamais enregistrée ni montrée à quelqu’un.', motionUsagePermission: IOS_PERMISSION_TEXTS.fr.NSMotionUsageDescription, locationAlwaysAndWhenInUsePermission: false, locationAlwaysPermission: false, isAndroidBackgroundLocationEnabled: false, isIosBackgroundLocationEnabled: false, isAndroidForegroundServiceEnabled: false }],
    // Calendrier de l'iPhone : accès complet (lire les calendriers choisis + ajouter sur demande). Pas de clé
    // « écriture seule » (jamais demandée : cet état est seulement reconnu), et AUCUNE clé Rappels (non utilisés).
    ['expo-calendar', { calendarPermission: CALENDAR_PERMISSION_FR, remindersPermission: false }],
    // « Sorties près de chez moi » : fond de carte Google (Maps SDK). Clés restreintes à l'application (identifiant
    // iOS / paquet Android + empreinte SHA-1), lues à la construction depuis l'environnement, jamais écrites dans le dépôt.
    ['react-native-maps', { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY, androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '7ae940a8-0ecd-45e4-a1c9-0b5bfa6255dc' },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Seulement « configurée ou non » (jamais la valeur) pour afficher un état clair si la carte manque
    googleMapsNative: { ios: !!process.env.GOOGLE_MAPS_IOS_API_KEY, android: !!process.env.GOOGLE_MAPS_ANDROID_API_KEY },
  },
};

export default config;
