/**
 * 51 — Calendrier de récupération post-partum · 57 — Préparation des rendez-vous postnataux (dans « Mon plan de
 * soutien », /postpartum/support?focus=postnatal).
 * Le calendrier = les rendez-vous postnataux et de rééducation SAISIS par la personne (aucun calendrier médical n'est
 * proposé ni inventé), situés par rapport à la naissance (« 6 semaines après la naissance ») ; la liste de questions
 * postnatales réutilise « Mes questions pour le rendez-vous » (thème « postnatal ») et se copie dans le prochain
 * rendez-vous en un geste.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ConsultationChecklist } from '@/components/Fertility';
import { useToast } from '@/components/Overlays';
import { Button, ListGroup, ListRow, SectionTitle, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useAppointments, useChildren } from '@/lib/data/hooks';
import { useConsultationQuestions } from '@/lib/data/hooks-fertility';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useInvalidate } from '@/lib/data/hooks';
import { insertOrQueue } from '@/lib/offline';
import { QUESTION_SUGGESTIONS } from '@/content/fertility';
import { spacing } from '@/theme/tokens';
import { postnatalTimeline, questionsToCopy } from './domain';

const WHEN = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } as const;

export function PostnatalPlan() {
  const toast = useToast();
  const inv = useInvalidate();
  const appts = useAppointments().data;
  const children = useChildren().data ?? [];
  const birth = children[0]?.birth_date ?? null; // enfant le plus jeune (tri par date de naissance décroissante)
  const tl = useMemo(() => postnatalTimeline(appts ?? [], birth), [appts, birth]);
  const qs = useConsultationQuestions('postpartum', null, 'postnatal', true).data ?? [];
  const next = tl.upcoming[0] ?? null;
  const toCopy = next ? questionsToCopy(qs, next.appt.questions) : [];

  async function copyQuestions() {
    if (!next || !toCopy.length) return;
    try {
      const r = await insertOrQueue('appointments', { ...next.appt, questions: [...next.appt.questions, ...toCopy].slice(0, 40) }, { conflict: 'id', merge: true });
      void inv('appointments');
      toast(r === 'queued' ? tr('pn.copiedOffline', { count: toCopy.length }) : tr('pn.copied', { count: toCopy.length }), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }

  const row = (x: (typeof tl.upcoming)[number], past: boolean) => (
    <ListRow key={x.appt.id} icon={x.appt.kind === 'perineal_rehab' ? 'feather' : 'heart'} title={x.appt.title}
      subtitle={[formatDate(x.appt.starts_at, WHEN), x.weeksAfterBirth != null ? tr('pn.weeksAfter', { count: x.weeksAfterBirth }) : null,
        x.appt.questions.length ? tr('pn.questionsIn', { count: x.appt.questions.length }) : null, past && x.appt.completed_at ? tr('pn.done') : null].filter(Boolean).join(' · ')}
      onPress={() => router.push('/appointments?all=1')} testID={`pn-appt-${x.appt.id}`} />
  );

  return (
    <View style={{ gap: spacing.sm }} testID="pn-plan">
      <SectionTitle title={tr('pn.title')} action={tr('pn.add')} onAction={() => router.push('/appointments?new=postnatal' as never)} />
      <Text variant="small" muted>{tr('pn.intro')}</Text>
      {tl.upcoming.length ? <ListGroup title={tr('pn.upcoming')} testID="pn-upcoming">{tl.upcoming.map((x) => row(x, false))}</ListGroup> : (
        <Text variant="small" muted testID="pn-none">{tr('pn.none')}</Text>
      )}
      {next && toCopy.length ? (
        <Button label={tr('pn.copy', { count: toCopy.length, title: next.appt.title })} icon="copy" size="sm" variant="secondary" onPress={() => void copyQuestions()} testID="pn-copy" />
      ) : null}
      {tl.past.length ? <ListGroup title={tr('pn.past')} testID="pn-past">{tl.past.slice(0, 8).map((x) => row(x, true))}</ListGroup> : null}
      <Button label={tr('pn.addLong')} icon="plus" size="sm" variant="ghost" onPress={() => router.push('/appointments?new=postnatal' as never)} testID="pn-add" />
      <SectionTitle title={tr('pn.qTitle')} />
      <Text variant="small" muted>{tr('pn.qIntro')}</Text>
      <ConsultationChecklist journey="postpartum" theme="postnatal" withUnthemed suggestions={QUESTION_SUGGESTIONS.postpartum} testID="pn-questions" />
    </View>
  );
}
