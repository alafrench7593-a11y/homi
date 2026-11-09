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
import { t as tr, formatDate } from '@/i18n';

const consents = (): { purpose: ConsentPurpose; title: string; detail: string; warnOff?: string }[] => [
  { purpose: 'health_data', title: tr('u1.priv.healthTitle'), detail: tr('u1.priv.healthDetail'), warnOff: tr('u1.priv.healthWarn') },
  { purpose: 'ai_assistant', title: tr('u1.priv.aiTitle'), detail: tr('u1.priv.aiDetail') },
  { purpose: 'document_reading', title: tr('u1.priv.docTitle'), detail: tr('u1.priv.docDetail') },
  { purpose: 'marketing', title: tr('u1.priv.newsTitle'), detail: tr('u1.priv.newsDetail') },
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
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: tr('u1.priv.exportTitle'), UTI: 'public.json' });
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
  const confirmWord = tr('u1.acc.confirmWord');

  const termsAt = consentRows?.find((c) => c.purpose === 'terms' && c.granted)?.created_at;

  async function toggleConsent(purpose: ConsentPurpose, granted: boolean, warnOff?: string) {
    if (!granted && warnOff && !(await confirm(tr('u1.priv.withdrawTitle'), warnOff, tr('u1.priv.withdraw')))) return;
    try {
      await setConsent.mutateAsync({ purpose, granted });
      toast(granted ? tr('u1.priv.consentSaved') : tr('u1.priv.consentWithdrawn'));
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
      else toast(how === 'download' ? tr('u1.acc.downloaded') : tr('u1.acc.exportReady'));
    } catch (e) {
      toast(friendlyError(e, tr('u1.priv.exportFailed')), 'error');
    }
  }

  async function startDelete() {
    const ok = await confirm(
      tr('u1.acc.deleteTitle'),
      tr('u1.priv.deleteBody'),
      tr('u1.acc.continue'),
    );
    if (ok) { setTyped(''); setDeleteOpen(true); }
  }

  async function finalDelete() {
    try {
      await deleteAccount.mutateAsync();
      await cancelAllLocal().catch(() => undefined);
      await wipeLocalData();
      setDeleteOpen(false);
      toast(tr('u1.priv.deleted'), 'info');
      router.replace('/welcome');
    } catch (e) {
      toast(friendlyError(e, tr('u1.acc.deleteFailed')), 'error');
    }
  }

  return (
    <Screen back title={tr('u1.priv.title')} subtitle={tr('u1.priv.subtitle')}>
      <Card tone="soft">
        <Text variant="small">{tr('u1.priv.intro', { name: BRAND.name })}</Text>
        <Button label={tr('u1.priv.readPolicy')} size="sm" variant="ghost" icon="file-text" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => setPolicyOpen(true)} />
      </Card>

      <SectionTitle title={tr('u1.priv.consents')} />
      <Card>
        {consentsLoading ? <Loading /> : consents().map((c, i) => (
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
          {termsAt ? `${tr('u1.priv.termsAccepted', { date: formatDate(termsAt, {}) })} ` : ''}
          {tr('u1.priv.timestamped', { version: PRIVACY_POLICY_VERSION })}
        </Text>
      </Card>

      <SectionTitle title={tr('u1.priv.settings')} />
      <Card>
        {privacy ? (
          <View style={{ gap: 4 }}>
            {([
              ['ai_history_enabled', tr('u1.priv.aiHistory'), tr('u1.priv.aiHistoryD'), undefined],
              ['community_visible', tr('u1.priv.communityVisible'), tr('u1.priv.communityVisibleD'), undefined],
              ['analytics_enabled', tr('u1.priv.analytics'), tr('u1.priv.analyticsD'), 'analytics'],
              ['crash_reports_enabled', tr('u1.priv.crash'), tr('u1.priv.crashD'), 'crash_reports'],
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
            <Text weight="medium">{tr('u1.priv.retention')}</Text>
            <Text variant="small" muted>{tr('u1.priv.retentionD')}</Text>
            <Row wrap style={{ marginTop: 6 }}>
              {RETENTION.map((m) => (
                <Chip key={m} label={m < 12 ? tr('u1.priv.months', { count: m }) : tr('u1.priv.years', { count: m / 12 })} selected={privacy.retention_months === m} onPress={() => setSetting({ retention_months: m })} />
              ))}
            </Row>
          </View>
        ) : <Loading />}
      </Card>

      <SectionTitle title={tr('u1.acc.myData')} />
      <Card>
        <Text weight="medium">{tr('u1.priv.exportTitle')}</Text>
        <Text variant="small" muted style={{ marginTop: 2 }}>{tr('u1.priv.exportD')}</Text>
        <Button label={tr('u1.priv.exportTitle')} icon="download" variant="secondary" loading={exportData.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={doExport} />
      </Card>
      <Card tone="danger">
        <Text weight="bold" color={t.colors.danger}>{tr('u1.acc.deleteSection')}</Text>
        <Text variant="small" style={{ marginTop: 2 }}>{tr('u1.priv.eraseD')}</Text>
        {isDemo ? <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u1.priv.demoErase')}</Text> : null}
        <Button label={tr('u1.acc.deleteSection')} variant="danger" icon="trash-2" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={startDelete} />
      </Card>

      <Sheet visible={policyOpen} onClose={() => setPolicyOpen(false)} title={tr('u1.sub.privacyLink')}>
        <Text variant="caption" muted>{tr('u1.priv.version', { version: PRIVACY_POLICY_VERSION })}</Text>
        {PRIVACY_POLICY.map((s) => (
          <View key={s.title} style={{ gap: 4 }}>
            <Text weight="bold">{s.title}</Text>
            <Text variant="small">{s.body}</Text>
          </View>
        ))}
      </Sheet>

      <Sheet visible={exportText != null} onClose={() => setExportText(null)} title={tr('u1.acc.myData')}>
        <Text variant="small" muted>{tr('u1.priv.shareUnavailable')}</Text>
        <Button label={tr('u1.priv.shareText')} icon="share-2" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => Share.share({ message: exportText ?? '', title: tr('u1.acc.myData') }).catch(() => undefined)} />
        <ScrollView horizontal keyboardShouldPersistTaps="handled" style={{ maxHeight: 360, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, padding: spacing.sm }}>
          <Text selectable variant="caption">{(exportText ?? '').slice(0, 20000)}{(exportText?.length ?? 0) > 20000 ? '\n…' : ''}</Text>
        </ScrollView>
      </Sheet>

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title={tr('u1.priv.lastConfirm')}>
        <Banner tone="danger" title={tr('u1.acc.irreversible')}>{tr('u1.acc.typeToConfirm', { word: confirmWord })}</Banner>
        <Field label={tr('u1.acc.confirmation')} value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} placeholder={confirmWord} />
        <Button label={tr('u1.acc.deleteForever')} variant="danger" disabled={typed.trim() !== confirmWord} loading={deleteAccount.isPending} onPress={finalDelete} />
        <Button label={tr('u1.priv.cancel')} variant="ghost" onPress={() => setDeleteOpen(false)} />
      </Sheet>
    </Screen>
  );
}
