/**
 * Cartes de suivi (logique pure, testée) : quelles actions montrer en priorité selon le profil affiché,
 * et la phrase « dernière information » de chaque carte.
 *  · Grossesse : sommeil de la mère, humeur, repas, rendez-vous (poids facultatif dans « Voir tous les suivis »).
 *    Jamais de biberon, de tétée ni de couche.
 *  · Nouveau-né : biberon, tétée, couche, sommeil.
 *  · Bébé en diversification : repas, sommeil, biberon, couche.
 *  · Enfant plus grand : repas, sommeil, médicaments prescrits, rendez-vous.
 */
import { BOTTLE_MAX_MONTHS } from './bottleTimer';

export type TrackKey =
  | 'bottle' | 'breastfeed' | 'diaper' | 'sleep' | 'meal' | 'pumping' | 'observation' | 'growth'
  | 'medication' | 'appointment' | 'mother_sleep' | 'mood' | 'weight';
export type TrackProfile = 'pregnancy' | 'newborn' | 'diversification' | 'child';

export const TRACK_LABEL: Record<TrackKey, string> = {
  bottle: 'Biberon', breastfeed: 'Tétée', diaper: 'Couche', sleep: 'Sommeil', meal: 'Repas', pumping: 'Tire-lait',
  observation: 'Santé & notes', growth: 'Taille & poids', medication: 'Médicaments prescrits', appointment: 'Rendez-vous',
  mother_sleep: 'Mon sommeil', mood: 'Mon humeur', weight: 'Mon poids',
};

/** Ces suivis n'ont aucun sens pendant une grossesse : jamais proposés dans ce profil. */
export const NEVER_IN_PREGNANCY: TrackKey[] = ['bottle', 'breastfeed', 'diaper', 'pumping'];

/** Profil de suivi d'un enfant d'après son âge, le parcours et les suivis activés. */
export function childTrackProfile(ageMonths: number, opts: { journey?: 'baby' | 'child' | null; mealsEnabled: boolean }): TrackProfile {
  if (opts.journey === 'child' || ageMonths >= 24) return 'child';
  if (ageMonths >= 4 && opts.mealsEnabled) return 'diversification';
  return 'newborn';
}

const ORDER: Record<TrackProfile, { primary: TrackKey[]; more: TrackKey[] }> = {
  pregnancy: { primary: ['mother_sleep', 'mood', 'meal', 'appointment'], more: ['weight'] },
  newborn: { primary: ['bottle', 'breastfeed', 'diaper', 'sleep'], more: ['pumping', 'observation', 'growth', 'meal', 'appointment', 'medication'] },
  diversification: { primary: ['meal', 'sleep', 'bottle', 'diaper'], more: ['breastfeed', 'pumping', 'observation', 'growth', 'appointment', 'medication'] },
  child: { primary: ['meal', 'sleep', 'medication', 'appointment'], more: ['observation', 'growth', 'diaper', 'bottle'] },
};

/** Suivi activé pour l'enfant (les clés de enabled_tracking) — les autres cartes ne sont pas proposées. */
const TRACKING_OF: Partial<Record<TrackKey, string>> = { bottle: 'bottle', breastfeed: 'breastfeed', pumping: 'breastfeed', diaper: 'diaper', sleep: 'sleep', meal: 'meal' };

export interface TrackContext {
  profile: TrackProfile;
  /** enabled_tracking de l'enfant (ignoré pour la grossesse) */
  enabled?: readonly string[];
  ageMonths?: number;
  hideWeight?: boolean;
}

/** 4 actions prioritaires, les autres dans « Voir tous les suivis ». */
export function trackActions(ctx: TrackContext): { primary: TrackKey[]; more: TrackKey[] } {
  const base = ORDER[ctx.profile];
  const allowed = (k: TrackKey) => {
    if (ctx.profile === 'pregnancy') return !NEVER_IN_PREGNANCY.includes(k) && !(k === 'weight' && ctx.hideWeight);
    if (['mother_sleep', 'mood', 'weight'].includes(k)) return false;
    if (k === 'bottle' && (ctx.ageMonths ?? 0) >= BOTTLE_MAX_MONTHS) return false;
    const tr = TRACKING_OF[k];
    return !tr || !ctx.enabled || ctx.enabled.includes(tr);
  };
  const all = [...base.primary, ...base.more].filter(allowed);
  return { primary: all.slice(0, 4), more: all.slice(4) };
}

// ─── « Dernière information » ──────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
export const hm = (d: Date) => (d.getMinutes() ? `${d.getHours()} h ${pad(d.getMinutes())}` : `${d.getHours()} h`);
/** « à 13 h 10 », « hier à 22 h 05 », « le 18 oct. à 9 h » */
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return `à ${hm(d)}`;
  if (diff === 1) return `hier à ${hm(d)}`;
  return `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${hm(d)}`;
}
export function span(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); const r = m % 60;
  return r ? `${h} h ${pad(r)}` : `${h} h`;
}

