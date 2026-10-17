/**
 * Rapports (parcours « concevoir ») : entièrement FACULTATIF et PRIVÉ.
 * Owner-only côté base (RLS) : jamais visible par le foyer ou le coparent, jamais partagé.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Field, haptic, IconButton, ListRow, SectionTitle, Text } from '@/components/ui';
import { EstimateTag, fmt, PrivateBanner } from '@/components/Fertility';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { useAddIntercourse, useCycleEstimates, useIntercourseLogs } from '@/lib/data/hooks-fertility';
import { upcomingWindow } from '@/lib/domain/cycle';
import { daysBetween, formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

export default function IntimacyScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const { data } = useIntercourseLogs(120);
  const add = useAddIntercourse();
  const { windows } = useCycleEstimates(2);
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const list = data ?? [];
  const { prefs, isLoading: prefsLoading } = useCyclePreferences();
  const savePrefs = useSaveCyclePreferences();
  const w = upcomingWindow(windows);
  const inWindow = useMemo(
    () => (w ? list.filter((l) => daysBetween(w.start, l.occurred_on) >= 0 && daysBetween(l.occurred_on, w.end) >= 0).length : 0),
    [list, w],
  );

  async function submit() {
    const iso = frToISO(date);
    if (!iso || iso > todayISO()) return setError('Date invalide (JJ/MM/AAAA, pas dans le futur).');
    setError(null);
    try {
      await add.mutateAsync({ occurred_on: iso, note: note.trim() || null });
      haptic('success');
      setNote('');
      toast('Noté, en privé.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer cette saisie ?', 'Cette action est définitive.', 'Supprimer'))) return;
    await backend.remove('intercourse_logs', [eq('id', id)]);
    inv('intercourse_logs');
  }

  async function removeAll() {
    if (!(await confirm('Tout supprimer ?', 'Toutes vos saisies de rapports seront définitivement effacées.', 'Tout supprimer'))) return;
    for (const l of list) await backend.remove('intercourse_logs', [eq('id', l.id)]);
    inv('intercourse_logs');
    toast('Saisies supprimées.');
  }

  if (!prefsLoading && !prefs.track_intercourse) {
    return (
      <Screen back title="Rapports" subtitle="Option désactivée">
        <PrivateBanner>Si vous l’activez, ces informations restent visibles uniquement par vous.</PrivateBanner>
        <Card>
          <Text>Le suivi des rapports est désactivé. Vous pouvez l’activer si cela vous aide à repérer les jours de votre période fertile estimée.</Text>
          <Button label="Activer le suivi des rapports" icon="lock" style={{ marginTop: spacing.sm }} loading={savePrefs.isPending} onPress={() => savePrefs.mutate({ track_intercourse: true })} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen back title="Rapports" subtitle="Entièrement facultatif. Notez seulement si cela vous aide.">
      <PrivateBanner>Ces saisies ne sont jamais partagées : ni avec votre foyer, ni avec votre coparent, ni dans aucun partage ou document. Seul votre export personnel de données (RGPD) les contient.</PrivateBanner>

      <Card>
        <Field label="Date" value={date} onChangeText={setDate} error={error} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" />
        <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={500} /></View>
        <Button label="Noter" icon="lock" style={{ marginTop: spacing.sm }} loading={add.isPending} onPress={submit} />
      </Card>

      {w ? (
        <Card tone="lavender">
          <EstimateTag />
          <Text variant="small" style={{ marginTop: 6 }}>{`Fenêtre fertile estimée : du ${fmt(w.start)} au ${fmt(w.end)}. Des rapports tous les 1 à 2 jours pendant cette période peuvent augmenter les chances, sans aucune garantie.`}</Text>
          {inWindow > 0 ? <Text variant="small" muted style={{ marginTop: 4 }}>{`${inWindow} saisie${inWindow > 1 ? 's' : ''} pendant cette fenêtre estimée.`}</Text> : null}
        </Card>
      ) : null}

      <SectionTitle title="Mes saisies" action={list.length ? (showList ? 'Masquer' : 'Afficher') : undefined} onAction={() => setShowList((v) => !v)} />
      {!list.length ? <Text muted>Aucune saisie.</Text> : !showList ? (
        <Text variant="small" muted>{`${list.length} saisie${list.length > 1 ? 's' : ''}, masquée${list.length > 1 ? 's' : ''} par discrétion.`}</Text>
      ) : (
        <Card>
          {list.slice(0, 60).map((l) => (
            <ListRow key={l.id} icon="heart" title={formatDateFr(l.occurred_on)} subtitle={l.note ?? undefined} right={<IconButton icon="trash-2" label={`Supprimer la saisie du ${formatDateFr(l.occurred_on)}`} onPress={() => remove(l.id)} />} />
          ))}
        </Card>
      )}
      {list.length ? <Button label="Tout supprimer" variant="ghost" icon="trash-2" onPress={removeAll} /> : null}
    </Screen>
  );
}
