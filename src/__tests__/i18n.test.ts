jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'de-DE', languageCode: 'de', regionCode: 'DE' }] }));
import { DICTIONARIES, FR } from '@/i18n/dictionaries';
import { formatDate, formatNumber, formatUnit, getLocale, initialLocale, setLocale, t } from '@/i18n';
import { availableLocales, LOCALES, proposeLocale } from '@/i18n/locales';
import type { Msg } from '@/i18n/types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { scan } = require('../../scripts/i18n-scan.js');

/** Fichiers entièrement traduits : aucun texte affiché ne doit y être écrit en dur (régression bloquée). */
export const MIGRATED = [
  'src/app/child/[id]/vaccines.tsx', 'src/app/night/help.tsx',
  'src/app/meals/index.tsx', 'src/app/meals/[slug].tsx', 'src/app/meals/menu.tsx', 'src/app/meals/shopping.tsx', 'src/app/meals/pantry.tsx',
  'src/app/meals/settings.tsx', 'src/app/meals/new.tsx', 'src/app/admin/recipes.tsx', 'src/features/recipes/RecipeCard.tsx', 'src/features/recipes/RecipeArt.tsx',
  'src/features/recipes/HomeRecipeCard.tsx', 'src/features/recipes/ScanRecipes.tsx',
  'src/components/AppErrorBoundary.tsx', 'src/components/DemoBar.tsx', 'src/components/Overlays.tsx', 'src/components/States.tsx',
  'src/components/Screen.tsx', 'src/components/OfflinePill.tsx', 'src/app/index.tsx', 'src/app/_layout.tsx',
  'src/app/intro.tsx', 'src/app/welcome.tsx', 'src/app/settings/index.tsx', 'src/app/settings/language.tsx',
  'src/app/auth/sign-in.tsx', 'src/app/auth/sign-up.tsx', 'src/app/auth/forgot.tsx', 'src/app/auth/reset.tsx', 'src/app/auth/callback.tsx', 'src/features/auth.tsx',
  'src/app/onboarding.tsx', 'src/app/journeys/index.tsx', 'src/app/journeys/[id].tsx', 'src/app/journeys/blocked.tsx', 'src/app/pregnancy/start.tsx', 'src/app/pregnancy/end.tsx', 'src/app/child/[id]/needs.tsx', 'src/app/child/[id]/school.tsx', 'src/app/postpartum/recovery.tsx', 'src/features/journeys.tsx', 'src/features/needs.tsx', 'src/app/(tabs)/index.tsx', 'src/app/(tabs)/_layout.tsx', 'src/components/Dock.tsx', 'src/app/(tabs)/profile.tsx', 'src/components/AccountActions.tsx',
  'src/app/documents/index.tsx', 'src/app/documents/scan.tsx', 'src/app/documents/[id].tsx', 'src/app/documents/book.tsx', 'src/app/documents/export.tsx', 'src/features/documents.tsx',
  'src/app/cycle/index.tsx', 'src/app/cycle/calendar.tsx', 'src/app/cycle/symptoms.tsx', 'src/app/cycle/bleeding.tsx', 'src/app/cycle/journal.tsx', 'src/app/cycle/stats.tsx',
  'src/app/cycle/export.tsx', 'src/app/cycle/privacy.tsx', 'src/app/cycle/discharge/index.tsx', 'src/app/cycle/discharge/[id].tsx', 'src/app/cycle/guides/index.tsx',
  'src/app/cycle/guides/[slug].tsx', 'src/features/cycle/kit.tsx', 'src/features/cycle/GuideArt.tsx', 'src/features/cycle/report.ts', 'src/features/cycle/discharge.ts',
  'src/app/cycle/home-card.tsx', 'src/features/cycle/HomeCycleCard.tsx', 'src/features/cycle/homeCard.ts',
  'src/app/cycle/intimacy.tsx', 'src/app/cycle/pain.tsx', 'src/app/cycle/recap.tsx', 'src/app/cycle/advice.tsx', 'src/app/cycle/risk.tsx', 'src/app/cycle/professional.tsx',
  'src/features/cycle/AdviceCard.tsx', 'src/features/cycle/CycleRing.tsx', 'src/features/cycle/PainKit.tsx', 'src/features/cycle/Bars.tsx', 'src/features/cycle/useAdvice.ts',
];

