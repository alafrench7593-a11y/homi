# Audit 05 — Outils à saisie (13/11/2026)

Périmètre : les 43 lignes « formulaire/assistant » et « humeur/journal » de `HOMI_SCREEN_INVENTORY.csv` (40 écrans
distincts), plus les formulaires non couverts par les autres audits (rendez-vous, médicaments, listes/valise, réglage
du prénom) et une passe transverse « échec réseau ». Les outils « suivi/mesures » (poids, symptômes du cycle…) relèvent
de l'audit 06 et n'ont pas été modifiés ici.

Tableau détaillé : `docs/audit/tools_saisie.csv`. Parcours rejouable : `e2e/audit_saisie.py` (démo web, 390 × 844,
fr-FR ; partie « échec réseau » avec `e2e/fake_supabase.py`, écritures PostgREST coupées). Tests de régression :
`src/__tests__/saisieAudit.test.tsx` (14 cas, rendu réel sur le backend de démonstration).

## Méthode

Pour chaque outil, depuis son écran : saisie valide → enregistrement → donnée relue dans le stockage de la
démonstration (`toietmoi.demo.v1`) et à l'écran → rechargement → modification / annulation / suppression quand elles
existent → valeurs limites (vide, 0, dates futures ou impossibles comme le 31/02, année 2099, heure 25:00, virgule
française, 2 000 caractères avec emojis, limites `maxLength` mesurées en unités UTF-16 comme le navigateur) → Entrée deux
fois → **double appui** (deux clics dans la foulée, `dblclick`) → réseau coupé.

Constat transverse qui explique la plupart des défauts : le backend local répond en quelques millisecondes, donc le
second appui d'un double appui arrive **après** la fin du premier envoi. Les gardes « en cours » (`busy`, `isPending`,
`loading`) ne suffisent pas : la donnée n'est pas encore relue et l'écran rejoue l'action (doublon) ou déclenche
l'action qui a pris la place du bouton. Correction commune : `src/features/tapShield.ts` (`useTapShield`) ouvre une
fenêtre de 700 ms après un enregistrement réussi pendant laquelle le même geste est ignoré (les numéros d'urgence ne
sont jamais filtrés).

## Défauts corrigés

### Haute

1. **« Comment je me sens » (grossesse) : le double appui masquait l'alerte de sécurité.** Étapes : cocher
   « Saignements », intensité importante, double appui sur Enregistrer. Attendu : cartes d'information et bandeau 15/112
   visibles. Observé : le second appui touchait « Noter autre chose », qui remplace le bouton, et les cartes
   disparaissaient aussitôt. Cause : bouton principal qui change de rôle. Correction : fenêtre anti double appui sur
   « Noter autre chose » (`src/app/pregnancy/feel.tsx`). Test : `saisieAudit` « garde les cartes », e2e `preg_feel`.
2. **Faux succès hors connexion.** Fiche de l'enfant (« Ce qui l'apaise »), humeur de l'enfant (tap et détails),
   moments, soins, mesures et aliments du profil enfant annonçaient « Noté / Ajouté » alors que `insertOrQueue` avait
   seulement gardé la saisie sur l'appareil. Correction : `src/features/saveOutcome.ts` (`toastSaved`) affiche « Enregistré
   sur l'appareil — synchronisation au retour du réseau. ». Preuve : e2e `echec_reseau` (message, rien côté serveur,
   envoi au retour du réseau), test unitaire `toastSaved`.
3. **Doublons au double appui** (une saisie → deux lignes) : carnet de la maison, besoin particulier (deux profils),
   démarches (deux listes), « Je grandis » (deux étapes identiques), humeur de l'enfant (deux notes), prénoms (cœur :
   deux favoris), traitements (deux traitements identiques, donc deux rappels), demandes de relais du mode urgence et de
   « Je craque » (deux notifications au foyer). Corrections : fenêtre anti double appui + garde en cours dans chaque
   écran ; `TreatmentsPanel` (feature partagée Médicaments / besoin particulier). Tests : `saisieAudit` (carnet,
   traitements, besoin + démarches, je grandis, humeur, urgence), e2e correspondants.

### Moyenne

4. **« Je suis à bout » : le double appui quittait le résultat** (ouvrait « Temps pour moi » à la place du point
   affiché). Correction : boutons du résultat filtrés juste après l'affichage (`src/app/family/exhausted.tsx`).
5. **Journal de contraception : fausse erreur.** Le second appui sur « Noter » (choix déjà remis à zéro) affichait
   « Choisissez d'abord ce que vous ressentez » juste après « Note enregistrée ». Correction : fenêtre + garde d'envoi.
6. **Journée difficile : demande d'aide renvoyable.** Après rechargement, « J'ai besoin d'aide aujourd'hui » était de
   nouveau actif alors qu'une demande ouverte du jour existait (doublon envoyé au foyer). Correction : la demande du jour
   est relue depuis `care_requests`.
