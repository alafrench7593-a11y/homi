/** Numéros d'urgence de la région choisie (ou du téléphone), pour les messages d'orientation. */
import { deviceRegion } from '@/i18n';
import { defaultRegion, REGIONS } from '@/i18n/locales';
import { useUiStore } from '@/lib/store';

export function useEmergencyNumbers(): string {
  const region = useUiStore((s) => s.region);
  return (REGIONS.find((r) => r.code === (region ?? defaultRegion(deviceRegion()))) ?? REGIONS[0]).emergency;
}