const forms = (m: Msg) => (typeof m === 'string' ? [m] : Object.values(m).filter((x): x is string => typeof x === 'string'));
const vars = (m: Msg) => [...new Set(forms(m).flatMap((s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1])))].sort();

describe('dictionnaires', () => {
  it.each(availableLocales().map((l) => [l.code]))('« %s » : toutes les clés du français, non vides, mêmes variables', (code) => {
    const d = DICTIONARIES[code];
    expect(d).toBeDefined();
    for (const [k, m] of Object.entries(FR)) {
      expect(d[k]).toBeDefined();
      for (const f of forms(d[k])) expect(f.trim().length).toBeGreaterThan(0);
      expect([k, vars(d[k])]).toEqual([k, vars(m)]);
      if (typeof m !== 'string') expect(typeof d[k]).toBe('object');
    }
    expect(Object.keys(d).length).toBe(Object.keys(FR).length);
  });
  it('les clés suivent la convention domaine.element', () => {
    for (const k of Object.keys(FR)) expect(k).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$/);
  });
  it('aucune langue « en préparation » n’est proposée comme disponible', () => {
    expect(availableLocales().map((l) => l.code).sort()).toEqual(Object.keys(DICTIONARIES).sort());
    expect(LOCALES.length).toBeGreaterThanOrEqual(38);
  });
});

describe('moteur', () => {
  afterEach(() => setLocale('fr'));
  it('propose la langue du téléphone si elle est disponible, sinon l’anglais ; ne l’impose pas', () => {
    expect(proposeLocale(['en-US'])).toBe('en');
    expect(proposeLocale(['fr-CA', 'en'])).toBe('fr');
    expect(proposeLocale(['de-DE'])).toBe('en');
    expect(initialLocale(null)).toBe('en'); // téléphone en allemand (non disponible) → anglais proposé
    expect(initialLocale('fr')).toBe('fr'); // choix enregistré prioritaire
    expect(initialLocale('xx')).toBe('en');
  });
  it('pluriels selon la langue (Intl.PluralRules)', () => {
    setLocale('fr');
    expect(t('sync.done', { count: 1 })).toBe('1 entrée synchronisée.');
    expect(t('sync.done', { count: 0 })).toBe('0 entrée synchronisée.'); // en français, 0 est singulier
    expect(t('sync.done', { count: 3 })).toBe('3 entrées synchronisées.');
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('sync.done', { count: 0 })).toBe('0 entries synced.');
    expect(t('sync.done', { count: 1 })).toBe('1 entry synced.');
  });
  it('variables, nombres localisés, jamais de clé technique affichée', () => {
    setLocale('fr');
    expect(t('sync.syncing', { count: 1234 })).toBe('Synchronisation · 1 234');
    expect(t('nope.unknownKey' as never)).toBe('Unknown Key');
    setLocale('en');
    expect(t('sync.syncing', { count: 1234 })).toBe('Syncing · 1,234');
  });
  it('dates, nombres et unités dans la langue choisie', () => {
    const d = new Date(2026, 9, 18, 15, 5);
    setLocale('fr');
    expect(formatDate(d)).toBe('18 octobre 2026');
    expect(formatNumber(3.25)).toBe('3,25');
    expect(formatUnit(3.2, 'kilogram')).toMatch(/^3,2\s?kg$/);
    setLocale('en');
    expect(formatDate(d)).toBe('18 October 2026');
    expect(formatNumber(3.25)).toBe('3.25');
  });
});

describe('textes en dur', () => {
  it('aucun texte affiché écrit en dur dans les fichiers déjà traduits', () => {
    const res = scan(MIGRATED); // chemins relatifs à la racine du projet (dossier de lancement de Jest)
    expect(res).toEqual({});
  });
});
