/**
 * Tracés des pictogrammes « Au fil de nous » — dessins ORIGINAUX, construits ici à la main sur une grille 24 × 24
 * (aucun tracé copié d'une bibliothèque, d'une autre application ou d'un logo).
 *
 * Inspiration : le logo officiel (assets/brand) — un fil doré continu, délicat, aux extrémités arrondies, des
 * feuilles à nervure centrale, des courbes souples. Règles (détail dans MATERNITY_ICONOGRAPHY_SYSTEM.md) :
 *  - zone utile 2 → 22 (2 px de marge de sécurité), trait 1,6 à l'échelle, extrémités et jonctions arrondies ;
 *  - aucun texte, aucune lettre, aucun chiffre dans les dessins ;
 *  - `fill: 'solid'` : petit point plein (repère, pilule, orteil…) ; `fill: 'tint'` : forme fermée remplie d'une
 *    teinte légère dans l'état actif ; `muted` : élément secondaire en retrait (opacité réduite).
 *
 * Fichier sans dépendance React : utilisé par MaternityIcon, par les tests et par scripts/icon-sheet.mjs.
 */
import { arc, arrowHead, circle, drop, heart, leaf, n, polar, roundRect } from './geometry';

export interface IconStroke {
  d: string;
  fill?: 'solid' | 'tint';
  muted?: boolean;
}

export const MATERNITY_ICON_GROUPS = {
  femme: [
    'regles', 'cycle', 'ovulation', 'fertilite', 'contraception', 'symptomes', 'temperature', 'test_ovulation',
    'grossesse', 'femme_enceinte', 'echographie', 'rdv_prenatal', 'valise_maternite', 'naissance', 'post_partum',
    'retour_des_regles',
  ],
  bebe: [
    'nouveau_ne', 'allaitement', 'sein_gauche', 'sein_droit', 'tire_lait', 'biberon', 'lait_maternel', 'reserve_lait',
    'sommeil', 'couche', 'croissance', 'repas', 'diversification', 'vaccination', 'premiers_pas', 'developpement',
    'jumeaux', 'sevrage',
  ],
  famille: [
    'maman', 'papa', 'couple', 'famille', 'partage', 'calendrier_familial', 'taches', 'soutien', 'souvenirs', 'journal',
    'bien_etre', 'fatigue', 'humeur',
  ],
} as const;

export type MaternityIconGroup = keyof typeof MATERNITY_ICON_GROUPS;
export type MaternityIconName = (typeof MATERNITY_ICON_GROUPS)[MaternityIconGroup][number];

const S = (d: string): IconStroke => ({ d });
const solid = (d: string): IconStroke => ({ d, fill: 'solid' });
const tint = (d: string): IconStroke => ({ d, fill: 'tint' });
const muted = (d: string): IconStroke => ({ d, muted: true });
const dot = (cx: number, cy: number, r = 1.05) => solid(circle(cx, cy, r));

/** Petit bébé vu de face (tête ronde + mèche en boucle, comme la boucle du fil du logo). */
function babyHead(cx: number, cy: number, r: number): IconStroke[] {
  const top = cy - r;
  return [
    tint(circle(cx, cy, r)),
    S(`M${n(cx)} ${n(top)}C${n(cx - r * 0.1)} ${n(top - r * 0.5)} ${n(cx + r * 0.55)} ${n(top - r * 0.62)} ${n(cx + r * 0.5)} ${n(top - r * 0.16)}`),
  ];
}

/** Sein vu par la maman (vue plongeante) : courbe basse + aréole. `side` -1 = gauche, 1 = droite. */
function bust(active: -1 | 1): IconStroke[] {
  const cup = (s: -1 | 1) => {
    const cx = 12 + s * 4.6;
    const outer = 12 + s * 9;
    return `M${outer} ${8}C${outer} ${15.5} ${n(cx + s * 2.6)} ${18.6} ${cx} ${18.6}C${n(cx - s * 2.6)} ${18.6} ${12} ${16.6} ${12} ${13.2}`;
  };
  const side = (s: -1 | 1, on: boolean): IconStroke[] => on
    ? [S(cup(s)), dot(12 + s * 4.6, 14.6, 1.25)]
    : [muted(cup(s)), muted(circle(12 + s * 4.6, 14.6, 0.9))];
  return [
    ...side(-1, active === -1), ...side(1, active === 1),
    // repère du côté choisi : petit arc de fil au-dessus du sein concerné
    S(arc(12 + active * 4.6, 14.6, 7.6, active === -1 ? 318 : 12, active === -1 ? 348 : 42)),
  ];
}

