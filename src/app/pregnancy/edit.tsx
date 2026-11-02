/** Modifier la grossesse en cours (terme, nombre de bébés, surnoms) ou la clôturer. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, haptic, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useExpectedBabies, useInvalidate, useJourneyState, usePregnancies } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { PregnancyForm, validatePregnancy, type PregnancyDraft } from '@/features/profiles';
import { babiesCount } from '@/lib/domain/pregnancy';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { ExpectedBaby, Pregnancy } from '@/lib/types';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate } from '@/i18n';

const multLabel = (m: string) => tr(`u2.preg.mult_${m}` as never);

function toDraft(p: Pregnancy, babies: ExpectedBaby[]): PregnancyDraft {
  const lmpMode = p.due_date_source === 'lmp' && !!p.lmp_date;
  const conceptionMode = p.due_date_source === 'conception' && !!p.lmp_date;
  const nicknames = ['', '', '', ''];
  for (const b of babies) if (b.position >= 1 && b.position <= 4) nicknames[b.position - 1] = b.nickname ?? '';
  if (conceptionMode) return { dateMode: 'conception', date: toFrDate(addDays(p.lmp_date!, 14)), multiplicity: p.multiplicity, nicknames, topics: p.topics ?? [] };
  return { dateMode: lmpMode ? 'lmp' : 'due', date: toFrDate(lmpMode ? p.lmp_date! : p.due_date), multiplicity: p.multiplicity, nicknames, topics: p.topics ?? [] };
}

export default function EditPregnancy() {
  const toast = useToast();
  const inv = useInvalidate();
  const pregnanciesQ = usePregnancies();
  // Seule la grossesse d'un parcours « grossesse » actif s'affiche (jamais une ancienne grossesse)
  const js = useJourneyState();
  const pregnancy = pregnanciesQ.data?.find((x) => x.status === 'active' && js.pregnancyIds.includes(x.id)) ?? null;
  const babiesQ = useExpectedBabies(pregnancy?.id);
  const { data: babies } = babiesQ;
  const [draft, setDraft] = useState<PregnancyDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft && pregnancy && babies) setDraft(toDraft(pregnancy, babies));
  }, [draft, pregnancy, babies]);

  if (pregnanciesQ.isLoading && !pregnanciesQ.data) {
    return <Screen back title={tr('u2.pedit.title')}><Skeleton kind="card" rows={3} /></Screen>;
  }
  if (pregnanciesQ.isError && !pregnanciesQ.data) {
    return <Screen back title={tr('u2.pedit.title')}><ErrorView error={pregnanciesQ.error} onRetry={() => void pregnanciesQ.refetch()} /></Screen>;
  }
  if (!pregnancy) {
    return (
      <Screen back title={tr('u2.pedit.pregnancy')}>
        <EmptyState icon="heart" title={tr('u2.pedit.none')} action={{ label: tr('u2.pedit.add'), onPress: () => router.replace({ pathname: '/profiles/new', params: { kind: 'pregnancy' } }) }} />
      </Screen>
    );
  }
  if (babiesQ.isError && !babies) {
    return <Screen back title={tr('u2.pedit.title')}><ErrorView error={babiesQ.error} onRetry={() => void babiesQ.refetch()} /></Screen>;
  }
  if (!draft || !babies) {
    return <Screen back title={tr('u2.pedit.title')}><Skeleton kind="card" rows={3} /></Screen>;
  }

  async function save() {
    if (!pregnancy || !draft || !babies) return;
    const v = validatePregnancy(draft);
    setErrors(v.errors);
    if (!v.due) return;
    const n = babiesCount(draft.multiplicity);
    const removed = babies.filter((b) => b.position > n);
    if (removed.some((b) => b.notes)) {
      const names = removed.map((b) => b.nickname ?? tr('u2.pedit.baby_n', { n: b.position })).join(', ');
      if (!(await confirm(tr('u2.pedit.remove_notes'), tr('u2.pedit.notes_deleted', { names }), tr('u2.pedit.continue')))) return;
    }
    setSaving(true);
    setError(null);
    try {
      const unchangedDue = v.due === pregnancy.due_date;
      const source = draft.dateMode === 'lmp' ? 'lmp' : draft.dateMode === 'conception' ? 'conception' : unchangedDue && pregnancy.due_date_source === 'professional' ? 'professional' : 'due_date';
      await backend.update('pregnancies', { due_date: v.due, lmp_date: v.lmp ?? null, due_date_source: source, multiplicity: draft.multiplicity, topics: draft.topics }, [eq('id', pregnancy.id)]);
      for (const b of removed) await backend.remove('expected_babies', [eq('id', b.id)]);
      for (let i = 0; i < n; i++) {
        const nickname = draft.nicknames[i]?.trim() || null;
        const existing = babies.find((b) => b.position === i + 1);
        if (existing) {
          if ((existing.nickname ?? null) !== nickname) await backend.update('expected_babies', { nickname }, [eq('id', existing.id)]);
        } else {
          await backend.insert('expected_babies', { pregnancy_id: pregnancy.id, household_id: pregnancy.household_id, position: i + 1, nickname });
        }
      }
      inv('pregnancies', 'expected_babies');
      haptic('success');
      toast(tr('u2.pedit.updated'));
      router.back();
    } catch (e) {
      setError(friendlyError(e, tr('u2.pedit.save_failed')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back title={tr('u2.pedit.title')} subtitle={tr('u2.pedit.subtitle', { mult: multLabel(pregnancy.multiplicity), date: formatDate(pregnancy.due_date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) })}
      action={{ label: tr('u2.pedit.save'), icon: 'check', onPress: () => save(), disabled: saving, testID: 'preg-edit-save' }}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <PregnancyForm value={draft} onChange={setDraft} errors={errors} />
      <Text variant="caption" muted>{tr('u2.pedit.date_note')}</Text>

      <SectionTitle title={tr('pj.end.title')} />
      <Card tone="soft">
        <View style={{ gap: spacing.sm }}>
          <Text variant="small" muted>{tr('pj.end.editHint')}</Text>
          <Button label={tr('pj.end.title')} icon="flag" variant="secondary" onPress={() => router.push('/pregnancy/end')} testID="go-end" />
        </View>
      </Card>
    </Screen>
  );
}
