/**
 * Garde-fou des couleurs en dur (HOMI v6, 17/11/2026).
 *
 * Toute couleur d'INTERFACE (fond, texte, bordure, accent, graphique) doit venir des jetons (`useTheme()`,
 * src/theme/tokens.ts) : c'est ce qui permet aux cinq palettes de s'appliquer partout, en clair et en sombre.
 * Ce test compte les couleurs écrites en dur hors du thème et ÉCHOUE si leur nombre remonte.
 *
 * Méthode (identique à l'état des lieux du design system) : dans src/**\/*.ts(x), hors src/theme, src/i18n et tests —
 *  - « hex » : une chaîne qui commence par # suivi de 3, 4, 6 ou 8 chiffres hexadécimaux ;
 *  - « rgba » : un appel rgb( ou rgba(.
 * Liste blanche : illustrations, logo et couleurs SÉMANTIQUES d'un contenu (aliment, catégorie de suivi, donnée
 * de cycle codifiée, carte, document exporté) — elles ne changent pas de sens d'une palette à l'autre.
 *
 * Quand vous remplacez des couleurs par des jetons : BAISSEZ les plafonds ci-dessous (jamais l'inverse). Pour une
 * nouvelle illustration, ajoutez son fichier à la liste blanche avec la raison.
 */
interface Dirent { name: string; isDirectory(): boolean }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { join(...p: string[]): string; resolve(...p: string[]): string; relative(a: string, b: string): string; sep: string };

