/**
 * Produits à éviter du foyer : liste partagée (domaine santé), ajoutée depuis un résultat de scan ou à la main.
 * Formulaire en surface mate ; bouton principal dans le pied (visible clavier ouvert, largeur stable, double envoi
 * ignoré) ; « Ajouté » seulement après la réponse du serveur. États : chargement, erreur (réessayer), vide.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Field, ListRow } from '@/components/ui';
import { IconOrb, PrimaryButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { useAvoidProducts, useSaveAvoid } from '@/features/avoidList';
import { friendlyError } from '@/lib/data/hooks-settings';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function AvoidList() {
  const toast = useToast();
  const q = useAvoidProducts();
  const save = useSaveAvoid();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ name?: string; barcode?: string }>({});

  async function add() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = tr('u8.avoid.nameRequired');
    if (barcode.trim() && !/^[0-9]{6,14}$/.test(barcode.trim())) e.barcode = tr('u8.avoid.barcodeFormat');
    setErrors(e);
    if (e.name || e.barcode) return;
    await save.mutateAsync({ add: { product_name: name.trim(), barcode: barcode.trim() || null, reason: reason.trim() || null } });
    setName(''); setBarcode(''); setReason('');
    toast(tr('u8.avoid.added'));
  }

  const footer = (
    <PrimaryButton label={name.trim() ? tr('u8.avoid.addNamed', { name: name.trim().slice(0, 24) }) : tr('u8.avoid.addProduct')} icon="plus" size="lg" full
      onPress={add} testID="avoid-add" />
  );

  return (
    <Screen back title={tr('u8.avoid.title')} subtitle={tr('u8.avoid.subtitle')} footer={footer}>
      {q.data ? (
        <TodaySummary title={tr('u8.avoid.myList')} items={[
          { icon: 'slash', value: String(q.data.length), label: q.data.length > 1 ? tr('u8.avoid.countMany') : tr('u8.avoid.countOne') },
          { icon: 'maximize', value: String(q.data.filter((p) => p.barcode).length), label: tr('u8.avoid.scanned') },
        ]} />
      ) : null}
      <Banner tone="info">{tr('u8.avoid.banner')}</Banner>
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
        <Field label={tr('u8.avoid.product')} value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: undefined }); }} maxLength={160} error={errors.name} testID="avoid-name" />
        <Field label={tr('u8.avoid.barcode')} optional value={barcode} onChangeText={setBarcode} keyboardType="number-pad" maxLength={14} error={errors.barcode} testID="avoid-barcode" />
        <Field label={tr('u8.avoid.why')} optional value={reason} onChangeText={setReason} maxLength={300} testID="avoid-reason" />
      </MatteSurface>
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="slash" title={tr('u8.avoid.empty')} body={tr('u8.avoid.emptyBody')} /> : null}
      {q.data?.length ? (
        <MatteSurface radius={radius.lg} testID="avoid-list">
          {q.data.map((p, i) => (
            <StaggerItem key={p.id} index={i}>
              <ListRow icon="slash" title={p.product_name} subtitle={[p.barcode ? `EAN ${p.barcode}` : null, p.reason].filter(Boolean).join(' · ') || undefined}
                right={(
                  <View>
                    <IconOrb icon="trash-2" size="sm" label={tr('u8.avoid.remove', { name: p.product_name })} onPress={async () => {
                      if (await confirm(tr('u8.avoid.removeQ'), p.product_name, tr('u8.avoid.removeBtn'))) {
                        save.mutateAsync({ remove: p.id }).then(() => toast(tr('u8.avoid.removed'))).catch((e) => toast(friendlyError(e), 'error'));
                      }
                    }} />
                  </View>
                )} />
            </StaggerItem>
          ))}
        </MatteSurface>
      ) : null}
    </Screen>
  );
}
