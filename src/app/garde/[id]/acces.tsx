/**
 * Accès et réglages de la garde (parents seulement) :
 *  - nounous : inviter (lien à usage unique, 72 h, révocable), CONFIRMER l'accès d'une invitation acceptée (rien
 *    n'est visible avant), révoquer à tout moment (effet immédiat), confier cet enfant à une nounou déjà membre ;
 *  - photos : autorisation explicite et horodatée (désactivée par défaut), conservation, téléchargement, discrétion ;
 *  - mes notifications pour cette garde.
 * Le serveur vérifie chaque droit (childcare_* dans 20261121000100_espace_nounou.sql).
 */
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, ListRow, Segmented, Text } from '@/components/ui';
import { ToggleRow } from '@/features/nounou/CareUI';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { formatDateFr, formatTime } from '@/lib/domain/dates';
import { RETENTIONS, type Retention } from '@/lib/domain/nounou';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  useAddChildToCaregiver, useCareChild, useCareLinkAction, useCareLinks, useCareMemberNames, useCareSettings, useInviteCaregiver,
  useNotifyPrefs, useSetCareSettings, useSetNotifyPrefs, type CareLink,
} from '@/lib/data/hooks-nounou';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const dt = (iso: string) => `${formatDateFr(iso.slice(0, 10))} ${formatTime(iso)}`;

