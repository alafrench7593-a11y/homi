# HOMI — Design system v2 « Lumière sur graphite » (13/11/2026)

Décision de la propriétaire : la palette perle / prune / lilas / champagne est **remplacée**. Deux références :
**image 1** (fond presque noir, cartes sombres aux grands coins, filet lumineux en dégradé + halo diffus coloré) et
**image 2** (« Liquid Glass » : verre translucide, arêtes claires, commandes capsule, ombre colorée douce).

Fichiers : `src/theme/tokens.ts` (palettes, Auto, jetons, matière), `src/theme/ThemeProvider.tsx` (résolution),
`src/components/Glass.tsx` (`GlassSurface`, `LiquidGlass`), `src/components/GlowCard.tsx`, `src/components/ui.tsx`,
`src/components/Dock.tsx`, `src/components/Overlays.tsx` (`Sheet`), `src/motion/PressSheen.tsx`,
`src/motion/TaskComplete.tsx`, `src/app/settings/appearance.tsx`. Tests : `src/__tests__/contrast.test.ts`,
`src/__tests__/designSystem.test.ts`, `src/__tests__/homiV2.test.tsx`. E2E : `e2e/apparence_v2.py`.

## 1. Deux réglages indépendants (Réglages → Apparence et couleurs)

| Réglage | Valeurs | Défaut | Stockage |
|---|---|---|---|
| Apparence | Système, Clair, Sombre | Système | `themePreference` |
| Palette | Auto, Aurore, Crépuscule, Menthe, Iris | Auto | `palettePreference` |

- **Aperçu immédiat** : le thème est recalculé à chaque choix ; la carte d'aperçu en tête de l'écran montre carte
  sélectionnée, coche de validation, bouton principal (avec reflet), bouton secondaire, interrupteur, quatre statuts.
