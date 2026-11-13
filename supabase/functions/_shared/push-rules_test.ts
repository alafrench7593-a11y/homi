// Assertions locales (comme les autres tests : aucune dépendance réseau)
function assertEquals(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); }
import { channelFor, lockScreenText, planDelivery, type PushRow } from './push-rules.ts';

const row: PushRow = { id: 'n1', user_id: 'u1', title: 'Lou a de la fièvre', body: 'Message de la nounou', deep_link: '/family', category: 'family' };

Deno.test('heures calmes : différée, sauf urgence', () => {
  assertEquals(planDelivery(row, '2026-11-14T06:00:00Z'), { action: 'defer', until: '2026-11-14T06:00:00Z' });
  assertEquals(planDelivery({ ...row, urgent: true }, '2026-11-14T06:00:00Z'), { action: 'send' });
  assertEquals(planDelivery(row, null), { action: 'send' });
});

Deno.test('écran verrouillé : générique par défaut, détail seulement avec accord', () => {
  assertEquals(lockScreenText(row, 'fr', false), { title: 'Nouvelle notification', body: 'Ouvrez l’application pour voir le détail.' });
  assertEquals(lockScreenText(row, 'fr', true), { title: 'Lou a de la fièvre', body: 'Message de la nounou' });
  assertEquals(lockScreenText({ ...row, category: 'community_reply' }, 'en', true).title, 'New activity in the community');
  assertEquals(channelFor({ category: 'family', urgent: true }), 'alerts');
});
