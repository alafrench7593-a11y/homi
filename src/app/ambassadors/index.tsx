/**
 * HOMI Ambassadors — présentation publique du programme : règles, confidentialité, simulateur ESTIMATIF.
 * Aucun prix d'abonnement affiché (le simulateur part d'un encaissé net d'exemple, modifiable), aucun témoignage
 * ni revenu inventé. Candidature réservée aux comptes HOMI (le serveur vérifie).
 */
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, SectionTitle, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatMinor, PROGRAM, simulate, useAffiliateSummary } from '@/lib/data/hooks-ambassadors';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const toMinor = (s: string) => { const n = Number(s.replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0; };

export default function Ambassadors() {
  const { session } = useAuth();
  const summary = useAffiliateSummary();
  const [net, setNet] = useState('10');
  const [perMonth, setPerMonth] = useState('5');
  const sim = useMemo(() => simulate(toMinor(net), Number(perMonth) || 0), [net, perMonth]);
  const threshold = formatMinor(PROGRAM.thresholdMinor, 'EUR');

  return (
    <Screen back title={tr('amb.title')}>
      <Text variant="body" testID="amb-lead">{tr('amb.lead', { percent: PROGRAM.percent, months: PROGRAM.months })}</Text>

      <SectionTitle title={tr('amb.how.title')} />
      <Card>
        {[tr('amb.how.1'), tr('amb.how.2'), tr('amb.how.3', { days: PROGRAM.holdDays }), tr('amb.how.4', { threshold })].map((s, i) => (
          <Text key={i} style={{ marginTop: i ? spacing.xs : 0 }}>{`${i + 1}. ${s}`}</Text>
        ))}
      </Card>

      <SectionTitle title={tr('amb.rules.title')} />
      <Card><Text>{tr('amb.rules.body', { days: PROGRAM.attributionDays })}</Text></Card>
      <Banner tone="info" icon="lock">{tr('amb.privacy')}</Banner>

      <SectionTitle title={tr('amb.sim.title')} />
      <Card testID="amb-sim">
        <Field label={tr('amb.sim.net')} value={net} onChangeText={setNet} keyboardType="decimal-pad" suffix="€" testID="amb-sim-net" />
        <Field label={tr('amb.sim.perMonth')} value={perMonth} onChangeText={setPerMonth} keyboardType="number-pad" testID="amb-sim-n" />
        <Text weight="bold" testID="amb-sim-cruise">{tr('amb.sim.cruise', { amount: formatMinor(sim.monthlyAtCruiseMinor, 'EUR') })}</Text>
        <Text weight="bold" testID="amb-sim-total">{tr('amb.sim.total', { amount: formatMinor(sim.totalMinor, 'EUR') })}</Text>
        <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('amb.sim.note', { months: PROGRAM.months })}</Text>
      </Card>

      {!session ? (
        <Button label={tr('amb.cta.signIn')} size="lg" full onPress={() => router.push('/auth/sign-up')} testID="amb-signup" />
      ) : summary.data ? (
        <Button label={tr('amb.cta.dashboard')} size="lg" full onPress={() => router.push('/ambassadors/dashboard')} testID="amb-dashboard" />
      ) : (
        <Button label={tr('amb.cta.apply')} size="lg" full disabled={summary.isLoading} onPress={() => router.push('/ambassadors/apply')} testID="amb-apply" />
      )}
    </Screen>
  );
}
