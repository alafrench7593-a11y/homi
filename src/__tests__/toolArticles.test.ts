/** Chaque outil de l'app a des articles « Pour aller plus loin ». */
import { TOOL_TOPICS, toolArticleScore } from '@/lib/domain/toolArticles';
import { TOOLS } from '@/lib/journeys/tools';
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { NEURO_LIBRARY } from '@/content/articles/rows';
import { GUIDE_ARTICLES } from '@/content/articles/guide';

const ALL = [...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES];
/** Outils qui SONT déjà des articles, des réglages ou des écrans de navigation. */
const NO_ARTICLES = new Set(['ask', 'local_ai', 'library', 'sources', 'community', 'reminders', 'notifications', 'home_settings', 'settings', 'journeys', 'summary', 'family_summary', 'preg_edit', 'avoid_reminders', 'ttc_reminders', 'ttc_articles', 'preg_articles', 'preg_birth_prep']);

describe('articles par outil', () => {
  it('chaque outil a un thème (ou est explicitement exclu)', () => {
    const missing = TOOLS.map((t) => t.id).filter((id) => !NO_ARTICLES.has(id) && !TOOL_TOPICS[id]);
    expect(missing).toEqual([]);
  });
  it('chaque outil trouve au moins 3 articles', () => {
    const counts = Object.entries(TOOL_TOPICS).map(([id, topic]) => [id, ALL.filter((a) => toolArticleScore(topic, a, a.category) >= 3).length] as const);
    if (process.env.AUDIT) console.log(counts.map(([id, n]) => `${id}: ${n}`).join('\n'));
    expect(counts.filter(([, n]) => n < 3)).toEqual([]);
  });
});
