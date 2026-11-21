/**
 * Couple → « Se comprendre » (19/11/2026). Aider un parent à dire ce qu'il ressent, sans culpabilisation.
 *  1. « Comment je me sens » : ressentis à choix multiples (accord selon le choix de la personne, sinon épicène) +
 *     « Tu veux lui expliquer quelque chose ? » facultatif. « Garder pour moi » : ressenti PRIVÉ (couple_feelings,
 *     propriétaire seule). « Préparer un message » : ouvre la rédaction ; rien ne part sans confirmation.
 *  2. « Intimité et proximité » : sept situations, chacune avec une formulation écrite à l'avance (et trois variantes).
 *  3. « Nos messages » (fil entre les deux adultes seulement) et, sans aucune attente, « Organiser un moment à deux ».
 * Ressentis de détresse cochés → une ligne sobre vers un professionnel de santé et les ressources d'aide de l'app.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { GlassCard } from '@/components/glass';
import { Button, Chip, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { Cascade, ContentSwap } from '@/motion';
import { HelpLine, InviteOtherParent } from '@/features/couple/CoupleKit';
import { useUserId } from '@/lib/auth';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCoupleMessages, useGrammar, useMyFeelings, usePartner, useSaveFeeling, useSeenAt } from '@/lib/data/hooks-couple';
import { FEELINGS, SITUATIONS, feelingKey, showsHelp, situationTitle, unreadCount, type Feeling } from '@/lib/domain/understand';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { MotionItem, MotionList } from '@/motion/ListMotion';

export default function Understand() {
  const toast = useToast();
  const me = useUserId();
  const partner = usePartner();
  const { grammar } = useGrammar();
  const [picked, setPicked] = useState<Feeling[]>([]);
  const [note, setNote] = useState('');
  const save = useSaveFeeling();
  const mine = useMyFeelings();
  const msgs = useCoupleMessages();
  const { seen } = useSeenAt();
  const unread = unreadCount(msgs.data ?? [], me ?? '', seen);
  const toggle = (f: Feeling) => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  async function keep() {
    try {
      await save.mutateAsync({ feelings: picked, note: note.trim() || null });
      toast(tr('und.kept'));
      setPicked([]); setNote('');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('und.title')} subtitle={tr('und.sub')}>
      <Text variant="small" muted>{tr('und.intro')}</Text>
      <Cascade index={0}>
        <ListRow icon="message-circle" title={tr('und.inbox.entry')} testID="und-inbox"
          subtitle={unread ? tr('und.inbox.unread', { count: unread }) : tr('und.inbox.private')} onPress={() => router.push('/family/understand/inbox')} />
      </Cascade>

      <SectionTitle title={tr('und.feel.title')} subtitle={tr('und.feel.hint')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} testID="und-feelings" accessibilityRole="none">
        {FEELINGS.map((f) => (
          <Chip key={f} label={tr(feelingKey(f, grammar))} selected={picked.includes(f)} onPress={() => toggle(f)} testID={`und-feel-${f}`} />
        ))}
      </View>
      <Field label={tr('und.note')} optional value={note} onChangeText={setNote} maxLength={1000} multiline placeholder={tr('und.notePh')} testID="und-note" />
      <ContentSwap swapKey={showsHelp(picked) ? 'help' : 'none'}>
        {showsHelp(picked) ? <HelpLine /> : <View />}
      </ContentSwap>
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('und.keep')} icon="lock" variant="secondary" full disabled={!picked.length} loading={save.isPending} onPress={() => void keep()} testID="und-keep" />
        <Button label={tr('und.shareTo', { name: partner?.name ?? tr('und.inbox.from') })} icon="edit-3" full disabled={!picked.length && !note.trim()} testID="und-prepare"
          onPress={() => router.push({ pathname: '/family/understand/compose', params: { feelings: picked.join(','), note } } as never)} />
      </View>
      {!partner ? <InviteOtherParent testID="und-invite" /> : null}

      <SectionTitle title={tr('und.intim.title')} subtitle={tr('und.intim.sub')} />
      <View testID="und-situations">
        {SITUATIONS.map((s) => (
          <ListRow key={s} icon="feather" title={tr(situationTitle(s))} testID={`und-sit-${s}`}
            onPress={() => router.push({ pathname: '/family/understand/compose', params: { situation: s } } as never)} />
        ))}
      </View>

      <GlassCard testID="und-moment">
        <View style={{ gap: spacing.xs }}>
          <Text weight="bold">{tr('und.moment.title')}</Text>
          <Text variant="small" muted>{tr('und.moment.body')}</Text>
          <Button label={tr('und.moment.go')} icon="calendar" size="sm" variant="ghost" onPress={() => router.push('/calendar')} />
        </View>
      </GlassCard>

      {mine.data?.length ? (
        <>
          <SectionTitle title={tr('und.history')} subtitle={tr('und.historyB')} />
          <MotionList style={{ gap: spacing.md }}>{mine.data.slice(0, 5).map((f) => (
            <MotionItem key={f.id}><Text key={f.id} variant="small" muted testID={`und-mine-${f.id}`}>
              {formatDate(f.created_at, { weekday: 'short', day: 'numeric', month: 'short' })} · {f.feelings.map((x) => tr(feelingKey(x, grammar))).join(', ')}
            </Text></MotionItem>
          ))}</MotionList>
        </>
      ) : null}
    </Screen>
  );
}
