/**
 * Rendu différé (25/11/2026, retour iPhone « Mon cycle met un petit délai ») : l'écran s'affiche d'abord avec
 * l'essentiel, les blocs lourds arrivent juste après l'animation d'ouverture (au plus 300 ms).
 */
import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

export function useAfterTransition(maxMs = 300): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const go = () => { if (!done) { done = true; setReady(true); } };
    const task = InteractionManager.runAfterInteractions(go);
    const timer = setTimeout(go, maxMs);
    return () => { done = true; task.cancel?.(); clearTimeout(timer); };
  }, [maxMs]);
  return ready;
}
