/**
 * Notifications envoyées par le serveur (send-push, 13/11/2026) : heures calmes du destinataire,
 * confidentialité de l'écran verrouillé, urgences. Le calcul de la fin des heures calmes (fuseau, réglages)
 * est fait en SQL (push_quiet_until, testé dans supabase/tests/sql/98_hors_ligne_notifications.sql).
 */
import { channelFor, lockScreenText, planDelivery, PUSH_TEXTS, pushText, type PushRow } from '../../supabase/functions/_shared/push-rules';

const row: PushRow = { id: 'n1', user_id: 'u1', title: 'Lou a de la fièvre', body: 'Message de la nounou', deep_link: '/family', category: 'family' };

describe('send-push : heures calmes', () => {
  it('diffère une notification ordinaire pendant les heures calmes', () => {
    expect(planDelivery(row, '2026-11-14T06:00:00Z')).toEqual({ action: 'defer', until: '2026-11-14T06:00:00Z' });
  });
  it('envoie tout de suite hors heures calmes', () => {
    expect(planDelivery(row, null)).toEqual({ action: 'send' });
    expect(planDelivery(row, undefined)).toEqual({ action: 'send' });
  });
  it('n’attend jamais pour une urgence', () => {
    expect(planDelivery({ ...row, urgent: true }, '2026-11-14T06:00:00Z')).toEqual({ action: 'send' });
  });
});

describe('send-push : écran verrouillé', () => {
  it('affiche un texte générique par défaut (aucun prénom, aucun détail)', () => {
    const t = lockScreenText(row, 'fr', false);
    expect(t).toEqual({ title: 'Nouvelle notification', body: 'Ouvrez l’application pour voir le détail.' });
    expect(JSON.stringify(t)).not.toContain('Lou');
  });
  it('affiche le détail seulement si la personne l’a autorisé', () => {
    expect(lockScreenText(row, 'fr', true)).toEqual({ title: 'Lou a de la fièvre', body: 'Message de la nounou' });
  });
  it('garde la communauté et les rappels de produits toujours génériques', () => {
    expect(lockScreenText({ ...row, category: 'community_group' }, 'fr', true).title).toBe(pushText('fr', 'communityTitle'));
    expect(lockScreenText({ ...row, category: 'product_recall' }, 'de', true).title).toBe(PUSH_TEXTS.de.recallTitle);
  });
  it('signale une urgence sans en révéler le contenu', () => {
    expect(lockScreenText({ ...row, urgent: true }, 'en', false).title).toBe('Important information');
    expect(channelFor({ category: 'family', urgent: true })).toBe('alerts');
    expect(channelFor({ category: 'family' })).toBe('community');
  });
  it('a les mêmes clés dans les 5 langues, langue inconnue → français', () => {
    const keys = Object.keys(PUSH_TEXTS.fr).sort();
    for (const l of ['en', 'es', 'de', 'it']) expect(Object.keys(PUSH_TEXTS[l]).sort()).toEqual(keys);
    expect(pushText('xx', 'genericTitle')).toBe('Nouvelle notification');
  });
});
