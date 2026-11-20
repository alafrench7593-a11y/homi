/**
 * 177 — Baromètre du couple, dans le « Point de couple » : une jauge hebdomadaire FACULTATIVE (cinq mots de météo,
 * jamais de nombre affiché), privée par défaut ; partagée avec l'autre parent seulement si on le choisit. On voit sa
 * propre jauge, ses semaines passées, et ce que l'autre a partagé — jamais une moyenne, un écart ou une comparaison.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Button, Card, Field, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { useHouseholdId } from '@/lib/data/hooks';
import { usePartner } from '@/lib/data/hooks-couple';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useBarometer, useDeleteBarometer, useSaveBarometer } from '@/lib/data/hooks-partiels2';
import { todayISO } from '@/lib/domain/dates';
import { mondayOf } from '@/lib/domain/custody';
import { LEVEL_ICON, LEVELS, myHistory, weekPair, type Level } from './barometer';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const levelLabel = (l: Level) => tr(`p2.bm.level.${l}` as TKey);

export function BarometerCard() {
  const t = useTheme();
  const toast = useToast();
  const me = useUserId();
  const hid = useHouseholdId();
  const partner = usePartner();
  const q = useBarometer();
  const save = useSaveBarometer();
  const del = useDeleteBarometer();
  const week = mondayOf(todayISO());
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const { mine, shared } = useMemo(() => weekPair(rows, me, week), [rows, me, week]);
  const history = useMemo(() => myHistory(rows, me, week), [rows, me, week]);
  const [level, setLevel] = useState<Level | null>(null);
  const [word, setWord] = useState('');
  const [share, setShare] = useState(false);
  useEffect(() => { setLevel(mine?.level ?? null); setWord(mine?.word ?? ''); setShare(mine?.shared ?? false); }, [mine?.id, mine?.level, mine?.shared]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!hid) return null;
  async function submit() {
    if (!level || !hid || !me) return;
    try {
      const r = await save.mutateAsync({ id: mine?.id, household_id: hid, user_id: me, week_of: week, level, word: word.trim().slice(0, 200) || null, shared: share && !!partner });
      toast(tr(r.queued ? 'p2.savedOffline' : share && partner ? 'p2.bm.savedShared' : 'p2.bm.savedPrivate', { name: partner?.name ?? '' }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function clear() {
    if (!mine) { setLevel(null); setWord(''); return; }
    try { await del.mutateAsync(mine.id); toast(tr('p2.bm.cleared')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <View style={{ gap: spacing.sm }} testID="bm-card">
      <SectionTitle title={tr('p2.bm.title')} subtitle={tr('p2.bm.sub')} />
      <Card>
        <Text variant="small" muted>{tr('p2.bm.question')}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm }} accessibilityRole="radiogroup">
          {LEVELS.map((l) => {
            const on = level === l;
            return (
              <Tappable key={l} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={levelLabel(l)} onPress={() => setLevel(on ? null : l)} testID={`bm-level-${l}`}
                style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md,
                  backgroundColor: on ? t.tokens.action.fill : t.tokens.surface.sunken }}>
                <Icon name={LEVEL_ICON[l]} size={22} color={on ? t.tokens.action.text : t.colors.text} />
              </Tappable>
            );
          })}
        </View>
        {/* le mot de la position choisie (les boutons n'affichent que la météo : lisible jusqu'à 320 px) */}
        {level ? (
          <View style={{ marginTop: spacing.sm, gap: 2 }} testID="bm-hint">
            <Text weight="bold">{levelLabel(level)}</Text>
            <Text variant="small">{tr(`p2.bm.hint.${level}` as TKey)}</Text>
          </View>
        ) : null}
        <Field label={tr('p2.bm.word')} optional value={word} onChangeText={setWord} maxLength={200} placeholder={tr('p2.bm.wordPh')} testID="bm-word" />
        {partner ? (
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">{tr('p2.bm.share', { name: partner.name })}</Text>
              <Text variant="caption" muted>{tr('p2.bm.shareD')}</Text>
            </View>
            <Toggle label={tr('p2.bm.share', { name: partner.name })} value={share} onChange={setShare} />
          </Row>
        ) : <Text variant="caption" muted>{tr('p2.bm.private')}</Text>}
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label={mine ? tr('p2.bm.update') : tr('common.save')} icon="check" size="sm" disabled={!level} loading={save.isPending} onPress={() => void submit()} testID="bm-save" />
          {mine || level ? <Button label={tr('p2.bm.clear')} variant="ghost" size="sm" onPress={() => void clear()} testID="bm-clear" /> : null}
        </Row>
        {mine ? <Text variant="caption" muted testID="bm-status">{mine.shared ? tr('p2.bm.isShared', { name: partner?.name ?? '' }) : tr('p2.bm.isPrivate')}</Text> : null}
      </Card>
      {shared.map((s) => (
        <Card key={s.id} tone="soft" testID="bm-partner">
          <Text variant="small" muted>{tr('p2.bm.partnerShared', { name: partner?.name ?? tr('und.inbox.from') })}</Text>
          <Row style={{ alignItems: 'center', marginTop: 4 }}>
            <Icon name={LEVEL_ICON[s.level]} size={18} color={t.colors.primary} />
            <Text weight="bold">{levelLabel(s.level)}</Text>
          </Row>
          {s.word ? <Text variant="small">{s.word}</Text> : null}
          <Text variant="caption" muted>{tr('p2.bm.partnerNote')}</Text>
        </Card>
      ))}
      {history.length ? (
        <View style={{ gap: 4 }} testID="bm-history">
          <Text variant="label">{tr('p2.bm.history')}</Text>
          {history.map((h) => (
            <Row key={h.id} style={{ alignItems: 'center' }}>
              <Icon name={LEVEL_ICON[h.level]} size={16} color={t.colors.textMuted} />
              <Text variant="small" style={{ flex: 1 }}>{tr('p2.bm.weekOf', { date: formatDate(`${h.week_of}T12:00:00`, { day: 'numeric', month: 'short' }) })} · {levelLabel(h.level)}{h.word ? ` · ${h.word}` : ''}</Text>
            </Row>
          ))}
        </View>
      ) : null}
    </View>
  );
}
