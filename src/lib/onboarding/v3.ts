/**
 * Onboarding v3 en 6 étapes (20/11/2026) — logique pure, testée (onboardingV3.test.ts).
 * Les nouvelles réponses (src/lib/personalization/answers.ts) sont traduites vers le modèle v2 conservé
 * (`OnboardingAnswers` : parcours activés, fonctions Premium, première action) pour réutiliser la création des
 * parcours, de la grossesse et des enfants existante, et fournissent les faits de l'APERÇU du tableau de bord
 * (moteur réel, avant toute création).
 */
import type { ChildDraft } from '@/features/profiles';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { buildFacts, type JourneyAnswers, type ProfileFacts } from '@/lib/personalization';
import { emptyAnswers, type Need, type OnboardingAnswers, type Situation } from './personalize';

export function legacyAnswers(a: JourneyAnswers): OnboardingAnswers {
  const s: Situation[] = [];
  if (a.profile.includes('ttc')) s.push('ttc');
  if (a.profile.includes('pregnant')) s.push('pregnant');
  if (a.profile.includes('new_baby')) s.push('baby');
  if (a.profile.includes('kids')) s.push('kids');
  if (a.profile.includes('dad') && !a.profile.includes('new_baby') && !a.profile.includes('kids') && !a.profile.includes('pregnant')) s.push('kids');
  if (a.profile.includes('discover') || !s.length) s.push('home');
  const NEED: Partial<Record<JourneyAnswers['priorities'][number], Need>> = { sleep: 'sleep', meals: 'meals', appointments: 'appointments', tasks: 'mental_load', communication: 'mental_load', meet_parents: 'community' };
  const needs = [...new Set(a.priorities.map((p) => NEED[p]).filter((x): x is Need => !!x))].slice(0, 2);
  const sharing = a.household === 'partner' ? 'couple' : a.household === 'solo' ? 'solo' : a.household === 'separated' ? 'coparenting' : null;
  const helpers = a.priorities.includes('find_nanny') || a.priorities.includes('childcare_days') ? ['nanny' as const] : [];
  return { ...emptyAnswers(), situations: [...new Set(s)], needs, sharing, helpers };
}

/** Étape 3 « enfants / grossesse » : proposée si la personne attend, a ou élève un enfant. */
export const asksFamily = (a: JourneyAnswers) => a.profile.some((t) => t === 'pregnant' || t === 'new_baby' || t === 'kids' || t === 'dad');
export const asksPregnancy = (a: JourneyAnswers) => a.profile.includes('pregnant');
export const asksChildren = (a: JourneyAnswers) => a.profile.some((t) => t === 'new_baby' || t === 'kids' || t === 'dad');

/** Étape 4 « alimentation » : seulement s'il y a un nourrisson (moins d'un an) déclaré, ou « je viens d'avoir un bébé ». */
export function asksFeeding(a: JourneyAnswers, children: ChildDraft[], today = todayISO()): boolean {
  if (a.profile.includes('new_baby')) return true;
  return children.some((c) => { const iso = frToISO(c.birth_date); return !!iso && iso <= today && monthsSince(iso, today) < 12; });
}

const monthsSince = (iso: string, today: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return (ty - y) * 12 + (tm - m) - (td < d ? 1 : 0);
};

/** Date JJ/MM/AAAA d'un âge approché (raccourci « ou son âge ») : aujourd'hui moins N mois. */
export function birthFromAge(months: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - months, Math.min(now.getDate(), 28));
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Date prévue d'accouchement JJ/MM/AAAA à partir du stade (semaines d'aménorrhée, terme à 41 SA). */
export function dueFromWeeks(weeksSA: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (41 - weeksSA) * 7);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Faits de l'APERÇU (avant création) : réponses + enfants et grossesse saisis, sans aucune donnée d'un autre adulte. */
export function previewFacts(a: JourneyAnswers, children: ChildDraft[], pregnancyWeeks: number | null, now: Date = new Date()): ProfileFacts {
  return buildFacts({
    now, answers: { v: 3, ...a }, role: 'owner',
    myJourneys: [...(a.profile.includes('ttc') ? ['ttc'] : []), ...(a.profile.includes('new_baby') && !a.profile.includes('dad') ? ['postpartum'] : [])],
    pregnancy: a.profile.includes('pregnant') ? { id: 'preview', mine: !a.profile.includes('dad'), weeks: pregnancyWeeks } : null,
    children: children.map((c, i) => ({ id: `preview-${i}`, first_name: c.first_name.trim() || '…', birth_date: frToISO(c.birth_date) ?? '' })).filter((c) => !!c.birth_date && c.first_name !== '…'),
  });
}
