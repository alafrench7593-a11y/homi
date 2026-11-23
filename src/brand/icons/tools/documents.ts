/** Famille DOCUMENTS (résumés, bibliothèque, guides, vidéos, sources, papiers, export). Grille 24, trait 1,75. */
import { capsule, CLOSED_BOOK, CLOSED_BOOK_FILL, poly, rrect, star, type HomiIconDef } from '../geometry';

const BOOK = 'M3.75 6.2c2.8-.95 5.55-.6 8.25 1.2v12c-2.7-1.8-5.45-2.15-8.25-1.2zM20.25 6.2c-2.8-.95-5.55-.6-8.25 1.2v12c2.7-1.8 5.45-2.15 8.25-1.2z';
const FRONT = 'M4.5 7.25A1.75 1.75 0 0 1 6.25 5.5h7l3.5 3.5v10.75a1.75 1.75 0 0 1-1.75 1.75h-8.75a1.75 1.75 0 0 1-1.75-1.75z';
const DOC = 'M5.5 5.25A1.75 1.75 0 0 1 7.25 3.5h6.75l4.5 4.5v10.75a1.75 1.75 0 0 1-1.75 1.75h-9.5a1.75 1.75 0 0 1-1.75-1.75z';
const PAPER = 'M5 5.75A1.75 1.75 0 0 1 6.75 4h10.5A1.75 1.75 0 0 1 19 5.75v12.5A1.75 1.75 0 0 1 17.25 20H6.75A1.75 1.75 0 0 1 5 18.25z';
const BOOKS = `${rrect(4.5, 4.5, 3.5, 15, 0.9)}${rrect(9, 6.5, 3.5, 13, 0.9)}${poly(13.6, 7.2, 16.9, 6.3, 20.1, 18.6, 16.8, 19.5)}`;
const LINKS = `${capsule(5.75, 18.25, 10.25, 13.75, 2.9)}${capsule(13.75, 10.25, 18.25, 5.75, 2.9)}`;
const SCREEN = rrect(3, 5, 18, 14, 2.5);

export const DOCUMENTS = {
  /** Résumés : deux pages, la première écrite. */
  pagesStack: { fill: FRONT, stroke: `${FRONT}M13.25 5.5V9h3.5M7.5 13h6M7.5 16.5h4.5M8.5 5.5V4.25A1.75 1.75 0 0 1 10.25 2.5h7l2.5 2.5v11.25a1.75 1.75 0 0 1-1.75 1.75h-1.25` },
  /** Bibliothèque : les livres sur l'étagère. */
  shelf: { fill: BOOKS, stroke: `${BOOKS}M3 20.25h18M4.5 8h3.5M9 9.75h3.5` },
  /** Guides pratiques : le livre ouvert et son signet. */
  bookRibbon: { fill: BOOK, stroke: `${BOOK}M15.25 7v5.5l1.5-1.2 1.5 1.2V6.6` },
  /** Vidéos et tutos : l'écran et le bouton de lecture. */
  playScreen: { fill: SCREEN, stroke: `${SCREEN}M10 9.25v5.5l4.75-2.75z` },
  /** Sources et références : deux maillons. */
  link: { fill: LINKS, stroke: `${LINKS}M9.75 14.25l4.5-4.5` },
  /** Guides du cycle : le livre et le « i ». */
  bookInfo: { fill: CLOSED_BOOK_FILL, stroke: `${CLOSED_BOOK}M12 9v4.25`, dots: [[12, 6.6, 1.1]] },
  /** Papiers de la famille : la feuille et le trombone. */
  paperClip: { fill: PAPER, stroke: `${PAPER}M8 13h8M8 16.5h5M9.25 2.75v5.5a1.875 1.875 0 0 0 3.75 0V4.5a.9.9 0 0 0-1.8 0V8` },
  /** Export PDF du suivi : la page et la flèche qui en sort. */
  docArrow: { fill: DOC, stroke: `${DOC}M14 3.5V8h4.5M12 10.75v6M9.5 14.25l2.5 2.5 2.5-2.5` },
  /** Contenus recommandés pour toi : le livre et l'étincelle. */
  bookSpark: { fill: CLOSED_BOOK_FILL, stroke: `${CLOSED_BOOK}${star(12, 9.25, 3.5, 1.3, 4)}` },
} satisfies Record<string, HomiIconDef>;
