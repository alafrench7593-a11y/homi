/**
 * Écritures de l'allaitement en direct et du tire-lait (22/11/2026). Même chemin que le formulaire manuel :
 *  - ajout : `useAddLog` (insertOrQueue : envoyé, ou gardé sur le téléphone hors connexion) ;
 *  - modification : `backend.update` sur l'id, gardée par l'état lu (une tétée déjà terminée ailleurs n'est pas
 *    terminée deux fois ; une correction ne passe que si l'entrée n'a pas changé entre-temps, comme F-05).
 * La colonne `segments` (migration 20261206000100) peut manquer sur le serveur : l'écriture est alors refaite sans
 * elle (le côté reste noté, la répartition par côté n'est pas gardée) — jamais d'échec pour cette seule raison.
 */
import { backend, eq } from '@/lib/backend';
import { BackendError, type Filter } from '@/lib/backend/types';
import { useAddLog, useInvalidate } from '@/lib/data/hooks';
import { useOfflineStore } from '@/lib/offline';
import { t as tr } from '@/i18n';
import { finishPatch, isOngoing, startRow, switchPatch, type BreastSide, type FeedLike } from '@/lib/domain/breastSession';
import type { Breastfeed, Child, Pumping } from '@/lib/types';
import { endLiveFor } from '@/live/controller';
import { useUiStore } from '@/lib/store';

/** Colonne absente du schéma du serveur (migration pas encore déployée). */
export const missingColumn = (e: unknown) => e instanceof BackendError && (e.code === 'PGRST204' || e.code === '42703');
let segmentsSupported = true;

export class FeedError extends Error {}

const guardOf = (orig: Record<string, unknown>, patch: Record<string, unknown>): Filter[] => Object.keys(patch)
  .filter((k) => k !== 'segments' && k in orig && (orig[k] === null || ['string', 'number', 'boolean'].includes(typeof orig[k])))
  .map((k) => (orig[k] === null ? { col: k, op: 'is' as const, value: null } : eq(k, orig[k] as string | number | boolean)));

/** Mise à jour gardée ; sans la colonne `segments`, refaite sans elle. Renvoie false si l'entrée a changé entre-temps. */
async function guardedUpdate(table: string, row: Record<string, unknown> & { id: string }, patch: Record<string, unknown>): Promise<boolean> {
  if (backend.mode !== 'demo' && !useOfflineStore.getState().online) throw new FeedError(tr('bt.err.offline'));
  const p = segmentsSupported ? patch : withoutSegments(patch);
  try {
    const res = await backend.update(table, p, [eq('id', row.id), ...guardOf(row, p)]);
    return !(Array.isArray(res) && res.length === 0);
  } catch (e) {
    if (!('segments' in p) || !missingColumn(e)) throw e;
    segmentsSupported = false;
    const res = await backend.update(table, withoutSegments(p), [eq('id', row.id), ...guardOf(row, p)]);
    return !(Array.isArray(res) && res.length === 0);
  }
}
const withoutSegments = (p: Record<string, unknown>) => { const { segments: _s, ...rest } = p; return rest; }; // eslint-disable-line @typescript-eslint/no-unused-vars

export function useBreastActions(child: Child | null | undefined) {
  const add = useAddLog('breastfeed');
  const inv = useInvalidate();
  const childId = child?.id;

  /** Relue au moment d'agir (un autre appareil a pu démarrer ou terminer la tétée). */
  async function openFeed(now: Date): Promise<Breastfeed | null> {
    if (!childId) throw new FeedError(tr('bt.err.child'));
    const rows = await backend.select<Breastfeed>({ table: 'breastfeeds', filters: [eq('child_id', childId)], order: [{ col: 'started_at', asc: false }], limit: 5 });
    return rows.find((r) => isOngoing(r as FeedLike, now)) ?? null;
  }

  return {
    /** Démarrer une tétée sur un côté (jamais deux en même temps pour un enfant). */
    async start(side: BreastSide, now = new Date()) {
      if (!child) throw new FeedError(tr('bt.err.child'));
      if (await openFeed(now).catch(() => null)) throw new FeedError(tr('bt.err.already'));
      const row = { child_id: child.id, household_id: child.household_id, note: null, ...startRow(side, now) };
      const offline = backend.mode !== 'demo' && !useOfflineStore.getState().online;
      try {
        return await add.mutateAsync(segmentsSupported && !offline ? row : withoutSegments(row));
      } catch (e) {
        if (!missingColumn(e)) throw e;
        segmentsSupported = false;
        return add.mutateAsync(withoutSegments(row));
      }
    },
    /** Changer de côté dans la MÊME tétée. */
    async switchSide(feed: Breastfeed, now = new Date()) {
      const patch = switchPatch(feed as FeedLike, now);
      // Colonne `segments` absente du serveur (migration non déployée) : une tétée « les deux côtés » sans répartition
      // reste EN COURS ; le côté exact n'est pas connu, la tétée continue sans message d'erreur (durées par côté non
      // notées, comme l'indique la fiche). Seule une tétée réellement terminée est refusée.
      if (!patch && isOngoing(feed as FeedLike, now)) return;
      if (!patch) throw new FeedError(tr('bt.err.notOngoing'));
      const ok = await guardedUpdate('breastfeeds', feed as unknown as Record<string, unknown> & { id: string }, { ...patch, ended_at: null });
      inv('breastfeeds');
      if (!ok) throw new FeedError(tr('bt.err.changed'));
    },
    /** Terminer la tétée (fin = maintenant). */
    async finish(feed: Breastfeed, now = new Date()) {
      const ok = await guardedUpdate('breastfeeds', feed as unknown as Record<string, unknown> & { id: string }, { ...finishPatch(feed as FeedLike, now) });
      inv('breastfeeds');
      void endLiveFor(`breast:${feed.id}`); // Live Activity de cette tétée : fin tout de suite
      if (ok) return;
      // Déjà terminée (double appui, autre appareil) : rien à refaire, ce n'est pas une erreur
      const [cur] = await backend.select<Breastfeed>({ table: 'breastfeeds', filters: [eq('id', feed.id)] });
      if (!cur?.ended_at) throw new FeedError(tr('bt.err.changed'));
    },
    /** Correction (fin, côté) d'une tétée : une seule écriture, refusée si l'entrée a changé entre-temps. */
    async edit(feed: Breastfeed, patch: Record<string, unknown>) {
      const ok = await guardedUpdate('breastfeeds', feed as unknown as Record<string, unknown> & { id: string }, patch);
      inv('breastfeeds');
      if (!ok) throw new FeedError(tr('bt.err.changed'));
    },
  };
}

export function usePumpActions(child: Child | null | undefined) {
  const add = useAddLog('pumping');
  const inv = useInvalidate();
  return {
    async add(amount_ml: number, side: Pumping['side'], at = new Date()) {
      if (!child) throw new FeedError(tr('bt.err.child'));
      const r = await add.mutateAsync({ child_id: child.id, household_id: child.household_id, note: null, at: at.toISOString(), amount_ml, side });
      // Séance notée : le chrono de tire-lait (et sa Live Activity) s'arrête
      const run = useUiStore.getState().pumpRun;
      if (run?.childId === child.id) useUiStore.getState().setPumpRun(null);
      return r;
    },
    async edit(p: Pumping, patch: Partial<Pick<Pumping, 'amount_ml' | 'side' | 'at'>>) {
      const ok = await guardedUpdate('pumpings', p as unknown as Record<string, unknown> & { id: string }, patch);
      inv('pumpings');
      if (!ok) throw new FeedError(tr('bt.err.changed'));
    },
  };
}
