/**
 * Fournisseurs de connexion affichés. Chacun ne s'affiche que s'il est réellement activé côté Supabase :
 * EXPO_PUBLIC_AUTH_APPLE=1 / EXPO_PUBLIC_AUTH_GOOGLE=1 (désactivés par défaut, pour ne jamais montrer un bouton qui échoue).
 */
export function enabledSocialProviders(env: Record<string, string | undefined> = {
  EXPO_PUBLIC_AUTH_APPLE: process.env.EXPO_PUBLIC_AUTH_APPLE,
  EXPO_PUBLIC_AUTH_GOOGLE: process.env.EXPO_PUBLIC_AUTH_GOOGLE,
}): { apple: boolean; google: boolean } {
  const on = (v?: string) => v === '1' || v === 'true';
  return { apple: on(env.EXPO_PUBLIC_AUTH_APPLE), google: on(env.EXPO_PUBLIC_AUTH_GOOGLE) };
}
