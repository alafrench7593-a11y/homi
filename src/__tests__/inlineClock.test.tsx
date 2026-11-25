/** Sélecteur d'heure dans les champs (25/11/2026) : détection, choix heure → minutes, « Maintenant », durée exclue. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Field } from '@/components/ui';
import { formatClock, isTimePlaceholder, parseClock } from '@/components/InlineClock';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('heures', () => {
  it('reconnaît les champs heure, pas les durées ni les dates', () => {
    for (const p of ['09:00', '22:30', 'HH:MM', '14h', '15h30', '7:30am']) expect([p, isTimePlaceholder(p)]).toEqual([p, true]);
    for (const p of ['JJ/MM/AAAA', 'g/dL', '120', '', undefined]) expect([p, isTimePlaceholder(p)]).toEqual([p, false]);
  });
  it('lit et écrit', () => {
    expect(parseClock('7h')).toEqual({ h: 7, m: 0 });
    expect(parseClock('19 h 45')).toEqual({ h: 19, m: 45 });
    expect(parseClock('25:00')).toBeNull();
    expect(formatClock(9, 5)).toBe('09:05');
    expect(formatClock(9, 5, 'h')).toBe('09h05');
  });
});

function Harness({ placeholder, time }: { placeholder: string; time?: boolean }) {
  const [v, setV] = useState('');
  return <ThemeProvider><Field label="Heure" placeholder={placeholder} time={time} value={v} onChangeText={setV} testID="f" /></ThemeProvider>;
}
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
const value = (r: ReactTestRenderer) => r.root.findAll((n) => n.props.testID === 'f' && 'value' in n.props)[0].props.value;

describe('champ heure', () => {
  it('horloge → 14 → :30 écrit « 14:30 »', async () => {
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<Harness placeholder="09:00" />); });
    await act(async () => { byId(r, 'f-clock').props.onPress(); });
    await act(async () => { byId(r, 'f-clk-h14').props.onPress(); });
    await act(async () => { byId(r, 'f-clk-m30').props.onPress(); });
    expect(value(r)).toBe('14:30');
  });
  it('format « h » respecté et « Maintenant »', async () => {
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<Harness placeholder="15h30" />); });
    await act(async () => { byId(r, 'f-clock').props.onPress(); });
    await act(async () => { byId(r, 'f-clk-now').props.onPress(); });
    expect(value(r)).toMatch(/^\d{2}h\d{2}$/);
  });
  it('durée déclarée : pas d’horloge', async () => {
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<Harness placeholder="7h30" time={false} />); });
    expect(byId(r, 'f-clock')).toBeUndefined();
  });
});
