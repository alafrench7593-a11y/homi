#!/bin/bash
# Enregistre dans Supabase les clés serveur qui manquent à « Au fil de nous » :
#   - REVENUECAT_WEBHOOK_SECRET, PUSH_WEBHOOK_SECRET et STORAGE_CLEANUP_SECRET : créés ICI, au hasard, sur ce Mac ;
#   - OPENFOODFACTS_USER_AGENT : identifiant public demandé par Open Food Facts.
# Les valeurs ne quittent pas ce Mac (sauf vers Supabase) : elles s'affichent seulement dans cette fenêtre,
# pour que tu les recopies dans RevenueCat et dans Supabase › Database › Webhooks.
# Un secret déjà présent dans Supabase n'est jamais remplacé.
cd "$(dirname "$0")" || exit 1
REF="rbfzsfxwksxfcherhqqj"
URL="https://$REF.supabase.co/functions/v1"
echo "=== Au fil de nous → clés serveur ==="
if command -v supabase >/dev/null 2>&1; then SB="supabase"
elif command -v npx >/dev/null 2>&1; then SB="npx --yes supabase@latest"
else echo "Installe Node.js (https://nodejs.org) puis relance ce fichier."; read -r -p "Entrée pour fermer…"; exit 1; fi

$SB link --project-ref "$REF" >/dev/null 2>&1 || { $SB login && $SB link --project-ref "$REF"; } || { read -r -p "Échec du lien. Entrée pour fermer…"; exit 1; }
EXISTING="$($SB secrets list --project-ref "$REF" 2>/dev/null)"
has() { printf '%s\n' "$EXISTING" | grep -qw "$1"; }

args=(); RC=""; PUSH=""; CLEAN=""
if has REVENUECAT_WEBHOOK_SECRET; then echo "• REVENUECAT_WEBHOOK_SECRET existe déjà : inchangé."
else RC="$(openssl rand -hex 32)"; args+=("REVENUECAT_WEBHOOK_SECRET=$RC"); fi
if has PUSH_WEBHOOK_SECRET; then echo "• PUSH_WEBHOOK_SECRET existe déjà : inchangé."
else PUSH="$(openssl rand -hex 32)"; args+=("PUSH_WEBHOOK_SECRET=$PUSH"); fi
if has STORAGE_CLEANUP_SECRET; then echo "• STORAGE_CLEANUP_SECRET existe déjà : inchangé."
else CLEAN="$(openssl rand -hex 32)"; args+=("STORAGE_CLEANUP_SECRET=$CLEAN"); fi
has OPENFOODFACTS_USER_AGENT || args+=("OPENFOODFACTS_USER_AGENT=AuFilDeNous/1.0 (aufildenous@outlook.fr)")

if [ ${#args[@]} -gt 0 ]; then
  echo "Enregistrement de ${#args[@]} clé(s) dans Supabase…"
  $SB secrets set --project-ref "$REF" "${args[@]}" >/dev/null || { read -r -p "Échec de l'enregistrement. Entrée pour fermer…"; exit 1; }
  # copie locale dans .env.local (jamais versionné ni envoyé à la compilation EAS)
  touch .env.local
  for kv in "${args[@]}"; do k="${kv%%=*}"; grep -q "^$k=" .env.local || printf '%s="%s"\n' "$k" "${kv#*=}" >> .env.local; done
  echo "OK. (copie aussi enregistrée dans .env.local, jamais envoyé à la compilation)"
fi

echo
if [ -n "$RC" ]; then
  echo "────────── À FAIRE 1 : RevenueCat ──────────"
  echo "RevenueCat › ton projet › Integrations › Webhooks › Add new webhook"
  echo "  URL                  : $URL/revenuecat-webhook"
  echo "  Authorization header : Bearer $RC"
  echo "  (copie la ligne ENTIÈRE après les deux-points, « Bearer » compris)"
  echo
fi
if [ -n "$PUSH" ]; then
  echo "────────── À FAIRE 2 : notifications ──────────"
  echo "Supabase › Database › Webhooks › Create a new hook"
  echo "  Table : public.notifications   Événement : Insert"
  echo "  Type  : Supabase Edge Functions → send-push   (méthode POST)"
  echo "  HTTP Headers : ajoute  x-webhook-secret  =  $PUSH"
  echo
fi
if [ -n "$CLEAN" ]; then
  echo "────────── À FAIRE 3 : nettoyage des photos supprimées ──────────"
  echo "Supabase › Integrations › Cron › Create job (toutes les heures, par exemple « 0 * * * * »)"
  echo "  Type  : Supabase Edge Function → storage-cleanup   (méthode POST)"
  echo "  HTTP Headers : ajoute  x-cleanup-secret  =  $CLEAN"
  echo
fi
echo "Ces valeurs ne doivent être collées NULLE PART ailleurs (ni dans une conversation)."
echo "Quand c'est fait, reviens dire « fait » à Claude : il vérifiera sans lire les valeurs."
read -r -p "Appuie sur Entrée pour fermer…"
