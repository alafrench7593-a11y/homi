/** Éléments partagés des écrans de connexion et d'inscription. */
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Row, Text } from '@/components/ui';
import { backend, isDemo } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import { passwordRules, resendRemaining } from '@/lib/authFlow';
import { enabledSocialProviders } from '@/lib/socialProviders';
export { enabledSocialProviders };
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

/** Règles du mot de passe, cochées au fil de la saisie. */
export function PasswordRules({ value }: { value: string }) {
  const t = useTheme();
  return (
    <View accessibilityLabel={tr('auth.rules.a11y')} style={{ gap: 2, marginTop: -4 }}>
      {passwordRules(value).map((r) => (
        <Row key={r.key} gap={6} style={{ alignItems: 'center' }}>
          <Icon name={r.ok ? 'check-circle' : 'circle'} size={14} color={r.ok ? t.colors.success : t.colors.textMuted} />
          <Text variant="small" color={r.ok ? t.colors.success : t.colors.textMuted} accessibilityLabel={tr(r.ok ? 'auth.rules.ok' : 'auth.rules.todo', { rule: r.label })}>{r.label}</Text>
        </Row>
      ))}
    </View>
  );
}

/** Case à cocher accessible (cible de 44 px). */
export function CheckRow({ checked, onChange, error, children, label }: { checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode; label: string }) {
  const t = useTheme();
  return (
    <View>
      <Tappable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
        accessibilityLabel={label}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: MIN_TOUCH, paddingVertical: 4 }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: error ? t.colors.danger : t.colors.primary, backgroundColor: checked ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {checked && <Icon name="check" size={16} color={t.colors.primaryText} />}
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </Tappable>
      {error ? <Text variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

export function LegalLink({ doc, children }: { doc: 'terms' | 'privacy'; children: string }) {
  const t = useTheme();
  return <Text variant="small" color={t.colors.primary} weight="bold" accessibilityRole="link" onPress={() => router.push(`/legal/${doc}`)}>{children}</Text>;
}

/** Vrai si au moins un bouton social est affiché (sert aussi à masquer la note qui les accompagne). */
export function hasSocialSignIn(): boolean {
  if (isDemo) return false;
  const p = enabledSocialProviders();
  return p.apple || p.google;
}

/** « Continuer avec Apple / Google ». Erreurs affichées en français ; fermeture de la fenêtre ignorée. */
export function SocialButtons({ onError, disabled }: { onError: (msg: string) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  async function go(p: 'apple' | 'google') {
    if (busy) return;
    setBusy(p);
    try {
      await backend.auth.signInWithProvider(p);
      if (Platform.OS !== 'web') router.replace('/');
    } catch (e) {
      if (!(e instanceof BackendError && e.code === 'cancelled')) onError(e instanceof Error && e.message ? e.message : tr('auth.signIn.failed'));
    } finally {
      setBusy(null);
    }
  }
  if (!hasSocialSignIn()) return null;
  const providers = enabledSocialProviders();
  return (
    <View style={{ gap: spacing.xs }}>
      {providers.apple ? (Platform.OS === 'ios' ? <AppleNativeButton onPress={() => go('apple')} /> : (
        <Button label={tr('auth.social.apple')} icon="smartphone" variant="secondary" loading={busy === 'apple'} disabled={disabled || !!busy} onPress={() => go('apple')} full />
      )) : null}
      {providers.google ? <Button label={tr('auth.social.google')} icon="globe" variant="secondary" loading={busy === 'google'} disabled={disabled || !!busy} onPress={() => go('google')} full /> : null}
    </View>
  );
}

/** Bouton officiel d'Apple sur iPhone (exigé par les règles de l'App Store). */
function AppleNativeButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  return (
    <Apple.AppleAuthenticationButton
      buttonType={Apple.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={t.isDark ? Apple.AppleAuthenticationButtonStyle.WHITE : Apple.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={24}
      style={{ width: '100%', height: 48 }}
      onPress={onPress}
    />
  );
}

/** Bouton « Renvoyer l'e-mail », utilisable une fois toutes les 60 secondes. */
export function ResendButton({ onResend, label = tr('auth.resend'), initialSentAt = Date.now() }: { onResend: () => Promise<void>; label?: string; initialSentAt?: number | null }) {
  const [sentAt, setSentAt] = useState<number | null>(initialSentAt);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const remaining = resendRemaining(sentAt, now);
  useEffect(() => {
    if (!remaining) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  async function go() {
    if (remaining || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await onResend();
      setSentAt(Date.now());
      setNow(Date.now());
      setMsg({ ok: true, text: tr('auth.resent') });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : tr('auth.sendFailed') });
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 4 }}>
      <Button label={remaining ? tr('auth.resendIn', { label, seconds: remaining }) : label} icon="send" variant="secondary" disabled={!!remaining} loading={busy} onPress={go} />
      {msg ? <Text variant="small" color={msg.ok ? undefined : '#C2416E'} accessibilityLiveRegion="polite">{msg.text}</Text> : null}
    </View>
  );
}
