/**
 * Notifications : rappels (lien vers leurs réglages) et notifications de la communauté, désactivables séparément :
 * commentaire sur ma publication, réponse à mon commentaire, réaction, nouvelle réponse dans une publication
 * enregistrée, décision de modération.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, ListRow, SectionTitle, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { DEFAULT_NOTIF_PREFS, useCommunityNotifPrefs, useSaveNotifPrefs } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { CommunityNotifPrefs } from '@/lib/types';
import { spacing } from '@/theme/tokens';

const ITEMS: { key: keyof Omit<CommunityNotifPrefs, 'user_id'>; label: string; hint: string }[] = [
  { key: 'post_comment', label: 'Commentaires sur mes publications', hint: 'Quand quelqu’un répond à votre publication.' },
  { key: 'comment_reply', label: 'Réponses à mes commentaires', hint: 'Quand quelqu’un vous répond dans une discussion.' },
  { key: 'reaction', label: 'Réactions', hint: 'Quand une publication reçoit un « j’aime » (une fois par jour au plus).' },
  { key: 'saved_reply', label: 'Publications enregistrées', hint: 'Nouvelle réponse dans une publication que vous avez enregistrée.' },
  { key: 'moderation', label: 'Modération', hint: 'Quand une de vos publications est masquée, retirée ou de nouveau visible.' },
];

export default function NotificationSettings() {
  const toast = useToast();
  const q = useCommunityNotifPrefs();
  const save = useSaveNotifPrefs();
  const [p, setP] = useState<CommunityNotifPrefs>(DEFAULT_NOTIF_PREFS);
  useEffect(() => { setP(q.data); }, [JSON.stringify(q.data)]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(key: keyof Omit<CommunityNotifPrefs, 'user_id'>, value: boolean) {
    const next = { ...p, [key]: value };
    setP(next);
    try { await save.mutateAsync(next); } catch (e) { setP(p); toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Notifications">
      <Card>
        <ListRow icon="bell" title="Rappels" subtitle="Biberons, médicaments prescrits, rendez-vous, rappels personnels" onPress={() => router.push('/settings/reminders')} />
        <ListRow icon="inbox" title="Centre de notifications" onPress={() => router.push('/notifications')} />
      </Card>
      <SectionTitle title="Communauté" />
      {q.isLoading && !q.saved ? <Skeleton kind="list" rows={3} /> : (
        <Card>
          <View style={{ gap: spacing.sm }} testID="community-notif-prefs">
            {ITEMS.map((it) => <ToggleRow key={it.key} label={it.label} hint={it.hint} value={p[it.key]} onChange={(v) => void toggle(it.key, v)} />)}
          </View>
        </Card>
      )}
      <Text variant="caption" muted>Sur l’écran verrouillé, une notification de la communauté n’affiche jamais le contenu du message. Toucher une notification ouvre directement la publication ou le commentaire.</Text>
      <Button label="Tout désactiver" variant="ghost" icon="bell-off" onPress={() => { const off = { post_comment: false, comment_reply: false, reaction: false, saved_reply: false, moderation: false }; setP(off); save.mutate(off, { onError: (e) => toast(friendlyError(e), 'error') }); }} testID="community-notif-off" />
    </Screen>
  );
}
