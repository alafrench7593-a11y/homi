/**
 * Coffre à documents du foyer (stockage privé, accès par URL signée temporaire).
 * Version gratuite : 15 documents ; au-delà, l'abonnement est proposé sans bloquer la consultation.
 */
import React, { useMemo, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { PremiumGate } from '@/components/Family';
import { EmptyStateCard } from '@/components/ui-extra';
import { Banner, Button, Card, Chip, Field, haptic, Icon, type IconName, IconButton, Row, Text, Toggle } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, BackendError, eq } from '@/lib/backend';
import { ensureHousehold, useDocuments, useHouseholdId, useInvalidate, useMyMembership } from '@/lib/data/hooks';
import { usePlanLimit } from '@/lib/data/hooks-me';
import { formatDateFr, frToISO } from '@/lib/domain/dates';
import { uuid } from '@/lib/uuid';
import type { DocCategory, DocumentRow } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const BUCKET = 'documents';
const MAX_BYTES = 26_214_400; // 25 Mo, comme le bucket
const ALLOWED: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/webp': 'webp' };

const CATEGORIES: { value: DocCategory; label: string; icon: IconName }[] = [
  { value: 'ultrasound', label: 'Échographie', icon: 'radio' },
  { value: 'report', label: 'Compte rendu', icon: 'file-text' },
  { value: 'blood_test', label: 'Analyse', icon: 'droplet' },
  { value: 'prescription', label: 'Ordonnance', icon: 'clipboard' },
  { value: 'letter', label: 'Courrier', icon: 'mail' },
  { value: 'photo', label: 'Photo', icon: 'image' },
  { value: 'other', label: 'Autre', icon: 'file' },
];
const catMeta = (c: DocCategory) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];

interface Picked { uri: string; name: string; mimeType: string; size: number }

function normalizeMime(mime: string | undefined, name: string): string | null {
  const m = (mime ?? '').toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  if (ALLOWED[m]) return m;
  const ext = name.split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', webp: 'image/webp' };
  return ext ? byExt[ext] ?? null : null;
}

async function sizeOf(uri: string, known?: number | null): Promise<number> {
  if (known && known > 0) return known;
  try {
    return (await (await fetch(uri)).blob()).size;
  } catch {
    return 0;
  }
}

const formatSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`);

export default function DocumentsScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const hid = useHouseholdId();
  const { data: docs, isLoading } = useDocuments();
  const isOwner = useMyMembership()?.role === 'owner';
  const { data: limit } = usePlanLimit('documents_count');
  const [filter, setFilter] = useState<DocCategory | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<Picked | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocCategory>('report');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [priv, setPriv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [quotaHit, setQuotaHit] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const list = useMemo(() => (docs ?? []).filter((d) => filter === 'all' || d.category === filter), [docs, filter]);
  const count = docs?.length ?? 0;
  const nearLimit = typeof limit === 'number' && count >= limit;

  function reset() {
    setFile(null);
    setTitle('');
    setCategory('report');
    setDate('');
    setNotes('');
    setPriv(false);
    setErrors({});
  }

  function accept(p: { uri: string; name: string; mimeType?: string | null; size?: number | null }) {
    const mime = normalizeMime(p.mimeType ?? undefined, p.name);
    if (!mime) return toast('Format non pris en charge : PDF, JPEG, PNG, HEIC ou WebP.', 'error');
    sizeOf(p.uri, p.size).then((size) => {
      if (size > MAX_BYTES) return toast('Fichier trop volumineux (25 Mo maximum).', 'error');
      setFile({ uri: p.uri, name: p.name, mimeType: mime, size: Math.max(1, size) });
      if (!title.trim()) setTitle(p.name.replace(/\.[^.]+$/, '').slice(0, 120));
      if (mime.startsWith('image/') && category === 'report') setCategory('photo');
    });
  }

  async function pickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: Object.keys(ALLOWED), copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      accept({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
    } catch {
      toast('Impossible d’ouvrir le sélecteur de fichiers.', 'error');
    }
  }

  async function pickPhoto() {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return toast('Autorisez l’accès aux photos dans les réglages du téléphone.', 'info');
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      accept({ uri: a.uri, name: a.fileName ?? `photo-${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg', size: a.fileSize });
    } catch {
      toast('Impossible d’ouvrir vos photos.', 'error');
    }
  }

  async function save() {
    const e: Record<string, string> = {};
    if (!file) e.file = 'Choisissez un fichier.';
    if (!title.trim()) e.title = 'Donnez un nom à ce document.';
    const iso = date.trim() ? frToISO(date) : null;
    if (date.trim() && !iso) e.date = 'Format attendu : JJ/MM/AAAA.';
    setErrors(e);
    if (Object.keys(e).length || !file) return;
    setSaving(true);
    let path: string | null = null;
    try {
      const household_id = hid ?? (await ensureHousehold());
      path = `${household_id}/${uuid()}.${ALLOWED[file.mimeType]}`;
      await backend.storage.upload(BUCKET, path, { uri: file.uri, mimeType: file.mimeType, size: file.size, name: file.name });
      await backend.insert('documents', {
        household_id, uploaded_by: userId, category, title: title.trim().slice(0, 120), doc_date: iso, notes: notes.trim() || null,
        storage_path: path, mime_type: file.mimeType, size_bytes: file.size, private_to_uploader: priv,
      });
      inv('documents');
      if (!hid) inv('memberships');
      haptic('success');
      toast('Document ajouté au coffre.');
      setOpen(false);
      reset();
    } catch (err) {
      if (path) await backend.storage.remove(BUCKET, [path]).catch(() => undefined);
      if (err instanceof BackendError && err.isPremiumRequired) {
        setOpen(false);
        setQuotaHit(err.message);
      } else {
        toast(err instanceof Error ? err.message : 'Envoi impossible.', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function openDoc(d: DocumentRow) {
    setOpening(d.id);
    try {
      const url = await backend.storage.signedUrl(BUCKET, d.storage_path, 300);
      if (!url) throw new Error('Fichier introuvable sur cet appareil.');
      await Linking.openURL(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Ouverture impossible.', 'error');
    } finally {
      setOpening(null);
    }
  }

  async function remove(d: DocumentRow) {
    if (!(await confirm('Supprimer ce document ?', `« ${d.title} » sera supprimé définitivement pour tout le foyer.`, 'Supprimer'))) return;
    try {
      await backend.remove('documents', [eq('id', d.id)]);
      await backend.storage.remove(BUCKET, [d.storage_path]).catch(() => undefined);
      inv('documents');
      setQuotaHit(null);
      toast('Document supprimé.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Suppression impossible.', 'error');
    }
  }

  return (
    <Screen
      back
      title="Documents"
      subtitle="Échographies, comptes rendus, ordonnances — stockés de façon privée."
      footer={<Button label="Ajouter un document" icon="upload" onPress={() => { reset(); setOpen(true); }} full />}
    >
      <Banner tone="info">{'Vos documents sont accessibles uniquement aux membres de votre foyer autorisés, via un lien temporaire. Vous pouvez en garder certains pour vous seul·e.'}</Banner>

      {(quotaHit || nearLimit) && (
        <>
          <Banner tone="warning" title="Coffre plein">{quotaHit ?? `Vous avez atteint la limite de ${limit} documents. Vos documents restent consultables ; supprimez-en un ou passez à l’abonnement pour en ajouter.`}</Banner>
          <PremiumGate feature="Jusqu’à 2 000 documents dans le coffre"><View /></PremiumGate>
        </>
      )}

      <Row wrap>
        <Chip label="Tous" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORIES.filter((c) => docs?.some((d) => d.category === c.value)).map((c) => (
          <Chip key={c.value} label={c.label} icon={c.icon} selected={filter === c.value} onPress={() => setFilter(c.value)} />
        ))}
      </Row>

      {list.map((d) => {
        const meta = catMeta(d.category);
        return (
          <Card key={d.id} onPress={() => openDoc(d)} accessibilityLabel={`${d.title}, ${meta.label}. Ouvrir`} accessibilityHint="Ouvre le document dans un lien temporaire">
            <Row>
              <Icon name={d.mime_type === 'application/pdf' ? 'file-text' : meta.icon} color={t.colors.lavender} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold" numberOfLines={2}>{d.title}</Text>
                <Text variant="caption" muted>
                  {[meta.label, d.doc_date ? formatDateFr(d.doc_date) : null, formatSize(d.size_bytes), d.private_to_uploader ? 'Privé' : null].filter(Boolean).join(' · ')}
                </Text>
                {d.notes ? <Text variant="small" muted numberOfLines={2}>{d.notes}</Text> : null}
              </View>
              {opening === d.id ? <Text variant="caption" muted>Ouverture…</Text> : null}
              {(d.uploaded_by === userId || isOwner) && <IconButton icon="trash-2" label={`Supprimer ${d.title}`} onPress={() => remove(d)} color={t.colors.textMuted} />}
            </Row>
          </Card>
        );
      })}
      {!isLoading && !list.length && (
        <EmptyStateCard illustration="letter" title={filter === 'all' ? 'Votre coffre est vide' : 'Aucun document dans cette catégorie'} text="Ajoutez un PDF ou une photo : comptes rendus d’échographie, résultats, ordonnances…" />
      )}
      {typeof limit === 'number' && count > 0 && limit < 1000 && <Text variant="caption" muted center>{count} / {limit} documents (version gratuite)</Text>}

      <Sheet visible={open} onClose={() => setOpen(false)} title="Ajouter un document">
        <Row>
          <Button label="Fichier (PDF, image)" icon="file" variant="secondary" onPress={pickFile} style={{ flex: 1 }} />
          <Button label="Photo" icon="image" variant="secondary" onPress={pickPhoto} style={{ flex: 1 }} />
        </Row>
        {file ? (
          <Card tone="soft">
            <Row>
              <Icon name={file.mimeType === 'application/pdf' ? 'file-text' : 'image'} />
              <Text style={{ flex: 1 }} numberOfLines={1}>{file.name}</Text>
              <Text variant="caption" muted>{formatSize(file.size)}</Text>
            </Row>
          </Card>
        ) : errors.file ? (
          <Text variant="small" color={t.colors.danger}>{errors.file}</Text>
        ) : (
          <Text variant="small" muted>PDF, JPEG, PNG, HEIC ou WebP, 25 Mo maximum.</Text>
        )}
        <Field label="Nom du document" value={title} onChangeText={setTitle} error={errors.title} maxLength={120} />
        <Text variant="label">Catégorie</Text>
        <Row wrap>{CATEGORIES.map((c) => <Chip key={c.value} label={c.label} icon={c.icon} selected={category === c.value} onPress={() => setCategory(c.value)} />)}</Row>
        <Field label="Date du document" optional value={date} onChangeText={setDate} error={errors.date} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
        <Field label="Notes" optional value={notes} onChangeText={setNotes} multiline maxLength={4000} style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text>Visible uniquement par moi</Text>
            <Text variant="caption" muted>Les autres membres du foyer ne le verront pas.</Text>
          </View>
          <Toggle label="Visible uniquement par moi" value={priv} onChange={setPriv} />
        </Row>
        <Button label="Enregistrer dans le coffre" onPress={save} loading={saving} full style={{ marginTop: spacing.xs }} />
      </Sheet>
    </Screen>
  );
}
