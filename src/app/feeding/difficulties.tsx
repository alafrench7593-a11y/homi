/**
 * 76 — Journal des difficultés d'allaitement et 77 — douleurs pendant les tétées : date, sein, type de difficulté,
 * douleur 0–10, note ; reliés à la tétée notée la plus proche et montrés jour par jour avec l'historique des tétées
 * existant. Préparation des questions pour la consultante en lactation (81 : « Mes questions pour le rendez-vous »).
 * Données de la personne seulement ; aucun diagnostic.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListGroup, ListRow, Row, Segmented, Text } from '@/components/ui';
import { PainScale, WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useAddQuestions, useConsultationQuestions } from '@/lib/data/hooks-fertility';
import { useDeleteIssue, useFeedingIssues, useRecentFeeds, useSaveIssue } from '@/lib/data/hooks-feeding';
import { FeedingChildPicker, useFeedingChild } from '@/features/feeding/ui';
import { byDay, ISSUE_KINDS, issueLine, kindLabel, nearestFeed, suggestedQuestions, type FeedingIssue, type FeedLite, type IssueKind, type Side } from '@/features/feeding/issues';
import { MotionItem, MotionList } from '@/motion/ListMotion';

type SideOpt = Side | 'none';

function IssueSheet({ issue, visible, onClose, childId, feeds }: { issue: FeedingIssue | null; visible: boolean; onClose: () => void; childId: string | null; feeds: FeedLite[] }) {
  const toast = useToast();
  const save = useSaveIssue();
  const del = useDeleteIssue();
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [kind, setKind] = useState<IssueKind>('pain_only');
  const [side, setSide] = useState<SideOpt>('none');
  const [pain, setPain] = useState<number | null>(null);
  const [note, setNote] = useState('');
  React.useEffect(() => {
    if (!visible) return;
    setWhen(whenOf(issue?.at)); setKind(issue?.kind ?? 'pain_only'); setSide(issue?.side ?? 'none'); setPain(issue?.pain ?? null); setNote(issue?.note ?? '');
  }, [visible, issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  const at = whenToIso(when);
  const feed = at ? nearestFeed(feeds, at) : null;
  async function submit() {
    if (!at) return toast(tr('bfi.err.date'), 'error');
    if (Date.parse(at) > Date.now() + 60_000) return toast(tr('bfi.err.future'), 'error');
    try {
      const r = await save.mutateAsync({ ...(issue ?? {}), at, kind, side: side === 'none' ? null : side, pain, note: note.trim() || null, child_id: issue?.child_id ?? childId, breastfeed_id: feed?.id ?? null });
      toast(r === 'queued' ? tr('bfi.savedOffline') : tr('bfi.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!issue || !(await confirm(tr('bfi.delete'), tr('bfi.deleteQ'), tr('bfi.delete')))) return;
    try { await del.mutateAsync(issue.id); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={issue ? tr('bfi.edit') : tr('bfi.add')}>
      <WhenFields value={when} onChange={setWhen} days="past" testID="bfi-when" />
      {feed ? <Text variant="small" muted testID="bfi-feed">{tr('bfi.linkedFeed', { time: formatDate(feed.started_at, { hour: '2-digit', minute: '2-digit' }), side: tr(`bfi.side.${feed.side}` as TKey) })}</Text> : null}
      <Text variant="label">{tr('bfi.kind')}</Text>
      <Row wrap>{ISSUE_KINDS.map((k) => <Chip key={k} label={kindLabel(k)} selected={kind === k} onPress={() => setKind(k)} testID={`bfi-kind-${k}`} />)}</Row>
      <Segmented label={tr('bfi.side')} value={side} onChange={setSide} options={(['left', 'right', 'both', 'none'] as SideOpt[]).map((s) => ({ value: s, label: tr(`bfi.side.${s}` as TKey), testID: `bfi-side-${s}` }))} />
      <PainScale value={pain} onChange={setPain} label={tr('bfi.pain')} testID="bfi-pain" />
      <Field label={tr('bfi.note')} optional multiline maxLength={1000} value={note} onChangeText={setNote} placeholder={tr('bfi.notePh')} testID="bfi-note" />
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="bfi-save" />
      {issue ? <Button label={tr('bfi.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="bfi-delete" /> : null}
    </GlassSheet>
  );
}

export default function FeedingDifficulties() {
  const toast = useToast();
  const { children, child, setChild, loading } = useFeedingChild();
  const q = useFeedingIssues(child?.id ?? null);
  const feeds = useRecentFeeds(child?.id ?? null).data ?? [];
  // 81 : liste « consultante en lactation » (thème lactation de « Mes questions pour le rendez-vous »)
  const questions = useConsultationQuestions('general', null, 'lactation');
  const addQ = useAddQuestions('general', null, 'lactation');
  const [sheet, setSheet] = useState<{ issue: FeedingIssue | null } | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const days = useMemo(() => byDay(list, feeds), [list, feeds]);
  const existing = new Set((questions.data ?? []).map((x) => x.question));
  const suggestions = suggestedQuestions(list).filter((s) => !existing.has(s));

  async function addQuestions() {
    try {
      const start = (questions.data ?? []).reduce((m, x) => Math.max(m, x.position + 1), 0);
      await addQ.mutateAsync({ questions: suggestions, startPosition: start });
      toast(tr('bfi.q.added', { count: suggestions.length }), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }

  if (loading || (q.isLoading && !q.data)) return <Screen back title={tr('bfi.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('bfi.title')} subtitle={child ? tr('bfi.subtitle', { name: child.first_name }) : undefined} tool={false}
      action={{ label: tr('bfi.add'), icon: 'plus', onPress: () => setSheet({ issue: null }), testID: 'bfi-add' }}>
      <Text muted>{tr('bfi.intro')}</Text>
      <FeedingChildPicker list={children} value={child?.id ?? null} onChange={setChild} />
      {days.length ? days.map((d) => (
        <ListGroup key={d.day} title={formatDate(`${d.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
          footer={[tr('bfi.feedsThatDay', { count: d.feeds }), d.maxPain != null ? tr('bfi.maxPain', { pain: d.maxPain }) : null].filter(Boolean).join(' · ')} testID={`bfi-day-${d.day}`}>
          {d.issues.map((i) => (
            <ListRow key={i.id} icon="alert-circle" title={issueLine(i)}
              subtitle={[formatDate(i.at, { hour: '2-digit', minute: '2-digit' }), i.breastfeed_id ? tr('bfi.duringFeed') : null, i.note, i._pending ? tr('bfi.pending') : null].filter(Boolean).join(' · ')}
              onPress={() => setSheet({ issue: i })} testID={`bfi-row-${i.kind}`} />
          ))}
        </ListGroup>
      )) : <EmptyState icon="feather" title={tr('bfi.emptyTitle')} body={tr('bfi.emptyBody')} action={{ label: tr('bfi.add'), onPress: () => setSheet({ issue: null }) }} />}
      <Card testID="bfi-questions">
        <Text weight="bold" accessibilityRole="header">{tr('bfi.q.title')}</Text>
        <Text variant="small" muted>{tr('bfi.q.intro')}</Text>
        {(questions.data ?? []).length ? (
          <View style={{ gap: 2 }} testID="bfi-q-list">
            <Text variant="label">{tr('bfi.q.mine', { count: (questions.data ?? []).length })}</Text>
            <MotionList style={{ gap: 2 }}>{(questions.data ?? []).slice(0, 6).map((x) => <MotionItem key={x.id}><Text key={x.id} variant="small" muted={x.done} style={{ textDecorationLine: x.done ? 'line-through' : 'none' }}>• {x.question}</Text></MotionItem>)}</MotionList>
          </View>
        ) : null}
        {suggestions.length ? <Text variant="label">{tr('bfi.q.suggested')}</Text> : null}
        {suggestions.map((s) => <Text key={s} variant="small">• {s}</Text>)}
        <Row wrap>
          {suggestions.length ? <Button label={tr('bfi.q.add')} icon="plus" size="sm" loading={addQ.isPending} onPress={() => void addQuestions()} testID="bfi-q-add" /> : null}
          <Button label={tr('bfi.q.open')} icon="list" size="sm" variant="secondary" onPress={() => router.push('/consult/questions?theme=lactation')} testID="bfi-q-open" />
        </Row>
      </Card>
      <Button label={tr('bfi.feedsLink')} variant="ghost" icon="droplet" onPress={() => router.push(child ? { pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id } } : '/track/breastfeed')} testID="bfi-feeds" />
      <Banner tone="info" icon="heart">{tr('bfi.consult')}</Banner>
      <Text variant="caption" muted>{tr('bfi.private')}</Text>
      <IssueSheet issue={sheet?.issue ?? null} visible={!!sheet} onClose={() => setSheet(null)} childId={child?.id ?? null} feeds={feeds} />
    </Screen>
  );
}
