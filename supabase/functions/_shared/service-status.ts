/**
 * État de configuration des services côté serveur : uniquement des booléens « configuré / non configuré ».
 * Aucune valeur de clé n'est jamais renvoyée.
 */
export const SERVER_SERVICES = {
  gemini: ['GEMINI_API_KEY'],
  resend: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  auth_email_hook: ['SEND_EMAIL_HOOK_SECRET'],
  push: ['PUSH_WEBHOOK_SECRET', 'EXPO_ACCESS_TOKEN'],
  revenuecat_webhook: ['REVENUECAT_WEBHOOK_SECRET'],
  open_food_facts: ['OPENFOODFACTS_USER_AGENT'],
} as const;

export type ServerService = keyof typeof SERVER_SERVICES;

export function serviceStatus(get: (k: string) => string | undefined): Record<ServerService, boolean> {
  const out = {} as Record<ServerService, boolean>;
  for (const [name, keys] of Object.entries(SERVER_SERVICES) as [ServerService, readonly string[]][]) {
    out[name] = keys.every((k) => !!(get(k) ?? '').trim());
  }
  return out;
}
