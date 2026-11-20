/**
 * Démonstration — outils complétés le 30/11/2026 (mêmes tables que 20261130100200…400) : journal du langage et jeux
 * de Lina, activités extrascolaires et devoirs de Noé, baromètre du couple (ma jauge passée, privée ; celle que
 * l'autre parent a partagée cette semaine). Exemples de saisie : aucune norme ni aucun calendrier inventé.
 */
import { uuid } from '../uuid';
import { addDays, todayISO } from '../domain/dates';
import { DEMO_PARTNER_ID } from './demoMissions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const monday = (day: string) => { const [y, m, d] = day.split('-').map(Number); const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; return addDays(day, -wd); };

export function seedPartiels2({ userId, hid, babyId, kidId, T }: { userId: string; hid: string; babyId: string; kidId: string; T: (t: string) => Row[] }) {
  if (T('child_language_entries').some((e) => e.household_id === hid) || T('child_activities').some((a) => a.household_id === hid)) return;
  const now = new Date().toISOString();
  const today = todayISO();
  const partner = T('household_members').find((m) => m.household_id === hid && m.user_id !== userId && (m.role === 'owner' || m.role === 'coparent'))?.user_id ?? DEMO_PARTNER_ID;
  const base = { household_id: hid, created_by: userId, created_at: now, updated_at: now };

  // ---------------------------------------------------------------- 129 langage (Lina)
  const lg = (kind: string, text: string, ago: number | null, extra: Row = {}) =>
    T('child_language_entries').push({ ...base, id: uuid(), child_id: babyId, kind, text, language: null, said_on: ago == null ? null : addDays(today, -ago), note: null, ...extra });
  lg('language', 'Français', null, { note: 'À la maison' });
  lg('language', 'Arabe', null, { note: 'Avec Mamie, le mercredi' });
  lg('word', 'mama', 95, { language: 'Français' });
  lg('word', 'dodo', 40, { language: 'Français' });
  lg('word', 'yalla', 21, { language: 'Arabe', note: 'En imitant Mamie' });
  lg('word', 'encore', 9, { language: 'Français' });
  lg('note', 'Montre du doigt le chat quand on dit « Où est le chat ? »', 4);

  // ---------------------------------------------------------------- 132 jeux (Lina)
  T('child_game_marks').push(
    { ...base, id: uuid(), child_id: babyId, game_key: 'coucou_cache', favorite: true, done_count: 3, last_done_on: addDays(today, -1) },
    { ...base, id: uuid(), child_id: babyId, game_key: 'transvaser', favorite: false, done_count: 1, last_done_on: addDays(today, -6) },
  );

  // ---------------------------------------------------------------- 136 activités (Noé)
  T('child_activities').push(
    { ...base, id: uuid(), child_id: kidId, name: 'Judo', place: 'Dojo municipal', slots: [{ day: 3, from: '14:00', to: '15:00' }, { day: 6, from: '10:00', to: '11:00' }],
      starts_on: null, ends_on: null, equipment: 'Kimono, gourde', contact_name: 'Paul (professeur)', contact_phone: '06 12 34 56 78', note: null, reminder_minutes: 60 },
    { ...base, id: uuid(), child_id: kidId, name: 'Piscine', place: 'Piscine des Tilleuls', slots: [{ day: 2, from: '17:30', to: '18:15' }],
      starts_on: null, ends_on: null, equipment: 'Maillot, bonnet, serviette', contact_name: null, contact_phone: null, note: 'Avec la classe de Léo', reminder_minutes: null },
  );

  // ---------------------------------------------------------------- 137 devoirs (Noé)
  const hw = (subject: string, instructions: string, due: number, done: boolean) =>
    T('child_homework').push({ ...base, id: uuid(), child_id: kidId, subject, instructions, due_on: addDays(today, due), done_at: done ? now : null, done_by: done ? partner : null, remind_eve: true });
  hw('Lecture', 'Lire la page 12 du livre de lecture', 1, false);
  hw('Mathématiques', 'Fiche des additions (exercices 1 à 3)', 3, false);
  hw('Lecture', 'Relire la poésie de la semaine', -1, true);

  // ---------------------------------------------------------------- 177 baromètre du couple
  const week = monday(today);
  T('couple_barometer').push(
    { id: uuid(), household_id: hid, user_id: userId, week_of: addDays(week, -7), level: 4, word: 'Une belle balade dimanche', shared: false, created_at: now, updated_at: now },
    { id: uuid(), household_id: hid, user_id: partner, week_of: week, level: 3, word: 'Fatigués, mais on se serre les coudes', shared: true, created_at: now, updated_at: now },
    { id: uuid(), household_id: hid, user_id: partner, week_of: addDays(week, -7), level: 2, word: null, shared: false, created_at: now, updated_at: now },
  );
}
