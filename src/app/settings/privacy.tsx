/** Confidentialité : consentements, réglages, export (portabilité), suppression du compte, politique. */
import React, { useState } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Divider, Field, Loading, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { PRIVACY_POLICY, PRIVACY_POLICY_VERSION } from '@/content/privacy-policy';
import { isDemo } from '@/lib/backend';
import { useConsents, usePrivacy, useSetConsent } from '@/lib/data/hooks';
import { friendlyError, useDeleteAccount, useExportData, useUpdatePrivacy } from '@/lib/data/hooks-settings';
import { cancelAllLocal } from '@/lib/notifications';
import { setCrashReportingAllowed } from '@/lib/crashReporting';
import { wipeLocalData } from '@/lib/localWipe';
import type { ConsentPurpose, PrivacySettings } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const CONSENTS: { purpose: ConsentPurpose; title: string; detail: string; warnOff?: string }[] = [
  { purpose: 'health_data', title: 'Données de santé', detail: 'Enregistrer le suivi de grossesse, des enfants et votre suivi personnel.', warnOff: 'Sans ce consentement, nous ne pourrons plus enregistrer de nouvelles données de suivi. Les données existantes restent consultables, exportables et supprimables.' },
  { purpose: 'ai_assistant', title: 'Assistant', detail: 'Transmettre vos questions à l’intelligence artificielle Google Gemini (service externe) pour y répondre.' },
  { purpose: 'document_reading', title: 'Lecture automatique des documents', detail: 'Envoyer le document que vous choisissez d’analyser à l’intelligence artificielle Google Gemini (service externe) pour en extraire les informations.' },
  { purpose: 'marketing', title: 'Nouvelles de l’application', detail: 'Recevoir occasionnellement des nouveautés par e-mail.' },
];
const RETENTION = [6, 12, 24, 36, 60, 120];

