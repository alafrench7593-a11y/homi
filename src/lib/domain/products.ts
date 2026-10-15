/**
 * Produits : outils purs côté application.
 * L'évaluation elle-même est partagée avec la fonction serveur (supabase/functions/_shared/product-rules.ts),
 * importée telle quelle — une seule source de vérité, testée par Jest.
 */
export { assessProduct, type Assessment, type Finding, type FindingLevel, type ProductData, type ScanContext } from '../../../supabase/functions/_shared/product-rules';
import type { FindingLevel } from '../../../supabase/functions/_shared/product-rules';

/** Formulation neutre : jamais « dangereux », toujours un constat sourcé. */
export const LEVEL_LABEL: Record<FindingLevel, string> = {
  avoid_advised: 'Généralement déconseillé selon la source citée',
  attention: 'Point d’attention',
  info: 'Information',
};

export const CATEGORY_LABEL: Record<string, string> = {
  cream: 'Crème', shampoo: 'Shampooing', wash_gel: 'Gel lavant', wipes: 'Lingettes', diapers: 'Couches', laundry: 'Lessive',
  household: 'Entretien', sunscreen: 'Protection solaire', food: 'Alimentation', drink: 'Boisson', baby_equipment: 'Équipement', other: 'Autre',
};

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
  if (code.length < 8 || code.length > 14) return { ok: false, error: 'Un code-barres compte de 8 à 14 chiffres.' };
  if (!hasValidCheckDigit(code)) return { ok: true, code, warning: 'La clé de contrôle ne correspond pas : vérifiez les chiffres saisis.' };
  return { ok: true, code };
}

/** Quota mensuel de scans détaillés (10 en version gratuite, cf. plan_limits). */
export function scanQuota(used: number, limit: number) {
  const remaining = Math.max(0, limit - used);
  return { remaining, reached: used >= limit };
}
