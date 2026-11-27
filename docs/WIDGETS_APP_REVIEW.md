# Widgets iOS — correction du refus 4.4 (build 16)

Refus du 27/11/2026 (Submission 9149204b-540e-4c7d-8e18-7a265ef27787, version 1.0, build 15, iPad Air 11" M3) :
« There are insufficient features or functionality in your widgets, aside from launching the app. »

## 1. Cause

Build 15 : deux widgets (« Mon cycle », « Bébé ») en **petit format seulement**, trois lignes de texte figées.
- « Mon cycle » était discret par défaut : il n'affichait que « HOMI · Ouvrir l'application ».
- « Bébé » affichait aussi « Ouvrir l'application » tant que l'option détaillée n'était pas activée.
- Le cycle n'était mis à jour qu'à l'ouverture de l'écran Cycle.

## 2. Correction (build 16)

### Les six widgets

Chaque widget existe en **petit, moyen et grand** format, et aussi sur l'écran verrouillé (format rectangulaire).

| Widget | Contenu réel | Compteur, jauge ou graphique | Lien d'ouverture |
|---|---|---|---|
| Bébé | Dernier biberon (ml), dernière tétée (côté, durée, en cours), biberons et ml du jour, prochain biberon prévu | Temps écoulé qui avance seul, chrono de la tétée en cours, barres des ml sur 7 jours | `/bottle/<enfant>` |
| Sommeil | Sieste en cours ou éveil, sommeil du jour, nombre de siestes, durée de la dernière | Chrono qui avance seul, jauge « jour / moyenne personnelle », barres des heures sur 7 jours | `/sleep/<enfant>` |
| Mon cycle | Jour du cycle, compte à rebours, fenêtre fertile estimée, prise du jour de la pilule | Jauge du jour sur la longueur moyenne ; une entrée par jour, donc il avance seul à minuit | `/cycle` |
| Grossesse | Semaine (+ jours), trimestre, jours avant le terme, prochain rendez-vous de grossesse | Jauge et barre de progression ; une entrée par jour | `/pregnancy` |
| Tâches de la famille | Tâches restantes, en retard, pour moi, faites sur 7 jours, prochaines échéances | Jauge de progression, barres des tâches faites par jour ; passage en retard à l'échéance | `/family` |
| Planning | Prochain rendez-vous (date, heure, lieu), nombre aujourd'hui et sur 7 jours, suivants | Compte à rebours qui avance seul ; un rendez-vous passé disparaît à son heure | `/calendar` |

### Choix techniques

- **Aucune action depuis le widget** (pas de bouton). C'est ta consigne : une écriture faite par le widget n'atteindrait Supabase et le coparent qu'à la prochaine ouverture de l'app, ce qui risque des incohérences.
- **Aucune requête dédiée ni appel IA.**
  - Les widgets reprennent les données déjà chargées par l'app (`src/widgets/useWidgetsSync.ts`).
  - Une frise n'est renvoyée que si son contenu a changé (`src/widgets/push.ios.ts`).
  - Les compteurs avancent côté iOS (`Text` daté), sans réveiller l'app.
- **Fraîcheur des données.**
  - Elles sont rechargées au retour au premier plan et après chaque saisie.
  - Les saisies du coparent arrivent dès que l'app les charge (même cache que les écrans).
- **Enfant affiché :** celui choisi sur l'accueil, sinon le profil actif, sinon le premier enfant suivi. La mention « +N » signale les autres enfants.
- **Confidentialité.**
  - Réglages › Notifications › Widgets offre deux options :
    - « Masquer les prénoms et les intitulés » ;
    - « Cycle et grossesse détaillés », désactivé par défaut. Il n'y a alors aucun mot lié aux règles, à la contraception ou à la grossesse sur l'écran d'accueil.
  - Si le cycle est masqué ou verrouillé dans l'app, le widget affiche « Contenu protégé ».
  - Les textes personnels sont marqués `privacySensitive` : ils sont masqués sur l'iPhone verrouillé.
- **Déconnexion, changement de compte et suppression du compte.** Tous les widgets passent à « Connecte-toi à HOMI ». Aucune donnée du compte précédent ne reste (`src/lib/auth.tsx`, `src/lib/accountReset.ts`).
- **Mode « Découvrir sans compte » :** les widgets montrent les données d'exemple locales, avec la mention « Démo » dans le titre.
- **Apparence :**
  - fonds propres à chaque widget, clair et sombre ;
  - mode teinté et « Liquid Glass » d'iOS 26 : couleurs neutres quand iOS n'affiche pas les couleurs pleines ;
  - chiffres tabulaires, une ligne maximum, réduction plutôt que troncature.
- **Fichiers :**
  - `src/widgets/*Widget.tsx` (vues) ;
  - `src/widgets/model.ts` (calcul pur) ;
  - `app.config.ts` (six widgets, 4 formats).

## 3. Vérifié ici (conteneur Linux)

- `tsc` : propre.
- `src/__tests__/widgetsModel.test.ts` : contenu calculé, états vides, mode discret, frises (minuit, échéances, rendez-vous passés), déconnexion.
- `src/__tests__/widgetsRender.test.ts`.
  - Exécute la vue **compilée** de chaque widget, la même chaîne que le moteur JavaScript du widget sur iOS.
  - Configurations testées : 4 formats × clair/sombre × couleur/teinté, états données / vide / déconnecté / protégé.
  - Contrôles :
    - aucune variable extérieure ;
    - composants et modificateurs présents dans `@expo/ui` ;
    - fond de conteneur et lien d'ouverture présents ;
    - aucun « undefined » ni « NaN ».
- `expo prebuild` iOS d'essai :
  - la cible `ExpoWidgetsTarget` contient les six widgets et les 4 formats ;
  - même groupe d'apps que le build 15 (`group.app.homi.family`).

## 4. À vérifier sur appareil (build 16, avant soumission)

Rien de ce qui suit ne peut être fait sans Mac ni appareil. Pour chaque point, coche « OK », ou bien note ce qui ne va pas et prends une capture.

1. **iPhone, compte avec données.** Ajouter les six widgets en petit, moyen et grand. Contrôler :
   - aucun texte coupé ou superposé ;
   - les graphiques sont lisibles ;
   - en clair et en sombre (Réglages › Luminosité) ;
   - en mode teinté (iOS 18+ ou 26).
2. **Actualisation.**
   - Noter un biberon, démarrer puis arrêter une sieste, cocher une tâche dans l'app : le widget suit en quelques secondes.
   - Le lendemain, sans ouvrir l'app : le jour du cycle et la semaine de grossesse ont avancé.
   - Un rendez-vous passé a disparu.
3. **Coparent.** Une saisie faite sur l'autre téléphone apparaît dans le widget après ouverture de l'app.
4. **Plusieurs enfants.** Changer d'enfant sur l'accueil : les widgets Bébé et Sommeil suivent, avec « +1 ».
5. **Confidentialité.**
   - Activer « Masquer les prénoms et les intitulés » : plus de prénom, ni de titre de tâche ou de rendez-vous.
   - Option cycle et grossesse désactivée : aucun mot « règles », « pilule » ou « grossesse ».
   - iPhone verrouillé : les textes personnels sont masqués.
6. **Hors connexion.** Mode Avion : les widgets gardent le dernier contenu et les compteurs avancent.
7. **Déconnexion.** Tous les widgets affichent « Connecte-toi à HOMI ». Reconnexion avec un autre compte : rien du premier compte.
8. **Nouvel utilisateur ou aucune donnée :** chaque widget dit quoi faire (« Note un biberon… »).
9. **iPad Air M3 :**
   - widgets sur l'écran d'accueil ;
   - mêmes contrôles qu'aux points 1, 2 et 5.

   HOMI est une app iPhone (`supportsTablet: false`) qui tourne sur iPad en mode compatible. C'est ce que l'examinateur a utilisé.
10. **Captures et vidéo pour l'examen :**
    - une capture de l'écran d'accueil avec les six widgets ;
    - une vidéo de 30 s : noter un biberon dans l'app, puis revenir à l'écran d'accueil et voir le widget mis à jour.

## 5. App Review Notes (EN) — à coller dans « App Review Information » › Notes

> **Widgets (Guideline 4.4 — fixed in build 16).** HOMI now provides six data-driven widgets, each in Small, Medium and Large sizes, plus a Lock Screen (rectangular) version. Every widget shows the user's own HOMI data and keeps updating without opening the app:
> - **Baby** — last bottle (amount and live "time since"), last breastfeed (side, duration, live timer while in progress), today's bottles and total ml, next planned bottle, and a 7-day bar chart.
> - **Sleep** — live timer of the current nap (or time awake), today's total sleep and naps, a progress gauge against the child's own average, and a 7-day chart.
> - **My cycle** — cycle day with a progress gauge, countdown to the next estimated period, estimated fertile window and today's pill status. It advances automatically every day.
> - **Pregnancy** — current week and trimester, progress gauge and bar to the due date, days remaining and next pregnancy appointment. It advances daily.
> - **Family tasks** — open, overdue and "assigned to me" tasks, tasks completed this week (gauge and chart), and the next due tasks.
> - **Schedule** — next appointment with a live countdown, today's and this week's appointments, and the following ones. Past appointments disappear on their own.
>
> Widgets are read-only by design, so that data shared with a co-parent stays consistent. Tapping a widget opens the matching screen in HOMI. No AI request is made for widgets.
>
> **Privacy:** sensitive health information (cycle, contraception, pregnancy) is discreet by default and always hidden on a locked device. Users can show more details or hide first names and titles in Settings › Notifications › Widgets. Signing out clears every widget.
>
> **How to test:** on the first screen, tap "Découvrir sans compte" to load sample data on the device (widgets are then labelled "Démo"), or sign in with the demo account below. Then add the HOMI widgets from the Home Screen (touch and hold › "+" › HOMI). To see the cycle and pregnancy details, enable Settings › Notifications › Widgets › "Cycle et grossesse détaillés".
>
> Demo account: [e-mail / password — to be provided by the publisher].

## 6. Build 16

- `eas.json` › production : `autoIncrement` avec `appVersionSource: remote`. Le build passe de 15 à 16 automatiquement.
- Changement natif (nouveaux widgets) : un **build natif est indispensable**. Une OTA ne peut pas livrer de widget.
- Commande, à lancer **seulement sur ordre**, sans soumission :

  `EXPO_TOKEN=… npx eas-cli@latest build --platform ios --profile production --non-interactive`

- **Ne pas lancer `eas submit` avant l'autorisation de la propriétaire.**
