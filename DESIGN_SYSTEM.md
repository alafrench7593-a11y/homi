# HOMI — Design system

**v2 (13/11/2026) « Lumière sur graphite »** — décision de la propriétaire : la palette perle / prune / lilas /
champagne est remplacée. Synthèse complète (palettes, Auto, jetons, composants, règles du halo) :
**`HOMI_DESIGN_SYSTEM.md`**. Ce document garde les règles de matière et de forme communes.

Clair « Ivoire » (fond ivoire chaud, verre légèrement teinté, ombres douces), sombre « Graphite » (presque noir, pas
violet, surfaces fumées, accents lumineux maîtrisés), mode nuit tamisé (soins à 3 h, interne à l'écran `/night`).
Quatre palettes (Aurore, Crépuscule, Menthe, Iris) + Auto selon l'heure locale.

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | Neutres, `PALETTES`, Auto (`autoPaletteAt`, `blendAccents`), `buildTheme(mode, palette)` → `theme.tokens` (surfaces, texte, accents, bordures, halos, statuts) + `theme.material` (verre, traits, teintes, dégradé principal) + `theme.colors` (rôles historiques). Ombres `physicalShadow`, `tintedShadow`, `haloShadow`. Typographie, rayons, espacements. |
| `src/theme/ThemeProvider.tsx` | Apparence (Système / Clair / Sombre) × palette (Auto / fixe), préférences par compte, minuteur de l'Auto |
| `src/components/ui.tsx` | `Text`, `Card` (+ `selected` / `emphasis` → `GlowCard`), `Button`, `IconButton`, `Fab`, `Chip`, `Segmented`, `Field`, `Banner`, `SectionTitle`, `ListRow`, `Toggle`, `Divider` |
| `src/components/Glass.tsx` | `GlassSurface` (cartes), `LiquidGlass` (barre, feuilles, sélecteurs ; `expo-glass-effect` sur iOS 26+) |
| `src/components/GlowCard.tsx` | Carte lumineuse : filet en dégradé + halo (image 1) |
| `src/theme/contrast.ts` | Calcul WCAG (mélange des couleurs translucides puis ratio) |
| `src/__tests__/contrast.test.ts`, `designSystem.test.ts`, `homiV2.test.tsx` | Contrastes (4 palettes × 3 modes + Auto), matière, préférences, mouvement |

## Principes

1. **Lisible d'abord.** Tout texte ≥ 4,5:1 sur ce qui est réellement dessous (fond, trois arrêts du dégradé, cartes,
   trois niveaux de verre, teintes), **pour chaque palette et chaque instant de l'Auto**. Le flou ne compte pas.
2. **La hiérarchie vient de la matière.** Opacité du verre, liseré, ombre. La couleur porte le sens (accent = action,
   rouge = urgence) et le statut a toujours une icône et un libellé.
3. **Ombres douces.** Contact + ambiance ; encre graphite chaud en clair (`28,24,20`), quasi noire en sombre (`4,4,6`),
   jamais `#000`. Sous les éléments pleins et le verre flottant : ombre **colorée** de la palette, discrète.
4. **La lumière se mérite.** Filet lumineux et halo uniquement sur l'élément choisi / l'action importante / la
   validation (voir `HOMI_DESIGN_SYSTEM.md` § 5). Listes sobres, aucune animation continue.
5. **Mode nuit = calme.** Ni flou, ni reflet, ni halo, ni ombre ; palette atténuée.

## Jetons de matière

### Surfaces (`theme.material.glass[level]`, aide `glassOf(theme)`)

| Niveau | Usage | Clair | Sombre | Ombre |
|---|---|---|---|---|
| fond | page | ivoire + lueurs pastel de la palette (`PowderSky`) | graphite + lueurs retenues | — |
| `inset` | champs, rails de `Segmented`, pastilles au repos, bouton fantôme | `rgba(120,104,80,0.07)` | blanc 5 % | aucune |
| `raised` | `Card` (= `colors.surface`) | blanc teinté 5 % de l'accent, 74 % | blanc teinté, 6,5 % | `mid` |
| `floating` | feuilles, barre d'onglets, menus, champ au focus | blanc teinté 3 %, 88 % | fumée `#1E1F25` 93 % | `high` |

`edge` (liseré), `highlight` (arête supérieure), `blur` (expo-blur, iOS + web ; Android garde le remplissage).

### Ombres
- `physicalShadow('low' | 'mid' | 'high', isDark)` → `boxShadow` (iOS, Android, web).
- `tintedShadow(theme.material.accentRgb, isDark)` sous les éléments pleins (bouton principal, pastille choisie, `Fab`).
- `haloShadow(theme)` : halo diffus à deux lueurs (GlowCard, validation) ; `liquidShadow(theme)` : ombre physique + ombre colorée douce sous le verre flottant.

