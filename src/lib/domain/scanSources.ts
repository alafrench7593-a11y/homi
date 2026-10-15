/**
 * Sources publiques citées par les règles du scanner (liste fermée, revue par l'équipe).
 * Chaque règle cite au moins une de ces sources ; l'interface affiche le libellé, l'éditeur,
 * la date de publication (si connue) et la date de consultation.
 *
 * `review` :
 *  - 'verified'  : titre, date et contenu pertinent relus le 16/10/2026 ;
 *  - 'to_review' : référence réelle mais le passage précis n'a pas pu être relu automatiquement
 *                  (document PDF non accessible) — à faire relire par l'équipe éditoriale.
 * Module pur (aucune dépendance), partagé avec la migration 20261016000600_scanner.sql.
 */

export interface ScanSource {
  id: string;
  label: string;
  publisher: string;
  url: string;
  /** Date de publication ou de mise à jour indiquée par l'éditeur (AAAA-MM-JJ), si connue. */
  published_on: string | null;
  /** Date à laquelle l'équipe a consulté la source (AAAA-MM-JJ). */
  consulted_on: string;
  review: 'verified' | 'to_review';
}

const C = '2026-10-16';

export const SCAN_SOURCES: Record<string, ScanSource> = {
  'eu-1223-2009': {
    id: 'eu-1223-2009', label: 'Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques', publisher: 'Union européenne (EUR-Lex)',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223', published_on: '2009-11-30', consulted_on: C, review: 'verified',
  },
  'eu-2023-1545': {
    id: 'eu-2023-1545', label: 'Règlement (UE) 2023/1545 : étiquetage des substances parfumantes allergisantes', publisher: 'Commission européenne (EUR-Lex)',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1545', published_on: '2023-07-26', consulted_on: C, review: 'verified',
  },
  'eu-clp-1272-2008': {
    id: 'eu-clp-1272-2008', label: 'Règlement (CE) n° 1272/2008 (CLP) : classification, étiquetage et emballage des mélanges', publisher: 'Union européenne (EUR-Lex)',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32008R1272', published_on: '2008-12-16', consulted_on: C, review: 'verified',
  },
  'eu-inco-1169-2011': {
    id: 'eu-inco-1169-2011', label: 'Règlement (UE) n° 1169/2011 (INCO) : information des consommateurs sur les denrées alimentaires, dont les allergènes', publisher: 'Union européenne (EUR-Lex)',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169', published_on: '2011-10-25', consulted_on: C, review: 'verified',
  },
  'ansm-phenoxy-2019': {
    id: 'ansm-phenoxy-2019',
    label: 'Décision du 13/03/2019 : produits cosmétiques non rincés contenant du phénoxyéthanol, à ne pas utiliser sur le siège des enfants de 3 ans ou moins',
    publisher: 'ANSM',
    url: 'https://ansm.sante.fr/actualites/decision-du-13-03-2019-fixant-des-conditions-particulieres-dutilisation-des-produits-cosmetiques-non-rinces-contenant-du-phenoxyethanol-en-precisant-sur-leur-etiquetage-quils-ne-peuvent-pas-etre-utilises-sur-le-siege-des-enfants-de-3-ans-ou-moins',
    published_on: '2019-03-13', consulted_on: C, review: 'verified',
  },
  'anses-he-2024': {
    id: 'anses-he-2024', label: 'Huiles essentielles : risques et précautions', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/content/huiles-essentielles-risques-et-precautions', published_on: '2024-12-17', consulted_on: C, review: 'verified',
  },
  'anses-diffuseurs': {
    id: 'anses-diffuseurs', label: 'Sprays et diffuseurs à base d’huiles essentielles : l’Anses appelle à la vigilance', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/content/sprays-et-diffuseurs-base-dhuiles-essentielles-lanses-appelle-la-vigilance', published_on: null, consulted_on: C, review: 'to_review',
  },
  'anses-lait-cru-2022': {
    id: 'anses-lait-cru-2022', label: 'Fromages au lait cru : quels risques pour la santé et comment mieux les prévenir ?', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/content/fromages-au-lait-cru-quels-risques-pour-la-sante-et-comment-mieux-les-prevenir', published_on: '2022-04-08', consulted_on: C, review: 'verified',
  },
  'anses-mercure-2024': {
    id: 'anses-mercure-2024', label: 'Méthylmercure : un risque pour la santé en cas de consommation importante de poissons', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/content/methylmercure-un-risque-pour-la-sante-en-cas-de-consommation-importante-de-poissons', published_on: '2024-10-24', consulted_on: C, review: 'verified',
  },
  'anses-reglisse-2025': {
    id: 'anses-reglisse-2025', label: 'Évaluation des risques relatifs à la consommation alimentaire de réglisse (saisine 2022-AUTO-0077)', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/system/files/AP2022-AUTO-0077RA.pdf', published_on: '2025-05-09', consulted_on: C, review: 'verified',
  },
  'anses-miel-2010': {
    id: 'anses-miel-2010', label: 'Avis relatif à l’étiquetage du miel : ne pas en donner aux nourrissons de moins d’un an (botulisme infantile)', publisher: 'Anses',
    url: 'https://www.anses.fr/fr/system/files/MIC2010sa0130.pdf', published_on: '2010-07-13', consulted_on: C, review: 'verified',
  },
  'spf-grossesse-2025': {
    id: 'spf-grossesse-2025', label: 'Quels aliments éviter et quelles précautions prendre quand on est enceinte ?', publisher: 'Santé publique France – Manger Bouger (Santé.fr)',
    url: 'https://www.sante.fr/node/7070507', published_on: '2025-10-15', consulted_on: C, review: 'verified',
  },
  'mpedia-listeriose-2025': {
    id: 'mpedia-listeriose-2025', label: 'Listériose pendant la grossesse, quels aliments éviter ?', publisher: 'mpedia (AFPA) sur Santé.fr',
    url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter', published_on: '2025-04-25', consulted_on: C, review: 'verified',
  },
  'sante-alcool': {
    id: 'sante-alcool', label: 'L’alcool pendant la grossesse et l’allaitement', publisher: 'Santé.fr',
    url: 'https://www.sante.fr/node/1871139', published_on: null, consulted_on: C, review: 'verified',
  },
  'spf-pas-a-pas': {
    id: 'spf-pas-a-pas', label: 'Pas à pas, votre enfant mange comme un grand (diversification jusqu’à 3 ans)', publisher: 'Santé publique France',
    url: 'https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/documents/brochure/pas-a-pas-votre-enfant-mange-comme-un-grand',
    published_on: null, consulted_on: C, review: 'to_review',
  },
  lecrat: {
    id: 'lecrat', label: 'Médicaments, vaccins, grossesse et allaitement', publisher: 'CRAT – Centre de référence sur les agents tératogènes (AP-HP)',
    url: 'https://www.lecrat.fr', published_on: null, consulted_on: C, review: 'to_review',
  },
  rappelconso: {
    id: 'rappelconso', label: 'RappelConso, site officiel des rappels de produits', publisher: 'Gouvernement (DGCCRF, DGAL, DGS)',
    url: 'https://rappel.conso.gouv.fr', published_on: null, consulted_on: C, review: 'verified',
  },
  cosing: {
    id: 'cosing', label: 'Base CosIng des ingrédients cosmétiques', publisher: 'Commission européenne',
    url: 'https://ec.europa.eu/growth/tools-databases/cosing/', published_on: null, consulted_on: C, review: 'verified',
  },
  ciqual: {
    id: 'ciqual', label: 'Table de composition nutritionnelle Ciqual', publisher: 'Anses',
    url: 'https://ciqual.anses.fr/', published_on: null, consulted_on: C, review: 'verified',
  },
};

export function sourceById(id: string): ScanSource | null {
  return SCAN_SOURCES[id] ?? null;
}

/** Sources (dédupliquées) citées par une liste d'identifiants. */
export function collectSources(ids: Iterable<string>): ScanSource[] {
  const seen = new Set<string>();
  const out: ScanSource[] = [];
  for (const id of ids) {
    const s = SCAN_SOURCES[id];
    if (s && !seen.has(id)) {
      seen.add(id);
      out.push(s);
    }
  }
  return out;
}

/** Libellé court « Éditeur — titre (date) » pour l'affichage et l'explication IA. */
export function sourceLine(s: ScanSource): string {
  const d = s.published_on ? `publié le ${frDate(s.published_on)}` : `consulté le ${frDate(s.consulted_on)}`;
  return `${s.publisher} — ${s.label} (${d})`;
}

export function frDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
