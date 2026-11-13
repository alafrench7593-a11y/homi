# HOMI — Design system

Direction : futuriste premium « Keynote », chaleureuse pour les familles. Verre **lisible**, ombres **physiques**, surfaces **superposées**, mouvement discret. Clair « Perle », sombre « Minuit », mode nuit tamisé (soins à 3 h).

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | Couleurs de thème (**verrouillées**, voir `HOMI_BRAND.md`) + jetons de matière : `glass`, `physicalShadow`, `tintedShadow`, `primaryGradient`, `cardTint`, `bannerColors`, `lines`, `stateVeil`, `elevation`, `radius`, `spacing`, `controlSize`, `typography` |
| `src/theme/motion.ts` | Durées, courbes, ressorts, « Réduire les animations » (hors périmètre de ce document) |
| `src/components/ui.tsx` | Composants de base : `Text`, `Card`, `Button`, `IconButton`, `Fab`, `Chip`, `Segmented`, `Field`, `Banner`, `SectionTitle`, `ListRow`, `Toggle`, `Divider` |
| `src/components/Glass.tsx` | `GlassSurface` : verre + liseré lumineux + ombre physique (utilisée par `Card`) |
| `src/theme/contrast.ts` | Calcul WCAG (mélange des couleurs translucides puis ratio) |
| `src/__tests__/designSystem.test.ts`, `src/__tests__/contrast.test.ts` | Garde-fous de contraste et de matière |

## Principes

1. **Lisible d'abord.** Tout texte ≥ 4,5:1 sur ce qui est réellement dessous (fond **et** les trois arrêts du dégradé de page). Le flou ne compte pas : le remplissage seul doit suffire.
2. **La hiérarchie vient de la matière, pas de la couleur.** Opacité du verre, liseré, ombre. La couleur porte le sens (prune = action, rouge = urgence).
3. **Ombres physiques.** Deux couches : contact (court, net) + ambiance (long, diffus, décalé vers le bas). Encre nuit violette `rgba(42,31,82,·)` en clair, nuit profonde `rgba(6,4,16,·)` en sombre. Jamais `#000`.
4. **Sobriété.** Un seul dégradé d'action (prune vertical, lilas en sombre). Pas de néon, pas d'arc-en-ciel, pas de lueur sur le texte.
5. **Mode nuit = calme.** Ni flou, ni reflet, ni ombre, pas de blanc pur (`glass.night`).

## Jetons

### Surfaces (`glass[theme][level]`)

| Niveau | Usage | Clair | Sombre | Ombre |
|---|---|---|---|---|
| fond | page | `gradient` du thème + `PowderSky` | idem | — |
| `inset` | champs, rails de `Segmented`, pastilles au repos, bouton fantôme | lilas `rgba(236,230,246,0.7)` | `rgba(255,255,255,0.06)` | aucune |
| `raised` | `Card` (= `colors.surface`, inchangée) | blanc 74 % | blanc 7 % | `mid` |
| `floating` | feuilles, menus, `GlassSurface depth={3}`, champ au focus | blanc 88 % | `rgba(50,38,92,0.92)` | `high` |

