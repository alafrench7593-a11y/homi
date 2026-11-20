/**
 * Avatar d'une personne : sa photo de profil (lien signé temporaire, espace privé) ou, à défaut, l'initiale sur le
 * dégradé nacré. Une photo illisible (supprimée, lien expiré) retombe sur l'initiale.
 */
import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './ui';
import { useProfilePhotoUrl } from '@/lib/data/hooks-profilePhoto';
import { useTheme } from '@/theme/ThemeProvider';

export function UserAvatar({ path, initial, size = 40, label, testID }: { path?: string | null; initial: string; size?: number; label?: string; testID?: string }) {
  const t = useTheme();
  const { data: url } = useProfilePhotoUrl(path);
  const [broken, setBroken] = useState<string | null>(null);
  const border = { borderWidth: 1, borderColor: t.colors.surface };
  if (url && broken !== url) {
    return <Image source={{ uri: url }} onError={() => setBroken(url)} accessibilityLabel={label} testID={testID}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.surfaceAlt, ...border }} />;
  }
  return (
    <View testID={testID ? `${testID}-initial` : undefined} accessibilityLabel={label}>
      {/* deux premières teintes de l'anneau de la palette, sans la troisième (lilas) : scan App Designer, « dégradé violet » */}
      <LinearGradient colors={[t.tokens.decor.ring[0], t.tokens.decor.ring[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', ...border }}>
        {/* encre sombre : le blanc sur le dégradé nacré (#9FD8C0) mesurait 1,6:1 (audit 09) */}
        <Text weight="bold" color={t.tokens.text.onDecor} style={{ fontSize: Math.max(11, Math.round(size * 0.42)), lineHeight: Math.max(13, Math.round(size * 0.52)) }}>{initial}</Text>
      </LinearGradient>
    </View>
  );
}
