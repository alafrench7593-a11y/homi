/**
 * Rubrique « Sources et lectures » (0 à 10 ans) : uniquement des pages réellement consultées par l'équipe (dates indiquées).
 * On n'affiche que le titre, l'éditeur, un résumé court rédigé par l'équipe et le lien d'origine : aucun texte ni aucune photo
 * n'est copié. Aucune photo n'est affichée pour ces ressources (pas d'autorisation de réutilisation).
 * Catégorie « recettes familiales » : vide tant qu'aucun site n'a été vérifié et validé par un éditeur.
 */
export type ResourceKind = 'institution' | 'nutrition_org' | 'professional_blog' | 'family_recipes' | 'science';
export const RESOURCE_KINDS: ResourceKind[] = ['institution', 'nutrition_org', 'professional_blog', 'family_recipes', 'science'];

export interface ExternalResource {
  slug: string;
  kind: ResourceKind;
  title: string;
  publisher: string;
  description: string;
  url: string;
  min_age_months: number | null;
  max_age_months: number | null;
  topics: string[];
  references_note: string | null;
  published_on: string | null;
  consulted_on: string;
}

const R = (slug: string, kind: ResourceKind, title: string, publisher: string, url: string, description: string,
  ages: [number | null, number | null], topics: string[], consulted_on: string, published_on: string | null = null, references_note: string | null = null): ExternalResource =>
  ({ slug, kind, title, publisher, url, description, min_age_months: ages[0], max_age_months: ages[1], topics, consulted_on, published_on, references_note });

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  // Institutions
  R('ameli-biberon', 'institution', 'Bien préparer un biberon', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/preparer-biberon',
    'Les gestes d’hygiène, le dosage de la poudre et la conservation du biberon, étape par étape.', [0, 12], ['alimentation', 'hygiène'], '2026-10-20', '2024-11-12'),
  R('anses-biberon', 'institution', 'Biberon : comment le préparer et le conserver ?', 'ANSES', 'https://www.anses.fr/fr/content/biberon-comment-le-preparer-et-le-conserver',
    'Recommandations de l’agence sanitaire sur l’eau, la préparation à l’avance et la conservation des biberons.', [0, 12], ['alimentation', 'sécurité'], '2026-10-20', '2013-01-17'),
  R('anses-miel', 'institution', 'Pas de miel pour les enfants de moins d’un an', 'ANSES', 'https://www.anses.fr/fr/content/pas-de-miel-les-enfants-de-moins-dun-an',
    'Pourquoi le miel est déconseillé avant 1 an (risque de botulisme infantile).', [0, 12], ['alimentation', 'sécurité'], '2026-10-19', '2023-10-31'),
  R('anses-references', 'institution', 'Les références nutritionnelles en vitamines et minéraux', 'ANSES', 'https://www.anses.fr/fr/content/les-references-nutritionnelles-en-vitamines-et-mineraux',
    'Les apports de référence par âge (fer, calcium, sel…) utilisés pour notre score éditorial des recettes.', [6, 120], ['nutrition'], '2026-10-20', '2025-02-21'),
  R('santefr-3-6', 'institution', 'Enfant entre 3 et 6 ans, quels sont ses besoins nutritionnels ?', 'Santé.fr (contenu mpedia)', 'https://www.sante.fr/node/1247621',
    'Repères de portions, de groupes d’aliments et de rythme des repas pour les 3–6 ans.', [36, 72], ['alimentation'], '2026-10-19', '2023-07-27'),
  R('ameli-dents', 'institution', 'Les conseils pour prendre soin des dents de votre enfant', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/enfants/depistages-scolaires-assurance-maladie/depistage-dentaire-en-grande-section-de-maternelle/les-conseils-pour-prendre-soin-des-dents-de-votre-enfant',
    'Brossage, dentifrice adapté à l’âge et dépistage dentaire : les repères pour les enfants.', [12, 120], ['hygiène', 'dents'], '2026-10-20', '2025-09-02'),
  R('ameli-fievre', 'institution', 'Votre enfant a de la fièvre : que faire et quand consulter ?', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter',
    'Les bons réflexes et les signes qui doivent faire consulter rapidement.', [0, 120], ['santé'], '2026-10-20', '2024-09-03'),
  R('ameli-coucher', 'institution', 'Comment bien coucher un bébé ?', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe',
    'Couchage sur le dos, lit dégagé, température de la chambre : les règles de sécurité du sommeil.', [0, 24], ['sommeil', 'sécurité'], '2026-10-20', '2024-10-10'),
  R('ameli-sommeil-enfant', 'institution', 'Sommeil de l’enfant : ses étapes, sa durée et ses troubles', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/sommeil-enfant-importance-troubles-etapes',
    'Durées de sommeil selon l’âge et conseils en cas de difficultés.', [12, 120], ['sommeil'], '2026-10-20', '2026-03-12'),
  R('ameli-ecrans', 'institution', 'Comment adapter l’usage des écrans à l’âge de l’enfant ?', 'ameli.fr (Assurance Maladie)', 'https://www.ameli.fr/assure/sante/themes/ecrans-enfance-adolescence/usage-ecran-age',
    'Repères par âge pour limiter et accompagner l’usage des écrans.', [0, 120], ['écrans'], '2026-10-20', '2025-07-17'),
  R('santefr-pleurs', 'institution', 'Pleurs de mon enfant, les comprendre et les calmer', 'Santé.fr', 'https://www.sante.fr/pleurs-de-mon-enfant-les-comprendre-et-les-calmer',
    'Comprendre les pleurs du nourrisson et les gestes pour l’apaiser, y compris quand on est à bout.', [0, 24], ['bébé'], '2026-10-20', '2026-08-31'),
  R('santefr-sommeil-normal', 'institution', 'Sommeil normal du bébé : de la naissance à 3 ans', 'Santé.fr', 'https://www.sante.fr/sommeil-normal-du-bebe-de-la-naissance-3-ans',
    'Comment évolue le sommeil du bébé jusqu’à 3 ans.', [0, 36], ['sommeil'], '2026-10-20', '2019-07-01'),
  R('eurlex-cosmetiques', 'institution', 'Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques', 'EUR-Lex (Union européenne)', 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223',
    'Le texte européen qui encadre les cosmétiques, dont la liste des substances parfumantes allergisantes à déclarer.', [null, null], ['produits', 'cosmétiques'], '2026-10-20'),
  // Nutrition et pédiatrie
  R('spf-diversification', 'nutrition_org', 'Pas à pas, votre enfant mange comme un grand', 'Santé publique France (Manger Bouger)', 'https://www.mangerbouger.fr/content/show/1500/file/Brochure-SPF-Mangerbougerfr.pdf',
    'Le guide officiel de la diversification alimentaire : âges d’introduction, textures, quantités.', [4, 36], ['alimentation', 'diversification'], '2026-10-19'),
  R('mb-opposition', 'nutrition_org', 'Mon enfant ne veut pas manger : que faire face à son opposition ?', 'Manger Bouger (Santé publique France)', 'https://www.mangerbouger.fr/manger-mieux/a-tout-age-et-a-chaque-etape-de-la-vie/jeunes-enfants-de-0-a-3-ans-du-lait-a-la-diversification/mon-enfant-ne-veut-pas-manger-que-faire-face-a-son-opposition',
    'Néophobie alimentaire et refus de manger : comment réagir sans forcer.', [12, 72], ['alimentation'], '2026-10-20', '2025-10-27'),
  R('inspq-etouffement', 'nutrition_org', 'Risques d’étouffement – à surveiller jusqu’à 4 ans', 'Institut national de santé publique du Québec (hors France)', 'https://www.inspq.qc.ca/mieux-vivre/enfant/alimentation/aliments/risques-etouffement',
    'Les aliments à risque d’étouffement chez le jeune enfant et comment les préparer (repère complémentaire).', [6, 48], ['alimentation', 'sécurité'], '2026-10-19', '2026-02-17'),
  // Professionnels qualifiés
  R('mpedia-coucher', 'professional_blog', 'Coucher mon bébé', 'mpedia.fr (Association française de pédiatrie ambulatoire)', 'https://www.mpedia.fr/art-coucher-mon-bebe/',
    'Conseils de pédiatres sur le couchage et l’endormissement du bébé.', [0, 24], ['sommeil'], '2026-10-20', '2023-07-17'),
  R('mpedia-fievre', 'professional_blog', 'Fièvre bébé et enfant : que faire et quand consulter ?', 'mpedia.fr (Association française de pédiatrie ambulatoire)', 'https://www.mpedia.fr/art-fievre-enfant/',
    'Mesurer la fièvre, soulager l’enfant et reconnaître les signes d’alerte.', [0, 120], ['santé'], '2026-10-20', '2023-09-19'),
  R('mpedia-sommeil', 'professional_blog', 'Endormissement difficile, réveils et troubles du sommeil', 'mpedia.fr (Association française de pédiatrie ambulatoire)', 'https://www.mpedia.fr/art-troubles-sommeil-mois-ans/',
    'Réveils nocturnes, peurs du soir, rituels : l’avis de pédiatres selon l’âge.', [6, 120], ['sommeil'], '2026-10-20', '2023-01-13'),
  R('mpedia-proprete', 'professional_blog', 'Comment mon enfant va-t-il devenir propre ?', 'mpedia.fr (Association française de pédiatrie ambulatoire)', 'https://www.mpedia.fr/art-acquisition-proprete/',
    'Les étapes de l’acquisition de la propreté, sans pression.', [18, 60], ['développement'], '2026-10-20', '2023-08-31'),
  R('rdp-lait-cru', 'professional_blog', 'Pas de fromages au lait cru avant 5 ans', 'La Revue du Praticien', 'https://www.larevuedupraticien.fr/article/pas-de-fromages-au-lait-cru-avant-5-ans',
    'Rappel des autorités sanitaires sur les fromages au lait cru chez le jeune enfant.', [0, 60], ['alimentation', 'sécurité'], '2026-10-19', '2023-07-31'),
  // Publications scientifiques / données
  R('calnut-2020', 'science', 'Table de composition nutritionnelle CALNUT 2020', 'ANSES (Ciqual)', 'https://ciqual.anses.fr/',
    'Données de composition des aliments (énergie, protéines, fibres, sel, fer, calcium…) utilisées pour calculer notre score éditorial.', [null, null], ['nutrition', 'données'], '2026-10-20', '2020-07-07',
    'Licence Ouverte Etalab ; fichier récupéré via le dépôt public Open Food Facts.'),
];
