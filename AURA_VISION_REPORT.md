# Aura Vision — rapport de mise en œuvre (24/11/2026)

Branche `homi/fondations`. Regroupe les livrables demandés (architecture, registre d'outils, sécurité, sécurité
médicale, coûts, tests, suivi) en un seul document. **Rien n'est déployé en production** : voir §6.

## 1. Architecture (un seul assistant : Aura)

| Étape | Où | IA ? | Crédits |
|---|---|---|---|
| Reconnaître « cette ordonnance / ce médicament / cette liste / cette écho… » | `src/lib/aura/intents.ts` (`visionDoc`) | non (règles locales) | 0 |
| Proposer l'outil : photo, fichier, code-barres, traitements, listes, carnet | `resolveIntent` → `IntentCard` | non | 0 |
| Enregistrer le document | écrans existants `/documents/scan`, `/documents` | non | 0 |
| Lire le texte (sur demande explicite) | fonction `document-read` | oui (Gemini flash-lite) | 5, débités seulement si lu |
| Relire un document déjà lu | `document-read` (texte serveur en cache) | non | 0 |
| Identifier une boîte de médicament | `/scanner/medicine` + `medicine_lookup` / `medicine_search` (BDPM) | non | 0 |

Règle de détection : un type de document + un geste (photo, scanner, ranger, lire, expliquer, « c'est quoi ») ou
un démonstratif **collé** au document (« cette ordonnance »). « Qu'est-ce qu'une ordonnance ? » et « son médicament
ce matin » ne déclenchent pas la lecture (tests).

## 2. Facturation de la lecture (`document-read`)

- Réservation avant l'appel IA (`credits_reserve`, clé d'idempotence par demande) → un double tap ne débite qu'une fois.
- Échec IA ou document illisible → réservation restituée (`credits_release`) : rien n'est débité.
- Plus de crédits → message clair + lien « Mes crédits » ; IA coupée (`ai.enabled`) → message, saisie manuelle possible.
- Logique partagée avec l'assistant : `supabase/functions/_shared/credits-gate.ts`.
- **Limite** : pas de test automatisé de la fonction elle-même (pas de Deno ici) ; les RPC de crédits sont couvertes
  par les tests SQL existants.

## 3. Maîtrise des coûts — tableau de bord admin

`/admin` → « Coûts IA (30 jours) » (`admin_ai_usage`) : par action, demandes / facturées / restituées / crédits /
comptes ; médiane, 95e centile et maximum de crédits par compte ; coût en euros = **estimation saisie** par la
propriétaire (`admin_set_ai_cost`), « coût inconnu » sinon (jamais 0 € par défaut). Aucun identifiant ni contenu.

**Coûts réels : non mesurés.** Aucun appel facturé n'a été observé dans cet environnement ; les chiffres du message
initial restent des hypothèses tant que la facture Google n'est pas rapprochée des comptages du tableau de bord.

## 4. Sécurité médicale

- Aucune posologie, aucun diagnostic : textes d'Aura, avertissement de l'écran médicament affiché en entier
  (ordonnance / médecin / pharmacien ; centre antipoison ou 15 en cas d'ingestion).
- Médicament identifié par la base officielle (BDPM : ANSM, HAS, Assurance maladie), pas par l'IA ; lien vers la
  notice officielle ; présentation non commercialisée et surveillance renforcée signalées.
- Test SQL : la fiche ne contient ni « posologie » ni « dose ».

## 5. Sécurité / confidentialité

- `ai_cost_estimates`, `medicine_presentations` : aucune lecture directe (RLS sans politique) ; accès par fonctions.
- `admin_ai_usage` / `admin_set_ai_cost` : rôle admin revérifié côté serveur ; refusés aux parents et sans compte.
- `medicine_lookup` / `medicine_search` : compte connecté requis ; recherche limitée (3 lettres, 10 résultats,
  `%` et `_` neutralisés) pour éviter l'aspiration de la table.

## 6. À faire par la propriétaire (production)

1. Appliquer les migrations `20261213000100_admin_ai_usage.sql` et `20261213000200_medicine_bdpm.sql`.
2. Importer la BDPM : `node scripts/bdpm-import.mjs CIS_bdpm.txt CIS_CIP_bdpm.txt > bdpm.sql` puis exécuter
   `bdpm.sql` (20 894 présentations, 17 184 commercialisées, vérifié sur base locale). À refaire chaque mois.
3. Déployer la fonction `document-read` (facturation 5 crédits + cache).
4. Saisir les coûts estimés par action dans `admin_set_ai_cost`.

Hors périmètre ici : VisionKit natif (build requis), hébergement de données de santé (question HDS ouverte),
vidéos 21–25 (campagne non identifiée).

## 7. Tests

| Contrôle | Résultat |
|---|---|
| Jest | 4 754 / 4 754 |
| Base locale (RLS, crédits, coûts IA, BDPM) | 2 872 / 0 |
| Import BDPM complet (base locale) | 20 894 lignes, sans erreur |
| Chromium (démo) | « Explique-moi cette ordonnance » → photo / fichier + avertissement ; « C'est quoi ce médicament ? » → `/scanner/medicine` ; nom « dolip » → 2 fiches ; GTIN-14 du Data Matrix → bonne fiche ; code alimentaire → « aucun médicament » ; admin → carte Coûts IA ; 0 erreur JS |
| iPhone (caméra, Data Matrix réel) | **non testé** (aucun appareil relié) |
