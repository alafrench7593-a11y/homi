/**
 * Robot compagnon d'Aura (`AuraBot`, src/features/aura/AuraBot.tsx) :
 *  - ÉTATS : chacun se rend avec son expression (yeux ouverts, arcs souriants, yeux ronds, trois points, regard doux) ;
 *  - PILOTAGE : priorités (réflexion > écoute > inquiétude > réponse > coucou > repos), coucou et sursaut passagers ;
 *  - RÉDUIRE LES ANIMATIONS : poses statiques (bras levé du coucou, tête penchée de l'écoute), aucun flottement ;
 *  - INQUIÉTUDE : jamais joyeuse (pas d'yeux souriants, pas de sursaut) ;
 *  - LIBELLÉS : décoratif par défaut, sinon « Aura, ton assistante… » dans les cinq langues (tutoiement en français).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
let mockLowPower = false;
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => mockLowPower }));

import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { AURA_BOT_FACES, AuraBot } from '@/features/aura/AuraBot';
import { AURA_BOT_STATES, auraBotStateFor, useAuraBot, type AuraBotState } from '@/features/aura/useAuraBot';
import { auraBotMotion } from '@/motion';
import { aura as fr } from '@/i18n/fr/aura';
import { aura as en } from '@/i18n/en/aura';
import { aura as de } from '@/i18n/de/aura';
import { aura as es } from '@/i18n/es/aura';
import { aura as it_ } from '@/i18n/it/aura';
import { AURA_BOT } from '@/theme/auraBot';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  await act(async () => { r.update(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const update = (r: ReactTestRenderer, el: React.ReactElement) => act(async () => { r.update(<ThemeProvider>{el}</ThemeProvider>); });
const tick = (ms = 34) => act(async () => { jest.advanceTimersByTime(ms); });
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];
type Style = { opacity?: number; transform?: Record<string, number | string>[] };
const styleOf = (r: ReactTestRenderer, id: string) => (getAnimatedStyle as unknown as (c: unknown) => Style)(host(r, id));
/** n-ième élément de transformation (valeur) */
const tf = (st: Style, i: number) => Object.values(st.transform?.[i] ?? {})[0];

let reduceMotion = false;
beforeEach(() => {
  jest.useFakeTimers();
  reduceMotion = false;
  mockLowPower = false;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduceMotion));
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: false }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('états rendus', () => {
  it.each(AURA_BOT_STATES)('%s : expression propre, à 32 et à 160 px', async (st) => {
    const r = await render(<><AuraBot size={160} state={st} testID="big" /><AuraBot size={32} state={st} testID="small" /></>);
    await tick(400);
    for (const id of ['big', 'small']) {
      expect(has(r, `${id}-${st}`)).toBe(true);
      const eyes = AURA_BOT_FACES[st].eyes;
      if (eyes === 'none') expect(has(r, `${id}-thinking-dots`)).toBe(true);
      else expect(has(r, `${id}-eyes-${eyes}`)).toBe(true);
    }
  });
  it('réflexion : trois points dans la visière et anneau autour du cœur (seulement pendant la réflexion)', async () => {
    const r = await render(<AuraBot size={96} state="thinking" testID="b" />);
    expect(has(r, 'b-orbit')).toBe(true);
    await update(r, <AuraBot size={96} state="idle" testID="b" />);
    expect(has(r, 'b-orbit')).toBe(false);
    expect(has(r, 'b-thinking-dots')).toBe(false);
    expect(has(r, 'b-eyes-open')).toBe(true);
  });
  it('chaque état a une expression distincte ; l’inquiétude n’est jamais joyeuse', () => {
    expect(AURA_BOT_FACES.concern.eyes).not.toBe('happy');
    expect(AURA_BOT_FACES.concern.mouth).not.toMatch(/grin|smile/);
    expect(AURA_BOT_FACES.greet.eyes).toBe('happy');
    expect(AURA_BOT_FACES.answer.eyes).toBe('happy');
    expect(AURA_BOT_FACES.listening.eyes).toBe('round');
    expect(AURA_BOT_FACES.thinking.eyes).toBe('none');
  });
});

