/**
 * Administration des recettes (rôle « editor » ou « admin ») : contrôles automatiques de chaque recette, statut
 * éditorial (Brouillon généré par IA → À vérifier → Relu → Validé pour publication, ou Retirée), corrections du texte.
 * Le statut n'est jamais changé automatiquement : seule une personne de l'équipe peut marquer une recette « Relue » ou « Validée ».
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, SectionTitle, Text } from '@/components/ui';
import { statusLabel } from '@/features/recipes/labels';
import { backend, isDemo } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { useRecipes, useSetRecipeStatus, useUpdateLibraryRecipe } from '@/lib/data/hooks-recipes';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import type { Recipe, RecipeStatus } from '@/lib/recipes/types';
import { findDuplicates, validateRecipe } from '@/lib/recipes/validate';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const FLOW: RecipeStatus[] = ['ai_draft', 'to_review', 'reviewed', 'validated', 'retired'];

function Editor({ r, onDone }: { r: Recipe; onDone: () => void }) {
  const toast = useToast();
  const upd = useUpdateLibraryRecipe();
  const setStatus = useSetRecipeStatus();
  const [title, setTitle] = useState(r.title);
  const [summary, setSummary] = useState(r.summary);
  const [storage, setStorage] = useState(r.storage);
  const [nutrition, setNutrition] = useState(r.nutrition);
  const [steps, setSteps] = useState(r.steps.join('\n'));
  const draft: Recipe = { ...r, title, summary, storage, nutrition, steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) };
  const errs = validateRecipe(draft);
  return (
    <Card>
      <Field label={tr('rc.new.title')} value={title} onChangeText={setTitle} maxLength={120} />
      <Field label={tr('rc.new.summary')} value={summary} onChangeText={setSummary} multiline maxLength={300} />
      <Field label={tr('rc.new.steps')} hint={tr('rc.new.stepsHint')} value={steps} onChangeText={setSteps} multiline maxLength={6000} />
      <Field label={tr('rc.storage')} value={storage} onChangeText={setStorage} multiline maxLength={400} />
      <Field label={tr('rc.nutrition')} value={nutrition} onChangeText={setNutrition} multiline maxLength={600} />
      {errs.length ? <Banner tone="warning" title={tr('rc.admin.checksFail', { count: errs.length })}>{errs.map((e) => `• ${e}`).join('\n')}</Banner> : <Text variant="small">{tr('rc.admin.checksOk')}</Text>}
      <Text variant="caption" muted>{tr('rc.admin.editNote')}</Text>
      <Row wrap style={{ marginTop: spacing.xs }}>
        <Button label={tr('common.save')} size="sm" loading={upd.isPending} disabled={errs.length > 0} onPress={async () => {
          try {
            // Toute correction renvoie la recette en relecture si elle était relue ou validée
            await upd.mutateAsync({ id: r.dbId!, patch: { title: draft.title, summary: draft.summary, storage: draft.storage, nutrition: draft.nutrition }, steps: draft.steps });
            if (r.status === 'reviewed' || r.status === 'validated') await setStatus.mutateAsync({ slug: r.slug, status: 'to_review', note: tr('rc.admin.editedNote') });
            toast(tr('nd.saved'), 'success'); onDone();
          } catch (e) { toast(friendlyError(e), 'error'); }
        }} />
        <Button label={tr('common.cancel')} size="sm" variant="ghost" onPress={onDone} />
      </Row>
    </Card>
  );
}

export default function AdminRecipes() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const { isEditor, isLoading } = useMyRoles();
  const { data: all, loading } = useRecipes({ includeRetired: true, includeDrafts: true });
  const setStatus = useSetRecipeStatus();
  const [filter, setFilter] = useState<RecipeStatus | 'errors' | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const lib = useMemo(() => (all ?? []).filter((r) => !r.personal), [all]);
  const checks = useMemo(() => new Map(lib.map((r) => [r.slug, validateRecipe(r)])), [lib]);
  const dups = useMemo(() => findDuplicates(lib), [lib]);

  if (isLoading) return <Screen back title={tr('rc.admin.title')}><Skeleton rows={4} /></Screen>;
  if (!isEditor) {
    return (
      <Screen back title={tr('rc.admin.title')}>
        <EmptyState icon="lock" title={tr('rc.admin.reserved')} body={tr('rc.admin.reservedBody')} />
        {isDemo ? (
          <Banner tone="demo" title={tr('rc.admin.demoTitle')} action={<Button label={tr('rc.admin.demoGrant')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} testID="demo-grant-editor"
            onPress={async () => { try { await backend.rpc('demo_grant_editor', {}); inv('user_roles'); } catch (e) { toast(friendlyError(e), 'error'); } }} />}>
            {tr('rc.admin.demoBody')}
          </Banner>
        ) : null}
      </Screen>
    );
  }
  const shown = lib.filter((r) => (filter === 'errors' ? (checks.get(r.slug)?.length ?? 0) > 0 : !filter || r.status === filter));
  const count = (s: RecipeStatus) => lib.filter((r) => r.status === s).length;

  async function change(r: Recipe, s: RecipeStatus) {
    if ((s === 'reviewed' || s === 'validated') && (checks.get(r.slug)?.length ?? 0) > 0) { toast(tr('rc.admin.fixFirst'), 'error'); return; }
    if (s === 'validated' && !(await confirm(tr('rc.admin.validateTitle'), tr('rc.admin.validateBody', { title: r.title }), tr('rc.status.validated')))) return;
    if (s === 'retired' && !(await confirm(tr('rc.admin.retireTitle'), tr('rc.admin.retireBody'), tr('rc.admin.retire')))) return;
    try { await setStatus.mutateAsync({ slug: r.slug, status: s }); toast(tr('rc.admin.changed', { status: statusLabel(s) }), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('rc.admin.title')} subtitle={tr('rc.admin.count', { count: lib.length })}>
      {isDemo ? <Banner tone="demo">{tr('rc.admin.demoActive')}</Banner> : null}
      <Text variant="small" muted>{tr('rc.admin.intro')}</Text>
      <Row wrap>
        <Chip label={tr('rc.admin.all')} selected={!filter} onPress={() => setFilter(null)} />
        {FLOW.map((s) => <Chip key={s} label={`${statusLabel(s)} (${count(s)})`} selected={filter === s} onPress={() => setFilter(s)} />)}
        <Chip label={tr('rc.admin.withErrors', { count: [...checks.values()].filter((e) => e.length).length })} selected={filter === 'errors'} onPress={() => setFilter('errors')} />
      </Row>
      {dups.length ? <Banner tone="warning" title={tr('rc.admin.dups')}>{dups.join('\n')}</Banner> : null}
      <Button label={tr('rc.new.open')} icon="plus" variant="secondary" onPress={() => router.push('/meals/new')} />
      {loading && !all ? <Skeleton rows={4} /> : null}
      <SectionTitle title={tr('rc.admin.list')} />
      {shown.map((r) => {
        const errs = checks.get(r.slug) ?? [];
        return (
          <View key={r.slug} style={{ gap: spacing.xs }} testID={`admin-recipe-${r.slug}`}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold" style={{ flex: 1 }}>{r.title}</Text>
                <Text variant="caption" weight="bold" color={r.status === 'validated' ? t.colors.success : r.status === 'retired' ? t.colors.danger : t.colors.textMuted} testID={`admin-status-${r.slug}`}>{statusLabel(r.status)}</Text>
              </Row>
              <Text variant="caption" muted>{errs.length ? tr('rc.admin.checksFail', { count: errs.length }) : tr('rc.admin.checksOk')}{r.statusHistory.length ? ` · ${r.statusHistory[r.statusHistory.length - 1].by}` : ''}</Text>
              {errs.length ? <Text variant="small" color={t.colors.danger}>{errs.slice(0, 3).join(' · ')}</Text> : null}
              <Row wrap style={{ marginTop: spacing.xs }}>
                <Button label={tr('rc.admin.open')} size="sm" variant="ghost" onPress={() => router.push(`/meals/${r.slug}`)} />
                <Button label={tr('rc.admin.edit')} size="sm" variant="ghost" onPress={() => setEditing(editing === r.slug ? null : r.slug)} />
                {r.status !== 'to_review' && r.status !== 'retired' ? <Button label={tr('rc.status.to_review')} size="sm" variant="ghost" onPress={() => change(r, 'to_review')} /> : null}
                {r.status === 'to_review' ? <Button label={tr('rc.admin.markReviewed')} size="sm" variant="secondary" testID={`admin-review-${r.slug}`} onPress={() => change(r, 'reviewed')} /> : null}
                {r.status === 'reviewed' ? <Button label={tr('rc.admin.markValidated')} size="sm" testID={`admin-validate-${r.slug}`} onPress={() => change(r, 'validated')} /> : null}
                {r.status !== 'retired' ? <Button label={tr('rc.admin.retire')} size="sm" variant="ghost" onPress={() => change(r, 'retired')} /> : <Button label={tr('rc.admin.restore')} size="sm" variant="ghost" onPress={() => change(r, 'to_review')} />}
              </Row>
            </Card>
            {editing === r.slug && r.dbId ? <Editor r={r} onDone={() => setEditing(null)} /> : null}
          </View>
        );
      })}
    </Screen>
  );
}
