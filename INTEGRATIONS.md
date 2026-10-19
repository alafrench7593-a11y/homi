# Registre des intégrations — Toi & Moi

Dernière mise à jour : 18 octobre 2026. Ce registre fait foi : une intégration n'est dite « fonctionnelle » que si elle a été testée, et on indique **comment**.

**Légende des statuts**
- ✅ **Fonctionnelle et testée** : code en place, tests automatisés au vert (tests SQL sur PostgreSQL 16, tests Deno des fonctions serveur, tests Jest, parcours navigateur contre un faux Supabase).
- 🔧 **Code implémenté, configuration manquante** : il ne manque que des clés ou réglages dans un tableau de bord externe (listés ici).
- 📚 **Étudiée, non intégrée** : raison et prochaine étape indiquées.
- ⛔ **Indisponible ou non adaptée**.

> Limite de l'environnement de développement : il n'a pas accès à Internet, hormis les registres de paquets. Aucun appel n'a donc été fait vers les **services réels** (Open Food Facts, Google, Resend…). Les intégrations sont testées avec des transports simulés, conformes à la documentation officielle. Une **vérification en production** reste à faire après déploiement : voir « Mise en service » en fin de document.

Secrets : uniquement côté serveur (`supabase secrets set …`), jamais dans l'application. Les noms de variables sont dans `.env.example`. Ne collez jamais une clé dans une discussion.

---

## 1. Supabase — base de données, authentification, droits, stockage, fonctions, temps réel
| | |
|---|---|
| Fonction | PostgreSQL + politiques RLS (foyer, enfant, personne), Auth (e-mail, Apple, Google), Storage privé, Edge Functions (Deno), Realtime |
| Documentation | https://supabase.com/docs |
| Outils concernés | Tous |
| Statut | ✅ Base, droits et fonctions : 476 vérifications SQL, 29 tests Deno, 526 tests Jest, parcours e2e (inscription, agenda, temps réel). 🔧 Projet réel à créer et migrer |
| Variables | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publiques), `SUPABASE_SERVICE_ROLE_KEY` (secret serveur) |
| Coût | Offre gratuite puis payante selon l'usage (voir supabase.com/pricing) |
| Limites | Realtime : quotas de connexions et de messages selon l'offre |

**Synchronisation temps réel (nouveau)** — `src/lib/sync.ts`, migration `20261019001000_realtime_sync.sql`
- Les tables partagées du quotidien sont publiées dans Realtime : biberons, tétées, tire-lait, changes, sommeils, repas, observations, mesures, minuteurs, rendez-vous, tâches, relais et temps pour soi, demandes, événements, listes. Les notifications aussi, filtrées par personne.
- Ne sont **jamais publiées** : humeur, post-partum, cycle, documents, conversations, liens d'agenda, cache produits. Un test SQL le vérifie.
- Abonnement filtré par foyer, avec la RLS appliquée par Realtime. Une rafale de changements (un planning de 7 nuits) déclenche une seule relecture.
- Au retour dans l'application et au retour du réseau, les données périmées sont relues. Les saisies hors connexion partent à la reconnexion (mécanisme existant).
- Test e2e `e2e/temps_reel.py` : un coparent ajoute une tâche → elle apparaît chez l'autre parent sans action. Rien ne change tant que le serveur n'a rien annoncé.

## 2. Open Food Facts · Open Beauty Facts · Open Products Facts
| | |
|---|---|
| Fonction | Fiche produit par code-barres et recherche par nom : nom, marque, ingrédients, allergènes déclarés, **traces (nouveau)**, nutrition, image |
| Documentation | https://openfoodfacts.github.io/documentation/ (API v2) |
| Outils concernés | Scanner (aliments, cosmétiques, produits), historique, comparaison, surveillance des rappels |
| Statut | ✅ Code et tests (transport simulé). 🔧 `OPENFOODFACTS_USER_AGENT` à définir : sans lui, **aucun appel** |
| Licence | Base sous ODbL, contenus DbCL, images CC BY-SA : la source est affichée sur chaque fiche |
| Limites officielles | 15 lectures/min/IP, 10 recherches/min/IP, User-Agent `NomApp/Version (contact)` obligatoire |
| Coût | Gratuit |

