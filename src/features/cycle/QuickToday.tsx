/**
 * « Aujourd'hui en un geste » (Mon cycle) : chaque touche enregistre tout de suite, une seconde touche retire.
 * - flux des règles en cours (seulement pendant des règles notées) ;
 * - symptômes : les plus fréquents de LA PERSONNE d'abord (d'après ses saisies), jamais une norme ;
 * - humeur de 1 à 5.
 * Tout reste modifiable dans la fiche détaillée (« Tout noter en détail »).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip, haptic } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { saveOwn, useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { FLOWS, INTIMATE_SYMPTOMS, SYMPTOM_KEYS, symptomKeysOf, type SymptomKey } from '@/lib/domain/cycleV2';
import { frequentSymptoms, toggleKey } from '@/lib/domain/cycleQuick';
import { todayISO } from '@/lib/domain/dates';
import type { PeriodEntry } from '@/lib/types';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { Glass, Ink, useCyclePalette } from './kit';

const pd = (k: string, p?: Record<string, string | number>) => tr(k as TKey, p);

export function QuickToday({ openPeriod }: { openPeriod: PeriodEntry | null }) {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { prefs } = useCyclePreferences();
  const logsQ = useAllSymptomLogs();
  const today = todayISO();
  const logs = useMemo(() => logsQ.data ?? [], [logsQ.data]);
  const current = logs.find((l) => l.logged_on === today) ?? null;
  const keys = current ? symptomKeysOf(current) : [];
  const options = SYMPTOM_KEYS.filter((k) => prefs.track_intercourse || !INTIMATE_SYMPTOMS.includes(k));
  const top = useMemo(() => frequentSymptoms(logs, options, today, 8) as SymptomKey[], [logs, options, today]);
  const [busy, setBusy] = useState(false);

  async function saveDay(patch: Record<string, unknown>, message: string) {
    if (busy) return;
    setBusy(true);
    try {
      const row = current
        ? patch
        : { user_id: userId, logged_on: today, symptom_keys: [], symptoms: [], intensities: {}, mood: null, energy: null, sleep: null, stress: null, note: null, ...patch };
      await saveOwn('symptom_logs', row, current?.id);
      inv('symptom_logs');
      haptic('success');
      toast(message);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  const toggle = (k: SymptomKey) => {
    const on = keys.includes(k);
    const label = tr(`cy.sym.${k}` as 'cy.sym.cramps');
    void saveDay({ symptom_keys: toggleKey(keys, k), symptoms: [] }, on ? pd('pd.quick.removed', { what: label }) : pd('pd.quick.added', { what: label }));
  };
  async function setFlow(f: string) {
    if (!openPeriod || busy) return;
    setBusy(true);
    try {
      const next = openPeriod.flow === f ? null : f;
      await backend.update('period_entries', { flow: next }, [eq('id', openPeriod.id)]);
      inv('period_entries');
      haptic('success');
      toast(pd('pd.quick.flowSaved', { what: next ? tr(`cy.flow.${next}` as 'cy.flow.light') : '—' }));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <Glass>
      <View style={{ gap: spacing.sm }} testID="cycle-quick-today">
        <View style={{ gap: 2 }}>
          <Ink variant="heading">{pd('pd.quick.title')}</Ink>
          <Ink variant="caption" soft>{pd('pd.quick.hint')}</Ink>
        </View>

        {openPeriod ? (
          <View style={{ gap: 6 }}>
            <Ink variant="label" soft>{pd('pd.quick.flow')}</Ink>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {FLOWS.map((f) => (
                <Chip key={f} icon="droplet" label={tr(`cy.flow.${f}` as 'cy.flow.light')} selected={openPeriod.flow === f} onPress={() => void setFlow(f)} testID={`quick-flow-${f}`} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Ink variant="label" soft>{pd('pd.quick.symptoms')}</Ink>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {top.map((k) => (
              <Chip key={k} label={tr(`cy.sym.${k}` as 'cy.sym.cramps')} selected={keys.includes(k)} icon={keys.includes(k) ? 'check' : undefined} onPress={() => toggle(k)} testID={`quick-sym-${k}`} />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Ink variant="label" soft>{pd('pd.quick.mood')}</Ink>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = current?.mood === n;
              return (
                <Tappable key={n} bare accessibilityRole="button" accessibilityState={{ selected: on }}
                  accessibilityLabel={`${pd('pd.quick.mood')} ${n}/5`}
                  onPress={() => void saveDay({ mood: on ? null : n }, pd('pd.quick.moodSaved'))}
                  testID={`quick-mood-${n}`}
                  style={{ flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 9, flexDirection: 'row', gap: 2, paddingHorizontal: 10,
                    backgroundColor: on ? c.period : c.powder, borderWidth: on ? 0 : 1, borderColor: c.glassBorder }}>
                  {/* barres croissantes : plus il y en a, mieux ça va */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <View key={i} style={{ flex: 1, height: 6 + i * 4, borderRadius: 2, backgroundColor: on ? c.onAccent : c.mauve, opacity: i < n ? 1 : 0.22 }} />
                  ))}
                </Tappable>
              );
            })}
          </View>
        </View>

        <Chip icon="edit-3" label={pd('pd.quick.all')} onPress={() => router.push('/cycle/symptoms' as never)} testID="quick-all" />
      </View>
    </Glass>
  );
}
