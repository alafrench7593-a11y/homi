/**
 * Petits utilitaires CSV partagés.
 * Une cellule qui commence par = + - @ (ou tabulation / retour) serait interprétée comme une formule
 * par Excel ou Numbers : on la préfixe d'une apostrophe (recommandation OWASP « CSV injection »).
 */
export function csvCell(value: string): string {
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${v.replace(/"/g, '""')}"`;
}

/** Nom de fichier lisible : accents retirés, caractères spéciaux remplacés. */
export function safeFileName(name: string): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'export';
}
