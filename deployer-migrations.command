#!/bin/bash
# Au fil de nous — applique uniquement les nouvelles migrations de la base (sans build, sans fonctions).
# Depuis le 10/11/2026 : 20261110000200_assistant_payant (assistant IA réservé aux abonnés, verrou Premium coupé ou non).
# Aucune suppression de table, de colonne ni de donnée. La connexion Supabase se fait ICI, par toi.
cd "$(dirname "$0")" || exit 1
REF="rbfzsfxwksxfcherhqqj"
if command -v supabase >/dev/null 2>&1; then SB="supabase"; else SB="npx --yes supabase@latest"; fi
LOG="$HOME/Desktop/deployer-migrations.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date) — migrations ==="
if $SB db push --remote="$REF" --include-all --yes; then echo "MIGRATIONS OK"; else echo "MIGRATIONS ÉCHEC"; fi
read -r -p "Appuie sur Entrée pour fermer…"
