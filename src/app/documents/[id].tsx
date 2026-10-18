/**
 * Fiche d'un document : original, informations, texte lu (corrigeable), éléments repérés et leur statut,
 * ordonnance, résumé fidèle (3 niveaux), rappels à partir d'une date confirmée, partage, export, suppression.
 *
 * Rien n'est tenu pour exact sans geste de l'utilisatrice : « extrait automatiquement » → « vérifié par moi »
 * → « confirmé par un professionnel » (seulement si une source est indiquée).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Divider, Field, haptic, Icon, IconButton, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, BackendError, eq } from '@/lib/backend';
import { useActivePregnancy, useChildren, useInvalidate, useMyMembership, useRows } from '@/lib/data/hooks';
import { saveFields, updateDocument, useDocument, useExtractions } from '@/lib/data/hooks-documents';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { buildSummary, type SummaryLevel } from '@/lib/documents/summary';
import { datesInLine, parseDocumentText } from '@/lib/documents/textParse';
import { categoryDef, categoryLabel, suggestCategory, type DocCategory } from '@/lib/documents/taxonomy';
import { CategoryPicker, formatSize, OriginBadge, Badge, sameSubject, SubjectPicker, subjectColumns, subjectLabel, subjectOf, type Subject } from '@/features/documents';
import type { DocumentRow, ExtractionStatus, Reminder } from '@/lib/types';
import { formatDate, formatTime, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const BUCKET = 'documents';
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Ouvre l'original par un lien temporaire (5 minutes). */
async function openOriginal(doc: DocumentRow): Promise<void> {
  const url = await backend.storage.signedUrl(BUCKET, doc.storage_path, 300);
  if (!url) throw new Error('not_found');
  if (Platform.OS === 'web') {
    // Les navigateurs bloquent l'ouverture directe d'une adresse data: : on passe par un objet temporaire
    const href = url.startsWith('data:') ? URL.createObjectURL(await (await fetch(url)).blob()) : url;
    window.open(href, '_blank', 'noopener');
    return;
  }
  await Linking.openURL(url);
}

type Fields = {
  values?: { name: string; value: string; unit: string | null; range: string | null }[];
  medications?: { name: string; dose: string | null; instructions: string | null; duration: string | null }[];
  currentTreatment?: boolean;
};

