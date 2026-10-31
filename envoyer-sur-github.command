#!/bin/bash
# Envoie tout l'historique d'« Au fil de nous » dans le dépôt PRIVÉ github.com/robonomic/au-fil-de-nous.
# - L'historique vient du fichier historique.bundle (à côté de ce script) ; ton dossier n'est pas modifié.
# - La connexion à GitHub se fait par TOI, dans ton navigateur (aucune clé n'est collée ni affichée ici).
# - Les fichiers .env / .env.local (clés) ne sont PAS dans l'historique.
cd "$(dirname "$0")" || exit 1
DEPOT="https://github.com/robonomic/au-fil-de-nous.git"
pause() { read -r -p "Appuie sur Entrée pour fermer…"; }
echo "=== Au fil de nous → GitHub (dépôt privé) ==="
[ -f historique.bundle ] || { echo "historique.bundle introuvable à côté de ce fichier."; pause; exit 1; }
if ! git --version >/dev/null 2>&1; then
  echo "Git n'est pas installé : macOS va proposer « Outils de ligne de commande ». Installe-les puis relance ce fichier."
  xcode-select --install 2>/dev/null; pause; exit 1
fi

# Connexion GitHub par le navigateur (via l'outil officiel « gh ») si possible
if ! command -v gh >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  echo "Installation de l'outil officiel GitHub (gh)…"; brew install gh
fi
if command -v gh >/dev/null 2>&1; then
  if ! gh auth status -h github.com >/dev/null 2>&1; then
    echo "Connexion à GitHub : un code va s'afficher, puis ton navigateur s'ouvre. Connecte-toi avec le compte « robonomic »."
    gh auth login -h github.com -p https -w || { echo "Connexion annulée."; pause; exit 1; }
  fi
  gh auth setup-git -h github.com >/dev/null 2>&1
else
  echo "Outil gh indisponible : Git va demander « Username » puis « Password »."
  echo "  Username : robonomic"
  echo "  Password : un jeton GitHub (pas ton mot de passe), à créer ici, case « repo » cochée :"
  echo "  https://github.com/settings/tokens/new?scopes=repo&description=au-fil-de-nous"
  echo "  Tape-le seulement dans CETTE fenêtre, jamais dans une conversation."
fi

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
