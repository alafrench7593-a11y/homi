import { clearConversations, deleteConversation, loadConversations, MAX_CONVERSATIONS, renameConversation, saveConversation, searchConversations, storable } from '@/lib/aura/history';

const u = 'user-a';
const msgs = (q: string) => [
  { id: '1', role: 'user' as const, text: q },
  { id: '2', role: 'aura' as const, reply: { kind: 'intent', intent: { kind: 'log_bottle', ml: 150 } } },
  { id: '3', role: 'aura' as const, reply: { kind: 'pending' } },
  { id: '4', role: 'aura' as const, reply: { kind: 'error', error: 'network' } },
];

describe('Historique Aura sur l’appareil', () => {
  beforeEach(async () => { await clearConversations(u); await clearConversations('user-b'); });
  it('garde questions et réponses utiles ; l’action revient en lecture seule ; ni attente ni erreur', () => {
    const k = storable(msgs('Lina a bu 150 ml'));
    expect(k.map((m) => m.id)).toEqual(['1', '2']);
    expect(k[1].reply).toMatchObject({ kind: 'intent', restored: true });
  });
  it('sauvegarde, reprise, renommage, recherche sans accents, suppression', async () => {
    await saveConversation(u, 'c1', msgs('Combien a bu Lina ?'), new Date('2026-11-25T10:00:00Z'));
    await saveConversation(u, 'c2', msgs('Préparer le relais'), new Date('2026-11-25T11:00:00Z'));
    let list = await loadConversations(u);
    expect(list.map((c) => c.id)).toEqual(['c2', 'c1']);
    expect(list[1].title).toBe('Combien a bu Lina ?');
    await renameConversation(u, 'c1', '  Biberons  ');
    list = await loadConversations(u);
    expect(list.find((c) => c.id === 'c1')!.title).toBe('Biberons');
    expect(searchConversations(list, 'preparer').map((c) => c.id)).toEqual(['c2']);
    await deleteConversation(u, 'c2');
    expect((await loadConversations(u)).map((c) => c.id)).toEqual(['c1']);
  });
  it('par compte : un autre compte ne voit rien', async () => {
    await saveConversation(u, 'c1', msgs('secret'));
    expect(await loadConversations('user-b')).toEqual([]);
  });
  it('rien n’est gardé sans question ; au plus 50 conversations', async () => {
    await saveConversation(u, 'x', [{ id: '1', role: 'aura', reply: { kind: 'ai', answer: 'bonjour' } }]);
    expect(await loadConversations(u)).toEqual([]);
    for (let i = 0; i < MAX_CONVERSATIONS + 5; i++) await saveConversation(u, `c${i}`, msgs(`q${i}`), new Date(2026, 10, 1, 0, i));
    expect((await loadConversations(u)).length).toBe(MAX_CONVERSATIONS);
  });
});
