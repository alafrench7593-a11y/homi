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
