/** Live Activities : iOS seulement (voir native.ios.ts). Ailleurs (web, Android, tests), rien à afficher. */
import type { LiveKind, LiveProps } from './types';

export interface NativeLive { id: string; kind: LiveKind; update(p: LiveProps, staleAt: number): Promise<void>; end(): Promise<void> }
export function registerLiveLayouts(): void {}
export function liveLogo(): string { return ''; }
export function liveInstances(): NativeLive[] | null { return null; }
export function liveStart(_kind: LiveKind, _p: LiveProps, _url: string, _staleAt: number): string | null { return null; }
