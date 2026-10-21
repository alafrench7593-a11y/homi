/**
 * Rendu réel (React Native, moteur local) des nouveaux écrans : communauté, éditeur de publication, publication,
 * profil d'un membre, onglet « Moi » (profil communautaire et compte privé), cartes de suivi.
 * Lancé avec le préréglage iOS par défaut et, en plus, avec `--preset jest-expo/android` (voir FONCTIONNALITES.md).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/community', __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { Platform } from 'react-native';
import * as ExpoRouter from 'expo-router';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import CommunityTab from '@/app/(tabs)/community';
import Moi from '@/app/(tabs)/moi';
import Composer from '@/app/community/new';
import PostScreen from '@/app/community/post/[id]';
import MemberProfile from '@/app/community/u/[handle]';
import ProfileEditor from '@/app/community/profile';
import { ChildTrackCards, PregnancyTrackCards } from '@/features/trackCards';
import Groups from '@/app/community/groups';
import Today from '@/app/today';
import NotificationSettings from '@/app/community/notifications';
import type { Child } from '@/lib/types';

const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string> } }).__state;
const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock; push: jest.Mock } }).router;

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(80);
  return r;
}
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && (typeof n.props.onPress === 'function' || typeof n.props.onChangeText === 'function'))[0];
async function pressId(r: ReactTestRenderer, id: string) {
  const el = byTestId(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(100);
}
async function type(r: ReactTestRenderer, id: string, value: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(value); });
}

describe(`nouveaux écrans (${Platform.OS})`, () => {
  let child: Child;
  beforeAll(async () => {
    await backend.auth.signUp(`ecrans.communaute.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    // Foyer actif de la personne (celui que lisent les écrans), créé à l'inscription si besoin
    const [first] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = first?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    [child] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Zélie', birth_date: '2026-01-10', enabled_tracking: ['bottle', 'diaper', 'sleep', 'meal'] });
  });

  afterAll(async () => { await flush(400); });

  it('communauté sans profil : invitation à créer son profil, fils et catégories', async () => {
    const r = await render(<CommunityTab />);
    const t = allText(r);
    expect(t).toContain('Créez votre profil communautaire');
    expect(t).toContain('Pour vous');
    expect(t).toContain('Récent');
    expect(t).toContain('Toutes les catégories');
    r.unmount();
  });

  it('création du profil : pseudonyme, identifiant « @ » proposé, règles', async () => {
    const r = await render(<ProfileEditor />);
    await type(r, 'profile-pseudo', 'Maman Iris');
    await flush();
    expect(allText(r)).toContain('@maman_iris');
    await pressId(r, 'profile-save');
    expect(allText(r)).toContain('Acceptez les règles');
    const toggle = r.root.findAll((n) => n.props.accessibilityRole === 'switch' && typeof n.props.onPress === 'function')[0];
    await act(async () => { toggle.props.onPress(); });
    await pressId(r, 'profile-save');
    const me = await backend.rpc<{ handle: string }>('my_community_profile');
    expect(me.handle).toBe('maman_iris');
    r.unmount();
  });

  it('éditeur : témoignage anonyme avec aperçu, puis publication', async () => {
    const forums = await backend.select<{ id: string; slug: string }>({ table: 'forums' });
    routerState.params = { forum: forums.find((f) => f.slug === 'nouveau-ne')!.id };
    const r = await render(<Composer />);
    await type(r, 'composer-body', 'Les premières nuits sont longues, son traitement contre le reflux aide un peu.');
    const anon = r.root.findAll((n) => n.props.accessibilityLabel === 'Anonyme' && typeof n.props.onPress === 'function')[0];
    await act(async () => { anon.props.onPress(); });
    await flush();
    expect(allText(r)).toContain('Les autres membres ne verront ni votre pseudonyme');
    await pressId(r, 'composer-publish');
    // Sujet médical : un avertissement s'affiche d'abord (aperçu), la publication part au second appui
    expect(allText(r)).toContain('Avant de publier');
    await pressId(r, 'composer-publish');
    const posts = await backend.select<{ id: string; anonymous: boolean; body: string }>({ table: 'forum_feed', filters: [eq('is_mine', true)] });
    expect(posts.find((p) => p.body.startsWith('Les premières nuits'))?.anonymous).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/community\/post\//));
    routerState.params = {};
    r.unmount();
  });

  it('publication : carte, commentaires, mention « témoignage », menu', async () => {
    const [p] = await backend.select<{ id: string }>({ table: 'forum_feed', filters: [eq('is_mine', true)] });
    routerState.params = { id: p.id };
    const r = await render(<PostScreen />);
    const t = allText(r);
    expect(t).toContain('Anonyme (vous)');
    expect(t).toContain('pas un avis médical');
    expect(t).toContain('Vos réponses à votre publication anonyme restent anonymes.');
    routerState.params = {};
    r.unmount();
  });

  it('profil d’un membre : présentation publique, bloquer et signaler', async () => {
    routerState.params = { handle: 'papadenour' };
    const r = await render(<MemberProfile />);
    const t = allText(r);
    expect(t).toContain('PapaDeNour');
    expect(t).toContain('@papadenour');
    expect(t).toContain('Bloquer');
    expect(t).toContain('Signaler');
    routerState.params = {};
    r.unmount();
  });

  it('« Moi » : profil communautaire puis compte privé, séparés', async () => {
    const r = await render(<Moi />);
    let t = allText(r);
    expect(t).toContain('Maman Iris');
    expect(t).toContain('@maman_iris');
    expect(t).not.toContain('Zélie'); // le prénom de l'enfant n'apparaît jamais dans le profil communautaire
    const account = r.root.findAll((n) => n.props.accessibilityLabel === 'Compte privé' && typeof n.props.onPress === 'function')[0];
    await act(async () => { account.props.onPress(); });
    await flush(120);
    t = allText(r);
    for (const x of ['Abonnement', 'Notifications', 'Confidentialité', 'Personnes bloquées', 'Sécurité', 'Aide', 'Exporter mes données', 'Supprimer mon compte', 'Se déconnecter', 'Ajouter un profil']) expect(t).toContain(x);
    r.unmount();
  });

  it('communauté : fils « Abonnements », groupes, recherche de membres', async () => {
    const r = await render(<CommunityTab />);
    const t = allText(r);
    for (const x of ['Pour vous', 'Abonnements', 'Récent', 'Enregistrés', 'Groupes', 'Filtres']) expect(t).toContain(x);
    await type(r, 'community-search', '@papa');
    await flush(200);
    expect(allText(r)).toContain('@papadenour');
    r.unmount();
  });

  it('groupes : groupe du mois de naissance proposé (mois seulement), groupe privé Premium', async () => {
    const r = await render(<Groups />);
    await flush(400);
    const t = allText(r);
    expect(t).toContain('Bébés nés en janvier 2026');
    expect(t).not.toContain('Zélie');
    expect(t).toContain('Créez votre groupe privé de parents');
    await pressId(r, 'join-cohort-birth-2026-01');
    await flush(200);
    const groups = await backend.rpc<{ name: string; is_member: boolean }[]>('community_groups_overview');
    expect(groups.find((g) => g.name === 'Bébés nés en janvier 2026')?.is_member).toBe(true);
    r.unmount();
  });

  it('résumé du jour et réglages des notifications', async () => {
    const r = await render(<Today />);
    const t = allText(r);
    expect(t).toMatch(/Résumé du (matin|soir)/);
    expect(t).toContain('Choisir mes notifications');
    r.unmount();
    const n = await render(<NotificationSettings />);
    const nt = allText(n);
    for (const x of ['Résumé du matin', 'Résumé du soir', 'Question du jour', 'Mentions', 'Publications des membres suivis', 'Activité de mes groupes privés']) expect(nt).toContain(x);
    n.unmount();
  });

  it('cartes de suivi : bébé en diversification, puis grossesse sans biberon ni couche', async () => {
    const r = await render(<ChildTrackCards child={child} journey="baby" />);
    const ids = r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('track-card-')).map((n) => n.props.testID);
    expect([...new Set(ids)]).toEqual(['track-card-meal', 'track-card-sleep', 'track-card-bottle', 'track-card-diaper']);
    expect(allText(r)).toContain('Voir tous les suivis');
    r.unmount();
    const g = await render(<PregnancyTrackCards pregnancyId={null} />);
    const gIds = [...new Set(g.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('track-card-')).map((n) => n.props.testID))];
    expect(gIds).toEqual(['track-card-mother_sleep', 'track-card-mood', 'track-card-meal', 'track-card-appointment']);
    expect(allText(g)).not.toMatch(/Biberon|Tétée|Couche/);
    g.unmount();
  });
});
