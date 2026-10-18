/**
 * Vaccins : registre de ce qui a été fait (date, vaccin, dose, lot, par qui, source), pour retrouver
 * l'information facilement. Le calendrier officiel est consulté à sa source (ministère de la Santé) :
 * l'application ne recalcule pas les échéances et ne remplace pas le carnet de santé.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, ListRow, Row, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

const OFFICIAL = 'https://sante.gouv.fr/prevention-en-sante/preserver-sa-sante/vaccination/calendrier-vaccinal';
interface Vaccination { id: string; vaccine: string; given_on: string; dose_label: string | null; lot: string | null; given_by: string | null; source: 'parent' | 'carnet' | 'professional'; note: string | null }
const SOURCE = { carnet: 'Recopié du carnet de santé', professional: 'Indiqué par le professionnel', parent: 'Noté par le parent' } as const;

export default function Vaccines() {
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const q = useRows<Vaccination>(['child_vaccinations', id ?? ''], id ? { table: 'child_vaccinations', filters: [eq('child_id', id)], order: [{ col: 'given_on', asc: false }] } : null);
  const [d, setD] = useState<{ id?: string; vaccine: string; date: string; dose: string; lot: string; by: string; source: Vaccination['source']; note: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!child || !d) return;
    const iso = frToISO(d.date);
    if (!d.vaccine.trim()) return toast('Indiquez le vaccin.', 'error');
    if (!iso || iso > todayISO()) return toast('Date invalide (jj/mm/aaaa, pas dans le futur).', 'error');
    const row = { vaccine: d.vaccine.trim(), given_on: iso, dose_label: d.dose.trim() || null, lot: d.lot.trim() || null, given_by: d.by.trim() || null, source: d.source, note: d.note.trim() || null };
    setBusy(true);
    try {
      if (d.id) await backend.update('child_vaccinations', row, [eq('id', d.id)]);
      else await backend.insert('child_vaccinations', { ...row, child_id: child.id, household_id: child.household_id });
      inv('child_vaccinations');
      toast('Vaccin enregistré.');
      setD(null);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove(v: Vaccination) {
    if (!(await confirm('Supprimer cette ligne ?', `${v.vaccine} — ${toFrDate(v.given_on)}`, 'Supprimer'))) return;
    try { await backend.remove('child_vaccinations', [eq('id', v.id)]); inv('child_vaccinations'); toast('Supprimé.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Vaccins" subtitle={child ? `${child.first_name} — ce qui a été fait` : undefined} right={<IconButton icon="plus" label="Ajouter un vaccin" onPress={() => setD({ vaccine: '', date: toFrDate(todayISO()), dose: '', lot: '', by: '', source: 'carnet', note: '' })} />}>
      <Banner tone="info" title="Le calendrier officiel">
        <Text variant="small">Les vaccins recommandés et obligatoires dépendent de l’âge et évoluent chaque année. Consultez le calendrier en vigueur et le carnet de santé, et parlez-en à votre médecin.</Text>
        <Button label="Calendrier vaccinal (ministère de la Santé)" size="sm" variant="ghost" icon="external-link" onPress={() => void Linking.openURL(OFFICIAL)} style={{ alignSelf: 'flex-start' }} />
      </Banner>
      {q.isLoading && !q.data ? <Skeleton rows={3} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="shield" title="Aucun vaccin noté" body="Recopiez-les depuis le carnet de santé pour les retrouver facilement." action={{ label: 'Ajouter', onPress: () => setD({ vaccine: '', date: toFrDate(todayISO()), dose: '', lot: '', by: '', source: 'carnet', note: '' }) }} /> : null}
      {(q.data ?? []).map((v, i) => (
        <StaggerItem key={v.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="shield" title={`${v.vaccine}${v.dose_label ? ` · ${v.dose_label}` : ''}`} subtitle={[toFrDate(v.given_on), v.given_by, v.lot ? `lot ${v.lot}` : null, SOURCE[v.source]].filter(Boolean).join(' · ')}
              onPress={() => setD({ id: v.id, vaccine: v.vaccine, date: toFrDate(v.given_on), dose: v.dose_label ?? '', lot: v.lot ?? '', by: v.given_by ?? '', source: v.source, note: v.note ?? '' })}
              right={<IconButton icon="trash-2" label={`Supprimer ${v.vaccine}`} size={18} onPress={() => remove(v)} />} />
          </Card>
        </StaggerItem>
      ))}
      <Button label="Prévoir un rendez-vous de vaccination" variant="secondary" icon="calendar" onPress={() => router.push('/appointments')} />

      <Sheet visible={!!d} onClose={() => setD(null)} title={d?.id ? 'Modifier' : 'Ajouter un vaccin'}>
        {d ? (
          <View style={{ gap: spacing.sm }}>
            <Field label="Vaccin" value={d.vaccine} onChangeText={(v) => setD({ ...d, vaccine: v })} maxLength={120} placeholder="Tel qu’écrit dans le carnet" />
            <Field label="Date" value={d.date} onChangeText={(v) => setD({ ...d, date: v })} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
            <Field label="Injection" optional value={d.dose} onChangeText={(v) => setD({ ...d, dose: v })} maxLength={60} placeholder="1re injection, rappel…" />
            <Field label="Numéro de lot" optional value={d.lot} onChangeText={(v) => setD({ ...d, lot: v })} maxLength={40} />
            <Field label="Par" optional value={d.by} onChangeText={(v) => setD({ ...d, by: v })} maxLength={120} placeholder="Pédiatre, PMI…" />
            <Row wrap>{(Object.keys(SOURCE) as Vaccination['source'][]).map((k) => <Chip key={k} label={SOURCE[k]} selected={d.source === k} onPress={() => setD({ ...d, source: k })} />)}</Row>
            <Field label="Note" optional value={d.note} onChangeText={(v) => setD({ ...d, note: v })} maxLength={1000} />
            <Button label="Enregistrer" full onPress={save} loading={busy} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
