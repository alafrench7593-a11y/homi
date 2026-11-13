# Audit n° 1 — Inventaire et navigation (13/11/2026)

Périmètre : version **web** de démonstration (« Découvrir sans compte »), 390 × 844, français, avec et sans Premium.
iOS et Android n'ont pas pu être exécutés (aucun appareil, pas de Maestro) : voir « Non vérifié » en fin de document.

Robot rejouable : `e2e/audit_navigation.py` (phases `routes`, `free`, `tools`, `sweep`).

```bash
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/audit1/dist
python3 e2e/spa_server.py /tmp/audit1/dist 8971 &
NAV_URL=http://127.0.0.1:8971 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/audit_navigation.py   # toutes les phases
AUDIT_ONLY=/sleep python3 e2e/audit_navigation.py routes                                            # rejouer un cas
```

Sorties : `audit_nav*.json` et `tools_entry.csv` dans `AUDIT_OUT` (défaut `/tmp/audit1/out`). Code de sortie 1 au
moindre défaut bloquant. La matrice outil → point d'entrée de cet audit est `docs/audit/tools_entry.csv`.

## 1. Inventaire

| Élément | Source | Nombre |
|---|---|---|
| Routes (écrans) | `src/lib/routes.generated.ts` (`node scripts/gen-routes.js`) | 230 (229 + `/me/mood/[id]`, ajoutée par le pilote Humeur) |
| dont routes dynamiques | `[id]`, `[slug]`, `[childId]`, `[kind]`, `[topic]`, `[doc]`, `[handle]` | 38 (dont 12 sous `/child/[id]`) |
| Outils du registre central | `src/lib/journeys/tools.ts` (`TOOLS`) → `toolCatalog` | 144 |
| Onglets | `NAV_TABS` (`src/features/hubs/hubMap.ts`) | 5 (Accueil, Santé, Bébé, Famille, Communauté) |
| Anciennes routes d'onglet (liens profonds) | `HIDDEN_TAB_ROUTES` | 6 (`/agenda`, `/track`, `/tools`, `/ask`, `/moi`, `/profile`) |
| Accès directs en tête des hubs | `HUB_ENTRIES` | 7 |
| Inventaire historique | `HOMI_SCREEN_INVENTORY.csv` | 386 lignes (écrans + outils) |

Identifiants de démo réels : enfant de moins de 2 ans (`children`), publication (`posts`), groupe (`community_groups`),
pseudo (`community_profiles.handle`), stock (`household_stocks`), parcours (`user_journeys`) ; contenus statiques :
`/article/a-bout-face-aux-pleurs-de-bebe`, `/meals/me-patate-douce-poulet`, `/guide/illnesses`, `/cycle/guides/clear-fluid`,
`/legal/privacy`, `/fertility/test/ovulation`, `/track/bottle`. La démo ne contient **aucun** document, mission, routine
d'enfant, album, analyse du scanner, produit ou bilan d'humeur : ces 8 routes ont été ouvertes avec un identifiant
inexistant (elles affichent proprement « introuvable », sans plantage) — à revérifier avec des données réelles.

Écrans de parcours (cycle, projet bébé, contraception, grossesse, post-partum) : ouverts avec le parcours actif
correspondant (`e2e/journey_seed.py`), sinon la garde de parcours redirige (comportement voulu).

## 2. Résultats

