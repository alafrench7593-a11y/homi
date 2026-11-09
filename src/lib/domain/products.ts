/**
 * Produits : outils purs côté application.
 * L'évaluation elle-même est partagée avec la fonction serveur (supabase/functions/_shared/product-rules.ts),
 * importée telle quelle — une seule source de vérité, testée par Jest.
 */
export { assessProduct, type Assessment, type Finding, type FindingLevel, type ProductData, type ScanContext } from '../../../supabase/functions/_shared/product-rules';
import type { FindingLevel } from '../../../supabase/functions/_shared/product-rules';
import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

/** Formulation neutre : jamais « dangereux », toujours un constat sourcé. */
const LEVEL_LABEL_FR: Record<FindingLevel, string> = {
  avoid_advised: 'Généralement déconseillé selon la source citée',
  attention: 'Point d’attention',
  info: 'Information',
};

const LEVEL_LABEL_EN: Record<FindingLevel, string> = {
  avoid_advised: 'Generally not recommended according to the cited source',
  attention: 'Point to watch',
  info: 'Information',
};
const LEVEL_LABEL_ES: Record<FindingLevel, string> = {
  avoid_advised: 'Generalmente desaconsejado según la fuente citada',
  attention: 'Punto de atención',
  info: 'Información',
};
const LEVEL_LABEL_DE: Record<FindingLevel, string> = {
  avoid_advised: 'Laut der genannten Quelle im Allgemeinen nicht empfohlen',
  attention: 'Worauf du achten solltest',
  info: 'Information',
};
const LEVEL_LABEL_IT: Record<FindingLevel, string> = {
  avoid_advised: 'Generalmente sconsigliato secondo la fonte citata',
  attention: 'Punto di attenzione',
  info: 'Informazione',
};
export const LEVEL_LABEL = localized(LEVEL_LABEL_FR, LEVEL_LABEL_EN, { es: LEVEL_LABEL_ES, de: LEVEL_LABEL_DE, it: LEVEL_LABEL_IT });

const CATEGORY_LABEL_FR: Record<string, string> = {
  cream: 'Crème', shampoo: 'Shampooing', wash_gel: 'Gel lavant', wipes: 'Lingettes', diapers: 'Couches', laundry: 'Lessive',
  household: 'Entretien', sunscreen: 'Protection solaire', food: 'Alimentation', drink: 'Boisson', baby_equipment: 'Équipement', other: 'Autre',
};
const CATEGORY_LABEL_EN: Record<string, string> = {
  cream: 'Cream', shampoo: 'Shampoo', wash_gel: 'Wash gel', wipes: 'Wipes', diapers: 'Nappies', laundry: 'Laundry detergent',
  household: 'Household cleaning', sunscreen: 'Sun protection', food: 'Food', drink: 'Drink', baby_equipment: 'Equipment', other: 'Other',
};
const CATEGORY_LABEL_ES: Record<string, string> = {
  cream: 'Crema', shampoo: 'Champú', wash_gel: 'Gel limpiador', wipes: 'Toallitas', diapers: 'Pañales', laundry: 'Detergente para ropa',
  household: 'Limpieza del hogar', sunscreen: 'Protección solar', food: 'Alimentación', drink: 'Bebida', baby_equipment: 'Equipamiento', other: 'Otro',
};
const CATEGORY_LABEL_DE: Record<string, string> = {
  cream: 'Creme', shampoo: 'Shampoo', wash_gel: 'Waschgel', wipes: 'Feuchttücher', diapers: 'Windeln', laundry: 'Waschmittel',
  household: 'Haushaltsreiniger', sunscreen: 'Sonnenschutz', food: 'Lebensmittel', drink: 'Getränk', baby_equipment: 'Ausstattung', other: 'Sonstiges',
};
const CATEGORY_LABEL_IT: Record<string, string> = {
  cream: 'Crema', shampoo: 'Shampoo', wash_gel: 'Gel detergente', wipes: 'Salviette', diapers: 'Pannolini', laundry: 'Detersivo per bucato',
  household: 'Pulizia della casa', sunscreen: 'Protezione solare', food: 'Alimentazione', drink: 'Bevanda', baby_equipment: 'Attrezzatura', other: 'Altro',
};
export const CATEGORY_LABEL = localized(CATEGORY_LABEL_FR, CATEGORY_LABEL_EN, { es: CATEGORY_LABEL_ES, de: CATEGORY_LABEL_DE, it: CATEGORY_LABEL_IT });

export function cleanBarcode(input: string): string {
  return input.replace(/\D/g, '');
}

/** Clé de contrôle GS1 (EAN-8, UPC-A, EAN-13, ITF-14). */
export function hasValidCheckDigit(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export type BarcodeCheck = { ok: true; code: string; warning?: string } | { ok: false; error: string };

export function checkBarcode(input: string): BarcodeCheck {
  const code = cleanBarcode(input);
  if (code.length < 8 || code.length > 14) return { ok: false, error: tr('l7.products.barcode_len') };
  if (!hasValidCheckDigit(code)) return { ok: true, code, warning: tr('l7.products.barcode_check') };
  return { ok: true, code };
}

/** Quota mensuel de scans détaillés (10 en version gratuite, cf. plan_limits). */
export function scanQuota(used: number, limit: number) {
  const remaining = Math.max(0, limit - used);
  return { remaining, reached: used >= limit };
}
