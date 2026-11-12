/**
 * Mon journal intime — pages datées, humeur du jour, relecture et modification.
 * Les pages sont les bilans d'humeur qui portent un texte (table `mood_checkins`) : privées par construction
 * (visibles uniquement par leur autrice, jamais par le foyer), exportées et supprimées avec le compte.
 * Aucune page n'est générée ; aucun score, aucun diagnostic. Une humeur « très difficile » propose l'aide.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, haptic, Row, Text } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useMoods } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DIARY_MAX, diaryPages, groupByMonth, validateDiary } from '@/lib/domain/diary';
import { insertOrQueue } from '@/lib/offline';
import type { MoodCheckin } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing, typography } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

type Mood = MoodCheckin['mood'];
const MOODS: Mood[] = [1, 2, 3, 4, 5];
const moodLabel = (m: number) => tr(`u8.mood.m${m}` as TKey);
const ERR: Record<'empty' | 'mood' | 'long', TKey> = { empty: 'dy.errEmpty', mood: 'dy.errMood', long: 'dy.errLong' };
const editorial = { fontFamily: typography.editorial.fontFamily, fontSize: typography.editorial.fontSize, lineHeight: typography.editorial.lineHeight, letterSpacing: typography.editorial.letterSpacing };

/** Brouillon gardé en mémoire le temps de la session : quitter l'écran puis y revenir ne perd pas le texte. */
let draft: { text: string; mood: Mood | null; editingId: string | null } = { text: '', mood: null, editingId: null };

