/**
 * Classification des documents : groupes, catégories, icônes et suggestion à partir du texte.
 * La suggestion n'est qu'une proposition : la catégorie reste modifiable, et un document rangé ici
 * n'est pas supposé médical (catégories « personnel », « administratif », « assurance »…).
 */
import type { IconName } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';

export type DocGroup = 'health' | 'pregnancy' | 'child' | 'other';
export type DocCategory =
  | 'ultrasound' | 'report' | 'blood_test' | 'prescription' | 'letter' | 'photo' | 'other'
  | 'exam_result' | 'consultation' | 'hospital' | 'certificate' | 'vaccination' | 'allergy' | 'chronic' | 'dental' | 'eye' | 'physio' | 'psych' | 'gyneco'
  | 'prenatal' | 'pregnancy_report' | 'maternity' | 'birth' | 'postnatal'
  | 'health_book' | 'growth' | 'development'
  | 'insurance' | 'admin' | 'invoice' | 'appointment' | 'personal' | 'custom';

export interface CategoryDef { value: DocCategory; group: DocGroup; icon: IconName; medical: boolean }

export const CATEGORIES: CategoryDef[] = [
  { value: 'prescription', group: 'health', icon: 'clipboard', medical: true },
  { value: 'blood_test', group: 'health', icon: 'droplet', medical: true },
  { value: 'exam_result', group: 'health', icon: 'activity', medical: true },
  { value: 'report', group: 'health', icon: 'file-text', medical: true },
  { value: 'letter', group: 'health', icon: 'mail', medical: true },
  { value: 'consultation', group: 'health', icon: 'message-square', medical: true },
  { value: 'hospital', group: 'health', icon: 'home', medical: true },
  { value: 'certificate', group: 'health', icon: 'award', medical: true },
  { value: 'vaccination', group: 'health', icon: 'shield', medical: true },
  { value: 'allergy', group: 'health', icon: 'alert-triangle', medical: true },
  { value: 'chronic', group: 'health', icon: 'repeat', medical: true },
  { value: 'dental', group: 'health', icon: 'smile', medical: true },
  { value: 'eye', group: 'health', icon: 'eye', medical: true },
  { value: 'physio', group: 'health', icon: 'move', medical: true },
  { value: 'psych', group: 'health', icon: 'feather', medical: true },
  { value: 'gyneco', group: 'health', icon: 'heart', medical: true },
  { value: 'ultrasound', group: 'pregnancy', icon: 'radio', medical: true },
  { value: 'prenatal', group: 'pregnancy', icon: 'moon', medical: true },
  { value: 'pregnancy_report', group: 'pregnancy', icon: 'file-text', medical: true },
  { value: 'maternity', group: 'pregnancy', icon: 'home', medical: true },
  { value: 'birth', group: 'pregnancy', icon: 'sunrise', medical: false },
  { value: 'postnatal', group: 'pregnancy', icon: 'sun', medical: true },
  { value: 'health_book', group: 'child', icon: 'book', medical: true },
  { value: 'growth', group: 'child', icon: 'trending-up', medical: true },
  { value: 'development', group: 'child', icon: 'star', medical: true },
  { value: 'insurance', group: 'other', icon: 'umbrella', medical: false },
  { value: 'admin', group: 'other', icon: 'briefcase', medical: false },
  { value: 'invoice', group: 'other', icon: 'credit-card', medical: false },
  { value: 'appointment', group: 'other', icon: 'calendar', medical: false },
  { value: 'personal', group: 'other', icon: 'archive', medical: false },
  { value: 'photo', group: 'other', icon: 'image', medical: false },
  { value: 'other', group: 'other', icon: 'file', medical: false },
  { value: 'custom', group: 'other', icon: 'tag', medical: false },
];
export const GROUPS: DocGroup[] = ['health', 'pregnancy', 'child', 'other'];

