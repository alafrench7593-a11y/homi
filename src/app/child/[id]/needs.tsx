/**
 * Neurodéveloppement et besoins particuliers d'un enfant.
 *  - Catégories : TDAH, TSA, troubles DYS, langage, TDC, tics et Gilles de la Tourette, sensoriel, diagnostic en cours, autre.
 *  - Suivi : rendez-vous, bilans, professionnels, observations, progrès, émotions, sommeil, routines, école ; documents.
 *  - Traitements prescrits : recopiés EXACTEMENT de l'ordonnance (nom, dose, heures, fréquence, dates, instructions),
 *    rappels avec « Pris », « Reporter », « Ignorer », « Ajouter une note ».
 * L'application ne calcule jamais une dose, ne modifie pas un traitement et ne pose aucun diagnostic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, ListRow, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useTheme } from '@/theme/ThemeProvider';
import { dosesFor, needLabel } from '@/features/needs';
import { TreatmentsPanel } from '@/features/treatments/TreatmentsPanel';
import { useChild, useChildren, useMemberships } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { NEURO_ARTICLES, NEURO_UPDATED_ON, type NeuroTopic } from '@/content/articles/neuro';
import { useUiStore } from '@/lib/store';
import {
  ADVANCED_NEED_KINDS, ENTRY_KINDS, MAIN_NEED_KINDS, useAddNeedEntry, useChildNeeds, useDeleteNeedEntry, useDeleteTreatment, useLogDose, useNeedEntries, useSaveNeeds, useSaveTreatment,
  useTreatmentLogs, useTreatments, type EntryKind, type NeedKind, type Treatment,
} from '@/lib/data/hooks-needs';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { snoozeLocally } from '@/lib/notifications';
import { toFrDate } from '@/lib/validation';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Tab = 'forYou' | 'profile' | 'follow' | 'treatments';
const FOR_YOU: Tab = 'forYou';

/** Sujets d'articles mis en avant selon ce que le parent a coché (tous les articles restent accessibles à tous). */
const TOPICS: Record<NeedKind, NeuroTopic[]> = {
  adhd: ['adhd', 'daily', 'school', 'emotions', 'sleep', 'appointment', 'parents'],
  asd: ['autism', 'sensory', 'food', 'daily', 'school', 'mdph', 'parents'],
  dys: ['dys', 'school', 'mdph', 'daily'],
  language: ['language', 'professionals', 'appointment'],
  sensory: ['sensory', 'food', 'sleep', 'emotions'],
  other: ['who', 'appointment', 'professionals', 'parents'],
  questions: ['signs', 'who', 'appointment', 'professionals', 'not_alone'],
  dcd: ['who', 'professionals', 'school', 'daily'],
  tics: ['who', 'professionals', 'emotions', 'school'],
  assessment: ['appointment', 'professionals', 'mdph', 'not_alone'],
};
const PRACTICAL: NeuroTopic[] = ['daily', 'sleep', 'food', 'emotions', 'appointment', 'parents'];

