/** Communauté instantanée : cœur, enregistrement et commentaire apparaissent avant la réponse du serveur, et s'annulent proprement. */
import { QueryClient } from '@tanstack/react-query';
import { PENDING, addPendingComment, likePatch, markStale, patchPost, restore, savePatch } from '@/lib/community/optimistic';
import type { FeedComment } from '@/lib/types';

const post = (id: string, liked = false, like_count = 3) => ({ id, liked, like_count, saved: false, comment_count: 1, body: 'x' });

describe('mises à jour optimistes de la communauté', () => {
  it('le cœur change tout de suite dans toutes les listes qui contiennent la publication', () => {
    const qc = new QueryClient();
    qc.setQueryData(['u', 'forum_feed', 'feed', 'all'], [post('a'), post('b')]);
    qc.setQueryData(['u', 'forum_feed', 'search', 'x'], [post('a')]);
    qc.setQueryData(['u', 'notifications'], [{ id: 'a', title: 'sans compteur' }]);
    const snap = patchPost(qc, 'a', likePatch(true));
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'feed', 'all'])![0]).toMatchObject({ liked: true, like_count: 4 });
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'search', 'x'])![0]).toMatchObject({ liked: true, like_count: 4 });
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'feed', 'all'])![1]).toMatchObject({ liked: false, like_count: 3 });
    expect(qc.getQueryData<any[]>(['u', 'notifications'])![0]).toEqual({ id: 'a', title: 'sans compteur' });
    restore(qc, snap); // échec réseau → état d'avant
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'feed', 'all'])![0]).toMatchObject({ liked: false, like_count: 3 });
  });
  it('retirer un cœur ne descend jamais sous zéro ; enregistrer bascule le marque-page', () => {
    const qc = new QueryClient();
    qc.setQueryData(['u', 'forum_feed'], [post('a', true, 0)]);
    patchPost(qc, 'a', likePatch(false));
    expect(qc.getQueryData<any[]>(['u', 'forum_feed'])![0].like_count).toBe(0);
    patchPost(qc, 'a', savePatch(true));
    expect(qc.getQueryData<any[]>(['u', 'forum_feed'])![0].saved).toBe(true);
  });
  it('le commentaire apparaît « en cours d’envoi » et le compteur monte ; annulé, tout revient', () => {
    const qc = new QueryClient();
    qc.setQueryData(['u', 'forum_feed', 'feed'], [post('p')]);
    qc.setQueryData(['u', 'comment_feed', 'p'], [{ id: 'c1', post_id: 'p', body: 'avant' }]);
    const temp = { id: 'tmp-1', post_id: 'p', parent_id: null, body: 'Courage', status: PENDING, created_at: new Date().toISOString(), pseudonym: 'Moi', is_mine: true } as FeedComment;
    const snap = addPendingComment(qc, temp);
    expect(qc.getQueryData<any[]>(['u', 'comment_feed', 'p'])!.map((c) => c.id)).toEqual(['c1', 'tmp-1']);
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'feed'])![0].comment_count).toBe(2);
    restore(qc, snap);
    expect(qc.getQueryData<any[]>(['u', 'comment_feed', 'p'])!.map((c) => c.id)).toEqual(['c1']);
    expect(qc.getQueryData<any[]>(['u', 'forum_feed', 'feed'])![0].comment_count).toBe(1);
  });
  it('après un cœur, le fil est marqué périmé sans être rechargé tout de suite', async () => {
    const qc = new QueryClient();
    const fetches = jest.fn(async () => [post('a')]);
    await qc.fetchQuery({ queryKey: ['u', 'forum_feed'], queryFn: fetches });
    await markStale(qc, 'forum_feed');
    expect(fetches).toHaveBeenCalledTimes(1);
    expect(qc.getQueryState(['u', 'forum_feed'])!.isInvalidated).toBe(true);
  });
});
