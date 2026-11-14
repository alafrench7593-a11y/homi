/** Écrans accessibles sans être connectée ; tous les autres supposent une session (garde dans _layout). */
const PUBLIC_ROUTES = [/^\/$/, /^\/welcome\/?$/, /^\/intro\/?$/, /^\/cinematic\/?$/, /^\/discover(\/.*)?$/, /^\/auth\//, /^\/legal\//, /^\/emergency\/?$/, /^\/settings\/family\/?$/];

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((r) => r.test(path));
}
