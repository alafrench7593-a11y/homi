/**
 * Journal du cycle : notes libres datées (aujourd'hui ou un jour passé, ?date=AAAA-MM-JJ depuis le calendrier),
 * humeur facultative, modification et suppression. Strictement personnel : jamais partagé, jamais envoyé à un service externe.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { HistoryHeader } from '@/components/MiniApp';
import { Banner, Button, Field, haptic } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { removeOwn, saveOwn, useCycleJournal, type JournalEntry } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { CycleIcon, Glass, Ink, Rise, Scale, useCyclePalette } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function JournalScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const params = useLocalSearchParams<{ date?: string }>();
  const { data: entries } = useCycleJournal();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [day, setDay] = useState(toFrDate(params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO()));
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  function reset() { setEditing(null); setDay(toFrDate(todayISO())); setBody(''); setMood(null); setErr(null); }
  function edit(e: JournalEntry) { setEditing(e); setDay(toFrDate(e.entry_on)); setBody(e.body); setMood(e.mood); setErr(null); haptic('selection'); }

  async function save() {
    const d = frToISO(day);
    if (!d || d > todayISO()) return setErr(tr('cy.err.dateNotFuture'));
    if (!body.trim()) return setErr(tr('cy.jr.errEmpty'));
    setErr(null); setBusy(true);
    try {
      const row = { entry_on: d, body: body.trim(), mood };
      await saveOwn('cycle_journal', editing ? row : { user_id: userId, ...row }, editing?.id);
      inv('cycle_journal'); haptic('success'); toast(tr('cy.jr.saved')); reset();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove(e: JournalEntry) {
    if (!(await confirm(tr('cy.delete.title', { what: tr('cy.what.journal') }), tr('cy.delete.body'), tr('common.delete')))) return;
    try { await removeOwn('cycle_journal', e.id); inv('cycle_journal'); if (editing?.id === e.id) reset(); toast(tr('cy.deleted')); } catch (er) { toast(friendlyError(er), 'error'); }
  }

  const q = query.trim().toLowerCase();
  const shown = (entries ?? []).filter((e) => !q || e.body.toLowerCase().includes(q));

  return (
    <Screen back title={tr('cy.jr.title')} subtitle={tr('cy.jr.subtitle')}
      action={{ label: editing ? tr('cy.period.update') : tr('common.save'), icon: 'check', onPress: () => save(), disabled: busy, testID: 'journal-save' }}>
      <Glass>
        <Ink variant="heading">{editing ? tr('cy.jr.editTitle') : tr('cy.jr.newTitle')}</Ink>
        <Field label={tr('cy.jr.date')} value={day} onChangeText={setDay} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
        <Field label={tr('cy.jr.body')} value={body} onChangeText={setBody} multiline maxLength={10000} style={{ minHeight: 120, textAlignVertical: 'top' }} />
        <Scale label={tr('cy.scale.mood')} value={mood} onChange={setMood} low={tr('cy.scale.low')} high={tr('cy.scale.high')} />
        {err ? <Banner tone="warning">{err}</Banner> : null}
        {editing ? <Button label={tr('common.cancel')} variant="ghost" onPress={reset} full /> : null}
        <Ink variant="caption" soft>{tr('cy.private')}</Ink>
      </Glass>

      <HistoryHeader title={tr('cy.nav.journal')} count={(entries ?? []).length || undefined} />
      {(entries ?? []).length > 3 ? <Field label={tr('cy.jr.search')} value={query} onChangeText={setQuery} /> : null}
      {!(entries ?? []).length ? <Ink soft>{tr('cy.jr.empty')}</Ink> : null}
      {shown.map((e, i) => (
        <Rise key={e.id} delay={Math.min(i, 6) * 30}>
          <Glass>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <CycleIcon name="journal" color={c.mauve} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="medium">{fmtDayYear(e.entry_on)}</Ink>
                {e.mood ? <Ink variant="caption" soft>{tr('cy.jr.moodValue', { n: e.mood })}</Ink> : null}
              </View>
            </View>
            <Ink>{e.body}</Ink>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Button label={tr('common.edit')} size="sm" variant="ghost" onPress={() => edit(e)} />
              <Button label={tr('common.delete')} size="sm" variant="ghost" onPress={() => remove(e)} />
            </View>
          </Glass>
        </Rise>
      ))}
    </Screen>
  );
}
