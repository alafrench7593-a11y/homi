/**
 * Saisie d'une quantité d'ingrédient : le texte tapé reste tel quel (« 0 », « 1, », « 0,5 ») pendant la frappe,
 * seule la valeur numérique est déduite. Vide, illisible ou ≤ 0 → aucune quantité.
 */
export function parseQtyInput(text: string): number | null {
  const v = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(v) && v > 0 ? v : null;
}
