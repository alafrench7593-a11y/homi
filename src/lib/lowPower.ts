import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** Mode économie d'énergie (iPhone : « Mode économie d'énergie », Android : économiseur de batterie). */
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove?: () => void } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Battery = require('expo-battery') as typeof import('expo-battery');
      Promise.resolve(Battery.isLowPowerModeEnabledAsync()).then((v) => setLow(v === true)).catch(() => undefined);
      sub = Battery.addLowPowerModeListener(({ lowPowerMode }) => setLow(lowPowerMode));
    } catch { /* module absent (Expo Go ancien) : animations conservées */ }
    return () => { try { sub?.remove?.(); } catch { /* rien */ } };
  }, []);
  return low;
}
