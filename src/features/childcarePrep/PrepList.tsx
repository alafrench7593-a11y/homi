/**
 * 144 / 145 — Liste éditable rattachée aux fiches : questions d'entretien (réponse notée, « posée ») ou checklist de
 * visite (point coché, note). Modèle fourni posé une fois par foyer (traduit à l'affichage), ajouts libres, retrait
 * d'une question sans perdre les réponses déjà notées. Enregistrement à la sortie du champ (file hors ligne).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, Loading, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  seedTemplate, useCandidates, useParentHousehold, usePrepAnswers, usePrepItems, useSaveAnswer, useSavePrepItem,
} from '@/lib/data/hooks-childcarePrep';
import { useInvalidate } from '@/lib/data/hooks';
import { activeItems, isStructure, progressOf, type PrepItem, type PrepKind } from './domain';
import { CandidatePicker } from './ui';

export const itemLabel = (i: PrepItem) => i.label ?? tr(`${i.kind === 'interview' ? 'gp.q' : 'gp.v'}.${i.template_key}` as TKey);

function ItemCard({ item, kind, householdId, candidateId, answer, checked }: { item: PrepItem; kind: PrepKind; householdId: string; candidateId: string; answer: string; checked: boolean }) {
  const toast = useToast();
  const save = useSaveAnswer();
  const saveItem = useSavePrepItem();
  const [text, setText] = useState(answer);
  useEffect(() => setText(answer), [answer, candidateId]);
  const label = itemLabel(item);
  async function persist(patch: { answer?: string | null; checked?: boolean }) {
    try { await save.mutateAsync({ household_id: householdId, candidate_id: candidateId, item_id: item.id, answer: text.trim() || null, checked, ...patch }); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function archive() {
    if (!(await confirm(tr('gp.iv.remove'), tr('gp.iv.removeQ'), tr('gp.iv.remove')))) return;
    try { await saveItem.mutateAsync({ ...item, archived: true }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const tag = item.template_key ?? item.id.slice(0, 8);
  return (
    <Card testID={`gp-item-${tag}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
        <Text weight="bold" style={{ flex: 1 }}>{label}</Text>
        <IconButton icon="x" label={`${tr('gp.iv.remove')} : ${label}`} onPress={() => void archive()} testID={`gp-item-remove-${tag}`} />
      </View>
      <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Chip label={kind === 'interview' ? tr('gp.iv.asked') : tr('gp.vs.checked')} icon={checked ? undefined : 'square'} selected={checked}
            accessibilityLabel={tr('gp.vs.checkA11y', { label, state: checked ? (kind === 'interview' ? tr('gp.iv.asked') : tr('gp.vs.checked')) : tr('gp.vs.unchecked') })}
            onPress={() => void persist({ checked: !checked })} testID={`gp-item-check-${tag}`} />
        </View>
        <Field label={kind === 'interview' ? tr('gp.iv.answer') : tr('gp.vs.note')} optional value={text} onChangeText={setText} maxLength={1000} multiline
          placeholder={kind === 'interview' ? tr('gp.iv.answerPh') : tr('gp.vs.notePh')}
          onBlur={() => { if (text.trim() !== answer.trim()) void persist({}); }} testID={`gp-item-answer-${tag}`} />
      </View>
    </Card>
  );
}

export function PrepListScreen({ kind }: { kind: PrepKind }) {
  const params = useLocalSearchParams<{ c?: string }>();
  const toast = useToast();
  const inv = useInvalidate();
  const { householdId, loading } = useParentHousehold();
  const cands = useCandidates(householdId);
  const itemsQ = usePrepItems(householdId);
  const answers = usePrepAnswers(householdId).data ?? [];
  const saveItem = useSavePrepItem();
  const [picked, setPicked] = useState<string | null>(typeof params.c === 'string' ? params.c : null);
  const [newLabel, setNewLabel] = useState('');
  const seeding = useRef(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const allItems = useMemo(() => itemsQ.data ?? [], [itemsQ.data]);
  const items = useMemo(() => activeItems(allItems, kind), [allItems, kind]);
  const list = useMemo(() => (cands.data ?? []).filter((c) => c.status !== 'dismissed'), [cands.data]);
  const fallback = list.find((c) => (kind === 'visit' ? isStructure(c.kind) : !isStructure(c.kind))) ?? list[0];
  const candidateId = picked && list.some((c) => c.id === picked) ? picked : fallback?.id ?? null;
  const title = kind === 'interview' ? tr('gp.tool.interview') : tr('gp.tool.visit');

  // Modèle fourni : posé une seule fois pour le foyer (rien si une question de ce type existe déjà)
  useEffect(() => {
    if (!householdId || !itemsQ.data || seeding.current || itemsQ.data.some((i) => i.kind === kind)) return;
    seeding.current = true;
    setSeedBusy(true);
    seedTemplate(householdId, kind, itemsQ.data).then(() => inv('childcare_prep_items')).catch((e) => toast(friendlyError(e), 'error')).finally(() => setSeedBusy(false));
  }, [householdId, itemsQ.data, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  async function add() {
    if (!householdId || !newLabel.trim()) return;
    const pos = items.reduce((m, i) => Math.max(m, i.position), 0) + 10;
    try { await saveItem.mutateAsync({ household_id: householdId, kind, label: newLabel.trim().slice(0, 200), position: pos, archived: false }); setNewLabel(''); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function restore() {
    try {
      for (const i of allItems.filter((x) => x.kind === kind && x.archived && x.template_key)) await saveItem.mutateAsync({ ...i, archived: false });
      if (householdId) await seedTemplate(householdId, kind, allItems);
      inv('childcare_prep_items');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (loading || (itemsQ.isLoading && !itemsQ.data)) return <Screen back title={title} tool={false}><Skeleton rows={4} /></Screen>;
  if (!householdId) return <Screen back title={title} tool={false}><EmptyState icon="lock" title={tr('gp.parentOnly')} body={tr('gp.parentOnlyBody')} /></Screen>;
  const prog = candidateId ? progressOf(allItems, answers, candidateId, kind) : null;
  const hasArchived = allItems.some((x) => x.kind === kind && x.archived && x.template_key);
  return (
    <Screen back title={title} subtitle={kind === 'interview' ? tr('gp.iv.intro') : tr('gp.vs.intro')} tool={false}>
      {!list.length ? (
        <EmptyState icon="users" title={tr('gp.cand.emptyTitle')} body={tr('gp.iv.noCandidate')} action={{ label: tr('gp.cand.add'), onPress: () => router.push('/garde/prep/candidats?new=1' as never) }} />
      ) : (
        <>
          <CandidatePicker list={list} value={candidateId} onChange={setPicked} />
          {prog ? <Text muted testID="gp-prep-progress">{tr(kind === 'interview' ? 'gp.iv.progress' : 'gp.vs.progress', prog)}</Text> : null}
        </>
      )}
      {seedBusy && !items.length ? <Loading label={tr('gp.iv.preparing')} /> : null}
      {candidateId ? items.map((i) => {
        const a = answers.find((x) => x.candidate_id === candidateId && x.item_id === i.id);
        return <ItemCard key={`${candidateId}-${i.id}`} item={i} kind={kind} householdId={householdId} candidateId={candidateId} answer={a?.answer ?? ''} checked={!!a?.checked} />;
      }) : null}
      <Card tone="soft">
        <Field label={kind === 'interview' ? tr('gp.iv.newLabel') : tr('gp.vs.newLabel')} value={newLabel} onChangeText={setNewLabel} maxLength={200}
          placeholder={kind === 'interview' ? tr('gp.iv.newPh') : tr('gp.vs.newPh')} onSubmitEditing={() => void add()} returnKeyType="done" testID="gp-prep-new" />
        <Button label={kind === 'interview' ? tr('gp.iv.add') : tr('gp.vs.add')} icon="plus" variant="secondary" disabled={!newLabel.trim()} loading={saveItem.isPending}
          style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => void add()} testID="gp-prep-add" />
      </Card>
      {hasArchived ? <Button label={tr('gp.iv.restore')} variant="ghost" icon="rotate-ccw" onPress={() => void restore()} testID="gp-prep-restore" /> : null}
      <Banner tone="info" icon="lock">{tr('gp.privacy')}</Banner>
    </Screen>
  );
}
