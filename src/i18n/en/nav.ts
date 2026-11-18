import type { nav as fr } from '../fr/nav';
import type { Messages } from '../types';

export const nav: Messages<typeof fr> = {
  'nav.tab.health': 'Health',
  'nav.tab.baby': 'Baby',
  'nav.tab.family': 'Family',
  'nav.tablist': 'Main navigation',
  'nav.quickAdd': 'Quick add',
  'nav.quickAddHint': 'Bottle, breastfeed, nappy, sleep, mood…',
  'nav.search.button': 'Search for a tool',
  'nav.search.title': 'Search for a tool',
  'nav.search.ph': 'Bottle, sleep, appointment…',
  'nav.search.hint': 'Type a few letters: tools from all your profiles appear, along with your favourites and recent tools.',
  'nav.search.favs': 'My favourites',
  'nav.search.recents': 'Recently opened',
  'nav.search.count': { one: '{count} tool', other: '{count} tools' },
  'nav.search.empty': 'No matching tool',
  'nav.search.emptyB': 'Try another word, or browse all tools.',
  'nav.hub.family.title': 'Family',
  'nav.hub.family.sub': 'Calendar, tasks, night shifts and time for you',
  'nav.hub.empty': 'Nothing here for this profile',
  'nav.hub.emptyB': 'Pick another profile above, or change your journey.',
};
