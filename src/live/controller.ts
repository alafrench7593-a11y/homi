/**
 * Contrôleur des Live Activities (côté app). Applique les décisions pures de model.ts aux activités réellement
 * affichées par iOS, une opération à la fois (file d'attente : jamais deux démarrages concurrents pour une session).
 * Mémoire courte sur l'appareil (clé `homi.live.v1`, effacée au changement de compte) : quelle activité porte quelle
 * session, ce qui a été envoyé, et les sessions fermées par le parent. Aucune boucle : appelé au démarrage, au retour
 * au premier plan, quand les données changent, et aux points d'arrêt explicites.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectDismissed, planLive, sigOf, type Tracked } from './model';
import { liveInstances, liveStart, registerLiveLayouts } from './native';
import type { LiveKind, LiveSession } from './types';

const STORE_KEY = 'homi.live.v1';
/** Une session fermée par le parent est oubliée après 24 h (la mémoire ne grandit pas). */
const DISMISS_TTL = 24 * 3600_000;
interface Act { id: string; kind: LiveKind; key: string; scope: string; sig: string }
interface Mem { acts: Act[]; dismissed: { key: string; at: number }[] }

let mem: Mem | null = null;
async function load(): Promise<Mem> {
  if (mem) return mem;
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Mem>) : null;
    mem = { acts: Array.isArray(v?.acts) ? v!.acts : [], dismissed: Array.isArray(v?.dismissed) ? v!.dismissed : [] };
  } catch { mem = { acts: [], dismissed: [] }; }
  return mem;
}
async function save(m: Mem) {
  mem = m;
  try { await AsyncStorage.setItem(STORE_KEY, JSON.stringify(m)); } catch { /* mémoire seulement */ }
}

let chain: Promise<unknown> = Promise.resolve();
function queue<T>(fn: () => Promise<T>): Promise<T | undefined> {
  const run = chain.then(fn, fn).catch(() => undefined);
  chain = run;
  return run;
}

export { registerLiveLayouts };

/**
 * Met les activités affichées en accord avec les sessions en cours.
 * @param ready périmètres chargés (`type:périmètre`) : seuls eux peuvent terminer une activité.
 */
export function reconcileLive(desired: readonly LiveSession[], opts: { enabled: boolean; ready: ReadonlySet<string>; now?: number }): Promise<void> {
  return queue(async () => {
    const inst = liveInstances();
    if (!inst) return;
    const m = await load();
    const now = opts.now ?? Date.now();
    const liveIds = new Set(inst.map((i) => i.id));
    const desiredKeys = new Set(desired.map((d) => d.key));
    const gone = detectDismissed(m.acts, liveIds, desiredKeys);
    const dismissed = [...m.dismissed.filter((d) => now - d.at < DISMISS_TTL), ...gone.map((key) => ({ key, at: now }))];
    const tracked: Tracked[] = inst.map((i) => {
      const a = m.acts.find((x) => x.id === i.id);
      return { id: i.id, kind: i.kind, key: a?.key ?? null, scope: a?.scope ?? null, sig: a?.sig ?? null };
    });
    const plan = planLive(desired, tracked, { enabled: opts.enabled, ready: opts.ready, dismissed: new Set(dismissed.map((d) => d.key)) });
    const acts: Act[] = m.acts.filter((a) => liveIds.has(a.id) && !plan.end.includes(a.id));
    const put = (id: string, s: LiveSession) => {
      const i = acts.findIndex((a) => a.id === id);
      const a: Act = { id, kind: s.kind, key: s.key, scope: s.scope, sig: sigOf(s) };
      if (i >= 0) acts[i] = a; else acts.push(a);
    };
    for (const id of plan.end) { try { await inst.find((i) => i.id === id)?.end(); } catch { /* déjà terminée */ } }
    for (const u of plan.update) {
      try { await inst.find((i) => i.id === u.id)?.update(u.session.props, u.session.staleAt); put(u.id, u.session); } catch { /* disparue entre-temps */ }
    }
    for (const k of plan.keep) if (!acts.some((a) => a.id === k.id)) put(k.id, k.session);
    for (const s of plan.start) {
      const id = liveStart(s.kind, s.props, s.url, s.staleAt);
      if (id) put(id, s);
    }
    await save({ acts, dismissed });
  }) as Promise<void>;
}

/** Point d'arrêt explicite (fin de tétée, réveil, biberon terminé…) : l'activité de cette session se termine tout de suite. */
export function endLiveFor(key: string): Promise<void> {
  return queue(async () => {
    const m = await load();
    const ids = m.acts.filter((a) => a.key === key).map((a) => a.id);
    for (const i of liveInstances() ?? []) if (ids.includes(i.id)) { try { await i.end(); } catch { /* déjà terminée */ } }
    // Session finie : jamais relancée, même si le cache montre encore la ligne ouverte le temps du rechargement
    await save({ acts: m.acts.filter((a) => !ids.includes(a.id)), dismissed: [...m.dismissed.filter((d) => d.key !== key), { key, at: Date.now() }] });
  }) as Promise<void>;
}

/** Déconnexion, changement de compte, réglage désactivé : plus aucune activité HOMI affichée. */
export function endAllLive(): Promise<void> {
  return queue(async () => {
    for (const i of liveInstances() ?? []) { try { await i.end(); } catch { /* déjà terminée */ } }
    mem = { acts: [], dismissed: [] };
    try { await AsyncStorage.removeItem(STORE_KEY); } catch { /* rien d'autre à faire */ }
  }) as Promise<void>;
}

/** Tests : oublie la mémoire en RAM. */
export function __resetLiveMemory(): void { mem = null; chain = Promise.resolve(); }
