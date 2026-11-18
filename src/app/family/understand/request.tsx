/**
 * « Se comprendre » → demander un coup de main (19/11/2026), toujours sur confirmation et jamais automatiquement :
 * la personne choisit une tâche familiale partageable, relit (et peut modifier) sa demande, confirme. L'autre adulte
 * reçoit une DEMANDE (mission « À accepter ») qu'il accepte ou refuse ; acceptée, elle suit le cycle des missions
 * (Je m'en occupe → Mission terminée → historique). Aucune contrepartie, aucun lien avec un ressenti n'est affiché.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Field, Icon, ListRow } from '@/components/ui';
import { StaggerList } from '@/motion';
import { ConfirmSend } from '@/features/couple/CoupleKit';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePartner, useRestRequest } from '@/lib/data/hooks-couple';
import { REST_REQUESTS, requestAsk, requestDue, requestLabel, requestMission, type RestRequest } from '@/lib/domain/understand';
import { uuid } from '@/lib/uuid';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function RestRequestScreen() {
  const toast = useToast();
  const partner = usePartner();
  const req = useRestRequest();
  const [picked, setPicked] = useState<RestRequest | null>(null);
  const [text, setText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [clientId] = useState(uuid);

  async function go() {
    if (!partner || !picked) return;
    try {
      await req.mutateAsync({ recipient: partner.id, title: tr(requestMission(picked)), category: picked.category, due_at: requestDue(picked), ask: text.trim(), client_id: clientId });
      setConfirming(false);
      toast(tr('und.req.sent', { name: partner.name }));
      router.replace('/family/understand/inbox');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('und.req.title')} subtitle={partner ? tr('und.req.sub', { name: partner.name }) : undefined}>
      {!partner ? <Banner tone="info">{tr('und.compose.noPartner')}</Banner> : null}
      <StaggerList testID="und-req-list">
        {REST_REQUESTS.map((r) => (
          <ListRow key={r.key} icon={r.icon} title={tr(requestLabel(r))} testID={`und-req-${r.key}`}
            right={picked?.key === r.key ? <Icon name="check-circle" size={20} /> : undefined}
            onPress={() => { setPicked(r); setText(tr(requestAsk(r))); }} />
        ))}
      </StaggerList>
      {picked ? (
        <View style={{ gap: spacing.xs }}>
          <Field label={tr('und.req.text')} value={text} onChangeText={setText} maxLength={300} multiline style={{ minHeight: 80 }} testID="und-req-text" />
          <Button label={tr('und.req.send', { name: partner?.name ?? '' })} icon="send" full disabled={!partner || !text.trim()} onPress={() => setConfirming(true)} testID="und-req-send" />
        </View>
      ) : null}
      {partner ? <ConfirmSend visible={confirming} name={partner.name} text={text.trim()} busy={req.isPending} onConfirm={() => void go()} onClose={() => setConfirming(false)} /> : null}
    </Screen>
  );
}

