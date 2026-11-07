/**
 * Confier un domaine entier (pas une tâche) : « les vaccins et le pédiatre, c'est toi ». La personne qui porte le
 * domaine reçoit les tâches de ce domaine par défaut (« Vider ma tête », échéances) ; l'autre n'a plus à y penser.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Loading, Text } from '@/components/ui';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDomains, useSetDomain } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DOMAINS, type DomainKey } from '@/lib/domain/mentalLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export const DOMAIN_ICON: Record<DomainKey, string> = {
  health: 'stethoscope', school: 'school', activities: 'run', birthdays: 'cake-variant', shopping: 'cart', meals: 'silverware-fork-knife',
  laundry: 'washing-machine', admin: 'file-document-multiple', home: 'home-variant', holidays: 'bag-suitcase', clothes: 'tshirt-crew', nights: 'weather-night',
};

export default function Domains() {
  const t = useTheme();
  const toast = useToast();
  const { people, labelOf } = usePeople();
  const q = useDomains();
  const set = useSetDomain();
  const owner = new Map((q.data ?? []).map((d) => [d.key, d.owner_id]));
  const counts = people.map((p) => ({ ...p, n: DOMAINS.filter((k) => owner.get(k) === p.id).length }));
  async function pick(key: DomainKey, id: string | null) {
    try { await set.mutateAsync({ key, owner_id: id }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Screen back title={tr('tool.family_domains')} subtitle={tr('tool.family_domains.sub')}>
      <Text muted>{tr('cm.dom.intro')}</Text>
      {people.length < 2 ? <Banner tone="info" icon="user-plus" action={<Button label={tr('cm.dom.invite')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/family')} />}>{tr('cm.dom.alone')}</Banner> : null}
      {counts.length ? (
        <Card tone="soft" testID="dom-summary">
          {counts.map((p) => <Text key={p.id} variant="small">{tr('cm.dom.carries', { person: p.label, count: p.n })}</Text>)}
          <Text variant="caption" muted>{tr('cm.dom.free', { count: DOMAINS.filter((k) => !owner.get(k)).length })}</Text>
        </Card>
      ) : null}
      {q.isLoading ? <Loading /> : DOMAINS.map((k) => (
        <Card key={k} testID={`dom-${k}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name={DOMAIN_ICON[k] as never} size={24} color={t.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{tr(`cm.domain.${k}` as TKey)}</Text>
              <Text variant="caption" muted>{tr(`cm.domain.${k}.d` as TKey)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
            {people.map((p) => <Chip key={p.id} label={p.label} selected={owner.get(k) === p.id} onPress={() => void pick(k, owner.get(k) === p.id ? null : p.id)} testID={`dom-${k}-${p.role}`} />)}
          </View>
          {owner.get(k) ? <Text variant="caption" muted>{tr('cm.dom.owner', { person: labelOf(owner.get(k)) })}</Text> : null}
        </Card>
      ))}
      <Button label={tr('tool.mental_load')} icon="pie-chart" variant="secondary" onPress={() => router.push('/family/load')} />
    </Screen>
  );
}
