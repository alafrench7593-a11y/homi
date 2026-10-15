/**
 * Suivi du poids pendant la grossesse — facultatif et bienveillant.
 * Aucune cible, aucune comparaison, aucune interprétation, aucune recommandation de régime.
 */
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { LineChart } from '@/components/Charts';
import { PremiumGate } from '@/components/Family';
import { Banner, Button, Card, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useActivePregnancy, useInvalidate, useMaternalWeights, useProfile, useUpdateProfile } from '@/lib/data/hooks';
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
  const { data: weights } = useMaternalWeights();
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
    await backend.insert('maternal_weights', { user_id: userId, pregnancy_id: pregnancy?.id ?? null, measured_on: iso, weight_kg: v, note: note.trim() || null, professional_note: pro.trim() || null });
    inv('maternal_weights');
    setKg('');
    setNote('');
    setPro('');
    toast('Mesure enregistrée.');
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer cette mesure ?', 'Cette action est définitive.', 'Supprimer'))) return;
    await backend.remove('maternal_weights', [eq('id', id)]);
    inv('maternal_weights');
  }

  async function exportCsv() {
    const csv = ['date;poids_kg;note;indication_professionnel', ...(weights ?? []).map((w) => `${w.measured_on};${String(w.weight_kg).replace('.', ',')};${(w.note ?? '').replace(/;/g, ',')};${(w.professional_note ?? '').replace(/;/g, ',')}`)].join('\n');
    await Share.share({ message: csv, title: 'Mes mesures de poids' });
  }

  async function stopTracking() {
    if (!(await confirm('Arrêter le suivi du poids ?', 'Toutes vos mesures seront supprimées et le module sera masqué. Vous pourrez le réactiver dans les réglages.', 'Arrêter et supprimer'))) return;
    await backend.remove('maternal_weights', [eq('user_id', userId)]);
    updateProfile.mutate({ hide_weight_module: true });
    inv('maternal_weights');
    toast('Suivi du poids arrêté.');
    router.back();
  }

  const points = (weights ?? []).map((w) => ({ x: new Date(w.measured_on).getTime(), y: Number(w.weight_kg), label: formatDateFr(w.measured_on, false) }));

  return (
    <Screen back title="Mon poids" subtitle="Un suivi pour vous, à votre rythme.">
      <Banner tone="info">{'Il n’existe pas de « bon » poids à atteindre ici. Les évolutions sont propres à chaque personne et à chaque grossesse (y compris multiple). Seul votre professionnel de santé peut vous donner une indication adaptée.'}</Banner>
      {points.length >= 2 ? (
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
        <Button label="Enregistrer" style={{ marginTop: spacing.sm }} onPress={add} />
      </Card>

      <SectionTitle title="Historique" />
      <Card>
        {(weights ?? []).slice().reverse().map((w) => (
          <ListRow key={w.id} title={`${String(w.weight_kg).replace('.', ',')} kg`} subtitle={[formatDateFr(w.measured_on), w.note, w.professional_note ? `Pro : ${w.professional_note}` : null].filter(Boolean).join(' · ')} right={<Button label="Supprimer" size="sm" variant="ghost" onPress={() => remove(w.id)} />} />
        ))}
        {!weights?.length && <Text muted>Aucune mesure.</Text>}
      </Card>

      <PremiumGate feature="Exporter mes mesures">
        <Button label="Exporter (CSV)" variant="secondary" icon="download" onPress={exportCsv} />
      </PremiumGate>

      <Card tone="soft">
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ flex: 1 }}>Masquer ce module partout dans l’application</Text>
          <Toggle label="Masquer le module poids" value={!!profile?.hide_weight_module} onChange={(v) => { updateProfile.mutate({ hide_weight_module: v }); toast(v ? 'Module masqué.' : 'Module affiché.'); }} />
        </Row>
      </Card>
      <Button label="Arrêter le suivi et supprimer mes mesures" variant="ghost" onPress={stopTracking} />
    </Screen>
  );
}
