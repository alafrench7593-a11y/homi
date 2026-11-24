# Audit de conformité App Store — HOMI — 24/11/2026

Branche `homi/fondations` (arbre propre au moment de l'audit). Expo SDK 57 (`expo ~57.0.33`), bundle `app.homi.family`, ASC App ID `6834794892` (`src/config/brand.json`).
Audit **en lecture seule** : aucun fichier modifié hors ce rapport, aucun commit, aucune écriture en production, aucun build. Lint non lancé (consigne).

**Sources des règles** : https://developer.apple.com/app-store/review/guidelines/ et https://developer.apple.com/app-store/app-privacy-details/ récupérées par WebFetch le 24/11/2026 (les ~14 000 derniers caractères des Guidelines, après 5.2.5, n'ont pas été lus ; rien n'était à chercher dans cette partie). Les **codes d'offre** ne sont pas décrits dans le texte des Guidelines : ce point repose sur la documentation App Store Connect, à revérifier.

**Résultats repris des audits précédents, sans les relancer** (code inchangé depuis) : RLS `bash supabase/tests/run-local.sh` 2872/0 ; Jest 4799/4799 ; Deno (fonctions) 78/0 ; suppression de compte, textes d'autorisation et manifeste vérifiés le 24/11 (`docs/SUIVI.md`). Audits lus : `docs/SUIVI.md`, `docs/AUDIT_LANCEMENT_2026-11-23.md`, `HOMI_FINAL_PREBUILD_AUDIT.md`, `docs/MISSION_MASTER_AUDIT.md`.

Légende : [Certain] = preuve dans le code ou dans une commande exécutée · [Probable] · [Supposition]. Risque : **P0** = refus quasi certain ou soumission impossible · **P1** = refus probable si l'examinateur tombe dessus · **P2** = risque réel mais limité, ou à déclarer correctement · **P3** = finition.

---

## Verdict : **NO GO** (soumission à Apple aujourd'hui)

Le code est **globalement conforme** : consentement IA vérifié côté serveur, scanner de médicaments sans posologie, paywalls complets, suppression du compte dans l'app, aucune publicité ni pistage. Trois raisons empêchent quand même de soumettre :

1. **Prérequis App Store Connect non vérifiables ici et bloquants (P0)** : produits d'abonnement et packs de crédits soumis avec le build, compte de démonstration **avec Premium actif** (l'app ne s'ouvre pas sans abonnement), URL de confidentialité et de support accessibles. Sans eux, le refus au titre de 2.1 est quasi certain.
2. **Modération de la communauté trop mince pour la règle 1.2 (P1)** : le filtre automatique ne contient que 4 motifs (spam, vente de lait maternel, arrêt de traitement, adresse) et aucun modérateur n'est prévenu quand un signalement arrive. La communauté comprend des messages privés entre inconnus et des publications anonymes, c'est-à-dire exactement ce qu'Apple examine de près.
3. **Rien n'a été joué sur iPhone** : achats sandbox, Sign in with Apple, suppression du compte, lien de réinitialisation du mot de passe. Le build 13 sur TestFlight ne contient pas les corrections récentes.

**Passage à GO** quand les quatre conditions sont remplies : P0 traités dans App Store Connect ; P1 « UGC » corrigés (liste de termes étendue et alerte des modérateurs) ; P1 « code ambassadeur » réglé (codes d'offre créés, ou bouton masqué) ; recette iPhone du chapitre « Non vérifiable sans iPhone » réussie sur un nouveau build TestFlight.

---

## Tableau des constats

| # | Point | Règle Apple | Constat | Preuve (fichier:ligne ou commande) | Risque | Correction proposée |
|---|---|---|---|---|---|---|
| 1.1 | UGC : signalement d'une publication et d'un commentaire | 1.2 | Présent : feuille de signalement à 7 motifs (harcèlement, désinformation médicale, danger, données personnelles, spam, contenu inapproprié, autre) [Certain] | `src/features/community.tsx:34-41,167-204` ; `src/app/community/post/[id].tsx:157,235` ; `src/lib/data/hooks-community.ts:323-328` (insertion dans `reports`) | OK | — |
| 1.2 | UGC : signalement et blocage d'un **utilisateur** | 1.2 | Présents depuis le profil et depuis une conversation privée ; liste « Personnes bloquées » avec déblocage ; contenus masqués dans les deux sens [Certain] | `src/app/community/u/[handle].tsx:35-59` ; `src/app/community/messages/[id].tsx:84-88,165-173` ; `src/app/community/blocked.tsx:1` ; RPC `report_member` `supabase/migrations/20261022000100_community_v2.sql:654-666` | OK | — |
| 1.3 | UGC : **filtrage** avant publication | 1.2 | Le mécanisme existe (téléphones et e-mails envoyés en relecture ; table `moderation_terms` avec actions bloquer / relire ; appliqué aussi aux messages privés). **Mais la liste ne contient que 4 motifs**, aucun pour les insultes, la haine, le contenu sexuel ou les menaces [Certain]. L'état de la table en production n'a pas été vérifié [Probable : identique] | `supabase/migrations/20261015000400_community.sql:142-153` ; `supabase/migrations/20261029000300_reference_content.sql:42-46` ; `supabase/migrations/20261119000300_messagerie_privee.sql:244-245` | **P1** | Ajouter par migration une liste FR/EN/ES/DE/IT d'insultes, de propos haineux, de termes sexuels explicites et de menaces (bloquer ou relire), testée dans `supabase/tests`. Vérifier en lecture le contenu de `moderation_terms` en production |
| 1.4 | UGC : **modération effective** et réponse rapide | 1.2 (« timely responses ») | Masquage automatique au 3ᵉ signalement, file de modération et actions (masquer, retirer, avertir, suspendre) dans `/admin` [Certain]. **Aucune alerte** au modérateur quand un signalement arrive (ni push ni e-mail) [Certain : aucune occurrence trouvée]. Un seul compte admin connu en production (`docs/SUIVI.md`) | `20261015000400_community.sql:160-178` (seuil 3) ; `20261022000100_community_v2.sql:604-623` (`moderation_queue`) ; `src/app/admin/index.tsx:84` ; grep `notify_moderator\|new_report` : 0 résultat | **P1** | Envoyer un e-mail ou un push aux modérateurs à chaque signalement (le hook Resend et `send-push` existent déjà) ; s'engager sur un délai (24 h) dans les règles de la communauté et dans les notes pour Apple |
| 1.5 | UGC : règles acceptées, contact publié | 1.2 | Règles à accepter avant de créer un profil communautaire ; e-mail de contact affiché dans Aide et dans « Moi » [Certain]. Adresse Gmail (`homiyxz@gmail.com`) | `src/app/community/profile.tsx:74` ; `src/lib/data/hooks-community.ts:388` ; `src/app/settings/help.tsx:37` ; `src/app/(tabs)/moi.tsx:135` | P3 | Adresse sur le domaine (ex. contact@homifamille.com), plus crédible pour Apple |
| 1.6 | Publications anonymes, messages privés entre inconnus | 1.2 (« random or anonymous chat ») | Les publications peuvent être « Membre anonyme » ; les messages privés passent par une demande à accepter, limitée à 3 messages et 10 demandes par jour [Certain]. Ce n'est pas un chat aléatoire, mais l'examinateur regardera | `src/i18n/fr/cm1.ts:85-86` ; `messagerie_privee.sql:199,241-243,257-258` | P2 | L'expliquer dans les notes (pseudonymes, demande à accepter, auteur connu des modérateurs) ; classement 18+ |
| 2.1 | Scanner de boîte de médicament (BDPM) | 1.4.1, 5.1.3 | Identification seulement : aucune IA, aucune posologie ; avertissement affiché en entier (« ne donne jamais de dose : suis l'ordonnance… ; ingestion accidentelle : centre antipoison ») ; source officielle citée ; lien vers la notice officielle [Certain] | `src/app/scanner/medicine.tsx:1-4,71-75,90` ; `src/i18n/en/auraVision.ts:35-36` | OK | — |
| 2.2 | Calculs de dose | 1.4.1 | Aucun calcul de dose ni de fréquence ; l'assistant bloque les posologies (test « 15 mg/kg ») [Certain] | `src/lib/domain/childCare.ts:6,121` ; `src/lib/domain/healthTrack.ts:10,159` ; `src/__tests__/safety.test.ts:42-44` | OK | — |
| 2.3 | Cycle, fertilité, contraception | 1.4.1 | Dates présentées comme estimations, « ne remplacent pas une contraception », « aucun jour sans risque », renvoi vers un professionnel [Certain] | `src/i18n/fr/cycle.ts:18,135` ; `src/i18n/fr/advice.ts:163` (fichier des conseils, ligne `adv.risk.p2`) | OK | Ne jamais présenter la fenêtre fertile comme une méthode de contraception dans la fiche |
| 2.4 | Courbes de croissance | 1.4.1 (méthode à divulguer) | Standards OMS 2006, méthode LMS, aucune extrapolation au-delà de 60 mois, écart avec les courbes françaises AFPA mentionné [Certain] | `src/lib/domain/growthStandards.ts:2-12` | OK | — |
| 2.5 | Articles de santé rédigés avec une IA | 1.4.1 | Statut affiché honnêtement : « Rédigé avec l'aide d'une IA… pas encore relu par un professionnel de santé » [Certain]. Un examinateur peut juger risqué un contenu santé non relu | `src/i18n/fr/reorg.ts:156,160` ; contrainte SQL `20261020000300_reorganisation.sql:24-32` | P2 | Faire relire en priorité les articles « sécurité » (fièvre, urgences, sommeil du nourrisson) ; ne jamais écrire « validé par des pédiatres » dans la fiche |
| 3.1 | Aura : consentement explicite avant Google Gemini | 5.1.2(i) | Interrupteur « Assistant » décoché par défaut à l'inscription, qui nomme Google Gemini ; feuille de consentement avant le premier message ; **le serveur revérifie** le consentement (assistant, community-ai, scan-explain, document-read, cycle-photo) ; « Continuer sans IA » proposé [Certain] | `src/features/onboarding/ConsentsStep.tsx:17-19` ; `src/i18n/fr/onboarding.ts:49-52` ; `src/i18n/fr/aura.ts:48-52` ; `src/features/aura/AuraScreen.tsx:149,308,344` ; `supabase/functions/assistant/index.ts:106` ; `supabase/functions/document-read/index.ts:24,42` ; `supabase/functions/community-ai/index.ts:31` ; `supabase/functions/scan-explain/index.ts:31` | OK | — |
| 3.2 | Aura : mention IA, pas de diagnostic, pas d'IA pour le déterministe | 1.4.1, 5.1.2 | « Je suis une intelligence artificielle », mode local « sans IA », intentions locales sans appel serveur, contrôle des réponses (posologies, garanties) [Certain] | `src/i18n/fr/aura.ts:3,8-12,24` ; `src/__tests__/safety.test.ts` ; `docs/AUDIT_LANCEMENT_2026-11-23.md` § 4 | OK | — |
| 3.3 | Texte du consentement Aura et conservation | 5.1.2 | Le texte dit « ne sont pas conservés par HOMI », alors que l'historique est enregistré **si** la personne a activé l'historique (accord séparé) [Certain]. C'est cohérent, mais ambigu | `src/i18n/fr/aura.ts:49` ; `supabase/functions/assistant/index.ts:133-150` | P3 | Ajouter « sauf si tu actives l'historique » |
| 4.1 | Paywalls : prix facturé, durée, essai, renouvellement | 3.1.2, Schedule 2 | Prix et période venant de la boutique ; le **montant facturé** est en gras, l'équivalent mensuel en petit ; ligne légale sous le bouton : « 3 jours gratuits, puis {prix}/{période}. Renouvellement automatique, sauf résiliation au moins 24 h avant l'échéance » ; « sans essai » signalé sur la formule Famille [Certain] | `src/features/firstWin/PaywallWhite.tsx:130-139,285-310` ; `src/features/firstWin/offer.ts:114-120,191-194` ; `src/i18n/fr/firstwin.ts:160-161` ; `src/lib/premium/plans.ts:5` | OK | Vérifier sur iPhone le libellé de la période 6 mois |
| 4.2 | Restauration, Conditions, Confidentialité | 3.1.2 | « Restaurer » + « Conditions » + « Confidentialité » sur le paywall principal (la variante « histoire » utilise le même pied) et sur `/premium` [Certain]. Les liens ouvrent les écrans de l'app ; la fiche doit aussi porter les URL | `PaywallWhite.tsx:137-139` ; `src/features/firstWin/Offers.tsx:146` ; `src/features/Paywall.tsx:74-85,191-197,261,274` | OK (fiche : P0, voir § ASC) | Lien vers les CGU (EULA) dans la description ou dans le champ EULA d'App Store Connect |
| 4.3 | Paiement externe | 3.1.1, 3.1.3 | Aucun prestataire de paiement externe ; seul lien externe : la gestion d'abonnement Apple ; la vitrine web (« Tarifs indicatifs ») n'existe que sur le web [Certain] | grep `stripe\|paypal\|checkout\|paddle\|lemonsqueezy` : 0 résultat utile ; `src/features/Paywall.tsx:113-118` ; `src/features/firstWin/offer.ts` (`catalogState`, web = `unavailable`) | OK | — |
| 4.4 | Packs de crédits Aura | 3.1.1 | Achat via le SDK RevenueCat (achat intégré) [Certain]. Les produits consommables doivent exister et être soumis avec le build | `src/features/credits/CreditsParts.tsx:114-124` | **P0 (ASC)** | Créer et soumettre les packs avec la version, ou masquer la liste si le catalogue est vide (à vérifier sur iPhone) |
| 4.5 | « J'ai un code ambassadeur » | 3.1.1 | Le serveur vérifie le code, puis ouvre **l'écran officiel d'Apple** de code d'offre (`apps.apple.com/redeem?ctx=offercodes…`) ; HOMI n'affiche ni n'applique aucune réduction [Certain]. **Risque** : un code valable chez HOMI mais absent des codes d'offre App Store Connect mène à une erreur Apple [Certain dans la logique ; état ASC inconnu] | `src/features/firstWin/AmbassadorCode.tsx:1-8,21-23,47-53` ; `docs/SUIVI.md` (« dépend des codes d'offre à créer ») | **P1** | Créer un code d'offre personnalisé par ambassadeur (lettres et chiffres) **avant** la soumission, ou masquer le bouton dans ce build ; donner un code de test dans les notes |
| 4.6 | Programme Ambassadeurs (commissions versées à des utilisateurs) | 3.2.2, 2.3.1(a) | Écrans `/ambassadors` (simulateur de revenus, candidature, tableau de bord) hors Premium [Certain]. Ce n'est pas interdit en soi [Supposition], mais l'examinateur demandera ce que c'est | `src/app/ambassadors` ; `src/i18n/fr/*` (`amb.sim.note`) | P2 | Le décrire précisément dans les notes (2.3.1(a)) ; aucune promesse de gain dans la fiche |
| 5.1 | Preuve sociale « 4,8/5 · 100 parents testeurs » | 2.3, 2.3.1 | Présentée comme « Retours du programme de test HOMI » ; la variante « histoire » ajoute « Ce n'est pas une note de l'App Store » ; **le paywall principal ne porte pas cette phrase** ; étoiles dorées très proches d'une note de l'App Store ; réponses brutes absentes du dépôt [Certain] | `src/config/socialProof.ts:1-17` ; `src/features/firstWin/PaywallWhite.tsx:218-232` ; `src/features/firstWin/PaywallStory.tsx:156-199` ; `src/i18n/fr/motion.ts:94` ; `src/i18n/fr/firstwin.ts:250-253` | P2 | Ajouter « Ce n'est pas une note de l'App Store » sur le paywall principal ; garder la preuve (export du questionnaire, date, nombre) prête pour Apple ; ne **jamais** reprendre ce chiffre dans la fiche ni dans les captures. Le plus prudent : `enabled: false` tant que l'app n'a pas de vraies notes |
| 6.1 | Suppression du compte dans l'app | 5.1.1(v) | « Supprimer mon compte » dans le menu Compte (accessible sans abonnement) ; la fonction `delete-account` supprime les fichiers et les données [Certain : code ; parcours vérifié en démo web le 23/11] | `src/app/settings/account.tsx` ; `src/lib/data/hooks-settings.ts:209` ; `supabase/functions/delete-account/index.ts:120-123` | OK (à jouer sur iPhone) | — |
| 6.2 | Révocation du jeton Apple à la suppression | 5.1.1(v) (exigence Apple pour Sign in with Apple) | Révocation codée mais **dépend de secrets** (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`) dont la présence en production n'a pas pu être vérifiée (`supabase secrets list` : pas de jeton d'accès) ; valeur par défaut de `APPLE_CLIENT_ID` = **`fr.aufildenous.app`** (ancien bundle), alors que le bundle actuel est `app.homi.family` [Certain] | `supabase/functions/_shared/apple.ts:31-35` ; `src/config/brand.json` (`bundleId`) | **P1** | Définir `APPLE_CLIENT_ID=app.homi.family` et les 3 secrets Apple en production ; corriger la valeur par défaut du code ; tester sur iPhone |
| 6.3 | Sign in with Apple si connexion tierce | 4.8 | Bouton Apple natif prévu (`usesAppleSignIn: true`) ; Apple et Google ne s'affichent que si `EXPO_PUBLIC_AUTH_APPLE` / `EXPO_PUBLIC_AUTH_GOOGLE` = 1 au build ; valeurs EAS inconnues ici [Certain : mécanisme] | `app.config.ts:86` ; `src/lib/socialProviders.ts:1-11` ; `src/features/auth.tsx:87-103` | P1 conditionnel | Ne jamais construire avec Google à 1 et Apple à 0. Recommandé : Apple = 1 ; Google = 0 tant que les identifiants Google ne sont pas fournis (`docs/SUIVI.md`) |
| 6.4 | Réinitialisation du mot de passe | 2.1 | Écrans `/auth/forgot` et `/auth/reset` ; e-mails envoyés par Resend (hook actif, 100/h) [Certain : code + `docs/SUIVI.md` 24/11] | `src/app/auth/forgot.tsx`, `src/app/auth/reset.tsx` | OK (lien profond à tester sur iPhone) | — |
| 6.5 | Compte obligatoire avant l'essai | 5.1.1(v) | Le compte est créé avant l'essai (synchronisation du foyer, co-parent) [Certain] | `src/features/firstWin/offer.ts` (`fw.cta.toTrial`) | P3 | Justifier dans les notes : l'abonnement est rattaché au foyer partagé entre adultes |
| 7.1 | Publicité et pistage | 5.1.2, 5.1.4 | Aucun SDK publicitaire ni de pistage, pas d'ATT ; `NSPrivacyTracking: false` [Certain] | `package.json` (dépendances listées) ; `app.config.ts:98-107` | OK | — |
| 7.2 | Manifeste de confidentialité | 5.1.1 | UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1 [Certain]. Les SDK tiers (Sentry, RevenueCat, ML Kit, Google Maps) apportent leur propre manifeste [Probable] | `app.config.ts:98-107` | P3 | Lire le rapport de confidentialité généré par Xcode (Organizer › « Generate Privacy Report ») sur l'archive |
| 7.3 | Textes NS*UsageDescription | 5.1.1 | Présents en 5 langues pour Caméra, Photos (lecture et ajout), Face ID, Localisation « pendant l'utilisation », Calendriers ; micro désactivé ; pas de localisation en arrière-plan. `NSMotionUsageDescription` déclaré alors que le mouvement n'est jamais demandé (exigé par le plugin expo-location) [Certain] | `app.config.ts:16-63,86-94,126-160` | P3 | — |
| 7.4 | Enfants | 1.3, 5.1.4 | App pour les parents, réservée aux 18 ans et plus ; « mode enfant » retiré [Certain] | `src/content/legal.ts:23` ; `docs/SUIVI.md` (23/11) | OK | **Ne pas** choisir la catégorie Enfants ni « Made for Kids » |
| 7.5 | Déclarations « Confidentialité de l'app » | 2.3, 5.1.1 (App Privacy Details) | Données à déclarer d'après le code : santé, informations sensibles (grossesse), coordonnées, photos, contenus utilisateur (publications, messages privés), identifiants, achats, interactions produit (`analytics_events` lié au compte, facultatif mais **continu → à déclarer**), plantages (Sentry, idem), localisation (envoyée au service de lieux de Google), diagnostics ML Kit et Google Maps [Probable pour les SDK Google] | `src/lib/types.ts:259-260` ; `src/lib/scanner/localRecognition.ts` (ML Kit) ; `app.config.ts:153,159` | P2 | Remplir selon le tableau du § ASC ; **ne pas** reprendre `docs/APP_STORE_SOUMISSION.md` tel quel (ancien nom « Au fil de nous », bundle et prix périmés) |
| 8.1 | Exactitude des métadonnées | 2.3, 2.3.7, 2.3.10 | Voir la liste « À ne pas promettre » ci-dessous. Les anciennes fiches (`docs/APP_STORE_SOUMISSION.md`, `docs/FICHES_STORES.md`) portent les noms « Au fil de nous » et « Toi & Moi », d'anciens prix et l'affirmation erronée « aucune messagerie privée » [Certain] | `docs/APP_STORE_SOUMISSION.md:1-3,40,107` ; `src/app/community/messages/` | P2 | Rédiger la fiche à partir de ce rapport |
| 9.1 | Accès pour l'examinateur | 2.1(a) | Démo sans compte : « Découvrir » depuis l'intro (`startDemoWithoutAccount`, données locales, aucune écriture serveur) et `/start/sample` [Certain]. **Mais** l'app réelle est fermée sans abonnement (`docs/SUIVI.md` 24/11) ; aucun mécanisme d'octroi Premium manuel trouvé dans la base [Certain : grep] | `src/app/intro.tsx:49-63` ; `src/app/demo.tsx:1-9` ; `src/lib/demoMode.ts:12` | **P0 (ASC)** | Compte de démonstration en production avec Premium actif, accordé par un **droit promotionnel RevenueCat** (« Grant promotional entitlement ») [Probable : mécanisme RevenueCat standard], foyer d'exemple rempli ; identifiants dans « App Review Information » |
| 9.2 | URL publiques (confidentialité, support, CGU, suppression) | 1.5, 5.1.1(i), 2.1 | Pages présentes dans le dépôt (`legal-site/confidentialite`, `cgu`, `aide`, `suppression-compte`, `mentions-legales`) [Certain] ; disponibilité en ligne **non vérifiée** (homifamille.com refusé par le proxy de la session) | `ls legal-site` ; `curl https://homifamille.com/…` → refus du proxy (403) | **P0 (ASC)** si absentes | Ouvrir les 4 URL dans un navigateur avant la soumission |

---

## À ne pas promettre (captures, description, texte promotionnel) — 2.3

- **Aucune note ni étoile** : ni « 4,8/5 », ni « 100 parents », ni « n°1 », ni « recommandé par des pédiatres ou des sages-femmes » (articles non relus par un professionnel).
- **Aucun diagnostic** : pas de « détecte », « dépiste », « prédit l'ovulation » ; la fenêtre fertile est une estimation et **pas une contraception**.
- **Pas de posologie** : le scanner identifie une boîte, il ne dit jamais quelle dose donner.
- **Aura** : « assistant IA (Google Gemini), avec ton accord, payé en crédits » ; pas de « médecin de poche », pas d'« IA médicale », pas d'« illimité ».
- **« Gratuit »** : seulement « 3 jours d'essai gratuits » ; l'app est payante après l'essai et rien n'est accessible sans abonnement en dehors de la démo.
- **Nombre d'outils** (121, 127 ou 128 selon les documents) : ne pas en citer, ou citer le chiffre exact du build soumis.
- **Pas de fonctions absentes ou fermées** : Google Sign-In (non configuré), widgets non vérifiés sur iPhone, Android.
- **Aucune mention d'Android ni de Google Play** (2.3.10), ni du programme Ambassadeurs présenté comme un moyen de gagner de l'argent.
- **Captures** : prises sur le build iOS (pas sur le web), sans bandeau « Démonstration » trompeur ; pas d'écran de paywall montrant la note testeurs.
- **Confidentialité** : « aucune publicité, aucun pistage » est vrai [Certain] ; « aucune donnée envoyée » est **faux** (Gemini, Google Places, RevenueCat, Resend).

---

## À faire dans App Store Connect

### Fiche proposée (longueurs comptées par script)

| Champ | Français | Anglais |
|---|---|---|
| Nom (≤ 30) | `HOMI – Famille & bébé` (21) | `HOMI – Family & Baby` (20) |
| Sous-titre (≤ 30) | `Suivi bébé, grossesse et foyer` (30) | `Baby, pregnancy & family log` (28) |
| Mots-clés (≤ 100, sans espace après la virgule, sans répéter le nom) | `biberon,sommeil,allaitement,croissance,naissance,cycle,coparent,nounou,parent,enfant,routine,repas` (98) | `baby tracker,feeding,sleep,breastfeeding,growth,maternity,cycle,coparent,nanny,newborn,routine` (94) |
| Catégorie | Principale : **Santé et forme** ; secondaire : **Style de vie** (jamais « Médecine », jamais « Enfants ») | idem |
| URL de confidentialité | `https://homifamille.com/confidentialite/` (à vérifier en ligne) | idem (page anglaise si elle existe) |
| URL de support | `https://homifamille.com/aide/` | idem |
| Contrat de licence | CGU HOMI (`https://homifamille.com/cgu/`) ou EULA standard d'Apple ; le lien doit figurer dans la description | idem |
| Copyright | `2026 David PRINCIVIL EI` (`brand.json` publisher) | idem |

Fin de description obligatoire (3.1.2) : formules (mensuelle, 6 mois, annuelle, Famille), **prix facturé par période**, « 3 jours d'essai gratuits sur [formules concernées] », « renouvellement automatique sauf résiliation au moins 24 h avant l'échéance, depuis les réglages du compte Apple », liens Conditions et Confidentialité, « HOMI ne remplace pas l'avis d'un médecin ou d'une sage-femme ; en cas d'urgence : 15 ou 112 ».

### Âge (questionnaire Apple)

Informations médicales : fréquentes · thèmes sexuels et contraception (informatifs) : rares · contenu généré par les utilisateurs : oui · messagerie entre utilisateurs : oui (messages privés) · accès web libre : non · publicité : non. **Résultat visé : 18+**, cohérent avec les CGU (`src/content/legal.ts:23`).

### Confidentialité de l'app (d'après le code)

Pistage : **Non**. Toutes les données ci-dessous sont **liées à l'identité** et servent aux **fonctionnalités de l'app**, sauf mention contraire.

| Type Apple | Ce que c'est dans HOMI |
|---|---|
| Santé et forme › Santé | suivis des enfants, cycle, grossesse, traitements, documents de santé |
| Informations sensibles | grossesse et naissance |
| Coordonnées | e-mail, nom affiché |
| Photos ou vidéos | album, photos transmises par la nounou, documents photographiés |
| Contenu utilisateur › Autre | publications, commentaires, messages privés, questions à Aura (envoyées à Google Gemini) |
| Identifiants › ID utilisateur | identifiant de compte (Supabase, RevenueCat) |
| Achats | historique d'abonnement et de crédits |
| Utilisation › Interactions produit | `analytics_events` si l'option est acceptée (finalité : statistiques) |
| Diagnostics › Plantages | Sentry si l'option est acceptée ; **non liés** |
| Diagnostics › Performances et autres | SDK Google ML Kit et Google Maps [Probable] ; **non liés** |
| Localisation › Précise | « Près de chez moi », à la demande ; envoyée au service de lieux de Google ; non conservée par HOMI. À déclarer par prudence, faute de garantie sur la conservation chez Google [Supposition] |

### Achats intégrés à soumettre avec la version

Abonnements du groupe « HOMI Premium » (mensuel, 6 mois, annuel, Famille), essai de 3 jours, packs de crédits Aura (consommables), **codes d'offre** des ambassadeurs (sinon masquer le bouton « J'ai un code ambassadeur »). Tous en « Prêt à soumettre » et joints à la version.

### Notes pour l'examinateur (à coller, en anglais)

> HOMI is a family organizer for **parents** (18+): baby and child tracking (sleep, bottles, breastfeeding, growth on WHO 2006 standards), pregnancy, cycle, shared household planning with a co-parent, a moderated parents' community and an optional AI assistant.
>
> **Demo account** (production, Premium granted for review): `[e-mail]` / `[password]`. The account already contains a sample family. Without an account, "Découvrir / Explore" on the first screen opens a local demo with fictional data (nothing is sent to our servers).
>
> **Subscriptions**: auto-renewable (monthly, 6 months, annual, Family) with a 3-day free trial on eligible plans; Aura credit packs are consumable in-app purchases. "Restaurer / Restore" is on the paywall and in Settings › Subscription. An account is created before the trial because the subscription is attached to a household shared between two adults.
>
> **Ambassador code** (paywall link "J'ai un code ambassadeur"): our server checks the code, then opens Apple's official offer-code redemption sheet. Apple applies the discount; we never do. Test code: `[CODE]`. The ambassador programme pays referral commissions to approved adults outside the app; nothing is sold through it.
>
> **AI (Aura)**: Google Gemini is used only after explicit opt-in (consent screen naming Google Gemini, checked again on our server). A local mode without AI is always available. Aura never gives a diagnosis or a dose.
>
> **Medicine box scanner**: identification only, from the official French public medicines database (BDPM); no AI, no dosage.
>
> **Community (UGC)**: pseudonyms; posts, comments and members can be reported (7 reasons) and blocked; automatic filtering of prohibited terms; content is hidden after 3 reports; moderators review reports within 24 hours and can remove content and suspend accounts. Private messages require the recipient to accept a request first. Rules must be accepted before posting.
>
> **Account deletion**: Me › Account › Delete my account (works without a subscription).
>
> **No ads, no tracking.** Health data is never used for marketing.

### Compte de démonstration à créer

Un compte dédié (pas `homixyz+apple@gmail.com` s'il sert à autre chose), mot de passe fixe, e-mail confirmé, **Premium actif par droit promotionnel RevenueCat** couvrant toute la durée de l'examen, un foyer d'exemple (2 enfants, une grossesse, quelques saisies de sommeil et de biberons), un profil communautaire déjà créé (règles acceptées), le consentement Aura **non** donné (pour que l'examinateur voie l'écran de consentement), quelques crédits Aura.

---

## Non vérifiable sans iPhone

- Achats sandbox : affichage des prix StoreKit (dont la période « 6 mois »), essai, achat, **restauration**, packs de crédits, expiration, changement de formule.
- Écran Apple de code d'offre ouvert depuis « J'ai un code ambassadeur », et relecture des droits au retour.
- Sign in with Apple : connexion, puis **suppression du compte avec révocation du jeton**.
- Lien de réinitialisation du mot de passe et lien de connexion ouverts dans l'app (lien profond `homi://`, adresses de redirection Supabase).
- Demandes d'autorisation (caméra, photos, ajout aux photos, Face ID, localisation, calendrier, notifications) : texte affiché et refus géré.
- Scanner de code-barres et Data Matrix (BDPM) avec la vraie caméra ; ML Kit hors ligne.
- Rapport de confidentialité de l'archive Xcode (manifestes des SDK).
- Rendu Liquid Glass, petit écran (SE), grande taille de texte, VoiceOver, sur un build **plus récent que le 13**.

---

## Commandes exécutées pendant cet audit

- `grep` et lectures ciblées dans `src/`, `supabase/migrations/`, `supabase/functions/`, `app.config.ts`, `src/config/`.
- `node -e` : liste des dépendances (aucun SDK publicitaire ni de pistage).
- `npx --no-install supabase secrets list` : refusé (pas de jeton d'accès), donc secrets Apple non vérifiés.
- `curl https://homifamille.com/{confidentialite,cgu,aide,suppression-compte}/` : refusé par le proxy de la session (403), donc pages non vérifiées en ligne.
- WebFetch : Guidelines (lecture partielle, voir l'en-tête) et App Privacy Details.
- Aucun test relancé (code inchangé) ; `npx expo lint` non lancé (consigne).
