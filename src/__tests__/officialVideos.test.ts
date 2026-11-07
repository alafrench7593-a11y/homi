/** Section « Vidéos & articles » : chaque vidéo a des articles à lire ensuite, pertinents. */
import { OFFICIAL_VIDEOS, VIDEO_TOPICS, articlesForVideo, defaultTopic } from '@/lib/domain/officialVideos';
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { NEURO_LIBRARY } from '@/content/articles/rows';
import { GUIDE_ARTICLES } from '@/content/articles/guide';
import { videos as fr } from '@/i18n/fr/videos';
import { videos as en } from '@/i18n/en/videos';

const ALL = [...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES].map((a, i) => ({ ...a, id: String(i), category_id: a.category }));
const slugOf = new Map(ALL.map((a) => [a.category, a.category]));

describe('vidéos & articles', () => {
  it('chaque vidéo propose au moins 2 articles', () => {
    const res = OFFICIAL_VIDEOS.map((v) => [v.key, articlesForVideo(v, ALL as never, slugOf, 3).map((a: { title: string }) => a.title)] as const);
    if (process.env.AUDIT) console.log(res.map(([k, t]) => `${k}: ${t.join(' | ')}`).join('\n'));
    expect(res.filter(([, t]) => t.length < 2).map(([k]) => k)).toEqual([]);
  });
  it('articles cohérents avec le sujet', () => {
    const titles = (key: string) => articlesForVideo(OFFICIAL_VIDEOS.find((v) => v.key === key)!, ALL as never, slugOf, 3).map((a: { title: string }) => a.title.toLowerCase()).join(' ');
    expect(titles('breastfeeding')).toMatch(/allait|sein|tétée/);
    expect(titles('sleep_routine')).toMatch(/sommeil|endorm|couch|nuit/);
    expect(titles('screens')).toMatch(/écran/);
  });
  it('chaque thème a au moins une vidéo et un libellé FR/EN', () => {
    for (const k of VIDEO_TOPICS) {
      expect(OFFICIAL_VIDEOS.some((v) => v.topic === k)).toBe(true);
      expect(`vid.topic.${k}` in fr && `vid.topic.${k}` in en).toBe(true);
    }
  });
  it('thème ouvert selon le moment de vie', () => {
    expect(defaultTopic(['pregnant', 'newborn'])).toBe('pregnancy');
    expect(defaultTopic(['newborn'])).toBe('baby');
    expect(defaultTopic([])).toBe('me');
  });
});
