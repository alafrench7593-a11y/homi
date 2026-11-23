# C — Audit des écrans (web exporté, démo + Premium)

Dossier : /tmp/claude-0/-home-user-homi/ba6ba70a-99bc-55e5-b74b-dd0c80e0cac5/scratchpad/maitre/C/
Données brutes : balayage.json (matrice route × config), out/*.json (une ligne par page), captures dans out/shots/<langue>_<taille>/ et verif/.
Scripts : worker.js (balayage), agg.py (agrégation), verify.js (captures ciblées). Aucun fichier du dépôt modifié.

## 1. « Neuf écrans problématiques »
Non trouvés. Recherche dans AUDIT*.md, QA-2026-11-02.md, HOMI_GLOBAL_AUDIT.md, docs/audit/*, AGENT_WORKBOARD.md : aucune liste. Seule mention de « 9 écrans » : docs/audit/01_navigation.md:190 (« en-têtes sur 9 écrans », test e2e/navigation.py), sans liste de défauts. Audit exhaustif fait.

## 2. Couverture
- 262 routes (toutes les routes statiques, plus dynamiques avec identifiant réel lu dans la démo : enfant, mission, stock, post, groupe, profil Sam, @maia_et_sohan, articles, outils, etc.) × 4 tailles (320×568, 375×667, 390×844, 430×932) × FR/EN, clair = 2096 pages, plus 40 routes à 390×844 en sombre (FR) = 2136 pages mesurées.
- Langue : choisie d'après navigator.language (contexte Playwright fr-FR / en-US), aucun réglage nécessaire.
- Non testées : /auth/callback (paramètres OAuth) ; 8 dynamiques sans identifiant réel dans la démo : community/album/[id], discover/tool/[id], documents/[id], family/kid-routine/[id], journeys/[id], me/mood/[id], products/[id], scanner/result/[id]. /community/messages/[id] ouvert seulement dans l'état « Conversation indisponible » (aucune conversation en démo).
- Contrôles par page : erreurs console/pageerror, écran blanc, débordement horizontal page et zone, texte hors écran/rogné/tronqué, mot coupé, enfant hors de sa carte, chevauchement d'éléments interactifs, cibles < 44 (et < 24), boutons désactivés, contenu sous la barre du bas après défilement complet (détecteur e2e/audit_ux_detect.js + contrôles ajoutés).
- Résultat à zéro sur les 2136 pages : erreur console, exception, écran blanc, débordement horizontal de la page, enfant hors de sa carte, contenu masqué sous la barre du bas, erreur de navigation.

## 3. Défauts réels (par gravité)
Aucun bloquant, aucun critique.

Moyenne
- D1 /tools — 375, 390, 430 ; FR+EN ; clair+sombre. Libellés courts des tuiles de l'onglet Outils tronqués par « … » (« Ma grossesse semaine par… », « Mes symptômes de… », « Mon poids pendant la… »). src/features/toolHub/ToolTile.tsx:66 (numberOfLines={2}). Capture out/shots/fr_390x844/_tools.png.
- D2 /discover/tools — 320, 375, 390 ; FR. Bouton principal « Commencer » sur 2 lignes avec mot coupé (« Commence / r ») ; « Précédent » coupé à 320 (FR+EN). src/features/discover/Catalog.tsx:73-74 (deux Button flex:1). Capture out/shots/fr_390x844/_discover_tools.png.
- D3 /cinematic et /discover — 320 ; FR+EN. Boutons Précédent / Suivant coupent le mot (« Précéd/ent », « Suivan/t ») ; carte de maquette « Sam s'en occupe » rognée en bas (320 et 375). src/features/discover/Keynote.tsx:173-176. Capture out/shots/fr_320x568/_cinematic.png.

Faible
- D4 /fertility — 320 ; FR. Bouton principal « Mes règles ont commencé aujourd'hui » sur 2 lignes. src/app/fertility/index.tsx (pied de l'écran, probable). Capture out/shots/fr_320x568/_fertility.png.
- D5 /child/{id}/grow, /child/{id}/discoveries, /sleep/help/{childId} — toutes tailles. Dégradé décoratif absolu à left/right -spacing.md : zone de défilement large de 336 px pour 320 (défilement horizontal possible sur web, sans effet visible sur natif). src/app/child/[id]/grow.tsx:100 ; src/app/child/[id]/discoveries.tsx:139 ; src/app/sleep/help/[childId].tsx:71. Capture out/shots/fr_320x568/_child_CHILD_grow.png.
- D6 ~61 routes (bloc « Pour aller plus loin / Replier » sous les outils) — toutes tailles. En-tête repliable 308×24 px (< 44) ; hitSlop 6 ignoré par le web. src/features/ToolArticles.tsx:34-35.
- D7 Cibles de 31 à 41 px : « Fait/Done » 72×40 (/agenda, /calendar), « Tout ajouter » 40 (/consult/questions, /*/consultation), jours des calendriers 41×41 (/cycle/calendar, /fertility/calendar), pastilles 52×32 (/community/notifications, /community/new, /cycle/privacy), avatar communauté 38 (/community/post, /community/u). 238 libellés distincts à 390×844 : liste dans balayage.json (clé matrice, kind cible_tactile_petite).

