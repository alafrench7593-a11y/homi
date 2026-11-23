# Calendrier de l'iPhone dans l'agenda HOMI

Module : `src/lib/deviceCalendar/` (EventKit via `expo-calendar` 57). Interface : `src/features/deviceCalendar/`,
écran `src/app/settings/iphone-calendar.tsx` (ouvert depuis l'agenda et depuis Réglages), agenda `src/app/calendar.tsx`,
rendez-vous `src/app/appointments.tsx`. Tests : `src/__tests__/deviceCalendar.test.ts`.

## Ce qui est fait

- **Voir** : les événements des calendriers de l'iPhone que l'utilisateur choisit apparaissent dans l'agenda, avec la
  marque « iPhone » et le nom du calendrier. Lecture seule ; un appui ouvre un détail sans action d'écriture.
- **Ajouter, sur demande** : bouton « Ajouter au calendrier iPhone » sur le détail d'un événement et d'un rendez-vous.
  Calendrier cible au choix (défaut : calendrier par défaut de l'iPhone). L'alarme reprend le rappel HOMI du
  rendez-vous. Sont écrits : titre, heure, lieu, « Pour : prénom ». Les notes et les questions restent dans HOMI.
- **Suivre ce qui a été ajouté** : un lien local (identifiant HOMI ↔ identifiant de l'événement iOS) permet de dire
  « Déjà dans le calendrier », de signaler que l'élément HOMI a changé (« Mettre à jour »), de « Retirer », et de
  voir qu'un événement a été supprimé à la main dans l'app Calendrier (« Ajouter à nouveau » / « Oublier »).

## Pourquoi pas de synchronisation automatique dans les deux sens

- **Conflits** : le même événement modifié des deux côtés (ou par deux membres du foyer) n'a pas de « bonne »
  version. Trancher en silence, c'est faire perdre une modification à quelqu'un.
- **Doublons** : iCloud, Google et Exchange renumérotent parfois les événements ; un événement HOMI vu par un
  calendrier partagé reviendrait comme « nouveau » chez chaque membre, puis repartirait vers le foyer.
- **Fiabilité** : iOS ne réveille pas l'application à chaque changement de calendrier. Une synchronisation « de
  temps en temps » donne un agenda tantôt juste, tantôt faux, sans que l'on sache lequel.
- **Vie privée** : importer le calendrier personnel dans HOMI l'enverrait au serveur et au reste du foyer.

À la place : affichage direct depuis le téléphone (toujours exact, jamais copié), et écritures une par une, décidées
par l'utilisateur. L'export `.ics` et l'abonnement `webcal` existants restent le moyen d'avoir tout l'agenda du foyer
dans un autre calendrier.

## Règles tenues par le code (`service.ts`, testées)

1. HOMI ne modifie ni ne supprime jamais un événement qu'il n'a pas créé : il faut un lien local **et** que
   l'événement relu porte encore la marque HOMI du même élément (son lien `homi://calendar?ref=…`).
2. Un événement créé par HOMI n'est modifié ou retiré que par « Mettre à jour » ou « Retirer ».
3. Jamais deux fois le même élément : lien local, verrou pendant l'écriture, et une erreur de relecture n'est jamais
   prise pour une suppression.
4. Rien de ce qui est lu sur l'iPhone n'est enregistré ni envoyé. Stockage local (`toietmoi.deviceCalendar.v1`,
   effacé avec le compte) : calendriers choisis, calendrier cible, liens (identifiants + empreinte, sans titre ni
   lieu). Les événements lus ne passent pas par le cache React Query.

## Choix techniques

- **Autorisations** : `NSCalendarsFullAccessUsageDescription` (iOS 17+) et `NSCalendarsUsageDescription` (iOS 16),
  dans les 5 langues. Pas de clé Rappels. HOMI demande l'accès complet ; l'état « ajout uniquement » (choisi dans
  Réglages) est reconnu : ajout possible, mais ni lecture, ni vérification, ni mise à jour, ni retrait.
  Android : `READ_CALENDAR` / `WRITE_CALENDAR` sont bloquées, la fonction est inerte hors iPhone et en démonstration.
- **Fuseaux** : instants absolus + fuseau IANA explicite (celui de l'événement, sinon celui du téléphone).
- **Journée entière** : le jour est lu dans le fuseau où l'heure enregistrée est minuit, puis écrit de minuit à
  23:59:59 du téléphone, sans fuseau attaché — pas de décalage d'un jour.
- **Récurrences** : chaque jour, chaque semaine, chaque mois du 1er au 28 sont exportées en série. Chaque mois le
  29, 30 ou 31, ou un type inconnu : seule l'occurrence touchée (sinon la prochaine) est exportée, et l'écran le dit.
- **Deux API d'expo-calendar** : l'API objet pour les autorisations, les calendriers et la création ; l'API
  `expo-calendar/legacy` pour lire une plage et relire / modifier / supprimer par identifiant (elle relit
  l'identifiant rendu à la création avec `calendarItem(withIdentifier:)`). À revoir à chaque montée de SDK.

## Limites connues

- Un changement dans HOMI n'arrive dans le calendrier qu'après « Mettre à jour ».
- Le lien est propre au téléphone : l'ajout fait sur un autre appareil n'est pas connu ici (s'il est visible par un
  calendrier partagé, il est reconnu à sa marque et n'est pas affiché en double).
- Tâches, relais de nuit et temps pour soi ne s'ajoutent pas au calendrier (export `.ics` / abonnement).
- Un rendez-vous dure une heure dans le calendrier (HOMI n'enregistre pas d'heure de fin).

## À tester sur iPhone (rien de natif n'est vérifiable ailleurs)

Compilation de développement ou TestFlight (pas Expo Go), iOS 17 ou plus récent, puis une fois sur iOS 16 si possible.

1. Première ouverture de « Calendrier iPhone » : état « Accès non demandé » ; le texte d'iOS est celui de la langue
   du téléphone (fr, en, de, es, it). Aucune demande pour les Rappels.
2. Refuser : état « Accès refusé », « Ouvrir les Réglages » ouvre la page de HOMI ; rien dans l'agenda.
3. Autoriser l'accès complet, revenir : la liste des calendriers apparaît sans relancer l'appli.
4. Choisir deux calendriers : leurs événements apparaissent (jour, semaine, mois, 30 jours, « Aujourd'hui ») avec
   « iPhone » et le nom du calendrier ; un appui ouvre le détail en lecture seule.
5. Événement iOS « toute la journée », sur plusieurs jours, répété, à cheval sur minuit : bons jours, bonnes heures.
6. Ajouter un événement HOMI horaire : présent une fois dans l'app Calendrier, bonne heure, bon lieu, lien `homi://`
   qui rouvre l'agenda. Il n'apparaît pas en double dans l'agenda HOMI.
7. Ré-appuyer, y compris très vite deux fois : « Déjà dans le calendrier », toujours un seul événement.
8. Journée entière : bon jour dans l'app Calendrier. Refaire après avoir changé le fuseau de l'iPhone
   (Réglages → Date et heure), avec un événement créé avant le changement.
9. Répétitions : chaque semaine avec date de fin (série complète, bonne fin) ; chaque mois le 31 (une seule date,
   message affiché) ; série traversant le changement d'heure (même heure avant et après).
10. Rendez-vous avec rappel 1 h / 3 h / la veille : alerte au bon moment ; sans rappel : aucune alerte.
11. Modifier l'événement dans HOMI : « Modifié depuis l'ajout » ; « Mettre à jour » corrige l'événement iOS, toute
    la série si répété. Passer de répété à non répété, puis d'horaire à journée entière : un seul événement à la fin.
12. « Retirer » : l'événement disparaît du calendrier, reste dans HOMI ; série : toutes les occurrences disparaissent.
13. Supprimer l'événement dans l'app Calendrier : HOMI affiche « supprimé » ; « Ajouter à nouveau » en recrée un seul.
14. Modifier à la main, dans l'app Calendrier, un événement ajouté par HOMI : HOMI ne le réécrit pas tout seul.
15. Vérifier qu'aucun événement personnel n'est modifié ou supprimé après tout ce qui précède.
16. Calendrier cible : en choisir un autre, ajouter ; puis supprimer ce calendrier dans l'app Calendrier et ajouter
    de nouveau (retour au calendrier par défaut, pas d'erreur). Calendrier en lecture seule : non proposé.
17. Réglages → HOMI → Calendriers → « Ajouter des événements uniquement » : état correspondant, ajout possible,
    agenda sans événements iPhone, pas de « Mettre à jour » ni « Retirer ». Puis « Aucun » : état refusé.
18. Calendriers iCloud, Google et Exchange : identifiants stables après une synchronisation (le lien tient toujours).
19. Mode démonstration : aucun bouton d'ajout, écran « Inactif en démonstration », aucune demande d'autorisation.
20. Hors ligne et mode avion : lecture et ajout fonctionnent (tout est local).
21. Suppression du compte : choix et liens effacés ; les événements déjà ajoutés restent dans le calendrier.
22. VoiceOver : les lignes « iPhone » annoncent calendrier, titre, heure et « lecture seule ».
