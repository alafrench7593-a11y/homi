#!/bin/bash
# Envoie tout l'historique d'« Au fil de nous » dans le dépôt PRIVÉ github.com/aufildenous/au-fil-de-nous.
# - L'historique vient du fichier historique.bundle (à côté de ce script) ; ton dossier n'est pas modifié.
# - La connexion à GitHub se fait par TOI, dans ton navigateur (aucune clé n'est collée ni affichée ici).
# - Les fichiers .env / .env.local (clés) ne sont PAS dans l'historique.
cd "$(dirname "$0")" || exit 1
DEPOT="https://github.com/aufildenous/au-fil-de-nous.git"
pause() { read -r -p "Appuie sur Entrée pour fermer…"; }
echo "=== Au fil de nous → GitHub (dépôt privé) ==="
[ -f historique.bundle ] || { echo "historique.bundle introuvable à côté de ce fichier."; pause; exit 1; }
if ! git --version >/dev/null 2>&1; then
  echo "Git n'est pas installé : macOS va proposer « Outils de ligne de commande ». Installe-les puis relance ce fichier."
  xcode-select --install 2>/dev/null; pause; exit 1
fi

# Connexion GitHub par le navigateur, avec l'outil OFFICIEL de GitHub (« gh »).
# S'il manque, il est téléchargé depuis github.com/cli/cli (version 2.103.3), empreinte SHA-256 vérifiée.
GH="$(command -v gh)"
if [ -z "$GH" ]; then
  V="2.103.3"; ARCH="arm64"; [ "$(uname -m)" = "x86_64" ] && ARCH="amd64"
  SUM_arm64="d700207eae9ae98fe2b89535c2c087c07823d4628c56364695a5a07ef311c062"
  SUM_amd64="a2f86418f4350ae6e9ec60d5000bdf7665728436946a97fc27fe50e6ae752682"
  ATTENDU="$( [ "$ARCH" = arm64 ] && echo $SUM_arm64 || echo $SUM_amd64 )"
  DIR="$HOME/.local/gh-officiel"; mkdir -p "$DIR"
  ZIP="$DIR/gh_${V}_macOS_${ARCH}.zip"
  echo "Téléchargement de l'outil officiel GitHub (gh $V)…"
  curl -fsSL -o "$ZIP" "https://github.com/cli/cli/releases/download/v${V}/gh_${V}_macOS_${ARCH}.zip" || { echo "Téléchargement impossible."; pause; exit 1; }
  [ "$(shasum -a 256 "$ZIP" | cut -d' ' -f1)" = "$ATTENDU" ] || { echo "Empreinte incorrecte : fichier refusé."; pause; exit 1; }
  ditto -x -k "$ZIP" "$DIR" && GH="$DIR/gh_${V}_macOS_${ARCH}/bin/gh"
  [ -x "$GH" ] || { echo "Installation de gh impossible."; pause; exit 1; }
fi
if ! "$GH" auth status -h github.com >/dev/null 2>&1; then
  echo
  echo "Connexion à GitHub : un CODE de 8 caractères va s'afficher ci-dessous."
  echo "Ouvre https://github.com/login/device (connecté au compte « aufildenous »), entre ce code puis « Authorize »."
  echo "Quand le code s'affiche, appuie sur Entrée ici (sans rien taper d'autre)."
  "$GH" auth login -h github.com -p https -w -s repo || { echo "Connexion annulée."; pause; exit 1; }
fi
"$GH" auth setup-git -h github.com >/dev/null 2>&1
echo "Compte GitHub connecté : $("$GH" api user --jq .login 2>/dev/null)"

TMP="$(mktemp -d)"
git clone -q historique.bundle "$TMP/depot" || { echo "Échec de lecture de l'historique."; pause; exit 1; }
cd "$TMP/depot" || exit 1
git remote set-url origin "$DEPOT"
echo "Envoi de $(git rev-list --count HEAD) enregistrements…"
if git push -u origin HEAD:main; then
  DISTANT="$(git ls-remote origin refs/heads/main | cut -f1)"; LOCAL="$(git rev-parse HEAD)"
  if [ "$DISTANT" = "$LOCAL" ]; then echo "OK : GitHub contient exactement le même dernier enregistrement (${LOCAL:0:7})."
  else echo "⚠︎ L'envoi a répondu OK mais GitHub montre ${DISTANT:0:7} au lieu de ${LOCAL:0:7}."; fi
else
  echo "⚠︎ Échec de l'envoi (rien n'a été modifié de ton côté)."
fi
echo "Reviens dire « fait » à Claude : il vérifiera."
pause
