/**
 * Numéros d'urgence affichés selon le PAYS de résidence (pas la langue).
 * D-01 (QA 02/11/2026, P1) : en anglais avec « Royaume-Uni », l'écran ne montrait que les numéros
 * français et le bouton principal appelait le 15. La base ne contient que les ressources françaises :
 * hors de France, on affiche les numéros d'urgence du pays (REGIONS), traduits.
 */
import { deviceRegion, t as tr, type TKey } from '@/i18n';
import { defaultRegion, regionLabel, REGIONS } from '@/i18n/locales';
import { useUiStore } from '@/lib/store';
import type { EmergencyResource } from '@/lib/types';

export type EmergencyItem = { phone: string; label: string; description: string; available?: string | null };

/** Textes traduits des ressources françaises connues (la base les donne en français). */
const FR_KEYS: Record<string, { label: TKey; desc: TKey }> = {
  '15': { label: 'u7.emg.fr15.label', desc: 'u7.emg.fr15.desc' },
  '112': { label: 'u7.family.eu.label', desc: 'u7.emg.fr112.desc' },
  '3114': { label: 'u7.family.suicide.label', desc: 'u7.emg.fr3114.desc' },
  '119': { label: 'u7.emg.fr119.label', desc: 'u7.emg.fr119.desc' },
  '3919': { label: 'u7.emg.fr3919.label', desc: 'u7.emg.fr3919.desc' },
  '114': { label: 'u7.emg.fr114.label', desc: 'u7.emg.fr114.desc' },
};

export function regionPhones(region: string): string[] {
  const r = REGIONS.find((x) => x.code === region) ?? REGIONS.find((x) => x.code === 'OTHER')!;
  return r.emergency.split('·').map((s) => s.trim()).filter(Boolean);
}

/** Numéro du bouton principal « Appeler » : le premier numéro d'urgence du pays. */
export const primaryEmergencyPhone = (region: string) => regionPhones(region)[0] ?? '112';

export function emergencyItems(region: string, rows: EmergencyResource[] | undefined, lang: string): EmergencyItem[] {
  if (region === 'FR') {
    const fr = (rows ?? []).filter((r) => (r.country ?? 'FR') === 'FR');
    const base: EmergencyItem[] = fr.length ? fr : [
      { phone: '15', label: 'SAMU', description: '', available: null },
      { phone: '112', label: '', description: '', available: null },
      { phone: '3114', label: '', description: '', available: null },
    ];
    return base.map((r) => {
      const k = FR_KEYS[r.phone];
      if (!k || (lang === 'fr' && r.label && r.description)) return { ...r, available: r.available ?? tr('u7.family.samu.avail') };
      return { phone: r.phone, label: r.phone === '15' && lang === 'fr' ? 'SAMU' : tr(k.label), description: tr(k.desc), available: tr('u7.family.samu.avail') };
    });
  }
  const country = REGIONS.find((x) => x.code === region);
  const name = country && region !== 'OTHER' ? regionLabel(country, lang) : '';
  return regionPhones(region).map((phone, i) => ({
    phone,
    label: phone === '112' ? tr('u7.emg.intl112.label') : name ? tr('u7.emg.local.label', { country: name }) : tr('u7.emg.generic.label'),
    description: phone === '112' ? tr('u7.emg.intl112.desc') : i === 0 ? tr('u7.emg.local.desc') : tr('u7.emg.other.desc'),
    available: tr('u7.family.samu.avail'),
  }));
}

/** Pays retenu pour les urgences : celui choisi dans Réglages, sinon la région du téléphone. */
export function useEmergencyRegion(): string {
  const region = useUiStore((s) => s.region);
  return region ?? defaultRegion(deviceRegion());
}