Améliorations du 18 octobre :
- **Cache serveur** (`open_facts_cache`, accès serveur uniquement) : fiche trouvée 7 jours, absente 1 jour, recherche 1 jour. La date de récupération d'origine est conservée et affichée.
- **Quota global** sous les limites officielles (12 lectures et 8 recherches par minute), car nos appels partent d'adresses serveur partagées.
- **Une panne n'est plus un « produit introuvable »** : on distingue base indisponible, base saturée, fiche ancienne (servie depuis le cache avec sa date) et produit réellement absent.
- Tests : `_shared/open-facts-cache_test.ts` (6 cas Deno).

**Fiabilité des allergènes (corrigée)** — `supabase/functions/_shared/allergens.ts`, partagé par l'application et le serveur
- **Bug corrigé** : Open Food Facts renvoie `en:milk`, `en:peanuts`… alors que les allergies du profil sont saisies en français (« lait », « arachide »). La correspondance échouait. Elle passe maintenant par les 14 allergènes réglementaires (règlement UE 1169/2011), avec synonymes en français et en anglais.
- Trois niveaux : **identifié** (déclaré ou dans les ingrédients), **possible** (traces, « peut contenir ») et **vérification impossible** (données manquantes, ce qui abaisse le niveau de certitude).
- Jamais « sans risque ». Faute de correspondance, l'application rappelle que rien n'est garanti et qu'il faut vérifier l'emballage.
- Faux positifs évités : beurre de cacao, lait de coco, noix de coco, noix de muscade.
- Tests : 9 tests Jest (`allergens.test.ts`) et 1 dans `scanner.test.ts`.

## 3. RappelConso (rappels officiels de produits)
| | |
|---|---|
| Fonction | Rappels de produits pour un code-barres ou une marque et un nom ; surveillance de l'historique et des favoris |
| Documentation | https://data.economie.gouv.fr (jeu `rappelconso-v2-gtin-espaces`) |
| Statut | ✅ Code et 4 tests Deno (schémas v2.1 et ancien, panne → « non vérifié », jamais « aucun rappel ») |
| Variables | `RAPPELCONSO_ENABLED` (défaut vrai), `RAPPELCONSO_DATASET` — sans clé |
| Coût | Gratuit (Licence Ouverte) |

