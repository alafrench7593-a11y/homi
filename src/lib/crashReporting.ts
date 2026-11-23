/**
 * Suivi des plantages (Sentry), sans AUCUNE donnée de santé.
 *
 *  - Inactif tant que EXPO_PUBLIC_SENTRY_DSN est vide, et tant que la personne n'a pas accepté
 *    les « rapports d'erreurs techniques » (privacy_settings.crash_reports_enabled).
 *  - Le SDK (y compris sa partie native) n'est démarré qu'APRÈS cet accord : avant, aucune connexion à Sentry,
 *    aucun événement natif (blocage de l'appli, arrêt par le système) ne peut partir sans passer par le filtre.
 *  - Ni identifiant d'utilisateur, ni e-mail, ni adresse IP, ni contenu d'écran, ni corps de requête.
 *  - Les messages, les chemins d'écran et les fils d'Ariane sont nettoyés : les identifiants
 *    (UUID, e-mails, nombres longs), les paramètres d'URL et les valeurs citées (« … », "…", détail
 *    Postgres « Key (colonne)=(valeur) ») sont retirés.
 */
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
let wanted = false; // initCrashReporting() appelé (démarrage de l'appli)
let started = false; // SDK réellement démarré (après accord)
let allowed = false;

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

/** Retire tout ce qui pourrait identifier une personne ou révéler une donnée saisie. */
export function scrubText(s: string | undefined | null): string | undefined {
  if (s == null) return undefined;
  return s
    .replace(/\?[^\s'"]*/g, '?…')
    .replace(UUID, ':id')
    .replace(EMAIL, ':email')
    .replace(/\)=\([^)]*\)/g, ')=(:v)') // détail Postgres : Key (first_name)=(Léa) already exists
    .replace(/"[^"\n]{1,200}"/g, '":v"')
    .replace(/«[^»\n]{1,200}»/g, '«:v»')
    .replace(/\b\d{5,}\b/g, ':n')
    .replace(/data:[^\s'"]+/g, ':data')
    .slice(0, 500);
}

type SentryEvent = Sentry.ErrorEvent;

export function scrubEvent(event: SentryEvent): SentryEvent | null {
  if (!allowed) return null;
  delete event.user;
  delete event.request;
  delete event.server_name;
  delete event.tags;
  delete event.threads;
  event.extra = undefined;
  event.contexts = { os: event.contexts?.os, device: event.contexts?.device ? { family: event.contexts.device.family, model: event.contexts.device.model } : undefined };
  if (event.message) event.message = scrubText(event.message);
  if (event.transaction) event.transaction = scrubText(event.transaction);
  for (const ex of event.exception?.values ?? []) {
    ex.value = scrubText(ex.value);
    if (ex.mechanism) delete ex.mechanism.data;
    for (const f of ex.stacktrace?.frames ?? []) delete f.vars;
  }
  event.breadcrumbs = (event.breadcrumbs ?? [])
    .filter((b) => b.category === 'navigation' || b.category === 'app.lifecycle')
    .map((b) => ({ category: b.category, timestamp: b.timestamp, data: b.data?.to ? { to: scrubText(String(b.data.to)) } : undefined }));
  return event;
}

function start(): void {
  if (started || !DSN) return;
  started = true;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    // Événements natifs : envoyés par le SDK natif SANS passer par le filtre ci-dessous → tous désactivés.
    // Seules les erreurs JavaScript, filtrées et consenties, partent.
    enableNativeCrashHandling: false,
    enableAppHangTracking: false, // iOS : « l'appli ne répond plus » (natif, non filtré)
    enableWatchdogTerminationTracking: false, // iOS : arrêt par le système (natif, non filtré)
    enableNdk: false, // Android : plantages C/C++ (natif, non filtré)
    attachThreads: false,
    enableNativeNagger: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableAutoSessionTracking: false,
    enableAutoPerformanceTracing: false,
    enableCaptureFailedRequests: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 20,
    beforeSend: (e) => scrubEvent(e),
    beforeBreadcrumb: (b) => (b.category === 'navigation' || b.category === 'app.lifecycle' ? b : null),
  });
}

/** Appelé au démarrage : ne démarre rien tant que la personne n'a pas donné son accord. */
export function initCrashReporting(): void {
  if (!DSN) return;
  wanted = true;
  if (allowed) start();
}

/** Accord de la personne (Profil › Confidentialité). Sans accord, rien n'est envoyé ni même initialisé. */
export function setCrashReportingAllowed(v: boolean): void {
  allowed = v && !!DSN;
  if (allowed && wanted) start();
}

export function crashReportingConfigured(): boolean {
  return !!DSN;
}

/** Signale une erreur attrapée (écran d'erreur global). Ne transmet que la pile nettoyée. */
export function reportError(error: unknown): void {
  if (!allowed || !started) return;
  Sentry.captureException(error instanceof Error ? error : new Error('Erreur inconnue'));
}
