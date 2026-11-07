/** Profil d'un enfant : aperçu, croissance, étapes, santé, alimentation. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { initialsColor } from '@/components/Illustrations';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Icon, IconButton, Row, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { NeedsSummary } from '@/features/needs';
import { ChildAvatar } from '@/features/childAvatar';
import { ChildPhotoSheet } from '@/features/profilePhoto/ProfilePhotoSheet';
import { Tappable } from '@/components/Tappable';
import { useCanAddPhotos } from '@/lib/data/hooks-photos';
import { palette } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { ChildTabs, CHILD_TABS, EditChildSheet, FoodsTab, GrowthTab, HealthTab, MilestonesTab, OverviewTab, type ChildTab } from '@/features/child';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useChild, useChildren, useInvalidate, useMemberships } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { removeChildPhotoFiles } from '@/lib/data/hooks-photos';
import { childAge, initials } from '@/lib/domain/child';
import { spacing } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr } from '@/i18n';

export default function ChildProfile() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const toast = useToast();
  const inv = useInvalidate();
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const child = useChild(params.id);
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const [photoOpen, setPhotoOpen] = useState(false);
  const canPhoto = useCanAddPhotos();
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);
  const { subject, setSubject } = useActiveSubject();
  const initial = CHILD_TABS.some((x) => x.value === params.tab) ? (params.tab as ChildTab) : 'apercu';
  const [tab, setTab] = useState<ChildTab>(initial);
  const [editing, setEditing] = useState(false);

  if (!child) {
    return (
      <Screen back title={tr('u4.child.profile')}>
        {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u4.child.loadError')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('u4.child.notFound')}
            body={tr('u4.child.notFoundBody')}
            action={{ label: tr('u4.child.backHome'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }

  const age = childAge(child.birth_date);

  async function remove() {
    if (!child) return;
    const ok = await confirm(
      tr('u4.child.deleteQ', { name: child.first_name }),
      tr('u4.child.deleteBody'),
      tr('u4.child.delete'),
    );
    if (!ok) return;
    setDeleting(true);
    try {
      // fichiers de l'album effacés d'abord (les lignes partent ensuite en cascade avec le profil)
      await removeChildPhotoFiles(child.id);
      await backend.remove('children', [eq('id', child.id)]);
      if (subject.type === 'child' && subject.id === child.id) setSubject(null);
      inv('children');
      toast(tr('u4.child.deleted'));
      router.replace('/(tabs)');
    } catch (e) {
      toast(friendlyError(e, tr('u4.child.deleteFail')), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen
      back
      right={<IconButton icon="edit-2" label={tr('u4.child.editA11y', { name: child.first_name })} onPress={() => setEditing(true)} />}
    >
      <Row style={{ gap: spacing.md }}>
        {/* Photo de profil de l'enfant (07/11/2026) : un appui pour l'ajouter, la changer ou la supprimer */}
        {canPhoto ? (
          <Tappable accessibilityRole="button" accessibilityLabel={child.photo_path ? tr('pphoto.childChange', { name: child.first_name }) : tr('pphoto.childAdd', { name: child.first_name })} onPress={() => setPhotoOpen(true)} testID="child-photo">
            <ChildAvatar child={child} size={72} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: palette.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.background }}>
              <Icon name="camera" size={13} color="#FFFFFF" />
            </View>
          </Tappable>
        ) : <ChildAvatar child={child} size={64} />}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" accessibilityRole="header">{child.first_name}</Text>
          <Text muted>{tr(child.sex === 'female' ? 'u4.child.bornF' : child.sex === 'male' ? 'u4.child.bornM' : 'u4.child.bornX', { age: age.label, date: formatDate(`${child.birth_date}T12:00:00`), time: child.birth_time ? tr('u4.child.atTime', { time: child.birth_time.slice(0, 5) }) : '' })}</Text>
          {child.birth_weight_g || child.birth_length_cm || child.birth_term_weeks ? (
            <Text variant="small" muted testID="birth-facts">{[child.birth_weight_g ? `${child.birth_weight_g} g` : null, child.birth_length_cm ? tr('u4.child.cm', { n: formatNumber(Number(child.birth_length_cm)) }) : null, child.birth_term_weeks ? tr('u4.child.weeksGa', { n: child.birth_term_weeks }) : null].filter(Boolean).join(' · ')}</Text>
          ) : null}
        </View>
      </Row>

      <ChildTabs value={tab} onChange={setTab} />

      {tab === 'apercu' && <OverviewTab child={child} onTab={setTab} />}
      {tab === 'croissance' && <GrowthTab child={child} />}
      {tab === 'etapes' && <MilestonesTab child={child} />}
      {tab === 'sante' && <HealthTab child={child} />}
      {tab === 'alimentation' && <FoodsTab child={child} />}
      {tab === 'besoins' && <NeedsSummary child={child} />}

      {tab === 'apercu' && (
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <Button label={tr('u4.child.edit')} variant="secondary" icon="edit-2" onPress={() => setEditing(true)} />
          <Button label={tr('u4.child.deleteProfile')} variant="ghost" icon="trash-2" loading={deleting} onPress={remove} />
        </View>
      )}

      {editing && <EditChildSheet key={child.id} child={child} visible={editing} onClose={() => setEditing(false)} />}
      {canPhoto ? <ChildPhotoSheet child={child} visible={photoOpen} onClose={() => setPhotoOpen(false)} /> : null}
    </Screen>
  );
}
