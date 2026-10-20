/** Éléments partagés des écrans Documents : carte, choix du profil, choix de la catégorie, badges d'origine. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { CATEGORIES, categoryDef, categoryLabel, GROUPS, groupLabel, type DocCategory } from '@/lib/documents/taxonomy';
import type { Origin } from '@/lib/documents/summary';
import type { Child, DocumentRow, Pregnancy } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export type Subject = { kind: 'me' } | { kind: 'child'; id: string } | { kind: 'pregnancy'; id: string };

export const subjectOf = (d: Pick<DocumentRow, 'child_id' | 'pregnancy_id'>): Subject =>
  d.child_id ? { kind: 'child', id: d.child_id } : d.pregnancy_id ? { kind: 'pregnancy', id: d.pregnancy_id } : { kind: 'me' };

export function subjectLabel(s: Subject, children: Child[] | undefined): string {
  if (s.kind === 'child') return children?.find((c) => c.id === s.id)?.first_name ?? tr('docs.subject.child');
  if (s.kind === 'pregnancy') return tr('docs.subject.pregnancy');
  return tr('docs.subject.me');
}
export const subjectColumns = (s: Subject) => ({ child_id: s.kind === 'child' ? s.id : null, pregnancy_id: s.kind === 'pregnancy' ? s.id : null });
export const sameSubject = (a: Subject, b: Subject) => a.kind === b.kind && (a.kind === 'me' || (a as { id: string }).id === (b as { id: string }).id);

const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`);
export const formatSize = fmtSize;

/** Carte d'un document : icône de catégorie, nom, date, profil, confidentialité, statut de vérification. */
export function DocCard({ doc, children, onPress, selected, selecting }: { doc: DocumentRow; children?: Child[]; onPress: () => void; selected?: boolean; selecting?: boolean }) {
  const t = useTheme();
  const def = categoryDef(doc.category);
  const cat = categoryLabel(doc.category, doc.custom_category);
  const who = subjectLabel(subjectOf(doc), children);
  const date = doc.doc_date ? formatDate(doc.doc_date, { day: 'numeric', month: 'short', year: 'numeric' }) : tr('docs.card.added', { date: formatDate(doc.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) });
  const a11y = [doc.title, cat, date, who, doc.private_to_uploader ? tr('docs.private') : tr('docs.shared'), doc.review_status === 'to_verify' ? tr('docs.toVerify') : null].filter(Boolean).join(', ');
  return (
    <Card onPress={() => { haptic('selection'); onPress(); }} accessibilityLabel={a11y} accessibilityHint={selecting ? tr('docs.card.selectHint') : tr('docs.card.openHint')}>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.colors.primary : t.colors.surfaceAlt }}>
          <Icon name={selected ? 'check' : doc.mime_type === 'application/pdf' && def.value === 'other' ? 'file-text' : def.icon} color={selected ? t.colors.primaryText : t.colors.lavender} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Text weight="bold" style={{ flexShrink: 1 }}>{doc.title}</Text>
            {doc.favorite ? <Icon name="star" size={14} color={t.colors.gold} /> : null}
          </Row>
          <Text variant="caption" muted>{[cat, date, who].join(' · ')}</Text>
          <Row gap={6} wrap style={{ marginTop: 4 }}>
            <Badge icon={doc.private_to_uploader ? 'lock' : 'users'} label={doc.private_to_uploader ? tr('docs.private') : tr('docs.shared')} />
            {doc.page_count > 1 ? <Badge icon="layers" label={tr('docs.pages', { count: doc.page_count })} /> : null}
            {doc.review_status === 'to_verify' ? <Badge icon="alert-circle" label={tr('docs.toVerify')} tone="warning" /> : null}
            {doc.review_status === 'verified' ? <Badge icon="check-circle" label={tr('docs.verified')} tone="success" /> : null}
            {doc.archived ? <Badge icon="archive" label={tr('docs.archived')} /> : null}
          </Row>
        </View>
        <Text variant="caption" muted>{fmtSize(doc.size_bytes)}</Text>
      </Row>
    </Card>
  );
}

