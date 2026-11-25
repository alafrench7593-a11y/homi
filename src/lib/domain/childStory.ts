/**
 * « Mon histoire » (26/11/2026, gratuit) : le livre de vie d'un enfant, construit À PARTIR DE CE QUE LES PARENTS ONT
 * DÉJÀ NOTÉ — photos de l'album (date, légende) et « premières fois » (date, titre, note). Rien n'est inventé : sans
 * légende ni note, la page dit seulement la date et l'âge. Calcul pur, testé (src/__tests__/childStory.test.ts).
 */
import { childAge } from './child';

export type ChapterId = 'before' | 'birth' | 'y0' | 'y1' | 'y2' | 'y3' | 'y4_6' | 'y6_8' | 'y8_10' | 'y10';
export const CHAPTERS: ChapterId[] = ['before', 'birth', 'y0', 'y1', 'y2', 'y3', 'y4_6', 'y6_8', 'y8_10', 'y10'];

export interface StoryPhoto { id: string; taken_on: string; caption: string | null; storage_path: string }
export interface StoryWord { id: string; kind: string; text: string; said_on: string | null; note: string | null }
export interface StoryMilestone { id: string; kind: string; title: string; happened_on: string | null; note: string | null }
export interface StoryPage {
  id: string; source: 'photo' | 'milestone' | 'word'; date: string; chapter: ChapterId; ageLabel: string | null;
  title: string | null; text: string | null; photoPath: string | null; kind: string | null;
}
export interface StoryChapter { id: ChapterId; pages: StoryPage[]; reached: boolean }

/** Chapitre d'une date selon la date de naissance (« jour de la naissance » : le jour même et les 2 suivants). */
export function chapterOf(birth: string, date: string): ChapterId {
  if (date < birth) return 'before';
  const ms = Date.parse(`${date}T12:00:00Z`) - Date.parse(`${birth}T12:00:00Z`);
  if (ms <= 2 * 86400000) return 'birth';
  const m = childAge(birth, date).months;
  if (m < 12) return 'y0';
  if (m < 24) return 'y1';
  if (m < 36) return 'y2';
  if (m < 48) return 'y3';
  if (m < 72) return 'y4_6';
  if (m < 96) return 'y6_8';
  if (m < 120) return 'y8_10';
  return 'y10';
}

/** Le chapitre est-il atteint aujourd'hui (pour inviter à le remplir, jamais pour un chapitre futur) ? */
export function chapterReached(birth: string, id: ChapterId, today: string): boolean {
  return CHAPTERS.indexOf(id) <= CHAPTERS.indexOf(chapterOf(birth, today));
}

export function buildStory(o: { birth: string; today: string; photos: StoryPhoto[]; milestones: StoryMilestone[]; words?: StoryWord[]; ageLabel: (birth: string, date: string) => string }): StoryChapter[] {
  const pages: StoryPage[] = [
    ...o.photos.map((p): StoryPage => ({
      id: `p-${p.id}`, source: 'photo', date: p.taken_on, chapter: chapterOf(o.birth, p.taken_on),
      ageLabel: p.taken_on >= o.birth ? o.ageLabel(o.birth, p.taken_on) : null,
      title: null, text: p.caption?.trim() || null, photoPath: p.storage_path, kind: null,
    })),
    ...o.milestones.filter((m) => !!m.happened_on).map((m): StoryPage => ({
      id: `m-${m.id}`, source: 'milestone', date: m.happened_on!, chapter: chapterOf(o.birth, m.happened_on!),
      ageLabel: m.happened_on! >= o.birth ? o.ageLabel(o.birth, m.happened_on!) : null,
      title: m.title.trim(), text: m.note?.trim() || null, photoPath: null, kind: m.kind,
    })),
    // Premiers mots et phrases (outil Langage, 26/11/2026) : le mot dit, tel que noté
    ...(o.words ?? []).filter((w) => !!w.said_on && (w.kind === 'word' || w.kind === 'sentence') && w.text.trim()).map((w): StoryPage => ({
      id: `w-${w.id}`, source: 'word', date: w.said_on!, chapter: chapterOf(o.birth, w.said_on!),
      ageLabel: w.said_on! >= o.birth ? o.ageLabel(o.birth, w.said_on!) : null,
      title: `« ${w.text.trim()} »`, text: w.note?.trim() || null, photoPath: null, kind: w.kind,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return CHAPTERS.map((id) => ({ id, pages: pages.filter((p) => p.chapter === id), reached: chapterReached(o.birth, id, o.today) }))
    // chapitres affichés : ceux qui ont des pages, et ceux déjà atteints (invitation à ajouter) ; « 10 ans et + » seulement s'il a des pages
    .filter((c) => c.pages.length > 0 || (c.reached && c.id !== 'y10'));
}

/** Combien de souvenirs au total (pour la couverture). */
export const storyCount = (chapters: StoryChapter[]) => chapters.reduce((n, c) => n + c.pages.length, 0);
