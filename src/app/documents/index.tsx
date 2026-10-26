/**
 * Documents : numériser, importer, retrouver et comprendre ses documents de santé et de famille.
 * Stockage privé, accès par lien temporaire. Privés par défaut : le partage avec le foyer est un choix explicite.
 * Version gratuite : 15 documents ; au-delà, l'abonnement est proposé sans bloquer la consultation.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { PremiumGate } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { Appear } from '@/components/Appear';
import { useActivePregnancy, useChildren, useDocuments } from '@/lib/data/hooks';
import { usePlanLimit } from '@/lib/data/hooks-me';
import { categoryLabel, categoryDef, GROUPS, groupLabel, type DocGroup } from '@/lib/documents/taxonomy';
import { searchDocuments } from '@/lib/documents/search';
import { checkFile, pickFiles, pickPhotos, type PickedFile } from '@/lib/documents/io';
import { setPendingImport } from '@/lib/documents/pending';
import { DocCard, sameSubject, subjectLabel, subjectOf, type Subject } from '@/features/documents';
import type { DocumentRow } from '@/lib/types';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Flag = 'favorite' | 'to_verify' | 'archived';

export default function DocumentsHome() {
  const t = useTheme();
  const toast = useToast();
  const docsQ = useDocuments();
  const docs = docsQ.data;
  const { data: kids } = useChildren();
  const pregnancy = useActivePregnancy();
  const { data: limit } = usePlanLimit('documents_count');
  const [query, setQuery] = useState('');
  // Ouvert depuis un profil (enfant, grossesse) : ses documents d'abord ; « Tout le monde » reste à un geste
  const qp = useLocalSearchParams<{ child?: string; for?: string }>();
  const [subject, setSubject] = useState<Subject | null>(() => (qp.child ? { kind: 'child', id: qp.child } : qp.for === 'pregnancy' && pregnancy ? { kind: 'pregnancy', id: pregnancy.id } : null));
  const [group, setGroup] = useState<DocGroup | null>(null);
  const [flag, setFlag] = useState<Flag | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const loading = docsQ.isLoading && !docs;
  const failed = docsQ.isError && !docs;
  const count = docs?.length ?? 0;
  const atLimit = typeof limit === 'number' && count >= limit;

  const { list, interpretation } = useMemo(() => {
    let l: DocumentRow[] = docs ?? [];
    l = l.filter((d) => (flag === 'archived' ? d.archived : !d.archived));
    if (flag === 'favorite') l = l.filter((d) => d.favorite);
    if (flag === 'to_verify') l = l.filter((d) => d.review_status === 'to_verify');
    if (subject) l = l.filter((d) => sameSubject(subjectOf(d), subject));
    if (group) l = l.filter((d) => categoryDef(d.category).group === group);
    if (!query.trim()) return { list: l, interpretation: null };
    const r = searchDocuments(l, query, { children: kids ?? [] });
    return { list: r.results, interpretation: r.interpretation };
  }, [docs, flag, subject, group, query, kids]);
  const filtering = !!(query.trim() || subject || group || flag);
  const toVerify = (docs ?? []).filter((d) => !d.archived && d.review_status === 'to_verify');
  const favorites = (docs ?? []).filter((d) => !d.archived && d.favorite);

  async function importFrom(kind: 'photos' | 'files') {
    try {
      const raw = kind === 'photos' ? await pickPhotos(true) : await pickFiles(true);
      if (raw === 'denied') return toast(tr('docs.err.photosDenied'), 'info');
      if (!raw.length) return;
      const ok: PickedFile[] = [];
      const errors: string[] = [];
      for (const r of raw) {
        const c = await checkFile(r);
        if (typeof c === 'string') errors.push(tr(`docs.err.${c}` as const, { name: r.name }));
        else ok.push(c);
      }
      if (errors.length) toast(errors.join('\n'), 'error');
      if (!ok.length) return;
      setImportOpen(false);
      // Les photos passent par l'éditeur de pages (recadrage, rotation, lisibilité) ; PDF et fichiers sont enregistrés tels quels
      const photosOnly = ok.every((f) => f.mimeType === 'image/jpeg' || f.mimeType === 'image/png' || f.mimeType === 'image/webp');
      setPendingImport({ kind: kind === 'photos' && photosOnly ? 'photos' : 'files', files: ok });
      router.push(`/documents/scan?from=${kind === 'photos' && photosOnly ? 'photos' : 'files'}`);
    } catch {
      toast(tr('docs.err.picker'), 'error');
    }
  }

  const toggleSelect = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const open = (d: DocumentRow) => (selecting ? toggleSelect(d.id) : router.push(`/documents/${d.id}`));
  const subjects: Subject[] = [{ kind: 'me' }, ...(kids ?? []).map((c) => ({ kind: 'child' as const, id: c.id })), ...(pregnancy ? [{ kind: 'pregnancy' as const, id: pregnancy.id }] : [])];

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      {/* Actions principales */}
      {!loading && !failed ? (
        <TodaySummary title={tr('docs.title')} items={[
          { icon: 'folder', value: String((docs ?? []).filter((d) => !d.archived).length), label: tr('docs.section.library') },
          { icon: 'alert-circle', value: String(toVerify.length), label: tr('docs.section.toVerify') },
          { icon: 'star', value: String(favorites.length), label: tr('docs.section.favorites') },
        ]} />
      ) : null}
      <Appear kind="pop" delay={0.05}>
        <Button label={tr('docs.import')} icon="upload" variant="secondary" onPress={() => setImportOpen(true)} disabled={atLimit} full />
      </Appear>
      <Row>
        <View style={{ flex: 1 }}><Card onPress={() => router.push('/documents/book')} accessibilityLabel={tr('docs.book.title')}>
          <Icon name="book" color={t.colors.lavender} />
          <Text weight="bold" style={{ marginTop: 6 }}>{tr('docs.book.title')}</Text>
          <Text variant="caption" muted>{tr('docs.book.short')}</Text>
        </Card></View>
        <View style={{ flex: 1 }}><Card onPress={() => { setSelecting(true); setSelected([]); }} accessibilityLabel={tr('docs.export.title')}>
          <Icon name="share" color={t.colors.lavender} />
          <Text weight="bold" style={{ marginTop: 6 }}>{tr('docs.export.title')}</Text>
          <Text variant="caption" muted>{tr('docs.export.short')}</Text>
        </Card></View>
      </Row>

      <Banner tone="info" icon="lock">{tr('docs.privacyBanner')}</Banner>
      {atLimit ? (
        <>
          <Banner tone="warning" title={tr('docs.full.title')}>{tr('docs.full.body', { limit: limit ?? 0 })}</Banner>
          <PremiumGate feature={tr('docs.full.premium')}><View /></PremiumGate>
        </>
      ) : null}

      {/* Recherche */}
      <Field label={tr('docs.search.label')} value={query} onChangeText={setQuery} placeholder={tr('docs.search.placeholder')} returnKeyType="search" autoCorrect={false} />
      {interpretation && (interpretation.categories.length || interpretation.year || interpretation.latest || interpretation.childId || interpretation.exact) ? (
        <Row wrap gap={6}>
          <Text variant="caption" muted>{tr('docs.search.understood')}</Text>
          {interpretation.categories.slice(0, 3).map((c) => <Chip key={c} label={categoryLabel(c)} selected />)}
          {interpretation.year ? <Chip label={String(interpretation.year)} selected /> : null}
          {interpretation.latest ? <Chip label={tr('docs.search.latest')} selected /> : null}
          {interpretation.childId ? <Chip label={subjectLabel({ kind: 'child', id: interpretation.childId }, kids)} selected /> : null}
          {interpretation.exact ? <Chip label={`« ${interpretation.exact} »`} selected /> : null}
        </Row>
      ) : null}

      {/* Filtres */}
      <Row wrap gap={6}>
        <Chip label={tr('docs.filter.everyone')} selected={!subject} onPress={() => setSubject(null)} />
        {subjects.map((s) => <Chip key={s.kind + ((s as { id?: string }).id ?? '')} label={subjectLabel(s, kids)} selected={!!subject && sameSubject(s, subject)} onPress={() => setSubject(subject && sameSubject(s, subject) ? null : s)} />)}
      </Row>
      <Row wrap gap={6}>
        {GROUPS.map((g) => <Chip key={g} label={groupLabel(g)} tone="lavender" selected={group === g} onPress={() => setGroup(group === g ? null : g)} />)}
        <Chip label={tr('docs.filter.favorites')} icon="star" selected={flag === 'favorite'} onPress={() => setFlag(flag === 'favorite' ? null : 'favorite')} />
        <Chip label={tr('docs.filter.toVerify', { count: toVerify.length })} icon="alert-circle" selected={flag === 'to_verify'} onPress={() => setFlag(flag === 'to_verify' ? null : 'to_verify')} />
        <Chip label={tr('docs.filter.archived')} icon="archive" selected={flag === 'archived'} onPress={() => setFlag(flag === 'archived' ? null : 'archived')} />
      </Row>

      {selecting ? <Banner tone="info" title={tr('docs.select.title')}>{tr('docs.select.body')}</Banner> : null}
      {loading ? <Skeleton rows={4} /> : null}
      {failed ? <ErrorView error={docsQ.error} onRetry={() => void docsQ.refetch()} title={tr('docs.loadError')} /> : null}

      {/* Sans filtre : ce qui demande une action d'abord */}
      {!filtering && !loading && !failed && toVerify.length ? (
        <View style={{ gap: spacing.xs }}>
          <SectionTitle title={tr('docs.section.toVerify')} />
          {toVerify.slice(0, 3).map((d) => <DocCard key={d.id} doc={d} children={kids} onPress={() => open(d)} selecting={selecting} selected={selected.includes(d.id)} />)}
        </View>
      ) : null}
      {!filtering && !loading && !failed && favorites.length ? (
        <View style={{ gap: spacing.xs }}>
          <SectionTitle title={tr('docs.section.favorites')} />
          {favorites.slice(0, 3).map((d) => <DocCard key={d.id} doc={d} children={kids} onPress={() => open(d)} selecting={selecting} selected={selected.includes(d.id)} />)}
        </View>
      ) : null}
      {!loading && !failed && list.length ? <SectionTitle title={filtering ? tr('docs.section.results', { count: list.length }) : tr('docs.section.library')} /> : null}
    </View>
  );

  return (
    <Screen
      back
      title={tr('docs.title')}
      subtitle={tr('docs.subtitle')}
      scroll={false}
      padded={false}
      action={selecting ? undefined : { label: tr('docs.scan'), icon: 'camera', onPress: () => { haptic('light'); router.push('/documents/scan?from=camera'); }, disabled: atLimit, testID: 'docs-scan' }}
      footer={selecting ? (
        <Row>
          <Button label={tr('common.cancel')} variant="secondary" onPress={() => { setSelecting(false); setSelected([]); }} style={{ flex: 1 }} />
          <Button label={tr('docs.select.export', { count: selected.length })} icon="share" disabled={!selected.length} onPress={() => router.push(`/documents/export?ids=${selected.join(',')}`)} style={{ flex: 2 }} />
        </Row>
      ) : undefined}
    >
      <VirtualList
        data={loading || failed ? [] : list}
        keyExtractor={(d) => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={header}
        renderItem={({ item: d }) => <DocCard doc={d} children={kids} onPress={() => open(d)} selecting={selecting} selected={selected.includes(d.id)} />}
        ListEmptyComponent={loading || failed ? null : filtering ? (
          <EmptyState icon="search" title={tr('docs.empty.noMatch')} body={tr('docs.empty.noMatchBody')} action={{ label: tr('docs.empty.clear'), icon: 'x', onPress: () => { setQuery(''); setSubject(null); setGroup(null); setFlag(null); } }} />
        ) : (
          <EmptyState icon="folder" title={tr('docs.empty.title')} body={tr('docs.empty.body')} action={{ label: tr('docs.scan'), icon: 'camera', onPress: () => router.push('/documents/scan?from=camera') }} />
        )}
        ListFooterComponent={typeof limit === 'number' && count > 0 && limit < 1000 ? <Text variant="caption" muted center style={{ marginTop: spacing.sm }}>{tr('docs.quota', { count, limit })}</Text> : null}
      />

      <Sheet visible={importOpen} onClose={() => setImportOpen(false)} title={tr('docs.import')}>
        <View style={{ gap: spacing.sm }}>
          <Button label={tr('docs.import.files')} icon="file" variant="secondary" onPress={() => importFrom('files')} full />
          <Button label={tr('docs.import.photos')} icon="image" variant="secondary" onPress={() => importFrom('photos')} full />
          <View style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }}>
            <Text variant="small" muted>{tr('docs.import.formats')}</Text>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