export default function Diary() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const moodsQ = useMoods(200);
  const pages = useMemo(() => diaryPages(moodsQ.data), [moodsQ.data]);
  const months = useMemo(() => groupByMonth(pages), [pages]);

  const [text, setText] = useState(draft.text);
  const [mood, setMood] = useState<Mood | null>(draft.mood);
  const [editingId, setEditingId] = useState<string | null>(draft.editingId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [needsSupport, setNeedsSupport] = useState(false);
  const busy = useRef(false);

  useEffect(() => { draft = { text, mood, editingId }; }, [text, mood, editingId]);

  const editing = editingId ? pages.find((p) => p.id === editingId) : undefined;

  function reset() { setText(''); setMood(null); setEditingId(null); setError(null); }

  async function save() {
    if (busy.current) return; // double appui : une seule page
    const problem = validateDiary(text, mood);
    if (problem) { setError(tr(ERR[problem])); haptic('warning'); return; }
    busy.current = true;
    setError(null);
    setSaving(true);
    try {
      if (editingId) await backend.update('mood_checkins', { journal: text.trim(), mood }, [eq('id', editingId)]);
      else await insertOrQueue('mood_checkins', { user_id: userId, checked_at: new Date().toISOString(), mood, feelings: [], safety_concern: false, journal: text.trim() });
      inv('mood_checkins');
      haptic('success');
      toast(tr(editingId ? 'dy.updated' : 'dy.saved'));
      setNeedsSupport(mood === 1);
      reset();
    } catch (e) {
      toast(friendlyError(e, tr('dy.saveFail')), 'error');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function startEdit(p: MoodCheckin) {
    setEditingId(p.id);
    setText(p.journal ?? '');
    setMood(p.mood);
    setError(null);
    setNeedsSupport(false);
  }

  async function remove(p: MoodCheckin) {
    if (!(await confirm(tr('dy.delQ'), tr('dy.delBody'), tr('dy.delete')))) return;
    setRemovingId(p.id);
    try {
      await backend.remove('mood_checkins', [eq('id', p.id)]);
      inv('mood_checkins');
      if (editingId === p.id) reset();
      toast(tr('dy.deleted'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  const loading = moodsQ.isLoading && !moodsQ.data;
  const failed = moodsQ.isError && !moodsQ.data;
  let index = 0;

  return (
    <Screen back title={tr('dy.title')} subtitle={tr('dy.subtitle')} tool={false}>
      <Text accessibilityRole="text" style={[editorial, { color: t.colors.text }]}>{tr('dy.tagline')}</Text>

      <Card testID="diary-composer">
        <Text style={{ fontFamily: fonts.serifItalic, fontSize: typography.editorialS.fontSize, lineHeight: typography.editorialS.lineHeight, color: t.colors.textMuted }}>
          {editing ? tr('dy.editing', { date: formatDate(editing.checked_at, { day: 'numeric', month: 'long' }) }) : capitalize(formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}
        </Text>
        <Field label={tr('dy.field')} value={text} onChangeText={(v) => { setText(v); if (error) setError(null); }} multiline maxLength={DIARY_MAX} placeholder={tr('dy.placeholder')} style={{ minHeight: 140, textAlignVertical: 'top' }} testID="diary-text" />
        <Text variant="small" weight="bold" style={{ marginTop: spacing.sm }}>{tr('dy.mood')}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={tr('dy.mood')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
          {MOODS.map((m) => <Chip key={m} label={moodLabel(m)} selected={mood === m} onPress={() => { haptic('selection'); setMood(m); if (error) setError(null); }} testID={`diary-mood-${m}`} />)}
        </View>
        {error ? <Text variant="small" color={t.colors.danger} accessibilityLiveRegion="polite" style={{ marginTop: spacing.xs }}>{error}</Text> : null}
        <Row wrap style={{ marginTop: spacing.md }}>
          <Button label={tr(editingId ? 'dy.update' : 'dy.save')} icon="feather" loading={saving} onPress={save} testID="diary-save" />
          {editingId ? <Button label={tr('dy.cancelEdit')} variant="ghost" onPress={reset} /> : null}
        </Row>
      </Card>

      {needsSupport ? (
        <Banner tone="warning" title={tr('u8.mood.support.softTitle')} action={<Button label={tr('u8.mood.support.allHelp')} variant="secondary" size="sm" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />}>
          <Text variant="small">{tr('u8.mood.support.soft')}</Text>
        </Banner>
      ) : null}

      <Text variant="caption" muted>{tr('dy.private')}</Text>

      {loading ? <Skeleton rows={3} /> : null}
      {failed ? <ErrorView error={moodsQ.error} onRetry={() => void moodsQ.refetch()} title={tr('dy.listErr')} /> : null}
      {!loading && !failed && !pages.length ? <EmptyState icon="book-open" title={tr('dy.none')} body={tr('dy.noneBody')} /> : null}

      {months.map((mo) => (
        <View key={mo.key} style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[editorial, { color: t.colors.text, marginTop: spacing.sm }]}>{capitalize(formatDate(mo.pages[0].checked_at, { month: 'long', year: 'numeric' }))}</Text>
          {mo.pages.map((p) => {
            const open = openId === p.id;
            const long = (p.journal ?? '').length > 220 || (p.journal ?? '').split('\n').length > 5;
            const i = index++;
            return (
              <StaggerItem key={p.id} index={i}>
                <Card padded={false} testID="diary-page">
                  <Tappable
                    bare
                    pressScale={0.99}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={tr('dy.pageA11y', { date: formatDate(p.checked_at, { day: 'numeric', month: 'long' }), mood: moodLabel(p.mood) })}
                    onPress={() => setOpenId(open ? null : p.id)}
                    style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg }}
                  >
                    <View style={{ alignItems: 'center', minWidth: 46 }}>
                      <Text style={{ fontFamily: fonts.serifItalic, fontSize: 34, lineHeight: 38, color: t.colors.primary }}>{new Date(p.checked_at).getDate()}</Text>
                      <Text variant="caption" muted>{formatDate(p.checked_at, { weekday: 'short' }).replace('.', '')}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                      <Text variant="caption" weight="medium" color={t.colors.lavender}>{moodLabel(p.mood)}</Text>
                      <Text numberOfLines={open ? undefined : 5} intentionalTruncation style={{ lineHeight: 24 }}>{p.journal}</Text>
                      {long ? <Text variant="small" weight="medium" color={t.colors.primary}>{tr(open ? 'dy.less' : 'dy.more')}</Text> : null}
                    </View>
                  </Tappable>
                  {open ? (
                    <Row wrap style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, justifyContent: 'flex-end' }}>
                      <Button label={tr('dy.edit')} icon="edit-2" size="sm" variant="secondary" onPress={() => startEdit(p)} />
                      <Button label={tr('dy.delete')} icon="trash-2" size="sm" variant="ghost" loading={removingId === p.id} onPress={() => remove(p)} />
                    </Row>
                  ) : null}
                </Card>
              </StaggerItem>
            );
          })}
        </View>
      ))}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}

function capitalize(s: string) { return s.replace(/^./, (c) => c.toUpperCase()); }
