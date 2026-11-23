/**
 * MATRICE DE PERSONNALISATION (docs/200/matrice_personnalisation.md) — générée à partir du moteur RÉEL
 * (src/lib/personalization) sur les profils fictifs A–G, jamais écrite à la main.
 *   Régénérer : WRITE_MATRIX=1 npx jest src/__tests__/personalizationMatrix --testPathIgnorePatterns /node_modules/
 * Sans WRITE_MATRIX, le test échoue si le fichier n'est plus à jour (règles ou registre modifiés).
 */
import { ageText, childRecommendations, reasonText, recommend } from '@/lib/personalization';
import { toolName } from '@/lib/domain/toolCatalog';
import { NOW, PERSONAS } from './fixtures/personas';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; writeFileSync(p: string, d: string): void; existsSync(p: string): boolean };
const OUT = 'docs/200/matrice_personnalisation.md';

export function buildMatrix(): string {
  const lines: string[] = [
    '# Matrice de personnalisation — profils A–G × 10 premiers outils',
    '',
    `Générée par \`src/__tests__/personalizationMatrix.test.ts\` à partir du moteur réel (\`src/lib/personalization\`), date de référence ${NOW.toISOString().slice(0, 10)}, langue française.`,
    'Ne pas modifier à la main : `WRITE_MATRIX=1 npx jest src/__tests__/personalizationMatrix --testPathIgnorePatterns /node_modules/`.',
    'Colonnes : rang, outil (nom affiché), identifiant stable, raison affichée en petit sur l’accueil, règle déclarative.',
    '',
  ];
  for (const p of PERSONAS) {
    lines.push(`## ${p.key} — ${p.title}`, '', '| # | Outil | Identifiant | Raison affichée | Règle |', '|---|---|---|---|---|');
    recommend(p.facts, {}, { max: 10 }).forEach((r, i) => lines.push(`| ${i + 1} | ${toolName(r.id)} | \`${r.id}\` | ${reasonText(r.reason)} | ${r.rule} |`));
    for (const c of p.facts.children) {
      if (p.facts.role === 'caregiver') break;
      const list = childRecommendations({ ...p.facts, activeChildId: c.id }, c.id, {}, 6);
      lines.push('', `« Ton enfant » — ${c.name} (${ageText(c.months)}) : ${list.map((r) => `${toolName(r.id)} (${reasonText(r.reason)})`).join(' · ')}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

it('la matrice de personnalisation est à jour (générée depuis le moteur)', () => {
  const md = buildMatrix();
  if (process.env.WRITE_MATRIX) fs.writeFileSync(OUT, md);
  expect(fs.existsSync(OUT)).toBe(true);
  expect(fs.readFileSync(OUT, 'utf8')).toBe(md);
});
