/** Échelle du biberon gradué (logique pure) : capacité 240 ml, ou 330 ml au-delà ; graduations tous les 30 ml. */
export function bottleScale(ml: number | null | undefined): { capacity: number; ticks: number[] } {
  const capacity = (ml ?? 0) > 240 ? 330 : 240;
  const step = 30;
  const ticks = Array.from({ length: Math.floor(capacity / step) }, (_, i) => (i + 1) * step);
  return { capacity, ticks };
}
