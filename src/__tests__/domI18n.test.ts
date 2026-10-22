import { setLocale } from '@/i18n';
import { buildDigest, DIGEST_ITEM_LABEL, DIGEST_NOTIFICATION, questionOfDay } from '@/lib/domain/dailyDigest';
import { lastInfo, TRACK_LABEL, whenLabel } from '@/lib/domain/trackingCards';

const NOW = new Date(2026, 9, 22, 15, 0);
const at = (h: number, m = 0, day = 22) => new Date(2026, 9, day, h, m).toISOString();

describe('textes calculés traduits (dom.*)', () => {
  afterEach(() => setLocale('fr'));

  it('anglais : cartes de suivi et résumé du jour', () => {
    setLocale('en');
    expect(lastInfo('bottle', {})).toBe('No bottle logged');
    expect(lastInfo('bottle', { bottle: { at: at(13, 10), consumed_ml: 150, prepared_ml: null } }, { now: NOW })).toBe('Last bottle at 13:10 – 150 ml');
    expect(whenLabel(at(22, 5, 21), NOW)).toBe('yesterday at 22:05');
    expect(TRACK_LABEL.bottle).toBe('Bottle');
    expect(DIGEST_ITEM_LABEL.question).toBe('Question of the day');
    expect({ ...DIGEST_NOTIFICATION.morning }.title).toBe('Your morning summary');
    const d = buildDigest({ moment: 'morning', now: NOW, firstName: 'Sarah', questionEnabled: true, scope: 'baby' });
    expect(d.title).toBe('Good morning, Sarah');
    expect(d.items[0].detail).toBe(questionOfDay(NOW, 'baby'));
    expect(d.items[0].detail).not.toMatch(/[éè]|vous/);
  });

  it('retour au français : textes inchangés', () => {
    setLocale('en');
    setLocale('fr');
    expect(lastInfo('bottle', {})).toBe('Aucun biberon noté');
    expect(TRACK_LABEL.bottle).toBe('Biberon');
    expect(buildDigest({ moment: 'morning', now: NOW, questionEnabled: false }).title).toBe('Bonjour');
    expect({ ...DIGEST_NOTIFICATION.evening }).toEqual({ title: 'Votre journée en bref', body: 'Un résumé de la journée, quand vous avez un moment.' });
  });
});
