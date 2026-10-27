#!/bin/bash
# Compile « Au fil de nous » pour iOS dans le cloud Expo (EAS) et l'envoie sur TestFlight.
# Tout ce qui est demandé (connexion Expo, identifiant Apple, mot de passe, code) se tape ICI, par toi.
cd "$(dirname "$0")" || exit 1
echo "=== Au fil de nous → TestFlight ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Installe la version LTS depuis https://nodejs.org puis relance ce fichier."
  read -r -p "Appuie sur Entrée pour fermer…"; exit 1
fi
export EAS_NO_VCS=1
echo "1/3 Installation des dépendances (quelques minutes la première fois)…"
npm install --no-audit --no-fund || { read -r -p "Échec de l'installation. Entrée pour fermer…"; exit 1; }
echo "2/3 Connexion à Expo (compte babavos94s-team)…"
npx --yes eas-cli@latest whoami >/dev/null 2>&1 || npx --yes eas-cli@latest login
echo "3/3 Compilation iOS et envoi automatique sur TestFlight."
echo "    Réponds « Yes » pour te connecter à ton compte Apple et laisser Expo créer les certificats et la clé d'envoi."
npx --yes eas-cli@latest build --platform ios --profile production --auto-submit
echo
echo "Terminé. Tu peux suivre la compilation sur https://expo.dev/accounts/babavos94s-team/projects/toi-et-moi/builds"
read -r -p "Appuie sur Entrée pour fermer…"