## 4. OMS — Standards de croissance de l'enfant (nouveau)
| | |
|---|---|
| Fonction | Repères de croissance de 0 à 60 mois : poids, taille (couchée jusqu'à 2 ans, debout ensuite), périmètre crânien, IMC. Position d'une mesure (z-score, centile) et courbes 3e/15e/50e/85e/97e centiles |
| Documentation | https://www.who.int/tools/child-growth-standards |
| Forme | **Pas d'API** : l'OMS publie des tables. Elles sont intégrées comme données statiques (`src/content/whoGrowth.ts`, générées par `scripts/build-who-growth.py` depuis les tables officielles redistribuées par pygrowup, UNICEF, licence BSD). Fonctionne hors connexion, aucune donnée envoyée |
| Statut | ✅ Les 3 416 valeurs publiées (8 tables × 61 mois × 7 écarts-types) sont reproduites à l'arrondi près ; méthode LMS de l'OMS avec z-score restreint au-delà de ±3 ; 8 tests Jest et vérification en navigateur |
| Outils | Profil enfant › Croissance (interrupteur « Afficher les repères de l'OMS », activé par défaut) |
| Limites | 0–5 ans seulement : la référence OMS 2007 (5–19 ans) n'est pas intégrée. Au-delà, le carnet de santé est indiqué. Les courbes françaises 2018 (AFPA–CRESS/Inserm) du carnet peuvent différer : c'est écrit à l'écran. Formulations neutres, aucun diagnostic. Hors du 3e–97e centile : « à montrer au professionnel qui suit l'enfant » |

## 5. Agenda — export, abonnement, Google, Microsoft, Apple
| Intégration | Statut |
|---|---|
| **Export .ics** (RFC 5545) | ✅ Existant (rendez-vous privés exclus, titres de santé neutres par défaut) |
| **Abonnement iCalendar** (nouveau) : un lien secret que Google Agenda, Apple Calendrier et Outlook consultent régulièrement | ✅ Code + tests. 🔧 Fonction `calendar-feed` à déployer (`verify_jwt = false`, déjà déclaré) |
| Google Calendar API (synchronisation dans les deux sens) | 📚 Étudiée, non intégrée |
| Microsoft Graph Calendar | 📚 Étudiée, non intégrée |
| Apple Calendar (iCloud) | ⛔ Pas d'API serveur publique : l'abonnement iCalendar est la voie prise en charge |

Abonnement iCalendar : `supabase/functions/calendar-feed`, migration `20261019000800_calendar_feeds.sql`, écran Agenda › « S'abonner depuis un autre agenda ».
- **Jeton** : 32 octets aléatoires, montré une seule fois. La base n'en garde que l'empreinte SHA-256, illisible depuis l'application. Le lien est révocable et cesse de fonctionner si la personne quitte le foyer ; 5 liens actifs au plus ; 60 requêtes par heure et par lien.
- **Droits de la personne propriétaire du lien** :
  - rendez-vous de santé seulement si elle a le droit de les voir ; ses propres rendez-vous privés seulement ;
  - temps pour soi des autres jamais inclus ;
  - titres de santé neutres (« Rendez-vous », sans lieu) sauf choix explicite ;
  - aucune note.
- **Fuseau** : récurrences en heure de Paris (TZID + VTIMEZONE) ; journées entières au bon jour même si le serveur tourne en UTC ; `REFRESH-INTERVAL` d'une heure suggéré.
- **Tests** : 16 vérifications SQL (45), 5 tests Deno (`calendar-feed_test.ts`), parcours e2e `e2e/agenda_abonnement.py` (création, affichage unique, liste sans jeton, révocation).
- **Limite** : sens unique. Chaque agenda actualise un abonnement à son propre rythme (de quelques minutes à plusieurs heures) : c'est écrit à l'écran.

Pourquoi pas encore Google ou Microsoft en deux sens :
- **Google** : la lecture d'événements Google Agenda est citée par Google comme exemple de scope « sensible ». Il faut une application OAuth vérifiée : domaine vérifié, politique de confidentialité, vidéo de démonstration, 3 à 5 jours ouvrés (https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).
- **Microsoft** : il faut une application Entra ID (permission déléguée `Calendars.ReadWrite`, https://learn.microsoft.com/en-us/graph/api/resources/calendar-overview).
- **Dans les deux cas** : stocker des jetons de rafraîchissement chiffrés côté serveur, puis gérer les conflits et doublons dans les deux sens.
- **Prochaine étape** : fonctions `calendar-oauth` et `calendar-sync`, une table de jetons chiffrés, et un identifiant externe par événement contre les doublons. À faire une fois les applications OAuth créées.

## 6. Notifications
| Intégration | Statut |
|---|---|
| **Notifications locales** (expo-notifications) : minuteur biberon, rendez-vous, rappels | ✅ Existant. Fonctionnent sans réseau, indépendantes des animations ; jamais présentées comme une alarme garantie |
| **Push serveur** via le service Expo Push (qui s'appuie sur FCM et APNs) : réponses, relais, rappels de produits | 🔧 Code existant (`send-push`). À configurer : `EXPO_ACCESS_TOKEN`, `PUSH_WEBHOOK_SECRET`, un *Database Webhook* sur `INSERT public.notifications`, et les identifiants FCM et APNs dans EAS |
| Firebase Cloud Messaging en direct | ⛔ Non nécessaire : Expo Push l'utilise déjà pour Android ; un client FCM direct doublonnerait |
| **Notifications de relais de nuit** (nouveau, migration `0700`) | ✅ Nuit attribuée, déplacée, annulée, retirée ou réattribuée par un autre → la personne concernée est prévenue ; un planning = une seule notification ; texte neutre (écran verrouillé). 7 vérifications SQL |

Documentation : https://docs.expo.dev/push-notifications/overview/ · https://firebase.google.com/docs/cloud-messaging

## 7. E-mails — Resend
| | |
|---|---|
| Fonction | E-mails d'authentification en français : confirmation, connexion, mot de passe oublié (hook « Send Email » de Supabase) |
| Documentation | https://resend.com/docs |
| Statut | 🔧 Code existant (`auth-email`). À configurer : `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (domaine vérifié chez Resend), `SEND_EMAIL_HOOK_SECRET` |
| E-mails familiaux (invitations, plannings, bilans) | 📚 Non intégrés. Les notifications dans l'application et le push couvrent ces cas sans exposer d'adresse ; à ajouter seulement avec un consentement explicite par type d'e-mail |

## 8. Intelligence artificielle — Gemini (Google)
| | |
|---|---|
| Fonction | Assistant de questions, explication en français clair d'un résultat du scanner, lecture d'un document (éléments écrits seulement, « à vérifier »), analyse pédagogique d'une photo de glaire cervicale (avec consentement) |
| Statut | 🔧 Code existant. À configurer : `GEMINI_API_KEY`, `GEMINI_MODEL`. **Sans clé : aucun faux texte**, l'application affiche les règles |
| Données | Contexte de l'assistant **facultatif** (interrupteur) : âge, semaines après la naissance, moyenne d'humeur sur 7 jours. Jamais les réponses du point post-partum. Les photos ne sont ni stockées ni journalisées |

## 9. Abonnements — RevenueCat
🔧 Code existant (webhook signé, `subscriptions` seule source de vérité). À configurer : clés publiques par plateforme et `REVENUECAT_WEBHOOK_SECRET`.

## 10. Rapports de plantage — Sentry (facultatif)
🔧 `EXPO_PUBLIC_SENTRY_DSN`. Rien n'est envoyé sans l'accord de la personne ; aucune donnée de santé.

## 11. Stockage des photos et documents
✅ Supabase Storage, compartiments **privés** (taille et types de fichiers limités, accès par foyer). Photos du cycle chiffrées ; effacement à la suppression du compte. Les URL signées sont temporaires.

## 11 bis. Documents : numérisation, lecture du texte (OCR), résumé (nouveau)
| Étape | Technologie retenue | Où | Données transmises | Coût | Statut |
|---|---|---|---|---|---|
| Numérisation | Photo (appareil photo ou galerie) + traitement **sur l'appareil** : détection des bords (seuil d'Otsu + plus grande zone claire), redressement de perspective (homographie), rotation, niveaux de gris, lisibilité (étirement des niveaux), alerte de flou (variance du laplacien), PDF multipage (`pdf-lib`, JavaScript pur) | Appareil | Aucune | Gratuit | ✅ Testé (Jest + navigateur). Caméra réelle et scanner natif du système (VisionKit iOS / ML Kit Document Scanner Android) **non branchés** : ils exigent un build de développement et un appareil pour être testés |
| Lecture du texte (1) | Google ML Kit Text Recognition (déjà présent) | Appareil (build de développement) | Aucune | Gratuit | 🔧 Branché, **non testé ici** (pas d'appareil) ; absent du web et d'Expo Go |
| Lecture du texte (2) | Gemini (fonction `document-read`), transcription seule, passages illisibles marqués | Serveur, avec l'accord « lecture automatique des documents » | Le fichier du document uniquement (ni nom, ni profil) ; texte jamais journalisé | Payant à l'usage selon l'offre Gemini | ✅ Code + 4 tests Deno (réponse inexploitable → rien d'inventé). 🔧 `GEMINI_API_KEY` à configurer ; fonction à déployer |
| Lecture du texte (3) | Saisie ou collage du texte | Appareil | Aucune | Gratuit | ✅ Testé |
| Repérage (dates, valeurs + unités + plages, ordonnance, vaccins, échéances) | Règles explicites (`src/lib/documents/textParse.ts`) : recopie exacte, rien de deviné | Appareil | Aucune | Gratuit | ✅ 11 tests |
| Résumé (rapide, détaillé, explication simple) | Construit **sur l'appareil** à partir du texte lu : chaque élément est marqué « écrit dans le document », « repéré automatiquement », « explication générale » ou « incertain » ; glossaire de termes courants | Appareil | Aucune | Gratuit | ✅ Tests : chaque chiffre du résumé figure dans le document ; aucun « normal / anormal » |
| Recherche | Règles explicites (catégorie, année, « dernier », prénom de l'enfant, mot exact) sur les documents déjà autorisés par la base | Appareil | Aucune | Gratuit | ✅ Testé |
| Export | Dossier PDF fabriqué sur l'appareil (index + documents + résumés facultatifs), feuille de partage du téléphone ou téléchargement web ; aucun lien public | Appareil | Uniquement vers la destination choisie par la personne | Gratuit | ✅ Testé sur le web ; feuille de partage mobile non testée ici |

Sécurité : documents **privés par défaut**, partage avec le foyer explicite et révocable ; texte lu, éléments et résumés soumis aux **mêmes droits que le document** (faille corrigée : ils suivaient auparavant les droits du foyer) ; suppression du document = suppression du fichier, du texte, des éléments, des résumés et des rappels liés ; 19 vérifications SQL à deux comptes (`supabase/tests/sql/47_documents_v2.sql`). Aucun audit de conformité (RGPD, hébergement de données de santé) n'a été réalisé : à prévoir avant une mise en production.

## 12. Contenus de santé publique (France)
✅ **Contenus locaux sourcés**, pas d'API : il n'existe pas d'API officielle pour ces contenus. Ils citent leur source et leur date, sans aucune prescription individuelle :
- calendrier vaccinal (ministère, HAS) ;
- recommandations alimentaires (Santé publique France, 1000 premiers jours, ANSES/Ciqual) ;
- post-partum (3114, 15, 112, ressources d'accompagnement).

Questionnaire EPDS : non intégré (licence et usage clinique). Le suivi émotionnel fonctionne sans aucune API externe.

## 12 bis. Module cycle : contenus médicaux sur les pertes et les saignements (nouveau, 19 octobre 2026)
**Décision : bibliothèque pédagogique interne, versionnée, sans API.** Rien n'est transmis à un service externe par ce module.

| Source | API ? | Constat (vérifié le 19/10/2026) | Usage dans l'app |
|---|---|---|---|
| NHS (nhs.uk) | Oui : « NHS Website Content API » (v1 retirée, v2 en service) | Gratuite d'après le portail développeur, mais **inscription, abonnement par API et « base légale » d'utilisation exigés avant la mise en ligne** ; contenu en anglais britannique ; conditions de réutilisation à accepter à l'inscription (non lues ici, pas de compte créé). | **Non intégrée** : liens vers les pages publiques citées dans les fiches. Une intégration demanderait l'inscription par la propriétaire de l'app et une relecture des conditions. |
| OMS (who.int) | Une API de **statistiques** (Global Health Observatory) | Pas d'API de contenus grand public sur les pertes ou le cycle. | Non utilisée. |
| ACOG (acog.org) | Aucune API publique trouvée | Pages FAQ consultables, contenu protégé par le droit d'auteur. | Lien vers la FAQ « Vaginitis » seulement (aucun texte recopié). |
| INSERM (inserm.fr) | Aucune API de contenus trouvée | Dossiers d'information consultables. | Non cité pour l'instant. |
| Assurance Maladie (ameli.fr) | Aucune API de contenus grand public trouvée | Pages **injoignables depuis notre environnement de test** le 19/10/2026 : non vérifiées, donc **non citées**. | À ajouter après vérification manuelle. |

- Fichier : `src/content/dischargeGuides.ts` — 10 fiches FR + EN rédigées pour l'app (pas de copie de texte), chacune avec : ce qui s'observe, variations, quoi noter, limites, quand demander un avis, sources (lien officiel + langue).
- Version : `GUIDES_VERSION` / `GUIDES_CHECKED_ON` (2026-10-19), affichée sous la liste des fiches ; à revérifier au moins une fois par an ou à chaque changement de recommandation.
- Test Jest : aucune fiche ne contient de formulation de diagnostic (« vous avez une… », « c'est une mycose… »).
- **IA** : aucune donnée du cycle n'est envoyée à l'assistant, sauf la **phase estimée** si la personne autorise le contexte pour une conversation (déjà existant). Aucun traitement, aucun diagnostic.
- **Traduction automatique** : non utilisée (traductions écrites et relues dans le code, FR + EN).
- Coût externe de ce module : **aucun**.

## 12 ter. Conseils personnalisés du cycle et recherche d'un professionnel (nouveau, 19 octobre 2026)
**Moteur de conseils : interne, déterministe, sans API ni IA.** Calculé sur l'appareil à partir des saisies (`src/lib/advice/`), règles sourcées et datées, textes dans `src/i18n/{fr,en}/advice.ts`. Aucune donnée intime n'est envoyée à un service externe. Relecture par un professionnel de santé : **non faite** (`ADVICE_VALIDATED_BY = null`, affiché dans l'app).

Sources consultées le 19/10/2026 : Service-Public (contraception d'urgence, vérifié le 29/06/2026 par le site), QuestionSexualité / Santé publique France (contraception d'urgence, annuaire des centres de santé sexuelle), Santé.fr (règles douloureuses), NHS (period pain, pelvic inflammatory disease, ectopic pregnancy, vaginal discharge, bleeding, pregnancy test, missed periods), ACOG (vaginitis). Pages ameli « contraception d'urgence » : non retrouvées en accès direct ; Service-Public et QuestionSexualité sont utilisés à la place.

**Doctolib — vérification (19/10/2026)**
| Point | Constat |
|---|---|
| API publique pour une app grand public | **Aucune trouvée.** Le portail développeurs (developers.doctolib.com) est réservé aux partenaires, accès sur identification ; aucune spécification publique, aucun SDK, aucune offre « recherche et réservation » pour une application tierce destinée aux patientes. |
| Conditions d'utilisation (version avril 2026) | Extraction automatisée et web scraping **interdits** ; opposition à la fouille de textes et de données ; **tout lien vers la plateforme nécessite une autorisation préalable écrite** de Doctolib. |
| Ce qui est implémenté | **Rien qui touche Doctolib** : ni lien, ni logo, ni nom dans l'interface, ni requête. Le module `src/lib/advice/professionals.ts` est prêt à recevoir une destination supplémentaire si un accord écrit est obtenu. |
| Solution retenue | France : centres de santé sexuelle (QuestionSexualité, en premier après un rapport à risque), **Annuaire santé de l'Assurance Maladie**, pharmacien (sans rendez-vous) ; Royaume-Uni : recherche de services du NHS ; ailleurs : orientation générale. L'app ouvre seulement la page d'accueil de ces annuaires (aucun paramètre inventé) et ne transmet rien. Un rendez-vous n'est jamais présenté comme réservé. |
| Démarche possible | Demander à Doctolib une autorisation écrite de lien (et, éventuellement, un partenariat) ; à faire par la propriétaire de l'app. |

**Notifications** : les rappels du cycle sont neutres par défaut (« Petit rappel ») ; le texte détaillé n'est utilisé que si la personne active « Notifications détaillées ». Aucun conseil n'est envoyé en notification.
Coût externe : **aucun**.

## 12 quater. Prénoms, repas et récupération (nouveau, 19 octobre 2026)
- **Prénoms** : INSEE, *Fichier des prénoms* (état civil, France, 1900–2021), **Licence Ouverte / Etalab**, obtenu via le paquet R « prenoms » (ThinkR, licence MIT, données INSEE) sur raw.githubusercontent.com — insee.fr et data.gouv.fr n'étaient pas joignables depuis l'environnement de développement. Fichier `src/content/firstnames.json` : prénoms donnés au moins 50 fois depuis 1990 ; « mixte » = aucun sexe au-dessus de 90 % ; fréquence = naissances 2012–2021 (« naissances récentes »). Aucun site de prénoms n'est aspiré. **Origines et significations** : seulement la liste éditoriale existante (table `baby_names`) — aucune source ouverte fiable n'a pu être consultée (Wikidata non joignable) : elles ne sont donc pas inventées pour les autres prénoms.
- **Repas et recettes** (20 octobre 2026, `src/lib/recipes/sources.ts`, consultées le 19/10/2026) : Santé.fr — listériose (25/04/2025), toxoplasmose (13/02/2025), aliments à limiter pendant la grossesse (05/07/2023), besoins des 3–6 ans (27/07/2023), équilibre alimentaire (mpedia, 28/08/2025) ; Santé publique France — « Pas à pas, votre enfant mange comme un grand » (diversification) ; ANSES — miel et botulisme infantile (31/10/2023) ; *La Revue du Praticien* — lait cru (31/07/2023) ; INSPQ (Québec, source complémentaire) — prévention de l'étouffement (17/02/2026). Aucune API externe ; recettes rédigées par une IA, statut « À vérifier ». **Images** : illustrations générées par l'application (aucune banque d'images n'était joignable) ; aucune photo de tiers n'est utilisée.
- **Récupération post-partum** : HAS (ANAES), *Rééducation dans le cadre du post-partum* (synthèse, 2002) ; signes d'alerte AWHONN déjà utilisés.
Coût externe : **aucun** ; rien n'est envoyé à un service externe.

## 12 quinquies. Vaccins, articles par parcours, aide pour la nuit (nouveau, 20 octobre 2026)
- **Calendrier des vaccinations** : ministère chargé de la Santé, *Calendrier des vaccinations et recommandations vaccinales 2026* (2 avril 2026), lu via le document officiel diffusé par Infovac ; Santé.fr, *Le calendrier des vaccinations* (actualisation de juillet 2026, page publiée le 26/08/2026) ; rotavirus : HAS, recommandation du 12/07/2022 (via VIDAL). Le PDF de sante.gouv.fr n'était pas lisible (vérification anti-robot) : le calendrier vient du même document diffusé par Infovac. Le chapitre ROR n'était pas dans la partie lisible : les âges (12 mois, 16–18 mois) sont ceux du calendrier en vigueur depuis 2018, confirmés par une source secondaire (Elsan, 04/05/2026) — **à vérifier par un professionnel**. Aucun calcul n'est fait pour les vaccinations qui dépendent d'une situation (BCG, hépatite B à la naissance, VRS, grippe, rattrapages) : elles sont seulement listées.
- **Articles par parcours et aide pour la nuit** : 65 pages consultées le 20/10/2026 (sante.fr, ameli.fr, mpedia.fr, mangerbouger.fr, anses.fr, ansm.sante.fr, questionsexualite.fr ; sources britanniques NHS, NHS inform et Tommy's pour quelques points de la sexualité pendant la grossesse et du sommeil sur le côté, **signalés à confirmer par une source française**). 1000-premiers-jours.fr ne renvoyait aucun texte lisible. Aucune API ; rien n'est envoyé à un service externe.

## 13. Recommandations de produits
📚 **Étudiée, non intégrée.** Il n'existe pas de catalogue ouvert et vérifiable pour l'équipement, les jouets et les livres : les sources trouvées sont commerciales ou d'affiliation. Aucune recommandation inventée n'est affichée.
- Sources utilisables plus tard, sous conditions : Open Food Facts et Open Beauty Facts pour les produits notés, avec les allergies déclarées, sans utiliser de donnée médicale pour de la publicité ; une sélection éditoriale clairement signalée.
- Tout contenu sponsorisé devrait être étiqueté comme tel.

---

## Mise en service (à faire dans les tableaux de bord, sans partager les clés ici)
1. Supabase :
   - appliquer les migrations : `supabase db push` ;
   - déployer toutes les fonctions : `supabase functions deploy <nom>`, dont `calendar-feed`.
2. Secrets : `supabase secrets set OPENFOODFACTS_USER_AGENT="ToiEtMoi/1.0 (contact@votre-domaine)"`, puis les autres variables de `.env.example`.
3. Realtime : vérifier dans Database › Replication que la publication `supabase_realtime` contient les tables listées (la migration les ajoute).
4. Push : Database Webhook `INSERT public.notifications` → `send-push` (en-tête secret), identifiants FCM et APNs dans EAS.
5. Vérifications en production, puisque l'environnement de développement n'a pas Internet :
   - un code-barres réel dans le scanner ;
   - un lien d'agenda ajouté dans Google Agenda et dans Apple Calendrier ;
   - une notification push ;
   - un e-mail de confirmation.

## Tests (commandes)
- `npx tsc --noEmit` · `npx jest` · `npm run db:test`
- Fonctions serveur : `deno test --allow-env supabase/functions/_shared/` et `deno check supabase/functions/*/index.ts`
- Parcours navigateur (voir `e2e/README.md`) : `etape1_auth.py`, `agenda_abonnement.py`, `temps_reel.py`
