/** Prochaine étape de l'Accueil (audit du 23/11/2026) : règles locales, prénom si plusieurs enfants, ignorée = finie. */
import { nextStep, NAP_DAY_WINDOW_MIN } from '@/lib/aura/nextStep';

const now = new Date(2026, 10, 23, 15, 0);
const lina = { id: 'L', first_name: 'Lina' };
const at = (h: number, m: number) => new Date(2026, 10, 23, h, m).toISOString();
const nap = (id: string, h1: number, m1: number, h2: number | null, m2 = 0, child = 'L') =>
  ({ id, child_id: child, started_at: at(h1, m1), ended_at: h2 == null ? null : at(h2, m2), kind: 'nap' });

describe('prochaine étape', () => {
  it('aucun sommeil : « Enregistrer un premier sommeil » vers l’outil Sommeil de cet enfant ; rien tant que ce n’est pas chargé', () => {
    expect(nextStep({ child: lina, severalChildren: false, sleeps: [], now, seen: [] })).toEqual({ kind: 'first_sleep', signature: 'next:first_sleep:L', href: '/sleep/L', childName: null });
    expect(nextStep({ child: lina, severalChildren: false, sleeps: null, now, seen: [] })).toBeNull();
    // les sommeils d'un autre enfant ne comptent pas
    expect(nextStep({ child: lina, severalChildren: true, sleeps: [nap('n', 13, 0, 14, 0, 'N')], now, seen: [] })?.kind).toBe('first_sleep');
  });
  it('sieste terminée il y a moins de 45 min : « Voir la journée » ; plus tard, ou sieste en cours : rien', () => {
    expect(nextStep({ child: lina, severalChildren: false, sleeps: [nap('a', 13, 10, 14, 20)], now, seen: [] })?.kind).toBe('nap_day');
    expect(nextStep({ child: lina, severalChildren: false, sleeps: [nap('a', 13, 10, 14, 0, 'L')].map((s) => ({ ...s, ended_at: new Date(now.getTime() - (NAP_DAY_WINDOW_MIN + 1) * 60_000).toISOString() })), now, seen: [] })).toBeNull();
    expect(nextStep({ child: lina, severalChildren: false, sleeps: [nap('a', 14, 30, null)], now, seen: [] })).toBeNull();
  });
  it('plusieurs enfants : le prénom figure sur la carte ; ignorée une fois = plus reproposée (même sieste)', () => {
    const s = nextStep({ child: lina, severalChildren: true, sleeps: [nap('a', 13, 10, 14, 20)], now, seen: [] });
    expect(s?.childName).toBe('Lina');
    expect(nextStep({ child: lina, severalChildren: true, sleeps: [nap('a', 13, 10, 14, 20)], now, seen: [s!.signature] })).toBeNull();
    // une NOUVELLE sieste redonne la carte
    expect(nextStep({ child: lina, severalChildren: true, sleeps: [nap('b', 14, 0, 14, 40), nap('a', 9, 0, 10, 0)], now, seen: [s!.signature] })?.signature).toBe('next:nap_day:b');
  });
});
