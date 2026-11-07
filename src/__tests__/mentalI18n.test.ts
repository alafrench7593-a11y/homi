import { mental as fr } from '@/i18n/fr/mental';
import { mental as en } from '@/i18n/en/mental';
import { CHECKLISTS, DOMAINS, EXHAUSTION_QUESTIONS, PAPER_KINDS, PROCEDURES } from '@/lib/domain/mentalLoad';

const need: string[] = [
  ...DOMAINS.flatMap((d) => [`cm.domain.${d}`, `cm.domain.${d}.d`]),
  ...PAPER_KINDS.flatMap((k) => [`cm.pp.k.${k}`, `cm.pp.k.${k}.d`]),
  ...PROCEDURES.map((p) => `cm.pp.p.${p}`),
  ...EXHAUSTION_QUESTIONS.map((q) => `cm.ex.q.${q}`),
  ...['low', 'medium', 'high'].flatMap((l) => [`cm.ex.r.${l}`, `cm.ex.r.${l}.d`]),
  ...Object.entries(CHECKLISTS).flatMap(([kind, items]) => [`cm.prep.${kind}`, ...(items as readonly string[]).map((i) => `cm.prep.item.${kind}.${i}`)]),
];

describe('i18n charge mentale', () => {
  it.each([['fr', fr], ['en', en]])('%s couvre toutes les clés dynamiques', (_l, dict) => {
    const missing = need.filter((k) => !(k in dict));
    expect(missing).toEqual([]);
  });
  it('aucune formule interdite dans les textes santé', () => {
    const all = JSON.stringify(fr).toLowerCase();
    for (const bad of ['sans risque', 'c’est normal', "c'est normal", 'aucun danger', 'pas besoin de consulter', 'validé par un professionnel']) expect(all).not.toContain(bad);
  });
});
