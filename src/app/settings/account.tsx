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
import { useAuth } from '@/lib/auth';
import { friendlyError, useDeleteAccount, useExportData } from '@/lib/data/hooks-settings';
import { exportJson, exportPdf } from '@/lib/exportData';
import { wipeLocalData } from '@/lib/localWipe';
import { passwordSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

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

  async function changePassword() {
    if (inFlight.current) return;
    const p = passwordSchema.safeParse(pw);
    if (!p.success) return setPwError(p.error.issues[0].message);
    if (pw !== pw2) return setPwError('Les deux mots de passe ne correspondent pas.');
    setPwError(null);
    inFlight.current = true;
    setPwBusy(true);
    try {
      await backend.auth.updatePassword(pw);
      setPw(''); setPw2('');
      toast('Mot de passe modifié.');
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
        toast(how === 'download' ? 'Fichier téléchargé.' : how === 'file' ? 'Export prêt.' : 'Le partage de fichier n’est pas disponible sur cet appareil.', how === 'text' ? 'error' : 'success');
      } else {
        await exportPdf(data, session?.email ?? null);
      }
    } catch (e) {
      toast(friendlyError(e, 'L’export n’a pas pu être préparé. Réessayez.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function startDelete() {
    const ok = await confirm(
      'Supprimer définitivement votre compte ?',
      'Toutes vos données seront effacées : suivi, documents, photos, conversations, publications. Un foyer partagé dont vous êtes propriétaire sera transmis au membre le plus ancien. Pensez à exporter vos données avant. Un abonnement en cours se résilie depuis l’App Store ou Google Play.',
      'Continuer',
    );
    if (ok) { setTyped(''); setDeleteOpen(true); }
  }

  async function finalDelete() {
    try {
      await deleteAccount.mutateAsync();
      await wipeLocalData();
      setDeleteOpen(false);
      toast('Votre compte et vos données ont été supprimés.', 'info');
      router.replace('/welcome');
    } catch (e) {
      toast(friendlyError(e, 'La suppression n’a pas pu aboutir. Réessayez ou écrivez-nous.'), 'error');
    }
  }

  return (
    <Screen back title="Mon compte">
      <Card>
        <ListRow icon="mail" title="Adresse e-mail" subtitle={session?.email ?? '—'} />
        {isDemo ? <Text variant="caption" muted>Compte de démonstration enregistré uniquement sur ce téléphone.</Text> : null}
      </Card>

      <SectionTitle title="Mot de passe" />
      <Card>
        {pwError ? <Banner tone="danger">{pwError}</Banner> : null}
        <Field label="Nouveau mot de passe" value={pw} onChangeText={setPw} secureTextEntry revealable autoComplete="new-password" textContentType="newPassword" />
        <PasswordRules value={pw} />
        <Field label="Confirmer le mot de passe" value={pw2} onChangeText={setPw2} secureTextEntry revealable autoComplete="new-password" onSubmitEditing={changePassword} />
        <Button label="Changer le mot de passe" icon="lock" loading={pwBusy} disabled={pwBusy || !pw} style={{ marginTop: spacing.sm }} onPress={changePassword} />
        <Text variant="caption" muted style={{ marginTop: 4 }}>Connecté·e avec Apple ou Google ? Ce mot de passe permettra aussi de vous connecter par e-mail.</Text>
      </Card>

      <SectionTitle title="Mes données" />
      <Card>
        <Text variant="small" muted>Tout ce que vous avez saisi, dans un fichier que vous gardez. Les photos chiffrées ne sont pas incluses : elles ne peuvent être ouvertes que sur ce téléphone.</Text>
        <Button label="Exporter (fichier JSON)" icon="download" variant="secondary" loading={busy === 'json'} disabled={!!busy} style={{ marginTop: spacing.sm }} onPress={() => doExport('json')} />
        <Button label="Exporter (PDF lisible)" icon="file-text" variant="secondary" loading={busy === 'pdf'} disabled={!!busy} style={{ marginTop: spacing.xs }} onPress={() => doExport('pdf')} />
      </Card>

      <SectionTitle title="Supprimer mon compte" />
      <Card>
        <Text variant="small">La suppression efface réellement vos données et vos photos, sur le serveur et sur ce téléphone. Elle est immédiate et définitive.</Text>
        <Button label="Supprimer mon compte" variant="danger" icon="trash-2" style={{ marginTop: spacing.sm }} onPress={startDelete} />
      </Card>
      <Button label="Confidentialité et consentements" variant="ghost" icon="shield" onPress={() => router.push('/settings/privacy')} />

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirmer la suppression">
        <Banner tone="danger" title="Action irréversible">{'Pour confirmer, saisissez SUPPRIMER en majuscules.'}</Banner>
        <Field label="Confirmation" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} placeholder="SUPPRIMER" />
        <Button label="Supprimer définitivement" variant="danger" disabled={typed.trim() !== 'SUPPRIMER'} loading={deleteAccount.isPending} onPress={finalDelete} />
      </Sheet>
    </Screen>
  );
}
