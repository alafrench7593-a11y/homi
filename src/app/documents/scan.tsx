/**
 * Numériser ou importer un document.
 *  1. Pages : photo (autorisation demandée à ce moment-là) ou photos importées ; bords détectés quand c'est possible,
 *     recadrage à la main, perspective redressée, rotation, couleur ou niveaux de gris, lisibilité, alerte de flou,
 *     ordre des pages, suppression, nouvelle prise, aperçu.
 *  2. Informations : nom, catégorie (suggérée, modifiable), profil associé (affiché clairement), date, partage.
 *  3. Enregistrement : un seul PDF créé SUR L'APPAREIL, envoyé dans l'espace privé ; lecture locale du texte si disponible.
 * Tout le traitement d'image a lieu sur l'appareil. Les copies temporaires sont effacées.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Platform, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Banner, Button, Card, Field, haptic, Icon, IconButton, Row, Segmented, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, BackendError } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO } from '@/lib/domain/dates';
import { BLUR_THRESHOLD, detectQuad, enhance, fullQuad, rotate90, sharpness, toGray, warpPerspective, type Quad } from '@/lib/documents/imageOps';
import { ACCEPTED, capturePhoto, dataUri, decodeForScan, deviceReadingAvailable, encodeJpeg, readBytes, readPageOnDevice, type PickedFile } from '@/lib/documents/io';
import { pdfFromJpegs, pdfPageCount } from '@/lib/documents/pdf';
import { takePendingImport } from '@/lib/documents/pending';
import { suggestCategory, type DocCategory } from '@/lib/documents/taxonomy';
import { CategoryPicker, formatSize, SubjectPicker, subjectColumns, subjectLabel, type Subject } from '@/features/documents';
import type { RGBAImage } from '@/lib/cycleAnalysis/image';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';
import { uuid } from '@/lib/uuid';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const BUCKET = 'documents';
const MAX_PAGES = 30;

interface Page {
  id: string;
  src: RGBAImage;
  srcPreview: string;
  quad: Quad;
  detected: boolean;
  rotation: 0 | 90 | 180 | 270;
  mode: 'color' | 'gray';
  enhance: boolean;
  jpeg: Uint8Array;
  preview: string;
  w: number;
  h: number;
  sharp: number;
}

function render(p: Omit<Page, 'jpeg' | 'preview' | 'w' | 'h'>): Pick<Page, 'jpeg' | 'preview' | 'w' | 'h'> {
  let img = warpPerspective(p.src, p.quad);
  for (let r = 0; r < p.rotation; r += 90) img = rotate90(img, 'cw');
  if (p.mode === 'gray') img = toGray(img);
  if (p.enhance) img = enhance(img);
  const jpeg = encodeJpeg(img, 80);
  return { jpeg, preview: dataUri(jpeg, 'image/jpeg'), w: img.width, h: img.height };
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 16));

export default function ScanScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const hid = useHouseholdId();
  const { data: kids } = useChildren();
  const pregnancy = useActivePregnancy();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [step, setStep] = useState<'pages' | 'details' | 'saving' | 'done'>('pages');
  const [pages, setPages] = useState<Page[]>([]);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  // Informations
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocCategory>('other');
  const [custom, setCustom] = useState('');
  const [suggested, setSuggested] = useState<DocCategory | null>(null);
  const [subject, setSubject] = useState<Subject>({ kind: 'me' });
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [share, setShare] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const started = useRef(false);

  // Fichiers choisis sur l'écran précédent, ou appareil photo ouvert directement (mobile)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const p = takePendingImport();
    if (p?.kind === 'photos') void addImages(p.files.map((f) => ({ uri: f.uri, temp: false })));
    else if (p?.kind === 'files') { setFiles(p.files); setTitle(p.files.length === 1 ? p.files[0].name.replace(/\.[^.]+$/, '').slice(0, 120) : ''); setStep('details'); }
    else if (from === 'camera' && Platform.OS !== 'web') void takePhoto();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addImages(list: { uri: string; temp: boolean }[], replaceId?: string) {
    setBusy(tr('docs.scan.processing'));
    await nextFrame();
    const added: Page[] = [];
    try {
      for (const { uri, temp } of list) {
        if (pages.length + added.length >= MAX_PAGES && !replaceId) { toast(tr('docs.scan.maxPages', { max: MAX_PAGES }), 'info'); break; }
        try {
          const src = await decodeForScan(uri);
          const det = detectQuad(src);
          const base = {
            id: replaceId ?? uuid(), src, srcPreview: dataUri(encodeJpeg(src, 70), 'image/jpeg'), quad: det && det.confidence > 0.6 ? det.quad : fullQuad(src), detected: !!det && det.confidence > 0.6,
            rotation: 0 as const, mode: 'color' as const, enhance: true, sharp: sharpness(src),
          };
          added.push({ ...base, ...render(base) });
        } catch {
          toast(tr('docs.err.unreadableImage'), 'error');
        } finally {
          if (temp) await discardLocalImage(uri); // photo de la caméra : la copie temporaire est effacée
        }
        await nextFrame();
      }
      if (replaceId) setPages((ps) => ps.map((p) => (p.id === replaceId ? added[0] ?? p : p)));
      else setPages((ps) => [...ps, ...added]);
      if (added.some((p) => p.sharp < BLUR_THRESHOLD)) toast(tr('docs.scan.blurry'), 'info');
      if (added.length) haptic('success');
    } finally {
      setBusy(null);
    }
  }

  async function takePhoto(replaceId?: string) {
    try {
      const r = await capturePhoto();
      if (r === 'denied') return toast(tr('docs.err.cameraDenied'), 'info');
      if (r) await addImages([{ uri: r, temp: Platform.OS !== 'web' }], replaceId);
    } catch {
      toast(tr('docs.err.camera'), 'error');
    }
  }

  async function addFromPhotos() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { pickPhotos } = require('@/lib/documents/io') as typeof import('@/lib/documents/io');
    const r = await pickPhotos(true);
    if (r === 'denied') return toast(tr('docs.err.photosDenied'), 'info');
    if (r.length) await addImages(r.map((x) => ({ uri: x.uri, temp: false })));
  }

  async function update(id: string, patch: Partial<Pick<Page, 'quad' | 'rotation' | 'mode' | 'enhance' | 'detected'>>) {
    setBusy(tr('docs.scan.processing'));
    await nextFrame();
    setPages((ps) => ps.map((p) => { if (p.id !== id) return p; const next = { ...p, ...patch }; return { ...next, ...render(next) }; }));
    setBusy(null);
  }
  const move = (i: number, d: -1 | 1) => setPages((ps) => { const a = [...ps]; const j = i + d; if (j < 0 || j >= a.length) return ps; [a[i], a[j]] = [a[j], a[i]]; haptic('selection'); return a; });
  async function removePage(id: string) {
    if (!(await confirm(tr('docs.scan.removeTitle'), tr('docs.scan.removeBody'), tr('common.delete')))) return;
    setPages((ps) => ps.filter((p) => p.id !== id));
  }

  /** Passage aux informations : lecture locale du texte si le téléphone le permet (aucun envoi). */
  async function toDetails() {
    if (!pages.length) return;
    setStep('details');
    if (deviceReadingAvailable() && text == null) {
      setBusy(tr('docs.scan.reading'));
      try {
        const parts: string[] = [];
        for (const p of pages) parts.push(await readPageOnDevice(p.jpeg));
        const all = parts.map((s, i) => (pages.length > 1 ? `— ${tr('docs.page', { n: i + 1 })} —\n${s}` : s)).join('\n\n');
        setText(all);
        const s = suggestCategory(all, title);
        setSuggested(s);
        if (s && category === 'other') setCategory(s);
      } catch {
        setText(null); // la lecture pourra être relancée depuis la fiche du document
      } finally {
        setBusy(null);
      }
    }
  }

  async function save() {
    const e: Record<string, string> = {};
    if (!files.length && !title.trim()) e.title = tr('docs.err.title');
    const iso = date.trim() ? frToISO(date) : null;
    if (date.trim() && !iso) e.date = tr('v.dateFormat');
    if (category === 'custom' && !custom.trim()) e.custom = tr('docs.err.custom');
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep('saving');
    const uploaded: string[] = [];
    try {
      const household_id = hid ?? (await ensureHousehold());
      const common = {
        household_id, uploaded_by: userId, category, custom_category: category === 'custom' ? custom.trim() : null, doc_date: iso,
        notes: notes.trim() || null, private_to_uploader: !share, ...subjectColumns(subject),
      };
      let lastId: string | null = null;
      if (pages.length) {
        const pdf = await pdfFromJpegs(pages.map((p) => ({ bytes: p.jpeg, width: p.w, height: p.h })), title.trim());
        const path = `${household_id}/${uuid()}.pdf`;
        await backend.storage.upload(BUCKET, path, { uri: '', bytes: pdf, mimeType: 'application/pdf', size: pdf.length, name: `${title.trim()}.pdf` });
        uploaded.push(path);
        const [row] = await backend.insert<{ id: string }>('documents', {
          ...common, title: title.trim().slice(0, 120), storage_path: path, mime_type: 'application/pdf', size_bytes: pdf.length, page_count: pages.length,
          ocr_text: text, ocr_source: text != null ? 'device' : null, review_status: text != null ? 'to_verify' : 'none',
        });
        lastId = row?.id ?? null;
      } else {
        for (const f of files) {
          const path = `${household_id}/${uuid()}.${ACCEPTED[f.mimeType]}`;
          let pageCount = 1;
          if (f.mimeType === 'application/pdf') { try { pageCount = Math.min(200, await pdfPageCount(await readBytes(f.uri))); } catch { pageCount = 1; } }
          await backend.storage.upload(BUCKET, path, { uri: f.uri, mimeType: f.mimeType, size: f.size, name: f.name });
          uploaded.push(path);
          const name = files.length === 1 && title.trim() ? title.trim() : f.name.replace(/\.[^.]+$/, '');
          const [row] = await backend.insert<{ id: string }>('documents', { ...common, title: name.slice(0, 120), storage_path: path, mime_type: f.mimeType, size_bytes: f.size, page_count: pageCount });
          lastId = row?.id ?? null;
        }
      }
      inv('documents');
      haptic('success');
      setSavedId(files.length > 1 ? null : lastId);
      setStep('done');
      setPages([]); // libère la mémoire des pages
    } catch (err) {
      // Rien ne reste à moitié enregistré : les fichiers déjà envoyés sont retirés
      await backend.storage.remove(BUCKET, uploaded).catch(() => undefined);
      setStep('details');
      toast(err instanceof BackendError && err.isPremiumRequired ? err.message : friendlyError(err, tr('docs.err.save')), 'error');
    }
  }

  const editingPage = pages.find((p) => p.id === editing) ?? null;

  if (step === 'done') {
    return (
      <Screen title={tr('docs.saved.title')}>
        <Appear kind="pop" delay={0.05}>
          <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary }}>
              <Icon name="check" size={44} color={t.colors.primaryText} />
            </View>
            <Text center>{share ? tr('docs.saved.shared') : tr('docs.saved.private')}</Text>
            <Text center muted>{tr('docs.saved.for', { who: subjectLabel(subject, kids) })}</Text>
          </View>
        </Appear>
        {savedId ? <Button label={tr('docs.saved.open')} icon="file-text" onPress={() => router.replace(`/documents/${savedId}`)} full /> : null}
        <Button label={tr('docs.saved.back')} variant="secondary" onPress={() => router.replace('/documents')} full />
      </Screen>
    );
  }

  if (step === 'details' || step === 'saving') {
    return (
      <Screen back title={tr('docs.details.title')} subtitle={pages.length ? tr('docs.details.pages', { count: pages.length }) : tr('docs.details.files', { count: files.length })}
        footer={<Button label={pages.length ? tr('docs.details.savePdf') : tr('docs.details.save')} icon="save" loading={step === 'saving'} onPress={save} full />}>
        {busy ? <Banner tone="info" icon="loader">{busy}</Banner> : null}
        {files.length ? (
          <Card tone="soft">
            {files.map((f) => (
              <Row key={f.uri}><Icon name={f.mimeType === 'application/pdf' ? 'file-text' : 'image'} /><Text style={{ flex: 1 }} numberOfLines={1}>{f.name}</Text><Text variant="caption" muted>{formatSize(f.size)}</Text></Row>
            ))}
          </Card>
        ) : null}
        {files.length > 1 ? <Text variant="small" muted>{tr('docs.details.batchNote')}</Text> : (
          <Field label={tr('docs.details.name')} value={title} onChangeText={setTitle} error={errors.title} maxLength={120} placeholder={tr('docs.details.namePh')} />
        )}
        <CategoryPicker value={category} custom={custom} suggested={suggested} onChange={(c, v) => { setCategory(c); setCustom(v); }} />
        {errors.custom ? <Text variant="small" color={t.colors.danger}>{errors.custom}</Text> : null}
        <SubjectPicker value={subject} onChange={setSubject} kids={kids} pregnancy={pregnancy} />
        <Banner tone="info" icon="user">{tr('docs.details.willBeFor', { who: subjectLabel(subject, kids) })}</Banner>
        <Field label={tr('docs.details.date')} optional value={date} onChangeText={setDate} error={errors.date} placeholder={tr('docs.details.datePh')} keyboardType="numbers-and-punctuation" />
        <Field label={tr('docs.details.notes')} optional value={notes} onChangeText={setNotes} multiline maxLength={4000} style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="medium">{tr('docs.share.label')}</Text>
              <Text variant="caption" muted>{share ? tr('docs.share.on') : tr('docs.share.off')}</Text>
            </View>
            <Toggle label={tr('docs.share.label')} value={share} onChange={setShare} />
          </Row>
        </Card>
        {text != null ? <Banner tone="success" icon="cpu">{tr('docs.details.readOnDevice')}</Banner> : pages.length ? <Text variant="caption" muted>{tr('docs.details.readLater')}</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen back title={tr('docs.scan.title')} subtitle={tr('docs.scan.subtitle')}
      footer={pages.length && !editing ? (
        <Row>
          <Button label={previewing ? tr('docs.scan.edit') : tr('docs.scan.preview')} icon={previewing ? 'edit-2' : 'eye'} variant="secondary" onPress={() => setPreviewing(!previewing)} style={{ flex: 1 }} />
          <Button label={tr('common.continue')} onPress={toDetails} disabled={!!busy} style={{ flex: 1.4 }} />
        </Row>
      ) : undefined}>
      {busy ? <Banner tone="info" icon="loader">{busy}</Banner> : null}
      {editingPage ? (
        <CropEditor page={editingPage} onCancel={() => setEditing(null)} onApply={(quad, detected) => { setEditing(null); void update(editingPage.id, { quad, detected }); }} />
      ) : previewing ? (
        <View style={{ gap: spacing.md }}>
          <Text muted>{tr('docs.scan.previewHint')}</Text>
          {pages.map((p, i) => (
            <View key={p.id} style={{ gap: 4 }}>
              <Text variant="caption" muted>{tr('docs.page', { n: i + 1 })}</Text>
              <Image source={{ uri: p.preview }} accessibilityLabel={tr('docs.page', { n: i + 1 })} style={{ width: '100%', aspectRatio: p.w / p.h, borderRadius: radius.sm, backgroundColor: '#fff' }} resizeMode="contain" />
            </View>
          ))}
        </View>
      ) : (
        <>
          <Appear kind="pop" delay={0.05}>
            <View style={{ gap: spacing.xs }}>
              <Button label={pages.length ? tr('docs.scan.addPage') : tr('docs.scan.takePhoto')} icon="camera" size="lg" onPress={() => takePhoto()} disabled={!!busy} full />
              <Button label={tr('docs.scan.fromPhotos')} icon="image" variant="secondary" onPress={addFromPhotos} disabled={!!busy} full />
            </View>
          </Appear>
          {!pages.length ? (
            <Card tone="soft">
              <Text weight="bold">{tr('docs.scan.tipsTitle')}</Text>
              <Text variant="small" muted>{tr('docs.scan.tips')}</Text>
              <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{Platform.OS === 'web' ? tr('docs.scan.webNote') : tr('docs.scan.deviceNote')}</Text>
            </Card>
          ) : null}
          {pages.map((p, i) => (
            <Appear key={p.id} kind="soft" delay={0.02}>
              <Card>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Tappable accessibilityRole="button" accessibilityLabel={tr('docs.scan.cropA11y', { n: i + 1 })} onPress={() => setEditing(p.id)}>
                    <Image source={{ uri: p.preview }} style={{ width: 84, height: 84 * (p.h / p.w), maxHeight: 130, borderRadius: 8, backgroundColor: '#fff' }} resizeMode="contain" />
                  </Tappable>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text weight="bold">{tr('docs.page', { n: i + 1 })}</Text>
                      <Row gap={0}>
                        <IconButton icon="arrow-up" label={tr('docs.scan.up', { n: i + 1 })} onPress={() => move(i, -1)} size={18} />
                        <IconButton icon="arrow-down" label={tr('docs.scan.down', { n: i + 1 })} onPress={() => move(i, 1)} size={18} />
                      </Row>
                    </Row>
                    <Text variant="caption" muted>{p.detected ? tr('docs.scan.edgesFound') : tr('docs.scan.edgesNone')}</Text>
                    {p.sharp < BLUR_THRESHOLD ? <Text variant="caption" color={t.colors.gold}>{tr('docs.scan.blurryPage')}</Text> : null}
                    <Segmented label={tr('docs.scan.render')} options={[{ value: 'color', label: tr('docs.scan.color') }, { value: 'gray', label: tr('docs.scan.gray') }]} value={p.mode} onChange={(v) => update(p.id, { mode: v })} />
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text variant="small">{tr('docs.scan.enhance')}</Text>
                      <Toggle label={tr('docs.scan.enhance')} value={p.enhance} onChange={(v) => update(p.id, { enhance: v })} />
                    </Row>
                    <Row wrap gap={0}>
                      <IconButton icon="crop" label={tr('docs.scan.crop', { n: i + 1 })} onPress={() => setEditing(p.id)} size={18} />
                      <IconButton icon="rotate-cw" label={tr('docs.scan.rotate', { n: i + 1 })} onPress={() => update(p.id, { rotation: ((p.rotation + 90) % 360) as Page['rotation'] })} size={18} />
                      <IconButton icon="camera" label={tr('docs.scan.retake', { n: i + 1 })} onPress={() => takePhoto(p.id)} size={18} />
                      <IconButton icon="trash-2" label={tr('docs.scan.remove', { n: i + 1 })} onPress={() => removePage(p.id)} size={18} color={t.colors.textMuted} />
                    </Row>
                  </View>
                </Row>
              </Card>
            </Appear>
          ))}
        </>
      )}
    </Screen>
  );
}

/** Recadrage : quatre coins à déplacer sur la photo d'origine ; détection automatique ou page entière. */
function CropEditor({ page, onCancel, onApply }: { page: Page; onCancel: () => void; onApply: (q: Quad, detected: boolean) => void }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const boxW = Math.min(width, 440) - spacing.lg * 2;
  const scale = boxW / page.src.width;
  const boxH = page.src.height * scale;
  const [quad, setQuad] = useState<Quad>(page.quad);
  const quadRef = useRef(quad);
  quadRef.current = quad;
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const responders = useMemo(() => [0, 1, 2, 3].map((idx) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startRef.current = { ...quadRef.current[idx] }; },
    onPanResponderMove: (_e, g) => {
      const s = startRef.current; if (!s) return;
      const x = Math.max(0, Math.min(page.src.width - 1, s.x + g.dx / scale));
      const y = Math.max(0, Math.min(page.src.height - 1, s.y + g.dy / scale));
      setQuad((q) => { const n = [...q] as Quad; n[idx] = { x, y }; return n; });
    },
  })), [page.src.width, page.src.height, scale]);
  const H = 30;
  return (
    <View style={{ gap: spacing.md }}>
      <Text muted>{tr('docs.crop.hint')}</Text>
      <View style={{ width: boxW, height: boxH, alignSelf: 'center' }} accessibilityLabel={tr('docs.crop.area')}>
        <Image source={{ uri: page.srcPreview }} style={{ width: boxW, height: boxH, borderRadius: 6 }} />
        <Svg pointerEvents="none" width={boxW} height={boxH} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Polygon points={quad.map((c) => `${c.x * scale},${c.y * scale}`).join(' ')} fill={t.colors.primary} fillOpacity={0.12} stroke={t.colors.primary} strokeWidth={2} />
        </Svg>
        {quad.map((c, i) => (
          <View key={i} {...responders[i].panHandlers} accessibilityRole="adjustable" accessibilityLabel={tr(`docs.crop.corner${i}` as 'docs.crop.corner0')}
            style={{ position: 'absolute', left: c.x * scale - H / 2, top: c.y * scale - H / 2, width: H, height: H, borderRadius: H / 2, borderWidth: 3, borderColor: '#fff', backgroundColor: t.colors.primary, cursor: 'grab' } as never} />
        ))}
      </View>
      <Row wrap>
        <Button label={tr('docs.crop.detect')} icon="maximize" variant="secondary" size="sm" onPress={() => { const d = detectQuad(page.src); if (d) setQuad(d.quad); }} />
        <Button label={tr('docs.crop.full')} icon="square" variant="secondary" size="sm" onPress={() => setQuad(fullQuad(page.src))} />
      </Row>
      <Row>
        <Button label={tr('common.cancel')} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        <Button label={tr('docs.crop.apply')} onPress={() => onApply(quad, false)} style={{ flex: 1.4 }} />
      </Row>
    </View>
  );
}
