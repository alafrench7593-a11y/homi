/**
 * Administration de la rubrique « Sources et lectures » (rôle « editor ») : ajouter une page réellement consultée
 * (titre exact, éditeur, résumé rédigé par l'équipe, lien https, âges, dates), publier, repasser en brouillon, retirer.
 * Aucune photo ni aucun extrait du site n'est enregistré.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Card, Chip, Field, Row, SectionTitle, Text } from '@/components/ui';
import { RESOURCE_KINDS, type ResourceKind } from '@/content/resources';
import { resourceAgeLabel, resourceErrors, useExternalResources, useSaveResource, type ResourceRow } from '@/lib/data/hooks-resources';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { t as tr, type TKey } from '@/i18n';

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { slug: '', kind: 'institution' as ResourceKind, title: '', publisher: '', description: '', url: '', min: '', max: '', published: '', consulted: today() };

export default function AdminResources() {
  const toast = useToast();
  const { isEditor, isLoading } = useMyRoles();
  const all = useExternalResources({ includeDrafts: true });
  const save = useSaveResource();
  const [f, setF] = useState(EMPTY);

  if (isLoading) return <Screen back title={tr('src.admin.title')}><Skeleton rows={3} /></Screen>;
  if (!isEditor) return <Screen back title={tr('src.admin.title')}><EmptyState icon="lock" title={tr('rc.admin.reserved')} action={{ label: tr('src.title'), onPress: () => router.push('/sources') }} /></Screen>;

  async function add() {
    const num = (s: string) => (s.trim() ? Number(s) : null);
    const row = { slug: f.slug.trim(), kind: f.kind, title: f.title.trim(), publisher: f.publisher.trim(), description: f.description.trim(), url: f.url.trim(),
      min_age_months: num(f.min), max_age_months: num(f.max), topics: [], references_note: null, published_on: f.published.trim() || null, consulted_on: f.consulted.trim() };
    if (resourceErrors(row).length || [row.min_age_months, row.max_age_months].some((m) => m != null && !(m >= 0 && m <= 216))) return toast(tr('src.admin.invalid'), 'error');
    try { await save.mutateAsync({ row }); setF(EMPTY); toast(tr('src.admin.saved'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function setStatus(r: ResourceRow, status: ResourceRow['status']) {
    try { await save.mutateAsync({ id: r.id, row: { status } }); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('src.admin.title')} subtitle={tr('src.count', { count: all.data.length })}>
      <SectionTitle title={tr('src.admin.add')} />
      <Row wrap>{RESOURCE_KINDS.map((k) => <Chip key={k} label={tr(`src.kind.${k}` as TKey)} selected={f.kind === k} onPress={() => setF({ ...f, kind: k })} />)}</Row>
      <Field label={tr('src.admin.slug')} value={f.slug} onChangeText={(v) => setF({ ...f, slug: v })} autoCapitalize="none" maxLength={60} testID="res-slug" />
      <Field label={tr('src.admin.titleField')} value={f.title} onChangeText={(v) => setF({ ...f, title: v })} maxLength={200} testID="res-title" />
      <Field label={tr('src.admin.publisher')} value={f.publisher} onChangeText={(v) => setF({ ...f, publisher: v })} maxLength={160} testID="res-publisher" />
      <Field label={tr('src.admin.description')} value={f.description} onChangeText={(v) => setF({ ...f, description: v })} multiline maxLength={400} testID="res-description" />
      <Field label={tr('src.admin.url')} value={f.url} onChangeText={(v) => setF({ ...f, url: v })} autoCapitalize="none" maxLength={500} testID="res-url" />
      <Row>
        <Field label={tr('src.admin.minAge')} optional value={f.min} onChangeText={(v) => setF({ ...f, min: v })} keyboardType="number-pad" maxLength={3} style={{ flex: 1 }} />
        <Field label={tr('src.admin.maxAge')} optional value={f.max} onChangeText={(v) => setF({ ...f, max: v })} keyboardType="number-pad" maxLength={3} style={{ flex: 1 }} />
      </Row>
      <Field label={tr('src.admin.publishedOn')} optional value={f.published} onChangeText={(v) => setF({ ...f, published: v })} maxLength={10} />
      <Field label={tr('src.admin.consultedOn')} value={f.consulted} onChangeText={(v) => setF({ ...f, consulted: v })} maxLength={10} />
      <Button label={tr('src.admin.save')} icon="plus" onPress={() => void add()} loading={save.isPending} testID="res-save" />

      {all.data.map((r) => (
        <View key={r.id} testID={`res-row-${r.slug}`}><Card>
          <Text variant="caption" muted>{tr(`src.kind.${r.kind}` as TKey)} · {tr(`src.admin.status.${r.status}` as TKey)} · {resourceAgeLabel(r)}</Text>
          <Text weight="bold">{r.title}</Text>
          <Text variant="caption" muted>{r.publisher} · {r.url}</Text>
          <Row wrap>
            {r.status !== 'published' ? <Button label={tr('src.admin.publish')} size="sm" variant="secondary" onPress={() => void setStatus(r, 'published')} testID={`res-publish-${r.slug}`} /> : null}
            {r.status === 'published' ? <Button label={tr('src.admin.unpublish')} size="sm" variant="ghost" onPress={() => void setStatus(r, 'draft')} /> : null}
            {r.status !== 'retired' ? <Button label={tr('src.admin.retire')} size="sm" variant="ghost" onPress={() => void setStatus(r, 'retired')} /> : null}
          </Row>
        </Card></View>
      ))}
    </Screen>
  );
}