Faux positifs vérifiés (ne pas corriger)
- /bottle/{id} « 00:00 » et /bottle/scoops « 0 » : signalés tronqués, rendu complet en capture (verif/bottle_390.png).
- /library, /pregnancy/weight : le contenu contient « introuvable ».
- /postpartum/checkin : cibles 26×10 signalées ; les radios mesurent 52×64.
- /sleep/difficult/{id} : liste passant sous le pied fixe (défilement normal) ; /dev/glass : route de dev.
- Mots « coupés » de /settings/appearance et /pregnancy/end : césure avec trait d'union, admise.
- 347 occurrences de bouton désactivé sans explication : boutons « valider » actifs après saisie ; aucun bouton visible sans gestionnaire identifié.

## 4. Clavier (audit statique, pas de clavier sur le web)
Tous les champs des écrans récents passent par `Field` dans `Screen`/`Sheet` (KeyboardAvoidingView, portée clavier, keyboardShouldPersistTaps="handled", keyboardDismissMode="on-drag") : garde/*, family/understand/*, my-info, community/messages/[id] (FlatList + TextInput brut, composer sous KeyboardAvoidingView de Screen). my-place, member/[id], iphone-calendar, features/tour/* : aucun champ. Pavés numériques : `Field` ajoute la barre Suivant/OK sur iOS pour number-pad/decimal-pad/phone-pad (src/components/keyboard.tsx:63) ; garde/[id]/ajouter.tsx (care-ml number-pad, care-temp decimal-pad) en bénéficie ; l'heure utilise numbers-and-punctuation (a une touche Retour).
Points à surveiller (non vérifiables sans téléphone) :
- Bouton d'envoi dans le défilement, sous le champ, donc masqué par le clavier tant qu'on ne défile pas (REVEAL_MARGIN = 24 ne garde visible que le champ) : garde/[id]/messages.tsx:76-78 (care-msg-send-inline), family/understand/inbox.tsx:114-115 et compose.tsx:95-101, request.tsx:53-54, my-info.tsx:54-56, garde/index.tsx:93-94, garde/[id]/photo.tsx:160/197. Champs multilignes : Retour = saut de ligne, donc pas d'envoi au clavier. Seul garde/[id]/ajouter.tsx place l'action dans le pied de Screen (au-dessus du clavier). Gravité faible/moyenne.
- community/messages/[id].tsx:137-149 : TextInput brut à fontSize 16 fixe, maxHeight 140 ; bouton d'envoi 44×44 au-dessus du clavier : conforme. Pas de portée clavier, inutile ici (composer fixé en bas).

## 5. Thème sombre
40 routes à 390×844 (onglets, outils, accueil, missions, stocks, garde, communauté, réglages, couple, scanner, biberon, cycle…) : aucun défaut propre au sombre ; seuls D1 (/tools) et la césure /settings/appearance, identiques au clair. Contrastes non mesurés ; vérification visuelle de l'accueil (verif/dark_home.png).

## 6. Non testable sur le web
Clavier réel (hauteur, barre d'accessoire, Suivant/OK), Dynamic Type natif (fontScale), VoiceOver/TalkBack, safe areas et encoche réelles, hitSlop natif (les cibles ci-dessus sont des boîtes DOM), geste de retour, retour haptique, widgets, caméra/scanner, achats.
