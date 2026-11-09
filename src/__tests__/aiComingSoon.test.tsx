/**
 * Assistant IA « Bientôt disponible » (09/11/2026) : interrupteur coupé ⇒ l'onglet Questions et la conversation
 * affichent l'écran « Bientôt disponible » (aucun appel à l'IA), avec l'accès aux articles et aux urgences.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({}), usePathname: () => '/ask', Link: () => null, Stack: { Screen: () => null } }));

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { FEATURES, aiAssistantOnline } from '@/config/features';
import { AiComingSoonCard } from '@/features/AiComingSoon';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('assistant IA bientôt disponible', () => {
  it('interrupteur par défaut : coupé en production (les autres tests l’allument)', () => {
    // la valeur écrite dans src/config/features.ts est false ; jest-setup-features.js l'allume pour les autres tests
    const src = require('fs').readFileSync(require('path').resolve('src/config/features.ts'), 'utf8') as string;
    expect(src).toMatch(/aiAssistantOnline:\s*false/);
  });
  it('carte « Bientôt disponible » : titre, articles, bibliothèque', async () => {
    FEATURES.aiAssistantOnline = false;
    expect(aiAssistantOnline()).toBe(false);
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<ThemeProvider><AiComingSoonCard /></ThemeProvider>); });
    const ids = r.root.findAll((n) => typeof n.props?.testID === 'string').map((n) => n.props.testID as string);
    expect(ids).toEqual(expect.arrayContaining(['ai-coming-soon', 'ai-soon-local', 'ai-soon-library']));
    expect(JSON.stringify(r.toJSON())).toMatch(/bientôt/i);
  });
});
