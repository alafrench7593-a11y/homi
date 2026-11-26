/**
 * Brouillons de la communauté (publication, commentaire) : gardés sur le téléphone, par compte, jusqu'à l'envoi réussi.
 * Une erreur réseau, une fermeture de l'app ou un retour arrière ne font plus perdre un texte en cours.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';

const key = (userId: string, ctx: string) => `homi.community.draft.${userId}.${ctx}`;
export type Draft = { title?: string; body: string };

export async function loadDraft(userId: string | null | undefined, ctx: string): Promise<Draft | null> {
  if (!userId) return null;
  try { const raw = await AsyncStorage.getItem(key(userId, ctx)); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; }
}
export async function saveDraft(userId: string | null | undefined, ctx: string, d: Draft | null) {
  if (!userId) return;
  try {
    if (!d || (!d.body.trim() && !d.title?.trim())) await AsyncStorage.removeItem(key(userId, ctx));
    else await AsyncStorage.setItem(key(userId, ctx), JSON.stringify(d));
  } catch { /* stockage indisponible : le brouillon reste seulement à l'écran */ }
}

/** Restaure le brouillon une fois, puis l'enregistre 600 ms après la dernière frappe. `ctx` nul = désactivé (ex. modification). */
export function useDraft(userId: string | null | undefined, ctx: string | null, value: Draft, restoreInto: (d: Draft) => void) {
  const restored = useRef(false);
  useEffect(() => {
    if (!ctx || !userId || restored.current) return;
    restored.current = true;
    void loadDraft(userId, ctx).then((d) => { if (d) restoreInto(d); });
  }, [userId, ctx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ctx || !restored.current) return;
    const h = setTimeout(() => void saveDraft(userId, ctx, value), 600);
    return () => clearTimeout(h);
  }, [userId, ctx, value.body, value.title]); // eslint-disable-line react-hooks/exhaustive-deps
}
