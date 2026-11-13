/**
 * Écran parent d'une adresse (D-14, QA 02/11/2026) : ouvert par un lien direct (notification, lien partagé),
 * « Retour » remontait toujours à l'accueil. On remonte à l'écran parent qui existe :
 * /child/abc/discoveries → /child/abc ; /community/post/123 → /community ; /pregnancy/calendar → /pregnancy.
 */
import { APP_ROUTES } from './routes.generated';

const isDynamic = (p: string) => /^\[.+\]$/.test(p);
// Adresses statiques d'abord : « /sleep/tonight » est l'écran « Ce soir », pas « /sleep/[childId] » d'un enfant « tonight »
const ROUTES = APP_ROUTES.map((r) => r.split('/').filter(Boolean)).sort((a, b) => a.filter(isDynamic).length - b.filter(isDynamic).length);

function matchRoute(segments: string[]): string[] | null {
  for (const pattern of ROUTES) {
    if (pattern.length !== segments.length) continue;
    if (pattern.every((p, i) => p === segments[i] || (/^\[[^.\]]+\]$/.test(p) && segments[i] !== ''))) return pattern;
  }
  // pages « attrape-tout » ([...x])
  for (const pattern of ROUTES) {
    const i = pattern.findIndex((p) => p.startsWith('[...'));
    if (i >= 0 && segments.length > i && pattern.slice(0, i).every((p, k) => p === segments[k] || /^\[.+\]$/.test(p))) return pattern;
  }
  return null;
}

/** Sections sans écran d'accueil propre : leur écran de rattachement. */
const SECTION_HOME: Record<string, string> = {
  article: '/library', assistant: '/ask', legal: '/settings', partner: '/cycle', profiles: '/settings', auth: '/welcome',
  // Profil d'un enfant et sommeil d'un enfant : rangés dans l'onglet Bébé (audit navigation 13/11/2026, N-03)
  child: '/baby', sleep: '/baby',
};

/** Anciennes routes d'onglet (HOMI, hors de la barre) : « Retour » ramène à l'onglet qui les contient (cf. ACTIVE_ALIAS). */
const OLD_TAB_HOME: Record<string, string> = { '/agenda': '/household', '/track': '/baby', '/ask': '/health' };

export function parentRoute(pathname: string): string {
  const clean = (pathname.split(/[?#]/)[0] ?? '/').replace(/\/+$/, '');
  if (OLD_TAB_HOME[clean]) return OLD_TAB_HOME[clean];
  const segments = clean.split('/').filter(Boolean);
  const full = matchRoute(segments);
  for (let n = segments.length - 1; n > 0; n--) {
    const candidate = segments.slice(0, n);
    const m = matchRoute(candidate);
    // Un segment fixe de l'adresse (« help » dans /sleep/help/[childId]) n'est jamais pris pour un identifiant :
    // sinon « Retour » ouvrait /sleep/help, c.-à-d. le sommeil d'un enfant « help » (audit navigation 13/11/2026, N-02)
    if (m && (!full || m.every((p, i) => !isDynamic(p) || isDynamic(full[i] ?? '')))) return '/' + candidate.join('/');
  }
  const home = segments.length > 1 || !matchRoute(segments) ? SECTION_HOME[segments[0] ?? ''] : undefined;
  return home && home !== clean ? home : '/';
}
