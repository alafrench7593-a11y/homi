/**
 * Formulaire d'un stock (ajout et modification) : produit, catégorie, marque, taille, quantité ESTIMÉE (facultative :
 * jamais devinée), unité, seuil, fréquence, responsable, rappel, enfant associé. L'animal associé est prévu (pet_id)
 * mais le module animaux n'existe pas encore : l'écran l'annonce sans champ.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Field, Text, Toggle } from '@/components/ui';
import { CategoryChips } from './StockCard';
import { STOCK_UNITS, type Stock, type StockCategory, type StockUnit } from '@/lib/domain/stocks';
import type { StockInput } from '@/lib/data/hooks-stocks';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const parseNum = (v: string): number | null | 'bad' => {
  if (!v.trim()) return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : 'bad';
};
const str = (v: number | string | null | undefined) => (v == null ? '' : String(Number(v)).replace('.', ','));

export function StockForm({ initial, people, children, busy, submitLabel, onSubmit, defaultCategory }: {
  initial?: Stock | null; people: { id: string; label: string }[]; children: { id: string; first_name: string }[]; busy?: boolean; submitLabel: string;
  onSubmit: (v: StockInput) => void; defaultCategory?: StockCategory;
}) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [category, setCategory] = useState<StockCategory>(initial?.category ?? defaultCategory ?? 'other');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [size, setSize] = useState(initial?.size ?? '');
  const [qty, setQty] = useState(str(initial?.qty_estimate));
  const [unit, setUnit] = useState<StockUnit | null>(initial?.unit ?? null);
  const [threshold, setThreshold] = useState(str(initial?.threshold));
  const [freq, setFreq] = useState(initial?.frequency_days ? String(initial.frequency_days) : '');
  const [responsible, setResponsible] = useState<string | null>(initial?.responsible_id ?? null);
  const [reminder, setReminder] = useState(initial?.reminder ?? true);
  const [child, setChild] = useState<string | null>(initial?.child_id ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    if (!label.trim()) e.label = tr('stk.form.labelRequired');
    const q = parseNum(qty); const th = parseNum(threshold); const f = parseNum(freq);
    if (q === 'bad') e.qty = tr('stk.err.qty');
    if (th === 'bad') e.threshold = tr('stk.err.qty');
    if (f === 'bad' || (typeof f === 'number' && (f < 1 || f > 365 || !Number.isInteger(f)))) e.freq = tr('stk.form.freqInvalid');
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      label: label.trim().slice(0, 80), category, brand: brand.trim() || null, size: size.trim() || null, qty_estimate: q as number | null, unit,
      threshold: th as number | null, frequency_days: f as number | null, responsible_id: responsible, reminder, child_id: child, notes: notes.trim() || null,
    });
  }

  return (
    <View style={{ gap: spacing.sm }} testID="stock-form">
      <Field label={tr('stk.form.label')} value={label} onChangeText={setLabel} maxLength={80} error={errors.label} placeholder={tr('stk.form.labelPh')} testID="stock-label" />
      <Text variant="label">{tr('stk.form.category')}</Text>
      <CategoryChips value={category} onChange={setCategory} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('stk.form.brand')} optional value={brand} onChangeText={setBrand} maxLength={60} testID="stock-brand" /></View>
        <View style={{ flex: 1 }}><Field label={tr('stk.form.size')} optional value={size} onChangeText={setSize} maxLength={40} placeholder={tr('stk.form.sizePh')} testID="stock-size" /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('stk.form.qty')} optional value={qty} onChangeText={setQty} keyboardType="decimal-pad" error={errors.qty} testID="stock-qty" /></View>
        <View style={{ flex: 1 }}><Field label={tr('stk.form.threshold')} optional value={threshold} onChangeText={setThreshold} keyboardType="decimal-pad" error={errors.threshold} testID="stock-threshold" /></View>
      </View>
      <Text variant="caption" muted>{tr('stk.form.estimateHint')}</Text>
      <Text variant="label">{tr('stk.form.unit')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STOCK_UNITS.map((u) => <Chip key={u} label={tr(`stk.un.${u}` as TKey)} selected={unit === u} onPress={() => setUnit(unit === u ? null : u)} testID={`stock-unit-${u}`} />)}
      </View>
      <Field label={tr('stk.form.freq')} optional value={freq} onChangeText={setFreq} keyboardType="number-pad" error={errors.freq} hint={tr('stk.form.freqHint')} testID="stock-freq" />
      <Text variant="label">{tr('stk.form.responsible')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label={tr('stk.form.nobody')} selected={!responsible} onPress={() => setResponsible(null)} testID="stock-resp-none" />
        {people.map((p) => <Chip key={p.id} label={p.label} selected={responsible === p.id} onPress={() => setResponsible(p.id)} testID={`stock-resp-${p.id}`} />)}
      </View>
      <Toggle label={tr('stk.form.reminder')} value={reminder} onChange={setReminder} />
      {children.length ? (
        <>
          <Text variant="label">{tr('stk.form.child')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip label={tr('stk.form.noChild')} selected={!child} onPress={() => setChild(null)} />
            {children.map((c) => <Chip key={c.id} label={c.first_name} selected={child === c.id} onPress={() => setChild(c.id)} />)}
          </View>
        </>
      ) : null}
      <Text variant="caption" muted>{tr('stk.form.petSoon')}</Text>
      <Field label={tr('stk.form.notes')} optional value={notes} onChangeText={setNotes} maxLength={300} multiline />
      <Button label={submitLabel} icon="check" loading={busy} onPress={submit} testID="stock-save" />
    </View>
  );
}
