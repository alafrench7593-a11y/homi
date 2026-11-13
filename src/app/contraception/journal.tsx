/**
 * Journal de ma contraception (script 13 « Elle ne me convient plus ») : noter, daté, ce que l'on ressent
 * depuis sa contraception (humeur, saignements, douleurs, libido, peau…) pour le montrer au gynécologue,
 * au médecin ou à la sage-femme — et oser dire qu'elle ne convient plus. Aucune interprétation : seule la
 * consultation peut décider d'un changement de méthode.
 */
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useTapShield } from '@/features/tapShield';

const EFFECTS = ['mood', 'bleeding', 'pain', 'libido', 'skin', 'weight', 'headache', 'nausea', 'other'] as const;
type Effect = (typeof EFFECTS)[number];

export default function ContraceptionJournal() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const logsQ = useContraceptionLogs(400);
  const [effect, setEffect] = useState<Effect | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // Double appui sur « Noter » : le second appui (choix déjà remis à zéro) n'affiche pas « Choisissez d'abord… »
  const { arm, guard } = useTapShield();
  const sending = useRef(false);
  const rows = useMemo(() => (logsQ.data ?? []).filter((l) => l.kind === 'effect'), [logsQ.data]);
  const last30 = rows.filter((l) => Date.parse(l.logged_on) > Date.now() - 30 * 86400000);
  const label = (l: { label: string | null }) => (EFFECTS.includes(l.label as Effect) ? tr(`cj.effect.${l.label}` as TKey) : l.label ?? tr('cj.effect.other'));

  async function add() {
    if (!effect) return toast(tr('cj.pick'), 'info');
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    try {
      await backend.insert('contraception_logs', { user_id: userId, logged_on: todayISO(), kind: 'effect', label: effect, note: note.trim() || null });
      inv('contraception_logs');
      arm();
      setEffect(null); setNote('');
      toast(tr('cj.saved'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { sending.current = false; setBusy(false); }
  }
  async function remove(id: string) {
    if (!(await confirm(tr('common.delete'), tr('cj.deleteQ'), tr('common.delete')))) return;
    try { await backend.remove('contraception_logs', [eq('id', id)]); inv('contraception_logs'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function share() {
    if (!rows.length) return toast(tr('cj.none'), 'info');
    const lines = [tr('cj.exportTitle'), tr('cj.exportIntro', { date: formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) }), ''];
    for (const l of [...rows].reverse()) lines.push(`${formatDate(l.logged_on, { day: 'numeric', month: 'short', year: 'numeric' })} — ${label(l)}${l.note ? ` : ${l.note}` : ''}`);
    try { await exportTextFile(lines.join('\n'), 'journal-contraception.txt', 'text/plain'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.contraception_journal')} subtitle={tr('tool.contraception_journal.sub')}
      action={{ label: tr('cj.add'), icon: 'plus', onPress: guard(() => void add()), testID: 'cj-save', disabled: busy }}>
      <Text muted>{tr('cj.intro')}</Text>
      <TodaySummary title={tr('cj.summary')} items={[
        { icon: 'edit-3', value: String(last30.length), label: tr('cj.last30') },
        { icon: 'calendar', value: rows[0] ? formatDate(rows[0].logged_on, { day: 'numeric', month: 'short' }) : '—', label: tr('cj.lastOne') },
      ]} />
      <Card>
        <Text weight="bold">{tr('cj.what')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
          {EFFECTS.map((e) => <Chip key={e} label={tr(`cj.effect.${e}` as TKey)} selected={effect === e} onPress={() => setEffect(e)} testID={`cj-effect-${e}`} />)}
        </View>
        <Field label={tr('cj.note')} optional value={note} onChangeText={setNote} maxLength={500} multiline placeholder={tr('cj.notePh')} />
      </Card>
      <Banner tone="info" icon="user-check">{tr('cj.consult')}</Banner>
      <SectionTitle title={tr('cj.history')} action={rows.length ? tr('cj.share') : undefined} onAction={rows.length ? () => void share() : undefined} />
      {!rows.length ? <EmptyState icon="edit-3" title={tr('cj.none')} body={tr('cj.noneD')} /> : (
        <Card padded={false}>
          {rows.slice(0, 90).map((l) => (
            <ListRow key={l.id} icon="edit-3" title={label(l)} subtitle={`${formatDate(l.logged_on, { weekday: 'short', day: 'numeric', month: 'short' })}${l.note ? ` · ${l.note}` : ''}`} onPress={() => void remove(l.id)} />
          ))}
        </Card>
      )}
      <Button label={tr('cj.prepare')} icon="clipboard" variant="secondary" onPress={() => router.push('/contraception/consultation')} />
    </Screen>
  );
}