- **Persistance** : store `toietmoi.ui` (AsyncStorage / localStorage), restauré au lancement.
- **Par compte** : `appearanceByUser[userId] = { theme, palette }` + `appearanceOwner`. À chaque changement de
  session, `ThemeProvider` appelle `switchAppearanceOwner(userId)` : les choix du compte sont chargés (Système + Auto
  pour un compte jamais vu ; le premier compte vu garde les choix déjà faits sur l'appareil). Ce qu'un membre du
  foyer choisit ne change rien pour les autres. **Pas de synchronisation serveur** des préférences d'interface
  (aucune table existante ne les porte ; `src/lib/backend/**` et `supabase/**` hors périmètre) : un même compte sur
  deux appareils garde deux réglages indépendants.
- **Valeurs héritées** : `themePreference = 'auto'` (ancien « clair/sombre selon l'heure ») est lu comme « Système » ;
  `'night'` reste accepté (scénarios E2E existants) mais n'est plus proposé.
- **Mode nuit (soins nocturnes)** : comportement interne, inchangé — activé par l'écran `/night` (`nightMode`),
  prioritaire sur l'apparence ; graphite très tamisé, accents de la palette mêlés de gris (35 %), ni flou, ni halo,
  ni ombre ; mouvement `minimal`.

## 2. Palettes

Chaque palette = deux accents, en **encre** (clair : texte, icônes, boutons à texte blanc) et en **lueur** (sombre :
texte coloré, filets, halos). Tous ≥ 4,5:1 (testé sur fond, dégradé, cartes, trois niveaux de verre, teintes).

| Palette | Encre clair (a / b) | Lueur sombre (a / b) | Esprit |
|---|---|---|---|
| Aurore | `#0A6176` / `#5E36C4` | `#6FE3F5` / `#C4B2FF` | cyan + violet, la signature (défaut des exports statiques) |
| Crépuscule | `#A63A1C` / `#8A4D00` | `#FF9C84` / `#FFC56E` | corail + ambre |
| Menthe | `#0A6459` / `#256A28` | `#5EE6D0` / `#93E89A` | turquoise + vert |
| Iris | `#4540C8` / `#A11F60` | `#A9B2FF` / `#F7A4CF` | indigo + rose |

Neutres : ivoire `#F4F1EB` (dégradé `#FAF8F4 → #F4F1EB → #EEEAE3`), encre `#1C1B20` / `#55525C` ; graphite
`#0D0E11` (dégradé `#17181C → #0D0E11 → #0A0B0D`, neutre, pas violet), perle `#F3F2F5` / `#A9A8B3` ; nuit `#09090C`.

### Auto (heure LOCALE du téléphone)

| Dès | Palette | Pourquoi |
|---|---|---|
| 06:00 | Menthe | matin frais et calme (réveil, petit-déjeuner) |
| 11:00 | Aurore | journée : lumière nette et neutre |
| 17:00 | Crépuscule | fin de journée : chaleur du coucher de soleil (école, repas, bain) |
| 21:00 | Iris | soir et nuit : indigo apaisé (couchers, réveils nocturnes) |

Transition : fondu de **60 min centré** sur l'heure prévue (30 min avant → 30 min après), **par paliers de 5 min**
(≈ 8 % de la différence à chaque palier) ; interpolation RVB des encres et des lueurs (`blendAccents`). Déterministe
(aucun hasard), continue à minuit. Un seul minuteur, programmé au prochain palier (`autoPaletteAt(d).next`) et
recalculé au retour au premier plan ; hors fondu, aucun rendu supplémentaire. Aperçu sans changer l'heure : puces
« Matin · 08:00 / Journée · 14:00 / Fin de journée · 19:00 / Soir · 23:00 » (`skyOverride`).

## 3. Jetons (`theme.tokens`, une source par rôle)

| Groupe | Jetons | Rôles historiques alimentés (`theme.colors`) |
|---|---|---|
| Surfaces | `background`, `card`, `glass`, `glassStrong`, `opaque` (repli) | `background`, `surface`, `surfaceAlt`, `gradient` |
| Texte | `primary`, `secondary`, `onAccent` | `text`, `textMuted`, `primaryText` |
| Accents | `accent`, `accent2`, `gradient` [a, b], `glow` [a, b] | `primary`, `lavender`, `accent`, `accentSoft` |
| Bordures | `rest` (repos), `active` | `border` |
| Halos | `color`, `color2`, `intensity` (clair 0,32 · sombre 0,5 · nuit 0) | — |
| Statuts | `success`, `warning`, `danger`, `info` (clair / sombre / nuit) | `success`, `warning`, `info`, `danger` |

Matière dérivée (`theme.material`) : `glass` (inset / raised / floating), `lines`, `cardTint`, `primaryGradient`,
`accentRgb`, `accent2Rgb`. Aides : `glassOf(t)`, `linesOf(t)`, `cardTintOf(t)`, `primaryGradientOf(t)`,
`haloShadow(t)`, `liquidShadow(t)`. Les exports statiques (`themes`, `glass`, `lines`, `cardTint`,
`primaryGradient(isDark)`) restent disponibles pour les anciens imports, sur la palette Aurore.

## 4. Composants

| Composant | Usage | Détails |
|---|---|---|
| `GlowCard` / `<Card selected>` / `<Card emphasis>` | carte sélectionnée, action importante, validation | filet SVG en dégradé de la palette (1,5 px) + halo `boxShadow` coloré à deux lueurs ; au repos : contour statique discret. Activation : halo 0 → 1 en ressort « doux » (échelle 0,97 → 1), filet en fondu 240 ms, faisceau unique 720 ms (transposition RN de Magic UI « Shine Border » / « Border Beam », sans code web). `still` : aucun mouvement (listes). `role="radio"` pour les sélecteurs. |
| `LiquidGlass` | barre d'onglets, feuilles du bas, sélecteurs | iOS 26+ : `GlassView` d'`expo-glass-effect` (si `isLiquidGlassAvailable()` **et** `isGlassEffectAPIAvailable()`) + voile de lisibilité ; iOS ancien / web : `BlurView` + remplissage ; Android, « Réduire la transparence », nuit : remplissage opaque. Dégradé pastel de la palette, arête claire, ombre colorée douce. |
| `Button` (capsule) | `primary` : dégradé de la palette en diagonale, ombre teintée, **reflet bref qui glisse** à la pression (`PressSheen`, 520 ms, une traversée). Autres variantes inchangées (couleurs v2). |
| `Segmented`, `Toggle`, `Chip`, `Field` | capsules ; pastille de `Segmented` et interrupteur allumé en dégradé de la palette |
| `Sheet` | panneau du bas en `LiquidGlass`, ressort « doux » (Reanimated, interruptible), fermeture 240 ms |
| `Dock` | capsule `LiquidGlass` (claire en clair, fumée en sombre) + bouton rond en dégradé avec reflet ; dans la feuille d'ajout, l'action « Poser une question » est la seule `GlowCard` |
| `CompletionCheck` + `CompletionGlow` (`@/motion`) | passage d'une tâche à « terminé » | disque en dégradé (ressort « rebond léger »), coche tracée 240 ms, anneau de lumière 520 ms, haptique « succès » ; halo bref (180 + 720 ms) autour de la ligne. Pour l'Accueil et les listes de tâches. |

## 5. Règles du halo et du filet

1. **Un seul élément lumineux à la fois** par écran : la carte choisie, l'action importante ou le moment de validation.
2. **Jamais pour toute une liste** ; dans une liste, `still` (pas de mouvement) et contour statique au repos.
3. **Aucune animation continue** : le faisceau et le halo de validation sont des « one-shots ».
4. **Nuit** : pas de halo (intensité 0), pas de faisceau ; fondu court seulement.
5. **Statuts** : couleur + icône + libellé, jamais la couleur seule (`BANNER_ICON`, pastilles de statut). Dans
   Crépuscule, le rouge d'erreur et le corail sont proches : l'icône et le libellé portent le sens.
6. **Réduire les animations / économie d'énergie** (`useMotion().off`) : état final immédiat, ni reflet, ni faisceau,
   ni anneau, ni halo.

## 6. Non vérifié ici

Rendu iOS natif (GlassView réel, flou), Android (boxShadow coloré ≥ API 28), FPS / ProMotion, VoiceOver / TalkBack
sur appareil. Vérifié : TypeScript, Jest (contrastes 4 palettes × 3 modes + 288 instants de l'Auto), export web,
captures Chromium (deviceScaleFactor 2), E2E Playwright (dont `reducedMotion: 'reduce'`).
