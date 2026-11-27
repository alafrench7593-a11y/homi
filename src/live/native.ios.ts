/**
 * Pont natif des Live Activities (expo-widgets SDK 57, ActivityKit). iOS 16.2+ et activités autorisées seulement :
 * sinon chaque appel échoue en silence (Expo Go, build sans extension, réglage iOS désactivé). Aucun appel réseau.
 */
import type { LiveKind, LiveProps } from './types';
import { WIDGET_LOGO_PNG_BASE64 } from '@/widgets/logo';

type Instance = { getId(): string; update(p: LiveProps, stale?: Date): Promise<void>; end(policy?: 'default' | 'immediate'): Promise<void> };
type Factory = { start(p: LiveProps, url?: string, stale?: Date): Instance; getInstances(): Instance[] };

let mod: Record<LiveKind, Factory> | null | undefined;
/** Crée les six types (chaque création enregistre la mise en page à jour pour l'extension : une mise à jour OTA suffit). */
function factories(): Record<LiveKind, Factory> | null {
  if (mod !== undefined) return mod;
  mod = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('./LiveActivities') as typeof import('./LiveActivities');
    mod = { breast: m.BreastLive, bottle: m.BottleLive, sleep: m.SleepLive, contractions: m.ContractionsLive, pump: m.PumpLive, relay: m.RelayLive } as unknown as Record<LiveKind, Factory>;
  } catch { /* module natif absent */ }
  return mod;
}

export function registerLiveLayouts(): void { factories(); }

/** Logo HOMI dans le dossier partagé app ↔ extension (même fichier que les widgets). */
let logoUri: string | null = null;
export function liveLogo(): string {
  if (logoUri !== null) return logoUri;
  logoUri = '';
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { widgetsDirectory } = require('expo-widgets') as typeof import('expo-widgets');
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (!widgetsDirectory) return logoUri;
    const f = new File(widgetsDirectory, 'homi-logo-v1.png');
    if (!f.exists) f.write(WIDGET_LOGO_PNG_BASE64, { encoding: 'base64' });
    logoUri = f.uri;
  } catch { /* pas de dossier partagé */ }
  return logoUri;
}

export interface NativeLive { id: string; kind: LiveKind; update(p: LiveProps, staleAt: number): Promise<void>; end(): Promise<void> }
const wrap = (kind: LiveKind, i: Instance): NativeLive => ({
  id: i.getId(), kind,
  update: (p, staleAt) => i.update(p, new Date(staleAt)),
  end: () => i.end('immediate'),
});

/** Activités HOMI affichées (tous types), ou null si l'API est indisponible. */
export function liveInstances(): NativeLive[] | null {
  const f = factories();
  if (!f) return null;
  try {
    return (Object.keys(f) as LiveKind[]).flatMap((k) => f[k].getInstances().map((i) => wrap(k, i)));
  } catch { return null; }
}

export function liveStart(kind: LiveKind, p: LiveProps, url: string, staleAt: number): string | null {
  const f = factories();
  if (!f) return null;
  try { return f[kind].start(p, url, new Date(staleAt)).getId(); } catch { return null; }
}
