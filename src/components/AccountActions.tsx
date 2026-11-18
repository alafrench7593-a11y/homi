/**
 * Coin supérieur droit des écrans principaux (21/11/2026) : la Communauté, seule et nommée, puis l'avatar.
 * L'avatar ouvre une feuille « Mon compte » : profil, Réglages et Urgences (les Réglages ne sont plus un bouton
 * d'en-tête). L'avatar reprend celui du Profil : la photo de profil si elle existe (07/11/2026), sinon l'initiale.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { haptic, ListGroup, ListRow, Text } from './ui';
import { GlassButton, GlassIconButton, GlassSheet } from './glass';
import { Tappable } from './Tappable';
import { useProfile } from '@/lib/data/hooks';
import { useAuth } from '@/lib/auth';
import { springTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { UserAvatar } from './UserAvatar';
import { t as tr } from '@/i18n';

const SIZE = 32;
/** Disques de verre de l’en-tête : 44 pt (cible tactile réelle, y compris sur le web où hitSlop n’existe pas) et leur écart. */
export const HEADER_ICON = 44;
export const HEADER_GAP = 4;

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
  const [open, setOpen] = useState(false);
  const press = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { springTo(ring, active ? 1 : 0, 'gentle', reduce).start(); }, [active, ring, reduce]);
  const name = profile?.display_name?.trim();
  return (
    <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name ? tr('header.profileNamed', { name }) : tr('header.profile')}
      accessibilityHint={tr('header.accountHint')}
      accessibilityState={{ selected: active, expanded: open }}
      aria-selected={active}
      hitSlop={6}
      onPressIn={() => springTo(press, 1, 'press', reduce).start()}
      onPressOut={() => springTo(press, 0, 'release', reduce).start()}
      onPress={() => { haptic('light'); setOpen(true); }}
      testID="header-account"
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) }] }}>
        {/* anneau doré quand le Profil est ouvert */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: (SIZE + 6) / 2, borderWidth: 1.5, borderColor: t.colors.gold, opacity: ring }} />
        <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={SIZE} testID="header-avatar" />
      </Animated.View>
    </Pressable>
    <AccountSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Feuille « Mon compte » (appui sur l'avatar) : qui est connecté, puis Mon profil, Réglages et Urgences — les urgences
 * restent ainsi à un geste de plus depuis n'importe quel écran d'onglet, en plus du bouton d'aide de l'accueil.
 */
export function AccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const pathname = usePathname();
  const go = (href: string) => {
    onClose();
    if (pathname !== href.replace('/(tabs)', '')) router.push(href as never);
  };
  const name = profile?.display_name?.trim();
  return (
    <GlassSheet visible={visible} onClose={onClose} title={tr('header.account')}>
      <View testID="account-sheet" style={{ gap: spacing.md }}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('header.openProfile')} onPress={() => go('/(tabs)/profile')} testID="account-sheet-me" bare
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
          <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text weight="bold" numberOfLines={1}>{name || tr('header.profile')}</Text>
            {session?.email ? <Text variant="small" muted numberOfLines={1}>{session.email}</Text> : null}
          </View>
        </Tappable>
        <ListGroup>
          <ListRow icon="user" title={tr('header.profile')} onPress={() => go('/(tabs)/profile')} testID="account-sheet-profile" />
          <ListRow icon="settings" title={tr('header.settings')} onPress={() => go('/settings')} testID="account-sheet-settings" />
          <ListRow icon="life-buoy" title={tr('profile.emergency')} subtitle="15 · 112 · 3114" danger iconColor={t.colors.danger} onPress={() => go('/emergency')} testID="account-sheet-emergency" />
        </ListGroup>
      </View>
    </GlassSheet>
  );
}

/** Largeur d'écran à partir de laquelle « Communauté » est écrit à côté de son pictogramme (390 pt : oui ; 320 pt : non). */
export const COMMUNITY_LABEL_MIN_WIDTH = 360;

/**
 * Accès direct à la Communauté, en haut à droite : pictogramme + libellé visible quand la largeur le permet, sinon
 * pictogramme seul ; dans les deux cas le nom accessible est « Communauté ».
 */
export function CommunityHeaderButton() {
  const { width } = useWindowDimensions();
  const onPress = () => router.push('/community');
  if (width >= COMMUNITY_LABEL_MIN_WIDTH) {
    return <GlassButton label={tr('nav.community')} icon="users" size="sm" onPress={onPress} testID="header-community" style={{ minHeight: HEADER_ICON }} />;
  }
  return <GlassIconButton icon="users" label={tr('nav.community')} size={HEADER_ICON} testID="header-community" onPress={onPress} />;
}

/**
 * Communauté puis avatar (l'avatar occupe le coin, comme sur iOS) ; Réglages et Urgences sont dans la feuille de l'avatar.
 * Communauté (17/11/2026, demande de la propriétaire) : accessible DIRECTEMENT en haut à droite de tous les écrans
 * d'onglet, en un geste ; elle n'est plus dans la barre du bas. Aucune pastille : l'appli ne connaît pas de « nouveautés
 * non lues » de la communauté.
 */
export function AccountActions() {
  const pathname = usePathname();
  const inCommunity = pathname.startsWith('/community') || pathname === '/moi';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: HEADER_GAP }} accessibilityRole="toolbar">
      {/* Verre de 44 pt (navigation flottante) */}
      {inCommunity ? null : <CommunityHeaderButton />}
      <ProfileAvatarButton />
    </View>
  );
}
