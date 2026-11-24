# Scénarios e2e archivés (24/11/2026)

Ces 36 scénarios Playwright ne s'exécutent plus sur l'application actuelle. Relancés le 24/11/2026 sur la
version web à jour, servis aux bons ports, dépendances installées, **et** avec un abonnement simulé
(`e2e/harness_premium`, `E2E_PREMIUM=1`) : **0 réussite sur 36**.

Ils sont gardés ici pour l'historique (ils documentent des parcours et des décisions passées), mais **sortis de la
batterie active** : un scénario qui échoue pour une raison connue et sans rapport avec un bug ne prouve rien, ni dans
un sens ni dans l'autre.

**Aucun vrai bug trouvé derrière ces échecs.** Les éléments encore présents ont été vérifiés : la fonction existe,
fonctionne dans le navigateur et a ses tests unitaires (ex. `family-buy` → `credits.test.tsx`, `aura-event-open` →
`aura.test.tsx`, `tab-household` → `homiDock.test.tsx`).

Couverture actuelle de ces fonctions : Jest (`npm test`, 254 fichiers), base de données (`npm run db:test`), contrôle
des 128 outils dans Chromium (`HOMI_TOOL_QA_INVENTORY.md`), contrôle d'affichage des 315 écrans (390 px, texte normal
et 130 %).

