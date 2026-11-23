/**
 * Démonstration — outils du foyer du 28/11/2026 (mêmes tables que 20261128300100…400) : quelques dépenses des deux
 * parents sur deux mois, un chien et ses soins (dates qu'un parent aurait saisies), deux lots de portions préparées
 * pour Lina, et une semaine de lectures. Aucune durée de conservation ni aucun calendrier vétérinaire n'est inventé :
 * les dates sont celles d'un exemple de saisie.
 */
import { uuid } from '../uuid';
import { addDays, todayISO } from '../domain/dates';
import { DEMO_PARTNER_ID } from './demoMissions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function seedFoyerTools({ userId, hid, childId, T }: { userId: string; hid: string; childId: string; T: (t: string) => Row[] }) {
  if (T('household_expenses').some((e) => e.household_id === hid) || T('pets').some((p) => p.household_id === hid)) return;
  const now = new Date().toISOString();
  const today = todayISO();
  const partner = T('household_members').find((m) => m.household_id === hid && m.user_id !== userId)?.user_id ?? DEMO_PARTNER_ID;
  const base = { household_id: hid, created_by: userId, created_at: now, updated_at: now };

  // ---------------------------------------------------------------- dépenses (deux mois)
  const exp = (ago: number, amount: number, category: string, paid_by: string, note: string | null, extra: Row = {}) =>
    T('household_expenses').push({ ...base, id: uuid(), amount, currency: 'EUR', spent_on: addDays(today, -ago), category, paid_by, payer_share: 50, child_id: null, candidate_id: null, note, ...extra });
  exp(1, 86.4, 'food', userId, 'Courses de la semaine');
  exp(3, 24.9, 'children', partner, 'Body et chaussettes', { child_id: childId });
  exp(5, 18, 'health', userId, 'Pharmacie', { child_id: childId });
  exp(8, 42.5, 'leisure', partner, 'Sortie à la ferme');
  exp(12, 63.2, 'food', partner, 'Marché');
  exp(20, 395, 'childcare', userId, 'Crèche — mois en cours', { child_id: childId });
  exp(34, 91.7, 'food', userId, 'Courses');
  exp(40, 35, 'housing', partner, 'Ampoules et petit bricolage');

  // ---------------------------------------------------------------- animal et soins (dates saisies)
  const caramel = uuid();
  T('pets').push({ ...base, id: caramel, name: 'Caramel', species: 'dog', birth_date: addDays(today, -1460), vet_name: 'Clinique des Tilleuls', vet_phone: '01 23 45 67 89', notes: 'Croquettes le matin et le soir.' });
  const care = (kind: string, done: number | null, next: number | null, note: string | null) =>
    T('pet_care').push({ ...base, id: uuid(), pet_id: caramel, kind, label: null, done_on: done == null ? null : addDays(today, done), next_due: next == null ? null : addDays(today, next), note });
  care('vaccine', -330, 35, 'Date de rappel notée sur le carnet de santé');
  care('deworming', -80, 10, null);
  care('flea', -20, null, null);

  // ---------------------------------------------------------------- portions préparées pour Lina
  const carotte = uuid(); const courgette = uuid();
  T('prepared_portions').push(
    { ...base, id: carotte, child_id: childId, label: 'Purée de carotte', recipe_slug: 'dd-puree-carotte', portions_total: 8, prepared_on: addDays(today, -6), storage: 'freezer', use_by: addDays(today, 24), note: 'Bacs à glaçons, 2e étage du congélateur' },
    { ...base, id: courgette, child_id: childId, label: 'Purée de courgette', recipe_slug: 'dd-puree-courgette', portions_total: 3, prepared_on: addDays(today, -1), storage: 'fridge', use_by: addDays(today, 1), note: null },
  );
  T('prepared_portion_uses').push(
    { id: uuid(), household_id: hid, portion_id: carotte, count: 2, used_at: `${addDays(today, -4)}T11:30:00.000Z`, used_by: userId },
    { id: uuid(), household_id: hid, portion_id: carotte, count: 1, used_at: `${addDays(today, -2)}T11:30:00.000Z`, used_by: partner },
    { id: uuid(), household_id: hid, portion_id: courgette, count: 1, used_at: `${today}T11:30:00.000Z`, used_by: userId },
  );

  // ---------------------------------------------------------------- lectures de la semaine
  const read = (ago: number, title: string, story_key: string | null, minutes: number | null, reader_id: string | null, reaction: string | null) =>
    T('reading_logs').push({ ...base, id: uuid(), child_id: childId, title, story_key, read_on: addDays(today, -ago), minutes, reader_id, reader_label: null, reaction, note: null });
  read(0, 'La petite lune qui ne voulait pas dormir', 'petite_lune', 6, userId, 'loved');
  read(1, 'Petit Ours Brun', null, 10, partner, 'liked');
  read(3, 'La petite lune qui ne voulait pas dormir', 'petite_lune', 5, partner, 'calm');
  read(9, 'Bonne nuit, la ferme', null, 8, userId, 'loved');
  T('reading_favorites').push({ id: uuid(), household_id: hid, child_id: childId, title: 'La petite lune qui ne voulait pas dormir', created_by: userId, created_at: now });
}
