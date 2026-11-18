import type { nav as fr } from '../fr/nav';
import type { Messages } from '../types';

export const nav: Messages<typeof fr> = {
  'nav.tab.health': 'Salud',
  'nav.tab.baby': 'Bebé',
  'nav.tab.family': 'Familia',
  'nav.tablist': 'Navegación principal',
  'nav.quickAdd': 'Añadir rápido',
  'nav.quickAddHint': 'Biberón, toma, pañal, sueño, ánimo…',
  'nav.search.button': 'Buscar una herramienta',
  'nav.search.title': 'Buscar una herramienta',
  'nav.search.ph': 'Biberón, sueño, cita…',
  'nav.search.hint': 'Escribe unas letras: aparecen las herramientas de todos tus perfiles, con tus favoritas y las recientes.',
  'nav.search.favs': 'Mis favoritas',
  'nav.search.recents': 'Abiertas recientemente',
  'nav.search.count': { one: '{count} herramienta', other: '{count} herramientas' },
  'nav.search.empty': 'Ninguna herramienta coincide',
  'nav.search.emptyB': 'Prueba otra palabra o explora todas las herramientas.',
  'nav.hub.family.title': 'Familia',
  'nav.hub.family.sub': 'Agenda, tareas, relevos de noche y tiempo para ti',
  'nav.hub.empty': 'Nada aquí para este perfil',
  'nav.hub.emptyB': 'Elige otro perfil arriba o cambia tu recorrido.',
};
