# HOMI — Design system

**v3 (13/11/2026) « Désert sci-fi »** — décision du propriétaire : remplace la v2 « Lumière sur graphite ». Synthèse
complète (palettes, Auto, matières, scène, famille de commandes, mouvement) : **`HOMI_DESIGN_SYSTEM.md`**. Ce document
garde les règles de matière et de forme communes.

Clair « ivoire minéral » (verre givré, ombres sable), sombre « obsidienne » (verre fumé, turquoise néon réservé à
l'action), mode nuit tamisé (soins à 3 h, interne à l'écran `/night`). Cinq palettes (**Turquoise** signature, Aurore,
Crépuscule, Menthe, Iris) + Auto selon l'heure locale. Trois matières : **verre optique**, **verre givré / fumé**,
**surface mate**. Fond : scène vectorielle « désert sci-fi » (immersive / calme).

| Fichier | Rôle |
|---|---|
| `src/theme/tokens.ts` | Neutres, `PALETTES`, Auto, `buildTheme(mode, palette)` → `theme.tokens` + `theme.material` (`glass`, `surfaces`, `scene`, `light`, traits, teintes, dégradé principal) + `theme.colors` (rôles historiques). Ombres `physicalShadow`, `tintedShadow`, `haloShadow`, `surfaceShadow` ; `innerLight`. Typographie, rayons, espacements. |
| `src/theme/ThemeProvider.tsx` | Apparence × palette, préférences par compte, Auto, transition de palette |
| `src/components/surfaces/` | `Surface` (`optical` / `frosted` / `matte`), `OpticalGlass`, `FrostedGlass`, `MatteSurface` |
| `src/components/controls/` | `PrimaryButton`, `SecondaryButton`, `SensitiveButton`, `IconOrb`, `ChoiceGroup`, `DataTile`, `Sparkline` |
| `src/components/scene/DesertScene.tsx` | Scène de fond (immersive / calme) |
| `src/components/ui.tsx` | `Text`, `Card` (mate ; `selected` / `emphasis` → `GlowCard`), `Button`, `IconButton`, `Fab`, `Chip`, `Segmented` (→ `ChoiceGroup`), `Field`, `Banner`, `SectionTitle`, `ListRow`, `Toggle`, `Divider` |
| `src/components/Glass.tsx` | `GlassSurface` (compat : mate si opaque, givré si translucide), `LiquidGlass` (→ `Surface`) |
| `src/components/GlowCard.tsx` | Carte lumineuse : filet en dégradé + halo |
| `src/theme/contrast.ts` | Calcul WCAG (mélange des couleurs translucides puis ratio) |
| `src/__tests__/contrast.test.ts`, `designSystem.test.ts`, `homiV2.test.tsx`, `homiV3.test.tsx` | Contrastes (5 palettes × 3 modes × scène × matières + Auto + transitions), matière, préférences, commandes, mouvement |

## Principes

1. **Lisible d'abord.** Tout texte ≥ 4,5:1 sur ce qui est réellement dessous (fond, dégradé, chaque couleur de la
   scène, chaque matière posée dessus, teintes, tuiles), **pour chaque palette, chaque instant de l'Auto et chaque
   étape d'un changement de palette**. Le flou ne compte pas.
2. **La hiérarchie vient de la matière.** Verre optique (scène, commande flottante) > verre givré (navigation,
   panneaux) > surface mate (contenu, listes, formulaires, données — jamais de verre). La couleur porte le sens
   (accent = action ou sélection, rouge = urgence) et le statut a toujours une icône et un libellé.
3. **Ombres douces.** Contact + ambiance ; encre sable en clair (`40,32,20`), quasi noire en sombre (`2,4,5`), jamais
   `#000`. Sous le verre optique et les éléments pleins : ombre **colorée** de la palette, discrète.
4. **La lumière se mérite.** Un seul point focal lumineux par écran : l'action principale ou la sélection active
   (voir `HOMI_DESIGN_SYSTEM.md` § 5). Listes mates, aucune animation continue hors la parallaxe lente du fond.
5. **Mode nuit = calme.** Ni flou, ni reflet, ni halo, ni ombre, scène fixe ; palette atténuée.

## Jetons de matière

### Surfaces (`theme.material.glass[level]` historique, `theme.material.surfaces[kind]` v3)

| Niveau / matière | Usage | Clair | Sombre | Ombre |
|---|---|---|---|---|
| fond | page | scène « désert sci-fi » ivoire minéral (`DesertScene`) | scène obsidienne + turquoise | — |
| `inset` | champs, rails de sélecteur, pastilles au repos, bouton fantôme | `rgba(110,96,70,0.055)` | blanc 5 % | aucune |
| `raised` = `matte` | `Card`, listes, formulaires, données (= `colors.surface`, opaque) | `#FCFBF9` | obsidienne relevée | `low` / `mid` |
| `floating` = `frosted` | panneaux du bas, menus, filtres | blanc 80 % | fumée 82 % | `mid` / `high` |
| `optical` | barre d'onglets, commande flottante, carte de tête | blanc teinté 66 % + lumière interne | fumée teintée 76 % + lumière interne | `high` + colorée |

`edge` (liseré), `highlight` (arête supérieure), `blur` (expo-blur, iOS + web ; Android garde le remplissage).

### Ombres
- `physicalShadow('low' | 'mid' | 'high', isDark)` → `boxShadow` (iOS, Android, web).
- `tintedShadow(theme.material.accentRgb, isDark)` sous les éléments pleins (bouton principal, pastille choisie, `Fab`).
- `haloShadow(theme)` : halo diffus à deux lueurs (GlowCard, validation) ; `surfaceShadow(theme, kind)` (et l'alias `liquidShadow`) : ombre physique + ombre colorée de l'accent sous le verre optique.
- `innerLight(theme, teinte)` : foyer radial des tuiles de données (lumière « de l'intérieur »), borné pour le contraste.

### Teintes, bandeaux, traits
- `cardTintOf(theme)` : `soft`, `lavender`, `gold` (voiles de la palette).
- `bannerColors(theme)` : `info`, `warning`, `danger`, `demo`, `success` → `bg`, `edge`, `fg` (testés sur toute la scène) ; icône par ton (`BANNER_ICON`).
- `linesOf(theme)` : `controlFill`, `hairline`, `separator`, `track`, `iconWell`, `thumbEdge`.
- `stateVeil` : opacités des voiles de survol et d'appui.

### Forme et rythme
- `radius` (v3, coins généreux) : sm 12 · md 18 · lg 26 (cartes, bandeaux) · xl 34 · tile 30 (tuiles de données) · sheet 34 (panneau du bas) · orb 24 · pill (boutons, pastilles, barre, sélecteurs). Champs : 18.
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
