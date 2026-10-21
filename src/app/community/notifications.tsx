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

type PrefKey = keyof Omit<CommunityNotifPrefs, 'user_id'>;
const ITEMS: { key: PrefKey; label: string; hint: string }[] = [
  { key: 'post_comment', label: 'Commentaires sur mes publications', hint: 'Quand quelqu’un répond à votre publication.' },
  { key: 'comment_reply', label: 'Réponses à mes commentaires', hint: 'Quand quelqu’un vous répond dans une discussion.' },
  { key: 'mention', label: 'Mentions', hint: 'Quand un membre écrit votre @identifiant.' },
  { key: 'reaction', label: 'Réactions', hint: 'Quand une publication reçoit un « j’aime » (une fois par jour au plus).' },
  { key: 'saved_reply', label: 'Publications enregistrées', hint: 'Nouvelle réponse dans une publication que vous avez enregistrée.' },
  { key: 'new_follower', label: 'Nouveaux abonné·es', hint: 'Quand un membre suit vos publications (une fois par personne).' },
  { key: 'followed_post', label: 'Publications des membres suivis', hint: 'Désactivé par défaut pour éviter trop de notifications.' },
  { key: 'group_activity', label: 'Activité de mes groupes privés', hint: 'Une notification par groupe toutes les 6 heures au plus.' },
  { key: 'group_invite', label: 'Invitations et partages', hint: 'Invitation dans un groupe privé, album partagé avec vous.' },
  { key: 'moderation', label: 'Modération', hint: 'Quand une de vos publications est masquée, retirée ou de nouveau visible.' },
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
    <Screen back title="Notifications">
      <SectionTitle title="Résumé quotidien" />
      {digestQ.isLoading && !digestQ.saved ? <Skeleton kind="list" rows={2} /> : (
        <Card testID="digest-prefs">
          <View style={{ gap: spacing.sm }}>
            <ToggleRow label="Résumé du matin" hint="Rendez-vous, rappels, prochaine sieste estimée, réponses reçues, nouveautés." value={d.morning} onChange={(v) => void digest({ morning: v })} />
            {d.morning ? (
              <Row wrap gap={6} testID="digest-morning-times">
                {MORNING_TIMES.map((t) => <Chip key={t} label={hLabel(t)} selected={d.morning_time === t} onPress={() => void digest({ morning_time: t })} />)}
              </Row>
            ) : null}
            <ToggleRow label="Résumé du soir" hint="La journée en bref : biberons, sommeil, changes, repas, rendez-vous de demain." value={d.evening} onChange={(v) => void digest({ evening: v })} />
            {d.evening ? (
              <Row wrap gap={6} testID="digest-evening-times">
                {EVENING_TIMES.map((t) => <Chip key={t} label={hLabel(t)} selected={d.evening_time === t} onPress={() => void digest({ evening_time: t })} />)}
              </Row>
            ) : null}
            <ToggleRow label="Question du jour" hint="Une question facultative, pour soi ou à partager." value={d.question} onChange={(v) => void digest({ question: v })} />
            <Text variant="label" muted>Rubriques du résumé</Text>
            <Row wrap gap={6}>
              {DIGEST_ITEMS.filter((k) => k !== 'question').map((k) => {
                const shown = !d.hidden_items.includes(k);
                return <Chip key={k} label={DIGEST_ITEM_LABEL[k]} selected={shown} onPress={() => toggleItem(k, !shown)} testID={`digest-item-${k}`} />;
              })}
            </Row>
            <Button label="Voir le résumé maintenant" icon="sun" variant="secondary" onPress={() => router.push('/today')} testID="digest-open" />
          </View>
        </Card>
      )}
      {!notificationsSupported ? <Text variant="caption" muted>Sur le web, les notifications ne s’affichent pas : le résumé reste consultable à tout moment.</Text> : null}

      <SectionTitle title="Rappels" />
      <Card>
        <ListRow icon="bell" title="Rappels" subtitle="Biberons, médicaments prescrits, rendez-vous, rappels personnels" onPress={() => router.push('/settings/reminders')} />
        <ListRow icon="inbox" title="Centre de notifications" onPress={() => router.push('/notifications')} />
      </Card>

      <SectionTitle title="Communauté" />
      {q.isLoading && !q.saved ? <Skeleton kind="list" rows={3} /> : (
        <Card>
          <View style={{ gap: spacing.sm }} testID="community-notif-prefs">
            {ITEMS.map((it) => <ToggleRow key={it.key} label={it.label} hint={it.hint} value={p[it.key] !== false} onChange={(v) => void toggle(it.key, v)} />)}
          </View>
        </Card>
      )}
      <Text variant="caption" muted>Sur l’écran verrouillé, une notification n’affiche jamais le contenu d’un message ni de vos suivis. Toucher une notification ouvre directement la publication, le commentaire ou le résumé.</Text>
      <Button label="Tout désactiver" variant="ghost" icon="bell-off" onPress={() => {
        const off = Object.fromEntries(ITEMS.map((it) => [it.key, false])) as unknown as CommunityNotifPrefs;
        setP(off); save.mutate(off, { onError: (e) => toast(friendlyError(e), 'error') });
        void digest({ morning: false, evening: false });
      }} testID="community-notif-off" />
    </Screen>
  );
}
