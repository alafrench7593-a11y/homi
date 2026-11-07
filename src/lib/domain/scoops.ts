/**
 * Compteur de mesurettes (biberon de lait infantile en poudre).
 * L'application ne recommande AUCUNE quantité : la règle de dilution est celle imprimée sur la boîte du lait
 * utilisé (le plus souvent « 1 mesurette rase pour 30 ml d'eau », mais elle varie selon les marques), saisie
 * par le parent ; la quantité d'eau est celle conseillée par le médecin ou la PMI. Le calcul ne fait que
 * diviser, et signale quand le volume d'eau ne tombe pas juste (jamais d'arrondi silencieux : une
 * mesurette en trop ou en moins change la concentration du lait).
 */
export interface ScoopPlan { scoops: number; exact: boolean; lower: number; upper: number; lowerMl: number; upperMl: number }

export function scoopsFor(waterMl: number, mlPerScoop: number): ScoopPlan | null {
  if (!Number.isFinite(waterMl) || !Number.isFinite(mlPerScoop) || waterMl <= 0 || mlPerScoop <= 0) return null;
  if (waterMl > 400 || mlPerScoop > 100) return null;
  const raw = waterMl / mlPerScoop;
  const exact = Math.abs(raw - Math.round(raw)) < 1e-9;
  const lower = Math.floor(raw + 1e-9);
  const upper = exact ? lower : lower + 1;
  return { scoops: exact ? Math.round(raw) : raw, exact, lower, upper, lowerMl: lower * mlPerScoop, upperMl: upper * mlPerScoop };
}
