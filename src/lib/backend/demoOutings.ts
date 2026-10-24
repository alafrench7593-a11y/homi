/**
 * Démonstration (sans serveur) : mêmes règles que 20261028000100_outings_meetups.sql et 20261029000100 (plus aucune
 * rencontre ni inscription créée ; anciennes annonces visibles de leur autrice seulement).
 * Rencontres de groupe (3 places au moins) uniquement dans un lieu public référencé, inscriptions dont la liste
 * n'est jamais publique, blocages dans les deux sens, signalements (3 -> annonce mise de côté), lieux proposés
 * toujours en attente jusqu'à validation par la modération.
 */
import { BackendError } from './types';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface OutingsCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  isModerator: () => boolean;
  blockedBetween: (a: string, b: string) => boolean;
  needsReview: (text: string) => boolean;
}

export const PLACE_REF = /^(osm:(node|way|relation)\/[0-9]{1,15}|google:[A-Za-z0-9_-]{10,200}|sugg:[0-9a-f-]{36})$/;
export const SUGGESTION_EQUIPMENT = ['stroller', 'highchair', 'changing_table', 'baby_area'] as const;
const fail = (msg: string, code = 'P0001') => new BackendError(msg, code);
const len = (v: unknown) => String(v ?? '').trim().length;

export function createOutings(c: OutingsCtx) {
  const { T } = c;
  const meetup = (id: unknown) => T('community_meetups').find((m) => m.id === id);
  const approvedSugg = (ref: string) => T('place_suggestions').some((s) => `sugg:${s.id}` === ref && s.status === 'approved');

  function checkSuggestion(r: Row) {
    if (len(r.name) < 2 || len(r.name) > 120) throw fail('Indiquez le nom du lieu (2 à 120 caractères).');
    if (!/^[a-z_]{2,40}$/.test(String(r.category ?? ''))) throw fail('Choisissez une catégorie.');
    if (len(r.address_public) < 5 || len(r.address_public) > 240) throw fail('Indiquez l’adresse publique du lieu.');
    if (!(Number.isFinite(r.lat) && Number.isFinite(r.lon))) throw fail('Position du lieu manquante.');
    const eq = (r.equipment ?? []) as string[];
    if (!eq.every((e) => (SUGGESTION_EQUIPMENT as readonly string[]).includes(e))) throw fail('Équipement inconnu.');
    if (r.website && !/^https:\/\//.test(String(r.website))) throw fail('Le site doit commencer par https://');
    if (r.min_age != null && r.max_age != null && r.max_age < r.min_age) throw fail('Tranche d’âge invalide');
    if (len(r.activities) > 500 || len(r.hours_text) > 200) throw fail('Texte trop long.');
  }

  function beforeInsert(table: string, r: Row) {
    // 20261029000100 : « Sorties près de chez moi » sert seulement à découvrir des lieux publics
    if (table === 'community_meetups' || table === 'meetup_participants') throw fail('Les rencontres entre membres ne sont pas proposées dans Toi & Moi.');
    const me = c.me();
    if (table === 'place_suggestions') {
      r.user_id = me; r.status = 'pending'; r.moderated_at = null; r.equipment ??= [];
      for (const k of ['city', 'min_age', 'max_age', 'activities', 'hours_text', 'website']) r[k] ??= null;
      checkSuggestion(r);
    }
    if (table === 'community_meetups') {
      if (r.organizer_id && r.organizer_id !== me) throw fail('Action non autorisée.', '42501');
      r.organizer_id = me;
      const profile = T('community_profiles').find((p) => p.user_id === me);
      if (!profile) throw new BackendError('Créez d’abord votre profil communautaire', 'P0001', 'pseudonym_required');
      if (profile.suspended_until && profile.suspended_until > c.nowIso()) throw fail('Compte suspendu');
      if (len(r.title) < 3 || len(r.title) > 80) throw fail('Titre : 3 à 80 caractères.');
      if (len(r.activity) < 3 || len(r.activity) > 500) throw fail('Activité : 3 à 500 caractères.');
      if (!PLACE_REF.test(String(r.place_ref ?? ''))) throw fail('Choisissez un lieu public dans les résultats.');
      if (String(r.place_ref).startsWith('sugg:') && !approvedSugg(String(r.place_ref))) throw fail('Choisissez un lieu public validé');
      const at = new Date(String(r.starts_at)).getTime();
      const now = Date.now();
      if (!(at >= now + 3_600_000 && at <= now + 60 * 86_400_000)) throw fail('La rencontre doit avoir lieu entre 1 heure et 60 jours à partir de maintenant');
      r.capacity = Number(r.capacity);
      if (!Number.isInteger(r.capacity) || r.capacity < 3 || r.capacity > 20) throw fail('Une rencontre se fait en groupe : de 3 à 20 places.');
      r.duration_min ??= 90; r.child_age_min ??= 0; r.child_age_max ??= 10; r.for_pregnant ??= false;
      r.place_address ??= null; r.city_label ??= null;
      if (r.child_age_max < r.child_age_min) throw fail('Tranche d’âge invalide');
      r.participants_count = 0;
      r.status = c.needsReview(`${r.title} ${r.activity}`) ? 'pending_review' : 'visible';
    }
    if (table === 'meetup_participants') {
      if (r.user_id && r.user_id !== me) throw fail('Action non autorisée.', '42501');
      r.user_id = me;
      delete r.id;
      const m = meetup(r.meetup_id);
      const own = m && m.organizer_id === me;
      if (!m || new Date(m.starts_at).getTime() < Date.now() || !(m.status === 'visible' || (own && m.status === 'pending_review'))) throw fail('Inscription impossible');
      if (c.blockedBetween(m.organizer_id, me!)) throw fail('Inscription impossible');
      if (T('meetup_participants').some((p) => p.meetup_id === m.id && p.user_id === me)) throw new BackendError('Vous participez déjà à cette rencontre.', '23505');
      if (m.participants_count >= m.capacity) throw fail('Cette rencontre est complète');
    }
    if (table === 'reports' && (r.meetup_id || r.place_suggestion_id)) {
      const targets = ['post_id', 'comment_id', 'reported_user', 'meetup_id', 'place_suggestion_id'].filter((k) => r[k] != null);
      if (targets.length !== 1) throw fail('Une seule cible par signalement.');
      const dup = T('reports').some((x) => x.reporter_id === me && x.status === 'open' && ((r.meetup_id && x.meetup_id === r.meetup_id) || (r.place_suggestion_id && x.place_suggestion_id === r.place_suggestion_id)));
      if (dup) throw new BackendError('Vous avez déjà fait ce signalement.', '23505');
      r.post_id ??= null; r.comment_id ??= null; r.reported_user ??= null; r.meetup_id ??= null; r.place_suggestion_id ??= null;
    }
  }

  function afterInsert(table: string, r: Row) {
    if (table === 'community_meetups' && ['visible', 'pending_review'].includes(r.status)) {
      T('meetup_participants').push({ meetup_id: r.id, user_id: r.organizer_id, created_at: c.nowIso() });
      r.participants_count = 1;
    }
    if (table === 'meetup_participants') { const m = meetup(r.meetup_id); if (m) m.participants_count += 1; }
    if (table === 'reports' && r.meetup_id) {
      const open = T('reports').filter((x) => x.meetup_id === r.meetup_id && x.status === 'open').length;
      const m = meetup(r.meetup_id);
      if (m && open >= 3 && m.status === 'visible') m.status = 'pending_review';
    }
  }

  function view(table: string): Row[] | null {
    const me = c.me();
    const mod = c.isModerator();
    if (!me && ['place_suggestions', 'community_meetups', 'meetup_participants'].includes(table)) return [];
    if (table === 'place_suggestions') return T(table).filter((s) => s.status === 'approved' || s.user_id === me || mod);
    if (table === 'community_meetups') {
      return T(table).filter((m) => m.organizer_id === me || mod);
    }
    if (table === 'meetup_participants') return T(table).filter((p) => p.user_id === me || mod);
    return null;
  }

  /** false = ligne ignorée (RLS) ; lève une erreur pour les changements interdits. */
  function beforeUpdate(table: string, r: Row, patch: Row): boolean {
    const me = c.me();
    const mod = c.isModerator();
    if (table === 'place_suggestions') {
      if (!mod) return false;
      if ('status' in patch && patch.status !== r.status) patch.moderated_at = c.nowIso();
      return true;
    }
    if (table === 'meetup_participants') return false;
    if (table === 'community_meetups') {
      if (mod) return true;
      if (r.organizer_id !== me) return false;
      if (r.status === 'removed') throw fail('Annonce retirée par la modération');
      if (patch.status != null && !['visible', 'cancelled', 'pending_review'].includes(patch.status)) throw fail('Statut non autorisé', '42501');
      if (patch.status === 'visible' && r.status === 'pending_review') delete patch.status; // seule la modération republie
      if ((patch.place_ref != null && patch.place_ref !== r.place_ref) || (patch.capacity != null && patch.capacity < r.participants_count)) throw fail('Modification impossible');
      if (patch.capacity != null && (patch.capacity < 3 || patch.capacity > 20)) throw fail('Une rencontre se fait en groupe : de 3 à 20 places.');
      delete patch.participants_count; delete patch.organizer_id;
      const title = patch.title ?? r.title; const activity = patch.activity ?? r.activity;
      if ((title !== r.title || activity !== r.activity) && (patch.status ?? r.status) === 'visible' && c.needsReview(`${title} ${activity}`)) patch.status = 'pending_review';
      return true;
    }
    return true;
  }

  function filterRemove(table: string, rows: Row[]): Row[] {
    const me = c.me();
    const mod = c.isModerator();
    if (table === 'meetup_participants') return rows.filter((p) => p.user_id === me);
    if (table === 'place_suggestions') return rows.filter((s) => mod || (s.user_id === me && s.status === 'pending'));
    if (table === 'community_meetups') return rows.filter(() => mod);
    return rows;
  }

  function afterRemove(table: string, removed: Row[]) {
    if (table === 'meetup_participants') for (const p of removed) { const m = meetup(p.meetup_id); if (m) m.participants_count = Math.max(0, m.participants_count - 1); }
  }

  return { beforeInsert, afterInsert, view, beforeUpdate, filterRemove, afterRemove };
}
