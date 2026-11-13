/**
 * Responsabilités : les 8 domaines du foyer (courses, repas, bébé, crèche, animaux, ménage, administratif, santé
 * familiale), réutilisant family_domains (« Confier un domaine »). La personne qui porte un domaine reçoit
 * directement ses missions ; un domaine sans responsable garde ses missions « à prendre ».
 * Refonte 16/11/2026 : liste lisible sur surface mate ; pour chaque domaine, un sélecteur de membre (avatar + prénom,
 * indicateur qui glisse) dont l'état affiché est celui du SERVEUR (mise à jour optimiste annulée en cas d'erreur,
 * confirmation après la réponse). Aucun score, aucun classement : seulement qui porte quoi et ce qui est en cours.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { Divider, ListRow, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { MatteSurface, MemberSelector, SmokedSurface } from '@/features/scene';
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

const NOBODY = '__nobody__';

export default function Responsibilities() {
  const t = useTheme();
  const toast = useToast();
  const { people, nameOf, me } = usePeople();
  const q = useDomains();
  const set = useSetDomain();
  const { all } = useMissions();
  const [pending, setPending] = useState<Partial<Record<DomainKey, string>>>({});
  const owner = new Map((q.data ?? []).map((d) => [d.key, d.owner_id]));
  const mine = RESPONSIBILITIES.filter((k) => owner.get(k) === me);
  const open = (k: DomainKey) => all.filter((m) => m.domain_key === k && !isTerminal(m.mission_state) && m.mission_state !== 'declined').length;

  async function pick(key: DomainKey, value: string) {
    const id = value === NOBODY ? null : value;
    setPending((p) => ({ ...p, [key]: value }));
    try {
      await set.mutateAsync({ key, owner_id: id });
      // Confirmation après la réponse du serveur
      toast(id ? tr('mis.resp.owner', { person: nameOf(id) }) : tr('mis.resp.free'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setPending((p) => { const n = { ...p }; delete n[key]; return n; }); }
  }

  return (
    <Screen back title={tr('mis.resp.title')} subtitle={tr('tool.family_responsibilities.sub')}>
      <Text muted>{tr('mis.resp.intro')}</Text>
      <SmokedSurface testID="resp-mine" style={{ gap: 2 }}>
        <Text weight="bold">{tr('mis.resp.mine')}</Text>
        <Text variant="small">{mine.length ? mine.map((k) => tr(`cm.domain.${k}` as TKey)).join(' · ') : tr('mis.resp.mineNone')}</Text>
      </SmokedSurface>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={4} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : (
        <MatteSurface padded={spacing.sm} style={{ gap: 0 }}>
          {RESPONSIBILITIES.map((k, i) => {
            const current = pending[k] ?? owner.get(k) ?? NOBODY;
            return (
              <Cascade key={k} index={i}>
                {i ? <Divider /> : null}
                <View testID={`resp-${k}`} style={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <MaterialCommunityIcons name={DOMAIN_ICON[k] as never} size={22} color={t.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text weight="bold">{tr(`cm.domain.${k}` as TKey)}</Text>
                      <Text variant="caption" muted>{tr(`cm.domain.${k}.d` as TKey)}</Text>
                    </View>
                    {open(k) ? <Text variant="caption" muted>{tr('mis.resp.open', { count: open(k) })}</Text> : null}
                  </View>
                  <MemberSelector label={`${tr(`cm.domain.${k}` as TKey)} · ${tr('mis.resp.who')}`} value={current} onChange={(v) => void pick(k, v)}
                    options={[
                      { value: NOBODY, label: tr('mis.resp.nobody'), icon: 'minus-circle', testID: `resp-${k}-none` },
                      ...people.map((p) => ({ value: p.id, label: p.isMe ? `${p.name} (${tr('u7.people.you')})` : p.name, avatarPath: p.avatarPath, initial: p.initial, testID: `resp-${k}-${p.role}` })),
                    ]} />
                  <Text variant="caption" muted>{owner.get(k) ? tr('mis.resp.owner', { person: nameOf(owner.get(k)) }) : tr('mis.resp.free')}</Text>
                </View>
              </Cascade>
            );
          })}
        </MatteSurface>
      )}
      <ListRow icon="grid" title={tr('mis.resp.all')} onPress={() => router.push('/family/domains')} />
    </Screen>
  );
}
