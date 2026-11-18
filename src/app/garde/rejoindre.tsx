/**
 * Lien d'invitation d'une nounou. Sans compte : le code est gardé pendant l'inscription (même mécanisme que
 * l'invitation du foyer), puis l'invitation est proposée à la connexion. Avec un compte : « Rejoindre » →
 * childcare_accept. Rien n'est visible avant la CONFIRMATION d'un parent.
 */
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Card, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { t as tr } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { extractInviteCode, savePendingInvite, takePendingInvite } from '@/lib/authFlow';

export default function JoinCare() {
  const { session, ready } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === 'string' ? extractInviteCode(params.code) : null;
  const toast = useToast();
  const inv = useInvalidate();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && !session && code) void savePendingInvite(code); }, [ready, session, code]);

  async function join() {
    if (!code) return;
    setBusy(true);
    try {
      await backend.rpc('childcare_accept', { p_token: code });
      await takePendingInvite();
      inv('my_childcare', 'memberships', 'childcare_links');
      toast(tr('nn.join.done'), 'success');
      router.replace('/garde' as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('nn.join.title')} tool={false}>
      <Card tone="lavender">
        <Text weight="bold">{tr('nn.join.invited')}</Text>
        <Text variant="small" style={{ marginTop: 4 }}>{code ? tr('nn.join.explain') : tr('nn.join.badCode')}</Text>
      </Card>
      {code && ready && !session ? (
        <>
          <Button label={tr('u1.fam.createAccount')} size="lg" onPress={() => router.replace('/auth/sign-up')} testID="care-join-signup" />
          <Button label={tr('u1.fam.haveAccount')} variant="secondary" onPress={() => router.replace('/auth/sign-in')} />
        </>
      ) : code && session ? (
        <Button label={tr('nn.join.cta')} icon="log-in" size="lg" loading={busy} onPress={join} testID="care-join-accept" />
      ) : null}
    </Screen>
  );
}
