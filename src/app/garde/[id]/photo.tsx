/**
 * « Prendre une photo » (nounou) : la caméra s'ouvre seulement à la demande (autorisation demandée à ce moment-là) →
 * aperçu (Reprendre / Conserver) → légende facultative (4 suggestions) → « D'autres enfants apparaissent-ils ? »
 * (oui = partage BLOQUÉ, HOMI ne détecte rien lui-même) → confirmation montrant l'enfant et les destinataires → envoi.
 * Jamais de publication automatique, jamais d'enregistrement dans la photothèque du téléphone de la nounou ; le
 * fichier temporaire est effacé après l'envoi ou l'annulation. Avant l'envoi : JPEG, 1600 px, métadonnées retirées.
 * Web (substitut de test) : la caméra n'existe pas, un fichier est choisi à la place.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { CAPTION_SUGGESTIONS, canSharePhoto } from '@/lib/domain/nounou';
import { useCareChild, useCareMemberNames } from '@/lib/data/hooks-nounou';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';
import { CarePhotoError, enqueueCarePhoto, prepareCarePhoto, sendOutboxItem, type PhotoStep } from '@/lib/nounou/photoUpload';

type Step = 'intro' | 'denied' | 'preview' | 'caption' | 'others' | 'blocked' | 'confirm' | 'sending' | 'queued' | 'done';
const RULE_KEY = 'homi.childcare.photoRuleSeen.v1';

export default function CarePhoto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useUserId();
  const toast = useToast();
  const inv = useInvalidate();
  const { child, role, loading, photosAllowed } = useCareChild(id);
  const names = useCareMemberNames(child?.household_id);
  const [step, setStep] = useState<Step>('intro');
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState<PhotoStep | null>(null);
  const [ruleSeen, setRuleSeen] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uriRef = useRef<string | null>(null);
  uriRef.current = uri;

  useEffect(() => { AsyncStorage.getItem(RULE_KEY).then((v) => setRuleSeen(v === '1')).catch(() => setRuleSeen(false)); }, []);
  // fichier temporaire effacé si l'écran est quitté sans partage
  useEffect(() => () => { void discardLocalImage(uriRef.current); }, []);

  if (loading) return <Screen back title={tr('nn.photo.take')} tool={false}><Skeleton rows={2} /></Screen>;
  if (!child || role !== 'caregiver' || !photosAllowed) {
    return (
      <Screen back title={tr('nn.photo.take')} tool={false}>
        <EmptyState icon="camera-off" title={tr('nn.photo.notAllowedTitle')} body={tr('nn.photo.notAllowedBody')} />
      </Screen>
    );
  }
  const recipients = (names.data ?? []).filter((n) => n.role === 'owner' || n.role === 'coparent').map((n) => n.display_name ?? tr('nn.author.parent'));

  async function discard() {
    const u = uri;
    setUri(null);
    await discardLocalImage(u);
  }
  async function cancel() { await discard(); router.back(); }

  async function capture() {
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    let r: import('expo-image-picker').ImagePickerResult;
    if (Platform.OS === 'web') {
      r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsMultipleSelection: false });
    } else {
      // autorisation demandée AU MOMENT de l'action, jamais avant ; aucun accès permanent
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setCanAskAgain(perm.canAskAgain); setStep('denied'); return; }
      r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsEditing: false });
    }
    if (r.canceled || !r.assets?.[0]) return;
    await discard();
    setUri(r.assets[0].uri);
    setStep('preview');
  }

  async function share() {
    const verdict = canSharePhoto({ photosAllowed, otherChildren: false, confirmed: true });
    if (verdict !== 'ok' || !uri || !child || !me) return;
    setStep('sending');
    setProgress('preparing');
    setError(null);
    let item;
    try {
      const prepared = await prepareCarePhoto(uri);
      setUri(null); // fichier d'origine déjà effacé par la préparation
      item = await enqueueCarePhoto(prepared, { owner: me, householdId: child.household_id, childId: child.id, takenAt: new Date().toISOString(), caption: caption.trim() || null });
    } catch (e) {
      setStep('confirm');
      setError(e instanceof CarePhotoError ? tr(`nn.photo.err.${e.code}`) : tr('nn.photo.err.unreadable'));
      return;
    }
    try {
      await sendOutboxItem(item, setProgress);
      inv('childcare_photos', 'care_day');
      setStep('done');
    } catch (e) {
      const x = e as { isNetwork?: boolean; status?: number };
      if (x?.isNetwork || (x?.status ?? 0) >= 500) { setStep('queued'); return; }
      setStep('queued');
      toast(tr('nn.photo.err.server'), 'error');
    }
  }

  return (
    <Screen back title={tr('nn.photo.take')} subtitle={child.first_name} tool={false}>
      {step === 'intro' ? (
        <>
          {ruleSeen === false ? (
            <Card tone="lavender" testID="care-photo-rule">
              <Text weight="bold">{tr('nn.photo.ruleTitle')}</Text>
              <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.photo.ruleBody')}</Text>
              <Button label={tr('nn.photo.ruleOk')} size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                onPress={() => { setRuleSeen(true); void AsyncStorage.setItem(RULE_KEY, '1').catch(() => undefined); }} testID="care-photo-rule-ok" />
            </Card>
          ) : (
            <Text variant="small" muted>{tr('nn.photo.ruleShort')}</Text>
          )}
          <Text variant="small" muted>{tr('nn.photo.privacy')}</Text>
          <Button label={Platform.OS === 'web' ? tr('nn.photo.pickWeb') : tr('nn.photo.take')} icon="camera" size="lg" full disabled={ruleSeen === false} onPress={capture} testID="care-photo-capture" />
          <Button label={tr('common.cancel')} variant="ghost" full onPress={cancel} />
        </>
      ) : null}

      {step === 'denied' ? (
        <Card testID="care-photo-denied">
          <Text weight="bold">{tr('nn.photo.deniedTitle')}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.photo.deniedBody')}</Text>
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Button label={tr('nn.photo.openSettings')} icon="settings" onPress={() => Linking.openSettings().catch(() => undefined)} testID="care-photo-settings" />
            {canAskAgain ? <Button label={tr('nn.photo.retry')} variant="secondary" onPress={capture} /> : null}
            <Button label={tr('nn.photo.backToJournal')} variant="ghost" onPress={() => router.back()} />
          </View>
        </Card>
      ) : null}

      {uri && ['preview', 'caption', 'others', 'confirm'].includes(step) ? (
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg }} contentFit="cover" accessibilityLabel={tr('nn.photo.previewA11y', { name: child.first_name })} testID="care-photo-preview" />
      ) : null}

      {step === 'preview' ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button label={tr('nn.photo.retake')} icon="rotate-ccw" variant="secondary" style={{ flex: 1 }} onPress={capture} testID="care-photo-retake" />
          <Button label={tr('nn.photo.keep')} icon="check" style={{ flex: 1 }} onPress={() => setStep('caption')} testID="care-photo-keep" />
        </View>
      ) : null}

      {step === 'caption' ? (
        <Card>
          <Field label={tr('nn.photo.caption')} optional value={caption} onChangeText={setCaption} maxLength={300} testID="care-photo-caption" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
            {CAPTION_SUGGESTIONS.map((k, i) => <Chip key={k} label={tr(k)} selected={caption === tr(k)} onPress={() => setCaption(tr(k))} testID={`care-caption-${i}`} />)}
          </View>
          <Button label={tr('common.continue')} full style={{ marginTop: spacing.sm }} onPress={() => setStep('others')} testID="care-photo-caption-next" />
          <Button label={tr('common.cancel')} variant="ghost" full onPress={cancel} />
        </Card>
      ) : null}

      {step === 'others' ? (
        <Card testID="care-photo-others">
          <Text weight="bold">{tr('nn.photo.othersQ')}</Text>
          <Text variant="small" muted style={{ marginTop: 4 }}>{tr('nn.photo.othersHint')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
            <Button label={tr('nn.photo.othersYes')} variant="secondary" style={{ flex: 1 }} onPress={async () => { await discard(); setStep('blocked'); }} testID="care-photo-others-yes" />
            <Button label={tr('nn.photo.othersNo')} style={{ flex: 1 }} onPress={() => setStep('confirm')} testID="care-photo-others-no" />
          </View>
        </Card>
      ) : null}

      {step === 'blocked' ? (
        <Card testID="care-photo-blocked">
          <Text weight="bold">{tr('nn.photo.blockedTitle')}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.photo.blockedBody')}</Text>
          <Button label={tr('nn.photo.retakeAlone')} icon="camera" full style={{ marginTop: spacing.sm }} onPress={capture} testID="care-photo-retake-alone" />
          <Button label={tr('common.cancel')} variant="ghost" full onPress={cancel} />
        </Card>
      ) : null}

      {step === 'confirm' ? (
        <Card testID="care-photo-confirm">
          <Text weight="bold">{tr('nn.photo.confirmTitle')}</Text>
          <Text style={{ marginTop: 4 }}>{tr('nn.photo.confirmChild', { name: child.first_name })}</Text>
          <Text style={{ marginTop: 2 }}>{tr('nn.photo.confirmTo', { names: recipients.join(', ') || tr('nn.author.parent') })}</Text>
          {caption.trim() ? <Text variant="small" muted style={{ marginTop: 2 }}>{tr('nn.photo.confirmCaption', { caption: caption.trim() })}</Text> : null}
          <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('nn.photo.ruleShort')}</Text>
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <Button label={tr('nn.photo.share')} icon="send" full style={{ marginTop: spacing.sm }} onPress={share} testID="care-photo-share" />
          <Button label={tr('nn.photo.cancelShare')} variant="ghost" full onPress={cancel} testID="care-photo-cancel" />
        </Card>
      ) : null}

      {step === 'sending' ? (
        <Card testID="care-photo-sending">
          <Text weight="bold">{tr('nn.photo.sending')}</Text>
          {(['preparing', 'uploading', 'saving'] as const).map((s, i) => {
            const order = ['preparing', 'uploading', 'saving', 'done'];
            const done = progress ? order.indexOf(progress) > i : false;
            const current = progress === s;
            return <Text key={s} variant="small" muted={!current && !done} weight={current ? 'bold' : undefined} style={{ marginTop: 4 }}>{done ? '✓ ' : current ? '… ' : '· '}{tr(`nn.photo.step.${s}`)}</Text>;
          })}
        </Card>
      ) : null}

      {step === 'queued' ? (
        <Card testID="care-photo-queued">
          <Text weight="bold">{tr('nn.photo.queuedTitle')}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.photo.queuedBody')}</Text>
          <Button label={tr('nn.photo.backToJournal')} full style={{ marginTop: spacing.sm }} onPress={() => router.back()} />
        </Card>
      ) : null}

      {step === 'done' ? (
        <Card testID="care-photo-done">
          <Text weight="bold">{tr('nn.photo.doneTitle')}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.photo.doneBody')}</Text>
          <Button label={tr('nn.photo.backToJournal')} full style={{ marginTop: spacing.sm }} onPress={() => router.back()} testID="care-photo-back" />
        </Card>
      ) : null}
    </Screen>
  );
}