/** Partage du fichier d'export : fichier JSON (téléphone), téléchargement (web), sinon texte. */
async function shareJson(data: unknown): Promise<'file' | 'download' | 'text'> {
  const json = JSON.stringify(data, null, 2);
  const name = `${BRAND.slug}-export-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const doc = (globalThis as { document?: { createElement: (t: string) => { href: string; download: string; click: () => void } } }).document;
    const blob = new Blob([json], { type: 'application/json' });
    if (doc && typeof URL !== 'undefined' && URL.createObjectURL) {
      const a = doc.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      return 'download';
    }
    return 'text';
  }
  try {
    if (await Sharing.isAvailableAsync()) {
      const file = new File(Paths.cache, name);
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exporter mes données', UTI: 'public.json' });
      return 'file';
    }
  } catch {
    // repli sur le partage de texte
  }
  return 'text';
}

export default function PrivacyScreen() {
  const t = useTheme();
  const toast = useToast();
  const { latest, isLoading: consentsLoading, data: consentRows } = useConsents();
  const setConsent = useSetConsent();
  const { data: privacy } = usePrivacy();
  const updatePrivacy = useUpdatePrivacy();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();

  const [policyOpen, setPolicyOpen] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const termsAt = consentRows?.find((c) => c.purpose === 'terms' && c.granted)?.created_at;

  async function toggleConsent(purpose: ConsentPurpose, granted: boolean, warnOff?: string) {
    if (!granted && warnOff && !(await confirm('Retirer ce consentement ?', warnOff, 'Retirer'))) return;
    try {
      await setConsent.mutateAsync({ purpose, granted });
      toast(granted ? 'Consentement enregistré.' : 'Consentement retiré.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function setSetting(patch: Partial<PrivacySettings>, consent?: ConsentPurpose) {
    try {
      await updatePrivacy.mutateAsync(patch);
      if (patch.crash_reports_enabled !== undefined) setCrashReportingAllowed(patch.crash_reports_enabled);
      if (consent) await setConsent.mutateAsync({ purpose: consent, granted: Object.values(patch)[0] === true });
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function doExport() {
    try {
      const data = await exportData.mutateAsync();
      const how = await shareJson(data);
      if (how === 'text') setExportText(JSON.stringify(data, null, 2));
      else toast(how === 'download' ? 'Fichier téléchargé.' : 'Export prêt.');
    } catch (e) {
      toast(friendlyError(e, 'L’export n’a pas pu être préparé.'), 'error');
    }
  }

  async function startDelete() {
    const ok = await confirm(
      'Supprimer définitivement votre compte ?',
      'Toutes vos données seront effacées : suivi, documents, conversations, publications. Si vous êtes propriétaire d’un foyer partagé, il sera transmis au membre le plus ancien. Pensez à exporter vos données avant. Un abonnement en cours doit être résilié depuis votre boutique.',
      'Continuer',
    );
    if (ok) { setTyped(''); setDeleteOpen(true); }
  }

  async function finalDelete() {
    try {
      await deleteAccount.mutateAsync();
      await cancelAllLocal().catch(() => undefined);
      await wipeLocalData();
      setDeleteOpen(false);
      toast('Votre compte a été supprimé.', 'info');
      router.replace('/welcome');
    } catch (e) {
      toast(friendlyError(e, 'La suppression n’a pas pu aboutir. Réessayez ou écrivez-nous.'), 'error');
    }
  }

  return (
    <Screen back title="Confidentialité" subtitle="Vos données vous appartiennent.">
      <Card tone="soft">
        <Text variant="small">{`${BRAND.name} n’affiche aucune publicité et ne vend aucune donnée. Vous pouvez à tout moment exporter ou supprimer ce que vous avez saisi.`}</Text>
        <Button label="Lire la politique de confidentialité" size="sm" variant="ghost" icon="file-text" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => setPolicyOpen(true)} />
      </Card>

      <SectionTitle title="Consentements" />
      <Card>
        {consentsLoading ? <Loading /> : CONSENTS.map((c, i) => (
          <View key={c.purpose}>
            {i > 0 ? <Divider /> : null}
            <Row style={{ paddingVertical: 6, alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="medium">{c.title}</Text>
                <Text variant="small" muted>{c.detail}</Text>
              </View>
              <Toggle label={c.title} value={latest.get(c.purpose) === true} onChange={(v) => toggleConsent(c.purpose, v, c.warnOff)} />
            </Row>
          </View>
        ))}
        <Divider />
        <Text variant="caption" muted>
          {termsAt ? `Conditions d’utilisation acceptées le ${new Date(termsAt).toLocaleDateString('fr-FR')}. ` : ''}
          {`Chaque choix est horodaté (version ${PRIVACY_POLICY_VERSION}).`}
        </Text>
      </Card>

      <SectionTitle title="Réglages" />
      <Card>
        {privacy ? (
          <View style={{ gap: 4 }}>
            {([
              ['ai_history_enabled', 'Conserver l’historique de l’assistant', 'Désactivé : vos questions ne sont pas enregistrées après la réponse.', undefined],
              ['community_visible', 'Apparaître dans la communauté', 'Votre pseudonyme reste visible sur vos publications.', undefined],
              ['analytics_enabled', 'Statistiques d’utilisation anonymes', 'Nous aide à améliorer l’application. Désactivé par défaut.', 'analytics'],
              ['crash_reports_enabled', 'Rapports de plantage', 'Envoi automatique d’informations techniques en cas d’erreur.', 'crash_reports'],
            ] as const).map(([key, title, detail, consent], i) => (
              <View key={key}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ paddingVertical: 6, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="medium">{title}</Text>
                    <Text variant="small" muted>{detail}</Text>
                  </View>
                  <Toggle label={title} value={!!privacy[key]} onChange={(v) => setSetting({ [key]: v }, consent)} />
                </Row>
              </View>
            ))}
            <Divider />
            <Text weight="medium">Durée de conservation de l’historique</Text>
            <Text variant="small" muted>Durée maximale pendant laquelle vous souhaitez que votre historique soit conservé. Vous pouvez aussi supprimer chaque entrée à tout moment.</Text>
            <Row wrap style={{ marginTop: 6 }}>
              {RETENTION.map((m) => (
                <Chip key={m} label={m < 12 ? `${m} mois` : `${m / 12} an${m >= 24 ? 's' : ''}`} selected={privacy.retention_months === m} onPress={() => setSetting({ retention_months: m })} />
              ))}
            </Row>
          </View>
        ) : <Loading />}
      </Card>

      <SectionTitle title="Mes données" />
      <Card>
        <Text weight="medium">Exporter mes données</Text>
        <Text variant="small" muted style={{ marginTop: 2 }}>Un fichier lisible (JSON) contenant tout ce que vous avez saisi : profil, consentements, suivi, rappels, conversations, foyers. Les fichiers du coffre se téléchargent séparément depuis Documents.</Text>
        <Button label="Exporter mes données" icon="download" variant="secondary" loading={exportData.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={doExport} />
      </Card>
      <Card tone="danger">
        <Text weight="bold" color={t.colors.danger}>Supprimer mon compte</Text>
        <Text variant="small" style={{ marginTop: 2 }}>Effacement définitif de toutes vos données et de vos fichiers. Cette action est irréversible.</Text>
        {isDemo ? <Text variant="caption" muted style={{ marginTop: 4 }}>En mode démonstration, toutes les données de cet appareil sont effacées.</Text> : null}
        <Button label="Supprimer mon compte" variant="danger" icon="trash-2" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={startDelete} />
      </Card>

      <Sheet visible={policyOpen} onClose={() => setPolicyOpen(false)} title="Politique de confidentialité">
        <Text variant="caption" muted>{`Version ${PRIVACY_POLICY_VERSION}`}</Text>
        {PRIVACY_POLICY.map((s) => (
          <View key={s.title} style={{ gap: 4 }}>
            <Text weight="bold">{s.title}</Text>
            <Text variant="small">{s.body}</Text>
          </View>
        ))}
      </Sheet>

      <Sheet visible={exportText != null} onClose={() => setExportText(null)} title="Mes données">
        <Text variant="small" muted>Le partage de fichier n’est pas disponible ici : vous pouvez copier le texte ou l’envoyer.</Text>
        <Button label="Partager le texte" icon="share-2" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => Share.share({ message: exportText ?? '', title: 'Mes données' }).catch(() => undefined)} />
        <ScrollView horizontal style={{ maxHeight: 360, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, padding: spacing.sm }}>
          <Text selectable variant="caption">{(exportText ?? '').slice(0, 20000)}{(exportText?.length ?? 0) > 20000 ? '\n…' : ''}</Text>
        </ScrollView>
      </Sheet>

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title="Dernière confirmation">
        <Banner tone="danger" title="Action irréversible">{'Pour confirmer, saisissez SUPPRIMER en majuscules.'}</Banner>
        <Field label="Confirmation" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} placeholder="SUPPRIMER" />
        <Button label="Supprimer définitivement" variant="danger" disabled={typed.trim() !== 'SUPPRIMER'} loading={deleteAccount.isPending} onPress={finalDelete} />
        <Button label="Annuler" variant="ghost" onPress={() => setDeleteOpen(false)} />
      </Sheet>
    </Screen>
  );
}
