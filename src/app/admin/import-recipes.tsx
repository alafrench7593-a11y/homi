/**
 * Import de recettes (rôle « editor ») : un lot JSON ou CSV est lu, chaque recette passe par `checkDraft`
 * (structure, dictionnaire d'ingrédients, allergènes, âges, sources, sécurité), l'identifiant est comparé à la bibliothèque,
 * le score éditorial est calculé. Seules les recettes valides sont enregistrées, au statut « Brouillon IA » :
 * invisibles des parents jusqu'à la relecture dans l'administration des recettes.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, Text } from '@/components/ui';
import { useRecipes, useSavePersonalRecipe } from '@/lib/data/hooks-recipes';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { checkDraft, readBatch, type RecipeDraft } from '@/lib/recipes/draft';
import { scoreRecipe } from '@/lib/recipes/score';
import type { Recipe } from '@/lib/recipes/types';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface Checked { slug: string; title: string; recipe: Recipe | null; errors: string[]; score: number | null }

export default function ImportRecipes() {
  const t = useTheme();
  const toast = useToast();
  const { isEditor, isLoading } = useMyRoles();
  const all = useRecipes({ includeDrafts: true, includeRetired: true });
  const save = useSavePersonalRecipe();
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [text, setText] = useState('');
  const [by, setBy] = useState('Brouillon IA (import)');
  const [checked, setChecked] = useState<Checked[] | null>(null);
  const [busy, setBusy] = useState(false);
  const known = useMemo(() => new Set((all.data ?? []).map((r) => r.slug)), [all.data]);

  if (isLoading) return <Screen back title={tr('imp.title')}><Skeleton rows={3} /></Screen>;
  if (!isEditor) return <Screen back title={tr('imp.title')}><EmptyState icon="lock" title={tr('rc.admin.reserved')} /></Screen>;

  function check() {
    let drafts: Partial<RecipeDraft>[];
    try { drafts = readBatch(text, format); } catch (e) { setChecked(null); return toast(tr('imp.parseError', { detail: e instanceof Error ? e.message.slice(0, 80) : '?' }), 'error'); }
    const on = new Date().toISOString().slice(0, 10);
    const seen = new Set<string>();
    setChecked(drafts.map((d) => {
      const res = checkDraft(d, { by: by.trim() || 'Import', on });
      const errors = [...res.errors];
      if (d.slug && (known.has(d.slug) || seen.has(d.slug))) errors.unshift(tr('imp.duplicate'));
      if (d.slug) seen.add(d.slug);
      const ok = errors.length ? null : res.recipe;
      return { slug: d.slug ?? '?', title: d.title ?? '?', recipe: ok, errors, score: ok ? scoreRecipe(ok).score : null };
    }));
  }
  async function importValid() {
    const ok = (checked ?? []).filter((c) => c.recipe);
    setBusy(true);
    let n = 0;
    try {
      for (const c of ok) { await save.mutateAsync({ recipe: c.recipe!, library: true }); n++; }
      toast(tr('imp.done', { count: n }), 'success');
      setChecked(null); setText('');
    } catch (e) { toast(`${tr('imp.done', { count: n })} — ${friendlyError(e)}`, 'error'); } finally { setBusy(false); }
  }
  const okCount = (checked ?? []).filter((c) => c.recipe).length;

  return (
    <Screen back title={tr('imp.title')}>
      <Banner tone="info">{tr('imp.intro')}</Banner>
      <Row wrap>
        <Chip label={tr('imp.json')} selected={format === 'json'} onPress={() => setFormat('json')} />
        <Chip label={tr('imp.csv')} selected={format === 'csv'} onPress={() => setFormat('csv')} />
      </Row>
      <Field label={tr('imp.by')} value={by} onChangeText={setBy} maxLength={80} />
      <Field label={tr('imp.text')} value={text} onChangeText={(v) => { setText(v); setChecked(null); }} multiline autoCapitalize="none" autoCorrect={false} style={{ minHeight: 160 }} testID="imp-text" />
      <Button label={tr('imp.check')} icon="check-circle" variant="secondary" onPress={check} disabled={!text.trim()} testID="imp-check" />
      {checked ? (
        <View testID="imp-results" style={{ gap: spacing.xs }}>
          <Text variant="small" weight="bold" testID="imp-summary">{tr('imp.summary', { ok: okCount, ko: checked.length - okCount })}</Text>
          {checked.map((c, i) => (
            <View key={`${c.slug}-${i}`} testID={`imp-row-${c.slug}`}><Card>
              <Text weight="bold">{c.title} <Text variant="caption" muted>({c.slug})</Text></Text>
              {c.recipe ? <Text variant="small" color={t.colors.success}>{tr('imp.ok', { score: c.score ?? 0 })}</Text>
                : c.errors.slice(0, 6).map((e) => <Text key={e} variant="small" color={t.colors.danger}>• {e}</Text>)}
            </Card></View>
          ))}
          <Button label={tr('imp.import', { count: okCount })} icon="upload" onPress={() => importValid()} disabled={!okCount} loading={busy} testID="imp-import" />
        </View>
      ) : null}
      <Button label={tr('imp.open')} variant="ghost" onPress={() => router.push('/admin/recipes')} />
    </Screen>
  );
}
