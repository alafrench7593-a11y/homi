/**
 * Fiche de mon enfant (scripts 93 et 95) : tout ce qu'une autre personne doit savoir en une page — allergies,
 * traitements en cours, personnes à appeler, ce qui l'apaise, ce qu'il faut savoir — à partager en texte à
 * l'école, la nounou, les grands-parents, ou à apporter pour préparer un PAI avec le médecin et l'école.
 * Les données sont celles déjà saisies dans « Suivi santé » (allergies, traitements, contacts) ; ici on ajoute
 * « ce qui l'apaise » et « à savoir », et on exporte le tout.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate } from '@/lib/data/hooks';
import { useHealthItems, type HealthItem, type HealthItemKind } from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { exportTextFile } from '@/lib/exportData';
import { insertOrQueue } from '@/lib/offline';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const SECTIONS: { kind: HealthItemKind; icon: 'alert-circle' | 'package' | 'phone' | 'heart' | 'info'; danger?: boolean }[] = [
  { kind: 'allergy', icon: 'alert-circle', danger: true },
  { kind: 'treatment', icon: 'package' },
  { kind: 'contact', icon: 'phone' },
  { kind: 'soothe', icon: 'heart' },
  { kind: 'info', icon: 'info' },
];

export default function ChildCard() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const { data: items } = useHealthItems(id);
  const [adding, setAdding] = useState<'soothe' | 'info' | null>(null);
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  if (!child) return <Screen back title={tr('tool.kid_card')}><EmptyState icon="user" title={tr('kc.noChild')} /></Screen>;

  const allergies = [...new Set([...(child.allergies_declared ?? []), ...(items ?? []).filter((i) => i.kind === 'allergy').map((i) => i.label)])];
  const of = (k: HealthItemKind) => (items ?? []).filter((i) => i.kind === k && (k !== 'treatment' || !i.done_on));
  const line = (i: HealthItem) => `${i.label}${i.details ? ` — ${i.details}` : ''}`;

  async function save() {
    if (!adding || !label.trim()) return toast(tr('kc.errLabel'), 'error');
    setSaving(true);
    try {
      await insertOrQueue('child_health_items', { child_id: child!.id, household_id: child!.household_id, kind: adding, label: label.trim(), details: details.trim() || null, due_on: null, done_on: null });
      inv('child_health_items');
      setAdding(null); setLabel(''); setDetails('');
      toast(tr('kc.added'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }
  async function remove(i: HealthItem) {
    if (!(await confirm(tr('common.delete'), i.label, tr('common.delete')))) return;
    try { await backend.remove('child_health_items', [eq('id', i.id)]); inv('child_health_items'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function share() {
    const L: string[] = [tr('kc.exportTitle', { name: child!.first_name }), tr('kc.exportDate', { date: formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) }), ''];
    L.push(`${child!.first_name} · ${childAge(child!.birth_date).label} · ${tr('kc.born', { date: formatDate(child!.birth_date, { day: 'numeric', month: 'long', year: 'numeric' }) })}`, '');
    L.push(tr('kc.sec.allergy').toUpperCase(), allergies.length ? allergies.map((a) => `- ${a}`).join('\n') : tr('kc.noneNoted'), '');
    for (const s of SECTIONS.filter((x) => x.kind !== 'allergy')) {
      const rows = of(s.kind);
      L.push(tr(`kc.sec.${s.kind}` as TKey).toUpperCase(), rows.length ? rows.map((i) => `- ${line(i)}`).join('\n') : tr('kc.noneNoted'), '');
    }
    L.push(tr('kc.exportFooter'));
    try { await exportTextFile(L.join('\n'), `fiche-${child!.first_name.toLowerCase()}.txt`, 'text/plain'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.kid_card')} subtitle={`${child.first_name} · ${childAge(child.birth_date).label}`}
      action={{ label: tr('kc.share'), icon: 'share', onPress: () => void share(), testID: 'kid-card-share' }}>
      <Text muted>{tr('kc.intro')}</Text>
      <Card tone="soft" testID="kid-card-allergies">
        <Text weight="bold" color={allergies.length ? t.colors.danger : undefined}>{tr('kc.sec.allergy')}</Text>
        <Text>{allergies.length ? allergies.join(', ') : tr('kc.noneNoted')}</Text>
        <Button label={tr('kc.editHealth')} size="sm" variant="ghost" icon="edit-2" onPress={() => router.push(`/child/${child.id}/health-tracking`)} />
      </Card>
      {SECTIONS.filter((s) => s.kind !== 'allergy').map((s) => {
        const rows = of(s.kind);
        const editable = s.kind === 'soothe' || s.kind === 'info';
        return (
          <View key={s.kind} style={{ gap: spacing.xs }}>
            <SectionTitle title={tr(`kc.sec.${s.kind}` as TKey)} action={editable ? tr('kc.add') : tr('kc.editHealth')}
              onAction={editable ? () => { setAdding(s.kind as 'soothe' | 'info'); setLabel(''); setDetails(''); } : () => router.push(`/child/${child.id}/health-tracking`)} />
            {editable && adding === s.kind && (
              <Card>
                <Field label={tr(`kc.label.${s.kind}` as TKey)} value={label} onChangeText={setLabel} maxLength={160} placeholder={tr(`kc.ph.${s.kind}` as TKey)} testID={`kid-card-${s.kind}-label`} />
                <Field label={tr('kc.details')} optional value={details} onChangeText={setDetails} maxLength={2000} multiline />
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
                  <Button label={tr('common.save')} icon="check" loading={saving} onPress={() => void save()} testID={`kid-card-${s.kind}-save`} />
                  <Button label={tr('common.cancel')} variant="ghost" onPress={() => setAdding(null)} />
                </View>
              </Card>
            )}
            {rows.length ? (
              <Card padded={false}>
                {rows.map((i) => <ListRow key={i.id} icon={s.icon} title={i.label} subtitle={i.details ?? undefined} danger={s.danger} onPress={editable ? () => void remove(i) : undefined} />)}
              </Card>
            ) : <Text variant="small" muted>{tr(`kc.empty.${s.kind}` as TKey)}</Text>}
          </View>
        );
      })}
      <Banner tone="info">{tr('kc.pai')}</Banner>
    </Screen>
  );
}
