import type { nav as fr } from '../fr/nav';
import type { Messages } from '../types';

export const nav: Messages<typeof fr> = {
  'nav.tab.health': 'Gesundheit',
  'nav.tab.baby': 'Baby',
  'nav.tab.family': 'Familie',
  'nav.tablist': 'Hauptnavigation',
  'nav.quickAdd': 'Schnell hinzufügen',
  'nav.quickAddHint': 'Fläschchen, Stillen, Windel, Schlaf, Stimmung…',
  'nav.search.button': 'Eine App suchen',
  'nav.search.title': 'Eine App suchen',
  'nav.search.ph': 'Fläschchen, Schlaf, Termin…',
  'nav.search.hint': 'Tippe ein paar Buchstaben: Die Werkzeuge all deiner Profile erscheinen, mit deinen Favoriten und zuletzt genutzten.',
  'nav.search.favs': 'Meine Favoriten',
  'nav.search.recents': 'Zuletzt geöffnet',
  'nav.search.count': { one: '{count} Werkzeug', other: '{count} Werkzeuge' },
  'nav.search.empty': 'Kein passendes Werkzeug',
  'nav.search.emptyB': 'Versuche ein anderes Wort oder sieh dir alle Werkzeuge an.',
  'nav.hub.family.title': 'Familie',
  'nav.hub.family.sub': 'Kalender, Aufgaben, Nachtablösung und Zeit für dich',
  'nav.hub.empty': 'Hier nichts für dieses Profil',
  'nav.hub.emptyB': 'Wähle oben ein anderes Profil oder ändere deinen Weg.',
};