| Contrôle | Testés | OK | KO |
|---|---|---|---|
| Liens profonds, démo + Premium (chaque route par URL directe, puis « Retour ») | 230 | 230 | 0 après correction (N-02, N-03 corrigés) |
| Liens profonds, sans Premium | 230 | 230 sans plantage : 41 écrans libres ouverts, 189 écrans Premium (attendu) | 0 (voir N-05) |
| Outils ouverts depuis leur point d'entrée normal, puis « Retour » | 144 | voir `tools_entry.csv` | 0 après correction (N-01, N-04) |
| Boutons et liens sans effet (21 écrans principaux, jusqu'à 40 contrôles chacun, actions destructrices exclues) | 21 écrans | — | 7 signalés : 4 attendus (N-08), 3 défauts faibles (N-09) |

Aucun écran blanc, aucune page « introuvable » sur une adresse valide, aucune exception console ni écran d'erreur global
(`error-detail`) sur les 460 ouvertures.

## 3. Constats

### N-01 — Carte d'outil « d'un autre profil » sans effet (majeur, corrigé)
- **Étapes** : démo + Premium → onglet Bébé (profil affiché : grossesse) → « Outils des autres profils » → toucher « Planning de sommeil » (ou, onglet Famille, « Résumé familial du jour »).
- **Attendu** : le profil de l'enfant est sélectionné et l'outil s'ouvre.
- **Observé** : le profil change, la grille se réorganise, l'outil ne s'ouvre jamais (adresse inchangée, 4 s d'attente).
- **Cause** : `ToolCard` appelait `beforeOpen()` (choix du profil) **avant** l'élévation de la carte ; la carte changeait de section, était démontée, `cancelAnimation` interrompait l'élévation et le rappel de navigation n'était jamais exécuté.
- **Correction** : `src/components/ToolCard.tsx` — le profil est choisi dans le rappel d'ouverture, juste avant `openTool` (urgences : inchangé, immédiat).
- **Test** : `src/__tests__/toolCardOpen.test.tsx` (échoue sans la correction) ; E2E : phase `tools` (`kid_sleep_rhythm`, `family_summary` OK).

### N-02 — « Retour » depuis `/sleep/help/<enfant>` ouvre le sommeil d'un enfant « help » (mineur, corrigé)
- **Étapes** : ouvrir `/sleep/help/<id>` par lien direct (notification) → « Retour ».
- **Attendu** : un écran parent valide. **Observé** : `/sleep/help`, interprété comme `/sleep/[childId]` avec `childId = "help"`.
- **Cause** : `parentRoute` acceptait un préfixe correspondant à une route dynamique même quand le segment était fixe dans l'adresse d'origine (et les routes dynamiques étaient essayées avant les routes fixes).
- **Correction** : `src/lib/parentRoute.ts` — routes fixes d'abord ; un segment fixe n'est jamais pris pour un identifiant.
- **Test** : `src/__tests__/parentRoute.test.ts` ; E2E : `AUDIT_ONLY=/sleep … routes` → Retour vers `/baby`.

### N-03 — Profil et sommeil d'un enfant ouverts par lien direct : « Retour » vers l'Accueil (mineur, corrigé)
- **Étapes** : `/child/<id>`, `/child/<id>?tab=croissance`, `/sleep/<id>` par URL directe → « Retour ».
- **Attendu** : l'onglet qui les contient (Bébé). **Observé** : l'Accueil (`/`), l'onglet Bébé n'était plus le parent.
- **Correction** : `SECTION_HOME` (`child`, `sleep` → `/baby`) dans `src/lib/parentRoute.ts`. **Test** : `parentRoute.test.ts` ; E2E `AUDIT_ONLY=/child`.

### N-04 — Outils « pour tout le monde » d'un enfant absents des onglets (moyen, corrigé)
- **Étapes** : démo (profil affiché : grossesse) → onglet Bébé, « Outils des autres profils » dépliés.
- **Attendu** : chaque outil d'un profil suivi est visible dans un onglet. **Observé** : ni « Sommeil » (veille de nuit), ni « Repas », ni « Humeur » de l'enfant, ni « Classements des recettes » : seule la recherche y menait.
- **Cause** : `useOtherProfileTools` écartait **tous** les outils « universels » des autres profils, même quand le profil affiché ne les avait pas.
- **Correction** : `pickOtherTools` (`src/lib/data/hooks-alltools.ts`) : un outil universel n'est écarté que si le profil affiché a le même outil. Effet aussi sur « Tous mes outils » et la recherche.
- **Test** : `src/__tests__/otherProfileTools.test.ts` (garde-fou : tout outil d'un profil suivi est atteignable) ; E2E phase `tools`.

### N-05 — Écran Premium verrouillé : pas de « Retour » (moyen, NON corrigé — propriétaire : Premium / paywall)
- **Étapes** : sans Premium, ouvrir un écran réservé (lien direct, ou depuis Réglages un lien vers `/settings/reminders`).
- **Attendu** : pouvoir revenir à l'écran précédent. **Observé** : `PremiumGate` recouvre tout l'écran, y compris l'en-tête (« Retour ») et la barre d'onglets ; seuls « Mon compte », « Mes données », « Urgences » sont proposés (chacun **empile** un écran de plus). Le retour système (Android, geste iOS, navigateur) fonctionne.
- **Suggestion** : un bouton « Retour » (`router.canGoBack() ? back() : replace('/settings')`) dans `Paywall locked`. Hors de mon domaine (`src/components/PremiumGate.tsx`, `src/features/Paywall.tsx`).

### N-06 — Écrans sans point d'entrée (faible, non corrigé)
- `/premium` : aucun lien dans le code (l'écran Premium est atteint par `/settings/subscription` et l'aperçu). À relier ou supprimer.
- `/community/saved` : aucun lien ; doublon de l'onglet « Enregistrés » du profil communauté. À relier ou rediriger.
- `/nearby` : redirection historique vers `/outings` (voulu).

### N-07 — Fermer « Nuit difficile » / « Aide pour cette nuit » ouverts par lien direct : retour à l'Accueil (faible, non corrigé — propriétaire : Sommeil)
`/sleep/difficult/[childId]` (`goBack()` → `/(tabs)`) et `/sleep/tonight` (`replace('/')`) : à partir d'une notification, « Fermer » mène à l'Accueil plutôt qu'à l'onglet Bébé. Suggestion : `goBack('/baby')`.

### N-08 — Contrôles sans effet attendus (information)
- Avatar « Mon profil » sur `/profile` : on y est déjà (pourrait porter `aria-current`).
- « Nous écrire » (`/settings`) : ouvre l'application de messagerie (`mailto:`), aucun changement dans la page.
- « Semaine du … Revenir à aujourd'hui » (`/agenda`, `/calendar`) : déjà sur la semaine en cours.

### N-09 — Boutons actifs sans effet ni message (faible, NON corrigé — hors navigation)
- `/meals/shopping` « Ajouter » avec le champ vide : rien ne se passe (`addItem` sort en silence). Propriétaire : Courses et stocks. Suggestion : bouton désactivé tant que le champ est vide.
- `/track` (saisie rapide) « Comprendre » avec le champ vide : rien (`analyse` met le résultat à `null`). Propriétaire : Suivi / saisie rapide. Même suggestion.
- `/track` « Dicter » : sans micro (ou refus), `onerror` remet l'état sans aucun message. Propriétaire : saisie rapide. Suggestion : toast « Dictée indisponible ».

## 4. Vérification demandée : Humeur et journal à 320 px (texte × 1,3)

Reproduit sur `/me/mood` et `/me/diary` (build intégrant `854b636`), 320 × 568, avec et sans agrandissement du texte
(même simulation que `e2e/humeur_journal_v3.py`), avant et après le choix d'une humeur :

- **Aucun débordement réel** : `scrollWidth` du document = 320, aucun conteneur décalé (`scrollLeft` = 0), aucun texte à gauche de 0 ni au-delà de 320 px, dans les 6 états mesurés. Le rognage « à gauche » vu sur les captures du pilote n'est pas reproduit : vraisemblablement une image prise pendant l'animation d'entrée (translation horizontale) — à confirmer par le pilote en capturant après la fin de l'entrée.
- **Défaut réel, autre** : après le choix d'une humeur, les 5 pastilles se resserrent et leurs libellés sont tronqués **même à 100 %** (« Très diffi… », « Entre les … », « Plutôt … ») et illisibles à 130 % (« Trè s… », « Bie n »). Propriétaire : pilote Humeur / agent UX (`src/app/me/**`). Suggestion : libellé sous la pastille sur 2 lignes sans ellipse, ou pastilles sur 2 rangées sous 360 px.

## 5. Non vérifié (natif)

- Bouton retour matériel Android, geste de retour iOS, liens universels / schéma `homi://` (ouverture à froid et à chaud), notifications qui ouvrent un écran : non exécutables ici.
- Les 8 routes dynamiques sans données de démo (document, mission, routine, album, analyse, produit, bilan d'humeur, pertes) n'ont été vérifiées qu'avec un identifiant inexistant.
- Comptes réels (Supabase) : la démo locale seulement ; un compte « nounou » (`CAREGIVER_ROUTES`) n'a pas été simulé.
