#!/bin/bash
# Met à jour le serveur Supabase d'« Au fil de nous » après l'audit de sécurité du 29/10/2026 :
#   1. applique les migrations manquantes (dont les articles du guide) ;
#   2. redéploie les fonctions serveur modifiées par l'audit.
# Aucun secret n'est lu ni affiché. Si une connexion Supabase est demandée, elle se fait ICI, par toi.
cd "$(dirname "$0")" || exit 1
REF="rbfzsfxwksxfcherhqqj"
echo "=== Au fil de nous → mise à jour du serveur ==="
if command -v supabase >/dev/null 2>&1; then SB="supabase"
elif command -v npx >/dev/null 2>&1; then SB="npx --yes supabase@latest"
else
  echo "Ni la CLI Supabase ni Node.js ne sont installés. Installe Node.js (https://nodejs.org) puis relance ce fichier."
  read -r -p "Entrée pour fermer…"; exit 1
fi

echo "1/3 Lien avec le projet (connexion demandée si besoin)…"
$SB link --project-ref "$REF" || { $SB login && $SB link --project-ref "$REF"; } || { read -r -p "Échec du lien. Entrée pour fermer…"; exit 1; }

echo "2/3 Migrations manquantes (le détail s'affiche, réponds « Y » pour confirmer)…"
$SB db push --include-all || { read -r -p "Échec des migrations (rien n'a été modifié pour celle qui a échoué). Entrée pour fermer…"; exit 1; }

echo "3/3 Fonctions serveur (modifiées par l'audit + 4 jamais déployées)…"
for f in delete-account revenuecat-webhook auth-email send-push places document-extract product-lookup calendar-feed community-ai cycle-photo document-read; do
  echo "  - $f"
  $SB functions deploy "$f" --project-ref "$REF" || echo "    ⚠︎ échec pour $f"
done
echo
echo "Terminé. Reviens dans la conversation avec Claude : il vérifiera le résultat sur la base."
read -r -p "Appuie sur Entrée pour fermer…"
