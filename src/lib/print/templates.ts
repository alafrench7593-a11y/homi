/**
 * HOMI Print Studio — gabarits HTML imprimables (A4 ou compact A5), utilisables SANS écran par l'enfant : routine
 * visuelle, Maintenant / Ensuite, cartes de communication, histoire sociale, checklist. Logique pure (testée) :
 * aucun réseau, aucune image externe (pictogrammes = caractères), contraste maximal, gros caractères, pas de couleur
 * nécessaire à la compréhension. Le parent saisit et valide tout le contenu ; rien n'est inventé ici.
 */

export type PrintFormat = 'a4' | 'compact';
export interface PrintStep { icon?: string | null; label: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const clean = (s: string | null | undefined, max = 120) => esc(String(s ?? '').trim().slice(0, max));

/** Pictogrammes des routines (noms Material Community Icons du sélecteur) → symbole imprimable universel. */
export const PICTO_GLYPH: Record<string, string> = {
  'weather-sunny': '☀️', toilet: '🚽', 'hand-wash': '🧼', 'food-croissant': '🥐', 'toothbrush-paste': '🪥', 'tshirt-crew': '👕',
  'shoe-sneaker': '👟', 'coat-rack': '🧥', 'bag-personal': '🎒', school: '🏫', 'food-apple': '🍎', 'cup-water': '🥛',
  'silverware-fork-knife': '🍽️', bathtub: '🛁', shower: '🚿', broom: '🧹', puzzle: '🧩', music: '🎵', 'television-off': '📺',
  'book-open-variant': '📖', 'teddy-bear': '🧸', 'hand-heart': '🤗', bed: '🛏️', 'lightbulb-off': '🌙',
};
export const glyph = (icon?: string | null) => (icon && PICTO_GLYPH[icon]) || (icon && [...icon].length <= 2 ? icon : '●');

function page(title: string, body: string, format: PrintFormat, lang = 'fr'): string {
  const size = format === 'compact' ? 'A5' : 'A4';
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@page{size:${size};margin:12mm}
*{box-sizing:border-box}
body{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;color:#111;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:${format === 'compact' ? 22 : 30}pt;margin:0 0 6mm;text-align:center;line-height:1.15}
.sub{text-align:center;font-size:12pt;color:#333;margin:-3mm 0 6mm}
.grid{display:grid;grid-template-columns:repeat(${format === 'compact' ? 2 : 3},1fr);gap:5mm}
.card{border:2.5pt solid #111;border-radius:6mm;padding:4mm;text-align:center;break-inside:avoid;page-break-inside:avoid;min-height:${format === 'compact' ? 38 : 52}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm}
.pic{font-size:${format === 'compact' ? 30 : 42}pt;line-height:1}
.lab{font-size:${format === 'compact' ? 13 : 17}pt;font-weight:700;line-height:1.2}
.num{font-size:11pt;font-weight:700;align-self:flex-start}
.box{width:9mm;height:9mm;border:2pt solid #111;border-radius:2mm;display:inline-block;vertical-align:middle;margin-right:4mm}
.row{display:flex;align-items:center;font-size:${format === 'compact' ? 14 : 18}pt;padding:3mm 0;border-bottom:1pt solid #999;break-inside:avoid}
.nn{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.nn .card{min-height:${format === 'compact' ? 70 : 110}mm}
.tag{font-size:${format === 'compact' ? 16 : 24}pt;font-weight:800;letter-spacing:.5pt}
.story p{font-size:${format === 'compact' ? 14 : 18}pt;line-height:1.5;margin:0 0 5mm;break-inside:avoid}
.story .pic{display:block;margin-bottom:2mm}
.foot{margin-top:8mm;font-size:8pt;color:#555;text-align:center}
</style></head><body>${body}<div class="foot">HOMI</div></body></html>`;
}

export function routineSheet(o: { title: string; childName?: string | null; steps: PrintStep[]; format?: PrintFormat; numbered?: boolean; lang?: string }): string {
  const steps = o.steps.filter((s) => s.label.trim()).slice(0, 24);
  const cards = steps.map((s, i) => `<div class="card">${o.numbered === false ? '' : `<span class="num">${i + 1}</span>`}<span class="pic" aria-hidden="true">${glyph(s.icon)}</span><span class="lab">${clean(s.label, 60)}</span></div>`).join('');
  return page(o.title, `<h1>${clean(o.title)}</h1>${o.childName ? `<div class="sub">${clean(o.childName, 40)}</div>` : ''}<div class="grid">${cards}</div>`, o.format ?? 'a4', o.lang);
}

export function nowNextSheet(o: { now: PrintStep; next: PrintStep; labels: { now: string; next: string }; format?: PrintFormat; lang?: string }): string {
  const cell = (tag: string, s: PrintStep) => `<div class="card"><span class="tag">${clean(tag, 20)}</span><span class="pic" aria-hidden="true">${glyph(s.icon)}</span><span class="lab">${clean(s.label, 60)}</span></div>`;
  return page(`${o.labels.now} / ${o.labels.next}`, `<div class="nn">${cell(o.labels.now, o.now)}${cell(o.labels.next, o.next)}</div>`, o.format ?? 'a4', o.lang);
}

export function cardsSheet(o: { title: string; cards: PrintStep[]; format?: PrintFormat; lang?: string }): string {
  const cards = o.cards.filter((c) => c.label.trim()).slice(0, 30).map((c) => `<div class="card"><span class="pic" aria-hidden="true">${glyph(c.icon)}</span><span class="lab">${clean(c.label, 40)}</span></div>`).join('');
  return page(o.title, `<h1>${clean(o.title)}</h1><div class="grid">${cards}</div>`, o.format ?? 'a4', o.lang);
}

export function storySheet(o: { title: string; pages: PrintStep[]; format?: PrintFormat; lang?: string }): string {
  const ps = o.pages.filter((p) => p.label.trim()).slice(0, 20).map((p) => `<p>${p.icon ? `<span class="pic" aria-hidden="true">${glyph(p.icon)}</span>` : ''}${clean(p.label, 400)}</p>`).join('');
  return page(o.title, `<h1>${clean(o.title)}</h1><div class="story">${ps}</div>`, o.format ?? 'a4', o.lang);
}

export function checklistSheet(o: { title: string; items: string[]; format?: PrintFormat; lang?: string }): string {
  const rows = o.items.map((x) => x.trim()).filter(Boolean).slice(0, 40).map((x) => `<div class="row"><span class="box"></span>${clean(x, 100)}</div>`).join('');
  return page(o.title, `<h1>${clean(o.title)}</h1>${rows}`, o.format ?? 'a4', o.lang);
}

/** Cartes de communication essentielles (le parent coche, renomme, ajoute les siennes). Clés i18n `pst.card.*`. */
export const ESSENTIAL_CARDS: { key: string; icon: string }[] = [
  { key: 'hungry', icon: '🍽️' }, { key: 'thirsty', icon: '🥛' }, { key: 'toilet', icon: '🚽' }, { key: 'pause', icon: '✋' },
  { key: 'help', icon: '🙋' }, { key: 'noise', icon: '🔇' }, { key: 'hurt', icon: '🩹' }, { key: 'hug', icon: '🤗' },
  { key: 'tired', icon: '😴' }, { key: 'yes', icon: '👍' }, { key: 'no', icon: '👎' }, { key: 'more', icon: '➕' },
];
