/** Mode développeur : actif en développement, ou après 7 appuis sur le numéro de version (Réglages). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'toietmoi.developer-mode.v1';
let cached: boolean | null = null;
const listeners = new Set<(v: boolean) => void>();

export async function setDeveloperMode(v: boolean): Promise<void> {
  cached = v;
  listeners.forEach((l) => l(v));
  await (v ? AsyncStorage.setItem(KEY, '1') : AsyncStorage.removeItem(KEY)).catch(() => undefined);
}

export function useDeveloperMode(): boolean {
  const [on, setOn] = useState<boolean>(__DEV__ || !!cached);
  useEffect(() => {
    if (cached == null) AsyncStorage.getItem(KEY).then((v) => { cached = v === '1'; setOn(__DEV__ || cached); }).catch(() => undefined);
    const l = (v: boolean) => setOn(__DEV__ || v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return on;
}
