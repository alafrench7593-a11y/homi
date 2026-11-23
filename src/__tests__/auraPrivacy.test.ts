/**
 * Minimisation des données envoyées à Gemini (23/11/2026) : les prénoms du foyer ne quittent jamais le serveur HOMI.
 * Gemini simulé : on inspecte EXACTEMENT ce qui lui est envoyé, et on vérifie la réponse restaurée.
 */
import { pseudonymizer } from '../../supabase/functions/_shared/aura-privacy';
import { runAura, type AuraDeps } from '../../supabase/functions/_shared/aura-run';
import type { GeminiRequestOptions } from '../../supabase/functions/_shared/gemini';

describe('pseudonymizer', () => {
  const p = pseudonymizer(['Lina', 'Noé', 'Marie-Lou', 'Marie', null, 'A']);
  it('masque mots entiers, sans casse ni accents ; garde les mots qui contiennent un prénom', () => {
    const m = p.mask('lina et NOE dorment ; Marie-Lou aussi, Marie non. Linaire reste.');
    expect(m).not.toMatch(/lina\b|NOE|Marie/i);
    expect(m).toContain('Linaire');
  });
  it('restaure les jetons connus, laisse les inconnus', () => {
    const tok = p.mask('Noé');
    expect(p.unmask(`${tok} a bien dormi ; [P99] inconnu`)).toBe('Noé a bien dormi ; [P99] inconnu');
  });
  it('sans prénoms : inchangé', () => { expect(pseudonymizer([]).mask('Lina')).toBe('Lina'); });
});

describe('runAura : aucun prénom envoyé au modèle', () => {
  it('message, historique : masqués à l’envoi ; réponse : prénoms rendus', async () => {
    const sent: GeminiRequestOptions[] = [];
    const deps: AuraDeps = {
      userId: '11111111-2222-3333-4444-555555555555', today: '2026-11-23',
      consented: async () => true,
      geminiConfig: async () => ({ apiKey: 'double', model: 'gemini-test' }),
      gate: { reserve: async () => ({ ok: true, reservation_id: 'r1', cost: 1, monthly_remaining: 9 }), commit: async () => true, release: async () => true },
      turn: async (_c, req) => { sent.push(JSON.parse(JSON.stringify(req))); const tok = JSON.stringify(req).match(/\[P\d+\]/)?.[0] ?? '?'; return { text: `${tok} peut faire une sieste plus tôt.`, calls: [], parts: [{ text: 'x' }], finishReason: 'STOP' }; },
      names: async () => ['Lina', 'Camille Martin', 'Camille'],
    };
    const out = await runAura(deps, { kind: 'chat', message: 'Lina pleure le soir, Camille est épuisée', lang: 'fr', region: 'FR', tools: [], request_id: 'req-12345678',
      recent_turns: [{ role: 'user', content: 'Lina a 13 mois' }] });
    const wire = JSON.stringify(sent);
    expect(wire).not.toMatch(/Lina|Camille/);
    expect(out.status).toBe(200);
    expect(String(out.body.answer)).toMatch(/^(Lina|Camille) peut faire/);
  });
});
