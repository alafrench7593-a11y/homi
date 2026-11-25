import { buildStory, chapterOf, chapterReached, storyCount } from '@/lib/domain/childStory';

const birth = '2025-03-10';
const age = (b: string, d: string) => `${b}→${d}`;

describe('Mon histoire : chapitres', () => {
  it.each([
    ['2025-01-02', 'before'], ['2025-03-10', 'birth'], ['2025-03-12', 'birth'], ['2025-03-13', 'y0'], ['2026-03-09', 'y0'],
    ['2026-03-10', 'y1'], ['2027-03-10', 'y2'], ['2028-03-10', 'y3'], ['2029-03-10', 'y4_6'], ['2031-03-10', 'y6_8'], ['2033-03-10', 'y8_10'], ['2035-03-10', 'y10'],
  ])('%s → %s', (d, c) => expect(chapterOf(birth, d)).toBe(c));
  it('chapitre futur non atteint', () => {
    expect(chapterReached(birth, 'y1', '2025-12-01')).toBe(false);
    expect(chapterReached(birth, 'y0', '2025-12-01')).toBe(true);
  });
});

describe('Mon histoire : pages construites sans rien inventer', () => {
  const chapters = buildStory({
    birth, today: '2026-11-26', ageLabel: age,
    photos: [
      { id: 'a', taken_on: '2026-03-15', caption: 'Ses premiers pas vers maman', storage_path: 'x/y/a.jpg' },
      { id: 'b', taken_on: '2024-12-20', caption: null, storage_path: 'x/y/b.jpg' },
    ],
    milestones: [
      { id: '1', kind: 'tooth', title: 'Première dent', happened_on: '2025-10-01', note: null },
      { id: '2', kind: 'memory', title: 'Sans date', happened_on: null, note: 'x' },
    ],
  });
  it('ordre, chapitres et contenus fidèles', () => {
    expect(chapters.map((c) => c.id)).toEqual(['before', 'birth', 'y0', 'y1']);
    expect(chapters.find((c) => c.id === 'birth')!.pages).toEqual([]); // atteint, vide : invitation
    expect(chapters.find((c) => c.id === 'before')!.pages[0]).toMatchObject({ text: null, ageLabel: null, photoPath: 'x/y/b.jpg' });
    expect(chapters.find((c) => c.id === 'y0')!.pages[0]).toMatchObject({ title: 'Première dent', text: null });
    expect(chapters.find((c) => c.id === 'y1')!.pages[0]).toMatchObject({ text: 'Ses premiers pas vers maman' });
    expect(storyCount(chapters)).toBe(3); // la note sans date n'est pas placée au hasard
  });
});