describe('mouvement', () => {
  it('repos : il flotte (translation verticale), puis l’inquiétude se pose sans sursaut', async () => {
    const r = await render(<AuraBot size={120} state="idle" testID="b" />);
    await tick(900);
    expect(Math.abs(tf(styleOf(r, 'b-body'), 0) as number)).toBeGreaterThan(0.2);
    await update(r, <AuraBot size={120} state="concern" testID="b" />);
    for (let i = 0; i < 40; i++) await tick(50);
    expect(tf(styleOf(r, 'b-body'), 0) as number).toBeCloseTo(0, 1);
  });
  it('coucou : le bras se lève puis se repose (une fois)', async () => {
    const r = await render(<AuraBot size={120} state="greet" testID="b" />);
    await tick(300);
    expect(parseFloat(tf(styleOf(r, 'b-arm-r'), 2) as string)).toBeLessThan(-60);
    for (let i = 0; i < 80; i++) await tick(50);
    expect(Math.abs(parseFloat(tf(styleOf(r, 'b-arm-r'), 2) as string))).toBeLessThan(2);
  });
  it('réponse : petit sursaut, puis retour au sol', async () => {
    const r = await render(<AuraBot size={120} state="idle" testID="b" />);
    await update(r, <AuraBot size={120} state="answer" testID="b" />);
    await tick(auraBotMotion.hopMs);
    const up = tf(styleOf(r, 'b-body'), 0) as number;
    expect(up).toBeLessThan(-3);
  });
  it('Réduire les animations : poses statiques, aucun mouvement continu', async () => {
    reduceMotion = true;
    const r = await render(<AuraBot size={120} state="greet" testID="b" />);
    await tick(50);
    expect(parseFloat(tf(styleOf(r, 'b-arm-r'), 2) as string)).toBe(auraBotMotion.raiseDeg);
    await tick(1500);
    expect(tf(styleOf(r, 'b-body'), 0)).toBe(0);
    expect(parseFloat(tf(styleOf(r, 'b-arm-r'), 2) as string)).toBe(auraBotMotion.raiseDeg);
    await update(r, <AuraBot size={120} state="listening" testID="b" />);
    await tick(50);
    expect(parseFloat(tf(styleOf(r, 'b-head'), 1) as string)).toBe(auraBotMotion.tiltDeg);
    await tick(2000);
    expect(tf(styleOf(r, 'b-body'), 0)).toBe(0);
    expect(tf(styleOf(r, 'b-eyes-round'), 0)).toBe(0);
    await update(r, <AuraBot size={120} state="thinking" testID="b" />);
    await tick(800);
    expect(has(r, 'b-thinking-dots')).toBe(true);
    expect(parseFloat(tf(styleOf(r, 'b-orbit'), 1) as string)).toBe(0);
  });
  it('`still` : pose immédiate même en mouvement complet (avatars des anciens messages)', async () => {
    const r = await render(<AuraBot size={32} state="idle" still testID="b" />);
    await tick(1500);
    expect(tf(styleOf(r, 'b-body'), 0)).toBe(0);
  });
});

function Probe(p: Parameters<typeof useAuraBot>[0]) {
  const s = useAuraBot(p);
  return <Text testID="probe">{s}</Text>;
}
const probe = (r: ReactTestRenderer) => (r.root.findByProps({ testID: 'probe' }).props.children as AuraBotState);

describe('pilotage de l’état (useAuraBot)', () => {
  it('priorités : réflexion > écoute > inquiétude > réponse > coucou > repos', () => {
    expect(auraBotStateFor({ thinking: true, listening: true, concern: true })).toBe('thinking');
    expect(auraBotStateFor({ listening: true, concern: true, answering: true })).toBe('listening');
    expect(auraBotStateFor({ concern: true, answering: true, greeting: true })).toBe('concern');
    expect(auraBotStateFor({ answering: true, greeting: true })).toBe('answer');
    expect(auraBotStateFor({ greeting: true })).toBe('greet');
    expect(auraBotStateFor({})).toBe('idle');
  });
  it('coucou à l’ouverture, une fois, puis repos ; sursaut à chaque nouvelle réponse, puis repos', async () => {
    const base = { thinking: false, listening: false, concern: false, answerKey: null as string | null };
    const r = await render(<Probe {...base} />);
    expect(probe(r)).toBe('greet');
    await tick(auraBotMotion.greetMs + 10);
    expect(probe(r)).toBe('idle');
    await update(r, <Probe {...base} thinking />);
    expect(probe(r)).toBe('thinking');
    await update(r, <Probe {...base} answerKey="a1:ai" />);
    expect(probe(r)).toBe('answer');
    await tick(auraBotMotion.answerMs + 10);
    expect(probe(r)).toBe('idle');
    await update(r, <Probe {...base} answerKey="a1:ai" concern />);
    expect(probe(r)).toBe('concern');
  });
});

describe('accessibilité', () => {
  it('décoratif par défaut (le texte voisin dit l’état), sinon image nommée selon l’état', async () => {
    const r = await render(<><AuraBot size={48} testID="d" /><AuraBot size={140} state="listening" decorative={false} testID="n" /></>);
    const d = host(r, 'd');
    expect(d.props.accessibilityElementsHidden).toBe(true);
    expect(d.props.importantForAccessibility).toBe('no-hide-descendants');
    const n = host(r, 'n');
    expect(n.props.accessibilityRole).toBe('image');
    expect(n.props.accessibilityLabel).toBe('Aura, ton assistante, t’écoute');
  });
  it('libellés des six états dans les cinq langues ; tutoiement en français', () => {
    for (const dict of [fr, en, de, es, it_] as Record<string, unknown>[]) {
      for (const st of AURA_BOT_STATES) expect(typeof dict[`aura.bot.${st}`]).toBe('string');
    }
    expect(fr['aura.bot.idle' as keyof typeof fr]).toBe('Aura, ton assistante');
    for (const st of AURA_BOT_STATES) expect(String(fr[`aura.bot.${st}` as keyof typeof fr])).not.toMatch(/\b(vous|votre|vos)\b/i);
  });
});

describe('palette', () => {
  it('trois apparences, la coque reste nacrée de jour, la nuit ne brille pas', () => {
    expect(AURA_BOT.light.shellTop).toBe('#FFF8F2');
    expect(AURA_BOT.light.visor).toBe('#1E2A4A');
    expect(AURA_BOT.night.glowOpacity).toBeLessThan(AURA_BOT.light.glowOpacity);
    expect(AURA_BOT.night.sheenOpacity).toBeLessThan(AURA_BOT.light.sheenOpacity);
  });
});