### Teintes, bandeaux, traits
- `cardTintOf(theme)` : `soft`, `lavender`, `gold` (voiles de la palette).
- `bannerColors(theme)` : `info`, `warning`, `danger`, `demo`, `success` → `bg`, `edge`, `fg` (statuts v2, testés) ; icône par ton (`BANNER_ICON`).
- `linesOf(theme)` : `controlFill`, `hairline`, `separator`, `track`, `iconWell`, `thumbEdge`.
- `stateVeil` : opacités des voiles de survol et d'appui.

### Forme et rythme (inchangés)
- `radius` : sm 10 · md 16 · lg 24 (cartes, bandeaux) · xl 32 (feuilles) · pill (boutons, pastilles, barre, sélecteurs). Champs : 18.
- `spacing` : 4 · 8 · 12 · 16 · 24 · 32 · 48. Marge intérieure des cartes : 16.
- `controlSize` : bouton md 52 · champ 50 · pastille 44 (+ `hitSlop` → 48). `MIN_TOUCH` = 48.

### Typographie (`typography`, inchangée)
Space Grotesk (titres), Manrope (texte), Instrument Serif italique (voix du journal). Échelle : display 56/58 ·
headingXL 32/36 · headingL 24/30 · headingM 20/26 · bodyL 18/27 · bodyM 16/23 · bodyS 14/20 · caption 12,5/17 ;
`overline` en capitales ; plafonds d'agrandissement par rôle.

## Composants (API inchangée, options ajoutées seulement)

| Composant | Matière et états |
|---|---|
| `Card` | `raised` + liseré + ombre `mid`. **Nouveau** : `selected` (carte choisie, filet + halo ; repos : contour discret) et `emphasis` (`'action'`, `'success'`) → `GlowCard`. |
| `Button` | capsule. `primary` : dégradé de la palette en diagonale + arête claire + ombre teintée + **reflet qui glisse** à la pression. `secondary` : `controlFill` + liseré. `outline`, `ghost`, `danger`, `night`. Désactivé, chargement, réussite / échec inchangés. |
| `IconButton` / `Fab` | Cible 48 px. `Fab` : dégradé de la palette + ombre teintée + `high`. |
| Barre d'onglets (`Dock`) | Capsule `LiquidGlass` (ivoire en clair, fumée en sombre ; opaque la nuit) ; pastille active teintée qui glisse ; bouton d'action rond en dégradé avec reflet. |
| `Chip` / `Segmented` / `Toggle` | Capsules ; choisie / allumé = accent (dégradé de la palette pour `Segmented` et `Toggle`). |
| `Field` | `inset`, passe en `floating` + halo d'accent au focus ; erreur = liseré rouge + message + icône. |
| `Banner` | `bannerColors` + icône ; `danger` a `role alert`. |
| `Sheet` | `LiquidGlass` (bords du haut), ressort « doux » Reanimated. |

Focus clavier web : anneau 2 px de `colors.primary` (`WebInteractionStyles.tsx`). Reduce Motion : états finaux immédiats.

## À faire / à éviter

| Faire | Ne pas faire |
|---|---|
| Lire les couleurs dans `useTheme()` (`tokens`, `material`, `colors`) | Écrire `rgba(...)` ou une couleur de palette dans un écran |
| Un seul élément lumineux (`GlowCard`) par écran | Halo sur toutes les cartes d'une liste, lueur en boucle |
| `physicalShadow` / `tintedShadow(theme.material.accentRgb)` / `haloShadow` | `shadowColor: '#000'` |
| Statut = couleur + icône + libellé | Rouge décoratif, statut porté par la couleur seule |
| Nouvelle surface → l'ajouter aux tests de contraste | Baisser une opacité de verre sans relancer les tests |
| Couleurs de l'ancienne marque : aucune (prune `#5B2A86`, midnight `#16112B`, lilas `#CDBEFA`, perle `#F4F0FA`) | Les réintroduire (restes connus : illustrations et quelques modules, voir `HOMI_DESIGN_SYSTEM.md`) |

## Vérifier

```bash
npx tsc --noEmit -p .
CI=1 npx jest --testPathIgnorePatterns=/node_modules/ src/__tests__/contrast.test.ts src/__tests__/designSystem.test.ts src/__tests__/homiV2.test.tsx
node scripts/i18n-scan.js
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/homi-v2/dist
python3 e2e/spa_server.py /tmp/homi-v2/dist 8881 &
NAV_URL=http://127.0.0.1:8881 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/apparence_v2.py
```

Non vérifié ici : rendu natif iOS/Android (GlassView réel, flou, `boxShadow` coloré Android ≥ 9), lecteurs d'écran sur appareil.
