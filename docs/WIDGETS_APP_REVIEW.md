# Widgets iOS — correction du refus 4.4 (build 16, puis dix widgets au build 17)

Refus du 27/11/2026 (Submission 9149204b-540e-4c7d-8e18-7a265ef27787, version 1.0, build 15, iPad Air 11" M3) :
« There are insufficient features or functionality in your widgets, aside from launching the app. »

## 1. Cause

Build 15 : deux widgets (« Mon cycle », « Bébé ») en **petit format seulement**, trois lignes de texte figées.
- « Mon cycle » était discret par défaut : il n'affichait que « HOMI · Ouvrir l'application ».
- « Bébé » affichait aussi « Ouvrir l'application » tant que l'option détaillée n'était pas activée.
- Le cycle n'était mis à jour qu'à l'ouverture de l'écran Cycle.

## 2. Correction (build 16)

### Les dix widgets

Build 16 : les six premiers. Build 17 (27/11/2026) : quatre de plus (Aura, Relais, Santé, Mon histoire) et refonte visuelle des dix.

Chaque widget existe en **petit, moyen et grand** format, et aussi sur l'écran verrouillé (format rectangulaire).

| Widget | Contenu réel | Compteur, jauge ou graphique | Lien d'ouverture |
|---|---|---|---|
| Bébé | Dernier biberon (ml), dernière tétée (côté, durée, en cours), biberons et ml du jour, prochain biberon prévu | Temps écoulé qui avance seul, chrono de la tétée en cours, barres des ml sur 7 jours | `/bottle/<enfant>` |
| Sommeil | Sieste en cours ou éveil, sommeil du jour, nombre de siestes, durée de la dernière | Chrono qui avance seul, jauge « jour / moyenne personnelle », barres des heures sur 7 jours | `/sleep/<enfant>` |
| Mon cycle | Jour du cycle, compte à rebours, fenêtre fertile estimée, prise du jour de la pilule | Jauge du jour sur la longueur moyenne ; une entrée par jour, donc il avance seul à minuit | `/cycle` |
| Grossesse | Semaine (+ jours), trimestre, jours avant le terme, prochain rendez-vous de grossesse | Jauge et barre de progression ; une entrée par jour | `/pregnancy` |
| Tâches de la famille | Tâches restantes, en retard, pour moi, faites sur 7 jours, prochaines échéances | Jauge de progression, barres des tâches faites par jour ; passage en retard à l'échéance | `/family` |
| Planning | Prochain rendez-vous (date, heure, lieu), nombre aujourd'hui et sur 7 jours, suivants | Compte à rebours qui avance seul ; un rendez-vous passé disparaît à son heure | `/calendar` |
| Aura | Suggestion du moment (prochaine étape des règles locales d'Aura, sinon une question du thème), priorités du jour (tâches en retard, rendez-vous du jour, tâches du jour, outils recommandés) | Heure des rendez-vous ; un rendez-vous du jour quitte la liste à son heure | `/assistant` (question pré-remplie, jamais envoyée) |
| Relais | Parent de garde maintenant et jusqu'à quelle heure, prochain relais (qui, quand), nuits des 7 jours, dernier relais transmis | Compte à rebours natif de la garde ; une entrée à chaque début et fin de garde ; barre de répartition des nuits | `/family/nights` |
| Santé | Prochaine prise de traitement (heure seulement), prises du jour, prochain rendez-vous de santé, prochain vaccin (date indicative, « à faire » si dépassée) | Jauge des prises du jour ; passage à la prise suivante à l'heure ; remise à zéro à minuit | `/child/<enfant>/health-tracking` |
| Mon histoire | Photo souvenir récente de l'album, âge exact, souvenir de la semaine (même semaine une année précédente, sinon le plus récent des 7 jours), nombre de souvenirs | L'âge et le souvenir avancent seuls chaque jour (frise de 7 jours) | `/child/<enfant>/story` |

### Choix techniques

- **Raccourcis d'ajout** (formats moyen et grand) : « + Biberon », « + Tétée », « + Sieste » / « Réveil », « + Tâche », « + Rendez-vous », « Noter ma journée ». Ils ouvrent l'écran de saisie de l'app (liens), sans écriture depuis le widget. C'est ta consigne : une écriture faite par le widget n'atteindrait Supabase et le coparent qu'à la prochaine ouverture de l'app, ce qui risque des incohérences.
- **Aucune requête dédiée ni appel IA.**
  - Les widgets reprennent les données déjà chargées par l'app (`src/widgets/useWidgetsSync.ts`).
  - Une frise n'est renvoyée que si son contenu a changé (`src/widgets/push.ios.ts`).
  - Les compteurs avancent côté iOS (`Text` daté), sans réveiller l'app.
- **Fraîcheur des données.**
  - Elles sont rechargées au retour au premier plan et après chaque saisie.
  - Les saisies du coparent arrivent dès que l'app les charge (même cache que les écrans).
- **Enfant affiché :** celui choisi pour les widgets (`widgetChildId`, réglage de l'appareil, composant `src/widgets/WidgetChildPicker.tsx`), sinon celui de l'accueil, sinon le profil actif, sinon le premier enfant suivi. Un choix devenu invalide (enfant retiré, accès perdu) est oublié ; il est effacé au changement de compte. La mention « +N » signale les autres enfants.
- **Aura sans IA :** la suggestion et les priorités viennent des règles locales (`src/lib/aura/nextStep.ts`, suggestions du thème, moteur `src/lib/personalization`). Aucun appel IA, aucun crédit : la question s'ouvre pré-remplie dans Aura, jamais envoyée.
- **Photo « Mon histoire » :** copie JPEG ≤ 300 px dans le dossier partagé (`widgetsDirectory`), une seule à la fois, téléchargée une seule fois par photo (lien signé de 5 min demandé seulement si la copie manque). Photos « privées » exclues. Sans photo ou en cas d'échec : aucune image, jamais d'image d'exemple. Purge à la déconnexion (`clearAllWidgets`) et en mode discret.
- **Lisibilité (les dix) :** même gabarit (logo, titre, raccourcis), un seul style de texte par niveau, chaque texte limité en lignes ET réductible (`lineLimit` + `minimumScaleFactor`), jauges avec la valeur au centre, barres des 7 jours avec la moyenne en pointillés et le jour sous chaque barre, palettes clair/sombre contrastées et tons neutres en mode teinté.
- **Confidentialité.**
  - Réglages › Notifications › Widgets offre deux options :
    - « Masquer les prénoms et les intitulés » ;
    - « Cycle, grossesse et santé détaillés », désactivé par défaut. Il n'y a alors aucun mot lié aux règles, à la contraception ou à la grossesse, ni nom de vaccin ou de rendez-vous de santé, sur l'écran d'accueil.
    - Le nom d'un médicament n'entre jamais dans un widget (heure de la prise seulement).
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
  - `app.config.ts` (dix widgets, 4 formats).

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
- `src/__tests__/widgetsNew.test.ts` : Aura, Relais, Santé, Mon histoire (données, vide, discret, déconnecté, frises), enfant des widgets, photo ≤ 300 px téléchargée une fois puis purgée.
- `src/__tests__/widgetsEngine.test.ts` : rendu de CHAQUE vue dans le **vrai moteur** (`ExpoWidgets.bundle` construit par `node node_modules/expo-widgets/scripts/build-bundle.mjs .`, évalué dans une machine virtuelle Node).
  - 10 vues × 4 formats × clair/sombre × couleur/teinté/vibrant × 6 à 7 états.
  - Aucune erreur JavaScript (elle donnerait un widget vide), uniquement des types de nœuds dessinés par `DynamicView.swift`, aucun slot, images seulement `file://`, chaque texte avec `lineLimit` + `minimumScaleFactor`, `privacySensitive` sur les données sensibles.
- `expo prebuild` iOS d'essai (build 16 ; à refaire pour le build 17) :
  - la cible `ExpoWidgetsTarget` contient les six widgets et les 4 formats ;
  - même groupe d'apps que le build 15 (`group.app.homi.family`).

## 4. À vérifier sur appareil (build 16, avant soumission)

Rien de ce qui suit ne peut être fait sans Mac ni appareil. Pour chaque point, coche « OK », ou bien note ce qui ne va pas et prends une capture.

1. **iPhone, compte avec données.** Ajouter les dix widgets en petit, moyen et grand. Contrôler :
   - aucun texte coupé ou superposé ;
   - les graphiques sont lisibles ;
   - en clair et en sombre (Réglages › Luminosité) ;
   - en mode teinté (iOS 18+ ou 26).
2. **Actualisation.**
   - Noter un biberon, démarrer puis arrêter une sieste, cocher une tâche dans l'app : le widget suit en quelques secondes.
   - Le lendemain, sans ouvrir l'app : le jour du cycle et la semaine de grossesse ont avancé.
   - Un rendez-vous passé a disparu.
3. **Coparent.** Une saisie faite sur l'autre téléphone apparaît dans le widget après ouverture de l'app.
4. **Plusieurs enfants.** Changer d'enfant sur l'accueil : les widgets Bébé, Sommeil, Santé et Mon histoire suivent, avec « +1 ». Choisir un enfant pour les widgets : ils le gardent quel que soit l'accueil.
   - **Nouveaux widgets (build 17).** Aura : la question s'ouvre pré-remplie sans être envoyée (aucun crédit). Relais : le parent de garde change à l'heure de fin. Santé : aucun nom de médicament, prise suivante à l'heure. Mon histoire : photo nette, aucune photo après déconnexion.
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
    - une capture de l'écran d'accueil avec les dix widgets ;
    - une vidéo de 30 s : noter un biberon dans l'app, puis revenir à l'écran d'accueil et voir le widget mis à jour.

## 5. App Review Notes (EN) — à coller dans « App Review Information » › Notes

> **Widgets (Guideline 4.4).** HOMI now provides ten data-driven widgets, each in Small, Medium and Large sizes, plus a Lock Screen (rectangular) version. Every widget shows the user's own HOMI data and keeps updating without opening the app:
> - **Baby** — last bottle (amount and live "time since"), last breastfeed (side, duration, live timer while in progress), today's bottles and total ml, next planned bottle, and a 7-day bar chart.
> - **Sleep** — live timer of the current nap (or time awake), today's total sleep and naps, a progress gauge against the child's own average, and a 7-day chart.
> - **My cycle** — cycle day with a progress gauge, countdown to the next estimated period, estimated fertile window and today's pill status. It advances automatically every day.
> - **Pregnancy** — current week and trimester, progress gauge and bar to the due date, days remaining and next pregnancy appointment. It advances daily.
> - **Family tasks** — open, overdue and "assigned to me" tasks, tasks completed this week (gauge and chart), and the next due tasks.
> - **Schedule** — next appointment with a live countdown, today's and this week's appointments, and the following ones. Past appointments disappear on their own.
> - **Aura** — a suggestion for right now and today's priorities (overdue tasks, today's appointments, tasks due today, recommended tools). Everything is computed on the device by HOMI's local rules: no AI request and no credit is used; a suggested question opens pre-filled in Aura and is never sent automatically.
> - **Handover** — which parent is on duty now and until when (live countdown), the next handover (who and when), the nights planned over the next 7 days and the last handover sent. It switches automatically at each handover time.
> - **Health** — next treatment dose (time only, the medicine name is never shown), today's doses taken, the next health appointment and the next vaccine due. Discreet by default and always hidden on a locked device.
> - **My story** — a recent photo from the child's album (a small copy stored in the app group), the child's exact age, which updates daily, and the memory of the week.
>
> Medium and Large widgets include shortcuts (+ Bottle, + Feed, + Nap, + Task, + Appointment, Log my day, + Photo, Handover, Treatments, Vaccines) that open the matching entry screen in HOMI, so every entry is saved and synced with the co-parent through the app. Tapping elsewhere opens the matching screen. No AI request is made for widgets.
>
> **Privacy:** sensitive health information (cycle, contraception, pregnancy, treatments, vaccines, health appointments) is discreet by default and always hidden on a locked device. Users can show more details, hide first names, titles and photos, or choose which child the widgets show in Settings › Notifications › Widgets. Signing out clears every widget and deletes the widget photo.
>
> **How to test:** on the first screen, tap "Découvrir sans compte" to load sample data on the device (widgets are then labelled "Démo"), or sign in with the demo account below. Then add the HOMI widgets from the Home Screen (touch and hold › "+" › HOMI). To see the cycle, pregnancy and health details, enable Settings › Notifications › Widgets › "Cycle, grossesse et santé détaillés".
>
> Demo account: [e-mail / password — to be provided by the publisher].

## 6. Build 16, puis 17

- `eas.json` › production : `autoIncrement` avec `appVersionSource: remote`. Le build passe de 15 à 16 automatiquement.
- Changement natif (nouveaux widgets) : un **build natif est indispensable**. Une OTA ne peut pas livrer de widget. Les quatre widgets ajoutés (Aura, Relais, Santé, Mon histoire) exigent le **build 17**.
- Commande, à lancer **seulement sur ordre**, sans soumission :

  `EXPO_TOKEN=… npx eas-cli@latest build --platform ios --profile production --non-interactive`

- **Ne pas lancer `eas submit` avant l'autorisation de la propriétaire.**
