# Audit n°6 — Outils de suivi et résultats

Établi le 13/11/2026 sur `homi/fondations` (≥ `6a870da`). Périmètre : outils `type_outil` « suivi/mesures » (28) et
« minuteur/session » (9) de `HOMI_SCREEN_INVENTORY.csv`, plus les écrans de synthèse (accueil, onglet Suivi, résumé
pour un rendez-vous, stocks, humeur de la semaine). Détail outil par outil : `docs/audit/tools_suivi.csv`.

## 1. Méthode

- **Jeux de test calculés à la main** : `src/__tests__/fixtures/auditSuivi.ts` (sommeils autour du 29/03/2026 et du
  25/10/2026, semaine de biberons avec deux jours sans saisie et une quantité bue non notée, cycle régulier de 28 jours
  traversant février). Chaque attendu est justifié en commentaire.
- **Tests Jest** : `src/__tests__/audit_calculs.test.ts` (34 cas, fuseau Europe/Paris ; New York et Auckland via les
  fonctions à fuseau explicite). Les 10 cas « RÉGRESSION » ont été exécutés sur le code d'origine : **tous rouges**,
  puis verts après correction.
- **Parcours web** : `e2e/audit_suivi.py` (démo locale + Premium, horloge Playwright simulée, contextes
  `Europe/Paris`, `America/New_York`, `Pacific/Auckland`) : 13 vérifications, toutes vertes.
- Conventions vérifiées : jours sans saisie = trou (jamais 0 dans une moyenne), période vide = état explicite,
  premier/dernier jour inclusifs, SA ≠ semaines de grossesse (SG = SA − 2, terme 41 SA = DDR + 287 j), cycle = estimations
  avec avertissement « ne permettent pas de l'éviter », aucun « jour sans risque », aucune dose calculée.
- Unités : l'application ne propose que **ml, kg, cm, °C** (aucune conversion oz/lb n'existe) ; les décimales sont saisies
  à la virgule et relues correctement.

## 2. Constats par gravité

### Haute

**H1 — « Lait bu par jour (ml) » comptait le lait seulement préparé** (onglet Suivi, `src/app/(tabs)/track.tsx`).
- Étapes : noter un biberon préparé 180 ml sans quantité bue ; ouvrir Suivi → Tendances.
- Attendu : 0 ml bu ce jour-là. Observé : 180 ml (valeur `consumed_ml ?? prepared_ml`) — une donnée inventée, dans
  un graphique destiné à préparer un rendez-vous.
- Correction : `drunkMl` (`src/lib/domain/daily.ts`) = quantité bue notée seulement.
- Preuves : Jest « RÉGRESSION graphique » ; e2e `B_graphique_lait_bu_vendredi_0` (« ven : 0 ml, lun : 270, dim : 240 »).

### Moyenne

**M1 — Journées de 23 h / 25 h : sommeil mal réparti** (`sleepEstimate.sleepDay`, `daily.summarizeDay`,
`sleepPlanner.weekView`). La fin de journée était « début + 24 h » au lieu du lendemain 0 h.
- 29/03/2026 : un sommeil commencé le 30 à 0 h 30 était compté le 29 (et le 30 dans le planning) ; l'accueil affichait
  660 min de sommeil au lieu de 570.
- 25/10/2026 : une sieste de 23 h 30 disparaissait de la journée ; l'accueil affichait 60 min au lieu de 140.
- Effets : « Aide pour la nuit » (moyennes, changements d'habitude), planning de sommeil (semaine, tendances), accueil.
- Correction : bornes en heure locale `new Date(a, m, j + 1)`. Preuves : 4 cas Jest « RÉGRESSION ».

**M2 — Résumé pour un rendez-vous : période décalée d'une heure** (`summary.periodStart`).
- « 7 jours » le 31/03 commençait le 24/03 à 23 h (une heure de la veille incluse) ; le 27/10, le 21/10 à 1 h (la
  première heure exclue) ; « depuis le dernier rendez-vous » idem. Correction : jours calendaires locaux ; un jour de
  25 h n'est plus présenté comme « plusieurs jours ». Preuves : 3 cas Jest.

**M3 — Courbes de poids (grossesse) et de croissance : la veille s'affichait à l'ouest de Greenwich**
(`src/app/pregnancy/weight.tsx`, `src/features/child.tsx`). La date `AAAA-MM-JJ` (minuit UTC) était formatée dans le
fuseau local : à New York, une mesure du 01/03 apparaissait « 28 févr. » sur l'axe (« févr. 26 » sur la courbe de
croissance). Correction : abscisse à 0 h UTC et étiquettes lues en UTC. Preuve : e2e `E_poids_axe_1_mars_new_york`.

