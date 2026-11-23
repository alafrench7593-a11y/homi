// Passe d'enregistrement (build) : dictionnaire français complet, chaque clé lue est notée
import * as fr from '../../../src/i18n/fr';
type Msg = unknown;
const full = Object.assign({}, ...Object.values(fr as unknown as Record<string, Record<string, Msg>>)) as Record<string, Msg>;
export const USED = new Set<string>();
export const FR = new Proxy(full, { get(t, k: string) { if (k in t) USED.add(k); return t[k]; } });
export const DICTIONARIES: Record<string, Record<string, Msg>> = { fr: FR };
(globalThis as unknown as { __homiUsedKeys: Set<string>; __homiDict: Record<string, Msg> }).__homiUsedKeys = USED;
(globalThis as unknown as { __homiDict: Record<string, Msg> }).__homiDict = full;
