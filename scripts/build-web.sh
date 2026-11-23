#!/usr/bin/env bash
# Livrable web (Vercel) : site public à la racine, démonstration sous /demo, app familiale sous /app.
#  - /demo : construite SANS clé Supabase → backend de démonstration, données fictives sur l'appareil uniquement.
#  - /app  : construite avec EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (clé publique « anon »).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
cp -R legal-site/. dist/
cp site/index.html dist/index.html
cp assets/brand/homi-logo-encre.svg assets/brand/homi-symbole-encre.svg dist/
cp assets/favicon.png dist/favicon.png
env -u EXPO_PUBLIC_SUPABASE_URL -u EXPO_PUBLIC_SUPABASE_ANON_KEY EXPO_BASE_URL=/demo npx expo export --platform web --output-dir dist/demo
# Garde-fou : la démonstration publique ne doit contenir aucune adresse de backend réel
if grep -rqE "https://[a-z0-9]{20}\.supabase\.co|ploatloxxigplpdsqyri" dist/demo; then echo "ERREUR : /demo référence un backend réel" >&2; exit 1; fi
if [ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]; then
  EXPO_BASE_URL=/app npx expo export --platform web --output-dir dist/app
else
  echo "EXPO_PUBLIC_SUPABASE_URL absent : /app non construite" >&2
fi
