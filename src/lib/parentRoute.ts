/**
 * Écran parent d'une adresse (D-14, QA 02/11/2026) : ouvert par un lien direct (notification, lien partagé),
 * « Retour » remontait toujours à l'accueil. On remonte à l'écran parent qui existe :
 * /child/abc/discoveries → /child/abc ; /community/post/123 → /community ; /pregnancy/calendar → /pregnancy.
 */
import { APP_ROUTES } from './routes.generated';

const ROUTES = APP_ROUTES.map((r) => r.split('/').filter(Boolean));

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
};

export function parentRoute(pathname: string): string {
  const clean = (pathname.split(/[?#]/)[0] ?? '/').replace(/\/+$/, '');
  const segments = clean.split('/').filter(Boolean);
  for (let n = segments.length - 1; n > 0; n--) {
    const candidate = segments.slice(0, n);
    if (matchRoute(candidate)) return '/' + candidate.join('/');
  }
  const home = segments.length > 1 || !matchRoute(segments) ? SECTION_HOME[segments[0] ?? ''] : undefined;
  return home && home !== clean ? home : '/';
}
