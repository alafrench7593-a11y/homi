/**
 * Export pour une consultation : choix des documents, résumés facultatifs, index, aperçu, puis partage
 * toujours déclenché par l'utilisatrice (feuille de partage du téléphone, ou téléchargement sur le web).
 * Aucun lien public n'est créé : le dossier PDF est fabriqué sur l'appareil.
 */
import React, { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Skeleton } from '@/components/States';
import { Banner, Button, Card, haptic, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend } from '@/lib/backend';
import { useChildren, useDocuments } from '@/lib/data/hooks';
import { buildExportPdf, type ExportItem } from '@/lib/documents/pdf';
import { buildSummary } from '@/lib/documents/summary';
import { readBytes } from '@/lib/documents/io';
import { deliverFile as deliver } from '@/lib/deliverFile';
import { categoryLabel } from '@/lib/documents/taxonomy';
import { DocCard, subjectLabel, subjectOf } from '@/features/documents';
import type { DocumentRow } from '@/lib/types';
import { formatDate, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

const BUCKET = 'documents';
const EMBEDDABLE = ['application/pdf', 'image/jpeg', 'image/png'];

async function fileBytes(doc: DocumentRow): Promise<Uint8Array> {
  const url = await backend.storage.signedUrl(BUCKET, doc.storage_path, 120);
  return readBytes(url);
}

export default function ExportScreen() {
  const toast = useToast();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const docsQ = useDocuments();
  const { data: kids } = useChildren();
  const [chosen, setChosen] = useState<string[]>(() => (ids ? ids.split(',').filter(Boolean) : []));
  const [withSummaries, setWithSummaries] = useState(false);
  const [building, setBuilding] = useState(false);
  const [ready, setReady] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const docs = docsQ.data ?? [];
  const selected = useMemo(() => chosen.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as DocumentRow[], [chosen, docs]);
  const others = docs.filter((d) => !chosen.includes(d.id) && !d.archived);
  const meta = (d: DocumentRow) => [categoryLabel(d.category, d.custom_category), d.doc_date ? formatDate(d.doc_date) : null, subjectLabel(subjectOf(d), kids)].filter(Boolean).join(' · ');
  const notEmbeddable = selected.filter((d) => !EMBEDDABLE.includes(d.mime_type));

  async function build() {
    setBuilding(true); setReady(null);
    try {
      const items: ExportItem[] = [];
      for (const d of selected) {
        let bytes: Uint8Array | null = null;
        if (EMBEDDABLE.includes(d.mime_type)) { try { bytes = await fileBytes(d); } catch { bytes = null; } }
        let summary: string | null = null;
        if (withSummaries && d.ocr_text) {
          const s = buildSummary({ text: d.ocr_text, title: d.title, category: d.category, customCategory: d.custom_category, confirmedDate: d.doc_date }, 'detailed');
          summary = s.sections.map((sec) => `${tr(`docs.sec.${sec.key}` as 'docs.sec.type')}\n${sec.items.map((i) => `- ${i.text} [${tr(`docs.origin.${i.origin}` as 'docs.origin.document')}]`).join('\n')}`).join('\n\n');
        }
        items.push({ title: d.title, meta: meta(d), mime: d.mime_type, bytes, summary });
      }
      const today = formatDate(new Date());
      const out = await buildExportPdf(items, {
        heading: tr('docs.export.heading'), generated: tr('docs.export.generated', { date: today, count: items.length }), notice: tr('docs.export.pdfNotice'),
        missing: tr('docs.export.missing'), summaryOf: tr('docs.export.summaryOf'), summaryNotice: tr('docs.export.summaryNotice'),
      });
      setReady({ bytes: out, name: `${tr('docs.export.fileName')}-${new Date().toISOString().slice(0, 10)}.pdf` });
      haptic('success');
    } catch {
      toast(tr('docs.export.failed'), 'error');
    } finally {
      setBuilding(false);
    }
  }

  return (
    <Screen back title={tr('docs.export.title')} subtitle={tr('docs.export.subtitle')}
      footer={ready ? (
        <Button label={Platform.OS === 'web' ? tr('docs.export.download') : tr('docs.export.share')} icon={Platform.OS === 'web' ? 'download' : 'share'} full
          onPress={() => deliver(ready.bytes, ready.name, 'application/pdf', tr('docs.export.heading')).catch(() => toast(tr('docs.export.shareFailed'), 'error'))} />
      ) : (
        <Button label={tr('docs.export.build')} icon="file-plus" loading={building} disabled={!selected.length} onPress={build} full />
      )}>
      {docsQ.isLoading && !docsQ.data ? <Skeleton rows={3} /> : (
        <>
          <Banner tone="warning" icon="alert-triangle" title={tr('docs.export.risksTitle')}>{tr('docs.export.risks')}</Banner>

          <SectionTitle title={tr('docs.export.included', { count: selected.length })} />
          {selected.map((d) => (
            <View key={d.id} style={{ gap: 4 }}>
              <DocCard doc={d} children={kids} selected selecting onPress={() => { setChosen((c) => c.filter((x) => x !== d.id)); setReady(null); }} />
            </View>
          ))}
          {!selected.length ? <Text muted>{tr('docs.export.none')}</Text> : null}
          <Button label={adding ? tr('docs.export.hideOthers') : tr('docs.export.addOthers')} icon={adding ? 'chevron-up' : 'plus'} variant="ghost" onPress={() => setAdding(!adding)} />
          {adding ? others.map((d) => <DocCard key={d.id} doc={d} children={kids} selecting onPress={() => { setChosen((c) => [...c, d.id]); setReady(null); }} />) : null}

          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="medium">{tr('docs.export.withSummaries')}</Text>
                <Text variant="caption" muted>{tr('docs.export.withSummariesHint')}</Text>
              </View>
              <Toggle label={tr('docs.export.withSummaries')} value={withSummaries} onChange={(v) => { setWithSummaries(v); setReady(null); }} />
            </Row>
          </Card>

          {/* Aperçu de ce qui part */}
          <SectionTitle title={tr('docs.export.preview')} />
          <Card tone="soft">
            <Text variant="small">1. {tr('docs.export.indexPage')}</Text>
            {selected.map((d, i) => (
              <Text key={d.id} variant="small">{i + 2}. {d.title} — {EMBEDDABLE.includes(d.mime_type) ? tr('docs.pages', { count: d.page_count }) : tr('docs.export.missing')}{withSummaries && d.ocr_text ? ` + ${tr('docs.export.summary')}` : ''}</Text>
            ))}
            <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('docs.export.infoIncluded')}</Text>
            <Text variant="caption" muted>{Platform.OS === 'web' ? tr('docs.export.destWeb') : tr('docs.export.destNative')}</Text>
          </Card>
          {notEmbeddable.length ? <Banner tone="info">{tr('docs.export.notEmbeddable', { list: notEmbeddable.map((d) => d.title).join(', ') })}</Banner> : null}
          {selected.length === 1 ? (
            <Button label={tr('docs.export.original')} icon="file" variant="secondary" onPress={async () => {
              try { const d = selected[0]; await deliver(await fileBytes(d), `${d.title}.${d.mime_type === 'application/pdf' ? 'pdf' : d.mime_type.split('/')[1]}`, d.mime_type, d.title); } catch { toast(tr('docs.export.shareFailed'), 'error'); }
            }} full />
          ) : null}
          {ready ? (
            <Appear kind="pop" delay={0.02}>
              <Banner tone="success" icon="check-circle" title={tr('docs.export.readyTitle')}>{tr('docs.export.ready', { size: `${Math.max(1, Math.round(ready.bytes.length / 1024))} Ko` })}</Banner>
            </Appear>
          ) : null}
          <Row gap={6}><Icon name="lock" size={14} /><Text variant="caption" muted style={{ flex: 1 }}>{tr('docs.export.noLink')}</Text></Row>
        </>
      )}
    </Screen>
  );
}
