/**
 * 44 — Projet de naissance : questionnaire par sections (accompagnement, ambiance, positions, gestion de la douleur,
 * après la naissance, alimentation du bébé, séjour, autres souhaits). Réponses enregistrées et modifiables, rattachées à
 * la grossesse ; aperçu imprimable, PDF ou texte (export existant). Contenu neutre et non médical : des souhaits, à
 * discuter avec l'équipe de la maternité.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Icon, Row, Segmented, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { useActivePregnancy } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useBirthPlan, useDeleteBirthPlan, useSaveBirthPlan } from '@/lib/data/hooks-birthCare';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { cleanAnswers, optionLabel, PLAN_SECTIONS, planSections, progress, sectionTitle, toggleChoice, type PlanAnswers } from '@/features/birth/birthPlan';

export default function BirthPlan() {
  const toast = useToast();
  const pregnancy = useActivePregnancy();
  const q = useBirthPlan(pregnancy?.id ?? null);
  const save = useSaveBirthPlan();
  const del = useDeleteBirthPlan();
  const [answers, setAnswers] = useState<PlanAnswers>({});
  const [loaded, setLoaded] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const key = `${pregnancy?.id ?? ''}:${q.plan?.id ?? 'new'}`;
    if (q.isLoading || loaded === key) return;
    setAnswers(q.plan?.answers ?? {}); setLoaded(key); setDirty(false);
  }, [q.plan?.id, q.isLoading, pregnancy?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const prog = progress(answers);
  const sections = useMemo(() => planSections(answers), [answers]);
  const edit = (next: PlanAnswers) => { setAnswers(next); setDirty(true); };

  async function persist() {
    if (!pregnancy) return;
    try {
      const r = await save.mutateAsync({ pregnancyId: pregnancy.id, answers: cleanAnswers(answers) });
      setDirty(false);
      toast(r === 'queued' ? tr('bp.savedOffline') : tr('bp.saved'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function exportFor(kind: 'pdf' | 'text') {
    const title = tr('bp.export.title');
    const sub = [tr('bp.export.sub', { date: formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) }), tr('bp.disclaimer')];
    try {
      if (kind === 'text' && Platform.OS !== 'web') await Share.share({ title, message: [title, ...sub, '', ...sections.flatMap((s) => [s.heading, ...s.lines, ''])].join('\n') });
      else await deliverFile(await buildTextPdf(title, sub, sections), `projet-de-naissance-${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf', title);
      toast(tr('bp.export.ready'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!q.plan || !(await confirm(tr('bp.delete'), tr('bp.deleteQ'), tr('bp.delete')))) return;
    try { await del.mutateAsync(q.plan.id); setAnswers({}); setDirty(false); toast(tr('bp.deleted'), 'success'); } catch (x) { toast(friendlyError(x), 'error'); }
  }

  if (!pregnancy) return <Screen back title={tr('bp.title')} tool={false}><EmptyState icon="heart" title={tr('bp.title')} body={tr('bp.noPregnancy')} /></Screen>;
  if (q.isLoading && !q.data) return <Screen back title={tr('bp.title')} tool={false}><Skeleton rows={5} /></Screen>;
  return (
    <Screen back title={tr('bp.title')} subtitle={tr('bp.progress', { filled: prog.filled, total: prog.total })} tool={false}
      action={mode === 'edit' ? { label: dirty ? tr('bp.save') : tr('bp.savedShort'), icon: 'check', disabled: !dirty, onPress: () => persist(), testID: 'bp-save' } : undefined}>
      <Text muted>{tr('bp.intro')}</Text>
      <Banner tone="info" icon="info">{tr('bp.disclaimer')}</Banner>
      <Segmented label={tr('bp.view')} value={mode} onChange={setMode} options={[{ value: 'edit', label: tr('bp.mode.edit'), testID: 'bp-mode-edit' }, { value: 'preview', label: tr('bp.mode.preview'), testID: 'bp-mode-preview' }]} />
      {mode === 'edit' ? PLAN_SECTIONS.map((s) => (
        <Card key={s.key} testID={`bp-sec-${s.key}`}>
          <Row gap={spacing.sm} style={{ alignItems: 'center' }}>
            <Icon name={s.icon} size={18} />
            <Text weight="bold" accessibilityRole="header" style={{ flex: 1 }}>{sectionTitle(s.key)}</Text>
          </Row>
          {s.options.length ? (
            <Row wrap>{s.options.map((o) => (
              <Chip key={o} label={optionLabel(s.key, o)} selected={(answers[s.key]?.choices ?? []).includes(o)} onPress={() => edit(toggleChoice(answers, s.key, o))} testID={`bp-opt-${s.key}-${o}`} />
            ))}</Row>
          ) : null}
          <Field label={s.options.length ? tr('bp.note') : tr('bp.noteOther')} optional multiline maxLength={1000} value={answers[s.key]?.note ?? ''}
            onChangeText={(note) => edit({ ...answers, [s.key]: { ...answers[s.key], note } })} placeholder={tr('bp.notePh')} testID={`bp-note-${s.key}`} />
        </Card>
      )) : (
        <View style={{ gap: spacing.sm }} testID="bp-preview">
          {dirty ? <Banner tone="warning">{tr('bp.unsaved')}</Banner> : null}
          {sections.length ? sections.map((s) => (
            <Card key={s.heading}>
              <Text weight="bold" accessibilityRole="header">{s.heading}</Text>
              {s.lines.map((l, i) => <Text key={i} variant="small">{l}</Text>)}
            </Card>
          )) : <Text muted>{tr('bp.emptyPreview')}</Text>}
          {sections.length ? (
            <Row wrap gap={spacing.sm}>
              <Button label={Platform.OS === 'web' ? tr('bp.export.pdfWeb') : tr('bp.export.pdf')} icon="download" size="sm" variant="secondary" onPress={() => void exportFor('pdf')} testID="bp-export" />
              {Platform.OS !== 'web' ? <Button label={tr('bp.export.text')} icon="share" size="sm" variant="ghost" onPress={() => void exportFor('text')} /> : null}
            </Row>
          ) : null}
        </View>
      )}
      {q.plan ? <Button label={tr('bp.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="bp-delete" /> : null}
      <Text variant="caption" muted>{tr('bp.private')}</Text>
    </Screen>
  );
}
