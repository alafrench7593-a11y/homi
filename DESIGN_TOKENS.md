# HOMI — Jetons de design (référence rapide)

Source de vérité : `src/theme/tokens.ts` (ne jamais coder une valeur en dur dans un écran).

| Famille | Valeurs |
|---|---|
| Espacements `spacing` | xxs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · xxl 48 |
| Rayons `radius` | sm 10 · control 14 (boutons, champs) · md 16 · lg 20 (cartes) · xl 24 · tile 20 · sheet 28 · orb 24 · pill 999 (filtres et statuts seulement) |
| Police | Manrope seule (graisses 500 / 700 / 800) ; `typography` : display, headingXL, headingL, … avec `maxScale` par style |
| Couleurs | rôles `theme.colors` + `theme.tokens` / `theme.material` par palette et apparence (clair, sombre, nuit) ; contraste testé (`src/theme/contrast.ts`) |
| Matières | verre optique, verre givré / fumé, surface mate (`src/components/surfaces/`) |
| Mouvement | `duration` (instant 90, micro 150, fast 160, base 240, screen 280, slow 380, entrance 520), courbes `src/motion/curves.ts` |
| Robot Aura | palette noir-blanc-gris (`src/theme/auraBot.ts`, décision du 23/11/2026) |
