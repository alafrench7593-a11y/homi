import type { nav as fr } from '../fr/nav';
import type { Messages } from '../types';

export const nav: Messages<typeof fr> = {
  'nav.tab.health': 'Salute',
  'nav.tab.baby': 'Bebè',
  'nav.tab.family': 'Famiglia',
  'nav.tablist': 'Navigazione principale',
  'nav.quickAdd': 'Aggiunta rapida',
  'nav.quickAddHint': 'Biberon, poppata, pannolino, sonno, umore…',
  'nav.search.button': 'Cerca un’app',
  'nav.search.title': 'Cerca un’app',
  'nav.search.ph': 'Biberon, sonno, appuntamento…',
  'nav.search.hint': 'Scrivi qualche lettera: compaiono gli strumenti di tutti i tuoi profili, con i preferiti e quelli recenti.',
  'nav.search.favs': 'I miei preferiti',
  'nav.search.recents': 'Aperti di recente',
  'nav.search.count': { one: '{count} strumento', other: '{count} strumenti' },
  'nav.search.empty': 'Nessuno strumento corrisponde',
  'nav.search.emptyB': 'Prova un’altra parola o sfoglia tutti gli strumenti.',
  'nav.hub.family.title': 'Famiglia',
  'nav.hub.family.sub': 'Agenda, compiti, turni di notte e tempo per te',
  'nav.hub.empty': 'Niente qui per questo profilo',
  'nav.hub.emptyB': 'Scegli un altro profilo qui sopra o modifica il tuo percorso.',
};
