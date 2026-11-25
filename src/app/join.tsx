/**
 * « Je suis coparent — Rejoindre ma famille » (26/11/2026) : code à 6 chiffres → vérification par le serveur →
 * « Rejoindre la famille de Jade » → compte (Apple, Google, e-mail) ou connexion → accès immédiat, SANS onboarding.
 * Lien `homi://join?code=123456` : code prérempli. Le code ne sert qu'une fois ; ce n'est jamais un identifiant.
 */
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Card, haptic, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { savePendingInvite, takePendingInvite } from '@/lib/authFlow';
import { cleanCode, codeToken, isFullCode, type InvitePreview } from '@/lib/inviteCode';
import { useInvalidate } from '@/lib/data/hooks';
import { AuraOrb } from '@/features/aura/AuraMark';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type State = 'typing' | 'checking' | 'found' | 'invalid' | 'locked' | 'network' | 'joining' | 'joined';

export default function JoinFamily() {
  const th = useTheme();
  const { session, ready } = useAuth();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ code?: string; auto?: string }>();
  const [code, setCode] = useState(() => cleanCode(typeof params.code === 'string' ? params.code : ''));
  const [state, setState] = useState<State>('typing');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const input = useRef<TextInput>(null);
  const autoTried = useRef(false);

  async function check(c: string) {
    setState('checking');
    try {
      const p = await backend.rpc<InvitePreview | null>('preview_invite_code', { p_code: c });
      if (p) { setPreview(p); setState('found'); haptic('success'); } else { setState('invalid'); haptic('warning'); }
    } catch (e) {
      setState((e as { code?: string })?.code === '54000' ? 'locked' : 'network');
    }
  }
  useEffect(() => { if (isFullCode(code) && state === 'typing') void check(code); }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Connecté·e : association immédiate, onboarding passé, accueil personnalisé. */
  async function join(c: string) {
    setState('joining');
    try {
      const hid = await backend.rpc<string | null>('accept_household_invitation', { p_token: codeToken(c) });
      if (!hid) { setState('invalid'); return; }
      await takePendingInvite();
      const uid = session?.userId;
      if (uid) await backend.update('profiles', { onboarding_completed: true }, [{ col: 'id', op: 'eq', value: uid }]).catch(() => undefined);
      await inv('memberships', 'members', 'household', 'profile', 'children');
      setState('joined'); haptic('success');
      setTimeout(() => router.replace({ pathname: '/', params: { bienvenue: 'coparent' } } as never), 900);
    } catch (e) {
      const k = (e as { code?: string })?.code;
      setState(k === '54000' ? 'locked' : k === '23505' ? 'joined' : 'network');
      if (k === '23505') setTimeout(() => router.replace('/' as never), 600);
    }
  }
  // Retour après l'inscription : le code gardé est utilisé tout seul
  useEffect(() => {
    if (!ready || !session || autoTried.current || params.auto !== '1' || !isFullCode(code)) return;
    autoTried.current = true;
    void join(code);
  }, [ready, session, code, params.auto]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toAccount(kind: 'sign-up' | 'sign-in') {
    await savePendingInvite(codeToken(code));
    router.push(`/auth/${kind}` as never);
  }

  const boxes = Array.from({ length: 6 }, (_, i) => code[i] ?? '');
  return (
    <Screen back title={tr('join.title')} subtitle={tr('join.sub')}>
      <Tappable accessibilityRole="none" onPress={() => input.current?.focus()} testID="join-boxes"
        style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm }}>
        {boxes.map((d, i) => (
          <View key={i} style={{ width: 46, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: i === code.length ? 2 : 1,
            borderColor: state === 'invalid' ? th.colors.danger : i === code.length ? th.colors.primary : th.colors.border, backgroundColor: th.colors.surface }}>
            <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>{d}</Text>
          </View>
        ))}
      </Tappable>
      <TextInput ref={input} value={code} onChangeText={(v) => { setCode(cleanCode(v)); setState('typing'); setPreview(null); }} autoFocus
        keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={12} accessibilityLabel={tr('join.a11y')} testID="join-input"
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} />

      {state === 'checking' || state === 'joining' ? <Text center muted testID="join-checking">{tr(state === 'joining' ? 'join.joining' : 'join.checking')}</Text> : null}
      {state === 'invalid' ? <Text center color={th.colors.danger} testID="join-invalid">{tr('join.invalid')}</Text> : null}
      {state === 'locked' ? <Text center color={th.colors.danger} testID="join-locked">{tr('join.locked')}</Text> : null}
      {state === 'network' ? <View style={{ gap: spacing.xs }}><Text center color={th.colors.danger} testID="join-network">{tr('join.network')}</Text>
        <Button label={tr('join.retry')} variant="secondary" onPress={() => void (session ? join(code) : check(code))} testID="join-retry" /></View> : null}

      {state === 'found' && preview ? (
        <Card testID="join-found">
          <View style={{ gap: spacing.sm, alignItems: 'center' }}>
            <AuraOrb size={44} />
            <Text variant="heading" center>{preview.inviter ? tr('join.family', { name: preview.inviter }) : tr('join.familyNoName')}</Text>
            <Text variant="small" muted center>{tr('join.foundBody')}</Text>
            {session ? (
              <Button label={tr('join.join')} icon="check" full onPress={() => void join(code)} testID="join-confirm" />
            ) : (
              <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
                <Button label={tr('join.create')} full onPress={() => void toAccount('sign-up')} testID="join-sign-up" />
                <Button label={tr('join.haveAccount')} variant="secondary" full onPress={() => void toAccount('sign-in')} testID="join-sign-in" />
              </View>
            )}
          </View>
        </Card>
      ) : null}
      {state === 'joined' ? <Card testID="join-done"><Text weight="bold" center>{tr('join.done')}</Text></Card> : null}
      <Text variant="caption" muted center>{tr('join.privacy')}</Text>
    </Screen>
  );
}