export default function CareAccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { child, role, loading } = useCareChild(id);
  const links = useCareLinks(role === 'parent' ? id : null);
  const { settings, ...settingsQ } = useCareSettings(role === 'parent' ? id : null);
  const names = useCareMemberNames(child?.household_id);
  const invite = useInviteCaregiver();
  const action = useCareLinkAction();
  const addChild = useAddChildToCaregiver();
  const setSettings = useSetCareSettings();
  const { prefs } = useNotifyPrefs(role === 'parent' ? id : null);
  const setPrefs = useSetNotifyPrefs();
  const [label, setLabel] = useState('');
  const [token, setToken] = useState<string | null>(null);

  if (loading) return <Screen back title={tr('nn.access.title')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child || role !== 'parent') return <Screen back title={tr('nn.access.title')} tool={false}><EmptyState icon="lock" title={tr('nn.access.parentsOnly')} /></Screen>;

  const link = token ? Linking.createURL('/garde/rejoindre', { queryParams: { code: token } }) : null;
  const nameOf = (l: CareLink) => names.data?.find((n) => n.user_id === l.caregiver_id)?.display_name ?? l.label ?? tr('nn.author.caregiver');
  const all = links.data ?? [];
  const live = all.filter((l) => !l.revoked_at);
  const toConfirm = live.filter((l) => l.accepted_at && !l.confirmed_at);
  const active = live.filter((l) => l.confirmed_at);
  const invited = live.filter((l) => !l.accepted_at && (!l.expires_at || Date.parse(l.expires_at) > Date.now()));
  const linkedIds = new Set(live.map((l) => l.caregiver_id).filter(Boolean));
  const otherCaregivers = (names.data ?? []).filter((n) => n.role === 'caregiver' && !linkedIds.has(n.user_id));

  async function run(p: Promise<unknown>, ok: string) {
    try { await p; toast(ok, 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function createInvite() {
    try {
      const r = await invite.mutateAsync({ childId: child!.id, label: label.trim() || null });
      setToken(r.token); setLabel('');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function togglePhotos(v: boolean) {
    if (v && !(await confirm(tr('nn.consent.title'), tr('nn.consent.body', { name: child!.first_name }), tr('nn.consent.accept'), false))) return;
    await run(setSettings.mutateAsync({ childId: child!.id, photosAllowed: v }), v ? tr('nn.consent.on') : tr('nn.consent.off'));
  }

  return (
    <Screen back title={tr('nn.access.title')} subtitle={child.first_name} tool={false}>
      {/* ----------------------------------------------------------- nounous */}
      <Text variant="label">{tr('nn.access.caregivers')}</Text>
      {links.isLoading && !links.data ? <Skeleton rows={2} /> : links.isError && !links.data ? <ErrorView error={links.error} onRetry={() => void links.refetch()} /> : (
        <>
          <MotionList style={{ gap: spacing.md }}>{toConfirm.map((l) => (
            <MotionItem key={l.id}><Card key={l.id} tone="lavender" testID="care-to-confirm">
              <Text weight="bold">{tr('nn.access.toConfirm', { name: nameOf(l) })}</Text>
              <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.access.toConfirmBody', { name: child.first_name })}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Button label={tr('nn.access.confirm')} icon="check" onPress={() => run(action.mutateAsync({ action: 'confirm', linkId: l.id }), tr('nn.access.confirmed'))} testID="care-confirm" />
                <Button label={tr('nn.access.refuse')} variant="secondary" onPress={async () => { if (await confirm(tr('nn.access.revokeTitle'), tr('nn.access.revokeBody'), tr('nn.access.refuse'))) await run(action.mutateAsync({ action: 'revoke', linkId: l.id }), tr('nn.access.revoked')); }} />
              </View>
            </Card></MotionItem>
          ))}</MotionList>
          <MotionList style={{ gap: spacing.md }}>{active.map((l) => (
            <MotionItem key={l.id}><Card key={l.id} testID="care-active-link">
              <ListRow icon="user-check" title={nameOf(l)} subtitle={tr('nn.access.activeSince', { date: dt(l.confirmed_at!) })} />
              <Button label={tr('nn.access.revoke')} icon="user-x" variant="destructive" size="sm" style={{ alignSelf: 'flex-start' }} testID="care-revoke"
                onPress={async () => { if (await confirm(tr('nn.access.revokeTitle'), tr('nn.access.revokeBody'), tr('nn.access.revoke'))) await run(action.mutateAsync({ action: 'revoke', linkId: l.id }), tr('nn.access.revoked')); }} />
            </Card></MotionItem>
          ))}</MotionList>
          <MotionList style={{ gap: spacing.md }}>{invited.map((l) => (
            <MotionItem key={l.id}><Card key={l.id} testID="care-invited">
              <ListRow icon="mail" title={l.label ?? tr('nn.access.invitation')} subtitle={tr('nn.access.expires', { date: dt(l.expires_at ?? l.created_at) })} />
              <Button label={tr('nn.access.cancelInvite')} variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }}
                onPress={() => run(action.mutateAsync({ action: 'revoke', linkId: l.id }), tr('nn.access.inviteCancelled'))} testID="care-cancel-invite" />
            </Card></MotionItem>
          ))}</MotionList>
          {!toConfirm.length && !active.length && !invited.length ? <Text muted>{tr('nn.access.none')}</Text> : null}
        </>
      )}
      <Card>
        <Text weight="bold">{tr('nn.access.add')}</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>{tr('nn.access.addBody')}</Text>
        <Field label={tr('nn.access.label')} optional value={label} onChangeText={setLabel} maxLength={60} testID="care-invite-label" />
        <Button label={tr('nn.access.createInvite')} icon="user-plus" loading={invite.isPending} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={createInvite} testID="care-invite" />
        {token && link ? (
          <View style={{ marginTop: spacing.sm, gap: spacing.xs }} testID="care-invite-result">
            <Text variant="small">{tr('nn.access.linkOnce')}</Text>
            <Text selectable weight="bold" testID="care-invite-code" accessibilityLabel={tr('u1.fam.codeA11y', { code: token.split('').join(' ') })}>{token}</Text>
            <Button label={tr('u1.fam.shareInvitation')} icon="share-2" size="sm" style={{ alignSelf: 'flex-start' }}
              onPress={() => Share.share({ message: tr('nn.access.shareMessage', { link, code: token }) }).catch(() => undefined)} />
          </View>
        ) : null}
      </Card>
      {otherCaregivers.length ? (
        <Card>
          <Text weight="bold">{tr('nn.access.existing')}</Text>
          {otherCaregivers.map((n) => (
            <Button key={n.user_id} label={tr('nn.access.entrust', { name: child.first_name, who: n.display_name ?? tr('nn.author.caregiver') })} variant="secondary" full style={{ marginTop: spacing.xs }}
              onPress={() => run(addChild.mutateAsync({ childId: child.id, caregiverId: n.user_id }), tr('nn.access.confirmed'))} />
          ))}
        </Card>
      ) : null}

      {/* ----------------------------------------------------------- photos */}
      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('nn.access.photos')}</Text>
      {settingsQ.isLoading && !settingsQ.data ? <Skeleton rows={2} /> : (
        <Card testID="care-photo-settings">
          <Text variant="small">{tr('nn.consent.short')}</Text>
          <ToggleRow value={!!settings?.photos_allowed} onChange={togglePhotos} label={tr('nn.consent.toggle')} />
          {settings?.photos_allowed && settings.photos_allowed_at ? (
            <Text variant="caption" muted testID="care-consent-date">{tr('nn.consent.since', { date: dt(settings.photos_allowed_at), who: names.data?.find((n) => n.user_id === settings.photos_allowed_by)?.display_name ?? tr('nn.author.parent') })}</Text>
          ) : null}
          <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('nn.retention.title')}</Text>
          <Segmented<Retention> label={tr('nn.retention.title')} value={settings?.retention ?? '30d'}
            options={RETENTIONS.map((r) => ({ value: r, label: tr(`nn.retention.${r}`), testID: `care-retention-${r}` }))}
            onChange={(r) => void run(setSettings.mutateAsync({ childId: child.id, retention: r }), tr('nn.saved'))} />
          <Text variant="caption" muted>{tr('nn.retention.hint')}</Text>
          <ToggleRow value={!!settings?.allow_download} onChange={(v) => void run(setSettings.mutateAsync({ childId: child.id, allowDownload: v }), tr('nn.saved'))} label={tr('nn.access.allowDownload')} />
          <ToggleRow value={!!settings?.notify_name} onChange={(v) => void run(setSettings.mutateAsync({ childId: child.id, notifyName: v }), tr('nn.saved'))} label={tr('nn.access.notifyName')} />
          <Text variant="caption" muted>{tr('nn.access.notifyNameHint')}</Text>
        </Card>
      )}
      <Banner tone="info" icon="shield">{tr('nn.consent.noAnalysis')}</Banner>

      {/* ----------------------------------------------------------- mes notifications */}
      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('nn.notif.title')}</Text>
      <Card>
        <ToggleRow value={prefs.photos} onChange={(v) => void run(setPrefs.mutateAsync({ ...prefs, child_id: child.id, photos: v }), tr('nn.saved'))} label={tr('nn.notif.photos')} />
        <ToggleRow value={prefs.messages} onChange={(v) => void run(setPrefs.mutateAsync({ ...prefs, child_id: child.id, messages: v }), tr('nn.saved'))} label={tr('nn.notif.messages')} />
        <ToggleRow value={prefs.important} onChange={(v) => void run(setPrefs.mutateAsync({ ...prefs, child_id: child.id, important: v }), tr('nn.saved'))} label={tr('nn.notif.important')} />
        <Text variant="caption" muted>{tr('nn.notif.hint')}</Text>
      </Card>
    </Screen>
  );
}