const SRC = path.resolve('src');
const HEX = /['"`]#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
const RGBA = /rgba?\(/g;

/** Fichiers d'illustration, de logo ou de couleurs sémantiques de contenu (chemins relatifs à src/). */
const ALLOW: Record<string, string> = {
  // code repris (licence MIT) : palettes par défaut jamais utilisées, HOMI passe toujours sa palette de thème
  'components/reacticx/tray/const.ts': 'palettes par défaut de Reacticx (Tray), remplacées par le thème HOMI',
  // widgets iOS : le moteur du widget n'a accès à aucune variable extérieure (ni thème ni jetons), palette locale obligatoire
  'widgets/BabyWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'widgets/SleepWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'widgets/CycleWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'widgets/PregnancyWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'widgets/TasksWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'widgets/PlanningWidget.tsx': 'widget iOS (palette locale, aucun accès aux jetons)',
  'live/LiveActivities.tsx': 'Live Activities iOS (vue du moteur expo-widgets : palette locale, aucun accès aux jetons)',
  // illustrations et logo
  'components/Illustrations.tsx': 'illustrations vectorielles',
  'components/FetusArt.tsx': 'illustration du fœtus',
  'components/FetusOrb.tsx': 'illustration du fœtus',
  'components/BrandLogo.tsx': 'logo',
  'brand/homiMarkSvg.ts': 'logo',
  'brand/toolLogo/appIcon.ts': 'icône de l’app (logo, source vectorielle des exports)',
  'features/recipes/RecipeArt.tsx': 'illustrations des recettes',
  'features/discoveries/FoodArt.tsx': 'illustrations des aliments',
  'features/story/FamilyStoryArt.tsx': 'illustration « histoire de famille »',
  'lib/domain/familyStory.ts': 'personnages de l’illustration « histoire de famille »',
  'features/cycle/GuideArt.tsx': 'illustrations des guides',
  'features/outings/PlaceVisuals.tsx': 'vignettes illustrées des lieux',
  'features/community.tsx': 'avatars illustrés de la communauté',
  // couleurs sémantiques d'un contenu
  'lib/recipes/ingredients.ts': 'couleur de chaque ingrédient',
  'content/discoveries/foods.ts': 'couleur de chaque aliment',
  'features/homiColors.ts': 'une couleur par catégorie de suivi (sommeil, repas, couche…)',
  'features/trackCards.tsx': 'fonds des catégories de suivi',
  'lib/domain/cycleDaily.ts': 'catégories du journal de cycle',
  'lib/domain/cycleHistory.ts': 'courbes codifiées du cycle',
  'app/fertility/mucus.tsx': 'signes de fertilité codifiés',
  'lib/domain/familyPlaces.ts': 'catégories de lieux et style de carte',
  'features/communitySocial.tsx': 'accents et bannières choisis par le membre (contenu)',
  'features/outings/OsmMap.tsx': 'cartographie',
  'features/outings/FamilyMap.tsx': 'cartographie',
  'features/outings/FamilyMap.web.tsx': 'cartographie',
  'lib/documents/pdf.ts': 'document PDF exporté (hors interface)',
};

/**
 * Plafonds hors liste blanche (couleurs d'interface restantes). État des lieux :
 *  - avant la v6 (commit 9e243e7) : 324 hex et 211 rgba dans 80 fichiers (+ liste blanche : 642 hex, 27 rgba, 25 fichiers) ;
 *  - après la v6 (17/11/2026)     : 229 hex et 129 rgba dans 63 fichiers.
 * Ne JAMAIS relever ces nombres : les baisser à chaque nettoyage (restent surtout src/features/cycle3/ui.tsx,
 * src/features/cocoon/Cocoon.tsx et les écrans de sommeil, à reprendre écran par écran).
 */
const MAX_HEX = 229;
const MAX_RGBA = 129;
const MAX_FILES = 63;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || p === path.join(SRC, 'theme') || p === path.join(SRC, 'i18n')) continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

function count() {
  let hex = 0; let rgba = 0; let files = 0; let allowedHex = 0; let allowedRgba = 0;
  const rows: [number, string][] = [];
  for (const f of walk(SRC)) {
    const rel = path.relative(SRC, f).split(path.sep).join('/');
    const s = fs.readFileSync(f, 'utf8');
    const h = (s.match(HEX) ?? []).length;
    const r = (s.match(RGBA) ?? []).length;
    if (!h && !r) continue;
    if (rel in ALLOW) { allowedHex += h; allowedRgba += r; continue; }
    hex += h; rgba += r; files += 1; rows.push([h + r, rel]);
  }
  rows.sort((a, b) => b[0] - a[0]);
  return { hex, rgba, files, allowedHex, allowedRgba, rows };
}

describe('couleurs en dur hors jetons', () => {
  const c = count();
  const top = c.rows.slice(0, 12).map(([n, f]) => `${n} ${f}`).join('\n');

  it('le nombre de couleurs d’interface en dur ne remonte pas', () => {
    const msg = `hex ${c.hex} (plafond ${MAX_HEX}), rgba ${c.rgba} (plafond ${MAX_RGBA}), fichiers ${c.files} (plafond ${MAX_FILES}).\nPassez par useTheme() (tokens, colors, material). Fichiers les plus chargés :\n${top}`;
    expect({ ok: c.hex <= MAX_HEX && c.rgba <= MAX_RGBA && c.files <= MAX_FILES, msg }).toEqual({ ok: true, msg });
  });

  it('liste blanche : chaque fichier existe encore et porte bien des couleurs', () => {
    for (const rel of Object.keys(ALLOW)) {
      const p = path.join(SRC, rel);
      expect(fs.existsSync(p) ? rel : `absent : ${rel}`).toBe(rel);
      const s = fs.readFileSync(p, 'utf8');
      expect((s.match(HEX) ?? []).length + (s.match(RGBA) ?? []).length).toBeGreaterThan(0);
    }
  });

  it('aucun composant ne connaît le nom d’une palette (réservé à src/theme, au store et à Réglages)', () => {
    const NAMES = /\b(PALETTE_SPECS|PALETTE_NAMES|PaletteName|ADAPTIVE_PALETTE|resolvePalette)\b|\.palette\s*===|palette\s*===\s*['"](nacre|graphite|sable|olive|lavande|glacier|rose|amethyste)['"]/;
    // galeries de QA (/dev/*) : elles MONTRENT chaque palette côte à côte (aucun écran de l'application)
    // sélecteur « Personnaliser l'accueil » (features/themePicker) : il PRÉSENTE les huit thèmes, comme Réglages
    const allowed = (rel: string) => rel === 'lib/store.ts' || rel.startsWith('app/settings/') || rel.startsWith('app/dev/') || rel.startsWith('features/dev/') || rel.startsWith('features/themePicker/');
    const offenders = walk(SRC).map((f) => path.relative(SRC, f).split(path.sep).join('/'))
      .filter((rel) => !allowed(rel) && NAMES.test(fs.readFileSync(path.join(SRC, rel), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
