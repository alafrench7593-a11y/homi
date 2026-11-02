/**
 * Guides de la bibliothèque : catégories rangées par parcours (titres FR et EN). Module léger, sans le texte des
 * articles (QA E-06) : l'écran Bibliothèque l'importe sans charger les 11 Mo de contenus. Réexporté par rows.ts.
 */
import { localized } from '@/i18n/localized';

/** Catégories rangées par parcours : la bibliothèque les présente comme un guide (toutes les questions d'un même moment de vie). */
const CATEGORY_GROUPS_FR: { journey: 'avoid' | 'ttc' | 'pregnant' | 'newborn' | 'child'; title: string; slugs: string[] }[] = [
  { journey: 'avoid', title: 'Mon cycle et ma santé', slugs: ['regles', 'cycle-ages', 'sante-intime', 'contraception', 'cycle', 'sexualite', 'sante-mentale'] },
  { journey: 'ttc', title: 'Je veux concevoir', slugs: ['fertilite', 'preparer-grossesse', 'difficultes-conception', 'cycle', 'sexualite'] },
  { journey: 'pregnant', title: 'Je suis enceinte', slugs: ['suivi-grossesse', 'alimentation-grossesse', 'corps-grossesse', 'sante-grossesse', 'sport', 'quotidien-grossesse', 'grossesse', 'sante-mentale', 'sexualite', 'accouchement', 'materiel', 'vie-pratique', 'droits-demarches'] },
  { journey: 'newborn', title: 'Mon bébé (0 à 2 ans)', slugs: ['alimentation-bebe', 'sommeil', 'bebe', 'sante-bebe', 'premiers-secours', 'developpement', 'activites-eveil', 'neurodeveloppement', 'maladies-chroniques', 'securite', 'materiel', 'post-partum', 'reeducation', 'sport', 'alimentation', 'vie-pratique', 'droits-demarches'] },
  { journey: 'child', title: 'Mon enfant (2 à 10 ans)', slugs: ['sante-enfant', 'premiers-secours', 'neurodeveloppement', 'maladies-chroniques', 'alimentation', 'activites-eveil', 'sport', 'enfant', 'education', 'sommeil', 'ecole-garde', 'securite', 'materiel', 'vie-pratique'] },
];
/** D-08 (QA) : titres des guides dans la langue en cours. */
const GROUP_TITLE_EN: Record<string, string> = { 'Mon cycle et ma santé': 'My cycle and my health', 'Je veux concevoir': 'Trying to conceive', 'Je suis enceinte': 'I am pregnant', 'Mon bébé (0 à 2 ans)': 'My baby (0 to 2 years)', 'Mon enfant (2 à 10 ans)': 'My child (2 to 10 years)' };
export const CATEGORY_GROUPS: typeof CATEGORY_GROUPS_FR = localized(CATEGORY_GROUPS_FR, CATEGORY_GROUPS_FR.map((g) => ({ ...g, title: GROUP_TITLE_EN[g.title] ?? g.title })));
