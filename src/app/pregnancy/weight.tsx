/**
 * Suivi du poids pendant la grossesse — facultatif et bienveillant.
 * Aucune cible, aucune comparaison, aucune interprétation, aucune recommandation de régime.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { LineChart } from '@/components/Charts';
import { PremiumGate } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useActivePregnancy, useInvalidate, useMaternalWeights, useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';
import { toFrDate } from '@/lib/validation';

export default function WeightScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const pregnancy = useActivePregnancy();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const insets = useSafeAreaInsets();
  const weightsQ = useMaternalWeights();
  const { data: weights } = weightsQ;
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setBusy(null);
    }
  }
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [kg, setKg] = useState('');
  const [note, setNote] = useState('');
  const [pro, setPro] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function add() {
    const iso = frToISO(date);
    const v = Number(kg.replace(',', '.'));
    const e: Record<string, string> = {};
    if (!iso || iso > todayISO()) e.date = 'Date invalide (JJ/MM/AAAA, pas dans le futur).';
    if (!Number.isFinite(v) || v < 25 || v > 300) e.kg = 'Valeur attendue entre 25 et 300 kg.';
    setErrors(e);
    if (Object.keys(e).length) return;
    await run('add', async () => {
      await insertOrQueue('maternal_weights', { user_id: userId, pregnancy_id: pregnancy?.id ?? null, measured_on: iso, weight_kg: v, note: note.trim() || null, professional_note: pro.trim() || null });
      inv('maternal_weights');
      setKg('');
      setNote('');
      setPro('');
      toast('Mesure enregistrée.');
    });
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer cette mesure ?', 'Cette action est définitive.', 'Supprimer'))) return;
    await run(`del-${id}`, async () => {
      await backend.remove('maternal_weights', [eq('id', id)]);
      inv('maternal_weights');
    });
  }

  async function exportCsv() {
    if (!weights?.length) return toast('Aucune mesure à exporter pour l’instant.', 'info');
    const csv = ['date;poids_kg;note;indication_professionnel', ...weights.map((w) => `${w.measured_on};${String(w.weight_kg).replace('.', ',')};${(w.note ?? '').replace(/;/g, ',')};${(w.professional_note ?? '').replace(/;/g, ',')}`)].join('\n');
    await run('export', async () => {
      await Share.share({ message: csv, title: 'Mes mesures de poids' });
    });
  }

  async function setHidden(v: boolean) {
    await run('hide', async () => {
      await updateProfile.mutateAsync({ hide_weight_module: v });
      toast(v ? 'Module masqué.' : 'Module affiché.');
    });
  }

  async function stopTracking() {
    if (!(await confirm('Arrêter le suivi du poids ?', 'Toutes vos mesures seront supprimées et le module sera masqué. Vous pourrez le réactiver dans les réglages.', 'Arrêter et supprimer'))) return;
    await run('stop', async () => {
      await backend.remove('maternal_weights', [eq('user_id', userId)]);
      inv('maternal_weights');
      await updateProfile.mutateAsync({ hide_weight_module: true });
      toast('Suivi du poids arrêté.');
      router.back();
    });
  }

  const points = (weights ?? []).map((w) => ({ x: new Date(w.measured_on).getTime(), y: Number(w.weight_kg), label: formatDateFr(w.measured_on, false) }));

  const loading = weightsQ.isLoading && !weights;
  const failed = weightsQ.isError && !weights;
  const history = (weights ?? []).slice().reverse();

  return (
    <Screen back title="Mon poids" subtitle="Un suivi pour vous, à votre rythme." scroll={false} padded={false}>
      <VirtualList
        data={loading || failed ? [] : history}
        keyExtractor={(w) => w.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info">{'Il n’existe pas de « bon » poids à atteindre ici. Les évolutions sont propres à chaque personne et à chaque grossesse (y compris multiple). Seul votre professionnel de santé peut vous donner une indication adaptée.'}</Banner>
            {loading ? <Skeleton kind="card" rows={1} /> : failed ? (
              <ErrorView error={weightsQ.error} onRetry={() => void weightsQ.refetch()} title="Impossible d’afficher vos mesures" />
            ) : points.length >= 2 ? (
              <Card><Text weight="bold">Mes mesures</Text><LineChart points={points} unit="kg" accessibilityLabel="Évolution de mes mesures de poids" formatX={(x) => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} /></Card>
            ) : (
              <Card tone="soft"><Text muted>Ajoutez au moins deux mesures pour afficher le graphique.</Text></Card>
            )}

            <SectionTitle title="Ajouter une mesure" />
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 3 }}><Field label="Date" value={date} onChangeText={setDate} error={errors.date} keyboardType="numbers-and-punctuation" /></View>
                <View style={{ flex: 2 }}><Field label="Poids" value={kg} onChangeText={setKg} keyboardType="decimal-pad" suffix="kg" error={errors.kg} /></View>
              </Row>
              <Field label="Note personnelle" optional value={note} onChangeText={setNote} />
              <Field label="Indication donnée par mon professionnel" optional value={pro} onChangeText={setPro} hint="Par exemple ce qu’il vous a dit lors du dernier rendez-vous." />
              <Button label="Enregistrer" style={{ marginTop: spacing.sm }} loading={busy === 'add'} onPress={add} />
            </Card>

            <SectionTitle title="Historique" />
            {loading ? <Skeleton rows={2} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : <EmptyState icon="trending-up" title="Aucune mesure" body="Ajoutez une mesure ci-dessus quand vous le souhaitez : rien n’est obligatoire." />}
        renderItem={({ item: w }) => (
          <Card style={{ paddingVertical: spacing.xs }}>
            <ListRow title={`${String(w.weight_kg).replace('.', ',')} kg`} subtitle={[formatDateFr(w.measured_on), w.note, w.professional_note ? `Pro : ${w.professional_note}` : null].filter(Boolean).join(' · ')} right={<Button label="Supprimer" size="sm" variant="ghost" loading={busy === `del-${w.id}`} accessibilityLabel={`Supprimer la mesure du ${formatDateFr(w.measured_on)}`} onPress={() => remove(w.id)} />} />
          </Card>
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <PremiumGate feature="Exporter mes mesures">
              <Button label="Exporter (CSV)" variant="secondary" icon="download" loading={busy === 'export'} onPress={exportCsv} />
            </PremiumGate>

            <Card tone="soft">
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ flex: 1 }}>Masquer ce module partout dans l’application</Text>
                <Toggle label="Masquer le module poids" value={!!profile?.hide_weight_module} onChange={(v) => void setHidden(v)} />
              </Row>
            </Card>
            <Button label="Arrêter le suivi et supprimer mes mesures" variant="ghost" loading={busy === 'stop'} onPress={stopTracking} />
          </View>
        )}
      />
    </Screen>
  );
}
