/**
 * Guides de la bibliothèque : catégories rangées par parcours (titres FR, EN, ES, DE, IT). Module léger, sans le texte des
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
const GROUP_TITLE_ES: Record<string, string> = { 'Mon cycle et ma santé': 'Mi ciclo y mi salud', 'Je veux concevoir': 'Quiero concebir', 'Je suis enceinte': 'Estoy embarazada', 'Mon bébé (0 à 2 ans)': 'Mi bebé (0 a 2 años)', 'Mon enfant (2 à 10 ans)': 'Mi hijo o hija (2 a 10 años)' };
const GROUP_TITLE_DE: Record<string, string> = { 'Mon cycle et ma santé': 'Mein Zyklus und meine Gesundheit', 'Je veux concevoir': 'Ich möchte schwanger werden', 'Je suis enceinte': 'Ich bin schwanger', 'Mon bébé (0 à 2 ans)': 'Mein Baby (0 bis 2 Jahre)', 'Mon enfant (2 à 10 ans)': 'Mein Kind (2 bis 10 Jahre)' };
const GROUP_TITLE_IT: Record<string, string> = { 'Mon cycle et ma santé': 'Il mio ciclo e la mia salute', 'Je veux concevoir': 'Voglio concepire', 'Je suis enceinte': 'Sono incinta', 'Mon bébé (0 à 2 ans)': 'Il mio bambino (da 0 a 2 anni)', 'Mon enfant (2 à 10 ans)': 'Mio figlio o mia figlia (da 2 a 10 anni)' };
const withTitles = (m: Record<string, string>) => CATEGORY_GROUPS_FR.map((g) => ({ ...g, title: m[g.title] ?? g.title }));
export const CATEGORY_GROUPS: typeof CATEGORY_GROUPS_FR = localized(CATEGORY_GROUPS_FR, withTitles(GROUP_TITLE_EN), { es: withTitles(GROUP_TITLE_ES), de: withTitles(GROUP_TITLE_DE), it: withTitles(GROUP_TITLE_IT) });
