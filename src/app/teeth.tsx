/** Dents de lait : noter la date d'apparition de chaque dent, sans comparaison ni « retard ». */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { ToothChart } from '@/features/childCare';
import { useSaveReminder } from '@/lib/data/hooks-settings';
import { toFrDate } from '@/lib/validation';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useChildren, useInvalidate } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';


export default function Teeth() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ child?: string }>();
  const { subject } = useActiveSubject();
  const childrenQ = useChildren();
  const { data: children } = childrenQ;
  const [busy, setBusy] = useState<string | null>(null);
  const childId = (typeof params.child === 'string' && params.child) || (subject.type === 'child' ? subject.id : children?.[0]?.id);
  const child = children?.find((c) => c.id === childId);
  const milestonesQ = useMilestones(childId);
  const { data: milestones } = milestonesQ;
  const teeth = useMemo(() => (milestones ?? []).filter((m) => m.kind === 'tooth'), [milestones]);

  const [picked, setPicked] = useState<string | null>(null);
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const pickedRow = picked ? teeth.find((m) => m.title === picked) : undefined;
  const saveReminder = useSaveReminder();

  const open = (label: string) => {
    if (!child || busy) return;
    haptic('selection');
    const existing = teeth.find((m) => m.title === label);
    setDate(toFrDate(existing?.happened_on ?? todayISO()));
    setNote(existing?.note ?? '');
    setPicked(label);
  };

  async function save() {
    if (!child || !picked) return;
    const iso = frToISO(date);
    if (!iso || iso > todayISO()) return toast('Date invalide (jj/mm/aaaa, pas dans le futur).', 'error');
    setBusy(picked);
    try {
      if (pickedRow) await backend.update('child_milestones', { happened_on: iso, note: note.trim() || null }, [eq('id', pickedRow.id)]);
      else await insertOrQueue('child_milestones', { child_id: child.id, household_id: child.household_id, kind: 'tooth', title: picked, happened_on: iso, note: note.trim() || null, domain: null });
      inv('child_milestones');
      haptic('success');
      toast(pickedRow ? 'Dent mise à jour.' : 'Dent notée.', 'success');
      setPicked(null);
    } catch (e) {
      toast(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    } finally { setBusy(null); }
  }

  async function removeTooth() {
    if (!pickedRow || !(await confirm('Retirer cette dent ?', `${pickedRow.title} (${pickedRow.happened_on ?? 'sans date'})`, 'Retirer'))) return;
    try { await backend.remove('child_milestones', [eq('id', pickedRow.id)]); inv('child_milestones'); toast('Dent retirée.'); setPicked(null); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function hygieneReminder() {
    try {
      await saveReminder.mutateAsync({ draft: { title: 'Brossage des dents', body: 'Petit rappel du soir.', category: 'custom', schedule: { type: 'daily', hour: 19, minute: 45 }, enabled: true, deep_link: '/teeth' } });
      toast('Rappel quotidien de brossage à 19 h 45 (modifiable dans Rappels).');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Dents" subtitle={child ? `${child.first_name} · ${teeth.length} dent${teeth.length > 1 ? 's' : ''} notée${teeth.length > 1 ? 's' : ''}` : 'Ajoutez d’abord un enfant.'}>
      <Banner tone="info">Chaque enfant a son rythme : les premières dents arrivent souvent entre 6 et 12 mois, parfois plus tôt ou plus tard. En cas de doute, parlez-en à votre pédiatre ou à la PMI.</Banner>
      {childrenQ.isLoading && !children ? <Skeleton rows={4} /> : childrenQ.isError && !children ? (
        <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} />
      ) : !child ? (
        <EmptyState icon="smile" title="Aucun enfant pour l’instant" body="Ajoutez le profil de votre enfant pour noter ses premières dents." action={{ label: 'Ajouter un enfant', onPress: () => router.push('/profiles/new?kind=child' as never) }} />
      ) : milestonesQ.isLoading && !milestones ? <Skeleton kind="detail" rows={6} /> : milestonesQ.isError && !milestones ? (
        <ErrorView error={milestonesQ.error} onRetry={() => void milestonesQ.refetch()} title="Impossible d’afficher les dents notées" />
      ) : (
        <>
          <Card>
            <ToothChart present={new Set(teeth.map((m) => m.title))} onPick={open} />
            <Text variant="caption" muted center>Touchez une dent pour noter sa date d’apparition et vos observations.</Text>
          </Card>
          {teeth.length ? (
            <Card>
              {[...teeth].sort((x, y) => (x.happened_on ?? '').localeCompare(y.happened_on ?? '')).map((m) => (
                <Pressable key={m.id} accessibilityRole="button" onPress={() => open(m.title)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
                  <Icon name="check-circle" size={18} color={t.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text>{m.title}</Text>
                    {m.note ? <Text variant="caption" muted numberOfLines={1}>{m.note}</Text> : null}
                  </View>
                  {m.happened_on ? <Text variant="caption" muted>{new Date(m.happened_on).toLocaleDateString('fr-FR')}</Text> : null}
                </Pressable>
              ))}
            </Card>
          ) : null}
          <Card tone="soft">
            <Text weight="bold">Soins et rendez-vous</Text>
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label="Rappel de brossage" icon="bell" size="sm" variant="secondary" onPress={hygieneReminder} loading={saveReminder.isPending} />
              <Button label="Rendez-vous dentiste" icon="calendar" size="sm" variant="secondary" onPress={() => router.push('/appointments')} />
            </Row>
          </Card>
          <Text variant="caption" muted>Fièvre, diarrhée ou fort inconfort ne sont pas automatiquement dus aux dents : si un symptôme vous inquiète ou dure, demandez un avis médical.</Text>
        </>
      )}

      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={picked ?? ''}>
        <Field label="Date d’apparition" value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
        <Field label="Observations" optional multiline value={note} onChangeText={setNote} maxLength={4000} placeholder="Gencive gonflée, mâchouille beaucoup…" />
        <Button label={pickedRow ? 'Enregistrer' : 'Noter cette dent'} onPress={save} loading={!!busy} />
        {pickedRow ? <Button label="Retirer cette dent" variant="ghost" onPress={removeTooth} /> : null}
      </Sheet>
    </Screen>
  );
}