export default function DocumentDetail() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const isOwner = useMyMembership()?.role === 'owner';
  const { id } = useLocalSearchParams<{ id: string }>();
  const docQ = useDocument(id);
  const doc = docQ.data?.[0] ?? null;
  const exQ = useExtractions(id);
  const fieldsRow = exQ.data?.find((x) => x.kind === 'fields') ?? null;
  const { data: kids } = useChildren();
  const pregnancy = useActivePregnancy();
  const remindersQ = useRows<Reminder>(['reminders', 'doc', id ?? ''], id && userId ? { table: 'reminders', filters: [eq('user_id', userId), eq('deep_link', `/documents/${id}`)] } : null);

  const [busy, setBusy] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [editingText, setEditingText] = useState(false);
  const [level, setLevel] = useState<SummaryLevel>('quick');
  const [showSummary, setShowSummary] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fieldEdit, setFieldEdit] = useState<Fields | null>(null);
  const [proNote, setProNote] = useState('');
  const [proOpen, setProOpen] = useState(false);
  const [reminder, setReminder] = useState<{ id?: string; date: string; time: string; lead: 'same' | 'day' | 'week'; discreet: boolean; label: string; ambiguous?: boolean } | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => { if (doc) setText(doc.ocr_text ?? ''); }, [doc?.ocr_text]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aperçu en ligne : images (et PDF sur le web) par lien temporaire, oublié en quittant l'écran
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    if (!doc) return;
    (async () => {
      try {
        const url = await backend.storage.signedUrl(BUCKET, doc.storage_path, 300);
        if (!alive || !url) return;
        if (IMAGE_MIME.includes(doc.mime_type)) setPreview(url);
        else if (doc.mime_type === 'application/pdf' && Platform.OS === 'web') {
          objectUrl = url.startsWith('data:') ? URL.createObjectURL(await (await fetch(url)).blob()) : null;
          setPreview(objectUrl ?? url);
        }
      } catch { /* l'original reste ouvrable par le bouton */ }
    })();
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [doc?.storage_path]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = useMemo(() => (doc?.ocr_text ? parseDocumentText(doc.ocr_text, doc.title) : null), [doc?.ocr_text, doc?.title]);
  const summary = useMemo(() => (doc?.ocr_text && showSummary ? buildSummary({ text: doc.ocr_text, title: doc.title, category: doc.category, customCategory: doc.custom_category, confirmedDate: doc.doc_date }, level) : null), [doc, level, showSummary]);
  const status: ExtractionStatus | null = fieldsRow?.status ?? (doc?.ocr_text ? 'to_verify' : null);
  const saved = (fieldsRow?.fields ?? {}) as Fields;
  const canEdit = !!doc && (doc.uploaded_by === userId || (!doc.private_to_uploader && isOwner));

  if (docQ.isLoading && !doc) return <Screen back title={tr('docs.title')}><Skeleton kind="detail" /></Screen>;
  if (docQ.isError && !doc) return <Screen back title={tr('docs.title')}><ErrorView error={docQ.error} onRetry={() => void docQ.refetch()} /></Screen>;
  if (!doc) return <Screen back title={tr('docs.title')}><EmptyState icon="file" title={tr('docs.notFound.title')} body={tr('docs.notFound.body')} action={{ label: tr('docs.saved.back'), icon: 'folder', onPress: () => router.replace('/documents') }} /></Screen>;

  const refresh = () => inv('documents', 'document_extractions', 'reminders');
  async function patch(p: Partial<DocumentRow>, okMsg?: string) {
    try { await updateDocument(doc!.id, p); refresh(); if (okMsg) toast(okMsg); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  // ------------------------------------------------------------ lecture du texte
  async function readOnServer() {
    const ok = await confirm(tr('docs.read.serverTitle'), tr('docs.read.serverBody'), tr('docs.read.serverGo'), false);
    if (!ok) return;
    setBusy(tr('docs.read.reading')); setReadError(null);
    try {
      const r = await backend.invoke<{ status: string; text?: string }>('document-read', { document_id: doc!.id });
      if (r.status === 'to_verify' && r.text) {
        await updateDocument(doc!.id, { ocr_text: r.text, ocr_source: 'server', review_status: 'to_verify' });
        if (doc!.category === 'other') { const s = suggestCategory(r.text, doc!.title); if (s) await updateDocument(doc!.id, { category: s }); }
        refresh(); haptic('success'); toast(tr('docs.read.done'));
      } else setReadError(tr(r.status === 'not_configured' ? 'docs.read.notConfigured' : r.status === 'unreadable' ? 'docs.read.unreadable' : 'docs.read.demo'));
    } catch (e) {
      const code = e instanceof BackendError ? e.code : null;
      setReadError(code === 'consent_required' ? tr('docs.read.consent') : code === 'too_large' ? tr('docs.read.tooLarge') : code === 'unsupported' ? tr('docs.read.unsupported') : code === 'rate_limited' ? tr('docs.read.rateLimited') : tr('docs.read.failed'));
    } finally { setBusy(null); }
  }
  async function saveText() {
    const clean = text.replace(/\r/g, '').slice(0, 200000);
    await patch({ ocr_text: clean.trim() ? clean : null, ocr_source: doc!.ocr_source ?? 'manual', review_status: clean.trim() ? 'to_verify' : 'none' }, tr('docs.text.saved'));
    setEditingText(false);
  }

  // ------------------------------------------------------------ éléments repérés
  const autoFields = (): Fields => ({
    values: parsed?.values.map((v) => ({ name: v.name, value: v.value, unit: v.unit, range: v.range })) ?? [],
    medications: parsed?.medications.map((m) => ({ name: m.name, dose: m.dose, instructions: m.instructions, duration: m.duration })) ?? [],
    currentTreatment: saved.currentTreatment ?? false,
  });
  const shown: Fields = fieldsRow ? saved : autoFields();
  async function setStatus(s: ExtractionStatus, note?: string) {
    try {
      await saveFields(doc!.id, { ...shown }, s, fieldsRow?.source ?? (doc!.ocr_source === 'server' ? 'server' : doc!.ocr_source === 'device' ? 'device' : 'manual'), note);
      if (s === 'verified' || s === 'professional') await updateDocument(doc!.id, { review_status: 'verified' });
      refresh(); haptic('success'); toast(s === 'professional' ? tr('docs.fields.proDone') : tr('docs.fields.verifiedDone'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function saveFieldEdits() {
    if (!fieldEdit) return;
    try {
      // Une correction repasse toujours par « à vérifier » : c'est la personne qui valide ensuite
      await saveFields(doc!.id, fieldEdit as Record<string, unknown>, 'to_verify', 'manual');
      await updateDocument(doc!.id, { review_status: 'to_verify' });
      setFieldEdit(null); refresh(); toast(tr('docs.fields.corrected'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function setCurrentTreatment(v: boolean) {
    if (v && !(await confirm(tr('docs.rx.currentTitle'), tr('docs.rx.currentBody'), tr('docs.rx.currentGo'), false))) return;
    try { await saveFields(doc!.id, { ...shown, currentTreatment: v }, v ? 'verified' : (fieldsRow?.status ?? 'to_verify'), fieldsRow?.source ?? 'manual'); refresh(); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  // ------------------------------------------------------------ informations du document
  async function changeSubject(s: Subject) {
    if (sameSubject(s, subjectOf(doc!))) return;
    const ok = await confirm(tr('docs.subject.changeTitle'), tr('docs.subject.changeBody', { from: subjectLabel(subjectOf(doc!), kids), to: subjectLabel(s, kids) }), tr('docs.subject.changeGo'), false);
    if (ok) await patch(subjectColumns(s), tr('docs.subject.changed'));
  }
  async function toggleShare(v: boolean) {
    const ok = await confirm(v ? tr('docs.share.confirmOn') : tr('docs.share.confirmOff'), v ? tr('docs.share.confirmOnBody') : tr('docs.share.confirmOffBody'), v ? tr('docs.share.go') : tr('docs.share.stop'), false);
    if (ok) await patch({ private_to_uploader: !v }, v ? tr('docs.share.doneOn') : tr('docs.share.doneOff'));
  }
  async function remove() {
    const ok = await confirm(tr('docs.delete.title'), tr('docs.delete.body', { title: doc!.title }), tr('common.delete'));
    if (!ok) return;
    setBusy(tr('docs.delete.busy'));
    try {
      await backend.remove('documents', [eq('id', doc!.id)]); // supprime aussi texte, champs, résumés et rappels liés (base)
      await backend.storage.remove(BUCKET, [doc!.storage_path]).catch(() => undefined);
      inv('documents', 'document_extractions', 'reminders');
      toast(tr('docs.delete.done'));
      router.replace('/documents');
    } catch (e) { toast(friendlyError(e), 'error'); setBusy(null); }
  }

  // ------------------------------------------------------------ rappels
  function proposeReminder(raw: string | null, label: string) {
    const found = raw ? datesInLine(raw)[0] : undefined;
    setReminder({ date: found?.iso ? toFrDate(found.iso) : '', time: '09:00', lead: 'same', discreet: true, label, ambiguous: !!found?.ambiguous });
  }
  async function saveReminder() {
    if (!reminder) return;
    const iso = frToISO(reminder.date);
    const m = reminder.time.match(/^(\d{1,2})[:h](\d{2})$/);
    if (!iso || !m) return toast(tr('docs.rem.invalid'), 'error');
    const at = new Date(`${iso}T${m[1].padStart(2, '0')}:${m[2]}:00`);
    at.setDate(at.getDate() - (reminder.lead === 'day' ? 1 : reminder.lead === 'week' ? 7 : 0));
    if (at.getTime() < Date.now()) return toast(tr('docs.rem.past'), 'error');
    const row = {
      household_id: doc!.household_id, category: 'custom', schedule: { type: 'once', at: at.toISOString() }, enabled: true,
      title: reminder.discreet ? tr('docs.rem.discreetTitle') : reminder.label.slice(0, 80),
      body: reminder.discreet ? null : tr('docs.rem.body', { date: formatDate(iso) }).slice(0, 240),
      deep_link: `/documents/${doc!.id}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
    };
    try {
      if (reminder.id) await backend.update('reminders', row, [eq('id', reminder.id)]);
      else await backend.insert('reminders', { ...row, user_id: userId });
      setReminder(null); inv('reminders'); haptic('success'); toast(tr('docs.rem.saved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const def = categoryDef(doc.category);
  const reminders = remindersQ.data ?? [];
  const values = shown.values ?? [];
  const meds = shown.medications ?? [];
  const isRx = doc.category === 'prescription';

  return (
    <Screen back title={doc.title} subtitle={[categoryLabel(doc.category, doc.custom_category), subjectLabel(subjectOf(doc), kids)].join(' · ')}
      right={<IconButton icon="star" label={doc.favorite ? tr('docs.unfavorite') : tr('docs.favorite')} color={doc.favorite ? t.colors.gold : t.colors.textMuted} onPress={() => patch({ favorite: !doc.favorite })} />}>
      {busy ? <Banner tone="info" icon="loader">{busy}</Banner> : null}

      {/* Original */}
      <Appear kind="soft" delay={0.04}>
        <Card>
          {preview && IMAGE_MIME.includes(doc.mime_type) ? <Image source={{ uri: preview }} accessibilityLabel={tr('docs.preview')} style={{ width: '100%', height: 260, borderRadius: radius.sm, backgroundColor: '#fff' }} resizeMode="contain" /> : null}
          {preview && doc.mime_type === 'application/pdf' && Platform.OS === 'web' ? React.createElement('iframe', { src: preview, title: tr('docs.preview'), style: { width: '100%', height: 320, border: 0, borderRadius: 10, background: '#fff' } }) : null}
          <Row style={{ marginTop: preview ? spacing.sm : 0 }}>
            <Icon name={def.icon} color={t.colors.lavender} />
            <Text variant="small" muted style={{ flex: 1 }}>{[doc.mime_type === 'application/pdf' ? 'PDF' : doc.mime_type.replace('image/', '').toUpperCase(), tr('docs.pages', { count: doc.page_count }), formatSize(doc.size_bytes)].join(' · ')}</Text>
          </Row>
          <Button label={tr('docs.openOriginal')} icon="external-link" variant="secondary" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
            onPress={() => openOriginal(doc).catch(() => toast(tr('docs.err.open'), 'error'))} />
        </Card>
      </Appear>

      {/* Informations */}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="bold">{tr('docs.info')}</Text>
          {canEdit ? <Button label={tr('common.edit')} size="sm" variant="ghost" icon="edit-2" onPress={() => setMetaOpen(true)} /> : null}
        </Row>
        <Text variant="small">{tr('docs.info.date')} : {doc.doc_date ? `${formatDate(doc.doc_date)} (${tr('docs.confirmedByYou')})` : parsed?.documentDate?.iso ? `${formatDate(parsed.documentDate.iso)} (${tr('docs.detectedToConfirm')})` : tr('docs.info.noDate')}</Text>
        <Text variant="small">{tr('docs.info.for')} : {subjectLabel(subjectOf(doc), kids)}</Text>
        <Text variant="small">{tr('docs.info.added', { date: formatDate(doc.created_at) })}</Text>
        {!doc.doc_date && parsed?.documentDate?.iso && canEdit ? (
          <Button label={tr('docs.info.useDate', { date: formatDate(parsed.documentDate.iso) })} size="sm" variant="ghost" icon="check" onPress={() => patch({ doc_date: parsed.documentDate!.iso }, tr('docs.info.dateConfirmed'))} style={{ alignSelf: 'flex-start' }} />
        ) : null}
        {doc.notes ? <Text variant="small" muted>{doc.notes}</Text> : null}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="medium">{tr('docs.share.label')}</Text>
            <Text variant="caption" muted>{doc.private_to_uploader ? tr('docs.share.off') : tr('docs.share.on')}</Text>
          </View>
          {doc.uploaded_by === userId ? <Toggle label={tr('docs.share.label')} value={!doc.private_to_uploader} onChange={toggleShare} /> : <Badge icon="users" label={tr('docs.shared')} />}
        </Row>
      </Card>

      {/* Texte du document */}
      <SectionTitle title={tr('docs.text.title')} />
      <Card>
        {doc.ocr_text && !editingText ? (
          <>
            <Row wrap gap={6}>
              <Badge icon={doc.ocr_source === 'manual' ? 'edit-3' : 'cpu'} label={tr(`docs.text.source.${doc.ocr_source ?? 'manual'}` as 'docs.text.source.manual')} />
              {doc.review_status === 'verified' ? <Badge icon="check-circle" tone="success" label={tr('docs.verified')} /> : <Badge icon="alert-circle" tone="warning" label={tr('docs.toVerify')} />}
              {parsed?.uncertain.length ? <Badge icon="help-circle" tone="warning" label={tr('docs.text.uncertain', { count: parsed.uncertain.length })} /> : null}
            </Row>
            <Text variant="small" style={{ fontFamily: MONO, marginTop: spacing.xs }} numberOfLines={14} selectable>{doc.ocr_text}</Text>
            {canEdit ? <Button label={tr('docs.text.correct')} icon="edit-2" variant="secondary" size="sm" onPress={() => setEditingText(true)} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} /> : null}
          </>
        ) : editingText ? (
          <>
            <Text variant="small" muted>{tr('docs.text.editHint')}</Text>
            <Field label={tr('docs.text.label')} value={text} onChangeText={setText} multiline maxLength={200000} style={{ minHeight: 200, textAlignVertical: 'top' }} />
            <Row>
              <Button label={tr('common.cancel')} variant="secondary" onPress={() => { setText(doc.ocr_text ?? ''); setEditingText(false); }} style={{ flex: 1 }} />
              <Button label={tr('common.save')} onPress={saveText} style={{ flex: 1.4 }} />
            </Row>
          </>
        ) : (
          <>
            <Text variant="small" muted>{tr('docs.text.none')}</Text>
            {canEdit ? (
              <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                <Button label={tr('docs.read.server')} icon="cpu" variant="secondary" onPress={readOnServer} disabled={!!busy || !['application/pdf', ...IMAGE_MIME, 'image/heic'].includes(doc.mime_type)} />
                <Button label={tr('docs.read.manual')} icon="edit-3" variant="ghost" onPress={() => setEditingText(true)} />
              </View>
            ) : null}
            {readError ? <Banner tone="warning">{readError}</Banner> : null}
            <Text variant="caption" muted>{tr('docs.read.where')}</Text>
          </>
        )}
      </Card>

      {/* Éléments repérés */}
      {doc.ocr_text && (values.length || meds.length || parsed?.vaccines.length || parsed?.deadlines.length) ? (
        <>
          <SectionTitle title={tr('docs.fields.title')} />
          <Card>
            <Row wrap gap={6}>
              <Badge icon={status === 'to_verify' ? 'cpu' : 'check-circle'} tone={status === 'to_verify' ? 'warning' : 'success'} label={tr(`docs.status.${status ?? 'to_verify'}` as 'docs.status.to_verify')} />
            </Row>
            {fieldsRow?.status === 'professional' && fieldsRow.professional_note ? <Text variant="caption" muted>{tr('docs.fields.proSource', { note: fieldsRow.professional_note })}</Text> : null}
            {isRx ? (
              <Banner tone={shown.currentTreatment ? 'success' : 'info'} icon="clipboard" title={shown.currentTreatment ? tr('docs.rx.current') : tr('docs.rx.archived')}>
                {tr('docs.rx.notice')}
              </Banner>
            ) : null}
            {values.map((v, i) => (
              <View key={`v${i}`} style={{ paddingVertical: 4 }}>
                <Text weight="medium">{v.name}</Text>
                <Text variant="small">{v.value}{v.unit ? ` ${v.unit}` : ''}{v.range ? ` — ${tr('docs.sum.range', { range: v.range })}` : ` — ${tr('docs.sum.noRange')}`}</Text>
              </View>
            ))}
            {meds.map((m, i) => (
              <View key={`m${i}`} style={{ paddingVertical: 4, gap: 2 }}>
                <Text weight="medium">{m.name}</Text>
                <Text variant="small">{tr('docs.rx.dose')} : {m.dose ?? tr('docs.rx.notReadable')}</Text>
                <Text variant="small">{tr('docs.rx.instructions')} : {m.instructions ?? tr('docs.rx.notWritten')}</Text>
                <Text variant="small">{tr('docs.rx.duration')} : {m.duration ?? tr('docs.rx.notWritten')}</Text>
              </View>
            ))}
            {parsed?.renewal ? <Text variant="small">{tr('docs.rx.renewal')} : {parsed.renewal}</Text> : null}
            {parsed?.vaccines.map((v, i) => <Text key={`vac${i}`} variant="small">• {v.text}</Text>)}
            {isRx || values.some((v) => !v.unit) || meds.some((m) => !m.dose) ? <Text variant="caption" muted>{tr('docs.fields.checkOriginal')}</Text> : null}
            {canEdit ? (
              <Row wrap style={{ marginTop: spacing.xs }}>
                <Button label={tr('docs.fields.correct')} icon="edit-2" size="sm" variant="secondary" onPress={() => setFieldEdit(JSON.parse(JSON.stringify(shown)))} />
                {status !== 'verified' && status !== 'professional' ? <Button label={tr('docs.fields.markVerified')} icon="check" size="sm" onPress={() => setStatus('verified')} /> : null}
                {status !== 'professional' ? <Button label={tr('docs.fields.markPro')} size="sm" variant="ghost" onPress={() => { setProNote(''); setProOpen(true); }} /> : null}
                {isRx ? (
                  <Row style={{ justifyContent: 'space-between', flex: 1, minWidth: 220 }}>
                    <Text variant="small" style={{ flex: 1 }}>{tr('docs.rx.currentToggle')}</Text>
                    <Toggle label={tr('docs.rx.currentToggle')} value={!!shown.currentTreatment} onChange={setCurrentTreatment} />
                  </Row>
                ) : null}
              </Row>
            ) : null}
          </Card>
        </>
      ) : null}

      {/* Échéances et rappels */}
      {parsed?.deadlines.length || reminders.length ? (
        <>
          <SectionTitle title={tr('docs.rem.title')} />
          <Card>
            {parsed?.deadlines.map((d, i) => (
              <View key={`d${i}`} style={{ gap: 4, paddingVertical: 4 }}>
                <Text variant="small">{d.text}</Text>
                <Button label={tr('docs.rem.add')} icon="bell" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => proposeReminder(d.date, d.text)} />
              </View>
            ))}
            {reminders.map((r) => (
              <Row key={r.id} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{r.title}</Text>
                  <Text variant="caption" muted>{r.schedule.type === 'once' ? `${formatDate(r.schedule.at)} · ${formatTime(r.schedule.at)}` : ''}</Text>
                </View>
                <Toggle label={tr('docs.rem.enabled')} value={r.enabled} onChange={(v) => backend.update('reminders', { enabled: v }, [eq('id', r.id)]).then(() => inv('reminders'))} />
                <IconButton icon="edit-2" label={tr('common.edit')} size={18} onPress={() => setReminder({ id: r.id, date: r.schedule.type === 'once' ? toFrDate(r.schedule.at.slice(0, 10)) : '', time: r.schedule.type === 'once' ? formatTime(r.schedule.at).replace(/\s?[AP]M$/i, '') : '09:00', lead: 'same', discreet: !r.body, label: r.title })} />
                <IconButton icon="trash-2" label={tr('common.delete')} size={18} color={t.colors.textMuted} onPress={async () => { if (await confirm(tr('docs.rem.deleteTitle'), tr('docs.rem.deleteBody'), tr('common.delete'))) { await backend.remove('reminders', [eq('id', r.id)]); inv('reminders'); } }} />
              </Row>
            ))}
          </Card>
        </>
      ) : null}
      {doc.ocr_text ? <Button label={tr('docs.rem.addOwn')} icon="bell" variant="ghost" onPress={() => proposeReminder(null, doc.title)} /> : null}

      {/* Résumé */}
      <SectionTitle title={tr('docs.sum.title')} />
      {!doc.ocr_text ? (
        <Card tone="soft"><Text variant="small" muted>{tr('docs.sum.needText')}</Text></Card>
      ) : !showSummary ? (
        <Button label={tr('docs.sum.go')} icon="align-left" onPress={() => { haptic('light'); setShowSummary(true); }} full />
      ) : summary ? (
        <Appear kind="soft" delay={0.02}>
          <Card>
            <Segmented label={tr('docs.sum.level')} options={[{ value: 'quick', label: tr('docs.sum.quick') }, { value: 'detailed', label: tr('docs.sum.detailed') }, { value: 'simple', label: tr('docs.sum.simple') }]} value={level} onChange={setLevel} />
            <Banner tone="info" icon="info">{tr('docs.sum.notice')}</Banner>
            {summary.unreadable ? <Banner tone="warning" title={tr('docs.sum.unreadableTitle')}>{tr('docs.sum.unreadable')}</Banner> : null}
            {summary.sections.map((s, si) => (
              <Appear key={s.key + level} kind="soft" delay={0.03 * si}>
                <View style={{ gap: 4, marginTop: spacing.sm }}>
                  <Text variant="label">{tr(`docs.sec.${s.key}` as 'docs.sec.type')}</Text>
                  {s.items.map((it, i) => (
                    <View key={i} style={{ gap: 3 }}>
                      <Text variant="small">{it.text}</Text>
                      <Row gap={6}><OriginBadge origin={it.origin} /></Row>
                    </View>
                  ))}
                </View>
              </Appear>
            ))}
            <Button label={tr('docs.openOriginal')} icon="external-link" variant="secondary" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.md }} onPress={() => openOriginal(doc).catch(() => toast(tr('docs.err.open'), 'error'))} />
          </Card>
        </Appear>
      ) : null}

      {/* Actions */}
      <SectionTitle title={tr('docs.actions')} />
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('docs.export.one')} icon="share" variant="secondary" onPress={() => router.push(`/documents/export?ids=${doc.id}`)} full />
        {canEdit ? <Button label={doc.archived ? tr('docs.unarchive') : tr('docs.archive')} icon="archive" variant="secondary" onPress={() => patch({ archived: !doc.archived }, doc.archived ? tr('docs.unarchived') : tr('docs.archivedDone'))} full /> : null}
        {canEdit ? <Button label={tr('docs.delete.button')} icon="trash-2" variant="ghost" onPress={remove} full /> : null}
      </View>

      {/* Modifier les informations */}
      <Sheet visible={metaOpen} onClose={() => setMetaOpen(false)} title={tr('docs.info.edit')}>
        <MetaEditor doc={doc} kids={kids} pregnancy={pregnancy} suggested={parsed?.category ?? null}
          onSave={async (p, s) => { setMetaOpen(false); if (s) await changeSubject(s); if (Object.keys(p).length) await patch(p, tr('docs.info.saved')); }} />
      </Sheet>

      {/* Corriger les éléments repérés */}
      <Sheet visible={!!fieldEdit} onClose={() => setFieldEdit(null)} title={tr('docs.fields.correct')}>
        {fieldEdit ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="small" muted>{tr('docs.fields.editHint')}</Text>
            {(fieldEdit.values ?? []).map((v, i) => (
              <Card key={`ev${i}`} tone="soft">
                <Field label={tr('docs.fields.name')} value={v.name} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, values: f!.values!.map((y, j) => (j === i ? { ...y, name: x } : y)) }))} />
                <Row>
                  <Field label={tr('docs.fields.value')} value={v.value} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, values: f!.values!.map((y, j) => (j === i ? { ...y, value: x } : y)) }))} style={{ flex: 1 }} />
                  <Field label={tr('docs.fields.unit')} value={v.unit ?? ''} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, values: f!.values!.map((y, j) => (j === i ? { ...y, unit: x || null } : y)) }))} style={{ flex: 1 }} />
                </Row>
                <Field label={tr('docs.fields.range')} optional value={v.range ?? ''} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, values: f!.values!.map((y, j) => (j === i ? { ...y, range: x || null } : y)) }))} />
              </Card>
            ))}
            {(fieldEdit.medications ?? []).map((m, i) => (
              <Card key={`em${i}`} tone="soft">
                <Field label={tr('docs.rx.name')} value={m.name} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, medications: f!.medications!.map((y, j) => (j === i ? { ...y, name: x } : y)) }))} />
                <Field label={tr('docs.rx.dose')} value={m.dose ?? ''} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, medications: f!.medications!.map((y, j) => (j === i ? { ...y, dose: x || null } : y)) }))} />
                <Field label={tr('docs.rx.instructions')} value={m.instructions ?? ''} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, medications: f!.medications!.map((y, j) => (j === i ? { ...y, instructions: x || null } : y)) }))} />
                <Field label={tr('docs.rx.duration')} value={m.duration ?? ''} onChangeText={(x) => setFieldEdit((f) => ({ ...f!, medications: f!.medications!.map((y, j) => (j === i ? { ...y, duration: x || null } : y)) }))} />
              </Card>
            ))}
            <Button label={tr('common.save')} onPress={saveFieldEdits} full />
          </View>
        ) : null}
      </Sheet>

      {/* Confirmation professionnelle : seulement avec une source */}
      <Sheet visible={proOpen} onClose={() => setProOpen(false)} title={tr('docs.fields.markPro')}>
        <Text variant="small" muted>{tr('docs.fields.proHint')}</Text>
        <Field label={tr('docs.fields.proNote')} value={proNote} onChangeText={setProNote} maxLength={300} placeholder={tr('docs.fields.proPh')} />
        <Button label={tr('common.save')} disabled={!proNote.trim()} onPress={() => { setProOpen(false); void setStatus('professional', proNote.trim()); }} full />
      </Sheet>

      {/* Rappel : date à confirmer, moment, texte discret */}
      <Sheet visible={!!reminder} onClose={() => setReminder(null)} title={reminder?.id ? tr('docs.rem.edit') : tr('docs.rem.add')}>
        {reminder ? (
          <View style={{ gap: spacing.sm }}>
            {reminder.ambiguous ? <Banner tone="warning">{tr('docs.rem.ambiguous')}</Banner> : <Text variant="small" muted>{tr('docs.rem.confirmDate')}</Text>}
            <Field label={tr('docs.rem.date')} value={reminder.date} onChangeText={(v) => setReminder({ ...reminder, date: v, ambiguous: false })} placeholder={tr('docs.details.datePh')} keyboardType="numbers-and-punctuation" />
            <Field label={tr('docs.rem.time')} value={reminder.time} onChangeText={(v) => setReminder({ ...reminder, time: v })} placeholder="09:00" keyboardType="numbers-and-punctuation" />
            <Segmented label={tr('docs.rem.when')} options={[{ value: 'same', label: tr('docs.rem.sameDay') }, { value: 'day', label: tr('docs.rem.dayBefore') }, { value: 'week', label: tr('docs.rem.weekBefore') }]} value={reminder.lead} onChange={(v) => setReminder({ ...reminder, lead: v })} />
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text>{tr('docs.rem.discreet')}</Text>
                <Text variant="caption" muted>{reminder.discreet ? tr('docs.rem.discreetOn') : tr('docs.rem.discreetOff')}</Text>
              </View>
              <Toggle label={tr('docs.rem.discreet')} value={reminder.discreet} onChange={(v) => setReminder({ ...reminder, discreet: v })} />
            </Row>
            <Button label={tr('docs.rem.confirm')} icon="bell" onPress={saveReminder} full />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

/** Nom, catégorie, profil, date, notes. */
function MetaEditor({ doc, kids, pregnancy, suggested, onSave }: {
  doc: DocumentRow; kids: ReturnType<typeof useChildren>['data']; pregnancy: ReturnType<typeof useActivePregnancy>; suggested: DocCategory | null;
  onSave: (p: Partial<DocumentRow>, subject: Subject | null) => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [cat, setCat] = useState<DocCategory>(doc.category);
  const [custom, setCustom] = useState(doc.custom_category ?? '');
  const [subject, setSubject] = useState<Subject>(subjectOf(doc));
  const [date, setDate] = useState(doc.doc_date ? toFrDate(doc.doc_date) : '');
  const [notes, setNotes] = useState(doc.notes ?? '');
  const [err, setErr] = useState<string | null>(null);
  return (
    <View style={{ gap: spacing.sm }}>
      <Field label={tr('docs.details.name')} value={title} onChangeText={setTitle} maxLength={120} />
      <CategoryPicker value={cat} custom={custom} suggested={suggested} onChange={(c, v) => { setCat(c); setCustom(v); }} />
      <SubjectPicker value={subject} onChange={setSubject} kids={kids} pregnancy={pregnancy} />
      <Field label={tr('docs.details.date')} optional value={date} onChangeText={setDate} placeholder={tr('docs.details.datePh')} keyboardType="numbers-and-punctuation" />
      <Field label={tr('docs.details.notes')} optional value={notes} onChangeText={setNotes} multiline maxLength={4000} />
      {err ? <Banner tone="warning">{err}</Banner> : null}
      <Button label={tr('common.save')} full onPress={() => {
        const iso = date.trim() ? frToISO(date) : null;
        if (!title.trim()) return setErr(tr('docs.err.title'));
        if (date.trim() && !iso) return setErr(tr('v.dateFormat'));
        if (cat === 'custom' && !custom.trim()) return setErr(tr('docs.err.custom'));
        const p: Partial<DocumentRow> = {};
        if (title.trim() !== doc.title) p.title = title.trim();
        if (cat !== doc.category || (custom || null) !== doc.custom_category) { p.category = cat; p.custom_category = cat === 'custom' ? custom.trim() : null; }
        if (iso !== doc.doc_date) p.doc_date = iso;
        if ((notes.trim() || null) !== doc.notes) p.notes = notes.trim() || null;
        onSave(p, sameSubject(subject, subjectOf(doc)) ? null : subject);
      }} />
    </View>
  );
}
