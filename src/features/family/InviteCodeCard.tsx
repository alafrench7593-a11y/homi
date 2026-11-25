/**
 * « Inviter mon coparent » en un toucher (26/11/2026) : code à 6 chiffres valable 48 h, partage (WhatsApp, SMS,
 * e-mail via la feuille de partage du téléphone, qui propose aussi « Copier »), nouveau code, annulation.
 * Le serveur vérifie l'abonnement (option coparent), l'unicité et l'expiration.
 */
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, haptic, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { appStoreLink, joinDeepLink, spaced } from '@/lib/inviteCode';
import { formatDate, formatTime, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function InviteCodeCard({ householdId }: { householdId: string }) {
  const th = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const [res, setRes] = useState<{ code: string; expires_at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [premiumNeeded, setPremiumNeeded] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const r = await backend.rpc<{ code: string; expires_at: string }>('create_household_invite_code', { p_household: householdId });
      setRes(r); haptic('success'); void inv('household_invitations');
    } catch (e) {
      if ((e as { hint?: string; message?: string })?.message?.includes('Premium')) setPremiumNeeded(true); else toast(friendlyError(e), 'error');
    } finally { setBusy(false); }
  }
  async function cancel() {
    if (!res) return;
    try {
      const rows = await backend.select<{ id: string }>({ table: 'household_invitations', filters: [
        { col: 'household_id', op: 'eq', value: householdId }, { col: 'short_code', op: 'eq', value: true }, { col: 'accepted_at', op: 'is', value: null }, { col: 'revoked_at', op: 'is', value: null }] });
      for (const r of rows) await backend.update('household_invitations', { revoked_at: new Date().toISOString() }, [{ col: 'id', op: 'eq', value: r.id }]);
      setRes(null); void inv('household_invitations'); toast(tr('u1.fam.revoked'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function share() {
    if (!res) return;
    await Share.share({ message: tr('icode.message', { code: spaced(res.code), store: appStoreLink(), link: joinDeepLink(res.code) }) }).catch(() => undefined);
  }

  return (
    <Card testID="invite-code-card">
      <View style={{ gap: spacing.sm }}>
        <Text weight="bold">{tr('icode.title')}</Text>
        <Text variant="small" muted>{tr('icode.sub')}</Text>
        {res ? (
          <>
            <View style={{ paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: th.colors.surfaceAlt, alignItems: 'center' }}>
              <Text selectable style={{ fontSize: 40, lineHeight: 52, fontWeight: '700', letterSpacing: 6, fontVariant: ['tabular-nums'] }} testID="invite-code-value"
                accessibilityLabel={tr('icode.a11y', { code: res.code.split('').join(' ') })}>{spaced(res.code)}</Text>
              <Text variant="caption" muted>{tr('icode.until', { date: formatDate(res.expires_at, { weekday: 'long', day: 'numeric', month: 'long' }), time: formatTime(res.expires_at) })}</Text>
            </View>
            <Button label={tr('icode.share')} icon="share-2" full onPress={() => void share()} testID="invite-code-share" />
            <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
              <Button label={tr('icode.renew')} size="sm" variant="secondary" loading={busy} onPress={() => void generate()} testID="invite-code-renew" />
              <Button label={tr('icode.cancel')} size="sm" variant="ghost" onPress={() => void cancel()} testID="invite-code-cancel" />
            </View>
          </>
        ) : (
          <Button label={tr('icode.create')} icon="user-plus" full loading={busy} onPress={() => void generate()} testID="invite-code-create" />
        )}
        {premiumNeeded ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="small">{tr('icode.premium')}</Text>
            <Button label={tr('icode.seePlans')} size="sm" variant="secondary" onPress={() => router.push('/settings/subscription')} testID="invite-code-plans" />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
