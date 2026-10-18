/** Indicateur discret « Hors ligne » (et nombre de saisies en attente), visible sur tous les écrans. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { useOfflineStore } from '@/lib/offline';
import { t as tr } from '@/i18n';

export function OfflinePill() {
  const { online, pending, conflicts } = useOfflineStore();
  const insets = useSafeAreaInsets();
  if (online && !pending.length && !conflicts.length) return null;
  const label = !online
    ? (pending.length ? tr('sync.offlinePending', { count: pending.length }) : tr('sync.offline'))
    : conflicts.length ? tr('sync.toCheck', { count: conflicts.length }) : tr('sync.syncing', { count: pending.length });
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', bottom: insets.bottom + 92, left: 0, right: 0, alignItems: 'center', zIndex: 40 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr('sync.openA11y', { label })}
        accessibilityLiveRegion="polite"
        onPress={() => router.push('/settings/sync')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 32, borderRadius: 999, backgroundColor: conflicts.length ? 'rgba(194,65,110,0.92)' : 'rgba(42,27,46,0.85)' }}
      >
        <Icon name={online ? 'refresh-cw' : 'wifi-off'} size={14} color="#FFFFFF" />
        <Text variant="caption" weight="bold" color="#FFFFFF">{label}</Text>
      </Pressable>
    </View>
  );
}
