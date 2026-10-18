/** Produits à éviter du foyer : liste partagée (domaine santé), ajoutée depuis un résultat de scan ou à la main. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, IconButton, ListRow, Row } from '@/components/ui';
import { useAvoidProducts, useSaveAvoid } from '@/features/avoidList';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';

export default function AvoidList() {
  const toast = useToast();
  const q = useAvoidProducts();
  const save = useSaveAvoid();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reason, setReason] = useState('');

  async function add() {
    if (!name.trim()) return toast('Indiquez le nom du produit.', 'error');
    if (barcode.trim() && !/^[0-9]{6,14}$/.test(barcode.trim())) return toast('Code-barres : 6 à 14 chiffres.', 'error');
    try {
      await save.mutateAsync({ add: { product_name: name.trim(), barcode: barcode.trim() || null, reason: reason.trim() || null } });
      setName(''); setBarcode(''); setReason('');
      toast('Ajouté.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Produits à éviter" subtitle="Partagés avec le foyer (accès santé).">
      <Banner tone="info">{'Un produit absent de cette liste n’est pas pour autant sans risque. Les compositions changent : vérifiez toujours l’étiquette actuelle, et en cas d’allergie sévère, contactez le fabricant ou un professionnel.'}</Banner>
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="slash" title="Liste vide" body="Ajoutez un produit depuis un résultat de scan, ou ci-dessous." /> : null}
      {(q.data ?? []).map((p, i) => (
        <StaggerItem key={p.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="slash" title={p.product_name} subtitle={[p.barcode ? `EAN ${p.barcode}` : null, p.reason].filter(Boolean).join(' · ') || undefined}
              right={<IconButton icon="trash-2" label={`Retirer ${p.product_name}`} size={18} onPress={async () => { if (await confirm('Retirer ce produit ?', p.product_name, 'Retirer')) save.mutateAsync({ remove: p.id }).then(() => toast('Retiré.')).catch((e) => toast(friendlyError(e), 'error')); }} />} />
          </Card>
        </StaggerItem>
      ))}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label="Produit" value={name} onChangeText={setName} maxLength={160} />
          <Row>
            <View style={{ flex: 1 }}><Field label="Code-barres" optional value={barcode} onChangeText={setBarcode} keyboardType="number-pad" maxLength={14} /></View>
          </Row>
          <Field label="Pourquoi ?" optional value={reason} onChangeText={setReason} maxLength={300} />
          <Button label="Ajouter" icon="plus" onPress={add} loading={save.isPending} />
        </View>
      </Card>
    </Screen>
  );
}
