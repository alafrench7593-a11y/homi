/**
 * Responsabilités : les 8 domaines du foyer (courses, repas, bébé, crèche, animaux, ménage, administratif, santé
 * familiale), réutilisant family_domains (« Confier un domaine »). La personne qui porte un domaine reçoit
 * directement ses missions ; un domaine sans responsable garde ses missions « à prendre ».
 * Aucun score, aucun classement : seulement qui porte quoi et ce qui est en cours.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { Button, Card, Chip, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { DOMAIN_ICON } from '@/features/missions/domainIcons';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDomains, useSetDomain } from '@/lib/data/hooks-mental';
import { useMissions } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isTerminal, RESPONSIBILITIES } from '@/lib/domain/missions';
import type { DomainKey } from '@/lib/domain/mentalLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export default function Responsibilities() {
  const t = useTheme();
  const toast = useToast();
  const { people, labelOf, me } = usePeople();
  const q = useDomains();
  const set = useSetDomain();
  const { all } = useMissions();
  const owner = new Map((q.data ?? []).map((d) => [d.key, d.owner_id]));
  const mine = RESPONSIBILITIES.filter((k) => owner.get(k) === me);
  const open = (k: DomainKey) => all.filter((m) => m.domain_key === k && !isTerminal(m.mission_state) && m.mission_state !== 'declined').length;

  async function pick(key: DomainKey, id: string | null) {
    try { await set.mutateAsync({ key, owner_id: id }); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('mis.resp.title')} subtitle={tr('tool.family_responsibilities.sub')}>
      <Text muted>{tr('mis.resp.intro')}</Text>
      <Card tone="soft" testID="resp-mine">
        <Text weight="bold">{tr('mis.resp.mine')}</Text>
        <Text variant="small">{mine.length ? mine.map((k) => tr(`cm.domain.${k}` as TKey)).join(' · ') : tr('mis.resp.mineNone')}</Text>
      </Card>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={4} /> : RESPONSIBILITIES.map((k, i) => (
        <Cascade key={k} index={i}>
          <Card testID={`resp-${k}`} style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <MaterialCommunityIcons name={DOMAIN_ICON[k] as never} size={24} color={t.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{tr(`cm.domain.${k}` as TKey)}</Text>
                <Text variant="caption" muted>{tr(`cm.domain.${k}.d` as TKey)}</Text>
              </View>
              {open(k) ? <Text variant="caption" muted>{tr('mis.resp.open', { count: open(k) })}</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {people.map((p) => <Chip key={p.id} label={p.label} selected={owner.get(k) === p.id} onPress={() => void pick(k, owner.get(k) === p.id ? null : p.id)} testID={`resp-${k}-${p.role}`} />)}
            </View>
            <Text variant="caption" muted>{owner.get(k) ? tr('mis.resp.owner', { person: labelOf(owner.get(k)) }) : tr('mis.resp.free')}</Text>
          </Card>
        </Cascade>
      ))}
      <Button label={tr('mis.resp.all')} icon="grid" variant="secondary" onPress={() => router.push('/family/domains')} />
    </Screen>
  );
}
