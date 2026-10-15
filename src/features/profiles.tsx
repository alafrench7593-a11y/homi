/** Formulaires et créations « grossesse » et « enfant » (onboarding + ajout ultérieur). */
import React, { useState } from 'react';
import { View } from 'react-native';
import { backend } from '@/lib/backend';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { babiesCount, dueDateFromLmp, multiplicityLabel, type Multiplicity, validateDueDate } from '@/lib/domain/pregnancy';
import type { Child, ChecklistKind, Pregnancy } from '@/lib/types';
import { Chip, Field, Row, Segmented, Text } from '@/components/ui';
import { CHECKLIST_TEMPLATES } from '@/content/checklists';
import { spacing } from '@/theme/tokens';
import { toFrDate } from '@/lib/validation';

export interface PregnancyDraft {
  dateMode: 'due' | 'lmp';
  date: string; // JJ/MM/AAAA
  multiplicity: Multiplicity;
  nicknames: string[];
  topics: string[];
}

export const emptyPregnancy = (): PregnancyDraft => ({ dateMode: 'due', date: '', multiplicity: 'single', nicknames: ['', '', '', ''], topics: [] });

export const PREGNANCY_TOPICS = ['Accouchement', 'Allaitement', 'Alimentation', 'Émotions', 'Sommeil', 'Préparer les aînés', 'Démarches', 'Après la naissance'];

export function validatePregnancy(d: PregnancyDraft): { errors: Record<string, string>; due?: string; lmp?: string | null } {
  const iso = frToISO(d.date);
  if (!iso) return { errors: { date: 'Format attendu : JJ/MM/AAAA.' } };
  if (d.dateMode === 'lmp') {
    if (iso > todayISO()) return { errors: { date: 'La date des dernières règles ne peut pas être dans le futur.' } };
    const due = dueDateFromLmp(iso);
    const err = validateDueDate(due);
    return err ? { errors: { date: err } } : { errors: {}, due, lmp: iso };
  }
  const err = validateDueDate(iso);
  return err ? { errors: { date: err } } : { errors: {}, due: iso, lmp: null };
}

export function PregnancyForm({ value, onChange, errors }: { value: PregnancyDraft; onChange: (v: PregnancyDraft) => void; errors: Record<string, string> }) {
  const set = <K extends keyof PregnancyDraft>(k: K, v: PregnancyDraft[K]) => onChange({ ...value, [k]: v });
  const n = babiesCount(value.multiplicity);
  return (
    <View style={{ gap: spacing.md }}>
      <Segmented
        label="Date connue"
        value={value.dateMode}
        onChange={(v) => set('dateMode', v)}
        options={[{ value: 'due', label: 'Date prévue du terme' }, { value: 'lmp', label: 'Date des dernières règles' }]}
      />
      <Field
        label={value.dateMode === 'due' ? 'Date prévue d’accouchement' : 'Premier jour des dernières règles'}
        placeholder="JJ/MM/AAAA"
        keyboardType="numbers-and-punctuation"
        value={value.date}
        onChangeText={(v) => set('date', v)}
        error={errors.date}
        hint={value.dateMode === 'due'
          ? 'Celle indiquée par votre sage-femme ou votre médecin. Elle sert à adapter les semaines et les contenus.'
          : 'Le terme sera estimé à 41 semaines d’aménorrhée (convention française). Vous pourrez le corriger après l’échographie.'}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Combien de bébés ?</Text>
        <Row wrap>
          {(['single', 'twins', 'triplets', 'unknown'] as Multiplicity[]).map((m) => (
            <Chip key={m} label={multiplicityLabel(m)} selected={value.multiplicity === m} onPress={() => set('multiplicity', m)} />
          ))}
        </Row>
      </View>
      {Array.from({ length: n }, (_, i) => (
        <Field
          key={i}
          label={n > 1 ? `Prénom ou surnom du bébé ${i + 1}` : 'Prénom ou surnom du bébé'}
          optional
          value={value.nicknames[i]}
          onChangeText={(v) => set('nicknames', value.nicknames.map((x, j) => (j === i ? v : x)))}
          placeholder={n > 1 ? ['Petite Lune', 'Petit Soleil', 'Petite Étoile'][i] : 'Petit Haricot'}
          maxLength={40}
        />
      ))}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Les sujets qui vous intéressent <Text variant="small" muted>(facultatif)</Text></Text>
        <Row wrap>
          {PREGNANCY_TOPICS.map((tp) => (
            <Chip key={tp} label={tp} tone="lavender" selected={value.topics.includes(tp)} onPress={() => set('topics', value.topics.includes(tp) ? value.topics.filter((x) => x !== tp) : [...value.topics, tp])} />
          ))}
        </Row>
      </View>
    </View>
  );
}

