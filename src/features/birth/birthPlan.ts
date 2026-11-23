/**
 * 44 — Projet de naissance : questionnaire par sections (logique pure, testée). Le contenu exprime des SOUHAITS,
 * neutres et non médicaux (aucune recommandation) ; il se discute avec l'équipe de la maternité. Une clé par choix ;
 * les textes sont dans les dictionnaires (bp.sec.<section>.title, bp.opt.<section>.<choix>).
 */
import { t as tr, type TKey } from '@/i18n';
import type { IconName } from '@/components/ui';

export interface PlanSection { key: string; icon: IconName; options: string[] }

export const PLAN_SECTIONS: readonly PlanSection[] = [
  { key: 'support', icon: 'users', options: ['partner', 'family_member', 'friend', 'doula', 'few_people'] },
  { key: 'ambiance', icon: 'sun', options: ['dim_light', 'music', 'quiet', 'own_clothes', 'photos', 'no_photos', 'explain_steps'] },
  { key: 'positions', icon: 'activity', options: ['move_freely', 'ball', 'water', 'choose_position', 'advice_team'] },
  { key: 'pain', icon: 'heart', options: ['talk_options', 'epidural_wish', 'wait_and_see', 'breathing', 'massage', 'warm_water'] },
  { key: 'after_birth', icon: 'smile', options: ['skin_to_skin', 'partner_skin', 'partner_cord', 'quiet_first_hour', 'first_bath_together'] },
  { key: 'feeding', icon: 'droplet', options: ['breastfeeding', 'formula', 'mixed', 'undecided', 'help_first_feed'] },
  { key: 'stay', icon: 'home', options: ['partner_stays', 'few_visits', 'rest_priority', 'discharge_info'] },
  { key: 'other', icon: 'edit-3', options: [] },
];

export interface SectionAnswer { choices?: string[]; note?: string }
export type PlanAnswers = Record<string, SectionAnswer>;

const KEY = /^[a-z0-9_]{1,40}$/;

/** Réponses nettoyées (mêmes règles que _birth_plan_answers_ok côté serveur) : sections et choix connus, note ≤ 1000. */
export function cleanAnswers(a: PlanAnswers): PlanAnswers {
  const out: PlanAnswers = {};
  for (const s of PLAN_SECTIONS) {
    const v = a[s.key];
    if (!v) continue;
    const choices = (v.choices ?? []).filter((c) => KEY.test(c) && s.options.includes(c));
    const note = (v.note ?? '').trim().slice(0, 1000);
    if (choices.length || note) out[s.key] = { ...(choices.length ? { choices: [...new Set(choices)] } : {}), ...(note ? { note } : {}) };
  }
  return out;
}

export function toggleChoice(a: PlanAnswers, section: string, choice: string): PlanAnswers {
  const cur = a[section]?.choices ?? [];
  const choices = cur.includes(choice) ? cur.filter((c) => c !== choice) : [...cur, choice];
  return { ...a, [section]: { ...a[section], choices } };
}

export const sectionTitle = (key: string) => tr(`bp.sec.${key}.title` as TKey);
export const optionLabel = (section: string, opt: string) => tr(`bp.opt.${section}.${opt}` as TKey);

/** Sections remplies / total (pour l'avancement affiché, sans jugement). */
export function progress(a: PlanAnswers): { filled: number; total: number } {
  const c = cleanAnswers(a);
  return { filled: PLAN_SECTIONS.filter((s) => c[s.key]).length, total: PLAN_SECTIONS.length };
}

/** Aperçu imprimable / partage (PDF ou texte) : une section par thème, les choix puis la note. */
export function planSections(a: PlanAnswers): { heading: string; lines: string[] }[] {
  const c = cleanAnswers(a);
  return PLAN_SECTIONS.filter((s) => c[s.key]).map((s) => ({
    heading: sectionTitle(s.key),
    lines: [...(c[s.key].choices ?? []).map((o) => `• ${optionLabel(s.key, o)}`), ...(c[s.key].note ? [c[s.key].note as string] : [])],
  }));
}
