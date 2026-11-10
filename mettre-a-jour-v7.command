#!/bin/bash
# Au fil de nous — mise à jour v7 du 10/11/2026 (préparée par Claude, lancée par David).
#   1. dépendances
#   2. base de données : 8 migrations (langues es/de/it, 3 × 1133 articles NON publiés, Premium strict installé
#      mais EN ATTENTE, correctifs d'audit d'accès) — aucune suppression de table, de colonne ni de donnée
#   3. fonctions serveur (assistant IA « bientôt disponible », Premium, notifications 5 langues, révocation Apple)
#   4. pages juridiques publiques (EAS Hosting)
#   5. nouvelle build iOS envoyée sur TestFlight (testeurs internes seulement, aucune soumission à Apple)
# Tout ce qui est demandé (connexion Supabase, Expo, Apple) se tape ICI, par toi. Rien n'est affiché des secrets.
cd "$HOME/Desktop/au-fil-de-nous-v7" || { echo "Dossier au-fil-de-nous-v7 introuvable."; read -r -p "Entrée…"; exit 1; }
LOG="$HOME/Desktop/mise-a-jour-v7.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date) — mise à jour v7 ==="
REF="rbfzsfxwksxfcherhqqj"
if command -v supabase >/dev/null 2>&1; then SB="supabase"; else SB="npx --yes supabase@latest"; fi
ECHECS=""

echo "=== 1/5 Dépendances ==="
npm install --no-audit --no-fund || ECHECS="$ECHECS npm"

echo "=== 2/5 Base de données (migrations) ==="
if $SB db push --remote="$REF" --include-all --yes; then echo "MIGRATIONS OK"; else echo "MIGRATIONS ÉCHEC"; ECHECS="$ECHECS migrations"; fi

echo "=== 3/5 Fonctions serveur ==="
for f in assistant assistant-demo delete-account send-push document-read document-extract scan-explain places product-lookup cycle-photo community-ai revenuecat-webhook subscription-sync auth-email; do
  if $SB functions deploy "$f" --remote="$REF" --use-api --yes </dev/null >/dev/null 2>&1; then echo "  OK $f"; else echo "  ÉCHEC $f"; ECHECS="$ECHECS $f"; fi
done

echo "=== 4/5 Pages juridiques publiques ==="
export EAS_NO_VCS=1
npx --yes eas-cli@latest whoami >/dev/null 2>&1 || npx --yes eas-cli@latest login
# Adresse publique : https://toi-et-moi.expo.app (choisie au premier déploiement, le 10/11/2026)
if npx --yes eas-cli@latest deploy --export-dir legal-site --prod; then echo "PAGES OK"; else echo "PAGES ÉCHEC"; ECHECS="$ECHECS pages"; fi

echo "=== 5/5 Build iOS → TestFlight ==="
if npx --yes eas-cli@latest build --platform ios --profile production --auto-submit --non-interactive --no-wait; then echo "BUILD ENVOYÉE"; else echo "BUILD ÉCHEC"; ECHECS="$ECHECS build"; fi

echo
if [ -z "$ECHECS" ]; then echo "=== TERMINÉ SANS ÉCHEC $(date) ==="; else echo "=== TERMINÉ — à reprendre :$ECHECS ($(date)) ==="; fi
read -r -p "Appuie sur Entrée pour fermer…"
