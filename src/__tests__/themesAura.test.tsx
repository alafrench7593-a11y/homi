/**
 * Refonte « Apple premium » et Aura (brief du 21/11/2026) :
 *  - sélecteur « Personnaliser l'accueil » : huit vignettes lisibles (libellé ≥ 4,5:1), aperçu → annulation → thème
 *    confirmé, « Appliquer le thème » → enregistré pour le compte, rendu réel du panneau ;
 *  - présentation d'Aura : une seule fois par compte, relançable, jamais par-dessus la visite guidée ;
 *  - entrée contextuelle : seulement pour un outil RÉEL du catalogue ;
 *  - actions d'Aura validées : outil inexistant ou hors catalogue → aucune carte, aucun lien ; « Mon bébé prend le sein »
 *    → Allaitement, « Où noter sa sieste ? » → outil sommeil (recherche du serveur, la même que le modèle simulé) ;
 *  - voix : texte lisible à voix haute (sans Markdown), langue de la voix, capacité absente → aucune exception.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), useFocusEffect: () => undefined };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { useUiStore } from '@/lib/store';
import { PALETTE_NAMES, THEME_STARTS, type Theme } from '@/theme/tokens';
import { PICKER_THEMES, pickerSelected, swatchInkContrast } from '@/features/themePicker/model';
import { ThemePickerSheet } from '@/features/themePicker/ThemePicker';
import { AuraIntro } from '@/features/aura/AuraEntry';
import { auraToolContext, introChoices, introRoute, shouldShowAuraIntro } from '@/features/aura/intro';
import { canSpeak, plainForSpeech, speak, voiceLang } from '@/features/aura/voice';
import { catalogForServer } from '@/features/aura/model';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { toolWordsKey } from '@/lib/journeys/tools';
import { tMaybe } from '@/i18n';
import { sanitizeActions, sanitizeCatalog, searchAuraCatalog, toAction } from '../../supabase/functions/_shared/aura-tools';
import { simulatedTurn } from '@/lib/backend/demoAura';

jest.setTimeout(60000);

let seen: Theme | null = null;
function Probe() { seen = useTheme(); return null; }
const qc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const flush = async (ms = 50) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc()}><AuthProvider><ThemeProvider><ToastProvider>{el}<Probe /></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(200);
  return r;
}
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n: ReactTestInstance) => n.props.testID === id && typeof n.props.onPress === 'function');
async function press(r: ReactTestRenderer, id: string) {
  const n = byId(r, id)[0];
  if (!n) throw new Error(`introuvable : ${id}`);
  await act(async () => { n.props.onPress(); });
  await flush(120);
}

beforeEach(() => {
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', palettePreference: 'olive', themePreview: null, adaptiveProfile: 'me', appearanceByUser: {}, appearanceOwner: null, auraIntroSeen: {}, auraIntroRequested: false }); });
});

describe('sélecteur « Personnaliser l’accueil »', () => {
  it('huit thèmes dans l’ordre du tableau ; libellé de chaque vignette ≥ 4,5:1 sur ses deux arrêts', () => {
    expect(PICKER_THEMES).toEqual(['nacre', 'graphite', 'sable', 'olive', 'lavande', 'glacier', 'rose', 'amethyste']);
    const weak = PICKER_THEMES.map((p) => [p, swatchInkContrast(p)] as const).filter(([, r]) => r < 4.5);
    expect(weak).toEqual([]);
    expect(pickerSelected(null, 'olive', 'me')).toBe('olive');
    expect(pickerSelected('sable', 'olive', 'me')).toBe('sable');
    expect(pickerSelected(null, 'adaptive', 'pregnancy')).toBe('lavande');
  });

  it('panneau réel : aperçu immédiat, fermeture = thème confirmé rétabli, rien d’enregistré', async () => {
    const onClose = jest.fn();
    const r = await render(<ThemePickerSheet visible onClose={onClose} />);
    for (const p of PALETTE_NAMES) expect(byId(r, `theme-${p}`).length).toBeGreaterThan(0);
    await press(r, 'theme-amethyste');
    expect(seen!.colors.background).toBe(THEME_STARTS.amethyste.bg);
    expect(useUiStore.getState().palettePreference).toBe('olive');
    // coche perceptible sans la couleur : état « coché » annoncé
    expect(byId(r, 'theme-amethyste')[0].props.accessibilityState).toMatchObject({ checked: true });
    expect(byId(r, 'theme-olive')[0].props.accessibilityState).toMatchObject({ checked: false });
    // fermeture sans validation (voile, geste, retour)
    await act(async () => { useUiStore.getState().cancelThemePreview(); });
    await flush(80);
    expect(seen!.colors.background).toBe(THEME_STARTS.olive.bg);
    expect(useUiStore.getState().palettePreference).toBe('olive');
    r.unmount();
  });

  it('« Appliquer le thème » enregistre le thème touché et ferme le panneau', async () => {
    const onClose = jest.fn();
    act(() => { useUiStore.getState().switchAppearanceOwner('camille'); });
    const r = await render(<ThemePickerSheet visible onClose={onClose} />);
    await press(r, 'theme-glacier');
    await press(r, 'theme-apply');
    expect(onClose).toHaveBeenCalled();
    expect(useUiStore.getState().palettePreference).toBe('glacier');
    expect(useUiStore.getState().themePreview).toBeNull();
    expect(useUiStore.getState().appearanceByUser.camille.palette).toBe('glacier');
    expect(seen!.colors.background).toBe(THEME_STARTS.glacier.bg);
    r.unmount();
  });
});

describe('présentation d’Aura', () => {
  it('une seule fois par compte ; relançable ; jamais par-dessus la visite guidée ; jamais sans compte', () => {
    const base = { userId: 'u1', seen: {}, requested: false, busy: false };
    expect(shouldShowAuraIntro(base)).toBe(true);
    expect(shouldShowAuraIntro({ ...base, seen: { u1: true } })).toBe(false);
    expect(shouldShowAuraIntro({ ...base, seen: { u2: true } })).toBe(true);
    expect(shouldShowAuraIntro({ ...base, busy: true })).toBe(false);
    expect(shouldShowAuraIntro({ ...base, seen: { u1: true }, requested: true })).toBe(true);
    expect(shouldShowAuraIntro({ ...base, userId: null, requested: true })).toBe(false);
  });

  it('magasin : vue = mémorisée par compte (persistée), relance non persistée', () => {
    const s = () => useUiStore.getState();
    act(() => { s().markAuraIntroSeen('u1'); });
    expect(s().auraIntroSeen).toEqual({ u1: true });
    act(() => { s().requestAuraIntro(); });
    expect(s().auraIntroRequested).toBe(true);
    const saved = useUiStore.persist.getOptions().partialize!(s()) as Record<string, unknown>;
    expect(saved.auraIntroRequested).toBeUndefined();
    expect(saved.auraIntroSeen).toEqual({ u1: true });
    act(() => { s().markAuraIntroSeen('u1'); });
    expect(s().auraIntroRequested).toBe(false);
  });

  it('choix selon les capacités, vraie route d’Aura ; rendu : message, Parler / Écrire / Plus tard', async () => {
    expect(introChoices({ canTalk: true })).toEqual(['talk', 'write', 'later']);
    expect(introChoices({ canTalk: false })).toEqual(['write', 'later']);
    expect(introRoute('talk')).toEqual({ pathname: '/assistant', params: { voice: '1' } });
    expect(introRoute('write')).toEqual({ pathname: '/assistant', params: { focus: '1' } });
    const onDone = jest.fn();
    const r = await render(<AuraIntro visible onDone={onDone} />);
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain('Salut, moi c’est Aura, l’assistante de HOMI.');
    expect(byId(r, 'aura-intro-write').length).toBeGreaterThan(0);
    expect(byId(r, 'aura-intro-later').length).toBeGreaterThan(0);
    await press(r, 'aura-intro-later');
    expect(onDone).toHaveBeenCalledWith('later');
    r.unmount();
  });
});

describe('Aura : entrée contextuelle et actions sûres', () => {
  it('entrée d’un outil : identifiant réel seulement (sinon aucun contexte)', () => {
    expect(auraToolContext('baby_breastfeed')?.id).toBe('baby_breastfeed');
    expect(auraToolContext('outil_invente')).toBeNull();
    expect(auraToolContext('../../admin')).toBeNull();
    expect(auraToolContext('')).toBeNull();
    expect(auraToolContext(null)).toBeNull();
  });

  const babyCatalog = () => sanitizeCatalog(catalogForServer(toolCatalog({ scope: 'baby', childId: 'c1', babyId: 'c1', postpartum: true }), (id) => tMaybe(toolWordsKey(id)) || ''));

  it('« Mon bébé prend le sein » → Allaitement ; « Où noter sa sieste ? » → outil sommeil (vraies routes du catalogue)', () => {
    const cat = babyCatalog();
    const feed = searchAuraCatalog(cat, 'Mon bébé prend le sein');
    expect(feed[0]?.id).toBe('baby_breastfeed');
    const nap = searchAuraCatalog(cat, 'Où noter sa sieste ?');
    const napIds = nap.map((x) => x.id);
    expect(napIds[0]).toMatch(/sleep/);
    // la carte « Ouvrir » ne pointe que vers un outil du catalogue
    const action = toAction('propose_open_tool', { tool_id: feed[0].id, reason: 'x' }, cat, '2026-11-21');
    expect(action).toMatchObject({ type: 'open_tool', id: 'baby_breastfeed' });
  });

  it('modèle simulé (démonstration) : même recherche, puis proposition « Ouvrir Allaitement »', () => {
    const cat = babyCatalog();
    const q = 'Mon bébé prend le sein';
    const t1 = simulatedTurn({ system: '', turns: [], contents: [{ role: 'user', parts: [{ text: q }] }], functions: [] as never }, '2026-11-21');
    expect(t1.calls[0]).toMatchObject({ name: 'search_tools' });
    const tools = searchAuraCatalog(cat, String((t1.calls[0].args as { query: string }).query));
    const t2 = simulatedTurn({ system: '', turns: [], functions: [] as never, contents: [
      { role: 'user', parts: [{ text: q }] },
      { role: 'model', parts: t1.parts },
      { role: 'user', parts: [{ functionResponse: { name: 'search_tools', response: { tools } } }] },
    ] as never }, '2026-11-21');
    expect(t2.calls[0]).toMatchObject({ name: 'propose_open_tool', args: { tool_id: 'baby_breastfeed' } });
  });

  it('outil inventé ou hors catalogue par Gemini : aucune carte, aucun lien', () => {
    const cat = babyCatalog();
    expect(toAction('propose_open_tool', { tool_id: 'outil_invente' }, cat, '2026-11-21')).toBeNull();
    expect(toAction('propose_open_tool', { tool_id: 'https://exemple.test' }, cat, '2026-11-21')).toBeNull();
    const ids = new Set(cat.map((c) => c.id));
    const kept = sanitizeActions([
      { type: 'open_tool', id: 'outil_invente', label: 'Outil inventé' },
      { type: 'open_tool', id: 'admin_panel', label: 'Admin', route: '/admin' },
      { type: 'open_tool', id: 'baby_breastfeed', label: 'Allaitement', route: 'https://evil.test' },
      { type: 'delete_everything' },
    ], ids, '2026-11-21');
    expect(kept).toEqual([{ type: 'open_tool', id: 'baby_breastfeed', label: 'Allaitement', reason: null }]);
    // aucune action n'écrit : elles sont seulement PROPOSÉES (la confirmation passe par l'écran)
    for (const a of kept) expect(Object.keys(a)).not.toContain('route');
  });
});

describe('voix du téléphone', () => {
  it('texte lu sans Markdown ni lien, borné ; langue de la voix', () => {
    expect(plainForSpeech('## Titre\n- **Allaitement** : [ouvrir](/feeding) https://x.test')).toBe('Titre Allaitement : ouvrir');
    expect(plainForSpeech('a '.repeat(2000)).length).toBeLessThanOrEqual(1801);
    expect(voiceLang('fr')).toBe('fr-FR');
    expect(voiceLang('it')).toBe('it-IT');
  });
  it('capacité absente (binaire sans module natif) : aucune lecture, aucune exception', () => {
    expect(typeof canSpeak()).toBe('boolean');
    if (!canSpeak()) expect(speak('Bonjour')).toBe(false);
  });
});
