/**
 * Suivi des plantages (Sentry), sans AUCUNE donnée de santé.
 *
 *  - Inactif tant que EXPO_PUBLIC_SENTRY_DSN est vide, et tant que la personne n'a pas accepté
 *    les « rapports d'erreurs techniques » (privacy_settings.crash_reports_enabled).
 *  - Ni identifiant d'utilisateur, ni e-mail, ni adresse IP, ni contenu d'écran, ni corps de requête.
 *  - Les messages, les chemins d'écran et les fils d'Ariane sont nettoyés : les identifiants
 *    (UUID, e-mails, nombres longs) et les paramètres d'URL sont retirés.
 */
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
let started = false;
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
  event.extra = undefined;
  event.contexts = { os: event.contexts?.os, device: event.contexts?.device ? { family: event.contexts.device.family, model: event.contexts.device.model } : undefined };
  if (event.message) event.message = scrubText(event.message);
  if (event.transaction) event.transaction = scrubText(event.transaction);
  for (const ex of event.exception?.values ?? []) {
    ex.value = scrubText(ex.value);
    for (const f of ex.stacktrace?.frames ?? []) delete f.vars;
  }
  event.breadcrumbs = (event.breadcrumbs ?? [])
    .filter((b) => b.category === 'navigation' || b.category === 'app.lifecycle')
    .map((b) => ({ category: b.category, timestamp: b.timestamp, data: b.data?.to ? { to: scrubText(String(b.data.to)) } : undefined }));
  return event;
}

export function initCrashReporting(): void {
  if (!DSN || started) return;
  started = true;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    // Plantages natifs : envoyés par le SDK natif SANS passer par le filtre ci-dessous ni par l'accord
    // de la personne → désactivés. Seules les erreurs JavaScript, filtrées et consenties, partent.
    enableNativeCrashHandling: false,
    enableNativeNagger: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableAutoSessionTracking: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 20,
    beforeSend: (e) => scrubEvent(e),
    beforeBreadcrumb: (b) => (b.category === 'navigation' || b.category === 'app.lifecycle' ? b : null),
  });
}

/** Accord de la personne (Profil › Confidentialité). Sans accord, rien n'est envoyé. */
export function setCrashReportingAllowed(v: boolean): void {
  allowed = v && !!DSN;
}

export function crashReportingConfigured(): boolean {
  return !!DSN;
}

/** Signale une erreur attrapée (écran d'erreur global). Ne transmet que la pile nettoyée. */
export function reportError(error: unknown): void {
  if (!allowed || !started) return;
  Sentry.captureException(error instanceof Error ? error : new Error('Erreur inconnue'));
}
