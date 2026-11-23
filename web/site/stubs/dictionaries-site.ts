// Page publique : seulement les textes français réellement lus par le catalogue et la recherche (généré au build)
import used from '../.build/fr-used.json';
type Msg = unknown;
export const FR = used as Record<string, Msg>;
export const DICTIONARIES: Record<string, Record<string, Msg>> = { fr: FR };
