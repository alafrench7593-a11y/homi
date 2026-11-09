#!/bin/bash
# Au fil de nous — clé « Se connecter avec Apple » pour la révocation à la suppression du compte (exigence Apple).
# À lancer UNE fois, après avoir créé la clé dans developer.apple.com › Certificates, Identifiers & Profiles › Keys
# avec la case « Sign in with Apple » cochée (liée à l'identifiant fr.aufildenous.app).
# Le contenu de la clé n'est jamais affiché : il passe directement du fichier .p8 aux secrets du serveur Supabase.
cd "$HOME/Desktop/au-fil-de-nous-v7" || { echo "Dossier au-fil-de-nous-v7 introuvable."; read -r -p "Entrée…"; exit 1; }
REF="rbfzsfxwksxfcherhqqj"
if command -v supabase >/dev/null 2>&1; then SB="supabase"; else SB="npx --yes supabase@latest"; fi
echo "=== Clé Sign in with Apple ==="
echo "Fichiers de clé trouvés dans Téléchargements :"
ls "$HOME/Downloads"/AuthKey_*.p8 2>/dev/null | sed 's#.*/##'
echo
echo "ATTENTION : la clé doit avoir « Sign in with Apple » coché (une clé App Store Connect API ne marche pas)."
read -r -p "Identifiant de la clé (Key ID, 10 caractères, ex. le texte après AuthKey_) : " KEY_ID
P8="$HOME/Downloads/AuthKey_${KEY_ID}.p8"
[ -f "$P8" ] || { echo "Fichier $P8 introuvable."; read -r -p "Entrée…"; exit 1; }
read -r -p "Team ID Apple (10 caractères, en haut à droite de developer.apple.com) : " TEAM_ID
if $SB secrets set --remote="$REF" --yes APPLE_TEAM_ID="$TEAM_ID" APPLE_KEY_ID="$KEY_ID" APPLE_CLIENT_ID="fr.aufildenous.app" APPLE_PRIVATE_KEY="$(cat "$P8")" >/dev/null; then
  echo "SECRETS APPLE OK (valeurs non affichées)."
else
  echo "ÉCHEC : vérifie la connexion Supabase (supabase login) puis relance."
fi
read -r -p "Appuie sur Entrée pour fermer…"
