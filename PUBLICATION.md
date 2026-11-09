# Publication App Store et Google Play — Au fil de nous

> Préparé le 9 novembre 2026 à partir du code réel (lecture de `app.config.ts`, `eas.json`, `src/config/brand.json`,
> `assets/`, des écrans et des fonctions serveur). **Rien n'a été soumis, aucune console n'a été ouverte, aucun réglage
> de production n'a été modifié.** Ce document complète `docs/APP_STORE_SOUMISSION.md` (2 novembre) et le remplace
> sur trois points : les **prix** (ce dernier indiquait encore 54,99 € / 99,99 €), l'**abonnement « Assistant IA »** et
> **Google Play**.
>
> Légende : **[fait]** vérifié dans le code · **[David]** à faire par David (console, juriste, compte, téléphone) ·
> **[à vérifier]** à contrôler sur une vraie build ou dans la console · **[code]** à corriger dans le code (agent principal).
> Rien de ce qui dépend d'un iPhone ou d'un Android réel n'a été testé ici : **NON VÉRIFIÉ sur appareil**.

---

## 0. Bloquants avant tout envoi en revue

| # | Point | Qui |
|---|---|---|
| B1 | **URL publique de la politique de confidentialité** (obligatoire chez Apple et Google). La page existe dans l'appli (`/legal/privacy`) mais aucun site public n'est configuré. | [David] |
| B2 | **URL de support** (Apple) et **adresse e-mail de contact** publique (Google). E-mail connu : celui de `src/config/brand.json`. | [David] |
| B3 | **CGU et politique marquées « Brouillon — à valider par un juriste »** et « coordonnées à compléter » (responsable du traitement). Apple refuse les contenus provisoires (règle 2.1) ; le RGPD exige l'identité du responsable. | [David] + juriste |
| B4 | **Lien web de suppression de compte** (exigé par Google Play, rubrique « Sécurité des données ») : une page où l'on peut demander la suppression sans l'appli. | [David] |
| B5 | **Révocation « Se connecter avec Apple »** à la suppression du compte : `supabase/functions/delete-account` efface les données et le client RevenueCat, mais n'appelle pas l'API Apple de révocation des jetons, exigée pour les applis qui proposent Sign in with Apple. Nécessite une clé Apple (secret à créer). | [code] + [David] |
| B6 | **CGU sans l'abonnement « Assistant IA »** (voir § 4) et **politique de confidentialité incomplète sur l'assistant** (contexte facultatif envoyé, historique conservé). Textes proposés au § 4. | [David] + juriste |
| B7 | **Offre « Assistant IA » : mentions avant achat incomplètes** (règle Apple 3.1.2) — voir § 3.3. | [code] |
| B8 | **Compte de démonstration** sur la vraie base (Premium actif, données d'exemple) pour l'équipe de revue. | [David] |
| B9 | **Produits d'abonnement** créés dans App Store Connect et Google Play, « Prêts à soumettre », liés à RevenueCat (`ABONNEMENT.md`). Le produit `aufildenous_ai_monthly` n'y est pas encore décrit pas à pas (§ 3.3). | [David] |
| B10 | **Compte développeur** : Apple demande que les applis de **santé** soient publiées par une **organisation** (règle 5.1.1 ix), pas par un compte individuel. Google Play : un **nouveau compte personnel** doit faire un **test fermé (12 testeurs, 14 jours)** avant la production. Vérifier le type de compte de l'équipe `L5HM8RN2QD` et du compte Play. | [David] |

---

## 1. Identité technique (vérifiée dans le code)

| Élément | Valeur | État |
|---|---|---|
| Identifiant iOS (bundle id) | `fr.aufildenous.app` (`brand.json` → `app.config.ts`) | [fait] |
| Paquet Android | `fr.aufildenous.app` (même valeur) | [fait] |
| Nom affiché | `Au fil de nous` (14 caractères, sous la limite de 30) | [fait] |
| Version | `0.1.0` (`app.config.ts`). Une première version publique en `1.0.0` est plus lisible pour les utilisatrices ; décision de David. | [David] |
| Numéro de build | géré à distance par EAS (`appVersionSource: remote`, `autoIncrement: true` en production) — iOS et Android | [fait] |
| Équipe / appli App Store Connect | Team `L5HM8RN2QD`, ASC App ID `6827529809` (`eas.json`) | [fait] |
| Appareils | iPhone uniquement (`supportsTablet: false`), portrait. Apple teste parfois sur iPad en mode compatibilité. | [à vérifier] |
| Chiffrement | `ITSAppUsesNonExemptEncryption: false` — pas de question export à chaque build | [fait] |
| Manifeste de confidentialité Apple | `NSPrivacyTracking: false`, 4 API justifiées (UserDefaults, horodatage de fichiers, temps de démarrage, espace disque) | [fait] |
| Pistage / ATT | aucune demande ATT, aucun SDK publicitaire | [fait] |
| Sauvegarde Android | `allowBackup: false` (aucune copie des données intimes dans Google Drive) | [fait] |
| Clés publiques de build | `.env` local ne contient que Supabase et l'option Apple. Les clés publiques RevenueCat (`EXPO_PUBLIC_REVENUECAT_APPLE_KEY`, `…_GOOGLE_KEY`), Sentry et Google Maps doivent être dans les **variables d'environnement EAS « production »**, sinon les achats affichent « indisponible ». | [à vérifier] |

### 1.1 Icône et écran de démarrage

| Fichier | Taille | Transparence | État |
|---|---|---|---|
| `assets/icon.png` (iOS + défaut) | 1024 × 1024 | **aucune** (RGB) — conforme Apple | [fait] |
| `assets/android-icon-foreground.png` | 1024 × 1024 | oui (normal pour l'icône adaptative) | [fait] |
| `assets/android-icon-background.png` | 1024 × 1024 | aucune | [fait] |
| `assets/android-icon-monochrome.png` | 1024 × 1024 | oui (icône thématique Android 13+) | [fait] |
| `assets/splash-icon.png` | 1024 × 1024, affiché à 180 px | oui ; fond `#F2DDD8` (clair) / `#1F2344` (sombre) | [fait] |

- Le dessin de l'icône adaptative occupe environ 64 % de la largeur : les extrémités peuvent être rognées par les
  masques ronds de certains lanceurs (zone sûre ≈ 61 %). **[à vérifier sur appareil]**
- Google Play demande en plus une **icône 512 × 512** (PNG 32 bits) et une **image de présentation 1024 × 500** pour la fiche. **[David]**

### 1.2 Autorisations

**iOS (Info.plist calculé par `npx expo config --type introspect`, exécuté le 9/11)**

| Clé | Fonction réelle dans le code | Langues |
|---|---|---|
| `NSCameraUsageDescription` | scanner de produits, document, test du cycle, photo de profil, album (`ScanFlow`, `cycleTests`, `documents/io`, `hooks-profilePhoto`) | FR EN ES DE IT |
| `NSPhotoLibraryUsageDescription` | ajout d'une image choisie (mêmes écrans + `AddDaySheet`) | FR EN ES DE IT |
| `NSFaceIDUsageDescription` | verrouillage du suivi du cycle (`cycle3/ui.tsx`) | FR EN ES DE IT |
| `NSLocationWhenInUseUsageDescription` | « Près de chez moi » / sorties, à la demande (`TownPicker`) ; aucune position en arrière-plan | FR EN ES DE IT |
| `NSMotionUsageDescription` | **jamais demandée** ; clé ajoutée par `expo-location` (code embarqué). Remplacée par un texte clair au lieu du texte anglais par défaut | FR EN ES DE IT |
| Notifications | demandées par `src/lib/notifications.ts` (pas de texte Info.plist sur iOS) | — |
| `NSMicrophoneUsageDescription` | **absente volontairement** (`microphonePermission: false`) : aucune vidéo, aucun son. Si App Store Connect renvoie l'avertissement ITMS-90683 « Missing purpose string » au premier envoi, ajouter un texte clair plutôt que de retirer le module. | [à vérifier au 1er envoi] |
| `NSLocalNetworkUsageDescription` | ajoutée par `expo-dev-client` (texte anglais de l'outil de développement). Sans effet en production, mais visible dans l'Info.plist. | [à vérifier] |

**Correction faite le 9/11** : les textes d'autorisation iOS sont maintenant traduits dans les 5 langues
(`locales` dans `app.config.ts` → fichiers `InfoPlist.strings` générés par EAS). Avant, seul le français existait.

**Android (liste calculée par la même commande)** : `CAMERA`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`,
`USE_BIOMETRIC`, `USE_FINGERPRINT`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `READ_EXTERNAL_STORAGE`,
`WRITE_EXTERNAL_STORAGE`, `INTERNET` (+ celles des bibliothèques : facturation Google Play, démarrage pour les rappels…).
Pas de localisation en arrière-plan, pas de micro, pas de contacts.

- `SCHEDULE_EXACT_ALARM` : rappels de médicaments et de biberons à l'heure choisie. Sur Android 14+, l'autorisation est
  refusée par défaut ; si la console Play affiche un formulaire « alarmes exactes », le justifier par ces rappels. **[à vérifier]**
- `READ/WRITE_EXTERNAL_STORAGE` : ajoutées par les modules photo/fichiers pour les anciens Android (≤ 12). Sans effet
  sur Android 13+. Contrôler le manifeste fusionné de la build (`aapt dump permissions`). **[à vérifier]**

---

## 2. Exigences des boutiques — état dans l'appli

| Exigence | Où / comment | État |
|---|---|---|
| **Suppression du compte dans l'appli** (Apple 5.1.1 v) | Onglet **Profil › Mon compte privé › Supprimer mon compte** (aussi Réglages › Mon compte). Double confirmation (mot à taper), fonction serveur `delete-account` : données, fichiers privés, photos de l'album, client RevenueCat. Le texte rappelle que supprimer ≠ résilier. | [fait] — révocation Apple : B5 |
| **Restauration des achats** | Bouton « Restaurer mes achats » sur l'écran Premium (`Paywall`, `pw-restore`) et dans Profil › Abonnement | [fait] |
| **Prix, durée, renouvellement affichés avant achat** (Apple 3.1.2) — Premium | `PlanTerms` : montant de la boutique, période, essai seulement si la boutique le propose, date du 1er prélèvement, renouvellement automatique, résiliation 24 h avant, liens CGU + confidentialité sous le bouton | [fait] |
| idem — **Assistant IA** | `AiOfferCard` : prix de la boutique dans le bouton, mais « 1 mois offert » affiché **sans vérifier l'éligibilité**, et le texte sous le bouton ne dit pas que l'abonnement **se renouvelle automatiquement** | **[code] B7** |
| **Liens CGU / confidentialité** | Inscription (case à cocher), écran Premium, Abonnement, Réglages | [fait] — URL publiques : B1 |
| **Contenus des utilisateurs** (Apple 1.2) | Charte acceptée avant de créer son profil communautaire ; signalement (7 motifs) des publications, commentaires et membres ; **blocage** d'un membre + liste « Membres bloqués » (déblocage) ; masquage automatique après 3 signalements ; filtre de mots/expressions côté serveur (`moderation_terms` : relecture ou blocage) ; file de modération dans l'écran Admin (rôle modérateur revérifié par le serveur) ; suspension possible ; publications avec plusieurs liens relues avant affichage | [fait] — **délai de traitement des signalements à définir et à tenir** [David] |
| **Mention santé** | CGU « ne remplace en aucun cas l'avis d'un professionnel de santé » ; case d'inscription ; chaque réponse IA (« Réponse générée par une IA… ne remplace pas un professionnel ») ; numéros d'urgence gratuits sans compte ; fenêtre fertile : « ce n'est pas une méthode de contraception » | [fait] |
| **IA : information et accord** (Apple 5.1.2 i, IA tierce) | Écran « Avant de commencer » : questions envoyées à **Google Gemini** (service externe nommé), situation transmise seulement si on l'active conversation par conversation, jamais de prénom ni de document ; accord enregistré (`ai_assistant`) ; historique désactivable | [fait] — politique à compléter (B6) |
| **Âge minimum** | CGU : 18 ans ou plus | [fait] |
| **Chiffrement export** | déclaré | [fait] |
| **Pas de publicité, pas de pistage** | aucun SDK publicitaire ; l'option « mesure d'audience » des réglages n'envoie rien aujourd'hui (aucun outil branché) | [fait] |

Contrôle navigateur du 9/11 (version web de développement, démonstration, français, 390 × 844) : textes présents sur
Réglages › Mon compte (« Supprimer mon compte »), Abonnement et Premium (« Restaurer mes achats », « Renouvellement
automatique », liens Conditions / confidentialité, carte « Assistant IA »), CGU, politique (« Intelligence
artificielle », « Gemini »), charte de la communauté (« Signaler, bloquer », « Modération »), assistant
(« professionnel »), urgences (15, 112). Aucun achat réel ni StoreKit / Google Billing : **NON VÉRIFIÉ sur appareil**.

---

## 3. Abonnements (configuration réelle du code)

### 3.1 Premium (un seul droit RevenueCat `AU_FIL_DE_NOUS_PREMIUM`, un seul groupe Apple)
| Produit | Prix de référence France | Essai |
|---|---|---|
| `aufildenous_premium_monthly` | 10,99 € / mois | 3 jours (nouveaux abonnés, si la boutique l'accorde) |
| `aufildenous_premium_6months` | 49,99 € / 6 mois | aucun |
| `aufildenous_premium_annual` | 79,99 € / an | aucun |

L'appli affiche **toujours le prix de la boutique** ; la grille ci-dessus n'apparaît qu'en démonstration, signalée comme
telle. Procédure console complète : `ABONNEMENT.md`.

### 3.2 Restauration, annulation, expiration
Restauration : bouton dédié. Annulation : renvoi vers les réglages du store (« Gérer mon abonnement »). Après
expiration : données conservées, consultables, exportables (modèle « Premium strict » — `ABONNEMENT.md` § 0.1).
**NON VÉRIFIÉ sur appareil** (achat sandbox, renouvellement, échec de paiement, remboursement).

### 3.3 Assistant IA seul — à préparer
- Produit `aufildenous_ai_monthly`, droit `ASSISTANT_IA`, ~5 €/mois (grille de démonstration : 4,99 €), 250 questions/mois.
- **Décision David** : même groupe d'abonnements Apple que Premium (passer de l'IA au Premium remplace l'abonnement, mais
  l'éligibilité aux essais est commune au groupe) **ou** groupe séparé (essais indépendants, mais une personne peut payer
  les deux). Google : produit d'abonnement distinct.
- Le bouton annonce « 1 mois offert, puis X par mois » : il faut **créer l'offre de lancement « 1 mois gratuit »** dans
  les deux consoles, **et** [code] n'afficher « 1 mois offert » que si la boutique confirme l'éligibilité (comme pour le
  Premium), et compléter le texte sous le bouton : « Abonnement mensuel à renouvellement automatique, au prix affiché,
  sauf résiliation au moins 24 h avant la fin de la période, dans les réglages de votre compte App Store ou Google Play.
  Il ouvre l'assistant uniquement. » (fichiers réservés : `src/features/offers/ToolOffer.tsx`, `src/i18n/**`).

---

## 4. Écarts CGU / politique de confidentialité (`src/content/legal.ts`) — textes proposés

**Non modifiés** (textes juridiques à valider par David et un juriste ; à reporter dans les 5 langues).

1. **CGU — l'abonnement « Assistant IA » n'est pas mentionné.** Les sections « Abonnement » et « Prix, essai et
   renouvellement » ne parlent que du Premium. Section à ajouter après « Prix, essai et renouvellement » :
   > **Assistant IA** — Un abonnement mensuel séparé, « Assistant IA », ouvre uniquement l'assistant en ligne (jusqu'à
   > 250 questions par mois) ; il ne donne accès à aucune autre fonction Premium. Prix indicatif en France : 4,99 € par
   > mois ; le prix qui fait foi est celui affiché par votre store avant le paiement. Un mois gratuit peut être proposé
   > si votre store indique que vous y avez droit. Il se renouvelle automatiquement chaque mois, sauf résiliation au
   > moins 24 heures avant la fin de la période, dans les réglages de votre compte Apple ou Google. L'assistant est
   > déjà inclus dans le Premium.
   (Le prix exact est à confirmer par David : le cahier des charges dit « environ 5 € ».)
2. **Politique — « Intelligence artificielle » incomplète sur l'assistant.** Elle dit « vos questions, sans nom ni
   e-mail », mais ne dit pas : (a) que la question elle-même peut contenir des informations de santé ; (b) que, si vous
   activez « Utiliser ma situation », sont aussi envoyés : parcours, semaine de grossesse, âge des enfants en mois,
   semaines depuis l'accouchement, phase du cycle, moyennes des dernières 24 h (repas, sommeil, couches) et humeur
   moyenne sur 7 jours, ou le résumé chiffré du sommeil d'un enfant (sans prénom) — liste exacte de
   `supabase/functions/_shared/assistant-prompt.ts` ; (c) que les conversations sont **conservées dans votre espace
   privé** si vous activez « Garder mes conversations », et supprimables à tout moment. Phrase proposée :
   > Vos questions peuvent contenir des informations de santé : elles sont envoyées seulement avec votre accord
   > (« J'accepte d'utiliser l'assistant »). Si vous activez « Utiliser ma situation » pour une conversation, l'assistant
   > reçoit aussi des repères chiffrés (parcours, semaine de grossesse, âge des enfants en mois, phase du cycle, moyennes
   > des dernières 24 heures, humeur moyenne de la semaine), jamais de prénom, de date de naissance ni de document. Vos
   > conversations ne sont conservées que si vous activez « Garder mes conversations » ; vous pouvez les supprimer à tout
   > moment.
3. **Politique — base légale des données de santé envoyées à l'IA** : le texte cite le consentement explicite pour les
   données de santé en général ; préciser que l'envoi à Google Gemini repose sur le consentement « assistant »
   séparé, et indiquer le **lieu de traitement et la garantie de transfert hors UE** de Google (actuellement « à
   préciser par l'éditeur »). Vérifier aussi l'exigence d'hébergeur **HDS** (`docs/CONFORMITE_RGPD.md` § 2). [David + juriste]
4. Dates : politique « Octobre 2026 », CGU « Novembre 2026 » — mettre à jour au moment de la validation.
5. Chemin cité par les CGU (« Profil › Mon compte ») : dans l'appli actuelle, c'est **Profil › Mon compte privé**. Mineur.

---

## 5. Apple — « Confidentialité de l'app » (réponses proposées d'après le code)

**Pistage : NON.** Aucune donnée utilisée pour la publicité ni partagée avec des courtiers.

| Catégorie Apple | Type | Exemple dans l'appli | Liée à l'identité | Finalité |
|---|---|---|---|---|
| Coordonnées | Adresse e-mail | compte | Oui | Fonctionnalités de l'app |
| Coordonnées | Nom | prénom / pseudonyme affiché | Oui | Fonctionnalités de l'app |
| Santé et forme | Santé | cycle, symptômes, grossesse, post-partum, humeur, médicaments saisis, santé et croissance des enfants | Oui | Fonctionnalités de l'app |
| Informations sensibles | Informations sensibles | grossesse et naissance ; rapports sexuels (suivi facultatif, consentement séparé) | Oui | Fonctionnalités de l'app |
| Contenu utilisateur | Photos ou vidéos | photo de profil, album de l'enfant, photos de la communauté, photos de documents | Oui | Fonctionnalités de l'app |
| Contenu utilisateur | Autre contenu | publications, commentaires, notes, journal, questions à l'assistant | Oui | Fonctionnalités de l'app |
| Contenu utilisateur | Service client | formulaire « Donner mon avis » (texte, écran, version, plateforme) | Oui | Fonctionnalités de l'app (support) |
| Identifiants | Identifiant utilisateur | identifiant de compte (Supabase, RevenueCat) | Oui | Fonctionnalités de l'app |
| Identifiants | Identifiant d'appareil | jeton de notification Expo (prudence) | Oui | Fonctionnalités de l'app |
| Achats | Historique d'achats | abonnements | Oui | Fonctionnalités de l'app |
| Localisation | Localisation précise | « Près de chez moi », à la demande, envoyée au service de lieux, non enregistrée | Non | Fonctionnalités de l'app |
| Diagnostics | Données de plantage | Sentry, **seulement si configuré et accepté**, sans données personnelles | Non | Fonctionnalités de l'app |

Non collecté : contacts, historique de navigation ou de recherche, données financières, données d'utilisation /
analytique (aucun outil branché), performances (`tracesSampleRate: 0`), publicité.
Si un outil de mesure d'audience est branché plus tard, ces réponses doivent être mises à jour **avant** la version.

---

## 6. Google Play — « Sécurité des données » (réponses proposées)

- **Données chiffrées en transit** : Oui (HTTPS partout).
- **Suppression** : Oui, dans l'appli + **lien web à fournir (B4)**.
- **Partage avec des tiers** : Non. Supabase, Google Gemini, Google Places, RevenueCat, Expo, Resend et Sentry agissent
  comme **prestataires** pour le compte de l'éditeur (exclus du « partage » au sens Google). À confirmer avec les
  contrats (DPA). [à vérifier]

| Catégorie Google | Type | Collecté | Facultatif | Finalité |
|---|---|---|---|---|
| Infos personnelles | Adresse e-mail | Oui | Non | Gestion du compte, fonctionnalités |
| Infos personnelles | Nom | Oui | Oui | Fonctionnalités |
| Infos personnelles | ID utilisateur | Oui | Non | Gestion du compte, fonctionnalités |
| Santé et remise en forme | Infos de santé | Oui | Oui (consentement) | Fonctionnalités |
| Photos et vidéos | Photos | Oui | Oui | Fonctionnalités |
| Fichiers et documents | Fichiers et documents | Oui | Oui | Fonctionnalités |
| Activité dans l'appli | Autres contenus générés | Oui (publications, commentaires, questions à l'assistant, avis) | Oui | Fonctionnalités |
| Position | Position exacte et approximative | Oui, **traitée de façon éphémère** | Oui | Fonctionnalités |
| Infos financières | Historique des achats | Oui | Oui | Fonctionnalités, gestion du compte |
| Infos et performances de l'appli | Journaux de plantage | Oui, seulement si accepté | Oui | Analyse / stabilité |
| Appareil ou autres ID | ID d'appareil | Oui (jeton de notification) | Oui | Fonctionnalités |

**Autres déclarations Play Console (« Contenu de l'application »)** [David] :
- **Applications de santé** : cocher suivi des règles / fertilité, grossesse, rappels de médicaments, santé mentale
  (humeur), suivi des enfants ; préciser qu'il ne s'agit **pas** d'un dispositif médical.
- **Public cible** : 18 ans et plus (pas le programme Famille).
- **Annonces** : Non. **Accès à l'appli** : instructions + compte de démonstration (§ 8).
- **Applis gouvernementales / financières** : Non.

---

## 7. Classification par âge (proposition)

**Apple (questionnaire 2025, tranches 4+ / 9+ / 13+ / 16+ / 18+)**
- Informations médicales ou de traitement : **Fréquentes**
- Thèmes santé et bien-être : **Oui**
- Contenu sexuel / nudité : **Aucun** (informations de santé sexuelle et contraception, non explicites : **Rares** si la question est posée)
- Contenu généré par les utilisateurs : **Oui** (communauté modérée, signalement, blocage)
- Messagerie / discussion entre utilisateurs : **Non** pour la messagerie privée (aucune) ; préciser les **rencontres de
  groupe dans des lieux publics** proposées par des membres (`community_meetups`)
- Publicité : **Non** · Accès web libre : **Non** · Jeux d'argent, violence, alcool, drogues : **Non**
- Résultat attendu : probablement **16+** ; choisir **18+** si la console le permet, pour rester cohérent avec les CGU. [à vérifier]

**Google (questionnaire IARC)** : catégorie « Référence, actualités ou éducation » / santé ; contenu généré par les
utilisateurs : Oui ; partage de position avec d'autres utilisateurs : Non. Résultat attendu PEGI 12 à 16 selon la
réponse « sexualité ». Public cible : 18+. [à vérifier]

---

## 8. Notes pour l'équipe de revue (à coller dans les consoles)

**App Store Connect › Informations pour la revue** (en anglais) :

> Au fil de nous is a French-language companion app for parents: cycle tracking, week-by-week pregnancy follow-up,
> baby and child tracking (feeds, sleep, growth, medication reminders entered from the user's own prescription),
> a sourced health library and a moderated community. It provides general information only: it does not diagnose,
> does not calculate doses and always refers to a doctor or midwife. Emergency numbers are reachable without an account.
>
> **Demo account** (Premium active, sample family): e-mail `[à fournir]` / password `[à fournir]`. You can also tap
> "Découvrir sans compte" on the first screen to explore sample data stored only on the device (purchases are simulated
> there and clearly labelled "démonstration"; real purchases use StoreKit with the demo account).
>
> **Account deletion**: Profil tab › "Mon compte privé" › "Supprimer mon compte" (also Réglages › Mon compte).
>
> **Subscriptions**: "Au fil de nous Premium" — three auto-renewable plans in one group with identical content
> (monthly with a 3-day free trial for new subscribers, 6 months, 12 months), plus a separate monthly "Assistant IA"
> subscription that unlocks only the AI assistant. Prices are read from the App Store. "Restaurer mes achats" is on the
> Premium screen and in Profil › Abonnement.
>
> **AI assistant**: uses Google Gemini through our server, only after explicit in-app consent that names the provider;
> the user's situation is shared only if they enable it per conversation; no name, birth date or document is sent.
>
> **User-generated content**: community rules must be accepted before posting; every post, comment and member can be
> reported (7 reasons) and blocked; content is hidden automatically after 3 reports and reviewed by a moderator; a
> keyword filter holds risky posts for review.
>
> Health data is never used for advertising; there is no tracking.

**Google Play › Accès à l'application** : mêmes identifiants et mêmes chemins.

**Contact revue** : prénom, nom, téléphone **[David]** · e-mail : celui de `brand.json`.

---

## 9. Textes de fiche proposés (français — sans promesse médicale)

- **Nom** : `Au fil de nous` (14/30)
- **Sous-titre Apple** (30 max) : `Cycle, grossesse et famille` (27)
- **Description courte Google** (80 max) : `Cycle, grossesse, bébé et enfants : un carnet privé pour toute la famille.` (74)
- **Mots-clés Apple** (100 max) : `règles,ovulation,bébé,biberon,sommeil,allaitement,maternité,parents,enfant,suivi,couches,naissance` (98)
- **Catégorie** : Santé et forme (Apple) / Santé et remise en forme (Google) ; secondaire Apple : Style de vie
- **Texte promotionnel Apple** (170 max) : `Du cycle à la vie de famille : un seul carnet, privé, à partager avec votre co-parent. Sans publicité, sans revente de données.`

**Description longue**

Au fil de nous vous accompagne à chaque étape de votre histoire : suivre votre cycle, attendre un enfant, puis veiller
sur bébé et sur les plus grands — seule, seul ou à deux.

SUIVRE MON CYCLE
Un calendrier clair et la saisie de votre journée en quelques secondes. Les dates calculées sont des estimations : elles
ne constituent pas une méthode de contraception.

GROSSESSE
Semaine après semaine : repères issus de sources publiques, rendez-vous, préparation de la naissance. Grossesses
multiples prises en charge.

BÉBÉ ET ENFANTS
Biberons, repas, sommeil, couches, croissance, vaccins et rappels de traitements tels que vous les avez notés. À
plusieurs dans le foyer, chacun avec ses droits.

UNE BIBLIOTHÈQUE SOURCÉE
Des articles rédigés à partir de sources publiques (Assurance Maladie, Santé.fr, Santé publique France…), avec leurs
références.

UN ASSISTANT POUR PRÉPARER VOS QUESTIONS
Un assistant d'information, fondé sur une intelligence artificielle, aide à comprendre et à préparer un rendez-vous.
Il ne pose pas de diagnostic et vous oriente vers un professionnel. Il n'est utilisé qu'avec votre accord.

UNE COMMUNAUTÉ BIENVEILLANTE
Questions, témoignages et groupes, sous pseudonyme, avec une charte, un signalement et une modération.

VOTRE VIE PRIVÉE D'ABORD
Aucune publicité, aucune revente de données. Verrouillage par Face ID, notifications discrètes, export et suppression
de vos données à tout moment.

AU FIL DE NOUS PREMIUM
Les fonctions de suivi et d'accompagnement font partie de Premium : trois formules au même contenu (mensuelle avec
3 jours d'essai pour les nouveaux abonnés, 6 mois, 12 mois). Un abonnement « Assistant IA » seul est aussi proposé.
Les prix sont affichés dans l'application avant tout achat. Les abonnements se renouvellent automatiquement sauf
résiliation au moins 24 heures avant la fin de la période, dans les réglages de votre compte App Store ou Google Play.
Sans abonnement, vous gardez l'accès à votre compte, à vos données (consultation, export, suppression), aux numéros
d'urgence et aux alertes de rappel de produits.
Conditions d'utilisation : [URL] — Politique de confidentialité : [URL]

Au fil de nous ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien. En cas d'urgence, appelez le
15 ou le 112.

> Ne pas écrire de prix dans la description (ils varient selon les pays) ; ne jamais employer « diagnostic »,
> « prédiction fiable », « contraception naturelle », « détecte » ou « garantit ».
> L'appli existe aussi en anglais, espagnol, allemand et italien : fiches dans ces langues à traduire depuis ce texte. [David]

---

## 10. Captures d'écran à faire

Formats : **iPhone 6,9 pouces (1320 × 2868)** obligatoire ; Google Play : 2 à 8 captures téléphone (16:9 ou 9:16,
1080 × 1920 conseillé) + image de présentation 1024 × 500 + icône 512 × 512. Sept brouillons web existent déjà dans
`store/captures-brouillon/` (1320 × 2868, 2 novembre) : **à refaire** sur simulateur iOS / émulateur Android à partir
de la build de production, avec la barre d'état réelle, le compte de démonstration et **sans** bandeau « Démonstration ».

1. Bienvenue — « À chaque étape de votre histoire » et le fil doré des étapes de vie.
2. Accueil personnalisé (journée du jour, prochain rappel).
3. Cycle — calendrier et saisie rapide de la journée (mention « estimation » visible).
4. Grossesse — semaine en cours, repères sourcés.
5. Bébé — biberons / sommeil de la journée.
6. Bibliothèque sourcée (article avec ses sources).
7. Communauté — fil avec pseudonymes (aucun visage d'enfant, aucune donnée réelle).
8. Confidentialité — verrouillage, export et suppression des données.
9. Premium — les formules **avec les prix de la boutique** (sandbox), conditions et « Restaurer mes achats » visibles.
10. (Revue Apple seulement, capture du produit d'abonnement) : écran Premium ; écran « Assistant IA » pour le produit IA.

Aucune capture ne doit montrer de promesse médicale, de faux avis, de données d'une vraie personne ni de prix inventé.

---

## 11. Checklist récapitulative

### App Store
- [x] Bundle id, nom, icône sans transparence, écran de démarrage clair/sombre — fait
- [x] Textes d'autorisation justifiés, en 5 langues — fait (9/11)
- [x] Manifeste de confidentialité, pas de pistage, chiffrement déclaré — fait
- [x] Suppression de compte dans l'appli — fait · [ ] révocation Sign in with Apple — code (B5)
- [x] Restauration des achats, conditions Premium avant achat, liens légaux — fait
- [ ] Conditions de l'offre « Assistant IA » avant achat — code (B7)
- [x] Signalement, blocage, filtre, modération — fait · [ ] délai de traitement des signalements — David
- [x] Mention « ne remplace pas un professionnel », urgences — fait
- [x] Accord explicite avant l'envoi à une IA tierce nommée — fait
- [ ] CGU (Assistant IA) et politique (contexte IA, historique, transferts) complétées et validées, brouillon retiré — David + juriste
- [ ] URL confidentialité, URL support, copyright (éditeur) — David
- [ ] Compte organisation (appli de santé) — David, à vérifier
- [ ] Produits Premium + IA « Prêts à soumettre », offre de lancement, notifications serveur → RevenueCat — David
- [ ] Questionnaire d'âge, confidentialité de l'app (§ 5) saisis — David
- [ ] Compte de démonstration — David
- [ ] Build TestFlight, test sandbox (achat, essai, restauration, annulation) — David, **NON VÉRIFIÉ sur appareil**
- [ ] Captures 6,9 pouces — David
- [ ] Avertissement ITMS-90683 (micro) éventuel au premier envoi — à vérifier

### Google Play
- [x] Paquet, nom, icône adaptative + monochrome, `allowBackup: false` — fait
- [x] Permissions limitées, pas de position en arrière-plan — fait · [ ] manifeste fusionné et alarmes exactes — à vérifier
- [ ] Sécurité des données (§ 6), lien web de suppression — David
- [ ] Déclaration « Applications de santé », public cible 18+, annonces : non — David
- [ ] Questionnaire IARC — David
- [ ] Abonnement Premium (3 offres de base, essai 3 jours sur le mensuel) + abonnement IA, notifications RTDN → RevenueCat — David
- [ ] Test fermé 12 testeurs / 14 jours si compte personnel récent — David
- [ ] Fiche : description courte, longue, icône 512, image 1024 × 500, captures — David
- [ ] Test de bout en bout sur un vrai Android (achat de test, rappels, notifications) — **NON VÉRIFIÉ sur appareil**
