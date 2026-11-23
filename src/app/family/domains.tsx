/**
 * Confier un domaine entier (pas une tâche) : « les vaccins et le pédiatre, c'est toi ». La personne qui porte le
 * domaine reçoit les tâches de ce domaine par défaut (« Vider ma tête », échéances) ; l'autre n'a plus à y penser.
 * 22/11/2026 : domaines portés en grand (par personne, libres), changer de porteur dans une fiche (valeur provisoire,
 * Annuler, Enregistrer verrouillé) au lieu d'un appui direct sur une pastille ; domaine ouvert dans l'adresse.
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Loading, Text } from '@/components/ui';
import { HmFixTray, HmHero } from '@/features/homeTrack/kit';
import { domainsBoard } from '@/lib/domain/restTrack';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDomains, useSetDomain } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DOMAINS, type DomainKey } from '@/lib/domain/mentalLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { toolBlurb, toolName } from '@/lib/domain/toolCatalog';
import { DOMAIN_ICON } from '@/features/missions/domainIcons';

export { DOMAIN_ICON };

export default function Domains() {
  const t = useTheme();
  const { people, labelOf } = usePeople();
  const q = useDomains();
  const set = useSetDomain();
  const owner = new Map((q.data ?? []).map((d) => [d.key, d.owner_id]));
  const counts = people.map((p) => ({ ...p, n: DOMAINS.filter((k) => owner.get(k) === p.id).length }));
  const board = domainsBoard(DOMAINS, owner, people);
  // 22/11/2026 : domaine ouvert gardé dans l'adresse (« ?domain= ») ; la correction se fait dans une fiche
  const qp = useLocalSearchParams<{ domain?: string }>();
  const openKey = (DOMAINS as readonly string[]).includes(qp.domain ?? '') ? (qp.domain as DomainKey) : null;
  const setOpen = (k: DomainKey | null) => router.setParams({ domain: k ?? undefined } as never);
  const ownerIdx = (k: DomainKey) => { const i = people.findIndex((p) => p.id === owner.get(k)); return i >= 0 ? i : people.length; };
  const since = (k: DomainKey) => q.data?.find((d) => d.key === k)?.updated_at;
  return (
    <Screen back title={toolName('family_domains')} subtitle={toolBlurb('family_domains')}>
      <Text muted>{tr('cm.dom.intro')}</Text>
      {people.length < 2 ? <Banner tone="info" icon="user-plus" action={<Button label={tr('cm.dom.invite')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/family')} />}>{tr('cm.dom.alone')}</Banner> : null}
      {counts.length ? (
        <HmHero testID="dom-summary" value={String(board.carried)} unit={tr('rs.dom.unit', { count: board.carried, total: DOMAINS.length })}
          split={[...counts.map((p) => ({ label: p.label, value: String(p.n), testID: `dom-count-${p.role}` })), { label: tr('rs.dom.free'), value: String(board.free), testID: 'dom-free' }]} />
      ) : null}
      {q.isLoading ? <Loading /> : DOMAINS.map((k) => (
        <Card key={k} testID={`dom-${k}`} onPress={() => setOpen(k)} accessibilityLabel={`${tr(`cm.domain.${k}` as TKey)}. ${owner.get(k) ? tr('cm.dom.owner', { person: labelOf(owner.get(k)) }) : tr('rs.dom.freeOne')}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name={DOMAIN_ICON[k] as never} size={24} color={t.colors.text} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{tr(`cm.domain.${k}` as TKey)}</Text>
              <Text variant="caption" muted>{tr(`cm.domain.${k}.d` as TKey)}</Text>
              <Text variant="small" weight={owner.get(k) ? 'bold' : undefined} muted={!owner.get(k)} testID={`dom-${k}-owner`}>
                {owner.get(k) ? tr('cm.dom.owner', { person: labelOf(owner.get(k)) }) : tr('rs.dom.freeOne')}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
          </View>
        </Card>
      ))}
      {openKey ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpen(null); }} testID="dom-tray" title={tr(`cm.domain.${openKey}` as TKey)}
          hero={owner.get(openKey) ? labelOf(owner.get(openKey)) : tr('rs.dom.freeOne')}
          lines={[tr(`cm.domain.${openKey}.d` as TKey), since(openKey) ? tr('rs.dom.since', { date: formatDate(since(openKey)!, { day: 'numeric', month: 'long', year: 'numeric' }) }) : null, tr('rs.dom.what')]}
          editLabel={tr('rs.dom.change')} editTitle={tr('rs.dom.fixTitle', { domain: tr(`cm.domain.${openKey}` as TKey) })}
          fields={[{ key: 'who', label: tr('rs.dom.who'), kind: 'choice', options: [...people.map((p) => p.label), tr('rs.dom.nobody')] }]}
          initial={{ who: String(ownerIdx(openKey)) }}
          onSave={async (d) => {
            const i = Number(d.who);
            const id = i >= 0 && i < people.length ? people[i].id : null;
            try { await set.mutateAsync({ key: openKey, owner_id: id }); return 'ok'; } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
      <Button label={toolName('mental_load')} icon="pie-chart" variant="secondary" onPress={() => router.push('/family/load')} />
    </Screen>
  );
}