export async function createPregnancy(householdId: string, userId: string, d: PregnancyDraft): Promise<Pregnancy> {
  const v = validatePregnancy(d);
  if (!v.due) throw new Error(Object.values(v.errors)[0]);
  const [p] = await backend.insert<Pregnancy>('pregnancies', {
    household_id: householdId, carrier_user_id: userId, due_date: v.due, lmp_date: v.lmp, due_date_source: d.dateMode === 'lmp' ? 'lmp' : 'due_date',
    multiplicity: d.multiplicity, status: 'active', topics: d.topics,
  });
  const n = babiesCount(d.multiplicity);
  await backend.insert('expected_babies', Array.from({ length: n }, (_, i) => ({ pregnancy_id: p.id, household_id: householdId, position: i + 1, nickname: d.nicknames[i]?.trim() || null })));
  // Listes de préparation de base (modifiables ensuite)
  const kinds: Exclude<ChecklistKind, 'custom'>[] = ['maternity_bag', 'admin', ...(n > 1 ? (['multiples'] as const) : [])];
  for (const kind of kinds) {
    try {
      const tpl = CHECKLIST_TEMPLATES[kind];
      const [list] = await backend.insert<{ id: string }>('checklists', { household_id: householdId, pregnancy_id: p.id, kind, title: tpl.title });
      await backend.insert('checklist_items', tpl.items.map((label, i) => ({ checklist_id: list.id, household_id: householdId, label, position: i })));
    } catch {
      // limite de la version gratuite atteinte : les listes peuvent être créées plus tard
    }
  }
  return p;
}

export interface ChildDraft { first_name: string; birth_date: string; sex: 'female' | 'male' | 'unspecified' | null; tracking: string[]; allergies: string }
export const emptyChild = (): ChildDraft => ({ first_name: '', birth_date: '', sex: null, tracking: ['breastfeed', 'bottle', 'diaper', 'sleep', 'growth'], allergies: '' });

export const TRACKING_OPTIONS: { key: string; label: string }[] = [
  { key: 'breastfeed', label: 'Allaitement' }, { key: 'bottle', label: 'Biberons' }, { key: 'diaper', label: 'Couches' },
  { key: 'sleep', label: 'Sommeil' }, { key: 'meal', label: 'Repas' }, { key: 'growth', label: 'Taille & poids' },
];

export function validateChild(d: ChildDraft): { errors: Record<string, string>; birth?: string } {
  const errors: Record<string, string> = {};
  if (!d.first_name.trim()) errors.first_name = 'Indiquez un prénom ou un surnom.';
  const iso = frToISO(d.birth_date);
  if (!iso) errors.birth_date = 'Format attendu : JJ/MM/AAAA.';
  else if (iso > todayISO()) errors.birth_date = 'La date de naissance ne peut pas être dans le futur.';
  else if (iso < addDays(todayISO(), -365 * 12)) errors.birth_date = 'Le suivi est prévu jusqu’à 10 ans.';
  return { errors, birth: iso ?? undefined };
}

export function ChildForm({ value, onChange, errors }: { value: ChildDraft; onChange: (v: ChildDraft) => void; errors: Record<string, string> }) {
  const set = <K extends keyof ChildDraft>(k: K, v: ChildDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <View style={{ gap: spacing.md }}>
      <Field label="Prénom ou surnom" value={value.first_name} onChangeText={(v) => set('first_name', v)} error={errors.first_name} maxLength={40} autoCapitalize="words" />
      <Field label="Date de naissance" placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" value={value.birth_date} onChangeText={(v) => set('birth_date', v)} error={errors.birth_date} hint="Elle permet d’adapter les conseils et les repères à son âge." />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Sexe <Text variant="small" muted>(facultatif — seulement si vous le souhaitez)</Text></Text>
        <Row wrap>
          {([['female', 'Fille'], ['male', 'Garçon'], ['unspecified', 'Je préfère ne pas préciser']] as const).map(([k, l]) => (
            <Chip key={k} label={l} selected={value.sex === k} onPress={() => set('sex', value.sex === k ? null : k)} />
          ))}
        </Row>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Ce que vous souhaitez suivre</Text>
        <Row wrap>
          {TRACKING_OPTIONS.map((o) => (
            <Chip key={o.key} label={o.label} tone="lavender" selected={value.tracking.includes(o.key)} onPress={() => set('tracking', value.tracking.includes(o.key) ? value.tracking.filter((x) => x !== o.key) : [...value.tracking, o.key])} />
          ))}
        </Row>
      </View>
      <Field label="Allergies déclarées par un professionnel" optional value={value.allergies} onChangeText={(v) => set('allergies', v)} placeholder="ex. arachide, lait" hint="Séparées par des virgules. Utilisées pour le scanner de produits." />
    </View>
  );
}

export async function createChild(householdId: string, d: ChildDraft): Promise<Child> {
  const v = validateChild(d);
  if (!v.birth) throw new Error(Object.values(v.errors)[0]);
  const [c] = await backend.insert<Child>('children', {
    household_id: householdId, first_name: d.first_name.trim(), birth_date: v.birth, sex: d.sex, enabled_tracking: d.tracking,
    allergies_declared: d.allergies.split(',').map((a) => a.trim()).filter(Boolean),
  });
  return c;
}

export function childToDraft(c: Child): ChildDraft {
  return { first_name: c.first_name, birth_date: toFrDate(c.birth_date), sex: c.sex, tracking: c.enabled_tracking, allergies: c.allergies_declared.join(', ') };
}
