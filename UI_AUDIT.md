# HOMI — Journal d'audit UI (porte de fin, ANTI_SLOP_RULES.md)

Outil : `e2e/audit_ux.py` (version web en démo, 320 × 568, 33 écrans × 5 réglages : clair/sombre, texte 1 et 1,3,
clavier ouvert) + parcours accessibilité (focus, noms, feuilles, Réduire les animations, contraste mesuré en pixels).
Limite : web uniquement ; FPS, mémoire et sensation des gestes sur iPhone réel non mesurés ici.

## 26/11/2026 — passe « anti design générique »

| Constat (avant) | Correction | Après |
|---|---|---|
| Agenda : titre de tâche coupé (« Acheter du lait avant 18 h » réduit à ~70 px) | Petit iPhone (< 360 pt) : l'accessoire « Fait » passe sous le titre (`DayRow`) | corrigé |
| Agenda, texte 1,3 : « 21:00 » affiché « 21… » dans « En bref » | Valeur plafonnée à ×1,15 et réduite si besoin (`BriefStrip`) | corrigé |
| En-tête des outils : mot-symbole « HOMI » recouvert par les boutons Aura et Messages | Mot-symbole affiché seulement s'il tient (`Screen`, mesure des largeurs) | corrigé |
| Onboarding, texte 1,3 : bouton principal sur 2 lignes | Libellé plus court (« Voir une famille exemple ») | corrigé |
| Scanner sombre : « Analyses » à 4,29:1 (reflet du verre) | Libellés de `TodaySummary` en couleur de texte | corrigé |
| « Retour pendant une transition » en échec | Faux positif : l'Accueil vit à `/app` ; contrôle de l'audit corrigé | corrigé |
| Accueil sombre : « N » à 1,09:1 | Faux positif : profil coupé volontairement au bord du carrousel (aperçu du suivant), mesure hors zone visible | connu |

Résultat : 33/33 écrans sans constat bloquant ; accessibilité B : tout vert sauf le faux positif ci-dessus.
Code (règles animate-expo) : `Mon histoire` refaisait l'illustration à chaque image de défilement → progression arrondie (1/20 de chapitre).
Restant connu : 37 fichiers utilisent encore l'API `Animated` de base (pilote natif), à migrer vers Reanimated au fil des écrans touchés ; la feuille `tray` anime sa hauteur.

## 26/11/2026 — site web : pages « univers » (15) et Tarifs
Porte de fin (version site) : rendu inspecté à 320 × 568, 390 × 844, 1280 et 1440 px ; aucun débordement, un seul H1, aucune erreur JS ; e2e menu 20/20.
Anti-slop : outils listés = libellés et descriptions réels du catalogue (aucun outil inventé, build en échec sinon) ; liste à filets plutôt que cartes répétées ; aucun témoignage ni chiffre inventé ; captures réelles « famille fictive ».
Corrigé : liens « Autres univers » 43 px → 46 px (cible ≥ 44). Non vérifié : mode sombre du site (le site n'a pas de thème sombre complet), texte agrandi ×1,3 navigateur.

## 26/11/2026 — site : démo Aura (7 scénarios)
Scénarios limités aux actions reconnues par le code (`AURA_INTENT_KINDS` : log_bottle, start_sleep, multi, add_appointment, prepare_relay, assign_task, open_story) ; marqués « Démonstration, aucune IA appelée ».
Corrigé pendant la porte de fin : 7 boutons empilés + « » » orphelin sur mobile → rangée défilante horizontale, guillemets insécables ; débordement horizontal de 1 500 px (grille sans min-width) → `min-width: 0`. 320/390/1366 : 0 débordement, 0 erreur JS.

## 26/11/2026 — refonte anti-slop des outils (7 lots)
Corrections : décors en dégradé ou en verre retirés des contenus (cartes mates), cibles ≥ 44, chiffres tabulaires et plafonds Dynamic Type, animations continues supprimées, dates sans décalage UTC, retours haptiques et erreurs visibles (vaccins, relais), valeur actuelle mise en avant dans le suivi santé.
Porte de fin : tsc propre ; Jest 4987/4987 ; `e2e/audit_ux.py` = 33 écrans × 5 configurations, 0 bloquant. Seuls signalements restants : des troncatures volontaires (notes repliables) et le faux positif connu « N » à 1,09.
Non vérifié : rendu natif iOS/Android sur appareil ; contraste de primaryText sur les fonds heart/lavender/gold (lots 4 et 7) non mesuré.

## 26/11/2026 — refonte lots 8-10 (allaitement, garde, économie)
Porte de fin : tsc propre ; Jest 4988/4988 ; audit_ux 33 écrans × 5 configurations, 0 bloquant (signalements non bloquants inchangés). Non vérifié : rendu natif sur appareil.

## 27/11/2026 — Live Activities (écran verrouillé, Dynamic Island), réglage et chrono du tire-lait
Porte de fin : tsc propre ; Jest ciblé vert (liveRender : 6 types × 7 régions × clair/sombre × à jour/périmé dans le vrai moteur expo-widgets, aucun nœud non géré ni modificateur inconnu ; liveController ; i18n ; hardcodedColors). Réglage = ToggleRow existant ; chrono tire-lait = GlassButton existants, chiffres tabulaires.
Non vérifié : rendu réel sur iPhone (écran verrouillé, Dynamic Island, troncature du chrono compact), `e2e/audit_ux.py` non relancé pour l'écran Tire-lait et Réglages › Notifications.
## 27/11/2026 — widgets iOS : dix widgets (4 nouveaux) et refonte
Porte de fin (adaptée aux widgets) : rendu exécuté dans le vrai moteur expo-widgets (ExpoWidgets.bundle) pour les 10 vues × 4 formats × clair/sombre × couleur/teinté/vibrant × 6–7 états ; aucun type de nœud non dessiné, aucun slot, chaque texte limité en lignes et réductible, privacySensitive sur les données sensibles ; tsc propre ; Jest widgets, i18n, couleurs verts.
Non vérifié : rendu SwiftUI réel sur iPhone/iPad (tailles réelles, troncatures, mode teinté iOS 18/26), photo « Mon histoire » réellement téléchargée — nécessite le build natif 17.
