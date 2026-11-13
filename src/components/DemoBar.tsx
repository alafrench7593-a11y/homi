/** Bandeau permanent « Démonstration » : visible sur tous les écrans tant que la démo est active. */
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { leaveDemo, useBackendMode } from '@/lib/demoMode';
import { useAuth } from '@/lib/auth';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { friendlyErrorMessage } from '@/lib/errors';

export function DemoBar() {
  const { isDemo, canLeave } = useBackendMode();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  // D-15 (QA) : à 320 px, le bandeau complet recouvrait les boutons de l'en-tête → version courte
  const narrow = useWindowDimensions().width < 360;
  if (!isDemo || !session) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 2, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      <View accessibilityRole="text" accessibilityLabel={tr('demo.badgeA11y')} style={{ flexDirection: 'row', alignItems: 'center', gap: narrow ? 6 : 8, paddingHorizontal: narrow ? 8 : 12, paddingVertical: narrow ? 1 : 3, borderRadius: 999, backgroundColor: 'rgba(91,42,134,0.9)' }}>
        <Text variant="caption" weight="bold" color="#FFFFFF">{tr(narrow ? 'demo.badgeShort' : 'demo.badge')}</Text>
        {canLeave ? (
          <Tappable accessibilityRole="button" accessibilityLabel={tr('demo.leaveA11y')} hitSlop={12} onPress={async () => { try { await leaveDemo(); router.replace('/welcome'); } catch (e) { toast(friendlyErrorMessage(e), 'error'); } }}>
            <Text variant="caption" color="#FFFFFF" style={{ textDecorationLine: 'underline' }}>{tr('demo.leave')}</Text>
          </Tappable>
        ) : null}
      </View>
    </View>
  );
}
