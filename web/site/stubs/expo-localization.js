// Page publique (en français) : aucune lecture de module natif, langue fixée
export function getLocales() { return [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }]; }
export function getCalendars() { return [{ timeZone: 'Europe/Paris', uses24hourClock: true }]; }
