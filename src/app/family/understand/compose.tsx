/**
 * « Se comprendre » → rédaction (19/11/2026). Point de départ : une situation d'« Intimité et proximité » (formulation
 * suggérée + « Plus courte / Plus douce / Plus directe », écrites à l'avance) ou les ressentis cochés. La personne
 * modifie librement, garde en brouillon (sur ce téléphone), ou n'envoie rien. RIEN n'est transmis sans « Envoyer à
 * <Prénom> » PUIS la confirmation qui montre le texte exact et le destinataire. Après un partage de fatigue ou de
 * besoin de repos : « Voulez-vous organiser un moment de repos ? » — une proposition, jamais une création automatique.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { GlassCard } from '@/components/glass';
import { Banner, Button, Field, Segmented, Text } from '@/components/ui';
import { ContentSwap } from '@/motion';
import { ConfirmSend, HelpLine } from '@/features/couple/CoupleKit';
import { useUserId } from '@/lib/auth';
import { friendlyError } from '@/lib/data/hooks-settings';
import { loadDraft, saveDraft, useCoupleSend, useGrammar, usePartner } from '@/lib/data/hooks-couple';
import {
  FEELINGS, SITUATIONS, VARIANTS, feelingKey, feelingsMessage, offersRest, showsHelp, situationText, situationTitle,
  type Feeling, type Situation, type Variant,
} from '@/lib/domain/understand';
import { uuid } from '@/lib/uuid';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export default function Compose() {
  const toast = useToast();
  const me = useUserId();
  const params = useLocalSearchParams<{ situation?: string; feelings?: string; note?: string }>();
  const situation = (SITUATIONS as readonly string[]).includes(params.situation ?? '') ? (params.situation as Situation) : null;
  const feelings = (params.feelings ?? '').split(',').filter((f): f is Feeling => (FEELINGS as readonly string[]).includes(f));
  const { grammar } = useGrammar();
  const partner = usePartner();
  const send = useCoupleSend();
  const draftKey = situation ?? 'feelings';
  const [variant, setVariant] = useState<Variant>('base');
  const suggested = useMemo(() => (situation ? tr(situationText(situation, variant))
    : feelingsMessage(feelings.map((f) => tr(feelingKey(f, grammar))), params.note ?? '')), [situation, variant, feelings.join(','), grammar, params.note]); // eslint-disable-line react-hooks/exhaustive-deps
  const [text, setText] = useState('');
  const [edited, setEdited] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const [clientId] = useState(uuid);
  // Brouillon gardé : il prime sur la suggestion
  useEffect(() => { void loadDraft(me, draftKey).then((d) => { if (d) { setText(d); setEdited(true); } }); }, [me, draftKey]);
  useEffect(() => { if (!edited) setText(suggested); }, [suggested, edited]);

  async function confirmSend() {
    if (!partner) return;
    try {
      await send.mutateAsync({ recipient: partner.id, kind: 'share', body: text.trim(), situation, client_id: clientId });
      await saveDraft(me, draftKey, null);
      setConfirming(false);
      setSent(true);
      toast(tr('und.sent', { name: partner.name }));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (sent && partner) {
    const rest = offersRest({ feelings, situation });
    return (
      <Screen back title={tr('und.title')}>
        <Banner tone="info" title={tr('und.sent', { name: partner.name })} />
        {rest ? (
          <GlassCard testID="und-rest">
            <View style={{ gap: spacing.sm }}>
              <Text weight="bold" accessibilityRole="header">{tr('und.rest.title')}</Text>
              <Text variant="small" muted>{tr('und.rest.body', { name: partner.name })}</Text>
              <Button label={tr('und.rest.yes')} icon="check" onPress={() => router.replace('/family/understand/request')} testID="und-rest-yes" />
              <Button label={tr('und.rest.no')} variant="ghost" onPress={() => router.back()} testID="und-rest-no" />
            </View>
          </GlassCard>
        ) : null}
        <GlassCard testID="und-moment-end">
          <View style={{ gap: spacing.xs }}>
            <Text weight="bold">{tr('und.moment.title')}</Text>
            <Text variant="small" muted>{tr('und.moment.body')}</Text>
            <Button label={tr('und.moment.go')} icon="calendar" size="sm" variant="ghost" onPress={() => router.push('/calendar')} />
          </View>
        </GlassCard>
        <Button label={tr('und.inbox.entry')} variant="secondary" icon="message-circle" onPress={() => router.replace('/family/understand/inbox')} />
      </Screen>
    );
  }

  return (
    <Screen back title={situation ? tr(situationTitle(situation)) : tr('und.compose.title')} subtitle={tr('und.compose.edit')}>
      {situation ? (
        <Segmented<Variant> label={tr('und.v.label')} value={variant} onChange={(v) => { setVariant(v); setEdited(false); }}
          options={VARIANTS.map((v) => ({ value: v, label: tr(`und.v.${v}` as TKey), testID: `und-variant-${v}` }))} />
      ) : null}
      <ContentSwap swapKey={situation ? variant : 'feelings'}>
        <Field label={tr('und.compose.title')} value={text} onChangeText={(v) => { setText(v); setEdited(true); }} maxLength={2000} multiline testID="und-text" />
      </ContentSwap>
      {showsHelp(feelings) ? <HelpLine /> : null}
      {!partner ? <Banner tone="info">{tr('und.compose.noPartner')}</Banner> : null}
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('und.compose.send', { name: partner?.name ?? '' })} icon="send" full disabled={!partner || !text.trim()}
          onPress={() => setConfirming(true)} testID="und-send" />
        <Button label={tr('und.compose.draft')} variant="secondary" icon="bookmark" full disabled={!text.trim()} testID="und-draft"
          onPress={() => void saveDraft(me, draftKey, text.trim()).then(() => toast(tr('und.compose.drafted')))} />
        <Button label={tr('und.compose.discard')} variant="ghost" full testID="und-discard"
          onPress={() => void saveDraft(me, draftKey, null).then(() => router.back())} />
      </View>
      {partner ? (
        <ConfirmSend visible={confirming} name={partner.name} text={text.trim()} busy={send.isPending}
          onConfirm={() => void confirmSend()} onClose={() => setConfirming(false)} />
      ) : null}
    </Screen>
  );
}