7. **Rendez-vous : suppression en échec muette.** La promesse rejetée n'était pas gérée (aucun message, rappel déjà
   supprimé avant le rendez-vous). Correction : suppression du rendez-vous d'abord (le rappel suit en cascade), message
   d'erreur, fiche laissée ouverte. Test : `saisieAudit` (panne injectée).
8. **Prénoms : la saisie était effacée après un échec d'ajout.** Correction : le champ n'est vidé qu'en cas de succès.
   Preuve : e2e `echec_reseau.prenom_saisie_conservee`, `saisieAudit`.
9. **Modifier la grossesse : formulaire initialisé depuis le cache local périmé.** Rouvert juste après un
   enregistrement (ou après un changement fait sur un autre appareil), il affichait les anciennes valeurs et les aurait
   réenregistrées. Correction : le brouillon attend la relecture (ou la pause hors connexion) avant de se remplir.
   Preuve : e2e `preg_edit.persiste`.
10. **Dates avant la naissance acceptées** dans « Ses découvertes » (dégustation au 01/01/2001) et « Je grandis »
    (étape observée). Correction : refus avec le message existant « La date précède la naissance. ». Tests : e2e
    `baby_foods`, `kid_grow`, `saisieAudit`.

## Défauts vus hors périmètre (non corrigés ici)

| Gravité | Constat | Propriétaire suggéré |
|---|---|---|
| **Haute** | Après la fusion de `homi/fondations` (b6fc1ae) : en démonstration, chaque rechargement complet (ou réouverture de l'onglet) renvoie vers `/welcome` ; il faut retoucher « Découvrir sans compte » (les données sont conservées). Cause probable : `src/lib/auth.tsx` attend `useIsRestoring` puis s'abonne à `backend.auth.onChange` avant que `initBackendMode` ait rebasculé sur la démonstration → abonnement au vrai backend, session nulle, redirection. `e2e/audit_saisie.py` contourne (reprise de la démo, réouverture sans rechargement) et le signale dans `hors_perimetre.demo_rechargement`. | agent 2 (auth) |
| Moyenne | `ConsultationChecklist` (`src/components/Fertility.tsx`) ajoute une question identique à une question déjà listée (4 écrans « Mes questions »). | agent UX (composants partagés) |
| Moyenne | `Screen` (`src/components/Screen.tsx`) jette la promesse du bouton d'action (`action.onPress()` sans `return`) : la garde anti double appui intégrée à `Button` ne s'applique à aucun bouton principal d'écran. | agent UX |
| Basse | `Sheet` s'ouvre au cran moyen : sur le web (souris, clavier) le bouton Enregistrer des longues feuilles (rendez-vous, carnet, traitements, profil enfant) est hors de l'écran tant qu'on ne tire pas la poignée. | agent UX |
| Basse | Poids de grossesse : notes sans `maxLength` alors que la base limite à 1 000 caractères ; « Mesure enregistrée » même quand la saisie est seulement gardée hors connexion. | audit 06 (suivi/mesures) |
| Basse | Point du jour post-partum : un double appui renvoie à l'espace post-partum puis le second appui y rouvre le point du jour (aucune donnée en double). Non corrigé : l'appui arrive sur l'écran suivant. | agent 1 (navigation) |

## Cas bloqués (web)

- Scanner produit / aliment : lecture du code-barres par la caméra ; vérifié par saisie du code (assistant complet,
  analyse unique, pas de note /100).
- Documents : numérisation par la caméra et sélecteur natif ; recherche et liste vérifiées.
- Assistant (onglet) : l'assistant IA en ligne affiche « Bientôt disponible », il n'y a pas de saisie ; le repli
  « Chercher dans les articles » est vérifié (`local_ai`).

## Règles métier vérifiées

Aucune dose calculée (traitements : la dose est recopiée telle quelle, `aucune_dose_calculee`), aucun diagnostic
(« Je suis à bout », besoin particulier, démarches, symptômes de grossesse), aucune donnée inventée ; les dates de
grossesse restent celles saisies (terme invraisemblable refusé, pas recalculé).

## Commandes exécutées

```bash
git merge homi/fondations            # b6fc1ae
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/audit5/dist5
python3 e2e/spa_server.py /tmp/audit5/dist5 8994 &
PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8994 python3 e2e/audit_saisie.py
npx tsc --noEmit ; node scripts/i18n-scan.js ; node scripts/gen-routes.js --check
CI=1 npx jest --forceExit --maxWorkers=2 --testTimeout=90000 --testPathIgnorePatterns=/node_modules/
```

Note : `npx expo lint` n'a pas été lancé (aucune configuration ESLint dans le dépôt ; la commande en créerait une).
