/**
 * Partager son cycle avec son ou sa partenaire (Premium) : un membre du foyer, élément par élément, en lecture
 * seule, révocable à tout moment. Jamais : rapports, contraception, notes, étiquettes, photos, tests, symptômes intimes.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { Banner, Button, Card, haptic, Row, Text, Toggle } from '@/components/ui';
import { PremiumSection } from '@/components/Premium';
import { useUserId } from '@/lib/auth';
import { useHouseholdMembers } from '@/lib/data/hooks';
import { useMyCycleShares, useRevokeCycleShare, useSaveCycleShare, type CycleShare } from '@/lib/data/hooks-cycle3';
import { friendlyError } from '@/lib/data/hooks-settings';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const KEYS = ['share_period', 'share_fertile', 'share_mood', 'share_symptoms'] as const;
type Flags = Pick<CycleShare, (typeof KEYS)[number]>;
const LABEL: Record<(typeof KEYS)[number], TKey> = { share_period: 'c3.share.period', share_fertile: 'c3.share.fertile', share_mood: 'c3.share.mood', share_symptoms: 'c3.share.symptoms' };

export default function CycleShareScreen() {
  const me = useUserId();
  const members = useHouseholdMembers();
  const shares = useMyCycleShares();
  const others = (members.data ?? []).filter((m) => m.user_id !== me);
  return (
    <Screen back title={tr('c3.share.title')}>
      <Text muted>{tr('c3.share.intro')}</Text>
      <Banner tone="info">{tr('c3.share.never')}</Banner>
      {members.isLoading && !members.data ? <Skeleton kind="card" rows={2} /> : !others.length ? <Card tone="soft"><Text>{tr('c3.share.noMember')}</Text></Card> : (
        <PremiumSection feature="cycle_share">
          <View style={{ gap: spacing.sm }}>
            {others.map((m) => <MemberShare key={m.user_id} partner={m.user_id} role={m.role} share={(shares.data ?? []).find((s) => s.partner_id === m.user_id) ?? null} />)}
          </View>
        </PremiumSection>
      )}
    </Screen>
  );
}

function MemberShare({ partner, role, share }: { partner: string; role: string; share: CycleShare | null }) {
  const toast = useToast();
  const me = useUserId();
  const save = useSaveCycleShare();
  const revoke = useRevokeCycleShare();
  const [flags, setFlags] = useState<Flags>({ share_period: true, share_fertile: false, share_mood: false, share_symptoms: false });
  useEffect(() => { if (share) setFlags({ share_period: share.share_period, share_fertile: share.share_fertile, share_mood: share.share_mood, share_symptoms: share.share_symptoms }); }, [share]);
  async function commit() {
    try { await save.mutateAsync({ partner, values: flags, exists: !!share }); haptic('success'); toast(tr('c3.share.saved'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function stop() {
    if (!me || !(await confirm(tr('c3.share.stop'), tr('c3.share.stopConfirm'), tr('c3.share.stop')))) return;
    try { await revoke.mutateAsync({ owner: me, partner }); toast(tr('c3.share.stopped'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Card testID={`share-${partner}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold" style={{ flex: 1 }}>{tr(`c3.share.member.${role}` as TKey)}</Text>
        {share ? <Text variant="caption" weight="bold" muted>{tr('c3.share.active')}</Text> : null}
      </Row>
      <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
        {KEYS.map((k) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <Text style={{ flex: 1 }}>{tr(LABEL[k])}</Text>
            <Toggle label={tr(LABEL[k])} value={flags[k]} onChange={(v) => setFlags((f) => ({ ...f, [k]: v }))} />
          </Row>
        ))}
      </View>
      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <Button label={share ? tr('c3.share.save') : tr('c3.share.start')} icon={share ? 'check' : 'users'} onPress={commit} disabled={!KEYS.some((k) => flags[k])} full testID={`share-save-${partner}`} />
        {share ? <Button label={tr('c3.share.stop')} variant="ghost" icon="x-circle" onPress={stop} full testID={`share-stop-${partner}`} /> : null}
      </View>
    </Card>
  );
}
