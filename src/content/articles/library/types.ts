/** Forme d'un article de la bibliothèque et de ses sources. */
export type ArticleJourney = 'ttc' | 'avoid' | 'pregnant' | 'newborn' | 'child' | 'parents_sleep';
export interface ArticleSource { label: string; url: string; consulted_on: string; published?: string }
export interface LibArticle {
  slug: string;              // kebab-case, unique, ascii
  title: string;
  summary: string;           // one sentence
  body_md: string;
  journeys: ArticleJourney[];
  category: 'grossesse' | 'accouchement' | 'post-partum' | 'sante-mentale' | 'bebe' | 'alimentation' | 'enfant' | 'cycle' | 'reeducation' | 'sexualite' | 'sommeil' | 'neurodeveloppement'
    // Guide complet (27/10/2026) : catégories fines par parcours
    | 'fertilite' | 'preparer-grossesse' | 'difficultes-conception'
    | 'suivi-grossesse' | 'alimentation-grossesse' | 'corps-grossesse' | 'sante-grossesse' | 'quotidien-grossesse' | 'droits-demarches'
    | 'alimentation-bebe' | 'sante-bebe' | 'developpement' | 'securite'
    | 'sante-enfant' | 'education' | 'ecole-garde' | 'maladies-chroniques'
    | 'activites-eveil' | 'sport' | 'materiel' | 'vie-pratique' | 'premiers-secours'
    // Règles, cycle et santé intime (27/10/2026)
    | 'regles' | 'cycle-ages' | 'sante-intime' | 'contraception';
  tags: string[];
  min_week?: number; max_week?: number;              // pregnancy weeks (SA) if relevant
  min_age_months?: number; max_age_months?: number;  // child age if relevant
  safety_critical?: boolean;  // true for content about warning signs / emergencies
  sources: ArticleSource[];   // at least 1, ideally 2
  status: 'to_review';
}