export default function ChildNeeds() {
  const params = useLocalSearchParams<{ id: string; tab?: Tab; dose?: string; time?: string }>();
  const child = useChild(params.id);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const simple = useUiStore((st) => st.simpleMode);
  const { data: needs } = useChildNeeds(params.id);
  const [tab, setTab] = useState<Tab | null>(params.tab === 'treatments' || params.tab === 'follow' || params.tab === 'profile' || params.tab === 'forYou' ? params.tab : null);
  const { data: treatments } = useTreatments(params.id);
  const active = useMemo(() => (treatments ?? []).filter((x) => x.active), [treatments]);
  const dayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }, []);
  const { data: todayLogs } = useTreatmentLogs(active.map((x) => x.id), dayStart);
  const todayDoses = useMemo(() => dosesFor(new Date(), active, todayLogs ?? []), [active, todayLogs]);
  if (!child) {
    return (
      <Screen back title={tr('nd.title')}>
        {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('common.cannotShow')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('alb.notFound')}
            body={tr('cm2.member.notFoundBody')}
            action={{ label: tr('pj.blocked.home'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  const current: Tab = tab ?? (needs?.kinds.length ? 'forYou' : 'profile');
  return (
    <Screen back title={tr('nd.title')} subtitle={child.first_name}>
      <TodaySummary title={tr('mb.nd.title')} items={[
        { icon: 'list', value: String(needs?.kinds.length ?? 0), label: tr('mb.nd.kinds') },
        { icon: 'clipboard', value: String(active.length), label: tr('mb.nd.treatments') },
        { icon: 'check', value: todayDoses.length ? `${todayDoses.filter((x) => x.log?.status === 'taken').length}/${todayDoses.length}` : '—', label: tr('mb.nd.doses') },
      ]} />
      <Banner tone="info">{tr('nd.disclaimer')}</Banner>
      <Segmented label={tr('nd.title')} value={current} onChange={setTab} options={[
        { value: 'forYou', label: tr('nd.tab.forYou') }, { value: 'profile', label: tr('nd.tab.profile') },
        ...(!simple || current === 'follow' ? [{ value: 'follow' as Tab, label: tr('nd.tab.follow') }] : []),
        { value: 'treatments', label: tr('nd.tab.treatments') },
      ]} />
      {current === FOR_YOU && <ForYou childId={child.id} childName={child.first_name} kinds={needs?.kinds ?? []} onPickCategories={() => setTab('profile')} onTreatments={() => setTab('treatments')} />}
      {current === 'profile' && <NeedsProfile childId={child.id} />}
      {current === 'follow' && <FollowUp childId={child.id} />}
      {current === 'treatments' && <TreatmentsPanel scope={{ kind: 'child', childId: child.id, childName: child.first_name }} noteDose={params.dose} askTime={params.time} />}
    </Screen>
  );
}

// ---------------------------------------------------------------- pour vous
function ForYou({ childId, childName, kinds, onPickCategories, onTreatments }: { childId: string; childName: string; kinds: NeedKind[]; onPickCategories: () => void; onTreatments: () => void }) {
  const topics = [...new Set(kinds.flatMap((k) => TOPICS[k] ?? []))];
  const chosen = topics.map((tp) => NEURO_ARTICLES.find((a) => a.topic === tp)).filter((a): a is (typeof NEURO_ARTICLES)[number] => !!a);
  const articles = chosen.filter((a) => !PRACTICAL.includes(a.topic));
  const tips = chosen.filter((a) => PRACTICAL.includes(a.topic));
  const row = (a: (typeof NEURO_ARTICLES)[number]) => (
    <View key={a.slug} testID={`neuro-${a.topic}`}>
      <ListRow icon="book-open" title={a.title} subtitle={tr('nd.article.meta', { date: formatDateFr(NEURO_UPDATED_ON), status: tr('nd.article.toReview'), count: a.sources.length })} onPress={() => router.push(`/article/${a.slug}` as never)} />
    </View>
  );
  return (
    <View style={{ gap: spacing.sm }}>
      {!kinds.length ? (
        <Card><Text>{tr('nd.forYou.none')}</Text><Button label={tr('nd.tab.profile')} size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={onPickCategories} /></Card>
      ) : <Text muted>{tr('nd.forYou.intro')}</Text>}
      {articles.length ? <><SectionTitle title={tr('nd.forYou.articles')} /><Card>{articles.map(row)}</Card></> : null}
      {tips.length ? <><SectionTitle title={tr('nd.forYou.tips')} /><Card>{tips.map(row)}</Card></> : null}
      <Card>
        <ListRow icon="calendar" title={tr('nd.forYou.appointments', { name: childName })} onPress={() => router.push(`/appointments?child=${childId}`)} />
        <View testID="neuro-medication"><ListRow icon="bell" title={tr('nd.forYou.medication')} subtitle={tr('nd.forYou.medicationHint')} onPress={onTreatments} /></View>
        <ListRow icon="compass" title={tr('nd.forYou.all')} onPress={() => router.push({ pathname: '/library', params: { cat: 'neurodeveloppement' } })} />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------- catégories
function NeedsProfile({ childId }: { childId: string }) {
  const toast = useToast();
  const { data: needs, isLoading } = useChildNeeds(childId);
  const save = useSaveNeeds();
  const [kinds, setKinds] = useState<NeedKind[]>([]);
  const [other, setOther] = useState('');
  const [notes, setNotes] = useState('');
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => { if (needs) { setKinds(needs.kinds); setOther(needs.other_label ?? ''); setNotes(needs.notes ?? ''); } }, [needs]);
  if (isLoading) return <Skeleton rows={3} />;
  const toggle = (k: NeedKind) => setKinds((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  return (
    <View style={{ gap: spacing.sm }}>
      <Text muted>{tr('nd.profile.intro')}</Text>
      <View testID="needs-kinds"><Row wrap>
        {MAIN_NEED_KINDS.map((k) => <Chip key={k} label={needLabel(k)} selected={kinds.includes(k)} onPress={() => { haptic('selection'); toggle(k); }} accessibilityLabel={needLabel(k)} />)}
        {(advanced || kinds.some((k) => (ADVANCED_NEED_KINDS as readonly string[]).includes(k))) ? ADVANCED_NEED_KINDS.map((k) => <Chip key={k} label={needLabel(k)} selected={kinds.includes(k)} onPress={() => { haptic('selection'); toggle(k); }} accessibilityLabel={needLabel(k)} />) : null}
      </Row></View>
      {!advanced && !kinds.some((k) => (ADVANCED_NEED_KINDS as readonly string[]).includes(k)) ? <Button label={tr('nd.advanced')} variant="ghost" size="sm" onPress={() => setAdvanced(true)} /> : null}
      {kinds.includes('other') ? <Field label={tr('nd.profile.other')} value={other} onChangeText={setOther} maxLength={80} /> : null}
      <Field label={tr('nd.profile.notes')} optional value={notes} onChangeText={setNotes} multiline maxLength={4000} hint={tr('nd.profile.notesHint')} />
      <Button label={tr('common.save')} loading={save.isPending} testID="needs-save" onPress={async () => {
        try { await save.mutateAsync({ id: needs?.id, child_id: childId, kinds, other_label: kinds.includes('other') ? other.trim() || null : null, notes: notes.trim() || null }); toast(tr('nd.saved'), 'success'); }
        catch (e) { toast(friendlyError(e), 'error'); }
      }} />
      <Text variant="caption" muted>{tr('nd.profile.private')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- suivi
function FollowUp({ childId }: { childId: string }) {
  const toast = useToast();
  const [filter, setFilter] = useState<EntryKind | null>(null);
  const entriesQ = useNeedEntries(childId, filter);
  const { data: entries, isLoading } = entriesQ;
  const add = useAddNeedEntry();
  const del = useDeleteNeedEntry();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EntryKind>('observation');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const iso = frToISO(date);
    if (!title.trim()) { setErr(tr('nd.entry.errTitle')); return; }
    if (!iso) { setErr(tr('pj.start.err.format')); return; }
    try {
      await add.mutateAsync({ child_id: childId, kind, title: title.trim(), body: body.trim() || null, occurred_on: iso });
      setOpen(false); setTitle(''); setBody(''); setErr(null);
      toast(tr('nd.saved'), 'success');
    } catch (e) { setErr(friendlyError(e)); }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Row wrap>
        <Chip label={tr('nd.entry.all')} selected={!filter} onPress={() => setFilter(null)} />
        {ENTRY_KINDS.map((k) => <Chip key={k} label={tr(`nd.entry.${k}` as TKey)} selected={filter === k} onPress={() => setFilter(filter === k ? null : k)} />)}
      </Row>
      <Button label={tr('nd.entry.add')} icon="plus" onPress={() => { setKind(filter ?? 'observation'); setOpen(true); }} testID="entry-add" />
      <Card>
        <ListRow icon="calendar" title={tr('tool.appointments')} onPress={() => router.push(`/appointments?child=${childId}`)} />
        <ListRow icon="folder" title={tr('tool.documents')} subtitle={tr('nd.docsHint')} onPress={() => router.push(`/documents?child=${childId}`)} />
      </Card>
      {isLoading && !entries ? <Skeleton rows={3} /> : entriesQ.isError && !entries ? (
        <ErrorView error={entriesQ.error} onRetry={() => void entriesQ.refetch()} />
      ) : !entries?.length ? <EmptyState icon="list" title={tr('nd.entry.none')} /> : (
        <Card>
          {entries.map((e) => (
            <ListRow key={e.id} icon="file-text" title={e.title} subtitle={`${tr(`nd.entry.${e.kind}` as TKey)} · ${formatDateFr(e.occurred_on)}${e.body ? ` · ${e.body}` : ''}`}
              onPress={async () => { if (await confirm(tr('nd.entry.deleteTitle'), e.title, tr('common.delete'))) await del.mutateAsync(e.id).catch((err) => toast(friendlyError(err), 'error')); }} />
          ))}
        </Card>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('nd.entry.add')}>
        {err ? <Banner tone="danger">{err}</Banner> : null}
        <Row wrap>{ENTRY_KINDS.map((k) => <Chip key={k} label={tr(`nd.entry.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} />)}</Row>
        <Field label={tr('nd.entry.title')} value={title} onChangeText={setTitle} maxLength={120} testID="entry-title" />
        <Field label={tr('nd.entry.date')} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
        <Field label={tr('nd.entry.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} />
        <Button label={tr('common.save')} loading={add.isPending} onPress={() => save()} testID="entry-save" />
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- traitements
// Panneau partagé avec l'écran « Médicaments » (07/11/2026) : src/features/treatments/TreatmentsPanel.tsx
