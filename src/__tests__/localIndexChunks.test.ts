/** L'index construit par lots (interface fluide) est identique à l'index construit d'un bloc. */
import { buildIndex, buildIndexInChunks, search } from '@/lib/localAI/engine';
const arts = Array.from({ length: 23 }, (_, i) => ({ slug: `a${i}`, title: `Sommeil du bébé ${i}`, summary: 'Réveils la nuit et siestes', body_md: `## Question ${i}\nLe bébé se réveille la nuit ; la sieste aide. Biberon ${i} ml.`, tags: ['sommeil'], sources: [], min_age_months: null, max_age_months: null, journeys: [] }));
it('même index, même recherche', async () => {
  const a = buildIndex(arts as never);
  const b = (await buildIndexInChunks(arts as never, { chunk: 4 }))!;
  expect(b.passages.length).toBe(a.passages.length);
  expect([...b.df.entries()].sort()).toEqual([...a.df.entries()].sort());
  expect(b.avgLen).toBeCloseTo(a.avgLen);
  expect(search(b, 'bébé se réveille la nuit').map((x) => x.p.slug)).toEqual(search(a, 'bébé se réveille la nuit').map((x) => x.p.slug));
});
it('annulable (écran quitté)', async () => {
  expect(await buildIndexInChunks(arts as never, { chunk: 4, isCancelled: () => true })).toBeNull();
});
