/**
 * Parcours « Je souhaite éviter une grossesse ».
 * AUCUN jour n'est présenté comme exempt de risque : une grossesse reste possible à tout moment du cycle.
 * Le calendrier informe ; il ne remplace jamais une contraception adaptée.
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Banner, Button, Card, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { EstimateLine, fmt, JourneyArticles, MonthCalendar, NavCard, num, RELIABILITY_LABEL, type CalendarStyle } from '@/components/Fertility';
import { useContraceptionMethods, useCycleEstimates } from '@/lib/data/hooks-fertility';
import { addDays, daysBetween, formatDateFr, todayISO } from '@/lib/domain/dates';
import { avoidDayKind, currentCycleDay, type AvoidDayKind } from '@/lib/domain/cycle';
import { AVOID_DISCLAIMER, AVOID_NO_SAFE_DAYS, methodTitle } from '@/content/fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function ContraceptionScreen() {
  const t = useTheme();
  const { entries, est, windows, margin } = useCycleEstimates(4);
  const { data: methods } = useContraceptionMethods();
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const w = windows.find((x) => addDays(x.end, margin) >= today) ?? null;
  const active = (methods ?? []).filter((m) => m.active);

  const styleOf = useCallback((k: AvoidDayKind): CalendarStyle | null => {
    switch (k) {
      case 'period': return { bg: t.colors.heart, fg: '#fff', label: 'Règles saisies — une grossesse reste possible' };
      case 'next_period_estimate': return { bg: t.colors.heart + '44', label: 'Règles estimées (estimation) — une grossesse reste possible' };
      case 'ovulation_estimate': return { bg: t.colors.gold, fg: '#fff', label: 'Ovulation estimée (estimation)' };
      case 'higher_probability_estimate': return { bg: t.colors.gold + '55', label: 'Probabilité de grossesse plus élevée (estimation, avec marge)' };
      case 'pregnancy_possible': return { bg: t.colors.surfaceAlt, label: 'Autres jours : une grossesse reste possible' };
    }
  }, [t]);

  return (
    <Screen back title="Je souhaite éviter une grossesse" subtitle="Comprendre son cycle et sa contraception.">
      <Banner tone="warning" title="Une grossesse reste possible à tout moment">{AVOID_DISCLAIMER}</Banner>

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
                  <EstimateLine label="Jours où la probabilité de grossesse peut être plus élevée" value={`du ${fmt(addDays(w.start, -margin))} au ${fmt(addDays(w.end, margin))}`} />
                  <EstimateLine label="Ovulation estimée" value={`vers le ${fmt(w.ovulation)}`} />
                  <EstimateLine label="Prochaines règles estimées" value={`vers le ${fmt(w.nextPeriod)}`} />
                </>
              ) : null}
              <Text variant="small" muted>{`Une marge de ${margin} jours est ajoutée de chaque côté de la fenêtre fertile estimée${est.variability != null ? `, car vos cycles varient de ± ${num(est.variability)} j` : ''}.`}</Text>
            </View>
          ) : (
            <Text muted style={{ marginTop: spacing.xs }}>Notez la date de vos dernières règles pour afficher le calendrier.</Text>
          )}
        </Card>
      </Appear>

      <Card>
        <MonthCalendar kindOf={(d) => avoidDayKind(d, entries, windows, margin, today)} styleOf={styleOf} legend={['period', 'next_period_estimate', 'higher_probability_estimate', 'ovulation_estimate', 'pregnancy_possible']} />
        <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{AVOID_NO_SAFE_DAYS}</Text>
      </Card>

      <SectionTitle title="Ma contraception" action="Gérer" onAction={() => router.push('/contraception/reminders' as never)} />
      <Card>
        {active.length ? active.map((m) => {
          const left = m.renewal_due_on ? daysBetween(today, m.renewal_due_on) : null;
          return (
            <ListRow
              key={m.id}
              icon="shield"
              title={m.label || methodTitle(m.method)}
              subtitle={[m.started_on ? `Depuis le ${formatDateFr(m.started_on)}` : null, m.renewal_due_on ? (left != null && left < 0 ? `Date de renouvellement dépassée (${formatDateFr(m.renewal_due_on)}) : parlez-en à votre professionnel` : `À renouveler le ${formatDateFr(m.renewal_due_on)}`) : null].filter(Boolean).join(' · ') || undefined}
              onPress={() => router.push('/contraception/reminders' as never)}
            />
          );
        }) : (
          <Text muted>Aucune méthode renseignée. Vous pouvez en ajouter une et programmer vos rappels (pilule, patch, anneau, injection, renouvellement).</Text>
        )}
      </Card>

      <Card tone="gold" onPress={() => router.push('/contraception/emergency' as never)} accessibilityLabel="Contraception d’urgence : que faire ?">
        <Text weight="bold">Contraception d’urgence</Text>
        <Text variant="small">Rapport non protégé, oubli, préservatif rompu : agir vite. En pharmacie, sans ordonnance, gratuite pour toutes.</Text>
        <Button label="Que faire ?" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => router.push('/contraception/emergency' as never)} />
      </Card>

      <SectionTitle title="Mon suivi" />
      <NavCard items={[
        { icon: 'edit-3', title: 'Règles, symptômes et test de grossesse', subtitle: 'Vos saisies, à votre rythme', to: '/contraception/log' },
        { icon: 'rotate-ccw', title: 'Historique des cycles', subtitle: 'Durées de vos cycles passés', to: '/contraception/history' },
        { icon: 'bell', title: 'Ma méthode et mes rappels', subtitle: 'Pilule, patch, anneau, injection, renouvellement', to: '/contraception/reminders' },
      ]} />

      <SectionTitle title="S’informer" />
      <NavCard items={[
        { icon: 'book', title: 'Les méthodes de contraception', subtitle: 'Repères neutres et efficacité en utilisation courante', to: '/contraception/methods' },
        { icon: 'alert-circle', title: 'Contraception d’urgence', subtitle: 'Délais, où l’obtenir, à qui demander', to: '/contraception/emergency' },
        { icon: 'help-circle', title: 'Mes questions pour une consultation', subtitle: 'Une liste à garder et compléter', to: '/contraception/consultation' },
      ]} />
      <JourneyArticles journey="avoid" />
    </Screen>
  );
}
