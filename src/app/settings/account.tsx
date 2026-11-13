/**
 * Profil › Mon compte : adresse e-mail, mot de passe, export de toutes les données (JSON et PDF)
 * et suppression du compte DANS l'application (avec confirmation), qui efface réellement données et photos.
 */
import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { PasswordRules } from '@/features/auth';
import { backend, isDemo } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import { useAuth } from '@/lib/auth';
import { friendlyError, useDeleteAccount, useExportData } from '@/lib/data/hooks-settings';
import { exportJson, exportPdf } from '@/lib/exportData';
import { wipeLocalData } from '@/lib/localWipe';
import { issueText, passwordSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function AccountScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [busy, setBusy] = useState<'json' | 'pdf' | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const inFlight = useRef(false);
  const confirmWord = tr('u1.acc.confirmWord');

  async function changePassword() {
    if (inFlight.current) return;
    const p = passwordSchema.safeParse(pw);
    // Message du schéma encodé (clé de traduction) : traduit ici, jamais affiché brut (« v.password.length »)
    if (!p.success) return setPwError(issueText(p.error.issues[0].message));
    if (pw !== pw2) return setPwError(tr('u1.acc.pwMismatch'));
    setPwError(null);
    inFlight.current = true;
    setPwBusy(true);
    try {
      await backend.auth.updatePassword(pw);
      setPw(''); setPw2('');
      toast(tr('u1.acc.pwChanged'));
    } catch (e) {
      setPwError(friendlyError(e));
    } finally {
      inFlight.current = false;
      setPwBusy(false);
    }
  }

  async function doExport(kind: 'json' | 'pdf') {
    setBusy(kind);
    try {
      const data = await exportData.mutateAsync();
      if (kind === 'json') {
        const how = await exportJson(data);
        toast(how === 'download' ? tr('u1.acc.downloaded') : how === 'file' ? tr('u1.acc.exportReady') : tr('u1.acc.shareUnavailable'), how === 'text' ? 'error' : 'success');
      } else {
        await exportPdf(data, session?.email ?? null);
      }
    } catch (e) {
      toast(friendlyError(e, tr('u1.acc.exportFailed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function startDelete() {
    const ok = await confirm(
      tr('u1.acc.deleteTitle'),
      tr('u1.acc.deleteBody'),
      tr('u1.acc.continue'),
    );
    if (ok) { setTyped(''); setDeleteOpen(true); }
  }

  async function finalDelete() {
    try {
      await deleteAccount.mutateAsync();
      await wipeLocalData();
      setDeleteOpen(false);
      toast(tr('u1.acc.deleted'), 'info');
      router.replace('/welcome');
    } catch (e) {
      // Audit 2 : refus du service (500, 429…) → message propre à la suppression (« Réessayez ou écrivez-nous »),
      // au lieu du générique « service momentanément indisponible » ; hors connexion → message réseau.
      toast(e instanceof BackendError && e.isNetwork ? friendlyError(e) : tr('u1.acc.deleteFailed'), 'error');
    }
  }

  return (
    <Screen back title={tr('u1.acc.title')}>
      <Card>
        <ListRow icon="mail" title={tr('u1.acc.email')} subtitle={session?.email ?? '—'} />
        {isDemo ? <Text variant="caption" muted>{tr('u1.acc.demoAccount')}</Text> : null}
      </Card>

      <SectionTitle title={tr('u1.acc.password')} />
      <Card>
        {pwError ? <Banner tone="danger">{pwError}</Banner> : null}
        <Field label={tr('u1.acc.newPassword')} value={pw} onChangeText={setPw} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" />
        <PasswordRules value={pw} />
        <Field label={tr('u1.acc.confirmPassword')} value={pw2} onChangeText={setPw2} secureTextEntry revealable autoComplete="new-password" onSubmitEditing={changePassword} />
        <Button label={tr('u1.acc.changePassword')} icon="lock" loading={pwBusy} disabled={pwBusy || !pw} style={{ marginTop: spacing.sm }} onPress={changePassword} />
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u1.acc.socialHint')}</Text>
      </Card>

      <SectionTitle title={tr('u1.acc.myData')} />
      <Card>
        <Text variant="small" muted>{tr('u1.acc.exportIntro')}</Text>
        <Button label={tr('u1.acc.exportJson')} icon="download" variant="secondary" loading={busy === 'json'} disabled={!!busy} style={{ marginTop: spacing.sm }} onPress={() => doExport('json')} />
        <Button label={tr('u1.acc.exportPdf')} icon="file-text" variant="secondary" loading={busy === 'pdf'} disabled={!!busy} style={{ marginTop: spacing.xs }} onPress={() => doExport('pdf')} />
      </Card>

      <SectionTitle title={tr('u1.acc.deleteSection')} />
      <Card>
        <Text variant="small">{tr('u1.acc.deleteExplain')}</Text>
        <Button label={tr('u1.acc.deleteSection')} variant="danger" icon="trash-2" style={{ marginTop: spacing.sm }} onPress={startDelete} />
      </Card>
      <Button label={tr('u1.acc.privacy')} variant="ghost" icon="shield" onPress={() => router.push('/settings/privacy')} />

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title={tr('u1.acc.confirmDelete')}>
        <Banner tone="danger" title={tr('u1.acc.irreversible')}>{tr('u1.acc.typeToConfirm', { word: confirmWord })}</Banner>
        <Field label={tr('u1.acc.confirmation')} value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} placeholder={confirmWord} />
        <Button label={tr('u1.acc.deleteForever')} variant="danger" disabled={typed.trim() !== confirmWord} loading={deleteAccount.isPending} onPress={finalDelete} />
      </Sheet>
    </Screen>
  );
}
