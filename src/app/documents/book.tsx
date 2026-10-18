/**
 * Carnet de santé numérique : une vue ORGANISÉE des documents réellement enregistrés, par profil.
 * Rien n'est inventé ni déduit : une rubrique vide le dit. Chaque information garde son statut
 * (extraite automatiquement, vérifiée par vous, confirmée par un professionnel avec sa source).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Chip, Row, SectionTitle, Text } from '@/components/ui';
import { useActivePregnancy, useChildren, useDocuments, useRows } from '@/lib/data/hooks';
import { useHouseholdExtractions } from '@/lib/data/hooks-documents';
import { useUserId } from '@/lib/auth';
import { eq } from '@/lib/backend';
import { BOOK_SECTIONS } from '@/lib/documents/taxonomy';
import { DocCard, Badge, sameSubject, subjectLabel, subjectOf, type Subject } from '@/features/documents';
import type { DocumentRow, Reminder } from '@/lib/types';
import { formatDate, formatTime, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

const TO_VERIFY = 'toVerify';

export default function HealthBook() {
  const userId = useUserId();
  const docsQ = useDocuments();
  const { data: kids } = useChildren();
  const pregnancy = useActivePregnancy();
  const exQ = useHouseholdExtractions();
  const remQ = useRows<Reminder>(['reminders', 'documents-book'], userId ? { table: 'reminders', filters: [eq('user_id', userId)] } : null);
  const [subject, setSubject] = useState<Subject>({ kind: 'me' });
  const subjects: Subject[] = [{ kind: 'me' }, ...(kids ?? []).map((c) => ({ kind: 'child' as const, id: c.id })), ...(pregnancy ? [{ kind: 'pregnancy' as const, id: pregnancy.id }] : [])];

  const mine = useMemo(() => (docsQ.data ?? []).filter((d) => sameSubject(subjectOf(d), subject)), [docsQ.data, subject]);
  const active = mine.filter((d) => !d.archived);
  const statusOf = (d: DocumentRow) => exQ.data?.find((x) => x.document_id === d.id && x.kind === 'fields') ?? null;
  const reminders = (remQ.data ?? []).filter((r) => r.deep_link?.startsWith('/documents/') && mine.some((d) => r.deep_link === `/documents/${d.id}`) && r.schedule.type === 'once');
  const open = (d: DocumentRow) => router.push(`/documents/${d.id}`);

  const section = (key: string, list: DocumentRow[], extra?: (d: DocumentRow) => React.ReactNode) => (
    <View key={key} style={{ gap: spacing.xs }}>
      <SectionTitle title={tr(`docs.book.${key}` as 'docs.book.recent')} />
      {list.length ? list.map((d) => (
        <View key={d.id} style={{ gap: 4 }}>
          <DocCard doc={d} children={kids} onPress={() => open(d)} />
          {extra?.(d)}
        </View>
      )) : <Text variant="small" muted>{tr('docs.book.empty')}</Text>}
    </View>
  );

  const loading = docsQ.isLoading && !docsQ.data;
  return (
    <Screen back title={tr('docs.book.title')} subtitle={tr('docs.book.subtitle')}>
      <View accessibilityRole="radiogroup">
        <Row wrap gap={6}>
          {subjects.map((s) => <Chip key={s.kind + ((s as { id?: string }).id ?? '')} label={subjectLabel(s, kids)} icon={s.kind === 'me' ? 'user' : s.kind === 'child' ? 'smile' : 'moon'} selected={sameSubject(s, subject)} onPress={() => setSubject(s)} />)}
        </Row>
      </View>
      <Banner tone="info" icon="info">{tr('docs.book.notice')}</Banner>
      {loading ? <Skeleton rows={4} /> : docsQ.isError ? <ErrorView error={docsQ.error} onRetry={() => void docsQ.refetch()} /> : (
        <Appear kind="soft" delay={0.04}>
          <View style={{ gap: spacing.lg }}>
            <Card tone="soft">
              <Text weight="bold">{tr('docs.book.countFor', { who: subjectLabel(subject, kids), count: active.length })}</Text>
              <Text variant="small" muted>{tr('docs.book.toVerifyCount', { count: active.filter((d) => d.review_status === 'to_verify').length })}</Text>
            </Card>
            {section('recent', active.slice(0, 4))}
            {section('favorites', active.filter((d) => d.favorite))}
            {BOOK_SECTIONS.map((s) => section(s.key, active.filter((d) => s.cats.includes(d.category)), (d) => {
              const ex = statusOf(d);
              if (s.key === 'prescriptions') {
                const current = !!(ex?.fields as { currentTreatment?: boolean } | undefined)?.currentTreatment;
                return <Row gap={6}><Badge icon="clipboard" tone={current ? 'success' : undefined} label={current ? tr('docs.rx.current') : tr('docs.rx.archived')} /></Row>;
              }
              if (s.key === 'vaccinations' || s.key === 'results') {
                return <Row gap={6}><Badge icon={ex && ex.status !== 'to_verify' ? 'check-circle' : 'cpu'} tone={ex && ex.status !== 'to_verify' ? 'success' : 'warning'} label={tr(`docs.status.${ex?.status ?? 'to_verify'}` as 'docs.status.to_verify')} /></Row>;
              }
              return null;
            }))}
            <View style={{ gap: spacing.xs }}>
              <SectionTitle title={tr('docs.book.deadlines')} />
              {reminders.length ? reminders.map((r) => (
                <Card key={r.id} onPress={() => router.push(r.deep_link as never)}>
                  <Text weight="medium">{r.title}</Text>
                  <Text variant="caption" muted>{r.schedule.type === 'once' ? `${formatDate(r.schedule.at)} · ${formatTime(r.schedule.at)}` : ''}{r.enabled ? '' : ` · ${tr('docs.book.disabled')}`}</Text>
                </Card>
              )) : <Text variant="small" muted>{tr('docs.book.noDeadlines')}</Text>}
            </View>
            {section(TO_VERIFY, active.filter((d) => d.review_status === 'to_verify'))}
            {section('archived', mine.filter((d) => d.archived))}
          </View>
        </Appear>
      )}
    </Screen>
  );
}