**M4 — Chronomètre de tétée : durée figée au retour d'arrière-plan** (`src/app/track/[kind].tsx`). La durée
enregistrée reprenait la dernière valeur affichée (rafraîchie chaque seconde par un minuteur suspendu en arrière-plan) :
« Arrêter et enregistrer » juste après le retour perdait tout le temps passé en arrière-plan. Correction : durée relue
sur l'horloge à l'arrêt. Preuve : e2e `F_tetee_duree_5_min_apres_arriere_plan` (301,6 s enregistrées pour 5 min).

### Basse

**B1 — Âge d'un enfant né un 31** (`child.childAge`) : le 02/03 pour un enfant né le 31/01, « 1 mois » au lieu de
« 1 mois et 2 jours » (31 février = 3 mars) ; le 28/02, « 4 semaines ». Convention fin de mois alignée sur
`vaccineRules.addMonthsISO` (31/01 + 1 mois = 28/02). Preuve : Jest « RÉGRESSION né un 31 ».

**B2 — Âge pour le planning de sommeil** (`sleepPlanner.planningAge`) : entre 0 h et 1 h après le passage à l'heure
d'été, un jour de moins (30 j au lieu de 31 pour un enfant né le 01/03, donc 0 mois au lieu de 1). Correction : jours
calendaires. Preuve : Jest « RÉGRESSION âge pour le planning ».

## 3. Validés sans défaut (extraits)

Biberons (tuiles jour/7 jours, fuseaux, 23 h 50 / 0 h 10, rechargement, historique vide explicite), session biberon
(pause, reprise, arrière-plan, deux sessions simultanées, chiffres stables), rappel « + 3 h 30 » à travers le
changement d'heure (instant absolu), nuit de 9 h réelles le 28→29/03, grossesse (34 SA = 32 SG, J-49, 41 SA au terme,
29/02/2028), cycle (estimations, cycles non saisis, fiabilité), statistiques du cycle (durées inclusives, février),
mesurettes (jamais d'arrondi silencieux), post-partum et « Mon sommeil » (trous, moyennes sur les jours notés), semaine
ISO de l'humeur (2026-S53), stocks (miroir de `household_stocks_guard`), vaccins (fins de mois).

## 4. Bloqués / non couverts

- 12 outils sans calcul de mesure (journaux, listes : scanner, examens, tests, glaire, PMA, rapports, dents,
  cicatrisation, symptômes, « Je décroche ») : rien à recalculer ; non rejoués dans ce passage.
- **Onglet Suivi, période « 30 jours »** (Premium) : le sélecteur recharge 30 jours de données mais les graphiques restent
  plafonnés à 7 barres (`Math.min(chartDays, 7)`, `SleepNights days={7}`) : changer de période ne change rien à l'écran.
  Non corrigé : un graphique à 30 barres lisible demande une évolution de `BarChart` (`src/components/Charts.tsx`, zone
  agent UX). À coordonner.

## 5. Hors périmètre (signalés)

- `src/components/Charts.tsx` (agent UX) : l'axe vertical de `LineChart` écrit `62.7` (point décimal) au lieu de `62,7`
  en français (`v.toFixed(1)`), visible sur la courbe de poids.
- `src/app/today.tsx` : `sleepDays` compte des jours UTC (`started_at.slice(0, 10)`) pour l'aperçu Premium du planning ;
  sans effet sur un résultat affiché (seuil d'affichage d'une invitation).
- `src/lib/domain/daily.ts` `summarizeDay.bottleMl` (accueil « {ml} ml aujourd'hui ») additionne la quantité bue, à
  défaut la quantité préparée : comportement documenté par un test existant (`domain.test.ts`) et libellé neutre ;
  laissé tel quel, à trancher par le produit (même règle que H1 ?).

## 6. Commandes

```bash
CI=1 npx jest --forceExit --maxWorkers=2 --testTimeout=90000 --testPathIgnorePatterns=/node_modules/
npx tsc --noEmit ; node scripts/i18n-scan.js ; node scripts/gen-routes.js --check
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/audit6/dist
python3 e2e/spa_server.py /tmp/audit6/dist 8976 &
PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8976 python3 e2e/audit_suivi.py
```