export interface LastData {
  bottle?: { at: string; consumed_ml: number | null; prepared_ml: number | null } | null;
  breastfeed?: { started_at: string; ended_at: string | null; side: 'left' | 'right' | 'both' } | null;
  diaper?: { at: string } | null;
  sleep?: { started_at: string; ended_at: string | null } | null;
  meal?: { at: string } | null;
  pumping?: { at: string; amount_ml: number } | null;
  observation?: { at: string } | null;
  growth?: { measured_on: string } | null;
  medication?: { name: string; nextAt: string | null } | null;
  appointment?: { starts_at: string; title: string } | null;
  mother_sleep?: { log_date: string; sleep_minutes: number | null } | null;
  mood?: { checked_at: string } | null;
  weight?: { measured_on: string } | null;
}

const SIDE: Record<string, string> = { left: 'côté gauche', right: 'côté droit', both: 'les deux côtés' };
const agreed = (sex: string | null | undefined, m: string, f: string, n: string) => (sex === 'female' ? f : sex === 'male' ? m : n);

/** Phrase courte et utile pour chaque carte (jamais de jugement, jamais de norme). */
export function lastInfo(key: TrackKey, data: LastData, ctx: { name?: string; sex?: string | null; now?: Date } = {}): string {
  const now = ctx.now ?? new Date();
  const name = ctx.name ?? 'Votre enfant';
  switch (key) {
    case 'bottle': {
      const b = data.bottle; if (!b) return 'Aucun biberon noté';
      const ml = b.consumed_ml ?? b.prepared_ml;
      return `Dernier biberon ${whenLabel(b.at, now)}${ml != null ? ` – ${ml} ml` : ''}`;
    }
    case 'breastfeed': {
      const f = data.breastfeed; if (!f) return 'Aucune tétée notée';
      if (!f.ended_at) return `Tétée en cours (${SIDE[f.side]}) depuis ${span((now.getTime() - Date.parse(f.started_at)) / 60_000)}`;
      return `Dernière tétée : ${SIDE[f.side]} – ${span((Date.parse(f.ended_at) - Date.parse(f.started_at)) / 60_000)}`;
    }
    case 'diaper': return data.diaper ? `Dernier change ${whenLabel(data.diaper.at, now)}` : 'Aucun change noté';
    case 'sleep': {
      const s = data.sleep; if (!s) return 'Aucun sommeil noté';
      if (!s.ended_at) return `${name} dort depuis ${span((now.getTime() - Date.parse(s.started_at)) / 60_000)}`;
      return `${agreed(ctx.sex, 'Réveillé', 'Réveillée', 'Réveillé·e')} ${whenLabel(s.ended_at, now)}`;
    }
    case 'meal': return data.meal ? `Dernier repas ${whenLabel(data.meal.at, now)}` : 'Aucun repas noté';
    case 'pumping': return data.pumping ? `Dernier tirage ${whenLabel(data.pumping.at, now)} – ${data.pumping.amount_ml} ml` : 'Aucun tirage noté';
    case 'observation': return data.observation ? `Dernière note ${whenLabel(data.observation.at, now)}` : 'Température, symptôme, note…';
    case 'growth': return data.growth ? `Dernière mesure le ${new Date(`${data.growth.measured_on}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'Aucune mesure notée';
    case 'medication': {
      const m = data.medication; if (!m) return 'Aucun traitement prescrit en cours';
      return m.nextAt ? `${m.name} : prochaine prise ${whenLabel(m.nextAt, now)}` : `${m.name} : selon l’ordonnance`;
    }
    case 'appointment': {
      const a = data.appointment; if (!a) return 'Aucun rendez-vous prévu';
      return `${a.title} – ${new Date(a.starts_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${hm(new Date(a.starts_at))}`;
    }
    case 'mother_sleep': {
      const s = data.mother_sleep; if (!s) return 'Notez votre nuit en quelques secondes';
      return s.sleep_minutes != null ? `Dernière nuit : ${span(s.sleep_minutes)}` : 'Dernière nuit notée';
    }
    case 'mood': {
      const m = data.mood; if (!m) return 'Comment vous sentez-vous ?';
      return new Date(m.checked_at).toDateString() === now.toDateString() ? 'Humeur notée aujourd’hui' : `Dernière humeur ${whenLabel(m.checked_at, now)}`;
    }
    case 'weight': return data.weight ? `Dernière mesure le ${new Date(`${data.weight.measured_on}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'Suivi facultatif';
  }
}

/** Prochaine prise d'un traitement prescrit (heures recopiées de l'ordonnance), aujourd'hui ou demain. */
export function nextDose(times: readonly string[], now = new Date()): string | null {
  const mins = times.map((t) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!mins.length) return null;
  const cur = now.getHours() * 60 + now.getMinutes();
  const next = mins.find((m) => m > cur);
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (next == null ? 1 : 0), 0, next ?? mins[0]);
  return d.toISOString();
}
