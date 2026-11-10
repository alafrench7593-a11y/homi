#!/bin/bash
# Au fil de nous — brancher Google (carte « Sorties près de chez moi ») et, si tu le veux, remplacer la clé Gemini.
# Les clés se collent ICI, dans le Terminal : la saisie est masquée et rien n'est affiché ni enregistré dans un fichier
# du projet. Laisse une réponse vide (Entrée) pour sauter une clé.
#   1. GOOGLE_PLACES_API_KEY  → secret du serveur Supabase (recherche de lieux et photos, API « Places API (New) »)
#   2. GOOGLE_MAPS_IOS_API_KEY → variable de build Expo (fond de carte dans l'app iPhone, API « Maps SDK for iOS »)
#   3. GEMINI_API_KEY          → secret du serveur Supabase (remplace la clé actuelle)
cd "$HOME/Desktop/au-fil-de-nous-v7" || { echo "Dossier au-fil-de-nous-v7 introuvable."; read -r -p "Entrée…"; exit 1; }
REF="rbfzsfxwksxfcherhqqj"
if command -v supabase >/dev/null 2>&1; then SB="supabase"; else SB="npx --yes supabase@latest"; fi
export EAS_NO_VCS=1
TMP="$(mktemp)"; chmod 600 "$TMP"; trap 'rm -f "$TMP"' EXIT

echo "=== Google et Gemini pour Au fil de nous ==="
echo
read -r -s -p "1/3 Clé Google « Places API (New) » (serveur) : " PLACES; echo
read -r -s -p "2/3 Clé Google « Maps SDK for iOS » (app iPhone) : " MAPS_IOS; echo
read -r -s -p "3/3 Nouvelle clé Gemini (Entrée pour garder l'actuelle) : " GEMINI; echo
echo

: > "$TMP"
[ -n "$PLACES" ] && printf 'GOOGLE_PLACES_API_KEY=%s\n' "$PLACES" >> "$TMP"
[ -n "$GEMINI" ] && printf 'GEMINI_API_KEY=%s\n' "$GEMINI" >> "$TMP"
if [ -s "$TMP" ]; then
  if $SB secrets set --remote="$REF" --yes --env-file "$TMP" >/dev/null; then echo "SERVEUR OK : secrets enregistrés (valeurs non affichées)."; else echo "SERVEUR ÉCHEC : vérifie la connexion Supabase (supabase login) puis relance."; fi
else
  echo "Serveur : aucune clé saisie, rien de changé."
fi

if [ -n "$MAPS_IOS" ]; then
  npx --yes eas-cli@latest whoami >/dev/null 2>&1 || npx --yes eas-cli@latest login
  if npx --yes eas-cli@latest env:create --name GOOGLE_MAPS_IOS_API_KEY --value "$MAPS_IOS" --environment production --visibility sensitive --force --non-interactive >/dev/null; then
    echo "APP OK : clé de carte enregistrée chez Expo. Elle sera utilisée à la PROCHAINE build."
  else
    echo "APP ÉCHEC : la clé de carte n'a pas été enregistrée chez Expo."
  fi
else
  echo "App : aucune clé de carte saisie, rien de changé."
fi
unset PLACES MAPS_IOS GEMINI
echo
read -r -p "Appuie sur Entrée pour fermer…"
