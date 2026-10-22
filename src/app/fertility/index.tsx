/**
 * Parcours « Je souhaite concevoir » : cycle, fenêtre fertile ESTIMÉE, repères, suivi et préparation des consultations.
 * Aucune date n'est garantie ; aucune grossesse n'est promise.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Banner, Button, Card, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { t as tr } from '@/i18n';
import { EstimateLine, fmt, JourneyArticles, MonthCalendar, NavCard, num, RELIABILITY_LABEL, type CalendarStyle } from '@/components/Fertility';
import { useUserId } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { conceptionDayKind, currentCycleDay, upcomingWindow, type ConceptionDayKind } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { TIMING_INFO, TTC_DISCLAIMER } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function FertilityScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const cycleQ = useCycleEstimates(4);
  const { entries, est, windows } = cycleQ;
  const [saving, setSaving] = useState(false);
  const { prefs } = useCyclePreferences();
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const w = upcomingWindow(windows, today);

  const styleOf = useCallback((k: ConceptionDayKind): CalendarStyle | null => {
    switch (k) {
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: 'Règles saisies' };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: 'Règles estimées (estimation)' };
      case 'ovulation_estimate': return { bg: t.colors.lavender, fg: '#fff', label: 'Ovulation estimée (estimation)' };
      case 'higher_chance_estimate': return { bg: t.colors.lavender + '88', label: 'Jours où les chances peuvent être plus élevées (estimation)' };
      case 'fertile_estimate': return { bg: t.colors.lavender + '33', label: 'Fenêtre fertile estimée (estimation)' };
      default: return null;
    }
  }, [t]);

  async function periodToday() {
    if (entries.some((p) => p.start_date === today)) return toast('Vos règles sont déjà notées pour aujourd’hui.', 'info');
    setSaving(true);
    try {
      await insertOrQueue('period_entries', { user_id: userId, start_date: today });
      inv('period_entries');
      toast('Début des règles noté pour aujourd’hui.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back account title="Essayer de concevoir" subtitle="Des repères pour votre cycle, à votre rythme.">
      <Banner tone="warning" title="Estimations, sans garantie">{TTC_DISCLAIMER}</Banner>

      {cycleQ.isLoading && !cycleQ.data ? <Skeleton kind="card" rows={1} /> : cycleQ.isError && !cycleQ.data ? (
        <ErrorView error={cycleQ.error} onRetry={() => void cycleQ.refetch()} title="Impossible d’afficher votre cycle" />
      ) : (
      <Appear kind="soft">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="bold">Mon cycle</Text>
            <Text variant="caption" muted>{RELIABILITY_LABEL[est.reliability]}</Text>
          </Row>
          {day != null ? (
            <View style={{ marginTop: spacing.xs }}>
              <EstimateLine label="Aujourd’hui" value={`Jour ${day} de votre cycle`} estimate={false} />
              {w ? (
                <>
                  <EstimateLine label="Fenêtre fertile estimée" value={`du ${fmt(w.start)} au ${fmt(w.end)}`} />
                  <EstimateLine label="Jours où les chances de conception peuvent être plus élevées" value={`du ${fmt(w.higherStart)} au ${fmt(w.higherEnd)}`} />
                  <EstimateLine label="Ovulation estimée" value={`vers le ${fmt(w.ovulation)}`} />
                  <EstimateLine label="Prochaines règles estimées" value={`vers le ${fmt(w.nextPeriod)}`} />
                </>
              ) : null}
              {est.averageLength != null ? <Text variant="small" muted>{`Durée moyenne de vos cycles : ${num(est.averageLength)} jours${est.variability != null ? ` (variation ± ${num(est.variability)} j)` : ''}.`}</Text> : null}
            </View>
          ) : (
            <Text muted style={{ marginTop: spacing.xs }}>Notez la date de vos dernières règles pour afficher des estimations.</Text>
          )}
          <Button label="Mes règles ont commencé aujourd’hui" icon="droplet" variant="secondary" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} loading={saving} onPress={periodToday} />
        </Card>
      </Appear>
      )}

      <Card>
        <MonthCalendar kindOf={(d) => conceptionDayKind(d, entries, windows, today)} styleOf={styleOf} legend={['period', 'next_period_estimate', 'fertile_estimate', 'higher_chance_estimate', 'ovulation_estimate']} />
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          {est.caveats.map((c) => <Text key={c} variant="caption" muted>• {c}</Text>)}
        </View>
      </Card>

      <Appear kind="soft">
        <Card onPress={() => router.push('/fertility/understand')} tone="lavender" accessibilityLabel="Comprendre mon cycle et mes tests">
          <Text weight="bold">Comprendre mon cycle et mes tests</Text>
          <Text variant="small" muted>Observer sa glaire, photographier un test d’ovulation ou de grossesse, calendrier privé.</Text>
        </Card>
      </Appear>

      <SectionTitle title="Mon suivi" />
      <NavCard items={[
        { icon: 'grid', title: tr('cy.nav.full'), subtitle: tr('cy.nav.full.hint'), to: '/cycle?all=1' },
        { icon: 'edit-3', title: 'Règles, symptômes et tests', subtitle: 'Tests d’ovulation et de grossesse compris', to: '/fertility/log' },
        { icon: 'thermometer', title: 'Température et glaire', subtitle: 'Si vous souhaitez les noter — avec un graphique', to: '/fertility/body' },
        ...(prefs.track_intercourse ? [{ icon: 'lock' as const, title: 'Rapports', subtitle: 'Facultatif et privé : visible uniquement par vous', to: '/fertility/intimacy' }] : []),
        { icon: 'rotate-ccw', title: 'Historique des cycles', subtitle: 'Durées et ovulations estimées a posteriori', to: '/fertility/history' },
        { icon: 'bell', title: 'Mes rappels', subtitle: 'Température, test, complément, règles…', to: '/fertility/reminders' },
      ]} />

      <SectionTitle title="Quand des rapports peuvent augmenter les chances" />
      <Card tone="lavender">
        {TIMING_INFO.map((i) => (
          <View key={i.title} style={{ gap: 2, paddingVertical: 6 }}>
            <Text weight="bold">{i.title}</Text>
            <Text variant="small">{i.text}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle title="Préparer une consultation" />
      <NavCard items={[
        { icon: 'help-circle', title: 'Mes questions à préparer', subtitle: 'Une liste à garder et compléter', to: '/fertility/consultation' },
        { icon: 'activity', title: 'Examens et consultations possibles', subtitle: 'En cas de difficulté à concevoir : quand et à qui en parler', to: '/fertility/exams' },
      ]} />

      <SectionTitle title="À lire" />
      <JourneyArticles journey="ttc" />
    </Screen>
  );
}
