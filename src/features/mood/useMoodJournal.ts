/**
 * Humeur → journal : logique des écrans (bilan, page de journal, suppression), extraite des composants.
 *  - Anti-double soumission : un verrou (ref) en plus du bouton principal (qui ignore déjà les appuis pendant la promesse).
 *  - Le résultat affiché est celui RÉELLEMENT obtenu : `sent` (enregistré), `queued` (gardé sur le téléphone, envoyé
 *    au retour du réseau), ou erreur (rien n'est annoncé comme fait).
 *  - Règles d'accès inchangées : écriture uniquement sur `mood_checkins` de la personne connectée.
 */
import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DIARY_MAX, validateDiary, type DiaryError } from '@/lib/domain/diary';
import { insertOrQueue } from '@/lib/offline';
import type { MoodCheckin } from '@/lib/types';
import { t as tr } from '@/i18n';
import { supportLevel, validateCheckin, type CheckinError, type Mood, type SaveOutcome } from './model';

export type Insert = typeof insertOrQueue;

/** Bilan d'humeur : humeur → (ressentis, question de sécurité, note) → enregistrer → résultat réel. */
export function useMoodCheckin(opts: { insert?: Insert } = {}) {
  const insert = opts.insert ?? insertOrQueue;
  const userId = useUserId();
  const inv = useInvalidate();
  const [mood, setMoodState] = useState<Mood | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [safety, setSafetyState] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<CheckinError | null>(null);
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const setMood = (m: Mood) => { setMoodState(m); setError(null); setOutcome(null); };
  const setSafety = (v: boolean) => { setSafetyState(v); setOutcome(null); };
  const toggleFeeling = (f: string) => setFeelings((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const reset = () => { setMoodState(null); setFeelings([]); setSafetyState(false); setNote(''); setError(null); };

  async function save(): Promise<SaveOutcome | null> {
    if (busy.current) return null; // double appui : un seul bilan
    const problem = validateCheckin(mood, note);
    if (problem) { setError(problem); haptic('warning'); return null; }
    busy.current = true;
    setSaving(true);
    setError(null);
    const at = new Date().toISOString();
    try {
      const sent = await insert('mood_checkins', { user_id: userId, checked_at: at, mood, feelings, safety_concern: safety, journal: note.trim() || null });
      inv('mood_checkins');
      haptic('success');
      const out: SaveOutcome = { kind: sent, mood: mood!, at, support: supportLevel(mood, feelings, safety) };
      setOutcome(out);
      reset();
      return out;
    } catch (e) {
      const out: SaveOutcome = { kind: 'error', message: friendlyError(e, tr('u8.mood.saveFail')) };
      setOutcome(out);
      haptic('warning');
      return out;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return {
    mood, feelings, safety, note, error, outcome, saving,
    support: supportLevel(mood, feelings, safety),
    setMood, toggleFeeling, setSafety, setNote: (v: string) => { setNote(v); if (error === 'long') setError(null); },
    save, dismissOutcome: () => setOutcome(null),
  };
}

/** Brouillon gardé le temps de la session : quitter le journal puis y revenir ne perd pas le texte. */
let draft: { text: string; mood: Mood | null; editingId: string | null } = { text: '', mood: null, editingId: null };
export const resetDiaryDraft = () => { draft = { text: '', mood: null, editingId: null }; };

/** Page de journal : humeur → texte → garder la page (création ou modification) → résultat réel. */
export function useDiaryPage(opts: { insert?: Insert } = {}) {
  const insert = opts.insert ?? insertOrQueue;
  const userId = useUserId();
  const inv = useInvalidate();
  const [text, setTextState] = useState(draft.text);
  const [mood, setMoodState] = useState<Mood | null>(draft.mood);
  const [editingId, setEditingId] = useState<string | null>(draft.editingId);
  const [error, setError] = useState<DiaryError | null>(null);
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => { draft = { text, mood, editingId }; }, [text, mood, editingId]);

  const reset = () => { setTextState(''); setMoodState(null); setEditingId(null); setError(null); };
  const setText = (v: string) => { setTextState(v); if (error) setError(null); };
  const setMood = (m: Mood) => { setMoodState(m); if (error) setError(null); setOutcome(null); };

  function startEdit(p: MoodCheckin) {
    setEditingId(p.id);
    setTextState(p.journal ?? '');
    setMoodState(p.mood);
    setError(null);
    setOutcome(null);
  }

  async function save(): Promise<SaveOutcome | null> {
    if (busy.current) return null;
    const problem = validateDiary(text, mood);
    if (problem) { setError(problem); haptic('warning'); return null; }
    busy.current = true;
    setSaving(true);
    setError(null);
    const at = new Date().toISOString();
    const wasEditing = editingId;
    try {
      let kind: 'sent' | 'queued' = 'sent';
      if (wasEditing) await backend.update('mood_checkins', { journal: text.trim(), mood }, [eq('id', wasEditing)]);
      else kind = await insert('mood_checkins', { user_id: userId, checked_at: at, mood, feelings: [], safety_concern: false, journal: text.trim() });
      inv('mood_checkins');
      haptic('success');
      const out: SaveOutcome = { kind, mood: mood!, at, support: mood === 1 ? 'soft' : null, id: wasEditing ?? undefined };
      setOutcome(out);
      reset();
      return out;
    } catch (e) {
      const out: SaveOutcome = { kind: 'error', message: friendlyError(e, tr('dy.saveFail')) };
      setOutcome(out);
      haptic('warning');
      return out;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return {
    text, mood, editingId, error, outcome, saving, max: DIARY_MAX,
    setText, setMood, startEdit, cancelEdit: reset, save, dismissOutcome: () => setOutcome(null),
  };
}

/** Suppression d'un bilan (confirmation demandée par `SensitiveButton`) ; renvoie `true` si c'est RÉELLEMENT supprimé. */
export function useRemoveCheckin() {
  const inv = useInvalidate();
  const toast = useToast();
  const [removing, setRemoving] = useState<string | null>(null);
  async function remove(id: string, okMessage: string): Promise<boolean> {
    if (removing) return false;
    setRemoving(id);
    try {
      await backend.remove('mood_checkins', [eq('id', id)]);
      inv('mood_checkins');
      toast(okMessage);
      return true;
    } catch (e) {
      toast(friendlyError(e), 'error');
      return false;
    } finally {
      setRemoving(null);
    }
  }
  return { remove, removing };
}
