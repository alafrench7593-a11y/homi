#!/usr/bin/env bash
# =====================================================================
# Mise en service du serveur Supabase, à lancer SUR VOTRE ORDINATEUR (jamais dans une conversation).
# Lit les secrets dans votre fichier .env local, sans les afficher. Étapes :
#   1. vérifie les outils et les variables obligatoires ;
#   2. lie le projet, applique les migrations (supabase db push) ;
#   3. enregistre les secrets serveur (supabase secrets set) ;
#   4. déploie toutes les fonctions Edge ;
#   5. vérifie que les fonctions répondent (service-status).
# Usage : ./scripts/deploy-supabase.sh <project-ref>        (option --dry-run : affiche sans exécuter)
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${1:-}"; DRY="${2:-}"
[ -z "$REF" ] && { echo "Usage : $0 <project-ref> [--dry-run]"; exit 1; }
run() { if [ "$DRY" = "--dry-run" ]; then echo "  (simulation) $*"; else "$@"; fi; }

command -v supabase >/dev/null || { echo "Installez la CLI Supabase : https://supabase.com/docs/guides/cli"; exit 1; }
[ -f .env ] || { echo "Fichier .env introuvable : copiez .env.example en .env et remplissez-le."; exit 1; }
set -a; . ./.env; set +a

missing=()
for v in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY GEMINI_API_KEY OPENFOODFACTS_USER_AGENT REVENUECAT_WEBHOOK_SECRET PUSH_WEBHOOK_SECRET; do
  [ -z "${!v:-}" ] && missing+=("$v")
done
if [ ${#missing[@]} -gt 0 ]; then echo "Variables manquantes dans .env : ${missing[*]}"; exit 1; fi

echo "1/5 Lien avec le projet $REF"
run supabase link --project-ref "$REF"

echo "2/5 Migrations"
run supabase db push

echo "3/5 Secrets serveur (valeurs non affichées)"
SECRETS=(GEMINI_API_KEY GEMINI_MODEL OPENFOODFACTS_USER_AGENT REVENUECAT_WEBHOOK_SECRET EXPO_ACCESS_TOKEN RESEND_API_KEY RESEND_FROM_EMAIL SEND_EMAIL_HOOK_SECRET PUSH_WEBHOOK_SECRET RAPPELCONSO_ENABLED RAPPELCONSO_DATASET)
args=()
for s in "${SECRETS[@]}"; do [ -n "${!s:-}" ] && args+=("$s=${!s}"); done
[ ${#args[@]} -gt 0 ] && { echo "  ${#args[@]} secret(s)"; run supabase secrets set "${args[@]}" >/dev/null; }

echo "4/5 Fonctions Edge"
for f in supabase/functions/*/; do
  name="$(basename "$f")"; [ "$name" = "_shared" ] && continue
  echo "  - $name"; run supabase functions deploy "$name" --project-ref "$REF"
done

echo "5/5 Vérification"
if [ "$DRY" != "--dry-run" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/service-status" || true)
  echo "  service-status : HTTP $code (200 attendu)"
fi
cat <<'TXT'

Reste à faire dans les tableaux de bord (voir docs/MISE_EN_SERVICE.md) :
  - Authentication › URL configuration : ajouter toietmoi://auth/callback
  - Authentication › Hooks › Send Email → fonction auth-email
  - Database › Webhooks : INSERT public.notifications → send-push (en-tête secret)
  - RevenueCat : webhook vers /functions/v1/revenuecat-webhook
TXT
