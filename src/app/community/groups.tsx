/**
 * Groupes : proposés selon le mois de naissance des enfants ou le terme prévu (seul le MOIS est envoyé en rejoignant),
 * invitations reçues, mes groupes, groupes thématiques, création d'un groupe privé (Premium).
 * Accès aussi aux albums partagés et aux ateliers.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { GroupCard, PremiumBadge } from '@/features/communitySocial';
import { useActivePregnancy, useChildren, useCommunityProfile } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useGroupAction, useGroups } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { cohortSuggestions } from '@/lib/domain/communitySocial';
import { isPremiumRequired } from '@/lib/premium/features';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function Groups() {
  const t = useTheme();
  const toast = useToast();
  const groups = useGroups();
  const act = useGroupAction();
  const { data: me } = useCommunityProfile();
  const { data: children } = useChildren();
  const pregnancy = useActivePregnancy();
  const access = usePremiumAccess('community_groups');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const list = groups.data ?? [];
  const mine = list.filter((g) => g.is_member);
  const invites = list.filter((g) => g.pending_invitation && !g.is_member);
  const themes = list.filter((g) => g.kind === 'theme' && !g.is_member);
  const suggestions = useMemo(() => cohortSuggestions({ childBirthDates: (children ?? []).map((c) => c.birth_date), dueDate: pregnancy?.due_date ?? null })
    .filter((s) => !mine.some((g) => g.kind === 'cohort' && g.cohort_type === s.type && String(g.cohort_month).slice(0, 7) === s.month)), [children, pregnancy, mine]);

  const needProfile = () => router.push({ pathname: '/community/profile', params: { next: 'groups' } });
  async function joinCohort(type: 'birth' | 'due', month: string) {
    if (!me) return needProfile();
    try {
      const id = await act.mutateAsync({ fn: 'join_cohort_group', args: { p_type: type, p_month: `${month}-01` } });
      toast('Vous avez rejoint le groupe.');
      if (id) router.push(`/community/group/${id}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function openCreate() {
    if (!me) return needProfile();
    if (!access.require(<Text variant="small">{'Par exemple « Copines de la maternité » : un espace sur invitation, invisible pour le reste de la communauté.'}</Text>)) return;
    setCreating(true);
  }
  async function create() {
    try {
      const id = await act.mutateAsync({ fn: 'create_private_group', args: { p_name: name.trim(), p_description: description.trim() || null } });
      setCreating(false); setName(''); setDescription('');
      toast('Groupe créé. Invitez les membres de votre choix.');
      if (id) router.push(`/community/group/${id}` as never);
    } catch (e) {
      if (isPremiumRequired(e)) { setCreating(false); access.showPreview(); } else toast(friendlyError(e), 'error');
    }
  }

  return (
    <Screen back title="Groupes" subtitle="Échanger avec des parents qui vivent la même chose">
      {suggestions.length ? (
        <Card testID="cohort-suggestions">
          <Row><Icon name="gift" size={16} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>Proposés pour vous</Text></Row>
          {suggestions.map((s) => (
            <Row key={`${s.type}-${s.month}`} style={{ marginTop: 6 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text weight="medium">{s.label}</Text>
                <Text variant="caption" muted>{s.reason}</Text>
              </View>
              <Button label="Rejoindre" size="sm" onPress={() => void joinCohort(s.type, s.month)} loading={act.isPending} testID={`join-cohort-${s.type}-${s.month}`} />
            </Row>
          ))}
          <Text variant="caption" muted style={{ marginTop: 6 }}>Seul le mois est utilisé pour trouver le groupe : ni le prénom, ni la date exacte ne sont partagés.</Text>
        </Card>
      ) : null}

      {invites.length ? (
        <>
          <SectionTitle title="Invitations" />
          {invites.map((g) => <GroupCard key={g.id} g={g} />)}
        </>
      ) : null}

      <SectionTitle title="Mes groupes" />
      {groups.isLoading && !groups.data ? <Skeleton kind="list" rows={2} /> : mine.length ? (
        <View style={{ gap: spacing.sm }}>{mine.map((g) => <GroupCard key={g.id} g={g} compact />)}</View>
      ) : <EmptyState icon="users" title="Vous n’avez rejoint aucun groupe" body="Rejoignez un groupe thématique ou celui du mois de naissance de votre enfant." />}

      <Card tone="soft" onPress={openCreate} accessibilityLabel="Créer un groupe privé" testID="group-create">
        <Row><Icon name="lock" size={18} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>Créez votre groupe privé de parents</Text>{!access.premium ? <PremiumBadge /> : <Icon name="plus" size={18} />}</Row>
        <Text variant="small" muted style={{ marginTop: 4 }}>Sur invitation uniquement. Rejoindre un groupe où l’on vous invite reste gratuit.</Text>
      </Card>

      {themes.length ? (
        <>
          <SectionTitle title="Groupes thématiques" />
          <View style={{ gap: spacing.sm }}>{themes.map((g) => <GroupCard key={g.id} g={g} />)}</View>
        </>
      ) : null}

      <SectionTitle title="Aussi" />
      <Card>
        <ListRow icon="image" title="Albums photo" subtitle="Privés ou partagés avec des membres choisis" onPress={() => router.push('/community/albums' as never)} testID="open-albums" />
        <ListRow icon="video" title="Ateliers et rencontres" subtitle="Programmés par l’équipe" onPress={() => router.push('/community/events' as never)} testID="open-events" />
      </Card>

      <Sheet visible={creating} onClose={() => setCreating(false)} title="Nouveau groupe privé">
        <View style={{ gap: spacing.sm }} testID="group-create-sheet">
          <Field label="Nom du groupe" value={name} onChangeText={setName} maxLength={60} placeholder="Copines de la maternité" testID="group-name" />
          <Field label="Description (facultatif)" value={description} onChangeText={setDescription} maxLength={400} multiline testID="group-description" />
          <Text variant="caption" muted>Pas d’adresse, de numéro ni de nom de famille : le nom du groupe est visible des personnes invitées.</Text>
          <Button label="Créer le groupe" icon="check" disabled={name.trim().length < 3} loading={act.isPending} onPress={() => void create()} testID="group-create-submit" />
        </View>
      </Sheet>
    </Screen>
  );
}
