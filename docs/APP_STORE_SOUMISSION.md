# Soumission App Store — Au fil de nous
> Mis à jour le 09/11/2026 : nouveaux prix (49,99 € / 79,99 €). Pour la checklist complète et à jour, voir PUBLICATION.md.

> Préparé le 2 novembre 2026 à partir du code (commit 2a1aabd). Remplace `FICHES_STORES.md` (ancien nom « Toi & Moi »).
> Rien n'est inventé : chaque information absente du projet est marquée **MANQUANT** et doit être fournie par l'éditeur.

## 0. Bloquants avant « Submit for Review »

| # | Point | Pourquoi | Qui |
|---|---|---|---|
| B1 | **URL de la politique de confidentialité** (obligatoire) | Aucun site public n'existe dans le projet. La page `/legal/privacy` existe dans l'app ; elle peut être publiée sur le web (version web sur Vercel, par exemple) une fois le domaine choisi. | Éditeur : domaine **MANQUANT** |
| B2 | **URL de support** (obligatoire) | Aucune page de support. Seul l'e-mail de support est connu (`src/config/brand.json`). | Éditeur : URL **MANQUANT** |
| B3 | **CGU et confidentialité marquées « Brouillon — à valider par un juriste »** et « coordonnées à compléter » | Le bandeau est visible dans l'app. Apple refuse les éléments provisoires (règle 2.1) et le RGPD exige l'identité du responsable du traitement. Le bandeau ne doit être retiré qu'après relecture réelle. | Éditeur + juriste |
| B4 | **Identité de l'éditeur** (nom ou société, adresse) pour les mentions légales et le champ Copyright | Absente du projet. | Éditeur **MANQUANT** |
| B5 | **Révocation « Se connecter avec Apple » à la suppression du compte** | `delete-account` supprime les données mais n'appelle pas l'API Apple de révocation des jetons, exigée par Apple pour les apps qui proposent Sign in with Apple. À coder côté serveur ; nécessite une clé Apple (secret à créer par l'éditeur). | Code (à autoriser) + clé Apple |
| B6 | **Compte de démonstration pour l'examen** | À créer sur la vraie base (production), pas en local. Apple exige un accès complet sans blocage. | Éditeur |
| B7 | **Produits d'abonnement** configurés et « Prêts à soumettre » dans App Store Connect + RevenueCat | Voir `ABONNEMENT.md`. Ils doivent être soumis avec la première version. | Éditeur |
| B8 | **Build TestFlight validé** | Pas encore envoyé : le Mac n'est pas relié. | Mac requis |

## 1. Identité technique (vérifiée dans le code)

- Bundle ID : `fr.aufildenous.app` · Team ID : `L5HM8RN2QD` · ASC App ID : `6827529809` (`eas.json`)
- Version : `0.1.0` · numéro de build : géré à distance par EAS (`appVersionSource: remote`, `autoIncrement`)
- iPhone uniquement (`supportsTablet: false`), portrait.
- Chiffrement : `ITSAppUsesNonExemptEncryption: false` (déjà déclaré).

## 2. Fiche — français (langue principale)

- **Nom** (30 max) : `Au fil de nous` (14)
- **Sous-titre** (30 max) : `Cycle, grossesse et famille` (27)
- **Mots-clés** (100 max, 98) : `règles,ovulation,bébé,biberon,sommeil,allaitement,maternité,parents,enfant,suivi,couches,naissance`
- **Catégorie** : Santé et forme · secondaire : Style de vie
- **Texte promotionnel** (170 max) : `Du cycle à la vie de famille : un seul carnet, privé, à partager avec votre co-parent. Sans publicité, sans revente de données.`

**Description**

Au fil de nous accompagne chaque étape de votre histoire : suivre votre cycle, attendre un enfant, puis veiller sur bébé et les plus grands — seul·e ou à deux.

SUIVRE MON CYCLE
Un calendrier clair, la saisie de votre journée en quelques secondes et des informations prudentes et sourcées. Les dates calculées restent des estimations.

GROSSESSE
Semaine après semaine : repères sourcés, rendez-vous, préparation. Grossesses multiples prises en charge.

BÉBÉ ET ENFANTS
Biberons, repas, sommeil, couches, croissance, vaccins et rappels. À plusieurs dans le foyer, chacun avec ses droits.

UNE BIBLIOTHÈQUE SOURCÉE
Des articles rédigés à partir de sources publiques (Ameli, Santé.fr, Santé publique France…), avec leur statut de relecture affiché.

UNE COMMUNAUTÉ BIENVEILLANTE
Questions, témoignages et groupes, sous pseudonyme, avec modération et signalement.

VOTRE VIE PRIVÉE D'ABORD
Aucune publicité, aucune revente de données. Verrouillage par Face ID, notifications discrètes, export et suppression de vos données à tout moment.

AU FIL DE NOUS PREMIUM
Fonctions avancées (partage avec votre co-parent, résumés, exports PDF, découvertes…). Trois formules au même contenu : mensuelle 10,99 € avec 3 jours d'essai, 6 mois 49,99 €, annuelle 79,99 €. L'abonnement se renouvelle automatiquement sauf résiliation au moins 24 h avant la fin de la période, depuis les réglages de votre compte Apple. Le paiement est débité sur votre compte Apple.
Conditions d'utilisation : [URL MANQUANTE] — Confidentialité : [URL MANQUANTE]

Au fil de nous ne remplace pas l'avis d'un médecin ou d'une sage-femme. En cas d'urgence, appelez le 15 ou le 112.

## 3. Fiche — anglais (facultatif)

L'app est traduite en anglais (FR/EN). Fiche anglaise conseillée :
- Name : `Au fil de nous` · Subtitle : `Cycle, pregnancy and family` (27)
- Keywords (95) : `period,ovulation,baby,bottle,feeding,sleep,breastfeeding,parenting,child,tracker,diaper,newborn`
- Description : traduction fidèle de la section 2 (à générer au moment de la saisie).
- Limite : une partie des articles n'est relue qu'en français (traductions marquées « à relire »).

## 4. Champs légaux et contact

| Champ | Valeur |
|---|---|
| Copyright | `2026 [éditeur MANQUANT]` |
| URL marketing | facultative — **MANQUANT** |
| URL support | **MANQUANT** (B2) |
| URL confidentialité | **MANQUANT** (B1) |
| Contrat de licence (EULA) | Standard Apple, ou les CGU de l'app une fois publiées |
| Contact App Review | prénom, nom, téléphone **MANQUANTS** · e-mail : celui de `brand.json` |

## 5. Confidentialité de l'app (« App Privacy ») — selon le code réel

Pistage : **Non** (`NSPrivacyTracking: false`, aucun SDK publicitaire).

| Type Apple | Données | Liée à l'identité | Finalité |
|---|---|---|---|
| Santé et forme › Santé | cycle, symptômes, grossesse, santé des enfants, humeur | Oui | Fonctionnalités de l'app |
| Informations sensibles | grossesse et naissance, rapports (facultatif, consentement séparé) | Oui | Fonctionnalités de l'app |
| Coordonnées | e-mail, nom affiché | Oui | Fonctionnalités, gestion du compte |
| Contenu utilisateur | photos, documents, publications et commentaires | Oui | Fonctionnalités de l'app |
| Identifiants | identifiant de compte (Supabase, RevenueCat) | Oui | Fonctionnalités de l'app |
| Achats | historique d'abonnement | Oui | Fonctionnalités de l'app |
| Localisation | position précise, seulement à la demande (« Près de chez moi »), envoyée à Google Places, non enregistrée | Non | Fonctionnalités de l'app |
| Diagnostics › Plantages | seulement si Sentry est configuré **et** accepté | Non | Fonctionnalités de l'app |

À ne pas oublier : l'assistant envoie les questions à Google Gemini (consentement « Assistant » séparé, désactivable, nommant le service) — conforme à l'exigence Apple sur le partage avec une IA tierce.

## 6. Autorisations iOS (textes déjà en place)

Caméra, Photos, Face ID, Localisation « pendant l'utilisation » uniquement, Notifications. Aucune localisation en arrière-plan, aucun micro. Textes en français dans `app.config.ts`.

## 7. Classification par âge (questionnaire Apple — réponses proposées)

- Informations médicales ou thérapeutiques : **Fréquentes**
- Thèmes sexuels / contraception (informatif, non explicite) : **Rares**
- Contenu généré par les utilisateurs (communauté) : **Oui** — modération et signalement présents
- Messagerie privée entre utilisateurs : **Non** (aucune messagerie privée dans l'app)
- Accès web libre : **Non**
- Résultat attendu : **18+**, cohérent avec les CGU (« réservée aux personnes de 18 ans ou plus »).

## 8. Notes pour l'équipe d'examen (à coller dans « App Review Information »)

> Au fil de nous is a French parenting companion: cycle tracking, pregnancy follow-up week by week, baby and children tracking (bottles, sleep, growth), a sourced health library and a moderated community. It does not diagnose and always refers to a doctor or midwife.
>
> Demo account: [e-mail and password to be provided by the publisher — B6]. You can also tap "Découvrir sans compte" on the first screen to explore with sample data, without an account.
>
> Premium: three auto-renewable subscriptions in one group (monthly with a 3-day free trial, 6 months, annual). Purchases are validated by Apple through RevenueCat; Premium is only unlocked after server confirmation. "Restaurer mes achats" is in Profil › Abonnement.
>
> Account deletion: Profil › Mon compte › Supprimer mon compte.
> Health data is never used for advertising; there is no tracking. The AI assistant (Google Gemini) is only used after explicit opt-in.

## 9. Captures (6,9 pouces, 1320 × 2868)

Brouillon pris sur la version web de l'app, données de démonstration, bandeau « Démonstration » masqué :
1. Bienvenue · 2. Accueil · 3. Grossesse (26 SA) · 4. Bibliothèque · 5. Communauté · 6. Confidentialité · 7. Premium.

À refaire sur le simulateur iPhone 16 Pro Max à partir du build TestFlight pour avoir la barre d'état iOS réelle.
