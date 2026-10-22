/**
 * Notifications, choisies une par une :
 *  - résumé du matin et du soir (heure au choix, rubriques au choix, question du jour facultative) — désactivé par défaut ;
 *  - rappels (lien vers leurs réglages) ;
 *  - communauté : commentaire, réponse, réaction, publication enregistrée, mention, nouvel abonné·e, publications des
 *    membres suivis (désactivé par défaut), activité des groupes privés, invitations, modération.
 * Aucune notification « artificielle » : chacune correspond à un événement réel.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { DEFAULT_NOTIF_PREFS, useCommunityNotifPrefs, useSaveNotifPrefs } from '@/lib/data/hooks-community';
import { DEFAULT_DIGEST, useDigestPrefs, useSaveDigestPrefs } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { DIGEST_ITEM_LABEL, DIGEST_ITEMS } from '@/lib/domain/dailyDigest';
import { notificationsSupported } from '@/lib/notifications';
import type { CommunityNotifPrefs, DigestPrefs } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

type PrefKey = keyof Omit<CommunityNotifPrefs, 'user_id'>;
const ITEMS: { key: PrefKey; label: TKey; hint: TKey }[] = [
  { key: 'post_comment', label: 'cm2.notif.postComment', hint: 'cm2.notif.postCommentHint' },
  { key: 'comment_reply', label: 'cm2.notif.commentReply', hint: 'cm2.notif.commentReplyHint' },
  { key: 'mention', label: 'cm2.notif.mention', hint: 'cm2.notif.mentionHint' },
  { key: 'reaction', label: 'cm2.notif.reaction', hint: 'cm2.notif.reactionHint' },
  { key: 'saved_reply', label: 'cm2.notif.savedReply', hint: 'cm2.notif.savedReplyHint' },
  { key: 'new_follower', label: 'cm2.notif.newFollower', hint: 'cm2.notif.newFollowerHint' },
  { key: 'followed_post', label: 'cm2.notif.followedPost', hint: 'cm2.notif.followedPostHint' },
  { key: 'group_activity', label: 'cm2.notif.groupActivity', hint: 'cm2.notif.groupActivityHint' },
  { key: 'group_invite', label: 'cm2.notif.groupInvite', hint: 'cm2.notif.groupInviteHint' },
  { key: 'moderation', label: 'cm2.notif.moderation', hint: 'cm2.notif.moderationHint' },
];
const MORNING_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];
const EVENING_TIMES = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
const hLabel = (t: string) => t.replace(/^0/, '').replace(':', ' h ').replace(/ h 00$/, ' h');

export default function NotificationSettings() {
  const toast = useToast();
  const q = useCommunityNotifPrefs();
  const save = useSaveNotifPrefs();
  const digestQ = useDigestPrefs();
  const saveDigest = useSaveDigestPrefs();
  const [p, setP] = useState<CommunityNotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [d, setD] = useState<DigestPrefs>(DEFAULT_DIGEST);
  useEffect(() => { setP(q.data); }, [JSON.stringify(q.data)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setD(digestQ.data); }, [JSON.stringify(digestQ.data)]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(key: PrefKey, value: boolean) {
    const next = { ...p, [key]: value };
    setP(next);
    try { await save.mutateAsync(next); } catch (e) { setP(p); toast(friendlyError(e), 'error'); }
  }
  async function digest(patch: Partial<DigestPrefs>) {
    const next = { ...d, ...patch };
    setD(next);
    try { await saveDigest.mutateAsync(next); } catch (e) { setD(d); toast(friendlyError(e), 'error'); }
  }
  const toggleItem = (k: string, shown: boolean) => void digest({ hidden_items: shown ? d.hidden_items.filter((x) => x !== k) : [...new Set([...d.hidden_items, k])] });

  return (
    <Screen back title={tr('cm2.notif.title')}>
      <SectionTitle title={tr('cm2.notif.digestSection')} />
      {digestQ.isLoading && !digestQ.saved ? <Skeleton kind="list" rows={2} /> : (
        <Card testID="digest-prefs">
          <View style={{ gap: spacing.sm }}>
            <ToggleRow label={tr('cm2.notif.morning')} hint={tr('cm2.notif.morningHint')} value={d.morning} onChange={(v) => void digest({ morning: v })} />
            {d.morning ? (
              <Row wrap gap={6} testID="digest-morning-times">
                {MORNING_TIMES.map((t) => <Chip key={t} label={hLabel(t)} selected={d.morning_time === t} onPress={() => void digest({ morning_time: t })} />)}
              </Row>
            ) : null}
            <ToggleRow label={tr('cm2.notif.evening')} hint={tr('cm2.notif.eveningHint')} value={d.evening} onChange={(v) => void digest({ evening: v })} />
            {d.evening ? (
              <Row wrap gap={6} testID="digest-evening-times">
                {EVENING_TIMES.map((t) => <Chip key={t} label={hLabel(t)} selected={d.evening_time === t} onPress={() => void digest({ evening_time: t })} />)}
              </Row>
            ) : null}
            <ToggleRow label={tr('cm2.notif.question')} hint={tr('cm2.notif.questionHint')} value={d.question} onChange={(v) => void digest({ question: v })} />
            <Text variant="label" muted>{tr('cm2.notif.digestItems')}</Text>
            <Row wrap gap={6}>
              {DIGEST_ITEMS.filter((k) => k !== 'question').map((k) => {
                const shown = !d.hidden_items.includes(k);
                return <Chip key={k} label={DIGEST_ITEM_LABEL[k]} selected={shown} onPress={() => toggleItem(k, !shown)} testID={`digest-item-${k}`} />;
              })}
            </Row>
            <Button label={tr('cm2.notif.digestOpen')} icon="sun" variant="secondary" onPress={() => router.push('/today')} testID="digest-open" />
          </View>
        </Card>
      )}
      {!notificationsSupported ? <Text variant="caption" muted>{tr('cm2.notif.webNote')}</Text> : null}

      <SectionTitle title={tr('cm2.notif.reminders')} />
      <Card>
        <ListRow icon="bell" title={tr('cm2.notif.reminders')} subtitle={tr('cm2.notif.remindersSub')} onPress={() => router.push('/settings/reminders')} />
        <ListRow icon="inbox" title={tr('cm2.notif.center')} onPress={() => router.push('/notifications')} />
      </Card>

      <SectionTitle title={tr('cm2.notif.community')} />
      {q.isLoading && !q.saved ? <Skeleton kind="list" rows={3} /> : (
        <Card>
          <View style={{ gap: spacing.sm }} testID="community-notif-prefs">
            {ITEMS.map((it) => <ToggleRow key={it.key} label={tr(it.label)} hint={tr(it.hint)} value={p[it.key] !== false} onChange={(v) => void toggle(it.key, v)} />)}
          </View>
        </Card>
      )}
      <Text variant="caption" muted>{tr('cm2.notif.lockNote')}</Text>
      <Button label={tr('cm2.notif.allOff')} variant="ghost" icon="bell-off" onPress={() => {
        const off = Object.fromEntries(ITEMS.map((it) => [it.key, false])) as unknown as CommunityNotifPrefs;
        setP(off); save.mutate(off, { onError: (e) => toast(friendlyError(e), 'error') });
        void digest({ morning: false, evening: false });
      }} testID="community-notif-off" />
    </Screen>
  );
}
