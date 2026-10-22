# Installer Toi & Moi sur votre téléphone (build de développement)

L'application utilise des modules natifs (Face ID, notifications, widget iOS, lecture de photos) : elle **ne fonctionne pas entièrement dans Expo Go**. Il faut une « build de développement », fabriquée dans le cloud par EAS. Aucune clé n'est à me transmettre : tout se fait depuis votre ordinateur.

## Ce qu'il vous faut
- Un compte gratuit sur expo.dev.
- iPhone : un compte Apple Developer (99 €/an) pour installer une build sur votre propre appareil. Android : rien de plus.
- Node.js 20 ou plus sur votre ordinateur.

## Étapes (une seule fois)
```bash
cd toi-et-moi
npm install
npx eas-cli@latest login
npx eas-cli@latest init            # crée le projet ; copiez l'identifiant affiché dans .env : EXPO_PUBLIC_EAS_PROJECT_ID=…
```

## iPhone
```bash
npx eas-cli@latest device:create   # ouvre un lien : à ouvrir sur l'iPhone pour l'enregistrer
npx eas-cli@latest build --profile development --platform ios
```
À la fin, EAS affiche un lien et un QR code : ouvrez-le sur l'iPhone pour installer l'application. Activez ensuite **Réglages › Confidentialité › Mode développeur** si iOS le demande.

## Android
```bash
npx eas-cli@latest build --profile development --platform android
```
Installez l'APK depuis le lien affiché.

## Lancer l'application
```bash
npx expo start --dev-client
```
Scannez le QR code avec l'application installée (même réseau Wi-Fi).

## Ce qu'il faut vérifier en priorité sur le téléphone
1. **Verrouillage** : Mon cycle › Confidentialité › Verrouillage biométrique « Tout le suivi du cycle », quitter, revenir → Face ID / empreinte demandé.
2. **Rappels** : créer un rappel « Ma pilule » dans 2 minutes → la notification arrive, téléphone verrouillé, avec un titre discret.
3. **Widget iOS** : écran d'accueil › appui long › « + » › Toi & Moi › « Mon cycle ». Contenu discret par défaut ; détaillé si activé dans Confidentialité du cycle.
4. **Calendrier** : glissement d'un mois à l'autre au doigt, sélection de plusieurs jours de règles.
5. **Photo privée** (avec le vrai serveur seulement) : ajout dans « Notes », puis suppression.
6. **Accessibilité** : VoiceOver / TalkBack sur l'accueil du cycle et la feuille « Ajouter aujourd'hui » ; très grande taille de texte.
7. **Hors connexion** : mode avion, ajouter une journée, revenir en ligne → synchronisation.

Notez ce qui ne va pas (capture d'écran + modèle de téléphone) : je corrige ensuite.
