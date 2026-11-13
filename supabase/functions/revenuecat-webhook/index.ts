// Webhook RevenueCat -> table `subscriptions` (écrite uniquement par le serveur).
// Configuration RevenueCat (Integrations › Webhooks) : URL = <projet>/functions/v1/revenuecat-webhook,
// en-tête Authorization = « Bearer <REVENUECAT_WEBHOOK_SECRET> ».
// L'identifiant RevenueCat (appUserID) est l'identifiant Supabase de l'utilisatrice.
// Si REVENUECAT_SECRET_API_KEY est définie, la fiche abonné est relue dans l'API REST après chaque événement
// (recommandation RevenueCat) ; sinon le contenu de l'événement est utilisé.
// Droits attendus : REVENUECAT_ENTITLEMENT (défaut AU_FIL_DE_NOUS_PREMIUM) et REVENUECAT_FAMILY_ENTITLEMENT (défaut
// AU_FIL_DE_NOUS_FAMILLE, Premium Famille) ; les autres droits (Assistant IA, outils) vont dans entitlement_grants.
// Logique et tests : ../_shared/subscription-run.ts, ../_shared/subscription-run_test.ts
import { adminClient } from '../_shared/http.ts';
import { entitlementId, familyEntitlementId, handleWebhook, revenueCatApi, supabaseDb } from '../_shared/subscription-run.ts';

Deno.serve((req) => {
  const key = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  return handleWebhook(req, {
    secret: Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '',
    entitlement: entitlementId(),
    familyEntitlement: familyEntitlementId(),
    api: key ? revenueCatApi(key) : null,
    db: supabaseDb(adminClient()),
  });
});
