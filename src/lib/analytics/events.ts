/**
 * Événements de conversion (03/12/2026) — petit module LOCAL, sans dépendance (aucun SDK d'analyse dans HOMI).
 *
 * Consentement : réutilise le consentement « analytics » existant (privacy_settings.analytics_enabled, choisi pendant
 * l'onboarding et modifiable dans Réglages › Confidentialité ; faux par défaut).
 *  - consentement inconnu (pas encore de compte) : les événements restent SUR L'APPAREIL (200 au plus, 30 jours) ;
 *  - consentement refusé : la file est vidée, rien n'est gardé ;
 *  - consentement accordé : la file est envoyée à la table analytics_events (migration 20261203000100), puis vidée.
 * Propriétés : liste blanche stricte (étape de vie, besoin, formule, variante A/B…) aux valeurs courtes en minuscules.
 * JAMAIS de donnée de santé, d'enfant ni de contenu de journal : toute autre clé ou valeur est retirée.
 * `first_billing_confirmed` est écrit CÔTÉ SERVEUR (webhook RevenueCat, supabase/functions/_shared/conversion.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid } from '@/lib/uuid';

export type EventName =
  | 'onboarding_started' | 'demo_completed' | 'paywall_viewed' | 'plan_selected' | 'paywall_closed'
  | 'account_required' | 'purchase_outcome' | 'trial_confirmed' | 'reminder_set';
export const EVENT_NAMES: EventName[] = ['onboarding_started', 'demo_completed', 'paywall_viewed', 'plan_selected', 'paywall_closed', 'account_required', 'purchase_outcome', 'trial_confirmed', 'reminder_set'];

/** Seules propriétés acceptées. */
export const ALLOWED_PROPS = ['stage', 'need', 'tier', 'period', 'variant', 'direction', 'trial', 'outcome', 'source', 'step'] as const;
export type PropKey = (typeof ALLOWED_PROPS)[number];
export type EventProps = Partial<Record<PropKey, string | number | boolean | null>>;

export interface QueuedEvent { name: EventName; props: Record<string, string | number | boolean>; install_id: string; at: string }

export const INSTALL_KEY = 'homi.install-id.v1';
export const QUEUE_KEY = 'homi.analytics.queue.v1';
export const QUEUE_MAX = 200;
export const QUEUE_TTL_MS = 30 * 86_400_000;

const SAFE_VALUE = /^[a-z0-9_]{1,32}$/;

/** Retire toute propriété hors liste blanche et toute valeur qui n'est pas un court identifiant. */
export function sanitize(props: EventProps | Record<string, unknown> | null | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (!(ALLOWED_PROPS as readonly string[]).includes(k)) continue;
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1000) out[k] = v;
    else if (typeof v === 'string' && SAFE_VALUE.test(v)) out[k] = v;
  }
  return out;
}

/** File bornée : 200 événements au plus, de moins de 30 jours. */
export function trimQueue(q: QueuedEvent[], now = Date.now()): QueuedEvent[] {
  return q.filter((e) => now - Date.parse(e.at) < QUEUE_TTL_MS).slice(-QUEUE_MAX);
}

let installId: string | null = null;
/** Identifiant d'installation (aléatoire, sans lien avec le compte) : sert à l'assignation stable du test A/B. */
export async function getInstallId(): Promise<string> {
  if (installId) return installId;
  try {
    const v = await AsyncStorage.getItem(INSTALL_KEY);
    if (v) return (installId = v);
    installId = uuid();
    await AsyncStorage.setItem(INSTALL_KEY, installId);
  } catch {
    installId = installId ?? uuid();
  }
  return installId;
}

export type Consent = boolean | null;
type Sender = (rows: QueuedEvent[]) => Promise<boolean>;
let consentReader: () => Promise<Consent> = async () => null;
let sender: Sender = async () => false;

/** Branché par l'application (lecture du consentement, envoi) ; les tests injectent les leurs. */
export function configureAnalytics(o: { consent: () => Promise<Consent>; send: Sender }) {
  consentReader = o.consent;
  sender = o.send;
}

async function readQueue(): Promise<QueuedEvent[]> {
  try { return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]') as QueuedEvent[]; } catch { return []; }
}
async function writeQueue(q: QueuedEvent[]) {
  try {
    if (q.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    else await AsyncStorage.removeItem(QUEUE_KEY);
  } catch { /* meilleur effort */ }
}

let chain: Promise<unknown> = Promise.resolve();

/** Enregistre un événement (jamais bloquant, ne lève jamais d'erreur). */
export function track(name: EventName, props?: EventProps): Promise<void> {
  const run = chain.catch(() => undefined).then(async () => {
    const consent = await consentReader().catch(() => null);
    if (consent === false) return writeQueue([]);
    const ev: QueuedEvent = { name, props: sanitize(props), install_id: await getInstallId(), at: new Date().toISOString() };
    const q = trimQueue([...(await readQueue()), ev]);
    if (consent === true && (await sender(q).catch(() => false))) return writeQueue([]);
    return writeQueue(q);
  });
  chain = run;
  return run.then(() => undefined, () => undefined);
}

/** Envoie la file après un changement de consentement ou une connexion. */
export function flushAnalytics(): Promise<void> {
  const run = chain.catch(() => undefined).then(async () => {
    const consent = await consentReader().catch(() => null);
    if (consent === false) return writeQueue([]);
    if (consent !== true) return;
    const q = trimQueue(await readQueue());
    if (q.length && (await sender(q).catch(() => false))) await writeQueue([]);
  });
  chain = run;
  return run.then(() => undefined, () => undefined);
}

/** Pour les tests. */
export const __analyticsReset = () => { installId = null; chain = Promise.resolve(); consentReader = async () => null; sender = async () => false; };
export const __readQueue = readQueue;
