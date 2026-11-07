/**
 * Avatar d'une personne : sa photo de profil (lien signé temporaire, espace privé) ou, à défaut, l'initiale sur le
 * dégradé nacré. Une photo illisible (supprimée, lien expiré) retombe sur l'initiale.
 */
import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './ui';
import { useProfilePhotoUrl } from '@/lib/data/hooks-profilePhoto';
import { NACRE } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function UserAvatar({ path, initial, size = 40, label, testID }: { path?: string | null; initial: string; size?: number; label?: string; testID?: string }) {
  const t = useTheme();
  const { data: url } = useProfilePhotoUrl(path);
  const [broken, setBroken] = useState<string | null>(null);
  const border = { borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)' };
  if (url && broken !== url) {
    return <Image source={{ uri: url }} onError={() => setBroken(url)} accessibilityLabel={label} testID={testID}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.surfaceAlt, ...border }} />;
  }
  return (
    <View testID={testID ? `${testID}-initial` : undefined} accessibilityLabel={label}>
      <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', ...border }}>
        <Text weight="bold" color="#FFFFFF" style={{ fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.52) }}>{initial}</Text>
      </LinearGradient>
    </View>
  );
}