Cinq scénarios d'abord classés ici (`communaute`, `home_today`, `cycle`, `journee_v5`, `missions_scenario_a`)
passaient presque entièrement : ils ont été mis à jour (tutoiement, barre du bas, fiche d'événement) et remis dans `e2e/`.

Pour réactiver un scénario : le réécrire sur l'interface actuelle, le faire passer, puis le remettre dans `e2e/`.

Toujours actifs mais trop longs pour une limite de 7 minutes (à lancer sans limite) : `audit_navigation`,
`audit_saisie`, `iphone_sim`, `partiels2`.

| Scénario | Sujet | Cause de l'échec (journal du 24/11/2026) |
|---|---|---|
| `apparence_v6` | HOMI v6 — Réglages → Apparence et couleurs : cinq palettes + Adaptatif, en clair et en som | élément retiré par une refonte (`palette-homi`) |
| `agenda_abonnement` | Parcours navigateur : lien d'abonnement d'agenda (hors démonstration, faux Supabase). | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`premium-gate`) |
| `apparence_v2` | HOMI v2 — Réglages → Apparence et couleurs (démonstration, sans compte) : | élément retiré par une refonte (`palette-menthe`) |
| `au_fil_de_nous` | « Au fil de nous » dans le navigateur (démonstration, sans compte) : | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`home-story`) |
| `accueil_missions_v3` | Tranche intégrée « Accueil + détail + Missions » (16/11/2026), démo web, petit écran 320 × | élément retiré par une refonte (`home-tool-search`) |
| `aura_demo` | HOMI Aura (20/11/2026) — version web de DÉMONSTRATION sans serveur (« Découvrir sans compt | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`aura-event-open`) |
| `barre_profil_maman` |  | erreur du script : item_stat = os.stat(item)  # Raises FileNotFoundError if doesn't exist |
| `barre_bas_profil` | Profil et barre du bas (HOMI, 13/11/2026) : le profil n'est plus un onglet ; c'est l'avata | erreur du script : playwright._impl._errors.TimeoutError: Locator.click: Timeout 30000ms exceeded. |
| `audit_suivi` | Audit 06 « Outils de suivi et résultats » — démo web, horloge simulée, trois fuseaux. | erreur du script : playwright._impl._errors.TimeoutError: Locator.click: Timeout 30000ms exceeded. |
| `charge_mentale` |  | erreur du script : item_stat = os.stat(item)  # Raises FileNotFoundError if doesn't exist |
| `cocon` | « Le cocon du jour » (accueil d'un profil enfant), version web de démonstration, sans comp | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`cocoon-add`) |
| `coparent_accueil` | Accueil du CO-PARENT (19/11/2026) : à deux comptes sur le faux serveur (e2e/fake_couple.py | élément retiré par une refonte (`aura-intro-backdrop`) |
| `credits_demo` | Crédits HOMI Aura (26/11/2026) — version web de DÉMONSTRATION (« Découvrir sans compte » : | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`family-buy`) |
| `audit_auth` | Audit n° 2 « Authentification et compte » (navigateur réel, faux Supabase avec RLS émulée) | erreur du script : playwright._impl._errors.TimeoutError: Locator.click: Timeout 30000ms exceeded. |
| `da_liquid_glass` | Direction artistique « Liquid Glass » (20/11/2026) — captures et courtes vidéos AVANT / AP | erreur du script : playwright._impl._errors.Error: Page.evaluate: TypeError: Cannot read properties of null (reading 'session') |
| `courses_stocks_scenarios` | Courses et stocks (15/11/2026, phase 6) — scénarios A (complet, étape 8 comprise) et F dan | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`restock-confirm-20b0c8b2-2048-43c1-811c-153f17971006`) |
| `documents` | Documents : scanner, import, lecture, résumé, correction, ordonnance, carnet, profil, rech | erreur du script : IndexError: list index out of range |
| `espace_maman` |  | erreur du script : ValueError: substring not found |
| `demo_assistant` | Démo reliée à l'assistant : la question part vers assistant-demo (serveur simulé ici), com | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`chat-send`) |
| `essentiels` | Tests obligatoires de la réorganisation (version web de démonstration, sans compte). | élément retiré par une refonte (`preg-rubrics-more`) |
| `etape1_auth` | Parcours navigateur de l'étape 1 (inscription et connexion) contre un faux Supabase. | élément retiré par une refonte (`onb-sit-kids`) |
| `medicaments` | Médicaments (07/11/2026) — version web de démonstration : | élément retiré par une refonte (`hub-meds`) |
| `espace_nounou` | Parcours navigateur à TROIS comptes : Espace Nounou (21/11/2026). | erreur du script : item_stat = os.stat(item)  # Raises FileNotFoundError if doesn't exist |
| `nounou_navigation` | Navigation d'un compte qui n'est QUE nounou, et entrée « Garde et nounou » des parents (19 | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`premium-gate`) |
| `offres` |  | élément retiré par une refonte (`tool-offer-buy`) |
| `onglet_agenda` | Agenda du foyer dans la navigation HOMI (13/11/2026) : plus d'onglet « Agenda » dans la ba | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`tab-household`) |
| `paywall_premium` | Écran Premium v2 (15/11/2026) — version web de DÉMONSTRATION (« Découvrir sans compte » :  | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`pw2-plan-annual`) |
| `paywall_premiere_reussite` | Onboarding « première réussite » et paywall de conclusion (03/12/2026) — version web de DÉ | élément retiré par une refonte (`fw-stage-child`) |
| `photo_enfant` |  | erreur du script : item_stat = os.stat(item)  # Raises FileNotFoundError if doesn't exist |
| `photo_profil` |  | erreur du script : item_stat = os.stat(item)  # Raises FileNotFoundError if doesn't exist |
| `outils_absents1` | Outils absents (27/11/2026) — version web de démonstration, vrais gestes, deux personnes d | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`track-save`) |
| `six_outils` | Six outils (07/11/2026), version web de démonstration : | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`kr-open-e935db07-1273-4b8a-875e-4b91491e2be5`) |
| `partiels1` | Numéros partiels complétés (29/11/2026) — version web de démonstration, vrais gestes, deux | élément retiré par une refonte (`cq-list-field`) |
| `social` | Mini-réseau social, fidélisation et Premium, de bout en bout (web de démonstration, donnée | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`home-see-community`) |
| `sommeil` | Planificateur de sommeil de bout en bout (web de démonstration, horloge fixée) : | élément retiré par une refonte (`sleep-item-nap`) |
| `videos_articles` |  | élément présent, atteint par un ancien chemin ou d'anciennes données de départ (`home-videos-tutos`) |
