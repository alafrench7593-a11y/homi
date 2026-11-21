/**
 * « Scanner un document » depuis les Papiers de la famille (ticket 4, 21/11/2026) — logique pure, testée
 * (src/__tests__/papersScan.test.ts).
 *
 *  - garde SYNCHRONE contre les doubles appuis : le second appui, pendant que l'appareil photo s'ouvre ou que
 *    l'enregistrement est en cours, ne fait rien (un état React arrive trop tard : il faut un verrou immédiat) ;
 *  - paramètres d'ouverture du scanner : profil déjà choisi (l'enfant affiché dans « Papiers de la famille »),
 *    catégorie « Démarches », retour vers les papiers une fois le document enregistré.
 * Le scanner, le stockage (bucket privé `documents`) et les règles d'accès sont ceux de « Mes documents ».
 */

/** Verrou synchrone : `run` n'exécute l'action que si aucune n'est en cours ; le verrou tombe à la fin (succès ou échec). */
export function createTapGuard() {
  let busy = false;
  return {
    get busy() { return busy; },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      if (busy) return undefined;
      busy = true;
      try { return await fn(); } finally { busy = false; }
    },
  };
}

/** Paramètres de `/documents/scan` depuis « Papiers de la famille » (enfant affiché → profil de l'enfant). */
export function papersScanParams(o: { childId: string | null; camera: boolean }): Record<string, string> {
  return {
    ...(o.camera ? { from: 'camera' } : {}),
    origin: 'papers',
    cat: 'admin',
    ...(o.childId ? { child: o.childId } : {}),
  };
}

/** État de l'appareil photo après un appui : refus (lien vers les Réglages), annulation, ou photo prise. */
export type CaptureOutcome = 'denied' | 'canceled' | 'taken' | 'failed';
export function captureOutcome(r: string | null | 'denied' | Error): CaptureOutcome {
  if (r instanceof Error) return 'failed';
  if (r === 'denied') return 'denied';
  return r ? 'taken' : 'canceled';
}
