/**
 * Pages publiques (site statique legal-site/) générées depuis les mêmes textes que l'app (src/content/legal.ts).
 * Régénérer : GEN_LEGAL_SITE=1 CI=1 npx jest src/__tests__/legalSite.test.ts
 * Sans GEN_LEGAL_SITE, le test vérifie que les pages publiées sont à jour (identiques aux textes de l'app).
 */
import { ACCOUNT_DELETION, LEGAL_NOTICE, PRIVACY, SUPPORT, TERMS, type LegalDoc } from '@/content/legal';
import { BRAND } from '@/config/brand';
import { setLocale } from '@/i18n';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean; writeFileSync(p: string, d: string): void; mkdirSync(p: string, o: { recursive: boolean }): void };

const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const;
const PAGES: { slug: string; doc: () => LegalDoc }[] = [
  { slug: 'cgu', doc: () => TERMS },
  { slug: 'confidentialite', doc: () => PRIVACY },
  { slug: 'mentions-legales', doc: () => LEGAL_NOTICE },
  { slug: 'suppression-compte', doc: () => ACCOUNT_DELETION },
  { slug: 'aide', doc: () => SUPPORT },
];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(lang: string, slug: string): string {
  const d = PAGES.find((p) => p.slug === slug)!.doc();
  const depth = lang === 'fr' ? '../' : '../../';
  const nav = PAGES.map((p) => `<a href="${depth}${p.slug}/${lang === 'fr' ? '' : lang + '/'}">${esc(p.doc().title)}</a>`).join('');
  const langs = LANGS.map((l) => (l === lang ? `<strong>${l.toUpperCase()}</strong>` : `<a href="${depth}${slug}/${l === 'fr' ? '' : l + '/'}">${l.toUpperCase()}</a>`)).join(' · ');
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)} · ${esc(BRAND.name)}</title>
<style>:root{--bg:#F4F0FA;--ink:#1C1533;--muted:#584D72;--accent:#5B2A86;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#16112B;--ink:#F7F4FB;--muted:#C3B8DD;--accent:#CDBEFA;--card:#1D1638}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,system-ui,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:24px 16px 48px}h1{font-size:1.6rem;margin:.2em 0}h2{font-size:1.05rem;margin:0 0 .3em}
section{background:var(--card);border-radius:14px;padding:14px 16px;margin:10px 0}p{margin:0}.m{color:var(--muted);font-size:.9rem}
nav{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 4px;font-size:.9rem}a{color:var(--accent)}</style></head>
<body><main><p class="m">${esc(BRAND.name)} · ${langs}</p><h1>${esc(d.title)}</h1><p class="m">${esc(d.updated)}</p>
<nav>${nav}</nav>
${d.sections.map((s) => `<section><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></section>`).join('\n')}
</main></body></html>
`;
}

function build(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const lang of LANGS) {
    setLocale(lang);
    for (const p of PAGES) files[`legal-site/${p.slug}/${lang === 'fr' ? '' : lang + '/'}index.html`] = page(lang, p.slug);
  }
  setLocale('fr');
  files['legal-site/index.html'] = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=confidentialite/"><title>${esc(BRAND.name)}</title></head><body><a href="confidentialite/">Politique de confidentialité</a></body></html>\n`;
  return files;
}

describe('pages juridiques publiques', () => {
  it(process.env.GEN_LEGAL_SITE ? 'génère legal-site/' : 'legal-site/ est identique aux textes de l’app', () => {
    const files = build();
    for (const [path, html] of Object.entries(files)) {
      if (process.env.GEN_LEGAL_SITE) {
        fs.mkdirSync(path.replace(/\/[^/]+$/, ''), { recursive: true });
        fs.writeFileSync(path, html);
      } else {
        expect(fs.existsSync(path)).toBe(true);
        expect(fs.readFileSync(path, 'utf8')).toBe(html);
      }
    }
    expect(Object.keys(files)).toHaveLength(26);
  });
});