export const categoryDef = (c: string): CategoryDef => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES.find((x) => x.value === 'other')!;
export const categoryLabel = (c: string, custom?: string | null) => (c === 'custom' && custom ? custom : tr(`docs.cat.${c}` as TKey));
export const groupLabel = (g: DocGroup) => tr(`docs.group.${g}` as TKey);

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Indices textuels (français, quelques termes anglais) → catégorie. Le premier groupe trouvé l'emporte, par ordre de spécificité. */
const HINTS: [DocCategory, RegExp][] = [
  ['prescription', /\b(ordonnance|prescription|posologie|qsp|a renouveler|renouvelable|comprime[s]? par jour|gelule)/],
  ['vaccination', /\b(vaccin|vaccination|rappel vaccinal|carnet de vaccination|hexyon|infanrix|vaxelis|prevenar|priorix|m-m-rvaxpro|gardasil|bexsero|nimenrix|engerix|rotarix|ror\b|dtp)/],
  ['ultrasound', /\b(echographie|echographique|biometrie|clarte nucale|lcc|bip\b|morphologique)/],
  ['blood_test', /\b(prise de sang|bilan sanguin|hemogramme|numeration formule|nfs\b|ferritine|hemoglobine|glycemie|hba1c|creatinine|tsh\b|crp\b|serologie|plaquettes|leucocytes)/],
  ['exam_result', /\b(resultats? d.examen|irm\b|scanner|radiographie|radio\b|ecg\b|electrocardiogramme|ecbu|frottis|mammographie|densitometrie)/],
  ['prenatal', /\b(bilan prenatal|consultation prenatale|groupe sanguin|rhesus|agglutinines|toxoplasmose|rubeole|test de o.sullivan|hgpo)/],
  ['maternity', /\b(maternite|projet de naissance|preparation a la naissance)/],
  ['birth', /\b(acte de naissance|declaration de naissance|certificat de naissance)/],
  ['postnatal', /\b(post-?natal|post-?partum|visite post|reeducation perineale)/],
  ['hospital', /\b(hospitalisation|compte rendu d.hospitalisation|lettre de sortie|bulletin de situation|urgences)/],
  ['certificate', /\b(certificat medical|certificat d.aptitude|certifie)/],
  ['allergy', /\b(allergolog|allergie|prick.?test|ige specifiques)/],
  ['dental', /\b(dentaire|dentiste|orthodont|carie)/],
  ['eye', /\b(ophtalmolog|acuite visuelle|lunettes|dioptrie|orthoptie)/],
  ['physio', /\b(kinesitherap|kine\b|seances? de reeducation)/],
  ['psych', /\b(psycholog|psychiatr|psychotherap)/],
  ['gyneco', /\b(gynecolog|contraception|sterilet|implant contraceptif|pilule)/],
  ['growth', /\b(courbe de croissance|perimetre cranien|percentile)/],
  ['development', /\b(developpement psychomoteur|bilan du developpement|orthophon|psychomotric)/],
  ['health_book', /\b(carnet de sante)/],
  ['insurance', /\b(mutuelle|assurance|attestation de droits|carte vitale|tiers payant)/],
  ['invoice', /\b(facture|devis|note d.honoraires|feuille de soins|montant)/],
  ['appointment', /\b(convocation|rendez-vous|rdv\b)/],
  ['consultation', /\b(compte rendu de consultation|consultation du|motif de consultation)/],
  ['report', /\b(compte rendu|conclusion|synthese)/],
  ['letter', /\b(cher confrere|chere consoeur|courrier|madame, monsieur)/],
];

/** Catégorie proposée (ou null si rien de clair). Jamais imposée. */
export function suggestCategory(text: string, title = ''): DocCategory | null {
  const s = fold(`${title}\n${text}`);
  for (const [cat, re] of HINTS) if (re.test(s)) return cat;
  return null;
}

/** Catégories que le carnet de santé regroupe par rubrique. */
export const BOOK_SECTIONS: { key: string; cats: DocCategory[] }[] = [
  { key: 'results', cats: ['blood_test', 'exam_result'] },
  { key: 'prescriptions', cats: ['prescription'] },
  { key: 'vaccinations', cats: ['vaccination'] },
  { key: 'reports', cats: ['report', 'consultation', 'hospital', 'letter', 'pregnancy_report', 'postnatal'] },
  { key: 'exams', cats: ['ultrasound', 'prenatal', 'eye', 'dental', 'allergy', 'growth', 'development', 'physio', 'psych', 'gyneco', 'chronic'] },
  { key: 'appointments', cats: ['appointment'] },
];
