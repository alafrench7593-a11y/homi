/**
 * Ajustement de la mise en page au texte RÉEL (logique pure, testée : src/__tests__/layoutFit.test.ts).
 *
 * Audit 09 : sur 320 × 568 avec le texte agrandi (1,3), les titres géants occupaient 3-4 lignes, les libellés des
 * orbes étaient coupés au milieu du mot (« Très diffi-… ») et l'en-tête d'écran mangeait la zone de saisie. Ces
 * fonctions décident AVANT le rendu, à partir d'une estimation prudente de la largeur des mots, de la taille du
 * titre et de la disposition des orbes. Aucune ne coupe un mot : un mot qui ne tient pas fait réduire (titre) ou
 * passer à la ligne (orbes).
 */

/**
 * Chasse des caractères (em), mesurée sur Manrope 700 et Space Grotesk 700 (canvas, 100 px) puis arrondie AU-DESSUS :
 * lettres fines (i, l, ponctuation), moyennes (f, t, r), larges (m, w), capitales, chiffres. `CHAR_EM` multiplie le
 * tout (marge de sécurité : graisse active, rendu natif légèrement plus large).
 */
export const CHAR_EM = { display: 1.04, body: 1.04 } as const;
const NARROW = new Set([...'iljíìïî\'’.,:;!|·']);
const SEMI = new Set([...'ftrI1()[]-']);
const WIDE = new Set([...'mwæœ']); // m, w : 0,95 em (Comment = 0,684 em/car. mesuré)
const XWIDE = new Set([...'MWŒÆ']);

export function charEm(c: string): number {
  if (c === ' ') return 0.25;
  if (NARROW.has(c)) return 0.28;
  if (SEMI.has(c)) return 0.38;
  if (WIDE.has(c)) return 0.95;
  if (XWIDE.has(c)) return 1;
  if (c >= '0' && c <= '9') return 0.58;
  if (c !== c.toLowerCase()) return 0.67;
  return 0.58;
}

export function textWidth(text: string, fontSize: number, em: number = CHAR_EM.body): number {
  let w = 0;
  for (const c of text) w += charEm(c);
  return w * fontSize * em;
}

/** Nombre de lignes d'un texte coupé aux espaces dans `avail` px (un mot plus large que la ligne : Infinity). */
export function lineCount(text: string, avail: number, fontSize: number, em: number = CHAR_EM.body): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const space = 0.25 * fontSize * em;
  let lines = 1;
  let cur = 0;
  for (const w of words) {
    const ww = textWidth(w, fontSize, em);
    if (ww > avail + 0.5) return Infinity;
    if (cur === 0) cur = ww;
    else if (cur + space + ww <= avail + 0.5) cur += space + ww;
    else { lines += 1; cur = ww; }
  }
  return lines;
}

/** Tailles possibles du titre d'écran (px de base, avant l'agrandissement du système), de la plus grande à la plus petite. */
export const TITLE_STEPS = [32, 28, 24, 21] as const;
export const TITLE_MAX_LINES = 2;

/**
 * Taille du titre d'écran : la plus grande qui tient en ≤ 2 lignes sans couper de mot, compte tenu de la largeur
 * disponible et de l'agrandissement effectif du titre (`scale` = min(réglage, plafond du rôle)).
 * À défaut, la plus petite (le titre passe alors à la ligne normalement).
 */
export function fitTitleSize(title: string, avail: number, scale = 1): { fontSize: number; lineHeight: number; letterSpacing: number } {
  const pick = (fs: number) => ({ fontSize: fs, lineHeight: Math.round(fs * 1.13), letterSpacing: fs >= 28 ? -1 : -0.6 });
  for (const fs of TITLE_STEPS) {
    if (lineCount(title, avail, fs * scale, CHAR_EM.display) <= TITLE_MAX_LINES) return pick(fs);
  }
  return pick(TITLE_STEPS[TITLE_STEPS.length - 1]);
}

/**
 * Disposition d'une rangée d'orbes (`ChoiceGroup variant="orbs"`). Chaque orbe a une colonne de largeur égale ;
 * son libellé passe sous l'orbe, sur 3 lignes au plus, SANS couper de mot. Si un libellé ne tient pas dans la
 * colonne, les orbes passent sur plusieurs rangées équilibrées et centrées (colonnes plus larges).
 *  - `labels` : libellés ; `width` : largeur de la rangée ; `fontSize` : taille du libellé (base) ; `scale` :
 *    agrandissement effectif du libellé ; `gap` : écart entre colonnes ; `minCol` : largeur minimale d'une colonne.
 */
export function orbLayout(o: { labels: string[]; width: number; fontSize: number; scale?: number; gap: number; minCol: number; maxLines?: number }): { perRow: number; col: number; rows: number } {
  const n = Math.max(1, o.labels.length);
  const fs = o.fontSize * (o.scale ?? 1);
  const maxLines = o.maxLines ?? 3;
  if (!(o.width > 0)) return { perRow: n, col: 0, rows: 1 };
  for (let per = n; per >= 1; per--) {
    const col = (o.width - o.gap * (per - 1)) / per;
    if (col < o.minCol && per > 1) continue;
    const fits = o.labels.every((l) => lineCount(l, col, fs, CHAR_EM.body) <= maxLines);
    if (fits) {
      if (per === n) return { perRow: n, col, rows: 1 };
      // rangées équilibrées (5 orbes : 3 + 2, pas 4 + 1) ; colonnes de la largeur trouvée (même rythme sur chaque rangée)
      const rows = Math.ceil(n / per);
      return { perRow: Math.ceil(n / rows), col, rows };
    }
  }
  return { perRow: 1, col: o.width, rows: n };
}
