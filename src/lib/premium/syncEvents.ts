/**
 * Signal « l'abonnement a pu changer côté serveur » (après subscription-sync) : sans dépendance, pour que les écrans
 * relisent has_premium et la ligne d'abonnement sans importer le SDK d'achat.
 */
const listeners = new Set<() => void>();

export function onSubscriptionChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function notifySubscriptionChanged() {
  listeners.forEach((fn) => {
    try { fn(); } catch { /* écran démonté */ }
  });
}
