# HOMI — film de présentation (Remotion)

Étape actuelle : **animatic** (direction artistique et rythme à valider). Le rendu final 4K 60 i/s viendra après validation.

## Commandes
- `npm run studio` : édition visuelle des 13 scènes (Remotion Studio).
- `npx remotion render src/index.ts Animatic renders/homi-animatic-720p30.mp4 --browser-executable=/opt/pw-browsers/chromium`
- `npx remotion render src/index.ts Master renders/homi-4k60.mp4 …` : même film en 3840×2160, 60 i/s (sans sous-titres incrustés).
- `npx remotion render src/index.ts Scene-s06 …` : une scène seule (corrections ciblées, sans tout re-rendre).
- `node scripts/keyframes.mjs` (`ONLY=s02,s04` possible) : planche de contrôle, 3 images par scène.
- `node scripts/subtitles.mjs` : sous-titres SRT et VTT depuis `src/data/script.ts`.
- `python3 ../e2e/captures_film.py` (depuis la racine du dépôt) : captures RÉELLES de l'app en mode démo.

## Organisation
- `src/data/script.ts` : minutage, voix off, sous-titres (source unique).
- `src/tokens.ts` : couleurs et police (mêmes valeurs que le site et l'app). Dessiné en 1920×1080, mis à l'échelle.
- `src/components/kit.tsx` : téléphone, titres Keynote, cartes en verre, sphère d'Aura, sous-titres.
- `src/scenes/A.tsx` (01–05), `B.tsx` (06–09), `C.tsx` (10–13) : chaque scène est une composition indépendante.
- `public/screens` : 30 captures réelles (version web de l'app, famille fictive). `public/art` : illustrations de l'app.

## Licences
- Remotion 4.0.300 : gratuit pour une structure de 3 personnes au plus (cas d'une entreprise individuelle) ; au-delà, licence entreprise.
- Manrope (SIL Open Font License). Illustrations et captures : propriété de HOMI.
- Aucune musique, voix ni image tierce n'est utilisée à ce stade.

## Limites connues (animatic)
- Pas de voix off ni de musique : aucune voix française naturelle ni musique libre de droits commerciaux disponibles ici.
- Téléphones en 2,5D (CSS 3D), pas de rendu physique Three.js/Blender.
- Captures de la version web (pas de simulateur iOS dans cet environnement).
- Écrans vides en démo (Mon histoire, album, dents, vaccins, documents, courses) ; Aura en démo affiche l'abonnement :
  la scène Aura montre l'écran enfant réel (« Dis-le à Aura… ») et une démonstration animée signalée comme telle.
