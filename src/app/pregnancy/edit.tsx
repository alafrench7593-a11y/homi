/** Modifier la grossesse en cours (terme, nombre de bébés, surnoms) ou la clôturer. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, haptic, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useExpectedBabies, useInvalidate, usePregnancies } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { PregnancyForm, validatePregnancy, type PregnancyDraft } from '@/features/profiles';
import { babiesCount, multiplicityLabel } from '@/lib/domain/pregnancy';
import { formatDateFr, todayISO } from '@/lib/domain/dates';
import type { ExpectedBaby, Pregnancy } from '@/lib/types';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

function toDraft(p: Pregnancy, babies: ExpectedBaby[]): PregnancyDraft {
  const lmpMode = p.due_date_source === 'lmp' && !!p.lmp_date;
  const nicknames = ['', '', '', ''];
  for (const b of babies) if (b.position >= 1 && b.position <= 4) nicknames[b.position - 1] = b.nickname ?? '';
  return { dateMode: lmpMode ? 'lmp' : 'due', date: toFrDate(lmpMode ? p.lmp_date! : p.due_date), multiplicity: p.multiplicity, nicknames, topics: p.topics ?? [] };
}

export default function EditPregnancy() {
  const toast = useToast();
  const inv = useInvalidate();
  const pregnanciesQ = usePregnancies();
  const pregnancy = pregnanciesQ.data?.find((x) => x.status === 'active') ?? null;
  const babiesQ = useExpectedBabies(pregnancy?.id);
  const { data: babies } = babiesQ;
  const [draft, setDraft] = useState<PregnancyDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState<'born' | 'ended' | null>(null);

  useEffect(() => {
    if (!draft && pregnancy && babies) setDraft(toDraft(pregnancy, babies));
  }, [draft, pregnancy, babies]);

  if (pregnanciesQ.isLoading && !pregnanciesQ.data) {
    return <Screen back title="Modifier la grossesse"><Skeleton kind="card" rows={3} /></Screen>;
  }
  if (pregnanciesQ.isError && !pregnanciesQ.data) {
    return <Screen back title="Modifier la grossesse"><ErrorView error={pregnanciesQ.error} onRetry={() => void pregnanciesQ.refetch()} /></Screen>;
  }
  if (!pregnancy) {
    return (
      <Screen back title="Grossesse">
        <EmptyState icon="heart" title="Aucune grossesse en cours" action={{ label: 'Ajouter une grossesse', onPress: () => router.replace({ pathname: '/profiles/new', params: { kind: 'pregnancy' } }) }} />
      </Screen>
    );
  }
  if (babiesQ.isError && !babies) {
    return <Screen back title="Modifier la grossesse"><ErrorView error={babiesQ.error} onRetry={() => void babiesQ.refetch()} /></Screen>;
  }
  if (!draft || !babies) {
    return <Screen back title="Modifier la grossesse"><Skeleton kind="card" rows={3} /></Screen>;
  }

  async function save() {
    if (!pregnancy || !draft || !babies) return;
    const v = validatePregnancy(draft);
    setErrors(v.errors);
    if (!v.due) return;
    const n = babiesCount(draft.multiplicity);
    const removed = babies.filter((b) => b.position > n);
    if (removed.some((b) => b.notes)) {
      const names = removed.map((b) => b.nickname ?? `Bébé ${b.position}`).join(', ');
      if (!(await confirm('Retirer des notes ?', `Les notes de ${names} seront supprimées.`, 'Continuer'))) return;
    }
    setSaving(true);
    setError(null);
    try {
      const unchangedDue = v.due === pregnancy.due_date;
      const source = draft.dateMode === 'lmp' ? 'lmp' : unchangedDue && pregnancy.due_date_source === 'professional' ? 'professional' : 'due_date';
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
      toast('Grossesse mise à jour.');
      router.back();
    } catch (e) {
      setError(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'));
    } finally {
      setSaving(false);
    }
  }

  async function end(status: 'born' | 'ended') {
    if (!pregnancy) return;
    const ok = status === 'born'
      ? await confirm('Félicitations !', 'La grossesse sera archivée (rien n’est supprimé) et vous pourrez créer le profil de chaque bébé.', 'Continuer', false)
      : await confirm('Clôturer la grossesse', 'La grossesse sera archivée. Vos notes, documents et listes restent conservés et vous pourrez les supprimer quand vous le souhaiterez.', 'Clôturer', false);
    if (!ok) return;
    setEnding(status);
    try {
      await backend.update('pregnancies', { status, ended_on: todayISO() }, [eq('id', pregnancy.id)]);
      inv('pregnancies');
      haptic(status === 'born' ? 'success' : 'light');
      if (status === 'born') {
        router.replace({ pathname: '/profiles/new', params: { kind: 'child', fromPregnancy: pregnancy.id } });
      } else {
        toast('La grossesse a été archivée. Prenez soin de vous.', 'info');
        router.replace('/(tabs)');
      }
    } catch (e) {
      setError(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'));
    } finally {
      setEnding(null);
    }
  }

  return (
    <Screen back title="Modifier la grossesse" subtitle={`${multiplicityLabel(pregnancy.multiplicity)} · terme actuel le ${formatDateFr(pregnancy.due_date)}`}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <PregnancyForm value={draft} onChange={setDraft} errors={errors} />
      <Text variant="caption" muted>La date retenue reste celle donnée par votre sage-femme ou votre médecin : l’application l’affiche sans l’interpréter.</Text>
      <Button label="Enregistrer les modifications" size="lg" loading={saving} onPress={save} />

      <SectionTitle title="Clôturer la grossesse" />
      <Card tone="soft">
        <View style={{ gap: spacing.sm }}>
          <Text weight="bold">Bébé est né ?</Text>
          <Text variant="small" muted>La grossesse est archivée et vous créez le profil de {babiesCount(pregnancy.multiplicity) > 1 ? 'chaque bébé' : 'votre bébé'} pour commencer le suivi.</Text>
          <Button label={babiesCount(pregnancy.multiplicity) > 1 ? 'Les bébés sont nés' : 'Bébé est né'} icon="heart" variant="secondary" loading={ending === 'born'} onPress={() => end('born')} />
        </View>
      </Card>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text weight="bold">La grossesse s’est arrêtée</Text>
          <Text variant="small" muted>Vous pouvez archiver cette grossesse à tout moment, sans avoir à expliquer pourquoi. Si vous traversez une épreuve, votre sage-femme, votre médecin ou une association peuvent vous accompagner.</Text>
          <Button label="Archiver la grossesse" variant="ghost" loading={ending === 'ended'} onPress={() => end('ended')} />
        </View>
      </Card>
    </Screen>
  );
}
