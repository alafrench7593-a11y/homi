/**
 * Live Activities (27/11/2026) : calcule les sessions en cours à partir des données déjà en cache (mêmes requêtes que
 * les écrans et les widgets : aucune requête dédiée, aucun appel IA) et réconcilie les activités iOS :
 *  - au démarrage et à chaque retour au premier plan (session terminée ailleurs, par le coparent → fin ;
 *    session ouverte sans activité → démarrage) ;
 *  - dès que les données changent (une saisie invalide le cache, qui se recharge).
 * Aucune boucle de mise à jour : le chrono avance seul dans la vue native. Monté une fois dans les onglets (compte connecté).
 */
import { useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { BRAND } from '@/config/brand';
import { useAuth } from '@/lib/auth';
import { eq } from '@/lib/backend';
import { useActivePregnancy, useActiveSubject, useLogs, usePregnancies, useRows, useTrackedChildren } from '@/lib/data/hooks';
import { useCareShifts, usePeople } from '@/lib/data/hooks-family-load';
import { lastFeed } from '@/lib/domain/breastSession';
import { useBackendMode } from '@/lib/demoMode';
import { useUiStore } from '@/lib/store';
import type { Breastfeed, Sleep } from '@/lib/types';
import type { Contraction } from '@/features/birth/contractions';
import { endAllLive, reconcileLive, registerLiveLayouts } from './controller';
import { bottleLive, breastLive, contractionsLive, pumpLive, relayLive, sleepLive, type LiveCtx, type RunningBottleLike } from './model';
import { liveLogo } from './native';
import type { LiveSession } from './types';

const url = (path: string) => `${BRAND.scheme}://${path.replace(/^\//, '')}`;

export function useLiveActivitiesSync(): void {
  const { session } = useAuth();
  const me = session?.userId ?? null;
  const { isDemo } = useBackendMode();
  const setting = useUiStore((s) => s.liveActivitiesEnabled);
  // Données d'exemple (« Découvrir sans compte ») : jamais d'activité sur l'écran verrouillé
  const enabled = Platform.OS === 'ios' && setting !== false && !isDemo && !!me;
  const discreet = useUiStore((s) => s.widgetsPrivate);
  const detailed = useUiStore((s) => s.cycleWidgetDetailed);
  const homeChildId = useUiStore((s) => s.homeChildId);
  const pumpRun = useUiStore((s) => s.pumpRun);

  // Enfant suivi : même règle que les widgets (accueil, sinon profil actif, sinon le premier)
  const { data: children } = useTrackedChildren();
  const { subject } = useActiveSubject();
  const child = useMemo(() => {
    const list = children ?? [];
    return list.find((c) => c.id === homeChildId) ?? list.find((c) => subject?.type === 'child' && c.id === subject.id) ?? list[0] ?? null;
  }, [children, homeChildId, subject]);
  const cid = child?.id ?? null;

  const feeds = useLogs<Breastfeed>('breastfeed', cid, 2, { includePending: true });
  const bottle = useRows<RunningBottleLike>(['bottles', cid ?? '', 'running'], cid ? { table: 'bottles', filters: [eq('child_id', cid), eq('in_progress', true)], limit: 1 } : null);
  const sleeps = useLogs<Sleep>('sleep', cid, 8, { includePending: true });
  const pregnancies = usePregnancies();
  const pregnancy = useActivePregnancy();
  // Contractions : même requête que le chronomètre, seulement pendant une grossesse suivie
  const contractions = useRows<Contraction>(['contractions', me ?? ''], me && pregnancy ? { table: 'contractions', filters: [eq('user_id', me)], order: [{ col: 'started_at', asc: false }], limit: 500 } : null, { staleTime: 5_000 });
  const shifts = useCareShifts('night');
  const { personOf } = usePeople();

  const [tick, setTick] = useState(0);
  useEffect(() => { registerLiveLayouts(); }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setTick((n) => n + 1); });
    return () => sub.remove();
  }, []);

  const desired = useMemo(() => {
    const ctx: LiveCtx = { now: new Date(), discreet, detailed, logo: enabled ? liveLogo() : '', url };
    const out: (LiveSession | null)[] = [];
    if (child) {
      const lf = feeds.data ? lastFeed(feeds.data as never, child.id, ctx.now) : null;
      out.push(lf?.ongoing ? breastLive(lf.feed as never, child, ctx) : null);
      out.push(bottleLive(bottle.data?.[0] ?? null, child, ctx));
      out.push(sleepLive((sleeps.data ?? []) as never, child, ctx));
      out.push(pumpLive(pumpRun, child, ctx));
    }
    out.push(pregnancy ? contractionsLive(contractions.data ?? [], ctx) : null);
    out.push(relayLive(shifts.data ?? [], (id) => { const p = personOf(id); return { isMe: id === me, name: p?.name ?? '' }; }, ctx));
    return out.filter((s): s is LiveSession => !!s);
  }, [child, feeds.data, bottle.data, sleeps.data, pumpRun, pregnancy, contractions.data, shifts.data, personOf, me, discreet, detailed, enabled, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Périmètres chargés : seuls eux peuvent terminer une activité (jamais un faux « fini » pendant un chargement)
  const ready = useMemo(() => {
    const r = new Set<string>(['pump:device']);
    if (cid && feeds.data) r.add(`breast:${cid}`);
    if (cid && bottle.data) r.add(`bottle:${cid}`);
    if (cid && sleeps.data) r.add(`sleep:${cid}`);
    if (pregnancies.data && (!pregnancy || contractions.data)) r.add('contractions:me');
    if (shifts.data) r.add('relay:household');
    return r;
  }, [cid, feeds.data, bottle.data, sleeps.data, pregnancies.data, pregnancy, contractions.data, shifts.data]);

  const key = JSON.stringify([desired.map((d) => [d.key, d.props, d.staleAt]), [...ready].sort(), enabled, tick]);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!enabled) { void endAllLive(); return; }
    void reconcileLive(desired, { enabled, ready });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
