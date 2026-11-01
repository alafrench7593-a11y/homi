/**
 * Liste « produits à éviter » du foyer (domaine santé) : ajoutée depuis un résultat de scan,
 * signalée à chaque nouveau scan du même code-barres. Ne remplace pas la lecture de l'étiquette.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Field, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useHouseholdId, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export interface AvoidProduct { id: string; household_id: string; child_id: string | null; barcode: string | null; product_name: string; reason: string | null; created_at: string }

export function useAvoidProducts() {
  const hid = useHouseholdId();
  return useRows<AvoidProduct>(['avoid_products', hid ?? ''], hid ? { table: 'avoid_products', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }] } : null);
}

export function useSaveAvoid() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { remove?: string; add?: { barcode: string | null; product_name: string; reason: string | null } }) => {
      if (a.remove) await backend.remove('avoid_products', [eq('id', a.remove)]);
      if (a.add) {
        if (!hid) throw new Error(tr('u2.avoid.need_household'));
        await backend.insert('avoid_products', { ...a.add, household_id: hid });
      }
    },
    onSuccess: () => inv('avoid_products'),
  });
}

/** Bandeau sur un résultat de scan si le produit est dans la liste. */
export function AvoidBanner({ barcode }: { barcode: string | null | undefined }) {
  const { data } = useAvoidProducts();
  const hit = barcode ? data?.find((x) => x.barcode === barcode) : undefined;
  if (!hit) return null;
  return <Banner tone="danger" title={tr('u2.avoid.on_list')}>{`${hit.reason ? `${hit.reason}. ` : ''}${tr('u2.avoid.check_label')}`}</Banner>;
}

export function AvoidButton({ barcode, name }: { barcode: string | null | undefined; name: string }) {
  const toast = useToast();
  const { data } = useAvoidProducts();
  const save = useSaveAvoid();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const hit = barcode ? data?.find((x) => x.barcode === barcode) : data?.find((x) => !x.barcode && x.product_name === name);
  async function add() {
    try {
      await save.mutateAsync({ add: { barcode: barcode ?? null, product_name: name.slice(0, 160), reason: reason.trim() || null } });
      toast(tr('u2.avoid.added'));
      setOpen(false); setReason('');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <>
      <Button label={hit ? tr('u2.avoid.remove') : tr('u2.avoid.avoid')} icon="slash" size="sm" variant="ghost" loading={save.isPending}
        onPress={() => (hit ? save.mutateAsync({ remove: hit.id }).then(() => toast(tr('u2.avoid.removed'))).catch((e) => toast(friendlyError(e), 'error')) : setOpen(true))} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('u2.avoid.add_title')}>
        <View style={{ gap: spacing.sm }}>
          <Text>{name}</Text>
          <Field label={tr('u2.avoid.why')} optional value={reason} onChangeText={setReason} maxLength={300} placeholder={tr('u2.avoid.why_ph')} />
          <Text variant="caption" muted>{tr('u2.avoid.visible')}</Text>
          <Button label={tr('u2.avoid.add')} full onPress={add} loading={save.isPending} />
        </View>
      </Sheet>
    </>
  );
}
