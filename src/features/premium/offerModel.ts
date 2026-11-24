/**
 * Comparatif de la page d'abonnement — ce que la page AFFIRME, relié à ce qui le rend vrai dans le code.
 * Rien n'est annoncé ici sans preuve vérifiée par Jest (src/__tests__/subscriptionPage.test.tsx) :
 *  - « Sans abonnement » : chaque ligne cite des écrans que `isFreeRoute` (src/lib/premium/access.ts) laisse ouverts,
 *    et les outils gratuits cités sont EXACTEMENT ceux du registre (src/lib/journeys/tools.ts) qui s'ouvrent sans Premium ;
 *  - « HOMI Premium » : chaque groupe cite des outils du registre qui sont tous réservés à Premium ;
 *  - « En famille » : règles du serveur — `_premium_of` / `_premium_partner_of`
 *    (supabase/migrations/20261105000100_subscription_v2.sql) et exemption des nounous
 *    (supabase/migrations/20261113000100_caregiver_premium.sql, CAREGIVER_ROUTES).
 * Voir ABONNEMENT.md § 0.2 pour le tableau « affirmation → preuve ».
 */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';

export interface FreeItem {
  key: TKey;
  icon: IconName;
  /** Écrans cités par la ligne : tous ouverts sans Premium (isFreeRoute). */
  routes: string[];
  /** Outils du registre cités par la ligne. */
  tools?: string[];
}

/** Ce qui reste accessible sans abonnement. */
export const FREE_ITEMS: FreeItem[] = [
  { key: 'sub3.free.urgent', icon: 'life-buoy', routes: ['/emergency', '/contraception/emergency', '/family/sos', '/family/urgent'], tools: ['emergency', 'avoid_emergency', 'family_sos', 'family_urgent'] },
  { key: 'sub3.free.safety', icon: 'shield', routes: ['/postpartum/support', '/scanner/recalls', '/sources'], tools: ['pp_support', 'recall_alerts', 'sources'] },
  { key: 'sub3.free.account', icon: 'user', routes: ['/settings/account', '/journeys', '/profiles/new', '/discover'] },
  { key: 'sub3.free.settings', icon: 'settings', routes: ['/settings', '/settings/privacy', '/settings/language', '/settings/notifications', '/settings/family', '/settings/sync', '/settings/subscription'] },
  { key: 'sub3.free.data', icon: 'download', routes: ['/settings/privacy'] },
  { key: 'sub3.free.legal', icon: 'file-text', routes: ['/legal/terms', '/legal/privacy', '/feedback'] },
  // Espace nounou (21/11/2026) : l'accueil « Mes gardes » / « Espace nounou de mes enfants » et le lien d'invitation
  { key: 'sub3.free.childcare', icon: 'briefcase', routes: ['/garde', '/garde/rejoindre'], tools: ['childcare'] },
];

export type PremiumGroupKey = 'me' | 'child' | 'family' | 'tools';
export interface PremiumGroup {
  key: PremiumGroupKey;
  icon: IconName;
  title: TKey;
  text: TKey;
  /** Outils du registre que le texte cite : tous réservés à Premium. */
  tools: string[];
}

/** Ce que Premium ouvre, groupé par besoin (moi, mon enfant, ma famille, mes outils). */
export const PREMIUM_GROUPS: PremiumGroup[] = [
  { key: 'me', icon: 'heart', title: 'sub3.prem.me.title', text: 'sub3.prem.me.text',
    tools: ['cycle_home', 'avoid_contraception', 'ttc_cycle', 'preg_evolution', 'pp_recovery', 'mood', 'sleep'] },
  { key: 'child', icon: 'smile', title: 'sub3.prem.child.title', text: 'sub3.prem.child.text',
    tools: ['baby_bottle', 'baby_breastfeed', 'baby_diaper', 'kid_sleep', 'baby_foods', 'kid_grow', 'kid_vaccines', 'kid_treatments'] },
  { key: 'family', icon: 'home', title: 'sub3.prem.family.title', text: 'sub3.prem.family.text',
    tools: ['family_tasks', 'family_routines', 'family_calendar', 'family_shopping', 'family_stocks', 'family_nights', 'mental_load'] },
  { key: 'tools', icon: 'grid', title: 'sub3.prem.tools.title', text: 'sub3.prem.tools.text',
    tools: ['meals', 'meal_menu', 'scan_product', 'documents', 'appointments', 'summary', 'library', 'community'] },
];

export interface FamilyItem {
  key: TKey;
  icon: IconName;
}

/** Partage familial réel : un seul autre adulte, sans surcoût ; ce qu'une nounou invitée peut faire. */
export const FAMILY_ITEMS: FamilyItem[] = [
  { key: 'sub3.fam.adult', icon: 'users' },
  { key: 'sub3.fam.one', icon: 'user-check' },
  { key: 'sub3.fam.nanny', icon: 'clipboard' },
];

/** Écrans de garde cités pour la nounou (ouverts par `gateFor` à un compte « caregiver » sans Premium). */
export const NANNY_ROUTES: string[] = ['/today', '/track', '/bottle', '/sleep', '/family/tasks', '/meals/shopping', '/agenda', '/documents'];
