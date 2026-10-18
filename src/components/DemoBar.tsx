/** Bandeau permanent « Démonstration » : visible sur tous les écrans tant que la démo est active. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { leaveDemo, useBackendMode } from '@/lib/demoMode';
import { useAuth } from '@/lib/auth';

export function DemoBar() {
  const { isDemo, canLeave } = useBackendMode();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  if (!isDemo || !session) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 2, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      <View accessibilityRole="text" accessibilityLabel="Démonstration : données fictives, enregistrées uniquement sur cet appareil" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(122,92,224,0.92)' }}>
        <Text variant="caption" weight="bold" color="#FFFFFF">Démonstration</Text>
        {canLeave ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Quitter la démonstration" hitSlop={12} onPress={async () => { await leaveDemo(); router.replace('/welcome'); }}>
            <Text variant="caption" color="#FFFFFF" style={{ textDecorationLine: 'underline' }}>Quitter</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
