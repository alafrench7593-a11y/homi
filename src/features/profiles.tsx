/** Formulaires et créations « grossesse » et « enfant » (onboarding + ajout ultérieur). */
import React, { useState } from 'react';
import { View } from 'react-native';
import { backend } from '@/lib/backend';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { babiesCount, dueDateFromLmp, type Multiplicity, validateDueDate } from '@/lib/domain/pregnancy';
import type { Child, ChecklistKind, Pregnancy } from '@/lib/types';
import { Chip, Field, Row, Text } from '@/components/ui';
import { CHECKLIST_TEMPLATES } from '@/content/checklists';
import { spacing } from '@/theme/tokens';
import { toFrDate } from '@/lib/validation';
import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export interface PregnancyDraft {
  /** due : terme indiqué ; lmp : dernières règles ; conception : date de début de grossesse (terme = + 39 semaines, soit 41 SA) */
  dateMode: 'due' | 'lmp' | 'conception';
  date: string; // JJ/MM/AAAA
  multiplicity: Multiplicity;
  nicknames: string[];
  topics: string[];
}

export const emptyPregnancy = (): PregnancyDraft => ({ dateMode: 'due', date: '', multiplicity: 'single', nicknames: ['', '', '', ''], topics: [] });

/** Valeurs enregistrées (françaises) ; l'affichage passe par topicLabel(). */
export const PREGNANCY_TOPICS = ['Accouchement', 'Allaitement', 'Alimentation', 'Émotions', 'Sommeil', 'Préparer les aînés', 'Démarches', 'Après la naissance'];

const TOPIC_KEYS: Record<string, string> = { 'Accouchement': 'u2.profiles.topic_birth', 'Allaitement': 'u2.profiles.topic_breastfeeding', 'Alimentation': 'u2.profiles.topic_food', 'Émotions': 'u2.profiles.topic_emotions', 'Sommeil': 'u2.profiles.topic_sleep', 'Préparer les aînés': 'u2.profiles.topic_elder', 'Démarches': 'u2.profiles.topic_admin', 'Après la naissance': 'u2.profiles.topic_after' };
const topicLabel = (tp: string) => (TOPIC_KEYS[tp] ? tr(TOPIC_KEYS[tp] as never) : tp);

export function validatePregnancy(d: PregnancyDraft): { errors: Record<string, string>; due?: string; lmp?: string | null } {
  const iso = frToISO(d.date);
  if (!iso) return { errors: { date: tr('u2.profiles.format_date') } };
  if (d.dateMode === 'conception') {
    if (iso > todayISO()) return { errors: { date: tr('u2.profiles.conception_future') } };
    // Convention française : 2 semaines entre le début des dernières règles et la conception (41 SA = 39 SG)
    const lmp = addDays(iso, -14);
    const due = dueDateFromLmp(lmp);
    const err = validateDueDate(due);
    return err ? { errors: { date: err } } : { errors: {}, due, lmp };
  }
  if (d.dateMode === 'lmp') {
    if (iso > todayISO()) return { errors: { date: tr('u2.profiles.lmp_future') } };
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
  const setMode = (m: PregnancyDraft['dateMode']) => set('dateMode', m);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u2.profiles.known_date')}</Text>
        <Row wrap>
          {([['due', tr('u2.profiles.m_due')], ['lmp', tr('u2.profiles.m_lmp')], ['conception', tr('u2.profiles.m_conception')]] as const).map(([k, l]) => (
            <Chip key={k} label={l} selected={value.dateMode === k} onPress={() => setMode(k)} testID={`preg-date-mode-${k}`} />
          ))}
        </Row>
      </View>
      <Field
        label={value.dateMode === 'due' ? tr('u2.profiles.l_due') : value.dateMode === 'lmp' ? tr('u2.profiles.l_lmp') : tr('u2.profiles.l_conception')}
        testID="preg-date"
        placeholder={tr('u2.profiles.date_ph')}
        keyboardType="numbers-and-punctuation"
        value={value.date}
        onChangeText={(v) => set('date', v)}
        error={errors.date}
        hint={value.dateMode === 'due'
          ? tr('u2.profiles.h_due')
          : value.dateMode === 'lmp'
            ? tr('u2.profiles.h_lmp')
            : tr('u2.profiles.h_conception')}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u2.profiles.how_many')}</Text>
        <Row wrap>
          {(['single', 'twins', 'triplets', 'unknown'] as Multiplicity[]).map((m) => (
            <Chip key={m} label={tr(`u2.preg.mult_${m}` as never)} selected={value.multiplicity === m} onPress={() => set('multiplicity', m)} />
          ))}
        </Row>
      </View>
      {Array.from({ length: n }, (_, i) => (
        <Field
          key={i}
          label={n > 1 ? tr('u2.profiles.baby_name_n', { n: i + 1 }) : tr('u2.profiles.baby_name')}
          optional
          value={value.nicknames[i]}
          onChangeText={(v) => set('nicknames', value.nicknames.map((x, j) => (j === i ? v : x)))}
          placeholder={n > 1 ? [tr('u2.profiles.ph_moon'), tr('u2.profiles.ph_sun'), tr('u2.profiles.ph_star')][i] : tr('u2.profiles.ph_bean')}
          maxLength={40}
        />
      ))}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u2.profiles.topics')} <Text variant="small" muted>{tr('u2.profiles.optional')}</Text></Text>
        <Row wrap>
          {PREGNANCY_TOPICS.map((tp) => (
            <Chip key={tp} label={topicLabel(tp)} tone="lavender" selected={value.topics.includes(tp)} onPress={() => set('topics', value.topics.includes(tp) ? value.topics.filter((x) => x !== tp) : [...value.topics, tp])} />
          ))}
        </Row>
      </View>
    </View>
  );
}

