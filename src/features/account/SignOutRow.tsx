/**
 * « Se déconnecter » en un appui (consigne de la propriétaire, 21/11/2026) : une ligne de VERRE (icône sortie) posée en
 * bas de Profil, de Moi et de Réglages. Confirmation courte, puis retour à l'écran d'accueil d'entrée (/welcome).
 *  - visite (démonstration) : la même ligne s'appelle « Quitter la démo » (`leaveDemo`, données d'exemple gardées) ;
 *  - double appui bloqué (garde `inFlight` + état occupé annoncé) ;
 *  - saisies hors ligne encore en file : dernier envoi, puis l'avertissement honnête de Réglages (audit 08).
 * La déconnexion elle-même est celle de Réglages (rappels locaux retirés, jeton de notification désinscrit).
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { GlassCard } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Icon, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { leaveDemo, useBackendMode } from '@/lib/demoMode';
import { friendlyError } from '@/lib/data/hooks-settings';
import { cancelAllLocal, unregisterPushToken } from '@/lib/notifications';
import { flushQueue, useOfflineStore } from '@/lib/offline';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Déconnexion complète (sans confirmation) : la même que Réglages. */
export async function performSignOut(demo: boolean, allDevices = false): Promise<void> {
  if (demo) { await leaveDemo(); return; }
  await cancelAllLocal().catch(() => undefined);
  await unregisterPushToken();
  await backend.auth.signOut(allDevices);
}

/** Demande la confirmation courte, puis déconnecte et revient à l'accueil d'entrée. Vrai si la sortie a eu lieu. */
export async function confirmAndSignOut(demo: boolean, allDevices = false): Promise<boolean> {
  if (!demo && useOfflineStore.getState().pending.length && useOfflineStore.getState().online) await flushQueue().catch(() => 0);
  const waiting = demo ? 0 : useOfflineStore.getState().pending.length;
  const ok = await confirm(
    demo ? tr('acct.signOut.demoConfirm') : allDevices ? tr('settings.signOut.confirmAll') : tr('settings.signOut.confirm'),
    demo ? tr('acct.signOut.demoBody') : (allDevices ? tr('settings.signOut.bodyAll') : tr('settings.signOut.body')) + (waiting ? `\n\n${tr('rel.signOut.pending', { count: waiting })}` : ''),
    demo ? tr('acct.signOut.demo') : tr('settings.signOut'),
  );
  if (!ok) return false;
  await performSignOut(demo, allDevices);
  router.replace('/welcome');
  return true;
}

export function SignOutRow({ testID = 'sign-out-row' }: { testID?: string }) {
  const t = useTheme();
  const toast = useToast();
  const { isDemo } = useBackendMode();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const label = isDemo ? tr('acct.signOut.demo') : tr('settings.signOut');
  async function go() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await confirmAndSignOut(isDemo);
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <GlassCard padded={false} onPress={busy ? undefined : () => void go()} accessibilityLabel={label} testID={testID}
      accessibilityHint={isDemo ? tr('acct.signOut.demoSub') : tr('acct.signOut.sub')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingHorizontal: spacing.md, borderRadius: radius.lg }}
        accessibilityState={{ busy }}>
        {busy ? <ActivityIndicator size="small" color={t.colors.primary} /> : <Icon name="log-out" size={20} color={t.colors.primary} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold" color={t.colors.primary}>{label}</Text>
          <Text variant="caption" muted>{isDemo ? tr('acct.signOut.demoSub') : tr('acct.signOut.sub')}</Text>
        </View>
      </View>
    </GlassCard>
  );
}
