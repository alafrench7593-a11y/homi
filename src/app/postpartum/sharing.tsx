/**
 * Ce que je partage : la mère choisit, champ par champ, ce que son foyer peut voir.
 * Fermé par défaut, révocable à tout moment. Le serveur refiltre tout ce qui n'est pas autorisé.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useHousehold, useHouseholdId } from '@/lib/data/hooks';
import { useMySharedStatus, usePostpartumSettings, useSaveSettings, useStopSharing, useUpdateShared } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AVAILABILITY_LABEL, REST_LABEL, anySharing, helpIdeas, type PostpartumSettings, type SharedStatus } from '@/lib/domain/postpartum';
import { spacing } from '@/theme/tokens';

type ShareKey = 'share_rest_need' | 'share_availability' | 'share_relay_requests' | 'share_summary';
const SHARE_OPTIONS: { key: ShareKey; title: string; detail: string }[] = [
  { key: 'share_rest_need', title: 'Mon besoin de repos', detail: '« Pas de besoin particulier », « besoin de souffler » ou « vraiment besoin de repos ».' },
  { key: 'share_availability', title: 'Ma disponibilité', detail: 'Disponible, je me repose, ou pas disponible pour le moment.' },
  { key: 'share_relay_requests', title: 'Mes demandes de relais', detail: 'Pour demander qu’on prenne le bébé, avec un petit mot si vous voulez.' },
  { key: 'share_summary', title: 'Un résumé que j’écris moi-même', detail: 'Quelques mots que vous choisissez — jamais vos réponses détaillées.' },
];

export default function PostpartumSharing() {
  const toast = useToast();
  const hid = useHouseholdId();
  const household = useHousehold();
  const settingsQ = usePostpartumSettings();
  const settings = settingsQ.data;
  const saveSettings = useSaveSettings();
  const mine = useMySharedStatus();
  const update = useUpdateShared();
  const stop = useStopSharing();
  const [value, setValue] = useState<Partial<SharedStatus>>({});

  useEffect(() => {
    if (mine.data) setValue({ rest_need: mine.data.rest_need, availability: mine.data.availability, relay_requested: mine.data.relay_requested, relay_note: mine.data.relay_note, summary: mine.data.summary });
  }, [mine.data?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(key: ShareKey, on: boolean) {
    if (!hid) return toast('Créez ou rejoignez d’abord un foyer.', 'error');
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { [key]: on, share_household_id: hid } as Partial<PostpartumSettings> });
      toast(on ? 'Autorisé. Rien n’est visible tant que vous ne l’avez pas publié.' : 'Arrêté : l’information n’est plus visible.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function publish(next: Partial<SharedStatus>) {
    if (!settings) return;
    try {
      await update.mutateAsync({ settings, exists: !!mine.data, value: next });
      toast('Votre foyer voit maintenant ce que vous avez choisi.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function stopAll() {
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false } });
      await stop.mutateAsync().catch(() => undefined);
      setValue({});
      toast('Plus rien n’est partagé.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (settingsQ.isLoading && !settingsQ.data) return <Screen back title="Ce que je partage"><Skeleton kind="detail" rows={4} /></Screen>;
  const s = settings ?? { share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false };
  const sharing = anySharing(s);

  return (
    <Screen back title="Ce que je partage" subtitle={household ? `Avec le foyer « ${household.name} »` : 'Avec votre foyer'}
      action={sharing ? { label: 'Publier pour mon foyer', icon: 'send', onPress: () => void publish(value), disabled: update.isPending, testID: 'pp-share-publish' } : undefined}>
      <TodaySummary title="Mon partage" items={[
        { icon: sharing ? 'eye' : 'eye-off', value: sharing ? 'Actif' : 'Privé', label: 'État' },
        { icon: 'sliders', value: `${SHARE_OPTIONS.filter((o) => !!s[o.key]).length}/${SHARE_OPTIONS.length}`, label: 'Éléments autorisés' },
        { icon: 'send', value: mine.data ? 'Oui' : '—', label: 'Publié au foyer' },
      ]} />
      <Banner tone="info" icon="lock">
        {'Par défaut, rien n’est partagé. Vos points du jour, vos notes, vos contacts et vos questions restent toujours privés : même un membre du foyer avec tous les droits ne peut pas les voir. Il n’existe aucun accès caché.'}
      </Banner>

      <SectionTitle title="Ce que j’autorise" />
      <Card>
        {SHARE_OPTIONS.map((o) => (
          <Row key={o.key} style={{ alignItems: 'flex-start', paddingVertical: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">{o.title}</Text>
              <Text variant="caption" muted>{o.detail}</Text>
            </View>
            <Toggle label={o.title} value={!!s[o.key]} onChange={(v) => void toggle(o.key, v)} />
          </Row>
        ))}
      </Card>

      {sharing ? (
        <>
          <SectionTitle title="Ce que je publie maintenant" />
          <Card>
            <View style={{ gap: spacing.md }}>
              {s.share_rest_need ? (
                <View style={{ gap: 6 }}>
                  <Text weight="medium">Besoin de repos</Text>
                  <Row wrap>{(Object.keys(REST_LABEL) as (keyof typeof REST_LABEL)[]).map((k) => <Chip key={k} label={REST_LABEL[k]} selected={value.rest_need === k} onPress={() => setValue({ ...value, rest_need: value.rest_need === k ? null : k })} />)}</Row>
                </View>
              ) : null}
              {s.share_availability ? (
                <View style={{ gap: 6 }}>
                  <Text weight="medium">Disponibilité</Text>
                  <Row wrap>{(Object.keys(AVAILABILITY_LABEL) as (keyof typeof AVAILABILITY_LABEL)[]).map((k) => <Chip key={k} label={AVAILABILITY_LABEL[k]} selected={value.availability === k} onPress={() => setValue({ ...value, availability: value.availability === k ? null : k })} />)}</Row>
                </View>
              ) : null}
              {s.share_relay_requests ? (
                <View style={{ gap: 6 }}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <Text weight="medium" style={{ flex: 1 }}>Je demande un relais</Text>
                    <Toggle label="Je demande un relais" value={!!value.relay_requested} onChange={(v) => setValue({ ...value, relay_requested: v })} />
                  </Row>
                  {value.relay_requested ? <Field label="Un petit mot" optional value={value.relay_note ?? ''} onChangeText={(x) => setValue({ ...value, relay_note: x })} maxLength={200} placeholder="Peux-tu prendre la nuit ?" /> : null}
                </View>
              ) : null}
              {s.share_summary ? <Field label="Mon résumé" optional multiline value={value.summary ?? ''} onChangeText={(x) => setValue({ ...value, summary: x })} maxLength={500} hint="Écrit par vous, partagé tel quel." /> : null}
            </View>
          </Card>

          <SectionTitle title="Ce que voit mon foyer" />
          <Card tone="soft">
            {!mine.data ? <Text variant="small" muted>Rien pour l’instant : vous n’avez encore rien publié.</Text> : (
              <>
                {mine.data.rest_need ? <ListRow icon="moon" title={REST_LABEL[mine.data.rest_need]} /> : null}
                {mine.data.availability ? <ListRow icon="clock" title={AVAILABILITY_LABEL[mine.data.availability]} /> : null}
                {mine.data.relay_requested ? <ListRow icon="repeat" title="Demande un relais" subtitle={mine.data.relay_note ?? undefined} /> : null}
                {mine.data.summary ? <ListRow icon="message-circle" title="Son résumé" subtitle={mine.data.summary} /> : null}
                <Text variant="caption" muted style={{ marginTop: 6 }}>Avec des idées concrètes pour vous aider, comme : « {helpIdeas(mine.data)[0]} »</Text>
              </>
            )}
          </Card>
          <Button label="Tout arrêter de partager" variant="ghost" icon="eye-off" onPress={stopAll} loading={stop.isPending} />
        </>
      ) : null}
    </Screen>
  );
}