export function Badge({ icon, label, tone }: { icon?: React.ComponentProps<typeof Icon>['name']; label: string; tone?: 'warning' | 'success' | 'info' }) {
  const t = useTheme();
  const color = tone === 'warning' ? t.colors.gold : tone === 'success' ? t.colors.success ?? t.colors.primary : t.colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: t.colors.border }}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <Text variant="caption" color={color}>{label}</Text>
    </View>
  );
}

/** Origine d'une information (document, détecté, explication, incertain, confirmé). */
export function OriginBadge({ origin }: { origin: Origin }) {
  const map: Record<Origin, { icon: React.ComponentProps<typeof Icon>['name']; tone?: 'warning' | 'success' | 'info' }> = {
    document: { icon: 'file-text' }, detected: { icon: 'cpu', tone: 'info' }, explanation: { icon: 'book-open', tone: 'info' },
    uncertain: { icon: 'help-circle', tone: 'warning' }, confirmed: { icon: 'check-circle', tone: 'success' },
  };
  return <Badge icon={map[origin].icon} tone={map[origin].tone} label={tr(`docs.origin.${origin}` as const)} />;
}

/** Profil associé : « Moi », chaque enfant, la grossesse en cours. Affiché clairement avant l'enregistrement. */
export function SubjectPicker({ value, onChange, kids, pregnancy }: { value: Subject; onChange: (s: Subject) => void; kids: Child[] | undefined; pregnancy: Pregnancy | null }) {
  const options: Subject[] = [{ kind: 'me' }, ...(kids ?? []).map((c) => ({ kind: 'child' as const, id: c.id })), ...(pregnancy ? [{ kind: 'pregnancy' as const, id: pregnancy.id }] : [])];
  return (
    <View style={{ gap: spacing.xs }} accessibilityRole="radiogroup" accessibilityLabel={tr('docs.subject.label')}>
      <Text variant="label">{tr('docs.subject.label')}</Text>
      <Row wrap>
        {options.map((o) => {
          const on = sameSubject(o, value);
          return <Chip key={o.kind + ((o as { id?: string }).id ?? '')} label={subjectLabel(o, kids)} icon={o.kind === 'me' ? 'user' : o.kind === 'child' ? 'smile' : 'moon'} selected={on} onPress={() => onChange(o)} />;
        })}
      </Row>
    </View>
  );
}

/** Catégorie : groupes repliables + catégorie personnalisée. */
export function CategoryPicker({ value, custom, onChange, suggested }: { value: DocCategory; custom: string; onChange: (c: DocCategory, custom: string) => void; suggested?: DocCategory | null }) {
  const [group, setGroup] = useState(categoryDef(value).group);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{tr('docs.category')}</Text>
      {suggested && suggested !== value ? (
        <Tappable accessibilityRole="button" onPress={() => { onChange(suggested, ''); setGroup(categoryDef(suggested).group); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="cpu" size={14} />
          <Text variant="small">{tr('docs.suggested', { cat: categoryLabel(suggested) })}</Text>
        </Tappable>
      ) : null}
      <Row wrap>{GROUPS.map((g) => <Chip key={g} label={groupLabel(g)} selected={group === g} tone="lavender" onPress={() => setGroup(g)} />)}</Row>
      <Row wrap>
        {CATEGORIES.filter((c) => c.group === group && !['photo', 'other'].includes(c.value) || (group === 'other' && ['photo', 'other'].includes(c.value))).map((c) => (
          <Chip key={c.value} label={categoryLabel(c.value)} icon={c.icon} selected={value === c.value} onPress={() => onChange(c.value, c.value === 'custom' ? custom : '')} />
        ))}
      </Row>
      {value === 'custom' ? <Field label={tr('docs.customName')} value={custom} onChangeText={(v) => onChange('custom', v)} maxLength={40} /> : null}
    </View>
  );
}
