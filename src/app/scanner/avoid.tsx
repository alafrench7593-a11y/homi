/** Produits à éviter du foyer : liste partagée (domaine santé), ajoutée depuis un résultat de scan ou à la main. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Card, Field, IconButton, ListRow, Row } from '@/components/ui';
import { useAvoidProducts, useSaveAvoid } from '@/features/avoidList';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function AvoidList() {
  const toast = useToast();
  const q = useAvoidProducts();
  const save = useSaveAvoid();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reason, setReason] = useState('');

  async function add() {
    if (!name.trim()) return toast(tr('u8.avoid.nameRequired'), 'error');
    if (barcode.trim() && !/^[0-9]{6,14}$/.test(barcode.trim())) return toast(tr('u8.avoid.barcodeFormat'), 'error');
    try {
      await save.mutateAsync({ add: { product_name: name.trim(), barcode: barcode.trim() || null, reason: reason.trim() || null } });
      setName(''); setBarcode(''); setReason('');
      toast(tr('u8.avoid.added'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u8.avoid.title')} subtitle={tr('u8.avoid.subtitle')}
      action={{ label: name.trim() ? tr('u8.avoid.addNamed', { name: name.trim().slice(0, 24) }) : tr('u8.avoid.addProduct'), icon: 'plus', onPress: add, disabled: save.isPending, testID: 'avoid-add' }}>
      {q.data ? (
        <TodaySummary title={tr('u8.avoid.myList')} items={[
          { icon: 'slash', value: String(q.data.length), label: q.data.length > 1 ? tr('u8.avoid.countMany') : tr('u8.avoid.countOne') },
          { icon: 'maximize', value: String(q.data.filter((p) => p.barcode).length), label: tr('u8.avoid.scanned') },
        ]} />
      ) : null}
      <Banner tone="info">{tr('u8.avoid.banner')}</Banner>
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="slash" title={tr('u8.avoid.empty')} body={tr('u8.avoid.emptyBody')} /> : null}
      {(q.data ?? []).map((p, i) => (
        <StaggerItem key={p.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="slash" title={p.product_name} subtitle={[p.barcode ? `EAN ${p.barcode}` : null, p.reason].filter(Boolean).join(' · ') || undefined}
              right={<IconButton icon="trash-2" label={tr('u8.avoid.remove', { name: p.product_name })} size={18} onPress={async () => { if (await confirm(tr('u8.avoid.removeQ'), p.product_name, tr('u8.avoid.removeBtn'))) save.mutateAsync({ remove: p.id }).then(() => toast(tr('u8.avoid.removed'))).catch((e) => toast(friendlyError(e), 'error')); }} />} />
          </Card>
        </StaggerItem>
      ))}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('u8.avoid.product')} value={name} onChangeText={setName} maxLength={160} />
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('u8.avoid.barcode')} optional value={barcode} onChangeText={setBarcode} keyboardType="number-pad" maxLength={14} /></View>
          </Row>
          <Field label={tr('u8.avoid.why')} optional value={reason} onChangeText={setReason} maxLength={300} />
        </View>
      </Card>
    </Screen>
  );
}