/** Listes de préparation de base d'une NOUVELLE grossesse (modifiables ensuite ; jamais reprises d'une ancienne). */
export async function createPregnancyChecklists(householdId: string, pregnancyId: string, n: number) {
  const kinds: Exclude<ChecklistKind, 'custom'>[] = ['maternity_bag', 'admin', ...(n > 1 ? (['multiples'] as const) : [])];
  for (const kind of kinds) {
    try {
      const tpl = CHECKLIST_TEMPLATES[kind];
      const [list] = await backend.insert<{ id: string }>('checklists', { household_id: householdId, pregnancy_id: pregnancyId, kind, title: tpl.title });
      await backend.insert('checklist_items', tpl.items.map((label, i) => ({ checklist_id: list.id, household_id: householdId, label, position: i })));
    } catch {
      // limite de la version gratuite atteinte : les listes peuvent être créées plus tard
    }
  }
}

export async function createPregnancy(householdId: string, userId: string, d: PregnancyDraft): Promise<Pregnancy> {
  const v = validatePregnancy(d);
  if (!v.due) throw new Error(Object.values(v.errors)[0]);
  const [p] = await backend.insert<Pregnancy>('pregnancies', {
    household_id: householdId, carrier_user_id: userId, due_date: v.due, lmp_date: v.lmp, due_date_source: d.dateMode === 'lmp' ? 'lmp' : d.dateMode === 'conception' ? 'conception' : 'due_date',
    multiplicity: d.multiplicity, status: 'active', topics: d.topics,
  });
  const n = babiesCount(d.multiplicity);
  await backend.insert('expected_babies', Array.from({ length: n }, (_, i) => ({ pregnancy_id: p.id, household_id: householdId, position: i + 1, nickname: d.nicknames[i]?.trim() || null })));
  await createPregnancyChecklists(householdId, p.id, n);
  return p;
}

export interface ChildDraft { first_name: string; birth_date: string; sex: 'female' | 'male' | 'unspecified' | null; tracking: string[]; allergies: string }
export const emptyChild = (): ChildDraft => ({ first_name: '', birth_date: '', sex: null, tracking: ['breastfeed', 'bottle', 'diaper', 'sleep', 'growth'], allergies: '' });

const TRACKING_OPTIONS_FR: { key: string; label: string }[] = [
  { key: 'breastfeed', label: 'Allaitement' }, { key: 'bottle', label: 'Biberons' }, { key: 'diaper', label: 'Couches' },
  { key: 'sleep', label: 'Sommeil' }, { key: 'meal', label: 'Repas' }, { key: 'growth', label: 'Taille & poids' },
];
const TRACKING_OPTIONS_EN: { key: string; label: string }[] = [
  { key: 'breastfeed', label: 'Breastfeeding' }, { key: 'bottle', label: 'Bottles' }, { key: 'diaper', label: 'Nappies' },
  { key: 'sleep', label: 'Sleep' }, { key: 'meal', label: 'Meals' }, { key: 'growth', label: 'Height & weight' },
];
export const TRACKING_OPTIONS: { key: string; label: string }[] = localized(TRACKING_OPTIONS_FR, TRACKING_OPTIONS_EN);

export function validateChild(d: ChildDraft): { errors: Record<string, string>; birth?: string } {
  const errors: Record<string, string> = {};
  if (!d.first_name.trim()) errors.first_name = tr('u2.profiles.need_name');
  const iso = frToISO(d.birth_date);
  if (!iso) errors.birth_date = tr('u2.profiles.format_date');
  else if (iso > todayISO()) errors.birth_date = tr('u2.profiles.birth_future');
  else if (iso < addDays(todayISO(), -365 * 12)) errors.birth_date = tr('u2.profiles.max_age');
  return { errors, birth: iso ?? undefined };
}

export function ChildForm({ value, onChange, errors }: { value: ChildDraft; onChange: (v: ChildDraft) => void; errors: Record<string, string> }) {
  const set = <K extends keyof ChildDraft>(k: K, v: ChildDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <View style={{ gap: spacing.md }}>
      <Field label={tr('u2.profiles.c_name')} value={value.first_name} onChangeText={(v) => set('first_name', v)} error={errors.first_name} maxLength={40} autoCapitalize="words" />
      <Field label={tr('u2.profiles.c_birth')} placeholder={tr('u2.profiles.date_ph')} keyboardType="numbers-and-punctuation" value={value.birth_date} onChangeText={(v) => set('birth_date', v)} error={errors.birth_date} hint={tr('u2.profiles.c_birth_hint')} />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u2.profiles.sex')} <Text variant="small" muted>{tr('u2.profiles.sex_optional')}</Text></Text>
        <Row wrap>
          {([['female', tr('u2.profiles.girl')], ['male', tr('u2.profiles.boy')], ['unspecified', tr('u2.profiles.unspecified')]] as const).map(([k, l]) => (
            <Chip key={k} label={l} selected={value.sex === k} onPress={() => set('sex', value.sex === k ? null : k)} />
          ))}
        </Row>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u2.profiles.track')}</Text>
        <Row wrap>
          {TRACKING_OPTIONS.map((o) => (
            <Chip key={o.key} label={tr(`u2.profiles.track_${o.key}` as never)} tone="lavender" selected={value.tracking.includes(o.key)} onPress={() => set('tracking', value.tracking.includes(o.key) ? value.tracking.filter((x) => x !== o.key) : [...value.tracking, o.key])} />
          ))}
        </Row>
      </View>
      <Field label={tr('u2.profiles.allergies')} optional value={value.allergies} onChangeText={(v) => set('allergies', v)} placeholder={tr('u2.profiles.allergies_ph')} hint={tr('u2.profiles.allergies_hint')} />
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
