/**
 * Mes questions pour le rendez-vous (22/11/2026) — mini-app d'après la direction artistique du client :
 *  · UNE donnée en grand : les questions à poser (« Rien de noté » en pointillé s'il n'y en a aucune, jamais 0) ;
 *    posées / avec réponse juste dessous ; prochain rendez-vous du même profil ;
 *  · liste : coche (posée / à poser) en colonne fixe à gauche, question + réponse ou rendez-vous, chevron ;
 *  · fiche dans le Tray (gabarit `HmFixTray`) : corriger la question, la marquer posée, noter la réponse, la partager
 *    avec le foyer, la supprimer — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé contre le double appui ;
 *  · « Remonter au rendez-vous » : les questions à poser rejoignent `appointments.questions` du prochain rendez-vous
 *    (lien qui existe déjà dans la donnée), sans doublon ;
 *  · une seule action principale : « Ajouter une question ».
 * Écritures : mêmes tables et mêmes chemins que la liste historique (`ConsultationChecklist`).
 */
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckMark } from '@/motion/CheckMark';
import { GlassButton, GlassSheet } from '@/components/glass';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { confirm, useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { Card, Field, haptic, Icon, ListGroup, ListRow, Text } from '@/components/ui';
import { HmFixTray, HmHero, type HmDraft } from '@/features/homeTrack/kit';
import { QUESTION_SUGGESTIONS } from '@/content/fertility';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useAppointments, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { useAddQuestions, useConsultationQuestions, useShareQuestion } from '@/lib/data/hooks-fertility';
import { friendlyError } from '@/lib/data/hooks-settings';
import { inAppointment, mergeIntoAppointment, nextAppointmentFor, questionCounts, questionKey, validateQuestion } from '@/lib/domain/readTrack';
import type { ConsultationQuestion, FertilityJourney, QuestionTheme } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';

export function ConsultQuestionsApp({ journey, childId, pregnancyId, theme, withUnthemed, suggestions: themeSuggestions, addOpen, onAddOpen }: {
  journey: FertilityJourney; childId: string | null; pregnancyId: string | null;
  theme: QuestionTheme | null; withUnthemed?: boolean; suggestions?: string[];
  addOpen: boolean; onAddOpen: (v: boolean) => void;
}) {
  const toast = useToast();
  const inv = useInvalidate();
  const householdId = useHouseholdId();
  const q = useConsultationQuestions(journey, childId, theme, withUnthemed);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const counts = questionCounts(list);
  const appts = useAppointments({ upcomingOnly: true });
  const next = nextAppointmentFor(appts.data ?? [], { childId, pregnancyId: childId ? null : pregnancyId, me: !childId && !pregnancyId }, new Date());
  const share = useShareQuestion();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.find((x) => x.id === openId) ?? null;
  const pushing = useRef(false);
  const [pushBusy, setPushBusy] = useState(false);
  const apptWhen = next ? formatDate(next.starts_at, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const missing = next ? list.filter((x) => !x.done && !inAppointment(next, x.question)).length : 0;

  async function patch(id: string, p: Record<string, unknown>) {
    await backend.update('consultation_questions', p, [eq('id', id)]);
    inv('consultation_questions');
  }
  async function toggleDone(x: ConsultationQuestion) {
    haptic('selection');
    try { await patch(x.id, { done: !x.done }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(x: ConsultationQuestion) {
    if (!(await confirm(tr('u5.fert.q_del'), tr('u5.fert.final'), tr('u5.fert.delete')))) return;
    try { await backend.remove('consultation_questions', [eq('id', x.id)]); inv('consultation_questions'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function pushToAppointment() {
    if (!next || pushing.current) return;
    pushing.current = true; setPushBusy(true);
    try {
      const m = mergeIntoAppointment(next.questions, list);
      if (m.added) { await backend.update('appointments', { questions: m.questions }, [eq('id', next.id)]); inv('appointments'); }
      toast(m.added ? tr('rt.cq.pushed', { count: m.added, title: next.title }) : tr('rt.cq.allThere'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { pushing.current = false; setPushBusy(false); }
  }

  const statusOptions = [tr('rt.cq.toAsk'), tr('rt.cq.asked')];
  const shareOptions = [tr('rt.cq.private'), tr('rt.cq.shared')];
  const initial: HmDraft = open ? { question: open.question, status: open.done ? '1' : '0', answer: open.answer ?? '', ...(householdId ? { share: open.shared ? '1' : '0' } : {}) } : {};

  return (
    <View style={{ gap: spacing.md }}>
      <HmHero testID="cq-hero"
        value={counts.toAsk ? String(counts.toAsk) : null}
        unit={counts.toAsk ? tr('rt.cq.unit', { count: counts.toAsk }) : null}
        emptyLabel={list.length ? tr('rt.cq.allAsked') : tr('rt.cq.none')}
        split={list.length ? [
          { label: tr('rt.cq.askedN'), value: String(counts.asked), testID: 'cq-asked' },
          { label: tr('rt.cq.answeredN'), value: String(counts.answered), testID: 'cq-answered' },
        ] : undefined}
        caption={next ? tr('rt.cq.next', { title: next.title, when: apptWhen }) : tr('rt.cq.noNext')}>
        {next && missing > 0 ? (
          <GlassButton variant="secondary" icon="calendar" label={tr('rt.cq.push', { count: missing, when: apptWhen })} disabled={pushBusy} onPress={() => void pushToAppointment()} testID="cq-push" />
        ) : null}
      </HmHero>

      {q.isLoading && !q.data ? <Skeleton rows={3} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('u5.fert.err_q')} /> : null}

      {list.length ? (
        // Liste statique (pas de liste animée) : une question corrigée peut changer de hauteur sans chevaucher la suivante
        <View style={{ gap: spacing.xs }}>
          <Text variant="label" accessibilityRole="header">{tr('rt.cq.list')}</Text>
          <Card padded={false} testID="cq-list">
            {list.map((x, i) => (
              <QuestionRow key={x.id} x={x} first={i === 0} apptWhen={next && inAppointment(next, x.question) ? apptWhen : null}
                onToggle={() => void toggleDone(x)} onOpen={() => setOpenId(x.id)} />
            ))}
          </Card>
        </View>
      ) : null}
      {list.length ? <Text variant="caption" muted>{tr('rt.cq.hint')}</Text> : null}

      <HmFixTray open={!!open} onOpenChange={(v) => { if (!v) setOpenId(null); }} testID="cq-tray"
        title={tr('rt.cq.trayTitle')} hero={open ? (open.done ? tr('rt.cq.asked') : tr('rt.cq.toAsk')) : ''}
        lines={open ? [open.question, open.answer ? tr('u5.fert.q_answer', { answer: open.answer }) : tr('rt.cq.noAnswer'),
          next && inAppointment(next, open.question) ? tr('rt.cq.inAppt', { when: apptWhen }) : null, open.shared ? tr('u5.fert.shared') : null] : []}
        editLabel={tr('rt.cq.edit')} editTitle={tr('rt.cq.editTitle')}
        fields={[
          { key: 'question', label: tr('rt.cq.f.question'), kind: 'text', maxLength: 300 },
          { key: 'status', label: tr('rt.cq.f.status'), kind: 'choice', options: statusOptions },
          { key: 'answer', label: tr('rt.cq.f.answer'), kind: 'multiline', maxLength: 1000 },
          ...(householdId ? [{ key: 'share', label: tr('u5.fert.share'), kind: 'choice' as const, options: shareOptions }] : []),
        ]}
        initial={initial}
        validate={(d) => { const v = validateQuestion(d.question ?? '', list, open?.id ?? null); return v === 'empty' ? tr('rt.cq.err.empty') : v === 'dup' ? tr('u5.fert.q_dup') : null; }}
        onSave={async (d) => {
          if (!open) return 'ok';
          const p: Record<string, unknown> = {};
          const text = (d.question ?? '').trim().slice(0, 300);
          if (text !== open.question) p.question = text;
          if ((d.status === '1') !== open.done) p.done = d.status === '1';
          const ans = (d.answer ?? '').trim() || null;
          if (ans !== (open.answer ?? null)) p.answer = ans;
          if (Object.keys(p).length) await patch(open.id, p);
          if (householdId && (d.share === '1') !== open.shared) await share.mutateAsync({ id: open.id, shared: d.share === '1' });
          return 'ok';
        }}
        onDelete={open ? () => void remove(open) : undefined} deleteLabel={tr('u5.fert.delete')} />

      <AddQuestionSheet visible={addOpen} onClose={() => onAddOpen(false)} journey={journey} childId={childId} theme={theme} list={list}
        suggestions={(themeSuggestions ?? QUESTION_SUGGESTIONS[journey]).filter((s) => !list.some((x) => questionKey(x.question) === questionKey(s)))} />
    </View>
  );
}

function QuestionRow({ x, first, apptWhen, onToggle, onOpen }: { x: ConsultationQuestion; first: boolean; apptWhen: string | null; onToggle: () => void; onOpen: () => void }) {
  const t = useTheme();
  const detail = [x.answer ? tr('u5.fert.q_answer', { answer: x.answer }) : null, apptWhen ? tr('rt.cq.inAppt', { when: apptWhen }) : null, x.shared ? tr('u5.fert.shared') : null].filter(Boolean).join(' · ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderColor: t.colors.border }} testID={`cq-row-${x.id}`}>
      <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: x.done }} accessibilityLabel={`${x.question}, ${x.done ? tr('rt.cq.asked') : tr('rt.cq.toAsk')}`}
        onPress={onToggle} testID={`cq-check-${x.id}`} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.colors.text, backgroundColor: x.done ? t.colors.text : 'transparent', alignItems: 'center', justifyContent: 'center', ...(x.done ? whoopEdge(t, t.colors.text) : null) }}>
          <CheckMark checked={x.done} size={15} color={t.colors.background} />
        </View>
      </Tappable>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('u5.fert.q_answer_a11y', { question: x.question })} onPress={onOpen} testID={`cq-open-${x.id}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: 6 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium" muted={x.done} style={{ textDecorationLine: x.done ? 'line-through' : 'none' }}>{x.question}</Text>
          {detail ? <Text variant="caption" muted numberOfLines={2}>{detail}</Text> : null}
        </View>
        <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
      </Tappable>
    </View>
  );
}

function AddQuestionSheet({ visible, onClose, journey, childId, theme, list, suggestions }: {
  visible: boolean; onClose: () => void; journey: FertilityJourney; childId: string | null; theme: QuestionTheme | null;
  list: ConsultationQuestion[]; suggestions: string[];
}) {
  const toast = useToast();
  const add = useAddQuestions(journey, childId, theme);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const inflight = useRef(false);
  const nextPos = list.length ? Math.max(...list.map((x) => x.position)) + 1 : 0;
  async function addOne(s: string, fromField: boolean) {
    if (inflight.current) return;
    const v = validateQuestion(s, list, null);
    if (v) { setErr(v === 'empty' ? tr('rt.cq.err.empty') : tr('u5.fert.q_dup')); return; }
    inflight.current = true; setErr(null);
    try {
      const r = await add.mutateAsync({ questions: [s.trim().slice(0, 300)], startPosition: nextPos });
      haptic('success');
      if (fromField) setText('');
      toast(r.queued ? tr('rt.cq.addedOffline') : tr('rt.cq.added'), 'success');
    } catch (e) { setErr(friendlyError(e)); } finally { inflight.current = false; }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={tr('rt.cq.add')}>
      <Field label={tr('u5.fert.q_add')} value={text} onChangeText={(v) => { setText(v); setErr(null); }} maxLength={300} placeholder={tr('u5.fert.q_ph')}
        onSubmitEditing={() => void addOne(text, true)} submitBehavior="submit" error={err ?? undefined} testID="cq-add-field" />
      <GlassButton variant="primary" full icon="plus" label={add.isPending ? tr('qt.edit.saving') : tr('u5.fert.add')} disabled={add.isPending || !text.trim()} onPress={() => void addOne(text, true)} testID="cq-add-save" />
      {suggestions.length ? (
        <ListGroup title={tr('u5.fert.suggest')} testID="cq-suggest">
          {suggestions.map((s) => <ListRow key={s} icon="plus-circle" title={s} onPress={() => void addOne(s, false)} />)}
        </ListGroup>
      ) : null}
    </GlassSheet>
  );
}
