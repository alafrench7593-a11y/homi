// Resynchronisation de l'abonnement de la personne connectée. POST {} (jeton de connexion obligatoire : verify_jwt).
// Relit la fiche RevenueCat (API REST, clé secrète REVENUECAT_SECRET_API_KEY côté serveur uniquement) et met à
// jour `subscriptions`. Appelée par l'application après un achat, une restauration, ou à l'ouverture quand l'état
// RevenueCat de l'appareil (CustomerInfo) diffère de celui du serveur. 20 appels par heure et par personne au plus.
// Réponses : { synced: true, status, premium } | { synced: false, reason: 'not_configured' | 'rate_limited' | 'unavailable' }
import { adminClient, corsHeaders, rateLimit, requireUser, withCors } from '../_shared/http.ts';
import { entitlementId, handleSync, revenueCatApi, supabaseDb } from '../_shared/subscription-run.ts';

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = adminClient();
  const key = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  return handleSync(req, {
    userId: async (r) => {
      const auth = await requireUser(r);
      return auth instanceof Response ? null : auth.user.id;
    },
    rateLimit: (userId) => rateLimit(admin, `subscription_sync:${userId}`, 20, 3600),
    api: key ? revenueCatApi(key) : null,
    entitlement: entitlementId(),
    db: supabaseDb(admin),
  });
}));
