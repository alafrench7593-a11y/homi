/**
 * Récapitulatif après une saisie (rapport, douleur, pertes, saignement) : ce qui a été enregistré, puis les conseils
 * adaptés à CETTE saisie. Les données sont déjà enregistrées avant l'affichage (aucune animation ne retarde l'enregistrement).
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { Button } from '@/components/ui';
import { useAllSymptomLogs, useBleedingLogs, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { useIntercourseLogs } from '@/lib/data/hooks-fertility';
import { forEvent } from '@/lib/advice/engine';
import type { EventType } from '@/lib/advice/types';
import { useUiStore } from '@/lib/store';
import { AdviceCard, editHref } from '@/features/cycle/AdviceCard';
import { useDischargeLabels } from '@/features/cycle/discharge';
import { useAdvice } from '@/features/cycle/useAdvice';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette, type CycleIconName } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const ICON: Record<string, CycleIconName> = { sex: 'privacy', pain: 'pain', discharge: 'discharge', bleeding: 'bleeding' };

export default function RecapScreen() {
  const c = useCyclePalette();
  const { type, id } = useLocalSearchParams<{ type: EventType; id: string }>();
  const sex = useIntercourseLogs(200);
  const sym = useAllSymptomLogs();
  const dis = useDischargeLogs(200);
  const ble = useBleedingLogs();
  const { all } = useAdvice();
  const markSeen = useUiStore((s) => s.markAdviceSeen);
  const D = useDischargeLabels();
  const advice = forEvent(all, type, id);
  useEffect(() => { if (advice.length) markSeen(advice.map((a) => a.signature)); }, [advice.map((a) => a.signature).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  let date: string | null = null;
  const lines: string[] = [];
  if (type === 'sex') {
    const e = sex.data?.find((x) => x.id === id);
    if (e) {
      date = e.occurred_on;
      if (e.occurred_time) lines.push(tr('cy.recap.time', { time: e.occurred_time.slice(0, 5) }));
      const add = (q: string, v: string | null | undefined, g?: string) => { if (v) lines.push(`${tr(q as TKey)} : ${g ? tr(`cy.sex.${g}.${v}` as TKey) : tr(`cy.ans.${v}` as TKey)}`); };
      add('cy.sex.condomQ', e.condom); add('cy.sex.condomIncidentQ', e.condom_incident, 'condom_incident'); add('cy.sex.contraQ', e.usual_contraception);
      add('cy.sex.contraIncidentQ', e.contraception_incident, 'contra_incident'); add('cy.sex.ecQ', e.ec_taken); add('cy.sex.wishQ', e.pregnancy_wish);
      if (!lines.length) lines.push(tr('cy.recap.noDetail'));
    }
  } else if (type === 'pain') {
    const e = sym.data?.find((x) => x.id === id);
    if (e) {
      date = e.logged_on;
      lines.push(tr('adv.trig.pain_level', { n: e.pain_intensity ?? 0 }));
      if (e.pain_locations?.length) lines.push(e.pain_locations.map((z) => tr(`cy.pain.zone.${z}` as TKey)).join(', '));
      if (e.pain_pattern) lines.push(tr(`cy.pain.pattern.${e.pain_pattern}` as TKey));
      const imp = (e.pain_impact ?? []).filter((x) => x !== 'none');
      if (imp.length) lines.push(imp.map((x) => tr(`cy.pain.impact.${x}` as TKey)).join(', '));
      if (e.pain_associated?.length) lines.push(e.pain_associated.map((x) => tr(`cy.pain.assoc.${x}` as TKey)).join(', '));
    }
  } else if (type === 'discharge') {
    const e = dis.data?.find((x) => x.id === id);
    if (e) { date = e.observed_at.slice(0, 10); lines.push(D.summary(e) || tr('cy.dis.noDetail')); }
  } else if (type === 'bleeding') {
    const e = ble.data?.find((x) => x.id === id);
    if (e) { date = e.occurred_on; lines.push(tr(`cy.bl.kind.${e.kind}` as TKey)); if (e.amount) lines.push(tr(`cy.bl.amount.${e.amount}` as TKey)); }
  }
  const loading = !date && [sex, sym, dis, ble].some((q) => q.isLoading);

  return (
    <Screen back title={tr('cy.recap.title')} subtitle={tr('cy.recap.subtitle')}>
      {loading ? <Skeleton kind="card" rows={2} /> : null}
      {date ? (
        <Rise>
          <Glass>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.lavender, alignItems: 'center', justifyContent: 'center' }}>
                <CycleIcon name={ICON[type] ?? 'cycle'} color={c.mauve} />
              </View>
              <View style={{ flex: 1 }}>
                <Ink weight="bold">{tr('cy.recap.saved')}</Ink>
                <Ink variant="small" soft>{fmtDayYear(date)}</Ink>
              </View>
            </View>
            {lines.map((l, i) => <Rise key={l} delay={80 + i * 40}><Ink variant="small">{`• ${l}`}</Ink></Rise>)}
          </Glass>
        </Rise>
      ) : null}
      {date && !advice.length ? <Glass><Ink>{tr('cy.recap.noAdvice')}</Ink></Glass> : null}
      {advice.map((a, i) => <AdviceCard key={a.signature} advice={a} delay={160 + i * 80} />)}
      <View style={{ gap: spacing.xs }}>
        {date ? <Button label={tr('adv.action.edit')} variant="secondary" onPress={() => router.replace((advice[0] ? editHref(advice[0]) : type === 'pain' ? `/cycle/pain?date=${date}` : type === 'sex' ? `/cycle/intimacy?id=${id}` : type === 'discharge' ? `/cycle/discharge/${id}` : `/cycle/bleeding?id=${id}`) as never)} full /> : null}
        <Button label={tr('cy.recap.back')} variant="ghost" onPress={() => router.replace('/cycle?all=1' as never)} full />
      </View>
    </Screen>
  );
}
