/** Profil d'un enfant : aperçu, croissance, étapes, santé, alimentation. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { initialsColor } from '@/components/Illustrations';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, IconButton, Row, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { NeedsSummary } from '@/features/needs';
import { ChildAvatar } from '@/features/childAvatar';
import { ChildTabs, CHILD_TABS, EditChildSheet, FoodsTab, GrowthTab, HealthTab, MilestonesTab, OverviewTab, type ChildTab } from '@/features/child';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useChild, useChildren, useInvalidate, useMemberships } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { removeChildPhotoFiles } from '@/lib/data/hooks-photos';
import { childAge, initials } from '@/lib/domain/child';
import { formatDateFr } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';

export default function ChildProfile() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const toast = useToast();
  const inv = useInvalidate();
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const child = useChild(params.id);
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const [deleting, setDeleting] = useState(false);
  const { subject, setSubject } = useActiveSubject();
  const initial = CHILD_TABS.some((x) => x.value === params.tab) ? (params.tab as ChildTab) : 'apercu';
  const [tab, setTab] = useState<ChildTab>(initial);
  const [editing, setEditing] = useState(false);

  if (!child) {
    return (
      <Screen back title="Profil">
        {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title="Impossible d’afficher ce profil" />
        ) : (
          <EmptyState
            icon="user-x"
            title="Profil introuvable"
            body="Ce profil est introuvable. Il a peut-être été supprimé."
            action={{ label: 'Retour à l’accueil', icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }

  const age = childAge(child.birth_date);

  async function remove() {
    if (!child) return;
    const ok = await confirm(
      `Supprimer le profil de ${child.first_name} ?`,
      'Toutes ses données (suivi quotidien, mesures, moments, santé, alimentation, album photo) seront définitivement supprimées pour toutes les personnes du foyer.',
      'Supprimer',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      // fichiers de l'album effacés d'abord (les lignes partent ensuite en cascade avec le profil)
      await removeChildPhotoFiles(child.id);
      await backend.remove('children', [eq('id', child.id)]);
      if (subject.type === 'child' && subject.id === child.id) setSubject(null);
      inv('children');
      toast('Profil supprimé.');
      router.replace('/(tabs)');
    } catch (e) {
      toast(friendlyError(e, 'Suppression impossible. Réessayez dans un instant.'), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen
      back
      right={<IconButton icon="edit-2" label={`Modifier le profil de ${child.first_name}`} onPress={() => setEditing(true)} />}
    >
      <Row style={{ gap: spacing.md }}>
        <ChildAvatar child={child} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" accessibilityRole="header">{child.first_name}</Text>
          <Text muted>{age.label} · né{child.sex === 'female' ? 'e' : child.sex === 'male' ? '' : '·e'} le {formatDateFr(child.birth_date)}{child.birth_time ? ` à ${child.birth_time.slice(0, 5)}` : ''}</Text>
          {child.birth_weight_g || child.birth_length_cm || child.birth_term_weeks ? (
            <Text variant="small" muted testID="birth-facts">{[child.birth_weight_g ? `${child.birth_weight_g} g` : null, child.birth_length_cm ? `${String(child.birth_length_cm).replace('.', ',')} cm` : null, child.birth_term_weeks ? `${child.birth_term_weeks} SA` : null].filter(Boolean).join(' · ')}</Text>
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
          <Button label="Modifier le profil" variant="secondary" icon="edit-2" onPress={() => setEditing(true)} />
          <Button label="Supprimer le profil" variant="ghost" icon="trash-2" loading={deleting} onPress={remove} />
        </View>
      )}

      {editing && <EditChildSheet key={child.id} child={child} visible={editing} onClose={() => setEditing(false)} />}
    </Screen>
  );
}
