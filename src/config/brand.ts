/**
 * Identité de l'application — UN SEUL endroit à modifier si le nom change
 * (la disponibilité juridique de « Toi & Moi » doit être vérifiée avant publication).
 * Ce fichier est aussi lu par app.config.ts : il doit rester sans dépendance.
 */
export const BRAND = {
  name: 'Toi & Moi',
  shortName: 'Toi & Moi',
  tagline: 'À chaque étape de votre histoire',
  slug: 'toi-et-moi',
  scheme: 'toietmoi',
  bundleId: 'fr.toietmoi.app',
  supportEmail: 'contact@exemple.fr', // À remplacer avant publication
} as const;
