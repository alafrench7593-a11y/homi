/**
 * Profil d'un compte qui n'est QUE nounou (`isCaregiverOnly`, 21/11/2026) : son compte, ses gardes, ses réglages —
 * rien du foyer (ni parcours, ni agenda familial, ni outils, ni documents, ni abonnement : c'est la famille qui paie).
 * Chaque lien ouvre un écran que le rôle de nounou laisse ouvert (réglages du compte, « Mes gardes » et ses gardes).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { avatarInitial } from '@/components/AccountActions';
import { Skeleton } from '@/components/States';
import { ListGroup, ListRow, Row, Text } from '@/components/ui';
import { ProfilePhotoSheet } from '@/features/profilePhoto/ProfilePhotoSheet';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { useMyChildcare } from '@/lib/data/hooks-nounou';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function CaregiverProfile() {
  const t = useTheme();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const mine = useMyChildcare();
  const [photoOpen, setPhotoOpen] = useState(false);
  const links = mine.data ?? [];
  return (
    <View style={{ flex: 1 }}>
      <Screen back account bottomInset={TAB_SCREEN_INSET}>
        <Row style={{ marginTop: spacing.sm }} testID="caregiver-profile">
          <Tappable accessibilityRole="button" accessibilityLabel={profile?.avatar_path ? tr('pphoto.change') : tr('pphoto.add')} onPress={() => setPhotoOpen(true)} testID="profile-photo">
            <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={72} testID="profile-avatar" />
          </Tappable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="title" accessibilityRole="header">{profile?.display_name || tr('profile.title')}</Text>
            <Text variant="small" muted>{session?.email ?? ''}</Text>
            <Tappable accessibilityRole="button" onPress={() => setPhotoOpen(true)} style={{ minHeight: 32, justifyContent: 'center' }} testID="profile-photo-link">
              <Text variant="small" weight="bold" color={t.colors.primary}>{profile?.avatar_path ? tr('pphoto.change') : tr('pphoto.add')}</Text>
            </Tappable>
          </View>
        </Row>

        {mine.isLoading && !mine.data ? <Skeleton kind="list" rows={1} /> : null}
        <ListGroup title={tr('nn.home.title')} testID="caregiver-profile-cares">
          {links.map((l) => l.status === 'active' && l.child ? (
            <ListRow key={l.link_id} icon="smile" title={l.child.first_name} subtitle={tr('nn.home.family', { name: l.household_name })}
              onPress={() => router.push(`/garde/${l.child!.id}` as never)} testID={`caregiver-profile-care-${l.child.id}`} />
          ) : (
            <ListRow key={l.link_id} icon="clock" title={tr('nn.home.pendingTitle')} subtitle={tr('nn.home.family', { name: l.household_name })} />
          ))}
          <ListRow icon="briefcase" title={tr('nn.profile.open')} subtitle={tr('nn.profile.openSub')} onPress={() => router.push('/garde' as never)} testID="caregiver-profile-open" />
        </ListGroup>

        <ListGroup title={tr('nn.profile.settings')} testID="caregiver-profile-settings">
          <ListRow icon="user" title={tr('settings.account')} subtitle={tr('settings.account.sub')} onPress={() => router.push('/settings/account')} />
          <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="profile-notifs" />
          <ListRow icon="globe" title={tr('settings.language.row')} onPress={() => router.push('/settings/language')} />
          <ListRow icon="lock" title={tr('profile.privacy')} onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="message-circle" title={tr('fb.row')} subtitle={tr('fb.rowD')} onPress={() => router.push({ pathname: '/feedback', params: { from: '/profile' } } as never)} />
          <ListRow icon="life-buoy" title={tr('profile.emergency')} subtitle="15 · 112 · 3114" danger onPress={() => router.push('/emergency')} />
        </ListGroup>
      </Screen>
      <ProfilePhotoSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} />
    </View>
  );
}
