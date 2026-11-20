/**
 * 129 — Journal du développement du langage (dans « Je grandis ») : premiers mots, phrases, langues parlées à la
 * maison, notes ; une frise par mois. Aucune norme d'âge n'est appliquée aux saisies : les repères « langage » de
 * « Je grandis » sont affichés à part, avec leur source, comme indicatifs (jamais un diagnostic, jamais de retard).
 * Parents de l'enfant seulement (RLS) ; hors ligne : saisie gardée sur le téléphone puis envoyée.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, Icon, ListGroup, ListRow, Row, SectionTitle, Text, type IconName } from '@/components/ui';
import { STEP_SOURCES } from '@/content/discoveries/steps';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteLanguage, useLanguageEntries, useSaveLanguage } from '@/lib/data/hooks-partiels2';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { openLink } from '@/lib/links';
import { toFrDate } from '@/lib/validation';
import { alreadyNoted, counts, frise, homeLanguages, languageMilestones, LANGUAGE_KINDS, type LanguageEntry, type LanguageKind } from '@/features/language/domain';
import { ChildToolGate, useParentChild } from '@/features/childTools/ChildToolGate';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const KIND_ICON: Record<LanguageKind, IconName> = { word: 'message-circle', sentence: 'message-square', language: 'globe', note: 'edit-3' };
const range = (a: number, b: number) => (b >= 24 && a % 12 === 0 && b % 12 === 0 ? tr('gr.rangeYears', { a: a / 12, b: b / 12 }) : tr('gr.rangeMonths', { a, b }));

export default function LanguageJournal() {
  const state = useParentChild();
  const gate = ChildToolGate({ title: tr('p2.lg.title'), state });
  if (gate) return gate;
  return <LanguageBody child={state.child!} />;
}

function LanguageBody({ child }: { child: Child }) {
  const t = useTheme();
  const toast = useToast();
  const q = useLanguageEntries(child.id);
  const [open, setOpen] = useState<{ kind: LanguageKind; entry: LanguageEntry | null } | null>(null);
  const [showRefs, setShowRefs] = useState(false);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const groups = useMemo(() => frise(list), [list]);
  const c = useMemo(() => counts(list), [list]);
  const langs = useMemo(() => homeLanguages(list), [list]);
  if (q.isLoading && !q.data) return <Screen back title={tr('p2.lg.title')}><Skeleton rows={4} /></Screen>;
  if (q.isError && !q.data) return <Screen back title={tr('p2.lg.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  const add = (kind: LanguageKind) => setOpen({ kind, entry: null });
  return (
    <Screen back title={tr('p2.lg.title')} subtitle={tr('p2.lg.sub', { name: child.first_name })}
      action={{ label: tr('p2.lg.addWord'), icon: 'plus', onPress: () => add('word'), testID: 'lg-add' }}>
      <TodaySummary title={tr('p2.lg.noted')} items={[
        { icon: 'message-circle', value: String(c.word), label: tr('p2.lg.n.word') },
        { icon: 'message-square', value: String(c.sentence), label: tr('p2.lg.n.sentence') },
        { icon: 'globe', value: String(langs.length), label: tr('p2.lg.n.language') },
      ]} />
      <Text variant="small" muted>{tr('p2.lg.intro')}</Text>
      <Row wrap>
        <Chip label={tr('p2.lg.addSentence')} icon="message-square" onPress={() => add('sentence')} testID="lg-add-sentence" />
        <Chip label={tr('p2.lg.addNote')} icon="edit-3" onPress={() => add('note')} testID="lg-add-note" />
      </Row>

      <SectionTitle title={tr('p2.lg.home')} subtitle={tr('p2.lg.homeSub')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID="lg-languages">
        {langs.map((l) => <Chip key={l.id} label={l.note ? `${l.text} · ${l.note}` : l.text} icon="globe" onPress={l._pending ? undefined : () => setOpen({ kind: 'language', entry: l })} testID={`lg-lang-${l.id}`} />)}
        <Chip label={tr('p2.lg.addLanguage')} icon="plus" onPress={() => add('language')} testID="lg-add-language" />
      </View>

      <SectionTitle title={tr('p2.lg.frise')} />
      {groups.length ? groups.map((g) => (
        <ListGroup key={g.key} title={g.month ? formatDate(`${g.month}T12:00:00`, { month: 'long', year: 'numeric' }).replace(/^./, (x) => x.toUpperCase()) : tr('p2.lg.undated')} testID={`lg-month-${g.key}`}>
          {g.entries.map((e) => (
            <ListRow key={e.id} icon={KIND_ICON[e.kind]} title={e.kind === 'sentence' ? tr('p2.lg.quote', { text: e.text }) : e.text}
              subtitle={[tr(`p2.lg.k.${e.kind}` as TKey), e.said_on ? formatDate(`${e.said_on}T12:00:00`, { day: 'numeric', month: 'short' }) : null, e.language, e.note, e._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
              onPress={e._pending ? undefined : () => setOpen({ kind: e.kind, entry: e })} testID={`lg-entry-${e.id}`} />
          ))}
        </ListGroup>
      )) : (
        <Card testID="lg-empty">
          <Text weight="bold">{tr('p2.lg.emptyT', { name: child.first_name })}</Text>
          <Text variant="small" muted>{tr('p2.lg.emptyB')}</Text>
        </Card>
      )}

      <Card testID="lg-refs">
        <Tappable bare accessibilityRole="button" accessibilityState={{ expanded: showRefs }} onPress={() => setShowRefs((v) => !v)} testID="lg-refs-toggle"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
          <Icon name="compass" size={18} color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('p2.lg.refs')}</Text>
            <Text variant="caption" muted>{tr('p2.lg.refsSub')}</Text>
          </View>
          <Icon name={showRefs ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
        </Tappable>
        {showRefs ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }} testID="lg-refs-list">
            <Banner tone="info" icon="info">{tr('p2.lg.refsNote')}</Banner>
            {languageMilestones().map((s) => (
              <View key={s.key} style={{ gap: 2 }}>
                <Text weight="medium">{s.title}</Text>
                <Text variant="caption" muted>{tr('gr.around', { range: range(s.around[0], s.around[1]) })} · {tr('p2.lg.indicative')}</Text>
                <Tappable accessibilityRole="link" onPress={() => openLink(STEP_SOURCES[s.source].url, toast)} style={{ minHeight: 32, justifyContent: 'center' }}>
                  <Text variant="caption" color={t.colors.primary}>{STEP_SOURCES[s.source].label}</Text>
                </Tappable>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
      <LanguageSheet open={open} child={child} entries={list} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function LanguageSheet({ open, child, entries, onClose }: { open: { kind: LanguageKind; entry: LanguageEntry | null } | null; child: Child; entries: LanguageEntry[]; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveLanguage();
  const del = useDeleteLanguage();
  const [kind, setKind] = useState<LanguageKind>('word');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const e = open?.entry ?? null;
  useEffect(() => {
    if (!open) return;
    setKind(open.kind); setText(e?.text ?? ''); setLanguage(e?.language ?? ''); setNote(e?.note ?? ''); setErr(null);
    setDate(e ? (e.said_on ? toFrDate(e.said_on) : '') : open.kind === 'language' ? '' : toFrDate(todayISO()));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const langs = homeLanguages(entries).map((l) => l.text);
  async function submit() {
    if (!text.trim()) return setErr(tr('p2.lg.errText'));
    let said: string | null = null;
    if (date.trim()) {
      said = frToISO(date);
      if (!said || said > todayISO()) return setErr(tr('p2.lg.errDate'));
      if (child.birth_date && said < child.birth_date) return setErr(tr('u7.child.err.beforeBirth'));
    }
    if (alreadyNoted(entries, kind, text, e?.id)) return setErr(tr('p2.lg.errDup'));
    setErr(null);
    try {
      const r = await save.mutateAsync({ id: e?.id, household_id: child.household_id, child_id: child.id, kind, text: text.trim().slice(0, 200),
        language: kind === 'language' ? null : language.trim().slice(0, 40) || null, said_on: said, note: note.trim().slice(0, 500) || null });
      toast(tr(r.queued ? 'p2.savedOffline' : 'p2.lg.saved'), 'success');
      onClose();
    } catch (x) { setErr(friendlyError(x)); }
  }
  async function remove() {
    if (!e || !(await confirm(tr('common.delete'), tr('p2.lg.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(e.id); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible={!!open} onClose={onClose} title={e ? tr('p2.lg.edit') : tr(`p2.lg.new.${kind}` as TKey, { name: child.first_name })}>
      {!e ? <Row wrap>{LANGUAGE_KINDS.map((k) => <Chip key={k} label={tr(`p2.lg.k.${k}` as TKey)} icon={KIND_ICON[k]} selected={kind === k} onPress={() => setKind(k)} testID={`lg-kind-${k}`} />)}</Row> : null}
      <Field label={tr(`p2.lg.f.${kind}` as TKey)} value={text} onChangeText={setText} maxLength={200} placeholder={tr(`p2.lg.ph.${kind}` as TKey)} testID="lg-f-text" />
      {kind !== 'language' ? (
        <>
          <Field label={tr('p2.lg.f.date')} optional value={date} onChangeText={setDate} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" testID="lg-f-date" />
          <Field label={tr('p2.lg.f.inLanguage')} optional value={language} onChangeText={setLanguage} maxLength={40} testID="lg-f-language" />
          {langs.length ? <Row wrap>{langs.map((l) => <Chip key={l} label={l} selected={language === l} onPress={() => setLanguage(language === l ? '' : l)} />)}</Row> : null}
        </>
      ) : null}
      <Field label={tr(kind === 'language' ? 'p2.lg.f.whoSpeaks' : 'p2.lg.f.note')} optional value={note} onChangeText={setNote} maxLength={500} multiline testID="lg-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="lg-f-save" />
      {e ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="lg-f-delete" /> : null}
    </GlassSheet>
  );
}