/** Calendrier (cadre + anneaux + bandeau). */
function calendar(): IconStroke[] {
  return [S(roundRect(3.5, 5, 17, 15.5, 3)), S('M8 3V6.6'), S('M16 3V6.6'), S('M3.5 9.6H20.5')];
}

const D: Record<MaternityIconName, IconStroke[]> = {
  // ------------------------------------------------------------------ femme
  // Règles : une goutte élégante et sa petite sœur — sobre, jamais figurative.
  regles: [tint(drop(10.2, 3, 9, 15.6)), S('M7.9 14.2C7.9 15.6 8.9 16.6 10.2 16.7'), solid(drop(18.2, 15.2, 3, 5))],
  // Cycle : le fil fait le tour, un point marque le jour du cycle.
  cycle: [S(arc(12, 12, 8.5, 22, 338)), dot(12, 3.5, 1.4), muted(circle(12, 12, 2.6))],
  // Ovulation : l'ovocyte (noyau) et sa couronne en quatre arcs.
  ovulation: [tint(circle(12, 12, 4.4)), dot(13.2, 10.9, 1.2), S(arc(12, 12, 8.6, 18, 72)), S(arc(12, 12, 8.6, 108, 162)), S(arc(12, 12, 8.6, 198, 252)), S(arc(12, 12, 8.6, 288, 342))],
  // Fertilité : la pousse aux trois feuilles du logo.
  fertilite: [S('M12 20.5V9.2'), tint(leaf(12, 9.2, 12, 2.6, 0.3, true)), tint(leaf(12, 14.2, 5.4, 10.6, 0.3, true)), tint(leaf(12, 14.2, 18.6, 10.6, 0.3, true)), S('M7.5 20.8C10.2 19.8 13.8 19.8 16.5 20.8')],
  // Contraception : plaquette, pilules prises (pleines) et à prendre (en retrait).
  contraception: [tint(roundRect(5.5, 3, 13, 18, 3.4)), dot(9.6, 7.4, 1.35), dot(14.4, 7.4, 1.35), dot(9.6, 12, 1.35), muted(circle(14.4, 12, 1.2)), muted(circle(9.6, 16.6, 1.2)), muted(circle(14.4, 16.6, 1.2))],
  // Symptômes : la fiche d'observations et une onde douce.
  symptomes: [tint(roundRect(5, 4.5, 14, 17, 3)), S('M9.5 4.5V3.8C9.5 3.1 10 2.6 10.7 2.6H13.3C14 2.6 14.5 3.1 14.5 3.8V4.5'), S('M8 13.2H9.6L11 10.4L13 16L14.4 13.2H16'), S('M9 18H15')],
  // Température : thermomètre arrondi et graduations.
  temperature: [S('M10 14.6V5.4A2 2 0 0 1 14 5.4V14.6A3.7 3.7 0 1 1 10 14.6Z'), dot(12, 17.6, 1.6), S('M12 16V10'), S('M16.8 6.5H18.4'), S('M16.8 9.5H18.4')],
  // Test d'ovulation : bâtonnet, fenêtre à deux traits, puits de dépôt.
  test_ovulation: [tint(roundRect(8.2, 2.5, 7.6, 19, 3.8)), S('M10.6 8.6H13.4'), S('M10.6 11.8H13.4'), S(circle(12, 16.8, 1.4))],
  // Grossesse : le ventre arrondi de profil, un cœur à l'intérieur.
  grossesse: [S('M7.4 4C6.6 9 6.8 15 8 20'), S('M10.2 3C10.8 5.4 11.9 6.8 11.7 8.6C11.6 9.6 11.1 10 10.7 10.4C16.8 10.6 19.6 14.2 18.8 17.4C18.2 20 15.6 21.2 12.4 21'), tint(heart(14.4, 12.6, 4.6))],
  // Femme enceinte : silhouette au fil continu, en écho au logo (profil, main sous le ventre).
  femme_enceinte: [
    tint(circle(11.4, 4.9, 2.3)),
    S('M9.3 3.6C8.1 4.1 8 5.9 9.2 6.6'),
    S('M10.2 7.3C9.1 9.6 8.8 12.6 9.3 15.4C9.6 17.4 10.1 19.4 10 21.5'),
    S('M12.3 7.2C12.8 8.3 13.9 9.4 13.8 10.8C13.7 11.6 13.3 12 12.9 12.3C16.4 12.6 18.2 15.2 17.5 17.8C16.9 19.9 14.8 20.6 13 20.2V21.5'),
    S('M11.3 9.2C10.9 12.2 11.6 15.4 13.4 17.6C14.2 18.5 15.4 18.6 16.3 18'),
  ],
  // Échographie : l'éventail de la sonde et le petit profil.
  echographie: [S(roundRect(9, 2.2, 6, 2.8, 1.3)), tint('M10.2 5.4L4.4 15.6A13 13 0 0 0 19.6 15.6L13.8 5.4Z'), dot(11, 11.2, 1.5), S('M12.6 12.4C15 13 15.4 15.8 13 16.4')],
  // Rendez-vous prénatal : calendrier et cœur.
  rdv_prenatal: [...calendar(), tint(heart(12, 12.4, 6))],
  // Valise de maternité : valise, poignée, petit cœur.
  valise_maternite: [tint(roundRect(3.5, 7.5, 17, 13, 3)), S('M9 7.5V5.8C9 4.9 9.7 4.2 10.6 4.2H13.4C14.3 4.2 15 4.9 15 5.8V7.5'), S(heart(12, 11.6, 5.2)), S('M7.2 7.8V20.2'), S('M16.8 7.8V20.2')],
  // Naissance : le nouveau-né emmailloté et un petit cœur.
  naissance: [tint(circle(11, 7.4, 3)), S('M7.6 11.2C5.8 13 5.6 16.4 7 18.7C8 20.4 9.4 21.3 11 21.3C12.6 21.3 14 20.4 15 18.7C16.4 16.4 16.2 13 14.4 11.2'), S('M7.4 14.6C9.6 16 12.4 16 14.7 14.2'), solid(heart(18.6, 2.6, 4.4))],
  // Post-partum : la maman, un cœur posé sur elle (prendre soin de soi après la naissance).
  post_partum: [tint(circle(12, 7.6, 3.4)), S('M8.2 8.2C8 4.6 9.8 2.8 12 2.8C14.2 2.8 16 4.6 15.8 8.2C15.7 10.2 16.4 11.6 17.2 12.4'), S('M4.8 21C4.8 17.4 7.6 14.8 12 14.8C16.4 14.8 19.2 17.4 19.2 21'), solid(heart(12, 16.8, 3.8))],
  // Retour des règles : le cycle qui revient (flèche) et la goutte au centre.
  retour_des_regles: [S(arc(12, 12, 8.6, 40, 320)), S(arrowHead(polar(12, 12, 8.6, 320), 320 + 90)), tint(drop(12, 7.8, 5, 8.2))],

  // ------------------------------------------------------------------ bébé
  // Nouveau-né : visage rond, mèche en boucle, yeux fermés, sourire.
  nouveau_ne: [...babyHead(12, 13, 7.6), S('M8.4 12.6C9 13.4 10 13.4 10.6 12.6'), S('M13.4 12.6C14 13.4 15 13.4 15.6 12.6'), S('M10.8 16.4C11.5 17 12.5 17 13.2 16.4')],
  // Allaitement : la maman berce son bébé contre son sein.
  allaitement: [
    tint(circle(8.6, 5.4, 2.5)),
    S('M3.6 21.4C3.6 15.6 5.4 11.2 8.6 10.2C10.4 9.6 12 10.4 12.8 11.4'),
    ...babyHead(15.6, 12.6, 2.6),
    S('M6.6 15.2C9 19 14.6 19.4 19.6 15.2'),
  ],
  // Sein gauche / droit : vue de la maman (elle regarde vers le bas) — gauche à gauche. Le côté choisi est plein.
  sein_gauche: bust(-1),
  sein_droit: bust(1),
  // Tire-lait : téterelle, flacon gradué, levier.
  tire_lait: [S('M5.5 3.5H15.5L12.8 8.2H8.2Z'), tint(roundRect(7.4, 10.2, 6.2, 11.3, 2.4)), S('M8.2 8.2V10.2'), S('M12.8 8.2V10.2'), S('M9.6 14H11.4'), S('M9.6 17H11.4'), S('M15.5 3.5C18.4 3.5 19.8 5.4 19.6 8.4')],
  // Biberon : tétine, bague, corps gradué.
  biberon: [S('M10.6 6.2C10.6 4.2 11 2.8 12 2.8C13 2.8 13.4 4.2 13.4 6.2'), S(roundRect(8.4, 6.2, 7.2, 2.6, 1.2)), tint('M8.8 8.8V18.4A2.8 2.8 0 0 0 11.6 21.2H12.4A2.8 2.8 0 0 0 15.2 18.4V8.8'), S('M10.8 12.6H12.6'), S('M10.8 15.6H12.6')],
  // Lait maternel : la goutte de lait porte un cœur.
  lait_maternel: [S(drop(12, 2.8, 12, 18.6)), tint(heart(12, 12.6, 5.4))],
  // Réserve de lait : sachets de conservation empilés, goutte.
  reserve_lait: [muted('M9.4 4.6V3.6C9.4 3 9.9 2.6 10.4 2.6H18.4C19 2.6 19.4 3 19.4 3.6V15.4'), tint('M5 6.6H16V18.6A2.8 2.8 0 0 1 13.2 21.4H7.8A2.8 2.8 0 0 1 5 18.6Z'), S('M5 9.6H16'), S(drop(10.5, 12, 3.6, 6))],
  // Sommeil : croissant de lune et deux étoiles.
  sommeil: [tint('M19.6 14.8A8.4 8.4 0 1 1 9.2 4.4A6.6 6.6 0 0 0 19.6 14.8Z'), dot(16.6, 5.2, 1.2), dot(20, 8.6, 0.85)],
  // Couche : vue de face, ceinture et attaches.
  couche: [tint('M3.5 7H20.5V10C20.5 15.4 16.8 19.6 12 19.6C7.2 19.6 3.5 15.4 3.5 10Z'), S('M3.5 10.2H20.5'), S('M9 19.2C9.6 16.6 10.6 15.2 12 15.2C13.4 15.2 14.4 16.6 15 19.2')],
  // Croissance : la courbe qui monte, de la pousse à la feuille.
  croissance: [S('M4 3.5V20H20.5'), S('M7 17C10.8 16.4 12.4 11.2 17 8'), tint(leaf(17, 8, 20.6, 4.2, 0.32))],
  // Repas : bol et cuillère.
  repas: [tint('M3.6 11.6H20.4C20.4 16.2 16.6 20 12 20C7.4 20 3.6 16.2 3.6 11.6Z'), S('M13.8 9.4L18.6 3.8'), S('M7 15.2C8.2 16.4 9.6 17 11 17.1')],
  // Diversification : la carotte, premiers légumes.
  diversification: [tint('M4.4 19.6C6.6 17.4 11.6 11.4 14.2 9.6C15.6 8.6 17.4 9.8 16.8 11.4C15.8 14.2 9 18.6 4.4 19.6Z'), S('M9 15.4L10.4 16.2'), S('M11.8 12.6L13 13.4'), tint(leaf(16.4, 8.6, 15.4, 3.2, 0.3)), tint(leaf(16.4, 8.6, 20.8, 6.2, 0.3))],
  // Vaccination : seringue en diagonale, sobre.
  vaccination: [tint('M8.7 18.7L5.3 15.3L13.3 7.3L16.7 10.7Z'), S('M12.3 6.3L17.7 11.7'), S('M15 9L18.6 5.4'), S('M17 3.8L20.2 7'), S('M7 17L3.6 20.4'), S('M8.4 12.4L9.6 13.6'), S('M10.4 10.4L11.6 11.6')],
  // Premiers pas : deux petites empreintes.
  premiers_pas: [
    tint('M7.6 10.8C9.4 10.8 10 12.6 9.6 14.8C9.3 16.4 8.7 17.2 8.7 18.6C8.7 20 8 20.9 7 20.9C5.8 20.9 5.2 19.9 5.4 18.4C5.6 16.8 5.2 15.6 5.2 14C5.2 12 6 10.8 7.6 10.8Z'), dot(5.4, 8.2, 0.8), dot(7.4, 7.5, 0.8), dot(9.4, 8.1, 0.75),
    tint('M16.4 5.2C18.2 5.2 18.8 7 18.4 9.2C18.1 10.8 17.5 11.6 17.5 13C17.5 14.4 16.8 15.3 15.8 15.3C14.6 15.3 14 14.3 14.2 12.8C14.4 11.2 14 10 14 8.4C14 6.4 14.8 5.2 16.4 5.2Z'), dot(14.2, 3, 0.8), dot(16.2, 2.4, 0.8), dot(18.2, 2.9, 0.75),
  ],
  // Développement : cubes empilés, le dernier porte un cœur.
  developpement: [S(roundRect(3.5, 13, 8, 8, 2)), S(roundRect(12.5, 13, 8, 8, 2)), tint(roundRect(8, 4, 8, 8, 2)), S(heart(12, 6.4, 3.6))],
  // Jumeaux : deux petites têtes, deux mèches.
  jumeaux: [...babyHead(7.4, 10.6, 4), ...babyHead(16.6, 15.6, 4), S('M5.8 11.8C6.6 12.6 8.2 12.6 9 11.8'), S('M15 16.8C15.8 17.6 17.4 17.6 18.2 16.8')],
  // Sevrage : la tasse d'apprentissage à bec et anses.
  sevrage: [tint('M7 9.4H17L16 19A2.4 2.4 0 0 1 13.6 21.2H10.4A2.4 2.4 0 0 1 8 19Z'), S('M10.2 9.4L11 4.4H13L13.8 9.4'), S('M7.4 12.4H5.8C5 12.4 4.4 13 4.4 13.8V14.6C4.4 15.4 5 16 5.8 16H7.7'), S('M16.6 12.4H18.2C19 12.4 19.6 13 19.6 13.8V14.6C19.6 15.4 19 16 18.2 16H16.3')],

  // ------------------------------------------------------------------ famille
  // Maman : buste de face, cheveux longs.
  maman: [tint(circle(12, 8.6, 3.4)), S('M8.2 9.2C8 5.4 9.8 3.6 12 3.6C14.2 3.6 16 5.4 15.8 9.2C15.7 11.4 16.4 13 17.4 13.8'), S('M8.2 9.2C8.3 11.4 7.6 13 6.6 13.8'), S('M4.8 21C4.8 17.6 7.6 15.6 12 15.6C16.4 15.6 19.2 17.6 19.2 21')],
  // Papa : buste de face, cheveux courts, épaules larges.
  papa: [tint(circle(12, 8.4, 3.6)), S('M8.5 7.6C9.4 5.4 11.2 4.6 13 5.2C14 5.5 15 6.2 15.5 7.4'), S('M4 21C4 17 7.4 14.8 12 14.8C16.6 14.8 20 17 20 21')],
  // Couple : deux bustes côte à côte, un petit cœur.
  couple: [tint(circle(7.4, 8.8, 2.8)), S('M2.4 20.4C2.4 16.8 4.6 14.8 7.4 14.8C8.8 14.8 10 15.3 10.9 16.2'), tint(circle(16.6, 8.8, 2.8)), S('M21.6 20.4C21.6 16.8 19.4 14.8 16.6 14.8C15.2 14.8 14 15.3 13.1 16.2'), solid(heart(12, 2.6, 3.6))],
  // Famille : deux parents et un enfant devant eux.
  famille: [tint(circle(6.6, 6.6, 2.4)), S('M2.6 17.4C2.6 13.8 4.2 11.8 6.6 11.8C7.6 11.8 8.4 12.1 9.1 12.7'), tint(circle(17.4, 6.6, 2.4)), S('M21.4 17.4C21.4 13.8 19.8 11.8 17.4 11.8C16.4 11.8 15.6 12.1 14.9 12.7'), tint(circle(12, 12.4, 2.1)), S('M8.2 21C8.2 18.2 9.8 16.6 12 16.6C14.2 16.6 15.8 18.2 15.8 21')],
  // Partage : deux personnes reliées par le fil, qui va de l'une à l'autre.
  partage: [tint(circle(5.6, 17.6, 2.6)), tint(circle(18.4, 6.4, 2.6)), S('M7.6 15.6C10 13.6 9.2 10.6 11.6 9.4C13 8.7 14.2 9.4 15.4 8.4'), S(arrowHead([15.4, 8.4], 58, 2.4))],
  // Calendrier familial : calendrier, jours partagés.
  calendrier_familial: [...calendar(), dot(8.2, 13.4), dot(12, 13.4), muted(circle(15.8, 13.4, 0.9)), dot(8.2, 17), muted(circle(12, 17, 0.9)), dot(15.8, 17)],
  // Tâches : liste, deux tâches faites, une à faire.
  taches: [S('M3.6 6.4L5.2 8L8.2 5'), S('M11.4 6.6H20.4'), S('M3.6 12.2L5.2 13.8L8.2 10.8'), S('M11.4 12.4H20.4'), tint(circle(5.8, 18.2, 1.9)), S('M11.4 18.2H17.4')],
  // Soutien : un cœur porté par des mains en coupe.
  soutien: [tint(heart(12, 4, 8.4)), S('M3.4 12.6C3.6 17.6 7.4 20.8 12 20.8C16.6 20.8 20.4 17.6 20.6 12.6'), S('M6.6 14.6C8.2 16.4 10 17.2 12 17.2C14 17.2 15.8 16.4 17.4 14.6')],
  // Souvenirs : photo instantanée, colline et soleil.
  souvenirs: [S(roundRect(4, 3, 16, 18.4, 2.6)), tint(roundRect(6.6, 5.6, 10.8, 9.4, 1.4)), S('M6.8 13.6C8.6 11.6 10.4 11.4 12.2 13C13.4 12 15 11.8 17.2 13.2'), dot(14.4, 8.4, 1.2)],
  // Journal : carnet relié, signet, lignes d'écriture.
  journal: [tint(roundRect(5, 3, 14.4, 18.4, 2.6)), S('M8.4 3.2V21.2'), S('M14.4 3.2V8.4L15.6 7.4L16.8 8.4V3.2'), S('M11.2 12H16'), S('M11.2 15.2H16'), S('M11.2 18.2H14.4')],
  // Bien-être : le lotus, pétales en feuilles du logo.
  bien_etre: [tint(leaf(12, 16.4, 12, 4.4, 0.27)), S(leaf(11.4, 16.6, 3.8, 9.8, 0.24)), S(leaf(12.6, 16.6, 20.2, 9.8, 0.24)), S('M5 19.6C9 21 15 21 19 19.6')],
  // Fatigue : la batterie presque vide.
  fatigue: [S(roundRect(2.8, 7, 16, 10, 2.6)), S('M21.2 10.4V13.6'), solid(roundRect(5.4, 9.6, 3, 4.8, 1))],
  // Humeur : visage serein.
  humeur: [tint(circle(12, 12, 8.6)), dot(9, 10.2, 1.1), dot(15, 10.2, 1.1), S('M8.8 14.4C10.4 16.4 13.6 16.4 15.2 14.4')],
};

export const MATERNITY_ICONS: Readonly<Record<MaternityIconName, readonly IconStroke[]>> = D;
export const MATERNITY_ICON_NAMES = Object.keys(D) as MaternityIconName[];

export function isMaternityIconName(v: string): v is MaternityIconName {
  return Object.prototype.hasOwnProperty.call(D, v);
}
