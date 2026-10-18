/**
 * Coin supérieur droit des écrans principaux : accès au Profil (avatar) et aux Réglages.
 * L'avatar reprend celui du Profil (initiale sur dégradé nacré) : le modèle de données n'a pas de photo de compte.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { haptic, IconButton, Text } from './ui';
import { useProfile } from '@/lib/data/hooks';
import { useAuth } from '@/lib/auth';
import { springTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, palette } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const SIZE = 32;

/** Initiale affichée dans l'avatar : prénom choisi, sinon adresse e-mail, sinon un point. */
export function avatarInitial(displayName?: string | null, email?: string | null) {
  const src = (displayName ?? '').trim() || (email ?? '').trim();
  return src ? src.slice(0, 1).toLocaleUpperCase() : '•';
}

export function ProfileAvatarButton() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const pathname = usePathname();
  const active = pathname === '/profile';
  const press = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { springTo(ring, active ? 1 : 0, 'gentle', reduce).start(); }, [active, ring, reduce]);
  const name = profile?.display_name?.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name ? tr('header.profileNamed', { name }) : tr('header.profile')}
      accessibilityState={{ selected: active }}
      aria-selected={active}
      hitSlop={6}
      onPressIn={() => springTo(press, 1, 'press', reduce).start()}
      onPressOut={() => springTo(press, 0, 'release', reduce).start()}
      onPress={() => { haptic('light'); if (!active) router.push('/(tabs)/profile'); }}
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) }] }}>
        {/* anneau doré quand le Profil est ouvert */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: (SIZE + 6) / 2, borderWidth: 1.5, borderColor: palette.gold, opacity: ring }} />
        <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)' }}>
          <Text weight="bold" color="#FFFFFF" style={{ fontSize: 14, lineHeight: 17 }}>{avatarInitial(profile?.display_name, session?.email)}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

/** Réglages puis Profil (l'avatar occupe le coin, comme sur iOS). */
export function AccountActions() {
  const pathname = usePathname();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="toolbar">
      <IconButton icon="settings" label={tr('header.settings')} onPress={() => { if (!pathname.startsWith('/settings')) router.push('/settings'); }} />
      <ProfileAvatarButton />
    </View>
  );
}