Chaque niveau a aussi `edge` (liseré), `highlight` (arête supérieure éclairée, dégradé qui s'éteint vers les coins) et `blur` (expo-blur, iOS + web ; Android garde le remplissage). En sombre, un élément **plus haut est plus clair** (`lines.dark.controlFill` = voile blanc 10 % pour les boutons secondaires).

### Ombres
- `physicalShadow('low' | 'mid' | 'high', isDark)` → tableau `boxShadow` (React Native 0.86 : iOS, Android, web). `GlassSurface` : profondeur 1 → low, 2 → mid, 3 → high.
- `tintedShadow(rgb, isDark)` : sous les éléments pleins (bouton principal, pastille choisie, sélecteur, `Fab`), ombre teintée de leur couleur.
- `elevation` (ancien format `shadow*`) reste exporté pour compatibilité.

### Teintes, bandeaux, traits
- `cardTint` : `soft` (perle lilas), `lavender`, `gold`. En sombre, `soft` est lilas : le champagne sur violet tournait au brun.
- `bannerColors(theme)` : `info`, `warning`, `danger`, `demo`, `success` → `bg`, `edge`, `fg` (`fg` testé comme du texte).
- `lines` : `controlFill`, `hairline` (liseré des contrôles), `separator` (dans une carte ; `colors.border` est blanc et invisible sur verre blanc), `track` (interrupteur éteint), `iconWell`, `thumbEdge`.
- `stateVeil` : opacités des voiles de survol et d'appui.

### Forme et rythme
- `radius` : sm 10 · md 16 · lg 24 (cartes, bandeaux) · xl 32 · pill (boutons, pastilles). Champs : 18.
- `spacing` : 4 · 8 · 12 · 16 · 24 · 32 · 48. Marge intérieure des cartes : 16.
- `controlSize` : bouton md 52 · champ 50 · pastille 44 (+ `hitSlop` 2 px → 48). `MIN_TOUCH` = 48.

### Typographie (`typography`)
Familles conservées (déjà chargées, cohérentes avec la marque) : **Space Grotesk** pour les titres (géométrique, « tech » mais ronde), **Manrope** pour le texte (très lisible petit), **Instrument Serif italique** pour la voix du journal (chaleur).
- Échelle : display 56/58 · headingXL 32/36 · headingL 24/30 · headingM 20/26 · bodyL 18/27 · bodyM 16/23 · bodyS 14/20 · caption 12,5/17.
- Approche négative sur les grands titres seulement ; `label` en casse de phrase **sans** approche (0,1) ; `overline` (nouveau) = capitales 12 px gras, approche 1,1, pour les sur-titres (« GROSSESSE · 2 BÉBÉS »).
- `<Text>` applique le plafond d'agrandissement du rôle (`maxScale`) : hero 1,3×, titre 1,5×, texte 1,7×.

## Composants (API inchangée, options ajoutées seulement)

| Composant | Matière et états |
|---|---|
| `Card` | `raised` + liseré lumineux + ombre `mid` (`low` si non pressable). Teintes sans ombre. `night`/`danger` opaques avec liseré. Pressable : échelle 0,985, reflet qui suit le curseur (web). |
| `Button` | `primary` : `primaryGradient` + arête claire + `tintedShadow`. `secondary` : `controlFill` + liseré prune + ombre `low`. `outline`, `ghost` (`inset`), `danger`, `night` (lilas tamisé du thème nuit). Survol = voile clair ; appui = échelle 0,98 + voile nuit (`pressSolidDarken`) ; désactivé = fondu 0,48 sans ombre ni dégradé ; chargement = indicateur à taille constante, `accessibilityState { disabled, busy }`. |
| `IconButton` / `Fab` | Cible 48 px. `Fab` : dégradé + ombre teintée + ombre `high` (élément le plus haut). |
| `Chip` / `Segmented` | Repos `inset`, choisie pleine prune avec ombre teintée ; `accessibilityState.checked`, `role checkbox / radio`. |
| `Field` | `inset` (creux lilas), passe en `floating` + halo prune au focus ; erreur = liseré rouge + message annoncé (`accessibilityLiveRegion`). |
| `Banner` | `bannerColors` : fond teinté + liseré + icône dans une pastille ; `danger` a `role alert`. |
| `SectionTitle` | `headingM` ; nouveaux `overline?` et `subtitle?` (textes fournis par l'appelant, donc traduits). |
| `Toggle` | Rail `track` visible en clair (l'ancien rail blanc disparaissait), pouce avec ombre physique ; `role switch`. |
| `Divider`, `ListRow` | `separator` et `iconWell`. |

Focus clavier web : anneau 2 px de `colors.primary` sur tout rôle interactif (`src/components/WebInteractionStyles.tsx`). Reduce Motion : tous les composants passent par `timeTo` / `springTo` (`useReduceMotion`), états finaux immédiats.

## À faire / à éviter

| Faire | Ne pas faire |
|---|---|
| Prendre une surface dans `glass` ou une teinte dans `cardTint` / `bannerColors` | Écrire `rgba(...)` dans un écran |
| `physicalShadow` / `tintedShadow` | `shadowColor: '#000'`, halos colorés, lueurs néon |
| Un dégradé : `primaryGradient` (vertical, deux teintes voisines) | Dégradés multicolores, texte en dégradé |
| `danger` pour urgences et erreurs seulement | Rouge décoratif |
| Ajouter une surface → l'ajouter à `designSystem.test.ts` | Baisser une opacité de verre sans relancer le test |
| Couleurs de l'ancienne marque : aucune (bruns, cuivres, roses poudrés retirés de `ui.tsx`, `Glass.tsx`, `linkFrame.ts`, `Illustrations.tsx`) | Réintroduire `#6B3F2E`, `rgba(184,134,90,…)`, `rgba(255,250,246,…)` |

## Vérifier

```bash
npx tsc --noEmit -p .
CI=1 npx jest src/__tests__/designSystem.test.ts src/__tests__/contrast.test.ts   # contrastes et matière
node scripts/i18n-scan.js                                                         # aucun texte en dur
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/homi-ds/dist
python3 e2e/spa_server.py /tmp/homi-ds/dist 8832   # puis captures Playwright clair / sombre
```

Non vérifié ici : rendu natif iOS/Android (flou réel, `boxShadow` Android ≥ 9), lecteurs d'écran sur appareil.
